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
// 人をひとり作る（root：位置と向き、body：倒れるとき回す）
function makeHuman(kind, o2) {
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
function disposeHuman(h) { scene.remove(h.root); h.mesh.geometry.dispose(); }
// 姿勢：anim = idle / walk / run / sit / aim / punch / fall / lie / surrender / cower。sp=速さ(m/s)
function poseHuman(h, dt, sp = 0) {
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
function handPos(h, out = _hand) { h.b.foreR.updateWorldMatrix(true, false); return out.set(0, -0.2, 0.02).applyMatrix4(h.b.foreR.matrixWorld); }
