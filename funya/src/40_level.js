// ================= 5つの島（すべてオリジナル） =================
const MECH = [];      // 毎回動かすしかけ
const CPS = [];       // チェックポイント
const HINTS = [];     // 近くに来たら出る説明
const SECS = [{ name: 'はじめの島', sub: 'ISLAND 1' }, { name: '箱の島', sub: 'ISLAND 2' }, { name: 'レバーの島', sub: 'ISLAND 3' }, { name: 'うごく島', sub: 'ISLAND 4' }, { name: 'とびらの島', sub: 'ISLAND 5' }, { name: 'シーソーの島', sub: 'ISLAND 6' }, { name: '風の島', sub: 'ISLAND 7' }, { name: 'ロープウェイの島', sub: 'ISLAND 8' }, { name: 'からくりの島', sub: 'ISLAND 9' }, { name: '鐘の島', sub: 'ISLAND 10' }];
let BELL = null;
const RND = mulberry(4242);

// 浮き島：上は草（top が上の高さ）、下は岩のとんがり（見た目だけ）
function island(cx, cz, w, d, top, hex = 0x8fd06a) {
  box(cx, top - .5, cz, w, 1, d, 'grass', hex);
  box(cx, top - 1.4, cz, w - .2, .8, d - .2, 'stone', 0xb89a86);
  const g = new T.ConeGeometry(1, 1, 7); const m = new T.Mesh(g, mat('stone', 0x9a7f74)); m.scale.set(Math.min(w, d) * .55, Math.min(w, d) * .9 + 2, Math.min(w, d) * .55); m.rotation.x = Math.PI; m.position.set(cx, top - 1.8 - m.scale.y / 2, cz); m.castShadow = true; scene.add(m);
  // 草の上の小物（当たりなし）
  for (let i = 0; i < Math.round(w * d / 14); i++) {
    const x = cx + (RND() - .5) * (w - 1), z = cz + (RND() - .5) * (d - 1);
    const f = new T.Mesh(new T.SphereGeometry(.07 + RND() * .05, 8, 6), mat('soft', [0xffffff, 0xffe066, 0xff9ac0, 0xb8a0ff][RND() * 4 | 0])); f.position.set(x, top + .05, z); scene.add(f);
  }
}
function tree(x, z, top, s = 1) {
  box(x, top + 1.1 * s, z, .36 * s, 2.2 * s, .36 * s, 'wood', 0x9a6a48, { rep: 0 });
  const m = new T.Mesh(new T.SphereGeometry(1.3 * s, 16, 12), mat('soft', [0x7ac85a, 0x5ab06a, 0xf0a0c8][RND() * 3 | 0])); m.position.set(x, top + 2.8 * s, z); m.castShadow = true; scene.add(m);
}
function sign(x, y, z, yaw, lines) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#fff8ee'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#c87a5a'; g.lineWidth = 14; g.strokeRect(7, 7, 498, 242);
  g.fillStyle = '#4a3040'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 44px "M PLUS Rounded 1c", sans-serif';
  lines.forEach((l, i) => g.fillText(l, 256, 128 + (i - (lines.length - 1) / 2) * 62));
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(new T.PlaneGeometry(2, 1), new T.MeshStandardMaterial({ map: t, roughness: .8 })); m.position.set(x, y + 1.6, z); m.rotation.y = yaw; scene.add(m);
  const back = boxMesh(2.1, 1.1, .08, 'wood', 0xb07850, 0); back.position.set(x, y + 1.6, z); back.rotation.y = yaw; back.translateZ(-.05); scene.add(back);
  const post = boxMesh(.12, 1.2, .12, 'wood', 0x8a5a3a, 0); post.position.set(x, y + .6, z); scene.add(post);
}
function checkpoint(x, y, z, yaw, sec, r = 2.4) {
  const ring = new T.Mesh(new T.TorusGeometry(1.1, .08, 10, 40), mat('glow', 0x8af0ff)); ring.position.set(x, y + 1.2, z); ring.rotation.y = yaw; scene.add(ring);
  CPS.push({ x, y, z, yaw, sec, r, ring, on: false });
}
function hint(x, z, r, y0, y1, text) { HINTS.push({ x, z, r, y0, y1, text }); }

function buildLevel() {
  // ================= 1. はじめの島 =================
  island(0, -6, 12, 22, 0);
  checkpoint(0, 0, 2, 0, 0);
  tree(-4.5, 1, 0); tree(4.2, -3, 0, .8); tree(-4, -12, 0, .7);
  sign(3, 0, 1.5, -.3, ['ようこそ！', 'まずは歩いてみよう']);
  hint(0, 2, 4, -1, 3, IN.touchOn ? '左をなぞって歩く・右をなぞって見回す。ジャンプボタンでジャンプ' : 'WASD で歩く・マウスで見回す（クリックで固定）・スペースでジャンプ');
  box(0, .25, -6, 3, .5, 1.6, 'wood', 0xd8a070);                    // 小さな段
  hint(0, -6, 3, -1, 3, '小さな段はジャンプでのぼれます');
  // すきま（2m）→ となりの島
  island(0, -23, 10, 10, 0, 0x9ad878);
  hint(0, -15, 3, -1, 3, 'すきまはジャンプでこえよう');
  // 高いかべ（1.7m）：手でつかんで、よじのぼる
  box(0, .85, -27.5, 10, 1.7, 1, 'stone', 0xd8c8b8);
  island(0, -32, 10, 8, 1.7, 0x9ad878);
  hint(0, -25.5, 3, -1, 3, IN.touchOn ? '高いかべは「左手」「右手」を押したまま上を見て、かべのふちにさわってつかむ。つかんだままジャンプを長押しで、よじのぼる' : '高いかべは左クリック・右クリックを押したまま上を見て、ふちにさわってつかむ。つかんだままスペース長押しで、よじのぼる');
  // 門と大きなボタン（手でたたくと開く）
  for (const s of [-1, 1]) box(s * 3.5, 1.7 + 1.5, -35.6, 3, 3, .8, 'stone', 0xe8d8c8);
  const door = box(0, 1.7 + 1.5, -35.6, 4, 3, .5, 'wood', 0xc06a4a, { kin: true });
  const btnPost = box(2.6, 1.7 + .6, -33.4, .5, 1.2, .5, 'stone', 0xe8d8c8);
  const btn = cyl(2.6, 1.7 + 1.28, -33.4, .3, .16, 'shiny', 0xff4a5a);
  hint(0, -32.5, 3, 1, 5, 'ボタンを手でたたくと、門が開きます');
  const D1 = { open: false, y0: door.b.position.y };
  MECH.push(h => {
    if (!D1.open && handTouches(btn.b)) { D1.open = true; AU.thunk(); toast('門が開いた！'); }
    btn.b.position.y = D1.open ? 1.7 + 1.22 : 1.7 + 1.28; btn.m.position.y = btn.b.position.y;
    kinTo(door.b, 0, D1.open ? D1.y0 + 3.1 : D1.y0, -35.6, .5);
  });
  // ================= 2. 箱の島 =================
  box(0, 1.6, -38.5, 2.4, .2, 5, 'wood', 0xc49a62);                   // 橋
  island(0, -47, 12, 12, 1.7, 0xa8d878);
  checkpoint(0, 1.7, -42, 0, 1);
  for (const [x, z, c] of [[-3.5, -44, 0xe0b070], [-4.6, -47.2, 0xd89a60], [-2.4, -49, 0xc8b080]]) prop(box(x, 1.7 + .5, z, 1, 1, 1, 'crate', c, { mass: 8 }), 1);
  // ふみ板：上に物（か自分）がのっていると、橋がのびる
  const plate = box(3, 1.7 + .05, -50, 1.8, .1, 1.8, 'stripe', 0xffcf4a);
  hint(0, -44, 3.5, 1, 5, '箱は両手でつかむと運べます（手をのばしたまま、さわってつかむ）');
  hint(3, -50, 2.2, 1, 5, '黄色い板に箱をのせると、橋がのびたままになります');
  const bridge = box(0, 1.7 - .17, -50.5, 2.2, .3, 7, 'wood', 0xc49a62, { kin: true });
  const BR = { z0: -50.5, z1: -56 };
  MECH.push(h => {
    const on = plateLoaded(3, -50, .9, 1.7);
    plate.m.position.y = 1.7 + (on ? .01 : .05);
    const t = bridge.b.position.z, want = on ? BR.z1 : BR.z0, sp = on ? 3 : 1.6;
    const nz = t + clamp(want - t, -sp * h, sp * h);
    kinTo(bridge.b, 0, 1.7 - .17, nz, h);
    if (on !== BR.on) { BR.on = on; if (on) AU.click(); }
  });
  island(0, -64, 10, 10, 1.7, 0xa8d878);
  // 高い段（2.6m）：箱を積んで、のぼる
  box(0, 1.7 + 1.3, -69.5, 10, 2.6, 1, 'stone', 0xe0d0c0);
  hint(0, -66, 3.5, 1, 5, '高い段は、箱を運んでかべの前に置き、箱にのぼってから、ふちをつかんでよじのぼろう');
  prop(box(3.2, 1.7 + .5, -62, 1, 1, 1, 'crate', 0xd8a868, { mass: 8 }), 1);
  // ================= 3. レバーの島 =================
  island(0, -75, 10, 10, 4.3, 0xb8e088);
  checkpoint(0, 4.3, -73, 0, 2);
  tree(-3.8, -72, 4.3, .7);
  // レバー：つかんで手前に引くと、向こうの跳ね橋が下りる
  { const bm = boxMesh(.7, .5, .7, 'stone', 0xd0c0b0, 0); bm.position.set(-2.5, 4.3 + .25, -77); scene.add(bm); }   // 台（見た目だけ）
  const lever = box(-2.5, 4.3 + .5 + .6, -77, .16, 1.2, .16, 'metal', 0xff6a4a, { mass: 3, mask: GA });
  lever.b.addShape(new C.Sphere(.2), V3(0, .62, 0)); lever.b.angularDamping = .5;
  const knob = new T.Mesh(new T.SphereGeometry(.18, 16, 12), mat('shiny', 0xffd84a)); knob.position.y = .62; lever.m.add(knob);
  const lvBase = new C.Body({ mass: 0, position: V3(-2.5, 4.3 + .5, -77) }); world.addBody(lvBase);
  const lvH = new C.HingeConstraint(lever.b, lvBase, { pivotA: V3(0, -.6, 0), axisA: V3(1, 0, 0), pivotB: V3(0, 0, 0), axisB: V3(1, 0, 0), maxForce: 1e5 });
  world.addConstraint(lvH);
  const lvAng = () => { const u = V3(0, 1, 0); lever.b.quaternion.vmult(u, u); return Math.atan2(u.z, u.y); };
  hint(-2.5, -77, 2.6, 3, 8, 'レバーの先の玉をつかんで、向こうへ押したおそう');
  const DB = { ang: .3, done: false, t: 0, L: 9.4 };
  // 跳ね橋：向こう岸の手前で立っている
  island(0, -96, 10, 14, 4.3, 0xb8e088);
  const dbr = box(0, 4.3 - .15 + 4.7, -89, 2.6, .3, 9.4, 'wood', 0xa87850, { kin: true });
  const setDB = (a, h) => {   // a=0 で横（下りた）、a=π/2 で立つ。向こう岸のふち（z=-89）が回る軸
    const q = new C.Quaternion(); q.setFromEuler(-a, 0, 0);
    const c = V3(0, DB.L / 2 * Math.sin(a), DB.L / 2 * Math.cos(a)); const px = 0, py = 4.3 - .15 + c.y, pz = -89 + c.z;
    if (h) { kinTo(dbr.b, px, py, pz, h); kinRot(dbr.b, q, h); } else { dbr.b.position.set(px, py, pz); dbr.b.quaternion.copy(q); }
  };
  DB.a = Math.PI / 2; setDB(DB.a, 0);
  for (const s of [-1, 1]) box(s * 1.6, 4.3 + 2.2, -88.7, .4, 4.4, .4, 'wood', 0x8a5a3a);
  MECH.push(h => {
    // レバー：ばねで奥へもどろうとする。手で手前へ引いて、たおしきると跳ね橋が下りる
    DB.ang = lvAng();
    const rest = DB.done ? -.8 : .3; lever.b.torque.x += clamp((rest - DB.ang) * 22, -14, 14) - lever.b.angularVelocity.x * 2 - 3 * GRAV * .68 * Math.sin(DB.ang);
    if (DB.ang < -.38 && !DB.done) { DB.done = true; AU.thunk(); AU.whoosh(); toast('跳ね橋が下りた！'); }
    if (DB.done && DB.a > 0) { DB.a = Math.max(0, DB.a - h * .9); setDB(DB.a, h); if (DB.a === 0) { dbr.b.velocity.setZero(); dbr.b.angularVelocity.setZero(); } }
    else { dbr.b.velocity.setZero(); dbr.b.angularVelocity.setZero(); }
  });
  MECH.leverDone = () => { DB.done = true; DB.a = 0; setDB(0, 0); };
  MECH.resetLever = () => { DB.done = false; DB.a = Math.PI / 2; setDB(DB.a, 0); lever.b.position.set(-2.5, 4.3 + .5 + .6, -77); lever.b.quaternion.set(0, 0, 0, 1); lever.b.velocity.setZero(); lever.b.angularVelocity.setZero(); };
  // ================= 4. うごく島 =================
  checkpoint(0, 4.3, -93, 0, 3);
  tree(3.8, -98, 4.3, .8);
  // 行ったり来たりする台（すきま 12m）
  const mv = box(0, 4.3 - .2, -107, 3, .4, 3, 'shiny', 0x7ab8ff, { kin: true });
  hint(0, -101, 3, 3, 8, '動く台が来たら、のってわたろう');
  const pingpong = (t, per, wait) => { const c = (t % per) / per, w = wait / per; if (c < w) return 0; if (c < .5) return smooth01((c - w) / (.5 - w)); if (c < .5 + w) return 1; return 1 - smooth01((c - .5 - w) / (.5 - w)); };
  MECH.push((h, t) => { const k = pingpong(t, 9, 1.4); kinTo(mv.b, 0, 4.3 - .2, lerp(-105.2, -116.8, k), h); });
  island(0, -123, 10, 10, 4.3, 0xc8e090);
  // 上下するリフト → 高い島へ
  const lift = box(3.2, 4.3 - .2, -124.5, 2.6, .4, 2.6, 'shiny', 0xffa0c8, { kin: true });
  for (const [a, b] of [[-1.45, 1.45], [1.45, 1.45]]) { const pm = boxMesh(.15, 6.4, .15, 'metal', 0x9aa0b0, 0); pm.position.set(3.2 + a, 4.3 + 3.1, -124.5 + b); scene.add(pm); }
  MECH.push((h, t) => { const k = pingpong(t + 3, 10, 2); kinTo(lift.b, 3.2, lerp(4.3 - .2, 10 - .2, k), -124.5, h); });
  hint(3.2, -124.5, 2.4, 3, 12, 'リフトで上へ。上の島へ歩いてうつろう');
  // 高い島（鐘の島）
  island(0, -133, 10, 14, 10, 0xd8e8a0);
  checkpoint(0, 10, -129.5, 0, 4);
  // ================= 5. とびらの島 =================
  // 回るとびら（押して通る）
  const spinner = box(0, 10 + 1.3, -134, 4.2, 2.4, .25, 'wood', 0xd8a070, { mass: 20, mask: GB | GA | GP });
  const hc = new C.HingeConstraint(spinner.b, (() => { const s = new C.Body({ mass: 0, position: V3(0, 10 + 1.3, -134) }); world.addBody(s); return s; })(), { pivotA: V3(0, 0, 0), axisA: V3(0, 1, 0), pivotB: V3(0, 0, 0), axisB: V3(0, 1, 0) });
  world.addConstraint(hc); spinner.b.angularDamping = .6; spinner.b.linearDamping = .9;
  for (const s of [-1, 1]) box(s * 3.6, 10 + 1.3, -134, 2.8, 2.6, .5, 'stone', 0xf0e0d0);
  hint(0, -131.5, 3, 8, 14, '回るとびらは、押して通ろう');
  // ================= 6. シーソーの島 =================
  // シーソーの橋：まんなかが軸。歩いていくと、向こうがわへかたむく
  const saw = box(0, 10 + .05, -146, 1.8, .24, 12.6, 'wood', 0xe0b070, { mass: 40 });
  saw.b.angularDamping = .6;
  { const piv = new C.Body({ mass: 0, position: V3(0, 10 + .05, -146) }); world.addBody(piv);
    world.addConstraint(new C.HingeConstraint(saw.b, piv, { pivotA: V3(0, 0, 0), axisA: V3(1, 0, 0), pivotB: V3(0, 0, 0), axisB: V3(1, 0, 0) })); }
  for (const s2 of [-1, 1]) { const pm = boxMesh(.3, 8, .3, 'wood', 0x8a5a3a, 0); pm.position.set(s2 * 1.1, 10 - 4, -146); scene.add(pm); }
  { const ax = new T.Mesh(new T.CylinderGeometry(.12, .12, 2.4, 10), mat('metal', 0x9aa0b0)); ax.rotation.z = Math.PI / 2; ax.position.set(0, 10 + .05, -146); scene.add(ax); }
  hint(0, -139, 2.5, 8, 14, 'シーソーの橋：まんなかをこえると、向こうへかたむきます');
  island(0, -158, 10, 12, 10, 0xe0e8a0);
  checkpoint(0, 10, -154.5, 0, 5);
  // トランポリン：のると高くはねる
  const tramp = box(0, 10 + .1, -162.6, 2.2, .2, 2.2, 'stripe', 0xff5a7a);
  { const rim = new T.Mesh(new T.TorusGeometry(1.2, .12, 8, 28), mat('shiny', 0x4a8aff)); rim.rotation.x = Math.PI / 2; rim.position.set(0, 10 + .2, -162.6); scene.add(rim); }
  hint(0, -161, 3, 8, 14, 'トランポリンにのると、高くはねます。上の島へ！');
  island(0, -169, 10, 8, 13.5, 0xe8e8b0);
  MECH.push(h => { if (P.onGround && P.gBody === tramp.b && P.jumpT <= 0) { P.body.velocity.y = 14.2; P.jumpT = .3; P.onGround = false; AU.tone(200, 0, .3, 'sine', .15, 520); } });
  // ================= 7. 風の島 =================
  checkpoint(0, 13.5, -167.5, 0, 6);
  // 細い橋に、ときどき横から強い風
  box(0, 13.5 - .2, -178.5, 2.2, .4, 11, 'wood', 0xc49a62);
  const fan = new T.Group(); fan.position.set(-7, 13.5 + 1.5, -178.5); scene.add(fan);
  { const hub = new T.Mesh(new T.CylinderGeometry(.5, .5, .6, 16), mat('metal', 0x9aa0b0)); hub.rotation.z = Math.PI / 2; fan.add(hub);
    const ringM = new T.Mesh(new T.TorusGeometry(2.6, .16, 8, 32), mat('shiny', 0x5ab0ff)); ringM.rotation.y = Math.PI / 2; fan.add(ringM);
    const blades = new T.Group(); fan.add(blades); fan.userData.bl = blades;
    for (let i = 0; i < 4; i++) { const bl = boxMesh(.1, 2.3, .7, 'soft', 0xfff0f6, 0); bl.position.y = 1.15; const g = new T.Group(); g.rotation.x = i * Math.PI / 2; g.add(bl); blades.add(g); }
    const post = boxMesh(.4, 14, .4, 'metal', 0x8a90a0, 0); post.position.y = -7.6; fan.add(post); }
  const streaks = []; for (let i = 0; i < 26; i++) { const m = new T.Mesh(new T.BoxGeometry(1.4, .04, .04), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); scene.add(m); streaks.push({ m, x: -6 + Math.random() * 12, y: 13.7 + Math.random() * 2.6, z: -173 - Math.random() * 11 }); }
  island(0, -189, 10, 10, 13.5, 0xe8e8b0);
  hint(0, -173, 3, 12, 17, '風がふくと横に流されます。風上へ歩いてふんばろう（風がやんだすきに進むのも手）');
  const W = { on: false };
  MECH.push((h, t) => {
    const c = t % 5, on = c > 2.2; if (on && !W.on) AU.whoosh(); W.on = on;
    fan.userData.bl.rotation.x += h * (on ? 14 : 2);
    const inZone = q => q.z < -172.5 && q.z > -184.5 && q.y > 12.5 && q.y < 17 && q.x > -6.5 && q.x < 8;
    if (on) { if (inZone(P.body.position)) { P.body.applyForce(V3(BODY_M * 15, 0, 0), V3()); for (const A of P.arms) A.b.applyForce(V3(ARM_M * 15, 0, 0), V3()); }
      for (const pp of PROPS) if (inZone(pp.b.position)) pp.b.applyForce(V3(pp.b.mass * 12, 0, 0), V3()); }
    for (const s2 of streaks) { s2.x += h * (on ? 16 : 3); if (s2.x > 7) s2.x = -6; s2.m.position.set(s2.x, s2.y, s2.z); s2.m.material.opacity = on ? .55 : .08; }
  });
  // 上むきの風（のぼり風）：まんなかに入ると体が浮いて、上の島へ
  const UP = { x: 0, z: -191.4, r: 1.3, y0: 13.4, y1: 20.6 };
  { const col = new T.Mesh(new T.CylinderGeometry(UP.r, UP.r, UP.y1 - UP.y0 + .6, 24, 1, true), new T.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .22, side: T.DoubleSide, depthWrite: false }));
    col.position.set(UP.x, (UP.y0 + UP.y1) / 2, UP.z); scene.add(col);
    const vent = new T.Mesh(new T.CylinderGeometry(UP.r + .15, UP.r + .25, .2, 24), mat('metal', 0x8a90a0)); vent.position.set(UP.x, 13.5 + .02, UP.z); scene.add(vent); }
  const rings = []; for (let i = 0; i < 6; i++) { const m = new T.Mesh(new T.TorusGeometry(UP.r * .8, .03, 6, 24), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5 })); m.rotation.x = Math.PI / 2; scene.add(m); rings.push(m); }
  hint(0, -190, 2.4, 12, 22, 'のぼり風に入ると、体が浮きます。上についたら前へ');
  MECH.push((h, t) => {
    const q = P.body.position, inside = Math.hypot(q.x - UP.x, q.z - UP.z) < UP.r && q.y > UP.y0 && q.y < UP.y1 + .8;
    if (inside) { const k = q.y < UP.y1 ? 1 : .3; P.body.applyForce(V3(0, BODY_M * (GRAV + 9) * k - P.body.velocity.y * BODY_M * 1.5, 0), V3()); for (const A of P.arms) A.b.applyForce(V3(0, ARM_M * GRAV * 1.1, 0), V3()); P.jumpT = .05; }
    rings.forEach((m, i) => { const yy = UP.y0 + ((t * 2.5 + i * 1.2) % (UP.y1 - UP.y0)); m.position.set(UP.x, yy, UP.z); });
  });
  // ================= 8. ブランコの島 =================
  island(0, -199, 10, 12, 19.5, 0xf0e0b0);
  checkpoint(0, 19.5, -196, 0, 7);
  // ロープウェイ：駅に止まっている取っ手を両手でつかむと、向こうの島まで運んでくれる。着いたら手をはなす
  const RW = { y: 21.3, z0: -203.4, z1: -215.6, t: 0, st: 0 };
  const handle = box(0, RW.y, RW.z0, 1.8, .16, .16, 'shiny', 0xff6a8a, { kin: true });
  { const car = new T.Group(); handle.m.add(car);
    for (const s2 of [-1, 1]) { const r = new T.Mesh(new T.CylinderGeometry(.04, .04, 1.4, 6), mat('metal', 0x9aa0b0)); r.position.set(s2 * .8, .7, 0); car.add(r); }
    const wheel = new T.Mesh(new T.CylinderGeometry(.22, .22, .2, 16), mat('metal', 0x6a7080)); wheel.rotation.z = Math.PI / 2; wheel.position.y = 1.45; car.add(wheel);
    const cap = boxMesh(1.8, .1, .3, 'shiny', 0xff6a8a, 0); cap.position.y = 1.4; car.add(cap); }
  { const cable = new T.Mesh(new T.CylinderGeometry(.03, .03, 18, 6), mat('metal', 0x5a6070)); cable.rotation.x = Math.PI / 2; cable.position.set(0, RW.y + 1.45 + .22, (RW.z0 + RW.z1) / 2); scene.add(cable);
    for (const z of [RW.z0 + 1.6, RW.z1 - 1.6]) { const pm = boxMesh(.3, 3.4, .3, 'wood', 0x8a5a3a, 0); pm.position.set(1.2, 19.5 + 1.7, z); scene.add(pm); const arm = boxMesh(1.4, .2, .2, 'wood', 0x8a5a3a, 0); arm.position.set(.6, 19.5 + 3.3, z); scene.add(arm); }
    sign(-2.6, 19.5, -201.8, 0, ['ロープウェイ', 'つかんでぶら下がる']); }
  hint(0, -203, 2.8, 18, 24, '取っ手が駅に来たら、両手をのばして上を見てつかむ。向こうに着いたら手をはなそう');
  MECH.push(h => {
    // 駅で 3 秒止まり、6 秒で向こうへ（こちらへもどるのも同じ）
    RW.t += h; const per = 18, c = RW.t % per; let k;
    if (c < 3) k = 0; else if (c < 9) k = smooth01((c - 3) / 6); else if (c < 12) k = 1; else k = 1 - smooth01((c - 12) / 6);
    kinTo(handle.b, 0, RW.y, lerp(RW.z0, RW.z1, k), h);
  });
  MECH.resetRope = () => { RW.t = 0; handle.b.position.set(0, RW.y, RW.z0); };
  // ================= 9. からくりの島 =================
  island(0, -221, 10, 14, 19.5, 0xf0d8c0);
  checkpoint(0, 19.5, -215, 0, 8);
  // ぐるぐる回る棒：ジャンプでこえる
  const sweep = box(0, 19.5 + .45, -221, 9, .34, .34, 'stripe', 0xffb020, { kin: true });
  { const hubm = new T.Mesh(new T.CylinderGeometry(.5, .6, .9, 16), mat('metal', 0x8a90a0)); hubm.position.set(0, 19.5 + .45, -221); scene.add(hubm); }
  hint(0, -216.5, 3, 18, 24, '回る棒が来たら、ジャンプでとびこえよう');
  MECH.push(h => { sweep.b.angularVelocity.set(0, 1.25, 0); });
  // くずれる足場：のると少しして落ちる（しばらくすると元にもどる）
  const tiles = [];
  for (const [i, tz] of [-229.2, -231.4, -233.6, -235.8, -238].entries()) { const tl = box(i % 2 ? .4 : -.4, 19.5 - .2, tz, 2, .4, 2, 'stone', 0xd8b8a8, { kin: true }); tiles.push({ b: tl.b, y0: 19.5 - .2, x: tl.b.position.x, z: tz, t: -1 }); }
  hint(0, -227.5, 2.5, 18, 24, 'ひびの入った足場は、のると少しして落ちます。止まらずにわたろう');
  MECH.push(h => {
    for (const tl of tiles) {
      if (tl.t < 0 && (P.gBody === tl.b && P.onGround)) tl.t = 0;
      if (tl.t >= 0) tl.t += h;
      const y = tl.t > .7 && tl.t < 4.5 ? Math.max(tl.y0 - 30, tl.b.position.y - h * Math.min(14, (tl.t - .7) * 18)) : tl.t >= 4.5 ? tl.y0 : tl.y0 + (tl.t > .2 && tl.t <= .7 ? Math.sin(tl.t * 60) * .03 : 0);
      if (tl.t >= 4.5) tl.t = -1;
      kinTo(tl.b, tl.x, y, tl.z, h);
    }
  });
  MECH.resetTiles = () => { for (const tl of tiles) { tl.t = -1; tl.b.position.y = tl.y0; } };
  // ================= 10. 鐘の島 =================
  island(0, -247.6, 10, 16.8, 19.5, 0xfff0c0);
  checkpoint(0, 19.5, -241, 0, 9);
  // 玉を、くぼみに入れると門が開く
  const orb = prop(ball(2.5, 19.5 + .55, -244, .55, 'shiny', 0x7ad0ff, 6), 9);
  const SOCK = { x: -2.5, z: -248 };
  for (const [dx, dz, w2, d2] of [[-.1, -.9, 2, .2], [-1, 0, .2, 1.6]]) box(SOCK.x + dx, 19.5 + .14, SOCK.z + dz, w2, .28, d2, 'shiny', 0xffd84a);   // 奥と左にふち（手前と右は開いている）
  { const mk = new T.Mesh(new T.CircleGeometry(.6, 24), mat('glow', 0x7ad0ff)); mk.rotation.x = -Math.PI / 2; mk.position.set(SOCK.x, 19.5 + .01, SOCK.z); scene.add(mk); }
  for (const s2 of [-1, 1]) box(s2 * 3.6, 19.5 + 1.5, -251, 2.8, 3, .8, 'stone', 0xf0e0d0);
  const gate2 = box(0, 19.5 + 1.5, -251, 4.4, 3, .5, 'wood', 0x7a8ad0, { kin: true });
  hint(2, -243, 3, 18, 24, '青い玉を、光るくぼみまで運ぼう（押してころがしても、両手でかかえても）');
  const G2 = { open: false };
  MECH.push(h => {
    const q = orb.b.position; if (!G2.open && Math.hypot(q.x - SOCK.x, q.z - SOCK.z) < .7 && q.y < 19.5 + .9) { G2.open = true; AU.thunk(); AU.chime(); toast('門が開いた！'); }
    kinTo(gate2.b, 0, G2.open ? 19.5 + 4.6 : 19.5 + 1.5, -251, .5);
  });
  MECH.resetGate2 = () => { G2.open = false; };
  // 鐘：台にのぼって、ひもをつかむ
  const BZ = -254;
  box(0, 19.5 + .6, BZ, 3.4, 1.2, 3, 'stone', 0xf0e0d0);
  for (const s2 of [-1, 1]) box(s2 * 1.5, 19.5 + 1.2 + 1.8, BZ, .3, 3.6, .3, 'wood', 0xa86a48);
  box(0, 19.5 + 1.2 + 3.7, BZ, 3.6, .3, .5, 'wood', 0xa86a48);
  const bell = new T.Mesh(new T.CylinderGeometry(.35, .7, .9, 24, 1, true), mat('metal', 0xffcc44)); bell.material.side = T.DoubleSide; bell.position.set(0, 19.5 + 1.2 + 3.05, BZ); scene.add(bell);
  const rope = box(0, 19.5 + 1.2 + 1.6, BZ, .14, 1.6, .14, 'wood', 0xf0e0c0, { kin: true });
  rope.b.addShape(new C.Box(V3(.32, .16, .32)), V3(0, -.75, 0));
  { const kn = boxMesh(.64, .32, .64, 'soft', 0xff7a90, 0); kn.position.y = -.75; rope.m.add(kn); }
  hint(0, -252.5, 3, 18, 25, '台にのぼって、鐘のひもをつかもう');
  BELL = { mesh: bell, rope, rung: false, t: 0 };
  MECH.push((h, t) => {
    if (!BELL.rung && P.arms.some(A => A.gBody === rope.b)) { BELL.rung = true; clearGame(); }
    if (BELL.rung) { BELL.t += h; bell.rotation.z = Math.sin(BELL.t * 5) * .5 * Math.exp(-BELL.t * .25); }
  });
  // ---------- まわりの景色（当たりなし） ----------
  const cr = mulberry(77);
  const ct = canvasTex(256, (g, s) => { g.clearRect(0, 0, s, s); for (let i = 0; i < 22; i++) { const x = s / 2 + (cr() - .5) * s * .55, y = s / 2 + (cr() - .5) * s * .3, rr = s * (.1 + cr() * .16); const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); } }, false);
  for (let i = 0; i < 90; i++) {
    const m = new T.SpriteMaterial({ map: ct, transparent: true, depthWrite: false, opacity: .9, fog: true, color: [0xffffff, 0xffe8f2, 0xfff2e0][i % 3] });
    const s = new T.Sprite(m), a = cr() * TAU, d = 50 + cr() * 220, y = -40 + cr() * 70, sz = 30 + cr() * 60;
    s.position.set(Math.cos(a) * d, y, -125 + Math.sin(a) * d); s.scale.set(sz, sz * .45, 1); scene.add(s);
  }
  for (let i = 0; i < 14; i++) {   // 遠くの浮き島
    const a = cr() * TAU, d = 70 + cr() * 140, x = Math.cos(a) * d, z = -125 + Math.sin(a) * d, y = -10 + cr() * 60, w = 6 + cr() * 14;
    const top = new T.Mesh(new T.CylinderGeometry(w, w * .9, 2, 10), mat('grass', 0x9ad878)); top.position.set(x, y, z); scene.add(top);
    const rock = new T.Mesh(new T.ConeGeometry(w * .9, w * 1.6, 9), mat('stone', 0x9a7f74)); rock.rotation.x = Math.PI; rock.position.set(x, y - 1 - w * .8, z); scene.add(rock);
    if (cr() < .6) { const t = new T.Mesh(new T.SphereGeometry(w * .3, 12, 10), mat('soft', 0x6ab85a)); t.position.set(x, y + w * .35, z); scene.add(t); }
  }
}
const smooth01 = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
// 手がさわっているか
function handTouches(body) { for (const ce of world.contacts) { if ((ce.bi === body && (ce.bj === P.arms[0].b || ce.bj === P.arms[1].b)) || (ce.bj === body && (ce.bi === P.arms[0].b || ce.bi === P.arms[1].b))) return true; } return P.arms.some(A => A.gBody === body); }
// ふみ板の上に、何かのっているか（箱か自分）
function plateLoaded(x, z, r, top) {
  for (const p of PROPS) { const q = p.b.position; if (Math.abs(q.x - x) < r + .3 && Math.abs(q.z - z) < r + .3 && q.y > top && q.y < top + 1.4) return true; }
  const q = P.body.position; if (P.onGround && Math.abs(q.x - x) < r && Math.abs(q.z - z) < r && q.y > top && q.y < top + 1.6) return true;
  return false;
}
