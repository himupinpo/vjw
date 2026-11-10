// ================= ゲームの進み（タイトル・あそぶ・メニュー・クリア） =================
const G = { state: 'boot', t: 0, acc: 0, zoneSeen: -1, saveT: 0, toastT: 0, bannerT: 0, cleared: false, titleT: 0, mvT: 0 };
const STEP = 1 / 120;
function update(dt) {
  G.t += dt;
  if (G.state === 'play') {
    const [ax, ay] = moveAxes(), fx = Math.sin(CAM.yaw), fz = Math.cos(CAM.yaw);
    const inp = { dx: fx * ay - fz * ax, dz: fz * ay + fx * ax, sprint: sprinting(), jumpE: takeEdge('jumpE') };
    G.acc += Math.min(dt, .1);
    let n = 0;
    while (G.acc >= STEP && n < 12) { G.acc -= STEP; n++; G.mvT += STEP; for (const m of MOVERS) moverTick(m, G.mvT); pstep(STEP, inp); inp.jumpE = false; }
    P.time += dt;
    afterStep(dt);
  } else {
    G.mvT += dt; for (const m of MOVERS) moverTick(m, G.mvT); IN.jumpE = false;
  }
}
// 1コマのあとで：最高の高さ・ゾーン・落ちた・てっぺん・自動セーブ
function afterStep(dt) {
  if (P.onGround && P.pos.y > P.best) P.best = P.pos.y;
  const zi = zoneAt(P.pos.y).i;
  if (P.onGround && zi > G.zoneSeen) { G.zoneSeen = zi; if (zi > 0 || P.time > 2) banner(ZONES[zi].name, `${ZONES[zi].y0} m　${ZONES[zi].sub}`); AU.chime(); }
  if (EV.landed) {
    EV.landed = 0;
    if (EV.drop > 12) { toast(`${Math.round(EV.drop)} m 落ちた…`); if (EV.drop > 25) P.falls++; }
  }
  if (EV.splash) { EV.splash = false; P.falls++; toast('ドボン！ 海に落ちた… 港からやりなおし'); }
  // てっぺん
  if (SUMMIT && !G.cleared && P.onGround && P.pos.y >= SUMMIT.y - .3 && Math.hypot(P.pos.x - SUMMIT.x, P.pos.z - SUMMIT.z) < SUMMIT.R + .2) clearGame();
  // 自動セーブ（止まっている足場に立っているとき）
  G.saveT -= dt;
  if (G.saveT <= 0 && P.onGround && !(P.gCol && P.gCol.mv)) { G.saveT = 2.5; store.set('save', snap()); }
  // 風の音：高いほど、速く落ちるほど強い
  AU.wind(clamp(P.pos.y / 600, 0, .6) + clamp(-P.vel.y / 40, 0, 1) * .8);
}
function snap() { return { v: 1, x: +P.pos.x.toFixed(2), y: +P.pos.y.toFixed(2), z: +P.pos.z.toFixed(2), yaw: +CAM.yaw.toFixed(3), best: Math.round(P.best), falls: P.falls, time: Math.round(P.time) }; }

// ---------- 描く ----------
function render(dt) {
  if (G.state === 'title' || G.state === 'boot') {
    G.titleT += dt; const a = G.titleT * .05 + .6, h = 26 + Math.sin(G.titleT * .07) * 10;
    camera.position.set(Math.cos(a) * 75, h, Math.sin(a) * 75); camera.lookAt(0, h + 22, 0); applySky(h, G.t);
  } else { updCam(dt); applySky(camera.position.y, G.t); }
  // 太陽の影は自分のまわりだけ
  const fx = G.state === 'title' ? 0 : P.pos.x, fy = G.state === 'title' ? 20 : P.pos.y, fz = G.state === 'title' ? 0 : P.pos.z;
  sun.position.set(fx + SKYNOW.sunDir.x * 90, fy + SKYNOW.sunDir.y * 90, fz + SKYNOW.sunDir.z * 90); sun.target.position.set(fx, fy, fz); sun.target.updateMatrixWorld();
  skyMesh.position.copy(camera.position);
  if (FX.water) { FX.water.material.map.offset.x = G.t * .004; FX.water.material.map.offset.y = G.t * .002; FX.water.position.x = Math.round(camera.position.x / 50) * 50; FX.water.position.z = Math.round(camera.position.z / 50) * 50; }
  for (const s of FX.sheets) { s.material.map.offset.x = G.t * .003; s.material.opacity = .5 * clamp(Math.abs(camera.position.y - s.position.y) / 6, .15, 1); }
  if (FX.star) { FX.star.rotation.y = G.t * .8; FX.star.position.y = STAR_POS.y + Math.sin(G.t * 1.5) * .25; }
  animPlayer(dt, G.t);
  renderer.render(scene, camera);
}

// ---------- HUD ----------
let altMarks = false;
function hud(dt) {
  if (G.state !== 'play' && G.state !== 'pause') return;
  $('hHeight').textContent = Math.max(0, Math.round(P.pos.y));
  $('hBest').textContent = Math.round(P.best);
  $('hZone').textContent = zoneAt(P.pos.y).name;
  const t = Math.floor(P.time); $('hTime').textContent = Math.floor(t / 3600) ? `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}` : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  $('hFalls').textContent = P.falls;
  const H = SUMMIT ? SUMMIT.y : ZH * 7;
  $('altMe').style.bottom = clamp(P.pos.y / H, 0, 1) * 100 + '%'; $('altMe').style.top = 'auto';
  $('altBest').style.bottom = clamp(P.best / H, 0, 1) * 100 + '%'; $('altBest').style.top = 'auto';
  if (!altMarks) { altMarks = true; const a = $('alt'); for (const Z of ZONES) { const b = document.createElement('b'); b.textContent = Z.y0 ? Z.y0 + 'm' : ''; b.style.bottom = Z.y0 / H * 100 + '%'; a.appendChild(b); } }
  if (G.toastT > 0) { G.toastT -= dt; if (G.toastT <= 0) $('toast').classList.remove('on'); }
  if (G.bannerT > 0) { G.bannerT -= dt; if (G.bannerT <= 0) $('banner').classList.remove('on'); }
}
function toast(s, t = 2.2) { const e = $('toast'); e.textContent = s; e.classList.add('on'); G.toastT = t; }
function banner(title, sub) { $('bnTitle').textContent = title; $('bnSub').textContent = sub; $('banner').classList.add('on'); G.bannerT = 2.8; }

// ---------- はじめる・やめる ----------
function showOnly(id) { for (const s of ['title', 'pause', 'codeBox', 'setBox', 'helpBox', 'clear', 'ask']) $(s).classList.toggle('hidden', s !== id); }
function startAt(s) {
  // s があれば、その続きから（コードや自動セーブ）。なければ港から
  P.vel.set(0, 0, 0); P.onGround = false; P.squash = 0; G.cleared = false;
  if (s) {
    P.best = s.best || 0; P.falls = s.falls || 0; P.time = s.time || 0;
    placeSafe(s.x, s.y, s.z); CAM.yaw = s.yaw ?? START.yaw;
  } else { P.best = 0; P.falls = 0; P.time = 0; respawnStart(); }
  P.airTop = P.pos.y; CAM.pitch = -.22; CAM.cur = SET.camD; P.yaw = CAM.yaw; viewShow();
  G.zoneSeen = zoneAt(P.pos.y).i; G.state = 'play'; G.acc = 0; G.saveT = 1;
  showOnly(null); $('hud').classList.remove('hidden'); $('touch').classList.toggle('off', !IN.touchOn);
  banner(zoneAt(P.pos.y).name, `${Math.round(P.pos.y)} m から`);
  if (!IN.touchOn) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* */ } }
}
// コードの場所に立たせる。足もとに何もなければ、いちばん近い足場の上へ
function placeSafe(x, y, z) {
  P.pos.set(x, y + .04, z);
  if (fits(P.pos.x, P.pos.y, P.pos.z) && groundBelow(1.5) >= 0) { P.pos.y -= groundBelow(1.5); return; }
  let best = null, bd = 1e9;
  for (const n of ROUTE) { const d = Math.hypot(n.x - x, (n.y - y) * 1.5, n.z - z); if (d < bd && !n.mover) { bd = d; best = n; } }
  if (best) P.pos.set(best.x, best.y + .05, best.z); else respawnStart();
}
function togglePause(on) {
  if (on && G.state === 'play') { G.state = 'pause'; showOnly('pause'); store.set('save', snap()); try { document.exitPointerLock(); } catch (e) { /* */ } }
  else if (!on && G.state === 'pause') { G.state = 'play'; showOnly(null); if (!IN.touchOn) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* */ } } }
}
function toTitle() {
  if (G.state === 'play' || G.state === 'pause') store.set('save', snap());
  G.state = 'title'; G.titleT = 0; showOnly('title'); $('hud').classList.add('hidden'); $('touch').classList.add('off');
  try { document.exitPointerLock(); } catch (e) { /* */ }
  drawTitle();
}
function drawTitle() {
  const s = store.get('save', null);
  $('bCont').disabled = !s; $('contInfo').textContent = s ? `${Math.round(s.y)} m・最高 ${s.best} m・${fmtTime(s.time)}` : 'まだ記録がありません';
  $('recLine').textContent = REC.clears ? `てっぺん ${REC.clears} 回・ベスト ${fmtTime(REC.bestTime)}（落ちた回数 ${REC.bestFalls}）` : REC.best ? `これまでの最高 ${REC.best} m` : '';
}
const fmtTime = s => { s = Math.round(s || 0); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; return h ? `${h}時間${m}分` : `${m}分${String(ss).padStart(2, '0')}秒`; };
function clearGame() {
  G.cleared = true; AU.fanfare();
  const first = !REC.clears || P.time < REC.bestTime;
  REC.clears++; REC.best = Math.max(REC.best, Math.round(P.best)); if (first) { REC.bestTime = Math.round(P.time); REC.bestFalls = P.falls; } saveRec();
  $('clTime').textContent = fmtTime(P.time); $('clFalls').textContent = P.falls + ' 回'; $('clBest').textContent = fmtTime(REC.bestTime) + (first ? '（新記録！）' : '');
  G.state = 'pause'; showOnly('clear'); try { document.exitPointerLock(); } catch (e) { /* */ }
}

// ================= セーブコード（20文字：場所・向き・最高・落ちた回数・時間＋まちがいチェック） =================
// 0〜9 と A〜Z（まぎらわしい I・L・O・U をのぞく）。打つときの O は 0、I と L は 1 とみなす
const ABC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_VER = 1n;
function hash24(n) { let h = 0x811c9dc5; for (let i = 0; i < 10; i++) { h ^= Number((n >> BigInt(i * 8)) & 255n); h = Math.imul(h, 0x01000193) >>> 0; } h ^= 0x5a17c3; h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0; return BigInt((h ^ (h >>> 15)) & 0xffffff); }
function maskOf(k) { let m = 0n, s = Number(k) | 1; for (let i = 0; i < 4; i++) { s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) >>> 0; s = (s ^ (s >>> 12)) >>> 0; m = (m << 19n) | BigInt(s & 0x7ffff); } return m & ((1n << 76n) - 1n); }
function makeCode(s) {
  const q = (v, lo, step, bits) => BigInt(clamp(Math.round((v - lo) / step), 0, (1 << bits) - 1));
  const yawN = ((s.yaw % TAU) + TAU) % TAU;
  let p = CODE_VER;
  p = (p << 12n) | q(s.x, -204.8, .1, 12); p = (p << 13n) | q(s.y, -10, .1, 13); p = (p << 12n) | q(s.z, -204.8, .1, 12);
  p = (p << 5n) | BigInt(Math.round(yawN / TAU * 32) & 31); p = (p << 10n) | q(s.best, 0, 1, 10); p = (p << 10n) | q(s.falls, 0, 1, 10); p = (p << 11n) | q(s.time / 60, 0, 1, 11);
  // p は 3+12+13+12+5+10+10+11 = 76 bit
  const h = hash24(p), x = p ^ maskOf(h), all = (h << 76n) | x;   // 100 bit
  let out = ''; for (let i = 19; i >= 0; i--) out += ABC[Number((all >> BigInt(i * 5)) & 31n)];
  return out.match(/.{5}/g).join('-');
}
function readCode(str) {
  const t = String(str || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, '');
  if (t.length !== 20) return { err: '20文字のコードを入れてください（いま ' + t.length + ' 文字）' };
  let all = 0n; for (const ch of t) { const v = ABC.indexOf(ch); if (v < 0) return { err: '使えない文字があります：' + ch }; all = (all << 5n) | BigInt(v); }
  const h = all >> 76n, p = (all & ((1n << 76n) - 1n)) ^ maskOf(h);
  if (hash24(p) !== h) return { err: 'コードがちがうようです。打ちまちがいがないか見てください' };
  let v = p; const take = bits => { const r = v & ((1n << BigInt(bits)) - 1n); v >>= BigInt(bits); return Number(r); };
  const time = take(11) * 60, falls = take(10), best = take(10), yaw = take(5) / 32 * TAU, z = take(12) * .1 - 204.8, y = take(13) * .1 - 10, x = take(12) * .1 - 204.8, ver = take(3);
  if (ver !== Number(CODE_VER)) return { err: 'このコードは使えない版のものです' };
  return { s: { x, y, z, yaw, best, falls, time } };
}
