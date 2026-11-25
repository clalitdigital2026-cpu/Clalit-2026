# -*- coding: utf-8 -*-
from kit import *

REC = {  # recommendation types (consistent on slides 8-9)
    'prio': dict(fill=C.TEAL_T, line=C.TEAL, tc=C.PETROL, tag='עדיפות להחלפה'),
    'exam': dict(fill=C.AMBER_T, line=C.AMBER, tc='7A5200', tag='תיבחן החלפה'),
    'keep': dict(fill=C.SLATE_T, line='93A9AC', tc=C.MUTED, tag='לשמר ולבצע אינטגרציה'),
}

def countup(s, x, y, w, h, frames, final_runs, size, color, bg, align='ctr', rtl=False, start=0, step=55, name='count'):
    """frames: list of intermediate strings. Intermediate boxes are drawn in the background colour and flashed visible in sequence."""
    fx = []
    for k, f in enumerate(frames):
        fid = s.text(x, y, w, h, [[(f, {'lang': 'en-US'})]], size=size, bold=True, color=bg, align=align, anchor='ctr', rtl=rtl, name=f'{name} frame {k}', font=C.FONT_XB)
        fx.append(flash_color(fid, color, start + k*step, step))
    fin = s.text(x, y, w, h, [final_runs], size=size, bold=True, color=color, align=align, anchor='ctr', rtl=rtl, name=f'{name} value', font=C.FONT_XB)
    fx.append(appear(fin, start + len(frames)*step))
    return fin, fx

# ---------------------------------------------------------------- 8 PLATFORM FAMILIES
FAM8 = [  # row, col(from right), title, sub, kind, icon, frac
    (0, 0, 'מערכות קליניות', None, 'prio', 'stethoscope', (19, 28)),
    (0, 1, 'מערכות מעבדה', None, 'prio', 'flask-conical', (10, 12)),
    (0, 2, 'מערכות דימות', None, 'keep', 'scan-line', None),
    (0, 3, 'מכשור רפואי והקלטות', None, 'keep', 'monitor-dot', None),
    (1, 0, "מע' אדמיניסטרטיביות", 'מינהל מטופלים ותרופות', 'prio', 'clipboard-list', (5, 7)),
    (1, 1, "מע' אדמיניסטרטיביות", "תורים ומע' משלימות", 'exam', 'calendar-days', None),
    (1, 2, 'דיגיטל ואונליין', None, 'exam', 'smartphone', None),
    (1, 3, 'כספים, מחקר ואינטגרציה', None, 'exam', 'landmark', None),
]
def s08(d, n=8):
    s = d.new()
    ids = head(s, n, 'פלטפורמה מחשובית אחודה', sub='הפלטפורמה תאחד מערכות קליניות, מעבדות, מינהל מטופלים ותרופות')
    intro(s, ids)
    cw, gap = 2.86, 0.2; ch = 1.5
    ys = [1.9, 4.28]
    groups = {'prio': [], 'exam': [], 'keep': []}
    for (r, c, t, sub, kind, ic, frac) in FAM8:
        x = SW - MX - cw - c*(cw + gap); y = ys[r]
        R = REC[kind]
        g = s.group(f'family {t} {sub or ""}')
        with g:
            if kind == 'prio':
                s.rect(x, y, cw, ch, dict(grad=[(0, C.PETROL), (100, C.TEAL)], ang=45), None, r=0.16, shadow='md')
                fc, tc2, icf, icc = C.WHITE, 'CDEDEC', C.LIME, C.PETROL
            elif kind == 'exam':
                s.rect(x, y, cw, ch, C.WHITE, dict(c=C.AMBER, w=1.25), r=0.16, shadow='sm')
                fc, tc2, icf, icc = C.INK, C.MUTED, C.AMBER_T, '8A5A00'
            else:
                s.rect(x, y, cw, ch, 'EEF2F2', dict(c='A9BABC', w=1, dash='dash'), r=0.16)
                fc, tc2, icf, icc = '5B6E72', '7E9A9E', 'DFE6E7', '5B6E72'
            s.oval(x + cw - 0.48, y + 0.48, 0.58, icf, None)
            s.icon(ic, x + cw - 0.48, y + 0.48, 0.3, icc, 1.9)
            s.text(x + 0.15, y + 0.23, cw - 1.0, 0.5, [t], size=13 if len(t) > 15 else 14.5, bold=True, color=fc, anchor='ctr', lnspc=92)
            if sub: s.text(x + 0.15, y + 0.62, cw - 1.0, 0.3, [sub], size=11.5, bold=True, color=tc2)
            if frac:
                a, b = frac
                s.text(x + 0.15, y + 0.9, cw - 0.3, 0.3, [[(f'{a}', {'size': 18, 'color': C.LIME}), (f' מתוך {b} מערכות', {})]], size=12, bold=True, color=C.WHITE, anchor='b')
                s.rect(x + 0.15, y + 1.28, cw - 0.3, 0.07, (C.WHITE, 0.2), None, r=0.035)
                bw = (cw - 0.3) * a / b
                s.rect(x + 0.15 + (cw - 0.3) - bw, y + 1.28, bw, 0.07, C.LIME, None, r=0.035, name='share bar')
        groups[kind].append(g.id)
    # legend bands
    lg = {}
    lg['prio'] = s.text(SW - MX - 2*cw - gap, 3.55, 2*cw + gap, 0.5, [[('עדיפות להחלפה בפלטפורמה העתידית', {})]], size=12.5, bold=True, color=C.TEAL, align='ctr', anchor='ctr')
    lg['keep'] = s.text(MX, 3.52, 2*cw + gap, 0.6, [[('מחוץ להיקף הפלטפורמה', {'bold': True}), (' – מערכות ייעודיות למכשור רפואי ודימות: מומלץ לשמר ולבצע אינטגרציה', {'bold': False})]], size=11.5, color=C.MUTED, align='ctr', anchor='ctr')
    lg['exam'] = s.text(MX, 5.9, 3*cw + 2*gap, 0.3, [[('תיבחן האפשרות להחליף על פי איכות הפתרונות שיוצעו', {})]], size=12.5, bold=True, color='8A5A00', align='ctr')
    legend = s.group('legend')
    with legend:
        lx = SW - MX
        for kind, lab in (('prio', 'עדיפות להחלפה'), ('exam', 'בבחינה להחלפה'), ('keep', 'לשמר ולבצע אינטגרציה')):
            R = REC[kind]
            s.rect(lx - 0.22, 6.5, 0.22, 0.22, R['fill'] if kind != 'prio' else C.TEAL, dict(c=R['line'], w=1, dash='dash' if kind == 'keep' else None), r=0.05)
            s.text(lx - 2.5, 6.45, 2.18, 0.32, [lab], size=11, bold=True, color=C.MUTED, anchor='ctr')
            lx -= 2.65
    s.anim.click(*[rise(g, i*150, 550, 0.03) for i, g in enumerate(groups['prio'])], fade(lg['prio'], 500, 500), fade(legend.id, 500, 500))
    s.anim.click(*[rise(g, i*150, 550, 0.03) for i, g in enumerate(groups['exam'])], fade(lg['exam'], 500, 500))
    s.anim.click(*[rise(g, i*150, 550, 0.03) for i, g in enumerate(groups['keep'])], fade(lg['keep'], 400, 500))
    return s

# ---------------------------------------------------------------- 9 SYSTEMS TABLE (dashboard)
T9 = [
    ('מערכות קליניות', 'stethoscope', ['ליבה בי"ח: קמיליון, קליקס בי"ח', 'ליבה קהילה: קליקס', 'תחומי נישה: אונקופרו, דטוס ועוד'], ["מע' תומכות החלטה: Cpi, מבט", 'הקלדה קולית: הקלדה קולית, DIXILANG'], []),
    ('מערכות מעבדה', 'flask-conical', ["מע' מעבדה: Labos, מעבדות, Labway"], [], ['סקטרה: פתולוגיה דיגיטלית']),
    ('מערכות דימות', 'scan-line', ['מערכת RIS'], [], ['דימות: PACS, פיליפס ועוד']),
    ("מע' אדמיניסטרטיביות", 'clipboard-list', ['ליבה קהילה ובי"ח: מנור, עידן, עומרי', "מע' ארכוב ומע' תרופות"], ['זימון תורים: MyVisit, Q-Flow', 'מערכות משלימות: תער, מטר, ועוד'], ["מע' ניהול סיכונים: תבונה"]),
    ('מכשור רפואי והקלטות', 'monitor-dot', ['תשתית אנסמבל'], [], ['קליטת נתונים ממכשור']),
    ('דיגיטל ואונליין', 'smartphone', ['תקשורת בין מטופלים'], ["מע' אונליין: אפליקציה ואתרי אזור אישי"], []),
    ('כספים, אינטגרציה ומחקר', 'landmark', ['אינטגרציה'], ['כספים'], ['מחקר']),
]
def chip_runs(t):
    if ':' in t:
        a, b = t.split(':', 1)
        return [(a + ':', {'bold': True}), (b, {'bold': False})]
    return [(t, {'bold': True})]

def s09(d, n=9):
    s = d.new()
    ids = head(s, n, 'פלטפורמה מחשובית אחודה', sub='מפת המערכות וההמלצות להחלפה')
    intro(s, ids)
    xs = {'cat': (10.05, 2.68), 'prio': (6.85, 3.08), 'exam': (3.67, 3.08), 'keep': (0.6, 2.95)}
    hy = 1.78
    heads = {'cat': ('קטגוריה / המלצה', C.PETROL, C.WHITE), 'prio': ('עדיפות ראשונה להחלפה', C.TEAL, C.WHITE),
             'exam': ('בחינת החלפה בהמשך התהליך', C.AMBER, C.WHITE), 'keep': ('לשמר ולבצע אינטגרציה', '7D9296', C.WHITE)}
    cols = {k: [] for k in xs}
    for k, (x, w) in xs.items():
        t, f, tc = heads[k]
        hg = s.group(f'head {k}')
        with hg:
            s.text(x, hy, w, 0.42, [t], size=13, bold=True, color=tc, fill=f, r=0.1, align='ctr', anchor='ctr')
            s.icon({'cat': 'layout-grid', 'prio': 'target', 'exam': 'search', 'keep': 'link'}[k], x + w - 0.24, hy + 0.21, 0.2, C.WHITE, 2.2)
        cols[k].append(hg.id)
    y = hy + 0.55; chh, st = 0.33, 0.38
    for i, (cat, ic, p, e, kp) in enumerate(T9):
        nlines = max(len(p), len(e), len(kp), 1)
        rh = nlines*st + 0.08
        band = s.rect(MX, y - 0.02, SW - 2*MX, rh, C.WHITE if i % 2 == 0 else 'EEF5F4', None, r=0.06, name='row band')
        x, w = xs['cat']
        g = s.group(f'cat {cat}')
        with g:
            s.oval(x + w - 0.24, y + rh/2 - 0.02, 0.36, C.TEAL_T, None)
            s.icon(ic, x + w - 0.24, y + rh/2 - 0.02, 0.2, C.PETROL, 2)
            s.text(x, y, w - 0.5, rh - 0.04, [cat], size=12.5, bold=True, color=C.PETROL, anchor='ctr')
        cols['cat'].append(g.id)
        for k, items in (('prio', p), ('exam', e), ('keep', kp)):
            x, w = xs[k]; R = REC[k]
            off = (rh - 0.04 - len(items)*st) / 2 + 0.025
            for j, t in enumerate(items):
                rtl = True
                cols[k].append(s.text(x + 0.05, y + off + j*st, w - 0.1, chh, [chip_runs(t)], size=10.5, color=R['tc'], fill=R['fill'], line=dict(c=R['line'], w=0.75, a=0.7),
                                      r=0.08, anchor='ctr', align='r', ins=(0.1, 0.0, 0.12, 0.0), name=f'{k} cell'))
        y += rh + 0.05
    # consolidation graphic (top-left): three system families converge into one platform
    gx = [(1.0, 1.0, '93A9AC', '7D9296', '6B8084'), (1.75, 0.78, C.AMBER, 'B57F12', '9A6C0F'), (2.5, 1.0, C.TURQ, C.TEAL, C.PETROL)]
    cubes = []; links = []
    for (cx_, cy_, top, l_, r_) in gx:
        cubes.append(iso_slab(s, cx_, cy_, 0.55, 0.22, top, l_, r_, 'system cube'))
    for (cx_, cy_, *_rest) in gx:
        links.append(s.path(bez((cx_ + 0.2, cy_ + 0.25), (3.55, 1.12), 0.5), line=dict(c=C.TEAL, w=1, dash='sysDot'), name='converge'))
    plat = iso_slab(s, 3.95, 1.0, 1.1, 0.16, dict(grad=[(0, C.LIME), (100, C.TURQ)], ang=45), C.TEAL, C.PETROL, 'unified platform')
    pdots = [dot(s, cx_ + 0.2, cy_ + 0.25, 0.08, C.LIME) for (cx_, cy_, *_r) in gx]
    for k in ('cat', 'prio', 'exam', 'keep'):
        s.anim.click(*[fade(c, j*45, 400) for j, c in enumerate(cols[k])])
    s.anim.click(*[zoom(c, i*150, 400, 0.5) for i, c in enumerate(cubes)], *[wipe(l, 400 + i*120, 400, 'right') for i, l in enumerate(links)],
                 zoom(plat, 800, 500, 0.5), *[flow(p, mpath_curve((gx[i][0] + 0.2, gx[i][1] + 0.25), [bez((gx[i][0] + 0.2, gx[i][1] + 0.25), (3.55, 1.12), 0.5)[1]]), 1200 + i*400, 1400, repeat='indefinite') for i, p in enumerate(pdots)])
    s.transition = 'morph'
    return s

# ---------------------------------------------------------------- 10 ONE WIDE PLATFORM (architecture)
def s10(d, n=10):
    s = d.new()
    ids = head(s, n, 'פלטפורמה מחשובית אחודה', sub='פלטפורמה אחת רחבה')
    intro(s, ids)
    # unified platform box (left) - same relative layout as the source diagram
    px, py, pw, ph = 0.9, 1.95, 6.85, 3.35
    plat = s.group('unified platform')
    with plat:
        s.rect(px, py, pw, ph, dict(grad=[(0, C.WHITE), (100, 'E4F1EF')], ang=90), dict(c=C.TEAL, w=1.5), r=0.2, shadow='md')
        s.rect(px + pw/2 - 1.45, py - 0.2, 2.9, 0.42, C.PETROL, None, r=0.21)
        s.text(px + pw/2 - 1.45, py - 0.2, 2.9, 0.42, ['הפלטפורמה האחודה'], size=14, bold=True, color=C.WHITE, align='ctr', anchor='ctr')
    mods = [('מערכת מידע קליני', 'monitor-dot', 0, 0), ('תרופות', 'pill', 1, 0), ('מעבדות', 'test-tubes', 2, 0), ('דימות (RIS)', 'scan', 3, 0),
            ('אדמיניסטרציה', 'clipboard-list', 0, 1), ('דשבורדים', 'chart-column', 1, 1)]
    mids = []
    mw = 1.5
    for t, ic, c, r in mods:
        cx = px + pw - 0.95 - c*1.62; cy = py + 0.95 + r*1.42
        g = s.group(f'module {t}')
        with g:
            s.rect(cx - mw/2, cy - 0.55, mw, 1.18, C.WHITE, dict(c=C.LINE, w=0.75), r=0.14, shadow='sm')
            s.oval(cx, cy - 0.17, 0.5, C.TEAL_T, None)
            s.icon(ic, cx, cy - 0.17, 0.28, C.PETROL, 1.9)
            s.text(cx - mw/2 + 0.05, cy + 0.15, mw - 0.1, 0.4, [t], size=11.5, bold=True, color=C.INK, align='ctr', anchor='ctr', lnspc=90)
        mids.append(g.id)
    # external solutions (right)
    ext = s.group('external label')
    with ext:
        s.text(8.75, 1.82, 3.95, 0.4, ['פתרונות חוץ'], size=15, bold=True, color=C.PETROL, align='ctr')
        s.rect(9.85, 2.22, 1.75, 0.03, C.LIME, None)
    exts = [('מערכות קליניות ייעודיות ומיכשור רפואי', 'folder-plus', 9.35, 2.95), ('ERP', 'server-cog', 11.85, 2.95),
            ('CRM', 'contact', 12.15, 4.2), ('MARKET PLACE AI', 'shopping-cart', 10.4, 4.55)]
    eids = []
    for t, ic, cx, cy in exts:
        g = s.group(f'external {t}')
        with g:
            s.oval(cx, cy - 0.2, 0.62, C.WHITE, dict(c=C.TEAL, w=1.25), shadow='sm')
            s.icon(ic, cx, cy - 0.2, 0.32, C.TEAL, 1.9)
            heb = is_heb(t)
            s.text(cx - 0.95, cy + 0.15, 1.9, 0.55, [t], size=11.5, bold=True, color=C.INK, align='ctr', lnspc=90, rtl=heb)
        eids.append(g.id)
    dbl = s.shape(7.85, 2.62, 0.75, 0.36, 'leftRightArrow', dict(grad=[(0, C.TEAL_T), (100, C.WHITE)], ang=90), dict(c=C.TEAL, w=1), name='bidirectional')
    # data lake
    lake = s.group('data lake')
    with lake:
        s.shape(2.4, 5.95, 7.6, 0.95, 'can', dict(grad=[(0, 'CFE9E6'), (100, '9CCFCB')], ang=90), dict(c=C.TEAL, w=1), adj={'adj': 30000}, shadow='md')
        s.icon('database', 5.0, 6.55, 0.28, C.PETROL, 2)
        s.text(5.3, 6.33, 2.5, 0.45, [[('Data Lake', {'lang': 'en-US'})]], size=17, bold=True, color=C.PETROL, align='l', rtl=False, anchor='ctr')
    cons = []; parts = []
    for i, (x0, y0) in enumerate([(2.7, py + ph), (4.9, py + ph), (6.95, py + ph), (9.35, 5.2)]):
        x1 = [3.4, 4.6, 6.3, 8.95][i]
        pts = [(x0, y0 + 0.02), (x0, y0 + 0.28), (x1, y0 + 0.32), (x1, 6.08)] if i < 3 else [(x0, y0), (x0, 5.55), (x1, 5.6), (x1, 6.1)]
        cons.append(s.path(pts, line=dict(c=C.TEAL, w=1.25, dash='sysDot'), name=f'lake link {i}'))
        p = dot(s, *pts[0], 0.09, C.LIME)
        parts.append(flow(p, mpath_pts(pts), 900 + i*350, 1700))
    s.anim.click(fade(plat.id, 0, 500), *[zoom(m, 250 + i*110, 450, 0.75) for i, m in enumerate(mids)])
    s.anim.click(fade(ext.id, 0, 400), *[zoom(e, 150 + i*120, 450, 0.75) for i, e in enumerate(eids)], wipe(dbl, 700, 500, 'right'))
    s.anim.click(rise(lake.id, 0, 600), *[wipe(c, 400 + i*120, 500, 'down') for i, c in enumerate(cons)], *parts)
    s.transition = 'morph'
    return s

# ---------------------------------------------------------------- 11 AI PRO / C-Pi video placeholder
def s11(d, n=11):
    s = d.new(dark=True, bg=dict(radial=[(0, '0B4E59'), (60, C.NIGHT2), (100, C.NIGHT)], c=(50, 55)))
    s.num(n); s.logo()
    ey = s.text(MX, 0.5, SW - 2*MX, 0.3, [[('סרטון', {})]], size=11, bold=True, color=C.AQUA, align='ctr', name='!!eyebrow')
    tt = s.text(MX, 0.78, SW - 2*MX, 0.75, [[('AI PRO', {'lang': 'en-US', 'color': C.WHITE}), ('  ·  ', {'color': C.LIME}), ('C-Pi', {'lang': 'en-US', 'color': C.WHITE})]],
                size=36, bold=True, align='ctr', rtl=False, name='!!title')
    fw = 8.9; fh = fw * 9/16; fx = (SW - fw)/2; fy = 1.72
    glow = s.rect(fx - 0.06, fy - 0.06, fw + 0.12, fh + 0.12, None, dict(c=dict(grad=[(0, C.LIME), (50, C.AQUA), (100, C.TEAL)], ang=30), w=2.25), r=0.26,
                  glow=(C.AQUA, 18, 0.25), name='video frame glow')
    frame = s.rect(fx, fy, fw, fh, dict(radial=[(0, '0F3F48'), (100, '061D22')], c=(50, 45)), dict(c='1D4B53', w=0.75), r=0.22, name='!!video-area',
                   descr='אזור מוכן להטמעת הסרטון על מערכת AI PRO – C-Pi (הוספה: Insert > Video, ולמקם בגבולות המסגרת)')
    play = s.group('play mark')
    with play:
        s.oval(SW/2, fy + fh/2, 1.15, (C.WHITE, 0.08), dict(c=C.WHITE, w=1.25, a=0.6))
        s.shape(SW/2 - 0.17, fy + fh/2 - 0.25, 0.46, 0.5, 'triangle', C.WHITE, None, rot=90)
    corners = []
    for (cx, cy, rot) in [(fx + 0.3, fy + 0.3, 0), (fx + fw - 0.3, fy + 0.3, 90), (fx + fw - 0.3, fy + fh - 0.3, 180), (fx + 0.3, fy + fh - 0.3, 270)]:
        corners.append(s.path([(cx, cy + 0.3), (cx, cy), (cx + 0.3, cy)] if rot == 0 else [(cx - 0.3, cy), (cx, cy), (cx, cy + 0.3)] if rot == 90 else
                              [(cx, cy - 0.3), (cx, cy), (cx - 0.3, cy)] if rot == 180 else [(cx + 0.3, cy), (cx, cy), (cx, cy - 0.3)], line=dict(c=C.LIME, w=1.5), name='frame corner'))
    s.anim.auto(fade(ey, 0, 500), rise(tt, 100, 800, 0.03), zoom(frame, 300, 900, 0.92), fade(glow, 600, 900), fade(play, 900, 600), *[fade(c, 1000 + i*100, 400) for i, c in enumerate(corners)])
    s.transition = 'fade'
    return s

# ---------------------------------------------------------------- 12 AI PRO clinical topics
EXIST12 = ['סוכרת', 'דיסליפידמיה', 'יתר לחץ דם', 'אוסטאופורוזיס מניעה שניונית', 'השמנה', 'הפטיטיס C', 'ניטור טיפול תרופתי', 'הפניות קריטיות שלא בוצעו', 'מדדי איכות']
NEW12 = ['דיכאון וחרדה', 'מחלת כליות כרונית', 'גילוי מוקדם סרטן', 'חיסונים']
def s12(d, n=12):
    s = d.new()
    ids = head(s, n, 'נושאים קליניים קיימים לרופאים', sub='תמיכה מפורטת בקבלת החלטות!')
    intro(s, ids)
    mon, (sx, sy, sw_, sh_) = s.monitor(0.55, 1.85, 6.75, 'image64.png')
    # highlight on the topic menu of the real screenshot
    hl = s.rect(sx + sw_*0.855, sy + sh_*0.31, sw_*0.14, sh_*0.47, None, dict(c=C.LIME, w=2.25), r=0.05, glow=(C.LIME, 6, 0.4), name='menu highlight')
    lbl = s.chip(sx + sw_*0.855 - 0.1, sy + sh_*0.31 - 0.42, 1.25, 0.3, 'תפריט הנושאים', C.LIME, C.PETROL, size=10)
    # existing topics
    x0 = 7.75; cw = 2.4; gap = 0.14
    ex = []
    for i, t in enumerate(EXIST12):
        c = i % 2; r = i // 2
        x = SW - MX - cw - c*(cw + gap); y = 2.0 + r*0.45
        g = s.group(f'topic {t}')
        with g:
            s.rect(x, y, cw, 0.36, C.WHITE, dict(c=C.LINE, w=0.75), r=0.1, shadow='sm')
            s.icon('check', x + cw - 0.2, y + 0.18, 0.18, C.TEAL, 2.5)
            s.text(x + 0.08, y, cw - 0.48, 0.36, [t], size=11.5, bold=True, color=C.INK, anchor='ctr')
        ex.append(g.id)
    # new topics block
    nb = s.group('new block')
    with nb:
        s.rect(7.75, 4.4, 4.98, 2.0, dict(grad=[(0, C.PETROL), (100, '0A5A66')], ang=0), None, r=0.18, shadow='md')
    four = s.text(11.2, 4.35, 1.45, 1.55, [[('4', {'lang': 'en-US'})]], size=92, bold=True, color=C.LIME, align='ctr', anchor='ctr', rtl=False, name='big four', font=C.FONT_XB)
    four_l = s.text(11.0, 5.75, 1.85, 0.55, ['נושאים קליניים', 'חדשים'], size=11.5, bold=True, color=C.WHITE, align='ctr', lnspc=90)
    nw = []
    for i, t in enumerate(NEW12):
        c = i % 2; r = i // 2
        x = 10.95 - 1.45 - c*1.55; y = 4.6 + r*0.84
        g = s.group(f'new topic {t}')
        with g:
            s.rect(x, y, 1.45, 0.7, (C.LIME, 0.14), dict(c=C.LIME, w=1), r=0.12)
            s.text(x + 0.05, y + 0.05, 1.35, 0.38, [t], size=12, color=C.WHITE, align='ctr', anchor='ctr', lnspc=88)
            s.chip(x + 0.42, y + 0.44, 0.6, 0.2, 'חדש!', C.LIME, C.PETROL, size=8.5, strong=True)
        nw.append(g.id)
    stmt = s.text(0.6, 6.42, 6.65, 0.42, [[('בשנה הקרובה רמת האיכות של הטיפול במבוטחי כללית תעלה מדרגה ב-', {}), ('4', {'color': C.GREEN}), (' נושאים קליניים חדשים!', {})]],
                  size=13, bold=True, color=C.PETROL, align='ctr', anchor='ctr', name='statement')
    s.anim.auto(fade(mon, 300, 700))
    s.anim.click(*[rise(e, i*80, 450, 0.02) for i, e in enumerate(ex)], wipe(hl, 500, 500, 'down'), fade(lbl, 700, 300))
    s.anim.click(fade(nb.id, 0, 400), zoom(four, 200, 700, 0.5), fade(four_l, 600, 400), *[zoom(x, 700 + i*170, 500, 0.7) for i, x in enumerate(nw)], pulse(four, 1600, 500, 1.08))
    s.anim.click(rise(stmt, 0, 600))
    return s

# ---------------------------------------------------------------- 13 PROACTIVE APPOINTMENT
def s13(d, n=13):
    s = d.new()
    ids = head(s, n, 'תור פרואקטיבי', sub=[[('אחרי שהמטופלים מתועדפים ב-', {}), ('C-Pi', {'lang': 'en-US'}), (', רופאי המשפחה יכולים להזמין אותם לתור פרואקטיבי ', {}), ('בלחיצת כפתור', {'bold': True, 'color': C.GREEN})]])
    intro(s, ids)
    mon, (sx, sy, sw_, sh_) = s.monitor(5.25, 1.9, 7.45, 'image65.jpg')
    bx, by = sx + sw_*0.2295, sy + sh_*0.923
    # zoom lens: real crop of the button area
    crop = (170/1290, 590/769, (1290 - 430)/1290, 0)
    lw, lh = 3.75, 3.75 * (179*1.0/260) * (1290/1290)
    lh = lw * 179/260
    lx, ly = 0.75, 2.45
    cone = s.path([(lx + lw, ly + 0.25), (bx - 0.25, by - 0.2), (bx - 0.25, by + 0.12), (lx + lw, ly + lh - 0.25)], fill=(C.TEAL, 0.10), closed=True, name='zoom cone')
    ring = s.rect(bx - 0.3, by - 0.24, 0.6, 0.42, None, dict(c=C.LIME, w=2), r=0.08, name='button marker')
    lens = s.group('zoom lens')
    with lens:
        s.rect(lx - 0.07, ly - 0.07, lw + 0.14, lh + 0.14, C.WHITE, dict(c=C.TEAL, w=1.5), r=0.22, shadow='lg')
        s.pic('image65.jpg', lx, ly, lw, lh, crop=crop, r=0.17, name='zoomed button')
        k_ = lw / 260
        # crisp re-typeset of the interface text shown in the screenshot (same wording and position)
        s.rect(lx + 66*k_, ly + 30*k_, 122*k_, 64*k_, C.WHITE, dict(c='E3E7EC', w=0.75), r=0.08, shadow='sm', name='tooltip')
        s.text(lx + 70*k_, ly + 33*k_, 108*k_, 58*k_, ['לא קיים תור עתידי.', 'לחץ לשליחת SMS', 'להזמנה לתור'], size=12, color='3C4043', align='r', anchor='ctr', lnspc=100, name='tooltip text')
        s.shape(lx + 121*k_, ly + 93*k_, 12*k_, 7*k_, 'triangle', C.WHITE, None, flipV=True, name='tooltip tip')
        s.oval(lx + 127*k_, ly + 119*k_, 37*k_, 'E8F0FE', dict(c='4A86E8', w=1.25), name='button')
        s.icon('calendar-check', lx + 127*k_, ly + 119*k_, 17*k_, '1A73E8', 2)
        s.rect(lx + 96*k_, ly + 146*k_, 64*k_, 16*k_, C.WHITE, None, name='label bg')
        s.text(lx + 92*k_, ly + 145*k_, 72*k_, 18*k_, ['הזמנה לתור'], size=11, color='3C4043', align='ctr', anchor='ctr', name='button label')
    tbx, tby = lx + lw*0.485, ly + lh*0.67
    cur = s.icon('mouse-pointer-2', tbx + 0.9, tby + 0.75, 0.42, C.INK, 2, nm='cursor')
    rip = s.oval(tbx, tby, 0.55, (C.LIME, 0.35), dict(c=C.LIME, w=2), name='click ripple')
    ok = s.group('sent')
    with ok:
        s.oval(tbx + 0.33, tby - 0.3, 0.36, C.GREEN, dict(c=C.WHITE, w=1.5), shadow='sm')
        s.icon('check', tbx + 0.33, tby - 0.3, 0.2, C.WHITE, 3)
    sms = s.group('sms out')
    with sms:
        s.rect(lx + 0.6, ly + lh + 0.35, 2.55, 0.5, C.PETROL, None, r=0.25, shadow='sm')
        s.icon('message-square-text', lx + 0.6 + 2.25, ly + lh + 0.6, 0.26, C.LIME, 2)
        s.text(lx + 0.7, ly + lh + 0.35, 1.95, 0.5, [[('SMS', {'lang': 'en-US'}), (' להזמנה לתור', {})]], size=12.5, bold=True, color=C.WHITE, anchor='ctr', align='r')
    ph = s.group('patient')
    with ph:
        s.oval(lx + 0.18, ly + lh + 0.6, 0.5, C.LIME, None)
        s.icon('smartphone', lx + 0.18, ly + lh + 0.6, 0.27, C.PETROL, 2)
    s.anim.auto(fade(mon, 300, 700))
    s.anim.click(fade(ring, 0, 300), pulse(ring, 300, 500, 1.15), fade(cone, 400, 500), zoom(lens.id, 400, 700, 0.4))
    s.anim.click(fade(cur, 0, 300), move(cur, mpath(tbx + 0.9, tby + 0.75, tbx + 0.12, tby + 0.15), 200, 900),
                 zoom(rip, 1150, 350, 0.3), fadeout(rip, 1500, 400), zoom(ok.id, 1400, 450, 0.3))
    s.anim.click(slide_in(sms.id, 0, 600, 0.4), zoom(ph.id, 500, 500, 0.5), pulse(ph.id, 1000, 500, 1.1))
    return s

# ---------------------------------------------------------------- 14 C-Pi for nurses
WIN14 = [('מדדי איכות', (0.15, 0.0, 1 - 0.515, 1 - 0.2)),
         ('אשפוז חוזר', (0.52, 0.0, 1 - 0.79, 1 - 0.33)),
         ('מטופלים למעקב', (0.17, 0.21, 1 - 0.42, 1 - 0.6)),
         ('קשיש בסיכון', (0.56, 0.38, 1 - 0.81, 1 - 0.6)),
         ('כללית לידיעתך', (0.82, 0.6, 0.0, 1 - 0.75))]
def s14(d, n=14):
    s = d.new()
    ids = head(s, n, [[('פלטפורמת ', {}), ('C-Pi', {'lang': 'en-US'}), (' אֲחָיוּת', {})]])
    intro(s, ids)
    lap, (sx, sy, sw_, sh_) = s.laptop(0.85, 4.05, 6.6, 'image71.png')
    tx, ty = sx + sw_/2, sy + sh_/2
    wins = []; conv = []; lines = []
    w = 1.36; h = 0.98
    for i, (t, cr) in enumerate(WIN14):
        x = 0.6 + i*(w + 0.12); y = 1.85 + (0.18 if i in (1, 3) else 0)
        l, tp, r, b = cr
        ln = s.path(bez((x + w/2, y + h + 0.02), (tx, sy - 0.05), 0.55, 'v'), line=dict(c=C.TEAL, w=1, dash='sysDot', a=0.8), name='converge line')
        lines.append(ln)
        g = s.group(f'window {t}')
        with g:
            s.rect(x, y, w, h, C.WHITE, dict(c=C.LINE, w=0.75), r=0.06, shadow='md')
            s.rect(x, y, w, 0.22, 'E3ECEC', None, r=0.06)
            for k, cc in enumerate(['E06C5A', 'E5B44C', '6CBF6A']):
                s.oval(x + 0.1 + k*0.1, y + 0.11, 0.055, cc, None)
            s.pic('image70.png', x + 0.03, y + 0.24, w - 0.06, h - 0.27, crop=(l, tp, r, b), name='legacy screen')
        lab = s.text(x - 0.05, y - 0.3, w + 0.1, 0.26, [t], size=10.5, bold=True, color=C.MUTED, align='ctr', name='window label')
        wins.append((g.id, lab))
        conv += [move(g.id, mpath(x + w/2, y + h/2, tx, ty), 1800 + i*90, 850), fadeout(g.id, 2350 + i*90, 350), fadeout(lab, 1650, 300), fadeout(ln, 1950, 400)]
    logo = s.group('cpi logo')
    with logo:
        s.rect(0.95, 3.45, 1.7, 0.46, C.WHITE, dict(c=C.LINE, w=0.75), r=0.1, shadow='sm')
        s.pic('image72.png', 1.07, 3.5, h=0.36, name='C-Pi Powered by AI PRO')
    desc = s.text(8.0, 1.85, 4.73, 2.3, [[('במאמץ חוצה ארגון פותחה והונגשה פלטפורמת ', {}), ('C-Pi', {'lang': 'en-US'}), (' לאחיות – ', {}),
                                          ('מעבר מריבוי אתרים ומערכות למסך מרכזי אחד', {'bold': True, 'color': C.PETROL}), (' המכיל את כל ההמלצות לגבי המטופל:', {})]],
                  size=15, color=C.INK, lnspc=115, name='description')
    val = s.group('value')
    with val:
        s.rect(8.0, 4.3, 4.73, 2.25, dict(grad=[(0, C.PETROL), (100, C.TEAL)], ang=45), None, r=0.2, shadow='md')
        s.oval(12.2, 4.85, 0.6, C.LIME, None); s.icon('clock', 12.2, 4.85, 0.32, C.PETROL, 2)
        s.text(8.2, 4.58, 3.6, 0.55, ['מיקסום זמן הביקור לאח.ות'], size=17, bold=True, color=C.WHITE, anchor='ctr')
        s.icon('arrow-down', 10.6, 5.42, 0.3, C.LIME, 2.5)
        s.oval(12.2, 6.0, 0.6, C.WHITE, None); s.icon('heart-pulse', 12.2, 6.0, 0.32, C.PETROL, 2)
        s.text(8.2, 5.73, 3.6, 0.55, ['רפואה טובה יותר למטופלים'], size=17, bold=True, color=C.LIME, anchor='ctr')
    s.anim.click(*[x for i, (g, lab) in enumerate(wins) for x in (zoom(g, i*130, 450, 0.8), fade(lab, i*130 + 150, 300))], *[wipe(l, 700, 500, 'down') for l in lines])
    s.anim.click(*conv, zoom(lap, 2550, 700, 0.85), fade(logo.id, 3050, 400), fade(desc, 3050, 600))
    s.anim.click(rise(val.id, 0, 600), pulse(val.id, 700, 500, 1.03))
    return s

# ---------------------------------------------------------------- 15 C-Pi women dashboard
WAYS15 = [('אפליקציה לטיוב אבחנות', 'טיוב רובסטי, משמעותי ופשוט יותר של האבחנות', 'circle-check'),
          ('מיפוי דאטה מסודר', 'איפה כל משתנה נמצא בנתונים ולוגיקת שליפה', 'database'),
          ('מקווים מנחים רפואיים ללוגיקה', 'הדרך מגיידליין לעץ או למטריצה קצרה משמעותית', 'zap'),
          ('בדיקות איכות לעצים', 'איתור מקרי קצה וענפים חסרים בלוגיקה', 'search'),
          ('עבודה עם דימים שבונים את המלצות המערכת', 'מעל 1,000 הערות והמלצות מקושרות לדימים ממוספרים', 'link'),
          ('תיקון עצים מבוקר', 'זיהוי פשוט של נקודות לתיקון, מבלי להכניס בעיות חדשות', 'wrench')]
DOM15 = ['סקר ביוכימי', 'בדיקות גנטיות', 'סרולוגיה: CMV, טוקסו, פרבו-וירוס', 'בדיקות סונר', 'סקירות', 'חיסונים', 'סוכרת', 'הפרעות לחץ דם בהריון', 'תירואיד', 'אנמיה', 'תרומבוציטופניה', 'מחלות רקע נוספות']
def s15(d, n=15):
    s = d.new()
    ids = head(s, n, [[('C-Pi', {'lang': 'en-US'}), (' נשים: פיתוח מואץ בעזרת בינה מלאכותית', {})]])
    intro(s, ids)
    kw = 3.95; kg = 0.14
    kp = []
    specs = [('13+', 'תחומים קליניים בעצים ובמטריצות', [str(v) + '+' for v in (1, 3, 5, 7, 9, 11, 12)], C.PETROL),
             ('1,000+', 'הערות והמלצות / עלים סופיים של עצים', [f'{v:,}+' for v in (50, 150, 300, 450, 600, 750, 880, 960)], C.TEAL),
             ('~שנה', 'מתחילת הפיתוח ועד עלייה לייצור', None, '0B5C69')]
    for i, (val, lab, frames, col) in enumerate(specs):
        x = SW - MX - kw - i*(kw + kg); y = 1.68
        cardid = s.rect(x, y, kw, 1.55, col, None, r=0.18, shadow='md', name=f'kpi card {i}')
        s.text(x + 0.25, y + 0.98, kw - 0.5, 0.45, [lab], size=12.5, bold=True, color='CDEDEC', align='r', name='kpi label')
        if frames:
            fin, fx = countup(s, x + 0.25, y + 0.12, kw - 0.5, 0.9, frames, [(val, {'lang': 'en-US'})], 46, C.LIME, col, align='r', start=300 + i*100)
            kp.append((cardid, fin, fx))
        else:
            fin = s.text(x + 0.25, y + 0.12, kw - 0.5, 0.9, [[('~', {'lang': 'en-US'}), ('שנה', {})]], size=46, bold=True, color=C.LIME, align='r', anchor='ctr', name='kpi value', font=C.FONT_XB)
            kp.append((cardid, fin, [rise(fin, 300, 600, 0.03)]))
    # six ways
    hdr = s.text(MX, 3.45, SW - 2*MX, 0.35, [[('כך הבינה המלאכותית מאיצה את הפיתוח', {})]], size=13, bold=True, color=C.TEAL, name='section label')
    tw = (SW - 2*MX - 5*0.14) / 6
    tiles = []
    for i, (t, ds, ic) in enumerate(WAYS15):
        x = SW - MX - tw - i*(tw + 0.14); y = 3.85
        g = s.group(f'way {t}')
        with g:
            s.rect(x, y, tw, 1.78, C.WHITE, dict(c=C.LINE, w=0.75), r=0.14, shadow='sm')
            s.oval(x + tw - 0.38, y + 0.38, 0.48, C.TEAL_T, None)
            s.icon(ic, x + tw - 0.38, y + 0.38, 0.26, C.TEAL, 2)
            s.text(x + 0.12, y + 0.7, tw - 0.24, 0.5, [t], size=11.5, bold=True, color=C.PETROL, lnspc=90)
            s.text(x + 0.12, y + 1.18, tw - 0.24, 0.6, [ds], size=9.5, color=C.MUTED, lnspc=100)
        tiles.append(g.id)
    # domains
    dl = s.text(SW - MX - 2.3, 5.88, 2.3, 0.32, ['דוגמאות לתכנים מכוסים:'], size=11.5, bold=True, color=C.PETROL, anchor='ctr')
    xr = SW - MX - 2.35; y = 5.88; chips = []
    for t in DOM15:
        w = 0.32 + len(t) * 0.085
        if xr - w < MX:
            xr = SW - MX; y += 0.42
        chips.append(s.chip(xr - w, y, w, 0.32, t, C.WHITE, C.INK, size=10.5, bold=False, line=dict(c=C.LINE, w=0.75)))
        xr -= w + 0.1
    s.anim.click(*[x for (c, f, fx) in kp for x in [rise(c, 0, 500, 0.02)] + fx], *[fade(c, 0, 300) for c in []])
    s.anim.click(fade(hdr, 0, 300), *[rise(t, 100 + i*110, 500, 0.03) for i, t in enumerate(tiles)])
    s.anim.click(fade(dl, 0, 300), *[fade(c, 100 + i*50, 350) for i, c in enumerate(chips)])
    return s

# ---------------------------------------------------------------- 16 BREAST CANCER outreach
def s16(d, n=16):
    s = d.new(bg=dict(radial=[(0, C.WHITE), (100, C.BG)], c=(30, 40)))
    ids = head(s, n, 'הזמנה פרואקטיבית לשאלון הערכת סיכון לסרטן השד')
    intro(s, ids)
    # big number
    blk = s.group('stat block')
    with blk:
        s.rect(7.0, 1.75, 5.73, 2.45, C.WHITE, dict(c=C.LINE, w=0.75), r=0.2, shadow='md')
    fin, fx = countup(s, 7.15, 1.78, 5.43, 1.5, ['0.1M', '0.3M', '0.5M', '0.7M', '0.9M', '1.0M', '1.1M'], [('1.2M', {'lang': 'en-US'})], 88, C.PETROL, C.WHITE, align='ctr', start=200, step=70, name='1.2M')
    cap = s.text(7.25, 3.25, 5.23, 0.8, ['מבוטחות בגילאים הרלוונטיים', 'מקבלות את השאלון באופן פרואקטיבי'], size=15, bold=True, color=C.MUTED, align='ctr', lnspc=105)
    # campaign material
    ban = s.group('campaign')
    with ban:
        s.rect(7.0, 4.42, 5.73, 2.42, C.WHITE, dict(c=C.LINE, w=0.75), r=0.2, shadow='sm')
        s.pic('image79.png', 7.12, 4.54, h=2.18, r=0.1, name='campaign banner')
        s.text(10.65, 4.55, 1.95, 2.15, ['חומר קמפייני', [('חודש המודעות הבינלאומי לסרטן שד', {'bold': False, 'color': C.MUTED, 'size': 11})]], size=13, bold=True, color=C.PETROL, anchor='ctr', lnspc=110)
    # phone with real chat screen
    phone = s.pic('image80.png', 3.05, 1.62, h=5.25, crop=(0.155, 0.0, 0.13, 0.0), name='patient chat', shadow='lg', r=0.42)
    # proactive outreach visual
    src = s.group('clalit sender')
    with src:
        s.oval(1.2, 3.05, 0.9, C.PETROL, None, shadow='md')
        s.icon('heart-handshake', 1.2, 3.05, 0.44, C.WHITE, 1.8)
        s.text(0.55, 3.6, 1.3, 0.55, ['פנייה', 'יזומה'], size=12, bold=True, color=C.PETROL, align='ctr', lnspc=90)
    path_pts = [(1.65, 3.05), ((2.2, 3.05), (2.4, 2.55), (3.25, 2.55))]
    arc = s.path(path_pts, line=dict(c=C.TEAL, w=1.5, dash='sysDot'), name='outreach path')
    env = s.group('message')
    with env:
        s.oval(1.65, 3.05, 0.42, C.LIME, dict(c=C.WHITE, w=1.5), shadow='sm')
        s.icon('message-circle-heart', 1.65, 3.05, 0.24, C.PETROL, 2)
    s.anim.click(fade(src.id, 0, 400), wipe(arc, 300, 500, 'right'), fade(env.id, 300, 200), move(env.id, mpath_curve((1.65, 3.05), [path_pts[1]]), 400, 900),
                 rise(phone, 900, 700, 0.04), fadeout(env.id, 1300, 300))
    s.anim.click(fade(blk.id, 0, 400), *fx, fade(cap, 900, 500))
    s.anim.click(rise(ban.id, 0, 600))
    return s
