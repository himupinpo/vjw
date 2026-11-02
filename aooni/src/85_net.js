
/* =========================================================================
   Online: the mansion with friends (up to 4 in a room)
   Everyone plays their own story on their own screen. In the same room you see each other walk about
   (on the floor you are on), the oni that is after a friend, you can chat, and once you are caught
   you can watch a friend (behind them, or zoomed all the way in, through their eyes).
   Sent in the room's presence ten times a second:
     n name, k shirt (0-7), in 1 while playing, s [x,y,z,yaw,pitch], f floor, r room name, al alive,
     hd in a closet, es out of the house, w watching someone, o [x,y,z,yaw] the oni after you (when it is out)
   The room is put in the lobby list (`ao`) by whoever in it has the first peer id, so it stays listed
   when the one who made it goes.
   ========================================================================= */
const NET_CAP = 4;
const NET_SHIRTS = [0x4f7fd8, 0xd84f4f, 0x4fae5c, 0xd8b04f, 0x9b5fd8, 0x4fc4c8, 0xe07a3a, 0xc8c8c8];
const NET_FLOOR = { F1: '本館1F', F2: '本館2F', F3: '本館3F', B1: '本館地下', A1: '別館1F', A2: '別館2F', A3: '別館3F', AB: '別館地下', K: '回廊', S1: '第2別館1F', S2: '第2別館2F', SB: '第2別館地下', Y: '外' };
const netClean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g, '').trim();
const nr2 = v => Math.round(v * 100) / 100, nr3 = v => Math.round(v * 1000) / 1000;
const netNum = (a, n) => Array.isArray(a) && a.length === n && a.every(Number.isFinite);
// このゲームは 3dgame のページの枠（iframe）の中で動き、親ページの room を使う。そこで起きる2つの問題をふせぐ：
// ・渡すデータは親ページ側で作り直す（親の「ふつうのJSONか」の検査で、枠の中で作ったオブジェクトがはじかれないように）
// ・枠を閉じたら、親に登録した受け取り口をすべて外し、入っていた部屋から出る
function roomSafe(room) {
  if (!room || room.__safe) return room;
  let PJ = null; try { if (window.parent !== window && window.parent.JSON) PJ = window.parent.JSON; } catch (e) { /* a parent we can't read */ }
  const cv = v => (v === undefined || !PJ ? v : PJ.parse(JSON.stringify(v)));
  const offs = new Set(), joined = new Set(), keys = new Set(); let dead = false;
  const guard = h => (typeof h !== 'function' ? h : function () { if (dead) return; try { return h.apply(this, arguments); } catch (e) { console.warn('room handler', e); } });
  const sub = u => { offs.add(u); return () => { offs.delete(u); try { u(); } catch (e) { /* gone */ } }; };
  const note = e => { roomSafe.err = String(e && (e.code || e.message) || e).slice(0, 60); roomSafe.errT = Date.now(); throw e; };
  const wrap = (r, lobby) => {
    const w = {
      __safe: true, get name() { return r.name; },
      emit: (t, d) => r.emit(t, cv(d)).catch(note), on: (t, h, e) => sub(r.on(t, guard(h), guard(e))),
      presence: p => { if (lobby && p) for (const k in p) keys.add(k); return r.presence(cv(p)).then(() => { if (lobby) roomSafe.sent = Date.now(); }, note); },
      peers: () => r.peers(), onPeers: (h, e) => sub(r.onPeers(guard(h), guard(e))), connected: () => r.connected(), onConnection: (h, e) => sub(r.onConnection(guard(h), guard(e))),
      leave: () => { joined.delete(r); return r.leave(); },
    };
    if (lobby) { roomSafe.lobby = r; w.join = async n => { const g = await r.join(n); joined.add(g); return wrap(g, false); }; }
    return w;
  };
  const bye = () => {
    if (dead) return; dead = true;
    for (const u of offs) { try { u(); } catch (e) { /* gone */ } } offs.clear();
    for (const g of joined) { try { g.leave().catch(() => {}); } catch (e) { /* gone */ } } joined.clear();
    if (keys.size) { const p = {}; for (const k of keys) p[k] = null; try { room.presence(cv(p)).catch(() => {}); } catch (e) { /* gone */ } }
  };
  addEventListener('pagehide', bye); addEventListener('unload', bye);
  return wrap(room, true);
}
function roomDiag() {
  const r = roomSafe.lobby; if (!r) return '';
  let n = 0; try { n = r.peers().filter(p => p.kind === 'viewer').length; } catch (e) { /* not yet */ }
  return '（いまこのアーティファクトを開いている人：' + n + '人' + (roomSafe.err && Date.now() - roomSafe.errT < 60000 ? '・送信エラー：' + roomSafe.err : '') + '）';
}
function netClaude() {
  try { if (window.claude && window.claude.use) return window.claude; } catch (e) { /* not framed by claude.ai */ }
  try { if (window.parent && window.parent !== window && window.parent.claude && window.parent.claude.use) return window.parent.claude; } catch (e) { /* a parent we can't read */ }
  return null;
}
const NET = {
  st: 'off', why: '', perm: null, room: null, lobby: [], conn: false, okT: 0,
  on: false, game: null, code: '', gunsub: [], peers: [], joinT: 0, pump: 0, note: '', noteT: 0, last: '', lastT: 0, listed: '', tickN: 0,
  avs: new Map(), spec: null, specCine: null, specCam: { dist: 3.2, yaw: null, pitch: 0.3, dx: 0, dy: 0, for: null }, drag: null, pinch: 0,
};
NET.myName = () => netClean(store.get('netName', '')).slice(0, 14) || 'プレイヤー';
NET.shirt = () => strHash(NET.myName()) % NET_SHIRTS.length;
NET.others = () => NET.peers.filter(p => !p.sameTab && p.kind === 'viewer' && p.presence && typeof p.presence.n === 'string');
NET.nameOf = q => netClean(q.presence.n).slice(0, 14) || '???';
// a line at the top right (what your friends are up to)
NET.toast = function (t) {
  NET.note = t; NET.noteT = performance.now(); NET.render();
  if (GAME.state !== 'play' && GAME.state !== 'watch') return;
  const box = $('toast'), d = document.createElement('div'); d.className = 'toastItem'; d.textContent = t; box.appendChild(d);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { d.style.transition = 'opacity .8s'; d.style.opacity = 0; setTimeout(() => d.remove(), 900); }, 4200);
};

/* ---------------- connecting ---------------- */
NET.init = async function () {
  if (NET.room) return true;
  if (NET.st === 'wait') return false;
  NET.st = 'wait'; NET.render();
  const C = netClaude(); let room = null;
  if (C) { try { room = roomSafe(await C.use('room')); } catch (e) { room = null; } }
  if (!room) { NET.st = 'none'; NET.why = await NET.whyNot(C); NET.render(); return false; }
  NET.room = room; NET.st = 'ok'; NET.conn = room.connected(); NET.okT = performance.now();
  setTimeout(() => NET.render(), 8200);
  room.onConnection(c => { NET.conn = c; NET.render(); }, () => {});
  room.onPeers(ch => { NET.lobby = ch.peers; NET.render(); }, () => { NET.st = 'err'; NET.render(); });
  NET.render(); return true;
};
NET.whyNot = async function (C) {
  if (!C) return 'nohost';
  try { const P = await C.use('permissions'); if (P) { NET.perm = P; return await P.state('room'); } } catch (e) { /* no permissions panel here */ }
  return 'unavailable';
};
NET.rooms = function () {
  const out = [], seen = new Set();
  for (const p of NET.lobby) {
    if (p.kind !== 'viewer') continue;
    const d = p.presence && p.presence.ao;
    if (!d || typeof d !== 'object' || typeof d.c !== 'string' || !/^ao-[a-z0-9]{6}$/.test(d.c) || seen.has(d.c)) continue;
    seen.add(d.c);
    out.push({ c: d.c, n: netClean(d.n).slice(0, 14) || '???', np: clamp(d.np | 0, 1, NET_CAP), mine: p.isMe });
  }
  return out;
};
// the one in the room with the first peer id lists it in the lobby
NET.lister = function () {
  const ids = NET.peers.filter(p => p.kind === 'viewer').map(p => p.peer).sort(), me = NET.peers.find(p => p.sameTab);
  return !!me && ids[0] === me.peer;
};
NET.lobbyPresence = function (force) {
  if (!NET.room) return;
  const ao = NET.on && NET.lister() ? { n: NET.myName(), c: NET.code, np: NET.others().length + 1 } : null, key = ao ? ao.np + ao.n : '';
  if (!force && key === NET.listed) return;
  NET.listed = key;
  NET.room.presence({ ao }).catch(() => {});
};

/* ---------------- making, joining and leaving a room ---------------- */
NET.hostRoom = async function () {
  if (NET.on) return;
  if (!(await NET.init()) || !NET.conn) { NET.toast('まだオンラインにつながっていません'); return; }
  const code = 'ao-' + Array.from({ length: 6 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.random() * 36 | 0]).join('');
  NET.enter(code);
};
NET.joinCode = function () {
  const c = netClean($('olCode').value).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!/^[a-z0-9]{6}$/.test(c)) { NET.toast('部屋番号は英数字6文字です'); return; }
  NET.join({ c: 'ao-' + c, np: 0 });
};
NET.join = async function (r) {
  if (NET.on) return;
  if (!(await NET.init()) || !NET.room) { NET.toast('まだオンラインにつながっていません'); return; }
  if (r.np >= NET_CAP) { NET.toast('この部屋は満員です（4人まで）'); return; }
  NET.enter(r.c);
};
NET.enter = async function (code) {
  let g = null;
  try { g = await NET.room.join(code); } catch (e) { NET.toast('部屋に入れませんでした'); return; }
  Object.assign(NET, { on: true, game: g, code, peers: [], joinT: performance.now(), listed: '', last: '' });
  NET.gunsub = [g.onPeers(ch => { NET.peers = ch.peers; NET.onPeers(); }, () => NET.leave('部屋との接続が切れました'))];
  NET.send(true); NET.render();
};
NET.leave = async function (msg) {
  if (!NET.on) return;
  const g = NET.game;
  NET.gunsub.forEach(u => { try { u(); } catch (e) { /* gone already */ } });
  Object.assign(NET, { on: false, game: null, code: '', gunsub: [], peers: [] });
  for (const a of NET.avs.values()) NET.dropAv(a);
  NET.avs.clear(); $('netList').innerHTML = '';
  if (GAME.state === 'watch') NET.unwatch();
  NET.lobbyPresence(true);
  if (g) { try { await g.leave(); } catch (e) { /* left already */ } }
  if (msg) NET.toast(msg);
  NET.render();
};

/* ---------------- the room changed ---------------- */
NET.onPeers = function () {
  const os = NET.others();
  if (os.length + 1 > NET_CAP && performance.now() - NET.joinT < 4000) { NET.leave('この部屋は満員です（4人まで）'); return; }
  for (const q of os) NET.avState(q);
  for (const [peer, a] of NET.avs) if (!os.some(q => q.peer === peer)) { NET.toast(`${a.name} が部屋を出た`); NET.dropAv(a); NET.avs.delete(peer); }
  NET.lobbyPresence();
  NET.render();
};

/* ---------------- my presence (ten times a second; unchanged, once a second) ---------------- */
NET.send = function (force) {
  if (!NET.on || !NET.game) return;
  const P = PLAYER, play = (GAME.state === 'play' || GAME.state === 'ending') && !!GAME.room, r = GAME.room;
  const p = {
    n: NET.myName(), k: NET.shirt(), in: play ? 1 : 0,
    s: play ? [nr2(P.pos.x), nr2(P.pos.y), nr2(P.pos.z), nr3(P.yaw), nr3(P.pitch)] : null,
    f: play ? r.fl : '', r: play ? String(r.name || '').slice(0, 12) : '',
    al: play && P.alive ? 1 : 0, hd: play && P.hidden ? 1 : 0, es: GAME.state === 'ending' ? 1 : 0, w: GAME.state === 'watch' ? 1 : 0,
    o: play && P.alive && ONI.on && ONI.m && ONI.m.root.visible ? [nr2(ONI.pos.x), nr2(ONI.pos.y), nr2(ONI.pos.z), nr3(ONI.yaw)] : null,
  };
  const js = JSON.stringify(p), now = performance.now();
  if (!force && js === NET.last && now - NET.lastT < 1000) return;
  NET.last = js; NET.lastT = now;
  NET.game.presence(p).catch(() => {});
};
NET.tick = function () {
  if (GAME.state !== 'watch' && NET.spec) { NET.spec = null; UI.show('specBar', false); }
  if (!NET.on) return;
  NET.send();
  if (++NET.tickN % 5 === 0) { NET.hud(); NET.lobbyPresence(); if (GAME.state === 'over') NET.overUI(); }
  if (NET.tickN % 50 === 0) NET.lobbyPresence(true);   // keep the room listed
};

/* ---------------- the others, on your screen ---------------- */
NET.avState = function (q) {
  const o = q.presence, name = NET.nameOf(q);
  let a = NET.avs.get(q.peer);
  if (!a) {
    a = { peer: q.peer, name, buf: [], obuf: [], k: -1, m: null, oni: null, el: null, x: 0, y: 0, z: 0, yaw: 0, pitch: 0, walk: 0, spd: 0, step: 0, st: null, blk: false, blkT: 0, ow: 0, ostep: 0 };
    a.el = document.createElement('div'); a.el.className = 'netTag'; $('netTags').appendChild(a.el);
    NET.avs.set(q.peer, a);
    if (performance.now() - NET.joinT > 2500) NET.toast(`${name} が部屋に入った`);
  }
  a.name = name; a.el.textContent = name;
  const k = Number.isInteger(o.k) ? clamp(o.k, 0, NET_SHIRTS.length - 1) : 0;
  if (a.k !== k) { if (a.m) scene.remove(a.m); a.m = makePerson({ hair: 0x2a1c14, style: 'short', top: NET_SHIRTS[k], bottom: 0x22242c }); a.m.visible = false; scene.add(a.m); a.k = k; }
  const was = a.st;
  a.st = { in: o.in === 1, al: o.al === 1, hd: o.hd === 1, es: o.es === 1, w: o.w === 1, f: typeof o.f === 'string' ? o.f : '', r: netClean(o.r).slice(0, 12), o: netNum(o.o, 4) };
  if (was) {   // tell everyone what became of them
    if (was.in && was.al && a.st.in && !a.st.al && !a.st.es) NET.toast(`${name} が青鬼につかまった…`);
    if (!was.es && a.st.es) NET.toast(`${name} が脱出した！`);
    if (!was.o && a.st.o && a.st.al) NET.toast(`${name} が青鬼に追われている！`);
  }
  const t = performance.now();
  if (a.st.in && netNum(o.s, 5)) { const L = a.buf[a.buf.length - 1]; if (!L || L.s.some((v, i) => v !== o.s[i])) a.buf.push({ t, s: o.s.slice() }); if (a.buf.length > 30) a.buf.shift(); }
  else a.buf = [];
  if (a.st.o) { const L = a.obuf[a.obuf.length - 1]; if (!L || L.s.some((v, i) => v !== o.o[i])) a.obuf.push({ t, s: o.o.slice() }); if (a.obuf.length > 30) a.obuf.shift(); }
  else a.obuf = [];
};
NET.dropAv = function (a) {
  if (a.m) scene.remove(a.m);
  if (a.oni) scene.remove(a.oni.root);
  if (a.el) a.el.remove();
};
// where something was 120 ms ago, between the two poses around then
function netPose(B, rt) {
  let p = B[0], n = B[0];
  for (let i = 0; i < B.length; i++) { if (B[i].t <= rt) p = B[i]; if (B[i].t >= rt) { n = B[i]; break; } n = B[i]; }
  const k = n.t > p.t ? clamp((rt - p.t) / (n.t - p.t), 0, 1) : 1, s = p.s, e = n.s;
  let dy = e[3] - s[3]; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU;
  return [lerp(s[0], e[0], k), lerp(s[1], e[1], k), lerp(s[2], e[2], k), s[3] + dy * k, s.length > 4 ? lerp(s[4], e[4], k) : 0];
}
const netOnFloor = y => MAN.shownFl != null && Math.abs(y - FLOORS[MAN.shownFl]) < 15;
// someone else's footstep, where they are
NET.stepAt = function (pos, room) {
  if (!AU.ok) return;
  const sf = room ? room.surface : 'wood', r = 0.85 + Math.random() * 0.3;
  if (sf === 'carpet' || sf === 'tatami') AU.burst({ pos, dur: 0.07, f: 380 * r, q: 0.8, vol: 0.2, rev: 0.05 });
  else { AU.burst({ pos, dur: 0.06, f: 520 * r, q: 1.2, vol: 0.26, rev: 0.18 }); AU.tone({ pos, f: 85 * r, f2: 45, dur: 0.08, vol: 0.18, rev: 0.05 }); }
};
const _netV = new THREE.Vector3(), _netW = new THREE.Vector3();
NET.update = function (dt) {
  if (!NET.on) return;
  const rt = performance.now() - 120, W = VW(), H = VH();
  for (const a of NET.avs.values()) {
    const st = a.st, show = !!(st && st.in && st.al && !st.es && a.buf.length && a.m);
    // their oni (it cannot catch you, but you will hear it)
    if (st && st.in && st.o && a.obuf.length) {
      if (!a.oni) { a.oni = makeOniModel(); scene.add(a.oni.root); a.oni.phase = 0; }
      const q = netPose(a.obuf, rt), R = a.oni.root, mv = Math.hypot(q[0] - R.position.x, q[2] - R.position.z);
      R.position.set(q[0], q[1], q[2]); R.rotation.y = q[3]; R.visible = netOnFloor(q[1]);
      a.ow = lerp(a.ow, Math.min(mv / Math.max(dt, 1e-3), 8), Math.min(1, dt * 6));
      NET.oniWalk(a.oni, dt, a.ow);
      a.ostep += mv; if (a.ostep > 1.05) { a.ostep = 0; if (R.visible) SFX.oniStep(R.position.clone(), 0.45); }
    } else if (a.oni) a.oni.root.visible = false;
    if (!show || !netOnFloor(a.buf[a.buf.length - 1].s[1])) { if (a.m) a.m.visible = false; a.el.style.display = 'none'; continue; }
    const q = netPose(a.buf, rt), px = a.x, pz = a.z;
    a.x = q[0]; a.y = q[1]; a.z = q[2]; a.yaw = q[3]; a.pitch = q[4];
    const mv = Math.hypot(a.x - px, a.z - pz);
    a.spd = lerp(a.spd, mv / Math.max(dt, 1e-3), Math.min(1, dt * 8));
    const amp = Math.min(1, a.spd / 4.5); a.walk += dt * Math.min(a.spd, 7) * 2.4;
    a.step += mv; if (a.step > (a.spd > 4.6 ? 1.6 : 1.25)) { a.step = 0; if (a.spd > 0.6 && !st.hd) NET.stepAt(new THREE.Vector3(a.x, a.y + 0.1, a.z), WORLD.roomAt(_netV.set(a.x, a.y, a.z))); }
    const M = a.m, U = M.userData, sw = Math.sin(a.walk) * amp * 0.7;
    M.visible = !st.hd && (NET.spec !== a.peer || NET.specCam.dist >= 0.6);   // in a closet, or you are watching through their eyes
    M.position.set(a.x, a.y, a.z); M.rotation.set(0, a.yaw + Math.PI, 0);
    U.legs[0].rotation.x = sw; U.legs[1].rotation.x = -sw; U.arms[0].rotation.x = -sw * 0.8; U.arms[1].rotation.x = sw * 0.8;
    U.head.rotation.x = -a.pitch * 0.5;
    // name tag over their head (not through walls)
    _netV.set(a.x, a.y + 1.95, a.z);
    a.blkT -= dt; if (a.blkT <= 0) { a.blkT = 0.3; a.blk = WORLD.blocked(_netW.copy(_netV).setY(a.y + 1.4), GAME.camPos); }
    const dist = _netV.distanceTo(GAME.camPos);
    _netV.project(camera);
    if (!M.visible || _netV.z > 1 || dist > 26 || a.blk) a.el.style.display = 'none';
    else { a.el.style.display = 'block'; a.el.style.left = ((_netV.x + 1) / 2 * W) + 'px'; a.el.style.top = ((1 - _netV.y) / 2 * H) + 'px'; a.el.style.opacity = dist > 14 ? 0.5 : 0.9; }
  }
  if (GAME.state === 'watch') NET.spectate();
};
// their oni's stride (a copy of the one on your screen, without the rest of it)
NET.oniWalk = function (m, dt, speed) {
  const k = clamp(speed / 4, 0, 1.2), hunch = 0.28;
  m.phase += dt * (1.8 + speed * 1.25);
  const s = Math.sin(m.phase), c = Math.cos(m.phase);
  for (const L of m.legs) { const ph = L.s > 0 ? s : -s; L.hp.rotation.x = ph * 0.55 * k; L.kn.rotation.x = Math.max(0, -Math.cos(m.phase + (L.s > 0 ? 0 : Math.PI))) * 0.8 * k + 0.08; }
  for (const A of m.arms) { const ph = A.s > 0 ? -s : s; A.sh.rotation.x = ph * 0.4 * k + 0.12; A.sh.rotation.z = A.s * 0.14; A.el.rotation.x = -0.18 - k * 0.2; }
  m.hips.position.y = 1.05 + Math.abs(c) * 0.05 * k;
  m.torso.rotation.x = hunch + k * 0.06; m.head.rotation.x = -hunch * 0.6;
};

/* ---------------- who is where (top left, under the items) ---------------- */
NET.hud = function () {
  const el = $('netList'); if (!el) return;
  if (!NET.on) { el.innerHTML = ''; return; }
  el.innerHTML = '';
  for (const q of NET.others()) {
    const a = NET.avs.get(q.peer), st = a && a.st; if (!st) continue;
    const d = document.createElement('div'), b = document.createElement('b'), sp = document.createElement('span');
    b.textContent = a.name; b.style.color = '#' + NET_SHIRTS[a.k >= 0 ? a.k : 0].toString(16).padStart(6, '0');
    sp.textContent = st.es ? '脱出！' : st.w ? '観戦中' : !st.in ? 'タイトル' : !st.al ? 'つかまった' : `${NET_FLOOR[st.f] || ''} ${st.r}${st.o ? '（追われている！）' : ''}`;
    d.append(b, sp); el.appendChild(d);
  }
};

/* ---------------- after you are caught: watch a friend ---------------- */
NET.targets = () => NET.others().filter(q => { const a = NET.avs.get(q.peer); return a && a.st && a.st.in && a.st.al && !a.st.es && a.buf.length; });
NET.watch = function (dir = 0) {
  const ts = NET.targets();
  if (!ts.length) { NET.toast('いま見られる仲間がいません'); NET.overUI(); return; }
  const i = ts.findIndex(q => q.peer === NET.spec);
  NET.spec = ts[((i < 0 ? 0 : i + dir) % ts.length + ts.length) % ts.length].peer;
  if (GAME.state !== 'watch') {
    GAME.state = 'watch'; ONI.reset();
    UI.show('over', false); UI.show('specBar');
    $('fxBlack').style.transition = 'opacity .6s'; $('fxBlack').style.opacity = 0; $('fxHide').style.opacity = 0;
    AU.resume(); if (!GAME.amb) { GAME.amb = LOOPS.ambience(); GAME.amb.setVol(0.8, 1); }   // you hear what they hear
    lastT = performance.now();
  }
  NET.specCam.yaw = null; NET.zoomUI();
};
NET.unwatch = function () {
  NET.spec = null; GAME.cine = null; UI.show('specBar', false);
  UI.over();
};
NET.zoom = function (k) { const S = NET.specCam; S.dist = S.dist < 0.6 && k > 1 ? 1.2 : clamp(S.dist * k, 0.5, 9); if (S.dist < 0.65) S.dist = 0.5; NET.zoomUI(); };
NET.zoomUI = function () { const b = $('specView'); if (b) b.textContent = NET.specCam.dist < 0.6 ? '三人称' : '一人称'; };
NET.spectate = function () {
  const a = NET.avs.get(NET.spec);
  if (!a || !a.st || !a.st.in || !a.st.al || a.st.es || !a.buf.length) {   // caught or out: someone else, or back to the screen
    const ts = NET.targets();
    if (ts.length) { NET.spec = ts[0].peer; return; }
    NET.unwatch(); return;
  }
  const C = NET.specCine || (NET.specCine = { pos: new THREE.Vector3(), look: new THREE.Vector3() }), S = NET.specCam;
  const eye = new THREE.Vector3(a.x, a.y + 1.58, a.z);
  if (S.for !== a.peer) { S.for = a.peer; S.yaw = null; }
  if (S.yaw == null) S.yaw = a.yaw;
  const sens = 0.0028 * SETTINGS.sens * HUB.sens;
  S.yaw -= S.dx * sens; S.pitch = clamp(S.pitch + S.dy * sens, -0.5, 1.25); S.dx = 0; S.dy = 0;
  if (S.dist < 0.6) {   // their own eyes
    C.pos.copy(eye); const cp = Math.cos(a.pitch);
    C.look.set(C.pos.x - Math.sin(a.yaw) * cp, C.pos.y + Math.sin(a.pitch), C.pos.z - Math.cos(a.yaw) * cp);
  } else {   // behind and above them, turned by your drags, pulled in so a wall never comes between
    const head = eye.clone().setY(eye.y + 0.1), cp = Math.cos(S.pitch), d0 = new THREE.Vector3(Math.sin(S.yaw) * cp, Math.sin(S.pitch), Math.cos(S.yaw) * cp);
    let d = S.dist; const q = new THREE.Vector3();
    for (let t = 0.3; t <= S.dist; t += 0.2) { q.copy(head).addScaledVector(d0, t); if (WORLD.blocked(head, q)) { d = Math.max(0.35, t - 0.3); break; } }
    C.pos.copy(head).addScaledVector(d0, d); C.pos.y = Math.min(C.pos.y, a.y + 3.0);
    C.look.copy(head);
  }
  GAME.cine = C;
  const r = WORLD.roomAt(_netV.set(a.x, a.y, a.z));
  if (r) { GAME.room = r; showFloor(r.fl); }   // their room's light and sound
  $('specName').textContent = a.name;
};
NET.overUI = function () {
  const b = $('oWatch'); if (!b) return;
  b.style.display = NET.on && NET.targets().length ? 'inline-block' : 'none';
};

/* ---------------- screens ---------------- */
NET.openOnline = function () {
  UI.show('title', false); UI.show('online');
  $('olName').value = NET.myName();
  NET.render();
  NET.init().then(() => NET.render());
};
const NET_HOWTO = 'オンラインで遊べるのは、claude.ai にログインして、このアーティファクトを作った人の組織のメンバーか、共有メニューで招待されたアカウントで開いたときです。だれでも見られる公開リンクから開いた人や、ログインしていない人は入れません（ひとりでは遊べます）。';
NET.render = function () {
  const ban = $('netBanner');
  if (ban) { ban.classList.toggle('hidden', !NET.on); if (NET.on) ban.textContent = `🟢 オンライン：部屋 ${NET.code.slice(3).toUpperCase()}（${NET.others().length + 1}人）　はじめから／つづきから で、みんなと同じ館に入ります`; }
  const st = $('olState'); if (!st || $('online').classList.contains('hidden')) return;
  const bad = NET.st === 'none' || NET.st === 'err', now = performance.now();
  $('olPerm').style.display = bad && NET.perm ? '' : 'none';
  $('olRetry').style.display = bad ? '' : 'none';
  $('olHost').disabled = NET.st !== 'ok' || !NET.conn || NET.on;
  $('olIn').classList.toggle('hidden', !NET.on); $('olOut').classList.toggle('hidden', NET.on);
  st.textContent =
    NET.st === 'wait' ? 'オンラインに接続しています…'
      : NET.st === 'none' ? (NET.why === 'nohost' ? 'このページは claude.ai の外で開かれています。claude.ai でアーティファクトを開くと、オンラインでいっしょに遊べます。'
        : NET.why === 'denied' ? 'このアーティファクトの「ほかの人とつながる」許可がオフになっています。「許可の設定を開く」からオンにしてください。'
          : 'この画面ではオンラインに入れませんでした。\n' + NET_HOWTO)
        : NET.st === 'err' ? 'オンラインが使えなくなりました。アーティファクトを開き直してください。\n' + NET_HOWTO
          : !NET.conn ? (now - NET.okT > 8000 ? '🟡 オンラインのサーバーにつながりません。学校や会社のネットワークでは、通信がふさがれていることがあります。別のネットワークや Claude アプリで試してください。' : '🟡 接続を待っています…')
            : NET.on ? `🟢 部屋 ${NET.code.slice(3).toUpperCase()} に入っています（${NET.others().length + 1}/${NET_CAP}人）。` + 'それぞれ自分の物語を進めながら、同じ館の中でおたがいの姿が見えます。チャットは 💬 か T キー。'
              : '🟢 つながっています。部屋を作るか、下の部屋に入ろう（1つの部屋に4人まで）。一覧に出ないときは、部屋を作った人の「部屋番号」を入れて入れます。\n' + roomDiag();
  if (NET.note && now - NET.noteT < 6000) st.textContent += '\n⚠ ' + NET.note;
  if (NET.on) {
    const L = $('olMembers'); L.innerHTML = '';
    for (const r of [{ n: NET.myName() + '（あなた）', s: '' }].concat(NET.others().map(q => { const a = NET.avs.get(q.peer), t = a && a.st; return { n: NET.nameOf(q), s: !t ? '' : t.es ? '脱出！' : t.in ? (t.al ? `${NET_FLOOR[t.f] || ''} ${t.r}` : 'つかまった') : 'タイトル' }; }))) {
      const d = document.createElement('div'); d.className = 'olRoom';
      const b = document.createElement('b'); b.textContent = r.n; const sm = document.createElement('small'); sm.textContent = r.s;
      d.append(b, sm); L.appendChild(d);
    }
    $('olCont').disabled = !UI.anySave();
    return;
  }
  const L = $('olRooms'); L.innerHTML = '';
  const rs = NET.st === 'ok' ? NET.rooms() : [];
  if (!rs.length) { const d = document.createElement('div'); d.className = 'olEmpty'; d.textContent = NET.st === 'ok' ? 'まだ部屋がありません。「部屋を作る」で作ろう！' : '—'; L.appendChild(d); }
  for (const r of rs) {
    const d = document.createElement('button'); d.className = 'olRoom';
    const b = document.createElement('b'); b.textContent = `${r.n} の部屋`;
    const sm = document.createElement('small'); sm.textContent = `${r.np}/${NET_CAP}人${r.mine ? '・あなたの別のタブ' : ''}`;
    d.append(b, sm);
    d.onclick = () => NET.join(r);
    L.appendChild(d);
  }
};
NET.bind = function () {
  $('bOnline').onclick = () => NET.openOnline();
  $('olBack').onclick = () => { UI.show('online', false); UI.title(); };
  $('olHost').onclick = () => NET.hostRoom();
  $('olJoin').onclick = () => NET.joinCode();
  $('olCode').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') NET.joinCode(); });
  $('olRetry').onclick = () => { if (NET.st === 'err') NET.room = null; NET.st = 'off'; NET.init().then(() => NET.render()); NET.render(); };
  $('olPerm').onclick = () => { if (NET.perm) NET.perm.manage().then(() => { NET.st = 'off'; NET.room = null; return NET.init(); }).then(() => NET.render()).catch(() => NET.toast('アーティファクトのメニューの「権限（Permissions）」から変えてください')); };
  const nm = $('olName');
  nm.addEventListener('keydown', e => e.stopPropagation());
  nm.addEventListener('change', () => { store.set('netName', netClean(nm.value).slice(0, 14)); nm.value = NET.myName(); NET.send(true); NET.lobbyPresence(true); NET.render(); });
  $('olNew').onclick = () => { UI.show('online', false); GAME.start(); };
  $('olCont').onclick = () => { UI.show('online', false); UI.files('load', () => NET.openOnline()); };
  $('olLeave').onclick = () => NET.leave();
  $('oWatch').onclick = () => NET.watch(0);
  $('specPrev').onclick = () => NET.watch(-1);
  $('specNext').onclick = () => NET.watch(1);
  $('specOut').onclick = () => NET.zoom(1.35);
  $('specIn').onclick = () => NET.zoom(1 / 1.35);
  $('specView').onclick = () => { const S = NET.specCam; S.dist = S.dist < 0.6 ? 3.2 : 0.5; NET.zoomUI(); };
  $('specCont').onclick = () => UI.files('load');
  $('specTitle').onclick = () => { NET.spec = null; UI.show('specBar', false); ONI.reset(); WORLD.reset(); UI.title(); };
  // while watching: drag to turn round them, wheel or pinch to zoom, arrow keys for the next friend
  canvas.addEventListener('mousedown', e => { if (GAME.state === 'watch') NET.drag = { x: e.clientX, y: e.clientY }; });
  addEventListener('mouseup', () => { NET.drag = null; });
  addEventListener('mousemove', e => {
    if (GAME.state !== 'watch' || !NET.drag || !e.buttons) return;
    const a = toStage(NET.drag.x, NET.drag.y), b = toStage(e.clientX, e.clientY); NET.drag = { x: e.clientX, y: e.clientY };
    NET.specCam.dx += (b.x - a.x) * 1.6; NET.specCam.dy += (b.y - a.y) * 1.6;
  });
  canvas.addEventListener('wheel', e => { if (GAME.state === 'watch') { e.preventDefault(); NET.zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15); } }, { passive: false });
  addEventListener('keydown', e => {
    if (GAME.state !== 'watch' || e.repeat) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') NET.watch(-1); else if (e.code === 'ArrowRight' || e.code === 'KeyD') NET.watch(1);
  });
  const tp = t => toStage(t.clientX, t.clientY);
  canvas.addEventListener('touchstart', e => {
    if (GAME.state !== 'watch') return;
    if (e.touches.length === 2) NET.pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    else if (e.touches.length === 1) NET.drag = tp(e.touches[0]);
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (GAME.state !== 'watch') return;
    if (e.touches.length === 2 && NET.pinch) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (Math.abs(d - NET.pinch) > 18) { NET.zoom(d > NET.pinch ? 1 / 1.12 : 1.12); NET.pinch = d; } NET.drag = null; return; }
    if (e.touches.length === 1 && NET.drag) { const q = tp(e.touches[0]); NET.specCam.dx += (q.x - NET.drag.x) * 2.2; NET.specCam.dy += (q.y - NET.drag.y) * 2.2; NET.drag = q; }
  }, { passive: true });
  canvas.addEventListener('touchend', () => { NET.drag = null; NET.pinch = 0; });
  clearInterval(NET.pump); NET.pump = setInterval(NET.tick, 100);
  OCHAT.mount({
    room: () => (NET.on ? NET.game : null), name: () => NET.myName(), parent: () => $('rot'),
    onOpen: () => { INPUT.selfUnlockT = performance.now(); INPUT.keys = {}; INPUT.run = false; },
    onClose: () => { if (!IS_TOUCH && GAME.state === 'play' && PLAYER.alive && !GAME.modal && !GAME.paused) requestLock(); },
    canOpen: () => !(GAME.modal && GAME.modal.key) && !UI._files,
    css: '#ochatLog{top:calc(env(safe-area-inset-top,0px) + 176px)}',
  });
};

/* ===================== online chat (only while you are in an online room) =====================
   Messages travel in your presence in the game's room: your last three as [number, text] under `ocm`,
   your name under `ocn`. A newcomer's old lines are not shown. T or Enter (PC) or 💬 opens it. */
const OCHAT = (() => {
  const S = { seq: 0, out: [], seen: {}, open: false, room: null, opt: null, el: {}, lines: [] };
  const clean = v => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g, '').trim();
  const CSS = `
#ochat{position:absolute;inset:0;pointer-events:none;z-index:40;font-family:"Noto Sans JP",system-ui,sans-serif;display:none}
#ochat.on{display:block}
#ochatB{position:absolute;right:calc(env(safe-area-inset-right,0px) + 66px);top:calc(env(safe-area-inset-top,0px) + 12px);width:42px;height:38px;border-radius:10px;border:2px solid rgba(255,255,255,.7);background:rgba(10,12,20,.72);color:#fff;font-size:19px;line-height:1;pointer-events:auto;cursor:pointer;padding:0}
#ochatB.new{box-shadow:0 0 0 3px #ffd34d}
#ochatLog{position:absolute;left:calc(env(safe-area-inset-left,0px) + 10px);top:calc(env(safe-area-inset-top,0px) + 118px);width:min(420px,60vw);display:flex;flex-direction:column;gap:3px}
#ochatLog div{background:rgba(0,0,0,.55);color:#fff;padding:3px 9px;border-radius:6px;font-size:14px;line-height:1.45;text-shadow:0 1px 2px #000;word-break:break-all;transition:opacity .5s}
#ochatLog b{margin-right:4px}
#ochatBox{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 10px);transform:translateX(-50%);width:min(520px,94%);display:none;gap:6px;pointer-events:auto;background:rgba(16,18,28,.94);border:2px solid rgba(255,255,255,.6);border-radius:10px;padding:8px;flex-wrap:wrap}
#ochat.open #ochatBox{display:flex}
#ochat.open #ochatLog div{opacity:1!important}
#ochatIn{flex:1;min-width:0;font-size:16px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#0b0c12;color:#fff;outline:none;-webkit-user-select:text;user-select:text}
#ochatBox button{font-size:15px;padding:6px 12px;border-radius:7px;border:1px solid #888;background:#2a3050;color:#fff;cursor:pointer}
#ochatQ{display:flex;flex-wrap:wrap;gap:5px;width:100%}
#ochatQ button{font-size:13px;padding:4px 10px;background:#1c2034}`;
  const QUICK = ['よろしく！', 'こっち！', 'まって！', 'ありがとう', 'ナイス！', 'にげて！'];
  function el(tag, attrs, parent) { const e = document.createElement(tag); Object.assign(e, attrs || {}); if (parent) parent.appendChild(e); return e; }
  function mount(opt) {
    S.opt = opt;
    const st = el('style', { textContent: CSS + (opt.css || '') }); document.head.appendChild(st);   // (opt.css: where this game has room for it)
    const w = S.el.w = el('div', { id: 'ochat' });
    S.el.log = el('div', { id: 'ochatLog' }, w);
    const b = S.el.b = el('button', { id: 'ochatB', textContent: '💬', title: 'チャット（T）' }, w);
    const box = el('div', { id: 'ochatBox' }, w);
    const inp = S.el.inp = el('input', { id: 'ochatIn', maxLength: 60, placeholder: 'メッセージ', autocomplete: 'off', enterKeyHint: 'send' }, box);
    el('button', { textContent: '送信', onclick: e => { e.stopPropagation(); send(inp.value); inp.value = ''; close(); } }, box);
    el('button', { textContent: '×', onclick: e => { e.stopPropagation(); close(); } }, box);
    const q = el('div', { id: 'ochatQ' }, box);
    for (const t of QUICK) el('button', { textContent: t, onclick: e => { e.stopPropagation(); send(t); close(); } }, q);
    const stop = e => e.stopPropagation();
    for (const ev of ['mousedown', 'mouseup', 'click', 'touchstart', 'touchend', 'pointerdown', 'pointerup', 'wheel']) box.addEventListener(ev, stop, { passive: true });
    b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); toggle(); }, { passive: false });
    b.addEventListener('click', e => { e.stopPropagation(); toggle(); });
    b.addEventListener('mousedown', stop);
    // while typing, the game does not see the keys
    addEventListener('keydown', e => {
      if (document.activeElement === inp) {
        e.stopPropagation();
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(inp.value); inp.value = ''; close(); }
        else if (e.key === 'Escape') { e.preventDefault(); close(); }
        return;
      }
      const ae = document.activeElement;   // (typing in another box: Enter is theirs)
      if (S.room && !S.open && !e.repeat && !(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) && ((opt.noT ? false : e.code === 'KeyT') || (e.code === 'Enter' && opt.enterOpens)) && (!opt.canOpen || opt.canOpen())) { e.preventDefault(); e.stopPropagation(); open(); }
    }, true);
    addEventListener('keyup', e => { if (document.activeElement === inp) e.stopPropagation(); }, true);
    addEventListener('keypress', e => { if (document.activeElement === inp) e.stopPropagation(); }, true);
    (opt.parent && opt.parent() || document.body).appendChild(w);
    setInterval(tick, 250);
  }
  function tick() {
    let r = null; try { r = S.opt.room(); } catch (e) { r = null; }
    if (r !== S.room) { S.room = r; S.seen = {}; S.out = []; if (!r && S.open) close(); }
    S.el.w.classList.toggle('on', !!r);
    const now = performance.now();
    for (const L of S.lines.slice()) { const age = (now - L.t) / 1000; if (age > 12 && !S.open) { L.d.remove(); S.lines.splice(S.lines.indexOf(L), 1); } else L.d.style.opacity = S.open ? 1 : Math.min(1, 12 - age); }
    if (!r) return;
    let ps = []; try { ps = r.peers(); } catch (e) { ps = []; }
    for (const p of ps) if (p && !p.sameTab && p.kind === 'viewer') read(p.peer, p.presence);
  }
  function read(peer, pr) {
    const cm = pr && pr.ocm;
    if (!Array.isArray(cm)) { if (!(peer in S.seen)) S.seen[peer] = 0; return; }   // (nothing said yet: whatever they say next is new)
    const top = cm.reduce((m, e) => (Array.isArray(e) && e[0] > m ? e[0] : m), -1);
    if (!(peer in S.seen)) { S.seen[peer] = top; return; }
    for (const e of cm) {
      if (!Array.isArray(e) || !(e[0] > S.seen[peer])) continue;
      S.seen[peer] = e[0]; const t = clean(e[1]).slice(0, 60);
      if (t) { line(clean(pr.ocn).slice(0, 14) || '???', t, false); if (!S.open) S.el.b.classList.add('new'); }
    }
  }
  function line(name, text, mine) {
    const d = el('div', {}, S.el.log), n = el('b', { textContent: name ? name + '：' : '' }, d); n.style.color = mine ? '#8fc4ff' : '#ffb07a';
    d.appendChild(document.createTextNode(text));
    S.lines.push({ d, t: performance.now() });
    while (S.lines.length > 7) S.lines.shift().d.remove();
    if (S.opt.sound) try { S.opt.sound(mine); } catch (e) { /* no sound */ }
  }
  // presence is small (4 KiB for everything the game keeps there too): at most two lines, taken out again after a while
  function send(t) {
    t = clean(t).slice(0, S.opt.max || 60); if (!t || !S.room) return;
    const room = S.room, nm = clean(S.opt.name()).slice(0, 12) || 'プレイヤー';
    S.seq++; S.out.push([S.seq, t]); if (S.out.length > 2) S.out.shift();
    line(nm, t, true);
    const put = list => room.presence({ ocm: list, ocn: nm });
    try { put(S.out.slice()).catch(() => put(S.out.slice(-1)).catch(() => line('', '（送れませんでした）', true))); } catch (e) { /* not sent */ }
    clearTimeout(S.clearT);
    S.clearT = setTimeout(() => { S.out = []; if (S.room === room) try { room.presence({ ocm: null, ocn: null }).catch(() => {}); } catch (e) { /* gone */ } }, 8000);
  }
  function open() {
    if (!S.room || S.open) return;
    S.open = true; S.el.w.classList.add('open'); S.el.b.classList.remove('new');
    if (S.opt.onOpen) try { S.opt.onOpen(); } catch (e) { /* game hook */ }
    if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) { /* not locked */ }
    try { S.el.inp.focus(); } catch (e) { /* no focus */ }
  }
  function close() {
    if (!S.open) return;
    S.open = false; S.el.w.classList.remove('open');
    try { S.el.inp.blur(); } catch (e) { /* no focus */ }
    if (S.opt.onClose) try { S.opt.onClose(); } catch (e) { /* game hook */ }
  }
  const toggle = () => (S.open ? close() : open());
  return { mount, open, close, get isOpen() { return S.open; }, _S: S };
})();
