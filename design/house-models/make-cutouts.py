"""Turn the supplied house pictures into transparent WebP cut-outs for public/assets/img/models/.

    pip install numpy pillow scipy
    python3 design/house-models/make-cutouts.py

The pictures in `source/` come from Canva's background remover, exported as PNG with the
background left white (pure white, 255). Two kinds of source are handled:

* A picture with real transparency is only cropped and trimmed.
* A picture on a flat white background has the white that touches the picture's edge turned into
  transparency (white walls inside the house are not touched, because they are not connected to
  the edge), the one-pixel rim of half-white pixels is replaced by the colour just inside it so no
  white halo shows on a dark page, and a large pocket of pure white seen through the house (an open
  carport) is made transparent too.

Pictures with several houses are split at the clear gaps between them.

Do NOT use a screenshot, a JPEG, or a picture with a checkerboard painted in: those carry no
transparency and cannot be cut cleanly.
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = Path(__file__).parent
SRC = HERE / "source"
OUT = HERE.parent.parent / "public" / "assets" / "img" / "models"
MAX_WIDTH = 1400  # the page never shows a house wider than this, even on a 2x screen
WHITE_TOL = 253  # a pixel is "white" when its darkest channel is at least this


def has_alpha(img):
    if img.mode not in ("RGBA", "LA", "PA") and "transparency" not in img.info:
        return False
    lo, _ = img.convert("RGBA").getchannel("A").getextrema()
    return lo < 250


def to_rgba(img):
    """RGBA copy of a picture, with transparency made from its white background if it has none."""
    if has_alpha(img):
        return img.convert("RGBA")

    rgb = np.asarray(img.convert("RGB")).copy()
    white = rgb.min(axis=2) >= WHITE_TOL
    lab, _ = ndi.label(white)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0])

    # Pure white seen through the house (an open carport, a gap between railings) is background too.
    exact = rgb.min(axis=2) == 255
    lab2, n2 = ndi.label(exact & ~bg)
    if n2:
        sizes = ndi.sum(exact & ~bg, lab2, range(1, n2 + 1))
        bg |= np.isin(lab2, [i + 1 for i, sz in enumerate(sizes) if sz >= 600])

    # Anti-aliased rim: drop one pixel, soften the next, and take the colour from just inside.
    solid = ndi.binary_erosion(~bg, iterations=1)
    alpha = ndi.gaussian_filter(solid.astype(np.float32), 0.7)
    alpha = np.clip((alpha - 0.1) / 0.8, 0, 1)
    interior = ndi.binary_erosion(~bg, iterations=3)
    _, idx = ndi.distance_transform_edt(~interior, return_indices=True)
    rim = (alpha < 0.999) | ~interior
    rim &= ~bg
    out = rgb.copy()
    out[rim] = rgb[idx[0][rim], idx[1][rim]]
    return Image.fromarray(np.dstack([out, (alpha * 255).astype(np.uint8)]), "RGBA")


def trim(im):
    box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        im = im.crop(box)
    if im.width > MAX_WIDTH:
        im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
    return im


def split_points(im, count):
    """x positions that separate `count` houses side by side: the middle of the widest clear gaps
    in the upper part of the picture (the fences and ground strip below may run into each other)."""
    a = np.asarray(im.getchannel("A")).astype(np.float32)
    top = a[: int(a.shape[0] * 0.62)]
    empty = top.sum(axis=0) < 255 * 2
    gaps, x = [], 0
    while x < len(empty):
        if empty[x]:
            y = x
            while y < len(empty) and empty[y]:
                y += 1
            if x > 0 and y < len(empty):  # ignore the empty margins on either side
                gaps.append((y - x, (x + y) // 2))
            x = y
        else:
            x += 1
    best = sorted(gaps, reverse=True)[: count - 1]
    # Fences and the ground strip can run past the middle of the gap, so slide each cut to the
    # emptiest column nearby, looking at the middle and lower part of the picture.
    mid = a[int(a.shape[0] * 0.3) : int(a.shape[0] * 0.97)].sum(axis=0)
    cuts = []
    for width, centre in sorted(best, key=lambda g: g[1]):
        r = max(40, width // 2 + 60)
        lo, hi = max(0, centre - r), min(len(mid), centre + r)
        cuts.append(lo + int(np.argmin(mid[lo:hi])))
    return cuts


def drop_edge_slivers(im):
    """Remove a thin piece of the neighbouring house left at either edge of a crop: a narrow blob,
    separated from the house by a clear gap, in the middle and lower part of the picture."""
    a = np.asarray(im.getchannel("A")).astype(np.float32)
    w = a.shape[1]
    band = a[int(a.shape[0] * 0.3) : int(a.shape[0] * 0.9)]
    used = band.sum(axis=0) > 255 * 2
    runs, x = [], 0
    while x < w:
        if used[x]:
            y = x
            while y < w and used[y]:
                y += 1
            runs.append((x, y))
            x = y
        else:
            x += 1
    if len(runs) < 2:
        return im
    x0, x1 = 0, w
    if runs[0][1] - runs[0][0] < 0.14 * w and runs[1][0] - runs[0][1] >= 3:
        x0 = runs[0][1]
    if runs[-1][1] - runs[-1][0] < 0.14 * w and runs[-1][0] - runs[-2][1] >= 3:
        x1 = runs[-1][0]
    return im.crop((x0, 0, x1, im.height)) if (x0, x1) != (0, w) else im


# Fence of the neighbouring house that touches the house and cannot be told apart by a gap:
# fraction of the width to drop from the (left, right) edge.
TRIM = {"corin-120": (0.085, 0.0), "charles-70": (0.045, 0.0), "charles-150": (0.0, 0.015)}


def trim_edges(im, name):
    left, right = TRIM.get(name, (0.0, 0.0))
    if not (left or right):
        return im
    return im.crop((int(im.width * left), 0, int(im.width * (1 - right)), im.height))


# source file -> output names, left to right
SOURCES = {
    "calista.png": ["calista"],
    "amani.png": ["amani"],
    "alora.png": ["alora"],
    "aurora.png": ["aurora"],
    "unna-brenna-dua.png": ["unna", "brenna", "dua"],
    "cartland-charles-christie.png": ["cartland-54", "charles-70", "christie-90"],
    "charles150-corin.png": ["charles-150", "corin-120"],
}


def save(im, name):
    OUT.mkdir(parents=True, exist_ok=True)
    im.save(OUT / f"{name}.webp", "WEBP", quality=90, method=6)


if __name__ == "__main__":
    for file, names in SOURCES.items():
        rgba = to_rgba(Image.open(SRC / file))
        cuts = [0, *split_points(rgba, len(names)), rgba.width]
        assert len(cuts) == len(names) + 1, f"{file}: found {len(cuts) - 2} gaps for {len(names)} houses"
        for name, x0, x1 in zip(names, cuts, cuts[1:]):
            save(trim(trim_edges(drop_edge_slivers(rgba.crop((x0, 0, x1, rgba.height))), name)), name)
    print("done:", sorted(p.name for p in OUT.glob("*.webp")))
