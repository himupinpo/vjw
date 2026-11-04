// =========================================================================================
//  質感：手続き生成（色・法線・粗さ）と、空のHDR・木材の写真
// =========================================================================================
// しっくい壁（「砂の路地」と同じ）
function makePlaster() {
  const S = 512, r = rng(11);
  const H = fbm(S, [4, 8, 16, 32, 64, 128, 256], [.5, .35, .25, .16, .1, .07, .05], r);
  const ST = fbm(S, [2, 4, 8], [.6, .3, .15], r);
  const spk = new Float32Array(S * S); for (let i = 0; i < spk.length; i++) spk[i] = r() < .006 ? .65 + r() * .2 : 1;
  const col = canvasOf(S, i => { const v = .8 + .3 * H[i], s = smooth(.55, .85, ST[i]); const k = v * spk[i] * (1 - .16 * s); return [182 * k * (1 + .03 * s), 172 * k, 156 * k * (1 - .05 * s)]; });
  const rough = canvasOf(S, i => { const g = 205 + 45 * H[i]; return [g, g, g]; });
  return { map: tex(col, true), normalMap: tex(normalCanvas(H, S, 5), false), roughnessMap: tex(rough, false) };
}
// 砂の地面（「砂の路地」と同じ）
function makeSand() {
  const S = 512, r = rng(23);
  const H = fbm(S, [8, 16, 32, 64, 128, 256], [.4, .3, .22, .15, .1, .08], r);
  const P = new Float32Array(S * S), dark = new Float32Array(S * S).fill(1);
  for (let n = 0; n < 420; n++) {
    const cx = r() * S, cy = r() * S, rad = 1 + r() * 3.2, tone = r() < .6 ? .62 + r() * .2 : 1.1;
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
      const d = Math.hypot(x, y) / rad; if (d > 1) continue;
      const idx = (((Math.floor(cy) + y) + S) % S) * S + (((Math.floor(cx) + x) + S) % S);
      P[idx] = Math.max(P[idx], Math.sqrt(1 - d * d)); dark[idx] = tone;
    }
  }
  const Hn = new Float32Array(S * S); for (let i = 0; i < Hn.length; i++) Hn[i] = H[i] * .7 + P[i] * .8 + r() * .08;
  const col = canvasOf(S, i => { const k = (.82 + .26 * H[i] + (r() - .5) * .1) * dark[i]; return [196 * k, 170 * k, 128 * k]; });
  const rough = canvasOf(S, i => { const g = 235 - 30 * P[i]; return [g, g, g]; });
  return { map: tex(col, true), normalMap: tex(normalCanvas(Hn, S, 4), false), roughnessMap: tex(rough, false) };
}
// アスファルト：細かい骨材の粒と、ところどころのひび
function makeAsphalt() {
  const S = 512, r = rng(31), H = fbm(S, [8, 32, 64, 128, 256], [.3, .25, .2, .15, .2], r), B = fbm(S, [2, 4, 8], [.5, .3, .2], r);
  const crack = new Float32Array(S * S);
  for (let n = 0; n < 9; n++) { let x = r() * S, y = r() * S, a = r() * TAU; for (let k = 0; k < 160; k++) { a += (r() - .5) * .8; x += Math.cos(a); y += Math.sin(a); const i = (((y | 0) + S) % S) * S + (((x | 0) + S) % S); crack[i] = 1; } }
  const col = canvasOf(S, i => { const g = (.42 + .24 * H[i] + .1 * B[i] + (r() - .5) * .09) * (1 - .45 * crack[i]); return [92 * g + 8, 90 * g + 8, 86 * g + 8]; });
  const Hn = new Float32Array(S * S); for (let i = 0; i < Hn.length; i++) Hn[i] = H[i] * .6 + r() * .25 - crack[i] * .7;
  const rough = canvasOf(S, i => { const g = 215 + 30 * H[i]; return [g, g, g]; });
  return { map: tex(col, true), normalMap: tex(normalCanvas(Hn, S, 3), false), roughnessMap: tex(rough, false) };
}
// 歩道の敷石：互い違いの砂岩の板と目地
function makePavers() {
  const S = 512, r = rng(41), N = fbm(S, [8, 16, 64, 128], [.4, .3, .2, .1], r), H = new Float32Array(S * S), tone = [];
  const rows = 4, rh = S / rows;
  for (let i = 0; i < 64; i++) tone.push(.86 + r() * .22);
  const col = canvasOf(S, i => {
    const x = i % S, y = (i / S) | 0, row = (y / rh) | 0, off = row % 2 ? S / 4 : 0, cw = S / 2, cx = (((x + off) % S) / cw) | 0;
    const gx = ((x + off) % cw), gy = y % rh, edge = Math.min(gx, cw - gx, gy, rh - gy);
    const grout = edge < 3 ? 1 : 0, bev = smooth(0, 7, edge);
    H[i] = grout ? 0 : .35 + .5 * bev + N[i] * .15;
    const t = tone[(row * 8 + cx) % 64] * (.9 + .16 * N[i]) * (grout ? .62 : 1);
    return [205 * t, 186 * t, 152 * t];
  });
  const rough = canvasOf(S, i => { const g = 200 + 40 * N[i]; return [g, g, g]; });
  return { map: tex(col, true), normalMap: tex(normalCanvas(H, S, 6), false), roughnessMap: tex(rough, false) };
}
// 砂岩のブロック（塔・縁石・噴水）
function makeStone() {
  const S = 512, r = rng(53), N = fbm(S, [4, 16, 64, 256], [.4, .3, .2, .15], r), H = new Float32Array(S * S), tone = [];
  for (let i = 0; i < 64; i++) tone.push(.85 + r() * .25);
  const rows = 6, rh = S / rows;
  const col = canvasOf(S, i => {
    const x = i % S, y = (i / S) | 0, row = (y / rh) | 0, cw = S / 3, off = row % 2 ? cw / 2 : 0, cx = (((x + off) % S) / cw) | 0;
    const gx = (x + off) % cw, gy = y % rh, edge = Math.min(gx, cw - gx, gy, rh - gy), joint = edge < 2.5;
    H[i] = joint ? 0 : .3 + .55 * smooth(0, 9, edge) + N[i] * .25;
    const t = tone[(row * 5 + cx) % 64] * (.86 + .22 * N[i]) * (joint ? .7 : 1);
    return [214 * t, 188 * t, 146 * t];
  });
  const rough = canvasOf(S, i => { const g = 210 + 40 * N[i]; return [g, g, g]; });
  return { map: tex(col, true), normalMap: tex(normalCanvas(H, S, 5), false), roughnessMap: tex(rough, false) };
}
// 山の岩肌：ごつごつした起伏と細いひび（石畳ではない自然の岩）
function makeRock() {
  const S = 512, r = rng(71), N = fbm(S, [4, 8, 16, 32, 64, 128], [.35, .25, .18, .12, .08, .05], r), M = fbm(S, [6, 24, 96], [.5, .3, .2], r), H = new Float32Array(S * S);
  const col = canvasOf(S, i => {
    const rid = 1 - Math.abs(2 * N[i] - 1), crack = smooth(0.93, 0.99, rid);
    H[i] = N[i] * 0.8 + M[i] * 0.3 - crack * 0.3;
    const t = (0.74 + 0.4 * M[i]) * (1 - crack * 0.45) * (0.9 + 0.2 * N[i]);
    return [176 * t, 146 * t, 118 * t];
  });
  const rough = canvasOf(S, i => { const g = 205 + 45 * M[i]; return [g, g, g]; });
  return { map: tex(col, true), normalMap: tex(normalCanvas(H, S, 9), false), roughnessMap: tex(rough, false) };
}
// 布（屋台と商店のひさし）：織り目。色は頂点色で
function makeFabric() {
  const S = 256, r = rng(61), N = fbm(S, [16, 64], [.5, .5], r), H = new Float32Array(S * S);
  const col = canvasOf(S, i => { const x = i % S, y = (i / S) | 0; const w = (Math.sin(x * Math.PI / 2) * Math.sin(y * Math.PI / 2)) * .5 + .5; H[i] = w * .6 + N[i] * .4; const stripe = ((x / 32) | 0) % 2 ? 1 : .78; const k = (.85 + .15 * w) * stripe; return [240 * k, 236 * k, 226 * k]; });
  return { map: tex(col, true), normalMap: tex(normalCanvas(H, S, 2), false) };
}
// ヤシの葉（透明部分は切り抜き）
function makeFrond() {
  const W = 128, Hh = 512, c = newCanvas(W, Hh), g = c.getContext('2d');
  g.clearRect(0, 0, W, Hh);
  g.strokeStyle = '#6f6a2a'; g.lineWidth = 5; g.beginPath(); g.moveTo(W / 2, Hh); g.lineTo(W / 2, 8); g.stroke();
  for (let y = 20; y < Hh - 10; y += 7) {
    const k = 1 - y / Hh, L = 10 + 52 * Math.sin(Math.min(1, (Hh - y) / Hh * 1.15) * Math.PI) * (.75 + .25 * Math.random());
    const gcol = `rgb(${70 + 40 * k | 0},${102 + 40 * k | 0},${38 + 14 * k | 0})`;
    g.strokeStyle = gcol; g.lineWidth = 4.2;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(W / 2, y); g.quadraticCurveTo(W / 2 + s * L * .5, y - 10, W / 2 + s * L, y - 22 - L * .2); g.stroke(); }
  }
  const t = tex(c, true, false); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// 波の法線（海）
function makeWaves() {
  const S = 256, r = rng(71), H = fbm(S, [4, 8, 16, 32, 64], [.35, .3, .2, .1, .05], r);
  return tex(normalCanvas(H, S, 7), false);
}
// 高層ビルのガラス：パネルと方立て、階ごとのスパンドレル
function makeTowerGlass() {
  const S = 512, r = rng(83), N = fbm(S, [4, 8], [.6, .4], r);
  const cols = 4, rows = 4, pw = S / cols, ph = S / rows, tones = [];
  for (let i = 0; i < 16; i++) tones.push(.8 + r() * .4);
  const col = canvasOf(S, i => {
    const x = i % S, y = (i / S) | 0, cx = (x / pw) | 0, cy = (y / ph) | 0, gx = x % pw, gy = y % ph;
    const mull = gx < 5 || gx > pw - 5 || gy < 5, span = gy > ph - 30;
    if (mull) return [178, 176, 170];
    if (span) return [58, 66, 70];
    const t = tones[cy * 4 + cx] * (.9 + .2 * N[i]); return [42 * t, 74 * t, 86 * t];
  });
  const rough = canvasOf(S, i => { const x = i % S, y = (i / S) | 0, gx = x % pw, gy = y % ph; const v = gx < 5 || gx > pw - 5 || gy < 5 ? 110 : gy > ph - 30 ? 150 : 14; return [v, v, v]; });
  return { map: tex(col, true), roughnessMap: tex(rough, false) };
}
// 外壁の窓・扉のアトラス（4×4マス。1マス＝幅3.2m×高さ3.1mの1区画）
// 色（透明部分はしっくいが見える）・高さ（→法線）・粗さを同じ形で描く
const ATL = { N: 4, cells: { plain: 0, glass: 1, shutG: 2, shutB: 3, openSh: 4, bars: 5, ac: 6, lattice: 7, door: 8, rolling: 9, shop: 10, balcony: 11, small: 12, vent: 13, band: 14, arch: 15 } };
function makeAtlas() {
  const S = 1024, C = S / 4, col = newCanvas(S, S), hgt = newCanvas(S, S), rgh = newCanvas(S, S);
  const gc = col.getContext('2d'), gh = hgt.getContext('2d'), gr = rgh.getContext('2d');
  gh.fillStyle = '#000'; gh.fillRect(0, 0, S, S); gr.fillStyle = '#d8d8d8'; gr.fillRect(0, 0, S, S);
  const r = rng(97);
  // 1マスに描く。L(色,高さ,粗さ)ごとに同じ図形を3枚へ
  const rect = (cx, cy, x, y, w, h, color, height, rough) => {
    const X = cx * C + x, Y = cy * C + y;
    if (color) { gc.fillStyle = color; gc.fillRect(X, Y, w, h); }
    if (height != null) { const v = height * 255 | 0; gh.fillStyle = `rgb(${v},${v},${v})`; gh.fillRect(X, Y, w, h); }
    if (rough != null) { const v = rough * 255 | 0; gr.fillStyle = `rgb(${v},${v},${v})`; gr.fillRect(X, Y, w, h); }
  };
  const archPath = (g, X, Y, w, h) => { g.beginPath(); g.moveTo(X, Y + h); g.lineTo(X, Y + w / 2); g.arc(X + w / 2, Y + w / 2, w / 2, Math.PI, 0); g.lineTo(X + w, Y + h); g.closePath(); };
  const arch = (cx, cy, x, y, w, h, color, height, rough) => {
    const X = cx * C + x, Y = cy * C + y;
    if (color) { gc.fillStyle = color; archPath(gc, X, Y, w, h); gc.fill(); }
    if (height != null) { const v = height * 255 | 0; gh.fillStyle = `rgb(${v},${v},${v})`; archPath(gh, X, Y, w, h); gh.fill(); }
    if (rough != null) { const v = rough * 255 | 0; gr.fillStyle = `rgb(${v},${v},${v})`; archPath(gr, X, Y, w, h); gr.fill(); }
  };
  const TR = '#ece2cf', TRd = '#d5c8b0';     // 窓枠・まぐさのしっくい（少し明るい）
  // 窓の枠＋台（共通）
  const frame = (cx, cy, x, y, w, h) => {
    rect(cx, cy, x - 12, y - 14, w + 24, 14, TR, .75, .8);      // まぐさ
    rect(cx, cy, x - 12, y, 12, h, TR, .7, .8); rect(cx, cy, x + w, y, 12, h, TR, .7, .8);
    rect(cx, cy, x - 20, y + h, w + 40, 12, TRd, .95, .8);      // 窓台
    rect(cx, cy, x - 16, y + h + 12, w + 32, 4, '#8f846f', .55, .9);   // 台の影
  };
  const glass = (cx, cy, x, y, w, h) => {
    rect(cx, cy, x, y, w, h, '#1c2226', .12, .06);
    gc.fillStyle = 'rgba(160,190,210,.18)'; gc.fillRect(cx * C + x + 4, cy * C + y + 4, w * .45, h * .5);   // 映りこみの明るみ
    rect(cx, cy, x + w / 2 - 3, y, 6, h, '#d9d2c2', .4, .5); rect(cx, cy, x, y + h * .42, w, 5, '#d9d2c2', .4, .5);   // 桟
  };
  const louvers = (cx, cy, x, y, w, h, wood) => {
    rect(cx, cy, x, y, w, h, wood, .4, .75);
    for (let yy = 6; yy < h - 4; yy += 9) { rect(cx, cy, x + 3, y + yy, w - 6, 3, 'rgba(0,0,0,.28)', .25, null); rect(cx, cy, x + 3, y + yy + 3, w - 6, 2, 'rgba(255,255,255,.14)', .5, null); }
    rect(cx, cy, x + w / 2 - 1, y, 2, h, 'rgba(0,0,0,.35)', .2, null);
  };
  const cell = i => [i % 4, (i / 4) | 0];
  const WX = 73, WY = 62, WW = 110, WH = 136;
  // 1 ガラス窓
  { const [a, b] = cell(1); frame(a, b, WX, WY, WW, WH); glass(a, b, WX, WY, WW, WH); }
  // 2 閉じた鎧戸（緑）, 3 閉じた鎧戸（青灰）
  { const [a, b] = cell(2); frame(a, b, WX, WY, WW, WH); louvers(a, b, WX, WY, WW, WH, '#4e6b4a'); }
  { const [a, b] = cell(3); frame(a, b, WX, WY, WW, WH); louvers(a, b, WX, WY, WW, WH, '#4f6470'); }
  // 4 開いた鎧戸
  { const [a, b] = cell(4); frame(a, b, WX, WY, WW, WH); rect(a, b, WX, WY, WW, WH, '#121212', .05, .95); louvers(a, b, WX - 70, WY, 56, WH, '#6b5a3c'); louvers(a, b, WX + WW + 14, WY, 56, WH, '#6b5a3c'); }
  // 5 鉄格子
  { const [a, b] = cell(5); frame(a, b, WX, WY, WW, WH); glass(a, b, WX, WY, WW, WH); for (let x = 6; x < WW; x += 13) rect(a, b, WX + x, WY - 4, 4, WH + 6, '#2a2724', .95, .6); for (const y of [30, 100]) rect(a, b, WX - 3, WY + y, WW + 6, 4, '#2a2724', .95, .6); }
  // 6 ガラス窓＋室外機
  { const [a, b] = cell(6); frame(a, b, WX, WY - 18, WW, WH - 30); glass(a, b, WX, WY - 18, WW, WH - 30); const X = 150, Y = 196; rect(a, b, X, Y, 82, 52, '#cfcbc2', .9, .55); for (let i = 0; i < 6; i++) rect(a, b, X + 8, Y + 8 + i * 7, 46, 3, '#8d8a84', .7, null); gc.fillStyle = '#5a5853'; gc.beginPath(); gc.arc(a * C + X + 64, b * C + Y + 26, 15, 0, TAU); gc.fill(); }
  // 7 アーチ窓と木の格子（マシュラビーヤ）
  { const [a, b] = cell(7); const X = 66, Y = 40, W = 124, H = 170;
    arch(a, b, X - 12, Y - 12, W + 24, H + 12, TR, .7, .8); arch(a, b, X, Y, W, H, '#6a4a2e', .45, .7);
    for (let x = 0; x < W; x += 12) for (let y = 0; y < H; y += 12) { if (y < W / 2 && Math.hypot(x + 6 - W / 2, y + 6 - W / 2) > W / 2 - 4) continue; rect(a, b, X + x + 3, Y + y + 3, 6, 6, '#120d0a', .2, null); }
    rect(a, b, X - 20, Y + H, W + 40, 12, TRd, .95, .8); }
  // 8 木の扉（アーチの上部）
  { const [a, b] = cell(8); const X = 70, Y = 40, W = 116, H = 216;
    arch(a, b, X - 14, Y - 14, W + 28, H + 14, TR, .7, .8); arch(a, b, X, Y, W, H, '#5d3f27', .45, .7);
    for (const xx of [8, W / 2 + 4]) { rect(a, b, X + xx, Y + 70, W / 2 - 12, 60, '#4b321e', .38, null); rect(a, b, X + xx, Y + 142, W / 2 - 12, 60, '#4b321e', .38, null); }
    rect(a, b, X + W / 2 - 2, Y + 50, 4, H - 50, '#2e1f12', .3, null); gc.fillStyle = '#b8954e'; gc.beginPath(); gc.arc(a * C + X + W / 2 + 12, b * C + Y + 130, 4, 0, TAU); gc.fill(); }
  // 9 店のシャッター
  { const [a, b] = cell(9); const X = 18, Y = 64, W = 220, H = 192; rect(a, b, X - 8, Y - 16, W + 16, 16, '#4a4640', .8, .6); rect(a, b, X, Y, W, H, '#8e8b84', .5, .5); for (let y = 0; y < H; y += 8) { rect(a, b, X, Y + y, W, 2, '#5f5c56', .35, null); rect(a, b, X, Y + y + 2, W, 1, '#b3afa6', .6, null); } for (let i = 0; i < 4; i++) gc.fillStyle = 'rgba(40,60,30,.3)', gc.fillRect(a * C + X + 20 + r() * 160, b * C + Y + 100 + r() * 60, 30 + r() * 30, 8); }
  // 10 店のガラス（中は暗く、棚の明かり）
  { const [a, b] = cell(10); const X = 18, Y = 64, W = 220, H = 192; rect(a, b, X - 8, Y - 16, W + 16, 16, '#3a3632', .8, .5); rect(a, b, X, Y, W, H, '#20201c', .12, .05);
    for (let i = 0; i < 3; i++) { rect(a, b, X + 12, Y + 40 + i * 46, W - 24, 6, '#6b5c45', .2, null); for (let k = 0; k < 9; k++) rect(a, b, X + 16 + k * 22, Y + 22 + i * 46, 14, 18, ['#b84a3a', '#d8b04a', '#3f7aa8', '#e8e0d0', '#5f9a4a'][(k + i) % 5], .2, null); }
    gc.fillStyle = 'rgba(255,230,180,.08)'; gc.fillRect(a * C + X, b * C + Y, W, H); rect(a, b, X + W / 2 - 3, Y, 6, H, '#4a4640', .5, .4); }
  // 11 バルコニーの掃き出し窓
  { const [a, b] = cell(11); const X = 80, Y = 30, W = 96, H = 196; rect(a, b, X - 12, Y - 14, W + 24, 14, TR, .75, .8); rect(a, b, X - 12, Y, 12, H, TR, .7, .8); rect(a, b, X + W, Y, 12, H, TR, .7, .8); glass(a, b, X, Y, W, H); }
  // 12 小さな窓ふたつ
  { const [a, b] = cell(12); for (const x of [44, 150]) { frame(a, b, x, 86, 62, 72); glass(a, b, x, 86, 62, 72); } }
  // 13 換気口と雨どい
  { const [a, b] = cell(13); rect(a, b, 96, 92, 56, 56, '#6f6a60', .7, .6); for (let i = 0; i < 6; i++) rect(a, b, 100, 98 + i * 8, 48, 3, '#3a3631', .4, null); rect(a, b, 228, 0, 14, C, '#7b766d', .9, .5); }
  // 14 横長の窓（新しめの建物）
  { const [a, b] = cell(14); rect(a, b, 6, 70, C - 12, 12, TR, .75, .7); rect(a, b, 6, 82, C - 12, 104, '#222a2e', .12, .06); for (let x = 6; x < C - 6; x += 61) rect(a, b, x, 82, 6, 104, '#cfc9bb', .5, .4); rect(a, b, 0, 186, C, 14, TRd, .9, .8); gc.fillStyle = 'rgba(170,200,220,.14)'; gc.fillRect(a * C + 10, b * C + 86, 90, 50); }
  // 15 大きなアーチの入口（店・ホテル）
  { const [a, b] = cell(15); const X = 34, Y = 30, W = 188, H = 226; arch(a, b, X - 14, Y - 14, W + 28, H + 14, TR, .75, .8); arch(a, b, X, Y, W, H, '#1d1b18', .1, .2); gc.fillStyle = 'rgba(255,214,150,.16)'; archPath(gc, a * C + X + 10, b * C + Y + 10, W - 20, H - 10); gc.fill(); }
  // マスの境目のにじみ止め：外周4pxは透明のまま（色の絵にだけ効く）
  const H = new Float32Array(S * S), hd = gh.getImageData(0, 0, S, S).data;
  for (let i = 0; i < S * S; i++) H[i] = hd[i * 4] / 255;
  const ntex = tex(normalCanvas(H, S, 7), false, false);
  const ctex = tex(col, true, false), rtex = tex(rgh, false, false);
  for (const t of [ntex, ctex, rtex]) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
  return { map: ctex, normal: ntex, rough: rtex };
}
// 看板（アラビア語の店名と日本語の小さな説明）
function makeSign(main, sub, bg = '#1f3d4a', fg = '#f2e6c8', w = 512, h = 128) {
  const c = newCanvas(w, h), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${h * .42}px "Geeza Pro", "Noto Naskh Arabic", "Arial", sans-serif`; g.fillText(main, w / 2, h * (sub ? .4 : .52));
  if (sub) { g.font = `600 ${h * .2}px "Chakra Petch", "Hiragino Sans", sans-serif`; g.fillText(sub, w / 2, h * .78); }
  const t = tex(c, true, false); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// 空：上半分＝色、下半分＝明るさの指数（「砂の路地」の素材をそのまま使う）
async function loadSky(url) {
  const blob = await (await fetch(url)).blob();
  let bmp;
  try { bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }); }
  catch (e) { bmp = await createImageBitmap(blob); }
  const W = bmp.width, H2 = bmp.height, H = H2 / 2;
  const c = document.createElement('canvas'); c.width = W; c.height = H2;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bmp, 0, 0);
  const px = g.getImageData(0, 0, W, H2).data;
  const out = new Uint16Array(W * H * 4), toH = THREE.DataUtils.toHalfFloat;
  for (let i = 0; i < W * H; i++) {
    const e = px[(i + W * H) * 4], f = e ? Math.pow(2, e - 136) : 0;
    for (let k = 0; k < 3; k++) out[i * 4 + k] = toH(Math.min(60000, (px[i * 4 + k] + 0.5) * f));
    out[i * 4 + 3] = toH(1);
  }
  const t = new THREE.DataTexture(out, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  t.colorSpace = THREE.LinearSRGBColorSpace; t.magFilter = t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false; t.flipY = true; t.needsUpdate = true;
  return t;
}
// 空が読めないとき（ファイルなしで開いたなど）の代わり：夕方前の砂漠の空のグラデーション
function fallbackSky() {
  const W = 512, H = 256, c = newCanvas(W, H), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#2f63a8'); gr.addColorStop(.42, '#9cc0dc'); gr.addColorStop(.5, '#efd9b4'); gr.addColorStop(.52, '#c8a678'); gr.addColorStop(1, '#8a6a45');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping; return t;
}
const ASSET_BASE = (() => { try { return new URL('assets/', document.baseURI).href; } catch (e) { return 'assets/'; } })();
const TEX = {};
const MAT = {};
async function loadAll(say) {
  say('質感を生成しています…'); await nextFrame();
  TEX.plaster = makePlaster(); await nextFrame();
  TEX.sand = makeSand(); await nextFrame();
  TEX.asphalt = makeAsphalt(); TEX.pavers = makePavers(); await nextFrame();
  TEX.stone = makeStone(); TEX.rock = makeRock(); TEX.fabric = makeFabric(); TEX.frond = makeFrond(); TEX.waves = makeWaves(); TEX.glass = makeTowerGlass(); await nextFrame();
  say('窓と扉を描いています…'); await nextFrame();
  TEX.atlas = makeAtlas(); await nextFrame();
  say('空と木材を読み込んでいます…'); await nextFrame();
  const tl = new THREE.TextureLoader();
  try {
    const [hdr, wd, wb, wr] = await Promise.all([
      loadSky(ASSET_BASE + 'sky_rgbe.png'),
      tl.loadAsync(ASSET_BASE + 'hardwood2_diffuse.jpg'), tl.loadAsync(ASSET_BASE + 'hardwood2_bump.jpg'), tl.loadAsync(ASSET_BASE + 'hardwood2_roughness.jpg'),
    ]);
    [wd, wb, wr].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso; });
    wd.colorSpace = THREE.SRGBColorSpace;
    TEX.hdr = hdr; TEX.wood = { map: wd, bumpMap: wb, roughnessMap: wr };
  } catch (e) {
    console.warn('sky / wood not found, using fallbacks', e);
    TEX.hdr = fallbackSky(); TEX.wood = { map: TEX.pavers.map };
  }
  // 車のモデル（Quaternius「Cars Pack」CC0）：このページの最後に埋めこんであるデータを読む。なければ前の作り方の車
  say('車を準備しています…'); await nextFrame();
  try {
    const j = $('carsjson'), b = $('carsbin');
    if (j && b) {
      const s = atob(b.textContent.trim()), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
      CAR_DATA.models = JSON.parse(j.textContent).models; CAR_DATA.bin = u.buffer; prepareCarTypes();
    }
  } catch (e) { console.warn('car models unavailable, using the built-in cars', e); CAR_DATA.models = null; }
  // 人のモデル（Quaternius「Ultimate Modular Men / Women」CC0）：同じく埋めこみ。なければ前の作り方の人
  say('人を準備しています…'); await nextFrame();
  try {
    const j = $('humansjson'), b = $('humansbin');
    if (j && b) {
      const s = atob(b.textContent.trim()), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
      const json = JSON.parse(j.textContent); HUMAN_DATA.bin = u.buffer; buildHumanClips(json); HUMAN_DATA.chars = json.chars;
    }
  } catch (e) { console.warn('human models unavailable, using the built-in people', e); HUMAN_DATA.chars = null; }
  makeMaterials();
}
// 地面（街の外）：砂と岩肌を頂点ごとの重み rk でまぜる（急な斜面・山の上が岩）
function terrainMaterial() {
  const A = TEX.sand, R = TEX.rock;
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, map: A.map, normalMap: A.normalMap, roughnessMap: A.roughnessMap });
  m.onBeforeCompile = sh => {
    sh.uniforms.rockMap = { value: R.map }; sh.uniforms.rockNorm = { value: R.normalMap }; sh.uniforms.rockRough = { value: R.roughnessMap };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float rk;\nvarying float vRk;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvRk = rk;');
    const nfm = THREE.ShaderChunk.normal_fragment_maps.replace('normal = normalize( tbn * mapN );',
      'vec3 rN = texture2D( rockNorm, vRUv ).xyz * 2.0 - 1.0; mapN = normalize( mix( mapN, rN, vRk ) ); normal = normalize( tbn * mapN );');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D rockMap;\nuniform sampler2D rockNorm;\nuniform sampler2D rockRough;\nvarying float vRk;')
      .replace('#include <map_fragment>', '#include <map_fragment>\nvec2 vRUv = vMapUv * 0.27;\nvec4 rC = texture2D( rockMap, vRUv ) * mix( 1.0, texture2D( rockMap, vRUv * 0.13 + 0.31 ).r * 1.6, 0.5 );\ndiffuseColor.rgb = mix( diffuseColor.rgb, rC.rgb, vRk );')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, texture2D( rockRough, vRUv ).g, vRk );')
      .replace('#include <normal_fragment_maps>', nfm);
  };
  m.customProgramCacheKey = () => 'terrain';
  return m;
}
// 外壁：しっくいの上に、窓のアトラスを2つめのUV（auv）で重ねる。透明な所はしっくい
function facadeMaterial() {
  const P = TEX.plaster, A = TEX.atlas;
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, map: P.map, normalMap: P.normalMap, roughnessMap: P.roughnessMap, normalScale: new THREE.Vector2(1.2, 1.2) });
  m.onBeforeCompile = sh => {
    sh.uniforms.atlasMap = { value: A.map }; sh.uniforms.atlasNorm = { value: A.normal }; sh.uniforms.atlasRough = { value: A.rough };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 auv;\nvarying vec2 vAuv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvAuv = auv;');
    const nfm = THREE.ShaderChunk.normal_fragment_maps.replace('normal = normalize( tbn * mapN );',
      'vec3 aN = texture2D( atlasNorm, vAuv ).xyz * 2.0 - 1.0; mapN = normalize( mix( mapN, aN, atC.a ) ); normal = normalize( tbn * mapN );');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D atlasMap;\nuniform sampler2D atlasNorm;\nuniform sampler2D atlasRough;\nvarying vec2 vAuv;')
      .replace('#include <map_fragment>', '#include <map_fragment>\nvec4 atC = texture2D( atlasMap, vAuv );\ndiffuseColor.rgb = mix( diffuseColor.rgb, atC.rgb, atC.a );')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, texture2D( atlasRough, vAuv ).r, atC.a );')
      .replace('#include <normal_fragment_maps>', nfm);
  };
  m.customProgramCacheKey = () => 'facade';
  return m;
}
function makeMaterials() {
  const std = p => new THREE.MeshStandardMaterial({ vertexColors: true, ...p });
  const P = TEX.plaster, S = TEX.stone;
  Object.assign(MAT, {
    facade: facadeMaterial(),
    plaster: std({ map: P.map, normalMap: P.normalMap, roughnessMap: P.roughnessMap, normalScale: new THREE.Vector2(1.2, 1.2) }),
    stone: std({ map: S.map, normalMap: S.normalMap, roughnessMap: S.roughnessMap }),
    wood: std({ map: TEX.wood.map, bumpMap: TEX.wood.bumpMap, bumpScale: 2, roughnessMap: TEX.wood.roughnessMap, roughness: 1 }),
    metal: std({ color: 0x5a5650, roughness: 0.5, metalness: 0.7 }),
    dark: std({ color: 0x151412, roughness: 0.9 }),
    glassWin: std({ color: 0x222a2e, roughness: 0.06, metalness: 0.2 }),
    ac: std({ color: 0xcfcbc2, roughness: 0.55, metalness: 0.25 }),
    cable: std({ color: 0x161616, roughness: 0.7 }),
    plant: std({ color: 0x6d6a3c, roughness: 0.95, flatShading: true }),
    fabric: std({ map: TEX.fabric.map, normalMap: TEX.fabric.normalMap, roughness: 0.9, side: THREE.DoubleSide }),
    tile: std({ color: 0x2f8f9a, roughness: 0.25, metalness: 0.1 }),
    gold: std({ color: 0xd8b25a, roughness: 0.3, metalness: 1 }),
    tower: std({ map: TEX.glass.map, roughnessMap: TEX.glass.roughnessMap, metalness: 0.85, roughness: 1, envMapIntensity: 1.25 }),
    asphalt: std({ map: TEX.asphalt.map, normalMap: TEX.asphalt.normalMap, roughnessMap: TEX.asphalt.roughnessMap }),
    pavers: std({ map: TEX.pavers.map, normalMap: TEX.pavers.normalMap, roughnessMap: TEX.pavers.roughnessMap }),
    sand: std({ map: TEX.sand.map, normalMap: TEX.sand.normalMap, roughnessMap: TEX.sand.roughnessMap }),
    terrain: terrainMaterial(),
    paint: std({ color: 0xeee8da, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    bark: std({ map: P.map, normalMap: P.normalMap, color: 0x8a7558, roughness: 1 }),
    frond: new THREE.MeshStandardMaterial({ map: TEX.frond, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75, vertexColors: true }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd9a0, emissiveIntensity: 0.6, roughness: 0.4 }),
    water: new THREE.MeshStandardMaterial({ color: 0x1b4b55, roughness: 0.05, metalness: 0.15, normalMap: TEX.waves, normalScale: new THREE.Vector2(0.45, 0.45) }),
  });
  for (const k of ['asphalt', 'pavers', 'sand']) MAT[k].polygonOffset = false;
}
