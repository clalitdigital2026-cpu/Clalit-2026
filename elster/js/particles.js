/* חביתת אלסטר – particles: shell shards, yolk spray, dust, poof smoke, floating damage text, confetti, ambient weather */
(function () {
  'use strict';
  const U = ELSTER.U;
  const OUT = '#2a1b26';

  class Particles {
    constructor() {
      this.list = [];
      this.texts = [];
      this.confetti = [];
      this.ambient = [];
      this.ambientType = 'none';
    }

    clear() {
      this.list.length = 0;
      this.texts.length = 0;
      this.confetti.length = 0;
    }

    add(p) {
      p.t = 0;
      this.list.push(p);
      if (this.list.length > 600) this.list.shift();
    }

    /** egg breaking: shards + yolk + albumen droplets */
    eggBurst(x, y, nx, ny, power) {
      power = power == null ? 1 : power;
      for (let i = 0; i < 12; i++) {
        const a = Math.atan2(ny, nx) + U.rand.range(-1.4, 1.4);
        const v = U.rand.range(150, 420) * power;
        this.add({
          kind: 'shard', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 900,
          rot: U.rand() * 6, vr: U.rand.range(-14, 14), s: U.rand.range(3, 7), life: U.rand.range(0.8, 1.4), bounce: true,
        });
      }
      for (let i = 0; i < 16; i++) {
        const a = Math.atan2(ny, nx) + U.rand.range(-1.2, 1.2);
        const v = U.rand.range(80, 360) * power;
        this.add({
          kind: 'drop', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 1000,
          s: U.rand.range(2, 5.5), life: U.rand.range(0.5, 1.0), col: U.rand() < 0.55 ? '#ffc21a' : '#fffaf0',
        });
      }
      this.dust(x, y, 6, '#ffffff');
    }

    dust(x, y, n, col) {
      for (let i = 0; i < n; i++) {
        this.add({
          kind: 'puff', x: x + U.rand.range(-10, 10), y: y + U.rand.range(-6, 6),
          vx: U.rand.range(-60, 60), vy: U.rand.range(-60, -10), g: 0, s: U.rand.range(8, 16), life: U.rand.range(0.4, 0.8), col: col || '#e8dcc8',
        });
      }
    }

    poof(x, y) {
      for (let i = 0; i < 26; i++) {
        const a = U.rand() * U.TAU, v = U.rand.range(40, 220);
        this.add({
          kind: 'puff', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: -40, s: U.rand.range(14, 30),
          life: U.rand.range(0.6, 1.1), col: U.rand() < 0.5 ? '#ffffff' : '#e7e1f0',
        });
      }
      for (let i = 0; i < 10; i++) {
        const a = U.rand() * U.TAU, v = U.rand.range(150, 300);
        this.add({ kind: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 300, s: U.rand.range(5, 9), rot: 0, vr: 8, life: 0.9 });
      }
    }

    ring(x, y, col) {
      this.add({ kind: 'ring', x, y, vx: 0, vy: 0, g: 0, s: 10, life: 0.5, col });
    }

    sizzle(x, y) {
      for (let i = 0; i < 12; i++) {
        this.add({ kind: 'puff', x: x + U.rand.range(-14, 14), y, vx: U.rand.range(-20, 20), vy: U.rand.range(-120, -60), g: 0, s: U.rand.range(8, 16), life: 1, col: '#bbbbbb' });
      }
    }

    sparks(x, y, col, n) {
      for (let i = 0; i < (n || 10); i++) {
        const a = U.rand() * U.TAU, v = U.rand.range(100, 300);
        this.add({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 200, s: 3, life: U.rand.range(0.3, 0.6), col: col || '#ffd84d' });
      }
    }

    text(x, y, str, opts) {
      opts = opts || {};
      this.texts.push({ x, y, str, t: 0, life: opts.life || 1.4, col: opts.col || '#ffffff', size: opts.size || 34, stroke: opts.stroke || OUT, sub: opts.sub });
    }

    burstConfetti(vw, vh) {
      const cols = ['#ff5d8f', '#ffd166', '#06d6a0', '#118ab2', '#ff8c42', '#b388ff', '#ffffff'];
      for (let i = 0; i < 180; i++) {
        this.confetti.push({
          x: U.rand.range(0, vw), y: U.rand.range(-vh * 0.8, -10), vx: U.rand.range(-60, 60), vy: U.rand.range(80, 220),
          rot: U.rand() * 6, vr: U.rand.range(-8, 8), w: U.rand.range(6, 12), h: U.rand.range(3, 7), col: U.rand.pick(cols),
          wob: U.rand() * 6, vh,
        });
      }
    }

    setAmbient(type) {
      this.ambientType = type;
      this.ambient.length = 0;
      const n = { leaves: 22, sand: 50, snow: 90, embers: 60, fireflies: 34, butterflies: 12, none: 0 }[type] || 0;
      for (let i = 0; i < n; i++) this.ambient.push({ x: U.rand(), y: U.rand(), p: U.rand() * 10, s: U.rand.range(0.6, 1.4) });
    }

    update(dt, wind) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        p.t += dt;
        if (p.t >= p.life) {
          this.list.splice(i, 1);
          continue;
        }
        p.vy += (p.g || 0) * dt;
        p.vx += (wind || 0) * 60 * dt * (p.kind === 'puff' ? 1 : 0.2);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.vr) p.rot += p.vr * dt;
        if (p.kind === 'puff') {
          p.vx *= 0.96;
          p.vy *= 0.96;
        }
        if (p.bounce && this.terrain && p.vy > 0 && this.terrain.isSolid(p.x, p.y)) {
          p.y -= p.vy * dt;
          p.vy *= -0.35;
          p.vx *= 0.6;
          p.vr *= 0.5;
        }
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.t += dt;
        if (t.t > t.life) this.texts.splice(i, 1);
      }
      for (let i = this.confetti.length - 1; i >= 0; i--) {
        const c = this.confetti[i];
        c.wob += dt * 5;
        c.x += (c.vx + Math.sin(c.wob) * 40) * dt;
        c.y += c.vy * dt;
        c.rot += c.vr * dt;
        if (c.y > c.vh + 30) this.confetti.splice(i, 1);
      }
    }

    draw(ctx) {
      for (const p of this.list) {
        const k = 1 - p.t / p.life;
        ctx.save();
        ctx.globalAlpha = Math.min(1, k * 2);
        if (p.kind === 'shard') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.moveTo(-p.s, -p.s * 0.6);
          ctx.lineTo(p.s, -p.s * 0.2);
          ctx.lineTo(p.s * 0.1, p.s * 0.8);
          ctx.closePath();
          ctx.fillStyle = '#fbf3e3';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = OUT;
          ctx.stroke();
        } else if (p.kind === 'drop') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s, 0, U.TAU);
          ctx.fillStyle = p.col;
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = p.col === '#ffc21a' ? '#b86200' : 'rgba(180,170,150,0.6)';
          ctx.stroke();
        } else if (p.kind === 'puff') {
          ctx.globalAlpha = k * 0.85;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * (1.4 - k * 0.6), 0, U.TAU);
          ctx.fillStyle = p.col;
          ctx.fill();
        } else if (p.kind === 'star') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const r = i % 2 ? p.s * 0.45 : p.s;
            const a = (i / 10) * U.TAU;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fillStyle = '#ffd84d';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = OUT;
          ctx.stroke();
        } else if (p.kind === 'ring') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10 + (1 - k) * 110, 0, U.TAU);
          ctx.lineWidth = 8 * k;
          ctx.strokeStyle = p.col;
          ctx.stroke();
        } else if (ELSTER.drawFunParticle && (p.kind === 'note' || p.kind === 'candy' || p.kind === 'paint' || p.kind === 'plane' || p.kind === 'planet')) {
          ELSTER.drawFunParticle(ctx, p);
        } else if (p.kind === 'spark') {
          ctx.fillStyle = p.col;
          ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
        }
        ctx.restore();
      }
    }

    drawTexts(ctx) {
      for (const t of this.texts) {
        const k = t.t / t.life;
        const pop = k < 0.15 ? U.easeOutBack(k / 0.15) : 1;
        ctx.save();
        ctx.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1;
        ctx.translate(t.x, t.y - k * 60);
        ctx.scale(pop, pop);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.direction = /^[-+\d]/.test(t.str) ? 'ltr' : 'rtl';
        ctx.font = `900 ${t.size}px "Rubik", "Arial Black", sans-serif`;
        ctx.lineJoin = 'round';
        ctx.lineWidth = 7;
        ctx.strokeStyle = t.stroke;
        ctx.strokeText(t.str, 0, 0);
        ctx.fillStyle = t.col;
        ctx.fillText(t.str, 0, 0);
        if (t.sub) {
          ctx.direction = 'rtl';
          ctx.font = `900 ${t.size * 0.5}px "Rubik", sans-serif`;
          ctx.lineWidth = 5;
          ctx.strokeText(t.sub, 0, -t.size * 0.85);
          ctx.fillStyle = '#ffd166';
          ctx.fillText(t.sub, 0, -t.size * 0.85);
        }
        ctx.restore();
      }
    }

    drawConfetti(ctx) {
      for (const c of this.confetti) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.scale(1, Math.cos(c.wob * 1.7));
        ctx.fillStyle = c.col;
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      }
    }

    /** ambient weather in screen space */
    drawAmbient(ctx, vw, vh, time, wind, camX) {
      const type = this.ambientType;
      if (type === 'none' || !this.ambient.length) return;
      const shift = -camX * 0.6;
      for (const a of this.ambient) {
        let x, y;
        ctx.save();
        switch (type) {
          case 'snow': {
            y = ((a.y + time * 0.06 * a.s) % 1) * (vh + 20) - 10;
            x = (((a.x * vw + shift + Math.sin(time + a.p) * 20 + time * wind * 80) % vw) + vw) % vw;
            ctx.beginPath();
            ctx.arc(x, y, 2.2 * a.s, 0, U.TAU);
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fill();
            break;
          }
          case 'sand': {
            x = (((a.x * vw + shift + time * (120 + wind * 200) * a.s) % vw) + vw) % vw;
            y = a.y * vh + Math.sin(time * 2 + a.p) * 8;
            ctx.fillStyle = 'rgba(255,230,170,0.65)';
            ctx.fillRect(x, y, 3 * a.s, 1.5);
            break;
          }
          case 'embers': {
            y = vh - (((a.y + time * 0.05 * a.s) % 1) * (vh + 20));
            x = (((a.x * vw + shift + Math.sin(time * 1.5 + a.p) * 25) % vw) + vw) % vw;
            const fl = 0.5 + 0.5 * Math.sin(time * 8 + a.p);
            ctx.fillStyle = `rgba(255,${120 + fl * 80},40,${0.5 + fl * 0.5})`;
            ctx.fillRect(x, y, 2.5 * a.s, 2.5 * a.s);
            break;
          }
          case 'fireflies': {
            x = (((a.x * vw + shift + Math.sin(time * 0.4 + a.p) * 60) % vw) + vw) % vw;
            y = vh * 0.35 + a.y * vh * 0.6 + Math.cos(time * 0.6 + a.p * 2) * 30;
            const fl = Math.max(0, Math.sin(time * 2 + a.p * 3));
            const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
            g.addColorStop(0, `rgba(220,255,140,${fl})`);
            g.addColorStop(1, 'rgba(220,255,140,0)');
            ctx.fillStyle = g;
            ctx.fillRect(x - 10, y - 10, 20, 20);
            break;
          }
          case 'leaves': {
            y = ((a.y + time * 0.035 * a.s) % 1) * (vh + 40) - 20;
            x = (((a.x * vw + shift + Math.sin(time * 1.2 + a.p) * 40 + time * (20 + wind * 120)) % vw) + vw) % vw;
            ctx.translate(x, y);
            ctx.rotate(Math.sin(time * 2 + a.p) * 1.2);
            ctx.beginPath();
            ctx.ellipse(0, 0, 6 * a.s, 3 * a.s, 0, 0, U.TAU);
            ctx.fillStyle = a.p > 5 ? '#7cc95a' : '#e9b949';
            ctx.fill();
            break;
          }
          case 'butterflies': {
            x = (((a.x * vw + shift + time * 30 * a.s + Math.sin(time * 0.7 + a.p) * 80) % vw) + vw) % vw;
            y = vh * 0.3 + a.y * vh * 0.5 + Math.sin(time * 1.3 + a.p) * 40;
            const flap = Math.abs(Math.sin(time * 14 + a.p));
            ctx.translate(x, y);
            ctx.fillStyle = a.p > 5 ? '#ff6fb0' : '#ffd166';
            ctx.beginPath();
            ctx.ellipse(-4 * flap, 0, 5 * flap + 1, 4, 0, 0, U.TAU);
            ctx.ellipse(4 * flap, 0, 5 * flap + 1, 4, 0, 0, U.TAU);
            ctx.fill();
            break;
          }
        }
        ctx.restore();
      }
    }
  }
  ELSTER.Particles = Particles;
})();
