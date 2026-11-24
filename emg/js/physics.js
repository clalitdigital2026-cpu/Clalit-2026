/* EMG – projectile physics: deterministic fixed-step integration with swept collision.
   The exact same step function drives the real egg, the aiming preview and the AI's simulations. */
(function () {
  'use strict';
  const U = EMG.U;

  const P = (EMG.Physics = {
    G: 900,            // gravity, world units / s^2
    DT: 1 / 120,       // fixed simulation step
    EGG_R: 9,          // egg collision radius
    V_MAX: 1650,       // launch speed at full stretch
    MIN_POWER: 0.08,   // below this the shot is cancelled
    WIND_ACC: 240,     // horizontal acceleration at wind = 1
    MAX_T: 14,

    launchVelocity(dirX, dirY, power) {
      const v = U.clamp(power, 0, 1) * P.V_MAX;
      return { vx: dirX * v, vy: dirY * v };
    },

    makeEgg(x, y, vx, vy) {
      return { x, y, vx, vy, t: 0, rot: 0 };
    },

    /** circle against the terrain solidity mask (center + 8 rim samples) */
    circleHitsTerrain(terrain, x, y, r) {
      if (terrain.isSolid(x, y)) return true;
      const rr = r * 0.85;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * U.TAU;
        if (terrain.isSolid(x + Math.cos(a) * rr, y + Math.sin(a) * rr)) return true;
      }
      return false;
    },

    /**
     * Advance egg by one fixed step. world = { terrain, chars, wind, ignore, W, H }
     * Returns null while flying, or an event {type:'char'|'terrain'|'out', ...}
     */
    step(egg, world) {
      const DT = P.DT;
      egg.vx += world.wind * P.WIND_ACC * DT;
      egg.vy += P.G * DT;
      const dx = egg.vx * DT, dy = egg.vy * DT;
      const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2.5));
      const sx = dx / n, sy = dy / n;
      for (let i = 0; i < n; i++) {
        egg.x += sx;
        egg.y += sy;
        const chars = world.chars;
        for (let c = 0; c < chars.length; c++) {
          const ch = chars[c];
          if (ch === world.ignore || !ch.solid) continue;
          const part = ch.hitTest(egg.x, egg.y, P.EGG_R);
          if (part) return { type: 'char', char: ch, part, x: egg.x, y: egg.y };
        }
        if (world.terrain && P.circleHitsTerrain(world.terrain, egg.x, egg.y, P.EGG_R)) {
          return { type: 'terrain', x: egg.x, y: egg.y };
        }
      }
      egg.t += DT;
      egg.rot += egg.vx * DT * 0.02 + 0.05;
      if (egg.x < -400 || egg.x > world.W + 400 || egg.y > world.H + 200 || egg.t > P.MAX_T) {
        return { type: 'out', x: egg.x, y: egg.y };
      }
      return null;
    },

    /**
     * Run a full simulated trajectory.
     * opts: { maxT, record (bool), target {x,y} -> tracks min distance }
     */
    simulate(x, y, vx, vy, world, opts) {
      opts = opts || {};
      const egg = P.makeEgg(x, y, vx, vy);
      const maxT = opts.maxT || P.MAX_T;
      const pts = opts.record ? [] : null;
      let minD = Infinity, ev = null;
      const tg = opts.target;
      while (egg.t < maxT) {
        ev = P.step(egg, world);
        if (pts) pts.push(egg.x, egg.y);
        if (tg) {
          const d = Math.hypot(egg.x - tg.x, egg.y - tg.y);
          if (d < minD) minD = d;
        }
        if (ev) break;
      }
      return { event: ev, points: pts, minD, x: egg.x, y: egg.y, t: egg.t };
    },

    /** estimate surface normal at a point via mask gradient */
    surfaceNormal(terrain, x, y) {
      let nx = 0, ny = 0;
      const R = 10;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * U.TAU;
        const cx = Math.cos(a), cy = Math.sin(a);
        if (terrain.isSolid(x + cx * R, y + cy * R)) {
          nx -= cx;
          ny -= cy;
        }
      }
      const l = Math.hypot(nx, ny);
      if (l < 0.01) return { x: 0, y: -1 };
      return { x: nx / l, y: ny / l };
    },
  });
})();
