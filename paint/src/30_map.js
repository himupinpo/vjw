
// ================= ステージの形（2.5Dの高さの表）・床と壁のぬり =================
// ・床の高さを 0.2m ごとの表で持つ（当たり判定・移動・ぬり・CPUの道さがしが全部この表）
// ・箱の横の面（壁）にもぬれる。壁のぬりは面ごとの小さな表を1枚の画像（アトラス）にまとめて持つ
// ・チームA（自分）は手前 z>0、チームBは奥 z<0。点対称
const CS = 0.2, X0 = -32, Z0 = -50, GW = 320, GD = 500, MAPW = GW * CS, MAPD = GD * CS;
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
// 床にかいた模様（線・道・目印）と、かべぎわの影（ステージを読むたびに作り直す）
const GM_W = 256, GM_H = 400;
const gmapCanvas = document.createElement('canvas'); gmapCanvas.width = GM_W; gmapCanvas.height = GM_H;
const gmapTex = new T.CanvasTexture(gmapCanvas); gmapTex.flipY = false; gmapTex.colorSpace = T.SRGBColorSpace; gmapTex.generateMipmaps = false; gmapTex.minFilter = T.LinearFilter;
const AOD = new Uint8Array(GM_W * GM_H).fill(255);
const aoTex = new T.DataTexture(AOD, GM_W, GM_H, T.RedFormat, T.UnsignedByteType); aoTex.magFilter = aoTex.minFilter = T.LinearFilter; aoTex.needsUpdate = true;
const PU = { uPaint: { value: paintTex }, uPO: { value: new T.Vector2(X0, Z0) }, uPS: { value: new T.Vector2(MAPW, MAPD) },
  uWall: { value: null }, uWS: { value: new T.Vector2(AW, AH) }, uCS: { value: CS },
  uColA: { value: new T.Color('#ff2d87') }, uColB: { value: new T.Color('#1fd1ff') }, uTime: { value: 0 },
  uGMap: { value: gmapTex }, uAO: { value: aoTex }, uStyle: { value: 0 } };
wallTex = makeWallTex(); PU.uWall.value = wallTex;
function paintMaterial(opts) {
  const m = new T.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: .82, metalness: .02 }, opts));
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, PU);
    sh.vertexShader = 'attribute vec4 aFace; attribute vec2 aMat; varying vec4 vFace; varying vec3 vWP; varying vec3 vWN; varying vec2 vMat;\n' + sh.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal); vFace = aFace; vMat = aMat;');
    sh.fragmentShader = SURF_GLSL + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  float pCov = 0.0; vec2 pNC = vec2(0.0); float pRough = 0.82, pMetal = 0.02;
  {
    float riser = step(99.5, vMat.x), mid = vMat.x - riser * 100.0;
    float up = max(smoothstep(0.55, 0.8, vWN.y), riser);
    vec2 pv = vec2(0.0); vec2 nc = vWP.xz;
    diffuseColor.rgb = surf(diffuseColor.rgb, mid, vMat.y, vWP, vWN, step(0.5, up) * (1.0 - riser), pRough, pMetal);
    if (up > 0.5) {
      vec2 guv = (vWP.xz - uPO) / uPS;
      if (mid < 0.5 && riser < 0.5) { vec4 gm = texture2D(uGMap, guv); diffuseColor.rgb = mix(diffuseColor.rgb, gm.rgb, gm.a); }
      if (riser < 0.5) diffuseColor.rgb *= texture2D(uAO, guv).r;
      pv = texture2D(uPaint, guv).rg;
    } else {
      diffuseColor.rgb *= 0.78 + 0.22 * smoothstep(-1.0, 1.6, vWP.y);
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
    pNC = nc;
  }`).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(pRough, 0.16, pCov);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  metalnessFactor = mix(pMetal, 0.02, pCov);')
      // ぬったペンキに厚み：ふちが盛り上がり、表面に小さなでこぼこ（画面上の微分で法線をずらす）
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  {
    float pH = pCov * 0.05 + pCov * (vn(pNC * 9.0) - 0.5) * 0.012;
    vec2 dH = vec2(dFdx(pH), dFdy(pH));
    vec3 sX = dFdx(-vViewPosition), sY = dFdy(-vViewPosition);
    vec3 r1 = cross(sY, normal), r2 = cross(normal, sX);
    float det = dot(sX, r1) * faceDirection;
    if (abs(det) > 1e-9) normal = normalize(abs(det) * normal - sign(det) * (dH.x * r1 + dH.y * r2));
  }`);
  };
  return m;
}
// 素材ごとの見た目（床の板・れんが・コンテナの波板・窓など）。色は頂点の色をもとに、模様だけ足す
const MATI = { ground: 0, cont: 1, conc: 2, wood: 3, bench: 3, hedge: 4, metal: 5, grate: 6, brick: 7, house: 8, stone: 9, bark: 10, plant: 11, glass: 12, spawn: 13, crate: 14, lawn: 15, machine: 16, conv: 17, ac: 18, slide: 19, stall: 20 };
const matId = k => MATI[k] ?? 0;
const SURF_GLSL = `varying vec4 vFace; varying vec3 vWP; varying vec3 vWN; varying vec2 vMat;
uniform sampler2D uPaint; uniform sampler2D uWall; uniform sampler2D uGMap; uniform sampler2D uAO;
uniform vec2 uPO; uniform vec2 uPS; uniform vec2 uWS; uniform float uCS; uniform vec3 uColA; uniform vec3 uColB; uniform float uTime; uniform float uStyle;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ return vn(p) * 0.55 + vn(p * 2.13 + 3.1) * 0.3 + vn(p * 4.7 + 7.7) * 0.15; }
float sl(float v, float s, float w){ float d = (0.5 - abs(fract(v / s) - 0.5)) * s; return 1.0 - smoothstep(w * 0.5, w, d); }
float sq(vec2 p, vec2 s, float w){ return max(sl(p.x, s.x, w), sl(p.y, s.y, w)); }
vec3 hazard(vec2 uv){ return mix(vec3(0.95, 0.74, 0.08), vec3(0.09), step(0.5, fract((uv.x + uv.y) * 1.4))); }
vec3 woodP(vec3 c, float k, float along){
  float row = floor(k / 0.28);
  c *= 0.8 + 0.24 * h21(vec2(row, 3.3));
  c *= 0.86 + 0.18 * vn(vec2(along * 1.4 + row * 9.1, k * 22.0));
  c *= 1.0 - 0.45 * sl(k, 0.28, 0.035);
  c *= 1.0 - 0.32 * sl(along + row * 0.37, 1.7, 0.03);
  return c;
}
vec3 bricks(vec3 c, vec2 uv, vec2 s, vec3 mortar){
  float row = floor(uv.y / s.y); vec2 q = vec2(uv.x + mod(row, 2.0) * s.x * 0.5, uv.y);
  c *= 0.84 + 0.22 * h21(floor(q / s) + 1.7);
  return mix(c, mortar, sq(q, s, 0.025));
}
vec3 panels(vec3 c, vec2 uv){
  vec2 s = vec2(1.0, 0.8), f = fract(uv / s) * s, e = min(f, s - f);
  c *= 0.92 + 0.1 * h21(floor(uv / s));
  c *= 1.0 - 0.35 * sq(uv, s, 0.035);
  c *= 1.0 + 0.3 * step(length(e - vec2(0.09)), 0.024);
  return c;
}
vec3 surf(vec3 c, float id, float topY, vec3 wp, vec3 wn, float upf, inout float rough, inout float metal){
  bool up = upf > 0.5, sx = abs(wn.x) > 0.5;
  vec2 uv = up ? wp.xz : vec2(sx ? wp.z : wp.x, wp.y);
  float n = fbm(uv * 1.7);
  if (id < 0.5) {
    if (up) {
      if (uStyle < 0.5) { c *= 0.92 + 0.14 * h21(floor(uv / 3.0)); c *= 1.0 - 0.28 * sq(uv, vec2(3.0), 0.06); c *= 0.9 + 0.12 * n; c *= 1.0 - 0.2 * smoothstep(0.62, 0.76, fbm(uv * 0.35 + 4.0)); }
      else if (uStyle < 1.5) { c *= 0.93 + 0.1 * h21(floor(uv / 0.6)); c = mix(c, vec3(0.8, 0.79, 0.76), 0.75 * sq(uv, vec2(0.6), 0.04)); c *= 0.95 + 0.06 * n; }
      else if (uStyle < 2.5) {
        vec2 s = vec2(0.5, 0.36); float row = floor(uv.y / s.y); vec2 q = vec2(uv.x + mod(row, 2.0) * 0.25, uv.y);
        vec2 f = (fract(q / s) - 0.5) * s; float e = max(abs(f.x) / (s.x * 0.5), abs(f.y) / (s.y * 0.5));
        c *= 0.84 + 0.22 * h21(floor(q / s) + 3.7); c *= 1.0 - 0.5 * smoothstep(0.7, 0.96, e); c *= 0.92 + 0.08 * n;
      }
      else if (uStyle < 3.5) { c *= 0.8 + 0.34 * fbm(uv * 0.45); c *= 0.9 + 0.14 * vn(uv * 9.0); }
      else { c *= 0.9 + 0.12 * h21(floor(uv / 4.0)); c *= 1.0 - 0.3 * sq(uv, vec2(4.0), 0.05); c *= 0.88 + 0.12 * n; c *= 1.0 - 0.28 * smoothstep(0.6, 0.72, fbm(uv * 0.5 + 9.0)); }
    } else { c = mix(c, vec3(0.45, 0.44, 0.43), 0.65); c = bricks(c, uv, vec2(1.2, 0.5), vec3(0.3)); c *= 0.85 + 0.15 * n; }
  } else if (id < 1.5) {
    if (up) c *= 0.9 + 0.1 * sin(wp.x * 20.0);
    else { c *= 0.8 + 0.2 * (0.5 + 0.5 * sin(uv.x * 22.44)); c *= 1.0 - 0.32 * max(step(topY - 0.14, wp.y), step(wp.y, 0.12)); }
    c *= 0.88 + 0.14 * n; c *= 1.0 - 0.22 * smoothstep(0.6, 0.85, fbm(uv * 1.3 + 5.0)); rough = 0.5; metal = 0.3;
  } else if (id < 2.5) {
    c *= 0.88 + 0.14 * n;
    if (!up && wp.y > topY - 0.3) c = hazard(uv);
    if (up) c *= 1.0 - 0.2 * sq(uv, vec2(2.0), 0.04);
  } else if (id < 3.5) {
    c = up ? woodP(c, wp.z, wp.x) : woodP(c, wp.y, uv.x); rough = 0.75;
  } else if (id < 4.5) {
    c *= 0.6 + 0.7 * fbm(uv * 6.0); c *= 0.85 + 0.22 * vn(uv * 23.0);
    c = mix(c, vec3(1.0, 0.86, 0.93), step(0.985, h21(floor(uv * 9.0))) * 0.85); rough = 0.95;
  } else if (id < 5.5) {
    c = panels(c, uv); rough = 0.45; metal = 0.45;
  } else if (id < 6.5) {
    if (up) { vec2 q = fract(wp.xz * 2.5) - 0.5; float d = step(0.0, q.x * q.y) > 0.5 ? abs(q.x + q.y) : abs(q.x - q.y); c *= 0.82 + 0.28 * step(d, 0.07); }
    else { float tr = max(sl(uv.x - uv.y, 1.2, 0.07), sl(uv.x + uv.y, 1.2, 0.07)); c *= 0.62 + 0.42 * tr; c *= 1.0 - 0.3 * step(topY - 0.12, wp.y); }
    rough = 0.4; metal = 0.6;
  } else if (id < 7.5) {
    if (!up) c = bricks(c, uv, vec2(0.32, 0.14), vec3(0.82, 0.78, 0.72)); else { c *= 0.9 + 0.1 * n; c *= 1.0 - 0.2 * sq(uv, vec2(0.5), 0.03); }
  } else if (id < 8.5) {
    if (!up) {
      c *= 0.93 + 0.08 * n;
      float cx = fract(uv.x / 2.2), ht = min(topY - 0.35, 2.1);
      float outer = step(0.25, cx) * step(cx, 0.75) * step(0.95, wp.y) * step(wp.y, ht);
      float inner = step(0.3, cx) * step(cx, 0.7) * step(1.0, wp.y) * step(wp.y, ht - 0.05);
      inner *= 1.0 - step(abs(cx - 0.5), 0.012);
      vec3 glass = vec3(0.22, 0.34, 0.48) + 0.16 * vn(uv * 3.0);
      c = mix(c, vec3(0.96), clamp(outer - inner, 0.0, 1.0)); c = mix(c, glass, inner);
      rough = mix(0.8, 0.12, inner);
      c *= 1.0 - 0.18 * step(wp.y, 0.25);
    } else { c *= 0.9 + 0.1 * n; c *= 1.0 - 0.25 * sl(wp.z, 0.35, 0.04); }
  } else if (id < 9.5) {
    vec2 s = up ? vec2(0.9, 0.9) : vec2(0.9, 0.45); float row = floor(uv.y / s.y); vec2 q = vec2(uv.x + mod(row, 2.0) * s.x * 0.5, uv.y);
    c *= 0.84 + 0.22 * h21(floor(q / s)); c *= 1.0 - 0.42 * sq(q, s, 0.045); c *= 0.9 + 0.12 * n;
  } else if (id < 10.5) {
    c *= 0.68 + 0.5 * vn(vec2(uv.x * 9.0, uv.y * 1.1)); c *= 0.85 + 0.2 * n; rough = 0.95;
  } else if (id < 11.5) {
    if (up) { c = vec3(0.3, 0.2, 0.12) * (0.75 + 0.45 * fbm(uv * 5.0)); c = mix(c, vec3(0.32, 0.6, 0.24), step(0.9, h21(floor(uv * 14.0))) * 0.85); rough = 0.95; }
    else c = woodP(c, wp.y, uv.x);
  } else if (id < 12.5) {
    if (!up) {
      float fr = max(sl(uv.x, 1.0, 0.06), sl(wp.y - 0.1, 1.2, 0.06));
      vec3 gl = vec3(0.5, 0.72, 0.84) * (0.85 + 0.2 * vn(uv * 2.0 + uTime * 0.05));
      c = mix(gl, vec3(0.95), fr); if (wp.y < 0.3) c = vec3(0.88); rough = mix(0.06, 0.5, fr); metal = 0.1;
    } else { c *= 0.92 + 0.1 * n; c *= 1.0 - 0.25 * sq(uv, vec2(1.0), 0.04); }
  } else if (id < 13.5) {
    vec3 tc = wp.z > 0.0 ? uColA : uColB;
    if (!up) { c = panels(c, uv); if (wp.y > topY - 0.22) c = tc; }
    else { vec2 q = fract(wp.xz * 3.0) - 0.5; c *= 1.0 - 0.18 * step(length(q), 0.12); c *= 1.0 - 0.25 * sq(uv, vec2(2.0), 0.04); }
    rough = 0.45; metal = 0.35;
  } else if (id < 14.5) {
    vec2 s = vec2(0.8), f = fract(uv / s) * s - s * 0.5;
    float fr = max(sq(uv, s, 0.11), max(step(abs(f.x - f.y), 0.06), step(abs(f.x + f.y), 0.06)) * (1.0 - float(up)));
    c = woodP(c, up ? wp.z : wp.y, up ? wp.x : uv.x); c = mix(c, c * 0.72, fr); rough = 0.8;
  } else if (id < 15.5) {
    if (up) { c *= 0.8 + 0.34 * fbm(uv * 0.6); c *= 0.9 + 0.14 * vn(uv * 9.0); c = mix(c, vec3(1.0, 0.95, 0.6), step(0.988, h21(floor(uv * 8.0))) * 0.8); rough = 0.95; }
    else { c = mix(c, vec3(0.5, 0.47, 0.42), 0.7); vec2 s = vec2(0.9, 0.45); float row = floor(uv.y / s.y); vec2 q = vec2(uv.x + mod(row, 2.0) * 0.45, uv.y); c *= 0.84 + 0.22 * h21(floor(q / s)); c *= 1.0 - 0.42 * sq(q, s, 0.045); }
  } else if (id < 16.5) {
    c = panels(c, uv); rough = 0.45; metal = 0.45;
    if (!up) {
      float vent = step(0.62, h21(floor(uv / vec2(1.0, 0.8)) + 5.0)) * sl(uv.y, 0.12, 0.035) * step(0.2, fract(uv.x)) * step(fract(uv.x), 0.8);
      c *= 1.0 - 0.5 * vent;
      if (wp.y < 0.32) c = hazard(uv);
    }
  } else if (id < 17.5) {
    if (up) { float dir = wp.x > 0.0 ? -1.0 : 1.0; float v = fract((wp.x * dir - uTime * 0.9) * 1.1 + abs(wp.z) * 0.7); c = mix(vec3(0.1, 0.1, 0.11), vec3(0.9, 0.72, 0.12), step(0.72, v) * step(abs(wp.z), 0.8)); rough = 0.85; }
    else { c = panels(c, uv); c *= 1.0 - 0.4 * step(topY - 0.18, wp.y); rough = 0.45; metal = 0.5; }
  } else if (id < 18.5) {
    c = panels(c, uv);
    if (!up && wp.y > 0.5 && wp.y < topY - 0.3) c *= 0.8 + 0.3 * step(0.5, fract(wp.y * 7.0));
    rough = 0.5; metal = 0.3;
  } else if (id < 19.5) {
    c *= 0.96 + 0.06 * n; rough = 0.2;
  } else {
    if (!up) { vec3 wd = vec3(0.72, 0.56, 0.38); wd = woodP(wd, uv.x * 0.35 + 7.0, wp.y); c = wp.y > topY - 0.45 ? c * (0.9 + 0.1 * n) : wd; }
    else c = woodP(vec3(0.7, 0.55, 0.38), wp.z, wp.x);
    rough = 0.7;
  }
  return c;
}
`;
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
  const P = [], N = [], C = [], F = [], MA = [], col = new T.Color(), NOF = [-1, -1, 0, 0];
  let mid = 0, top = 0;   // 素材の番号と、その箱のてっぺんの高さ（模様のために頂点へ入れる）
  const nrm = (a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; return [nx / l, ny / l, nz / l]; };
  const tri = (a, b, c, n, fc) => { for (const v of [a, b, c]) { P.push(v[0], v[1], v[2]); N.push(n[0], n[1], n[2]); C.push(col.r, col.g, col.b); F.push(fc[0], fc[1], fc[2], fc[3]); MA.push(mid, top); } };
  const quad = (a, b, c, d, fc) => { const n = nrm(a, b, c); if (!(Math.abs(n[0]) + Math.abs(n[1]) + Math.abs(n[2]))) return; tri(a, b, c, n, fc); tri(a, c, d, n, fc); };
  const fa = f => f ? [f.ax, f.ay, f.a0, f.y0] : NOF;
  const boxGeo = (x0, z0, x1, z1, h, lo, faces) => {
    quad([x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0], NOF);
    quad([x0, lo, z0], [x0, lo, z1], [x0, h, z1], [x0, h, z0], fa(faces && faces.xm));
    quad([x1, lo, z1], [x1, lo, z0], [x1, h, z0], [x1, h, z1], fa(faces && faces.xp));
    quad([x1, lo, z0], [x0, lo, z0], [x0, h, z0], [x1, h, z0], fa(faces && faces.zm));
    quad([x0, lo, z1], [x1, lo, z1], [x1, h, z1], [x0, h, z1], fa(faces && faces.zp));
  };
  // 地面（橋の上は板）
  const bridges = STAGE.bridges || [];
  for (const r of groundPieces()) {
    const br = bridges.some(b => r[0] >= b[0] - .01 && r[2] <= b[2] + .01 && r[1] >= b[1] - .01 && r[3] <= b[3] + .01);
    col.setHex(br ? 0x9a7650 : STAGE.groundCol); mid = br ? MATI.wood : 0; top = 0;
    boxGeo(r[0], r[1], r[2], r[3], 0, -2, null);
  }
  for (const b of BOXES) { col.setHex(b[5]); mid = matId(b[6]); top = b[4]; boxGeo(b[0], b[1], b[2], b[3], b[4], -1, b.faces); }
  for (const r of RAMPS) {
    col.setHex(r[7]); mid = matId(r[8]); top = Math.max(r[4], r[5]);
    const [x0, z0, x1, z1] = r, y = (x, z) => rampH(r, x, z), lo = -1;
    if (r[9]) {
      // 階段：見た目だけ段にする（当たりはなめらかな坂のまま）。段の立ち上がりにも床のペンキを写す
      const ax = r[6], n = Math.max(2, Math.round(Math.abs(r[5] - r[4]) / .24));
      const at = u => ax === 'x' ? lerp(x0, x1, u) : lerp(z0, z1, u);
      const hs = []; for (let i = 0; i < n; i++) hs.push(lerp(r[4], r[5], (i + .5) / n));
      for (let i = 0; i < n; i++) {
        const a = at(i / n), b = at((i + 1) / n), h = hs[i];
        if (ax === 'x') quad([a, h, z0], [a, h, z1], [b, h, z1], [b, h, z0], NOF); else quad([x0, h, a], [x0, h, b], [x1, h, b], [x1, h, a], NOF);
        // 横の板（段の形）
        if (ax === 'x') { quad([a, lo, z0], [b, lo, z0], [b, h, z0], [a, h, z0], NOF); quad([b, lo, z1], [a, lo, z1], [a, h, z1], [b, h, z1], NOF); }
        else { quad([x0, lo, a], [x0, lo, b], [x0, h, b], [x0, h, a], NOF); quad([x1, lo, b], [x1, lo, a], [x1, h, a], [x1, h, b], NOF); }
        // 立ち上がり（ひとつ前の段との間）
        const prev = i === 0 ? r[4] : hs[i - 1];
        if (Math.abs(prev - h) > .01) {
          const m0 = mid; mid = m0 + 100;
          const yl = Math.min(prev, h), yh = Math.max(prev, h);
          if (ax === 'x') quad([a, yl, z0], [a, yl, z1], [a, yh, z1], [a, yh, z0], NOF); else quad([x0, yl, a], [x1, yl, a], [x1, yh, a], [x0, yh, a], NOF);
          mid = m0;
        }
      }
      // 低いほうの端（地面まで）と高いほうの端
      const e0 = at(0), e1 = at(1), hLo = Math.min(r[4], hs[0]), hHi = Math.max(r[5], hs[n - 1]);
      if (ax === 'x') { quad([e0, lo, z0], [e0, lo, z1], [e0, hLo, z1], [e0, hLo, z0], NOF); quad([e1, lo, z1], [e1, lo, z0], [e1, hHi, z0], [e1, hHi, z1], NOF); }
      else { quad([x1, lo, e0], [x0, lo, e0], [x0, hLo, e0], [x1, hLo, e0], NOF); quad([x0, lo, e1], [x1, lo, e1], [x1, hHi, e1], [x0, hHi, e1], NOF); }
      continue;
    }
    quad([x0, y(x0, z0), z0], [x0, y(x0, z1), z1], [x1, y(x1, z1), z1], [x1, y(x1, z0), z0], NOF);
    quad([x0, lo, z0], [x0, lo, z1], [x0, y(x0, z1), z1], [x0, y(x0, z0), z0], NOF);
    quad([x1, lo, z1], [x1, lo, z0], [x1, y(x1, z0), z0], [x1, y(x1, z1), z1], NOF);
    quad([x1, lo, z0], [x0, lo, z0], [x0, y(x0, z0), z0], [x1, y(x1, z0), z0], NOF);
    quad([x0, lo, z1], [x1, lo, z1], [x1, y(x1, z1), z1], [x0, y(x0, z1), z1], NOF);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(C, 3)); g.setAttribute('aFace', new T.Float32BufferAttribute(F, 4)); g.setAttribute('aMat', new T.Float32BufferAttribute(MA, 2));
  g.computeBoundingSphere();
  terrainMesh = new T.Mesh(g, terrainMat); terrainMesh.receiveShadow = true; terrainMesh.castShadow = true;
  world.add(terrainMesh);
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
  buildHeight(); buildFaces(); clearPaint(); buildTerrain(); buildGroundMaps(); buildDecor(); buildNav(); miniInit(); zoneMarks(false);
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
  if (G.mode === 'flag' || G.mode === 'ball') rulesMini(MINI.g, mx, my);
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
