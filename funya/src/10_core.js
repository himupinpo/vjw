import * as THREE from 'three';
import * as CANNON from 'cannon-es';
const T = THREE, C = CANNON;
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const angD = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- セーブ（このゲームの分だけ：funya.〜） ----------
const SK = 'funya.';
const store = {
  get(k, d) { try { const v = localStorage.getItem(SK + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(SK + k, JSON.stringify(v)); } catch (e) { /* 保存できない環境 */ } },
  del(k) { try { localStorage.removeItem(SK + k); } catch (e) { /* */ } }
};
const COARSE = matchMedia('(pointer: coarse)').matches;
const SET = Object.assign({ sens: 1, invY: false, quality: COARSE ? 'mid' : 'high', camD: 4.5, both: false }, store.get('set', {}));
const saveSet = () => store.set('set', SET);
const REC = Object.assign({ clears: 0, bestTime: 0, bestFalls: 0 }, store.get('rec', {}));
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
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(62, 1, .06, 1500);
const hemi = new T.HemisphereLight(0xfff0f6, 0x7a6a9a, 1.0);
const sun = new T.DirectionalLight(0xfff2e0, 2.5);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
{ const c = sun.shadow.camera; c.left = -26; c.right = 26; c.top = 26; c.bottom = -26; c.near = 1; c.far = 160; }
sun.shadow.bias = -0.0004; sun.shadow.normalBias = .04;
scene.add(hemi, sun, sun.target);
scene.fog = new T.Fog(0xf6c8dc, 80, 460);
const SUN_DIR = new T.Vector3(.45, .8, .38).normalize();

// ---------- 空（夢のようなパステルの夕空） ----------
const skyMat = new T.ShaderMaterial({
  uniforms: { uSun: { value: SUN_DIR }, uTime: { value: 0 } }, side: T.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }',
  fragmentShader: `uniform vec3 uSun; uniform float uTime; varying vec3 vD;
    void main(){ vec3 d = normalize(vD); float y = d.y;
      vec3 top = vec3(.22,.42,.95), hor = vec3(1.,.74,.82), bot = vec3(.62,.48,.9);
      vec3 c = y > 0. ? mix(hor, top, pow(clamp(y, 0., 1.), .55)) : mix(hor, bot, pow(clamp(-y * 1.4, 0., 1.), .6));
      float s = max(dot(d, normalize(uSun)), 0.);
      c += vec3(1., .9, .7) * (pow(s, 900.) * 4. + pow(s, 12.) * .28);
      gl_FragColor = vec4(c, 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
const skyMesh = new T.Mesh(new T.SphereGeometry(900, 32, 16), skyMat); skyMesh.frustumCulled = false; skyMesh.renderOrder = -10; scene.add(skyMesh);

// ---------- 手づくりの模様 ----------
function canvasTex(size, draw, rep = true) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); draw(g, size);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; } t.anisotropy = 4; return t;
}
const TRND = mulberry(9);
const TEX = {
  noise: canvasTex(128, (g, s) => { g.fillStyle = '#ececec'; g.fillRect(0, 0, s, s); for (let i = 0; i < 700; i++) { const v = 215 + TRND() * 40 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(TRND() * s, TRND() * s, 2 + TRND() * 3, 2 + TRND() * 3); } }),
  grass: canvasTex(128, (g, s) => { g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, s, s); for (let i = 0; i < 1200; i++) { const v = 180 + TRND() * 75 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(TRND() * s, TRND() * s, 1.5, 3 + TRND() * 4); } }),
  wood: canvasTex(256, (g, s) => { g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 32) { const v = 200 + TRND() * 40 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y + 1, s, 30); g.fillStyle = 'rgba(80,80,80,.5)'; g.fillRect(0, y, s, 2);
    for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(120,120,120,.25)'; g.beginPath(); const yy = y + 4 + TRND() * 24; g.moveTo(0, yy); for (let x = 0; x <= s; x += 16) g.lineTo(x, yy + Math.sin(x * .05 + k) * 2); g.stroke(); } } }),
  crate: canvasTex(256, (g, s) => { g.fillStyle = '#e2e2e2'; g.fillRect(0, 0, s, s); g.strokeStyle = '#8a8a8a'; g.lineWidth = 18; g.strokeRect(9, 9, s - 18, s - 18); g.lineWidth = 14; g.beginPath(); g.moveTo(16, 16); g.lineTo(s - 16, s - 16); g.stroke();
    for (let y = 30; y < s; y += 46) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(18, y, s - 36, 3); } }, false),
  stone: canvasTex(256, (g, s) => { g.fillStyle = '#a8a8a8'; g.fillRect(0, 0, s, s); const h = 64; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const x = c * 96 + (r % 2) * 48, y = r * h; const v = 205 + TRND() * 40 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x + 3, y + 3, 90, h - 6); g.fillRect(x + 3 - 288, y + 3, 90, h - 6); } }),
  stripe: canvasTex(64, (g, s) => { g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, s, s); g.fillStyle = '#9a9a9a'; for (let i = -s; i < s; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 8, 0); g.lineTo(i + 8 + s, s); g.lineTo(i + s, s); g.fill(); } })
};
const _mats = new Map();
function mat(kind, hex) {
  const k = kind + hex; if (_mats.has(k)) return _mats.get(k);
  const o = { color: hex, roughness: .8, metalness: .02 };
  if (kind === 'grass') o.map = TEX.grass; else if (kind === 'wood') o.map = TEX.wood; else if (kind === 'crate') o.map = TEX.crate; else if (kind === 'stone') o.map = TEX.stone; else if (kind === 'stripe') o.map = TEX.stripe;
  else if (kind === 'shiny') { o.roughness = .3; o.metalness = .2; } else if (kind === 'metal') { o.roughness = .4; o.metalness = .55; } else if (kind === 'glow') { o.emissive = hex; o.emissiveIntensity = .8; } else if (kind === 'soft') { o.roughness = .55; } else o.map = TEX.noise;
  const m = new T.MeshStandardMaterial(o); _mats.set(k, m); return m;
}

// ================= 音（その場で作る音） =================
const AU = {
  ctx: null, master: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { const A = window.AudioContext || window.webkitAudioContext; this.ctx = new A(); } catch (e) { return; }
    this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination); this.applyVol();
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
  jump() { this.tone(260, 0, .16, 'triangle', .09, 520); },
  land(v) { const k = clamp(v / 14, .1, 1); this.noise(0, .08 + k * .15, .08 + k * .25, 300, .7, 'lowpass'); this.tone(110, 0, .12, 'sine', .12 * k, 60); },
  grab() { this.tone(520, 0, .07, 'sine', .08, 700); this.noise(0, .05, .05, 2400, 1.5); },
  bump(v) { const k = clamp(v / 8, .05, 1); this.noise(0, .1, .08 * k + .02, 500, .9); this.tone(150, 0, .1, 'sine', .08 * k, 90); },
  click() { this.tone(900, 0, .05, 'square', .04); },
  chime() { [0, 4, 7, 12].forEach((n, i) => this.tone(523.25 * Math.pow(2, n / 12), i * .08, .8, 'sine', .08)); },
  thunk() { this.tone(90, 0, .35, 'sine', .25, 50); this.noise(0, .25, .15, 400, .8); },
  whoosh() { this.noise(0, .6, .2, 700, .6); },
  bell() { [0, 7, 12, 16, 19].forEach((n, i) => { this.tone(392 * Math.pow(2, n / 12), i * .16, 2.2, 'sine', .1); this.tone(392 * 2.76 * Math.pow(2, n / 12), i * .16, 1.2, 'sine', .03); }); },
  fall() { this.tone(500, 0, .7, 'triangle', .07, 120); }
};

// ================= 入力（キーボード・マウス・タッチ） =================
const IN = { keys: new Set(), lookX: 0, lookY: 0, jumpE: false, jumpHeld: false, zoom: 0, touchOn: COARSE, stick: null, stickX: 0, stickY: 0, looks: new Map(), mL: false, mR: false, tL: false, tR: false };
const GAME_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyQ', 'KeyE'];
addEventListener('keydown', e => {
  if (GAME_KEYS.includes(e.code) && G.state === 'play') e.preventDefault();
  if (e.repeat) return;
  IN.keys.add(e.code);
  if (e.code === 'Space') { IN.jumpE = true; IN.jumpHeld = true; }
  if (e.code === 'KeyV' && G.state === 'play') toggleView();
  if ((e.code === 'Escape' || e.code === 'KeyP') && (G.state === 'play' || G.state === 'pause')) togglePause(G.state === 'play');
});
addEventListener('keyup', e => { IN.keys.delete(e.code); if (e.code === 'Space') IN.jumpHeld = false; });
addEventListener('blur', () => { IN.keys.clear(); IN.jumpHeld = false; IN.mL = IN.mR = false; });
function moveAxes() {
  const k = IN.keys;
  let x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
  let y = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
  if (IN.stick) { x += IN.stickX; y += IN.stickY; }
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  return [x, y];
}
// 手：左クリック／Q＝左手、右クリック／E＝右手。スマホはボタン（「両手 固定」で、はなしてものばしたまま）
const handL = () => IN.mL || IN.keys.has('KeyQ') || IN.tL || (IN.touchOn && SET.both);
const handR = () => IN.mR || IN.keys.has('KeyE') || IN.tR || (IN.touchOn && SET.both);
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', e => {
  AU.init();
  if (G.state !== 'play' || IN.touchOn) return;
  if (document.pointerLockElement !== canvas) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (er) { /* 固定できない */ } }
  if (e.button === 0) IN.mL = true; if (e.button === 2) IN.mR = true;
});
addEventListener('mouseup', e => { if (e.button === 0) IN.mL = false; if (e.button === 2) IN.mR = false; });
addEventListener('mousemove', e => { if (document.pointerLockElement === canvas) { IN.lookX += e.movementX; IN.lookY += e.movementY; } });
canvas.addEventListener('wheel', e => { IN.zoom += clamp(e.deltaY * .008, -1, 1); e.preventDefault(); }, { passive: false });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && G.state === 'play' && !IN.touchOn) togglePause(true); });

// タッチ：左半分＝移動の棒、右半分＝見回す（2本指でカメラのきょり）、ボタン＝左手・右手・両手固定・ジャンプ
(function touchSetup() {
  const layer = $('touch'), stickEl = $('stick'), knob = stickEl.querySelector('i');
  const hold = (id, on, off) => { const b = $(id);
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('on'); AU.init(); on(); try { b.setPointerCapture(e.pointerId); } catch (er) { /* */ } });
    const end = e => { b.classList.remove('on'); off(); }; b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); b.addEventListener('lostpointercapture', end); };
  hold('tJump', () => { IN.jumpE = true; IN.jumpHeld = true; }, () => { IN.jumpHeld = false; });
  hold('tL', () => { IN.tL = true; }, () => { IN.tL = false; });
  hold('tR', () => { IN.tR = true; }, () => { IN.tR = false; });
  const bb = $('tB'), bShow = () => { bb.classList.toggle('grab', !!SET.both); bb.querySelector('small').textContent = SET.both ? 'ON' : '固定'; };
  bb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); SET.both = !SET.both; saveSet(); bShow(); AU.init(); AU.click(); });
  bShow();
  layer.addEventListener('pointerdown', e => {
    IN.touchOn = true; document.body.classList.add('touch'); AU.init();
    const p = toStage(e.clientX, e.clientY);
    if (p.x < VW() * .42 && !IN.stick) {
      IN.stick = { id: e.pointerId, x: p.x, y: p.y }; IN.stickX = IN.stickY = 0;
      stickEl.style.display = 'block'; stickEl.style.left = p.x + 'px'; stickEl.style.top = p.y + 'px'; knob.style.transform = '';
    } else { IN.looks.set(e.pointerId, p); pinchStart(); }
  });
  let pinch = null;
  const pinchD = () => { const v = [...IN.looks.values()]; return Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y) || 1; };
  function pinchStart() { if (IN.looks.size >= 2 && !pinch) pinch = { d: pinchD(), cam: SET.camD }; }
  layer.addEventListener('pointermove', e => {
    const p = toStage(e.clientX, e.clientY);
    if (IN.stick && IN.stick.id === e.pointerId) {
      const R = 56; let dx = p.x - IN.stick.x, dy = p.y - IN.stick.y; const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; }
      IN.stickX = dx / R; IN.stickY = -dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`;
    } else if (IN.looks.has(e.pointerId)) {
      const q = IN.looks.get(e.pointerId); if (!pinch) { IN.lookX += (p.x - q.x) * 2.1; IN.lookY += (p.y - q.y) * 2.1; } IN.looks.set(e.pointerId, p);
      if (pinch && IN.looks.size >= 2) { const r = pinch.d / pinchD(); setCamD(Math.max(pinch.cam, .6) * r - (r < 1 ? (1 - r) * 1.5 : 0)); }
    }
  });
  const end = e => { if (IN.stick && IN.stick.id === e.pointerId) { IN.stick = null; IN.stickX = IN.stickY = 0; stickEl.style.display = 'none'; } IN.looks.delete(e.pointerId); if (IN.looks.size < 2) pinch = null; };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
})();
function takeEdge(k) { const v = IN[k]; IN[k] = false; return v; }
