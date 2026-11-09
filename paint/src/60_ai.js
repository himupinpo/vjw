
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
  // 水ぎわは通らない
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
      const up = NH[n] - NH[k]; if (up > .65) continue;   // 急な坂も登る（0.4〜0.65 の段はジャンプ）
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
// ぬりたい場所：自分の色でない、前のほうの所（ゾーン争奪ならゾーンの中を多めに）
function pickGoal(a) {
  let best = null, bs = -1e9;
  const front = a.team === 1 ? -1 : 1, zone = G.mode === 'zone' && ZONE && Math.random() < (G.zOwner === a.team ? .5 : .8);
  for (let n = 0; n < 26; n++) {
    let k;
    if (zone) k = navOf(rand(ZONE[0], ZONE[2]), rand(ZONE[1], ZONE[3]));
    else k = Math.floor(Math.random() * NW * ND);
    if (!navOk(k, a.team)) continue;
    const [x, z] = navXZ(k), pt = paintAtCell(x, z);
    const d = Math.hypot(x - a.x, z - a.z);
    let s = (pt === a.team ? 0 : pt ? 8 : 5) - d * .12 + (z * front) * .05 + Math.random() * 3 + (zone ? 6 : 0);
    for (const o of actors) if (o !== a && o.team === a.team && o.ai && o.ai.goal && Math.hypot(o.ai.goal[0] - x, o.ai.goal[1] - z) < 8) s -= 4;
    if (s > bs) { bs = s; best = [x, z]; }
  }
  return best;
}
const AIP = [{ err: .16, react: .7, fireP: .55 }, { err: .08, react: .4, fireP: .8 }, { err: .035, react: .22, fireP: .95 }];
const SUB_THROW = new Set(['bomb', 'sticky', 'slide', 'balloon', 'popper', 'boomer', 'windup', 'dart', 'fog']);
const SP_ATTACK = new Set(['beam', 'missile', 'airdrop', 'fireworks', 'rain', 'turret', 'tornado']);
const SP_SUPPORT = new Set(['barrier', 'armor', 'cloak', 'dash']);
const SP_PAINT = new Set(['tower', 'rain', 'tornado', 'fireworks', 'dash', 'ring']);
function botThink(a, dt) {
  const ai = a.ai || (a.ai = { t: 0, path: null, pi: 0, goal: null, strafe: 1, st: 0, stuckT: 0, lx: a.x, lz: a.z, target: null, seeT: 0, refill: 0, subT: rand(4, 9), spawned: false });
  const P = AIP[SET.diff] || AIP[1], w = a.w;
  const ctl = { mx: 0, mz: 0, dive: false, jump: false, fire: false, dodge: false };
  if (a.dead || G.state !== 'play' || a.sj) return ctl;
  // 復活したら、前にいる味方の所へスーパージャンプすることも
  if (ai.spawned) {
    ai.spawned = false;
    if (Math.random() < .45) {
      const fwd = o => a.team === 1 ? -o.z : o.z;
      const mates = actors.filter(o => o !== a && o.team === a.team && !o.dead && !o.sj && !o.dummy && fwd(o) > fwd(a) + 15).sort((p, q) => fwd(q) - fwd(p));
      if (mates.length) { startSuperJump(a, mates[Math.min(mates.length - 1, Math.floor(Math.random() * 2))]); return ctl; }
    }
  }
  ai.t -= dt; ai.subT -= dt; ai.st -= dt; if (ai.ignoreT > 0) ai.ignoreT -= dt;
  const engage = (w.cls === 'blade' ? Math.max(w.range, w.crange * .85) : (w.range || w.frange || 6)) * (w.cls === 'roller' || w.cls === 'brush' ? 1.6 : 1.15);
  if (ai.t <= 0) {
    ai.t = .25;
    let best = null, bd = 1e9;
    for (const o of actors) {
      if (o.dead || o.team === a.team) continue;
      const d = Math.hypot(o.x - a.x, o.z - a.z);
      if (o.cloakT > 0 && !o.revealed && !(o.markT > 0) && d > 3) continue;
      if (o.swim && !o.revealed && !(o.markT > 0) && d > 3) continue;
      if (d > engage + 8) continue;
      if (!lineOfSight(a.x, a.y + 1.1, a.z, o.x, o.y + .8, o.z)) continue;
      if (d < bd) { bd = d; best = o; }
    }
    if (ai.ignoreT > 0) best = null;   // 動けなくなった直後は、相手より道を優先
    if (best !== ai.target) { ai.target = best; ai.seeT = 0; }
    // 旗とり・ボール運び：ルールで決まる行き先を、1秒ごとに引き直す（動く目標を追う）
    const rg = (G.mode === 'flag' || G.mode === 'ball') ? rulesBotGoal(a) : null;
    ai.rt = (ai.rt || 0) - .25;
    if (rg) {
      if (!ai.rg || ai.rt <= 0 || !ai.path || ai.pi >= ai.path.length) {
        ai.rg = true; ai.rt = carrierOf(a) ? 1.5 : 1; ai.goal = rg; ai.path = findPath(a.x, a.z, rg[0], rg[1], a.team); ai.pi = 0;
      }
    } else {
      if (ai.rg) { ai.rg = false; ai.path = null; }
      if (!ai.goal || !ai.path || ai.pi >= ai.path.length || Math.random() < .02) {
        ai.goal = pickGoal(a); ai.path = ai.goal ? findPath(a.x, a.z, ai.goal[0], ai.goal[1], a.team) : null; ai.pi = 0;
      }
    }
    if (Math.hypot(a.x - ai.lx, a.z - ai.lz) < .15) ai.stuckT += .25; else ai.stuckT = 0;
    ai.lx = a.x; ai.lz = a.z;
    if (ai.stuckT > 1.2) { ai.stuckT = 0; ai.path = null; ai.jumpReq = true; ai.ignoreT = 1.5; }
  }
  const t = ai.target;
  let mx = 0, mz = 0;
  const follow = () => {
    if (!ai.path || ai.pi >= ai.path.length) return;
    let [px, pz] = ai.path[ai.pi];
    while (Math.hypot(px - a.x, pz - a.z) < .8 && ai.pi < ai.path.length - 1) { ai.pi++; [px, pz] = ai.path[ai.pi]; }
    if (Math.hypot(px - a.x, pz - a.z) < .8) ai.pi++;
    const dx = px - a.x, dz = pz - a.z, l = Math.hypot(dx, dz) || 1; mx = dx / l; mz = dz / l;
  };
  const useSp = cats => { if (a.sp >= 1 && cats.has(w.sp) && Math.random() < .04) useSpecial(a); };
  if (t) {
    ai.seeT += dt;
    const dx = t.x - a.x, dz = t.z - a.z, d = Math.hypot(dx, dz) || 1;
    // 先読み：弾がとどくまでの時間だけ、相手の動く先をねらう（遅い弾ほど先を見る）
    const pv = { roller: Math.max(16, (w.frange || 8) * 2), brush: Math.max(16, (w.frange || 5) * 2), blade: d < 6 ? 30 : 24, bucket: w.high ? 9 : 17, hose: w.mist ? 18 : 32 }[w.cls] || w.v || 30;
    const lead = clamp(d / pv, 0, w.cls === 'sniper' ? .4 : .7);
    const ex = t.x + t.vx * lead + (Math.random() - .5) * P.err * d, ez = t.z + t.vz * lead + (Math.random() - .5) * P.err * d, ey = t.y + (t.dive ? .2 : .8) + (Math.random() - .5) * P.err * d * .5;
    a.aimPt = new T.Vector3(ex, ey, ez);
    const from = muzzle(a), dv = a.aimPt.clone().sub(from);
    const wantYaw = Math.atan2(dv.x, dv.z), wantPit = Math.atan2(dv.y, Math.hypot(dv.x, dv.z));
    a.aimYaw += angD(wantYaw - a.aimYaw) * Math.min(1, dt * 10); a.aimPitch += (wantPit - a.aimPitch) * Math.min(1, dt * 10);
    const facing = Math.abs(angD(wantYaw - a.aimYaw)) < .25;
    // 近づいて戦うブキ（ローラー・ハケ・ブレード）は相手のそばまで。ほかは射程の7〜8割の所をたもつ
    const melee = w.cls === 'roller' || w.cls === 'brush' || w.cls === 'blade';
    const prefer = melee ? .5 : w.cls === 'sniper' ? engage * .8 : engage * .7;
    const near = w.cls === 'blade' ? w.range + .4 : (w.frange || 5) * .85;   // 振れば届く距離
    let fx = 0, fz = 0;
    if (d > prefer + 1.5) { fx = dx / d; fz = dz / d; } else if (d < prefer - 2 && !melee) { fx = -dx / d; fz = -dz / d; }
    if (ai.st <= 0) { ai.strafe = Math.random() < .5 ? -1 : 1; ai.st = rand(.6, 1.6); }
    fx += -dz / d * ai.strafe * .7; fz += dx / d * ai.strafe * .7;
    const nx = a.x + fx * 1.2, nz = a.z + fz * 1.2;
    if (!navOk(navOf(nx, nz), a.team) || hAround(nx, nz) > a.y + STEP) { fx = -fx; fz = -fz; ai.strafe *= -1; }
    mx = fx; mz = fz;
    if (melee) {
      // まっすぐではなく、左右にゆれながら近づく（ねらわれにくい）。ブレードはすぐそばでは回りこむ
      const side = d > 5 ? .5 : 0;
      if (w.cls === 'blade' && d < 1.8) { mx = -dz / d * ai.strafe; mz = dx / d * ai.strafe; }
      else { mx = dx / d - dz / d * ai.strafe * side; mz = dz / d + dx / d * ai.strafe * side; }
    }
    // 自分の色の上なら、もぐって泳いで近づく（泳いでいる相手は見つけにくい）
    // （射程の外にいる相手へは、どのブキでも泳いで近づく）
    const charging = a.ws.blade > 0 || a.ws.ch > 0 || a.ws.spin > 0 || a.ws.bow > 0;
    const swimIn = (melee ? d > near : d > engage * .95) && groundTeam(a) === a.team && !carrierOf(a) && !charging;
    if (carrierOf(a)) { mx = mz = 0; follow(); }   // 運んでいる間は、撃ちあうより目的地へ
    else if (ai.rg && roleOf(a) === 0 && (!melee || d > near * 1.6) && d > 3) {   // 攻め役：撃ちながら目的地へ進む（近づいて戦うブキも、相手が遠いうちは目的地へ）
      const sx = mx, sz = mz; mx = mz = 0; follow();
      if (!mx && !mz) { mx = sx; mz = sz; } else { mx += sx * .35; mz += sz * .35; }
    }
    const inRange = d < engage, ready = ai.seeT > P.react && facing && inRange;
    const s = a.ws, tap = !s.prev && !(s.cd > 0);   // 「うつ」を1回だけ押す（押しっぱなしにしない）
    if (swimIn) ctl.dive = true;
    else switch (w.cls) {
      case 'sniper': ctl.fire = ready || (s.ch > 0 && s.ch < 1); if (s.ch >= 1 && ready) ctl.fire = false; if (d < 6 && s.ch > .35) ctl.fire = false; break;
      // ためるブキ：相手を見つけたらすぐためはじめ、ねらえたら放つ（近いときは少しだけためて）
      case 'bow': ctl.fire = (s.bow || 0) < (d < 8 ? .45 : 1) ? true : !ready; break;
      case 'gatling': ctl.fire = s.fireT > 0 ? false : (s.spin || 0) < (d < 8 ? .5 : 1) ? true : !ready; break;
      case 'blade': {
        const b = s.blade || 0;
        if (w.lunge && d > 2.2 && d < 5.5) ctl.fire = !(b >= w.charge + .02 && ready);    // ためて一気につっこむ
        else if (d < near) ctl.fire = ready && !(b > 0) && !(s.cd > 0);                  // すぐそば：連続で切る
        else ctl.fire = !(b >= w.charge + .02 && ai.seeT > P.react && facing && d < w.crange * .9);   // はなれている：ためた刃を飛ばす
        break;
      }
      case 'roller': case 'brush': {
        if (w.cls === 'roller' && d < 2.6) ctl.fire = true;                              // すぐそば：ころがしてひく
        else if (d < near) ctl.fire = ready && tap && !s.rolling;                        // 振ってたたく（何度も）
        else if (w.cls === 'roller' && d < near * 1.4 && ready) {                         // 少し遠い：ジャンプ振りで遠くまで
          if (a.onGround && !s.rolling) ctl.jump = true; else ctl.fire = tap && !a.onGround && a.vy < 2.5;
        } else ctl.fire = d < 16;                                                          // 遠い：ころがして（ハケは走って）近づく
        break;
      }
      case 'hose': ctl.fire = ready; break;
      default: ctl.fire = ready && Math.random() < P.fireP + .2;
    }
    if (w.cls === 'dual' && ready && Math.random() < .02) ctl.dodge = true;
    // サブ
    if (ai.subT <= 0 && a.ink > SUBS[w.sub].ink + 15) {
      if (SUB_THROW.has(w.sub) && d > 4 && d < 16) { ai.subT = rand(5, 10); throwSub(a); }
      else if (w.sub === 'shield' && a.hp < 70) { ai.subT = rand(6, 10); throwSub(a); }
      else if (w.sub === 'mine' && d < 10) { ai.subT = rand(8, 12); throwSub(a); }
    }
    // スペシャル
    if (d < 5 && (w.sp === 'slam' || w.sp === 'ring')) useSp(new Set([w.sp]));
    useSp(SP_ATTACK); useSp(SP_SUPPORT);
  } else {
    follow();
    const dirx = mx || Math.sin(a.aimYaw), dirz = mz || Math.cos(a.aimYaw);
    const ahead = w.cls === 'sniper' ? 10 : clamp((w.range || w.frange || 5) * .6, 3, 9);
    const px = a.x + dirx * ahead, pz = a.z + dirz * ahead;
    a.aimPt = new T.Vector3(px + (Math.random() - .5) * 2, hAt(px, pz), pz + (Math.random() - .5) * 2);
    const wantYaw = Math.atan2(dirx, dirz); a.aimYaw += angD(wantYaw - a.aimYaw) * Math.min(1, dt * 6);
    a.aimPitch += (-.25 - a.aimPitch) * Math.min(1, dt * 4);
    const own = paintAtCell(px, pz) === a.team;
    if (a.ink < 18) ai.refill = 2.2;
    if (ai.refill > 0) { ai.refill -= dt; if (groundTeam(a) === a.team) ctl.dive = true; }
    else {
      const paintWpn = !(w.cls === 'sniper' && !w.wide && Math.random() < .7);
      if (w.cls === 'roller' || w.cls === 'brush') ctl.fire = a.ink > 10;
      else if (paintWpn && !own && a.ink > 25) ctl.fire = w.cls === 'gatling' ? !(a.ws.spin >= .7) && !(a.ws.fireT > 0) : w.cls === 'bow' ? !(a.ws.bow >= .5) : w.cls === 'blade' ? !(a.ws.blade > .05) : w.cls === 'sniper' ? !(a.ws.ch >= .4) : true;
      if (!ctl.fire && groundTeam(a) === a.team && Math.hypot(mx, mz) > .5 && Math.random() < .9) ctl.dive = true;
    }
    useSp(SP_PAINT);
    if (ai.subT <= 0 && a.ink > 70) {
      if (w.sub === 'fountain' || w.sub === 'mine' || w.sub === 'spring') { ai.subT = rand(9, 15); if (w.sub !== 'spring' || Math.random() < .3) throwSub(a); }
      else if (SUB_THROW.has(w.sub) && Math.random() < .15) { ai.subT = rand(8, 14); throwSub(a); }
    }
  }
  const l = Math.hypot(mx, mz);
  if (l > .1) { const nx = a.x + mx / l * .7, nz = a.z + mz / l * .7, h = hAround(nx, nz); if (h > a.y + STEP && h < a.y + 1.1) ai.jumpReq = true; }
  if (ai.jumpReq && a.onGround) { ctl.jump = true; ai.jumpReq = false; }
  ctl.mx = mx; ctl.mz = mz;
  return ctl;
}
