// ================= メニューのボタン =================
let codeMode = 'out', codeFrom = 'title';
const back = () => { if (codeFrom === 'pause' && G.state === 'pause') showOnly(G.cleared ? 'clear' : 'pause'); else if (G.state === 'title') showOnly('title'); else showOnly(null); };
function openCode(mode, from) {
  codeMode = mode; codeFrom = from; showOnly('codeBox'); const tx = $('codeTx'); $('codeMsg').textContent = '';
  if (mode === 'out') {
    $('codeTtl').textContent = 'いまの場所のコード';
    if (!(P.onGround && !(P.gCol && P.gCol.mv))) { tx.value = ''; $('codeNote').textContent = 'コードは、止まっている足場の上に立っているときに作れます。'; $('codeAct').textContent = 'もどる'; return; }
    tx.value = makeCode(snap()); tx.readOnly = true;
    $('codeNote').textContent = `この場所（${Math.round(P.pos.y)} m）のコードです。メモしておくと、「コードで続きから」でこの場所にもどれます。最高の高さ・落ちた回数・時間も入っています。`;
    $('codeAct').textContent = 'コピーする';
  } else {
    $('codeTtl').textContent = 'コードで続きから'; tx.value = ''; tx.readOnly = false;
    $('codeNote').textContent = 'とっておいたコード（20文字）を入れて「この場所へ」を押してください。いまの続きは、そのコードの場所に変わります。';
    $('codeAct').textContent = 'この場所へ'; setTimeout(() => { try { tx.focus(); } catch (e) { /* */ } }, 60);
  }
}
$('codeAct').onclick = async () => {
  AU.init(); AU.click(); const tx = $('codeTx');
  if (codeMode === 'out') {
    if (!tx.value) { back(); return; }
    let okc = false; try { await navigator.clipboard.writeText(tx.value); okc = true; } catch (e) { /* コピーできない環境 */ }
    if (!okc) { try { tx.readOnly = false; tx.select(); okc = document.execCommand('copy'); tx.readOnly = true; } catch (e) { /* */ } }
    $('codeMsg').textContent = okc ? 'コピーしました！' : 'コピーできませんでした。長押しして選んでコピーしてください';
    return;
  }
  const r = readCode(tx.value);
  if (r.err) { $('codeMsg').textContent = r.err; return; }
  $('codeMsg').textContent = '';
  startAt(r.s); toast(`${Math.round(r.s.y)} m から続けます`);
};
$('codeClose').onclick = () => { AU.click(); back(); };
$('codeTx').addEventListener('keydown', e => { if (e.key === 'Enter') $('codeAct').click(); e.stopPropagation(); });
$('codeTx').addEventListener('input', () => { if (codeMode === 'in') { const t = $('codeTx').value.toUpperCase().replace(/[^0-9A-Z]/g, ''); $('codeMsg').textContent = t.length ? `${t.length} / 20 文字` : ''; } });

$('bStart').onclick = () => {
  AU.init(); AU.click(); const s = store.get('save', null);
  if (s && s.y > 3) { $('askTtl').textContent = 'はじめから'; $('askTx').textContent = `いまの続き（${Math.round(s.y)} m・最高 ${s.best} m）は消えて、港からになります。続きをとっておきたいときは、先に「つづきから」でメニューを開き、コードを出しておいてください。`; showOnly('ask'); }
  else startAt(null);
};
$('askYes').onclick = () => { AU.click(); store.del('save'); startAt(null); };
$('askNo').onclick = () => { AU.click(); showOnly('title'); };
$('bCont').onclick = () => { AU.init(); AU.click(); const s = store.get('save', null); if (s) startAt(s); };
$('bCodeIn').onclick = () => { AU.init(); AU.click(); openCode('in', 'title'); };
$('bHelp').onclick = () => { AU.click(); showOnly('helpBox'); helpFrom = 'title'; };
$('bSet').onclick = () => { AU.click(); openSet('title'); };
$('bPause').onclick = () => { AU.init(); AU.click(); togglePause(true); };
$('pBack').onclick = () => { AU.click(); togglePause(false); };
$('pCode').onclick = () => { AU.click(); openCode('out', 'pause'); };
$('pCodeIn').onclick = () => { AU.click(); openCode('in', 'pause'); };
$('pSet').onclick = () => { AU.click(); openSet('pause'); };
$('pHelp').onclick = () => { AU.click(); showOnly('helpBox'); helpFrom = 'pause'; };
$('pTitle').onclick = () => { AU.click(); toTitle(); };
let helpFrom = 'title', setFrom = 'title';
$('helpDone').onclick = () => { AU.click(); showOnly(helpFrom === 'pause' ? 'pause' : 'title'); };
$('clStay').onclick = () => { AU.click(); G.state = 'play'; showOnly(null); if (!IN.touchOn) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* */ } } };
$('clTitle').onclick = () => { AU.click(); store.del('save'); G.cleared = false; toTitle(); };

// ---------- 設定 ----------
function openSet(from) {
  setFrom = from; showOnly('setBox');
  $('sSens').value = SET.sens; $('sSensV').textContent = SET.sens.toFixed(2); $('sCamD').value = SET.camD; $('sCamDV').textContent = SET.camD.toFixed(1) + 'm';
  for (const b of $('sInv').children) b.classList.toggle('on', (b.dataset.v === '1') === !!SET.invY);
  for (const b of $('sQual').children) b.classList.toggle('on', b.dataset.v === SET.quality);
}
$('sSens').oninput = () => { SET.sens = +$('sSens').value; $('sSensV').textContent = SET.sens.toFixed(2); saveSet(); };
$('sCamD').oninput = () => { SET.camD = +$('sCamD').value; $('sCamDV').textContent = SET.camD.toFixed(1) + 'm'; saveSet(); };
for (const b of $('sInv').children) b.onclick = () => { SET.invY = b.dataset.v === '1'; saveSet(); openSet(setFrom); AU.click(); };
for (const b of $('sQual').children) b.onclick = () => { SET.quality = b.dataset.v; saveSet(); applyQuality(); openSet(setFrom); AU.click(); };
$('setDone').onclick = () => { AU.click(); showOnly(setFrom === 'pause' ? 'pause' : 'title'); };
function applyQuality() {
  const q = SET.quality, dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(q === 'low' ? Math.min(1, dpr) * .75 : q === 'high' ? dpr : Math.min(1.5, dpr));
  const sh = q !== 'low'; renderer.shadowMap.enabled = sh; sun.castShadow = sh;
  const sz = q === 'high' ? 2048 : 1024; if (sun.shadow.mapSize.x !== sz) { sun.shadow.mapSize.set(sz, sz); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  scene.fog.far = q === 'low' ? 420 : 640; camera.far = q === 'low' ? 1600 : 2600; camera.updateProjectionMatrix();
  scene.traverse(o => { if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true; });
}

// ---------- 画面の大きさ・横画面 ----------
function onResize() {
  const w = VW(), h = VH(), r = $('rot');
  r.style.width = w + 'px'; r.style.height = h + 'px'; r.style.transform = ROT.on ? 'rotate(90deg) translateY(-100%)' : 'none';
  document.body.classList.toggle('short', h < 500);
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', onResize);
function applyHome(S) {
  if (!S || typeof S !== 'object') return;
  if (typeof S.land === 'boolean' && S.land !== ROT.on) { ROT.on = S.land; onResize(); }
  if (typeof S.sound === 'boolean') HUB.sound = S.sound;
  if (typeof S.vol === 'number') HUB.vol = clamp(S.vol, 0, 1);
  if (typeof S.sens === 'number') HUB.sens = S.sens;
  AU.applyVol();
}
