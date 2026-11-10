import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const T = THREE;
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const angD = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
// 決まった並びの乱数（ステージはいつも同じ形になる。セーブコードの場所がずれないように）
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- セーブ（このゲームの分だけ：kumo.〜） ----------
const SK = 'kumo.';
const store = {
  get(k, d) { try { const v = localStorage.getItem(SK + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(SK + k, JSON.stringify(v)); } catch (e) { /* 保存できない環境 */ } },
  del(k) { try { localStorage.removeItem(SK + k); } catch (e) { /* */ } }
};
const COARSE = matchMedia('(pointer: coarse)').matches;
const SET = Object.assign({ sens: 1, invY: false, quality: COARSE ? 'mid' : 'high', camD: 5.5, runLock: false }, store.get('set', {}));
const saveSet = () => store.set('set', SET);
const REC = Object.assign({ best: 0, clears: 0, bestTime: 0, bestFalls: 0 }, store.get('rec', {}));
const saveRec = () => store.set('rec', REC);

// ---------- 3dgame のホームの中で動くとき（⚙ の横画面・音） ----------
const HUB = { embedded: window.parent !== window, vol: 1, sound: true };
if (HUB.embedded) document.body.classList.add('hub');
const ROT = { on: false };
const VW = () => (ROT.on ? innerHeight : innerWidth), VH = () => (ROT.on ? innerWidth : innerHeight);
const toStage = (cx, cy) => (ROT.on ? { x: cy, y: innerWidth - cx } : { x: cx, y: cy });

// ================= 描画の土台 =================
const canvas = $('c');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(62, 1, .08, 2600);
const hemi = new T.HemisphereLight(0xdfefff, 0x6a5a70, .9);
const sun = new T.DirectionalLight(0xffffff, 2.4);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
{ const c = sun.shadow.camera; c.left = -30; c.right = 30; c.top = 30; c.bottom = -30; c.near = 1; c.far = 200; }
sun.shadow.bias = -0.0005; sun.shadow.normalBias = .05;
scene.add(hemi, sun, sun.target);
scene.fog = new T.Fog(0xcfe8ff, 80, 640);

// ---------- 空（高さで、夜明け → 朝 → 昼 → 夕方 → 夜 と変わっていく） ----------
const SKYU = { uTop: { value: new T.Color() }, uHor: { value: new T.Color() }, uBot: { value: new T.Color() }, uSun: { value: new T.Vector3(0, 1, 0) }, uSunCol: { value: new T.Color() }, uStars: { value: 0 }, uTime: { value: 0 } };
const skyMat = new T.ShaderMaterial({
  uniforms: SKYU, side: T.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }',
  fragmentShader: `uniform vec3 uTop, uHor, uBot, uSunCol, uSun; uniform float uStars, uTime; varying vec3 vD;
    float hs(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    void main(){ vec3 d = normalize(vD); float y = d.y;
      vec3 c = y > 0. ? mix(uHor, uTop, pow(clamp(y, 0., 1.), .5)) : mix(uHor, uBot, pow(clamp(-y * 1.6, 0., 1.), .5));
      float s = max(dot(d, normalize(uSun)), 0.);
      c += uSunCol * (pow(s, 1200.) * 5. + pow(s, 14.) * .32 + pow(s, 3.) * .07);
      if (uStars > .01 && y > -.05) { vec3 q = floor(d * 260.); float st = smoothstep(.9962, 1., hs(q)); float tw = .55 + .45 * sin(uTime * 2.5 + hs(q + 3.) * 50.); c += vec3(.9, .95, 1.) * st * tw * uStars * clamp(y * 4. + .3, 0., 1.); }
      gl_FragColor = vec4(c, 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
const skyMesh = new T.Mesh(new T.SphereGeometry(1200, 32, 16), skyMat); skyMesh.frustumCulled = false; skyMesh.renderOrder = -10; scene.add(skyMesh);
// 高さごとの空の色（h: 高さ、el: 太陽の高さ°、az: 太陽の向き°）
const SKYK = [
  { h: -10, top: 0x6c8fd8, hor: 0xffc9a8, bot: 0x40608a, el: 9, az: 70, sc: 0xffc9a0, si: 1.7, hs: 0xffd6c4, hg: 0x5a4a60, hi: .75, st: 0 },
  { h: 80, top: 0x4e8fef, hor: 0xd4ebff, bot: 0x4a78a8, el: 34, az: 100, sc: 0xfff2dc, si: 2.4, hs: 0xdfefff, hg: 0x6a6070, hi: .9, st: 0 },
  { h: 200, top: 0x2f78ef, hor: 0xbfe2ff, bot: 0x4a80b8, el: 62, az: 140, sc: 0xffffff, si: 2.7, hs: 0xe6f3ff, hg: 0x707080, hi: .95, st: 0 },
  { h: 320, top: 0x4a7fd6, hor: 0xffe2a8, bot: 0x6a7aa0, el: 26, az: 200, sc: 0xffe4b8, si: 2.3, hs: 0xffeed4, hg: 0x6a5a60, hi: .85, st: 0 },
  { h: 420, top: 0x3b3f8e, hor: 0xff9a62, bot: 0x5a4a78, el: 6, az: 235, sc: 0xffa070, si: 1.7, hs: 0xffc0a0, hg: 0x4a3a58, hi: .7, st: .05 },
  { h: 500, top: 0x151a40, hor: 0x5a3f80, bot: 0x2a2450, el: 30, az: 300, sc: 0xa8b8ff, si: 1.0, hs: 0x8a98d8, hg: 0x2a2440, hi: .6, st: .7 },
  { h: 600, top: 0x060a20, hor: 0x2c2c62, bot: 0x14143a, el: 42, az: 320, sc: 0xb8c6ff, si: .95, hs: 0x7a88c8, hg: 0x202040, hi: .55, st: 1 }
];
const _ca = new T.Color(), _cb = new T.Color();
const SKYNOW = { fog: new T.Color(), sunDir: new T.Vector3(0, 1, 0), night: 0 };
function applySky(h, t) {
  let i = 0; while (i < SKYK.length - 2 && h > SKYK[i + 1].h) i++;
  const A = SKYK[i], B = SKYK[i + 1], f = smooth(A.h, B.h, h);
  const mix = (k, out) => out.copy(_ca.set(A[k])).lerp(_cb.set(B[k]), f);
  mix('top', SKYU.uTop.value); mix('hor', SKYU.uHor.value); mix('bot', SKYU.uBot.value); mix('sc', SKYU.uSunCol.value);
  const el = lerp(A.el, B.el, f) * Math.PI / 180, az = lerp(A.az, B.az, f) * Math.PI / 180;
  SKYNOW.sunDir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();
  SKYU.uSun.value.copy(SKYNOW.sunDir); SKYU.uStars.value = lerp(A.st, B.st, f); SKYU.uTime.value = t;
  sun.color.copy(SKYU.uSunCol.value); sun.intensity = lerp(A.si, B.si, f);
  mix('hs', hemi.color); mix('hg', hemi.groundColor); hemi.intensity = lerp(A.hi, B.hi, f);
  SKYNOW.fog.copy(SKYU.uHor.value).lerp(SKYU.uTop.value, .18); scene.fog.color.copy(SKYNOW.fog);
  SKYNOW.night = SKYU.uStars.value;
}

// ---------- 手づくりの模様（白黒の模様に、物ごとの色をかける） ----------
function canvasTex(size, draw, rep = true) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); draw(g, size);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; } t.anisotropy = 4; return t;
}
const TRND = mulberry(9);
const TEX = {
  noise: canvasTex(128, (g, s) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, s, s); for (let i = 0; i < 900; i++) { const v = 200 + TRND() * 55 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(TRND() * s, TRND() * s, 2 + TRND() * 3, 2 + TRND() * 3); } }),
  wood: canvasTex(256, (g, s) => { g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 32) { g.fillStyle = `rgb(${190 + TRND() * 40 | 0},${190 + TRND() * 40 | 0},${190 + TRND() * 40 | 0})`; g.fillRect(0, y + 1, s, 30); g.fillStyle = 'rgba(80,80,80,.55)'; g.fillRect(0, y, s, 2);
    for (let k = 0; k < 7; k++) { g.strokeStyle = 'rgba(120,120,120,.25)'; g.beginPath(); const yy = y + 4 + TRND() * 24; g.moveTo(0, yy); for (let x = 0; x <= s; x += 16) g.lineTo(x, yy + Math.sin(x * .05 + k) * 2); g.stroke(); } } }),
  metal: canvasTex(128, (g, s) => { for (let x = 0; x < s; x++) { const v = 170 + Math.round(60 * (.5 + .5 * Math.sin(x / s * TAU * 8))); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 1, s); } g.fillStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < 60; i++) g.fillRect(TRND() * s, TRND() * s, 6, 2); }),
  stone: canvasTex(256, (g, s) => { g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, s, s); const h = 64; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const x = c * 96 + (r % 2) * 48, y = r * h; const v = 200 + TRND() * 40 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x + 3, y + 3, 90, h - 6); g.fillRect(x + 3 - 288, y + 3, 90, h - 6); } for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(TRND() * s, TRND() * s, 3, 3); } }),
  grass: canvasTex(128, (g, s) => { g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, s, s); for (let i = 0; i < 1400; i++) { const v = 170 + TRND() * 85 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(TRND() * s, TRND() * s, 1.5, 3 + TRND() * 4); } }),
  paper: canvasTex(256, (g, s) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, s, s); g.fillStyle = 'rgba(90,120,200,.35)'; for (let y = 16; y < s; y += 16) g.fillRect(0, y, s, 1.5); g.fillStyle = 'rgba(220,90,90,.35)'; g.fillRect(28, 0, 1.5, s); }),
  grid: canvasTex(128, (g, s) => { g.fillStyle = '#bdbdbd'; g.fillRect(0, 0, s, s); g.fillStyle = '#efefef'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) g.fillRect(i * 16 + 2, j * 16 + 2, 12, 12); })
};
const matStd = (o) => new T.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: .78, metalness: .02 }, o));
const MATS = {
  plain: matStd({ map: TEX.noise }),
  wood: matStd({ map: TEX.wood, roughness: .85 }),
  metal: matStd({ map: TEX.metal, roughness: .45, metalness: .35 }),
  stone: matStd({ map: TEX.stone, roughness: .9 }),
  grass: matStd({ map: TEX.grass, roughness: .95 }),
  paper: matStd({ map: TEX.paper, roughness: .9 }),
  grid: matStd({ map: TEX.grid, roughness: .5, metalness: .4 }),
  shiny: matStd({ roughness: .25, metalness: .1 }),
  glow: new T.MeshStandardMaterial({ vertexColors: true, roughness: .3, emissive: 0xffffff, emissiveIntensity: .55, emissiveMap: null })
};
MATS.glow.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= diffuseColor.rgb;'); };

// ================= 音（その場で作る音） =================
const AU = {
  ctx: null, master: null, windG: null, windF: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { const C = window.AudioContext || window.webkitAudioContext; this.ctx = new C(); } catch (e) { return; }
    const c = this.ctx; this.master = c.createGain(); this.master.connect(c.destination); this.applyVol();
    const src = c.createBufferSource(); src.buffer = this.noiseBuf(2); src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = .7;
    const g = c.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(this.master); src.start();
    this.windG = g; this.windF = f;
  },
  applyVol() { if (this.master) this.master.gain.value = HUB.sound ? HUB.vol * .9 : 0; },
  noiseBuf(sec) { const c = this.ctx, b = c.createBuffer(1, c.sampleRate * sec | 0, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; },
  tone(f, t0, dur, type = 'sine', vol = .2, f2 = 0) {
    const c = this.ctx; if (!c) return; const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .05);
  },
  noise(t0, dur, vol = .2, fq = 800, q = 1, type = 'bandpass') {
    const c = this.ctx; if (!c) return; const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + t0;
    s.buffer = this.nb || (this.nb = this.noiseBuf(1)); f.type = type; f.frequency.value = fq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + .05);
  },
  jump() { this.tone(330, 0, .14, 'triangle', .1, 620); this.noise(0, .08, .05, 1800, .8); },
  land(v) { const k = clamp(v / 30, .08, 1); this.noise(0, .1 + k * .18, .12 + k * .3, 260 - k * 120, .8, 'lowpass'); if (k > .5) this.tone(70, 0, .25, 'sine', .25 * k, 40); },
  step(k) { this.noise(0, .05, .035, k === 'metal' ? 2600 : k === 'wood' ? 900 : k === 'grass' ? 1400 : 1200, 1.2); },
  splash() { this.noise(0, .7, .4, 900, .5); this.noise(.05, .5, .2, 3000, .6); },
  chime() { [0, 4, 7, 12].forEach((n, i) => this.tone(523.25 * Math.pow(2, n / 12), i * .09, .9, 'sine', .09)); },
  fanfare() { [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => this.tone(392 * Math.pow(2, n / 12), i * .11, 1.2, 'triangle', .1)); },
  click() { this.tone(900, 0, .05, 'square', .04); },
  wind(level) { if (!this.windG) return; const t = this.ctx.currentTime; this.windG.gain.setTargetAtTime(clamp(level, 0, 1) * .16, t, .25); this.windF.frequency.setTargetAtTime(300 + level * 900, t, .3); }
};

// ================= 入力（キーボード・マウス・タッチ） =================
const IN = { keys: new Set(), lookX: 0, lookY: 0, jumpE: false, jumpHeld: false, zoom: 0, touchOn: COARSE, stick: null, stickX: 0, stickY: 0, looks: new Map(), tJump: false };
const GAME_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight'];
addEventListener('keydown', e => {
  if (GAME_KEYS.includes(e.code) && G.state === 'play') e.preventDefault();
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (e.repeat) return;
  IN.keys.add(e.code);
  if (e.code === 'Space') { IN.jumpE = true; IN.jumpHeld = true; }
  if (e.code === 'Escape' && (G.state === 'play' || G.state === 'pause')) togglePause(G.state === 'play');
});
addEventListener('keyup', e => { IN.keys.delete(e.code); if (e.code === 'Space') IN.jumpHeld = false; });
addEventListener('blur', () => { IN.keys.clear(); IN.jumpHeld = false; });
function moveAxes() {
  const k = IN.keys;
  let x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
  let y = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
  if (IN.stick) { x += IN.stickX; y += IN.stickY; }
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  return [x, y];
}
// ダッシュ：Shift、またはスマホは棒をいっぱいにたおす／「ダッシュ固定」
const sprinting = () => IN.keys.has('ShiftLeft') || IN.keys.has('ShiftRight') || SET.runLock || (IN.stick && Math.hypot(IN.stickX, IN.stickY) > .92);
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', () => {
  AU.init();
  if (G.state === 'play' && !IN.touchOn && document.pointerLockElement !== canvas) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (er) { /* 固定できない */ } }
});
addEventListener('mousemove', e => { if (document.pointerLockElement === canvas) { IN.lookX += e.movementX; IN.lookY += e.movementY; } });
canvas.addEventListener('wheel', e => { IN.zoom += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && G.state === 'play' && !IN.touchOn) togglePause(true); });

// タッチ：左半分＝移動の棒、右半分＝見回す、ボタン＝ジャンプ・ダッシュ固定
(function touchSetup() {
  const layer = $('touch'), stickEl = $('stick'), knob = stickEl.querySelector('i');
  const jb = $('tJump');
  jb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); jb.classList.add('on'); IN.jumpE = true; IN.jumpHeld = true; AU.init(); });
  const jEnd = () => { jb.classList.remove('on'); IN.jumpHeld = false; };
  jb.addEventListener('pointerup', jEnd); jb.addEventListener('pointercancel', jEnd); jb.addEventListener('pointerleave', jEnd);
  const rb = $('tRun');
  rb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); SET.runLock = !SET.runLock; saveSet(); rb.classList.toggle('lock', SET.runLock); AU.click(); });
  rb.classList.toggle('lock', !!SET.runLock);
  layer.addEventListener('pointerdown', e => {
    IN.touchOn = true; document.body.classList.add('touch'); AU.init();
    const p = toStage(e.clientX, e.clientY);
    if (p.x < VW() * .45 && !IN.stick) {
      IN.stick = { id: e.pointerId, x: p.x, y: p.y }; IN.stickX = IN.stickY = 0;
      stickEl.style.display = 'block'; stickEl.style.left = p.x + 'px'; stickEl.style.top = p.y + 'px'; knob.style.transform = '';
    } else IN.looks.set(e.pointerId, p);
  });
  layer.addEventListener('pointermove', e => {
    const p = toStage(e.clientX, e.clientY);
    if (IN.stick && IN.stick.id === e.pointerId) {
      const R = 56; let dx = p.x - IN.stick.x, dy = p.y - IN.stick.y; const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; }
      IN.stickX = dx / R; IN.stickY = -dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`;
    } else if (IN.looks.has(e.pointerId)) {
      const q = IN.looks.get(e.pointerId); IN.lookX += (p.x - q.x) * 2.1; IN.lookY += (p.y - q.y) * 2.1; IN.looks.set(e.pointerId, p);
    }
  });
  const end = e => { if (IN.stick && IN.stick.id === e.pointerId) { IN.stick = null; IN.stickX = IN.stickY = 0; stickEl.style.display = 'none'; } IN.looks.delete(e.pointerId); };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
})();
function takeEdge(k) { const v = IN[k]; IN[k] = false; return v; }
