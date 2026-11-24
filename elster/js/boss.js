/* חביתת אלסטר – boss stage: אבא גולי, a giant rocker who throws fireballs.
   No turns: the player fires as fast as the slingshot reloads. */
(function () {
  'use strict';
  const U = ELSTER.U;
  const P = ELSTER.Physics;
  const A = ELSTER.Audio;
  const UI = ELSTER.UI;
  const G = ELSTER.Game.prototype;

  // a different rock outfit and fireball colour for every stage
  const OUTFITS = [
    { top: '#1c1c22', topShade: '#0e0e12', topHi: '#3a3a46', shirt: '#c1121f', print: '#ffd166', pants: '#22252e', fire: '#ff7a1f' },
    { top: '#3d6fb6', topShade: '#2a4f86', topHi: '#6d9be0', shirt: '#f4f1ea', print: '#e63946', pants: '#1d2a44', fire: '#4cc9f0', studs: '#ffd166' },
    { top: '#b5172a', topShade: '#7d0f1d', topHi: '#e63946', shirt: '#141418', print: '#ffffff', pants: '#141418', fire: '#06d6a0', chain: '#e9c46a' },
    { top: '#5b2a86', topShade: '#3c1a5c', topHi: '#8e5cc4', shirt: '#ffd166', print: '#5b2a86', pants: '#1c1c22', fire: '#b388ff', chain: '#e9c46a' },
    { top: '#2b2b2b', topShade: '#141414', topHi: '#4a4a4a', shirt: '#ff7a1f', print: '#141418', pants: '#3a1010', fire: '#ff3b3b' },
    { top: '#0d1b2a', topShade: '#060e17', topHi: '#1b3a5c', shirt: '#39ff14', print: '#0d1b2a', pants: '#0d1b2a', fire: '#39ff14', studs: '#39ff14' },
    { top: '#c0c6cf', topShade: '#8a919c', topHi: '#f1f4f8', shirt: '#ff5d8f', print: '#ffffff', pants: '#3a3f4a', fire: '#ff5dd4', chain: '#ffffff' },
    { top: '#d4a017', topShade: '#a07608', topHi: '#ffe066', shirt: '#141418', print: '#d4a017', pants: '#141418', fire: '#ffd700', chain: '#ffffff' },
  ];
  const EGG_DMG = { head: 20, body: 10 };
  const FIRE_DMG = 5;
  const KILL_BONUS = 100;
  const RELOAD = 0.45;

  G.startBoss = function (n) {
    this.mode = 'game';
    this.bossMode = true;
    this.menuAim = null;
    this.clearTimers();
    this.paused = false;
    this.stage = n;
    this.lastResult = null;
    const level = ELSTER.buildLevel(n, 5000 + n * 7919, { boss: true });
    this.setLevel(level);
    const player = (this.player = new ELSTER.Character(this.playerId));
    player.pos = { ...level.spawns.right };
    player.facing = -1;
    const outfit = OUTFITS[(n - 1) % OUTFITS.length];
    const def = Object.assign({}, ELSTER.CHAR_DEFS.gooli, outfit);
    const boss = (this.boss = new ELSTER.Character('gooli', { def }));
    boss.pos = { ...level.spawns.left };
    boss.facing = 1;
    boss.fireCol = outfit.fire;
    boss.weapon = null;
    boss.loaded = false;
    this.enemy = boss;
    this.chars = [player, boss];
    player.lookTarget = boss.headCenter;
    boss.lookTarget = player.headCenter;
    this.wind = 0;
    this.egg = null;
    this.fireballs = [];
    this.bossEggs = [];
    this.bossAcc = 0;
    // tougher, faster and angrier every stage
    const dm = { easy: 0.75, medium: 1, hard: 1.3 }[this.difficulty] || 1;
    this.bossMax = Math.round((70 + n * 30) * dm);
    this.bossHp = this.bossMax;
    this.bossSpeed = (40 + n * 14) * (0.8 + 0.2 * dm);
    this.bossInterval = Math.max(0.8, 2.6 - n * 0.18) / dm;
    this.bossAimErr = Math.max(0.05, 0.14 - n * 0.008);
    this.bossZone = [level.spawns.left.x - 240, level.spawns.left.x + 240];
    this.bossDir = 1;
    this.bossThrowIn = 2.2;
    this.bossGround = boss.pos.y;
    this.stageStartScore = this.runScore || 0;
    A.init();
    A._tempo = 168;
    // UI
    UI.hideScreens();
    UI.showHud(true);
    UI.setupHud(player, boss, n);
    UI.setStage(n + ' · בוס');
    UI.setHP('enemy', 100, true);
    UI.setWind(0, 0);
    UI.setTurn('קרב בוס!', 'enemy');
    UI.setPower(false);
    UI.hint(false);
    // a fixed camera that frames both fighters
    const left = this.bossZone[0] - 170, right = player.pos.x + 160;
    this.bossFit = { w: right - left, h: 760 };
    this.updateScale();
    const ground = (player.pos.y + boss.pos.y) / 2;
    this.cam.x = this.cam.tx = (left + right) / 2;
    this.cam.y = this.cam.ty = ground - (this.vh / this.cam.scale) * 0.24;
    this.cam.free = true;
    this.clampCam();
    // dramatic entrance
    boss.pos.y = this.bossGround - 900;
    this.state = 'bossIntro';
    this.stateT = 0;
    this.bossLanded = false;
    UI.banner('שלב בוס!', 'אבא גולי מגיע...');
    A.stage();
    this.after(2.6, () => {
      this.state = 'boss';
      this.stateT = 0;
      player.reload();
      UI.setTurn('ירו מהר!', 'player');
      UI.banner('ירו מהר!', null, true);
      this.updateWeaponUI();
    });
  };

  G.bossFire = function (shooter, dir, power, anchor) {
    const weapon = shooter.armed && shooter.weapon ? shooter.weapon : null;
    const v = P.launchVelocity(dir[0], dir[1], power);
    const egg = P.makeEgg(anchor[0], anchor[1], v.vx, v.vy, weapon ? ELSTER.WEAPONS[weapon].hitR : undefined);
    egg.shooter = shooter;
    egg.weapon = weapon;
    this.bossEggs.push(egg);
    this.preview = null;
    shooter.loaded = false;
    shooter.aim = null;
    shooter.setPose('shoot');
    shooter.recoil = 1;
    if (weapon) {
      shooter.weaponReady = false;
      shooter.armed = false;
      A.weaponFire(weapon);
    }
    A.release(power);
    UI.hint(false);
    this.updateWeaponUI();
    this.after(RELOAD, () => {
      if (this.bossMode && this.state === 'boss') shooter.reload();
    });
  };

  G.updateBoss = function (dt) {
    const boss = this.boss, pl = this.player;
    if (this.state === 'bossIntro') {
      const k = U.clamp(this.stateT / 0.9, 0, 1);
      boss.pos.y = this.bossGround - (1 - k * k) * 900;
      if (k >= 1 && !this.bossLanded) {
        this.bossLanded = true;
        this.cam.shake = 26;
        this.particles.dust(boss.pos.x - 60, this.bossGround, 10, this.level.theme.ground.hi);
        this.particles.dust(boss.pos.x + 60, this.bossGround, 10, this.level.theme.ground.hi);
        A.bossRoar();
        boss.setPose('bossThrow');
      }
      return;
    }
    if (this.state === 'boss') {
      // walk back and forth on his stage
      if (boss.pose !== 'hit' && boss.pose !== 'bossThrow') {
        boss.pos.x += this.bossDir * this.bossSpeed * dt;
        if (boss.pos.x < this.bossZone[0]) this.bossDir = 1;
        if (boss.pos.x > this.bossZone[1]) this.bossDir = -1;
        if (U.rand() < dt * 0.35) this.bossDir *= -1;
        const gy = this.level.terrain.surfaceY(boss.pos.x, boss.pos.y - 80);
        boss.pos.y = Math.min(gy, boss.pos.y + 400 * dt);
      }
      boss.lookTarget = pl.headCenter;
      // throw fireballs
      this.bossThrowIn -= dt;
      if (this.bossThrowIn <= 0) {
        this.bossThrowIn = this.bossInterval * U.rand.range(0.75, 1.25);
        boss.setPose('bossThrow');
        this.after(0.38, () => this.state === 'boss' && this.spawnFireball());
      }
    }
    this.updateFireballs(dt);
    this.updateBossEggs(dt);
  };

  G.spawnFireball = function () {
    const boss = this.boss, pl = this.player;
    const k = boss.k;
    const sx = boss.pos.x + boss.facing * 38 * k, sy = boss.pos.y - 76 * k;
    const tx = pl.pos.x, ty = pl.pos.y - 45;
    const th = U.rand.range(28, 56) * (Math.PI / 180);
    const d = Math.abs(tx - sx), h = sy - ty;
    let denom = 2 * Math.cos(th) ** 2 * (d * Math.tan(th) - h);
    if (denom <= 0) denom = 1;
    let v = Math.sqrt((P.G * d * d) / denom) * (1 + U.gauss() * this.bossAimErr);
    v = U.clamp(v, 300, 2200);
    const dir = Math.sign(tx - sx) || 1;
    this.fireballs.push({ x: sx, y: sy, vx: dir * v * Math.cos(th), vy: -v * Math.sin(th), t: 0, col: boss.fireCol });
    A.fireball();
  };

  G.updateFireballs = function (dt) {
    const pl = this.player, T = this.level.terrain;
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const f = this.fireballs[i];
      f.t += dt;
      let gone = false;
      for (let s = 0; s < 4 && !gone; s++) {
        const h = dt / 4;
        f.vy += P.G * h;
        f.x += f.vx * h;
        f.y += f.vy * h;
        if (this.state === 'boss' && pl.solid && pl.hitTest(f.x, f.y, 12)) {
          gone = true;
          this.fireHitPlayer(f);
        } else if (T.isSolid(f.x, f.y)) {
          gone = true;
          this.fireExplode(f, true);
        } else if (f.y > this.level.H + 100 || f.x < -200 || f.x > this.level.W + 200 || f.t > 8) {
          gone = true;
        }
      }
      if (gone) this.fireballs.splice(i, 1);
      else if (U.rand() < 0.7) {
        this.particles.add({ kind: 'spark', x: f.x + U.rand.range(-5, 5), y: f.y + U.rand.range(-5, 5), vx: -f.vx * 0.1, vy: -f.vy * 0.1 - 30, g: -40, s: U.rand.range(3, 6), life: 0.35, col: f.col });
      }
    }
  };

  G.fireExplode = function (f, ground) {
    for (let i = 0; i < 14; i++) {
      const a = U.rand() * U.TAU, v = U.rand.range(80, 260);
      this.particles.add({ kind: 'spark', x: f.x, y: f.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 300, s: U.rand.range(3, 6), life: U.rand.range(0.3, 0.6), col: i % 3 ? f.col : '#ffffff' });
    }
    this.particles.dust(f.x, f.y, 5, '#555555');
    this.particles.ring(f.x, f.y, f.col);
    if (ground) this.level.terrain.bakeScorch(f.x, f.y, 22);
    A.fireHit();
  };

  G.fireHitPlayer = function (f) {
    const pl = this.player;
    this.fireExplode(f, false);
    pl.hp = Math.max(0, pl.hp - FIRE_DMG);
    UI.setHP('player', pl.hp);
    this.cam.shake = 7;
    this.particles.text(pl.pos.x, pl.pos.y - 130, '-' + FIRE_DMG, { col: '#ff9f6b', size: 30, life: 0.9 });
    A.ouch();
    const aiming = this.pointer && this.pointer.mode === 'aim';
    if (!aiming && pl.pose !== 'shoot') pl.setPose('hit');
    if (pl.hp <= 0) this.bossLose();
  };

  G.updateBossEggs = function (dt) {
    if (!this.bossEggs.length) {
      this.bossAcc = 0;
      return;
    }
    this.bossAcc += Math.min(dt, 0.05);
    const world = { terrain: this.level.terrain, chars: [this.boss], wind: 0, ignore: this.player, W: this.level.W, H: this.level.H };
    while (this.bossAcc >= P.DT) {
      this.bossAcc -= P.DT;
      for (let i = this.bossEggs.length - 1; i >= 0; i--) {
        const egg = this.bossEggs[i];
        const ev = P.step(egg, world);
        if (egg.weapon && ((egg.t * 120) | 0) % 4 === 0) ELSTER.weaponTrail(this.particles, egg.weapon, egg.x, egg.y, egg.vx, egg.vy);
        if (ev) {
          this.bossEggs.splice(i, 1);
          this.bossEggImpact(egg, ev);
        }
      }
    }
  };

  G.damageBoss = function (dmg, x, y, sub) {
    const boss = this.boss;
    this.bossHp = Math.max(0, this.bossHp - dmg);
    boss.hp = Math.max(0, Math.round((this.bossHp / this.bossMax) * 100));
    UI.setHP('enemy', (this.bossHp / this.bossMax) * 100);
    this.particles.text(x, y, '-' + dmg, { col: '#ff5d7a', size: 40, life: 1, sub });
    if (this.bossHp <= 0 && this.state === 'boss') this.bossWin();
  };

  G.bossEggImpact = function (egg, ev) {
    const boss = this.boss;
    if (ev.type === 'char' && ev.char === boss) {
      const head = ev.part === 'head';
      const wk = egg.weapon;
      const dmg = wk ? ELSTER.WEAPON_DAMAGE[ev.part] : EGG_DMG[ev.part];
      if (wk) {
        boss.hitFx = ELSTER.WEAPONS[wk].fx;
        this.weaponSplats(boss, wk, ev);
        ELSTER.weaponBurst(this.particles, wk, ev.x, ev.y);
        A.weaponHit(wk);
      } else {
        boss.hitFx = null;
        boss.addSplat(ev.part, ev.x, ev.y);
        this.particles.eggBurst(ev.x, ev.y, -Math.sign(egg.vx), -0.5, 1);
        A.hit(head);
      }
      if (boss.pose !== 'bossThrow') boss.setPose('hit');
      this.cam.shake = wk ? 14 : head ? 8 : 5;
      this.damageBoss(dmg, ev.x, ev.y - 60, wk ? ELSTER.WEAPONS[wk].name + '!' : head ? 'בול בראש!' : null);
      return;
    }
    if (ev.type === 'terrain') {
      const n = P.surfaceNormal(this.level.terrain, ev.x, ev.y);
      const bx = ev.x - n.x * 4, by = ev.y - n.y * 4;
      if (egg.weapon) {
        this.weaponGroundSplat(egg.weapon, bx, by);
        ELSTER.weaponBurst(this.particles, egg.weapon, ev.x, ev.y);
        A.weaponHit(egg.weapon);
        // the blast still reaches a giant standing nearby
        const d = Math.hypot(ev.x - boss.pos.x, ev.y - (boss.pos.y - 120));
        if (d < 220 && this.state === 'boss') {
          if (boss.pose !== 'bossThrow') {
            boss.hitFx = ELSTER.WEAPONS[egg.weapon].fx;
            boss.setPose('hit');
          }
          this.damageBoss(ELSTER.WEAPON_DAMAGE.splash, boss.pos.x, boss.pos.y - 360, 'הדף!');
        }
      } else if (this.isLava(ev.x, ev.y, 6)) {
        this.level.terrain.bakeScorch(bx, by, 26);
        this.particles.sizzle(ev.x, ev.y);
      } else {
        this.level.terrain.bakeSplat(bx, by, 13, Math.atan2(n.y, n.x) + Math.PI / 2, (Math.random() * 1e6) | 0);
        this.particles.eggBurst(ev.x, ev.y, n.x, n.y, 0.8);
        A.splat();
      }
    }
  };

  G.bossWin = function () {
    const boss = this.boss, pl = this.player;
    this.state = 'ending';
    this.stateT = 0;
    this.clearTimers();
    this.fireballs.length = 0;
    this.bossEggs.length = 0;
    UI.setTurn('ניצחון!', 'player');
    UI.setPower(false);
    for (let i = 0; i < 4; i++) boss.addSplat(i % 2 ? 'body' : 'head', boss.pos.x + U.rand.range(-40, 40), boss.pos.y - U.rand.range(90, 300));
    boss.hitFx = null;
    boss.setPose('lose');
    A.fall();
    this.runScore = (this.runScore || 0) + KILL_BONUS;
    this.submitScore();
    this.after(1.0, () => {
      pl.setPose('victory');
      UI.banner('חיסלת את אבא גולי!', '+' + KILL_BONUS + ' נקודות', true);
    });
    this.after(2.15, () => {
      for (let i = 0; i < 3; i++) this.particles.poof(boss.pos.x + (i - 1) * 60, boss.pos.y - 100 - i * 60);
      this.cam.shake = 14;
      A.poof();
    });
    this.after(3.2, () => {
      A.win();
      this.particles.burstConfetti(this.vw, this.vh);
      this.after(1.2, () => this.particles.burstConfetti(this.vw, this.vh));
      this.lastResult = 'boss';
      const gained = this.runScore - this.stageStartScore;
      if (this.stage >= ELSTER.MAX_STAGE) {
        UI.setPoints('final-points', gained, this.runScore);
        UI.overlay('final', true);
      } else {
        UI.setPoints('win-points', gained, this.runScore);
        UI.showWin(this.stage, pl.hp, 'boss');
      }
    });
  };

  G.bossLose = function () {
    const boss = this.boss, pl = this.player;
    this.state = 'ending';
    this.stateT = 0;
    this.clearTimers();
    this.fireballs.length = 0;
    this.bossEggs.length = 0;
    if (this.pointer && this.pointer.mode === 'aim') {
      this.pointer = null;
      A.stretchStop();
    }
    pl.aim = null;
    UI.setPower(false);
    UI.setTurn('הפסד...', 'enemy');
    pl.setPose('lose');
    A.fall();
    this.after(2.15, () => {
      this.particles.poof(pl.pos.x, pl.pos.y - 50);
      A.poof();
    });
    this.after(1.0, () => boss.setPose('victory'));
    this.after(3.2, () => {
      UI.setPoints('lose-points', this.runScore - this.stageStartScore, this.runScore);
      this.submitScore();
      this.runScore = this.stageStartScore;
      this.lastResult = 'bossLose';
      A.lose();
      UI.showLose(this.stage, 'אבא גולי ניצח');
    });
  };

  G.drawBossLayer = function (ctx) {
    this.bossEggs.forEach((egg) => {
      if (egg.weapon) ELSTER.drawWeapon(ctx, egg.weapon, egg.x, egg.y, egg.rot, 1.15, this.time);
      else ELSTER.drawEgg(ctx, egg.x, egg.y, egg.rot, 0.95);
    });
    this.fireballs.forEach((f) => {
      const fl = 1 + Math.sin(this.time * 30 + f.t * 10) * 0.12;
      const r = 20 * fl;
      const g = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, U.shade(f.col, 0.3));
      g.addColorStop(0.65, f.col);
      g.addColorStop(1, U.rgba(f.col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, U.TAU);
      ctx.fill();
    });
  };

  /** "next" on the win screen: a stage leads to its boss, a boss to the next stage */
  G.nextFromWin = function () {
    if (this.lastResult === 'stage') this.startBoss(this.stage);
    else this.startStage(this.stage + 1);
  };
  G.retryLast = function () {
    if (this.lastResult === 'bossLose') this.startBoss(this.stage);
    else this.startStage(this.stage);
  };
})();
