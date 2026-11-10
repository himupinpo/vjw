// ================= ゲームの進みぐあい =================
const G = { state: 'boot', t: 0, acc: 0, cp: 0, sec: 0, cleared: false, titleT: 0, saveT: 0, hintT: 0, hintTx: '', test: null };
// テストのときは、決めた入力で動かせる
function ctrl() {
  if (G.test) return G.test;
  const [mx, mz] = moveAxes();
  return { mx, mz, jumpE: takeEdge('jumpE'), jumpHeld: IN.jumpHeld, hL: handL(), hR: handR() };
}
function update(dt) {
  G.t += dt;
  if (G.state !== 'play') { syncObjs(); animPlayer(dt); return; }
  P.time += dt;
  const inp = ctrl();
  G.acc += dt; let n = 0; let jumpE = inp.jumpE;
  while (G.acc >= PH && n < 8) {
    const one = Object.assign({}, inp, { jumpE }); jumpE = false;
    for (const f of MECH) f(PH, G.t);
    pstep(PH, one); world.step(PH); afterPhys();
    G.acc -= PH; n++;
  }
  if (n >= 8) G.acc = 0;
  syncObjs(); animPlayer(dt); afterStep(dt);
}
function afterStep(dt) {
  const b = P.body.position;
  // チェックポイント
  for (let i = 0; i < CPS.length; i++) { const c = CPS[i]; if (i > G.cp && Math.hypot(b.x - c.x, b.z - c.z) < c.r && b.y > c.y - 1 && b.y < c.y + 4) { G.cp = i; G.sec = c.sec; AU.chime(); banner(SECS[c.sec].name, `${SECS[c.sec].sub}　チェックポイント`); save(); } }
  for (let i = 0; i < CPS.length; i++) { const c = CPS[i]; c.ring.material = mat('glow', i <= G.cp ? 0xffe066 : 0x8af0ff); c.ring.rotation.y += dt * (i === G.cp ? 1.2 : .4); }
  // 落ちた
  if (b.y < -18) { P.falls++; AU.fall(); respawn(); toast('チェックポイントからやり直し'); }
  for (const p of PROPS) if (p.b.position.y < -18) resetProp(p);
  // 説明
  let tx = '';
  for (const hh of HINTS) if (Math.hypot(b.x - hh.x, b.z - hh.z) < hh.r && b.y > hh.y0 && b.y < hh.y1) { tx = hh.text; break; }
  if (tx !== G.hintTx) { G.hintTx = tx; if (tx) $('hint').textContent = tx; $('hint').classList.toggle('on', !!tx); }
  // ぶつかった音（強く当たったとき）
  if ((G.saveT += dt) > 3) { G.saveT = 0; save(); }
}
function respawn() { const c = CPS[G.cp]; placePlayer(c.x, c.y, c.z, c.yaw); }
function save() { if (G.cleared) return; store.set('save', { cp: G.cp, time: Math.round(P.time), falls: P.falls }); }

// ---------- 描く ----------
function render(dt) {
  if (G.state === 'title' || G.state === 'boot') {
    G.titleT += dt; const a = G.titleT * .06 + .4;
    camera.position.set(Math.sin(a) * 9, 3.2 + Math.sin(G.titleT * .2) * .4, 2 + Math.cos(a) * 9); camera.lookAt(0, 1.2, 0);
  } else updCam(dt);
  const f = P.body ? P.body.position : { x: 0, y: 0, z: 0 };
  sun.position.set(f.x + SUN_DIR.x * 60, f.y + SUN_DIR.y * 60, f.z + SUN_DIR.z * 60); sun.target.position.set(f.x, f.y, f.z); sun.target.updateMatrixWorld();
  skyMesh.position.copy(camera.position);
  if (BELL && !BELL.rung) BELL.mesh.rotation.z = Math.sin(G.t * 1.3) * .04;
  renderer.render(scene, camera);
}
const fmtTime = s => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`; };
let hudT = 0;
function hud(dt) {
  if (G.state !== 'play' && G.state !== 'pause') return;
  if ((hudT += dt) < .1) return; hudT = 0;
  $('hStage').textContent = G.sec + 1; $('hZone').textContent = SECS[G.sec].name;
  $('hTime').textContent = fmtTime(P.time); $('hFalls').textContent = P.falls;
  P.arms.forEach((A, i) => { const e = $(i ? 'hdR' : 'hdL'); e.classList.toggle('up', A.up); e.classList.toggle('on', !!A.grab); });
  for (const [id, i] of [['tL', 0], ['tR', 1]]) $(id).classList.toggle('grab', !!P.arms[i].grab);
}
let toastT = 0, bannerT = 0;
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 2200); }
function banner(a, b) { $('bnTitle').textContent = a; $('bnSub').textContent = b; const e = $('banner'); e.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => e.classList.remove('on'), 2600); }
function showOnly(id) { for (const k of ['title', 'pause', 'ask', 'setBox', 'helpBox', 'clear']) $(k).classList.toggle('hidden', k !== id); }

function resetWorld() {
  for (const p of PROPS) resetProp(p);
  if (MECH.resetLever) MECH.resetLever();
  if (BELL) { BELL.rung = false; BELL.t = 0; BELL.mesh.rotation.z = 0; }
}
function startAt(s) {
  G.cleared = false; resetWorld();
  if (s) { G.cp = clamp(s.cp | 0, 0, CPS.length - 1); P.time = s.time || 0; P.falls = s.falls || 0; }
  else { G.cp = 0; P.time = 0; P.falls = 0; }
  // 先のチェックポイントからなら、とちゅうのしかけはもう動いたことにする
  if (G.cp >= 3) MECH.leverDone && MECH.leverDone();
  G.sec = CPS[G.cp].sec; respawn(); G.acc = 0;
  G.state = 'play'; showOnly(null); $('hud').classList.remove('hidden'); $('touch').classList.toggle('off', !IN.touchOn); viewShow();
  banner(SECS[G.sec].name, SECS[G.sec].sub); save();
  if (!IN.touchOn) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* */ } }
}
function retrySection() {
  for (const p of PROPS) if (p.sec === G.sec || p.sec === G.sec - 1) resetProp(p);
  if (G.sec <= 2 && MECH.resetLever) MECH.resetLever();
  respawn(); togglePause(false);
}
function togglePause(on) {
  if (on && G.state === 'play') { G.state = 'pause'; showOnly('pause'); save(); IN.mL = IN.mR = false; try { document.exitPointerLock(); } catch (e) { /* */ } }
  else if (!on && G.state === 'pause') { G.state = 'play'; showOnly(null); if (!IN.touchOn) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* */ } } }
}
function toTitle() {
  if (G.state === 'play' || G.state === 'pause') save();
  G.state = 'title'; showOnly('title'); $('hud').classList.add('hidden'); $('touch').classList.add('off'); $('hint').classList.remove('on'); G.hintTx = '';
  try { document.exitPointerLock(); } catch (e) { /* */ }
  placePlayer(0, 0, 0, 0); P.time = 0;
  drawTitle();
}
function drawTitle() {
  const s = store.get('save', null);
  $('bCont').disabled = !s; $('contInfo').textContent = s ? `${SECS[CPS[clamp(s.cp | 0, 0, CPS.length - 1)].sec].name}から（${fmtTime(s.time)}・落ちた回数 ${s.falls}）` : 'まだ記録がありません';
  $('recLine').textContent = REC.clears ? `クリア ${REC.clears} 回　ベスト ${fmtTime(REC.bestTime)}` : '';
}
function clearGame() {
  if (G.cleared) return; G.cleared = true; AU.bell();
  REC.clears++; if (!REC.bestTime || P.time < REC.bestTime) { REC.bestTime = Math.round(P.time); REC.bestFalls = P.falls; } saveRec(); store.del('save');
  setTimeout(() => {
    if (G.state !== 'play' && G.state !== 'pause') return;
    $('clTime').textContent = fmtTime(P.time); $('clFalls').textContent = P.falls + ' 回'; $('clBest').textContent = fmtTime(REC.bestTime);
    G.state = 'pause'; showOnly('clear'); IN.mL = IN.mR = false; try { document.exitPointerLock(); } catch (e) { /* */ }
  }, 1800);
}
