// =========================================================================================
//  3Dの事務所：広さは事務所のランク、机は雇える人数。社員は机で働き、ときどき立ってコーヒーを飲みに行ったり、
//  ソファで休んだり、ホワイトボードの前で話したりする。開発や研究が終わるとみんなで喜ぶ（頭の上にアイコン）。
//  生産ラインの機械が動き、製品が箱につめられて積み上がる。試験台では開発中の試作品をテストしている。季節の飾りもつく
//  単位は m。正面（カメラ側）が +z、奥の壁が −z、左の壁が −x
// =========================================================================================
const OFFICE = {
  scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(38, 1, 0.1, 200), root: null,
  yaw: 0.62, pitch: 0.66, zoom: 1, agents: [], belt: [], mach: [], t: 0, key: '', events: [], models: new Map(),
  init() {
    const s = this.scene; s.environment = ENV; s.background = new THREE.Color(0xe9e2d3); s.environmentIntensity = 0.55;
    s.add(new THREE.HemisphereLight(0xfff6e8, 0xb9ab90, 0.9));
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.position.set(-6, 11, -4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
    s.add(sun, sun.target); this.sun = sun;
    const fill = new THREE.DirectionalLight(0xe8f0ff, 0.6); fill.position.set(8, 6, 10); s.add(fill);
  },
  season(day) { const m = dateOf(day).getMonth(); return { 11: 'xmas', 0: 'newyear', 2: 'sakura', 3: 'sakura', 6: 'summer', 7: 'summer', 9: 'halloween' }[m] || ''; },
  // 状態が変わったら作り直す（雇う・引っ越す・設備・家具・発売・季節・開発中の試作品）
  sync(S) {
    const lk = S.tier + ',' + S.equip.line + ',' + S.equip.lab;
    if (lk !== this.layK || S !== this.layS) { this.layK = lk; this.layS = S; FURNI.validate(S); }
    const dev = S.devs.find(v => !v.ready);
    const key = JSON.stringify([S.tier, S.equip, S.staff.map(m => m.role + m.id), S.products.slice(-14).map(p => p.id), S.company, S.furn || [], this.season(S.day), dev ? dev.id : 0]);
    if (key === this.key) return; this.key = key; this.build(S);
  },
  // ---------- 部屋の配置（家具を置けない所もここで決める） ----------
  layout(S) {
    const O = OFFICES[S.tier], W = O.w, D = O.d, nd = O.desks, cols = Math.max(2, Math.min(6, Math.ceil(Math.sqrt(nd * 1.6))));
    const dx = 1.9, dz = 1.75, x0 = W / 2 - 1.2 - (cols - 1) * dx, z0 = -D / 2 + 2.0, desks = [];
    for (let i = 0; i < nd; i++) { const x = x0 + (i % cols) * dx, z = z0 + ((i / cols) | 0) * dz; if (z > D / 2 - 0.8) break; desks.push({ x, z, seat: { x, z: z + 0.58 } }); }
    const lineLv = S.equip.line, bz = D / 2 - 0.85, bx0 = -W / 2 + 1.0, bx1 = Math.min(W / 2 - 2.0, bx0 + 2.2 + lineLv * 2.2), pack = { x: bx1 + 0.8, z: bz };
    const ceo = { x: -W / 2 + 2.2, z: -D / 2 + 1.5 }, shelf = { x: -W / 2 + 0.05, z: D > 7 ? -0.6 : -0.2 }, bench = { x: W / 2 - 0.65, z: D / 2 - 2.0 };
    const lab = S.equip.lab ? { x: -W / 2 + 1.3, z: D / 2 - 2.6 } : null, door = { x: -W / 2 + 0.6, z: D / 2 - 1.1 };
    const blocked = [];
    for (const d of desks) blocked.push([d.x - 0.8, d.z - 0.45, d.x + 0.8, d.z + 1.2]);
    blocked.push([ceo.x - 1.05, ceo.z - 0.55, ceo.x + 1.05, ceo.z + 1.05], [bx0 - 0.1, bz - 0.55, pack.x + 0.65, D / 2], [-W / 2, shelf.z - 1.25, -W / 2 + 0.6, shelf.z + 1.25], [bench.x - 0.45, bench.z - 0.75, W / 2, bench.z + 0.75], [-W / 2, D / 2 - 1.8, -W / 2 + 1.2, D / 2]);
    if (lab) blocked.push([lab.x - 0.6, lab.z - 0.9, lab.x + 0.6, lab.z + 0.9]);
    blocked.push([-W / 2, -D / 2, -W / 2 + 0.9, -D / 2 + 0.9]);   // 奥の左の角（季節の飾り）
    // 人が通れない所（机・棚・ライン…）。家具は navBuild で足す
    const solid = desks.map(d => [d.x - 0.72, d.z - 0.38, d.x + 0.72, d.z + 0.38]);
    solid.push([ceo.x - 0.95, ceo.z - 0.45, ceo.x + 0.95, ceo.z + 0.45], [bx0 - 0.05, bz - 0.4, pack.x + 0.35, bz + 0.4], [pack.x - 0.35, bz - 1.15, pack.x + 0.35, bz], [-W / 2, shelf.z - 1.18, -W / 2 + 0.45, shelf.z + 1.18], [bench.x - 0.35, bench.z - 0.65, bench.x + 0.35, bench.z + 0.65], [-W / 2, -D / 2, -W / 2 + 0.8, -D / 2 + 0.8]);
    if (lab) solid.push([lab.x - 0.45, lab.z - 0.8, lab.x + 0.45, lab.z + 0.8]);
    return { W, D, desks, ceo, bz, bx0, bx1, pack, shelf, bench, lab, door, blocked, solid };
  },
  // 製品のモデル（同じ製品は使い回す）
  productModel(p, s) {
    let t = this.models.get(p.id); if (!t) { t = buildProduct(p, { cheap: true }); t.traverse(c => { if (c.isMesh) { c.castShadow = true; } }); this.models.set(p.id, t); }
    const m = t.clone(); m.traverse(c => { if (c.isMesh) c.userData.shared = true; }); m.userData.size = t.userData.size; m.scale.setScalar(s); return m;
  },
  build(S) {
    if (this.root) { this.scene.remove(this.root); this.root.traverse(c => { if (c.userData.shared) { c.geometry = null; c.material = null; } }); disposeTree(this.root); }
    const R = this.root = new THREE.Group(); this.scene.add(R); this.agents = []; this.belt = []; this.mach = []; this.icons = [];
    const Lo = this.lay = this.layout(S), W = Lo.W, D = Lo.D, H = 3, tier = S.tier, season = this.season(S.day);
    this.W = W; this.D = D;
    const box = (w, h, d, mat, x, y, z, cast = true, par = R) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; par.add(m); return m; };
    this.box = box;
    // 床・壁・窓・扉・ポスター
    const floorTex = this.floorTex(tier); floorTex.repeat.set(W / 2, D / 2);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: floorTex, roughness: tier === 3 ? 0.25 : 0.7 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; R.add(floor); this.floor = floor;
    box(W + 0.4, 0.3, D + 0.4, new THREE.MeshStandardMaterial({ color: 0x8c7d63, roughness: 0.9 }), 0, -0.16, 0, false);
    const wallM = new THREE.MeshStandardMaterial({ color: [0xf1e6d2, 0xeef0ec, 0xe9edf2, 0xdfe6ee][tier], roughness: 0.9 });
    const trimM = new THREE.MeshStandardMaterial({ color: [0xa47b52, 0xd9d3c7, 0x9aa3ad, 0x5d6670][tier], roughness: 0.6 });
    const wz = -D / 2 - 0.08, nWin = Math.max(1, Math.floor(W / 3.4)), ww = Math.min(2.2, (W - 1) / nWin - 0.6);
    box(W, 0.95, 0.16, wallM, 0, 0.475, wz); box(W, H - 2.45, 0.16, wallM, 0, 2.45 + (H - 2.45) / 2, wz);
    const xs = []; for (let i = 0; i < nWin; i++) xs.push(-W / 2 + (i + 0.5) * W / nWin);
    let prev = -W / 2; for (const x of xs) { box(x - ww / 2 - prev, 1.5, 0.16, wallM, (prev + x - ww / 2) / 2, 1.7, wz); prev = x + ww / 2; } box(W / 2 - prev, 1.5, 0.16, wallM, (prev + W / 2) / 2, 1.7, wz);
    const skyT = this.skyTex(tier, season);
    for (const x of xs) {
      box(ww + 0.1, 0.08, 0.22, trimM, x, 0.95, wz + 0.02); box(ww + 0.1, 0.06, 0.2, trimM, x, 2.45, wz); box(0.05, 1.5, 0.12, trimM, x, 1.7, wz);
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(ww, 1.5), new THREE.MeshBasicMaterial({ map: skyT })); sky.position.set(x, 1.7, wz - 0.25); R.add(sky);
    }
    this.winXs = xs;
    const lx = -W / 2 - 0.08;
    box(0.16, H, D, wallM, lx, H / 2, 0);
    box(0.06, 2.1, 0.95, new THREE.MeshStandardMaterial({ color: 0x9b7650, roughness: 0.6 }), lx + 0.1, 1.05, D / 2 - 1.1);
    box(0.16, 0.12, D, trimM, lx + 0.02, 0.06, 0); box(W, 0.12, 0.16, trimM, 0, 0.06, wz + 0.02);
    const post = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.76), new THREE.MeshStandardMaterial({ map: this.posterTex(S), roughness: 0.7 })); post.rotation.y = Math.PI / 2; post.position.set(lx + 0.1, 2.55, D / 2 - 1.1); R.add(post);
    // 机・椅子・モニター
    const deskM = new THREE.MeshStandardMaterial({ color: tier === 0 ? 0xb88b5d : 0xe9e4da, roughness: 0.55 }), legM = new THREE.MeshStandardMaterial({ color: 0x5b5f66, roughness: 0.4, metalness: 0.6 });
    const scrM = new THREE.MeshStandardMaterial({ color: 0x1a2230, emissive: 0x35557a, emissiveIntensity: 0.55, roughness: 0.3 }), monM = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.5 });
    this.legM = legM;
    Lo.desks.forEach((dk, i) => {
      const { x, z } = dk;
      box(1.4, 0.05, 0.72, deskM, x, 0.74, z); for (const sx of [-0.62, 0.62]) box(0.05, 0.72, 0.62, legM, x + sx, 0.37, z, false);
      const nm = S.equip.monitor > 0 ? 2 : 1;
      for (let k = 0; k < nm; k++) { const mx = x + (nm === 2 ? (k ? 0.3 : -0.3) : 0); const m = box(0.56, 0.34, 0.03, monM, mx, 1.0, z - 0.2); m.rotation.y = nm === 2 ? (k ? -0.18 : 0.18) : 0; const sc = box(0.52, 0.3, 0.005, scrM, mx, 1.0, z - 0.183, false); sc.rotation.y = m.rotation.y; box(0.06, 0.16, 0.06, monM, mx, 0.84, z - 0.22, false); }
      box(0.42, 0.02, 0.14, monM, x, 0.775, z + 0.06, false);
      this.chair(R, x, z + 0.55, S.equip.chair);
      const m = S.staff[i];
      if (m) {
        if (m.role === 'des') box(0.3, 0.012, 0.22, new THREE.MeshStandardMaterial({ color: 0x222222 }), x + 0.45, 0.775, z + 0.05, false);
        if (m.role === 'qa') { const mg = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16), legM); mg.rotation.x = Math.PI / 2; mg.position.set(x - 0.5, 0.78, z + 0.1); R.add(mg); }
        if (m.role === 'res') for (let k = 0; k < 3; k++) box(0.22, 0.04, 0.3, new THREE.MeshStandardMaterial({ color: [0xd9493e, 0x2b6fd6, 0xf0a03a][k] }), x - 0.48, 0.79 + k * 0.04, z + 0.12, false);
        this.addAgent(m, dk);
      }
    });
    // 社長の机
    const cx = Lo.ceo.x, cz = Lo.ceo.z;
    box(1.9, 0.07, 0.9, new THREE.MeshStandardMaterial({ color: 0x7a5233, roughness: 0.45 }), cx, 0.76, cz); box(1.8, 0.7, 0.05, new THREE.MeshStandardMaterial({ color: 0x6b462b, roughness: 0.5 }), cx, 0.38, cz - 0.4);
    box(0.5, 0.34, 0.03, monM, cx + 0.3, 1.0, cz - 0.25); box(0.46, 0.3, 0.005, scrM, cx + 0.3, 1.0, cz - 0.233, false);
    this.chair(R, cx, cz + 0.62, 3);
    this.addAgent({ id: 'boss', role: 'boss', hair: '#2a211b' }, { x: cx, z: cz, seat: { x: cx, z: cz + 0.65 } });
    // 試作ラボ
    if (Lo.lab) { const { x, z } = Lo.lab; box(0.9, 0.05, 1.6, new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 }), x, 0.9, z); box(0.85, 0.88, 1.55, new THREE.MeshStandardMaterial({ color: 0x8aa0b4, roughness: 0.6 }), x, 0.44, z); for (let k = 0; k < S.equip.lab; k++) box(0.22, 0.3 + k * 0.08, 0.22, new THREE.MeshStandardMaterial({ color: [0x4f7fb8, 0xd9493e, 0x2e9a63][k], roughness: 0.4 }), x, 1.07 + k * 0.04, z - 0.5 + k * 0.5); }
    this.buildLine(S, Lo);
    this.buildBench(S, Lo);
    // 製品の棚（左の壁ぎわ）：発売した製品の最新12こ
    const shx = Lo.shelf.x, shz = Lo.shelf.z, sw = 2.3, shM = new THREE.MeshStandardMaterial({ color: 0xf6f1e6, roughness: 0.55 }), shB = new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.7 });
    box(0.04, 1.75, sw, shB, shx + 0.02, 0.875, shz); for (const sz of [-sw / 2, sw / 2]) box(0.42, 1.75, 0.04, shM, shx + 0.21, 0.875, shz + sz);
    for (let k = 0; k < 4; k++) box(0.42, 0.035, sw, shM, shx + 0.21, 0.08 + k * 0.52, shz, false);
    S.products.slice(-12).forEach((pr, i) => {
      const sc = pr.kind === 'eraser' || pr.kind === 'lead' ? 0.06 : 0.04, m = this.productModel(pr, sc), row = (i / 3) | 0, col = i % 3;
      m.rotation.y = -Math.PI / 2 + 0.35; m.position.set(shx + 0.22, 0.1 + (3 - row) * 0.52 + m.userData.size.y * sc / 2, shz - 0.75 + col * 0.75); R.add(m);
    });
    // 家具・季節の飾り
    this.furnObjs = [];
    for (const f of S.furn || []) { const o = FURNI.model(f.type); FURNI.placeObj(o, f, Lo); R.add(o); o.userData.furn = f; this.furnObjs.push(o); }
    this.decor(S, Lo, season);
    this.navBuild(S, Lo);
    // 使わなくなった製品のモデルを片づける
    const used = new Set([...S.products.slice(-14).map(p => p.id), ...S.products.filter(p => p.active).map(p => p.id), ...S.devs.map(v => v.id)]);
    for (const [id, t] of this.models) if (!used.has(id)) { disposeTree(t); this.models.delete(id); }
    this.sun.target.position.set(0, 0, 0);
    if (typeof FURNI !== 'undefined' && FURNI.on) FURNI.refreshLabels();
  },
  // ---------- 生産ライン：ベルト・動く機械・箱づめ ----------
  buildLine(S, Lo) {
    const R = this.root, box = this.box, legM = this.legM, lineLv = S.equip.line, { bx0, bx1, bz, pack } = Lo;
    this.bz = bz; this.bx0 = bx0; this.bx1 = bx1; this.beltTex = null;
    if (S.tier === 0 && lineLv <= 1) {   // 手作りの作業台
      box(bx1 - bx0, 0.06, 0.8, new THREE.MeshStandardMaterial({ color: 0xa57a4f, roughness: 0.6 }), (bx0 + bx1) / 2, 0.85, bz); for (const sx of [bx0 + 0.1, bx1 - 0.1]) box(0.08, 0.84, 0.7, legM, sx, 0.42, bz, false);
      this.beltY = 0.89; this.beltBase = 0.18;
    } else {
      const bt = this.beltTex = this.beltTexMake(); bt.repeat.set((bx1 - bx0) * 4, 1);
      box(bx1 - bx0, 0.12, 0.7, new THREE.MeshStandardMaterial({ map: bt, roughness: 0.8 }), (bx0 + bx1) / 2, 0.78, bz);
      box(bx1 - bx0 + 0.1, 0.08, 0.06, legM, (bx0 + bx1) / 2, 0.82, bz - 0.38); box(bx1 - bx0 + 0.1, 0.08, 0.06, legM, (bx0 + bx1) / 2, 0.82, bz + 0.38);
      for (let x = bx0 + 0.3; x < bx1; x += 1.2) box(0.08, 0.72, 0.6, legM, x, 0.36, bz, false);
      const types = ['press', 'print', 'arm', 'press', 'print', 'arm'], cols = [0x3f6f9e, 0xd9a03b, 0x5a8f63, 0xb5544a, 0x6d6aa8, 0x777f88];
      for (let k = 0; k < lineLv; k++) {
        const mx = bx0 + 0.9 + k * (bx1 - bx0 - 1.8) / Math.max(1, lineLv - 1), type = types[k], cm = new THREE.MeshStandardMaterial({ color: cols[k], roughness: 0.45, metalness: 0.2 }), steel = new THREE.MeshStandardMaterial({ color: 0xb8bdc4, metalness: 0.8, roughness: 0.3 });
        const g = new THREE.Group(); g.position.set(mx, 0, bz); R.add(g); const M = { type, g, x: mx, ph: k * 1.3 };
        if (type === 'press') { box(0.12, 1.0, 0.12, cm, -0.38, 1.3, -0.3, true, g); box(0.12, 1.0, 0.12, cm, 0.38, 1.3, -0.3, true, g); box(0.12, 1.0, 0.12, cm, -0.38, 1.3, 0.3, true, g); box(0.12, 1.0, 0.12, cm, 0.38, 1.3, 0.3, true, g); box(0.9, 0.18, 0.75, cm, 0, 1.85, 0, true, g); M.head = box(0.4, 0.22, 0.4, steel, 0, 1.4, 0, true, g); M.rod = box(0.08, 0.4, 0.08, steel, 0, 1.6, 0, true, g); }
        else if (type === 'print') { box(0.1, 0.75, 0.1, cm, -0.35, 1.2, -0.38, true, g); box(0.1, 0.75, 0.1, cm, 0.35, 1.2, -0.38, true, g); box(0.1, 0.75, 0.1, cm, -0.35, 1.2, 0.38, true, g); box(0.1, 0.75, 0.1, cm, 0.35, 1.2, 0.38, true, g); box(0.1, 0.1, 0.86, cm, 0, 1.55, 0, true, g); M.head = box(0.28, 0.2, 0.2, steel, 0, 1.4, 0, true, g); const ink = box(0.06, 0.08, 0.06, new THREE.MeshStandardMaterial({ color: 0xd9493e, emissive: 0x551510 }), 0, 1.27, 0, false, g); ink.parent.remove(ink); M.head.add(ink); ink.position.set(0, -0.13, 0); }
        else { box(0.4, 0.3, 0.4, cm, 0, 0.15, -0.6, true, g); const base = new THREE.Group(); base.position.set(0, 0.3, -0.6); g.add(base); box(0.12, 0.6, 0.12, steel, 0, 0.3, 0, true, base); const el = new THREE.Group(); el.position.set(0, 0.6, 0); base.add(el); box(0.1, 0.1, 0.55, cm, 0, 0, 0.27, true, el); const grip = box(0.12, 0.14, 0.08, steel, 0, -0.05, 0.56, true, el); void grip; M.base = base; M.el = el; }
        M.lamp = box(0.1, 0.1, 0.02, new THREE.MeshStandardMaterial({ color: 0x55ff88, emissive: 0x33dd66, emissiveIntensity: 1 }), 0.3, 1.6, 0.43, false, g);
        this.mach.push(M);
      }
      this.beltY = 0.85; this.beltBase = 0.55;
    }
    // 箱づめ：開いた箱に製品が入り、4こでふたが閉まって、となりに積まれる
    const cardM = new THREE.MeshStandardMaterial({ color: 0xc49a62, roughness: 0.85 }), pg = new THREE.Group(); pg.position.set(pack.x, 0, pack.z); R.add(pg);
    box(0.7, 0.6, 0.7, new THREE.MeshStandardMaterial({ color: 0x7a7f87, roughness: 0.5, metalness: 0.4 }), 0, 0.3, 0, true, pg);   // 台
    const bx = new THREE.Group(); bx.position.set(0, 0.6, 0); pg.add(bx);
    box(0.5, 0.02, 0.5, cardM, 0, 0.01, 0, true, bx); for (const [x, z, w, d] of [[-0.25, 0, 0.02, 0.5], [0.25, 0, 0.02, 0.5], [0, -0.25, 0.5, 0.02], [0, 0.25, 0.5, 0.02]]) box(w, 0.32, d, cardM, x, 0.17, z, true, bx);
    const flaps = []; for (const s of [-1, 1]) { const f = new THREE.Group(); f.position.set(s * 0.25, 0.33, 0); bx.add(f); box(0.25, 0.015, 0.5, cardM, -s * 0.125, 0, 0, true, f); f.rotation.z = s * 1.9; flaps.push(f); }
    const stack = new THREE.Group(); stack.position.set(0, 0, -0.85); pg.add(stack);
    this.pack = { g: pg, box: bx, flaps, stack, n: 0, t: 0, phase: 'fill', cardM, h: 0 };
    const onSale = S.products.filter(p => p.active), src = onSale.length ? onSale : S.products.slice(-3);
    const n = src.length ? Math.min(10, Math.max(4, Math.floor((bx1 - bx0) / 0.8))) : 0;
    for (let i = 0; i < n; i++) { const pr = src[i % src.length], m = this.productModel(pr, pr.kind === 'eraser' || pr.kind === 'lead' ? 0.06 : 0.045); m.userData.t = i / n; R.add(m); this.belt.push(m); }
    this.onSale = onSale.length;
  },
  // ---------- 試験台：開発中の試作品を落としたり、書かせたりする ----------
  buildBench(S, Lo) {
    const R = this.root, box = this.box, { x, z } = Lo.bench, g = new THREE.Group(); g.position.set(x, 0, z); R.add(g);
    box(0.7, 0.05, 1.3, new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.5 }), 0, 0.85, 0, true, g); for (const sz of [-0.55, 0.55]) box(0.6, 0.83, 0.05, this.legM, 0, 0.42, sz, false, g);
    // 落下テストの塔
    const tw = new THREE.MeshStandardMaterial({ color: 0x6d7a88, roughness: 0.4, metalness: 0.5 });
    for (const sx of [-0.2, 0.2]) box(0.03, 0.75, 0.03, tw, sx, 1.25, -0.4, true, g); box(0.43, 0.03, 0.03, tw, 0, 1.62, -0.4, true, g); box(0.4, 0.02, 0.3, new THREE.MeshStandardMaterial({ color: 0x3a3d42 }), 0, 0.885, -0.4, false, g);
    // 書き味テスト：紙とロボットの腕
    const c = newCanvas(256, 128), q = c.getContext('2d'); q.fillStyle = '#fbfbf6'; q.fillRect(0, 0, 256, 128);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); paper.rotation.x = -Math.PI / 2; paper.rotation.z = Math.PI / 2; paper.position.set(0, 0.877, 0.3); g.add(paper);
    this.bench = { g, paper: { c, q, tex }, item: null, t: 0, sign: null };
    const dev = S.devs.find(v => !v.ready);
    if (dev) { const m = this.productModel(dev, dev.kind === 'eraser' || dev.kind === 'lead' ? 0.05 : 0.035); g.add(m); this.bench.item = m; this.bench.kind = dev.kind; }
  },
  // ---------- 季節の飾り ----------
  decor(S, Lo, season) {
    const R = this.root, box = this.box, W = Lo.W, D = Lo.D;
    const cx = -W / 2 + 0.5, cz = -D / 2 + 0.5;
    if (season === 'xmas') {
      const g = new THREE.Group(); g.position.set(cx, 0, cz); R.add(g); const gm = new THREE.MeshStandardMaterial({ color: 0x2f7a46, roughness: 0.7 });
      box(0.3, 0.3, 0.3, new THREE.MeshStandardMaterial({ color: 0xb5544a }), 0, 0.15, 0, true, g);
      for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.55 - k * 0.13, 0.7, 14), gm); c.position.y = 0.6 + k * 0.42; c.castShadow = true; g.add(c); }
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshStandardMaterial({ color: 0xffd34a, emissive: 0x806010 })); star.position.y = 1.72; g.add(star);
      for (let k = 0; k < 12; k++) { const a = k * 2.4, h = 0.45 + (k % 6) * 0.17, r = 0.48 - (h - 0.45) * 0.36; const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshStandardMaterial({ color: [0xd9493e, 0xf6c945, 0x2b8fd6, 0xffffff][k % 4], emissive: 0x222222, metalness: 0.5, roughness: 0.3 })); b.position.set(Math.sin(a) * r, h, Math.cos(a) * r); g.add(b); }
    } else if (season === 'newyear') {
      for (const dz2 of [-0.68, 0.68]) { const g = new THREE.Group(); g.position.set(-W / 2 + 0.3, 0, D / 2 - 1.1 + dz2); R.add(g); const bm = new THREE.MeshStandardMaterial({ color: 0x6e9a4a, roughness: 0.5 }); [[0, 0.9], [0.09, 0.7], [-0.09, 0.6]].forEach(([x, h]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, h, 10), bm); c.position.set(x, h / 2 + 0.25, 0); c.castShadow = true; g.add(c); }); box(0.34, 0.25, 0.34, new THREE.MeshStandardMaterial({ color: 0xc9a66b, roughness: 0.9 }), 0, 0.125, 0, true, g); const pine = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshStandardMaterial({ color: 0x2f5a35 })); pine.scale.set(1, 0.6, 1); pine.position.y = 0.35; g.add(pine); }
    } else if (season === 'halloween') {
      for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.16 - k * 0.03, 14, 10), new THREE.MeshStandardMaterial({ color: 0xe0782a, roughness: 0.6 })); p.scale.set(1.2, 0.85, 1.2); p.position.set(cx + k * 0.28 - 0.1, 0.13, cz + (k % 2) * 0.2); p.castShadow = true; R.add(p); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.08, 6), new THREE.MeshStandardMaterial({ color: 0x5a6a2a })); st.position.set(p.position.x, p.position.y + 0.15 - k * 0.02, p.position.z); R.add(st); }
    } else if (season === 'summer') {
      const g = new THREE.Group(); g.position.set(cx, 0, cz); R.add(g); const wm = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.4 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.12, 1.0, 12), wm); pole.position.y = 0.5; g.add(pole);
      const head = new THREE.Group(); head.position.set(0, 1.05, 0.08); g.add(head); const blades = new THREE.Group(); head.add(blades);
      for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.01), new THREE.MeshStandardMaterial({ color: 0x8fc8e8, transparent: true, opacity: 0.8 })); b.position.y = 0.1; const h = new THREE.Group(); h.rotation.z = k * TAU / 3; h.add(b); blades.add(h); }
      const cage = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.008, 6, 24), wm); head.add(cage); this.fan = blades; this.fanHead = head;
    }
    if (season === 'sakura') {   // 社長の机に桜の枝
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0x5a7a9a, roughness: 0.3 })); v.position.set(Lo.ceo.x - 0.7, 0.9, Lo.ceo.z - 0.2); R.add(v);
      for (let k = 0; k < 9; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0xf6c3d3 })); b.position.set(v.position.x + Math.sin(k * 2.1) * 0.12, 1.08 + k * 0.035, v.position.z + Math.cos(k * 2.1) * 0.1); R.add(b); }
    }
    if (season !== 'summer') { this.fan = null; }
  },
  // ---------- 人：ひざ・ひじが曲がる（座る・立つ・歩く・喜ぶ） ----------
  makePerson(shirt, hair, pantsCol = 0x3b4250, skin = 0xe9c4a2) {
    const root = new THREE.Group(), hip = new THREE.Group(); root.add(hip);
    const skinM = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 }), shirtM = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.75 }), pants = new THREE.MeshStandardMaterial({ color: pantsCol, roughness: 0.8 }), shoe = new THREE.MeshStandardMaterial({ color: 0x2a2522, roughness: 0.6 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.3, 4, 10), shirtM); torso.position.set(0, 0.34, 0.02); hip.add(torso);
    const head = new THREE.Group(); head.position.set(0, 0.73, 0); hip.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), skinM));
    const hr = new THREE.Mesh(new THREE.SphereGeometry(0.137, 16, 10, 0, TAU, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: hair || '#2b2118', roughness: 0.8 })); hr.position.set(0, 0.012, 0.012); hr.rotation.x = -0.25; head.add(hr);
    const legs = [], arms = [];
    for (const sx of [-0.1, 0.1]) {
      const th = new THREE.Group(); th.position.set(sx, 0.02, 0); hip.add(th);
      const tm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.28, 4, 8), pants); tm.position.y = -0.21; th.add(tm);
      const kn = new THREE.Group(); kn.position.y = -0.42; th.add(kn);
      const sm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.28, 4, 8), pants); sm.position.y = -0.2; kn.add(sm);
      const ft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.2), shoe); ft.position.set(0, -0.43, -0.05); kn.add(ft);
      legs.push({ th, kn });
    }
    for (const sx of [-0.21, 0.21]) {
      const sh = new THREE.Group(); sh.position.set(sx, 0.52, 0.03); hip.add(sh);
      const ua = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.2, 4, 8), shirtM); ua.position.y = -0.13; sh.add(ua);
      const el = new THREE.Group(); el.position.y = -0.27; sh.add(el);
      const fa = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.2, 4, 8), shirtM); fa.position.y = -0.12; el.add(fa);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), skinM); hand.position.y = -0.26; el.add(hand);
      arms.push({ sh, el, hand });
    }
    root.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    return { root, hip, head, legs, arms };
  },
  // 姿勢：sit（キーボード）・sofa・stand・walk・cheer・drink・talk
  pose(r, mode, t) {
    const L = r.legs, A = r.arms;
    const set = (a, b, c, d) => { L[0].th.rotation.x = a; L[1].th.rotation.x = b; L[0].kn.rotation.x = c; L[1].kn.rotation.x = d; };
    A[0].sh.rotation.z = 0; A[1].sh.rotation.z = 0; r.head.rotation.set(0, 0, 0);
    if (mode === 'sit' || mode === 'sofa') {
      r.hip.position.y = mode === 'sofa' ? 0.45 : 0.5; set(Math.PI / 2, Math.PI / 2, -Math.PI / 2, -Math.PI / 2);
      if (mode === 'sit') { A[0].sh.rotation.x = 0.35; A[1].sh.rotation.x = 0.35; A[0].el.rotation.x = 1.25 + Math.sin(t * 9) * 0.12; A[1].el.rotation.x = 1.25 + Math.sin(t * 9 + 2.1) * 0.12; r.head.rotation.x = 0.12; r.head.rotation.y = Math.sin(t * 0.31) * 0.25; }
      else { A[0].sh.rotation.x = 0.15; A[1].sh.rotation.x = 0.15; A[0].el.rotation.x = 0.5; A[1].el.rotation.x = 0.5; r.head.rotation.x = -0.1; r.head.rotation.y = Math.sin(t * 0.5) * 0.4; }
    } else if (mode === 'walk') {
      const s = Math.sin(t * 8.5); r.hip.position.y = 0.9 + Math.abs(Math.cos(t * 8.5)) * 0.03;
      set(0.5 * s, -0.5 * s, -0.7 * Math.max(0, -s), -0.7 * Math.max(0, s));
      A[0].sh.rotation.x = -0.45 * s; A[1].sh.rotation.x = 0.45 * s; A[0].el.rotation.x = 0.3; A[1].el.rotation.x = 0.3;
    } else if (mode === 'cheer') {
      const j = Math.abs(Math.sin(t * 7)); r.hip.position.y = 0.9 + j * 0.18; set(-0.1 * j, -0.1 * j, -0.3 * j, -0.3 * j);
      A[0].sh.rotation.x = Math.PI - 0.15; A[1].sh.rotation.x = Math.PI - 0.15; A[0].sh.rotation.z = -0.35; A[1].sh.rotation.z = 0.35; A[0].el.rotation.x = 0.2 * j; A[1].el.rotation.x = 0.2 * j; r.head.rotation.x = -0.25;
    } else {
      r.hip.position.y = 0.9; set(0, 0, 0, 0);
      if (mode === 'drink') { const d = (Math.sin(t * 1.4) + 1) / 2; A[1].sh.rotation.x = 0.4 + d * 0.5; A[1].el.rotation.x = 1.6 + d * 0.5; A[0].sh.rotation.x = 0.05; A[0].el.rotation.x = 0.1; r.head.rotation.x = -0.15 * d; }
      else if (mode === 'talk') { A[0].sh.rotation.x = 0.5 + Math.sin(t * 3) * 0.25; A[1].sh.rotation.x = 0.4 + Math.sin(t * 2.3 + 1) * 0.3; A[0].el.rotation.x = 0.9; A[1].el.rotation.x = 0.8; r.head.rotation.y = Math.sin(t * 0.9) * 0.3; }
      else { A[0].sh.rotation.x = 0.05; A[1].sh.rotation.x = 0.05; A[0].el.rotation.x = 0.15; A[1].el.rotation.x = 0.15; r.head.rotation.y = Math.sin(t * 0.6) * 0.35; r.head.rotation.x = -0.05; }
    }
  },
  addAgent(m, dk) {
    const boss = m.role === 'boss', rig = this.makePerson(boss ? '#2c3a5c' : ROLES[m.role].shirt, m.hair, boss ? 0x232838 : 0x3b4250);
    rig.root.position.set(dk.seat.x, 0, dk.seat.z); this.root.add(rig.root);
    const a = { id: m.id, role: m.role, rig, seat: dk.seat, deskZ: dk.z, state: 'sit', t: boss ? rr(30, 70) : rr(6, 30), ph: Math.random() * 10, path: [], icon: null, iconT: 0, cheerT: 0, boss };
    this.pose(rig, 'sit', a.ph); this.agents.push(a); return a;
  },
  // 行き先：休けい（コーヒー・ソファ・自販機）・打ち合わせ（ホワイトボード等）・見る（本棚・水そう・窓・棚）・試験台（品質チェック）・外回り（営業）
  pickTrip(a) {
    const Lo = this.lay, F = this.furnObjs || [], opts = [];
    const front = (o, dist) => {
      const f = o.userData.furn, fp = FURN[f.type], c = FURNI.center(f, Lo), r = f.rot || 0, dx = [0, 1, 0, -1][r], dz = [1, 0, -1, 0][r], off = fp.d * 0.25 + dist;
      const kind = fp.brk || (fp.meet ? 'meet' : 'look'), t = { x: c.x + dx * off, z: c.z + dz * off, look: { x: c.x, z: c.z }, kind, fur: f.type, side: { x: dz, z: -dx } };
      if (kind === 'sofa') {   // あいている側にすわる
        const seats = [-0.45, 0.45].map(k => ({ x: c.x + dx * 0.05 + t.side.x * k, z: c.z + dz * 0.05 + t.side.z * k })).filter(q => !this.agents.some(b => b.trip && b.trip.sit && !b.back && b.state !== 'sit' && Math.hypot(b.trip.sit.x - q.x, b.trip.sit.z - q.z) < 0.3));
        if (!seats.length) return null; t.sit = pick(seats); t.x += t.sit.x - c.x - dx * 0.05; t.z += t.sit.z - c.z - dz * 0.05; t.face = Math.atan2(-dx, -dz) + Math.PI;
      }
      return t;
    };
    for (const o of F) {
      const fp = FURN[o.userData.furn.type];
      if (fp.brk) { const t = front(o, fp.brk === 'sofa' ? 0.45 : 0.35); if (t) opts.push([t, a.boss ? 1 : 3]); }
      else if (fp.meet) opts.push([front(o, 0.75), a.role === 'res' || a.role === 'des' ? 3 : 1]);
      else if (fp.look || o.userData.furn.type === 'piano') opts.push([front(o, 0.5), 1.5]);
    }
    if (a.role === 'qa') opts.push([{ x: Lo.bench.x - 0.75, z: Lo.bench.z, look: { x: Lo.bench.x, z: Lo.bench.z }, kind: 'bench' }, 4]);
    if (a.role === 'sal') opts.push([{ x: Lo.door.x + 0.3, z: Lo.door.z, look: { x: Lo.door.x - 1, z: Lo.door.z }, kind: 'out' }, 3]);
    const wx = (this.winXs || [0])[(Math.random() * (this.winXs || [0]).length) | 0];
    opts.push([{ x: wx, z: -Lo.D / 2 + 0.6, look: { x: wx, z: -Lo.D / 2 - 1 }, kind: 'look' }, 1]);
    opts.push([{ x: Lo.shelf.x + 1.0, z: Lo.shelf.z, look: { x: Lo.shelf.x, z: Lo.shelf.z }, kind: 'look' }, a.boss ? 2 : 1]);
    opts.push([{ x: (Lo.bx0 + Lo.bx1) / 2, z: Lo.bz - 0.9, look: { x: (Lo.bx0 + Lo.bx1) / 2, z: Lo.bz }, kind: 'look' }, a.boss ? 2 : 0.6]);
    let sum = opts.reduce((s, o) => s + o[1], 0), r = Math.random() * sum; for (const [o, w] of opts) { r -= w; if (r <= 0) return o; } return opts[0][0];
  },
  // 打ち合わせ：もう一人を呼ぶ
  callMate(a, trip) {
    const mate = this.agents.filter(b => b !== a && !b.boss && b.state === 'sit' && b.t > 4); if (!mate.length || Math.random() < 0.35) return;
    const b = pick(mate), t = Object.assign({}, trip, { x: trip.x + trip.side.x * 0.7, z: trip.z + trip.side.z * 0.7 });
    trip.x -= trip.side.x * 0.35; trip.z -= trip.side.z * 0.35; b.trip = t; b.path = this.route(b.rig.root.position, t); b.state = 'walk'; b.back = false;
  },
  // ---------- 通り道：0.25m のマスで A*（机・棚・家具をよける） ----------
  navBuild(S, Lo) {
    const C = 0.25, nx = Math.round(Lo.W / C), nz = Math.round(Lo.D / C), g = new Uint8Array(nx * nz), R = 0.2, sol = Lo.solid.slice();
    for (const f of S.furn || []) { const r = FURNI.rect(f, Lo); sol.push([r[0] + 0.05, r[1] + 0.05, r[2] - 0.05, r[3] - 0.05]); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = -Lo.W / 2 + (i + 0.5) * C, z = -Lo.D / 2 + (j + 0.5) * C;
      let b = x < -Lo.W / 2 + R || z < -Lo.D / 2 + R || x > Lo.W / 2 - 0.15 || z > Lo.D / 2 - 0.15;
      if (!b) for (const r of sol) if (x > r[0] - R && x < r[2] + R && z > r[1] - R && z < r[3] + R) { b = 1; break; }
      g[j * nx + i] = b ? 1 : 0;
    }
    this.nav = { C, nx, nz, g, x0: -Lo.W / 2, z0: -Lo.D / 2 };
  },
  navCell(p) { const N = this.nav; return [clamp(Math.floor((p.x - N.x0) / N.C), 0, N.nx - 1), clamp(Math.floor((p.z - N.z0) / N.C), 0, N.nz - 1)]; },
  navPt(c) { const N = this.nav; return { x: N.x0 + ((c % N.nx) + 0.5) * N.C, z: N.z0 + (((c / N.nx) | 0) + 0.5) * N.C }; },
  nearFree(i, j) {
    const N = this.nav; if (!N.g[j * N.nx + i]) return j * N.nx + i;
    for (let r = 1; r < 14; r++) { let best = -1, bd = 1e9; for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N.nx || b >= N.nz || N.g[b * N.nx + a]) continue; const d = di * di + dj * dj; if (d < bd) { bd = d; best = b * N.nx + a; } } if (best >= 0) return best; }
    return j * N.nx + i;
  },
  los(a, b) {
    const N = this.nav, d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / 0.08);
    for (let k = 1; k < n; k++) { const t = k / n, [i, j] = this.navCell({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }); if (N.g[j * N.nx + i]) return false; }
    return true;
  },
  astar(s, t) {
    const N = this.nav, nx = N.nx, M = nx * N.nz, G = new Float32Array(M).fill(1e9), P = new Int32Array(M).fill(-1), done = new Uint8Array(M), H = [];
    const h = c => { const dx = Math.abs(c % nx - t % nx), dz = Math.abs(((c / nx) | 0) - ((t / nx) | 0)); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
    const push = (f, c) => { H.push([f, c]); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
    const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
    G[s] = 0; push(h(s), s);
    while (H.length) {
      const [, c] = pop(); if (c === t) break; if (done[c]) continue; done[c] = 1;
      const ci = c % nx, cj = (c / nx) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue; const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= nx || nj >= N.nz) continue;
        const n = nj * nx + ni; if (N.g[n] && n !== t) continue; if (di && dj && (N.g[cj * nx + ni] || N.g[nj * nx + ci])) continue;
        const ng = G[c] + (di && dj ? 1.414 : 1); if (ng < G[n]) { G[n] = ng; P[n] = c; push(ng + h(n), n); }
      }
    }
    if (s !== t && P[t] < 0) return null;
    const out = []; for (let c = t; c !== s && c >= 0; c = P[c]) out.push(c); return out.reverse();
  },
  route(from, to) {
    if (!this.nav) return [{ x: to.x, z: to.z }];
    const [si, sj] = this.navCell(from), [ti, tj] = this.navCell(to), s = this.nearFree(si, sj), t = this.nearFree(ti, tj), cells = this.astar(s, t);
    if (!cells) return [{ x: to.x, z: to.z }];
    const pts = [this.navPt(s), ...cells.map(c => this.navPt(c))], out = []; let cur = { x: from.x, z: from.z }, k = 0;
    while (k < pts.length) { let far = k; for (let m = pts.length - 1; m > k; m--) if (this.los(cur, pts[m])) { far = m; break; } cur = pts[far]; out.push(cur); k = far + 1; }
    const end = out[out.length - 1]; if (!end || Math.hypot(end.x - to.x, end.z - to.z) > 0.02) out.push({ x: to.x, z: to.z });
    return out;
  },
  // ---------- 出来事：喜ぶ・アイコン ----------
  event(type, arg) { if (this.events.length < 24) this.events.push([type, arg]); },
  icon(a, kind, sec = 3) {
    if (a.icon) { this.root.remove(a.icon); a.icon.material.dispose(); a.icon = null; }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex(kind), depthTest: false, transparent: true })); sp.renderOrder = 10; sp.scale.setScalar(0.38); this.root.add(sp); a.icon = sp; a.iconT = sec;
  },
  cheer(a, sec = 2.6, ic = 'star') { if (a.state === 'away') return; if (a.state === 'sit' || a.state === 'cheer') { a.state = 'cheer'; a.cheerT = sec; } this.icon(a, ic, sec + 0.5); },
  update(dt, S) {
    this.t += dt;
    // 出来事
    for (const [type, arg] of this.events.splice(0)) {
      if (type === 'research') for (const a of this.agents) { if (a.role === 'res' || a.boss) this.cheer(a, 2.2, 'bulb'); }
      else if (type === 'devdone' || type === 'launch' || type === 'goal') for (const a of this.agents) this.cheer(a, type === 'launch' ? 3 : 2.4, type === 'launch' ? 'heart' : 'star');
      else if (type === 'levelup') { const a = this.agents.find(x => x.id === arg); if (a) this.cheer(a, 2.6, 'up'); }
      else if (type === 'fix') { const a = this.agents.filter(x => x.role === 'qa' && x.state === 'sit'); if (a.length) this.icon(pick(a), 'wrench', 2.5); }
    }
    for (const a of this.agents) this.stepAgent(a, dt, S);
    this.stepLine(dt, S); this.stepBench(dt);
    for (const o of this.furnObjs || []) if (o.userData.anim) o.userData.anim(this.t);
    if (this.fan) { this.fan.rotation.z += dt * 18; this.fanHead.rotation.y = Math.sin(this.t * 0.5) * 0.7; }
    // カメラ：部屋がちょうど入る距離
    const vf = this.cam.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * this.cam.aspect), W = this.W || 8, D = this.D || 6;
    const fit = Math.max(W, D) * 0.55 / Math.tan(Math.min(vf, hf)) + 1.5, d = fit / this.zoom, ty = 0.6;
    this.cam.position.set(Math.sin(this.yaw) * Math.cos(this.pitch) * d, ty + Math.sin(this.pitch) * d, Math.cos(this.yaw) * Math.cos(this.pitch) * d);
    this.cam.lookAt(0, ty, 0.3);
  },
  stepAgent(a, dt, S) {
    const r = a.rig, p = r.root.position;
    a.ph += dt;
    if (a.icon) { a.iconT -= dt; const k = Math.min(1, (3.5 - a.iconT) * 6, a.iconT * 3); a.icon.scale.setScalar(0.38 * clamp(k, 0, 1)); a.icon.position.set(p.x, (a.state === 'sit' || a.state === 'sofa' ? 1.55 : 1.95) + Math.sin(a.ph * 3) * 0.03, p.z); if (a.iconT <= 0) { this.root.remove(a.icon); a.icon.material.dispose(); a.icon = null; } }
    if (a.state === 'sit') {
      p.set(a.seat.x, 0, a.seat.z); r.root.rotation.y += angDiff2(r.root.rotation.y, 0) * Math.min(1, dt * 12); this.pose(r, 'sit', a.ph);
      { a.t -= dt; if (a.t <= 0) { const trip = this.pickTrip(a); a.trip = trip; if (trip.kind === 'meet') this.callMate(a, trip); a.path = this.route(a.seat, trip); if (trip.sit) a.path.push({ x: trip.sit.x, z: trip.sit.z }); a.state = 'walk'; a.back = false; } }
      if (a.role === 'qa' && S && S.devs.some(v => devFound(v) - v.fixed > 0.5) && !a.icon && Math.random() < dt * 0.08) this.icon(a, 'wrench', 2.5);
      if (a.role === 'res' && S && S.research.cur && !a.icon && Math.random() < dt * 0.04) this.icon(a, 'think', 2.2);
    } else if (a.state === 'cheer') {
      p.set(a.seat.x, 0, a.seat.z - 0.05); r.root.rotation.y = 0; this.pose(r, 'cheer', a.ph); a.cheerT -= dt; if (a.cheerT <= 0) a.state = 'sit';
    } else if (a.state === 'walk') {
      const tg = a.path[0]; if (!tg) { this.arrive(a); return; }
      const dx = tg.x - p.x, dz = tg.z - p.z, dist = Math.hypot(dx, dz), step = 1.15 * dt;
      if (dist <= step) { p.x = tg.x; p.z = tg.z; a.path.shift(); if (!a.path.length) this.arrive(a); }
      else { p.x += dx / dist * step; p.z += dz / dist * step; const ty = Math.atan2(-dx, -dz); r.root.rotation.y += angDiff2(r.root.rotation.y, ty) * Math.min(1, dt * 12); }
      this.pose(r, 'walk', a.ph);
    } else if (a.state === 'act') {
      a.t -= dt; const tr = a.trip, k = tr.kind;
      const fy = tr.face != null ? tr.face : tr.look ? Math.atan2(-(tr.look.x - p.x), -(tr.look.z - p.z)) : r.root.rotation.y; r.root.rotation.y += angDiff2(r.root.rotation.y, fy) * Math.min(1, dt * 10);
      this.pose(r, k === 'coffee' ? 'drink' : k === 'meet' ? 'talk' : k === 'sofa' ? 'sofa' : 'stand', a.ph);
      if (a.t <= 0) { a.back = true; a.state = 'walk'; a.path = this.route(p, a.seat); }
    } else if (a.state === 'away') {
      a.t -= dt; if (a.t <= 0) { r.root.visible = true; a.back = true; a.state = 'walk'; this.icon(a, 'yen', 2.5); a.path = this.route(p, a.seat); }
    }
  },
  arrive(a) {
    if (a.back) { a.state = 'sit'; a.t = a.boss ? rr(45, 100) : rr(18, 55); return; }
    const k = a.trip.kind;
    if (k === 'out') { a.state = 'away'; a.t = rr(10, 20); a.rig.root.visible = false; return; }
    a.state = 'act'; a.t = k === 'sofa' ? rr(6, 10) : k === 'meet' ? rr(5, 9) : rr(3.5, 6);
    if (k === 'coffee') this.icon(a, 'coffee', a.t); else if (k === 'meet') this.icon(a, 'chat', a.t); else if (k === 'bench') this.icon(a, 'wrench', a.t); else if (k === 'sofa' || a.trip.fur === 'piano') this.icon(a, 'note', a.t);
  },
  stepLine(dt, S) {
    const busy = this.onSale > 0 ? clamp(0.5 + (S ? S.capUse : 0.5) * 0.6, 0.4, 1.3) : 0, spd = (this.beltBase || 0) * busy, L = this.bx1 - this.bx0;
    if (this.beltTex) this.beltTex.offset.x -= dt * spd * 4;
    for (const M of this.mach) {
      const t = this.t * (busy ? 1 : 0) + M.ph;
      if (M.type === 'press') { const s = Math.pow(Math.max(0, Math.sin(t * 3.2)), 6); M.head.position.y = 1.42 - s * 0.38; M.rod.position.y = 1.62 - s * 0.19; }
      else if (M.type === 'print') M.head.position.z = Math.sin(t * 4) * 0.28;
      else { M.base.rotation.y = Math.sin(t * 1.6) * 1.2; M.el.rotation.x = 0.3 + Math.sin(t * 3.2) * 0.35; }
      M.lamp.material.emissiveIntensity = busy ? 0.6 + 0.6 * Math.max(0, Math.sin(t * 6)) : 0.1;
    }
    const pk = this.pack; let into = 0;
    for (const m of this.belt) {
      const t0 = m.userData.t; m.userData.t = (t0 + dt * spd / Math.max(0.5, L)) % 1; if (m.userData.t < t0) into++;
      m.position.set(this.bx0 + 0.2 + m.userData.t * (L - 0.4), this.beltY + m.userData.size.y * m.scale.y / 2 + 0.005, this.bz); m.rotation.y = 0.15;
    }
    if (!pk) return;
    pk.t += dt;
    if (pk.phase === 'fill') { pk.n += into; if (pk.n >= 4) { pk.phase = 'close'; pk.t = 0; } }
    else if (pk.phase === 'close') { const k = Math.min(1, pk.t / 0.5); pk.flaps[0].rotation.z = -1.9 * (1 - k); pk.flaps[1].rotation.z = 1.9 * (1 - k); if (k >= 1) { pk.phase = 'move'; pk.t = 0; } }
    else if (pk.phase === 'move') {
      const k = Math.min(1, pk.t / 0.6); pk.box.position.z = -0.85 * k; pk.box.position.y = 0.6 - 0.6 * k + (pk.h * 0.34) * k;
      if (k >= 1) {   // 積む
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.5), pk.cardM); c.castShadow = true; c.position.set(0, 0.17 + pk.h * 0.34, 0); pk.stack.add(c);
        const tape = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.005, 0.51), new THREE.MeshStandardMaterial({ color: 0xd9c7a0 })); tape.position.set(0, 0.343 + pk.h * 0.34, 0); pk.stack.add(tape);
        pk.h++; if (pk.h >= 5) { for (const ch of pk.stack.children.slice()) { pk.stack.remove(ch); ch.geometry.dispose(); } pk.h = 0; }
        pk.box.position.set(0, 0.6, 0); pk.flaps[0].rotation.z = -1.9; pk.flaps[1].rotation.z = 1.9; pk.n = 0; pk.phase = 'fill';
      }
    }
  },
  stepBench(dt) {
    const b = this.bench; if (!b || !b.item) return;
    b.t += dt; const T = b.t % 5, m = b.item, sz = m.userData.size, sc = m.scale.x, hy = (b.kind === 'eraser' || b.kind === 'lead' ? sz.y : sz.y) * sc / 2;
    if (T < 1.8) {   // 落下テスト：落として、はねる
      const f = T / 1.8, fall = f < 0.45 ? 1 - Math.pow(f / 0.45, 2) : Math.abs(Math.sin((f - 0.45) / 0.55 * Math.PI * 2)) * 0.25 * (1 - f);
      m.position.set(0, 0.9 + hy + fall * 0.6, -0.4); m.rotation.set(0, Math.PI / 2, f < 0.45 ? 0 : (f - 0.45) * 0.6);
      if (T < dt * 1.5) { const q = b.paper.q; q.fillStyle = '#fbfbf6'; q.fillRect(0, 0, 256, 128); b.paper.tex.needsUpdate = true; b.lx = null; }
    } else {   // 書き味テスト：紙の上をジグザグに動いて線を引く
      const f = (T - 1.8) / 3.2, px = -0.13 + f * 0.26, pz = 0.3 + Math.sin(f * Math.PI * 8) * 0.1;
      m.position.set(px, 0.9 + hy + 0.03, pz); m.rotation.set(0, Math.PI / 2, -0.9);
      const q = b.paper.q, cx = 20 + f * 216, cy = 64 + Math.sin(f * Math.PI * 8) * 40;
      if (b.lx != null) { q.strokeStyle = b.kind === 'eraser' ? '#d8d2c4' : b.kind === 'ball' ? '#1f3fa8' : b.kind === 'fountain' ? '#24438f' : '#3a3a3c'; q.lineWidth = 3; q.beginPath(); q.moveTo(b.lx, b.ly); q.lineTo(cx, cy); q.stroke(); b.paper.tex.needsUpdate = true; }
      b.lx = cx; b.ly = cy;
    }
  },
  // ---------- 部品 ----------
  chair(R, x, z, lv) {
    const g = new THREE.Group(), dark = new THREE.MeshStandardMaterial({ color: lv >= 1 ? 0x24262b : 0x5d6a7a, roughness: 0.7 }), metal = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.8, roughness: 0.3 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.46), dark); seat.position.y = 0.42; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, lv >= 2 ? 0.75 : 0.5, 0.05), dark); back.position.set(0, lv >= 2 ? 0.87 : 0.75, 0.24); g.add(back);
    if (lv >= 3) { const hr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.05), dark); hr.position.set(0, 1.33, 0.26); g.add(hr); }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.36, 10), metal); pole.position.y = 0.22; g.add(pole);
    for (let k = 0; k < 5; k++) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.3), metal); const a = k / 5 * TAU; leg.position.set(Math.sin(a) * 0.14, 0.04, Math.cos(a) * 0.14); leg.rotation.y = a; g.add(leg); }
    g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    g.position.set(x, 0, z); R.add(g);
  },
  plant(par, x, z, h) {
    const g = new THREE.Group(), pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.36, 16), new THREE.MeshStandardMaterial({ color: 0xc9b79c, roughness: 0.8 })); pot.position.y = 0.18; g.add(pot);
    const leafM = new THREE.MeshStandardMaterial({ color: 0x4f8a45, roughness: 0.7 });
    for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), leafM); const a = k * 2.4; l.position.set(Math.sin(a) * 0.14, 0.36 + h * (0.4 + (k / 7) * 0.6), Math.cos(a) * 0.14); l.scale.set(1, 1.5, 0.6); l.rotation.y = a; g.add(l); }
    g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    g.position.set(x, 0, z); if (par) par.add(g); return g;
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
  skyTex(tier, season) {
    const c = newCanvas(256, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    const snow = season === 'xmas' || season === 'newyear';
    gr.addColorStop(0, snow ? '#b9cad8' : season === 'halloween' ? '#e8b48a' : '#8fc3ec'); gr.addColorStop(0.75, snow ? '#e4eaf0' : '#d8ecf7'); gr.addColorStop(1, '#eef5ec'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(40 + k * 60, 50 + (k % 2) * 30, 34, 12, 0, 0, TAU); g.fill(); }
    if (tier === 0) { g.fillStyle = snow ? '#f2f4f6' : '#7fa86b'; g.beginPath(); for (let x = 0; x <= 256; x += 16) g.lineTo(x, 200 + Math.sin(x * 0.07) * 14); g.lineTo(256, 256); g.lineTo(0, 256); g.fill(); g.fillStyle = '#c9b49a'; g.fillRect(30, 170, 60, 60); g.fillStyle = snow ? '#f6f6f6' : '#9b5b43'; g.beginPath(); g.moveTo(24, 172); g.lineTo(60, 140); g.lineTo(96, 172); g.fill(); }
    else { for (let k = 0; k < 9; k++) { const h = 40 + ((k * 53) % 90) * (tier >= 2 ? 1.6 : 0.8); g.fillStyle = ['#8d9bab', '#a4b0bd', '#7c8a9b'][k % 3]; g.fillRect(k * 30 - 4, 256 - h, 26, h); g.fillStyle = 'rgba(255,255,230,.5)'; for (let y = 256 - h + 6; y < 250; y += 10) g.fillRect(k * 30, y, 18, 3); } }
    if (season === 'sakura') { g.fillStyle = '#6b4a35'; g.fillRect(186, 150, 10, 106); for (let k = 0; k < 40; k++) { g.fillStyle = k % 3 ? '#f6c3d3' : '#f9dce6'; g.beginPath(); g.arc(150 + Math.sin(k * 1.7) * 60, 130 + Math.cos(k * 2.3) * 35, 10 + (k % 4) * 3, 0, TAU); g.fill(); } }
    if (season === 'summer') { for (let k = 0; k < 4; k++) { const x = 30 + k * 60; g.fillStyle = '#4f8a45'; g.fillRect(x - 2, 200, 4, 56); g.fillStyle = '#f6c945'; g.beginPath(); g.arc(x, 196, 14, 0, TAU); g.fill(); g.fillStyle = '#6b4a20'; g.beginPath(); g.arc(x, 196, 6, 0, TAU); g.fill(); } }
    if (snow) { g.fillStyle = 'rgba(255,255,255,.9)'; for (let k = 0; k < 60; k++) { g.beginPath(); g.arc((k * 73) % 256, (k * 131) % 200, 2 + (k % 3), 0, TAU); g.fill(); } }
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
  beltTexMake() {
    const c = newCanvas(64, 64), g = c.getContext('2d'); g.fillStyle = '#2f3237'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#3c4046'; for (let x = 0; x < 64; x += 16) g.fillRect(x, 0, 5, 64);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  },
};
// 頭の上のアイコン（キャンバスに描く。絵文字は使わない）
const _icons = {};
function iconTex(kind) {
  if (_icons[kind]) return _icons[kind];
  const S = 128, c = newCanvas(S, S), g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 4; g.beginPath(); g.arc(64, 58, 50, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(52, 104); g.lineTo(64, 122); g.lineTo(76, 104); g.fill();
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'bulb') { g.fillStyle = '#f6c945'; g.beginPath(); g.arc(64, 50, 22, Math.PI * 0.8, Math.PI * 2.2); g.lineTo(74, 74); g.lineTo(54, 74); g.closePath(); g.fill(); g.fillStyle = '#8a8f96'; g.fillRect(54, 76, 20, 10); g.strokeStyle = '#f0a03a'; g.lineWidth = 4; for (const a of [-2.4, -1.57, -0.7]) { g.beginPath(); g.moveTo(64 + Math.cos(a) * 30, 50 + Math.sin(a) * 30); g.lineTo(64 + Math.cos(a) * 40, 50 + Math.sin(a) * 40); g.stroke(); } }
  else if (kind === 'star' || kind === 'up') { g.fillStyle = kind === 'up' ? '#2e9a63' : '#f6c945'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k & 1 ? 13 : 30; g.lineTo(64 + Math.cos(a) * r, 58 + Math.sin(a) * r); } g.closePath(); g.fill(); if (kind === 'up') { g.fillStyle = '#fff'; g.font = '900 22px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('UP', 64, 60); } }
  else if (kind === 'heart') { g.fillStyle = '#e8566b'; g.beginPath(); g.moveTo(64, 84); g.bezierCurveTo(24, 58, 36, 22, 64, 40); g.bezierCurveTo(92, 22, 104, 58, 64, 84); g.fill(); }
  else if (kind === 'coffee') { g.fillStyle = '#8a5a36'; g.fillRect(42, 46, 36, 34); g.strokeStyle = '#8a5a36'; g.lineWidth = 6; g.beginPath(); g.arc(80, 62, 9, -1.4, 1.4); g.stroke(); g.strokeStyle = '#bbb'; g.lineWidth = 3; for (const x of [52, 66]) { g.beginPath(); g.moveTo(x, 40); g.bezierCurveTo(x - 6, 32, x + 6, 26, x, 18); g.stroke(); } }
  else if (kind === 'chat') { g.fillStyle = '#2b6fd6'; g.beginPath(); g.ellipse(64, 56, 32, 22, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(48, 72); g.lineTo(42, 88); g.lineTo(60, 76); g.fill(); g.fillStyle = '#fff'; for (const x of [50, 64, 78]) { g.beginPath(); g.arc(x, 56, 4.5, 0, TAU); g.fill(); } }
  else if (kind === 'wrench') { g.strokeStyle = '#6d7a88'; g.lineWidth = 11; g.beginPath(); g.moveTo(44, 80); g.lineTo(76, 46); g.stroke(); g.fillStyle = '#6d7a88'; g.beginPath(); g.arc(80, 42, 14, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(80, 28, 10, 12); }
  else if (kind === 'note') { g.fillStyle = '#7b4bc4'; g.beginPath(); g.ellipse(52, 76, 10, 8, -0.4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(80, 70, 10, 8, -0.4, 0, TAU); g.fill(); g.fillRect(58, 30, 5, 46); g.fillRect(86, 26, 5, 44); g.fillRect(58, 26, 33, 9); }
  else if (kind === 'yen') { g.fillStyle = '#2e9a63'; g.font = '900 52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('¥', 64, 60); }
  else if (kind === 'think') { g.fillStyle = '#9aa6b8'; for (const [x, y, r] of [[48, 66, 8], [64, 52, 11], [82, 40, 14]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (_icons[kind] = t);
}
