// ================= 物理（cannon-es） =================
const GRAV = 20;
const world = new C.World({ gravity: new C.Vec3(0, -GRAV, 0) });
world.broadphase = new C.SAPBroadphase(world);
world.allowSleep = false;
world.solver.iterations = 14; world.solver.tolerance = .0005;
const PH = 1 / 120;   // 1回のこまかい時間
// あたりのグループ
const GW = 1, GB = 2, GA = 4, GP = 8;   // 地形・体・手・物
const MAT = { ground: new C.Material('ground'), body: new C.Material('body'), hand: new C.Material('hand'), prop: new C.Material('prop'), ice: new C.Material('ice') };
world.addContactMaterial(new C.ContactMaterial(MAT.body, MAT.ground, { friction: 0, restitution: 0 }));
world.addContactMaterial(new C.ContactMaterial(MAT.body, MAT.prop, { friction: 0, restitution: 0 }));
world.addContactMaterial(new C.ContactMaterial(MAT.hand, MAT.ground, { friction: .9, restitution: 0 }));
world.addContactMaterial(new C.ContactMaterial(MAT.hand, MAT.prop, { friction: .9, restitution: 0 }));
world.addContactMaterial(new C.ContactMaterial(MAT.prop, MAT.ground, { friction: .5, restitution: .05 }));
world.addContactMaterial(new C.ContactMaterial(MAT.prop, MAT.prop, { friction: .6, restitution: .05 }));
world.defaultContactMaterial.friction = .4;
const V3 = (x = 0, y = 0, z = 0) => new C.Vec3(x, y, z);
const OBJS = [];     // 見た目と物理をつなぐ（動く物）
const PROPS = [];    // 運べる物（落ちたら元の場所へ）

function boxMesh(w, h, d, kind, hex, rep) {
  const g = new T.BoxGeometry(w, h, d);
  if (rep) { const uv = g.attributes.uv, n = g.attributes.normal; for (let i = 0; i < uv.count; i++) { const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)); const su = nx > .5 ? d : w, sv = ny > .5 ? d : h; uv.setXY(i, uv.getX(i) * su / rep, uv.getY(i) * sv / rep); } }
  const m = new T.Mesh(g, mat(kind, hex)); m.castShadow = m.receiveShadow = true; return m;
}
// 箱：cx,cy,cz は真ん中。o.mass>0 で動く物、o.kin で決まった動きをする物
function box(cx, cy, cz, w, h, d, kind, hex, o = {}) {
  const type = o.kin ? C.Body.KINEMATIC : (o.mass ? C.Body.DYNAMIC : C.Body.STATIC);
  const b = new C.Body({ mass: o.mass || 0, type, material: o.mat || (o.mass ? MAT.prop : MAT.ground), position: V3(cx, cy, cz),
    collisionFilterGroup: o.mass ? GP : GW, collisionFilterMask: o.mask ?? (GW | GB | GA | GP), linearDamping: .05, angularDamping: .1 });
  b.addShape(new C.Box(V3(w / 2, h / 2, d / 2)));
  if (o.yaw) b.quaternion.setFromEuler(0, o.yaw, 0);
  if (o.rx) b.quaternion.setFromEuler(o.rx, o.yaw || 0, 0);
  world.addBody(b);
  const m = boxMesh(w, h, d, kind, hex, o.rep === undefined ? (kind === 'crate' ? 0 : 2) : o.rep); scene.add(m);
  m.position.copy(b.position); m.quaternion.copy(b.quaternion);
  if (o.mass || o.kin) OBJS.push({ b, m });
  b.kind = kind; return { b, m };
}
function cyl(cx, cy, cz, r, h, kind, hex, o = {}) {
  const type = o.kin ? C.Body.KINEMATIC : (o.mass ? C.Body.DYNAMIC : C.Body.STATIC);
  const b = new C.Body({ mass: o.mass || 0, type, material: o.mass ? MAT.prop : MAT.ground, position: V3(cx, cy, cz), collisionFilterGroup: o.mass ? GP : GW, collisionFilterMask: GW | GB | GA | GP, angularDamping: .1 });
  b.addShape(new C.Cylinder(r, r, h, 16)); world.addBody(b);
  const m = new T.Mesh(new T.CylinderGeometry(r, r, h, 24), mat(kind, hex)); m.castShadow = m.receiveShadow = true; scene.add(m); m.position.copy(b.position);
  if (o.mass || o.kin) OBJS.push({ b, m });
  return { b, m };
}
function ball(cx, cy, cz, r, kind, hex, mass) {
  const b = new C.Body({ mass, material: MAT.prop, position: V3(cx, cy, cz), collisionFilterGroup: GP, collisionFilterMask: GW | GB | GA | GP, linearDamping: .1, angularDamping: .2 });
  b.addShape(new C.Sphere(r)); world.addBody(b);
  const m = new T.Mesh(new T.SphereGeometry(r, 24, 16), mat(kind, hex)); m.castShadow = m.receiveShadow = true; scene.add(m);
  OBJS.push({ b, m }); return { b, m };
}
// 運べる物：島ごとに元の場所を覚えておく
function prop(o, sec) { const p = { b: o.b, m: o.m, sec, p0: o.b.position.clone(), q0: o.b.quaternion.clone() }; PROPS.push(p); o.b.isProp = true; return p; }
function resetProp(p) { p.b.position.copy(p.p0); p.b.quaternion.copy(p.q0); p.b.velocity.setZero(); p.b.angularVelocity.setZero(); }
function syncObjs() { for (const o of OBJS) { o.m.position.copy(o.b.position); o.m.quaternion.copy(o.b.quaternion); } }
// 決まった動き：毎回、次の位置へ向かう速さを入れる（乗っている物も運ばれる）
function kinTo(b, x, y, z, h) { b.velocity.set((x - b.position.x) / h, (y - b.position.y) / h, (z - b.position.z) / h); }
function kinRot(b, q, h) {   // 今の向きから q へ、h 秒で回る
  const dq = q.mult(b.quaternion.conjugate()); if (dq.w < 0) { dq.x = -dq.x; dq.y = -dq.y; dq.z = -dq.z; dq.w = -dq.w; } let ang = 2 * Math.acos(clamp(dq.w, -1, 1)); const s = Math.sqrt(Math.max(0, 1 - dq.w * dq.w));
  if (ang > Math.PI) ang -= TAU;
  if (s < 1e-6) b.angularVelocity.setZero(); else b.angularVelocity.set(dq.x / s * ang / h, dq.y / s * ang / h, dq.z / s * ang / h);
}
