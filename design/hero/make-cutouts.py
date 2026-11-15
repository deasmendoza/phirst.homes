"""Cut the house out of each hero render, leaving only the architecture, the fence and
the bushes directly in front of it (no sky, moon, side trees, street lamps or menu).

    pip install rembg onnxruntime pillow numpy
    python3 design/hero/make-cutouts.py 1      # one model at a time (the matting model is memory-hungry)

Reads  design/hero/src/model-N.webp
Writes public/assets/img/hero/house-N.webp (same canvas size, transparent around the house)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'design/hero/src'
OUT = ROOT / 'public/assets/img/hero'
SKY = 0.2  # nothing above this fraction of the height belongs to a house (menu, moon)

session = new_session('birefnet-general')
for n in sys.argv[1:] or '123456':
    im = Image.open(SRC / f'model-{n}.webp').convert('RGB')
    alpha = np.asarray(remove(im, session=session, only_mask=True).convert('L')).copy()
    alpha[: int(im.height * SKY)] = 0
    alpha[alpha < 8] = 0
    out = im.convert('RGBA')
    out.putalpha(Image.fromarray(alpha))
    out.save(OUT / f'house-{n}.webp', quality=90, alpha_quality=100, method=6)
    print(f'house-{n}.webp', out.size)
