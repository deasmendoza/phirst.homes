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
    alpha = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 0.8)
    alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)

    rgba = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
    im = Image.fromarray(rgba, "RGBA")
    box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        im = im.crop(box)
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
    print("done:", sorted(p.name for p in OUT.glob("*.webp")))
