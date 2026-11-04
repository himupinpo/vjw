// =========================================================================================
//  ゲームの流れ：仕事（ミッション）、拾える物、HUD（地図・お金・手配度）、やられた／逮捕、セーブ
// =========================================================================================
const GAME = {
  state: 'load', shake: 0, flash: 0, hurtFx: 0, mission: null, done: 0, cash: [], saveT: 0, t: 0,
  stunts: [], found: [], slow: 1,   // 成功したジャンプ台、見つけた場所、スローモーション（1=ふつう）
  // ジャンプ台から飛んで着地した（主人公の車）：遠くまで飛べば成功。はじめての台はお金
  onLand(car) {
    const t = car.takeoff; if (!t || t.ramp < 0) return;
    const dist = Math.hypot(car.x - t.x, car.z - t.z); if (dist < 15 || car.dead) return;
    const first = !this.stunts.includes(t.ramp);
    if (first) { this.stunts.push(t.ramp); PLAYER.money += 500; UI.money(); AUDIO.coin(); writeSave(); }
    UI.big('スタントジャンプ！', `${dist.toFixed(0)} m${first ? '　+$500' : ''}　（${this.stunts.length} / ${REG.ramps.length}）`, 2.6);
  },
  // 新しい場所に着いた（山頂・オアシスの村・港）：はじめてならお金
  discover() {
    const P = PLAYER.car || PLAYER.pos;
    for (const key of ['summit', 'oasis', 'port']) {
      const pl = PLACES[key]; if (!pl || this.found.includes(key) || Math.hypot(P.x - pl.x, P.z - pl.z) > (key === 'summit' ? 30 : 60)) continue;
      this.found.push(key); PLAYER.money += 250; UI.money(); AUDIO.coin(); UI.big('発見：' + pl.name, `+$250　（${this.found.length} / 3）`, 2.6); writeSave();
    }
  },
  start(fresh) {
    WORLD.reset(); clearMission(); PICK.reset();
    const s = fresh ? null : loadSave();
    if (s) {
      Object.assign(PLAYER, { money: s.money || 0 }); PLAYER.owned = Object.assign({ fist: true, pistol: true, smg: false }, s.owned || {});
      PLAYER.ammo = Object.assign({ pistol: 48, smg: 0 }, s.ammo || {}); PLAYER.mag = Object.assign({ pistol: 12, smg: 0 }, s.mag || {});
      this.done = s.done || 0; this.cash = s.cash || []; this.stunts = s.stunts || []; this.found = s.found || [];
      const p = s.pos || {}; PLAYER.reset(p.x != null ? p.x : PLACES.garage.x, p.z != null ? p.z : PLACES.garage.z, p.yaw || 0);
    } else {
      PLAYER.money = 150; PLAYER.owned = { fist: true, pistol: true, smg: false }; PLAYER.ammo = { pistol: 36, smg: 0 }; PLAYER.mag = { pistol: 12, smg: 0 };
      this.done = 0; this.cash = []; this.stunts = []; this.found = [];
      PLAYER.reset(PLACES.garage.x + 2, PLACES.garage.z + 0.6, 0);
    }
    PLAYER.weapon = 0; PLAYER.armor = s && s.armor || 0; PLAYER.hp = 100;
    PICK.init();
    CAM.snap = true; this.state = 'play'; showScreen(null); setTouchMode(false);
    UI.money(true); UI.stars(); UI.weapon();
    UI.obj(this.done < MISSIONS.length ? '地図の <b style="color:#e8c27a">N</b>（ナビールの店）へ行くと仕事がもらえる' : '自由に街を走ろう。$ の袋もさがしてみよう');
    if (fresh) setTimeout(() => UI.say([['', '砂の色をした海辺の街、ミラージュ・シティ。'], ['ナビール', 'おまえが新入りか。仕事がほしいなら、うちの店（地図の N）まで来い。']]), 800);
    AUDIO.resume(); AUDIO.amb(true);
    if (!IS_TOUCH) hint('クリックでマウスを固定 ・ WASDで移動 ・ Fで車に乗る');
    else hint('左側をなぞって移動・右側をなぞって視点。車の近くで「乗る」');
  },
  pause() { if (this.state !== 'play') return; this.state = 'pause'; $('pStat').textContent = `所持金 $${PLAYER.money.toLocaleString()} ・ 仕事 ${this.done}/${MISSIONS.length}`; showScreen('pause'); if (document.pointerLockElement) document.exitPointerLock(); AUDIO.duck(true); writeSave(); },
  resume() { if (this.state !== 'pause') return; this.state = 'play'; showScreen(null); AUDIO.duck(false); },
  toTitle() { writeSave(); this.state = 'title'; showScreen('title'); $('tCont').disabled = !loadSave(); AUDIO.amb(false); AUDIO.engineOff(); AUDIO.sirenStop(); RADIO.stop(); },
  wasted() {
    if (!PLAYER.alive) return;
    PLAYER.alive = false; this.endScene('ダウン', '病院で目をさました（所持金 −10%）', PLACES.hospital);
  },
  busted() {
    if (!PLAYER.alive) return;
    PLAYER.alive = false; PLAYER.h.anim = 'surrender'; this.endScene('逮捕', '警察署から出てきた（所持金 −10%、弾が減った）', PLACES.police, true);
  },
  endScene(title, sub, place, busted) {
    if (this.mission) failMission(busted ? '逮捕された' : 'やられた');
    UI.big(title, '', 3); AUDIO.sirenStop(); AUDIO.engineOff(); RADIO.stop(); $('rot').style.filter = 'grayscale(.8) brightness(.8)';
    setTimeout(() => {
      $('rot').style.filter = '';
      if (PLAYER.car) PLAYER.leaveCar(true);
      PLAYER.money = Math.floor(PLAYER.money * 0.9); if (busted) { PLAYER.ammo.pistol = Math.floor(PLAYER.ammo.pistol / 2); PLAYER.ammo.smg = Math.floor(PLAYER.ammo.smg / 2); }
      WANTED.reset(); UI.stars();
      for (const p of WORLD.peds.slice()) if (p.kind === 'police') WORLD.removePed(p);
      for (const c of WORLD.cars.slice()) if (c.police || c.dead) WORLD.removeCar(c);
      PLAYER.reset(place.x, place.z, Math.PI); PLAYER.h.anim = 'idle'; CAM.snap = true; UI.money(true);
      UI.big('', sub, 3); writeSave();
    }, 3600);
  },
};
// ---------- 画面 ----------
function showScreen(id) { for (const s of ['title', 'pause', 'settings', 'how', 'load']) $(s).classList.toggle('on', s === id); document.body.classList.toggle('playing', !id); }
let hintT = null;
function hint(t, ms = 6000) { const h = $('hint'); h.innerHTML = t; h.style.opacity = 1; clearTimeout(hintT); hintT = setTimeout(() => (h.style.opacity = 0), ms); }
const UI = {
  _money: 0, subQ: [], subT: 0,
  money(snap) { if (snap) this._money = PLAYER.money; },
  stars() { const bs = $('stars').children; for (let i = 0; i < 5; i++) bs[i].classList.toggle('on', i < WANTED.level); $('stars').style.visibility = WANTED.level ? 'visible' : 'hidden'; },
  hitMark(kill) { this.hitT = 0.3; $('hitm').className = kill ? 'kill' : ''; AUDIO.hit(kill); },
  weapon() { const W = PLAYER.weaponDef; $('weapon').innerHTML = PLAYER.car ? '' : W.id === 'fist' ? '素手' : `${W.name}<small>${PLAYER.mag[W.id]} / ${PLAYER.ammo[W.id]}</small>`; },
  obj(html) { $('obj').innerHTML = html ? `<span>${html}</span>` : ''; },
  say(lines) { this.subQ.push(...lines); if (this.subT <= 0) this.nextSub(); },
  nextSub() {
    const l = this.subQ.shift(); if (!l) { $('sub').style.opacity = 0; this.subT = 0; return; }
    $('sub').innerHTML = (l[0] ? `<b>${l[0]}</b>　` : '') + l[1]; $('sub').style.opacity = 1; this.subT = 2.2 + l[1].length * 0.075;
  },
  big(t, p, sec = 2.5) { const b = $('big'); b.querySelector('h1').textContent = t; b.querySelector('p').textContent = p; b.style.opacity = 1; clearTimeout(this._bt); this._bt = setTimeout(() => (b.style.opacity = 0), sec * 1000); },
  update(dt) {
    // お金は数字が回って増える
    if (this._money !== PLAYER.money) { const d = PLAYER.money - this._money; this._money += Math.sign(d) * Math.max(1, Math.ceil(Math.abs(d) * Math.min(1, dt * 6))); if (Math.abs(PLAYER.money - this._money) < 1) this._money = PLAYER.money; }
    $('money').textContent = '$' + Math.round(this._money).toLocaleString();
    if (this.subT > 0) { this.subT -= dt; if (this.subT <= 0) this.nextSub(); }
    // 車の速さ
    const sp = $('speed'); if (PLAYER.car) { sp.style.display = 'block'; sp.firstChild.nodeValue = Math.round(PLAYER.car.speed * 3.6); } else sp.style.display = 'none';
    // 乗れる車の案内
    const pr = $('prompt');
    if (!PLAYER.car && PLAYER.alive && GAME.state === 'play') { const c = PLAYER.nearCar(); if (c) { pr.style.display = 'block'; pr.textContent = (IS_TOUCH ? '「乗る」ボタンで' : 'F：') + (c.ai ? '運転手を引きずり出す' : c.police ? 'パトカーに乗る' : '車に乗る'); $('bEnter').classList.add('on'); } else { pr.style.display = 'none'; $('bEnter').classList.remove('on'); } }
    else pr.style.display = 'none';
    // 照準
    // 照準：構えているときだけ。人に重なると赤、すき間は今の弾のばらつき（反動で広がる）
    const cr = $('cross'), W = PLAYER.weaponDef, show = !PLAYER.car && PLAYER.alive && W.id !== 'fist' && PLAYER.gunUp;
    cr.style.display = show ? 'block' : 'none';
    if (show) {
      cr.classList.toggle('lock', !!(PLAYER.aimHit && PLAYER.aimHit.kind === 'ped'));
      const gap = clamp(PLAYER.spreadNow() / Math.tan(camera.fov * Math.PI / 360) * VH() / 2, 3, 46);
      cr.style.setProperty('--gap', gap.toFixed(1) + 'px');
    }
    // 当たった印
    this.hitT = Math.max(0, (this.hitT || 0) - dt); const hm = $('hitm'); hm.style.opacity = this.hitT > 0 ? Math.min(1, this.hitT / 0.12) : 0;
    if (this.hitT > 0) hm.style.transform = `scale(${1 + (0.3 - this.hitT) * 0.8})`;
    // 画面効果
    GAME.hurtFx = Math.max(0, GAME.hurtFx - dt * 0.8); $('hurt').style.opacity = Math.max(GAME.hurtFx, PLAYER.hp < 25 && PLAYER.alive ? 0.35 + Math.sin(GAME.t * 5) * 0.15 : 0);
    GAME.flash = Math.max(0, GAME.flash - dt * 2.5); $('flash').style.opacity = GAME.flash * 0.6;
    drawMinimap();
  },
};
// ---------- 地図（右回り：カメラの向きが上） ----------
const mmc = $('mmc'), mmg = mmc.getContext('2d');
function drawMinimap() {
  const S = mmc.width, R2 = S / 2, g = mmg, P = PLAYER.car || PLAYER.pos, px = P.x, pz = P.z;
  // 1m あたりの点：歩きは近く、車は速いほど遠くまで見える
  const zWant = PLAYER.car ? clamp(1.35 - Math.abs(PLAYER.car.speed) * 0.026, 0.55, 1.35) : 1.9;
  UI.mmZ = UI.mmZ ? UI.mmZ + (zWant - UI.mmZ) * 0.04 : zWant;
  const scale = UI.mmZ * (S / 344);
  g.clearRect(0, 0, S, S); g.save();
  g.beginPath(); g.arc(R2, R2, R2 - 10, 0, TAU); g.clip();
  g.fillStyle = '#9a835c'; g.fillRect(0, 0, S, S);
  g.translate(R2, R2); g.rotate(CAM.yaw); g.scale(scale, scale);
  const ms = MAP.size / MAP.px; g.drawImage(MAPC, (MAP.x0 - px), (MAP.z0 - pz), MAP.size, MAP.size);
  void ms;
  const blip = (x, z, col, r = 7, label) => {
    let dx = x - px, dz = z - pz; const lim = (R2 - 18) / scale, d = Math.hypot(dx, dz);
    if (d > lim) { dx *= lim / d; dz *= lim / d; }
    g.save(); g.translate(dx, dz); g.rotate(-CAM.yaw); g.scale(1 / scale, 1 / scale);
    g.fillStyle = col; g.strokeStyle = '#111'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.stroke();
    if (label) { g.fillStyle = '#111'; g.font = '700 16px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, 1); }
    g.restore();
  };
  for (const c of WORLD.cars) if (c.police && !c.dead) blip(c.x, c.z, ((GAME.t * 4) | 0) % 2 ? '#ff4040' : '#4080ff', 6);
  for (const p of WORLD.peds) if (p.kind === 'police' && p.state !== 'dead' && WANTED.level) blip(p.x, p.z, '#ff6a6a', 4);
  for (const k of PICK.list) if (k.mesh.visible && k.kind === 'cash' && Math.hypot(k.x - px, k.z - pz) < 90) blip(k.x, k.z, '#7fe06a', 6, '$');
  // 街の外の場所（山頂・村・港）：見つけるまでは灰色
  for (const [key, lab] of [['summit', '山'], ['oasis', '村'], ['port', '港']]) { const pl = PLACES[key]; if (pl) blip(pl.x, pl.z, GAME.found.includes(key) ? '#f0d9a8' : '#b8b0a0', 9, lab); }
  if (PLACES.hospital) blip(PLACES.hospital.x, PLACES.hospital.z, '#e8e8e8', 8, '+');
  if (GAME.done < MISSIONS.length && !GAME.mission) blip(PLACES.garage.x, PLACES.garage.z, '#e8c27a', 10, 'N');
  if (GAME.mission && GAME.mission.blip) { const b = GAME.mission.blip; blip(b.x, b.z, b.col || '#ffd84a', 10, b.label || ''); }
  g.restore();
  // 自分の向き（矢印）
  g.save(); g.translate(R2, R2); g.rotate(CAM.yaw - (PLAYER.car ? PLAYER.car.yaw : PLAYER.yaw) + Math.PI);
  g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -16); g.lineTo(11, 12); g.lineTo(0, 6); g.lineTo(-11, 12); g.closePath(); g.fill(); g.stroke(); g.restore();
  // 縁：体力（緑）と防弾（青）
  g.lineWidth = 9; g.strokeStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.arc(R2, R2, R2 - 6, 0, TAU); g.stroke();
  g.strokeStyle = PLAYER.hp < 25 ? '#ff5a4a' : '#7fd36a'; g.beginPath(); g.arc(R2, R2, R2 - 6, Math.PI * 0.55, Math.PI * 0.55 + Math.PI * 0.9 * PLAYER.hp / 100); g.stroke();
  if (PLAYER.armor > 0) { g.strokeStyle = '#6fb4ff'; g.beginPath(); g.arc(R2, R2, R2 - 6, Math.PI * 1.55, Math.PI * 1.55 + Math.PI * 0.9 * PLAYER.armor / 100); g.stroke(); }
}
// ---------- 拾える物 ----------
const PICK = {
  list: [],
  reset() { for (const k of this.list) scene.remove(k.mesh); this.list = []; },
  mk(kind, x, z, i) {
    let mesh;
    if (kind === 'cash') { mesh = new THREE.Group(); const bag = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 9), new THREE.MeshStandardMaterial({ color: 0x5a7a3a, roughness: 0.8 })); bag.scale.set(1, 0.85, 1); bag.position.y = 0.3; const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.16, 8), bag.material); tie.position.y = 0.58; const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: dollarTex(), transparent: true })); sign.position.set(0, 0.33, 0.29); mesh.add(bag, tie, sign); }
    else { const col = kind === 'health' ? 0xe84040 : kind === 'armor' ? 0x3a7ad8 : 0x8a7a3a; mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, roughness: 0.4 })); mesh.position.y = 0.6; }
    const root = new THREE.Group(); root.add(mesh); root.position.set(x, groundH(x, z), z); scene.add(root);
    mesh.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.list.push({ kind, x, z, mesh: root, i, t: 0 });
  },
  init() {
    CASH.forEach((c, i) => { if (!GAME.cash.includes(i)) this.mk('cash', c.x, c.z, i); });
    if (PLACES.hospital) this.mk('health', PLACES.hospital.x + 3, PLACES.hospital.z);
    if (PLACES.police) this.mk('armor', PLACES.police.x - 3, PLACES.police.z);
    this.mk('ammo', PLACES.plaza.x - 6, PLACES.plaza.z - 6);
  },
  update(dt) {
    const P = PLAYER.pos;
    for (const k of this.list) {
      k.mesh.rotation.y += dt * 1.6; k.mesh.children[0].position.y = (k.kind === 'cash' ? 0 : 0.6) + Math.sin(GAME.t * 3 + k.x) * 0.06;
      if (!k.mesh.visible) { k.t -= dt; if (k.t <= 0 && k.kind !== 'cash') k.mesh.visible = true; continue; }
      if (PLAYER.alive && Math.hypot(k.x - P.x, k.z - P.z) < (PLAYER.car ? 2.4 : 1.2)) {
        if (k.kind === 'cash') { const n = 100 + ((k.i * 37) % 9) * 25; PLAYER.money += n; GAME.cash.push(k.i); k.mesh.visible = false; UI.big('', `$${n} 拾った（${GAME.cash.length}/${CASH.length}）`, 1.6); AUDIO.coin(); writeSave(); }
        else if (k.kind === 'health' && PLAYER.hp < 100) { PLAYER.hp = 100; k.mesh.visible = false; k.t = 60; AUDIO.coin(); }
        else if (k.kind === 'armor' && PLAYER.armor < 100) { PLAYER.armor = 100; k.mesh.visible = false; k.t = 60; AUDIO.coin(); }
        else if (k.kind === 'ammo') { PLAYER.ammo.pistol += 24; if (PLAYER.owned.smg) PLAYER.ammo.smg += 60; k.mesh.visible = false; k.t = 45; UI.weapon(); AUDIO.reload(); UI.big('', '弾を拾った', 1.2); }
      }
    }
  },
};
let _dollar = null;
function dollarTex() { if (_dollar) return _dollar; const c = newCanvas(64, 64), g = c.getContext('2d'); g.fillStyle = '#e8f0c0'; g.font = '700 46px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 32, 34); _dollar = new THREE.CanvasTexture(c); _dollar.colorSpace = THREE.SRGBColorSpace; return _dollar; }
// ---------- 目印（地面の光る輪） ----------
const MARK = {
  mesh: null,
  set(x, z, r = 4, col = 0xffd84a) {
    if (!this.mesh) {
      const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide });
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.4, 32, 1, true), m); cyl.position.y = 0.7; g.add(cyl);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 4), new THREE.MeshBasicMaterial({ color: col })); arrow.rotation.x = Math.PI; arrow.position.y = 3; g.add(arrow); g.userData.arrow = arrow;
      scene.add(g); this.mesh = g;
    }
    this.mesh.visible = true; this.mesh.position.set(x, groundH(x, z), z); this.mesh.scale.set(r, 1, r); this.mesh.userData.arrow.scale.set(1 / r, 1, 1 / r); this.x = x; this.z = z; this.r = r;
  },
  hide() { if (this.mesh) this.mesh.visible = false; },
  update(dt) { if (this.mesh && this.mesh.visible) { this.mesh.userData.arrow.position.y = 3 + Math.sin(GAME.t * 3) * 0.3; this.mesh.userData.arrow.rotation.y += dt * 2; } },
  inside(x, z) { return this.mesh && this.mesh.visible && Math.hypot(x - this.x, z - this.z) < this.r; },
};
// ---------- 仕事 ----------
function clearMission() { if (GAME.mission && GAME.mission.cleanup) GAME.mission.cleanup(); GAME.mission = null; MARK.hide(); }
function failMission(why) { if (!GAME.mission) return; const m = GAME.mission; clearMission(); UI.big('失敗', why, 3); UI.obj('もう一度やるなら、ナビールの店（N）へ'); void m; }
function passMission(reward, line) {
  clearMission(); GAME.done++; PLAYER.money += reward; AUDIO.fanfare();
  UI.big('仕事完了', `$${reward.toLocaleString()}`, 3.2);
  if (line) setTimeout(() => UI.say(line), 1200);
  UI.obj(GAME.done < MISSIONS.length ? '次の仕事はナビールの店（N）で' : 'すべての仕事を終えた。この街はもう、おまえの庭だ');
  writeSave();
}
function missionCar(type, x, z, yaw, o = {}) {
  for (const c of WORLD.cars.slice()) if (c !== PLAYER.car && Math.hypot(c.x - x, c.z - z) < 7) WORLD.removeCar(c);   // 場所をあける
  for (const s of PARK) if (Math.hypot(s.x - x, s.z - z) < 7) s.used = true;
  const c = WORLD.spawnCar(type, x, z, yaw, o); c.mission = true; return c;
}
const MISSIONS = [
  { name: '最初の仕事', start(m) {
      UI.say([['ナビール', '来たな。手始めに、表の白い車でスークへ行って荷物を受けとってこい。'], ['ナビール', '3分以内に戻ってこいよ。']]);
      const g = PLACES.garage; m.car = missionCar('sedan', g.x + 6, g.z + 2.25, -Math.PI / 2, { paint: [.95, .95, .93] });
      m.step = 0; m.timer = 180; UI.obj('白い車に乗れ'); m.blip = { x: m.car.x, z: m.car.z, col: '#6fb4ff' };
    }, update(m, dt) {
      if (m.car.dead) return failMission('車が壊れた');
      if (m.step >= 1) { m.timer -= dt; if (m.timer <= 0) return failMission('時間切れ'); UI.obj((m.step === 1 ? 'スーク（黄色の印）へ行け' : 'ナビールの店へ戻れ') + `　残り ${Math.floor(m.timer / 60)}:${String(Math.floor(m.timer % 60)).padStart(2, '0')}`); }
      if (m.step === 0 && PLAYER.car === m.car) { m.step = 1; MARK.set(PLACES.souk.x, PLACES.souk.z, 4); m.blip = { x: PLACES.souk.x, z: PLACES.souk.z }; }
      else if (m.step === 1 && PLAYER.car === m.car && MARK.inside(m.car.x, m.car.z) && m.car.speed < 5) { m.step = 2; UI.say([['商人', 'ナビールのところの人だね。ほら、荷物だ。']]); AUDIO.coin(); const g = PLACES.garage; MARK.set(g.x, g.z + 3, 4); m.blip = { x: g.x, z: g.z }; }
      else if (m.step === 2 && PLAYER.car === m.car && MARK.inside(m.car.x, m.car.z) && m.car.speed < 5) passMission(500, [['ナビール', 'よし、なかなかの腕だ。また頼むぞ。']]);
      else if (m.step >= 1 && PLAYER.car !== m.car) UI.obj('白い車に戻れ');
    } },
  { name: '売りもの', start(m) {
      UI.say([['ナビール', 'ホテル・ミラージュの前に、買い手が見つかったスポーツカーがある。'], ['ナビール', '傷をつけずに、ここまで持ってこい。へこんだら値が下がる。']]);
      const h = PLACES.hotel; m.car = missionCar('sports', h.x - 6, h.z + 2.25, -Math.PI / 2, { paint: [.92, .9, .86] });
      m.step = 0; m.blip = { x: m.car.x, z: m.car.z, col: '#6fb4ff' }; UI.obj('ホテルの前のスポーツカーを手に入れろ');
    }, update(m) {
      if (m.car.dead) return failMission('車が壊れた');
      if (m.step === 0 && PLAYER.car === m.car) { m.step = 1; const g = PLACES.garage; MARK.set(g.x, g.z + 3, 4); m.blip = { x: g.x, z: g.z }; WANTED.set(1); UI.say([['', 'ホテルの警備員に見られた！']]); }
      if (m.step === 1) {
        UI.obj(`ナビールの店へ持っていけ　車の状態 ${Math.max(0, Math.round(m.car.hp / 10))}%` + (WANTED.level ? '（先に警察をまけ）' : ''));
        if (PLAYER.car === m.car && MARK.inside(m.car.x, m.car.z) && m.car.speed < 5 && WANTED.level === 0) {
          if (m.car.hp < 600) return failMission('傷だらけで売りものにならない');
          m.car.mission = false; m.car.ai = { mode: 'park' }; PLAYER.leaveCar(); passMission(1200, [['ナビール', 'きれいなもんだ。買い手も喜ぶ。']]);
        }
      }
    } },
  { name: 'ひったくり', start(m) {
      UI.say([['ナビール', 'うちの売上を持ったやつが、ピックアップで逃げた！'], ['ナビール', '広場のあたりだ。車をぶつけるか撃って止めろ。']]);
      const pz = PLACES.plaza, s = WORLD.laneSpot(30, 140) || { x: pz.x, z: pz.z, a: 0, b: 1 };
      m.car = missionCar('suv', s.x, s.z, 0, { paint: [.55, .2, .15] }); m.car.ai = { mode: 'flee', speed: 24 }; m.car.driverH = seatHuman(m.car, 'casual');
      m.step = 0; m.blip = { x: m.car.x, z: m.car.z, col: '#ff5a4a' }; UI.obj('赤いピックアップを止めろ');
    }, update(m) {
      if (m.step === 0) {
        m.blip.x = m.car.x; m.blip.z = m.car.z;
        if (Math.hypot(m.car.x - PLAYER.pos.x, m.car.z - PLAYER.pos.z) > 420) return failMission('逃げられた');
        if (m.car.hp < 380 || m.car.dead) {
          m.step = 1; m.car.ai = null; if (m.car.driverH) { disposeHuman(m.car.driverH); m.car.driverH = null; }
          const p = WORLD.spawnPed(true, 'casual'); if (p) { p.x = m.car.x + 2; p.z = m.car.z; p.state = 'flee'; p.fleeT = 12; p.fx = PLAYER.pos.x; p.fz = PLAYER.pos.z; }
          m.bag = { x: m.car.x + 2.5, z: m.car.z + 1 }; MARK.set(m.bag.x, m.bag.z, 1.6, 0x7fe06a); m.blip = { x: m.bag.x, z: m.bag.z, col: '#7fe06a', label: '$' };
          UI.obj('落としたカバンを拾え');
        }
      } else if (m.step === 1 && !PLAYER.car && MARK.inside(PLAYER.pos.x, PLAYER.pos.z)) {
        m.step = 2; AUDIO.coin(); const g = PLACES.garage; MARK.set(g.x, g.z + 3, 4); m.blip = { x: g.x, z: g.z }; UI.obj('売上をナビールの店へ届けろ');
      } else if (m.step === 2 && MARK.inside(PLAYER.pos.x, PLAYER.pos.z)) {
        PLAYER.owned.smg = true; PLAYER.ammo.smg += 120; PLAYER.mag.smg = 30;
        passMission(1500, [['ナビール', '助かった！　礼にこいつをやる。サブマシンガンだ。'], ['', '（武器の切りかえでサブマシンガンが使える）']]);
      }
    } },
  { name: '砂漠の取引', start(m) {
      UI.say([['ナビール', '最後の大仕事だ。東の砂漠ハイウェイの先、オアシスの村のガソリンスタンドで荷物を受けとってこい。'], ['ナビール', '遠いぞ、速い車で行け。警察が嗅ぎつけてるかもしれん。気をつけろ。']]);
      const d = PLACES.desertEdge; MARK.set(d.x, d.z, 5); m.blip = { x: d.x, z: d.z }; m.step = 0; UI.obj('オアシスの村のガソリンスタンド（黄色の印）へ行け');
      m.crate = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.8), MAT.wood); m.crate.position.set(d.x, groundH(d.x, d.z) + 0.4, d.z); m.crate.castShadow = true; scene.add(m.crate);
    }, cleanup(m) { if (m.crate) scene.remove(m.crate); }, update(m) {
      if (m.step === 0 && MARK.inside(PLAYER.pos.x, PLAYER.pos.z)) {
        m.step = 1; scene.remove(m.crate); m.crate = null; AUDIO.coin(); WANTED.set(3); UI.say([['', '荷物を受けとった。……サイレンだ！']]);
        const g = PLACES.garage; MARK.set(g.x, g.z + 3, 4); m.blip = { x: g.x, z: g.z }; UI.obj('警察をまいてから、ナビールの店へ');
      } else if (m.step === 1 && MARK.inside(PLAYER.pos.x, PLAYER.pos.z)) {
        if (WANTED.level > 0) UI.obj('警察を連れてくるな！　先にまけ');
        else passMission(3000, [['ナビール', 'やったな。これでおまえも、この街の顔だ。'], ['', '（すべての仕事を終えた。自由に街を走ろう）']]);
      } else if (m.step === 1) UI.obj(WANTED.level ? '警察をまけ（★が消えるまで、見つからない所へ）' : 'ナビールの店へ戻れ');
    } },
];
function missionTick(dt) {
  const g = PLACES.garage;
  if (!GAME.mission && GAME.done < MISSIONS.length && PLAYER.alive && Math.hypot(PLAYER.pos.x - g.x, PLAYER.pos.z - g.z) < 3 && WANTED.level === 0) {
    const def = MISSIONS[GAME.done], m = { def, cleanup: def.cleanup ? () => def.cleanup(m) : null };
    GAME.mission = m; UI.big(def.name, `仕事 ${GAME.done + 1} / ${MISSIONS.length}`, 2.5); def.start(m);
  }
  if (GAME.mission) GAME.mission.def.update(GAME.mission, dt);
  GAME.discT = (GAME.discT || 0) + dt; if (GAME.discT > 0.5 && PLAYER.alive) { GAME.discT = 0; GAME.discover(); }
  // 店の前の目印（仕事がまだあるとき）
  if (!GAME.mission && GAME.done < MISSIONS.length) { if (!MARK.mesh || !MARK.mesh.visible || MARK.x !== g.x) MARK.set(g.x, g.z, 1.6, 0xe8c27a); }
  else if (!GAME.mission && MARK.mesh && MARK.mesh.visible && MARK.x === g.x) MARK.hide();
  MARK.update(dt);
}
// ---------- セーブ ----------
function loadSave() { try { const s = JSON.parse(localStorage.getItem('mirage-save')); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function writeSave() {
  if (GAME.state !== 'play' && GAME.state !== 'pause') return;
  const P = PLAYER.car ? { x: PLAYER.car.x - Math.cos(PLAYER.car.yaw) * 2, z: PLAYER.car.z + Math.sin(PLAYER.car.yaw) * 2 } : PLAYER.pos;
  const s = { v: 1, money: PLAYER.money, owned: PLAYER.owned, ammo: PLAYER.ammo, mag: PLAYER.mag, armor: Math.round(PLAYER.armor), done: GAME.done, cash: GAME.cash, stunts: GAME.stunts, found: GAME.found, pos: PLAYER.alive ? { x: +P.x.toFixed(1), z: +P.z.toFixed(1), yaw: +PLAYER.yaw.toFixed(2) } : null, at: Date.now() };
  try { localStorage.setItem('mirage-save', JSON.stringify(s)); } catch (e) { /* 保存できない */ }
}
// ---------- メニュー ----------
function setupMenus() {
  $('tNew').onclick = () => { AUDIO.resume(); if (loadSave() && !$('tNew').dataset.arm) { $('tNew').dataset.arm = 1; $('tNew').textContent = 'もう一度押すと、最初から（セーブは消えます）'; setTimeout(() => { delete $('tNew').dataset.arm; $('tNew').textContent = 'はじめから'; }, 4000); return; } try { localStorage.removeItem('mirage-save'); } catch (e) { /* なし */ } GAME.start(true); };
  $('tCont').onclick = () => { AUDIO.resume(); GAME.start(false); };
  let back = 'title';
  const openSet = from => { back = from; showScreen('settings'); drawSet(); };
  const drawSet = () => {
    for (const b of $('sQ').children) b.classList.toggle('on', b.dataset.v === SET.quality);
    for (const b of $('sFps').children) b.classList.toggle('on', +b.dataset.v === +SET.fps);
    $('sSens').value = SET.sens; $('sVol').value = SET.vol;
  };
  for (const b of $('sQ').children) b.onclick = () => { SET.quality = b.dataset.v; saveSet(); applyQuality(); drawSet(); };
  for (const b of $('sFps').children) b.onclick = () => { SET.fps = +b.dataset.v; saveSet(); drawSet(); $('fps').textContent = ''; };
  $('sSens').oninput = () => { SET.sens = +$('sSens').value; saveSet(); };
  $('sVol').oninput = () => { SET.vol = +$('sVol').value; saveSet(); AUDIO.setVol(); };
  $('sBack').onclick = () => showScreen(back);
  $('tSet').onclick = () => openSet('title'); $('pSet').onclick = () => openSet('pause');
  $('tHow').onclick = () => { back = 'title'; showScreen('how'); }; $('pHow').onclick = () => { back = 'pause'; showScreen('how'); };
  $('hBack').onclick = () => showScreen(back);
  $('pRes').onclick = () => GAME.resume(); $('pTitle').onclick = () => GAME.toTitle();
}
