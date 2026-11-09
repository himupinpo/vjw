
// ================= 弾・爆発・ブキ・サブ・スペシャル =================
const PN = 1400;
const projMesh = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), new T.MeshStandardMaterial({ roughness: .18, metalness: .05 }), PN);
projMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); projMesh.frustumCulled = false;
projMesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(PN * 3), 3);
const proj = [], devices = [];
const teamColor = t => G.pal[t - 1] || '#ffffff';
const BOMB_KINDS = new Set(['bomb', 'sticky', 'slide', 'balloon', 'popper', 'pop', 'windupT', 'fogT', 'fountainT']);

const fwdOf = yaw => [Math.sin(yaw), Math.cos(yaw)];
function aimVec(a) { const cp = Math.cos(a.aimPitch); return new T.Vector3(Math.sin(a.aimYaw) * cp, Math.sin(a.aimPitch), Math.cos(a.aimYaw) * cp); }
function muzzle(a, side = 1) {
  const [fx, fz] = fwdOf(a.aimYaw), rx = -fz, rz = fx;
  return new T.Vector3(a.x + rx * .3 * side + fx * .45, a.y + .78, a.z + rz * .3 * side + fz * .45);
}
// ねらう向き：ねらいの点があればそこへ（肩ごしのずれをなくす）
function aimFrom(a, from) {
  if (a.aimPt) { const d = a.aimPt.clone().sub(from); if (d.lengthSq() > .25) return d.normalize(); }
  return aimVec(a);
}
function dirOf(yaw, pit) { const cp = Math.cos(pit); return new T.Vector3(Math.sin(yaw) * cp, Math.sin(pit), Math.cos(yaw) * cp); }
function jitter(dir, deg, vdeg) {
  const yaw = Math.atan2(dir.x, dir.z) + (Math.random() - .5) * deg * Math.PI / 180;
  const pit = Math.asin(clamp(dir.y, -1, 1)) + (Math.random() - .5) * (vdeg ?? deg * .35) * Math.PI / 180;
  return dirOf(yaw, pit);
}
function shoot(o) { const p = Object.assign({ t: 0, life: 3, g: 28, straight: 0, trail: 0, trailR: .3, td: 0, size: .11, hitR: .3, pierce: false, kind: 'shot', hits: null, bounce: 0 }, o); proj.push(p); return p; }
function noInk(a) { if (a === G.me) G.inkWarn = 1; }
function useInk(a, n) { if (a.dashT > 0) return true; if (a.ink < n) { noInk(a); return false; } a.ink -= n; a.inkT = 0; return true; }
function reveal(a, t = 1.2) { a.revealed = true; a.revealT = Math.max(a.revealT || 0, t); }

// ぬってスペシャルをためる
function gainSp(owner, n) { if (owner && n > 0) { owner.painted += n; if (!owner.spOn && !owner.dead) owner.sp = Math.min(1, owner.sp + n / SPECIALS[owner.w.sp].cost); } }
function paintBy(owner, x, y, z, r, team) { const n = paintCircle(x, y, z, r, team); gainSp(owner, n); return n; }
function paintWall(owner, ox, oy, oz, x, y, z, r, team) { const n = paintWallHit(ox, oy, oz, x, y, z, r, team); if (owner && n) gainSp(owner, n * CS * CS * .25); return n; }

// ---------- 当たり ----------
function actorHit(a, x, y, z, r) {
  if (a.dead) return false;
  const top = a.dive ? .45 : 1.35, rad = (a.dive ? .55 : .42) + r;
  if (y < a.y - .15 - r || y > a.y + top + r) return false;
  const dx = x - a.x, dz = z - a.z; return dx * dx + dz * dz < rad * rad;
}
function findHit(p, ox, oy, oz) {
  for (const a of actors) {
    if (a.dead || a.team === p.team) continue;
    if (p.hits && p.hits.has(a)) continue;
    for (let k = 1; k <= 3; k++) { const t = k / 3; if (actorHit(a, lerp(ox, p.x, t), lerp(oy, p.y, t), lerp(oz, p.z, t), p.hitR)) return a; }
  }
  return null;
}
// 盾・パラソル・バリアでふせぐ
function blocked(p, ox, oz) {
  for (const d of devices) {
    if (d.team === p.team || d.dead) continue;
    if (d.kind === 'barrier') { const dx = p.x - d.x, dy = p.y - (d.y + 1), dz = p.z - d.z; if (dx * dx + dy * dy + dz * dz < d.r * d.r) return d; }
    if (d.kind === 'shield') {
      const [fx, fz] = fwdOf(d.yaw), s0 = (ox - d.x) * fx + (oz - d.z) * fz, s1 = (p.x - d.x) * fx + (p.z - d.z) * fz;
      if (s0 * s1 <= 0 && p.y < d.y + 2.3 && p.y > d.y - .2) { const lat = (p.x - d.x) * -fz + (p.z - d.z) * fx; if (Math.abs(lat) < 1.6) { d.hp -= p.dmg || 20; return d; } }
    }
  }
  for (const a of actors) {
    if (a.dead || a.team === p.team || a.w.cls !== 'parasol' || !a.ws.open || a.ws.broken > 0) continue;
    const dx = p.x - a.x, dz = p.z - a.z, d2 = dx * dx + dz * dz;
    if (d2 > 1.5 || p.y < a.y || p.y > a.y + 1.9) continue;
    const [fx, fz] = fwdOf(a.aimYaw); if ((dx * fx + dz * fz) / Math.sqrt(d2 + 1e-6) < .25) continue;
    a.ws.shp = (a.ws.shp ?? a.w.shield) - (p.dmg || 20); a.ws.shitT = 0;
    if (a.ws.shp <= 0) { a.ws.broken = a.w.regen ? 3 : 6; a.ws.shp = a.w.shield; burst(a.x, a.y + 1, a.z, a.team, 18, 1); }
    return a;
  }
  return null;
}
function inBarrier(a) { for (const d of devices) if (d.kind === 'barrier' && !d.dead && d.team === a.team) { const dx = a.x - d.x, dz = a.z - d.z; if (dx * dx + dz * dz < d.r * d.r) return true; } return false; }

// ---------- 爆発 ----------
function explode(x, y, z, r, dmax, dmin, team, owner, pr) {
  for (const a of actors) {
    if (a.dead || a.team === team) continue;
    const dx = a.x - x, dy = (a.y + .6) - y, dz = a.z - z, d = Math.hypot(dx, dy, dz);
    if (d > r + .4) continue;
    if (!lineOfSight(x, y + .3, z, a.x, a.y + .8, a.z)) continue;
    hurt(a, lerp(dmax, dmin, clamp(d / r, 0, 1)), owner, 'boom');
  }
  for (const d of devices) if (d.team !== team && d.hp && Math.hypot(d.x - x, d.z - z) < r + .5) d.hp -= dmax;
  const R = pr ?? r;
  paintBy(owner, x, y + .3, z, R, team);
  // 破裂のふちに飛びちるしずく
  for (let k = 0, n = Math.round(4 + R * 2); k < n; k++) { const ang = k / n * TAU + Math.random() * .6, d = R * rand(.95, 1.35); paintBy(owner, x + Math.cos(ang) * d, y + .3, z + Math.sin(ang) * d, R * rand(.12, .22), team); }
  paintWallsNear(x, y + .3, z, R * .9, team);
  burst(x, y + .3, z, team, 24, 1.2);
  if (R >= 2) ringFx(x, Math.max(hAt(x, z), y - 1.2), z, team, R * 1.25, .35);
  const near = G.me ? Math.hypot(G.me.x - x, G.me.z - z) : 99;
  if (near < 45) AU.boom(r > 3 ? 1.5 : 1, clamp(1 - near / 45, .1, 1));
  if (near < r * 2.5) G.shake = Math.max(G.shake, .25 * (1 - near / (r * 2.5)));
}

// ---------- 弾を進める ----------
function landPaint(p, ox, oy, oz, gh) {
  const wall = gh > oy + .1;
  if (wall) {
    paintWall(p.owner, ox, oy, oz, p.x, p.y, p.z, p.pr * .95, p.team);
    paintBy(p.owner, ox, hAt(ox, oz) + .2, oz, p.pr * .45, p.team);
  } else {
    paintBy(p.owner, p.x, gh + .2, p.z, p.pr, p.team);
    // とびちり：着地点のまわりに小さなしずく（進む向きに多め）
    if (p.pr >= .5) {
      const sp = Math.hypot(p.vx, p.vz) || 1, ux = p.vx / sp, uz = p.vz / sp, n = p.pr > 1.2 ? 4 : Math.random() < .7 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const fwd = rand(.2, 1.1) * p.pr * 1.4, side = rand(-.9, .9) * p.pr;
        paintBy(p.owner, p.x + ux * fwd - uz * side, gh + .2, p.z + uz * fwd + ux * side, p.pr * rand(.22, .38), p.team);
      }
    }
    if (p.swirl) for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; paintBy(p.owner, p.x + Math.cos(a) * 2.1, gh + .2, p.z + Math.sin(a) * 2.1, .6, p.team); }
  }
  if (p.size > .1 && Math.random() < .5) burst(wall ? ox : p.x, (wall ? oy : gh) + .05, wall ? oz : p.z, p.team, 3, .35);
}
// 山なりに投げて、水平距離 R・高さの差 dh（投げる所が上なら＋）の所に落ちる速さ
function lobSpeed(R, th, dh, g) { const c = Math.cos(th), den = 2 * c * c * (R * Math.tan(th) + dh); return den > .1 ? Math.sqrt(g * R * R / den) : 18; }
// バケツの着地のしぶき：落ちた所のすぐそばの相手にも少しダメージ
function splashHurt(p, x, y, z, r, dmg) { for (const o of actors) { if (o.dead || o.team === p.team) continue; if (Math.hypot(o.x - x, o.z - z) < r && Math.abs(o.y - y) < 1.6) hurt(o, dmg, p.owner, 'splash'); } }
function stepProj(dt) {
  for (let i = proj.length - 1; i >= 0; i--) {
    const p = proj[i];
    if (p.wait > 0) { p.wait -= dt; continue; }
    p.t += dt;
    if (BOMB_KINDS.has(p.kind)) { if (stepBomb(p, dt)) proj.splice(i, 1); continue; }
    const ox = p.x, oy = p.y, oz = p.z;
    // ブーメラン：曲がって飛び、手もとへもどる
    if (p.kind === 'boomer' || p.back) {
      const o = p.owner;
      if (p.kind === 'boomer' && !p.back) { const a = p.curve * dt, c = Math.cos(a), s = Math.sin(a), vx = p.vx * c - p.vz * s; p.vz = p.vx * s + p.vz * c; p.vx = vx; if (p.t > .85) { p.back = true; p.hits = new Set(); } }
      if (p.back) {
        if (!o || o.dead) { proj.splice(i, 1); continue; }
        const dx = o.x - p.x, dy = o.y + .9 - p.y, dz = o.z - p.z, L = Math.hypot(dx, dy, dz);
        if (L < 1.1 || p.t > 3) { proj.splice(i, 1); continue; }
        const sp = p.kind === 'boomer' ? 15 : 22; p.vx = dx / L * sp; p.vy = dy / L * sp; p.vz = dz / L * sp;
      }
    } else if (p.t > p.straight) p.vy -= p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.kind === 'boomer') { const gh = hAround(p.x, p.z, .2); if (gh > -5) p.y = Math.max(p.y, gh + .7); }
    // ころがるペンキ（床に沿って進む）
    if (p.kind === 'rollblob') {
      const gh = hAt(p.x, p.z);
      if (gh > oy + .45 || gh < -5 || p.t > p.life) { if (gh > oy + .45) paintWall(p.owner, ox, oy, oz, p.x, oy, p.z, .7, p.team); proj.splice(i, 1); continue; }
      p.y = gh + .15;
    }
    // 通ったあとにぽたぽた
    if (p.trail > 0) {
      p.td += Math.hypot(p.x - ox, p.z - oz);
      if (p.td >= p.trail) { p.td = 0; const gh = hAt(p.x, p.z); if (p.y - gh < 3) paintBy(p.owner, p.x, gh + .2, p.z, p.trailR, p.team); }
    }
    if (blocked(p, ox, oz)) { burst(p.x, p.y, p.z, p.team, 3, .4); proj.splice(i, 1); continue; }
    const hit = findHit(p, ox, oy, oz);
    if (hit) {
      // まっすぐ飛ぶ距離をこえて落ちていく弾は、ダメージが下がる（最低5割）
      const fall = p.fall ? clamp(1 - Math.max(0, p.t - p.straight) * 1.6, .5, 1) : 1;
      hurt(hit, p.dmg * fall, p.owner, p.kind); burst(p.x, p.y, p.z, p.team, 4, .5);
      if (p.knock) { const l = Math.hypot(p.vx, p.vz) || 1; hit.vx += p.vx / l * p.knock * 6; hit.vz += p.vz / l * p.knock * 6; }
      if (p.kind === 'blast') { explode(p.x, p.y, p.z, p.er, p.sdmg, p.sdmg * .5, p.team, p.owner, p.pr); proj.splice(i, 1); continue; }
      if (p.kind === 'dart') { markAround(p.x, p.z, p.team); }
      if (p.pierce) { (p.hits || (p.hits = new Set())).add(hit); }
      else { paintBy(p.owner, hit.x, hit.y + .2, hit.z, p.pr * .7, p.team); proj.splice(i, 1); continue; }
    }
    for (const d of devices) if (d.hp && d.team !== p.team && !d.dead && Math.hypot(d.x - p.x, d.z - p.z) < .7 && Math.abs(d.y + .4 - p.y) < 1) { d.hp -= p.dmg; if (!p.pierce) { p.t = 1e9; } }
    if (p.t > 1e8) { proj.splice(i, 1); continue; }
    const gh = hAt(p.x, p.z);
    if (p.y <= gh && p.kind !== 'rollblob') {
      const wall = gh > oy + .1;
      if (p.bounce > 0) {
        p.bounce--; p.straight = 0; p.fall = false; p.dmg *= .75;
        if (wall) { const cx = hAt(ox, p.z) > oy + .1, cz = hAt(p.x, oz) > oy + .1; p.x = ox; p.y = oy; p.z = oz; if (cx || !cz) p.vx *= -.6; if (cz || !cx) p.vz *= -.6; paintWall(p.owner, ox, oy, oz, ox + p.vx * -dt * 2, oy, oz + p.vz * -dt * 2, p.pr * .6, p.team); }
        else { p.y = gh + .02; p.vy = Math.abs(p.vy) * .45 + 1.5; p.vx *= .7; p.vz *= .7; paintBy(p.owner, p.x, gh + .2, p.z, p.pr * .6, p.team); }
        continue;
      }
      if (p.pom && !p.bounced) { p.bounced = true; p.fuse = .3; p.y = gh + .05; p.vy = Math.abs(p.vy) * .5; p.vx *= .6; p.vz *= .6; if (wall) { p.x = ox; p.z = oz; } continue; }
      if (p.kind === 'blast') { if (wall) explode(ox, oy, oz, p.er, p.sdmg, p.sdmg * .5, p.team, p.owner, p.pr); else explode(p.x, gh, p.z, p.er, p.sdmg, p.sdmg * .5, p.team, p.owner, p.pr); proj.splice(i, 1); continue; }
      if (p.kind === 'arrowX') { p.x = ox; p.z = oz; p.y = Math.max(gh, oy); p.vx = p.vy = p.vz = 0; p.kind = 'stuck'; p.fuse = .45; landPaint(p, ox, oy, oz, gh); continue; }
      if (p.kind === 'dart') { markAround(p.x, p.z, p.team); paintBy(p.owner, p.x, gh + .2, p.z, .8, p.team); proj.splice(i, 1); continue; }
      if (p.roll && !wall) {
        landPaint(p, ox, oy, oz, gh);
        const l = Math.hypot(p.vx, p.vz) || 1; p.vx = p.vx / l * 7; p.vz = p.vz / l * 7; p.vy = 0; p.y = gh + .15;
        Object.assign(p, { kind: 'rollblob', roll: false, life: p.t + .8, trail: .3, trailR: .55, pierce: true, dmg: 40, hitR: .35 }); continue;
      }
      landPaint(p, ox, oy, oz, gh);
      if (p.splash) splashHurt(p, wall ? ox : p.x, Math.max(gh, oy - .5), wall ? oz : p.z, p.splash, p.dmg * .6);
      proj.splice(i, 1); continue;
    }
    if (p.kind === 'blast' && p.airBurst !== false && p.t >= p.straight) {
      explode(p.x, p.y, p.z, p.er, p.sdmg, p.sdmg * .5, p.team, p.owner, p.pr * .8); paintBy(p.owner, p.x, hAt(p.x, p.z) + .2, p.z, p.pr * .7, p.team);
      if (p.cluster) for (let k = 0; k < p.cluster; k++) { const a = k / p.cluster * TAU + Math.random() * .5; shoot({ kind: 'blast', airBurst: false, x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 5 + p.vx * .2, vy: 3, vz: Math.sin(a) * 5 + p.vz * .2, g: 20, team: p.team, owner: p.owner, dmg: 60, sdmg: p.sdmg * .8, er: 1.5, pr: 1.3, size: .14, life: 2 }); }
      proj.splice(i, 1); continue;
    }
    if (p.pom && p.bounced) { p.fuse -= dt; if (p.fuse <= 0) { explode(p.x, p.y, p.z, p.er, p.sdmg, p.sdmg * .5, p.team, p.owner, p.pr); proj.splice(i, 1); continue; } }
    if (p.kind === 'stuck') { p.fuse -= dt; if (p.fuse <= 0) { explode(p.x, p.y, p.z, 1.2, 30, 15, p.team, p.owner, 1.1); proj.splice(i, 1); } continue; }
    if (p.ret && !p.back && p.t >= p.straight) { p.back = true; p.hits = new Set(); }
    if (p.t > p.life || p.y < -6) proj.splice(i, 1);
  }
}
function markAround(x, z, team) {
  for (const o of actors) if (!o.dead && o.team !== team && Math.hypot(o.x - x, o.z - z) < 3.4) { o.markT = 8; burst(o.x, o.y + 1.2, o.z, team, 6, .4); }
}
// 爆弾：はねる・くっつく・すべる・割れる・分かれる
function stepBomb(p, dt) {
  const ox = p.x, oy = p.y, oz = p.z;
  if (!p.stuck) {
    p.vy -= 20 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.kind === 'balloon') { const h = findHit(p, ox, oy, oz); if (h) { const s = SUB_FX.balloon; explode(p.x, p.y, p.z, s.r, s.dmax, s.dmin, p.team, p.owner, s.pr); return true; } }
    const gh = hAt(p.x, p.z);
    if (p.y <= gh + p.size) {
      const wall = gh > oy + .15;
      if (p.kind === 'balloon') { const s = SUB_FX.balloon; if (wall) { p.x = ox; p.y = oy; p.z = oz; } explode(p.x, Math.max(p.y, gh), p.z, s.r, s.dmax, s.dmin, p.team, p.owner, s.pr); return true; }
      if (p.kind === 'popper') { for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + Math.random(); shoot({ kind: 'pop', x: wall ? ox : p.x, y: Math.max(gh, oy) + .2, z: wall ? oz : p.z, vx: Math.cos(a) * rand(3, 5), vy: 4.5, vz: Math.sin(a) * rand(3, 5), team: p.team, owner: p.owner, size: .12, fuse: .55 + k * .12 }); } return true; }
      if (p.kind === 'windupT' || p.kind === 'fogT' || p.kind === 'fountainT') {
        const x = wall ? ox : p.x, z = wall ? oz : p.z;
        if (p.kind === 'windupT') addDevice({ kind: 'walker', team: p.team, owner: p.owner, x, z, life: 5.5, hp: 50 });
        if (p.kind === 'fogT') addDevice({ kind: 'fog', team: p.team, owner: p.owner, x, z, life: 5, r: 3.2 });
        if (p.kind === 'fountainT') addDevice({ kind: 'fountain', team: p.team, owner: p.owner, x, z, life: 9, hp: 60 });
        return true;
      }
      if (p.kind === 'sticky') { p.stuck = true; if (wall) { p.x = ox; p.z = oz; p.y = Math.max(oy, hAt(ox, oz) + p.size); } else p.y = gh + p.size; p.vx = p.vy = p.vz = 0; }
      else if (wall) { p.x = ox; p.z = oz; p.vx *= -.4; p.vz *= -.4; }
      else if (p.kind === 'slide') { p.y = gh + p.size; p.vy = 0; p.ground = true; }
      else { p.y = gh + p.size; p.vy = Math.abs(p.vy) > 3 ? -p.vy * .3 : 0; p.vx *= .6; p.vz *= .6; p.ground = true; }
    }
    if (p.kind === 'slide' && p.ground) {
      const f = Math.max(0, 1 - dt * .45); p.vx *= f; p.vz *= f;
      p.td += Math.hypot(p.x - ox, p.z - oz); if (p.td > .35) { p.td = 0; paintBy(p.owner, p.x, hAt(p.x, p.z) + .2, p.z, .55, p.team); }
    }
  }
  if (p.y < -6) return true;
  if ((p.kind === 'bomb' && p.ground) || p.kind !== 'bomb') p.fuse -= dt;
  if (p.fuse <= 0) { const s = SUB_FX[p.kind]; if (s) explode(p.x, p.y, p.z, s.r, s.dmax, s.dmin, p.team, p.owner, s.pr); return true; }
  return false;
}
const SUB_FX = {
  bomb: { r: 2.6, dmax: 180, dmin: 30, pr: 2.7 }, sticky: { r: 3.3, dmax: 200, dmin: 40, pr: 3.3 }, slide: { r: 2.3, dmax: 160, dmin: 30, pr: 2.4 },
  mine: { r: 2.6, dmax: 180, dmin: 40, pr: 2.8 }, balloon: { r: 1.7, dmax: 60, dmin: 25, pr: 1.9 }, pop: { r: 1.3, dmax: 50, dmin: 20, pr: 1.4 },
  walker: { r: 2.3, dmax: 170, dmin: 30, pr: 2.5 }
};

// ---------- 弾の見た目 ----------
const _pm = new T.Matrix4(), _pc = new T.Color(), _pq = new T.Quaternion(), _pv = new T.Vector3(), _ps = new T.Vector3(), _pe = new T.Euler();
function drawProj() {
  let n = 0;
  for (const p of proj) {
    if (n >= PN) break; if (p.wait > 0) continue;
    const s = p.size; let sx = s, sy = s, sz = s;
    if (p.kind === 'boomer') { sx = sz = s; sy = s * .3; _pe.set(0, p.t * 18, 0); }
    else if (!BOMB_KINDS.has(p.kind)) { const sp = Math.hypot(p.vx, p.vy, p.vz); if (sp > 1) sz = s * (1 + Math.min(2.2, sp * .04)); _pe.set(Math.atan2(-p.vy, Math.hypot(p.vx, p.vz)), Math.atan2(p.vx, p.vz), 0, 'YXZ'); }
    else _pe.set(0, 0, 0);
    _pq.setFromEuler(_pe);
    _pm.compose(_pv.set(p.x, p.y, p.z), _pq, _ps.set(sx, sy, sz));
    projMesh.setMatrixAt(n, _pm); _pc.set(teamColor(p.team));
    if (BOMB_KINDS.has(p.kind)) _pc.multiplyScalar(.6 + .4 * Math.abs(Math.sin(p.t * 14)));
    projMesh.setColorAt(n, _pc); n++;
  }
  projMesh.count = n; projMesh.instanceMatrix.needsUpdate = true; if (projMesh.instanceColor) projMesh.instanceColor.needsUpdate = true;
}

// ---------- 線（スナイパーのねらい・弾道） ----------
const tracers = [];
function tracer(a, b, team, life = .25, width = .07) {
  const d = b.clone().sub(a), L = d.length(); if (L < .01) return;
  const m = new T.Mesh(new T.CylinderGeometry(width, width, L, 6, 1, true), new T.MeshBasicMaterial({ color: teamColor(team), transparent: true, opacity: .9 }));
  m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  scene.add(m); tracers.push({ m, life, max: life });
}
function updTracers(dt) { for (let i = tracers.length - 1; i >= 0; i--) { const t = tracers[i]; t.life -= dt; t.m.material.opacity = Math.max(0, t.life / t.max) * .9; if (t.life <= 0) { scene.remove(t.m); t.m.geometry.dispose(); t.m.material.dispose(); tracers.splice(i, 1); } } }
const laser = new T.Mesh(new T.CylinderGeometry(.018, .018, 1, 5, 1, true), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .75 }));
laser.visible = false;

// 一直線（スナイパー・メガ噴射）：最初に当たった相手まで（pierce ならつらぬく）。ぬりは線の下と、当たった壁
function hitscan(a, from, dir, range, dmg, pr, team, every = .55, pierce = false, hitR = .55) {
  const dGround = rayGround(from.x, from.y, from.z, dir.x, dir.y, dir.z, range, .15);
  let end = dGround, victim = null;
  if (!pierce) { const bar = blockAlong(from, dir, end, team); if (bar) end = bar.t; }
  for (const o of actors) {
    if (o.dead || o.team === team) continue;
    const cx = o.x - from.x, cy = (o.y + (o.dive ? .2 : .7)) - from.y, cz = o.z - from.z;
    const t = cx * dir.x + cy * dir.y + cz * dir.z; if (t < 0 || t > end) continue;
    const px = cx - dir.x * t, py = cy - dir.y * t, pz = cz - dir.z * t, r = (o.dive ? .6 : .55) * hitR / .55;
    if (px * px + (py * py) * .5 + pz * pz < r * r) { if (pierce) hurt(o, dmg, a, 'line'); else { end = t; victim = o; } }
  }
  for (const d of devices) if (d.hp && d.team !== team && !d.dead) { const cx = d.x - from.x, cz = d.z - from.z, t = cx * dir.x + cz * dir.z; if (t > 0 && t < end && Math.hypot(cx - dir.x * t, cz - dir.z * t) < .7) d.hp -= dmg; }
  if (victim) hurt(victim, dmg, a, 'line');
  for (let s = 1.2; s < end; s += every) {
    const x = from.x + dir.x * s, y = from.y + dir.y * s, z = from.z + dir.z * s, gh = hAt(x, z);
    if (y - gh < 2.2) paintBy(a, x, gh + .2, z, pr, team);
  }
  const ex = from.x + dir.x * end, ey = from.y + dir.y * end, ez = from.z + dir.z * end;
  if (end < range - .1 && !victim) {
    const bx = ex - dir.x * .3, bz = ez - dir.z * .3, by = ey - dir.y * .3;
    if (hAt(ex + dir.x * .3, ez + dir.z * .3) > ey) paintWall(a, bx, by, bz, ex + dir.x * .4, ey, ez + dir.z * .4, pr * 1.6, team);
  }
  paintBy(a, ex, Math.max(hAt(ex, ez), ey - 1) + .3, ez, pr * 1.7, team);
  return new T.Vector3(ex, ey, ez);
}
function blockAlong(from, dir, end, team) {
  for (const d of devices) {
    if (d.team === team || d.dead) continue;
    if (d.kind === 'shield') {
      const [fx, fz] = fwdOf(d.yaw), den = dir.x * fx + dir.z * fz; if (Math.abs(den) < 1e-3) continue;
      const t = ((d.x - from.x) * fx + (d.z - from.z) * fz) / den; if (t < 0 || t > end) continue;
      const x = from.x + dir.x * t, z = from.z + dir.z * t, y = from.y + dir.y * t, lat = (x - d.x) * -fz + (z - d.z) * fx;
      if (Math.abs(lat) < 1.6 && y < d.y + 2.3 && y > d.y - .2) { d.hp -= 120; return { t }; }
    }
    if (d.kind === 'barrier') { const cx = d.x - from.x, cy = d.y + 1 - from.y, cz = d.z - from.z, t = cx * dir.x + cy * dir.y + cz * dir.z; const q = cx * cx + cy * cy + cz * cz - t * t; if (q < d.r * d.r && t > 0) { const tt = t - Math.sqrt(d.r * d.r - q); if (tt < end && tt > 0) return { t: tt }; } }
  }
  return null;
}

// ================= ブキごとの動き =================
// fire：押している、dodge：二丁拳銃のスライドの合図、mx/mz：動いている向き
function weaponTick(a, dt, fire, dodge, mx, mz) {
  if (fire && !ruleCanFire(a)) fire = false;   // ボールを持っている間は撃てない
  const w = a.w, s = a.ws, press = fire && !s.prev, release = !fire && s.prev;
  s.prev = fire; s.cd = Math.max(0, (s.cd || 0) - dt); s.busy = 0; s.open = false;
  if (s.broken > 0) s.broken -= dt;
  if (a.dead || a.sj) return;
  const stop = a.dive || (a.spOn && (a.spOn.kind === 'beam' || a.spOn.kind === 'slam'));
  if (stop) {
    // ためキープ：ためている途中で「うつ」を押したままもぐると、少しの間ためたままにできる（スナイパー・ガトリング・ボウ）
    const held = w.cls === 'sniper' ? s.ch > .05 : w.cls === 'gatling' ? s.spin > .05 && !(s.fireT > 0) : w.cls === 'bow' ? s.bow > .05 : false;
    if (held && a.dive && fire) { s.keepT = (s.keepT || 0) + dt; if (s.keepT < keepTime(w)) { s.kept = true; return; } }
    s.ch = 0; s.spin = 0; s.rolling = false; s.fireT = 0; s.bow = 0; s.blade = 0; s.held = 0; s.keepT = 0; s.kept = false; return;
  }
  s.keepT = 0; s.kept = false;
  const from = muzzle(a), aim = () => aimFrom(a, from), cls = w.cls;
  const air = !a.onGround;
  const spreadMul = (air ? (w.air ? .1 : 1.8) : 1) * (s.focus > 0 ? .45 : 1);
  if (s.focus > 0) s.focus -= dt;
  const gunShot = (dir, side = 1, extra = {}) => {
    const f = side === 1 ? from : muzzle(a, -1), v = w.v || 30;
    for (let c = 0; c < (w.cone || 1); c++) {
      const d = jitter(dir, (w.spread || 3) * spreadMul);
      shoot(Object.assign({ x: f.x, y: f.y, z: f.z, vx: d.x * v, vy: d.y * v, vz: d.z * v, straight: w.range / v, team: a.team, owner: a, dmg: w.dmg * (air && w.air ? 1.25 : 1), pr: w.pr, trail: w.trail || 1.1, trailR: w.pr * .5, life: 2.5, bounce: w.bounce || 0, knock: w.knock || 0, fall: true }, extra));
    }
  };
  switch (cls) {
    case 'gun': case 'dual': {
      if (cls === 'dual') {
        s.rolls = s.rolls ?? w.rolls; s.rollCd = Math.max(0, (s.rollCd || 0) - dt);
        if (!fire && s.rollCd <= 0) s.rolls = w.rolls;
        if (dodge && fire && s.rolls > 0 && Math.hypot(mx, mz) > .2 && a.onGround && useInk(a, 6)) {
          const len = w.rollLen || 1, l = Math.hypot(mx, mz);
          s.rolls--; s.rollCd = 1; a.vx = mx / l * 12; a.vz = mz / l * 12; a.slideT = .28 * len; s.focus = .8;
          paintBy(a, a.x, a.y + .2, a.z, 1.0, a.team); burst(a.x, a.y + .3, a.z, a.team, 8, .6); AU.dive();
        }
      }
      if (fire) {
        s.busy = cls === 'dual' ? .12 : .2; s.held = (s.held || 0) + dt;
        if (s.cd <= 0) {
          if (useInk(a, w.ink * (w.burst || 1))) {
            const rate = w.ramp ? lerp(4, w.rate, clamp(s.held / w.ramp, 0, 1)) : w.rate;
            s.cd += 1 / rate; const dir = aim();
            if (w.burst) { for (let k = 0; k < w.burst; k++) { const n0 = proj.length; gunShot(dir, cls === 'dual' ? (k % 2 ? -1 : 1) : 1); for (let q = n0; q < proj.length; q++) proj[q].wait = k * .07; } }
            else if (cls === 'dual') { s.side = -(s.side || 1); gunShot(dir, s.side); }
            else gunShot(dir);
            sfx(a, 'gun');
          } else s.cd = .15;
        }
      } else s.held = 0;
      break;
    }
    case 'cannon':
      if (fire) s.busy = .35;
      if (fire && s.cd <= 0) {
        if (useInk(a, w.ink)) {
          s.cd = 1 / w.rate; const d = aim(), v = w.v;
          const yaws = w.triple ? [-.12, 0, .12] : [0];
          for (const o of yaws) {
            const base = Math.atan2(d.x, d.z) + o, pit = Math.asin(clamp(d.y, -1, 1)) + (w.pom ? .28 : 0), dd = dirOf(base, pit);
            shoot({ kind: 'blast', x: from.x, y: from.y, z: from.z, vx: dd.x * v, vy: dd.y * v, vz: dd.z * v, straight: w.pom ? 0 : w.range / v, g: w.pom ? 18 : 28, airBurst: !w.pom, pom: !!w.pom,
              team: a.team, owner: a, dmg: w.dmg, sdmg: w.sdmg, er: w.er, pr: w.pr, size: w.er > 3 ? .3 : .22, hitR: .35, trail: 1.6, trailR: .35, cluster: w.cluster || 0, life: 4 });
          }
          sfx(a, 'blaster');
        } else s.cd = .2;
      }
      break;
    case 'roller': case 'brush': {
      const brush = cls === 'brush';
      if (press && s.cd <= 0 && !s.rolling) {
        if (useInk(a, w.ink)) {
          s.cd = 1 / w.frate; s.flickT = brush ? .1 : .32; const d = aim();
          // ジャンプ振りは、頭の上から大きく振り下ろす（とびはね系は宙返り、ゾウは重いたたきつけ）
          s.swing = air ? { t: 0, dur: brush ? .3 : w.id === 'elephant' ? .55 : .45, kind: w.airFlick ? 'flip' : w.id === 'elephant' ? 'slam' : 'over' } : { t: 0, dur: brush ? .2 : .36, kind: 'down' };
          // ジャンプ振り：空中で振ると、はばはせまくなるが遠くまで届く（とびはね系はもっと遠く）
          const vert = w.vflick || (w.airFlick && air), n = w.flick, base = Math.atan2(d.x, d.z), up = clamp(Math.asin(d.y), -.3, .5);
          const fr = w.frange * (air ? (w.airFlick ? 1.9 : 1.45) : 1);
          for (let k = 0; k < n; k++) {
            let yaw = base, pit = up + .15, v = fr * 1.6, straight = .08, g = 18;
            // たて振り：遠くまで一直線（まっすぐ飛ぶ時間を長めに）／床をはう波：低く出して順に着地
            if (vert) { pit = up + .05 + k * .012; v = fr * (.55 + .5 * k / n) * 1.25; straight = .22; g = 26; yaw += (Math.random() - .5) * .05; }
            else if (air) { yaw += (k / Math.max(1, n - 1) - .5) * w.fspread * .28 * Math.PI / 180 + (Math.random() - .5) * .03; pit = up + .1 + (k % 3) * .035; v = fr * (1.02 + .22 * ((k * 7) % 5) / 4); straight = .16; g = 22; }
            else if (w.wave) { pit = up + .03; v = fr * (.35 + .65 * k / Math.max(1, n - 1)) * 1.3; straight = .14; g = 26; yaw += (Math.random() - .5) * w.fspread * Math.PI / 180; }
            else {   // 横振り：速く低く飛んで、射程の8〜10割まで届く（短いブキほど重く速いしぶきで、すぐ落ちる）
              const v0 = Math.max(fr * 2, 16), T = fr * .95 / v0;
              yaw += (k / Math.max(1, n - 1) - .5) * w.fspread * Math.PI / 180 + (Math.random() - .5) * .04; pit = up + .1; v = v0 * rand(.85, 1.05); straight = .1; g = 2 * (.78 + .1 * v0 * T) / Math.max(.01, (T - .1) ** 2);
            }
            const dd = dirOf(yaw, pit);
            shoot({ x: from.x, y: from.y, z: from.z, vx: dd.x * v, vy: dd.y * v, vz: dd.z * v, straight, g, team: a.team, owner: a, dmg: w.fdmg / (brush ? 1.25 : 3.1), pr: brush ? .5 : .75, size: brush ? .1 : .16, hitR: w.wave ? .45 : brush ? .36 : .4, trail: 1.3, trailR: .32, life: 1.6 });
          }
          sfx(a, cls);
        }
      }
      if (s.flickT > 0) s.flickT -= dt;
      if (fire && !(s.flickT > 0) && !press) s.rolling = true;
      if (!fire) { s.rolling = false; s.rollT = 0; }
      if (s.rolling && a.onGround) {   // 空中ではころがしてもぬれない
        const sp = a.moveSpd;
        if (sp > .6) {
          if (!useInk(a, w.rollInk * dt * clamp(sp / 4, .3, 1.5))) { s.rolling = false; break; }
          s.rollT = (s.rollT || 0) + dt; s.rollMul = w.turbo ? 1 + clamp(s.rollT - 1, 0, 1) * .45 : 1;
          const [fx, fz] = fwdOf(a.yaw), hx = a.x + fx * .85, hz = a.z + fz * .85;
          paintBy(a, hx, a.y + .2, hz, w.width / 2, a.team);
          s.rollHit = s.rollHit || new Map();
          for (const o of actors) {
            if (o.dead || o.team === a.team) continue;
            if (Math.hypot(o.x - hx, o.z - hz) < w.width / 2 + .35 && Math.abs(o.y - a.y) < 1.2) {
              const last = s.rollHit.get(o) || 0; if (clock - last > .35) { s.rollHit.set(o, clock); hurt(o, brush ? 30 : (w.rollDmg || 140), a, 'roll'); }
            }
          }
        } else s.rollT = 0;
      }
      break;
    }
    case 'sniper': {
      if (fire) {
        const need = w.ink * .3;
        if (!s.ch) { if (a.ink < need) { noInk(a); break; } }
        s.ch = Math.min(1, (s.ch || 0) + dt / w.charge); s.busy = .55;
      }
      if (release && s.ch > 0) {
        const c = s.ch; s.ch = 0;
        const cost = w.ink * (.3 + .7 * c);
        if (a.ink < cost * .6 && !(a.dashT > 0)) { noInk(a); break; }
        if (!(a.dashT > 0)) { a.ink = Math.max(0, a.ink - cost); a.inkT = 0; }
        const d = aim(), range = w.range * (.5 + .5 * c), dmg = c >= 1 ? w.dmg : lerp(w.mindmg, w.dmg * .7, c);
        const end = hitscan(a, from, d, range, dmg, w.pr * (.7 + .5 * c) * (w.wide ? 1.3 : 1), a.team, .5, !!w.pierce, w.wide ? .9 : .55);
        tracer(from, end, a.team, .3, (.05 + c * .05) * (w.wide ? 2 : 1));
        sfx(a, 'charger');
      }
      break;
    }
    case 'bucket':
      if (fire && s.cd <= 0) {   // 押しっぱなしでも、投げられるようになるたびに投げる
        if (useInk(a, w.ink)) {
          s.cd = 1 / w.rate; const d = aim(), base = Math.atan2(d.x, d.z);
          // ねらった所に落ちるように投げる（とどく距離まで）。高投げは高い山なり
          const ap = a.aimPt, R = clamp(ap ? Math.hypot(ap.x - from.x, ap.z - from.z) : w.range, w.range * .25, w.range);
          const th = w.high ? .9 : w.small ? .3 : .38, gg = w.high ? 24 : 30, y0 = from.y + .2, ty = ap ? Math.max(hAt(ap.x, ap.z), ap.y - .6) : y0 - 1, v = lobSpeed(R, th, y0 - ty, gg);
          const lob = (yawOff, vMul, extra) => { const dd = dirOf(base + yawOff, th), vv = v * vMul; shoot(Object.assign({ x: from.x, y: y0, z: from.z, vx: dd.x * vv, vy: dd.y * vv, vz: dd.z * vv, g: gg, team: a.team, owner: a, dmg: w.dmg, pr: w.pr, splash: w.splashR || 1.4 }, extra)); };
          if (w.fan) for (let k = 0; k < w.fan; k++) lob((k / (w.fan - 1) - .5) * .5, rand(.86, 1.04), { size: .12, hitR: .4, trail: 1.2, trailR: .35, life: 3 });
          else for (const o of (w.triple ? [-.1, 0, .1] : [0])) lob(o, 1, { kind: w.explode ? 'blast' : 'shot', airBurst: false, sdmg: w.sdmg, er: w.er, size: w.small ? .17 : .26, hitR: w.small ? .5 : .7, trail: .7, trailR: w.small ? .45 : .58, life: 3, swirl: !!w.swirl, roll: !!w.roll });
          // ふつうのバケツ：大きなかたまりのすぐ後ろに、小さなかたまりが同じ道をついてくる（両方当たれば1回でたおせる）
          if (w.tail) { const n0 = proj.length; lob(0, 1, { dmg: w.tail, size: .17, hitR: .45, trail: .9, trailR: .4, life: 3 }); for (let q = n0; q < proj.length; q++) proj[q].wait = .06; }
          s.busy = .4; s.swing = { t: 0, dur: .32, kind: 'up' }; sfx(a, 'slosher');
        }
      }
      break;
    case 'gatling': {
      if (fire && !(s.fireT > 0)) { if (a.ink > 2) { s.spin = Math.min(1, (s.spin || 0) + dt / w.spin); s.busy = .55; } else noInk(a); }
      if (release && s.spin > .05) { s.fireT = w.dur * s.spin; s.scopeHold = s.spin; s.spin = 0; s.cd = 0; }
      if (fire && s.fireT > 0 && press) s.fireT = 0;
      if (s.fireT > 0) {
        s.fireT -= dt; s.busy = .4;
        while (s.cd <= 0 && s.fireT > 0) {
          if (!useInk(a, w.ink / (w.dur * w.rate))) { s.fireT = 0; break; }
          s.cd += 1 / w.rate; const d = aim();
          if (w.triple) { const b = Math.atan2(d.x, d.z), p0 = Math.asin(clamp(d.y, -1, 1)); for (const o of [-.1, 0, .1]) gunShot(dirOf(b + o, p0)); }
          else gunShot(d);
          sfx(a, 'gun');
        }
      }
      break;
    }
    case 'parasol': {
      if (fire && !(s.broken > 0)) s.open = true;
      s.shitT = (s.shitT || 0) + dt;
      if (w.regen && s.shitT > 1 && s.shp < w.shield) s.shp = Math.min(w.shield, (s.shp ?? w.shield) + 200 * dt);
      if (fire) {
        s.busy = .45;
        if (s.cd <= 0) {
          if (useInk(a, w.ink)) {
            s.cd = 1 / w.rate; const d = aim(), v = w.v;
            for (let k = 0; k < w.pellets; k++) { const dd = jitter(d, w.cone, w.cone * .5); shoot({ x: from.x, y: from.y, z: from.z, vx: dd.x * v, vy: dd.y * v, vz: dd.z * v, straight: w.range / v, team: a.team, owner: a, dmg: w.dmg, pr: w.pr, trail: 1.4, trailR: .3, life: 1.5, fall: true }); }
            sfx(a, 'blaster');
          } else s.cd = .2;
        }
        if (w.spiky && s.open) {
          const [fx, fz] = fwdOf(a.aimYaw); s.spike = s.spike || new Map();
          for (const o of actors) { if (o.dead || o.team === a.team) continue; const dx = o.x - a.x, dz = o.z - a.z, d = Math.hypot(dx, dz); if (d < 1.5 && (dx * fx + dz * fz) / (d || 1) > .3) { const l = s.spike.get(o) || 0; if (clock - l > .4) { s.spike.set(o, clock); hurt(o, 30, a, 'spike'); } } }
        }
      }
      break;
    }
    case 'bow': {
      if (fire) { if (!s.bow && a.ink < w.ink * .4) { noInk(a); break; } s.bow = Math.min(1, (s.bow || 0) + dt / w.charge); s.busy = .3; }
      if (release && s.bow > 0) {
        const c = s.bow; s.bow = 0; if (!useInk(a, w.ink * (.4 + .6 * c))) break;
        const d = aim(), base = Math.atan2(d.x, d.z), pit = Math.asin(clamp(d.y, -1, 1)), v = w.v * (.55 + .45 * c), spr = lerp(.14, .05, c) * (w.arrows > 3 ? 1.3 : 1);
        const n = w.arrows || 3, explodeIt = w.boom ? c >= .5 : c >= 1;
        for (let k = 0; k < n; k++) {
          const o = k - (n - 1) / 2;
          const dd = w.vertical ? dirOf(base, pit + o * spr * .6) : dirOf(base + o * spr, pit);
          const vv = w.vertical ? v * (1 + o * .12) : v;
          shoot({ kind: explodeIt ? 'arrowX' : 'shot', x: from.x, y: from.y, z: from.z, vx: dd.x * vv, vy: dd.y * vv, vz: dd.z * vv, straight: w.range * (.45 + .55 * c) / vv, g: 30, team: a.team, owner: a, dmg: w.dmg * (.4 + .6 * c) * (o === 0 ? 1.15 : 1), pr: w.pr, size: .09, trail: .5, trailR: .3, life: 2 });
        }
        sfx(a, 'stringer');
      }
      break;
    }
    case 'blade': {
      if (s.lungeT > 0) {
        s.lungeT -= dt; const [fx, fz] = fwdOf(a.aimYaw); a.vx = fx * 16; a.vz = fz * 16; a.slideT = .05;
        paintBy(a, a.x, a.y + .2, a.z, .9, a.team);
        for (const o of actors) if (!o.dead && o.team !== a.team && !s.lungeHits.has(o) && Math.hypot(o.x - a.x, o.z - a.z) < 1.4 && Math.abs(o.y - a.y) < 1.2) { s.lungeHits.add(o); hurt(o, w.cdmg, a, 'lunge'); }
      }
      if (fire) { s.blade = (s.blade || 0) + dt; s.busy = .25; }
      const slash = charged => {
        s.swing = { t: 0, dur: charged ? .3 : .2, kind: charged ? 'down' : 'side' };
        const d = aim(), base = Math.atan2(d.x, d.z), pit = clamp(Math.asin(d.y), -.3, .3);
        if (charged) {
          if (!useInk(a, w.ink * 2)) return;
          if (w.lunge) { s.lungeT = .32; s.lungeHits = new Set(); a.rollArmor = Math.max(a.rollArmor || 0, .36); sfx(a, 'blade'); return; }   // つっこむ間はダメージ半分
          const v = 24, dd = dirOf(base, pit);
          shoot({ x: from.x, y: from.y, z: from.z, vx: dd.x * v, vy: dd.y * v, vz: dd.z * v, straight: w.crange / v, g: w.ret ? 0 : 30, team: a.team, owner: a, dmg: w.cdmg, pr: 1.0, size: .3, hitR: .7, pierce: true, trail: .4, trailR: .85, life: 3, ret: !!w.ret });
        } else {
          if (!useInk(a, w.ink)) return;
          const v = 15, volleys = w.twin ? 2 : 1;
          for (let q = 0; q < volleys; q++) for (let k = -2; k <= 2; k++) {
            const dd = dirOf(base + k * .2 + (q ? .1 : 0), pit);
            const p = shoot({ x: from.x, y: from.y - .1, z: from.z, vx: dd.x * v, vy: dd.y * v, vz: dd.z * v, straight: w.range / v, g: 30, team: a.team, owner: a, dmg: w.dmg, pr: w.pr, size: .14, hitR: .45, pierce: true, trail: .7, trailR: .55, life: .8 });
            if (q) p.wait = .12;
          }
        }
        sfx(a, 'blade');
      };
      if (release && s.blade > 0) { const charged = s.blade >= w.charge; s.blade = 0; if (s.cd <= 0 || charged) { s.cd = 1 / w.rate; slash(charged); } }
      break;
    }
    case 'hose': {
      if (fire) {
        s.busy = w.slow ? .45 : .22; s.held = (s.held || 0) + dt;
        if (!useInk(a, w.inkS * dt)) { s.held = 0; break; }
        s.acc = (s.acc || 0) + dt * w.rate;
        const range = w.pump ? lerp(8, w.range, clamp(s.held / 1.5, 0, 1)) : w.range;
        const streams = w.shower ? [-.24, 0, .24] : [0];
        while (s.acc >= 1) {
          s.acc -= 1; const d = aim(), b = Math.atan2(d.x, d.z), p0 = Math.asin(clamp(d.y, -1, 1));
          for (const o of streams) {
            const dd = jitter(dirOf(b + o, p0), w.spread * spreadMul, w.mist ? w.spread * .6 : w.spread * .4), v = w.mist ? 18 : 32;
            shoot({ x: from.x, y: from.y, z: from.z, vx: dd.x * v, vy: dd.y * v, vz: dd.z * v, straight: range / v * .85, g: 24, team: a.team, owner: a, dmg: w.dmg, pr: w.pr, size: w.mist ? .08 : .1, hitR: .25, life: 2, fall: true });
          }
        }
        s.snd = (s.snd || 0) - dt; if (s.snd <= 0) { s.snd = .12; sfx(a, 'hose'); }
      } else { s.held = 0; s.acc = 0; }
      break;
    }
  }
}
// 撃った音・反動・銃口のしぶき
const KICK = { gun: .3, blaster: .9, charger: 1, roller: .55, brush: .3, slosher: .7, stringer: .6, blade: .6, hose: .12 };
const CAMKICK = { gun: .004, blaster: .035, charger: .04, roller: .012, brush: .004, slosher: .022, stringer: .018, blade: .012, hose: .001 };
// ためキープできる時間（キープが得意なブキは長い）
const keepTime = w => w.keepLong ? 5 : (w.cls === 'gatling' ? 1.5 : 1.0) * (w.keep ? 2.2 : 1);
// スコープつきのブキ：ためている具合（0〜1）。ガトリングは撃っている間も、放したときの具合のまま。もぐる・やられると0
function scopeAmt(a) {
  const w = a.w, s = a.ws; if (!w.scope || a.dead || a.dive || a.sj || a.climb) return 0;
  if (w.cls === 'sniper') return s.ch || 0;
  if (w.cls === 'bow') return s.bow || 0;
  if (w.cls === 'gatling') return s.fireT > 0 ? (s.scopeHold || 0) : (s.spin || 0);
  return 0;
}
function sfx(a, kind) {
  const d = G.me ? Math.hypot(G.me.x - a.x, G.me.z - a.z) : 0, g = a === G.me ? 1 : clamp(1 - d / 40, 0, 1) * .6;
  if (g > .02) AU.shot(kind, g);
  if (G.me && a.team !== G.me.team) reveal(a, a.cloakT > 0 ? .6 : 1.2);
  a.kick = Math.min(1, (a.kick || 0) + (KICK[kind] || .3));
  if (a === G.me) G.kick = Math.min(.08, (G.kick || 0) + (CAMKICK[kind] || 0));
  if (d < 28 && !(a.cloakT > 0 && G.me && a.team !== G.me.team)) {
    const m = muzzle(a), [fx, fz] = fwdOf(a.aimYaw), n = (KICK[kind] || .3) > .5 ? 4 : 2;
    for (let k = 0; k < n; k++) particle(m.x + fx * .2, m.y, m.z + fz * .2, fx * rand(2, 4.5) + rand(-.8, .8), rand(.4, 2), fz * rand(2, 4.5) + rand(-.8, .8), a.team, rand(.035, .07), rand(.12, .26));
  }
}

// ================= サブ =================
function throwSub(a) {
  if (a.dead || a.dive || a.sj || !ruleCanFire(a)) return false;
  const sd = SUBS[a.w.sub]; if (!useInk(a, sd.ink)) return false;
  const from = muzzle(a), d = aimFrom(a, from), k = a.w.sub;
  const yaw = Math.atan2(d.x, d.z), pit = clamp(Math.asin(d.y) + .38, -.2, 1.1), v = k === 'slide' ? 13 : 12.5;
  const vel = k === 'slide' ? [Math.sin(yaw) * v, 1, Math.cos(yaw) * v] : [Math.sin(yaw) * Math.cos(pit) * v, Math.sin(pit) * v, Math.cos(yaw) * Math.cos(pit) * v];
  const base = { x: from.x, y: from.y, z: from.z, vx: vel[0], vy: vel[1], vz: vel[2], team: a.team, owner: a, size: .2 };
  switch (k) {
    case 'bomb': case 'sticky': case 'slide': shoot(Object.assign(base, { kind: k, fuse: k === 'bomb' ? 1.0 : k === 'sticky' ? 1.9 : 2.4 })); break;
    case 'balloon': shoot(Object.assign(base, { kind: 'balloon', size: .24, fuse: 99, hitR: .35 })); break;
    case 'popper': shoot(Object.assign(base, { kind: 'popper', size: .18, fuse: 99 })); break;
    case 'windup': shoot(Object.assign(base, { kind: 'windupT', size: .22, fuse: 99 })); break;
    case 'fog': shoot(Object.assign(base, { kind: 'fogT', size: .2, fuse: 99 })); break;
    case 'fountain': shoot(Object.assign(base, { kind: 'fountainT', fuse: 99 })); break;
    case 'boomer': { const dd = dirOf(yaw, clamp(Math.asin(d.y), -.15, .2)); shoot({ kind: 'boomer', x: from.x, y: from.y, z: from.z, vx: dd.x * 14, vy: 0, vz: dd.z * 14, curve: .9 * (Math.random() < .5 ? 1 : -1), team: a.team, owner: a, dmg: 35, pr: .7, size: .28, hitR: .45, pierce: true, trail: .3, trailR: .7, life: 3, g: 0 }); break; }
    case 'dart': { const dd = dirOf(yaw, Math.asin(clamp(d.y, -1, 1)) + .04); shoot({ kind: 'dart', x: from.x, y: from.y, z: from.z, vx: dd.x * 30, vy: dd.y * 30, vz: dd.z * 30, straight: .4, g: 12, team: a.team, owner: a, dmg: 25, pr: .6, size: .1, life: 2 }); break; }
    case 'shield': addDevice({ kind: 'shield', team: a.team, owner: a, x: a.x + Math.sin(a.aimYaw) * 1.8, z: a.z + Math.cos(a.aimYaw) * 1.8, yaw: a.aimYaw, life: 6, hp: 600 }); break;
    case 'mine': { for (const m of a.mines) m.dead = true; const m = addDevice({ kind: 'mine', team: a.team, owner: a, x: a.x, z: a.z, life: 25, hp: 40, arm: .5 }); a.mines = [m]; paintBy(a, a.x, a.y + .2, a.z, 1.2, a.team); break; }
    case 'spring': { const x = a.x + Math.sin(a.aimYaw) * 1.6, z = a.z + Math.cos(a.aimYaw) * 1.6; if (hAt(x, z) > a.y + .5 || hAt(x, z) < -5) addDevice({ kind: 'spring', team: a.team, owner: a, x: a.x, z: a.z, life: 15, hp: 80 }); else addDevice({ kind: 'spring', team: a.team, owner: a, x, z, life: 15, hp: 80 }); break; }
  }
  AU.ui();
  return true;
}
function addDevice(o) {
  const d = Object.assign({ t: 0, dead: false, y: hAt(o.x, o.z) }, o);
  const g = new T.Group(), J = tmat(d.team).jelly, col = teamColor(d.team);
  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  switch (d.kind) {
    case 'shield': add(new T.BoxGeometry(3.2, 2.3, .12), new T.MeshStandardMaterial({ color: col, transparent: true, opacity: .55, roughness: .2 }), 0, 1.15, 0); g.rotation.y = d.yaw; break;
    case 'mine': add(new T.CylinderGeometry(.28, .32, .1, 14), J, 0, .05, 0); break;
    case 'fountain': add(new T.CylinderGeometry(.18, .26, .35, 10), J, 0, .18, 0); d.spin = add(new T.TorusGeometry(.22, .05, 6, 12), MAT.metal, 0, .36, 0); d.spin.rotation.x = Math.PI / 2; break;
    case 'barrier': add(new T.SphereGeometry(d.r, 24, 16), new T.MeshStandardMaterial({ color: col, transparent: true, opacity: .28, roughness: .1, side: T.DoubleSide, depthWrite: false }), 0, 1, 0); break;
    case 'cloud': { const cm = new T.MeshStandardMaterial({ color: col, roughness: .9, transparent: true, opacity: .85 }); for (let i = 0; i < 7; i++) add(new T.SphereGeometry(rand(.9, 1.5), 12, 8), cm, rand(-2, 2), 5 + rand(-.3, .4), rand(-2, 2)); break; }
    case 'missile': { const r = add(new T.RingGeometry(1.8, 2.4, 32), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .7, side: T.DoubleSide }), 0, .06, 0); r.rotation.x = -Math.PI / 2; d.rocket = add(new T.CylinderGeometry(.18, .18, 1.2, 8), J, 0, 30, 0); break; }
    case 'walker': { add(new T.SphereGeometry(.26, 12, 8), J, 0, .3, 0); d.key = add(new T.TorusGeometry(.12, .03, 6, 12), MAT.metal, 0, .62, 0); for (const s of [-1, 1]) add(new T.BoxGeometry(.06, .2, .1), MAT.dark, s * .14, .08, 0); break; }
    case 'spring': { add(new T.CylinderGeometry(.5, .55, .08, 16), J, 0, .04, 0); d.coil = add(new T.CylinderGeometry(.3, .3, .25, 12, 1, true), MAT.metal, 0, .2, 0); d.pad = add(new T.CylinderGeometry(.45, .45, .06, 16), J, 0, .34, 0); break; }
    case 'fog': for (let i = 0; i < 6; i++) { const m = add(new T.SphereGeometry(rand(1.2, 1.8), 10, 8), new T.MeshStandardMaterial({ color: col, transparent: true, opacity: .22, roughness: 1, depthWrite: false }), rand(-1.6, 1.6), rand(.6, 1.6), rand(-1.6, 1.6)); m.userData.sp = rand(.5, 1.5); } break;
    case 'tornado': { const tm = new T.MeshStandardMaterial({ color: col, transparent: true, opacity: .65, roughness: .3, side: T.DoubleSide, depthWrite: false }); for (let i = 0; i < 5; i++) { const m = add(new T.TorusGeometry(.6 + i * .35, .12, 6, 18), tm, 0, .4 + i * .7, 0); m.rotation.x = Math.PI / 2; } break; }
    case 'drop': { const r = add(new T.RingGeometry(3, 3.5, 32), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .75, side: T.DoubleSide }), 0, .07, 0); r.rotation.x = -Math.PI / 2; d.bomb = add(new T.SphereGeometry(.7, 14, 10), J, 0, 40, 0); break; }
    case 'tower': { add(new T.CylinderGeometry(.5, .8, 3.6, 12), J, 0, 1.8, 0); d.top = add(new T.SphereGeometry(.6, 12, 8), MAT.white, 0, 3.8, 0); break; }
    case 'ring': { d.torus = add(new T.TorusGeometry(1, .15, 6, 48), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .8 }), 0, .4, 0); d.torus.rotation.x = Math.PI / 2; d.hits = new Set(); break; }
    case 'turret': { add(new T.CylinderGeometry(.5, .6, .5, 12), MAT.dark, 0, .25, 0); d.head = new T.Group(); d.head.position.y = .7; g.add(d.head); const hm = new T.Mesh(new T.SphereGeometry(.35, 12, 8), J); d.head.add(hm); const br = new T.Mesh(new T.CylinderGeometry(.07, .07, .7, 8), MAT.metal); br.rotation.x = Math.PI / 2; br.position.z = .4; d.head.add(br); break; }
    case 'rocket': d.body = add(new T.SphereGeometry(.2, 10, 8), J, 0, 0, 0); break;
  }
  g.position.set(d.x, d.y, d.z); scene.add(g); d.mesh = g; devices.push(d); return d;
}
function nearestEnemy(team, x, z, maxD, needSight, y = 1) {
  let best = null, bd = maxD;
  for (const o of actors) {
    if (o.dead || o.team === team) continue;
    if (o.cloakT > 0 && !o.revealed && !(o.markT > 0)) continue;
    const d = Math.hypot(o.x - x, o.z - z); if (d > bd) continue;
    if (needSight && !lineOfSight(x, y, z, o.x, o.y + .8, o.z)) continue;
    bd = d; best = o;
  }
  return best;
}
function stepDevices(dt) {
  for (let i = devices.length - 1; i >= 0; i--) {
    const d = devices[i]; d.t += dt;
    if (d.hp !== undefined && d.hp <= 0 && d.kind !== 'missile') {
      if (d.kind === 'walker') { const s = SUB_FX.walker; explode(d.x, d.y + .3, d.z, s.r, s.dmax, s.dmin, d.team, d.owner, s.pr); }
      else burst(d.x, d.y + .5, d.z, d.team, 12, .8);
      d.dead = true;
    }
    if (d.t > d.life && !d.dead) {
      if (d.kind === 'walker') { const s = SUB_FX.walker; explode(d.x, d.y + .3, d.z, s.r, s.dmax, s.dmin, d.team, d.owner, s.pr); }
      d.dead = true;
    }
    if (!d.dead) {
      switch (d.kind) {
        case 'fountain':
          d.spin.rotation.z += dt * 8; d.acc = (d.acc || 0) + dt;
          while (d.acc > .09) { d.acc -= .09; const a = Math.random() * TAU, v = rand(3, 7.5); shoot({ x: d.x, y: d.y + .45, z: d.z, vx: Math.sin(a) * v, vy: rand(2, 5), vz: Math.cos(a) * v, g: 18, team: d.team, owner: d.owner, dmg: 9, pr: .62, size: .1, life: 2 }); }
          break;
        case 'mine':
          d.arm -= dt;
          if (d.arm <= 0 && !d.trig) for (const o of actors) if (!o.dead && o.team !== d.team && Math.hypot(o.x - d.x, o.z - d.z) < 1.7 && Math.abs(o.y - d.y) < 1.5) { d.trig = .3; break; }
          if (d.trig) { d.trig -= dt; d.mesh.scale.setScalar(1 + Math.sin(d.t * 40) * .2); if (d.trig <= 0) { const s = SUB_FX.mine; explode(d.x, d.y + .2, d.z, s.r, s.dmax, s.dmin, d.team, d.owner, s.pr); d.dead = true; } }
          d.mesh.visible = !G.me || G.me.team === d.team || !!d.trig;
          break;
        case 'cloud':
          d.acc = (d.acc || 0) + dt;
          while (d.acc > .06) { d.acc -= .06; const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 3.6; shoot({ x: d.x + Math.cos(a) * r, y: d.y + 4.6, z: d.z + Math.sin(a) * r, vx: 0, vy: -10, vz: 0, g: 10, team: d.team, owner: d.owner, dmg: 7, pr: .7, size: .1, life: 2 }); }
          d.mesh.rotation.y += dt * .3;
          break;
        case 'barrier': d.mesh.children[0].scale.setScalar(Math.min(1, d.t * 4) * (1 + Math.sin(d.t * 6) * .02)); break;
        case 'missile':
          if (d.t < 1.0 && d.target && !d.target.dead) { d.x = d.target.x; d.z = d.target.z; d.y = hAt(d.x, d.z); d.mesh.position.set(d.x, d.y, d.z); }
          d.rocket.position.y = Math.max(0, 30 * (1 - d.t / 1.5)); d.mesh.children[0].material.opacity = .4 + .4 * Math.abs(Math.sin(d.t * 10));
          if (d.t >= 1.5) { explode(d.x, d.y + .3, d.z, 2.7, 150, 40, d.team, d.owner, 3); d.dead = true; }
          break;
        case 'walker': {
          const tgt = nearestEnemy(d.team, d.x, d.z, 16, false);
          if (tgt) {
            const dx = tgt.x - d.x, dz = tgt.z - d.z, l = Math.hypot(dx, dz) || 1;
            if (l < 1.3) { d.hp = 0; break; }
            const nx = d.x + dx / l * 3.8 * dt, nz = d.z + dz / l * 3.8 * dt, nh = hAt(nx, nz);
            if (nh <= d.y + .5 && nh > -5) { d.x = nx; d.z = nz; d.y = nh; }
            d.mesh.rotation.y = Math.atan2(dx, dz);
          }
          d.key.rotation.y += dt * 12; d.mesh.position.set(d.x, d.y + Math.abs(Math.sin(d.t * 12)) * .06, d.z);
          d.td = (d.td || 0) + dt; if (d.td > .15) { d.td = 0; paintBy(d.owner, d.x, d.y + .2, d.z, .55, d.team); }
          break;
        }
        case 'spring': { const b = d.bounce > 0 ? (d.bounce -= dt, 1 + d.bounce * 2) : 1; d.coil.scale.y = b; d.pad.position.y = .2 + .14 * b; break; }
        case 'fog':
          for (const o of actors) if (!o.dead && o.team !== d.team && Math.hypot(o.x - d.x, o.z - d.z) < d.r && o.y < d.y + 3) o.fogT = .25;
          d.mesh.children.forEach((m, k) => { m.position.y = .8 + Math.sin(d.t * m.userData.sp + k) * .3; m.material.opacity = .22 * Math.min(1, (d.life - d.t) * 2); });
          break;
        case 'tornado': {
          const nx = d.x + d.dx * 4.5 * dt, nz = d.z + d.dz * 4.5 * dt, nh = hAt(nx, nz);
          if (nh > d.y + .6 || nh < -5) { d.dx = -d.dx; d.dz = -d.dz; } else { d.x = nx; d.z = nz; d.y = nh; }
          d.acc = (d.acc || 0) + dt;
          if (d.acc > .1) {
            d.acc = 0; const a = d.t * 9;
            paintBy(d.owner, d.x + Math.cos(a) * 1.2, d.y + .2, d.z + Math.sin(a) * 1.2, 1.3, d.team); paintBy(d.owner, d.x, d.y + .2, d.z, 1.4, d.team);
            paintWallsNear(d.x, d.y + 1, d.z, 1.8, d.team);
            for (const o of actors) if (!o.dead && o.team !== d.team && Math.hypot(o.x - d.x, o.z - d.z) < 2.3 && Math.abs(o.y - d.y) < 3) hurt(o, 8, d.owner, 'tornado');
          }
          d.mesh.position.set(d.x, d.y, d.z); d.mesh.children.forEach((m, k) => { m.rotation.z = d.t * (6 + k); });
          break;
        }
        case 'drop':
          if (d.t >= d.delay - .5) d.bomb.position.y = Math.max(0, 40 * (1 - (d.t - (d.delay - .5)) / .5));
          else d.bomb.position.y = 40;
          d.mesh.children[0].material.opacity = .4 + .4 * Math.abs(Math.sin(d.t * 8));
          if (d.t >= d.delay) { explode(d.x, d.y + .3, d.z, 3.5, 200, 50, d.team, d.owner, 4); d.dead = true; }
          break;
        case 'tower':
          d.acc = (d.acc || 0) + dt; d.top.rotation.y += dt * 6;
          while (d.acc > .05) { d.acc -= .05; const a = Math.random() * TAU, v = rand(4, 10); shoot({ x: d.x, y: d.y + 3.9, z: d.z, vx: Math.sin(a) * v, vy: rand(4, 8), vz: Math.cos(a) * v, g: 18, team: d.team, owner: d.owner, dmg: 10, pr: .8, size: .13, life: 3 }); }
          break;
        case 'ring': {
          const r = 11 * clamp(d.t / 1.3, 0, 1); d.torus.scale.set(r, r, 1); d.torus.material.opacity = .8 * (1 - d.t / 1.3);
          d.acc = (d.acc || 0) + dt;
          if (d.acc > .07) { d.acc = 0; const n = Math.max(8, Math.round(r * 3)); for (let k = 0; k < n; k++) { const a = k / n * TAU, x = d.x + Math.cos(a) * r, z = d.z + Math.sin(a) * r; paintBy(d.owner, x, Math.max(d.y, hAt(x, z)) + .2, z, .8, d.team); } }
          for (const o of actors) if (!o.dead && o.team !== d.team && !d.hits.has(o)) { const dd = Math.hypot(o.x - d.x, o.z - d.z); if (dd < r + .4 && dd > r - 1.2 && Math.abs(o.y - d.y) < 2.5) { d.hits.add(o); hurt(o, 90, d.owner, 'ring'); } }
          break;
        }
        case 'turret': {
          d.acc = (d.acc || 0) + dt;
          const tgt = nearestEnemy(d.team, d.x, d.z, 22, true, d.y + .8);
          if (tgt) {
            const dx = tgt.x - d.x, dz = tgt.z - d.z; d.head.rotation.y += angD(Math.atan2(dx, dz) - d.head.rotation.y) * Math.min(1, dt * 8);
            if (d.acc > 1 / 6) {
              d.acc = 0; const from = new T.Vector3(d.x, d.y + .75, d.z), dir = new T.Vector3(tgt.x, tgt.y + .7, tgt.z).sub(from).normalize(), dd = jitter(dir, 4);
              shoot({ x: from.x, y: from.y, z: from.z, vx: dd.x * 32, vy: dd.y * 32, vz: dd.z * 32, straight: 22 / 32, team: d.team, owner: d.owner, dmg: 26, pr: .6, trail: 1.2, trailR: .3, life: 2 });
              if (G.me && Math.hypot(G.me.x - d.x, G.me.z - d.z) < 30) AU.shot('gun', .4);
            }
          }
          break;
        }
        case 'rocket': {
          const u = clamp(d.t / 1, 0, 1);
          d.x = lerp(d.sx, d.tx, u); d.z = lerp(d.sz, d.tz, u); const y = lerp(d.sy, 18, Math.sqrt(u));
          d.mesh.position.set(d.x, y, d.z); particle(d.x, y - .3, d.z, rand(-.5, .5), -2, rand(-.5, .5), d.team, .08, .4);
          if (u >= 1) {
            for (let k = 0; k < 24; k++) { const a = Math.random() * TAU, v = rand(2, 7); shoot({ x: d.x, y: 18, z: d.z, vx: Math.cos(a) * v, vy: rand(-1, 3), vz: Math.sin(a) * v, g: 14, team: d.team, owner: d.owner, dmg: 12, pr: .85, size: .13, life: 4 }); }
            burst(d.x, 18, d.z, d.team, 20, 2); if (G.me) AU.boom(.7, .5); d.dead = true;
          }
          break;
        }
      }
    }
    if (d.dead) { scene.remove(d.mesh); d.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && !Object.values(MAT).includes(o.material) && o.material !== tmat(d.team).jelly) o.material.dispose(); }); devices.splice(i, 1); }
  }
}

// ================= スペシャル =================
const beamMesh = new T.Mesh(new T.CylinderGeometry(.55, .55, 1, 12, 1, true), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 }));
const beamMeshes = new Map();
function useSpecial(a) {
  if (a.dead || a.sp < 1 || a.spOn || a.dive || a.sj) return false;
  const k = a.w.sp; a.sp = 0; a.spOn = { kind: k, t: 0, dur: .3 };
  if (a === G.me) { AU.sp(); showMsg(SPECIALS[k].name + '！', '', .9); }
  else if (G.me && Math.hypot(G.me.x - a.x, G.me.z - a.z) < 35) AU.sp();
  const aimPt = () => { const p = a.aimPt || new T.Vector3(a.x + Math.sin(a.aimYaw) * 15, 0, a.z + Math.cos(a.aimYaw) * 15); let tx = p.x, tz = p.z; const dd = Math.hypot(tx - a.x, tz - a.z); if (dd > 30) { tx = a.x + (tx - a.x) * 30 / dd; tz = a.z + (tz - a.z) * 30 / dd; } return [tx, tz]; };
  const [fx, fz] = fwdOf(a.aimYaw);
  switch (k) {
    case 'beam': a.spOn.dur = 3.6; a.spOn.slow = .3; break;
    case 'rain': { const [tx, tz] = aimPt(); addDevice({ kind: 'cloud', team: a.team, owner: a, x: tx, z: tz, life: 6.5 }); break; }
    case 'slam': a.vy = 11; a.onGround = false; a.spOn.dur = 3; a.spOn.slow = .4; break;
    case 'barrier': addDevice({ kind: 'barrier', team: a.team, owner: a, x: a.x, z: a.z, life: 5.5, r: 3.4 }); break;
    case 'missile': { const ts = actors.filter(o => !o.dead && o.team !== a.team && !(o.cloakT > 0)).sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z)).slice(0, 4); for (const t of ts) addDevice({ kind: 'missile', team: a.team, owner: a, x: t.x, z: t.z, target: t, life: 2 }); break; }
    case 'armor': for (const o of actors) if (!o.dead && o.team === a.team && Math.hypot(o.x - a.x, o.z - a.z) < 30) { o.armor = 40; o.armorT = 9; burst(o.x, o.y + 1, o.z, o.team, 10, .6); } break;
    case 'tornado': addDevice({ kind: 'tornado', team: a.team, owner: a, x: a.x + fx * 2, z: a.z + fz * 2, dx: fx, dz: fz, life: 6 }); break;
    case 'airdrop': [10, 18, 26].forEach((r, i) => { let x = a.x + fx * r, z = a.z + fz * r; if (hAt(x, z) < -5) { x = a.x + fx * r * .6; z = a.z + fz * r * .6; } addDevice({ kind: 'drop', team: a.team, owner: a, x, z, delay: 1.2 + i * .4, life: 3 }); }); break;
    case 'tower': { let x = a.x + fx * 1.4, z = a.z + fz * 1.4; if (hAt(x, z) > a.y + .5 || hAt(x, z) < -5) { x = a.x; z = a.z; } addDevice({ kind: 'tower', team: a.team, owner: a, x, z, life: 7, hp: 400 }); break; }
    case 'dash': a.dashT = 6; break;
    case 'ring': addDevice({ kind: 'ring', team: a.team, owner: a, x: a.x, z: a.z, y: a.y, life: 1.3 }); break;
    case 'turret': { let x = a.x + fx * 1.6, z = a.z + fz * 1.6; if (hAt(x, z) > a.y + .5 || hAt(x, z) < -5) { x = a.x; z = a.z; } addDevice({ kind: 'turret', team: a.team, owner: a, x, z, life: 9, hp: 300 }); break; }
    case 'fireworks': { const [tx, tz] = aimPt(); for (let i = 0; i < 6; i++) { const ang = Math.random() * TAU, r = Math.sqrt(Math.random()) * 12; addDevice({ kind: 'rocket', team: a.team, owner: a, x: a.x, z: a.z, sx: a.x, sy: a.y + 1, sz: a.z, tx: tx + Math.cos(ang) * r, tz: tz + Math.sin(ang) * r, life: 2 }); } break; }
    case 'cloak': a.cloakT = 7; burst(a.x, a.y + 1, a.z, a.team, 12, .8); break;
  }
  return true;
}
function stepSpecial(a, dt) {
  const s = a.spOn; if (!s) return;
  s.t += dt;
  if (s.kind === 'beam') {
    let m = beamMeshes.get(a); if (!m) { m = beamMesh.clone(); m.material = beamMesh.material.clone(); scene.add(m); beamMeshes.set(a, m); }
    m.material.color.set(teamColor(a.team));
    const from = muzzle(a), d = aimFrom(a, from);
    s.acc = (s.acc || 0) + dt;
    if (s.acc > .1) { s.acc = 0; s.end = hitscan(a, from, d, 60, 28, 1.15, a.team, .6, true, .9); }
    const end = s.end || from.clone().addScaledVector(d, 20);
    const L = end.distanceTo(from); m.visible = true; m.scale.set(1 + Math.sin(s.t * 30) * .12, Math.max(.1, L), 1 + Math.sin(s.t * 30) * .12);
    m.position.copy(from).lerp(end, .5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), end.clone().sub(from).normalize());
    if (a === G.me) G.shake = Math.max(G.shake, .06);
  }
  if (s.kind === 'slam' && s.t > .25 && a.onGround) { explode(a.x, a.y + .3, a.z, 5.2, 220, 50, a.team, a, 5.4); s.t = s.dur; }
  if (s.t >= s.dur) { a.spOn = null; const m = beamMeshes.get(a); if (m) m.visible = false; }
}
