/* EMG – themes, procedural arena generation, terrain rendering and collision mask */
(function () {
  'use strict';
  const U = EMG.U;
  const OUT = '#2a1b26';

  // ------------------------------------------------------------------ themes
  const THEMES = [
    {
      key: 'green', name: 'הרים ירוקים',
      sky: ['#4fb8ee', '#c4f0ff'], sun: 'sun', sunColor: '#fff2a8',
      layers: [
        { type: 'mountains', color: '#93bfe0', snow: '#eef8ff', f: 0.12, y: 560, amp: 260 },
        { type: 'hills', color: '#86c59a', f: 0.26, y: 700, amp: 120 },
        { type: 'treeline', color: '#5fa772', f: 0.42, y: 800, amp: 60 },
      ],
      ground: { top: '#5fbf45', hi: '#a6eb6c', dirt: '#a06c44', dirt2: '#5e3a22', strata: '#8a5a37', pebble: '#c79a6b' },
      obstacles: ['tree', 'rock', 'tree', 'bigTree', 'rock'], deco: ['tuft', 'flower', 'tuft', 'bush'],
      leaf: '#4caf50', leafHi: '#8ee06a', rock: '#9aa3ad', ambient: 'leaves', cloud: '#ffffff',
    },
    {
      key: 'desert', name: 'מדבר ומצוקים',
      sky: ['#ff9a4d', '#ffe6a8'], sun: 'bigsun', sunColor: '#fff0c2',
      layers: [
        { type: 'mesas', color: '#e9a06a', f: 0.12, y: 600, amp: 220 },
        { type: 'dunes', color: '#f0b978', f: 0.25, y: 760, amp: 90 },
        { type: 'mesas', color: '#d98a55', f: 0.4, y: 820, amp: 130 },
      ],
      ground: { top: '#f6cf7e', hi: '#ffe7a8', dirt: '#dc9550', dirt2: '#9c4f2a', strata: '#c2753e', pebble: '#f0b878' },
      obstacles: ['cactus', 'mesa', 'arch', 'cactus', 'rock'], deco: ['pebbles', 'drygrass', 'skull'],
      leaf: '#3f9a4d', leafHi: '#7fd27b', rock: '#c97e4a', ambient: 'sand', cloud: '#fff5e6', terrace: true,
    },
    {
      key: 'snow', name: 'הרים מושלגים',
      sky: ['#6fa8e0', '#eaf5ff'], sun: 'sun', sunColor: '#ffffff',
      layers: [
        { type: 'mountains', color: '#a9c3e6', snow: '#ffffff', f: 0.12, y: 520, amp: 320, snowLine: 0.55 },
        { type: 'mountains', color: '#8aa9d4', snow: '#f4fbff', f: 0.25, y: 680, amp: 200, snowLine: 0.5 },
        { type: 'pines', color: '#5d7fa8', f: 0.42, y: 800, amp: 60 },
      ],
      ground: { top: '#ffffff', hi: '#ffffff', dirt: '#8fa6c7', dirt2: '#4f6488', strata: '#7d93b6', pebble: '#b8c8e0' },
      obstacles: ['pine', 'iceSpike', 'pine', 'rock', 'snowman'], deco: ['snowmound', 'sparkle'],
      leaf: '#2f7a5a', leafHi: '#4fa37a', rock: '#8995a8', ambient: 'snow', cloud: '#ffffff', snowy: true,
    },
    {
      key: 'jungle', name: 'יער טרופי',
      sky: ['#2fb3a0', '#d4f7c8'], sun: 'sun', sunColor: '#fffbd0',
      layers: [
        { type: 'mountains', color: '#5fae95', snow: null, f: 0.12, y: 600, amp: 240 },
        { type: 'treeline', color: '#3f9a6c', f: 0.26, y: 720, amp: 110 },
        { type: 'treeline', color: '#2c7d52', f: 0.42, y: 820, amp: 80 },
      ],
      ground: { top: '#3fae3a', hi: '#8ee05a', dirt: '#7a4b2a', dirt2: '#3f2614', strata: '#653d22', pebble: '#9c6a42' },
      obstacles: ['palm', 'mossRock', 'palm', 'bigTree', 'mossRock'], deco: ['fern', 'flower', 'tuft', 'fern'],
      leaf: '#2e9e48', leafHi: '#76d65a', rock: '#7d8a7a', ambient: 'butterflies', cloud: '#ffffff',
    },
    {
      key: 'volcano', name: 'עולם געשי',
      sky: ['#2a0b1c', '#d9502c'], sun: 'redsun', sunColor: '#ffb36b',
      layers: [
        { type: 'volcano', color: '#4a1f26', f: 0.1, y: 640, amp: 380 },
        { type: 'mountains', color: '#3b1b21', snow: null, f: 0.25, y: 740, amp: 180 },
        { type: 'mountains', color: '#2a1418', snow: null, f: 0.4, y: 830, amp: 110 },
      ],
      ground: { top: '#4a4044', hi: '#6e6266', dirt: '#2e2427', dirt2: '#140e10', strata: '#ff6a1f', pebble: '#55484c' },
      obstacles: ['basalt', 'spike', 'basalt', 'rock'], deco: ['ember', 'crack'],
      leaf: '#555', leafHi: '#777', rock: '#4b4146', ambient: 'embers', cloud: '#6b3a3a', lava: true,
    },
    {
      key: 'night', name: 'לילה מכוכב',
      sky: ['#070b2b', '#2f3f86'], sun: 'moon', sunColor: '#fff8d6', stars: true,
      layers: [
        { type: 'mountains', color: '#26306a', snow: '#3e4a8e', f: 0.12, y: 600, amp: 250 },
        { type: 'hills', color: '#1f2a5a', f: 0.26, y: 720, amp: 110 },
        { type: 'treeline', color: '#18224a', f: 0.42, y: 820, amp: 70 },
      ],
      ground: { top: '#2f7d6a', hi: '#55b39a', dirt: '#3a2f55', dirt2: '#16122a', strata: '#4b3d6e', pebble: '#5a4c7f' },
      obstacles: ['mushroom', 'rock', 'deadTree', 'mushroom', 'rock'], deco: ['tuft', 'glowflower', 'tuft'],
      leaf: '#2f6b5a', leafHi: '#4fa38a', rock: '#59608a', ambient: 'fireflies', cloud: '#4a5590', dark: true,
    },
    {
      key: 'city', name: 'עיר צבעונית',
      sky: ['#ff6fa8', '#ffd59a'], sun: 'bigsun', sunColor: '#fff3c9',
      layers: [
        { type: 'city', color: '#c97bb0', f: 0.12, y: 760, amp: 360 },
        { type: 'city', color: '#a3609a', f: 0.26, y: 860, amp: 260 },
      ],
      ground: { top: '#59606e', hi: '#9aa1ad', dirt: '#3d4250', dirt2: '#22252e', strata: '#4a5060', pebble: '#6b7282' },
      obstacles: ['building'], deco: ['lamp', 'hydrant'],
      leaf: '#4caf50', leafHi: '#8ee06a', rock: '#999', ambient: 'none', cloud: '#fff0f5', city: true,
    },
    {
      key: 'islands', name: 'איים מרחפים',
      sky: ['#5aa9ff', '#e2f3ff'], sun: 'sun', sunColor: '#ffffff',
      layers: [
        { type: 'islands', color: '#9bbde6', f: 0.12, y: 520, amp: 200 },
        { type: 'islands', color: '#80a8d8', f: 0.26, y: 640, amp: 160 },
        { type: 'cloudsea', color: '#ffffff', f: 0.4, y: 1030, amp: 40 },
      ],
      ground: { top: '#62c94a', hi: '#a7ef72', dirt: '#8b6a8f', dirt2: '#4d3a5e', strata: '#7a5b80', pebble: '#a68bb0' },
      obstacles: ['tree', 'crystal', 'rock', 'crystal'], deco: ['tuft', 'flower'],
      leaf: '#43b14f', leafHi: '#90e86e', rock: '#9a8fb5', ambient: 'none', cloud: '#ffffff', islands: true,
    },
  ];
  EMG.THEMES = THEMES;

  // ------------------------------------------------------------------ Terrain (render canvas + mask)
  class Terrain {
    constructor(W, H) {
      this.W = W;
      this.H = H;
      this.canvas = document.createElement('canvas');
      this.canvas.width = W;
      this.canvas.height = H;
      this.ctx = this.canvas.getContext('2d');
      this.mask = null;
    }
    buildMask() {
      const { W, H } = this;
      const data = this.ctx.getImageData(0, 0, W, H).data;
      const m = (this.mask = new Uint8Array(W * H));
      for (let i = 0, j = 3; i < m.length; i++, j += 4) m[i] = data[j] > 110 ? 1 : 0;
    }
    isSolid(x, y) {
      x = x | 0;
      y = y | 0;
      if (x < 0 || x >= this.W || y < 0 || y >= this.H) return false;
      return this.mask[y * this.W + x] === 1;
    }
    surfaceY(x, fromY) {
      for (let y = Math.max(0, fromY | 0); y < this.H; y++) if (this.isSolid(x, y)) return y;
      return this.H + 500;
    }
    bakeSplat(x, y, r, rot, seed) {
      const c = this.ctx;
      c.save();
      c.globalCompositeOperation = 'source-atop';
      EMG.drawSplat(c, x, y, r, rot, seed, 1);
      c.restore();
    }
    bakeScorch(x, y, r) {
      const c = this.ctx;
      c.save();
      c.globalCompositeOperation = 'source-atop';
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(40,20,10,0.5)');
      g.addColorStop(1, 'rgba(40,20,10,0)');
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
      c.restore();
    }
  }
  EMG.Terrain = Terrain;

  // ------------------------------------------------------------------ painting helpers
  function stroke(ctx, w, c) {
    ctx.lineWidth = w;
    ctx.strokeStyle = c;
    ctx.stroke();
  }
  function fillOut(ctx, fill, w) {
    ctx.fillStyle = fill;
    ctx.fill();
    stroke(ctx, w || 4, OUT);
  }

  /** union of circles with a single outline */
  function circleCluster(ctx, circles, fill, hi) {
    ctx.beginPath();
    circles.forEach(([x, y, r]) => {
      ctx.moveTo(x + r + 3, y);
      ctx.arc(x, y, r + 3, 0, U.TAU);
    });
    ctx.fillStyle = OUT;
    ctx.fill();
    ctx.beginPath();
    circles.forEach(([x, y, r]) => {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, U.TAU);
    });
    ctx.fillStyle = fill;
    ctx.fill();
    if (hi) {
      ctx.beginPath();
      circles.forEach(([x, y, r]) => {
        ctx.moveTo(x - r * 0.25 + r * 0.55, y - r * 0.3);
        ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.55, 0, U.TAU);
      });
      ctx.fillStyle = hi;
      ctx.fill();
    }
  }

  const OB = {
    tree(ctx, x, gy, s, rnd, th) {
      const h = 150 * s;
      const tw = h * 0.11;
      ctx.beginPath();
      ctx.moveTo(x - tw, gy + 6);
      ctx.lineTo(x - tw * 0.6, gy - h * 0.55);
      ctx.lineTo(x + tw * 0.6, gy - h * 0.55);
      ctx.lineTo(x + tw, gy + 6);
      ctx.closePath();
      fillOut(ctx, '#7a4a2a', 4);
      ctx.beginPath();
      ctx.moveTo(x + tw * 0.2, gy - 6);
      ctx.lineTo(x + tw * 0.25, gy - h * 0.5);
      stroke(ctx, 3, '#a06a3d');
      const cy = gy - h * 0.7, r = h * 0.26;
      const cs = [[x, cy - r * 0.4, r], [x - r * 0.85, cy + r * 0.15, r * 0.78], [x + r * 0.85, cy + r * 0.12, r * 0.8], [x - r * 0.3, cy + r * 0.45, r * 0.7], [x + r * 0.4, cy + r * 0.5, r * 0.65]];
      circleCluster(ctx, cs, th.leaf, U.rgba(th.leafHi, 0.55));
      // fruits / dots
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x + rnd.range(-r, r), cy + rnd.range(-r * 0.6, r * 0.6), 3.5, 0, U.TAU);
        ctx.fillStyle = th.key === 'islands' ? '#ffd166' : '#ff6b6b';
        ctx.fill();
      }
      return { top: gy - h };
    },
    bigTree(ctx, x, gy, s, rnd, th) {
      return OB.tree(ctx, x, gy, s * 1.35, rnd, th);
    },
    pine(ctx, x, gy, s, rnd, th) {
      const h = 190 * s;
      U.rr(ctx, x - 8 * s, gy - h * 0.25, 16 * s, h * 0.25 + 8, 3);
      fillOut(ctx, '#6b4026', 4);
      for (let i = 0; i < 3; i++) {
        const yb = gy - h * 0.18 - i * h * 0.24;
        const w = h * (0.36 - i * 0.08);
        ctx.beginPath();
        ctx.moveTo(x - w, yb);
        ctx.lineTo(x, yb - h * 0.42);
        ctx.lineTo(x + w, yb);
        ctx.closePath();
        fillOut(ctx, th.leaf, 4);
        if (th.snowy) {
          ctx.beginPath();
          ctx.moveTo(x - w * 0.42, yb - h * 0.24);
          ctx.lineTo(x, yb - h * 0.42);
          ctx.lineTo(x + w * 0.42, yb - h * 0.24);
          ctx.quadraticCurveTo(x + w * 0.2, yb - h * 0.2, x, yb - h * 0.24);
          ctx.quadraticCurveTo(x - w * 0.2, yb - h * 0.2, x - w * 0.42, yb - h * 0.24);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }
      return { top: gy - h };
    },
    rock(ctx, x, gy, s, rnd, th) {
      const r = 46 * s;
      const pts = [];
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i / (n - 1)) * Math.PI;
        const rr = r * rnd.range(0.78, 1.12);
        pts.push([x + Math.cos(a) * rr * 1.2, gy + 10 + Math.sin(a) * rr]);
      }
      pts.push([x + r * 1.2, gy + 14], [x - r * 1.2, gy + 14]);
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      const g = ctx.createLinearGradient(x - r, gy - r, x + r, gy);
      g.addColorStop(0, U.shade(th.rock, 0.25));
      g.addColorStop(1, U.shade(th.rock, -0.3));
      ctx.lineJoin = 'round';
      fillOut(ctx, g, 4);
      // facets
      ctx.beginPath();
      ctx.moveTo(x - r * 0.4, gy - r * 0.55);
      ctx.lineTo(x - r * 0.1, gy - r * 0.1);
      ctx.lineTo(x + r * 0.5, gy - r * 0.3);
      stroke(ctx, 2.5, U.rgba('#000000', 0.18));
      ctx.beginPath();
      ctx.ellipse(x - r * 0.45, gy - r * 0.5, r * 0.22, r * 0.1, -0.5, 0, U.TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
      return { top: gy - r };
    },
    mossRock(ctx, x, gy, s, rnd, th) {
      const r = OB.rock(ctx, x, gy, s * 1.2, rnd, th);
      const rr = 46 * s * 1.2;
      ctx.beginPath();
      ctx.ellipse(x - rr * 0.15, gy - rr * 0.78, rr * 0.75, rr * 0.25, -0.1, Math.PI, 0);
      ctx.fillStyle = '#4caf50';
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const vx = x + rnd.range(-rr * 0.6, rr * 0.5);
        ctx.moveTo(vx, gy - rr * 0.75);
        ctx.quadraticCurveTo(vx + 6, gy - rr * 0.45, vx - 2, gy - rr * 0.2);
        stroke(ctx, 3, '#2e8b3d');
      }
      return r;
    },
    cactus(ctx, x, gy, s, rnd) {
      const h = 160 * s, w = 30 * s;
      const col = '#3d9a4c', hi = '#7fd27b';
      const part = (px, py, pw, ph) => {
        U.rr(ctx, px, py, pw, ph, pw / 2);
        fillOut(ctx, col, 4);
      };
      const lh = h * rnd.range(0.35, 0.55), rh = h * rnd.range(0.45, 0.7);
      // arms
      part(x - w * 1.9, gy - lh - h * 0.3, w * 0.75, h * 0.32);
      U.rr(ctx, x - w * 1.9, gy - lh - w * 0.2, w * 1.6, w * 0.7, w * 0.35);
      fillOut(ctx, col, 4);
      part(x + w * 1.15, gy - rh - h * 0.28, w * 0.75, h * 0.3);
      U.rr(ctx, x + w * 0.2, gy - rh - w * 0.2, w * 1.7, w * 0.7, w * 0.35);
      fillOut(ctx, col, 4);
      part(x - w / 2, gy - h, w, h + 8);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.15, gy - h + 10);
      ctx.lineTo(x - w * 0.15, gy - 4);
      ctx.moveTo(x + w * 0.2, gy - h + 10);
      ctx.lineTo(x + w * 0.2, gy - 4);
      stroke(ctx, 2, U.rgba('#1f5a2a', 0.6));
      ctx.beginPath();
      ctx.moveTo(x - w * 0.3, gy - h + 12);
      ctx.lineTo(x - w * 0.3, gy - h * 0.5);
      stroke(ctx, 3, U.rgba(hi, 0.8));
      // flower
      ctx.beginPath();
      ctx.arc(x, gy - h - 2, 6 * s, 0, U.TAU);
      ctx.fillStyle = '#ff5d8f';
      ctx.fill();
      return { top: gy - h };
    },
    mesa(ctx, x, gy, s, rnd, th) {
      const w = 110 * s, h = 220 * s;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.62, gy + 10);
      ctx.lineTo(x - w * 0.5, gy - h * 0.6);
      ctx.lineTo(x - w * 0.56, gy - h * 0.75);
      ctx.lineTo(x - w * 0.46, gy - h);
      ctx.lineTo(x + w * 0.48, gy - h);
      ctx.lineTo(x + w * 0.55, gy - h * 0.7);
      ctx.lineTo(x + w * 0.5, gy - h * 0.4);
      ctx.lineTo(x + w * 0.62, gy + 10);
      ctx.closePath();
      const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
      g.addColorStop(0, '#e9a56d');
      g.addColorStop(1, '#a95a32');
      ctx.lineJoin = 'round';
      fillOut(ctx, g, 4);
      ctx.save();
      ctx.clip();
      for (let i = 1; i < 7; i++) {
        ctx.beginPath();
        const y = gy - h + i * (h / 7);
        ctx.moveTo(x - w, y);
        ctx.lineTo(x + w, y + rnd.range(-6, 6));
        stroke(ctx, 4, 'rgba(120,50,20,0.25)');
      }
      ctx.fillStyle = 'rgba(255,230,180,0.6)';
      ctx.fillRect(x - w, gy - h, w * 2, 8);
      ctx.restore();
      return { top: gy - h };
    },
    arch(ctx, x, gy, s, rnd) {
      const w = 210 * s, h = 190 * s, t = 42 * s;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, gy + 10);
      ctx.lineTo(x - w / 2, gy - h * 0.55);
      ctx.bezierCurveTo(x - w / 2, gy - h * 1.08, x + w / 2, gy - h * 1.08, x + w / 2, gy - h * 0.55);
      ctx.lineTo(x + w / 2, gy + 10);
      ctx.lineTo(x + w / 2 - t, gy + 10);
      ctx.lineTo(x + w / 2 - t, gy - h * 0.5);
      ctx.bezierCurveTo(x + w / 2 - t, gy - h * 0.82, x - w / 2 + t, gy - h * 0.82, x - w / 2 + t, gy - h * 0.5);
      ctx.lineTo(x - w / 2 + t, gy + 10);
      ctx.closePath();
      const g = ctx.createLinearGradient(x, gy - h, x, gy);
      g.addColorStop(0, '#f0a66b');
      g.addColorStop(1, '#b4602f');
      ctx.lineJoin = 'round';
      fillOut(ctx, g, 4);
      ctx.save();
      ctx.clip();
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(x - w, gy - i * (h / 6));
        ctx.lineTo(x + w, gy - i * (h / 6) + 4);
        stroke(ctx, 4, 'rgba(120,50,20,0.22)');
      }
      ctx.restore();
      return { top: gy - h };
    },
    iceSpike(ctx, x, gy, s, rnd) {
      const h = 170 * s;
      const shards = [[0, 1, 26], [-26, 0.62, 18], [24, 0.7, 20], [-12, 0.4, 14], [40, 0.38, 12]];
      shards.forEach(([dx, k, w]) => {
        const sx = x + dx * s, hh = h * k;
        ctx.beginPath();
        ctx.moveTo(sx - w * s, gy + 8);
        ctx.lineTo(sx - w * 0.15 * s, gy - hh);
        ctx.lineTo(sx + w * 0.25 * s, gy - hh + 10);
        ctx.lineTo(sx + w * s, gy + 8);
        ctx.closePath();
        const g = ctx.createLinearGradient(sx - w, 0, sx + w, 0);
        g.addColorStop(0, '#e6fbff');
        g.addColorStop(0.5, '#a5e4ff');
        g.addColorStop(1, '#5fb4e8');
        ctx.lineJoin = 'round';
        fillOut(ctx, g, 3.5);
        ctx.beginPath();
        ctx.moveTo(sx - w * 0.15 * s, gy - hh + 6);
        ctx.lineTo(sx - w * 0.45 * s, gy - 6);
        stroke(ctx, 2.5, 'rgba(255,255,255,0.8)');
      });
      return { top: gy - h };
    },
    snowman(ctx, x, gy, s) {
      const r1 = 36 * s, r2 = 26 * s, r3 = 19 * s;
      const cs = [[x, gy - r1 + 6, r1], [x, gy - r1 * 2 - r2 + 14, r2], [x, gy - r1 * 2 - r2 * 2 - r3 + 20, r3]];
      circleCluster(ctx, cs, '#ffffff', 'rgba(200,225,255,0)');
      const hy = cs[2][1];
      ctx.fillStyle = OUT;
      [[-6, -4], [6, -4]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(x + dx * s, hy + dy * s, 2.5 * s, 0, U.TAU);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.moveTo(x, hy + 1);
      ctx.lineTo(x + 18 * s, hy + 4 * s);
      ctx.lineTo(x, hy + 6 * s);
      ctx.fillStyle = '#ff8c1a';
      ctx.fill();
      // hat
      U.rr(ctx, x - 14 * s, hy - r3 - 18 * s, 28 * s, 20 * s, 3);
      fillOut(ctx, '#2b2b35', 3);
      U.rr(ctx, x - 22 * s, hy - r3 + 1, 44 * s, 6 * s, 3);
      fillOut(ctx, '#2b2b35', 3);
      // scarf
      U.rr(ctx, x - r2, cs[1][1] - r2 + 6, r2 * 2, 9 * s, 4);
      fillOut(ctx, '#e63946', 3);
      return { top: hy - r3 - 20 * s };
    },
    palm(ctx, x, gy, s, rnd, th) {
      const h = 230 * s;
      const bend = rnd.range(-40, 40) * s;
      const tx = x + bend, ty = gy - h;
      const n = 12;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const px = x + bend * t * t, py = gy + 6 - h * t;
        const w = (18 - t * 7) * s;
        ctx.beginPath();
        ctx.ellipse(px, py, w, 10 * s, 0, 0, U.TAU);
        fillOut(ctx, i % 2 ? '#a7743f' : '#8e5f31', 3);
      }
      // fronds
      const fr = [[-1, 0.2], [-0.8, -0.35], [-0.3, -0.75], [0.3, -0.75], [0.8, -0.35], [1, 0.2], [0.05, -0.95]];
      fr.forEach(([dx, dy]) => {
        const L = 105 * s;
        const ex = tx + dx * L, ey = ty + dy * L * 0.6 + L * 0.3;
        const mx = tx + dx * L * 0.5, my = ty + dy * L * 0.6 - 20 * s;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(mx, my - 14 * s, ex, ey);
        ctx.quadraticCurveTo(mx, my + 14 * s, tx, ty + 4);
        fillOut(ctx, th.leaf, 3.5);
        ctx.beginPath();
        ctx.moveTo(tx, ty + 2);
        ctx.quadraticCurveTo(mx, my, ex, ey);
        stroke(ctx, 2, U.rgba(th.leafHi, 0.9));
      });
      [[-8, 8], [8, 9], [0, 14]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(tx + dx * s, ty + dy * s, 8 * s, 0, U.TAU);
        fillOut(ctx, '#6b4423', 2.5);
      });
      return { top: ty - 40 * s };
    },
    basalt(ctx, x, gy, s, rnd) {
      const cols = rnd.int(3, 5);
      const cw = 34 * s;
      let top = gy;
      for (let i = 0; i < cols; i++) {
        const h = rnd.range(110, 230) * s;
        const cx = x + (i - cols / 2) * cw;
        top = Math.min(top, gy - h);
        ctx.beginPath();
        ctx.moveTo(cx, gy + 10);
        ctx.lineTo(cx, gy - h + 8);
        ctx.lineTo(cx + cw / 2, gy - h);
        ctx.lineTo(cx + cw, gy - h + 8);
        ctx.lineTo(cx + cw, gy + 10);
        ctx.closePath();
        const g = ctx.createLinearGradient(cx, 0, cx + cw, 0);
        g.addColorStop(0, '#5a4e54');
        g.addColorStop(1, '#2b2327');
        fillOut(ctx, g, 3.5);
        ctx.beginPath();
        ctx.moveTo(cx + cw * 0.5, gy - h * 0.7);
        ctx.lineTo(cx + cw * 0.4, gy - h * 0.45);
        ctx.lineTo(cx + cw * 0.6, gy - h * 0.25);
        stroke(ctx, 2.5, '#ff7a1f');
      }
      return { top };
    },
    spike(ctx, x, gy, s, rnd) {
      const h = 160 * s;
      ctx.beginPath();
      ctx.moveTo(x - 46 * s, gy + 10);
      ctx.lineTo(x - 18 * s, gy - h * 0.55);
      ctx.lineTo(x + 4 * s, gy - h);
      ctx.lineTo(x + 20 * s, gy - h * 0.45);
      ctx.lineTo(x + 50 * s, gy + 10);
      ctx.closePath();
      const g = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
      g.addColorStop(0, '#3a3036');
      g.addColorStop(1, '#151012');
      ctx.lineJoin = 'round';
      fillOut(ctx, g, 3.5);
      ctx.beginPath();
      ctx.moveTo(x - 6 * s, gy - h * 0.7);
      ctx.lineTo(x - 18 * s, gy - h * 0.3);
      stroke(ctx, 3, 'rgba(160,120,255,0.5)');
      return { top: gy - h };
    },
    mushroom(ctx, x, gy, s, rnd) {
      const h = 120 * s, r = 52 * s;
      U.rr(ctx, x - 12 * s, gy - h, 24 * s, h + 8, 10 * s);
      fillOut(ctx, '#e8dcc8', 3.5);
      const col = rnd.pick(['#7b5cff', '#00c2d1', '#ff4fa3']);
      ctx.beginPath();
      ctx.moveTo(x - r, gy - h + 6);
      ctx.bezierCurveTo(x - r, gy - h - r * 1.2, x + r, gy - h - r * 1.2, x + r, gy - h + 6);
      ctx.quadraticCurveTo(x, gy - h - 6, x - r, gy - h + 6);
      ctx.closePath();
      fillOut(ctx, col, 4);
      [[-0.4, -0.5, 0.16], [0.25, -0.65, 0.12], [0.5, -0.25, 0.1], [-0.1, -0.2, 0.09]].forEach(([dx, dy, rr]) => {
        ctx.beginPath();
        ctx.arc(x + dx * r, gy - h + dy * r, rr * r, 0, U.TAU);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      });
      return { top: gy - h - r * 0.9, glow: { x, y: gy - h - r * 0.3, r: r * 2.2, col } };
    },
    deadTree(ctx, x, gy, s, rnd) {
      const h = 180 * s;
      const br = (x0, y0, a, L, w, d) => {
        const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineCap = 'round';
        stroke(ctx, w + 5, OUT);
        stroke(ctx, w, '#4a3b5c');
        if (d > 0) {
          br(x1, y1, a - rnd.range(0.3, 0.7), L * 0.65, w * 0.65, d - 1);
          br(x1, y1, a + rnd.range(0.3, 0.7), L * 0.65, w * 0.65, d - 1);
        }
      };
      br(x, gy + 8, -Math.PI / 2, h * 0.45, 20 * s, 3);
      return { top: gy - h };
    },
    crystal(ctx, x, gy, s, rnd) {
      const col = rnd.pick(['#b388ff', '#64d8ff', '#ff80c8']);
      [[0, 1, 0], [-22, 0.6, -0.35], [22, 0.7, 0.3]].forEach(([dx, k, a]) => {
        const h = 140 * s * k, w = 20 * s;
        ctx.save();
        ctx.translate(x + dx * s, gy + 8);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(-w, 0);
        ctx.lineTo(-w, -h * 0.75);
        ctx.lineTo(0, -h);
        ctx.lineTo(w, -h * 0.75);
        ctx.lineTo(w, 0);
        ctx.closePath();
        const g = ctx.createLinearGradient(-w, 0, w, 0);
        g.addColorStop(0, U.shade(col, 0.5));
        g.addColorStop(1, U.shade(col, -0.25));
        ctx.lineJoin = 'round';
        fillOut(ctx, g, 3.5);
        ctx.beginPath();
        ctx.moveTo(-w * 0.3, -h * 0.85);
        ctx.lineTo(-w * 0.3, -h * 0.15);
        stroke(ctx, 3, 'rgba(255,255,255,0.7)');
        ctx.restore();
      });
      return { top: gy - 140 * s };
    },
    building(ctx, x, gy, s, rnd, th, opts) {
      opts = opts || {};
      const w = opts.w || rnd.range(120, 200);
      const h = opts.h || 200 * s;
      const col = opts.col || rnd.pick(['#ff8fab', '#ffc857', '#6fd3c1', '#8ab6ff', '#c39bff', '#ff9e6b']);
      const x0 = x - w / 2, y0 = gy - h;
      ctx.beginPath();
      ctx.rect(x0, y0, w, h + 12);
      const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
      g.addColorStop(0, U.shade(col, 0.15));
      g.addColorStop(1, U.shade(col, -0.2));
      fillOut(ctx, g, 4);
      // roof ledge
      ctx.beginPath();
      ctx.rect(x0 - 6, y0 - 4, w + 12, 12);
      fillOut(ctx, U.shade(col, -0.35), 4);
      // windows
      const cols = Math.max(2, Math.floor(w / 34)), rows = Math.max(1, Math.floor((h - 40) / 42));
      const gx = w / cols;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = x0 + c * gx + gx * 0.22, wy = y0 + 26 + r * 42;
          U.rr(ctx, wx, wy, gx * 0.56, 24, 3);
          ctx.fillStyle = rnd() < 0.45 ? '#fff3a8' : '#3e4a6b';
          ctx.fill();
          stroke(ctx, 2.5, OUT);
        }
      }
      if (!opts.flat && rnd() < 0.5) {
        // water tower / antenna
        const ax = x0 + w * rnd.range(0.25, 0.75);
        ctx.beginPath();
        ctx.moveTo(ax, y0 - 4);
        ctx.lineTo(ax, y0 - 50);
        stroke(ctx, 7, OUT);
        stroke(ctx, 3, '#ddd');
        ctx.beginPath();
        ctx.arc(ax, y0 - 52, 5, 0, U.TAU);
        ctx.fillStyle = '#ff4d4d';
        ctx.fill();
      }
      return { top: y0 - 8 };
    },
  };

  // decorations (non-solid; baked after the mask)
  const DECO = {
    tuft(ctx, x, y, th, rnd) {
      ctx.lineCap = 'round';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 3, y + 2);
        ctx.quadraticCurveTo(x + i * 4, y - 8, x + i * 6 + rnd.range(-2, 2), y - rnd.range(10, 18));
        stroke(ctx, 3, i % 2 ? th.ground.top : th.ground.hi);
      }
    },
    flower(ctx, x, y, th, rnd) {
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x, y - 16);
      stroke(ctx, 2.5, '#2e7d32');
      const c = rnd.pick(['#ff5d8f', '#ffd166', '#ffffff', '#b388ff', '#ff8c42']);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * U.TAU;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 4.5, y - 16 + Math.sin(a) * 4.5, 3.5, 0, U.TAU);
        ctx.fillStyle = c;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y - 16, 2.8, 0, U.TAU);
      ctx.fillStyle = '#ffb703';
      ctx.fill();
    },
    glowflower(ctx, x, y, th, rnd) {
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x, y - 14);
      stroke(ctx, 2.5, '#2b6b5a');
      const g = ctx.createRadialGradient(x, y - 14, 0, x, y - 14, 14);
      g.addColorStop(0, 'rgba(140,255,230,0.9)');
      g.addColorStop(1, 'rgba(140,255,230,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 14, y - 28, 28, 28);
      ctx.beginPath();
      ctx.arc(x, y - 14, 3.5, 0, U.TAU);
      ctx.fillStyle = '#c8fff2';
      ctx.fill();
    },
    bush(ctx, x, y, th, rnd) {
      circleCluster(ctx, [[x - 14, y - 8, 13], [x + 2, y - 14, 16], [x + 18, y - 7, 12]], th.leaf, U.rgba(th.leafHi, 0.5));
    },
    fern(ctx, x, y, th, rnd) {
      for (let i = -2; i <= 2; i++) {
        const a = -Math.PI / 2 + i * 0.45;
        ctx.beginPath();
        ctx.moveTo(x, y + 2);
        ctx.quadraticCurveTo(x + Math.cos(a) * 20, y + Math.sin(a) * 30, x + Math.cos(a) * 34, y + Math.sin(a) * 26 + 8);
        ctx.lineCap = 'round';
        stroke(ctx, 6, OUT);
        stroke(ctx, 3.5, i % 2 ? th.leaf : th.leafHi);
      }
    },
    pebbles(ctx, x, y, th, rnd) {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(x + i * 7 - 7, y - 2, rnd.range(3, 6), rnd.range(2, 4), 0, 0, U.TAU);
        ctx.fillStyle = th.ground.pebble;
        ctx.fill();
        stroke(ctx, 1.5, 'rgba(0,0,0,0.3)');
      }
    },
    drygrass(ctx, x, y, th, rnd) {
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 3, y + 2);
        ctx.lineTo(x + i * 6, y - rnd.range(8, 15));
        stroke(ctx, 2, '#b07a3a');
      }
    },
    skull(ctx, x, y) {
      ctx.beginPath();
      ctx.ellipse(x, y - 6, 8, 6, 0, 0, U.TAU);
      ctx.fillStyle = '#fff4dd';
      ctx.fill();
      stroke(ctx, 2, OUT);
      ctx.fillStyle = OUT;
      ctx.fillRect(x - 4, y - 8, 2.5, 2.5);
      ctx.fillRect(x + 2, y - 8, 2.5, 2.5);
    },
    snowmound(ctx, x, y) {
      ctx.beginPath();
      ctx.ellipse(x, y, 20, 8, 0, Math.PI, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    },
    sparkle(ctx, x, y) {
      ctx.fillStyle = 'rgba(180,220,255,0.9)';
      ctx.fillRect(x - 1, y - 8, 2, 8);
      ctx.fillRect(x - 4, y - 5, 8, 2);
    },
    ember(ctx, x, y) {
      ctx.beginPath();
      ctx.arc(x, y + 4, 3, 0, U.TAU);
      ctx.fillStyle = '#ff7a1f';
      ctx.fill();
    },
    crack(ctx, x, y) {
      ctx.beginPath();
      ctx.moveTo(x - 10, y + 6);
      ctx.lineTo(x - 3, y + 14);
      ctx.lineTo(x + 4, y + 10);
      ctx.lineTo(x + 11, y + 22);
      ctx.lineCap = 'round';
      stroke(ctx, 3, '#ff6a1f');
    },
    lamp(ctx, x, y) {
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x, y - 70);
      ctx.quadraticCurveTo(x, y - 80, x + 14, y - 80);
      stroke(ctx, 7, OUT);
      stroke(ctx, 3.5, '#4b5563');
      ctx.beginPath();
      ctx.ellipse(x + 16, y - 77, 7, 4, 0, 0, U.TAU);
      ctx.fillStyle = '#fff3a8';
      ctx.fill();
    },
    hydrant(ctx, x, y) {
      U.rr(ctx, x - 6, y - 20, 12, 22, 4);
      fillOut(ctx, '#e63946', 2.5);
      U.rr(ctx, x - 9, y - 14, 18, 5, 2);
      fillOut(ctx, '#e63946', 2);
    },
  };

  // ------------------------------------------------------------------ generator
  /**
   * Build a full arena for a stage.
   * Returns { theme, W, H, terrain, spawns:{left,right}, windMax, glows, lavaY, seed }
   */
  function buildLevel(stage, seed, opts) {
    opts = opts || {};
    const theme = THEMES[(stage - 1) % THEMES.length];
    const loop = Math.floor((stage - 1) / THEMES.length);
    const s = Math.min(12, stage + loop * 2); // effective difficulty
    const rnd = U.rng(seed);
    const dist = Math.round(U.clamp(1050 + (s - 1) * 185, 1050, 2900));
    const margin = 640;
    const W = dist + margin * 2;
    const H = 1200;
    const xL = margin, xR = W - margin;
    const hdiff = (s - 1) * 38 * rnd.range(0.7, 1.15) * rnd.sign();
    const yR = 840 + rnd.range(-30, 30);
    const yL = U.clamp(yR + hdiff, 560, 960);
    const terrain = new Terrain(W, H);
    const ctx = terrain.ctx;
    const glows = [];
    let lavaY = null;
    const level = { theme, W, H, terrain, stage, seed, glows, s, dist };

    if (theme.islands) {
      buildIslands(level, rnd, xL, xR, yL, yR);
    } else if (theme.city) {
      buildCity(level, rnd, xL, xR, yL, yR);
    } else {
      // ---------------- heightmap
      const STEP = 4;
      const n = Math.ceil(W / STEP) + 1;
      const hm = new Float32Array(n);
      const ridgeX = (xL + xR) / 2 + rnd.range(-0.12, 0.12) * dist;
      const ridgeH = opts.menu ? 25 : 70 + s * 32 + rnd.range(0, 40);
      const ridgeW = dist * rnd.range(0.16, 0.24);
      const bumps = [];
      const nb = opts.menu ? 0 : 1 + Math.floor(s / 2);
      for (let i = 0; i < nb; i++) {
        bumps.push({ x: rnd.range(xL + 200, xR - 200), h: rnd.range(-1, 1) * (40 + s * 14), w: rnd.range(80, 220) });
      }
      const ph = [rnd() * 10, rnd() * 10, rnd() * 10];
      const jag = theme.key === 'snow' || theme.key === 'volcano' ? 1.6 : 1;
      for (let i = 0; i < n; i++) {
        const x = i * STEP;
        const t = U.smooth(U.clamp((x - xL) / (xR - xL), 0, 1));
        let y = U.lerp(yL, yR, t);
        const r = (x - ridgeX) / ridgeW;
        if (Math.abs(r) < 1) y -= ridgeH * (0.5 + 0.5 * Math.cos(r * Math.PI));
        bumps.forEach((b) => {
          const q = (x - b.x) / b.w;
          if (Math.abs(q) < 1) y += b.h * (0.5 + 0.5 * Math.cos(q * Math.PI));
        });
        y += Math.sin(x * 0.004 + ph[0]) * 24 + Math.sin(x * 0.011 + ph[1]) * 10 * jag + Math.sin(x * 0.027 + ph[2]) * 4 * jag;
        // world edges rise
        if (x < 220) y -= Math.pow((220 - x) / 220, 2) * 260;
        if (x > W - 220) y -= Math.pow((x - (W - 220)) / 220, 2) * 260;
        hm[i] = y;
      }
      if (theme.terrace) {
        for (let i = 0; i < n; i++) {
          const x = i * STEP;
          if (x > xL + 160 && x < xR - 160) hm[i] = Math.round(hm[i] / 70) * 70 + (hm[i] % 70) * 0.08;
        }
      }
      // flatten spawn plateaus
      [[xL, yL], [xR, yR]].forEach(([sx, sy]) => {
        for (let i = 0; i < n; i++) {
          const dx = Math.abs(i * STEP - sx);
          if (dx < 90) hm[i] = sy;
          else if (dx < 230) hm[i] = U.lerp(sy, hm[i], U.smooth((dx - 90) / 140));
        }
      });
      for (let i = 0; i < n; i++) hm[i] = U.clamp(hm[i], 240, H - 70);
      level.hm = hm;
      level.hmStep = STEP;

      paintGround(ctx, hm, STEP, W, H, theme, rnd);

      // lava pools in the valleys
      if (theme.lava) {
        let maxY = 0;
        for (let i = 0; i < n; i++) {
          const x = i * STEP;
          if (x > xL + 200 && x < xR - 200) maxY = Math.max(maxY, hm[i]);
        }
        lavaY = maxY - 45;
        paintLava(ctx, hm, STEP, xL + 200, xR - 200, lavaY);
        level.lavaY = lavaY;
      }

      // obstacles
      const count = opts.menu ? 0 : Math.min(7, 1 + Math.floor(s * 0.7));
      const placed = [];
      const zone0 = xL + 210, zone1 = xR - 210;
      for (let k = 0, tries = 0; k < count && tries < 200; tries++) {
        const x = k === 0 ? U.lerp(zone0, zone1, rnd.range(0.4, 0.6)) : rnd.range(zone0, zone1);
        if (placed.some((p) => Math.abs(p - x) < 150)) continue;
        const gy = hm[Math.round(x / STEP)];
        if (lavaY != null && gy > lavaY - 5) continue;
        placed.push(x);
        const type = theme.obstacles[k % theme.obstacles.length];
        const sc = U.clamp(0.75 + s * 0.06 + rnd.range(-0.1, 0.15), 0.7, 1.45);
        const r = OB[type](ctx, x, gy, sc, rnd, theme);
        if (r && r.glow) glows.push(r.glow);
        k++;
      }
      if (opts.menu) {
        [W / 2 - 720, W / 2 + 760].forEach((x, i) => OB[i ? 'bigTree' : 'tree'](ctx, x, hm[Math.round(x / STEP)], 1, rnd, theme));
        OB.rock(ctx, W / 2 + 560, hm[Math.round((W / 2 + 560) / STEP)], 0.7, rnd, theme);
      }
    }

    terrain.buildMask();

    // decorations (non-solid)
    if (level.hm) {
      const hm = level.hm, STEP = level.hmStep;
      for (let x = 30; x < W - 30; x += rnd.range(26, 70)) {
        const y = hm[Math.round(x / STEP)];
        if (level.lavaY != null && y > level.lavaY - 4) continue;
        const sy = terrain.surfaceY(x, y - 30);
        if (Math.abs(sy - y) > 12) continue;
        if (Math.abs(x - xL) < 60 || Math.abs(x - xR) < 60) continue;
        DECO[rnd.pick(theme.deco)](ctx, x, sy + 3, theme, rnd);
      }
    }
    (level.decoSpots || []).forEach(([x, y]) => DECO[rnd.pick(theme.deco)](ctx, x, y + 3, theme, rnd));

    level.spawns = {
      left: { x: xL, y: terrain.surfaceY(xL, level.spawnScanL || 0) },
      right: { x: xR, y: terrain.surfaceY(xR, level.spawnScanR || 0) },
    };
    level.windMax = stage >= 4 ? U.clamp(0.25 + (s - 4) * 0.13, 0.25, 1) : 0;
    return level;
  }

  function paintGround(ctx, hm, STEP, W, H, th, rnd) {
    const n = hm.length;
    const G = th.ground;
    ctx.beginPath();
    ctx.moveTo(-10, H + 10);
    for (let i = 0; i < n; i++) ctx.lineTo(i * STEP, hm[i]);
    ctx.lineTo(W + 10, H + 10);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 300, 0, H);
    g.addColorStop(0, G.dirt);
    g.addColorStop(1, G.dirt2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // strata bands following the surface
    for (let k = 1; k < 12; k++) {
      ctx.beginPath();
      for (let i = 0; i < n; i += 2) {
        const y = hm[i] + 50 + k * 58 + Math.sin(i * 0.05 + k) * 8;
        i ? ctx.lineTo(i * STEP, y) : ctx.moveTo(0, y);
      }
      ctx.lineWidth = th.lava ? 2.5 : 7;
      ctx.strokeStyle = th.lava ? U.rgba(G.strata, 0.55) : U.rgba(G.strata, 0.45);
      ctx.stroke();
    }
    // pebbles
    for (let i = 0; i < W / 9; i++) {
      const x = rnd.range(0, W);
      const y = hm[Math.round(x / STEP)] + rnd.range(30, 500);
      ctx.beginPath();
      ctx.ellipse(x, y, rnd.range(3, 9), rnd.range(2, 6), rnd.range(0, 3), 0, U.TAU);
      ctx.fillStyle = U.rgba(G.pebble, 0.55);
      ctx.fill();
    }
    ctx.restore();
    // outline
    ctx.beginPath();
    for (let i = 0; i < n; i++) (i ? ctx.lineTo(i * STEP, hm[i]) : ctx.moveTo(0, hm[i]));
    ctx.lineJoin = 'round';
    stroke(ctx, 5, OUT);
    // top band only on walkable slopes
    const runs = [];
    let cur = null;
    for (let i = 1; i < n; i++) {
      const slope = Math.abs(hm[i] - hm[i - 1]) / STEP;
      if (slope < 1.4) {
        if (!cur) cur = [i - 1];
        cur.push(i);
      } else if (cur) {
        runs.push(cur);
        cur = null;
      }
    }
    if (cur) runs.push(cur);
    ctx.lineCap = 'round';
    runs.forEach((run) => {
      ctx.beginPath();
      run.forEach((i, k) => (k ? ctx.lineTo(i * STEP, hm[i] + 5) : ctx.moveTo(i * STEP, hm[i] + 5)));
      stroke(ctx, 20, OUT);
      stroke(ctx, 14, G.top);
      ctx.beginPath();
      run.forEach((i, k) => (k ? ctx.lineTo(i * STEP, hm[i] + 1) : ctx.moveTo(i * STEP, hm[i] + 1)));
      stroke(ctx, 4, G.hi);
      // retro scallops under the grass band
      if (!th.lava) {
        ctx.fillStyle = G.top;
        for (let k = 0; k < run.length; k += 4) {
          const i = run[k];
          ctx.beginPath();
          ctx.arc(i * STEP, hm[i] + 12, 5, 0, Math.PI);
          ctx.fill();
        }
      }
    });
  }

  function paintLava(ctx, hm, STEP, x0, x1, lavaY) {
    const n = hm.length;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, lavaY, x1 - x0, 2000);
    ctx.clip();
    // area between lava level and ground
    ctx.beginPath();
    ctx.moveTo(x0, lavaY);
    for (let i = Math.floor(x0 / STEP); i < Math.min(n, x1 / STEP); i++) ctx.lineTo(i * STEP, Math.max(lavaY, hm[i]));
    ctx.lineTo(x1, lavaY);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, lavaY, 0, lavaY + 60);
    g.addColorStop(0, '#ffd23f');
    g.addColorStop(0.3, '#ff7b1c');
    g.addColorStop(1, '#c9200e');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    // lava surface line
    for (let i = Math.floor(x0 / STEP); i < Math.min(n, x1 / STEP); i++) {
      if (hm[i] > lavaY + 2) {
        ctx.fillStyle = '#fff2a1';
        ctx.fillRect(i * STEP, lavaY - 2, STEP, 3);
      }
    }
  }

  function islandShape(ctx, x, y, w, depth, th, rnd) {
    const G = th.ground;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    const n = 7;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const px = x - w / 2 + w * t;
      const py = y + Math.sin(t * Math.PI) * depth * rnd.range(0.75, 1.05);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y, 0, y + depth);
    g.addColorStop(0, G.dirt);
    g.addColorStop(1, G.dirt2);
    ctx.lineJoin = 'round';
    fillOut(ctx, g, 5);
    // top grass
    U.rr(ctx, x - w / 2 - 6, y - 8, w + 12, 20, 9);
    fillOut(ctx, G.top, 5);
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - 4);
    ctx.lineTo(x + w / 2, y - 4);
    stroke(ctx, 4, G.hi);
    ctx.fillStyle = G.top;
    for (let px = x - w / 2 + 6; px < x + w / 2 - 4; px += 16) {
      ctx.beginPath();
      ctx.arc(px, y + 12, 5, 0, Math.PI);
      ctx.fill();
    }
    // hanging roots
    for (let i = 0; i < 4; i++) {
      const rx = x + rnd.range(-w * 0.3, w * 0.3);
      ctx.beginPath();
      ctx.moveTo(rx, y + depth * 0.3);
      ctx.quadraticCurveTo(rx + 8, y + depth * 0.6, rx - 4, y + depth * 0.8);
      stroke(ctx, 2.5, '#3f6b2e');
    }
  }

  function buildIslands(level, rnd, xL, xR, yL, yR) {
    const { terrain, theme, s } = level;
    const ctx = terrain.ctx;
    level.decoSpots = [];
    const isl = (x, y, w, depth) => {
      islandShape(ctx, x, y, w, depth, theme, rnd);
      for (let px = x - w / 2 + 20; px < x + w / 2 - 20; px += rnd.range(30, 60)) level.decoSpots.push([px, y - 8]);
    };
    isl(xL, yL, 300, 230);
    isl(xR, yR, 300, 230);
    const mids = 2 + Math.floor(s / 3);
    const span = xR - xL - 500;
    for (let i = 0; i < mids; i++) {
      const x = xL + 250 + (span * (i + 0.5)) / mids + rnd.range(-50, 50);
      const y = U.clamp(Math.min(yL, yR) - rnd.range(-140, 200), 330, 950);
      const w = rnd.range(150, 260);
      isl(x, y, w, rnd.range(120, 200));
      if (rnd() < 0.85) {
        const type = rnd.pick(theme.obstacles);
        OB[type](ctx, x + rnd.range(-w * 0.2, w * 0.2), y - 6, U.clamp(0.75 + s * 0.05, 0.75, 1.3), rnd, theme);
      }
    }
    level.spawnScanL = yL - 60;
    level.spawnScanR = yR - 60;
  }

  function buildCity(level, rnd, xL, xR, yL, yR) {
    const { terrain, theme, s, W, H } = level;
    const ctx = terrain.ctx;
    const street = 1080;
    // street
    ctx.beginPath();
    ctx.rect(-10, street, W + 20, H - street + 10);
    fillOut(ctx, '#3d4250', 5);
    ctx.fillStyle = '#9aa1ad';
    ctx.fillRect(-10, street, W + 20, 12);
    ctx.fillStyle = '#ffd166';
    for (let x = 0; x < W; x += 80) ctx.fillRect(x, street + 50, 40, 6);
    level.decoSpots = [];
    // spawn towers
    const tower = (x, roof, w) => {
      OB.building(ctx, x, street, 1, rnd, theme, { w, h: street - roof, flat: true });
    };
    // middle buildings (behind spawns first)
    let x = xL + 190;
    while (x < xR - 190) {
      const w = rnd.range(110, 190);
      if (x + w / 2 > xR - 160) break;
      const base = Math.min(yL, yR);
      const roof = U.clamp(base - rnd.range(-160, 60 + s * 22), 300, street - 120);
      if (rnd() < 0.85) OB.building(ctx, x + w / 2, street, 1, rnd, theme, { w, h: street - roof });
      x += w + rnd.range(30, 110);
    }
    tower(xL, yL, 230);
    tower(xR, yR, 230);
    for (let px = 40; px < W; px += rnd.range(140, 260)) level.decoSpots.push([px, street]);
    level.spawnScanL = yL - 60;
    level.spawnScanR = yR - 60;
  }

  EMG.buildLevel = buildLevel;
  EMG.OBSTACLES = OB;
})();
