// =========================================================================================
//  シャーペンの設計：部品ごとの素材・太さ・長さ・断面・グリップの加工・クリップと硬度表示窓の位置・おもり
//  形と素材の密度から重さと重心（先からの距離）を計算し、書きやすさ・機能・高級感・層ごとの人気を決める
//  （数字は実際の製図用・学習用・木軸・金属軸のシャーペンの重さ 9〜23g、重心 全長の43〜52% を目安に合わせた）
// =========================================================================================
const MECH_MATS = {
  none:     { name: 'なし', dens: 0, cost: 0, lux: 0 },
  resin:    { name: '樹脂', dens: 1.15, wall: 1.4, cost: 3, lux: 0 },
  clear:    { name: '透明樹脂', dens: 1.2, wall: 1.4, cost: 4, lux: 0.05, clear: 1 },
  rubber:   { name: 'ラバー', dens: 1.25, wall: 1.3, cost: 8, lux: 0.05, soft: 1, req: 'r_g1' },
  silicone: { name: 'シリコン', dens: 1.15, wall: 1.7, cost: 12, lux: 0.05, soft: 2, req: 'r_g2' },
  alu:      { name: 'アルミ', dens: 2.7, wall: 0.9, cost: 25, lux: 0.5, metal: 1, req: 'r_al' },
  brass:    { name: '真ちゅう', dens: 8.5, wall: 0.7, cost: 45, lux: 0.9, metal: 1, req: 'r_brass' },
  sus:      { name: 'ステンレス', dens: 7.9, wall: 0.7, cost: 40, lux: 0.8, metal: 1, req: 'r_sus' },
  wood:     { name: '天然木', dens: 0.7, solid: 1, cost: 35, lux: 0.85, wood: 1, req: 'r_wood' },
  wood2:    { name: '強化木（積層）', dens: 1.3, solid: 1, cost: 55, lux: 1, wood: 1, req: 'r_wood2' },
};
// 部品：使える素材（free は研究なしで使える）。重さの計算と原価の重み
const MECH_PARTS = {
  tip:    { name: '口金（先の金具）', mats: ['resin', 'alu', 'brass', 'sus'], free: ['resin', 'alu'], cw: 0.4, lw: 0.15 },
  grip:   { name: 'グリップ', mats: ['resin', 'rubber', 'silicone', 'alu', 'brass', 'sus', 'wood', 'wood2'], cw: 0.6, lw: 0.3 },
  barrel: { name: '胴軸', mats: ['resin', 'clear', 'alu', 'brass', 'wood', 'wood2'], cw: 1, lw: 0.45 },
  knock:  { name: 'ノック（天冠）', mats: ['resin', 'alu', 'brass', 'sus'], free: ['resin', 'alu'], cw: 0.25, lw: 0.1 },
  clip:   { name: 'クリップ', mats: ['none', 'resin', 'sus', 'brass'], free: ['none', 'resin', 'sus'], cw: 0.3, lw: 0.1 },
};
const GRIP_FIN = {
  plain:  { name: 'なめらか', ok: m => true, cost: 0, q: m => (m.soft ? 0.75 : m.wood ? 0.78 : m.metal ? 0.35 : 0.3) },
  rings:  { name: 'みぞ（リング）', ok: m => !m.soft, cost: 2, q: m => (m.metal ? 0.6 : m.wood ? 0.7 : 0.55) },
  dots:   { name: 'つぶつぶ', ok: m => !!m.soft || m === MECH_MATS.resin, cost: 1, q: m => (m.soft ? 0.95 : 0.6) },
  knurlF: { name: 'ローレット（細かい）', ok: m => !!m.metal, cost: 18, req: 'r_g3', q: () => 0.95 },
  knurlC: { name: 'ローレット（粗い）', ok: m => !!m.metal, cost: 15, req: 'r_g3', q: () => 0.85 },
};
const MECH_SECS = { round: { name: '丸' }, hex: { name: '六角', roll: 1, cost: 2 }, dodeca: { name: '十二角', roll: 1, cost: 4, req: 'r_12' }, tri: { name: '三角', roll: 1, cost: 3, req: 'r_ptri' } };
const MECH_WIN = { none: '窓なし', knock: 'ノックの下（回して合わせる）', top: '軸の上のほう', clip: 'クリップの根もと', grip: 'グリップのすぐ上' };
const MECH_COG = { none: { name: 'なし', mass: 0 }, tip: { name: '先に真ちゅうのおもり（低重心）', mass: 3.5, cost: 12, req: 'r_cog' }, rear: { name: '後ろにおもり（高重心）', mass: 3, cost: 10, req: 'r_cog' } };
const DEF_BUILD = { L: 145, D: 9, gripD: 0, gripL: 32, sec: 'round', mat: { tip: 'alu', grip: 'resin', barrel: 'resin', knock: 'resin', clip: 'resin' }, fin: 'rings', clipTop: 22, win: 'none', cog: 'none', cushion: false, clipret: false };
// 有名なシャーペンの「型」を参考にした出発点（名前はオリジナル）
const MECH_PRESETS = [
  { id: 'hexmetal', name: '金属六角の製図用', note: '全部金属・六角・細かいローレット・長いパイプ。重くてどっしり', b: { L: 140, D: 8, gripD: 0, gripL: 30, sec: 'hex', mat: { tip: 'brass', grip: 'brass', barrel: 'brass', knock: 'brass', clip: 'sus' }, fin: 'knurlF', clipTop: 16, win: 'knock', cog: 'none' }, spec: { tip: 't1', mech: 'k0' } },
  { id: 'knurlrub', name: 'ローレットの低重心製図用', note: '金属グリップ・クリップでパイプが引っこむ・ノックの下に硬度窓', b: { L: 145, D: 8, gripD: 0.5, gripL: 34, sec: 'round', mat: { tip: 'brass', grip: 'brass', barrel: 'alu', knock: 'brass', clip: 'sus' }, fin: 'knurlF', clipTop: 18, win: 'knock', cog: 'tip', clipret: true }, spec: { tip: 't2', mech: 'k0' } },
  { id: 'lightdraft', name: '軽い製図用', note: '樹脂の軸にアルミのグリップ。約10gで疲れにくい', b: { L: 147, D: 9, gripD: 0, gripL: 32, sec: 'round', mat: { tip: 'alu', grip: 'alu', barrel: 'resin', knock: 'resin', clip: 'resin' }, fin: 'rings', clipTop: 20, win: 'knock', cog: 'none' }, spec: { tip: 't1', mech: 'k0' } },
  { id: 'silverhex', name: '銀の六角ローレット', note: 'アルミの六角軸に真ちゅうのローレットグリップ。低めの重心', b: { L: 145, D: 8, gripD: 0, gripL: 33, sec: 'hex', mat: { tip: 'brass', grip: 'brass', barrel: 'alu', knock: 'alu', clip: 'sus' }, fin: 'knurlF', clipTop: 18, win: 'knock', cog: 'none' }, spec: { tip: 't1', mech: 'k0' } },
  { id: 'woodlow', name: '強化木の低重心', note: '積層強化木の軸と真ちゅうの口金。大人に人気', b: { L: 145, D: 9.5, gripD: 0, gripL: 34, sec: 'round', mat: { tip: 'brass', grip: 'wood2', barrel: 'wood2', knock: 'brass', clip: 'sus' }, fin: 'plain', clipTop: 20, win: 'none', cog: 'none' }, spec: { tip: 't0', mech: 'k0' } },
  { id: 'dodeca', name: '十二角の自動芯出し', note: '十二角の軸・ステンレスの口金・自動で芯が出る', b: { L: 143, D: 9.3, gripD: 0, gripL: 30, sec: 'dodeca', mat: { tip: 'sus', grip: 'resin', barrel: 'alu', knock: 'alu', clip: 'sus' }, fin: 'rings', clipTop: 18, win: 'none', cog: 'none' }, spec: { tip: 't2', mech: 'k5' } },
  { id: 'rotate', name: '芯が回る学生用', note: '芯が回って先がとがり続ける。軽くて安い', b: { L: 145, D: 9.5, gripD: 0, gripL: 32, sec: 'round', mat: { tip: 'alu', grip: 'resin', barrel: 'resin', knock: 'resin', clip: 'resin' }, fin: 'rings', clipTop: 22, win: 'none', cog: 'none' }, spec: { tip: 't0', mech: 'k3' } },
  { id: 'nobreak', name: '折れない芯のやわらかグリップ', note: 'シリコンの太めグリップと、芯が折れない機構', b: { L: 145, D: 10, gripD: 1, gripL: 36, sec: 'round', mat: { tip: 'alu', grip: 'silicone', barrel: 'resin', knock: 'resin', clip: 'resin' }, fin: 'dots', clipTop: 22, win: 'none', cog: 'none' }, spec: { tip: 't0', mech: 'k4' } },
  { id: 'vintage', name: '昔の高級機（廃盤の名品風）', note: 'ステンレスの軸に自動繰り出し・パイプ収納。今は作られない高級機をイメージ', b: { L: 140, D: 9.3, gripD: 0, gripL: 30, sec: 'round', mat: { tip: 'sus', grip: 'sus', barrel: 'alu', knock: 'sus', clip: 'sus' }, fin: 'knurlC', clipTop: 16, win: 'none', cog: 'none', cushion: true }, spec: { tip: 't2', mech: 'k5' } },
];

// 古いセーブ（グリップ・軸を「性能」で選んでいたころ）から設計を作る
function mechBuild(d) {
  if (d.build) return d.build;
  const b = JSON.parse(JSON.stringify(DEF_BUILD)), g = d.spec && d.spec.grip, body = d.spec && d.spec.body;
  if (g === 'rubber' || g === 'silicone') { b.mat.grip = g; b.fin = 'dots'; } else if (g === 'knurl') { b.mat.grip = 'alu'; b.fin = 'knurlF'; }
  if (body === 'clear') b.mat.barrel = 'clear'; else if (body === 'alu') { b.mat.barrel = 'alu'; if (b.mat.grip === 'resin') b.mat.grip = 'alu'; } else if (body === 'wood') { b.mat.barrel = 'wood'; if (b.mat.grip === 'resin') b.mat.grip = 'wood'; }
  return (d.build = b);
}
const mechWinX = (b) => ({ knock: b.L - 16, top: b.L - 30, clip: b.L - b.clipTop + 3, grip: 12 + b.gripL + 4 })[b.win] || 0;   // 先からの距離（mm）
const MECH_TIP = 12, MECH_KNOCK = 14, MECH_CLIP = 38;
// 重さ（g）・重心（先からmm）と、点のもと
const _msCache = new WeakMap();
function mechStats(d) {
  const key = JSON.stringify([mechBuild(d), d.spec.mech, d.spec.erase, d.look && d.look.metal]), c = _msCache.get(d);
  if (c && c.key === key) return c.v;
  const v = mechStats0(d); _msCache.set(d, { key, v }); return v;
}
function mechStats0(d) {
  const b = mechBuild(d), M = MECH_MATS, L = b.L, R = b.D / 2, Rg = R + b.gripD / 2, parts = [];
  const tube = (mat, r, len, x0, tag) => { const m = M[mat]; if (!m || !m.dens) return; const rin = m.solid ? 2.6 : Math.max(2.4, r - m.wall), v = Math.PI * (r * r - rin * rin) * len / 1000; parts.push([v * m.dens, x0 + len / 2, tag]); return rin; };
  { const m = M[b.mat.tip], R1 = 1.1, R2 = Math.max(1.5, Rg - 0.4), v = (Math.PI * MECH_TIP / 3 * (R1 * R1 + R1 * R2 + R2 * R2) - Math.PI * 0.81 * MECH_TIP) / 1000; parts.push([v * m.dens, MECH_TIP * 0.55, 'tip']); }
  const rin = tube(b.mat.grip, Rg, b.gripL, MECH_TIP, 'grip');
  if (M[b.mat.grip].soft) tube('resin', rin, b.gripL, MECH_TIP, 'core');
  const bx0 = MECH_TIP + b.gripL, bLen = L - MECH_KNOCK - bx0; tube(b.mat.barrel, R, bLen, bx0, 'barrel');
  { const m = M[b.mat.knock], v = Math.PI * (2.4 * 2.4 - 1.5 * 1.5) * 9 / 1000 + 0.05; parts.push([v * m.dens, L - 6, 'knock']); }
  const clipRoot = L - b.clipTop, hasClip = b.mat.clip !== 'none';
  if (hasClip) { const m = M[b.mat.clip]; parts.push([m.dens * 0.16 + (m.metal ? 0.1 : 0), clipRoot - MECH_CLIP / 2, 'clip']); }
  parts.push([1.3, 26], [1.2, L * 0.55], [0.35, L * 0.42], [0.3, L - 8]);   // 中の部品（チャック・芯パイプとばね・芯・消しゴム）
  const MX = { k1: [0.6, 60], k2: [2.4, 80], k3: [1.6, 30], k4: [1.2, 18], k5: [2.2, 26] }[d.spec.mech]; if (MX) parts.push(MX);
  if (d.spec.erase === 'e1') parts.push([0.5, L - 10]);
  if (b.cog !== 'none') parts.push([MECH_COG[b.cog].mass, b.cog === 'tip' ? 22 : L - 22]);
  if (b.win !== 'none') parts.push([0.3, mechWinX(b)]);
  if (b.cushion) parts.push([0.4, 24]);
  if (b.clipret) parts.push([0.5, clipRoot - 10]);
  const W = parts.reduce((a, p) => a + p[0], 0), cog = parts.reduce((a, p) => a + p[0] * p[1], 0) / W, cogPct = cog / L * 100;
  // 書きやすさ（重さ・重心・太さ・グリップ）
  const gm = M[b.mat.grip], fin = GRIP_FIN[b.fin] && GRIP_FIN[b.fin].ok(gm) ? GRIP_FIN[b.fin] : GRIP_FIN.plain, gripQ = fin.q(gm), Dg = Rg * 2, notes = [];
  const gs = x => Math.exp(-x * x / 2);
  let ergo = 0.25 * gs((W - 15.5) / 6) + 0.3 * clamp((51 - cogPct) / 7, 0, 1) + 0.2 * gs((Dg - 9.4) / 1.3) + 0.25 * gripQ;
  const clipLow = hasClip && clipRoot - MECH_CLIP < MECH_TIP + b.gripL + 6;
  if (clipLow) { ergo -= 0.15; notes.push('クリップが指に当たる（クリップをもっと上へ）'); }
  if (cogPct > 52) notes.push('重心が高くて、先がふらつきやすい');
  if (W > 24) notes.push('重い。長く書くと疲れやすい');
  if (Dg < 7.6) notes.push('細すぎて、にぎりにくい');
  if (Dg > 11.5) notes.push('太すぎて、手の小さい人には使いにくい');
  // 機能
  let func = 0, winHidden = false;
  if (b.win !== 'none') { const wx = mechWinX(b); winHidden = hasClip && b.win === 'top' && wx < clipRoot && wx > clipRoot - MECH_CLIP; func += winHidden ? 0.6 : 2 + (b.win === 'grip' ? 0.5 : 0); if (winHidden) notes.push('硬度表示窓がクリップにかくれる'); }
  if (hasClip) func += 1.2 + (M[b.mat.clip].metal ? 0.3 : 0);
  if (b.clipret && hasClip) func += 1.2;
  if (b.cushion) func += 1.4;
  if (MECH_SECS[b.sec].roll) func += 0.8;
  func = Math.min(8, func);
  // 素材のよさ（耐久性・精度）
  let mat = 0; if (M[b.mat.tip].metal) mat += 1.2; if (gm.metal) mat += 0.8; if (gm.wood || M[b.mat.barrel].wood) mat += 0.8; if (M[b.mat.barrel].metal) mat += 0.6; mat = Math.min(4, mat);
  // 高級感（値段の高さが受け入れられる）
  let lux = 0; for (const k in MECH_PARTS) lux += MECH_PARTS[k].lw * (M[b.mat[k]].lux || 0);
  if (b.fin === 'knurlF' || b.fin === 'knurlC') lux += 0.1; if (W >= 18) lux += 0.05; if (d.look && (d.look.metal === 'gold' || d.look.metal === 'rose') && Object.values(b.mat).some(x => M[x].metal)) lux += 0.05;
  lux = clamp(lux, 0, 1);
  // 層ごとの人気
  const knurl = b.fin === 'knurlF' || b.fin === 'knurlC', soft = !!gm.soft, wood = !!(gm.wood || M[b.mat.barrel].wood);
  const seg = {
    pro: 0.25 * gs((W - 19) / 5) + 0.25 * clamp((47 - cogPct) / 4, 0, 1) + (knurl ? 0.2 : 0) + (b.win !== 'none' && !winHidden ? 0.15 : 0) + (Dg <= 8.6 ? 0.1 : 0) + (MECH_SECS[b.sec].roll ? 0.05 : 0),
    stu: 0.25 * gs((W - 12) / 3.5) + (soft ? 0.2 : 0) + (Dg >= 9 && Dg <= 10.8 ? 0.1 : 0),
    adu: 0.3 * lux + (wood ? 0.15 : 0) + (hasClip ? 0.1 : 0) + 0.15 * gs((W - 17) / 5),
  };
  // 部品の原価
  const sz = Math.pow(b.D / 9, 1.5) * (L / 145);
  let cost = 0; for (const k in MECH_PARTS) cost += MECH_PARTS[k].cw * (M[b.mat[k]].cost || 0) * (k === 'barrel' || k === 'grip' ? sz : 1) + (k === 'clip' && b.mat.clip === 'resin' ? 1 : 0);
  cost += (fin.cost || 0) + (b.win !== 'none' ? 8 : 0) + (MECH_COG[b.cog].cost || 0) + (b.cushion ? 15 : 0) + (b.clipret ? 30 : 0) + (MECH_SECS[b.sec].cost || 0);
  return { W, cog, cogPct, ergo: clamp(ergo, 0, 1), ergoPts: 14 * clamp(ergo, 0, 1), func, mat, lux, seg, cost, notes, gripQ, Dg, fin, winHidden };
}
// 研究がまだの部品
function mechLocks(d) {
  const b = mechBuild(d), out = [];
  for (const k in MECH_PARTS) { const P = MECH_PARTS[k], m = b.mat[k], r = MECH_MATS[m].req; if (r && !(P.free || []).includes(m) && !resDone(r)) out.push(P.name + 'の' + MECH_MATS[m].name); }
  const fin = GRIP_FIN[b.fin]; if (fin && fin.req && !resDone(fin.req)) out.push(fin.name);
  const sec = MECH_SECS[b.sec]; if (sec.req && !resDone(sec.req)) out.push(sec.name + 'の軸');
  if (b.win !== 'none' && !resDone('r_hwin')) out.push('硬度表示窓');
  if (MECH_COG[b.cog].req && !resDone(MECH_COG[b.cog].req)) out.push('重心のおもり');
  if (b.cushion && !resDone('r_cushion')) out.push('芯クッション');
  if (b.clipret && !resDone('r_clipret')) out.push('クリップ連動のパイプ収納');
  return out;
}
