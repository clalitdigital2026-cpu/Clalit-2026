# -*- coding: utf-8 -*-
from kit import *
from PIL import ImageDraw, ImageFont
import io

# ---------------------------------------------------------------- screenshot composites (faithful to the original grouped screenshots)
def _compose(n):
    out = os.path.join(CACHE, f'screen{n}.png')
    if n == 19:
        return 'image105.png', [(0.0215, 0.5487, 0.2437, 0.1474), (0.0249, 0.7811, 0.2437, 0.0830)]
    PPI = 1917 / 13.331
    ox, oy = 0.0024, 0.4671
    W, H = int(13.331*PPI), int(6.648*PPI)
    def g2c(x, y):  # outer group coords -> composite child coords
        return 0.0024 + (x - 0.3827)*13.331/9.2609, 0.4671 + (y - 1.0006)*6.648/4.9159
    def place(canvas, fname, x, y, w, h, crop=(0, 0, 0, 0)):
        im = Image.open(os.path.join(MEDIA, fname)).convert('RGBA'); iw, ih = im.size
        l, t, r, b = crop
        im = im.crop((int(iw*l), int(ih*t), int(iw*(1-r)), int(ih*(1-b))))
        im = im.resize((max(1, int(w*PPI)), max(1, int(h*PPI))), Image.LANCZOS)
        canvas.alpha_composite(im, (int((x-ox)*PPI), int((y-oy)*PPI)))
    cv = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    place(cv, 'image64.png', 0.002, 0.467, 13.331, 6.565)
    place(cv, 'image108.png', 0.083, 2.365, 13.250, 4.750, (0.00451, 0.28402, 0, 0))
    hl = []
    def frac(x, y, w, h):
        a, b = g2c(x, y); c, d = g2c(x + w, y + h)
        return ((a-ox)/13.331, (b-oy)/6.648, (c-a)/13.331, (d-b)/6.648)
    if n == 20:
        hl = [frac(0.600, 3.104, 4.650, 1.943)]
    if n == 21:
        sc = 13.331/9.2609
        def gplace(fname, x, y, w, h, crop=(0, 0, 0, 0)):
            a, b = g2c(x, y); place(cv, fname, a, b, w*sc, h*6.648/4.9159, crop)
        gplace('image112.png', 0.555, 2.870, 7.493, 2.933)
        gplace('image113.png', 8.213, 2.658, 1.335, 0.381, (0.10542, 0, 0.00657, 0))
        dr = ImageDraw.Draw(cv)
        a, b = g2c(8.204, 5.435); c, d = g2c(8.204 + 1.335, 5.435 + 0.376)
        dr.rectangle([int((a-ox)*PPI), int((b-oy)*PPI), int((c-ox)*PPI), int((d-oy)*PPI)], fill=(0xEC, 0xEC, 0xF1, 255))
        gplace('image114.png', 8.678, 5.517, 0.803, 0.165, (0.36949, 0.22688, 0.07384, 0.29302))
        a, b = g2c(8.552, 2.797); c, d = g2c(8.552 + 0.751, 2.797 + 0.164)
        dr.rectangle([int((a-ox)*PPI), int((b-oy)*PPI), int((c-ox)*PPI), int((d-oy)*PPI)], fill=(255, 255, 255, 255))
        f = ImageFont.truetype(os.path.expanduser('~/.fonts/OpenSans-700.ttf'), int(8/72*sc*PPI))
        dr.text((int((c-ox)*PPI), int((b-oy)*PPI)), 'סוכרת', font=f, fill=(0x1F, 0x4E, 0x9C, 255), anchor='ra', direction='rtl')
        hl = [frac(0.600, 2.937, 7.504, 2.874)]
    cv.convert('RGB').save(out)
    return out, hl

# ---------------------------------------------------------------- 17 DATA -> DECISION ENGINE
INP = [('דאטה מולטי-מודאלי (רשומה)', 'files'), ('סנסורים חדשים', 'watch'), ('גנטיקה ובדיקות מולקולריות', 'microscope'),
       ('דימות ותוצרי בדיקה דיגיטליים', 'scan'), ('ביו-מרקרים (עדכון מתמיד)', 'test-tube-diagonal')]
OUT = [('איתור סיכון מוקדם', 'radar'), ('גילוי מוקדם', 'eye'), ('אבחון מדויק', 'crosshair'), ('טיפול מותאם אישית', 'user-check'), ('פניה יזומה למטופל', 'send')]
def s17(d, n=17):
    s = d.new(dark=True)
    ids = head(s, n, 'דאטה ניטורי מעשיר את מערכות המידע ומוביל להחלטות מדויקות ומותאמות אישית למטופל', size=26)
    intro(s, ids)
    cx, cy = SW/2, 4.25
    hi = s.text(8.55, 1.75, 4.18, 0.4, [[('תשומות ומקורות דאטה ', {}), ('(Inputs)', {'lang': 'en-US', 'color': C.AQUA})]], size=14, bold=True, color=C.WHITE, align='ctr')
    ho = s.text(0.6, 1.75, 4.18, 0.4, [[('תוצאים והשפעה קלינית ', {}), ('(Outcomes)', {'lang': 'en-US', 'color': C.LIME})]], size=14, bold=True, color=C.WHITE, align='ctr')
    ys = [2.3 + i*0.88 for i in range(5)]
    ins, outs, lin, lout, pin, pout = [], [], [], [], [], []
    for i, (t, ic) in enumerate(INP):
        y = ys[i]
        a, b = (8.55, y + 0.33), (cx + 1.2, cy)
        pth = bez(a, b, 0.5)
        lin.append(s.path(pth, line=dict(c=C.AQUA, w=1.25, a=0.6), name='input link'))
        p = dot(s, *a, 0.09, C.AQUA); pin.append(flow(p, mpath_curve(a, [pth[1]]), 300 + i*260, 1600))
        g = s.group(f'input {t}')
        with g:
            s.rect(8.55, y, 4.18, 0.66, (C.AQUA, 0.08), dict(c=C.AQUA, w=1, a=0.6), r=0.12)
            s.oval(12.37, y + 0.33, 0.46, (C.AQUA, 0.2), None); s.icon(ic, 12.37, y + 0.33, 0.26, C.AQUA, 1.9)
            s.text(8.7, y, 3.35, 0.66, [t], size=13, bold=True, color=C.WHITE, anchor='ctr')
        ins.append(g.id)
    for i, (t, ic) in enumerate(OUT):
        y = ys[i]
        a, b = (cx - 1.2, cy), (4.78, y + 0.33)
        pth = bez(a, b, 0.5)
        lout.append(s.path(pth, line=dict(c=C.LIME, w=1.25, a=0.6), name='output link'))
        p = dot(s, *a, 0.09, C.LIME); pout.append(flow(p, mpath_curve(a, [pth[1]]), 300 + i*260, 1600))
        g = s.group(f'outcome {t}')
        with g:
            s.rect(0.6, y, 4.18, 0.66, (C.LIME, 0.08), dict(c=C.LIME, w=1, a=0.6), r=0.12)
            s.oval(4.42, y + 0.33, 0.46, (C.LIME, 0.2), None); s.icon(ic, 4.42, y + 0.33, 0.26, C.LIME, 1.9)
            s.text(0.75, y, 3.35, 0.66, [t], size=13, bold=True, color=C.WHITE, anchor='ctr')
        outs.append(g.id)
    ring1 = s.oval(cx, cy, 3.0, None, dict(c=C.AQUA, w=1, a=0.5, dash='sysDash'), name='engine ring outer')
    ring2 = s.oval(cx, cy, 2.62, None, dict(c=C.LIME, w=0.75, a=0.45, dash='dash'), name='engine ring inner')
    eng = s.group('decision engine')
    with eng:
        s.oval(cx, cy, 2.4, dict(radial=[(0, '0D5966'), (100, '06323A')], c=(50, 40)), dict(c=C.AQUA, w=1.5), glow=(C.AQUA, 16, 0.35))
        s.icon('brain-circuit', cx, cy - 0.68, 0.42, C.LIME, 1.7)
        s.text(cx - 1.0, cy - 0.42, 2.0, 0.75, ['מערכת תמיכה', 'בקבלת החלטות'], size=15, bold=True, color=C.WHITE, align='ctr', anchor='ctr', lnspc=95)
        s.text(cx - 1.0, cy + 0.33, 2.0, 0.42, ['ע"ב מודלים מתקדמים', 'ופרופיל אישי'], size=10.5, color='B7D3D3', align='ctr', lnspc=95)
        s.rect(cx - 0.42, cy + 0.8, 0.84, 0.28, (C.LIME, 0.18), dict(c=C.LIME, w=0.75), r=0.14)
        s.icon('user-round', cx - 0.25, cy + 0.94, 0.17, C.LIME, 2)
        s.text(cx - 0.12, cy + 0.8, 0.5, 0.28, ['פרופיל'], size=8, bold=True, color=C.LIME, anchor='ctr', align='ctr')
    s.anim.click(fade(hi, 0, 300), *[rise(g, 100 + i*110, 450, 0.02) for i, g in enumerate(ins)], *[wipe(l, 600 + i*80, 500, 'left') for i, l in enumerate(lin)])
    s.anim.click(zoom(eng.id, 0, 700, 0.6), fade(ring1, 300, 500), fade(ring2, 300, 500), spin(ring1, 300, 40000), spin(ring2, 300, 30000, -360), *pin)
    s.anim.click(fade(ho, 0, 300), *[wipe(l, i*80, 500, 'left') for i, l in enumerate(lout)], *[rise(g, 350 + i*110, 450, 0.02) for i, g in enumerate(outs)], *pout)
    return s

# ---------------------------------------------------------------- 18 MONITORING DEVICES ECOSYSTEM
def s18(d, n=18):
    s = d.new()
    ids = head(s, n, 'דאטה ניטורי מעשיר את מערכות המידע ומוביל להחלטות מדויקות ומותאמות אישית למטופל', size=26)
    intro(s, ids)
    hx, hy = 6.4, 2.95
    # devices row
    devs = [('Garmin', [('image98.org&utm_campaign=index&utm_content=thumbnail', 1.25, None)], [('image97.png', 1.0)], 'שעון חכם'),
            ('FreeStyle Libre', [('image99.png', 1.15, None)], [('image89.jpeg', 1.35)], 'חיישן גלוקוז רציף'),
            ('biobeat', [('image96.png', 1.15, (0, 0.08, 0, 0.08))], [('image100.png', 0.95)], 'ניטור לחץ דם – מדבקה'),
            ('essence smartcare', [('image95.png', 1.4, None)], [('image104.png', 0.95), ('image101.png', 0.75), ('image102.png', 0.7), ('image103.png', 0.72)], 'ניטור לחץ דם ומדדים בבית')]
    cw = 2.85; gap = 0.2; y0 = 4.65; ch = 2.2
    cards = []; links = []; parts = []
    for i, (nm, logos, prods, cap) in enumerate(devs):
        x = 0.6 + i*(cw + gap) if i < 3 else 0.6 + i*(cw + gap)
        x = SW - MX - cw - (3 - i)*(cw + gap) - 0.0 if False else x
        g = s.group(f'device {nm}')
        with g:
            s.rect(x, y0, cw, ch, C.WHITE, dict(c=C.LINE, w=0.75), r=0.16, shadow='md')
            sx_, sy_, sw2, sh2 = x + 0.1, y0 + 0.1, cw - 0.2, 1.32
            if prods[0][0].endswith('jpeg'):      # real photo: fills the stage
                s.pic(prods[0][0], sx_, sy_, sw2, sh2, fit='cover', r=0.12, name=f'{nm} device')
            else:
                s.rect(sx_, sy_, sw2, sh2, C.WHITE, dict(c=C.MIST, w=0.75), r=0.12)
                n_ = len(prods); slot = sw2 / n_
                for j, (pf, _pw) in enumerate(prods):
                    contain(s, pf, sx_ + sw2 - (j + 1)*slot, sy_, slot, sh2, pad=0.12 if n_ == 1 else 0.05, name=f'{nm} device')
            lf = trimmed(logos[0][0])
            contain(s, lf, x + cw - 1.55, y0 + 1.5, 1.4, 0.34, name=f'{nm} logo')
            s.text(x + 0.15, y0 + 1.86, cw - 0.3, 0.28, [cap], size=11, color=C.MUTED, align='r', anchor='ctr')
        cards.append(g.id)
        a = (x + cw/2, y0 - 0.02); b = (hx + (i - 1.5)*0.32, hy + 0.95)
        pth = bez(a, b, 0.55, 'v')
        links.append(s.path(pth, line=dict(c=C.TEAL, w=1.5, a=0.7), name='device link'))
        p = dot(s, *a, 0.1, C.LIME); parts.append(flow(p, mpath_curve(a, [pth[1]]), 300 + i*350, 1500))
    # hub Datos
    hub = s.group('Datos hub')
    with hub:
        s.oval(hx, hy, 2.05, C.WHITE, dict(c=C.TEAL, w=2), shadow='lg', glow=(C.AQUA, 10, 0.25))
        s.pic('image93.png', hx - 0.8, hy - 0.42, w=1.6, crop=(0.0, 0.0, 0.0, 0.0), name='Datos Health')
    ring = s.oval(hx, hy, 2.45, None, dict(c=C.TEAL, w=1, dash='sysDash', a=0.6), name='hub ring')
    # app (right)
    ph, scr = s.phone(10.95, 1.62, 1.32, 'image92.jpeg', name='patient app')
    appl = s.text(10.4, 4.36, 2.4, 0.26, ['אפליקציית המטופל'], size=10.5, bold=True, color=C.MUTED, align='ctr')
    a1 = s.path(bez((10.85, 2.95), (hx + 1.12, hy), 0.5), line=dict(c=C.TEAL, w=2, tail='triangle'), name='app to datos')
    pa = dot(s, 10.85, 2.95, 0.1, C.LIME)
    # C-Pi (left)
    cpi = s.group('C-Pi')
    with cpi:
        s.oval(1.85, hy, 1.85, C.WHITE, dict(c=C.LIME, w=2), shadow='lg')
        s.pic('image88.png', 1.85 - 0.72, hy - 0.38, w=1.44, name='C-Pi')
    cl = s.group('clalit')
    with cl:
        s.rect(3.45, hy - 0.22, 1.05, 0.44, C.WHITE, dict(c=C.LINE, w=0.75), r=0.22, shadow='sm')
        s.pic('image139.png', 3.52, hy - 0.08, w=0.9, name='כללית')
    a2 = s.line(hx - 1.1, hy, 4.55, hy, C.TEAL, 2, tail='triangle', name='datos to clalit')
    a3 = s.line(3.42, hy, 2.82, hy, C.TEAL, 2, tail='triangle', name='clalit to cpi')
    pc = dot(s, hx - 1.1, hy, 0.1, C.LIME)
    s.anim.click(*[rise(c, i*150, 500, 0.03) for i, c in enumerate(cards)])
    s.anim.click(zoom(hub.id, 0, 600, 0.6), fade(ring, 200, 500), spin(ring, 200, 30000), *[wipe(l, 300 + i*100, 500, 'up') for i, l in enumerate(links)], *parts)
    s.anim.click(fade(ph, 0, 500), fade(appl, 200, 300), wipe(a1, 400, 500, 'left'), flow(pa, mpath_curve((10.85, 2.95), [bez((10.85, 2.95), (hx + 1.12, hy), 0.5)[1]]), 900, 1400))
    s.anim.click(wipe(a2, 0, 500, 'left'), fade(cl.id, 300, 400), wipe(a3, 600, 400, 'left'), zoom(cpi.id, 800, 600, 0.6), flow(pc, mpath(hx - 1.1, hy, 2.8, hy), 1300, 1800))
    return s

# ---------------------------------------------------------------- 19-21 series: data source -> doctor's screen
def series(d, n, title, sub, visual, photo, extra=None):
    s = d.new()
    ids = head(s, n, title, sub=sub)
    intro(s, ids)
    scr, hls = _compose(n)
    mon, (sx, sy, sw_, sh_) = s.monitor(0.55, 1.95 if sub else 1.8, 7.75, scr)
    hl_ids = []
    for (fx_, fy_, fw_, fh_) in hls:
        hl_ids.append(s.rect(sx + sw_*fx_, sy + sh_*fy_, sw_*fw_, sh_*fh_, None, dict(c=C.LIME, w=2.25), r=0.04, glow=(C.LIME, 6, 0.45), name='!!highlight'))
    # right column: data source panel + human photo
    panel = s.group('!!source-panel')
    with panel:
        s.rect(8.85, 1.85, 3.88, 2.1, dict(grad=[(0, '0A4650'), (100, C.NIGHT2)], ang=90), None, r=0.2, shadow='md', name='source bg')
    vis = visual(s, 8.85, 1.85, 3.88, 2.1)
    l_, t_, r_, b_ = photo[1]
    iw_, ih_ = Image.open(os.path.join(MEDIA, photo[0])).size
    ar_ = (iw_*(1-l_-r_)) / (ih_*(1-t_-b_))
    hmax = 2.0 if extra else 2.72
    pw_ = min(3.88, hmax*ar_); phh = pw_ / ar_
    ph = s.pic(photo[0], 12.73 - pw_, 4.12, pw_, phh, crop=photo[1], r=0.2, name='!!photo', shadow='sm')
    # flow from source to highlight
    tx, ty = (sx + sw_*hls[0][0] + sw_*hls[0][2], sy + sh_*hls[0][1] + sh_*hls[0][3]/2)
    pth = bez((8.8, 3.0), (tx + 0.05, ty), 0.45)
    fl = s.path(pth, line=dict(c=C.LIME, w=2, dash='sysDot', tail='triangle'), name='!!flow')
    pts = [dot(s, 8.8, 3.0, 0.12, C.LIME) for _ in range(2)]
    s.anim.auto(fade(mon, 200, 600))
    s.anim.click(fade(panel.id, 0, 400), *vis)
    s.anim.click(wipe(fl, 0, 600, 'left'), *[flow(p, mpath_curve((8.8, 3.0), [pth[1]]), 400 + i*800, 1600) for i, p in enumerate(pts)],
                 *[wipe(h, 600 + i*200, 500, 'right') for i, h in enumerate(hl_ids)], *[pulse(h, 1300, 600, 1.03) for h in hl_ids])
    s.anim.click(rise(ph, 0, 600), *(extra(s) if extra else []))
    s.transition = 'fade' if n == 19 else 'morph'
    return s

def dna_visual(s, x, y, w, h):
    """animated double helix drawn natively"""
    cx0, cy = x + 0.35, y + h/2
    L = w - 0.7; amp = 0.55; N = 3
    fx = []
    def strand(phase, col):
        segs = []; pts = []
        steps = 24
        for k in range(steps + 1):
            t = k/steps; xx = cx0 + L*t; yy = cy + amp*math.sin(2*math.pi*N*t + phase)
            pts.append((xx, yy))
        return s.path(pts, line=dict(c=col, w=2.75), name='helix strand'), pts
    a, pa = strand(0, C.LIME)
    b, pb = strand(math.pi, C.AQUA)
    rungs = []
    for k in range(1, 24, 2):
        (x1, y1), (x2, y2) = pa[k], pb[k]
        rungs.append(s.line(x1, y1, x2, y2, 'B7D3D3', 1.25, a=0.6, name='base pair'))
    lab = s.text(x + 0.2, y + 0.12, w - 0.4, 0.3, [[('DNA', {'lang': 'en-US'}), (' · מידע גנומי', {})]], size=11, bold=True, color=C.LIME, align='r')
    fx += [wipe(a, 0, 1200, 'right'), wipe(b, 150, 1200, 'right')] + [fade(r, 300 + i*70, 300) for i, r in enumerate(rungs)] + [fade(lab, 0, 400)]
    fx += [pulse(a, 1500, 1600, 1.02, repeat='indefinite')]
    return fx

def chart_visual(s, x, y, w, h, values, labels2, unit, label, color, sensor_icon):
    """measurement line chart using the original data points"""
    fx = []
    lab = s.text(x + 0.2, y + 0.12, w - 0.4, 0.3, [label], size=11, bold=True, color=color, align='r')
    x0, x1 = x + 0.55, x + w - 0.35; yb, yt = y + h - 0.35, y + 0.75
    vmin, vmax = min(values) - (max(values) - min(values))*0.6, max(values) + (max(values) - min(values))*0.4
    pts = []
    n = len(values)
    for i, v in enumerate(values):
        px = x0 + (x1 - x0)*i/(n - 1); py = yb - (yb - yt)*(v - vmin)/(vmax - vmin)
        pts.append((px, py))
    # smooth path through points
    segs = [pts[0]]
    for i in range(1, n):
        (ax, ay), (bx, by) = pts[i-1], pts[i]
        dx = (bx - ax)*0.5
        segs.append(((ax + dx, ay), (bx - dx, by), (bx, by)))
    base = s.line(x0 - 0.1, yb + 0.12, x1 + 0.1, yb + 0.12, '2E6A73', 1, name='axis')
    ln = s.path(segs, line=dict(c=color, w=2.75), glow=(color, 5, 0.4), name='measurements')
    dots = []
    for i, (px, py) in enumerate(pts):
        dots.append(s.oval(px, py, 0.14, C.NIGHT2, dict(c=color, w=2), name='reading'))
        txt = values[i] if labels2 is None else f'{values[i]}/{labels2[i]}'
        dots.append(s.text(px - 0.42, py - 0.42, 0.84, 0.26, [[(str(txt), {'lang': 'en-US'})]], size=11, bold=True, color=C.WHITE, align='ctr', rtl=False, name='reading value'))
    sen = s.group('sensor')
    with sen:
        s.oval(x + 0.32, yb - 0.1, 0.42, (color, 0.18), dict(c=color, w=1))
        s.icon(sensor_icon, x + 0.32, yb - 0.1, 0.24, color, 2)
    un = s.text(x1 - 1.0, yb + 0.12, 1.0, 0.22, [[(unit, {'lang': 'en-US'})]], size=9, color='9DBFC1', align='r', rtl=False)
    fx += [fade(lab, 0, 400), fade(base, 0, 300), zoom(sen.id, 100, 400, 0.6), wipe(ln, 300, 1400, 'right'), fade(un, 300, 300)]
    fx += [fade(dt, 400 + (i//2)*330, 300) for i, dt in enumerate(dots)]
    return fx

def s19(d, n=19):
    return series(d, n, 'דאטה גנומי משנה החלטות טיפול בשולחן רופא המשפחה', None, dna_visual, ('image106.png', (0.66604, 0.53283, 0.01828, 0.16648)))

def s20(d, n=20):
    return series(d, n, 'ניטור מתמשך של לחץ דם מתורגם להחלטות טיפול מותאמות אישית', None,
                  lambda s, x, y, w, h: chart_visual(s, x, y, w, h, [120, 121, 123, 122], [78, 81, 82, 79], 'mmHg', 'ניטור לחץ דם רציף', C.AQUA, 'heart-pulse'),
                  ('image109.png', (0.71417, 0.11422, 0.03291, 0.53753)))

def s21(d, n=21):
    def extra(s):
        b = s.group('abbott')
        with b:
            s.rect(8.85, 6.25, 3.88, 0.6, dict(grad=[(0, C.LIME), (100, '7DB800')], ang=0), None, r=0.31, shadow='md', glow=(C.LIME, 8, 0.35))
            s.icon('handshake', 12.35, 6.55, 0.32, C.PETROL, 2)
            s.text(8.95, 6.25, 3.2, 0.6, ['נחתם הסכם אבוט!'], size=17, bold=True, color=C.PETROL, anchor='ctr', align='ctr')
        return [zoom(b.id, 0, 600, 0.6), pulse(b.id, 700, 500, 1.06)]
    s = series(d, n, 'תרגום דאטה של גלוקוז רציף להמלצות טיפול', 'משימה שעד היום הייתה נחלתם של אנדוקרינולוגים',
               lambda s, x, y, w, h: chart_visual(s, x, y, w, h, [245, 258, 234, 267], None, 'mg/dL', 'ניטור גלוקוז רציף', C.LIME, 'radio'),
               ('image109.png', (0.42737, 0.12063, 0.30595, 0.51534)), extra)
    return s

# ---------------------------------------------------------------- 22 AGENTS: care gaps in ward
def s22(d, n=22):
    s = d.new(dark=True)
    ids = head(s, n, 'אייג׳נטים למציאת פערי טיפול בקרב מאושפזי המחלקה')
    intro(s, ids)
    gx, gy = 0.6, 1.95; cw, ch, gxp, gyp = 1.36, 0.92, 0.12, 0.12
    recs = []; alert_cards = {}
    for r in range(4):
        for c in range(4):
            x = gx + c*(cw + gxp); y = gy + r*(ch + gyp)
            g = s.group(f'record {r}{c}')
            with g:
                s.rect(x, y, cw, ch, (C.WHITE, 0.06), dict(c=C.AQUA, w=0.75, a=0.35), r=0.08)
                s.oval(x + cw - 0.22, y + 0.22, 0.24, (C.AQUA, 0.25), None)
                s.icon('user-round', x + cw - 0.22, y + 0.22, 0.14, C.AQUA, 2)
                for k, ww in enumerate([0.75, 1.05, 0.9, 0.6]):
                    s.rect(x + cw - 0.42 - ww*(0.8 if k == 0 else 1) + (0.0 if k == 0 else 0.3), y + 0.17 + k*0.17, ww*(0.8 if k == 0 else 1), 0.06, (C.WHITE, 0.25 if k else 0.45), None, r=0.03)
            recs.append(g.id)
            if (r, c) in ((1, 2), (3, 0)): alert_cards[(r, c)] = (x, y)
    beam = s.rect(gx - 0.1, gy - 0.08, 0.35, 4*(ch + gyp) + 0.04, dict(grad=[(0, C.LIME, 0), (50, C.LIME, 0.45), (100, C.LIME, 0)], ang=0), None, name='scan beam')
    alerts = []
    for k, (key, ic, lab) in enumerate([((1, 2), 'droplets', 'AKI'), ((3, 0), 'pill', 'נפרוטוקסי')]):
        x, y = alert_cards[key]
        g = s.group(f'alert {lab}')
        with g:
            s.rect(x - 0.03, y - 0.03, cw + 0.06, ch + 0.06, None, dict(c='F2B233', w=2.25), r=0.1, glow=('F2B233', 8, 0.45))
            s.rect(x + 0.1, y + ch - 0.36, cw - 0.2, 0.28, ('F2B233', 0.9), None, r=0.14)
            s.icon('triangle-alert', x + cw - 0.27, y + ch - 0.22, 0.17, C.NIGHT, 2.4)
            s.text(x + 0.12, y + ch - 0.36, cw - 0.5, 0.28, [[(lab, {'lang': 'en-US' if lab == 'AKI' else 'he-IL'})]], size=10.5, bold=True, color=C.NIGHT, anchor='ctr', align='r')
        alerts.append(g.id)
    ag = agent_mark(s, 7.45, 3.95, 1.0)
    proto = s.group('protocols')
    with proto:
        s.rect(6.8, 4.85, 1.3, 1.3, (C.WHITE, 0.06), dict(c=C.LIME, w=0.75, a=0.6), r=0.12)
        s.icon('clipboard-check', 7.45, 5.3, 0.4, C.LIME, 1.8)
        s.text(6.82, 5.6, 1.26, 0.45, ['פרוטוקולי', 'איכות'], size=10, bold=True, color=C.WHITE, align='ctr', lnspc=90)
    lk = s.line(7.45, 4.6, 7.45, 4.83, C.LIME, 1.25, dash='sysDot')
    head_t = s.text(8.6, 1.95, 4.13, 1.55, ['אייג׳נטים ייעודיים למצוא פערי טיפול אל מול פרוטוקולי איכות טיפול שכל מחלקה תבחר להגדיר'], size=17, bold=True, color=C.WHITE, lnspc=110)
    st = s.text(8.6, 3.62, 4.13, 0.62, [[('החל פיתוח פרוטוקולים ראשונים בשת"פ מחלקות בלינסון:', {})]], size=13, bold=True, color=C.LIME, lnspc=105)
    b1 = s.group('example AKI')
    with b1:
        s.rect(8.6, 4.4, 4.13, 0.8, (C.WHITE, 0.07), dict(c='F2B233', w=1, a=0.8), r=0.14)
        s.oval(12.3, 4.8, 0.48, ('F2B233', 0.22), None); s.icon('droplets', 12.3, 4.8, 0.26, 'F2B233', 2)
        s.text(8.75, 4.4, 3.2, 0.8, [[('זיהוי מטופלים עם ', {}), ('AKI', {'lang': 'en-US'})]], size=14, bold=True, color=C.WHITE, anchor='ctr')
    b2 = s.group('example nephrotoxic')
    with b2:
        s.rect(8.6, 5.35, 4.13, 0.8, (C.WHITE, 0.07), dict(c='F2B233', w=1, a=0.8), r=0.14)
        s.oval(12.3, 5.75, 0.48, ('F2B233', 0.22), None); s.icon('pill', 12.3, 5.75, 0.26, 'F2B233', 2)
        s.text(8.75, 5.35, 3.2, 0.8, ['איתור מתן תרופות נפרוטוקסיות'], size=14, bold=True, color=C.WHITE, anchor='ctr')
    bd = badge(s, 8.6, 6.38, 'בשלבי פיתוח', 'dev', 11, w=1.35)
    s.anim.click(*[fade(r, i*35, 350) for i, r in enumerate(recs)], fade(head_t, 300, 500))
    s.anim.click(zoom(ag, 0, 600, 0.6), wipe(lk, 300, 300, 'down'), fade(proto.id, 400, 400), fade(beam, 600, 300), flow(beam, mpath(gx - 0.1, gy, 5.95, gy), 700, 3200, fade=True))
    s.anim.click(fade(st, 0, 400), fade(bd, 0, 400), zoom(alerts[0], 300, 450, 0.8), pulse(alerts[0], 800, 400, 1.05), rise(b1.id, 400, 500, 0.02))
    s.anim.click(zoom(alerts[1], 0, 450, 0.8), pulse(alerts[1], 500, 400, 1.05), rise(b2.id, 100, 500, 0.02))
    return s

# ---------------------------------------------------------------- 23 AGENTS at the appointment request
def s23(d, n=23):
    s = d.new()
    ids = head(s, n, "אייג'נטים בפיתוח שיפעלו בנקודת הבקשה לקבוע תורים")
    intro(s, ids)
    cy = 4.15
    pat = s.group('patient')
    with pat:
        s.oval(11.75, cy, 1.25, dict(grad=[(0, C.TEAL), (100, C.PETROL)], ang=45), None, shadow='md')
        s.icon('user-round', 11.75, cy, 0.6, C.WHITE, 1.7)
        s.text(10.95, cy + 0.72, 1.6, 0.35, ['מטופל/ת'], size=13, bold=True, color=C.PETROL, align='ctr')
    req = s.group('request')
    with req:
        s.rect(9.05, cy - 1.15, 2.4, 0.62, C.WHITE, dict(c=C.LINE, w=0.75), r=0.2, shadow='sm')
        s.icon('calendar-plus', 11.15, cy - 0.84, 0.3, C.TEAL, 2)
        s.text(9.15, cy - 1.15, 1.75, 0.62, ['בקשה לקביעת תור'], size=12.5, bold=True, color=C.INK, anchor='ctr')
    l1 = s.line(11.05, cy, 8.0, cy, C.TEAL, 2, tail='triangle', name='request line')
    rp = dot(s, 11.05, cy, 0.13, C.LIME)
    ag = agent_mark(s, 7.25, cy, 1.25)
    al = s.text(5.0, 1.95, 3.3, 0.35, ['ניתוב חלופות לתורים:'], size=14, bold=True, color=C.TEAL, align='ctr')
    opts = [('רופא משפחה', None, 'stethoscope', 2.55), ('רופא משפחה אונליין', None, 'monitor-smartphone', 4.15), ('אורתופד', '(שותפות מחוז שו״ש)', 'bone', 5.75)]
    oids = []; lines = []
    for t, sub, ic, oy in opts:
        pth = bez((6.45, cy), (4.65, oy), 0.5)
        lines.append(s.path(pth, line=dict(c=C.LIME, w=2), name='option link'))
        g = s.group(f'option {t}')
        with g:
            s.rect(0.6, oy - 0.6, 4.0, 1.2, C.WHITE, dict(c=C.LINE, w=0.75), r=0.2, shadow='md')
            s.oval(4.0, oy, 0.82, C.TEAL_T, None)
            s.icon(ic, 4.0, oy, 0.42, C.PETROL, 1.8)
            if sub:
                s.text(0.8, oy - 0.42, 2.7, 0.45, [t], size=17, bold=True, color=C.PETROL, anchor='ctr')
                s.text(0.8, oy + 0.02, 2.7, 0.35, [sub], size=12, color=C.MUTED, anchor='ctr')
            else:
                s.text(0.8, oy - 0.3, 2.7, 0.6, [t], size=17, bold=True, color=C.PETROL, anchor='ctr')
        oids.append(g.id)
    bd = badge(s, 10.95, 6.4, 'בפיתוח', 'dev', 11, w=1.0)
    note = s.text(8.6, 5.55, 4.13, 0.7, ['תהליך פשוט מנקודת המבט של המטופל – הסוכן מציג חלופות זמינות כבר בנקודת הבקשה'], size=11.5, color=C.MUTED, align='r', lnspc=105)
    s.anim.click(zoom(pat.id, 0, 500, 0.6), rise(req.id, 300, 500, 0.03), wipe(l1, 700, 500, 'left'), flow(rp, mpath(11.05, cy, 7.9, cy), 900, 1600))
    s.anim.click(zoom(ag, 0, 600, 0.6), pulse(ag, 700, 500, 1.06), fade(al, 300, 400))
    s.anim.click(*[x for i, (l, o) in enumerate(zip(lines, oids)) for x in (wipe(l, i*250, 450, 'left'), slide_in(o, 200 + i*250, 500, 0.3))], fade(bd, 900, 400), fade(note, 900, 500))
    return s

# ---------------------------------------------------------------- 24 PERSONAL HEALTH AGENT
AG24 = [('אייג׳נט פרואקטיבי לסגירת מעגל AI‑PRO', 'שליחת הפניות שהפיק הרופא בזמן פרואקטיבי, זימון תור', 'refresh-ccw-dot', 'זימון תור'),
        ('אייג׳נט לניהול מחלה כרונית במסגרת AI‑PRO', 'סוכרת תחילה', 'heart-pulse', 'ניהול סוכרת'),
        ('אייג׳נט לאיסוף דאטה חיוני לטיוב המלצות AI‑PRO', 'עישון, סיפור משפחתי', 'clipboard-list', 'השלמת נתונים'),
        ('אייג׳נט תזכורות והגברת היענות להמלצות AI‑PRO', 'ניפוק תרופות, ביצוע הפניות קריטיות שלא בוצעו', 'bell-ring', 'תזכורת'),
        ('אייג׳נט להפניות AI‑PRO שהופקו באופן אוטומטי', 'דגש על מדדי איכות', 'file-check', 'הפניה')]
def s24(d, n=24):
    s = d.new()
    ids = head(s, n, 'סוכן בריאות אישי', sub='דוגמאות נוספות לסוכנים בפיתוח שיורגשו ישירות על ידי מטופלים')
    intro(s, ids)
    px, pw = 5.72, 1.9
    ph, (sx, sy, sw_, sh_) = s.phone(px, 2.0, pw, None, name='!!phone')
    ui = s.group('agent ui (illustration)')
    with ui:
        s.rect(sx, sy, sw_, 0.62, dict(grad=[(0, C.PETROL), (100, C.TEAL)], ang=0), None, r=0.22)
        s.rect(sx, sy + 0.3, sw_, 0.32, C.TEAL, None)
        s.text(sx + 0.1, sy + 0.24, sw_ - 0.2, 0.32, ['סוכן הבריאות שלי'], size=10, bold=True, color=C.WHITE, align='ctr', anchor='ctr')
    tag = s.chip(px + pw/2 - 0.42, 1.68, 0.84, 0.26, 'המחשה', C.AMBER_T, '8A5A00', size=9, line=dict(c=C.AMBER, w=0.75))
    notes = []
    for i, (t, ds, ic, short) in enumerate(AG24):
        y = sy + 0.75 + i*0.58
        g = s.group(f'notification {short}')
        with g:
            s.rect(sx + 0.08, y, sw_ - 0.16, 0.48, C.WHITE, dict(c=C.LINE, w=0.5), r=0.1, shadow='sm')
            s.oval(sx + sw_ - 0.32, y + 0.24, 0.3, C.TEAL_T, None)
            s.icon(ic, sx + sw_ - 0.32, y + 0.24, 0.17, C.TEAL, 2.2)
            s.text(sx + 0.14, y, sw_ - 0.55, 0.48, [short], size=9.5, bold=True, color=C.INK, anchor='ctr')
        notes.append(g.id)
    # agents around
    pos = [(8.25, 1.95, 'R'), (8.25, 3.55, 'R'), (8.25, 5.15, 'R'), (0.6, 2.75, 'L'), (0.6, 4.35, 'L')]
    cards = []; links = []
    for i, ((t, ds, ic, short), (x, y, side)) in enumerate(zip(AG24, pos)):
        w = 4.48
        g = s.group(f'agent {i+1}')
        with g:
            s.rect(x, y, w, 1.3, C.WHITE, dict(c=C.LINE, w=0.75), r=0.18, shadow='md')
            s.oval(x + w - 0.48, y + 0.48, 0.62, dict(grad=[(0, C.TEAL), (100, C.PETROL)], ang=45), None)
            s.icon(ic, x + w - 0.48, y + 0.48, 0.32, C.WHITE, 1.9)
            s.text(x + 0.18, y + 0.14, w - 1.0, 0.62, [t], size=12.5, bold=True, color=C.PETROL, lnspc=95, anchor='ctr')
            s.text(x + 0.18, y + 0.78, w - 1.0, 0.42, [ds], size=11, color=C.MUTED, lnspc=100)
        cards.append(g.id)
        ny = sy + 0.75 + i*0.58 + 0.24
        if side == 'R': a, b = (x - 0.02, y + 0.65), (px + pw + 0.05, ny)
        else: a, b = (x + w + 0.02, y + 0.65), (px - 0.05, ny)
        links.append(s.path(bez(a, b, 0.5), line=dict(c=C.TEAL, w=1.25, dash='sysDot', a=0.8), name='agent link'))
    pi = s.pic('image119.png', 0.6, 6.15, h=0.55, name='Pi – Proactive-Preventive interventions')
    s.anim.auto(fade(ph, 200, 600), fade(ui.id, 400, 500), fade(tag, 600, 400), fade(pi, 600, 400))
    for i in range(5):
        s.anim.click(rise(cards[i], 0, 500, 0.03), wipe(links[i], 300, 450, 'left' if pos[i][2] == 'R' else 'right'), slide_in(notes[i], 600, 450, 0.0, -0.06), pulse(notes[i], 1050, 350, 1.04))
    return s

# ---------------------------------------------------------------- 25 TRANSCRIPTION & SUMMARY
STEPS25 = [('מבוצעת בחינה של מספר מוצרי מדף בתחום', 'package-search'),
           ([('הבחינה מלווה בפיתוח כלי הערכה מבוסס אנליזת ', {}), ('Data Science', {'lang': 'en-US'}), (' למתן ציונים כמותיים על איכות התמלול והסיכום', {})], 'chart-column'),
           ('כלי הניטור ישמש למעקב ארוך טווח אחר יציבות הכלים', 'activity'),
           ('נבנה תהליך סדור עם עקרונות להרחבה בטיחותית של ההטמעה לצוותים ונושאים קליניים חדשים', 'shield-check')]
def s25(d, n=25):
    s = d.new()
    ids = head(s, n, 'אימוץ מערכות תמלול וסיכום')
    intro(s, ids)
    sub = s.text(MX, 1.28, SW - 2*MX, 0.62, [[('כלי תמלול וסיכום מבוססי ', {}), ('AI', {'lang': 'en-US'}), (', הפועלים ברקע בעת המפגש הרפואי ומייצרים תיעוד אוטומטי – כלים אלו הוכחו בעולם ככלים המקלים על תחושת העומס והשחיקה של הצוותים הרפואיים', {})]],
                 size=14, color=C.MUTED, lnspc=108, name='!!subtitle')
    # human encounter
    photo = s.pic('image22.jpeg', 2.35, 2.55, 4.6, 3.3, crop=(0.0, 0.0, 0.0, 0.0), fit='cover', r=0.22, name='doctor-patient encounter', shadow='md')
    # sound wave above
    wbg = s.rect(2.45, 1.95, 4.4, 0.7, C.PETROL, None, r=0.35, shadow='md', name='wave pill')
    wave = []
    import random; random.seed(7)
    for k in range(26):
        h = 0.08 + abs(math.sin(k*0.55))*0.42 + random.uniform(0, 0.08)
        xk = 2.6 + k*0.16
        wave.append(s.rect(xk, 2.3 - h/2, 0.07, h, C.LIME, None, r=0.035, name='voice bar'))
    # transcript + structured summary
    tr = s.group('live transcript')
    with tr:
        s.rect(0.6, 3.35, 2.25, 1.25, C.WHITE, dict(c=C.LINE, w=0.75), r=0.14, shadow='md')
        s.icon('audio-lines', 2.6, 3.58, 0.2, C.TEAL, 2)
        s.text(0.7, 3.45, 1.75, 0.25, ['תמלול בזמן אמת'], size=9.5, bold=True, color=C.TEAL)
    tlines = [s.rect(0.75, 3.85 + k*0.17, ww, 0.07, C.LINE, None, r=0.035, name='transcript line') for k, ww in enumerate([1.9, 1.6, 1.85, 1.2])]
    sm = s.group('structured summary')
    with sm:
        s.rect(0.6, 4.75, 2.25, 1.85, C.WHITE, dict(c=C.TEAL, w=1), r=0.14, shadow='md')
        s.rect(0.6, 4.75, 2.25, 0.34, C.PETROL, None, r=0.14)
        s.rect(0.6, 4.92, 2.25, 0.17, C.PETROL, None)
        s.icon('file-text', 2.6, 4.92, 0.18, C.LIME, 2)
        s.text(0.7, 4.75, 1.75, 0.34, ['סיכום רפואי מובנה'], size=9.5, bold=True, color=C.WHITE, anchor='ctr')
        for k, (lab, ww) in enumerate([('תלונה', 1.0), ('ממצאים', 1.25), ('הערכה', 0.9), ('המלצות', 1.15)]):
            yy = 5.2 + k*0.33
            s.text(2.0, yy, 0.75, 0.22, [lab], size=8.5, bold=True, color=C.PETROL, anchor='ctr')
            s.rect(1.95 - ww, yy + 0.08, ww, 0.06, C.LINE, None, r=0.03)
    arr = s.path(bez((2.95, 3.95), (2.4, 2.75), 0.5, 'v'), line=dict(c=C.LIME, w=1.5, tail='triangle'), name='to transcript') if False else None
    # process
    ph = s.text(7.4, 2.05, 5.33, 0.35, ['תהליך בחינה, הערכה והטמעה בטוחה'], size=14, bold=True, color=C.TEAL)
    steps = []
    for i, (t, ic) in enumerate(STEPS25):
        y = 2.55 + i*1.02
        g = s.group(f'step {i+1}')
        with g:
            s.rect(7.4, y, 5.33, 0.86, C.WHITE, dict(c=C.LINE, w=0.75), r=0.16, shadow='sm')
            s.oval(12.3, y + 0.43, 0.56, C.PETROL, None)
            s.icon(ic, 12.3, y + 0.43, 0.28, C.WHITE, 2)
            s.oval(12.02, y + 0.2, 0.24, C.LIME, dict(c=C.WHITE, w=1))
            s.text(11.9, y + 0.08, 0.24, 0.24, [[(str(i+1), {'lang': 'en-US'})]], size=9, bold=True, color=C.PETROL, align='ctr', anchor='ctr', rtl=False)
            s.text(7.55, y, 4.35, 0.86, [t] if isinstance(t, str) else [t], size=12, bold=True, color=C.INK, anchor='ctr', lnspc=100)
        steps.append(g.id)
        if i < 3: steps.append(s.line(12.3, y + 0.73, 12.3, y + 1.16, C.TEAL, 1.25, dash='sysDot', name='step link'))
    s.anim.auto(fade(sub, 0, 500), fade(photo, 300, 700))
    s.anim.click(fade(wbg, 0, 400), *[zoom(w, 100 + k*30, 300, 0.2) for k, w in enumerate(wave)], *[pulse(w, 900 + (k % 5)*90, 380, 1.4, repeat='indefinite') for k, w in enumerate(wave[::2])],
                 fade(tr.id, 900, 400), *[wipe(t, 1200 + k*350, 400, 'left') for k, t in enumerate(tlines)])
    s.anim.click(rise(sm.id, 0, 600))
    s.anim.click(fade(ph, 0, 300), *[rise(st, 150 + i*170, 450, 0.02) for i, st in enumerate(steps)])
    return s

# ---------------------------------------------------------------- 26 HOSPITALIZATION SUMMARIES
def s26(d, n=26):
    s = d.new()
    ids = head(s, n, 'אייג׳נטים לסיכומי אשפוזים', sub='סיכומים אוטומטיים להקלה על הצוותים')
    intro(s, ids)
    # complex record (right)
    rec = s.group('complex record')
    with rec:
        for k in range(4):
            s.rect(10.35 - k*0.09, 2.2 + k*0.12, 2.25, 2.9, C.WHITE, dict(c=C.LINE, w=0.75), r=0.1, shadow='sm')
        x0, y0 = 10.08, 2.56
        s.rect(x0, y0, 2.25, 0.42, C.PETROL, None, r=0.1)
        s.rect(x0, y0 + 0.2, 2.25, 0.22, C.PETROL, None)
        s.text(x0 + 0.1, y0, 2.05, 0.42, ['רשומת אשפוז'], size=11, bold=True, color=C.WHITE, anchor='ctr')
        for k in range(10):
            ww = [1.9, 1.3, 1.7, 1.0, 1.85, 1.5, 1.2, 1.75, 1.4, 1.6][k]
            s.rect(x0 + 2.1 - ww, y0 + 0.6 + k*0.21, ww, 0.07, [C.LINE, 'F2C7C5', C.LINE, C.TEAL_T, C.LINE][k % 5], None, r=0.035)
        s.chip(x0 + 0.12, y0 + 2.75, 0.9, 0.24, 'מעבדה', C.TEAL_T, C.PETROL, size=8)
        s.chip(x0 + 1.08, y0 + 2.75, 0.95, 0.24, 'מכתבים', C.LIME_T, C.GREEN, size=8)
    ag = agent_mark(s, 8.6, 3.75, 1.15)
    l0 = s.line(9.95, 3.75, 9.27, 3.75, C.TEAL, 1.75, tail='triangle')
    outs = [('סיכום ביניים ("עד כה")', 'ל-follow up יומי', 'calendar-check'), ('סיכום ביניים', 'להעתקה לתוך הפניות באשפוז', 'clipboard-copy'), ('סיכום ביניים', 'לבחינת העברות לשיקום', 'heart-handshake')]
    oids = []; ols = []
    for i, (t, sub, ic) in enumerate(outs):
        y = 2.05 + i*1.18
        ols.append(s.path(bez((7.95, 3.75), (7.15, y + 0.5), 0.5), line=dict(c=C.LIME, w=1.75), name='output link'))
        g = s.group(f'output {sub}')
        with g:
            s.rect(4.55, y, 2.6, 1.0, C.WHITE, dict(c=C.TEAL, w=1), r=0.14, shadow='md')
            s.oval(6.78, y + 0.5, 0.48, C.TEAL_T, None); s.icon(ic, 6.78, y + 0.5, 0.26, C.PETROL, 2)
            s.text(4.7, y + 0.06, 1.75, 0.88, [[(t, {'bold': True, 'color': C.PETROL, 'size': 12.5})], [(sub, {'color': C.MUTED, 'size': 11})]], size=12, anchor='ctr', lnspc=100)
        oids.append(g.id)
    scr = s.pic('image122.png', 0.6, 2.05, 3.7, r=0.12, shadow='lg', name='summary screen')
    frame = s.rect(0.6, 2.05, 3.7, 3.7*707/995, None, dict(c=C.LINE, w=0.75), r=0.12, name='screen frame')
    adko = s.group('ADKO')
    with adko:
        s.rect(4.55, 5.85, 8.18, 0.75, dict(grad=[(0, C.PETROL), (100, C.TEAL)], ang=0), None, r=0.2, shadow='sm')
        s.icon('hospital', 12.35, 6.22, 0.32, C.LIME, 2)
        s.text(4.75, 5.85, 7.3, 0.75, [[('בשלבי פיתוח אייג׳נטים ראשונים בפרויקט ', {}), ('ADKO', {'lang': 'en-US', 'color': C.LIME}), (' עם פנימית ח׳ בסורוקה', {})]], size=15, bold=True, color=C.WHITE, anchor='ctr')
    s.anim.click(*[fade(rec.id, 0, 500)], rise(rec.id, 0, 600, 0.03))
    s.anim.click(wipe(l0, 0, 400, 'left'), zoom(ag, 300, 600, 0.6), pulse(ag, 900, 500, 1.05))
    s.anim.click(*[x for i, (l, o) in enumerate(zip(ols, oids)) for x in (wipe(l, i*220, 400, 'left'), slide_in(o, 200 + i*220, 500, 0.3))])
    s.anim.click(zoom(scr, 0, 600, 0.85), fade(frame, 0, 600), rise(adko.id, 500, 600))
    return s

# ---------------------------------------------------------------- 27 PANDA platform
def s27(d, n=27):
    s = d.new()
    ids = head(s, n, 'פלטפורמת פנדה – איתור מידע אמין ומהיר להקלה על הצוותים')
    intro(s, ids)
    bl = s.text(7.7, 1.8, 5.03, 1.6, ['בוט למענה בשפה חופשית על שאלות על מנת לייעל את העבודה ולהקל את העומס.', 'לרבות תשאול פרוטוקולים קליניים על ידי מתמחים.', 'גישה מהמובייל לצוותים הרפואיים.'],
                size=14, color=C.INK, bullet=C.TEAL, spca=6, lnspc=105, name='bullets')
    lap, (sx, sy, sw_, sh_) = s.laptop(0.6, 2.0, 5.6, 'image124.png')
    ph, (px, py, pw, ph_) = s.phone(5.25, 2.65, 1.85, None, name='!!phone')
    chat = s.group('chat (illustration)')
    with chat:
        s.rect(px, py, pw, 0.55, C.PETROL, None, r=0.2); s.rect(px, py + 0.3, pw, 0.25, C.PETROL, None)
        s.pic('image126.png', px + pw - 0.48, py + 0.12, 0.38, 0.38, geom='ellipse', name='Panda avatar')
        s.text(px + 0.1, py + 0.2, pw - 0.62, 0.3, ['פנדה'], size=10, bold=True, color=C.WHITE, anchor='ctr')
    q = s.text(px + 0.32, py + 0.75, pw - 0.42, 0.82, ['שאלה בשפה חופשית על פרוטוקול קליני'], size=9.5, bold=True, color=C.WHITE, fill=C.TEAL, r=0.12, anchor='ctr', ins=(0.08, 0.04, 0.08, 0.04), name='question bubble')
    typing = s.group('typing')
    with typing:
        s.rect(px + 0.1, py + 1.72, 0.62, 0.3, 'E3EFED', None, r=0.15)
        for k in range(3): s.oval(px + 0.25 + k*0.16, py + 1.87, 0.07, C.SOFT, None)
    a = s.text(px + 0.1, py + 1.72, pw - 0.42, 1.2, ['תשובה המבוססת על מידע מקצועי ופרוטוקולים מאושרים'], size=9.5, bold=True, color=C.INK, fill='E3EFED', r=0.12, anchor='ctr', ins=(0.08, 0.04, 0.08, 0.04), name='answer bubble')
    src = s.chip(px + 0.1, py + 3.0, 0.95, 0.24, 'מקורות', C.WHITE, C.TEAL, size=8, line=dict(c=C.TEAL, w=0.75))
    tag = s.chip(px + pw/2 - 0.42, 2.33, 0.84, 0.26, 'המחשה', C.AMBER_T, '8A5A00', size=9, line=dict(c=C.AMBER, w=0.75))
    # audiences
    aud = []
    for i, (t, ic) in enumerate([('פנדה בי"ח שניידר', 'hospital'), ('פנדה לצוותי הקהילה', 'building-2')]):
        x = 10.3 - i*2.6 + 0.0; y = 3.6
        g = s.group(f'audience {t}')
        with g:
            s.rect(x, y, 2.43, 1.3, C.WHITE, dict(c=C.LINE, w=0.75), r=0.18, shadow='md')
            s.pic('image126.png', x + 2.43 - 0.82, y + 0.18, 0.62, 0.62, geom='ellipse', name='Panda')
            s.oval(x + 0.42, y + 0.48, 0.48, C.TEAL_T, None); s.icon(ic, x + 0.42, y + 0.48, 0.26, C.PETROL, 2)
            s.text(x + 0.1, y + 0.82, 2.23, 0.4, [t], size=12.5, bold=True, color=C.PETROL, align='ctr', anchor='ctr')
        aud.append(g.id)
    media = s.group('media mention')
    with media:
        s.rect(7.7, 5.15, 5.03, 1.55, C.WHITE, dict(c=C.LINE, w=0.75), r=0.16, shadow='sm')
        s.pic('image125.png', 7.82, 5.27, h=1.31, r=0.06, name='ynet article')
        s.text(9.95, 5.3, 2.65, 0.3, ['אזכור תקשורתי'], size=10.5, bold=True, color=C.TEAL)
        s.text(9.95, 5.6, 2.65, 1.0, [[('"להיות צודק ב-95% לא מספיק": הבינה המלאכותית שלא נותנת לרופאים לטעות', {})]], size=10.5, bold=True, color=C.INK, lnspc=105)
    s.anim.auto(fade(bl, 200, 600))
    s.anim.click(fade(lap, 0, 600), fade(ph, 300, 500), fade(chat.id, 400, 400), fade(tag, 500, 300))
    s.anim.click(slide_in(q, 0, 450, 0.0, 0.05), fade(typing.id, 600, 200), fadeout(typing.id, 1400, 200), rise(a, 1500, 450, 0.03), fade(src, 1900, 300))
    s.anim.click(*[rise(g, i*200, 500, 0.03) for i, g in enumerate(aud)])
    s.anim.click(rise(media.id, 0, 500, 0.02))
    return s
