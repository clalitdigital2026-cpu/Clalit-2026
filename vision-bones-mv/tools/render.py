#!/usr/bin/env python3
"""THE VISION BONES - We Have No Name : animation renderer.

Takes Grok-painted keyframes (keyframes/<id>.jpg, optional extra drawings
keyframes/<id>b.jpg, <id>c.jpg for limited frame-by-frame animation) and the
edit list (shots/edit.json) and renders the film frame by frame:
camera moves, line boil, rain, dust/embers, moth sprites and swarms, sound-wave
rings, beat-synced shake/flash/impact frames, chapter colour arc, film grain,
gate weave, scratches, ink-wipe transitions and the logo finale.

Usage: render.py --out renders/part_%d.mp4 [--start S --end E] [--scale 1.0]
"""
import argparse, json, math, os, subprocess, sys
import numpy as np, cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, FPS = 1920, 1080, 24

ap = argparse.ArgumentParser()
ap.add_argument("--out", required=True)
ap.add_argument("--start", type=float, default=0)
ap.add_argument("--end", type=float, default=None)
ap.add_argument("--scale", type=float, default=1.0, help="0.5 = fast preview")
ap.add_argument("--crf", type=int, default=16)
args = ap.parse_args()
SC = args.scale
OW, OH = int(W * SC) // 2 * 2, int(H * SC) // 2 * 2

env = json.load(open(f"{ROOT}/docs/envelope.json"))
edit = json.load(open(f"{ROOT}/shots/edit.json"))
SHOTS = edit["shots"]
DUR = edit["duration"]
END = args.end if args.end is not None else DUR
KICK = np.array(env["kick"]); ONSET = np.array(env["onset"]); RMS = np.array(env["rms"])
HITS = np.array(env["hits"])

rng_global = np.random.default_rng(7)

# ---------------------------------------------------------------- assets
_cache = {}
def load(path, size=(W, H)):
    key = (path, size)
    if key not in _cache:
        im = cv2.imread(path, cv2.IMREAD_COLOR)
        if im is None:
            raise SystemExit(f"missing {path}")
        im = cv2.resize(im, (int(size[0] * SC), int(size[1] * SC)), interpolation=cv2.INTER_AREA)
        _cache[key] = im.astype(np.float32) / 255.0
    return _cache[key]

def drawings(sid):
    base = f"{ROOT}/keyframes/{sid}.jpg"
    out = [base]
    for suf in "bcd":
        p = f"{ROOT}/keyframes/{sid}{suf}.jpg"
        if os.path.exists(p):
            out.append(p)
    return out

_clips = {}
def clip_frames(sid):
    """All frames of clips/<sid>.mp4 (Grok Imagine Video), resized to output size, uint8. Keeps 2 clips cached."""
    p = f"{ROOT}/clips/{sid}.mp4"
    if not os.path.exists(p):
        return None
    if sid not in _clips:
        if len(_clips) >= 2:
            _clips.pop(next(iter(_clips)))
        cap = cv2.VideoCapture(p); fr = []
        while True:
            ok, im = cap.read()
            if not ok: break
            fr.append(cv2.resize(im, (OW, OH), interpolation=cv2.INTER_LANCZOS4))
        _clips[sid] = (fr, cap.get(cv2.CAP_PROP_FPS) or 24)
    return _clips[sid]

USE_CLIPS = os.environ.get("NO_CLIPS") != "1"

def moth_sprite():
    """Cut the spread-wing moth from the reference sheet (cream background -> alpha)."""
    im = cv2.imread(f"{ROOT}/refs/moth-sheet.jpg")
    h, w = im.shape[:2]
    crop = im[int(h * 0.27):int(h * 0.80), 0:int(w * 0.42)]
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    # background: bright, low saturation
    bg = (hsv[..., 1] < 70) & (hsv[..., 2] > 150)
    a = (~bg).astype(np.uint8) * 255
    a = cv2.morphologyEx(a, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(a)
    big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    a = np.where(lab == big, 255, 0).astype(np.uint8)
    a = cv2.morphologyEx(a, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    x, y, bw, bh = cv2.boundingRect(a)
    spr = crop[y:y + bh, x:x + bw].astype(np.float32) / 255
    al = cv2.GaussianBlur(a[y:y + bh, x:x + bw], (3, 3), 0).astype(np.float32) / 255
    return spr, al

MOTH, MOTH_A = moth_sprite()

def paste_moth(img, cx, cy, size, flap, angle=0.0, glow=0.0, alpha=1.0):
    """size = wingspan in px (output space); flap 0..1 -> wings folded by x-squash."""
    size *= SC
    if size < 3:
        return
    sx = max(0.12, abs(math.cos(flap * math.pi)))
    h0, w0 = MOTH.shape[:2]
    tw = max(2, int(size * sx)); th = max(2, int(size * h0 / w0))
    spr = cv2.resize(MOTH, (tw, th), interpolation=cv2.INTER_AREA)
    al = cv2.resize(MOTH_A, (tw, th), interpolation=cv2.INTER_AREA) * alpha
    if angle:
        M = cv2.getRotationMatrix2D((tw / 2, th / 2), angle, 1.0)
        d = int(math.hypot(tw, th)) + 2
        M[0, 2] += (d - tw) / 2; M[1, 2] += (d - th) / 2
        spr = cv2.warpAffine(spr, M, (d, d)); al = cv2.warpAffine(al, M, (d, d))
        tw = th = d
    x0 = int(cx * SC - tw / 2); y0 = int(cy * SC - th / 2)
    ih, iw = img.shape[:2]
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(iw, x0 + tw), min(ih, y0 + th)
    if xa >= xb or ya >= yb:
        return
    s = spr[ya - y0:yb - y0, xa - x0:xb - x0]; a = al[ya - y0:yb - y0, xa - x0:xb - x0, None]
    if glow > 0:
        g = cv2.GaussianBlur(a, (0, 0), max(1, size * 0.25))
        if g.ndim == 2: g = g[..., None]
        img[ya:yb, xa:xb] += g * glow * np.array([0.05, 0.35, 0.95], np.float32)
    img[ya:yb, xa:xb] = img[ya:yb, xa:xb] * (1 - a) + s * a

# ---------------------------------------------------------------- helpers
def ease(u):
    return 0.5 - 0.5 * math.cos(math.pi * min(1, max(0, u)))

def lerp(a, b, u):
    return a + (b - a) * u

CAM = {  # zoom0, zoom1, x0, y0, x1, y1 (offsets as fraction of frame), rot0, rot1
    "push":    (1.04, 1.16, 0, 0, 0, 0, 0, 0),
    "pushfast":(1.02, 1.30, 0, 0, 0, 0, 0, 0),
    "pull":    (1.18, 1.04, 0, 0, 0, 0, 0, 0),
    "panL":    (1.15, 1.15, 0.06, 0, -0.06, 0, 0, 0),
    "panR":    (1.15, 1.15, -0.06, 0, 0.06, 0, 0, 0),
    "tiltU":   (1.16, 1.16, 0, 0.06, 0, -0.06, 0, 0),
    "tiltD":   (1.16, 1.16, 0, -0.06, 0, 0.06, 0, 0),
    "drift":   (1.08, 1.12, -0.015, 0.01, 0.015, -0.01, 0, 0),
    "aerial":  (1.05, 1.28, 0, -0.04, 0, 0.05, 0, 0),
    "rise":    (1.25, 1.03, 0, 0.06, 0, -0.03, 0, 0),
    "dutch":   (1.15, 1.22, -0.02, 0, 0.02, 0, -6, 4),
    "track":   (1.16, 1.16, -0.07, 0.005, 0.07, -0.005, 0, 0),
    "trackL":  (1.16, 1.16, 0.07, 0.005, -0.07, -0.005, 0, 0),
    "hold":    (1.06, 1.08, 0, 0, 0, 0, 0, 0),
    "fall":    (1.05, 1.35, 0, 0, 0, 0, 0, 25),
    "spin":    (1.20, 1.30, 0, 0, 0, 0, -10, 10),
    "video":   (1.025, 1.025, 0, 0, 0, 0, 0, 0),
}

def camera_warp(img, cam, u, shake, t):
    z0, z1, x0, y0, x1, y1, r0, r1 = CAM[cam]
    e = ease(u)
    z = lerp(z0, z1, e); x = lerp(x0, x1, e); y = lerp(y0, y1, e); r = lerp(r0, r1, e)
    # gate weave (tiny, constant)
    wx = 0.6 * math.sin(t * 2.1) + 0.4 * math.sin(t * 5.3)
    wy = 0.5 * math.sin(t * 1.7 + 1) + 0.3 * math.sin(t * 6.1)
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), r, z)
    M[0, 2] += x * w * z + (shake[0] + wx) * SC
    M[1, 2] += y * h * z + (shake[1] + wy) * SC
    return cv2.warpAffine(img, M, (OW, OH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

# line boil: smooth displacement field that changes every 2 frames
BOIL = []
for i in range(6):
    r = np.random.default_rng(100 + i)
    dx = cv2.resize(r.standard_normal((9, 16)).astype(np.float32), (OW, OH), interpolation=cv2.INTER_CUBIC)
    dy = cv2.resize(r.standard_normal((9, 16)).astype(np.float32), (OW, OH), interpolation=cv2.INTER_CUBIC)
    BOIL.append((dx, dy))
GX, GY = np.meshgrid(np.arange(OW, dtype=np.float32), np.arange(OH, dtype=np.float32))

def boil(img, f, amp=0.9):
    dx, dy = BOIL[(f // 2) % len(BOIL)]
    return cv2.remap(img, GX + dx * amp * SC, GY + dy * amp * SC, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

# rain: deterministic streak field
RAIN = np.random.default_rng(3).random((420, 4))
def rain(img, t, strength=1.0, slant=0.18):
    ov = np.zeros((OH, OW), np.float32)
    for i, (rx, ry, rl, rs) in enumerate(RAIN):
        speed = 1400 + 900 * rs
        y = (ry * (OH / SC + 300) + t * speed) % (OH / SC + 300) - 150
        x = (rx * (OW / SC + 400) + y * slant) % (OW / SC + 400) - 200
        L = 25 + 55 * rl
        p0 = (int(x * SC), int(y * SC)); p1 = (int((x + L * slant) * SC), int((y + L) * SC))
        cv2.line(ov, p0, p1, 0.35 + 0.4 * rs, 1, cv2.LINE_AA)
    ov = cv2.GaussianBlur(ov, (3, 3), 0) * strength
    img += ov[..., None] * np.array([0.85, 0.85, 0.8], np.float32) * 0.55

DUST = np.random.default_rng(5).random((160, 5))
def particles(img, t, kind="dust", strength=1.0):
    ov = np.zeros((OH, OW), np.float32)
    col = {"dust": (0.8, 0.85, 0.9), "ember": (0.15, 0.55, 1.0), "ash": (0.6, 0.6, 0.6)}[kind]
    rise = {"dust": -12, "ember": -90, "ash": 40}[kind]
    for px, py, ps, pr, ph in DUST:
        x = (px * W + 25 * math.sin(t * (0.4 + pr) + ph * 6)) % W
        y = (py * H + rise * t * (0.5 + pr)) % H
        r = 1 + 3 * ps
        a = (0.4 + 0.6 * math.sin(t * (1 + 3 * pr) + ph * 9) ** 2)
        cv2.circle(ov, (int(x * SC), int(y * SC)), max(1, int(r * SC)), a, -1, cv2.LINE_AA)
    ov = cv2.GaussianBlur(ov, (0, 0), 1.2 * SC + 0.3) * strength
    img += ov[..., None] * np.array(col, np.float32) * 0.8

def rings(img, t, cx=0.5, cy=0.55, period=1.95, strength=1.0):
    ov = np.zeros((OH, OW), np.float32)
    for k in range(4):
        ph = ((t / period) + k / 4) % 1.0
        rad = ph * 1300
        a = (1 - ph) ** 1.5
        cv2.circle(ov, (int(cx * OW), int(cy * OH)), int(rad * SC), a, max(1, int((6 + 10 * (1 - ph)) * SC)), cv2.LINE_AA)
    ov = cv2.GaussianBlur(ov, (0, 0), 3 * SC + 0.5) * strength
    img += ov[..., None] * np.array([0.1, 0.45, 1.0], np.float32)

def flicker(img, t, amount=0.12):
    v = 1 - amount * (0.5 + 0.5 * math.sin(t * 37) * math.sin(t * 11.3))
    img *= v

def swarm(img, t, u, n=120, mode="rise", seed=11, center=(0.5, 0.5)):
    r = np.random.default_rng(seed).random((n, 6))
    for a, b, c, d, e, f in r:
        if mode == "rise":
            x = (a * 1.4 - 0.2 + 0.08 * math.sin(t * (1 + c) + d * 6)) * W
            y = (1.15 - ((u * (0.8 + b) + e) % 1.3)) * H
            size = 18 + 70 * c ** 2
        elif mode == "spiral":
            ang = t * (1.5 + c) + a * 6.283
            rad = (0.15 + 0.45 * b) * H * (1 + 0.15 * math.sin(t + d))
            x = center[0] * W + math.cos(ang) * rad * 1.5
            y = center[1] * H + math.sin(ang) * rad * 0.6 + (e - 0.5) * 200
            size = 20 + 60 * c ** 2
        elif mode == "converge":
            k = ease(min(1, u * 1.25))
            sx = (a * 1.6 - 0.3) * W; sy = (b * 1.6 - 0.3) * H
            x = lerp(sx, center[0] * W, k) + 30 * math.sin(t * 3 + d * 6) * (1 - k)
            y = lerp(sy, center[1] * H, k) + 30 * math.cos(t * 3 + e * 6) * (1 - k)
            size = (20 + 50 * c ** 2) * (1 - 0.7 * k)
        flap = (t * (5 + 4 * f) + d) % 1.0
        paste_moth(img, x, y, size, flap, angle=(f - 0.5) * 40, glow=0.25)

def ink_mask(u, seed=1):
    """0..1 progressive ink-bleed wipe mask."""
    r = np.random.default_rng(seed)
    n = cv2.resize(r.random((12, 21)).astype(np.float32), (OW, OH), interpolation=cv2.INTER_CUBIC)
    n2 = cv2.resize(r.random((45, 80)).astype(np.float32), (OW, OH), interpolation=cv2.INTER_LINEAR)
    field = 0.7 * n + 0.3 * n2
    field = (field - field.min()) / (field.max() - field.min())
    m = np.clip((u * 1.3 - field) * 8, 0, 1)
    return m[..., None]

# ---------------------------------------------------------------- grade
def grade(img, sat, orange_keep, warmth, contrast):
    img = np.clip(img, 0, 1)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)  # H 0..360 for float
    hch = hsv[..., 0]
    org = np.clip(1 - np.abs(((hch - 28 + 180) % 360) - 180) / 28.0, 0, 1)  # orange/amber band
    s_mult = sat + (orange_keep - sat) * org
    hsv[..., 1] = np.clip(hsv[..., 1] * s_mult, 0, 1)
    img = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    # warmth: >0 pushes amber, <0 pushes cold blue-grey
    img += np.array([-0.04, 0.0, 0.05], np.float32) * warmth
    img = (img - 0.5) * contrast + 0.5
    return np.power(np.clip(img, 0, 1), 0.92)  # gentle lift

GRAIN = [cv2.GaussianBlur(np.random.default_rng(50 + i).standard_normal((OH, OW)).astype(np.float32), (0, 0), 0.7) for i in range(8)]
VIG = None
def film(img, f, t):
    global VIG
    if VIG is None:
        yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
        d = np.sqrt(((xx - OW / 2) / (OW / 2)) ** 2 + ((yy - OH / 2) / (OH / 2)) ** 2)
        VIG = np.clip(1 - 0.18 * d ** 2.6, 0, 1)[..., None]
    img = img * VIG
    g = GRAIN[f % 8]
    # soft grain, weaker in dark areas so faces and line art stay clean
    img += (g * 0.018)[..., None] * (0.35 + 0.65 * np.clip(img.mean(axis=2, keepdims=True) * 2, 0, 1))
    r = np.random.default_rng(f)
    if r.random() < 0.03:  # rare, faint vertical scratch
        x = int(r.random() * OW)
        ov = img.copy(); cv2.line(ov, (x, 0), (x + int(r.normal() * 8), OH), (0.85, 0.85, 0.8), 1, cv2.LINE_AA)
        img = img * 0.7 + ov * 0.3
    for _ in range(int(r.random() < 0.08)):  # occasional dust speck
        cv2.circle(img, (int(r.random() * OW), int(r.random() * OH)), int(1 + r.random() * 3 * SC),
                   (0.05, 0.05, 0.05) if r.random() < .6 else (0.9, 0.9, 0.85), -1, cv2.LINE_AA)
    return img

# ---------------------------------------------------------------- shot render
def beat_shake(fi, amp):
    k = KICK[min(fi, len(KICK) - 1)]
    r = np.random.default_rng(fi)
    return (r.normal() * amp * k, r.normal() * amp * k)

def render_shot(shot, t, fi):
    u = (t - shot["start"]) / max(1e-6, shot["end"] - shot["start"])
    fx = shot.get("fx", [])
    if shot["id"] == "black":
        img = np.zeros((OH, OW, 3), np.float32)
    elif USE_CLIPS and clip_frames(shot["id"]) is not None:
        fr, cfps = clip_frames(shot["id"])
        k = min(len(fr) - 1, int((t - shot["start"]) * cfps))
        src = fr[k].astype(np.float32) / 255.0
        shake = beat_shake(fi, shot.get("shake", 0))
        # gentle unsharp to firm up the 720p upscale, then weave/shake only (the clip has its own camera move)
        src = cv2.addWeighted(src, 1.15, cv2.GaussianBlur(src, (0, 0), 1.0), -0.15, 0)
        img = camera_warp(src, "video", u, shake, t)
        fx = [x for x in fx if x not in ("rain", "lightrain", "rings", "swarm", "spiral")]
        shot = {k2: v for k2, v in shot.items() if k2 != "moth_path"}
    else:
        ds = drawings(shot["id"])
        on = shot.get("on", 3)  # limited animation: hold each drawing N frames
        if len(ds) > 1:
            idx = (fi // on) % len(ds) if shot.get("cycle", True) else min(len(ds) - 1, int(u * len(ds)))
        else:
            idx = 0
        src = load(ds[idx])
        shake = beat_shake(fi, shot.get("shake", 0))
        img = camera_warp(src, shot.get("cam", "drift"), u, shake, t)
        img = boil(img, fi, shot.get("boil", 0.9))
    if "flicker" in fx: flicker(img, t)
    if "rain" in fx: rain(img, t, 1.0)
    if "lightrain" in fx: rain(img, t, 0.5)
    if "dust" in fx: particles(img, t, "dust")
    if "ember" in fx: particles(img, t, "ember", 1.3)
    if "ash" in fx: particles(img, t, "ash")
    if "rings" in fx: rings(img, t, strength=0.9)
    if "moth_path" in shot:  # [[x0,y0],[x1,y1],[x2,y2]] quadratic bezier, size
        p = shot["moth_path"]; s = shot.get("moth_size", 60)
        e = ease(u) if shot.get("moth_ease", True) else u
        x = (1 - e) ** 2 * p[0][0] + 2 * (1 - e) * e * p[1][0] + e ** 2 * p[2][0]
        y = (1 - e) ** 2 * p[0][1] + 2 * (1 - e) * e * p[1][1] + e ** 2 * p[2][1]
        paste_moth(img, x * W, y * H + 10 * math.sin(t * 9), s, (t * 7) % 1.0, angle=8 * math.sin(t * 3), glow=0.6)
    if "swarm" in fx: swarm(img, t, u, n=shot.get("n", 120), mode="rise")
    if "spiral" in fx: swarm(img, t, u, n=shot.get("n", 90), mode="spiral", center=(0.5, 0.5))
    if "converge" in fx: swarm(img, t, u, n=shot.get("n", 90), mode="converge", center=(0.5, 0.62))
    if "glow" in fx:
        b = cv2.GaussianBlur(np.clip(img - 0.55, 0, 1), (0, 0), 18 * SC + 1)
        img += b * np.array([0.3, 0.6, 1.0], np.float32) * (0.8 + 0.8 * KICK[min(fi, len(KICK) - 1)])
    if "pulse" in fx:
        img *= 0.94 + 0.10 * KICK[min(fi, len(KICK) - 1)]
    fade_in = shot.get("fade_in", 0); fade_out = shot.get("fade_out", 0)
    if fade_in and t - shot["start"] < fade_in: img *= (t - shot["start"]) / fade_in
    if fade_out and shot["end"] - t < fade_out: img *= max(0, (shot["end"] - t) / fade_out)
    return img

def palette(t):
    keys = [(0, (0.15, 1.0, -0.6, 1.03)), (33.5, (0.2, 1.1, -0.5, 1.04)), (78, (0.4, 1.12, -0.2, 1.05)),
            (123, (0.9, 1.05, 0.3, 1.03)), (162.6, (1.0, 1.08, 0.4, 1.04)), (225, (1.0, 1.1, 0.4, 1.06)),
            (292.7, (0.35, 1.1, -0.3, 1.02)), (300, (0.7, 1.1, 0.2, 1.02)), (320, (0.9, 1.1, 0.3, 1.02))]
    for i, (ta, va) in enumerate(keys):
        if i + 1 == len(keys) or t < keys[i + 1][0]:
            if i == 0:
                return va
            tb, vb = ta, va
            pa = keys[i - 1][1]
            uu = min(1, (t - ta) / 2.5)
            return tuple(lerp(a, b, uu) for a, b in zip(pa, va))

def impact(img, t):
    """Impact frames: 2 frames of high-contrast inverted ink on listed hit times."""
    for ht in edit.get("impacts", []):
        d = t - ht
        if 0 <= d < 2 / FPS:
            g = cv2.cvtColor(np.clip(img, 0, 1), cv2.COLOR_BGR2GRAY)
            th = (g < 0.45).astype(np.float32) if d < 1 / FPS else (g > 0.45).astype(np.float32)
            col = np.array([0.08, 0.35, 0.95], np.float32) if d < 1 / FPS else np.array([0.92, 0.9, 0.85], np.float32)
            return th[..., None] * col + (1 - th[..., None]) * 0.04
        if 2 / FPS <= d < 4 / FPS:
            return img * 0.6 + 0.4  # flash decay
    return img

_SUB = None
def subtitle_layer():
    """'WE HAVE NO NAME' in Anton, ink colour with slight rough edge, as BGRA float layer."""
    global _SUB
    if _SUB is None:
        from PIL import Image, ImageDraw, ImageFont, ImageFilter
        font = ImageFont.truetype(f"{ROOT}/fonts/Anton-Regular.ttf", int(64 * SC))
        im = Image.new("L", (OW, OH), 0); d = ImageDraw.Draw(im)
        txt = "WE HAVE NO NAME"
        # letter spacing
        sp = int(10 * SC); ws = [d.textlength(ch, font=font) for ch in txt]
        tw = sum(ws) + sp * (len(txt) - 1); x = (OW - tw) / 2; y = int(OH * 0.80)
        for ch, w in zip(txt, ws):
            d.text((x, y), ch, fill=255, font=font); x += w + sp
        al = np.asarray(im.filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255
        rough = np.random.default_rng(4).random(al.shape).astype(np.float32)
        al = al * (0.82 + 0.18 * rough)
        col = np.zeros((OH, OW, 3), np.float32) + np.array([0.09, 0.14, 0.22], np.float32)  # dark rust-brown (BGR)
        _SUB = np.dstack([col, al])
    return _SUB

LOGO = None
def logo_card(t, u):
    """Finale: cream album paper, moths converge, official logo emerges through ink/dust."""
    global LOGO
    if LOGO is None:
        lg4 = cv2.imread(f"{ROOT}/logo/logo.png", cv2.IMREAD_UNCHANGED).astype(np.float32) / 255
        lg, lga = (lg4[..., :3], lg4[..., 3:4]) if lg4.shape[2] == 4 else (lg4, np.ones_like(lg4[..., :1]))
        paper = np.full((H, W, 3), (0.80, 0.88, 0.92), np.float32)  # dirty cream (BGR)
        r = np.random.default_rng(9)
        tex = cv2.GaussianBlur(r.standard_normal((H, W)).astype(np.float32), (0, 0), 2) * 0.03
        paper += tex[..., None]
        lw = int(W * 0.72); lh = int(lw * lg.shape[0] / lg.shape[1])
        lg = cv2.resize(lg, (lw, lh), interpolation=cv2.INTER_AREA)
        lga = cv2.resize(lga, (lw, lh), interpolation=cv2.INTER_AREA)[..., None]
        card = paper.copy()
        y0 = int(H * 0.40 - lh / 2); x0 = (W - lw) // 2
        reg = card[y0:y0 + lh, x0:x0 + lw]
        card[y0:y0 + lh, x0:x0 + lw] = reg * (1 - lga) + lg * lga  # official logo, untouched, over the paper
        LOGO = (cv2.resize(paper, (OW, OH)), cv2.resize(card, (OW, OH)))
    paper, card = LOGO
    m = ink_mask(min(1, u * 1.6), seed=21)
    img = paper * (1 - m) + card * m
    # subtitle under the logo
    if u > 0.35:
        a = min(1, (u - 0.35) / 0.25)
        txt = subtitle_layer()
        m = txt[..., 3:4] * a
        img = img * (1 - m) + txt[..., :3] * m
    return img

def frame(fi):
    t = fi / FPS
    cur = None; nxt = None
    for i, s in enumerate(SHOTS):
        if s["start"] <= t < s["end"]:
            cur = s; nxt = SHOTS[i + 1] if i + 1 < len(SHOTS) else None
            break
    if cur is None:
        cur = SHOTS[-1]
    if cur["id"] == "logo":
        u = (t - cur["start"]) / (cur["end"] - cur["start"])
        img = logo_card(t, u)
        prev = SHOTS[SHOTS.index(cur) - 1]
        if t - cur["start"] < 0.6:  # moths fly over the cut
            pass
        return film(img, fi, t)
    img = render_shot(cur, t, fi)
    # transitions into next shot
    if nxt is not None:
        tr = nxt.get("trans", "cut"); td = nxt.get("trans_dur", 0.5)
        if tr in ("ink", "dissolve", "white") and cur["end"] - t < td and nxt["id"] != "logo":
            u = 1 - (cur["end"] - t) / td
            img2 = render_shot(nxt, t, fi)
            if tr == "ink":
                m = ink_mask(u, seed=hash(nxt["id"]) % 1000)
                img = img * (1 - m) + img2 * m
            elif tr == "dissolve":
                img = img * (1 - u) + img2 * u
            elif tr == "white":
                img = img * (1 - u) + np.ones_like(img) * 0.95 * u
        if nxt["id"] == "logo" and cur["end"] - t < 1.0:
            u = 1 - (cur["end"] - t) / 1.0
            paper = np.full_like(img, 0.86)
            m = ink_mask(u, seed=33)
            img = img * (1 - m) + paper * m
    sat, okeep, warm, con = palette(t)
    img = grade(img, sat, okeep, warm, con)
    img = impact(img, t)
    return film(img, fi, t)

# ---------------------------------------------------------------- main
f0 = int(round(args.start * FPS)); f1 = int(round(END * FPS))
os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24",
                       "-s", f"{OW}x{OH}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                       "-crf", str(args.crf), "-pix_fmt", "yuv420p", args.out], stdin=subprocess.PIPE)
for fi in range(f0, f1):
    im = frame(fi)
    ff.stdin.write((np.clip(im, 0, 1) * 255).astype(np.uint8).tobytes())
    if fi % 240 == 0:
        print(f"{args.out}: {fi}/{f1}", flush=True)
ff.stdin.close(); ff.wait()
print("done", args.out)
