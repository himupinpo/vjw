
// ================= ルール（オリジナル）：ぬりあい・ゾーン争奪・旗とり・ボール運び =================
const RULES = {
  turf: { name: 'ぬりあいバトル', desc: '3分間で、ぬった広さを競う' },
  zone: { name: 'ゾーン争奪', desc: 'まんなかのゾーンを6割ぬって確保し、カウントを先に0に' },
  flag: { name: '旗とり', desc: '相手の旗を、自分の旗の所へ持ち帰る。先に3回で勝ち' },
  ball: { name: 'ボール運び', desc: 'まんなかのボールを相手のゴールへ。とどけば勝ち、時間切れなら遠くまで運んだほう' }
};
const RULE_IDS = Object.keys(RULES);
const RS = { flags: {}, ball: null, score: [0, 0, 0], best: [0, 0, 0], goal: 0, group: null, hud: '' };

const flagHome = t => ({ x: 0, z: t === 1 ? STAGE.flagZ : -STAGE.flagZ });
const goalOf = t => flagHome(3 - t);   // ボール運び：チームtは相手の旗の台をめざす
function rulesClear() {
  if (RS.group) { world.remove(RS.group); RS.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); }); }
  RS.group = null; RS.flags = {}; RS.ball = null; RS.score = [0, 0, 0]; RS.best = [0, 0, 0]; RS.goal = 0;
}
function standMesh(x, z, col, tall) {
  const g = new T.Group(), y = hAt(x, z);
  const ring = new T.Mesh(new T.RingGeometry(1.4, 1.8, 32), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .85, side: T.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .05; g.add(ring);
  const base = new T.Mesh(new T.CylinderGeometry(.9, 1.1, .25, 20), new T.MeshStandardMaterial({ color: 0x3a3a44, roughness: .5 })); base.position.y = .12; g.add(base);
  if (tall) { const beam = new T.Mesh(new T.CylinderGeometry(.25, .25, 14, 10, 1, true), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .3, depthWrite: false })); beam.position.y = 7; g.add(beam); }
  g.position.set(x, y, z); return g;
}
function flagMesh(col) {
  const g = new T.Group();
  const pole = new T.Mesh(new T.CylinderGeometry(.06, .06, 3.0, 8), new T.MeshStandardMaterial({ color: 0xdedede, metalness: .5, roughness: .3 })); pole.position.y = 1.5; g.add(pole);
  const clothG = new T.PlaneGeometry(1.6, 1.0, 10, 3); clothG.translate(.8, 0, 0);
  const cloth = new T.Mesh(clothG, new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .25, side: T.DoubleSide, roughness: .6 })); cloth.position.y = 2.45; cloth.castShadow = true; g.add(cloth);
  const knob = new T.Mesh(new T.SphereGeometry(.13, 10, 8), new T.MeshStandardMaterial({ color: 0xffd040, metalness: .6, roughness: .3 })); knob.position.y = 3.05; g.add(knob);
  g.userData.cloth = cloth; return g;
}
function rulesInit(mode) {
  rulesClear();
  if (mode !== 'flag' && mode !== 'ball') return;
  RS.group = new T.Group(); world.add(RS.group);
  if (mode === 'flag') {
    for (const t of [1, 2]) {
      const h = flagHome(t), m = flagMesh(teamColor(t));
      RS.group.add(standMesh(h.x, h.z, teamColor(t), true), m);
      RS.flags[t] = { team: t, hx: h.x, hz: h.z, x: h.x, z: h.z, y: hAt(h.x, h.z), state: 'home', carrier: null, dropT: 0, mesh: m };
      m.position.set(h.x, hAt(h.x, h.z), h.z);
    }
  } else {
    const [bx, bz] = STAGE.ball;
    const m = new T.Group();
    const sph = new T.Mesh(new T.SphereGeometry(.5, 24, 16), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .15, metalness: .1, emissive: 0x333333 })); sph.position.y = .5; m.add(sph);
    const ring = new T.Mesh(new T.TorusGeometry(.65, .06, 8, 28), new T.MeshBasicMaterial({ color: 0xffffff })); ring.position.y = .5; m.add(ring);
    m.userData.sph = sph; m.userData.ring = ring;
    RS.group.add(m);
    RS.ball = { hx: bx, hz: bz, x: bx, z: bz, y: hAt(bx, bz), state: 'free', carrier: null, idleT: 0, mesh: m };
    m.position.set(bx, hAt(bx, bz), bz);
    for (const t of [1, 2]) { const g = goalOf(t); RS.group.add(standMesh(g.x, g.z, teamColor(t), true)); }   // チームtのゴール（相手の陣地）
  }
}
function carrierOf(a) {
  if (G.mode === 'flag') { for (const t of [1, 2]) if (RS.flags[t] && RS.flags[t].carrier === a) return RS.flags[t]; }
  if (G.mode === 'ball' && RS.ball && RS.ball.carrier === a) return RS.ball;
  return null;
}
const ruleSpeedMul = a => carrierOf(a) ? (G.mode === 'ball' ? .8 : .9) : 1;
const ruleNoDive = a => !!carrierOf(a);
const ruleCanFire = a => !(G.mode === 'ball' && RS.ball && RS.ball.carrier === a);
function returnFlag(f) { f.state = 'home'; f.carrier = null; f.x = f.hx; f.z = f.hz; f.y = hAt(f.hx, f.hz); f.dropT = 0; }
function touching(a, x, y, z) { return !a.dead && !a.dummy && !a.sj && Math.hypot(a.x - x, a.z - z) < 1.5 && Math.abs(a.y - y) < 1.8; }
function rulesTick(dt) {
  if (G.mode === 'flag') {
    for (const t of [1, 2]) {
      const f = RS.flags[t];
      if (f.state === 'carried') {
        const c = f.carrier;
        if (!c || c.dead) {
          const gy = hAt(f.x, f.z);
          if (gy < -5) { returnFlag(f); feed(`${teamName(t)}の旗が陣地にもどった`, t); }
          else { f.state = 'dropped'; f.dropT = 10; f.carrier = null; f.y = gy; feed(`${teamName(t)}の旗が落ちた`, t); }
        }
        else {
          f.x = c.x; f.z = c.z; f.y = c.y + .5; reveal(c, .3);
          const own = RS.flags[c.team], home = flagHome(c.team);
          if (own.state === 'home' && Math.hypot(c.x - home.x, c.z - home.z) < 1.9) {
            RS.score[c.team]++; returnFlag(f);
            const mine = c.team === G.me.team; showMsg(mine ? '旗をとった！' : '旗をとられた！', `${RS.score[1]} 対 ${RS.score[2]}`, 1.6); mine ? AU.win() : AU.lose();
            feed(`${c.name} が旗を持ち帰った`, c.team);
            if (RS.score[c.team] >= 3) endMatch();
          }
        }
      } else {
        for (const a of actors) {
          if (!touching(a, f.x, f.y, f.z)) continue;
          if (a.team === t) { if (f.state === 'dropped') { returnFlag(f); feed(`${a.name} が旗をもどした`, t); if (a === G.me) AU.pick(); } }
          else if (!carrierOf(a)) { f.state = 'carried'; f.carrier = a; a.dive = a.swim = false; a.climb = null; feed(`${a.name} が${teamName(t)}の旗をうばった`, a.team); if (a === G.me) { showMsg('旗をうばった！', '自分の旗の所へ持ち帰ろう', 1.5); AU.pick(); } else if (t === G.me.team) { showMsg('旗をうばわれた！', '', 1.2); AU.lose(); } break; }
        }
        if (f.state === 'dropped') { f.dropT -= dt; if (f.dropT <= 0) returnFlag(f); }
      }
      f.mesh.position.set(f.x, f.y, f.z);
      const cl = f.mesh.userData.cloth.geometry.attributes.position;
      for (let i = 0; i < cl.count; i++) { const x = cl.getX(i); cl.setZ(i, Math.sin(clock * 6 + x * 4) * .08 * x); }
      cl.needsUpdate = true;
    }
  }
  if (G.mode === 'ball') {
    const b = RS.ball;
    if (b.state === 'carried') {
      const c = b.carrier;
      if (!c || c.dead) { b.state = 'free'; b.carrier = null; b.idleT = 0; b.y = hAt(b.x, b.z); if (b.y < -5) { b.x = b.hx; b.z = b.hz; b.y = hAt(b.hx, b.hz); } }
      else {
        b.x = c.x; b.z = c.z; b.y = c.y + 1.7; reveal(c, .3);
        const g = goalOf(c.team), d0 = Math.hypot(g.x - b.hx, g.z - b.hz), d = Math.hypot(g.x - c.x, g.z - c.z);
        RS.best[c.team] = Math.max(RS.best[c.team], clamp(1 - d / d0, 0, 1));
        if (d < 2.2) { RS.best[c.team] = 1; RS.goal = c.team; showMsg(c.team === G.me.team ? 'ゴール！' : 'ゴールされた…', '', 2); endMatch(); }
      }
    } else {
      b.idleT += dt;
      if (b.idleT > 15) { b.x = b.hx; b.z = b.hz; b.idleT = 0; }
      b.y = hAt(b.x, b.z);
      for (const a of actors) if (touching(a, b.x, b.y, b.z)) { b.state = 'carried'; b.carrier = a; a.ws = {}; a.dive = a.swim = false; a.climb = null; feed(`${a.name} がボールを持った`, a.team); if (a === G.me) { showMsg('ボールを持った！', '相手のゴールへ運ぼう（持っている間は撃てない）', 1.6); AU.pick(); } break; }
    }
    b.mesh.position.set(b.x, b.y, b.z);
    const col = b.carrier ? teamColor(b.carrier.team) : '#ffffff';
    b.mesh.userData.ring.material.color.set(col); b.mesh.userData.ring.rotation.x = clock * 2; b.mesh.userData.ring.rotation.y = clock * 1.3;
  }
}
const teamName = t => t === (G.me ? G.me.team : 1) ? '味方' : '相手';
function rulesHud() {
  const el = $('ruleBar'); if (!el) return;
  let h = '';
  if (G.mode === 'flag' && RS.flags[1]) {
    const st = t => { const f = RS.flags[t]; return f.state === 'home' ? '陣地' : f.state === 'carried' ? 'うばわれ中' : '落ちている'; };
    h = `<b style="background:${teamColor(1)}">${RS.score[1]}</b><span class="rb">旗 3本先取<small>味方の旗：${st(1)}／相手の旗：${st(2)}</small></span><b style="background:${teamColor(2)};color:#111">${RS.score[2]}</b>`;
  } else if (G.mode === 'ball' && RS.ball) {
    const p = t => Math.round(RS.best[t] * 100), c = RS.ball.carrier;
    h = `<b style="background:${teamColor(1)}">${p(1)}%</b><span class="rb">ボール<small>${c ? c.name + ' が運んでいる' : 'だれも持っていない'}</small></span><b style="background:${teamColor(2)};color:#111">${p(2)}%</b>`;
  }
  if (h !== RS.hud) { RS.hud = h; el.innerHTML = h; }   // 変わったときだけ書きかえる
}
// 結果：勝ったチーム（0 なら引き分け → ぬった広さで決める）と表示
function rulesResult() {
  if (G.mode === 'flag') return { win: RS.score[1] > RS.score[2] ? 1 : RS.score[2] > RS.score[1] ? 2 : 0, line: `旗 <b style="color:${G.pal[0]}">${RS.score[1]}</b> 対 <b style="color:${G.pal[1]}">${RS.score[2]}</b><small>先に3回持ち帰ったチーム（時間切れなら多いチーム）の勝ち</small>` };
  if (G.mode === 'ball') { const w = RS.goal || (RS.best[1] > RS.best[2] + .001 ? 1 : RS.best[2] > RS.best[1] + .001 ? 2 : 0); return { win: w, line: `ボール <b style="color:${G.pal[0]}">${Math.round(RS.best[1] * 100)}%</b> 対 <b style="color:${G.pal[1]}">${Math.round(RS.best[2] * 100)}%</b><small>${RS.goal ? 'ゴールまで運んだチームの勝ち' : '遠くまで運んだチームの勝ち'}</small>` }; }
  return null;
}
// CPU の行き先（このルールで優先する場所）
// 役わり：CPU 3人のうち2人が「攻め(0)」、1人が「守り(1)」
const roleOf = a => a.ai.role ?? (a.ai.role = actors.filter(o => o.team === a.team && o.bot).indexOf(a) % 3 === 2 ? 1 : 0);
function rulesBotGoal(a) {
  const fwd = a.team === 1 ? -1 : 1;   // 相手の陣地へ向かう z の向き
  if (G.mode === 'flag') {
    const myF = RS.flags[a.team], enF = RS.flags[3 - a.team];
    if (!myF || !enF) return null;
    if (enF.carrier === a) { const h = flagHome(a.team); return [h.x, h.z]; }
    if (myF.state === 'carried' && myF.carrier) return [myF.carrier.x, myF.carrier.z];
    if (myF.state === 'dropped') return [myF.x, myF.z];
    if (roleOf(a) === 0) {
      if (enF.state === 'carried' && enF.carrier) return [enF.carrier.x + rand(-3, 3), enF.carrier.z + rand(-3, 3)];
      return [enF.x, enF.z];
    }
    return [myF.hx + rand(-6, 6), myF.hz + fwd * 9 + rand(-3, 3)];
  }
  if (G.mode === 'ball') {
    const b = RS.ball; if (!b) return null;
    if (b.carrier === a) { const g = goalOf(a.team); return [g.x, g.z]; }
    if (b.carrier && b.carrier.team === a.team) return [b.carrier.x + rand(-4, 4), b.carrier.z + fwd * 4];
    if (b.carrier) return [b.carrier.x, b.carrier.z];
    // ボールが落ちている：攻め役と近くの者が取りに行く。ほかはぬりに行く
    if (roleOf(a) === 0 || Math.hypot(b.x - a.x, b.z - a.z) < 20) return [b.x, b.z];
    return null;
  }
  return null;
}
function rulesMini(g, mx, my) {
  if (G.mode === 'flag') for (const t of [1, 2]) { const f = RS.flags[t]; g.fillStyle = teamColor(t); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(mx(f.x), my(f.z) - 6); g.lineTo(mx(f.x) + 6, my(f.z) - 3); g.lineTo(mx(f.x), my(f.z)); g.closePath(); g.fill(); g.stroke(); }
  if (G.mode === 'ball' && RS.ball) { const b = RS.ball; g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.beginPath(); g.arc(mx(b.x), my(b.z), 4, 0, TAU); g.fill(); g.stroke(); for (const t of [1, 2]) { const q = goalOf(t); g.strokeStyle = teamColor(t); g.lineWidth = 2; g.strokeRect(mx(q.x) - 4, my(q.z) - 4, 8, 8); } }
}
