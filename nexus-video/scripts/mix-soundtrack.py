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

# the quiet opening: the whole effects layer sits lower until the flight into the light
open_gain = db(-6) + (1 - db(-6)) * np.clip((t - 7.6) / 0.9, 0, 1)
fx *= open_gain[:, None].astype(np.float32)

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

# ---------------------------------------------------------------------------
# 3. Hebrew voiceover: one long take, cut at its pauses, each line placed on its cue
# ---------------------------------------------------------------------------
VO_SRC = ROOT / 'assets-src/voiceover/narration.mp3'
SCRIPT = json.loads((ROOT / 'assets-src/voiceover/script.json').read_text())
vo = np.zeros_like(music)
if VO_SRC.exists():
    from scipy.signal import butter as _b, sosfilt as _f  # noqa: E402
    take = load(VO_SRC)
    take = _f(_b(2, 90, 'high', fs=SR, output='sos'), take, axis=0).astype(np.float32)
    # line boundaries from word-level timestamps (assets-src/voiceover/alignment.json),
    # snapped to the quietest point nearby so no syllable is clipped
    ALIGN = json.loads((ROOT / 'assets-src/voiceover/alignment.json').read_text())['lines']
    assert len(ALIGN) == sum(1 for ln in SCRIPT if "file" not in ln)
    mono = take.mean(axis=1)
    env10 = np.sqrt(np.convolve(mono ** 2, np.ones(480) / 480, mode='same'))

    def quiet_near(t0, lo, hi):
        a_, b_ = s(max(0, t0 + lo)), s(min(len(mono) / SR, t0 + hi))
        return (a_ + int(np.argmin(env10[a_:b_]))) / SR if b_ > a_ else t0

    def stretch(x, tempo):
        if abs(tempo - 1) < 1e-3:
            return x
        out_ = subprocess.run(
            ['ffmpeg', '-v', 'error', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-',
             '-af', f'atempo={tempo}', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
            input=x.astype(np.float32).tobytes(), check=True, capture_output=True).stdout
        return np.frombuffer(out_, dtype=np.float32).reshape(-1, 2).copy()

    target = db(-15.5)
    MIN_GAP = 0.35  # silence between consecutive lines (s)

    def speech_extent(x):
        e = np.sqrt(np.convolve(x.mean(axis=1) ** 2, np.ones(480) / 480, mode='same'))
        lv = 20 * np.log10(e + 1e-9)
        on = np.where(lv > lv.max() - 35)[0]
        return (on[0] / SR, on[-1] / SR) if len(on) else (0.0, len(x) / SR)

    def tighten(x, max_pause):
        """Shorten pauses inside a line (between its sentences) to at most max_pause."""
        e = np.sqrt(np.convolve(x.mean(axis=1) ** 2, np.ones(480) / 480, mode='same'))
        lv = 20 * np.log10(e + 1e-9)
        quiet = lv < lv.max() - 32
        keep = np.ones(len(x), dtype=bool)
        i, n_, lim = 0, len(x), int(max_pause * SR)
        while i < n_:
            if quiet[i]:
                j = i
                while j < n_ and quiet[j]:
                    j += 1
                if 0 < i and j < n_ and j - i > lim:  # an inner pause
                    cut0 = i + lim // 2
                    cut1 = j - lim // 2
                    keep[cut0:cut1] = False
                i = j
            else:
                i += 1
        y = x[keep]
        return y

    prev_end = -1.0
    for line in SCRIPT:
        if line.get('skip'):
            continue
        tempo = line.get('tempo', 1.0)
        if 'file' in line:
            raw = load(ROOT / 'assets-src' / line['file'])
            raw = _f(_b(2, 90, 'high', fs=SR, output='sos'), raw, axis=0).astype(np.float32)
        else:
            w0, w1 = ALIGN[line['take_index']]
            raw = take[s(quiet_near(w0, -0.25, 0.02)): s(quiet_near(w1, -0.02, 0.3))]
        a0, a1 = speech_extent(raw)
        seg = raw[max(0, s(a0 - 0.03)): s(a1 + 0.1)].copy()
        seg = tighten(seg, line.get('max_pause', 0.3))
        seg = stretch(seg, tempo)
        seg *= target / max(np.sqrt(np.mean(seg ** 2)), 1e-6)
        r = np.linspace(0, 1, int(0.01 * SR), dtype=np.float32)[:, None]
        seg[: len(r)] *= r
        seg[-len(r) * 4:] *= np.linspace(1, 0, len(r) * 4, dtype=np.float32)[:, None]
        start = line['at'] - 0.03 / tempo
        note = ''
        if start < prev_end + MIN_GAP:
            note = f'  ⚠ pushed +{prev_end + MIN_GAP - start:.2f}s'
            start = prev_end + MIN_GAP
        st = s(start)
        vo[st: st + len(seg)] += seg[: max(0, len(vo) - st)]
        prev_end = start + len(seg) / SR - 0.1 / tempo
        print(f"  VO {line['id']:>3} {start + 0.03:6.2f}–{prev_end:6.2f}s{note}  {line['text']}")
    # make room for the voice: music and effects dip under it
    venv = np.abs(vo).max(axis=1)
    kv = np.exp(-1 / (0.18 * SR))
    vs = np.zeros_like(venv)
    acc = 0.0
    for i in range(0, len(venv), 64):
        acc = max(venv[i:i + 64].max(), acc * kv ** 64)
        vs[i:i + 64] = acc
    vduck = 1 / (1 + 5.0 * np.clip(vs / max(vs.max(), 1e-6), 0, 1) ** 0.7)  # ≈ -7.5 dB while speaking
    mix_novo = music * duck[:, None] + fx
    mix = music * duck[:, None] * vduck[:, None] + fx * (0.45 + 0.55 * vduck[:, None]) + vo
else:
    mix_novo = None
    mix = music * duck[:, None] + fx

if os.environ.get('STEMS'):  # debugging aid: write the music and effects stems separately
    for stem_name, stem in (('music', music * duck[:, None]), ('fx', fx), ('vo', vo)):
        np.save(Path(os.environ['STEMS']) / f'{stem_name}.npy', stem)

# ---------------------------------------------------------------------------
# 4. Master: soft limiter + normalisation → with and without voiceover
# ---------------------------------------------------------------------------
def master(x, target_db=-14.5):
    """Loudness-normalise (RMS of the louder half of the film) and soft-limit the peaks."""
    win = int(0.4 * SR)
    blocks = np.array([np.sqrt(np.mean(x[i:i + win] ** 2)) for i in range(0, len(x) - win, win)])
    ref = np.sqrt(np.mean(np.sort(blocks)[len(blocks) // 2:] ** 2))
    x = x * (db(target_db) / max(ref, 1e-9))
    knee = 0.75
    a = np.abs(x)
    over = a > knee
    x[over] = np.sign(x[over]) * (knee + (0.86 - knee) * np.tanh((a[over] - knee) / (0.86 - knee)))
    return x


def write_wav(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f'wrote {path}')


write_wav(ROOT / 'public/audio/nexus-score.wav', master(mix))
if mix_novo is not None:
    write_wav(ROOT / 'public/audio/nexus-score-no-voiceover.wav', master(mix_novo))
print(f'{TOTAL}s, {len(events)} sound-design events, voiceover: {"yes" if mix_novo is not None else "no"}')
