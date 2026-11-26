"""Tile still frames into one contact sheet: contact.py out.jpg a.jpg b.jpg ..."""
import sys
from PIL import Image, ImageDraw
files = sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size
cols = 2 if len(ims) > 1 else 1
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols - 1) * 6, rows * h + (rows - 1) * 6), (128, 128, 128))
d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * (w + 6), (i // cols) * (h + 6)
    sheet.paste(im, (x, y))
    d.text((x + 8, y + 6), f.split('/')[-1], fill=(255, 255, 0))
sheet.save(sys.argv[1], quality=88)
