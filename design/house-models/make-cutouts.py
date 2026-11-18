"""Turn the supplied house renders (checkerboard painted into the pixels, no real alpha) into
transparent WebP cut-outs for public/assets/img/models/.

    pip install numpy pillow scipy opencv-python-headless
    python3 design/house-models/make-cutouts.py

The checkerboard is white and one light grey in squares of about 8-11 px. A pixel counts as
"checkerboard" when it is light and neutral AND its neighbourhood holds both checker tones, which a
plain white wall never does. That core is grown a few pixels to reach the house edge, then GrabCut
settles the edge itself.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = Path(__file__).parent
SRC = HERE / "source"
OUT = HERE.parent.parent / "public" / "assets" / "img" / "models"


def checker_masks(rgb):
    a = rgb.astype(np.int16)
    gray = a.mean(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    corner = gray[:60, :60]
    grey_tone = float(np.median(corner[corner < 240]))
    neutral = sat < 16
    white = neutral & (gray >= 243)
    grey = neutral & (np.abs(gray - grey_tone) <= 14)
    k = 11
    wf = ndi.uniform_filter(white.astype(np.float32), k)
    gf = ndi.uniform_filter(grey.astype(np.float32), k)
    core = (wf > 0.15) & (gf > 0.15) & (wf + gf > 0.9)
    light = neutral & (gray >= grey_tone - 22)
    return core, light


# Open carports show the checkerboard through the house. Where it is too small or too broken for
# the automatic pass, these boxes (x0, y0, x1, y1 on the finished cut-out) are painted as shade.
PATCHES = {
    "cartland-54": [(78, 179, 125, 218)],
    "charles-150": [(140, 244, 181, 281)],
}


def patch(im, boxes):
    arr = np.asarray(im).copy()
    for x0, y0, x1, y1 in boxes:
        box = np.zeros(arr.shape[:2], bool)
        box[y0:y1, x0:x1] = True
        ring = ndi.binary_dilation(box, iterations=6) & ~box & (arr[..., 3] > 200)
        shade = (np.median(arr[ring][:, :3], axis=0) * 0.5).astype(np.uint8)
        soft = cv2.GaussianBlur(box.astype(np.float32), (0, 0), 1.5)[..., None]
        arr[..., :3] = (arr[..., :3] * (1 - soft) + shade * soft).astype(np.uint8)
        arr[..., 3] = np.maximum(arr[..., 3], (soft[..., 0] * 255).astype(np.uint8))
    return Image.fromarray(arr, "RGBA")


def cut(path, out_path=None, crop=None):
    img = Image.open(path).convert("RGB")
    if crop:
        img = img.crop(crop)
    rgb = np.asarray(img)
    core, light = checker_masks(rgb)

    # Grow the checker core a few pixels through light neutral pixels to reach the house edge.
    bg = core.copy()
    for _ in range(7):
        bg = ndi.binary_dilation(bg, iterations=1) & (light | core)
    bg = ndi.binary_opening(bg, iterations=1) | core

    # GrabCut: the checker is definitely background; strong colour or dark is definitely house.
    gray = rgb.astype(np.int16).mean(axis=2)
    sat = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)
    sure_fg = ndi.binary_erosion((sat > 45) | (gray < 140), iterations=2)
    mask = np.full(rgb.shape[:2], cv2.GC_PR_FGD, np.uint8)
    mask[bg] = cv2.GC_PR_BGD
    mask[ndi.binary_erosion(core, iterations=2)] = cv2.GC_BGD
    mask[sure_fg] = cv2.GC_FGD
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), mask, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    fg = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)

    # Keep the largest pieces, fill pin-holes, soften the edge by one pixel.
    lab, n = ndi.label(fg)
    if n:
        sizes = ndi.sum(fg, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 0.01 * fg.sum()])
        fg = keep
    fg = ndi.binary_fill_holes(fg)

    # Checkerboard seen through an open carport (or between walls) is still checkerboard: clear any
    # pocket of it that is big enough to be more than a window frame, so it shows the page behind.
    gray16 = rgb.astype(np.int16).mean(axis=2)
    sat16 = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)
    corner = gray16[:60, :60]
    tone = float(np.median(corner[corner < 240]))
    wf = ndi.uniform_filter(((sat16 < 16) & (gray16 >= 243)).astype(np.float32), 7)
    gf = ndi.uniform_filter(((sat16 < 16) & (np.abs(gray16 - tone) <= 14)).astype(np.float32), 7)
    pocket = (wf > 0.2) & (gf > 0.2) & (wf + gf > 0.85)
    plab, pn = ndi.label(pocket)
    if pn:
        psizes = ndi.sum(pocket, plab, range(1, pn + 1))
        big = np.isin(plab, [i + 1 for i, sz in enumerate(psizes) if sz >= 25])
        pocket_px = ndi.binary_dilation(big, iterations=4)
        # Paint the pocket with the dark warm tone around it, so a carport reads as a shaded interior.
        ring = ndi.binary_dilation(pocket_px, iterations=5) & ~pocket_px & fg
        if ring.any():
            tone_rgb = np.median(rgb[ring], axis=0) * 0.55
            rgb = rgb.copy()
            rgb[pocket_px] = tone_rgb.astype(np.uint8)
            rgb = cv2.GaussianBlur(rgb, (0, 0), 1.2) * 0 + np.where(pocket_px[..., None], cv2.GaussianBlur(rgb, (0, 0), 1.2), rgb)
    alpha = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 0.8)
    alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)

    rgba = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
    im = Image.fromarray(rgba, "RGBA")
    box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        im = im.crop(box)
    if out_path and out_path.stem in PATCHES:
        im = patch(im, PATCHES[out_path.stem])
    if out_path:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        im.save(out_path, "WEBP", quality=88, method=6)
    return im


if __name__ == "__main__":
    cut(SRC / "calista.png", OUT / "calista.webp")
    cut(SRC / "amani.webp", OUT / "amani.webp")
    cut(SRC / "alora.webp", OUT / "alora.webp")
    cut(SRC / "aurora.webp", OUT / "aurora.webp")
    # One picture holds three houses; the gaps between them are plain checkerboard.
    three = Image.open(SRC / "unna-brenna-dua.webp").size
    w, h = three
    for name, box in {"unna": (0, 0, 358, h), "brenna": (358, 0, 720, h), "dua": (720, 0, w, h)}.items():
        cut(SRC / "unna-brenna-dua.webp", OUT / f"{name}.webp", crop=box)
    # Premium: two more pictures with several houses each.
    for src, parts in {
        "cartland-charles-christie.webp": {"cartland-54": (0, 366), "charles-70": (366, 666), "christie-90": (666, None)},
        "charles150-corin.webp": {"charles-150": (0, 524), "corin-120": (524, None)},
    }.items():
        w, h = Image.open(SRC / src).size
        for name, (x0, x1) in parts.items():
            cut(SRC / src, OUT / f"{name}.webp", crop=(x0, 0, x1 or w, h))
    print("done:", sorted(p.name for p in OUT.glob("*.webp")))
