// =========================================================================================
//  街の外の世界：環状道路と街からの出口、北の山（ジャバル山）と山頂への山道、
//  東の砂漠ハイウェイとオアシスの村（ガソリンスタンド・モスク・池）、西の港（コンテナ・クレーン・倉庫・船）、スタントジャンプの台。
//  地形は高さの関数 natH（砂丘・山・海岸・平らな所）。道路は折れ線（ROAD のノード）で、道路の高さは地形をならして決め（坂の上限つき）、
//  まわりの地形を道路に合わせて削る・盛る（regionH）。街とは別の乱数を使う（街の並び・お金の袋の番号を変えないため）
// =========================================================================================
const RGN = rng(90713);
const rgn = (a, b) => a + RGN() * (b - a);
const BOUNDS = WORLD_LIM;
const SUMMIT = { x: 300, z: -1330 };
const OASIS = { x: 1520, z: 205, pond: { x: 1565, z: 300, r: 34 } };
const PORT = { x0: -900, x1: -330, z0: 430, z1: CITY.SEA + 4 };   // z1 の岸壁の先は海
const REG = { segs: [], grid: new Map(), cell: 64, ramps: [], flats: [], polys: [], built: false, rails: [], railGrid: new Map() };
// 道の種類：半幅、ふつうの速さ（AI）、坂の上限、ノードの間隔
const ROAD_TYPES = {
  ring: { hw: 6.5, vmax: 21, grade: 0.06, step: 14 },
  link: { hw: 5.5, vmax: 14, grade: 0.07, step: 12 },
  mtn: { hw: 5.0, vmax: 12, grade: 0.15, step: 10 },
  desert: { hw: 6.5, vmax: 25, grade: 0.06, step: 16 },
  port: { hw: 6.0, vmax: 13, grade: 0.05, step: 14 },
};
// 海に入れない線（港は岸壁まで）
const seaZ = x => (x > PORT.x0 && x < PORT.x1 ? PORT.z1 - 0.5 : CITY.SHORE - 6);

// ---------- 自然の地形 ----------
// 格子の値ノイズ（0..1）と、尾根の形にした重ね合わせ（岩山のごつごつ。規則的なくり返しにならない）
const _h2 = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h & 0xffff) / 65535; };
function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = _h2(i, j), b = _h2(i + 1, j), c = _h2(i, j + 1), d = _h2(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function ridged(x, z) {
  let s = 0, amp = 1, f = 1, w = 0;
  for (let o = 0; o < 4; o++) { const n = 1 - Math.abs(2 * vnoise(x * f + o * 17.3, z * f - o * 9.1) - 1); s += n * n * amp; w += amp; amp *= 0.5; f *= 2.03; }
  return s / w;
}
function mountH(x, z) {
  const r1 = 1 - Math.abs(Math.sin(x * 0.0043 + Math.sin(z * 0.0029) * 1.6));
  const r2 = 1 - Math.abs(Math.sin(z * 0.0051 - x * 0.0019 + 1.3));
  const base = 0.55 + 0.45 * Math.sin(x * 0.0016 + 0.4) * Math.cos(z * 0.0021 - 0.7);
  const dS = Math.hypot(x - SUMMIT.x, z - SUMMIT.z);
  // 岩のごつごつ（尾根の形の細かい起伏）。高い所ほど強く
  // 山道の通る谷（x≈305 の帯）は尾根を弱めて、山頂へなだらかに上れるように
  const cor = smooth(270, 175, Math.abs(x - 305));
  const h0 = 55 * base + (80 * r1 * r1 + 50 * r2 * r2) * (1 - 0.85 * cor) + 9 * Math.sin(x * 0.021 + z * 0.013) + 4 * Math.sin(x * 0.07 - z * 0.05) + 105 * Math.exp(-dS * dS / (2 * 330 * 330));
  return h0 + (ridged(x / 150, z / 150) - 0.3) * 42 * smooth(20, 110, h0) * (1 - 0.7 * cor);
}
function natH(x, z) {
  const e0 = -CITY.IN, e1 = CITY.E + CITY.IN;
  const out = Math.max(e0 - x, x - e1, e0 - z, 0);
  let h = Math.max(0, duneH(x, z)) * smooth(26, 120, out);
  // 東：大きな砂丘
  const east = smooth(800, 1150, x);
  if (east > 0) h += east * Math.max(0, 8 + 10 * Math.sin(x * 0.0071 + Math.sin(z * 0.0049) * 2.3) * Math.cos(z * 0.0061 + 0.4) + 4.5 * Math.sin(x * 0.019 - z * 0.012));
  // 北：山
  const mn = smooth(-320, -780, z);
  if (mn > 0) h += mn * mountH(x, z);
  // 平らにする所（オアシス・山頂の広場など）
  for (const f of REG.flats) { const d = Math.hypot((x - f.x) / f.rx, (z - f.z) / f.rz); if (d < f.fall) h = lerp(f.h, h, smooth(1, f.fall, d)); }
  // オアシスの池（くぼみ）
  const pd = Math.hypot(x - OASIS.pond.x, z - OASIS.pond.z);
  if (pd < OASIS.pond.r + 8) h = lerp(-1.4, h, smooth(OASIS.pond.r - 8, OASIS.pond.r + 8, pd));
  // 港：コンクリートの平地、岸壁の先は深い海
  const inPortX = x > PORT.x0 - 80 && x < PORT.x1 + 80;
  if (inPortX) {
    const dx = Math.max(PORT.x0 - x, x - PORT.x1, 0), dz = Math.max(PORT.z0 - z, 0), k = smooth(0, 70, Math.hypot(dx, dz));
    if (z > PORT.z1 && dx === 0) return -3.2;
    h = lerp(0.6, h, k);
    if (dx === 0) return h;
  }
  // 南の海岸：砂浜から海へ
  if (z > e1 - 70) { const beach = z < CITY.SEA ? 0.15 : lerp(0.1, -2.6, smooth(CITY.SEA, CITY.SHORE + 30, z)); h = lerp(h, beach, smooth(e1 - 70, CITY.SEA - 4, z)); }
  return h;
}
// ---------- 道路のそば：道路の高さに合わせる（車線の上・路肩は平ら、その外はなだらかにもとの地形へ） ----------
function roadNear(x, z) {
  const a = REG.grid.get(Math.floor(x / REG.cell) + ',' + Math.floor(z / REG.cell)); if (!a) return null;
  let best = null, bd = 1e9, by = 0, bw = 0;
  for (const s of a) {
    const dx = s.bx - s.ax, dz = s.bz - s.az, L2 = dx * dx + dz * dz || 1;
    const t = clamp(((x - s.ax) * dx + (z - s.az) * dz) / L2, 0, 1), px = s.ax + dx * t, pz = s.az + dz * t, d = Math.hypot(x - px, z - pz);
    if (d < bd) { bd = d; by = s.ay + (s.by - s.ay) * t; bw = s.hw; best = s; }
  }
  return best ? { d: bd, y: by, hw: bw } : null;
}
function rampH(r, x, z) {
  const dx = x - r.x, dz = z - r.z, u = dx * r.s + dz * r.c, v = dx * r.c - dz * r.s;
  if (u < 0 || u > r.L || Math.abs(v) > r.W / 2) return -1e9;
  return r.y0 + r.H * (u / r.L);
}
// mesh=true のときは見た目の地面（車線の下は少し低くして、道路の帯の下にかくす）
function regionH(x, z, mesh) {
  let h = natH(x, z);
  if (REG.built) {
    const r = roadNear(x, z);
    if (r) {
      const W = r.hw, F = W + 15, B = F + 30, bed = r.y - 0.1;
      if (r.d < B) h = r.d <= W ? (mesh ? r.y - 0.16 : r.y + 0.02) : r.d <= F ? bed : lerp(bed, h, smooth(F, B, r.d));
    }
  }
  if (!mesh) for (const rp of REG.ramps) { const v = rampH(rp, x, z); if (v > h) h = v; }   // 台は形が別にあるので、見た目の地面には入れない
  return h;
}
// 舗装された所か（車のグリップ）：街の中・港・新しい道路の上・台の上
function onPaved(x, z) {
  if (x > -CITY.IN && x < CITY.E + CITY.IN && z > -CITY.IN && z < CITY.SEA) return true;
  if (x > PORT.x0 && x < PORT.x1 && z > PORT.z0 && z < PORT.z1) return true;
  const r = roadNear(x, z); if (r && r.d < r.hw + 0.8) return true;
  for (const rp of REG.ramps) if (rampH(rp, x, z) > -1e8) return true;
  return false;
}

// ---------- 道路の折れ線（なめらかな曲線にして、一定の間隔でノードにする） ----------
function catmull(pts, step) {
  const P = pts.map(p => ({ x: p[0], z: p[1] })), out = [{ x: P[0].x, z: P[0].z }];
  let acc = 0, prev = P[0];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 1; k <= 24; k++) {
      const t = k / 24, t2 = t * t, t3 = t2 * t;
      const q = { x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
                  z: 0.5 * (2 * p1.z + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3) };
      acc += Math.hypot(q.x - prev.x, q.z - prev.z); prev = q;
      if (acc >= step) { out.push(q); acc = 0; }
    }
  }
  const last = P[P.length - 1], tail = out[out.length - 1];
  if (Math.hypot(tail.x - last.x, tail.z - last.z) < step * 0.5) out[out.length - 1] = { x: last.x, z: last.z }; else out.push({ x: last.x, z: last.z });
  return out;
}
function nearestExt(x, z) { let best = -1, bd = 1e9; ROAD.nodes.forEach((n, k) => { if (!n.ext) return; const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; best = k; } }); return best; }
function roadPoly(pts, type, startNode, endNode) {
  const T = ROAD_TYPES[type], S = catmull(pts, T.step), ids = [];
  S.forEach((p, k) => {
    let id;
    if (k === 0 && startNode != null) id = startNode;
    else if (k === S.length - 1 && endNode != null) id = endNode;
    else { id = ROAD.nodes.length; ROAD.nodes.push({ x: p.x, z: p.z, y: 0, ext: true, vmax: T.vmax, hw: T.hw, grade: T.grade, type }); ROAD.adj.push([]); }
    if (ids.length) { const a = ids[ids.length - 1]; if (a !== id && !ROAD.adj[a].includes(id)) { ROAD.adj[a].push(id); ROAD.adj[id].push(a); } }
    ids.push(id);
  });
  const poly = { ids, type, hw: T.hw }; REG.polys.push(poly); return poly;
}
// 道路の高さ：地形の高さから始めて、となりとならす＋坂の上限。街の交差点（0.02）は動かさない
function solveRoadHeights() {
  const ext = []; ROAD.nodes.forEach((n, k) => { if (n.ext) { n.t = natH(n.x, n.z); n.y = n.t; ext.push(k); } else n.y = 0.02; });
  const clampGrades = () => { for (const k of ext) { const n = ROAD.nodes[k]; for (const j of ROAD.adj[k]) { const m = ROAD.nodes[j], g = Math.min(n.grade || 0.08, m.grade || 0.08) * Math.hypot(n.x - m.x, n.z - m.z); if (n.y > m.y + g) n.y = m.y + g; else if (n.y < m.y - g) n.y = m.y - g; } } };
  for (let it = 0; it < 260; it++) {
    for (const k of ext) { const n = ROAD.nodes[k], nb = ROAD.adj[k]; let s = 0; for (const j of nb) s += ROAD.nodes[j].y; n.y = n.y * 0.5 + (s / nb.length) * 0.5; n.y = lerp(n.y, n.t, 0.2); }
    clampGrades(); clampGrades();
  }
  for (let it = 0; it < 40; it++) clampGrades();
}
function indexRoads() {
  const C = REG.cell;
  for (const poly of REG.polys) for (let k = 1; k < poly.ids.length; k++) {
    const A = ROAD.nodes[poly.ids[k - 1]], B = ROAD.nodes[poly.ids[k]], s = { ax: A.x, az: A.z, ay: A.y, bx: B.x, bz: B.z, by: B.y, hw: poly.hw }, m = poly.hw + 50;
    REG.segs.push(s);
    for (let gx = Math.floor((Math.min(A.x, B.x) - m) / C); gx <= Math.floor((Math.max(A.x, B.x) + m) / C); gx++)
      for (let gz = Math.floor((Math.min(A.z, B.z) - m) / C); gz <= Math.floor((Math.max(A.z, B.z) + m) / C); gz++) {
        const key = gx + ',' + gz; let a = REG.grid.get(key); if (!a) REG.grid.set(key, a = []); a.push(s);
      }
  }
}
function buildRegionRoads() {
  const E = CITY.E, cityId = ROAD.id;
  // 外周の環状道路（北をまわって、東西は海の手前まで）
  roadPoly([[-200, 560], [-200, 120], [-205, -120], [-160, -195], [-60, -210], [288, -205], [640, -210], [740, -190], [778, -110], [776, 140], [776, 560]], 'ring');
  // 街からの出口：北・西2・東2
  const link = (i, j, tx, tz) => { const A = ROAD.nodes[cityId(i, j)], end = nearestExt(tx, tz), B = ROAD.nodes[end]; roadPoly([[A.x, A.z], [(A.x + B.x) / 2, (A.z + B.z) / 2], [B.x, B.z]], 'link', cityId(i, j), end); };
  link(4, 0, 288, -205); link(0, 3, -200, 216); link(0, 6, -200, 432); link(8, 3, 776, 216); link(8, 6, 776, 432);
  // 山道：環状道路の北から、ヘアピンカーブで山頂へ
  const mStart = nearestExt(288, -205), M0 = ROAD.nodes[mStart];
  REG.mtn = roadPoly([[M0.x, M0.z], [300, -330], [240, -470], [140, -560], [230, -650], [430, -700], [470, -800], [320, -860], [180, -930], [230, -1030], [420, -1070], [450, -1170], [330, -1230], [SUMMIT.x, SUMMIT.z - 10]], 'mtn', mStart);
  // 東の砂漠ハイウェイ：オアシスの村を通って、地平線へ
  const dStart = nearestExt(776, 216), D0 = ROAD.nodes[dStart];
  REG.desert = roadPoly([[D0.x, D0.z], [880, 210], [1040, 180], [1220, 225], [1380, 200], [OASIS.x, OASIS.z], [1680, 190], [1880, 150]], 'desert', dStart);
  // 西の港への道（環状道路の西のはしから海ぞいに）
  const pStart = nearestExt(-200, 560), P0 = ROAD.nodes[pStart];
  REG.port = roadPoly([[P0.x, P0.z], [-300, 545], [-420, 520], [-560, 500], [-760, 500], [-860, 470]], 'port', pStart);
  solveRoadHeights();
  indexRoads();
  REG.built = true;
}

// ---------- 道路の帯（アスファルト）と白線・ガードレール ----------
// 折れ線の各点の横向き（となりの点から。区切った帯どうしの継ぎ目がずれないよう、線全体で先に計算する）
function sideDirs(pts) { return pts.map((p, k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1; return { nx: -tz / tl, nz: tx / tl }; }); }
function ribbonGeo(pts, hwFn, yOff, dirs, v0 = 0) {
  const P = [], N = [], U = [], I = [];
  let v = v0;
  for (let k = 0; k < pts.length; k++) {
    const { nx, nz } = dirs[k], p = pts[k], hw = hwFn(k);
    if (k) v += Math.hypot(p.x - pts[k - 1].x, p.z - pts[k - 1].z);
    P.push(p.x - nx * hw, p.y + yOff, p.z - nz * hw, p.x + nx * hw, p.y + yOff, p.z + nz * hw); N.push(0, 1, 0, 0, 1, 0); U.push(0, v / 7, hw * 2 / 7, v / 7);
    if (k) { const i = k * 2; I.push(i - 2, i - 1, i, i - 1, i + 1, i); }   // 上から見て表
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
  return g;
}
function addPiece(mat, g, tint, o = {}) {   // 形の中心で区画（チャンク）に入れる
  g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()); g.translate(-c.x, -c.y, -c.z);
  addGeo(mat, g, [c.x, c.y, c.z], 0, null, tint, Object.assign({ uv: 'keep', grime: false }, o));
}
function buildRegionRoadMeshes() {
  REG.polys.forEach((poly, pi) => {
    const pts = poly.ids.map(id => { const n = ROAD.nodes[id]; return { x: n.x, z: n.z, y: n.y, ext: !!n.ext }; });
    const yOff = 0.03 + pi * 0.004, dirs = sideDirs(pts);
    const lines = [-1, 1].map(side => pts.map((p, k) => ({ x: p.x + dirs[k].nx * side * (poly.hw - 0.35), z: p.z + dirs[k].nz * side * (poly.hw - 0.35), y: p.y })));
    let v0 = 0;
    for (let s = 0; s < pts.length - 1; s += 14) {
      const e = Math.min(pts.length, s + 15), part = pts.slice(s, e), dp = dirs.slice(s, e);
      addPiece('asphalt', ribbonGeo(part, () => poly.hw, yOff, dp, v0), [1, 1, 1]);
      // 端の白線（2本）
      for (const ln of lines) addPiece('paint', ribbonGeo(ln.slice(s, e), () => 0.07, yOff + 0.012, dp), [1, 1, 1]);
      for (let k = s + 1; k < e; k++) v0 += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].z - pts[k - 1].z);
    }
    // 中央の破線（3m 描いて 6m あける）
    let acc = 0;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k], L = Math.hypot(b.x - a.x, b.z - a.z);
      for (let t = 0; t < L; t += 0.5) { const on = (acc + t) % 9 < 3; if (on && ((acc + t) % 9) < 0.5) { const f = t / L, x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f, y = a.y + (b.y - a.y) * f; boxAt('paint', x, y + yOff + 0.015, z, 0.14, 0.01, 3, Math.atan2(b.x - a.x, b.z - a.z), poly.type === 'desert' || poly.type === 'ring' ? [1, .86, .4] : [1, 1, 1], { grime: false }); } }
      acc += L;
    }
    // 山道：谷側にガードレール（柱と横板）
    if (poly.type === 'mtn') for (let k = 1; k < pts.length - 1; k++) {
      const a = pts[k - 1], b = pts[k + 1], tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl, p = pts[k];
      for (const side of [-1, 1]) {
        const ox = p.x + nx * side * (poly.hw + 0.7), oz = p.z + nz * side * (poly.hw + 0.7), drop = p.y - natH(p.x + nx * side * (poly.hw + 20), p.z + nz * side * (poly.hw + 20));
        if (drop < 3) continue;
        boxAt('ac', ox, p.y + 0.45, oz, 0.12, 0.9, 0.12, 0, [.8, .8, .78], { grime: false });
        const q = pts[k + 1], qx = q.x + nx * side * (poly.hw + 0.7), qz = q.z + nz * side * (poly.hw + 0.7), L = Math.hypot(qx - ox, qz - oz);
        addRail(ox, oz, qx, qz, Math.min(p.y, q.y), Math.max(p.y, q.y) + 0.95, -nx * side, -nz * side);
        addGeo('ac', GEO.box, [(ox + qx) / 2, (p.y + q.y) / 2 + 0.75, (oz + qz) / 2], [-Math.atan2(q.y - p.y, L), Math.atan2(qx - ox, qz - oz), 0], [0.05, 0.3, L + 0.1], [.95, .95, .93], { grime: false, order: 'YXZ' });
      }
    }
  });
}

// ガードレール：車も人も通れない（道路の内がわへ押しもどす。速くてもすり抜けない）
function addRail(ax, az, bx, bz, y, top, inx, inz) {
  const r = { ax, az, bx, bz, y, top, inx, inz }; REG.rails.push(r);
  for (let gx = Math.floor((Math.min(ax, bx) - 4) / 32); gx <= Math.floor((Math.max(ax, bx) + 4) / 32); gx++)
    for (let gz = Math.floor((Math.min(az, bz) - 4) / 32); gz <= Math.floor((Math.max(az, bz) + 4) / 32); gz++) { const k = gx + ',' + gz; let a = REG.railGrid.get(k); if (!a) REG.railGrid.set(k, a = []); a.push(r); }
}
function pushRails(p, r, y, hit) {
  const a = REG.railGrid.get(Math.floor(p.x / 32) + ',' + Math.floor(p.z / 32)); if (!a) return false;
  let moved = false;
  for (const s of a) {
    if (y + 0.35 > s.top || y < s.y - 2.5) continue;
    const dx = s.bx - s.ax, dz = s.bz - s.az, L2 = dx * dx + dz * dz || 1, t = ((p.x - s.ax) * dx + (p.z - s.az) * dz) / L2;
    if (t < -0.02 || t > 1.02) continue;
    const qx = s.ax + dx * t, qz = s.az + dz * t, sd = (p.x - qx) * s.inx + (p.z - qz) * s.inz;
    if (sd >= r || sd < -2.5) continue;
    p.x += s.inx * (r - sd); p.z += s.inz * (r - sd); if (hit) hit(s, s.inx, s.inz, r - sd); moved = true;
  }
  return moved;
}
// ---------- 場所ごとの中身 ----------
function rock(x, z, s, tint = [.95, .82, .7]) {
  const y = regionH(x, z) - s * 0.25, g = new THREE.IcosahedronGeometry(1, 0);
  addGeo('stone', g, [x, y, z], [rgn(0, 3), rgn(0, 6), rgn(0, 3)], [s * rgn(0.8, 1.4), s * rgn(0.6, 1), s * rgn(0.8, 1.3)], tint, { grime: false, uvs: 2 });
  if (s > 1.4) addCol(x - s * 0.7, z - s * 0.7, x + s * 0.7, z + s * 0.7, y + s * 0.8, 'low');
}
// 村の家（1〜2階）：街と同じ窓の外壁、道に向いた扉、屋上の低い壁
function mudHouse(x, z, w, d, floors, front, tint) {
  const y = regionH(x, z), H = floors * FH, x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
  const WIN = [C.small, C.shutB, C.lattice, C.small, C.plain], UP = [C.small, C.shutG, C.lattice, C.plain, C.small];
  facades4(x0, z0, x1, z1, floors, (side, f, k, nb) => (f === 0 && side === front && k === (nb >> 1)) ? C.door : (f === 0 ? WIN : UP)[(k * 7 + f * 3 + (side.charCodeAt(0) & 3)) % 5], tint, { y0: y, base: y });
  boxAt('plaster', x, y + H - 0.1, z, w, 0.2, d, 0, tint, { base: y });
  const t2 = mulT(tint, [.94, .92, .9]);
  boxAt('plaster', x, y + H + 0.1, z, w + 0.3, 0.22, d + 0.3, 0, t2, { base: y - 10 });
  boxAt('plaster', x, y + H + 0.5, z0 + 0.1, w, 0.6, 0.2, 0, tint, { base: y - 10 }); boxAt('plaster', x, y + H + 0.5, z1 - 0.1, w, 0.6, 0.2, 0, tint, { base: y - 10 });
  boxAt('plaster', x0 + 0.1, y + H + 0.5, z, 0.2, 0.6, d, 0, tint, { base: y - 10 }); boxAt('plaster', x1 - 0.1, y + H + 0.5, z, 0.2, 0.6, d, 0, tint, { base: y - 10 });
  boxAt('plaster', x, y - 0.4, z, w + 0.2, 0.8, d + 0.2, 0, mulT(tint, [.85, .82, .78]), { base: y - 10 });   // 土台（斜面でも浮かない）
  addCol(x0, z0, x1, z1, y + H, 'bld');
}
function buildOasis() {
  const O = OASIS, y0 = regionH(O.x, O.z);
  // 家（道の両側に）
  const spots = [[-150, -40], [-110, -48], [-60, -44], [40, -46], [95, -42], [140, -50], [-140, 45], [-90, 52], [-30, 48], [60, 55], [120, 46], [170, 58]];
  for (const [dx, dz] of spots) mudHouse(O.x + dx, O.z + dz, rgn(8, 13), rgn(7, 11), RGN() < 0.4 ? 2 : 1, dz < 0 ? 's' : 'n', pick([[1.08, .88, .66], [1.02, .82, .6], [1.12, .95, .76], [.98, .86, .7], [1.1, .98, .86]], RGN));
  // 村の入り口の看板と、道ぞいのヤシ
  for (const sd of [-1, 1]) { const x = O.x + sd * 200, z = O.z + 12 * sd, yy = regionH(x, z); boxAt('metal', x, yy + 1.4, z, 0.15, 2.8, 0.15, 0, [.7, .7, .7]); signAt(x, yy + 2.9, z + 0.1, 0, ['واحة', 'オアシスの村', '#2a5a3a'], 4, 0.9); }
  for (let k = 0; k < 14; k++) { const dx = -180 + k * 28 + rgn(-4, 4), sd = k % 2 ? 1 : -1, x = O.x + dx, z = O.z + sd * rgn(12, 16); if (Math.hypot(x - (O.x - 70), z - (O.z - 26)) < 22) continue; const rn = roadNear(x, z); if (rn && rn.d < rn.hw + 2) continue; palm(x, z, rgn(7, 10), regionH(x, z)); addCol(x - 0.25, z - 0.25, x + 0.25, z + 0.25, regionH(x, z) + 8, 'pole'); }
  // ガソリンスタンド（道の北）
  const G = { x: O.x - 70, z: O.z - 26 }, gy = regionH(G.x, G.z);
  addGeo('stone', GEO.box, [G.x, gy + 0.05, G.z], 0, [26, 0.2, 18], [.78, .78, .76], { grime: false });
  for (const [px, pz] of [[-7, -5], [7, -5], [-7, 5], [7, 5]]) { boxAt('metal', G.x + px, gy + 2.6, G.z + pz, 0.5, 5.2, 0.5, 0, [.9, .9, .88]); addCol(G.x + px - 0.3, G.z + pz - 0.3, G.x + px + 0.3, G.z + pz + 0.3, gy + 5, 'pole'); }
  boxAt('metal', G.x, gy + 5.4, G.z, 18, 0.7, 14, 0, [.92, .9, .86]); boxAt('paint', G.x, gy + 5.4, G.z + 7.02, 18, 0.5, 0.05, 0, [.85, .2, .15], { grime: false });
  for (const px of [-3.5, 3.5]) { boxAt('stone', G.x + px, gy + 0.25, G.z, 1.4, 0.3, 4, 0, [.85, .85, .82]); for (const pz of [-1, 1]) { boxAt('metal', G.x + px, gy + 1.1, G.z + pz, 0.6, 1.5, 0.45, 0, [.85, .2, .15]); addCol(G.x + px - 0.4, G.z + pz - 0.3, G.x + px + 0.4, G.z + pz + 0.3, gy + 1.8, 'low'); } }
  const shop = { x: G.x, z: G.z - 16 }; addGeo('plaster', GEO.box, [shop.x, gy + 2, shop.z], 0, [16, 4, 8], [1.05, 1.02, .98], { base: gy }); addCol(shop.x - 8, shop.z - 4, shop.x + 8, shop.z + 4, gy + 4, 'bld');
  addGeo('glassWin', GEO.box, [shop.x, gy + 1.6, shop.z + 4.03], 0, [10, 2.2, 0.06], [1, 1, 1], { grime: false });
  signAt(shop.x, gy + 4.6, shop.z + 4.1, 0, ['محطة وقود', 'ガソリンスタンド', '#8a2a1e'], 5, 1.1);
  PLACES.gas = { x: G.x, z: G.z + 6, name: 'オアシスのガソリンスタンド' };
  // モスク（ドームと尖塔）
  const Mq = { x: O.x + 70, z: O.z - 95 }, my = regionH(Mq.x, Mq.z);
  addGeo('plaster', GEO.box, [Mq.x, my + 4, Mq.z], 0, [18, 8, 18], [1.1, 1.06, 1], { base: my }); addCol(Mq.x - 9, Mq.z - 9, Mq.x + 9, Mq.z + 9, my + 8, 'bld');
  addGeo('gold', new THREE.SphereGeometry(6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), [Mq.x, my + 8, Mq.z], 0, null, [.9, .95, 1], { grime: false, uv: 'keep' });
  addGeo('plaster', new THREE.CylinderGeometry(1.2, 1.5, 22, 12), [Mq.x + 12, my + 11, Mq.z + 6], 0, null, [1.1, 1.06, 1], { base: my }); addCol(Mq.x + 10.5, Mq.z + 4.5, Mq.x + 13.5, Mq.z + 7.5, my + 22, 'bld');
  addGeo('gold', new THREE.ConeGeometry(1.5, 3, 12), [Mq.x + 12, my + 23.5, Mq.z + 6], 0, null, [.9, .95, 1], { grime: false, uv: 'keep' });
  // 池とヤシ
  const P = O.pond, water = new THREE.Mesh(new THREE.CircleGeometry(P.r + 2, 40), MAT.water); water.rotation.x = -Math.PI / 2; water.position.set(P.x, -0.45, P.z); scene.add(water);
  for (let k = 0; k < 26; k++) { const a = k / 26 * Math.PI * 2 + rgn(-0.1, 0.1), r = P.r + rgn(6, 20), x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r; palm(x, z, rgn(6, 10), regionH(x, z)); addCol(x - 0.25, z - 0.25, x + 0.25, z + 0.25, 8, 'pole'); }
  for (const [dx, dz] of [[-100, -12], [-40, -12], [20, 12], [90, 12]]) { const x = O.x + dx, z = O.z + dz, rn = roadNear(x, z); if (rn && rn.d < rn.hw + 2) continue; palm(x, z, rgn(7, 10), regionH(x, z)); addCol(x - 0.25, z - 0.25, x + 0.25, z + 0.25, 8, 'pole'); }
  PLACES.oasis = { x: O.x, z: O.z, name: 'オアシスの村' };
  PARK.push({ x: G.x - 9, z: G.z + 3, yaw: 0 }, { x: O.x + 30, z: O.z + 15, yaw: Math.PI / 2 }, { x: O.x - 120, z: O.z - 15, yaw: -Math.PI / 2 });
  CASH.push({ x: Mq.x - 12, z: Mq.z + 12 }, { x: P.x + P.r + 12, z: P.z }, { x: shop.x + 9, z: shop.z + 2 });
}
function buildPort() {
  const y = 0.6, Q = PORT;
  addGeo('plaster', GEO.box, [(Q.x0 + Q.x1) / 2, y - 0.1, (Q.z0 + Q.z1) / 2], 0, [Q.x1 - Q.x0, 0.2, Q.z1 - Q.z0], [.74, .74, .72], { grime: false, uvs: 6 });   // コンクリート
  // 岸壁のふちとビット
  boxAt('stone', (Q.x0 + Q.x1) / 2, y - 1.6, Q.z1 + 0.5, Q.x1 - Q.x0, 3.4, 1, 0, [.6, .6, .6], { grime: false });
  for (let x = Q.x0 + 6; x < Q.x1; x += 9) addGeo('metal', new THREE.CylinderGeometry(0.25, 0.3, 0.6, 8), [x, y + 0.3, Q.z1 - 0.8], 0, null, [.2, .2, .22], { uv: 'keep', grime: false });
  // コンテナの山（1〜3段）
  const COLS = [[.75, .16, .12], [.14, .32, .62], [.18, .5, .3], [.9, .55, .12], [.85, .85, .82], [.45, .3, .22], [.5, .52, .56]];
  for (let row = 0; row < 6; row++) for (let col = 0; col < 7; col++) {
    if (RGN() < 0.18) continue;
    const cx = Q.x0 + 50 + col * 26, cz = Q.z0 + 30 + row * 9, n = 1 + ((RGN() * 3) | 0);
    if ([-6.5, 0, 6.5].some(o => { const rn = roadNear(cx + o, cz); return rn && rn.d < rn.hw + 3.5; })) continue;   // 港の道はあけておく
    for (let k = 0; k < n; k++) { const col = pick(COLS, RGN); boxAt('ac', cx, y + 1.3 + k * 2.62, cz, 12.2, 2.6, 2.5, 0, col, { grime: false }); for (const sd of [-1, 1]) for (let j = -5; j <= 5; j++) boxAt('ac', cx + j * 1.1, y + 1.3 + k * 2.62, cz + sd * 1.27, 0.12, 2.3, 0.05, 0, mulT(col, [.8, .8, .8]), { grime: false }); }
    addCol(cx - 6.1, cz - 1.25, cx + 6.1, cz + 1.25, y + n * 2.62, 'bld');
  }
  // 岸壁のガントリークレーン（2基）
  for (const cx of [Q.x0 + 120, Q.x0 + 290]) {
    const cz = Q.z1 - 8;
    for (const [lx, lz] of [[-8, -6], [8, -6], [-8, 6], [8, 6]]) { boxAt('ac', cx + lx, y + 16, cz + lz, 1.2, 32, 1.2, 0, [1.05, .72, .12]); addCol(cx + lx - 0.7, cz + lz - 0.7, cx + lx + 0.7, cz + lz + 0.7, y + 32, 'pole'); }
    boxAt('ac', cx, y + 33, cz + 10, 4, 2.2, 56, 0, [1.05, .72, .12]); boxAt('ac', cx, y + 30, cz + 2, 5, 3, 4, 0, [.95, .95, .92]);
    for (const lx of [-8, 8]) boxAt('ac', cx + lx, y + 31, cz, 1, 1, 13, 0, [1.05, .72, .12]);
  }
  // 倉庫（2棟）
  for (const [wx, wz] of [[Q.x0 + 470, Q.z0 + 40], [Q.x0 + 470, Q.z0 + 100]]) { boxAt('ac', wx, y + 6, wz, 60, 12, 30, 0, [.82, .86, .9]); boxAt('metal', wx, y + 12.3, wz, 61, 0.6, 31, 0, [1.2, 1.2, 1.22]); for (const sd of [-1, 1]) boxAt('dark', wx + sd * 15, y + 3, wz + 15.03, 9, 6, 0.08, 0, [1, 1, 1], { grime: false }); addCol(wx - 30, wz - 15, wx + 30, wz + 15, y + 12, 'bld'); }
  // 停泊している船
  const sx = Q.x0 + 220, sz = Q.z1 + 16;
  boxAt('metal', sx, -1, sz, 130, 9, 20, 0, [.22, .25, .3]); boxAt('metal', sx, 3.6, sz, 128, 0.4, 19, 0, [.55, .2, .15]);
  boxAt('plaster', sx - 48, 9, sz, 16, 10, 16, 0, [1.05, 1.05, 1.02]); boxAt('dark', sx - 40, 11.5, sz, 0.1, 1.2, 14, 0, [1, 1, 1]);
  for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) boxAt('ac', sx - 20 + k * 14, 5.2 + j * 2.6, sz, 12, 2.6, 16, 0, pick(COLS, RGN), { grime: false });
  PLACES.port = { x: (Q.x0 + Q.x1) / 2, z: Q.z0 + 70, name: '港' };
  PARK.push({ x: Q.x0 + 360, z: Q.z0 + 15, yaw: 0 }, { x: Q.x0 + 380, z: Q.z0 + 15, yaw: 0 });
  CASH.push({ x: Q.x0 + 60, z: Q.z1 - 4 }, { x: Q.x0 + 470, z: Q.z0 + 70 }, { x: Q.x1 - 30, z: Q.z0 + 20 });
}
function buildSummit() {
  const n = ROAD.nodes[REG.mtn.ids[REG.mtn.ids.length - 1]], y = n.y;
  REG.flats.push({ x: n.x, z: n.z, rx: 34, rz: 34, h: y - 0.1, fall: 1.8 });
  addGeo('stone', new THREE.CylinderGeometry(26, 27, 0.3, 28), [n.x, y + 0.02, n.z], 0, null, [.85, .82, .78], { grime: false, uvs: 4 });
  // 電波塔と見晴らしの柵
  const tx = n.x + 14, tz = n.z - 12;
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) boxAt('metal', tx + a * 1.2, y + 17, tz + b * 1.2, 0.25, 34, 0.25, 0, [.85, .3, .25]);
  for (let h = 3; h < 34; h += 4) boxAt('metal', tx, y + h, tz, 2.6, 0.15, 2.6, 0, [.9, .9, .9]);
  addCol(tx - 1.6, tz - 1.6, tx + 1.6, tz + 1.6, y + 34, 'pole');
  for (let a = 0; a < Math.PI * 1.2; a += 0.12) { const x = n.x + Math.cos(a + 0.2) * 25, z = n.z + Math.sin(a + 0.2) * 25; boxAt('metal', x, y + 0.6, z, 0.1, 1.1, 0.1, 0, [.3, .3, .3]); }
  PLACES.summit = { x: n.x, z: n.z, name: 'ジャバル山の頂上' };
  CASH.push({ x: n.x - 10, z: n.z + 8 });
}
function buildRamps() {
  const defs = [[1110, 140, Math.PI / 2], [-262, 40, -Math.PI / 2], [-560, PORT.z1 - 30, -Math.PI / 2], [120, -258, Math.PI]];
  for (const [x, z, yaw] of defs) {
    const r = { x, z, yaw, s: Math.sin(yaw), c: Math.cos(yaw), L: 13, W: 6, H: 3.4 }; r.y0 = regionH(x, z) - 0.05;
    // くさび形（上り坂の板＋横と後ろ）
    const L = r.L, W = r.W, H = r.H, P = [], N = [], I = [], U = [];
    const v = (u, w2, h) => [x + r.s * u + r.c * w2, r.y0 + h, z + r.c * u - r.s * w2];
    const quad = (a, b, c, d, n) => { const i = P.length / 3; for (const p of [a, b, c, d]) P.push(...p); for (let k = 0; k < 4; k++) N.push(...n); U.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(i, i + 2, i + 1, i, i + 3, i + 2); };
    const sl = Math.hypot(L, H), nUp = [-r.s * H / sl, L / sl, -r.c * H / sl];
    quad(v(0, -W / 2, 0), v(0, W / 2, 0), v(L, W / 2, H), v(L, -W / 2, H), nUp);
    quad(v(L, -W / 2, 0), v(L, -W / 2, H), v(L, W / 2, H), v(L, W / 2, 0), [r.s, 0, r.c]);
    for (const sd of [-1, 1]) { const i = P.length / 3; for (const p of [v(0, sd * W / 2, 0), v(L, sd * W / 2, 0), v(L, sd * W / 2, H)]) P.push(...p); for (let k = 0; k < 3; k++) N.push(r.c * sd, 0, -r.s * sd); U.push(0, 0, 1, 0, 1, 1); I.push(i, i + 1, i + 2, i, i + 2, i + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
    addPiece('metal', g, [.75, .7, .62], { uvs: 3 });
    for (let k = 1; k < 5; k++) { const f = k / 5, p = v(L * f, 0, H * f + 0.02); boxAt('paint', p[0], p[1], p[2], 4.5, 0.02, 0.6, [-Math.atan2(H, L), yaw, 0], [1, .8, .1], { grime: false, order: 'YXZ' }); }
    REG.ramps.push(r);
  }
}
function buildScatter() {
  // 砂漠と山の岩、砂丘のかれ草
  for (let k = 0; k < 260; k++) {
    const x = rgn(BOUNDS.x0, BOUNDS.x1), z = rgn(BOUNDS.z0, CITY.SEA - 40);
    if (x > -40 && x < CITY.E + 40 && z > -40 && z < CITY.E + 40) continue;
    const r = roadNear(x, z); if (r && r.d < r.hw + 18) continue;
    if (x > PORT.x0 - 40 && x < PORT.x1 + 40 && z > PORT.z0 - 40) continue;
    if (Math.hypot(x - OASIS.x, z - OASIS.z) < 200) continue;
    const mtn = z < -500;
    rock(x, z, mtn ? rgn(1.5, 5) : rgn(0.5, 2.2), mtn ? [.85, .66, .52] : [.98, .86, .72]);
  }
  for (let k = 0; k < 160; k++) {
    const x = rgn(-400, BOUNDS.x1), z = rgn(-400, CITY.SEA - 60);
    if (x > -40 && x < CITY.E + 40 && z > -40 && z < CITY.E + 40) continue;
    const r = roadNear(x, z); if (r && r.d < r.hw + 4) continue;
    addGeo('plant', new THREE.IcosahedronGeometry(1, 0), [x, regionH(x, z) + 0.25, z], 0, [rgn(0.5, 1.1), rgn(0.3, 0.6), rgn(0.5, 1.1)], [.75, .7, .45], { grime: false, uvs: 1 });
  }
  // 山道のヘアピンや砂漠のはずれにお金
  for (const k of [20, 60, 110, 170]) { const n = ROAD.nodes[REG.mtn.ids[Math.min(k, REG.mtn.ids.length - 1)]]; CASH.push({ x: n.x + 8, z: n.z + 8 }); }
  CASH.push({ x: 1250, z: 330 }, { x: 980, z: 60 }, { x: -620, z: -300 });
}
async function buildRegions(say) {
  say('山と砂漠を作っています…'); await nextFrame();
  REG.flats.push({ x: OASIS.x, z: OASIS.z + 40, rx: 230, rz: 150, h: 2.2, fall: 1.6 });
  buildRegionRoads(); await nextFrame();
  buildSummit();
  say('道路と村と港を作っています…'); await nextFrame();
  buildRegionRoadMeshes(); await nextFrame();
  buildOasis(); buildPort(); buildRamps(); await nextFrame();
  buildScatter();
  PLACES.desertEdge = { x: PLACES.gas.x, z: PLACES.gas.z, name: PLACES.gas.name };   // 最後の仕事の受けとり場所
}
