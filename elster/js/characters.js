/* חביתת אלסטר – illustrated characters (pure vector canvas art) + pose/animation state machine */
(function () {
  'use strict';
  const U = ELSTER.U;
  const OUT = '#2a1b26';

  // ------------------------------------------------------------------ definitions
  const DEFS = {
    roni: {
      id: 'roni', name: 'רוני אלסטר', tagline: 'החיוך הכי מסוכן בזירה',
      skin: '#efc2a2', skinShade: '#d69a7b', blush: 0.32,
      hair: '#1b1311', hairHi: '#4a362c', hairMid: '#2c201b',
      iris: '#4a2c1b', brow: '#1d1411', browW: 2.6, lips: '#c4646c',
      top: '#1c1c22', topShade: '#0f0f13', topHi: '#34343e',
      pants: '#2a3b57', shoes: '#f4f1ea', shoeTrim: '#c9c3b6',
      sleeve: 'short', mouth: 'grin', lashes: true, freckles: true,
      faceRx: 20, faceRy: 23, chin: 0.42, accent: '#ff5d8f',
    },
    shiri: {
      id: 'shiri', name: 'שירי אלסטר', tagline: 'קליעה מתוקה כמו קרמל',
      skin: '#f8d6c2', skinShade: '#e5ae95', blush: 0.38,
      hair: '#8d5a33', hairHi: '#cf9660', hairMid: '#6c4124',
      iris: '#6e5a34', brow: '#6b4529', browW: 2.1, lips: '#d9787a',
      top: '#f2e8d7', topShade: '#d8cab2', topHi: '#fffaf0',
      pants: '#6f8bb5', shoes: '#ffffff', shoeTrim: '#e05b5b',
      sleeve: 'long', mouth: 'grin', lashes: true, liner: true,
      faceRx: 20.5, faceRy: 22.5, chin: 0.45, accent: '#ffb347',
    },
    adi: {
      id: 'adi', name: 'עדי אלסטר', tagline: 'קטנה אבל קולעת בול',
      skin: '#efc19f', skinShade: '#d39a78', blush: 0.3,
      hair: '#3a2419', hairHi: '#6e4a34', hairMid: '#2a1a12',
      iris: '#3b2314', brow: '#2e1d14', browW: 2.7, lips: '#cf7a78',
      top: '#e2332f', topShade: '#b4231f', topHi: '#ff5a4e',
      pants: '#3f5f8f', shoes: '#ff8fb3', shoeTrim: '#ffffff',
      sleeve: 'short', mouth: 'smile', lashes: true, mole: true,
      faceRx: 20, faceRy: 21.5, chin: 0.5, accent: '#e2332f', scale: 0.84,
    },
    yair: {
      id: 'yair', name: 'יאיר אלסטר', tagline: 'מבט רציני, יד יציבה',
      skin: '#e8b694', skinShade: '#c88f6d', blush: 0.12,
      hair: '#2b211c', hairHi: '#55463c', hairMid: '#3a2d26', gray: '#55463c',
      iris: '#3b2416', brow: '#221813', browW: 3.6, lips: '#b8796b',
      top: '#1d1e23', topShade: '#111216', topHi: '#353741',
      pants: '#40506a', shoes: '#2e2e33', shoeTrim: '#d8d8d8',
      sleeve: 'short', mouth: 'smirk', armW: 1.4, muscular: true, male: true,
      faceRx: 21, faceRy: 23, chin: 0.5, accent: '#4fc3f7',
    },
  };
  DEFS.ima = {
    id: 'ima', name: 'אמא', tagline: 'באה לעזור עם גושגידז׳ה',
    skin: '#e8b48f', skinShade: '#c98f6c', blush: 0.25,
    hair: '#1d1512', hairHi: '#4a3a33', hairMid: '#2a201c', gray: '#a8a29c',
    iris: '#3a2416', brow: '#1d1512', browW: 2.5, lips: '#c06a6a',
    top: '#1c1c22', topShade: '#0f0f13', topHi: '#34343e',
    pants: '#2a2f3a', shoes: '#f4f1ea', shoeTrim: '#e63946',
    sleeve: 'long', mouth: 'grin', lashes: true, noSling: true, bow: '#e63946',
    faceRx: 20, faceRy: 23, chin: 0.45, accent: '#e63946',
  };
  DEFS.gooli = {
    id: 'gooli', name: 'אבא גולי', tagline: 'הבוס של הרוקנרול',
    skin: '#d9a27c', skinShade: '#b9805c', blush: 0.1,
    hair: '#26211e', hairHi: '#5e5853', hairMid: '#36302c', gray: '#bdb7b0',
    iris: '#2e1d14', brow: '#1d1612', browW: 3.8, lips: '#b8796b',
    top: '#1c1c22', topShade: '#0e0e12', topHi: '#3a3a46', shirt: '#c1121f', print: '#ffd166',
    pants: '#22252e', shoes: '#141418', shoeTrim: '#8a8f99',
    sleeve: 'long', mouth: 'grin', male: true, bags: true, stubble: true, glasses: '#1f3fd1',
    rocker: true, noSling: true, studs: '#d8dde3',
    faceRx: 21, faceRy: 24, chin: 0.55, accent: '#ff5d8f', scale: 3,
  };
  ELSTER.CHAR_DEFS = DEFS;
  ELSTER.CHAR_IDS = ['roni', 'shiri', 'yair', 'adi'];

  // geometry (local space, feet at 0,0, facing +x)
  const HEAD_Y = -84;
  const AX = 31, AY = -57;            // slingshot rest anchor (pouch)
  const SH_F = [9, -55], SH_B = [-5, -55];
  const SH_F_M = [14, -55], SH_B_M = [-12, -55];
  const ARM_L = 18.5;
  const BAND_REST = 0;

  // ------------------------------------------------------------------ drawing helpers
  function outlineFill(ctx, fill, lw) {
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = lw || 2.4;
    ctx.strokeStyle = OUT;
    ctx.stroke();
  }

  function drawEgg(ctx, x, y, rot, s) {
    s = s || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, -12.5);
    ctx.bezierCurveTo(7.5, -12.5, 10.5, -1, 10, 3.5);
    ctx.bezierCurveTo(9.5, 9.5, 5, 12, 0, 12);
    ctx.bezierCurveTo(-5, 12, -9.5, 9.5, -10, 3.5);
    ctx.bezierCurveTo(-10.5, -1, -7.5, -12.5, 0, -12.5);
    ctx.closePath();
    const g = ctx.createRadialGradient(-3.5, -5, 1, 0, 0, 14);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#fbf3e3');
    g.addColorStop(1, '#dccaa8');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    // speckles
    ctx.fillStyle = 'rgba(170,140,100,0.45)';
    [[3, 2], [-4, 5], [5, -4], [-2, -7], [1, 8]].forEach(([a, b]) => {
      ctx.beginPath();
      ctx.arc(a, b, 0.8, 0, U.TAU);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(-4, -5.5, 2.2, 3.6, -0.4, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  }
  ELSTER.drawEgg = drawEgg;

  /** egg splat decal (yolk + white + drips) */
  function drawSplat(ctx, x, y, r, rot, seed, alpha) {
    const rnd = U.rng(seed);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.globalAlpha *= alpha == null ? 1 : alpha;
    // albumen
    const pts = U.blobPoints(0, 0, r * 1.45, 11, 0.32, rnd);
    U.blobPath(ctx, pts);
    ctx.fillStyle = 'rgba(255,252,240,0.88)';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(200,190,160,0.6)';
    ctx.stroke();
    // droplets
    for (let i = 0; i < 5; i++) {
      const a = rnd() * U.TAU, d = r * (1.6 + rnd() * 0.9);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * (0.12 + rnd() * 0.16), 0, U.TAU);
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,252,240,0.85)' : '#ffc21a';
      ctx.fill();
    }
    // yolk
    const yx = (rnd() - 0.5) * r * 0.5, yy = (rnd() - 0.5) * r * 0.5;
    const yp = U.blobPoints(yx, yy, r * 0.62, 8, 0.12, rnd);
    U.blobPath(ctx, yp);
    const g = ctx.createRadialGradient(yx - r * 0.2, yy - r * 0.25, 0, yx, yy, r * 0.7);
    g.addColorStop(0, '#ffe36b');
    g.addColorStop(0.6, '#ffb703');
    g.addColorStop(1, '#f08a00');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = '#b86200';
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(yx - r * 0.2, yy - r * 0.22, r * 0.16, r * 0.1, -0.5, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  }
  ELSTER.drawSplat = drawSplat;

  function limb(ctx, x1, y1, x2, y2, w, col) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineCap = 'round';
    ctx.lineWidth = w + 3.6;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    ctx.lineWidth = w;
    ctx.strokeStyle = col;
    ctx.stroke();
  }

  function solveElbow(sx, sy, tx, ty, L, preferDown) {
    const dx = tx - sx, dy = ty - sy;
    const d = Math.max(0.001, Math.hypot(dx, dy));
    const mx = sx + dx / 2, my = sy + dy / 2;
    if (d >= 2 * L) return [mx, my];
    const h = Math.sqrt(L * L - (d / 2) * (d / 2));
    const nx = -dy / d, ny = dx / d;
    const e1 = [mx + nx * h, my + ny * h], e2 = [mx - nx * h, my - ny * h];
    if (preferDown) return e1[1] > e2[1] ? e1 : e2;
    return Math.abs(e1[0]) > Math.abs(e2[0]) ? e1 : e2;
  }

  function drawArm(ctx, d, sh, target, preferDown) {
    const [sx, sy] = sh, [tx, ty] = target;
    const [ex, ey] = solveElbow(sx, sy, tx, ty, ARM_L, preferDown);
    const sleeve = d.top;
    const fore = d.sleeve === 'long' ? d.top : d.skin;
    // upper arm
    const aw = d.armW || 1;
    if (d.muscular) {
      // strong bare arms with a tight short sleeve
      limb(ctx, sx, sy, ex, ey, 8.5 * aw, d.skin);
      limb(ctx, ex, ey, tx, ty, 7.2 * aw, d.skin);
      const k = 0.38;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (ex - sx) * k, sy + (ey - sy) * k);
      ctx.lineCap = 'round';
      ctx.lineWidth = 8.5 * aw + 4.6;
      ctx.strokeStyle = OUT;
      ctx.stroke();
      ctx.lineWidth = 8.5 * aw + 1;
      ctx.strokeStyle = sleeve;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tx, ty, 5.6, 0, U.TAU);
      outlineFill(ctx, d.skin, 2);
      return;
    }
    limb(ctx, sx, sy, ex, ey, 8.5 * aw, sleeve);
    // forearm
    limb(ctx, ex, ey, tx, ty, 7.2 * aw, fore);
    if (d.sleeve === 'short') {
      // sleeve cuff over elbow-ish
      ctx.beginPath();
      const k = 0.55;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (ex - sx) * k, sy + (ey - sy) * k);
      ctx.lineWidth = 10;
      ctx.strokeStyle = sleeve;
      ctx.stroke();
    } else {
      // ribbed cuff
      const cx = ex + (tx - ex) * 0.78, cy = ey + (ty - ey) * 0.78;
      limb(ctx, cx, cy, ex + (tx - ex) * 0.9, ey + (ty - ey) * 0.9, 7.8, d.topShade);
    }
    // hand
    ctx.beginPath();
    ctx.arc(tx, ty, 4.8, 0, U.TAU);
    outlineFill(ctx, d.skin, 2);
  }

  // ------------------------------------------------------------------ slingshot
  function slingGeom(A, dir) {
    // u = "up" of the fork, perpendicular to dir, biased upward
    let ux = dir[1], uy = -dir[0];
    const G = [A[0] - ux * 26, A[1] - uy * 26];
    const J = [A[0] - ux * 10, A[1] - uy * 10];
    const T1 = [A[0] + ux * 3 + dir[0] * 8, A[1] + uy * 3 + dir[1] * 8];
    const T2 = [A[0] + ux * 3 - dir[0] * 8, A[1] + uy * 3 - dir[1] * 8];
    return { G, J, T1, T2, u: [ux, uy] };
  }

  function drawBand(ctx, a, b, stretch) {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineCap = 'round';
    const w = U.lerp(4.2, 2.2, U.clamp(stretch, 0, 1));
    ctx.lineWidth = w + 2.4;
    ctx.strokeStyle = '#3b0d0d';
    ctx.stroke();
    ctx.lineWidth = w;
    ctx.strokeStyle = '#c0392b';
    ctx.stroke();
  }

  function drawFork(ctx, g) {
    const { G, J, T1, T2 } = g;
    const wood = '#9a5b2c', woodHi = '#c98a4f';
    const seg = (a, b, w, c) => {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineCap = 'round';
      ctx.lineWidth = w;
      ctx.strokeStyle = c;
      ctx.stroke();
    };
    // outlines
    seg(G, J, 8.5, OUT);
    seg(J, T1, 7.5, OUT);
    seg(J, T2, 7.5, OUT);
    seg(G, J, 5.2, wood);
    seg(J, T1, 4.4, wood);
    seg(J, T2, 4.4, wood);
    seg([G[0] + (J[0] - G[0]) * 0.2, G[1] + (J[1] - G[1]) * 0.2], [J[0], J[1]], 1.6, woodHi);
    // grip wrap
    const gx = G[0] + (J[0] - G[0]) * 0.35, gy = G[1] + (J[1] - G[1]) * 0.35;
    seg([G[0], G[1]], [gx, gy], 6.2, '#e9c46a');
    ctx.beginPath();
    ctx.arc(T1[0], T1[1], 2.2, 0, U.TAU);
    ctx.arc(T2[0], T2[1], 2.2, 0, U.TAU);
    ctx.fillStyle = '#5a2f12';
    ctx.fill();
  }

  function drawPouch(ctx, P, dir) {
    ctx.save();
    ctx.translate(P[0], P[1]);
    ctx.rotate(Math.atan2(dir[1], dir[0]));
    ctx.beginPath();
    ctx.ellipse(-6, 0, 5, 9.5, 0, 0, U.TAU);
    outlineFill(ctx, '#6b3e1f', 2);
    ctx.restore();
  }

  // ------------------------------------------------------------------ face parts
  function facePath(ctx, d) {
    const rx = d.faceRx, ry = d.faceRy, cy = HEAD_Y, ch = d.chin;
    ctx.beginPath();
    ctx.moveTo(0, cy - ry);
    ctx.bezierCurveTo(rx * 0.62, cy - ry, rx, cy - ry * 0.62, rx, cy - ry * 0.08);
    ctx.bezierCurveTo(rx, cy + ry * 0.42, rx * 0.78, cy + ry * 0.7, rx * ch, cy + ry * 0.93);
    ctx.quadraticCurveTo(0, cy + ry * 1.08, -rx * ch, cy + ry * 0.93);
    ctx.bezierCurveTo(-rx * 0.78, cy + ry * 0.7, -rx, cy + ry * 0.42, -rx, cy - ry * 0.08);
    ctx.bezierCurveTo(-rx, cy - ry * 0.62, -rx * 0.62, cy - ry, 0, cy - ry);
    ctx.closePath();
  }

  function drawEar(ctx, d, side) {
    const x = side * (d.faceRx - 0.5), y = HEAD_Y + 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 4.2, 6, 0, 0, U.TAU);
    outlineFill(ctx, d.skin, 2);
    ctx.beginPath();
    ctx.ellipse(x + side * 0.6, y, 1.8, 3.4, 0, 0, U.TAU);
    ctx.fillStyle = d.skinShade;
    ctx.fill();
  }

  function drawEye(ctx, d, x, y, type, look, side) {
    const big = !d.male;
    const rx = big ? 4.9 : 4.4, ry = big ? 5.9 : 4.9;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (type === 'closed' || type === 'happy') {
      ctx.beginPath();
      if (type === 'closed') {
        ctx.moveTo(x - rx, y);
        ctx.quadraticCurveTo(x, y + 3.2, x + rx, y);
      } else {
        ctx.moveTo(x - rx, y + 2);
        ctx.quadraticCurveTo(x, y - 5, x + rx, y + 2);
      }
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = OUT;
      ctx.stroke();
      if (d.lashes && type === 'closed') {
        ctx.beginPath();
        ctx.moveTo(x + side * rx, y);
        ctx.lineTo(x + side * (rx + 2.5), y - 1.5);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    if (type === 'x') {
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = OUT;
      ctx.beginPath();
      ctx.moveTo(x - 3.5, y - 3.5);
      ctx.lineTo(x + 3.5, y + 3.5);
      ctx.moveTo(x + 3.5, y - 3.5);
      ctx.lineTo(x - 3.5, y + 3.5);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (type === 'dizzy') {
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = OUT;
      ctx.beginPath();
      for (let a = 0; a < 12; a += 0.4) {
        const r = a * 0.42;
        const px = x + Math.cos(a + side) * r, py = y + Math.sin(a + side) * r;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }
    const wide = type === 'wide';
    const erx = wide ? rx * 1.15 : rx, ery = wide ? ry * 1.2 : ry;
    // white
    ctx.beginPath();
    ctx.ellipse(x, y, erx, ery, 0, 0, U.TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.save();
    ctx.clip();
    const lx = look[0] * 1.6, ly = look[1] * 1.4;
    const ir = wide ? 2.6 : big ? 3.8 : 3.4;
    ctx.beginPath();
    ctx.arc(x + lx, y + ly + 0.4, ir, 0, U.TAU);
    const ig = ctx.createRadialGradient(x + lx, y + ly + 1.5, 0.5, x + lx, y + ly, ir);
    ig.addColorStop(0, U.shade(d.iris, 0.35));
    ig.addColorStop(1, d.iris);
    ctx.fillStyle = ig;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + lx, y + ly + 0.4, ir * 0.5, 0, U.TAU);
    ctx.fillStyle = '#120a08';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + lx - 1.2, y + ly - 1.1, ir * 0.32, 0, U.TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();
    // lids
    let lid = 0;
    if (type === 'squint') lid = 0.5;
    if (type === 'sad') lid = 0.3;
    if (d.id === 'yair' && type === 'open') lid = 0.08;
    if (lid > 0) {
      ctx.beginPath();
      if (type === 'sad') {
        ctx.moveTo(x - erx - 1, y - ery - 1);
        ctx.lineTo(x + erx + 1, y - ery - 1);
        ctx.lineTo(x + side * erx + 1, y - ery + ery * 2 * lid * 0.4);
        ctx.lineTo(x - side * erx, y - ery + ery * 2 * lid * 1.3);
      } else {
        ctx.rect(x - erx - 1, y - ery - 1, erx * 2 + 2, ery * 2 * lid + 1);
      }
      ctx.fillStyle = d.skin;
      ctx.fill();
    }
    ctx.restore();
    // outline + upper lash line
    ctx.beginPath();
    ctx.ellipse(x, y, erx, ery, 0, 0, U.TAU);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    const top = y - ery + ery * 2 * lid;
    ctx.beginPath();
    ctx.moveTo(x - erx * 0.98, lid ? top : y - ery * 0.35);
    if (lid) ctx.lineTo(x + erx * 0.98, top);
    else ctx.quadraticCurveTo(x, y - ery * 1.5, x + erx * 0.98, y - ery * 0.35);
    ctx.lineWidth = d.lashes ? 2.6 : 2.2;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    if (d.lashes) {
      // outer flick / winged liner
      const ox = x + side * erx * 0.95, oy = lid ? top : y - ery * 0.35;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + side * (d.liner ? 3.4 : 2.6), oy - (d.liner ? 2.6 : 2.2));
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + side * erx * 0.55, oy - 2);
      ctx.lineTo(x + side * erx * 0.8, oy - 3.6);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    if (d.bags) {
      ctx.beginPath();
      ctx.moveTo(x - erx * 0.9, y + ery + 0.8);
      ctx.quadraticCurveTo(x, y + ery + 3.6, x + erx * 0.9, y + ery + 0.8);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(120,70,70,0.55)';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - erx * 0.6, y + ery + 2.8);
      ctx.quadraticCurveTo(x, y + ery + 4.6, x + erx * 0.6, y + ery + 2.8);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(120,70,70,0.3)';
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBrow(ctx, d, x, y, side, mode) {
    // inner point near center, outer point to the side
    let ix = x - side * 4.5, iy = y + 1, ox = x + side * 5.5, oy = y + 0.5;
    let arch = d.male ? -1.2 : -3;
    if (mode === 'angry' || mode === 'focus') { iy += mode === 'angry' ? 3 : 1.8; oy -= 1; arch = -0.5; }
    if (mode === 'worried') { iy -= 3; oy += 1.5; }
    if (mode === 'raised') { iy -= 3; oy -= 3; arch -= 1; }
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.quadraticCurveTo((ix + ox) / 2, Math.min(iy, oy) + arch, ox, oy);
    ctx.lineCap = 'round';
    ctx.lineWidth = d.browW;
    ctx.strokeStyle = d.brow;
    ctx.stroke();
    if (d.male) {
      // bushier: a second offset stroke
      ctx.beginPath();
      ctx.moveTo(ix, iy + 1.2);
      ctx.quadraticCurveTo((ix + ox) / 2, Math.min(iy, oy) + arch + 1.4, ox - side * 1.5, oy + 1);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawNose(ctx, d, x, y) {
    ctx.lineCap = 'round';
    if (d.male) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, y - 8);
      ctx.quadraticCurveTo(x + 3.2, y - 1, x + 2.6, y + 1.5);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(120,70,50,0.55)';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 4, y + 1);
      ctx.quadraticCurveTo(x - 1, y + 4, x + 1, y + 2.6);
      ctx.quadraticCurveTo(x + 3, y + 4, x + 5.5, y + 1);
      ctx.lineWidth = 1.7;
      ctx.strokeStyle = OUT;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - 2.6, y + 1);
      ctx.quadraticCurveTo(x + 0.2, y + 3.2, x + 2.8, y + 0.8);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(120,60,50,0.75)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 0.3, y - 1.4, 1.2, 0, U.TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
    }
  }

  function drawMouth(ctx, d, x, y, type) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const lip = d.lips;
    switch (type) {
      case 'grin': {
        const w = d.male ? 7 : 8.2;
        ctx.beginPath();
        ctx.moveTo(x - w, y - 1.5);
        ctx.quadraticCurveTo(x, y + 0.5, x + w, y - 1.5);
        ctx.quadraticCurveTo(x + w * 0.6, y + 8.5, x, y + 8.6);
        ctx.quadraticCurveTo(x - w * 0.6, y + 8.5, x - w, y - 1.5);
        ctx.closePath();
        ctx.fillStyle = '#7d2532';
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - w, y - 3, w * 2, 5.2);
        ctx.fillStyle = '#ec7c8b';
        ctx.beginPath();
        ctx.ellipse(x, y + 9, w * 0.55, 3.6, 0, 0, U.TAU);
        ctx.fill();
        ctx.restore();
        ctx.lineWidth = 1.9;
        ctx.strokeStyle = U.shade(lip, -0.35);
        ctx.stroke();
        // lower lip highlight
        ctx.beginPath();
        ctx.moveTo(x - w * 0.4, y + 9.6);
        ctx.quadraticCurveTo(x, y + 10.8, x + w * 0.4, y + 9.6);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = U.rgba(lip, 0.8);
        ctx.stroke();
        // dimples
        ctx.beginPath();
        ctx.moveTo(x - w - 1.5, y - 3);
        ctx.quadraticCurveTo(x - w - 2.3, y - 1, x - w - 1.2, y + 0.6);
        ctx.moveTo(x + w + 1.5, y - 3);
        ctx.quadraticCurveTo(x + w + 2.3, y - 1, x + w + 1.2, y + 0.6);
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = 'rgba(140,70,60,0.5)';
        ctx.stroke();
        break;
      }
      case 'smile':
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.quadraticCurveTo(x, y + 5.5, x + 6, y);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = U.shade(lip, -0.4);
        ctx.stroke();
        break;
      case 'smirk':
        ctx.beginPath();
        ctx.moveTo(x - 5.5, y + 1.5);
        ctx.quadraticCurveTo(x, y + 3.4, x + 6, y - 0.8);
        ctx.lineWidth = 2.3;
        ctx.strokeStyle = U.shade(lip, -0.45);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 3.5, y + 4.4);
        ctx.quadraticCurveTo(x, y + 6.2, x + 3.5, y + 4);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = U.rgba(lip, 0.9);
        ctx.stroke();
        break;
      case 'o':
      case 'bigO': {
        const s = type === 'bigO' ? 1.5 : 1;
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 3.4 * s, 4.4 * s, 0, 0, U.TAU);
        ctx.fillStyle = '#6e1f2b';
        ctx.fill();
        ctx.lineWidth = 1.9;
        ctx.strokeStyle = U.shade(lip, -0.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x, y + 5 * s, 2.2 * s, 1.6 * s, 0, 0, U.TAU);
        ctx.fillStyle = '#ec7c8b';
        ctx.fill();
        break;
      }
      case 'frown':
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 4);
        ctx.quadraticCurveTo(x, y - 1.8, x + 6, y + 4);
        ctx.lineWidth = 2.3;
        ctx.strokeStyle = U.shade(lip, -0.45);
        ctx.stroke();
        break;
      case 'grit':
        U.rr(ctx, x - 6.5, y - 1, 13, 6.5, 2.5);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = U.shade(lip, -0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 2.2);
        ctx.lineTo(x + 6, y + 2.2);
        for (let i = -1; i <= 1; i++) {
          ctx.moveTo(x + i * 3.2, y - 0.5);
          ctx.lineTo(x + i * 3.2, y + 5);
        }
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = '#999';
        ctx.stroke();
        break;
      case 'wavy':
        ctx.beginPath();
        ctx.moveTo(x - 7, y + 2);
        for (let i = 0; i <= 6; i++) ctx.lineTo(x - 7 + i * (14 / 6), y + 2 + (i % 2 ? -2 : 2));
        ctx.lineWidth = 2;
        ctx.strokeStyle = U.shade(lip, -0.45);
        ctx.stroke();
        break;
      default: // flat
        ctx.beginPath();
        ctx.moveTo(x - 5, y + 1.5);
        ctx.lineTo(x + 5, y + 1.5);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = U.shade(lip, -0.45);
        ctx.stroke();
    }
  }

  // ------------------------------------------------------------------ hair & per-person details
  const HAIR = {
    ima: {
      back(ctx, d) {
        const y0 = HEAD_Y;
        // hair gathered at the back of the head
        ctx.beginPath();
        ctx.ellipse(-4, y0 - 6, 24, 25, -0.1, 0, U.TAU);
        outlineFill(ctx, d.hair);
        ctx.beginPath();
        ctx.ellipse(-22, y0 + 4, 9, 11, 0.3, 0, U.TAU);
        outlineFill(ctx, d.hairMid);
      },
      front(ctx, d) {
        const y0 = HEAD_Y;
        // pulled back from a high forehead
        ctx.beginPath();
        ctx.moveTo(-21, y0 - 2);
        ctx.bezierCurveTo(-23, y0 - 18, -15, y0 - 30, 0, y0 - 30.5);
        ctx.bezierCurveTo(15, y0 - 30, 23, y0 - 18, 21, y0 - 2);
        ctx.bezierCurveTo(19, y0 - 11, 16.5, y0 - 16, 11, y0 - 18);
        ctx.bezierCurveTo(5, y0 - 20.5, -5, y0 - 20.5, -11, y0 - 18);
        ctx.bezierCurveTo(-16.5, y0 - 16, -19, y0 - 11, -21, y0 - 2);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, y0 - 31, 0, y0 - 14);
        g.addColorStop(0, d.hairHi);
        g.addColorStop(1, d.hair);
        outlineFill(ctx, g);
        // a touch of grey at the hairline
        ctx.beginPath();
        ctx.moveTo(4, y0 - 20);
        ctx.quadraticCurveTo(6, y0 - 25, 3, y0 - 29);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = d.gray;
        ctx.stroke();
        // red headband with a big bow – her signature
        ctx.beginPath();
        ctx.moveTo(-21.5, y0 - 10);
        ctx.bezierCurveTo(-20, y0 - 27, 20, y0 - 27, 21.5, y0 - 10);
        ctx.lineCap = 'round';
        ctx.lineWidth = 7.5;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.lineWidth = 5;
        ctx.strokeStyle = d.bow;
        ctx.stroke();
        const bx = 9, by = y0 - 27;
        [[-1, -0.35], [1, 0.35]].forEach(([sd, a]) => {
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(a);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(sd * 6, -9, sd * 15, -6, sd * 13, 1);
          ctx.bezierCurveTo(sd * 15, 7, sd * 6, 8, 0, 0);
          ctx.closePath();
          outlineFill(ctx, d.bow, 2);
          ctx.beginPath();
          ctx.moveTo(sd * 3, -1);
          ctx.quadraticCurveTo(sd * 8, -4, sd * 10, 0);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = U.shade(d.bow, -0.3);
          ctx.stroke();
          ctx.restore();
        });
        ctx.beginPath();
        ctx.ellipse(bx, by, 3.6, 4.2, 0, 0, U.TAU);
        outlineFill(ctx, U.shade(d.bow, -0.15), 2);
      },
      face() {},
      earrings(ctx, d) {
        [-1, 1].forEach((sd) => {
          ctx.beginPath();
          ctx.arc(sd * (d.faceRx + 0.4), HEAD_Y + 5, 1.6, 0, U.TAU);
          ctx.fillStyle = '#e9c46a';
          ctx.fill();
          ctx.lineWidth = 0.7;
          ctx.strokeStyle = '#8a6d1f';
          ctx.stroke();
        });
      },
    },
    gooli: {
      back(ctx, d) {
        HAIR.yair.back(ctx, d);
      },
      front(ctx, d) {
        HAIR.yair.front(ctx, d);
        const y0 = HEAD_Y;
        // messy tufts sticking up
        [[-16, -26, -21, -36], [-8, -31, -10, -42], [1, -33, 2, -45], [10, -32, 14, -43], [18, -27, 25, -35]].forEach(([x, y, tx, ty], i) => {
          ctx.beginPath();
          ctx.moveTo(x - 5, y0 + y + 3);
          ctx.quadraticCurveTo(x, y0 + y - 2, tx, y0 + ty);
          ctx.quadraticCurveTo(x + 2, y0 + y - 1, x + 6, y0 + y + 3);
          ctx.closePath();
          ctx.fillStyle = i % 2 ? d.hairMid : d.hair;
          ctx.fill();
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y0 + y);
          ctx.lineTo(tx - (tx - x) * 0.3, y0 + ty + 4);
          ctx.lineWidth = 1.1;
          ctx.strokeStyle = d.gray;
          ctx.stroke();
        });
        // extra grey streaks
        ctx.strokeStyle = U.rgba(d.gray, 0.9);
        ctx.lineWidth = 1;
        [[-12, -22, 0, -30], [-4, -20, 10, -27], [6, -19, 20, -22], [-18, -15, -8, -25]].forEach(([a, b, c, e]) => {
          ctx.beginPath();
          ctx.moveTo(a, y0 + b);
          ctx.quadraticCurveTo((a + c) / 2, y0 + (b + e) / 2 - 3, c, y0 + e);
          ctx.stroke();
        });
      },
      face(ctx, d, fx) {
        HAIR.yair.face(ctx, d, fx);
      },
    },
    adi: {
      back(ctx, d) {
        const y0 = HEAD_Y;
        ctx.beginPath();
        ctx.moveTo(0, y0 - 25);
        ctx.bezierCurveTo(-22, y0 - 26, -28, y0 - 12, -27, y0 + 6);
        ctx.lineTo(-29, y0 + 50);
        ctx.quadraticCurveTo(-27, y0 + 60, -18, y0 + 58);
        ctx.lineTo(18, y0 + 58);
        ctx.quadraticCurveTo(27, y0 + 60, 29, y0 + 50);
        ctx.lineTo(27, y0 + 6);
        ctx.bezierCurveTo(28, y0 - 12, 22, y0 - 26, 0, y0 - 25);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, y0 - 26, 0, y0 + 60);
        g.addColorStop(0, d.hairMid);
        g.addColorStop(1, d.hair);
        outlineFill(ctx, g);
      },
      front(ctx, d) {
        const y0 = HEAD_Y;
        const g = ctx.createLinearGradient(0, y0 - 26, 0, y0 + 56);
        g.addColorStop(0, d.hair);
        g.addColorStop(0.6, U.mix(d.hair, d.hairHi, 0.35));
        g.addColorStop(1, d.hairHi);
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(s * 1, y0 - 24);
          ctx.bezierCurveTo(s * 13, y0 - 25, s * 23, y0 - 20, s * 24, y0 - 6);
          ctx.lineTo(s * 25.5, y0 + 54);
          ctx.quadraticCurveTo(s * 22, y0 + 57, s * 18.5, y0 + 54);
          ctx.lineTo(s * 18.5, y0 + 8);
          ctx.bezierCurveTo(s * 19, y0 - 4, s * 17, y0 - 13, s * 11, y0 - 17);
          ctx.bezierCurveTo(s * 7, y0 - 20, s * 3, y0 - 19, s * 0.5, y0 - 16);
          ctx.closePath();
          outlineFill(ctx, g);
          // straight shine strands
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s * 7, y0 - 21);
          ctx.quadraticCurveTo(s * 18, y0 - 18, s * 21, y0 - 4);
          ctx.lineTo(s * 22, y0 + 44);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = U.rgba(d.hairHi, 0.9);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(s * 23.5, y0 + 8);
          ctx.lineTo(s * 24, y0 + 40);
          ctx.lineWidth = 1.1;
          ctx.strokeStyle = U.rgba('#8a6048', 0.8);
          ctx.stroke();
        });
        // centre part
        ctx.beginPath();
        ctx.moveTo(0.5, y0 - 24);
        ctx.lineTo(0.5, y0 - 16);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = U.rgba(d.skinShade, 0.9);
        ctx.stroke();
      },
      face(ctx, d, fx) {
        // little beauty mark on the chin, like in the photo
        ctx.beginPath();
        ctx.arc(fx - 6.5, HEAD_Y + 20, 0.9, 0, U.TAU);
        ctx.fillStyle = 'rgba(90,50,35,0.85)';
        ctx.fill();
      },
    },
    yair: {
      back(ctx, d) {
        // short back/sides mass
        ctx.beginPath();
        ctx.ellipse(0, HEAD_Y - 3, 23, 23, 0, Math.PI * 0.98, Math.PI * 2.02);
        ctx.lineTo(22, HEAD_Y + 4);
        ctx.lineTo(-22, HEAD_Y + 4);
        ctx.closePath();
        outlineFill(ctx, d.hairMid);
      },
      front(ctx, d) {
        const y0 = HEAD_Y;
        // swept-up top with receding temples (M hairline) + lock to the side
        ctx.beginPath();
        ctx.moveTo(-21.5, y0 - 4);
        ctx.bezierCurveTo(-25, y0 - 18, -17, y0 - 33, 0, y0 - 34);
        ctx.bezierCurveTo(13, y0 - 37, 27, y0 - 33, 29.5, y0 - 23);
        ctx.bezierCurveTo(31, y0 - 17, 28, y0 - 12, 23.5, y0 - 11);
        ctx.bezierCurveTo(21.5, y0 - 13, 18, y0 - 15, 14, y0 - 15.6);
        // receded right temple, widow's peak, receded left temple
        ctx.bezierCurveTo(10, y0 - 16, 6, y0 - 15, 1.5, y0 - 15.2);
        ctx.bezierCurveTo(-3, y0 - 15.2, -7, y0 - 15.8, -11, y0 - 15.8);
        ctx.bezierCurveTo(-15, y0 - 15.5, -18.5, y0 - 13, -20, y0 - 9);
        ctx.lineTo(-20.5, y0 - 4);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, y0 - 36, 0, y0 - 10);
        g.addColorStop(0, d.hairHi);
        g.addColorStop(1, d.hair);
        outlineFill(ctx, g);
        // strands & gray streaks
        ctx.lineCap = 'round';
        const strands = [
          [[-14, -26], [-2, -33], [12, -33]],
          [[-8, -21], [4, -29], [19, -29]],
          [[-3, -19], [10, -25], [24, -22]],
          [[-17, -18], [-10, -28], [2, -31]],
          [[4, -18], [14, -22], [25, -16]],
        ];
        strands.forEach((s, i) => {
          ctx.beginPath();
          ctx.moveTo(s[0][0], y0 + s[0][1]);
          ctx.quadraticCurveTo(s[1][0], y0 + s[1][1], s[2][0], y0 + s[2][1]);
          ctx.lineWidth = i % 2 ? 1.2 : 1.5;
          ctx.strokeStyle = i % 2 ? d.gray : d.hairHi;
          ctx.stroke();
        });
        // gray temples / sideburns
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(s * 20.5, y0 - 10);
          ctx.quadraticCurveTo(s * 22.5, y0 - 4, s * 20.5, y0 + 4);
          ctx.lineTo(s * 18.6, y0 + 3);
          ctx.quadraticCurveTo(s * 19.6, y0 - 4, s * 18.5, y0 - 9);
          ctx.closePath();
          ctx.fillStyle = d.hairMid;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(s * 21, y0 - 8);
          ctx.lineTo(s * 20.6, y0 - 1);
          ctx.lineWidth = 1;
          ctx.strokeStyle = d.gray;
          ctx.stroke();
        });
      },
      face(ctx, d, fx) {
        if (!d.stubble) return;
        // stubble: jaw, chin and upper lip
        const y0 = HEAD_Y;
        ctx.save();
        facePath(ctx, d);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(-22, y0 + 2);
        ctx.quadraticCurveTo(-16, y0 + 6, -11, y0 + 9);
        ctx.quadraticCurveTo(fx - 4, y0 + 7.5, fx, y0 + 8);
        ctx.quadraticCurveTo(fx + 4, y0 + 7.5, 11, y0 + 9);
        ctx.quadraticCurveTo(16, y0 + 6, 22, y0 + 2);
        ctx.lineTo(22, y0 + 30);
        ctx.lineTo(-22, y0 + 30);
        ctx.closePath();
        const sg = ctx.createLinearGradient(0, y0 + 2, 0, y0 + 24);
        sg.addColorStop(0, 'rgba(80,62,56,0.10)');
        sg.addColorStop(0.5, 'rgba(80,62,56,0.30)');
        sg.addColorStop(1, 'rgba(90,80,76,0.34)');
        ctx.fillStyle = sg;
        ctx.fill();
        const rnd = U.rng(77);
        for (let i = 0; i < 46; i++) {
          const a = rnd() * Math.PI, r = 12 + rnd() * 10;
          const px = Math.cos(a) * r * 1.05, py = y0 + 8 + Math.sin(a) * r * 0.8;
          ctx.fillStyle = rnd() < 0.5 ? 'rgba(225,222,218,0.75)' : 'rgba(55,40,35,0.35)';
          ctx.fillRect(px, py, 0.7, 0.7);
        }
        ctx.restore();
        // smile lines
        ctx.beginPath();
        ctx.moveTo(fx - 9, y0 + 4);
        ctx.quadraticCurveTo(fx - 11, y0 + 9, fx - 9, y0 + 13);
        ctx.moveTo(fx + 10, y0 + 4);
        ctx.quadraticCurveTo(fx + 12, y0 + 9, fx + 10, y0 + 13);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(120,70,55,0.35)';
        ctx.stroke();
      },
    },

    shiri: {
      back(ctx, d) {
        const y0 = HEAD_Y;
        ctx.beginPath();
        ctx.moveTo(0, y0 - 27);
        ctx.bezierCurveTo(-22, y0 - 29, -31, y0 - 13, -29, y0 + 4);
        ctx.bezierCurveTo(-28, y0 + 17, -35, y0 + 24, -31, y0 + 36);
        ctx.bezierCurveTo(-29, y0 + 46, -36, y0 + 50, -30, y0 + 56);
        ctx.bezierCurveTo(-24, y0 + 60, -16, y0 + 54, -13, y0 + 46);
        ctx.lineTo(13, y0 + 46);
        ctx.bezierCurveTo(16, y0 + 54, 24, y0 + 60, 30, y0 + 56);
        ctx.bezierCurveTo(36, y0 + 50, 29, y0 + 46, 31, y0 + 36);
        ctx.bezierCurveTo(35, y0 + 24, 28, y0 + 17, 29, y0 + 4);
        ctx.bezierCurveTo(31, y0 - 13, 22, y0 - 29, 0, y0 - 27);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, y0 - 28, 0, y0 + 58);
        g.addColorStop(0, d.hairMid);
        g.addColorStop(0.5, d.hair);
        g.addColorStop(1, d.hairHi);
        outlineFill(ctx, g);
      },
      front(ctx, d) {
        const y0 = HEAD_Y;
        const g = ctx.createLinearGradient(0, y0 - 28, 0, y0 + 50);
        g.addColorStop(0, d.hair);
        g.addColorStop(0.55, U.mix(d.hair, d.hairHi, 0.5));
        g.addColorStop(1, d.hairHi);
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(s * 1, y0 - 25);
          ctx.bezierCurveTo(s * 12, y0 - 27, s * 23, y0 - 22, s * 24.5, y0 - 9);
          ctx.bezierCurveTo(s * 26, y0 + 3, s * 23, y0 + 12, s * 27, y0 + 22);
          ctx.bezierCurveTo(s * 30, y0 + 30, s * 24, y0 + 38, s * 27, y0 + 46);
          ctx.bezierCurveTo(s * 22, y0 + 48, s * 17, y0 + 44, s * 18.5, y0 + 36);
          ctx.bezierCurveTo(s * 20, y0 + 26, s * 16, y0 + 20, s * 18, y0 + 8);
          ctx.bezierCurveTo(s * 19.5, y0 - 2, s * 17, y0 - 12, s * 11, y0 - 17);
          ctx.bezierCurveTo(s * 7, y0 - 20, s * 3, y0 - 19, s * 0.5, y0 - 16);
          ctx.closePath();
          outlineFill(ctx, g);
        });
        // wave highlights
        ctx.lineCap = 'round';
        ctx.strokeStyle = U.rgba(d.hairHi, 0.95);
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(s * 6, y0 - 22);
          ctx.quadraticCurveTo(s * 17, y0 - 20, s * 20.5, y0 - 6);
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(s * 22, y0 + 4);
          ctx.bezierCurveTo(s * 20, y0 + 14, s * 26, y0 + 22, s * 23, y0 + 34);
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(s * 27, y0 + 12);
          ctx.quadraticCurveTo(s * 31, y0 + 24, s * 27, y0 + 30);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = U.rgba('#f0c08a', 0.8);
          ctx.stroke();
          ctx.strokeStyle = U.rgba(d.hairHi, 0.95);
        });
        // part line
        ctx.beginPath();
        ctx.moveTo(0.5, y0 - 25);
        ctx.lineTo(0.5, y0 - 17);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = U.rgba(d.skinShade, 0.9);
        ctx.stroke();
      },
      face() {},
    },

    roni: {
      back(ctx, d) {
        const y0 = HEAD_Y;
        // long dark hair behind shoulders
        ctx.beginPath();
        ctx.moveTo(-20, y0 - 8);
        ctx.bezierCurveTo(-31, y0 + 6, -27, y0 + 22, -33, y0 + 36);
        ctx.bezierCurveTo(-36, y0 + 46, -30, y0 + 54, -22, y0 + 52);
        ctx.lineTo(22, y0 + 52);
        ctx.bezierCurveTo(30, y0 + 54, 36, y0 + 46, 33, y0 + 36);
        ctx.bezierCurveTo(27, y0 + 22, 31, y0 + 6, 20, y0 - 8);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, y0 - 8, 0, y0 + 54);
        g.addColorStop(0, d.hair);
        g.addColorStop(1, d.hairMid);
        outlineFill(ctx, g);
        // half-up volume on crown
        ctx.beginPath();
        ctx.ellipse(-4, y0 - 21, 23, 14, -0.12, 0, U.TAU);
        outlineFill(ctx, d.hair);
        ctx.beginPath();
        ctx.ellipse(-16, y0 - 22, 9, 9, 0, 0, U.TAU);
        outlineFill(ctx, d.hairMid);
        ctx.beginPath();
        ctx.arc(-16, y0 - 22, 4.5, 0.5, 4.5);
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = U.rgba(d.hairHi, 0.9);
        ctx.stroke();
        // waves on the long part
        ctx.strokeStyle = U.rgba(d.hairHi, 0.9);
        ctx.lineWidth = 1.4;
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(s * 25, y0 + 10);
          ctx.bezierCurveTo(s * 30, y0 + 22, s * 25, y0 + 30, s * 30, y0 + 44);
          ctx.stroke();
        });
      },
      front(ctx, d) {
        const y0 = HEAD_Y;
        // swept-back top, high hairline
        ctx.beginPath();
        ctx.moveTo(-21, y0 - 3);
        ctx.bezierCurveTo(-23, y0 - 18, -15, y0 - 31, 0, y0 - 31.5);
        ctx.bezierCurveTo(15, y0 - 31, 23, y0 - 18, 21, y0 - 3);
        ctx.bezierCurveTo(19.5, y0 - 11, 17, y0 - 16, 12, y0 - 18.5);
        ctx.bezierCurveTo(6, y0 - 21, -6, y0 - 21, -12, y0 - 18.5);
        ctx.bezierCurveTo(-17, y0 - 16, -19.5, y0 - 11, -21, y0 - 3);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, y0 - 32, 0, y0 - 14);
        g.addColorStop(0, d.hairHi);
        g.addColorStop(1, d.hair);
        outlineFill(ctx, g);
        // combed-back strands
        ctx.lineCap = 'round';
        ctx.strokeStyle = U.rgba('#6a5246', 0.9);
        [[-10, -19, -14, -29], [-3, -20.5, -5, -31], [4, -20.5, 3, -31], [11, -19, 12, -29]].forEach(([a, b, c, e]) => {
          ctx.beginPath();
          ctx.moveTo(a, y0 + b);
          ctx.quadraticCurveTo((a + c) / 2 + 2, y0 + (b + e) / 2, c, y0 + e);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        });
        // loose wavy wisps framing face
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(s * 18, y0 - 13);
          ctx.bezierCurveTo(s * 23, y0 - 4, s * 18, y0 + 4, s * 22.5, y0 + 13);
          ctx.bezierCurveTo(s * 24, y0 + 6, s * 26, y0 - 4, s * 21, y0 - 13);
          ctx.closePath();
          ctx.fillStyle = d.hair;
          ctx.fill();
        });
      },
      face(ctx, d, fx) {
        // freckles
        const rnd = U.rng(12);
        ctx.fillStyle = 'rgba(176,110,80,0.55)';
        for (let i = 0; i < 16; i++) {
          const s = i % 2 ? 1 : -1;
          const px = fx + s * (4 + rnd() * 9), py = HEAD_Y + 3 + rnd() * 5;
          ctx.beginPath();
          ctx.arc(px, py, 0.55 + rnd() * 0.4, 0, U.TAU);
          ctx.fill();
        }
      },
      earrings(ctx, d) {
        [-1, 1].forEach((s) => {
          const x = s * (d.faceRx + 0.5), y = HEAD_Y + 6;
          ctx.beginPath();
          ctx.arc(x, y + 4, 3.4, 0, U.TAU);
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = '#e6ebf0';
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + s * 0.3, y - 3, 1.3, 0, U.TAU);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.lineWidth = 0.6;
          ctx.strokeStyle = '#9aa';
          ctx.stroke();
        });
      },
    },
  };

  // ------------------------------------------------------------------ body
  function drawLegs(ctx, d, S) {
    if (S.flyKick) {
      // back leg tucked, front leg shooting forward
      U.rr(ctx, -12, -26, 10.4, 15, 4);
      outlineFill(ctx, d.pants, 2.2);
      ctx.beginPath();
      ctx.ellipse(-8, -10, 8, 4.4, 0.4, 0, U.TAU);
      outlineFill(ctx, d.shoes, 2.2);
      ctx.save();
      ctx.translate(5, -22);
      ctx.rotate(-1.35);
      U.rr(ctx, -5.2, 0, 10.4, 26, 4);
      outlineFill(ctx, d.pants, 2.2);
      ctx.beginPath();
      ctx.ellipse(1, 27, 4.6, 8.4, 0, 0, U.TAU);
      outlineFill(ctx, d.shoes, 2.2);
      ctx.restore();
      return;
    }
    const kick = S.legKick || 0;
    [-1, 1].forEach((s, i) => {
      const lx = s * 7 + (i ? kick : -kick) * 0.5;
      const lift = i ? Math.max(0, kick) : Math.max(0, -kick);
      U.rr(ctx, lx - 5.2, -26, 10.4, 24 - lift, 4);
      outlineFill(ctx, d.pants, 2.2);
      // shoe
      ctx.beginPath();
      ctx.ellipse(lx + 3, -2.6 - lift, 8.4, 4.4, 0, 0, U.TAU);
      outlineFill(ctx, d.shoes, 2.2);
      ctx.beginPath();
      ctx.moveTo(lx - 4.5, -1 - lift);
      ctx.lineTo(lx + 10.5, -1 - lift);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = d.shoeTrim;
      ctx.stroke();
    });
  }

  function drawTorso(ctx, d) {
    const fem = !d.male;
    const sw = d.muscular ? 23 : fem ? 17 : 19;
    const ww = d.muscular ? 14.5 : fem ? 13.5 : 16;
    ctx.beginPath();
    ctx.moveTo(-sw + 4, -60);
    ctx.quadraticCurveTo(-sw, -60, -sw, -54);
    ctx.lineTo(-ww - 1, -30);
    ctx.quadraticCurveTo(-ww - 1, -22, -ww + 5, -22);
    ctx.lineTo(ww - 5, -22);
    ctx.quadraticCurveTo(ww + 1, -22, ww + 1, -30);
    ctx.lineTo(sw, -54);
    ctx.quadraticCurveTo(sw, -60, sw - 4, -60);
    ctx.closePath();
    const g = ctx.createLinearGradient(-sw, 0, sw, 0);
    g.addColorStop(0, d.topShade);
    g.addColorStop(0.55, d.top);
    g.addColorStop(1, d.topHi);
    outlineFill(ctx, g);
    ctx.save();
    ctx.clip();
    if (d.id === 'shiri') {
      // knit cable texture + ribbing
      ctx.strokeStyle = U.rgba(d.topShade, 0.95);
      ctx.lineWidth = 1.2;
      for (let x = -12; x <= 12; x += 6) {
        ctx.beginPath();
        for (let y = -58; y < -22; y += 3) {
          ctx.moveTo(x - 1.5, y);
          ctx.quadraticCurveTo(x, y + 1.5, x + 1.5, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = U.rgba(d.topShade, 0.9);
      ctx.fillRect(-20, -27, 40, 5);
    }
    if (d.muscular) {
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-16, -50);
      ctx.quadraticCurveTo(-8, -41, -1, -46);
      ctx.moveTo(16, -50);
      ctx.quadraticCurveTo(8, -41, 1, -46);
      ctx.moveTo(0, -44);
      ctx.lineTo(0, -30);
      ctx.stroke();
    }
    if (d.rocker) {
      // band tee in the middle of the open jacket
      ctx.beginPath();
      ctx.moveTo(-7.5, -60);
      ctx.lineTo(7.5, -60);
      ctx.lineTo(9, -24);
      ctx.lineTo(-9, -24);
      ctx.closePath();
      ctx.fillStyle = d.shirt;
      ctx.fill();
      // lightning-bolt print
      ctx.beginPath();
      ctx.moveTo(1.5, -52);
      ctx.lineTo(-3.5, -42);
      ctx.lineTo(0.5, -42);
      ctx.lineTo(-2, -33);
      ctx.lineTo(4, -45);
      ctx.lineTo(0, -45);
      ctx.closePath();
      ctx.fillStyle = d.print;
      ctx.fill();
      // lapels
      ctx.beginPath();
      ctx.moveTo(-7.5, -60);
      ctx.lineTo(-12, -46);
      ctx.lineTo(-8.5, -24);
      ctx.moveTo(7.5, -60);
      ctx.lineTo(12, -46);
      ctx.lineTo(8.5, -24);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = OUT;
      ctx.stroke();
      // studs on the shoulders
      ctx.fillStyle = d.studs;
      [[-15, -56], [-11, -57.5], [11, -57.5], [15, -56], [-16, -52], [16, -52]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 1.1, 0, U.TAU);
        ctx.fill();
      });
      // belt + buckle
      ctx.fillStyle = '#141418';
      ctx.fillRect(-16, -27, 32, 4);
      ctx.fillStyle = '#e9c46a';
      ctx.fillRect(-2.5, -27.5, 5, 5);
      if (d.chain) {
        ctx.beginPath();
        ctx.moveTo(4, -25);
        ctx.quadraticCurveTo(10, -18, 15, -24);
        ctx.setLineDash([1.5, 1.2]);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = d.chain;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (d.id === 'yair') {
      // subtle tee folds
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -40);
      ctx.quadraticCurveTo(-2, -36, 6, -40);
      ctx.stroke();
    }
    ctx.restore();
    // neckline
    if (d.rocker) {
      ctx.beginPath();
      ctx.ellipse(0, -60, 6.5, 4, 0, 0, Math.PI);
      ctx.fillStyle = d.skin;
      ctx.fill();
    } else if (d.id === 'yair') {
      ctx.beginPath();
      ctx.moveTo(-7.5, -60.5);
      ctx.lineTo(0, -47);
      ctx.lineTo(7.5, -60.5);
      ctx.closePath();
      ctx.fillStyle = d.skin;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = OUT;
      ctx.stroke();
      // chest hair hint
      ctx.fillStyle = 'rgba(60,45,40,0.35)';
      for (let i = 0; i < 6; i++) ctx.fillRect(-2 + (i % 3) * 1.6, -56 + Math.floor(i / 3) * 2.2, 0.8, 0.8);
    } else if (d.id === 'adi') {
      // kids' crew-neck tee
      ctx.beginPath();
      ctx.ellipse(0, -60, 7.5, 4.5, 0, 0, Math.PI);
      ctx.fillStyle = d.skin;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -60, 8.6, 5.6, 0, 0.05, Math.PI - 0.05);
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = d.topShade;
      ctx.stroke();
    } else if (d.id === 'shiri') {
      ctx.beginPath();
      ctx.ellipse(0, -60, 8.5, 4.5, 0, 0, Math.PI);
      ctx.fillStyle = d.skin;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -60, 10, 6, 0, 0.05, Math.PI - 0.05);
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = d.topShade;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, -60, 8, 5.5, 0, 0, Math.PI);
      ctx.fillStyle = d.skin;
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = OUT;
      ctx.stroke();
      // fine necklace
      ctx.beginPath();
      ctx.ellipse(0, -59, 6, 4.5, 0, 0.2, Math.PI - 0.2);
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = '#f3d27a';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -54.6, 1, 0, U.TAU);
      ctx.fillStyle = '#f3d27a';
      ctx.fill();
    }
  }

  function drawHeadBack(ctx, d) {
    HAIR[d.id].back(ctx, d);
  }

  function drawHead(ctx, d, S) {
    const H = HAIR[d.id];
    const fx = S.lookX * 2.2;
    // neck
    const nw = d.muscular ? 13 : 10;
    U.rr(ctx, -nw / 2, -66, nw, 9, 2);
    outlineFill(ctx, d.skin, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(-4, -63, 8, 3);
    if (d.id !== 'shiri' && d.id !== 'adi') {
      drawEar(ctx, d, -1);
      drawEar(ctx, d, 1);
    }
    // face
    facePath(ctx, d);
    const fg = ctx.createRadialGradient(fx - 5, HEAD_Y - 6, 3, 0, HEAD_Y, d.faceRy + 4);
    fg.addColorStop(0, U.shade(d.skin, 0.12));
    fg.addColorStop(0.75, d.skin);
    fg.addColorStop(1, d.skinShade);
    outlineFill(ctx, fg);
    // blush
    const bl = d.blush + (S.blush || 0);
    if (bl > 0) {
      [-1, 1].forEach((s) => {
        const g = ctx.createRadialGradient(fx + s * 12.5, HEAD_Y + 6, 0, fx + s * 12.5, HEAD_Y + 6, 6);
        g.addColorStop(0, `rgba(255,110,120,${bl})`);
        g.addColorStop(1, 'rgba(255,110,120,0)');
        ctx.fillStyle = g;
        ctx.fillRect(fx + s * 12.5 - 7, HEAD_Y - 1, 14, 14);
      });
    }
    H.face(ctx, d, fx);
    // eyes
    const ey = HEAD_Y + 1;
    [-1, 1].forEach((s) => drawEye(ctx, d, fx + s * 8.8, ey, S.eyes, [S.lookX, S.lookY], s));
    // brows
    [-1, 1].forEach((s) => drawBrow(ctx, d, fx + s * 9, HEAD_Y - 9 - (d.male ? -1.4 : 0), s, S.brow));
    drawNose(ctx, d, fx + 0.5, HEAD_Y + 7);
    drawMouth(ctx, d, fx + 0.3, HEAD_Y + 13.5, S.mouth);
    H.front(ctx, d);
    if (d.glasses) {
      // rectangular blue frames
      const gy = HEAD_Y + 1;
      ctx.lineJoin = 'round';
      [-1, 1].forEach((sd) => {
        U.rr(ctx, fx + sd * 9 - 7.5, gy - 5.5, 15, 10.5, 2.2);
        ctx.fillStyle = 'rgba(200,225,255,0.18)';
        ctx.fill();
        ctx.lineWidth = 3.4;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = d.glasses;
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(fx - 1.5, gy - 2);
      ctx.lineTo(fx + 1.5, gy - 2);
      ctx.moveTo(fx - 16.5, gy - 3);
      ctx.lineTo(-d.faceRx - 0.5, gy - 4);
      ctx.moveTo(fx + 16.5, gy - 3);
      ctx.lineTo(d.faceRx + 0.5, gy - 4);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = d.glasses;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fx - 13, gy - 3.5);
      ctx.lineTo(fx - 10, gy - 4.5);
      ctx.moveTo(fx + 5, gy - 3.5);
      ctx.lineTo(fx + 8, gy - 4.5);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.stroke();
    }
    if (H.earrings) H.earrings(ctx, d);
    // sweat drop (frustration)
    if (S.sweat) {
      ctx.beginPath();
      ctx.moveTo(-22, HEAD_Y - 16);
      ctx.quadraticCurveTo(-27, HEAD_Y - 8, -22, HEAD_Y - 6);
      ctx.quadraticCurveTo(-17, HEAD_Y - 8, -22, HEAD_Y - 16);
      ctx.fillStyle = '#8fd3ff';
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#2b6ea3';
      ctx.stroke();
    }
  }

  // ------------------------------------------------------------------ Character entity
  class Character {
    constructor(id, opts) {
      opts = opts || {};
      this.id = id;
      this.def = opts.def || DEFS[id];
      this.name = this.def.name;
      this.pos = { x: opts.x || 0, y: opts.y || 0 };
      this.facing = opts.facing || 1;
      this.hp = 100;
      this.dispHp = 100;
      this.pose = 'idle';
      this.poseT = 0;
      this.t = Math.random() * 10;
      this.blinkIn = 1 + Math.random() * 3;
      this.blinkT = 0;
      this.loaded = true;
      this.loadT = 1;
      this.aim = null; // {anchor:[x,y] world, dir:[x,y] world, power}
      this.splats = [];
      this.visible = true;
      this.solid = true;
      this.alpha = 1;
      this.recoil = 0;
      this.lookTarget = null;
      this.isActive = false;
      this.weapon = ELSTER.WEAPON_OF ? ELSTER.WEAPON_OF[id] : null;
      this.weaponReady = true;
      this.armed = false;
      this.hitFx = null;
    }

    get k() { return this.def.scale || 1; }
    get headCenter() { return { x: this.pos.x, y: this.pos.y + HEAD_Y * this.k }; }
    get restAnchor() { return { x: this.pos.x + this.facing * AX * this.k, y: this.pos.y + AY * this.k }; }

    hitTest(x, y, r) {
      const k = this.k;
      const hx = this.pos.x, hy = this.pos.y + (HEAD_Y - 2) * k;
      if (Math.hypot(x - hx, y - hy) < r + 24 * k) return 'head';
      const bx = U.clamp(x, this.pos.x - 18 * k, this.pos.x + 18 * k);
      const by = U.clamp(y, this.pos.y - 60 * k, this.pos.y);
      if (Math.hypot(x - bx, y - by) < r) return 'body';
      return null;
    }

    setPose(p) {
      if (this.pose === 'gone') return;
      this.pose = p;
      this.poseT = 0;
    }

    reload() {
      this.loaded = true;
      this.loadT = 0;
    }

    addSplat(part, wx, wy, kind, col) {
      let lx = ((wx - this.pos.x) * this.facing) / this.k, ly = (wy - this.pos.y) / this.k;
      if (part === 'head') {
        lx = U.clamp(lx, -14, 14);
        ly = U.clamp(ly, HEAD_Y - 18, HEAD_Y + 12);
      } else {
        lx = U.clamp(lx, -12, 12);
        ly = U.clamp(ly, -54, -28);
      }
      this.splats.push({ x: lx, y: ly, r: part === 'head' ? 9 : 8, rot: Math.random() * 6, seed: (Math.random() * 1e6) | 0, a: 0, kind: kind || 'egg', col });
      if (this.splats.length > 8) this.splats.shift();
    }

    update(dt) {
      this.t += dt;
      this.poseT += dt;
      this.blinkIn -= dt;
      if (this.blinkIn <= 0) {
        this.blinkT = 0.13;
        this.blinkIn = 1.8 + Math.random() * 3.5;
      }
      if (this.blinkT > 0) this.blinkT -= dt;
      if (this.loadT < 1) this.loadT = Math.min(1, this.loadT + dt * 3);
      this.recoil = Math.max(0, this.recoil - dt * 4);
      this.dispHp += (this.hp - this.dispHp) * Math.min(1, dt * 6);
      this.splats.forEach((s) => (s.a = Math.min(1, s.a + dt * 8)));
      const transient = { shoot: 0.55, hit: 1.1, frustrated: 1.6, cheer: 1.2, bossThrow: 0.75, momThrow: 0.4 };
      if (this.hitFx) transient.hit = 1.8;
      if (transient[this.pose] && this.poseT > transient[this.pose]) {
        if (this.pose === 'hit') this.hitFx = null;
        this.setPose('idle');
      }
      if (this.pose === 'lose') {
        if (this.poseT > 2.1) {
          this.alpha = Math.max(0, 1 - (this.poseT - 2.1) * 3.5);
          if (this.alpha <= 0) {
            this.pose = 'gone';
            this.visible = false;
            this.solid = false;
          }
        }
      }
    }

    /** derive drawable pose parameters */
    computePose() {
      const d = this.def, t = this.t, pt = this.poseT;
      const S = {
        rot: 0, ox: 0, oy: 0, sx: 1, sy: 1, headRot: 0,
        eyes: 'open', mouth: d.mouth, brow: 'normal', lookX: 0.6, lookY: 0,
        mode: 'sling', front: null, back: null, slingUp: [0, -1], legKick: 0,
        blush: 0, sweat: false, bubble: null, scribble: false, stars: false,
      };
      const breath = Math.sin(t * 2.4);
      S.sy = 1 + breath * 0.012;
      S.sx = 1 - breath * 0.006;
      S.headRot = Math.sin(t * 1.1) * 0.02;
      if (this.lookTarget) {
        const dx = (this.lookTarget.x - this.pos.x) * this.facing;
        const dy = this.lookTarget.y - (this.pos.y + HEAD_Y * this.k);
        const l = Math.hypot(dx, dy) || 1;
        S.lookX = U.clamp(dx / l, -1, 1);
        S.lookY = U.clamp(dy / l, -1, 1) * 0.8;
      }
      switch (this.pose) {
        case 'aim': {
          const p = this.aim ? this.aim.power : 0;
          S.eyes = p > 0.15 ? 'squint' : 'open';
          S.mouth = p > 0.65 ? 'grit' : p > 0.3 ? 'flat' : d.mouth;
          S.brow = 'focus';
          if (this.aim) {
            S.lookX = this.aim.dir[0] * this.facing;
            S.lookY = this.aim.dir[1] * 0.7;
          }
          S.sx = 1 - p * 0.03;
          break;
        }
        case 'shoot':
          S.eyes = pt < 0.25 ? 'wide' : 'open';
          S.mouth = 'o';
          S.brow = 'raised';
          S.oy = -Math.sin(Math.min(1, pt / 0.3) * Math.PI) * 4;
          break;
        case 'hit': {
          const k = Math.max(0, 1 - pt / 0.9);
          S.rot = -Math.sin(pt * 22) * 0.22 * k - 0.1 * k;
          S.ox = -Math.sin(pt * 30) * 3 * k;
          S.eyes = pt < 0.45 ? 'x' : 'dizzy';
          S.mouth = pt < 0.45 ? 'bigO' : 'wavy';
          S.brow = 'worried';
          S.sy = 1 - 0.08 * k * Math.abs(Math.sin(pt * 18));
          S.mode = 'free';
          S.front = [30, -84 + Math.sin(pt * 25) * 6];
          S.back = [-31, -80 + Math.cos(pt * 25) * 6];
          S.slingUp = [0.6, -0.8];
          S.stars = true;
          const fx = this.hitFx;
          if (fx === 'planets') {
            // the globe sends you spinning around the world
            S.spin = -U.easeInOutCubic(U.clamp(pt / 0.9, 0, 1)) * U.TAU;
            S.oy = -Math.sin(U.clamp(pt / 0.9, 0, 1) * Math.PI) * 26;
          } else if (fx === 'notes') {
            // strummed like a guitar string
            S.ox = Math.sin(pt * 70) * 4 * Math.max(0, 1 - pt / 1.4);
            S.sx = 1 + Math.sin(pt * 70) * 0.04 * Math.max(0, 1 - pt / 1.4);
            S.mouth = pt < 0.45 ? 'bigO' : 'o';
          } else if (fx === 'choco' && pt > 0.5) {
            // sugar rush: dizzy but delighted
            S.eyes = 'happy';
            S.mouth = 'grin';
            S.blush = 0.35;
            S.brow = 'raised';
            S.oy = -Math.abs(Math.sin(pt * 12)) * 6;
          } else if (fx === 'paint') {
            S.eyes = pt < 0.6 ? 'wide' : 'dizzy';
            S.mouth = pt < 0.6 ? 'bigO' : 'wavy';
          }
          break;
        }
        case 'frustrated':
          S.headRot = Math.sin(pt * 14) * 0.12 * Math.max(0, 1 - pt / 1.4);
          S.eyes = 'sad';
          S.mouth = 'frown';
          S.brow = 'worried';
          S.mode = 'free';
          S.front = [17, -34];
          S.back = [4, HEAD_Y - 10];
          S.slingUp = [0.4, -0.9];
          S.scribble = true;
          S.sweat = true;
          break;
        case 'cheer':
          S.oy = -Math.abs(Math.sin(pt * 9)) * 10 * Math.max(0, 1 - pt / 1.2);
          S.eyes = 'happy';
          S.mouth = 'grin';
          S.brow = 'raised';
          S.mode = 'free';
          S.front = [16, -94 - Math.abs(Math.sin(pt * 9)) * 6];
          S.back = [-14, -40];
          S.slingUp = [0.3, -1];
          S.blush = 0.15;
          break;
        case 'think':
          S.eyes = Math.floor(pt * 1.6) % 2 ? 'open' : 'squint';
          S.lookX = 0.4;
          S.lookY = -0.9;
          S.mouth = 'flat';
          S.brow = 'raised';
          S.mode = 'free';
          S.front = [18, -34];
          S.back = [7, HEAD_Y + 20];
          S.slingUp = [0.25, -1];
          S.bubble = pt;
          break;
        case 'victory': {
          const b = Math.abs(Math.sin(pt * 7));
          S.oy = -b * 16;
          S.rot = Math.sin(pt * 3.5) * 0.12;
          S.eyes = 'happy';
          S.mouth = 'grin';
          S.brow = 'raised';
          S.blush = 0.2;
          S.mode = 'free';
          S.front = [26 + Math.sin(pt * 7) * 3, -96 - b * 4];
          S.back = [-30 - Math.cos(pt * 7) * 3, -94 + Math.sin(pt * 7) * 4];
          S.slingUp = [0.2, -1];
          S.legKick = Math.sin(pt * 7) * 5;
          break;
        }
        case 'lose': {
          const fall = U.clamp((pt - 0.35) / 0.6, 0, 1);
          S.rot = -U.easeOutBack(fall) * 1.55;
          S.eyes = pt < 0.35 ? 'wide' : 'x';
          S.mouth = pt < 0.35 ? 'bigO' : 'wavy';
          S.brow = 'worried';
          S.mode = 'free';
          S.front = [24, -70];
          S.back = [-22, -72];
          S.slingUp = [1, -0.3];
          S.ox = pt < 0.35 ? Math.sin(pt * 40) * 2 : 0;
          break;
        }
        case 'karate':
          S.mode = 'free';
          S.flyKick = true;
          S.rot = -0.3;
          S.eyes = 'squint';
          S.brow = 'angry';
          S.mouth = 'bigO';
          S.front = [30, -66];
          S.back = [-26, -84];
          break;
        case 'momThrow': {
          const k = U.clamp(pt / 0.4, 0, 1);
          S.mode = 'free';
          S.eyes = 'happy';
          S.mouth = 'grin';
          S.front = k < 0.45 ? [-6, -92] : [34, -66];
          S.back = [-20, -46];
          S.rot = k < 0.45 ? -0.06 : 0.06;
          break;
        }
        case 'bossThrow': {
          const k = U.clamp(pt / 0.75, 0, 1);
          S.mode = 'free';
          S.eyes = k < 0.5 ? 'squint' : 'wide';
          S.brow = 'angry';
          S.mouth = k < 0.5 ? 'grit' : 'bigO';
          S.front = k < 0.5 ? [-4, -104] : [38, -68];
          S.back = [-26, -42];
          S.rot = k < 0.5 ? -0.08 : 0.08;
          break;
        }
        default: {
          // idle
          if (this.isActive) S.brow = 'normal';
        }
      }
      if (d.noSling && S.mode === 'sling') {
        S.mode = 'free';
        if (d.id === 'ima') {
          // karate ready stance
          S.front = [24, -48 + Math.sin(t * 6) * 2];
          S.back = [-12, -52];
          S.brow = 'raised';
        } else {
          // the boss rocks out instead of holding a slingshot
          S.front = [36, -86 + Math.sin(t * 5) * 6];
          S.back = [-25, -42];
          S.mouth = 'grin';
          S.brow = 'angry';
        }
      }
      if (this.blinkT > 0 && (S.eyes === 'open' || S.eyes === 'sad')) S.eyes = 'closed';
      return S;
    }

    draw(ctx, opts) {
      if (!this.visible) return;
      opts = opts || {};
      const d = this.def;
      const S = this.computePose();
      ctx.save();
      ctx.globalAlpha *= this.alpha;
      // ground shadow
      if (!opts.noShadow) {
        ctx.beginPath();
        ctx.ellipse(this.pos.x, this.pos.y, (22 + S.oy * 0.3) * this.k, 5, 0, 0, U.TAU);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fill();
      }
      ctx.save();
      ctx.translate(this.pos.x + S.ox * this.facing, this.pos.y + S.oy);
      ctx.scale(this.facing, 1);
      ctx.rotate(S.rot);
      const spin = (S.spin || 0) - (this.roll || 0);
      if (spin) {
        // spins and knockback tumbles turn around the middle of the body
        ctx.translate(0, -48 * this.k);
        ctx.rotate(spin);
        ctx.translate(0, 48 * this.k);
      }
      ctx.scale(S.sx * this.k, S.sy * this.k);
      ctx.lineJoin = 'round';

      // ---- slingshot geometry in local space
      let A, dir, P, power = 0;
      if (S.mode === 'sling') {
        if (this.pose === 'aim' && this.aim) {
          A = [((this.aim.anchor[0] - this.pos.x) * this.facing) / this.k, (this.aim.anchor[1] - this.pos.y) / this.k];
          dir = [this.aim.dir[0] * this.facing, this.aim.dir[1]];
          power = this.aim.power;
          const pull = power * 72;
          P = [A[0] - dir[0] * pull, A[1] - dir[1] * pull];
        } else {
          A = [AX + this.recoil * 6, AY - this.recoil * 2];
          dir = [0.985, -0.17];
          P = [A[0] - 1, A[1]];
          if (this.pose === 'shoot') P = [A[0] + Math.sin(this.poseT * 40) * 4 * Math.max(0, 1 - this.poseT * 3), A[1]];
        }
      } else {
        const fu = S.slingUp, l = Math.hypot(fu[0], fu[1]);
        const u = [fu[0] / l, fu[1] / l];
        dir = [-u[1], u[0]];
        A = [S.front[0] + u[0] * 26, S.front[1] + u[1] * 26];
        P = [A[0] - dir[0] * 2 - u[0] * -4, A[1] - dir[1] * 2 + 4];
      }
      const g = slingGeom(A, dir);
      const sling = !d.noSling;
      const front = S.mode === 'sling' ? g.G : S.front;
      const back = S.mode === 'sling' ? (this.loaded || this.pose === 'aim' ? P : [P[0] - 6, P[1] + 8]) : S.back;

      const headXf = () => {
        ctx.translate(0, -60);
        ctx.rotate(S.headRot);
        ctx.translate(0, 60);
      };
      ctx.save();
      headXf();
      drawHeadBack(ctx, d);
      ctx.restore();
      drawLegs(ctx, d, S);
      drawTorso(ctx, d);
      // back arm (pulling hand) – over torso; raised arms go over the head
      const backHigh = S.mode === 'free' && back[1] < -66;
      if (!backHigh) drawArm(ctx, d, d.muscular ? SH_B_M : SH_B, back, true);
      ctx.save();
      headXf();
      drawHead(ctx, d, S);
      // egg splats stuck on character
      this.splats.forEach((s) => {
        if (s.y < -60) {
          ctx.save();
          ctx.scale(s.a, s.a);
          if (s.kind !== 'egg') ELSTER.drawColorSplat(ctx, s.x / s.a, s.y / s.a, s.r * 0.8, s.rot, s.seed, s.col, 0.95);
          else drawSplat(ctx, s.x / s.a, s.y / s.a, s.r, s.rot, s.seed, 0.95);
          ctx.restore();
        }
      });
      ctx.restore();
      if (backHigh) drawArm(ctx, d, d.muscular ? SH_B_M : SH_B, back, false);
      this.splats.forEach((s) => {
        if (s.y < -60) return;
        if (s.kind !== 'egg') ELSTER.drawColorSplat(ctx, s.x, s.y, s.r * s.a * 0.8, s.rot, s.seed, s.col, 0.95);
        else drawSplat(ctx, s.x, s.y, s.r * s.a, s.rot, s.seed, 0.95);
      });

      // bands + egg + fork
      const stretch = power;
      if (sling) drawBand(ctx, g.T2, P, stretch);
      if (sling && (this.loaded || this.pose === 'aim')) {
        drawPouch(ctx, P, dir);
        const es = this.loadT < 1 ? U.easeOutBack(this.loadT) : 1;
        if (this.armed && this.weapon) ELSTER.drawWeapon(ctx, this.weapon, P[0], P[1], Math.atan2(dir[1], dir[0]) + Math.PI / 2, 0.8 * es, this.t);
        else drawEgg(ctx, P[0], P[1], Math.atan2(dir[1], dir[0]) + Math.PI / 2, 0.92 * es);
      }
      if (sling) {
        drawBand(ctx, g.T1, P, stretch);
        drawFork(ctx, g);
      } else if (d.id === 'ima' && ELSTER.drawGush && (this.pose !== 'momThrow' || this.poseT < 0.18) && this.pose !== 'karate') {
        ELSTER.drawGush(ctx, front[0] + 2, front[1] - 6, 0.3, 0.75);
      } else if (this.fireCol && (this.pose === 'bossThrow' ? this.poseT < 0.375 : true)) {
        // a fireball burning in the boss's hand
        const fx = front[0], fy = front[1] - 8;
        const fl = 1 + Math.sin(this.t * 25) * 0.12;
        const gr = ctx.createRadialGradient(fx, fy, 1, fx, fy, 13 * fl);
        gr.addColorStop(0, '#ffffff');
        gr.addColorStop(0.35, this.fireCol);
        gr.addColorStop(1, U.rgba(this.fireCol, 0));
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(fx, fy, 13 * fl, 0, U.TAU);
        ctx.fill();
      }
      drawArm(ctx, d, d.muscular ? SH_F_M : SH_F, front, true);
      ctx.restore();

      // overlays in world space (not flipped)
      const hx = this.pos.x, hy = this.pos.y + (HEAD_Y - 36) * this.k + S.oy;
      if (S.bubble != null) this.drawThought(ctx, hx + this.facing * 20, hy - 10, S.bubble);
      if (S.scribble) this.drawGrawlix(ctx, hx + this.facing * 4, hy - 8);
      if (S.stars) this.drawStars(ctx, hx, hy + 6);
      ctx.restore();
    }

    drawThought(ctx, x, y, t) {
      ctx.save();
      const a = U.clamp(t * 4, 0, 1);
      ctx.globalAlpha *= a;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 2.2;
      [[-14, 26, 3], [-8, 16, 5]].forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(x + dx * this.facing, y + dy, r, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
      });
      const pts = U.blobPoints(x + 8 * this.facing, y - 6, 20, 9, 0.08, U.rng(5));
      U.blobPath(ctx, pts);
      ctx.fill();
      ctx.stroke();
      // animated dots + tiny parabola doodle
      const n = Math.floor(t * 3) % 4;
      ctx.fillStyle = OUT;
      for (let i = 0; i < 3; i++) {
        if (i < n) {
          ctx.beginPath();
          ctx.arc(x + 8 * this.facing + (i - 1) * 8, y - 2, 2.4, 0, U.TAU);
          ctx.fill();
        }
      }
      ctx.beginPath();
      ctx.moveTo(x + 8 * this.facing - 11, y - 10);
      ctx.quadraticCurveTo(x + 8 * this.facing, y - 24, x + 8 * this.facing + 11, y - 10);
      ctx.setLineDash([2, 2.5]);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#e76f51';
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    drawGrawlix(ctx, x, y) {
      ctx.save();
      const t = this.poseT;
      ctx.globalAlpha *= U.clamp(t * 5, 0, 1) * U.clamp((1.6 - t) * 3, 0, 1);
      const pts = U.blobPoints(x, y - 4, 16, 10, 0.25, U.rng(9));
      U.blobPath(ctx, pts);
      ctx.fillStyle = '#4b4453';
      ctx.fill();
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 2;
      ctx.stroke();
      // scribbles
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 14; i++) {
        const a = i * 1.9 + t * 9;
        const px = x + Math.cos(a) * 8, py = y - 4 + Math.sin(a * 1.3) * 6;
        if (!i) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = '#ff6b6b';
      ctx.font = '900 10px Rubik, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('#!', x + 9, y - 10);
      ctx.restore();
    }

    drawStars(ctx, x, y) {
      const t = this.poseT;
      if (this.hitFx && ELSTER.WEAPONS) {
        if (t > 1.7) return;
        const fx = this.hitFx;
        const kindOf = { notes: 'note', planets: 'planet', choco: 'candy', paint: 'paint' };
        const w = ELSTER.WEAPONS[{ notes: 'guitar', planets: 'globe', choco: 'choco', paint: 'brush' }[fx]];
        ctx.save();
        for (let i = 0; i < 5; i++) {
          const a = t * 6 + (i * U.TAU) / 5;
          const p = { kind: kindOf[fx], x: x + Math.cos(a) * 28, y: y + Math.sin(a) * 9, vx: Math.cos(a + 1.6), vy: Math.sin(a + 1.6), rot: Math.sin(t * 5 + i) * 0.4, s: 5.5, col: w.cols[i % w.cols.length] };
          ctx.save();
          ELSTER.drawFunParticle(ctx, p);
          ctx.restore();
        }
        ctx.restore();
        return;
      }
      if (t > 1.0) return;
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const a = t * 7 + (i * U.TAU) / 4;
        const px = x + Math.cos(a) * 24, py = y + Math.sin(a) * 7;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(a * 2);
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const r = k % 2 ? 2.6 : 6;
          const aa = (k / 10) * U.TAU;
          ctx.lineTo(Math.cos(aa) * r, Math.sin(aa) * r);
        }
        ctx.closePath();
        ctx.fillStyle = '#ffd84d';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  }
  ELSTER.Character = Character;
  ELSTER.CHAR_GEOM = { HEAD_Y, AX, AY };

  /** Draw a character portrait (for menus / HUD) into a 2D context */
  ELSTER.drawPortrait = function (ctx, id, w, h, opts) {
    opts = opts || {};
    const ch = opts.char || new Character(id);
    ch.pos.x = 0;
    ch.pos.y = 0;
    ch.facing = opts.facing || 1;
    ctx.save();
    const s = opts.scale || h / 130;
    ctx.translate(w / 2 + (opts.dx || 0) * s, h - (opts.bottom || 6) * s);
    // head-shot portraits show every character's face at the same size
    const n = opts.normalize ? 1 / (ch.def.scale || 1) : 1;
    ctx.scale(s * n, s * n);
    ch.draw(ctx, { noShadow: opts.noShadow });
    ctx.restore();
    return ch;
  };
})();
