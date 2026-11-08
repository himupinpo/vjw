
// ================= 画面（タイトル・ブキ選び・設定・一時停止） =================
const SCREENS = ['title', 'armory', 'settings', 'pause', 'result'];
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
  $('wcard').innerHTML = `${classIcon(w.cls, G.pal[0])}<div><div class="t">${w.name}</div><div class="s">${CLASSES[w.cls].name}・サブ：${SUBS[w.sub].name}<br>スペシャル：${SPECIALS[w.sp].name}　<u>ブキをかえる（全${WEAPONS.length}種）</u></div></div>`;
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
let armCls = null, armSel = null, armFrom = 'title';
function openArmory(from) {
  armFrom = from; armSel = SET.weapon; armCls = WBY[armSel].cls;
  hideScreens(); $('armory').classList.remove('hidden'); drawArmory();
}
function drawArmory() {
  $('clsTabs').innerHTML = CLASS_ORDER.map(c => `<button data-c="${c}" class="${c === armCls ? 'on' : ''}">${CLASSES[c].name}<small>${WEAPONS.filter(w => w.cls === c).length}</small></button>`).join('');
  $('wgrid').innerHTML = WEAPONS.filter(w => w.cls === armCls).map(w => `<button class="witem ${w.id === armSel ? 'on' : ''}" data-w="${w.id}">${classIcon(w.cls, w.id === armSel ? G.pal[0] : '#fff')}<div><b>${w.name}</b><span>${wInfo(w).role}・${SUBS[w.sub].name}／${SPECIALS[w.sp].name}</span></div></button>`).join('');
  const w = WBY[armSel], st = wStats(w), inf = wInfo(w), bar = (n, v) => `<div>${n}<i><u style="width:${Math.round(v * 100)}%"></u></i></div>`;
  $('wdetail').innerHTML = `<div><b style="font-size:17px">${w.name}</b> <span class="role">${inf.role}</span><p>${CLASSES[w.cls].desc}</p><p>${w.desc}</p><p><b>たおすのに</b>：${inf.stk}</p></div>
    <div><div class="bars">${bar('射程', st.range)}${bar('攻撃', st.atk)}${bar('ぬり', st.paint)}${bar('動き', st.move)}</div>
    <p><b>サブ：${SUBS[w.sub].name}</b> ${SUBS[w.sub].desc}（ペンキ ${SUBS[w.sub].ink}%）</p><p><b>スペシャル：${SPECIALS[w.sp].name}</b> ${SPECIALS[w.sp].desc}</p></div>`;
  $('clsTabs').querySelectorAll('button').forEach(b => b.onclick = () => { AU.ui(); armCls = b.dataset.c; armSel = WEAPONS.find(w => w.cls === armCls).id; drawArmory(); });
  $('wgrid').querySelectorAll('button').forEach(b => b.onclick = () => { AU.ui(); armSel = b.dataset.w; drawArmory(); });
}
$('wOk').onclick = () => {
  AU.ui(); SET.weapon = armSel; saveSet();
  if (armFrom === 'pause' && G.me) { setPlayerWeapon(WBY[armSel]); hideScreens(); togglePause(false); }
  else toTitle();
};
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { AU.ui(); const id = b.dataset.close; $(id).classList.add('hidden'); if (id === 'jumpUI') return; if ((id === 'armory' && armFrom === 'pause') || (id === 'settings' && setFrom === 'pause')) $('pause').classList.remove('hidden'); else if (G.state === 'title') toTitle(); });
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
