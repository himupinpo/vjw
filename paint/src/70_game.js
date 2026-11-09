
// ================= 試合の流れ・カメラ・表示 =================
const G = { state: 'title', mode: 'turf', paused: false, time: 180, me: null, pal: PALETTES[0].slice(), hurtFlash: 0, hitMark: 0, killMark: 0, shake: 0, inkWarn: 0,
  camYaw: Math.PI, camPitch: -.12, countT: 0, endT: 0, miniT: 0, killedBy: '', lastSec: -1, zc: [0, 100, 100], zOwner: 0, zShare: [0, 0, 0], zT: 0, testAim: null };
let clock = 0;
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.background = new T.Color(0x8fcff6); scene.fog = new T.Fog(0x8fcff6, 90, 300);
const camera = new T.PerspectiveCamera(70, 1, .1, 900);
const hemi = new T.HemisphereLight(0xdff2ff, 0x6a5a48, 1.1); scene.add(hemi);
const sun = new T.DirectionalLight(0xfff2dc, 2.2); sun.position.set(30, 60, 20); sun.castShadow = true;
sun.shadow.camera.left = -40; sun.shadow.camera.right = 40; sun.shadow.camera.top = 56; sun.shadow.camera.bottom = -56; sun.shadow.camera.far = 160; sun.shadow.bias = -.0006;
scene.add(sun, sun.target, world, fxMesh, projMesh, laser);
// 空の雲
{
  const cc = document.createElement('canvas'); cc.width = 128; cc.height = 64; const cg = cc.getContext('2d');
  for (let i = 0; i < 14; i++) { const x = 20 + Math.random() * 88, y = 28 + Math.random() * 14, r = 12 + Math.random() * 16, rg = cg.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,.9)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); cg.fillStyle = rg; cg.fillRect(0, 0, 128, 64); }
  const ct = new T.CanvasTexture(cc); ct.colorSpace = T.SRGBColorSpace;
  for (let i = 0; i < 16; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: ct, fog: false, transparent: true, depthWrite: false })); const a = Math.random() * TAU, r = 260 + Math.random() * 200; s.position.set(Math.cos(a) * r, 60 + Math.random() * 70, Math.sin(a) * r); s.scale.set(120, 50, 1); scene.add(s); }
}
function applyQuality() {
  const q = SET.quality, dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(q === 'low' ? Math.min(1, dpr) * .7 : q === 'high' ? dpr : Math.min(1.5, dpr));
  renderer.shadowMap.enabled = q !== 'low'; sun.castShadow = q !== 'low';
  sun.shadow.mapSize.set(q === 'high' ? 2048 : 1024, q === 'high' ? 2048 : 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
}
function onResize() {
  const w = VW(), h = VH(), r = $('rot');
  r.style.width = w + 'px'; r.style.height = h + 'px'; r.style.transform = ROT.on ? 'rotate(90deg) translateY(-100%)' : 'none';
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  document.body.classList.toggle('narrow', w < 560);
  if (typeof applyBtnLayout === 'function') try { applyBtnLayout(); } catch (e) { /* 起動中 */ }
}
addEventListener('resize', onResize);

// ---------- 知らせ ----------
let msgT = 0;
function showMsg(t, small, sec = 1.5) { const m = $('msg'); m.innerHTML = t + (small ? '<small>' + small + '</small>' : ''); m.classList.remove('pop'); void m.offsetWidth; m.classList.add('pop'); m.style.opacity = 1; msgT = sec; }
function feed(t, team) {
  const f = $('feed'), d = document.createElement('div'); d.textContent = t; d.style.borderLeft = '4px solid ' + teamColor(team);
  f.prepend(d); while (f.children.length > 4) f.lastChild.remove(); setTimeout(() => d.remove(), 4500);
}
// 撃たれたとき、画面のふちに相手の色のしぶき
function addSplat(col, dmg) {
  const box = $('splats'); if (!box) return;
  const n = dmg > 40 ? 2 : 1;
  for (let k = 0; k < n; k++) {
    if (box.children.length > 7) box.firstChild.remove();
    const el = document.createElement('div'), size = 90 + Math.random() * 120, side = Math.floor(Math.random() * 4);
    const x = side === 0 ? -size * .3 : side === 1 ? VW() - size * .7 : Math.random() * (VW() - size), y = side === 2 ? -size * .3 : side === 3 ? VH() - size * .7 : Math.random() * (VH() - size);
    let blobs = ''; for (let b = 0; b < 7; b++) { const cx = 50 + (Math.random() - .5) * 50, cy = 50 + (Math.random() - .5) * 50, r = 8 + Math.random() * 22; blobs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}"/>`; }
    el.className = 'splat'; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = el.style.height = size + 'px';
    el.innerHTML = `<svg viewBox="0 0 100 100">${blobs}</svg>`;
    box.append(el); setTimeout(() => el.remove(), 1600);
  }
}

// ---------- 試合を始める ----------
function clearMatch() {
  for (const a of actors) { scene.remove(a.model.root); a.model.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  actors.length = 0; proj.length = 0;
  for (const d of devices) scene.remove(d.mesh); devices.length = 0;
  for (const [, m] of beamMeshes) scene.remove(m); beamMeshes.clear();
  for (const [, m] of sjMarks) scene.remove(m); sjMarks.clear();
  for (const t of tracers) scene.remove(t.m); tracers.length = 0;
  for (const f of fx) f.life = 0;
  clearPaint(); closeJumpUI(); $('splats').innerHTML = ''; rulesClear();
}
function pickBotWeapons(n, avoid) {
  const out = [], used = new Set([avoid]);
  const cls = CLASS_ORDER.slice().sort(() => Math.random() - .5);
  for (let i = 0; i < n; i++) { const c = cls[i % cls.length], pool = WEAPONS.filter(w => w.cls === c && !used.has(w.id)); const w = pick(pool.length ? pool : WEAPONS); used.add(w.id); out.push(w); }
  return out;
}
function startMatch(mode, stage) {
  AU.init(); if (mode === 'battle') mode = 'turf';
  let sid = stage || SET.stage || 'random'; if (sid === 'random' || !STAGES[sid]) sid = pick(STAGE_IDS);
  clearMatch();
  if (sid !== STAGE_ID) loadStage(sid);
  G.mode = mode; G.paused = false; G.time = mode === 'practice' ? 0 : 180; G.lastSec = -1;
  G.zc = [0, 100, 100]; G.zOwner = 0; G.zShare = [0, 0, 0]; G.zT = 0;
  G.pal = PALETTES[Math.floor(Math.random() * PALETTES.length)].slice(); if (Math.random() < .5) G.pal.reverse();
  setTeamColors(G.pal[0], G.pal[1]); refreshTeamMats();
  const names = BOT_NAMES.slice().sort(() => Math.random() - .5);
  G.me = makeActor('あなた', 1, WBY[SET.weapon], false);
  if (mode !== 'practice') {
    const ws = pickBotWeapons(7, SET.weapon);
    for (let i = 0; i < 3; i++) makeActor(names[i], 1, ws[i], true);
    for (let i = 0; i < 4; i++) makeActor(names[3 + i], 2, ws[3 + i], true);
  } else {
    const sz = SPAWN[1].z;
    const spots = [[-6, sz - 24], [0, sz - 28], [6, sz - 22], [-12, sz - 32], [12, sz - 30], [0, sz - 38]];
    spots.forEach(([x, z], i) => { const ok = hAt(x, z) > -5 ? [x, z] : [0, sz - 20 - i * 3]; const d = makeActor('まと' + (i + 1), 2, WBY.basic, false); d.dummy = true; d.home = { x: ok[0], z: ok[1], yaw: 0 }; });
  }
  actors.forEach(a => { const k = actors.filter(o => o.team === a.team).indexOf(a); if (a.dummy) respawn(a); else placeAtSpawn(a, k); });
  G.camYaw = G.me.yaw; G.camPitch = -.12;
  G.state = mode === 'practice' ? 'play' : 'count'; G.countT = mode === 'practice' ? 0 : 3.2;
  hideScreens(); lobbyHide(); $('hud').classList.remove('hidden'); $('touch').classList.toggle('off', !IN.touchOn);
  wpNameHud(G.me.w); applyBtnLayout();
  $('zoneBar').classList.toggle('hidden', mode !== 'zone'); zoneMarks(mode === 'zone');
  rulesInit(mode); $('ruleBar').classList.toggle('hidden', !(mode === 'flag' || mode === 'ball')); $('ruleBar').innerHTML = ''; RS.hud = '';
  buildTeamIcons(); miniInit();
  G.camY = undefined; G.kick = 0; G.scopeT = 0; G.scopeZ = 1;
  const ruleName = RULES[mode] ? RULES[mode].name : 'ぬりあいバトル';
  if (mode !== 'practice') { showMsg('READY?', ruleName + '・' + STAGE.name, 1.8); AU.ready(); } else showMsg('試しうち', 'まとを撃ってブキをためそう', 2);
  AU.musicOn(mode !== 'practice' && SET.music);
}
function setPlayerWeapon(w) {
  const a = G.me; if (!a) return;
  scene.remove(a.model.root); a.w = w; a.ws = {}; buildModel(a);
  wpNameHud(w);
  buildTeamIcons();
}
// 画面左下のブキ名（パソコンではキーも出す）
function wpNameHud(w) {
  const k = !IN.touchOn;
  $('wpName').innerHTML = `<b>${w.name}</b><small> ${CLASSES[w.cls].name}</small><br>サブ：${SUBS[w.sub].name}${k ? '（E）' : ''}`; $('spName').textContent = SPECIALS[w.sp].name + (k ? '（Q）' : '');
}
function buildTeamIcons() {
  for (const t of [1, 2]) {
    const el = $(t === 1 ? 'tA' : 'tB'); el.innerHTML = '';
    actors.filter(a => a.team === t && !a.dummy).forEach(a => { const i = document.createElement('i'); i.style.background = teamColor(t); i.innerHTML = classIcon(a.w.cls, '#fff'); i.title = a.name + '：' + a.w.name; if (a === G.me) i.classList.add('me'); a.icon = i; el.append(i); });
  }
}

// ---------- スーパージャンプの行き先えらび ----------
function openJumpUI() {
  const me = G.me; if (!me || me.dead || me.sj || G.state !== 'play' || G.mode === 'practice') return;
  const box = $('jumpList'); box.innerHTML = '';
  const add = (label, sub, tgt) => { const b = document.createElement('button'); b.className = 'btn'; b.innerHTML = label + (sub ? `<small>${sub}</small>` : ''); b.onclick = () => { closeJumpUI(); startSuperJump(me, tgt); }; box.append(b); };
  add('スタート地点', '自分のスタート台へもどる', 'spawn');
  const area = o => { const f = (o.team === 1 ? -o.z : o.z); return f > 18 ? '相手の陣地の近く' : f > -6 ? 'まんなかあたり' : '自分の陣地'; };
  for (const o of actors) if (o !== me && o.team === me.team && !o.dead && !o.sj) add(o.name, o.w.name + '・' + area(o), o);
  $('jumpUI').classList.remove('hidden');
}
function closeJumpUI() { const j = $('jumpUI'); if (j) j.classList.add('hidden'); }

// ---------- 自分の操作 ----------
const _ray = new T.Raycaster(), _v2 = new T.Vector2();
function playerControl(a, dt) {
  const sens = .0023 * SET.sens / (G.scopeZ || 1);   // ズームしているほど、ゆっくり向きが変わる
  G.camYaw -= IN.lookX * sens; G.camPitch = clamp(G.camPitch - IN.lookY * sens * (SET.invY ? -1 : 1), -1.15, .95);
  IN.lookX = IN.lookY = 0;
  const [ax, ay] = moveAxes(), fx = Math.sin(G.camYaw), fz = Math.cos(G.camYaw);
  const mx = fx * ay - fz * ax, mz = fz * ay + fx * ax;
  const fire = firing() && !G.paused, dive = diving(), jump = takeEdge('jumpE'), sub = takeEdge('subE'), sp = takeEdge('spE');
  if (fire && IN.touchOn && SET.assist && !a.dead && !a.sj) aimAssist(a, dt);
  if (takeEdge('sjE')) { if ($('jumpUI').classList.contains('hidden')) openJumpUI(); else closeJumpUI(); }
  let dodge = false;
  if (a.w.cls === 'dual' && fire && dive) { if (!G.dodgeHeld) dodge = true; G.dodgeHeld = true; } else G.dodgeHeld = false;
  if (a.dead || a.sj) return { mx: 0, mz: 0 };
  _v2.set(0, .08); _ray.setFromCamera(_v2, camera);
  const o = _ray.ray.origin, d = _ray.ray.direction;
  let dist = rayGround(o.x, o.y, o.z, d.x, d.y, d.z, 70, .3);
  for (const t of actors) { if (t.dead || t.team === a.team) continue; const cx = t.x - o.x, cy = t.y + .7 - o.y, cz = t.z - o.z, tt = cx * d.x + cy * d.y + cz * d.z; if (tt < 0 || tt > dist) continue; const q = cx * cx + cy * cy + cz * cz - tt * tt; if (q < .5) dist = tt; }
  const camToMe = Math.hypot(a.x - o.x, a.z - o.z);
  if (dist < camToMe + 1) dist = camToMe + 6;
  a.aimPt = G.testAim ? G.testAim.clone() : new T.Vector3(o.x + d.x * dist, o.y + d.y * dist, o.z + d.z * dist);
  a.aimYaw = G.camYaw;
  const m = muzzle(a), dv = a.aimPt.clone().sub(m); a.aimPitch = Math.atan2(dv.y, Math.hypot(dv.x, dv.z));
  if (sub) throwSub(a);
  if (sp) useSpecial(a);
  return { mx, mz, dive: dive && !(a.w.cls === 'dual' && fire), jump, fire, dodge };
}

// スマホのねらい補助：撃っている間だけ、照準から6°以内の見えている相手へ少しだけ向きを寄せる
function aimAssist(a, dt) {
  const w = a.w, range = (w.cls === 'blade' ? Math.max(w.range, w.crange * .8) : (w.range || w.frange || 8)) * 1.1;
  const cx = camera.position.x, cz = camera.position.z;
  let best = null, bang = 6 * Math.PI / 180;
  for (const t of actors) {
    if (t.dead || t.team === a.team) continue;
    if ((t.swim || t.cloakT > 0) && !t.revealed && !(t.markT > 0)) continue;
    const d = Math.hypot(t.x - a.x, t.z - a.z); if (d > range || d < .8) continue;
    const ang = Math.abs(angD(Math.atan2(t.x - cx, t.z - cz) - G.camYaw));
    if (ang < bang && lineOfSight(a.x, a.y + 1.1, a.z, t.x, t.y + .8, t.z)) { bang = ang; best = t; }
  }
  if (best) G.camYaw += angD(Math.atan2(best.x - cx, best.z - cz) - G.camYaw) * Math.min(1, dt * 6);
}

// ---------- ゾーン争奪 ----------
function zoneTick(dt) {
  G.zT -= dt;
  if (G.zT <= 0) {
    G.zT = .25;
    const [x0, z0, x1, z1] = ZONE; let tot = 0, a = 0, b = 0;
    const i0 = Math.floor((x0 - X0) / CS), i1 = Math.floor((x1 - X0) / CS), j0 = Math.floor((z0 - Z0) / CS), j1 = Math.floor((z1 - Z0) / CS);
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) { const k = j * GW + i; if (HG[k] < -5) continue; tot++; if (PT[k] === 1) a++; else if (PT[k] === 2) b++; }
    G.zShare = [0, a / tot, b / tot];
    const prev = G.zOwner;
    if (G.zShare[1] >= .6) G.zOwner = 1; else if (G.zShare[2] >= .6) G.zOwner = 2;
    if (G.zOwner !== prev && G.zOwner) {
      const mine = G.zOwner === G.me.team; showMsg(mine ? 'ゾーンをとった！' : 'ゾーンをとられた！', '', 1.4); mine ? AU.win() : AU.lose();
      if (zoneGroup) zoneGroup.userData.mat.color.set(teamColor(G.zOwner));
    }
  }
  if (G.zOwner) { G.zc[G.zOwner] = Math.max(0, G.zc[G.zOwner] - dt); if (G.zc[G.zOwner] <= 0) endMatch(); }
}

// ---------- 毎フレーム ----------
function update(dt) {
  clock += dt; PU.uTime.value = clock;
  if (G.state === 'count') {
    G.countT -= dt;
    if (G.countT <= 0) { G.state = 'play'; showMsg('GO!', '', .9); AU.whistle(); }
  }
  const playing = G.state === 'play' && !G.paused;
  if ((G.state === 'play' || G.state === 'count') && !G.paused) {
    const me = G.me;
    for (const a of actors) {
      let ctl;
      if (a === me && !G.auto) ctl = playerControl(a, dt);
      else if (a.bot || a === me) ctl = playing ? botThink(a, dt) : { mx: 0, mz: 0 };   // G.auto：自分もCPUにまかせる（テスト用）
      else ctl = { mx: 0, mz: 0 };
      if (a.dead) { if (playing) { a.respawnT -= dt; if (a.respawnT <= 0) respawn(a); } continue; }
      if (G.state === 'count') { ctl.mx = ctl.mz = 0; ctl.fire = false; ctl.jump = false; }
      stepMove(a, dt, ctl);
      if (a.dead) continue;
      weaponTick(a, dt, playing && !!ctl.fire && !a.climb, !!ctl.dodge, ctl.mx, ctl.mz);
      stepSpecial(a, dt);
    }
    if (playing) { stepProj(dt); stepDevices(dt); if (G.mode === 'zone') zoneTick(dt); if (G.mode === 'flag' || G.mode === 'ball') rulesTick(dt); }
    if (G.mode !== 'practice' && playing && G.state === 'play') {
      G.time -= dt;
      const sec = Math.ceil(G.time);
      if (sec !== G.lastSec) { G.lastSec = sec; if (sec === 60) showMsg('のこり1分！', '', 1.4); if (sec <= 10 && sec > 0) AU.beep(sec <= 3); }
      if (G.time <= 0) endMatch();
    }
  } else if (G.state === 'end') {
    G.endT -= dt; if (G.endT <= 0 && $('result').classList.contains('hidden')) showResult();
  }
  for (const a of actors) syncModel(a, dt, G.me);
  decoTick(dt);
  updFx(dt); updTracers(dt); drawProj(); uploadPaint();
  updateCamera(dt); updateHud(dt);
  AU.music();
}
function endMatch() {
  if (G.state === 'end') return;
  G.state = 'end'; G.endT = 2.4; G.time = Math.max(0, G.time); AU.whistle(); AU.musicOn(false);
  showMsg('そこまで！', '', 2.2);
  for (const a of actors) { a.ws = {}; a.spOn = null; }
  for (const [, m] of beamMeshes) m.visible = false;
  closeJumpUI();
  try { document.exitPointerLock(); } catch (e) { /* */ }
  IN.mouseFire = IN.mouseDive = false;
}

// ---------- カメラ ----------
const _cam = new T.Vector3(), _piv = new T.Vector3(), _look = new T.Vector3(), _eye = new T.Vector3(), _lookS = new T.Vector3();
function updateCamera(dt) {
  const a = G.me; if (!a) return;
  let yaw = G.camYaw, pit = G.camPitch;
  if (a.dead && G.state !== 'end') { yaw += clock * .3 % TAU; pit = -.45; }
  // 反動：撃った直後だけ少し上を向く（すぐもどる）
  G.kick = (G.kick || 0) * Math.exp(-dt * 10); pit = clamp(pit + G.kick, -1.2, 1);
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -fz, rz = fx, cp = Math.cos(pit), sp = Math.sin(pit);
  const low = a.dive ? .7 : 1.55, dist0 = a.dead ? 7 : a.sj ? 8 : a.dive ? 4.6 : 4.2, side = a.dead || a.sj ? 0 : .7;
  // 段差・ジャンプ・もぐるときの上下は、なめらかに追う
  const ty = a.y + low;
  if (G.camY === undefined || a.sj || a.dead || Math.abs(G.camY - ty) > 2.5) G.camY = ty; else G.camY += (ty - G.camY) * (1 - Math.exp(-dt * 14));
  G.camD = G.camD === undefined ? dist0 : G.camD + (dist0 - G.camD) * (1 - Math.exp(-dt * 8));
  const dist = G.camD;
  _piv.set(a.x + rx * side, G.camY, a.z + rz * side);
  const bx = -fx * cp, by = -sp, bz = -fz * cp;
  const hit = rayGround(_piv.x, _piv.y, _piv.z, bx, by, bz, dist, .15);
  const dd = Math.max(.6, Math.min(dist, hit - .25));
  _cam.set(_piv.x + bx * dd, _piv.y + by * dd + .25, _piv.z + bz * dd);
  if (_cam.y < hAt(_cam.x, _cam.z) + .3) _cam.y = hAt(_cam.x, _cam.z) + .3;
  if (G.shake > 0) { _cam.x += (Math.random() - .5) * G.shake; _cam.y += (Math.random() - .5) * G.shake; G.shake = Math.max(0, G.shake - dt * 1.2); }
  if (a.sj && a.sj.t > SJ_CH) _look.set(a.sj.tx, a.sj.ty, a.sj.tz);
  else _look.set(_piv.x + fx * cp * 12, _piv.y + sp * 12 + .25, _piv.z + fz * cp * 12);
  // スコープ：ためはじめると目の位置からのぞく形になり、ためるほどどんどんズームしていく
  const sc = scopeAmt(a);
  G.scopeT = (G.scopeT || 0) + ((sc > 0 ? clamp(sc / .18, 0, 1) : 0) - (G.scopeT || 0)) * (1 - Math.exp(-dt * 12)); if (G.scopeT < .002) G.scopeT = 0;
  G.scopeZ = (G.scopeZ || 1) + ((sc > 0 ? Math.pow(a.w.scope, clamp((sc - .06) / .94, 0, 1)) : 1) - (G.scopeZ || 1)) * (1 - Math.exp(-dt * 14));
  if (G.scopeT > 0) {
    const e = G.scopeT * G.scopeT * (3 - 2 * G.scopeT);
    _eye.set(a.x + fx * .3, a.y + 1.32, a.z + fz * .3);
    _cam.lerp(_eye, e); _look.lerp(_lookS.set(_eye.x + fx * cp * 20, _eye.y + sp * 20, _eye.z + fz * cp * 20), e);
  }
  camera.position.copy(_cam);
  camera.lookAt(_look);
  if (G.scopeT > 0 || G.scopeZ > 1.002) {   // ズームの倍率どおりの画角（なめらかにした倍率をそのまま使う）
    const f = 2 * Math.atan(Math.tan(35 * Math.PI / 180) / Math.max(1, G.scopeZ)) * 180 / Math.PI;
    if (Math.abs(camera.fov - f) > .01) { camera.fov = f; camera.updateProjectionMatrix(); }
  } else {
    const wantFov = (a.swim && a.moveSpd > 6) || a.dashT > 0 ? 76 : 70;
    if (Math.abs(camera.fov - wantFov) > .1) { camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 8); camera.updateProjectionMatrix(); }
  }
  sun.position.set(a.x + 30, 60, a.z + 20); sun.target.position.set(a.x, 0, a.z); sun.target.updateMatrixWorld();
  if (a.w.cls === 'sniper' && a.ws.ch > 0 && !a.dead && !a.dive && G.scopeT < .3) {   // スコープでのぞいている間は、自分の照準線は出さない
    const m = muzzle(a), d = aimFrom(a, m), L = rayGround(m.x, m.y, m.z, d.x, d.y, d.z, a.w.range * (.5 + .5 * a.ws.ch), .2);
    laser.visible = true; laser.material.color.set(teamColor(a.team)); laser.scale.set(1, Math.max(.1, L), 1); laser.position.copy(m).addScaledVector(d, L / 2); laser.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d);
  } else laser.visible = false;
}

// ---------- 表示 ----------
function updateHud(dt) {
  const a = G.me; if (!a || $('hud').classList.contains('hidden')) return;
  if (G.mode !== 'practice') { const t = Math.max(0, Math.ceil(G.time)); $('timer').textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); $('timer').classList.toggle('hurry', t <= 60 && G.state === 'play'); }
  else $('timer').textContent = '試しうち';
  if (G.mode === 'zone') {
    $('zA').textContent = Math.ceil(G.zc[1]); $('zB').textContent = Math.ceil(G.zc[2]);
    $('zMid').style.background = G.zOwner ? teamColor(G.zOwner) : '#4a4757';
    $('zBarA').style.width = (G.zShare[1] * 100).toFixed(0) + '%'; $('zBarB').style.width = (G.zShare[2] * 100).toFixed(0) + '%';
  }
  if (G.mode === 'flag' || G.mode === 'ball') rulesHud();
  const ink = $('ink'); ink.firstChild.style.height = a.ink + '%'; ink.classList.toggle('low', a.ink < 20 || G.inkWarn > 0);
  if (G.inkWarn > 0) { G.inkWarn -= dt; $('inkMsg').textContent = 'ペンキが足りない！'; }
  else $('inkMsg').textContent = a.ws.kept ? `ためキープ ${Math.max(0, keepTime(a.w) - (a.ws.keepT || 0)).toFixed(1)}秒` : a.climb ? 'かべをのぼっている' : carrierOf(a) ? (G.mode === 'ball' ? 'ボールを運んでいる（撃てない・もぐれない）' : '旗を運んでいる（もぐれない）') : '';
  $('charge').classList.toggle('keep', !!a.ws.kept);
  $('spArc').setAttribute('stroke-dasharray', (a.sp * 195).toFixed(1) + ' 195'); $('spArc').setAttribute('stroke', a.sp >= 1 ? '#fff' : teamColor(a.team));
  $('spBox').classList.toggle('full', a.sp >= 1); $('bSp').classList.toggle('ready', a.sp >= 1);
  const ch = a.w.cls === 'sniper' ? a.ws.ch : a.w.cls === 'bow' ? a.ws.bow : a.w.cls === 'gatling' ? (a.ws.fireT > 0 ? a.ws.fireT / a.w.dur : a.ws.spin) : a.w.cls === 'blade' ? Math.min(1, (a.ws.blade || 0) / a.w.charge) : a.w.pump ? clamp((a.ws.held || 0) / 1.5, 0, 1) : 0;
  $('charge').classList.toggle('hidden', !(ch > 0));
  if (ch > 0) { $('chargeArc').setAttribute('stroke-dasharray', (ch * 170).toFixed(1) + ' 170'); $('chargeArc').setAttribute('stroke', ch >= 1 ? '#fff' : teamColor(a.team)); }
  const cr = $('cross'); G.hitMark = Math.max(0, G.hitMark - dt); G.killMark = Math.max(0, G.killMark - dt);
  cr.classList.toggle('hit', G.hitMark > 0); cr.classList.toggle('kill', G.killMark > 0); cr.style.opacity = a.dive || a.dead || a.sj ? .3 : 1;
  // スコープのぞき窓：ためるほど輪が光り、倍率が上がる（のぞいている間は、ふだんの照準とため輪をかくす）
  const so = G.scopeT || 0, sEl = $('scope');
  sEl.style.opacity = so.toFixed(3);
  if (so > .001) {
    const sc = scopeAmt(a);
    sEl.style.setProperty('--r', lerp(72, 44, so).toFixed(1) + 'vmin');
    $('scopeArc').setAttribute('stroke-dasharray', (sc * 610).toFixed(0) + ' 610'); $('scopeArc').setAttribute('stroke', sc >= 1 ? '#fff' : teamColor(a.team));
    $('scopeZ').textContent = '×' + (G.scopeZ || 1).toFixed(1);
    if (so > .5) { cr.style.opacity = 0; $('charge').classList.add('hidden'); }
  }
  G.hurtFlash = Math.max(0, G.hurtFlash - dt * 1.5);
  const v = $('vig'); v.style.setProperty('--hurt', teamColor(3 - a.team)); v.style.opacity = clamp(G.hurtFlash + (1 - a.hp / HP_MAX) * .7, 0, .9);
  if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('msg').style.opacity = 0; }
  // やられている間・スーパージャンプ中だけ出す知らせ（終わったら消す）
  const sticky = msgT > 0 ? '' : a.dead && G.state === 'play' ? `<small>${G.killedBy ? G.killedBy + ' にやられた' : ''}<br>復活まで ${Math.ceil(a.respawnT)}</small>` : a.sj ? '<small>スーパージャンプ！</small>' : '';
  if (sticky) { if (G.sticky !== sticky) { $('msg').innerHTML = sticky; G.sticky = sticky; } $('msg').style.opacity = 1; }
  else if (G.sticky) { G.sticky = ''; if (msgT <= 0) $('msg').style.opacity = 0; }
  for (const o of actors) if (o.icon) { o.icon.classList.toggle('dead', o.dead); o.icon.classList.toggle('spOn', o.sp >= 1 && !o.dead); }
  $('sjBtn').classList.toggle('hidden', G.mode === 'practice' || a.dead);
  G.miniT -= dt; if (G.miniT <= 0) { G.miniT = .35; miniDraw(actors, a); }
}

// ---------- 結果 ----------
function showResult() {
  const pa = PCNT[1] / PTOTAL * 100, pb = PCNT[2] / PTOTAL * 100, me = G.me, zone = G.mode === 'zone', rr = rulesResult();
  const win = rr ? (rr.win ? rr.win === 1 : pa > pb) : zone ? (G.zc[1] !== G.zc[2] ? G.zc[1] < G.zc[2] : pa > pb) : pa > pb;
  REC.games++; if (win) REC.wins++; REC.kills += me.kills; REC.paint += Math.round(me.painted); REC.best = Math.max(REC.best, Math.round(me.painted)); saveRec();
  const rows = actors.slice().sort((p, q) => q.painted - p.painted).map(o => `<tr class="${o === me ? 'me' : ''}"><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${teamColor(o.team)}"></span> ${o.name}</td><td>${o.w.name}</td><td class="n">${Math.round(o.painted)}㎡</td><td class="n">${o.kills}</td><td class="n">${o.deaths}</td></tr>`).join('');
  const zLine = rr ? `<div class="zres">${rr.line}${rr.win ? '' : '<small>同点なので、ぬった広さで決めた</small>'}</div>`
    : zone ? `<div class="zres"><b style="color:${G.pal[0]}">${Math.ceil(G.zc[1])}</b> カウント <b style="color:${G.pal[1]}">${Math.ceil(G.zc[2])}</b><small>先に0にしたチーム（時間切れなら少ないチーム）の勝ち</small></div>` : '';
  $('resBox').innerHTML = `<div class="big" id="resBig" style="opacity:0">${win ? 'WIN!' : 'LOSE…'}</div>${zLine}
    <div class="meter"><div class="a" id="mA" style="flex-grow:1"></div><div class="n" id="mN" style="flex-grow:1"></div><div class="b" id="mB" style="flex-grow:1"></div></div>
    <div style="display:flex;justify-content:space-between;font-weight:900;font-size:14px"><span>あなたのチーム</span><span>${STAGE.name}</span><span>相手チーム</span></div>
    <table class="st"><tr style="opacity:.7;font-size:11px"><td>なまえ</td><td>ブキ</td><td class="n">ぬった広さ</td><td class="n">たおした</td><td class="n">やられた</td></tr>${rows}</table>
    <div class="col" style="margin:0 auto"><button class="btn main" id="rAgain">もう一度</button><button class="btn" id="rTitle">タイトルへ</button></div>`;
  hideScreens(); $('result').classList.remove('hidden'); $('hud').classList.add('hidden');
  requestAnimationFrame(() => setTimeout(() => {
    $('mA').style.flexGrow = pa; $('mB').style.flexGrow = pb; $('mN').style.flexGrow = Math.max(.001, 100 - pa - pb);
    setTimeout(() => { $('mA').textContent = pa.toFixed(1) + '%'; $('mB').textContent = pb.toFixed(1) + '%'; const b = $('resBig'); b.style.opacity = 1; b.style.color = win ? G.pal[0] : '#fff'; win ? AU.win() : AU.lose(); }, 2300);
  }, 300));
  const mode = G.mode;
  $('rAgain').onclick = () => { AU.ui(); startMatch(mode); };
  $('rTitle').onclick = () => { AU.ui(); toTitle(); };
}
