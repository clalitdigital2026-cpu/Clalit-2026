"""
NEXUS soundtrack – edit the music to picture and lay sound design on the cue sheet.

Sources (generated in ElevenLabs, see assets-src/README.md):
  assets-src/music/take-b.mp3   – 90 s instrumental score, 120 BPM (same grid as the film)
  assets-src/sfx/*.mp3          – impact, whoosh, riser, reverse swell, heartbeat, logo sting

Every timing comes from src/config/cues.json, so the sound follows the visuals.

    python3 scripts/mix-soundtrack.py   →  public/audio/nexus-score.wav (48 kHz, 16-bit, stereo)
"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
CUES = json.loads((ROOT / 'src/config/cues.json').read_text())
TOTAL = sum(s['seconds'] for s in CUES['scenes'])


def load(path: Path) -> np.ndarray:
    """Decode any audio file to float32 stereo at SR."""
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def s(t: float) -> int:
    return int(round(t * SR))


def db(x: float) -> float:
    return 10 ** (x / 20)


music_src = load(ROOT / 'assets-src/music/take-b.mp3')
SFX = {p.stem: load(p) for p in (ROOT / 'assets-src/sfx').glob('*.mp3')}

# ---------------------------------------------------------------------------
# 1. Music edit (film time ← source time). The source is on the same 120 BPM grid;
#    cuts happen on bar lines (even seconds in the source).
# ---------------------------------------------------------------------------
FREEZE = CUES['freeze']          # 22.5 – the music stops dead
MEET = CUES['streamsMeet']       # 27.0 – the source's big hit (28.0) lands here
EDIT = [
    # (film_start, src_start, src_end)
    (0.0, 0.0, FREEZE),          # ambient intro → groove → tension
    (MEET, 28.0, 70.0),          # reveal bloom (28–33), driving groove from 34
    (MEET + 42.0, 66.0, 70.0),   # two-bar repeat inside the benefits section (film 69–73)
    (MEET + 46.0, 70.0, 90.0),   # keywords, anthem and the final chord over the logo
]
XF = 0.012  # crossfade at each splice (s)
LAG = 0.035  # the source's beats sit 35 ms after the grid – pull them onto it

music = np.zeros((s(TOTAL), 2), dtype=np.float32)
for i, (f0, a, b) in enumerate(EDIT):
    seg = music_src[s(a + LAG):s(b + LAG)].copy()
    n = len(seg)
    ramp = np.linspace(0, 1, s(XF), dtype=np.float32)[:, None]
    if i > 0:
        seg[: len(ramp)] *= ramp
    seg[-len(ramp):] *= ramp[::-1]
    start = s(f0)
    end = min(len(music), start + n)
    music[start:end] += seg[: end - start]

t = np.arange(len(music)) / SR

# intro: rise out of near-silence and open a low-pass filter over the first 8 s
intro = np.clip(t / 7.6, 0, 1)
gain = db(-22) + (1 - db(-22)) * intro ** 2.2
cut = 180 * (90 ** np.clip(t / 7.8, 0, 1))     # 180 Hz → ~16 kHz
alpha = 1 - np.exp(-2 * np.pi * cut / SR)
y = np.zeros(2, dtype=np.float64)
n_intro = s(8.2)
for k in range(n_intro):  # one-pole LP, only while it matters
    y += alpha[k] * (music[k] - y)
    music[k] = y
music[:, 0] *= gain
music[:, 1] *= gain

# the freeze: a clean, quick stop (short tail) – then silence until the riser
stop = np.clip(1 - (t - FREEZE) / 0.18, 0, 1)
win = (t >= FREEZE) & (t < MEET - 0.02)
music[win] *= stop[win][:, None]

# the very end: let the final chord ring, fade gently into silence
fade = np.clip(1 - (t - (TOTAL - 1.6)) / 1.6, 0, 1)
music *= fade[:, None]

# ---------------------------------------------------------------------------
# 2. Sound design on the cue sheet: (name, film time of the sound's peak, gain dB)
#    The peak offset of each effect is measured so the hit lands exactly on the cue.
# ---------------------------------------------------------------------------
PEAK = {'heartbeat': 0.14, 'impact': 0.07, 'whoosh': 0.5, 'riser': 2.97, 'reverse-swell': 1.45, 'logo-sting': 0.07}

events = []
for k, h in enumerate(CUES['heartbeats']):
    if h < 7.8:
        events.append(('heartbeat', h, -4 - k * 0.8))
events += [
    ('whoosh', 7.95, -10),                       # flight into the light
    ('reverse-swell', CUES['eventMorph'], -14),  # מידע → EVENT
    ('impact', CUES['eventMorph'], -16),
    ('riser', MEET - 0.03, -6),                  # out of the silence…
    ('reverse-swell', MEET - 0.02, -8),
    ('impact', MEET, -1),                        # …the streams meet
    ('riser', CUES['diveEnd'] - 1.5, -11),       # the breath after the reveal builds into…
    ('whoosh', CUES['diveEnd'] - 1.0, -9),       # …the dive into the symbol
]
events += [('whoosh', t0 - 0.35, -15) for t0 in CUES['layers'][1:]]
events += [
    ('whoosh', CUES['pulseToHub'] + 0.5, -14),
    ('impact', CUES['split'], -12),
]
events += [('impact', b, -9) for b in CUES['edBeats']]
events += [
    ('reverse-swell', CUES['eventDrivenTitle'], -9),
    ('impact', CUES['eventDrivenTitle'], -4),
]
events += [('whoosh', b - 0.2, -17) for b in CUES['benefits'][1:]]
events += [('impact', kw, -10) for kw in CUES['keywords']]
events += [
    ('riser', CUES['bigPulse'] - 0.03, -8),
    ('impact', CUES['bigPulse'], -2),
    ('whoosh', CUES['converge'] + 0.6, -10),
    ('reverse-swell', CUES['finalMeet'], -10),
    ('logo-sting', CUES['finalMeet'], -3),
    ('impact', CUES['finalMeet'], -12),
]

fx = np.zeros_like(music)
for name, at, g in events:
    clip = SFX[name]
    start = s(at - PEAK[name])
    a = max(0, start)
    b = min(len(fx), start + len(clip))
    if b > a:
        fx[a:b] += clip[a - start: b - start] * db(g)

# keep the music out of the way of the biggest hits (gentle sidechain)
env = np.abs(fx).max(axis=1)
k = np.exp(-1 / (0.25 * SR))
sm = np.zeros_like(env)
acc = 0.0
for i in range(0, len(env), 64):  # block-wise envelope follower
    v = env[i:i + 64].max()
    acc = max(v, acc * k ** 64)
    sm[i:i + 64] = acc
duck = 1 / (1 + 1.2 * sm)

mix = music * duck[:, None] + fx

# ---------------------------------------------------------------------------
# 3. Master: soft limiter + normalisation
# ---------------------------------------------------------------------------
peak = np.abs(mix).max()
mix = np.tanh(mix / peak * 1.25) / np.tanh(1.25)
mix *= db(-1.0)

out = ROOT / 'public/audio/nexus-score.wav'
pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
with wave.open(str(out), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f'wrote {out} ({TOTAL}s, {len(events)} sound-design events)')
