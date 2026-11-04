"""Make a contact sheet of the check frames of one clip: python montage.py <name> [cols]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

name = sys.argv[1]
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 3
d = Path(__file__).resolve().parent / "_media" / "check" / name
frames = sorted(p for p in d.glob("f*.png"))
thumbs = []
for p in frames:
    im = Image.open(p).convert("RGB")
    im = im.resize((640, 360), Image.LANCZOS)
    dr = ImageDraw.Draw(im)
    dr.rectangle([0, 0, 110, 22], fill=(0, 0, 0))
    dr.text((5, 4), p.stem.split("_", 1)[1], fill=(255, 255, 0))
    thumbs.append(im)
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * 644, rows * 364), (60, 60, 60))
for k, im in enumerate(thumbs):
    r, c = divmod(k, cols)
    sheet.paste(im, (c * 644 + 2, r * 364 + 2))
out = d / "sheet.png"
sheet.save(out)
print(out)
