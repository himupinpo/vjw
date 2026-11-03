// =========================================================================================
//  車：Quaternius「Cars Pack」（CC0）のモデルを使う（7車種）。読めないときは、横から見た形を押し出して作る
//  動き：アーケード風の物理（前後の力、横すべりの摩擦、ハンドブレーキでドリフト）
// =========================================================================================
const CAR_TYPES = {
  sedan: { L: 4.6, W: 1.82, belt: 0.92, roof: 1.44, wb: 2.72, tire: 0.33, max: 44, acc: 12, grip: 9, mass: 1.0, name: 'セダン',
    prof: [[-2.3, 0.32], [-2.3, 0.72], [-2.2, 0.86], [-1.15, 0.94], [1.6, 0.95], [2.28, 0.9], [2.3, 0.62], [2.25, 0.32]], cab: [[-1.05, 0.93], [-0.55, 1.42], [0.7, 1.44], [1.42, 0.95]] },
  suv: { L: 4.95, W: 1.98, belt: 1.12, roof: 1.86, wb: 2.85, tire: 0.4, max: 40, acc: 10.5, grip: 8, mass: 1.35, name: 'SUV',
    prof: [[-2.45, 0.4], [-2.48, 0.9], [-2.4, 1.08], [-1.4, 1.13], [2.2, 1.14], [2.47, 1.06], [2.48, 0.45]], cab: [[-1.38, 1.12], [-1.05, 1.84], [1.75, 1.86], [1.95, 1.13]] },
  sports: { L: 4.45, W: 1.92, belt: 0.78, roof: 1.18, wb: 2.6, tire: 0.33, max: 58, acc: 16, grip: 10.5, mass: 0.9, name: 'スポーツカー',
    prof: [[-2.2, 0.28], [-2.22, 0.66], [-2.1, 0.78], [-0.85, 0.8], [1.5, 0.74], [2.2, 0.6], [2.24, 0.28]], cab: [[-0.9, 0.79], [-0.15, 1.16], [0.55, 1.17], [1.35, 0.76]] },
  pickup: { L: 5.25, W: 1.95, belt: 1.08, roof: 1.8, wb: 3.1, tire: 0.4, max: 38, acc: 10, grip: 8, mass: 1.3, name: 'ピックアップ',
    prof: [[-2.62, 0.42], [-2.62, 1.06], [-0.35, 1.07], [-0.35, 1.08], [2.2, 1.1], [2.6, 1.0], [2.62, 0.45]], cab: [[-0.3, 1.07], [-0.1, 1.78], [1.25, 1.8], [1.75, 1.09]], bed: true },
};
// モデルのある車種（大きさ・ホイールベース・タイヤ・屋根の高さは、読みこんだモデルから決める：prepareCarTypes）
Object.assign(CAR_TYPES, {
  compact: Object.assign({}, CAR_TYPES.sedan, { max: 40, acc: 11.5, grip: 9.5, mass: 0.85, name: 'コンパクト' }),
  sports2: Object.assign({}, CAR_TYPES.sports, { max: 55, acc: 15, name: 'クーペ' }),
  taxi: Object.assign({}, CAR_TYPES.sedan, { name: 'タクシー' }),
  police: Object.assign({}, CAR_TYPES.sedan, { max: 46, acc: 11, grip: 9.5, mass: 1.1, name: 'パトカー' }),
});
for (const [k, m] of [['sedan', 'NormalCar1'], ['compact', 'NormalCar2'], ['suv', 'SUV'], ['sports', 'SportsCar'], ['sports2', 'SportsCar2'], ['taxi', 'Taxi'], ['police', 'Cop']]) CAR_TYPES[k].model = m;
const PAINTS = [[.92, .92, .9], [.08, .08, .09], [.55, .57, .6], [.75, .12, .1], [.1, .22, .45], [.85, .78, .62], [.18, .35, .25], [.95, .62, .1], [.4, .1, .12], [.72, .74, .76]];
const CAR_MAT = {
  glass: new THREE.MeshStandardMaterial({ color: 0x141a1e, roughness: 0.04, metalness: 0.35, envMapIntensity: 1.3 }),
  light: new THREE.MeshBasicMaterial({ vertexColors: true }),
  wheel: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.45 }),
  burnt: new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: 0.9, metalness: 0.3 }),
  paint: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.15 }),   // モデルの車の塗装：色の上にクリア塗装（色は頂点ごと）
  trim: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.05 }),                       // バンパーやモールの樹脂
  sirenR: new THREE.MeshBasicMaterial({ color: 0xff2020 }), sirenB: new THREE.MeshBasicMaterial({ color: 0x2050ff }), sirenOff: new THREE.MeshBasicMaterial({ color: 0x302830 }),
};
// 横から見た形（z=前後、y=上下）を幅いっぱいに押し出す
function extrudeProfile(pts, width, bevel, arches) {
  const sh = new THREE.Shape();
  sh.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
  if (arches) {   // 下の辺をタイヤのアーチでえぐる（前から後ろへ）
    const last = pts[pts.length - 1];
    for (const [cz, r] of arches) { sh.lineTo(cz + r, last[1]); sh.absarc(cz, last[1] - 0.02, r, 0, Math.PI, false); }
  }
  sh.lineTo(pts[0][0], pts[0][1]);
  const g = new THREE.ExtrudeGeometry(sh, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 3, curveSegments: 10 });
  g.rotateY(-Math.PI / 2); g.translate((width - bevel * 2) / 2, 0, 0);
  return g;
}
// 色つきで1つにまとめる
function mergeColored(list) {
  const geos = list.map(([g, c]) => { const n = (g.index ? g.toNonIndexed() : g); const col = new Float32Array(n.attributes.position.count * 3); for (let i = 0; i < col.length; i += 3) { col[i] = c[0]; col[i + 1] = c[1]; col[i + 2] = c[2]; } n.setAttribute('color', new THREE.BufferAttribute(col, 3)); for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'color'].includes(k)) n.deleteAttribute(k); return n; });
  return mergeGeometries(geos, false);
}
const WHEEL_GEO = {};
function wheelGeo(r) {
  if (WHEEL_GEO[r]) return WHEEL_GEO[r];
  const tire = new THREE.CylinderGeometry(r, r, 0.26, 18); tire.rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(r * 0.62, r * 0.62, 0.27, 12); rim.rotateZ(Math.PI / 2);
  const hub = new THREE.CylinderGeometry(r * 0.16, r * 0.16, 0.29, 8); hub.rotateZ(Math.PI / 2);
  const spokes = []; for (let k = 0; k < 5; k++) { const s = new THREE.BoxGeometry(0.02, r * 1.1, 0.07); s.rotateX(k / 5 * Math.PI); s.translate(0.14, 0, 0); spokes.push([s, [.75, .75, .74]]); }
  return (WHEEL_GEO[r] = mergeColored([[tire, [.08, .08, .08]], [rim, [.55, .56, .58]], [hub, [.3, .3, .3]], ...spokes]));
}
// ---------- モデルの車（Quaternius「Cars Pack」CC0）：ページに埋めこんだデータ（cars.json / cars.bin）から作る ----------
const CAR_DATA = { models: null, bin: null, geo: {} };
const CAR_SCALE = 1.08;
// 色の役割：塗装（車ごとの色）、塗装の濃い色、固定の塗装色、ガラス、灯火、パトランプ。ほかは黒や灰色の樹脂（つやなし）
const CAR_LOOK = {
  NormalCar1: { paint: ['Blue'] }, NormalCar2: { paint: ['LightBlue'], gloss: { 'Material.007': [.82, .82, .8] } }, SUV: { paint: ['White'] },
  SportsCar: { paint: ['Orange'], paint2: ['DarkOrange'] }, SportsCar2: { paint: ['White'] },
  Taxi: { gloss: { Yellow: [.86, .58, .04] } }, Cop: { gloss: { Black: [.03, .03, .035], White: [.85, .85, .83] }, siren: ['BlueLights', 'WhiteLights'] },
};
const CAR_LIGHT = { Headlights: [1, .93, .78], TailLights: [.78, .04, .03] };
const CAR_TRIM = { Black: [.022, .022, .024], Grey: [.15, .15, .16] };
const CAR_WHEEL = { Black: [.03, .03, .032], Grey: [.52, .53, .55] };
// 部品（body / back / fl / fr）の形：位置と色番号。車種ごとに1回だけ作る
function carPart(model, part) {
  const key = model + '/' + part; if (CAR_DATA.geo[key]) return CAR_DATA.geo[key];
  const P = CAR_DATA.models[model].parts[part], b = CAR_DATA.bin;
  const pos = new Float32Array(b, P.pos[0], P.pos[1] * 3).map(v => v * CAR_SCALE), slot = new Uint8Array(b, P.slot[0], P.slot[1]), idx = new Uint16Array(b, P.idx[0], P.idx[1]);
  const box = new THREE.Box3(); for (let i = 0; i < pos.length; i += 3) box.expandByPoint(new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2]));
  return (CAR_DATA.geo[key] = { pos, slot, idx, box, names: CAR_DATA.models[model].slots });
}
// 部品から、色の役割が合う面だけを取り出して1つの形に。色は colorOf(色の名前)。角の立った所（約35°以上）は立てたまま、ほかは滑らかに
function carGeo(src, colorOf, shift) {
  const P = [], Cc = [];
  for (let t = 0; t < src.idx.length; t += 3) {
    const c = colorOf(src.names[src.slot[src.idx[t]]]); if (!c) continue;
    for (let k = 0; k < 3; k++) { const i = src.idx[t + k] * 3; P.push(src.pos[i] - shift.x, src.pos[i + 1] - shift.y, src.pos[i + 2] - shift.z); Cc.push(c[0], c[1], c[2]); }
  }
  if (!P.length) return null;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  const out = toCreasedNormals(g, 0.6); out.userData.shared = true; return out;
}
// 車種の大きさなどをモデルから（当たり判定・カメラ・カメラの高さ・タイヤの回転がモデルと合うように）
function prepareCarTypes() {
  for (const T of Object.values(CAR_TYPES)) {
    if (!T.model || !CAR_DATA.models || !CAR_DATA.models[T.model]) continue;
    const b = carPart(T.model, 'body').box, fl = carPart(T.model, 'fl').box, bk = carPart(T.model, 'back').box;
    T.zc = (b.max.z + b.min.z) / 2; T.L = b.max.z - b.min.z; T.W = b.max.x - b.min.x - 0.12; T.roof = b.max.y; T.belt = b.min.y + (b.max.y - b.min.y) * 0.6;
    T.tire = (fl.max.y - fl.min.y) / 2; T.wb = (fl.max.z + fl.min.z) / 2 - (bk.max.z + bk.min.z) / 2; T.lift = -Math.min(fl.min.y, bk.min.y);
  }
}
const CAR_GEO_CACHE = {};
function buildModelCar(type, paint, police) {
  const T = CAR_TYPES[type], M = T.model, look = CAR_LOOK[M] || {}, g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  inner.position.set(0, T.lift || 0, -T.zc);
  const zero = new THREE.Vector3(), body = carPart(M, 'body'), pk = paint.map(v => v.toFixed(2)).join(',');
  const cached = (k, f) => (CAR_GEO_CACHE[M + '|' + k] !== undefined ? CAR_GEO_CACHE[M + '|' + k] : (CAR_GEO_CACHE[M + '|' + k] = f()));
  const sirenSet = new Set(look.siren || []);
  // 塗装（つやあり）：車ごとの色・濃い色・固定の色
  const paintGeo = cached('paint|' + pk, () => carGeo(body, n => (look.paint || []).includes(n) ? paint : (look.paint2 || []).includes(n) ? paint.map(v => v * 0.7) : look.gloss && look.gloss[n] ? look.gloss[n] : null, zero));
  // 樹脂・ゴム（つやなし）、ガラス、灯火
  const trimGeo = cached('trim', () => carGeo(body, n => !(look.paint || []).includes(n) && !(look.paint2 || []).includes(n) && !(look.gloss && look.gloss[n]) && n !== 'Windows' && !CAR_LIGHT[n] && !sirenSet.has(n) ? (CAR_TRIM[n] || CAR_DATA.models[M].kd[n]) : null, zero));
  const glassGeo = cached('glass', () => carGeo(body, n => n === 'Windows' ? [1, 1, 1] : null, zero));
  const lightGeo = cached('light', () => carGeo(body, n => CAR_LIGHT[n] || null, zero));
  const bodies = [];
  const paintMesh = new THREE.Mesh(paintGeo, CAR_MAT.paint); paintMesh.castShadow = paintMesh.receiveShadow = true; inner.add(paintMesh); bodies.push(paintMesh);
  if (trimGeo) { const m = new THREE.Mesh(trimGeo, CAR_MAT.trim); m.castShadow = m.receiveShadow = true; inner.add(m); bodies.push(m); }
  const glass = new THREE.Mesh(glassGeo, CAR_MAT.glass); glass.castShadow = true; inner.add(glass);
  const lights = new THREE.Mesh(lightGeo, CAR_MAT.light); inner.add(lights);
  // パトランプ：左右に分けて赤・青を交互に
  let siren = null;
  if (police && sirenSet.size) {
    const half = s => cached('siren' + s, () => { const p = carPart(M, 'body'), sub = { pos: p.pos, slot: p.slot, names: p.names, idx: p.idx.filter((_, i, a) => { const t = i - i % 3; return s * (p.pos[a[t] * 3] + p.pos[a[t + 1] * 3] + p.pos[a[t + 2] * 3]) > 0; }) }; return carGeo(sub, n => sirenSet.has(n) ? [1, 1, 1] : null, zero); });
    siren = [new THREE.Mesh(half(1), CAR_MAT.sirenR), new THREE.Mesh(half(-1), CAR_MAT.sirenB)]; inner.add(siren[0], siren[1]);
  }
  // タイヤ：後ろは2本で1つ（車軸のまわりに回す）、前は左右べつ（ハンドルで向きも変わる）
  const wheels = [];
  for (const [part, front] of [['back', 0], ['fl', 1], ['fr', 1]]) {
    const src = carPart(M, part), c = src.box.getCenter(new THREE.Vector3());
    const geo = cached('wheel|' + part, () => carGeo(src, n => CAR_WHEEL[n] || CAR_DATA.models[M].kd[n], c));
    const piv = new THREE.Group(); piv.position.copy(c); const w = new THREE.Mesh(geo, CAR_MAT.wheel); w.castShadow = true; piv.add(w); inner.add(piv); wheels.push({ piv, w, front });
  }
  scene.add(g);
  return { g, body: paintMesh, bodies, glass, lights, wheels, siren, paintMat: null };
}
function buildCarModel(type, paint, police) {
  if (CAR_TYPES[type].model && CAR_DATA.models && CAR_DATA.models[CAR_TYPES[type].model]) return buildModelCar(type, paint, police);
  return buildProcCarModel(type, paint, police);
}
// 読みこめなかったとき：横から見た形を押し出して作る車
function buildProcCarModel(type, paint, police) {
  const T = CAR_TYPES[type], g = new THREE.Group(), W = T.W, L = T.L;
  const fz = T.wb / 2, rz = -T.wb / 2, ar = T.tire + 0.08;
  // 車体（塗装＋黒い部品）
  const body = extrudeProfile(T.prof, W, 0.07, [[fz, ar], [rz, ar]].sort((a, b) => b[0] - a[0]).map(a => a));
  const parts = [[body, paint]];
  const roofPts = [T.cab[1], T.cab[2], [T.cab[2][0] - 0.05, T.cab[2][1] + 0.04], [T.cab[1][0] + 0.05, T.cab[1][1] + 0.04]];
  parts.push([extrudeProfile(roofPts, W * 0.86, 0.03), paint]);
  // ピラー（箱の縦（+Y）を rotateX(θ) で (0, cosθ, sinθ) に向ける＝柱の向き (z, y) に合わせる）
  const [c0, c1, c2, c3] = T.cab;
  for (const s of [-1, 1]) {
    for (const [a, b2] of [[c0, c1], [c2, c3]]) { const len = Math.hypot(b2[0] - a[0], b2[1] - a[1]), p = new THREE.BoxGeometry(0.07, len, 0.1); p.rotateX(Math.atan2(b2[0] - a[0], b2[1] - a[1])); p.translate(s * W * 0.43, (a[1] + b2[1]) / 2, (a[0] + b2[0]) / 2); parts.push([p, paint]); }
    const bp = new THREE.BoxGeometry(0.07, c1[1] - c0[1], 0.12); bp.translate(s * W * 0.44, (c0[1] + c1[1]) / 2, (c1[0] + c2[0]) / 2 - 0.15); parts.push([bp, [.06, .06, .06]]);
  }
  // バンパー・グリル・ミラー・ナンバー
  const bump = new THREE.BoxGeometry(W * 0.98, 0.2, 0.14);
  parts.push([bump.clone().translate(0, T.prof[0][1] + 0.12, L / 2 + 0.03), [.12, .12, .13]], [bump.clone().translate(0, T.prof[0][1] + 0.12, -L / 2 - 0.03), [.12, .12, .13]]);
  parts.push([new THREE.BoxGeometry(W * 0.5, 0.16, 0.05).translate(0, T.belt - 0.22, L / 2 + 0.02), [.05, .05, .05]]);
  for (const s of [-1, 1]) parts.push([new THREE.BoxGeometry(0.16, 0.1, 0.1).translate(s * (W / 2 + 0.06), T.belt + 0.08, c0[0] + 0.45), paint]);
  parts.push([new THREE.BoxGeometry(0.5, 0.12, 0.02).translate(0, T.prof[0][1] + 0.14, L / 2 + 0.11), [.95, .95, .92]], [new THREE.BoxGeometry(0.5, 0.12, 0.02).translate(0, T.prof[0][1] + 0.3, -L / 2 - 0.08), [.95, .95, .92]]);
  if (T.bed) { const bed = new THREE.BoxGeometry(W * 0.9, 0.3, L * 0.38); bed.translate(0, T.belt - 0.1, -L * 0.29); parts.push([bed, [.1, .1, .1]]); }
  if (police) { for (const s of [-1, 1]) { const st = new THREE.BoxGeometry(0.02, 0.16, L * 0.8); st.translate(s * (W / 2 + 0.005), T.belt - 0.28, 0); parts.push([st, [.1, .45, .22]]); } }
  const paintMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.55, envMapIntensity: 1.1 });
  const bodyMesh = new THREE.Mesh(mergeColored(parts), paintMat); bodyMesh.castShadow = true; bodyMesh.receiveShadow = true; g.add(bodyMesh);
  // ガラスの室内
  const cab = extrudeProfile(T.cab, W * 0.88, 0.05); const glass = new THREE.Mesh(cab, CAR_MAT.glass); glass.castShadow = true; g.add(glass);
  // 灯火
  const lt = [];
  for (const s of [-1, 1]) {
    lt.push([new THREE.BoxGeometry(0.34, 0.11, 0.05).translate(s * (W / 2 - 0.3), T.belt - 0.08, L / 2 + 0.01), [1, .98, .9]]);
    lt.push([new THREE.BoxGeometry(0.32, 0.11, 0.05).translate(s * (W / 2 - 0.28), T.belt - 0.06, -L / 2 - 0.01), [.75, .04, .03]]);
    lt.push([new THREE.BoxGeometry(0.1, 0.06, 0.05).translate(s * (W / 2 - 0.08), T.belt - 0.1, L / 2 - 0.03), [1, .55, .05]]);
  }
  const lights = new THREE.Mesh(mergeColored(lt), CAR_MAT.light); g.add(lights);
  let siren = null;
  if (police) {
    const sR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.22), CAR_MAT.sirenR), sB = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.22), CAR_MAT.sirenB);
    sR.position.set(0.3, T.roof + 0.08, (c1[0] + c2[0]) / 2); sB.position.set(-0.3, T.roof + 0.08, (c1[0] + c2[0]) / 2); g.add(sR, sB); siren = [sR, sB];
  }
  if (paint.taxi) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.25), new THREE.MeshStandardMaterial({ color: 0xf2e6b0, emissive: 0x6a5a20, roughness: 0.4 }));
    sign.position.set(0, T.roof + 0.1, (c1[0] + c2[0]) / 2); g.add(sign);
  }
  // タイヤ
  const wheels = [];
  for (const [x, z, front] of [[W / 2 - 0.13, fz, 1], [-W / 2 + 0.13, fz, 1], [W / 2 - 0.13, rz, 0], [-W / 2 + 0.13, rz, 0]]) {
    const piv = new THREE.Group(); piv.position.set(x, T.tire, z); const w = new THREE.Mesh(wheelGeo(T.tire), CAR_MAT.wheel); if (x < 0) w.rotation.y = Math.PI; w.castShadow = true; piv.add(w); g.add(piv); wheels.push({ piv, w, front });
  }
  scene.add(g);
  return { g, body: bodyMesh, bodies: [bodyMesh], glass, lights, wheels, siren, paintMat };
}
// ---------- 1台の車 ----------
let CAR_ID = 0;
class Car {
  constructor(type, x, z, yaw, o = {}) {
    this.id = ++CAR_ID; this.type = type; this.T = CAR_TYPES[type]; this.police = !!o.police;
    const paint = o.paint || (this.police ? [.95, .95, .95] : pick(PAINTS)); if (o.taxi) paint.taxi = true;
    this.paint = paint; this.taxi = !!o.taxi;
    this.m = buildCarModel(type, paint, this.police);
    this.x = x; this.z = z; this.y = groundH(x, z); this.yaw = yaw; this.vx = 0; this.vz = 0; this.yr = 0; this.steer = 0; this.pitch = 0; this.roll = 0;
    this.hp = 1000; this.dead = false; this.burnT = 0; this.driver = null; this.ai = null; this.wheelRot = 0; this.smokeT = 0;
    this.input = { th: 0, br: 0, st: 0, hb: false };
    this.r = this.T.W / 2 + 0.08;
    this.place();
  }
  get speed() { return Math.hypot(this.vx, this.vz); }
  get fwd() { return this.vx * Math.sin(this.yaw) + this.vz * Math.cos(this.yaw); }
  place() {
    const g = this.m.g; g.position.set(this.x, this.y, this.z); g.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
  }
  // 車体の当たり判定の円（前・中・後ろ）
  circles() { const f = this.T.L / 2 - this.r, sx = Math.sin(this.yaw), cz = Math.cos(this.yaw); return [[this.x + sx * f, this.z + cz * f], [this.x, this.z], [this.x - sx * f, this.z - cz * f]]; }
  update(dt) {
    const T = this.T, I = this.input;
    if (this.dead) { this.vx *= Math.exp(-3 * dt); this.vz *= Math.exp(-3 * dt); I.th = I.br = 0; }
    const sx = Math.sin(this.yaw), cz = Math.cos(this.yaw);
    let vf = this.vx * sx + this.vz * cz, vl = this.vx * cz - this.vz * sx;   // 前と横（左が+）
    // 前後の力
    const hpK = this.hp < 250 ? 0.55 : 1;
    if (I.th > 0) { if (vf < -0.5) vf += 16 * I.th * dt; else vf += T.acc * hpK * I.th * Math.max(0.05, 1 - vf / (T.max * hpK)) * dt; }
    if (I.br > 0) { if (vf > 0.6) vf -= 15 * I.br * dt; else vf = Math.max(-11, vf - 6 * I.br * dt); }
    if (!I.th && !I.br) vf -= Math.sign(vf) * Math.min(Math.abs(vf), (1.2 + Math.abs(vf) * 0.04) * dt);
    if (I.hb) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 5 * dt);
    if (I.stop > 0) vf -= Math.sign(vf) * Math.min(Math.abs(vf), I.stop * dt);   // 誰も乗っていない車：前でも後ろでも 0 に向かって減速（逆には走らない）
    vf -= vf * Math.abs(vf) * 0.0009 * dt;
    // ハンドル（速いほど切れない）
    const maxSt = 0.62 / (1 + Math.abs(vf) / 22);
    this.steer = damp(this.steer, I.st * maxSt, 9, dt);
    const wantYr = vf / T.wb * Math.tan(this.steer) * (I.hb ? 1.45 : 1);
    this.yr = damp(this.yr, wantYr, I.hb ? 4 : 10, dt);
    this.yaw += this.yr * dt;
    // 横すべり：ふつうはすぐ止まる、ハンドブレーキ中はすべる
    const grip = (I.hb ? 1.4 : T.grip) * (this.surfSand ? 0.6 : 1);
    vl *= Math.exp(-grip * dt);
    const sx2 = Math.sin(this.yaw), cz2 = Math.cos(this.yaw);
    this.vx = sx2 * vf + cz2 * vl; this.vz = cz2 * vf - sx2 * vl;
    this.drift = Math.abs(vl) > 3 && Math.abs(vf) > 6;
    // 動かす
    this.x += this.vx * dt; this.z += this.vz * dt;
    // 地面にそわせる
    const gh = groundH(this.x, this.z), hf = groundH(this.x + sx2 * 1.6, this.z + cz2 * 1.6), hr = groundH(this.x - sx2 * 1.6, this.z - cz2 * 1.6);
    const hl = groundH(this.x + cz2 * 0.9, this.z - sx2 * 0.9), hR = groundH(this.x - cz2 * 0.9, this.z + sx2 * 0.9);
    this.y = damp(this.y, gh, 14, dt); this.pitch = damp(this.pitch, -Math.atan2(hf - hr, 3.2), 8, dt); this.roll = damp(this.roll, Math.atan2(hl - hR, 1.8) - vl * 0.006, 8, dt);
    this.surfSand = gh > 0.3 || Math.abs(this.x - CITY.E / 2) > CITY.E / 2 + CITY.IN || this.z < -CITY.IN;
    if (this.surfSand) { const v = this.speed, lim = 30; if (v > lim) { this.vx *= lim / v; this.vz *= lim / v; } }
    // 建物にぶつかる
    this.collideStatic();
    // タイヤ
    this.wheelRot += vf * dt / T.tire;
    for (const w of this.m.wheels) { w.w.rotation.x = this.wheelRot; if (w.front) w.piv.rotation.y = this.steer; }
    this.place();
    // 壊れ具合：煙・炎・爆発
    if (!this.dead && this.hp <= 0) { this.burnT += dt; if (this.burnT > 4) this.explode(); }
    if (this.hp < 350 || this.burnT > 0) { this.smokeT -= dt; if (this.smokeT <= 0) { this.smokeT = this.burnT > 0 ? 0.04 : 0.12; FX.smoke(this.x + sx2 * T.L * 0.38, this.y + T.belt + 0.1, this.z + cz2 * T.L * 0.38, this.burnT > 0); } }
  }
  collideStatic() {
    const cs = this.circles(), p = { x: 0, z: 0 };
    for (const [cx, cz] of cs) {
      p.x = cx; p.z = cz;
      let nx = 0, nz = 0, depth = 0;
      pushOut(p, this.r, this.y, (c, ux, uz, d) => { nx += ux * d; nz += uz * d; depth = Math.max(depth, d); });
      if (depth > 0) {
        const dx = p.x - cx, dz = p.z - cz; this.x += dx; this.z += dz;
        const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
        const vn = this.vx * nx + this.vz * nz;
        if (vn < 0) {
          this.vx -= vn * nx * 1.3; this.vz -= vn * nz * 1.3;
          const hit = -vn; this.yr *= 0.5;
          if (hit > 4) { this.damage(Math.min(340, hit * hit * 0.62), null);   // 80km/h で壁に当たっても 1/3 くらい（3〜4回で火がつく）
           AUDIO.crash(this.x, this.z, Math.min(1, hit / 20)); if (hit > 9) FX.sparks(cx - nx * this.r, this.y + 0.5, cz - nz * this.r, 10); if (this === PLAYER.car) GAME.shake = Math.min(1, hit / 18); }
        }
      }
    }
  }
  damage(n, by) {
    if (this.dead) return;
    this.hp -= n; this.lastHitBy = by;
    if (this.hp < 0 && this.burnT === 0) this.burnT = 0.001;
  }
  explode() {
    this.dead = true; this.hp = -1; this.burnT = 0;
    for (const b of this.m.bodies) b.material = CAR_MAT.burnt; this.m.glass.visible = false; this.m.lights.visible = false; if (this.m.siren) for (const s of this.m.siren) s.visible = false;
    FX.explosion(this.x, this.y + 0.8, this.z);
    AUDIO.boom(this.x, this.z);
    WORLD.blast(this.x, this.z, 7, this);
  }
  dispose() { scene.remove(this.m.g); this.m.g.traverse(o => { if (o.isMesh && o.geometry && !o.geometry.userData.shared && !Object.values(WHEEL_GEO).includes(o.geometry)) o.geometry.dispose(); }); if (this.m.paintMat) this.m.paintMat.dispose(); }   // モデルの形は車種ごとに使い回すので捨てない
}
// ---------- 煙・火花・爆発・弾の線 ----------
const FX = {
  list: [], pool: [],
  geo: new THREE.SphereGeometry(1, 8, 6),
  mats: {
    smoke: new THREE.MeshBasicMaterial({ color: 0x3a3632, transparent: true, opacity: 0.45, depthWrite: false }),
    fire: new THREE.MeshBasicMaterial({ color: 0xff7a20, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }),
    spark: new THREE.MeshBasicMaterial({ color: 0xffd080, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }),
    dust: new THREE.MeshBasicMaterial({ color: 0xcdb48a, transparent: true, opacity: 0.5, depthWrite: false }),
    flash: new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }),
    blood: new THREE.MeshBasicMaterial({ color: 0x6e0f0c, transparent: true, opacity: 0.85, depthWrite: false }),
  },
  add(kind, x, y, z, o) {
    if (this.list.length > 220) return;
    const m = new THREE.Mesh(this.geo, this.mats[kind].clone()); m.position.set(x, y, z); scene.add(m);
    this.list.push(Object.assign({ m, kind, t: 0, life: 1, vx: 0, vy: 0, vz: 0, s0: 0.2, s1: 1, g: 0, o0: m.material.opacity }, o));
  },
  smoke(x, y, z, fire) {
    this.add('smoke', x + rr(-.2, .2), y, z + rr(-.2, .2), { life: 2.2, vy: 1.4, vx: rr(-.3, .3), vz: rr(-.3, .3), s0: 0.25, s1: 1.4 });
    if (fire) this.add('fire', x + rr(-.3, .3), y, z + rr(-.3, .3), { life: 0.5, vy: 2.2, s0: 0.35, s1: 0.1 });
  },
  sparks(x, y, z, n = 8) { for (let i = 0; i < n; i++) this.add('spark', x, y, z, { life: 0.35, vx: rr(-5, 5), vy: rr(1, 5), vz: rr(-5, 5), g: 12, s0: 0.04, s1: 0.02 }); },
  dust(x, y, z) { for (let i = 0; i < 4; i++) this.add('dust', x, y, z, { life: 0.7, vx: rr(-1, 1), vy: rr(.3, 1.2), vz: rr(-1, 1), s0: 0.08, s1: 0.35 }); },
  muzzle(x, y, z) { this.add('flash', x, y, z, { life: 0.06, s0: 0.12, s1: 0.18 }); },
  // 弾が人に当たった：弾の向きに小さなしぶき
  blood(x, y, z, d) {
    this.add('blood', x, y, z, { life: 0.25, s0: 0.06, s1: 0.22 });
    for (let i = 0; i < 5; i++) this.add('blood', x, y, z, { life: 0.4, vx: d.x * rr(1, 3) + rr(-.8, .8), vy: rr(0, 1.6), vz: d.z * rr(1, 3) + rr(-.8, .8), g: 9, s0: 0.035, s1: 0.02 });
  },
  explosion(x, y, z) {
    for (let i = 0; i < 26; i++) this.add('fire', x, y, z, { life: 0.9, vx: rr(-6, 6), vy: rr(1, 8), vz: rr(-6, 6), s0: 0.8, s1: 0.2, g: 4 });
    for (let i = 0; i < 18; i++) this.add('smoke', x, y, z, { life: 3, vx: rr(-3, 3), vy: rr(2, 5), vz: rr(-3, 3), s0: 0.8, s1: 3 });
    this.sparks(x, y, z, 20); GAME.flash = 0.6; GAME.shake = Math.max(GAME.shake, 0.8 * clamp(1 - Math.hypot(PLAYER.pos.x - x, PLAYER.pos.z - z) / 60, 0, 1));
  },
  tracer(a, b) {
    const g = new THREE.BufferGeometry().setFromPoints([a, b]), l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.9 }));
    scene.add(l); this.list.push({ m: l, kind: 'line', t: 0, life: 0.06 });
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]; p.t += dt; const k = p.t / p.life;
      if (k >= 1) { scene.remove(p.m); p.m.geometry !== this.geo && p.m.geometry.dispose(); p.m.material.dispose(); this.list.splice(i, 1); continue; }
      if (p.kind === 'line') { p.m.material.opacity = 0.9 * (1 - k); continue; }
      p.vy -= (p.g || 0) * dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      p.m.scale.setScalar(lerp(p.s0, p.s1, k)); p.m.material.opacity = p.o0 * (1 - k);
    }
  },
};
