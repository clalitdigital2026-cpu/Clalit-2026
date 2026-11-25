# -*- coding: utf-8 -*-
"""Redesigned slides 10 and 15 (more visual / cinematic)."""
from kit import *
from slides_b import countup
import random

# ---------------------------------------------------------------- 10 ONE WIDE PLATFORM (dark ecosystem, same architecture)
def s10(d, n=10):
    s = d.new(dark=True, bg=dict(radial=[(0, '0C4F5A'), (55, C.NIGHT2), (100, C.NIGHT)], c=(35, 45)))
    ids = head(s, n, 'פלטפורמה מחשובית אחודה', sub='פלטפורמה אחת רחבה')
    intro(s, ids)
    # subtle tech grid
    grid = s.group('grid')
    with grid:
        for k in range(9):
            s.line(0.6 + k*1.52, 1.55, 0.6 + k*1.52, 7.0, C.AQUA, 0.5, a=0.07)
    # ---------------- unified platform (left) : glass core
    px, py, pw, ph = 0.75, 1.95, 7.0, 3.3
    halo = s.rect(px - 0.08, py - 0.08, pw + 0.16, ph + 0.16, None, dict(c=dict(grad=[(0, C.LIME), (50, C.AQUA), (100, C.TEAL)], ang=20), w=2),
                  r=0.28, glow=(C.AQUA, 16, 0.3), name='platform glow')
    plat = s.group('unified platform')
    with plat:
        s.rect(px, py, pw, ph, dict(grad=[(0, '0E4852'), (100, '072A31')], ang=90), dict(c='1F5C66', w=0.75), r=0.24, shadow='dk')
        s.rect(px + pw/2 - 1.6, py - 0.24, 3.2, 0.48, dict(grad=[(0, C.LIME), (100, '7DB800')], ang=0), None, r=0.24, shadow='md')
        s.text(px + pw/2 - 1.6, py - 0.24, 3.2, 0.48, ['הפלטפורמה האחודה'], size=15, bold=True, color=C.NIGHT, align='ctr', anchor='ctr', font=C.FONT_XB)
    mods = [('מערכת מידע קליני', 'monitor-dot', 0, 0), ('תרופות', 'pill', 1, 0), ('מעבדות', 'test-tubes', 2, 0), ('דימות (RIS)', 'scan', 3, 0),
            ('אדמיניסטרציה', 'clipboard-list', 0, 1), ('דשבורדים', 'chart-column', 1, 1)]
    mids = []
    mw, mh = 1.5, 1.2
    for t, ic, c, r in mods:
        cx = px + pw - 0.98 - c*1.67; cy = py + 0.95 + r*1.45
        g = s.group(f'module {t}')
        with g:
            s.rect(cx - mw/2, cy - 0.55, mw, mh, (C.WHITE, 0.06), dict(c=C.AQUA, w=0.75, a=0.45), r=0.16)
            s.oval(cx, cy - 0.12, 0.6, dict(grad=[(0, C.TURQ), (100, C.PETROL)], ang=45), dict(c=C.AQUA, w=1, a=0.7), glow=(C.AQUA, 6, 0.3))
            s.icon(ic, cx, cy - 0.12, 0.3, C.WHITE, 1.9)
            s.text(cx - mw/2 + 0.05, cy + 0.24, mw - 0.1, 0.36, [t], size=11.5, bold=True, color=C.WHITE, align='ctr', anchor='ctr', lnspc=90)
        mids.append(g.id)
    # core statement chip in free cell
    core = s.group('one platform chip')
    with core:
        s.rect(px + 0.25, py + 1.95, 3.25, 1.1, (C.LIME, 0.1), dict(c=C.LIME, w=1, dash='dash', a=0.7), r=0.16)
        s.icon('layers', px + 3.12, py + 2.5, 0.36, C.LIME, 1.9)
        s.text(px + 0.35, py + 1.95, 2.5, 1.1, ['פלטפורמה אחת רחבה'], size=16, bold=True, color=C.LIME, anchor='ctr', align='ctr')
    # ---------------- external solutions (right) : orbit zone
    ex0, ey0, ew, eh = 8.75, 1.95, 3.98, 3.3
    zone = s.group('external zone')
    with zone:
        s.rect(ex0, ey0, ew, eh, (C.WHITE, 0.03), dict(c=C.AQUA, w=1, dash='dash', a=0.5), r=0.24)
        s.rect(ex0 + ew/2 - 1.0, ey0 - 0.22, 2.0, 0.44, '0A3A42', dict(c=C.AQUA, w=1), r=0.22)
        s.text(ex0 + ew/2 - 1.0, ey0 - 0.22, 2.0, 0.44, ['פתרונות חוץ'], size=14, bold=True, color=C.AQUA, align='ctr', anchor='ctr')
    hubx, huby = ex0 + 0.62, ey0 + eh/2
    exts = [('מערכות קליניות ייעודיות ומיכשור רפואי', 'folder-plus', 10.25, 2.75), ('ERP', 'server-cog', 11.95, 2.75),
            ('CRM', 'contact', 11.95, 4.35), ('MARKET PLACE AI', 'shopping-cart', 10.25, 4.35)]
    eids = []; elines = []
    for t, ic, cx, cy in exts:
        elines.append(s.path(bez((hubx, huby), (cx - 0.36, cy - 0.12), 0.5), line=dict(c=C.AQUA, w=1, a=0.55), name='external link'))
        g = s.group(f'external {t}')
        with g:
            s.oval(cx, cy - 0.12, 0.66, '0A3A42', dict(c=C.AQUA, w=1.5), glow=(C.AQUA, 6, 0.3))
            s.icon(ic, cx, cy - 0.12, 0.32, C.AQUA, 1.9)
            heb = is_heb(t)
            s.text(cx - 0.95, cy + 0.26, 1.9, 0.55, [t], size=11, bold=True, color=C.WHITE, align='ctr', lnspc=90, rtl=heb)
        eids.append(g.id)
    hub = s.oval(hubx, huby, 0.26, C.AQUA, dict(c=C.WHITE, w=1.5), glow=(C.AQUA, 8, 0.6), name='external hub')
    # bidirectional connection platform <-> external
    dbl = s.shape(7.83, huby - 0.17, 0.86, 0.34, 'leftRightArrow', dict(grad=[(0, C.LIME), (100, C.AQUA)], ang=0), None, glow=(C.LIME, 6, 0.4), name='bidirectional')
    pA = dot(s, 7.85, huby, 0.1, C.WHITE); pB = dot(s, 8.65, huby, 0.1, C.WHITE)
    # ---------------- data lake (shared infrastructure)
    lx, ly, lw = 2.3, 5.95, 8.0
    lake = s.group('data lake')
    with lake:
        s.shape(lx, ly, lw, 1.0, 'can', dict(grad=[(0, '1AA3AE'), (55, C.TEAL), (100, C.PETROL_D)], ang=90), dict(c=C.AQUA, w=1), adj={'adj': 32000}, shadow='dk', glow=(C.AQUA, 12, 0.3))
        s.shape(lx + lw*0.19, ly + 0.07, lw*0.62, 0.2, 'ellipse', None, dict(c=C.WHITE, w=0.75, a=0.4))
        s.shape(lx + lw*0.34, ly + 0.12, lw*0.32, 0.1, 'ellipse', None, dict(c=C.LIME, w=0.75, a=0.6))
        s.icon('database', lx + lw/2 - 1.05, ly + 0.62, 0.32, C.LIME, 2)
        s.text(lx + lw/2 - 0.8, ly + 0.4, 2.2, 0.48, [[('Data Lake', {'lang': 'en-US'})]], size=20, bold=True, color=C.WHITE, align='l', rtl=False, anchor='ctr', font=C.FONT_XB)
    ripple = s.shape(lx + lw*0.34, ly + 0.12, lw*0.32, 0.1, 'ellipse', None, dict(c=C.LIME, w=1.5), name='lake ripple')
    # links into the lake (same 4 links as source: 3 from platform, 1 from external)
    cons = []; parts = []
    for i, (x0, y0, x1) in enumerate([(2.6, py + ph, 3.45), (4.75, py + ph, 4.85), (6.9, py + ph, 6.25), (10.74, ey0 + eh, 8.85)]):
        pts = bez((x0, y0 + 0.02), (x1, 6.0), 0.55, 'v')
        cons.append(s.path(pts, line=dict(c=C.LIME if i < 3 else C.AQUA, w=1.5, a=0.8), name=f'lake link {i}'))
        for q in range(2):
            p = dot(s, x0, y0, 0.1, C.LIME if i < 3 else C.AQUA)
            parts.append(flow(p, mpath_curve((x0, y0 + 0.02), [pts[1]]), 900 + i*250 + q*1100, 1500, repeat='indefinite'))
    # ---------------- animation
    s.anim.click(zoom(plat.id, 0, 700, 0.9), fade(halo, 300, 700), *[zoom(m, 350 + i*110, 450, 0.7) for i, m in enumerate(mids)], fade(core.id, 1100, 500))
    s.anim.click(fade(zone.id, 0, 500), zoom(hub, 200, 400, 0.3), *[wipe(l, 300 + i*120, 450, 'right') for i, l in enumerate(elines)],
                 *[zoom(e, 450 + i*120, 450, 0.6) for i, e in enumerate(eids)], wipe(dbl, 1000, 500, 'right'),
                 flow(pA, mpath(7.85, huby, 8.65, huby), 1500, 1200, repeat='indefinite'), flow(pB, mpath(8.65, huby, 7.85, huby), 2100, 1200, repeat='indefinite'))
    s.anim.click(rise(lake.id, 0, 700, 0.05), *[wipe(c, 400 + i*120, 500, 'down') for i, c in enumerate(cons)], *parts,
                 fade(ripple, 900, 300), grow(ripple, 900, 2400, 1.8), fadeout(ripple, 2600, 700))
    s.transition = 'fade'
    return s

# ---------------------------------------------------------------- 15 C-Pi WOMEN (dark data dashboard)
WAYS15 = [('אפליקציה לטיוב אבחנות', 'טיוב רובסטי, משמעותי ופשוט יותר של האבחנות', 'circle-check'),
          ('מיפוי דאטה מסודר', 'איפה כל משתנה נמצא בנתונים ולוגיקת שליפה', 'database'),
          ('מקווים מנחים רפואיים ללוגיקה', 'הדרך מגיידליין לעץ או למטריצה קצרה משמעותית', 'zap'),
          ('בדיקות איכות לעצים', 'איתור מקרי קצה וענפים חסרים בלוגיקה', 'search'),
          ('עבודה עם דימים שבונים את המלצות המערכת', 'מעל 1,000 הערות והמלצות מקושרות לדימים ממוספרים', 'link'),
          ('תיקון עצים מבוקר', 'זיהוי פשוט של נקודות לתיקון, מבלי להכניס בעיות חדשות', 'wrench')]
DOM15 = ['סקר ביוכימי', 'בדיקות גנטיות', 'סרולוגיה: CMV, טוקסו, פרבו-וירוס', 'בדיקות סונר', 'סקירות', 'חיסונים', 'סוכרת', 'הפרעות לחץ דם בהריון', 'תירואיד', 'אנמיה', 'תרומבוציטופניה', 'מחלות רקע נוספות']
PANEL = '0A3A42'

def s15(d, n=15):
    s = d.new(dark=True)
    ids = head(s, n, [[('C-Pi', {'lang': 'en-US', 'color': C.LIME}), (' נשים: פיתוח מואץ בעזרת בינה מלאכותית', {})]])
    intro(s, ids)
    kw, kh, ky, gap = 3.91, 1.95, 1.55, 0.2
    X = [SW - MX - kw - i*(kw + gap) for i in range(3)]
    steps = []
    # ---- KPI 1 : 13+ clinical domains  -> ring of 13 segments
    x = X[0]
    c1 = s.rect(x, ky, kw, kh, PANEL, dict(c=C.AQUA, w=0.75, a=0.4), r=0.2, shadow='dk', name='kpi 13')
    rcx, rcy, rd = x + 0.95, ky + kh/2, 1.35
    segs = [s.arc(rcx, rcy, rd, (-90 + k*360/13 + 3) % 360, (-90 + (k+1)*360/13 - 3) % 360, 0.13, C.LIME if k < 13 else C.TEAL, name=f'domain seg {k}') for k in range(13)]
    ic1 = s.icon('stethoscope', rcx, rcy, 0.42, C.AQUA, 1.8)
    fin1, fx1 = countup(s, x + 1.75, ky + 0.15, kw - 1.95, 1.0, ['1+', '3+', '5+', '7+', '9+', '11+', '12+'], [('13+', {'lang': 'en-US'})], 50, C.LIME, PANEL, align='r', start=200, step=80, name='13+')
    l1 = s.text(x + 1.75, ky + 1.12, kw - 1.95, 0.7, ['תחומים קליניים', 'בעצים ובמטריצות'], size=12.5, bold=True, color='CDEDEC', align='r', lnspc=95)
    steps.append([fade(c1, 0, 400), *[wheel(sg, 150 + k*70, 250) for k, sg in enumerate(segs)], fade(ic1, 150, 400), *fx1, fade(l1, 400, 400)])
    # ---- KPI 2 : 1,000+ comments / final leaves -> decision tree whose leaves light up
    x = X[1]
    c2 = s.rect(x, ky, kw, kh, PANEL, dict(c=C.AQUA, w=0.75, a=0.4), r=0.2, shadow='dk', name='kpi 1000')
    tx0, ty0, tw_ = x + 0.2, ky + 0.3, 1.5
    root = (tx0 + tw_/2, ty0 + 0.08)
    l2pts = [(tx0 + tw_*0.25, ty0 + 0.62), (tx0 + tw_*0.75, ty0 + 0.62)]
    l3pts = [(tx0 + tw_*f, ty0 + 1.0) for f in (0.07, 0.36, 0.64, 0.93)]
    leaves = [(tx0 - 0.05 + (tw_ + 0.1)*k/7, ty0 + 1.42) for k in range(8)]
    tree = s.group('decision tree')
    with tree:
        for p in l2pts: s.line(*root, *p, C.AQUA, 1.25, a=0.7)
        for i, p in enumerate(l3pts): s.line(*l2pts[i // 2], *p, C.AQUA, 1.25, a=0.7)
        for i, p in enumerate(leaves): s.line(*l3pts[i // 2], *p, C.AQUA, 1, a=0.5)
        for p in [root] + l2pts + l3pts: s.oval(*p, 0.14, C.TEAL, dict(c=C.AQUA, w=1))
    leaf_ids = [s.oval(*p, 0.13, C.LIME, None, glow=(C.LIME, 5, 0.6), name='leaf') for p in leaves]
    fin2, fx2 = countup(s, x + 1.75, ky + 0.15, kw - 1.95, 1.0, ['50+', '150+', '300+', '450+', '600+', '750+', '880+', '960+'], [('1,000+', {'lang': 'en-US'})], 42, C.LIME, PANEL, align='r', start=200, step=75, name='1000+')
    l2 = s.text(x + 1.75, ky + 1.12, kw - 1.95, 0.7, ['הערות והמלצות /', 'עלים סופיים של עצים'], size=12.5, bold=True, color='CDEDEC', align='r', lnspc=95)
    steps.append([fade(c2, 0, 400), wipe(tree.id, 100, 800, 'down'), *[zoom(lf, 600 + k*90, 300, 0.2) for k, lf in enumerate(leaf_ids)], *fx2, fade(l2, 400, 400)])
    # ---- KPI 3 : ~one year from development to production -> journey track
    x = X[2]
    c3 = s.rect(x, ky, kw, kh, PANEL, dict(c=C.AQUA, w=0.75, a=0.4), r=0.2, shadow='dk', name='kpi year')
    val3 = s.text(x + 1.75, ky + 0.15, kw - 1.95, 1.0, [[('~', {'lang': 'en-US'}), ('שנה', {})]], size=50, bold=True, color=C.LIME, align='r', anchor='ctr', font=C.FONT_XB, name='~שנה')
    l3 = s.text(x + 1.75, ky + 1.12, kw - 1.95, 0.7, ['מתחילת הפיתוח', 'ועד עלייה לייצור'], size=12.5, bold=True, color='CDEDEC', align='r', lnspc=95)
    jy = ky + kh/2
    trk = s.line(x + 1.5, jy, x + 0.4, jy, '2E6A73', 3, name='journey track')
    prog = s.line(x + 1.5, jy, x + 0.4, jy, C.LIME, 3, name='journey progress')
    st = s.group('start')
    with st:
        s.oval(x + 1.5, jy, 0.52, C.TEAL, dict(c=C.AQUA, w=1)); s.icon('code-xml', x + 1.5, jy, 0.26, C.WHITE, 2)
    en = s.group('production')
    with en:
        s.oval(x + 0.4, jy, 0.52, C.LIME, dict(c=C.WHITE, w=1.5), glow=(C.LIME, 8, 0.5)); s.icon('rocket', x + 0.4, jy, 0.26, C.NIGHT, 2)
    steps.append([fade(c3, 0, 400), fade(st.id, 100, 300), fade(trk, 100, 300), wipe(prog, 300, 1100, 'left'), zoom(en.id, 1300, 450, 0.4),
                  rise(val3, 300, 600, 0.03), fade(l3, 500, 400)])
    # ---- six AI accelerators around an AI core
    hdr = s.text(4.32, 3.72, 8.23, 0.32, [[('כך הבינה המלאכותית מאיצה את הפיתוח', {})]], size=13, bold=True, color=C.AQUA, align='r')
    cx, cy = 8.62, 5.35
    ring = s.oval(cx, cy, 1.55, None, dict(c=C.LIME, w=1, dash='sysDash', a=0.6), name='core ring')
    core = s.group('AI core')
    with core:
        s.oval(cx, cy, 1.2, dict(grad=[(0, C.TEAL), (100, C.PETROL)], ang=45), dict(c=C.LIME, w=1.75), glow=(C.LIME, 12, 0.35))
        s.text(cx - 0.55, cy - 0.3, 1.1, 0.6, [[('AI', {'lang': 'en-US'})]], size=28, bold=True, color=C.WHITE, align='ctr', anchor='ctr', rtl=False, font=C.FONT_XB)
    ch_ = 0.92
    pos = [(10.01, 4.15), (10.01, 4.9 + 0.0), (10.01, 5.65), (4.5, 4.15), (4.5, 4.9), (4.5, 5.65)]
    pos = [(9.83, 4.1), (9.83, 5.07), (9.83, 6.04), (4.32, 4.1), (4.32, 5.07), (4.32, 6.04)]
    nodes = []; links = []; pulses = []
    for i, ((t, ds, ic), (x, y)) in enumerate(zip(WAYS15, pos)):
        right = x > cx
        cw_ = 2.9 if right else 3.05
        a = (x if right else x + cw_, y + ch_/2)
        pth = bez((cx + (0.62 if right else -0.62), cy), a, 0.5)
        links.append(s.path(pth, line=dict(c=C.AQUA, w=1.25, a=0.7), name='accelerator link'))
        p = dot(s, *pth[0], 0.09, C.LIME); pulses.append(flow(p, mpath_curve(pth[0], [pth[1]]), 600 + i*220, 1300, repeat='indefinite'))
        g = s.group(f'way {t}')
        with g:
            s.rect(x, y, cw_, ch_, (C.WHITE, 0.06), dict(c=C.AQUA, w=0.75, a=0.45), r=0.14)
            s.oval(x + cw_ - 0.34, y + ch_/2, 0.46, (C.AQUA, 0.18), dict(c=C.AQUA, w=0.75))
            s.icon(ic, x + cw_ - 0.34, y + ch_/2, 0.24, C.AQUA, 2)
            s.text(x + 0.1, y + 0.04, cw_ - 0.74, 0.44, [t], size=11, bold=True, color=C.WHITE, anchor='ctr', lnspc=85)
            s.text(x + 0.1, y + 0.48, cw_ - 0.74, 0.42, [ds], size=9, color='B7D3D3', anchor='t', lnspc=92)
        nodes.append(g.id)
    # ---- clinical domains (compact column)
    dp = s.group('domains panel')
    with dp:
        s.rect(MX, 3.72, 3.55, 3.26, (C.WHITE, 0.04), dict(c=C.LIME, w=0.75, a=0.45), r=0.18)
        s.text(MX + 0.15, 3.8, 3.25, 0.32, ['דוגמאות לתכנים מכוסים:'], size=12, bold=True, color=C.LIME)
    chips = []
    xr = MX + 3.42; y = 4.2
    for t in DOM15:
        w = 0.3 + len(t) * 0.078
        if xr - w < MX + 0.12:
            xr = MX + 3.42; y += 0.4
        chips.append(s.chip(xr - w, y, w, 0.32, t, (C.WHITE, 0.08), C.WHITE, size=10, bold=False, line=dict(c=C.AQUA, w=0.5, a=0.5)))
        xr -= w + 0.08
    # ---- animation
    for st_ in steps: s.anim.click(*st_)
    s.anim.click(fade(hdr, 0, 300), zoom(core.id, 100, 600, 0.6), fade(ring, 300, 500), spin(ring, 300, 30000),
                 *[x for i, (l, g) in enumerate(zip(links, nodes)) for x in (wipe(l, 500 + i*150, 400, 'right' if pos[i][0] > cx else 'left'), rise(g, 650 + i*150, 450, 0.02))], *pulses)
    s.anim.click(fade(dp.id, 0, 400), *[fade(c, 150 + i*50, 300) for i, c in enumerate(chips)])
    return s
