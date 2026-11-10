// ================= のぼる子（動き・当たり・見た目・カメラ） =================
const PR = .3, SPH = [.3, .85, 1.38];
const GRAV = 24, JUMP_V = 8.6, WALK = 5.0, SPRINT = 7.6, MAXF = 52, WATER_Y = -.45;
const START = { x: 0, y: 0, z: 13, yaw: Math.PI };
const P = { pos: new T.Vector3(START.x, START.y, START.z), vel: new T.Vector3(), yaw: START.yaw, onGround: false, gN: new T.Vector3(0, 1, 0), gCol: null,
  coyote: 0, jumpBuf: 0, airTop: 0, airT: 0, best: 0, falls: 0, time: 0, stepT: 0, squash: 0, phase: 0, model: null, fallMsg: 0 };
const _o = { x: 0, y: 0, z: 0 }, _cand = [];
const EV = { landed: 0, landV: 0, drop: 0, splash: false };   // このコマで起きたこと（HUD・音のため）

function collidePlayer() {
  queryBox(P.pos.x - .7, P.pos.y - .5, P.pos.z - .7, P.pos.x + .7, P.pos.y + 2.1, P.pos.z + .7, _cand);
  let block = null;
  for (let it = 0; it < 4; it++) {
    let any = false;
    for (let si = 0; si < 3; si++) {
      for (const c of _cand) {
        if (!pushSphere(c, P.pos.x, P.pos.y + SPH[si], P.pos.z, PR, _o)) continue;
        const len = Math.hypot(_o.x, _o.y, _o.z); if (len < 1e-7) continue;
        const nx = _o.x / len, ny = _o.y / len, nz = _o.z / len;
        P.pos.x += _o.x; P.pos.y += _o.y; P.pos.z += _o.z; any = true;
        const vn = P.vel.x * nx + P.vel.y * ny + P.vel.z * nz;
        if (vn < 0) { P.vel.x -= vn * nx; P.vel.y -= vn * ny; P.vel.z -= vn * nz; }
        if (ny > .62) { P.onGround = true; P.gN.set(nx, ny, nz); P.gCol = c; }
        else if (ny < -.6 && P.vel.y > 0) P.vel.y = 0;
        else if (Math.abs(ny) < .35 && si < 2) block = c;
      }
    }
    if (!any) break;
  }
  return block;
}
// 足の下に地面があるか（なければ -1、あれば距離）
function groundBelow(maxD) {
  queryBox(P.pos.x - .6, P.pos.y - maxD - .4, P.pos.z - .6, P.pos.x + .6, P.pos.y + .8, P.pos.z + .6, _cand);
  for (let d = 0; d <= maxD + 1e-6; d += .04) {
    for (const c of _cand) if (pushSphere(c, P.pos.x, P.pos.y - d + PR - .015, P.pos.z, PR, _o) && _o.y > .55 * Math.hypot(_o.x, _o.y, _o.z)) return d;
  }
  return -1;
}
// その場所に体がおさまるか（めりこまないか）
function fits(x, y, z) {
  queryBox(x - .5, y - .1, z - .5, x + .5, y + 1.9, z + .5, _cand);
  for (const c of _cand) for (let si = 0; si < 3; si++) if (pushSphere(c, x, y + SPH[si], z, PR - .02, _o)) return false;
  return true;
}

// 1回分の動き（dt は 1/120 秒くらい）。inp = { dx, dz（行きたい向き・長さ1まで）, sprint, jumpE }
function pstep(dt, inp) {
  // 動く足場にのっていたら、いっしょに動く
  if (P.onGround && P.gCol && P.gCol.mv) {
    const m = P.gCol.mv;
    if (m.dAng) { const dx = P.pos.x - m.x, dz = P.pos.z - m.z, c = Math.cos(m.dAng), s = Math.sin(m.dAng); P.pos.x = m.x + dx * c + dz * s; P.pos.z = m.z - dx * s + dz * c; P.yaw += m.dAng; }
    if (m.dOff) P.pos.y += m.dOff;
  }
  const wasG = P.onGround, gc = P.gCol;
  const spd = (inp.sprint ? SPRINT : WALK) * Math.min(1, Math.hypot(inp.dx, inp.dz));
  const mag = Math.hypot(inp.dx, inp.dz), ux = mag > 1e-4 ? inp.dx / mag : 0, uz = mag > 1e-4 ? inp.dz / mag : 0;
  // 慣性なし：地面でも空中でも、入力した向きと速さにすぐなる（はなせばすぐ止まる）
  P.vel.x = ux * spd; P.vel.z = uz * spd;
  if (mag > .05) P.yaw += angD(Math.atan2(ux, uz) - P.yaw) * Math.min(1, dt * 14);
  // ジャンプ（少し早めに押しても、ふちから少し出てからでも跳べる）
  P.jumpBuf = inp.jumpE ? .14 : Math.max(0, P.jumpBuf - dt);
  P.coyote = P.onGround ? .11 : Math.max(0, P.coyote - dt);
  let jumped = false;
  if (P.jumpBuf > 0 && P.coyote > 0) {
    P.vel.y = JUMP_V + (gc && gc.mv && gc.mv.type === 'lift' ? Math.max(0, gc.mv.dOff / dt) : 0);
    P.onGround = false; P.coyote = 0; P.jumpBuf = 0; jumped = true; P.airTop = P.pos.y; P.airT = 0; AU.jump();
  }
  P.vel.y = Math.max(-MAXF, P.vel.y - GRAV * dt);
  const vy0 = P.vel.y;
  P.pos.addScaledVector(P.vel, dt);
  P.onGround = false; P.gCol = null;
  const block = collidePlayer();
  // 小さな段は、そのまま上がる（0.55m まで）
  if (!P.onGround && wasG && block && block.flat && !jumped) {
    const up = block.top - P.pos.y;
    if (up > .02 && up < .56 && fits(P.pos.x, block.top + .01, P.pos.z)) { P.pos.y = block.top + .01; P.vel.y = 0; P.onGround = true; P.gCol = block; }
  } else if (P.onGround && block && block.flat && !jumped && mag > .05) {
    const up = block.top - P.pos.y, bx = P.pos.x + ux * .2, bz = P.pos.z + uz * .2;
    if (up > .02 && up < .56 && fits(bx, block.top + .01, bz)) { P.pos.set(bx, block.top + .01, bz); P.gCol = block; }
  }
  // 下り坂や段を下りるとき、地面からはなれないように
  if (!P.onGround && wasG && !jumped && P.vel.y <= 0) { const d = groundBelow(.36); if (d >= 0) { P.pos.y -= d; P.onGround = true; P.gCol = gc; collidePlayer(); P.onGround = true; } }
  if (P.onGround) {
    if (P.vel.y < 0) P.vel.y = 0;
    if (!wasG) { // 着地
      const drop = P.airTop - P.pos.y; EV.landed = 1; EV.landV = -vy0; EV.drop = drop; P.squash = clamp(-vy0 / 22, .12, .5); AU.land(-vy0);
    }
  } else {
    if (wasG && !jumped) { P.airTop = P.pos.y; P.airT = 0; }
    P.airTop = Math.max(P.airTop, P.pos.y); P.airT += dt;
  }
  // 足音
  const hs = Math.hypot(P.vel.x, P.vel.z);
  if (P.onGround && hs > 1) { P.stepT -= dt * hs / 2.3; if (P.stepT <= 0) { P.stepT = 1; AU.step(P.gCol && P.gCol.kind); } }
  // 海に落ちた
  if (P.pos.y < WATER_Y) { EV.splash = true; AU.splash(); respawnStart(); }
}
function respawnStart() { P.pos.set(START.x, START.y + .02, START.z); P.vel.set(0, 0, 0); P.yaw = START.yaw; P.onGround = false; P.airTop = P.pos.y; CAM.yaw = START.yaw; }

// ---------- 見た目：赤いニット帽に黄色い雨がっぱ、青緑のリュックの子 ----------
function buildPlayer() {
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o));
  const skin = M(0xffd9b8), coat = M(0xf2c230, { roughness: .55 }), pants = M(0x2b3550), hat = M(0xe04a3a, { roughness: .9 }), pack = M(0x2aa69a), shoe = M(0x8a4a2a), dark = M(0x1e1e24), white = M(0xffffff, { roughness: .9 });
  const root = new T.Group(), body = new T.Group(); root.add(body);
  const mk = (geo, mat, x, y, z, par = body) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m; };
  mk(new T.CylinderGeometry(.2, .25, .55, 14), coat, 0, 1.0, 0);
  mk(new T.SphereGeometry(.25, 14, 10), coat, 0, .74, 0).scale.set(1, .45, 1);
  const head = new T.Group(); head.position.set(0, 1.42, 0); body.add(head);
  mk(new T.SphereGeometry(.25, 18, 14), skin, 0, 0, 0, head);
  mk(new T.SphereGeometry(.262, 18, 12, 0, TAU, 0, Math.PI * .52), hat, 0, .03, 0, head);
  mk(new T.CylinderGeometry(.265, .265, .07, 18), M(0xc03a2a), 0, .02, 0, head);
  mk(new T.SphereGeometry(.07, 10, 8), white, 0, .3, 0, head);
  for (const s of [-1, 1]) { mk(new T.SphereGeometry(.032, 8, 6), dark, s * .085, -.03, .225, head); mk(new T.SphereGeometry(.045, 8, 6), M(0xff9a9a), s * .14, -.09, .19, head).scale.set(1, .6, .4); }
  mk(new T.BoxGeometry(.36, .42, .2), pack, 0, 1.02, -.26); mk(new T.CylinderGeometry(.08, .08, .4, 10), M(0x6a8a3a), 0, 1.28, -.26).rotation.z = Math.PI / 2;
  const scarf = mk(new T.BoxGeometry(.12, .3, .04), M(0x2aa69a), .1, 1.08, .2); scarf.geometry.translate(0, -.15, 0); scarf.position.y = 1.24;
  mk(new T.TorusGeometry(.17, .05, 8, 16), M(0x2aa69a), 0, 1.25, 0).rotation.x = Math.PI / 2;
  const limb = (x, y, len, r, mat, endMat, endGeo) => { const g = new T.Group(); g.position.set(x, y, 0); body.add(g); const m = mk(new T.CylinderGeometry(r, r * .9, len, 10), mat, 0, -len / 2, 0, g); if (endGeo) mk(endGeo, endMat, 0, -len, endGeo.type === 'BoxGeometry' ? .05 : 0, g); return g; };
  const armL = limb(-.29, 1.2, .42, .065, coat, skin, new T.SphereGeometry(.07, 8, 6)), armR = limb(.29, 1.2, .42, .065, coat, skin, new T.SphereGeometry(.07, 8, 6));
  const legL = limb(-.11, .72, .5, .085, pants, shoe, new T.BoxGeometry(.15, .1, .26)), legR = limb(.11, .72, .5, .085, pants, shoe, new T.BoxGeometry(.15, .1, .26));
  root.traverse(o => { if (o.isMesh) o.receiveShadow = false; });
  scene.add(root);
  P.model = { root, body, head, armL, armR, legL, legR, scarf };
}
function animPlayer(dt, t) {
  const m = P.model; if (!m) return;
  m.root.position.copy(P.pos); m.root.rotation.y = P.yaw;
  const hs = Math.hypot(P.vel.x, P.vel.z), k = clamp(hs / 7, 0, 1);
  if (P.onGround) P.phase += dt * (3 + hs * 1.6);
  const s = Math.sin(P.phase);
  let aL = 0, aR = 0, lL = 0, lR = 0, lean = 0, armOut = 0;
  if (P.onGround) { lL = s * .95 * k; lR = -s * .95 * k; aL = -s * .8 * k; aR = s * .8 * k; lean = .16 * k; m.body.position.y = Math.abs(Math.cos(P.phase)) * .05 * k + Math.sin(t * 2) * .006 * (1 - k); }
  else if (P.vel.y > -9) { lL = -.7; lR = .35; aL = -2.3; aR = -2.0; lean = .05; armOut = .2; m.body.position.y = 0; }
  else { const f = Math.sin(t * 16); aL = -2.6 + f * .5; aR = -2.6 - f * .5; lL = .4 + f * .4; lR = .4 - f * .4; lean = -.15; armOut = .5; m.body.position.y = 0; }
  const sm = Math.min(1, dt * 14);
  m.legL.rotation.x += (lL - m.legL.rotation.x) * sm; m.legR.rotation.x += (lR - m.legR.rotation.x) * sm;
  m.armL.rotation.x += (aL - m.armL.rotation.x) * sm; m.armR.rotation.x += (aR - m.armR.rotation.x) * sm;
  m.armL.rotation.z += (-armOut - m.armL.rotation.z) * sm; m.armR.rotation.z += (armOut - m.armR.rotation.z) * sm;
  m.body.rotation.x += (lean - m.body.rotation.x) * sm;
  m.scarf.rotation.x = -.3 - k * .8 - (P.onGround ? 0 : clamp(-P.vel.y / 20, 0, 1) * 1.6) + Math.sin(t * 12) * .1 * (k + (P.onGround ? 0 : 1));
  P.squash = Math.max(0, P.squash - dt * 2.5); const q = 1 - P.squash * .5;
  m.body.scale.set(1 + (1 - q) * .5, q, 1 + (1 - q) * .5);
}

// ---------- カメラ（後ろから。物にめりこまないように近づく） ----------
const CAM = { yaw: START.yaw, pitch: -.22, cur: SET.camD };
// カメラのきょり：0〜12m。FP_D より近いと一人称（ホイール・ピンチ・設定・V キー）
const FP_D = .9, CAM_MAX = 12;
let camBack = SET.camD >= FP_D ? SET.camD : 5.5;
function setCamD(d) { SET.camD = clamp(d, 0, CAM_MAX); if (SET.camD >= FP_D) camBack = SET.camD; saveSet(); viewShow(); }
function toggleView() { setCamD(SET.camD < FP_D ? Math.max(3, camBack) : 0); }
function viewShow() { const b = document.getElementById('bView'); if (b) b.textContent = SET.camD < FP_D ? '3人称' : '1人称'; const c = document.getElementById('cross'); if (c) c.classList.toggle('fp', SET.camD < FP_D); }
const _piv = new T.Vector3(), _dir = new T.Vector3();
function updCam(dt) {
  const sens = .0024 * SET.sens;
  const fp = SET.camD < FP_D;
  CAM.yaw -= IN.lookX * sens; CAM.pitch = clamp(CAM.pitch - IN.lookY * sens * (SET.invY ? -1 : 1), fp ? -1.45 : -1.3, fp ? 1.45 : 1.05); IN.lookX = IN.lookY = 0;
  if (IN.zoom) { setCamD(SET.camD + IN.zoom); IN.zoom = 0; }
  const cp = Math.cos(CAM.pitch); _dir.set(Math.sin(CAM.yaw) * cp, Math.sin(CAM.pitch), Math.cos(CAM.yaw) * cp);
  // 一人称：目の位置から見る。体はカメラの向きを向く
  if (fp) {
    CAM.cur = 0; P.yaw = CAM.yaw; if (P.model) { P.model.root.rotation.y = P.yaw; P.model.root.visible = false; }
    camera.position.set(P.pos.x, P.pos.y + 1.52, P.pos.z);
    camera.lookAt(P.pos.x + _dir.x * 2, P.pos.y + 1.52 + _dir.y * 2, P.pos.z + _dir.z * 2);
    return;
  }
  _piv.set(P.pos.x, P.pos.y + 1.5, P.pos.z);
  // めりこみ：頭の位置からカメラへ、少しずつ進んで調べる
  let allow = SET.camD;
  queryBox(Math.min(_piv.x, _piv.x - _dir.x * SET.camD) - .4, Math.min(_piv.y, _piv.y - _dir.y * SET.camD) - .4, Math.min(_piv.z, _piv.z - _dir.z * SET.camD) - .4,
    Math.max(_piv.x, _piv.x - _dir.x * SET.camD) + .4, Math.max(_piv.y, _piv.y - _dir.y * SET.camD) + .4, Math.max(_piv.z, _piv.z - _dir.z * SET.camD) + .4, _cand);
  if (_cand.length) {
    outer: for (let d = .3; d <= SET.camD; d += .18) {
      const x = _piv.x - _dir.x * d, y = _piv.y - _dir.y * d, z = _piv.z - _dir.z * d;
      for (const c of _cand) if (pushSphere(c, x, y, z, .2, _o)) { allow = Math.max(.35, d - .22); break outer; }
    }
  }
  CAM.cur = allow < CAM.cur || CAM.cur < FP_D ? allow : CAM.cur + (allow - CAM.cur) * Math.min(1, dt * 3);
  camera.position.set(_piv.x - _dir.x * CAM.cur, _piv.y - _dir.y * CAM.cur, _piv.z - _dir.z * CAM.cur);
  camera.lookAt(_piv.x + _dir.x * 2, _piv.y + _dir.y * 2, _piv.z + _dir.z * 2);
  if (P.model) P.model.root.visible = CAM.cur > .8;
}
