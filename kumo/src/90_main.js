// ================= はじまり =================
let last = performance.now(), hold = false;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.1, Math.max(0, (now - last) / 1000)); last = now;
  if (hold) return;
  try { update(dt); hud(dt); render(dt); } catch (e) { if ((loop.err = (loop.err || 0) + 1) <= 3) console.error(e); }
}
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
async function boot() {
  if (HUB.embedded) {
    try { applyHome(JSON.parse(localStorage.getItem('3dame-settings'))); } catch (e) { /* ホームの設定なし */ }
    addEventListener('message', e => { if (e.data && e.data.h3dSet) applyHome(e.data.h3dSet); });
  }
  onResize(); applyQuality();
  try { await Promise.race([document.fonts.load('400 20px "Dela Gothic One"', '雲のてっぺん'), document.fonts.load('900 20px "M PLUS Rounded 1c"', '港'), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* 文字が読めなくてもつづける */ }
  $('load').textContent = '空にガラクタを積んでいます…'; await nextFrame();
  buildWorld(); buildScenery(); buildPlayer();
  respawnStart(); applySky(0, 0);
  if (IN.touchOn) document.body.classList.add('touch');
  $('load').classList.add('hidden');
  toTitle();
  requestAnimationFrame(loop);
  addEventListener('pointerdown', () => AU.init(), { once: true });
}
// テスト用
window.__K = {
  G, P, CAM, ROUTE, ZONES, COLS, MOVERS, KEEP, IN, SET, store, makeCode, readCode, startAt, togglePause, toTitle, pstep, update, render, groundBelow, fits, queryBox, pushSphere, placeSafe,
  camera, scene, renderer, get SUMMIT() { return SUMMIT; }, STEP, moverTick, collidePlayer,
  hold(v) { hold = !!v; },
  step(sec, dt = 1 / 60, draw = false) { for (let t = 0; t < sec; t += dt) { update(dt); hud(dt); } if (draw) render(1 / 60); }
};
boot();
</script>
</body></html>
