// =========================================================================================
//  主人公：歩く・走る・跳ぶ・殴る・撃つ・車に乗る（運転）／カメラ（三人称、壁で寄る）
// =========================================================================================
const WEAPONS = [
  { id: 'fist', name: '素手' },
  // spread=ばらつき（ラジアン）、bloom=1発ごとに広がる量、recoil=カメラが跳ね上がる量
  { id: 'pistol', name: 'ピストル', dmg: 34, rate: 0.26, mag: 12, range: 70, spread: 0.010, bloom: 0.012, recoil: 0.034 },
  { id: 'smg', name: 'サブマシンガン', dmg: 17, rate: 0.085, mag: 30, range: 55, spread: 0.022, bloom: 0.0065, recoil: 0.015 },
];
// ots: 0=ふつう 1=銃を構えている（腰だめ） 2=狙っている（肩越し）。kick=反動でカメラが跳ねた分（戻っていく）
const CAM = { yaw: Math.PI, pitch: -0.18, dist: 4.4, idleT: 0, carLookT: 0, x: 0, y: 0, z: 0, fov: 0, mode: 0, ots: 0, kick: 0, kickYaw: 0 };
const PLAYER = {
  pos: new THREE.Vector3(), vy: 0, yaw: 0, speed: 0, h: null, car: null, alive: true, down: 0, hp: 100, armor: 0, hurtT: 9,
  money: 0, weapon: 0, owned: { fist: true, pistol: true, smg: false }, ammo: { pistol: 48, smg: 0 }, mag: { pistol: 12, smg: 0 }, fireT: 0, reloadT: 0, punchT: 0, punchSide: 0,
  enterT: 0, aiming: false, target: null, gun: null, onGround: true, kx: 0, kz: 0,
  // 撃つ：gunUp=銃を構えている、ready=撃ったあと構えたままの残り時間、aimPt=照準（画面の真ん中）が指している所
  gunUp: false, ready: 0, aimPt: new THREE.Vector3(), aimHit: null, assist: null, assistPrev: null, nudgeT: 0, bloom: 0, wasAim: false,
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
    const h = this.h; scene.remove(h.root); c.m.g.add(h.root); h.anim = 'sit'; h.root.position.set(c.T.W * 0.22, (c.type === 'suv' || c.type === 'pickup' ? 0.72 : c.type === 'sports' || c.type === 'sports2' ? 0.3 : 0.42) + 0.08 - 0.95, -0.1); h.root.rotation.set(0, 0, 0);
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
    if (W.id !== 'fist' && IN.atk) this.ready = 1.4; else this.ready = Math.max(0, this.ready - dt);
    this.gunUp = W.id !== 'fist' && (this.aiming || this.ready > 0);
    if (IN.pressed.has('radio') && W.id !== 'fist') this.reload();   // R：リロード（車の中ではラジオ）
    this.updateAim(dt);
    const sprint = IN.run || !!IN.keys.ShiftLeft || !!IN.keys.ShiftRight;
    let sp = 0;
    if (mag > 0.08) sp = this.aiming ? 2.2 : this.gunUp ? (sprint ? 5.2 : 3.4) : sprint ? 6.6 : (IS_TOUCH ? (mag < 0.6 ? 1.6 : 4.2) : 4.2);
    this.speed = damp(this.speed, sp, 10, dt);
    if (mag > 0.08) { this.pos.x += dx * this.speed * dt; this.pos.z += dz * this.speed * dt; }
    // 向き
    if (this.gunUp) this.yaw += clamp(angDiff(this.yaw, Math.atan2(this.aimPt.x - this.pos.x, this.aimPt.z - this.pos.z)), -16 * dt, 16 * dt);   // 照準の先を向く
    else if (mag > 0.08) this.yaw += clamp(angDiff(this.yaw, Math.atan2(dx, dz)), -10 * dt, 10 * dt);
    // ジャンプ
    if (IN.pressed.has('jump') && this.onGround) { this.vy = 4.6; this.onGround = false; AUDIO.step(0.6); }
    // 車に乗る
    if (IN.pressed.has('enter') && this.enterT <= 0) { const c = this.nearCar(); if (c) { this.enterT = 0.6; this.enterCar(c); return; } }
    // 攻撃
    this.attack(dt);
    // アニメ
    if (h.anim === 'punch' && h.t < 0.42) { /* 殴っている途中 */ }
    else if (this.gunUp) h.anim = 'aim';
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
    const ap = this.gunUp ? clamp(Math.atan2(this.aimPt.y - (this.pos.y + 1.4), Math.hypot(this.aimPt.x - this.pos.x, this.aimPt.z - this.pos.z) || 1), -0.9, 0.9) : 0;
    h.aimPitch = ap; h.lookPitch = this.gunUp ? clamp(-ap * 0.7, -0.5, 0.5) : 0;
    h.recoil = Math.max(0, (h.recoil || 0) - dt * 9);
    poseHuman(h, dt, sp);
    // 銃を手に
    const W = this.weaponDef, gun = this.gun;
    gun.visible = W.id !== 'fist' && !this.car && this.alive; gun.userData.smgPart.visible = W.id === 'smg';
    if (gun.visible) { handPos(h, gun.position); if (h.anim === 'aim' && this.gunUp) gun.lookAt(this.aimPt); else gun.rotation.set(0.9, this.yaw, 0, 'YXZ'); }
  },
  cycleWeapon(d) {
    const ids = WEAPONS.map((w, i) => i).filter(i => this.owned[WEAPONS[i].id]);
    const k = ids.indexOf(this.weapon); this.weapon = ids[(k + d + ids.length) % ids.length]; UI.weapon(); AUDIO.click();
  },
  // ---------- 銃：照準（画面の真ん中）の先を撃つ ----------
  // 毎フレーム、カメラから画面の真ん中へ光線を飛ばして「照準が指している所」を出す。弾は銃口からそこへ飛ぶ
  updateAim(dt) {
    const W = this.weaponDef;
    // スマホ（とマウスを固定していないとき）はエイムアシスト（ゲーム機のような弱めのもの）。PCのマウスは自由に狙う
    const useAssist = IS_TOUCH || !IN.locked, aimStart = this.aiming && !this.wasAim;
    this.wasAim = this.aiming;
    this.bloom = Math.max(0, this.bloom - dt * (this.fireT > -0.05 ? 0.02 : 0.09));
    this.nudgeT = Math.max(0, this.nudgeT - dt);
    if (!this.gunUp) { this.assist = null; this.aimHit = null; return; }
    if (useAssist && aimStart) this.nudgeT = 0.15;   // 構えた瞬間だけ、近くの人へ少し強めに寄せる
    this.assist = useAssist ? this.findAssist(W.range, this.nudgeT > 0 ? 1.6 : 1) : null;
    camera.getWorldDirection(_aimDir);
    const r = aimCast(camera.position, _aimDir, W.range + 6);
    this.aimHit = r; this.aimPt.copy(camera.position).addScaledVector(_aimDir, r.t);
  },
  // アシストする相手：照準のすぐ近く（遠いほど小さな円、3〜9°ほど）にいて、見えている人。★があるときは警官・パトカーを優先
  // 体の縦の範囲（足〜頭）に照準が入っていれば縦には引かない（頭を狙うのは自分で）
  findAssist(range, coneK) {
    const cp = CAM.pitch; let best = null, be = 1e9;
    const consider = (o, x, y0, z, h0, h1, mid, isPed, hostile) => {
      const dx = x - CAM.x, dz = z - CAM.z, hd = Math.hypot(dx, dz); if (hd > range + 4 || hd < 1.2) return;
      const wantY = Math.atan2(-dx, -dz), pLo = Math.atan2(y0 + h0 - CAM.y, hd), pHi = Math.atan2(y0 + h1 - CAM.y, hd), pC = Math.atan2(y0 + mid - CAM.y, hd);
      const err = Math.hypot(angDiff(CAM.yaw, wantY) * Math.cos(cp), clamp(cp, pLo, pHi) - cp);
      const cone = clamp(Math.atan(0.9 / hd) + 0.03, 0.05, 0.16) * coneK; if (err > cone) return;
      const sc = err / cone - (hostile ? 0.15 : 0); if (sc >= be) return;
      _aimTo.set(dx, y0 + mid - CAM.y, dz); const d = _aimTo.length(); _aimTo.multiplyScalar(1 / d);
      const r = aimCast(CAM, _aimTo, d + 1.5); if (isPed ? r.p !== o : r.c !== o) return;   // 壁のうしろは助けない
      be = sc; best = { o, wantY, pLo, pHi, pC, cone };
    };
    for (const p of WORLD.peds) if (p.state !== 'dead') {
      const a = p.h.anim, lying = a === 'fall' || a === 'lie';
      consider(p, p.x, p.y, p.z, lying ? 0.05 : 0.35, lying ? 0.45 : a === 'cower' ? 1.15 : 1.75, lockHeight(p), true, p.kind === 'police' && WANTED.level > 0);
    }
    for (const c of WORLD.cars) if (!c.dead && c.police && WANTED.level > 0) consider(c, c.x, c.y, c.z, 0.4, 1.5, 0.9, false, true);
    return best;
  },
  spreadNow() { const W = this.weaponDef; return !W.spread ? 0 : W.spread * (this.aiming ? 0.5 : 1) + (this.speed > 0.6 ? 0.006 : 0) + (this.onGround ? 0 : 0.02) + this.bloom; },
  reload() {
    const W = this.weaponDef; if (W.id === 'fist' || this.reloadT > 0) return false;
    const n = Math.min(W.mag - this.mag[W.id], this.ammo[W.id]); if (n <= 0) return false;
    this.reloadT = 1.1; this.ammo[W.id] -= n; this.mag[W.id] += n; AUDIO.reload(); UI.weapon(); return true;
  },
  attack(dt) {
    const W = this.weaponDef, h = this.h;
    this.target = this.assist ? this.assist.o : null;
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
      if (!this.reload()) { this.fireT = 0.4; AUDIO.click(); }
      return;
    }
    // 体が照準の方を向いてから撃つ（振り向くのは一瞬）
    if (Math.abs(angDiff(this.yaw, Math.atan2(this.aimPt.x - this.pos.x, this.aimPt.z - this.pos.z))) > 0.5) return;
    this.fireT = W.rate; this.mag[W.id]--; UI.weapon();
    // 当たるかどうかは照準の線（カメラから画面の真ん中）で決める＝照準が赤ならその人に当たる（ばらつきの分はずれる）。
    // 銃口からその点までの間に壁や車があれば、そちらに当たる
    const cdir = new THREE.Vector3(); camera.getWorldDirection(cdir);
    const s = this.spreadNow(), a = Math.random() * Math.PI * 2, m = Math.sqrt(Math.random()) * s;   // ばらつき（円の中に一様）
    _aimTo.set(-cdir.z, 0, cdir.x).normalize(); const up = new THREE.Vector3().crossVectors(_aimTo, cdir).normalize();
    cdir.addScaledVector(_aimTo, Math.cos(a) * m).addScaledVector(up, Math.sin(a) * m).normalize();
    const C = camera.position, t0 = Math.max(0, (this.pos.x - C.x) * cdir.x + (this.pos.y + 1.4 - C.y) * cdir.y + (this.pos.z - C.z) * cdir.z);   // 自分より前から
    const cs = C.clone().addScaledVector(cdir, t0), rc = aimCast(cs, cdir, W.range);
    const end = cs.clone().addScaledVector(cdir, rc.t);
    const from = this.gun.position.clone(); from.y = Math.max(from.y, this.pos.y + 1.05);
    const dir = end.clone().sub(from); const dl = dir.length(); dir.multiplyScalar(1 / (dl || 1));
    from.addScaledVector(dir, 0.28);
    const rm = aimCast(from, dir, Math.max(0.05, dl - 0.6));   // 銃口と当たる点の間に何かあるか
    const hit = rm.kind ? applyShot(from, dir, rm, W.dmg, PLAYER) : applyShot(from, dir, Object.assign({}, rc, { t: dl - 0.28 }), W.dmg, PLAYER);
    if (hit && hit.p) UI.hitMark(hit.killed || hit.head);
    FX.muzzle(from.x, from.y, from.z); AUDIO.gun(from.x, from.z, W.id === 'smg' ? 0.8 : 1);
    // 反動：カメラが跳ね上がって戻る・照準が広がる・腕がはねる
    CAM.kick += W.recoil * (this.aiming ? 0.75 : 1); CAM.kickYaw += rr(-1, 1) * W.recoil * 0.3;
    this.bloom = Math.min(0.07, this.bloom + W.bloom); h.recoil = 1;
    GAME.shake = Math.max(GAME.shake, W.id === 'smg' ? 0.03 : 0.05);
    crime('shoot', this.pos.x, this.pos.z); WORLD.scare(this.pos.x, this.pos.z, 45, this.pos);
  },
};
const _aimDir = new THREE.Vector3(), _aimTo = new THREE.Vector3();
// 人の狙う高さ（胸）：倒れている・しゃがんでいるときは低い
// 人の胸の高さ（アシストの目安）
function lockHeight(p) { const a = p.h.anim; return a === 'fall' || a === 'lie' ? 0.3 : a === 'cower' ? 0.8 : 1.25; }
// 光線と箱（軸にそった）：入った所の t（なければ null）
function rayBox(ox, oy, oz, dx, dy, dz, x0, y0, z0, x1, y1, z1, tmax) {
  let t0 = 0, t1 = tmax;
  for (const [o, d, lo, hi] of [[ox, dx, x0, x1], [oy, dy, y0, y1], [oz, dz, z0, z1]]) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return null; continue; }
    let ta = (lo - o) / d, tb = (hi - o) / d; if (ta > tb) { const q = ta; ta = tb; tb = q; }
    if (ta > t0) t0 = ta; if (tb < t1) t1 = tb; if (t0 > t1) return null;
  }
  return t0;
}
// 光線がいちばん手前で当たるもの：建物・柱など（箱）、地面、車（向きのある箱）、人（円柱。頭は上の方）
// 返り値 { t, kind: 'wall' | 'ground' | 'car' | 'ped' | null, p, c, head }
function aimCast(from, dir, range) {
  let res = { t: range, kind: null };
  const ex = from.x + dir.x * range, ez = from.z + dir.z * range;
  for (const c of colNear((from.x + ex) / 2, (from.z + ez) / 2, Math.hypot(ex - from.x, ez - from.z) / 2 + 2)) {
    const t = rayBox(from.x, from.y, from.z, dir.x, dir.y, dir.z, c.x0, -1, c.z0, c.x1, c.h, c.z1, res.t);
    if (t !== null && t < res.t) res = { t, kind: 'wall' };
  }
  if (dir.y < -1e-4) {   // 地面（高さが場所で変わるので2回なおす）
    let t = (from.y - groundH(from.x, from.z)) / -dir.y;
    for (let k = 0; k < 3; k++) t = (from.y - groundH(from.x + dir.x * t, from.z + dir.z * t)) / -dir.y;
    if (t > 0 && t < res.t) res = { t, kind: 'ground' };
  }
  for (const c of WORLD.cars) {
    if (c === PLAYER.car || Math.abs(c.x - from.x) > range + 4 || Math.abs(c.z - from.z) > range + 4) continue;
    const s = Math.sin(c.yaw), co = Math.cos(c.yaw), ox = from.x - c.x, oz = from.z - c.z, T = c.T;
    const t = rayBox(ox * co - oz * s, from.y - c.y, ox * s + oz * co, dir.x * co - dir.z * s, dir.y, dir.x * s + dir.z * co, -T.W / 2, 0.22, -T.L / 2, T.W / 2, T.roof, T.L / 2, res.t);
    if (t !== null && t < res.t) res = { t, kind: 'car', c };
  }
  const hl2 = dir.x * dir.x + dir.z * dir.z;
  for (const p of WORLD.peds) {
    if (p.state === 'dead') continue;
    const a = p.h.anim, lying = a === 'fall' || a === 'lie', H = lying ? 0.45 : a === 'cower' ? 1.2 : 1.85, R = lying ? 0.8 : 0.34;
    const ox = p.x - from.x, oz = p.z - from.z; if (Math.abs(ox) > range + 2 || Math.abs(oz) > range + 2) continue;
    // 円柱の側面に入る t と、そこでの高さ
    const b = ox * dir.x + oz * dir.z, c2 = ox * ox + oz * oz - R * R; if (hl2 < 1e-9) continue;
    const disc = b * b - hl2 * c2; if (disc < 0) continue;
    const sq = Math.sqrt(disc); let t = (b - sq) / hl2; const tOut = (b + sq) / hl2;
    if (tOut < 0 || t > res.t) continue;
    if (t < 0) t = 0;
    // 側面の高さが外れていたら、上から入るか（頭のてっぺん）を見る
    let y = from.y + dir.y * t - p.y;
    if (y > H && dir.y < 0) { const tt = (from.y - (p.y + H)) / -dir.y; if (tt <= tOut && tt >= t) { t = tt; y = H; } }
    if (y < 0 || y > H || t > res.t) continue;
    res = { t, kind: 'ped', p, head: !lying && a !== 'cower' && y > 1.52 };
  }
  return res;
}
// 弾を1発：いちばん手前に当たったものにダメージと効果。頭は一撃
function shootRay(from, dir, range, dmg, by) { return applyShot(from, dir, aimCast(from, dir, range), dmg, by); }
// 当たったもの r（aimCast の結果）に効果を。弾の線は from から dir へ r.t の所まで
function applyShot(from, dir, r, dmg, by) {
  const end = new THREE.Vector3(from.x + dir.x * r.t, from.y + dir.y * r.t, from.z + dir.z * r.t);
  if (by === PLAYER) PLAYER.lastShot = { from: from.clone(), dir: dir.clone(), kind: r.kind, t: r.t };   // 確かめる用
  FX.tracer(from.clone(), end);
  if (r.kind === 'ped') {
    const p = r.p; WORLD.hurtPed(p, r.head ? dmg * 3.6 : dmg, by, null, dir); FX.blood(end.x, end.y, end.z, dir);
    return { p, head: r.head, killed: p.state === 'dead' };
  }
  if (r.kind === 'car') { const c = r.c; c.damage(dmg * 2.2, by); FX.sparks(end.x, end.y, end.z, 4); if (c.ai && c.ai.mode === 'traffic') c.ai.panic = 8; if (c.police && by === PLAYER) crime('hitCop', c.x, c.z); return { c }; }
  if (r.kind) FX.dust(end.x - dir.x * 0.05, end.y - dir.y * 0.05, end.z - dir.z * 0.05);
  return null;
}
// ---------- カメラ ----------
const _ct = new THREE.Vector3();
function updateCamera(dt) {
  // エイムアシスト①：照準が人に近いほど、指で動かしたときの照準がゆっくりになる（通りすぎにくい）
  const A = !PLAYER.car && PLAYER.gunUp ? PLAYER.assist : null;
  const fr = A ? lerp(PLAYER.aiming ? 0.5 : 0.7, 1, clamp(Math.hypot(angDiff(CAM.yaw, A.wantY) * Math.cos(CAM.pitch), clamp(CAM.pitch, A.pLo, A.pHi) - CAM.pitch) / A.cone, 0, 1)) : 1;
  const sens = SET.sens * HUB.sens * (PLAYER.aiming && !PLAYER.car ? 0.6 : 1) * fr;   // ズームしている間はゆっくり
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
    if (CAM.idleT > 2 && PLAYER.speed > 2.5 && !PLAYER.gunUp) CAM.yaw += angDiff(CAM.yaw, PLAYER.yaw + Math.PI) * Math.min(1, dt * 1.2);
    // エイムアシスト②：動く相手に少しついていく（構えているとき 75%、腰だめ 50%）
    // エイムアシスト③：照準を少しだけ人の体へ引き寄せる（近いほど少し強い。構えた瞬間の 0.15 秒だけ強め）
    if (A) {
      const pv = PLAYER.assistPrev;
      if (pv && pv.o === A.o) { const f = PLAYER.aiming ? 0.75 : 0.5; CAM.yaw += angDiff(pv.y, A.wantY) * f; CAM.pitch += (A.pC - pv.p) * f; }
      const eY = angDiff(CAM.yaw, A.wantY), eP = clamp(CAM.pitch, A.pLo, A.pHi) - CAM.pitch;
      const near = 1 - clamp(Math.hypot(eY * Math.cos(CAM.pitch), eP) / A.cone, 0, 1);
      const k = 1 - Math.exp(-((PLAYER.aiming ? 1.4 : 0.8) * near + (PLAYER.nudgeT > 0 ? 3 : 0)) * dt);
      CAM.yaw += eY * k; CAM.pitch = clamp(CAM.pitch + eP * k, -1.1, 0.75);
    }
    PLAYER.assistPrev = A ? { o: A.o, y: A.wantY, p: A.pC } : null;
    // 構えると肩越し（右肩）に寄る。狙うともっと寄ってズーム
    CAM.ots = damp(CAM.ots, !PLAYER.alive ? 0 : PLAYER.aiming ? 2 : PLAYER.gunUp ? 1 : 0, 9, dt);
    const o = CAM.ots;
    tx = P.x; ty = P.y + (PLAYER.alive ? 1.55 + Math.min(1, o) * 0.07 : 0.6); tz = P.z;
    dist = o < 1 ? lerp(4.3, 2.75, o) : lerp(2.75, 1.7, o - 1); side = o < 1 ? lerp(0, 0.5, o) : lerp(0.5, 0.6, o - 1);
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
  // 反動：跳ね上がった分は少しずつ戻る
  const kd = Math.exp(-9 * dt); CAM.kick *= kd; CAM.kickYaw *= kd;
  camera.rotation.set(CAM.pitch + CAM.kick, CAM.yaw + CAM.kickYaw, 0);
  // 揺れ
  if (GAME.shake > 0) { camera.position.x += rr(-1, 1) * GAME.shake * 0.12; camera.position.y += rr(-1, 1) * GAME.shake * 0.12; GAME.shake = Math.max(0, GAME.shake - dt * 2.5); }
  const baseFov = VW() < VH() ? 78 : 66, wantFov = baseFov + (PLAYER.car ? Math.min(14, PLAYER.car.speed * 0.28) : 0) - (PLAYER.car ? 0 : PLAYER.aiming ? 15 * Math.max(0, CAM.ots - 1) : PLAYER.gunUp ? 4 : 0);
  CAM.fov = damp(CAM.fov || baseFov, wantFov, 4, dt); if (Math.abs(camera.fov - CAM.fov) > 0.05) { camera.fov = CAM.fov; camera.updateProjectionMatrix(); }
}
