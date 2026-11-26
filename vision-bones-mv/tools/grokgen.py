#!/usr/bin/env python3
"""Generate keyframes with the signed-in Grok CLI (via the grok plugin companion).
Usage: grokgen.py shots.jsonl outdir [--jobs N] [--only id,id]
Each line: {"id": "...", "prompt": "...", "refs": ["refs/hero.jpg", ...]}   (refs -> image_edit)
Skips ids whose <outdir>/<id>.jpg already exists."""
import json, sys, subprocess, os, shutil, glob, argparse, concurrent.futures as cf
G = os.path.expanduser("~/.claude/plugins/cache/grok-plugin-cc/grok/1.0.0/scripts/grok-companion.mjs")
STYLE = ("Original 1990s Japanese cel-animation style for an adult seinen anime: hand-inked linework, flat muted cel shading, "
         "hand-painted backgrounds, heavy shadows, analog film grain, gritty grunge album-cover texture. Cinematic 16:9 frame. ")
ap = argparse.ArgumentParser(); ap.add_argument("shots"); ap.add_argument("out")
ap.add_argument("--jobs", type=int, default=3); ap.add_argument("--only", default="")
a = ap.parse_args()
root = os.path.dirname(os.path.abspath(a.shots)) + "/.."
os.makedirs(a.out, exist_ok=True)
items = [json.loads(l) for l in open(a.shots) if l.strip() and not l.startswith("#")]
if a.only: items = [i for i in items if i["id"] in a.only.split(",")]
def run(it):
    dst = os.path.join(a.out, it["id"] + ".jpg")
    if os.path.exists(dst): return it["id"], "skip"
    tmp = os.path.join(a.out, "_tmp_" + it["id"])
    os.makedirs(tmp, exist_ok=True)
    prompt = STYLE + it["prompt"]
    if it.get("refs"):
        cmd = ["node", G, "edit", prompt]
        for r in it["refs"]: cmd += ["--image", os.path.join(root, r)]
    else:
        cmd = ["node", G, "image", prompt]
    cmd += ["--aspect", "16:9", "--out", tmp, "--name", it["id"]]
    for attempt in range(2):
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        files = sorted(glob.glob(tmp + "/*.jpg") + glob.glob(tmp + "/*.png"))
        if files:
            subprocess.run(["magick", files[0], "-resize", "1920x1080^", "-gravity", "center", "-extent", "1920x1080", "-quality", "92", dst])
            shutil.rmtree(tmp, ignore_errors=True)
            return it["id"], "ok"
    open(os.path.join(a.out, it["id"] + ".err"), "w").write(p.stdout + p.stderr)
    return it["id"], "FAIL"
with cf.ThreadPoolExecutor(a.jobs) as ex:
    for i, s in ex.map(run, items): print(i, s, flush=True)
