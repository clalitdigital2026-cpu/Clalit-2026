/* חביתת אלסטר – core game: state machine, turns, input, camera and rendering */
(function () {
  'use strict';
  const U = ELSTER.U;
  const P = ELSTER.Physics;
  const A = ELSTER.Audio;
  const UI = ELSTER.UI;

  const PREVIEW_T = { easy: 1.5, medium: 0.42, hard: 0 };
  const DAMAGE = { head: 35, body: 20 };
  const MAX_STAGE = 8;
  const GENDER = { roni: 'f', shiri: 'f', yair: 'm' };

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.cam = { x: 600, y: 640, scale: 1, tx: 600, ty: 640, shake: 0, free: false, focus: null, speed: 3 };
      this.particles = new ELSTER.Particles();
      this.mode = 'menu';
      this.state = 'idle';
      this.stateT = 0;
      this.time = 0;
      this.paused = false;
      this.wind = 0;
      this.chars = [];
      this.egg = null;
      this.trail = [];
      this.acc = 0;
      this.pointer = null;
      this.timers = [];
      this.settings = U.store.get('settings', { sound: true, music: true });
      this.progress = U.store.get('progress', { highest: 1, best: 0, lastChar: null, lastDiff: null });
      A.soundOn = this.settings.sound;
      A.musicOn = this.settings.music;
      this.bindInput();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    }

    // ------------------------------------------------------------ setup
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;
      this.vw = window.innerWidth;
      this.vh = window.innerHeight;
      this.canvas.width = Math.round(this.vw * dpr);
      this.canvas.height = Math.round(this.vh * dpr);
      this.updateScale();
      const portrait = this.vh > this.vw && Math.max(this.vw, this.vh) < 1100;
      document.getElementById('rotate').classList.toggle('hidden', !portrait);
    }
    updateScale() {
      // phones in landscape get a closer camera so characters and the egg are easier to grab
      const small = this.vh < 520;
      const viewH = this.mode === 'menu' ? 640 : small ? 540 : 700;
      this.cam.scale = Math.min(this.vh / viewH, this.vw / (small ? 760 : 1080));
    }

    after(sec, fn) {
      this.timers.push({ t: sec, fn });
    }
    clearTimers() {
      this.timers.length = 0;
    }

    saveProgress() {
      U.store.set('progress', this.progress);
    }

    // ------------------------------------------------------------ menu scene
    startMenu() {
      this.mode = 'menu';
      this.state = 'menu';
      this.clearTimers();
      this.paused = false;
      this.updateScale();
      const level = ELSTER.buildLevel(1, 4242, { menu: true });
      this.setLevel(level);
      const W = level.W;
      const xs = [W / 2 - 360, W / 2 + 10, W / 2 + 380];
      const ids = ['roni', 'yair', 'shiri'];
      this.chars = ids.map((id, i) => {
        const ch = new ELSTER.Character(id);
        ch.pos.x = xs[i];
        ch.pos.y = level.terrain.surfaceY(xs[i], level.hm[Math.round(xs[i] / level.hmStep)] - 40);
        ch.facing = i === 0 ? 1 : i === 2 ? -1 : U.rand.sign();
        return ch;
      });
      const feet = this.chars.reduce((a, c) => a + c.pos.y, 0) / 3;
      this.cam.x = this.cam.tx = xs[1];
      this.cam.y = this.cam.ty = feet - (this.vh * 0.3) / this.cam.scale;
      this.cam.free = true;
      this.menuShotIn = 1.2;
      this.wind = 0;
      UI.showHud(false);
      UI.setTitleInfo(this.progress);
      UI.show('title');
      A.startMusic();
    }

    menuShoot() {
      const shooter = U.rand.pick(this.chars.filter((c) => c.pose === 'idle'));
      if (!shooter) return;
      const others = this.chars.filter((c) => c !== shooter);
      const target = U.rand.pick(others);
      shooter.facing = Math.sign(target.pos.x - shooter.pos.x);
      const a0 = shooter.restAnchor;
      const theta = U.rand.range(35, 62) * (Math.PI / 180);
      const d = target.pos.x - a0.x, dyUp = a0.y - (target.pos.y - 70);
      const adx = Math.abs(d);
      const denom = 2 * Math.cos(theta) ** 2 * (adx * Math.tan(theta) - dyUp);
      if (denom <= 0) return;
      let v = Math.sqrt((P.G * adx * adx) / denom) * U.rand.range(0.94, 1.06);
      const power = U.clamp(v / P.V_MAX, 0.1, 1);
      const dir = [Math.sign(d) * Math.cos(theta), -Math.sin(theta)];
      shooter.setPose('aim');
      shooter.aim = { anchor: [a0.x, a0.y], dir, power: 0 };
      this.menuAim = { shooter, dir, power, t: 0 };
    }

    // ------------------------------------------------------------ campaign
    startCampaign(diff, playerId, stage) {
      this.difficulty = diff;
      this.playerId = playerId;
      const others = ELSTER.CHAR_IDS.filter((id) => id !== playerId);
      if (U.rand() < 0.5) others.reverse();
      this.opponents = others;
      this.progress.lastChar = playerId;
      this.progress.lastDiff = diff;
      this.saveProgress();
      this.startStage(stage || 1);
    }

    setLevel(level) {
      this.level = level;
      this.bg = new ELSTER.Background(level.theme, level.W, level.seed);
      this.particles.clear();
      this.particles.terrain = level.terrain;
      this.particles.setAmbient(level.theme.ambient);
      this.egg = null;
      this.trail = [];
    }

    startStage(n) {
      this.mode = 'game';
      this.updateScale();
      this.clearTimers();
      this.paused = false;
      this.stage = n;
      const level = ELSTER.buildLevel(n, 1000 + n * 7919);
      this.setLevel(level);
      const oppId = this.opponents[(n - 1) % 2];
      const player = (this.player = new ELSTER.Character(this.playerId));
      const enemy = (this.enemy = new ELSTER.Character(oppId));
      player.pos = { ...level.spawns.right };
      player.facing = -1;
      enemy.pos = { ...level.spawns.left };
      enemy.facing = 1;
      player.lookTarget = enemy.headCenter;
      enemy.lookTarget = player.headCenter;
      this.chars = [player, enemy];
      this.ai = new ELSTER.AIBrain(this.difficulty);
      this.wind = 0;
      this.shotsFired = 0;
      UI.hideScreens();
      UI.showHud(true);
      UI.setupHud(player, enemy, n);
      UI.setWind(0, level.windMax);
      UI.setTurn('מתכוננים...', null);
      UI.setPower(false);
      UI.hint(false);
      // camera intro: enemy -> player
      this.cam.free = false;
      this.focusOn(enemy, true);
      this.state = 'intro';
      this.stateT = 0;
      UI.banner('שלב ' + n, level.theme.name);
      A.init();
      A.stage();
      A.startMusic();
      this.after(1.4, () => this.focusOn(player));
      this.after(2.7, () => this.beginTurn('player'));
    }

    other(ch) {
      return ch === this.player ? this.enemy : this.player;
    }

    focusOn(ch, instant) {
      this.cam.free = false;
      this.cam.focus = ch;
      const halfW = this.vw / 2 / this.cam.scale;
      const toward = Math.sign(this.other(ch).pos.x - ch.pos.x) || 1;
      this.cam.tx = ch.pos.x + toward * Math.min(halfW * 0.35, 320);
      this.cam.ty = ch.pos.y - 150;
      this.cam.speed = 3;
      if (instant) {
        this.cam.x = this.cam.tx;
        this.cam.y = this.cam.ty;
        this.clampCam();
      }
    }

    beginTurn(who) {
      if (this.state === 'ending') return;
      const shooter = who === 'player' ? this.player : this.enemy;
      const target = this.other(shooter);
      this.turn = who;
      this.shooter = shooter;
      if (this.level.windMax > 0) {
        const w = U.clamp(this.wind * 0.35 + U.gauss() * 0.55, -1, 1) * this.level.windMax;
        this.wind = U.clamp(w, -1, 1);
      }
      UI.setWind(this.wind / Math.max(this.level.windMax, 0.001) * Math.min(1, this.level.windMax + 0.2), this.level.windMax);
      shooter.facing = Math.sign(target.pos.x - shooter.pos.x) || shooter.facing;
      shooter.reload();
      shooter.isActive = true;
      target.isActive = false;
      shooter.lookTarget = target.headCenter;
      target.lookTarget = shooter.headCenter;
      A.pop();
      this.focusOn(shooter);
      const text = who === 'player' ? 'התור שלך!' : 'התור של ' + shooter.name;
      UI.banner(text, null, true);
      UI.setTurn(text, who === 'player' ? 'player' : 'enemy');
      A.turn();
      if (who === 'player') {
        this.state = 'aim';
        this.stateT = 0;
        if (this.stage === 1 && this.shotsFired === 0) this.after(1.6, () => this.state === 'aim' && !this.pointer && UI.hint(true));
      } else {
        this.state = 'aiThink';
        this.stateT = 0;
        shooter.setPose('think');
        A.think();
        this.planner = this.ai.plan(shooter, target, this);
        this.plan = null;
      }
    }

    // ------------------------------------------------------------ input
    bindInput() {
      const c = this.canvas;
      c.addEventListener('pointerdown', (e) => this.onDown(e));
      window.addEventListener('pointermove', (e) => this.onMove(e));
      window.addEventListener('pointerup', (e) => this.onUp(e));
      window.addEventListener('pointercancel', (e) => this.onUp(e, true));
      c.addEventListener('wheel', (e) => {
        if (this.mode !== 'game' || this.paused) return;
        e.preventDefault();
        this.cam.free = true;
        this.cam.x += (e.deltaX + e.deltaY) / this.cam.scale * 0.8;
        this.clampCam();
      }, { passive: false });
      ['touchstart', 'touchmove', 'gesturestart'].forEach((ev) =>
        document.addEventListener(ev, (e) => {
          if (e.target.closest && e.target.closest('.panel, button')) return;
          e.preventDefault();
        }, { passive: false })
      );
      document.addEventListener('contextmenu', (e) => e.preventDefault());
      window.addEventListener('keydown', (e) => {
        if (this.mode !== 'game') return;
        if (e.key === 'Escape' || e.key === 'p') this.togglePause();
        if (e.key === 'ArrowLeft') { this.cam.free = true; this.cam.x -= 80 / this.cam.scale; }
        if (e.key === 'ArrowRight') { this.cam.free = true; this.cam.x += 80 / this.cam.scale; }
        if (e.key === 'c' || e.key === 'Tab') { e.preventDefault(); this.switchCam(); }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.mode === 'game' && !this.paused && this.state !== 'ending') this.togglePause();
      });
    }

    toWorld(sx, sy) {
      const s = this.cam.scale;
      return { x: (sx - this.vw / 2) / s + this.cam.x, y: (sy - this.vh / 2) / s + this.cam.y };
    }
    toScreen(wx, wy) {
      const s = this.cam.scale;
      return { x: (wx - this.cam.x) * s + this.vw / 2, y: (wy - this.cam.y) * s + this.vh / 2 };
    }
    maxDrag() {
      return U.clamp(Math.min(this.vw, this.vh) * 0.3, 110, 210);
    }

    onDown(e) {
      A.init();
      if (this.mode !== 'game' || this.paused || this.pointer) return;
      const pl = this.player;
      if (this.state === 'aim' && this.turn === 'player') {
        const a = pl.restAnchor;
        const sp = this.toScreen(a.x, a.y);
        const d = Math.hypot(e.clientX - sp.x, e.clientY - sp.y);
        const grab = Math.max(52, 46 * this.cam.scale);
        if (d <= grab) {
          this.pointer = { id: e.pointerId, mode: 'aim', anchor: [a.x, a.y], sx: sp.x, sy: sp.y };
          try { this.canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
          pl.setPose('aim');
          pl.aim = { anchor: [a.x, a.y], dir: [pl.facing, 0], power: 0 };
          this.cam.free = true; // freeze camera while aiming
          this.canvas.classList.add('aiming');
          A.stretchStart();
          UI.hint(false);
          this.updateAim(e.clientX, e.clientY);
          return;
        }
      }
      this.pointer = { id: e.pointerId, mode: 'pan', x0: e.clientX, y0: e.clientY, cx: this.cam.x, cy: this.cam.y };
    }

    onMove(e) {
      const p = this.pointer;
      if (!p || p.id !== e.pointerId) return;
      if (p.mode === 'aim') {
        e.preventDefault && e.preventDefault();
        this.updateAim(e.clientX, e.clientY);
      } else if (p.mode === 'pan') {
        const dx = e.clientX - p.x0, dy = e.clientY - p.y0;
        if (Math.abs(dx) + Math.abs(dy) > 4) this.cam.free = true;
        if (this.cam.free) {
          this.cam.x = p.cx - dx / this.cam.scale;
          this.cam.y = p.cy - dy / this.cam.scale * 0.6;
          this.clampCam();
        }
      }
    }

    onUp(e, cancel) {
      const p = this.pointer;
      if (!p || p.id !== e.pointerId) return;
      this.pointer = null;
      if (p.mode === 'aim') {
        this.canvas.classList.remove('aiming');
        const pl = this.player;
        A.stretchStop();
        UI.setPower(false);
        if (!cancel && pl.aim && pl.aim.power >= P.MIN_POWER && this.state === 'aim') {
          this.fire(pl, pl.aim.dir, pl.aim.power, pl.aim.anchor);
        } else {
          pl.aim = null;
          pl.setPose('idle');
          this.preview = null;
        }
      }
    }

    updateAim(sx, sy) {
      const pl = this.player, p = this.pointer;
      let vx = sx - p.sx, vy = sy - p.sy;
      const len = Math.hypot(vx, vy);
      const power = U.clamp(len / this.maxDrag(), 0, 1);
      if (len > 4) {
        const dir = [-vx / len, -vy / len];
        pl.aim.dir = dir;
        if (dir[0] * pl.facing < -0.2) pl.facing = Math.sign(dir[0]);
      }
      pl.aim.power = power;
      A.stretchUpdate(power);
      const ang = Math.atan2(-pl.aim.dir[1], Math.abs(pl.aim.dir[0])) * (180 / Math.PI);
      UI.setPower(true, power, ang);
      this.computePreview(pl, pl.aim.anchor, pl.aim.dir, power);
    }

    computePreview(shooter, anchor, dir, power) {
      const T = PREVIEW_T[this.difficulty] || 0;
      if (!T || power < P.MIN_POWER) {
        this.preview = null;
        return;
      }
      const v = P.launchVelocity(dir[0], dir[1], power);
      const r = P.simulate(anchor[0], anchor[1], v.vx, v.vy, this.physWorld(shooter), { maxT: T, record: true });
      this.preview = r.points;
    }

    physWorld(shooter) {
      return { terrain: this.level.terrain, chars: this.chars, wind: this.wind, ignore: shooter, W: this.level.W, H: this.level.H };
    }

    // ------------------------------------------------------------ shooting
    fire(shooter, dir, power, anchor) {
      anchor = anchor || [shooter.restAnchor.x, shooter.restAnchor.y];
      const v = P.launchVelocity(dir[0], dir[1], power);
      this.egg = P.makeEgg(anchor[0], anchor[1], v.vx, v.vy);
      this.egg.shooter = shooter;
      this.trail = [];
      this.acc = 0;
      this.preview = null;
      shooter.loaded = false;
      shooter.aim = null;
      shooter.setPose('shoot');
      shooter.recoil = 1;
      this.state = 'flight';
      this.stateT = 0;
      this.shotsFired++;
      this.cam.free = false;
      this.cam.focus = null;
      this.cam.speed = 5;
      A.release(power);
      A.whistleStart();
      UI.hint(false);
      if (this.mode === 'game') UI.setTurn('הביצה באוויר!', this.turn === 'player' ? 'player' : 'enemy');
    }

    impact(ev) {
      const egg = this.egg;
      const shooter = egg.shooter;
      const target = this.other(shooter) || null;
      this.egg = null;
      A.whistleStop();
      const sp = Math.hypot(egg.vx, egg.vy);
      const nx = -egg.vx / (sp || 1), ny = -egg.vy / (sp || 1);
      let killed = false;
      if (ev.type === 'char') {
        const ch = ev.char;
        const head = ev.part === 'head';
        const dmg = DAMAGE[ev.part];
        if (this.mode === 'game') ch.hp = Math.max(0, ch.hp - dmg);
        ch.addSplat(ev.part, ev.x, ev.y);
        ch.setPose('hit');
        this.particles.eggBurst(ev.x, ev.y, nx, ny, 1);
        this.particles.sparks(ev.x, ev.y, '#ffd84d', head ? 14 : 8);
        if (this.mode === 'game') {
          this.particles.text(ch.pos.x, ch.pos.y - 140, '-' + dmg, { col: head ? '#ff5d7a' : '#ffd166', size: head ? 46 : 38, sub: head ? 'בול בראש!' : 'פגיעה!' });
          UI.setHP(ch === this.player ? 'player' : 'enemy', ch.hp);
        }
        this.cam.shake = head ? 16 : 10;
        A.hit(head);
        this.after(0.25, () => A.ouch());
        if (shooter && shooter !== ch && this.mode === 'game') this.after(0.35, () => {
          if (shooter.pose !== 'victory' && shooter.pose !== 'lose') {
            shooter.setPose('cheer');
            A.cheer();
          }
        });
        killed = this.mode === 'game' && ch.hp <= 0;
      } else if (ev.type === 'terrain') {
        const n = P.surfaceNormal(this.level.terrain, ev.x, ev.y);
        const bx = ev.x - n.x * 4, by = ev.y - n.y * 4;
        const lava = this.level.lavaY != null && ev.y >= this.level.lavaY - 6;
        if (lava) {
          this.level.terrain.bakeScorch(bx, by, 26);
          this.particles.sizzle(ev.x, ev.y);
          A.sizzle();
        } else {
          this.level.terrain.bakeSplat(bx, by, 13, Math.atan2(n.y, n.x) + Math.PI / 2, (Math.random() * 1e6) | 0);
        }
        this.particles.eggBurst(ev.x, ev.y, n.x, n.y, 0.9);
        A.splat();
        this.cam.shake = 5;
        if (this.mode === 'game' && target) {
          const near = Math.hypot(ev.x - target.pos.x, ev.y - (target.pos.y - 40));
          this.particles.text(ev.x, ev.y - 50, near < 110 ? 'כמעט!' : 'פספוס!', { col: near < 110 ? '#ffd166' : '#ffffff', size: 28, life: 1.1 });
        }
        if (shooter && this.mode === 'game') this.after(0.4, () => {
          shooter.setPose('frustrated');
          A.grumble();
        });
      } else {
        if (this.mode === 'game') {
          const sp2 = this.toWorld(this.vw / 2, this.vh * 0.4);
          this.particles.text(sp2.x, sp2.y, 'החוצה!', { col: '#ffffff', size: 32, life: 1.2 });
          this.after(0.2, () => {
            shooter.setPose('frustrated');
            A.grumble();
          });
        }
      }
      if (this.mode !== 'game') {
        this.state = 'menu';
        return;
      }
      if (shooter === this.enemy) this.ai.observe(ev, this.player);
      this.state = 'after';
      this.stateT = 0;
      UI.setTurn('...', null);
      if (killed) {
        this.after(0.9, () => this.endStage(shooter));
      } else {
        this.after(ev.type === 'char' ? 1.5 : 1.35, () => this.beginTurn(shooter === this.player ? 'enemy' : 'player'));
      }
    }

    endStage(winner) {
      const loser = this.other(winner);
      this.state = 'ending';
      this.stateT = 0;
      this.clearTimers();
      UI.setTurn(winner === this.player ? 'ניצחון!' : 'הפסד...', winner === this.player ? 'player' : 'enemy');
      // loser gets egged one more time and falls over
      for (let i = 0; i < 3; i++) loser.addSplat(i % 2 ? 'body' : 'head', loser.pos.x + U.rand.range(-15, 15), loser.pos.y - U.rand.range(30, 100));
      loser.setPose('lose');
      loser.isActive = false;
      winner.isActive = false;
      A.fall();
      this.focusOn(loser);
      this.after(2.15, () => {
        this.particles.poof(loser.pos.x, loser.pos.y - 50);
        this.cam.shake = 8;
        A.poof();
      });
      this.after(2.6, () => {
        winner.setPose('victory');
        winner.facing = winner === this.player ? -1 : 1;
        this.focusOn(winner);
      });
      this.after(3.3, () => {
        if (winner === this.player) {
          A.win();
          this.particles.burstConfetti(this.vw, this.vh);
          this.after(1.2, () => this.particles.burstConfetti(this.vw, this.vh));
          const next = Math.min(MAX_STAGE, this.stage + 1);
          this.progress.highest = Math.max(this.progress.highest || 1, next);
          this.progress.best = Math.max(this.progress.best || 0, this.stage);
          this.saveProgress();
          if (this.stage >= MAX_STAGE) UI.overlay('final', true);
          else UI.showWin(this.stage, this.player.hp);
        } else {
          A.lose();
          const verb = GENDER[winner.id] === 'f' ? 'ניצחה' : 'ניצח';
          UI.showLose(this.stage, winner.name + ' ' + verb);
        }
      });
    }

    // ------------------------------------------------------------ pause / camera buttons
    togglePause() {
      if (this.mode !== 'game') return;
      this.paused = !this.paused;
      UI.overlay('pause', this.paused);
      UI.setMusicLabel(A.musicOn);
      if (this.paused) {
        A.stretchStop();
        A.whistleStop();
        if (this.pointer && this.pointer.mode === 'aim') {
          this.pointer = null;
          this.player.aim = null;
          this.player.setPose('idle');
          this.preview = null;
          UI.setPower(false);
        }
      } else if (this.egg) A.whistleStart();
    }
    switchCam() {
      if (this.mode !== 'game' || this.state === 'flight') return;
      const cur = this.cam.focus;
      const next = cur === this.player ? this.enemy : this.player;
      this.focusOn(next);
      this.cam.speed = 4;
    }

    // ------------------------------------------------------------ update
    update(dt) {
      this.time += dt;
      UI.updateCards(dt);
      if (this.paused) return;
      this.stateT += dt;
      // timers
      for (let i = this.timers.length - 1; i >= 0; i--) {
        const t = this.timers[i];
        t.t -= dt;
        if (t.t <= 0) {
          this.timers.splice(i, 1);
          t.fn();
        }
      }
      this.chars.forEach((c) => c.update(dt));
      if (this.bg) this.bg.update(dt, this.wind);
      this.particles.update(dt, this.wind);

      if (this.mode === 'menu') this.updateMenu(dt);

      if (this.state === 'aiThink') {
        const t0 = performance.now();
        while (this.planner && performance.now() - t0 < 7) {
          const r = this.planner.next();
          if (r.done) {
            this.plan = r.value;
            this.planner = null;
          }
        }
        if (this.plan && this.stateT > 1.25) {
          const sh = this.enemy;
          this.state = 'aiAim';
          this.stateT = 0;
          sh.setPose('aim');
          const a = sh.restAnchor;
          sh.aim = { anchor: [a.x, a.y], dir: [sh.facing, -0.2], power: 0 };
          A.stretchStart();
        }
      } else if (this.state === 'aiAim') {
        const sh = this.enemy, pl = this.plan;
        const k = U.clamp(this.stateT / 1.0, 0, 1);
        const e = U.easeInOutCubic(k);
        const a0 = Math.atan2(-0.2, sh.facing), a1 = Math.atan2(pl.dir[1], pl.dir[0]);
        let da = a1 - a0;
        while (da > Math.PI) da -= U.TAU;
        while (da < -Math.PI) da += U.TAU;
        const ang = a0 + da * e;
        sh.aim.dir = [Math.cos(ang), Math.sin(ang)];
        sh.aim.power = pl.power * e + Math.sin(this.stateT * 30) * 0.01 * (1 - k);
        A.stretchUpdate(sh.aim.power);
        if (this.stateT > 1.35) {
          A.stretchStop();
          this.fire(sh, pl.dir, pl.power, sh.aim.anchor);
        }
      }

      if (this.egg) this.updateEgg(dt);
      this.updateCamera(dt);
      UI.updateHudAvatars(dt);
    }

    updateMenu(dt) {
      if (this.state !== 'menu') return;
      if (this.menuAim) {
        const m = this.menuAim;
        m.t += dt;
        const k = U.easeInOutCubic(U.clamp(m.t / 0.8, 0, 1));
        m.shooter.aim.dir = m.dir;
        m.shooter.aim.power = m.power * k;
        if (m.t > 1.0) {
          this.fire(m.shooter, m.dir, m.power, m.shooter.aim.anchor);
          this.menuAim = null;
        }
        return;
      }
      if (!this.egg) {
        this.menuShotIn -= dt;
        if (this.menuShotIn <= 0) {
          this.menuShotIn = U.rand.range(1.2, 2.4);
          this.menuShoot();
        }
      }
    }

    updateEgg(dt) {
      this.acc += Math.min(dt, 0.05);
      const world = this.physWorld(this.egg.shooter);
      while (this.acc >= P.DT && this.egg) {
        this.acc -= P.DT;
        const ev = P.step(this.egg, world);
        if (this.egg && ((this.egg.t * 120) | 0) % 2 === 0) {
          this.trail.push([this.egg.x, this.egg.y]);
          if (this.trail.length > 26) this.trail.shift();
        }
        if (ev) {
          this.impact(ev);
          break;
        }
      }
      if (this.egg) A.whistleUpdate(this.egg.vy, Math.hypot(this.egg.vx, this.egg.vy));
    }

    clampCam() {
      const c = this.cam, L = this.level;
      if (!L) return;
      const halfW = this.vw / 2 / c.scale, halfH = this.vh / 2 / c.scale;
      if (L.W <= halfW * 2) c.x = L.W / 2;
      else c.x = U.clamp(c.x, halfW, L.W - halfW);
      c.y = U.clamp(c.y, -1100 + halfH, L.H - halfH + 20);
    }

    updateCamera(dt) {
      const c = this.cam;
      if (this.mode === 'menu') {
        c.shake = Math.max(0, c.shake - dt * 30);
        return;
      }
      if (!c.free) {
        if (this.egg) {
          c.tx = this.egg.x + this.egg.vx * 0.18;
          c.ty = Math.min(this.egg.y + this.egg.vy * 0.08, this.level.H);
          // keep some ground in view while the egg is low
          c.ty = Math.max(c.ty, -900);
        }
        const k = 1 - Math.exp(-dt * c.speed);
        c.x += (c.tx - c.x) * k;
        c.y += (c.ty - c.y) * k;
        this.clampCam();
      }
      c.shake = Math.max(0, c.shake - dt * 30);
    }

    // ------------------------------------------------------------ render
    render() {
      const ctx = this.ctx, dpr = this.dpr, vw = this.vw, vh = this.vh;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!this.level) {
        ctx.fillStyle = '#1b1033';
        ctx.fillRect(0, 0, vw, vh);
        return;
      }
      const c = this.cam, s = c.scale;
      this.bg.draw(ctx, c, vw, vh, this.time);
      const sx = (Math.random() - 0.5) * c.shake, sy = (Math.random() - 0.5) * c.shake;
      ctx.save();
      ctx.translate(vw / 2 + sx, vh / 2 + sy);
      ctx.scale(s, s);
      ctx.translate(-c.x, -c.y);
      // terrain (only visible part)
      const T = this.level.terrain;
      const x0 = Math.max(0, Math.floor(c.x - vw / 2 / s - 2)), y0 = Math.max(0, Math.floor(c.y - vh / 2 / s - 2));
      const x1 = Math.min(T.W, Math.ceil(c.x + vw / 2 / s + 2)), y1 = Math.min(T.H, Math.ceil(c.y + vh / 2 / s + 2));
      if (x1 > x0 && y1 > y0) ctx.drawImage(T.canvas, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
      this.drawGlows(ctx);
      // characters
      this.chars.forEach((ch) => ch.draw(ctx));
      this.drawTurnMarker(ctx);
      this.drawAimGuides(ctx);
      // egg
      if (this.trail.length > 1) {
        for (let i = 1; i < this.trail.length; i++) {
          const k = i / this.trail.length;
          ctx.beginPath();
          ctx.arc(this.trail[i][0], this.trail[i][1], 1.5 + k * 4, 0, U.TAU);
          ctx.fillStyle = `rgba(255,255,255,${k * 0.55})`;
          ctx.fill();
        }
      }
      if (this.egg) ELSTER.drawEgg(ctx, this.egg.x, this.egg.y, this.egg.rot, 0.95);
      this.particles.draw(ctx);
      this.particles.drawTexts(ctx);
      ctx.restore();
      this.particles.drawAmbient(ctx, vw, vh, this.time, this.wind, c.x * s);
      this.drawEggIndicator(ctx);
      this.particles.drawConfetti(ctx);
      // vignette
      const g = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.45, vw / 2, vh / 2, Math.max(vw, vh) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, this.level.theme.dark ? 'rgba(0,0,20,0.45)' : 'rgba(30,0,40,0.22)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, vw, vh);
    }

    drawGlows(ctx) {
      const L = this.level;
      if (L.lavaY != null) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const fl = 0.75 + 0.25 * Math.sin(this.time * 3);
        const g = ctx.createLinearGradient(0, L.lavaY - 70, 0, L.lavaY);
        g.addColorStop(0, 'rgba(255,90,20,0)');
        g.addColorStop(1, `rgba(255,120,30,${0.35 * fl})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, L.lavaY - 70, L.W, 70);
        ctx.restore();
        // bubbles
        if (Math.random() < 0.15) {
          const x = U.rand.range(this.cam.x - 600, this.cam.x + 600);
          if (this.level.terrain.isSolid(x, L.lavaY + 3) && !this.level.terrain.isSolid(x, L.lavaY - 4)) {
            this.particles.add({ kind: 'spark', x, y: L.lavaY - 2, vx: 0, vy: -120, g: 300, s: 4, life: 0.5, col: '#ffd23f' });
          }
        }
      }
      if (L.glows.length) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        L.glows.forEach((gl, i) => {
          const fl = 0.7 + 0.3 * Math.sin(this.time * 2 + i);
          const g = ctx.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gl.r);
          g.addColorStop(0, U.rgba(gl.col, 0.35 * fl));
          g.addColorStop(1, U.rgba(gl.col, 0));
          ctx.fillStyle = g;
          ctx.fillRect(gl.x - gl.r, gl.y - gl.r, gl.r * 2, gl.r * 2);
        });
        ctx.restore();
      }
    }

    drawTurnMarker(ctx) {
      if (this.mode !== 'game') return;
      if (!(this.state === 'aim' || this.state === 'aiThink')) return;
      const ch = this.shooter;
      if (!ch || (this.pointer && this.pointer.mode === 'aim')) return;
      const x = ch.pos.x, y = ch.pos.y - 150 - Math.abs(Math.sin(this.time * 4)) * 10;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - 13, y - 14);
      ctx.lineTo(x + 13, y - 14);
      ctx.lineTo(x, y + 4);
      ctx.closePath();
      ctx.fillStyle = this.turn === 'player' ? '#06d6a0' : '#ff5d8f';
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#2a1b26';
      ctx.stroke();
      ctx.restore();
      // pulsing ring around the egg to show where to grab
      if (this.state === 'aim' && this.turn === 'player') {
        const a = ch.restAnchor;
        const k = (this.time * 1.2) % 1;
        ctx.save();
        ctx.beginPath();
        ctx.arc(a.x, a.y, 16 + k * 22, 0, U.TAU);
        ctx.lineWidth = 3.5 * (1 - k);
        ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`;
        ctx.stroke();
        ctx.restore();
      }
    }

    drawAimGuides(ctx) {
      let sh = null;
      if (this.pointer && this.pointer.mode === 'aim') sh = this.player;
      else if (this.state === 'aiAim' && this.enemy) sh = this.enemy;
      else if (this.menuAim) sh = this.menuAim.shooter;
      if (!sh || !sh.aim) return;
      const { anchor, dir, power } = sh.aim;
      // max-stretch circle (player only)
      if (sh === this.player && this.pointer) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(anchor[0], anchor[1], this.maxDrag() / this.cam.scale, 0, U.TAU);
        ctx.setLineDash([6 / this.cam.scale * 2, 8 / this.cam.scale * 2]);
        ctx.lineWidth = 2 / this.cam.scale * 1.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.stroke();
        ctx.restore();
      }
      // trajectory preview (player only, by difficulty)
      if (sh === this.player && this.preview) {
        const pts = this.preview;
        const n = pts.length / 2;
        ctx.save();
        for (let i = 4; i < n; i += 5) {
          const k = 1 - i / n;
          ctx.beginPath();
          ctx.arc(pts[i * 2], pts[i * 2 + 1], 2.5 + k * 3, 0, U.TAU);
          ctx.fillStyle = `rgba(255,255,255,${0.25 + k * 0.7})`;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(42,27,38,${0.5 * k})`;
          ctx.stroke();
        }
        ctx.restore();
      }
      // direction arrow
      const L = 34 + power * 80;
      const col = power < 0.45 ? '#57cc99' : power < 0.8 ? '#ffd166' : '#ff4d6d';
      const ex = anchor[0] + dir[0] * L, ey = anchor[1] + dir[1] * L;
      const sx = anchor[0] + dir[0] * 22, sy = anchor[1] + dir[1] * 22;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.lineWidth = 11;
      ctx.strokeStyle = '#2a1b26';
      ctx.stroke();
      ctx.lineWidth = 6;
      ctx.strokeStyle = col;
      ctx.stroke();
      const a = Math.atan2(dir[1], dir[0]);
      ctx.translate(ex, ey);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-6, -11);
      ctx.lineTo(-6, 11);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2a1b26';
      ctx.stroke();
      ctx.restore();
    }

    drawEggIndicator(ctx) {
      if (!this.egg || this.mode !== 'game') return;
      const p = this.toScreen(this.egg.x, this.egg.y);
      const m = 30;
      if (p.x > m && p.x < this.vw - m && p.y > m && p.y < this.vh - m) return;
      const x = U.clamp(p.x, m, this.vw - m), y = U.clamp(p.y, m + 60, this.vh - m);
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, U.TAU);
      ctx.fillStyle = 'rgba(42,27,38,0.75)';
      ctx.fill();
      ELSTER.drawEgg(ctx, 0, 0, 0, 0.9);
      ctx.rotate(Math.atan2(p.y - y, p.x - x));
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(20, -7);
      ctx.lineTo(20, 7);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }
  }

  ELSTER.Game = Game;
  ELSTER.MAX_STAGE = MAX_STAGE;
})();
