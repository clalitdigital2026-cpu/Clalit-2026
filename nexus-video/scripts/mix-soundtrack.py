"""
NEXUS soundtrack – edit the music to picture and lay sound design on the cue sheet.

Sources (generated in ElevenLabs, see assets-src/README.md):
  assets-src/music/take-b.mp3   – 90 s instrumental score, 120 BPM (same grid as the film)
  assets-src/sfx/*.mp3          – impact, whoosh, riser, reverse swell, heartbeat, logo sting

Every timing comes from src/config/cues.json, so the sound follows the visuals.

    python3 scripts/mix-soundtrack.py   →  public/audio/nexus-score.wav (48 kHz, 16-bit, stereo)
"""
import json
import os
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
# 2. Sound design on the cue sheet.
#    Event = (sound, film time of the sound's PEAK, gain dB, pan_from, pan_to, heavy)
#    pan: -1 left … +1 right (the film moves right → left, so motion pans R → L).
#    heavy: the music ducks under it.
# ---------------------------------------------------------------------------
def frame_rms_peak(x):
    m = x.mean(axis=1)
    n = int(0.02 * SR)
    r = np.sqrt(np.convolve(m * m, np.ones(n) / n, mode='same'))
    return r.max(), int(r.argmax()) / SR


PEAK = {}
for name, clip in SFX.items():
    PEAK[name] = frame_rms_peak(clip)[1]
# measured, hand-checked peaks for the long-tail sounds
PEAK.update({'heartbeat': 0.14, 'impact': 0.07, 'whoosh': 0.5, 'riser': 2.97, 'reverse-swell': 1.45, 'logo-sting': 0.07})

# The texture layer (data flow, particles, transitions…) is normalised to one
# reference level so gains read the same for every sound.
LAYER = {'data-stream', 'particles-assemble', 'particles-disperse', 'swipe', 'data-tap', 'connect-lock',
         'energy-wave', 'digital-morph', 'fly-by', 'freeze-stop', 'shimmer'}
for name in LAYER:
    lvl, _ = frame_rms_peak(SFX[name])
    SFX[name] = SFX[name] * (db(-10) / max(lvl, 1e-6))

# a warmer, darker variant of the particle sound for the quiet opening
from scipy.signal import butter, sosfilt  # noqa: E402
_sos = butter(4, 2600, 'low', fs=SR, output='sos')
SFX['particles-assemble-soft'] = sosfilt(_sos, SFX['particles-assemble'], axis=0).astype(np.float32)
PEAK['particles-assemble-soft'] = PEAK['particles-assemble']

C = CUES
events = []


def ev(name, at, g, p0=0.0, p1=None, heavy=False):
    events.append((name, at, g, p0, p0 if p1 is None else p1, heavy))


# — 1 · Pulse: heartbeat, particles born, the flight, places of care ----------
for k, h in enumerate(C['heartbeats']):
    if h < 7.8:
        ev('heartbeat', h, -4 - k * 0.8)
# the three opening lines: one soft, warm (low-passed) gathering on the first and the last line only
ev('particles-assemble-soft', C['pulseTexts'][0] + 0.5, -15, 0.15, -0.15)
ev('particles-assemble-soft', C['pulseTexts'][2] + 0.5, -14, 0.15, -0.15)
for at_, pan in [(3.0, -0.5), (3.6, 0.5), (4.4, 0.4), (5.0, -0.45), (5.6, -0.1), (6.2, 0.3)]:
    ev('data-tap', at_ + 0.35, -26, pan)                         # a place of care condenses
ev('fly-by', 4.3, -15, -0.7, 0.7)
ev('fly-by', 6.4, -13, 0.7, -0.7)
ev('whoosh', 7.95, -10)                                          # flight into the light

# — 2 · Every moment is an event ------------------------------------------
for k, tt in enumerate(C['moments']):
    ev('data-tap', tt, -13, 0.25 if k % 2 else -0.25)            # the action
    ev('swipe', tt + 0.12, -22, 0.3, -0.3)                       # its packet leaves
ev('particles-assemble', C['eventsHeadline'] + 0.55, -8, 0, 0)   # מידע gathers from the packets
ev('digital-morph', C['eventMorph'] + 0.15, -11)                  # מידע → EVENT
ev('reverse-swell', C['eventMorph'], -14)
ev('impact', C['eventMorph'], -16, heavy=True)
ev('shimmer', C['eventsClosing'] + 0.9, -10, 0.5, -0.5)          # the underline of value
ev('fly-by', 17.25, -13, -0.5, 0.5)                              # pull back into the systems

# — 3 · The challenge -------------------------------------------------------
for k, tt in enumerate(C['challengeWords']):
    ev('data-tap', tt + 0.1, -18, [0.4, -0.5, 0.3, -0.3][k])
for k in range(14):                                              # links keep forming, faster
    tt = 17.5 + 4.9 * (k / 14) ** 0.8
    ev('data-tap', tt, -21 + k * 0.3, [0.5, -0.4, 0.2, -0.6, 0.6, -0.1, 0.3][k % 7])
ev('freeze-stop', C['freeze'] + 0.08, -9, heavy=True)            # everything freezes
ev('riser', MEET - 0.03, -6)                                     # out of the silence…
ev('reverse-swell', MEET - 0.02, -8)

# — 4 · Reveal ---------------------------------------------------------------
ev('impact', MEET, -1, heavy=True)                               # …the streams meet
ev('energy-wave', MEET + 0.15, -8, heavy=True)                   # the shockwave floods the frame
ev('particles-assemble', MEET + 0.55, -13)                        # the symbol forms
ev('shimmer', C['wordmark'] + 0.45, -12, -0.6, 0.6)               # wordmark light sweep (L → R)
ev('data-tap', C['revealSubtitle'] + 0.1, -20)
ev('shimmer', C['revealEra'] + 0.6, -12, 0.4, -0.4)
ev('riser', C['diveEnd'] - 1.5, -11)                             # the breath builds into…
ev('whoosh', C['diveEnd'] - 1.0, -9)                             # …the dive into the symbol
ev('fly-by', C['diveEnd'] - 0.6, -8)

# — 5 · Architecture: a journey through the event flow -----------------------
L = C['layers']
for k, tt in enumerate(L[1:]):
    ev('fly-by', tt - 0.35, -11, 0.7, -0.7)                      # camera travels R → L
    ev('whoosh', tt - 0.35, -16, 0.6, -0.6)
ev('connect-lock', L[1] + 0.6, -10, 0.2)                         # processing gates engage
ev('data-tap', L[1] + 1.1, -18, 0.0)
ev('data-tap', L[1] + 1.4, -18, -0.2)
ev('particles-assemble', L[2] + 0.45, -9)                        # the unified store fills
ev('connect-lock', L[2] + 1.2, -12)
for k in range(4):                                               # deliveries to the clouds
    ev('data-tap', L[3] + 0.6 + k * 0.25, -16, -0.6 + k * 0.1)
ev('fly-by', 48.25, -11)                                         # pull back to the wide shot
ev('shimmer', 48.85, -10)                                        # into the light

# — 6 · Event-driven -----------------------------------------------------------
ev('connect-lock', C['labEvent'] + 0.03, -12, heavy=True)         # LAB RESULT AVAILABLE
ev('shimmer', C['labEvent'] + 0.4, -16)
ev('swipe', C['pulseToHub'] + 0.4, -12, 0.0, 0.0)                # the event travels to NEXUS
ev('whoosh', C['pulseToHub'] + 0.5, -14)
ev('energy-wave', C['split'] + 0.1, -7, heavy=True)              # it splits into parallel streams
ev('impact', C['split'], -14, heavy=True)
for k, tt in enumerate(C['targets']):
    ev('data-tap', tt, -11, [0.6, 0.65, 0.0, -0.65, -0.6][k])    # each system reacts on its own
    ev('connect-lock', tt + 0.05, -20, [0.6, 0.65, 0.0, -0.65, -0.6][k])
for k, b in enumerate(C['edBeats']):
    ev('impact', b, -9, heavy=True)
    ev('swipe', b - 0.05, -13, 0.4, -0.4)
ev('fly-by', C['eventDrivenTitle'] - 0.2, -11)                   # night falls around the title
ev('reverse-swell', C['eventDrivenTitle'], -9)
ev('impact', C['eventDrivenTitle'], -4, heavy=True)
ev('shimmer', C['eventDrivenTitle'] + 0.8, -11, -0.6, 0.6)       # light runs through the letters

# — 7 · Benefits: cut on the beat -------------------------------------------
B = C['benefits']
for k, b in enumerate(B):
    if k:
        ev('swipe', b - 0.08, -6, 0.75, -0.75)                   # the diagonal wipe, R → L
ev('energy-wave', B[0] + 0.45, -12)                               # real-time wave lights the grid
ev('digital-morph', B[1] + 0.7, -12)                              # the tangle resolves
for k in range(3):
    ev('connect-lock', B[2] + 0.3 + k * 0.22, -12, [-0.4, 0.4, 0.0][k])  # modules snap together
ev('connect-lock', B[2] + 1.05, -12)
ev('particles-assemble', B[3] + 0.55, -9)                         # thousands of points organise
for k in range(4):
    ev('connect-lock', B[4] + 0.5 + k * 0.1, -16, [-0.6, 0.6, -0.3, 0.3][k])  # care connects
ev('particles-assemble', B[5] + 0.5, -10)                         # points become a helix
ev('shimmer', B[5] + 0.95, -12)                                   # insights
ev('data-tap', B[6] + 0.6, -16, -0.6)
ev('data-tap', B[6] + 0.72, -16, -0.6)
ev('data-tap', B[6] + 0.84, -16, -0.6)
for kw in C['keywords']:
    ev('impact', kw, -10, heavy=True)
    ev('swipe', kw - 0.04, -10, 0.5, -0.5)

# — 8 · The rules of the game ------------------------------------------------
ev('fly-by', 75.7, -11, 0.5, -0.5)                                # rising above the country
for tt in C['pairs']:
    ev('shimmer', tt + 0.7, -12, 0.4, -0.4)
ev('riser', C['bigPulse'] - 0.03, -8)
ev('impact', C['bigPulse'], -2, heavy=True)
ev('energy-wave', C['bigPulse'] + 0.1, -8, heavy=True)            # the great pulse
ev('particles-assemble', C['bigPulse'] + 0.55, -12)                # the final sentence forms
ev('particles-assemble', 83.65, -11)                              # …and implodes into the streams

# — 9 · Signature ------------------------------------------------------------
ev('whoosh', C['converge'] + 0.6, -10)
ev('particles-assemble', C['finalMeet'] - 0.2, -9)
ev('reverse-swell', C['finalMeet'], -10)
ev('logo-sting', C['finalMeet'], -3, heavy=True)
ev('impact', C['finalMeet'], -12, heavy=True)
ev('shimmer', C['finalMeet'] + 1.0, -15, -0.6, 0.6)                # NEXUS wordmark sweep
ev('data-tap', C['clalitLogo'] + 0.15, -18)
ev('shimmer', 88.8, -14, -0.4, 0.4)                               # last glint on the symbol

# — continuous data-flow beds: (start, end, gain_from, gain_to, pan_from, pan_to) —
BEDS = [
    (3.2, 7.9, -32, -22, 0.0, 0.0),        # the flight through the particle field (kept soft)
    (8.3, 11.8, -26, -22, 0.3, -0.3),      # packets streaming toward the centre
    (17.4, C['freeze'], -25, -12, -0.3, 0.3),  # complexity grows… and stops dead
    (25.0, MEET, -24, -12, -0.8, 0.0),     # the green stream (from the left)
    (25.1, MEET, -24, -12, 0.8, 0.0),      # the blue stream (from the right)
    (L[0], 48.4, -17, -15, 0.5, -0.5),     # riding the event flow through the layers
    (C['split'] + 0.4, 55.8, -24, -24, 0.0, 0.0),
    (B[6], C['keywords'][0], -20, -15, 0.6, -0.4),  # streams feeding the models
    (75.2, C['bigPulse'], -27, -20, -0.2, 0.2),     # the national network breathes
    (C['converge'], C['finalMeet'], -20, -11, -0.7, 0.0),
    (C['converge'] + 0.05, C['finalMeet'], -20, -11, 0.7, 0.0),
]


def place(buf, clip, start_s, gain, p0, p1):
    n = len(clip)
    a = max(0, start_s)
    b = min(len(buf), start_s + n)
    if b <= a:
        return
    seg = clip[a - start_s: b - start_s]
    mono = seg.mean(axis=1)
    side = (seg[:, 0] - seg[:, 1]) * 0.5
    pan = np.linspace(p0, p1, n, dtype=np.float32)[a - start_s: b - start_s]
    ang = (pan + 1) * np.pi / 4
    buf[a:b, 0] += (mono * np.cos(ang) * 1.414 + side) * gain
    buf[a:b, 1] += (mono * np.sin(ang) * 1.414 - side) * gain


fx = np.zeros_like(music)
heavy = np.zeros_like(music)
for name, at, g, p0, p1, hv in events:
    start = s(at - PEAK[name])
    place(fx, SFX[name], start, db(g), p0, p1)
    if hv:
        place(heavy, SFX[name], start, db(g), p0, p1)

bed = SFX['data-stream']
for t0, t1, g0, g1, p0, p1 in BEDS:
    n = s(t1 - t0)
    reps = int(np.ceil(n / len(bed))) + 1
    loop = np.tile(bed, (reps, 1))[s((t0 * 1.37) % 7.0): s((t0 * 1.37) % 7.0) + n].copy()  # vary the loop phase
    tt = np.linspace(0, 1, len(loop), dtype=np.float32)
    gain = db(g0 + 3) * (db(g1) / db(g0)) ** tt
    edge = np.minimum(1, np.minimum(tt * (t1 - t0) / 0.5, (1 - tt) * (t1 - t0) / 0.08))
    loop *= (gain * edge)[:, None]
    place(fx, loop, s(t0), 1.0, p0, p1)

# keep the music out of the way of the biggest hits only (gentle sidechain)
env = np.abs(heavy).max(axis=1)
k = np.exp(-1 / (0.25 * SR))
sm = np.zeros_like(env)
acc = 0.0
for i in range(0, len(env), 64):  # block-wise envelope follower
    v = env[i:i + 64].max()
    acc = max(v, acc * k ** 64)
    sm[i:i + 64] = acc
duck = 1 / (1 + 1.2 * sm)

mix = music * duck[:, None] + fx

if os.environ.get('STEMS'):  # debugging aid: write the music and effects stems separately
    for stem_name, stem in (('music', music * duck[:, None]), ('fx', fx)):
        np.save(Path(os.environ['STEMS']) / f'{stem_name}.npy', stem)

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
