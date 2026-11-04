// =========================================================================================
//  文房具カンパニー — 文房具メーカーを育てる経営シミュレーション（オリジナル作品）
//  製品をデザインして（3Dで見ながら色・模様・ロゴを変えられる）、開発して、発売して、研究して、会社を大きくする
//  three.js r170。事務所も3Dで、雇った人が働き、作った製品が生産ラインを流れ、棚に並ぶ
// =========================================================================================
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const TAU = Math.PI * 2;
const rr = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = (arr, r = Math.random) => arr[(r() * arr.length) | 0];
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (IS_TOUCH) document.body.classList.add('touch');

// お金の表示：1万円より大きいと「万円」「億円」「兆円」
function yen(n, plus) {
  const s = n < 0 ? '−' : plus && n > 0 ? '+' : '', a = Math.abs(n);
  if (a >= 1e12) return s + (a / 1e12).toFixed(a < 1e13 ? 2 : 1) + '兆円';
  if (a >= 1e8) return s + (a / 1e8).toFixed(a < 1e9 ? 2 : a < 1e10 ? 1 : 0) + '億円';
  if (a >= 1e4) return s + Math.round(a / 1e4).toLocaleString() + '万円';
  return s + Math.round(a).toLocaleString() + '円';
}
const num = n => Math.round(n).toLocaleString();
// ゲームの日付：0日目＝2000年4月1日（新学期から）
const DAY0 = new Date(2000, 3, 1);
const dateOf = day => new Date(DAY0.getFullYear(), DAY0.getMonth(), DAY0.getDate() + Math.floor(day));
const yearOf = day => { const d = dateOf(day); return d.getFullYear() + d.getMonth() / 12; };
const dateStr = day => { const d = dateOf(day); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`; };

// ---------- 3dgame のホームの中で動くとき（⚙ の横画面・音） ----------
const HUB = { embedded: window.parent !== window, vol: 1, sound: true };
if (HUB.embedded) document.body.classList.add('hub');
const ROT = { on: false };
const VW = () => (ROT.on ? innerHeight : innerWidth), VH = () => (ROT.on ? innerWidth : innerHeight);
const toStage = (cx, cy) => (ROT.on ? { x: cy, y: innerWidth - cx } : { x: cx, y: cy });
function applyHome(S) {
  if (!S || typeof S !== 'object') return;
  if (typeof S.land === 'boolean' && S.land !== ROT.on) { ROT.on = S.land; onResize(); }
  if (typeof S.sound === 'boolean') HUB.sound = S.sound;
  if (typeof S.vol === 'number') HUB.vol = clamp(S.vol, 0, 1);
  AU.setVol();
}

// ---------- 設定（このゲームだけのもの） ----------
const SET = Object.assign({ music: true, quality: IS_TOUCH ? 'std' : 'high' }, (() => { try { return JSON.parse(localStorage.getItem('bstudy-settings')) || {}; } catch (e) { return {}; } })());
const saveSet = () => { try { localStorage.setItem('bstudy-settings', JSON.stringify(SET)); } catch (e) { /* 保存できない */ } };

// ---------- 音（Web Audio で作る。効果音と、やさしいBGM） ----------
const AU = {
  ac: null, out: null, bgm: null, t: 0, step: 0,
  resume() {
    if (!this.ac) {
      try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      this.out = this.ac.createGain(); this.out.connect(this.ac.destination);
      this.bgm = this.ac.createGain(); this.bgm.gain.value = 0.22; this.bgm.connect(this.out);
      this.setVol();
    }
    if (this.ac.state === 'suspended') this.ac.resume();
  },
  setVol() { if (this.out) this.out.gain.value = HUB.sound ? 0.8 * HUB.vol : 0; if (this.bgm) this.bgm.gain.value = SET.music ? 0.22 : 0; },
  ok() { return this.ac && this.ac.state === 'running' && HUB.sound && HUB.vol > 0; },
  tone(f, t0, dur, type = 'sine', vol = 0.2, dst) {
    const a = this.ac, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    o.connect(g); g.connect(dst || this.out); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  click() { if (!this.ok()) return; this.tone(880, this.ac.currentTime, 0.06, 'triangle', 0.08); },
  coin() { if (!this.ok()) return; const t = this.ac.currentTime; this.tone(1320, t, 0.12, 'square', 0.05); this.tone(1760, t + 0.07, 0.25, 'square', 0.05); },
  chime() { if (!this.ok()) return; const t = this.ac.currentTime; [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, t + i * 0.09, 0.5, 'sine', 0.12)); },
  fanfare() { if (!this.ok()) return; const t = this.ac.currentTime; [[523, 0], [659, .12], [784, .24], [1047, .36], [784, .52], [1047, .64]].forEach(([f, d]) => { this.tone(f, t + d, 0.4, 'triangle', 0.14); this.tone(f / 2, t + d, 0.4, 'sine', 0.08); }); },
  bad() { if (!this.ok()) return; const t = this.ac.currentTime; this.tone(330, t, 0.25, 'sawtooth', 0.05); this.tone(247, t + 0.18, 0.35, 'sawtooth', 0.05); },
  // BGM：木琴のような音で、ゆっくりした4つの和音のくり返し
  music(dt) {
    if (!this.ac || !SET.music || !this.ok()) return;
    this.t -= dt; if (this.t > 0) return;
    const CH = [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]], beat = 0.42, now = this.ac.currentTime;
    const ch = CH[(this.step >> 3) % 4], i = this.step % 8, mf = m => 440 * Math.pow(2, (m - 69) / 12);
    const mel = [ch[0] + 12, ch[2], ch[1] + 12, ch[3], ch[2] + 12, ch[1], ch[3] + 12, ch[2]][i];
    this.tone(mf(mel), now + 0.02, 0.9, 'sine', 0.11, this.bgm); this.tone(mf(mel) * 2, now + 0.02, 0.25, 'triangle', 0.025, this.bgm);
    if (i % 4 === 0) this.tone(mf(ch[0] - 12), now + 0.02, 1.6, 'triangle', 0.09, this.bgm);
    this.step++; this.t = beat;
  },
};
