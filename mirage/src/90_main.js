// =========================================================================================
//  起動と毎フレームの流れ
// =========================================================================================
const say = t => ($('loadmsg').textContent = t);
// 3dgame のホーム画面の設定：横画面・音・視点の速さ
function applyHome(S) {
  if (!S || typeof S !== 'object') return;
  if (typeof S.land === 'boolean' && S.land !== ROT.on) { ROT.on = S.land; onResize(); }
  if (typeof S.sound === 'boolean' || typeof S.vol === 'number') { HUB.vol = S.sound === false ? 0 : clamp(typeof S.vol === 'number' ? S.vol : HUB.vol, 0, 1); AUDIO.setVol(); }
  if (typeof S.sens === 'number') HUB.sens = clamp(S.sens, 0.4, 2.2);
}
let last = performance.now(), fpsAcc = 0, fpsN = 0, titleA = 0;
const _sunT = new THREE.Vector3();
let RUN = true;
function frame(now) {
  requestAnimationFrame(frame);
  const real = (now - last) / 1000, dt = Math.min(0.05, real); last = now;
  if (!RUN) return;
  fpsAcc += real; fpsN++; if (fpsAcc > 0.5) { if (SET.fps) $('fps').textContent = Math.round(fpsN / fpsAcc) + ' fps'; fpsAcc = 0; fpsN = 0; }
  // ジャンプ台から飛んでいる間はスローモーション
  const C = PLAYER.car, slowWant = GAME.state === 'play' && C && C.air && C.takeoff && C.takeoff.ramp >= 0 && !C.dead ? 0.42 : 1;
  GAME.slow += (slowWant - GAME.slow) * Math.min(1, real * (slowWant < GAME.slow ? 9 : 4));
  if (Math.abs(GAME.slow - slowWant) < 0.01) GAME.slow = slowWant;
  tick(dt * GAME.slow);
  if (gtao.enabled) composer.render(dt); else renderer.render(scene, camera);
}
function tick(dt) {
  if (GAME.state === 'play') {
    GAME.t += dt;
    if (IN.pressed.has('pause') && performance.now() - (GAME.pausedAt || 0) > 400) { GAME.pause(); GAME.pausedAt = performance.now(); }
    if (IN.pressed.has('cam')) CAM.mode ^= 1;
    if (IN.pressed.has('map')) { const m = $('mm'), big = m.style.width === '300px'; m.style.width = m.style.height = big ? '' : '300px'; }
    PLAYER.update(dt);
    WORLD.update(dt);
    PICK.update(dt);
    missionTick(dt);
    FX.update(dt);
    updateCamera(dt);
    UI.update(dt);
    AUDIO.sirenTick();
    GAME.saveT += dt; if (GAME.saveT > 30 && WANTED.level === 0 && !GAME.mission && PLAYER.alive) { GAME.saveT = 0; writeSave(); }
  } else {
    if (GAME.state === 'pause' && IN.pressed.has('pause') && performance.now() - (GAME.pausedAt || 0) > 400) { GAME.resume(); GAME.pausedAt = performance.now(); }
    if (GAME.state === 'title' || GAME.state === 'load') {   // タイトル：街の上をゆっくり回る
      titleA += dt * 0.045; const c = PLACES.plaza || { x: 290, z: 290 };
      camera.position.set(c.x + Math.sin(titleA) * 190, 72, c.z - 40 + Math.cos(titleA) * 190); camera.lookAt(c.x, 8, c.z - 40);
      PLAYER.pos.set(c.x, 0, c.z);
    }
    FX.update(dt);
  }
  IN.pressed.clear();
  // 海のさざ波
  if (MAT.water && MAT.water.normalMap) { MAT.water.normalMap.offset.x += dt * 0.012; MAT.water.normalMap.offset.y += dt * 0.007; }
  // 影はカメラの見ている所のまわりだけ細かく
  const P = GAME.state === 'play' ? PLAYER.pos : camera.position;
  _sunT.set(Math.round(P.x * 2) / 2, 0, Math.round(P.z * 2) / 2);
  if (CITY.skirt) { CITY.skirt.position.set(camera.position.x, -1.2, camera.position.z); CITY.skirt.scale.y = Math.max(1, camera.position.y + 150); }
  sun.target.position.copy(_sunT); sun.position.copy(_sunT).addScaledVector(SUN_DIR, 150);
}
async function boot() {
  if (HUB.embedded) {
    try { applyHome(JSON.parse(localStorage.getItem('3dame-settings'))); } catch (e) { /* ホームの設定なし */ }
    addEventListener('message', e => { if (e.data && e.data.h3dSet) applyHome(e.data.h3dSet); });
  }
  onResize(); applyQuality();
  try {
    await loadAll(say);
    TEX.hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = TEX.hdr; scene.environment = TEX.hdr;
    scene.backgroundRotation.set(0, 2.2, 0); scene.environmentRotation.set(0, 2.2, 0);
    scene.environmentIntensity = 0.75; scene.backgroundIntensity = 0.95;
    await buildCity(say);
    PLAYER.init(); PLAYER.h.root.visible = false;
    setupMenus();
    applyQuality();
    GAME.state = 'title'; showScreen('title'); $('tCont').disabled = !loadSave();
    requestAnimationFrame(frame);
  } catch (err) {
    say('読み込みに失敗しました。ページを再読み込みしてください。（' + (err && err.message || err) + '）');
    console.error(err);
  }
}
window.__MC = { loop: v => (RUN = v), step: (sec, d = 1 / 30) => { for (let t = 0; t < sec; t += d) tick(d); }, THREE, scene, camera, renderer, __composer: composer, gtao, GAME, PLAYER, WORLD, WANTED, CAM, IN, MAP, CITY, PLACES, PARK, CASH, COL, ROAD, MISSIONS, PICK, UI, AUDIO, RADIO, SET, applyQuality, groundH, segBlock, FX, crime, writeSave, loadSave, MAT, TEX, POP, aimCast, poseHuman, makeHuman, HUMAN_DATA, REG, natH, regionH, roadNear, onPaved, MARK, get MAPC() { return MAPC; }, sun };
boot();
