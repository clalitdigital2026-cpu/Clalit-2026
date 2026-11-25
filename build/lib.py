# -*- coding: utf-8 -*-
"""Clalit 2026 deck engine: design system + shapes + Open XML animations."""
import os, io, json, subprocess, hashlib, copy, math
from lxml import etree
from pptx import Presentation
from pptx.util import Emu
from pptx.opc.package import Part
from pptx.opc.packuri import PackURI
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
MEDIA = '/tmp/claude-0/x/orig/ppt/media'
CACHE = os.path.join(HERE, 'cache'); os.makedirs(CACHE, exist_ok=True)
EMU = 914400
SW, SH = 13.333, 7.5
NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
NSDECL = ' '.join(f'xmlns:{k}="{v}"' for k, v in NS.items())

# ------------------------------------------------------------------ DESIGN SYSTEM
class C:
    # primary (from reference slides 32-36)
    PETROL = '05434E'; PETROL_D = '04333C'; INK = '0D2A30'; NIGHT = '03181D'; NIGHT2 = '062A31'
    TEAL = '0E7F87'; TURQ = '0E9AA7'; AQUA = '3CC3CF'; GREEN = '1E7A3E'; LIME = '93D301'
    # neutrals
    BG = 'F3F8F7'; WHITE = 'FFFFFF'; MIST = 'E3EFED'; LINE = 'C9DCD9'; MUTED = '4A6469'; SOFT = '7E9A9E'
    TEAL_T = 'DDF0F0'; LIME_T = 'EEF7DA'; GREEN_T = 'E5F3EA'
    # semantic (used only where meaning requires)
    AMBER = 'D99A1E'; AMBER_T = 'FCF2DC'; SLATE_T = 'E9EFF0'; RISK = 'D9534F'
    FONT = 'Open Sans Hebrew'; FONT_XB = 'Open Sans Hebrew Extra Bold'; FONT_L = 'Open Sans Hebrew Light'

# typography scale (pt)
T_TITLE = 30; T_SUB = 16; T_EYEBROW = 11; T_H = 17; T_BODY = 13; T_SMALL = 11
MX = 0.6          # side margin (in)
TITLE_Y = 0.42    # title top
LOGO = dict(x=11.49, y=7.08, w=1.40, h=0.28)   # exactly as reference slide 33

def emu(v): return int(round(v * EMU))
def esc(t): return (t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;'))

def is_heb(t):
    return any('֐' <= ch <= '׿' for ch in t)

# ------------------------------------------------------------------ fills / lines XML
def clr(c, alpha=None, lum=None):
    inner = ''
    if alpha is not None and alpha < 1: inner += f'<a:alpha val="{int(alpha*100000)}"/>'
    return f'<a:srgbClr val="{c}">{inner}</a:srgbClr>'

def fill_xml(fill):
    """fill: None | 'none' | 'RRGGBB' | (color, alpha) | dict(grad=[(pos,color,alpha)], ang=deg) | dict(radial=[...])"""
    if fill is None or fill == 'none': return '<a:noFill/>'
    if isinstance(fill, str): return f'<a:solidFill>{clr(fill)}</a:solidFill>'
    if isinstance(fill, tuple): return f'<a:solidFill>{clr(fill[0], fill[1])}</a:solidFill>'
    if 'grad' in fill or 'radial' in fill:
        stops = fill.get('grad') or fill.get('radial')
        gs = ''.join(f'<a:gs pos="{int(p*1000)}">{clr(c, a if len(s)>2 else None)}</a:gs>'
                     for s in stops for (p, c, a) in [(s[0], s[1], s[2] if len(s) > 2 else None)])
        if 'radial' in fill:
            cx, cy = fill.get('c', (50, 50))
            return (f'<a:gradFill rotWithShape="1"><a:gsLst>{gs}</a:gsLst><a:path path="circle">'
                    f'<a:fillToRect l="{cx*1000}" t="{cy*1000}" r="{(100-cx)*1000}" b="{(100-cy)*1000}"/></a:path></a:gradFill>')
        return f'<a:gradFill rotWithShape="1"><a:gsLst>{gs}</a:gsLst><a:lin ang="{int(fill.get("ang",0)*60000)}" scaled="0"/></a:gradFill>'
    raise ValueError(fill)

def line_xml(line):
    """line: None -> noFill | dict(c=, w=pt, a=alpha, dash='sysDot', head=, tail=, cap=)"""
    if not line: return '<a:ln><a:noFill/></a:ln>'
    if isinstance(line, str): line = dict(c=line)
    w = int(line.get('w', 1) * 12700)
    f = fill_xml(line['c'] if line.get('a') is None else (line['c'], line['a'])) if not isinstance(line.get('c'), dict) else fill_xml(line['c'])
    dash = f'<a:prstDash val="{line["dash"]}"/>' if line.get('dash') else ''
    he = f'<a:headEnd type="{line["head"]}" w="med" len="med"/>' if line.get('head') else ''
    te = f'<a:tailEnd type="{line["tail"]}" w="med" len="med"/>' if line.get('tail') else ''
    cap = f' cap="{line.get("cap","rnd")}"'
    return f'<a:ln w="{w}"{cap}>{f}{dash}<a:round/>{he}{te}</a:ln>'

def effect_xml(shadow=None, glow=None, soft=None):
    if not (shadow or glow or soft): return ''
    s = '<a:effectLst>'
    if glow:
        c, rad, a = glow
        s += f'<a:glow rad="{int(rad*12700)}">{clr(c, a)}</a:glow>'
    if shadow:
        if shadow is True: shadow = 'md'
        presets = {'sm': (6, 2, 0.10), 'md': (18, 6, 0.12), 'lg': (34, 12, 0.16), 'dk': (30, 10, 0.45)}
        blur, dist, a = presets[shadow] if isinstance(shadow, str) else shadow
        s += (f'<a:outerShdw blurRad="{int(blur*12700)}" dist="{int(dist*12700)}" dir="5400000" algn="t" rotWithShape="0">'
              f'{clr("0B3036", a)}</a:outerShdw>')
    if soft: s += f'<a:softEdge rad="{int(soft*12700)}"/>'
    return s + '</a:effectLst>'

# ------------------------------------------------------------------ text XML
def rpr(size, color, bold=False, italic=False, lang=None, spc=None, alpha=None, font=None, u=False):
    font = font or C.FONT
    if font != C.FONT: bold = False   # weight comes from the family itself (Light / Extra Bold)
    lang = lang or 'he-IL'
    b = ' b="1"' if bold else ' b="0"'
    i = ' i="1"' if italic else ''
    sp = f' spc="{int(spc*100)}"' if spc else ''
    uu = ' u="sng"' if u else ''
    return (f'<a:rPr lang="{lang}" altLang="en-US" sz="{int(size*100)}"{b}{i}{uu}{sp} dirty="0">'
            f'<a:solidFill>{clr(color, alpha)}</a:solidFill>'
            f'<a:latin typeface="{font}"/><a:ea typeface="{font}"/><a:cs typeface="{font}"/></a:rPr>')

def para_xml(runs, align='r', rtl=True, lnspc=None, spcb=0, spca=0, size=13, color=C.INK, bold=False, bullet=None, indent=0, lnpts=None, font=None):
    """runs: str or list of (text, opts) / str"""
    if isinstance(runs, str): runs = [(runs, {})]
    ppr = f'<a:pPr algn="{align}" rtl="{1 if rtl else 0}"'
    if bullet: ppr += f' marR="{emu(indent)}" indent="{-emu(indent)}"' if rtl else f' marL="{emu(indent)}" indent="{-emu(indent)}"'
    ppr += '>'
    if lnpts: ppr += f'<a:lnSpc><a:spcPts val="{int(lnpts*100)}"/></a:lnSpc>'
    elif lnspc: ppr += f'<a:lnSpc><a:spcPct val="{int(lnspc*1000)}"/></a:lnSpc>'
    ppr += f'<a:spcBef><a:spcPts val="{int(spcb*100)}"/></a:spcBef><a:spcAft><a:spcPts val="{int(spca*100)}"/></a:spcAft>'
    if bullet:
        bc = bullet if isinstance(bullet, str) and len(bullet) == 6 else C.TEAL
        ppr += f'<a:buClr>{clr(bc)}</a:buClr><a:buSzPct val="100000"/><a:buFont typeface="Arial"/><a:buChar char="•"/>'
    else:
        ppr += '<a:buNone/>'
    ppr += '</a:pPr>'
    out = ''
    for r in runs:
        if isinstance(r, str): r = (r, {})
        t, o = r
        if t == '\n':
            out += f'<a:br>{rpr(o.get("size", size), o.get("color", color), o.get("bold", bold))}</a:br>'
            continue
        lang = o.get('lang') or ('he-IL' if (rtl or is_heb(t)) else 'en-US')
        out += (f'<a:r>{rpr(o.get("size", size), o.get("color", color), o.get("bold", bold), o.get("italic", False), lang, o.get("spc"), o.get("alpha"), font=o.get("font", font), u=o.get("u", False))}'
                f'<a:t xml:space="preserve">{esc(t)}</a:t></a:r>')
    return f'<a:p>{ppr}{out}<a:endParaRPr lang="he-IL" sz="{int(size*100)}" dirty="0"/></a:p>'

# ------------------------------------------------------------------ icons
def icon_files(name, color, sw=1.75, size=512):
    key = f'{name}_{color}_{sw}_{size}'
    svg = os.path.join(CACHE, key + '.svg'); png = os.path.join(CACHE, key + '.png')
    if not os.path.exists(png):
        job = os.path.join(CACHE, 'job.json')
        json.dump([dict(name=name, color=color, sw=sw, size=size, out_svg=svg, out_png=png)], open(job, 'w'))
        subprocess.run(['node', os.path.join(HERE, 'icon.js'), job], cwd=HERE, check=True)
    return svg, png

def prerender_icons(specs):
    todo = []
    for name, color, sw in specs:
        key = f'{name}_{color}_{sw}_512'
        svg = os.path.join(CACHE, key + '.svg'); png = os.path.join(CACHE, key + '.png')
        if not os.path.exists(png): todo.append(dict(name=name, color=color, sw=sw, size=512, out_svg=svg, out_png=png))
    if todo:
        job = os.path.join(CACHE, 'job.json'); json.dump(todo, open(job, 'w'))
        subprocess.run(['node', os.path.join(HERE, 'icon.js'), job], cwd=HERE, check=True)

# ------------------------------------------------------------------ Deck / Slide
class Deck:
    def __init__(self):
        self.prs = Presentation()
        self.prs.slide_width = Emu(emu(SW)); self.prs.slide_height = Emu(emu(SH))
        self.blank = self.prs.slide_layouts[6]
        self._svg_parts = {}
        self.slides = []

    def new(self, dark=False, bg=None, name=''):
        sl = self.prs.slides.add_slide(self.blank)
        s = Slide(self, sl, dark, bg)
        self.slides.append(s)
        return s

    def svg_part(self, path):
        data = open(path, 'rb').read()
        h = hashlib.md5(data).hexdigest()
        if h not in self._svg_parts:
            n = len(self._svg_parts) + 1
            part = Part(PackURI(f'/ppt/media/icon{n}.svg'), 'image/svg+xml', self.prs.part.package, data)
            self._svg_parts[h] = part
        return self._svg_parts[h]

class Slide:
    def __init__(self, deck, sl, dark, bg):
        self.deck, self.sl, self.dark = deck, sl, dark
        self.tree = sl.shapes._spTree
        self.nid = 100
        self.stack = [self.tree]
        self.anim = Anim(self)
        self.transition = 'fade'
        self.names = {}
        self.kinds = {}
        self.set_bg(bg if bg else (dict(radial=[(0, '0A4A55'), (55, C.NIGHT2), (100, C.NIGHT)], c=(70, 30)) if dark else C.BG))

    # ---------- infra
    def _id(self):
        self.nid += 1; return self.nid

    def _add(self, xml, kind='sp'):
        el = etree.fromstring(xml)
        self.stack[-1].append(el)
        sid = int(el.find('.//p:cNvPr', NS).get('id'))
        self.kinds[sid] = kind
        return sid

    def set_bg(self, fill):
        cSld = self.sl._element.find('p:cSld', NS)
        old = cSld.find('p:bg', NS)
        if old is not None: cSld.remove(old)
        bg = etree.fromstring(f'<p:bg {NSDECL}><p:bgPr>{fill_xml(fill)}<a:effectLst/></p:bgPr></p:bg>')
        cSld.insert(0, bg)

    def group(self, name='grp'):
        return _Group(self, name)

    # ---------- primitives
    def shape(self, x, y, w, h, prst='rect', fill=None, line=None, name=None, adj=None, shadow=None, glow=None,
              soft=None, rot=0, flipH=False, flipV=False, text=None, descr=''):
        sid = self._id(); name = name or f'shape {sid}'
        av = ''.join(f'<a:gd name="{k}" fmla="val {v}"/>' for k, v in (adj or {}).items())
        fl = (' rot="%d"' % int(rot*60000) if rot else '') + (' flipH="1"' if flipH else '') + (' flipV="1"' if flipV else '')
        xf = f'<a:xfrm{fl}><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
        tx = text if text else '<p:txBody><a:bodyPr rtlCol="1" anchor="ctr"/><a:lstStyle/><a:p><a:pPr rtl="1"/><a:endParaRPr lang="he-IL" dirty="0"/></a:p></p:txBody>'
        xml = (f'<p:sp {NSDECL}><p:nvSpPr><p:cNvPr id="{sid}" name="{esc(name)}" descr="{esc(descr)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
               f'<p:spPr>{xf}<a:prstGeom prst="{prst}"><a:avLst>{av}</a:avLst></a:prstGeom>{fill_xml(fill)}{line_xml(line)}{effect_xml(shadow, glow, soft)}</p:spPr>'
               f'{tx}</p:sp>')
        return self._add(xml)

    def rect(self, x, y, w, h, fill=None, line=None, r=None, **kw):
        if r:
            a = int(min(50000, r / min(w, h) * 100000))
            return self.shape(x, y, w, h, 'roundRect', fill, line, adj={'adj': a}, **kw)
        return self.shape(x, y, w, h, 'rect', fill, line, **kw)

    def oval(self, cx, cy, d, fill=None, line=None, **kw):
        return self.shape(cx - d/2, cy - d/2, d, d, 'ellipse', fill, line, **kw)

    def arc(self, cx, cy, d, a1, a2, thick, fill, **kw):
        """blockArc from angle a1 to a2 (deg, 0=3 o'clock, clockwise). thick in inches"""
        adj = {'adj1': int(a1 * 60000) % 21600000, 'adj2': int(a2 * 60000) % 21600000, 'adj3': int(thick / d * 100000)}
        return self.shape(cx - d/2, cy - d/2, d, d, 'blockArc', fill, None, adj=adj, **kw)

    def text(self, x, y, w, h, paras, size=T_BODY, color=None, bold=False, align=None, rtl=True, anchor='t',
             lnspc=None, name=None, fill=None, line=None, r=None, ins=(0, 0, 0, 0), spca=0, wrap=True, shadow=None,
             bullet=None, indent=0.18, autofit=False, lnpts=None, vert=None, glow=None, font=None, strong=False):
        if bold and size < 13 and not strong: bold = False   # restrained bold: only headings and key figures
        color = color or (C.WHITE if self.dark else C.INK)
        if align is None: align = 'r' if rtl else 'l'
        if isinstance(paras, str): paras = [paras]
        ps = ''.join(para_xml(p, align, rtl, lnspc, 0, spca, size, color, bold, bullet, indent, lnpts, font) for p in paras)
        l, t, rr, b = ins
        body = (f'<p:txBody><a:bodyPr wrap="{"square" if wrap else "none"}" lIns="{emu(l)}" tIns="{emu(t)}" rIns="{emu(rr)}" bIns="{emu(b)}" '
                f'rtlCol="{1 if rtl else 0}" anchor="{anchor}"{" vert=%s" % chr(34)+vert+chr(34) if vert else ""}>{"<a:normAutofit/>" if autofit else "<a:noAutofit/>"}</a:bodyPr><a:lstStyle/>{ps}</p:txBody>')
        sid = self._id(); name = name or f'text {sid}'
        prst = 'roundRect' if r else 'rect'
        av = f'<a:gd name="adj" fmla="val {int(min(50000, r / min(w, h) * 100000))}"/>' if r else ''
        xml = (f'<p:sp {NSDECL}><p:nvSpPr><p:cNvPr id="{sid}" name="{esc(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
               f'<p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
               f'<a:prstGeom prst="{prst}"><a:avLst>{av}</a:avLst></a:prstGeom>{fill_xml(fill)}{line_xml(line)}{effect_xml(shadow, glow)}</p:spPr>{body}</p:sp>')
        return self._add(xml, 'txt')

    def path(self, pts, fill=None, line=None, closed=False, name=None, curve=False, shadow=None, glow=None, box=None):
        """pts in slide inches. curve=True -> pts are [start, (c1,c2,end), ...] cubic segments"""
        flat = []
        if len(pts) > 1 and isinstance(pts[1][0], tuple): curve = True
        if curve:
            flat.append(pts[0])
            for seg in pts[1:]: flat.extend(seg)
        else: flat = pts
        xs = [p[0] for p in flat]; ys = [p[1] for p in flat]
        x0, y0, x1, y1 = (min(xs), min(ys), max(xs), max(ys)) if not box else box
        w = max(x1 - x0, 0.001); h = max(y1 - y0, 0.001)
        W, H = emu(w), emu(h)
        P = lambda p: f'<a:pt x="{emu(p[0]-x0)}" y="{emu(p[1]-y0)}"/>'
        if curve:
            cmds = f'<a:moveTo>{P(pts[0])}</a:moveTo>' + ''.join(f'<a:cubicBezTo>{P(s[0])}{P(s[1])}{P(s[2])}</a:cubicBezTo>' for s in pts[1:])
        else:
            cmds = f'<a:moveTo>{P(pts[0])}</a:moveTo>' + ''.join(f'<a:lnTo>{P(p)}</a:lnTo>' for p in pts[1:])
        if closed: cmds += '<a:close/>'
        sid = self._id(); name = name or f'path {sid}'
        xml = (f'<p:sp {NSDECL}><p:nvSpPr><p:cNvPr id="{sid}" name="{esc(name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
               f'<p:spPr><a:xfrm><a:off x="{emu(x0)}" y="{emu(y0)}"/><a:ext cx="{W}" cy="{H}"/></a:xfrm>'
               f'<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/>'
               f'<a:pathLst><a:path w="{W}" h="{H}"{"" if closed or fill else " fill=%snone%s" % (chr(34), chr(34))}>{cmds}</a:path></a:pathLst></a:custGeom>'
               f'{fill_xml(fill)}{line_xml(line)}{effect_xml(shadow, glow)}</p:spPr>'
               f'<p:txBody><a:bodyPr rtlCol="1"/><a:lstStyle/><a:p><a:pPr rtl="1"/><a:endParaRPr lang="he-IL" dirty="0"/></a:p></p:txBody></p:sp>')
        return self._add(xml)

    def line(self, x1, y1, x2, y2, c=None, w=1.25, dash=None, head=None, tail=None, a=None, name=None, glow=None):
        c = c or C.TEAL
        x, y = min(x1, x2), min(y1, y2); ww, hh = abs(x2 - x1), abs(y2 - y1)
        fh = ' flipH="1"' if x2 < x1 else ''; fv = ' flipV="1"' if y2 < y1 else ''
        sid = self._id(); name = name or f'line {sid}'
        ln = line_xml(dict(c=c, w=w, dash=dash, head=head, tail=tail, a=a))
        xml = (f'<p:cxnSp {NSDECL}><p:nvCxnSpPr><p:cNvPr id="{sid}" name="{esc(name)}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>'
               f'<p:spPr><a:xfrm{fh}{fv}><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(ww)}" cy="{emu(hh)}"/></a:xfrm>'
               f'<a:prstGeom prst="line"><a:avLst/></a:prstGeom>{ln}{effect_xml(None, glow)}</p:spPr></p:cxnSp>')
        return self._add(xml, 'cxn')

    def pic(self, src, x, y, w=None, h=None, crop=None, name=None, geom='rect', r=None, line=None, shadow=None,
            alpha=None, fit='stretch', descr='', svg=None, gray=False, glow=None, soft=None, bright=None):
        """src: media filename (orig) or path or bytes. crop=(l,t,r,b) fractions. if only w -> keep aspect."""
        if isinstance(src, bytes): blob = src
        else:
            p = src if os.path.isabs(src) else os.path.join(MEDIA, src)
            blob = open(p, 'rb').read()
        im = Image.open(io.BytesIO(blob)); iw, ih = im.size
        cl, ct, cr, cb = crop or (0, 0, 0, 0)
        vw, vh = iw * (1 - cl - cr), ih * (1 - ct - cb)
        if w is not None and h is None: h = w * vh / vw
        if h is not None and w is None: w = h * vw / vh
        if fit == 'cover' and crop is not None and w and h:
            ar_box, ar_im = w / h, vw / vh
            if ar_im > ar_box:
                extra = (1 - ar_box / ar_im) * (1 - cl - cr) / 2; cl += extra; cr += extra
            else:
                extra = (1 - ar_im / ar_box) * (1 - ct - cb) / 2; ct += extra; cb += extra
        if fit == 'cover' and crop is None:
            # crop to fill box keeping aspect
            ar_box, ar_im = w / h, iw / ih
            if ar_im > ar_box:
                d = (1 - ar_box / ar_im) / 2; cl, cr = d, d
            else:
                d = (1 - ar_im / ar_box) / 2; ct, cb = d, d
        part, rid = self.sl.part.get_or_add_image_part(io.BytesIO(blob))
        ext = ''
        if svg:
            sp = self.deck.svg_part(svg)
            srid = self.sl.part.relate_to(sp, RT.IMAGE)
            ext = (f'<a:extLst><a:ext uri="{{96DAC541-7B7A-43D3-8B79-37D633B846F1}}">'
                   f'<asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="{srid}"/></a:ext></a:extLst>')
        eff = ''
        if alpha is not None: eff += f'<a:alphaModFix amt="{int(alpha*100000)}"/>'
        if gray: eff += '<a:grayscl/>'
        if bright is not None: eff += f'<a:lum bright="{int(bright[0]*1000)}" contrast="{int(bright[1]*1000)}"/>'
        src_rect = f'<a:srcRect l="{int(cl*100000)}" t="{int(ct*100000)}" r="{int(cr*100000)}" b="{int(cb*100000)}"/>' if (cl or ct or cr or cb) else ''
        if r: geom = 'roundRect'
        av = f'<a:gd name="adj" fmla="val {int(min(50000, r / min(w, h) * 100000))}"/>' if r else ''
        sid = self._id(); name = name or f'picture {sid}'
        xml = (f'<p:pic {NSDECL}><p:nvPicPr><p:cNvPr id="{sid}" name="{esc(name)}" descr="{esc(descr)}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>'
               f'<p:blipFill><a:blip r:embed="{rid}">{eff}{ext}</a:blip>{src_rect}<a:stretch><a:fillRect/></a:stretch></p:blipFill>'
               f'<p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
               f'<a:prstGeom prst="{geom}"><a:avLst>{av}</a:avLst></a:prstGeom>{line_xml(line) if line else ""}{effect_xml(shadow, glow, soft)}</p:spPr></p:pic>')
        return self._add(xml, 'pic')

    def icon(self, name, cx, cy, size, color=None, sw=1.75, nm=None):
        color = color or (C.WHITE if self.dark else C.PETROL)
        svg, png = icon_files(name, color, sw)
        return self.pic(png, cx - size/2, cy - size/2, size, size, name=nm or f'icon {name}', svg=svg, descr=name)

    # ---------- composites (design system)
    def eyebrow(self, txt, y=TITLE_Y - 0.02, color=None):
        return self.text(MX, y, SW - 2*MX, 0.26, [[(txt, {'spc': 0.4})]], size=T_EYEBROW, bold=True, strong=True,
                         color=color or (C.AQUA if self.dark else C.TEAL), name='!!eyebrow')

    def title(self, txt, sub=None, eyebrow=None, w=None, y=None, size=T_TITLE, align='r', x=None, color=None, subcolor=None):
        y = TITLE_Y + 0.24 if y is None else y
        w = w or SW - 2*MX
        x = x if x is not None else SW - MX - w
        ids = {}
        if eyebrow: ids['eyebrow'] = self.eyebrow(eyebrow, y - 0.26)
        ids['title'] = self.text(x, y, w, 0.62, txt if isinstance(txt, list) else [txt], size=size, bold=True, align=align,
                                 color=color or (C.WHITE if self.dark else C.PETROL), name='!!title', anchor='t', lnspc=95)
        if sub:
            ids['sub'] = self.text(x, y + 0.62, w, 0.4, sub if isinstance(sub, list) else [sub], size=T_SUB, align=align,
                                   color=subcolor or ('B7D3D3' if self.dark else C.MUTED), name='!!subtitle', lnspc=100, font=C.FONT_L)
        return ids

    def logo(self, white=None):
        white = self.dark if white is None else white
        f = os.path.join(CACHE, 'logo_white.png') if white else 'image139.png'
        return self.pic(f, LOGO['x'], LOGO['y'], LOGO['w'], LOGO['h'], name='!!logo', descr='כללית, חטיבת מערכות מידע ודיגיטל')

    def num(self, n):
        return self.text(0.44, 7.08, 0.6, 0.28, [[(str(n), {})]], size=10, bold=True,
                         color=('7FA3A6' if self.dark else C.MUTED), align='l', rtl=False, anchor='ctr', name='!!num')

    def notes(self, txt):
        if not txt: return
        self.sl.notes_slide.notes_text_frame.text = txt

    def chip(self, x, y, w, h, txt, fill, color, size=12, bold=True, line=None, align='ctr', r=None, rtl=True, name=None, ins=0.08, strong=False):
        return self.text(x, y, w, h, [txt] if isinstance(txt, (str,)) else txt, size=size, bold=bold, color=color,
                         fill=fill, line=line, r=r if r is not None else h/2, align=align, anchor='ctr', rtl=rtl,
                         ins=(ins, 0.02, ins, 0.02), name=name, strong=strong)

    def node(self, cx, cy, d, icon, fill=C.PETROL, icolor=C.WHITE, ring=None, shadow='sm', name=None, isz=0.5, sw=1.75, glow=None):
        g = self.group(name or f'node {icon}')
        with g:
            if ring: self.oval(cx, cy, d + ring[1]*2, None, dict(c=ring[0], w=1, a=ring[2] if len(ring) > 2 else None))
            self.oval(cx, cy, d, fill, None, shadow=shadow, glow=glow)
            self.icon(icon, cx, cy, d*isz, icolor, sw)
        return g.id

    def phone(self, x, y, w, src=None, crop=None, name='!!phone', dark=True, screen_fill=None):
        """minimal phone mockup. returns (group id, screen rect)"""
        h = w * 2.05
        g = self.group(name)
        bez = w * 0.035
        with g:
            self.rect(x, y, w, h, '0E1A1D', dict(c='2E4448', w=0.75), r=w*0.16, shadow='lg', name='phone body')
            sx, sy, sw_, sh_ = x + bez, y + bez, w - 2*bez, h - 2*bez
            if src: self.pic(src, sx, sy, sw_, sh_, crop=crop, r=w*0.13, name='phone screen')
            else: self.rect(sx, sy, sw_, sh_, screen_fill or C.WHITE, None, r=w*0.13, name='phone screen')
            self.rect(x + w*0.36, y + bez + w*0.035, w*0.28, w*0.075, '0E1A1D', None, r=w*0.04, name='phone island')
        return g.id, (sx, sy, sw_, sh_)

    def monitor(self, x, y, w, src=None, crop=None, name='!!monitor', aspect=None, stand=True):
        """minimal display mockup: thin bezel + small stand. returns (group id, screen box)"""
        if src is not None and aspect is None:
            p = src if (isinstance(src, str) and os.path.isabs(src)) else os.path.join(MEDIA, src) if isinstance(src, str) else None
            im = Image.open(p if p else io.BytesIO(src)); iw, ih = im.size
            cl, ct, cr, cb = crop or (0, 0, 0, 0)
            aspect = (iw*(1-cl-cr)) / (ih*(1-ct-cb))
        aspect = aspect or 16/10
        bez = w * 0.012
        sw_ = w - 2*bez; sh_ = sw_ / aspect; h = sh_ + 2*bez
        g = self.group(name)
        with g:
            if stand:
                self.shape(x + w/2 - w*0.07, y + h - 0.02, w*0.14, w*0.07, 'trapezoid', dict(grad=[(0, 'C8D3D4'), (100, '9FB0B2')], ang=90), None, adj={'adj': 18000}, name='stand neck', flipV=True)
                self.rect(x + w/2 - w*0.13, y + h + w*0.065, w*0.26, w*0.012, 'A9B8BA', None, r=w*0.006, name='stand base', shadow='sm')
            self.rect(x, y, w, h, '101C1F', dict(c='31474B', w=0.75), r=w*0.014, shadow='lg', name='bezel')
            if src is not None: self.pic(src, x + bez, y + bez, sw_, sh_, crop=crop, name='!!screen')
        return g.id, (x + bez, y + bez, sw_, sh_)

    def laptop(self, x, y, w, src=None, crop=None, name='!!laptop', aspect=None):
        if src is not None and aspect is None:
            im = Image.open(os.path.join(MEDIA, src) if not os.path.isabs(src) else src); iw, ih = im.size
            cl, ct, cr, cb = crop or (0, 0, 0, 0)
            aspect = (iw*(1-cl-cr)) / (ih*(1-ct-cb))
        aspect = aspect or 16/10
        sw_ = w * 0.84; sh_ = sw_ / aspect; bez = w*0.012
        lx = x + (w - sw_ - 2*bez)/2
        g = self.group(name)
        with g:
            self.rect(lx, y, sw_ + 2*bez, sh_ + 2*bez, '101C1F', dict(c='31474B', w=0.75), r=w*0.012, shadow='lg', name='lid')
            if src is not None: self.pic(src, lx + bez, y + bez, sw_, sh_, crop=crop, name='!!screen')
            self.shape(x, y + sh_ + 2*bez, w, w*0.022, 'trapezoid', dict(grad=[(0, 'D7E0E1'), (100, 'A7B6B8')], ang=90), None, adj={'adj': 9000}, flipV=True, name='base')
        return g.id, (lx + bez, y + bez, sw_, sh_)

    # ---------- transitions
    def build_transition(self):
        if self.transition == 'morph':
            return ('<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">'
                    '<mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">'
                    f'<p:transition {NSDECL} xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" spd="slow" p14:dur="1250"><p159:morph option="byObject"/></p:transition></mc:Choice>'
                    f'<mc:Fallback><p:transition {NSDECL} spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>')
        return ('<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">'
                '<mc:Choice xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" Requires="p14">'
                f'<p:transition {NSDECL} xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" spd="slow" p14:dur="900"><p:fade/></p:transition></mc:Choice>'
                f'<mc:Fallback><p:transition {NSDECL} spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>')

    def finalize(self):
        root = self.sl._element
        for tag in ('p:transition', 'p:timing'):
            for el in root.findall(tag, NS): root.remove(el)
        tr = etree.fromstring(self.build_transition())
        # insert after clrMapOvr
        cmo = root.find('p:clrMapOvr', NS)
        idx = list(root).index(cmo) + 1 if cmo is not None else len(root)
        root.insert(idx, tr)
        tm = self.anim.xml()
        if tm is not None:
            root.insert(idx + 1, tm)


class _Group:
    def __init__(self, s, name):
        self.s, self.name = s, name
    def __enter__(self):
        sid = self.s._id(); self.id = sid
        xml = (f'<p:grpSp {NSDECL}><p:nvGrpSpPr><p:cNvPr id="{sid}" name="{esc(self.name)}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
               f'<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:grpSp>')
        self.el = etree.fromstring(xml)
        self.s.stack[-1].append(self.el)
        self.s.stack.append(self.el)
        self.s.kinds[sid] = 'grp'
        return self
    def __exit__(self, *a):
        self.s.stack.pop()
        # compute bbox of children
        xs = []
        for off in self.el.iter('{%s}off' % NS['a']):
            par = off.getparent()
            if par.getparent().getparent() is self.el and par.getparent().tag.endswith('grpSpPr'): continue
            ext = par.find('a:ext', NS)
            if ext is None: continue
            x, y = int(off.get('x')), int(off.get('y')); cx, cy = int(ext.get('cx')), int(ext.get('cy'))
            if par.getparent().tag.endswith('grpSpPr'):
                pass
            xs.append((x, y, x + cx, y + cy))
        if xs:
            x0 = min(a[0] for a in xs); y0 = min(a[1] for a in xs); x1 = max(a[2] for a in xs); y1 = max(a[3] for a in xs)
            xf = self.el.find('p:grpSpPr/a:xfrm', NS)
            xf.find('a:off', NS).set('x', str(x0)); xf.find('a:off', NS).set('y', str(y0))
            xf.find('a:ext', NS).set('cx', str(x1 - x0)); xf.find('a:ext', NS).set('cy', str(y1 - y0))
            xf.find('a:chOff', NS).set('x', str(x0)); xf.find('a:chOff', NS).set('y', str(y0))
            xf.find('a:chExt', NS).set('cx', str(x1 - x0)); xf.find('a:chExt', NS).set('cy', str(y1 - y0))
        self.bbox = [v / EMU for v in (x0, y0, x1, y1)] if xs else None


# ================================================================== ANIMATION ENGINE
class Fx:
    def __init__(self, kind, sid, delay=0, dur=500, **kw):
        sid = getattr(sid, 'id', sid)
        self.kind, self.sid, self.delay, self.dur, self.kw = kind, sid, int(delay), int(dur), kw

# convenience constructors
def fade(sid, delay=0, dur=500): return Fx('fade', sid, delay, dur)
def rise(sid, delay=0, dur=600, dy=0.035): return Fx('rise', sid, delay, dur, dy=dy)
def slide_in(sid, delay=0, dur=650, dx=0.03, dy=0.0): return Fx('slidein', sid, delay, dur, dx=dx, dy=dy)
def zoom(sid, delay=0, dur=600, s=0.85): return Fx('zoom', sid, delay, dur, s=s)
def wipe(sid, delay=0, dur=600, d='right'): return Fx('wipe', sid, delay, dur, d=d)
def wheel(sid, delay=0, dur=1200): return Fx('wheel', sid, delay, dur)
def appear(sid, delay=0): return Fx('appear', sid, delay, 1)
def fadeout(sid, delay=0, dur=400): return Fx('fadeout', sid, delay, dur)
def dim(sid, delay=0, dur=400, to=0.3): return Fx('dim', sid, delay, dur, to=to)
def undim(sid, delay=0, dur=400): return Fx('dim', sid, delay, dur, to=1.0)
def pulse(sid, delay=0, dur=700, s=1.06, repeat=None): return Fx('pulse', sid, delay, dur, s=s, repeat=repeat)
def flow(sid, path, delay=0, dur=2000, repeat='indefinite', fade=True): return Fx('flow', sid, delay, dur, path=path, repeat=repeat, fadeedge=fade)
def move(sid, path, delay=0, dur=800, decel=True): return Fx('move', sid, delay, dur, path=path, decel=decel)
def grow(sid, delay=0, dur=20000, s=1.06): return Fx('grow', sid, delay, dur, s=s)
def flash_color(sid, color, delay=0, dur=60): return Fx('flash', sid, delay, dur, color=color)
def spin(sid, delay=0, dur=20000, deg=360): return Fx('spin', sid, delay, dur, deg=deg)
def play(sid, delay=0, dur=10034): return Fx('play', sid, delay, dur)
def wipeout(sid, delay=0, dur=600, d='down'): return Fx('wipeout', sid, delay, dur, d=d)

ENTR = {'fade': (10, 0), 'rise': (42, 0), 'slidein': (47, 0), 'zoom': (53, 16), 'wipe': (22, 8), 'wheel': (21, 1), 'appear': (1, 0)}
WIPE_SUB = {'left': 8, 'right': 2, 'up': 1, 'down': 4}
WIPE_DIR = {'left': 'left', 'right': 'right', 'up': 'up', 'down': 'down'}

class Anim:
    """Steps: list of (trigger, [Fx]). trigger 'auto' (after slide start / after previous) or 'click'."""
    def __init__(self, s):
        self.s = s; self.steps = []
    def auto(self, *fx): self.steps.append(('auto', [f for f in _flat(fx)])); return self
    def click(self, *fx): self.steps.append(('click', [f for f in _flat(fx)])); return self
    def after(self, *fx): self.steps.append(('after', [f for f in _flat(fx)])); return self

    def xml(self):
        if not self.steps: return None
        self.cid = 2
        self.grp = {}
        self.bld = []
        # everything runs automatically from slide start: steps are chained one after another
        # keep each slide's build within ~8 seconds: compress timing proportionally when longer
        total = sum(self._step_len(f) for _, f in self.steps) + self.gap * (len(self.steps) - 1)
        k = min(1.0, 8000 / total) if total else 1.0
        if k < 1.0:
            for _, fxs in self.steps:
                for f in fxs:
                    rep = f.kw.get('repeat')
                    if f.kind in ('spin',) or rep == 'indefinite' or (f.kind == 'grow' and f.dur > 5000):
                        f.delay = int(f.delay * k); continue
                    f.delay = int(f.delay * k); f.dur = max(1, int(f.dur * k))
            self.gap = int(self.gap * k)
        t = 0; inner = ''
        for i, (trig, fxs) in enumerate(self.steps):
            inner += self._step_at(fxs, t)
            t += self._step_len(fxs) + (self.gap if i < len(self.steps) - 1 else 0)
        a = self.n()
        out = [f'<p:par><p:cTn id="{a}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst>'
               f'<p:childTnLst>{inner}</p:childTnLst></p:cTn></p:par>']
        bld = ''.join(f'<p:bldP spid="{sid}" grpId="{g}" animBg="1"/>' for sid, g in self.bld)
        xml = (f'<p:timing {NSDECL}><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
               f'<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>{"".join(out)}</p:childTnLst></p:cTn>'
               f'<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
               f'<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
               f'{self.extra_media()}'
               f'</p:childTnLst></p:cTn></p:par></p:tnLst>'
               f'{"<p:bldLst>"+bld+"</p:bldLst>" if bld else ""}</p:timing>')
        return etree.fromstring(xml)

    video = None
    def extra_media(self):
        if not self.video: return ''
        v = self.video
        return (f'<p:video><p:cMediaNode vol="80000"><p:cTn id="{self.n()}" repeatCount="indefinite" fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn>{self._tgt(v)}</p:cMediaNode></p:video>'
                f'<p:seq concurrent="1" nextAc="seek"><p:cTn id="{self.n()}" restart="whenNotActive" fill="hold" evtFilter="cancelBubble" nodeType="interactiveSeq">'
                f'<p:stCondLst><p:cond evt="onClick" delay="0">{self._tgt(v)}</p:cond></p:stCondLst><p:endSync evt="end" delay="0"><p:rtn val="all"/></p:endSync><p:childTnLst>'
                f'<p:par><p:cTn id="{self.n()}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="{self.n()}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
                f'<p:par><p:cTn id="{self.n()}" presetID="2" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="clickEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
                f'<p:cmd type="call" cmd="togglePause"><p:cBhvr><p:cTn id="{self.n()}" dur="1" fill="hold"/>{self._tgt(v)}</p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par>'
                f'</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn>'
                f'<p:nextCondLst><p:cond evt="onClick" delay="0">{self._tgt(v)}</p:cond></p:nextCondLst></p:seq>')

    def n(self):
        self.cid += 1; return self.cid

    gap = 250
    def _step_len(self, fxs):
        end = 0
        for f in fxs:
            rep = f.kw.get('repeat')
            if f.kind in ('spin',) or rep == 'indefinite' or (f.kind == 'grow' and f.dur > 5000): 
                end = max(end, f.delay + 300); continue
            d = f.dur * (rep if isinstance(rep, (int, float)) and rep else 1)
            if f.kind == 'pulse': d = f.dur * 2 * (rep if isinstance(rep, (int, float)) and rep else 1)
            end = max(end, f.delay + d)
        return min(end, 4000)

    def _step_at(self, fxs, t):
        b = self.n()
        inner = ''
        for k, f in enumerate(fxs):
            inner += self._fx(f, 'afterEffect' if k == 0 else 'withEffect')
        return (f'<p:par><p:cTn id="{b}" fill="hold"><p:stCondLst><p:cond delay="{int(t)}"/></p:stCondLst><p:childTnLst>{inner}</p:childTnLst></p:cTn></p:par>')

    def _step(self, trig, fxs, first):
        a = self.n()
        if trig == 'click':
            cond = '<p:cond delay="indefinite"/>'
            ntype = 'clickEffect'
        else:
            cond = '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' if first else '<p:cond delay="indefinite"/>'
            ntype = 'afterEffect'
        b = self.n()
        inner = ''
        for k, f in enumerate(fxs):
            nt = ntype if k == 0 else 'withEffect'
            inner += self._fx(f, nt)
        return (f'<p:par><p:cTn id="{a}" fill="hold"><p:stCondLst>{cond}</p:stCondLst><p:childTnLst>'
                f'<p:par><p:cTn id="{b}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{inner}</p:childTnLst></p:cTn></p:par>'
                f'</p:childTnLst></p:cTn></p:par>')

    def _tgt(self, sid): return f'<p:tgtEl><p:spTgt spid="{sid}"/></p:tgtEl>'

    def _set_vis(self, sid, val='visible', delay=0):
        return (f'<p:set><p:cBhvr><p:cTn id="{self.n()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="{delay}"/></p:stCondLst></p:cTn>{self._tgt(sid)}'
                f'<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="{val}"/></p:to></p:set>')

    def _anim(self, sid, attr, tavs, dur, extra='', delay=0, accel=0, decel=0):
        def _v(v):
            try: float(v); return f'<p:fltVal val="{v}"/>'
            except ValueError: return f'<p:strVal val="{v}"/>'
        tv = ''.join(f'<p:tav tm="{int(t*1000)}"><p:val>{_v(v)}</p:val></p:tav>' for t, v, fm in tavs)
        ad = (f' accel="{accel}"' if accel else '') + (f' decel="{decel}"' if decel else '')
        return (f'<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="{self.n()}" dur="{dur}" fill="hold"{ad}{extra}>'
                f'{"<p:stCondLst><p:cond delay=%s/></p:stCondLst>" % (chr(34)+str(delay)+chr(34)) if delay else ""}</p:cTn>{self._tgt(sid)}'
                f'<p:attrNameLst><p:attrName>{attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst>{tv}</p:tavLst></p:anim>')

    def _effect(self, sid, trans, filt, dur, delay=0):
        return (f'<p:animEffect transition="{trans}" filter="{filt}"><p:cBhvr><p:cTn id="{self.n()}" dur="{dur}"'
                f'{"><p:stCondLst><p:cond delay=%s/></p:stCondLst></p:cTn>" % (chr(34)+str(delay)+chr(34)) if delay else "/>"}{self._tgt(sid)}</p:cBhvr></p:animEffect>')

    def _wrap(self, f, nt, pid, pclass, sub, body, extra_ctn=''):
        sid = f.sid
        g = self.grp.get(sid, -1) + 1; self.grp[sid] = g
        kind = self.s.kinds.get(sid, 'sp')
        if kind in ('sp', 'txt'): self.bld.append((sid, g))
        return (f'<p:par><p:cTn id="{self.n()}" presetID="{pid}" presetClass="{pclass}" presetSubtype="{sub}" fill="hold" grpId="{g}" nodeType="{nt}"{extra_ctn}>'
                f'<p:stCondLst><p:cond delay="{f.delay}"/></p:stCondLst><p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>')

    def _fx(self, f, nt):
        k, sid, d = f.kind, f.sid, f.dur
        if k in ENTR:
            pid, sub = ENTR[k]
            body = self._set_vis(sid)
            if k == 'fade':
                body += self._effect(sid, 'in', 'fade', d)
            elif k == 'appear':
                pass
            elif k == 'rise':
                dy = f.kw['dy']
                body += self._effect(sid, 'in', 'fade', d)
                body += self._anim(sid, 'ppt_y', [(0, f'#ppt_y+{dy}', None), (100, '#ppt_y', None)], d, decel=100000)
            elif k == 'slidein':
                dx, dy = f.kw['dx'], f.kw['dy']
                body += self._effect(sid, 'in', 'fade', d)
                if dx: body += self._anim(sid, 'ppt_x', [(0, f'#ppt_x+{dx}', None), (100, '#ppt_x', None)], d, decel=100000)
                if dy: body += self._anim(sid, 'ppt_y', [(0, f'#ppt_y+{dy}', None), (100, '#ppt_y', None)], d, decel=100000)
            elif k == 'zoom':
                s = f.kw['s']
                body += self._effect(sid, 'in', 'fade', d)
                body += self._anim(sid, 'ppt_w', [(0, f'#ppt_w*{s}', None), (100, '#ppt_w', None)], d, decel=100000)
                body += self._anim(sid, 'ppt_h', [(0, f'#ppt_h*{s}', None), (100, '#ppt_h', None)], d, decel=100000)
            elif k == 'wipe':
                dd = f.kw['d']; sub = WIPE_SUB[dd]
                body += self._effect(sid, 'in', f'wipe({WIPE_DIR[dd]})', d)
            elif k == 'wheel':
                body += self._effect(sid, 'in', 'wheel(1)', d)
            return self._wrap(f, nt, pid, 'entr', sub, body)
        if k == 'play':
            body = (f'<p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="{self.n()}" dur="{d}" fill="hold"/>{self._tgt(sid)}</p:cBhvr></p:cmd>')
            return self._wrap(f, nt, 1, 'mediacall', 0, body)
        if k == 'wipeout':
            body = self._effect(sid, 'out', f'wipe({WIPE_DIR[f.kw["d"]]})', d) + self._set_vis(sid, 'hidden', max(d - 1, 0))
            return self._wrap(f, nt, 22, 'exit', WIPE_SUB[f.kw['d']], body)
        if k == 'fadeout':
            body = self._effect(sid, 'out', 'fade', d) + self._set_vis(sid, 'hidden', max(d - 1, 0))
            return self._wrap(f, nt, 10, 'exit', 0, body)
        if k == 'dim':
            to = f.kw['to']
            body = (f'<p:animEffect transition="out" filter="fade" prLst="opacity: {to}"><p:cBhvr><p:cTn id="{self.n()}" dur="{d}" fill="hold"/>{self._tgt(sid)}</p:cBhvr></p:animEffect>') if False else ''
            body = (f'<p:set><p:cBhvr><p:cTn id="{self.n()}" dur="{d}" fill="hold"/>{self._tgt(sid)}<p:attrNameLst><p:attrName>style.opacity</p:attrName></p:attrNameLst></p:cBhvr>'
                    f'<p:to><p:strVal val="{to}"/></p:to></p:set>')
            return self._wrap(f, nt, 9, 'emph', 0, body)
        if k == 'pulse':
            s = int(f.kw['s'] * 100000)
            rep = f.kw.get('repeat')
            body = (f'<p:animScale><p:cBhvr><p:cTn id="{self.n()}" dur="{d}" autoRev="1" fill="hold"{" repeatCount=%s" % (chr(34)+(str(rep) if rep == "indefinite" else str(int(rep*1000)))+chr(34)) if rep else ""} accel="50000" decel="50000"/>{self._tgt(sid)}</p:cBhvr>'
                    f'<p:by x="{s}" y="{s}"/></p:animScale>')
            return self._wrap(f, nt, 6, 'emph', 0, body)
        if k == 'grow':
            s = int(f.kw['s'] * 100000)
            body = (f'<p:animScale><p:cBhvr><p:cTn id="{self.n()}" dur="{d}" fill="hold" decel="100000"/>{self._tgt(sid)}</p:cBhvr>'
                    f'<p:by x="{s}" y="{s}"/></p:animScale>')
            return self._wrap(f, nt, 6, 'emph', 0, body)
        if k == 'spin':
            body = (f'<p:animRot by="{int(f.kw["deg"]*60000)}"><p:cBhvr><p:cTn id="{self.n()}" dur="{d}" fill="hold"/>{self._tgt(sid)}'
                    f'<p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst></p:cBhvr></p:animRot>')
            return self._wrap(f, nt, 8, 'emph', 0, body, extra_ctn=' repeatCount="indefinite"')
        if k == 'flash':
            # make text visible (color) for dur ms then back to transparent: implemented via set on style.color
            body = (f'<p:set><p:cBhvr><p:cTn id="{self.n()}" dur="{d}"/>{self._tgt(sid)}<p:attrNameLst><p:attrName>style.color</p:attrName></p:attrNameLst></p:cBhvr>'
                    f'<p:to><p:clrVal>{clr(f.kw["color"])}</p:clrVal></p:to></p:set>')
            return self._wrap(f, nt, 19, 'emph', 0, body)
        if k in ('flow', 'move'):
            path = f.kw['path']
            if k == 'flow':
                rep = f.kw['repeat']
                body = self._set_vis(sid)
                motion = (f'<p:animMotion origin="layout" path="{path}" pathEditMode="relative" ptsTypes="">'
                          f'<p:cBhvr><p:cTn id="{self.n()}" dur="{d}" fill="hold"/>{self._tgt(sid)}<p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr></p:animMotion>')
                op = ''
                if f.kw.get('fadeedge'):
                    op = self._anim(sid, 'style.opacity', [(0, '0', None), (15, '1', None), (80, '1', None), (100, '0', None)], d)
                rc = ' repeatCount="indefinite"' if rep == 'indefinite' else (f' repeatCount="{int(rep*1000)}"' if rep else '')
                return self._wrap(f, nt, 0, 'path', 0, body + motion + op, extra_ctn=rc)
            else:
                body = (f'<p:animMotion origin="layout" path="{path}" pathEditMode="relative" ptsTypes="">'
                        f'<p:cBhvr><p:cTn id="{self.n()}" dur="{d}" fill="hold"{" decel=%s100000%s" % (chr(34), chr(34)) if f.kw.get("decel") else ""}/>{self._tgt(sid)}'
                        f'<p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr></p:animMotion>')
                return self._wrap(f, nt, 0, 'path', 0, body)
        raise ValueError(k)

def _strip_par(inner, a):
    return inner

def _flat(fx):
    out = []
    for f in fx:
        if isinstance(f, (list, tuple)): out.extend(_flat(f))
        elif f is not None: out.append(f)
    return out

def mpath(x1, y1, x2, y2):
    """relative motion path string from slide-inch coords delta (dx,dy) normalized to slide size"""
    return f'M 0 0 L {(x2-x1)/SW:.5f} {(y2-y1)/SH:.5f} E'

def mpath_pts(pts):
    x0, y0 = pts[0]
    return 'M 0 0 ' + ' '.join(f'L {(x-x0)/SW:.5f} {(y-y0)/SH:.5f}' for x, y in pts[1:]) + ' E'

def mpath_curve(p0, segs):
    """segs: list of (c1,c2,end) cubic, in slide inches"""
    x0, y0 = p0
    f = lambda p: f'{(p[0]-x0)/SW:.5f} {(p[1]-y0)/SH:.5f}'
    return 'M 0 0 ' + ' '.join(f'C {f(c1)} {f(c2)} {f(e)}' for c1, c2, e in segs) + ' E'

def bez(p0, p1, bend=0.5, mode='h'):
    """smooth cubic between two points; mode h: horizontal tangents, v: vertical tangents"""
    (x0, y0), (x1, y1) = p0, p1
    if mode == 'h':
        dx = (x1 - x0) * bend
        return [p0, ((x0 + dx, y0), (x1 - dx, y1), p1)]
    dy = (y1 - y0) * bend
    return [p0, ((x0, y0 + dy), (x1, y1 - dy), p1)]

def bez_point(seg, t):
    p0, (c1, c2, p3) = seg[0], seg[1]
    u = 1 - t
    return (u**3*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t**3*p3[0], u**3*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t**3*p3[1])
