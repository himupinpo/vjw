
// ================= 選手（オリジナルの「ペンキっ子」）・動き・体力・ペンキ =================
const HP_MAX = 100, INK_MAX = 100;
const SPEED = { walk: 5.4, swim: 9.6, blob: 3.2, enemy: 2.4, climb: 7 };
const GRAV = 19, JUMP_V = 6.6, SWIM_JUMP_V = 7.6;
const actors = [];

// ---------- 見た目 ----------
const MAT = {
  skin: new T.MeshStandardMaterial({ color: 0xffe2cc, roughness: .6 }),
  dark: new T.MeshStandardMaterial({ color: 0x23202b, roughness: .6 }),
  white: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .3 }),
  metal: new T.MeshStandardMaterial({ color: 0x9aa0aa, roughness: .35, metalness: .6 }),
  wood: new T.MeshStandardMaterial({ color: 0xb08050, roughness: .7 }),
  red: new T.MeshStandardMaterial({ color: 0xd83a3a, roughness: .4 }),
  glass: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .1, transparent: true, opacity: .35 })
};
// ふちが明るく光るゼリー（どの背景でもキャラが見分けやすい）
function rimify(m) {
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += diffuseColor.rgb * pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 2.5) * 0.55;`);
  };
  return m;
}
const teamMat = {};
function tmat(team) {
  if (!teamMat[team]) teamMat[team] = { jelly: rimify(new T.MeshStandardMaterial({ color: 0xffffff, roughness: .25, metalness: .05 })), jellyDS: rimify(new T.MeshStandardMaterial({ color: 0xffffff, roughness: .3, metalness: .05, side: T.DoubleSide })), glow: new T.MeshBasicMaterial({ color: 0xffffff }) };
  return teamMat[team];
}
// かざり（頭につける。CPU はランダム、自分はタイトルで選ぶ）
const ACC = [['none', 'なし'], ['band', 'はちまき'], ['cap', 'キャップ'], ['goggle', 'ゴーグル'], ['ribbon', 'リボン'], ['phones', 'ヘッドホン'], ['leaf', 'はっぱ'], ['crown', 'かんむり']];
const ACC_COL = [0xffffff, 0x2a2733, 0xffd23f, 0x3fb6ff, 0xff7a3f, 0x7ad65a, 0xb07bff];
const ACC_MAT = {};
const accMat = c => ACC_MAT[c] || (ACC_MAT[c] = new T.MeshStandardMaterial({ color: c, roughness: .45, metalness: .05 }));
function accessoryMesh(kind, col) {
  const g = new T.Group(), M = accMat(col), D = MAT.dark;
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m; };
  switch (kind) {
    case 'band': add(new T.TorusGeometry(.33, .045, 8, 28), M, 0, .06, 0, Math.PI / 2); add(new T.BoxGeometry(.05, .2, .02), M, -.05, -.03, -.34, 0, 0, .5); add(new T.BoxGeometry(.05, .22, .02), M, .05, -.04, -.34, 0, 0, -.4); break;
    case 'cap': add(new T.SphereGeometry(.31, 16, 8, 0, TAU, 0, Math.PI / 2), M, 0, .1, -.01, 0, 0, 0, 1.08, .85, 1.08); add(new T.CylinderGeometry(.2, .2, .03, 16, 1, false, -Math.PI / 2, Math.PI), M, 0, .11, .22, 0, 0, 0, 1.2, 1, 1.1); break;
    case 'goggle': add(new T.TorusGeometry(.33, .03, 6, 28), D, 0, .13, 0, Math.PI / 2 - .12); for (const s of [-1, 1]) { add(new T.TorusGeometry(.075, .028, 8, 16), M, s * .1, .2, .3, -.35); add(new T.CircleGeometry(.07, 16), MAT.glass, s * .1, .2, .305, -.35); } break;
    case 'ribbon': for (const s of [-1, 1]) add(new T.ConeGeometry(.09, .2, 10), M, .22 + s * .1, .28, .02, 0, 0, s * Math.PI / 2, 1, 1, .6); add(new T.SphereGeometry(.05, 10, 8), M, .22, .28, .02); break;
    case 'phones': add(new T.TorusGeometry(.35, .03, 6, 24, Math.PI), D, 0, .05, 0); for (const s of [-1, 1]) add(new T.CylinderGeometry(.11, .11, .08, 14), M, s * .34, .02, 0, 0, 0, Math.PI / 2); break;
    case 'leaf': add(new T.CylinderGeometry(.012, .012, .14, 6), accMat(0x4a8a3a), .06, .4, .02, 0, 0, -.3); add(new T.SphereGeometry(.08, 10, 6), accMat(0x5ec24a), .13, .48, .02, 0, 0, -.6, 1, .35, .6); break;
    case 'crown': {
      const cg = new T.Group(); cg.position.set(-.1, .34, .02); cg.rotation.z = .25; g.add(cg);
      const gm = ACC_MAT.gold || (ACC_MAT.gold = new T.MeshStandardMaterial({ color: 0xffcf3a, roughness: .3, metalness: .6, side: T.DoubleSide }));
      const ring = new T.Mesh(new T.CylinderGeometry(.15, .15, .1, 16, 1, true), gm); ring.castShadow = true; cg.add(ring);
      for (let k = 0; k < 5; k++) { const ang = k / 5 * TAU, sp = new T.Mesh(new T.ConeGeometry(.035, .09, 6), gm); sp.position.set(Math.cos(ang) * .15, .095, Math.sin(ang) * .15); cg.add(sp); }
      break; }
  }
  return g;
}
function refreshTeamMats() { for (const t of [1, 2]) { const c = G.pal[t - 1]; tmat(t).jelly.color.set(c); tmat(t).jellyDS.color.set(c); tmat(t).glow.color.set(c); } }
// 両手で持つブキ（左手もブキにそえる）
const TWO_HAND = new Set(['roller', 'brush', 'sniper', 'gatling', 'bucket', 'parasol', 'bow', 'hose', 'cannon', 'blade']);
// 当たった相手のペンキがつく場所（体と顔のまわり）。[x, y, z, 中心y]
const SPLAT_AT = [[.2, .62, .25, .52], [-.24, .44, .22, .52], [.34, .58, -.02, .52], [-.33, .7, -.1, .52], [.13, 1.1, .26, 1.02], [-.25, .98, .17, 1.02], [.04, .32, .3, .52], [.22, .86, -.18, .52]];
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
  const eyes = [];
  for (const s of [-1, 1]) { const e = new T.Group(); e.position.set(s * .12, 0, .27); head.add(e); eyes.push(e); add(S(.075), MAT.white, 0, 0, 0, 1, 1.2, .6, e); add(S(.04), MAT.dark, 0, -.005, .045, 1, 1.3, .5, e); }
  const feet = [];
  for (const s of [-1, 1]) { const f = add(S(.13), MAT.dark, s * .16, .08, .03, 1, .7, 1.4); f.userData.foot = s; feet.push(f); }
  const tank = add(new T.CylinderGeometry(.13, .13, .38, 12), MAT.glass, 0, .66, -.32);
  const inkIn = add(new T.CylinderGeometry(.11, .11, .36, 12), J, 0, .66, -.32);
  // ブキは右手（後ろから見て右）。二丁拳銃は左手にも
  const wp = weaponMesh(a.w, a.team); wp.position.set(-.3, .62, .2); body.add(wp);
  a.wp2 = null;
  if (a.w.cls === 'dual') { const w2 = weaponMesh(a.w, a.team); w2.position.set(.3, .62, .2); body.add(w2); a.wp2 = w2; }
  // 腕（肩を軸に回す）と手
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new T.Group(); sh.position.set(s * .3, .8, .02); body.add(sh);
    add(new T.CapsuleGeometry(.065, .17, 4, 8), J, 0, -.14, 0, 1, 1, 1, sh);
    add(S(.075, 10, 8), MAT.white, 0, -.3, 0, 1, 1, 1, sh);
    sh.userData.side = s; arms.push(sh);
  }
  // かざり
  if (a.acc && a.acc !== 'none') head.add(accessoryMesh(a.acc, a.accCol ?? 0xffffff));
  // 当たった相手のペンキ（体力がへるほど増え、回復すると消える）
  const splats = [], EJ = tmat(3 - a.team).jelly, _n = new T.Vector3(), _z = new T.Vector3(0, 0, 1);
  for (const [x, y, z, cy] of SPLAT_AT) {
    const m = new T.Mesh(S(.13, 10, 6), EJ); m.position.set(x * 1.04, cy + (y - cy) * 1.04, z * 1.04);
    _n.set(x, y - cy, z).normalize(); m.quaternion.setFromUnitVectors(_z, _n);
    m.userData.s = rand(.8, 1.3); m.scale.setScalar(.001); m.visible = false; body.add(m); splats.push(m);
  }
  splats.sort(() => Math.random() - .5);
  // 撃たれた瞬間に白く光る
  const flash = new T.Mesh(S(.5, 14, 10), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
  flash.position.y = .7; flash.scale.set(1, 1.35, 1); flash.visible = false; body.add(flash);
  // もぐった姿：ペンキの水たまり
  const puddle = new T.Group(); root.add(puddle);
  const pm = new T.Mesh(new T.CircleGeometry(.55, 20), J); pm.rotation.x = -Math.PI / 2; pm.position.y = .03; pm.scale.set(1, 1.3, 1); puddle.add(pm);
  for (const s of [-1, 1]) { const e = new T.Mesh(S(.06), MAT.white); e.position.set(s * .1, .07, .25); puddle.add(e); }
  puddle.visible = false;
  a.seed = Math.random() * 10; a.blinkT = rand(1, 4);
  // 名前（味方だけ）
  const tagC = document.createElement('canvas'); tagC.width = 256; tagC.height = 64;
  const tg = tagC.getContext('2d'); tg.font = '900 30px "M PLUS Rounded 1c", sans-serif'; tg.textAlign = 'center'; tg.lineWidth = 6; tg.strokeStyle = 'rgba(0,0,0,.7)'; tg.fillStyle = '#fff'; tg.strokeText(a.name, 128, 40); tg.fillText(a.name, 128, 40);
  const tex = new T.CanvasTexture(tagC); tex.colorSpace = T.SRGBColorSpace;
  const tag = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); tag.scale.set(1.6, .4, 1); tag.position.y = 1.85; tag.renderOrder = 5; root.add(tag);
  // 目印（マーカーダーツ）：かべごしでも見える三角
  const mark = new T.Mesh(new T.ConeGeometry(.22, .4, 4), new T.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true })); mark.rotation.x = Math.PI; mark.position.y = 2.25; mark.renderOrder = 6; mark.visible = false; root.add(mark);
  // アーマーの光
  const aura = new T.Mesh(S(.75), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .18, depthWrite: false })); aura.position.y = .8; aura.scale.set(1, 1.3, 1); aura.visible = false; root.add(aura);
  a.model = { root, body, head, puddle, tank, inkIn, wp, tag, mark, aura, arms, feet, eyes, splats, flash };
  scene.add(root);
}

// ---------- 作る・スタート位置 ----------
function makeActor(name, team, w, bot) {
  const a = { name, team, w, bot, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, aimYaw: 0, aimPitch: 0, hp: HP_MAX, ink: INK_MAX, sp: 0, spOn: null,
    dive: false, swim: false, onGround: true, dead: false, respawnT: 0, inv: 0, hurtT: 9, inkT: 9, armor: 0, armorT: 0, revealed: false, revealT: 0,
    kills: 0, deaths: 0, painted: 0, ws: {}, lastHitBy: null, moveSpd: 0, mines: [], bob: 0, slideT: 0, ai: null, climb: null, sj: null,
    dashT: 0, fogT: 0, cloakT: 0, markT: 0, hitN: 0, icon: null,
    acc: bot || team !== 1 ? pick(ACC.slice(1))[0] : (SET.acc || 'none'), accCol: bot || team !== 1 ? pick(ACC_COL) : (SET.accCol ?? 0xffffff) };   // 自分だけ、きせかえで選んだもの
  buildModel(a); actors.push(a); return a;
}
function placeAtSpawn(a, k) {
  const s = SPAWN[a.team], col = (k % 4) - 1.5;
  a.x = s.x + col * 1.6; a.z = s.z + (a.team === 1 ? -.5 : .5) * (k > 3 ? 1 : 0); a.y = hAt(a.x, a.z);
  a.vx = a.vy = a.vz = 0; a.yaw = a.aimYaw = s.yaw; a.aimPitch = 0;
  a.hp = HP_MAX; a.ink = INK_MAX; a.dead = false; a.inv = 1.5; a.dive = a.swim = false; a.ws = {}; a.onGround = true; a.revealed = false;
  a.climb = null; a.sj = null; a.dashT = a.fogT = a.cloakT = a.markT = 0; a.slideT = 0;
  a.model.root.visible = true;
}

// ---------- 足もとのペンキ ----------
function groundTeam(a) { return a.onGround ? paintAtCell(a.x, a.z) : 0; }

// ---------- 壁をのぼる（自分の色の壁にもぐったまま進む） ----------
function tryClimb(a, dx, dz) {
  const l = Math.hypot(dx, dz); if (l < .1) return null;
  const px = a.x + dx / l * .5, pz = a.z + dz / l * .5, k = cellOf(px, pz);
  if (k < 0 || HG[k] <= a.y + STEP) return null;
  const bi = BX[k]; if (bi < 0) return null;
  const c = crossFace(bi, a.x, a.z, px, pz); if (!c) return null;
  if (wallTeamAt(c.f, c.hc, a.y + .35) !== a.team) return null;
  return { f: c.f, hc: c.hc };
}
function climbStep(a, dt, ctl) {
  const c = a.climb, f = c.f;
  const intoX = f.axis === 'x' ? -f.sign : 0, intoZ = f.axis === 'z' ? -f.sign : 0;
  const push = (ctl.mx || 0) * intoX + (ctl.mz || 0) * intoZ, lat = f.axis === 'x' ? (ctl.mz || 0) : (ctl.mx || 0);
  const off = () => { a.climb = null; a.vy = 0; a.onGround = false; a.swim = false; };
  if (!ctl.dive || push < .25) { off(); return; }
  c.hc = clamp(c.hc + lat * 3 * dt, f.a0 + .25, f.a1 - .25);
  if (f.axis === 'x') { a.x = f.c + f.sign * .3; a.z = c.hc; } else { a.z = f.c + f.sign * .3; a.x = c.hc; }
  if (wallTeamAt(f, c.hc, a.y + .45) !== a.team && a.y + .45 < f.y1) { off(); return; }
  a.y += SPEED.climb * dt; a.vy = 0; a.vx = a.vz = 0; a.dive = a.swim = true; a.onGround = false;
  a.ink = Math.min(INK_MAX, a.ink + 42 * dt);
  a.yaw = Math.atan2(intoX, intoZ); a.moveSpd = SPEED.climb;
  if (a.y >= f.y1 - .05) {   // 上にのる
    a.y = f.y1; a.climb = null; a.onGround = true; a.vy = 0;
    if (f.axis === 'x') a.x = f.c - f.sign * .45; else a.z = f.c - f.sign * .45;
  }
}

// ---------- スーパージャンプ（味方の所・スタート地点へ） ----------
const sjMarks = new Map();
function sjTarget(a) {
  const s = a.sj, t = s.tgt;
  if (t && t !== 'spawn' && !t.dead) { s.tx = t.x; s.tz = t.z; s.ty = t.onGround ? t.y : hAt(t.x, t.z); }
  else { const sp = SPAWN[a.team]; s.tx = sp.x + rand(-1, 1); s.tz = sp.z; s.ty = hAt(s.tx, s.tz); }
  if (s.ty < -5) { const sp = SPAWN[a.team]; s.tx = sp.x; s.tz = sp.z; s.ty = hAt(sp.x, sp.z); }
}
function startSuperJump(a, tgt) {
  if (a.dead || a.sj || a.spOn || carrierOf(a)) return false;
  a.sj = { t: 0, tgt, fx: a.x, fy: a.y, fz: a.z, tx: 0, ty: 0, tz: 0 };
  sjTarget(a); a.ws = {}; a.dive = a.swim = false; a.climb = null;
  let m = sjMarks.get(a);
  if (!m) {
    m = new T.Group();
    const ring = new T.Mesh(new T.RingGeometry(.8, 1.1, 24), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85, side: T.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .06; m.add(ring);
    const beam = new T.Mesh(new T.CylinderGeometry(.08, .08, 8, 6, 1, true), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .45, depthWrite: false })); beam.position.y = 4; m.add(beam);
    scene.add(m); sjMarks.set(a, m);
  }
  m.children.forEach(o => o.material.color.set(teamColor(a.team))); m.visible = true;
  if (a === G.me) AU.sj();
  return true;
}
const SJ_CH = .7, SJ_AIR = 1.7;
function stepSuperJump(a, dt) {
  const s = a.sj; s.t += dt;
  const m = sjMarks.get(a);
  if (s.t < SJ_CH) { a.vx = a.vz = 0; if (m) m.position.set(s.tx, s.ty, s.tz); return; }
  const u = clamp((s.t - SJ_CH) / SJ_AIR, 0, 1);
  if (u < .78) sjTarget(a);
  const e = u * u * (3 - 2 * u);
  a.x = lerp(s.fx, s.tx, e); a.z = lerp(s.fz, s.tz, e); a.y = lerp(s.fy, s.ty, u) + Math.sin(u * Math.PI) * 24;
  a.vx = a.vz = a.vy = 0; a.onGround = false; a.yaw = Math.atan2(s.tx - s.fx, s.tz - s.fz);
  if (m) { m.position.set(s.tx, s.ty, s.tz); m.children[0].scale.setScalar(1 + Math.sin(clock * 10) * .1); }
  if (u >= 1) {
    a.sj = null; a.onGround = true; a.y = s.ty; a.x = s.tx; a.z = s.tz;
    paintBy(a, a.x, a.y + .2, a.z, 1.9, a.team); burst(a.x, a.y + .3, a.z, a.team, 18, 1); ringFx(a.x, a.y, a.z, a.team, 2.6, .4);
    if (m) m.visible = false;
    if (a === G.me) AU.splat(1);
  }
}

// ---------- 動き（自分もCPUも同じ） ----------
// ctl：{ mx, mz（世界の向きの移動。長さ0〜1）, dive, jump }
function stepMove(a, dt, ctl) {
  if (a.dead) return;
  if (a.sj) { stepSuperJump(a, dt); timers(a, dt); return; }
  if (a.climb) { climbStep(a, dt, ctl); timers(a, dt); return; }
  const gt = groundTeam(a), enemyInk = gt && gt !== a.team && !(a.dashT > 0), ownInk = gt === a.team;
  const busy = a.ws.busy || 0;
  const vx0 = a.vx, vz0 = a.vz;
  a.dive = !!ctl.dive && !a.spOn && !(a.ws.rolling) && !ruleNoDive(a) && !(a.rollT > 0);
  a.swim = a.dive && ownInk;
  let spd = SPEED.walk * a.w.spd;
  if (a.dive) spd = a.swim ? SPEED.swim * (1 + (a.w.spd - 1) * .9) : SPEED.blob;   // 軽いブキほど速く泳げる（重いブキはおそい）
  else if (a.ws.rolling) spd = SPEED.walk * (a.w.rollSpd || 1) * (a.ws.rollMul || 1);
  else spd *= 1 - busy;
  if (enemyInk && !a.swim) spd = Math.min(spd, SPEED.enemy);
  if (a.spOn && a.spOn.slow) spd *= a.spOn.slow;
  if (a.dashT > 0) spd *= 1.6;
  if (a.fogT > 0) spd *= .55;
  if (a.cloakT > 0) spd *= 1.12;
  spd *= ruleSpeedMul(a);
  if (a.slideT > 0) { a.slideT -= dt; }
  let mx = ctl.mx || 0, mz = ctl.mz || 0;
  const acc = a.onGround ? (a.swim ? 14 : 22) : 6;
  if (a.slideT <= 0) {
    a.vx += (mx * spd - a.vx) * Math.min(1, acc * dt);
    a.vz += (mz * spd - a.vz) * Math.min(1, acc * dt);
  }
  if (ctl.jump && a.onGround) {
    const ml = Math.hypot(mx, mz), vl = Math.hypot(vx0, vz0);
    if (a.swim && vl > 5 && ml > .5 && (mx * vx0 + mz * vz0) / (ml * vl) < -.3 && !(a.rollCd > 0)) {
      // くるりターン：泳いでいる向きと逆へたおしてジャンプすると、くるっと回って飛び出す（出だしは少しかたい）
      a.vy = 7.6; a.onGround = false; a.vx = mx / ml * 8.5; a.vz = mz / ml * 8.5; a.slideT = .3;
      a.rollT = .5; a.rollArmor = .32; a.rollCd = .8; a.rollDir = (vx0 * mz - vz0 * mx) > 0 ? 1 : -1; a.dive = a.swim = false;
      burst(a.x, a.y + .3, a.z, a.team, 12, .9); ringFx(a.x, a.y, a.z, a.team, 1.6, .3);
      if (a === G.me) AU.roll();
    } else { a.vy = a.swim ? SWIM_JUMP_V : JUMP_V; a.onGround = false; }
  }
  a.vy -= GRAV * dt;
  // 横の移動：段差が高すぎる所へは入れない（x と z を別々に）
  const zone = SPAWN_ZONE[3 - a.team];
  const tryMove = (nx, nz) => {
    if (hAround(nx, nz) > a.y + STEP) return false;
    if (nx > zone[0] - .4 && nx < zone[2] + .4 && nz > zone[1] - .4 && nz < zone[3] + .4) return false;   // 相手のスタート台には入れない
    return true;
  };
  const nx = a.x + a.vx * dt, nz = a.z + a.vz * dt;
  if (tryMove(nx, nz)) { a.x = nx; a.z = nz; }
  else {
    // 自分の色の壁なら、もぐったまま進むとのぼれる
    if (a.dive) { const c = tryClimb(a, a.vx || mx, a.vz || mz); if (c) { a.climb = c; a.vx = a.vz = 0; timers(a, dt); return; } }
    if (tryMove(nx, a.z)) { a.x = nx; a.vz *= .5; }
    else if (tryMove(a.x, nz)) { a.z = nz; a.vx *= .5; }
    else { a.vx *= .2; a.vz *= .2; }
  }
  // たての動き
  const floor = hAround(a.x, a.z, .25);
  a.y += a.vy * dt;
  if (a.y <= floor) {
    if (!a.onGround && a.vy < -4) { a.landT = .16; if (a === G.me) AU.land(); }
    a.y = floor; a.vy = 0; a.onGround = true;
  } else if (a.y > floor + .05) a.onGround = false;
  if (a.onGround && floor < -5) a.onGround = false;
  if (a.y < -1.6) { kill(a, null, 'water'); return; }
  a.moveSpd = Math.hypot(a.vx, a.vz);
  // ジャンプ台
  if (a.onGround) for (const d of devices) if (d.kind === 'spring' && !d.dead && d.team === a.team && Math.hypot(d.x - a.x, d.z - a.z) < .9 && Math.abs(d.y - a.y) < .6) {
    a.vy = 13; a.onGround = false; const [fx, fz] = [Math.sin(a.yaw), Math.cos(a.yaw)]; a.vx += fx * 3; a.vz += fz * 3; d.bounce = .3; if (a === G.me) AU.ui();
  }
  // 向き：止まっていても、ねらいの向きへ
  const faceYaw = (a.dive && a.moveSpd > .5) ? Math.atan2(a.vx, a.vz) : a.aimYaw;
  a.yaw += angD(faceYaw - a.yaw) * Math.min(1, dt * 14);
  // ペンキ・体力の回復
  a.inkT += dt; a.hurtT += dt;
  if (a.fogT <= 0) {
    if (a.swim) a.ink = Math.min(INK_MAX, a.ink + 42 * dt);
    else if (a.inkT > .6) a.ink = Math.min(INK_MAX, a.ink + (a.dive ? 11 : 9) * dt);
  }
  if (a.dashT > 0) { a.ink = INK_MAX; a.dashAcc = (a.dashAcc || 0) + dt; if (a.dashAcc > .08 && a.onGround) { a.dashAcc = 0; paintBy(a, a.x, a.y + .2, a.z, 1.0, a.team); } }
  if (enemyInk && !a.swim && a.onGround) { if (a.hp > 40) { a.hp -= 4 * dt; a.hurtT = Math.min(a.hurtT, 0); } }
  else if (a.hurtT > 1.2 && a.hp < HP_MAX) a.hp = Math.min(HP_MAX, a.hp + 32 * dt);
  timers(a, dt);
  if (a === G.me) {
    if (a.swim && !a.wasSwim) AU.dive(); a.wasSwim = a.swim;
    // 足音・泳ぐ音
    if (a.onGround && a.moveSpd > 1.2) { a.stepT = (a.stepT || 0) - dt * a.moveSpd / (a.swim ? 6.5 : 4.6); if (a.stepT <= 0) { a.stepT = .36; AU.step(a.swim); } }
  }
}
function timers(a, dt) {
  if (a.inv > 0) a.inv -= dt;
  if (a.armorT > 0) { a.armorT -= dt; if (a.armorT <= 0) a.armor = 0; }
  if (a.dashT > 0) a.dashT -= dt;
  if (a.fogT > 0) a.fogT -= dt;
  if (a.cloakT > 0) a.cloakT -= dt;
  if (a.markT > 0) a.markT -= dt;
  if (a.rollT > 0) a.rollT -= dt; if (a.rollArmor > 0) a.rollArmor -= dt; if (a.rollCd > 0) a.rollCd -= dt;
  if (a.revealT > 0) { a.revealT -= dt; if (a.revealT <= 0) a.revealed = false; }
}

// ---------- ダメージ・やられる・復活 ----------
function hurt(a, dmg, src, kind) {
  if (a.dead || a.inv > 0 || G.state !== 'play') return false;
  if (src && src.team === a.team) return false;
  if (a.sj && a.sj.t > SJ_CH) return false;
  if (inBarrier(a)) return false;
  if (a.rollArmor > 0) dmg *= .5;   // くるりターンの出だし（ブレードのつっこみも）
  // ローラーをころがしている間は、大きなローラーが盾になって正面からのダメージが少し減る
  if (a.ws.rolling && a.w.cls === 'roller' && src && src !== a) { const [fx, fz] = [Math.sin(a.yaw), Math.cos(a.yaw)], dx = src.x - a.x, dz = src.z - a.z, l = Math.hypot(dx, dz) || 1; if ((dx * fx + dz * fz) / l > .35) dmg *= .6; }
  if (a.armor > 0) { const used = Math.min(a.armor, dmg); a.armor -= used; dmg -= used; burst(a.x, a.y + 1, a.z, a.team, 6, .5); if (dmg <= 0) return true; }
  a.hp -= dmg; a.hurtT = 0; a.lastHitBy = src; a.hitN = (a.hitN || 0) + 1; a.flashT = .16;
  if (a.cloakT > 0) { a.revealed = true; a.revealT = .8; }
  if (a === G.me) { AU.hurt(); G.hurtFlash = Math.min(1, G.hurtFlash + dmg / 60); if (src) addSplat(teamColor(src.team), dmg); }
  if (src === G.me) { AU.hit(); G.hitMark = .18; }
  if (a.hp <= 0) { kill(a, src, kind); return true; }
  return true;
}
function kill(a, src, kind) {
  if (a.dead) return;
  a.dead = true; a.hp = 0; a.deaths++; a.respawnT = a.dummy ? 2 : 5.5;
  a.sp *= .5; a.spOn = null; a.ws = {}; a.dive = a.swim = false; a.climb = null;
  if (a.sj) { a.sj = null; const m = sjMarks.get(a); if (m) m.visible = false; }
  a.dashT = a.cloakT = a.fogT = 0;
  a.model.root.visible = false;
  const killer = src && src.team !== a.team ? src : a.lastHitBy;
  const kt = killer ? killer.team : 3 - a.team;
  paintCircle(a.x, a.y + .3, a.z, 1.9, kt);
  burst(a.x, a.y + .8, a.z, kt, 26, 1.4); ringFx(a.x, Math.max(a.y, hAt(a.x, a.z)), a.z, kt, 3.2, .45);
  AU.die();
  if (killer && killer.team !== a.team) { killer.kills++; if (killer === G.me) { AU.kill(); G.hitMark = .45; G.killMark = .45; } }
  if (kind === 'water') feed(`${a.name} は落ちた`, a.team);
  else if (killer) feed(`${killer.name} が ${a.name} をたおした`, killer.team);
  for (const m of a.mines) m.dead = true;
  a.mines = [];
  if (a === G.me) { G.killedBy = killer ? killer.name : ''; showMsg('やられた…', '', 1.2); closeJumpUI(); }
}
function respawn(a) {
  const k = actors.filter(o => o.team === a.team).indexOf(a);
  placeAtSpawn(a, k);
  if (a.dummy) { a.x = a.home.x; a.z = a.home.z; a.y = hAt(a.x, a.z); a.yaw = a.home.yaw; a.inv = 0; }
  if (a.bot && a.ai) a.ai.spawned = true;
}

// ---------- 見た目の更新 ----------
function syncModel(a, dt, viewer) {
  const m = a.model;
  if (a.dead) { m.root.visible = false; return; }
  const enemyView = viewer && a.team !== viewer.team;
  const near = viewer ? Math.hypot(viewer.x - a.x, viewer.z - a.z) < 3 : false;
  const cloaked = enemyView && a.cloakT > 0 && !a.revealed && !near;
  m.root.visible = !cloaked && !(a === viewer && G.scopeT > .45);   // スコープでのぞいている間は、自分の体を見せない
  m.root.position.set(a.x, a.y, a.z);
  m.root.rotation.set(0, a.yaw, 0);
  const hidden = a.dive && a.swim && enemyView && !a.revealed && !(a.markT > 0);
  // もぐる瞬間・出る瞬間：しぶきと、ぷにっとした動き
  if (a.dive !== a.wasDive) {
    if (a.wasDive !== undefined && !hidden && !a.climb) { burst(a.x, a.y + .3, a.z, a.team, a.dive ? 6 : 8, a.dive ? .5 : .7); if (a.dive) a.popT = .14; else a.emergeT = .18; }
    a.wasDive = a.dive;
  }
  m.body.visible = !a.dive;
  m.puddle.visible = a.dive && !hidden;
  m.tag.visible = !a.dive && !!viewer && a.team === viewer.team && a !== viewer;
  m.mark.visible = !!enemyView && a.markT > 0;
  if (m.mark.visible) { m.mark.material.color.set(teamColor(viewer.team)); m.mark.position.y = 2.25 + Math.sin(clock * 5) * .1; }
  m.aura.visible = a.armor > 0 || a.dashT > 0 || a.rollArmor > 0;
  if (m.aura.visible) { m.aura.material.color.set(a.dashT > 0 || a.rollArmor > 0 ? '#ffffff' : teamColor(a.team)); m.aura.material.opacity = .12 + .08 * Math.sin(clock * 8); }
  if (a.climb) {
    // かべに張りついた水たまり
    m.puddle.rotation.set(-Math.PI / 2, 0, 0); m.puddle.position.set(0, .5, .25);
  } else { m.puddle.rotation.set(0, 0, 0); m.puddle.position.set(0, 0, 0); }
  if (a.dive) {
    const s = a.swim ? 1 : .8;
    let pop = 1; if (a.popT > 0) { a.popT -= dt; pop = 1 + a.popT * 2.5; }
    const wob = 1 + Math.sin(clock * 7 + a.seed) * .045;
    m.puddle.scale.set(s * pop * wob, 1, s * pop / wob * (1 + Math.min(.6, a.moveSpd * .06)));
    m.puddle.children[1].visible = m.puddle.children[2].visible = !a.swim || a.moveSpd < 1;
    // 泳いだあとのしぶき（見えているときだけ）
    if (a.swim && !a.climb && a.moveSpd > 3 && !hidden && G.state !== 'title') {
      a.wakeT = (a.wakeT || 0) - dt;
      if (a.wakeT <= 0) { a.wakeT = .05; particle(a.x - a.vx * .05 + rand(-.2, .2), a.y + .06, a.z - a.vz * .05 + rand(-.2, .2), -a.vx * .12 + rand(-.7, .7), rand(1.4, 2.6), -a.vz * .12 + rand(-.7, .7), a.team, rand(.05, .1), rand(.25, .4)); }
    }
  } else {
    const spd = a.onGround ? a.moveSpd : 0, k = Math.min(1, spd / 4), air = !a.onGround && !a.climb;
    a.bob += dt * spd * 2.2;
    const ph = a.bob * 2;
    let sq = a.onGround ? 1 + Math.sin(ph) * .05 * k : 1 + clamp(a.vy * .03, -.12, .12);
    if (a.landT > 0) { a.landT -= dt; sq *= 1 - a.landT * 1.5; }        // 着地でむにゅっ
    if (a.emergeT > 0) { a.emergeT -= dt; sq *= 1 + a.emergeT * 1.6; }  // ペンキから出たとき、びよーん
    if (a.sj && a.sj.t < SJ_CH) sq = .75 + Math.sin(a.sj.t * 30) * .05;
    sq *= 1 + Math.sin(clock * 2.4 + a.seed) * .012;                     // 息をする
    let wob = 0; if (a.flashT > 0) { a.flashT -= dt; wob = Math.sin(clock * 45) * a.flashT * .9; }   // 撃たれてぷるぷる
    m.body.scale.set((1 + wob) / Math.sqrt(sq), sq, (1 - wob) / Math.sqrt(sq));
    m.body.rotation.y = a.sj && a.sj.t >= SJ_CH ? a.sj.t * 14 : a.rollT > 0 ? (1 - a.rollT / .5) * TAU * (a.rollDir || 1) : 0;
    m.body.rotation.x = k * .14;                                          // 走ると前かがみ（ジャンプ振りの体の動きは下で足す）
    m.body.position.y = Math.abs(Math.sin(ph)) * .045 * k;                // 走ると上下にはずむ
    for (const f of m.feet) { const p = ph + (f.userData.foot > 0 ? 0 : Math.PI); f.position.z = .03 + Math.sin(p) * .12 * k; f.position.y = air ? .14 : .08 + Math.max(0, Math.cos(p)) * .07 * k; }
    // まばたき
    a.blinkT -= dt; if (a.blinkT <= 0) a.blinkT = rand(2, 5);
    const bl = a.blinkT < .12 ? .12 : 1; for (const e of m.eyes) e.scale.y = bl;
    m.head.rotation.x = -a.aimPitch * .4;
    // 撃った反動：ブキが少し後ろへ下がって、はね上がる
    const kick = a.kick || 0; a.kick = Math.max(0, kick - dt * 7);
    // ふる動き（ローラー・ハケ：ふり上げてたたきつける／ブレード：横なぎ／バケツ：すくい上げ）
    let swX = 0, swY = 0, lean = 0, flip = 0; const sw = a.ws.swing;
    if (sw) {
      sw.t += dt; const u = sw.t / sw.dur;
      if (u >= 1) a.ws.swing = null;
      else if (sw.kind === 'side') swY = 1.2 - u * 2.4;
      else if (sw.kind === 'up') swX = -Math.sin(u * Math.PI) * 1.1;
      else if (sw.kind === 'over' || sw.kind === 'flip' || sw.kind === 'slam') {
        // ジャンプ振り：ブキを頭の上までふりかぶって、体ごと前へ振り下ろす
        const wind = sw.kind === 'slam' ? .42 : .3, e = u < wind ? u / wind : (u - wind) / (1 - wind);
        swX = u < wind ? -e * e * 2.7 : -2.7 + Math.sin(e * Math.PI / 2) * 3.7;
        lean = u < wind ? -.3 * e : -.3 + e * .7;
        if (sw.kind === 'flip') flip = u * TAU;                                   // とびはね系：くるっと前に宙返り
        if (sw.kind === 'slam' && u >= wind + .25 && !sw.hit) { sw.hit = true; if (a === G.me) G.shake = Math.max(G.shake, .22); }   // ゾウ：ずしん
      }
      else swX = u < .35 ? -u / .35 * 1.3 : -1.3 + (u - .35) / .65 * 2.0;
    }
    if (lean || flip) m.body.rotation.x += lean + flip;
    m.wp.rotation.set(-a.aimPitch * .8 - kick * .45 + swX, swY, 0); m.wp.position.z = .2 - kick * .14;
    if (a.wp2) { a.wp2.rotation.x = -a.aimPitch * .8 - kick * .45; a.wp2.position.z = .2 - kick * .14; }
    // 腕：ブキを持つ手はねらう向きへ。両手持ちは左手もそえる。空いた手は走ると振り、ジャンプ中はバンザイ
    const two = TWO_HAND.has(a.w.cls), dual = a.w.cls === 'dual';
    for (const sh of m.arms) {
      const sd = sh.userData.side;
      if (sd < 0 || dual || two) sh.rotation.set(-.85 - a.aimPitch * .8 - kick * .5 + swX * .8, swY * .5, two && sd > 0 ? -.9 : 0);
      else if (air) sh.rotation.set(-2.5, 0, .35);
      else sh.rotation.set(Math.sin(ph + Math.PI) * .7 * k, 0, .12 + (1 - k) * .05 * Math.sin(clock * 2 + a.seed));
    }
    // ブキそのものの動き
    const ud = m.wp.userData;
    if (ud.spin) ud.spin.rotation.z += dt * ((a.ws.spin || 0) * 22 + (a.ws.fireT > 0 ? 34 : 0));
    if (ud.head && a.w.cls === 'roller' && a.ws.rolling) ud.head.rotation.x += dt * a.moveSpd * 5;
    if (ud.canopy) ud.canopy.scale.setScalar(a.ws.open && !(a.ws.broken > 0) ? 1.35 : a.ws.broken > 0 ? .01 : 1);
    // 当たった相手のペンキが体につく（体力がもどると消える）
    const want = Math.round(clamp(1 - a.hp / HP_MAX, 0, 1) * m.splats.length * 1.15);
    m.splats.forEach((sp, i) => { const tgt = i < want ? sp.userData.s : 0, c = sp.scale.x, v = c + (tgt - c) * Math.min(1, dt * (tgt ? 18 : 3)); sp.scale.set(v, v, v * .32); sp.visible = v > .02; });
    m.flash.visible = a.flashT > 0; if (m.flash.visible) m.flash.material.opacity = Math.min(.55, a.flashT * 4);
  }
  m.inkIn.scale.y = Math.max(.02, a.ink / INK_MAX); m.inkIn.position.y = .66 - (1 - a.ink / INK_MAX) * .18;
  const blink = a.inv > 0 ? (Math.sin(clock * 30) > 0) : true;
  m.body.visible = m.body.visible && blink;
}

// 地面に広がる輪（やられた・着地・大きな破裂）
const RINGS = [];
function ringFx(x, y, z, team, r = 2.4, life = .4) {
  let o = RINGS.find(q => q.life <= 0);
  if (!o) {
    if (RINGS.length >= 12) return;
    const mm = new T.Mesh(new T.RingGeometry(.72, 1, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: T.DoubleSide, depthWrite: false }));
    mm.rotation.x = -Math.PI / 2; mm.renderOrder = 2; scene.add(mm); o = { m: mm, life: 0, max: 1, r: 1 }; RINGS.push(o);
  }
  o.m.position.set(x, y + .07, z); o.m.material.color.set(team ? teamColor(team) : '#ffffff'); o.r = r; o.life = o.max = life; o.m.visible = true;
}
function updRings(dt) {
  for (const o of RINGS) { if (o.life <= 0) { o.m.visible = false; continue; } o.life -= dt; const u = 1 - Math.max(0, o.life) / o.max, sc = .3 + u * o.r; o.m.scale.set(sc, sc, 1); o.m.material.opacity = (1 - u) * .85; }
}

// ================= しぶき（粒子） =================
const FXN = 800;
const fxMesh = new T.InstancedMesh(new T.SphereGeometry(1, 6, 4), new T.MeshStandardMaterial({ roughness: .3 }), FXN);
fxMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); fxMesh.frustumCulled = false;
fxMesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(FXN * 3), 3);
const fx = []; let fxHead = 0;
for (let i = 0; i < FXN; i++) fx.push({ life: 0 });
const _m4 = new T.Matrix4(), _c = new T.Color(), _q = new T.Quaternion(), _s = new T.Vector3(), _p = new T.Vector3();
function particle(x, y, z, vx, vy, vz, team, size, life) {
  const idx = fxHead, f = fx[idx]; fxHead = (fxHead + 1) % FXN;
  Object.assign(f, { x, y, z, vx, vy, vz, team, size, life, max: life });
  _c.set(team === 0 ? '#ffffff' : (G.pal[team - 1] || '#ffffff')); fxMesh.setColorAt(idx, _c);
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
  updRings(dt);
}
