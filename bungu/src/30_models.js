// =========================================================================================
//  3Dの製品モデル：デザイン（性能の選択肢＋見た目）から、えんぴつ・消しゴム・シャー芯・シャーペン・ボールペン・万年筆を組み立てる
//  単位は cm。長さの向きが +x（先が +x）、正面が +z。軸の表面の色・模様・ロゴはキャンバスに描いて貼る
// =========================================================================================
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const pmrem = new THREE.PMREMGenerator(renderer);
const ENV = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const MAXANI = Math.min(8, renderer.capabilities.getMaxAnisotropy());

// ---------- ノイズ（大理石・木目・まだら模様） ----------
const _h2 = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h & 0xffff) / 65535; };
function vnoise(x, y) { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = _h2(i, j), b = _h2(i + 1, j), c = _h2(i, j + 1), d = _h2(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm2(x, y) { let s = 0, a = 0.5, f = 1; for (let o = 0; o < 4; o++) { s += a * vnoise(x * f + o * 7.1, y * f - o * 3.3); a *= 0.5; f *= 2.02; } return s / 0.9375; }
const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixHex = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const newCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const FONT_CSS = { goth: '700 {s}px "Zen Maru Gothic", "Hiragino Sans", "Noto Sans JP", sans-serif', round: '900 {s}px "Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif', mincho: '700 {s}px "Shippori Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif' };

// 模様を描く。w×h のキャンバスが、横 L cm（長さ）× 縦 C cm（まわり）にあたる
function drawPattern(g, w, h, L, C, pattern, base, pat) {
  const px = w / L, py = h / C;   // 1cm あたりの点（横・縦）
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.fillStyle = pat; g.strokeStyle = pat;
  const per = (cm, f) => { for (let y = -1; y < h / (cm * py) + 1; y++) for (let x = -1; x < w / (cm * px) + 1; x++) f(x * cm * px + ((y & 1) ? cm * px / 2 : 0), y * cm * py, y); };
  const ell = (x, y, r) => { g.beginPath(); g.ellipse(x, y, r * px, r * py, 0, 0, TAU); g.fill(); };
  if (pattern === 'stripe') { const p = 0.36 * py; for (let y = 0; y < h + p; y += p) g.fillRect(0, y, w, p * 0.38); }
  else if (pattern === 'dots') per(0.42, (x, y) => ell(x, y, 0.09));
  else if (pattern === 'stars') per(0.62, (x, y) => { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = (k & 1 ? 0.06 : 0.15); g.lineTo(x + Math.cos(a) * r * px, y + Math.sin(a) * r * py); } g.closePath(); g.fill(); });
  else if (pattern === 'hearts') per(0.6, (x, y) => { const s = 0.12; g.beginPath(); g.moveTo(x, y + s * py); g.bezierCurveTo(x - 1.6 * s * px, y - 0.2 * s * py, x - 0.6 * s * px, y - 1.3 * s * py, x, y - 0.4 * s * py); g.bezierCurveTo(x + 0.6 * s * px, y - 1.3 * s * py, x + 1.6 * s * px, y - 0.2 * s * py, x, y + s * py); g.fill(); });
  else if (pattern === 'check') { g.globalAlpha = 0.45; const p = 0.5; for (let x = 0; x < w; x += p * px * 2) g.fillRect(x, 0, p * px, h); for (let y = 0; y < h; y += p * py * 2) g.fillRect(0, y, w, p * py); g.globalAlpha = 1; }
  else if (pattern === 'grad') { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, base); gr.addColorStop(1, pat); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  else if (['marble', 'wood', 'camo'].includes(pattern)) {
    const img = g.getImageData(0, 0, w, h), d = img.data, B = hex2rgb(base), P = hex2rgb(pat);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const cx = x / px, cy = y / py; let t;
      if (pattern === 'marble') { const n = fbm2(cx * 0.9, cy * 0.9); t = Math.pow(Math.abs(Math.sin(cx * 1.4 + n * 7)), 6) * 0.9 + n * 0.15; }
      else if (pattern === 'wood') { const n = fbm2(cx * 0.25, cy * 2.2); t = 0.5 + 0.5 * Math.sin(cy * 9 + n * 6); t = t * t * 0.55 + n * 0.2; }
      else { const n = fbm2(cx * 0.8, cy * 0.8); t = n > 0.55 ? 1 : n > 0.47 ? 0.5 : 0; }
      const i = (y * w + x) * 4; for (let k = 0; k < 3; k++) d[i + k] = B[k] + (P[k] - B[k]) * clamp(t, 0, 1);
    }
    g.putImageData(img, 0, 0);
  }
}
// 軸の表面のテクスチャ：模様＋両はしの色帯＋ロゴ（正面＝縦のまん中）
function surfaceTex(o) {
  const L = o.L, C = o.C, w = o.cheap ? 512 : 1024, h = clamp(Math.round(w * C / L), 32, 1024), c = newCanvas(w, h), g = c.getContext('2d');
  drawPattern(g, w, h, L, C, o.pattern || 'none', o.base, o.pat || o.base);
  for (const b of o.bands || []) { g.fillStyle = b.color; g.fillRect(b.from / L * w, 0, (b.to - b.from) / L * w, h); }
  for (const t of o.texts || []) {
    if (!t.text) continue;
    const ph = t.size * h / C, x0 = t.from / L * w, x1 = t.to / L * w;
    g.save(); g.fillStyle = t.color; g.textBaseline = 'middle'; g.textAlign = t.align || 'left';
    g.font = (FONT_CSS[t.font] || FONT_CSS.goth).replace('{s}', Math.round(ph));
    // 縦と横で 1cm の点の数がちがうので、横を (横の点/縦の点) 倍にして形を保つ。入りきらなければ縮める
    const tw = g.measureText(t.text).width, k = (w / L) / (h / C), maxW = x1 - x0, sx = k * Math.min(1, maxW / Math.max(1, tw * k));
    g.translate(t.align === 'center' ? (x0 + x1) / 2 : x0, h * (t.v != null ? t.v : 0.5)); g.scale(sx, 1);
    g.fillText(t.text, 0, 0); g.restore();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = MAXANI; tex.wrapS = THREE.RepeatWrapping;
  return tex;
}
// ラバーグリップのつぶつぶ・金属のローレット（法線マップ）
const _nmaps = {};
function bumpTex(kind) {
  if (_nmaps[kind]) return _nmaps[kind];
  const S = 128, H = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let v;
    if (kind === 'dimple') { const fx = (x % 16) - 8, fy = (y % 16) - 8; v = Math.max(0, 1 - Math.hypot(fx, fy) / 5); }
    else if (kind === 'knurl') { v = (Math.abs(((x + y) % 12) - 6) + Math.abs(((x - y + 1200) % 12) - 6)) / 12; }
    else v = vnoise(x / 8, y / 8);
    H[y * S + x] = v;
  }
  const c = newCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const h = (a, b) => H[((b + S) % S) * S + ((a + S) % S)];
    let nx = (h(x - 1, y) - h(x + 1, y)) * 3, ny = (h(x, y + 1) - h(x, y - 1)) * 3; const l = Math.hypot(nx, ny, 1);
    const i = (y * S + x) * 4; img.data[i] = (nx / l * .5 + .5) * 255; img.data[i + 1] = (ny / l * .5 + .5) * 255; img.data[i + 2] = (1 / l * .5 + .5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(kind === 'knurl' ? 6 : 4, kind === 'knurl' ? 6 : 3);
  return (_nmaps[kind] = t);
}

// ---------- 形：断面（y,z の点の輪）を x にそって押し出す ----------
// 断面の点は θ＝atan2(y,z) が −π から増える順。v（テクスチャの縦）は周の長さの割合で、正面（θ＝0）が 0.5
function finishSection(pts) {
  pts.forEach(p => (p.a = Math.atan2(p.y, p.z)));
  let k = 0; pts.forEach((p, i) => { if (p.a < pts[k].a) k = i; });
  const P = pts.slice(k).concat(pts.slice(0, k)); let s = 0; P[0].s = 0;
  for (let i = 1; i < P.length; i++) { s += Math.hypot(P[i].y - P[i - 1].y, P[i].z - P[i - 1].z); P[i].s = s; }
  const per = s + Math.hypot(P[0].y - P[P.length - 1].y, P[0].z - P[P.length - 1].z);
  P.forEach(p => (p.v = p.s / per)); P.per = per;
  return P;
}
function secCircle(r, n = 56) { const pts = []; for (let j = 0; j < n; j++) { const a = -Math.PI + j * TAU / n; pts.push({ y: r * Math.sin(a), z: r * Math.cos(a) }); } return finishSection(pts); }
// 角を丸めた多角形の断面（面のまん中が正面）。corners は [y,z] の角（丸める前）
function secRounded(corners, cr, arcN = 6, edgeN = 4) {
  const pts = [], n = corners.length;
  for (let i = 0; i < n; i++) {
    const P = corners[(i + n - 1) % n], Q = corners[i], N = corners[(i + 1) % n];
    // 角の内がわに cr だけ入った点を中心に、外向きの法線の間を円弧で
    const e1 = [Q[0] - P[0], Q[1] - P[1]], e2 = [N[0] - Q[0], N[1] - Q[1]], l1 = Math.hypot(...e1), l2 = Math.hypot(...e2);
    const n1 = [-e1[1] / l1, e1[0] / l1], n2 = [-e2[1] / l2, e2[0] / l2];   // θ が増える向きの輪の外向き
    const bis = [n1[0] + n2[0], n1[1] + n2[1]], bl = Math.hypot(...bis) || 1, half = Math.acos(clamp((n1[0] * n2[0] + n1[1] * n2[1]), -1, 1)) / 2;
    const d = cr / Math.cos(half), cx = Q[0] - bis[0] / bl * d, cy = Q[1] - bis[1] / bl * d;
    const a0 = Math.atan2(n1[0], n1[1]), a1 = a0 + angDiff2(a0, Math.atan2(n2[0], n2[1]));
    // 前の角からこの角までの辺（点を足して、色やテクスチャの細かさを保つ）
    if (pts.length) { const last = pts[pts.length - 1], sx = cx + Math.sin(a0) * cr, sy = cy + Math.cos(a0) * cr; for (let k = 1; k < edgeN; k++) pts.push({ y: lerp(last.y, sx, k / edgeN), z: lerp(last.z, sy, k / edgeN) }); }
    for (let k = 0; k <= arcN; k++) { const a = lerp(a0, a1, k / arcN); pts.push({ y: cx + Math.sin(a) * cr, z: cy + Math.cos(a) * cr }); }
  }
  { const last = pts[pts.length - 1], first = pts[0]; for (let k = 1; k < edgeN; k++) pts.push({ y: lerp(last.y, first.y, k / edgeN), z: lerp(last.z, first.z, k / edgeN) }); }
  return finishSection(pts);
}
function angDiff2(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
// 正 n 角形（apothem＝中心から面まで）。面のまん中が正面（+z）にくる。輪の順は θ が増える向き
function secPoly(n, ap, cr) { const R = ap / Math.cos(Math.PI / n), c = []; for (let k = 0; k < n; k++) { const a = Math.PI / n + k * TAU / n; c.push([R * Math.sin(a), R * Math.cos(a)]); } return secRounded(c, cr, 6, 6); }
function secRect(hy, hz, cr) { return secRounded([[hy, hz], [hy, -hz], [-hy, -hz], [-hy, hz]], cr, 6, 6); }
function secMany(hy, hz) {   // 角がたくさんある形：四隅を段にけずった十字形
  const a = hy, b = hz, s = Math.min(hy, hz) * 0.42;
  const c = [[a - s, b], [a - s, b - s], [a, b - s], [a, -b + s], [a - s, -b + s], [a - s, -b], [-a + s, -b], [-a + s, -b + s], [-a, -b + s], [-a, b - s], [-a + s, b - s], [-a + s, b]];
  return secRounded(c, 0.03, 2, 3);
}
// 押し出し：xs の位置ごとに、断面を scale(x, p) 倍した輪をつなぐ。color(x,p,f) で頂点の色
function sweep(xs, sec, scale = () => 1, o = {}) {
  const n = sec.length, pos = [], uv = [], col = o.color ? [] : null, idx = [];
  const x0 = o.u0 != null ? o.u0 : xs[0], x1 = o.u1 != null ? o.u1 : xs[xs.length - 1];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    for (let j = 0; j <= n; j++) {
      const p = sec[j % n], f = scale(x, p, i);
      pos.push(x, p.y * f, p.z * f); uv.push((x - x0) / (x1 - x0 || 1), j === n ? 1 : p.v);
      if (col) { const c = o.color(x, p, f); col.push(c[0], c[1], c[2]); }
    }
  }
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j, b = a + n + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const cap = (i, dir) => {
    const x = xs[i], c0 = pos.length / 3; pos.push(x, 0, 0); uv.push(0.5, 0.5); if (col) { const c = o.capColor || o.color(x, { y: 0, z: 0 }, 0); col.push(c[0], c[1], c[2]); }
    for (let j = 0; j < n; j++) { const p = sec[j], f = scale(x, p, i); pos.push(x, p.y * f, p.z * f); uv.push(0.5 + p.z * 0.3, 0.5 + p.y * 0.3); if (col) { const c = o.capColor || o.color(x, p, f); col.push(c[0], c[1], c[2]); } }
    for (let j = 0; j < n; j++) { const a = c0 + 1 + j, b = c0 + 1 + (j + 1) % n; if (dir < 0) idx.push(c0, a, b); else idx.push(c0, b, a); }
  };
  if (o.capStart) cap(0, -1); if (o.capEnd) cap(xs.length - 1, 1);
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (col) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g = toCreasedNormals(g, o.crease != null ? o.crease : 0.7);
  return g;
}
// 回転体：profile＝[[x, r], ...]
function lathe(profile, o = {}) {
  const sec = o.sec || secCircle(1, o.n || 48), xs = profile.map(p => p[0]), rs = profile.map(p => p[1]);
  return sweep(xs, sec, (x, p, i) => rs[i], o);
}
const range = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
// 丸いはし：x0 から x1 まで、半径 r の丸み（at='start' か 'end'）
function roundEnd(x0, x1, r, at, n = 6) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, a = t * Math.PI / 2; out.push(at === 'start' ? [x0 + (x1 - x0) * (1 - Math.cos(a)), r * Math.sin(a) + 0.0001] : [x0 + (x1 - x0) * Math.sin(a), r * Math.cos(a) + 0.0001]); } return out; }

// ---------- 材質 ----------
const METAL_COL = { silver: 0xd9dce2, gold: 0xe6bb62, black: 0x2c2c30, rose: 0xe8a690 };
function matMetal(m, cheap) { return new THREE.MeshStandardMaterial({ color: METAL_COL[m] || METAL_COL.silver, metalness: 1, roughness: m === 'black' ? 0.38 : 0.18, envMapIntensity: 1.2 }); }
function matPaint(finish, map, cheap, color = 0xffffff) {
  if (cheap || finish === 'matte') return new THREE.MeshStandardMaterial({ map, color, roughness: finish === 'matte' ? 0.78 : finish === 'metal' ? 0.3 : 0.35, metalness: finish === 'metal' ? 0.55 : 0 });
  const p = { map, color, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.06 };
  if (finish === 'metal') Object.assign(p, { metalness: 0.65, roughness: 0.28, clearcoat: 0.7 });
  if (finish === 'pearl') Object.assign(p, { iridescence: 0.75, iridescenceIOR: 1.35, iridescenceThicknessRange: [200, 600], sheen: 0.6, sheenColor: new THREE.Color(0xffffff), roughness: 0.3 });
  return new THREE.MeshPhysicalMaterial(p);
}
function matClear(hex, cheap, smoke) {
  const c = new THREE.Color(hex);
  if (cheap) return new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: smoke ? 0.55 : 0.32, roughness: 0.1, depthWrite: false });
  return new THREE.MeshPhysicalMaterial({ color: c.lerp(new THREE.Color(0xffffff), smoke ? 0 : 0.35), transmission: smoke ? 0.7 : 0.95, thickness: 0.4, roughness: 0.06, ior: 1.45, attenuationColor: c, attenuationDistance: smoke ? 0.6 : 3 });
}
function matRubber(hex, kind) { return new THREE.MeshStandardMaterial({ color: hex, roughness: kind === 'silicone' ? 0.55 : 0.88, normalMap: bumpTex('dimple'), normalScale: new THREE.Vector2(0.6, 0.6) }); }
const matSolid = (hex, rough = 0.5, metal = 0) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
const WOOD_COL = { w0: '#e3bc8c', w1: '#d79d6d', w2: '#b9a991' };
const NAT_WOOD = ['#b77b49', '#8a5a33'];

function mesh(g, m, parent, cast = true) { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = true; if (parent) parent.add(o); return o; }
// クリップ：根もとの輪＋棒＋先の玉（x0〜x1、軸の半径 r の上）
function addClip(grp, x0, x1, r, mat, wide = 0.28) {
  mesh(lathe([[x0 - 0.05, r + 0.012], [x0 + 0.45, r + 0.012]]), mat, grp);
  const bar = mesh(new THREE.BoxGeometry(x1 - x0, 0.07, wide), mat, grp); bar.position.set((x0 + x1) / 2 + 0.2, r + 0.13, 0); bar.rotation.z = -0.025;
  const head = mesh(new THREE.BoxGeometry(0.4, 0.14, wide), mat, grp); head.position.set(x0 + 0.25, r + 0.1, 0);
  const tip = mesh(new THREE.SphereGeometry(wide * 0.42, 14, 10), mat, grp); tip.position.set(x1 + 0.2, r + 0.07, 0); tip.scale.set(1.4, 0.7, 1);
}

// ---------- 種類ごとのモデル ----------
const BUILD = {
  pencil(d, o) {
    const g = new THREE.Group(), L = d.look, sp = d.spec, hasEr = sp.erase === 'yes';
    const sec = sp.shape === 'round' ? secCircle(0.37, 56) : sp.shape === 'tri' ? secPoly(3, 0.33, 0.13) : secPoly(6, 0.36, 0.035);
    const Rmax = Math.max(...sec.map(p => Math.hypot(p.y, p.z)));
    const x0 = hasEr ? 1.85 : 0, bodyL = hasEr ? 13.0 : 14.9, x1 = x0 + bodyL, coneL = 1.9, gr = 0.1;
    const wood = WOOD_COL[sp.wood] || WOOD_COL.w0, grade = (GRADES.find(x => x.id === sp.grade) || GRADES[0]).name;
    const tex = surfaceTex({ L: bodyL, C: sec.per, base: L.body, pattern: L.pattern, pat: L.pat, cheap: o.cheap,
      bands: hasEr ? [] : [{ from: 0, to: 0.7, color: L.tip }],
      texts: [{ text: L.logo, color: L.logoColor, font: L.font, size: 0.34, from: bodyL * 0.3, to: bodyL * 0.86 }, { text: grade, color: L.logoColor, font: 'goth', size: 0.3, from: bodyL * 0.08 + (hasEr ? 0 : 0.6), to: bodyL * 0.22 + (hasEr ? 0 : 0.6) }] });
    mesh(sweep([x0, x1], sec, () => 1), matPaint(L.finish, tex, o.cheap), g);
    if (!hasEr) mesh(sweep([x0, x0 + 0.01], sec, () => 1.002, { capStart: true }), matPaint(L.finish, null, o.cheap, new THREE.Color(L.tip)), g);   // 色をつけたおしり
    // 削った先：角から木が見える（断面と円すいの小さいほう）
    const cw = new THREE.Color(wood), cp = new THREE.Color(L.body);
    const xs = range(x1, x1 + coneL, 14), coneR = x => lerp(Rmax + 0.001, gr, (x - x1) / coneL);
    const cone = sweep(xs, sec, (x, p) => Math.min(1, coneR(x) / Math.hypot(p.y, p.z)), { color: (x, p, f) => (f < 0.999 ? [cw.r, cw.g, cw.b] : [cp.r, cp.g, cp.b]), crease: 0.9 });
    mesh(cone, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), g);
    const lead = lathe([[x1 + coneL - 0.01, gr], [x1 + coneL + 0.42, 0.018]], { n: 20 }); mesh(lead, matSolid(0x2a2a2c, 0.35, 0.4), g);
    if (hasEr) {
      const fer = []; for (const x of range(0.6, 1.9, 26)) fer.push([x, 0.385 + (Math.sin((x - 0.6) / 1.3 * Math.PI * 8) > 0.6 ? 0.018 : 0)]);
      mesh(lathe(fer, { n: 40 }), matMetal(L.metal || 'gold', o.cheap), g);
      mesh(lathe([...roundEnd(0, 0.22, 0.33, 'start'), [0.62, 0.33]], { n: 36 }), matSolid(L.eraser, 0.85), g);
    }
    return g;
  },
  eraser(d, o) {
    const g = new THREE.Group(), L = d.look, sp = d.spec;
    const dims = { sm: [3.4, 0.85, 0.5], md: [4.4, 1.1, 0.58], lg: [5.6, 1.28, 0.66] }[sp.size] || [4.4, 1.1, 0.58];
    const [len, hy, hz] = dims;
    if (sp.shape === 'stick') {   // ホルダー式：細い軸から消しゴムが出ている
      const hl = 9.5, sec = secRect(0.42, 0.3, 0.16), tex = surfaceTex({ L: hl, C: sec.per, base: L.sleeve, pattern: L.pattern, pat: L.pat, cheap: o.cheap, texts: [{ text: L.logo, color: L.logoColor, font: L.font, size: 0.3, from: 1.2, to: 7.5 }] });
      mesh(sweep(range(0, hl, 1), sec, x => (x < 0.25 ? 0.9 : 1), { capStart: true }), matPaint(L.finish, tex, o.cheap), g);
      const er = secRect(0.3, 0.2, 0.08); mesh(sweep(range(hl - 0.3, hl + 1.4, 4), er, x => (x > hl + 1.3 ? 0.9 : 1), { capEnd: true }), matSolid(L.body, 0.9), g);
      const slide = mesh(new THREE.BoxGeometry(1.1, 0.1, 0.3), matSolid(mixHex(L.sleeve, '#000000', 0.25), 0.5), g); slide.position.set(4, 0.44, 0);
      return g;
    }
    const sec = sp.shape === 'many' ? secMany(hy, hz) : secRect(hy, hz, sp.shape === 'soft' ? 0.32 : 0.06);
    const bev = sp.shape === 'soft' ? 0.25 : 0.08, xs = [0, ...range(0.0, bev, 3).slice(1), ...range(len - bev, len, 3)];
    const sc = x => { const e = Math.min(x, len - x); return e >= bev ? 1 : 0.86 + 0.14 * Math.sin(Math.PI / 2 * e / bev); };
    mesh(sweep(xs, sec, sc, { capStart: true, capEnd: true, crease: 0.6 }), new THREE.MeshStandardMaterial({ color: L.body, roughness: 0.92 }), g);
    // 紙のケース：まん中の65%を包む
    const s0 = len * 0.24, s1 = len * 0.9, k = sp.shape === 'many' ? 1.02 : 1.0;
    const ssec = sec.map(p => ({ y: p.y * (1 + 0.035 / hy) * k, z: p.z * (1 + 0.035 / hz) * k, v: p.v })); ssec.per = sec.per;
    const tex = surfaceTex({ L: s1 - s0, C: sec.per, base: L.sleeve, pattern: L.pattern, pat: L.pat, cheap: o.cheap,
      texts: [{ text: L.logo, color: L.logoColor, font: L.font, size: Math.min(0.62, hy * 0.62), from: 0.25, to: s1 - s0 - 0.25, align: 'center' }] });
    const sm = matPaint(L.finish, tex, o.cheap); sm.side = THREE.DoubleSide;
    mesh(sweep([s0, s1], ssec, () => 1), sm, g);
    if (sp.sleeve === 'k1') for (const sy of [-1, 1]) { const cut = mesh(new THREE.BoxGeometry(0.02, 0.22, hz * 2.1), matSolid(mixHex(L.sleeve, '#ffffff', 0.3), 0.7), g); cut.position.set(s0 + 0.01, sy * hy * 0.85, 0); }
    return g;
  },
  lead(d, o) {
    const g = new THREE.Group(), L = d.look, sp = d.spec;
    const len = 7.2, hy = 0.75, hz = 0.3, sec = secRect(hy, hz, 0.12);
    const mat = L.clear === 'solid' ? matPaint('gloss', null, o.cheap, new THREE.Color(L.body)) : matClear(L.body, o.cheap, L.clear === 'smoke');
    mesh(sweep(range(0, len, 1), sec, () => 1, { capStart: true }), mat, g);
    // ふた（スライド式は横に動くつまみつき）
    const capL = 1.5, cap = mesh(sweep(range(len - 0.05, len + capL, 2), secRect(hy + 0.04, hz + 0.04, 0.14), x => (x > len + capL - 0.12 ? 0.92 : 1), { capEnd: true }), matPaint('gloss', null, o.cheap, new THREE.Color(L.cap)), g);
    if (sp.case === 'c1') { const t = mesh(new THREE.BoxGeometry(0.7, 0.12, 0.4), matSolid(mixHex(L.cap, '#000000', 0.2), 0.5), g); t.position.set(len + 0.6, hy + 0.08, 0); }
    if (sp.case === 'c2') { const h = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16), matSolid(0x111111, 0.4), g); h.rotation.z = Math.PI / 2; h.position.set(len + capL + 0.01, 0.35, 0); }
    void cap;
    // 中の芯
    const size = { s05: 0.05, s07: 0.07, s03: 0.03, s09: 0.09, s02: 0.02 }[sp.size] || 0.05, n = sp.count === 'n40' ? 14 : 9;
    if (L.clear !== 'solid') { const lm = matSolid(0x262628, 0.35, 0.5); for (let i = 0; i < n; i++) { const c = mesh(new THREE.CylinderGeometry(size / 2 * 1.4, size / 2 * 1.4, len - 0.4, 6), lm, g, false); c.rotation.z = Math.PI / 2; c.position.set(len / 2, -hy * 0.7 + (i / (n - 1)) * hy * 1.4, (i % 3 - 1) * hz * 0.45); } }
    // ラベル
    const lw = 4.2, lh = 1.05, c = newCanvas(512, 128), gg = c.getContext('2d');
    drawPattern(gg, 512, 128, lw, lh, L.pattern, L.label, L.pat);
    const sz = (LEAD_SIZES.find(x => x.id === sp.size) || LEAD_SIZES[0]).name, gd = sp.grade || 'HB';
    gg.fillStyle = L.logoColor; gg.textBaseline = 'middle';
    gg.font = (FONT_CSS[L.font] || FONT_CSS.goth).replace('{s}', 46); gg.fillText(L.logo || '', 18, 46, 320);
    gg.font = FONT_CSS.goth.replace('{s}', 34); gg.fillText(`${sz}  ${gd}`, 18, 98);
    gg.textAlign = 'right'; gg.font = FONT_CSS.goth.replace('{s}', 28); gg.fillText(sp.count === 'n40' ? '40本' : '20本', 494, 98);
    const lt = new THREE.CanvasTexture(c); lt.colorSpace = THREE.SRGBColorSpace; lt.anisotropy = MAXANI;
    const lab = mesh(new THREE.PlaneGeometry(lw, lh), new THREE.MeshStandardMaterial({ map: lt, roughness: 0.6 }), g, false); lab.position.set(len * 0.47, 0, hz + 0.012);
    return g;
  },
  mech(d, o) {
    const g = new THREE.Group(), L = d.look, sp = d.spec, met = matMetal(L.metal, o.cheap);
    const R = 0.42, bx0 = 1.25, bx1 = 9.7, gx1 = 12.6, cx1 = 13.85, pipe = sp.tip === 't1' ? 0.9 : sp.tip === 't2' ? 0.3 : 0.45;
    const bodyKind = sp.body;
    const finish = bodyKind === 'alu' ? 'metal' : L.finish, pattern = bodyKind === 'wood' ? 'wood' : L.pattern;
    const base = bodyKind === 'wood' ? NAT_WOOD[0] : L.body, pat = bodyKind === 'wood' ? NAT_WOOD[1] : L.pat;
    const prof = [[bx0, R - 0.03], [bx0 + 0.25, R], [bx1 - 1.2, R], [bx1, R - 0.03]];
    const texL = bx1 - bx0, tex = surfaceTex({ L: texL, C: TAU * R, base, pattern, pat, cheap: o.cheap, texts: [{ text: L.logo, color: L.logoColor, font: L.font, size: 0.3, from: 4.4, to: texL - 0.5 }] });
    const bmat = bodyKind === 'clear' ? matClear(L.body, o.cheap) : matPaint(finish, tex, o.cheap);
    mesh(lathe(prof, { u0: bx0, u1: bx1 }), bmat, g);
    if (bodyKind === 'clear') { mesh(lathe([[bx0 + 0.3, 0.13], [bx1, 0.13]], { n: 16 }), matSolid(0x3a3a3c, 0.4, 0.3), g); }
    // グリップ
    const gp = [[bx1 - 0.02, R - 0.03], [bx1 + 0.3, R + 0.035], [gx1 - 0.6, R + 0.035], [gx1, R - 0.05]];
    if (sp.grip === 'none') mesh(lathe(gp.map(p => [p[0], p[1] - 0.03])), bodyKind === 'clear' ? matClear(L.body, o.cheap) : matPaint(finish, tex, o.cheap), g);
    else if (sp.grip === 'knurl') { const m = matMetal(L.metal, o.cheap); m.normalMap = bumpTex('knurl'); m.normalScale = new THREE.Vector2(1.2, 1.2); m.roughness = 0.32; mesh(lathe(gp), m, g); }
    else mesh(lathe(gp), matRubber(L.grip, sp.grip), g);
    // 先の金具とパイプ・芯
    mesh(lathe([[gx1 - 0.02, R - 0.06], [gx1 + 0.35, R - 0.1], [cx1, 0.11]], { n: 40 }), met, g);
    mesh(lathe([[cx1 - 0.02, 0.055], [cx1 + pipe, 0.05]], { n: 16 }), met, g);
    const ls = { s05: 0.026, s07: 0.035, s03: 0.016, s09: 0.045, s02: 0.011 }[sp.size] || 0.026;
    mesh(lathe([[cx1 + pipe - 0.02, ls], [cx1 + pipe + 0.12, ls]], { n: 10 }), matSolid(0x232325, 0.35, 0.4), g);
    // おしり（ノック）と消しゴム・クリップ
    mesh(lathe([...roundEnd(0.05, 0.3, 0.33, 'start'), [bx0 + 0.05, 0.36]], { n: 40 }), met, g);
    if (sp.erase === 'e1') mesh(lathe([[-0.35, 0.16], [0.06, 0.18]], { n: 20 }), matSolid(0xf2f0ea, 0.9), g);
    addClip(g, bx0 + 0.05, bx0 + 3.6, R, met);
    if (sp.mech === 'k1') { const b = mesh(new THREE.BoxGeometry(0.7, 0.16, 0.22), met, g); b.position.set(bx1 - 1.6, 0, R + 0.06); }
    if (sp.mech === 'k3' || sp.mech === 'k4') { const w = mesh(lathe([[bx1 - 0.55, R + 0.005], [bx1 - 0.35, R + 0.005]]), new THREE.MeshStandardMaterial({ color: 0xf0d060, emissive: 0x3a2a00, roughness: 0.4 }), g); void w; }
    return g;
  },
  ball(d, o) {
    const g = new THREE.Group(), L = d.look, sp = d.spec, met = matMetal(L.metal, o.cheap);
    const multi = sp.colors !== 'c1', R = multi ? 0.55 : 0.43, bx0 = 1.0, bx1 = 9.4, gx1 = 12.4, cx1 = 13.7;
    const finish = sp.body === 'alu' ? 'metal' : sp.body === 'brass' ? 'metal' : L.finish, base = sp.body === 'brass' ? '#c9a24e' : L.body;
    const prof = [[bx0, R - 0.04], [bx0 + 0.3, R], [bx1 - 1.0, R], [bx1, R - 0.04]];
    const texL = bx1 - bx0, tex = surfaceTex({ L: texL, C: TAU * R, base, pattern: L.pattern, pat: L.pat, cheap: o.cheap, texts: [{ text: L.logo, color: L.logoColor, font: L.font, size: 0.32, from: 4.2, to: texL - 0.4 }] });
    const clear = sp.body === 'clear', bmat = clear ? matClear(L.body, o.cheap) : matPaint(finish, tex, o.cheap);
    mesh(lathe(prof, { u0: bx0, u1: bx1 }), bmat, g);
    const inks = multi ? ['#1a1a1a', '#c8261e', '#1f3fa8', '#2a8a3e', '#8a8a8a'].slice(0, { c2: 2, c3: 3, c4: 4, cm: 4 }[sp.colors]) : [L.ink];
    if (clear) inks.forEach((ic, i) => { const r = mesh(lathe([[bx0 + 0.4, 0.07], [gx1 - 0.3, 0.07]], { n: 12 }), matSolid(ic, 0.3), g); r.position.set(0, multi ? Math.sin(i / inks.length * TAU) * 0.2 : 0, multi ? Math.cos(i / inks.length * TAU) * 0.2 : 0); });
    // グリップ
    const gp = [[bx1 - 0.02, R - 0.04], [bx1 + 0.3, R + 0.03], [gx1 - 0.5, R + 0.03], [gx1, R - 0.08]];
    if (sp.grip === 'none') mesh(lathe(gp.map(p => [p[0], p[1] - 0.03])), clear ? matClear(L.body, o.cheap) : matPaint(finish, tex, o.cheap), g);
    else if (sp.grip === 'knurl') { const m = matMetal(L.metal, o.cheap); m.normalMap = bumpTex('knurl'); m.roughness = 0.32; mesh(lathe(gp), m, g); }
    else mesh(lathe(gp), matRubber(L.grip, sp.grip), g);
    // 先：円すいとボール。インクの色の小さな帯
    const tipM = met;
    mesh(lathe([[gx1 - 0.02, R - 0.09], [gx1 + 0.4, R - 0.18], [cx1, 0.07], [cx1 + 0.25, 0.035]], { n: 40 }), tipM, g);
    const ball = mesh(new THREE.SphereGeometry(0.035, 12, 8), matMetal('silver'), g); ball.position.x = cx1 + 0.27;
    if (!multi) mesh(lathe([[gx1 - 0.1, R - 0.07], [gx1 + 0.02, R - 0.075]]), matSolid(L.ink, 0.4), g);
    // おしり：ノック／キャップ／回転、多色のつまみ
    const cm = new THREE.Color(L.clip);
    if (multi) {
      mesh(lathe([...roundEnd(0.1, 0.5, R - 0.02, 'start'), [bx0 + 0.05, R - 0.02]], { n: 40 }), matPaint('gloss', null, o.cheap, new THREE.Color(base)), g);
      inks.forEach((ic, i) => { const a = (i / inks.length) * TAU, t = mesh(new THREE.BoxGeometry(1.1, 0.26, 0.14), matSolid(ic, 0.35), g); t.position.set(1.2, Math.sin(a) * (R + 0.04), Math.cos(a) * (R + 0.04)); t.rotation.x = -a; });
      addClip(g, bx0 + 0.2, bx0 + 3.8, R, new THREE.MeshStandardMaterial({ color: cm, roughness: 0.35 }));
    } else if (sp.act === 'cap') {
      mesh(lathe([...roundEnd(0.4, 0.6, R - 0.05, 'start'), [bx0 + 0.05, R - 0.05]], { n: 40 }), matSolid(L.clip, 0.4), g);
      const cap = new THREE.Group(); g.add(cap);
      mesh(lathe([[gx1 - 3.6, R + 0.05], [gx1 - 3.4, R + 0.09], [cx1 - 0.1, R + 0.09], ...roundEnd(cx1 - 0.1, cx1 + 0.8, R + 0.09, 'end')], { n: 40 }), clear ? matClear(L.clip, o.cheap) : matSolid(L.clip, 0.35), cap);
      addClip(cap, gx1 - 3.4, gx1 - 0.2, R + 0.09, matSolid(L.clip, 0.3));
    } else {
      mesh(lathe([[0.0, 0.0001], [0.0, 0.17], [0.55, 0.18], [bx0 + 0.05, 0.2]], { n: 30 }), sp.act === 'twist' ? matPaint(finish, null, o.cheap, new THREE.Color(base)) : new THREE.MeshStandardMaterial({ color: cm, roughness: 0.35 }), g);
      if (sp.act === 'twist') mesh(lathe([[bx1 - 0.18, R + 0.012], [bx1 + 0.02, R + 0.012]]), met, g);
      addClip(g, bx0 + 0.1, bx0 + 3.6, R, sp.act === 'twist' ? met : new THREE.MeshStandardMaterial({ color: cm, roughness: 0.32 }));
    }
    return g;
  },
  fountain(d, o) {
    const g = new THREE.Group(), L = d.look, sp = d.spec, met = matMetal(L.metal, o.cheap), capless = sp.cap === 'capless';
    const bk = sp.body, wood = bk === 'wood', R = 0.56;
    const finish = bk === 'metal' ? 'metal' : bk === 'urushi' ? 'gloss' : bk === 'ebonite' ? 'matte' : L.finish;
    const base = wood ? NAT_WOOD[0] : L.body, pattern = wood ? 'wood' : L.pattern, pat = wood ? NAT_WOOD[1] : L.pat;
    const bx0 = 0.35, bx1 = capless ? 11.2 : 8.4, texL = bx1 - bx0;
    const tex = surfaceTex({ L: texL, C: TAU * R, base, pattern, pat, cheap: o.cheap, texts: capless ? [{ text: L.logo, color: L.logoColor, font: L.font, size: 0.3, from: 2, to: 7 }] : [] });
    const bmat = matPaint(finish, tex, o.cheap); if (bk === 'urushi' && bmat.isMeshPhysicalMaterial) { bmat.clearcoatRoughness = 0.02; bmat.roughness = 0.2; }
    mesh(lathe([...roundEnd(bx0, bx0 + 0.45, R - 0.06, 'start'), [bx0 + 1.2, R], [bx1 - 0.6, R], [bx1, R - 0.05]], { u0: bx0, u1: bx1 }), bmat, g);
    mesh(lathe([[bx0 - 0.25, 0.0001], [bx0 - 0.25, 0.28], [bx0 + 0.08, 0.32]], { n: 32 }), met, g);   // おしりの金具
    if (sp.fill === 'piston') { mesh(lathe([[bx0 + 1.0, R + 0.012], [bx0 + 1.18, R + 0.012]]), met, g); const wn = mesh(lathe([[bx1 - 1.0, R + 0.004], [bx1 - 0.45, R + 0.004]]), new THREE.MeshStandardMaterial({ color: L.ink, transparent: true, opacity: 0.75, roughness: 0.15 }), g); void wn; }
    // 首（握るところ）とペン先
    const sx0 = bx1, sx1 = bx1 + (capless ? 1.2 : 2.4);
    mesh(lathe([[sx0 - 0.02, R - 0.08], [sx0 + 0.25, R - 0.1], [sx1 - 0.4, R - 0.16], [sx1, R - 0.1]], { n: 40 }), capless ? met : matPaint(bk === 'metal' ? 'gloss' : finish, tex, o.cheap), g);
    mesh(lathe([[sx1 - 0.15, R - 0.11], [sx1 + 0.02, R - 0.11]]), met, g);
    addNib(g, sx1 - 0.25, capless ? 1.3 : 2.6, R - 0.13, L.nibTone, sp, o);
    if (capless) { addClip(g, sx0 - 3.2, sx0 - 0.3, R, met); mesh(lathe([[-0.2, 0.2], [bx0 - 0.2, 0.22]], { n: 24 }), met, g); }
    else {
      mesh(lathe([[bx1 - 0.25, R + 0.012], [bx1 - 0.05, R + 0.012]]), met, g);
      // キャップ：ペンの奥に置く
      const cap = new THREE.Group(); g.add(cap);
      const cL = 6.4, cr = R + 0.08, ctex = surfaceTex({ L: cL, C: TAU * cr, base: L.cap, pattern: wood ? 'none' : pattern, pat, cheap: o.cheap, texts: [{ text: L.logo, color: L.logoColor, font: L.font, size: 0.3, from: 2.2, to: 5.6 }] });
      mesh(lathe([...roundEnd(0, 0.5, cr - 0.08, 'start'), [0.9, cr], [cL - 0.2, cr], [cL, cr - 0.03]], { u0: 0, u1: cL }), matPaint(bk === 'metal' ? 'metal' : finish, ctex, o.cheap), cap);
      mesh(lathe([[cL - 0.75, cr + 0.012], [cL - 0.25, cr + 0.012]]), met, cap);
      mesh(lathe([[-0.18, 0.0001], [-0.18, 0.22], [0.12, 0.3]], { n: 32 }), met, cap);
      addClip(cap, 0.2, 4.6, cr, met);
      cap.position.set(3.2, 0, -1.75); cap.rotation.y = 0.12;
    }
    return g;
  },
};
// 万年筆のペン先：先のとがった板を軸のまわりに少し曲げ、切りわりと穴・彫刻をテクスチャで
function addNib(g, x0, len, r, tone, sp, o) {
  const shape = new THREE.Shape(), w = len * 0.36;
  shape.moveTo(0, -w / 2); shape.bezierCurveTo(len * 0.35, -w * 0.55, len * 0.75, -w * 0.25, len, 0); shape.bezierCurveTo(len * 0.75, w * 0.25, len * 0.35, w * 0.55, 0, w / 2); shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 24), pos = geo.attributes.position;
  // 曲げる：幅の向き（形の y）を円弧に。元の平らな板は x-z 面に置く
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), s = pos.getY(i), a = s / (r * 1.05); pos.setXYZ(i, x0 + x, r * Math.cos(a) - (x / len) * r * 0.55, r * Math.sin(a)); }
  geo.computeVertexNormals();
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - x0) / len, 0.5 + (Math.atan2(pos.getZ(i), pos.getY(i)) * r * 1.05) / w);
  const S = 256, c = newCanvas(S, S), gg = c.getContext('2d'), gold = '#e8bf67', silver = '#dfe2e7';
  gg.fillStyle = tone === 'silver' ? silver : gold; gg.fillRect(0, 0, S, S);
  if (tone === 'two') { gg.fillStyle = silver; gg.beginPath(); gg.ellipse(S * 0.55, S / 2, S * 0.38, S * 0.3, 0, 0, TAU); gg.fill(); }
  gg.strokeStyle = 'rgba(80,60,20,.55)'; gg.lineWidth = 2; for (let k = 0; k < 7; k++) { gg.beginPath(); gg.arc(S * 0.12, S / 2, 20 + k * 9, -0.9, 0.9); gg.stroke(); }
  gg.fillStyle = '#1a1612'; gg.fillRect(S * 0.55, S / 2 - 1.5, S * 0.45, 3); gg.beginPath(); gg.arc(S * 0.55, S / 2, 7, 0, TAU); gg.fill();
  if (sp.nib !== 'steel') { gg.fillStyle = 'rgba(70,50,15,.75)'; gg.font = '700 22px sans-serif'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillText({ k14: '14K', k18: '18K', k21: '21K', soft: '21K' }[sp.nib] || '', S * 0.3, S / 2); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: tex, metalness: 1, roughness: 0.2, side: THREE.DoubleSide });
  mesh(geo, m, g);
  // ペン芯（黒）
  const feed = mesh(lathe([[x0 - 0.05, r * 0.92], [x0 + len * 0.55, r * 0.6], [x0 + len * 0.8, r * 0.25]], { n: 24 }), matSolid(0x141414, 0.6), g); feed.scale.set(1, 0.8, 1); feed.position.y = -0.02;
}
// デザインからモデル（中心を原点に）
function buildProduct(d, o = {}) {
  const g = BUILD[d.kind](d, o), box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3());
  g.children.forEach(ch => ch.position.sub(c));
  const wrap = new THREE.Group(); wrap.add(g); wrap.userData.size = box.getSize(new THREE.Vector3());
  return wrap;
}
function disposeTree(o) { o.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) { const ms = Array.isArray(c.material) ? c.material : [c.material]; for (const m of ms) { for (const k of ['map', 'normalMap']) if (m[k] && !Object.values(_nmaps).includes(m[k])) m[k].dispose(); m.dispose(); } } }); }

// ---------- デザインの見本台（スタジオ）：開発画面の3D ----------
const STUDIO = {
  scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(30, 1, 0.1, 200), obj: null, yaw: -0.5, pitch: 0.42, dist: 30, spin: true, drag: null, zoom: 1,
  init() {
    const s = this.scene; s.environment = ENV;
    const c = newCanvas(4, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#fbf7ef'); gr.addColorStop(1, '#e7dfd0'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const bg = new THREE.CanvasTexture(c); bg.colorSpace = THREE.SRGBColorSpace; s.background = bg;
    const key = new THREE.DirectionalLight(0xfff4e6, 2.2); key.position.set(-8, 18, 10); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 }); key.shadow.radius = 6; key.shadow.bias = -0.0004;
    s.add(key, new THREE.HemisphereLight(0xffffff, 0xd8cdb8, 0.6));
    const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.ShadowMaterial({ opacity: 0.18 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor); this.floor = floor;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(11, 11.3, 0.4, 64), new THREE.MeshStandardMaterial({ color: 0xf6f1e7, roughness: 0.55 })); disc.receiveShadow = true; disc.position.y = -0.2; s.add(disc); this.disc = disc;
    this.root = new THREE.Group(); s.add(this.root);
  },
  set(d) {
    if (this.obj) { this.root.remove(this.obj); disposeTree(this.obj); }
    this.obj = buildProduct(d, { cheap: SET.quality === 'low' });
    const sz = this.obj.userData.size, lift = Math.max(sz.y, sz.z * 0.2) / 2 + 0.05;
    this.obj.position.y = lift + (d.kind === 'eraser' || d.kind === 'lead' ? 0 : 0.1);
    this.obj.traverse(c => { if (c.isMesh) c.castShadow = true; });
    this.root.add(this.obj);
    this.radius = Math.max(sz.x, sz.z) / 2;
    const sc = Math.max(1, this.radius / 9); this.disc.scale.set(sc, 1, sc);
  },
  update(dt) {
    if (this.spin && !this.drag) this.root.rotation.y += dt * 0.35;
    // 見本台の大きさに合わせて、製品の長さがちょうど入る距離（縦横の狭いほうの画角で）
    const vf = this.cam.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * this.cam.aspect), r = this.radius || 8, hh = this.obj ? this.obj.userData.size.y / 2 : 1;
    const fit = Math.max(r / Math.tan(hf), (r * Math.sin(this.pitch) + hh * Math.cos(this.pitch)) / Math.tan(vf)) * 1.15 + 1.2;
    const d = fit / this.zoom, cy = (this.obj ? this.obj.position.y : 1);
    this.cam.position.set(Math.sin(this.yaw) * Math.cos(this.pitch) * d, cy + Math.sin(this.pitch) * d, Math.cos(this.yaw) * Math.cos(this.pitch) * d);
    this.cam.lookAt(0, cy * 0.8, 0);
  },
};
// 製品の小さな写真（一覧のカード用）：見本台で描いて画像に
const THUMB = { cache: new Map(), rt: null, size: 192 };
function productThumb(p) {
  const key = p.id + ':' + (p.thumbKey || ''); if (THUMB.cache.has(key)) return THUMB.cache.get(key);
  const S = THUMB.size; if (!THUMB.rt) THUMB.rt = new THREE.WebGLRenderTarget(S, S, { samples: 4, colorSpace: THREE.SRGBColorSpace });
  const sc = new THREE.Scene(); sc.environment = ENV; sc.background = new THREE.Color(0xf4efe4);
  const l = new THREE.DirectionalLight(0xffffff, 2.2); l.position.set(-5, 10, 8); sc.add(l, new THREE.HemisphereLight(0xffffff, 0xd8cdb8, 0.7));
  const o = buildProduct(p, { cheap: true }); sc.add(o);
  const sz = o.userData.size, r = Math.max(sz.x, sz.y, sz.z) / 2;
  o.rotation.set(0.35, -0.55, p.kind === 'eraser' || p.kind === 'lead' ? 0 : 0.6);
  const long = Math.max(sz.x, sz.y, sz.z) / Math.max(0.01, Math.min(Math.max(sz.y, sz.z), sz.x)) > 4, cam = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
  if (long) o.rotation.set(0.25, -0.35, 0.78);   // 長いものは斜めにして大きく
  cam.position.set(0, 0, r / Math.sin(14 * Math.PI / 180) * (long ? 0.62 : 0.95)); cam.lookAt(0, 0, 0);
  renderer.setRenderTarget(THUMB.rt); renderer.render(sc, cam);
  const px = new Uint8Array(S * S * 4); renderer.readRenderTargetPixels(THUMB.rt, 0, 0, S, S, px); renderer.setRenderTarget(null);
  const c = newCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) img.data.set(px.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
  g.putImageData(img, 0, 0);
  const url = c.toDataURL('image/jpeg', 0.85); THUMB.cache.set(key, url); disposeTree(o);
  return url;
}
