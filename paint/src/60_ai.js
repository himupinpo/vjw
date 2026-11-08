
// ================= CPU（道さがし・ぬり・戦い） =================
// 1m の道の表。ます目の床がほぼ平らなら歩ける。となりへは段差 0.45m まで（下りはいくらでも）
const NC = 1, NW = Math.round(MAPW / NC), ND = Math.round(MAPD / NC);
const NH = new Float32Array(NW * ND), NOK = new Uint8Array(NW * ND);
function buildNav() {
  const per = Math.round(NC / CS);
  for (let j = 0; j < ND; j++) for (let i = 0; i < NW; i++) {
    let lo = 99, hi = -99;
    for (let b = 0; b < per; b++) for (let a = 0; a < per; a++) { const h = HG[(j * per + b) * GW + i * per + a]; lo = Math.min(lo, h); hi = Math.max(hi, h); }
    const k = j * NW + i; NH[k] = hi; NOK[k] = lo > -5 && hi - lo < .5 ? 1 : 0;
  }
  // 水ぎわ・相手のスタート台のそばは通らない
  for (let j = 0; j < ND; j++) for (let i = 0; i < NW; i++) {
    const k = j * NW + i; if (!NOK[k]) continue;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= NW || jj >= ND || NH[jj * NW + ii] < -5) { NOK[k] = 2; break; } }
  }
}
const navXZ = k => [X0 + (k % NW + .5) * NC, Z0 + (Math.floor(k / NW) + .5) * NC];
const navOf = (x, z) => { const i = Math.floor((x - X0) / NC), j = Math.floor((z - Z0) / NC); return i < 0 || j < 0 || i >= NW || j >= ND ? -1 : j * NW + i; };
function navOk(k, team) {
  if (k < 0 || NOK[k] !== 1) return false;
  const [x, z] = navXZ(k), zn = SPAWN_ZONE[3 - team];
  return !(x > zn[0] - 1 && x < zn[2] + 1 && z > zn[1] - 1 && z < zn[3] + 1);
}
// A*（2分ヒープ）
function findPath(sx, sz, tx, tz, team) {
  let s = navOf(sx, sz), t = navOf(tx, tz);
  if (s < 0 || t < 0) return null;
  if (!navOk(t, team)) { t = nearestOk(t, team); if (t < 0) return null; }
  if (!navOk(s, team)) { const s2 = nearestOk(s, team); if (s2 >= 0) s = s2; }
  const N = NW * ND, g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [], push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const ti = t % NW, tj = Math.floor(t / NW), hh = k => Math.hypot(k % NW - ti, Math.floor(k / NW) - tj);
  g[s] = 0; push(s, hh(s)); let it = 0;
  while (heap.length && it++ < 9000) {
    const [, k] = pop(); if (closed[k]) continue; closed[k] = 1;
    if (k === t) break;
    const i = k % NW, j = Math.floor(k / NW);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= NW || jj >= ND) continue;
      const n = jj * NW + ii; if (closed[n] || !navOk(n, team)) continue;
      const up = NH[n] - NH[k]; if (up > .45) continue;
      if (di && dj && (!navOk(j * NW + ii, team) || !navOk(jj * NW + i, team))) continue;
      const c = g[k] + (di && dj ? 1.414 : 1) + (up < -1.5 ? 1.5 : 0);
      if (c < g[n]) { g[n] = c; from[n] = k; push(n, c + hh(n)); }
    }
  }
  if (from[t] < 0 && t !== s) return null;
  const path = []; for (let k = t; k >= 0 && k !== s; k = from[k]) path.push(k);
  path.reverse(); return path.map(navXZ);
}
function nearestOk(k, team) {
  const i0 = k % NW, j0 = Math.floor(k / NW);
  for (let r = 1; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= NW || j >= ND) continue; const n = j * NW + i; if (navOk(n, team)) return n; }
  return -1;
}
// ぬりたい場所：自分の色でない、前のほうの所
function pickGoal(a) {
  let best = null, bs = -1e9;
  const front = a.team === 1 ? -1 : 1;
  for (let n = 0; n < 26; n++) {
    const k = Math.floor(Math.random() * NW * ND); if (!navOk(k, a.team)) continue;
    const [x, z] = navXZ(k), pt = paintAtCell(x, z);
    const d = Math.hypot(x - a.x, z - a.z);
    let s = (pt === a.team ? 0 : pt ? 8 : 5) - d * .12 + (z * front) * .05 + Math.random() * 3;
    // ほかの味方と同じ所に集まりすぎない
    for (const o of actors) if (o !== a && o.team === a.team && o.ai && o.ai.goal && Math.hypot(o.ai.goal[0] - x, o.ai.goal[1] - z) < 8) s -= 4;
    if (s > bs) { bs = s; best = [x, z]; }
  }
  return best;
}
const AIP = [{ err: .16, react: .7, fireP: .55 }, { err: .08, react: .4, fireP: .8 }, { err: .035, react: .22, fireP: .95 }];
function botThink(a, dt) {
  const ai = a.ai || (a.ai = { t: 0, path: null, pi: 0, goal: null, strafe: 1, st: 0, stuckT: 0, lx: a.x, lz: a.z, target: null, seeT: 0, refill: 0, subT: rand(4, 9) });
  const P = AIP[SET.diff] || AIP[1], w = a.w;
  const ctl = { mx: 0, mz: 0, dive: false, jump: false, fire: false, dodge: false };
  if (a.dead || G.state !== 'play') return ctl;
  ai.t -= dt; ai.subT -= dt; ai.st -= dt;
  const engage = (w.range || w.frange || 6) * (w.cls === 'roller' || w.cls === 'brush' ? 1.6 : 1.15);
  // 敵を見つける
  if (ai.t <= 0) {
    ai.t = .25;
    let best = null, bd = 1e9;
    for (const o of actors) {
      if (o.dead || o.team === a.team) continue;
      if (o.swim && !o.revealed && Math.hypot(o.x - a.x, o.z - a.z) > 3) continue;
      const d = Math.hypot(o.x - a.x, o.z - a.z); if (d > engage + 8) continue;
      if (!lineOfSight(a.x, a.y + 1.1, a.z, o.x, o.y + .8, o.z)) continue;
      if (d < bd) { bd = d; best = o; }
    }
    if (best !== ai.target) { ai.target = best; ai.seeT = 0; }
    // 行き先
    if (!ai.goal || !ai.path || ai.pi >= ai.path.length || Math.random() < .02) {
      ai.goal = pickGoal(a); ai.path = ai.goal ? findPath(a.x, a.z, ai.goal[0], ai.goal[1], a.team) : null; ai.pi = 0;
    }
    // 動けていない
    if (Math.hypot(a.x - ai.lx, a.z - ai.lz) < .15) ai.stuckT += .25; else ai.stuckT = 0;
    ai.lx = a.x; ai.lz = a.z;
    if (ai.stuckT > 1.2) { ai.stuckT = 0; ai.path = null; ai.jumpReq = true; }
  }
  const t = ai.target;
  let mx = 0, mz = 0;
  const follow = () => {
    if (!ai.path || ai.pi >= ai.path.length) return;
    let [px, pz] = ai.path[ai.pi];
    while (Math.hypot(px - a.x, pz - a.z) < .8 && ai.pi < ai.path.length - 1) { ai.pi++;[px, pz] = ai.path[ai.pi]; }
    if (Math.hypot(px - a.x, pz - a.z) < .8) ai.pi++;
    const dx = px - a.x, dz = pz - a.z, l = Math.hypot(dx, dz) || 1; mx = dx / l; mz = dz / l;
  };
  if (t) {
    ai.seeT += dt;
    const dx = t.x - a.x, dz = t.z - a.z, d = Math.hypot(dx, dz) || 1;
    // ねらい（反応のおくれとぶれ）
    const lead = clamp(d / 30, 0, .4);
    const ex = t.x + t.vx * lead + (Math.random() - .5) * P.err * d, ez = t.z + t.vz * lead + (Math.random() - .5) * P.err * d, ey = t.y + (t.dive ? .2 : .8) + (Math.random() - .5) * P.err * d * .5;
    a.aimPt = new T.Vector3(ex, ey, ez);
    const from = muzzle(a), dv = a.aimPt.clone().sub(from);
    const wantYaw = Math.atan2(dv.x, dv.z), wantPit = Math.atan2(dv.y, Math.hypot(dv.x, dv.z));
    a.aimYaw += angD(wantYaw - a.aimYaw) * Math.min(1, dt * 10); a.aimPitch += (wantPit - a.aimPitch) * Math.min(1, dt * 10);
    const facing = Math.abs(angD(wantYaw - a.aimYaw)) < .25;
    // 距離をとる・つめる・左右へ
    const prefer = w.cls === 'roller' || w.cls === 'brush' ? .5 : w.cls === 'sniper' ? engage * .8 : engage * .7;
    let fx = 0, fz = 0;
    if (d > prefer + 1.5) { fx = dx / d; fz = dz / d; } else if (d < prefer - 2 && w.cls !== 'roller' && w.cls !== 'brush') { fx = -dx / d; fz = -dz / d; }
    if (ai.st <= 0) { ai.strafe = Math.random() < .5 ? -1 : 1; ai.st = rand(.6, 1.6); }
    fx += -dz / d * ai.strafe * .7; fz += dx / d * ai.strafe * .7;
    // 歩ける所だけ
    const nx = a.x + fx * 1.2, nz = a.z + fz * 1.2;
    if (!navOk(navOf(nx, nz), a.team) || hAround(nx, nz) > a.y + STEP) { fx = -fx; fz = -fz; ai.strafe *= -1; }
    mx = fx; mz = fz;
    if (w.cls === 'roller' || w.cls === 'brush') { mx = dx / d; mz = dz / d; }
    const inRange = d < engage, ready = ai.seeT > P.react && facing && inRange;
    if (w.cls === 'sniper') { ctl.fire = ready || (a.ws.ch > 0 && a.ws.ch < 1); if (a.ws.ch >= 1 && ready) ctl.fire = false; if (d < 6 && a.ws.ch > .35) ctl.fire = false; }
    else if (w.cls === 'bow') { ctl.fire = ready && !(a.ws.bow >= (d < 8 ? .4 : 1)); }
    else if (w.cls === 'gatling') { ctl.fire = ready && !(a.ws.spin >= (d < 8 ? .5 : 1)) && !(a.ws.fireT > 0); }
    else if (w.cls === 'blade') { ctl.fire = ready && !(a.ws.blade >= (d > 5 ? w.charge + .05 : .05)); }
    else if (w.cls === 'roller' || w.cls === 'brush') { ctl.fire = ready && (d < 9); }
    else ctl.fire = ready && Math.random() < P.fireP + .2;
    if (w.cls === 'dual' && ready && Math.random() < .02) ctl.dodge = true;
    // サブ・スペシャル
    if (ai.subT <= 0 && a.ink > SUBS[w.sub].ink + 15 && d > 4 && d < 16) { ai.subT = rand(5, 10); throwSub(a); }
    if (a.sp >= 1 && Math.random() < .03) useSpecial(a);
  } else {
    follow();
    // 進む先の床をぬる
    const dirx = mx || Math.sin(a.aimYaw), dirz = mz || Math.cos(a.aimYaw);
    const ahead = w.cls === 'sniper' ? 10 : clamp((w.range || w.frange || 5) * .6, 3, 9);
    const px = a.x + dirx * ahead, pz = a.z + dirz * ahead;
    a.aimPt = new T.Vector3(px + (Math.random() - .5) * 2, hAt(px, pz), pz + (Math.random() - .5) * 2);
    const wantYaw = Math.atan2(dirx, dirz); a.aimYaw += angD(wantYaw - a.aimYaw) * Math.min(1, dt * 6);
    a.aimPitch += (-.25 - a.aimPitch) * Math.min(1, dt * 4);
    const own = paintAtCell(px, pz) === a.team;
    // ペンキが少ない：自分の色の上でもぐって補給
    if (a.ink < 18) ai.refill = 2.2;
    if (ai.refill > 0) { ai.refill -= dt; if (groundTeam(a) === a.team) { ctl.dive = true; } }
    else {
      const paintWpn = !(w.cls === 'sniper' && Math.random() < .7);
      if (w.cls === 'roller' || w.cls === 'brush') ctl.fire = a.ink > 10;
      else if (paintWpn && !own && a.ink > 25) ctl.fire = w.cls === 'gatling' ? !(a.ws.spin >= .7) && !(a.ws.fireT > 0) : w.cls === 'bow' ? !(a.ws.bow >= .5) : w.cls === 'blade' ? !(a.ws.blade > .05) : w.cls === 'sniper' ? !(a.ws.ch >= .4) : true;
      // 自分の色の上を通るときはもぐって速く
      if (!ctl.fire && groundTeam(a) === a.team && Math.hypot(mx, mz) > .5 && Math.random() < .9) ctl.dive = true;
    }
    if (a.sp >= 1 && (w.sp === 'rain' || w.sp === 'armor' || w.sp === 'barrier') && Math.random() < .01) useSpecial(a);
    if (ai.subT <= 0 && w.sub === 'fountain' && a.ink > 70) { ai.subT = rand(8, 14); throwSub(a); }
  }
  // 段差：低い壁は飛びこえる
  const l = Math.hypot(mx, mz);
  if (l > .1) { const nx = a.x + mx / l * .7, nz = a.z + mz / l * .7, h = hAround(nx, nz); if (h > a.y + STEP && h < a.y + 1.1) ai.jumpReq = true; }
  if (ai.jumpReq && a.onGround) { ctl.jump = true; ai.jumpReq = false; }
  ctl.mx = mx; ctl.mz = mz;
  return ctl;
}
