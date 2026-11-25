# -*- coding: utf-8 -*-
"""Shared slide components on top of lib."""
from lib import *
import math

NEXT_CROP = (0, 0, 0, 0.40527)   # "כללית NEXT" wordmark crop used in the original deck

SECTIONS = {}
def section(n):
    if n <= 7: return 'רפואת העתיד · חזון'
    if n <= 10: return 'פלטפורמה מחשובית אחודה'
    if n <= 16: return 'AI PRO · C-Pi'
    if n <= 21: return 'דאטה ניטורי'
    if n <= 27: return 'סוכני AI'
    if n <= 29: return 'חדשנות קלינית'
    if n <= 36: return 'דיגיטל ורפואה מרחוק'
    if n <= 39: return 'Clalit AI Factory'
    return 'סיכום'

def head(s, n, title, sub=None, eyebrow=True, logo=True, **kw):
    ids = s.title(title, sub=sub, eyebrow=section(n) if eyebrow is True else eyebrow, **kw)
    if logo: s.logo()
    s.num(n)
    return ids

def intro(s, ids, extra=()):
    """standard title reveal (auto, quick)"""
    fx = [rise(ids['title'], 0, 550, 0.02)]
    if 'eyebrow' in ids: fx.append(fade(ids['eyebrow'], 0, 400))
    if 'sub' in ids: fx.append(fade(ids['sub'], 180, 500))
    s.anim.auto(*fx, *extra)

def card(s, x, y, w, h, fill=C.WHITE, line=None, r=0.14, shadow='md', name=None):
    return s.rect(x, y, w, h, fill, line if line is not None else dict(c=C.LINE, w=0.5, a=0.6), r=r, shadow=shadow, name=name)

def iso_slab(s, cx, cy, w, t, top, left, right, name=None, line=None):
    """isometric slab: top rhombus centred at (cx,cy) of width w (depth w/2), thickness t"""
    hw, hh = w/2, w/4
    T = [(cx, cy-hh), (cx+hw, cy), (cx, cy+hh), (cx-hw, cy)]
    g = s.group(name or 'slab')
    with g:
        s.path([(cx-hw, cy), (cx, cy+hh), (cx, cy+hh+t), (cx-hw, cy+t)], fill=left, closed=True, line=line)
        s.path([(cx, cy+hh), (cx+hw, cy), (cx+hw, cy+t), (cx, cy+hh+t)], fill=right, closed=True, line=line)
        s.path(T, fill=top, closed=True, line=line)
    return g.id

def iso_pt(cx, cy, w, u, v):
    """point on rhombus top: u,v in [-1,1] along the two iso axes"""
    hw, hh = w/2, w/4
    return (cx + (u - v) * hw/2, cy + (u + v) * hh/2)

def emblem(s, cx, cy, d, icon, badge=None, a1=200, a2=320, accent=C.LIME, name=None):
    g = s.group(name or f'emblem {icon}')
    with g:
        s.oval(cx, cy, d, dict(radial=[(0, C.WHITE), (100, C.TEAL_T)], c=(35, 30)), dict(c=C.LINE, w=0.75), shadow='sm')
        s.arc(cx, cy, d + 0.16, a1, a2, 0.05, C.TEAL)
        s.arc(cx, cy, d + 0.16, a2 + 14, a2 + 50, 0.05, accent)
        s.oval(cx, cy, d*0.62, dict(grad=[(0, C.TEAL), (100, C.PETROL)], ang=45), None)
        s.icon(icon, cx, cy, d*0.34, C.WHITE, 1.6)
        if badge:
            bx, by = cx + d*0.34, cy - d*0.34
            s.oval(bx, by, d*0.3, C.LIME, dict(c=C.WHITE, w=1.5), shadow='sm')
            s.icon(badge, bx, by, d*0.17, C.PETROL, 2.2)
    return g.id

def circle_pts(cx, cy, r, n=4):
    """cubic bezier approximation of a full circle starting at top, clockwise (as mpath_curve segments)"""
    k = 0.5523 * r
    P = [(cx, cy-r), (cx+r, cy), (cx, cy+r), (cx-r, cy)]
    segs = [((cx+k, cy-r), (cx+r, cy-k), P[1]), ((cx+r, cy+k), (cx+k, cy+r), P[2]),
            ((cx-k, cy+r), (cx-r, cy+k), P[3]), ((cx-r, cy-k), (cx-k, cy-r), P[0])]
    return P[0], segs

def dot(s, cx, cy, d=0.11, c=C.LIME, glow=True, name='data dot'):
    return s.oval(cx, cy, d, c, None, glow=(c, 6, 0.55) if glow else None, name=name)

def badge(s, x, y, txt, kind='dev', size=10.5, w=None):
    """status badge: dev / pilot / review"""
    cols = {'dev': (C.LIME_T, C.GREEN, C.LIME), 'review': (C.AMBER_T, '8A5A00', C.AMBER), 'future': (C.TEAL_T, C.PETROL, C.TEAL)}
    f, tc, lc = cols[kind]
    if s.dark: f = (lc, 0.16); tc = C.WHITE if kind != 'dev' else C.LIME
    w = w or (0.2 + len(txt) * size * 0.0105)
    return s.chip(x, y, w, 0.3, txt, f, tc, size=size, line=dict(c=lc, w=0.75))

def agent_mark(s, cx, cy, d=1.0, dark=None, name='AI agent'):
    """consistent AI-agent symbol used across agent slides (no robots)"""
    dark = s.dark if dark is None else dark
    g = s.group(name)
    with g:
        s.oval(cx, cy, d*1.32, None, dict(c=C.LIME, w=1, a=0.55, dash='sysDash'))
        s.oval(cx, cy, d, dict(grad=[(0, C.TEAL), (100, C.PETROL)], ang=45), dict(c=C.LIME, w=1.75), shadow='md', glow=(C.LIME, 8, 0.25))
        s.icon('sparkles', cx, cy - d*0.06, d*0.42, C.WHITE, 1.7)
        s.text(cx - d/2, cy + d*0.2, d, d*0.22, [[('AI Agent', {'lang': 'en-US'})]], size=max(7, d*8.5), bold=True, color=C.LIME, align='ctr', rtl=False, anchor='ctr')
    return g.id

def contain(s, src, x, y, w, h, pad=0.0, name=None, r=None, shadow=None):
    """place image fully inside box (keeps aspect), centred"""
    p = src if os.path.isabs(src) else os.path.join(MEDIA, src)
    iw, ih = Image.open(p).size
    bw, bh = w - 2*pad, h - 2*pad
    k = min(bw/iw, bh/ih); pw, ph = iw*k, ih*k
    return s.pic(src, x + (w - pw)/2, y + (h - ph)/2, pw, ph, name=name, r=r, shadow=shadow)

def trimmed(src):
    """copy of a media image cropped to its visible content (drops transparent / white margins)"""
    import numpy as np
    out = os.path.join(CACHE, 'trim_' + os.path.basename(src).split('&')[0] + '.png')
    if not os.path.exists(out):
        im = Image.open(os.path.join(MEDIA, src)).convert('RGBA'); a = np.array(im)
        vis = (a[..., 3] > 25) & (a[..., :3].astype(int).sum(-1) < 735)
        ys, xs = np.where(vis)
        im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)).save(out)
    return out
