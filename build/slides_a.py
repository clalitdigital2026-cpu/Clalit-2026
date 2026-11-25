# -*- coding: utf-8 -*-
from kit import *
import random

# ---------------------------------------------------------------- 1 COVER
def s01(d):
    s = d.new(dark=True, bg=C.NIGHT)
    img = s.pic('image2.png', 0, 0, SW, SH, name='hero image')
    tint = s.rect(0, 0, SW, SH, (C.PETROL, 0.28), name='petrol grade')
    ov = s.rect(0, 0, SW, SH, dict(grad=[(0, C.NIGHT, 0.97), (34, C.NIGHT, 0.9), (58, C.NIGHT, 0.35), (78, C.NIGHT, 0.0)], ang=0), name='left fade')
    ov2 = s.rect(0, 5.2, SW, 2.3, dict(grad=[(0, C.NIGHT, 0), (100, C.NIGHT, 0.85)], ang=90), name='bottom fade')
    # holographic rings around the heart
    r1 = s.oval(6.35, 2.95, 3.3, None, dict(c=C.AQUA, w=0.75, a=0.35, dash='sysDash'), name='holo ring 1')
    r2 = s.oval(6.35, 2.95, 4.1, None, dict(c=C.LIME, w=0.5, a=0.25), name='holo ring 2')
    t1 = s.text(0.75, 1.55, 6.2, 0.95, [[('מעצבים את', {})]], size=48, bold=True, color=C.WHITE, align='r', name='cover line 1', font=C.FONT_XB)
    t2 = s.text(0.75, 2.4, 6.2, 1.05, [[('רפואת העתיד', {})]], size=58, bold=True, color=C.WHITE, align='r', name='cover line 2', font=C.FONT_XB)
    t3 = s.text(0.75, 3.45, 6.2, 1.0, [[('בעידן ה-', {}), ('AI', {'lang': 'en-US'})]], size=58, bold=True, color=C.LIME, align='r', name='cover line 3', font=C.FONT_XB)
    nm = s.text(0.75, 4.75, 6.2, 0.45, [[('אבי עטיה', {})]], size=22, bold=True, color=C.WHITE, align='r', name='presenter')
    role = s.text(0.75, 5.2, 6.2, 0.35, [[('סמנכ"ל, חטיבת מערכות מידע ודיגיטל', {})]], size=14, color='A9C9CB', align='r', name='role', font=C.FONT_L)
    # particles
    random.seed(4)
    parts = []
    for i in range(14):
        x = random.uniform(5.2, 12.9); y = random.uniform(1.0, 7.2)
        dd = random.choice([0.05, 0.07, 0.09])
        c = random.choice([C.AQUA, C.LIME, C.WHITE])
        p = s.oval(x, y, dd, c, None, glow=(c, 5, 0.6), name=f'particle {i}')
        parts.append(flow(p, mpath(x, y, x + random.uniform(-0.3, 0.3), y - random.uniform(0.8, 1.6)),
                          delay=random.randint(0, 3000), dur=random.randint(5000, 8000)))
    lg = s.logo(white=True)
    s.anim.auto(grow(img, 0, 30000, 1.07), fade(r1, 300, 1500), fade(r2, 600, 1500), spin(r1, 300, 60000),
                rise(t1, 250, 800, 0.03), rise(t2, 450, 800, 0.03), rise(t3, 650, 800, 0.03),
                fade(nm, 1150, 700), fade(role, 1300, 700), *parts)
    return s

# ---------------------------------------------------------------- 2 TRENDS
TRENDS = [
    ('שחיקת כוח אדם ומחסור בצוותים', 'משבר כוח האדם מחייב לזהות מראש פערים, לתכנן כוח אדם לטווח ארוך ולהפחית עומס מהצוותים באמצעות אוטומציה', 'users', 'trending-down'),
    ('הזדקנות האוכלוסייה ועלייה במורכבות המטופלים', 'יותר מטופלים מבוגרים, יותר תחלואה כרונית ויותר מורכבות – מחייבים חשיבה מחדש על ייעוד המחלקות, התשתיות ותהליכי העבודה, לשם טיפול מתואם, רציף ורב־מקצועי.', 'heart-handshake', 'hourglass'),
    ('רפואה מותאמת אישית', 'שילוב מידע גנטי, רפואי ונתוני אורח חיים מאפשר להתאים טיפול תרופתי ומניעתי ברמת ה-DNA של המטופל הבודד, כחלק מגישת Longevity לשמירה על הבריאות לאורך זמן.', 'fingerprint', 'pill'),
    ('בינה מלאכותית כשותף קליני ותפעולי', 'מ-AI שמפענח בדיקות ועד אלגוריתמים המנבאים הידרדרות של מטופל שעות לפני שמתרחשים תסמינים קליניים. במישור התפעולי, AI מנהל תורים, תזמון חדרי ניתוח וניהול מיטות', 'brain-circuit', 'sparkles'),
    ('העתקת כובד המשקל מבית החולים והקהילה לבית המטופל', 'טכנולוגיות ניטור מרחוק RPM וציוד מאפשר לאשפז מטופלים בביתם בביטחון מלא, תוך הפחתת סיכוני זיהומים וחיסכון משמעותי בעלויות', 'house', 'activity'),
]
def s02(d, n=2):
    s = d.new()
    ids = head(s, n, 'המגמות המובילות כיום במערכת הבריאות העולמית')
    intro(s, ids)
    gap = 0.22; w = (SW - 2*MX - 4*gap) / 5; y0 = 1.62; h = 5.18
    arcs = [(200, 300), (230, 330), (160, 260), (250, 350), (190, 290)]
    for i, (tt, desc, ic, bd) in enumerate(TRENDS):
        x = SW - MX - w - i*(w + gap)
        g = s.group(f'trend {i+1}')
        with g:
            card(s, x, y0, w, h)
            s.text(x + 0.2, y0 + 0.18, w - 0.4, 0.3, [[(f'0{i+1}', {'lang': 'en-US'})]], size=12, bold=True, color=C.TEAL, align='r', name='index')
            emblem(s, x + w/2, y0 + 1.25, 1.35, ic, bd, *arcs[i])
            s.text(x + 0.18, y0 + 2.2, w - 0.36, 0.95, [tt], size=15.5, bold=True, color=C.PETROL, align='ctr', anchor='ctr', lnspc=92)
            s.rect(x + w/2 - 0.25, y0 + 3.22, 0.5, 0.04, C.LIME, name='divider')
            s.text(x + 0.2, y0 + 3.38, w - 0.4, 1.75, [desc], size=11.5, color=C.MUTED, align='ctr', lnspc=108)
        s.anim.click(rise(g.id, 0, 650, 0.04))
    s.notes_src = 2
    return s

# ---------------------------------------------------------------- 3 FUTURE MEDICINE: two engines
def s03(d, n=3):
    s = d.new()
    ids = head(s, n, 'רפואת העתיד', sub='שני מנועי החדשנות של כללית – והחיבור ביניהם')
    intro(s, ids)
    # ---- process / organisational engine (right)
    R = s.group('engine process')
    with R:
        card(s, 7.05, 1.75, 5.68, 4.3, fill=C.WHITE)
        s.text(7.35, 1.92, 5.1, 0.45, ['חדשנות תהליכית וארגונית'], size=20, bold=True, color=C.PETROL)
        s.text(7.35, 2.38, 5.1, 0.6, ['התאמות בסביבת העבודה ובתהליכי שירות כפלטפורמה לקידום חדשנות בארגון'], size=12.5, color=C.MUTED, lnspc=105)
        cx, cy = 9.9, 4.45
        iso_slab(s, cx, cy, 3.6, 0.16, dict(grad=[(0, 'EAF6F3'), (100, 'D3ECE6')], ang=45), 'B9D9D2', 'A3CCC4', 'platform')
        # nodes on platform (people / workflow)
        pts = [iso_pt(cx, cy, 3.6, u, v) for u, v in [(-0.55, -0.55), (0.55, -0.45), (-0.45, 0.5), (0.5, 0.55), (0, 0)]]
        for (a, b) in [(0, 4), (1, 4), (2, 4), (3, 4), (0, 1), (2, 3)]:
            s.line(*pts[a], *pts[b], c=C.TEAL, w=1.25, a=0.55)
        for k, (px, py) in enumerate(pts):
            big = k == 4
            s.oval(px, py - 0.12, 0.5 if big else 0.4, C.GREEN if big else C.TEAL, dict(c=C.WHITE, w=1.5), shadow='sm')
            s.icon('workflow' if big else ['users', 'building-2', 'user-round-cog', 'heart-handshake'][k], px, py - 0.12, 0.24 if big else 0.2, C.WHITE, 2)
    tags_r = [('מבנה ארגוני גמיש', 11.55, 3.15), ('סביבות עבודה משותפות', 8.05, 3.15), ('מודלי טיפול מותאמים אישית', 11.6, 5.55), ('חיזוק צוותי מנהל', 8.15, 5.55)]
    trs = []
    for t, x, y in tags_r:
        trs.append(s.chip(x - 0.9, y, 1.95, 0.32, t, C.WHITE, C.PETROL, size=10.5, line=dict(c=C.LINE, w=0.75)))
    # ---- technological engine (left)
    L = s.group('engine tech')
    with L:
        card(s, 0.6, 1.75, 5.68, 4.3, fill=C.WHITE)
        s.text(0.9, 1.92, 5.1, 0.45, ['חדשנות טכנולוגית'], size=20, bold=True, color=C.PETROL)
        s.text(0.9, 2.38, 5.1, 0.6, ['כלי בינה מלאכותית, אוטומציות ודאטה מתקדמים לייעול העבודה, הנגשת מידע ותמיכה בקבלת החלטות לקלינאים ומעטפת שירותי רפואה מתקדמים בכל זמן ובכל מקום'],
               size=12.5, color=C.MUTED, lnspc=105)
        cx, cy = 3.4, 4.95
        for k, (col, top) in enumerate([(C.PETROL, '0B5C69'), (C.TEAL, '15909A'), (C.TURQ, '3CC3CF')]):
            iso_slab(s, cx, cy - k*0.42, 2.7 - k*0.55, 0.2, top, col, C.PETROL_D, f'layer {k}')
        s.oval(cx, cy - 1.02, 0.62, C.LIME, dict(c=C.WHITE, w=1.5), shadow='sm', glow=(C.LIME, 8, 0.35))
        s.icon('cpu', cx, cy - 1.02, 0.34, C.PETROL, 2)
    tags_l = [('AI & Automation', 1.78, 3.35), ('Advanced Data Analytics', 4.95, 3.3), ('Machine Learning', 1.78, 4.25), ('Smart Support Tools', 5.05, 4.3),
              ('תמיכה בצוות רפואי', 1.78, 5.55), ('שיפור חווית מטופל', 5.0, 5.55)]
    tls = []
    for t, x, y in tags_l:
        heb = is_heb(t)
        tls.append(s.chip(x - 0.88, y, 1.8, 0.32, t, C.WHITE, C.PETROL, size=10.5, line=dict(c=C.LINE, w=0.75), rtl=heb))
    # ---- connection hub
    c1 = s.path(bez((3.72, 3.93), (6.12, 3.95), 0.55), line=dict(c=C.TEAL, w=2, a=0.85), name='link tech')
    c2 = s.path(bez((7.22, 3.95), (9.62, 4.33), 0.55), line=dict(c=C.TEAL, w=2, a=0.85), name='link process')
    p1 = dot(s, 3.72, 3.93, 0.11, C.LIME); p2 = dot(s, 9.62, 4.33, 0.11, C.LIME)
    p3 = dot(s, 6.12, 3.95, 0.09, C.AQUA); p4 = dot(s, 7.22, 3.95, 0.09, C.AQUA)
    hub = s.group('hub NEXT')
    with hub:
        s.oval(6.67, 3.95, 1.12, C.WHITE, dict(c=C.LIME, w=2), shadow='md', glow=(C.LIME, 10, 0.3))
        s.pic(os.path.join(CACHE, 'next_logo.png'), 6.67 - 0.4, 3.95 - 0.056, 0.8, name='כללית NEXT')
    stmt = s.text(1.6, 6.27, 10.13, 0.5, [[('הטכנולוגיה ', {'bold': True, 'color': C.LIME}), ('מניעה את התהליך, ', {}), ('והארגון ', {'bold': True, 'color': C.LIME}), ('מאפשר לטכנולוגיה להצליח', {})]],
                  size=17, color=C.WHITE, bold=True, fill=dict(grad=[(0, C.PETROL), (100, C.TEAL)], ang=0), r=0.25, align='ctr', anchor='ctr', name='statement')
    s.anim.click(fade(L.id, 0, 500), *[rise(t, 350 + i*90, 500, 0.02) for i, t in enumerate(tls)])
    s.anim.click(fade(R.id, 0, 500), *[rise(t, 350 + i*90, 500, 0.02) for i, t in enumerate(trs)])
    s.anim.click(zoom(hub.id, 0, 600), wipe(c1, 300, 600, 'right'), wipe(c2, 300, 600, 'left'), pulse(hub.id, 900, 600, 1.06),
                 flow(p1, mpath_curve((3.72, 3.93), [bez((3.72, 3.93), (6.12, 3.95), 0.55)[1]]), 900, 1800),
                 flow(p2, mpath_curve((9.62, 4.33), [bez((9.62, 4.33), (7.22, 3.95), 0.55)[1]]), 1500, 1800),
                 flow(p3, mpath_curve((6.12, 3.95), [bez((6.12, 3.95), (3.72, 3.93), 0.55)[1]]), 2100, 1800),
                 flow(p4, mpath_curve((7.22, 3.95), [bez((7.22, 3.95), (9.62, 4.33), 0.55)[1]]), 2700, 1800))
    s.anim.click(rise(stmt, 0, 600))
    return s

# ---------------------------------------------------------------- 4 BEFORE / AFTER
ROWS4 = [
    ('תפקיד מרכזי', 'target', 'אבחון, טיפול, אשפוז והחלמה לכל רמות החומרה', 'טיפול בעיקר במקרים אקוטיים ומורכבים (Acute & Complex Care)'),
    ('מקום הטיפול', 'map-pin-house', 'פיזי – המטופל מגיע לבית החולים', 'היברידי – אשפוז ביתי לקל/בינוני, בית חולים למורכב'),
    ('קבלת החלטות', 'git-branch', 'מבוסס ניסיון קליני ופרוטוקולים כלליים', 'מבוסס AI, פרדיקציה ומידע גנטי אישי'),
    ('ניהול נתונים', 'database', 'תיקים רפואיים פסיביים', 'מערכות מידע אקטיביות, מחוברות בזמן אמת לחיישנים לבישים'),
    ('זרימת עבודה', 'workflow', 'עומס של משימות משרדיות על הצוות הטיפולי', 'אוטומציה של תיעוד רפואי ורובוטיקה, AI Voice-to-Text'),
]
def s04(d, n=4):
    s = d.new()
    ids = head(s, n, 'המעבר מבית החולים של היום לבית החולים של העתיד')
    intro(s, ids)
    xT, wT = 9.1, 3.63          # today (right)
    xP, wP = 7.0, 1.9           # parameter column
    xF, wF = 0.6, 6.2           # future (left)
    hy = 1.6
    # headers
    hT = s.group('header today')
    with hT:
        s.rect(xT, hy, wT, 0.72, 'DCE3E4', None, r=0.12)
        s.pic('image45.png', xT + wT - 0.86, hy - 0.08, 0.86, 0.86, geom='ellipse', gray=True, name='today hospital')
        s.text(xT + 0.15, hy, wT - 1.1, 0.72, ['בית החולים של היום'], size=16, bold=True, color='5B6E72', anchor='ctr')
    hF = s.group('header future')
    with hF:
        s.rect(xF, hy, wF, 0.72, dict(grad=[(0, C.TEAL), (100, C.PETROL)], ang=0), None, r=0.12, shadow='sm')
        s.pic('image47.png', xF + wF - 0.92, hy - 0.1, 0.92, 0.92, geom='ellipse', name='future hospital')
        s.text(xF + 0.2, hy, wF - 1.25, 0.72, ['בית החולים של העתיד'], size=16, bold=True, color=C.WHITE, anchor='ctr')
    s.anim.auto(fade(hT.id, 300, 500), fade(hF.id, 450, 500))
    y = 2.55; rh = 0.74; step = 0.86
    for i, (lab, ic, today, fut) in enumerate(ROWS4):
        yy = y + i*step
        gT = s.text(xT, yy, wT, rh, [today], size=12.5, color='5B6E72', fill='E7ECEC', r=0.1, anchor='ctr', ins=(0.18, 0.05, 0.18, 0.05), name=f'today {i}')
        gP = s.group(f'param {i}')
        with gP:
            s.oval(xP + wP - 0.3, yy + rh/2, 0.5, C.WHITE, dict(c=C.LINE, w=0.75), shadow='sm')
            s.icon(ic, xP + wP - 0.3, yy + rh/2, 0.26, C.PETROL, 1.9)
            s.text(xP, yy, wP - 0.62, rh, [lab], size=12.5, bold=True, color=C.PETROL, anchor='ctr')
        ar = s.icon('chevrons-left', xF + wF + 0.1, yy + rh/2, 0.26, C.LIME, 2.2)
        if i == 1:
            gF = s.group('future 1')
            with gF:
                s.rect(xF, yy - 0.12, wF, rh + 0.24, dict(grad=[(0, C.WHITE), (100, C.TEAL_T)], ang=180), dict(c=C.TEAL, w=1), r=0.12, shadow='md')
                s.text(xF + 2.55, yy - 0.12, wF - 2.7, rh + 0.24, [fut], size=13, bold=True, color=C.INK, anchor='ctr')
            st = s.group('stat 30')
            with st:
                s.rect(xF + 0.1, yy - 0.04, 2.35, rh + 0.08, C.PETROL, None, r=0.1)
                s.text(xF + 1.32, yy - 0.04, 1.08, rh + 0.08, [[('30%', {'lang': 'en-US'})]], size=30, bold=True, color=C.LIME, align='ctr', anchor='ctr', rtl=False, font=C.FONT_XB)
                s.text(xF + 0.18, yy - 0.04, 1.18, rh + 0.08, ['מימי האשפוז ינדדו מחוץ למוסד', [('(במחלקות נבחרות)', {'size': 9, 'color': 'B9D9D2', 'bold': False})]],
                       size=10, bold=True, color=C.WHITE, anchor='ctr', lnspc=95)
            s.anim.click(fade(gT, 0, 400), fade(gP.id, 0, 400), wipe(ar, 350, 350, 'right'), slide_in(gF.id, 550, 600, 0.25),
                         zoom(st.id, 1100, 600, 0.7), pulse(st.id, 1800, 500, 1.05))
        else:
            gF = s.text(xF, yy, wF, rh, [fut], size=13, bold=True, color=C.INK, fill=dict(grad=[(0, C.WHITE), (100, C.TEAL_T)], ang=180),
                        line=dict(c=C.LINE, w=0.75), r=0.1, anchor='ctr', ins=(0.2, 0.05, 0.2, 0.05), shadow='sm', name=f'future {i}')
            s.anim.click(fade(gT, 0, 400), fade(gP.id, 0, 400), wipe(ar, 350, 350, 'right'), slide_in(gF, 550, 600, 0.25))
    return s

# ---------------------------------------------------------------- 5 MILESTONES ROADMAP
TECH5 = [('AI PRO', 'sparkles', False), ('פלטפורמה מחשובית קלינית אחודה', 'layers', False), ('Ambient Scribing', 'audio-lines', False),
         ('הרחבת ממדי הדאטה', 'database-zap', False), ('Panda', 'message-square-text', False), ('ניתוב דיגיטלי חכם', 'route', True),
         ('סגירת מעגל דיגיטלית אל מול המטופל', 'refresh-ccw-dot', True)]
ORG5 = [('מרותקי בית', 'house-plus', True), ('זמן פרואקטיבי לרופאים', 'calendar-clock', False), ('Longevity', 'heart-pulse', False),
        ('מיונים וירטואליים בקהילה ובבי"ח ואיתור יועצים למקרים דחופים', 'monitor-smartphone', True)]
def s05(d, n=5):
    s = d.new()
    ids = head(s, n, 'אבני דרך מרכזיות ברפואת העתיד')
    intro(s, ids)
    # destination
    dest = s.group('destination')
    with dest:
        s.rect(0.6, 1.75, 1.75, 4.95, dict(grad=[(0, C.PETROL), (100, C.TEAL)], ang=90), None, r=0.25, shadow='md')
        s.oval(1.475, 3.55, 0.95, None, dict(c=C.LIME, w=1, a=0.6))
        s.oval(1.475, 3.55, 0.7, C.LIME, None, glow=(C.LIME, 12, 0.45))
        s.icon('stethoscope', 1.475, 3.55, 0.38, C.PETROL, 2)
        s.text(0.7, 4.25, 1.55, 1.0, ['רפואת', 'העתיד'], size=19, bold=True, color=C.WHITE, align='ctr', lnspc=95)
    lanes = [('חדשנות טכנולוגית', TECH5, 2.55, 'cpu'), ('חדשנות תהליכית וארגונית', ORG5, 5.25, 'network')]
    allsteps = []
    for li, (lname, items, ly, lic) in enumerate(lanes):
        x0, x1 = 10.75, 2.5
        dots = []
        for q in range(3):
            p = dot(s, x0 + 0.3, ly, 0.1, C.LIME)
            dots.append(flow(p, mpath(x0 + 0.3, ly, x1, ly), 600 + q*1500, 4500))
        lab = s.group(f'lane label {li}')
        with lab:
            s.rect(10.95, ly - 0.55, 1.78, 1.1, C.WHITE, dict(c=C.LINE, w=0.75), r=0.16, shadow='sm')
            s.icon(lic, 12.45, ly - 0.22, 0.32, C.TEAL, 1.9)
            s.text(11.05, ly - 0.05, 1.58, 0.55, [lname], size=12.5, bold=True, color=C.PETROL, align='r', lnspc=92)
        x0, x1 = 10.75, 2.5
        track = s.path([(x0, ly), ((x0 - 2, ly), (x1 + 2, ly), (x1, ly))], curve=True, line=dict(c=dict(grad=[(0, C.LINE), (100, C.TEAL)], ang=180), w=3), name=f'track {li}')
        arrow = s.shape(x1 - 0.12, ly - 0.14, 0.22, 0.28, 'triangle', C.TEAL, None, rot=-90, name='track head')
        nodes = []
        k = len(items)
        sp = (x0 - 0.55 - (x1 + 1.0)) / (k - 1)
        for j, (t, ic, nxt) in enumerate(items):
            cx = x0 - 0.55 - j*sp
            g = s.group(f'milestone {t}')
            with g:
                s.oval(cx, ly, 0.62, C.WHITE, dict(c=C.TEAL, w=1.5), shadow='sm')
                s.icon(ic, cx, ly, 0.32, C.PETROL, 1.9)
                tw = min(sp - 0.08, 1.9)
                heb = is_heb(t)
                s.text(cx - tw/2, ly + 0.42, tw, 0.9, [t], size=11.5, bold=True, color=C.INK, align='ctr', lnspc=92, rtl=True)
                if nxt:
                    s.rect(cx - 0.45, ly - 0.74, 0.9, 0.28, C.WHITE, dict(c=C.LINE, w=0.5), r=0.14, shadow='sm')
                    s.pic(os.path.join(CACHE, 'next_logo.png'), cx - 0.33, ly - 0.6 - 0.0465, 0.66, name='כללית NEXT')
            nodes.append(g.id)
        allsteps.append([fade(lab.id, 0, 400), wipe(track, 100, 900, 'left'), fade(arrow, 900, 300)] +
                        [zoom(nd, 300 + j*140, 450, 0.6) for j, nd in enumerate(nodes)] + dots)
    s.anim.click(*allsteps[0])
    s.anim.click(*allsteps[1])
    s.anim.click(fade(dest.id, 0, 600), pulse(dest.id, 600, 600, 1.04))
    return s

# ---------------------------------------------------------------- 6 AI ENGINE TRIANGLE
def s06(d, n=6):
    s = d.new(dark=True)
    ids = head(s, n, [[('תפיסה ארגונית – ', {}), ('AI', {'color': C.LIME, 'lang': 'en-US'}), (' כמפתח לקידום היעדים האסטרטגיים', {})]])
    intro(s, ids)
    cx = SW/2; top = 1.5; base = 5.85
    side = (base - top) / 0.8660
    A = (cx, top); B = (cx - side/2, base); Cc = (cx + side/2, base)
    G = (cx, top + (base - top) * 2/3)
    mid = lambda p, q: ((p[0]+q[0])/2, (p[1]+q[1])/2)
    mAB, mAC, mBC = mid(A, B), mid(A, Cc), mid(B, Cc)
    def shrink(poly, k=0.075):
        gx = sum(p[0] for p in poly)/len(poly); gy = sum(p[1] for p in poly)/len(poly)
        return [(p[0] + (gx - p[0])*k, p[1] + (gy - p[1])*k) for p in poly]
    segs = {
        'clin': (shrink([A, mAC, G, mAB]), dict(grad=[(0, 'B6E63B'), (100, '7DB800')], ang=90), 'קליני', C.NIGHT),
        'oper': (shrink([B, mAB, G, mBC]), dict(grad=[(0, '1AA3AE'), (100, C.TEAL)], ang=90), 'תפעולי', C.WHITE),
        'serv': (shrink([Cc, mBC, G, mAC]), dict(grad=[(0, '4FD3DD'), (100, '1FB2BE')], ang=90), 'שירותי', C.NIGHT),
    }
    seg_ids = {}
    for k, (poly, f, lab, tc) in segs.items():
        g = s.group(f'segment {lab}')
        with g:
            s.path(poly, fill=f, closed=True, glow=(f['grad'][0][1], 8, 0.25))
            px = sum(p[0] for p in poly)/4; py = sum(p[1] for p in poly)/4
            if k == 'clin': py -= 0.25
            if k == 'oper': px -= 0.2; py += 0.25
            if k == 'serv': px += 0.2; py += 0.25
            s.text(px - 0.9, py - 0.25, 1.8, 0.5, [lab], size=20, bold=True, color=tc, align='ctr', anchor='ctr')
        seg_ids[k] = g.id
    core = s.group('AI core')
    with core:
        s.oval(G[0], G[1], 1.45, C.NIGHT, dict(c=C.AQUA, w=1.5), glow=(C.AQUA, 14, 0.45))
        s.text(G[0] - 0.6, G[1] - 0.32, 1.2, 0.64, [[('AI', {'lang': 'en-US'})]], size=32, bold=True, color=C.WHITE, align='ctr', anchor='ctr', rtl=False)
    ring = s.oval(G[0], G[1], 1.75, None, dict(c=C.LIME, w=1.25, dash='dash', a=0.8), name='core ring')
    # benefit pills
    def pills(items, xr, y0, w, color, align_right):
        out = []
        for i, t in enumerate(items):
            yy = y0 + i*0.62
            out.append(s.text(xr, yy, w, 0.5, [t], size=12.5, bold=True, color=C.WHITE, fill=(color, 0.14), line=dict(c=color, w=1, a=0.7),
                              r=0.25, anchor='ctr', align='ctr', ins=(0.15, 0.02, 0.15, 0.02), name='benefit'))
        return out
    clinR = pills(['קפיצת מדרגה באיכות הטיפול', 'ירידה ברמת העומס על המטפל ובשחיקה'], 8.85, 2.0, 3.9, C.LIME, True)
    clinL = pills(['שינוי מודל הטיפול – רפואה יוזמת, מונעת ומותאמת אישית', 'צמצום פערים בטיפול (לכל אחד, בכל מקום, בכל זמן)'], 0.6, 2.0, 3.95, C.LIME, False)
    oper = pills(['קפיצת מדרגה בפרודוקטיביות', 'אוטומציה וצמצום עבודה ידנית', 'אופטימיזציה של תכנון, חיזוי, קבלת החלטות ומשאבים'], 0.6, 3.85, 3.95, C.AQUA, False)
    serv = pills(['שירות אישי, יוזם ורציף', 'קפיצת מדרגה בזמינות', [('חוויית מטופל מעולה ומסע מטופל ', {}), ('seamless', {'lang': 'en-US'})]], 8.8, 3.85, 3.95, C.AQUA, True)
    # connectors from segments to pill groups
    lc1 = s.line(8.8, 2.88, 7.55, 2.88, C.LIME, 1, dash='sysDot', a=0.8)
    lc2 = s.line(4.55, 2.88, 5.8, 2.88, C.LIME, 1, dash='sysDot', a=0.8)
    lo = s.line(4.55, 4.47, 5.2, 4.47, C.AQUA, 1, dash='sysDot', a=0.8)
    lsv = s.line(8.75, 4.47, 8.1, 4.47, C.AQUA, 1, dash='sysDot', a=0.8)
    ban = s.text(0.6, 6.15, SW - 1.2, 0.62, [[('מהפכת ה-', {}), ('AI', {'lang': 'en-US'}), (' מהווה ', {}), ('נקודת אי-רציפות', {'color': C.LIME}),
                                              (' – פוטנציאל לקפיצת מדרגה חסרת תקדים בכלל היבטי הפעילות', {})]],
                 size=18, bold=True, color=C.WHITE, fill=dict(grad=[(0, '0B5C69'), (100, C.PETROL)], ang=0), line=dict(c=C.AQUA, w=0.75, a=0.5), r=0.31, align='ctr', anchor='ctr', name='banner')
    s.anim.click(zoom(core.id, 0, 700, 0.6), fade(ring, 300, 600), spin(ring, 300, 24000), pulse(core.id, 900, 1200, 1.05, repeat='indefinite'))
    s.anim.click(fade(seg_ids['clin'], 0, 600), wipe(lc1, 400, 400, 'right'), wipe(lc2, 400, 400, 'left'), *[rise(p, 600 + i*120, 500, 0.02) for i, p in enumerate(clinR + clinL)])
    s.anim.click(fade(seg_ids['oper'], 0, 600), wipe(lo, 400, 400, 'left'), *[rise(p, 600 + i*120, 500, 0.02) for i, p in enumerate(oper)])
    s.anim.click(fade(seg_ids['serv'], 0, 600), wipe(lsv, 400, 400, 'right'), *[rise(p, 600 + i*120, 500, 0.02) for i, p in enumerate(serv)])
    s.anim.click(rise(ban, 0, 600))
    return s

# ---------------------------------------------------------------- 7 CLALIT NEXT continuum
def s07(d, n=7):
    s = d.new()
    s.logo(); s.num(n)
    ey = s.eyebrow(section(n))
    lg = s.pic('image49.png', SW/2 - 1.3, 0.5, 2.6, name='כללית NEXT – רפואה מתקדמת, מהבית ומכל מקום')
    cx, cy, R = SW/2, 3.8, 1.55
    # two spaces
    spR = s.group('space hospitals')
    with spR:
        s.rect(8.55, 1.95, 4.18, 3.6, dict(grad=[(0, C.WHITE, 0), (100, C.TEAL_T)], ang=0), None, r=0.3)
        s.oval(12.0, 3.75, 0.7, C.PETROL, None, shadow='sm'); s.icon('hospital', 12.0, 3.75, 0.36, C.WHITE, 1.8)
        s.text(9.95, 3.5, 1.5, 0.5, ['בתי חולים'], size=17, bold=True, color=C.PETROL, anchor='ctr')
    spL = s.group('space community')
    with spL:
        s.rect(0.6, 1.95, 4.18, 3.6, dict(grad=[(0, C.LIME_T), (100, C.WHITE, 0)], ang=0), None, r=0.3)
        s.oval(1.33, 3.75, 0.7, C.GREEN, None, shadow='sm'); s.icon('building-2', 1.33, 3.75, 0.36, C.WHITE, 1.8)
        s.text(1.8, 3.5, 1.3, 0.5, ['קהילה'], size=17, bold=True, color=C.GREEN, anchor='ctr', align='l')
    lR = s.line(9.8, 3.75, cx + R + 0.55, 3.75, C.TEAL, 1.5, dash='dash', tail='triangle')
    lL = s.line(2.85, 3.75, cx - R - 0.55, 3.75, C.GREEN, 1.5, dash='dash', tail='triangle')
    ring = s.oval(cx, cy, 2*R, None, dict(c=C.LINE, w=2.5), name='care ring')
    st = [('מניעה וקידום בריאות', 'shield-check', C.PETROL), ('אבחון', 'search-check', C.TEAL), ('ייעוץ', 'message-circle-heart', '0B6F78'),
          ('טיפול', 'pill', C.TURQ), ('ניטור וניהול מחלה', 'activity', C.LIME)]
    nodes = []; arcs = []
    p0, segsC = circle_pts(cx, cy, R)
    trav = dot(s, cx, cy - R, 0.16, C.LIME)
    for i, (t, ic, col) in enumerate(st):
        ang = -90 + i*72
        a1 = (ang + 14) % 360; a2 = (ang + 72 - 14) % 360
        arcs.append(s.arc(cx, cy, 2*R + 0.06, a1, a2, 0.09, dict(grad=[(0, col), (100, st[(i+1) % 5][2])], ang=ang + 126), name=f'arc {i}'))
        px = cx + R*math.cos(math.radians(ang)); py = cy + R*math.sin(math.radians(ang))
        g = s.group(f'station {t}')
        with g:
            s.oval(px, py, 0.8, col, dict(c=C.WHITE, w=2.5), shadow='md')
            s.icon(ic, px, py, 0.36, C.PETROL if col == C.LIME else C.WHITE, 2)
            ca = math.cos(math.radians(ang)); sa = math.sin(math.radians(ang))
            lx = px + ca*0.95; ly = py + sa*0.72
            al = 'ctr' if abs(ca) < 0.3 else ('l' if ca > 0 else 'r')
            bx = lx - 0.8 if al == 'ctr' else (lx - 0.15 if al == 'l' else lx - 1.45)
            if i == 0: ly = py - 0.62
            s.text(bx, ly - 0.2, 1.6, 0.4, [t], size=13, bold=True, color=C.PETROL, align=al, anchor='ctr', lnspc=90)
        nodes.append(g.id)
    heart = s.group('patient heart')
    with heart:
        s.oval(cx, cy, 1.25, C.WHITE, dict(c=C.LINE, w=1), shadow='lg')
        s.icon('heart-pulse', cx, cy, 0.62, C.PETROL, 1.8)
    stmt = s.text(0.9, 5.95, SW - 1.8, 0.82, ['פיתוח והטמעה של מודלים ופתרונות חדשניים למטופלים המשפרים תוצאות בריאות, מעצימים מטופלים ומרחיבים את יכולות המניעה, האבחון, הטיפול והמעקב מעבר לגבולות המפגש הרפואי המסורתי'],
                  size=14.5, color=C.WHITE, fill=dict(grad=[(0, C.PETROL), (100, '0B5C69')], ang=0), r=0.2, align='ctr', anchor='ctr', ins=(0.4, 0.05, 0.4, 0.05), name='statement', lnspc=105)
    s.anim.auto(fade(ey, 0, 400), zoom(lg, 0, 700, 0.9), fade(ring, 300, 600), zoom(heart.id, 400, 700, 0.6))
    s.anim.click(*[x for i in range(5) for x in (zoom(nodes[i], i*380, 450, 0.6), fade(arcs[i], i*380 + 220, 400))],
                 fade(trav, 1900, 300), flow(trav, mpath_curve(p0, segsC), 2000, 6000, fade=False))
    s.anim.click(fade(spR.id, 0, 500), fade(spL.id, 0, 500), wipe(lR, 400, 500, 'left'), wipe(lL, 400, 500, 'right'))
    s.anim.click(rise(stmt, 0, 600))
    return s
