
// ================= 画面（タイトル・ブキ選び・設定・一時停止） =================
const SCREENS = ['title', 'armory', 'settings', 'pause', 'result', 'dress', 'btnEdit'];
function hideScreens() { for (const s of SCREENS) $(s).classList.add('hidden'); }
function toTitle() {
  G.state = 'title'; G.paused = false; AU.musicOn(false);
  try { document.exitPointerLock(); } catch (e) { /* */ }
  hideScreens(); $('hud').classList.add('hidden'); $('title').classList.remove('hidden');
  closeJumpUI();
  drawWeaponCard(); drawTitleChips();
  $('recLine').textContent = REC.games ? `これまで ${REC.games} 試合・${REC.wins} 勝・たおした数 ${REC.kills}・いちばんぬった ${REC.best}㎡` : '';
}
function drawWeaponCard() {
  const w = WBY[SET.weapon];
  $('wcard').innerHTML = `<img alt="" src="${weaponThumb(w)}"><div><div class="t">${w.name}<small>${CLASSES[w.cls].name}</small></div><div class="s">サブ：${SUBS[w.sub].name}／SP：${SPECIALS[w.sp].name}<br><u>ブキをかえる（全${WEAPONS.length}種）</u></div></div>`;
}
function drawTitleChips() {
  if (!RULES[SET.rule]) SET.rule = 'turf';
  const ru = $('ruleChips');
  ru.innerHTML = RULE_IDS.map(id => `<button data-r="${id}" class="${SET.rule === id ? 'on' : ''}">${RULES[id].name}</button>`).join('');
  ru.querySelectorAll('button').forEach(b => b.onclick = () => { AU.ui(); SET.rule = b.dataset.r; saveSet(); drawTitleChips(); });
  $('ruleDesc').textContent = '4対4・3分・' + RULES[SET.rule].desc;
  const st = $('stageChips');
  st.innerHTML = [['random', 'ランダム'], ...STAGE_IDS.map(id => [id, STAGES[id].name])].map(([id, n]) => `<button data-s="${id}" class="${SET.stage === id ? 'on' : ''}">${n}</button>`).join('');
  st.querySelectorAll('button').forEach(b => b.onclick = () => { AU.ui(); SET.stage = b.dataset.s; saveSet(); drawTitleChips(); if (SET.stage !== 'random' && SET.stage !== STAGE_ID) { loadStage(SET.stage); } });
}
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { AU.ui(); const id = b.dataset.close; if (id === 'armory') { closeArmory(); return; } $(id).classList.add('hidden'); if (id === 'jumpUI') return; if (id === 'settings' && setFrom === 'pause') $('pause').classList.remove('hidden'); else if (G.state === 'title') toTitle(); });
let setFrom = 'title';
function openSettings(from) {
  setFrom = from; hideScreens(); $('settings').classList.remove('hidden');
  const mark = (id, attr, v) => $(id).querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset[attr] === String(v)));
  mark('diffChips', 'd', SET.diff); mark('invChips', 'i', SET.invY ? 1 : 0); mark('musChips', 'm', SET.music ? 1 : 0); mark('qChips', 'q', SET.quality); mark('asChips', 'a', SET.assist ? 1 : 0);
  $('sens').value = SET.sens; $('sensV').textContent = SET.sens.toFixed(1);
}
$('diffChips').onclick = e => { const b = e.target.closest('button'); if (!b) return; SET.diff = +b.dataset.d; saveSet(); openSettings(setFrom); };
$('invChips').onclick = e => { const b = e.target.closest('button'); if (!b) return; SET.invY = b.dataset.i === '1'; saveSet(); openSettings(setFrom); };
$('musChips').onclick = e => { const b = e.target.closest('button'); if (!b) return; SET.music = b.dataset.m === '1'; saveSet(); AU.applyVol(); openSettings(setFrom); };
$('qChips').onclick = e => { const b = e.target.closest('button'); if (!b) return; SET.quality = b.dataset.q; saveSet(); applyQuality(); openSettings(setFrom); };
$('sens').oninput = () => { SET.sens = +$('sens').value; $('sensV').textContent = SET.sens.toFixed(1); saveSet(); };
$('goBattle').onclick = () => { AU.init(); AU.ui(); startMatch(RULES[SET.rule] ? SET.rule : 'turf'); };
// きせかえ（頭のかざりと色）。右に立っている自分のペンキっ子がすぐ変わる
function openDress() { hideScreens(); $('dress').classList.remove('hidden'); drawDress(); }
function drawDress() {
  const acc = SET.acc || 'none', col = SET.accCol ?? 0xffffff;
  $('accChips').innerHTML = ACC.map(([id, n]) => `<button data-a="${id}" class="${acc === id ? 'on' : ''}">${n}</button>`).join('');
  $('colChips').innerHTML = ACC_COL.map(c => `<button data-c="${c}" class="${col === c ? 'on' : ''}" style="background:#${c.toString(16).padStart(6, '0')}" aria-label="色"></button>`).join('');
}
$('accChips').onclick = e => { const b = e.target.closest('button'); if (!b) return; AU.ui(); SET.acc = b.dataset.a; saveSet(); drawDress(); };
$('colChips').onclick = e => { const b = e.target.closest('button'); if (!b) return; AU.ui(); SET.accCol = +b.dataset.c; saveSet(); drawDress(); };
$('dOk').onclick = () => { AU.ui(); toTitle(); };
$('goDress').onclick = () => { AU.init(); AU.ui(); openDress(); };
$('asChips').onclick = e => { const b = e.target.closest('button'); if (!b) return; SET.assist = b.dataset.a === '1'; saveSet(); openSettings(setFrom); };
$('goPractice').onclick = () => { AU.init(); AU.ui(); startMatch('practice'); };
$('goWeapon').onclick = () => { AU.init(); AU.ui(); openArmory('title'); };
$('goSet').onclick = () => { AU.init(); AU.ui(); openSettings('title'); };
$('sjBtn').onclick = () => { AU.ui(); if ($('jumpUI').classList.contains('hidden')) openJumpUI(); else closeJumpUI(); };
$('mini').addEventListener('pointerdown', e => { if (G.state === 'play' && G.mode !== 'practice') { e.stopPropagation(); openJumpUI(); } });
function togglePause(on) {
  if (G.state !== 'play' && G.state !== 'count') return;
  G.paused = on; IN.mouseFire = IN.mouseDive = IN.tFire = IN.tDive = false;
  if (on) { try { document.exitPointerLock(); } catch (e) { /* */ } hideScreens(); closeJumpUI(); $('pause').classList.remove('hidden'); $('pWeapon').disabled = G.mode !== 'practice'; $('pWeapon').style.opacity = G.mode === 'practice' ? 1 : .4; }
  else $('pause').classList.add('hidden');
}
$('pauseB').onclick = () => { AU.ui(); togglePause(true); };
$('pResume').onclick = () => { AU.ui(); togglePause(false); };
$('pWeapon').onclick = () => { if (G.mode !== 'practice') return; AU.ui(); openArmory('pause'); };
$('pSet').onclick = () => { AU.ui(); openSettings('pause'); };
$('pQuit').onclick = () => { AU.ui(); clearMatch(); toTitle(); };

// ================= スマホのボタンの配置（位置と大きさを変える） =================
const BTN_IDS = ['bFire', 'bDive', 'bJump', 'bSub', 'bSp'];
const BTN_DEF = { bFire: [26, 40, 92], bDive: [132, 20, 70], bJump: [122, 100, 62], bSub: [40, 146, 56], bSp: [104, 170, 56] };   // 右からの距離・下からの距離・大きさ(px)
const BTN_NAME = { bFire: 'うつ', bDive: 'もぐる', bJump: 'ジャンプ', bSub: 'サブ', bSp: 'SP' };
function btnPos(id) {   // ボタンの中心（画面の割合）と大きさ(px)
  const L = SET.btn && SET.btn[id], d = BTN_DEF[id];
  if (L) return { x: L.x, y: L.y, s: d[2] * L.k };
  return { x: 1 - (d[0] + d[2] / 2) / VW(), y: 1 - (d[1] + d[2] / 2) / VH(), s: d[2] };
}
function applyBtnLayout() {
  for (const id of BTN_IDS) {
    const el = $(id); if (!el) continue;
    if (!(SET.btn && SET.btn[id])) { for (const k of ['left', 'top', 'right', 'bottom', 'width', 'height', 'fontSize']) el.style[k] = ''; continue; }
    const p = btnPos(id);
    Object.assign(el.style, { left: (p.x * VW() - p.s / 2) + 'px', top: (p.y * VH() - p.s / 2) + 'px', right: 'auto', bottom: 'auto', width: p.s + 'px', height: p.s + 'px', fontSize: Math.round(12.5 * clamp(p.s / 64, .8, 1.5)) + 'px' });
  }
  const k = SET.stickK || 1, st = $('stick'), kn = st.querySelector('i');
  Object.assign(st.style, { width: 120 * k + 'px', height: 120 * k + 'px', margin: (-60 * k) + 'px 0 0 ' + (-60 * k) + 'px' });
  Object.assign(kn.style, { width: 52 * k + 'px', height: 52 * k + 'px', margin: (-26 * k) + 'px 0 0 ' + (-26 * k) + 'px' });
}
let beSel = 'bFire', beDrag = null, beTmp = null, beFrom = 'title';
function openBtnEdit() {
  beFrom = setFrom; beTmp = { stickK: SET.stickK || 1 };
  for (const id of BTN_IDS) { const p = btnPos(id); beTmp[id] = { x: p.x, y: p.y, k: p.s / BTN_DEF[id][2] }; }
  hideScreens(); $('btnEdit').classList.remove('hidden'); drawBtnEdit();
}
function drawBtnEdit() {
  const area = $('beArea'); area.innerHTML = '';
  const k = beTmp.stickK, st = document.createElement('div'); st.className = 'beStick';
  Object.assign(st.style, { width: 120 * k + 'px', height: 120 * k + 'px', left: (VW() * .18 - 60 * k) + 'px', top: (VH() * .62 - 60 * k) + 'px' }); st.innerHTML = '<i></i><span>移動スティック</span>'; area.append(st);
  for (const id of BTN_IDS) {
    const t = beTmp[id], s = BTN_DEF[id][2] * t.k, el = document.createElement('div');
    el.className = 'tb beb' + (id === beSel ? ' sel' : ''); el.textContent = BTN_NAME[id]; el.dataset.id = id;
    Object.assign(el.style, { left: (t.x * VW() - s / 2) + 'px', top: (t.y * VH() - s / 2) + 'px', width: s + 'px', height: s + 'px', fontSize: Math.round(12.5 * clamp(s / 64, .8, 1.5)) + 'px' });
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); beSel = id; const p = toStage(e.clientX, e.clientY); beDrag = { id, dx: p.x - t.x * VW(), dy: p.y - t.y * VH() };
      try { el.setPointerCapture(e.pointerId); } catch (er) { /* */ }
      $('beSize').value = t.k; area.querySelectorAll('.beb').forEach(b => b.classList.toggle('sel', b.dataset.id === id));
    });
    el.addEventListener('pointermove', e => {
      if (!beDrag || beDrag.id !== id) return;
      const p = toStage(e.clientX, e.clientY); t.x = clamp((p.x - beDrag.dx) / VW(), .03, .97); t.y = clamp((p.y - beDrag.dy) / VH(), .08, .97);
      el.style.left = (t.x * VW() - s / 2) + 'px'; el.style.top = (t.y * VH() - s / 2) + 'px';
    });
    const end = () => { beDrag = null; }; el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    area.append(el);
  }
  $('beSize').value = beTmp[beSel].k; $('beStick').value = k;
}
$('beSize').oninput = () => { beTmp[beSel].k = +$('beSize').value; drawBtnEdit(); };
$('beStick').oninput = () => { beTmp.stickK = +$('beStick').value; drawBtnEdit(); };
$('beReset').onclick = () => { AU.ui(); SET.btn = null; SET.stickK = 1; saveSet(); applyBtnLayout(); openBtnEdit(); };
$('beDone').onclick = () => {
  AU.ui(); SET.btn = {}; for (const id of BTN_IDS) SET.btn[id] = beTmp[id]; SET.stickK = beTmp.stickK; saveSet(); applyBtnLayout();
  $('btnEdit').classList.add('hidden'); openSettings(beFrom);
};
$('btnLayout').onclick = () => { AU.init(); AU.ui(); openBtnEdit(); };
