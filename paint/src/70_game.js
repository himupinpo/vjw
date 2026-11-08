
// ================= 試合の流れ・カメラ・表示 =================
const G = { state: 'title', mode: 'battle', paused: false, time: 180, me: null, pal: PALETTES[0].slice(), hurtFlash: 0, hitMark: 0, killMark: 0, shake: 0, inkWarn: 0,
  camYaw: Math.PI, camPitch: -.12, countT: 0, endT: 0, feedT: 0, miniT: 0, killedBy: '', lastSec: -1 };
let clock = 0;
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.background = new T.Color(0x8fcff6); scene.fog = new T.Fog(0x8fcff6, 90, 300);
const camera = new T.PerspectiveCamera(70, 1, .1, 700);
const hemi = new T.HemisphereLight(0xdff2ff, 0x6a5a48, 1.1); scene.add(hemi);
const sun = new T.DirectionalLight(0xfff2dc, 2.2); sun.position.set(30, 60, 20); sun.castShadow = true;
sun.shadow.camera.left = -40; sun.shadow.camera.right = 40; sun.shadow.camera.top = 56; sun.shadow.camera.bottom = -56; sun.shadow.camera.far = 160; sun.shadow.bias = -.0006;
scene.add(sun, sun.target);
scene.add(fxMesh, projMesh, laser);
// 空（上から下へのグラデーション）と雲
{
  const g = new T.SphereGeometry(600, 24, 12), c = [], top = new T.Color(0x3d8fe0), mid = new T.Color(0x9fd8ff), low = new T.Color(0xe8f6ff);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 600, col = y > .2 ? mid.clone().lerp(top, (y - .2) / .8) : low.clone().lerp(mid, clamp((y + .1) / .3, 0, 1)); c.push(col.r, col.g, col.b); }
  g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
  scene.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })));
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
}
addEventListener('resize', onResize);

// ---------- 知らせ ----------
let msgT = 0;
function showMsg(t, small, sec = 1.5) { const m = $('msg'); m.innerHTML = t + (small ? '<small>' + small + '</small>' : ''); m.classList.remove('pop'); void m.offsetWidth; m.classList.add('pop'); m.style.opacity = 1; msgT = sec; }
function feed(t, team) {
  const f = $('feed'), d = document.createElement('div'); d.textContent = t; d.style.borderLeft = '4px solid ' + teamColor(team);
  f.prepend(d); while (f.children.length > 4) f.lastChild.remove(); setTimeout(() => d.remove(), 4500);
}

// ---------- 試合を始める ----------
function clearMatch() {
  for (const a of actors) { scene.remove(a.model.root); a.model.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  actors.length = 0; proj.length = 0;
  for (const d of devices) scene.remove(d.mesh); devices.length = 0;
  for (const [, m] of beamMeshes) scene.remove(m); beamMeshes.clear();
  for (const t of tracers) scene.remove(t.m); tracers.length = 0;
  for (const f of fx) f.life = 0;
  clearPaint();
}
function pickBotWeapons(n, avoid) {
  const out = [], used = new Set([avoid]);
  const cls = CLASS_ORDER.slice().sort(() => Math.random() - .5);
  for (let i = 0; i < n; i++) { const c = cls[i % cls.length], pool = WEAPONS.filter(w => w.cls === c && !used.has(w.id)); const w = pick(pool.length ? pool : WEAPONS); used.add(w.id); out.push(w); }
  return out;
}
function startMatch(mode) {
  AU.init(); clearMatch();
  G.mode = mode; G.paused = false; G.time = mode === 'battle' ? 180 : 0; G.lastSec = -1;
  G.pal = PALETTES[Math.floor(Math.random() * PALETTES.length)].slice(); if (Math.random() < .5) G.pal.reverse();
  setTeamColors(G.pal[0], G.pal[1]); refreshTeamMats();
  const names = BOT_NAMES.slice().sort(() => Math.random() - .5);
  G.me = makeActor('あなた', 1, WBY[SET.weapon], false);
  if (mode === 'battle') {
    const ws = pickBotWeapons(7, SET.weapon);
    for (let i = 0; i < 3; i++) makeActor(names[i], 1, ws[i], true);
    for (let i = 0; i < 4; i++) makeActor(names[3 + i], 2, ws[3 + i], true);
  } else {
    const spots = [[-6, 20], [0, 16], [6, 22], [-12, 10], [12, 12], [0, 6]];
    spots.forEach(([x, z], i) => { const d = makeActor('まと' + (i + 1), 2, WBY.basic, false); d.dummy = true; d.home = { x, z, yaw: 0 }; });
  }
  actors.forEach(a => { const k = actors.filter(o => o.team === a.team).indexOf(a); if (a.dummy) { respawn(a); a.inv = 0; } else placeAtSpawn(a, k); });
  G.camYaw = G.me.yaw; G.camPitch = -.12;
  G.state = mode === 'battle' ? 'count' : 'play'; G.countT = mode === 'battle' ? 3.2 : 0;
  hideScreens(); $('hud').classList.remove('hidden'); $('touch').classList.toggle('off', !IN.touchOn);
  $('wpName').innerHTML = `<b>${G.me.w.name}</b><br>サブ：${SUBS[G.me.w.sub].name}`; $('spName').textContent = SPECIALS[G.me.w.sp].name;
  buildTeamIcons(); miniInit();
  if (mode === 'battle') { showMsg('READY?', '', 1.5); AU.ready(); } else showMsg('試しうち', 'まとを撃ってブキをためそう', 2);
  AU.musicOn(mode === 'battle' && SET.music);
}
function setPlayerWeapon(w) {
  const a = G.me; if (!a) return;
  scene.remove(a.model.root); a.wp2 = null; a.w = w; a.ws = {}; buildModel(a);
  $('wpName').innerHTML = `<b>${w.name}</b><br>サブ：${SUBS[w.sub].name}`; $('spName').textContent = SPECIALS[w.sp].name;
}
function buildTeamIcons() {
  for (const t of [1, 2]) {
    const el = $(t === 1 ? 'tA' : 'tB'); el.innerHTML = '';
    actors.filter(a => a.team === t && !a.dummy).forEach(a => { const i = document.createElement('i'); i.style.background = teamColor(t); i.textContent = CLASSES[a.w.cls].name[0]; if (a === G.me) i.classList.add('me'); a.icon = i; el.append(i); });
  }
}

// ---------- 自分の操作 ----------
const _ray = new T.Raycaster(), _v2 = new T.Vector2();
function playerControl(a, dt) {
  const scoping = a.w.scope && a.ws.ch > .1;
  const sens = .0023 * SET.sens * (scoping ? .45 : 1);
  G.camYaw -= IN.lookX * sens; G.camPitch = clamp(G.camPitch - IN.lookY * sens * (SET.invY ? -1 : 1), -1.15, .95);
  IN.lookX = IN.lookY = 0;
  const [ax, ay] = moveAxes(), fx = Math.sin(G.camYaw), fz = Math.cos(G.camYaw);
  const mx = fx * ay - fz * ax, mz = fz * ay + fx * ax;
  const fire = firing() && !G.paused, dive = diving(), jump = takeEdge('jumpE'), sub = takeEdge('subE'), sp = takeEdge('spE');
  // 二丁拳銃：撃ちながら「もぐる」でスライド
  let dodge = false;
  if (a.w.cls === 'dual' && fire && dive) { if (!G.dodgeHeld) dodge = true; G.dodgeHeld = true; } else G.dodgeHeld = false;
  if (a.dead) return { mx: 0, mz: 0 };
  // ねらい：画面の照準（少し上）から光線
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
      if (a === me) ctl = playerControl(a, dt);
      else if (a.bot) ctl = playing ? botThink(a, dt) : { mx: 0, mz: 0 };
      else ctl = { mx: 0, mz: 0 };
      if (a.dead) { if (playing) { a.respawnT -= dt; if (a.respawnT <= 0) respawn(a); } continue; }
      if (G.state === 'count') { ctl.mx = ctl.mz = 0; ctl.fire = false; ctl.jump = false; }
      stepMove(a, dt, ctl);
      if (a.dead) continue;
      weaponTick(a, dt, playing && !!ctl.fire, !!ctl.dodge, ctl.mx, ctl.mz);
      stepSpecial(a, dt);
      if (a.revealT > 0) { a.revealT -= dt; if (a.revealT <= 0) a.revealed = false; }
    }
    if (playing) { stepProj(dt); stepDevices(dt); }
    if (G.mode === 'battle' && playing) {
      G.time -= dt;
      const sec = Math.ceil(G.time);
      if (sec !== G.lastSec) { G.lastSec = sec; if (sec === 60) showMsg('のこり1分！', '', 1.4); if (sec <= 10 && sec > 0) AU.beep(sec <= 3); }
      if (G.time <= 0) endMatch();
    }
  } else if (G.state === 'end') {
    G.endT -= dt; if (G.endT <= 0 && $('result').classList.contains('hidden')) showResult();
  }
  for (const a of actors) syncModel(a, dt, G.me);
  updFx(dt); updTracers(dt); drawProj(); uploadPaint();
  updateCamera(dt); updateHud(dt);
  AU.music();
}
function endMatch() {
  G.state = 'end'; G.endT = 2.4; G.time = 0; AU.whistle(); AU.musicOn(false);
  showMsg('そこまで！', '', 2.2);
  for (const a of actors) { a.ws = {}; a.spOn = null; }
  try { document.exitPointerLock(); } catch (e) { /* */ }
  IN.mouseFire = IN.mouseDive = false;
}

// ---------- カメラ ----------
const _cam = new T.Vector3(), _piv = new T.Vector3(), _look = new T.Vector3();
function updateCamera(dt) {
  const a = G.me; if (!a) return;
  let yaw = G.camYaw, pit = G.camPitch;
  if (a.dead && G.state !== 'end') { yaw += clock * .3 % TAU; pit = -.45; }
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -fz, rz = fx, cp = Math.cos(pit), sp = Math.sin(pit);
  const low = a.dive ? .7 : 1.55, dist = a.dead ? 7 : a.dive ? 4.6 : 4.2, side = a.dead ? 0 : .7;
  _piv.set(a.x + rx * side, a.y + low, a.z + rz * side);
  const bx = -fx * cp, by = -sp, bz = -fz * cp;
  const hit = rayGround(_piv.x, _piv.y, _piv.z, bx, by, bz, dist, .15);
  const dd = Math.max(.6, Math.min(dist, hit - .25));
  _cam.set(_piv.x + bx * dd, _piv.y + by * dd + .25, _piv.z + bz * dd);
  if (_cam.y < hAt(_cam.x, _cam.z) + .3) _cam.y = hAt(_cam.x, _cam.z) + .3;
  if (G.shake > 0) { _cam.x += (Math.random() - .5) * G.shake; _cam.y += (Math.random() - .5) * G.shake; G.shake = Math.max(0, G.shake - dt * 1.2); }
  camera.position.copy(_cam);
  _look.set(_piv.x + fx * cp * 12, _piv.y + sp * 12 + .25, _piv.z + fz * cp * 12);
  camera.lookAt(_look);
  const wantFov = (a.w.scope && a.ws.ch > .1) ? lerp(70, 32, a.ws.ch) : (a.swim && a.moveSpd > 6 ? 76 : 70);
  if (Math.abs(camera.fov - wantFov) > .1) { camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 8); camera.updateProjectionMatrix(); }
  sun.position.set(a.x + 30, 60, a.z + 20); sun.target.position.set(a.x, 0, a.z); sun.target.updateMatrixWorld();
  // スナイパーのねらいの線
  if (a.w.cls === 'sniper' && a.ws.ch > 0 && !a.dead) {
    const m = muzzle(a), d = aimFrom(a, m), L = rayGround(m.x, m.y, m.z, d.x, d.y, d.z, a.w.range * (.5 + .5 * a.ws.ch), .2);
    laser.visible = true; laser.material.color.set(teamColor(a.team)); laser.scale.set(1, L, 1); laser.position.copy(m).addScaledVector(d, L / 2); laser.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d);
  } else laser.visible = false;
}

// ---------- 表示 ----------
function updateHud(dt) {
  const a = G.me; if (!a || $('hud').classList.contains('hidden')) return;
  if (G.mode === 'battle') { const t = Math.max(0, Math.ceil(G.time)); $('timer').textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); $('timer').classList.toggle('hurry', t <= 60 && G.state === 'play'); }
  else $('timer').textContent = '試しうち';
  const ink = $('ink'); ink.firstChild.style.height = a.ink + '%'; ink.classList.toggle('low', a.ink < 20 || G.inkWarn > 0);
  if (G.inkWarn > 0) { G.inkWarn -= dt; $('inkMsg').textContent = 'ペンキが足りない！'; } else $('inkMsg').textContent = '';
  $('spArc').setAttribute('stroke-dasharray', (a.sp * 195).toFixed(1) + ' 195'); $('spArc').setAttribute('stroke', a.sp >= 1 ? '#fff' : teamColor(a.team));
  $('spBox').classList.toggle('full', a.sp >= 1); $('bSp').classList.toggle('ready', a.sp >= 1);
  // ためるブキ
  const ch = a.w.cls === 'sniper' ? a.ws.ch : a.w.cls === 'bow' ? a.ws.bow : a.w.cls === 'gatling' ? (a.ws.fireT > 0 ? a.ws.fireT / a.w.dur : a.ws.spin) : a.w.cls === 'blade' ? Math.min(1, (a.ws.blade || 0) / a.w.charge) : 0;
  $('charge').classList.toggle('hidden', !(ch > 0));
  if (ch > 0) { $('chargeArc').setAttribute('stroke-dasharray', (ch * 170).toFixed(1) + ' 170'); $('chargeArc').setAttribute('stroke', ch >= 1 ? '#fff' : teamColor(a.team)); }
  const cr = $('cross'); G.hitMark = Math.max(0, G.hitMark - dt); G.killMark = Math.max(0, G.killMark - dt);
  cr.classList.toggle('hit', G.hitMark > 0); cr.classList.toggle('kill', G.killMark > 0); cr.style.opacity = a.dive || a.dead ? .3 : 1;
  // 体力が減ると画面のふちが相手の色に
  G.hurtFlash = Math.max(0, G.hurtFlash - dt * 1.5);
  const v = $('vig'); v.style.setProperty('--hurt', teamColor(3 - a.team)); v.style.opacity = clamp(G.hurtFlash + (1 - a.hp / HP_MAX) * .7, 0, .9);
  if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('msg').style.opacity = 0; }
  if (a.dead && G.state === 'play' && msgT <= 0) { $('msg').innerHTML = `<small>${G.killedBy ? G.killedBy + ' にやられた' : ''}<br>復活まで ${Math.ceil(a.respawnT)}</small>`; $('msg').style.opacity = 1; }
  for (const o of actors) if (o.icon) { o.icon.classList.toggle('dead', o.dead); o.icon.classList.toggle('spOn', o.sp >= 1 && !o.dead); }
  G.miniT -= dt; if (G.miniT <= 0) { G.miniT = .35; miniDraw(actors, a); }
}

// ---------- 結果 ----------
function showResult() {
  const pa = PCNT[1] / PTOTAL * 100, pb = PCNT[2] / PTOTAL * 100, win = pa > pb, me = G.me;
  REC.games++; if (win) REC.wins++; REC.kills += me.kills; REC.paint += Math.round(me.painted); REC.best = Math.max(REC.best, Math.round(me.painted)); saveRec();
  const rows = actors.slice().sort((p, q) => q.painted - p.painted).map(o => `<tr class="${o === me ? 'me' : ''}"><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${teamColor(o.team)}"></span> ${o.name}</td><td>${o.w.name}</td><td class="n">${Math.round(o.painted)}㎡</td><td class="n">${o.kills}</td><td class="n">${o.deaths}</td></tr>`).join('');
  $('resBox').innerHTML = `<div class="big" id="resBig" style="opacity:0">${win ? 'WIN!' : 'LOSE…'}</div>
    <div class="meter"><div class="a" id="mA" style="flex-grow:1"></div><div class="n" id="mN" style="flex-grow:1"></div><div class="b" id="mB" style="flex-grow:1"></div></div>
    <div style="display:flex;justify-content:space-between;font-weight:900;font-size:14px"><span>あなたのチーム</span><span>相手チーム</span></div>
    <table class="st"><tr style="opacity:.7;font-size:11px"><td>なまえ</td><td>ブキ</td><td class="n">ぬった広さ</td><td class="n">たおした</td><td class="n">やられた</td></tr>${rows}</table>
    <div class="col" style="margin:0 auto"><button class="btn main" id="rAgain">もう一度</button><button class="btn" id="rTitle">タイトルへ</button></div>`;
  hideScreens(); $('result').classList.remove('hidden'); $('hud').classList.add('hidden');
  requestAnimationFrame(() => setTimeout(() => {
    $('mA').style.flexGrow = pa; $('mB').style.flexGrow = pb; $('mN').style.flexGrow = Math.max(.001, 100 - pa - pb);
    setTimeout(() => { $('mA').textContent = pa.toFixed(1) + '%'; $('mB').textContent = pb.toFixed(1) + '%'; const b = $('resBig'); b.style.opacity = 1; b.style.color = win ? G.pal[0] : '#fff'; win ? AU.win() : AU.lose(); }, 2300);
  }, 300));
  $('rAgain').onclick = () => { AU.ui(); startMatch('battle'); };
  $('rTitle').onclick = () => { AU.ui(); toTitle(); };
}
