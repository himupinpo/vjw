// =========================================================================================
//  発売のイベント：広告によって場面が変わる。
//   なし・チラシ … お店の売り場に並び、お客さんが集まってくる
//   雑誌・テレビ・発表会 … ステージで布をとって発表（スポットライト・記者のフラッシュ・紙ふぶき・観客）
//  タップでとばせる。終わるとレビューの発表へ
// =========================================================================================
const EVENT = {
  scene: null, cam: new THREE.PerspectiveCamera(40, 1, 0.1, 300), active: false, t: 0, dur: 6,
  start(p, adId, done) {
    this.p = p; this.ad = adId || 'none'; this.done = done; this.t = 0; this.active = true;
    this.big = ['mag', 'tv', 'event'].includes(this.ad); this.dur = this.big ? (this.ad === 'event' ? 7.6 : 7.0) : 5.6; this.reveal = this.big ? 2.3 : 0;
    this.people = []; this.flashes = []; this.sfx = {}; this.icons = []; this.heroT = 0; this.drum = false; this.revealed = false;
    this.build();
    const ov = $('evOv'), names = { none: '店頭に並びました', flyer: 'チラシを見たお客さんが来ました', mag: '雑誌の取材つき発表会', tv: 'テレビ中継つき発表会', event: '新作発表会' };
    $('evSub').textContent = names[this.ad]; $('evName').textContent = `「${p.name}」`; $('evPrice').textContent = yen(p.price);
    ov.classList.add('on'); ov.classList.remove('show'); ov.classList.toggle('pre', this.big); ov.classList.toggle('big', this.big); document.body.classList.add('event');
    this.t0real = performance.now(); AU.resume();
    if (!this.big) AU.chime();
  },
  finish() {
    if (!this.active) return; this.active = false;
    $('evOv').classList.remove('on', 'show', 'pre'); document.body.classList.remove('event');
    if (this.scene) { disposeTree(this.scene); this.scene = null; }
    const f = this.done; this.done = null; if (f) f();
  },
  skip() { if (this.active && performance.now() - this.t0real > 400) this.finish(); },   // すぐの二度押しでとばさない
  // ---------- 場面づくり ----------
  hero(len) {   // 主役の製品（大きな見本）
    const o = buildProduct(this.p, { cheap: SET.quality === 'low' }), sz = o.userData.size, flat = this.p.kind === 'eraser' || this.p.kind === 'lead';
    o.traverse(c => { if (c.isMesh) c.castShadow = true; });
    const s = (flat ? len * 0.55 : len) / Math.max(sz.x, sz.y, sz.z), piv = new THREE.Group(), tilt = new THREE.Group(); piv.add(tilt); tilt.add(o);
    o.scale.setScalar(s); if (!flat) tilt.rotation.z = 0.32; else tilt.rotation.x = 0.25;
    piv.userData.h = flat ? sz.y * s / 2 + 0.05 : Math.sin(0.32) * sz.x * s / 2 + Math.max(sz.y, sz.z) * s / 2;
    return piv;
  },
  build() {
    if (this.scene) disposeTree(this.scene);
    const sc = this.scene = new THREE.Scene(); sc.environment = ENV;
    const box = (w, h, d, mat, x, y, z, par = sc) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; par.add(m); return m; };
    this.box = box;
    if (this.big) this.buildStage(sc, box); else this.buildShop(sc, box);
  },
  canvasTex(w, h, draw) { const c = newCanvas(w, h), q = c.getContext('2d'); draw(q, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAXANI; return t; },
  buildShop(sc, box) {
    const p = this.p, flyer = this.ad === 'flyer', std = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    sc.background = new THREE.Color(0xf3ead9); sc.environmentIntensity = 0.5;
    sc.add(new THREE.HemisphereLight(0xfff6e8, 0xb9ab90, 0.9));
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.2); sun.position.set(-3, 8, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); sun.shadow.bias = -0.0005; sc.add(sun);
    const spot = new THREE.SpotLight(0xfff2d6, 40, 12, 0.45, 0.6, 1.2); spot.position.set(0.5, 4.5, 2.5); spot.target.position.set(0, 1, 0); sc.add(spot, spot.target);
    const ft = OFFICE.floorTex(1); ft.repeat.set(5, 4); const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
    box(10, 3.4, 0.1, std(0xf6efe2, 0.9), 0, 1.7, -3); box(0.1, 3.4, 8, std(0xefe6d6, 0.9), -5, 1.7, 1);
    // 奥の棚：色とりどりの文房具の箱
    const shM = std(0xffffff, 0.5), boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.6 }), 320); boxes.castShadow = true; let n = 0;
    const tmp = new THREE.Object3D(), col = new THREE.Color(), cols = ['#d9493e', '#2b6fd6', '#2e9a63', '#f0a03a', '#f6c945', '#7b4bc4', '#e86fa8', '#f4f1ea', '#1d1d1f', '#2a9db0'];
    for (const sx of [-3.2, 0, 3.2]) {
      box(2.8, 2.4, 0.06, std(0xdccfb8, 0.7), sx, 1.2, -2.9); for (let k = 0; k < 5; k++) box(2.8, 0.04, 0.5, shM, sx, 0.15 + k * 0.52, -2.68, sc);
      for (let k = 0; k < 4; k++) { let x = sx - 1.32; while (x < sx + 1.25 && n < 320) { const w = rr(0.08, 0.22), h = rr(0.14, 0.4); tmp.position.set(x + w / 2, 0.17 + k * 0.52 + h / 2, -2.7); tmp.scale.set(w, h, rr(0.2, 0.4)); tmp.rotation.set(0, 0, 0); tmp.updateMatrix(); boxes.setMatrixAt(n, tmp.matrix); boxes.setColorAt(n, col.set(pick(cols))); n++; x += w + 0.02; } }
    }
    boxes.count = n; sc.add(boxes);
    // 売り場の台・製品・ポップ
    const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.9, 32), std(0xffffff, 0.35)); tbl.position.set(0, 0.45, 0); tbl.castShadow = tbl.receiveShadow = true; sc.add(tbl);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.05, 32), std(0x2b6fd6, 0.4)); top.position.set(0, 0.92, 0); sc.add(top);
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.2, 24), std(0xf6c945, 0.4)); riser.position.set(0, 1.04, 0); riser.castShadow = true; sc.add(riser);
    const hero = this.hero(1.05); hero.position.set(0, 1.14 + hero.userData.h, 0); sc.add(hero); this.heroObj = hero;
    for (let k = 0; k < 6; k++) { const mini = this.hero(0.32); const a = k / 6 * TAU + 0.3; mini.position.set(Math.cos(a) * 0.6, 0.95 + mini.userData.h, Math.sin(a) * 0.6); mini.rotation.y = -a; sc.add(mini); }
    const pop = this.canvasTex(512, 384, (q, w, h) => {
      q.fillStyle = '#d9493e'; q.fillRect(0, 0, w, h); q.fillStyle = '#fff'; q.fillRect(14, 14, w - 28, h - 28);
      q.fillStyle = '#d9493e'; q.font = '900 74px "Zen Maru Gothic", sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('新発売！', w / 2, 84, w - 60);
      q.fillStyle = '#2b2a28'; q.font = '900 46px "Zen Maru Gothic", sans-serif'; q.fillText(p.name, w / 2, 190, w - 60);
      q.fillStyle = '#2b6fd6'; q.font = '900 64px "Zen Maru Gothic", sans-serif'; q.fillText(yen(p.price), w / 2, 292, w - 60);
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshStandardMaterial({ map: pop, roughness: 0.7 })); sign.position.set(0.95, 1.55, 0.25); sign.rotation.y = -0.35; sc.add(sign);
    box(0.03, 1.0, 0.03, std(0x777f88, 0.3, 0.8), 0.95, 0.75, 0.22);
    // レジ
    box(1.8, 1.0, 0.7, std(0x9b7650, 0.55), 3.4, 0.5, 0.2); box(0.4, 0.3, 0.35, std(0x34373d, 0.4), 3.2, 1.15, 0.2);
    // チラシ：壁に貼る
    if (flyer) {
      const fl = this.canvasTex(256, 360, (q, w, h) => { q.fillStyle = '#fffaf0'; q.fillRect(0, 0, w, h); q.fillStyle = '#2b6fd6'; q.fillRect(0, 0, w, 70); q.fillStyle = '#fff'; q.font = '900 34px "Zen Maru Gothic", sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('新発売', w / 2, 36); q.fillStyle = '#2b2a28'; q.font = '900 26px "Zen Maru Gothic", sans-serif'; q.fillText(p.name, w / 2, 290, w - 20); q.fillStyle = '#d9493e'; q.fillText(yen(p.price), w / 2, 330, w - 20); });
      const img = new Image(); img.onload = () => { const q = fl.image.getContext('2d'); q.drawImage(img, 28, 84, 200, 180); fl.needsUpdate = true; }; img.src = productThumb(p);
      for (const [x, z, ry] of [[-4.94, -1.2, Math.PI / 2], [-4.94, 0.4, Math.PI / 2], [-1.6, -2.94, 0], [1.6, -2.94, 0]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshStandardMaterial({ map: fl, roughness: 0.8 })); m.position.set(x, 2.75, z); m.rotation.y = ry; if (ry === 0) m.position.y = 2.95; sc.add(m); }
    }
    // お客さん：入口から売り場へ
    const nC = flyer ? 7 : 4, shirts = ['#d9493e', '#2b6fd6', '#2e9a63', '#f0a03a', '#7b4bc4', '#e86fa8', '#5b5e66'];
    for (let i = 0; i < nC; i++) {
      const r = OFFICE.makePerson(shirts[i % 7], pick(['#2b2118', '#5a3a22', '#1c1a18', '#9a6b3d']), pick([0x3b4250, 0x5a4a3a, 0x2a3a5a])), a = Math.PI + 0.2 + (i / Math.max(1, nC - 1)) * (Math.PI - 0.4);
      const goal = { x: Math.cos(a) * (1.3 + (i % 2) * 0.25), z: Math.sin(a) * (1.1 + (i % 2) * 0.25) }; r.root.position.set(5.2 + i * 0.45, 0, -1.9); sc.add(r.root);
      this.people.push({ r, path: [{ x: goal.x, z: -1.9 }, goal], goal, delay: i * 0.28, state: 'walk', like: 2.3 + i * 0.22 + rr(0, 0.3), ph: rr(0, 6) });
    }
    this.camA = { p: new THREE.Vector3(-1.2, 3.2, 7.4), l: new THREE.Vector3(0.3, 1.0, -0.6) }; this.camB = { p: new THREE.Vector3(0.5, 1.75, 2.7), l: new THREE.Vector3(0.1, 1.3, -0.2) };
  },
  buildStage(sc, box) {
    const p = this.p, ad = this.ad, std = (c, r = 0.6, m = 0, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, o));
    sc.background = new THREE.Color(0x07080b); sc.fog = new THREE.Fog(0x07080b, 14, 34); sc.environmentIntensity = 0.12;
    sc.add(new THREE.HemisphereLight(0x8090b0, 0x101014, 0.35));
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), std(0x1a1c22, 0.55, 0.2)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
    // ステージ
    box(10, 0.6, 4.2, std(0x22252c, 0.5, 0.2), 0, 0.3, -2.1); box(10.04, 0.62, 0.05, std(0x7a1e24, 0.8), 0, 0.31, 0.0);
    const bigEv = ad === 'event', bdTex = this.canvasTex(1024, 512, (q, w, h) => {
      const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, bigEv ? '#1b2a6b' : '#202a3a'); gr.addColorStop(1, bigEv ? '#5a1f6b' : '#1a1e26'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      q.strokeStyle = 'rgba(255,255,255,.08)'; q.lineWidth = 2; for (let k = 0; k < 24; k++) { q.beginPath(); q.moveTo(k * 48, 0); q.lineTo(k * 48 - 200, h); q.stroke(); }
      q.fillStyle = 'rgba(255,255,255,.75)'; q.font = '700 40px "Zen Maru Gothic", sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(S ? S.company : '', w / 2, 70, w - 80);
      q.fillStyle = '#f6c945'; q.font = '900 64px "Zen Maru Gothic", sans-serif'; q.fillText('NEW RELEASE', w / 2, 150);
      q.fillStyle = '#fff'; q.font = '900 96px "Zen Maru Gothic", sans-serif'; q.fillText(p.name, w / 2, 290, w - 80);
      q.fillStyle = 'rgba(255,255,255,.7)'; q.font = '700 38px "Zen Maru Gothic", sans-serif'; q.fillText(KINDS[p.kind].name + '　' + yen(p.price), w / 2, 400, w - 80);
    });
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshStandardMaterial({ map: bdTex, emissive: 0xffffff, emissiveMap: bdTex, emissiveIntensity: 0.0, roughness: 0.8 })); bd.position.set(0, 3.1, -4.15); sc.add(bd); this.backdrop = bd;
    if (bigEv) { box(10.6, 0.25, 0.3, std(0x333740, 0.4, 0.7), 0, 5.7, -4.1); for (const sx of [-5.15, 5.15]) box(0.3, 5.4, 0.3, std(0x333740, 0.4, 0.7), sx, 3.0, -4.1); }
    // 台と布
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.95, 40), std(0xf4f1ea, 0.3, 0.1)); ped.position.set(0, 0.6 + 0.475, -1.8); ped.castShadow = ped.receiveShadow = true; sc.add(ped);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.025, 8, 48), std(0xd4a83a, 0.3, 0.9)); ring.rotation.x = Math.PI / 2; ring.position.set(0, 1.55, -1.8); sc.add(ring);
    const hero = this.hero(1.45); hero.position.set(0, 1.55 + hero.userData.h, -1.8); sc.add(hero); this.heroObj = hero;
    const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.78, 1.7, 32, 6, true), std(0x9a1b26, 0.85, 0, { side: THREE.DoubleSide, transparent: true }));
    { const pos = cloth.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), x = pos.getX(i), z = pos.getZ(i), a = Math.atan2(z, x), k = 1 + Math.sin(a * 9) * 0.05 * (0.5 - y / 1.7); pos.setX(i, x * k); pos.setZ(i, z * k); } cloth.geometry.computeVertexNormals(); }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, TAU, 0, Math.PI / 2), cloth.material); cap.position.y = 0.85; cloth.add(cap);
    cloth.position.set(0, 1.55 + 0.85, -1.8); cloth.castShadow = true; sc.add(cloth); this.cloth = cloth;
    // 社長（発表する人）
    const ceo = OFFICE.makePerson('#2c3a5c', '#2a211b', 0x232838); ceo.root.position.set(-2.3, 0.6, -1.4); ceo.root.rotation.y = Math.PI + 0.5; sc.add(ceo.root);
    this.people.push({ r: ceo, ceo: true, ph: 0 });
    const mic = box(0.04, 1.1, 0.04, std(0x777f88, 0.3, 0.8), -2.0, 1.15, -1.1); void mic;
    // スポットライト（光の筋も見せる）
    this.spots = [];
    const cols = [0xffffff, 0xfff0d0, 0xd8e6ff];
    for (let k = 0; k < 3; k++) {
      const sp = new THREE.SpotLight(cols[k], 110, 30, 0.22, 0.45, 1.2); sp.position.set(-4 + k * 4, 7.5, 4.5); sc.add(sp, sp.target);
      const cg = new THREE.ConeGeometry(1.2, 1, 24, 1, true); cg.rotateX(-Math.PI / 2); cg.translate(0, 0, 0.5);
      const beam = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: cols[k], transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); sc.add(beam);
      this.spots.push({ sp, beam, ph: k * 2.1 });
    }
    const key = new THREE.SpotLight(0xfff2dc, 0, 16, 0.32, 0.5, 1.0); key.position.set(0, 6.5, 1.5); key.target.position.set(0, 1.6, -1.8); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); sc.add(key, key.target); this.key = key;
    const house = new THREE.DirectionalLight(0xffe6c8, 0); house.position.set(0, 6, -3.5); house.target.position.set(0, 0, 4); sc.add(house, house.target); this.house = house;   // 発表のあと、客席も明るく
    // 観客
    const nA = { mag: 16, tv: 28, event: 46 }[ad], shirts = ['#d9493e', '#2b6fd6', '#2e9a63', '#f0a03a', '#7b4bc4', '#e86fa8', '#5b5e66', '#f4f4f0', '#3d7fd0'];
    for (let i = 0; i < nA; i++) {
      const row = Math.floor(i / 8), col = i % 8, x = -3.9 + col * 1.1 + (row % 2) * 0.5 + rr(-0.15, 0.15), z = 1.7 + row * 1.15 + rr(-0.1, 0.1);
      const r = OFFICE.makePerson(pick(shirts), pick(['#2b2118', '#5a3a22', '#1c1a18', '#9a6b3d', '#3a2a20']), pick([0x3b4250, 0x5a4a3a, 0x2a3a5a, 0x222222])); r.root.position.set(x, 0, z); r.root.rotation.y = Math.atan2(x * 0.12, 1) * 0.6; sc.add(r.root);
      const press = row === 0 && ad !== 'event';
      if (press) { const cam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.1), std(0x1d1d1f, 0.4)); cam.position.set(0, -0.26, -0.06); r.arms[1].el.add(cam); }
      this.people.push({ r, ph: rr(0, 6), jump: rr(0.7, 1.3), press, delay: rr(0, 0.35) });
    }
    if (ad === 'tv') for (const sx of [-4.6, 4.6]) {   // テレビカメラ
      const g = new THREE.Group(); g.position.set(sx, 0, 1.2); g.rotation.y = sx < 0 ? -0.55 : 0.55; sc.add(g);
      for (let k = 0; k < 3; k++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6), std(0x2a2c30, 0.5)); const a = k / 3 * TAU; leg.position.set(Math.sin(a) * 0.25, 0.7, Math.cos(a) * 0.25); leg.rotation.set(Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3); g.add(leg); }
      box(0.36, 0.34, 0.7, std(0x2a2c30, 0.4, 0.3), 0, 1.6, 0, g); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.3, 16), std(0x111111, 0.2, 0.5)); lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.6, -0.48); g.add(lens);
      box(0.06, 0.06, 0.02, new THREE.MeshBasicMaterial({ color: 0xff2a2a }), 0.12, 1.82, -0.35, g);
    }
    if (ad === 'tv') { const oa = this.canvasTex(256, 96, (q, w, h) => { q.fillStyle = '#c8261e'; q.beginPath(); q.roundRect(4, 4, w - 8, h - 8, 18); q.fill(); q.fillStyle = '#fff'; q.font = '900 52px sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('ON AIR', w / 2, h / 2 + 2); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.52), new THREE.MeshBasicMaterial({ map: oa })); m.position.set(3.6, 5.2, -4.1); sc.add(m); }
    // カメラのフラッシュ
    const fc = newCanvas(64, 64), fq = fc.getContext('2d'), gr = fq.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); fq.fillStyle = gr; fq.fillRect(0, 0, 64, 64);
    const ft = new THREE.CanvasTexture(fc); this.flashTex = ft;
    for (let k = 0; k < 10; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })); s.scale.setScalar(0.9); sc.add(s); this.flashes.push({ s, t: 0 }); }
    // 紙ふぶき（テレビ・発表会）
    const nCf = { mag: 0, tv: 160, event: 420 }[ad];
    if (nCf) {
      const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.07, 0.11), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3, emissive: 0x222222 }), nCf), col = new THREE.Color();
      const pal = ['#f6c945', '#d9493e', '#2b8fd6', '#2e9a63', '#e86fa8', '#ffffff', '#f0a03a', '#d4a83a'];
      this.conf = { im, n: nCf, p: [] };
      for (let i = 0; i < nCf; i++) { im.setColorAt(i, col.set(pick(pal))); this.conf.p.push({ x: rr(-5.5, 5.5), y: rr(2.8, 8.5), z: rr(-3.5, 5), vy: rr(0.9, 1.5), ph: rr(0, 6), sp: rr(2, 6), ax: rr(0, TAU) }); }
      im.frustumCulled = false; im.visible = false; sc.add(im);
    }
    // 吹き上げる火花（発表会）
    if (bigEv) {
      const N = 360, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffd98a, size: 0.09, map: ft, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pts.frustumCulled = false; sc.add(pts);
      this.sparks = { pts, pos, N, p: Array.from({ length: N }, (_, i) => ({ src: i % 4, life: -1 })) };
    }
    this.camA = { p: new THREE.Vector3(0, 4.6, 11.5), l: new THREE.Vector3(0, 1.8, -2) };
    this.camA2 = { p: new THREE.Vector3(0, 3.4, 8.0), l: new THREE.Vector3(0, 1.8, -2) };
    this.camR = { p: new THREE.Vector3(0.7, 2.25, 0.7), l: new THREE.Vector3(0, 2.0, -1.8) };
    this.camR2 = { p: new THREE.Vector3(-0.5, 2.1, 0.45), l: new THREE.Vector3(0, 2.0, -1.8) };
    this.camC = { p: new THREE.Vector3(2.6, 2.3, -1.0), l: new THREE.Vector3(-0.4, 1.3, 4.5) };
    this.camC2 = { p: new THREE.Vector3(1.6, 2.6, -0.6), l: new THREE.Vector3(-0.6, 1.2, 4.5) };
    this.camD = { p: new THREE.Vector3(5.5, 5.2, 10.5), l: new THREE.Vector3(0, 1.4, -1.0) };
    this.camD2 = { p: new THREE.Vector3(3.5, 4.4, 9.5), l: new THREE.Vector3(0, 1.6, -1.4) };
  },
  // ---------- 毎フレーム ----------
  update(dt) {
    if (!this.active || !this.scene) return;
    const t0 = this.t; this.t += dt; const t = this.t;
    if (this.heroObj) { this.heroT = (this.heroT || 0) + (this.big && t < this.reveal ? 0 : dt); this.heroObj.rotation.y = Math.sin(this.heroT * 0.9) * 0.5; }   // カメラに向けたまま、ゆっくり左右に
    if (this.big) this.stepStage(dt, t, t0); else this.stepShop(dt, t);
    for (const ic of this.icons) { ic.t -= dt; const k = clamp(Math.min((1.6 - ic.t) * 6, ic.t * 3), 0, 1); ic.s.scale.setScalar(0.45 * k); ic.s.position.y = ic.y + (1.6 - ic.t) * 0.25; }
    this.icons = this.icons.filter(ic => { if (ic.t > 0) return true; this.scene.remove(ic.s); ic.s.material.dispose(); return false; });
    if (t >= this.dur) this.finish();
  },
  pop(r, kind) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex(kind), depthTest: false, transparent: true })); s.renderOrder = 10; const p = r.root.position; s.position.set(p.x, p.y + 2.0, p.z); this.scene.add(s); this.icons.push({ s, t: 1.6, y: p.y + 2.0 }); },
  setCam(a, b, k) { const e = k * k * (3 - 2 * k); this.cam.position.lerpVectors(a.p, b.p, e); const l = new THREE.Vector3().lerpVectors(a.l, b.l, e); this.cam.lookAt(l); },
  stepShop(dt, t) {
    this.setCam(this.camA, this.camB, clamp(t / (this.dur - 0.6), 0, 1));
    for (const c of this.people) {
      const p = c.r.root.position; c.ph += dt;
      if (t < c.delay) { OFFICE.pose(c.r, 'stand', c.ph); continue; }
      if (c.state === 'walk') {
        const g = c.path[0], dx = g.x - p.x, dz = g.z - p.z, d = Math.hypot(dx, dz), st = 1.9 * dt;
        if (d <= st) { p.x = g.x; p.z = g.z; c.path.shift(); if (!c.path.length) c.state = 'look'; } else { p.x += dx / d * st; p.z += dz / d * st; c.r.root.rotation.y += angDiff2(c.r.root.rotation.y, Math.atan2(-dx, -dz)) * Math.min(1, dt * 12); }
        OFFICE.pose(c.r, 'walk', c.ph);
      } else {
        c.r.root.rotation.y += angDiff2(c.r.root.rotation.y, Math.atan2(p.x, p.z)) * Math.min(1, dt * 8);
        if (t >= c.like && !c.liked) { c.liked = true; c.cheerT = 0.9; this.pop(c.r, 'heart'); if (AU.ok()) AU.tone(1200 + rr(0, 400), AU.ac.currentTime, 0.12, 'sine', 0.06); }
        if (c.cheerT > 0) { c.cheerT -= dt; OFFICE.pose(c.r, 'cheer', c.ph); } else OFFICE.pose(c.r, c.liked ? 'talk' : 'stand', c.ph);
      }
    }
    if (t > 0.6) { $('evOv').classList.add('show'); }
  },
  stepStage(dt, t, t0) {
    const R = this.reveal;
    // カメラ：うしろから → 布をとる瞬間に近づく → 引いて会場全体
    const c1 = R + 2.0, c2 = c1 + 1.9;   // 布をとる → 製品のアップ → 観客（ステージから） → 会場全体
    if (t < R) this.setCam(this.camA, this.camA2, t / R);
    else if (t < c1) this.setCam(this.camR, this.camR2, (t - R) / (c1 - R));
    else if (t < c2) this.setCam(this.camC, this.camC2, (t - c1) / (c2 - c1));
    else this.setCam(this.camD, this.camD2, clamp((t - c2) / Math.max(0.5, this.dur - c2), 0, 1));
    // スポットライト：さがすように動き、発表で台に集まる
    for (const s of this.spots) {
      const k = clamp((t - R + 0.3) / 0.5, 0, 1), sx = Math.sin(t * 1.7 + s.ph) * 3.5, sz = -1.6 + Math.cos(t * 1.3 + s.ph) * 0.8;
      s.sp.target.position.set(lerp(sx, 0, k), 0.6, lerp(sz, -1.8, k)); s.sp.target.updateMatrixWorld();
      const a = s.sp.position, b = s.sp.target.position, d = a.distanceTo(b); s.beam.position.copy(a); s.beam.lookAt(b); s.beam.scale.set(d * Math.tan(0.22) / 1.2, d * Math.tan(0.22) / 1.2, d);
    }
    this.key.intensity = t < R ? 0 : Math.min(70, (t - R) * 220); this.house.intensity = t < R ? 0 : Math.min(1.3, (t - R) * 1.5);
    this.backdrop.material.emissiveIntensity = t < R ? 0.08 : Math.min(0.55, 0.08 + (t - R) * 0.8);
    // 布：ふわっと上がって消える
    if (this.cloth) { const k = clamp((t - R + 0.15) / 0.8, 0, 1); this.cloth.position.y = 1.55 + 0.85 + k * k * 3.2; this.cloth.rotation.y = k * 1.2; this.cloth.material.opacity = 1 - clamp((k - 0.5) * 2, 0, 1); this.cloth.visible = k < 1; }
    // 人
    for (const c of this.people) {
      c.ph += dt;
      if (c.ceo) { if (t < R - 0.2) OFFICE.pose(c.r, 'talk', c.ph); else if (t < R + 1.6) OFFICE.pose(c.r, 'cheer', c.ph * 0.6); else OFFICE.pose(c.r, 'talk', c.ph); continue; }
      if (t < R + c.delay) OFFICE.pose(c.r, 'stand', c.ph * 0.6);
      else { OFFICE.pose(c.r, 'cheer', c.ph * c.jump); if (c.press) { c.r.arms[1].sh.rotation.x = 2.6; c.r.arms[1].el.rotation.x = 0.6; c.r.arms[0].sh.rotation.x = 2.5; } }
    }
    // フラッシュ（記者・観客）
    const rate = t < R ? 2 : this.ad === 'event' ? 14 : 10;
    for (const f of this.flashes) {
      f.t -= dt; f.s.material.opacity = Math.max(0, f.t / 0.12);
      if (f.t <= 0 && Math.random() < rate * dt / this.flashes.length * 3) { const c = pick(this.people.filter(q => !q.ceo)); if (c) { const p = c.r.root.position; f.s.position.set(p.x + rr(-0.1, 0.1), 1.6, p.z - 0.2); f.t = 0.12; if (AU.ok() && Math.random() < 0.5) this.shutter(); } }
    }
    // 紙ふぶき
    if (this.conf && t >= R) {
      const C = this.conf, m = new THREE.Object3D(); C.im.visible = true;
      for (let i = 0; i < C.n; i++) { const q = C.p[i]; q.y -= q.vy * dt; q.ph += dt * q.sp; if (q.y < 0.02) { q.y = 0.02; } m.position.set(q.x + Math.sin(q.ph * 0.5) * 0.3, q.y, q.z); m.rotation.set(q.ph, q.ax + q.ph * 0.3, q.ph * 0.7); m.updateMatrix(); C.im.setMatrixAt(i, m.matrix); }
      C.im.instanceMatrix.needsUpdate = true;
    }
    // 火花
    if (this.sparks) {
      const P = this.sparks, src = [[-4.2, -0.2], [-1.6, -0.2], [1.6, -0.2], [4.2, -0.2]], on = t >= R && t < R + 2.8;
      for (let i = 0; i < P.N; i++) { const q = P.p[i]; if (q.life <= 0) { if (on && Math.random() < dt * 3) { const s = src[q.src]; Object.assign(q, { x: s[0], y: 0.62, z: s[1], vx: rr(-0.4, 0.4), vy: rr(4.5, 6.5), vz: rr(-0.3, 0.3), life: rr(0.7, 1.1) }); } else { P.pos[i * 3 + 1] = -10; continue; } } q.life -= dt; q.vy -= 9.8 * dt * 0.6; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; P.pos.set([q.x, q.y, q.z], i * 3); }
      P.pts.geometry.attributes.position.needsUpdate = true;
    }
    // 音・字幕
    if (!this.drum && t >= 0.5) { this.drum = true; if (t < R - 0.3) this.drumroll(R - t); }
    if (!this.revealed && t >= R) { this.revealed = true; this.crash(); AU.fanfare(); this.crowd(2.6); $('evOv').classList.remove('pre'); $('evOv').classList.add('show'); }
  },
  // ---------- 効果音 ----------
  noise(dur) { const a = AU.ac, b = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = a.createBufferSource(); s.buffer = b; return s; },
  drumroll(dur) {
    if (!AU.ok()) return; const a = AU.ac, t = a.currentTime, n = Math.floor(dur / 0.045);
    for (let i = 0; i < n; i++) { const s = this.noise(0.05), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'bandpass'; f.frequency.value = 220; f.Q.value = 1.2; const v = 0.12 + 0.25 * i / n; g.gain.setValueAtTime(v, t + i * 0.045); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.05); s.connect(f); f.connect(g); g.connect(AU.out); s.start(t + i * 0.045); }
  },
  crash() { if (!AU.ok()) return; const a = AU.ac, t = a.currentTime, s = this.noise(1.6), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = 3500; g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.5); s.connect(f); f.connect(g); g.connect(AU.out); s.start(t); },
  crowd(dur) { if (!AU.ok()) return; const a = AU.ac, t = a.currentTime, s = this.noise(dur), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 0.6; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(this.ad === 'event' ? 0.32 : 0.22, t + 0.25); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f); f.connect(g); g.connect(AU.out); s.start(t); },
  shutter() { const a = AU.ac, t = a.currentTime, s = this.noise(0.04), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = 2500; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04); s.connect(f); f.connect(g); g.connect(AU.out); s.start(t); },
};
