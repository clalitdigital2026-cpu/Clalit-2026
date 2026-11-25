# -*- coding: utf-8 -*-
"""Second-round redesigns: slides 16, 27, 29, 37."""
from kit import *
from slides_b import countup
import random

NL = os.path.join(CACHE, 'next_logo.png')

# ---------------------------------------------------------------- 16 BREAST-CANCER RISK OUTREACH (white, human, proactive)
def s16(d, n=16):
    s = d.new()
    ids = head(s, n, 'הזמנה פרואקטיבית לשאלון הערכת סיכון לסרטן השד')
    intro(s, ids)
    # soft backdrop circles behind the phone
    b1 = s.oval(3.55, 4.5, 4.6, dict(radial=[(0, C.TEAL_T), (100, C.BG, 0)], c=(50, 50)), None, name='backdrop')
    b2 = s.oval(3.55, 4.5, 3.6, None, dict(c=C.LINE, w=1, dash='sysDash'), name='orbit')
    # Clalit source node + broadcast waves
    sx, sy = 0.98, 2.55
    waves = [s.oval(sx, sy, 0.95, None, dict(c=C.TEAL, w=1.5), name=f'wave {k}') for k in range(3)]
    src = s.group('clalit source')
    with src:
        s.oval(sx, sy, 0.95, C.WHITE, dict(c=C.TEAL, w=1.5), shadow='md')
        s.pic('image139.png', sx - 0.36, sy - 0.073, 0.72, name='כללית')
    srcl = s.text(sx - 0.8, sy + 0.55, 1.6, 0.3, ['פנייה יזומה'], size=12, color=C.TEAL, align='ctr', name='outreach label')
    # phone (real chat screenshot, which already contains its device frame)
    phone = s.pic('image80.png', 2.15, 2.0, h=5.0, crop=(0.155, 0.0, 0.13, 0.0), name='patient chat', r=0.42, shadow='lg')
    # message travelling from Clalit to the phone
    pth = [(sx + 0.5, sy), ((sx + 0.9, sy - 0.6), (1.8, 1.72), (2.4, 1.72))]
    arc = s.path(pth, line=dict(c=C.TEAL, w=1.5, dash='sysDot'), name='outreach path')
    env = s.group('message')
    with env:
        s.oval(sx + 0.5, sy, 0.44, C.LIME, dict(c=C.WHITE, w=1.5), shadow='sm')
        s.icon('message-circle-heart', sx + 0.5, sy, 0.24, C.PETROL, 2)
    note = s.group('notification')
    with note:
        s.rect(2.45, 1.42, 2.75, 0.6, C.WHITE, dict(c=C.LINE, w=0.75), r=0.16, shadow='lg')
        s.oval(4.88, 1.72, 0.42, C.PETROL, None); s.icon('heart-handshake', 4.88, 1.72, 0.22, C.WHITE, 2)
        s.text(2.6, 1.44, 1.95, 0.3, [[('כללית AI Pro', {'lang': 'he-IL'})]], size=10.5, bold=True, strong=True, color=C.INK, anchor='ctr')
        s.text(2.6, 1.72, 1.95, 0.28, ['רפואה יוזמת'], size=9.5, color=C.MUTED, anchor='ctr')
    # hero number
    hero_bg = s.oval(10.0, 3.0, 2.9, dict(radial=[(0, C.LIME_T), (100, C.BG, 0)], c=(50, 50)), None, name='number glow')
    fin, fx = countup(s, 6.6, 1.55, 6.13, 1.75, ['0.1M', '0.3M', '0.5M', '0.7M', '0.9M', '1.0M', '1.1M'], [('1.2M', {'lang': 'en-US'})], 108, C.PETROL, C.BG, align='r', start=100, step=70, name='1.2M')
    cap = s.text(6.6, 3.3, 6.13, 0.85, [[('מבוטחות בגילאים הרלוונטיים', {})], [('מקבלות את השאלון ', {}), ('באופן פרואקטיבי', {'bold': True, 'color': C.GREEN})]],
                 size=18, color=C.INK, align='r', lnspc=110, name='caption')
    # population: rows of women icons lighting up
    people = []
    for r_ in range(2):
        for c_ in range(14):
            x = 12.55 - c_*0.42; y = 4.45 + r_*0.46
            people.append(s.icon('user-round', x, y, 0.32, C.TEAL if (r_*14 + c_) % 3 else C.GREEN, 2, nm='woman icon'))
    # campaign card
    camp = s.group('campaign')
    with camp:
        s.rect(6.6, 5.5, 6.13, 1.42, C.WHITE, dict(c=C.LINE, w=0.75), r=0.18, shadow='md')
        s.pic('image79.png', 6.72, 5.6, h=1.22, r=0.08, name='campaign banner')
        s.chip(11.33, 5.68, 1.25, 0.28, 'חומר קמפייני', C.TEAL_T, C.PETROL, size=10)
        s.text(8.75, 5.98, 3.83, 0.8, ['חודש המודעות הבינלאומי לסרטן השד'], size=13, bold=True, strong=True, color=C.PETROL, align='r', anchor='ctr', lnspc=100)
    s.anim.auto(fade(b1, 0, 800), fade(b2, 200, 800), spin(b2, 200, 60000), zoom(src.id, 200, 500, 0.5), fade(srcl, 500, 400),
                rise(phone, 300, 800, 0.04))
    s.anim.after(*[x for k, w in enumerate(waves) for x in (fade(w, k*350, 100), grow(w, k*350, 1600, 2.2), fadeout(w, k*350 + 900, 700))],
                 wipe(arc, 300, 600, 'right'), fade(env.id, 300, 200), move(env.id, mpath_curve(pth[0], [pth[1]]), 400, 1000), fadeout(env.id, 1350, 250),
                 slide_in(note.id, 1400, 600, 0.0, 0.15), pulse(note.id, 2100, 400, 1.04))
    s.anim.after(fade(hero_bg, 0, 600), *fx, fade(cap, 700, 600))
    s.anim.after(*[zoom(p, (i % 14)*55 + (i // 14)*120, 300, 0.3) for i, p in enumerate(people)])
    s.anim.after(rise(camp.id, 0, 600, 0.03))
    s.anim.after(*[pulse(w, 0, 1800, 1.0) for w in []], pulse(note.id, 0, 900, 1.03, repeat='indefinite'))
    return s

# ---------------------------------------------------------------- 27 PANDA (white, product showcase)
def s27(d, n=27):
    s = d.new()
    ids = head(s, n, 'פלטפורמת פנדה – איתור מידע אמין ומהיר להקלה על הצוותים')
    intro(s, ids)
    back = s.oval(3.9, 3.9, 5.4, dict(radial=[(0, C.TEAL_T), (100, C.BG, 0)], c=(50, 50)), None, name='backdrop')
    lap, (lsx, lsy, lsw, lsh) = s.laptop(1.0, 1.95, 5.9, 'image124.png')
    ph, (px, py, pw, ph_) = s.phone(0.55, 3.15, 1.82, None, name='!!phone')
    chat = s.group('chat header')
    with chat:
        s.rect(px, py, pw, 0.6, dict(grad=[(0, C.PETROL), (100, C.TEAL)], ang=0), None, r=0.22); s.rect(px, py + 0.3, pw, 0.3, C.TEAL, None)
        s.pic('image126.png', px + pw - 0.52, py + 0.14, 0.4, 0.4, geom='ellipse', name='Panda avatar', line=dict(c=C.WHITE, w=1))
        s.text(px + 0.1, py + 0.22, pw - 0.66, 0.32, ['פנדה'], size=11, bold=True, strong=True, color=C.WHITE, anchor='ctr')
    q = s.text(px + 0.4, py + 0.8, pw - 0.5, 0.78, ['שאלה בשפה חופשית על פרוטוקול קליני'], size=10, color=C.WHITE, fill=C.TEAL, r=0.14, anchor='ctr', ins=(0.1, 0.04, 0.1, 0.04), name='question bubble')
    typing = s.group('typing')
    with typing:
        s.rect(px + 0.1, py + 1.72, 0.66, 0.32, C.MIST, None, r=0.16)
        dots_ = [s.oval(px + 0.26 + k*0.17, py + 1.88, 0.08, C.SOFT, None) for k in range(3)]
    a = s.text(px + 0.1, py + 1.72, pw - 0.45, 1.15, ['תשובה המבוססת על מידע מקצועי ופרוטוקולים מאושרים'], size=10, color=C.INK, fill=C.MIST, r=0.14, anchor='ctr', ins=(0.1, 0.04, 0.1, 0.04), name='answer bubble')
    srcs = s.chip(px + 0.1, py + 2.98, 1.0, 0.26, 'מקורות', C.WHITE, C.TEAL, size=9, line=dict(c=C.TEAL, w=0.75))
    tag = s.chip(px + pw/2 - 0.45, 2.83, 0.9, 0.26, 'המחשה', C.AMBER_T, '8A5A00', size=9, line=dict(c=C.AMBER, w=0.75))
    # features (instead of bullets)
    feats = [('בוט למענה בשפה חופשית על שאלות', 'לייעול העבודה ולהקלת העומס', 'message-square-text'),
             ('תשאול פרוטוקולים קליניים', 'לרבות על ידי מתמחים', 'book-open-check'),
             ('גישה מהמובייל', 'לצוותים הרפואיים', 'smartphone')]
    fids = []
    for i, (t, sub, ic) in enumerate(feats):
        y = 1.75 + i*0.66
        g = s.group(f'feature {i}')
        with g:
            s.oval(12.4, y + 0.33, 0.6, dict(grad=[(0, C.TEAL), (100, C.PETROL)], ang=45), None, shadow='sm')
            s.icon(ic, 12.4, y + 0.33, 0.3, C.WHITE, 1.9)
            s.text(7.6, y + 0.02, 4.4, 0.36, [t], size=15, bold=True, color=C.PETROL, anchor='ctr')
            s.text(7.6, y + 0.36, 4.4, 0.3, [sub], size=12, color=C.MUTED, anchor='ctr')
        fids.append(g.id)
    # audiences
    aud = []
    for i, (t, ic) in enumerate([('צוותי שניידר', 'hospital'), ('צוותי הקהילה', 'building-2')]):
        x = 10.25 - i*2.65; y = 4.2
        g = s.group(f'audience {t}')
        with g:
            s.rect(x, y, 2.48, 1.12, C.WHITE, dict(c=C.LINE, w=0.75), r=0.18, shadow='md')
            s.pic('image126.png', x + 2.48 - 0.86, y + 0.16, 0.7, 0.7, geom='ellipse', name='Panda', line=dict(c=C.TEAL_T, w=2))
            s.text(x + 0.12, y + 0.16, 1.45, 0.32, ['פנדה ל'], size=11, color=C.MUTED, anchor='ctr', align='r')
            s.text(x + 0.12, y + 0.46, 1.45, 0.42, [t], size=14, bold=True, color=C.PETROL, anchor='ctr', align='r')
        aud.append(g.id)
    for_t = s.text(7.6, 3.85, 5.13, 0.28, ['שני קהלי יעד'], size=12, color=C.TEAL, align='r', name='audience label')
    media = s.group('media mention')
    with media:
        s.rect(7.6, 5.6, 5.13, 1.2, C.WHITE, dict(c=C.LINE, w=0.75), r=0.16)
        s.pic('image125.png', 7.7, 5.7, h=1.0, r=0.06, name='ynet article', line=dict(c=C.LINE, w=0.5))
        s.chip(11.42, 5.72, 1.18, 0.26, 'אזכור תקשורתי', C.TEAL_T, C.PETROL, size=9.5)
        s.text(9.5, 6.02, 3.1, 0.7, [[('"להיות צודק ב-95% לא מספיק": הבינה המלאכותית שלא נותנת לרופאים לטעות', {})]], size=10.5, color=C.INK, lnspc=100, align='r', anchor='ctr')
    s.anim.auto(fade(back, 0, 700), fade(lap, 100, 700), rise(ph, 400, 700, 0.04), fade(chat.id, 600, 400), fade(tag, 700, 400),
                *[rise(f, 300 + i*180, 500, 0.02) for i, f in enumerate(fids)])
    s.anim.after(slide_in(q, 0, 450, 0.0, 0.05), fade(typing.id, 500, 200), *[pulse(dt, 600 + k*120, 250, 1.5, repeat=2) for k, dt in enumerate(dots_)],
                 fadeout(typing.id, 1700, 200), rise(a, 1800, 450, 0.03), zoom(srcs, 2200, 300, 0.6))
    s.anim.after(fade(for_t, 0, 300), *[rise(g, 100 + i*200, 500, 0.03) for i, g in enumerate(aud)])
    s.anim.after(rise(media.id, 0, 500, 0.02))
    return s

# ---------------------------------------------------------------- 29 LONGEVITY (human + digital)
def s29(d, n=29):
    s = d.new()
    ids = head(s, n, [[('Longevity score', {'lang': 'en-US'})]], sub='הארכת שנות החיים הבריאות כתחום שירות מוגדר – עם קהלי יעד, מומחים ומסלולים משלו')
    intro(s, ids)
    nx = s.pic(NL, MX, 0.55, w=1.2, name='כללית NEXT')
    # human hero card
    photo = s.pic('image181.png', 0.6, 2.0, 3.2, 2.75, crop=(0.0, 0.08, 0.0, 0.22), fit='cover', r=0.22, name='person', shadow='md')
    # longevity score widget overlapping the photo
    wx, wy = 3.55, 4.25
    wbg = s.oval(wx, wy, 1.6, C.WHITE, dict(c=C.LINE, w=0.75), shadow='lg', name='score widget')
    cols = [C.LIME, C.TURQ, C.TEAL, C.GREEN, C.AQUA, '7DB800']
    segs = [s.arc(wx, wy, 1.36, (-90 + k*60 + 5) % 360, (-90 + k*60 + 55) % 360, 0.13, cols[k], name=f'score segment {k}') for k in range(6)]
    hb = s.icon('heart-pulse', wx, wy - 0.16, 0.36, C.PETROL, 2, nm='heart')
    sl = s.text(wx - 0.55, wy + 0.06, 1.1, 0.36, [[('Longevity', {'lang': 'en-US'})], [('Score', {'lang': 'en-US'})]], size=9, bold=True, strong=True, color=C.PETROL, align='ctr', rtl=False, lnspc=85)
    # app on a monitor
    mon, scr = s.monitor(4.6, 1.95, 3.85, 'image127.png')
    appl = s.chip(5.75, 1.62, 1.55, 0.28, 'אפליקציית Longevity', C.TEAL_T, C.PETROL, size=9.5)
    # solution list
    sol_t = s.text(8.85, 1.9, 3.88, 0.32, ['הפתרון'], size=14, bold=True, color=C.TEAL)
    sols = [('כלים דיגיטליים למטופל לאיסוף וניתוח מידע, להפקת תובנות ומתן המלצות ולהנעת המטופל לטיפול', 'smartphone'),
            ([('פיתוח ממשקי מידע ואפליקציית ', {}), ('Longevity', {'lang': 'en-US'}), (' בקהילה', {})], 'app-window'),
            ([('המלצות מותאמות ', {}), ('Longevity', {'lang': 'en-US'}), (' ב-', {}), ('C-Pi', {'lang': 'en-US'})], 'sparkles'),
            ([('הכשרה ייעודית ומיתוג מחדש של כוח אדם כמומחי ', {}), ('Longevity', {'lang': 'en-US'})], 'graduation-cap')]
    sl_ids = []
    for i, (t, ic) in enumerate(sols):
        y = 2.3 + i*0.62
        g = s.group(f'solution {i}')
        with g:
            s.oval(12.47, y + 0.27, 0.44, C.TEAL_T, None); s.icon(ic, 12.47, y + 0.27, 0.23, C.PETROL, 2)
            s.text(8.85, y, 3.35, 0.56, [t], size=11.5, color=C.INK, anchor='ctr', lnspc=98)
        sl_ids.append(g.id)
    # timeline 2027 -> 2028
    tl = s.line(SW - MX, 5.25, MX, 5.25, C.LINE, 2.5, name='timeline')
    tlp = s.line(SW - MX, 5.25, MX, 5.25, C.TEAL, 2.5, tail='triangle', name='timeline progress')
    years = [('2027', [([('פיתוח אפליקציית ', {}), ('Longevity', {'lang': 'en-US'})], 'smartphone'), ('הפעלת מנגנון ניהול, מעקב ובקרה מרחוק', 'monitor-check')]),
             ('2028', [([('שירות ', {}), ('Longevity', {'lang': 'en-US'}), (' פעיל לכלל מטופלי הכללית', {})], 'users'), ('ניתוח דו"חות ומעקב אחר אחוזי שיפור במדדי מטופלים', 'chart-line')])]
    yg = []
    for j, (yr, its) in enumerate(years):
        x0 = 12.73 - j*6.1
        g = s.group(f'year {yr}')
        with g:
            s.oval(x0 - 0.35, 5.25, 0.5, C.PETROL if j == 0 else C.LIME, dict(c=C.WHITE, w=2), shadow='sm')
            s.text(x0 - 1.55, 5.05, 1.0, 0.4, [[(yr, {'lang': 'en-US'})]], size=20, bold=True, color=C.PETROL, align='ctr', rtl=False, fill=C.BG, anchor='ctr', font=C.FONT_XB)
            for k, (t, ic) in enumerate(its):
                xx = x0 - 0.15 - (k + 1)*2.9 + 0.1
                s.rect(xx, 5.65, 2.8, 1.12, C.WHITE, dict(c=C.LINE, w=0.75), r=0.16, shadow='sm')
                s.oval(xx + 2.43, 6.0, 0.44, C.TEAL_T if j == 0 else C.LIME_T, None); s.icon(ic, xx + 2.43, 6.0, 0.24, C.PETROL, 2)
                s.text(xx + 0.12, 5.67, 2.05, 1.08, [t], size=11.5, color=C.INK, anchor='ctr', lnspc=100)
        yg.append(g.id)
    trav = dot(s, SW - MX - 0.35, 5.25, 0.16, C.LIME)
    s.anim.auto(fade(nx, 0, 400), rise(photo, 100, 700, 0.03), zoom(wbg, 500, 500, 0.5), *[wheel(sg, 700 + k*160, 350) for k, sg in enumerate(segs)],
                fade(hb, 700, 300), fade(sl, 900, 300))
    s.anim.after(fade(mon, 0, 600), fade(appl, 300, 300), fade(sol_t, 200, 300), *[rise(g, 300 + i*150, 450, 0.02) for i, g in enumerate(sl_ids)])
    s.anim.after(fade(tl, 0, 300), wipe(tlp, 100, 1800, 'left'), rise(yg[0], 300, 500, 0.03), rise(yg[1], 1300, 500, 0.03),
                 fade(trav, 100, 200), move(trav, mpath(SW - MX - 0.35, 5.25, 12.73 - 6.1 - 0.35, 5.25), 200, 1800))
    # gentle living loop: heartbeat and score segments breathing
    s.anim.after(pulse(hb, 0, 700, 1.15, repeat='indefinite'), *[pulse(sg, k*250, 900, 1.04, repeat='indefinite') for k, sg in enumerate(segs[:1])],
                 pulse(trav, 0, 800, 1.3, repeat='indefinite'))
    return s

# ---------------------------------------------------------------- 37 CLALIT AI FACTORY (clear separation between the three domains)
def s37(d, n=37):
    s = d.new(dark=True)
    ids = head(s, n, [[('התקדמות לפי תכנית – ', {}), ('Clalit ', {'lang': 'en-US'}), ('AI Factory', {'lang': 'en-US', 'color': C.LIME})]])
    intro(s, ids)
    pillars = [('מוכנות', 'ותשתית', 8.85, 12.73, 'layers', '0B6F78'), ('מובילות', 'התנסות ויישום ב-scale', 4.5, 8.5, 'rocket', C.TEAL), ('אחריות', 'ובקרות', 0.6, 4.15, 'shield-check', '1AA3AE')]
    accent = {'מוכנות': C.AQUA, 'מובילות': C.TURQ, 'אחריות': C.LIME}
    groups = []
    for (t, sub, x0, x1, ic, col) in pillars:
        w = x1 - x0
        ac = accent[t]
        panel = s.rect(x0, 1.55, w, 5.35, ('0A3A42', 0.85), dict(c=ac, w=1, a=0.55), r=0.22, name=f'{t} panel')
        g = s.group(f'pillar {t}')
        with g:
            s.rect(x0, 1.55, w, 1.05, dict(grad=[(0, col), (100, C.PETROL)], ang=90), None, r=0.22)
            s.rect(x0, 2.3, w, 0.3, C.PETROL, None)
            iso_slab(s, x0 + w - 0.62, 1.95, 0.82, 0.12, '3CC3CF', C.PETROL_D, '06323A', 'factory block')
            s.icon(ic, x0 + w - 0.62, 1.93, 0.26, C.WHITE, 2)
            s.text(x0 + 0.25, 1.6, w - 1.3, 0.55, [t], size=24, bold=True, color=C.WHITE, anchor='ctr')
            s.text(x0 + 0.25, 2.12, w - 1.3, 0.4, [sub], size=13, color='CDEDEC', anchor='ctr')
        groups.append((panel, g.id, x0, w, ac))
    def box(x, y, w, h, runs, ac, name):
        g = s.group(name)
        with g:
            s.rect(x, y, w, h, (C.WHITE, 0.06), dict(c=ac, w=1, a=0.6), r=0.12)
            s.text(x + 0.08, y, w - 0.16, h, runs, size=12, color=C.WHITE, align='ctr', anchor='ctr', lnspc=102)
        return g.id
    def plus(x, y, ac):
        return s.text(x - 0.2, y - 0.17, 0.4, 0.34, [[('+', {'lang': 'en-US'})]], size=18, bold=True, color=ac, align='ctr', anchor='ctr', rtl=False)
    # readiness: two columns
    _, _, x0, w, ac = groups[0]
    cw2 = (w - 0.45) / 2
    xa, xb = x0 + w - 0.15 - cw2, x0 + 0.15
    R = [box(xa, 2.85, cw2, 1.0, ['תמונת עתיד רצוי'], ac, 'future state'), plus(xa + cw2/2, 4.02, ac),
         box(xa, 4.2, cw2, 1.0, ['מודיעין ושת"פ'], ac, 'intelligence'), plus(xa + cw2/2, 5.37, ac),
         box(xa, 5.55, cw2, 1.15, ['איתור אתגרים וייזום פתרונות'], ac, 'challenges'),
         box(xb, 2.85, cw2, 1.6, [[('תשתית:', {'bold': True})], [('GPU', {'lang': 'en-US'}), (' · ענן · דאטה', {})]], ac, 'infrastructure'), plus(xb + cw2/2, 4.63, ac),
         box(xb, 4.8, cw2, 1.9, [[('Talent:', {'lang': 'en-US', 'bold': True})], ['גיוס, שימור,'], ['הכשרה והדרכה']], ac, 'talent')]
    # leadership: two columns
    _, _, x0, w, ac = groups[1]
    cw2 = (w - 0.45) / 2
    xa, xb = x0 + w - 0.15 - cw2, x0 + 0.15
    L = [box(xa, 2.85, cw2, 1.75, [[('מו"פ מרכזי:', {'bold': True})], ['מחקר בחזית המדע,'], ['פיתוח מוצרים']], ac, 'central R&D'), plus(xa + cw2/2, 4.78, ac),
         box(xa, 4.95, cw2, 1.75, ['התנסות והטמעת', 'מוצרים מן החוץ'], ac, 'external products'),
         box(xb, 2.85, cw2, 3.85, [[('"מסלולי נחיתה"', {'bold': True})], [('להטמעה ב-scale:', {'bold': True})], [' '],
                                   [('C-Pi', {'lang': 'en-US', 'color': C.LIME, 'bold': True}), (' (לקהילה)', {})], [('AIDOC', {'lang': 'en-US', 'color': C.LIME, 'bold': True}), (' (לרדיולוג)', {})],
                                   [('לגו', {'color': C.LIME, 'bold': True}), (' (לבתי"ח)', {})], ['...']], ac, 'landing tracks')]
    # responsibility
    _, _, x0, w, ac = groups[2]
    g = s.group('pre-deployment control')
    with g:
        s.rect(x0 + 0.15, 2.85, w - 0.3, 1.6, (C.WHITE, 0.06), dict(c=ac, w=1, a=0.7), r=0.12)
        s.icon('clipboard-check', x0 + w - 0.5, 3.2, 0.32, ac, 2)
        s.text(x0 + 0.25, 2.85, w - 0.9, 1.6, [[('בקרה טרם הטמעה', {'bold': True})], [("צ'קליסט ", {}), ('OPTICA', {'lang': 'en-US', 'color': C.LIME, 'bold': True})]], size=13, color=C.WHITE, align='ctr', anchor='ctr')
    A1 = g.id
    dl = s.line(x0 + w/2, 4.5, x0 + w/2, 4.95, ac, 1.5, dash='dash', tail='triangle')
    g = s.group('monitoring')
    with g:
        s.rect(x0 + 0.15, 5.05, w - 0.3, 1.65, (C.WHITE, 0.06), dict(c=ac, w=1, a=0.7), r=0.12)
        s.icon('activity', x0 + w - 0.5, 5.4, 0.32, ac, 2)
        s.text(x0 + 0.25, 5.05, w - 0.9, 1.65, ['ניטור והתנסות,', 'מדידת השפעה', 'והטמעה'], size=13, color=C.WHITE, align='ctr', anchor='ctr')
    A2 = g.id
    for i, (panel, hdr, *_r) in enumerate(groups):
        s.anim.after(fade(panel, 0, 400), rise(hdr, 100, 500, 0.02))
    s.anim.after(*[rise(b, i*110, 400, 0.02) for i, b in enumerate(R)])
    s.anim.after(*[rise(b, i*130, 400, 0.02) for i, b in enumerate(L)])
    s.anim.after(rise(A1, 0, 400, 0.02), wipe(dl, 400, 400, 'down'), rise(A2, 700, 400, 0.02))
    return s
