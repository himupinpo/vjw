
/* =========================================================================
   The others: Takeshi, Takuro and Mika as they look in the original (blond Takeshi in a white shirt,
   red-haired Takuro with his ponytail, Mika's brown bob and navy uniform)
   ========================================================================= */
const PEOPLE = {
  hiroshi: { name: 'ひろし', hair: 0x24242a, style: 'short', top: 0xe6e5df, bottom: 0x26262e },   // (only seen from outside in the bath scene)
  takeshi: { name: 'たけし', hair: 0xd8b860, style: 'short', top: 0xf0f0ea, bottom: 0x1c1c22 },
  takuro: { name: 'たくろう', hair: 0xb8402a, style: 'pony', top: 0xf0f0ea, bottom: 0x1c1c22 },
  mika: { name: 'みか', hair: 0x6a3a22, style: 'bob', top: 0x1c2648, bottom: 0x1c2648, skirt: true },
};
function makePerson(def) {
  const g = new THREE.Group(), M = (c, r = 0.75) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const skin = M(0xf0d0b4, 0.6), hair = M(def.hair, 0.55), top = M(def.top), bottom = M(def.bottom), shoe = M(0x3a2414), eye = new THREE.MeshBasicMaterial({ color: 0x1a1210 });
  const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; g.add(o); return o; };
  const sph = new THREE.SphereGeometry(1, 18, 14), cyl = new THREE.CylinderGeometry(1, 1, 1, 12), bx = new THREE.BoxGeometry(1, 1, 1);
  const head = new THREE.Group(); head.position.y = 1.5; g.add(head);
  const h = (geo, m, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); head.add(o); return o; };
  h(sph, skin, 0, 0.02, 0, 0.12, 0.14, 0.125);
  h(sph, hair, 0, 0.07, -0.015, 0.132, 0.12, 0.135);
  h(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), hair, 0, 0.055, 0.035, 0.13, 0.09, 0.105);   // fringe
  if (def.style === 'bob') { h(sph, hair, 0, -0.03, -0.045, 0.142, 0.13, 0.11); for (const sd of [-1, 1]) h(bx, hair, sd * 0.115, -0.04, 0.03, 0.04, 0.16, 0.12); }
  if (def.style === 'pony') { h(sph, hair, 0, 0.0, -0.17, 0.05, 0.12, 0.05); }
  for (const s of [-1, 1]) h(sph, eye, s * 0.045, 0.0, 0.112, 0.016, 0.022, 0.01);
  add(cyl, top, 0, 1.17, 0, 0.17, 0.42, 0.11);
  add(sph, top, 0, 1.36, 0, 0.19, 0.07, 0.12);
  if (def.skirt) add(new THREE.CylinderGeometry(0.15, 0.22, 0.32, 14), bottom, 0, 0.82, 0);
  else add(cyl, bottom, 0, 0.86, 0, 0.165, 0.2, 0.1);
  const legs = [];
  for (const s of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(s * 0.08, 0.86, 0); g.add(lg);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.8, 10), def.skirt ? skin : bottom); l.position.y = -0.42; l.castShadow = true; lg.add(l);
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.2), shoe); sh.position.set(0, -0.83, 0.04); lg.add(sh);
    legs.push(lg);
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const am = new THREE.Group(); am.position.set(s * 0.21, 1.36, 0); g.add(am);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.6, 10), top); a.position.y = -0.3; a.castShadow = true; am.add(a);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), skin); hd.position.y = -0.63; am.add(hd);
    am.rotation.z = s * 0.08; arms.push(am);
  }
  g.userData = { head, legs, arms, def };
  return g;
}
const CAST = {
  list: {},
  get(id) {
    if (!this.list[id]) { const m = makePerson(PEOPLE[id]); m.visible = false; scene.add(m); this.list[id] = { m, walk: 0, shiver: 0 }; }
    return this.list[id];
  },
  place(id, x, y, z, yaw) { const c = this.get(id); c.m.position.set(x, y, z); c.m.rotation.set(0, yaw, 0); c.m.visible = true; c.base = c.m.position.clone(); c.dead = false; return c; },
  // face down on the floor, still
  lie(id, x, y, z, yaw) {
    const c = this.place(id, x, y + 0.13, z, yaw); c.m.rotation.order = 'YXZ'; c.m.rotation.x = Math.PI / 2; c.base = null; c.dead = true;
    c.m.userData.arms.forEach((a, i) => { a.rotation.set(0, 0, (i ? -1 : 1) * 0.5); }); c.m.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); c.m.userData.head.rotation.set(0, 0.5, 0);
    return c;
  },
  hide(id) { if (this.list[id]) this.list[id].m.visible = false; },
  hideAll() { for (const k in this.list) this.list[k].m.visible = false; },
  update(dt) {
    for (const k in this.list) {
      const c = this.list[k]; if (!c.m.visible || c.dead) continue;
      const u = c.m.userData;
      c.walk = damp(c.walk, c.moving ? 1 : 0, 8, dt);
      const ph = GAME.time * 7;
      u.legs.forEach((l, i) => (l.rotation.x = Math.sin(ph + i * Math.PI) * 0.5 * c.walk));
      u.arms.forEach((a, i) => (a.rotation.x = -Math.sin(ph + i * Math.PI) * 0.4 * c.walk));
      u.head.rotation.y = Math.sin(GAME.time * 0.7 + k.length) * 0.15 * (1 - c.walk);
      if (c.shiver && c.base) { c.m.position.x = c.base.x + (Math.random() - 0.5) * 0.015 * c.shiver; c.m.position.z = c.base.z + (Math.random() - 0.5) * 0.015 * c.shiver; }
    }
  },
  // walk somewhere in a straight line
  walkTo(id, x, z, speed = 1.3, done) {
    const c = this.get(id), m = c.m;
    c.moving = true;
    animate(() => {
      const dx = x - m.position.x, dz = z - m.position.z, d = Math.hypot(dx, dz);
      if (d < 0.05 || !m.visible) { c.moving = false; if (done) done(); return false; }
      m.rotation.y = Math.atan2(dx, dz);
      const st = Math.min(d, speed / 60); m.position.x += dx / d * st; m.position.z += dz / d * st;
      return true;
    });
  },
};

/* ---------- face portraits for the message window ---------- */
function portrait(id) {
  const P = {
    hiroshi: { hair: '#e8e8ec', hairD: '#b8b8c4', top: '#18181c', glasses: true },
    takeshi: { hair: '#e6c46a', hairD: '#b8943a', top: '#f2f2ec' },
    takuro: { hair: '#c8482c', hairD: '#8a2a18', top: '#f2f2ec', pony: true },
    mika: { hair: '#7a4428', hairD: '#4a2414', top: '#1e2a52', bob: true },
  }[id];
  if (!P) return '';
  const pony = P.pony ? `<path d="M22 44 Q8 52 14 76 Q24 64 30 54Z" fill="${P.hairD}"/>` : '';
  const bob = P.bob ? `<path d="M18 40 Q14 70 26 82 L34 82 L32 46Z M78 40 Q82 70 70 82 L62 82 L64 46Z" fill="${P.hair}"/>` : '';
  const glasses = P.glasses ? `<g fill="none" stroke="#2a2a30" stroke-width="2.2"><rect x="30" y="50" width="15" height="10" rx="2"/><rect x="51" y="50" width="15" height="10" rx="2"/><path d="M45 54h6"/></g>` : '';
  return `<svg viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" fill="#0c0c10"/>${pony}
    <path d="M14 96 Q16 78 34 74 L62 74 Q80 78 82 96Z" fill="${P.top}"/><path d="M40 74 L48 86 L56 74Z" fill="${P.top === '#f2f2ec' ? '#dcdcd4' : '#c9c9d4'}"/>
    <rect x="41" y="64" width="14" height="12" fill="#e9c4a6"/>
    <ellipse cx="48" cy="50" rx="23" ry="26" fill="#f2d2b6"/>
    ${bob}
    <path d="M24 46 Q22 18 48 18 Q74 18 72 46 Q66 32 58 30 Q52 40 40 36 Q30 34 24 46Z" fill="${P.hair}"/>
    <path d="M30 30 Q40 22 52 26" stroke="${P.hairD}" stroke-width="2" fill="none"/>
    <ellipse cx="38" cy="55" rx="3.2" ry="4.2" fill="#2a1a12"/><ellipse cx="58" cy="55" rx="3.2" ry="4.2" fill="#2a1a12"/>
    <circle cx="39" cy="53.5" r="1" fill="#fff"/><circle cx="59" cy="53.5" r="1" fill="#fff"/>
    <path d="M43 66 Q48 68 53 66" stroke="#a0604a" stroke-width="1.6" fill="none"/>${glasses}</svg>`;
}
const FACE_OF = { 'ひろし': 'hiroshi', 'たけし': 'takeshi', 'たくろう': 'takuro', 'みか': 'mika' };

/* =========================================================================
   Story: what you carry, what has happened, the scenes, saving
   ========================================================================= */
const STORY = {
  inv: [], got: [], unlocked: [], flags: {}, busy: false,
  reset() { this.inv = []; this.got = []; this.unlocked = []; this.flags = {}; this.busy = false; },
  has(id) { return this.inv.includes(id); },
  hasGot(id) { return this.got.includes(id); },
  give(id) {
    if (!this.got.includes(id)) this.got.push(id);
    if (!this.inv.includes(id)) this.inv.push(id);
    UI.inv();
  },
  // something used from the item screen: on another thing you carry (the only things you put together by hand),
  // or on what you were facing when you opened it
  useItem(id, t) {
    if (STORY.useItem2 && STORY.useItem2(id, t)) return;   // the basement and the annexes
    const has = x => this.has(x), f = this.flags, ia = t && t.ia, tag = ia && ia.tag, door = ia && ia.ref;
    const say = l => GAME.say(l.map(x => (typeof x === 'string' ? ['', x] : x)));
    switch (id) {
      case 'soap': case 'hanky':
        if (id === 'hanky' && tag === 'piano' && !f.pianoClean) { say(['ハンカチでこすってみた。', '汚れが落ちない。']); return; }
        if (has('soap') && has('hanky')) { this.use('soap'); this.use('hanky'); this.give('hankySoap'); SFX.pickup(); say(['ハンカチに洗剤を染み込ませた。']); this.save(); return; }
        if (tag === 'piano' && !f.pianoClean) { say(['汚れが落ちない。']); return; }
        break;
      case 'hankySoap': if (tag === 'piano' && !f.pianoClean) { EVENTS.wipePiano(); return; } break;
      case 'oil': case 'lighter':
        if (has('oil') && has('lighter')) { this.use('oil'); f.oilUsed = true; SFX.lighter(); say(['ライターにオイルを補給した。', IS_TOUCH ? '（炎のボタンか、アイテム欄のライターで火をつけられる）' : '（F キー・右クリックか、アイテム欄のライターで火をつけられる）']); this.save(); return; }
        if (id === 'lighter') {
          if (!f.oilUsed) { say(['オイルが入っていない。']); return; }
          if (tag === 'candle' && MAN.candle.state !== 'on') { if (!GAME.lighterOn) GAME.toggleLighter(); EVENTS.lightCandle(); return; }
          GAME.toggleLighter(); return;
        }
        break;
      case 'driver': if (door && door.id === 'atticBack' && f.takuro && !this.hasGot('knob')) { EVENTS.knob(door); return; } break;
      case 'shard': if (door && door.kind === 'hidden' && !f.wallCut) { EVENTS.cutWall(); return; } break;
      case 'knob': if (door && door.kind === 'hidden' && f.wallCut && !f.knobOn) { EVENTS.fitKnob(); return; } break;
      default: if (door && door.lock === id) { GAME.useDoor(door); return; } break;
    }
    say(['ここでは使えない。']);
  },
  use(id) { this.inv = this.inv.filter(x => x !== id); UI.inv(); },
  unlock(id) { if (!this.unlocked.includes(id)) this.unlocked.push(id); },
  snapshot() {
    const h = PLAYER.hidden, p = h ? h.exitP : PLAYER.onChair && PLAYER.chairFrom ? PLAYER.chairFrom : PLAYER.pos;
    return { v: 2, inv: this.inv, got: this.got, unlocked: this.unlocked, flags: this.flags, pos: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +PLAYER.yaw.toFixed(2)], time: Math.round(GAME.time), caught: GAME.caughtN || 0, place: GAME.room ? GAME.room.name : '', date: Date.now() };
  },
  save() { store.set('save', this.snapshot()); },   // the autosave
  saveTo(k) { store.set(k, this.snapshot()); },
  event(name, ...a) { if (EVENTS[name]) EVENTS[name](...a); },
  // doors with something special about them
  doorHook(d) {
    const f = this.flags;
    void f; void d;
    return null;
  },
};
// a timeline that follows game time (so it stops while paused or reading)
GAME.timers = [];
GAME.later = (sec, fn) => GAME.timers.push({ at: GAME.time + sec, fn });
function runTimers() { for (const t of GAME.timers.slice()) if (GAME.time >= t.at) { GAME.timers.splice(GAME.timers.indexOf(t), 1); t.fn(); } }
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
// make the player look at a point (camera yaw/pitch)
function lookAtPoint(p, k = 1) {
  const e = camera.position, dx = p.x - e.x, dy = p.y - e.y, dz = p.z - e.z;
  PLAYER.yaw = lerp(PLAYER.yaw, Math.atan2(-dx, -dz), k); PLAYER.pitch = lerp(PLAYER.pitch, Math.atan2(dy, Math.hypot(dx, dz)), k);
}
const EVENTS = {
  plate() {
    const f = STORY.flags;
    f.plateLook = true;
    GAME.say([['', '皿が割れている。']], () => GAME.take('shard', null));
  },
  // as you go to the desk (the desk or its chair), the closet behind you rattles
  tkRattle() {
    const f = STORY.flags, h = MAN.tkCloset, t0 = GAME.time;
    f.tkRattle = true; SFX.creak(h.cam, 0.5); SFX.push(h.cam);
    animate(() => { if (GAME.time - t0 > 1.6) { h.doors.forEach(d => (d.rotation.z = 0)); return false; } const k = Math.sin(GAME.time * 45) * 0.012; h.doors.forEach(d => (d.rotation.z = k)); return true; });
    GAME.later(0.5, () => GAME.say([['', 'ガタッ'], ['', 'クローゼットから物音がした。']]));
  },
  tkDesk() {
    const f = STORY.flags;
    if (!f.tkRattle && !f.takeshiGone) { EVENTS.tkRattle(); return; }
    if (!chairAway(MAN.tkChair)) { GAME.say([['', 'イスがじゃまで、机の下が見えない。']]); return; }
    GAME.say([['', STORY.hasGot('k_library') ? '机だ。' : '机の下で、何かが光っている。']]);
  },
  // a chair: lift it, or climb on it
  chair(ch) {
    const f = STORY.flags;
    if (ch.key === 'tk' && !f.tkRattle && !f.takeshiGone) { EVENTS.tkRattle(); return; }
    UI.choice('イスがある。', ['持ち上げる', 'イスに乗る', 'やめる'], i => { if (i === 0) liftChair(ch); else if (i === 1) climbChair(ch); });
  },
  libraryKey() { GAME.take('k_library', MAN.props.k_library); },
  takeshiCloset() {
    const h = MAN.tkCloset, f = STORY.flags;
    STORY.busy = true; SFX.closet(h.cam, true);
    h.doors.forEach((d, i) => { d.rotation.y = d.userData.baseRy + (i === 0 ? -1.3 : 1.3); });
    const p = h.room.toWorld(h.F.x, 0, h.F.z), c = CAST.place('takeshi', p.x, p.y, p.z, h.F.ry); c.m.scale.setScalar(0.92); c.shiver = 1;
    const lines = !f.takeshiMet ? [
      ['たけし', 'う、うわああああ！！'], ['たけし', '……な、なんだ、ひろしかよ。おどかすなよ……。'], ['ひろし', 'たけし、こんなところで何してるんだ？'],
      ['たけし', 'み、見たんだよ……！　でっかい頭の、青い化け物……！'], ['ひろし', '化け物？　そんなの科学的にありえないよ。'],
      ['たけし', 'ほ、本当なんだって！　俺はここから一歩も出ないからな！'],
    ] : [['たけし', 'お、俺はここにいるからな……。早く出口を見つけてくれよ……。']];
    f.takeshiMet = true;
    GAME.say(lines, () => { c.shiver = 0; CAST.hide('takeshi'); h.doors.forEach(d => { d.rotation.y = d.userData.baseRy; }); SFX.closet(h.cam, false); STORY.busy = false; STORY.save(); });
  },
  greenBook() {
    const f = STORY.flags;
    if (!f.bookMoved) {
      f.bookMoved = true; const b = MAN.props.greenBook, x0 = b.position.x, t0 = performance.now();
      SFX.book(b.position.clone().setY(0.9));
      animate(() => { const k = Math.min(1, (performance.now() - t0) / 400); b.position.x = x0 - 0.35 * smoothstep(0, 1, k); return k < 1; });
      MAN.props.k_bedroom.visible = true;
      GAME.say([['', '本をどけた。']]);
      return;
    }
    GAME.take('k_bedroom', MAN.props.k_bedroom, () => EVENTS.libraryChase());
  },
  // the first time you go into the library it walks across the middle of the room and away behind the shelves
  // (it is already there as the screen comes back from black; you can't move, your eyes follow it)
  libraryGlimpse() {
    const r = MAN.areas.library, [a, ...rest] = r.oniGlimpse, at = r.glimpseAt;
    STORY.flags.glimpse = true; STORY.busy = true; PLAYER.frozen = true;
    PLAYER.pos.set(at.x, FLOORS.F1, at.z); PLAYER.camY = FLOORS.F1 + 1.58; PLAYER.yaw = Math.atan2(at.x - a[0], at.z - a[1]); PLAYER.pitch = 0.05;   // a few steps in, facing it
    ONI.spawn(a[0], FLOORS.F1, a[1], -Math.PI / 2, 'script');
    ONI.script = { i: 0, steps: [...rest.map(q => ({ t: 'go', p: new THREE.Vector3(q[0], FLOORS.F1, q[1]), sp: 3.2 })), { t: 'gone' }], done: null };
    ONI.script.steps[rest.length].fn = () => { PLAYER.frozen = false; STORY.busy = false; };
    const t0 = GAME.time;
    animate(() => {
      if (!ONI.on || ONI.state !== 'script' || GAME.time - t0 > 7) { if (PLAYER.frozen && !ONI.on) PLAYER.frozen = false; return false; }
      lookAtPoint(tmpV.copy(ONI.eye()).setY(ONI.eye().y - 0.4), 0.06); return true;
    });
  },
  libraryChase() {
    const r = MAN.areas.library, [x, z] = r.oniSpawn;
    STORY.flags.libChase = true;
    ONI.spawn(x, FLOORS.F1, z, yawTo({ x, z }, PLAYER.pos), 'appear'); ONI.appearFor = 1.3;
    SFX.oniSpot(); POST.shake = 0.35;
    DIRECTOR.start();
    STORY.save();
  },
  afterChase() {   // called when it is gone
    const f = STORY.flags;
    if (f.libChase && !f.libChaseDone) { f.libChaseDone = true; f.takeshiGone = true; MAN.props.hanky.visible = true; STORY.save(); }
    if (f.pianoChase && !f.pianoChaseDone) { f.pianoChaseDone = true; STORY.save(); }
    if (f.tatamiChase && !f.tatamiChaseDone) { f.tatamiChaseDone = true; STORY.save(); }
    if (f.kidsChase && !f.kidsChaseDone) { f.kidsChaseDone = true; STORY.save(); }
    if (f.jailScene && !f.jailDone) { f.jailDone = true; STORY.save(); }
    for (const k of CHASES) if (f[k] && !f[k + 'Done']) { f[k + 'Done'] = true; STORY.save(); }
  },
  hanky() { GAME.take('hanky', MAN.props.hanky); },
  tub() {
    const f = STORY.flags;
    if (!f.tubDrained) {   // the plug is pulled once you have read it: then you watch the water go down
      f.tubDrained = true; STORY.save();
      GAME.say([['', '濁った水がたまっていて、底が見えない。'], ['', '浴槽の栓を抜いた。']], () => drainTub());
      return;
    }
    if (MAN.tub.draining) return;
    GAME.take('driver', MAN.props.driver);
  },
  soap() { GAME.take('soap', MAN.props.soap); },
  takuroScene() {
    const d = MAN.doors.attic, f = STORY.flags;
    f.takuro = true; STORY.busy = true;
    GAME.later(1.2, () => {
      animateDoor(d, 1.1, 900); SFX.door(d.center, 1.0);
      const c = CAST.place('takuro', d.front.x, d.front.y, d.front.z, yawTo(d.front, PLAYER.pos));
      const into = new THREE.Vector3(-Math.sin(d.yawIn), 0, -Math.cos(d.yawIn));
      CAST.walkTo('takuro', d.front.x + into.x * 1.4, d.front.z + into.z * 1.4, 1.2, () => {
        c.m.rotation.y = yawTo(c.m.position, PLAYER.pos);
        GAME.say([
          ['たくろう', '……なんだ、ひろしか。'], ['ひろし', 'たくろう！　無事だったんだね。'], ['たくろう', 'みかを見なかったか？　はぐれちまってさ。'],
          ['ひろし', 'ううん……。たくろう、この家、何かいるよ。'], ['たくろう', '……ああ、知ってる。'], ['たくろう', '俺はみかを探す。お前も気をつけろよ。'],
        ], () => {
          CAST.walkTo('takuro', d.front.x, d.front.z, 1.4, () => { animateDoor(d, 1.1, 700); SFX.door(d.center, 0.9); setTimeout(() => SFX.doorShut(d.center), 500); CAST.hide('takuro'); STORY.busy = false; STORY.save(); });
        });
      });
    });
  },
  knob(d) {
    d = d || MAN.doors.atticBack; d.knobs.forEach(k => (k.visible = false));
    SFX.unlock(d.center);
    GAME.say([['', '＋ドライバーで、扉のドアノブを外した。']], () => GAME.take('knob', null));
  },
  pushBed() {
    const b = MAN.leftBed; if (b.at) return;
    b.at = 1; STORY.flags.bedPushed = true; b.slide(b.g.position.x - T, b.g.position.z, 900);
    GAME.later(1.0, () => { MAN.hole.visible = true; GAME.say([['', 'ベッドを押した。']]); });
  },
  fall() {
    if (GAME.busy) return;
    GAME.busy = 1; SFX.fall(); STORY.flags.fell = true;
    const r = MAN.areas.piano, L = r.landing;
    GAME.fade(0.5, () => {
      PLAYER.pos.set(L.x, FLOORS.F2, L.z); PLAYER.camY = FLOORS.F2 + 1.0; PLAYER.yaw = L.yaw; PLAYER.pitch = -0.2; POST.shake = 0.6;
      GAME.room = r; GAME.onEnterRoom(r);
    }, () => { GAME.busy = 0; STORY.save(); });
  },
  pianoShelf() {
    const sh = MAN.pianoShelf; if (sh.at) return;
    sh.at = 1; STORY.flags.pianoShelf = true; sh.slide(sh.g.position.x - 1.75, sh.g.position.z, 800);
    GAME.later(0.9, () => GAME.say([['', '棚を動かした。'], ['', '壁に金庫が埋めこまれている。']]));
  },
  // the keys, close up: the C, D and E of the middle octave carry the numbers (or the stain over them)
  piano() {
    if (!STORY.flags.pianoClean) { UI.pianoKeys(null, true); return; }
    UI.pianoKeys();
  },
  // wiped with the soapy handkerchief: numbers under the stain, and as you look up from them it is right behind you
  wipePiano() {
    const f = STORY.flags;
    f.pianoClean = true; MAN.pianoStain.visible = false; STORY.use('hankySoap'); STORY.save();
    GAME.say([['', '洗剤をつけたハンカチで、鍵盤の汚れを拭き取った。']], () => UI.pianoKeys(() => EVENTS.pianoChase(), false, 3.2));
  },
  pianoChase() {
    STORY.flags.pianoChase = true; STORY.flags.pianoUnlocked = true; STORY.save();
    const back = new THREE.Vector3(Math.sin(PLAYER.yaw), 0, Math.cos(PLAYER.yaw)).multiplyScalar(2.6).add(PLAYER.pos), c = cellOf(back);
    const at = c && c.area.id === 'piano' && !c.blocked ? back : MAN.doors.piano.front;
    GAME.later(0.5, () => { ONI.spawn(at.x, FLOORS.F2, at.z, yawTo(at, PLAYER.pos), 'appear'); ONI.appearFor = 1.1; SFX.oniSpot(); POST.shake = 0.35; });
  },
  safeOpened() {
    STORY.flags.safeOpen = true; SFX.unlock(MAN.safe.position.clone().setY(FLOORS.F2 + 0.4));
    GAME.take('k_kids', null);
  },
  mika() {
    const f = STORY.flags;
    GAME.say(!f.mikaMet ? [['みか', '……ひろしくん？'], ['ひろし', 'みか！　ここにいたのか。'], ['みか', 'たくろうとはぐれちゃって……。この家、なにか変だよ……。'], ['ひろし', 'たくろうもみかを探してたよ。'], ['みか', '……私、ここで待ってる。もう、こわくて動けないの……。']]
      : [['みか', '……たくろう、まだかな……。']]);
    f.mikaMet = true; STORY.save();
  },
  // the oil on top of the tall shelf: only from the chair, set down right in front of it
  kidsShelf() {
    const ch = MAN.kidsChair, o = MAN.props.oil;
    if (PLAYER.onChair !== ch || Math.hypot(ch.g.position.x - o.position.x, ch.g.position.z - o.position.z) > 1.5) { GAME.say([['', '棚の上で、何かが光っている。'], ['', '手が届かない。']]); return; }
    GAME.take('oil', o);
  },
  fusumaL() {
    const f = STORY.flags;
    if (!f.tatamiChase) { EVENTS.tatamiChase(); return; }
    if (STORY.hasGot('lighter')) return;
    openFusuma(0, 1);
    GAME.take('lighter', null, () => GAME.later(0.6, () => closeFusuma(0, 1)));
  },
  fusumaR() {
    if (!STORY.flags.tatamiChase) { EVENTS.tatamiChase(); return; }
    GAME.say([['', '押入れの中は空っぽだ。']]);
  },
  // the moment you step onto the tatami, the right-hand fusuma slide open and it is there
  tatamiChase() {
    STORY.flags.tatamiChase = true; STORY.save();
    openFusuma(2, 3);
    const p = MAN.fusuma[2].userData.home.clone().lerp(MAN.fusuma[3].userData.home, 0.5);
    ONI.spawn(p.x, FLOORS.F1, p.z + 0.5, 0, 'appear'); ONI.appearFor = 0.8; SFX.oniSpot(); POST.shake = 0.4;
    GAME.later(2.5, () => closeFusuma(2, 3));
  },
  // the wall, the knobless door, the candle: looking only tells you what is there; the things you carry are used from the item screen
  greyWall() {
    const f = STORY.flags, d = MAN.doors.corT_hid;
    if (!f.wallCut) { GAME.say([['', 'ここだけ、壁紙の色が少しちがう。']]); return; }
    if (!f.knobOn) { GAME.say([['', 'ドアノブがついていない。']]); return; }
    GAME.goThrough(d);
  },
  cutWall() {
    const f = STORY.flags, d = MAN.doors.corT_hid;
    f.wallCut = true; showHiddenDoor(d, false); SFX.paper();
    GAME.say([['', '皿の破片で、壁紙を切りさいた。'], ['', '扉が出てきた。ドアノブがついていない。']]); STORY.save();
  },
  fitKnob() {
    const f = STORY.flags, d = MAN.doors.corT_hid;
    f.knobOn = true; STORY.use('knob'); showHiddenDoor(d, true); SFX.unlock(d.center);
    GAME.say([['', 'ドアノブを取りつけた。']]); STORY.save();
  },
  candle() {
    if (MAN.candle.state === 'on') return;
    if (!GAME.lighterOn) { GAME.say([['', 'ろうそくがある。']]); return; }
    EVENTS.lightCandle();
  },
  lightCandle() {
    candleUp(); STORY.flags.candle = true; SFX.lighter(); POST.flash = 0.45;   // it catches with a whoosh and the whole room is lit
    if (AU.ok) AU.burst({ pos: MAN.candle.pos, dur: 0.5, a: 0.02, f: 700, q: 0.5, type: 'lowpass', vol: 0.5, brown: true, rev: 0.4 });
    GAME.say([['', 'ろうそくに火をつけた。'], ['', '部屋全体が明るく照らされた。']]); STORY.save();
  },
  jailShelf() {
    if (MAN.candle.state !== 'on' && !GAME.lighterOn) { GAME.say([['', '暗くてよく見えない。']]); return; }
    const s = MAN.jailShelf; if (s.at) return;
    s.at = 1; STORY.flags.jailShelf = true; s.slide(s.g.position.x + tm(2), s.g.position.z, 1000);
    GAME.later(1.1, () => GAME.say([['', '本棚を動かした。']]));
  },
  basementKey() {
    MAN.props.k_basement.visible = false;
    GAME.take('k_basement', null, () => EVENTS.jailScene());
  },
  jailScene() {
    STORY.flags.jailScene = true; STORY.save();
    GAME.later(1.6, () => {
      SFX.oniStep(MAN.doors.jail.front, 0.9);
      ONI.enterVia(MAN.doors.jail, 1.4, 'bars'); ONI.sub = 0; ONI.wait = 0;
      GAME.later(1.5, () => { if (ONI.on && ONI.state === 'bars') { ONI.sub = 0; ONI.wait = 0; } });
    });
  },
  // as the basement door comes open, a scream from upstairs
  basementUnlocked() {
    STORY.flags.basementOpen = true; STORY.save();
    SFX.scream2(); POST.shake = 0.35;
    GAME.later(0.9, () => { GAME.busy = 0; GAME.say([['', '２階から悲鳴が聞こえた。']]); });
  },
  // in the kids' room it is crouched over her, eating. It looks up at you, and comes
  kidsChase() {
    const f = STORY.flags, r = MAN.areas.kids, m = r.mikaDown, o = r.oniEat;
    f.kidsChase = true; STORY.save();
    CAST.lie('mika', m.x, FLOORS.F2, m.z, m.yaw); MAN.blood.visible = true;
    ONI.spawn(o.x, FLOORS.F2, o.z, yawTo(o, m), 'script'); ONI.bend = ONI.bendT = 1;
    PLAYER.frozen = true; STORY.busy = true;
    ONI.script = { i: 0, steps: [{ t: 'eat', d: 3.4 }, { t: 'face', toPlayer: true, bend: 0.25, turn: 1.6, d: 1.3 }, { t: 'call', fn: () => {
      ONI.state = 'appear'; ONI.wait = 0; ONI.appearFor = 0.6; ONI.bendT = 0; SFX.oniSpot(); POST.shake = 0.4;
      PLAYER.frozen = false; STORY.busy = false;
    } }] };
    const t0 = GAME.time;
    animate(() => { if (!PLAYER.frozen || GAME.time - t0 > 9) return false; lookAtPoint(tmpV.copy(ONI.pos).setY(ONI.pos.y + 1.3), 0.07); return true; });
  },
  downstairs() {
    if (!STORY.flags.basementOpen) return;   // (the scream has not come yet)
    if (!STORY.flags.kidsChaseDone) { GAME.say([['', '先に、悲鳴の聞こえた子供部屋へ行こう。']]); return; }
    GAME.goThrough(MAN.doors.corC_base);
  },
};
/* ---------- chairs: lift one, put it down where you point, climb on it to reach high places ---------- */
const CHAIRS = { held: null, from: null, ring: null };
function chairInteract(ch, key) {
  ch.key = key; ch.home = { x: ch.g.position.x, z: ch.g.position.z, r: ch.r }; MAN.chairs.push(ch);
  ch.r.addInteract(ch.g, { dist: 2.4, icon: 'hand', prompt: () => (CHAIRS.held || PLAYER.onChair ? null : 'イスを調べる'), use: () => EVENTS.chair(ch) });
}
const chairAway = ch => !!ch && (ch.r !== ch.home.r || Math.hypot(ch.g.position.x - ch.home.x, ch.g.position.z - ch.home.z) > 0.6);
// as in the original, a room is as it was when you come back to it: a chair left somewhere else goes back to its place
function chairsBack(r) {
  const f = STORY.flags;
  for (const ch of MAN.chairs) {
    if (ch === CHAIRS.held || ch === PLAYER.onChair || r.joined.has(ch.r) || !chairAway(ch)) continue;
    ch.moveTo(ch.home.r); ch.place(ch.home.x, ch.home.z); ch.g.visible = true; ch.col.on = true;
    if (f.chairs) delete f.chairs[ch.key];
    if (ch.key === 'tk' && MAN.props.k_library) MAN.props.k_library.visible = false;
  }
}
function liftChair(ch) {
  CHAIRS.held = ch; CHAIRS.from = { x: ch.g.position.x, z: ch.g.position.z, r: ch.r };
  ch.g.visible = false; ch.col.on = false; SFX.push(ch.g.position.clone().setY(ch.r.y + 0.4)); VIEW.holdChair(ch);
  UI.hint(IS_TOUCH ? 'イスを置きたい場所をタップ' : 'イスを置きたい床をクリック（E でも置ける）', 3200);
}
// the floor spot you point at, if the held chair can go there: near you, on this room's floor, clear of walls and furniture
function chairSpot(ndc) {
  const ch = CHAIRS.held; if (!ch) return null;
  raycaster.setFromCamera(ndc || _center, camera);
  const o = raycaster.ray.origin, d = raycaster.ray.direction, fy = ch.r.y;
  if (d.y > -0.05) return null;
  const p = o.clone().addScaledVector(d, (fy - o.y) / d.y), dist = Math.hypot(p.x - PLAYER.pos.x, p.z - PLAYER.pos.z);
  if (dist > 3.6 || dist < 0.55) return null;
  const c = cellOf(p); if (!c || c.stair || c.area !== ch.r) return null;
  for (const col of WORLD.colliders(p, 0.6)) {
    if (col.wy1 < fy + 0.15 || col.wy0 > fy + 1.0) continue;
    const qx = clamp(p.x, col.x0, col.x1), qz = clamp(p.z, col.z0, col.z1);
    if (Math.hypot(p.x - qx, p.z - qz) < 0.3) return null;
  }
  return p;
}
function placeChair(ndc) {
  const ch = CHAIRS.held, p = chairSpot(ndc);
  if (!p) { UI.hint('そこには置けない', 1500); return; }
  putChair(ch, p.x, p.z); SFX.push(p.clone().setY(p.y + 0.4)); STORY.save();
}
function putChair(ch, x, z) {
  ch.place(x, z); ch.g.visible = true; ch.col.on = true; CHAIRS.held = null; VIEW.chair.visible = false;
  const f = STORY.flags; f.chairs = f.chairs || {}; f.chairs[ch.key] = [+x.toFixed(2), +z.toFixed(2), ch.r.id];
  if (ch.key === 'tk' && MAN.props.k_library) MAN.props.k_library.visible = chairAway(ch) && !STORY.hasGot('k_library');
}
// being caught with it (or hiding): it goes back where it was
function dropChair() { const ch = CHAIRS.held; if (ch) { ch.moveTo(CHAIRS.from.r); putChair(ch, CHAIRS.from.x, CHAIRS.from.z); } }
function climbChair(ch) {
  PLAYER.onChair = ch; PLAYER.chairFrom = PLAYER.pos.clone();
  PLAYER.pos.set(ch.g.position.x, ch.r.y + 0.47, ch.g.position.z); PLAYER.vel.set(0, 0, 0); SFX.step('wood', 0.3);
  UI.hint(IS_TOUCH ? '降りるときは、移動するか手のボタン' : '降りるときは、移動するか E', 2600);
}
function stepDown() {
  const ch = PLAYER.onChair; if (!ch) return;
  PLAYER.onChair = null;
  const f = PLAYER.chairFrom, dir = new THREE.Vector3(f ? f.x - ch.g.position.x : Math.sin(PLAYER.yaw), 0, f ? f.z - ch.g.position.z : Math.cos(PLAYER.yaw));
  if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
  dir.normalize();
  const p = new THREE.Vector3(ch.g.position.x + dir.x * 0.8, ch.r.y, ch.g.position.z + dir.z * 0.8);
  WORLD.collide(p, PLAYER.radius, ch.r.y, PLAYER.height);
  PLAYER.pos.copy(p); SFX.step('wood', 0.25);
}
// while you carry one: a ring on the floor where it would go
function chairAim() {
  if (!CHAIRS.ring) { CHAIRS.ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 28), new THREE.MeshBasicMaterial({ color: 0x9fffa8, transparent: true, opacity: 0.8, depthWrite: false })); CHAIRS.ring.rotation.x = -Math.PI / 2; scene.add(CHAIRS.ring); }
  const p = CHAIRS.held && !GAME.modal ? chairSpot() : null;
  CHAIRS.ring.visible = !!p; if (p) CHAIRS.ring.position.set(p.x, p.y + 0.02, p.z);
}

/* ---------- something heavy you push along in front of you (the statue) ---------- */
const PUSH = { obj: null, t: 0 };
const CHASES = [];   // the later scripted chases (their flag gets a ...Done when it is over)
const BUILT_HOOKS = [];   // run once the house is built, on every start
// a dark room stays dark until its own light (a candle) burns
function roomDark(r) { return !!r && r.dark && !(r.lightFx && r.lightFx.state === 'on'); }
const ROOM_HOOKS = [], STATE_HOOKS = [], TICK_HOOKS = [];
function startPush(m) { PUSH.obj = m; m.col.on = false; UI.hint(IS_TOUCH ? '押して運ぶ（手のボタンで手を離す）' : '押して運ぶ（E で手を離す）', 3000); SFX.push(m.g.position.clone().setY(m.r.y + 0.5)); }
function stopPush() {
  const m = PUSH.obj; if (!m) return;
  PUSH.obj = null; m.place(m.g.position.x, m.g.position.z); m.col.on = true;
  const f = STORY.flags; f.pushed = f.pushed || {}; f.pushed[m.key] = [+m.g.position.x.toFixed(2), +m.g.position.z.toFixed(2), m.r.id];
}
const pushAt = (p, yaw, k = 1.05) => tmpV2.set(p.x - Math.sin(yaw) * k, p.y, p.z - Math.cos(yaw) * k);
// is there room for it where you are about to walk it?
function pushRoom(np, yaw) {
  const q = pushAt(np, yaw), a = q.clone();
  WORLD.collide(q, 0.36, np.y, 1.6);
  return Math.hypot(q.x - a.x, q.z - a.z) < 0.02 && WORLD.groundAt(a.x, a.z, np.y + 0.5) !== null;
}
function pushFollow(dt) {
  const m = PUSH.obj; if (!m) return;
  const q = pushAt(PLAYER.pos, PLAYER.yaw);
  m.g.position.x = q.x; m.g.position.z = q.z; m.g.position.y = 0; m.g.rotation.y = PLAYER.yaw;
  if (PLAYER.speed > 0.3 && (PUSH.t += dt) > 0.7) { PUSH.t = 0; SFX.push(q.clone().setY(PLAYER.pos.y + 0.4)); }
}

// the hidden room's candle: once it burns it lights every corner of the room
function candleUp() { const c = MAN.candle; c.state = 'on'; c.intensity = 14; c.range = 24; }
function openFusuma(a, b) { [a, b].forEach((i, k) => { const p = MAN.fusuma[i], t0 = performance.now(), dx = (k === 0 ? -1 : 1) * 0.9; animate(() => { const u = Math.min(1, (performance.now() - t0) / 350); p.position.x = p.userData.home.x + dx * u; return u < 1; }); }); SFX.slide && SFX.slide(MAN.fusuma[a].position.clone()); }
function closeFusuma(a, b) { [a, b].forEach(i => { const p = MAN.fusuma[i], x0 = p.position.x, t0 = performance.now(); animate(() => { const u = Math.min(1, (performance.now() - t0) / 350); p.position.x = lerp(x0, p.userData.home.x, u); return u < 1; }); }); }
function showHiddenDoor(d, knob) { d.leaf.material = AOM.door; d.trims.visible = true; d.panels.forEach(p => (p.visible = true)); d.knobs.forEach(k => (k.visible = knob)); if (MAN.greyCover && d.id === 'corT_hid') MAN.greyCover.visible = false; }
SFX.slide = pos => { if (!AU.ok) return; AU.burst({ pos, dur: 0.35, a: 0.03, f: 1400, q: 0.6, vol: 0.25, rev: 0.25 }); AU.burst({ pos, t0: AU.t + 0.33, dur: 0.05, f: 500, q: 1, vol: 0.3 }); };

/* =========================================================================
   UI
   ========================================================================= */
const ITEM_SVG = {
  key: c => `<svg viewBox="0 0 40 40"><circle cx="12" cy="20" r="7" fill="none" stroke="${c}" stroke-width="4"/><path d="M19 20h17M30 20v6M35 20v5" stroke="${c}" stroke-width="4" stroke-linecap="round"/></svg>`,
  shard: () => '<svg viewBox="0 0 40 40"><path d="M8 28 L20 8 L32 18 L26 32Z" fill="#eeeae0" stroke="#9a968c" stroke-width="2"/></svg>',
  cloth: () => '<svg viewBox="0 0 40 40"><path d="M8 10 L32 8 L30 32 L10 30Z" fill="#f4f4f0" stroke="#b8b8b0" stroke-width="2"/><path d="M12 14h14M12 20h12" stroke="#c8c8c0" stroke-width="1.5"/></svg>',
  clothSoap: () => '<svg viewBox="0 0 40 40"><path d="M8 10 L32 8 L30 32 L10 30Z" fill="#dff0ff" stroke="#8ab8e0" stroke-width="2"/><path d="M12 22 Q20 14 28 22 Q20 30 12 22Z" fill="#7cc0f0" opacity=".7"/><circle cx="26" cy="13" r="2.5" fill="#fff"/><circle cx="14" cy="27" r="2" fill="#fff"/></svg>',
  driver: () => '<svg viewBox="0 0 40 40"><rect x="6" y="16" width="12" height="8" rx="3" fill="#d23a2a"/><path d="M18 20h16" stroke="#b8bcc4" stroke-width="3"/><path d="M33 17v6M30 20h6" stroke="#b8bcc4" stroke-width="2"/></svg>',
  soap: () => '<svg viewBox="0 0 40 40"><rect x="13" y="12" width="14" height="22" rx="4" fill="#3fa0e0"/><rect x="16" y="6" width="8" height="7" fill="#eee"/></svg>',
  knob: () => '<svg viewBox="0 0 40 40"><circle cx="20" cy="18" r="9" fill="#d8b84a"/><rect x="17" y="26" width="6" height="8" fill="#a88a2a"/></svg>',
  oil: () => '<svg viewBox="0 0 40 40"><rect x="12" y="12" width="16" height="22" rx="2" fill="#d8b030"/><rect x="17" y="6" width="6" height="7" fill="#888"/></svg>',
  lighter: () => ICONS.lighter,
  bit: () => '<svg viewBox="0 0 40 40"><path d="M12 20h20" stroke="#b8bcc4" stroke-width="4"/><path d="M30 15v10" stroke="#b8bcc4" stroke-width="3"/><rect x="6" y="17" width="7" height="6" fill="#888"/></svg>',
  driverM: () => '<svg viewBox="0 0 40 40"><rect x="6" y="16" width="12" height="8" rx="3" fill="#2a6ad2"/><path d="M18 20h16" stroke="#b8bcc4" stroke-width="3"/><path d="M33 17v6" stroke="#b8bcc4" stroke-width="2"/></svg>',
  doll: () => '<svg viewBox="0 0 40 40"><path d="M12 36 L28 36 L20 18Z" fill="#8a1c2a"/><circle cx="20" cy="13" r="7" fill="#f0dcc8"/><path d="M13 12 Q20 2 27 12" fill="#2a1a12"/><circle cx="17.5" cy="14" r="1.2"/><circle cx="22.5" cy="14" r="1.2"/></svg>',
  dollHead: () => '<svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="11" fill="#f0dcc8"/><path d="M9 20 Q20 4 31 20" fill="#2a1a12"/><circle cx="16" cy="23" r="2.3" fill="#d02020"/><circle cx="24" cy="23" r="2.3" fill="#2040d0"/></svg>',
  bulb: () => '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="16" rx="9" ry="11" fill="#fff4c0" stroke="#c8b060" stroke-width="2"/><rect x="15" y="26" width="10" height="8" fill="#a88a3a"/></svg>',
  stoneR: () => '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="21" rx="10" ry="8" fill="#d02020"/><ellipse cx="17" cy="18" rx="3" ry="2" fill="#ff9a9a"/></svg>',
  stoneB: () => '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="21" rx="10" ry="8" fill="#2040d0"/><ellipse cx="17" cy="18" rx="3" ry="2" fill="#9ab0ff"/></svg>',
  book: () => '<svg viewBox="0 0 40 40"><rect x="9" y="7" width="22" height="27" rx="2" fill="#c84a3a"/><rect x="12" y="11" width="16" height="8" fill="#f0e0b0"/></svg>',
  bookmark: () => '<svg viewBox="0 0 40 40"><rect x="13" y="5" width="14" height="30" fill="#efe6d0" stroke="#999" stroke-width="1.5"/><rect x="14" y="7" width="12" height="6" fill="#d02020" opacity=".6"/><rect x="14" y="14" width="12" height="6" fill="#2040d0" opacity=".6"/><rect x="14" y="21" width="12" height="6" fill="#20a040" opacity=".6"/><rect x="14" y="28" width="12" height="5" fill="#e8c818" opacity=".6"/></svg>',
  disc: () => '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#e8c818"/><path d="M20 20 L20 6 A14 14 0 0 1 32 13Z" fill="#d02020"/><path d="M20 20 L32 27 A14 14 0 0 1 20 34Z" fill="#2040d0"/><circle cx="20" cy="20" r="6" fill="#d8d2c0"/></svg>',
  vinegar: () => '<svg viewBox="0 0 40 40"><rect x="13" y="12" width="14" height="23" rx="3" fill="#c8b070" opacity=".85"/><rect x="16" y="5" width="8" height="8" fill="#5a3a20"/></svg>',
  rod: () => '<svg viewBox="0 0 40 40"><path d="M8 32 L32 8" stroke="#b8bcc4" stroke-width="5" stroke-linecap="round"/></svg>',
  dice: () => '<svg viewBox="0 0 40 40"><rect x="8" y="8" width="24" height="24" rx="4" fill="#f4f0e6" stroke="#888" stroke-width="1.5"/><circle cx="14" cy="14" r="2.3" fill="#111"/><circle cx="20" cy="20" r="2.3" fill="#111"/><circle cx="26" cy="26" r="2.3" fill="#111"/></svg>',
  stick: () => '<svg viewBox="0 0 40 40"><path d="M6 34 L34 6" stroke="#8a6a3a" stroke-width="4" stroke-linecap="round"/></svg>',
  ladder: () => '<svg viewBox="0 0 40 40"><path d="M13 4 L13 36 M27 4 L27 36" stroke="#8a7a5a" stroke-width="2.5"/><path d="M13 10h14M13 17h14M13 24h14M13 31h14" stroke="#a88a5a" stroke-width="3"/></svg>',
  piece: () => '<svg viewBox="0 0 40 40"><path d="M9 11h8a4 4 0 1 1 6 0h8v8a4 4 0 1 1 0 6v8H9Z" fill="#2a50b0" stroke="#9ab0ff" stroke-width="1.5"/></svg>',
};
const UI = {
  show(id, on = true) { $(id).classList.toggle('hidden', !on); },
  hint(text, ms = 2600) { const h = $('hint'); h.textContent = text; h.classList.add('on'); clearTimeout(h._t); h._t = setTimeout(() => h.classList.remove('on'), ms); },
  place(name) { const p = $('place'); p.textContent = name; p.style.transition = 'opacity .3s'; p.style.opacity = 1; clearTimeout(p._t); p._t = setTimeout(() => { p.style.transition = 'opacity 1.4s'; p.style.opacity = 0; }, 2000); },
  // the button that opens the item screen (what you carry is only shown there, as in the original)
  inv() {
    $('tItems').innerHTML = `<svg viewBox="0 0 40 40"><path d="M9 14h22l-2 20H11Z" fill="#c9a26a" stroke="#f0e2c4" stroke-width="2"/><path d="M15 14q0-7 5-7t5 7" fill="none" stroke="#f0e2c4" stroke-width="2.5"/></svg>アイテム<small>(I)</small>`;
    if (GAME.modal && GAME.modal.items) UI.drawItems();
  },
  itemName(id) { return id === 'lighter' && GAME.lighterOn ? 'ライター（使用中）' : ITEMS[id].name; },
  itemDesc(id) { return id === 'lighter' && STORY.flags.oilUsed ? 'オイルの入ったライター。火をつけると、暗い所を照らせる。' : ITEMS[id].desc; },
  items() {
    if (GAME.state !== 'play' || GAME.modal || GAME.cine || GAME.busy || !PLAYER.alive || PLAYER.hidden) return;
    GAME.itemTarget = TARGET; GAME.modal = { items: true };
    UI._isel = clamp(UI._isel || 0, 0, Math.max(0, UI.itemRows().length - 1));
    releaseLock();
    UI.show('items'); UI.drawItems(); SFX.click && SFX.click();
  },
  // what you carry, things of the same name together (the three blue pieces are one row, "×3")
  itemRows() {
    const rows = [];
    for (const id of STORY.inv) { const nm = UI.itemName(id), r = rows.find(x => x.nm === nm); if (r) r.n++; else rows.push({ id, nm, n: 1 }); }
    return rows;
  },
  drawItems() {
    const list = $('iList'), rows = UI.itemRows(); list.innerHTML = '';
    if (!rows.length) list.innerHTML = '<div class="iempty">何も持っていない。</div>';
    rows.forEach((row, i) => {
      const d = ITEMS[row.id], b = document.createElement('button'); b.className = 'irow' + (i === UI._isel ? ' sel' : '');
      b.innerHTML = (ITEM_SVG[d.icon] ? ITEM_SVG[d.icon](d.color || '#e7c264') : '') + `<span class="nm">${row.nm}</span><span class="ct">:  ${row.n}</span>`;
      b.onclick = () => { if (UI._isel === i) UI.useItem(); else { UI._isel = i; UI.drawItems(); } };   // tap to choose, tap again to use
      list.appendChild(b);
    });
    const row = rows[UI._isel];
    $('iHelp').textContent = row ? UI.itemDesc(row.id) : ''; $('iUse').disabled = !row;
  },
  closeItems() { UI.show('items', false); if (GAME.modal && GAME.modal.items) GAME.modal = null; if (!IS_TOUCH && GAME.state === 'play' && PLAYER.alive) requestLock(); },
  useItem() { const row = UI.itemRows()[UI._isel]; if (!row) return; UI.closeItems(); STORY.useItem(row.id, GAME.itemTarget); },
  itemKey(e) {
    const n = UI.itemRows().length, k = e.code;
    if (/^(Escape|KeyX|KeyI|Tab|Backspace)$/.test(k)) { UI.closeItems(); return; }
    if (/^(Enter|NumpadEnter|Space|KeyE|KeyZ)$/.test(k)) { if (!e.repeat) UI.useItem(); return; }
    const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -2, ArrowDown: 2, KeyA: -1, KeyD: 1, KeyW: -2, KeyS: 2 }[k];
    if (d && n) { UI._isel = clamp(UI._isel + d, 0, n - 1); UI.drawItems(); }
  },
  /* the message window, after the original's: a black box with a white frame, the name above it, the face on the left */
  message(lines, done) {
    const M = UI._msg = { lines, i: -1, done, shown: 0, full: '', t0: 0 };
    GAME.modal = { msg: true };
    UI.show('msg'); UI.msgNext();
    animate(() => {
      if (UI._msg !== M) return false;
      if (M.shown < M.full.length) { M.shown = Math.min(M.full.length, Math.floor((performance.now() - M.t0) / 1000 * 36)); $('msgText').textContent = M.full.slice(0, M.shown); $('msgNext').style.visibility = M.shown >= M.full.length ? 'visible' : 'hidden'; }
      return true;
    });
  },
  msgNext() {
    const M = UI._msg; if (!M) return;
    if (M.i >= 0 && M.shown < M.full.length) { M.shown = M.full.length; $('msgText').textContent = M.full; $('msgNext').style.visibility = 'visible'; return; }
    M.i++;
    if (M.i >= M.lines.length) {
      UI._msg = null; UI.show('msg', false);
      if (GAME.modal && GAME.modal.msg) GAME.modal = null;
      if (M.done) M.done();
      return;
    }
    const [name, text] = M.lines[M.i], face = FACE_OF[name];
    $('msgName').textContent = name; $('msgFace').innerHTML = face ? portrait(face) : ''; $('msgBox').classList.toggle('face', !!face);
    M.full = text; M.shown = 0; M.t0 = performance.now(); $('msgText').textContent = ''; $('msgNext').style.visibility = 'hidden';
    if (AU.ok) AU.burst({ dur: 0.02, f: 3200, q: 2, vol: 0.06, rev: 0 });
  },
  // a question in the message window, with its answers to pick from (the last one is always 'やめる')
  choice(text, opts, done) {
    UI._msg = null; UI._choice = { opts, sel: 0, done };
    GAME.modal = { msg: true, choice: true };
    releaseLock();
    UI.show('msg'); $('msgName').textContent = ''; $('msgFace').innerHTML = ''; $('msgBox').classList.remove('face');
    $('msgText').textContent = text; $('msgNext').style.visibility = 'hidden';
    UI.drawChoice();
  },
  drawChoice() {
    const C = UI._choice, box = $('msgChs'); box.innerHTML = '';
    C.opts.forEach((o, i) => { const b = document.createElement('button'); b.className = i === C.sel ? 'sel' : ''; b.textContent = o; b.onclick = e => { e.stopPropagation(); UI.pick(i); }; box.appendChild(b); });
  },
  pick(i) {
    const C = UI._choice; if (!C) return;
    UI._choice = null; $('msgChs').innerHTML = ''; UI.show('msg', false);
    if (GAME.modal && GAME.modal.choice) GAME.modal = null;
    if (!IS_TOUCH && GAME.state === 'play' && PLAYER.alive) requestLock();
    if (C.done) C.done(i);
  },
  choiceKey(e) {
    const C = UI._choice, k = e.code; if (!C) return;
    if (/^(Escape|KeyX|Backspace)$/.test(k)) { UI.pick(C.opts.length - 1); return; }
    if (/^(Enter|NumpadEnter|Space|KeyE|KeyZ)$/.test(k)) { if (!e.repeat) UI.pick(C.sel); return; }
    const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1, KeyA: -1, KeyD: 1, KeyW: -1, KeyS: 1 }[k];
    if (d) { C.sel = (C.sel + d + C.opts.length) % C.opts.length; UI.drawChoice(); }
  },
  closeModal() { $('modal').classList.add('hidden'); $('modal').innerHTML = ''; const m = GAME.modal; GAME.modal = null; if (m && m.onClose) m.onClose(); if (!IS_TOUCH && GAME.state === 'play' && PLAYER.alive) requestLock(); },
  openModal(html, opts = {}) {
    const m = $('modal'); m.innerHTML = html; m.classList.remove('hidden');
    GAME.modal = opts;
    releaseLock();
    m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => UI.closeModal()));
    m.onclick = e => { if (e.target === m) UI.closeModal(); };   // a tap on the dark around it closes it
    return m;
  },
  // the cleaned keys: the numbers in red
  pianoKeys(done, stained = false, autoClose = 0) {
    const dg = STORY.flags.code.piano, keys = Array.from({ length: 14 }, (_, i) => `<div class="pk">${!stained && i >= 7 && i < 10 ? `<b>${dg[i - 7]}</b>` : ''}</div>`).join('');
    const m = UI.openModal(`<div class="pkeys"><button class="close" data-close>×</button><div class="pkrow">${keys}${stained ? '<div class="pkstain"></div>' : ''}</div><div class="msgline">${stained ? '鍵盤に、赤黒い汚れがこびりついている……。' : '拭き取った鍵盤に、赤い数字が書かれている。'}</div><div class="btns"><button class="mbtn primary" data-close>閉じる</button></div></div>`, { onClose: done });
    m.querySelector('.pkrow').addEventListener('click', () => UI.closeModal());   // it is only something to look at: a tap on the keys puts it away too
    if (autoClose) { const mod = GAME.modal; setTimeout(() => { if (GAME.modal === mod) UI.closeModal(); }, autoClose * 1000); }   // you look up from the numbers by yourself
  },
  // the safe (6.23): four odd figures on its door, and four dials
  safe() {
    const code = STORY.flags.code.safe, v = [0, 0, 0, 0];
    let fails = 0;
    const figs = SAFE_FIGURES.map(([k, rot]) => `<svg viewBox="-6 -6 52 112" aria-hidden="true"><polygon points="${figurePts(k, rot).map(q => q.join(',')).join(' ')}" fill="none" stroke="#e6e6e6" stroke-width="5"/></svg>`).join('');
    const m = UI.openModal(`<div class="safe"><button class="close" data-close>×</button><div class="msgline">壁に埋めこまれた金庫。扉に、おかしな図形が描かれている……。</div>
      <div class="sfigs">${figs}</div>
      <div class="dials">${v.map((_, i) => `<div class="dial"><button data-u="${i}">▲</button><div class="dd" id="sd${i}">0</div><button data-d="${i}">▼</button></div>`).join('')}</div>
      <div class="btns"><button class="mbtn primary" id="sfOpen">開ける</button><button class="mbtn" data-close>やめる</button></div><div class="msgline" id="sfMsg"></div></div>`);
    const draw = () => v.forEach((d, i) => ($('sd' + i).textContent = d));
    m.querySelectorAll('[data-u]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.u; v[i] = (v[i] + 1) % 10; draw(); SFX.click && SFX.click(); }));
    m.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.d; v[i] = (v[i] + 9) % 10; draw(); SFX.click && SFX.click(); }));
    $('sfOpen').onclick = () => {
      if (v.join('') === code) { UI.closeModal(); EVENTS.safeOpened(); return; }
      fails++; SFX.locked(MAN.safe.position.clone()); $('sfMsg').textContent = fails >= 3 ? '開かない……。この図形、何かの形に似ている気がする……。' : '開かない……。';
    };
  },
  /* the save files: the autosave and three of your own */
  canSave() { return GAME.state === 'play' && PLAYER.alive && !ONI.on && !STORY.busy && !GAME.busy && !GAME.cine; },
  anySave() { return SLOTS.some(k => { const s = store.get(k, null); return s && s.v === 2; }); },
  files(mode, back = null) {
    UI._files = { mode, back, confirm: null };
    $('fTitle').textContent = mode === 'save' ? 'セーブ' : 'ロード';
    $('fMsg').textContent = mode === 'save' ? 'どのファイルに記録しますか？' : 'どの記録から始めますか？';
    UI.drawFiles(); UI.show('files');
  },
  drawFiles() {
    const F = UI._files, list = $('fList'); list.innerHTML = '';
    const when = t => { const d = new Date(t), p = n => String(n).padStart(2, '0'); return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; };
    SLOTS.forEach((k, i) => {
      const s = store.get(k, null), ok = !!(s && s.v === 2), b = document.createElement('button');
      b.className = 'frow' + (F.confirm === k ? ' pick' : '');
      b.innerHTML = `<b>${i ? 'ファイル' + i : 'オートセーブ'}</b><span>${ok ? `${s.place || '？'}　${Math.floor((s.time || 0) / 60)}分${String((s.time || 0) % 60).padStart(2, '0')}秒` : '―― データなし ――'}</span><small>${ok && s.date ? when(s.date) : ''}</small>`;
      b.disabled = F.mode === 'save' ? i === 0 : !ok;
      b.onclick = () => (F.mode === 'save' ? UI.saveSlot(k) : UI.loadSlot(s));
      list.appendChild(b);
    });
  },
  saveSlot(k) {
    const F = UI._files;
    if (store.get(k, null) && F.confirm !== k) { F.confirm = k; UI.drawFiles(); $('fMsg').textContent = '上書きしますか？（もう一度押すと上書き）'; return; }
    STORY.saveTo(k); F.confirm = null; UI.drawFiles(); $('fMsg').textContent = '記録しました。';
    if (AU.ok) AU.burst({ dur: 0.05, f: 2600, q: 2, vol: 0.12, rev: 0.2 });
  },
  loadSlot(s) { UI.show('files', false); UI._files = null; GAME.start(s); },
  closeFiles() { const F = UI._files; UI._files = null; UI.show('files', false); if (F && F.back) F.back(); },
  // dials for a number (a safe, a door's keypad)
  dials({ msg, n = 4, code, figs = '', onOpen, fail = '開かない……。' }) {
    const v = Array(n).fill(0);
    const m = UI.openModal(`<div class="safe"><button class="close" data-close>×</button><div class="msgline">${msg}</div>${figs}
      <div class="dials">${v.map((_, i) => `<div class="dial"><button data-u="${i}">▲</button><div class="dd" id="sd${i}">0</div><button data-d="${i}">▼</button></div>`).join('')}</div>
      <div class="btns"><button class="mbtn primary" id="sfOpen">決定</button><button class="mbtn" data-close>やめる</button></div><div class="msgline" id="sfMsg"></div></div>`);
    const draw = () => v.forEach((d, i) => ($('sd' + i).textContent = d));
    m.querySelectorAll('[data-u]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.u; v[i] = (v[i] + 1) % 10; draw(); SFX.click && SFX.click(); }));
    m.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.d; v[i] = (v[i] + 9) % 10; draw(); SFX.click && SFX.click(); }));
    $('sfOpen').onclick = () => { if (v.join('') === String(code)) { UI.closeModal(); onOpen(); return; } SFX.locked(PLAYER.pos.clone().setY(PLAYER.pos.y + 1)); $('sfMsg').textContent = fail; };
  },
  // something to look at close up: a picture, a scrap of paper, a thing you carry
  view(html, msg = '', done = null) {
    UI.openModal(`<div class="safe view"><button class="close" data-close>×</button>${html}<div class="msgline">${msg}</div><div class="btns"><button class="mbtn primary" data-close>閉じる</button></div></div>`, { onClose: done });
  },
  // a book, page after page
  book(pages, done) {
    let i = 0;
    const m = UI.openModal(`<div class="safe view"><button class="close" data-close>×</button><div id="bkPage" class="bkpage"></div><div class="btns"><button class="mbtn primary" id="bkNext">次のページ</button><button class="mbtn" data-close>閉じる</button></div></div>`, { onClose: () => { if (i >= pages.length - 1 && done) done(); } });
    const show = () => { $('bkPage').innerHTML = pages[i]; $('bkNext').textContent = i >= pages.length - 1 ? '閉じる' : '次のページ'; };
    $('bkNext').onclick = () => { if (i >= pages.length - 1) { UI.closeModal(); return; } i++; show(); SFX.paper && SFX.paper(); };
    show(); void m;
  },
  pause() {
    if (GAME.state !== 'play' || GAME.paused || !PLAYER.alive || GAME.modal || GAME.cine || GAME.busy || !$('pause').classList.contains('hidden')) return;
    GAME.paused = true; UI.show('pause'); $('pSave').disabled = ONI.on || STORY.busy;
    const r = GAME.room;
    $('pauseInfo').textContent = `現在地：${r ? r.name : '？'}　/　持ち物：${STORY.inv.map(i => ITEMS[i].name).join('、') || 'なし'}`;
    if (AU.ctx) AU.ctx.suspend();
  },
  resume() { GAME.paused = false; UI.show('pause', false); AU.resume(); if (!IS_TOUCH) requestLock(); },
  title() {
    GAME.state = 'title';
    ['hud', 'touch', 'over', 'end', 'pause', 'loading', 'settings', 'how', 'msg', 'items', 'files', 'specBar', 'online'].forEach(i => UI.show(i, false)); UI._files = null;
    UI.show('title'); NET.render();
    $('bCont').disabled = !UI.anySave();
    MUSIC.stop(1); if (GAME.amb) { GAME.amb.stop(1); GAME.amb = null; }
    GAME.room = null; ONI.reset(); CAST.hideAll(); UI._msg = null; UI._choice = null; $('msgChs').innerHTML = ''; CHAIRS.held = null; PUSH.obj = null; VIEW.chair.visible = false; GAME.modal = null; GAME.cine = null; GAME.busy = 0; GAME.lighterOn = false;
    $('fxBlack').style.transition = 'opacity .6s'; $('fxBlack').style.opacity = 0;
  },
  over() {
    GAME.state = 'over';
    UI.show('hud', false); UI.show('touch', false); UI.show('msg', false);
    const o = $('over'); UI.show('over'); o.classList.remove('show'); void o.offsetWidth; o.classList.add('show');
    $('overSub').innerHTML = '青鬼につかまってしまった……<br><small>部屋を移れば、少し時間がかせげる。追ってこなくなるまで逃げきるか、見られていないうちにクローゼットへ。</small>';
    $('overBtns').style.opacity = 0; $('overBtns').style.pointerEvents = 'none';
    $('oCont').disabled = !UI.anySave(); NET.overUI();
    setTimeout(() => { $('overBtns').style.opacity = 1; $('overBtns').style.pointerEvents = 'auto'; $('fxBlack').style.transition = 'opacity .6s'; $('fxBlack').style.opacity = 0; }, 1400);
    if (GAME.amb) { GAME.amb.stop(1); GAME.amb = null; }
  },
  settings(back) {
    UI.show('settings');
    const seg = (id, key, conv = v => v) => { const el = $(id); el.querySelectorAll('button').forEach(b => { b.classList.toggle('on', String(SETTINGS[key]) === b.dataset.v); b.onclick = () => { SETTINGS[key] = conv(b.dataset.v); saveSettings(); seg(id, key, conv); if (key === 'quality') UI._qualityChanged = true; if (key === 'fps') $('fps').style.display = SETTINGS.fps ? 'block' : 'none'; }; }); };
    seg('sQuality', 'quality'); seg('sFps', 'fps', v => +v);
    const rng_ = (id, key, fn) => { const el = $(id); el.value = SETTINGS[key]; el.oninput = () => { SETTINGS[key] = +el.value; saveSettings(); fn && fn(); }; };
    rng_('sBright', 'bright'); rng_('sSens', 'sens'); rng_('sFov', 'fov', () => { camera.fov = SETTINGS.fov; camera.updateProjectionMatrix(); }); rng_('sVol', 'volume', () => AU.setVolume(SETTINGS.volume * HUB.vol));
    $('sBack').onclick = () => { UI.show('settings', false); if (UI._qualityChanged && GAME.state === 'title') { location.reload(); return; } if (UI._qualityChanged) UI.hint('画質の変更は次回の起動から反映されます'); back && back(); };
  },
};

/* =========================================================================
   Game flow
   ========================================================================= */
let materialsReady = false;
// 6.23's five sets of numbers on the keys (left, middle, right). The safe reads them as its figures say: the right key
// turned upside down, the middle, the right, the left turned upside down (turned over, 6 and 9 swap)
const SLOTS = ['save', 'save1', 'save2', 'save3'];
function newCode() {
  const sets = ['176', '239', '941', '679', '915'], rot = { 1: 1, 2: 2, 5: 5, 6: 9, 9: 6 };
  const p = sets[(Math.random() * sets.length) | 0], [L, M, R] = p;
  return { piano: p, safe: `${rot[R]}${M}${R}${rot[L]}` };
}
// put the house in the state a save describes (things moved, opened, taken)
function applyState() {
  const f = STORY.flags;
  for (const id of STORY.got) { const m = MAN.props[id]; if (m) m.visible = false; }
  for (const id of STORY.unlocked) { const d = MAN.doors[id]; if (d) { d.lock = null; const p = d.to && MAN.doors[d.to]; if (p) p.lock = null; } }
  if (f.tkChair && !(f.chairs && f.chairs.tk)) MAN.tkChair.place(MAN.tkChair.g.position.x + T, MAN.tkChair.g.position.z);   // (a save from when chairs were pushed)
  if (f.kidsChair && !(f.chairs && f.chairs.kids)) MAN.kidsChair.place(tm(13.5), tm(-13) + 1.1);
  if (f.chairs) for (const ch of MAN.chairs) {
    const q = f.chairs[ch.key]; if (!q) continue;
    if (q[2] && MAN.areas[q[2]]) ch.moveTo(MAN.areas[q[2]]); ch.place(q[0], q[1]);
    // (a save from before a room was rebuilt can have it standing in furniture now: then it is back in its place)
    const c = ch.col;
    if (ch.r.colliders.some(o => o !== c && o.on && o.tag === 'furn' && o.x0 < c.x1 && o.x1 > c.x0 && o.z0 < c.z1 && o.z1 > c.z0)) { ch.moveTo(ch.home.r); ch.place(ch.home.x, ch.home.z); delete f.chairs[ch.key]; }
  }
  for (const fn of STATE_HOOKS) fn(f);
  MAN.props.k_library.visible = chairAway(MAN.tkChair) && !STORY.hasGot('k_library');
  if (f.tubDrained && !STORY.hasGot('driver')) MAN.props.driver.visible = true;
  if (f.bookMoved) { MAN.props.greenBook.position.x -= 0.35; if (!STORY.hasGot('k_bedroom')) MAN.props.k_bedroom.visible = true; }
  if (f.libChase && !f.libChaseDone) { f.libChaseDone = true; f.takeshiGone = true; }
  if (f.libChaseDone && !STORY.hasGot('hanky')) MAN.props.hanky.visible = true;
  if (f.tubDrained) MAN.tub.set(true);
  if (STORY.hasGot('soap')) MAN.props.soap.visible = false;
  if (STORY.hasGot('knob')) MAN.doors.atticBack.knobs.forEach(k => (k.visible = false));
  if (f.bedPushed) { MAN.leftBed.at = 1; MAN.leftBed.place(MAN.leftBed.g.position.x - T, MAN.leftBed.g.position.z); MAN.hole.visible = true; }
  if (f.pianoShelf) { MAN.pianoShelf.at = 1; MAN.pianoShelf.place(MAN.pianoShelf.g.position.x - 1.75, MAN.pianoShelf.g.position.z); }
  if (f.pianoClean) MAN.pianoStain.visible = false;
  if (STORY.hasGot('oil')) MAN.props.oil.visible = false;
  if (f.wallCut) showHiddenDoor(MAN.doors.corT_hid, !!f.knobOn);
  if (f.candle) candleUp();
  if (f.kidsChase) MAN.blood.visible = true;
  if (f.jailShelf) { MAN.jailShelf.at = 1; MAN.jailShelf.place(MAN.jailShelf.g.position.x + tm(2), MAN.jailShelf.g.position.z); }
  for (const k of ['pianoChase', 'tatamiChase', 'kidsChase', ...CHASES]) if (f[k]) f[k + 'Done'] = true;   // a chase you were caught in counts as over
  if (f.jailScene) f.jailDone = true;
  buildNav();
}
GAME.start = async function (save = null) {
  AU.init(); AU.resume();
  ['title', 'over', 'end', 'settings', 'how', 'files', 'specBar', 'online'].forEach(i => UI.show(i, false));
  if (!materialsReady) {
    UI.show('loading');
    await buildMaterials(p => { $('loadBar').style.width = Math.round(p * 100) + '%'; });
    materialsReady = true;
    UI.show('loading', false);
  }
  rng = new RNG((Math.random() * 2 ** 31) | 0);
  ONI.reset(); WORLD.reset(); PARTICLES.clear(); MUSIC.stop(0.3); CAST.hideAll();
  STORY.reset(); DIRECTOR.reset(); GAME.timers = []; GAME.modal = null; GAME.cine = null; GAME.paused = false; GAME.chaseFx = 0; GAME.busy = 0; GAME.lighterOn = false; UI._msg = null; UI._choice = null;
  CHAIRS.held = null; PUSH.obj = null; VIEW.chair.visible = false; $('msgChs').innerHTML = '';
  GAME.time = 0; WORLD.time = 0; GAME.caughtN = 0; GAME.room = null; GAME.stairLock = null;
  POST.shake = 0; POST.flash = 0;
  buildMansion();
  MAN.areas.hidden.lightFx = MAN.candle;
  ONI.init();
  LIGHTS.init();
  const sp = MAN.areas.foyer.spawn;
  PLAYER.reset(new THREE.Vector3(sp.x, FLOORS.F1, sp.z), sp.yaw);
  if (save) {
    STORY.inv = save.inv.slice(); STORY.got = save.got.slice(); STORY.unlocked = save.unlocked.slice(); STORY.flags = JSON.parse(JSON.stringify(save.flags));
    if (!STORY.flags.code || String(STORY.flags.code.piano).length !== 3) STORY.flags.code = newCode();   // a save from before the 6.23 keys
    for (const fn of BUILT_HOOKS) fn();
    applyState();
    PLAYER.reset(new THREE.Vector3(save.pos[0], save.pos[1], save.pos[2]), save.pos[3]);
    GAME.time = save.time || 0; GAME.caughtN = save.caught || 0;
    DIRECTOR.enabled = !!STORY.flags.libChase; DIRECTOR.cool = rng.range(300, 600);   // (after loading: not straight away)
  } else { STORY.flags.code = newCode(); for (const fn of BUILT_HOOKS) fn(); }
  GAME.room = WORLD.roomAt(PLAYER.pos);
  if (!GAME.room && save) {   // (a save from before a room was rebuilt can stand where there is no floor now: the nearest floor)
    const nd = nearestNode(PLAYER.pos);
    if (nd) { PLAYER.pos.set(cx(nd.x), FLOORS[nd.fl], cx(nd.z)); PLAYER.camY = FLOORS[nd.fl] + 1.58; GAME.room = WORLD.roomAt(PLAYER.pos); }
  }
  if (GAME.room) showFloor(GAME.room.fl);
  UI.inv();
  $('fxBlack').style.transition = 'none'; $('fxBlack').style.opacity = 1; $('fxHide').style.opacity = 0;
  UI.show('hud'); UI.show('touch', IS_TOUCH);
  $('fps').style.display = SETTINGS.fps ? 'block' : 'none';
  GAME.state = 'play';
  if (GAME.amb) GAME.amb.stop(0.2);
  GAME.amb = LOOPS.ambience(); GAME.amb.setVol(0.8, 1);
  if (!IS_TOUCH) requestLock();
  const fadeIn = (s = 1.6) => { $('fxBlack').style.transition = `opacity ${s}s`; $('fxBlack').style.opacity = 0; };
  if (save) { setTimeout(() => fadeIn(), 60); if (GAME.room) UI.place(GAME.room.name); UI.hint('記録したところから再開', 2400); GAME.onEnterRoom(GAME.room, null, true); return; }
  // the opening: the four of them in the hall
  const fa = MAN.areas.foyer.friendsAt;
  const me = { x: MAN.areas.foyer.spawn.x, z: MAN.areas.foyer.spawn.z };
  ['takuro', 'mika', 'takeshi'].forEach((id, i) => CAST.place(id, fa[i][0], FLOORS.F1, fa[i][1], yawTo({ x: fa[i][0], z: fa[i][1] }, me)));
  PLAYER.yaw = 0; PLAYER.pitch = -0.05;
  setTimeout(() => fadeIn(2.0), 200);
  GAME.later(1.6, () => GAME.say([
    ['', '――町はずれの洋館。そこには「化け物が出る」という噂があった。'],
    ['たくろう', '中は、思ったよりきれいだな。'],
    ['たけし', 'な、なあ……やっぱり帰ろうぜ。'],
    ['みか', 'たけし、こわいの？'],
    ['たけし', 'こ、こわくねーよ！'],
    ['たくろう', 'せっかく来たんだ。ちょっと探検してみようぜ。'],
    ['ひろし', '化け物なんて、科学的にありえないよ。'],
  ], () => {
    SFX.crash(new THREE.Vector3(tm(37.4), FLOORS.F1 + 1, tm(-4.4))); POST.shake = 0.3;
    GAME.later(0.9, () => GAME.say([
      ['みか', 'きゃっ！　な、なに今の音……。'],
      ['たけし', 'ひっ……！'],
      ['ひろし', '右の奥……台所のほうからだ。ちょっと見てくるよ。'],
    ], () => {
      // as in the original, you set off alone: the game starts in the corridor to the right of the hall
      GAME.busy = 1;
      GAME.fade(0.6, () => {
        STORY.flags.leftHall = true;
        PLAYER.pos.set(tm(24.5), FLOORS.F1, tm(1.5)); PLAYER.camY = FLOORS.F1 + 1.58; PLAYER.yaw = -Math.PI / 2; PLAYER.pitch = 0; PLAYER.vel.set(0, 0, 0);
        GAME.room = MAN.areas.corB; UI.place(GAME.room.name);
      }, () => { GAME.busy = 0; STORY.save(); UI.hint(IS_TOUCH ? '左側で移動・右側で視点・手のボタンで調べる・アイテムは左上' : 'WASD 移動 ・ Shift 走る ・ E / クリック 調べる ・ I アイテム', 4500); });
    }));
  }));
};
GAME.onEnterRoom = function (r, via = null, quiet = false) {
  if (!r) return;
  if (!quiet) UI.place(r.name);
  const f = STORY.flags;
  if (CHAIRS.held && r !== CHAIRS.held.r) CHAIRS.held.moveTo(r);   // you carry it with you
  chairsBack(r);
  if (PUSH.obj && r !== PUSH.obj.r) PUSH.obj.moveTo(r);
  showFloor(r.fl);
  for (const fn of ROOM_HOOKS) if (fn(r, via, quiet) === false) return;
  // the others are gone once you come back from the dining room
  if (r.id === 'kitchen') { CAST.hide('takuro'); CAST.hide('mika'); CAST.hide('takeshi'); f.friendsLeft = true; }
  if (r.id === 'foyer' && f.friendsLeft && !f.friendsGone && f.plateLook) { f.friendsGone = true; STORY.save(); if (!quiet) GAME.later(0.6, () => GAME.say([['ひろし', 'あれ？　みなさん？']])); }   // the others are gone
  if (r.id === 'library' && !f.glimpse && !quiet) EVENTS.libraryGlimpse();
  if (r.id === 'tatami' && !f.tatamiChase && !quiet) EVENTS.tatamiChase();
  // until you have found what made the noise, the hall is where the others are waiting: you go on
  if (r.id === 'foyer' && f.leftHall && !f.plateLook) {
    PLAYER.pos.x = tm(23) + 0.9; PLAYER.vel.set(0, 0, 0); PLAYER.yaw = -Math.PI / 2; GAME.room = MAN.areas.corB;
    GAME.say([['', '先に、音のした方を見に行こう。']]); return;
  }
  if (r.id === 'kids') {
    if (!f.basementOpen) { const m = r.mikaAt, c = CAST.place('mika', m.x, FLOORS.F2, m.z, m.yaw); if (!c.m.userData.ia) { c.m.userData.ia = { dist: 2.5, prompt: () => (CAST.list.mika.dead ? null : 'みかに話しかける'), use: () => EVENTS.mika() }; c.m.traverse(o => { if (o.isMesh) o.userData.iaRoot = c.m; }); r.interactables.push(c.m); } }
    else if (!f.kidsChase) { CAST.hide('mika'); EVENTS.kidsChase(); }
    else { const m = r.mikaDown; CAST.lie('mika', m.x, FLOORS.F2, m.z, m.yaw); MAN.blood.visible = true; }
  } else if (r.id !== 'big') CAST.hide('mika');
  // Takeshi's closet: nothing to see until it rattles, as you go to the desk
  if (r.id === 'takeshi') { const h = MAN.tkCloset; h.prompt = () => (STORY.flags.takeshiGone ? 'クローゼットに隠れる' : STORY.flags.tkRattle ? 'クローゼットを調べる' : null); h.use = () => (STORY.flags.takeshiGone ? GAME.enterHide(h) : EVENTS.takeshiCloset()); }
  if (roomDark(r) && !GAME.lighterOn && !quiet) GAME.later(0.3, () => UI.hint('真っ暗で、何も見えない', 2600));
  void via;
};
// up the last stairs and out: the end
GAME.ending = function () {
  if (GAME.state !== 'play') return;
  GAME.state = 'ending'; PLAYER.frozen = true; ONI.despawn(true); MUSIC.stop(1.5);
  releaseLock();
  SFX.door(PLAYER.pos.clone().setY(PLAYER.pos.y + 1.5), 1.0);
  $('fxBlack').style.transition = 'opacity 1.5s'; $('fxBlack').style.opacity = 1;
  const play = GAME.time, caught = GAME.caughtN || 0;
  store.set('cleared', (store.get('cleared', 0) || 0) + 1);
  setTimeout(() => {
    UI.show('hud', false); UI.show('touch', false); UI.show('end');
    if (GAME.amb) { GAME.amb.stop(1); GAME.amb = null; }
    const lines = ['階段を上りきると、外の冷たい空気が流れこんできた。', 'ひろしとたくろうは、ふり返らずに走った。', '洋館は、夜の闇の中に黙って立っていた。', '― 脱出 ―'];
    const box = $('endText'); box.innerHTML = '';
    lines.forEach((l, i) => { const p = document.createElement('div'); p.className = 'gl'; p.textContent = l; box.appendChild(p); setTimeout(() => p.classList.add('on'), 600 + i * 1900); });
    $('endStats').innerHTML = `プレイ時間 ${Math.floor(play / 60)}分${String(Math.floor(play % 60)).padStart(2, '0')}秒　/　つかまった回数 ${caught}回`;
    setTimeout(() => { $('endStats').style.opacity = 1; $('endBtns').style.opacity = 1; }, 600 + lines.length * 1900);
    MUSIC.play('guiding');
  }, 1700);
};

/* =========================================================================
   Main loop
   ========================================================================= */
let lastT = performance.now(), fpsAcc = 0, fpsN = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const real = (now - lastT) / 1000, dt = Math.min(0.05, real); lastT = now;
  fpsAcc += real; fpsN++; if (fpsAcc > 0.5) { if (SETTINGS.fps) $('fps').textContent = Math.round(fpsN / fpsAcc) + ' fps'; fpsAcc = 0; fpsN = 0; }
  stepAnims();
  if (GAME.state !== 'play' && GAME.state !== 'ending' && GAME.state !== 'watch') return;   // (watch: caught, watching a friend online)
  update(dt);
  if (composer) composer.render(dt); else renderer.render(scene, camera);
}
function update(dt) {
  if (GAME.state === 'play' && !GAME.paused) {
    if (!GAME.modal || GAME.cine) { GAME.time += dt; WORLD.time = GAME.time; }
    if (!GAME.modal) runTimers();
    PLAYER.update(dt);
    const r = PLAYER.alive && !GAME.busy ? WORLD.roomAt(PLAYER.pos) : null;
    if (r && r !== GAME.room) { GAME.room = r; GAME.onEnterRoom(r); }
    GAME.checkMoves();
    // the attic: Takuro comes in behind you as you go up to the door at the back
    if (GAME.room && GAME.room.id === 'attic' && !STORY.flags.takuro && !GAME.busy && !GAME.modal && PLAYER.alive && PLAYER.pos.distanceTo(MAN.doors.atticBack.front) < 3.6) EVENTS.takuroScene();
    // hidden from it in a closet: once it has gone, you come out by yourself
    const hd = PLAYER.hidden;
    if (hd && hd.chased && !GAME.modal) { if (!ONI.on) { hd.outT = (hd.outT || 0) + dt; if (hd.outT > 1.2) { hd.chased = false; GAME.exitHide(); } } else hd.outT = 0; }
    for (const rm of WORLD.rooms) for (const fn of rm.updaters) fn(dt, GAME.time);
    twinkle(GAME.time); pushFollow(dt);
    for (const fn of TICK_HOOKS) fn(dt);
    const wasOn = ONI.on;
    ONI.update(dt);
    if (wasOn && !ONI.on) EVENTS.afterChase();
    DIRECTOR.update(dt);
    CAST.update(dt);
    PARTICLES.update(dt);
    const chasing = ONI.on && (ONI.state === 'chase' || ONI.state === 'appear' || ONI.state === 'transit' || ONI.state === 'bars');
    if (chasing && ONI.state !== 'bars') { GAME.chaseFx = 1; MUSIC.play('aochase'); }
    else if (!ONI.on && MUSIC.cur && MUSIC.cur.name === 'aochase') { MUSIC.stop(3); GAME.chaseFx = 0; }
    else if (!ONI.on) GAME.chaseFx = 0;
  }
  NET.update(dt);
  PLAYER.applyCamera(dt);
  VIEW.update(dt);
  LIGHTS.update(dt, GAME.time);
  chairAim();
  GAME.updateTarget();
  $('fxChase').style.opacity = GAME.chaseFx ? 1 : 0;
  $('fxHide').classList.toggle('dark', !!PLAYER.hidden && ONI.on);
  const dark = roomDark(GAME.room);
  const candleLit = GAME.room && GAME.room.lightFx && GAME.room.lightFx.state === 'on';   // a lit candle fills its room with light
  hemi.intensity = damp(hemi.intensity, dark ? 0.02 : candleLit ? 0.6 : 0.26, 3, dt); hemi.color.setHex(candleLit ? 0xffc890 : 0xa4accc); hemi.groundColor.setHex(0x1a1410);
  scene.fog.color.setHex(0x040406); scene.fog.density = 0.026;
  $('fxVeil').style.opacity = GAME.state === 'play' && !PLAYER.hidden ? veilDark(camera.position, PLAYER.pos.y).toFixed(3) : 0;   // walking into a black screen edge
  renderer.toneMappingExposure = BASE_EXPOSURE * SETTINGS.bright * (1 + POST.flash * 2.5);
  POST.flash = Math.max(0, POST.flash - dt * 2.2);
  if (gradePass) { const u = gradePass.uniforms; u.time.value = GAME.time; u.grain.value = 0.05; u.aberr.value = GAME.chaseFx ? 0.0025 : 0; u.desat.value = 0.1; u.warp.value = 0; }
  if (AU.ok) {
    const L = AU.ctx.listener, p = camera.position, f = GAME.camDir;
    if (L.positionX) { L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z; L.forwardX.value = f.x; L.forwardY.value = f.y; L.forwardZ.value = f.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(p.x, p.y, p.z); L.setOrientation(f.x, f.y, f.z, 0, 1, 0); }
  }
}

/* =========================================================================
   Boot
   ========================================================================= */
/* 3dgame home screen settings: 横画面 (rotate the stage), sound on/off, volume, look sensitivity */
function applyHome(S) {
  if (!S || typeof S !== 'object') return;
  if (typeof S.land === 'boolean' && S.land !== ROT.on) { ROT.on = S.land; onResize(); }
  if (typeof S.sound === 'boolean' || typeof S.vol === 'number') {
    HUB.vol = S.sound === false ? 0 : clamp(typeof S.vol === 'number' ? S.vol : HUB.vol, 0, 1);
    AU.setVolume(SETTINGS.volume * HUB.vol);
  }
  if (typeof S.sens === 'number') HUB.sens = clamp(S.sens, 0.4, 2.2);
}
function boot() {
  if (HUB.embedded) {
    try { applyHome(JSON.parse(localStorage.getItem('3dame-settings'))); } catch (e) { /* no saved home settings */ }
    addEventListener('message', e => { if (e.data && e.data.h3dSet) applyHome(e.data.h3dSet); });
  }
  onResize();
  VIEW.init();
  if (IS_TOUCH) setupTouch();
  $('msg').addEventListener('click', e => { e.stopPropagation(); AU.resume(); UI.msgNext(); });
  $('bNew').onclick = () => GAME.start();
  $('tItems').onclick = e => { e.stopPropagation(); AU.resume(); UI.items(); };
  $('iUse').onclick = () => UI.useItem(); $('iClose').onclick = () => UI.closeItems();
  $('iSave').onclick = () => {
    if (!UI.canSave()) { $('iHelp').textContent = 'いまはセーブできない。'; return; }
    UI.show('items', false); GAME.modal = { files: true };
    UI.files('save', () => { GAME.modal = { items: true }; UI.show('items'); UI.drawItems(); });
  };
  $('pSave').onclick = () => { UI.show('pause', false); UI.files('save', () => UI.show('pause')); };
  $('fBack').onclick = () => UI.closeFiles();
  $('bCont').onclick = () => UI.files('load');
  $('bSettings').onclick = () => UI.settings();
  $('bHow').onclick = () => UI.show('how');
  $('hBack').onclick = () => UI.show('how', false);
  $('pResume').onclick = () => UI.resume();
  $('pSettings').onclick = () => { UI.show('pause', false); UI.settings(() => UI.show('pause')); };
  $('pQuit').onclick = () => { GAME.paused = false; UI.show('pause', false); AU.resume(); ONI.reset(); WORLD.reset(); UI.title(); };
  $('oCont').onclick = () => UI.files('load');
  $('oTitle').onclick = () => { ONI.reset(); WORLD.reset(); UI.title(); };
  $('eTitle').onclick = () => { $('endStats').style.opacity = 0; $('endBtns').style.opacity = 0; ONI.reset(); WORLD.reset(); UI.title(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden && GAME.state === 'play') UI.pause(); });
  NET.bind();
  UI.title();
  requestAnimationFrame(frame);
}
boot();
window.__AO = { NET, OCHAT, glassPaint, drainTub, GAME, STORY, ONI, DIRECTOR, MAN, CHAIRS, PUSH, ITEMS, chairSpot, chairAway, VIEW, WORLD, PLAYER, UI, EVENTS, SFX, MUSIC, AU, CAST, camera, scene, POST, INPUT, LIGHTS, THREE, TILE: T, FLOORS, navPath, nearestNode, cellOf, stairPoint, veilDark, renderer: () => renderer, sim: (sec, step = 1 / 30) => { for (let t = 0; t < sec; t += step) { update(step); stepAnims(); } } };
