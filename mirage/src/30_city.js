// =========================================================================================
//  街：碁盤の目の道路（右側通行・片側1車線）、旧市街の路地、中層の街区、スーク、ドームの広場、
//  高層ビル街、海辺の遊歩道と砂浜、まわりの砂丘。材質ごと・区画ごとにまとめて描く
// =========================================================================================
const CITY = { N: 8, P: 72, HR: 5.5, SWW: 2.5 };   // 区画数、道の間隔、車道の半幅、歩道の幅
CITY.E = CITY.N * CITY.P;                          // 端の道路の位置
CITY.IN = CITY.HR + CITY.SWW;                       // 道路中心から区画の内側まで（8m）
CITY.SEA = CITY.E + CITY.IN + 18;                   // 砂浜の始まり（z）
CITY.SHORE = CITY.SEA + 26;                         // 波打ちぎわ
const lineX = i => i * CITY.P;
// 区画の用途
const DIST = {};
(function plan() {
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    let d = 'mid';
    if (i >= 5 && j <= 2) d = 'tower';
    else if (i <= 3 && j >= 2) d = 'old';
    else if (i <= 2 && j <= 1) d = 'old';
    DIST[i + ',' + j] = d;
  }
  Object.assign(DIST, { '4,4': 'plaza', '2,4': 'souk', '0,0': 'lot', '7,7': 'hotel', '1,6': 'garage', '6,5': 'hospital', '5,6': 'police', '4,1': 'lot', '7,4': 'lot' });
})();
const blockRect = (i, j) => ({ x0: lineX(i) + CITY.IN, x1: lineX(i + 1) - CITY.IN, z0: lineX(j) + CITY.IN, z1: lineX(j + 1) - CITY.IN });

// ---------- 地面の高さ（車・人・地形の作りに同じものを使う） ----------
function duneH(x, z) {
  return 7 + 5.5 * Math.sin(x * 0.012 + Math.sin(z * 0.007) * 2) * Math.cos(z * 0.0105 - 0.6) + 3.2 * Math.sin(x * 0.031 + z * 0.019) + 1.6 * Math.sin(z * 0.047 - x * 0.013);
}
function groundH(x, z) {
  const e0 = -CITY.IN, e1 = CITY.E + CITY.IN;
  if (z > e1) {   // 南：遊歩道 → 砂浜 → 海
    if (x < e0 - 30 || x > e1 + 30) { /* 砂丘のまま */ } else {
      if (z < CITY.SEA) return 0.15;
      return lerp(0.1, -2.6, smooth(CITY.SEA, CITY.SHORE + 30, z));
    }
  }
  const out = Math.max(e0 - x, x - e1, e0 - z, 0);
  if (out <= 0) {
    // 歩道（区画の外まわり2.5m）は15cm高い
    const P = CITY.P, lx = ((x % P) + P) % P, lz = ((z % P) + P) % P;
    const dx = Math.min(lx, P - lx), dz = Math.min(lz, P - lz);
    if (dx <= CITY.HR || dz <= CITY.HR) return 0.02;   // 車道
    if (dx < CITY.IN || dz < CITY.IN) return 0.15;     // 歩道
    return 0.12;                                       // 区画の中
  }
  return Math.max(0, duneH(x, z)) * smooth(26, 120, out);
}
const WORLD_LIM = { x0: -CITY.IN - 230, x1: CITY.E + CITY.IN + 230, z0: -CITY.IN - 230, z1: CITY.SHORE - 6 };

// ---------- 当たり判定：AABBを32mのマスに入れておく ----------
const COL = { list: [], grid: new Map(), cell: 32 };
function addCol(x0, z0, x1, z1, h = 30, kind = 'bld') {
  const c = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), h, kind };
  COL.list.push(c);
  const s = COL.cell;
  for (let gx = Math.floor(c.x0 / s); gx <= Math.floor(c.x1 / s); gx++) for (let gz = Math.floor(c.z0 / s); gz <= Math.floor(c.z1 / s); gz++) {
    const k = gx + ',' + gz; let a = COL.grid.get(k); if (!a) COL.grid.set(k, a = []); a.push(c);
  }
  return c;
}
const _colSeen = new Set();
function colNear(x, z, r) {
  const s = COL.cell, out = []; _colSeen.clear();
  for (let gx = Math.floor((x - r) / s); gx <= Math.floor((x + r) / s); gx++) for (let gz = Math.floor((z - r) / s); gz <= Math.floor((z + r) / s); gz++) {
    const a = COL.grid.get(gx + ',' + gz); if (!a) continue;
    for (const c of a) if (!_colSeen.has(c)) { _colSeen.add(c); out.push(c); }
  }
  return out;
}
// 円を押し出す（y：足もとの高さ。低い物は飛びこえられる）
function pushOut(p, r, y = 0, hit) {
  let moved = false;
  for (const c of colNear(p.x, p.z, r + 1)) {
    if (c.h < y + 0.35) continue;
    const qx = clamp(p.x, c.x0, c.x1), qz = clamp(p.z, c.z0, c.z1), dx = p.x - qx, dz = p.z - qz, d = Math.hypot(dx, dz);
    if (d >= r) continue;
    if (d > 1e-4) { p.x = qx + dx / d * r; p.z = qz + dz / d * r; if (hit) hit(c, dx / d, dz / d, r - d); }
    else { // 中に入っている：いちばん近い辺から出す
      const ox = [p.x - c.x0, c.x1 - p.x], oz = [p.z - c.z0, c.z1 - p.z], m = Math.min(ox[0], ox[1], oz[0], oz[1]);
      let nx = 0, nz = 0;
      if (m === ox[0]) { p.x = c.x0 - r; nx = -1; } else if (m === ox[1]) { p.x = c.x1 + r; nx = 1; } else if (m === oz[0]) { p.z = c.z0 - r; nz = -1; } else { p.z = c.z1 + r; nz = 1; }
      if (hit) hit(c, nx, nz, r);
    }
    moved = true;
  }
  p.x = clamp(p.x, WORLD_LIM.x0, WORLD_LIM.x1); p.z = clamp(p.z, WORLD_LIM.z0, WORLD_LIM.z1);
  return moved;
}
// 線分と建物（視線・弾・カメラ用）：さえぎる位置（0〜1）か、なければ 1
function segBlock(ax, az, bx, bz, y = 1.5) {
  let best = 1; const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
  const cx = (ax + bx) / 2, cz = (az + bz) / 2;
  for (const c of colNear(cx, cz, len / 2 + 2)) {
    if (c.h < y) continue;
    let t0 = 0, t1 = 1;
    for (const [p, d, lo, hi] of [[ax, dx, c.x0, c.x1], [az, dz, c.z0, c.z1]]) {
      if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) { t0 = 2; break; } continue; }
      let ta = (lo - p) / d, tb = (hi - p) / d; if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) break;
    }
    if (t0 <= t1 && t0 < best) best = t0;
  }
  return best;
}

// ---------- ジオメトリをまとめる入れもの（材質 × 区画） ----------
const BK = new Map();
const CHUNK = 144;
const chunkOf = (x, z) => Math.floor((x + 300) / CHUNK) + ',' + Math.floor((z + 300) / CHUNK);
function bucket(mat, x, z) {
  const k = mat + '|' + chunkOf(x, z); let b = BK.get(k);
  if (!b) { b = { mat, pos: [], nor: [], uv: [], col: [], auv: mat === 'facade' ? [] : null, cast: true }; BK.set(k, b); }
  return b;
}
const _m4 = new THREE.Matrix4(), _n3 = new THREE.Matrix3(), _v = new THREE.Vector3(), _nv = new THREE.Vector3(), _q4 = new THREE.Quaternion(), _e4 = new THREE.Euler();
const GEO = { box: new THREE.BoxGeometry(1, 1, 1) };
// geo を位置 pos・回転 rot・大きさ scl で置く。tint=色、o.uvs=UVの1単位の長さ、o.uv='keep' で元のUV
function addGeo(mat, geo, pos, rot = 0, scl = null, tint = [1, 1, 1], o = {}) {
  _q4.setFromEuler(_e4.set(Array.isArray(rot) ? rot[0] : 0, Array.isArray(rot) ? rot[1] : rot, Array.isArray(rot) ? rot[2] : 0, o.order || 'XYZ'));
  _m4.compose(_v.set(pos[0], pos[1], pos[2]), _q4, scl ? _nv.set(scl[0], scl[1], scl[2]) : _nv.set(1, 1, 1));
  _n3.getNormalMatrix(_m4);
  const b = bucket(mat, pos[0], pos[2]);
  const P = geo.attributes.position, N = geo.attributes.normal, UV = geo.attributes.uv, I = geo.index;
  const n = I ? I.count : P.count, s = o.uvs || 3, sv = o.uvsV || s, grime = o.grime !== false, base = o.base != null ? o.base : 0;
  for (let k = 0; k < n; k++) {
    const i = I ? I.getX(k) : k;
    _v.fromBufferAttribute(P, i).applyMatrix4(_m4); _nv.fromBufferAttribute(N, i).applyMatrix3(_n3).normalize();
    b.pos.push(_v.x, _v.y, _v.z); b.nor.push(_nv.x, _nv.y, _nv.z);
    if (o.uv === 'keep') b.uv.push(UV.getX(i) * (o.uvs || 1), UV.getY(i) * (o.uvsV || 1));
    else {
      const ax = Math.abs(_nv.x), ay = Math.abs(_nv.y), az = Math.abs(_nv.z); let u, v;
      if (ax >= ay && ax >= az) { u = _v.z; v = _v.y; } else if (ay >= az) { u = _v.x; v = _v.z; } else { u = _v.x; v = _v.y; }
      if (o.swap) [u, v] = [v, u];
      b.uv.push(u / s, v / sv);
    }
    const g = grime ? 0.6 + 0.4 * smooth(0.0, 2.2, _v.y - base) : 1;
    b.col.push(tint[0] * g, tint[1] * g, tint[2] * g);
    if (b.auv) b.auv.push(0, 0);
  }
}
const boxAt = (mat, cx, cy, cz, w, h, d, rot = 0, tint = [1, 1, 1], o = {}) => addGeo(mat, GEO.box, [cx, cy, cz], rot, [w, h, d], tint, o);
// 外壁の面：外向きの法線 (nx,nz)、始点 (sx,sz) から長さ len、高さ y0 から floors 階
const FH = 3.1;
function facade(nx, nz, sx, sz, len, y0, floors, pickCell, tint, o = {}) {
  const dx = nz, dz = -nx, nb = Math.max(1, Math.round(len / 3.2)), bw = len / nb, fh = o.fh || FH;
  const b = bucket('facade', sx + dx * len / 2, sz + dz * len / 2), N = ATL.N, pad = 2 / 1024;
  for (let f = 0; f < floors; f++) for (let k = 0; k < nb; k++) {
    const cellId = pickCell(f, k, nb), cu = cellId % N, cv = (cellId / N) | 0;
    const u0 = cu / N + pad, u1 = (cu + 1) / N - pad, v1 = 1 - cv / N - pad, v0 = 1 - (cv + 1) / N + pad;
    const ax = sx + dx * k * bw, az = sz + dz * k * bw, bx = ax + dx * bw, bz = az + dz * bw, ya = y0 + f * fh, yb = ya + fh;
    const along0 = k * bw, along1 = along0 + bw;
    const quad = [[ax, ya, az, along0, u0, v0], [bx, ya, bz, along1, u1, v0], [bx, yb, bz, along1, u1, v1], [ax, ya, az, along0, u0, v0], [bx, yb, bz, along1, u1, v1], [ax, yb, az, along0, u0, v1]];
    for (const [x, y, z, al, au, av] of quad) {
      b.pos.push(x, y, z); b.nor.push(nx, 0, nz); b.uv.push((al + (o.uOff || 0)) / 3, y / 3); b.auv.push(au, av);
      const g = 0.6 + 0.4 * smooth(0.0, 2.2, y - (o.base || 0)); b.col.push(tint[0] * g, tint[1] * g, tint[2] * g);
    }
  }
  return { nb, bw, dx, dz };
}
// 4面の外壁（矩形の建物）
function facades4(x0, z0, x1, z1, floors, pick, tint, o = {}) {
  const res = {};
  res.n = facade(0, -1, x1, z0, x1 - x0, o.y0 || 0, floors, (f, k, nb) => pick('n', f, k, nb), tint, o);
  res.s = facade(0, 1, x0, z1, x1 - x0, o.y0 || 0, floors, (f, k, nb) => pick('s', f, k, nb), tint, o);
  res.w = facade(-1, 0, x0, z0, z1 - z0, o.y0 || 0, floors, (f, k, nb) => pick('w', f, k, nb), tint, o);
  res.e = facade(1, 0, x1, z1, z1 - z0, o.y0 || 0, floors, (f, k, nb) => pick('e', f, k, nb), tint, o);
  return res;
}
const C = ATL.cells;
const TINTS = [[1, .97, .92], [.95, .93, .9], [1.02, .99, .95], [.97, .94, .9], [1.08, .9, .76], [1.1, .82, .66], [.98, .96, .93], [1.05, 1.0, .9], [.92, .9, .86], [1.12, .74, .55]];
const TRIM = [1.1, 1.07, 1.02];
const mulT = (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
const AWN = [[.78, .22, .18], [.2, .45, .32], [.22, .33, .55], [.86, .66, .28], [.55, .25, .45], [.85, .82, .75]];

// 屋上：パラペット・コーニス・給水タンク・室外機・アンテナ
function roofTop(x0, z0, x1, z1, H, tint) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0, t = mulT(TRIM, tint);
  boxAt('plaster', cx, H + 0.14, cz, w + 0.3, 0.28, d + 0.3, 0, t, { base: -10 });   // 軒の帯
  boxAt('plaster', cx, H + 0.6, z0 + 0.12, w, 0.7, 0.24, 0, tint, { base: -10 }); boxAt('plaster', cx, H + 0.6, z1 - 0.12, w, 0.7, 0.24, 0, tint, { base: -10 });
  boxAt('plaster', x0 + 0.12, H + 0.6, cz, 0.24, 0.7, d, 0, tint, { base: -10 }); boxAt('plaster', x1 - 0.12, H + 0.6, cz, 0.24, 0.7, d, 0, tint, { base: -10 });
  const r = R();
  if (r < 0.7) { const tx = x0 + 1.4 + R() * (w - 2.8), tz = z0 + 1.4 + R() * (d - 2.8); addGeo('metal', new THREE.CylinderGeometry(0.6, 0.6, 1.3, 14), [tx, H + 0.95, tz], 0, null, R() < .5 ? [1.8, 1.8, 1.75] : [.5, .5, .5], { uv: 'keep', grime: false }); addGeo('metal', new THREE.CylinderGeometry(0.05, 0.05, 0.6, 5), [tx + 0.5, H + 0.3, tz], 0, null, [.7, .7, .7], { uv: 'keep', grime: false }); }
  if (R() < 0.6) boxAt('ac', x0 + 1 + R() * (w - 2), H + 0.35, z0 + 1 + R() * (d - 2), 0.8, 0.6, 0.6, R() * 3, [1, 1, 1], { grime: false });
  if (R() < 0.35) { const dx = x0 + 1 + R() * (w - 2), dz = z0 + 1 + R() * (d - 2); addGeo('ac', new THREE.CylinderGeometry(0.45, 0.1, 0.12, 14), [dx, H + 0.9, dz], [0.9, R() * 3, 0], null, [1, 1, 1], { uv: 'keep', grime: false }); }
  if (R() < 0.25 && w > 6 && d > 6) { boxAt('plaster', x0 + 2.2, H + 1.25, z0 + 2.2, 2.6, 2.5, 2.6, 0, tint, { base: H }); }
}
// 旧市街の建物（2〜4階）
function oldHouse(x0, z0, x1, z1, floors, streets, o = {}) {
  const tint = o.tint || pick(TINTS, R), H = floors * FH;
  const pickC = (side, f, k) => {
    const street = streets.includes(side), alley = (o.alleys || []).includes(side);
    if (!street && !alley) return R() < 0.85 ? C.plain : pick([C.small, C.vent, C.bars], R);
    if (f === 0) {
      if (street) return pick([C.door, C.rolling, C.shop, C.rolling, C.arch, C.plain, C.bars], R);
      return pick([C.door, C.plain, C.bars, C.vent, C.plain], R);
    }
    const r = R();
    return r < .14 ? C.shutG : r < .26 ? C.shutB : r < .38 ? C.openSh : r < .5 ? C.bars : r < .6 ? C.ac : r < .68 ? C.lattice : r < .76 ? C.glass : r < .82 ? C.small : r < .88 ? C.balcony : C.plain;
  };
  const cells = {};
  const res = facades4(x0, z0, x1, z1, floors, (side, f, k, nb) => { const c = pickC(side, f, k); (cells[side] ||= []).push([f, k, c]); return c; }, tint);
  // 1階の帯・各階の帯（「砂の路地」の水平の目地）
  const bandW = (side, fn) => { };
  for (let f = 1; f < floors; f++) {
    for (const [nx, nz, sx, sz, len] of [[0, -1, x0, z0, x1 - x0], [0, 1, x0, z1, x1 - x0], [-1, 0, x0, z0, z1 - z0], [1, 0, x1, z0, z1 - z0]]) {
      const cx = nx ? sx + nx * 0.07 : (x0 + x1) / 2, cz = nz ? sz + nz * 0.07 : (z0 + z1) / 2;
      boxAt('plaster', cx, f * FH, cz, nx ? 0.14 : len, 0.16, nx ? len : 0.14, 0, mulT(TRIM, tint));
    }
  }
  void bandW;
  // 通りに面した1階の店：ひさし、上の階：バルコニー
  for (const side of streets) {
    const r = res[side], nx = side === 'e' ? 1 : side === 'w' ? -1 : 0, nz = side === 's' ? 1 : side === 'n' ? -1 : 0;
    const sx = side === 'n' ? x1 : side === 's' ? x0 : side === 'w' ? x0 : x1, sz = side === 'n' ? z0 : side === 's' ? z1 : side === 'w' ? z0 : z1;
    for (const [f, k, c] of cells[side] || []) {
      const mx = sx + r.dx * (k + 0.5) * r.bw + nx * 0.6, mz = sz + r.dz * (k + 0.5) * r.bw + nz * 0.6;
      if (f === 0 && (c === C.shop || c === C.rolling) && R() < 0.75) {
        const col = pick(AWN, R), w = r.bw * 0.92;
        addGeo('fabric', GEO.box, [sx + r.dx * (k + 0.5) * r.bw + nx * 0.75, 2.92, sz + r.dz * (k + 0.5) * r.bw + nz * 0.75], [nz ? -nz * 0.35 : 0, 0, nx ? nx * 0.35 : 0], [nx ? 1.5 : w, 0.05, nx ? w : 1.5], col, { grime: false, uvs: 1 });
      }
      if (f > 0 && c === C.balcony) {
        const by = f * FH + 0.12, w = r.bw * 0.82, t = mulT(TRIM, tint);
        boxAt('plaster', mx, by, mz, nx ? 1.1 : w, 0.16, nx ? w : 1.1, 0, t);
        boxAt('plaster', mx + nx * 0.5, by + 0.52, mz + nz * 0.5, nx ? 0.08 : w, 0.9, nx ? w : 0.08, 0, tint);
        for (const s of [-1, 1]) boxAt('plaster', mx + (nx ? 0 : r.dx * s * w / 2) - nx * 0.0, by + 0.52, mz + (nz ? 0 : r.dz * s * w / 2), nx ? 1.0 : 0.08, 0.9, nx ? 0.08 : 1.0, 0, tint);
      }
    }
  }
  // 屋根の床
  boxAt('plaster', (x0 + x1) / 2, H - 0.05, (z0 + z1) / 2, x1 - x0 - 0.02, 0.1, z1 - z0 - 0.02, 0, tint, { base: -10 });
  roofTop(x0, z0, x1, z1, H, tint);
  // 雨どい
  if (R() < 0.6) addGeo('metal', new THREE.CylinderGeometry(0.055, 0.055, H, 8), [x0 + 0.35, H / 2, (streets.includes('n') ? z0 - 0.12 : z1 + 0.12)], 0, null, [.55, .5, .45], { uv: 'keep' });
  addCol(x0, z0, x1, z1, H + 0.8);
  return { H, tint };
}
// 中層の建物（4〜7階、横長の窓・店）
const MID_TINTS = [[1.12, .86, .66], [1.15, .74, .55], [.98, .98, .96], [1.06, .96, .8], [.9, .88, .84], [1.1, .84, .76], [1.02, .92, .7], [.86, .9, .92]];
function midBuilding(x0, z0, x1, z1, floors, streets, o = {}) {
  const tint = o.tint || pick(MID_TINTS, R), H = floors * FH;
  const style = R();
  facades4(x0, z0, x1, z1, floors, (side, f) => {
    const street = streets.includes(side);
    if (f === 0) return street ? pick([C.shop, C.shop, C.rolling, C.arch, C.glass], R) : pick([C.plain, C.vent, C.door], R);
    if (!street && R() < 0.5) return pick([C.plain, C.small, C.ac], R);
    if (style < 0.45) return R() < 0.8 ? C.band : C.ac;
    if (style < 0.75) return pick([C.glass, C.glass, C.ac, C.balcony, C.shutB], R);
    return pick([C.lattice, C.glass, C.bars, C.balcony], R);
  }, tint);
  for (let f = 1; f < floors; f++) {
    boxAt('plaster', (x0 + x1) / 2, f * FH, (z0 + z1) / 2, x1 - x0 + 0.2, 0.18, z1 - z0 + 0.2, 0, mulT(TRIM, tint));
  }
  // 店のひさし（連続した帯）
  for (const side of streets) {
    const nx = side === 'e' ? 1 : side === 'w' ? -1 : 0, nz = side === 's' ? 1 : side === 'n' ? -1 : 0;
    const len = nx ? z1 - z0 : x1 - x0, cx = nx ? (nx > 0 ? x1 : x0) + nx * 0.8 : (x0 + x1) / 2, cz = nz ? (nz > 0 ? z1 : z0) + nz * 0.8 : (z0 + z1) / 2;
    if (R() < 0.7) addGeo('fabric', GEO.box, [cx, 3.0, cz], [nz ? -nz * 0.3 : 0, 0, nx ? nx * 0.3 : 0], [nx ? 1.7 : len - 1, 0.05, nx ? len - 1 : 1.7], pick(AWN, R), { grime: false, uvs: 1 });
  }
  boxAt('plaster', (x0 + x1) / 2, H - 0.05, (z0 + z1) / 2, x1 - x0 - 0.02, 0.1, z1 - z0 - 0.02, 0, tint, { base: -10 });
  roofTop(x0, z0, x1, z1, H, tint);
  addCol(x0, z0, x1, z1, H + 0.8);
  return { H, tint };
}
// 高層ビル（基壇＋ガラスの塔）
function tower(cx, cz, w, d, H, podH) {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  addGeo('tower', GEO.box, [cx, podH + (H - podH) / 2, cz], 0, [w, H - podH, d], [1, 1, 1], { uvs: 6, uvsV: 14.4, grime: false });
  // 階ごとの細い帯と、てっぺんの冠
  boxAt('stone', cx, H + 0.6, cz, w + 0.4, 1.2, d + 0.4, 0, [1.05, 1.02, .98], { grime: false });
  boxAt('tower', cx, H + 4.5, cz, w * 0.7, 7, d * 0.7, 0, [1, 1, 1], { uvs: 6, uvsV: 14.4, grime: false });
  boxAt('stone', cx, H + 8.3, cz, w * 0.74, 0.6, d * 0.74, 0, [1.05, 1.02, .98], { grime: false });
  if (R() < 0.6) addGeo('metal', new THREE.CylinderGeometry(0.15, 0.3, 14, 8), [cx, H + 15, cz], 0, null, [.8, .8, .8], { uv: 'keep', grime: false });
  for (let y = podH + 14.4; y < H; y += 14.4 * 2) boxAt('stone', cx, y, cz, w + 0.25, 0.35, d + 0.25, 0, [1.08, 1.05, 1], { grime: false });
  addCol(x0, z0, x1, z1, H + 9);
}
// 街灯
function streetLamp(x, z, ang) {
  const dx = Math.sin(ang), dz = Math.cos(ang);
  addGeo('metal', new THREE.CylinderGeometry(0.07, 0.11, 6.5, 8), [x, 3.25 + 0.15, z], 0, null, [.45, .44, .42], { uv: 'keep', grime: false });
  boxAt('metal', x + dx * 0.9, 6.55, z + dz * 0.9, Math.abs(dz) * 0.08 + Math.abs(dx) * 1.8, 0.08, Math.abs(dx) * 0.08 + Math.abs(dz) * 1.8, 0, [.45, .44, .42], { grime: false });
  boxAt('lamp', x + dx * 1.7, 6.42, z + dz * 1.7, 0.5, 0.14, 0.32, ang, [1, 1, 1], { grime: false });
  addCol(x - 0.12, z - 0.12, x + 0.12, z + 0.12, 6.6, 'pole');
}
// ヤシの木
const FROND_GEO = (() => {
  const g = new THREE.PlaneGeometry(0.9, 4.2, 1, 8); g.translate(0, 2.1, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = y / 4.2; p.setZ(i, t * t * 1.9); p.setX(i, p.getX(i) * (0.4 + Math.sin(t * Math.PI) * 0.9)); }
  g.computeVertexNormals(); return g;
})();
function palm(x, z, h = 7 + R() * 4, y0 = 0) {
  const lean = (R() - .5) * 0.25, la = R() * TAU, segs = 6;
  let px = x, pz = z;
  for (let s = 0; s < segs; s++) {
    const t = s / segs, y = y0 + h * (t + 0.5 / segs), off = Math.sin(t * 1.4) * lean * h;
    addGeo('bark', new THREE.CylinderGeometry(0.19 - 0.04 * t, 0.23 - 0.04 * t, h / segs + 0.05, 9), [x + Math.cos(la) * off, y, z + Math.sin(la) * off], [Math.sin(la) * lean * .6, 0, -Math.cos(la) * lean * .6], null, [1, 1, 1], { uv: 'keep', uvs: 2, uvsV: 0.6, grime: false });
    px = x + Math.cos(la) * off; pz = z + Math.sin(la) * off;
  }
  const top = y0 + h;
  const n = 11 + (R() * 4 | 0), tint = [0.85 + R() * .25, 0.9 + R() * .15, 0.75 + R() * .2];
  for (let k = 0; k < n; k++) {
    const a = k / n * TAU + R() * .3, tilt = 0.55 + R() * 0.55;
    addGeo('frond', FROND_GEO, [px, top - 0.2, pz], [tilt, a, 0], [1, 1, 1], tint, { uv: 'keep', grime: false, order: 'YXZ' });
  }
  for (let k = 0; k < 4; k++) addGeo('bark', new THREE.SphereGeometry(0.17, 7, 5), [px + Math.cos(k * 1.6) * 0.25, top - 0.45, pz + Math.sin(k * 1.6) * 0.25], 0, null, [.6, .45, .25], { uv: 'keep', grime: false });
  addCol(px - 0.3, pz - 0.3, px + 0.3, pz + 0.3, top, 'pole');
}
// 低い物（ドラム缶・土嚢・木箱）
function barrel(x, z) {
  addGeo('metal', new THREE.CylinderGeometry(0.29, 0.29, 0.88, 16), [x, 0.44, z], [0, R() * 6, 0], null, [1.1, .62, .4], { uv: 'keep', uvs: 2, grime: false });
  for (const y of [0.22, 0.66]) addGeo('metal', new THREE.TorusGeometry(0.295, 0.015, 4, 16), [x, y, z], [Math.PI / 2, 0, 0], null, [.85, .55, .4], { uv: 'keep', grime: false });
  addCol(x - 0.32, z - 0.32, x + 0.32, z + 0.32, 0.9, 'low');
}
function crates(x, z) {
  for (const [dx, dz, y] of [[0, 0, 0.35], [0.75, 0.1, 0.35], [0.35, 0.05, 1.05]]) boxAt('wood', x + dx, y, z + dz, 0.7, 0.7, 0.7, R() * .4, [.7, .6, .48], { uvs: 0.9, grime: false });
  addCol(x - 0.4, z - 0.4, x + 1.15, z + 0.45, 1.4, 'low');
}
// 電線（路地を横切る）
function cable(ax, ay, az, bx, by, bz) {
  const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz), mid = a.clone().add(b).multiplyScalar(.5); mid.y -= 0.9;
  addGeo('cable', new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 16, 0.013, 4), [0, 0, 0], 0, null, [1, 1, 1], { uv: 'keep', grime: false });
}
const SIGNS = [['مقهى', 'カフェ', '#5a2e1c'], ['مطعم', 'レストラン', '#1f4a3a'], ['صيدلية', '薬局', '#1d5a3a'], ['مخبز', 'パン屋', '#6a4a1c'], ['عطور', '香水', '#4a1f4a'], ['ذهب', '金細工', '#2a2a2a'], ['سوق', '市場', '#6a2a1e'], ['بقالة', '食料品', '#1f3d4a'], ['حلويات', 'お菓子', '#7a2e3c'], ['تمور', 'なつめやし', '#5a3c1a'], ['قهوة', 'コーヒー', '#3a2416'], ['أقمشة', '布地', '#2e3c6a']];
const SIGN_MESH = [];
function signAt(x, y, z, ang, s, w = 3.2, h = 0.8) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: makeSign(s[0], s[1], s[2]), roughness: 0.6 }));
  m.position.set(x, y, z); m.rotation.y = ang; m.receiveShadow = true; scene.add(m); SIGN_MESH.push(m); return m;
}

// ---------- 区画ごとの中身 ----------
const PLACES = {};          // 名前のある場所（ミッション・地図・戻り先）
const PARK = [];            // 路上駐車の場所
const CASH = [];            // お金の袋の場所
function fillBlock(i, j) {
  const b = blockRect(i, j), d = DIST[i + ',' + j], cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, W = b.x1 - b.x0;
  const ground = (mat, tint = [1, 1, 1]) => addGeo(mat, GEO.box, [cx, 0.06, cz], 0, [W, 0.12, b.z1 - b.z0], tint, { uvs: mat === 'sand' ? 2.6 : 3, grime: false });
  if (d === 'old' || d === 'garage') {
    ground('sand');
    // 真ん中に路地（x 方向）。北と南の2列に家が並ぶ
    const az0 = cz - 2.8, az1 = cz + 2.8;
    for (const [z0, z1, street, alley] of [[b.z0, az0, 'n', 's'], [az1, b.z1, 's', 'n']]) {
      let x = b.x0;
      while (x < b.x1 - 0.5) {
        let w = 8 + R() * 8; if (b.x1 - (x + w) < 6) w = b.x1 - x;
        const ends = [];
        if (x === b.x0) ends.push('w'); if (x + w >= b.x1 - 0.01) ends.push('e');
        const isGarage = d === 'garage' && street === 's' && x === b.x0;
        if (isGarage) {
          const t = [1.05, 1.0, .92];
          oldHouse(x, z0, x + w, z1, 2, [street, ...ends], { tint: t, alleys: [alley] });
          PLACES.garage = { x: x + w / 2, z: z1 + 1.3, name: 'ナビールの店' };
          signAt(x + w / 2, 3.5, z1 + 0.09, 0, ['مرآب نبيل', 'ナビール自動車', '#7a3a14'], 4.6, 0.75);
        } else oldHouse(x, z0, x + w, z1, 2 + (R() * 3 | 0), [street, ...ends], { alleys: [alley] });
        if (street === 's' && R() < 0.3) signAt(x + w / 2, 3.45, z1 + 0.09, 0, pick(SIGNS, R), Math.min(3.2, w * 0.5), 0.6);
        if (street === 'n' && R() < 0.3) signAt(x + w / 2, 3.45, z0 - 0.09, Math.PI, pick(SIGNS, R), Math.min(3.2, w * 0.5), 0.6);
        x += w;
      }
    }
    // 路地の小物と電線（「砂の路地」の雰囲気）
    for (let k = 0; k < 3; k++) { const x = b.x0 + 4 + R() * (W - 8); if (R() < .5) barrel(x, az0 + 0.6); else crates(x, az1 - 1.3); }
    for (let k = 0; k < 4; k++) { const x = b.x0 + 4 + k * (W - 8) / 3 + R() * 3; cable(x, 6 + R() * 1.5, az0 + 0.05, x + 2 + R() * 3, 6 + R() * 1.5, az1 - 0.05); }
    if (R() < 0.5) CASH.push({ x: b.x0 + 3 + R() * (W - 6), z: cz });
    PLACES['alley' + i + j] = { x: b.x0 + 3, z: cz };
  } else if (d === 'mid' || d === 'hospital' || d === 'police') {
    ground('pavers');
    // 外まわりに建物、中庭
    const depth = 15;
    const special = d === 'hospital' || d === 'police';
    const segs = [];
    for (const [z0, z1, st] of [[b.z0, b.z0 + depth, 'n'], [b.z1 - depth, b.z1, 's']]) {
      let x = b.x0;
      while (x < b.x1 - 0.5) { let w = 12 + R() * 12; if (b.x1 - (x + w) < 8) w = b.x1 - x; segs.push([x, z0, x + w, z1, [st, ...(x === b.x0 ? ['w'] : []), ...(x + w >= b.x1 - .01 ? ['e'] : [])]]); x += w; }
    }
    for (const [x0, x1, st] of [[b.x0, b.x0 + depth, 'w'], [b.x1 - depth, b.x1, 'e']]) segs.push([x0, b.z0 + depth, x1, b.z1 - depth, [st]]);
    segs.forEach(([x0, z0, x1, z1, st], k) => {
      if (special && k === 0) {
        const t = d === 'hospital' ? [1.12, 1.12, 1.1] : [.92, .96, 1.06];
        midBuilding(x0, z0, x1, z1, d === 'hospital' ? 6 : 4, st, { tint: t });
        const s = d === 'hospital' ? ['مستشفى', '病院', '#1d5a3a'] : ['شرطة', '警察署', '#1f3566'];
        signAt((x0 + x1) / 2, 4.2, z0 - 0.08, Math.PI, s, 5, 1.2);
        PLACES[d] = { x: (x0 + x1) / 2, z: z0 - 1.3, name: d === 'hospital' ? '病院' : '警察署' };
      } else midBuilding(x0, z0, x1, z1, 4 + (R() * 4 | 0), st);
    });
    for (let k = 0; k < 3; k++) palm(cx - 10 + R() * 20, cz - 6 + R() * 12, 6 + R() * 3, 0.12);
    if (R() < 0.3) CASH.push({ x: cx, z: cz });
  } else if (d === 'tower' || d === 'hotel') {
    ground('pavers', [1.05, 1.03, 1]);
    const podH = 2 * FH;
    // 基壇
    facades4(b.x0 + 2, b.z0 + 2, b.x1 - 2, b.z1 - 2, 2, (side, f) => (f === 0 ? pick([C.shop, C.shop, C.arch, C.glass], R) : C.band), [1.06, 1.04, 1.0]);
    boxAt('stone', cx, podH + 0.2, cz, W - 3.6, 0.4, b.z1 - b.z0 - 3.6, 0, [1.05, 1.02, .98], { grime: false });
    addCol(b.x0 + 2, b.z0 + 2, b.x1 - 2, b.z1 - 2, podH + 0.4);
    if (d === 'hotel') {
      tower(cx, cz, 26, 22, 96, podH);
      signAt(cx, podH + 1.6, b.z1 - 1.9, 0, ['فندق السراب', 'ホテル・ミラージュ', '#2a2a3a'], 7, 1.6);
      PLACES.hotel = { x: cx, z: b.z1 + 1.3, name: 'ホテル・ミラージュ' };
    } else {
      const n = R() < 0.5 ? 1 : 2;
      if (n === 1) tower(cx + (R() - .5) * 8, cz + (R() - .5) * 8, 20 + R() * 10, 20 + R() * 10, 50 + R() * 80, podH);
      else { tower(cx - 13, cz - 8, 18 + R() * 4, 18 + R() * 4, 45 + R() * 60, podH); tower(cx + 13, cz + 9, 18 + R() * 4, 18 + R() * 4, 55 + R() * 70, podH); }
    }
  } else if (d === 'plaza') {
    ground('pavers', [1.08, 1.04, .98]);
    // 北側にドームの大広間
    const hx0 = cx - 17, hx1 = cx + 17, hz0 = b.z0 + 2, hz1 = b.z0 + 20;
    facades4(hx0, hz0, hx1, hz1, 3, (side, f) => (f === 0 ? C.arch : f === 1 ? C.lattice : C.small), [1.08, 1.02, .9], { fh: 3.6 });
    boxAt('plaster', cx, 10.8, (hz0 + hz1) / 2, 34.4, 0.4, 18.4, 0, [1.12, 1.06, .95], { base: -10 });
    addGeo('stone', new THREE.CylinderGeometry(7.2, 7.2, 4, 24, 1, true), [cx, 13, (hz0 + hz1) / 2], 0, null, [1.05, 1, .95], { uv: 'keep', uvs: 8, uvsV: 1.3 });
    addGeo('tile', new THREE.SphereGeometry(7.6, 32, 16, 0, TAU, 0, Math.PI / 2), [cx, 15, (hz0 + hz1) / 2], 0, null, [1, 1, 1], { uv: 'keep', grime: false });
    addGeo('gold', new THREE.CylinderGeometry(0.05, 0.35, 3, 8), [cx, 23.8, (hz0 + hz1) / 2], 0, null, [1, 1, 1], { uv: 'keep', grime: false });
    addGeo('gold', new THREE.SphereGeometry(0.35, 12, 8), [cx, 22.6, (hz0 + hz1) / 2], 0, null, [1, 1, 1], { uv: 'keep', grime: false });
    addCol(hx0, hz0, hx1, hz1, 24);
    // 角の高い塔
    const tx = hx1 + 5, tz = hz0 + 3;
    boxAt('stone', tx, 17, tz, 4.2, 34, 4.2, 0, [1, 1, 1], { uvs: 2.5 });
    boxAt('stone', tx, 26, tz, 5.6, 0.5, 5.6, 0, [1.05, 1, .95]); boxAt('stone', tx, 26.9, tz, 5.4, 1.2, 0.16, 0, [1.05, 1, .95]);
    boxAt('stone', tx, 34.2, tz, 5, 0.4, 5, 0, [1.05, 1, .95]);
    addGeo('stone', new THREE.CylinderGeometry(1.5, 1.6, 4, 12), [tx, 36.4, tz], 0, null, [1.05, 1, .95], { uv: 'keep', uvs: 4 });
    addGeo('tile', new THREE.SphereGeometry(1.7, 16, 8, 0, TAU, 0, Math.PI / 2), [tx, 38.4, tz], 0, null, [1, 1, 1], { uv: 'keep', grime: false });
    addGeo('gold', new THREE.CylinderGeometry(0.03, 0.15, 1.6, 6), [tx, 40.6, tz], 0, null, [1, 1, 1], { uv: 'keep', grime: false });
    addCol(tx - 2.1, tz - 2.1, tx + 2.1, tz + 2.1, 40);
    // 噴水
    const fz = cz + 8;
    addGeo('stone', new THREE.CylinderGeometry(6, 6.2, 0.7, 8), [cx, 0.35, fz], 0, null, [1.05, 1, .95], { uv: 'keep', uvs: 6, uvsV: 1 });
    const water = new THREE.Mesh(new THREE.CircleGeometry(5.6, 8), MAT.water); water.rotation.x = -Math.PI / 2; water.rotation.z = Math.PI / 8; water.position.set(cx, 0.62, fz); scene.add(water);
    addGeo('stone', new THREE.CylinderGeometry(0.5, 0.9, 2.4, 8), [cx, 1.2, fz], 0, null, [1.05, 1, .95], { uv: 'keep', uvs: 3 });
    addGeo('stone', new THREE.CylinderGeometry(1.6, 0.4, 0.4, 8), [cx, 2.5, fz], 0, null, [1.05, 1, .95], { uv: 'keep', uvs: 3 });
    addCol(cx - 6, fz - 6, cx + 6, fz + 6, 0.8, 'low');
    for (let a = 0; a < 2; a++) for (let k = 0; k < 4; k++) palm(cx - 22 + k * 14.6, cz + (a ? 22 : -2), 8 + R() * 2.5, 0.12);
    PLACES.plaza = { x: cx, z: b.z1 + 4, name: '中央広場' };
    CASH.push({ x: cx + 14, z: cz + 14 });
  } else if (d === 'souk') {
    ground('sand', [1.05, 1, .95]);
    // 屋台の通り：2本の通路（十字）を、店の列と布の屋根で囲う
    const half = 2.6;
    const rows = [[b.x0, b.z0, cx - half, cz - half], [cx + half, b.z0, b.x1, cz - half], [b.x0, cz + half, cx - half, b.z1], [cx + half, cz + half, b.x1, b.z1]];
    for (const [x0, z0, x1, z1] of rows) {
      const st = [];
      if (z0 === b.z0) st.push('n'); if (z1 === b.z1) st.push('s'); if (x0 === b.x0) st.push('w'); if (x1 === b.x1) st.push('e');
      const inner = ['n', 's', 'e', 'w'].filter(s => !st.includes(s));
      oldHouse(x0, z0, x1, z1, 2, [...st, ...inner], { tint: pick(TINTS.slice(0, 6), R) });
    }
    // 布の屋根（色とりどりの帯）と吊りランプ
    for (let k = 0; k < 14; k++) {
      const t = -W / 2 + 2 + k * (W - 4) / 13;
      addGeo('fabric', GEO.box, [cx + t, 5.6 + Math.sin(k) * .15, cz], [0.06, 0, 0], [3.4, 0.04, half * 2 + 0.6], pick(AWN, R), { grime: false, uvs: 1 });
      addGeo('fabric', GEO.box, [cx, 5.7 + Math.cos(k) * .15, cz + t], [0, 0, 0.06], [half * 2 + 0.6, 0.04, 3.4], pick(AWN, R), { grime: false, uvs: 1 });
      if (k % 3 === 1) { addGeo('lamp', new THREE.SphereGeometry(0.18, 10, 8), [cx + t, 4.6, cz], 0, null, [1, 1, 1], { uv: 'keep', grime: false }); addGeo('cable', new THREE.CylinderGeometry(0.01, 0.01, 1, 4), [cx + t, 5.1, cz], 0, null, [1, 1, 1], { uv: 'keep', grime: false }); }
    }
    // 屋台（品物の箱）
    for (let k = 0; k < 10; k++) {
      const alongX = k % 2 === 0, t = -W / 2 + 4 + R() * (W - 8), s = R() < .5 ? -1 : 1;
      const x = alongX ? cx + t : cx + s * (half - 0.6), z = alongX ? cz + s * (half - 0.6) : cz + t;
      if (Math.abs(alongX ? t : t) < 4) continue;
      boxAt('wood', x, 0.45, z, alongX ? 1.6 : 0.8, 0.9, alongX ? 0.8 : 1.6, 0, [.75, .62, .48], { uvs: 1, grime: false });
      for (let q = 0; q < 4; q++) boxAt('plant', x + (alongX ? (q - 1.5) * 0.36 : 0), 1.02, z + (alongX ? 0 : (q - 1.5) * 0.36), 0.3, 0.16, 0.3, R(), pick([[1.6, .6, .3], [1.5, 1.2, .3], [.6, 1.1, .3], [1.4, .4, .5], [1.2, .9, .6]], R), { grime: false });
      addCol(x - (alongX ? .8 : .4), z - (alongX ? .4 : .8), x + (alongX ? .8 : .4), z + (alongX ? .4 : .8), 1.1, 'low');
    }
    signAt(cx, 4.4, b.z1 + 0.12, 0, ['السوق القديم', '旧市場（スーク）', '#6a2a1e'], 5, 1.2);
    PLACES.souk = { x: cx, z: b.z1 + 4, name: 'スーク' };
    CASH.push({ x: cx + 8, z: cz });
  } else if (d === 'lot') {
    ground('sand', [1.02, .98, .92]);
    for (let k = 0; k < 6; k++) { const x = b.x0 + 4 + R() * (W - 8), z = b.z0 + 4 + R() * (W - 8); for (let q = 0; q < 6; q++) addGeo('plant', new THREE.IcosahedronGeometry(0.15 + R() * 0.15, 0), [x + (R() - .5) * .8, 0.18, z + (R() - .5) * .8], [R(), R(), R()], null, [.8 + R() * .3, .9, .7], { uvs: 1, grime: false }); }
    for (let k = 0; k < 4; k++) palm(b.x0 + 6 + R() * (W - 12), b.z0 + 6 + R() * (W - 12), 7 + R() * 3, 0.12);
    // 駐車場：区画の中に何台か
    for (let k = 0; k < 4; k++) PARK.push({ x: b.x0 + 8 + k * 6, z: cz + 6, yaw: 0, lot: true });
    for (let k = 0; k < 3; k++) barrel(b.x1 - 4 - k * 0.7, b.z0 + 3);
    CASH.push({ x: cx - 12, z: cz - 10 });
    if (i === 0 && j === 0) PLACES.desertEdge = { x: b.x0 - 30, z: b.z0 - 40, name: '砂漠の外れ' };
  }
}

// ---------- 道路・歩道・ペイント ----------
function buildRoads() {
  const N = CITY.N, P = CITY.P, HR = CITY.HR, E = CITY.E;
  // 交差点
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) addGeo('asphalt', GEO.box, [lineX(i), -0.02, lineX(j)], 0, [HR * 2, 0.08, HR * 2], [1, 1, 1], { uvs: 7, grime: false });
  // 交差点の間
  for (let i = 0; i <= N; i++) for (let j = 0; j < N; j++) {
    const mid = lineX(j) + P / 2, L = P - HR * 2;
    addGeo('asphalt', GEO.box, [lineX(i), -0.02, mid], 0, [HR * 2, 0.08, L], [1, 1, 1], { uvs: 7, grime: false });
    addGeo('asphalt', GEO.box, [mid, -0.02, lineX(i)], 0, [L, 0.08, HR * 2], [1, 1, 1], { uvs: 7, grime: false });
    // 中央の破線
    for (let t = -L / 2 + 2; t < L / 2 - 2; t += 6) {
      boxAt('paint', lineX(i), 0.025, mid + t + 1.5, 0.14, 0.01, 3, 0, [1, .92, .6], { grime: false });
      boxAt('paint', mid + t + 1.5, 0.025, lineX(i), 3, 0.01, 0.14, 0, [1, .92, .6], { grime: false });
    }
    // 横断歩道（区画の角の手前）
    for (const s of [-1, 1]) for (let k = -4; k <= 4; k++) {
      boxAt('paint', lineX(i) + k * 1.1, 0.025, mid + s * (L / 2 - 1.6), 0.55, 0.01, 2.6, 0, [1, 1, 1], { grime: false });
      boxAt('paint', mid + s * (L / 2 - 1.6), 0.025, lineX(i) + k * 1.1, 2.6, 0.01, 0.55, 0, [1, 1, 1], { grime: false });
    }
  }
  // 歩道（区画のまわり。縁石つき）
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x0 = lineX(i) + HR, x1 = lineX(i + 1) - HR, z0 = lineX(j) + HR, z1 = lineX(j + 1) - HR, w = CITY.SWW;
    for (const [cx, cz, sx, sz] of [[(x0 + x1) / 2, z0 + w / 2, x1 - x0, w], [(x0 + x1) / 2, z1 - w / 2, x1 - x0, w], [x0 + w / 2, (z0 + z1) / 2, w, z1 - z0 - 2 * w], [x1 - w / 2, (z0 + z1) / 2, w, z1 - z0 - 2 * w]]) {
      addGeo('pavers', GEO.box, [cx, 0.075, cz], 0, [sx, 0.15, sz], [1, 1, 1], { uvs: 2, grime: false });
    }
    for (const [cx, cz, sx, sz] of [[(x0 + x1) / 2, z0 + 0.1, x1 - x0, 0.2], [(x0 + x1) / 2, z1 - 0.1, x1 - x0, 0.2], [x0 + 0.1, (z0 + z1) / 2, 0.2, z1 - z0], [x1 - 0.1, (z0 + z1) / 2, 0.2, z1 - z0]]) {
      addGeo('stone', GEO.box, [cx, 0.09, cz], 0, [sx, 0.18, sz], [1.15, 1.12, 1.05], { uvs: 1.5, grime: false });
    }
    // 街灯とヤシ（大通り沿い：i=4 と j=4 の線、海沿い）
    const D = DIST[i + ',' + j];
    for (let t = 9; t < P - 2 * HR - 6; t += 22) {
      if (j === 0 || (j + i) % 2 === 0) streetLamp(x0 + t, z0 + 1.2, Math.PI);
      if (i === 3 || i === 4) streetLamp(x1 - 1.2, z0 + t, Math.PI / 2);
      if (j === 7 && t + 11 < x1 - x0 - 4) streetLamp(x0 + t + 11, z1 - 1.2, 0);   // 区画の歩道の中だけ（はみ出すと交差点の横断歩道に立っていた）
    }
    const boulevard = i === 3 || i === 4 || j === 3 || j === 4 || j === 7 || D === 'tower' || D === 'hotel';
    if (boulevard) for (let t = 6; t < P - 2 * HR - 4; t += 15) {
      if (j === 3 || j === 7 || D === 'tower') palm(x0 + t, z1 - 1.25, 7 + R() * 3, 0.15);
      if (i === 3 || D === 'hotel') palm(x1 - 1.25, z0 + t + 4, 7 + R() * 3, 0.15);
    }
    // 路上駐車
    if (R() < 0.6) PARK.push({ x: x0 + 10 + R() * (x1 - x0 - 20), z: lineX(j + 1) - 4.45, yaw: -Math.PI / 2 });
    if (R() < 0.4) PARK.push({ x: lineX(i + 1) - 4.45, z: z0 + 10 + R() * (z1 - z0 - 20), yaw: 0 });
  }
  // 南の海沿い：遊歩道・手すり・砂浜
  const pz0 = E + HR, pz1 = CITY.SEA;
  addGeo('pavers', GEO.box, [E / 2, 0.075, (pz0 + pz1) / 2], 0, [E + 2 * HR + 60, 0.15, pz1 - pz0], [1.05, 1.02, .98], { uvs: 2, grime: false });
  for (let x = -20; x < E + 20; x += 3) { addGeo('stone', new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8), [x, 0.6, pz1 - 0.5], 0, null, [1.15, 1.1, 1], { uv: 'keep' }); }
  boxAt('stone', E / 2, 1.05, pz1 - 0.5, E + 40, 0.12, 0.3, 0, [1.15, 1.1, 1]);
  addCol(-30, pz1 - 0.8, E + 30, pz1 - 0.2, 1.1, 'rail');
  for (let x = 6; x < E; x += 18) palm(x, pz0 + 5, 7 + R() * 4, 0.15);
  for (let x = 30; x < E; x += 72) { boxAt('wood', x, 0.55, pz0 + 9, 2.2, 0.08, 0.6, 0, [.7, .55, .4], { uvs: 1, grime: false }); boxAt('metal', x, 0.3, pz0 + 9, 2.0, 0.5, 0.06, 0, [.4, .4, .4], { grime: false }); }
  PLACES.harbor = { x: E - 40, z: pz0 + 4, name: '海辺の遊歩道' };
  PLACES.corniche = { x: 40, z: pz0 + 4 };
  // 桟橋
  boxAt('wood', E - 40, 0.3, pz1 + 30, 4, 0.3, 60, 0, [.7, .58, .45], { uvs: 1.2, grime: false });
  for (let z = pz1 + 2; z < pz1 + 60; z += 6) for (const s of [-1, 1]) addGeo('wood', new THREE.CylinderGeometry(0.18, 0.18, 3, 8), [E - 40 + s * 1.8, -0.9, z], 0, null, [.55, .45, .35], { uv: 'keep' });
}
// ---------- 地形（砂丘・砂浜・海） ----------
function buildTerrain() {
  const S = 1600, n = 160, g = new THREE.PlaneGeometry(S, S, n, n); g.rotateX(-Math.PI / 2); g.translate(CITY.E / 2, 0, CITY.E / 2);
  const p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 3), r = rng(5), macro = fbm(64, [4, 8, 16], [.5, .3, .2], r);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const inCity = x > -CITY.IN + 1 && x < CITY.E + CITY.IN - 1 && z > -CITY.IN + 1 && z < CITY.E + CITY.IN - 1;
    p.setY(i, inCity ? -0.3 : groundH(x, z) - 0.02);
    const mi = ((((z / S + 0.5) * 64) | 0) & 63) * 64 + ((((x / S + 0.5) * 64) | 0) & 63), k = 0.86 + 0.24 * macro[mi];
    col[i * 3] = k; col[i * 3 + 1] = k * 0.99; col[i * 3 + 2] = k * 0.97;
    uv.setXY(i, x / 2.6, z / 2.6);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, MAT.sand); m.receiveShadow = true; scene.add(m);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 1400), MAT.water); water.rotation.x = -Math.PI / 2; water.position.set(CITY.E / 2, -0.55, CITY.SHORE + 680); scene.add(water);
  CITY.waterMesh = water;
}
// ---------- まとめて Mesh に ----------
function finishBuckets() {
  for (const b of BK.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
    if (b.auv) g.setAttribute('auv', new THREE.Float32BufferAttribute(b.auv, 2));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, MAT[b.mat]);
    m.castShadow = !['asphalt', 'pavers', 'sand', 'paint', 'cable'].includes(b.mat);
    m.receiveShadow = b.mat !== 'cable' && b.mat !== 'lamp';
    scene.add(m);
  }
  BK.clear();
}
// ---------- 道路のグラフ（車の流れ）と歩道の輪（人の流れ） ----------
const ROAD = { nodes: [], adj: [] };
function buildGraph() {
  const N = CITY.N;
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { ROAD.nodes.push({ x: lineX(i), z: lineX(j), i, j }); ROAD.adj.push([]); }
  const id = (i, j) => i * (N + 1) + j;
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
    if (i < N) { ROAD.adj[id(i, j)].push(id(i + 1, j)); ROAD.adj[id(i + 1, j)].push(id(i, j)); }
    if (j < N) { ROAD.adj[id(i, j)].push(id(i, j + 1)); ROAD.adj[id(i, j + 1)].push(id(i, j)); }
  }
  ROAD.id = id;
}
const nearestNode = (x, z) => { let best = 0, bd = 1e9; ROAD.nodes.forEach((n, k) => { const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; best = k; } }); return best; };
// 地図の下絵
let MAPC = null;
const MAP = { x0: -260, z0: -260, size: 1100, px: 1024 };
function buildMapCanvas() {
  const c = newCanvas(MAP.px, MAP.px), g = c.getContext('2d'), s = MAP.px / MAP.size, X = x => (x - MAP.x0) * s, Z = z => (z - MAP.z0) * s;
  g.fillStyle = '#b89a6a'; g.fillRect(0, 0, MAP.px, MAP.px);
  g.fillStyle = '#2f6f86'; g.fillRect(0, Z(CITY.SHORE), MAP.px, MAP.px);
  g.fillStyle = '#d8c39a'; g.fillRect(0, Z(CITY.SEA), MAP.px, Z(CITY.SHORE) - Z(CITY.SEA));
  g.fillStyle = '#cfc4b0'; g.fillRect(X(-CITY.IN), Z(-CITY.IN), (CITY.E + 2 * CITY.IN) * s, (CITY.SEA + CITY.IN) * s);
  for (const c2 of COL.list) { if (c2.kind !== 'bld') continue; g.fillStyle = c2.h > 30 ? '#8e98a2' : '#a99d88'; g.fillRect(X(c2.x0), Z(c2.z0), (c2.x1 - c2.x0) * s, (c2.z1 - c2.z0) * s); }
  g.strokeStyle = '#3b3b3e'; g.lineWidth = CITY.HR * 2 * s;
  for (let i = 0; i <= CITY.N; i++) { g.beginPath(); g.moveTo(X(lineX(i)), Z(-CITY.HR)); g.lineTo(X(lineX(i)), Z(CITY.E + CITY.HR)); g.stroke(); g.beginPath(); g.moveTo(X(-CITY.HR), Z(lineX(i))); g.lineTo(X(CITY.E + CITY.HR), Z(lineX(i))); g.stroke(); }
  MAPC = c;
}
async function buildCity(say) {
  say('道路を敷いています…'); await nextFrame();
  buildGraph(); buildRoads(); await nextFrame();
  say('街並みを組み立てています…'); await nextFrame();
  for (let i = 0; i < CITY.N; i++) { for (let j = 0; j < CITY.N; j++) fillBlock(i, j); if (i % 2) await nextFrame(); }
  buildTerrain();
  say('仕上げています…'); await nextFrame();
  finishBuckets();
  buildMapCanvas();
}
