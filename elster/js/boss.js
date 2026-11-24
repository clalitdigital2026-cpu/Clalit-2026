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
    this.momUsed = false;
    this.mom = null;
    this.gushes = [];
    // tougher, faster and angrier every stage
    const dm = { easy: 0.75, medium: 1, hard: 1.3 }[this.difficulty] || 1;
    this.bossMax = Math.round((80 + n * 11) * dm); // toughness grows a little; the real challenge is the firing
    this.bossHp = this.bossMax;
    this.bossSpeed = (40 + n * 14) * (0.8 + 0.2 * dm);
    this.bossInterval = Math.max(1.2, 2.4 - n * 0.15) / dm;
    // more fire every stage: single shots, then double, then triple volleys
    this.bossVolley = n <= 2 ? 1 : n <= 5 ? 2 : 3;
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
    const left = this.bossZone[0] - 170, right = player.pos.x + 380;
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
      this.updateMomUI();
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
        for (let v = 0; v < this.bossVolley; v++) {
          this.after(0.38 + v * 0.16, () => this.state === 'boss' && this.spawnFireball(v));
        }
      }
    }
    this.updateFireballs(dt);
    this.updateBossEggs(dt);
    this.updateMom(dt);
  };

  G.spawnFireball = function (idx) {
    const boss = this.boss, pl = this.player;
    const k = boss.k;
    const sx = boss.pos.x + boss.facing * 38 * k, sy = boss.pos.y - 76 * k;
    const tx = pl.pos.x, ty = pl.pos.y - 45;
    // volleys fan out a little so they cover more ground around the player
    const th = (U.rand.range(28, 56) + (idx || 0) * U.rand.range(-11, 11)) * (Math.PI / 180);
    const d = Math.abs(tx - sx), h = sy - ty;
    let denom = 2 * Math.cos(th) ** 2 * (d * Math.tan(th) - h);
    if (denom <= 0) denom = 1;
    let v = Math.sqrt((P.G * d * d) / denom) * (1 + U.gauss() * this.bossAimErr * (idx ? 1.8 : 1));
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
    this.updateMomUI();
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
      UI.banner('ניצחת את אבא גולי!', '+' + KILL_BONUS + ' נקודות', true);
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
    this.updateMomUI();
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
    this.drawGushes(ctx);
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

/* ---------------- "קרא לאמא": mom helps in boss fights ---------------- */
(function () {
  'use strict';
  const U = ELSTER.U;
  const P = ELSTER.Physics;
  const A = ELSTER.Audio;
  const UI = ELSTER.UI;
  const G = ELSTER.Game.prototype;
  const OUT = '#2a1b26';
  const HELP_TIME = 7;

  /** an illustrated triangular גושגידז׳ה pastry */
  ELSTER.drawGush = function (ctx, x, y, rot, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(s || 1, s || 1);
    const r = 11;
    const pts = [0, 1, 2].map((i) => [Math.cos(-Math.PI / 2 + (i * U.TAU) / 3) * r, Math.sin(-Math.PI / 2 + (i * U.TAU) / 3) * r]);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const n = pts[(i + 1) % 3];
      const mx = (p[0] + n[0]) / 2, my = (p[1] + n[1]) / 2;
      if (!i) ctx.moveTo(mx, my);
      ctx.quadraticCurveTo(n[0], n[1], (n[0] + pts[(i + 2) % 3][0]) / 2, (n[1] + pts[(i + 2) % 3][1]) / 2);
    });
    ctx.closePath();
    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, r + 2);
    g.addColorStop(0, '#ffe29a');
    g.addColorStop(0.7, '#f2b24c');
    g.addColorStop(1, '#c97b1e');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = OUT;
    ctx.stroke();
    // folded edges + filling peeking out
    ctx.beginPath();
    pts.forEach((p) => {
      ctx.moveTo(p[0] * 0.55, p[1] * 0.55);
      ctx.lineTo(p[0] * 0.2, p[1] * 0.2);
    });
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = 'rgba(150,80,20,0.7)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, 0, U.TAU);
    ctx.fillStyle = '#d64550';
    ctx.fill();
    ctx.fillStyle = '#fff6dc';
    [[-4, 3], [4, 3], [0, -5], [-1, 5]].forEach(([a, b]) => ctx.fillRect(a, b, 1.6, 0.9));
    ctx.restore();
  };

  G.resetMom = function () {
    this.momUsed = false;
    this.mom = null;
    this.gushes = [];
    this.updateMomUI();
  };

  G.updateMomUI = function () {
    UI.setMomButton(!!(this.bossMode && this.state === 'boss' && !this.momUsed));
  };

  G.callMom = function () {
    if (!this.bossMode || this.state !== 'boss' || this.momUsed || this.paused) return;
    this.momUsed = true;
    this.updateMomUI();
    const n = this.stage;
    const dm = { easy: 0.75, medium: 1, hard: 1.3 }[this.difficulty] || 1;
    // the tougher the boss, the better mom's help
    const interval = Math.max(0.28, 0.5 - n * 0.025);
    const throws = HELP_TIME / interval;
    const share = 0.28 + n * 0.02; // of the boss's health, on average (≈30% at stage 1, ≈45% at stage 8)
    const mom = (this.mom = new ELSTER.Character('ima'));
    mom.solid = false;
    mom.facing = -1;
    const landX = this.player.pos.x - 150;
    const landY = this.level.terrain.surfaceY(landX, this.player.pos.y - 200);
    const halfW = this.vw / 2 / this.cam.scale;
    const startX = this.cam.x + halfW + 120;
    mom.pos = { x: startX, y: landY - 260 };
    mom.setPose('karate');
    this.momState = {
      phase: 'enter', t: 0, x0: startX, y0: landY - 260, landX, landY,
      zone: [landX - 120, landX + 30], dir: -1, throwIn: 0.3, interval,
      dmg: Math.max(1, Math.round((this.bossMax * share) / (throws * 1.1))),
      err: Math.max(0.035, 0.11 - n * 0.008 - (dm - 1) * 0.02),
    };
    this.chars.push(mom);
    this.gushes = this.gushes || [];
    UI.banner('אמא רוחי באה לעזור!', 'קיאי!', true);
    A.momKiai();
  };

  G.updateMom = function (dt) {
    const mom = this.mom, st = this.momState;
    if (this.gushes && this.gushes.length) this.updateGushes(dt);
    if (!mom) return;
    st.t += dt;
    const T = this.level.terrain;
    if (st.phase === 'enter') {
      // flying karate kick in from the right
      const k = U.clamp(st.t / 0.8, 0, 1);
      mom.pos.x = U.lerp(st.x0, st.landX, U.easeOutCubic(k));
      mom.pos.y = U.lerp(st.y0, st.landY, k) - Math.sin(k * Math.PI) * 120;
      if (k >= 1) {
        st.phase = 'fight';
        st.t = 0;
        mom.pos.y = st.landY;
        mom.setPose('cheer');
        this.particles.dust(mom.pos.x, st.landY, 8, this.level.theme.ground.hi);
        this.cam.shake = 6;
      }
      return;
    }
    if (st.phase === 'fight') {
      if (this.state !== 'boss' || st.t >= HELP_TIME) {
        st.phase = 'exit';
        st.t = 0;
        mom.setPose(this.state === 'ending' && this.bossHp <= 0 ? 'victory' : 'karate');
        mom.facing = 1;
        st.x0 = mom.pos.x;
        st.y0 = mom.pos.y;
        if (!(this.bossHp <= 0)) UI.banner('אמא רוחי יוצאת!', null, true);
        return;
      }
      // shuffle around and keep throwing
      if (mom.pose !== 'momThrow') {
        mom.pos.x += st.dir * 70 * dt;
        if (mom.pos.x < st.zone[0]) st.dir = 1;
        if (mom.pos.x > st.zone[1]) st.dir = -1;
        mom.pos.y = Math.min(T.surfaceY(mom.pos.x, mom.pos.y - 40), mom.pos.y + 400 * dt);
      }
      mom.facing = -1;
      st.throwIn -= dt;
      if (st.throwIn <= 0) {
        st.throwIn = st.interval * U.rand.range(0.8, 1.2);
        mom.setPose('momThrow');
        this.after(0.18, () => this.mom && this.state === 'boss' && this.throwGush());
      }
      return;
    }
    if (st.phase === 'exit') {
      if (this.bossHp <= 0 && st.t < 2.2) return; // celebrate a moment first
      const k = U.clamp((st.t - (this.bossHp <= 0 ? 2.2 : 0)) / 0.8, 0, 1);
      if (mom.pose !== 'karate') {
        mom.setPose('karate');
        mom.facing = 1;
      }
      const halfW = this.vw / 2 / this.cam.scale;
      mom.pos.x = U.lerp(st.x0, this.cam.x + halfW + 160, U.easeInOutCubic(k));
      mom.pos.y = st.y0 - Math.sin(k * Math.PI) * 140;
      if (k >= 1) {
        this.chars = this.chars.filter((c) => c !== mom);
        this.mom = null;
      }
    }
  };

  G.throwGush = function () {
    const mom = this.mom, boss = this.boss, st = this.momState;
    const sx = mom.pos.x + mom.facing * 30, sy = mom.pos.y - 72;
    const head = U.rand() < 0.4;
    const tx = boss.pos.x, ty = boss.pos.y - (head ? 250 : 120);
    const th = U.rand.range(22, 42) * (Math.PI / 180);
    const d = Math.abs(tx - sx), h = sy - ty;
    let denom = 2 * Math.cos(th) ** 2 * (d * Math.tan(th) - h);
    if (denom <= 0) denom = 1;
    const v = U.clamp(Math.sqrt((P.G * d * d) / denom) * (1 + U.gauss() * st.err), 300, 2200);
    const dir = Math.sign(tx - sx) || -1;
    this.gushes.push({ x: sx, y: sy, vx: dir * v * Math.cos(th), vy: -v * Math.sin(th), t: 0, rot: 0, dmg: st.dmg });
    A.momThrow();
  };

  G.updateGushes = function (dt) {
    const boss = this.boss, T = this.level.terrain;
    for (let i = this.gushes.length - 1; i >= 0; i--) {
      const g = this.gushes[i];
      g.t += dt;
      g.rot += dt * 14;
      let gone = false;
      for (let s = 0; s < 4 && !gone; s++) {
        const h = dt / 4;
        g.vy += P.G * h;
        g.x += g.vx * h;
        g.y += g.vy * h;
        const part = this.state === 'boss' && boss.solid ? boss.hitTest(g.x, g.y, 10) : null;
        if (part) {
          gone = true;
          const dmg = part === 'head' ? Math.round(g.dmg * 1.5) : g.dmg;
          this.gushCrumbs(g.x, g.y);
          A.momHit();
          if (boss.pose !== 'bossThrow' && boss.pose !== 'hit' && U.rand() < 0.35) {
            boss.hitFx = null;
            boss.setPose('hit');
          }
          this.damageBoss(dmg, g.x, g.y - 40, null);
        } else if (T.isSolid(g.x, g.y)) {
          gone = true;
          this.gushCrumbs(g.x, g.y);
        } else if (g.y > this.level.H + 100 || g.t > 6) gone = true;
      }
      if (gone) this.gushes.splice(i, 1);
    }
  };

  G.gushCrumbs = function (x, y) {
    for (let i = 0; i < 8; i++) {
      const a = U.rand() * U.TAU, v = U.rand.range(60, 200);
      this.particles.add({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 600, s: U.rand.range(2.5, 4.5), life: U.rand.range(0.4, 0.7), col: U.rand() < 0.7 ? '#f2b24c' : '#d64550' });
    }
  };

  G.drawGushes = function (ctx) {
    (this.gushes || []).forEach((g) => ELSTER.drawGush(ctx, g.x, g.y, g.rot, 1.7));
  };
})();
