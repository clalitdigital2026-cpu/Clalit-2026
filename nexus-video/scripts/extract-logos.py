"""Extract transparent logo layers from the supplied brand images (unmix white background)."""
import sys
import numpy as np
from PIL import Image

NEXUS = sys.argv[1]
CLALIT = sys.argv[2]
OUT = 'public/logos/'

def unmix(rgb):
    rgb = rgb.astype(np.float64)
    a = np.max((255.0 - rgb) / 255.0, axis=2)
    a = np.clip((a - 0.03) / 0.97, 0, 1)  # kill jpeg noise near white
    safe = np.maximum(a, 1e-4)[..., None]
    col = (rgb - (1 - safe) * 255.0) / safe
    col = np.clip(col, 0, 255)
    return np.dstack([col, a * 255]).astype(np.uint8)

BOXES = {}

def save(arr, name, pad=8, origin=(0, 0)):
    a = arr[..., 3]
    ys, xs = np.where(a > 8)
    y0, y1, x0, x1 = max(ys.min() - pad, 0), ys.max() + pad, max(xs.min() - pad, 0), xs.max() + pad
    Image.fromarray(arr[y0:y1 + 1, x0:x1 + 1]).save(OUT + name)
    print(name, x1 - x0, y1 - y0)
    BOXES[name] = [int(x0 + origin[0]), int(y0 + origin[1]), int(x1 + origin[0]), int(y1 + origin[1])]

img = np.array(Image.open(NEXUS).convert('RGB'))
rgba = unmix(img)
split = 813  # last row of the "כללית" glyphs (measured)
save(rgba[280:690], 'nexus-symbol.png', origin=(0, 280))
save(rgba[720:split], 'nexus-clalit-word.png', origin=(0, 720))
word = rgba[split:990].copy()
# the green tails of "כללית" reach the first rows of the "Nexus" band – remove them
top = word[:8]
green = (top[..., 1].astype(int) > top[..., 2].astype(int) + 20)
top[green, 3] = 0
top[top[..., 3] < 90, 3] = 0
save(word, 'nexus-wordmark.png', origin=(0, split))
save(rgba[280:1075], 'nexus-lockup.png', pad=20, origin=(0, 280))

c = Image.open(CLALIT).convert('RGBA')
c = np.array(c)
bg_white = c[..., 3].mean() > 250
if bg_white:
    c = unmix(c[..., :3])
save(c, 'clalit-logo.png', pad=4)

# Reverse (white) version of the "Nexus" wordmark for dark scenes:
# the navy letters become white, the green/blue X keeps its colours.
w = np.array(Image.open(OUT + 'nexus-wordmark.png')).astype(np.float64)
r, g, b = w[..., 0], w[..., 1], w[..., 2]
navy = (g < 70) & (r < 60) & (b < 110)
w[navy, 0:3] = 255
Image.fromarray(w.astype(np.uint8)).save(OUT + 'nexus-wordmark-white.png')
print('nexus-wordmark-white.png')

import json
json.dump({k: v for k, v in BOXES.items() if k.startswith('nexus')}, open('src/config/lockup.json', 'w'), indent=1)
