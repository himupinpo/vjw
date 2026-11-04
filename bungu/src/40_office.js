// =========================================================================================
//  3Dの事務所：広さは事務所のランク、机は雇える人数。雇った人がパソコンで働き、
//  作った製品が生産ラインを流れ、棚に並ぶ。設備（椅子・モニター・植物・コーヒー・ラボ）も置かれる
//  単位は m。正面（カメラ側）が +z、奥の壁が −z、左の壁が −x
// =========================================================================================
const OFFICE = {
  scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(38, 1, 0.1, 200), root: null,
  yaw: 0.62, pitch: 0.66, zoom: 1, people: [], belt: [], t: 0, key: '',
  init() {
    const s = this.scene; s.environment = ENV; s.background = new THREE.Color(0xe9e2d3); s.environmentIntensity = 0.55;
    s.add(new THREE.HemisphereLight(0xfff6e8, 0xb9ab90, 0.9));
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.position.set(-6, 11, -4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
    s.add(sun, sun.target); this.sun = sun;
    const fill = new THREE.DirectionalLight(0xe8f0ff, 0.6); fill.position.set(8, 6, 10); s.add(fill);
  },
  // 状態が変わったら作り直す（雇う・引っ越す・設備・発売）
  sync(S) {
    const key = JSON.stringify([S.tier, S.equip, S.staff.map(m => m.role + m.id), S.products.slice(-14).map(p => p.id), S.company]);
    if (key === this.key) return; this.key = key; this.build(S);
  },
  build(S) {
    if (this.root) { this.scene.remove(this.root); disposeTree(this.root); }
    const R = this.root = new THREE.Group(); this.scene.add(R); this.people = []; this.belt = [];
    const O = OFFICES[S.tier], W = O.w, D = O.d, H = 3, tier = S.tier, cheap = SET.quality === 'low';
    this.W = W; this.D = D;
    const box = (w, h, d, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; R.add(m); return m; };
    // 床
    const floorTex = this.floorTex(tier); floorTex.repeat.set(W / 2, D / 2);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: floorTex, roughness: tier === 3 ? 0.25 : 0.7 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; R.add(floor);
    box(W + 0.4, 0.3, D + 0.4, new THREE.MeshStandardMaterial({ color: 0x8c7d63, roughness: 0.9 }), 0, -0.16, 0, false);
    // 壁：奥は窓つき、左は扉とポスター
    const wallM = new THREE.MeshStandardMaterial({ color: [0xf1e6d2, 0xeef0ec, 0xe9edf2, 0xdfe6ee][tier], roughness: 0.9 });
    const trimM = new THREE.MeshStandardMaterial({ color: [0xa47b52, 0xd9d3c7, 0x9aa3ad, 0x5d6670][tier], roughness: 0.6 });
    const wz = -D / 2 - 0.08, nWin = Math.max(1, Math.floor(W / 3.4)), ww = Math.min(2.2, (W - 1) / nWin - 0.6);
    box(W, 0.95, 0.16, wallM, 0, 0.475, wz); box(W, H - 2.45, 0.16, wallM, 0, 2.45 + (H - 2.45) / 2, wz);
    const xs = []; for (let i = 0; i < nWin; i++) xs.push(-W / 2 + (i + 0.5) * W / nWin);
    let prev = -W / 2; for (const x of xs) { box(x - ww / 2 - prev, 1.5, 0.16, wallM, (prev + x - ww / 2) / 2, 1.7, wz); prev = x + ww / 2; } box(W / 2 - prev, 1.5, 0.16, wallM, (prev + W / 2) / 2, 1.7, wz);
    const skyT = this.skyTex(tier);
    for (const x of xs) {
      box(ww + 0.1, 0.08, 0.22, trimM, x, 0.95, wz + 0.02); box(ww + 0.1, 0.06, 0.2, trimM, x, 2.45, wz); box(0.05, 1.5, 0.12, trimM, x, 1.7, wz);
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(ww, 1.5), new THREE.MeshBasicMaterial({ map: skyT })); sky.position.set(x, 1.7, wz - 0.25); R.add(sky);
    }
    const lx = -W / 2 - 0.08;
    box(0.16, H, D, wallM, lx, H / 2, 0);
    box(0.06, 2.1, 0.95, new THREE.MeshStandardMaterial({ color: 0x9b7650, roughness: 0.6 }), lx + 0.1, 1.05, D / 2 - 1.1);   // 扉
    box(0.16, 0.12, D, trimM, lx + 0.02, 0.06, 0); box(W, 0.12, 0.16, trimM, 0, 0.06, wz + 0.02);
    // ポスター（会社名）
    const post = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.76), new THREE.MeshStandardMaterial({ map: this.posterTex(S), roughness: 0.7 })); post.rotation.y = Math.PI / 2; post.position.set(lx + 0.1, 2.55, D / 2 - 1.1); R.add(post);
    // 机の並び（右から前へ）
    const nd = O.desks, cols = Math.max(2, Math.min(6, Math.ceil(Math.sqrt(nd * 1.6)))), rows = Math.ceil(nd / cols);
    const dx = 1.9, dz = 1.75, x0 = W / 2 - 1.2 - (cols - 1) * dx, z0 = -D / 2 + 2.0;
    const deskM = new THREE.MeshStandardMaterial({ color: tier === 0 ? 0xb88b5d : 0xe9e4da, roughness: 0.55 }), legM = new THREE.MeshStandardMaterial({ color: 0x5b5f66, roughness: 0.4, metalness: 0.6 });
    const scrM = new THREE.MeshStandardMaterial({ color: 0x1a2230, emissive: 0x35557a, emissiveIntensity: 0.55, roughness: 0.3 }), monM = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.5 });
    const staff = S.staff;
    for (let i = 0; i < nd; i++) {
      const c = i % cols, r = (i / cols) | 0, x = x0 + c * dx, z = z0 + r * dz;
      if (z > D / 2 - 0.8) break;
      box(1.4, 0.05, 0.72, deskM, x, 0.74, z); for (const sx of [-0.62, 0.62]) box(0.05, 0.72, 0.62, legM, x + sx, 0.37, z, false);
      const nm = S.equip.monitor > 0 ? 2 : 1;
      for (let k = 0; k < nm; k++) { const mx = x + (nm === 2 ? (k ? 0.3 : -0.3) : 0); const m = box(0.56, 0.34, 0.03, monM, mx, 1.0, z - 0.2); m.rotation.y = nm === 2 ? (k ? -0.18 : 0.18) : 0; const sc = box(0.52, 0.3, 0.005, scrM, mx, 1.0, z - 0.183, false); sc.rotation.y = m.rotation.y; box(0.06, 0.16, 0.06, monM, mx, 0.84, z - 0.22, false); }
      box(0.42, 0.02, 0.14, monM, x, 0.775, z + 0.06, false);
      this.chair(R, x, z + 0.55, S.equip.chair);
      const m = staff[i];
      if (m) { const p = this.person(ROLES[m.role].shirt, m.hair, true); p.position.set(x, 0, z + 0.58); R.add(p); this.people.push(p); if (m.role === 'des') box(0.3, 0.012, 0.22, new THREE.MeshStandardMaterial({ color: 0x222222 }), x + 0.45, 0.775, z + 0.05, false); }
    }
    // 社長の机（窓ぎわ）
    const cx = -W / 2 + 2.2, cz = -D / 2 + 1.5;
    box(1.9, 0.07, 0.9, new THREE.MeshStandardMaterial({ color: 0x7a5233, roughness: 0.45 }), cx, 0.76, cz); box(1.8, 0.7, 0.05, new THREE.MeshStandardMaterial({ color: 0x6b462b, roughness: 0.5 }), cx, 0.38, cz - 0.4);
    box(0.5, 0.34, 0.03, monM, cx + 0.3, 1.0, cz - 0.25); box(0.46, 0.3, 0.005, scrM, cx + 0.3, 1.0, cz - 0.233, false);
    this.chair(R, cx, cz + 0.62, 3);
    const boss = this.person('#2c3a5c', '#2a211b', true, true); boss.position.set(cx, 0, cz + 0.65); R.add(boss); this.people.push(boss);
    // 植物・コーヒー・ラボ
    const pots = [[W / 2 - 0.5, -D / 2 + 0.5], [-W / 2 + 0.5, D / 2 - 0.5], [W / 2 - 0.5, D / 2 - 0.5], [-W / 2 + 0.5, -D / 2 + 0.6], [0, -D / 2 + 0.5], [W / 4, D / 2 - 0.5]];
    for (let i = 0; i < Math.min(pots.length, S.equip.plant * 2); i++) this.plant(R, pots[i][0], pots[i][1], 0.7 + (i % 3) * 0.25);
    if (S.equip.coffee) { box(1.0, 0.9, 0.5, new THREE.MeshStandardMaterial({ color: 0xcfc6b5, roughness: 0.6 }), -W / 2 + 4.2, 0.45, -D / 2 + 0.4); box(0.32, 0.42, 0.3, new THREE.MeshStandardMaterial({ color: 0x1f1f22, roughness: 0.35, metalness: 0.4 }), -W / 2 + 4.0, 1.11, -D / 2 + 0.4); box(0.09, 0.1, 0.09, new THREE.MeshStandardMaterial({ color: 0xffffff }), -W / 2 + 4.35, 0.95, -D / 2 + 0.4); }
    if (S.equip.lab) { const lxp = -W / 2 + 1.0, lzp = D / 2 - 2.6; box(0.9, 0.05, 1.6, new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 }), lxp + 0.3, 0.9, lzp); box(0.85, 0.88, 1.55, new THREE.MeshStandardMaterial({ color: 0x8aa0b4, roughness: 0.6 }), lxp + 0.3, 0.44, lzp); for (let k = 0; k < S.equip.lab; k++) box(0.22, 0.3 + k * 0.08, 0.22, new THREE.MeshStandardMaterial({ color: [0x4f7fb8, 0xd9493e, 0x2e9a63][k], roughness: 0.4 }), lxp + 0.3, 1.07 + k * 0.04, lzp - 0.5 + k * 0.5); }
    // 生産ライン（手前の左から右へ流れるベルト）と製品
    const lineLv = S.equip.line, bz = D / 2 - 0.85, bx0 = -W / 2 + 1.0, bx1 = Math.min(W / 2 - 1.0, bx0 + 2.2 + lineLv * 2.2);
    this.bz = bz; this.bx0 = bx0; this.bx1 = bx1;
    if (tier === 0 && lineLv <= 1) {
      box(bx1 - bx0, 0.06, 0.8, new THREE.MeshStandardMaterial({ color: 0xa57a4f, roughness: 0.6 }), (bx0 + bx1) / 2, 0.85, bz); for (const sx of [bx0 + 0.1, bx1 - 0.1]) box(0.08, 0.84, 0.7, legM, sx, 0.42, bz, false);
      this.beltY = 0.89; this.beltSpeed = 0;
    } else {
      box(bx1 - bx0, 0.12, 0.7, new THREE.MeshStandardMaterial({ map: this.beltTex(), roughness: 0.8 }), (bx0 + bx1) / 2, 0.78, bz);
      box(bx1 - bx0 + 0.1, 0.08, 0.06, legM, (bx0 + bx1) / 2, 0.82, bz - 0.38); box(bx1 - bx0 + 0.1, 0.08, 0.06, legM, (bx0 + bx1) / 2, 0.82, bz + 0.38);
      for (let x = bx0 + 0.3; x < bx1; x += 1.2) box(0.08, 0.72, 0.6, legM, x, 0.36, bz, false);
      for (let k = 0; k < lineLv; k++) { const mx = bx0 + 0.9 + k * (bx1 - bx0 - 1.8) / Math.max(1, lineLv - 1); box(0.9, 0.9, 1.0, new THREE.MeshStandardMaterial({ color: [0x3f6f9e, 0xd9a03b, 0x5a8f63, 0xb5544a, 0x6d6aa8, 0x777f88][k % 6], roughness: 0.45, metalness: 0.2 }), mx, 1.26, bz); box(0.12, 0.12, 0.02, new THREE.MeshStandardMaterial({ color: 0x55ff88, emissive: 0x33dd66, emissiveIntensity: 1 }), mx + 0.25, 1.5, bz + 0.51, false); }
      this.beltY = 0.85; this.beltSpeed = 0.55;
    }
    const onSale = S.products.filter(p => p.active), src = onSale.length ? onSale : S.products.slice(-3);
    const n = src.length ? Math.min(10, Math.max(4, Math.floor((bx1 - bx0) / 0.8))) : 0;
    for (let i = 0; i < n; i++) {
      const pr = src[i % src.length], m = buildProduct(pr, { cheap: true }); m.scale.setScalar(pr.kind === 'eraser' || pr.kind === 'lead' ? 0.06 : 0.045);
      m.traverse(c => { if (c.isMesh) c.castShadow = true; });
      m.userData.t = i / n; R.add(m); this.belt.push(m);
    }
    // 製品の棚（左の壁ぎわ、部屋に向けて開いている）：発売した製品の最新12こ
    const shx = -W / 2 + 0.05, shz = D > 7 ? -0.6 : 0.15, sw = 2.3, shM = new THREE.MeshStandardMaterial({ color: 0xf6f1e6, roughness: 0.55 }), shB = new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.7 });
    box(0.04, 1.75, sw, shB, shx + 0.02, 0.875, shz); for (const sz of [-sw / 2, sw / 2]) box(0.42, 1.75, 0.04, shM, shx + 0.21, 0.875, shz + sz);
    for (let k = 0; k < 4; k++) box(0.42, 0.035, sw, shM, shx + 0.21, 0.08 + k * 0.52, shz, false);
    S.products.slice(-12).forEach((pr, i) => {
      const m = buildProduct(pr, { cheap: true }), row = (i / 3) | 0, col = i % 3, sc = pr.kind === 'eraser' || pr.kind === 'lead' ? 0.06 : 0.04; m.scale.setScalar(sc);
      m.rotation.y = -Math.PI / 2 + 0.35; m.position.set(shx + 0.22, 0.1 + (3 - row) * 0.52 + m.userData.size.y * sc / 2, shz - 0.75 + col * 0.75); m.traverse(c => { if (c.isMesh) c.castShadow = true; }); R.add(m);
    });
    this.sun.target.position.set(0, 0, 0);
    this.frame();
  },
  frame() { const W = this.W || 8, D = this.D || 6; this.dist = Math.max(W, D * 1.3) * 1.05 + 2.5; },
  update(dt) {
    this.t += dt;
    for (let i = 0; i < this.people.length; i++) { const p = this.people[i], a = p.userData; if (!a.arms) continue; const ph = this.t * 9 + i * 1.7; a.arms[0].rotation.x = 1.25 + Math.sin(ph) * 0.12; a.arms[1].rotation.x = 1.25 + Math.sin(ph + 2.1) * 0.12; a.head.rotation.x = 0.12 + Math.sin(this.t * 0.7 + i) * 0.05; a.head.rotation.y = Math.sin(this.t * 0.31 + i * 2) * 0.25; }
    const L = this.bx1 - this.bx0;
    for (const m of this.belt) {
      m.userData.t = (m.userData.t + dt * (this.beltSpeed || 0) / L) % 1;
      m.position.set(this.bx0 + 0.2 + m.userData.t * (L - 0.4), this.beltY + (m.userData.size ? m.userData.size.y * m.scale.y / 2 + 0.005 : 0.03), this.bz); m.rotation.y = 0.15;
    }
    // 部屋がちょうど入る距離（縦長の画面では横の画角で決まる）
    const vf = this.cam.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * this.cam.aspect), W = this.W || 8, D = this.D || 6;
    const fit = Math.max(W, D) * 0.55 / Math.tan(Math.min(vf, hf)) + 1.5, d = fit / this.zoom, ty = 0.6;
    this.cam.position.set(Math.sin(this.yaw) * Math.cos(this.pitch) * d, ty + Math.sin(this.pitch) * d, Math.cos(this.yaw) * Math.cos(this.pitch) * d);
    this.cam.lookAt(0, ty, 0.3);
  },
  // ---------- 部品 ----------
  chair(R, x, z, lv) {
    const g = new THREE.Group(), dark = new THREE.MeshStandardMaterial({ color: lv >= 1 ? 0x24262b : 0x5d6a7a, roughness: 0.7 }), metal = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.8, roughness: 0.3 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.46), dark); seat.position.y = 0.47; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, lv >= 2 ? 0.75 : 0.5, 0.05), dark); back.position.set(0, lv >= 2 ? 0.92 : 0.8, 0.22); g.add(back);
    if (lv >= 3) { const hr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.05), dark); hr.position.set(0, 1.38, 0.24); g.add(hr); }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 10), metal); pole.position.y = 0.24; g.add(pole);
    for (let k = 0; k < 5; k++) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.3), metal); const a = k / 5 * TAU; leg.position.set(Math.sin(a) * 0.14, 0.04, Math.cos(a) * 0.14); leg.rotation.y = a; g.add(leg); }
    g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    g.position.set(x, 0, z); R.add(g);
  },
  plant(R, x, z, h) {
    const g = new THREE.Group(), pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.36, 16), new THREE.MeshStandardMaterial({ color: 0xc9b79c, roughness: 0.8 })); pot.position.y = 0.18; g.add(pot);
    const leafM = new THREE.MeshStandardMaterial({ color: 0x4f8a45, roughness: 0.7 });
    for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), leafM); const a = k * 2.4; l.position.set(Math.sin(a) * 0.14, 0.36 + h * (0.4 + (k / 7) * 0.6), Math.cos(a) * 0.14); l.scale.set(1, 1.5, 0.6); l.rotation.y = a; g.add(l); }
    g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    g.position.set(x, 0, z); R.add(g);
  },
  // 人：座っている（キーボードを打つ）
  person(shirt, hair, seated, boss) {
    const g = new THREE.Group(), skin = new THREE.MeshStandardMaterial({ color: 0xe9c4a2, roughness: 0.7 }), shirtM = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.75 }), pants = new THREE.MeshStandardMaterial({ color: boss ? 0x232838 : 0x3b4250, roughness: 0.8 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.3, 4, 10), shirtM); torso.position.set(0, 0.86, 0.05); torso.rotation.x = -0.1; g.add(torso);
    const head = new THREE.Group(); head.position.set(0, 1.2, 0.0); g.add(head);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), skin); head.add(hd);
    const hr = new THREE.Mesh(new THREE.SphereGeometry(0.137, 16, 10, 0, TAU, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: hair || '#2b2118', roughness: 0.8 })); hr.position.set(0, 0.012, 0.012); hr.rotation.x = -0.25; head.add(hr);
    for (const sx of [-0.1, 0.1]) {
      const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.32, 4, 8), pants); th.rotation.x = Math.PI / 2; th.position.set(sx, 0.52, -0.16); g.add(th);
      const sh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.36, 4, 8), pants); sh.position.set(sx, 0.27, -0.36); g.add(sh);
    }
    const arms = [];
    for (const sx of [-0.21, 0.21]) {
      const up = new THREE.Group(); up.position.set(sx, 1.0, 0.05); g.add(up);
      const ua = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.22, 4, 8), shirtM); ua.position.y = -0.14; up.add(ua);
      const el = new THREE.Group(); el.position.y = -0.27; up.add(el);
      const fa = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 4, 8), shirtM); fa.position.y = -0.13; el.add(fa);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), skin); hand.position.y = -0.27; el.add(hand);
      up.rotation.x = 0.35; el.rotation.x = 1.25; arms.push(el);
    }
    g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    g.userData = { arms, head };
    // 前（−z）を向いて座る形（机は −z 側にある）
    return g;
  },
  // ---------- テクスチャ ----------
  floorTex(tier) {
    const c = newCanvas(256, 256), g = c.getContext('2d');
    if (tier === 3) { g.fillStyle = '#e9e6e1'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(0,0,0,.08)'; g.strokeRect(0, 0, 256, 256); g.strokeRect(0, 0, 128, 128); g.strokeRect(128, 128, 128, 128); }
    else {
      const base = ['#c79a68', '#c9a77f', '#bfae95'][tier];
      for (let i = 0; i < 8; i++) { g.fillStyle = mixHex(base, i % 2 ? '#8a6a45' : '#e8d3b2', ((i * 37) % 5) / 18); g.fillRect(0, i * 32, 256, 32); g.fillStyle = 'rgba(60,40,20,.25)'; g.fillRect(0, i * 32, 256, 1.5); g.fillRect(((i * 97) % 200) + 20, i * 32, 1.5, 32); }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = MAXANI; return t;
  },
  skyTex(tier) {
    const c = newCanvas(256, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#8fc3ec'); gr.addColorStop(0.75, '#d8ecf7'); gr.addColorStop(1, '#eef5ec'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(40 + k * 60, 50 + (k % 2) * 30, 34, 12, 0, 0, TAU); g.fill(); }
    if (tier === 0) { g.fillStyle = '#7fa86b'; g.beginPath(); for (let x = 0; x <= 256; x += 16) g.lineTo(x, 200 + Math.sin(x * 0.07) * 14); g.lineTo(256, 256); g.lineTo(0, 256); g.fill(); g.fillStyle = '#c9b49a'; g.fillRect(30, 170, 60, 60); g.fillStyle = '#9b5b43'; g.beginPath(); g.moveTo(24, 172); g.lineTo(60, 140); g.lineTo(96, 172); g.fill(); }
    else { for (let k = 0; k < 9; k++) { const h = 40 + ((k * 53) % 90) * (tier >= 2 ? 1.6 : 0.8); g.fillStyle = ['#8d9bab', '#a4b0bd', '#7c8a9b'][k % 3]; g.fillRect(k * 30 - 4, 256 - h, 26, h); g.fillStyle = 'rgba(255,255,230,.5)'; for (let y = 256 - h + 6; y < 250; y += 10) g.fillRect(k * 30, y, 18, 3); } }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  },
  posterTex(S) {
    const c = newCanvas(512, 352), g = c.getContext('2d');
    g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, 512, 352); g.fillStyle = '#2b6fd6'; g.fillRect(0, 0, 512, 70);
    g.fillStyle = '#fff'; g.font = '900 40px "Zen Maru Gothic", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((S.company || '').slice(0, 12), 256, 36, 480);
    g.fillStyle = '#2b2a28'; g.font = '700 30px "Zen Maru Gothic", sans-serif'; g.fillText('書くよろこびを、世界へ。', 256, 130, 480);
    const cols = ['#d9493e', '#f0a03a', '#2e9a63', '#2b6fd6', '#7b4bc4'];
    cols.forEach((col, i) => { g.save(); g.translate(96 + i * 80, 250); g.rotate(-0.5); g.fillStyle = col; g.fillRect(-10, -70, 20, 120); g.fillStyle = '#e8c79a'; g.beginPath(); g.moveTo(-10, 50); g.lineTo(10, 50); g.lineTo(0, 78); g.fill(); g.restore(); });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  },
  beltTex() {
    const c = newCanvas(64, 64), g = c.getContext('2d'); g.fillStyle = '#2f3237'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#3c4046'; for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 3, 64);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 1); return t;
  },
};
