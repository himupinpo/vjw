// =========================================================================================
//  起動・画面の大きさ・ドラッグ操作・毎フレームの流れ
// =========================================================================================
function applyQuality() {
  const q = SET.quality, dpr = window.devicePixelRatio || 1;
  renderer.setPixelRatio(Math.min(dpr, q === 'high' ? 2 : q === 'low' ? 1 : 1.5));
  renderer.shadowMap.enabled = q !== 'low';
  OFFICE.scene.traverse(o => { if (o.isMesh && o.material) o.material.needsUpdate = true; });
  onResize();
}
function onResize() {
  const r = $('rot'), W = VW(), H = VH();
  r.style.width = W + 'px'; r.style.height = H + 'px'; r.style.transform = ROT.on ? 'rotate(90deg) translateY(-100%)' : 'none';
  document.body.classList.toggle('wide', W >= 760 && W > H * 1.1);
  document.body.classList.toggle('narrow', W < 560);
  renderer.setSize(W, H, false);
  document.documentElement.style.setProperty('--topH', $('top').offsetHeight + 'px');
}
addEventListener('resize', onResize);
// 要素の位置（回転した舞台の中の座標）
function stageRect(el) { let x = 0, y = 0, e = el; while (e && e !== $('rot')) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; }

// ---------- ドラッグで回す・2本指とホイールで拡大（事務所と開発の見本） ----------
function dragControl(el, get) {
  const pts = new Map(); let pinch = 0, down = null;
  el.addEventListener('pointerdown', e => { if (e.target !== el) return; const sp = toStage(e.clientX, e.clientY); pts.set(e.pointerId, sp); down = pts.size === 1 ? { x: sp.x, y: sp.y, t: performance.now(), id: e.pointerId, moved: false } : null; try { el.setPointerCapture(e.pointerId); } catch (er) { /* なし */ } const c = get(); if (c.onStart) c.onStart(); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } });
  el.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) { const c = get(); if (c.onHover && e.pointerType === 'mouse') c.onHover(toStage(e.clientX, e.clientY)); return; }
    const p = toStage(e.clientX, e.clientY), o = pts.get(e.pointerId), c = get();
    if (down && down.id === e.pointerId && Math.hypot(p.x - down.x, p.y - down.y) > 7) down.moved = true;
    if (pts.size === 1) { c.yaw -= (p.x - o.x) * 0.008; c.pitch = clamp(c.pitch + (p.y - o.y) * 0.006, c.pMin, c.pMax); }
    pts.set(e.pointerId, p);
    if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) c.zoom = clamp(c.zoom * d / pinch, c.zMin, c.zMax); pinch = d; }
  });
  const end = e => {
    const c = get();
    if (e.type === 'pointerup' && down && down.id === e.pointerId && !down.moved && pts.size === 1 && performance.now() - down.t < 600 && c.onTap) c.onTap(toStage(e.clientX, e.clientY), e.pointerType === 'mouse');
    pts.delete(e.pointerId); pinch = 0; if (!pts.size) { down = null; if (c.onEnd) c.onEnd(); }
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', e => { e.preventDefault(); const c = get(); c.zoom = clamp(c.zoom * Math.exp(-e.deltaY * 0.0015), c.zMin, c.zMax); }, { passive: false });
}
const OFFICE_CTL = { get yaw() { return OFFICE.yaw; }, set yaw(v) { OFFICE.yaw = clamp(v, -1.2, 1.3); }, get pitch() { return OFFICE.pitch; }, set pitch(v) { OFFICE.pitch = v; }, get zoom() { return OFFICE.zoom; }, set zoom(v) { OFFICE.zoom = v; }, pMin: 0.3, pMax: 1.25, zMin: 0.7, zMax: 2.4, onTap(p, mouse) { if (FURNI.on) FURNI.tap(p, mouse); }, onHover(p) { if (FURNI.on) FURNI.hover(p); } };
const STUDIO_CTL = { get yaw() { return STUDIO.yaw; }, set yaw(v) { STUDIO.yaw = v; }, get pitch() { return STUDIO.pitch; }, set pitch(v) { STUDIO.pitch = v; }, get zoom() { return STUDIO.zoom; }, set zoom(v) { STUDIO.zoom = v; }, pMin: 0.05, pMax: 1.35, zMin: 0.6, zMax: 3.2, onStart() { STUDIO.spin = false; STUDIO.drag = true; }, onEnd() { STUDIO.drag = null; } };

// ---------- タイトル・新しい会社・つづき ----------
const GAMEFLOW = {
  state: 'load',
  title() {
    this.state = 'title'; $('load').classList.remove('on'); $('title').classList.add('on'); document.body.classList.add('intitle');
    const sv = loadSave(); $('tCont').classList.toggle('hidden', !sv);
    $('tNote').textContent = sv ? `${sv.company}・${dateStr(sv.day)}・お金 ${yen(sv.money)}` : '';
    $('tNew').textContent = sv ? '新しい会社をつくる' : 'はじめる';
    OFFICE.sync(sv || demoState());
  },
  begin(s, fresh) {
    S = s; this.state = 'play'; $('title').classList.remove('on'); document.body.classList.remove('intitle');
    if (fresh) {
      for (const r of S.rivals) for (const k of KIND_IDS) r.P[k] = expected(k, 0) * rr(0.97, 1.08);
      rerollCands(false);
      news(`${S.company}を立ち上げた！ 小さな作業部屋からのスタート`);
      UI.showModal(`<h2>ようこそ、社長！</h2><p class="muted" style="line-height:1.75">${esc(S.company)}は、自宅の作業部屋から始まる小さな文房具メーカー。手元のお金は <b>${yen(S.money)}</b>。<br>
        ① 下の「開発」で、えんぴつか消しゴムを作ってみよう。性能と見た目（色・模様・ロゴ）を自由に決められます。<br>
        ② 開発が終わったら値段を決めて発売。レビューがよいほど、よく売れます。<br>
        ③ 「研究」でシャーペン・ボールペン・万年筆も作れるようになります。<br>
        ④ 4月は新学期で学生向けがよく売れる季節。さっそく始めよう！</p><button class="btn big" data-act="closeM" type="button">はじめる</button>`);
    }
    OFFICE.key = ''; OFFICE.sync(S); UI.dirty(); onResize(); save();
  },
  newGame() {
    AU.resume();
    UI.showModal(`<h2>新しい会社</h2><div class="grp">会社の名前</div><input class="txt" id="newCo" maxlength="16" value="ぶんぐ工房"><p class="muted">あとから「会社」で変えられます。${loadSave() ? '<br><b style="color:var(--red)">いまのセーブは消えます。</b>' : ''}</p><div class="row" style="gap:8px"><button class="btn sub" data-act="closeM" type="button">もどる</button><button class="btn green" style="flex:1" data-act="startNew" type="button">この名前で始める</button></div>`);
  },
};
function demoState() {
  const s = newState('文房具カンパニー'); s.tier = 1; s.equip = { chair: 1, monitor: 1, lab: 1, line: 2 };
  s.staff = [['res', '#2b2118'], ['qa', '#5a3a22'], ['des', '#1c1a18'], ['sal', '#7a5a3a'], ['res', '#3a2a20']].map(([role, hair], i) => ({ id: 900 + i, role, hair, lv: 2, sal: 0, name: '' }));
  s.products = [
    { id: 991, kind: 'pencil', spec: { grade: 'HB', core: 'c1', wood: 'w1', shape: 'hex', erase: 'yes' }, look: { ...DEF_LOOK.pencil } },
    { id: 992, kind: 'ball', spec: { ink: 'gel', tip: 't05', colors: 'c1', act: 'knock', grip: 'rubber', body: 'plastic' }, look: { ...DEF_LOOK.ball, body: '#f7b6c8', grip: '#e86fa8', clip: '#e86fa8' } },
    { id: 993, kind: 'eraser', spec: { mat: 'm2', size: 'md', shape: 'box', sleeve: 'k0', scent: 'none' }, look: { ...DEF_LOOK.eraser } },
    { id: 994, kind: 'fountain', spec: { nib: 'k14', width: 'F', fill: 'conv', body: 'resin', cap: 'screw' }, look: { ...DEF_LOOK.fountain, body: '#24438f', cap: '#24438f', pattern: 'marble', pat: '#b9dcf2' } },
    { id: 995, kind: 'mech', spec: { size: 's05', mech: 'k0', grip: 'rubber', body: 'plastic', tip: 't0', erase: 'e0' }, look: { ...DEF_LOOK.mech } },
  ].map(p => Object.assign(p, { active: true, name: '' }));
  const Lo = OFFICE.layout(s);
  for (const [type, rot, x, z] of [['whiteboard', 0, 0.5, -3.6], ['coffee', 0, 3.2, -3.7], ['sofa', 3, 4.8, -2.2], ['plant', 0, -0.6, -3.7], ['bigplant', 0, 4.9, 0.4], ['bookshelf', 0, -2.2, -3.6], ['aquarium', 0, -3.3, 0.6], ['lamp', 0, 2.4, 0.9]]) { const f = FURNI.findSpot(s, Lo, type, rot, { x, z }, s.furn); if (f) s.furn.push(f); }
  return s;
}

// ---------- 毎フレーム ----------
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (GAMEFLOW.state === 'play' && S && !S.over) {
    if (!UI.paused()) { acc += dt * S.speed; let n = 0; while (acc >= DAY_SEC && n < 16) { dayTick(); acc -= DAY_SEC; n++; if (S.over) break; } if (n >= 16) acc = 0; }
    OFFICE.sync(S);
  } else if (GAMEFLOW.state === 'title') OFFICE.yaw = 0.62 + Math.sin(now / 5000) * 0.35;
  const st = UI.studio;
  if (st && st.rebuild) { st.rbT = (st.rbT || 0) + dt; if (st.rbT > 0.06) { st.rbT = 0; st.rebuild = false; STUDIO.set(st.d); } }
  STUDIO.update(dt); OFFICE.update(dt, GAMEFLOW.state === 'play' ? S : null); EVENT.update(dt); UI.update(dt); AU.music(dt);
  render();
}
function render() {
  const W = VW(), H = VH();
  if (EVENT.active && EVENT.scene) {
    renderer.setViewport(0, 0, W, H); EVENT.cam.aspect = W / H; EVENT.cam.fov = W < H ? 58 : 40; EVENT.cam.updateProjectionMatrix(); renderer.render(EVENT.scene, EVENT.cam);
  } else if (UI.studio && STUDIO.obj) {
    const r = stageRect($('pv'));
    renderer.setScissorTest(true); renderer.setViewport(r.x, H - r.y - r.h, r.w, r.h); renderer.setScissor(r.x, H - r.y - r.h, r.w, r.h);
    STUDIO.cam.aspect = r.w / Math.max(1, r.h); STUDIO.cam.updateProjectionMatrix(); renderer.render(STUDIO.scene, STUDIO.cam);
    renderer.setScissorTest(false);
  } else {
    renderer.setViewport(0, 0, W, H);
    OFFICE.cam.aspect = W / H; OFFICE.cam.fov = W < H ? 52 : 38;
    const fb = FURNI.on ? $('furnBar').offsetHeight : 0;   // 模様がえのときは、下のバーの上に部屋が見えるようにずらす
    if (fb) OFFICE.cam.setViewOffset(W, H, 0, fb * 0.5, W, H); else if (OFFICE.cam.view && OFFICE.cam.view.enabled) OFFICE.cam.clearViewOffset();
    OFFICE.cam.updateProjectionMatrix(); renderer.render(OFFICE.scene, OFFICE.cam);
  }
}

async function boot() {
  if (HUB.embedded) {
    try { applyHome(JSON.parse(localStorage.getItem('3dame-settings'))); } catch (e) { /* ホームの設定なし */ }
    addEventListener('message', e => { if (e.data && e.data.h3dSet) applyHome(e.data.h3dSet); });
  }
  onResize(); applyQuality();
  $('loadmsg').textContent = '文字を準備しています…';
  try { await Promise.race([Promise.all(['700 20px "Zen Maru Gothic"', '900 20px "Zen Maru Gothic"', '700 20px "Shippori Mincho"'].map(f => document.fonts.load(f, 'ぶんぐ文房具ABC0123'))), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* 文字が読めなくてもつづける */ }
  $('loadmsg').textContent = '事務所を準備しています…'; await nextFrame();
  STUDIO.init(); OFFICE.init(); UI.init();
  dragControl($('c'), () => OFFICE_CTL); dragControl($('pv'), () => STUDIO_CTL);
  $('furnBar').addEventListener('click', e => FURNI.onBar(e)); $('evOv').addEventListener('click', () => EVENT.skip());
  $('tCont').onclick = () => { AU.resume(); AU.click(); const s = loadSave(); if (s) GAMEFLOW.begin(s, false); };
  $('tNew').onclick = () => { AU.click(); GAMEFLOW.newGame(); };
  addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  GAMEFLOW.title();
  requestAnimationFrame(frame);
}
window.__BG = { get S() { return S; }, set S(v) { S = v; }, step(days) { for (let i = 0; i < days && !S.over; i++) dayTick(); }, THREE, renderer, UI, OFFICE, STUDIO, GAMEFLOW, AU,
  startDev, launch, startResearch, hire, fire, polishRP, polishBonus, mechStats, mechBuild, MECH_PRESETS, DEF_BUILD, buyEquip, moveOffice, expand, buyout, rerollCands, devPlan, costOf, expected, perfP, recPrice, currentScore, designScore, kindDemand, productThumb, buildProduct, save, loadSave, newState,
  KINDS, SPECS, LOOKS, DEF_LOOK, RESEARCH, GOALS, OFFICES, EQUIP, FURN, FURNI, EVENT, TRAITS, makeIssues, devFound, staffMul, workMul, resRate, qaRate, devSpeed, gainXp, makeCand };
boot();
</script>
</body></html>
