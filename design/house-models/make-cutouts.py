"""Turn the supplied house renders into transparent WebP cut-outs for public/assets/img/models/.

    pip install numpy pillow scipy opencv-python-headless
    python3 design/house-models/make-cutouts.py

Two kinds of source picture are handled:

* A picture with real transparency is only cropped and trimmed. Nothing is repainted.
* A picture with a checkerboard painted into the pixels (what a flattened screenshot or JPEG
  gives) has the checkerboard removed. The squares are white and one light grey; their size is
  measured from the top of each picture, so 1024 px and 2000 px sources both work. A pixel counts
  as "checkerboard" when it is light and neutral AND its neighbourhood holds both checker tones,
  which a plain white wall never does. That core is grown a few pixels to reach the house edge,
  then GrabCut settles the edge itself.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = Path(__file__).parent
SRC = HERE / "source"
OUT = HERE.parent.parent / "public" / "assets" / "img" / "models"
MAX_WIDTH = 1400  # the page never shows a house wider than this, even on a 2x screen


def odd(n):
    n = max(3, int(round(n)))
    return n if n % 2 else n + 1


def checker_cell(gray):
    """Size in px of one checker square, from the autocorrelation of a row near the top."""
    h, w = gray.shape
    best = None
    for y in (4, 7, 10, 13):
        row = gray[min(y, h - 1), : min(w, 700)].astype(np.float32)
        row = row - row.mean()
        n = len(row)
        ac = np.correlate(row, row, mode="full")[n - 1 :]
        ac = ac / (ac[0] + 1e-6)
        # first clear peak after the first dip = the full period (two squares)
        dip = next((i for i in range(2, 120) if ac[i] < 0.1), None)
        if dip is None:
            continue
        peak = dip + int(np.argmax(ac[dip : dip + 160]))
        if ac[peak] > 0.3:
            best = peak if best is None else min(best, peak)
    return max(4.0, (best or 20) / 2.0)


def checker_masks(rgb, cell):
    a = rgb.astype(np.int16)
    gray = a.mean(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    c = int(max(60, cell * 6))
    corner = gray[:c, :c]
    grey_tone = float(np.median(corner[corner < 240]))
    neutral = sat < 18
    white = neutral & (gray >= 243)
    grey = neutral & (np.abs(gray - grey_tone) <= 16)
    k = odd(cell * 1.1)
    wf = ndi.uniform_filter(white.astype(np.float32), k)
    gf = ndi.uniform_filter(grey.astype(np.float32), k)
    core = (wf > 0.15) & (gf > 0.15) & (wf + gf > 0.9)
    # "light" is what the edge may grow through: only pixels that are as flat and neutral as the
    # checker itself (pure white, or exactly the grey tone). A cream or lit white wall is not.
    light = (sat <= 5) & ((gray >= 250) | (np.abs(gray - grey_tone) <= 9))
    return core, light, grey_tone


def has_alpha(img):
    """True when the picture already carries real transparency (not a checkerboard painted in)."""
    if img.mode not in ("RGBA", "LA", "PA") and "transparency" not in img.info:
        return False
    lo, _ = img.convert("RGBA").getchannel("A").getextrema()
    return lo < 250


def finish(im):
    box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        im = im.crop(box)
    if im.width > MAX_WIDTH:
        im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
    return im


def save(im, out_path):
    if out_path:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        im.save(out_path, "WEBP", quality=88, method=6)
    return im


# Open carports show the checkerboard through the house. Where the automatic pass misses a pocket,
# these boxes (fractions x0, y0, x1, y1 of the finished cut-out) are painted as shade.
PATCHES = {}


def patch(im, boxes):
    arr = np.asarray(im).copy()
    h, w = arr.shape[:2]
    for fx0, fy0, fx1, fy1 in boxes:
        x0, y0, x1, y1 = int(fx0 * w), int(fy0 * h), int(fx1 * w), int(fy1 * h)
        box = np.zeros(arr.shape[:2], bool)
        box[y0:y1, x0:x1] = True
        ring = ndi.binary_dilation(box, iterations=max(3, w // 60)) & ~box & (arr[..., 3] > 200)
        shade = (np.median(arr[ring][:, :3], axis=0) * 0.5).astype(np.uint8)
        soft = cv2.GaussianBlur(box.astype(np.float32), (0, 0), max(1.5, w / 250))[..., None]
        arr[..., :3] = (arr[..., :3] * (1 - soft) + shade * soft).astype(np.uint8)
        arr[..., 3] = np.maximum(arr[..., 3], (soft[..., 0] * 255).astype(np.uint8))
    return Image.fromarray(arr, "RGBA")


def cut(path, out_path=None, crop=None):
    src = Image.open(path)
    if has_alpha(src):
        # Real transparency: only crop and trim. Nothing is cut out or repainted.
        rgba = src.convert("RGBA")
        return save(finish(rgba.crop(crop) if crop else rgba), out_path)

    full = np.asarray(src.convert("RGB"))
    cell = checker_cell(full.astype(np.int16).mean(axis=2))
    s = cell / 10.0  # the first pictures had squares of about 10 px; every size is scaled from that
    img = src.convert("RGB")
    if crop:
        img = img.crop(crop)
    rgb = np.asarray(img)
    core, light, tone = checker_masks(rgb, cell)

    # Grow the checker core a few pixels through light neutral pixels to reach the house edge.
    bg = core.copy()
    for _ in range(max(3, int(round(cell * 0.6 + 4)))):
        bg = ndi.binary_dilation(bg, iterations=1) & (light | core)
    bg = ndi.binary_opening(bg, iterations=1) | core

    # GrabCut: the checker is definitely background; strong colour or dark is definitely house.
    gray = rgb.astype(np.int16).mean(axis=2)
    sat = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)
    sure_fg = ndi.binary_erosion((sat > 45) | (gray < 140), iterations=max(1, int(round(2 * s))))
    mask = np.full(rgb.shape[:2], cv2.GC_PR_FGD, np.uint8)
    mask[bg] = cv2.GC_PR_BGD
    mask[ndi.binary_erosion(core, iterations=max(1, int(round(2 * s))))] = cv2.GC_BGD
    mask[sure_fg] = cv2.GC_FGD
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), mask, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    fg = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)

    # Keep the largest pieces and fill pin-holes.
    lab, n = ndi.label(fg)
    if n:
        sizes = ndi.sum(fg, lab, range(1, n + 1))
        fg = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz > 0.01 * fg.sum()])
    fg = ndi.binary_fill_holes(fg)

    # Checkerboard seen through an open carport (or between walls) is still checkerboard: paint any
    # pocket of it bigger than a window frame with the dark tone around it, so it reads as shade.
    gray16 = rgb.astype(np.int16).mean(axis=2)
    sat16 = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)
    k7 = odd(cell * 0.7)
    wf = ndi.uniform_filter(((sat16 < 18) & (gray16 >= 243)).astype(np.float32), k7)
    gf = ndi.uniform_filter(((sat16 < 18) & (np.abs(gray16 - tone) <= 16)).astype(np.float32), k7)
    pocket = (wf > 0.2) & (gf > 0.2) & (wf + gf > 0.85)
    plab, pn = ndi.label(pocket)
    if pn:
        psizes = ndi.sum(pocket, plab, range(1, pn + 1))
        big = np.isin(plab, [i + 1 for i, sz in enumerate(psizes) if sz >= 25 * s * s])
        pocket_px = ndi.binary_dilation(big, iterations=max(2, int(round(4 * s))))
        ring = ndi.binary_dilation(pocket_px, iterations=max(2, int(round(5 * s)))) & ~pocket_px & fg
        if ring.any():
            shade = (np.median(rgb[ring], axis=0) * 0.33).astype(np.uint8)
            soft = cv2.GaussianBlur(pocket_px.astype(np.float32), (0, 0), 1.2 * s)[..., None]
            rgb = (rgb * (1 - soft) + shade * soft).astype(np.uint8)

    alpha = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 0.8 * max(1.0, s))
    alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)
    im = finish(Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), "RGBA"))
    if out_path and out_path.stem in PATCHES:
        im = patch(im, PATCHES[out_path.stem])
    return save(im, out_path)


# output name -> (source file, crop box in the source's pixels or None)
JOBS = {
    # 2000 px pictures
    "charles-150": ("charles150-corin.jpg", (0, 0, 1072, 846)),
    "corin-120": ("charles150-corin.jpg", (1072, 0, 2000, 846)),
    "cartland-54": ("cartland-charles-christie.jpg", (0, 0, 715, 827)),
    "charles-70": ("cartland-charles-christie.jpg", (715, 0, 1312, 827)),
    "christie-90": ("cartland-charles-christie.jpg", (1312, 0, 2000, 827)),
    "unna": ("unna-brenna-dua.jpg", (0, 0, 718, 795)),
    "brenna": ("unna-brenna-dua.jpg", (718, 0, 1395, 795)),
    "dua": ("unna-brenna-dua.jpg", (1395, 0, 2000, 795)),
    "aurora": ("aurora.jpg", None),
    "alora": ("alora.jpg", None),
    # first, smaller pictures (replace with 2000 px ones when available)
    "calista": ("calista.png", None),
    "amani": ("amani.webp", None),
}

if __name__ == "__main__":
    for name, (file, crop) in JOBS.items():
        cut(SRC / file, OUT / f"{name}.webp", crop=crop)
    print("done:", sorted(p.name for p in OUT.glob("*.webp")))
