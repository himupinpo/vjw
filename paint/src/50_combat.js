
// ================= 弾・爆発・ブキ・サブ・スペシャル =================
const PN = 900;
const projMesh = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), new T.MeshStandardMaterial({ roughness: .18, metalness: .05 }), PN);
projMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); projMesh.frustumCulled = false;
projMesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(PN * 3), 3);
const proj = [], devices = [];
const teamColor = t => G.pal[t - 1] || '#ffffff';

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
function jitter(dir, deg, vdeg) {
  const yaw = Math.atan2(dir.x, dir.z) + (Math.random() - .5) * deg * Math.PI / 180;
  const pit = Math.asin(clamp(dir.y, -1, 1)) + (Math.random() - .5) * (vdeg ?? deg * .35) * Math.PI / 180;
  const cp = Math.cos(pit); return new T.Vector3(Math.sin(yaw) * cp, Math.sin(pit), Math.cos(yaw) * cp);
}
function shoot(o) { const p = Object.assign({ t: 0, life: 3, g: 28, straight: 0, trail: 0, trailR: .3, td: 0, size: .11, hitR: .3, pierce: false, kind: 'shot', hits: null }, o); proj.push(p); return p; }
function noInk(a) { if (a === G.me) { G.inkWarn = 1; } }
function useInk(a, n) { if (a.ink < n) { noInk(a); return false; } a.ink -= n; a.inkT = 0; return true; }

// ぬってスペシャルをためる
function paintBy(owner, x, y, z, r, team) {
  const n = paintCircle(x, y, z, r, team);
  if (owner && n > 0) { owner.painted += n; if (!owner.spOn && !owner.dead) owner.sp = Math.min(1, owner.sp + n / SPECIALS[owner.w.sp].cost); }
  return n;
}

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
    a.ws.shp = (a.ws.shp ?? a.w.shield) - (p.dmg || 20);
    if (a.ws.shp <= 0) { a.ws.broken = 6; a.ws.shp = a.w.shield; burst(a.x, a.y + 1, a.z, a.team, 18, 1); }
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
  paintBy(owner, x, y + .3, z, pr ?? r, team);
  burst(x, y + .3, z, team, 24, 1.2);
  const near = G.me ? Math.hypot(G.me.x - x, G.me.z - z) : 99;
  AU.boom(r > 3 ? 1.5 : 1); if (near < r * 2.5) G.shake = Math.max(G.shake, .25 * (1 - near / (r * 2.5)));
}

// ---------- 弾を進める ----------
function stepProj(dt) {
  for (let i = proj.length - 1; i >= 0; i--) {
    const p = proj[i];
    if (p.wait > 0) { p.wait -= dt; continue; }
    p.t += dt;
    if (p.kind === 'bomb' || p.kind === 'sticky' || p.kind === 'slide' || p.kind === 'fountainT') { if (stepBomb(p, dt)) proj.splice(i, 1); continue; }
    const ox = p.x, oy = p.y, oz = p.z;
    if (p.t > p.straight) p.vy -= p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    // 通ったあとにぽたぽた
    if (p.trail > 0) {
      p.td += Math.hypot(p.x - ox, p.z - oz);
      if (p.td >= p.trail) { p.td = 0; const gh = hAt(p.x, p.z); if (p.y - gh < 3) paintBy(p.owner, p.x, gh + .2, p.z, p.trailR, p.team); }
    }
    if (blocked(p, ox, oz)) { burst(p.x, p.y, p.z, p.team, 3, .4); proj.splice(i, 1); continue; }
    const hit = findHit(p, ox, oy, oz);
    if (hit) {
      hurt(hit, p.dmg, p.owner, p.kind); burst(p.x, p.y, p.z, p.team, 4, .5);
      if (p.kind === 'blast') { explode(p.x, p.y, p.z, p.er, p.sdmg, p.sdmg * .5, p.team, p.owner, p.pr); proj.splice(i, 1); continue; }
      if (p.pierce) { (p.hits || (p.hits = new Set())).add(hit); }
      else { paintBy(p.owner, hit.x, hit.y + .2, hit.z, p.pr * .7, p.team); proj.splice(i, 1); continue; }
    }
    // 装置（噴水など）にも当たる
    for (const d of devices) if (d.hp && d.team !== p.team && !d.dead && Math.hypot(d.x - p.x, d.z - p.z) < .6 && Math.abs(d.y + .3 - p.y) < .8) { d.hp -= p.dmg; }
    const gh = hAt(p.x, p.z);
    if (p.y <= gh) {
      if (p.kind === 'blast') { explode(p.x, gh, p.z, p.er, p.sdmg, p.sdmg * .5, p.team, p.owner, p.pr); }
      else if (p.kind === 'arrowX') { p.x = ox; p.z = oz; p.y = Math.max(gh, oy); p.vx = p.vy = p.vz = 0; p.kind = 'stuck'; p.fuse = .45; continue; }
      else {
        const wall = gh > oy + .1;
        const px = wall ? ox : p.x, pz = wall ? oz : p.z;
        paintBy(p.owner, px, hAt(px, pz) + .2, pz, p.pr, p.team);
        if (p.size > .1 && Math.random() < .5) burst(px, hAt(px, pz) + .05, pz, p.team, 3, .35);
      }
      proj.splice(i, 1); continue;
    }
    if (p.kind === 'blast' && p.t >= p.straight) { explode(p.x, p.y, p.z, p.er, p.sdmg, p.sdmg * .5, p.team, p.owner, p.pr * .8); paintBy(p.owner, p.x, hAt(p.x, p.z) + .2, p.z, p.pr * .7, p.team); proj.splice(i, 1); continue; }
    if (p.kind === 'stuck') { p.fuse -= dt; if (p.fuse <= 0) { explode(p.x, p.y, p.z, 1.2, 30, 15, p.team, p.owner, 1.1); proj.splice(i, 1); } continue; }
    if (p.t > p.life || p.y < -6) proj.splice(i, 1);
  }
  // ささった矢（地面で止まったもの）
}
// 爆弾：はねる・くっつく・すべる
function stepBomb(p, dt) {
  const ox = p.x, oy = p.y, oz = p.z;
  if (!p.stuck) {
    p.vy -= 20 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    const gh = hAt(p.x, p.z);
    if (p.y <= gh + p.size) {
      const wall = gh > oy + .15;
      if (p.kind === 'sticky' || p.kind === 'fountainT') { p.stuck = true; if (wall) { p.x = ox; p.z = oz; p.y = Math.max(oy, hAt(ox, oz) + p.size); } else p.y = gh + p.size; p.vx = p.vy = p.vz = 0; if (p.kind === 'fountainT') { addFountain(p); return true; } }
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
  if (p.fuse <= 0) {
    const s = SUB_FX[p.kind]; explode(p.x, p.y, p.z, s.r, s.dmax, s.dmin, p.team, p.owner, s.pr); return true;
  }
  return false;
}
const SUB_FX = { bomb: { r: 2.6, dmax: 180, dmin: 30, pr: 2.7 }, sticky: { r: 3.3, dmax: 200, dmin: 40, pr: 3.3 }, slide: { r: 2.3, dmax: 160, dmin: 30, pr: 2.4 }, mine: { r: 2.6, dmax: 180, dmin: 40, pr: 2.8 } };

// ---------- 弾の見た目 ----------
const _pm = new T.Matrix4(), _pc = new T.Color(), _pq = new T.Quaternion(), _pv = new T.Vector3(), _ps = new T.Vector3();
function drawProj() {
  let n = 0;
  for (const p of proj) {
    if (n >= PN) break; if (p.wait > 0) continue;
    const s = p.size; let sx = s, sy = s, sz = s;
    if (p.kind !== 'bomb' && p.kind !== 'sticky' && p.kind !== 'slide' && p.kind !== 'fountainT') { const sp = Math.hypot(p.vx, p.vy, p.vz); if (sp > 1) { sz = s * (1 + Math.min(2.2, sp * .04)); } }
    const yaw = Math.atan2(p.vx, p.vz), pit = Math.atan2(-p.vy, Math.hypot(p.vx, p.vz));
    _pq.setFromEuler(new T.Euler(pit, yaw, 0, 'YXZ'));
    _pm.compose(_pv.set(p.x, p.y, p.z), _pq, _ps.set(sx, sy, sz));
    projMesh.setMatrixAt(n, _pm); _pc.set(teamColor(p.team)); if (p.kind === 'bomb' || p.kind === 'sticky' || p.kind === 'slide') _pc.multiplyScalar(.6 + .4 * Math.abs(Math.sin(p.t * 14))); projMesh.setColorAt(n, _pc); n++;
  }
  projMesh.count = n; projMesh.instanceMatrix.needsUpdate = true; if (projMesh.instanceColor) projMesh.instanceColor.needsUpdate = true;
}

// ---------- 線（スナイパーのねらい・弾道） ----------
const tracers = [];
function tracer(a, b, team, life = .25, width = .07) {
  const d = b.clone().sub(a), L = d.length();
  const m = new T.Mesh(new T.CylinderGeometry(width, width, L, 6, 1, true), new T.MeshBasicMaterial({ color: teamColor(team), transparent: true, opacity: .9 }));
  m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  scene.add(m); tracers.push({ m, life, max: life });
}
function updTracers(dt) { for (let i = tracers.length - 1; i >= 0; i--) { const t = tracers[i]; t.life -= dt; t.m.material.opacity = Math.max(0, t.life / t.max) * .9; if (t.life <= 0) { scene.remove(t.m); t.m.geometry.dispose(); t.m.material.dispose(); tracers.splice(i, 1); } } }
const laser = new T.Mesh(new T.CylinderGeometry(.018, .018, 1, 5, 1, true), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .75 }));
laser.visible = false;

// 一直線（スナイパー・メガ噴射）：最初に当たった相手まで。ぬりは線の下
function hitscan(a, from, dir, range, dmg, pr, team, every = .55, pierce = false) {
  const dGround = rayGround(from.x, from.y, from.z, dir.x, dir.y, dir.z, range, .15);
  let end = dGround, victim = null;
  for (const o of actors) {
    if (o.dead || o.team === team) continue;
    const cx = o.x - from.x, cy = (o.y + (o.dive ? .2 : .7)) - from.y, cz = o.z - from.z;
    const t = cx * dir.x + cy * dir.y + cz * dir.z; if (t < 0 || t > end) continue;
    const px = cx - dir.x * t, py = cy - dir.y * t, pz = cz - dir.z * t, r = o.dive ? .6 : .55;
    if (px * px + (py * py) * .5 + pz * pz < r * r) { if (pierce) hurt(o, dmg, a, 'line'); else { end = t; victim = o; } }
  }
  for (const d of devices) if (d.hp && d.team !== team && !d.dead) { const cx = d.x - from.x, cz = d.z - from.z, t = cx * dir.x + cz * dir.z; if (t > 0 && t < end && Math.hypot(cx - dir.x * t, cz - dir.z * t) < .7) d.hp -= dmg; }
  const bar = blockAlong(from, dir, end, team); if (bar) { end = bar.t; victim = null; }
  if (victim) hurt(victim, dmg, a, 'line');
  for (let s = 1.2; s < end; s += every) {
    const x = from.x + dir.x * s, y = from.y + dir.y * s, z = from.z + dir.z * s, gh = hAt(x, z);
    if (y - gh < 2.2) paintBy(a, x, gh + .2, z, pr, team);
  }
  const ex = from.x + dir.x * end, ey = from.y + dir.y * end, ez = from.z + dir.z * end;
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
  const w = a.w, s = a.ws, press = fire && !s.prev, release = !fire && s.prev;
  s.prev = fire; s.cd = Math.max(0, (s.cd || 0) - dt); s.busy = 0; s.open = false;
  if (s.broken > 0) s.broken -= dt;
  if (a.dead) return;
  const blocked = a.dive || (a.spOn && (a.spOn.kind === 'beam' || a.spOn.kind === 'slam'));
  if (blocked) { s.ch = 0; s.spin = 0; s.rolling = false; s.fireT = 0; s.bow = 0; s.blade = 0; return; }
  const from = muzzle(a), aim = () => aimFrom(a, from), cls = w.cls;
  const spreadMul = (a.onGround ? 1 : 1.8) * (s.focus > 0 ? .45 : 1);
  if (s.focus > 0) s.focus -= dt;
  const gunShot = (dir, side = 1) => {
    const f = side === 1 ? from : muzzle(a, -1), v = w.v || 30, d = jitter(dir, w.spread * spreadMul);
    shoot({ x: f.x, y: f.y, z: f.z, vx: d.x * v, vy: d.y * v, vz: d.z * v, straight: w.range / v, team: a.team, owner: a, dmg: w.dmg, pr: w.pr, trail: 1.1, trailR: w.pr * .5, life: 2.5 });
  };
  switch (cls) {
    case 'gun': case 'dual': {
      if (cls === 'dual') {
        s.rolls = s.rolls ?? w.rolls; s.rollCd = Math.max(0, (s.rollCd || 0) - dt);
        if (!fire && s.rollCd <= 0) s.rolls = w.rolls;
        if (dodge && fire && s.rolls > 0 && Math.hypot(mx, mz) > .2 && a.onGround && useInk(a, 6)) {
          s.rolls--; s.rollCd = 1; const l = Math.hypot(mx, mz); a.vx = mx / l * 12; a.vz = mz / l * 12; a.slideT = .28; s.focus = .8;
          paintBy(a, a.x, a.y + .2, a.z, 1.0, a.team); burst(a.x, a.y + .3, a.z, a.team, 8, .6); AU.dive();
        }
      }
      if (fire) {
        s.busy = cls === 'dual' ? .12 : .2;
        if (s.cd <= 0) {
          if (useInk(a, w.ink * (w.burst || 1))) {
            s.cd += 1 / w.rate; const dir = aim();
            if (w.burst) { for (let k = 0; k < w.burst; k++) { gunShot(dir); if (k) proj[proj.length - 1].wait = k * .07; } }
            else if (cls === 'dual') { s.side = -(s.side || 1); gunShot(dir, s.side); }
            else gunShot(dir);
            sfx(a, 'gun');
          } else s.cd = .15;
        }
      }
      break;
    }
    case 'cannon':
      if (fire) s.busy = .35;
      if (fire && s.cd <= 0) {
        if (useInk(a, w.ink)) {
          s.cd = 1 / w.rate; const d = aim(), v = w.v;
          shoot({ kind: 'blast', x: from.x, y: from.y, z: from.z, vx: d.x * v, vy: d.y * v, vz: d.z * v, straight: w.range / v, team: a.team, owner: a, dmg: w.dmg, sdmg: w.sdmg, er: w.er, pr: w.pr, size: .22, hitR: .35, trail: 1.6, trailR: .35 });
          sfx(a, 'blaster');
        } else s.cd = .2;
      }
      break;
    case 'roller': case 'brush': {
      const brush = cls === 'brush';
      if (press && s.cd <= 0 && !s.rolling) {
        if (useInk(a, w.ink)) {
          s.cd = 1 / w.frate; s.flickT = brush ? .1 : .32; const d = aim();
          const n = w.flick, base = Math.atan2(d.x, d.z), up = clamp(Math.asin(d.y), -.3, .5);
          for (let k = 0; k < n; k++) {
            let yaw = base, pit = up + .12, v = w.frange * 1.2;
            if (w.vflick) { pit = up + .05 + k * .012; v = w.frange * (.55 + .5 * k / n) * 1.25; yaw += (Math.random() - .5) * .05; }
            else { yaw += (k / (n - 1) - .5) * w.fspread * Math.PI / 180 + (Math.random() - .5) * .04; v *= rand(.75, 1.05); }
            const cp = Math.cos(pit);
            shoot({ x: from.x, y: from.y, z: from.z, vx: Math.sin(yaw) * cp * v, vy: Math.sin(pit) * v, vz: Math.cos(yaw) * cp * v, straight: .06, g: 26, team: a.team, owner: a, dmg: w.fdmg / (brush ? 1.5 : 3.1), pr: brush ? .5 : .75, size: brush ? .1 : .16, trail: 1.3, trailR: .32, life: 1.6 });
          }
          sfx(a, cls);
        }
      }
      if (s.flickT > 0) s.flickT -= dt;
      if (fire && !(s.flickT > 0) && !press) s.rolling = true;
      if (!fire) s.rolling = false;
      if (s.rolling) {
        const sp = a.moveSpd;
        if (sp > .6) {
          if (!useInk(a, w.rollInk * dt * clamp(sp / 4, .3, 1.5))) { s.rolling = false; break; }
          const [fx, fz] = fwdOf(a.yaw), hx = a.x + fx * .85, hz = a.z + fz * .85;
          paintBy(a, hx, a.y + .2, hz, w.width / 2, a.team);
          s.rollHit = s.rollHit || new Map();
          for (const o of actors) {
            if (o.dead || o.team === a.team) continue;
            if (Math.hypot(o.x - hx, o.z - hz) < w.width / 2 + .35 && Math.abs(o.y - a.y) < 1.2) {
              const last = s.rollHit.get(o) || 0; if (clock - last > .35) { s.rollHit.set(o, clock); hurt(o, brush ? 30 : 140, a, 'roll'); }
            }
          }
        }
      }
      break;
    }
    case 'sniper': {
      if (fire) {
        const need = w.ink * .3;
        if (s.ch === undefined || s.ch === 0) { if (a.ink < need) { noInk(a); break; } }
        s.ch = Math.min(1, (s.ch || 0) + dt / w.charge); s.busy = .55;
      }
      if (release && s.ch > 0) {
        const c = s.ch; s.ch = 0;
        const cost = w.ink * (.3 + .7 * c);
        if (a.ink < cost * .6) { noInk(a); break; }
        a.ink = Math.max(0, a.ink - cost); a.inkT = 0;
        const d = aim(), range = w.range * (.5 + .5 * c), dmg = c >= 1 ? w.dmg : lerp(w.mindmg, w.dmg * .7, c);
        const end = hitscan(a, from, d, range, dmg, w.pr * (.7 + .5 * c), a.team, .5);
        tracer(from, end, a.team, .3, .05 + c * .05);
        sfx(a, 'charger');
      }
      break;
    }
    case 'bucket':
      if (press && s.cd <= 0) {
        if (useInk(a, w.ink)) {
          s.cd = 1 / w.rate; const d = aim(); const base = Math.atan2(d.x, d.z), pit = clamp(Math.asin(d.y), -.4, .6) + (w.high ? .45 : .22);
          const v = w.range * (w.high ? .95 : 1.1);
          const offs = w.triple ? [-.2, 0, .2] : [0];
          for (const o of offs) { const yaw = base + o, cp = Math.cos(pit); shoot({ x: from.x, y: from.y + .2, z: from.z, vx: Math.sin(yaw) * cp * v, vy: Math.sin(pit) * v, vz: Math.cos(yaw) * cp * v, g: 20, team: a.team, owner: a, dmg: w.dmg, pr: w.pr, size: .26, hitR: .45, trail: .7, trailR: .5, life: 3 }); }
          s.busy = .4; sfx(a, 'slosher');
        }
      }
      break;
    case 'gatling': {
      if (fire && !(s.fireT > 0)) { if (a.ink > 2) { s.spin = Math.min(1, (s.spin || 0) + dt / w.spin); s.busy = .55; } else noInk(a); }
      if (release && s.spin > .05) { s.fireT = w.dur * s.spin; s.spin = 0; s.cd = 0; }
      if (fire && s.fireT > 0 && press) { s.fireT = 0; }
      if (s.fireT > 0) {
        s.fireT -= dt; s.busy = .4;
        while (s.cd <= 0 && s.fireT > 0) {
          if (!useInk(a, w.ink / (w.dur * w.rate))) { s.fireT = 0; break; }
          s.cd += 1 / w.rate; gunShot(aim()); sfx(a, 'gun');
        }
      }
      break;
    }
    case 'parasol': {
      if (fire && !(s.broken > 0)) s.open = true;
      if (fire) {
        s.busy = .45;
        if (s.cd <= 0) {
          if (useInk(a, w.ink)) {
            s.cd = 1 / w.rate; const d = aim(), v = w.v;
            for (let k = 0; k < w.pellets; k++) { const dd = jitter(d, w.cone, w.cone * .5); shoot({ x: from.x, y: from.y, z: from.z, vx: dd.x * v, vy: dd.y * v, vz: dd.z * v, straight: w.range / v, team: a.team, owner: a, dmg: w.dmg, pr: w.pr, trail: 1.4, trailR: .3, life: 1.5 }); }
            sfx(a, 'blaster');
          } else s.cd = .2;
        }
      }
      break;
    }
    case 'bow': {
      if (fire) { if (!s.bow && a.ink < w.ink * .4) { noInk(a); break; } s.bow = Math.min(1, (s.bow || 0) + dt / w.charge); s.busy = .3; }
      if (release && s.bow > 0) {
        const c = s.bow; s.bow = 0; if (!useInk(a, w.ink * (.4 + .6 * c))) break;
        const d = aim(), base = Math.atan2(d.x, d.z), pit = Math.asin(clamp(d.y, -1, 1)), v = w.v * (.55 + .45 * c), spr = lerp(.14, .05, c);
        for (const o of [-1, 0, 1]) {
          const yaw = base + o * spr, cp = Math.cos(pit);
          shoot({ kind: c >= 1 ? 'arrowX' : 'shot', x: from.x, y: from.y, z: from.z, vx: Math.sin(yaw) * cp * v, vy: Math.sin(pit) * v, vz: Math.cos(yaw) * cp * v, straight: w.range * (.45 + .55 * c) / v, g: 30, team: a.team, owner: a, dmg: w.dmg * (.4 + .6 * c) * (o === 0 ? 1.15 : 1), pr: w.pr, size: .09, trail: .5, trailR: .3, life: 2 });
        }
        sfx(a, 'stringer');
      }
      break;
    }
    case 'blade': {
      if (fire) { s.blade = (s.blade || 0) + dt; s.busy = .25; }
      const slash = charged => {
        const d = aim(), base = Math.atan2(d.x, d.z), pit = clamp(Math.asin(d.y), -.3, .3);
        if (charged) {
          if (!useInk(a, w.ink * 2)) return;
          const v = 24, cp = Math.cos(pit);
          shoot({ x: from.x, y: from.y, z: from.z, vx: Math.sin(base) * cp * v, vy: Math.sin(pit) * v, vz: Math.cos(base) * cp * v, straight: w.crange / v, g: 30, team: a.team, owner: a, dmg: w.cdmg, pr: .8, size: .3, hitR: .7, pierce: true, trail: .45, trailR: .6, life: 1.5 });
        } else {
          if (!useInk(a, w.ink)) return;
          const v = 15;
          for (let k = -2; k <= 2; k++) { const yaw = base + k * .2, cp = Math.cos(pit); shoot({ x: from.x, y: from.y - .1, z: from.z, vx: Math.sin(yaw) * cp * v, vy: Math.sin(pit) * v, vz: Math.cos(yaw) * cp * v, straight: w.range / v, g: 30, team: a.team, owner: a, dmg: w.dmg, pr: w.pr, size: .14, hitR: .45, pierce: true, trail: .9, trailR: .4, life: .8 }); }
        }
        sfx(a, 'blade');
      };
      if (release && s.blade > 0) { const charged = s.blade >= w.charge; s.blade = 0; if (s.cd <= 0 || charged) { s.cd = 1 / w.rate; slash(charged); } }
      break;
    }
  }
}
function sfx(a, kind) {
  const d = G.me ? Math.hypot(G.me.x - a.x, G.me.z - a.z) : 0, g = a === G.me ? 1 : clamp(1 - d / 40, 0, 1) * .6;
  if (g > .02) AU.shot(kind === 'gun' ? 'gun' : kind, g);
  if (a !== G.me && a.team !== G.me?.team) { a.revealed = true; a.revealT = 1.2; }
}

// ================= サブ =================
function throwSub(a) {
  if (a.dead || a.dive) return false;
  const sd = SUBS[a.w.sub]; if (!useInk(a, sd.ink)) return false;
  const from = muzzle(a), d = aimFrom(a, from), k = a.w.sub;
  const yaw = Math.atan2(d.x, d.z), pit = clamp(Math.asin(d.y) + .38, -.2, 1.1), cp = Math.cos(pit), v = k === 'slide' ? 13 : 12.5;
  const vel = k === 'slide' ? [Math.sin(yaw) * v, 1, Math.cos(yaw) * v] : [Math.sin(yaw) * cp * v, Math.sin(pit) * v, Math.cos(yaw) * cp * v];
  if (k === 'bomb' || k === 'sticky' || k === 'slide') shoot({ kind: k, x: from.x, y: from.y, z: from.z, vx: vel[0], vy: vel[1], vz: vel[2], team: a.team, owner: a, size: .2, fuse: k === 'bomb' ? 1.0 : k === 'sticky' ? 1.9 : 2.4 });
  else if (k === 'fountain') shoot({ kind: 'fountainT', x: from.x, y: from.y, z: from.z, vx: vel[0], vy: vel[1], vz: vel[2], team: a.team, owner: a, size: .2, fuse: 99 });
  else if (k === 'shield') addDevice({ kind: 'shield', team: a.team, owner: a, x: a.x + Math.sin(a.aimYaw) * 1.8, z: a.z + Math.cos(a.aimYaw) * 1.8, yaw: a.aimYaw, life: 6, hp: 600 });
  else if (k === 'mine') { for (const m of a.mines) m.dead = true; const m = addDevice({ kind: 'mine', team: a.team, owner: a, x: a.x, z: a.z, life: 25, hp: 40, arm: .5 }); a.mines = [m]; paintBy(a, a.x, a.y + .2, a.z, 1.2, a.team); }
  AU.ui();
  return true;
}
function addFountain(p) { addDevice({ kind: 'fountain', team: p.team, owner: p.owner, x: p.x, z: p.z, y: p.y - p.size, life: 9, hp: 60 }); }
function addDevice(o) {
  const d = Object.assign({ t: 0, dead: false, y: hAt(o.x, o.z) }, o);
  const g = new T.Group(), J = tmat(d.team).jelly;
  if (d.kind === 'shield') { const m = new T.Mesh(new T.BoxGeometry(3.2, 2.3, .12), new T.MeshStandardMaterial({ color: teamColor(d.team), transparent: true, opacity: .55, roughness: .2 })); m.position.y = 1.15; g.add(m); g.rotation.y = d.yaw; }
  if (d.kind === 'mine') { const m = new T.Mesh(new T.CylinderGeometry(.28, .32, .1, 14), J); m.position.y = .05; g.add(m); }
  if (d.kind === 'fountain') { const m = new T.Mesh(new T.CylinderGeometry(.18, .26, .35, 10), J); m.position.y = .18; g.add(m); const t2 = new T.Mesh(new T.TorusGeometry(.22, .05, 6, 12), MAT.metal); t2.rotation.x = Math.PI / 2; t2.position.y = .36; g.add(t2); d.spin = t2; }
  if (d.kind === 'barrier') { const m = new T.Mesh(new T.SphereGeometry(d.r, 24, 16), new T.MeshStandardMaterial({ color: teamColor(d.team), transparent: true, opacity: .28, roughness: .1, side: T.DoubleSide, depthWrite: false })); m.position.y = 1; g.add(m); }
  if (d.kind === 'cloud') { const cm = new T.MeshStandardMaterial({ color: teamColor(d.team), roughness: .9, transparent: true, opacity: .85 }); for (let i = 0; i < 7; i++) { const m = new T.Mesh(new T.SphereGeometry(rand(.9, 1.5), 12, 8), cm); m.position.set(rand(-2, 2), 5 + rand(-.3, .4), rand(-2, 2)); g.add(m); } }
  if (d.kind === 'missile') { const m = new T.Mesh(new T.RingGeometry(1.8, 2.4, 32), new T.MeshBasicMaterial({ color: teamColor(d.team), transparent: true, opacity: .7, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = .06; g.add(m); const r2 = new T.Mesh(new T.CylinderGeometry(.18, .18, 1.2, 8), J); r2.position.y = 30; g.add(r2); d.rocket = r2; }
  g.position.set(d.x, d.y, d.z); scene.add(g); d.mesh = g; devices.push(d); return d;
}
function stepDevices(dt) {
  for (let i = devices.length - 1; i >= 0; i--) {
    const d = devices[i]; d.t += dt;
    if (d.hp !== undefined && d.hp <= 0 && d.kind !== 'missile') { burst(d.x, d.y + .5, d.z, d.team, 12, .8); d.dead = true; }
    if (d.t > d.life) d.dead = true;
    if (!d.dead) {
      if (d.kind === 'fountain') {
        d.spin.rotation.z += dt * 8; d.acc = (d.acc || 0) + dt;
        while (d.acc > .09) { d.acc -= .09; const a = Math.random() * TAU, v = rand(3, 7.5); shoot({ x: d.x, y: d.y + .45, z: d.z, vx: Math.sin(a) * v, vy: rand(2, 5), vz: Math.cos(a) * v, g: 18, team: d.team, owner: d.owner, dmg: 9, pr: .62, size: .1, life: 2 }); }
      }
      if (d.kind === 'mine') {
        d.arm -= dt;
        if (d.arm <= 0 && !d.trig) for (const o of actors) if (!o.dead && o.team !== d.team && Math.hypot(o.x - d.x, o.z - d.z) < 1.7 && Math.abs(o.y - d.y) < 1.5) { d.trig = .3; break; }
        if (d.trig) { d.trig -= dt; d.mesh.scale.setScalar(1 + Math.sin(d.t * 40) * .2); if (d.trig <= 0) { const s = SUB_FX.mine; explode(d.x, d.y + .2, d.z, s.r, s.dmax, s.dmin, d.team, d.owner, s.pr); d.dead = true; } }
        d.mesh.visible = !G.me || G.me.team === d.team || !!d.trig;
      }
      if (d.kind === 'cloud') {
        d.acc = (d.acc || 0) + dt;
        while (d.acc > .06) { d.acc -= .06; const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 3.6; shoot({ x: d.x + Math.cos(a) * r, y: d.y + 4.6, z: d.z + Math.sin(a) * r, vx: 0, vy: -10, vz: 0, g: 10, team: d.team, owner: d.owner, dmg: 7, pr: .7, size: .1, life: 2 }); }
        d.mesh.rotation.y += dt * .3;
      }
      if (d.kind === 'barrier') d.mesh.children[0].scale.setScalar(Math.min(1, d.t * 4) * (1 + Math.sin(d.t * 6) * .02));
      if (d.kind === 'missile') {
        if (d.t < 1.0 && d.target && !d.target.dead) { d.x = d.target.x; d.z = d.target.z; d.y = hAt(d.x, d.z); d.mesh.position.set(d.x, d.y, d.z); }
        d.rocket.position.y = Math.max(0, 30 * (1 - d.t / 1.5)); d.mesh.children[0].material.opacity = .4 + .4 * Math.abs(Math.sin(d.t * 10));
        if (d.t >= 1.5) { explode(d.x, d.y + .3, d.z, 2.7, 150, 40, d.team, d.owner, 3); d.dead = true; }
      }
    }
    if (d.dead) { scene.remove(d.mesh); d.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); }); devices.splice(i, 1); }
  }
}

// ================= スペシャル =================
const beamMesh = new T.Mesh(new T.CylinderGeometry(.55, .55, 1, 12, 1, true), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 }));
const beamMeshes = new Map();
function useSpecial(a) {
  if (a.dead || a.sp < 1 || a.spOn || a.dive) return false;
  const k = a.w.sp; a.sp = 0; a.spOn = { kind: k, t: 0 };
  if (a === G.me) { AU.sp(); showMsg(SPECIALS[k].name + '！', '', .9); }
  else if (G.me && Math.hypot(G.me.x - a.x, G.me.z - a.z) < 35) AU.sp();
  if (k === 'beam') { a.spOn.dur = 3.6; a.spOn.slow = .3; }
  if (k === 'rain') { const p = a.aimPt || new T.Vector3(a.x + Math.sin(a.aimYaw) * 15, 0, a.z + Math.cos(a.aimYaw) * 15); let tx = p.x, tz = p.z; const dd = Math.hypot(tx - a.x, tz - a.z); if (dd > 30) { tx = a.x + (tx - a.x) * 30 / dd; tz = a.z + (tz - a.z) * 30 / dd; } addDevice({ kind: 'cloud', team: a.team, owner: a, x: tx, z: tz, life: 6.5 }); a.spOn.dur = .3; }
  if (k === 'slam') { a.vy = 11; a.onGround = false; a.spOn.dur = 3; a.spOn.slow = .4; }
  if (k === 'barrier') { addDevice({ kind: 'barrier', team: a.team, owner: a, x: a.x, z: a.z, life: 5.5, r: 3.4 }); a.spOn.dur = .3; }
  if (k === 'missile') { const targets = actors.filter(o => !o.dead && o.team !== a.team).sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z)).slice(0, 4); for (const t of targets) addDevice({ kind: 'missile', team: a.team, owner: a, x: t.x, z: t.z, target: t, life: 2 }); a.spOn.dur = .3; }
  if (k === 'armor') { for (const o of actors) if (!o.dead && o.team === a.team && Math.hypot(o.x - a.x, o.z - a.z) < 30) { o.armor = 40; o.armorT = 9; burst(o.x, o.y + 1, o.z, o.team, 10, .6); } a.spOn.dur = .3; }
  return true;
}
function stepSpecial(a, dt) {
  const s = a.spOn; if (!s) return;
  s.t += dt;
  if (s.kind === 'beam') {
    let m = beamMeshes.get(a); if (!m) { m = beamMesh.clone(); m.material = beamMesh.material.clone(); m.material.color.set(teamColor(a.team)); scene.add(m); beamMeshes.set(a, m); }
    const from = muzzle(a), d = aimFrom(a, from);
    s.acc = (s.acc || 0) + dt;
    let end;
    if (s.acc > .1) { s.acc = 0; end = hitscan(a, from, d, 60, 28, 1.15, a.team, .6, true); s.end = end; }
    end = s.end || from.clone().addScaledVector(d, 20);
    const L = end.distanceTo(from); m.visible = true; m.scale.set(1 + Math.sin(s.t * 30) * .12, L, 1 + Math.sin(s.t * 30) * .12);
    m.position.copy(from).lerp(end, .5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), end.clone().sub(from).normalize());
    if (a === G.me) G.shake = Math.max(G.shake, .06);
  }
  if (s.kind === 'slam') {
    if (s.t > .25 && a.onGround) { explode(a.x, a.y + .3, a.z, 5.2, 220, 50, a.team, a, 5.4); s.t = s.dur; }
  }
  if (s.t >= s.dur) { a.spOn = null; const m = beamMeshes.get(a); if (m) m.visible = false; }
}
