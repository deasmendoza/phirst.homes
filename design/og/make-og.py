"""Make public/og-image.jpg (the picture shown when the site is shared) from design/og/source.webp.

    pip install numpy pillow opencv-python-headless
    python3 design/og/make-og.py

The source picture has the PH logo at the top and a bar with the e-mail, website and phone number
at the bottom. Both are removed:
  * the logo: the clean sky beside it is copied across, and the dark hills behind its lower half
    are rebuilt row by row from the colour at the left and right of it;
  * the bar: its white and gold lettering and icons are mended from what is around them.
The result is fitted to 1200 x 630, the size social sites use: the whole picture at full width, with
a thin soft band at the top and bottom.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "public" / "og-image.jpg"
CX, CY, R = 905, 115, 136  # the logo badge: centre and radius with its glow


FONT = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"


def fix_corin_label(rgb):
    """The picture says "Conn 120" on the label of the Corin house: letter it again as "Corin 120"."""
    x0, y0, x1, y1 = 1522, 217, 1606, 244  # the text area inside the label
    out = rgb.copy().astype(np.float32)
    fill = np.median(out[240:244, 1530:1600].reshape(-1, 3), axis=0)  # the label's dark fill, below the text
    out[y0:y1, x0:x1] = fill
    k, cap = 6, 14.5
    font = ImageFont.truetype(FONT, int(cap / 0.727 * k))
    text = "Corin 120"
    l, t, r, b = font.getbbox(text)
    layer = Image.new("L", (r + 4 * k, int(cap * 2.4 * k)), 0)
    ImageDraw.Draw(layer).text((2 * k, int(cap * 0.7 * k) - t), text, font=font, fill=255)
    layer = layer.crop(layer.getbbox())
    layer = layer.resize((79, max(1, round(layer.height / k))), Image.LANCZOS)
    a = np.asarray(layer).astype(np.float32)[..., None] / 255.0
    left, base = 1525, 236
    ys, xs = base - layer.height, left
    region = out[ys : ys + layer.height, xs : xs + layer.width]
    out[ys : ys + layer.height, xs : xs + layer.width] = region * (1 - a) + np.array([240, 240, 240], np.float32) * a
    return np.clip(out, 0, 255).astype(np.uint8)


def clean(rgb):
    im = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    h, w = im.shape[:2]
    f = im.astype(np.float32)
    disc = np.zeros((h, w), np.uint8)
    cv2.circle(disc, (CX, CY), R, 255, -1)
    dsoft = cv2.GaussianBlur(disc, (0, 0), 6).astype(np.float32) / 255.0

    src = np.roll(f, 260, axis=1)  # pixel x takes the colour of x - 260: clean sky left of the logo
    patched = f * (1 - dsoft[..., None]) + src * dsoft[..., None]

    x0, x1 = CX - R - 18, CX + R + 18
    low = patched.copy()
    for y in range(120, CY + R + 6):
        left = np.median(f[y - 9 : y + 10, x0 - 30 : x0].reshape(-1, 3), axis=0)
        right = np.median(f[y - 9 : y + 10, x1 : x1 + 30].reshape(-1, 3), axis=0)
        xs = np.arange(CX - R - 2, CX + R + 3)
        t = ((xs - xs[0]) / (xs[-1] - xs[0]))[:, None]
        low[y, xs] = left * (1 - t) + right * t
    rng = np.random.default_rng(7)
    n = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 1.6)
    low = low + (n / n.std())[..., None] * np.array([9, 11, 6], np.float32)
    ramp = np.clip((np.arange(h) - 132) / 28.0, 0, 1)[:, None] * dsoft
    out = np.clip(patched * (1 - ramp[..., None]) + low * ramp[..., None], 0, 255).astype(np.uint8)

    b, g, r = [im[..., i].astype(int) for i in range(3)]
    ink = ((r > 190) & (g > 190) & (b > 190)) | ((r > 190) & (g > 140) & (b < 130))
    bar = np.zeros((h, w), bool)
    bar[768:850, :] = True
    mask = cv2.dilate(((ink & bar) * 255).astype(np.uint8), np.ones((9, 9), np.uint8))
    mask[:768] = 0
    mask[850:] = 0
    out = cv2.inpaint(out, mask, 9, cv2.INPAINT_TELEA)
    return out


def fit(im, W=1200, H=630):
    h, w = im.shape[:2]
    nh = round(h * W / w)
    small = cv2.resize(im, (W, nh), interpolation=cv2.INTER_AREA)
    pad = (H - nh) // 2
    canvas = cv2.copyMakeBorder(small, pad, H - nh - pad, 0, 0, cv2.BORDER_REFLECT)
    blur = cv2.GaussianBlur(canvas, (0, 0), 14)
    band = np.zeros((H, 1), np.float32)
    for y in range(H):
        d = min(abs(y - pad), abs(y - (pad + nh)))
        band[y] = max(0.0, (10 - d) / 10.0) if pad <= y < pad + nh else 1.0
    return (canvas * (1 - band[..., None]) + blur * band[..., None] * 0.85).astype(np.uint8)


if __name__ == "__main__":
    rgb = fix_corin_label(np.asarray(Image.open(HERE / "source.webp").convert("RGB")))
    cv2.imwrite(str(OUT), fit(clean(rgb)), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print("wrote", OUT)
