#!/usr/bin/env python3
"""Edit decision list for the film. Times in seconds; boundaries snap to the nearest beat.
cam: camera preset (see render.py CAM). fx: effects. trans: transition INTO this shot.
on: frames per drawing when extra drawings (<id>b.jpg...) exist."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env = json.load(open(f"{ROOT}/docs/envelope.json"))
beats = env["beats"]; DUR = 327.13
def snap(t):
    if t <= 0.01 or t >= DUR - 0.01: return t
    b = min(beats, key=lambda x: abs(x - t))
    return b if abs(b - t) < 0.35 else t
R, L, D, E, P, G = "rain", "lightrain", "dust", "ember", "pulse", "glow"
S = [
 # --- 1. THE CITY WITHOUT NAMES (quiet intro -> band enters 16.2)
 ("black", 0, 3.0, dict()),
 ("s02", 3.0, 11.6, dict(cam="aerial", fx=[R, "flicker"], fade_in=2.5)),
 ("s03", 11.6, 16.2, dict(cam="panR", fx=[R])),
 ("s04", 16.2, 20.1, dict(cam="push", fx=[R])),
 ("s05", 20.1, 24.0, dict(cam="track", fx=[R])),
 ("s06", 24.0, 27.0, dict(cam="push", fx=[L])),
 ("s07", 27.0, 29.4, dict(cam="trackL", fx=[R])),
 ("s08", 29.4, 31.4, dict(cam="hold", fx=[R, "flicker"], shake=3)),
 ("s09", 31.4, 33.5, dict(cam="push", fx=[R], use_still=True)),  # Grok take grew a second head: animate the keyframe instead
 # --- 2. THE FIRST CRACK (full band 33.5)
 ("s10", 33.5, 38.0, dict(cam="track", fx=["flicker"], shake=2)),
 ("s11", 38.0, 42.0, dict(cam="push", fx=[], trans="cut")),
 ("s12", 42.0, 45.5, dict(cam="push", fx=[])),
 ("s13", 45.5, 49.3, dict(cam="pushfast", fx=[G], on=4)),
 ("s14", 49.3, 53.2, dict(cam="panL", fx=["flicker"])),
 ("s15", 53.2, 57.0, dict(cam="push", fx=[])),
 ("s16", 57.0, 60.0, dict(cam="dutch", fx=["flicker"], shake=2)),
 ("s17", 60.0, 64.0, dict(cam="pull", fx=[], moth_path=[[0.3,0.15],[0.5,0.25],[0.62,0.18]], moth_size=40)),
 ("s18", 64.0, 68.8, dict(cam="push", fx=[L], moth_path=[[0.45,0.4],[0.55,0.3],[0.7,0.45]], moth_size=55)),
 ("s19", 68.8, 73.6, dict(cam="track", fx=[R], shake=4)),
 ("s20", 73.6, 78.3, dict(cam="pull", fx=[R], moth_path=[[0.5,0.55],[0.6,0.35],[0.8,0.2]], moth_size=45)),
 # --- 3. AWAKENING (chorus lift 78.3)
 ("s21", 78.3, 82.2, dict(cam="trackL", fx=[R, P], shake=6, on=3, trans="ink")),
 ("s22", 82.2, 84.2, dict(cam="pushfast", fx=[D, G], shake=8)),
 ("s23", 84.2, 86.2, dict(cam="hold", fx=[D, P], shake=5, on=2)),
 ("s24", 86.2, 88.2, dict(cam="panL", fx=[L])),
 ("s25", 88.2, 90.2, dict(cam="hold", fx=[D, P], shake=7, on=2)),
 ("s26", 90.2, 94.1, dict(cam="tiltU", fx=[G])),
 ("s27", 94.1, 96.1, dict(cam="push", fx=[D, G, P])),
 ("s28", 96.1, 98.0, dict(cam="dutch", fx=[R], shake=5)),
 ("s29", 98.0, 100.0, dict(cam="pushfast", fx=[D, P], shake=6)),
 ("s30", 100.0, 106.0, dict(cam="pushfast", fx=[R], shake=5, moth_path=[[0.55,0.45],[0.5,0.38],[0.48,0.3]], moth_size=50)),
 ("s31", 106.0, 117.6, dict(cam="push", fx=[L, "flicker"], clip_speed=0.42)),  # the take ends with him walking out toward camera: use its first 5 s only
 # --- drop: descent
 ("s32", 117.6, 123.0, dict(cam="push", fx=[D], trans="ink", trans_dur=0.8, clip_in=2.85, clip_speed=0.6)),  # skip the backwards-walk start of the take
 # --- 4. THE CITY UNDER THE CITY (123)
 ("s33", 123.0, 130.0, dict(cam="pull", fx=[D, G], trans="white", trans_dur=0.4)),
 ("s34", 130.0, 134.5, dict(cam="track", fx=[D])),
 ("s35", 134.5, 138.5, dict(cam="panR", fx=[D])),
 ("s36", 138.5, 142.5, dict(cam="push", fx=["flicker"])),
 ("s37", 142.5, 146.5, dict(cam="drift", fx=[D])),
 ("s38", 146.5, 151.5, dict(cam="trackL", fx=[D])),
 ("s39", 151.5, 157.0, dict(cam="tiltU", fx=[D, G])),
 ("s40", 157.0, 162.6, dict(cam="push", fx=[D, G])),
 # --- 5. MUSIC AS PROTEST (peak 162.6)
 ("s41", 162.6, 169.0, dict(cam="pull", fx=[D, G, P], trans="ink")),
 ("s42", 169.0, 173.0, dict(cam="push", fx=[D, P], shake=4)),
 ("s43", 173.0, 177.0, dict(cam="drift", fx=[D, P], shake=4, on=2)),
 ("s44", 177.0, 181.0, dict(cam="tiltU", fx=[D, P], shake=3)),
 ("s45", 181.0, 185.0, dict(cam="hold", fx=[D, P], shake=7, on=2)),
 ("s46", 185.0, 190.0, dict(cam="track", fx=[D, E, P], shake=6)),
 ("s47", 190.0, 195.0, dict(cam="pull", fx=["rings", D, G])),
 ("s48", 195.0, 200.0, dict(cam="push", fx=[L, "flicker", "rings"])),
 ("s49", 200.0, 204.0, dict(cam="panR", fx=[E, G])),
 ("s50", 204.0, 209.0, dict(cam="push", fx=[L])),
 ("s51", 209.0, 214.0, dict(cam="tiltU", fx=[E, G])),
 ("s52", 214.0, 219.5, dict(cam="pull", fx=[D, G, P], shake=4)),
 ("s53", 219.5, 225.0, dict(cam="push", fx=[E, G])),
 # --- 6. THE BREAKING (225)
 ("s54", 225.0, 231.0, dict(cam="pull", fx=["ash", G, P], trans="ink")),
 ("s55", 231.0, 236.0, dict(cam="spin", fx=[P], shake=5)),
 ("s56", 236.0, 242.0, dict(cam="tiltU", fx=["swarm", G], n=80)),
 ("s57", 242.0, 247.0, dict(cam="pushfast", fx=["rings", G, P], shake=5)),
 ("s58", 247.0, 252.0, dict(cam="track", fx=[E, P])),
 ("s59", 252.0, 258.2, dict(cam="fall", fx=[E])),
 ("s60", 258.2, 265.4, dict(cam="spin", fx=[G, D], trans="white", trans_dur=0.3)),
 ("s61", 265.4, 270.0, dict(cam="pull", fx=[G, P], shake=4)),
 ("s62", 270.0, 277.0, dict(cam="dutch", fx=[E, G, P], shake=6)),
 ("s63", 277.0, 282.0, dict(cam="pushfast", fx=[G, E], shake=3)),
 ("s64", 282.0, 289.0, dict(cam="spin", fx=["spiral", G, P], n=70)),
 ("s65", 289.0, 292.7, dict(cam="pushfast", fx=[G, P], shake=10)),
 # --- 7. THE TWIST (quiet 292.7)
 ("s66", 292.7, 300.0, dict(cam="pull", fx=[], trans="white", trans_dur=0.25)),
 ("s67", 300.0, 303.0, dict(cam="push", fx=[D])),
 ("s68", 303.0, 306.0, dict(cam="drift", fx=[D])),
 ("s69", 306.0, 309.5, dict(cam="track", fx=[D])),
 ("s70", 309.5, 313.0, dict(cam="push", fx=[D])),
 ("s71", 313.0, 316.0, dict(cam="push", fx=[G])),
 ("s72", 316.0, 319.5, dict(cam="drift", fx=[D])),
 ("s73", 319.5, 322.5, dict(cam="push", fx=[G], moth_path=[[0.85,0.1],[0.75,0.3],[0.66,0.52]], moth_size=70)),
 # --- 8. FINALE
 ("s74", 322.5, 324.6, dict(cam="rise", fx=["swarm", G], n=110)),
 ("logo", 324.6, DUR, dict()),
]
shots = []
for sid, a, b, o in S:
    d = dict(id=sid, start=round(snap(a), 3), end=round(snap(b), 3), **o)
    shots.append(d)
for x, y in zip(shots, shots[1:]): x["end"] = y["start"]
shots[-1]["end"] = DUR
# impact frames on the biggest hits inside high-energy chapters
hits = [h for h in env["hits"] if 78 < h < 292.7]
imp = [78.3, 162.6, 225.0, 258.2, 289.0]
json.dump(dict(duration=DUR, shots=shots, impacts=[round(snap(i), 3) for i in imp]), open(f"{ROOT}/shots/edit.json", "w"), indent=1)
print(len(shots), "shots")
