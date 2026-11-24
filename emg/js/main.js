/* EMG – bootstrap: wires UI handlers to the game and runs the main loop */
(function () {
  'use strict';
  const A = EMG.Audio;
  const UI = EMG.UI;
  const game = (EMG.game = new EMG.Game(document.getElementById('game')));
  let pending = { diff: 'medium', stage: 1 };

  function goFullscreen() {
    const el = document.documentElement;
    const touch = matchMedia('(pointer: coarse)').matches;
    if (!touch || document.fullscreenElement) return;
    try {
      const r = el.requestFullscreen && el.requestFullscreen({ navigationUI: 'hide' });
      if (r && r.then) r.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
    } catch (e) { /* ignore */ }
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
      UI.show('difficulty');
    },
    continueGame() {
      goFullscreen();
      pending.stage = game.progress.highest || 1;
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
    next() {
      UI.overlay('win', false);
      A.stage();
      transition(() => game.startStage(game.stage + 1));
    },
    retry() {
      UI.overlay('lose', false);
      transition(() => game.startStage(game.stage));
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
      EMG.U.store.set('settings', game.settings);
      UI.setSoundIcon(on);
    },
    toggleMusic() {
      const on = !A.musicOn;
      A.setMusic(on);
      game.settings.music = on;
      EMG.U.store.set('settings', game.settings);
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
      const n = EMG.timeScale || 1; // test hook: run the simulation faster
      for (let i = 0; i < n; i++) game.update(dt);
      game.render();
    } catch (e) {
      console.error(e);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
