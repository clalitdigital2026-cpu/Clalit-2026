/* חביתת אלסטר – DOM user interface: screens, HUD, banners, character cards */
(function () {
  'use strict';
  const U = ELSTER.U;
  const $ = (id) => document.getElementById(id);

  const CARD_COLORS = {
    adi: ['#c3f584', '#3fae6a'],
    roni: ['#ff8fb1', '#c44b7a'],
    shiri: ['#ffd38a', '#e58a2f'],
    yair: ['#8fd3ff', '#3a7bd5'],
  };

  const UI = (ELSTER.UI = {
    screens: ['title', 'name', 'difficulty', 'select', 'pause', 'win', 'lose', 'final', 'leaderboard'],
    cardChars: {},
    hudChars: {},
    selected: null,

    init(handlers) {
      this.h = handlers;
      const click = (id, fn) => $(id).addEventListener('click', (e) => {
        ELSTER.Audio.init();
        ELSTER.Audio.click();
        fn(e);
      });
      click('btn-play', () => handlers.play());
      click('btn-leaderboard', () => this.openLeaderboard('title'));
      click('btn-win-lb', () => this.openLeaderboard('win'));
      click('btn-lose-lb', () => this.openLeaderboard('lose'));
      click('btn-final-lb', () => this.openLeaderboard('final'));
      click('btn-lb-back', () => this.closeLeaderboard());
      $('name-input').addEventListener('input', () => $('name-error').classList.add('hidden'));
      $('name-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('name-input').value.replace(/\s+/g, ' ').trim().slice(0, 16);
        $('name-error').classList.toggle('hidden', !!name);
        if (!name) {
          $('name-input').focus();
          return;
        }
        ELSTER.Audio.init();
        ELSTER.Audio.click();
        $('name-input').blur();
        handlers.name(name);
      });
      click('btn-continue', () => handlers.continueGame());
      document.querySelectorAll('.diff-btn').forEach((b) =>
        b.addEventListener('click', () => {
          ELSTER.Audio.init();
          ELSTER.Audio.click();
          handlers.difficulty(b.dataset.diff);
        })
      );
      document.querySelectorAll('[data-back]').forEach((b) =>
        b.addEventListener('click', () => {
          ELSTER.Audio.click();
          this.show(b.dataset.back);
        })
      );
      click('btn-pause', () => handlers.pause());
      click('btn-resume', () => handlers.resume());
      click('btn-pause-home', () => handlers.home());
      click('btn-home', () => handlers.home());
      click('btn-cam', () => handlers.switchCam());
      $('btn-weapon').addEventListener('click', () => {
        ELSTER.Audio.init();
        handlers.weapon();
      });
      click('btn-next', () => handlers.next());
      click('btn-retry', () => handlers.retry());
      click('btn-win-home', () => handlers.home());
      click('btn-lose-home', () => handlers.home());
      click('btn-final-again', () => handlers.again());
      click('btn-final-home', () => handlers.home());
      click('btn-music', () => handlers.toggleMusic());
      ['btn-sound', 'btn-sound-title'].forEach((id) => click(id, () => handlers.toggleSound()));
      document.querySelectorAll('button').forEach((b) => b.addEventListener('pointerenter', () => ELSTER.Audio.ctx && ELSTER.Audio.hover()));
      this.buildCards();
    },

    show(name) {
      this.screens.forEach((s) => $('screen-' + s).classList.toggle('hidden', s !== name));
      this.current = name;
      if (name === 'select') {
        this.selected = null;
        document.querySelectorAll('.card').forEach((c) => c.classList.remove('selected'));
        Object.values(this.cardChars).forEach((ch) => ch.setPose('idle'));
      }
    },
    hideScreens() {
      this.screens.forEach((s) => $('screen-' + s).classList.add('hidden'));
      this.current = null;
    },
    overlay(name, on) {
      $('screen-' + name).classList.toggle('hidden', !on);
    },

    buildCards() {
      const wrap = $('cards');
      ELSTER.CHAR_IDS.forEach((id) => {
        const d = ELSTER.CHAR_DEFS[id];
        const card = document.createElement('button');
        card.className = 'card';
        card.style.setProperty('--c1', CARD_COLORS[id][0]);
        card.style.setProperty('--c2', CARD_COLORS[id][1]);
        card.innerHTML = `<canvas width="300" height="324"></canvas><div class="card-name">${d.name}</div><div class="card-tag">${d.tagline}</div>`;
        const ch = new ELSTER.Character(id);
        ch.facing = 1;
        this.cardChars[id] = ch;
        card.addEventListener('pointerenter', () => {
          if (!this.selected) ch.setPose('cheer');
        });
        card.addEventListener('click', () => {
          if (this.selected) return;
          ELSTER.Audio.init();
          ELSTER.Audio.cheer();
          this.selected = id;
          card.classList.add('selected');
          ch.setPose('victory');
          setTimeout(() => this.h.character(id), 900);
        });
        card._canvas = card.querySelector('canvas');
        card._id = id;
        wrap.appendChild(card);
      });
    },

    updateCards(dt) {
      if (this.current !== 'select') return;
      document.querySelectorAll('.card').forEach((card) => {
        const ch = this.cardChars[card._id];
        ch.update(dt);
        const c = card._canvas, ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        // spotlight
        const g = ctx.createRadialGradient(150, 200, 10, 150, 200, 160);
        g.addColorStop(0, 'rgba(255,255,255,0.55)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, c.width, c.height);
        ELSTER.drawPortrait(ctx, card._id, c.width, c.height, { char: ch, scale: 2.35, bottom: 10, dx: -6 });
      });
    },

    // ---------------- HUD ----------------
    showHud(on) {
      $('hud').classList.toggle('hidden', !on);
    },
    setupHud(player, enemy, stage) {
      $('name-player').textContent = player.name;
      $('name-enemy').textContent = enemy.name;
      this.hudChars.player = new ELSTER.Character(player.id);
      this.hudChars.enemy = new ELSTER.Character(enemy.id);
      this.hudSrc = { player, enemy };
      this.setStage(stage);
      this.setHP('player', 100, true);
      this.setHP('enemy', 100, true);
    },
    setStage(n) {
      $('hud-stage').textContent = 'שלב ' + n;
    },
    setHP(side, hp, instant) {
      const f = $('hp-' + side), g = $('hpg-' + side);
      const pct = U.clamp(hp, 0, 100);
      if (instant) {
        g.style.transition = 'none';
        f.style.transition = 'none';
      }
      f.style.width = pct + '%';
      g.style.width = pct + '%';
      f.classList.toggle('mid', pct <= 60 && pct > 30);
      f.classList.toggle('low', pct <= 30);
      $('hpt-' + side).textContent = Math.round(pct);
      if (instant) {
        void f.offsetWidth;
        g.style.transition = '';
        f.style.transition = '';
      } else {
        const el = $('hud-' + side);
        el.classList.remove('hurt');
        void el.offsetWidth;
        el.classList.add('hurt');
      }
    },
    setTurn(text, side) {
      const t = $('hud-turn');
      t.textContent = text;
      t.classList.toggle('enemy-turn', side === 'enemy');
      $('hud-player').classList.toggle('active', side === 'player');
      $('hud-enemy').classList.toggle('active', side === 'enemy');
    },
    setWind(w, max) {
      const el = $('hud-wind');
      el.classList.toggle('off', !max);
      const fill = $('wind-fill');
      const pct = Math.abs(w) * 50;
      fill.style.width = pct + '%';
      fill.style.left = w >= 0 ? '50%' : 50 - pct + '%';
      $('wind-arrow').style.transform = `scaleX(${w >= 0 ? 1 : -1}) scale(${0.7 + Math.abs(w) * 0.5})`;
      $('wind-arrow').style.opacity = Math.abs(w) < 0.03 ? 0.25 : 1;
    },
    setPower(on, power, angleDeg) {
      $('power').classList.toggle('hidden', !on);
      if (!on) return;
      $('power-fill').style.width = Math.round(power * 100) + '%';
      $('power-fill').style.backgroundSize = (100 / Math.max(power, 0.05)) + '% 100%';
      $('power-val').textContent = Math.round(power * 100) + '%';
      $('angle-val').textContent = Math.round(angleDeg) + '°';
    },
    hint(on) {
      $('hint').classList.toggle('hidden', !on);
    },
    updateHudAvatars(dt) {
      if (!this.hudSrc) return;
      ['player', 'enemy'].forEach((side) => {
        const src = this.hudSrc[side], hc = this.hudChars[side];
        if (!hc) return;
        let pose = src.pose;
        if (pose === 'aim' || pose === 'shoot') pose = 'idle';
        if (pose === 'lose' || pose === 'gone') pose = 'hit';
        if (pose !== hc.pose) hc.setPose(pose);
        hc.poseT = Math.min(src.poseT, pose === 'hit' && src.pose !== 'hit' ? 0.6 : 99);
        hc.t = src.t;
        hc.blinkT = src.blinkT;
        hc.blinkIn = 99;
        hc.splats = src.splats;
        hc.loaded = false;
        const c = $('avatar-' + side), ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        ELSTER.drawPortrait(ctx, src.id, c.width, c.height, { char: hc, scale: 2.0, bottom: -58, noShadow: true, normalize: true, facing: side === 'player' ? -1 : 1 });
      });
    },

    banner(main, sub, small) {
      const b = $('banner');
      $('banner-main').textContent = main;
      $('banner-sub').textContent = sub || '';
      $('banner-sub').style.display = sub ? '' : 'none';
      b.classList.remove('hidden', 'show');
      b.classList.toggle('small', !!small);
      void b.offsetWidth;
      b.classList.add('show');
      clearTimeout(this._bt);
      this._bt = setTimeout(() => b.classList.add('hidden'), 1750);
    },

    askName(current) {
      $('name-input').value = current || '';
      $('name-error').classList.add('hidden');
      this.show('name');
      setTimeout(() => {
        try { $('name-input').focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      }, 120);
    },
    setWeaponMini(side, kind, ready) {
      const c = $('wmini-' + side);
      if (!c || !kind) return;
      ELSTER.drawWeaponIcon(c, kind, !ready);
      c.title = ELSTER.WEAPONS[kind].name + (ready ? '' : ' (נוצל)');
    },
    setWeaponButton(o) {
      const b = $('btn-weapon');
      if (!o.kind) {
        b.classList.add('hidden');
        return;
      }
      b.classList.remove('hidden');
      ELSTER.drawWeaponIcon($('weapon-icon'), o.kind, !o.ready);
      b.classList.toggle('armed', !!o.armed);
      b.classList.toggle('used', !o.ready);
      b.disabled = !o.enabled;
      $('weapon-label').textContent = !o.ready ? 'נוצל' : o.armed ? 'מוכן לירי!' : ELSTER.WEAPONS[o.kind].name;
    },
    setScore() {
      // the running score is shown only on the end-of-stage screens
    },
    setPoints(id, gained, total) {
      $(id).textContent = gained > 0 ? `+${gained} נקודות · סה״כ ${total}` : `סה״כ ${total} נקודות`;
    },

    openLeaderboard(from) {
      this.lbFrom = from;
      if (from === 'title') this.show('leaderboard');
      else {
        this.overlay(from, false);
        this.overlay('leaderboard', true);
      }
      this.renderLeaderboard();
    },
    closeLeaderboard() {
      const from = this.lbFrom || 'title';
      if (from === 'title') this.show('title');
      else {
        this.overlay('leaderboard', false);
        this.overlay(from, true);
      }
    },
    async renderLeaderboard() {
      const list = $('lb-list'), status = $('lb-status');
      list.textContent = '';
      status.textContent = 'טוען...';
      const res = await ELSTER.Leaderboard.top(20);
      const myPrefix = ELSTER.Leaderboard.myId() + '-';
      if (res.online) status.textContent = 'כל השחקנים, השיא של כל אחד';
      else if (res.error) status.textContent = 'אין חיבור כרגע – מוצגות התוצאות מהמכשיר הזה';
      else status.textContent = 'תוצאות מהמכשיר הזה';
      if (!res.list.length) {
        const li = document.createElement('li');
        li.className = 'lb-empty';
        li.textContent = 'עוד אין תוצאות. נצחו שלב כדי להופיע כאן!';
        list.appendChild(li);
        return;
      }
      const DIFF = { easy: 'קל', medium: 'בינוני', hard: 'קשה' };
      res.list.forEach((e, i) => {
        const li = document.createElement('li');
        li.className = 'lb-row' + (String(e.id).startsWith(myPrefix) ? ' me' : '');
        const rank = document.createElement('span');
        rank.className = 'lb-rank';
        rank.textContent = i + 1;
        const name = document.createElement('span');
        name.className = 'lb-name';
        name.textContent = e.name;
        const meta = document.createElement('span');
        meta.className = 'lb-meta';
        meta.textContent = `שלב ${e.stage}${DIFF[e.diff] ? ' · ' + DIFF[e.diff] : ''}`;
        const score = document.createElement('span');
        score.className = 'lb-score';
        score.textContent = e.score;
        li.append(rank, name, meta, score);
        list.appendChild(li);
      });
    },

    setTitleInfo(progress) {
      const nm = ELSTER.U.store.get('playerName', '');
      $('hello').classList.toggle('hidden', !nm);
      $('hello-name').textContent = nm;
      const hi = progress.highest || 1;
      $('btn-continue').classList.toggle('hidden', !(hi > 1 && progress.lastChar));
      $('continue-stage').textContent = hi;
      $('record').classList.toggle('hidden', !(progress.best > 0));
      $('record-stage').textContent = progress.best || 1;
    },

    setSoundIcon(on) {
      document.querySelectorAll('.sound-btn').forEach((b) => b.classList.toggle('muted', !on));
    },
    setMusicLabel(on) {
      $('music-state').textContent = on ? 'פועלת' : 'כבויה';
    },

    showWin(stage, hpLeft) {
      $('win-sub').textContent = `עברת את שלב ${stage}!`;
      const stars = hpLeft >= 80 ? 3 : hpLeft >= 40 ? 2 : 1;
      document.querySelectorAll('#win-stars i').forEach((s, i) => s.classList.toggle('off', i >= stars));
      this.overlay('win', true);
    },
    showLose(stage, who) {
      $('lose-sub').textContent = `${who} אותך בשלב ${stage}`;
      this.overlay('lose', true);
    },

    fade(on) {
      $('fade').classList.toggle('on', on);
    },
  });
})();
