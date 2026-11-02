// =========================================================================================
//  街の人と車：交通（車線を走るAI）、歩行者（歩道を歩く・逃げる・倒れる）、警察（手配度）、戦い
// =========================================================================================
const LANE = 2.4;
const segDir = (a, b) => { const A = ROAD.nodes[a], Bn = ROAD.nodes[b], dx = Bn.x - A.x, dz = Bn.z - A.z, l = Math.hypot(dx, dz) || 1; return { dx: dx / l, dz: dz / l, l }; };
// 右側（右側通行の車線）
const laneOff = d => ({ x: -d.dz * LANE, z: d.dx * LANE });
function seatHuman(car, kind, o) {
  const h = makeHuman(kind, o); h.anim = 'sit';
  scene.remove(h.root); car.m.g.add(h.root);
  h.root.position.set(car.T.W * 0.22, (car.type === 'suv' || car.type === 'pickup' ? 0.72 : car.type === 'sports' ? 0.3 : 0.42) + 0.08 - 0.95, -0.1);
  h.mesh.castShadow = false; poseHuman(h, 0);
  return h;
}
const WORLD = {
  cars: [], peds: [], parked: new Map(), t: 0,
  reset() {
    for (const c of this.cars) { if (c.driverH) disposeHuman(c.driverH); c.dispose(); }
    for (const p of this.peds) disposeHuman(p.h);
    this.cars = []; this.peds = []; this.parked.clear(); WANTED.reset();
  },
  // ---------- 車を出す ----------
  spawnCar(type, x, z, yaw, o = {}) { const c = new Car(type, x, z, yaw, o); this.cars.push(c); return c; },
  removeCar(c) {
    if (c.driverH) { disposeHuman(c.driverH); c.driverH = null; }
    c.dispose(); this.cars.splice(this.cars.indexOf(c), 1);
    if (c.parkKey != null) this.parked.delete(c.parkKey);
  },
  trafficCar(x, z, from, to) {
    const r = Math.random(), type = r < 0.42 ? 'sedan' : r < 0.72 ? 'suv' : r < 0.86 ? 'pickup' : 'sports';
    const taxi = type === 'sedan' && Math.random() < 0.25;
    const d = segDir(from, to), c = this.spawnCar(type, x, z, Math.atan2(d.dx, d.dz), taxi ? { taxi: true, paint: [.96, .95, .9] } : {});
    c.ai = { from, to, cruise: rr(10, 14), stuckT: 0, honkT: 0, mode: 'traffic' };
    c.vx = d.dx * 8; c.vz = d.dz * 8;
    c.driverH = seatHuman(c, Math.random() < 0.5 ? 'thobe' : 'casual');
    return c;
  },
  // 見えにくい場所（後ろ・遠く）の車線
  laneSpot(minD, maxD) {
    const P = PLAYER.pos, cf = camFwd();
    for (let tries = 0; tries < 30; tries++) {
      const a = (Math.random() * ROAD.nodes.length) | 0, nb = ROAD.adj[a], b = nb[(Math.random() * nb.length) | 0];
      const d = segDir(a, b), t = rr(0.25, 0.75), A = ROAD.nodes[a], o = laneOff(d);
      const x = A.x + d.dx * d.l * t + o.x, z = A.z + d.dz * d.l * t + o.z, dist = Math.hypot(x - P.x, z - P.z);
      if (dist < minD || dist > maxD) continue;
      const vis = ((x - P.x) * cf.x + (z - P.z) * cf.z) / dist;
      if (vis > 0.35 && dist < 140) continue;
      if (this.cars.some(c => Math.hypot(c.x - x, c.z - z) < 12)) continue;
      return { x, z, a, b };
    }
    return null;
  },
  // ---------- 歩行者 ----------
  pedLoop(i, j) { const x0 = lineX(i) + 6.75, x1 = lineX(i + 1) - 6.75, z0 = lineX(j) + 6.75, z1 = lineX(j + 1) - 6.75; return { x0, x1, z0, z1, L: 2 * (x1 - x0) + 2 * (z1 - z0) }; },
  loopPos(lp, t) {
    const w = lp.x1 - lp.x0, h = lp.z1 - lp.z0; t = ((t % lp.L) + lp.L) % lp.L;
    if (t < w) return [lp.x0 + t, lp.z0, Math.PI / 2];
    if (t < w + h) return [lp.x1, lp.z0 + t - w, 0];
    if (t < 2 * w + h) return [lp.x1 - (t - w - h), lp.z1, -Math.PI / 2];
    return [lp.x0, lp.z1 - (t - 2 * w - h), Math.PI];
  },
  spawnPed(near, kind) {
    const P = PLAYER.pos, cf = camFwd();
    for (let tries = 0; tries < 20; tries++) {
      const i = clamp(Math.floor(P.x / CITY.P) + ((Math.random() * 5) | 0) - 2, 0, 7), j = clamp(Math.floor(P.z / CITY.P) + ((Math.random() * 5) | 0) - 2, 0, 7);
      const lp = this.pedLoop(i, j), t = Math.random() * lp.L, [x, z] = this.loopPos(lp, t), dist = Math.hypot(x - P.x, z - P.z);
      if (dist < (near ? 12 : 38) || dist > 110) continue;
      if (!near && ((x - P.x) * cf.x + (z - P.z) * cf.z) / dist > 0.5 && dist < 80) continue;
      const k = kind || (Math.random() < 0.35 ? 'thobe' : Math.random() < 0.45 ? 'abaya' : 'casual');
      const p = { h: makeHuman(k), kind: k, x, z, yaw: 0, lp, t, dir: Math.random() < .5 ? 1 : -1, sp: rr(1.15, 1.55), state: 'walk', hp: 100, st: 0, idleT: rr(8, 30) };
      this.peds.push(p); return p;
    }
    return null;
  },
  removePed(p) { disposeHuman(p.h); this.peds.splice(this.peds.indexOf(p), 1); },
  scare(x, z, r, from) { for (const p of this.peds) if (p.kind !== 'police' && p.state !== 'lie' && p.state !== 'fall' && p.state !== 'dead' && Math.hypot(p.x - x, p.z - z) < r) { p.state = 'flee'; p.st = 0; p.fleeT = rr(6, 10); p.fx = from ? from.x : x; p.fz = from ? from.z : z; } },
  hurtPed(p, dmg, by, push, hitDir) {
    if (p.state === 'dead') return;
    p.hp -= dmg;
    if (push) { p.x += push.x; p.z += push.z; }
    if (hitDir) { p.x += hitDir.x * 0.12; p.z += hitDir.z * 0.12; }   // 弾が当たると少しよろける
    if (p.hp <= 0) { p.state = 'dead'; p.h.anim = 'fall'; p.h.t = 0; p.st = 0; if (by === PLAYER) crime(p.kind === 'police' ? 'killCop' : 'killPed', p.x, p.z); }
    else if (dmg >= 25 || push) { p.state = 'fall'; p.h.anim = 'fall'; p.h.t = 0; p.st = 0; if (by === PLAYER) crime(p.kind === 'police' ? 'hitCop' : 'hitPed', p.x, p.z); }
    else if (by === PLAYER) { crime(p.kind === 'police' ? 'hitCop' : 'hitPed', p.x, p.z); if (p.kind !== 'police') { p.state = 'flee'; p.fleeT = 8; p.fx = PLAYER.pos.x; p.fz = PLAYER.pos.z; } }
    if (by === PLAYER && p.kind !== 'police') this.scare(p.x, p.z, 18, PLAYER.pos);
    if (p.kind === 'police' && by === PLAYER) p.angry = true;
  },
  blast(x, z, r, src) {
    for (const c of this.cars) { if (c === src) continue; const d = Math.hypot(c.x - x, c.z - z); if (d < r) { c.damage(1300 * (1 - d / r), src && src.lastHitBy); const k = (1 - d / r) * 8; c.vx += (c.x - x) / (d || 1) * k; c.vz += (c.z - z) / (d || 1) * k; } }
    for (const p of this.peds) { const d = Math.hypot(p.x - x, p.z - z); if (d < r) this.hurtPed(p, 140 * (1 - d / r) + 30, src && src.lastHitBy === PLAYER ? PLAYER : null, { x: (p.x - x) / (d || 1) * 1.5, z: (p.z - z) / (d || 1) * 1.5 }); }
    const d = Math.hypot(PLAYER.pos.x - x, PLAYER.pos.z - z); if (d < r) PLAYER.hurt(70 * (1 - d / r) + 10);
    this.scare(x, z, 60, { x, z });
    if (src && src.lastHitBy === PLAYER) crime(src.police ? 'killCop' : 'explosion', x, z);
  },
  // ---------- 毎フレーム ----------
  update(dt) {
    this.t += dt;
    const P = PLAYER.pos;
    // 交通の数を保つ
    const traffic = this.cars.filter(c => c.ai && c.ai.mode === 'traffic');
    if (traffic.length < POP.cars && Math.random() < dt * 4) { const s = this.laneSpot(60, 170); if (s) this.trafficCar(s.x, s.z, s.a, s.b); }
    for (const c of this.cars.slice()) {
      const d = Math.hypot(c.x - P.x, c.z - P.z);
      if (c === PLAYER.car || c.mission || c.keep) continue;
      if ((c.ai && d > 230) || (!c.ai && d > 190) || (c.dead && d > 120)) this.removeCar(c);
    }
    // 路上駐車の車（近づくと現れる）
    for (let k = 0; k < PARK.length; k++) {
      const s = PARK[k], d = Math.hypot(s.x - P.x, s.z - P.z);
      if (d < 130 && !this.parked.has(k) && !s.used) {
        const r = Math.random(), c = this.spawnCar(r < 0.4 ? 'sedan' : r < 0.7 ? 'suv' : r < 0.85 ? 'pickup' : 'sports', s.x, s.z, s.yaw);
        c.parkKey = k; this.parked.set(k, c);
      }
    }
    // 歩行者の数を保つ
    const civ = this.peds.filter(p => p.kind !== 'police');
    if (civ.length < POP.peds && Math.random() < dt * 6) this.spawnPed(civ.length < POP.peds * 0.5);
    for (const p of this.peds.slice()) { const d = Math.hypot(p.x - P.x, p.z - P.z); if ((d > 125 && !p.keep) || (p.state === 'dead' && p.st > 25)) this.removePed(p); }
    // 車：AI と物理
    for (const c of this.cars) {
      if (c.ai && !c.dead) { c.input.stop = 0; aiDrive(c, dt); }
      else if (c !== PLAYER.car) {
        // 誰も乗っていない車：降りた直後は少し惰性で進み、そのあと自動でブレーキがだんだん強くかかって止まる
        const I = c.input, t = c.rollT = c.rollT == null ? 9 : c.rollT + dt;
        I.th = 0; I.br = 0; I.st = 0; I.hb = c.speed < 0.3;
        I.stop = t < 0.6 ? 0.8 : Math.min(6.5, 2 + (t - 0.6) * 6);
      }
      const far = Math.hypot(c.x - P.x, c.z - P.z) > 100;
      if (far && c.ai && c !== PLAYER.car) { c.update(dt); } else c.update(dt);
      if (c.m.siren) { const on = ((this.t * 6) | 0) % 2 === 0; c.m.siren[0].material = on ? CAR_MAT.sirenR : CAR_MAT.sirenOff; c.m.siren[1].material = on ? CAR_MAT.sirenOff : CAR_MAT.sirenB; }
    }
    // 車どうし
    for (let a = 0; a < this.cars.length; a++) for (let b = a + 1; b < this.cars.length; b++) carCarHit(this.cars[a], this.cars[b]);
    // 車と人
    for (const c of this.cars) {
      const sp = c.speed; if (sp < 2.2) continue;
      for (const p of this.peds) {
        if (p.state === 'dead' || p.state === 'lie' || p.state === 'fall' || p.inCar) continue;
        const dx = p.x - c.x, dz = p.z - c.z; if (dx * dx + dz * dz > 16) continue;
        const sx = Math.sin(c.yaw), cz = Math.cos(c.yaw), lz = dx * sx + dz * cz, lx = dx * cz - dz * sx;
        if (Math.abs(lx) < c.T.W / 2 + 0.3 && Math.abs(lz) < c.T.L / 2 + 0.3) {
          this.hurtPed(p, sp * 7, c === PLAYER.car ? PLAYER : null, { x: c.vx * 0.12, z: c.vz * 0.12 });
          AUDIO.thud(p.x, p.z); c.vx *= 0.92; c.vz *= 0.92;
          if (c.ai && c !== PLAYER.car) c.ai.stuckT = 0;
        }
      }
      // 歩いている主人公をひく
      if (!PLAYER.car && c !== PLAYER.car && PLAYER.alive && !PLAYER.down) {
        const dx = P.x - c.x, dz = P.z - c.z; if (dx * dx + dz * dz < 16) {
          const sx = Math.sin(c.yaw), cz = Math.cos(c.yaw), lz = dx * sx + dz * cz, lx = dx * cz - dz * sx;
          if (Math.abs(lx) < c.T.W / 2 + 0.25 && Math.abs(lz) < c.T.L / 2 + 0.25) { PLAYER.hurt(sp * 3.2); PLAYER.knock(c.vx * 0.25, c.vz * 0.25); AUDIO.thud(P.x, P.z); }
        }
      }
    }
    // 歩行者
    for (const p of this.peds) updatePed(p, dt);
    WANTED.update(dt);
  },
};
function camFwd() { const y = CAM.yaw; return { x: -Math.sin(y), z: -Math.cos(y) }; }
// 車どうしの衝突（円3つずつ）
function carCarHit(a, b) {
  if (Math.abs(a.x - b.x) > 7 || Math.abs(a.z - b.z) > 7) return;
  const ca = a.circles(), cb = b.circles(), r = a.r + b.r;
  for (const [ax, az] of ca) for (const [bx, bz] of cb) {
    const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz);
    if (d >= r || d < 1e-4) continue;
    const nx = dx / d, nz = dz / d, pen = r - d, ma = a.T.mass, mb = b.T.mass, wa = mb / (ma + mb), wb = ma / (ma + mb);
    a.x -= nx * pen * wa; a.z -= nz * pen * wa; b.x += nx * pen * wb; b.z += nz * pen * wb;
    const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
    if (rv < 0) {
      const j = -1.4 * rv / (1 / ma + 1 / mb);
      a.vx -= j / ma * nx; a.vz -= j / ma * nz; b.vx += j / mb * nx; b.vz += j / mb * nz;
      const hit = -rv;
      if (hit > 3) {
        const by = a === PLAYER.car ? PLAYER : b === PLAYER.car ? PLAYER : null;
        a.damage(Math.min(380, hit * hit * 1.2 * wa), by); b.damage(Math.min(380, hit * hit * 1.2 * wb), by);   // 同じ重さなら 0.6·hit²、1回で最大 340 前後
        AUDIO.crash((ax + bx) / 2, (az + bz) / 2, Math.min(1, hit / 16));
        if (hit > 8) FX.sparks((ax + bx) / 2, 0.6, (az + bz) / 2, 8);
        if (by) { const other = a === PLAYER.car ? b : a; if (other.police) crime('hitCop', other.x, other.z); else if (hit > 6 && other.ai) { other.ai.panic = 6; } }
        if (a === PLAYER.car || b === PLAYER.car) GAME.shake = Math.max(GAME.shake, Math.min(0.8, hit / 20));
      }
    }
    return;
  }
}
// ---------- 交通AI ----------
function aiDrive(c, dt) {
  const ai = c.ai, I = c.input;
  if (ai.mode === 'pursuit') return pursuitDrive(c, dt);
  if (ai.mode === 'flee') return fleeDrive(c, dt);
  if (ai.mode === 'park') { I.th = 0; I.br = 1; I.st = 0; return; }
  let d = segDir(ai.from, ai.to); const B = ROAD.nodes[ai.to], o = laneOff(d);
  const ex = B.x + o.x, ez = B.z + o.z, toEnd = (ex - c.x) * d.dx + (ez - c.z) * d.dz;
  if (toEnd < 9) {   // 次の道をえらぶ
    if (ai.next == null) { const nb = ROAD.adj[ai.to].filter(n => n !== ai.from); ai.next = nb.length ? nb[(Math.random() * nb.length) | 0] : ai.from; }
    if (toEnd < 4) { ai.from = ai.to; ai.to = ai.next; ai.next = null; d = segDir(ai.from, ai.to); }
  }
  // 目標点：車線の上の少し先（曲がる前は次の車線へ）
  let tx, tz, turn = false;
  const look = 7 + c.speed * 0.4;
  if (ai.next != null && toEnd < 12) {
    const d2 = segDir(ai.to, ai.next), o2 = laneOff(d2), N = ROAD.nodes[ai.to];
    tx = N.x + o2.x + d2.dx * look * 0.6; tz = N.z + o2.z + d2.dz * look * 0.6; turn = d2.dx * d.dx + d2.dz * d.dz < 0.5;
  } else {
    const A = ROAD.nodes[ai.from], ox = laneOff(d), t = (c.x - (A.x + ox.x)) * d.dx + (c.z - (A.z + ox.z)) * d.dz;
    tx = A.x + ox.x + d.dx * (t + look); tz = A.z + ox.z + d.dz * (t + look);
  }
  steerTo(c, tx, tz);
  // 前の車・人・主人公を見て止まる
  let want = ai.panic > 0 ? 19 : (turn ? 6.5 : ai.cruise);
  if (ai.panic > 0) ai.panic -= dt;
  const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), half = c.T.L / 2;
  let block = 99;
  const check = (x, z, rad) => { const dx = x - c.x, dz = z - c.z, ahead = dx * fx + dz * fz, side = Math.abs(dx * fz - dz * fx); if (ahead > half - 0.5 && ahead < 22 && side < rad) block = Math.min(block, ahead - half); };
  for (const o2 of WORLD.cars) if (o2 !== c) check(o2.x, o2.z, 2.0);
  for (const p of WORLD.peds) if (p.state !== 'dead' && p.state !== 'lie' && !p.inCar) check(p.x, p.z, 1.4);
  if (!PLAYER.car && PLAYER.alive) check(PLAYER.pos.x, PLAYER.pos.z, 1.5);
  if (ai.panic > 0) block = Math.max(block, 6);
  if (block < 14) want = Math.min(want, Math.max(0, (block - 3) * 1.1));
  const v = c.fwd;
  I.th = v < want - 0.5 ? clamp((want - v) / 4, 0.25, 1) : 0; I.br = v > want + 1 ? clamp((v - want) / 5, 0.2, 1) : (want === 0 && v > 0.2 ? 1 : 0); I.hb = false;
  // 動けないとき：ホーンを鳴らし、長いときは消す
  if (c.speed < 0.6 && want < 1) { ai.stuckT += dt; ai.honkT -= dt; if (ai.stuckT > 1.5 && ai.honkT <= 0 && Math.hypot(c.x - PLAYER.pos.x, c.z - PLAYER.pos.z) < 40) { AUDIO.horn(c.x, c.z, 0.5); ai.honkT = rr(2, 5); } }
  else ai.stuckT = Math.max(0, ai.stuckT - dt);
  if (ai.stuckT > 14 && Math.hypot(c.x - PLAYER.pos.x, c.z - PLAYER.pos.z) > 40) c.hp = Math.min(c.hp, 1), ai.mode = 'park';
}
function steerTo(c, tx, tz, k = 2.2) {
  const want = Math.atan2(tx - c.x, tz - c.z), diff = angDiff(c.yaw, want);
  c.input.st = clamp(diff * k * (c.fwd < 0 ? -1 : 1), -1, 1);
  return diff;
}
// 警察の追跡：道路の交差点を伝って近づき、近くでは主人公（の車）へまっすぐ
function pursuitDrive(c, dt) {
  const ai = c.ai, I = c.input, P = PLAYER.car ? { x: PLAYER.car.x, z: PLAYER.car.z, vx: PLAYER.car.vx, vz: PLAYER.car.vz } : { x: PLAYER.pos.x, z: PLAYER.pos.z, vx: 0, vz: 0 };
  const d = Math.hypot(P.x - c.x, P.z - c.z);
  let tx, tz;
  const direct = d < 45 && segBlock(c.x, c.z, P.x, P.z, 1) >= 1;
  if (direct) { tx = P.x + P.vx * 0.6; tz = P.z + P.vz * 0.6; }
  else {
    if (ai.to == null || Math.hypot(ROAD.nodes[ai.to].x - c.x, ROAD.nodes[ai.to].z - c.z) < 8) {
      const here = nearestNode(c.x, c.z); let best = here, bd = 1e9;
      for (const n of ROAD.adj[here]) { const N = ROAD.nodes[n], dd = Math.hypot(N.x - P.x, N.z - P.z); if (dd < bd) { bd = dd; best = n; } }
      ai.to = Math.hypot(ROAD.nodes[here].x - c.x, ROAD.nodes[here].z - c.z) > 10 ? here : best;
    }
    tx = ROAD.nodes[ai.to].x; tz = ROAD.nodes[ai.to].z;
  }
  const diff = steerTo(c, tx, tz, 2.6);
  const onFoot = !PLAYER.car;
  let want = direct ? (onFoot ? clamp(d - 9, 0, 20) : 36) : 30;
  if (Math.abs(diff) > 1.0 && c.fwd > 12) want = 12;
  const v = c.fwd;
  I.th = v < want ? 1 : 0; I.br = v > want + 2 ? 1 : 0; I.hb = Math.abs(diff) > 1.2 && v > 14;
  // 詰まったら少し下がる
  if (c.speed < 1 && I.th > 0) { ai.stuckT = (ai.stuckT || 0) + dt; } else ai.stuckT = 0;
  if (ai.stuckT > 1.5) { ai.revT = 1.2; ai.stuckT = 0; }
  if (ai.revT > 0) { ai.revT -= dt; I.th = 0; I.br = 1; I.st = -I.st; }
  // 歩いているなら警官が降りてくる
  if (onFoot && d < 16 && c.speed < 2 && !ai.unloaded) { ai.unloaded = true; for (let k = 0; k < (WANTED.level >= 3 ? 2 : 1); k++) copOut(c, k); }
}
function fleeDrive(c, dt) {
  const ai = c.ai, I = c.input, P = PLAYER.pos;
  if (ai.to == null || Math.hypot(ROAD.nodes[ai.to].x - c.x, ROAD.nodes[ai.to].z - c.z) < 9) {
    const here = nearestNode(c.x, c.z); let best = null, bd = -1;
    for (const n of ROAD.adj[here]) { if (n === ai.prev) continue; const N = ROAD.nodes[n], dd = Math.hypot(N.x - P.x, N.z - P.z) + Math.random() * 40; if (dd > bd) { bd = dd; best = n; } }
    ai.prev = here; ai.to = best != null ? best : ROAD.adj[here][0];
  }
  const N = ROAD.nodes[ai.to], diff = steerTo(c, N.x, N.z, 2.4), v = c.fwd, want = Math.abs(diff) > 0.8 ? 11 : ai.speed || 30;
  I.th = v < want ? 1 : 0; I.br = v > want + 3 ? 1 : 0; I.hb = false;
}
// ---------- 歩行者の動き ----------
function updatePed(p, dt) {
  const h = p.h, P = PLAYER.pos; p.st += dt;
  let sp = 0;
  const dist = Math.hypot(p.x - P.x, p.z - P.z);
  if (p.kind === 'police') { copThink(p, dt); sp = p.moveSp || 0; }
  else if (p.state === 'walk') {
    p.idleT -= dt;
    if (p.idleT < 0) { p.state = 'idle'; p.st = 0; p.idleT = rr(2, 6); }
    p.t += p.dir * p.sp * dt; const [x, z, yaw] = WORLD.loopPos(p.lp, p.t);
    // 前に人がいたら少しよける
    p.x = x; p.z = z; p.yaw = p.dir > 0 ? yaw : yaw + Math.PI; sp = p.sp; h.anim = 'walk';
  } else if (p.state === 'idle') {
    h.anim = 'idle'; if (p.st > p.idleT) { p.state = 'walk'; p.st = 0; p.idleT = rr(10, 30); if (Math.random() < 0.3) p.dir = -p.dir; }
  } else if (p.state === 'flee') {
    const ax = p.x - p.fx, az = p.z - p.fz, l = Math.hypot(ax, az) || 1;
    const want = Math.atan2(ax / l, az / l); p.yaw += clamp(angDiff(p.yaw, want), -5 * dt, 5 * dt);
    sp = 4.6; p.x += Math.sin(p.yaw) * sp * dt; p.z += Math.cos(p.yaw) * sp * dt; h.anim = Math.random() < 0.002 ? 'flee' : (h.anim === 'flee' ? 'flee' : 'run');
    const q = { x: p.x, z: p.z }; if (pushOut(q, 0.3, 0)) { p.yaw += rr(-1.2, 1.2); } p.x = q.x; p.z = q.z;
    if (p.st > p.fleeT) { // 歩道の輪に戻る
      p.state = 'walk'; p.st = 0;
      const i = clamp(Math.floor(p.x / CITY.P), 0, 7), j = clamp(Math.floor(p.z / CITY.P), 0, 7); p.lp = WORLD.pedLoop(i, j);
      let best = 0, bd = 1e9; for (let t = 0; t < p.lp.L; t += 2) { const [x, z] = WORLD.loopPos(p.lp, t), dd = Math.hypot(x - p.x, z - p.z); if (dd < bd) { bd = dd; best = t; } }
      p.t = best;
    }
  } else if (p.state === 'fall') {
    h.anim = 'fall'; if (p.st > 0.6) { p.state = 'lie'; p.st = 0; p.lieT = rr(3, 6); }
  } else if (p.state === 'lie') {
    h.anim = 'lie'; if (p.st > p.lieT) { p.state = 'getup'; p.st = 0; h.anim = 'getup'; h.t = 0; }
  } else if (p.state === 'getup') {
    h.anim = 'getup'; if (p.st > 0.9) { p.state = 'flee'; p.st = 0; p.fleeT = 8; p.fx = P.x; p.fz = P.z; }
  } else if (p.state === 'dead') { h.anim = 'lie'; if (p.st < 0.6) h.anim = 'fall'; }
  else if (p.state === 'jacked') {   // 車から引きずり出された
    h.anim = 'fall'; if (p.st > 0.7) { p.state = 'flee'; p.st = 0; p.fleeT = 10; p.fx = P.x; p.fz = P.z; }
  }
  // 地面
  p.y = groundH(p.x, p.z);
  h.root.position.set(p.x, p.y, p.z); h.root.rotation.y = p.yaw;
  if (dist < 90 || p.st < 0.1) poseHuman(h, dt, sp);
  h.root.visible = dist < 140;
}
// ---------- 警察 ----------
function copOut(car, k) {
  const sx = Math.sin(car.yaw), cz = Math.cos(car.yaw), side = k ? -1 : 1;
  const x = car.x + cz * side * 1.6, z = car.z - sx * side * 1.6;
  const p = { h: makeHuman('police'), kind: 'police', x, z, yaw: car.yaw, state: 'chase', hp: 100, st: 0, fireT: rr(0.5, 1.2), car };
  WORLD.peds.push(p); return p;
}
function copThink(p, dt) {
  const h = p.h, P = PLAYER.pos, dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz);
  p.moveSp = 0;
  if (p.state === 'dead' || p.state === 'fall' || p.state === 'lie' || p.state === 'getup') {
    if (p.state === 'fall') { h.anim = 'fall'; if (p.st > 0.6) { p.state = p.hp > 0 ? 'lie' : 'dead'; p.st = 0; p.lieT = 2.5; } }
    else if (p.state === 'lie') { h.anim = 'lie'; if (p.st > p.lieT) { p.state = 'getup'; p.st = 0; h.t = 0; } }
    else if (p.state === 'getup') { h.anim = 'getup'; if (p.st > 0.9) { p.state = 'chase'; p.st = 0; } }
    else h.anim = 'lie';
    return;
  }
  if (WANTED.level === 0 || !PLAYER.alive) {   // 手配が消えた：車に戻るか、歩き去る
    h.anim = 'walk'; p.moveSp = 1.4; p.yaw = Math.atan2(-dx, -dz); p.x += Math.sin(p.yaw) * 1.4 * dt; p.z += Math.cos(p.yaw) * 1.4 * dt; p.keep = false; return;
  }
  p.keep = true;
  const see = d < 60 && segBlock(p.x, p.z, P.x, P.z, 1.4) >= 1;
  const want = Math.atan2(dx, dz);
  if (WANTED.level === 1 && !PLAYER.car) {   // ★1：つかまえに来る
    p.yaw += clamp(angDiff(p.yaw, want), -6 * dt, 6 * dt);
    if (d > 1.3) { p.moveSp = d > 6 ? 4.8 : 2.4; h.anim = d > 6 ? 'run' : 'walk'; p.x += Math.sin(p.yaw) * p.moveSp * dt; p.z += Math.cos(p.yaw) * p.moveSp * dt; }
    else { h.anim = 'aim'; WANTED.grab(dt); }
  } else {   // ★2以上：撃ってくる
    p.yaw += clamp(angDiff(p.yaw, want), -6 * dt, 6 * dt);
    if (!see || d > 24) { p.moveSp = 4.6; h.anim = 'run'; p.x += Math.sin(p.yaw) * p.moveSp * dt; p.z += Math.cos(p.yaw) * p.moveSp * dt; }
    else {
      h.anim = 'aim'; p.fireT -= dt;
      if (p.fireT <= 0) {
        p.fireT = rr(0.6, 1.1) / (1 + WANTED.level * 0.12);
        const hp = handPos(h), tgt = new THREE.Vector3(P.x, (PLAYER.car ? PLAYER.car.y + 1 : P.y + 1.3), P.z);
        FX.muzzle(hp.x, hp.y, hp.z); AUDIO.gun(hp.x, hp.z, 0.7);
        const acc = 0.35 + 0.07 * WANTED.level - d * 0.008 - (PLAYER.car ? PLAYER.car.speed * 0.012 : 0);
        if (Math.random() < acc) { FX.tracer(hp.clone(), tgt); if (PLAYER.car) PLAYER.car.damage(28, p); else PLAYER.hurt(rr(5, 9)); }
        else FX.tracer(hp.clone(), tgt.clone().add(new THREE.Vector3(rr(-2, 2), rr(-1, 1), rr(-2, 2))));
      }
    }
  }
  const q = { x: p.x, z: p.z }; pushOut(q, 0.3, 0); p.x = q.x; p.z = q.z;
}
// 手配度
const WANTED = {
  level: 0, seeT: 0, last: { x: 0, z: 0 }, grabT: 0, spawnT: 0,
  reset() { this.level = 0; this.seeT = 0; this.grabT = 0; },
  set(n) {
    const old = this.level; this.level = clamp(Math.max(this.level, n), 0, 5);
    if (this.level > old) { this.seeT = 0; this.last.x = PLAYER.pos.x; this.last.z = PLAYER.pos.z; UI.stars(); if (old === 0) AUDIO.sirenStart(); }
  },
  grab(dt) { if (PLAYER.car) return; this.grabT += dt * (PLAYER.speed < 2.2 ? 1 : 0.3); if (this.grabT > 1.4) GAME.busted(); },
  copsSee() {
    const P = PLAYER.car ? { x: PLAYER.car.x, z: PLAYER.car.z } : PLAYER.pos;
    for (const c of WORLD.cars) if (c.police && !c.dead && Math.hypot(c.x - P.x, c.z - P.z) < 70 && segBlock(c.x, c.z, P.x, P.z, 1.4) >= 1) return true;
    for (const p of WORLD.peds) if (p.kind === 'police' && p.state !== 'dead' && Math.hypot(p.x - P.x, p.z - P.z) < 55 && segBlock(p.x, p.z, P.x, P.z, 1.4) >= 1) return true;
    return false;
  },
  update(dt) {
    this.grabT = Math.max(0, this.grabT - dt * 0.5);
    if (this.level === 0) { for (const c of WORLD.cars) if (c.police && c.ai && c.ai.mode === 'pursuit') { c.ai.mode = 'traffic'; const n = nearestNode(c.x, c.z); c.ai.from = n; c.ai.to = ROAD.adj[n][0]; } return; }
    // 見られているか
    if (this.copsSee()) { this.seeT = 0; const P = PLAYER.car || PLAYER.pos; this.last.x = P.x; this.last.z = P.z; } else this.seeT += dt;
    $('stars').classList.toggle('blink', this.seeT > 1.5);
    if (this.seeT > 7 + this.level * 3.5) { this.level = 0; UI.stars(); UI.big('', '逃げきった', 1.6); AUDIO.sirenStop(); for (const p of WORLD.peds) if (p.kind === 'police') p.keep = false; return; }
    // パトカーを出す
    const want = [0, 2, 3, 4, 5, 6][this.level], have = WORLD.cars.filter(c => c.police && !c.dead && c.ai && c.ai.mode === 'pursuit').length;
    this.spawnT -= dt;
    if (have < want && this.spawnT <= 0) {
      this.spawnT = 2.5;
      const s = WORLD.laneSpot(70, 150);
      if (s) { const d = segDir(s.a, s.b), c = WORLD.spawnCar('suv', s.x, s.z, Math.atan2(d.dx, d.dz), { police: true }); c.ai = { mode: 'pursuit', to: null }; c.T = Object.assign({}, c.T, { max: 46, acc: 10.5 }); c.driverH = seatHuman(c, 'police'); }
    }
  },
};
function crime(kind, x, z) {
  const witnessed = WANTED.level > 0 || WANTED.copsSee() || WORLD.cars.some(c => c.police && Math.hypot(c.x - x, c.z - z) < 45) || WORLD.peds.some(p => p.kind === 'police' && p.state !== 'dead' && Math.hypot(p.x - x, p.z - z) < 40);
  const L = WANTED.level;
  switch (kind) {
    case 'shoot': if (L < 1) WANTED.set(1); break;
    case 'hitPed': if (witnessed) WANTED.set(Math.max(1, L)); break;
    case 'killPed': if (witnessed || Math.random() < 0.4) WANTED.set(L + 1 > 1 && L > 0 ? L + (Math.random() < 0.5 ? 1 : 0) : 1); break;
    case 'jack': if (witnessed) WANTED.set(Math.max(1, L)); break;
    case 'hitCop': WANTED.set(Math.max(2, L)); break;
    case 'killCop': WANTED.set(Math.max(3, L + 1)); break;
    case 'explosion': WANTED.set(Math.max(2, L + 1)); break;
  }
}
