# -*- coding: utf-8 -*-
from kit import *
from slides_b import countup
import random

# ---------------------------------------------------------------- 28 COMPUTER VISION IN IMAGING
def scan_tile(s, x, y, w, h, kind):
    """stylised imaging illustration (illustrative only)"""
    els = []
    g = s.group(f'scan art {kind}')
    with g:
        s.rect(x, y, w, h, dict(radial=[(0, '12333A'), (100, '050F12')], c=(50, 45)), dict(c='1F4A52', w=0.75), r=0.12)
        cx, cy = x + w/2, y + h/2
        bone = 'D9E7E8'
        if kind == 'bone':
            s.shape(cx - 0.12, y + 0.18, 0.24, h - 0.36, 'roundRect', (bone, 0.85), None, adj={'adj': 50000})
            s.oval(cx, y + 0.26, 0.42, (bone, 0.85), None); s.oval(cx, y + h - 0.26, 0.42, (bone, 0.85), None)
            s.shape(cx + 0.35, y + 0.3, 0.16, h - 0.6, 'roundRect', (bone, 0.55), None, adj={'adj': 50000})
        elif kind == 'chest':
            s.shape(cx - 0.05, y + 0.15, 0.1, h - 0.3, 'roundRect', (bone, 0.8), None, adj={'adj': 50000})
            for k in range(6):
                yy = y + 0.3 + k*0.2
                s.shape(cx - 0.85, yy, 0.78, 0.32, 'arc', None, dict(c=bone, w=2.2, a=0.75), adj={'adj1': 10800000, 'adj2': 16200000})
                s.shape(cx + 0.07, yy, 0.78, 0.32, 'arc', None, dict(c=bone, w=2.2, a=0.75), adj={'adj1': 16200000, 'adj2': 0})
        elif kind == 'echo':
            s.shape(cx - 0.85, y + 0.12, 1.7, 1.7, 'pie', dict(radial=[(0, '6E8A8E', 0.9), (100, '1B3338', 0.6)], c=(50, 0)), None, adj={'adj1': 3600000, 'adj2': 7200000})
            s.icon('heart', cx, y + h*0.62, 0.42, 'E8F1F1', 1.4)
        elif kind == 'ct':
            for k, dd in enumerate([1.35, 1.05, 0.75]):
                s.oval(cx, cy, dd, None, dict(c=bone, w=1.5, a=0.35 + k*0.2))
            s.oval(cx, cy, 0.4, (bone, 0.25), None)
            s.icon('heart-pulse', cx, cy, 0.3, 'E8F1F1', 1.6)
        elif kind == 'mammo':
            s.shape(cx - 0.55, y + 0.2, 1.1, h - 0.4, 'flowChartDelay', dict(radial=[(0, '9DB1B4', 0.75), (100, '23383C', 0.5)], c=(20, 50)), None, flipH=True)
            s.oval(cx - 0.1, cy + 0.05, 0.14, ('FFFFFF', 0.6), None)
    els.append(g.id)
    roi = s.group(f'roi {kind}')
    with roi:
        rx, ry = {'bone': (cx - 0.3, y + 0.55), 'chest': (cx + 0.15, y + 0.45), 'echo': (cx - 0.3, y + h*0.42), 'ct': (cx - 0.3, cy - 0.3), 'mammo': (cx - 0.38, cy - 0.22)}[kind]
        rw = 0.6
        for (ax, ay, bx, by, ex, ey) in [(rx, ry + 0.15, rx, ry, rx + 0.15, ry), (rx + rw - 0.15, ry, rx + rw, ry, rx + rw, ry + 0.15),
                                         (rx + rw, ry + rw - 0.15, rx + rw, ry + rw, rx + rw - 0.15, ry + rw), (rx + 0.15, ry + rw, rx, ry + rw, rx, ry + rw - 0.15)]:
            s.path([(ax, ay), (bx, by), (ex, ey)], line=dict(c=C.LIME, w=1.75))
    beam = s.rect(x + 0.06, y + 0.06, w - 0.12, 0.05, (C.AQUA, 0.85), None, glow=(C.AQUA, 6, 0.6), name='scan line')
    return g.id, roi.id, beam

def s28(d, n=28):
    s = d.new(dark=True)
    ids = head(s, n, [[('שילוב כלי ', {}), ('AI', {'lang': 'en-US'}), (' בדימות ברפואת העתיד – ', {}), ('Computer Vision', {'lang': 'en-US', 'color': C.LIME})]], sub=[[('כלי ', {}), ('AI', {'lang': 'en-US'}), (' לפענוח הדמיות', {})]])
    intro(s, ids)
    lab1 = s.text(MX, 1.9, SW - 2*MX, 0.32, ['הפתרון'], size=13, bold=True, color=C.AQUA)
    tiles = [('bone', 'GLEAMER', 'Bone View', 'דימות של עצמות'), ('chest', 'GLEAMER', 'Chest View', 'צילומי חזה'),
             ('echo', 'TOMTEC', None, 'אקו לב'), ('ct', 'FFR\\CARDIAC CT', None, None),
             ('mammo', 'MIRAI', None, 'איתור מטופלות בסיכון גבוה לסרטן שד לפי ממוגרפיה לביצוע סקר')]
    tw = (SW - 2*MX - 4*0.18) / 5
    steps = []
    for i, (k, prod, sub, desc) in enumerate(tiles):
        x = SW - MX - tw - i*(tw + 0.18); y = 2.28
        art, roi, beam = scan_tile(s, x, y, tw, 1.95, k)
        cap = s.group(f'caption {prod}')
        with cap:
            s.text(x, y + 2.03, tw, 0.32, [[(prod, {'lang': 'en-US'}), ((' · ' + sub) if sub else '', {'lang': 'en-US', 'color': C.AQUA})]], size=12.5, bold=True, color=C.WHITE, align='r', rtl=False if False else True)
            if desc: s.text(x, y + 2.35, tw, 0.6, [desc], size=10.5, color='B7D3D3', align='r', lnspc=100)
        steps.append([fade(art, 0, 500), fade(cap.id, 200, 500), fade(beam, 400, 200), flow(beam, mpath(x, y + 0.06, x, y + 1.82), 400, 1800, repeat=2, fade=True), zoom(roi, 1500, 400, 1.4)])
    tag = s.chip(MX, 1.92, 0.8, 0.26, 'המחשה', ('F2B233', 0.18), 'F2B233', size=9, line=dict(c='F2B233', w=0.75))
    # roadmap
    lab2 = s.text(MX, 5.15, SW - 2*MX, 0.32, ['מתווה למימוש'], size=13, bold=True, color=C.LIME)
    rail = s.line(SW - MX - 0.2, 6.12, MX + 0.2, 6.12, C.AQUA, 2, tail='triangle', name='roadmap rail')
    items = [(None, 'GLEAMER', 'דימות עצמות', 'מרכזי רנטגן', 'bone'), ('2027', 'TOMTEC', 'בחינת פריסת תשתית בקהילה', None, 'heart-pulse'),
             ('2027', 'MIRAI', 'קידום מחקר', None, 'microscope')]
    rm = []
    for i, (yr, prod, t, sub, ic) in enumerate(items):
        cx = 11.0 - i*4.0
        g = s.group(f'milestone {prod}')
        with g:
            s.oval(cx + 1.55, 6.12, 0.62, C.NIGHT2, dict(c=C.LIME if yr is None else C.AQUA, w=2), shadow='md')
            s.icon(ic, cx + 1.55, 6.12, 0.3, C.LIME if yr is None else C.AQUA, 1.9)
            s.rect(cx - 1.95, 5.62, 3.15, 1.0, '0A2E35', dict(c=C.AQUA, w=0.75, a=0.5), r=0.14)
            if yr: s.chip(cx + 0.45, 5.7, 0.66, 0.26, yr, C.AQUA, C.NIGHT, size=10)
            else: s.chip(cx + 0.35, 5.7, 0.76, 0.26, 'בהטמעה', C.LIME, C.NIGHT, size=9.5) if False else None
            s.text(cx - 1.85, 5.68, 2.25 if yr else 2.95, 0.34, [[(prod, {'lang': 'en-US', 'color': C.WHITE}), ('  ' + t, {'color': 'B7D3D3'})]], size=12.5, bold=True, color=C.WHITE)
            if sub: s.text(cx - 1.85, 6.1, 2.95, 0.3, [sub], size=11, color=C.LIME, bold=True)
        rm.append(g.id)
    s.anim.click(fade(lab1, 0, 300), fade(tag, 0, 300), *steps[0], *steps[1])
    s.anim.click(*steps[2], *steps[3])
    s.anim.click(*steps[4])
    s.anim.click(fade(lab2, 0, 300), wipe(rail, 0, 900, 'left'), *[rise(g, 300 + i*300, 500, 0.03) for i, g in enumerate(rm)])
    return s

# ---------------------------------------------------------------- 29 LONGEVITY
def s29(d, n=29):
    s = d.new()
    ids = head(s, n, [[('Longevity score', {'lang': 'en-US'})]], sub='הארכת שנות החיים הבריאות כתחום שירות מוגדר – עם קהלי יעד, מומחים ומסלולים משלו')
    intro(s, ids)
    nx = s.pic('image48.png', MX, 0.5, w=1.25, crop=NEXT_CROP, name='כללית NEXT')
    lap, scr = s.laptop(0.55, 2.0, 4.85, 'image127.png')
    # human at the centre of a metrics ring (no values invented)
    cx, cy = 6.62, 3.05
    ring_parts = []
    cols = [C.LIME, C.TURQ, C.TEAL, C.GREEN, C.AQUA, '7DB800']
    for k in range(6):
        a1 = -90 + k*60 + 4; a2 = a1 + 52
        ring_parts.append(s.arc(cx, cy, 2.35, a1 % 360, a2 % 360, 0.16, cols[k], name=f'score segment {k}'))
    person = s.pic('image181.png', cx - 0.88, cy - 0.88, 1.76, 1.76, geom='ellipse', crop=(0.08, 0.02, 0.42, 0.33), name='person', line=dict(c=C.WHITE, w=3))
    lbl = s.chip(cx - 0.95, cy + 1.32, 1.9, 0.34, 'Longevity Score', C.PETROL, C.WHITE, size=11.5, rtl=False)
    sol_t = s.text(8.55, 1.85, 4.18, 0.35, ['הפתרון'], size=14, bold=True, color=C.TEAL)
    sols = [('כלים דיגיטליים למטופל לאיסוף וניתוח מידע, להפקת תובנות ומתן המלצות ולהנעת המטופל לטיפול', 'smartphone'),
            ([('פיתוח ממשקי מידע ואפליקציית ', {}), ('Longevity', {'lang': 'en-US'}), (' בקהילה', {})], 'app-window'),
            ([('המלצות מותאמות ', {}), ('Longevity', {'lang': 'en-US'}), (' ב-', {}), ('C-Pi', {'lang': 'en-US'})], 'sparkles'),
            ([('הכשרה ייעודית ומיתוג מחדש של כוח אדם כמומחי ', {}), ('Longevity', {'lang': 'en-US'})], 'graduation-cap')]
    sl = []
    for i, (t, ic) in enumerate(sols):
        y = 2.25 + i*0.64
        g = s.group(f'solution {i}')
        with g:
            s.oval(12.47, y + 0.27, 0.42, C.TEAL_T, None); s.icon(ic, 12.47, y + 0.27, 0.23, C.PETROL, 2)
            s.text(8.55, y, 3.65, 0.58, [t], size=11.5, bold=True, color=C.INK, anchor='ctr', lnspc=98)
        sl.append(g.id)
    # timeline
    tl = s.line(SW - MX, 5.2, MX, 5.2, C.LINE, 2.5, name='timeline')
    tlp = s.line(SW - MX, 5.2, MX, 5.2, C.TEAL, 2.5, tail='triangle', name='timeline progress')
    years = [('2027', [([('פיתוח אפליקציית ', {}), ('Longevity', {'lang': 'en-US'})], 'smartphone'), ('הפעלת מנגנון ניהול, מעקב ובקרה מרחוק', 'monitor-check')]),
             ('2028', [([('שירות ', {}), ('Longevity', {'lang': 'en-US'}), (' פעיל לכלל מטופלי הכללית', {})], 'users'), ('ניתוח דו"חות ומעקב אחר אחוזי שיפור במדדי מטופלים', 'chart-line')])]
    yg = []
    for j, (yr, its) in enumerate(years):
        x0 = 12.73 - j*6.1
        g = s.group(f'year {yr}')
        with g:
            s.oval(x0 - 0.35, 5.2, 0.5, C.PETROL if j == 0 else C.LIME, dict(c=C.WHITE, w=2), shadow='sm')
            s.text(x0 - 1.55, 5.0, 1.0, 0.4, [[(yr, {'lang': 'en-US'})]], size=20, bold=True, color=C.PETROL, align='ctr', rtl=False, fill=C.BG, anchor='ctr', font=C.FONT_XB)
            for k, (t, ic) in enumerate(its):
                xx = x0 - 0.15 - (k + 1)*2.9 + 0.1
                s.rect(xx, 5.6, 2.8, 1.12, C.WHITE, dict(c=C.LINE, w=0.75), r=0.16, shadow='sm')
                s.oval(xx + 2.43, 5.95, 0.44, C.TEAL_T if j == 0 else C.LIME_T, None); s.icon(ic, xx + 2.43, 5.95, 0.24, C.PETROL, 2)
                s.text(xx + 0.12, 5.62, 2.05, 1.08, [t], size=11.5, bold=True, color=C.INK, anchor='ctr', lnspc=100)
        yg.append(g.id)
    s.anim.auto(fade(nx, 0, 400))
    s.anim.click(fade(lap, 0, 600), zoom(person, 300, 600, 0.7), *[wheel(r, 500 + k*150, 500) for k, r in enumerate(ring_parts)], fade(lbl, 1300, 400))
    s.anim.click(fade(sol_t, 0, 300), *[rise(g, 100 + i*150, 450, 0.02) for i, g in enumerate(sl)])
    s.anim.click(fade(tl, 0, 300), wipe(tlp, 100, 1800, 'left'), rise(yg[0], 300, 500, 0.03), rise(yg[1], 1300, 500, 0.03))
    return s

# ---------------------------------------------------------------- 30 SMART DIGITAL ROUTING (preserve logic)
CH30 = ['פניה טלפונית למרפאה', 'פניה למוקד 2700', 'פניה לאפליקציה רופא אונליין', 'פניה לאפליקציה', 'פניה למוקד אחיות', 'פניה ישירה של מטופל למוקד', 'ווטסאפ מרפאתי', 'הפניה למיון ע״י רופא', 'הפניה למיון ע״י מוקד אחיות']
CHI30 = ['phone', 'headset', 'monitor-smartphone', 'smartphone', 'stethoscope', 'user-round', 'message-circle', 'file-text', 'siren']
TY30 = [  # left->right column order c0..c9 (as in source table)
    'סכנה מיידית לחיים/לאיבר (כאבים בחזה, חשד לשבץ, דימום אקטיבי וכו׳)',
    'צורך מיידי דחוף שלא ניתן לתת לו מענה בקהילה, אך ללא סכנה מיידית לחיים/לאיבר',
    'מעקב רפואי / טיפול מתקדם לבעיה קלינית ללא סכנה מיידית לחיים/לאיבר',
    'צורך לבירור דחוף שדורש בדיקות עזר (בדיקות דם, הדמיה וכו׳), ללא סכנה מיידית לחיים/לאיבר',
    'צורך שדורש מענה בטווח של 24-72 שעות ויכול להימצא לו פתרון בקהילה (בתפירה של אחת מהחלופות ניתוב / הדמיה וכו׳)',
    'כל פניה דחופה של מטופל שלא יודע לאן לפנות ורוצה להתייעץ עם גורם אנושי',
    'בעיה אקוטית בתחום רפואת עור / עיניים (תלונה חדשה בת פחות מ-30 ימים)',
    'בעיה שרופא משפחה לא יכול לתת לה מענה (למשל הפניה לבדיקת שמיעה, מרשם למדרסים וכו׳) - הפניה לאחר שיקול דעת של רופא משפחה',
    'מחלה אקוטית (בד״כ זיהומים למיניהם) במקרה שרופא המשפחה אינו זמין מיידית',
    'טיפול במחלה כרונית / מרשמי תרופות קבועות בנושאים תחת אחריות ר. המשפחה; מחלה אקוטית במקרה שהרופא זמין מיידית',
]
RESP30 = [('מיון רגיל', 0, 'siren', False), ('אשפוז בית', 2, 'house-plus', True), ('מיון קהילתי קדמי', 3, 'building-2', False), ('מוקד אחיות', 5, 'headset', True),
          ('יועץ אונליין', 6, 'monitor-smartphone', True), ('יועץ', 7, 'user-round-check', False), ('רופא משפחה אונליין', 8, 'monitor-smartphone', True), ('רופא משפחה', 9, 'stethoscope', False)]
# connections exactly as in the source diagram: (type column, response name, style) ; P=primary(green) A=alternative(red) D=alternative dotted
LINKS30 = [(0, 'מיון רגיל', 'P'), (2, 'אשפוז בית', 'P'), (5, 'מוקד אחיות', 'P'), (6, 'יועץ אונליין', 'P'), (7, 'יועץ', 'P'), (8, 'רופא משפחה אונליין', 'P'),
           (9, 'רופא משפחה', 'P'), (3, 'מיון קהילתי קדמי', 'P'), (9, 'מיון רגיל', 'P'),
           (9, 'יועץ', 'A'), (9, 'יועץ אונליין', 'A'), (9, 'רופא משפחה אונליין', 'A'), (0, 'מיון קהילתי קדמי', 'A'), (2, 'מיון רגיל', 'A'),
           (1, 'מיון רגיל', 'A'), (3, 'מיון רגיל', 'A'), (7, 'רופא משפחה', 'A'), (8, 'מיון רגיל', 'A'), (6, 'מיון רגיל', 'A'), (6, 'רופא משפחה אונליין', 'A'),
           (8, 'רופא משפחה', 'D'), (6, 'יועץ', 'D'), (6, 'רופא משפחה', 'D')]
def s30(d, n=30):
    s = d.new()
    ids = head(s, n, 'ניתוב דיגיטלי חכם', size=26)
    intro(s, ids)
    cw = (SW - 2*MX - 9*0.05) / 10
    colx = [MX + i*(cw + 0.05) for i in range(10)]
    ccx = [x + cw/2 for x in colx]
    # channels row
    lab_ch = s.text(MX, 1.2, SW - 2*MX, 0.28, ['אפיקי פניית מטופלים'], size=12, bold=True, color=C.TEAL, align='r')
    chw = (SW - 2*MX - 0.35 - 8*0.06) / 9
    chs = []
    for i, (t, ic) in enumerate(zip(CH30, CHI30)):
        x = SW - MX - chw - i*(chw + 0.06) - (0.35 if i >= 7 else 0)
        ref = i >= 7
        g = s.group(f'channel {t}')
        with g:
            s.rect(x, 1.5, chw, 0.62, C.PETROL if not ref else C.WHITE, dict(c=C.PETROL, w=1, dash='dash') if ref else None, r=0.1, shadow='sm')
            s.icon(ic, x + chw - 0.2, 1.81, 0.2, C.LIME if not ref else C.PETROL, 2)
            s.text(x + 0.05, 1.5, chw - 0.33, 0.62, [t], size=9, bold=True, color=C.WHITE if not ref else C.PETROL, anchor='ctr', lnspc=88)
        chs.append(g.id)
    # types
    lab_ty = s.text(MX, 2.24, SW - 2*MX, 0.28, ['סוגי פניות'], size=12, bold=True, color=C.TEAL, align='r')
    tys = []
    for i, t in enumerate(TY30):
        tys.append(s.text(colx[i], 2.52, cw, 2.32, [t], size=8.8, bold=True, color=C.INK, fill=C.WHITE, line=dict(c=C.LINE, w=0.75), r=0.08,
                          align='ctr', anchor='t', ins=(0.05, 0.07, 0.05, 0.05), lnspc=95, name=f'type {i}'))
    # responses
    rx = {}
    rs = []
    ry = 5.6
    for t, col, ic, nxt in RESP30:
        x = colx[col]
        g = s.group(f'response {t}')
        with g:
            s.rect(x, ry, cw, 0.98, dict(grad=[(0, C.PETROL), (100, '0B5C69')], ang=90), None, r=0.1, shadow='md')
            s.icon(ic, x + cw/2, ry + 0.27, 0.26, C.LIME, 2)
            s.text(x + 0.04, ry + 0.45, cw - 0.08, 0.5, [t], size=10.5, bold=True, color=C.WHITE, align='ctr', anchor='ctr', lnspc=88)
            if nxt: s.pic('image128.png', x + 0.04, ry + 0.04, 0.3, 0.3, r=0.04, name='כללית NEXT')
        rx[t] = ccx[col]; rs.append(g.id)
    lab_r = s.text(MX, 6.62, 4.5, 0.26, ['מענים רפואיים'], size=11, bold=True, color=C.TEAL, align='l')
    # links
    col_out = {}; resp_in = {}
    for (c, r, st) in LINKS30:
        col_out.setdefault(c, []).append((r, st)); resp_in.setdefault(r, []).append((c, st))
    styles = {'P': dict(c='7DB800', w=2.0), 'A': dict(c=C.TURQ, w=1.25), 'D': dict(c=C.TURQ, w=1.25, dash='sysDot')}
    groups = {'P': [], 'A': [], 'D': []}; paths = {}
    for (c, r, st) in LINKS30:
        outs = sorted(col_out[c], key=lambda z: rx[z[0]]); ins_ = sorted(resp_in[r], key=lambda z: ccx[z[0]])
        k1 = outs.index((r, st)); k2 = ins_.index((c, st))
        sx = ccx[c] + (k1 - (len(outs) - 1)/2) * 0.1
        ex = rx[r] + (k2 - (len(ins_) - 1)/2) * 0.08
        pth = bez((sx, 4.86), (ex, ry - 0.05), 0.5, 'v')
        ln = s.path(pth, line=dict(tail='triangle', **styles[st]), name=f'route {c}->{r} {st}')
        groups[st].append(ln); paths[(c, r)] = pth
    leg = s.group('legend')
    with leg:
        lx = SW - MX
        for st, t in (('P', 'מענה ראשי'), ('A', 'מענה חלופי'), ('D', 'מענה חלופי (מקווקו)')):
            s.line(lx - 0.45, 6.75, lx, 6.75, **styles[st])
            s.text(lx - 2.05, 6.62, 1.52, 0.26, [t], size=10, bold=True, color=C.MUTED, align='r', anchor='ctr')
            lx -= 2.2
    # demo routes with travelling dots
    demo = []
    for k, (c, r) in enumerate([(9, 'רופא משפחה'), (0, 'מיון רגיל'), (6, 'יועץ אונליין'), (8, 'רופא משפחה אונליין')]):
        pth = paths[(c, r)]
        p = dot(s, *pth[0], 0.13, C.LIME)
        demo.append(flow(p, mpath_curve(pth[0], [pth[1]]), k*700, 1400, repeat=3))
        demo.append(pulse(tys[c], k*700, 350, 1.04))
    s.anim.click(fade(lab_ch, 0, 300), *[fade(c, i*60, 350) for i, c in enumerate(chs)])
    s.anim.click(fade(lab_ty, 0, 300), *[fade(t, i*70, 400) for i, t in enumerate(tys)])
    s.anim.click(fade(lab_r, 0, 300), *[rise(r, i*70, 400, 0.02) for i, r in enumerate(rs)])
    s.anim.click(*[wipe(l, i*60, 500, 'down') for i, l in enumerate(groups['P'])], fade(leg.id, 300, 400))
    s.anim.click(*[wipe(l, i*50, 500, 'down') for i, l in enumerate(groups['A'])])
    s.anim.click(*[wipe(l, i*50, 500, 'down') for i, l in enumerate(groups['D'])])
    s.anim.click(*demo)
    s.transition = 'fade'
    return s

# ---------------------------------------------------------------- 31 SMART ROUTING: solution & roadmap
def s31(d, n=31):
    s = d.new()
    ids = head(s, n, 'ניתוב חכם', sub='המטופל מנותב למקום המיטבי עבורו בכל נקודת זמן')
    intro(s, ids)
    nx = s.pic('image48.png', MX, 0.5, w=1.25, crop=NEXT_CROP, name='כללית NEXT')
    hd = s.text(MX, 1.95, SW - 2*MX, 0.4, [[('הפתרון המוצע: ', {'color': C.TEAL}), ('סוכן ', {}), ('AI', {'lang': 'en-US'}), (' לניתוב חכם קליני – קליטת פניות בשפה חופשית, זיהוי כוונה וסיווג חכם', {})]],
                size=14.5, bold=True, color=C.INK, name='solution header')
    # flow (left)
    req = s.group('free-text request')
    with req:
        s.rect(4.55, 2.75, 2.05, 0.95, C.WHITE, dict(c=C.LINE, w=0.75), r=0.18, shadow='md')
        s.icon('message-square-text', 6.3, 3.0, 0.26, C.TEAL, 2)
        s.text(4.65, 2.8, 1.5, 0.85, ['פנייה בשפה חופשית'], size=11.5, bold=True, color=C.INK, anchor='ctr', lnspc=95)
    ag = agent_mark(s, 3.55, 3.22, 1.0, name='triage agent')
    it = s.chip(2.75, 3.95, 1.6, 0.3, 'זיהוי כוונה / תסמין', C.LIME_T, C.GREEN, size=9.5, line=dict(c=C.LIME, w=0.75))
    l0 = s.line(4.5, 3.22, 4.2, 3.22, C.TEAL, 1.75, tail='triangle')
    dests = [('רפואת משפחה', 'stethoscope', C.TEAL, 2.55), ('רפואה יועצת', 'user-round-check', C.TEAL, 3.22), ('המענה הקליני המתאים', 'route', '7DB800', 3.89)]
    dl = []; dd = []
    for t, ic, col, y in dests:
        dl.append(s.path(bez((3.0, 3.22), (2.45, y), 0.5), line=dict(c=col, w=1.75, tail='triangle')))
        g = s.group(f'destination {t}')
        with g:
            s.rect(0.6, y - 0.27, 1.82, 0.54, C.WHITE, dict(c=col, w=1), r=0.27, shadow='sm')
            s.icon(ic, 2.17, y, 0.24, col, 2)
            s.text(0.68, y - 0.27, 1.32, 0.54, [t], size=10.5, bold=True, color=C.INK, anchor='ctr', lnspc=88)
        dd.append(g.id)
    # two agent types (right)
    A = s.group('agent type A')
    with A:
        s.rect(7.0, 2.55, 5.73, 1.15, C.WHITE, dict(c=C.TEAL, w=1.25), r=0.18, shadow='md')
        s.oval(12.28, 3.12, 0.6, C.TEAL, None); s.icon('calendar-search', 12.28, 3.12, 0.3, C.WHITE, 2)
        s.text(7.15, 2.6, 4.7, 0.45, ["סוכני טריאז' למטופל המבקש להשתמש במשאב מוגדר"], size=13, bold=True, color=C.PETROL, anchor='ctr')
        s.text(7.15, 3.05, 4.7, 0.6, ["טריאז' דיגיטלי לרפואת משפחה וטריאז' דיגיטלי לרפואה יועצת"], size=11.5, color=C.MUTED, anchor='t')
    B = s.group('agent type B')
    with B:
        s.rect(7.0, 3.85, 5.73, 1.15, C.WHITE, dict(c='7DB800', w=1.25), r=0.18, shadow='md')
        s.oval(12.28, 4.42, 0.6, '7DB800', None); s.icon('stethoscope', 12.28, 4.42, 0.3, C.WHITE, 2)
        s.text(7.15, 3.9, 4.7, 0.45, ["סוכן טריאז' לפי סימפטום"], size=13, bold=True, color=C.GREEN, anchor='ctr')
        s.text(7.15, 4.35, 4.7, 0.6, ['הכוונת המטופל למענה הקליני המתאים בהתאם לתלונה הרפואית'], size=11.5, color=C.MUTED, anchor='t')
    # roadmap
    tl = s.line(SW - MX, 5.45, MX, 5.45, C.LINE, 2.5)
    tlp = s.line(SW - MX, 5.45, MX, 5.45, C.TEAL, 2.5, tail='triangle')
    lab = s.text(MX, 5.05, 3.0, 0.3, ['מתווה למימוש'], size=12, bold=True, color=C.TEAL, align='l')
    yrs = []
    for j, (yr, t, col) in enumerate([('2027', "פיתוח סוכני טריאז' למטופל המבקש להשתמש במשאב מוגדר", C.TEAL), ('2028', "רכש חיצוני של פתרון סוכני טריאז' לפי סימפטום", '7DB800')]):
        x0 = 12.73 - j*6.1
        g = s.group(f'year {yr}')
        with g:
            s.oval(x0 - 0.35, 5.45, 0.5, col, dict(c=C.WHITE, w=2), shadow='sm')
            s.rect(x0 - 5.75, 5.78, 5.4, 0.95, C.WHITE, dict(c=col, w=1), r=0.16, shadow='sm')
            s.text(x0 - 1.45, 5.78, 1.0, 0.95, [[(yr, {'lang': 'en-US'})]], size=22, bold=True, color=col if j == 0 else C.GREEN, anchor='ctr', align='r', rtl=False, font=C.FONT_XB)
            s.text(x0 - 5.6, 5.78, 4.1, 0.95, [t], size=13, bold=True, color=C.INK, anchor='ctr')
        yrs.append(g.id)
    s.anim.auto(fade(nx, 0, 400), fade(hd, 200, 500))
    s.anim.click(rise(req.id, 0, 500, 0.03), wipe(l0, 400, 300, 'left'), zoom(ag, 600, 500, 0.6), fade(it, 1000, 400),
                 *[x for i, (l, g) in enumerate(zip(dl, dd)) for x in (wipe(l, 1300 + i*200, 400, 'left'), slide_in(g, 1450 + i*200, 400, 0.2))])
    s.anim.click(rise(A.id, 0, 500, 0.03), pulse(dd[0], 300, 400, 1.05), pulse(dd[1], 450, 400, 1.05))
    s.anim.click(rise(B.id, 0, 500, 0.03), pulse(dd[2], 300, 400, 1.05))
    s.anim.click(fade(lab, 0, 300), fade(tl, 0, 300), wipe(tlp, 100, 1500, 'left'), rise(yrs[0], 300, 500, 0.03), rise(yrs[1], 1100, 500, 0.03))
    return s

# ---------------------------------------------------------------- 32 NEXT-GEN DIGITAL (reference; structure preserved)
def s32(d, n=32):
    s = d.new()
    ids = head(s, n, 'דיגיטל הדור הבא')
    intro(s, ids)
    s.rect(0.67, 1.49, 6.81, 5.39, 'F7FAF4', dict(c=C.LINE, w=0.75), r=0.18, name='diagram panel')
    rp = s.group('principles')
    with rp:
        s.rect(7.67, 1.49, 5.0, 5.39, C.WHITE, dict(c=C.LINE, w=0.75), r=0.18, shadow='sm')
    bullets = ['מעבר מניווט פסיבי לאורקסטרציה פרואקטיבית', 'רפואה מותאמת אישית מבוססת נתונים', 'סוכן בריאות אוטונומי', 'חוויית שער כניסה אחוד',
               'הבנת כוונות המטופל', 'ראוטר סוכנים חכם', 'תיווך רב-ערוצי הוליסטי']
    bl = []
    for i, t in enumerate(bullets):
        y = 1.85 + i*0.68
        g = s.group(f'principle {i}')
        with g:
            s.oval(12.2, y + 0.24, 0.28, C.TEAL_T, None); s.oval(12.2, y + 0.24, 0.12, C.TEAL, None)
            s.text(7.95, y, 4.0, 0.48, [t], size=14.5, bold=True, color=C.INK, anchor='ctr')
        bl.append(g.id)
    def column(x, title, items, icons, name):
        hdr = s.group(f'{name} header')
        with hdr:
            s.text(x, 1.65, 1.74, 0.56, [title], size=12.5, bold=True, color=C.TEAL, align='ctr', anchor='ctr', lnspc=90)
            s.rect(x + 0.28, 2.24, 1.18, 0.03, C.LIME, None, r=0.015)
        cards = []
        for i, (t, ic) in enumerate(zip(items, icons)):
            y = 2.39 + i*1.495
            g = s.group(f'{name} {t}')
            with g:
                s.rect(x, y, 1.74, 1.36, C.WHITE, dict(c=C.LINE, w=0.75), r=0.12, shadow='sm')
                s.rect(x + 0.66, y + 0.19, 0.42, 0.42, C.TEAL, None, r=0.1)
                s.icon(ic, x + 0.87, y + 0.4, 0.25, C.WHITE, 2)
                s.text(x + 0.07, y + 0.68, 1.6, 0.42, [[(t, {'lang': 'en-US' if t == 'WhatsApp' else 'he-IL'})]], size=12, bold=True, color=C.INK, align='ctr', anchor='ctr', rtl=t != 'WhatsApp')
            cards.append((g.id, x, y))
        return hdr.id, cards
    hL, chans = column(0.83, 'ערוצי קשר מבוזרים', ['WhatsApp', 'אפליקציה', 'אתר אינטרנט'], ['message-circle', 'smartphone', 'globe'], 'channel')
    hR, systems = column(5.57, 'מערכות קליניות ותפעוליות', ['תיק רפואי', 'מערכת תורים', 'מושלם ובתי"ח'], ['file-heart', 'calendar-check', 'hospital'], 'system')
    # gate
    gate = s.group('AI gate')
    with gate:
        s.rect(2.99, 1.9, 2.17, 4.56, C.WHITE, dict(c=C.LIME, w=1.75), r=0.16, shadow='md', glow=(C.LIME, 6, 0.2))
        s.oval(4.07, 2.53, 0.76, C.LIME_T, None)
        s.icon('brain', 4.07, 2.53, 0.49, C.GREEN, 1.75)
        s.text(3.06, 3.01, 2.03, 0.39, [[('שער ', {}), ('AI', {'lang': 'en-US'}), (' אחוד', {})]], size=15, bold=True, color=C.PETROL, align='ctr', anchor='ctr')
        s.chip(3.24, 3.46, 1.67, 0.31, 'One-Stop-Gate', C.LIME_T, C.GREEN, size=10.5, rtl=False)
    orch = []
    for i, t in enumerate(['אורקסטרטור חכם', 'זיהוי הצורך', 'תרגום לכוונה', 'הפניה לסוכן מתאים']):
        y = 3.92 + i*0.615
        orch.append(s.text(3.12, y + 0.04, 1.91, 0.5, [t], size=11.5 if i else 12, bold=True, color=C.PETROL if i == 0 else C.INK,
                           fill=C.TEAL_T if i == 0 else None, r=0.1, align='ctr', anchor='ctr', name=f'orchestrator step {i}'))
        if i < 3: s.rect(3.26, y + 0.6, 1.61, 0.01, C.MIST, None)
    hlbar = s.rect(3.1, 3.96, 1.95, 0.5, None, dict(c=C.LIME, w=1.75), r=0.1, name='orchestrator focus')
    # connectors (channels -> gate -> systems), as in the source (bidirectional)
    cin = []; cout = []; pin = []; pout = []
    for (gid, x, y) in chans:
        pth = bez((x + 1.76, y + 0.68), (2.97, 4.18), 0.5)
        cin.append(s.path(pth, line=dict(c=C.TEAL, w=1.25, tail='triangle', head='triangle', a=0.85), name='channel link'))
        p = dot(s, *pth[0], 0.1, C.LIME); pin.append((p, pth))
    for (gid, x, y) in systems:
        pth = bez((5.18, 4.18), (x - 0.02, y + 0.68), 0.5)
        cout.append(s.path(pth, line=dict(c=C.TEAL, w=1.25, tail='triangle', head='triangle', a=0.85), name='system link'))
        p = dot(s, *pth[0], 0.1, C.LIME); pout.append((p, pth))
    s.anim.click(fade(hL, 0, 300), *[rise(g, 100 + i*150, 450, 0.02) for i, (g, x, y) in enumerate(chans)])
    s.anim.click(*[wipe(c, i*100, 450, 'right') for i, c in enumerate(cin)], zoom(gate.id, 300, 600, 0.85),
                 *[flow(p, mpath_curve(pth[0], [pth[1]]), 500 + i*300, 1200) for i, (p, pth) in enumerate(pin)])
    s.anim.click(*[fade(o, i*250, 350) for i, o in enumerate(orch)], fade(hlbar, 0, 300),
                 move(hlbar, mpath(0, 0, 0, 3*0.615), 300, 1500), pulse(gate.id, 1900, 500, 1.02))
    s.anim.click(fade(hR, 0, 300), *[wipe(c, 100 + i*100, 450, 'right') for i, c in enumerate(cout)], *[rise(g, 300 + i*150, 450, 0.02) for i, (g, x, y) in enumerate(systems)],
                 *[flow(p, mpath_curve(pth[0], [pth[1]]), 700 + i*300, 1200) for i, (p, pth) in enumerate(pout)])
    s.anim.click(fade(rp.id, 0, 300), *[rise(b, 100 + i*110, 400, 0.02) for i, b in enumerate(bl)])
    return s

# ---------------------------------------------------------------- 33 SICK-NOTE AGENT (reference slide)
def s33(d, n=33):
    s = d.new()
    ids = head(s, n, 'סוכן אישורי מחלה')
    intro(s, ids)
    s2 = s.pic('image136.png', 5.54, 1.49, 2.83, 5.39, name='שלב ראשון בסוכן אישורי מחלה', descr='שלב ראשון בסוכן אישורי מחלה')
    s1 = s.pic('image137.png', 1.32, 1.49, 2.83, 5.39, name='שלב שני בסוכן אישורי מחלה', descr='שלב שני בסוכן אישורי מחלה')
    st1 = s.chip(6.36, 1.12, 1.2, 0.3, 'שלב 1', C.TEAL_T, C.PETROL, size=10.5)
    st2 = s.chip(2.14, 1.12, 1.2, 0.3, 'שלב 2', C.TEAL_T, C.PETROL, size=10.5)
    arr = s.group('step arrow')
    with arr:
        s.oval(4.85, 4.18, 0.5, C.LIME, None, shadow='sm')
        s.icon('arrow-left', 4.85, 4.18, 0.28, C.PETROL, 2.2)
    panel = s.rect(9.19, 1.49, 3.47, 5.39, C.PETROL, None, r=0.18, shadow='md', name='stat panel')
    cx, cy = 10.935, 2.945
    s.oval(cx, cy, 1.88, None, dict(c=C.LIME, w=0.75, a=0.5), name='ring halo')
    base = s.oval(cx, cy, 1.67, '0B5A66', None, name='ring base')
    arc = s.arc(cx, cy, 1.67, 270, 270 + 216, 0.14, dict(grad=[(0, C.LIME), (100, '7DB800')], ang=0), name='60% ring')
    fin, fx = countup(s, cx - 0.7, cy - 0.35, 1.4, 0.7, ['8%', '15%', '23%', '31%', '38%', '45%', '52%', '57%'], [('60%', {'lang': 'en-US'})], 34, C.WHITE, '0B5A66', step=130, start=100, name='60%')
    txt = s.text(9.47, 4.4, 2.92, 1.81, ['מהפניות לבוט אישורי המחלה מסתיימות בהשלמת התהליך ובשליחת בקשה לאישור.'], size=16, bold=True, color=C.WHITE, align='ctr', lnspc=110)
    s.anim.click(rise(s2, 0, 600, 0.04), fade(st1, 200, 400))
    s.anim.click(zoom(arr.id, 0, 400, 0.5), rise(s1, 300, 600, 0.04), fade(st2, 500, 400))
    s.anim.click(wheel(arc, 0, 1200), *fx, fade(txt, 900, 600))
    return s

# ---------------------------------------------------------------- 34 VOICE TO TEXT (reference slide)
def s34(d, n=34):
    s = d.new()
    ids = head(s, n, [[('VOICE TO TEXT', {'lang': 'en-US'})]], sub="צ'אט קולי")
    intro(s, ids)
    cols = [(9.94, 'מצב תמלול פעיל', 1), (6.85, 'בקשת הרשאה', 2), (3.76, 'מצב תמלול פעיל', 3), (0.67, 'מצב תמלול סופי לפני שליחה', 4)]
    steps = []
    for x, t, k in cols:
        g = s.group(f'step {k} header')
        with g:
            s.oval(x + 2.55, 2.25, 0.36, C.TEAL, None)
            s.text(x + 2.37, 2.07, 0.36, 0.36, [[(str(k), {'lang': 'en-US'})]], size=12, bold=True, color=C.WHITE, align='ctr', anchor='ctr', rtl=False)
            s.text(x, 2.07, 2.28, 0.36, [t], size=12.5, bold=True, color=C.PETROL, anchor='ctr')
        card = s.rect(x, 2.57, 2.73, 4.31, C.WHITE, dict(c=C.LINE, w=0.75), r=0.16, shadow='sm', name=f'step {k} card')
        steps.append((g.id, card))
    i1 = s.pic('image140.png', 10.17, 2.71, 2.26, 4.03, name='מצב תמלול פעיל', r=0.08)
    i2a = s.pic('image141.png', 7.02, 2.92, 2.38, 1.19, name='בקשת הרשאה למיקרופון')
    orr = s.text(6.85, 4.25, 2.73, 0.35, ['או'], size=13, bold=True, color=C.TEAL, align='ctr', anchor='ctr')
    i2b = s.pic('image142.png', 7.12, 4.67, 2.19, 2.0, name='בקשת הרשאה למיקרופון')
    i3 = s.pic('image143.png', 3.99, 2.71, 2.26, 4.03, name='מצב תמלול פעיל', r=0.08)
    i4 = s.pic('image144.png', 0.9, 2.71, 2.26, 4.03, name='מצב תמלול סופי לפני שליחה', r=0.08)
    chev = []
    for x in (9.755, 6.665, 3.575):
        g = s.group('chevron')
        with g:
            s.oval(x, 4.725, 0.31, C.LIME, None)
            s.icon('chevron-left', x, 4.725, 0.19, C.PETROL, 2.5)
        chev.append(g.id)
    # micro-interactions
    mx, my = 10.17 + 2.26*0.155, 2.71 + 4.03*0.927
    tap = s.oval(mx, my, 0.34, (C.LIME, 0.35), dict(c=C.LIME, w=2), name='mic tap')
    bars = []
    random.seed(3)
    for k in range(11):
        h = 0.06 + abs(math.sin(k*0.9))*0.2
        bars.append(s.rect(4.55 + k*0.105, 6.08 - h/2, 0.05, h, C.TEAL, None, r=0.025, name='rec bar'))
    s.anim.click(fade(steps[0][0], 0, 300), fade(steps[0][1], 0, 400), rise(i1, 100, 500, 0.03), zoom(tap, 700, 300, 0.3), pulse(tap, 1000, 300, 1.3), fadeout(tap, 1400, 300))
    s.anim.click(zoom(chev[0], 0, 300, 0.5), fade(steps[1][0], 100, 300), fade(steps[1][1], 100, 400), rise(i2a, 250, 450, 0.03), fade(orr, 600, 300), rise(i2b, 750, 450, 0.03))
    s.anim.click(zoom(chev[1], 0, 300, 0.5), fade(steps[2][0], 100, 300), fade(steps[2][1], 100, 400), rise(i3, 250, 450, 0.03),
                 *[zoom(b, 700 + k*40, 250, 0.2) for k, b in enumerate(bars)], *[pulse(b, 1100 + (k % 4)*110, 330, 1.6, repeat=4) for k, b in enumerate(bars)])
    s.anim.click(zoom(chev[2], 0, 300, 0.5), fade(steps[3][0], 100, 300), fade(steps[3][1], 100, 400), wipe(i4, 300, 1400, 'down'))
    return s

# ---------------------------------------------------------------- 35 VIRTUAL ER (reference slide)
DONE35 = [('פרוטוקולים חדשים בסיבל', 'file-plus-2'), ('תהליך אוטומטי לפתיחת קבלה במנור ותיק בקמיליון', 'workflow'), ('ביצוע שיחת וידאו אחות במוקד ורופא במיון', 'video'),
          ('צפיית רופא מלר"ד באנמנזה של אחות המוקד', 'eye'), ('הקמת הזמנות לבדיקות טרם הגעת המטופל', 'calendar-check'), ('העברה חלקה בין מיון וירטואלי לפיזי (הזמנות מעבדה, דימות)', 'arrow-left-right'),
          ('מרשם דיגיטלי', 'file-pen-line'), ([('יכולת הקלטה ותמלול והעברת הקבצים לכללית לצורך בניית מודל ', {}), ('AI', {'lang': 'en-US'})], 'mic')]
def s35(d, n=35):
    s = d.new()
    ids = head(s, n, [[("מיון וירטואלי וטריאג' באמצעות ", {}), ('AI', {'lang': 'en-US'})]])
    intro(s, ids)
    ph = s.group('pilot photo')
    with ph:
        s.rect(0.67, 1.49, 3.06, 4.9, C.WHITE, None, r=0.16, shadow='md')
        s.pic('image146.jpg', 0.75, 1.57, 2.89, 4.74, r=0.12, name='רופא מיון בשיחת וידאו עם מטופלת', descr='רופא מיון בשיחת וידאו עם מטופלת')
        s.chip(0.9, 5.82, 1.15, 0.3, 'מהפיילוט', C.PETROL, C.WHITE, size=10)
    ess = s.text(3.89, 1.49, 8.78, 0.69, [[('מהות השירות: ', {'bold': True, 'color': C.PETROL}), ('שירות וירטואלי מבוסס וידיאו למטופל המאפשר ייעוץ עם רופא מלר"ד בכיר מרחוק למטופלים שקיבלו הפניה למיון, הפניה דיגיטלית להמשך טיפול או הפניה לשירותים קהילתיים.', {})]],
                 size=11.5, color=C.INK, fill=C.TEAL_T, r=0.1, anchor='ctr', ins=(0.18, 0.04, 0.2, 0.04), lnspc=105)
    box = s.group('2026 block')
    with box:
        s.rect(3.89, 2.32, 8.78, 2.78, C.WHITE, dict(c=C.LINE, w=0.75), r=0.16, shadow='sm')
        s.chip(11.88, 2.44, 0.63, 0.31, '2026', C.GREEN, C.WHITE, size=11, rtl=False)
        s.text(9.5, 2.44, 2.3, 0.31, ['מה נעשה'], size=13, bold=True, color=C.GREEN, anchor='ctr')
        s.text(4.04, 2.81, 8.47, 0.25, ['פיתוחים עבור פיילוט מחוז שרון שומרון – מוקד אחיות – בית חולים מאיר:'], size=11, bold=True, color=C.INK)
    items = []
    for i, (t, ic) in enumerate(DONE35):
        r_, c_ = divmod(i, 4)
        x = 10.45 - c_*2.14; y = 3.12 + r_*0.96
        g = s.group(f'done {i+1}')
        with g:
            s.rect(x, y, 2.07, 0.89, C.GREEN_T, None, r=0.1)
            s.oval(x + 1.84, y + 0.19, 0.26, C.GREEN, None)
            s.text(x + 1.71, y + 0.06, 0.26, 0.26, [[(str(i+1), {'lang': 'en-US'})]], size=9, bold=True, color=C.WHITE, align='ctr', anchor='ctr', rtl=False)
            s.icon(ic, x + 0.22, y + 0.2, 0.2, C.GREEN, 2)
            s.text(x + 0.08, y + 0.32, 1.92, 0.54, [t], size=9.5, bold=True, color=C.INK, anchor='ctr', lnspc=92)
        items.append(g.id)
    arrow = s.line(12.95, 2.6, 12.95, 5.3, C.TEAL, 1.5, dash='dash', tail='triangle', name='2026 to 2027')
    fut = []
    for i, (t, ic) in enumerate([('מיון וירטואלי ארצי עם רופא קהילה', 'map-pin'), ('מיון וירטואלי בתי חולים', 'hospital'), ([("טריאג' על פי סימפטום באמצעות ", {}), ('AI', {'lang': 'en-US'})], 'sparkles')]):
        x = 9.81 - i*2.96
        g = s.group(f'2027 goal {i}')
        with g:
            s.rect(x, 5.24, 2.85, 1.15, 'EAF6F7', dict(c=C.TURQ, w=1, dash='dash'), r=0.14)
            s.rect(x + 2.27, 5.62, 0.39, 0.39, C.TURQ, None, r=0.08)
            s.icon(ic, x + 2.465, 5.815, 0.22, C.WHITE, 2)
            s.chip(x + 1.39, 5.33, 0.74, 0.22, '2027', C.TURQ, C.WHITE, size=9, rtl=False)
            s.text(x + 0.12, 5.58, 2.1, 0.75, [t], size=11.5, bold=True, color=C.PETROL, anchor='ctr', lnspc=95)
        fut.append(g.id)
    s.anim.auto(fade(ph.id, 200, 600), fade(ess, 300, 500))
    s.anim.click(fade(box.id, 0, 400), *[zoom(it, 200 + i*110, 400, 0.85) for i, it in enumerate(items)])
    s.anim.click(wipe(arrow, 0, 600, 'down'), *[rise(f, 400 + i*200, 500, 0.03) for i, f in enumerate(fut)])
    return s

# ---------------------------------------------------------------- 36 REMOTE MEDICINE in clinic (video)
def s36(d, n=36):
    s = d.new()
    s.logo(); s.num(n)
    card = s.rect(0.83, 0.9, 11.68, 6.03, C.WHITE, dict(c=C.LINE, w=0.75), r=0.2, shadow='sm', name='card')
    ey = s.text(1.2, 1.05, 10.9, 0.26, [[(section(n), {'spc': 1.5})]], size=11, bold=True, color=C.TEAL, align='r', name='!!eyebrow')
    tt = s.text(1.2, 1.28, 10.9, 0.6, [[('רפואה דיגיטלית ', {}), ('ומרחוק', {'color': C.TURQ}), (' במרפאה', {})]], size=28, bold=True, color=C.PETROL, name='!!title')
    vw = 8.4; vh = vw * 512/910
    vx, vy = 1.2, 2.0
    mv = s.sl.shapes.add_movie(os.path.join(MEDIA, 'media1.mp4'), Emu(emu(vx)), Emu(emu(vy)), Emu(emu(vw)), Emu(emu(vh)),
                               poster_frame_image=os.path.join(MEDIA, 'image151.jpg'), mime_type='video/mp4')
    vid = mv.shape_id
    s.nid = max(s.nid, vid) + 1
    s.kinds[vid] = 'pic'
    el = mv._element; el.getparent().remove(el); s.tree.append(el)
    # rounded clip for the video frame
    geom = el.find('.//a:prstGeom', NS)
    if geom is not None:
        geom.set('prst', 'roundRect'); av = geom.find('a:avLst', NS)
        av.append(etree.fromstring(f'<a:gd {NSDECL} name="adj" fmla="val 3000"/>'))
    vframe = s.rect(vx - 0.05, vy - 0.05, vw + 0.1, vh + 0.1, None, dict(c=C.TEAL, w=1.25), r=0.2, name='video frame')
    # right column callouts
    stat = s.group('stat 450')
    with stat:
        s.rect(9.85, 2.0, 2.4, 2.05, dict(grad=[(0, C.LIME), (100, '7DB800')], ang=45), None, r=0.18, shadow='md')
        s.text(9.95, 2.08, 2.2, 0.3, ['מחוז ירושלים'], size=12.5, bold=True, color=C.PETROL, align='ctr')
        s.text(9.95, 2.36, 2.2, 0.3, ['מעל'], size=13, bold=True, color=C.PETROL, align='ctr')
    fin, fx = countup(s, 9.95, 2.6, 2.2, 0.85, ['60', '130', '200', '270', '340', '400', '440'], [('450', {'lang': 'en-US'})], 46, C.PETROL, '8DC90A', step=70, start=200, name='450')
    sl = s.text(9.95, 3.45, 2.2, 0.4, ['ייעוצים בחודש'], size=13, bold=True, color=C.PETROL, align='ctr', name='stat label')
    ac = s.group('acoustic booths')
    with ac:
        s.rect(9.85, 4.25, 2.4, 1.05, C.TEAL_T, None, r=0.16)
        s.icon('ear', 11.95, 4.55, 0.3, C.PETROL, 2)
        s.text(9.95, 4.3, 1.75, 0.95, ['תאי בדיקה מבודדים אקוסטית'], size=12, bold=True, color=C.PETROL, anchor='ctr', lnspc=95)
    hr = s.group('hearing test - under review')
    with hr:
        s.rect(9.85, 5.45, 2.4, 1.08, C.WHITE, dict(c=C.AMBER, w=1.25, dash='dash'), r=0.16)
        s.chip(10.05, 5.55, 0.8, 0.26, 'בבחינה', C.AMBER_T, '8A5A00', size=9.5, line=dict(c=C.AMBER, w=0.75))
        s.text(9.95, 5.85, 2.2, 0.6, ['בדיקת שמיעה מרחוק'], size=12.5, bold=True, color=C.INK, anchor='ctr', align='ctr')
    s.anim.video = vid
    s.anim.auto(play(vid, 0, 10034), fade(stat.id, 400, 500), *fx, fade(sl, 800, 400))
    s.anim.click(rise(ac.id, 0, 500, 0.03))
    s.anim.click(rise(hr.id, 0, 500, 0.03))
    return s

# ---------------------------------------------------------------- 37 CLALIT AI FACTORY
def s37(d, n=37):
    s = d.new(dark=True)
    ids = head(s, n, [[('התקדמות לפי תכנית – ', {}), ('Clalit ', {'lang': 'en-US'}), ('AI Factory', {'lang': 'en-US', 'color': C.LIME})]])
    intro(s, ids)
    pillars = [('מוכנות', 'ותשתית', 8.4, 12.73, 'layers', '0B5C69'), ('מובילות', 'התנסות ויישום ב-scale', 3.95, 8.3, 'rocket', C.TEAL), ('אחריות', 'ובקרות', 0.6, 3.85, 'shield-check', '1AA3AE')]
    hdr = []
    for (t, sub, x0, x1, ic, col) in pillars:
        g = s.group(f'pillar {t}')
        with g:
            w = x1 - x0
            s.shape(x0, 1.65, w, 1.15, 'homePlate', dict(grad=[(0, col), (100, C.PETROL)], ang=90), None, adj={'adj': 22000}, flipH=True, shadow='md')
            iso_slab(s, x0 + w - 0.75, 2.05, 0.95, 0.14, '3CC3CF', C.PETROL_D, '06323A', 'factory block')
            s.icon(ic, x0 + w - 0.75, 2.03, 0.3, C.WHITE, 2)
            s.text(x0 + 0.45, 1.68, w - 1.85, 0.62, [t], size=24, bold=True, color=C.WHITE, anchor='ctr')
            s.text(x0 + 0.45, 2.25, w - 1.85, 0.45, [[(sub, {})]], size=13, color='CDEDEC', anchor='t')
        hdr.append(g.id)
    def boxes(x, w, items, plus=True, name='box'):
        ids_ = []
        y = 3.05
        hs = [0.9 if len(str(t)) < 30 else 1.25 for t in items]
        for k, t in enumerate(items):
            h = hs[k] if len(items) > 1 else 3.5
            g = s.group(f'{name} {k}')
            with g:
                s.rect(x, y, w, h, (C.WHITE, 0.05), dict(c=C.AQUA, w=1, a=0.55), r=0.12)
                s.text(x + 0.1, y, w - 0.2, h, t if isinstance(t, list) else [t], size=12.5, bold=True, color=C.WHITE, align='ctr', anchor='ctr', lnspc=102)
            ids_.append(g.id)
            y += h + 0.25
            if plus and k < len(items) - 1:
                s.text(x + w/2 - 0.2, y - 0.3, 0.4, 0.35, [[('+', {'lang': 'en-US'})]], size=18, bold=True, color=C.LIME, align='ctr', anchor='ctr', rtl=False)
        return ids_
    c1 = boxes(10.6, 2.13, ['תמונת עתיד רצוי', 'מודיעין ושת"פ', 'איתור אתגרים וייזום פתרונות'], name='readiness A')
    c2 = boxes(8.4, 2.1, [['תשתית:', [('GPU', {'bold': False, 'lang': 'en-US'}), (' · ענן · דאטה', {'bold': False})]], [[('Talent:', {'lang': 'en-US'})], [('גיוס, שימור, הכשרה והדרכה', {'bold': False})]]], name='readiness B')
    c3 = boxes(6.15, 2.1, [['מו"פ מרכזי:', [('מחקר בחזית המדע, פיתוח מוצרים', {'bold': False})]], 'התנסות והטמעת מוצרים מן החוץ'], name='leadership A')
    c4 = boxes(3.95, 2.1, [['"מסלולי נחיתה"', 'להטמעה ב-scale:', [('C-Pi', {'lang': 'en-US', 'color': C.LIME}), (' (לקהילה)', {'bold': False})],
                            [('AIDOC', {'lang': 'en-US', 'color': C.LIME}), (' (לרדיולוג)', {'bold': False})], [('לגו', {'color': C.LIME}), (' (לבתי"ח)', {'bold': False})], '...']], plus=False, name='leadership B')
    c5 = []
    g = s.group('control A')
    with g:
        s.rect(0.6, 3.05, 3.25, 1.25, (C.WHITE, 0.05), dict(c=C.LIME, w=1, a=0.7), r=0.12)
        s.icon('clipboard-check', 3.45, 3.4, 0.32, C.LIME, 2)
        s.text(0.7, 3.05, 2.55, 1.25, ['בקרה טרם הטמעה', [("צ'קליסט ", {}), ('OPTICA', {'lang': 'en-US', 'color': C.LIME})]], size=12.5, bold=True, color=C.WHITE, align='ctr', anchor='ctr')
    c5.append(g.id)
    dl = s.line(2.22, 4.38, 2.22, 4.95, C.LIME, 1.5, dash='dash', tail='triangle')
    g = s.group('control B')
    with g:
        s.rect(0.6, 5.05, 3.25, 1.5, (C.WHITE, 0.05), dict(c=C.LIME, w=1, a=0.7), r=0.12)
        s.icon('activity', 3.45, 5.4, 0.32, C.LIME, 2)
        s.text(0.7, 5.05, 2.55, 1.5, ['ניטור והתנסות,', 'מדידת השפעה', 'והטמעה'], size=12.5, bold=True, color=C.WHITE, align='ctr', anchor='ctr')
    c5.append(g.id)
    seps = []
    for x in (8.3, 3.9):
        seps.append(s.path([(x + 0.05, 3.05), (x - 0.08, 4.8), (x + 0.05, 6.55)], line=dict(c=C.AQUA, w=1, dash='dash', a=0.6), name='pillar separator'))
    s.anim.click(*[fade(h, i*120, 500) for i, h in enumerate(hdr)])
    s.anim.click(*[rise(b, i*130, 450, 0.02) for i, b in enumerate(c1 + c2)])
    s.anim.click(fade(seps[0], 0, 300), *[rise(b, 100 + i*130, 450, 0.02) for i, b in enumerate(c3 + c4)])
    s.anim.click(fade(seps[1], 0, 300), rise(c5[0], 100, 450, 0.02), wipe(dl, 500, 400, 'down'), rise(c5[1], 800, 450, 0.02))
    return s

# ---------------------------------------------------------------- 38 AI FACTORY PLATFORM (architecture - geometry preserved)
def s38(d, n=38):
    s = d.new()
    ids = head(s, n, [[('AI FACTORY PLATFORM', {'lang': 'en-US'})]])
    intro(s, ids)
    AQ, LM = '4FD1E0', '9BE15D'
    panel = s.group('platform panel')
    with panel:
        s.rect(0.67, 1.70, 12.0, 5.18, dict(grad=[(0, '082E37'), (100, '041B21')], ang=90), None, r=0.22, shadow='lg')
        s.text(0.68, 1.79, 11.99, 0.36, [[('AI Factory: High-Performance AI Platform', {'lang': 'en-US'})]], size=17, color=C.WHITE, align='ctr', rtl=False)
        s.pic('image156.png', 5.6, 2.21, 0.91, 0.28, name='Red Hat')
        s.rect(6.63, 2.22, 0.01, 0.25, '5C7A80', None)
        s.pic('image157.png', 6.75, 2.22, 0.96, 0.25, name='NVIDIA')
    def box(x, y, w, h, line, fill='0D3540', name='box', glowc=None):
        return s.rect(x, y, w, h, fill, dict(c=line, w=1.25), r=0.1, name=name, glow=(glowc, 6, 0.25) if glowc else None)
    def lbl(x, y, w, h, t, size=10.5, bold=True, color=C.WHITE, align='ctr'):
        return s.text(x, y, w, h, [[(t, {'lang': 'en-US'})]] if isinstance(t, str) else t, size=size, bold=bold, color=color, align=align, rtl=False, anchor='ctr', lnspc=95)
    L1 = s.group('layer users & data')
    with L1:
        box(1.43, 2.62, 6.11, 0.78, '2E5A63')
        lbl(1.43, 2.67, 6.11, 0.24, 'USERS & ECOSYSTEM', 11)
        s.icon('laptop', 1.875, 3.135, 0.33, 'D6ECEA', 1.75); s.icon('square-terminal', 2.265, 3.135, 0.33, 'D6ECEA', 1.75)
        s.text(2.51, 2.93, 2.08, 0.43, [[('Data Scientists', {'lang': 'en-US'})], [('& Developers', {'lang': 'en-US'})]], size=11, bold=True, color=C.WHITE, align='l', rtl=False, anchor='ctr', lnspc=95)
        s.icon('settings', 5.08, 3.14, 0.36, 'D6ECEA', 1.75)
        s.text(5.36, 2.93, 1.81, 0.43, [[('MLOps', {'lang': 'en-US'})], [('Engineers', {'lang': 'en-US'})]], size=11, bold=True, color=C.WHITE, align='l', rtl=False, anchor='ctr', lnspc=95)
        box(7.82, 2.62, 2.92, 0.78, '2E5A63')
        lbl(7.82, 2.67, 2.92, 0.22, 'EXTERNAL MEDICAL DATA', 10.5)
        lbl(7.82, 2.88, 2.92, 0.19, '(Hospital Systems, EHR, etc.)', 8.5, False, 'B7D3D3')
        s.icon('hospital', 8.99, 3.23, 0.26, 'D6ECEA', 1.75); s.icon('database', 9.56, 3.23, 0.26, 'D6ECEA', 1.75)
        box(11.01, 2.58, 1.49, 0.86, AQ, glowc=AQ)
        s.pic('image163.png', 11.34, 2.67, 0.84, 0.28, name='Microsoft, OpenAI, Azure')
        s.text(11.01, 2.96, 1.49, 0.4, [[('MICROSOFT AZURE', {'lang': 'en-US'})], [('OPENAI MODULE', {'lang': 'en-US'})]], size=8.5, bold=True, color=C.WHITE, align='ctr', rtl=False, anchor='ctr', lnspc=95)
    arrL = s.shape(7.58, 2.93, 0.19, 0.17, 'leftArrow', AQ, None, name='external to users')
    F = s.group('layer AI factory')
    with F:
        s.rect(1.43, 3.61, 10.19, 3.14, '082E37', dict(c=LM, w=1.5), r=0.08, glow=(LM, 6, 0.2))
        s.text(1.57, 3.67, 8.11, 0.28, [[('THE AI FACTORY', {'lang': 'en-US'}), (' (Red Hat OpenShift Container Platform)', {'lang': 'en-US', 'bold': False, 'color': 'B7D3D3'})]], size=11.5, bold=True, color=C.WHITE, align='l', rtl=False, anchor='ctr')
        s.pic('image164.png', 10.17, 3.69, 0.76, 0.22, name='OpenShift')
    P = s.group('layer AI platform & tools')
    with P:
        box(1.56, 3.99, 9.94, 1.04, AQ, '0B3A44')
        s.text(1.68, 4.03, 5.28, 0.26, [[('AI PLATFORM & TOOLS', {'lang': 'en-US'}), (' (Red Hat OpenShift AI)', {'lang': 'en-US', 'bold': False, 'color': 'B7D3D3'})]], size=11, bold=True, color=C.WHITE, align='l', rtl=False, anchor='ctr')
        lbl(8.93, 4.03, 1.81, 0.26, 'Model Serving', 11)
        s.icon('brain-circuit', 1.98, 4.61, 0.44, 'D6ECEA', 1.6)
        s.text(2.28, 4.36, 2.01, 0.51, [[('AI Workbenches', {'lang': 'en-US'})], [('(Development)', {'lang': 'en-US', 'bold': False})]], size=10.5, bold=True, color=C.WHITE, align='l', rtl=False, anchor='ctr', lnspc=95)
        s.icon('workflow', 4.62, 4.61, 0.44, 'D6ECEA', 1.6)
        s.text(4.92, 4.36, 2.08, 0.51, [[('AI Pipelines', {'lang': 'en-US'})], [('(Training Workflows)', {'lang': 'en-US', 'bold': False})]], size=10.5, bold=True, color=C.WHITE, align='l', rtl=False, anchor='ctr', lnspc=95)
        s.icon('network', 7.33, 4.61, 0.44, 'D6ECEA', 1.6)
        s.pic('image168.png', 8.24, 4.33, 0.43, 0.35, name='Meta Llama'); lbl(8.03, 4.71, 0.9, 0.24, 'Llama 4', 10)
        s.pic('image169.png', 9.28, 4.33, 0.37, 0.35, name='OpenAI'); lbl(8.93, 4.71, 1.18, 0.24, 'GPT-OSS-120B', 10)
        s.icon('lock', 10.845, 4.505, 0.35, AQ, 1.9); lbl(10.53, 4.71, 0.62, 0.24, 'VPN', 10, False)
    I = s.group('layer physical infrastructure')
    with I:
        s.pic('image171.png', 1.6, 5.11, 0.8, 0.24, name='NVIDIA')
        s.text(2.67, 5.10, 6.25, 0.28, [[('PHYSICAL INFRASTRUCTURE', {'lang': 'en-US'}), (' (The Engine)', {'lang': 'en-US', 'bold': False, 'color': 'B7D3D3'})]], size=11, bold=True, color=C.WHITE, align='ctr', rtl=False, anchor='ctr')
        box(1.56, 5.43, 3.78, 1.21, LM, '0B3A44'); lbl(1.56, 5.47, 3.78, 0.25, 'COMPUTE ENGINE', 10.5)
        s.rect(1.69, 5.82, 0.6, 0.68, None, dict(c='D6ECEA', w=1), r=0.08); s.rect(1.78, 5.93, 0.43, 0.12, None, dict(c='D6ECEA', w=1), r=0.03); s.rect(1.78, 6.11, 0.43, 0.12, None, dict(c='D6ECEA', w=1), r=0.03)
        s.rect(2.36, 5.79, 2.89, 0.72, None, dict(c=LM, w=1), r=0.06)
        for k in range(4):
            s.rect(2.42 + k*0.71, 5.88, 0.64, 0.38, '123F2A', dict(c=LM, w=0.75), r=0.05); lbl(2.42 + k*0.71, 5.97, 0.64, 0.19, 'NVIDIA', 7.5)
        lbl(2.42, 6.28, 2.78, 0.21, 'NVIDIA A100', 8.5, False)
        box(5.45, 5.43, 3.38, 1.21, AQ, '0B3A44'); lbl(5.45, 5.46, 3.38, 0.22, 'DELL STORAGE APPLIANCE', 10.5); lbl(5.45, 5.67, 3.38, 0.19, '(1 Petabyte High Speed)', 8.5, False, 'B7D3D3')
        s.rect(5.57, 5.93, 0.53, 0.58, None, dict(c='D6ECEA', w=1), r=0.06); s.rect(6.15, 5.93, 2.6, 0.58, None, dict(c=AQ, w=1), r=0.06)
        for k in range(8): s.rect(6.21 + k*0.315, 6.0, 0.27, 0.44, None, dict(c='D6ECEA', w=0.75), r=0.04)
        box(8.94, 5.43, 2.56, 1.21, LM, '0B3A44'); lbl(8.94, 5.46, 2.56, 0.22, 'SECURE REPOSITORY', 10.5); lbl(8.94, 5.67, 2.56, 0.19, '(JFROG)', 8.5, False, 'B7D3D3')
        s.pic('image172.png', 9.48, 5.9, 0.65, 0.65, name='JFrog'); s.pic('image173.png', 10.3, 5.93, 0.65, 0.6, name='Hugging Face')
    side = s.group('security & internet')
    with side:
        s.rect(0.94, 4.9, 0.39, 0.46, '0D3540', dict(c=LM, w=1), r=0.08); s.icon('shield-check', 1.135, 5.13, 0.28, LM, 2)
        s.icon('cloud', 12.18, 5.18, 0.56, 'D6ECEA', 1.6); lbl(11.69, 5.46, 0.97, 0.21, 'INTERNET', 9, False)
    # connections (same routes as the source)
    con = [s.path([(1.43, 3.01), (1.14, 3.01), (1.14, 4.89)], line=dict(c=AQ, w=1.5, head='triangle')),
           s.line(1.14, 4.58, 1.53, 4.58, LM, 1.5, tail='triangle'),
           s.path([(1.14, 5.38), (1.14, 6.03), (1.53, 6.03)], line=dict(c=LM, w=1.5, tail='triangle')),
           s.path([(11.53, 6.03), (12.18, 6.03), (12.18, 5.69)], line=dict(c=LM, w=1.5, tail='triangle')),
           s.path([(11.53, 4.47), (12.46, 4.47), (12.46, 3.46)], line=dict(c=AQ, w=1.5, tail='triangle')),
           s.line(6.43, 3.40, 6.43, 3.97, AQ, 1.5, tail='triangle'), s.line(7.26, 3.40, 7.26, 3.97, AQ, 1.5, tail='triangle')]
    nodes = [s.oval(6.43, 3.45, 0.1, LM, dict(c=C.WHITE, w=0.75)), s.oval(7.27, 3.45, 0.1, LM, dict(c=C.WHITE, w=0.75))]
    pk = [dot(s, 6.43, 3.45, 0.09, LM), dot(s, 7.26, 3.45, 0.09, LM), dot(s, 7.78, 3.01, 0.09, AQ), dot(s, 11.53, 4.47, 0.09, AQ), dot(s, 11.53, 6.03, 0.09, LM)]
    flows = [flow(pk[0], mpath(6.43, 3.45, 6.43, 3.95), 600, 1000), flow(pk[1], mpath(7.26, 3.45, 7.26, 3.95), 900, 1000),
             flow(pk[2], mpath(7.78, 3.01, 7.5, 3.01), 300, 900), flow(pk[3], mpath_pts([(11.53, 4.47), (12.46, 4.47), (12.46, 3.5)]), 1200, 1500),
             flow(pk[4], mpath_pts([(11.53, 6.03), (12.18, 6.03), (12.18, 5.72)]), 1500, 1300)]
    s.anim.auto(fade(panel.id, 200, 600))
    s.anim.click(rise(L1.id, 0, 500, 0.02), wipe(arrL, 400, 300, 'left'))
    s.anim.click(fade(F.id, 0, 500), rise(P.id, 300, 500, 0.02))
    s.anim.click(rise(I.id, 0, 500, 0.02), fade(side.id, 300, 400))
    s.anim.click(*[wipe(c, i*120, 450, 'down' if i in (0, 5, 6) else 'right') for i, c in enumerate(con)], *[zoom(nd, 200, 300, 0.4) for nd in nodes], *flows)
    return s

# ---------------------------------------------------------------- 39 AI GOVERNANCE (process preserved)
def s39(d, n=39):
    s = d.new()
    ids = head(s, n, [[('מבט על – ', {}), ('AI Governance', {'lang': 'en-US'}), (' בכללית', {})]])
    intro(s, ids)
    intro_t = s.text(MX, 1.3, SW - 2*MX, 0.72, [[("לאחר פיתוח צ'קליסט ", {}), ('OPTICA', {'lang': 'en-US', 'bold': True, 'color': C.TEAL}), (', פותח ע"י ועדת אסדרת ', {}), ('AI', {'lang': 'en-US'}),
                                                  (" תהליך העוטף את השימוש בצ'קליסט ומאפשר קבלת החלטות מושכלות על מוצרי ", {}), ('AI', {'lang': 'en-US'}),
                                                  (' המועמדים להטמעה בארגון, ואושר ע"י הנהלת הקופה בסוף 2025. ', {}), ('אחד התהליכים הבשלים המוטמעים כעת בארגוני בריאות.', {'bold': True, 'color': C.PETROL})]],
                     size=12, color=C.INK, fill=C.TEAL_T, r=0.12, anchor='ctr', ins=(0.2, 0.04, 0.2, 0.04), lnspc=105)
    X = lambda px: 0.6 + px/2000*12.1
    Y = lambda py: 2.2 + py/903*3.55
    road_pts = [(X(95), Y(545)), ((X(300), Y(530)), (X(420), Y(420)), (X(620), Y(470))), ((X(820), Y(510)), (X(1000), Y(470)), (X(1200), Y(410))),
                ((X(1400), Y(350)), (X(1600), Y(340)), (X(1980), Y(330)))]
    road = s.path(road_pts, line=dict(c='5D7377', w=13), name='road')
    lane = s.path(road_pts, line=dict(c=C.WHITE, w=1.5, dash='dash'), name='road lane')
    # loops (detours / cycle)
    green = s.group('green track loop')
    with green:
        s.shape(X(790), Y(470), X(990) - X(790), Y(650) - Y(470), 'arc', None, dict(c='7DB800', w=9), adj={'adj1': 0, 'adj2': 10800000})
    gray = s.group('AI committee loop')
    with gray:
        s.shape(X(1085), Y(410), X(1270) - X(1085), Y(590) - Y(410), 'arc', None, dict(c='9AAAAD', w=9), adj={'adj1': 0, 'adj2': 10800000})
    cyc = s.group('yearly cycle')
    with cyc:
        s.oval(X(1650), Y(460), 1.25, None, dict(c='5D7377', w=10))
        s.oval(X(1650), Y(460), 1.25, None, dict(c=C.WHITE, w=1.25, dash='dash'))
        s.text(X(1650) - 0.55, Y(460) - 0.3, 1.1, 0.6, [[('Yearly', {'lang': 'en-US'})], [('re-approval', {'lang': 'en-US'})], [('cycle', {'lang': 'en-US'})]], size=8.5, bold=True, color=C.GREEN, align='ctr', rtl=False, anchor='ctr', lnspc=90)
    stops = []
    for px, py in [(660, 470), (1030, 455), (1300, 380), (1477, 345)]:
        stops.append(s.rect(X(px) - 0.03, Y(py) - 0.28, 0.06, 0.56, C.RISK, None, r=0.02, name='potential stopping point'))
    stl = s.text(X(150), Y(610), 1.75, 0.3, [[('Potential stopping points', {'lang': 'en-US'})]], size=8.5, bold=True, color=C.RISK, align='ctr', rtl=False)
    def card(x0, x1, y0, y1, runs, kind='top', col=C.PETROL, cx=None, cy=None, tgt=None):
        g = s.group('station')
        with g:
            if kind == 'top':
                s.rect(X(x0), Y(y0), X(x1) - X(x0), Y(y1) - Y(y0), C.WHITE, dict(c=C.TEAL, w=1), r=0.1, shadow='sm')
            elif kind == 'green':
                s.rect(X(x0), Y(y0), X(x1) - X(x0), Y(y1) - Y(y0), C.LIME_T, dict(c='7DB800', w=1.25, dash='dash'), r=0.1, shadow='sm')
            else:
                s.rect(X(x0), Y(y0), X(x1) - X(x0), Y(y1) - Y(y0), C.PETROL, None, r=0.1, shadow='sm')
            s.text(X(x0) + 0.05, Y(y0), X(x1) - X(x0) - 0.1, Y(y1) - Y(y0), runs, size=9.5, bold=True, color=C.INK if kind != 'bottom' else C.WHITE, align='ctr', rtl=False, anchor='ctr', lnspc=95)
        conn = s.line(X(cx), Y(y1 if kind == 'top' else y0), X(cx), Y(cy), C.TEAL if kind == 'top' else '7D9296', 1, dash='sysDot', name='station link') if cx else None
        return g.id, conn
    O = lambda t: (t, {'lang': 'en-US', 'color': C.TEAL})
    E = lambda t: (t, {'lang': 'en-US'})
    entry = s.group('entry point')
    with entry:
        s.rect(X(150), Y(335), X(470) - X(150), Y(590) - Y(335), C.PETROL, None, r=0.1, shadow='md')
        s.text(X(150), Y(340), X(470) - X(150), 0.25, [[E('Entry point')]], size=10.5, bold=True, color=C.WHITE, align='ctr', rtl=False)
        for k, t in enumerate(['IRB', 'Procurement Committee', 'Policy maker']):
            s.chip(X(170), Y(400) + k*0.27, X(450) - X(170), 0.22, t, (C.WHITE, 0.12), C.WHITE, size=8.5, bold=False, rtl=False)
    tops = [card(480, 650, 75, 325, [[E('Completion of "need assessment" ')], [O('OPTICA A'), E(' (7 items)')]], 'top', cx=555, cy=470),
            card(668, 840, 75, 325, [[E('Risk assessment')], [O('OPTICA B')]], 'top', cx=753, cy=500),
            card(915, 1165, 75, 325, [[E('Completion of '), O('OPTICA C-H')], [E('checklist items # according to risk assessment')]], 'top', cx=1077, cy=450),
            card(1186, 1458, 75, 325, [[E('Completion of '), O('OPTICA J'), E(' (3 items)')], [E('Bottom line OPTICA summary by AI expert')]], 'top', cx=1374, cy=370),
            card(1487, 1808, 75, 290, [[E('Completion of '), O('OPTICA K'), E(' (2 items)')], [E('findings from last year monitoring + impact evaluation')]], 'top', cx=1755, cy=340)]
    bots = [card(305, 605, 735, 890, [[E('Assignment of "Leading clinician"')]], 'bottom', cx=520, cy=520),
            card(612, 872, 735, 890, [[E('Potential detour')], [('Green track assessment', {'lang': 'en-US', 'color': C.GREEN})]], 'green', cx=880, cy=650),
            card(933, 1250, 735, 890, [[E('AI committee approval')], [E('(for risk of moderate+)')]], 'bottom', cx=1160, cy=590),
            card(1283, 1600, 735, 890, [[E('Policy maker approval (using OPTICA)')]], 'bottom', cx=1415, cy=345),
            card(1623, 1837, 735, 890, [[E('Annual reapproval of the policy maker')]], 'bottom', cx=1715, cy=590)]
    # principles
    pl = s.group('principles')
    with pl:
        s.text(MX, 6.12, SW - 2*MX, 0.26, ['התהליך כולל בין השאר שילוב של העקרונות הבאים:'], size=11.5, bold=True, color=C.TEAL)
    prin = ['תהליך הערכה מולטי-דיסיפלינרי', 'הערכה מדורגת תלוית סיכון', 'אפשרות לביצוע מסלול ירוק', 'ניטור ביצועים והערכת אימפקט שנתית', [('דיון ועדת ', {}), ('AI', {'lang': 'en-US'}), (' במקרה של מוצרים בדרגת סיכון בינונית', {})]]
    pw = (SW - 2*MX - 4*0.1) / 5
    pis = []
    for i, t in enumerate(prin):
        x = SW - MX - pw - i*(pw + 0.1)
        g = s.group(f'principle {i+1}')
        with g:
            s.rect(x, 6.42, pw, 0.55, C.WHITE, dict(c=C.LINE, w=0.75), r=0.1)
            s.oval(x + pw - 0.2, 6.695, 0.26, C.PETROL, None)
            s.text(x + pw - 0.33, 6.565, 0.26, 0.26, [[(str(i+1), {'lang': 'en-US'})]], size=9, bold=True, color=C.WHITE, align='ctr', anchor='ctr', rtl=False)
            s.text(x + 0.06, 6.42, pw - 0.42, 0.55, [t] if isinstance(t, str) else [t], size=9.5, bold=True, color=C.INK, anchor='ctr', lnspc=92)
        pis.append(g.id)
    traveller = dot(s, X(95), Y(545), 0.16, C.LIME)
    seq = [entry.id, bots[0][0], tops[0][0], tops[1][0], bots[1][0], tops[2][0], bots[2][0], tops[3][0], bots[3][0], tops[4][0], bots[4][0]]
    conns = [c for (_, c) in tops + bots if c]
    s.anim.auto(fade(intro_t, 200, 500))
    s.anim.click(wipe(road, 0, 1200, 'right'), wipe(lane, 200, 1200, 'right'), fade(entry.id, 600, 400), *[fade(x, 900 + i*80, 300) for i, x in enumerate(stops)], fade(stl, 1000, 300))
    s.anim.click(*[x for i, g in enumerate(seq[1:]) for x in [rise(g, i*180, 400, 0.02)]], *[wipe(c, 300 + i*90, 300, 'down') for i, c in enumerate(conns)],
                 fade(green.id, 700, 400), fade(gray.id, 1100, 400), fade(cyc.id, 1600, 500))
    s.anim.click(fade(traveller, 0, 200), flow(traveller, mpath_curve(road_pts[0], road_pts[1:]), 0, 5000, repeat=None, fade=False), spin(cyc.id, 4800, 9000))
    s.anim.click(fade(pl.id, 0, 300), *[rise(p, 100 + i*120, 400, 0.02) for i, p in enumerate(pis)])
    return s

# ---------------------------------------------------------------- 40 IMPACT ON THE PATIENT (climax)
def s40(d, n=40):
    s = d.new(dark=True, bg=dict(radial=[(0, '0D5966'), (45, C.NIGHT2), (100, C.NIGHT)], c=(50, 62)))
    ids = head(s, n, 'מעצבים את רפואת העתיד – אימפקט על המטופל', sub='הטכנולוגיה היא האמצעי – האדם הוא המטרה', subcolor=C.LIME)
    intro(s, ids)
    cx, cy = SW/2, 4.72
    orb1 = s.oval(cx, cy, 4.3, None, dict(c=C.AQUA, w=1, a=0.45, dash='sysDash'), name='orbit inner')
    orb2 = s.oval(cx, cy, 5.5, None, dict(c=C.LIME, w=0.75, a=0.35), name='orbit outer')
    halo = s.oval(cx, cy, 3.25, (C.AQUA, 0.08), None, glow=(C.AQUA, 25, 0.35), name='halo')
    fam = s.pic('image177.png', cx - 1.5, cy - 1.5, 3.0, 3.0, geom='ellipse', line=dict(c=C.WHITE, w=3), name='המטופל במרכז')
    eld = s.pic('image181.png', cx + 0.75, cy + 0.55, 1.2, 1.2, geom='ellipse', crop=(0.08, 0.02, 0.42, 0.33), line=dict(c=C.LIME, w=2.5), name='מטופלת')
    # encounter cards
    enc = [('מפגש פיזי', 'במרפאה | בבית', 'רופא | אחות | מטפל כללית', 'stethoscope'), ('מפגש וירטואלי', 'רופא און-ליין', 'רופא | אחות | מטפל כללית', 'monitor-smartphone'),
           ('מפגש וירטואלי', [('סוכן ', {}), ('AI', {'lang': 'en-US'})], None, 'sparkles')]
    ens = []
    for i, (t, sub, who, ic) in enumerate(enc):
        w = 2.7; x = cx + 1.55 - i*(w + 0.2) - 0.05 - (w/2) + 0.0
        x = [8.35, 5.32, 2.29][i]
        g = s.group(f'encounter {i}')
        with g:
            s.rect(x, 1.62, w, 1.0, (C.WHITE, 0.07), dict(c=C.LIME if i == 2 else C.AQUA, w=1.25), r=0.18)
            s.oval(x + w - 0.42, 2.12, 0.52, C.LIME if i == 2 else C.AQUA, None); s.icon(ic, x + w - 0.42, 2.12, 0.28, C.NIGHT, 2)
            s.text(x + 0.12, 1.66, w - 0.85, 0.36, [t], size=14, bold=True, color=C.WHITE, anchor='ctr')
            s.text(x + 0.12, 2.0, w - 0.85, 0.3, [sub] if isinstance(sub, str) else [sub], size=11.5, bold=True, color=C.LIME if i == 2 else C.AQUA, anchor='ctr')
            if who: s.text(x + 0.12, 2.28, w - 0.85, 0.28, [who], size=9.5, color='B7D3D3', anchor='ctr')
        ens.append(g.id)
    sats = [('ניתוב חכם של המטופל למענה מיטבי', 'route', -40), ('איסוף נתונים למתן רפואה מותאמת אישית', 'database', -8), ('ניטור רציף בסנסורים', 'watch', 24),
            ('קבלת ייעוץ, סדנאות והדרכות מרחוק', 'video', 62), ('קבלת שירות ושירותים משלימים בבית המטופל', 'house-plus', 118),
            ([('פניה לסוכני ', {}), ('AI', {'lang': 'en-US'}), (' למיקסום חוויית המטופל', {})], 'sparkles', 156), ('תקשורת מאובטחת דו-כיוונית מטופל – מטפל', 'messages-square', 188),
            ('שימוש בכלים דיגיטליים ואפליקציות', 'smartphone', 220)]
    sid = []; links = []
    for i, (t, ic, ang) in enumerate(sats):
        a = math.radians(ang)
        px, py = cx + 2.95*math.cos(a), cy + 2.2*math.sin(a)
        links.append(s.line(cx + 1.55*math.cos(a), cy + 1.55*math.sin(a), px - 0.3*math.cos(a), py - 0.3*math.sin(a), C.AQUA, 1, a=0.6, name='service link'))
        g = s.group(f'service {i}')
        with g:
            s.oval(px, py, 0.58, dict(grad=[(0, C.TEAL), (100, C.PETROL)], ang=45), dict(c=C.AQUA, w=1.25), glow=(C.AQUA, 6, 0.3))
            s.icon(ic, px, py, 0.3, C.WHITE, 1.9)
            right = math.cos(a) > 0
            tw = 2.35
            tx = px + 0.38 if right else px - 0.38 - tw
            s.text(tx, py - 0.32, tw, 0.64, [t] if isinstance(t, str) else [t], size=11.5, bold=True, color=C.WHITE, align='l' if right else 'r', anchor='ctr', lnspc=95)
        sid.append(g.id)
    p0, segs = circle_pts(cx, cy, 2.15)
    orbs = [dot(s, cx, cy - 2.15, 0.12, C.LIME), dot(s, cx, cy - 2.15, 0.09, C.AQUA)]
    s.anim.click(zoom(fam, 0, 900, 0.7), fade(halo, 200, 900), zoom(eld, 800, 600, 0.5))
    s.anim.click(fade(orb1, 0, 600), fade(orb2, 200, 600), spin(orb1, 0, 60000), *[rise(e, 300 + i*200, 500, 0.03) for i, e in enumerate(ens)])
    s.anim.click(*[x for i, (g, l) in enumerate(zip(sid, links)) for x in (wipe(l, i*220, 300, 'right' if math.cos(math.radians(sats[i][2])) > 0 else 'left'), zoom(g, 100 + i*220, 450, 0.6))],
                 flow(orbs[0], mpath_curve(p0, segs), 1900, 9000, fade=False), flow(orbs[1], mpath_curve(p0, segs), 6400, 9000, fade=False))
    return s

# ---------------------------------------------------------------- 41 CLOSING
def s41(d, n=41):
    s = d.new(dark=True, bg=C.NIGHT)
    img = s.pic('image182.png', 0, 0, SW, SH, name='closing image')
    tint = s.rect(0, 0, SW, SH, (C.PETROL, 0.3), name='petrol grade')
    ov = s.rect(0, 0, SW, SH, dict(grad=[(0, C.NIGHT, 1.0), (46, C.NIGHT, 1.0), (64, C.NIGHT, 0.45), (82, C.NIGHT, 0.0)], ang=0), name='left fade')
    ov2 = s.rect(0, 5.0, SW, 2.5, dict(grad=[(0, C.NIGHT, 0), (100, C.NIGHT, 0.9)], ang=90), name='bottom fade')
    t1 = s.text(0.75, 1.9, 6.0, 1.9, ['תודה'], size=110, bold=True, color=C.WHITE, align='r', anchor='ctr', name='thanks', font=C.FONT_XB)
    t2 = s.text(0.75, 3.85, 6.0, 0.7, ['מעצבים את רפואת העתיד'], size=30, bold=True, color=C.LIME, align='r', name='message')
    random.seed(11)
    parts = []
    for i in range(16):
        x = random.uniform(5.5, 13.0); y = random.uniform(0.8, 7.2)
        dd = random.choice([0.05, 0.07, 0.09]); c = random.choice([C.AQUA, C.LIME, C.WHITE])
        p = s.oval(x, y, dd, c, None, glow=(c, 5, 0.6), name=f'particle {i}')
        parts.append(flow(p, mpath(x, y, x + random.uniform(-0.3, 0.3), y - random.uniform(0.8, 1.6)), random.randint(0, 3000), random.randint(5000, 8000)))
    lines = []
    for k in range(3):
        y = 5.6 + k*0.22
        ln = s.path(bez((0.75, y), (6.75, y - 0.1), 0.5), line=dict(c=C.AQUA if k != 1 else C.LIME, w=0.75, a=0.5), name='data line')
        lines.append(ln)
    s.logo(white=True)
    s.anim.auto(grow(img, 0, 30000, 1.06), rise(t1, 300, 1000, 0.03), rise(t2, 800, 900, 0.03), *[wipe(l, 1200 + k*250, 1600, 'right') for k, l in enumerate(lines)], *parts)
    return s
