/* EMG – computer opponent. Searches angle/power with the real physics simulation,
   then applies human-like aiming error that shrinks as it learns from previous shots. */
(function () {
  'use strict';
  const U = EMG.U;
  const P = EMG.Physics;

  const CFG = {
    easy: {
      aimHead: false, terrainAware: 'learn', windAware: false,
      sigA: 3.8, sigP: 0.065, carry: 0, decay: 0.95, floorA: 3.1, floorP: 0.058,
    },
    medium: {
      aimHead: false, terrainAware: 'learn', windAware: true,
      sigA: 3.0, sigP: 0.05, carry: 0.45, decay: 0.72, floorA: 1.15, floorP: 0.02,
    },
    hard: {
      aimHead: true, terrainAware: true, windAware: true,
      sigA: 2.0, sigP: 0.034, carry: 0.3, decay: 0.66, floorA: 0.85, floorP: 0.015,
    },
  };

  class AIBrain {
    constructor(difficulty) {
      this.diff = difficulty;
      this.cfg = CFG[difficulty] || CFG.medium;
      this.sigA = this.cfg.sigA;
      this.sigP = this.cfg.sigP;
      this.errA = 0;
      this.errP = 0;
      this.blocked = 0;
      this.shots = 0;
    }

    /**
     * Generator: yields while working so the search can be spread over frames.
     * Final value: { dir:[x,y], power, ideal:{e,p,score} }
     */
    *plan(shooter, target, game) {
      const cfg = this.cfg;
      const anchor = shooter.restAnchor;
      const hc = target.headCenter;
      const aim = cfg.aimHead ? { x: hc.x, y: hc.y } : { x: target.pos.x, y: target.pos.y - 34 };
      const useTerrain = cfg.terrainAware === true || (cfg.terrainAware === 'learn' && this.blocked > 0);
      const world = {
        terrain: useTerrain ? game.level.terrain : null,
        chars: game.chars,
        wind: cfg.windAware ? game.wind : 0,
        ignore: shooter,
        W: game.level.W,
        H: game.level.H,
      };
      const side = Math.sign(target.pos.x - shooter.pos.x) || -1;
      const evalShot = (e, p) => {
        const rad = (e * Math.PI) / 180;
        const v = P.launchVelocity(side * Math.cos(rad), -Math.sin(rad), p);
        const r = P.simulate(anchor.x, anchor.y, v.vx, v.vy, world, { target: aim, maxT: 7 });
        let score = r.minD;
        if (r.event && r.event.type === 'char') {
          if (r.event.char === target) score = r.event.part === 'head' ? 0 : cfg.aimHead ? 4 : 0;
          else score += 400; // never plan to hit yourself
        }
        return score;
      };

      const cands = [];
      let budget = 0;
      for (let e = -12; e <= 84; e += 3.5) {
        for (let p = 0.3; p <= 1.0001; p += 0.035) {
          cands.push({ e, p, score: evalShot(e, p) });
          if (++budget % 40 === 0) yield null;
        }
      }
      cands.sort((a, b) => a.score - b.score);
      const seeds = cands.slice(0, 3);
      let best = seeds[0];
      for (const sd of seeds) {
        for (let e = sd.e - 3; e <= sd.e + 3; e += 0.5) {
          for (let p = sd.p - 0.04; p <= sd.p + 0.04; p += 0.008) {
            if (p < 0.1 || p > 1) continue;
            const score = evalShot(e, p);
            // tiny jitter so equal options vary between games
            if (score + Math.random() * 0.5 < best.score) best = { e, p, score };
            if (++budget % 40 === 0) yield null;
          }
        }
      }

      // human-like error that shrinks with experience
      this.errA = this.errA * cfg.carry + U.gauss() * this.sigA;
      this.errP = this.errP * cfg.carry + U.gauss() * this.sigP;
      this.sigA = Math.max(cfg.floorA, this.sigA * cfg.decay);
      this.sigP = Math.max(cfg.floorP, this.sigP * cfg.decay);
      const e = best.e + this.errA;
      const p = U.clamp(best.p * (1 + this.errP), 0.12, 1);
      const rad = (e * Math.PI) / 180;
      this.shots++;
      return { dir: [side * Math.cos(rad), -Math.sin(rad)], power: p, ideal: best };
    }

    /** learn from where the egg ended */
    observe(ev, target) {
      if (!ev) return;
      if (ev.type === 'terrain') {
        const d = Math.abs(ev.x - target.pos.x);
        if (d > 160) this.blocked++;
      }
      if (ev.type === 'char' && ev.char === target) {
        // a hit: keep confidence but stay human
        this.errA *= 0.5;
        this.errP *= 0.5;
      }
    }
  }
  EMG.AIBrain = AIBrain;
  EMG.AI_CFG = CFG;
})();
