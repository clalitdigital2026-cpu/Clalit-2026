#!/usr/bin/env python3
"""Animate each keyframe into a Grok Imagine Video clip (xAI API, image-to-video).
Duration = the shot's slot in shots/edit.json (rounded up, 1-15 s). Skips existing clips.
Usage: XAI_API_KEY=... grokvideo.py [--jobs 4] [--only s02,s03]"""
import json, os, math, subprocess, argparse, concurrent.futures as cf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.expanduser("~/.claude/skills/grok-imagine-video/scripts/video.py")
STYLE = " Keep the exact hand-drawn 1990s seinen cel-anime look, linework and colours of the image. Characters keep the same faces and clothes. No text, no captions."
ap = argparse.ArgumentParser(); ap.add_argument("--jobs", type=int, default=4); ap.add_argument("--only", default="")
a = ap.parse_args()
edit = json.load(open(f"{ROOT}/shots/edit.json")); motion = json.load(open(f"{ROOT}/shots/motion.json"))
shots = [s for s in edit["shots"] if s["id"] in motion]
if a.only: shots = [s for s in shots if s["id"] in a.only.split(",")]
os.makedirs(f"{ROOT}/clips", exist_ok=True)
def run(s):
    out = f"{ROOT}/clips/{s['id']}.mp4"
    if os.path.exists(out): return s["id"], "skip"
    dur = min(15, max(2, math.ceil(s["end"] - s["start"] + 0.2)))
    cmd = ["python3", SCRIPT, "--prompt", motion[s["id"]] + STYLE, "--image", f"{ROOT}/keyframes/{s['id']}.jpg",
           "--duration", str(dur), "--resolution", "720p", "--output", out]
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=1500)
    if os.path.exists(out): return s["id"], f"ok {dur}s"
    open(f"{ROOT}/clips/{s['id']}.err", "w").write(p.stdout + p.stderr)
    return s["id"], "FAIL"
with cf.ThreadPoolExecutor(a.jobs) as ex:
    for i, r in ex.map(run, shots): print(i, r, flush=True)
