import sys, importlib; sys.path.insert(0, '.')
from lib import *
from pptx import Presentation as P
ORIG = P('/home/user/Clalit-2026/source/SUMIT.pptx')
def orig_notes(i):
    sl = ORIG.slides[i-1]
    if sl.has_notes_slide:
        t = sl.notes_slide.notes_text_frame.text.strip()
        return t
    return ''
import slides_a
mods = [slides_a]
for m in ['slides_b','slides_c','slides_d']:
    try: mods.append(importlib.import_module(m))
    except ModuleNotFoundError: pass
only = [int(a) for a in sys.argv[1:]] if len(sys.argv) > 1 else None
d = Deck()
for n in range(1, 42):
    if only and n not in only: continue
    fn = None
    for m in mods:
        fn = getattr(m, f's{n:02d}', None) or fn
    if fn is None: continue
    s = fn(d)
    s.notes(orig_notes(n))
    s.finalize()
out = '/tmp/claude-0/x/out.pptx' if only else '/home/user/Clalit-2026/output/SUMIT_redesign.pptx'
d.prs.save(out); print('saved', out, len(d.slides))
