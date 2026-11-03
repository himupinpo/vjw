// =========================================================================================
//  人：1体＝1つの SkinnedMesh（骨14本）。服は頂点色。歩く・走る・座る・狙う・殴る・倒れるは骨を回して作る
//  服装：私服、トーブ（白い長衣）とグトラ、アバヤとヒジャブ、警察官、主人公
// =========================================================================================
const HUMAN_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.0 });
// 骨の名前と、立った姿勢での位置（親からの相対）
const BONES = [
  ['hips', -1, [0, 0.95, 0]], ['spine', 0, [0, 0.12, 0]], ['chest', 1, [0, 0.22, 0]], ['head', 2, [0, 0.2, 0]],
  ['armL', 2, [0.2, 0.13, 0]], ['foreL', 4, [0, -0.29, 0]], ['armR', 2, [-0.2, 0.13, 0]], ['foreR', 6, [0, -0.29, 0]],
  ['legL', 0, [0.1, -0.04, 0]], ['kneeL', 8, [0, -0.44, 0]], ['legR', 0, [-0.1, -0.04, 0]], ['kneeR', 10, [0, -0.44, 0]],
];
const B = Object.fromEntries(BONES.map((b, i) => [b[0], i]));
const SKIN_TONES = [[.86, .66, .5], [.78, .57, .42], [.66, .47, .33], [.55, .38, .27], [.9, .74, .6], [.45, .31, .22]];
// 部品をひとつ足す：geo を (x,y,z) に置いて、骨 bone（数か関数）に結びつける
function partsBuilder() {
  const pos = [], nor = [], col = [], si = [], sw = [];
  const v = new THREE.Vector3(), n = new THREE.Vector3(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), nm = new THREE.Matrix3();
  function add(geo, at, color, bone, rot = [0, 0, 0], scl = [1, 1, 1]) {
    m.compose(v.set(at[0], at[1], at[2]), q.setFromEuler(e.set(rot[0], rot[1], rot[2])), n.set(scl[0], scl[1], scl[2])); nm.getNormalMatrix(m);
    const P = geo.attributes.position, N = geo.attributes.normal, I = geo.index, cnt = I ? I.count : P.count;
    for (let k = 0; k < cnt; k++) {
      const i = I ? I.getX(k) : k;
      v.fromBufferAttribute(P, i).applyMatrix4(m); n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z);
      const c = typeof color === 'function' ? color(v) : color; col.push(c[0], c[1], c[2]);
      const b = typeof bone === 'function' ? bone(v) : Array.isArray(bone) ? bone : [[bone, 1]];   // 骨は 番号 / [[骨, 重み], …] / 関数
      for (let j = 0; j < 4; j++) { si.push(b[j] ? b[j][0] : 0); sw.push(b[j] ? b[j][1] : 0); }
    }
  }
  function geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    return g;
  }
  return { add, geometry };
}
const G_ = {
  cap: (r, l) => new THREE.CapsuleGeometry(r, l, 3, 8), sph: (r) => new THREE.SphereGeometry(r, 12, 9), box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s), torus: (r, t) => new THREE.TorusGeometry(r, t, 5, 14),
};
// 服の見た目を決める
function outfit(kind, r = Math.random) {
  const skin = pick(SKIN_TONES, r);
  const shirts = [[.9, .9, .88], [.25, .32, .5], [.62, .2, .18], [.3, .45, .32], [.85, .75, .55], [.15, .15, .17], [.55, .58, .62], [.75, .55, .35]];
  const pants = [[.18, .2, .26], [.3, .27, .22], [.55, .5, .42], [.12, .12, .14], [.42, .38, .3]];
  const o = { kind, skin, hair: pick([[.08, .06, .05], [.15, .1, .07], [.25, .18, .1], [.05, .05, .05]], r) };
  if (kind === 'casual') Object.assign(o, { shirt: pick(shirts, r), pants: pick(pants, r), shoes: pick([[.1, .1, .1], [.9, .9, .9], [.4, .28, .18]], r), cap: r() < 0.25 ? pick(shirts, r) : null });
  if (kind === 'thobe') Object.assign(o, { robe: r() < 0.85 ? [.95, .95, .93] : pick([[.82, .78, .7], [.6, .62, .66]], r), ghutra: r() < 0.6 ? 'white' : 'red', shoes: [.35, .25, .15] });
  if (kind === 'abaya') Object.assign(o, { robe: [.07, .07, .08], scarf: r() < 0.6 ? [.07, .07, .08] : pick([[.55, .45, .4], [.3, .3, .4], [.6, .55, .5]], r), shoes: [.1, .1, .1] });
  if (kind === 'police') Object.assign(o, { shirt: [.36, .4, .3], pants: [.26, .28, .22], shoes: [.06, .06, .06], beret: [.12, .2, .34] });
  if (kind === 'player') Object.assign(o, { skin: [.8, .6, .45], hair: [.06, .05, .05], shirt: [.92, .91, .88], jacket: [.24, .27, .3], pants: [.16, .2, .3], shoes: [.88, .88, .86] });
  return o;
}
function buildHumanGeo(o) {
  const P = partsBuilder(), S = o.skin;
  const legBone = side => v => { // ローブの裾は左右の脚に分けて結ぶ（真ん中はなかば）
    const w = smooth(-0.06, 0.06, v.x); const up = smooth(0.95, 0.75, v.y);
    // ひざより下はすねの骨に結ぶ（座る・しゃがむと、裾がももの上からすねにそって垂れる）。上（0.75m より上）は腰とももだけ
    if (side === 'robe') {
      if (up < 1) return [[B.legL, w * up], [B.legR, (1 - w) * up], [B.hips, 1 - up]];
      const k = smooth(0.58, 0.4, v.y);
      return [[B.legL, w * (1 - k)], [B.legR, (1 - w) * (1 - k)], [B.kneeL, w * k], [B.kneeR, (1 - w) * k]];
    }
    return [[B.legL, 1]];
  };
  const torsoBone = v => (v.y > 1.25 ? [[B.chest, 1]] : v.y > 1.05 ? [[B.spine, 1]] : [[B.hips, 1]]);
  const top = o.jacket || o.shirt || o.robe;
  // 胴と腰
  P.add(G_.cap(0.165, 0.32), [0, 1.2, 0], top, torsoBone, [0, 0, 0], [1, 1, 0.66]);
  P.add(G_.cap(0.15, 0.08), [0, 0.95, 0], o.pants || o.robe, [[B.hips, 1]], [0, 0, Math.PI / 2], [1, 1, 0.7]);
  if (o.jacket) { P.add(G_.box(0.17, 0.42, 0.02), [0, 1.22, 0.112], o.shirt, torsoBone); }
  // 首と頭
  P.add(G_.cyl(0.05, 0.055, 0.1), [0, 1.5, 0], S, [[B.head, 1]]);
  P.add(G_.sph(0.112), [0, 1.62, 0.005], S, [[B.head, 1]], [0, 0, 0], [0.92, 1.08, 1]);
  P.add(G_.sph(0.02), [0.04, 1.635, 0.1], [.08, .07, .06], [[B.head, 1]]); P.add(G_.sph(0.02), [-0.04, 1.635, 0.1], [.08, .07, .06], [[B.head, 1]]);
  P.add(G_.box(0.03, 0.04, 0.04), [0, 1.6, 0.11], mulT(S, [.9, .9, .9]), [[B.head, 1]]);
  if (o.kind === 'thobe') {
    const gc = o.ghutra === 'red' ? (v => ((Math.floor(v.x * 40) + Math.floor(v.y * 40)) % 2 ? [.75, .1, .1] : [.95, .95, .95])) : [.97, .97, .96];
    P.add(G_.sph(0.135), [0, 1.66, -0.01], gc, [[B.head, 1]], [0, 0, 0], [1, 0.92, 1.05]);
    P.add(G_.box(0.3, 0.32, 0.06), [0, 1.48, -0.1], gc, v => (v.y > 1.5 ? [[B.head, 1]] : [[B.chest, 1]]));
    P.add(G_.torus(0.11, 0.018), [0, 1.73, -0.005], [.06, .06, .06], [[B.head, 1]], [Math.PI / 2, 0, 0]);
  } else if (o.kind === 'abaya') {
    P.add(G_.sph(0.135), [0, 1.64, -0.012], o.scarf, [[B.head, 1]], [0, 0, 0], [1, 1.05, 1.05]);
    P.add(G_.cyl(0.12, 0.2, 0.22), [0, 1.44, -0.01], o.scarf, v => (v.y > 1.5 ? [[B.head, 1]] : [[B.chest, 1]]));
    // 顔の部分だけ肌色を残す
    P.add(G_.sph(0.1), [0, 1.615, 0.03], S, [[B.head, 1]], [0, 0, 0], [0.85, 1.0, 0.8]);
  } else {
    P.add(G_.sph(0.118), [0, 1.665, -0.012], o.hair, [[B.head, 1]], [0, 0, 0], [0.95, 0.75, 1.0]);
    if (o.cap) { P.add(G_.cyl(0.12, 0.125, 0.07), [0, 1.73, 0], o.cap, [[B.head, 1]]); P.add(G_.box(0.18, 0.015, 0.1), [0, 1.705, 0.12], o.cap, [[B.head, 1]]); }
    if (o.beret) { P.add(G_.sph(0.125), [0.02, 1.72, -0.01], o.beret, [[B.head, 1]], [0, 0, -0.2], [1.05, 0.45, 1.05]); }
  }
  // 腕（肩からひじ、ひじから手）
  for (const [s, arm, fore] of [[1, B.armL, B.foreL], [-1, B.armR, B.foreR]]) {
    const sleeve = o.jacket || o.shirt || o.robe;
    P.add(G_.cap(0.058, 0.2), [s * 0.205, 1.22, 0], sleeve, [[arm, 1]]);
    const foreCol = o.kind === 'casual' && R() < 0.5 ? S : sleeve;
    P.add(G_.cap(0.05, 0.19), [s * 0.205, 0.95, 0], o.kind === 'player' ? o.jacket : foreCol, [[fore, 1]]);
    P.add(G_.sph(0.052), [s * 0.205, 0.78, 0.01], S, [[fore, 1]], [0, 0, 0], [0.8, 1.15, 0.9]);
  }
  // 脚
  if (o.robe) {
    P.add(G_.cyl(0.2, 0.27, 0.86, 14), [0, 0.5, 0], o.robe, legBone('robe'));
    for (const [s, knee] of [[1, B.kneeL], [-1, B.kneeR]]) P.add(G_.box(0.1, 0.07, 0.22), [s * 0.1, 0.035, 0.04], o.shoes, [[knee, 1]]);
  } else {
    for (const [s, leg, knee] of [[1, B.legL, B.kneeL], [-1, B.legR, B.kneeR]]) {
      P.add(G_.cap(0.085, 0.3), [s * 0.1, 0.69, 0], o.pants, [[leg, 1]]);
      P.add(G_.cap(0.068, 0.32), [s * 0.1, 0.27, 0], o.pants, [[knee, 1]]);
      P.add(G_.box(0.1, 0.08, 0.25), [s * 0.1, 0.04, 0.04], o.shoes, [[knee, 1]]);
    }
  }
  return P.geometry();
}
// 人をひとり作る（root：位置と向き、body：倒れるとき回す）。モデルが読めないときの作り方
function makeProcHuman(kind, o2) {
  const o = o2 || outfit(kind);
  const geo = buildHumanGeo(o);
  const bones = BONES.map(([name, parent, p]) => { const b = new THREE.Bone(); b.name = name; b.position.set(p[0], p[1], p[2]); return b; });
  BONES.forEach(([, parent], i) => { if (parent >= 0) bones[parent].add(bones[i]); });
  const mesh = new THREE.SkinnedMesh(geo, HUMAN_MAT);
  mesh.add(bones[0]); mesh.bind(new THREE.Skeleton(bones));
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  const root = new THREE.Group(), body = new THREE.Group(); body.add(mesh); root.add(body);
  scene.add(root);
  const bb = Object.fromEntries(BONES.map(([name], i) => [name, bones[i]]));
  return { root, body, mesh, b: bb, o, phase: Math.random() * 10, anim: 'idle', t: 0, lean: 0 };
}
function disposeProcHuman(h) { scene.remove(h.root); h.mesh.geometry.dispose(); }
// 姿勢：anim = idle / walk / run / sit / aim / punch / fall / lie / surrender / cower。sp=速さ(m/s)
function poseProcHuman(h, dt, sp = 0) {
  const b = h.b, a = h.anim;
  h.t += dt;
  for (const k in b) b[k].rotation.set(0, 0, 0);
  b.hips.position.y = 0.95; h.body.rotation.set(0, 0, 0); h.body.position.set(0, 0, 0);
  if (a === 'walk' || a === 'run' || a === 'flee') {
    const run = a !== 'walk', f = run ? 1.55 + sp * 0.13 : 1.0 + sp * 0.9;
    h.phase += dt * f * Math.PI * 2 * (run ? 0.75 : 0.62);
    const s = Math.sin(h.phase), c = Math.cos(h.phase), amp = run ? 0.85 : 0.5;
    b.legL.rotation.x = -s * amp; b.legR.rotation.x = s * amp;
    b.kneeL.rotation.x = Math.max(0, c) * (run ? 1.5 : 0.7) + 0.05; b.kneeR.rotation.x = Math.max(0, -c) * (run ? 1.5 : 0.7) + 0.05;
    const arm = run ? 0.9 : 0.42;
    b.armL.rotation.x = s * arm; b.armR.rotation.x = -s * arm;
    b.foreL.rotation.x = -(run ? 1.3 : 0.25) - Math.max(0, s) * 0.3; b.foreR.rotation.x = -(run ? 1.3 : 0.25) - Math.max(0, -s) * 0.3;
    b.armL.rotation.z = 0.06; b.armR.rotation.z = -0.06;
    b.spine.rotation.y = s * (run ? 0.18 : 0.08); b.spine.rotation.x = run ? 0.18 : 0.03;
    b.hips.position.y = 0.95 - (run ? 0.06 : 0.02) + Math.abs(c) * (run ? 0.07 : 0.025);
    if (a === 'flee') { b.armL.rotation.x = -2.6 + s * 0.3; b.armR.rotation.x = -2.6 - s * 0.3; b.foreL.rotation.x = -0.6; b.foreR.rotation.x = -0.6; }
  } else if (a === 'sit') {
    b.hips.position.y = 0.95;
    b.legL.rotation.x = b.legR.rotation.x = -1.45; b.kneeL.rotation.x = b.kneeR.rotation.x = 1.35;
    b.armL.rotation.x = b.armR.rotation.x = -1.05; b.foreL.rotation.x = b.foreR.rotation.x = -0.55;
    b.armL.rotation.z = -0.25; b.armR.rotation.z = 0.25; b.spine.rotation.x = -0.12;
  } else if (a === 'aim') {
    // 両手で構える。aimPitch=狙う高さ（上が+）、recoil=撃った直後のはね
    const ap = h.aimPitch || 0, rc = h.recoil || 0;
    b.armR.rotation.x = -1.5 - ap - rc * 0.25; b.armR.rotation.z = 0.15; b.foreR.rotation.x = -0.05 - rc * 0.15;
    b.armL.rotation.x = -1.38 - ap - rc * 0.2; b.armL.rotation.z = -0.55; b.foreL.rotation.x = -0.35;
    b.spine.rotation.y = 0.15; b.spine.rotation.x = -ap * 0.15; b.head.rotation.y = -0.1;
    if (sp > 0.3) {   // 構えたまま歩く（上半身はそのまま、足だけ）
      h.phase += dt * (1.0 + sp * 0.9) * Math.PI * 2 * 0.62;
      const s = Math.sin(h.phase), c = Math.cos(h.phase), amp = Math.min(0.55, 0.25 + sp * 0.06);
      b.legL.rotation.x = -s * amp; b.legR.rotation.x = s * amp;
      b.kneeL.rotation.x = Math.max(0, c) * 0.7 + 0.05; b.kneeR.rotation.x = Math.max(0, -c) * 0.7 + 0.05;
      b.hips.position.y = 0.93 + Math.abs(c) * 0.025;
    } else { b.legL.rotation.x = -0.12; b.legR.rotation.x = 0.12; b.kneeL.rotation.x = b.kneeR.rotation.x = 0.08; b.hips.position.y = 0.93; }
  } else if (a === 'punch') {
    const k = Math.min(1, h.t / 0.12), back = h.t > 0.22 ? smooth(0.22, 0.4, h.t) : 0, hit = k * (1 - back);
    const R_ = h.punchSide ? b.armL : b.armR, F_ = h.punchSide ? b.foreL : b.foreR;
    R_.rotation.x = -0.4 - hit * 1.15; F_.rotation.x = -1.6 + hit * 1.5; R_.rotation.z = (h.punchSide ? -1 : 1) * 0.2;
    const O_ = h.punchSide ? b.armR : b.armL, OF = h.punchSide ? b.foreR : b.foreL; O_.rotation.x = -0.6; OF.rotation.x = -1.9;
    b.spine.rotation.y = (h.punchSide ? 0.35 : -0.35) * hit; b.legL.rotation.x = -0.2; b.legR.rotation.x = 0.25;
  } else if (a === 'surrender') {
    b.armL.rotation.x = b.armR.rotation.x = -2.9; b.armL.rotation.z = -0.3; b.armR.rotation.z = 0.3; b.foreL.rotation.x = b.foreR.rotation.x = -0.4;
  } else if (a === 'cower') {
    b.hips.position.y = 0.55; b.legL.rotation.x = b.legR.rotation.x = -1.6; b.kneeL.rotation.x = b.kneeR.rotation.x = 2.4; b.spine.rotation.x = 0.5;
    b.armL.rotation.x = b.armR.rotation.x = -2.4; b.foreL.rotation.x = b.foreR.rotation.x = -1.6; b.head.rotation.x = 0.5;
  } else if (a === 'fall' || a === 'lie') {
    const k = a === 'lie' ? 1 : smooth(0, 0.55, h.t);
    h.body.rotation.x = -Math.PI / 2 * k; h.body.position.y = 0.13 * k; h.body.position.z = -0.9 * k;
    b.armL.rotation.z = 0.6 * k; b.armR.rotation.z = -0.6 * k; b.legL.rotation.z = 0.12 * k; b.legR.rotation.z = -0.12 * k;
    b.kneeL.rotation.x = 0.3 * k; b.head.rotation.y = 0.5 * k;
  } else if (a === 'getup') {
    const k = 1 - smooth(0, 0.8, h.t);
    h.body.rotation.x = -Math.PI / 2 * k; h.body.position.y = 0.13 * k; h.body.position.z = -0.9 * k;
  } else { // idle：息をする・重心を少し移す
    const s = Math.sin(h.t * 1.6 + h.phase);
    b.spine.rotation.x = s * 0.02; b.armL.rotation.z = 0.08 + s * 0.02; b.armR.rotation.z = -0.08 - s * 0.02;
    b.armL.rotation.x = 0.05; b.armR.rotation.x = 0.05; b.foreL.rotation.x = b.foreR.rotation.x = -0.12;
    b.hips.rotation.z = Math.sin(h.t * 0.4 + h.phase) * 0.03; b.head.rotation.y = Math.sin(h.t * 0.3 + h.phase * 2) * 0.35;
  }
  if (h.lookPitch) b.head.rotation.x += h.lookPitch;
}
// 手のひらの位置（銃を持たせる）
const _hand = new THREE.Vector3();
function handPosProc(h, out) { h.b.foreR.updateWorldMatrix(true, false); return out.set(0, -0.2, 0.02).applyMatrix4(h.b.foreR.matrixWorld); }

// =========================================================================================
//  モデルの人（Quaternius「Ultimate Modular Men / Women」CC0）：ページの最後に埋めこんだデータ（humans.json / humans.bin）から作る
//  1体＝SkinnedMesh 1つ（骨62本・平らな面の低ポリ）。服や肌の色は「色番号→色」の表（パレット）で1体ずつ変える
//  動きは元のアニメーション（立つ・歩く・走る・銃を構える・撃つ・殴る・倒れる…）。狙う高さ・座る・手を上げるは骨を足して回す
// =========================================================================================
const HUMAN_DATA = { chars: null, bin: null, tmpl: {}, clips: {} };
const HUMAN_SCALE = 0.95;   // 元は 1.85m ほど
const H_HAIR = ['Hair', 'Hair_Brown', 'Hair_Blond', 'Eyebrows', 'Moustache'], H_KEEP = ['Eye', 'Visor', 'Gold', 'Earrings'];
const H_LOOKS = {   // 服装の種類 → 使うモデル
  casual: ['M_Casual_2', 'M_Casual_Hoodie', 'M_Worker', 'M_Farmer', 'M_Punk', 'M_Beach', 'M_Adventurer', 'M_Suit', 'W_Casual', 'W_Formal', 'W_Suit', 'W_Worker', 'W_Punk', 'W_Adventurer'],
  thobe: ['M_Casual_2', 'M_Suit', 'M_Casual_Hoodie', 'M_Beach'], abaya: ['W_Formal', 'W_Suit', 'W_Casual'], police: ['M_Swat', 'M_Swat', 'W_Soldier'], player: ['M_Casual_2'],
};
const H_CLOTH = [[.85, .84, .8], [.2, .26, .42], [.55, .17, .14], [.24, .38, .27], [.8, .68, .48], [.12, .12, .13], [.5, .52, .56], [.66, .45, .28], [.35, .22, .4], [.18, .42, .5], [.75, .58, .2]];
const boneName = n => n.replace(/[\[\]\.:\/]/g, '_');   // three.js の名前の決まり（UpperArm.L → UpperArm_L）
const _hv = new THREE.Vector3(), _hm = new THREE.Matrix4(), _hq = new THREE.Quaternion(), _hq2 = new THREE.Quaternion(), _hq3 = new THREE.Quaternion();
// 色番号ごとの色（肌・髪・目はそのまま種類、服は服装ごと）を、シェーダーの表から引く材質
function humanMaterial(pal, flat = true) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0, flatShading: flat });
  const u = { value: pal };
  m.onBeforeCompile = sh => {
    sh.uniforms.uPal = u;
    sh.vertexShader = 'attribute float slot;\nvarying float vSlot;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vSlot = slot;');
    sh.fragmentShader = 'uniform vec3 uPal[16];\nvarying float vSlot;\n' + sh.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( uPal[ int( vSlot + 0.5 ) ], opacity );');
  };
  m.customProgramCacheKey = () => 'humanPalette';
  return m;
}
// アニメーション（男女べつ）。三つの骨（指・ひざの向き）は入れていない
function buildHumanClips(json) {
  const b = HUMAN_DATA.bin;
  for (const [gender, clips] of Object.entries(json.clips)) {
    const out = {};
    for (const [name, c] of Object.entries(clips)) {
      const tracks = c.tracks.map(([bone, kind, to, n, vo]) => {
        const t = new Float32Array(b, to, n);
        if (kind === 'q') {
          const raw = new Int16Array(b, vo, n * 4), v = new Float32Array(n * 4);
          for (let i = 0; i < n * 4; i += 4) { let x = raw[i] / 32767, y = raw[i + 1] / 32767, z = raw[i + 2] / 32767, w = raw[i + 3] / 32767; const l = Math.hypot(x, y, z, w) || 1; v[i] = x / l; v[i + 1] = y / l; v[i + 2] = z / l; v[i + 3] = w / l; }
          return new THREE.QuaternionKeyframeTrack(boneName(bone) + '.quaternion', t, v);
        }
        return new THREE.VectorKeyframeTrack(boneName(bone) + '.position', t, new Float32Array(b, vo, n * 3));
      });
      out[name] = new THREE.AnimationClip(name, c.dur, tracks);
    }
    // 構えたまま歩く：下半身は歩き、上半身は銃を向けた形
    const lower = /^(Root|Body|Hips|UpperLeg|LowerLeg|Foot)/;
    out.WalkLower = new THREE.AnimationClip('WalkLower', out.Walk.duration, out.Walk.tracks.filter(t => lower.test(t.name)));
    out.GunUpper = new THREE.AnimationClip('GunUpper', out.Idle_Gun_Pointing.duration, out.Idle_Gun_Pointing.tracks.filter(t => !lower.test(t.name)));
    HUMAN_DATA.clips[gender] = out;
  }
}
// 種類ごとに1回だけ：形（位置・骨の番号と重み・色番号）、骨の初期位置、頭と腰の位置（かぶり物・長衣・座る高さ）
function humanTmpl(key) {
  if (HUMAN_DATA.tmpl[key]) return HUMAN_DATA.tmpl[key];
  const C = HUMAN_DATA.chars[key], b = HUMAN_DATA.bin, bx = C.box;
  const q = new Uint16Array(b, C.pos[0], C.pos[1]), pos = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) { const a = i % 3; pos[i] = bx[a] + q[i] / 65535 * (bx[a + 3] - bx[a]); }
  const joint = new Uint8Array(b, C.joint[0], C.joint[1]), weight = new Uint8Array(b, C.weight[0], C.weight[1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(joint, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(weight, 4, true));
  g.setAttribute('slot', new THREE.BufferAttribute(new Uint8Array(b, C.slot[0], C.slot[1]), 1));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(b, C.idx[0], C.idx[1]), 1));
  g.computeVertexNormals();   // 面は平らに塗るが、影の計算には頂点の向きが要る（ないと全身が影になる）
  g.userData.shared = true;
  const ibm = new Float32Array(b, C.ibm[0], C.ibm[1]), inv = C.bones.map((_, i) => new THREE.Matrix4().fromArray(ibm, i * 16));
  const J = n => C.bones.findIndex(bd => bd[0] === n);
  const bindPos = n => new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(inv[J(n)]).invert());   // 骨の、初めの姿勢での位置
  // 頭：頭の骨にほぼ全部の重みがある頂点の範囲
  const hj = J('Head'), hb = new THREE.Box3();
  for (let i = 0; i < pos.length / 3; i++) for (let k = 0; k < 4; k++) if (joint[i * 4 + k] === hj && weight[i * 4 + k] > 200) hb.expandByPoint(_hv.fromArray(pos, i * 3));
  // 色番号ごとの、頂点の平均の高さ（低いものは靴）
  const slot = g.attributes.slot.array, sy = new Float32Array(16), sn = new Float32Array(16);
  for (let i = 0; i < slot.length; i++) { sy[slot[i]] += pos[i * 3 + 1]; sn[slot[i]]++; }
  const slotY = Array.from(sy, (v, i) => (sn[i] ? v / sn[i] : 1));
  const T = { key, C, g, inv, J, head: hb, slotY, hipY: bindPos('Hips').y, kneeY: (bindPos('LowerLeg.L').y + bindPos('LowerLeg.R').y) / 2, legX: Math.abs(bindPos('UpperLeg.L').x) };
  return (HUMAN_DATA.tmpl[key] = T);
}
// 長衣（トーブ・アバヤ）：腰からくるぶしまでの筒。上は腰、下は左右の脚（ひざより下はすね）に結ぶ
function robeGeo(T, flare) {
  if (T.robe && T.robe[flare]) return T.robe[flare];
  const top = T.hipY + 0.1, bot = 0.06, segR = 18, segY = 10, P = [], SI = [], SW = [], I = [];
  const jH = T.J('Hips'), jUL = T.J('UpperLeg.L'), jUR = T.J('UpperLeg.R'), jLL = T.J('LowerLeg.L'), jLR = T.J('LowerLeg.R');
  for (let iy = 0; iy <= segY; iy++) {
    const f = iy / segY, y = top + (bot - top) * f, r = 0.17 + (flare - 0.17) * Math.pow(f, 0.8);
    for (let ia = 0; ia <= segR; ia++) {
      const a = ia / segR * Math.PI * 2, x = Math.sin(a) * r, z = Math.cos(a) * r * 0.82 + 0.01;
      P.push(x, y, z);
      const w = smooth(-0.07, 0.07, x), up = smooth(top, top - 0.22, y), k = smooth(T.kneeY + 0.08, T.kneeY - 0.08, y);
      const ws = up < 1 ? [[jUL, w * up], [jUR, (1 - w) * up], [jH, 1 - up], [jH, 0]] : [[jUL, w * (1 - k)], [jUR, (1 - w) * (1 - k)], [jLL, w * k], [jLR, (1 - w) * k]];
      const s = ws.reduce((a2, b2) => a2 + b2[1], 0) || 1;
      for (const [j, wt] of ws) { SI.push(j); SW.push(wt / s); }
    }
  }
  for (let iy = 0; iy < segY; iy++) for (let ia = 0; ia < segR; ia++) { const a = iy * (segR + 1) + ia, b2 = a + segR + 1; I.push(a, b2, a + 1, a + 1, b2, b2 + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4)); g.setIndex(I); g.computeVertexNormals();
  g.userData.shared = true; (T.robe = T.robe || {})[flare] = g; return g;
}
// かぶり物：グトラ（白や赤白の布＋黒い輪）、ヒジャブ。頭の骨につける（頭の大きさに合わせる）
function headwearGeo(T, type) {
  const k = 'hw_' + type; if (T[k]) return T[k];
  const hb = T.head, c = hb.getCenter(new THREE.Vector3()), sz = hb.getSize(new THREE.Vector3()), rx = sz.x / 2 * 1.14, rz = sz.z / 2 * 1.14, top = hb.max.y + 0.012;
  const parts = [];
  // 頭のてっぺん（額より上だけ。顔はかくさない）
  const cap = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.4); cap.scale(rx, (top - c.y) * 1.08, rz); cap.translate(c.x, c.y + 0.012, c.z); parts.push(cap);
  // うしろと横に垂れる布。正面（+z）の顔の前はあける（θ=0 が正面）
  const open = type === 'hijab' ? 0.78 : 0.95, drop = type === 'hijab' ? 0.3 : 0.36, y0 = c.y + (top - c.y) * 0.32;
  const d = new THREE.CylinderGeometry(rx * 1.04, rx * 1.55, drop, 18, 3, true, open, Math.PI * 2 - open * 2); d.scale(1, 1, rz / rx); d.translate(c.x, y0 - drop / 2, c.z - 0.01); parts.push(d);
  if (type === 'hijab') { const n = new THREE.CylinderGeometry(rx * 0.8, rx * 1.3, 0.14, 18, 1, true); n.scale(1, 1, rz / rx); n.translate(c.x, hb.min.y - 0.04, c.z - 0.01); parts.push(n); }   // あごの下から首
  const g = mergeGeometries(parts.map(p => p.toNonIndexed()));
  if (type === 'ghutra') { const ring = new THREE.TorusGeometry(1, 0.11, 6, 18); ring.rotateX(Math.PI / 2); ring.scale(rx * 0.82, rx * 0.82, rz * 0.82); ring.translate(c.x, top - 0.035, c.z); ring.userData.ring = true; T[k + '_ring'] = ring; }
  g.computeVertexNormals(); g.userData.shared = true; return (T[k] = g);
}
// 服装：肌・髪の色は outfit()、服は種類ごとに（私服は半分くらいの服の色を入れかえる）
function humanPalette(T, o) {
  const pal = new Float32Array(48);
  T.C.mats.forEach(([name, r, g, b], i) => {
    let c = [r, g, b];
    if (name === 'Skin') c = o.skin; else if (name === 'Skin_Darker') c = o.skin.map(v => v * 0.8);
    else if (H_HAIR.includes(name)) c = name === 'Hair' || name.startsWith('Hair_') ? o.hair : o.hair.map(v => v * 0.85);
    else if (H_KEEP.includes(name)) c = [r, g, b];
    else if (o.cloth && o.cloth[name]) c = o.cloth[name];
    pal.set(c, i * 3);
  });
  return pal;
}
function modelOutfit(kind, o, key) {
  const T = humanTmpl(key), cloth = {};
  T.C.mats.forEach(([name, r, g, b], i) => {
    if (name.startsWith('Skin') || H_HAIR.includes(name) || H_KEEP.includes(name)) return;
    const shoe = T.slotY[i] < 0.22;   // 足もとの色＝靴
    if (kind === 'thobe') cloth[name] = shoe ? [.3, .22, .14] : (name === 'Suit' ? [.32, .24, .15] : o.robe);   // スーツの上着はビシュト（茶色の外套）に
    else if (kind === 'abaya') cloth[name] = o.robe;
    else if (kind === 'casual' && Math.random() < 0.5) cloth[name] = pick(H_CLOTH);
  });
  o.cloth = cloth; o.model = key;
}
function makeModelHuman(kind, o2) {
  const o = o2 || outfit(kind);
  if (!o.model) modelOutfit(kind, o, pick(H_LOOKS[kind] || H_LOOKS.casual));
  const T = humanTmpl(o.model), C = T.C;
  const bones = C.bones.map(bd => { const bn = new THREE.Bone(); bn.name = boneName(bd[0]); bn.position.set(bd[2], bd[3], bd[4]); bn.quaternion.set(bd[5], bd[6], bd[7], bd[8]); bn.scale.set(bd[9], bd[10], bd[11]); return bn; });
  const arm = new THREE.Group(); C.bones.forEach((bd, i) => (bd[1] >= 0 ? bones[bd[1]] : arm).add(bones[i]));
  const skel = new THREE.Skeleton(bones, T.inv), mats = [];
  const skinned = (geo, mat) => { const m = new THREE.SkinnedMesh(geo, mat); m.bind(skel, new THREE.Matrix4()); m.castShadow = true; m.receiveShadow = true; m.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 1.3); arm.add(m); mats.push(mat); return m; };
  const mesh = skinned(T.g, humanMaterial(humanPalette(T, o)));
  if (kind === 'thobe' || kind === 'abaya') skinned(robeGeo(T, kind === 'abaya' ? 0.3 : 0.26), new THREE.MeshStandardMaterial({ color: new THREE.Color().fromArray(o.robe), roughness: 0.88 }));
  // かぶり物を頭の骨に：初めの姿勢での頭の骨の位置から、相対の位置を出してつける
  const hwType = kind === 'thobe' ? 'ghutra' : kind === 'abaya' ? 'hijab' : null;
  if (hwType) {
    const head = bones[T.J('Head')], rel = new THREE.Matrix4().copy(T.inv[T.J('Head')]);   // 頭の骨から見た、初めの姿勢の座標
    const col = hwType === 'hijab' ? o.scarf : o.ghutra === 'red' ? [.75, .16, .14] : [.95, .95, .93];
    const hm = new THREE.MeshStandardMaterial({ color: new THREE.Color().fromArray(col), roughness: 0.9, side: THREE.DoubleSide }); mats.push(hm);
    const w = new THREE.Mesh(headwearGeo(T, hwType), hm); w.castShadow = true; rel.decompose(w.position, w.quaternion, w.scale); head.add(w);
    if (hwType === 'ghutra') { const rm = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 }); mats.push(rm); const r = new THREE.Mesh(T['hw_ghutra_ring'], rm); rel.decompose(r.position, r.quaternion, r.scale); head.add(r); }
  }
  const body = new THREE.Group(); body.scale.setScalar(HUMAN_SCALE); body.add(arm);
  const root = new THREE.Group(); root.add(body); scene.add(root);
  const by = n => bones[T.J(n)];
  const bb = { root: by('Root'), hips: by('Hips'), spine: by('Abdomen'), chest: by('Torso'), neck: by('Neck'), head: by('Head'), armL: by('UpperArm.L'), foreL: by('LowerArm.L'), armR: by('UpperArm.R'), foreR: by('LowerArm.R'), handR: by('Wrist.R'), legL: by('UpperLeg.L'), kneeL: by('LowerLeg.L'), legR: by('UpperLeg.R'), kneeR: by('LowerLeg.R') };
  return { root, body, arm, mesh, b: bb, o, phase: Math.random() * 10, anim: 'idle', t: 0, lean: 0, model: true, tmpl: T, mixer: new THREE.AnimationMixer(arm), cur: null, active: [], mats, hipY: T.hipY * HUMAN_SCALE };
}
// アニメーションの切りかえ（なめらかにつなぐ）
function hPlay(h, key, names, o = {}) {
  if (h.cur === key) return;
  const fade = o.fade !== undefined ? o.fade : 0.2, clips = HUMAN_DATA.clips[h.tmpl.C.gender];
  for (const a of h.active) a.fadeOut(fade);
  h.active = names.map(n => {
    const a = h.mixer.clipAction(clips[n]); a.reset(); a.setLoop(o.once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = !!o.once;
    a.timeScale = o.ts || 1; if (!o.once && !o.sync) a.time = Math.random() * clips[n].duration;
    if (o.reverse) { a.time = clips[n].duration; a.timeScale = -Math.abs(a.timeScale); }
    a.setEffectiveWeight(1); a.fadeIn(fade).play(); return a;
  });
  h.cur = key;
}
// 骨を、キャラクターから見た軸（右・前・上）のまわりに回す（アニメーションの上に足す）
// three.js のアニメーションは「値が変わったときだけ」骨に書く。足した回転が次のフレームに残って積み重ならないよう、
// 回す前のアニメーションの値をとっておき、次のアニメーション更新の前にもどす（hRestore）
function hTurn(h, bone, axis, ang) {
  if (!bone || !ang) return;
  const u = bone.userData;
  if (!u.isSaved) { (u.saved || (u.saved = new THREE.Quaternion())).copy(bone.quaternion); u.isSaved = true; (h.turned || (h.turned = [])).push(bone); }
  h.root.getWorldQuaternion(_hq3); _hv.copy(axis).applyQuaternion(_hq3);   // 世界での軸
  bone.parent.getWorldQuaternion(_hq); _hq2.copy(_hq).multiply(bone.quaternion);
  _hq2.premultiply(new THREE.Quaternion().setFromAxisAngle(_hv, ang));
  bone.quaternion.copy(_hq.invert().multiply(_hq2));
}
const H_RIGHT = new THREE.Vector3(-1, 0, 0), H_UP = new THREE.Vector3(0, 1, 0);
function poseModelHuman(h, dt, sp = 0) {
  const a = h.anim, b = h.b; h.t += dt;
  if (a !== h.lastAnim) { h.lastAnim = a; if (a === 'punch' || a === 'fall' || a === 'getup') h.cur = null; }
  if (a === 'walk') hPlay(h, 'walk', ['Walk']);
  else if (a === 'run' || a === 'flee') hPlay(h, 'run', ['Run']);
  else if (a === 'aim') { if (sp > 0.3) hPlay(h, 'aimMove', ['WalkLower', 'GunUpper'], { fade: 0.15 }); else hPlay(h, 'aim', ['Idle_Gun_Pointing'], { fade: 0.15 }); }
  else if (a === 'punch') hPlay(h, 'punch' + (h.punchSide ? 'L' : 'R'), [h.punchSide ? 'Punch_Left' : 'Punch_Right'], { once: true, fade: 0.08, ts: 1.6 });
  else if (a === 'fall' || a === 'lie') hPlay(h, 'death', ['Death'], { once: true, fade: 0.1, ts: a === 'lie' ? 4 : 1.2 });
  else if (a === 'getup') hPlay(h, 'getup', ['Death'], { once: true, fade: 0.1, ts: 1.4, reverse: true });
  else if (a === 'cower') hPlay(h, 'cower', ['HitRecieve'], { ts: 0.35 });
  else hPlay(h, 'idle', ['Idle']);   // idle / sit / surrender（座る・手を上げるは下で骨を足す）
  // 歩く・走るは速さに合わせて足を動かす
  if (h.cur === 'walk' || h.cur === 'aimMove') for (const x of h.active) if (x.getClip().name !== 'GunUpper') x.timeScale = clamp(sp / 1.4, 0.55, 1.9);
  if (h.cur === 'run') h.active[0].timeScale = clamp(sp / 4.4, 0.75, 1.6);
  if (h.turned) { for (const bone of h.turned) { bone.quaternion.copy(bone.userData.saved); bone.userData.isSaved = false; } h.turned.length = 0; }   // 前に足した回転をもどす
  h.mixer.update(dt);
  // アニメーションの上に足す動き
  if (a === 'aim') { const p = h.aimPitch || 0; hTurn(h, b.chest, H_RIGHT, p * 0.85); hTurn(h, b.armR, H_RIGHT, -(h.recoil || 0) * 0.3); }
  if (h.lookPitch) hTurn(h, b.head, H_RIGHT, -h.lookPitch * 0.8);
  if (a === 'sit') { for (const k of ['legL', 'legR']) hTurn(h, b[k], H_RIGHT, 1.45); for (const k of ['kneeL', 'kneeR']) hTurn(h, b[k], H_RIGHT, -1.45); for (const k of ['armL', 'armR']) hTurn(h, b[k], H_RIGHT, 0.9); }
  if (a === 'surrender') for (const k of ['armL', 'armR']) hTurn(h, b[k], H_RIGHT, 2.7);
}
function makeHuman(kind, o2) { return HUMAN_DATA.chars ? makeModelHuman(kind, o2) : makeProcHuman(kind, o2); }
function poseHuman(h, dt, sp = 0) { return h.model ? poseModelHuman(h, dt, sp) : poseProcHuman(h, dt, sp); }
function handPos(h, out = _hand) {
  if (!h.model) return handPosProc(h, out);
  h.b.handR.updateWorldMatrix(true, false); return out.set(0, 0.07, 0.02).applyMatrix4(h.b.handR.matrixWorld);
}
function disposeHuman(h) {
  if (!h.model) return disposeProcHuman(h);
  if (h.root.parent) h.root.parent.remove(h.root);
  h.mixer.stopAllAction(); h.mixer.uncacheRoot(h.arm); for (const m of h.mats) m.dispose();
}
