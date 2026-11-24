/* EMG – sky, sun/moon, stars, parallax layers and drifting clouds */
(function () {
  'use strict';
  const U = EMG.U;
  const OUT = '#2a1b26';

  class Background {
    constructor(theme, W, seed) {
      this.theme = theme;
      this.W = W;
      const rnd = U.rng(seed ^ 0xbeef);
      this.layers = theme.layers.map((L) => this.genLayer(L, rnd));
      this.clouds = [];
      const nc = theme.islands ? 14 : 9;
      for (let i = 0; i < nc; i++) {
        this.clouds.push({
          x: rnd.range(-900, W * 0.45 + 900), y: rnd.range(-250, 520), s: rnd.range(0.6, 1.4),
          v: rnd.range(8, 22), f: rnd.range(0.25, 0.45), seed: (rnd() * 1e6) | 0,
        });
      }
      this.stars = [];
      if (theme.stars || theme.key === 'volcano' || theme.key === 'city') {
        const ns = theme.stars ? 160 : 40;
        for (let i = 0; i < ns; i++) this.stars.push({ x: rnd(), y: rnd() * 0.7, r: rnd.range(0.6, 2), p: rnd() * 10 });
      }
      this.smoke = [];
    }

    genLayer(L, rnd) {
      const span0 = -1500, span1 = this.W * L.f + 3500;
      const pts = [];
      const extra = [];
      if (L.type === 'mountains' || L.type === 'volcano') {
        if (L.type === 'volcano') {
          const cx = span0 + 1500 + (this.W * L.f) / 2 + 400;
          return { L, pts: [], volcano: { x: cx, y: L.y, h: L.amp, w: L.amp * 2.2 } };
        }
        let x = span0;
        while (x < span1) {
          pts.push([x, L.y - rnd.range(0.35, 1) * L.amp]);
          x += rnd.range(60, 120);
          pts.push([x, L.y - rnd.range(0, 0.3) * L.amp]);
          x += rnd.range(60, 140);
        }
      } else if (L.type === 'hills' || L.type === 'dunes' || L.type === 'cloudsea') {
        const p1 = rnd() * 10, p2 = rnd() * 10;
        for (let x = span0; x < span1; x += 24) {
          let y = L.y - (Math.sin(x * 0.004 + p1) * 0.5 + 0.5) * L.amp - Math.sin(x * 0.011 + p2) * L.amp * 0.25;
          if (L.type === 'dunes') y = L.y - Math.abs(Math.sin(x * 0.0035 + p1)) * L.amp;
          if (L.type === 'cloudsea') y = L.y - Math.abs(Math.sin(x * 0.02 + p1)) * L.amp;
          pts.push([x, y]);
        }
      } else if (L.type === 'treeline' || L.type === 'pines') {
        let x = span0;
        while (x < span1) {
          const r = rnd.range(0.5, 1) * L.amp;
          extra.push([x, L.y - r * 0.4, r * 0.6 + 20, L.type]);
          x += rnd.range(30, 70);
        }
        pts.push([span0, L.y], [span1, L.y]);
      } else if (L.type === 'mesas') {
        let x = span0;
        while (x < span1) {
          const h = rnd.range(0.3, 1) * L.amp, w = rnd.range(120, 320);
          pts.push([x, L.y], [x + 20, L.y - h], [x + w - 20, L.y - h], [x + w, L.y]);
          x += w + rnd.range(40, 260);
          pts.push([x, L.y]);
        }
      } else if (L.type === 'city') {
        let x = span0;
        while (x < span1) {
          const w = rnd.range(60, 140), h = rnd.range(0.3, 1) * L.amp;
          extra.push([x, L.y - h, w, h, rnd() < 0.3]);
          x += w + rnd.range(0, 30);
        }
      } else if (L.type === 'islands') {
        for (let x = span0; x < span1; x += rnd.range(300, 600)) {
          extra.push([x, L.y - rnd.range(0, L.amp), rnd.range(90, 220)]);
        }
      }
      return { L, pts, extra };
    }

    update(dt, wind) {
      this.clouds.forEach((c) => {
        c.x += (c.v * (0.4 + Math.abs(wind) * 2) * (wind < 0 ? -1 : 1) + wind * 60) * dt;
        const max = this.W * 0.45 + 900;
        if (c.x > max) c.x = -900;
        if (c.x < -900) c.x = max;
      });
    }

    /** cam: {x,y,scale}, vw/vh: viewport in CSS px */
    draw(ctx, cam, vw, vh, time) {
      const th = this.theme;
      const sc = cam.scale;
      // sky gradient
      const g = ctx.createLinearGradient(0, 0, 0, vh);
      g.addColorStop(0, th.sky[0]);
      g.addColorStop(1, th.sky[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, vw, vh);
      // stars
      if (this.stars.length) {
        this.stars.forEach((s) => {
          const tw = 0.55 + 0.45 * Math.sin(time * 2 + s.p);
          ctx.fillStyle = `rgba(255,255,240,${tw * (th.stars ? 1 : 0.45)})`;
          const x = (s.x * vw * 1.2 - cam.x * 0.02 * sc) % vw;
          ctx.fillRect((x + vw) % vw, s.y * vh, s.r * 1.4, s.r * 1.4);
        });
      }
      this.drawSun(ctx, vw, vh, time, cam);
      const baseY = 640; // camera y at which layers sit at their authored height
      this.layers.forEach((layer, li) => {
        const L = layer.L;
        ctx.save();
        ctx.translate(vw / 2, vh / 2);
        ctx.scale(sc, sc);
        ctx.translate(-cam.x * L.f, -(baseY + (cam.y - baseY) * L.f * 0.7));
        this.drawLayer(ctx, layer, time, vw / sc, cam.x * L.f, vh / sc);
        ctx.restore();
        if (li < this.layers.length - 1) {
          ctx.fillStyle = U.rgba(th.sky[1], 0.12);
          ctx.fillRect(0, 0, vw, vh);
        }
      });
      // clouds (layer space, wraps around)
      this.clouds.forEach((c) => {
        const x = (c.x - cam.x * c.f) * sc + vw / 2;
        const y = (c.y - baseY - (cam.y - baseY) * c.f) * sc + vh / 2;
        if (x < -300 * sc || x > vw + 300 * sc) return;
        this.drawCloud(ctx, x, y, c.s * sc, c.seed);
      });
    }

    drawLayer(ctx, layer, time, viewW, camX, viewH) {
      const L = layer.L;
      const col = L.color;
      const bottom = L.y + 3000;
      ctx.lineJoin = 'round';
      if (layer.volcano) {
        const v = layer.volcano;
        const x = camX + 300;
        ctx.beginPath();
        ctx.moveTo(x - v.w, v.y + 400);
        ctx.lineTo(x - v.w * 0.18, v.y - v.h);
        ctx.lineTo(x + v.w * 0.18, v.y - v.h);
        ctx.lineTo(x + v.w, v.y + 400);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
        // glowing crater + lava streams
        const g = ctx.createRadialGradient(x, v.y - v.h, 0, x, v.y - v.h, 160);
        g.addColorStop(0, 'rgba(255,190,80,0.9)');
        g.addColorStop(1, 'rgba(255,80,20,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 160, v.y - v.h - 160, 320, 320);
        ctx.beginPath();
        ctx.moveTo(x - 20, v.y - v.h + 4);
        ctx.quadraticCurveTo(x - 60, v.y - v.h * 0.5, x - 110, v.y);
        ctx.moveTo(x + 25, v.y - v.h + 4);
        ctx.quadraticCurveTo(x + 50, v.y - v.h * 0.4, x + 130, v.y + 40);
        ctx.lineWidth = 7;
        ctx.strokeStyle = 'rgba(255,120,30,0.8)';
        ctx.stroke();
        // smoke plume
        for (let i = 0; i < 7; i++) {
          const k = (time * 0.12 + i / 7) % 1;
          ctx.beginPath();
          ctx.arc(x + Math.sin(k * 6 + i) * 30 + k * 120, v.y - v.h - k * 380, 30 + k * 70, 0, U.TAU);
          ctx.fillStyle = `rgba(60,30,35,${0.45 * (1 - k)})`;
          ctx.fill();
        }
        return;
      }
      if (L.type === 'treeline' || L.type === 'pines') {
        ctx.fillStyle = col;
        ctx.beginPath();
        layer.extra.forEach(([x, y, r, t]) => {
          if (t === 'pines') {
            ctx.moveTo(x - r * 0.6, L.y);
            ctx.lineTo(x, y - r * 1.4);
            ctx.lineTo(x + r * 0.6, L.y);
          } else {
            ctx.moveTo(x + r, y);
            ctx.arc(x, y, r, 0, U.TAU);
          }
        });
        ctx.fill();
        ctx.fillRect(-1600, L.y - 2, 1e5, bottom);
        return;
      }
      if (L.type === 'city') {
        layer.extra.forEach(([x, y, w, h, spire]) => {
          ctx.fillStyle = col;
          ctx.fillRect(x, y, w, h + 3000);
          if (spire) ctx.fillRect(x + w / 2 - 3, y - 40, 6, 40);
          ctx.fillStyle = U.rgba('#fff3c9', 0.35);
          for (let wy = y + 14; wy < L.y - 10; wy += 26) {
            for (let wx = x + 10; wx < x + w - 14; wx += 22) {
              if (((wx * 7 + wy * 3) | 0) % 5 < 2) ctx.fillRect(wx, wy, 9, 12);
            }
          }
        });
        return;
      }
      if (L.type === 'islands') {
        layer.extra.forEach(([x, y, w]) => {
          ctx.beginPath();
          ctx.moveTo(x - w / 2, y);
          ctx.quadraticCurveTo(x, y + w * 1.1, x + w / 2, y);
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.fill();
          ctx.fillStyle = U.shade(col, 0.2);
          ctx.fillRect(x - w / 2, y - 8, w, 10);
          // tiny waterfall
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(x + w * 0.15, y, 5, w * 0.9);
        });
        return;
      }
      // polygon layers
      const pts = layer.pts;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], bottom);
      pts.forEach((p) => ctx.lineTo(p[0], p[1]));
      ctx.lineTo(pts[pts.length - 1][0], bottom);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      if (L.type === 'mountains' && L.snow) {
        ctx.save();
        ctx.clip();
        const snowY = L.y - L.amp * (L.snowLine || 0.62);
        ctx.beginPath();
        ctx.moveTo(-2000, snowY - 1000);
        for (let x = -2000; x < 1e5 && x < pts[pts.length - 1][0]; x += 40) ctx.lineTo(x, snowY + Math.sin(x * 0.05) * 10);
        ctx.lineTo(pts[pts.length - 1][0], snowY - 1000);
        ctx.closePath();
        ctx.fillStyle = L.snow;
        ctx.fill();
        ctx.restore();
      }
      if (L.type === 'cloudsea') {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      }
    }

    drawSun(ctx, vw, vh, time, cam) {
      const th = this.theme;
      const x = vw * 0.8 - cam.x * 0.01 * cam.scale, y = vh * 0.2;
      const r = Math.min(vw, vh) * (th.sun === 'bigsun' ? 0.13 : 0.075);
      if (th.sun === 'moon') {
        const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3);
        g.addColorStop(0, 'rgba(255,250,220,0.35)');
        g.addColorStop(1, 'rgba(255,250,220,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, U.TAU);
        ctx.fillStyle = th.sunColor;
        ctx.fill();
        ctx.fillStyle = 'rgba(200,190,150,0.5)';
        [[-0.3, -0.2, 0.22], [0.3, 0.25, 0.16], [0.1, -0.45, 0.1]].forEach(([dx, dy, rr]) => {
          ctx.beginPath();
          ctx.arc(x + dx * r, y + dy * r, rr * r, 0, U.TAU);
          ctx.fill();
        });
        return;
      }
      const glow = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3.2);
      glow.addColorStop(0, U.rgba(th.sunColor, 0.55));
      glow.addColorStop(1, U.rgba(th.sunColor, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
      if (th.sun !== 'redsun') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 0.05);
        ctx.fillStyle = U.rgba(th.sunColor, 0.18);
        for (let i = 0; i < 12; i++) {
          ctx.rotate(U.TAU / 12);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(r * 2.6, -r * 0.22);
          ctx.lineTo(r * 2.6, r * 0.22);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, U.TAU);
      ctx.fillStyle = th.sunColor;
      ctx.fill();
      if (th.sun === 'bigsun' || th.sun === 'redsun') {
        // retro horizontal stripes
        ctx.save();
        ctx.clip();
        ctx.fillStyle = U.rgba(th.sky[0], 0.35);
        for (let i = 0; i < 6; i++) ctx.fillRect(x - r, y + r * 0.1 + i * r * 0.16, r * 2, r * 0.05 + i * 0.6);
        ctx.restore();
      }
    }

    drawCloud(ctx, x, y, s, seed) {
      const rnd = U.rng(seed);
      const th = this.theme;
      const puffs = [];
      const n = 4 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) puffs.push([(i - n / 2) * 26 + rnd.range(-6, 6), -rnd.range(0, 22) - (i > 0 && i < n - 1 ? 12 : 0), rnd.range(20, 34)]);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.beginPath();
      puffs.forEach(([px, py, r]) => {
        ctx.moveTo(px + r, py + 6);
        ctx.arc(px, py + 6, r, 0, U.TAU);
      });
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fill();
      ctx.beginPath();
      puffs.forEach(([px, py, r]) => {
        ctx.moveTo(px + r, py);
        ctx.arc(px, py, r, 0, U.TAU);
      });
      ctx.fillStyle = th.cloud;
      ctx.globalAlpha *= th.dark ? 0.55 : 0.95;
      ctx.fill();
      ctx.restore();
    }
  }
  EMG.Background = Background;
})();
