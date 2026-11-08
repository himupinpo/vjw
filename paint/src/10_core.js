import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const T = THREE;
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const angD = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));

// ---------- セーブ ----------
const SK = 'paint.';
const store = {
  get(k, d) { try { const v = localStorage.getItem(SK + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(SK + k, JSON.stringify(v)); } catch (e) { /* 保存できない環境 */ } }
};
const SET = Object.assign({ weapon: 'basic', diff: 1, sens: 1, invY: false, music: true, quality: 'mid' }, store.get('set', {}));
const saveSet = () => store.set('set', SET);
const REC = Object.assign({ games: 0, wins: 0, kills: 0, paint: 0, best: 0 }, store.get('rec', {}));
const saveRec = () => store.set('rec', REC);

// ---------- 3dgame のホームの中で動くとき（⚙ の横画面・音） ----------
const HUB = { embedded: window.parent !== window, vol: 1, sound: true };
if (HUB.embedded) document.body.classList.add('hub');
const ROT = { on: false };
const VW = () => (ROT.on ? innerHeight : innerWidth), VH = () => (ROT.on ? innerWidth : innerHeight);
const toStage = (cx, cy) => (ROT.on ? { x: cy, y: innerWidth - cx } : { x: cx, y: cy });

// ================= 入力（キーボード・マウス・タッチ） =================
const IN = {
  keys: new Set(), lookX: 0, lookY: 0, mouseFire: false, mouseDive: false,
  jumpE: false, subE: false, spE: false, touchOn: matchMedia('(pointer: coarse)').matches,
  stick: null, stickX: 0, stickY: 0, tFire: false, tDive: false, looks: new Map()
};
const GAME_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyQ'];
addEventListener('keydown', e => {
  if (GAME_KEYS.includes(e.code) && G.state === 'play') e.preventDefault();
  if (e.repeat) return;
  IN.keys.add(e.code);
  if (e.code === 'Space') IN.jumpE = true;
  if (e.code === 'KeyE') IN.subE = true;
  if (e.code === 'KeyQ') IN.spE = true;
  if (e.code === 'Escape' && G.state === 'play') togglePause(true);
});
addEventListener('keyup', e => IN.keys.delete(e.code));
addEventListener('blur', () => { IN.keys.clear(); IN.mouseFire = IN.mouseDive = false; });
function moveAxes() {
  const k = IN.keys;
  let x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
  let y = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
  if (IN.stick) { x += IN.stickX; y += IN.stickY; }
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  return [x, y];
}
const firing = () => IN.mouseFire || IN.tFire;
const diving = () => IN.mouseDive || IN.tDive || IN.keys.has('ShiftLeft') || IN.keys.has('ShiftRight');
function takeEdge(k) { const v = IN[k]; IN[k] = false; return v; }

const canvas = $('c');
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', e => {
  if (G.state !== 'play' || G.paused) return;
  if (document.pointerLockElement !== canvas && !IN.touchOn) { try { canvas.requestPointerLock(); } catch (er) { /* 固定できない */ } }
  if (e.button === 0) IN.mouseFire = true;
  if (e.button === 2) IN.mouseDive = true;
  AU.init();
});
addEventListener('mouseup', e => { if (e.button === 0) IN.mouseFire = false; if (e.button === 2) IN.mouseDive = false; });
addEventListener('mousemove', e => {
  if (document.pointerLockElement === canvas) { IN.lookX += e.movementX; IN.lookY += e.movementY; }
});
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && G.state === 'play' && !G.paused && !IN.touchOn && G.mode !== 'end') IN.mouseFire = false; });

// タッチ：左側＝移動の棒、右側＝視点。「うつ」は押したまま動かすと視点も動く
(function touchSetup() {
  const layer = $('touch'), stickEl = $('stick'), knob = stickEl.querySelector('i');
  const btn = (id, down, up) => {
    const el = $(id);
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (er) { /* */ } down(e); AU.init(); });
    const end = e => { el.classList.remove('on'); if (up) up(e); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    return el;
  };
  const fireEl = btn('bFire', e => { IN.tFire = true; const p = toStage(e.clientX, e.clientY); IN.looks.set(e.pointerId, p); }, e => { IN.tFire = false; IN.looks.delete(e.pointerId); });
  fireEl.addEventListener('pointermove', e => lookMove(e));
  btn('bDive', () => { IN.tDive = true; }, () => { IN.tDive = false; });
  btn('bJump', () => { IN.jumpE = true; });
  btn('bSub', () => { IN.subE = true; });
  btn('bSp', () => { IN.spE = true; });
  function lookMove(e) {
    const prev = IN.looks.get(e.pointerId); if (!prev) return;
    const p = toStage(e.clientX, e.clientY);
    IN.lookX += (p.x - prev.x) * 2.2; IN.lookY += (p.y - prev.y) * 2.2;
    IN.looks.set(e.pointerId, p);
  }
  layer.addEventListener('pointerdown', e => {
    IN.touchOn = true; AU.init();
    const p = toStage(e.clientX, e.clientY);
    if (p.x < VW() * 0.42 && !IN.stick) {
      IN.stick = { id: e.pointerId, x: p.x, y: p.y }; IN.stickX = IN.stickY = 0;
      stickEl.style.display = 'block'; stickEl.style.left = p.x + 'px'; stickEl.style.top = p.y + 'px'; knob.style.transform = '';
    } else IN.looks.set(e.pointerId, p);
    try { layer.setPointerCapture(e.pointerId); } catch (er) { /* */ }
  });
  layer.addEventListener('pointermove', e => {
    if (IN.stick && IN.stick.id === e.pointerId) {
      const p = toStage(e.clientX, e.clientY), R = 52;
      let dx = p.x - IN.stick.x, dy = p.y - IN.stick.y; const l = Math.hypot(dx, dy);
      if (l > R) { dx *= R / l; dy *= R / l; }
      IN.stickX = dx / R; IN.stickY = -dy / R;
      knob.style.transform = `translate(${dx}px,${dy}px)`;
    } else lookMove(e);
  });
  const end = e => {
    if (IN.stick && IN.stick.id === e.pointerId) { IN.stick = null; IN.stickX = IN.stickY = 0; stickEl.style.display = 'none'; }
    IN.looks.delete(e.pointerId);
  };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
})();

// ================= 音（ぜんぶ合成。音楽も） =================
const AU = (() => {
  let ac = null, master = null, sfx = null, mus = null, nb = null, nextT = 0, step = 0, musOn = false;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.connect(ac.destination);
    sfx = ac.createGain(); sfx.connect(master); mus = ac.createGain(); mus.gain.value = .32; mus.connect(master);
    const len = ac.sampleRate; nb = ac.createBuffer(1, len, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    applyVol();
  }
  function applyVol() { if (master) master.gain.value = HUB.sound ? HUB.vol : 0; if (mus) mus.gain.value = SET.music ? .3 : 0; }
  function tone(f, dur, g, type = 'sine', at = 0, f1 = 0, dest) {
    if (!ac || g <= 0.001) return; const t = ac.currentTime + at, o = ac.createOscillator(), ga = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    ga.gain.setValueAtTime(0, t); ga.gain.linearRampToValueAtTime(g, t + .008); ga.gain.exponentialRampToValueAtTime(.0004, t + dur);
    o.connect(ga); ga.connect(dest || sfx); o.start(t); o.stop(t + dur + .03);
  }
  function noise(dur, type, f0, f1, q, g, at = 0, dest) {
    if (!ac || g <= 0.001) return; const t = ac.currentTime + at, s = ac.createBufferSource(), f = ac.createBiquadFilter(), ga = ac.createGain();
    s.buffer = nb; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    ga.gain.setValueAtTime(0, t); ga.gain.linearRampToValueAtTime(g, t + .006); ga.gain.exponentialRampToValueAtTime(.0004, t + dur);
    s.connect(f); f.connect(ga); ga.connect(dest || sfx); s.start(t, Math.random() * .5); s.stop(t + dur + .03);
  }
  // 音楽：132BPM の16ステップ。ベース・ドラム・和音（オリジナルの進行）
  const BASS = [41, 41, 53, 41, 44, 44, 56, 44, 39, 39, 51, 39, 46, 46, 48, 46];
  const CH = [[65, 69, 72], [68, 72, 75], [63, 67, 70], [70, 74, 77]];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function music() {
    if (!ac || !musOn) return;
    const spb = 60 / 132 / 4;
    while (nextT < ac.currentTime + .25) {
      const s = step % 16, bar = Math.floor(step / 16) % 4, at = nextT - ac.currentTime;
      if (s % 4 === 0) { tone(110, .18, .5, 'sine', at, 40, mus); }
      if (s === 4 || s === 12) noise(.16, 'bandpass', 1800, 900, .8, .35, at, mus);
      if (s % 2 === 1) noise(.05, 'highpass', 7000, 6000, 1, .12, at, mus);
      const bn = BASS[(s + bar * 4) % 16] - (bar === 2 ? 2 : 0);
      if (s % 2 === 0) tone(mtof(bn), spb * 1.6, .2, 'square', at, 0, mus);
      if (s === 0 || s === 6 || s === 10) for (const n of CH[bar]) tone(mtof(n), spb * 2.5, .045, 'sawtooth', at, 0, mus);
      if (s % 4 === 2) tone(mtof(CH[bar][(step >> 2) % 3] + 12), spb * .9, .05, 'triangle', at, 0, mus);
      nextT += spb; step++;
    }
  }
  return {
    init, applyVol, music,
    musicOn(on) { musOn = on && !!ac; if (ac) { nextT = ac.currentTime + .05; step = 0; } },
    shot(cls, g = 1) {
      g *= .55;
      if (cls === 'charger') { noise(.25, 'bandpass', 2400, 600, 2, .5 * g); tone(900, .2, .15 * g, 'square', 0, 200); return; }
      if (cls === 'blaster') { noise(.3, 'lowpass', 1500, 200, 1, .55 * g); tone(160, .25, .3 * g, 'sine', 0, 60); return; }
      if (cls === 'roller' || cls === 'brush') { noise(.3, 'lowpass', 900, 300, 1, .4 * g); return; }
      if (cls === 'slosher') { noise(.35, 'bandpass', 600, 300, 1.5, .5 * g); return; }
      if (cls === 'blade') { noise(.18, 'bandpass', 3000, 900, 2, .45 * g); return; }
      if (cls === 'stringer') { tone(600, .12, .25 * g, 'triangle', 0, 300); noise(.12, 'highpass', 3000, 2000, 1, .2 * g); return; }
      noise(.07, 'bandpass', 2200 + Math.random() * 600, 900, 2, .32 * g); tone(520 + Math.random() * 80, .06, .08 * g, 'square', 0, 240);
    },
    splat(g = 1) { noise(.12, 'lowpass', 1200, 300, 1, .25 * g); },
    boom(big = 1) { noise(.5 * big, 'lowpass', 1400, 120, 1, .7); tone(90, .4 * big, .5, 'sine', 0, 40); },
    dive() { noise(.25, 'bandpass', 500, 1200, 3, .3); tone(300, .15, .1, 'sine', 0, 600); },
    hurt() { tone(220, .1, .2, 'square', 0, 120); },
    die() { noise(.5, 'lowpass', 2000, 200, 1, .6); tone(500, .5, .25, 'sawtooth', 0, 80); },
    kill() { tone(880, .1, .2, 'square'); tone(1320, .15, .2, 'square', .08); },
    hit() { tone(1600, .04, .12, 'square'); },
    whistle() { tone(2000, .7, .3, 'sine', 0, 2100); tone(2400, .7, .15, 'sine'); },
    beep(hi) { tone(hi ? 1320 : 880, .12, .25, 'square'); },
    sp() { tone(440, .3, .2, 'sawtooth', 0, 880); tone(660, .4, .15, 'square', .1, 1320); },
    ready() { tone(660, .1, .2, 'square'); tone(990, .2, .2, 'square', .12); },
    win() { [72, 76, 79, 84].forEach((n, i) => tone(mtof(n), .4, .2, 'square', i * .14)); },
    lose() { [67, 63, 60].forEach((n, i) => tone(mtof(n), .5, .18, 'triangle', i * .2)); },
    ui() { tone(760, .06, .12, 'triangle'); }
  };
})();
