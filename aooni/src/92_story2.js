
/* =========================================================================
   The story after the main building (6.23): the basement, the first annex, the walk outside, the second
   annex and the way out. Items other than keys are used from the item screen, on what you were facing.
   ========================================================================= */
CHASES.push('mikaOni', 'hidChase', 'sproutChase', 'tkOni', 'backOni', 'fireOni', 'mikaCl1', 'mikaCl2', 'fuwatty', 's2Rise', 'codeOni');
const say2 = (...l) => GAME.say(l.map(x => (typeof x === 'string' ? ['', x] : x)));
const near2 = (o, d) => Math.hypot(PLAYER.pos.x - o.x, PLAYER.pos.z - o.z) < d;
const canvasImg = (w, h, draw) => { const c = newCanvas(w, h); draw(c.getContext('2d'), w, h); return `<img class="vimg" src="${c.toDataURL()}" alt="">`; };
function lightCandleFx(fx, room) {
  if (!fx || fx.state === 'on') return;
  fx.state = 'on'; SFX.lighter(); POST.flash = 0.35;
  if (room) room.lightFx = fx;
  STORY.flags['lit_' + fx.key] = true; STORY.save();
}
// reaching up to something on a high shelf: only from a chair set down close by
function fromChair(x, z, d = 1.6) { const ch = PLAYER.onChair; return ch && Math.hypot(ch.g.position.x - x, ch.g.position.z - z) < d; }
// fall (or climb) to a spot on another floor, through the black
function dropTo(area, x, z, yaw, line, after) {
  if (GAME.busy) return;
  GAME.busy = 1; SFX.fall();
  const r = MAN.areas[area];
  GAME.fade(0.5, () => {
    PLAYER.onChair = null; PLAYER.pos.set(x, FLOORS[r.fl], z); PLAYER.camY = FLOORS[r.fl] + 1.0; PLAYER.yaw = yaw; PLAYER.pitch = -0.15; PLAYER.vel.set(0, 0, 0); POST.shake = 0.5;
    GAME.room = r; GAME.onEnterRoom(r);
  }, () => { GAME.busy = 0; STORY.save(); if (line) say2(line); if (after) after(); });
}

Object.assign(EVENTS, {
  /* ---------- the main building's basement ---------- */
  b1Shelf(side) {
    const f = STORY.flags; f['b1Sh' + side] = true;
    if (!(f.b1ShL && f.b1ShR)) { say2('大きな棚だ。'); return; }
    f.b1Shelves = true; for (const sh of [MAN.b1ShelfL, MAN.b1ShelfR]) sh.slide(sh.g.position.x + sh.dx, sh.g.position.z, 900);
    GAME.later(1.0, () => { say2('棚が動いた。', '壁にパネルがある。'); STORY.save(); });
  },
  b1Panel() {
    const f = STORY.flags;
    if (!f.b1Panel) { say2('四隅をネジで留められたパネルがある。'); return; }
    UI.dials({ msg: '壁に埋めこまれた金庫。', code: '5376', onOpen: () => { f.b1Safe = true; SFX.unlock(PLAYER.pos.clone()); GAME.take('k_annex', null); } });
  },
  b1High(id) {
    const o = MAN.props[id]; if (!o || STORY.hasGot(id)) return;
    if (!fromChair(o.position.x, o.position.z)) { say2('棚の上で、何かが光っている。', '手が届かない。'); return; }
    GAME.take(id, o, () => { if (id === 'k_bjail') { const m = MAN.areas.big.mikaAt; STORY.flags.mikaB1 = true; CAST.place('mika', m.x, FLOORS.B1, m.z, Math.PI); STORY.save(); } });
  },
  // she is standing at the back of the big room; go up to her and she turns into it
  mikaTurn() {
    const f = STORY.flags, r = MAN.areas.big, c = CAST.list.mika;
    if (f.mikaOni || !c) return;
    f.mikaOni = true; STORY.busy = true; PLAYER.frozen = true; c.shiver = 2.5;
    SFX.heartbeat && SFX.heartbeat(0.8);
    const t0 = GAME.time;
    animate(() => { if (GAME.time - t0 > 3) return false; lookAtPoint(tmpV.set(c.m.position.x, c.m.position.y + 1.3, c.m.position.z), 0.08); return true; });
    GAME.later(1.6, () => {
      POST.flash = 0.8; POST.shake = 0.6; SFX.oniSpot();
      const p = c.m.position.clone(); CAST.hide('mika'); c.shiver = 0;
      ONI.spawn(p.x, FLOORS.B1, p.z, yawTo(p, PLAYER.pos), 'appear'); ONI.setLook('mika'); ONI.appearFor = 1.4;
      PLAYER.frozen = false; STORY.busy = false; STORY.save(); void r;
    });
  },
  bjCandle() { if (MAN.bjCandle.state === 'on') return; if (!GAME.lighterOn) { say2('ろうそくがある。'); return; } lightCandleFx(MAN.bjCandle, MAN.areas.bjail); say2('ろうそくに火をつけた。'); },
  // the scrawl on the cell's back wall: odd marks from inside; from outside, through the bars, four numbers
  bjScrawl() {
    if (roomDark(MAN.areas.bjail) && !GAME.lighterOn) { say2('暗くてよく見えない。'); return; }
    const out = PLAYER.pos.z > MAN.bjCell.z + 0.1;
    UI.view(canvasImg(512, 320, (g, w, h) => { g.fillStyle = '#9c9a90'; g.fillRect(0, 0, w, h); drawJailScrawl(g, w, h, out); }), out ? '鉄格子ごしに見ると、落書きが数字に見える。' : '記号のような落書きだ。');
  },
  bjPeek() {
    if (roomDark(MAN.areas.bjail) && !GAME.lighterOn) { say2('暗くてよく見えない。'); return; }
    UI.view(canvasImg(320, 256, (g, w, h) => { g.fillStyle = '#9c9a90'; g.fillRect(0, 0, w, h); drawPeekScrawl(g, w, h); }), '鉄格子の向こうから、誰かがのぞいている絵だ。');
  },
  /* ---------- the first annex ---------- */
  a1Candle() {
    if (MAN.a1Candle.state === 'on') return;
    if (!GAME.lighterOn) { say2(STORY.flags.oilUsed ? 'ろうそくがある。' : 'ろうそくがある。ライターのオイルが切れている。'); return; }
    lightCandleFx(MAN.a1Candle, MAN.areas.a1left); EVENTS.takeshiA1();
  },
  // Takeshi, in the dark of the left room: he blames himself, and runs
  takeshiA1() {
    const f = STORY.flags, r = MAN.areas.a1left; if (f.takeshiRan) return;
    const t = r.tkAt, c = CAST.place('takeshi', t.x, FLOORS.A1, t.z, t.yaw); c.shiver = 1; STORY.busy = true;
    GAME.say([['たけし', '……ひろし、か。'], ['ひろし', 'たけし！　ここにいたのか。'], ['たけし', 'みかも……たくろうも……俺がクローゼットに隠れてばっかりいたから……。'], ['ひろし', 'たけし、落ち着いて。一緒に出口を探そう。'], ['たけし', '……俺のせいだ……うわあああ！']], () => {
      c.shiver = 0; const d = MAN.doors.a1left_hall;
      CAST.walkTo('takeshi', d.front.x, d.front.z, 3.4, () => { animateDoor(d, 1.1, 500); SFX.door(d.center, 1.0); CAST.hide('takeshi'); f.takeshiRan = true; STORY.busy = false; STORY.save(); });
    });
  },
  statue() { if (!STORY.flags.takeshiRan || STORY.flags.statueBroken) return; startPush(MAN.statue); },
  doll3() {
    const f = STORY.flags;
    if (f.bulbHead) { say2(f.a1Dark ? '電球の頭が、ぼんやり光っている。' : '電球を頭にした人形だ。'); return; }
    if (f.dollHeadOff) { say2('首のない人形だ。'); return; }
    say2(f.eyeRed || f.eyeBlue ? '片方の目に、石がはまっている。' : '目のない人形がある。');
  },
  a1Switch() {
    const f = STORY.flags; f.a1Dark = !f.a1Dark; SFX.click && SFX.click(); if (AU.ok) AU.burst({ dur: 0.03, f: 2400, q: 2, vol: 0.2, rev: 0.1 });
    for (const fx of MAN.areas.a1br.fixtures) if (fx !== MAN.doll3Fx) fx.state = f.a1Dark ? 'off' : 'on';
    a1Shadow();
    if (f.a1Dark && f.bulbHead && !f.shadowSeen) { f.shadowSeen = true; GAME.later(0.5, () => say2('人形の頭の電球が、ぼうっと光っている。', '人形の影が、右の壁をさしている。')); }
    STORY.save();
  },
  a2Bulb() { if (STORY.hasGot('bulb')) return; MAN.a2Bulb.state = 'off'; GAME.take('bulb', null); },
  fireplace() {
    const f = STORY.flags;
    if (MAN.fire.state === 'on') { if (!STORY.hasGot('stoneRed')) GAME.take('stoneRed', MAN.props.stoneRed); return; }
    say2(f.dollIn ? '暖炉に人形を置いた。火をつければ燃えそうだ。' : '暖炉がある。燃やせる物は何もない。');
  },
  poster() {
    const d = STORY.flags.fireLit ? STORY.flags.code.poster : null;
    UI.view(canvasImg(256, 320, (g, w, h) => drawPoster(g, w, h, d)), d ? '貼紙に、数字が浮かび上がっている。' : '何も書かれていない貼紙だ。');
  },
  a1Panel() {
    const f = STORY.flags;
    if (!f.dollPanel) { say2('人形の絵が描かれたパネルがある。', '絵の人形には、頭の部分がない。'); return; }
    UI.dials({ msg: '壁に埋めこまれた金庫。', n: 3, code: f.code.poster, onOpen: () => { SFX.unlock(PLAYER.pos.clone()); GAME.take('k_ab', null, () => { f.tkDropArmed = true; STORY.save(); }); } });
  },
  crate() {
    const f = STORY.flags, c = MAN.crate; if (f.crateIn || c.moving) return;
    const [tx, tz] = c.tile || [20, -1];
    let dx = c.g.position.x - PLAYER.pos.x, dz = c.g.position.z - PLAYER.pos.z;
    if (Math.abs(dx) > Math.abs(dz)) { dx = Math.sign(dx); dz = 0; } else { dz = Math.sign(dz); dx = 0; }
    const nx = tx + dx, nz = tz + dz, cell = MAN.grid.get(gkey('A3', nx, nz)), hole = MAN.crateHole;
    const intoHole = Math.abs(cx(nx) - hole.x) < 0.1 && Math.abs(cx(nz) - hole.z) < 0.1;
    if (!cell || cell.area !== c.r) { SFX.push(c.g.position.clone()); say2('これ以上押せない。'); return; }
    if (!intoHole) { const p = new THREE.Vector3(cx(nx), FLOORS.A3, cx(nz)); for (const col of WORLD.colliders(p, 0.6)) { if (col === c.col || col.tag === 'wall' && false) continue; if (col.wy1 < FLOORS.A3 + 0.2 || col.wy0 > FLOORS.A3 + 1.5) continue; const qx = clamp(p.x, col.x0, col.x1), qz = clamp(p.z, col.z0, col.z1); if (Math.hypot(p.x - qx, p.z - qz) < 0.44) { SFX.push(c.g.position.clone()); say2('これ以上押せない。'); return; } } }
    c.moving = true; c.tile = [nx, nz]; c.slide(cx(nx), cx(nz), 450);
    GAME.later(0.5, () => {
      c.moving = false;
      if (intoHole) {
        f.crateIn = true; c.col.on = false; hole.col.on = false; const y0 = c.g.position.y, t0 = performance.now();
        animate(() => { const k = Math.min(1, (performance.now() - t0) / 450); c.g.position.y = y0 - 0.93 * k * k; return k < 1; });
        GAME.later(0.5, () => { SFX.crash && SFX.crash(c.g.position.clone()); POST.shake = 0.2; hole.m.visible = false; say2('木箱が穴にはまった。'); STORY.save(); });
      } else { f.crateAt = [nx, nz]; STORY.save(); }
    });
  },
  /* ---------- the first annex's basement ---------- */
  abPot() { const p = MAN.abPot; if (p.at) return; p.at = 1; STORY.flags.abPot = true; p.slide(p.g.position.x + 1.0, p.g.position.z + 0.3, 700); GAME.later(0.8, () => say2('植木鉢をどけた。', '赤いレバーがある。')); STORY.save(); },
  abLever() {
    const f = STORY.flags; if (f.abLights) return;
    f.abLights = true; abLightsOn(); SFX.push(PLAYER.pos.clone()); if (AU.ok) AU.burst({ dur: 0.08, f: 900, q: 2, vol: 0.4, rev: 0.3 });
    say2('レバーを引いた。', '明かりがついた。'); STORY.save();
  },
  abShelfBook() { if (STORY.hasGot('book')) { say2('本棚だ。'); return; } GAME.take('book', null); },
  abCurtain() { MAN.abCurtain.visible = false; MAN.abCurtainCol.on = false; STORY.flags.abCurtain = true; SFX.slide(PLAYER.pos.clone()); say2('カーテンを開けた。', '浴槽がある。'); STORY.save(); },
  abTub() {
    const f = STORY.flags;
    if (!f.abDrained) { f.abDrained = true; SFX.drain(MAN.abWater.getWorldPosition(new THREE.Vector3())); const w = MAN.abWater, y0 = w.position.y, t0 = performance.now(); animate(() => { const k = Math.min(1, (performance.now() - t0) / 1800); w.position.y = y0 - 0.3 * k; if (k >= 1) w.visible = false; return k < 1; }); GAME.later(1.9, () => { MAN.props.keyRed.visible = true; }); say2('浴槽の栓を抜いた。'); STORY.save(); return; }
    if (!STORY.hasGot('keyRed')) { GAME.take('keyRed', MAN.props.keyRed); return; }
    const t = MAN.abTub; if (t.at) return;
    t.at = 1; f.abTubMoved = true; t.slide(t.g.position.x + tm(2.4), t.g.position.z, 1000);
    GAME.later(1.1, () => { MAN.abCover.open(); MAN.stairs.stABh.shut = false; say2('浴槽を動かした。', '下へ続く階段が出てきた。'); STORY.save(); });
  },
  latGate() { const f = STORY.flags; if (f.latOpen) return; if (!STORY.has('k_lattice')) { SFX.locked(PLAYER.pos.clone()); say2('格子戸に、鍵がかかっている。'); return; } STORY.use('k_lattice'); f.latOpen = true; MAN.latGate.set(true); UI.hint('格子戸の鍵を使った'); STORY.save(); },
  latButton(c) {
    const f = STORY.flags; if (STORY.hasGot('rod') || f.latDone) return;
    if (AU.ok) AU.burst({ dur: 0.03, f: 1800, q: 3, vol: 0.25, rev: 0.2 });
    const seq = (EVENTS._lat = EVENTS._lat || []); seq.push(c); UI.hint('カチッ', 700);
    if (seq.length < 6) return;
    const ok = seq.join() === 'red,yellow,yellow,blue,yellow,red'; EVENTS._lat = [];
    if (!ok) { GAME.later(0.4, () => say2('何も起こらない。')); return; }
    f.latDone = true; const p = MAN.latPics[1], y0 = p.position.y, t0 = performance.now();
    animate(() => { const k = Math.min(1, (performance.now() - t0) / 500); p.position.y = y0 - 1.6 * k * k; p.rotation.x = -k * 1.3; return k < 1; });
    GAME.later(0.55, () => { SFX.crash && SFX.crash(p.position.clone().setY(FLOORS.AB + 0.2)); MAN.props.rod.visible = true; say2('絵が落ちた。', '何かが落ちている。'); STORY.save(); });
  },
  abDevice() {
    const f = STORY.flags;
    if (!f.devOpen) { say2('扉の横に装置がある。', 'ネジで留められている。'); return; }
    const img = canvasImg(200, 240, (g, w, h) => drawDevice(g, w, h, f.devColor ? 2 : 1));
    UI.dials({ msg: f.devColor ? 'しおりをかざすと、穴が４色に染まって見える。' : '装置の中に、たくさんの黒い穴が空いている。数字を入れられるようだ。', figs: `<div class="vbox">${img}</div>`, code: '1237', onOpen: () => { f.codeOpen = true; SFX.unlock(MAN.doors.corBAB_C.center); say2('ガチャッ', '扉の鍵が開いた。'); STORY.save(); } });
  },
  abLowShelf() { const s = MAN.abLowShelf; if (s.at) return; s.at = 1; STORY.flags.abShelf = true; s.slide(s.g.position.x - tm(1.1), s.g.position.z, 900); GAME.later(1.0, () => say2('棚が横に動いた。', '後ろの壁に、扉の形の切れ目がある。')); STORY.save(); },
  abRug() { if (STORY.hasGot('disc')) return; MAN.props.disc.visible = true; GAME.take('disc', MAN.props.disc); },
  // Takuro, hiding in the wardrobe of the back room
  takuroAB() {
    const f = STORY.flags, h = MAN.tkrCloset;
    STORY.busy = true; SFX.closet(h.cam, true);
    h.doors.forEach((d, i) => { d.rotation.y = d.userData.baseRy + (i === 0 ? -1.3 : 1.3); });
    const p = h.room.toWorld(h.F.x, 0, h.F.z), c = CAST.place('takuro', p.x, p.y, p.z, h.F.ry); void c;
    const done = () => { CAST.hide('takuro'); h.doors.forEach(d => { d.rotation.y = d.userData.baseRy; }); SFX.closet(h.cam, false); STORY.busy = false; STORY.save(); };
    if (!f.takuroAB) {
      f.takuroAB = true;
      GAME.say([['たくろう', '……ひろし、か？'], ['ひろし', 'たくろう！　無事だったんだね。'], ['たくろう', 'ああ。あいつに追われて、ここに隠れてた。'], ['たくろう', 'そうだ、これを持っていけ。どこかで見つけた酢だ。錆びた物なら、これで落とせるかもしれない。'], ['たくろう', '俺はしばらくここにいる。出口が見つかったら教えてくれ。']], () => { STORY.give('vinegar'); SFX.pickup(); GAME.say([['', '酢を手に入れた。']], done); });
      return;
    }
    GAME.say([['ひろし', 'たくろう、隠し通路の奥に縄ばしごがあったよ。'], ['たくろう', '本当か！　よし、一緒に行こう。']], () => {
      h.doors.forEach(d => { d.rotation.y = d.userData.baseRy; }); SFX.closet(h.cam, false); STORY.busy = false;
      f.takuroWith = true; FOLLOW.id = 'takuro'; FOLLOW.place(); STORY.save();
    });
  },
  ropeAB() {
    const f = STORY.flags; if (f.ladderCut) return;
    if (!f.takuroWith) { f.ropeSeen = true; say2('縄ばしごだ。上へ出られそうだ。', 'たくろうに知らせに行こう。'); STORY.save(); return; }
    EVENTS.hidChase();
  },
  // at the foot of the ladder it comes down on you; Takuro holds it off
  hidChase() {
    const f = STORY.flags; if (f.hidChase) return;
    f.hidChase = true; STORY.busy = true; PLAYER.frozen = true;
    const x = tm(29.5), z = tm(15);
    SFX.oniStep(new THREE.Vector3(x, FLOORS.AB + 3, z), 1);
    GAME.later(0.6, () => {
      ONI.spawn(x, FLOORS.AB, z, yawTo({ x, z }, PLAYER.pos), 'script'); ONI.script = { i: 0, steps: [{ t: 'face', toPlayer: true, d: 60 }] };
      ONI.pos.y = FLOORS.AB + 3; const t0 = GAME.time; SFX.oniSpot(); POST.shake = 0.5;
      animate(() => { const k = Math.min(1, (GAME.time - t0) / 0.5); ONI.pos.y = FLOORS.AB + 3 * (1 - k * k); ONI.place(); return k < 1; });
      MAN.ropeAB.visible = false; f.ladderCut = true;
      GAME.later(0.9, () => GAME.say([['たくろう', 'ひろし、逃げろ！　ここは俺が引きつける！']], () => {
        FOLLOW.id = null; f.takuroWith = false; f.takuroGone2 = true; CAST.hide('takuro');
        ONI.state = 'appear'; ONI.wait = 0; ONI.appearFor = 0.5; PLAYER.frozen = false; STORY.busy = false; STORY.save();
      }));
    });
  },
  /* ---------- the second annex ---------- */
  diceWall() {
    const f = STORY.flags, seq = f.diceUsed ? f.code.dice : null;
    UI.view(canvasImg(640, 180, (g, w, h) => drawDiceWall(g, w, h, seq)), seq ? 'サイコロの絵の黒丸が、１つずつ白くなっている。' : 'サイコロの絵が４つ描かれている。');
  },
  pewButton(i) {
    const f = STORY.flags; if (f.altarMoved) return;
    if (AU.ok) AU.burst({ dur: 0.03, f: 1500, q: 3, vol: 0.25, rev: 0.3 });
    const seq = (EVENTS._pew = EVENTS._pew || []); seq.push(i); UI.hint('長椅子の下のボタンを押した', 900);
    if (seq.length < 4) return;
    const ok = seq.join() === f.code.dice.join(); EVENTS._pew = [];
    if (!ok) { GAME.later(0.4, () => say2('何も起こらない。')); return; }
    f.altarMoved = true; const a = MAN.altar; a.at = 1; a.slide(a.g.position.x + tm(2.2), a.g.position.z, 1400);
    GAME.later(1.5, () => { MAN.chCover.open(); MAN.stairs.stS1dn.shut = false; POST.shake = 0.3; say2('ゴゴゴゴ……', '祭壇が動いて、下りの階段が出てきた。'); STORY.save(); });
  },
  pewStick() { if (STORY.hasGot('stick')) return; GAME.take('stick', MAN.props.stick); },
  curtain(i) {
    const c = MAN.curtains[i]; c.open = !c.open; SFX.slide(c.mesh.position.clone());
    const from = c.mesh.scale.x, to = c.open ? 0.25 : 1, fx = c.mesh.position.x, tx = c.open ? c.x - 0.65 : c.x, t0 = performance.now();
    animate(() => { const k = Math.min(1, (performance.now() - t0) / 350); c.mesh.scale.x = lerp(from, to, k); c.mesh.position.x = lerp(fx, tx, k); return k < 1; });
    const f = STORY.flags; f.curtains = MAN.curtains.map(x => x.open); STORY.save();
  },
  sbBars() { say2('鉄格子の向こうで、何かが光っている。', '手が届かない。'); },
  candleGen(key) {
    const fx = MAN[key]; if (!fx || fx.state === 'on') return;
    if (!GAME.lighterOn) { say2('ろうそくがある。'); return; }
    lightCandleFx(fx, key === 'sbjCandle' ? MAN.areas.sbjail : MAN.areas.sbdark); say2('ろうそくに火をつけた。');
  },
  piece2() {
    if (STORY.hasGot('piece2')) return;
    GAME.take('piece2', MAN.props.piece2, () => {
      if (!STORY.flags.ladderHung) return;   // (with no ladder to climb out by, the door stays open)
      STORY.flags.darkLocked = true; SFX.locked(MAN.doors.sbdark_cor.center); GAME.later(0.4, () => say2('ガチャッ', '扉に鍵がかかった音がした。')); STORY.save();
    });
  },
  climbOut() { dropTo('s1cor', cx(17), cx(1), Math.PI / 2, null); },
  s1Hole() {
    const f = STORY.flags, r = MAN.areas.sbdark.landing;
    if (f.ladderHung) { dropTo('sbdark', r.x, r.z, Math.PI, null); return; }
    if (MAN.sbdCandle.state === 'on') { UI.choice('穴の下に、明かりが見える。', ['飛び降りる', 'やめる'], i => { if (i === 0) dropTo('sbdark', r.x, r.z, Math.PI, null); }); return; }
    say2('床に穴が開いている。', '暗くて、下が見えない。');
  },
  studyHole() {
    const f = STORY.flags;
    if (!f.studyScrews) { say2('壁の穴の中で、何かがネジで留められている。'); return; }
  },
  studySafe() {
    const s = MAN.studySafe.position;
    if (!fromChair(s.x, s.z + 0.5, 1.7)) { say2('高くて手が届かない。'); return; }
    UI.dials({ msg: '壁に埋めこまれた金庫。', code: '3045', onOpen: () => { SFX.unlock(PLAYER.pos.clone()); GAME.take('k_sbase', null); } });
  },
  piece3() {
    if (STORY.hasGot('piece3')) return;
    GAME.take('piece3', MAN.props.piece3, () => EVENTS.takuroBack());
  },
  // Takuro comes back, and from now on he is with you
  takuroBack() {
    const f = STORY.flags; if (f.takuroWith2) return;
    const d = MAN.doors.oni_jail; STORY.busy = true;
    animateDoor(d, 1.1, 700); SFX.door(d.center, 1.0);
    const c = CAST.place('takuro', d.front.x, d.front.y, d.front.z, yawTo(d.front, PLAYER.pos));
    CAST.walkTo('takuro', d.front.x + 0.4, d.front.z + 1.4, 1.4, () => {
      c.m.rotation.y = yawTo(c.m.position, PLAYER.pos);
      GAME.say([['たくろう', 'ひろし！'], ['ひろし', 'たくろう！　無事だったんだね。'], ['たくろう', 'なんとかな。……それ、青いピースか？'], ['ひろし', 'これを３つ集めれば、先に進めそうなんだ。'], ['たくろう', 'よし。ここからは一緒に行こう。']], () => { f.takuroWith2 = true; FOLLOW.id = 'takuro'; STORY.busy = false; STORY.save(); });
    });
  },
  pieceFrame() { const n = STORY.flags.piecesN || 0; say2(n ? `額のくぼみに、青いピースが${n}つはまっている。` : '額に、３つのくぼみがある。'); },
  escape() { if (!STORY.flags.piecesSet) return; GAME.ending(); },
});

/* ---------- the story's own appearances (6.23 / ひろし編) ---------- */
// it opens a door and comes in after you
function oniThrough(doorId, look, delay = 0.6) {
  const d = MAN.doors[doorId]; if (!d) return;
  SFX.oniStep(d.front, 0.9); ONI.enterVia(d, delay, 'chase'); ONI.setLook(look || null);
}
// Takeshi, hanging from the rope in the room of dolls (his neck in the loop, his feet off the floor)
function tkHang() {
  const t = MAN.areas.a1bl.tkHang, c = CAST.place('takeshi', t.x, FLOORS.A1 + 0.44, t.z, t.yaw), u = c.m.userData;
  c.m.rotation.order = 'XYZ'; c.base = null; c.dead = true; c.hang = true; c.shiver = 0;
  u.arms.forEach((a, i) => a.rotation.set(0.05, 0, (i ? -1 : 1) * 0.03)); u.legs.forEach((l, i) => l.rotation.set(i ? 0.06 : -0.03, 0, 0)); u.head.rotation.set(0.5, 0.15, 0.28);
  return c;
}
SFX.thud = pos => { if (!AU.ok) return; AU.burst({ pos, dur: 0.32, f: 200, q: 0.6, type: 'lowpass', vol: 1, brown: true, rev: 0.35 }); AU.tone({ pos, f: 85, f2: 38, dur: 0.32, vol: 0.7 }); AU.burst({ pos, t0: AU.t + 0.02, dur: 0.05, f: 1400, q: 1, vol: 0.18, rev: 0.2 }); };
SFX.squeak = (pos, t0 = 0) => { if (!AU.ok) return; const t = AU.t + t0; for (let i = 0; i < 3; i++) AU.tone({ pos, t0: t + i * 0.07, type: 'sine', f: 3200 + Math.random() * 900, f2: 2400, dur: 0.05, vol: 0.09, rev: 0.25 }); };
Object.assign(EVENTS, {
  tkDrop() {
    const f = STORY.flags, c = CAST.list.takeshi, r = MAN.areas.a1bl, t = r.tkDown; if (f.tkFell || !c) return;
    f.tkFell = true; c.hang = false; STORY.save();
    const m = c.m, y0 = m.position.y, t0 = performance.now(), p = m.position.clone();
    animate(() => { const k = Math.min(1, (performance.now() - t0) / 300); m.position.y = y0 - (y0 - FLOORS.A1) * k * k; return k < 1; });
    GAME.later(0.3, () => { CAST.lie('takeshi', t.x, FLOORS.A1, t.z, t.yaw); MAN.a1Blood.visible = true; SFX.thud(p); POST.shake = 0.35; });
    GAME.later(0.7, () => GAME.say([['', 'ドサッ……'], ['ひろし', '……！']]));
  },
  fireOni() {
    const f = STORY.flags, a = MAN.fireAt; if (f.fireOni) return;
    f.fireOni = true; STORY.save(); SFX.push(new THREE.Vector3(a.x, FLOORS.A2 + 0.5, a.z)); POST.shake = 0.2;
    GAME.later(0.6, () => {
      ONI.spawn(a.x, FLOORS.A2, a.z - 0.25, a.yaw, 'script'); POST.shake = 0.35;
      ONI.script = { i: 0, steps: [{ t: 'crawl', d: 1.8, dist: 1.6, drop: 1.1 }, { t: 'call', fn: () => { ONI.bendT = 0; ONI.state = 'appear'; ONI.wait = 0; ONI.appearFor = 0.4; SFX.oniSpot(); POST.shake = 0.4; } }] };
    });
  },
  // the closet doors rattle; then fly open and it comes out, bent double, with Mika's hair
  closetMika(h, flag) {
    const f = STORY.flags;
    if (!h || f[flag] || !PLAYER.alive || GAME.room !== h.room || ONI.on || PLAYER.hidden || STORY.busy) return;
    f[flag] = true; STORY.save();
    const t0 = performance.now(), base = h.doors.map(d => d.userData.baseRy);
    for (let i = 0; i < 5; i++) SFX.knock(h.cam, AU.ok ? AU.t + i * 0.17 : 0, 140, 500, 0.5);
    animate(() => { const k = (performance.now() - t0) / 900; h.doors.forEach((d, i) => { d.rotation.y = base[i] + (i ? 1 : -1) * Math.abs(Math.sin(k * 18)) * 0.07; }); if (k >= 1) h.doors.forEach((d, i) => (d.rotation.y = base[i])); return k < 1; });
    setTimeout(() => {
      if (!PLAYER.alive) return;
      SFX.slam(h.cam); POST.shake = 0.4;
      const t1 = performance.now();
      animate(() => { const k = Math.min(1, (performance.now() - t1) / 160); h.doors.forEach((d, i) => { d.rotation.y = base[i] + (i ? 1 : -1) * 1.45 * k; }); return k < 1; });
      const fwd = new THREE.Vector3(-Math.sin(h.yaw), 0, -Math.cos(h.yaw)), p = h.exitP.clone().addScaledVector(fwd, -0.95);
      ONI.spawn(p.x, h.exitP.y, p.z, h.yaw + Math.PI, 'script'); ONI.setLook('mika');
      ONI.script = { i: 0, steps: [{ t: 'crawl', d: 0.7, dist: 1.25, drop: 0 }, { t: 'call', fn: () => { ONI.bendT = 0; ONI.state = 'appear'; ONI.wait = 0; ONI.appearFor = 0.35; SFX.oniSpot(); } }] };
      setTimeout(() => { const t2 = performance.now(); animate(() => { const k = Math.min(1, (performance.now() - t2) / 500); h.doors.forEach((d, i) => { d.rotation.y = base[i] + (i ? 1 : -1) * 1.45 * (1 - k); }); return k < 1; }); }, 2600);
    }, 950);
  },
  s2Rise() {
    const f = STORY.flags, r = MAN.areas.s2back; if (f.s2Rise) return;
    f.s2Rise = true; STORY.save();
    const hid = () => PLAYER.hidden && PLAYER.hidden.room === r;
    GAME.later(2.4, () => { if (GAME.room !== r && !hid()) return; SFX.heartbeat && SFX.heartbeat(0.8); SFX.push(PLAYER.pos.clone()); POST.shake = 0.15; });
    GAME.later(5.0, () => {
      if (!PLAYER.alive || ONI.on || (GAME.room !== r && !hid())) { f.s2RiseDone = true; STORY.save(); return; }
      const x = cx(23), z = cx(-9);
      ONI.spawn(x, FLOORS.S2, z, yawTo({ x, z }, PLAYER.pos), 'script');
      ONI.script = { i: 0, steps: [{ t: 'rise', d: 1.8 }, { t: 'call', fn: () => {
        // you hid in time: it looks round the room, goes to the desk, and is gone
        if (hid()) { ONI.script = { i: 0, steps: [{ t: 'look', d: 3.0 }, { t: 'go', p: new THREE.Vector3(cx(23.5), FLOORS.S2, cx(-10.6)), sp: 1.6 }, { t: 'look', d: 1.6 }, { t: 'gone', fn: () => { f.s2RiseDone = true; STORY.save(); } }] }; return; }
        ONI.state = 'appear'; ONI.wait = 0; ONI.appearFor = 0.4; SFX.oniSpot(); POST.shake = 0.4;
      } }] };
    });
  },
  codeOni() {
    const f = STORY.flags, r = MAN.areas.abcorC; if (f.codeOni) return;
    f.codeOni = true; STORY.save();
    GAME.later(1.4, () => {
      if (!PLAYER.alive || ONI.on || GAME.room !== r) { f.codeOni = false; STORY.save(); return; }
      const x = cx(22), z = cx(-18), q = new THREE.Vector3(x, FLOORS.AB, z);
      SFX.oniStep(q, 0.9); ONI.spawn(x, FLOORS.AB, z, yawTo(q, PLAYER.pos), 'appear'); ONI.appearFor = 1.0;
      GAME.later(0.3, () => { if (ONI.on) { SFX.oniSpot(); POST.shake = 0.3; } });
      GAME.later(0.8, () => { const d = MAN.doors.abcorC_B; SFX.oniStep(d.front, 0.95); SFX.locked(d.center); });
    });
  },
  // the study, after the screws in the hole: rats run out of it, then something white squeezes out after them
  fuwatty() {
    const f = STORY.flags, hole = MAN.studyHole, r = MAN.areas.s2study;
    if (f.fuwatty || !hole || GAME.room !== r || !PLAYER.alive) return;
    f.fuwatty = true; STORY.save();
    const hp = hole.getWorldPosition(new THREE.Vector3()), fy = FLOORS.S2, mat = new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: 0.9 });
    const rats = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group(), b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat); b.scale.set(0.8, 0.65, 1.5); b.position.y = 0.07; g.add(b);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.28, 4), mat); tail.rotation.x = Math.PI / 2 - 0.15; tail.position.set(0, 0.05, -0.27); g.add(tail);
      g.position.set(hp.x, hp.y - 0.2, hp.z + 0.12); g.visible = false; scene.add(g); rats.push(g);
    }
    const t0 = performance.now();
    animate(() => {
      const t = (performance.now() - t0) / 1000;
      rats.forEach((g, i) => {
        const s = t - i * 0.35; if (s < 0) return; g.visible = s < 2.6;
        if (s < 0.25) { const k = s / 0.25; g.position.set(hp.x + i * 0.05, hp.y - 0.2 - (hp.y - 0.2 - fy) * k * k, hp.z + 0.12 + 0.25 * k); g.rotation.y = 0; }
        else { const k = s - 0.25, a = -Math.PI / 2 + 0.3 * Math.sin(k * 6 + i); g.rotation.y = a; g.position.set(hp.x + i * 0.05 - k * 3.4, fy, hp.z + 0.37 + 0.4 * Math.sin(k * 3 + i) + i * 0.15); }
      });
      if (t > 4) { rats.forEach(g => scene.remove(g)); return false; }
      return true;
    });
    for (let i = 0; i < 4; i++) SFX.squeak(hp, i * 0.3);
    GAME.later(0.8, () => say2('チュー、チュー……', '穴から、ネズミが出てきた。'));
    GAME.later(2.4, () => {
      if (!PLAYER.alive) return;
      SFX.push(hp.clone()); POST.shake = 0.25;
      ONI.spawn(hp.x, fy, hp.z + 0.4, 0, 'script'); ONI.setLook('fuwatty');
      ONI.script = { i: 0, steps: [{ t: 'squeeze', d: 0.9, lift: 0.95 }, { t: 'crawl', d: 0.6, dist: 0.9, drop: 0 }, { t: 'call', fn: () => { ONI.bendT = 0; ONI.state = 'appear'; ONI.wait = 0; ONI.appearFor = 0.5; SFX.oniSpot(); POST.shake = 0.3; } }] };
    });
  },
});

/* ---------- light, shadow, Takuro at your side ---------- */
function abLightsOn() {
  for (const r of MAN.list) if (r.fl === 'AB') { r.dark = false; for (const fx of r.fixtures) if (fx.kind !== 'candle') fx.state = 'on'; }
  if (MAN.abLeverPiv) MAN.abLeverPiv.rotation.x = -0.6;
}
function a1Shadow() {
  const f = STORY.flags, lit = f.a1Dark && f.bulbHead;
  if (MAN.dollShadow) { MAN.dollShadow.visible = lit; MAN.dollWallShadow.visible = lit; }
  if (MAN.doll3BulbMat) MAN.doll3BulbMat.emissiveIntensity = lit ? 2.4 : 0.2;
  if (MAN.doll3Fx) MAN.doll3Fx.state = lit ? 'on' : 'off';
}
const FOLLOW = {
  id: null,
  place() { const c = CAST.get(this.id), b = pushAt(PLAYER.pos, PLAYER.yaw, -1.4); c.m.visible = true; c.dead = false; c.m.position.set(b.x, PLAYER.pos.y, b.z); c.m.rotation.set(0, PLAYER.yaw + Math.PI, 0); c.base = null; },
  tick(dt) {
    if (!this.id || GAME.state !== 'play') return;
    const c = CAST.get(this.id), m = c.m, p = PLAYER.pos;
    if (!m.visible || Math.abs(m.position.y - p.y) > 2.5) { this.place(); return; }
    const dx = p.x - m.position.x, dz = p.z - m.position.z, d = Math.hypot(dx, dz);
    if (d > 9) { this.place(); return; }
    if (d > 2.0 && !GAME.busy) {
      const sp = Math.min(6, (d - 1.6) * 3), np = new THREE.Vector3(m.position.x + dx / d * sp * dt, m.position.y, m.position.z + dz / d * sp * dt);
      WORLD.collide(np, 0.3, m.position.y, 1.6); m.position.copy(np); m.rotation.y = Math.atan2(dx, dz); c.moving = true;
    } else { c.moving = false; m.rotation.y += clamp(angDiff(m.rotation.y, Math.atan2(dx, dz)), -3 * dt, 3 * dt); }
  },
};

/* ---------- items used from the item screen, here ---------- */
STORY.useItem2 = function (id, t) {
  const has = x => this.has(x), f = this.flags, ia = t && t.ia, tag = ia && ia.tag, door = ia && ia.ref;
  const swap = (a, b, c, d, line) => { this.use(a); this.use(b); this.give(c); this.give(d); SFX.pickup(); say2(line); this.save(); return true; };
  // the screwdriver's bits
  if (tag === 'b1panel' && f.b1Shelves && !f.b1Panel) {
    if (id === 'driverMinus') { f.b1Panel = true; MAN.b1Panel.visible = false; SFX.unlock(PLAYER.pos.clone()); say2('－ドライバーでネジを外した。', 'パネルの裏に、金庫がある。'); this.save(); return true; }
    if (id === 'driver') { say2('ネジの頭の形が合わない。'); return true; }
    if (id === 'bitMinus' || id === 'bitPlus') { say2('ドライバーに付けないと使えない。'); return true; }
  }
  if ((id === 'bitMinus' && has('driver')) || (id === 'driver' && has('bitMinus'))) return swap('driver', 'bitMinus', 'driverMinus', 'bitPlus', 'ドライバーの芯を－に付け替えた。');
  if ((id === 'bitPlus' && has('driverMinus')) || (id === 'driverMinus' && has('bitPlus') && !tag && !door)) return swap('driverMinus', 'bitPlus', 'driver', 'bitMinus', 'ドライバーの芯を＋に付け替えた。');
  const isDriver = id === 'driver' || id === 'driverMinus';
  if (isDriver && tag === 'device' && !f.devOpen) { f.devOpen = true; MAN.abDevice.redraw((g, w, h) => drawDevice(g, w, h, 1)); SFX.unlock(PLAYER.pos.clone()); say2('ドライバーでネジを外した。', 'ふたが外れて、たくさんの黒い穴が出てきた。'); this.save(); return true; }
  if (isDriver && tag === 'studyHole' && !f.studyScrews) {
    f.studyScrews = true; SFX.unlock(PLAYER.pos.clone());
    GAME.later(0.6, () => { framesFall(true); SFX.crash && SFX.crash(PLAYER.pos.clone().setY(PLAYER.pos.y + 2)); POST.shake = 0.3; });
    say2('ドライバーでネジを外した。', '……ガシャン！', 'どこかで、何かが割れる音がした。'); this.save();
    GAME.later(1.6, () => EVENTS.fuwatty()); return true;
  }
  // lighting things
  if (id === 'lighter' && tag && /^candle(B1|A1|SBJ|SBD)$/.test(tag)) {
    if (!f.oilUsed) { say2('オイルが入っていない。'); return true; }
    if (!GAME.lighterOn) GAME.toggleLighter();
    ({ candleB1: EVENTS.bjCandle, candleA1: EVENTS.a1Candle, candleSBJ: () => EVENTS.candleGen('sbjCandle'), candleSBD: () => EVENTS.candleGen('sbdCandle') })[tag]();
    return true;
  }
  if ((id === 'oil2' && has('lighter')) || (id === 'lighter' && has('oil2') && !f.oilUsed)) { this.use('oil2'); f.oilUsed = true; SFX.lighter(); say2('ライターにオイルを補給した。'); this.save(); return true; }
  // the fireplace: the doll for fuel, then the lighter
  if (tag === 'fireplace' && MAN.fire.state !== 'on') {
    if (id === 'doll') { this.use('doll'); f.dollIn = true; MAN.fireDoll.visible = true; say2('暖炉に人形を置いた。'); this.save(); return true; }
    if (id === 'lighter') {
      if (!f.dollIn) { say2('燃やせる物がない。'); return true; }
      if (!f.oilUsed) { say2('オイルが入っていない。'); return true; }
      MAN.fire.state = 'on'; f.fireLit = true; MAN.fireDoll.visible = false; MAN.props.stoneRed.visible = !this.hasGot('stoneRed'); SFX.lighter(); POST.flash = 0.4;
      MAN.poster.redraw((g, w, h) => drawPoster(g, w, h, f.code.poster));
      say2('暖炉に火をつけた。', '人形が燃えていく……。', '燃えかすの中で、何かが光っている。'); this.save(); return true;
    }
  }
  // the doll with no eyes: the two stones; then, headless, the light bulb
  if (tag === 'doll3') {
    if ((id === 'stoneRed' || id === 'stoneBlue') && !f.dollHeadOff) {
      this.use(id); f[id === 'stoneRed' ? 'eyeRed' : 'eyeBlue'] = true; dollEyes();
      if (f.eyeRed && f.eyeBlue) { f.dollHeadOff = true; MAN.doll3.userData.head.visible = false; SFX.push(PLAYER.pos.clone()); say2('目に石をはめた。', '……ポロッ', '人形の首が外れた。'); this.give('dollHead'); GAME.later(0.1, () => GAME.say([['', '人形の頭を手に入れた。']])); }
      else say2('目に石をはめた。');
      this.save(); return true;
    }
    if (id === 'bulb' && f.dollHeadOff && !f.bulbHead) { this.use('bulb'); f.bulbHead = true; MAN.doll3Bulb.visible = true; a1Shadow(); say2('人形に、電球の頭をつけた。'); this.save(); return true; }
  }
  if (tag === 'dollPanel' && id === 'dollHead' && !f.dollPanel) { this.use('dollHead'); f.dollPanel = true; MAN.a1Panel.visible = false; SFX.unlock(PLAYER.pos.clone()); say2('パネルの絵に、人形の頭をはめた。', 'パネルが外れて、金庫が出てきた。'); this.save(); return true; }
  // things put together
  if ((id === 'vinegar' && has('keyRed')) || (id === 'keyRed' && has('vinegar'))) { this.use('vinegar'); this.use('keyRed'); this.give('k_lattice'); SFX.pickup(); say2('赤い鍵を酢にひたして、錆を落とした。', '格子戸の鍵になった。'); this.save(); return true; }
  if ((id === 'disc' && has('rod')) || (id === 'rod' && has('disc'))) { this.use('disc'); this.use('rod'); this.give('k_hidden'); SFX.pickup(); say2('円盤の穴に、金属の棒を差しこんだ。', '隠し扉の鍵になった。'); this.save(); return true; }
  // looked at in the hand
  if (id === 'book') { UI.book(BOOK_PAGES, () => { if (!this.has('book')) return; this.use('book'); this.give('bookmark'); SFX.pickup(); say2('絵本の間から、しおりが出てきた。', 'しおりを手に入れた。'); this.save(); }); return true; }
  if (id === 'bookmark') {
    if (tag === 'device' && f.devOpen && !f.devColor) { f.devColor = true; MAN.abDevice.redraw((g, w, h) => drawDevice(g, w, h, 2)); say2('しおりをかざした。', '穴が、４色に染まって見える。'); this.save(); return true; }
    UI.view(canvasImg(240, 120, (g, w, h) => { g.fillStyle = '#efe6d0'; g.fillRect(0, 0, w, h); ['#d02020', '#2040d0', '#20a040', '#e8c818'].forEach((c, i) => { g.fillStyle = c; g.globalAlpha = 0.55; g.fillRect(10 + i * 56, 10, 52, h - 20); }); g.globalAlpha = 1; }), '４色に色分けされた、透けるしおり。'); return true;
  }
  if (id === 'disc') { UI.view(canvasImg(260, 260, drawDisc), '円盤だ。外側の色と、内側の矢印。'); return true; }
  // the second annex
  if (id === 'shard' && door && door.kind === 'hidden2' && !f[door.def.reveal]) {
    if (door.id === 'br_cloister' && !f.shadowSeen) { say2('ここでは使えない。'); return true; }
    if (door.id === 'corBAB_hid') return false;
    f[door.def.reveal] = true; showHiddenDoor(door, true); SFX.paper(); say2('皿の破片で、壁紙を切りさいた。', '扉が出てきた。'); this.save(); return true;
  }
  if (id === 'ladder' && tag === 'hole') { this.use('ladder'); f.ladderHung = true; MAN.ropeS1.visible = true; MAN.ropeDark.visible = true; say2('縄ばしごを穴にかけた。'); this.save(); return true; }
  if (id === 'stick' && tag === 'jailBars' && !this.hasGot('k_study')) { this.use('stick'); GAME.take('k_study', MAN.props.k_study); return true; }
  if (id === 'dice' && tag === 'diceWall' && !f.diceUsed) { this.use('dice'); f.diceUsed = true; MAN.diceWall.redraw((g, w, h) => drawDiceWall(g, w, h, f.code.dice)); say2('サイコロの絵に、サイコロを当てた。', '黒丸が、１つずつ白く変わった。'); this.save(); return true; }
  if (/^piece[123]$/.test(id) && tag === 'pieceFrame' && !f.piecesSet) {
    const ps = this.inv.filter(x => /^piece[123]$/.test(x)); ps.forEach(x => this.use(x)); f.piecesN = (f.piecesN || 0) + ps.length;
    MAN.pieceFrame.redraw((g, w, h) => drawPieceFrame(g, w, h, f.piecesN)); SFX.unlock(PLAYER.pos.clone());
    if (f.piecesN >= 3) { f.piecesSet = true; say2('青いピースを、額にはめた。', 'ガチャッ', '奥の扉の鍵が開いた。'); } else say2('青いピースを、額にはめた。');
    this.save(); return true;
  }
  return false;
};
const BOOK_PAGES = [
  '<div class="bk"><b>あおい　おに</b><br><br>むかし　むかし、<br>おおきな　おやしきに<br>あおい　おにが　すんでいました。</div>',
  '<div class="bk">おには　いつも　ひとりぼっち。<br>こどもたちが　あそびにくると、<br>うれしくて　おいかけました。</div>',
  '<div class="bk">こどもたちは　にげました。<br>たんすに　かくれた　こは<br>みつかりませんでした。</div>',
  '<div class="bk">おには　きょうも　まっています。<br>だれかが　やってくるのを。<br><br>おしまい</div>',
];
function drawDisc(g, w, h) {
  const cxp = w / 2, cyp = h / 2, R = w * 0.46, seq = ['#d02020', '#e8c818', '#e8c818', '#2040d0', '#e8c818', '#d02020'];
  g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, w, h);
  seq.forEach((c, i) => { const a0 = -Math.PI / 2 + i * TAU / 6 + 0.04, a1 = a0 + TAU / 6 - 0.08; g.fillStyle = c; g.beginPath(); g.moveTo(cxp, cyp); g.arc(cxp, cyp, R, a0, a1); g.closePath(); g.fill(); });
  g.fillStyle = '#d8d2c0'; g.beginPath(); g.arc(cxp, cyp, R * 0.55, 0, TAU); g.fill();
  g.strokeStyle = '#222'; g.lineWidth = 7; g.beginPath(); g.arc(cxp, cyp, R * 0.36, -Math.PI / 2 + 0.25, Math.PI * 1.2); g.stroke();
  const ea = Math.PI * 1.2, ex = cxp + Math.cos(ea) * R * 0.36, ey = cyp + Math.sin(ea) * R * 0.36;
  g.fillStyle = '#222'; g.beginPath(); g.moveTo(ex - 14, ey - 4); g.lineTo(ex + 6, ey - 16); g.lineTo(ex + 4, ey + 8); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(cxp, cyp - R * 0.5); g.lineTo(cxp - 10, cyp - R * 0.33); g.lineTo(cxp + 10, cyp - R * 0.33); g.closePath(); g.fill();   // where it starts
}
function dollEyes() { const f = STORY.flags, e = MAN.doll3.userData.eyes; e[0].material = e[0].material.clone(); e[1].material = e[1].material.clone(); if (f.eyeRed) { e[0].material.color.setHex(0xd02020); e[0].scale.setScalar(1.3); } if (f.eyeBlue) { e[1].material.color.setHex(0x2040d0); e[1].scale.setScalar(1.3); } }
function framesFall(now) {
  STORY.flags.framesFell = true;
  MAN.studyFrame.visible = false; MAN.s2Frame.visible = false; MAN.s2FrameDown.visible = true; MAN.props.piece1.visible = !STORY.hasGot('piece1');
  if (now) { const fr = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.65), MAT.darkWood); fr.position.set(MAN.studySafe.position.x + 0.2, FLOORS.S2 + 0.02, MAN.studySafe.position.z + 0.5); scene.add(fr); MAN.extraMeshes = (MAN.extraMeshes || []).concat(fr); }
}

/* ---------- special doors ---------- */
const prevDoorHook = STORY.doorHook.bind(STORY);
STORY.doorHook = function (d) {
  const f = this.flags, df = d.def;
  if (d.kind === 'hidden2' && !f[df.reveal]) {
    if (d.id === 'corBAB_hid') return { prompt: f.abShelf ? '切れ目を調べる' : null, use: () => { f.abHidDoor = true; showHiddenDoor(d, true); SFX.push(d.center); say2('壁を押すと、隠し扉が開いた。'); this.save(); } };
    if (d.id === 'br_cloister') return { prompt: f.shadowSeen ? '影がさしている壁を調べる' : null, use: () => say2('人形の影が、この壁をさしている。') };
    if (d.id === 's2front_back') return { prompt: '壁を調べる', use: () => say2('ここだけ、落書きがない。') };
    return { prompt: null, use: () => {} };
  }
  if (d.kind === 'code' && !f.codeOpen) return { prompt: '扉を調べる', use: () => { SFX.locked(d.center); say2('扉に、４色の棒のような模様が描かれている。', '鍵がかかっている。横に装置がある。'); } };
  if (d.kind === 'pieces' && !f.piecesSet) return { prompt: '扉を調べる', use: () => { SFX.locked(d.center); say2('開かない。', '横の額に、くぼみが３つある。'); } };
  if (df.stuck && !f[df.stuck]) return { prompt: '開ける', use: () => { SFX.locked(d.center); say2('開かない。'); } };
  if (df.unstick && !f[df.unstick]) return { prompt: '開ける', use: () => { f[df.unstick] = true; SFX.unlock(d.center); UI.hint('内側から扉を開けた'); this.save(); GAME.later(0.4, () => GAME.goThrough(d)); } };
  if ((d.id === 'sbdark_cor' || d.id === 'sbcorA_dark') && f.darkLocked) return { prompt: '開ける', use: () => { SFX.locked(d.center); say2('開かない。'); } };
  if (d.id === 'a1bridge_hall' && d.lock && !this.has(d.lock)) return { prompt: '扉を調べる', use: () => { SFX.locked(d.center); say2('鍵がかかっている。', '扉の向こうは、別館のようだ。'); } };
  return prevDoorHook(d);
};
STORY.doorShut2 = function (d) {
  const f = this.flags, df = d.def, p = d.to && MAN.doors[d.to];
  for (const x of [d, p]) {
    if (!x) continue;
    if (x.kind === 'hidden2' && !f[x.def.reveal]) return true;
    if (x.kind === 'code' && !f.codeOpen) return true;
    if (x.kind === 'pieces' && !f.piecesSet) return true;
    if (x.def.stuck && !f[x.def.stuck]) return true;
  }
  void df;
  return (d.id === 'sbdark_cor' || d.id === 'sbcorA_dark') && f.darkLocked;
};
// rooms where it does not turn up by chance (scenes still to come there)
const prevQuiet = DIRECTOR.quiet.bind(DIRECTOR);
DIRECTOR.quiet = function (r) {
  const f = STORY.flags;
  if (prevQuiet(r)) return true;
  if (!r) return true;
  if ((r.id === 'a1bl' || r.id === 'a1corB') && f.tkDropArmed && !f.tkOniDone) return true;
  if ((r.id === 'back' && STORY.hasGot('k_annex') && !f.backOniDone) || (r.id === 'a2fire' && !f.fireOniDone && !f.fireLit)) return true;
  if ((r.id === 's1bl' && !f.mikaCl1Done) || (r.id === 'back' && f.lit_bjCandle && !f.mikaCl2Done) || (r.id === 's2back' && !f.s2RiseDone) || (r.id === 's2study' && f.studyScrews && !f.fuwattyDone)) return true;
  if ((r.id === 'abcorC' || r.id === 'abfront') && f.codeOpen && !f.codeOniDone) return true;
  return (r.id === 'big' && f.mikaB1 && !f.mikaOniDone) || r.id === 'a1left' || r.id === 'abback' || ((r.id === 'abhidA' || r.id === 'abhidB') && !f.hidChaseDone) || (r.id === 's2tl' && !f.sproutChaseDone) || r.id === 'sboni' || r.id === 'cloister';
};

/* ---------- on entering rooms ---------- */
ROOM_HOOKS.push((r, via, quiet) => {
  const f = STORY.flags;
  if (r.fl === 'A1' && !f.a1Entered) { f.a1Entered = true; if (f.oilUsed && STORY.has('lighter')) { f.oilUsed = false; GAME.lighterOn = false; GAME.later(0.6, () => say2('ライターの火が消えた。', 'オイルが切れてしまったようだ。')); } }
  if (r.id === 'big') {
    if (f.mikaB1 && !f.mikaOni) { const m = r.mikaAt; CAST.place('mika', m.x, FLOORS.B1, m.z, Math.PI); }
  } else if (r.fl === 'B1') CAST.hide('mika');
  // the room of dolls: the empty noose; then (once he ran, and you are back with the doll's head) Takeshi hanging from it;
  // after the safe, on the floor; once it has come after you, only the blood
  if (r.id === 'a1bl') {
    if (f.tkOni) { CAST.hide('takeshi'); MAN.a1Blood.visible = true; }
    else if (f.tkFell) { const t = r.tkDown; CAST.lie('takeshi', t.x, FLOORS.A1, t.z, t.yaw); MAN.a1Blood.visible = true; }
    else if (f.takeshiRan && f.dollHeadOff) {
      tkHang();
      if (!f.tkFound) { f.tkFound = true; STORY.save(); GAME.later(0.6, () => GAME.say([['', '……！'], ['ひろし', 'た……たけし……！'], ['', 'たけしが、天井から下がった縄で首をつっている。']])); }
    } else CAST.hide('takeshi');
  } else if (r.fl === 'A1' && !FOLLOW.id) CAST.hide('takeshi');
  // out of the room of dolls after the body dropped: it comes out after you, with Takeshi's hair
  if (r.id === 'a1corB' && f.tkFell && !f.tkOni && !quiet) {
    f.tkOni = true; STORY.save(); CAST.hide('takeshi');
    GAME.later(1.5, () => { if (PLAYER.alive && !ONI.on) oniThrough('corB1_bl', 'takeshi', 0.6); });
  }
  // Mika-oni bursts out of a closet, twice: the back exit's, on your way back from the jail (she has only just turned);
  // and the room bottom left downstairs in the second annex
  if (r.id === 'back' && !f.mikaCl2 && f.mikaOni && f.lit_bjCandle && !STORY.hasGot('k_annex') && !quiet) GAME.later(1.6, () => EVENTS.closetMika(MAN.backCloset, 'mikaCl2'));
  if (r.id === 's1bl' && !f.mikaCl1 && !quiet) GAME.later(2.2, () => EVENTS.closetMika(MAN.s1Closet, 'mikaCl1'));
  // the room behind the graffiti: a while after you come in it rises out of the floor (hide in the closet before it does)
  if (r.id === 's2back' && !f.s2Rise && !quiet) EVENTS.s2Rise();
  // through the door with the code: it is in the corridor ahead (and something at the door behind you)
  if (r.id === 'abcorC' && f.codeOpen && !f.codeOni && !quiet) EVENTS.codeOni();
  if (r.id === 'abhidB' && f.takuroWith && !f.hidChase) GAME.later(0.8, () => EVENTS.hidChase());
  // the crate goes back to where it was whenever you come in (so it can never be stuck in a corner)
  if (r.id === 'a3crate' && !f.crateIn) { MAN.crate.place(cx(20), cx(-1)); MAN.crate.tile = [20, -1]; f.crateAt = null; }
  // the room top left of the second annex's upper floor: it grows up out of the floor
  if (r.id === 's2tl' && !f.sproutChase && !quiet) {
    f.sproutChase = true; STORY.save();
    const x = cx(5.5), z = cx(-10.5);
    GAME.later(0.8, () => { ONI.spawn(x, FLOORS.S2, z, yawTo({ x, z }, PLAYER.pos), 'script'); ONI.script = { i: 0, steps: [{ t: 'rise', d: 1.8 }, { t: 'call', fn: () => { ONI.state = 'appear'; ONI.wait = 0; ONI.appearFor = 0.4; SFX.oniSpot(); POST.shake = 0.4; } }] }; });
  }
  // the room of them, the first time: a narrow way past the bars
  if (r.id === 'sboni' && !f.oniRoom1) MAN.oniCrowd.forEach(m => (m.root.visible = true));
  if (r.id === 'sboni' && f.oniRoom1 && !f.oniRoom2) { f.oniRoom2 = true; MAN.oniCrowd.forEach(m => (m.root.visible = false)); STORY.save(); }
  void via;
});

/* ---------- every frame ---------- */
TICK_HOOKS.push(dt => {
  const f = STORY.flags, r = GAME.room, P = PLAYER.pos;
  if (!r || !PLAYER.alive) return;
  FOLLOW.tick(dt);
  if (f.hidChaseDone && !STORY.hasGot('k_back') && MAN.props.k_back && !MAN.props.k_back.visible) MAN.props.k_back.visible = true;
  // Takeshi, hanging: a slow sway; after the safe, as you go for the door, he drops
  const tk = CAST.list.takeshi;
  if (tk && tk.hang && tk.m.visible && r.id === 'a1bl') { tk.m.rotation.y = MAN.areas.a1bl.tkHang.yaw + Math.sin(GAME.time * 0.45) * 0.12; tk.m.rotation.z = Math.sin(GAME.time * 0.9) * 0.025; }
  if (r.id === 'a1bl' && f.tkDropArmed && !f.tkFell && tk && tk.hang && !GAME.busy && !GAME.modal && !STORY.busy && near2(MAN.doors.bl_corB1.front, 3.2)) EVENTS.tkDrop();
  // the back way out of the basement, with the annex key: it comes in from the big room behind you
  if (r.id === 'back' && STORY.hasGot('k_annex') && !f.backOni && !ONI.on && !GAME.busy && !GAME.modal && !STORY.busy && near2(MAN.doors.back_bridge.front, 2.6)) {
    f.backOni = true; STORY.save(); oniThrough('back_big', null, 0.5);
  }
  // the fireplace, when you come up to it with the doll to burn: it crawls out of it
  if (r.id === 'a2fire' && !f.fireOni && !f.fireLit && STORY.hasGot('doll') && !ONI.on && !GAME.busy && !GAME.modal && !STORY.busy && near2(MAN.fireAt, 3.8)) EVENTS.fireOni();
  // Mika at the back of the big room
  if (r.id === 'big' && f.mikaB1 && !f.mikaOni && !GAME.busy && !GAME.modal && CAST.list.mika && near2(CAST.list.mika.m.position, 4.6)) EVENTS.mikaTurn();
  // the statue, pushed into the stairs of the way between the buildings: down it goes
  if (PUSH.obj === MAN.statue && !f.statueBroken) {
    const s = MAN.stairs.stA1dn, q = MAN.statue.g.position, wq = new THREE.Vector3(q.x, FLOORS[MAN.statue.r.fl], q.z);
    if (MAN.statue.r.fl === 'A1' && onStair(s, wq)) {
      PUSH.obj = null; f.statueBroken = true; const g = MAN.statue.g, z0 = g.position.z, y0 = g.position.y, t0 = performance.now();
      SFX.push(wq); animate(() => { const k = Math.min(1, (performance.now() - t0) / 900); g.position.z = z0 + (tm(s.farZ) - z0) * k; g.position.y = y0 + s.rise * k; g.rotation.x = k * 2.5; if (k >= 1) g.visible = false; return k < 1; });
      MAN.statue.col.on = false;
      GAME.later(1.0, () => { SFX.crash && SFX.crash(wq); POST.shake = 0.4; MAN.rubble.visible = true; MAN.props.stoneBlue.visible = true; say2('ガラガラガラ……ガシャーン！', '像が、階段を転げ落ちていった。'); STORY.save(); });
    }
  }
  // the floor of corridor A gives way (once you have the basement key). In 6.23 the corridor is one tile of floor, so
  // walking along it you are sure to step there: here it gives way under you on whichever side of the corridor you
  // are, a little way in; after that the hole stays where it opened, to fall through again (or step round)
  if (r.id === 'a1corA' && STORY.hasGot('k_ab') && !GAME.busy && !GAME.modal) {
    const h = MAN.a1Hole;
    if (h.m.visible ? Math.abs(P.x - h.x) < 0.75 && Math.abs(P.z - h.z) < 0.75 : Math.abs(P.x - h.x) < 0.75) {
      if (!h.m.visible) { f.a1HoleZ = h.z = cx(Math.floor(P.z / T)); h.m.position.z = h.z; }
      h.m.visible = true; f.a1Fell = true; dropTo('abstair', cx(13), cx(12), Math.PI, f.a1FellOnce ? null : '床が抜けて、下に落ちてしまった。'); f.a1FellOnce = true;
    }
  }
  // the hole in the room top left upstairs in the second annex
  if (r.id === 's2tl' && !GAME.busy && !GAME.modal) { const h = MAN.s2Hole; if (Math.hypot(P.x - h.x, P.z - h.z) < 0.6) { const L = MAN.areas.s1tl.landing; dropTo('s1tl', L.x, L.z, Math.PI, f.s2FellOnce ? null : '穴から、下の階に落ちた。'); f.s2FellOnce = true; } }
  // the crowd behind the bars: as you get to the end of the narrow way they all turn to you
  if (r.id === 'sboni' && !f.oniRoom1 && !GAME.busy && P.x > tm(8.3)) {
    f.oniRoom1 = true; STORY.busy = true; PLAYER.frozen = true; SFX.heartbeat && SFX.heartbeat(1);
    const t0 = GAME.time;
    animate(() => { const k = Math.min(1, (GAME.time - t0) / 1.2); for (const m of MAN.oniCrowd) { const want = Math.atan2(P.x - m.root.position.x, P.z - m.root.position.z); m.root.rotation.y += angDiff(m.root.rotation.y, want) * 0.08; } return k < 1 || GAME.time - t0 < 2.4; });
    GAME.later(2.2, () => { POST.shake = 0.5; SFX.oniSpot(); });
    GAME.later(2.8, () => {
      const d = MAN.doors.sbjail_oni; GAME.busy = 1;
      GAME.fade(0.4, () => { PLAYER.pos.copy(d.front); PLAYER.camY = d.front.y + 1.58; PLAYER.yaw = d.yawIn; PLAYER.pitch = 0; GAME.room = d.area; GAME.onEnterRoom(d.area); }, () => { GAME.busy = 0; PLAYER.frozen = false; STORY.busy = false; say2('……！', '思わず、部屋を飛び出した。'); STORY.save(); });
    });
  }
});

/* ---------- the house, built: lights and places that follow from the story so far ---------- */
BUILT_HOOKS.push(() => {
  const f = STORY.flags;
  if (!f.code.poster) f.code.poster = String(100 + ((Math.random() * 900) | 0));
  if (!f.code.dice) { const s = []; while (s.length < 4) { const v = (Math.random() * 6) | 0; if (v !== s[s.length - 1]) s.push(v); } f.code.dice = s; }
  MAN.stairs.stABh.shut = true; MAN.stairs.stS1dn.shut = true;
  MAN.areas.bjail.lightFx = null; MAN.areas.a1left.lightFx = null;
  for (const [k, room] of [['bjCandle', 'bjail'], ['a1Candle', 'a1left'], ['sbjCandle', 'sbjail'], ['sbdCandle', 'sbdark']]) { MAN[k].key = k; MAN.areas[room].lightFx = MAN[k]; }
  for (const r of MAN.list) if (r.fl === 'AB' && r.dark) for (const fx of r.fixtures) if (fx.kind !== 'candle') fx.state = 'off';
  MAN.doll3Fx = MAN.areas.a1br.addFixture({ local: new THREE.Vector3(MAN.doll3.position.x, 1.3, MAN.doll3.position.z), color: 0xffe0a0, intensity: 4.2, range: 9, kind: 'bulb', mats: [], shadow: true, state: 'off' });
  MAN.doll3Fx.level = 0;
  MAN.oniCrowd.forEach(m => (m.root.visible = false));
  FOLLOW.id = null;
});
STATE_HOOKS.push(f => {
  const got = id => STORY.hasGot(id);
  if (f.b1Shelves) for (const sh of [MAN.b1ShelfL, MAN.b1ShelfR]) sh.place(sh.g.position.x + sh.dx, sh.g.position.z);
  if (f.b1Panel) MAN.b1Panel.visible = false;
  for (const k of ['bjCandle', 'a1Candle', 'sbjCandle', 'sbdCandle']) if (f['lit_' + k]) MAN[k].state = 'on';
  if (f.statueBroken) { MAN.statue.g.visible = false; MAN.statue.col.on = false; MAN.rubble.visible = true; MAN.props.stoneBlue.visible = !got('stoneBlue'); }
  else if (f.pushed && f.pushed.statue) { const q = f.pushed.statue; if (MAN.areas[q[2]]) MAN.statue.moveTo(MAN.areas[q[2]]); MAN.statue.place(q[0], q[1]); }
  if (f.dollIn && !f.fireLit) MAN.fireDoll.visible = true;
  if (f.fireLit) { MAN.fire.state = 'on'; MAN.props.stoneRed.visible = !got('stoneRed'); MAN.poster.redraw((g, w, h) => drawPoster(g, w, h, f.code.poster)); }
  if (f.eyeRed || f.eyeBlue) dollEyes();
  if (f.dollHeadOff) MAN.doll3.userData.head.visible = false;
  if (f.bulbHead) MAN.doll3Bulb.visible = true;
  if (f.a1Dark) for (const fx of MAN.areas.a1br.fixtures) if (fx !== MAN.doll3Fx) fx.state = 'off';
  a1Shadow();
  if (f.dollPanel) MAN.a1Panel.visible = false;
  if (got('k_ab') && !f.tkFell) f.tkDropArmed = true;   // (a game saved before he hung there)
  if (f.fireLit) f.fireOni = f.fireOniDone = true;
  if (f.a1Fell) { const h = MAN.a1Hole; h.m.visible = true; if (f.a1HoleZ) h.m.position.z = h.z = f.a1HoleZ; }
  if (got('bulb')) MAN.a2Bulb.state = 'off';
  if (f.crateIn) { const c = MAN.crate, h = MAN.crateHole; c.place(h.x, h.z); c.g.position.y = -0.93; c.col.on = false; h.col.on = false; h.m.visible = false; }
  else if (f.crateAt) { MAN.crate.place(cx(f.crateAt[0]), cx(f.crateAt[1])); MAN.crate.tile = f.crateAt.slice(); }
  if (f.abLights) abLightsOn();
  if (f.abPot) { MAN.abPot.at = 1; MAN.abPot.place(MAN.abPot.g.position.x + 1.0, MAN.abPot.g.position.z + 0.3); }
  if (f.abCurtain) { MAN.abCurtain.visible = false; MAN.abCurtainCol.on = false; }
  if (f.abDrained) { MAN.abWater.visible = false; MAN.props.keyRed.visible = !got('keyRed'); }
  if (f.abTubMoved) { MAN.abTub.at = 1; MAN.abTub.place(MAN.abTub.g.position.x + tm(2.4), MAN.abTub.g.position.z); MAN.abCover.open(); MAN.stairs.stABh.shut = false; }
  if (f.latOpen) MAN.latGate.snap(true);
  if (f.latDone) { MAN.latPics[1].visible = false; MAN.props.rod.visible = !got('rod'); }
  if (f.devOpen) MAN.abDevice.redraw((g, w, h) => drawDevice(g, w, h, f.devColor ? 2 : 1));
  if (f.abShelf) { MAN.abLowShelf.at = 1; MAN.abLowShelf.place(MAN.abLowShelf.g.position.x - tm(1.1), MAN.abLowShelf.g.position.z); }
  for (const id of ['corBAB_hid', 'br_cloister', 's2front_back']) { const d = MAN.doors[id]; if (f[d.def.reveal]) showHiddenDoor(d, true); }
  if (f.ladderCut) MAN.ropeAB.visible = false;
  if (f.hidChase) { f.hidChaseDone = true; f.takuroWith = false; }
  MAN.props.k_back.visible = !!f.hidChase && !got('k_back');
  if (f.takuroWith) { FOLLOW.id = 'takuro'; }
  if (f.diceUsed) MAN.diceWall.redraw((g, w, h) => drawDiceWall(g, w, h, f.code.dice));
  if (f.altarMoved) { MAN.altar.at = 1; MAN.altar.place(MAN.altar.g.position.x + tm(2.2), MAN.altar.g.position.z); MAN.chCover.open(); MAN.stairs.stS1dn.shut = false; }
  if (f.curtains) f.curtains.forEach((o, i) => { const c = MAN.curtains[i]; c.open = o; c.mesh.scale.x = o ? 0.25 : 1; c.mesh.position.x = o ? c.x - 0.65 : c.x; });
  if (f.ladderHung) { MAN.ropeS1.visible = true; MAN.ropeDark.visible = true; }
  if (f.framesFell) framesFall(false);
  if (f.oniRoom1) f.oniRoom2 = true;
  if (f.piecesN) MAN.pieceFrame.redraw((g, w, h) => drawPieceFrame(g, w, h, f.piecesN));
  if (f.takuroWith2) FOLLOW.id = 'takuro';
  if (f.mikaOni) f.mikaOniDone = true;
  if (f.sproutChase) f.sproutChaseDone = true;
});
