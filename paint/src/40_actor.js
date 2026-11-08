
// ================= 選手（オリジナルの「ペンキっ子」）・動き・体力・ペンキ =================
const HP_MAX = 100, INK_MAX = 100;
const SPEED = { walk: 5.4, swim: 9.6, blob: 3.2, enemy: 2.4 };
const GRAV = 19, JUMP_V = 6.6, SWIM_JUMP_V = 7.6;
const actors = [];

// ---------- 見た目 ----------
const MAT = {
  skin: new T.MeshStandardMaterial({ color: 0xffe2cc, roughness: .6 }),
  dark: new T.MeshStandardMaterial({ color: 0x23202b, roughness: .6 }),
  white: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .3 }),
  metal: new T.MeshStandardMaterial({ color: 0x9aa0aa, roughness: .35, metalness: .6 }),
  glass: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .1, transparent: true, opacity: .35 })
};
const teamMat = {};
function tmat(team) {
  if (!teamMat[team]) teamMat[team] = { jelly: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .25, metalness: .05 }), glow: new T.MeshBasicMaterial({ color: 0xffffff }) };
  return teamMat[team];
}
function refreshTeamMats() { for (const t of [1, 2]) { const c = G.pal[t - 1]; tmat(t).jelly.color.set(c); tmat(t).glow.color.set(c); } }
function weaponMesh(cls, team) {
  const g = new T.Group(), J = tmat(team).jelly, D = MAT.dark, M = MAT.metal;
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; g.add(m); return m; };
  const B = (w, h, d) => new T.BoxGeometry(w, h, d), C = (r1, r2, h, s = 10) => new T.CylinderGeometry(r1, r2, h, s);
  switch (cls) {
    case 'gun': case 'dual': add(B(.12, .14, .5), D, 0, 0, .15); add(C(.04, .04, .22), M, 0, .02, .48, Math.PI / 2); add(B(.1, .2, .1), J, 0, -.12, 0); add(C(.06, .06, .16), J, 0, .12, .05, Math.PI / 2); break;
    case 'cannon': add(C(.12, .14, .5), D, 0, 0, .15, Math.PI / 2); add(C(.15, .12, .14), J, 0, 0, .44, Math.PI / 2); add(B(.1, .2, .1), D, 0, -.15, 0); break;
    case 'roller': case 'brush': {
      const w = cls === 'roller' ? .9 : .38;
      add(C(.025, .025, 1.1), M, 0, .1, .45, Math.PI / 2.6); g.userData.head = add(cls === 'roller' ? C(.17, .17, w, 14) : B(w, .12, .22), J, 0, -.45, 1.0, 0, 0, cls === 'roller' ? Math.PI / 2 : 0);
      break; }
    case 'sniper': add(B(.1, .12, 1.0), D, 0, 0, .3); add(C(.05, .05, .3), J, 0, .1, .1, Math.PI / 2); add(C(.03, .03, .2), M, 0, .1, .35, Math.PI / 2); break;
    case 'bucket': add(C(.2, .15, .32, 12), J, 0, 0, .25); add(new T.TorusGeometry(.2, .015, 6, 16, Math.PI), M, 0, .1, .25); break;
    case 'gatling': add(B(.22, .22, .4), D, 0, 0, .1); for (let k = 0; k < 4; k++) add(C(.035, .035, .55), M, Math.cos(k * 1.57) * .06, Math.sin(k * 1.57) * .06, .5, Math.PI / 2); add(C(.08, .08, .2), J, 0, .17, 0); break;
    case 'parasol': { const can = add(new T.SphereGeometry(.62, 16, 8, 0, TAU, 0, Math.PI / 2.4), J, 0, 0, .55, -Math.PI / 2); can.material = J; g.userData.canopy = can; add(C(.025, .025, .6), M, 0, 0, .25, Math.PI / 2); break; }
    case 'bow': add(new T.TorusGeometry(.42, .03, 6, 20, Math.PI), J, 0, 0, .3, 0, Math.PI / 2, Math.PI / 2); add(C(.006, .006, .84), MAT.white, 0, 0, .3); break;
    case 'blade': add(B(.06, .1, .9), MAT.white, 0, 0, .55); add(B(.08, .1, .25), J, 0, 0, .05); break;
  }
  return g;
}
function buildModel(a) {
  const root = new T.Group(), body = new T.Group(); root.add(body);
  const J = tmat(a.team).jelly;
  const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, par = body) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; par.add(m); return m; };
  const S = (r, w = 16, h = 12) => new T.SphereGeometry(r, w, h);
  add(S(.36), J, 0, .52, 0, 1, 1.15, .95);                       // 体（ゼリー）
  add(S(.26), MAT.white, 0, .5, .14, 1, 1.05, .7);                // おなか
  const head = new T.Group(); head.position.set(0, 1.02, 0); body.add(head);
  add(S(.33), MAT.skin, 0, 0, 0, 1, .95, 1, head);              // 顔
  add(S(.3, 16, 10), J, 0, .12, -.02, 1.08, .8, 1.08, head);       // ペンキのかぶりもの
  const drop = add(new T.ConeGeometry(.12, .3, 12), J, 0, .42, -.05, 1, 1, 1, head); drop.rotation.x = -.4;  // てっぺんのしずく
  add(S(.08), J, 0, .33, -.15, 1, 1, 1, head);
  for (const s of [-1, 1]) { add(S(.075), MAT.white, s * .12, .0, .27, 1, 1.2, .6, head); add(S(.04), MAT.dark, s * .12, -.005, .315, 1, 1.3, .5, head); }
  for (const s of [-1, 1]) { const f = add(S(.13), MAT.dark, s * .16, .08, .03, 1, .7, 1.4); f.userData.foot = s; }
  const tank = add(new T.CylinderGeometry(.13, .13, .38, 12), MAT.glass, 0, .66, -.32);
  const inkIn = add(new T.CylinderGeometry(.11, .11, .36, 12), J, 0, .66, -.32);
  const wp = weaponMesh(a.w.cls, a.team); wp.position.set(.3, .62, .2); body.add(wp);
  if (a.w.cls === 'dual') { const w2 = weaponMesh('dual', a.team); w2.position.set(-.3, .62, .2); body.add(w2); a.wp2 = w2; }
  // もぐった姿：ペンキの水たまり
  const puddle = new T.Group(); root.add(puddle);
  const pm = new T.Mesh(new T.CircleGeometry(.55, 20), J); pm.rotation.x = -Math.PI / 2; pm.position.y = .03; pm.scale.set(1, 1.3, 1); puddle.add(pm);
  for (const s of [-1, 1]) { const e = new T.Mesh(S(.06), MAT.white); e.position.set(s * .1, .07, .25); puddle.add(e); }
  puddle.visible = false;
  // 名前（味方だけ）
  const tagC = document.createElement('canvas'); tagC.width = 256; tagC.height = 64;
  const tg = tagC.getContext('2d'); tg.font = '900 30px "M PLUS Rounded 1c", sans-serif'; tg.textAlign = 'center'; tg.lineWidth = 6; tg.strokeStyle = 'rgba(0,0,0,.7)'; tg.fillStyle = '#fff'; tg.strokeText(a.name, 128, 40); tg.fillText(a.name, 128, 40);
  const tex = new T.CanvasTexture(tagC); tex.colorSpace = T.SRGBColorSpace;
  const tag = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); tag.scale.set(1.6, .4, 1); tag.position.y = 1.85; tag.renderOrder = 5; root.add(tag);
  root.traverse(o => { if (o.isMesh) o.receiveShadow = false; });
  a.model = { root, body, head, puddle, tank, inkIn, wp, tag };
  scene.add(root);
}

// ---------- 作る・スタート位置 ----------
function makeActor(name, team, w, bot) {
  const a = { name, team, w, bot, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, aimYaw: 0, aimPitch: 0, hp: HP_MAX, ink: INK_MAX, sp: 0, spOn: null,
    dive: false, swim: false, onGround: true, dead: false, respawnT: 0, inv: 0, hurtT: 9, inkT: 9, armor: 0, armorT: 0, revealed: false,
    kills: 0, deaths: 0, painted: 0, ws: {}, lastHitBy: null, moveSpd: 0, mines: [], bob: 0, rollT: 0, slideT: 0, ai: null, target: null };
  buildModel(a); actors.push(a); return a;
}
function placeAtSpawn(a, k) {
  const s = SPAWN[a.team], col = (k % 4) - 1.5;
  a.x = s.x + col * 1.6; a.z = s.z + (a.team === 1 ? -.5 : .5) * (k > 3 ? 1 : 0); a.y = hAt(a.x, a.z);
  a.vx = a.vy = a.vz = 0; a.yaw = a.aimYaw = s.yaw; a.aimPitch = 0;
  a.hp = HP_MAX; a.ink = INK_MAX; a.dead = false; a.inv = 1.5; a.dive = a.swim = false; a.ws = {}; a.onGround = true; a.revealed = false;
  a.model.root.visible = true;
}

// ---------- 足もとのペンキ ----------
function groundTeam(a) { return a.onGround ? paintAtCell(a.x, a.z) : 0; }

// ---------- 動き（自分もCPUも同じ） ----------
// ctl：{ mx, mz（世界の向きの移動。長さ0〜1）, dive, jump }
function stepMove(a, dt, ctl) {
  if (a.dead) return;
  const gt = groundTeam(a), enemyInk = gt && gt !== a.team, ownInk = gt === a.team;
  const busy = a.ws.busy || 0;                              // 撃っている間などの重さ
  a.dive = !!ctl.dive && !a.spOn && a.onGround !== null && !(a.ws.rolling) && !(a.ws.charge > .05 && a.w.cls === 'sniper');
  a.swim = a.dive && ownInk;
  let spd = SPEED.walk * a.w.spd;
  if (a.dive) spd = a.swim ? SPEED.swim : SPEED.blob;
  else if (a.ws.rolling) spd = SPEED.walk * (a.w.rollSpd || 1);
  else spd *= 1 - busy;
  if (enemyInk && !a.swim) spd = Math.min(spd, SPEED.enemy);
  if (a.spOn && a.spOn.slow) spd *= a.spOn.slow;
  // 二丁拳銃のスライド
  if (a.slideT > 0) { a.slideT -= dt; spd = 0; }
  let mx = ctl.mx || 0, mz = ctl.mz || 0;
  const want = Math.hypot(mx, mz);
  const acc = a.onGround ? (a.swim ? 14 : 22) : 6;
  if (a.slideT <= 0) {
    a.vx += (mx * spd - a.vx) * Math.min(1, acc * dt);
    a.vz += (mz * spd - a.vz) * Math.min(1, acc * dt);
  }
  // ジャンプ（もぐっていると高く）
  if (ctl.jump && a.onGround) { a.vy = a.swim ? SWIM_JUMP_V : JUMP_V; a.onGround = false; }
  a.vy -= GRAV * dt;
  // 横の移動：段差が高すぎる所へは入れない（x と z を別々に）
  const tryMove = (nx, nz) => {
    const h = hAround(nx, nz);
    if (h > a.y + STEP) return false;
    const zone = SPAWN_ZONE[3 - a.team];                    // 相手のスタート台には入れない
    if (nx > zone[0] - .4 && nx < zone[2] + .4 && nz > zone[1] - .4 && nz < zone[3] + .4) return false;
    return true;
  };
  const nx = a.x + a.vx * dt, nz = a.z + a.vz * dt;
  if (tryMove(nx, nz)) { a.x = nx; a.z = nz; }
  else if (tryMove(nx, a.z)) { a.x = nx; a.vz *= .5; }
  else if (tryMove(a.x, nz)) { a.z = nz; a.vx *= .5; }
  else { a.vx *= .2; a.vz *= .2; a.blocked = (a.blocked || 0) + dt; }
  // たての動き
  const floor = hAround(a.x, a.z, .25);
  a.y += a.vy * dt;
  if (a.y <= floor) {
    if (!a.onGround && a.vy < -4 && a === G.me) AU.splat(.5);
    a.y = floor; a.vy = 0; a.onGround = true;
  } else if (a.y > floor + .05) a.onGround = false;
  if (a.onGround && floor < -5) a.onGround = false;
  // 水に落ちた
  if (a.y < -1.6) { kill(a, null, 'water'); return; }
  a.moveSpd = Math.hypot(a.vx, a.vz);
  // 向き：止まっていても、ねらいの向きへ
  const faceYaw = (a.dive && a.moveSpd > .5) ? Math.atan2(a.vx, a.vz) : a.aimYaw;
  a.yaw += angD(faceYaw - a.yaw) * Math.min(1, dt * 14);
  // ペンキ・体力の回復
  a.inkT += dt; a.hurtT += dt;
  if (a.swim) a.ink = Math.min(INK_MAX, a.ink + 42 * dt);
  else if (a.inkT > .6) a.ink = Math.min(INK_MAX, a.ink + (a.dive ? 9 : 7) * dt);
  if (enemyInk && !a.swim && a.onGround) { if (a.hp > 40) { a.hp -= 4 * dt; a.hurtT = Math.min(a.hurtT, 0); } }
  else if (a.hurtT > 1.2 && a.hp < HP_MAX) a.hp = Math.min(HP_MAX, a.hp + 32 * dt);
  if (a.inv > 0) a.inv -= dt;
  if (a.armorT > 0) { a.armorT -= dt; if (a.armorT <= 0) a.armor = 0; }
  // もぐった音
  if (a === G.me) { if (a.swim && !a.wasSwim) AU.dive(); a.wasSwim = a.swim; }
}

// ---------- ダメージ・やられる・復活 ----------
function hurt(a, dmg, src, kind) {
  if (a.dead || a.inv > 0 || G.state !== 'play') return false;
  if (src && src.team === a.team) return false;
  if (inBarrier(a)) return false;
  if (a.armor > 0) { const used = Math.min(a.armor, dmg); a.armor -= used; dmg -= used; burst(a.x, a.y + 1, a.z, a.team, 6, .5); if (dmg <= 0) return true; }
  a.hp -= dmg; a.hurtT = 0; a.lastHitBy = src; a.hitN = (a.hitN || 0) + 1;
  if (a === G.me) { AU.hurt(); G.hurtFlash = Math.min(1, G.hurtFlash + dmg / 60); }
  if (src === G.me) { AU.hit(); G.hitMark = .18; }
  if (a.hp <= 0) { kill(a, src, kind); return true; }
  return true;
}
function kill(a, src, kind) {
  if (a.dead) return;
  a.dead = true; a.hp = 0; a.deaths++; a.respawnT = G.mode === 'practice' && a.dummy ? 2 : 5.5;
  a.sp *= .5; a.spOn = null; a.ws = {}; a.dive = a.swim = false;
  a.model.root.visible = false;
  const killer = src && src.team !== a.team ? src : a.lastHitBy;
  const kt = killer ? killer.team : 3 - a.team;
  paintCircle(a.x, a.y + .3, a.z, 1.9, kt);
  burst(a.x, a.y + .8, a.z, kt, 26, 1.4);
  AU.die();
  if (killer && killer.team !== a.team) { killer.kills++; if (killer === G.me) { AU.kill(); G.hitMark = .45; G.killMark = .45; } }
  if (kind === 'water') feed(`${a.name} は水に落ちた`, a.team);
  else if (killer) feed(`${killer.name} が ${a.name} をたおした`, killer.team);
  for (const m of a.mines) m.dead = true;
  a.mines = [];
  if (a === G.me) { G.killedBy = killer ? killer.name : ''; showMsg('やられた…', '', 1.2); }
}
function respawn(a) {
  const k = actors.filter(o => o.team === a.team).indexOf(a);
  placeAtSpawn(a, k);
  if (a.dummy) { a.x = a.home.x; a.z = a.home.z; a.y = hAt(a.x, a.z); a.yaw = a.home.yaw; }
}

// ---------- 見た目の更新 ----------
function syncModel(a, dt, viewer) {
  const m = a.model;
  if (a.dead) { m.root.visible = false; return; }
  m.root.visible = true;
  m.root.position.set(a.x, a.y, a.z);
  m.root.rotation.y = a.yaw;
  const hidden = a.dive && a.swim && viewer && a.team !== viewer.team && !a.revealed;
  m.body.visible = !a.dive;
  m.puddle.visible = a.dive && !hidden;
  m.tag.visible = !a.dive && viewer && a.team === viewer.team && a !== viewer;
  if (a.dive) {
    const s = a.swim ? 1 : .8;
    m.puddle.scale.set(s, 1, s * (1 + Math.min(.6, a.moveSpd * .06)));
    m.puddle.children[1].visible = m.puddle.children[2].visible = !a.swim || a.moveSpd < 1;
  } else {
    a.bob += dt * (a.onGround ? a.moveSpd * 2.2 : 0);
    const sq = a.onGround ? 1 + Math.sin(a.bob * 2) * .05 * Math.min(1, a.moveSpd / 4) : 1 + clamp(a.vy * .03, -.12, .12);
    m.body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    m.body.children.forEach(c => { if (c.userData.foot) c.position.z = .03 + Math.sin(a.bob * 2 + (c.userData.foot > 0 ? 0 : Math.PI)) * .12 * Math.min(1, a.moveSpd / 3); });
    m.head.rotation.x = -a.aimPitch * .4;
    m.wp.rotation.x = -a.aimPitch * .8;
    if (a.wp2) a.wp2.rotation.x = -a.aimPitch * .8;
  }
  m.inkIn.scale.y = Math.max(.02, a.ink / INK_MAX); m.inkIn.position.y = .66 - (1 - a.ink / INK_MAX) * .18;
  // 無敵（復活直後）・アーマーは点滅
  const blink = a.inv > 0 ? (Math.sin(clock * 30) > 0) : true;
  m.body.visible = m.body.visible && blink;
}

// ================= しぶき（粒子） =================
const FXN = 700;
const fxMesh = new T.InstancedMesh(new T.SphereGeometry(1, 6, 4), new T.MeshStandardMaterial({ roughness: .3 }), FXN);
fxMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); fxMesh.frustumCulled = false;
fxMesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(FXN * 3), 3);
const fx = []; let fxHead = 0;
for (let i = 0; i < FXN; i++) fx.push({ life: 0 });
const _m4 = new T.Matrix4(), _c = new T.Color(), _q = new T.Quaternion(), _s = new T.Vector3(), _p = new T.Vector3();
function particle(x, y, z, vx, vy, vz, team, size, life) {
  const idx = fxHead, f = fx[idx]; fxHead = (fxHead + 1) % FXN;
  Object.assign(f, { x, y, z, vx, vy, vz, team, size, life, max: life });
  _c.set(G.pal[team - 1] || '#ffffff'); fxMesh.setColorAt(idx, _c);
}
function burst(x, y, z, team, n, sp = 1) {
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, u = Math.random(); particle(x, y, z, Math.cos(a) * sp * 4 * u, rand(1.5, 5) * sp, Math.sin(a) * sp * 4 * u, team, rand(.06, .16), rand(.35, .7)); }
}
function updFx(dt) {
  for (let i = 0; i < FXN; i++) {
    const f = fx[i];
    if (f.life <= 0) { _m4.makeScale(0, 0, 0); fxMesh.setMatrixAt(i, _m4); continue; }
    f.life -= dt; f.vy -= 16 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt;
    const g = hAt(f.x, f.z); if (f.y < g) { f.y = g + .01; f.vx *= .3; f.vz *= .3; f.vy = 0; }
    const s = f.size * Math.min(1, f.life / f.max * 2);
    _m4.compose(_p.set(f.x, f.y, f.z), _q, _s.set(s, s, s)); fxMesh.setMatrixAt(i, _m4);
  }
  fxMesh.instanceMatrix.needsUpdate = true; if (fxMesh.instanceColor) fxMesh.instanceColor.needsUpdate = true;
}
