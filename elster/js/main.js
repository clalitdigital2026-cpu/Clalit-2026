/* חביתת אלסטר – bootstrap: wires UI handlers to the game and runs the main loop */
(function () {
  'use strict';
  const A = ELSTER.Audio;
  const UI = ELSTER.UI;
  const game = (ELSTER.game = new ELSTER.Game(document.getElementById('game')));
  let pending = { diff: 'medium', stage: 1 };

  const fsEnabled = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function enterFullscreen() {
    const el = document.documentElement;
    try {
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      const r = req && req.call(el, { navigationUI: 'hide' });
      const lock = () => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {});
      if (r && r.then) r.then(lock).catch(() => {});
      else lock();
    } catch (e) { /* not available here */ }
  }
  function toggleFullscreen() {
    if (isFs()) {
      try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* ignore */ }
    } else enterFullscreen();
  }
  function syncFsButtons() {
    document.querySelectorAll('.fs-btn').forEach((b) => {
      b.classList.toggle('hidden', !fsEnabled);
      b.classList.toggle('active', isFs());
    });
  }
  document.addEventListener('fullscreenchange', syncFsButtons);
  document.addEventListener('webkitfullscreenchange', syncFsButtons);
  ['btn-fs', 'btn-fs-title'].forEach((id) => document.getElementById(id).addEventListener('click', () => {
    A.init();
    A.click();
    toggleFullscreen();
  }));
  syncFsButtons();
  // iPhone has no fullscreen API for pages: suggest "Add to Home Screen" (only on the standalone site)
  const ios = /iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.navigator.standalone || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  let topLevel = true;
  try { topLevel = window.self === window.top; } catch (e) { topLevel = false; }
  if (ios && !standalone && !fsEnabled && topLevel) document.getElementById('ios-tip').classList.remove('hidden');

  function goFullscreen() {
    const touch = matchMedia('(pointer: coarse)').matches;
    if (!touch || !fsEnabled || isFs()) return;
    enterFullscreen();
  }

  function transition(fn) {
    UI.fade(true);
    setTimeout(() => {
      fn();
      UI.fade(false);
    }, 360);
  }

  UI.init({
    play() {
      goFullscreen();
      pending.stage = 1;
      UI.askName(ELSTER.U.store.get('playerName', ''));
    },
    continueGame() {
      goFullscreen();
      pending.stage = game.progress.highest || 1;
      UI.askName(ELSTER.U.store.get('playerName', ''));
    },
    name(n) {
      game.playerName = n;
      ELSTER.U.store.set('playerName', n);
      UI.show('difficulty');
    },
    difficulty(d) {
      pending.diff = d;
      UI.show('select');
    },
    character(id) {
      transition(() => game.startCampaign(pending.diff, id, pending.stage));
    },
    pause() { game.togglePause(); },
    resume() { game.togglePause(); },
    home() {
      UI.overlay('pause', false);
      A.stretchStop();
      A.whistleStop();
      transition(() => game.startMenu());
    },
    switchCam() { game.switchCam(); },
    weapon() { game.toggleWeapon(); },
    next() {
      UI.overlay('win', false);
      A.stage();
      transition(() => game.nextFromWin());
    },
    retry() {
      UI.overlay('lose', false);
      transition(() => game.retryLast());
    },
    again() {
      UI.overlay('final', false);
      transition(() => game.startCampaign(game.difficulty, game.playerId, 1));
    },
    toggleSound() {
      A.init();
      const on = !A.soundOn;
      A.setSound(on);
      game.settings.sound = on;
      ELSTER.U.store.set('settings', game.settings);
      UI.setSoundIcon(on);
    },
    toggleMusic() {
      const on = !A.musicOn;
      A.setMusic(on);
      game.settings.music = on;
      ELSTER.U.store.set('settings', game.settings);
      UI.setMusicLabel(on);
    },
  });
  UI.setSoundIcon(A.soundOn);
  UI.setMusicLabel(A.musicOn);

  // first user gesture unlocks audio
  const unlock = () => {
    A.init();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  game.startMenu();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    try {
      const n = ELSTER.timeScale || 1; // test hook: run the simulation faster
      for (let i = 0; i < n; i++) game.update(dt);
      game.render();
    } catch (e) {
      console.error(e);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
