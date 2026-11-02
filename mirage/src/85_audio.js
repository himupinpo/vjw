// =========================================================================================
//  音：すべてその場で合成（エンジン・サイレン・銃・衝突・クラクション・足音・街の風）
//  ラジオ：ヒジャーズ旋法のつま弾きと、ダラブッカのリズムを自動で作って流す
// =========================================================================================
const AUDIO = {
  ac: null, out: null, sfx: null, amb: null, mus: null, noiseBuf: null, eng: null, sir: null, ambN: null,
  resume() {
    if (!this.ac) {
      try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      const a = this.ac; this.out = a.createGain(); this.out.connect(a.destination);
      this.sfx = a.createGain(); this.sfx.connect(this.out); this.ambG = a.createGain(); this.ambG.connect(this.out); this.mus = a.createGain(); this.mus.gain.value = 0.55; this.mus.connect(this.out);
      const len = a.sampleRate * 2, b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noiseBuf = b;
      this.setVol();
    }
    if (this.ac.state === 'suspended') this.ac.resume();
  },
  setVol() { if (this.out) this.out.gain.value = SET.vol * HUB.vol; },
  duck(on) { if (this.out) this.out.gain.setTargetAtTime(on ? SET.vol * HUB.vol * 0.25 : SET.vol * HUB.vol, this.ac.currentTime, 0.1); },
  ok() { return this.ac && this.ac.state === 'running'; },
  // 位置の音：距離で小さく、左右に振る
  at(x, z, vol) {
    const a = this.ac, g = a.createGain(), p = a.createStereoPanner ? a.createStereoPanner() : null;
    const dx = x - camera.position.x, dz = z - camera.position.z, d = Math.hypot(dx, dz), rx = Math.cos(CAM.yaw), rz = -Math.sin(CAM.yaw);
    g.gain.value = vol / (1 + d / 14);
    if (p) { p.pan.value = clamp((dx * rx + dz * rz) / (d + 2), -0.9, 0.9); g.connect(p); p.connect(this.sfx); } else g.connect(this.sfx);
    return g;
  },
  noise(dst, t0, dur, f, q, type = 'bandpass', vol = 1, a = 0.002) {
    const s = this.ac.createBufferSource(); s.buffer = this.noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const fl = this.ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = this.ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(dst); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05); return fl;
  },
  tone(dst, t0, dur, f, f2, type = 'sine', vol = 1, a = 0.004) {
    const o = this.ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = this.ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dst); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  gun(x, z, k = 1) { if (!this.ok()) return; const t = this.ac.currentTime, d = this.at(x, z, 1.1 * k); this.noise(d, t, 0.18, 2200, 0.6, 'highpass', 0.9); this.noise(d, t, 0.32, 380, 0.8, 'lowpass', 1.0); this.tone(d, t, 0.12, 160, 50, 'sine', 0.8); },
  crash(x, z, k) { if (!this.ok()) return; const t = this.ac.currentTime, d = this.at(x, z, 0.9 * (0.4 + k)); this.noise(d, t, 0.5 + k * 0.4, 700, 0.5, 'lowpass', 1); this.noise(d, t, 0.25, 3000, 1, 'bandpass', 0.4 * k); this.tone(d, t, 0.2, 90, 40, 'sine', 0.8 * k); },
  thud(x, z) { if (!this.ok()) return; const t = this.ac.currentTime, d = this.at(x, z, 0.9); this.noise(d, t, 0.18, 300, 0.7, 'lowpass', 1); this.tone(d, t, 0.15, 110, 55, 'sine', 0.7); },
  punch(x, z) { if (!this.ok()) return; const t = this.ac.currentTime, d = this.at(x, z, 0.9); this.noise(d, t, 0.1, 900, 0.7, 'lowpass', 1); this.tone(d, t, 0.08, 140, 70, 'sine', 0.6); },
  swing() { if (!this.ok()) return; const t = this.ac.currentTime; const f = this.noise(this.sfx, t, 0.16, 600, 2, 'bandpass', 0.18, 0.04); f.frequency.exponentialRampToValueAtTime(2400, t + 0.15); },
  horn(x, z, k) { if (!this.ok()) return; const t = this.ac.currentTime, d = this.at(x, z, 0.32 * k); this.tone(d, t, 0.45, 392, null, 'square', 0.5, 0.01); this.tone(d, t, 0.45, 494, null, 'square', 0.4, 0.01); },
  boom(x, z) { if (!this.ok()) return; const t = this.ac.currentTime, d = this.at(x, z, 1.6); this.noise(d, t, 1.8, 400, 0.4, 'lowpass', 1, 0.005); this.noise(d, t, 0.6, 1800, 0.5, 'bandpass', 0.5); this.tone(d, t, 1.2, 70, 25, 'sine', 1); },
  coin() { if (!this.ok()) return; const t = this.ac.currentTime; this.tone(this.sfx, t, 0.12, 988, null, 'square', 0.12); this.tone(this.sfx, t + 0.08, 0.3, 1319, null, 'square', 0.12); },
  click() { if (!this.ok()) return; this.noise(this.sfx, this.ac.currentTime, 0.04, 3000, 2, 'bandpass', 0.3); },
  reload() { if (!this.ok()) return; const t = this.ac.currentTime; this.noise(this.sfx, t, 0.05, 2500, 2, 'bandpass', 0.4); this.noise(this.sfx, t + 0.5, 0.06, 1800, 2, 'bandpass', 0.5); },
  door(x, z) { if (!this.ok()) return; const t = this.ac.currentTime, d = this.at(x, z, 0.8); this.noise(d, t, 0.15, 500, 0.8, 'lowpass', 0.8); this.tone(d, t, 0.12, 120, 70, 'sine', 0.4); },
  step(k) { if (!this.ok()) return; this.noise(this.sfx, this.ac.currentTime, 0.07, 1400, 1.2, 'bandpass', 0.12 * k); },
  shout(x, z) { if (!this.ok()) return; const t = this.ac.currentTime, d = this.at(x, z, 0.5); const f = this.noise(d, t, 0.5, 700, 6, 'bandpass', 0.6, 0.03); f.frequency.linearRampToValueAtTime(1100, t + 0.2); this.tone(d, t, 0.45, 210, 260, 'sawtooth', 0.12, 0.03); },
  fanfare() { if (!this.ok()) return; const t = this.ac.currentTime; [523, 659, 784, 1047].forEach((f, i) => { this.tone(this.sfx, t + i * 0.12, 0.5, f, null, 'triangle', 0.22); }); this.tone(this.sfx, t + 0.48, 0.9, 784, null, 'triangle', 0.18); },
  // 街の音（低いうなりと風）
  amb(on) {
    if (!this.ac) return;
    if (on && !this.ambN) {
      const a = this.ac, s = a.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; const g = a.createGain(); g.gain.value = 0.07;
      const s2 = a.createBufferSource(); s2.buffer = this.noiseBuf; s2.loop = true; s2.playbackRate.value = 0.6;
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6; const g2 = a.createGain(); g2.gain.value = 0.025;
      const lfo = a.createOscillator(); lfo.frequency.value = 0.07; const lg = a.createGain(); lg.gain.value = 0.02; lfo.connect(lg); lg.connect(g2.gain);
      s.connect(lp); lp.connect(g); g.connect(this.ambG); s2.connect(bp); bp.connect(g2); g2.connect(this.ambG); s.start(); s2.start(); lfo.start();
      this.ambN = [s, s2, lfo];
    } else if (!on && this.ambN) { this.ambN.forEach(n => n.stop()); this.ambN = null; }
  },
  // エンジン
  engineOn(c) {
    this.resume(); if (!this.ac || this.eng) return;
    const a = this.ac, o1 = a.createOscillator(), o2 = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 600; f.Q.value = 2; g.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfx); o1.start(); o2.start();
    this.eng = { o1, o2, f, g, rpm: 0.2, sports: c.type === 'sports' };
    if (RADIO.on) RADIO.start();
  },
  engineOff() { if (this.eng) { const e = this.eng; e.g.gain.setTargetAtTime(0, this.ac.currentTime, 0.1); setTimeout(() => { e.o1.stop(); e.o2.stop(); }, 400); this.eng = null; } RADIO.stop(); },
  engine(c, dt) {
    const e = this.eng; if (!e || !this.ac) return;
    const v = Math.abs(c.fwd), gear = Math.min(5, Math.floor(v / 11)), within = (v - gear * 11) / 11;
    const want = c.dead ? 0 : 0.18 + within * 0.75 + (c.input.th ? 0.08 : 0) - (gear > 0 ? 0 : 0.05);
    e.rpm = damp(e.rpm, want, 8, dt);
    const base = e.sports ? 70 : 48, f = base + e.rpm * (e.sports ? 170 : 120), t = this.ac.currentTime;
    e.o1.frequency.setTargetAtTime(f, t, 0.03); e.o2.frequency.setTargetAtTime(f * 0.5 + 1.5, t, 0.03);
    e.f.frequency.setTargetAtTime(300 + e.rpm * 1500 + (c.input.th ? 400 : 0), t, 0.05);
    e.g.gain.setTargetAtTime(c.dead ? 0 : 0.07 + c.input.th * 0.07 + e.rpm * 0.03, t, 0.05);
    // タイヤのきしみ
    if (c.drift && Math.random() < dt * 14) this.noise(this.sfx, t, 0.12, 1700, 3, 'bandpass', 0.12);
  },
  // サイレン（いちばん近いパトカーの距離で）
  sirenStart() { this.resume(); if (!this.ac || this.sir) return; const a = this.ac, o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain(), p = a.createStereoPanner ? a.createStereoPanner() : null; o.type = 'triangle'; o.frequency.value = 820; lfo.frequency.value = 0.55; lg.gain.value = 260; lfo.connect(lg); lg.connect(o.frequency); g.gain.value = 0; o.connect(g); if (p) { g.connect(p); p.connect(this.sfx); } else g.connect(this.sfx); o.start(); lfo.start(); this.sir = { o, lfo, g, p }; },
  sirenStop() { if (this.sir) { const s = this.sir; s.g.gain.setTargetAtTime(0, this.ac.currentTime, 0.2); setTimeout(() => { s.o.stop(); s.lfo.stop(); }, 800); this.sir = null; } },
  sirenTick() {
    if (!this.sir) return;
    let best = null, bd = 1e9; for (const c of WORLD.cars) if (c.police && !c.dead) { const d = Math.hypot(c.x - camera.position.x, c.z - camera.position.z); if (d < bd) { bd = d; best = c; } }
    const t = this.ac.currentTime; this.sir.g.gain.setTargetAtTime(best && WANTED.level ? 0.16 / (1 + bd / 30) : 0, t, 0.2);
    if (best && this.sir.p) { const dx = best.x - camera.position.x, dz = best.z - camera.position.z; this.sir.p.pan.setTargetAtTime(clamp((dx * Math.cos(CAM.yaw) - dz * Math.sin(CAM.yaw)) / (bd + 2), -0.8, 0.8), t, 0.1); }
  },
};
// ---------- ラジオ ----------
const RADIO = {
  on: true, playing: false, timer: null, next: 0, step: 0, bar: 0,
  // ヒジャーズ旋法（レ・ミ♭・ファ♯・ソ・ラ・シ♭・ド・レ）
  scale: [0, 1, 4, 5, 7, 8, 10, 12],
  toggle() { this.on = !this.on; if (this.on && PLAYER.car) this.start(); else this.stop(); $('radio').style.display = 'block'; $('radio').textContent = this.on ? '♪ ラジオ・サフラ 89.7' : 'ラジオ オフ'; setTimeout(() => { if (!this.playing) $('radio').style.display = 'none'; }, 2500); },
  start() {
    if (this.playing || !AUDIO.ac) return; this.playing = true; this.next = AUDIO.ac.currentTime + 0.1; this.step = 0;
    $('radio').style.display = 'block'; $('radio').textContent = '♪ ラジオ・サフラ 89.7';
    this.motif = Array.from({ length: 16 }, () => (Math.random() < 0.7 ? this.scale[(Math.random() * 6) | 0] : null));
    this.timer = setInterval(() => this.tick(), 40);
  },
  stop() { if (!this.playing) return; this.playing = false; clearInterval(this.timer); $('radio').style.display = 'none'; },
  pluck(t, semis, vol) {
    const a = AUDIO.ac, f = 146.83 * Math.pow(2, semis / 12), o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), fl = a.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.005; fl.type = 'lowpass'; fl.frequency.setValueAtTime(2600, t); fl.frequency.exponentialRampToValueAtTime(500, t + 0.3);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(AUDIO.mus); o.start(t); o2.start(t); o.stop(t + 0.6); o2.stop(t + 0.6);
  },
  tick() {
    const a = AUDIO.ac; if (!a) return;
    const spb = 60 / 104 / 2;   // 8分音符
    while (this.next < a.currentTime + 0.2) {
      const t = this.next, s = this.step % 16;
      // ダラブッカ：ドゥム（低）とテク（高）—— マクスームのリズム
      const doum = [0, 6, 10].includes(s % 16), tek = [3, 4, 8, 12, 14].includes(s % 16);
      if (doum) { AUDIO.tone(AUDIO.mus, t, 0.25, 110, 55, 'sine', 0.55); AUDIO.noise(AUDIO.mus, t, 0.06, 300, 1, 'lowpass', 0.25); }
      if (tek) AUDIO.noise(AUDIO.mus, t, 0.05, 4200, 3, 'bandpass', 0.22);
      if (s % 2 === 1 && Math.random() < 0.3) AUDIO.noise(AUDIO.mus, t, 0.03, 6000, 3, 'bandpass', 0.08);
      // 旋律
      const n = this.motif[s]; if (n != null) this.pluck(t, n + (this.bar % 4 === 3 ? 0 : 12), 0.14);
      if (s === 0) { this.pluck(t, 0, 0.1); if (this.bar % 2 === 0 && Math.random() < 0.5) this.motif[(Math.random() * 16) | 0] = this.scale[(Math.random() * 8) | 0]; }
      this.next += spb; this.step++; if (s === 15) this.bar++;
    }
  },
};
