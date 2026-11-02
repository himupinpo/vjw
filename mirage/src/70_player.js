// =========================================================================================
//  主人公：歩く・走る・跳ぶ・殴る・撃つ・車に乗る（運転）／カメラ（三人称、壁で寄る）
// =========================================================================================
const WEAPONS = [
  { id: 'fist', name: '素手' },
  { id: 'pistol', name: 'ピストル', dmg: 34, rate: 0.26, mag: 12, range: 60, spread: 0.012 },
  { id: 'smg', name: 'サブマシンガン', dmg: 17, rate: 0.085, mag: 30, range: 50, spread: 0.03 },
];
const CAM = { yaw: Math.PI, pitch: -0.18, dist: 4.4, idleT: 0, carLookT: 0, x: 0, y: 0, z: 0, fov: 0, mode: 0 };
const PLAYER = {
  pos: new THREE.Vector3(), vy: 0, yaw: 0, speed: 0, h: null, car: null, alive: true, down: 0, hp: 100, armor: 0, hurtT: 9,
  money: 0, weapon: 0, owned: { fist: true, pistol: true, smg: false }, ammo: { pistol: 48, smg: 0 }, mag: { pistol: 12, smg: 0 }, fireT: 0, reloadT: 0, punchT: 0, punchSide: 0,
  enterT: 0, aiming: false, target: null, gun: null, onGround: true, kx: 0, kz: 0,
  init() {
    this.h = makeHuman('player');
    // 銃（手に持たせる）
    const g = new THREE.Group(), mt = new THREE.MeshStandardMaterial({ color: 0x232425, roughness: 0.45, metalness: 0.6 });
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.2), mt); a.position.z = 0.06; g.add(a);
    const gr = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.045), mt); gr.position.set(0, -0.07, -0.02); gr.rotation.x = 0.25; g.add(gr);
    const mz = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.16), mt); mz.position.set(0, -0.03, 0.18); g.add(mz); g.userData.smgPart = mz;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(g); this.gun = g;
  },
  reset(x, z, yaw) {
    this.pos.set(x, groundH(x, z), z); this.vy = 0; this.yaw = yaw; this.alive = true; this.down = 0; this.hp = 100; this.hurtT = 9;
    if (this.car) this.leaveCar(true);
    this.h.root.visible = true; this.h.body.rotation.set(0, 0, 0);
    CAM.yaw = yaw + Math.PI; CAM.pitch = -0.18;
  },
  get weaponDef() { return WEAPONS[this.weapon]; },
  hurt(n) {
    if (!this.alive || GAME.state !== 'play') return;
    if (this.armor > 0) { const a = Math.min(this.armor, n * 0.7); this.armor -= a; n -= a; }
    this.hp -= n; this.hurtT = 0; GAME.hurtFx = Math.min(1, GAME.hurtFx + n / 30);
    if (this.hp <= 0) { this.hp = 0; GAME.wasted(); }
  },
  knock(vx, vz) { if (this.car) return; this.down = 1.6; this.kx = vx; this.kz = vz; this.h.anim = 'fall'; this.h.t = 0; },
  // 近くの車
  nearCar() {
    let best = null, bd = 3.6;
    for (const c of WORLD.cars) { if (c.dead) continue; const d = Math.hypot(c.x - this.pos.x, c.z - this.pos.z) - c.T.W / 2; if (d < bd) { bd = d; best = c; } }
    return best;
  },
  enterCar(c) {
    if (c.ai) {   // 運転手を引きずり出す
      const sx = Math.sin(c.yaw), cz = Math.cos(c.yaw);
      if (c.driverH) { disposeHuman(c.driverH); c.driverH = null; }
      const k = c.police ? 'police' : 'casual', p = { h: makeHuman(k), kind: k === 'police' ? 'police' : 'casual', x: c.x + cz * 1.6, z: c.z - sx * 1.6, yaw: c.yaw, state: 'jacked', hp: 100, st: 0, lp: WORLD.pedLoop(clamp(Math.floor(c.x / CITY.P), 0, 7), clamp(Math.floor(c.z / CITY.P), 0, 7)), t: 0, dir: 1, sp: 1.3, idleT: 9 };
      if (k === 'police') { p.state = 'chase'; p.angry = true; }
      WORLD.peds.push(p);
      crime(c.police ? 'hitCop' : 'jack', c.x, c.z);
      c.ai = null; AUDIO.shout(c.x, c.z);
    }
    if (c.parkKey != null) { PARK[c.parkKey].used = true; WORLD.parked.delete(c.parkKey); c.parkKey = null; }
    this.car = c; c.keep = true;
    const h = this.h; scene.remove(h.root); c.m.g.add(h.root); h.anim = 'sit'; h.root.position.set(c.T.W * 0.22, (c.type === 'suv' || c.type === 'pickup' ? 0.72 : c.type === 'sports' ? 0.3 : 0.42) + 0.08 - 0.95, -0.1); h.root.rotation.set(0, 0, 0);
    h.mesh.castShadow = false;
    this.gun.visible = false; AUDIO.door(c.x, c.z); AUDIO.engineOn(c);
    CAM.yaw = c.yaw + Math.PI; CAM.carLookT = 0;
    setTouchMode(true); UI.weapon();
    if (c.mission && GAME.mission && GAME.mission.onEnter) GAME.mission.onEnter(c);
  },
  leaveCar(force) {
    const c = this.car; if (!c) return;
    const sx = Math.sin(c.yaw), cz = Math.cos(c.yaw);
    const h = this.h; c.m.g.remove(h.root); scene.add(h.root); h.root.rotation.set(0, 0, 0); h.mesh.castShadow = true;
    this.pos.set(c.x + cz * 1.7, c.y, c.z - sx * 1.7); this.yaw = c.yaw; this.vy = 0;
    const q = { x: this.pos.x, z: this.pos.z }; pushOut(q, 0.4, 0); this.pos.x = q.x; this.pos.z = q.z;
    if (!force) { AUDIO.door(c.x, c.z); if (c.speed > 9) { this.knock(c.vx * 0.3, c.vz * 0.3); this.hurt(c.speed * 0.6); } }
    c.input.th = 0; c.input.br = 0; c.input.st = 0; c.input.hb = false; c.rollT = 0; c.keep = false;   // 走ったまま降りたら、少し進んでから自動で止まる（WORLD.update）
    AUDIO.engineOff();
    this.car = null; setTouchMode(false); UI.weapon();
    CAM.yaw = c.yaw + Math.PI;
  },
  // ---------- 毎フレーム ----------
  update(dt) {
    this.hurtT += dt;
    if (this.hurtT > 6 && this.hp < 50 && this.alive) this.hp = Math.min(50, this.hp + 2 * dt);
    if (!this.alive) { this.h.anim = 'lie'; poseHuman(this.h, dt); return; }
    if (this.car) this.drive(dt); else this.walk(dt);
    this.fireT -= dt; this.reloadT -= dt; this.punchT -= dt; this.enterT -= dt;
  },
  drive(dt) {
    const c = this.car, I = c.input, k = keyAxes();
    I.stop = 0;   // 運転中は自動ブレーキなし
    let th = IN.gas || (k.y > 0 ? 1 : 0), br = IN.brake || (k.y < 0 ? 1 : 0), st = -(k.x || 0);
    if (IS_TOUCH) { st = -IN.mx * Math.min(1, Math.abs(IN.mx) * 1.3); if (IN.my > 0.35 && !IN.gas) th = Math.max(th, IN.my); if (IN.my < -0.35 && !IN.brake) br = Math.max(br, -IN.my); }
    I.th = th; I.br = br; I.st = st; I.hb = IN.hand || !!IN.keys.Space;
    if (c.dead) { I.th = I.br = 0; }
    if (IN.pressed.has('horn')) AUDIO.horn(c.x, c.z, 1);
    if (IN.pressed.has('radio')) RADIO.toggle();
    if (IN.pressed.has('enter') && this.enterT <= 0) { this.enterT = 0.5; this.leaveCar(); return; }
    this.pos.set(c.x, c.y, c.z); this.speed = c.speed; this.yaw = c.yaw;
    poseHuman(this.h, dt);
    AUDIO.engine(c, dt);
    // 車で人をひいた・警察の前で暴走した、などは world で
    if (c.dead && c.burnT > 2.5) { this.leaveCar(true); this.knock(0, 0); }
  },
  walk(dt) {
    const h = this.h, k = keyAxes(), W = this.weaponDef;
    // 武器の持ちかえ
    if (IN.pressed.has('wnext') || IN.pressed.has('wprev') || IN.pressed.has('weapon')) this.cycleWeapon(IN.pressed.has('wprev') ? -1 : 1);
    for (const [key, i] of [['w1', 0], ['w2', 1], ['w3', 2]]) if (IN.pressed.has(key) && this.owned[WEAPONS[i].id]) { this.weapon = i; UI.weapon(); }
    // 倒れている
    if (this.down > 0) {
      this.down -= dt; this.pos.x += this.kx * dt; this.pos.z += this.kz * dt; this.kx *= Math.exp(-3 * dt); this.kz *= Math.exp(-3 * dt);
      h.anim = this.down > 0.7 ? 'fall' : 'getup'; if (this.down <= 0.7 && h.anim !== 'getup') h.t = 0;
      this.place(dt, 0); return;
    }
    // 移動の入力（カメラの向きが前）
    let mx = IN.mx + k.x, my = IN.my + k.y;
    const mag = Math.min(1, Math.hypot(mx, my));
    const cy = CAM.yaw, fx = -Math.sin(cy), fz = -Math.cos(cy), rx = Math.cos(cy), rz = -Math.sin(cy);
    let dx = fx * my + rx * mx, dz = fz * my + rz * mx; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    this.aiming = (IN.aim || IN.aimToggle) && W.id !== 'fist';
    const sprint = IN.run || !!IN.keys.ShiftLeft || !!IN.keys.ShiftRight;
    let sp = 0;
    if (mag > 0.08) sp = this.aiming ? 2.0 : sprint ? 6.6 : (IS_TOUCH ? (mag < 0.6 ? 1.6 : 4.2) : 4.2);
    this.speed = damp(this.speed, sp, 10, dt);
    if (mag > 0.08) { this.pos.x += dx * this.speed * dt; this.pos.z += dz * this.speed * dt; }
    // 向き
    if (this.aiming || (IN.atk && W.id !== 'fist')) this.yaw += clamp(angDiff(this.yaw, cy + Math.PI), -12 * dt, 12 * dt);
    else if (mag > 0.08) this.yaw += clamp(angDiff(this.yaw, Math.atan2(dx, dz)), -10 * dt, 10 * dt);
    // ジャンプ
    if (IN.pressed.has('jump') && this.onGround) { this.vy = 4.6; this.onGround = false; AUDIO.step(0.6); }
    // 車に乗る
    if (IN.pressed.has('enter') && this.enterT <= 0) { const c = this.nearCar(); if (c) { this.enterT = 0.6; this.enterCar(c); return; } }
    // 攻撃
    this.attack(dt);
    // アニメ
    if (h.anim === 'punch' && h.t < 0.42) { /* 殴っている途中 */ }
    else if (this.aiming || (W.id !== 'fist' && IN.atk)) h.anim = 'aim';
    else h.anim = this.speed > 3 ? 'run' : this.speed > 0.4 ? 'walk' : 'idle';
    this.place(dt, this.speed);
    // 足音
    if (this.onGround && this.speed > 1) { this.stepT = (this.stepT || 0) - dt * this.speed; if (this.stepT <= 0) { this.stepT = 1.6; AUDIO.step(this.speed > 4 ? 0.5 : 0.3); } }
  },
  place(dt, sp) {
    // 重力
    const gh = groundH(this.pos.x, this.pos.z);
    this.vy -= 13 * dt; this.pos.y += this.vy * dt;
    if (this.pos.y <= gh) { if (!this.onGround && this.vy < -9) this.hurt((-this.vy - 9) * 6); this.pos.y = gh; this.vy = 0; this.onGround = true; }
    else if (this.pos.y > gh + 0.25) this.onGround = false;
    if (this.onGround && this.pos.y < gh + 0.3) this.pos.y = damp(this.pos.y, gh, 20, dt);
    // 建物・車にぶつかる
    const q = { x: this.pos.x, z: this.pos.z }; pushOut(q, 0.33, this.pos.y - gh);
    for (const c of WORLD.cars) {
      if (Math.abs(c.x - q.x) > 4 || Math.abs(c.z - q.z) > 4) continue;
      for (const [cx, cz] of c.circles()) { const ddx = q.x - cx, ddz = q.z - cz, d = Math.hypot(ddx, ddz), r = c.r + 0.33; if (d < r && d > 1e-4 && this.pos.y < c.y + c.T.belt) { q.x = cx + ddx / d * r; q.z = cz + ddz / d * r; } }
    }
    this.pos.x = q.x; this.pos.z = q.z;
    const h = this.h; h.root.position.copy(this.pos); h.root.rotation.y = this.yaw;
    h.lookPitch = this.aiming ? clamp(-CAM.pitch * 0.6, -0.5, 0.5) : 0;
    poseHuman(h, dt, sp);
    // 銃を手に
    const W = this.weaponDef, gun = this.gun;
    gun.visible = W.id !== 'fist' && !this.car && this.alive; gun.userData.smgPart.visible = W.id === 'smg';
    if (gun.visible) { handPos(h, gun.position); gun.rotation.set(h.anim === 'aim' ? -CAM.pitch * 0.6 : 0.9, this.yaw, 0, 'YXZ'); }
  },
  cycleWeapon(d) {
    const ids = WEAPONS.map((w, i) => i).filter(i => this.owned[WEAPONS[i].id]);
    const k = ids.indexOf(this.weapon); this.weapon = ids[(k + d + ids.length) % ids.length]; UI.weapon(); AUDIO.click();
  },
  // 狙い：PCで右クリック中は画面の中心へ。それ以外は前にいる相手を自動で
  pickTarget() {
    const P = this.pos, cf = camFwd(); let best = null, bs = -1e9;
    const consider = (o, x, y, z, hostile) => {
      const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); if (d > 38 || d < 0.5) return;
      const dot = (dx * cf.x + dz * cf.z) / d; if (dot < 0.72) return;
      if (segBlock(P.x, P.z, x, z, 1.2) < 1) return;
      const s = dot * 2 - d / 30 + (hostile ? 1.5 : 0);
      if (s > bs) { bs = s; best = { o, x, y, z }; }
    };
    for (const p of WORLD.peds) if (p.state !== 'dead' && p.state !== 'lie') consider(p, p.x, p.y + 1.2, p.z, p.kind === 'police' && WANTED.level > 0);
    for (const c of WORLD.cars) if (!c.dead && c !== this.car && (c.police || this.aiming)) consider(c, c.x, c.y + 0.9, c.z, c.police && WANTED.level > 0);
    return best;
  },
  attack(dt) {
    const W = this.weaponDef, h = this.h;
    this.target = (W.id !== 'fist' && (IN.atk || this.aiming) && !(IN.locked && IN.aim)) ? this.pickTarget() : null;
    if (!IN.atk) return;
    if (W.id === 'fist') {
      if (this.punchT > 0) return;
      this.punchT = 0.42; this.punchSide ^= 1; h.anim = 'punch'; h.t = 0; h.punchSide = this.punchSide; AUDIO.swing();
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      setTimeout(() => {
        for (const p of WORLD.peds) {
          const dx = p.x - this.pos.x, dz = p.z - this.pos.z, d = Math.hypot(dx, dz);
          if (d < 1.5 && (dx * fx + dz * fz) / (d || 1) > 0.4 && p.state !== 'dead') { WORLD.hurtPed(p, 24, PLAYER, { x: fx * 0.5, z: fz * 0.5 }); AUDIO.punch(p.x, p.z); break; }
        }
      }, 110);
      return;
    }
    if (this.reloadT > 0 || this.fireT > 0) return;
    if (this.mag[W.id] <= 0) {
      if (this.ammo[W.id] > 0) { this.reloadT = 1.1; const n = Math.min(W.mag, this.ammo[W.id]); this.ammo[W.id] -= n; this.mag[W.id] = n; AUDIO.reload(); UI.weapon(); }
      else { this.fireT = 0.4; AUDIO.click(); }
      return;
    }
    this.fireT = W.rate; this.mag[W.id]--; UI.weapon();
    // 弾の向き
    const from = handPos(h, new THREE.Vector3()); from.y = Math.max(from.y, this.pos.y + 1.2);
    let dir;
    if (this.target) { dir = new THREE.Vector3(this.target.x - from.x, this.target.y - from.y, this.target.z - from.z).normalize(); }
    else { dir = new THREE.Vector3(); camera.getWorldDirection(dir); }
    dir.x += rr(-1, 1) * W.spread; dir.y += rr(-1, 1) * W.spread; dir.z += rr(-1, 1) * W.spread; dir.normalize();
    shootRay(from, dir, W.range, W.dmg, PLAYER);
    FX.muzzle(from.x + dir.x * 0.3, from.y + dir.y * 0.3, from.z + dir.z * 0.3); AUDIO.gun(from.x, from.z, W.id === 'smg' ? 0.8 : 1);
    GAME.shake = Math.max(GAME.shake, 0.08);
    crime('shoot', this.pos.x, this.pos.z); WORLD.scare(this.pos.x, this.pos.z, 45, this.pos);
  },
};
// 弾：人（円柱）・車（球）・建物（箱）のうち、いちばん手前に当たる
function shootRay(from, dir, range, dmg, by) {
  let bestT = range, hit = null;
  const bx = from.x + dir.x * range, bz = from.z + dir.z * range;
  const tb = segBlock(from.x, from.z, bx, bz, from.y + dir.y * range * 0.5); if (tb < 1) bestT = tb * range;
  for (const p of WORLD.peds) {
    if (p.state === 'dead') continue;
    const ox = p.x - from.x, oz = p.z - from.z, t = ox * dir.x + oz * dir.z;   // 水平方向の最近点
    const hl = Math.hypot(dir.x, dir.z) || 1, tt = t / (hl * hl); if (tt < 0 || tt > bestT) continue;
    const cx = from.x + dir.x * tt - p.x, cz = from.z + dir.z * tt - p.z, y = from.y + dir.y * tt - p.y;
    if (cx * cx + cz * cz < 0.36 * 0.36 && y > 0 && y < 1.85) { bestT = tt; hit = { p, head: y > 1.5 }; }
  }
  for (const c of WORLD.cars) {
    if (c === PLAYER.car) continue;
    for (const [cx, cz] of c.circles()) {
      const ox = cx - from.x, oy = c.y + 0.8 - from.y, oz = cz - from.z, t = ox * dir.x + oy * dir.y + oz * dir.z;
      if (t < 0 || t > bestT) continue;
      const qx = ox - dir.x * t, qy = oy - dir.y * t, qz = oz - dir.z * t;
      if (qx * qx + qy * qy + qz * qz < 1.05 * 1.05) { bestT = t; hit = { c }; }
    }
  }
  const end = new THREE.Vector3(from.x + dir.x * bestT, from.y + dir.y * bestT, from.z + dir.z * bestT);
  FX.tracer(from.clone(), end);
  if (hit && hit.p) { WORLD.hurtPed(hit.p, hit.head ? dmg * 2.5 : dmg, by); FX.sparks(end.x, end.y, end.z, 2); }
  else if (hit && hit.c) { hit.c.damage(dmg * 2.2, by); FX.sparks(end.x, end.y, end.z, 4); if (hit.c.ai && hit.c.ai.mode === 'traffic') hit.c.ai.panic = 8; if (hit.c.police && by === PLAYER) crime('hitCop', hit.c.x, hit.c.z); }
  else if (bestT < range) FX.dust(end.x, end.y, end.z);
  return hit;
}
// ---------- カメラ ----------
const _ct = new THREE.Vector3();
function updateCamera(dt) {
  const sens = SET.sens * HUB.sens;
  const lx = IN.lookX * sens, ly = IN.lookY * sens; IN.lookX = 0; IN.lookY = 0;
  const looking = Math.abs(lx) + Math.abs(ly) > 1e-4;
  CAM.yaw -= lx; CAM.pitch = clamp(CAM.pitch - ly, -1.1, 0.75);
  let tx, ty, tz, dist, side = 0;
  if (PLAYER.car) {
    const c = PLAYER.car;
    if (looking) CAM.carLookT = 0; else CAM.carLookT += dt;
    if (CAM.carLookT > 1.4) { const want = c.speed > 2 && c.fwd < -1 ? c.yaw : c.yaw + Math.PI; CAM.yaw += angDiff(CAM.yaw, want) * Math.min(1, dt * 3); CAM.pitch = damp(CAM.pitch, -0.2, 3, dt); }
    tx = c.x; ty = c.y + c.T.roof + 0.55; tz = c.z; dist = 6.2 + c.T.L * 0.35 + Math.min(4, c.speed * 0.07);
    if (CAM.mode === 1) dist *= 1.6;
  } else {
    const P = PLAYER.pos;
    if (looking) CAM.idleT = 0; else CAM.idleT += dt;
    if (CAM.idleT > 2 && PLAYER.speed > 2.5 && !PLAYER.aiming) CAM.yaw += angDiff(CAM.yaw, PLAYER.yaw + Math.PI) * Math.min(1, dt * 1.2);
    if (PLAYER.target && !IN.locked) { const t = PLAYER.target, want = Math.atan2(-(t.x - P.x), -(t.z - P.z)); CAM.yaw += angDiff(CAM.yaw, want) * Math.min(1, dt * 6); }
    tx = P.x; ty = P.y + (PLAYER.alive ? 1.55 : 0.6); tz = P.z;
    dist = PLAYER.aiming ? 2.3 : 4.3; side = PLAYER.aiming ? 0.62 : 0;
    if (!PLAYER.alive) dist = 6;
  }
  const cp = Math.cos(CAM.pitch), sp = Math.sin(CAM.pitch);
  const sx = Math.sin(CAM.yaw), cz = Math.cos(CAM.yaw), rx = Math.cos(CAM.yaw), rz = -Math.sin(CAM.yaw);
  let wx = tx + sx * cp * dist + rx * side, wy = ty - sp * dist, wz = tz + cz * cp * dist + rz * side;
  // 壁で寄る
  const t = segBlock(tx, tz, wx, wz, Math.min(ty, wy) + 0.2);
  if (t < 1) { const k = Math.max(0.12, t - 0.06); wx = tx + (wx - tx) * k; wz = tz + (wz - tz) * k; wy = ty + (wy - ty) * k; }
  wy = Math.max(wy, groundH(wx, wz) + 0.35);
  if (CAM.snap) { CAM.x = wx; CAM.y = wy; CAM.z = wz; CAM.snap = false; }
  const k = 1 - Math.exp(-(PLAYER.car ? 14 : 18) * dt);
  CAM.x = lerp(CAM.x, wx, k); CAM.y = lerp(CAM.y, wy, k); CAM.z = lerp(CAM.z, wz, k);
  camera.position.set(CAM.x, CAM.y, CAM.z);
  camera.rotation.set(CAM.pitch, CAM.yaw, 0);
  // 揺れ
  if (GAME.shake > 0) { camera.position.x += rr(-1, 1) * GAME.shake * 0.12; camera.position.y += rr(-1, 1) * GAME.shake * 0.12; GAME.shake = Math.max(0, GAME.shake - dt * 2.5); }
  const baseFov = VW() < VH() ? 78 : 66, wantFov = baseFov + (PLAYER.car ? Math.min(14, PLAYER.car.speed * 0.28) : 0) - (PLAYER.aiming ? 8 : 0);
  CAM.fov = damp(CAM.fov || baseFov, wantFov, 4, dt); if (Math.abs(camera.fov - CAM.fov) > 0.05) { camera.fov = CAM.fov; camera.updateProjectionMatrix(); }
}
