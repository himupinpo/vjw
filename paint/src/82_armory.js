
// ================= ブキ選び（武器庫）：種類のタブ・カードの一覧・3Dの試着・性能 =================
// ブキの写真（3Dの形を小さな画像にする。チームの色ごとに作って取っておく）
const THUMB = { rt: null, scene: null, cam: null, cache: new Map(), cv: null };
function weaponThumb(w) {
  const key = w.id + G.pal[0];
  if (THUMB.cache.has(key)) return THUMB.cache.get(key);
  const W = 192, H = 128;
  if (!THUMB.rt) {
    THUMB.rt = new T.WebGLRenderTarget(W, H); THUMB.rt.texture.colorSpace = T.SRGBColorSpace;
    THUMB.scene = new T.Scene();
    THUMB.scene.add(new T.HemisphereLight(0xffffff, 0x6a6070, 1.6));
    const dl = new T.DirectionalLight(0xffffff, 2.2); dl.position.set(2, 3, 4); THUMB.scene.add(dl);
    THUMB.cam = new T.PerspectiveCamera(28, W / H, .05, 50);
    THUMB.cv = document.createElement('canvas'); THUMB.cv.width = W; THUMB.cv.height = H;
  }
  const wrap = new T.Group(), m = weaponMesh(w, 1); wrap.add(m);
  wrap.rotation.set(.22, Math.PI / 2 - .5, 0); THUMB.scene.add(wrap); wrap.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(wrap), c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
  wrap.position.sub(c);
  const fit = Math.max(sz.x / THUMB.cam.aspect, sz.y) / (2 * Math.tan(THUMB.cam.fov * Math.PI / 360)) * 1.18;
  THUMB.cam.position.set(0, 0, fit + sz.z / 2); THUMB.cam.lookAt(0, 0, 0);
  const prevT = renderer.getRenderTarget(), prevC = renderer.getClearColor(new T.Color()), prevA = renderer.getClearAlpha();
  renderer.setRenderTarget(THUMB.rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(THUMB.scene, THUMB.cam);
  const px = new Uint8Array(W * H * 4); renderer.readRenderTargetPixels(THUMB.rt, 0, 0, W, H, px);
  renderer.setRenderTarget(prevT); renderer.setClearColor(prevC, prevA);
  THUMB.scene.remove(wrap); wrap.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  const g = THUMB.cv.getContext('2d'), img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);   // 上下をもどす
  g.putImageData(img, 0, 0);
  const url = THUMB.cv.toDataURL('image/png'); THUMB.cache.set(key, url); return url;
}

// サブとスペシャルの小さな絵
function subIcon(id) {
  const p = {
    bomb: '<circle cx="12" cy="14" r="7"/><rect x="11" y="3" width="3" height="5" rx="1"/>',
    sticky: '<path d="M5 15a7 7 0 0 1 14 0v2H5z"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/>',
    slide: '<ellipse cx="11" cy="15" rx="8" ry="4"/><path d="M19 15h4" stroke="currentColor" stroke-width="2"/>',
    balloon: '<ellipse cx="12" cy="10" rx="6" ry="7"/><path d="M12 17l-1 4h2z"/>',
    popper: '<circle cx="7" cy="16" r="4"/><circle cx="16" cy="9" r="3.5"/><circle cx="17" cy="18" r="3"/>',
    boomer: '<path d="M4 18 Q12 2 20 18 L16 18 Q12 9 8 18z"/>',
    windup: '<circle cx="12" cy="15" r="6"/><rect x="11" y="4" width="2" height="6"/><rect x="7" y="3" width="10" height="3" rx="1.5"/>',
    fountain: '<rect x="8" y="16" width="8" height="5" rx="1"/><path d="M12 15 Q6 6 3 12 M12 15 Q18 6 21 12" fill="none" stroke="currentColor" stroke-width="2"/>',
    shield: '<path d="M5 4h14v8a7 7 0 0 1-14 0z"/>',
    mine: '<ellipse cx="12" cy="16" rx="8" ry="3"/><rect x="10" y="10" width="4" height="4" rx="1"/>',
    spring: '<path d="M6 18h12M7 15h10M6 12h12M7 9h10" stroke="currentColor" stroke-width="2.2"/><rect x="4" y="19" width="16" height="2.5" rx="1"/>',
    dart: '<path d="M3 21 L15 9 L13 7 L21 3 L17 11 L15 9z"/>',
    fog: '<circle cx="8" cy="14" r="5"/><circle cx="15" cy="12" r="6"/><circle cx="18" cy="17" r="4"/>'
  }[id] || '<circle cx="12" cy="12" r="7"/>';
  return `<svg viewBox="0 0 24 24" fill="currentColor">${p}</svg>`;
}
function spIcon(id) {
  const p = {
    beam: '<rect x="3" y="9" width="7" height="6" rx="2"/><path d="M10 10h11v4H10z"/>',
    rain: '<ellipse cx="12" cy="8" rx="8" ry="4"/><path d="M7 14v5M12 14v6M17 14v5" stroke="currentColor" stroke-width="2"/>',
    slam: '<path d="M8 3h8v6h3l-7 7-7-7h3z"/><rect x="3" y="19" width="18" height="2.5"/>',
    barrier: '<path d="M3 19a9 9 0 0 1 18 0z" fill-opacity=".9"/>',
    missile: '<path d="M12 2l3 6v9h-6V8z"/><path d="M9 14l-3 4h3zM15 14l3 4h-3z"/>',
    armor: '<path d="M12 2l8 3v6c0 6-4 9-8 11-4-2-8-5-8-11V5z"/>',
    tornado: '<path d="M3 5h18M5 9h14M7 13h10M9 17h6M11 21h2" stroke="currentColor" stroke-width="2.4"/>',
    airdrop: '<circle cx="12" cy="9" r="6"/><path d="M5 20h14" stroke="currentColor" stroke-width="2"/><path d="M12 15v4" stroke="currentColor" stroke-width="2"/>',
    tower: '<rect x="9" y="8" width="6" height="14" rx="1"/><circle cx="12" cy="6" r="4"/>',
    dash: '<path d="M4 16h11l5-4-5-4H8z"/><path d="M2 10h4M2 13h3" stroke="currentColor" stroke-width="2"/>',
    ring: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="12" cy="12" r="2.5"/>',
    turret: '<rect x="5" y="15" width="14" height="6" rx="2"/><circle cx="12" cy="12" r="4"/><rect x="14" y="10" width="8" height="3"/>',
    fireworks: '<circle cx="12" cy="12" r="2.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19" stroke="currentColor" stroke-width="2"/>',
    cloak: '<path d="M6 4h12l2 17H4z" fill-opacity=".55"/><circle cx="12" cy="9" r="3"/>'
  }[id] || '<circle cx="12" cy="12" r="7"/>';
  return `<svg viewBox="0 0 24 24" fill="currentColor">${p}</svg>`;
}

// ---------- 試着：自分のペンキっ子にブキを持たせて、くるくる回して見せる ----------
const ARMP = { scene: null, cam: null, a: null, key: '', ped: null, rot: 0, drag: null, act: null, actT: 1.2 };
function armPrevBuild() {
  if (!ARMP.scene) {
    ARMP.scene = new T.Scene();
    ARMP.scene.add(new T.HemisphereLight(0xeaf2ff, 0x5a4a6a, 1.5));
    const dl = new T.DirectionalLight(0xffffff, 2.4); dl.position.set(3, 5, 4); ARMP.scene.add(dl);
    ARMP.cam = new T.PerspectiveCamera(30, 1, .1, 50);
    const ped = new T.Group();
    const base = new T.Mesh(new T.CylinderGeometry(.95, 1.05, .22, 40), new T.MeshStandardMaterial({ color: 0x2a2733, roughness: .5 })); base.position.y = -.11; ped.add(base);
    const top = new T.Mesh(new T.CircleGeometry(.94, 40), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .3 })); top.rotation.x = -Math.PI / 2; top.position.y = .002; ped.add(top);
    ped.userData.top = top; ARMP.ped = ped; ARMP.scene.add(ped);
    const el = $('armPrev');
    el.addEventListener('pointerdown', e => { ARMP.drag = { x: toStage(e.clientX, e.clientY).x, r: ARMP.rot }; try { el.setPointerCapture(e.pointerId); } catch (er) { /* */ } });
    el.addEventListener('pointermove', e => { if (ARMP.drag) ARMP.rot = ARMP.drag.r + (toStage(e.clientX, e.clientY).x - ARMP.drag.x) * .012; });
    const end = () => { ARMP.drag = null; }; el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
  const key = [SET.weapon, SET.acc, SET.accCol, G.pal[0], G.pal[1]].join('|');
  if (ARMP.a && ARMP.key === key) return;
  if (ARMP.a) { scene.remove(ARMP.a.model.root); ARMP.scene.remove(ARMP.a.model.root); ARMP.a.model.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  const a = { name: '', team: 1, w: WBY[SET.weapon] || WBY.basic, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, aimYaw: 0, aimPitch: 0, hp: HP_MAX, ink: INK_MAX, ws: {},
    dive: false, swim: false, onGround: true, dead: false, inv: 0, moveSpd: 0, bob: 0, armor: 0, dashT: 0, cloakT: 0, markT: 0, revealed: false, climb: null, sj: null, acc: SET.acc || 'none', accCol: SET.accCol ?? 0xffffff };
  buildModel(a); scene.remove(a.model.root); ARMP.scene.add(a.model.root);
  ARMP.ped.userData.top.material.color.set(G.pal[0]);
  ARMP.a = a; ARMP.key = key; ARMP.act = { kind: 'show', t: 0 }; ARMP.actT = 1.2;
}
// 画面の上の、試着の枠の位置（横画面に回していても、キャンバスの中の座標で）
function elRect(el) {
  const e = el.getBoundingClientRect(), r = $('rot').getBoundingClientRect();
  if (!ROT.on) return { x: e.left - r.left, y: e.top - r.top, w: e.width, h: e.height };
  return { x: e.top - r.top, y: r.right - e.right, w: e.height, h: e.width };
}
// 武器庫を開いている間は、ステージの代わりに暗い背景をかいて、試着の枠にだけキャラをかく
const armOpen = () => !$('armory').classList.contains('hidden');
function renderFrame(dt) {
  if (armOpen()) { renderer.setClearColor(0x16121f, 1); renderer.clear(); armPrevRender(dt); }
  else renderer.render(scene, camera);
}
function armPrevRender(dt) {
  if (!armOpen()) return;
  armPrevBuild();
  const el = $('armPrev'), r = elRect(el), H0 = VH();
  if (r.w < 20 || r.h < 20) return;
  const a = ARMP.a, c = a.w.cls;
  // ときどきブキを使って見せる
  ARMP.actT -= dt;
  if (ARMP.actT <= 0 && !ARMP.act) { ARMP.act = { kind: 'show', t: 0 }; ARMP.actT = 2.6; }
  if (ARMP.act) {
    const ac = ARMP.act; ac.t += dt;
    const step = c === 'roller' || c === 'brush' || c === 'bucket' || c === 'blade' ? .5 : c === 'sniper' || c === 'bow' || c === 'cannon' ? .7 : .16;
    if (ac.t > step * (ac.n || 0) && ac.t < 1.3) {
      ac.n = (ac.n || 0) + 1;
      if (c === 'roller' || c === 'brush') a.ws.swing = { t: 0, dur: c === 'brush' ? .2 : .36, kind: 'down' };
      else if (c === 'bucket') a.ws.swing = { t: 0, dur: .32, kind: 'up' };
      else if (c === 'blade') a.ws.swing = { t: 0, dur: .2, kind: 'side' };
      else a.kick = Math.min(1, (a.kick || 0) + (c === 'cannon' || c === 'sniper' ? .9 : .3));
      if (c === 'gatling') a.ws.spin = 1;
      if (c === 'parasol') a.ws.open = true;
    }
    if (ac.t > 1.6) { ARMP.act = null; a.ws.spin = 0; a.ws.open = false; }
  }
  if (!ARMP.drag) ARMP.rot += dt * .45;
  a.yaw = ARMP.rot; a.aimYaw = a.yaw; a.aimPitch = Math.sin(clock * .8) * .06; a.onGround = true;
  syncModel(a, dt, null); a.model.root.visible = true;
  ARMP.cam.aspect = r.w / r.h; ARMP.cam.updateProjectionMatrix();
  const wide = c === 'roller' || c === 'brush' || c === 'sniper' || c === 'parasol';
  ARMP.cam.position.set(0, 1.25, wide ? 4.6 : 4.0); ARMP.cam.lookAt(0, .78, 0);
  const prevC = renderer.getClearColor(new T.Color()), prevA = renderer.getClearAlpha();
  renderer.setScissorTest(true); renderer.setScissor(r.x, H0 - r.y - r.h, r.w, r.h); renderer.setViewport(r.x, H0 - r.y - r.h, r.w, r.h);
  renderer.setClearColor(0x232033, 1); renderer.clear(true, true, false);
  renderer.render(ARMP.scene, ARMP.cam);
  renderer.setScissorTest(false); renderer.setViewport(0, 0, VW(), H0); renderer.setClearColor(prevC, prevA);
}

// ---------- 一覧と性能 ----------
let armCls = null, armFrom = 'title';
function openArmory(from) {
  armFrom = from; armCls = WBY[SET.weapon].cls;
  hideScreens(); $('armory').classList.remove('hidden'); drawArmory();
}
function equipWeapon(id) {
  if (SET.weapon === id) return;
  SET.weapon = id; saveSet();
  if (armFrom === 'pause' && G.me) setPlayerWeapon(WBY[id]);
  ARMP.act = { kind: 'show', t: 0 };
}
function drawArmory() {
  const sel = WBY[SET.weapon], col = G.pal[0];
  $('armCount').textContent = `全${WEAPONS.length}種`;
  $('clsTabs').innerHTML = CLASS_ORDER.map(c => `<button data-c="${c}" class="${c === armCls ? 'on' : ''}${sel.cls === c ? ' has' : ''}">${classIcon(c, c === armCls ? '#15121d' : '#fff')}<span>${CLASSES[c].name}</span></button>`).join('');
  $('wgrid').innerHTML = WEAPONS.filter(w => w.cls === armCls).map(w => {
    const inf = wInfo(w), on = w.id === sel.id;
    return `<button class="wc${on ? ' on' : ''}" data-w="${w.id}" style="--wc:#${w.look[1].toString(16).padStart(6, '0')}">
      <img alt="" src="${weaponThumb(w)}"><b>${w.name}</b><span class="rl">${inf.role}</span>
      <span class="ic"><i title="${SUBS[w.sub].name}">${subIcon(w.sub)}</i><i class="sp" title="${SPECIALS[w.sp].name}">${spIcon(w.sp)}</i></span>${on ? '<em>装備中</em>' : ''}</button>`;
  }).join('');
  const w = sel, st = wStats(w), inf = wInfo(w);
  const bar = (n, v) => `<div class="sb"><span>${n}</span><i><u style="width:${Math.round(v * 100)}%"></u></i></div>`;
  $('wdetail').innerHTML = `<div class="wn"><b>${w.name}</b><span>${CLASSES[w.cls].name}</span><span class="rlb">${inf.role}</span></div>
    <p class="wd">${w.desc}</p>
    <div class="stats">${bar('射程', st.range)}${bar('攻撃', st.atk)}${bar('ぬり', st.paint)}${bar('動き', st.move)}</div>
    <p class="stk">たおすのに：<b>${inf.stk}</b></p>
    <div class="ss"><i>${subIcon(w.sub)}</i><div><b>${SUBS[w.sub].name}</b><small>サブ・ペンキ${SUBS[w.sub].ink}%　${SUBS[w.sub].desc}</small></div></div>
    <div class="ss sp"><i>${spIcon(w.sp)}</i><div><b>${SPECIALS[w.sp].name}</b><small>スペシャル　${SPECIALS[w.sp].desc}</small></div></div>`;
  $('armory').style.setProperty('--tc', col);
  $('clsTabs').querySelectorAll('button').forEach(b => b.onclick = () => { AU.ui(); armCls = b.dataset.c; drawArmory(); $('wgrid').scrollTop = 0; });
  $('wgrid').querySelectorAll('button').forEach(b => b.onclick = () => { AU.ui(); equipWeapon(b.dataset.w); drawArmory(); });
  const selEl = $('wgrid').querySelector('.wc.on'); if (selEl && selEl.scrollIntoView) selEl.scrollIntoView({ block: 'nearest' });
}
function closeArmory() {
  if (armFrom === 'pause' && G.me) { hideScreens(); togglePause(false); }
  else toTitle();
}
$('wOk').onclick = () => { AU.ui(); closeArmory(); };
