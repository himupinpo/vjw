
// ================= はじめる・まわす =================
function applyHome(S) {
  if (!S || typeof S !== 'object') return;
  if (typeof S.land === 'boolean' && S.land !== ROT.on) { ROT.on = S.land; onResize(); }
  if (typeof S.sound === 'boolean') HUB.sound = S.sound;
  if (typeof S.vol === 'number') HUB.vol = clamp(S.vol, 0, 1);
  AU.applyVol();
}
// ---------- ロビー：タイトルで、自分のペンキっ子が台の上でブキを持って待っている ----------
const LOBBY = { a: null, key: '', ped: null, act: null, actT: 2.5, h: 0, vy: 0 };
function lobbyBuild() {
  const key = [SET.weapon, SET.acc, SET.accCol, G.pal[0], G.pal[1]].join('|');
  if (LOBBY.a && LOBBY.key === key) return;
  if (LOBBY.a) { scene.remove(LOBBY.a.model.root); LOBBY.a.model.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  const a = { name: '', team: 1, w: WBY[SET.weapon] || WBY.basic, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, aimYaw: 0, aimPitch: 0, hp: HP_MAX, ink: INK_MAX, ws: {},
    dive: false, swim: false, onGround: true, dead: false, inv: 0, moveSpd: 0, bob: 0, armor: 0, dashT: 0, cloakT: 0, markT: 0, revealed: false, climb: null, sj: null, acc: SET.acc || 'none', accCol: SET.accCol ?? 0xffffff };
  buildModel(a); a.model.root.traverse(o => { if (o.isMesh) o.castShadow = false; }); a.model.root.scale.setScalar(1.25);
  if (!LOBBY.ped) {
    const g = new T.Group();
    const base = new T.Mesh(new T.CylinderGeometry(.8, .92, .3, 40), new T.MeshStandardMaterial({ color: 0x2a2733, roughness: .4, metalness: .2 })); base.position.y = -.15; g.add(base);
    const top = new T.Mesh(new T.CircleGeometry(.79, 40), rimify(new T.MeshStandardMaterial({ color: 0xffffff, roughness: .2 }))); top.rotation.x = -Math.PI / 2; top.position.y = .005; g.add(top);
    const ring = new T.Mesh(new T.TorusGeometry(.85, .05, 8, 48), new T.MeshBasicMaterial({ color: 0xffffff })); ring.rotation.x = Math.PI / 2; g.add(ring);
    g.userData.top = top; g.userData.ring = ring; g.scale.setScalar(1.25); scene.add(g); LOBBY.ped = g;
  }
  LOBBY.ped.userData.top.material.color.set(G.pal[0]); LOBBY.ped.userData.ring.material.color.set(G.pal[1]);
  LOBBY.a = a; LOBBY.key = key; LOBBY.act = { kind: 'hop', t: 0 }; LOBBY.vy = 5;
}
function lobbyHide() { if (LOBBY.a) LOBBY.a.model.root.visible = false; if (LOBBY.ped) LOBBY.ped.visible = false; }
const _lf = new T.Vector3(), _lu = new T.Vector3(), _lr = new T.Vector3(), _lp = new T.Vector3();
function lobbyTick(dt) {
  lobbyBuild();
  const a = LOBBY.a, asp = camera.aspect, show = asp > 1.2 && !$('title').classList.contains('hidden') || !$('dress').classList.contains('hidden') && asp > 1.2;
  if (!show) { lobbyHide(); return; }
  LOBBY.ped.visible = true;
  camera.updateMatrixWorld(); camera.getWorldDirection(_lf); _lu.set(0, 1, 0).applyQuaternion(camera.quaternion); _lr.crossVectors(_lf, _lu).normalize();
  const D = 6, halfH = D * Math.tan(camera.fov * Math.PI / 360), halfW = halfH * asp;
  _lp.copy(camera.position).addScaledVector(_lf, D).addScaledVector(_lr, halfW * .64).addScaledVector(_lu, -halfH * .5);
  LOBBY.ped.position.copy(_lp);
  // ときどき動く：ジャンプ・撃つ・もぐる・くるっと回る
  LOBBY.actT -= dt;
  if (LOBBY.actT <= 0 && !LOBBY.act) { LOBBY.actT = rand(2.4, 4.2); LOBBY.act = { kind: pick(['hop', 'shoot', 'dive', 'spin', 'look']), t: 0 }; if (LOBBY.act.kind === 'hop') LOBBY.vy = 5; }
  const act = LOBBY.act; let spin = 0;
  a.dive = false; a.aimPitch = Math.sin(clock * .7) * .08;
  if (act) {
    act.t += dt;
    if (act.kind === 'hop') { if (act.t > 1.2) LOBBY.act = null; }
    else if (act.kind === 'shoot') {
      const c = a.w.cls;
      if (act.t > (c === 'roller' || c === 'brush' || c === 'bucket' || c === 'blade' ? .45 : .26) * (act.n || 0)) {
        act.n = (act.n || 0) + 1;
        if (c === 'roller' || c === 'brush') a.ws.swing = { t: 0, dur: c === 'brush' ? .2 : .36, kind: 'down' };
        else if (c === 'bucket') a.ws.swing = { t: 0, dur: .32, kind: 'up' };
        else if (c === 'blade') a.ws.swing = { t: 0, dur: .2, kind: 'side' };
        else { a.kick = Math.min(1, (a.kick || 0) + .45); if (c === 'gatling') a.ws.spin = 1; }
      }
      if (act.t > 1.4) { LOBBY.act = null; a.ws.spin = 0; }
    } else if (act.kind === 'dive') { a.dive = act.t < .9; if (act.t > 1.3) LOBBY.act = null; }
    else if (act.kind === 'spin') { spin = smooth(0, .7, act.t) * TAU; if (act.t > .9) LOBBY.act = null; }
    else if (act.kind === 'look') { a.aimPitch = Math.sin(act.t * 4) * .35; if (act.t > 1.6) LOBBY.act = null; }
  }
  // ジャンプ（台の上だけで）
  LOBBY.vy -= 16 * dt; LOBBY.h += LOBBY.vy * dt;
  if (LOBBY.h <= 0) { if (!a.onGround && LOBBY.vy < -2) a.landT = .16; LOBBY.h = 0; LOBBY.vy = 0; a.onGround = true; } else a.onGround = false;
  a.vy = LOBBY.vy; a.swim = a.dive;
  a.x = _lp.x; a.y = _lp.y + LOBBY.h * 1.25; a.z = _lp.z;
  a.yaw = Math.atan2(camera.position.x - _lp.x, camera.position.z - _lp.z) - .45 + Math.sin(clock * .5) * .35 + spin;
  a.aimYaw = a.yaw;
  syncModel(a, dt, null);
  a.model.root.visible = true;
}
// タイトルの後ろ：ステージの上をゆっくり回り、ときどきペンキが飛ぶ（床と壁）
let titleSplat = 0;
function titleTick(dt) {
  clock += dt; PU.uTime.value = clock;
  const r = 46, a = clock * .07;
  camera.position.set(Math.sin(a) * r, 26, Math.cos(a) * r); camera.lookAt(0, 0, 0);
  if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
  titleSplat -= dt;
  if (titleSplat <= 0) {
    titleSplat = .12;
    const x = rand(GROUND[0] + 2, GROUND[2] - 2), z = rand(GROUND[1] + 2, GROUND[3] - 2), t = z > 0 ? (Math.random() < .7 ? 1 : 2) : (Math.random() < .7 ? 2 : 1);
    const r2 = rand(1, 2.6);
    paintCircle(x, hAt(x, z) + .2, z, r2, t); paintWallsNear(x, hAt(x, z) + .6, z, r2 * .8, t);
    if ((PCNT[1] + PCNT[2]) / PTOTAL > .55) clearPaint();
  }
  sun.position.set(30, 60, 20); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
  lobbyTick(dt); decoTick(dt);
  updFx(dt); uploadPaint();
}
let last = performance.now(), hold = false;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!hold) { if (G.state === 'title') titleTick(dt); else update(dt); }
  renderFrame(dt);
}
async function boot() {
  if (HUB.embedded) {
    try { applyHome(JSON.parse(localStorage.getItem('3dame-settings'))); } catch (e) { /* ホームの設定なし */ }
    addEventListener('message', e => { if (e.data && e.data.h3dSet) applyHome(e.data.h3dSet); });
  }
  onResize();
  G.pal = PALETTES[0].slice(); refreshTeamMats();
  loadStage(SET.stage && STAGES[SET.stage] ? SET.stage : 'minato');
  applyQuality();
  try { await Promise.race([document.fonts.load('400 20px "Dela Gothic One"', 'ペイントリーグ'), new Promise(r => setTimeout(r, 2000))]); } catch (e) { /* 文字が読めなくてもつづける */ }
  $('load').classList.add('hidden');
  toTitle();
  requestAnimationFrame(loop);
  addEventListener('pointerdown', () => AU.init(), { once: true });
}
// テスト用
window.__P = {
  G, SET, actors, proj, devices, WEAPONS, WBY, SUBS, SPECIALS, STAGES, PCNT, get PTOTAL() { return PTOTAL; }, get STAGE_ID() { return STAGE_ID; }, get ZONE() { return ZONE; }, FACES,
  startMatch, toTitle, setPlayerWeapon, useSpecial, throwSub, startSuperJump, loadStage, hAt, paintAtCell, findPath, navOf, NOK, clearPaint, paintFace, wallTeamAt, crossFace, BOXES: () => BOXES,
  RS, RULES, carrierOf, flagHome, goalOf, wInfo, shoot, LOBBY, ACC, weaponThumb, weaponMesh, openArmory, ARMP, equipWeapon, paintCircle, hurt,
  wallPainted() { let n = 0; for (let i = 0; i < WP.length; i++) if (WP[i]) n++; return n; },
  hold(v) { hold = !!v; },
  step(sec, dt = 1 / 60, draw = true) { for (let t = 0; t < sec; t += dt) { if (G.state === 'title') titleTick(dt); else update(dt); } if (draw) renderFrame(1 / 60); },
  input: IN, renderer, camera, scene, syncModel
};
boot();
</script>
</body></html>
