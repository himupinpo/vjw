
// ================= ステージ「みなと倉庫」（オリジナル）：高さの表（2.5D）＋ぬり =================
// ・床の高さを 0.25m ごとの表で持つ（はしの下に床がない形だけ。当たり判定・移動・ぬり・CPUの道さがしが全部この表）
// ・チームA（自分）は手前 z=+46、チームBは奥 z=-46。点対称に作る
const CS = 0.25, X0 = -32, Z0 = -50, GW = 256, GD = 400, MAPW = GW * CS, MAPD = GD * CS;
const HG = new Float32Array(GW * GD).fill(-10);   // 床の高さ（-10 は水）
const PT = new Uint8Array(GW * GD);               // ぬり：0 なし／1 チームA／2 チームB
const PTEX = new Uint8Array(GW * GD * 2);         // 表示用（R=A、G=B）
const PCNT = [0, 0, 0];
let PTOTAL = 0, paintDirty = true;
const STEP = 0.4;                                 // そのまま上がれる段差

// 箱：[x0, z0, x1, z1, 高さ, 色]  坂：[x0, z0, x1, z1, 低い側の高さ, 高い側の高さ, 向き('x'|'z'), 色]
// 手前半分（z>0）だけ書き、奥は点対称で作る。中央の物は1回だけ
const C_CONT = [0xc8503c, 0x3c7cc8, 0xd8a030, 0x4aa86a, 0x8a5ac8, 0xd86a9a];
const MAP_HALF = {
  boxes: [
    [-7, 41, 7, 48, 1.4, 0x8d8f99],                       // 自分たちのスタート台
    [-20, 30, -14, 32.6, 2.6, C_CONT[0]], [12, 24, 14.6, 30, 2.6, C_CONT[1]], [-4, 22, 4, 23, 1.0, 0x9a9a9a],
    [-26, 14, -22, 20, 2.6, C_CONT[2]], [20, 10, 24, 13, 1.0, 0x9a9a9a], [-14, 8, -12, 14, 2.6, C_CONT[3]], [5, 12, 9, 14, 2.6, C_CONT[4]],
    [18, 16, 30, 26, 2.2, 0xa0928a],                     // 右の高台
    [-30, 24, -24, 40, 1.2, 0x9a958c],                    // 左の高い通路
    [-12, 34, -9, 36, 1.0, 0x9a9a9a], [9, 34, 12, 36, 1.0, 0x9a9a9a], [-2, 30, 2, 31, 1.0, 0x9a9a9a],
    [24, 34, 30, 40, 2.6, C_CONT[5]]
  ],
  ramps: [
    [-4, 37, 4, 41, 0, 1.4, 'z', 0x8d8f99],
    [14, 18, 18, 22, 0, 2.2, 'x', 0xa0928a],
    [-30, 20, -26, 24, 0, 1.2, 'z', 0x9a958c]
  ],
  center: {
    boxes: [[-7, -5, 7, 5, 1.6, 0xb0a89a], [-1.5, -.6, 1.5, .6, 2.6, 0xd0c8b8]],
    ramps: [[7, -3, 11, 3, 1.6, 0, 'x', 0xb0a89a], [-11, -3, -7, 3, 0, 1.6, 'x', 0xb0a89a]]
  }
};
// 坂の [低い側, 高い側] は「x0/z0 側の高さ, x1/z1 側の高さ」
const mirrorBox = b => [-b[2], -b[3], -b[0], -b[1], b[4], b[5]];
const mirrorRamp = r => [-r[2], -r[3], -r[0], -r[1], r[5], r[4], r[6], r[7]];
const BOXES = [...MAP_HALF.boxes, ...MAP_HALF.boxes.map(mirrorBox), ...MAP_HALF.center.boxes];
const RAMPS = [...MAP_HALF.ramps, ...MAP_HALF.ramps.map(mirrorRamp), ...MAP_HALF.center.ramps];
const SPAWN = { 1: { x: 0, z: 44.5, yaw: Math.PI }, 2: { x: 0, z: -44.5, yaw: 0 } };   // yaw：-z を向くのが π
const SPAWN_ZONE = { 1: [-7, 41, 7, 48], 2: [-7, -48, 7, -41] };
const GROUND = [-30, -48, 30, 48];

function rampH(r, x, z) { const t = r[6] === 'x' ? (x - r[0]) / (r[2] - r[0]) : (z - r[1]) / (r[3] - r[1]); return lerp(r[4], r[5], clamp(t, 0, 1)); }
function buildHeight() {
  for (let j = 0; j < GD; j++) for (let i = 0; i < GW; i++) {
    const x = X0 + (i + .5) * CS, z = Z0 + (j + .5) * CS;
    let h = -10;
    if (x >= GROUND[0] && x <= GROUND[2] && z >= GROUND[1] && z <= GROUND[3]) h = 0;
    for (const b of BOXES) if (x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3]) h = Math.max(h, b[4]);
    for (const r of RAMPS) if (x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]) h = Math.max(h, rampH(r, x, z));
    HG[j * GW + i] = h;
  }
  PTOTAL = 0; for (let k = 0; k < HG.length; k++) if (HG[k] > -5) PTOTAL++;
}
const cellOf = (x, z) => { const i = Math.floor((x - X0) / CS), j = Math.floor((z - Z0) / CS); return i < 0 || j < 0 || i >= GW || j >= GD ? -1 : j * GW + i; };
function hAt(x, z) { const k = cellOf(x, z); return k < 0 ? -10 : HG[k]; }
function paintAtCell(x, z) { const k = cellOf(x, z); return k < 0 ? 0 : PT[k]; }
// 体の幅ぶん（まわり4点）でいちばん高い床
function hAround(x, z, r = .32) { return Math.max(hAt(x, z), hAt(x + r, z), hAt(x - r, z), hAt(x, z + r), hAt(x, z - r)); }

// ぬる：中心 (x,z)、高さ y の近くの床を半径 r でぬる。新しくぬれた面積(m²)を返す
function paintCircle(x, y, z, r, team) {
  if (r <= 0) return 0;
  const i0 = Math.max(0, Math.floor((x - r - X0) / CS)), i1 = Math.min(GW - 1, Math.floor((x + r - X0) / CS));
  const j0 = Math.max(0, Math.floor((z - r - Z0) / CS)), j1 = Math.min(GD - 1, Math.floor((z + r - Z0) / CS));
  const r2 = r * r; let n = 0;
  for (let j = j0; j <= j1; j++) {
    const dz = Z0 + (j + .5) * CS - z;
    for (let i = i0; i <= i1; i++) {
      const dx = X0 + (i + .5) * CS - x;
      // ふちを少しぎざぎざに
      const rr = r2 * (.82 + .18 * (((i * 73856093) ^ (j * 19349663)) & 255) / 255);
      if (dx * dx + dz * dz > rr) continue;
      const k = j * GW + i, h = HG[k];
      if (h < -5 || h > y + .45 || h < y - 3.2) continue;
      const old = PT[k]; if (old === team) continue;
      if (old) PCNT[old]--;
      PCNT[team]++; PT[k] = team; PTEX[k * 2] = team === 1 ? 255 : 0; PTEX[k * 2 + 1] = team === 2 ? 255 : 0; n++;
    }
  }
  if (n) paintDirty = true;
  return n * CS * CS;
}
function clearPaint() { PT.fill(0); PTEX.fill(0); PCNT[0] = PCNT[1] = PCNT[2] = 0; paintDirty = true; }

// 光線と床（高さの表）の交わり：ぶつかった距離（なければ maxD）
function rayGround(ox, oy, oz, dx, dy, dz, maxD, step = .2) {
  let px = ox, py = oy, pz = oz;
  for (let d = 0; d < maxD; d += step) {
    px = ox + dx * d; py = oy + dy * d; pz = oz + dz * d;
    if (py < hAt(px, pz)) return Math.max(0, d - step * .5);
    if (py < -6) return d;
  }
  return maxD;
}
function lineOfSight(ax, ay, az, bx, by, bz) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz);
  if (L < .01) return true;
  return rayGround(ax, ay, az, dx / L, dy / L, dz / L, L, .35) >= L - .3;
}

// ---------- 見た目：箱と坂をまとめたメッシュ。床の上面にぬりを重ねるシェーダー ----------
const paintTex = new T.DataTexture(PTEX, GW, GD, T.RGFormat, T.UnsignedByteType);
paintTex.magFilter = T.LinearFilter; paintTex.minFilter = T.LinearFilter; paintTex.generateMipmaps = false; paintTex.needsUpdate = true;
const PU = { uPaint: { value: paintTex }, uPO: { value: new T.Vector2(X0, Z0) }, uPS: { value: new T.Vector2(MAPW, MAPD) },
  uColA: { value: new T.Color('#ff2d87') }, uColB: { value: new T.Color('#1fd1ff') }, uTime: { value: 0 } };
function paintMaterial(opts) {
  const m = new T.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: .82, metalness: .02 }, opts));
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, PU);
    sh.vertexShader = 'varying vec3 vWP; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = `varying vec3 vWP; varying vec3 vWN;
uniform sampler2D uPaint; uniform vec2 uPO; uniform vec2 uPS; uniform vec3 uColA; uniform vec3 uColB; uniform float uTime;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  float pCov = 0.0;
  {
    float up = smoothstep(0.55, 0.8, vWN.y);
    if (up > 0.5) { vec2 g = abs(fract(vWP.xz / 2.0) - 0.5); diffuseColor.rgb *= 1.0 - 0.18 * step(0.482, max(g.x, g.y)); }
    else { float s = step(0.5, fract((abs(vWN.x) > 0.5 ? vWP.z : vWP.x) * 1.6)); diffuseColor.rgb *= 0.86 + 0.14 * s; diffuseColor.rgb *= 0.75 + 0.25 * smoothstep(-1.0, 2.0, vWP.y); }
    vec2 pv = texture2D(uPaint, (vWP.xz - uPO) / uPS).rg;
    float nz = vn(vWP.xz * 2.6) * 0.65 + vn(vWP.xz * 7.0) * 0.35 - 0.5;
    float a = smoothstep(0.36, 0.6, pv.r + nz * 0.42 * step(0.03, pv.r)) * up;
    float b = smoothstep(0.36, 0.6, pv.g + nz * 0.42 * step(0.03, pv.g)) * up;
    pCov = max(a, b);
    vec3 pc = a + b > 0.001 ? mix(uColA, uColB, b / (a + b)) : uColA;
    float rim = smoothstep(0.0, 0.25, pCov) - smoothstep(0.25, 0.6, pCov);
    diffuseColor.rgb = mix(diffuseColor.rgb, pc * (0.9 + 0.2 * vn(vWP.xz * 4.0)), pCov);
    diffuseColor.rgb *= 1.0 - rim * 0.25;
  }`).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.16, pCov);');
  };
  return m;
}
function colorGeo(g, hex) {
  const c = new T.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new T.BufferAttribute(a, 3)); return g;
}
function rampGeo(r) {
  const [x0, z0, x1, z1, h0, h1, ax] = r, lo = -1;
  // 上の面（傾き）と横の面。角ごとの高さ
  const yAt = (x, z) => ax === 'x' ? (x === x0 ? h0 : h1) : (z === z0 ? h0 : h1);
  const P = [], push = (...v) => P.push(...v);
  const c = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  // 上
  push(x0, yAt(x0, z0), z0, x0, yAt(x0, z1), z1, x1, yAt(x1, z1), z1, x0, yAt(x0, z0), z0, x1, yAt(x1, z1), z1, x1, yAt(x1, z0), z0);
  // 4つの横
  for (let k = 0; k < 4; k++) {
    const [ax0, az0] = c[k], [ax1, az1] = c[(k + 1) % 4];
    push(ax0, lo, az0, ax1, lo, az1, ax1, yAt(ax1, az1), az1, ax0, lo, az0, ax1, yAt(ax1, az1), az1, ax0, yAt(ax0, az0), az0);
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
  // 横の面は向きが逆のこともあるので両面で描く
  return g;
}
const world = new T.Group();
let terrainMesh = null;
function buildTerrain(scene) {
  const geos = [];
  const box = (x0, z0, x1, z1, h, col, lo = -1) => { const g = new T.BoxGeometry(x1 - x0, h - lo, z1 - z0); g.translate((x0 + x1) / 2, (h + lo) / 2, (z0 + z1) / 2); geos.push(colorGeo(g.toNonIndexed(), col)); };
  box(GROUND[0], GROUND[1], GROUND[2], GROUND[3], 0, 0x77757d, -2);
  for (const b of BOXES) box(b[0], b[1], b[2], b[3], b[4], b[5]);
  for (const r of RAMPS) { const g = rampGeo(r); g.deleteAttribute('normal'); g.computeVertexNormals(); geos.push(colorGeo(g, r[7])); }
  for (const g of geos) { if (g.attributes.uv) g.deleteAttribute('uv'); }
  const merged = mergeGeometries(geos);
  terrainMesh = new T.Mesh(merged, paintMaterial({ side: T.DoubleSide }));
  terrainMesh.receiveShadow = true; terrainMesh.castShadow = true;
  world.add(terrainMesh);
  // 海
  const sea = new T.Mesh(new T.PlaneGeometry(600, 600, 1, 1), new T.MeshStandardMaterial({ color: 0x1d6fa8, roughness: .15, metalness: .1, transparent: true, opacity: .92 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -1.3; world.add(sea);
  // スタート台の光る輪
  for (const t of [1, 2]) {
    const s = SPAWN[t], ring = new T.Mesh(new T.RingGeometry(2.2, 2.7, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(s.x, 1.43, s.z); ring.userData.team = t; world.add(ring); spawnRings.push(ring);
  }
  // 遠くのクレーンと灯台（かざり）
  const deco = new T.MeshStandardMaterial({ color: 0xd8b040, roughness: .6 }), deco2 = new T.MeshStandardMaterial({ color: 0xe8e4dc, roughness: .7 });
  for (const [x, z, s] of [[-58, -10, 1], [60, 18, -1], [-52, 40, 1], [54, -38, -1]]) {
    const g = new T.Group(); g.position.set(x, -1.3, z);
    const leg = new T.BoxGeometry(1.2, 22, 1.2);
    for (const [lx, lz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) { const m = new T.Mesh(leg, deco); m.position.set(lx, 11, lz); g.add(m); }
    const top = new T.Mesh(new T.BoxGeometry(30, 2, 2.4), deco); top.position.set(s * 8, 22, 0); g.add(top);
    const cab = new T.Mesh(new T.BoxGeometry(4, 3, 4), deco2); cab.position.set(0, 20, 0); g.add(cab);
    world.add(g);
  }
  { const lh = new T.Group(); lh.position.set(0, -1.3, -95);
    const body = new T.Mesh(new T.CylinderGeometry(2.4, 3.4, 22, 16), deco2); body.position.y = 11; lh.add(body);
    const band = new T.Mesh(new T.CylinderGeometry(2.6, 2.7, 3, 16), new T.MeshStandardMaterial({ color: 0xd83a3a })); band.position.y = 15; lh.add(band);
    world.add(lh); }
  scene.add(world);
}
const spawnRings = [];
function setTeamColors(a, b) {
  PU.uColA.value.set(a); PU.uColB.value.set(b);
  for (const r of spawnRings) r.material.color.set(r.userData.team === 1 ? a : b);
  document.documentElement.style.setProperty('--cA', a); document.documentElement.style.setProperty('--cB', b);
}
function uploadPaint() { if (paintDirty) { paintTex.needsUpdate = true; paintDirty = false; } }

// ---------- ミニマップ（上から見たぬり） ----------
const MINI = { c: null, g: null, base: null, img: null, t: 0 };
function miniInit() {
  MINI.c = $('mini'); MINI.g = MINI.c.getContext('2d');
  const w = MINI.c.width, h = MINI.c.height;
  MINI.img = MINI.g.createImageData(w, h);
  MINI.base = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = Math.floor(x / w * GW), j = Math.floor(y / h * GD), hh = HG[j * GW + i], o = (y * w + x) * 4;
    if (hh < -5) { MINI.base[o] = 30; MINI.base[o + 1] = 70; MINI.base[o + 2] = 110; }
    else { const l = 70 + hh * 26; MINI.base[o] = l; MINI.base[o + 1] = l; MINI.base[o + 2] = l + 8; }
    MINI.base[o + 3] = 255;
  }
}
function miniDraw(actors, me) {
  if (!MINI.g) return;
  const w = MINI.c.width, h = MINI.c.height, d = MINI.img.data;
  const A = hexRGB(G.pal[0]), B = hexRGB(G.pal[1]);
  d.set(MINI.base);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = Math.floor(x / w * GW), j = Math.floor(y / h * GD), p = PT[j * GW + i];
    if (!p) continue; const o = (y * w + x) * 4, c = p === 1 ? A : B;
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2];
  }
  MINI.g.putImageData(MINI.img, 0, 0);
  for (const a of actors) {
    if (a.dead || (a.team !== me.team && !a.revealed)) continue;
    const x = (a.x - X0) / MAPW * w, y = (a.z - Z0) / MAPD * h;
    MINI.g.fillStyle = a === me ? '#fff' : (a.team === 1 ? G.pal[0] : G.pal[1]);
    MINI.g.strokeStyle = '#000'; MINI.g.lineWidth = 1.5;
    MINI.g.beginPath(); MINI.g.arc(x, y, a === me ? 4.5 : 3.5, 0, TAU); MINI.g.fill(); MINI.g.stroke();
    if (a === me) { MINI.g.beginPath(); MINI.g.moveTo(x, y); MINI.g.lineTo(x + Math.sin(a.aimYaw) * 10, y + Math.cos(a.aimYaw) * 10); MINI.g.strokeStyle = '#fff'; MINI.g.lineWidth = 2; MINI.g.stroke(); }
  }
}
const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
