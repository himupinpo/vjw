// ================= メニューのボタン =================
$('bStart').onclick = () => {
  AU.init(); AU.click(); const s = store.get('save', null);
  if (s && s.cp > 0) { $('askTtl').textContent = 'はじめから'; $('askTx').textContent = `いまの続き（${SECS[CPS[clamp(s.cp | 0, 0, CPS.length - 1)].sec].name}）は消えて、はじめの島からになります。`; showOnly('ask'); }
  else startAt(null);
};
$('askYes').onclick = () => { AU.click(); store.del('save'); startAt(null); };
$('askNo').onclick = () => { AU.click(); showOnly('title'); };
$('bCont').onclick = () => { AU.init(); AU.click(); const s = store.get('save', null); if (s) startAt(s); };
let helpFrom = 'title', setFrom = 'title';
$('bHelp').onclick = () => { AU.click(); helpFrom = 'title'; showOnly('helpBox'); };
$('bSet').onclick = () => { AU.click(); openSet('title'); };
$('bPause').onclick = () => { AU.init(); AU.click(); togglePause(true); };
$('bView').onclick = () => { AU.init(); AU.click(); toggleView(); };
$('pBack').onclick = () => { AU.click(); togglePause(false); };
$('pRetry').onclick = () => { AU.click(); retrySection(); };
$('pSet').onclick = () => { AU.click(); openSet('pause'); };
$('pHelp').onclick = () => { AU.click(); helpFrom = 'pause'; showOnly('helpBox'); };
$('pTitle').onclick = () => { AU.click(); toTitle(); };
$('helpDone').onclick = () => { AU.click(); showOnly(helpFrom === 'pause' ? 'pause' : 'title'); };
$('clStay').onclick = () => { AU.click(); G.state = 'play'; showOnly(null); if (!IN.touchOn) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* */ } } };
$('clTitle').onclick = () => { AU.click(); G.cleared = false; toTitle(); };

// ---------- 設定 ----------
const camTx = () => SET.camD < FP_D ? '一人称' : SET.camD.toFixed(1) + 'm';
function openSet(from) {
  setFrom = from; showOnly('setBox');
  $('sSens').value = SET.sens; $('sSensV').textContent = SET.sens.toFixed(2); $('sCamD').value = SET.camD; $('sCamDV').textContent = camTx();
  for (const b of $('sInv').children) b.classList.toggle('on', (b.dataset.v === '1') === !!SET.invY);
  for (const b of $('sQual').children) b.classList.toggle('on', b.dataset.v === SET.quality);
}
$('sSens').oninput = () => { SET.sens = +$('sSens').value; $('sSensV').textContent = SET.sens.toFixed(2); saveSet(); };
$('sCamD').oninput = () => { setCamD(+$('sCamD').value); $('sCamDV').textContent = camTx(); };
for (const b of $('sInv').children) b.onclick = () => { SET.invY = b.dataset.v === '1'; saveSet(); openSet(setFrom); AU.click(); };
for (const b of $('sQual').children) b.onclick = () => { SET.quality = b.dataset.v; saveSet(); applyQuality(); openSet(setFrom); AU.click(); };
$('setDone').onclick = () => { AU.click(); showOnly(setFrom === 'pause' ? 'pause' : 'title'); };
function applyQuality() {
  const q = SET.quality, dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(q === 'low' ? Math.min(1, dpr) * .75 : q === 'high' ? dpr : Math.min(1.5, dpr));
  const sh = q !== 'low'; renderer.shadowMap.enabled = sh; sun.castShadow = sh;
  const sz = q === 'high' ? 2048 : 1024; if (sun.shadow.mapSize.x !== sz) { sun.shadow.mapSize.set(sz, sz); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  scene.traverse(o => { if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true; });
}

// ---------- 画面の大きさ・横画面 ----------
function onResize() {
  const w = VW(), h = VH(), r = $('rot');
  document.body.classList.toggle('short', h < 500);
  r.style.width = w + 'px'; r.style.height = h + 'px'; r.style.transform = ROT.on ? 'rotate(90deg) translateY(-100%)' : 'none';
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', onResize);
function applyHome(S) {
  if (!S || typeof S !== 'object') return;
  if (typeof S.land === 'boolean' && S.land !== ROT.on) { ROT.on = S.land; onResize(); }
  if (typeof S.sound === 'boolean') HUB.sound = S.sound;
  if (typeof S.vol === 'number') HUB.vol = clamp(S.vol, 0, 1);
  AU.applyVol();
}
