/* חביתת אלסטר – secret weapons: one use per stage, bigger hit area, more damage */
(function () {
  'use strict';
  const U = ELSTER.U;
  const OUT = '#2a1b26';

  const WEAPONS = (ELSTER.WEAPONS = {
    guitar: { name: 'גיטרה', owner: 'yair', hitR: 26, trail: 'note', fx: 'notes', cols: ['#ffd166', '#06d6a0', '#ff5d8f', '#4cc9f0', '#ffffff'] },
    globe: { name: 'גלובוס', owner: 'shiri', hitR: 26, trail: 'plane', fx: 'planets', cols: ['#ffffff', '#ffd166', '#8ecae6'] },
    choco: { name: 'שוקולד', owner: 'adi', hitR: 26, trail: 'candy', fx: 'choco', cols: ['#ff5d8f', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#ff8c42'] },
    brush: { name: 'מכחול צבעים', owner: 'roni', hitR: 26, trail: 'paint', fx: 'paint', cols: ['#ff4d6d', '#ffb703', '#ffe14d', '#06d6a0', '#3a86ff', '#9b5de5'] },
  });
  ELSTER.WEAPON_OF = { yair: 'guitar', shiri: 'globe', adi: 'choco', roni: 'brush' };
  ELSTER.WEAPON_DAMAGE = { head: 50, body: 35, splash: 20 };
  ELSTER.WEAPON_SPLASH_R = 130;

  function fillOut(ctx, fill, w) {
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = w || 2.2;
    ctx.strokeStyle = OUT;
    ctx.stroke();
  }

  // ------------------------------------------------------------------ weapon art (centered, ~44 units long)
  const ART = {
    guitar(ctx) {
      ctx.rotate(-0.5);
      // neck + headstock
      U.rr(ctx, -2.6, -30, 5.2, 24, 1.5);
      fillOut(ctx, '#6b3f1f');
      U.rr(ctx, -4.2, -37, 8.4, 8, 2);
      fillOut(ctx, '#4a2a12');
      ctx.fillStyle = '#e6ebf0';
      [-32, -34.5].forEach((y) => {
        ctx.fillRect(-6, y, 2.2, 1.6);
        ctx.fillRect(3.8, y, 2.2, 1.6);
      });
      // body (figure-8)
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, U.TAU);
      ctx.moveTo(11.5 + 0, 12);
      ctx.arc(0, 12, 11.5, 0, U.TAU);
      ctx.fillStyle = OUT;
      ctx.lineWidth = 4.4;
      ctx.strokeStyle = OUT;
      ctx.stroke();
      const g = ctx.createRadialGradient(-3, 6, 2, 0, 8, 18);
      g.addColorStop(0, '#ffc46b');
      g.addColorStop(1, '#d9772b');
      ctx.fillStyle = g;
      ctx.fill();
      // sound hole + bridge
      ctx.beginPath();
      ctx.arc(0, 4.5, 3.6, 0, U.TAU);
      ctx.fillStyle = '#3a1d0c';
      ctx.fill();
      ctx.fillStyle = '#4a2a12';
      ctx.fillRect(-4.5, 15, 9, 2.4);
      // strings
      ctx.strokeStyle = 'rgba(240,240,240,0.9)';
      ctx.lineWidth = 0.6;
      for (let i = -1.5; i <= 1.5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i, -33);
        ctx.lineTo(i, 16);
        ctx.stroke();
      }
    },
    globe(ctx, t) {
      const r = 15;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, U.TAU);
      const g = ctx.createRadialGradient(-5, -5, 2, 0, 0, r);
      g.addColorStop(0, '#7fd3ff');
      g.addColorStop(1, '#1d6fd1');
      fillOut(ctx, g, 2.6);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r - 1, 0, U.TAU);
      ctx.clip();
      // continents slide as the globe spins
      const sh = ((t || 0) * 14) % 40 - 20;
      ctx.fillStyle = '#4caf50';
      [[sh - 4, -5, 7, 5], [sh + 7, 4, 5, 7], [sh - 10, 7, 4, 3], [sh + 20, -6, 6, 4], [sh - 24, 2, 5, 6], [sh + 30, 5, 5, 6]].forEach(([x, y, w, h]) => {
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, 0.4, 0, U.TAU);
        ctx.fill();
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.35, 0, 0, U.TAU);
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.stroke();
      ctx.restore();
      // golden meridian ring
      ctx.beginPath();
      ctx.arc(0, 0, r + 3.5, -2.4, 0.8);
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = '#e9b949';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-5, -6, 3.2, 0, U.TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
    },
    choco(ctx) {
      ctx.rotate(0.2);
      // chocolate bar
      U.rr(ctx, -10, -15, 20, 30, 2.5);
      fillOut(ctx, '#6b3a1f', 2.4);
      ctx.fillStyle = '#8a4f2b';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
        U.rr(ctx, -8 + c * 8.5, -13 + r * 6.8, 7, 5.6, 1.2);
        ctx.fill();
      }
      // bite mark
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      [[-10, -15, 3.6], [-6.5, -15.5, 3]].forEach(([x, y, rr]) => {
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, U.TAU);
        ctx.fill();
      });
      ctx.restore();
      // foil wrapper on the lower half
      ctx.beginPath();
      ctx.moveTo(-11, 3);
      ctx.lineTo(11, 1);
      ctx.lineTo(11, 16);
      ctx.lineTo(-11, 16);
      ctx.closePath();
      const g = ctx.createLinearGradient(-11, 0, 11, 0);
      g.addColorStop(0, '#e63946');
      g.addColorStop(0.5, '#ff6b6b');
      g.addColorStop(1, '#b5172a');
      fillOut(ctx, g, 2.4);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-11, 8, 22, 3);
      ctx.beginPath();
      ctx.moveTo(-11, 2.6);
      ctx.lineTo(11, 0.6);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#f0f0f0';
      ctx.stroke();
    },
    brush(ctx, t) {
      ctx.rotate(-0.7);
      // handle
      ctx.beginPath();
      ctx.moveTo(-2.4, 4);
      ctx.lineTo(-3.4, 30);
      ctx.quadraticCurveTo(0, 34, 3.4, 30);
      ctx.lineTo(2.4, 4);
      ctx.closePath();
      fillOut(ctx, '#ffb3c6', 2.2);
      ctx.fillStyle = '#ff5d8f';
      ctx.fillRect(-3, 18, 6, 3);
      // ferrule
      U.rr(ctx, -4, -4, 8, 9, 1.5);
      fillOut(ctx, '#cfd6de', 2.2);
      // bristles with rainbow paint
      ctx.beginPath();
      ctx.moveTo(-4.5, -4);
      ctx.quadraticCurveTo(-6, -14, 0, -22);
      ctx.quadraticCurveTo(6, -14, 4.5, -4);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -22, 0, -4);
      const cols = WEAPONS.brush.cols;
      const off = ((t || 0) * 0.8) % 1;
      cols.forEach((c, i) => g.addColorStop(((i / cols.length) + off) % 1, c));
      g.addColorStop(1, cols[0]);
      fillOut(ctx, g, 2.2);
    },
  };

  /** draw a weapon at (x,y) */
  ELSTER.drawWeapon = function (ctx, kind, x, y, rot, s, t) {
    if (!ART[kind]) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(s || 1, s || 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ART[kind](ctx, t);
    ctx.restore();
  };

  /** weapon icon in a small HUD canvas */
  ELSTER.drawWeaponIcon = function (canvas, kind, dim) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.globalAlpha = dim ? 0.35 : 1;
    const s = canvas.width / 52;
    ELSTER.drawWeapon(ctx, kind, canvas.width / 2, canvas.height / 2 + 2 * s, 0, s, 0);
    ctx.restore();
  };

  // ------------------------------------------------------------------ colored splat (chocolate / paint)
  ELSTER.drawColorSplat = function (ctx, x, y, r, rot, seed, col, alpha) {
    const rnd = U.rng(seed);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.globalAlpha *= alpha == null ? 1 : alpha;
    const pts = U.blobPoints(0, 0, r * 1.2, 10, 0.35, rnd);
    U.blobPath(ctx, pts);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = U.shade(col, -0.35);
    ctx.stroke();
    // drips
    for (let i = 0; i < 3; i++) {
      const dx = (rnd() - 0.5) * r * 1.4, len = r * (0.5 + rnd() * 0.9);
      ctx.beginPath();
      ctx.moveTo(dx - r * 0.15, 0);
      ctx.lineTo(dx - r * 0.12, len);
      ctx.arc(dx, len, r * 0.13, Math.PI, 0, true);
      ctx.lineTo(dx + r * 0.15, 0);
      ctx.fillStyle = col;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.28, r * 0.14, -0.5, 0, U.TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
    ctx.restore();
  };

  // ------------------------------------------------------------------ particles
  /** particle kinds drawn by Particles: note, candy, paint, plane */
  ELSTER.drawFunParticle = function (ctx, p) {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot || 0);
    const s = p.s;
    ctx.lineJoin = 'round';
    switch (p.kind) {
      case 'note': {
        ctx.fillStyle = p.col;
        ctx.strokeStyle = OUT;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.62, s * 0.45, -0.4, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.55, -s * 0.15);
        ctx.lineTo(s * 0.55, -s * 1.9);
        ctx.quadraticCurveTo(s * 1.2, -s * 1.5, s * 1.1, -s * 0.9);
        ctx.lineWidth = 2;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = p.col;
        ctx.stroke();
        break;
      }
      case 'candy': {
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, 0);
        ctx.lineTo(-s * 1.4, -s * 0.55);
        ctx.lineTo(-s * 1.4, s * 0.55);
        ctx.closePath();
        ctx.moveTo(s * 0.7, 0);
        ctx.lineTo(s * 1.4, -s * 0.55);
        ctx.lineTo(s * 1.4, s * 0.55);
        ctx.closePath();
        ctx.fillStyle = U.shade(p.col, 0.3);
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.75, 0, U.TAU);
        ctx.fillStyle = p.col;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.42, 0.3, 4.2);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        break;
      }
      case 'paint': {
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, U.TAU);
        ctx.fillStyle = p.col;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 0.3, s * 0.3, 0, U.TAU);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();
        break;
      }
      case 'plane': {
        ctx.rotate(Math.atan2(p.vy, p.vx) - (p.rot || 0));
        ctx.beginPath();
        ctx.moveTo(s * 1.4, 0);
        ctx.lineTo(-s, -s * 0.8);
        ctx.lineTo(-s * 0.5, 0);
        ctx.lineTo(-s, s * 0.8);
        ctx.closePath();
        ctx.fillStyle = p.col;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 1.4, 0);
        ctx.lineTo(-s * 0.5, 0);
        ctx.stroke();
        break;
      }
      case 'planet': {
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, U.TAU);
        ctx.fillStyle = p.col;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 1.8, s * 0.5, -0.4, 0, U.TAU);
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        break;
      }
    }
  };

  const R = U.rand;
  /** called every few physics steps while a weapon flies */
  ELSTER.weaponTrail = function (particles, kind, x, y, vx, vy) {
    const w = WEAPONS[kind];
    const n = kind === 'paint' || kind === 'brush' ? 2 : 1;
    for (let i = 0; i < n; i++) {
      particles.add({
        kind: w.trail, x: x + R.range(-8, 8), y: y + R.range(-8, 8),
        vx: -vx * 0.08 + R.range(-40, 40), vy: -vy * 0.08 + R.range(-50, 10),
        g: w.trail === 'plane' ? -20 : w.trail === 'note' ? -60 : 260,
        s: R.range(4, 7), rot: R.range(-0.6, 0.6), vr: w.trail === 'candy' ? R.range(-8, 8) : R.range(-1, 1),
        life: R.range(0.7, 1.2), col: R.pick(w.cols),
      });
    }
  };

  /** big celebratory burst on impact */
  ELSTER.weaponBurst = function (particles, kind, x, y) {
    const w = WEAPONS[kind];
    for (let i = 0; i < 26; i++) {
      const a = R() * U.TAU, v = R.range(120, 380);
      particles.add({
        kind: w.trail, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120,
        g: w.trail === 'plane' ? 60 : w.trail === 'note' ? 120 : 600,
        s: R.range(5, 9), rot: R() * 6, vr: R.range(-8, 8), life: R.range(0.9, 1.5), col: R.pick(w.cols),
      });
    }
    if (kind === 'globe') {
      for (let i = 0; i < 6; i++) {
        const a = R() * U.TAU, v = R.range(100, 240);
        particles.add({ kind: 'planet', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 200, s: R.range(4, 7), rot: 0, vr: 0, life: 1.4, col: R.pick(['#ff8c42', '#b388ff', '#ffd166', '#06d6a0']) });
      }
    }
    particles.sparks(x, y, '#ffffff', 16);
    particles.ring(x, y, kind === 'brush' ? '#ff5d8f' : kind === 'choco' ? '#8a4f2b' : kind === 'globe' ? '#4cc9f0' : '#ffd166');
  };
})();
