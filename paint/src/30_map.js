
// ================= ステージの形（2.5Dの高さの表）・床と壁のぬり =================
// ・床の高さを 0.25m ごとの表で持つ（当たり判定・移動・ぬり・CPUの道さがしが全部この表）
// ・箱の横の面（壁）にもぬれる。壁のぬりは面ごとの小さな表を1枚の画像（アトラス）にまとめて持つ
// ・チームA（自分）は手前 z>0、チームBは奥 z<0。点対称
const CS = 0.25, X0 = -32, Z0 = -50, GW = 256, GD = 400, MAPW = GW * CS, MAPD = GD * CS;
const HG = new Float32Array(GW * GD).fill(-10);   // 床の高さ（-10 は水・空）
const BX = new Int16Array(GW * GD).fill(-1);      // そのます目でいちばん上の箱（なければ -1）
const PT = new Uint8Array(GW * GD);               // 床のぬり：0 なし／1 チームA／2 チームB
const PTEX = new Uint8Array(GW * GD * 2);         // 表示用（R=A、G=B）
const PCNT = [0, 0, 0];
let PTOTAL = 0, paintDirty = true;
const STEP = 0.4;                                 // そのまま上がれる段差
let STAGE = null, STAGE_ID = '', BOXES = [], RAMPS = [], GROUND = [-30, -48, 30, 48], WATER = [], SPAWN = {}, SPAWN_ZONE = {}, ZONE = null;
// 壁のぬり（アトラス）
const AW = 512; let AH = 8, WP = new Uint8Array(AW * AH), WTEX = new Uint8Array(AW * AH * 2), wallDirty = true;
const FACES = [];

const inRect = (x, z, r) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
function rampH(r, x, z) { const t = r[6] === 'x' ? (x - r[0]) / (r[2] - r[0]) : (z - r[1]) / (r[3] - r[1]); return lerp(r[4], r[5], clamp(t, 0, 1)); }
function buildHeight() {
  HG.fill(-10); BX.fill(-1);
  for (let j = 0; j < GD; j++) for (let i = 0; i < GW; i++) {
    const x = X0 + (i + .5) * CS, z = Z0 + (j + .5) * CS;
    let h = -10, bi = -1;
    if (inRect(x, z, GROUND)) { h = 0; for (const w of WATER) if (inRect(x, z, w)) { h = -10; break; } }
    for (let k = 0; k < BOXES.length; k++) { const b = BOXES[k]; if (x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3] && b[4] >= h) { h = b[4]; bi = k; } }
    for (const r of RAMPS) if (x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]) { const rh = rampH(r, x, z); if (rh > h) { h = rh; bi = -1; } }
    HG[j * GW + i] = h; BX[j * GW + i] = bi;
  }
  PTOTAL = 0; for (let k = 0; k < HG.length; k++) if (HG[k] > -5) PTOTAL++;
}
const cellOf = (x, z) => { const i = Math.floor((x - X0) / CS), j = Math.floor((z - Z0) / CS); return i < 0 || j < 0 || i >= GW || j >= GD ? -1 : j * GW + i; };
function hAt(x, z) { const k = cellOf(x, z); return k < 0 ? -10 : HG[k]; }
function paintAtCell(x, z) { const k = cellOf(x, z); return k < 0 ? 0 : PT[k]; }
// 体の幅ぶん（まわり4点）でいちばん高い床
function hAround(x, z, r = .32) { return Math.max(hAt(x, z), hAt(x + r, z), hAt(x - r, z), hAt(x, z + r), hAt(x, z - r)); }

// ---------- 床をぬる ----------
// 中心 (x,z)、高さ y の近くの床を半径 r でぬる。新しくぬれた面積(m²)を返す
function paintCircle(x, y, z, r, team) {
  if (r <= 0) return 0;
  const i0 = Math.max(0, Math.floor((x - r - X0) / CS)), i1 = Math.min(GW - 1, Math.floor((x + r - X0) / CS));
  const j0 = Math.max(0, Math.floor((z - r - Z0) / CS)), j1 = Math.min(GD - 1, Math.floor((z + r - Z0) / CS));
  const r2 = r * r; let n = 0;
  for (let j = j0; j <= j1; j++) {
    const dz = Z0 + (j + .5) * CS - z;
    for (let i = i0; i <= i1; i++) {
      const dx = X0 + (i + .5) * CS - x;
      const rr = r2 * (.82 + .18 * (((i * 73856093) ^ (j * 19349663)) & 255) / 255);   // ふちを少しぎざぎざに
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
function clearPaint() { PT.fill(0); PTEX.fill(0); PCNT[0] = PCNT[1] = PCNT[2] = 0; paintDirty = true; WP.fill(0); WTEX.fill(0); wallDirty = true; }

// ---------- 壁（箱の横の面） ----------
function buildFaces() {
  FACES.length = 0;
  let px = 1, py = 1, rowH = 0;
  const place = (cols, rows) => { if (px + cols + 1 > AW) { px = 1; py += rowH + 1; rowH = 0; } const r = [px, py]; px += cols + 1; rowH = Math.max(rowH, rows); return r; };
  BOXES.forEach((b, bi) => {
    const lo = -1, h = b[4], rows = Math.ceil((h - lo) / CS);
    b.faces = {};
    for (const [key, axis, sign, c, a0, a1] of [['xm', 'x', -1, b[0], b[1], b[3]], ['xp', 'x', 1, b[2], b[1], b[3]], ['zm', 'z', -1, b[1], b[0], b[2]], ['zp', 'z', 1, b[3], b[0], b[2]]]) {
      const cols = Math.ceil((a1 - a0) / CS), [ax, ay] = place(cols, rows);
      const f = { bi, key, axis, sign, c, a0, a1, y0: lo, y1: h, cols, rows, ax, ay };
      FACES.push(f); b.faces[key] = f;
    }
  });
  AH = py + rowH + 2;
  WP = new Uint8Array(AW * AH); WTEX = new Uint8Array(AW * AH * 2);
  if (wallTex) wallTex.dispose();
  wallTex = makeWallTex(); PU.uWall.value = wallTex; PU.uWS.value.set(AW, AH);
}
function paintFace(f, hc, y, r, team) {
  const i0 = Math.max(0, Math.floor((hc - r - f.a0) / CS)), i1 = Math.min(f.cols - 1, Math.floor((hc + r - f.a0) / CS));
  const j0 = Math.max(0, Math.floor((y - r - f.y0) / CS)), j1 = Math.min(f.rows - 1, Math.floor((y + r - f.y0) / CS));
  const r2 = r * r; let n = 0;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const dx = f.a0 + (i + .5) * CS - hc, dy = f.y0 + (j + .5) * CS - y;
    if (dx * dx + dy * dy > r2 * (.8 + .2 * (((i * 92821) ^ (j * 68917)) & 255) / 255)) continue;
    const k = (f.ay + j) * AW + f.ax + i; if (WP[k] === team) continue;
    WP[k] = team; WTEX[k * 2] = team === 1 ? 255 : 0; WTEX[k * 2 + 1] = team === 2 ? 255 : 0; n++;
  }
  if (n) wallDirty = true;
  return n;
}
function wallTeamAt(f, hc, y) { const i = Math.floor((hc - f.a0) / CS), j = Math.floor((y - f.y0) / CS); if (i < 0 || j < 0 || i >= f.cols || j >= f.rows) return 0; return WP[(f.ay + j) * AW + f.ax + i]; }
// (ox,oz)→(nx,nz) の線が箱 bi のどの面をこえたか
function crossFace(bi, ox, oz, nx, nz) {
  const b = BOXES[bi]; if (!b || !b.faces) return null;
  let key = null, t = 2;
  const test = (k, tt) => { if (tt >= 0 && tt <= 1.0001 && tt < t) { t = tt; key = k; } };
  if (ox <= b[0] && nx > b[0]) test('xm', (b[0] - ox) / (nx - ox));
  if (ox >= b[2] && nx < b[2]) test('xp', (ox - b[2]) / (ox - nx));
  if (oz <= b[1] && nz > b[1]) test('zm', (b[1] - oz) / (nz - oz));
  if (oz >= b[3] && nz < b[3]) test('zp', (oz - b[3]) / (oz - nz));
  if (!key) {   // すでに中にいた：いちばん近い面
    const d = [['xm', Math.abs(nx - b[0])], ['xp', Math.abs(nx - b[2])], ['zm', Math.abs(nz - b[1])], ['zp', Math.abs(nz - b[3])]].sort((p, q) => p[1] - q[1]);
    key = d[0][0]; t = 1;
  }
  const f = b.faces[key], x = lerp(ox, nx, t), z = lerp(oz, nz, t);
  return { f, t, hc: f.axis === 'x' ? z : x };
}
// 弾が壁に当たった：その面をぬる
function paintWallHit(ox, oy, oz, nx, ny, nz, r, team) {
  const k = cellOf(nx, nz); if (k < 0) return 0;
  const bi = BX[k]; if (bi < 0) return 0;
  const c = crossFace(bi, ox, oz, nx, nz); if (!c) return 0;
  return paintFace(c.f, c.hc, lerp(oy, ny, c.t), r, team);
}
// 爆発：近くの壁もぬる
function paintWallsNear(x, y, z, r, team) {
  for (const f of FACES) {
    const d = f.axis === 'x' ? (x - f.c) * f.sign : (z - f.c) * f.sign;
    if (d < -.1 || d > r) continue;
    const hc = f.axis === 'x' ? z : x;
    if (hc < f.a0 - r || hc > f.a1 + r || y < f.y0 - r || y > f.y1 + r) continue;
    paintFace(f, hc, y, Math.sqrt(Math.max(0, r * r - d * d)), team);
  }
}

// 光線と床（高さの表）の交わり：ぶつかった距離（なければ maxD）
function rayGround(ox, oy, oz, dx, dy, dz, maxD, step = .2) {
  for (let d = 0; d < maxD; d += step) {
    const px = ox + dx * d, py = oy + dy * d, pz = oz + dz * d;
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

// ---------- 見た目：床と壁にぬりを重ねるシェーダー ----------
const paintTex = new T.DataTexture(PTEX, GW, GD, T.RGFormat, T.UnsignedByteType);
paintTex.magFilter = T.LinearFilter; paintTex.minFilter = T.LinearFilter; paintTex.generateMipmaps = false; paintTex.needsUpdate = true;
function makeWallTex() { const t = new T.DataTexture(WTEX, AW, AH, T.RGFormat, T.UnsignedByteType); t.magFilter = T.LinearFilter; t.minFilter = T.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; }
let wallTex = null;
const PU = { uPaint: { value: paintTex }, uPO: { value: new T.Vector2(X0, Z0) }, uPS: { value: new T.Vector2(MAPW, MAPD) },
  uWall: { value: null }, uWS: { value: new T.Vector2(AW, AH) }, uCS: { value: CS },
  uColA: { value: new T.Color('#ff2d87') }, uColB: { value: new T.Color('#1fd1ff') }, uTime: { value: 0 } };
wallTex = makeWallTex(); PU.uWall.value = wallTex;
function paintMaterial(opts) {
  const m = new T.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: .82, metalness: .02 }, opts));
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, PU);
    sh.vertexShader = 'attribute vec4 aFace; varying vec4 vFace; varying vec3 vWP; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal); vFace = aFace;');
    sh.fragmentShader = `varying vec4 vFace; varying vec3 vWP; varying vec3 vWN;
uniform sampler2D uPaint; uniform sampler2D uWall; uniform vec2 uPO; uniform vec2 uPS; uniform vec2 uWS; uniform float uCS; uniform vec3 uColA; uniform vec3 uColB; uniform float uTime;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  float pCov = 0.0;
  {
    float up = smoothstep(0.55, 0.8, vWN.y);
    vec2 pv = vec2(0.0); vec2 nc = vWP.xz;
    if (up > 0.5) {
      vec2 g = abs(fract(vWP.xz / 2.0) - 0.5); diffuseColor.rgb *= 1.0 - 0.18 * step(0.482, max(g.x, g.y));
      pv = texture2D(uPaint, (vWP.xz - uPO) / uPS).rg;
    } else {
      float s = step(0.5, fract((abs(vWN.x) > 0.5 ? vWP.z : vWP.x) * 1.6)); diffuseColor.rgb *= 0.86 + 0.14 * s; diffuseColor.rgb *= 0.75 + 0.25 * smoothstep(-1.0, 2.0, vWP.y);
      if (vFace.x >= 0.0 && abs(vWN.y) < 0.3) {
        float hc = abs(vWN.x) > 0.5 ? vWP.z : vWP.x;
        pv = texture2D(uWall, vec2(vFace.x + (hc - vFace.z) / uCS, vFace.y + (vWP.y - vFace.w) / uCS) / uWS).rg;
        nc = vec2(hc, vWP.y);
      }
    }
    float nz = vn(nc * 2.6) * 0.65 + vn(nc * 7.0) * 0.35 - 0.5;
    float a = smoothstep(0.36, 0.6, pv.r + nz * 0.42 * step(0.03, pv.r));
    float b = smoothstep(0.36, 0.6, pv.g + nz * 0.42 * step(0.03, pv.g));
    pCov = max(a, b);
    vec3 pc = a + b > 0.001 ? mix(uColA, uColB, b / (a + b)) : uColA;
    float rim = smoothstep(0.0, 0.25, pCov) - smoothstep(0.25, 0.6, pCov);
    diffuseColor.rgb = mix(diffuseColor.rgb, pc * (0.9 + 0.2 * vn(nc * 4.0)), pCov);
    diffuseColor.rgb *= 1.0 - rim * 0.25;
  }`).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.16, pCov);');
  };
  return m;
}
const terrainMat = paintMaterial({ side: T.DoubleSide });
const world = new T.Group();
let terrainMesh = null, decor = null;
// 水の四角を引いた、地面の四角たち
function groundPieces() {
  let pieces = [GROUND.slice()];
  for (const w of WATER) {
    const out = [];
    for (const p of pieces) {
      if (w[0] >= p[2] || w[2] <= p[0] || w[1] >= p[3] || w[3] <= p[1]) { out.push(p); continue; }
      if (w[1] > p[1]) out.push([p[0], p[1], p[2], w[1]]);
      if (w[3] < p[3]) out.push([p[0], w[3], p[2], p[3]]);
      const z0 = Math.max(p[1], w[1]), z1 = Math.min(p[3], w[3]);
      if (w[0] > p[0]) out.push([p[0], z0, w[0], z1]);
      if (w[2] < p[2]) out.push([w[2], z0, p[2], z1]);
    }
    pieces = out;
  }
  return pieces;
}
function buildTerrain() {
  if (terrainMesh) { world.remove(terrainMesh); terrainMesh.geometry.dispose(); }
  const P = [], N = [], C = [], F = [], col = new T.Color(), NOF = [-1, -1, 0, 0];
  const nrm = (a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; return [nx / l, ny / l, nz / l]; };
  const tri = (a, b, c, n, fc) => { for (const v of [a, b, c]) { P.push(v[0], v[1], v[2]); N.push(n[0], n[1], n[2]); C.push(col.r, col.g, col.b); F.push(fc[0], fc[1], fc[2], fc[3]); } };
  const quad = (a, b, c, d, fc) => { const n = nrm(a, b, c); if (!(Math.abs(n[0]) + Math.abs(n[1]) + Math.abs(n[2]))) return; tri(a, b, c, n, fc); tri(a, c, d, n, fc); };
  const fa = f => f ? [f.ax, f.ay, f.a0, f.y0] : NOF;
  const boxGeo = (x0, z0, x1, z1, h, lo, faces) => {
    quad([x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0], NOF);
    quad([x0, lo, z0], [x0, lo, z1], [x0, h, z1], [x0, h, z0], fa(faces && faces.xm));
    quad([x1, lo, z1], [x1, lo, z0], [x1, h, z0], [x1, h, z1], fa(faces && faces.xp));
    quad([x1, lo, z0], [x0, lo, z0], [x0, h, z0], [x1, h, z0], fa(faces && faces.zm));
    quad([x0, lo, z1], [x1, lo, z1], [x1, h, z1], [x0, h, z1], fa(faces && faces.zp));
  };
  col.setHex(STAGE.groundCol);
  for (const r of groundPieces()) boxGeo(r[0], r[1], r[2], r[3], 0, -2, null);
  for (const b of BOXES) { col.setHex(b[5]); boxGeo(b[0], b[1], b[2], b[3], b[4], -1, b.faces); }
  for (const r of RAMPS) {
    col.setHex(r[7]);
    const [x0, z0, x1, z1] = r, y = (x, z) => rampH(r, x, z), lo = -1;
    quad([x0, y(x0, z0), z0], [x0, y(x0, z1), z1], [x1, y(x1, z1), z1], [x1, y(x1, z0), z0], NOF);
    quad([x0, lo, z0], [x0, lo, z1], [x0, y(x0, z1), z1], [x0, y(x0, z0), z0], NOF);
    quad([x1, lo, z1], [x1, lo, z0], [x1, y(x1, z0), z0], [x1, y(x1, z1), z1], NOF);
    quad([x1, lo, z0], [x0, lo, z0], [x0, y(x0, z0), z0], [x1, y(x1, z0), z0], NOF);
    quad([x0, lo, z1], [x1, lo, z1], [x1, y(x1, z1), z1], [x0, y(x0, z1), z1], NOF);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(C, 3)); g.setAttribute('aFace', new T.Float32BufferAttribute(F, 4));
  g.computeBoundingSphere();
  terrainMesh = new T.Mesh(g, terrainMat); terrainMesh.receiveShadow = true; terrainMesh.castShadow = true;
  world.add(terrainMesh);
}

// ---------- まわりのかざり（ステージごと） ----------
const spawnRings = [];
let skyMesh = null;
function buildDecor() {
  if (decor) { world.remove(decor); decor.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); }); }
  decor = new T.Group(); world.add(decor); spawnRings.length = 0;
  const s = STAGE, th = s.theme;
  // 空
  { const g = new T.SphereGeometry(600, 24, 12), c = [], top = new T.Color(s.sky[0]), mid = new T.Color(s.sky[1]), low = new T.Color(s.sky[2]);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 600, cc = y > .2 ? mid.clone().lerp(top, (y - .2) / .8) : low.clone().lerp(mid, clamp((y + .1) / .3, 0, 1)); c.push(cc.r, cc.g, cc.b); }
    g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
    skyMesh = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })); decor.add(skyMesh); }
  if (typeof scene !== 'undefined') { scene.background = new T.Color(s.fog); scene.fog = new T.Fog(s.fog, th === 'roof' ? 120 : 90, th === 'roof' ? 420 : 300); sun.color.set(s.sun); }
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o));
  const box = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); decor.add(m); return m; };
  if (th === 'harbor' || th === 'market') {
    const sea = new T.Mesh(new T.PlaneGeometry(900, 900), new T.MeshStandardMaterial({ color: th === 'market' ? 0x2a86b8 : 0x1d6fa8, roughness: .15, metalness: .1, transparent: true, opacity: .92 }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -1.3; decor.add(sea);
  }
  if (th === 'harbor') {
    const deco = M(0xd8b040, { roughness: .6 }), deco2 = M(0xe8e4dc);
    for (const [x, z, sd] of [[-58, -10, 1], [60, 18, -1], [-52, 40, 1], [54, -38, -1]]) {
      const g = new T.Group(); g.position.set(x, -1.3, z); decor.add(g);
      for (const [lx, lz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) { const m = new T.Mesh(new T.BoxGeometry(1.2, 22, 1.2), deco); m.position.set(lx, 11, lz); g.add(m); }
      const top = new T.Mesh(new T.BoxGeometry(30, 2, 2.4), deco); top.position.set(sd * 8, 22, 0); g.add(top);
      const cab = new T.Mesh(new T.BoxGeometry(4, 3, 4), deco2); cab.position.set(0, 20, 0); g.add(cab);
    }
    const lh = new T.Group(); lh.position.set(0, -1.3, -95); decor.add(lh);
    const body = new T.Mesh(new T.CylinderGeometry(2.4, 3.4, 22, 16), deco2); body.position.y = 11; lh.add(body);
    const band = new T.Mesh(new T.CylinderGeometry(2.6, 2.7, 3, 16), M(0xd83a3a)); band.position.y = 15; lh.add(band);
  }
  if (th === 'roof') {
    // ずっと下の町。ビルの高さはばらばら（屋上より高いビルも遠くに）
    const ground = new T.Mesh(new T.PlaneGeometry(1400, 1400), M(0x3a3f4a)); ground.rotation.x = -Math.PI / 2; ground.position.y = -70; decor.add(ground);
    const q = mulberry(7), cols = [0x8a8f9a, 0xb0a898, 0x6a7080, 0xc8c0b0, 0x5a6a7a, 0x9a8070];
    for (let i = 0; i < 70; i++) {
      const a = q() * TAU, r = 70 + q() * 260, w = 14 + q() * 22, d = 14 + q() * 22, top = -50 + q() * (r > 150 ? 110 : 55);
      const m = box(w, top + 70, d, M(cols[i % cols.length]), Math.cos(a) * r, (top - 70) / 2, Math.sin(a) * r * 1.2);
      m.rotation.y = q() * 1.5;
    }
    // 屋上のふちの低い段（見た目だけ）
    const rim = M(0x7a746c);
    box(s.ground[2] * 2 + 1, .5, .5, rim, 0, -.1, s.ground[3] + .25); box(s.ground[2] * 2 + 1, .5, .5, rim, 0, -.1, s.ground[1] - .25);
    box(.5, .5, s.ground[3] * 2 + 1, rim, s.ground[2] + .25, -.1, 0); box(.5, .5, s.ground[3] * 2 + 1, rim, s.ground[0] - .25, -.1, 0);
  }
  if (th === 'market') {
    const q = mulberry(11), wall = [0xf0e6d6, 0xe8d0b0, 0xd8e0e8, 0xf4dcc8], roofc = [0xc84a3a, 0x3a6ac8, 0x4a8a5a, 0xa0603a];
    for (let i = 0; i < 46; i++) {
      const sx = q() < .5 ? -1 : 1, x = sx * (38 + q() * 40), z = -60 + q() * 120, w = 6 + q() * 6, h = 4 + q() * 7, d = 6 + q() * 6;
      box(w, h, d, M(wall[i % 4]), x, h / 2 - 1.3, z);
      const rf = new T.Mesh(new T.ConeGeometry(Math.max(w, d) * .75, 3, 4), M(roofc[i % 4])); rf.position.set(x, h - 1.3 + 1.5, z); rf.rotation.y = Math.PI / 4; decor.add(rf);
    }
    for (const [x, z, r] of [[-160, -220, 90], [120, -260, 110], [0, -320, 120], [-200, 200, 100]]) { const hill = new T.Mesh(new T.ConeGeometry(r, r * .6, 20), M(0x6a9a5a, { roughness: .95 })); hill.position.set(x, r * .3 - 1.3, z); decor.add(hill); }
  }
  // スタート台の光る輪
  for (const t of [1, 2]) {
    const sp = SPAWN[t], ring = new T.Mesh(new T.RingGeometry(2.2, 2.7, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(sp.x, hAt(sp.x, sp.z) + .03, sp.z); ring.userData.team = t; decor.add(ring); spawnRings.push(ring);
  }
  setTeamColors(G.pal[0], G.pal[1]);
}
function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function setTeamColors(a, b) {
  PU.uColA.value.set(a); PU.uColB.value.set(b);
  for (const r of spawnRings) r.material.color.set(r.userData.team === 1 ? a : b);
  document.documentElement.style.setProperty('--cA', a); document.documentElement.style.setProperty('--cB', b);
}
function uploadPaint() {
  if (paintDirty) { paintTex.needsUpdate = true; paintDirty = false; }
  if (wallDirty) { wallTex.needsUpdate = true; wallDirty = false; }
}
// ステージを読みこむ
function loadStage(id) {
  if (!STAGES[id]) id = STAGE_IDS[0];
  STAGE_ID = id; STAGE = STAGES[id];
  const s = STAGE;
  BOXES = [...s.half.boxes.map(b => b.slice()), ...s.half.boxes.map(mirrorBox), ...s.center.boxes.map(b => b.slice())];
  RAMPS = [...s.half.ramps.map(r => r.slice()), ...s.half.ramps.map(mirrorRamp), ...s.center.ramps.map(r => r.slice())];
  GROUND = s.ground; WATER = s.water || [];
  SPAWN = { 1: { x: 0, z: s.spawnZ, yaw: Math.PI }, 2: { x: 0, z: -s.spawnZ, yaw: 0 } };
  SPAWN_ZONE = { 1: s.spawnRect, 2: mirrorRect(s.spawnRect) };
  ZONE = s.zone;
  buildHeight(); buildFaces(); clearPaint(); buildTerrain(); buildDecor(); buildNav(); miniInit(); zoneMarks(false);
}

// ---------- ゾーンの枠（ゾーン争奪のとき） ----------
let zoneGroup = null;
function zoneMarks(on) {
  if (zoneGroup) { world.remove(zoneGroup); zoneGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); }); zoneGroup = null; }
  if (!on || !ZONE) return;
  zoneGroup = new T.Group(); world.add(zoneGroup);
  const [x0, z0, x1, z1] = ZONE, mat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9 });
  const bar = (ax, az, bx, bz) => {
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / .5);
    for (let k = 0; k < n; k += 2) {   // 点線
      const t0 = k / n, t1 = Math.min(1, (k + 1) / n), mx = lerp(ax, bx, (t0 + t1) / 2), mz = lerp(az, bz, (t0 + t1) / 2), h = hAt(mx, mz);
      if (h < -5) continue;
      const m = new T.Mesh(new T.BoxGeometry(Math.abs(bx - ax) > .1 ? (t1 - t0) * Math.abs(bx - ax) : .12, .06, Math.abs(bz - az) > .1 ? (t1 - t0) * Math.abs(bz - az) : .12), mat);
      m.position.set(mx, h + .04, mz); zoneGroup.add(m);
    }
  };
  bar(x0, z0, x1, z0); bar(x1, z0, x1, z1); bar(x1, z1, x0, z1); bar(x0, z1, x0, z0);
  zoneGroup.userData.mat = mat;
}

// ---------- ミニマップ（上から見たぬり。下が自分の陣地） ----------
const MINI = { c: null, g: null, base: null, img: null };
function miniInit() {
  MINI.c = $('mini'); MINI.g = MINI.c.getContext('2d');
  const w = MINI.c.width, h = MINI.c.height;
  MINI.img = MINI.g.createImageData(w, h);
  MINI.base = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = Math.floor(x / w * GW), j = Math.floor(y / h * GD), hh = HG[j * GW + i], o = (y * w + x) * 4;
    if (hh < -5) { MINI.base[o] = 30; MINI.base[o + 1] = 70; MINI.base[o + 2] = 110; }
    else { const l = 70 + hh * 24; MINI.base[o] = l; MINI.base[o + 1] = l; MINI.base[o + 2] = l + 8; }
    MINI.base[o + 3] = 255;
  }
}
const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
function miniDraw(actors, me) {
  if (!MINI.g) return;
  const w = MINI.c.width, h = MINI.c.height, d = MINI.img.data, A = hexRGB(G.pal[0]), B = hexRGB(G.pal[1]);
  d.set(MINI.base);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = PT[Math.floor(y / h * GD) * GW + Math.floor(x / w * GW)];
    if (!p) continue; const o = (y * w + x) * 4, c = p === 1 ? A : B;
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2];
  }
  MINI.g.putImageData(MINI.img, 0, 0);
  const mx = x => (x - X0) / MAPW * w, my = z => (z - Z0) / MAPD * h;
  if (G.mode === 'zone' && ZONE) { MINI.g.strokeStyle = G.zOwner ? teamColor(G.zOwner) : '#fff'; MINI.g.lineWidth = 2; MINI.g.setLineDash([3, 2]); MINI.g.strokeRect(mx(ZONE[0]), my(ZONE[1]), mx(ZONE[2]) - mx(ZONE[0]), my(ZONE[3]) - my(ZONE[1])); MINI.g.setLineDash([]); }
  for (const a of actors) {
    if (a.dead || a.dummy) continue;
    const enemy = a.team !== me.team;
    if (enemy && !(a.markT > 0 || a.revealed) ) continue;
    if (enemy && a.cloakT > 0 && !(a.markT > 0)) continue;
    const x = mx(a.x), y = my(a.z);
    MINI.g.fillStyle = a === me ? '#fff' : teamColor(a.team);
    MINI.g.strokeStyle = '#000'; MINI.g.lineWidth = 1.5;
    MINI.g.beginPath(); MINI.g.arc(x, y, a === me ? 4.5 : 3.5, 0, TAU); MINI.g.fill(); MINI.g.stroke();
    if (a === me) { MINI.g.beginPath(); MINI.g.moveTo(x, y); MINI.g.lineTo(x + Math.sin(a.aimYaw) * 10, y + Math.cos(a.aimYaw) * 10); MINI.g.strokeStyle = '#fff'; MINI.g.lineWidth = 2; MINI.g.stroke(); }
    if (a.sj) { const t = a.sj; MINI.g.strokeStyle = teamColor(a.team); MINI.g.beginPath(); MINI.g.arc(mx(t.tx), my(t.tz), 5, 0, TAU); MINI.g.stroke(); }
  }
}
