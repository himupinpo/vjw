// =========================================================================================
//  家具：事務所の床のマス（0.5m）に置く。近くの机の人の仕事が速くなる（観葉植物・照明・ホワイトボード…）。
//  模様がえモード：下の一覧から選んで床をタップ。置いた家具をタップすると動かしたり、回したり、しまったりできる
//  向き rot：0＝正面（+z）向き、1＝右（+x）、2＝奥、3＝左。f = { type, x, z, rot }（x, z は奥・左の角からのマス）
// =========================================================================================
const FURNI = {
  CELL: 0.5, on: false, sel: null, ghost: null, ring: null, labels: [], ver: 0, cacheK: '', thumbs: {}, hint: '',
  dims(type, rot) { const F = FURN[type]; return (rot || 0) % 2 ? [F.d, F.w] : [F.w, F.d]; },
  rect(f, Lo) { const [w, d] = this.dims(f.type, f.rot), x0 = -Lo.W / 2 + f.x * this.CELL, z0 = -Lo.D / 2 + f.z * this.CELL; return [x0, z0, x0 + w * this.CELL, z0 + d * this.CELL]; },
  center(f, Lo) { const r = this.rect(f, Lo); return { x: (r[0] + r[2]) / 2, z: (r[1] + r[3]) / 2 }; },
  placeObj(o, f, Lo) { const c = this.center(f, Lo); o.position.set(c.x, 0, c.z); o.rotation.y = (f.rot || 0) * Math.PI / 2; },
  // 置けるか（部屋の中・机や通り道にかからない・ほかの家具と重ならない）
  fits(S, Lo, f, list = S.furn, ignore = null) {
    const r = this.rect(f, Lo), e = 0.001;
    if (r[0] < -Lo.W / 2 - e || r[1] < -Lo.D / 2 - e || r[2] > Lo.W / 2 + e || r[3] > Lo.D / 2 + e) return false;
    const hit = b => r[0] < b[2] - e && r[2] > b[0] + e && r[1] < b[3] - e && r[3] > b[1] + e;
    for (const b of Lo.blocked) if (hit(b)) return false;
    for (const g of list) if (g !== ignore && g !== f && hit(this.rect(g, Lo))) return false;
    return true;
  },
  // 近い所から空いている場所をさがす
  findSpot(S, Lo, type, rot, near, list = S.furn) {
    const [w, d] = this.dims(type, rot), nx = Math.round(Lo.W / this.CELL) - w, nz = Math.round(Lo.D / this.CELL) - d, c = [];
    for (let z = 0; z <= nz; z++) for (let x = 0; x <= nx; x++) { const f = { type, x, z, rot }, p = this.center(f, Lo); c.push([Math.hypot(p.x - near.x, p.z - near.z), f]); }
    c.sort((a, b) => a[0] - b[0]);
    for (const [, f] of c) if (this.fits(S, Lo, f, list)) return f;
    return null;
  },
  count(S, type) { return (S.furn || []).filter(f => f.type === type).length; },
  limit(S) { return FURN_MAX[S.tier]; },
  why(S, type) {   // 買えない理由
    const F = FURN[type];
    if (F.tier > S.tier) return OFFICES[F.tier].name + 'から';
    if (S.furn.length >= this.limit(S)) return '家具はこの事務所では ' + this.limit(S) + ' こまで';
    if (F.max && this.count(S, type) >= F.max) return F.name + 'は ' + F.max + ' 台まで';
    if (S.money < F.price) return 'お金が足りない';
    return '';
  },
  // 古いセーブ（設備の観葉植物・コーヒーマシン）を家具にする
  migrate(S) {
    if (!S.furn) S.furn = [];
    const e = S.equip, n = (e.plant || 0), cf = (e.coffee || 0);
    delete e.plant; delete e.coffee;
    if (!n && !cf) return;
    const Lo = OFFICE.layout(S);
    for (let i = 0; i < n * 2 && S.furn.length < FURN_MAX[S.tier]; i++) { const f = this.findSpot(S, Lo, 'plant', 0, { x: Lo.W / 2 - 0.5, z: -Lo.D / 2 + 0.5 + i }); if (f) S.furn.push(f); }
    if (cf) { const f = this.findSpot(S, Lo, 'coffee', 0, { x: 0, z: -Lo.D / 2 }); if (f) S.furn.push(f); }
  },
  // 引っ越しや設備で部屋が変わったら、重なった家具を近くに動かす（置けなければ代金をもどす）
  validate(S) {
    if (!S.furn || !S.furn.length) return;
    const Lo = OFFICE.layout(S), keep = [];
    for (const f of S.furn) {
      if (this.fits(S, Lo, f, keep)) { keep.push(f); continue; }
      const g = this.findSpot(S, Lo, f.type, f.rot || 0, this.center(f, Lo), keep) || this.findSpot(S, Lo, f.type, ((f.rot || 0) + 1) % 4, this.center(f, Lo), keep);
      if (g) { f.x = g.x; f.z = g.z; f.rot = g.rot; keep.push(f); }
      else if (typeof S.money === 'number') { S.money += FURN[f.type].price; if (typeof UI !== 'undefined' && UI.toast) UI.toast(`${FURN[f.type].name}を置く場所がなくなったので売った`, ''); }
    }
    if (keep.length !== S.furn.length) this.ver++;
    S.furn = keep;
  },
  // ---------- 効果：机ごと（近い家具）＋部屋全体（コーヒー・ソファ） ----------
  calc(S, list = S.furn || []) {
    const Lo = OFFICE.layout(S), per = {}, parts = {};
    for (let i = 0; i < S.staff.length; i++) {
      const m = S.staff[i], dk = Lo.desks[i]; if (!dk) { per[m.id] = 0; continue; }
      const tr = TRAITS[m.trait] || {}; let sum = 0; const ps = [];
      const cnt = {};
      for (const f of list) {
        const F = FURN[f.type]; cnt[f.type] = (cnt[f.type] || 0) + 1;
        if (F.max && cnt[f.type] > F.max) continue;
        let v = 0;
        if (F.global) v = F.global * (tr.likes === 'coffee' && F.brk === 'coffee' ? 2 : 1);
        else if (F.r) { const c = this.center(f, Lo); if (Math.hypot(c.x - dk.seat.x, c.z - dk.seat.z) <= F.r) v = (F.eff.work || 0) + (F.eff[m.role] || 0); if (tr.likes === 'plant' && (f.type === 'plant' || f.type === 'bigplant')) v *= 2; }
        if (v > 0) { sum += v; ps.push([F.name, v]); }
      }
      per[m.id] = 0.3 * (1 - Math.exp(-sum / 0.3));   // たくさん置いても +30% まで（だんだん効きにくくなる）
      parts[m.id] = ps;
    }
    let glob = 0; const cnt = {};
    for (const f of list) { const F = FURN[f.type]; cnt[f.type] = (cnt[f.type] || 0) + 1; if (F.global && !(F.max && cnt[f.type] > F.max)) glob += F.global; }
    return { per, parts, glob: Math.min(0.2, glob) };
  },
  get(S) {
    const k = S.day + '|' + S.tier + '|' + S.equip.line + '|' + S.equip.lab + '|' + S.staff.length + '|' + (S.staff[0] ? S.staff[0].id : 0) + '|' + (S.furn || []).length + '|' + this.ver;
    if (this.cacheK !== k || this.cacheS !== S) { this.cacheK = k; this.cacheS = S; this.cache = this.calc(S); }
    return this.cache;
  },
  bonus(S, m) { return this.get(S).per[m.id] || 0; },
  globalBonus(S) { return this.get(S).glob; },
  // ---------- 3Dの家具 ----------
  model(type) {
    const g = new THREE.Group(), std = (c, r = 0.6, m = 0, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, o));
    const B = (w, h, d, mat, x, y, z, par = g) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; par.add(m); return m; };
    const Cy = (rt, rb, h, mat, x, y, z, n = 16, par = g) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; par.add(m); return m; };
    const tex = (w, h, draw) => { const c = newCanvas(w, h), q = c.getContext('2d'); draw(q, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAXANI; return t; };
    const metal = std(0xb9bec6, 0.3, 0.8), dark = std(0x34373d, 0.5, 0.3), ph = Math.random() * 10;
    if (type === 'plant') {
      const p = OFFICE.plant(g, 0, 0, 0.55); g.userData.anim = t => { p.rotation.z = Math.sin(t * 1.3 + ph) * 0.025; };
    } else if (type === 'bigplant') {
      Cy(0.32, 0.24, 0.48, std(0xe8e2d6, 0.7), 0, 0.24, 0, 20); Cy(0.3, 0.3, 0.03, std(0x5a4430, 0.95), 0, 0.47, 0, 20);
      const top = new THREE.Group(); g.add(top); Cy(0.035, 0.05, 1.1, std(0x6b5236, 0.9), 0, 0.98, 0, 8, top);
      const leafM = std(0x3f7d3c, 0.65, 0, { side: THREE.DoubleSide });
      for (let k = 0; k < 11; k++) { const a = k * 2.35, h = 1.0 + (k % 4) * 0.22, l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6), leafM); l.scale.set(0.45, 0.12, 1.6); l.position.set(Math.sin(a) * 0.3, h, Math.cos(a) * 0.3); l.rotation.set(-0.5 * Math.cos(a), a, 0.5 * Math.sin(a)); l.castShadow = true; top.add(l); }
      g.userData.anim = t => { top.rotation.z = Math.sin(t * 0.9 + ph) * 0.02; top.rotation.x = Math.sin(t * 0.7 + ph) * 0.015; };
    } else if (type === 'lamp') {
      Cy(0.16, 0.18, 0.04, dark, 0, 0.02, 0, 20); Cy(0.015, 0.015, 1.45, metal, 0, 0.75, 0, 8);
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.24, 20, 1, true), std(0xf3ead8, 0.8, 0, { side: THREE.DoubleSide, emissive: 0xffe2a8, emissiveIntensity: 0.35 })); sh.position.y = 1.5; g.add(sh);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1c8 })); bulb.position.y = 1.45; g.add(bulb);
      const glow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.22, depthWrite: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.006; g.add(glow);
    } else if (type === 'whiteboard') {
      for (const sx of [-0.68, 0.68]) { B(0.04, 1.85, 0.04, metal, sx, 0.93, 0); B(0.05, 0.04, 0.42, metal, sx, 0.04, 0); }
      B(1.42, 0.96, 0.04, metal, 0, 1.38, 0);
      const t = tex(512, 340, (q, w, h) => {
        q.fillStyle = '#fbfcfd'; q.fillRect(0, 0, w, h); q.lineCap = 'round'; q.lineJoin = 'round';
        q.strokeStyle = '#2b6fd6'; q.lineWidth = 5; q.beginPath(); q.moveTo(40, 230); q.lineTo(250, 120); q.lineTo(268, 136); q.lineTo(58, 246); q.closePath(); q.stroke();
        q.beginPath(); q.moveTo(250, 120); q.lineTo(300, 104); q.lineTo(268, 136); q.stroke();
        q.strokeStyle = '#d9493e'; q.lineWidth = 4; q.beginPath(); q.arc(390, 110, 52, 0, TAU); q.stroke(); q.beginPath(); q.moveTo(300, 104); q.quadraticCurveTo(330, 60, 340, 100); q.stroke();
        q.fillStyle = '#2b2a28'; q.font = '700 30px "Zen Maru Gothic", sans-serif'; q.fillText('書きやすさ↑', 300, 220); q.fillText('重心 45%', 60, 70);
        q.strokeStyle = '#2e9a63'; q.lineWidth = 4; for (let k = 0; k < 3; k++) { q.beginPath(); q.moveTo(310, 260 + k * 22); q.lineTo(470 - k * 30, 260 + k * 22); q.stroke(); }
        q.fillStyle = '#f6e27a'; q.fillRect(150, 250, 70, 64); q.fillStyle = '#f7b6c8'; q.fillRect(30, 280, 64, 50);
      });
      const bd = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.9), std(0xffffff, 0.25, 0, { map: t })); bd.position.set(0, 1.38, 0.022); g.add(bd);
      B(1.2, 0.03, 0.08, metal, 0, 0.9, 0.05); for (let k = 0; k < 3; k++) B(0.12, 0.022, 0.022, std([0x2b6fd6, 0xd9493e, 0x2b2a28][k], 0.4), -0.3 + k * 0.16, 0.925, 0.06);
    } else if (type === 'bookshelf' || type === 'mood') {
      if (type === 'bookshelf') {
        const wood = std(0x9b7650, 0.6);
        B(1.46, 1.8, 0.03, wood, 0, 0.9, -0.19); for (const sx of [-0.715, 0.715]) B(0.03, 1.8, 0.4, wood, sx, 0.9, 0);
        for (let k = 0; k < 5; k++) B(1.42, 0.03, 0.38, wood, 0, 0.02 + k * 0.44, 0);
        for (let k = 0; k < 4; k++) {
          let x = -0.68; while (x < 0.62) { const bw = rr(0.035, 0.07), bh = rr(0.24, 0.36), col = pick([0xd9493e, 0x2b6fd6, 0x2e9a63, 0xf0a03a, 0x6d6aa8, 0xe9e2d3, 0x34373d, 0x8a5a36]); const b = B(bw, bh, rr(0.22, 0.3), std(col, 0.7), x + bw / 2, 0.035 + k * 0.44 + bh / 2, 0.02); if (Math.random() < 0.1) { b.rotation.z = 0.25; b.position.x += 0.04; x += 0.06; } x += bw + 0.004; if (Math.random() < 0.06) x += 0.1; }
        }
      } else {
        for (const sx of [-0.62, 0.62]) { B(0.045, 1.75, 0.045, std(0x8a6a45, 0.6), sx, 0.88, 0); B(0.05, 0.04, 0.4, std(0x8a6a45, 0.6), sx, 0.03, 0); }
        const t = tex(512, 360, (q, w, h) => {
          q.fillStyle = '#c9a26b'; q.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { q.fillStyle = `rgba(${90 + (k % 40)},60,30,.18)`; q.fillRect((k * 97) % w, (k * 61) % h, 2, 2); }
          const notes = ['#f6e27a', '#f7b6c8', '#9fd6f0', '#b7e3a0', '#fbd38d']; for (let k = 0; k < 14; k++) { const x = 18 + (k % 5) * 98, y = 16 + ((k / 5) | 0) * 112; q.save(); q.translate(x + 38, y + 38); q.rotate(((k * 37) % 9 - 4) * 0.03); q.fillStyle = notes[k % 5]; q.fillRect(-38, -38, 76, 76); q.fillStyle = 'rgba(0,0,0,.45)'; for (let l = 0; l < 3; l++) q.fillRect(-28, -20 + l * 16, 40 + ((k + l) % 3) * 8, 4); q.fillStyle = '#d9493e'; q.beginPath(); q.arc(0, -32, 5, 0, TAU); q.fill(); q.restore(); }
          for (let k = 0; k < 6; k++) { q.fillStyle = ['#d9493e', '#f0a03a', '#f6c945', '#2e9a63', '#2b6fd6', '#7b4bc4'][k]; q.fillRect(330 + k * 26, 300, 22, 40); }
        });
        const bd = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.04), [std(0x8a6a45), std(0x8a6a45), std(0x8a6a45), std(0x8a6a45), std(0xffffff, 0.8, 0, { map: t }), std(0x8a6a45)]); bd.position.set(0, 1.25, 0); bd.castShadow = true; g.add(bd);
      }
    } else if (type === 'coffee') {
      B(0.98, 0.84, 0.46, std(0xf1ece2, 0.5), 0, 0.42, 0); B(1.0, 0.04, 0.48, std(0x7a5233, 0.45), 0, 0.86, 0);
      const mc = new THREE.Group(); mc.position.set(-0.18, 0.88, -0.02); g.add(mc);
      B(0.32, 0.44, 0.32, dark, 0, 0.22, 0, mc); B(0.26, 0.12, 0.02, std(0x101418, 0.3, 0, { emissive: 0x3a6f9a, emissiveIntensity: 0.4 }), 0, 0.34, 0.165, mc); B(0.08, 0.06, 0.08, metal, 0, 0.17, 0.15, mc); B(0.28, 0.02, 0.16, metal, 0, 0.02, 0.1, mc);
      const cup = Cy(0.035, 0.03, 0.08, std(0xffffff, 0.3), -0.18, 0.95, 0.1, 14);
      for (let k = 0; k < 3; k++) Cy(0.04, 0.035, 0.09, std([0xd9493e, 0x2b6fd6, 0xf6c945][k], 0.4), 0.14 + k * 0.1, 0.925, 0.06, 14);
      B(0.22, 0.14, 0.14, std(0x8a5a36, 0.8), 0.32, 0.95, -0.12);
      const steam = []; for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); g.add(s); steam.push(s); }
      g.userData.anim = t => steam.forEach((s, k) => { const f = (t * 0.6 + k / 3 + ph) % 1; s.position.set(cup.position.x + Math.sin(f * 8 + k) * 0.015, 1.0 + f * 0.25, cup.position.z); s.material.opacity = 0.45 * (1 - f); s.scale.setScalar(0.6 + f * 1.4); });
    } else if (type === 'sofa' ) {
      const cl = std(0x3f6f7a, 0.85), cl2 = std(0x4f8590, 0.85);
      B(1.9, 0.24, 0.86, cl, 0, 0.2, 0); for (const sx of [-0.85, 0.85]) B(0.2, 0.42, 0.88, cl, sx, 0.43, 0);
      B(1.9, 0.5, 0.22, cl, 0, 0.6, -0.33); for (const sx of [-0.38, 0.38]) B(0.74, 0.13, 0.64, cl2, sx, 0.385, 0.08);
      for (const sx of [-0.55, 0.55]) { const p = B(0.34, 0.3, 0.1, std(sx < 0 ? 0xf6c945 : 0xe9e2d3, 0.9), sx, 0.6, -0.17); p.rotation.x = -0.2; }
      for (const [x, z] of [[-0.85, -0.35], [0.85, -0.35], [-0.85, 0.35], [0.85, 0.35]]) Cy(0.025, 0.02, 0.09, dark, x, 0.045, z, 8);
    } else if (type === 'aquarium') {
      B(1.42, 0.74, 0.72, std(0x2f3a45, 0.5), 0, 0.37, 0);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.6, 0.68), new THREE.MeshStandardMaterial({ color: 0xcfeaf6, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false })); glass.position.y = 1.05; g.add(glass);
      const water = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.52, 0.64), new THREE.MeshStandardMaterial({ color: 0x4fa8d0, transparent: true, opacity: 0.3, roughness: 0.1, depthWrite: false, emissive: 0x0d3a55, emissiveIntensity: 0.4 })); water.position.y = 1.01; g.add(water);
      B(1.34, 0.06, 0.64, std(0xe1cf9f, 0.95), 0, 0.78, 0); B(1.42, 0.05, 0.72, std(0x2f3a45, 0.5), 0, 1.375, 0);
      for (let k = 0; k < 7; k++) { const w = new THREE.Mesh(new THREE.ConeGeometry(0.03, rr(0.2, 0.4), 6), std(0x3f8f4a, 0.7)); w.position.set(rr(-0.6, 0.6), 0.9, rr(-0.25, 0.1)); g.add(w); }
      for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rr(0.05, 0.09)), std(0x8a8a86, 0.9)); r.position.set(rr(-0.5, 0.5), 0.83, rr(-0.2, 0.2)); g.add(r); }
      const fish = [];
      for (let k = 0; k < 6; k++) { const f = new THREE.Group(), col = [0xf0782a, 0xf6c945, 0x2b8fd6, 0xd9493e, 0xf0782a, 0x7cbf4d][k], m = std(col, 0.4, 0, { emissive: col, emissiveIntensity: 0.15 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), m); b.scale.set(1.6, 1, 0.6); f.add(b); const tl = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 6), m); tl.rotation.z = Math.PI / 2; tl.position.x = -0.075; f.add(tl); g.add(f); fish.push({ f, r: rr(0.25, 0.55), y: rr(0.88, 1.18), s: rr(0.4, 0.8) * (k % 2 ? 1 : -1), p: rr(0, TAU), zr: rr(0.12, 0.22) }); }
      g.userData.anim = t => fish.forEach(F => { const a = t * F.s + F.p; F.f.position.set(Math.cos(a) * F.r, F.y + Math.sin(a * 2.3) * 0.03, Math.sin(a) * F.zr); F.f.rotation.y = Math.atan2(-Math.cos(a) * F.zr * F.s, -Math.sin(a) * F.r * F.s); });
    } else if (type === 'vending') {
      const t = tex(256, 384, (q, w, h) => {
        q.fillStyle = '#e9edf2'; q.fillRect(0, 0, w, h); q.fillStyle = '#1f2a36'; q.fillRect(12, 14, w - 24, 230);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { q.fillStyle = ['#d9493e', '#2b6fd6', '#f6c945', '#2e9a63', '#f0a03a', '#e86fa8', '#8a5a36'][(r * 5 + c) % 7]; q.fillRect(26 + c * 42, 26 + r * 56, 26, 40); q.fillStyle = 'rgba(255,255,255,.4)'; q.fillRect(30 + c * 42, 30 + r * 56, 6, 32); q.fillStyle = '#9aa6b8'; q.fillRect(26 + c * 42, 70 + r * 56, 26, 6); }
        q.fillStyle = '#2b2a28'; q.font = '900 30px "Zen Maru Gothic", sans-serif'; q.textAlign = 'center'; q.fillText('のみもの', w / 2, 290); q.fillStyle = '#2b2a28'; q.fillRect(40, 320, 176, 40);
      });
      B(0.92, 1.8, 0.72, std(0xc8372e, 0.4, 0.1), 0, 0.9, 0);
      const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), std(0xffffff, 0.3, 0, { map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35 })); fr.position.set(0, 0.95, 0.362); g.add(fr);
    } else if (type === 'phone') {
      const fm = std(0x3a4552, 0.4, 0.5), gl = new THREE.MeshStandardMaterial({ color: 0xcfe6f2, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
      B(0.96, 0.05, 0.96, fm, 0, 0.025, 0); B(0.96, 0.08, 0.96, fm, 0, 2.1, 0);
      for (const [x, z] of [[-0.46, -0.46], [0.46, -0.46], [-0.46, 0.46], [0.46, 0.46]]) B(0.05, 2.1, 0.05, fm, x, 1.05, z);
      for (const [x, z, ry] of [[0, -0.46, 0], [-0.46, 0, Math.PI / 2], [0.46, 0, Math.PI / 2], [0.12, 0.46, 0]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(ry ? 0.88 : (z > 0 ? 0.6 : 0.88), 1.95), gl); p.position.set(x, 1.05, z); p.rotation.y = ry; g.add(p); }
      B(0.7, 0.04, 0.32, std(0x9b7650, 0.5), 0, 1.0, -0.28); B(0.16, 0.06, 0.12, dark, 0.15, 1.05, -0.3); B(0.05, 0.04, 0.16, std(0xd9493e, 0.5), -0.1, 1.04, -0.3);
      Cy(0.16, 0.16, 0.05, std(0x2e9a63, 0.7), 0, 0.62, 0, 16); Cy(0.025, 0.025, 0.6, metal, 0, 0.31, 0, 8);
      const sign = tex(256, 64, (q, w, h) => { q.fillStyle = '#2e9a63'; q.fillRect(0, 0, w, h); q.fillStyle = '#fff'; q.font = '900 36px "Zen Maru Gothic", sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('でんわ', w / 2, h / 2 + 2); });
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), new THREE.MeshBasicMaterial({ map: sign })); sg.position.set(0, 2.02, 0.49); g.add(sg);
    } else if (type === 'piano') {   // 小さめのグランドピアノ（左がまっすぐ、右が丸い）。手前に鍵盤といす
      const blk = std(0x0d0d10, 0.12, 0.2), sh = new THREE.Shape();
      sh.moveTo(-0.7, 0.3); sh.lineTo(0.7, 0.3); sh.lineTo(0.7, 0.0); sh.bezierCurveTo(0.7, -0.3, 0.15, -0.3, 0.05, -0.5); sh.bezierCurveTo(-0.08, -0.75, -0.5, -0.75, -0.7, -0.72); sh.closePath();
      const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false, curveSegments: 18 }), blk); body.rotation.x = Math.PI / 2; body.position.y = 0.95; g.add(body);
      const hinge = new THREE.Group(); hinge.position.set(-0.7, 0.97, 0); g.add(hinge);
      const lid = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false, curveSegments: 18 }), blk); lid.rotation.x = Math.PI / 2; lid.position.set(0.7, 0, 0); hinge.add(lid); hinge.rotation.z = 0.55;
      B(0.02, 0.56, 0.02, blk, 0.22, 1.23, -0.2);
      B(1.36, 0.05, 0.16, std(0xf6f4ee, 0.3), 0, 0.68, 0.38);
      for (let k = 0; k < 19; k++) if ([0, 1, 3, 4, 5].includes(k % 7)) B(0.034, 0.035, 0.09, blk, -0.68 + (k + 1) * 0.068, 0.72, 0.35);
      B(1.42, 0.1, 0.05, blk, 0, 0.61, 0.47);
      for (const [x, z] of [[-0.6, 0.2], [0.6, 0.2], [-0.4, -0.6]]) Cy(0.045, 0.035, 0.66, blk, x, 0.33, z, 10);
      B(0.7, 0.06, 0.3, blk, 0, 0.5, 0.66); for (const [x, z] of [[-0.3, 0.55], [0.3, 0.55], [-0.3, 0.77], [0.3, 0.77]]) B(0.04, 0.48, 0.04, blk, x, 0.24, z);
    }
    g.traverse(c => { if (c.isMesh && c.castShadow !== false) { c.castShadow = true; c.receiveShadow = true; } });
    g.userData.type = type;
    return g;
  },
  thumb(type) {
    if (this.thumbs[type]) return this.thumbs[type];
    const S = 96; if (!this.rt) this.rt = new THREE.WebGLRenderTarget(S, S, { samples: 4, colorSpace: THREE.SRGBColorSpace });
    const sc = new THREE.Scene(); sc.environment = ENV; sc.background = new THREE.Color(0xf4efe4);
    const l = new THREE.DirectionalLight(0xffffff, 2.2); l.position.set(-4, 8, 6); sc.add(l, new THREE.HemisphereLight(0xffffff, 0xd8cdb8, 0.8));
    const o = this.model(type); sc.add(o); o.rotation.y = 0.35;
    const bb = new THREE.Box3().setFromObject(o), ctr = bb.getCenter(new THREE.Vector3()), r = bb.getSize(new THREE.Vector3()).length() / 2;
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50); cam.position.set(ctr.x + r * 1.2, ctr.y + r * 1.25, ctr.z + r * 2.8); cam.lookAt(ctr);
    renderer.setRenderTarget(this.rt); renderer.render(sc, cam);
    const px = new Uint8Array(S * S * 4); renderer.readRenderTargetPixels(this.rt, 0, 0, S, S, px); renderer.setRenderTarget(null);
    const c = newCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
    for (let y = 0; y < S; y++) img.data.set(px.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
    g.putImageData(img, 0, 0); disposeTree(o);
    return (this.thumbs[type] = c.toDataURL('image/jpeg', 0.85));
  },
  // =====================================================================================
  //  模様がえモード
  // =====================================================================================
  enter() {
    if (!S) return; this.on = true; this.sel = null; this.cam0 = { pitch: OFFICE.pitch, zoom: OFFICE.zoom };
    OFFICE.pitch = Math.max(OFFICE.pitch, 0.95); document.body.classList.add('furn');
    this.hint = '置きたい家具を選んで、床をタップ。置いた家具をタップすると動かせます'; this.renderBar(); this.refreshLabels();
  },
  exit() {
    this.cancel(); this.on = false; document.body.classList.remove('furn');
    if (this.cam0) { OFFICE.pitch = this.cam0.pitch; OFFICE.zoom = this.cam0.zoom; }
    this.clearLabels(); UI.dirty(); save();
  },
  // いま選んでいる家具（新しく買う／動かす）
  choose(type) {
    this.cancel();
    const why = this.why(S, type); if (why) { UI.toast(why, 'bad'); AU.bad(); return; }
    const Lo = OFFICE.lay, near = { x: 0, z: 0 }, f = this.findSpot(S, Lo, type, 0, near) || { type, x: 0, z: 0, rot: 0 };
    this.sel = { type, x: f.x, z: f.z, rot: f.rot, moving: null };
    this.hint = FURN[type].name + '：床をタップして場所を決め、「ここに置く」'; this.makeGhost(); this.renderBar();
  },
  grab(f) {
    this.cancel();
    this.sel = { type: f.type, x: f.x, z: f.z, rot: f.rot || 0, moving: f };
    const o = (OFFICE.furnObjs || []).find(x => x.userData.furn === f); if (o) o.visible = false; this.hidden = o;
    this.hint = FURN[f.type].name + '：動かす場所をタップ。「回す」「しまう」もできます'; this.makeGhost(); this.renderBar();
  },
  cancel() {
    if (this.hidden) { this.hidden.visible = true; this.hidden = null; }
    this.sel = null; this.dropGhost(); if (this.on) this.refreshLabels();
  },
  makeGhost() {
    this.dropGhost(); const s = this.sel; if (!s) return;
    const o = this.model(s.type), gm = new THREE.MeshStandardMaterial({ color: 0x8fd6a8, transparent: true, opacity: 0.55, roughness: 0.5, depthWrite: false });
    o.traverse(c => { if (c.isMesh) { if (c.material) { const ms = Array.isArray(c.material) ? c.material : [c.material]; ms.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } c.material = gm; c.castShadow = false; } });
    o.userData.anim = null;
    const [w, d] = [FURN[s.type].w * this.CELL, FURN[s.type].d * this.CELL], pad = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: 0x2e9a63, transparent: true, opacity: 0.35, depthWrite: false }));
    pad.rotation.x = -Math.PI / 2; pad.position.y = 0.012; o.add(pad);
    this.ghost = o; this.ghostM = gm; this.ghostPad = pad; OFFICE.scene.add(o);
    const F = FURN[s.type]; if (F.r) { const ring = new THREE.Mesh(new THREE.RingGeometry(F.r - 0.05, F.r, 64), new THREE.MeshBasicMaterial({ color: 0x2b6fd6, transparent: true, opacity: 0.5, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.015; OFFICE.scene.add(ring); this.ring = ring; }
    this.moveGhost();
  },
  dropGhost() {
    for (const k of ['ghost', 'ring']) if (this[k]) { OFFICE.scene.remove(this[k]); disposeTree(this[k]); this[k] = null; }
  },
  candidate() { const s = this.sel; return s ? { type: s.type, x: s.x, z: s.z, rot: s.rot } : null; },
  valid() { const s = this.sel; if (!s) return false; return this.fits(S, OFFICE.lay, this.candidate(), S.furn, s.moving); },
  moveGhost() {
    const s = this.sel; if (!s || !this.ghost) return;
    const Lo = OFFICE.lay, f = this.candidate(); this.placeObj(this.ghost, f, Lo);
    const ok = this.valid(); this.ghostM.color.set(ok ? 0x8fd6a8 : 0xf0a0a0); this.ghostPad.material.color.set(ok ? 0x2e9a63 : 0xd9493e);
    if (this.ring) { const c = this.center(f, Lo); this.ring.position.set(c.x, 0.015, c.z); }
    this.refreshLabels(); this.renderBtns();
  },
  // 床の点 → 家具の左奥のマス
  cellAt(p) {
    const s = this.sel, Lo = OFFICE.lay, [w, d] = this.dims(s.type, s.rot), nx = Math.round(Lo.W / this.CELL), nz = Math.round(Lo.D / this.CELL);
    return { x: clamp(Math.round((p.x + Lo.W / 2) / this.CELL - w / 2), 0, nx - w), z: clamp(Math.round((p.z + Lo.D / 2) / this.CELL - d / 2), 0, nz - d) };
  },
  ray(p) {
    const rc = this._rc || (this._rc = new THREE.Raycaster()), v = new THREE.Vector2(p.x / VW() * 2 - 1, -(p.y / VH()) * 2 + 1);
    rc.setFromCamera(v, OFFICE.cam); return rc;
  },
  floorAt(p) { const rc = this.ray(p), hit = new THREE.Vector3(); return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit) ? hit : null; },
  hover(p) { if (!this.on || !this.sel) return; const h = this.floorAt(p); if (!h) return; const c = this.cellAt(h); if (c.x !== this.sel.x || c.z !== this.sel.z) { this.sel.x = c.x; this.sel.z = c.z; this.moveGhost(); } },
  tap(p, mouse) {
    if (!this.on) return;
    if (this.sel) {
      const h = this.floorAt(p); if (!h) return; const c = this.cellAt(h);
      if (c.x === this.sel.x && c.z === this.sel.z || mouse) { this.sel.x = c.x; this.sel.z = c.z; this.moveGhost(); if (this.valid()) { this.commit(); return; } if (mouse) { AU.bad(); return; } }
      this.sel.x = c.x; this.sel.z = c.z; this.moveGhost(); AU.click(); return;
    }
    // 置いてある家具をタップ → 動かす
    const rc = this.ray(p), objs = (OFFICE.furnObjs || []).filter(o => o.visible), hits = rc.intersectObjects(objs, true);
    if (hits.length) { let o = hits[0].object; while (o && !o.userData.furn) o = o.parent; if (o) { AU.click(); this.grab(o.userData.furn); return; } }
    const h = this.floorAt(p); if (!h) return;
    const f = (S.furn || []).find(g => { const r = this.rect(g, OFFICE.lay); return h.x >= r[0] && h.x <= r[2] && h.z >= r[1] && h.z <= r[3]; });
    if (f) { AU.click(); this.grab(f); }
  },
  commit() {
    const s = this.sel; if (!s || !this.valid()) { AU.bad(); return; }
    if (s.moving) { Object.assign(s.moving, { x: s.x, z: s.z, rot: s.rot }); this.hidden = null; this.sel = null; this.dropGhost(); AU.coin(); }
    else {
      const why = this.why(S, s.type); if (why) { UI.toast(why, 'bad'); AU.bad(); return; }
      S.money -= FURN[s.type].price; S.furn.push({ type: s.type, x: s.x, z: s.z, rot: s.rot }); AU.coin();
      UI.toast(`${FURN[s.type].name}を置いた（${yen(FURN[s.type].price)}）`, 'good');
      if (this.why(S, s.type)) { this.sel = null; this.dropGhost(); }
    }
    this.ver++; OFFICE.key = ''; OFFICE.sync(S); if (this.sel) this.makeGhost();
    this.hint = this.sel ? 'つづけて置けます。ほかの場所をタップ' : '置きました。家具をタップすると動かせます'; this.renderBar(); this.refreshLabels();
  },
  rotate() {
    const s = this.sel; if (!s) return; const Lo = OFFICE.lay, c = this.center(this.candidate(), Lo);
    s.rot = (s.rot + 1) % 4; const cell = this.cellAt(c); s.x = cell.x; s.z = cell.z; AU.click(); this.makeGhost();
  },
  sell() {
    const s = this.sel; if (!s || !s.moving) return; const F = FURN[s.type], back = Math.round(F.price / 2);
    S.furn = S.furn.filter(f => f !== s.moving); S.money += back; this.hidden = null; this.sel = null; this.dropGhost(); this.ver++; OFFICE.key = ''; OFFICE.sync(S);
    UI.toast(`${F.name}をしまった（${yen(back, true)}）`); AU.coin(); this.hint = 'しまいました'; this.renderBar(); this.refreshLabels();
  },
  // ---------- 下のバー ----------
  renderBar() {
    const bar = $('furnBar'); if (!bar) return;
    const list = Object.keys(FURN).map(k => {
      const F = FURN[k], lock = F.tier > S.tier, n = this.count(S, k), on = this.sel && !this.sel.moving && this.sel.type === k;
      return `<button type="button" class="fi ${on ? 'on' : ''} ${lock ? 'lock' : ''}" data-fa="pick" data-k="${k}"><img alt="" src="${this.thumb(k)}"><b>${esc(F.name)}</b><small>${lock ? OFFICES[F.tier].name + 'から' : yen(F.price)}${n ? `・${n}こ` : ''}</small><em>${esc(F.desc)}</em></button>`;
    }).join('');
    bar.innerHTML = `<div id="fbTop"><span id="fbHint">${esc(this.hint)}</span><span class="pill">家具 ${S.furn.length} / ${this.limit(S)}</span><span class="pill">${yen(S.money)}</span></div><div id="fbList">${list}</div><div id="fbBtns"></div>`;
    this.renderBtns();
  },
  renderBtns() {
    const b = $('fbBtns'); if (!b) return; const s = this.sel, ok = s && this.valid();
    b.innerHTML = (s ? `<button type="button" class="btn green" data-fa="put" ${ok ? '' : 'disabled'}>${s.moving ? 'ここに動かす' : 'ここに置く（' + yen(FURN[s.type].price) + '）'}</button><button type="button" class="btn sub" data-fa="rot">回す</button>${s.moving ? `<button type="button" class="btn sub" data-fa="sell">しまう（${yen(Math.round(FURN[s.type].price / 2), true)}）</button>` : ''}<button type="button" class="btn sub" data-fa="cancel">やめる</button>` : '') + `<button type="button" class="btn" data-fa="done" style="margin-left:auto">完了</button>`;
  },
  onBar(e) {
    const t = e.target.closest('[data-fa]'); if (!t || t.disabled) return; AU.resume();
    const a = t.dataset.fa;
    if (a === 'pick') { if (FURN[t.dataset.k].tier > S.tier) { UI.toast(`${OFFICES[FURN[t.dataset.k].tier].name}に引っ越すと置けます`, 'bad'); return; } AU.click(); this.choose(t.dataset.k); }
    else if (a === 'put') this.commit();
    else if (a === 'rot') this.rotate();
    else if (a === 'sell') this.sell();
    else if (a === 'cancel') { AU.click(); this.cancel(); this.hint = '置きたい家具を選んで、床をタップ'; this.renderBar(); }
    else if (a === 'done') { AU.click(); this.exit(); }
  },
  // ---------- 机の上の効果の表示（置く前に、どれだけ速くなるか見える） ----------
  clearLabels() { for (const l of this.labels) { if (l.parent) l.parent.remove(l); l.material.map.dispose(); l.material.dispose(); } this.labels = []; },
  refreshLabels() {
    this.clearLabels(); if (!this.on || !S || !OFFICE.lay) return;
    const now = this.get(S).per; let prev = null;
    if (this.sel) { const f = this.candidate(); if (this.valid()) { const list = S.furn.filter(g => g !== this.sel.moving).concat([f]); prev = this.calc(S, list).per; } }
    S.staff.forEach((m, i) => {
      const dk = OFFICE.lay.desks[i]; if (!dk) return;
      const a = Math.round((now[m.id] || 0) * 100), b = prev ? Math.round((prev[m.id] || 0) * 100) : a, up = b > a, dn = b < a;
      const c = newCanvas(192, 80), q = c.getContext('2d');
      q.fillStyle = up ? '#2e9a63' : dn ? '#d9493e' : b > 0 ? '#ffffff' : 'rgba(255,255,255,.75)'; q.strokeStyle = 'rgba(0,0,0,.2)'; q.lineWidth = 3;
      q.beginPath(); q.roundRect(4, 8, 184, 64, 30); q.fill(); q.stroke();
      q.fillStyle = up || dn ? '#fff' : b > 0 ? '#2e9a63' : '#8a8478'; q.font = '900 38px "Zen Maru Gothic", sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle';
      q.fillText((b > 0 ? '+' : '±') + b + '%' + (up ? ' ↑' : dn ? ' ↓' : ''), 96, 42);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); sp.renderOrder = 12; const k = Math.max(1, OFFICE.lay.W / 9); sp.scale.set(0.84 * k, 0.35 * k, 1); sp.position.set(dk.x, 1.75, dk.z);
      OFFICE.scene.add(sp); this.labels.push(sp);
    });
  },
};
