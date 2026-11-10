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
  try { await Promise.race([document.fonts.load('400 20px "Dela Gothic One"', 'ふにゃもち'), document.fonts.load('900 20px "M PLUS Rounded 1c"', '島'), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* 文字が読めなくてもつづける */ }
  $('load').textContent = '島をふくらませています…'; await nextFrame();
  buildLevel(); buildPlayer(0, 1, 0);
  if (IN.touchOn) document.body.classList.add('touch');
  $('load').classList.add('hidden');
  toTitle();
  requestAnimationFrame(loop);
  addEventListener('pointerdown', () => AU.init(), { once: true });
}
// テスト用
window.__F = {
  G, P, CAM, CPS, PROPS, MECH, IN, SET, world, store, startAt, togglePause, toTitle, update, render, placePlayer, respawn, camera, scene, PH,
  get BELL() { return BELL; },
  hold(v) { hold = !!v; },
  // 決めた入力で sec 秒すすめる（inp を関数にすると毎回えらべる）
  run(sec, inp, dt = 1 / 60) { for (let t = 0; t < sec; t += dt) { G.test = Object.assign({ mx: 0, mz: 0, jumpE: false, jumpHeld: false, hL: false, hR: false }, typeof inp === 'function' ? inp(t) : inp); update(dt); hud(dt); } G.test = null; }
};
boot();
</script>
</body></html>
