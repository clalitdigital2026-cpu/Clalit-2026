/* חביתת אלסטר – synthesized retro audio: original chiptune music + sound effects (Web Audio API) */
(function () {
  'use strict';
  const U = ELSTER.U;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---- Original music: "Egg Shell Shuffle" (A minor, 8 bars A + 8 bars B) ----
  // Each bar = 8 eighth notes. null = rest, negative = tie (hold previous)
  const MELODY_A = [
    69, 72, 76, 72, 69, 76, 74, 72,
    65, 69, 72, 69, 77, 76, 74, 72,
    76, 79, 76, 72, 74, 76, 79, 76,
    74, 71, 67, 71, 74, null, 79, null,
    69, 72, 76, 81, 79, 76, 74, 76,
    65, 69, 72, 77, 76, 72, 69, 72,
    72, 76, 79, 84, 83, 79, 76, 79,
    74, 79, 83, 79, 74, 71, 67, null,
  ];
  const MELODY_B = [
    76, 76, null, 81, 79, 76, null, 74,
    72, 72, null, 77, 76, 72, null, 69,
    67, 72, 76, 79, 76, 72, 67, 72,
    71, 74, 79, 77, 74, 71, 67, 71,
    76, 76, null, 81, 79, 76, null, 79,
    77, 77, null, 81, 79, 77, 76, 74,
    72, 76, 79, 84, 79, 76, 72, 76,
    71, 74, 77, 79, 83, null, 81, null,
  ];
  const BASS_ROOTS = [45, 41, 48, 43, 45, 41, 48, 43]; // Am F C G
  const BASS_ROOTS_B = [41, 41, 48, 43, 45, 45, 41, 43];

  const A = (ELSTER.Audio = {
    ctx: null,
    soundOn: true,
    musicOn: true,
    _musicTimer: null,
    _step: 0,
    _nextTime: 0,
    _tempo: 138,
    _stretch: null,
    _whistle: null,

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = (this.ctx = new AC());
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      comp.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(comp);
      this.sfx = ctx.createGain();
      this.sfx.connect(this.master);
      this.music = ctx.createGain();
      this.music.connect(this.master);
      // noise buffer
      const len = ctx.sampleRate * 1.5;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this._noise = buf;
      this.apply();
      if (this._wantMusic) this.startMusic();
    },

    apply() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.sfx.gain.setTargetAtTime(this.soundOn ? 0.9 : 0, t, 0.02);
      this.music.gain.setTargetAtTime(this.soundOn && this.musicOn ? 0.28 : 0, t, 0.05);
    },
    setSound(on) { this.soundOn = on; this.apply(); },
    setMusic(on) { this.musicOn = on; this.apply(); },

    // ---------- primitives ----------
    tone(o) {
      const ctx = this.ctx;
      if (!ctx) return;
      const t = (o.at || ctx.currentTime) + (o.delay || 0);
      const osc = ctx.createOscillator();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(o.f0, t);
      if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + (o.slide || o.dur));
      if (o.vib) {
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = o.vib;
        lg.gain.value = o.vibDepth || 6;
        lfo.connect(lg).connect(osc.frequency);
        lfo.start(t);
        lfo.stop(t + o.dur + 0.1);
      }
      const g = ctx.createGain();
      const peak = o.gain == null ? 0.2 : o.gain;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + (o.attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      let node = osc;
      if (o.filter) {
        const f = ctx.createBiquadFilter();
        f.type = o.filter;
        f.frequency.value = o.ff || 1200;
        f.Q.value = o.q || 1;
        node.connect(f);
        node = f;
      }
      node.connect(g).connect(o.dest || this.sfx);
      osc.start(t);
      osc.stop(t + o.dur + 0.05);
    },
    noise(o) {
      const ctx = this.ctx;
      if (!ctx) return;
      const t = (o.at || ctx.currentTime) + (o.delay || 0);
      const src = ctx.createBufferSource();
      src.buffer = this._noise;
      const f = ctx.createBiquadFilter();
      f.type = o.filter || 'lowpass';
      f.frequency.setValueAtTime(o.f0 || 1000, t);
      if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
      f.Q.value = o.q || 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.gain || 0.3, t + (o.attack || 0.004));
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      src.connect(f).connect(g).connect(o.dest || this.sfx);
      src.start(t, Math.random() * 0.5);
      src.stop(t + o.dur + 0.05);
    },

    // ---------- sound effects ----------
    click() {
      this.tone({ type: 'square', f0: 880, f1: 1320, dur: 0.07, gain: 0.12, slide: 0.04 });
      this.tone({ type: 'triangle', f0: 1760, dur: 0.05, gain: 0.06, delay: 0.03 });
    },
    hover() { this.tone({ type: 'triangle', f0: 1200, dur: 0.04, gain: 0.04 }); },
    pop() { this.tone({ type: 'sine', f0: 300, f1: 900, dur: 0.12, gain: 0.18, slide: 0.08 }); },

    stretchStart() {
      if (!this.ctx || this._stretch) return;
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 90;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 500;
      f.Q.value = 6;
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.05, ctx.currentTime, 0.03);
      osc.connect(f).connect(g).connect(this.sfx);
      osc.start();
      this._stretch = { osc, f, g, last: 0 };
    },
    stretchUpdate(p) {
      const s = this._stretch;
      if (!s) return;
      const t = this.ctx.currentTime;
      s.osc.frequency.setTargetAtTime(70 + p * 120, t, 0.03);
      s.f.frequency.setTargetAtTime(350 + p * 1400, t, 0.03);
      const step = Math.floor(p * 12);
      if (step !== s.last) {
        this.tone({ type: 'square', f0: 300 + step * 70, dur: 0.035, gain: 0.05 });
        s.last = step;
      }
    },
    stretchStop() {
      const s = this._stretch;
      if (!s) return;
      const t = this.ctx.currentTime;
      s.g.gain.setTargetAtTime(0.0001, t, 0.02);
      s.osc.stop(t + 0.15);
      this._stretch = null;
    },
    release(p) {
      p = p == null ? 0.7 : p;
      this.tone({ type: 'triangle', f0: 180 + p * 260, f1: 60, dur: 0.25, gain: 0.3, slide: 0.2 });
      this.noise({ f0: 3000, f1: 400, dur: 0.12, gain: 0.18, filter: 'bandpass', q: 1.5 });
      this.tone({ type: 'square', f0: 900, f1: 1800, dur: 0.08, gain: 0.05, delay: 0.02 });
    },
    whistleStart() {
      if (!this.ctx || this._whistle) return;
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.045, ctx.currentTime, 0.08);
      osc.connect(g).connect(this.sfx);
      osc.start();
      this._whistle = { osc, g };
    },
    whistleUpdate(vy, speed) {
      const w = this._whistle;
      if (!w) return;
      const t = this.ctx.currentTime;
      const f = U.clamp(1100 - vy * 0.45, 380, 1800);
      w.osc.frequency.setTargetAtTime(f, t, 0.05);
      w.g.gain.setTargetAtTime(U.clamp(speed / 1600, 0.2, 1) * 0.05, t, 0.05);
    },
    whistleStop() {
      const w = this._whistle;
      if (!w) return;
      const t = this.ctx.currentTime;
      w.g.gain.setTargetAtTime(0.0001, t, 0.02);
      w.osc.stop(t + 0.2);
      this._whistle = null;
    },
    splat() {
      this.noise({ f0: 2200, f1: 200, dur: 0.35, gain: 0.45, filter: 'lowpass', q: 2 });
      this.tone({ type: 'sine', f0: 160, f1: 45, dur: 0.22, gain: 0.4 });
      this.noise({ f0: 5000, f1: 1500, dur: 0.08, gain: 0.15, filter: 'highpass', delay: 0.01 });
      // squishy wobble
      this.tone({ type: 'triangle', f0: 420, f1: 180, dur: 0.18, gain: 0.08, delay: 0.05, vib: 30, vibDepth: 40 });
    },
    sizzle() { this.noise({ f0: 6000, f1: 2500, dur: 0.6, gain: 0.12, filter: 'highpass' }); },
    hit(head) {
      this.splat();
      this.tone({ type: 'square', f0: head ? 700 : 500, f1: head ? 1400 : 250, dur: 0.25, gain: 0.12, delay: 0.04, vib: 18, vibDepth: 50 });
      if (head) {
        // "boing"
        this.tone({ type: 'sine', f0: 220, f1: 660, dur: 0.35, gain: 0.25, delay: 0.08, vib: 14, vibDepth: 60 });
        [1047, 1319, 1568].forEach((f, i) => this.tone({ type: 'square', f0: f, dur: 0.08, gain: 0.06, delay: 0.25 + i * 0.06 }));
      }
    },
    ouch() { this.tone({ type: 'square', f0: 620, f1: 260, dur: 0.3, gain: 0.08, vib: 20, vibDepth: 30, filter: 'lowpass', ff: 1800 }); },
    grumble() {
      for (let i = 0; i < 4; i++) this.tone({ type: 'sawtooth', f0: 140 + Math.random() * 60, f1: 100, dur: 0.09, gain: 0.06, delay: i * 0.08, filter: 'lowpass', ff: 900 });
    },
    cheer() { [784, 988, 1175].forEach((f, i) => this.tone({ type: 'square', f0: f, dur: 0.1, gain: 0.07, delay: i * 0.07 })); },
    think() { [0, 1, 2].forEach((i) => this.tone({ type: 'triangle', f0: 1400 + i * 120, dur: 0.05, gain: 0.04, delay: i * 0.18 })); },
    turn() {
      this.tone({ type: 'square', f0: 660, dur: 0.08, gain: 0.08 });
      this.tone({ type: 'square', f0: 990, dur: 0.12, gain: 0.08, delay: 0.09 });
    },
    poof() {
      this.noise({ f0: 900, f1: 200, dur: 0.5, gain: 0.3, filter: 'lowpass' });
      this.tone({ type: 'sine', f0: 600, f1: 120, dur: 0.4, gain: 0.15 });
    },
    fall() { this.tone({ type: 'square', f0: 900, f1: 120, dur: 0.7, gain: 0.08, slide: 0.65, vib: 10, vibDepth: 20 }); },
    win() {
      const seq = [72, 76, 79, 84, 79, 84, 88];
      const durs = [0.12, 0.12, 0.12, 0.25, 0.12, 0.12, 0.6];
      let d = 0;
      seq.forEach((m, i) => {
        this.tone({ type: 'square', f0: mtof(m), dur: durs[i] + 0.05, gain: 0.12, delay: d, vib: i === 6 ? 6 : 0 });
        this.tone({ type: 'triangle', f0: mtof(m - 12), dur: durs[i] + 0.05, gain: 0.12, delay: d });
        d += durs[i];
      });
    },
    lose() {
      // sad trombone "wah wah wah waaah"
      const seq = [[67, 0.35], [66, 0.35], [65, 0.35], [64, 1.1]];
      let d = 0;
      seq.forEach(([m, du], i) => {
        this.tone({ type: 'sawtooth', f0: mtof(m - 12), f1: i === 3 ? mtof(m - 13) : null, dur: du, gain: 0.14, delay: d, filter: 'lowpass', ff: 900, vib: i === 3 ? 5 : 0, vibDepth: 8 });
        d += du;
      });
    },
    stage() {
      [60, 64, 67, 72, 76].forEach((m, i) => this.tone({ type: 'square', f0: mtof(m), dur: 0.1, gain: 0.08, delay: i * 0.07 }));
      this.tone({ type: 'triangle', f0: mtof(84), dur: 0.4, gain: 0.1, delay: 0.38, vib: 7, vibDepth: 12 });
    },

    // ---------- secret weapons ----------
    weaponArm() {
      [72, 76, 79, 84, 88].forEach((m, i) => this.tone({ type: 'triangle', f0: mtof(m), dur: 0.18, gain: 0.09, delay: i * 0.05, vib: 8, vibDepth: 10 }));
      this.noise({ f0: 9000, f1: 4000, dur: 0.4, gain: 0.05, filter: 'highpass' });
    },
    weaponFire(kind) {
      if (kind === 'guitar') {
        [52, 56, 59, 64, 68, 71].forEach((m, i) => this.tone({ type: 'sawtooth', f0: mtof(m), dur: 0.9, gain: 0.05, delay: i * 0.025, filter: 'lowpass', ff: 2200 }));
      } else if (kind === 'globe') {
        this.noise({ f0: 400, f1: 3000, dur: 0.5, gain: 0.25, filter: 'bandpass', q: 2 });
        this.tone({ type: 'sine', f0: 300, f1: 1200, dur: 0.5, gain: 0.12 });
      } else if (kind === 'choco') {
        this.noise({ f0: 3000, f1: 800, dur: 0.15, gain: 0.25, filter: 'bandpass', q: 3 });
        [0, 1, 2, 3].forEach((i) => this.tone({ type: 'sine', f0: 900 + i * 220, f1: 1600 + i * 220, dur: 0.06, gain: 0.08, delay: 0.1 + i * 0.07 }));
      } else {
        this.noise({ f0: 2000, f1: 6000, dur: 0.3, gain: 0.2, filter: 'bandpass', q: 1.5 });
        this.tone({ type: 'sine', f0: 400, f1: 900, dur: 0.2, gain: 0.12, delay: 0.05 });
      }
      this.release(0.8);
    },
    weaponHit(kind) {
      this.tone({ type: 'sine', f0: 140, f1: 40, dur: 0.4, gain: 0.45 });
      this.noise({ f0: 2500, f1: 200, dur: 0.45, gain: 0.35, filter: 'lowpass' });
      if (kind === 'guitar') {
        [64, 68, 71, 76].forEach((m, i) => this.tone({ type: 'square', f0: mtof(m), dur: 0.5, gain: 0.06, delay: 0.05 + i * 0.04, vib: 7, vibDepth: 14, filter: 'lowpass', ff: 3000 }));
        this.tone({ type: 'sawtooth', f0: mtof(40), f1: mtof(38), dur: 0.8, gain: 0.08, delay: 0.05, filter: 'lowpass', ff: 900 });
      } else if (kind === 'globe') {
        this.tone({ type: 'sine', f0: 220, dur: 1.0, gain: 0.2, vib: 4, vibDepth: 6 });
        [84, 88, 91, 96].forEach((m, i) => this.tone({ type: 'triangle', f0: mtof(m), dur: 0.2, gain: 0.06, delay: 0.15 + i * 0.08 }));
      } else if (kind === 'choco') {
        this.tone({ type: 'triangle', f0: 500, f1: 150, dur: 0.3, gain: 0.12, vib: 25, vibDepth: 60 });
        for (let i = 0; i < 6; i++) this.tone({ type: 'sine', f0: 1200 + Math.random() * 1200, dur: 0.05, gain: 0.07, delay: 0.1 + i * 0.06 });
      } else {
        [60, 64, 67, 72, 76, 79].forEach((m, i) => this.tone({ type: 'sine', f0: mtof(m), f1: mtof(m + 5), dur: 0.12, gain: 0.08, delay: 0.05 + i * 0.05 }));
      }
    },

    // ---------- music sequencer ----------
    startMusic() {
      this._wantMusic = true;
      if (!this.ctx || this._musicTimer) return;
      this._step = 0;
      this._nextTime = this.ctx.currentTime + 0.1;
      this._musicTimer = setInterval(() => this._schedule(), 40);
    },
    stopMusic() {
      this._wantMusic = false;
      if (this._musicTimer) clearInterval(this._musicTimer);
      this._musicTimer = null;
    },
    _schedule() {
      const ctx = this.ctx;
      const eighth = 60 / this._tempo / 2;
      while (this._nextTime < ctx.currentTime + 0.25) {
        this._playStep(this._step, this._nextTime, eighth);
        this._nextTime += eighth;
        this._step = (this._step + 1) % 128;
      }
    },
    _playStep(step, t, e) {
      const dest = this.music;
      const section = step < 64 ? 'A' : 'B';
      const i = step % 64;
      const bar = Math.floor(i / 8);
      const beat = i % 8;
      const mel = section === 'A' ? MELODY_A : MELODY_B;
      const m = mel[i];
      if (m != null) {
        this.tone({ at: t, type: 'square', f0: mtof(m), dur: e * 0.9, gain: 0.09, attack: 0.004, dest, vib: 5.5, vibDepth: 3, filter: 'lowpass', ff: 3200 });
        // echo
        this.tone({ at: t + e * 1.5, type: 'square', f0: mtof(m), dur: e * 0.6, gain: 0.025, dest, filter: 'lowpass', ff: 1800 });
      }
      const root = (section === 'A' ? BASS_ROOTS : BASS_ROOTS_B)[bar];
      const bassNote = beat % 2 === 0 ? root : root + 12;
      this.tone({ at: t, type: 'triangle', f0: mtof(bassNote), dur: e * 0.85, gain: 0.22, dest });
      // arpeggio sparkle on off-beats in B section
      if (section === 'B' && beat % 2 === 1) {
        this.tone({ at: t, type: 'square', f0: mtof(root + 24 + [0, 3, 7, 12][beat % 4]), dur: e * 0.3, gain: 0.025, dest });
      }
      // drums
      if (beat === 0 || beat === 4 || (beat === 7 && bar % 2 === 1)) {
        this.tone({ at: t, type: 'sine', f0: 160, f1: 40, dur: 0.16, gain: 0.5, dest, slide: 0.12 });
      }
      if (beat === 2 || beat === 6) {
        this.noise({ at: t, f0: 1800, dur: 0.12, gain: 0.18, filter: 'bandpass', q: 0.7, dest });
        this.tone({ at: t, type: 'triangle', f0: 220, f1: 120, dur: 0.08, gain: 0.12, dest });
      }
      this.noise({ at: t, f0: 8000, dur: 0.035, gain: beat % 2 ? 0.05 : 0.08, filter: 'highpass', dest });
    },
  });
})();
