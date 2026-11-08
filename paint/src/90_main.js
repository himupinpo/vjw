
// ================= はじめる・まわす =================
function applyHome(S) {
  if (!S || typeof S !== 'object') return;
  if (typeof S.land === 'boolean' && S.land !== ROT.on) { ROT.on = S.land; onResize(); }
  if (typeof S.sound === 'boolean') HUB.sound = S.sound;
  if (typeof S.vol === 'number') HUB.vol = clamp(S.vol, 0, 1);
  AU.applyVol();
}
// タイトルの後ろ：ステージの上をゆっくり回り、ときどきペンキが飛ぶ
let titleSplat = 0;
function titleTick(dt) {
  clock += dt;
  const r = 46, a = clock * .07;
  camera.position.set(Math.sin(a) * r, 26, Math.cos(a) * r); camera.lookAt(0, 0, 0);
  if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
  titleSplat -= dt;
  if (titleSplat <= 0) {
    titleSplat = .12;
    const x = rand(-28, 28), z = rand(-46, 46), t = z > 0 ? (Math.random() < .7 ? 1 : 2) : (Math.random() < .7 ? 2 : 1);
    paintCircle(x, hAt(x, z) + .2, z, rand(1, 2.6), t);
    if ((PCNT[1] + PCNT[2]) / PTOTAL > .55) clearPaint();
  }
  sun.position.set(30, 60, 20); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
  updFx(dt); uploadPaint();
}
let last = performance.now(), hold = false;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!hold) { if (G.state === 'title') titleTick(dt); else update(dt); }
  renderer.render(scene, camera);
}
async function boot() {
  if (HUB.embedded) {
    try { applyHome(JSON.parse(localStorage.getItem('3dame-settings'))); } catch (e) { /* ホームの設定なし */ }
    addEventListener('message', e => { if (e.data && e.data.h3dSet) applyHome(e.data.h3dSet); });
  }
  onResize();
  buildHeight(); buildNav(); buildTerrain(scene);
  G.pal = PALETTES[0].slice(); setTeamColors(G.pal[0], G.pal[1]); refreshTeamMats();
  applyQuality();
  try { await Promise.race([document.fonts.load('400 20px "Dela Gothic One"', 'ペイントリーグ'), new Promise(r => setTimeout(r, 2000))]); } catch (e) { /* 文字が読めなくてもつづける */ }
  $('load').classList.add('hidden');
  toTitle();
  requestAnimationFrame(loop);
  // 最初にさわったら音を出せるように
  addEventListener('pointerdown', () => AU.init(), { once: true });
}
// テスト用
window.__P = {
  G, SET, actors, proj, devices, WEAPONS, WBY, PCNT, get PTOTAL() { return PTOTAL; }, startMatch, toTitle, setPlayerWeapon, useSpecial, throwSub, hAt, paintAtCell, findPath, navOf, NOK, clearPaint,
  hold(v) { hold = !!v; },
  step(sec, dt = 1 / 60, draw = true) { for (let t = 0; t < sec; t += dt) { if (G.state === 'title') titleTick(dt); else update(dt); } if (draw) renderer.render(scene, camera); },
  input: IN, renderer, camera
};
boot();
</script>
</body></html>
