"""Turn the owner's photo folders into the web pictures of the House Models gallery.

    pip install pillow
    python3 design/house-models/make-photos.py <folder> [<folder> ...]

Every <folder> holds one folder per house, and each house has `exterior`, `interior` and
`floor plan` subfolders of JPEG pictures (this is how the owner's zips are laid out; the zips
"editions", "park" and "sights" each unpack to one such folder). For each picture this writes
into public/assets/img/models/photos/<house>/:

    exterior-01.webp   large, for the viewer and the zoom (at most 1400 px wide; floor plans 1800)
    exterior-01-t.webp small, for the thumbnails (360 px wide)

and writes lib/house-photos.ts, the list of how many pictures each house has. The originals are
NOT kept in the repository (they are tens of megabytes): keep the zips.
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "public" / "assets" / "img" / "models" / "photos"
LIB = HERE.parent.parent / "lib" / "house-photos.ts"

# folder name in the zips -> house id used on the site
HOUSE = {
    "cartland": "cartland-54",
    "charles 70": "charles-70",
    "christie": "christie-90",
    "corin": "corin-120",
    "charles 150": "charles-150",
}
TABS = {"exterior": "exterior", "interior": "interior", "floor plan": "floorplan"}
LARGE = {"exterior": (1400, 74), "interior": (1400, 74), "floorplan": (1800, 82)}
THUMB = (360, 70)


def natural(name):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def save(im, path, width, quality):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=quality, method=6)


def main(folders):
    counts = {}
    for root in map(Path, folders):
        for house_dir in sorted(p for p in root.iterdir() if p.is_dir()):
            house = HOUSE.get(house_dir.name.lower(), house_dir.name.lower().replace(" ", "-"))
            for tab_dir_name, tab in TABS.items():
                tab_dir = house_dir / tab_dir_name
                files = sorted((p for p in tab_dir.glob("*") if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")), key=lambda p: natural(p.name)) if tab_dir.is_dir() else []
                for i, f in enumerate(files, 1):
                    im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
                    save(im, OUT / house / f"{tab}-{i:02d}.webp", *LARGE[tab])
                    save(im, OUT / house / f"{tab}-{i:02d}-t.webp", *THUMB)
                counts.setdefault(house, {})[tab] = len(files)
    lines = [
        "// Written by design/house-models/make-photos.py: how many pictures each house has per group.",
        "// The pictures are /assets/img/models/photos/<house>/<group>-NN.webp (and NN-t.webp for the thumbnail).",
        "export const PHOTO_COUNTS: { [house: string]: { exterior: number; interior: number; floorplan: number } } = {",
    ]
    for house in sorted(counts):
        c = counts[house]
        lines.append(f"  '{house}': {{ exterior: {c.get('exterior', 0)}, interior: {c.get('interior', 0)}, floorplan: {c.get('floorplan', 0)} }},")
    lines.append("};")
    LIB.write_text("\n".join(lines) + "\n")
    print(counts)


if __name__ == "__main__":
    main(sys.argv[1:])
