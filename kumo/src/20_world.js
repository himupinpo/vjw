// ================= 当たり（足場）と、見た目のまとめ =================
// 当たり：t=0 箱（どの向きにも回せる） / t=1 たての円柱 / t=2 カプセル（横たわる棒など）
const COLS = [], MOVCOLS = [], HASH = new Map(), HC = 6;
let QID = 0;
const hk = (i, j, k) => (i + 512) * 1048576 + (j + 64) * 1024 + (k + 512);
function hashAdd(c) {
  const a = c.bb;
  for (let i = Math.floor(a[0] / HC); i <= Math.floor(a[3] / HC); i++) for (let j = Math.floor(a[1] / HC); j <= Math.floor(a[4] / HC); j++) for (let k = Math.floor(a[2] / HC); k <= Math.floor(a[5] / HC); k++) {
    const key = hk(i, j, k); let l = HASH.get(key); if (!l) HASH.set(key, l = []); l.push(c);
  }
}
function queryBox(x0, y0, z0, x1, y1, z1, out) {
  QID++; out.length = 0;
  for (let i = Math.floor(x0 / HC); i <= Math.floor(x1 / HC); i++) for (let j = Math.floor(y0 / HC); j <= Math.floor(y1 / HC); j++) for (let k = Math.floor(z0 / HC); k <= Math.floor(z1 / HC); k++) {
    const l = HASH.get(hk(i, j, k)); if (!l) continue;
    for (const c of l) { if (c.q === QID) continue; c.q = QID; const b = c.bb; if (b[0] <= x1 && b[3] >= x0 && b[1] <= y1 && b[4] >= y0 && b[2] <= z1 && b[5] >= z0) out.push(c); }
  }
  for (const c of MOVCOLS) { const b = c.bb; if (b[0] <= x1 && b[3] >= x0 && b[1] <= y1 && b[4] >= y0 && b[2] <= z1 && b[5] >= z0) out.push(c); }
  return out;
}
function setBoxBB(c) {
  const [hx, hy, hz] = c.h, R = c.R, [x, y, z] = c.c;
  const ex = Math.abs(R[0]) * hx + Math.abs(R[3]) * hy + Math.abs(R[6]) * hz, ey = Math.abs(R[1]) * hx + Math.abs(R[4]) * hy + Math.abs(R[7]) * hz, ez = Math.abs(R[2]) * hx + Math.abs(R[5]) * hy + Math.abs(R[8]) * hz;
  c.bb = [x - ex, y - ey, z - ez, x + ex, y + ey, z + ez]; c.top = c.bb[4]; c.flat = R[4] > .985;
}
const _eu = new T.Euler(), _mr = new T.Matrix4();
function rotArr(yaw, pitch, roll) { _eu.set(pitch, yaw, roll, 'YXZ'); _mr.makeRotationFromEuler(_eu); const e = _mr.elements; return [e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]]; }
function cBox(x, y, z, sx, sy, sz, yaw = 0, pitch = 0, roll = 0, kind = 'plain') { const c = { t: 0, c: [x, y, z], h: [sx / 2, sy / 2, sz / 2], R: rotArr(yaw, pitch, roll), kind }; setBoxBB(c); return c; }
function cCyl(x, y0, z, r, h, kind = 'plain') { const c = { t: 1, c: [x, y0, z], y1: y0 + h, r, kind, flat: true }; c.bb = [x - r, y0, z - r, x + r, y0 + h, z + r]; c.top = y0 + h; return c; }
function cCap(ax, ay, az, bx, by, bz, r, kind = 'plain') { const c = { t: 2, a: [ax, ay, az], b: [bx, by, bz], r, kind }; c.bb = [Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.min(az, bz) - r, Math.max(ax, bx) + r, Math.max(ay, by) + r, Math.max(az, bz) + r]; c.top = c.bb[4]; return c; }
// 球（中心 p、半径 r）がめりこんでいたら、押し出す向きと量を out に入れて true
function pushSphere(c, px, py, pz, r, out) {
  if (c.t === 0) {
    const R = c.R, dx = px - c.c[0], dy = py - c.c[1], dz = pz - c.c[2];
    const lx = dx * R[0] + dy * R[1] + dz * R[2], ly = dx * R[3] + dy * R[4] + dz * R[5], lz = dx * R[6] + dy * R[7] + dz * R[8];
    const hx = c.h[0], hy = c.h[1], hz = c.h[2];
    const qx = clamp(lx, -hx, hx), qy = clamp(ly, -hy, hy), qz = clamp(lz, -hz, hz);
    let nx = lx - qx, ny = ly - qy, nz = lz - qz; const d2 = nx * nx + ny * ny + nz * nz;
    if (d2 > 1e-12) { if (d2 >= r * r) return false; const d = Math.sqrt(d2), k = (r - d) / d; nx *= k; ny *= k; nz *= k; }
    else {
      const ax = hx - Math.abs(lx), ay = hy - Math.abs(ly), az = hz - Math.abs(lz);
      if (ay <= ax && ay <= az) { nx = 0; ny = (ly >= 0 ? 1 : -1) * (ay + r); nz = 0; } else if (ax <= az) { nx = (lx >= 0 ? 1 : -1) * (ax + r); ny = nz = 0; } else { nz = (lz >= 0 ? 1 : -1) * (az + r); nx = ny = 0; }
    }
    out.x = nx * R[0] + ny * R[3] + nz * R[6]; out.y = nx * R[1] + ny * R[4] + nz * R[7]; out.z = nx * R[2] + ny * R[5] + nz * R[8];
    return true;
  }
  if (c.t === 1) {
    const dx = px - c.c[0], dz = pz - c.c[2], rho = Math.hypot(dx, dz), y0 = c.c[1], y1 = c.y1, R0 = c.r;
    if (rho > R0) {
      const qx = c.c[0] + dx / rho * R0, qz = c.c[2] + dz / rho * R0, qy = clamp(py, y0, y1);
      const nx = px - qx, ny = py - qy, nz = pz - qz, d2 = nx * nx + ny * ny + nz * nz; if (d2 >= r * r) return false;
      const d = Math.sqrt(d2) || 1e-6, k = (r - d) / d; out.x = nx * k; out.y = ny * k; out.z = nz * k; return true;
    }
    if (py > y1) { if (py - y1 >= r) return false; out.x = 0; out.y = r - (py - y1); out.z = 0; return true; }
    if (py < y0) { if (y0 - py >= r) return false; out.x = 0; out.y = -(r - (y0 - py)); out.z = 0; return true; }
    const top = y1 - py, bot = py - y0, side = R0 - rho;
    if (top <= bot && top <= side) { out.x = 0; out.y = top + r; out.z = 0; }
    else if (bot <= side) { out.x = 0; out.y = -(bot + r); out.z = 0; }
    else { const ux = rho > 1e-6 ? dx / rho : 1, uz = rho > 1e-6 ? dz / rho : 0; out.x = ux * (side + r); out.y = 0; out.z = uz * (side + r); }
    return true;
  }
  const ax = c.a[0], ay = c.a[1], az = c.a[2], bx = c.b[0] - ax, by = c.b[1] - ay, bz = c.b[2] - az;
  const t = clamp(((px - ax) * bx + (py - ay) * by + (pz - az) * bz) / (bx * bx + by * by + bz * bz), 0, 1);
  const nx = px - (ax + bx * t), ny = py - (ay + by * t), nz = pz - (az + bz * t), d2 = nx * nx + ny * ny + nz * nz, RR = r + c.r;
  if (d2 >= RR * RR) return false;
  const d = Math.sqrt(d2); if (d < 1e-6) { out.x = 0; out.y = RR; out.z = 0; return true; }
  const k = (RR - d) / d; out.x = nx * k; out.y = ny * k; out.z = nz * k; return true;
}

// ---------- 見た目：同じ素材をまとめて、少ない数の大きな形にする ----------
const BUCKETS = new Map();
let STAGE = null;   // 置けるかためしている物（置けなければ捨てる）
const _col = new T.Color(), _E2 = new T.Euler(), _Q2 = new T.Quaternion(), _P2 = new T.Vector3(), _S2 = new T.Vector3(1, 1, 1), _M2 = new T.Matrix4();
function place(geo, x, y, z, yaw = 0, pitch = 0, roll = 0) { _E2.set(pitch, yaw, roll, 'YXZ'); _Q2.setFromEuler(_E2); _M2.compose(_P2.set(x, y, z), _Q2, _S2); geo.applyMatrix4(_M2); return geo; }
function addG(geo, mat, hex) {
  const n = geo.attributes.position.count, a = new Float32Array(n * 3); _col.set(hex);
  for (let i = 0; i < n; i++) { a[i * 3] = _col.r; a[i * 3 + 1] = _col.g; a[i * 3 + 2] = _col.b; }
  geo.setAttribute('color', new T.BufferAttribute(a, 3));
  if (geo.index === null) geo.setIndex([...Array(n).keys()]);
  for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) geo.deleteAttribute(k);
  geo.clearGroups();
  if (STAGE) STAGE.geos.push({ geo, mat }); else bucketAdd({ geo, mat });
}
function addC(c) { if (STAGE) STAGE.cols.push(c); else { COLS.push(c); hashAdd(c); } return c; }
function bucketAdd(o) {
  o.geo.computeBoundingBox(); const b = o.geo.boundingBox, slab = Math.floor((b.min.y + b.max.y) / 2 / 40), key = o.mat + '|' + slab;
  let l = BUCKETS.get(key); if (!l) BUCKETS.set(key, l = []); l.push(o.geo);
}
// 長さに合わせて模様が伸びないように、面ごとに uv をかける
function boxGeo(sx, sy, sz, tile = 1) {
  const g = new T.BoxGeometry(sx, sy, sz), uv = g.attributes.uv, d = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * d[f][0] / tile, uv.getY(i) * d[f][1] / tile); }
  return g;
}
function cylGeo(rt, rb, h, seg = 16, tile = 1, open = false) {
  const g = new T.CylinderGeometry(rt, rb, h, seg, 1, open), uv = g.attributes.uv, nSide = (seg + 1) * 2, c = Math.PI * (rt + rb);
  for (let i = 0; i < uv.count; i++) { if (i < nSide) uv.setXY(i, uv.getX(i) * c / tile, uv.getY(i) * h / tile); else uv.setXY(i, uv.getX(i) * rt * 2 / tile, uv.getY(i) * rt * 2 / tile); }
  return g;
}
// よく使う形（見た目＋当たり）
function sBox(x, yTop, z, sx, sy, sz, yaw, mat, hex, tile = 1, kind) { addG(place(boxGeo(sx, sy, sz, tile), x, yTop - sy / 2, z, yaw), mat, hex); return addC(cBox(x, yTop - sy / 2, z, sx, sy, sz, yaw, 0, 0, kind || mat)); }
function sCyl(x, yTop, z, r, h, mat, hex, seg = 18, tile = 1, kind) { addG(place(cylGeo(r, r, h, seg, tile), x, yTop - h / 2, z), mat, hex); return addC(cCyl(x, yTop - h, z, r, h, kind || mat)); }
function dBox(x, y, z, sx, sy, sz, yaw, mat, hex, tile = 1, pitch = 0, roll = 0) { addG(place(boxGeo(sx, sy, sz, tile), x, y, z, yaw, pitch, roll), mat, hex); }
function dCyl(x, y, z, rt, rb, h, mat, hex, seg = 14, yaw = 0, pitch = 0, roll = 0) { addG(place(cylGeo(rt, rb, h, seg), x, y, z, yaw, pitch, roll), mat, hex); }
function dSph(x, y, z, r, mat, hex, sy = 1) { const g = new T.SphereGeometry(r, 12, 8); g.scale(1, sy, 1); addG(place(g, x, y, z), mat, hex); }
// 横たわる棒（鉛筆・パイプ・丸太）：a から b、半径 r
function sRod(ax, ay, az, bx, by, bz, r, mat, hex, seg = 12) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz), yaw = Math.atan2(dx, dz), pitch = -Math.asin(dy / L);
  const g = cylGeo(r, r, L, seg); g.rotateX(Math.PI / 2); addG(place(g, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, yaw, pitch), mat, hex);
  return addC(cCap(ax, ay, az, bx, by, bz, r, mat));
}

// ================= ゾーン（高さで7つ） =================
const ZH = 80;
const ZONES = [
  { id: 'port', name: 'みなとの倉庫', sub: 'HARBOR', y0: 0, gap: [.8, 2.0], rise: [.35, .95], deco: 1 },
  { id: 'garden', name: '空の庭', sub: 'SKY GARDEN', y0: ZH, gap: [1.0, 2.4], rise: [.4, 1.0], deco: 1 },
  { id: 'rail', name: '雲の鉄道', sub: 'CLOUD RAILWAY', y0: ZH * 2, gap: [1.1, 2.7], rise: [.4, 1.05], deco: .9 },
  { id: 'stat', name: 'ぶんぼうぐの嵐', sub: 'STATIONERY STORM', y0: ZH * 3, gap: [1.2, 2.9], rise: [.45, 1.1], deco: .9 },
  { id: 'temple', name: '雲の神殿', sub: 'CLOUD TEMPLE', y0: ZH * 4, gap: [1.3, 3.0], rise: [.45, 1.1], deco: .8 },
  { id: 'gear', name: '歯車の塔', sub: 'GEAR TOWER', y0: ZH * 5, gap: [1.4, 3.1], rise: [.45, 1.12], deco: .8 },
  { id: 'star', name: '星のてっぺん', sub: 'STARRY SUMMIT', y0: ZH * 6, gap: [1.4, 3.2], rise: [.45, 1.12], deco: .7 }
];
ZONES.forEach((z, i) => { z.y1 = z.y0 + ZH; z.i = i; });
const SUMMIT_Y = ZH * 7 + 2;
const zoneAt = y => ZONES[clamp(Math.floor(y / ZH), 0, ZONES.length - 1)];

// ---------- ゾーンごとの物（足場になる物） ----------
const PAL = {
  box: [0xc84a3a, 0x2f6fb8, 0x2f9e6b, 0xe08a2a, 0x7a52b0, 0xd8b42c, 0x2a8a9a],
  drum: [0x3a6ec8, 0xd64532, 0x3aa35a, 0xe2b33a],
  book: [0xd64545, 0x3a7ad8, 0x2fae6a, 0xe8a52a, 0x8a5ad0, 0xe05a9a, 0x3ab0b0],
  car: [0x3a6ec8, 0xe05a3a, 0x2f9e6b, 0xf2c230, 0xe8e8e8],
  crys: [0x7ad8ff, 0xc08aff, 0xff9ae0, 0x9affd0, 0xfff08a]
};
// 置く物：{ w: 出やすさ, size: 上の面の半分の大きさ [hx, hz], make(x, yTop, z, hx, hz, yaw, r) }
const KIT = {
  port: [
    { w: 3, size: r => [1.2, 3.0], make(x, y, z, hx, hz, yaw, r) { const c = pick(r, PAL.box); sBox(x, y, z, 2.4, 2.6, 6, yaw, 'metal', c, 1.3);
        const fx = Math.sin(yaw), fz = Math.cos(yaw); dBox(x + fx * 3.01, y - 1.3, z + fz * 3.01, 2.2, 2.4, .05, yaw, 'plain', shade(c, .75)); } },
    { w: 3, size: r => { const s = .6 + r() * .35; return [s, s]; }, make(x, y, z, hx, hz, yaw, r) { const s = hx * 2, n = 1 + (r() * 2 | 0);
        for (let i = 0; i < n; i++) sBox(x, y - i * s, z, s, s, s, yaw + i * .3, 'wood', 0xc49a62, .6); } },
    { w: 2, size: r => [.5, .5], make(x, y, z, hx, hz, yaw, r) { const n = 1 + (r() * 3 | 0), c = pick(r, PAL.drum); for (let i = 0; i < n; i++) { sCyl(x, y - i * 1.02, z, .5, 1.0, 'metal', c, 16); dCyl(x, y - i * 1.02 - .3, z, .51, .51, .06, 'plain', shade(c, .7)); } } },
    { w: 1.5, size: r => [.9, .7], make(x, y, z, hx, hz, yaw, r) { for (let i = 0; i < 4; i++) sBox(x, y - i * .32, z, 1.8, .14, 1.4, yaw, 'wood', 0xb8875a, .5); dBox(x, y - .7, z, 1.6, .9, 1.2, yaw, 'plain', 0x8a9aa8); } },
    { w: 1, size: r => [.35, 2.6], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, .7, .16, 5.2, yaw, 'metal', 0xe0a030, 1); dBox(x, y - .32, z, .14, .5, 5.2, yaw, 'metal', 0xe0a030); dBox(x, y - .6, z, .7, .12, 5.2, yaw, 'metal', 0xc08a28); addC(cBox(x, y - .4, z, .7, .6, 5.2, yaw, 0, 0, 'metal')); } }
  ],
  garden: [
    { w: 3, size: r => { const s = 1.3 + r() * 1.4; return [s * .72, s * .72]; }, make(x, y, z, hx, hz, yaw, r) { const R = hx / .72; sCyl(x, y, z, R, .5, 'grass', 0x6cc24a, 20, 1.2); addG(place(cylGeo(R * .95, R * .25, R * 1.4, 10), x, y - .5 - R * .7, z), 'stone', 0x8a6a48); addC(cCyl(x, y - .5 - R * .9, z, R * .5, R * .9, 'stone'));
        if (r() < .5) { const a = r() * TAU, d = R * .55; dCyl(x + Math.cos(a) * d, y + .6, z + Math.sin(a) * d, .12, .16, 1.2, 'wood', 0x7a5232); dSph(x + Math.cos(a) * d, y + 1.6, z + Math.sin(a) * d, .7, 'grass', 0x4f9e3a); } } },
    { w: 2, size: r => { const s = .55 + r() * .3; return [s * .72, s * .72]; }, make(x, y, z, hx, hz, yaw, r) { const R = hx / .72; sCyl(x, y, z, R, 1.0, 'plain', 0xc8643c, 16); dCyl(x, y + .02, z, R * .9, R * .9, .05, 'grass', 0x5a3a24);
        for (let i = 0; i < 3; i++) { const a = r() * TAU; dSph(x + Math.cos(a) * R * .75, y + .25, z + Math.sin(a) * R * .75, .16, 'plain', pick(r, [0xff6a8a, 0xffd23f, 0xffffff, 0xb08aff])); } } },
    { w: 2, size: r => { const s = 1.0 + r() * .7; return [s * .72, s * .72]; }, make(x, y, z, hx, hz, yaw, r) { const R = hx / .72; sCyl(x, y, z, R, .5, 'plain', pick(r, [0xe04a4a, 0xe0a03a, 0xb070e0]), 20);
        for (let i = 0; i < 5; i++) { const a = r() * TAU, d = r() * R * .7; dSph(x + Math.cos(a) * d, y + .01, z + Math.sin(a) * d, .14, 'plain', 0xffffff, .3); } sCyl(x, y - .5, z, .3, 2.2, 'plain', 0xf2e6c8, 12); } },
    { w: 1.5, size: r => [.9, .45], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 1.8, .12, .9, yaw, 'wood', 0xa8784a, .5); const fx = Math.cos(yaw) * .75, fz = -Math.sin(yaw) * .75; for (const s of [-1, 1]) dBox(x + fx * s, y - .5, z + fz * s, .1, .9, .8, yaw, 'metal', 0x3a4a3a); addC(cBox(x, y - .5, z, 1.6, .9, .8, yaw, 0, 0, 'wood')); } },
    { w: 1.5, size: r => { const s = .7 + r() * .4; return [s, s * .8]; }, make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, hx * 2, 1.0, hz * 2, yaw, 'grass', 0x3f8f3a, .8); } }
  ],
  rail: [
    { w: 3, size: r => [.7, 2.2 + r() * 1.6], make(x, y, z, hx, hz, yaw, r) { const L = hz * 2; sBox(x, y - .1, z, 1.4, .4, L, yaw, 'stone', 0x7a6a5a, 1); const fx = Math.cos(yaw), fz = -Math.sin(yaw);
        for (const s of [-.45, .45]) dBox(x + fx * s, y + .04, z + fz * s, .1, .12, L, yaw, 'metal', 0xc0c4cc);
        for (let t = -L / 2 + .3; t < L / 2; t += .7) dBox(x + Math.sin(yaw) * t, y - .02, z + Math.cos(yaw) * t, 1.6, .08, .25, yaw, 'wood', 0x5a3a28); } },
    { w: 2, size: r => [1.3, 3.5], make(x, y, z, hx, hz, yaw, r) { const c = pick(r, PAL.car); sBox(x, y, z, 2.6, 2.6, 7, yaw, 'plain', c, 1); const fx = Math.cos(yaw), fz = -Math.sin(yaw);
        for (const s of [-1.31, 1.31]) for (let t = -2.6; t <= 2.6; t += 1.3) dBox(x + fx * s + Math.sin(yaw) * t, y - .9, z + fz * s + Math.cos(yaw) * t, .04, .7, .9, yaw, 'shiny', 0x2a3a50);
        dBox(x, y - 2.5, z, 2.2, .3, 6.6, yaw, 'metal', 0x3a3a40); } },
    { w: 1.5, size: r => [.9, .9], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 1.8, .25, 1.8, yaw, 'metal', 0xc03a3a, .8); dBox(x, y - 1.2, z, .25, 2.2, .25, yaw, 'metal', 0x8a2a2a); addC(cBox(x, y - 1.2, z, .25, 2.2, .25, yaw, 0, 0, 'metal')); } },
    { w: 1.5, size: r => [1.5, 1.5], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 3, .5, 3, yaw, 'stone', 0xd8cfc0, 1); dBox(x, y + .02, z, 2.6, .02, .12, yaw, 'plain', 0xf2d23a); dBox(x, y - 1.6, z, 1.2, 2.6, 1.2, yaw, 'stone', 0xb0a698); } },
    { w: 1, size: r => [.5, .5], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 1, .3, 1, yaw, 'metal', 0x4a4f5a); dCyl(x, y - 1.5, z, .08, .08, 2.8, 'metal', 0x3a3a40); dBox(x, y + .55, z, .5, .8, .3, yaw, 'plain', 0x222428); dSph(x, y + .75, z + .16, .1, 'glow', 0xff4a3a); } }
  ],
  stat: [
    { w: 3, size: r => [.85 + r() * .3, 1.15 + r() * .35], make(x, y, z, hx, hz, yaw, r) { const n = 1 + (r() * 3 | 0); let yy = y;
        for (let i = 0; i < n; i++) { const th = .3 + r() * .3, c = pick(r, PAL.book), w = hx * 2 * (1 + i * .05), d = hz * 2 * (1 + i * .05), yw = yaw + (r() - .5) * .3 * (i > 0 ? 1 : 0);
          sBox(x, yy, z, w, th, d, yw, 'plain', c, 1); dBox(x + Math.cos(yw) * .04, yy - th / 2, z - Math.sin(yw) * .04, w - .1, th - .08, d - .04, yw, 'paper', 0xf6f2e6, .5); yy -= th; } } },
    { w: 2, size: r => [.26, 2.0], make(x, y, z, hx, hz, yaw, r) { const L = hz * 2, fx = Math.sin(yaw) * L / 2, fz = Math.cos(yaw) * L / 2, cy = y - .26;
        const g = cylGeo(.3, .3, L * .82, 6); g.rotateX(Math.PI / 2); addG(place(g, x - fx * .18, cy, z - fz * .18, yaw), 'plain', 0xf2c230);
        const tip = new T.ConeGeometry(.3, L * .18, 6); tip.rotateX(Math.PI / 2); addG(place(tip, x + fx * .82, cy, z + fz * .82, yaw), 'wood', 0xe8c8a0);
        const er = cylGeo(.3, .3, .35, 12); er.rotateX(Math.PI / 2); addG(place(er, x - fx * 1.02, cy, z - fz * 1.02, yaw), 'plain', 0xf08aa0);
        addC(cCap(x - fx, cy, z - fz, x + fx * .9, cy, z + fz * .9, .3, 'wood')); } },
    { w: 1.5, size: r => [.4, 2.6], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, .8, .12, 5.2, yaw, 'paper', 0xe8e2c8, .5); } },
    { w: 1.5, size: r => [.55, .95], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 1.1, .7, 1.9, yaw, 'plain', 0xf08aa0, 1); dBox(x, y - .5, z, 1.12, .3, 1.92, yaw, 'paper', 0x3a7ad8, 1); } },
    { w: 1, size: r => [.6, .6], make(x, y, z, hx, hz, yaw, r) { sCyl(x, y, z, .85, 1.8, 'plain', 0x4a8ad8, 16); for (let i = 0; i < 3; i++) { const a = i * 2.1 + r(); dCyl(x + Math.cos(a) * .4, y + .5, z + Math.sin(a) * .4, .12, .12, 1.1, 'plain', pick(r, [0xf2c230, 0xe05a3a, 0x2fae6a]), 6, 0, .2 * Math.cos(a), .2 * Math.sin(a)); } } }
  ],
  temple: [
    { w: 3, size: r => { const s = .55 + r() * .45; return [s * .72, s * .72]; }, make(x, y, z, hx, hz, yaw, r) { const R = hx / .72, h = 2.5 + r() * 5; sBox(x, y, z, R * 2.3, .4, R * 2.3, yaw, 'stone', 0xeae2d2, 1); sCyl(x, y - .4, z, R, h, 'stone', 0xe0d6c4, 20, 1.2);
        for (let a = 0; a < 8; a++) dBox(x + Math.cos(a / 8 * TAU) * R * .98, y - .4 - h / 2, z + Math.sin(a / 8 * TAU) * R * .98, .08, h, .12, -a / 8 * TAU, 'stone', 0xcfc4b0); } },
    { w: 2, size: r => [1.0, 1.0], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 2, .45, 2, yaw, 'stone', 0xd8ccb6, 1); dBox(x, y + .01, z, 1.4, .02, 1.4, yaw, 'plain', 0xe8c050); } },
    { w: 1.5, size: r => [.8, 1.5], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 1.6, 1.0, 3, yaw, 'stone', 0xc8bca8, 1); } },
    { w: 1.5, size: r => [.6, 2.2], make(x, y, z, hx, hz, yaw, r) { const fx = Math.sin(yaw), fz = Math.cos(yaw); sBox(x, y, z, 1.2, .6, 4.4, yaw, 'stone', 0xe8dcc6, 1);
        for (const s of [-1.7, 1.7]) sCyl(x + fx * s, y - .6, z + fz * s, .45, 3.2, 'stone', 0xdcd0bc, 16); } },
    { w: 1, size: r => [.75, .75], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 1.5, 1.5, 1.5, yaw + .2, 'stone', 0xbfb4a0, 1); for (let i = 0; i < 4; i++) { const a = yaw + .2 + i * Math.PI / 2 + Math.PI / 4; dSph(x + Math.cos(a) * .95, y - .75, z - Math.sin(a) * .95, .16, 'shiny', 0xe8c050); } } }
  ],
  gear: [
    { w: 3, size: r => { const s = 1.0 + r() * .9; return [s * .72, s * .72]; }, make(x, y, z, hx, hz, yaw, r) { const R = hx / .72; gearMesh(x, y, z, R, null, r); addC(cCyl(x, y - .45, z, R, .45, 'metal')); } },
    { w: 2, size: r => [.38, 2.2], make(x, y, z, hx, hz, yaw, r) { const L = hz * 2, fx = Math.sin(yaw) * L / 2, fz = Math.cos(yaw) * L / 2, cy = y - .38; sRod(x - fx, cy, z - fz, x + fx, cy, z + fz, .38, 'metal', 0xc07850, 14);
        for (const s of [-1, 1]) dCyl(x + fx * s * .98, cy, z + fz * s * .98, .46, .46, .14, 'metal', 0x8a5a38, 14, yaw, Math.PI / 2); } },
    { w: 2, size: r => [.9, .9], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 1.8, .14, 1.8, yaw, 'grid', 0x9aa4b4, .5); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) dBox(x + (Math.cos(yaw) * a + Math.sin(yaw) * b) * .82, y - .7, z + (-Math.sin(yaw) * a + Math.cos(yaw) * b) * .82, .1, 1.3, .1, yaw, 'metal', 0x5a6070); } },
    { w: 1.5, size: r => [.7, .7], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 1.4, 1.4, 1.4, yaw, 'metal', 0x8a96a8, .7); dCyl(x, y + .1, z, .3, .3, .2, 'metal', 0xc8a050, 12); } },
    { w: 1, size: r => [.55, .55], make(x, y, z, hx, hz, yaw, r) { sCyl(x, y, z, .55, 3.5, 'metal', 0xc8a050, 16); dCyl(x, y - 1.75, z, .6, .6, .2, 'metal', 0x8a6a30, 16); } }
  ],
  star: [
    { w: 3, size: r => { const s = .5 + r() * .5; return [s * .8, s * .8]; }, make(x, y, z, hx, hz, yaw, r) { const R = hx / .8, h = 1.5 + r() * 3.5, c = pick(r, PAL.crys); addG(place(cylGeo(R, R * .85, h, 6), x, y - h / 2, z, yaw), 'glow', c); addC(cCyl(x, y - h, z, R * .9, h, 'glass'));
        addG(place(new T.ConeGeometry(R * .85, R * 1.3, 6), x, y - h - R * .65, z, yaw, Math.PI), 'glow', shade(c, .8)); } },
    { w: 2.5, size: r => { const s = .9 + r() * .8; return [s, s * (.7 + r() * .3)]; }, make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, hx * 2, .7, hz * 2, yaw, 'stone', 0x5a5a7a, 1.2);
        addG(place(new T.DodecahedronGeometry(Math.min(hx, hz) * 1.1, 0), x, y - .9, z, yaw), 'stone', 0x4a4a6a); addC(cCyl(x, y - 1.6, z, Math.min(hx, hz) * .7, .9, 'stone')); } },
    { w: 1.5, size: r => [.7, .7], make(x, y, z, hx, hz, yaw, r) { sBox(x, y, z, 1.4, .2, 1.4, yaw, 'shiny', 0xd8dce8, 1); dBox(x, y - .4, z, .6, .6, .6, yaw, 'metal', 0x8a8aa0); for (const s of [-1, 1]) dBox(x + Math.cos(yaw) * s * 1.6, y - .4, z - Math.sin(yaw) * s * 1.6, 1.8, .05, .9, yaw, 'shiny', 0x2a4a9a); } },
    { w: 1, size: r => [.4, .4], make(x, y, z, hx, hz, yaw, r) { sCyl(x, y, z, .5, .5, 'glow', 0xfff08a, 10); addG(place(new T.OctahedronGeometry(.5), x, y + .9, z), 'glow', 0xfff6c0); } }
  ]
};
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function shade(hex, k) { _col.set(hex).multiplyScalar(k); return _col.getHex(); }
function gearMesh(x, y, z, R, group, r) {
  const g = cylGeo(R, R, .45, 28); place(g, x, y - .225, z);
  const parts = [{ g, mat: 'metal', c: 0xc8a050 }];
  const n = Math.max(8, Math.round(R * 7));
  for (let i = 0; i < n; i++) { const a = i / n * TAU, t = boxGeo(.32, .34, .3); place(t, x + Math.cos(a) * (R + .1), y - .25, z + Math.sin(a) * (R + .1), -a); parts.push({ g: t, mat: 'metal', c: 0xb08a40 }); }
  const hub = cylGeo(R * .28, R * .28, .1, 16); place(hub, x, y + .02, z); parts.push({ g: hub, mat: 'metal', c: 0x6a5a40 });
  for (const p of parts) { if (group) { addGTo(group, p.g, p.mat, p.c); } else addG(p.g, p.mat, p.c); }
}
// 動く足場は、まとめずに自分の形を持つ
function addGTo(group, geo, mat, hex) {
  const n = geo.attributes.position.count, a = new Float32Array(n * 3); _col.set(hex);
  for (let i = 0; i < n; i++) { a[i * 3] = _col.r; a[i * 3 + 1] = _col.g; a[i * 3 + 2] = _col.b; }
  geo.setAttribute('color', new T.BufferAttribute(a, 3));
  const m = new T.Mesh(geo, MATS[mat]); m.castShadow = m.receiveShadow = true; group.add(m);
}

// ================= ステージを作る =================
const ROUTE = [];       // 登る道すじ（足場の上の面の中心）
const KEEP = [];        // ここには物を置かない（ジャンプの通り道と頭の上）
const MOVERS = [];
let DOCK = null, SUMMIT = null;
const _q = [], _pv = { x: 0, y: 0, z: 0 };
function keepAdd(ax, ay, az, bx, by, bz, r) { KEEP.push({ a: [ax, ay, az], b: [bx, by, bz], r, y0: Math.min(ay, by) - r, y1: Math.max(ay, by) + r }); }
// 置こうとしている物（STAGE）が、ほかの物や通り道にぶつからないか
function stageBlocked(ignore, keepSkip) {
  for (const c of STAGE.cols) {
    const b = c.bb; queryBox(b[0] - .25, b[1] - .25, b[2] - .25, b[3] + .25, b[4] + .25, b[5] + .25, _q);
    for (const o of _q) if (!ignore.includes(o) && !o.ground) return true;
    for (let i = KEEP.length - 1; i >= 0; i--) {
      const k = KEEP[i]; if (keepSkip && i >= KEEP.length - keepSkip) continue; if (k.y1 < b[1] || k.y0 > b[4]) continue;
      const L = Math.hypot(k.b[0] - k.a[0], k.b[1] - k.a[1], k.b[2] - k.a[2]), n = Math.max(1, Math.ceil(L / .45));
      for (let s = 0; s <= n; s++) { const t = s / n, x = lerp(k.a[0], k.b[0], t), y = lerp(k.a[1], k.b[1], t), z = lerp(k.a[2], k.b[2], t);
        if (x > b[0] - k.r && x < b[3] + k.r && y > b[1] - k.r && y < b[4] + k.r && z > b[2] - k.r && z < b[5] + k.r) return true; }
    }
  }
  return false;
}
// 頭の上と、ジャンプの通り道が空いているか（いまある物と）
function pathClear(a, b, ignore) {
  const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.ceil(L / .5));
  for (let s = 1; s < n; s++) { const t = s / n, x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t), y = lerp(a.y, b.y, t) + Math.sin(t * Math.PI) * 1.1;
    queryBox(x - .45, y + .25, z - .45, x + .45, y + 1.8, z + .45, _q); for (const o of _q) if (!ignore.includes(o)) return false; }
  queryBox(b.x - .6, b.y + .15, b.z - .6, b.x + .6, b.y + 2.2, b.z + .6, _q); for (const o of _q) if (!ignore.includes(o)) return false;
  return true;
}
function stageBegin() { STAGE = { geos: [], cols: [] }; }
function stageCommit() { const s = STAGE; STAGE = null; for (const g of s.geos) bucketAdd(g); for (const c of s.cols) { COLS.push(c); hashAdd(c); } return s.cols; }
function stageDrop() { for (const g of STAGE.geos) g.geo.dispose(); STAGE = null; }

function buildWorld() {
  const r = mulberry(20261110);
  const rr = (a, b) => a + (b - a) * r();
  // ---------- 港（スタート） ----------
  DOCK = sBox(0, 0, 8, 30, 3, 24, 0, 'wood', 0x9a7a5a, 2); DOCK.ground = true; DOCK.kind = 'wood';
  dBox(0, -1.6, 8, 30.6, .4, 24.6, 0, 'stone', 0x6a6a70, 2);
  for (let i = 0; i < 9; i++) { dCyl(-14 + i * 3.5, -2.2, -3.8, .35, .35, 3, 'wood', 0x5a4030); dCyl(-14 + i * 3.5, -2.2, 19.8, .35, .35, 3, 'wood', 0x5a4030); }
  for (const [bx, bz] of [[-12, -3], [-4, -3], [4, -3], [12, -3], [-14, 10], [14, 10]]) { sCyl(bx, .6, bz, .28, .6, 'metal', 0x3a3a44, 12); dCyl(bx, .62, bz, .36, .36, .1, 'metal', 0x3a3a44); }
  sBox(-9, 1.2, 15, 2.4, 1.2, 1.6, .3, 'wood', 0xc49a62, .6); sBox(-9.3, 2.2, 15.2, 1.2, 1.0, 1.2, .1, 'wood', 0xb8885a, .6);
  sCyl(10, 1.0, 16, .5, 1.0, 'metal', 0x3a6ec8); sCyl(11.1, 1.0, 16.3, .5, 1.0, 'metal', 0xd64532); sCyl(10.5, 2.02, 16.1, .5, 1.0, 'metal', 0x3aa35a);
  // 灯台
  const LH = [-26, 0, 22]; dCyl(LH[0], -1, LH[2], 3.2, 3.6, 4, 'stone', 0x8a8a90); for (let i = 0; i < 6; i++) dCyl(LH[0], 2 + i * 2.6 + 1.3, LH[2], 1.6 - i * .08, 1.65 - i * .08, 2.6, 'plain', i % 2 ? 0xd83a3a : 0xf2f2f2);
  dCyl(LH[0], 18.4, LH[2], 1.2, 1.2, 1.6, 'shiny', 0x9ad8ff); dSph(LH[0], 18.4, LH[2], .6, 'glow', 0xfff2a0); dCyl(LH[0], 19.6, LH[2], .1, 1.5, 1, 'metal', 0x3a3a44);
  // 船
  for (const [sx, sz, yw, c] of [[22, 30, .6, 0xe0e4ea], [-30, -14, -.4, 0xd8483a], [34, -6, 1.8, 0x3a6ec8]]) {
    dBox(sx, -.2, sz, 4, 1.6, 11, yw, 'plain', c); dBox(sx, 1.4, sz, 3, 1.6, 4, yw, 'plain', 0xf2f2f2); dCyl(sx, 4, sz, .1, .1, 4, 'metal', 0x6a6a70);
  }
  // 大きなクレーン（目じるし）
  for (const [cx, cz, yw] of [[30, 12, -.5], [-34, 6, .7]]) { for (const [a, b] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) dBox(cx + a, 14, cz + b, .4, 28, .4, 0, 'metal', 0xe0a030);
    dBox(cx, 28.5, cz, 3.4, 1.2, 3.4, 0, 'metal', 0xe0a030); dBox(cx + Math.sin(yw) * 9, 30, cz + Math.cos(yw) * 9, 1, 1, 26, yw, 'metal', 0xe0a030); dBox(cx, 30.8, cz, 2.4, 1.8, 2.4, 0, 'plain', 0x3a4a5a); }

  // ---------- 道すじ ----------
  let cur = { x: 0, y: 0, z: -2.6, rho: 2.2, cols: [DOCK], zone: 0, kind: 'dock' };
  ROUTE.push(cur);
  let ang = Math.atan2(cur.z, cur.x), spin = 1, Rrad = 9;
  const ZY = z => z.y1;
  // 進む向き：接線（spin の向き）に、半径を保つためのかたむきと、ゆらぎを足す
  function travelDir(rg, tryN = 0) {
    const a = Math.atan2(cur.z, cur.x), rad = Math.hypot(cur.x, cur.z);
    const bias = rad < 9 ? .45 : rad > 18 ? -.45 : 0, dev = clamp(bias + (rg() - .5) * (tryN > 10 ? 1.6 : .9), -1.1, 1.1);
    const tx = -Math.sin(a) * spin, tz = Math.cos(a) * spin, ox = Math.cos(a), oz = Math.sin(a);
    return [tx * Math.cos(dev) + ox * Math.sin(dev), tz * Math.cos(dev) + oz * Math.sin(dev)];
  }
  // つぎの足場を置く（ふつうの1つ）
  function stepTo(Z, opt = {}) {
    const kit = KIT[Z.id];
    for (let tryN = 0; tryN < 26; tryN++) {
      const relax = tryN > 18;
      const it = opt.item || wpick(r, kit), [hx, hz] = it.size(r), rho = Math.min(hx, hz);
      let rise = opt.rise ?? rr(Z.rise[0], Z.rise[1]);
      if (rho < .5) rise = Math.min(rise, .7);   // 細い足場（パイプ・棒）には高く跳ばせない
      const gmax = Math.max(Z.gap[0] + .15, Z.gap[1] - .9 * Math.max(0, rise - .45));
      const gap = opt.gap ?? rr(Z.gap[0], gmax);
      const D = cur.rho + gap + rho;
      // まわりを回るように：円の接線の向きに進み、内・外へ少しふらつく（中心から 6.5〜22m におさめる）
      const [ux, uz] = travelDir(r, tryN), nx = cur.x + ux * D, nz = cur.z + uz * D, ny = cur.y + rise;
      const yaw = opt.yaw ?? (r() * TAU);
      const nxt = { x: nx, y: ny, z: nz }, nrad = Math.hypot(nx, nz);
      if (nrad > 24 || nrad < 5.5) continue;
      if (tryN === 13) spin = -spin;
      if (!relax && !pathClear(cur, nxt, cur.cols)) continue;
      stageBegin(); it.make(nx, ny, nz, hx, hz, yaw, r);
      if (!relax && stageBlocked(cur.cols, 0)) { stageDrop(); continue; }
      const cols = stageCommit();
      keepAdd(cur.x, cur.y + 1.0, cur.z, nx, ny + 1.0, nz, .95);
      keepAdd(nx, ny + .9, nz, nx, ny + 1.6, nz, Math.min(rho, 1.1) * .9);
      cur = { x: nx, y: ny, z: nz, rho, cols, zone: Z.i, kind: 'step', hx, hz, yaw };
      ROUTE.push(cur); return true;
    }
    spin = -spin; return false;
  }
  // 階段：同じ種類の小さな台を、少しずつ高く並べる
  function stairs(Z) {
    const n = 4 + (r() * 4 | 0), a0 = Math.atan2(cur.z, cur.x) + spin * .2, rNow = Math.hypot(cur.x, cur.z);
    const tx = -Math.sin(a0) * spin, tz = Math.cos(a0) * spin;   // まわる向き
    const mats = { port: ['wood', 0xc49a62], garden: ['grass', 0x6cc24a], rail: ['stone', 0xb0a698], stat: ['plain', pick(r, PAL.book)], temple: ['stone', 0xe0d6c4], gear: ['grid', 0x9aa4b4], star: ['glow', pick(r, PAL.crys)] }[Z.id];
    let x = cur.x + tx * (cur.rho + .95), z = cur.z + tz * (cur.rho + .95), y = cur.y + .42;
    if (Math.hypot(x, z) > 23 || Math.hypot(x, z) < 6) return false;
    stageBegin(); const tops = [];
    for (let i = 0; i < n; i++) { const yaw = Math.atan2(tx, tz); sBox(x, y, z, 1.3, .42 + .4, .9, yaw, mats[0], mats[1], .6); tops.push({ x, y, z }); x += tx * .86; z += tz * .86; y += .42; }
    if (stageBlocked(cur.cols, 2)) { stageDrop(); return false; }
    const cols = stageCommit(), last = tops[tops.length - 1];
    keepAdd(cur.x, cur.y + 1, cur.z, last.x, last.y + 1, last.z, .9); keepAdd(last.x, last.y + .9, last.z, last.x, last.y + 1.6, last.z, .5);
    tops.forEach((t, i) => ROUTE.push({ x: t.x, y: t.y, z: t.z, rho: .42, cols: [cols[i]], zone: Z.i, kind: 'stair' }));
    cur = Object.assign({}, ROUTE[ROUTE.length - 1], { rho: .42 }); return true;
  }
  // 細長い一本道（梁・定規・パイプ…）：坂を登っていく
  function beam(Z) {
    const L = rr(5, 8.5), up = rr(.6, 1.6), a0 = Math.atan2(cur.z, cur.x), tx = -Math.sin(a0) * spin, tz = Math.cos(a0) * spin;
    const sx = cur.x + tx * (cur.rho + .1), sz = cur.z + tz * (cur.rho + .1), ex = sx + tx * L, ez = sz + tz * L;
    if (Math.hypot(ex, ez) > 23.5 || Math.hypot(ex, ez) < 5.5) return false;
    const w = { port: .7, garden: .8, rail: .9, stat: .6, temple: .7, gear: .6, star: .55 }[Z.id], mc = { port: ['metal', 0xe0a030], garden: ['wood', 0x8a6a48], rail: ['metal', 0xc03a3a], stat: ['paper', 0xe8e2c8], temple: ['stone', 0xe8dcc6], gear: ['grid', 0x9aa4b4], star: ['shiny', 0xb8c0e0] }[Z.id];
    const mx = (sx + ex) / 2, mz = (sz + ez) / 2, my = cur.y + up / 2 - .12, yaw = Math.atan2(tx, tz), pitch = -Math.atan2(up, L);
    stageBegin(); addG(place(boxGeo(w, .24, L + .2, .8), mx, my, mz, yaw, pitch), mc[0], mc[1]); addC(cBox(mx, my, mz, w, .24, L + .2, yaw, pitch, 0, mc[0]));
    if (stageBlocked(cur.cols, 2)) { stageDrop(); return false; }
    const cols = stageCommit();
    keepAdd(sx, cur.y + 1, sz, ex, cur.y + up + 1, ez, .9);
    ROUTE.push({ x: mx, y: cur.y + up / 2, z: mz, rho: w / 2, cols, zone: Z.i, kind: 'beam' });
    cur = { x: ex, y: cur.y + up, z: ez, rho: w / 2, cols, zone: Z.i, kind: 'beam' };
    ROUTE.push(cur); return true;
  }
  // 回る円盤（歯車）／上下するリフト
  function mover(Z, type) {
    const a0 = Math.atan2(cur.z, cur.x), tx = -Math.sin(a0) * spin, tz = Math.cos(a0) * spin;
    if (type === 'spin') {
      const R = rr(1.7, 2.3), gap = rr(1.0, 1.6), x = cur.x + tx * (cur.rho + gap + R), z = cur.z + tz * (cur.rho + gap + R), y = cur.y + rr(.3, .8);
      if (Math.hypot(x, z) > 23 || Math.hypot(x, z) < 6) return false;
      stageBegin(); STAGE.cols.push(cCyl(x, y - .45, z, R, .45, 'metal')); if (stageBlocked(cur.cols, 2)) { stageDrop(); return false; } STAGE = null;
      const m = makeMover('spin', x, y, z, { R, w: rr(.45, .8) * (r() < .5 ? -1 : 1) }, grp => gearMesh(0, 0, 0, R, grp, r));
      const c = m.addCol(cCyl(0, -.45, 0, R, .45, 'metal'));
      keepAdd(cur.x, cur.y + 1, cur.z, x, y + 1, z, .95); keepAdd(x, y + .3, z, x, y + 2, z, R);
      cur = { x, y, z, rho: Math.min(R, 1.2), cols: [c], zone: Z.i, kind: 'spin', mover: m }; ROUTE.push(cur); return true;
    }
    // リフト：となりで上下する。上についたら、つぎの足場へ
    const H = rr(4, 7), x = cur.x + tx * (cur.rho + 1.1 + 1.0), z = cur.z + tz * (cur.rho + 1.1 + 1.0), yLow = cur.y - .1;
    if (Math.hypot(x, z) > 23 || Math.hypot(x, z) < 6) return false;
    stageBegin(); STAGE.cols.push(cBox(x, yLow + H / 2, z, 2, H + .4, 2)); if (stageBlocked(cur.cols, 2)) { stageDrop(); return false; } STAGE = null;
    const m = makeMover('lift', x, yLow, z, { H, per: rr(6, 8) }, grp => { addGTo(grp, place(boxGeo(2, .3, 2, .5), 0, -.15, 0), 'grid', 0x9aa4b4); addGTo(grp, place(boxGeo(2.1, .1, 2.1), 0, -.33, 0), 'metal', 0xe0a030); });
    const c = m.addCol(cBox(0, -.15, 0, 2, .3, 2, 0, 0, 0, 'metal'));
    for (const [a, b] of [[-1.2, -1.2], [1.2, 1.2]]) dBox(x + a, yLow + H / 2, z + b, .14, H + 1, .14, 0, 'metal', 0x5a6070);
    keepAdd(cur.x, cur.y + 1, cur.z, x, yLow + 1, z, .9); keepAdd(x, yLow + .3, z, x, yLow + H + 2.2, z, 1.5);
    ROUTE.push({ x, y: yLow, z, rho: 1, cols: [c], zone: Z.i, kind: 'liftLow', mover: m });
    cur = { x, y: yLow + H, z, rho: 1.0, cols: [c], zone: Z.i, kind: 'liftTop', mover: m }; ROUTE.push(cur); return true;
  }
  // ゾーンの入り口：広い台と看板
  function gate(Z) {
    for (let tryN = 0; tryN < 30; tryN++) {
      const rise = rr(.5, .9), gap = rr(1.0, 1.6), R = 2.6, rNow = Math.hypot(cur.x, cur.z), D = cur.rho + gap + R;
      let rT = clamp(rNow + rr(-2, 2), 8, 20); const cosd = clamp((rNow * rNow + rT * rT - D * D) / (2 * rNow * rT), -1, 1);
      const a1 = Math.atan2(cur.z, cur.x) + spin * Math.acos(cosd) + rr(-.2, .2) * (tryN > 6 ? 2 : 0) * (tryN > 18 ? 3 : 1), x = Math.cos(a1) * rT, z = Math.sin(a1) * rT, y = cur.y + rise;
      if (!pathClear(cur, { x, y, z }, cur.cols)) continue;
      stageBegin();
      const mat = { garden: ['grass', 0x7ad05a], rail: ['stone', 0xd8cfc0], stat: ['paper', 0xf6f2e6], temple: ['stone', 0xf0e8d8], gear: ['grid', 0xa8b0c0], star: ['glow', 0x8ad8ff] }[Z.id] || ['wood', 0x9a7a5a];
      sCyl(x, y, z, R, .6, mat[0], mat[1], 28, 1.2); addG(place(cylGeo(R * .9, R * .3, 2.4, 14), x, y - 1.8, z), 'stone', 0x7a7a8a); addC(cCyl(x, y - 3, z, R * .5, 2.4, 'stone'));
      if (stageBlocked(cur.cols, 0)) { stageDrop(); continue; }
      const cols = stageCommit();
      SIGNS.push({ x: x + Math.cos(a1) * (R - .5), y, z: z + Math.sin(a1) * (R - .5), yaw: Math.atan2(-Math.cos(a1), -Math.sin(a1)), Z });
      keepAdd(cur.x, cur.y + 1, cur.z, x, y + 1, z, .95); keepAdd(x, y + .9, z, x, y + 1.6, z, 1.6);
      cur = { x, y, z, rho: R * .8, cols, zone: Z.i, kind: 'gate' }; ROUTE.push(cur); return true;
    }
    return false;
  }
  for (const Z of ZONES) {
    if (Z.i > 0) for (let g = 0; g < 30 && !gate(Z); g++) stepTo(ZONES[Z.i - 1], { rise: rr(.1, .4) });
    let guard = 0;
    while (cur.y < ZY(Z) - .5 && guard++ < 900) {
      const p = r();
      if (cur.kind === 'stair' || cur.kind === 'beam') { stepTo(Z, { gap: rr(Z.gap[0], Math.min(Z.gap[1], 2.0)) }); continue; }
      if (cur.kind === 'liftTop' || cur.kind === 'spin' || cur.kind === 'gate') { stepTo(Z); continue; }
      if (p < .08 && stairs(Z)) continue;
      if (p < .17 && beam(Z)) continue;
      if (Z.i >= 4 && p < .23 && mover(Z, r() < .5 ? 'spin' : 'lift')) continue;
      if (Z.i === 3 && p < .2 && mover(Z, 'lift')) continue;
      stepTo(Z);
      if (r() < .045) spin = -spin;   // ときどき回る向きを変える
    }
  }
  // ---------- てっぺん ----------
  for (let tryN = 0; tryN < 20; tryN++) {
    const R = 4.4, rNow = Math.hypot(cur.x, cur.z), D = cur.rho + 1.4 + R, rT = clamp(rNow, 10, 18), cosd = clamp((rNow * rNow + rT * rT - D * D) / (2 * rNow * rT), -1, 1);
    const a1 = Math.atan2(cur.z, cur.x) + spin * Math.acos(cosd) + (tryN ? r() - .5 : 0), x = Math.cos(a1) * rT, z = Math.sin(a1) * rT, y = cur.y + .6;
    stageBegin(); sCyl(x, y, z, R, .8, 'stone', 0xf0ecff, 36, 1.4);
    if (tryN < 18 && stageBlocked(cur.cols, 0)) { stageDrop(); continue; }
    const cols = stageCommit();
    addG(place(cylGeo(R * .95, .6, 9, 24), x, y - 5.3, z), 'stone', 0x4a4a6a);
    dCyl(x, y + .9, z, 1.1, 1.3, 1.8, 'stone', 0xe8e4f0, 20); addC(cCyl(x, y, z, 1.25, 1.8, 'stone'));
    STAR_POS.set(x, y + 3.6, z);
    dCyl(x + 2.6, y + 2.6, z, .06, .06, 5.2, 'metal', 0xd8d8e0); dBox(x + 3.4, y + 4.6, z, 1.6, 1.0, .04, 0, 'plain', 0xff5a6a);
    SUMMIT = { x, y, z, R, cols }; ROUTE.push({ x, y, z, rho: R - 1.5, cols, zone: 6, kind: 'summit' });
    break;
  }
  // ---------- 飾り（落ちたときに受け止めてくれることもある） ----------
  for (const Z of ZONES) {
    const kit = KIT[Z.id], N = Math.round(150 * Z.deco);
    for (let i = 0; i < N; i++) {
      for (let tryN = 0; tryN < 4; tryN++) {
        const it = wpick(r, kit), [hx, hz] = it.size(r), a = r() * TAU, rad = rr(3, 34), x = Math.cos(a) * rad, z = Math.sin(a) * rad, y = rr(Z.y0 + 3, Z.y1 + 2);
        stageBegin(); it.make(x, y, z, hx, hz, r() * TAU, r);
        if (stageBlocked([], 0)) { stageDrop(); continue; }
        stageCommit(); break;
      }
    }
  }
  landmarks(r);
  meshFromBuckets();
}
function wpick(r, kit) { let s = 0; for (const k of kit) s += k.w; let v = r() * s; for (const k of kit) { v -= k.w; if (v <= 0) return k; } return kit[0]; }
const SIGNS = [];
const STAR_POS = new T.Vector3();

// ---------- 遠くに見える目じるし（当たりなし） ----------
function landmarks(r) {
  const far = (a, d) => [Math.cos(a) * d, Math.sin(a) * d];
  // 空の庭：大きな浮き島と木
  { const [x, z] = far(1.2, 70), y = 130; dCyl(x, y, z, 14, 4, 18, 'stone', 0x8a6a48, 14); dCyl(x, y + 9.3, z, 14.5, 14.5, 1.2, 'grass', 0x6cc24a, 28); dCyl(x, y + 16, z, 1.2, 1.8, 12, 'wood', 0x7a5232); dSph(x, y + 24, z, 8, 'grass', 0x4f9e3a, .8); dSph(x + 4, y + 21, z + 3, 5, 'grass', 0x5aae44); }
  // 雲の鉄道：長い橋
  { const [x, z] = far(3.6, 62), y = 215; for (let i = -4; i <= 4; i++) { dBox(x + i * 9 * Math.sin(3.6), y - 8, z + i * 9 * Math.cos(3.6), 1.2, 16, 1.2, 0, 'metal', 0xc03a3a); }
    dBox(x, y, z, 2.4, 1.2, 84, 3.6, 'metal', 0xc03a3a); dBox(x, y + .9, z, 1.6, .5, 84, 3.6, 'stone', 0x7a6a5a); dBox(x + 2 * Math.cos(3.6), y + 2.6, z - 2 * Math.sin(3.6), 2.6, 2.8, 8, 3.6, 'plain', 0x3a6ec8); }
  // ぶんぼうぐ：開いた大きな本
  { const [x, z] = far(5.4, 66), y = 300; dBox(x - 6, y, z, 12, .6, 16, .2, 'paper', 0xf6f2e6, 1.2, 0, .18); dBox(x + 6, y, z, 12, .6, 16, .2, 'paper', 0xf6f2e6, 1.2, 0, -.18); dBox(x, y - .6, z, 25, .4, 16.6, .2, 'plain', 0xd64545); dCyl(x + 8, y + 9, z, .8, .8, 20, 'plain', 0xf2c230, 6, .2, 0, .5); }
  // 神殿：門
  { const [x, z] = far(.4, 64), y = 385; for (const s of [-7, 7]) dCyl(x + s * Math.cos(.4), y, z - s * Math.sin(.4), 1.6, 1.8, 20, 'stone', 0xe8e0d0, 20); dBox(x, y + 11, z, 19, 2.2, 3, -.4 + Math.PI / 2, 'stone', 0xd8ccb6); dBox(x, y + 13, z, 21, 1, 3.6, -.4 + Math.PI / 2, 'plain', 0xc05a4a); }
  // 歯車の塔：大きな時計
  { const [x, z] = far(2.4, 66), y = 470; const g = cylGeo(14, 14, 1.5, 48); g.rotateX(Math.PI / 2); addG(place(g, x, y, z, 2.4 + Math.PI), 'plain', 0xf2ead8);
    const g2 = cylGeo(15, 15, 1.2, 48); g2.rotateX(Math.PI / 2); addG(place(g2, x - Math.sin(2.4) * .3, y, z - Math.cos(2.4) * .3, 2.4 + Math.PI), 'metal', 0xc8a050);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; dBox(x + Math.cos(2.4) * Math.cos(a) * 11.5 + .0, y + Math.sin(a) * 11.5, z - Math.sin(2.4) * Math.cos(a) * 11.5, 1.2, 1.2, .3, 2.4 + Math.PI / 2, 'plain', 0x3a3a40); } }
  // 星：大きな月
  { const [x, z] = far(4.4, 220), y = 640; dSph(x, y, z, 26, 'glow', 0xfff4d0); }
}

// ---------- 雲・海・看板・てっぺんの星 ----------
const FX = { water: null, sheets: [], star: null, clouds: [] };
function buildScenery() {
  // 海
  const wt = canvasTex(256, (g, s) => { g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, s, s); for (let i = 0; i < 180; i++) { g.strokeStyle = `rgba(255,255,255,${.12 + Math.random() * .25})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const x = Math.random() * s, y = Math.random() * s, l = 10 + Math.random() * 30; g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 3, x + l, y); g.stroke(); } });
  wt.repeat.set(60, 60);
  const wm = new T.MeshStandardMaterial({ color: 0x2b7fb8, map: wt, roughness: .25, metalness: .05 });
  FX.water = new T.Mesh(new T.PlaneGeometry(2400, 2400), wm); FX.water.rotation.x = -Math.PI / 2; FX.water.position.y = -.6; FX.water.receiveShadow = true; scene.add(FX.water);
  // 雲（ふんわりした板を、ところどころの高さに）
  const ct = canvasTex(256, (g, s) => { g.clearRect(0, 0, s, s); for (let i = 0; i < 26; i++) { const x = s / 2 + (Math.random() - .5) * s * .55, y = s / 2 + (Math.random() - .5) * s * .3, rr = s * (.1 + Math.random() * .16); const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); } }, false);
  const cr = mulberry(77);
  for (let i = 0; i < 140; i++) {
    const m = new T.SpriteMaterial({ map: ct, transparent: true, depthWrite: false, opacity: .85, fog: true });
    const s = new T.Sprite(m), a = cr() * TAU, d = 45 + cr() * 260, h = -10 + cr() * 640, sz = 30 + cr() * 70;
    s.position.set(Math.cos(a) * d, h, Math.sin(a) * d); s.scale.set(sz, sz * .45, 1); s.renderOrder = -1; scene.add(s); FX.clouds.push(s);
  }
  // 雲の層（通りぬけるときに白くなる）
  const st = canvasTex(512, (g, s) => { g.clearRect(0, 0, s, s); for (let i = 0; i < 160; i++) { const x = Math.random() * s, y = Math.random() * s, rr = 20 + Math.random() * 60; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } });
  st.repeat.set(3, 3);
  for (const h of [ZH - 2, ZH * 3 - 2, ZH * 5 - 2]) {
    const m = new T.MeshBasicMaterial({ map: st, transparent: true, opacity: .5, depthWrite: false, side: T.DoubleSide, fog: true });
    const p = new T.Mesh(new T.PlaneGeometry(900, 900), m); p.rotation.x = -Math.PI / 2; p.position.y = h; p.renderOrder = 2; scene.add(p); FX.sheets.push(p);
  }
  // ゾーンの看板
  for (const s of SIGNS) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#f8f2e2'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#6a4a2a'; g.lineWidth = 14; g.strokeRect(7, 7, 498, 242);
    g.fillStyle = '#3a2a1a'; g.textAlign = 'center'; g.font = '900 64px "M PLUS Rounded 1c", sans-serif'; g.fillText(s.Z.name, 256, 120);
    g.font = '800 34px "M PLUS Rounded 1c", sans-serif'; g.fillStyle = '#8a5a2a'; g.fillText(`${s.Z.y0} m`, 256, 190);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    const grp = new T.Group(); grp.position.set(s.x, s.y, s.z); grp.rotation.y = s.yaw;
    const post = new T.Mesh(new T.CylinderGeometry(.07, .07, 1.6, 8), new T.MeshStandardMaterial({ color: 0x6a4a2a })); post.position.y = .8; grp.add(post);
    const board = new T.Mesh(new T.PlaneGeometry(1.6, .8), new T.MeshStandardMaterial({ map: t, side: T.DoubleSide })); board.position.y = 1.7; grp.add(board);
    scene.add(grp);
  }
  // てっぺんの星
  const sg = new T.Group(), sh = new T.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, rr = i % 2 ? .55 : 1.3; if (i) sh.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr); else sh.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); }
  const sgeo = new T.ExtrudeGeometry(sh, { depth: .35, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 1 }); sgeo.center();
  const smat = new T.MeshStandardMaterial({ color: 0xffe14a, emissive: 0xffc81a, emissiveIntensity: .9, roughness: .3, metalness: .4 });
  const star = new T.Mesh(sgeo, smat); star.castShadow = true; sg.add(star); sg.position.copy(STAR_POS); scene.add(sg); FX.star = sg;
  const pl = new T.PointLight(0xffe08a, 30, 26, 1.6); pl.position.copy(STAR_POS); scene.add(pl);
}
// ---------- まとめた形を作る ----------
function meshFromBuckets() {
  for (const [key, list] of BUCKETS) {
    const mat = key.split('|')[0], g = mergeGeometries(list, false);
    if (!g) continue;
    g.computeBoundingSphere();
    const m = new T.Mesh(g, MATS[mat]); m.castShadow = mat !== 'glow'; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); scene.add(m);
    for (const x of list) x.dispose();
  }
  BUCKETS.clear();
}

// ================= 動く足場 =================
// type 'spin'：その場で回る / 'lift'：上下する。当たりは、足場の中の位置で持っておき、毎回まわりへ置きなおす
function makeMover(type, x, y, z, p, build) {
  const grp = new T.Group(); grp.position.set(x, y, z); build(grp); scene.add(grp);
  const m = { type, x, y, z, p, grp, cols: [], ang: 0, off: 0, dAng: 0, dOff: 0, t: 0 };
  m.addCol = c => { c.local = JSON.parse(JSON.stringify({ c: c.c, R: c.R, a: c.a, b: c.b, y1: c.y1 })); c.mv = m; m.cols.push(c); MOVCOLS.push(c); moverPlace(m); return c; };
  MOVERS.push(m); return m;
}
function moverPlace(m) {
  const ca = Math.cos(m.ang), sa = Math.sin(m.ang), ox = m.x, oy = m.y + m.off, oz = m.z;
  for (const c of m.cols) {
    const L = c.local;
    if (c.t === 0) { const [lx, ly, lz] = L.c; c.c = [ox + lx * ca + lz * sa, oy + ly, oz - lx * sa + lz * ca]; const R0 = L.R, Ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca];
      // R = Ry * R0（列ごと）
      c.R = []; for (let col = 0; col < 3; col++) { const v = [R0[col * 3], R0[col * 3 + 1], R0[col * 3 + 2]]; c.R.push(Ry[0] * v[0] + Ry[3] * v[1] + Ry[6] * v[2], Ry[1] * v[0] + Ry[4] * v[1] + Ry[7] * v[2], Ry[2] * v[0] + Ry[5] * v[1] + Ry[8] * v[2]); }
      setBoxBB(c); }
    else if (c.t === 1) { const [lx, ly0, lz] = L.c; c.c = [ox + lx * ca + lz * sa, oy + ly0, oz - lx * sa + lz * ca]; c.y1 = c.c[1] + (L.y1 - ly0); c.bb = [c.c[0] - c.r, c.c[1], c.c[2] - c.r, c.c[0] + c.r, c.y1, c.c[2] + c.r]; c.top = c.y1; }
  }
  m.grp.position.set(ox, oy, oz); m.grp.rotation.y = m.ang;
}
// 時間 t の位置へ。のっている人を運ぶために、前回からの動きも覚える
function moverTick(m, t) {
  const a0 = m.ang, o0 = m.off;
  if (m.type === 'spin') m.ang = t * m.p.w;
  else m.off = (1 - Math.cos(t / m.p.per * TAU)) / 2 * m.p.H;
  m.dAng = angD(m.ang - a0); m.dOff = m.off - o0; moverPlace(m);
}
