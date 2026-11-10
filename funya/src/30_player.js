// ================= もちお（ぐにゃぐにゃの体） =================
const RIDE = .62, BODY_M = 30, ARM_M = 2.5, ARM_L = .62, SPEED = 4.2, JUMP_V = 7.4;
const SHOULDER = [V3(-.34, .55, 0), V3(.34, .55, 0)], HAND_LOC = V3(0, 0, 0);   // 手は丸い玉。肩とは「のびきると張るひも」でつながる（ひじのように曲がる）
const P = { body: null, arms: [], onGround: false, coyote: 0, jumpBuf: 0, jumpT: 0, gHit: null, gBody: null, gDist: 9, gY: 0, gN: new C.Vec3(0, 1, 0), airT: 0, landV: 0,
  model: null, phase: 0, feet: [new T.Vector3(), new T.Vector3()], climbing: false, falls: 0, time: 0, lastBump: 0 };
const _ray = new C.RaycastResult(), _v = new C.Vec3(), _w = new C.Vec3(), _r = new C.Vec3(), _f = new C.Vec3();

function buildPlayer(x, y, z) {
  const b = new C.Body({ mass: BODY_M, material: MAT.body, position: V3(x, y, z), collisionFilterGroup: GB, collisionFilterMask: GW | GP, linearDamping: .02, angularDamping: .35 });
  b.addShape(new C.Sphere(.3), V3(0, 0, 0)); b.addShape(new C.Sphere(.3), V3(0, .42, 0)); b.addShape(new C.Sphere(.26), V3(0, .88, 0));
  world.addBody(b); P.body = b;
  for (let i = 0; i < 2; i++) {
    const s = SHOULDER[i], a = new C.Body({ mass: ARM_M, material: MAT.hand, position: V3(x + s.x, y + s.y - ARM_L, z), collisionFilterGroup: GA, collisionFilterMask: GW | GP, linearDamping: .15, angularDamping: .6 });
    a.addShape(new C.Sphere(.15)); world.addBody(a);
    P.arms.push({ b: a, side: i ? 1 : -1, grab: null, gBody: null, gLoc: null, up: false, t: 0 });
  }
  P.model = makeModel();
}

// 見た目：白いおもちの体に、さくら色のずきん
function makeModel() {
  const M = { root: new T.Group(), arms: [], legs: [], feet: [], hands: [] };
  const skin = mat('soft', 0xfff6ec), hood = mat('soft', 0xff8fb0), dark = mat('soft', 0x3a2a34), cheek = mat('soft', 0xffa0a8), leaf = mat('soft', 0x6cc24a), shoe = mat('soft', 0x6a5ad0);
  const sph = (r, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new T.Mesh(new T.SphereGeometry(r, 24, 16), m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; return o; };
  const body = new T.Group(); M.root.add(body); M.body = body;
  body.add(sph(.34, skin, 0, .02, 0, 1, 1.05, .95));          // おなか
  body.add(sph(.31, hood, 0, .42, 0, 1.02, .95, 1));          // ずきんの肩
  const head = new T.Group(); head.position.set(0, .88, 0); body.add(head); M.head = head;
  head.add(sph(.3, skin, 0, 0, 0, 1, .95, 1));
  head.add(sph(.33, hood, 0, .08, .05, 1.02, .9, 1.02));     // ずきん
  const face = sph(.25, skin, 0, -.02, -.1, 1, .95, .9); head.add(face);
  for (const s of [-1, 1]) { head.add(sph(.045, dark, s * .1, .02, -.33, 1, 1.3, .6)); head.add(sph(.05, cheek, s * .17, -.07, -.3, 1, .6, .4)); head.add(sph(.08, hood, s * .2, .32, .02, .8, 1.3, .8)); }
  const mouth = new T.Mesh(new T.TorusGeometry(.035, .012, 6, 12, Math.PI), dark); mouth.position.set(0, -.08, -.335); mouth.rotation.z = Math.PI; head.add(mouth);
  const stem = new T.Mesh(new T.CylinderGeometry(.015, .02, .14, 6), leaf); stem.position.set(0, .42, .02); head.add(stem);
  const lf = sph(.07, leaf, .06, .5, .02, 1.3, .35, .7); lf.rotation.z = -.5; head.add(lf);
  for (let i = 0; i < 2; i++) {
    const arm = new T.Mesh(new T.CapsuleGeometry(.085, 1, 4, 10), hood); arm.castShadow = true; M.root.add(arm); M.arms.push(arm);
    const hand = sph(.13, skin, 0, 0, 0); M.root.add(hand); M.hands.push(hand);
    const leg = new T.Mesh(new T.CapsuleGeometry(.1, 1, 4, 10), skin); leg.castShadow = true; M.root.add(leg); M.legs.push(leg);
    const foot = sph(.13, shoe, 0, 0, 0, .9, .6, 1.35); M.root.add(foot); M.feet.push(foot);
  }
  scene.add(M.root); return M;
}
const _a = new T.Vector3(), _b = new T.Vector3(), _up = new T.Vector3(0, 1, 0), _q = new T.Quaternion(), _hip = new T.Vector3();

// ---------- 1回分の動き（1/120 秒） ----------
function armDir(i) {
  const fp = SET.camD < FP_D, p = clamp(CAM.pitch + (fp ? 0 : .32), -1.25, 1.45), y = CAM.yaw;
  _v.set(-Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p));
  _w.set(Math.cos(y), 0, -Math.sin(y));   // 右
  return _v;
}
function groundProbe() {
  const b = P.body, from = V3(b.position.x, b.position.y, b.position.z), to = V3(b.position.x, b.position.y - 1.6, b.position.z);
  let best = null;
  world.raycastAll(from, to, { collisionFilterMask: GW | GP, skipBackfaces: true }, r => {
    if (P.arms.some(a => a.gBody === r.body && r.body.type === C.Body.DYNAMIC)) return;   // 自分が持っている物には乗れない
    if (!best || r.distance < best.d) best = { d: r.distance, body: r.body, y: r.hitPointWorld.y, n: r.hitNormalWorld.clone() };
  });
  return best;
}
function pstep(h, inp) {
  const b = P.body, m = BODY_M;
  P.jumpT = Math.max(0, P.jumpT - h);
  // 足もと
  const g = groundProbe(); P.gHit = g; P.gBody = g ? g.body : null; P.gDist = g ? g.d : 9; if (g) { P.gY = g.y; P.gN.copy(g.n); }
  const gv = (g && g.body.type !== C.Body.STATIC) ? g.body.velocity : null;
  const wasG = P.onGround;
  P.onGround = !!g && g.d < RIDE + .14 && P.jumpT <= 0 && g.n.y > .55;
  // よじのぼり：動かない物（か重い物）のふちを、体より上でつかんで、ジャンプ長押し
  let cg = null;
  if (inp.jumpHeld) for (const A of P.arms) if (A.grab && (A.gBody.type !== C.Body.DYNAMIC || A.gBody.mass > 40)) { const gp = A.gBody.pointToWorldFrame(A.gLoc, new C.Vec3()); if (gp.y > b.position.y - (P.climbing ? 1.1 : .3) && (!cg || gp.y > cg.y)) cg = gp; }
  P.climbing = !!cg;
  if (cg) {
    const up = b.position.y < cg.y + .8 ? m * (GRAV + 10) : m * GRAV * .7;
    b.applyForce(V3(0, up - b.velocity.y * m * 3, 0), V3(0, 0, 0));
    if (b.position.y > cg.y - .3) { const dx = cg.x - b.position.x, dz = cg.z - b.position.z, l = Math.hypot(dx, dz) || 1; b.applyForce(V3(dx / l * m * 9, 0, dz / l * m * 9), V3(0, 0, 0)); }
  }
  if (g && !cg && g.d < RIDE + .32 && P.jumpT <= 0 && g.n.y > .55) {
    const vrel = b.velocity.y - (gv ? gv.y : 0), k = m * 150, c = m * 15;
    const fy = clamp(m * GRAV + k * (RIDE - g.d) - c * vrel, 0, m * GRAV * 3.5);
    b.applyForce(V3(0, fy, 0), V3(0, 0, 0));
    if (g.body.type === C.Body.DYNAMIC) g.body.applyForce(V3(0, -Math.min(fy, m * GRAV * 1.2), 0), V3(b.position.x - g.body.position.x, g.y - g.body.position.y, b.position.z - g.body.position.z));
  }
  if (P.onGround && !wasG && P.airT > .25) { AU.land(-P.landV); }
  if (P.onGround) { P.airT = 0; } else { P.airT += h; P.landV = Math.min(P.landV, b.velocity.y); }
  if (P.onGround) P.landV = 0;
  // 歩く（見ている向きが前）
  const y = CAM.yaw, fx = -Math.sin(y), fz = -Math.cos(y), rx = Math.cos(y), rz = -Math.sin(y);
  let vx = (fx * inp.mz + rx * inp.mx) * SPEED, vz = (fz * inp.mz + rz * inp.mx) * SPEED;
  if (P.climbing) { vx *= .3; vz *= .3; }
  if (gv && P.onGround) { vx += gv.x; vz += gv.z; }
  const moving = Math.hypot(inp.mx, inp.mz) > .05;
  const gain = P.onGround ? 11 : (moving ? 2.2 : .4);
  let ax = (vx - b.velocity.x) * gain, az = (vz - b.velocity.z) * gain; const al = Math.hypot(ax, az), amax = P.onGround ? 45 : 12; if (al > amax) { ax *= amax / al; az *= amax / al; }
  b.applyForce(V3(ax * m, 0, az * m), V3(0, 0, 0));
  // ジャンプ
  P.jumpBuf = inp.jumpE ? .14 : Math.max(0, P.jumpBuf - h);
  P.coyote = P.onGround ? .12 : Math.max(0, P.coyote - h);
  if (P.jumpBuf > 0 && P.coyote > 0) { b.velocity.y = (gv ? Math.max(0, gv.y) : 0) + JUMP_V; P.jumpBuf = 0; P.coyote = 0; P.jumpT = .22; P.onGround = false; AU.jump(); }
  // 立ったまま（ぐらぐらはする）、見ている向きを向く
  _r.set(0, 1, 0); b.quaternion.vmult(_r, _r);
  const axx = -_r.z, axz = _r.x;   // 体の上 × 真上（まっすぐにもどす回転の軸）
  const w = b.angularVelocity, kU = 900, cU = 95;
  const fw = V3(0, 0, -1); b.quaternion.vmult(fw, fw); const yawB = Math.atan2(-fw.x, -fw.z), dy = angD(y - yawB);
  b.torque.x += axx * kU - w.x * cU; b.torque.z += axz * kU - w.z * cU; b.torque.y += dy * 260 - w.y * 38;
  // 手
  for (let i = 0; i < 2; i++) {
    const A = P.arms[i], a = A.b, want = i ? inp.hR : inp.hL;
    A.up = want; if (!want && A.grab) release(A);
    const sw = b.pointToWorldFrame(SHOULDER[i], new C.Vec3()), hw = a.position.clone();
    // うで（ひも）：のびきったら、手と体を引きよせ合う
    { const dx = hw.x - sw.x, dy = hw.y - sw.y, dz = hw.z - sw.z, d = Math.hypot(dx, dy, dz);
      if (d > ARM_L && !(P.climbing && A.grab)) { const ux = dx / d, uy = dy / d, uz = dz / d, rs = sw.vsub(b.position), vs = b.velocity.vadd(b.angularVelocity.cross(rs));
        const vr = (a.velocity.x - vs.x) * ux + (a.velocity.y - vs.y) * uy + (a.velocity.z - vs.z) * uz;
        const fm = Math.min(9000, 7000 * (d - ARM_L) + 160 * Math.max(-20, vr)); if (fm > 0) { a.applyForce(V3(-ux * fm, -uy * fm, -uz * fm), V3()); b.applyForce(V3(ux * fm, uy * fm, uz * fm), rs); } } }
    if (want && !(P.climbing && A.grab)) {
      // 手は胸の前の、見ている先へ（左右の手が少しだけはなれる）
      const d = armDir(i), cx = b.position.x, cy = b.position.y + .55, cz = b.position.z, rxx = Math.cos(CAM.yaw), rzz = -Math.sin(CAM.yaw), sd = .13 * A.side;
      const tx = cx + d.x * (ARM_L + .12) + rxx * sd, ty = cy + d.y * (ARM_L + .12), tz = cz + d.z * (ARM_L + .12) + rzz * sd;
      const rh = V3(), vh = a.velocity, rs = sw.vsub(b.position), vs = b.velocity.vadd(b.angularVelocity.cross(rs));
      const kA = A.grab ? 1000 : 700, cA = A.grab ? 50 : 38;
      _f.set(kA * (tx - hw.x) - cA * (vh.x - vs.x), kA * (ty - hw.y) - cA * (vh.y - vs.y), kA * (tz - hw.z) - cA * (vh.z - vs.z));
      const fl = _f.length(), fm = A.grab ? 650 : 500; if (fl > fm) _f.scale(fm / fl, _f);
      a.applyForce(_f, rh); b.applyForce(_f.scale(A.grab ? -.35 : -1), rs);   // つかんでいるときは、体をおし返しすぎない（歩いて押せる）
      if (!A.grab) a.applyForce(V3(0, ARM_M * GRAV * .9, 0), rh);   // 手の重さを少し助ける
    }
    if (A.grab) {
      // 引っぱられすぎたらはなれる
      if (hw.distanceTo(sw) > ARM_L + (P.climbing ? 1.4 : .45)) { release(A); continue; }
    }
  }
  b.applyForce(V3(0, 0, 0), V3(0, 0, 0));
}
function release(A) { if (A.grab) { world.removeConstraint(A.grab); A.grab = null; A.gBody = null; A.gLoc = null; } }
// 物理を1回すすめたあと：手がさわっている物をつかむ
function afterPhys() {
  for (const A of P.arms) {
    if (!A.up || A.grab) continue;
    for (const ce of world.contacts) {
      let other = null; if (ce.bi === A.b) other = ce.bj; else if (ce.bj === A.b) other = ce.bi;
      if (!other || other === P.body) continue;
      const hw = A.b.pointToWorldFrame(HAND_LOC, new C.Vec3());
      const loc = other.pointToLocalFrame(hw, new C.Vec3());
      const j = new C.PointToPointConstraint(A.b, HAND_LOC, other, loc, 4000); world.addConstraint(j);
      A.grab = j; A.gBody = other; A.gLoc = loc; AU.grab(); break;
    }
  }
}
function placePlayer(x, y, z, yaw = CAM.yaw) {
  for (const A of P.arms) release(A);
  const b = P.body; b.position.set(x, y + RIDE + .05, z); b.velocity.setZero(); b.angularVelocity.setZero(); b.quaternion.setFromEuler(0, yaw, 0);
  P.arms.forEach((A, i) => { const s = b.pointToWorldFrame(SHOULDER[i], new C.Vec3()); A.b.position.set(s.x, s.y - ARM_L + .05, s.z); A.b.velocity.setZero(); A.b.angularVelocity.setZero(); A.b.quaternion.set(0, 0, 0, 1); });
  CAM.yaw = yaw; CAM.pitch = -.2; P.jumpT = 0; P.airT = 0; P.landV = 0; camSnap = true;
  const g = P.feet; g[0].set(x - .14, y, z); g[1].set(x + .14, y, z);
}

// ---------- 見た目を物理に合わせる・歩く足 ----------
function animPlayer(dt) {
  const M = P.model, b = P.body; if (!M) return;
  M.body.position.copy(b.position); M.body.quaternion.copy(b.quaternion);
  const fp = SET.camD < FP_D;
  M.body.visible = !fp;
  for (let i = 0; i < 2; i++) {
    const A = P.arms[i], s = b.pointToWorldFrame(SHOULDER[i], new C.Vec3()), hw = A.b.pointToWorldFrame(HAND_LOC, new C.Vec3());
    _a.set(s.x, s.y, s.z); _b.set(hw.x, hw.y, hw.z);
    M.hands[i].position.copy(_b);
    const arm = M.arms[i]; const d = _b.clone().sub(_a), L = d.length(); arm.position.copy(_a).addScaledVector(d, .5); arm.quaternion.setFromUnitVectors(_up, d.divideScalar(L || 1)); arm.scale.set(1, L / 1.17, 1);
    M.hands[i].scale.setScalar(A.grab ? 1.15 : 1);
  }
  // 足：地面にあるときは、進む向きに合わせて交互に出す
  const hv = Math.hypot(b.velocity.x, b.velocity.z);
  const fw = new C.Vec3(0, 0, -1); b.quaternion.vmult(fw, fw); const yawB = Math.atan2(-fw.x, -fw.z);
  const rx = Math.cos(yawB), rz = -Math.sin(yawB);
  const mvx = hv > .2 ? b.velocity.x / hv : -Math.sin(yawB), mvz = hv > .2 ? b.velocity.z / hv : -Math.cos(yawB);
  P.phase += dt * Math.min(hv, 6) * 3.1;
  for (let i = 0; i < 2; i++) {
    const s = i ? 1 : -1;
    const hip = b.pointToWorldFrame(V3(s * .14, -.18, 0), new C.Vec3()); _hip.set(hip.x, hip.y, hip.z);
    const f = P.feet[i];
    if (P.gHit && P.gDist < RIDE + .45) {
      const ph = P.phase + (i ? Math.PI : 0), st = hv > .3 ? Math.sin(ph) * clamp(hv * .09, 0, .32) : 0, lift = hv > .3 ? Math.max(0, Math.cos(ph)) * .16 : 0;
      const tx = b.position.x + rx * s * .15 + mvx * st, tz = b.position.z + rz * s * .15 + mvz * st, ty = P.gY + .07 + lift;
      f.x += (tx - f.x) * Math.min(1, dt * 22); f.z += (tz - f.z) * Math.min(1, dt * 22); f.y += (ty - f.y) * Math.min(1, dt * 22);
    } else {
      const tx = _hip.x - mvx * .08, tz = _hip.z - mvz * .08, ty = _hip.y - .42 + (i ? .05 : -.02) * Math.sin(P.time * 9);
      f.x += (tx - f.x) * Math.min(1, dt * 12); f.y += (ty - f.y) * Math.min(1, dt * 12); f.z += (tz - f.z) * Math.min(1, dt * 12);
    }
    // 足は体からはなれすぎない
    _a.subVectors(f, _hip); if (_a.length() > .62) { _a.setLength(.62); f.copy(_hip).add(_a); }
    const leg = M.legs[i]; const d = f.clone().sub(_hip), L = d.length(); leg.position.copy(_hip).addScaledVector(d, .5); leg.quaternion.setFromUnitVectors(_up, d.divideScalar(L || 1)); leg.scale.set(1, Math.max(.05, L) / 1.2, 1);
    M.legs[i].visible = M.feet[i].visible = !fp;
    M.feet[i].position.copy(f); M.feet[i].rotation.set(0, yawB, 0);
  }
}

// ================= カメラ（エッグゲームのように、いちばん近づけると一人称） =================
const CAM = { yaw: 0, pitch: -.2, cur: SET.camD, piv: new T.Vector3() };
const FP_D = .9, CAM_MAX = 10;
let camBack = SET.camD >= FP_D ? SET.camD : 4.5, camSnap = true;
function setCamD(d) { SET.camD = clamp(d, 0, CAM_MAX); if (SET.camD >= FP_D) camBack = SET.camD; saveSet(); viewShow(); }
function toggleView() { setCamD(SET.camD < FP_D ? Math.max(3, camBack) : 0); }
function viewShow() { const b = $('bView'); if (b) b.textContent = SET.camD < FP_D ? '3人称' : '1人称'; $('cross').classList.toggle('fp', SET.camD < FP_D); }
const _dir = new T.Vector3();
function updCam(dt) {
  const sens = .0024 * SET.sens, fp = SET.camD < FP_D;
  CAM.yaw -= IN.lookX * sens; CAM.pitch = clamp(CAM.pitch - IN.lookY * sens * (SET.invY ? -1 : 1), -1.4, 1.4); IN.lookX = IN.lookY = 0;
  if (IN.zoom) { setCamD(SET.camD + IN.zoom); IN.zoom = 0; }
  const cp = Math.cos(CAM.pitch); _dir.set(-Math.sin(CAM.yaw) * cp, Math.sin(CAM.pitch), -Math.cos(CAM.yaw) * cp);
  const b = P.body;
  if (fp) {
    const e = b.pointToWorldFrame(V3(0, .9, -.12), new C.Vec3());
    camera.position.set(e.x, e.y, e.z); camera.lookAt(e.x + _dir.x, e.y + _dir.y, e.z + _dir.z); CAM.cur = 0; camSnap = true; return;
  }
  const tx = b.position.x, ty = b.position.y + .8, tz = b.position.z;
  if (camSnap) { CAM.piv.set(tx, ty, tz); camSnap = false; }
  const k = Math.min(1, dt * 14); CAM.piv.x += (tx - CAM.piv.x) * k; CAM.piv.y += (ty - CAM.piv.y) * Math.min(1, dt * 9); CAM.piv.z += (tz - CAM.piv.z) * k;
  // かべにめりこまない
  let allow = SET.camD;
  const from = V3(CAM.piv.x, CAM.piv.y, CAM.piv.z), to = V3(CAM.piv.x - _dir.x * SET.camD, CAM.piv.y - _dir.y * SET.camD, CAM.piv.z - _dir.z * SET.camD);
  _ray.reset(); world.raycastClosest(from, to, { collisionFilterMask: GW, skipBackfaces: true }, _ray);
  if (_ray.hasHit) allow = Math.max(.4, _ray.distance - .25);
  CAM.cur = allow < CAM.cur || CAM.cur < FP_D ? allow : CAM.cur + (allow - CAM.cur) * Math.min(1, dt * 3);
  camera.position.set(CAM.piv.x - _dir.x * CAM.cur, CAM.piv.y - _dir.y * CAM.cur, CAM.piv.z - _dir.z * CAM.cur);
  camera.lookAt(CAM.piv.x + _dir.x, CAM.piv.y + _dir.y, CAM.piv.z + _dir.z);
  if (P.model) P.model.body.visible = CAM.cur > .7;
}
