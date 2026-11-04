// =========================================================================================
//  ミラージュ・シティ — 砂色の海辺の街を舞台にした、オリジナルのオープンワールド・アクション
//  描画の土台は「砂の路地」と同じ：three.js r170、ACES、PCFソフトシャドウ、HDRの空、GTAO、
//  手続き生成のしっくい・砂（色・法線・粗さ）、材質ごとにまとめて描く大きなメッシュ
// =========================================================================================
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const TAU = Math.PI * 2;
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const sm = t => t * t * (3 - 2 * t);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(20251102);   // 街を組み立てる乱数（毎回同じ街）
const rr = (a, b) => a + Math.random() * (b - a);
const pick = (arr, r = Math.random) => arr[(r() * arr.length) | 0];
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (IS_TOUCH) document.body.classList.add('touch');

// ---------- ノイズとテクスチャ（「砂の路地」と同じ作り方） ----------
function fbm(size, periods, amps, r) {
  const H = new Float32Array(size * size);
  periods.forEach((p, k) => {
    const L = new Float32Array(p * p); for (let i = 0; i < L.length; i++) L[i] = r();
    const a = amps[k];
    for (let y = 0; y < size; y++) {
      const fy = y * p / size, y0 = Math.floor(fy), ty = sm(fy - y0), y1 = (y0 + 1) % p;
      for (let x = 0; x < size; x++) {
        const fx = x * p / size, x0 = Math.floor(fx), tx = sm(fx - x0), x1 = (x0 + 1) % p;
        const v = (L[y0 * p + x0] * (1 - tx) + L[y0 * p + x1] * tx) * (1 - ty) + (L[y1 * p + x0] * (1 - tx) + L[y1 * p + x1] * tx) * ty;
        H[y * size + x] += v * a;
      }
    }
  });
  let mn = 1e9, mx = -1e9; for (const v of H) { if (v < mn) mn = v; if (v > mx) mx = v; }
  for (let i = 0; i < H.length; i++) H[i] = (H[i] - mn) / (mx - mn);
  return H;
}
function canvasOf(size, fn, sizeY = size) {
  const c = document.createElement('canvas'); c.width = size; c.height = sizeY;
  const g = c.getContext('2d'), img = g.createImageData(size, sizeY);
  for (let i = 0; i < size * sizeY; i++) { const p = fn(i); img.data[i * 4] = p[0]; img.data[i * 4 + 1] = p[1]; img.data[i * 4 + 2] = p[2]; img.data[i * 4 + 3] = p.length > 3 ? p[3] : 255; }
  g.putImageData(img, 0, 0); return c;
}
function normalCanvas(H, size, strength, sizeY = size) {
  return canvasOf(size, i => {
    const x = i % size, y = (i / size) | 0;
    const h = (xx, yy) => H[((yy + sizeY) % sizeY) * size + ((xx + size) % size)];
    let nx = (h(x - 1, y) - h(x + 1, y)) * strength, ny = (h(x, y + 1) - h(x, y - 1)) * strength, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    return [(nx * .5 + .5) * 255, (ny * .5 + .5) * 255, (nz * .5 + .5) * 255];
  }, sizeY);
}
let maxAniso = 1;
function tex(canvas, srgb, repeat = true) {
  const t = new THREE.CanvasTexture(canvas);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = maxAniso;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return t;
}
const newCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------- 設定 ----------
const SET = { quality: IS_TOUCH ? 'std' : 'high', sens: 1, vol: 0.8, fps: 0 };
try { Object.assign(SET, JSON.parse(localStorage.getItem('mirage-settings')) || {}); } catch (e) { /* 初めて */ }
const saveSet = () => { try { localStorage.setItem('mirage-settings', JSON.stringify(SET)); } catch (e) { /* 保存できない */ } };
// 3dgame のホーム画面から渡される設定（横画面・音・視点の速さ）
const HUB = { embedded: window.parent !== window, vol: 1, sens: 1 };
if (HUB.embedded) document.body.classList.add('hub');
const ROT = { on: false };
const VW = () => (ROT.on ? innerHeight : innerWidth), VH = () => (ROT.on ? innerWidth : innerHeight);
const toStage = (cx, cy) => (ROT.on ? { x: cy, y: innerWidth - cx } : { x: cx, y: cy });

// ---------- レンダラー ----------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(66, 1, 0.12, 3200);
camera.rotation.order = 'YXZ';
scene.add(camera);
scene.fog = new THREE.Fog(0xcdbfa6, 220, 2000);

const SUN_DIR = new THREE.Vector3(0.62, 0.72, 0.3).normalize();
const sun = new THREE.DirectionalLight(0xfff1dc, 3.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -46, right: 46, top: 46, bottom: -46, near: 1, far: 260 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
scene.add(sun, sun.target);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, 1, 1);
gtao.blendIntensity = 1.0;
gtao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.5, thickness: 1.6, scale: 1.2, samples: 12 });
composer.addPass(gtao);
{ const ov = gtao.overrideVisibility.bind(gtao); gtao.overrideVisibility = () => { ov(); if (typeof CITY !== 'undefined' && CITY.skirt) CITY.skirt.visible = false; }; }   // 地平線の幕は影（AO）の計算に入れない
composer.addPass(new OutputPass());

function applyQuality() {
  const q = SET.quality, hi = q === 'high', lo = q === 'low';
  renderer.setPixelRatio(Math.min(devicePixelRatio, hi ? 1.5 : lo ? 0.85 : 1.15));
  gtao.enabled = hi;
  renderer.shadowMap.enabled = !lo;
  const ms = hi ? 2048 : 1536;
  if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  scene.traverse(o => { if (o.material && o.material.needsUpdate !== undefined && o.isMesh) o.material.needsUpdate = true; });
  POP.cars = lo ? 9 : hi ? 16 : 13; POP.peds = lo ? 14 : hi ? 30 : 22;
  onResize();
}
const POP = { cars: 13, peds: 22 };
function onResize() {
  const r = $('rot');
  r.style.width = VW() + 'px'; r.style.height = VH() + 'px';
  r.style.transform = ROT.on ? 'rotate(90deg) translateY(-100%)' : 'none';
  document.documentElement.style.setProperty('--sw', VW() / 100 + 'px'); document.documentElement.style.setProperty('--sh', VH() / 100 + 'px');
  document.body.classList.toggle('short', VH() < 520);
  const w = VW(), h = VH();
  renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < h ? 78 : 66; camera.updateProjectionMatrix();
}
addEventListener('resize', onResize);

// ---------- 入力（キーボード・マウス・タッチ） ----------
const IN = {
  mx: 0, my: 0,          // 移動（右が+x、前が+y）
  lookX: 0, lookY: 0,    // 視点の動き（たまった分）
  atk: false, aim: false, run: false, gas: 0, brake: 0, hand: false,
  pressed: new Set(),    // そのフレームに押されたボタン（jump, enter, weapon, horn, radio, cam, map, pause）
  keys: {}, locked: false, aimToggle: false,
};
const KEYMAP = { KeyF: 'enter', Enter: 'enter', KeyQ: 'weapon', Digit1: 'w1', Digit2: 'w2', Digit3: 'w3', KeyH: 'horn', KeyR: 'radio', KeyC: 'cam', KeyM: 'map', Space: 'jump', Escape: 'pause', KeyP: 'pause', KeyE: 'enter' };
addEventListener('keydown', e => {
  if (e.repeat) { IN.keys[e.code] = true; return; }
  IN.keys[e.code] = true;
  if (KEYMAP[e.code]) IN.pressed.add(KEYMAP[e.code]);
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', e => { IN.keys[e.code] = false; });
addEventListener('blur', () => { IN.keys = {}; IN.atk = false; IN.aim = false; });
function keyAxes() {
  const k = IN.keys; let x = 0, y = 0;
  if (k.KeyW || k.ArrowUp) y += 1; if (k.KeyS || k.ArrowDown) y -= 1;
  if (k.KeyA || k.ArrowLeft) x -= 1; if (k.KeyD || k.ArrowRight) x += 1;
  return { x, y };
}
// マウス：クリックでポインタを固定（PC）
canvas.addEventListener('mousedown', e => {
  if (IS_TOUCH || GAME.state !== 'play') return;
  if (!IN.locked) { try { canvas.requestPointerLock(); } catch (er) { /* 無理なら固定しない */ } }
  if (e.button === 0) IN.atk = true;
  if (e.button === 2) IN.aim = true;
});
addEventListener('mouseup', e => { if (e.button === 0) IN.atk = false; if (e.button === 2) IN.aim = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('pointerlockchange', () => { IN.locked = document.pointerLockElement === canvas; if (!IN.locked && GAME.state === 'play' && !IS_TOUCH) GAME.pause(); });
addEventListener('mousemove', e => {
  if (!IN.locked) return;
  IN.lookX += e.movementX * 0.0024; IN.lookY += e.movementY * 0.0024;
});
addEventListener('wheel', e => { if (GAME.state === 'play') IN.pressed.add(e.deltaY > 0 ? 'wnext' : 'wprev'); }, { passive: true });
// タッチ：左半分はスティック、右半分は視点。ボタンは別
const joyEl = $('joy'), knob = joyEl.querySelector('i');
let joy = null, look = null;
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return;
  if (GAME.state !== 'play') return;
  const p = toStage(e.clientX, e.clientY);
  try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* 捕まえられないときは無視 */ }
  if (p.x < VW() * 0.45 && !joy) {
    joy = { id: e.pointerId, x: p.x, y: p.y };
    joyEl.style.left = p.x + 'px'; joyEl.style.top = p.y + 'px'; joyEl.style.display = 'block'; knob.style.transform = '';
  } else if (!look) look = { id: e.pointerId, x: p.x, y: p.y };
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') return;
  const p = toStage(e.clientX, e.clientY);
  if (joy && e.pointerId === joy.id) {
    let dx = p.x - joy.x, dy = p.y - joy.y; const l = Math.hypot(dx, dy), m = 50;
    if (l > m) { dx *= m / l; dy *= m / l; }
    IN.mx = dx / m; IN.my = -dy / m; knob.style.transform = `translate(${dx}px,${dy}px)`;
  } else if (look && e.pointerId === look.id) {
    IN.lookX += (p.x - look.x) * 0.0062; IN.lookY += (p.y - look.y) * 0.0062;
    look.x = p.x; look.y = p.y;
  }
});
const endPtr = e => {
  if (joy && e.pointerId === joy.id) { joy = null; IN.mx = IN.my = 0; joyEl.style.display = 'none'; }
  if (look && e.pointerId === look.id) look = null;
};
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
// 画面のボタン
function tbtn(id, onDown, onUp) {
  const b = $(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); AUDIO.resume(); b.classList.add('on'); onDown && onDown(); try { b.setPointerCapture(e.pointerId); } catch (er) { /* なし */ } });
  const up = e => { b.classList.remove('on'); onUp && onUp(); };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
}
tbtn('bAtk', () => (IN.atk = true), () => (IN.atk = false));
tbtn('bJump', () => IN.pressed.add('jump'));
tbtn('bRun', () => (IN.run = true), () => (IN.run = false));
tbtn('bEnter', () => IN.pressed.add('enter'));
tbtn('bWeap', () => IN.pressed.add('wnext'));
tbtn('bAim', () => { IN.aimToggle = !IN.aimToggle; $('bAim').classList.toggle('on', IN.aimToggle); });
tbtn('bGas', () => (IN.gas = 1), () => (IN.gas = 0));
tbtn('bBrake', () => (IN.brake = 1), () => (IN.brake = 0));
tbtn('bHand', () => (IN.hand = true), () => (IN.hand = false));
tbtn('bHorn', () => IN.pressed.add('horn'));
tbtn('bRadio', () => IN.pressed.add('radio'));
$('pauseB').addEventListener('click', e => { e.stopPropagation(); if (GAME.state === 'play') GAME.pause(); });
function setTouchMode(inCar) {
  for (const id of ['bAtk', 'bJump', 'bRun', 'bWeap', 'bAim']) $(id).classList.toggle('hide', inCar);
  for (const id of ['bGas', 'bBrake', 'bHand', 'bHorn', 'bRadio']) $(id).classList.toggle('hide', !inCar);
  $('bEnter').textContent = inCar ? '降りる' : '乗る';
  $('bEnter').style.right = inCar ? '96px' : '92px'; $('bEnter').style.bottom = inCar ? '100px' : '96px';
}
