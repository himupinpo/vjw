// =========================================================================================
//  会社のシミュレーション：時間・開発（不具合）・発売とレビュー・売れゆき（シェア）・研究・スタッフ・設備・
//  事務所・売る地域・ライバル・流行・ニュース・目標・セーブ
// =========================================================================================
const DAY_SEC = 0.6;   // 1倍の速さで、1日＝0.6秒
let S = null;          // いまのゲームの状態（セーブされる）

function newState(company) {
  return {
    v: 1, company: company || 'ぶんぐ工房', day: 0, money: 3000000, debt: 0, rp: 12, tier: 0,
    equip: { chair: 0, monitor: 0, lab: 0, line: 1 }, furn: [],
    staff: [], cands: [], nextId: 1, research: { done: [], cur: null }, devs: [], products: [], markets: ['jp'],
    rivals: RIVALS.map(r => ({ id: r.id, owned: false, P: {}, value: r.value })),
    stats: { launched: 0, sales: 0, best: 0, value: 0, top1: false, monthRev: 0, monthProfit: 0, lastMonthProfit: 0, lastMonthRev: 0 },
    goal: 0, brand: 0.55, trend: { id: 'pastel', until: 360 }, drops: [], hist: [], news: [], speed: 1, over: false, share: {}, capUse: 0,
  };
}

// ---------- 計算のもと ----------
const KMAX = {}; for (const k of KIND_IDS) KMAX[k] = SPECS[k].reduce((a, g) => a + Math.max(...g.opts.map(o => o.lv)), 0);
KMAX.mech += 26;   // シャーペンは設計（書きやすさ14・機能8・素材4）の点が加わる
const expected = (k, day = S.day) => Math.min(KINDS[k].e0 + KINDS[k].slope * (yearOf(day) - 2000), KMAX[k] * 0.88);
const optOf = (k, key, id) => { const g = SPECS[k].find(x => x.key === key); return (g && g.opts.find(o => o.id === id)) || (g && g.opts[0]); };
function perfP(d) { let P = d.bonus || 0; for (const g of SPECS[d.kind]) P += optOf(d.kind, g.key, d.spec[g.key]).lv; if (d.kind === 'mech') { const m = mechStats(d); P += m.ergoPts + m.func + m.mat; } return Math.round(P * 10) / 10; }
const luxOf = d => (d.kind === 'mech' ? mechStats(d).lux : 0);
// 仕上げ：研究ポイントを使って性能を上げる（期待の5%ずつ）
const POLISH = [0, 1, 2, 3, 4];
const polishRP = (k, lv) => Math.round(lv * (12 + expected(k) * 1.3) * (1 + lv * 0.15));
const polishBonus = (k, lv) => Math.round(lv * 0.05 * expected(k) * 10) / 10;
const resDone = id => !id || S.research.done.includes(id);
const kindOpen = k => !KINDS[k].unlock || resDone(KINDS[k].unlock);
const sumRes = f => S.research.done.reduce((a, id) => a + (RES_BY_ID[id][f] || 0), 0);
const BASE_COST = { pencil: 6, eraser: 6, lead: 10, mech: 20, ball: 6, fountain: 80 };
function costOf(d) {
  let c = BASE_COST[d.kind];
  for (const g of SPECS[d.kind]) { const o = optOf(d.kind, g.key, d.spec[g.key]); let m = 1; for (const dr of S.drops) if (dr.kind === d.kind && dr.key === g.key && dr.opt === o.id) m *= dr.mult; c += o.cost * m; }
  if (d.kind === 'mech') c += mechStats(d).cost;
  return Math.max(1, Math.round(c * (1 - sumRes('costCut'))));
}
const fairPrice = (d, q) => costOf(d) * 1.75 * (0.85 + 0.3 * clamp(q, 0.5, 1.6)) * (1 + 3 * luxOf(d));   // 高級なものは高くても買われる
const perfScore = q => clamp(6 + 3.4 * Math.tanh(2.6 * (q - 1)), 0.5, 10);
const valueScore = (fair, price) => clamp(6 + 5 * (fair / price - 1), 0, 10);
// おすすめの値段（高級なものは高め）
const recPrice = d => { const c = costOf(d); const r = c * 1.7 * (1 + 2.4 * luxOf(d)); return r < 100 ? Math.max(c + 1, Math.round(r / 5) * 5) : r < 1000 ? Math.round(r / 10) * 10 : Math.round(r / 100) * 100; };
// 見た目の分類（流行に合うか）
function lookCats(d) {
  const L = d.look, sp = d.spec, out = new Set(), c = new THREE.Color(L.body || '#ffffff'), hsl = {}; c.getHSL(hsl);
  const body = d.kind === 'mech' ? ({ clear: 'clear', alu: 'alu', brass: 'brass', wood: 'wood', wood2: 'wood' })[mechBuild(d).mat.barrel] : sp.body;
  if (body === 'clear' || (d.kind === 'lead' && L.clear !== 'solid')) out.add('clear');
  if (L.finish === 'metal' || ['alu', 'brass', 'metal'].includes(body)) out.add('metal');
  if (body === 'wood' || L.pattern === 'wood' || (d.kind === 'pencil' && sp.wood === 'w2')) out.add('natural');
  const l = hsl.l, s = hsl.s;
  if (l < 0.2) out.add('black'); else if (l > 0.88 && s < 0.35) out.add('white');
  else if (l > 0.7 && s > 0.3) out.add('pastel'); else if (s < 0.35 && l > 0.3) out.add('dusty'); else if (s > 0.6 && l > 0.3 && l < 0.7) out.add('vivid');
  return out;
}
function designScore(d, withTrend = true) {
  let s = 5 + Math.min(2.5, roleSum('des')) + sumRes('design');
  const D = DEF_LOOK[d.kind], L = d.look;
  if (L.pattern && L.pattern !== 'none') s += 0.3;
  if (L.logo && L.logo !== D.logo) s += 0.35;
  if (Object.keys(D).some(k => k !== 'logo' && L[k] !== D[k])) s += 0.35;
  if (withTrend && lookCats(d).has(S.trend.id)) s += 1.3;
  if (d.kind === 'mech') s += 0.8 * mechStats(d).lux;   // 金属や木の質感
  return clamp(s, 0, 10);
}
function segFit(d, month) {
  const K = KINDS[d.kind]; let a = 0, b = 0;
  const ms = d.kind === 'mech' ? mechStats(d) : null;
  for (const s in K.segw) { const w = K.segw[s] * SEASON[s][month]; let bon = ms ? ms.seg[s] : 0; for (const g of SPECS[d.kind]) { const o = optOf(d.kind, g.key, d.spec[g.key]); if (o.seg && o.seg[s]) bon += o.seg[s]; } a += w * (1 + bon); b += w; }
  return a / b;
}
function popOf(d) { let p = 1; for (const g of SPECS[d.kind]) { const o = optOf(d.kind, g.key, d.spec[g.key]); if (o.pop) p *= o.pop; } return p; }
// 製品のいまの点（発売のあとも、年がたつと期待が上がって下がっていく）
function currentScore(p) {
  const q = perfP(p) / expected(p.kind), perf = perfScore(q), des = designScore(p), val = valueScore(fairPrice(p, q), p.price);
  return { q, perf, des, val, R: clamp(0.58 * perf + 0.27 * des + 0.15 * val - (p.samePen || 0), 1, 10) };
}
// 1日あたりのその種類の市場（本数）
function kindDemand(k, day = S.day) {
  const K = KINDS[k], m = dateOf(day).getMonth(), dy = yearOf(day) - 2000; let seg = 0;
  for (const s in K.segw) seg += K.segw[s] * SEASON[s][m];
  const mk = MARKETS.filter(x => S.markets.includes(x.id)).reduce((a, x) => a + x.mult, 0);
  return K.base * seg * K.trend(dy) * mk / 7;
}
function rivalA(r, k) {
  const RV = RIVALS.find(x => x.id === r.id); if (r.owned || !RV.w[k]) return 0;
  const P = r.P[k] || expected(k) * 0.97, q = P / expected(k), R = 0.58 * perfScore(q) + 0.27 * 6.6 + 0.15 * 6.2;
  return RV.brand * (1 + 0.012 * (yearOf(S.day) - 2000)) * Math.pow(R / 7, 2.6) * RV.w[k];
}
function productA(p, month) {
  const sc = currentScore(p), wk = (S.day - p.launchDay) / 7, fair = fairPrice(p, sc.q);
  const priceK = clamp(Math.pow(fair / p.price, 2.2), 0.04, 4);
  const ad = 1 + p.adBoost * (1 + sumRes('adBoost')) * Math.exp(-wk / 7);
  const fresh = (1 + 0.6 * Math.exp(-wk / 3)) * Math.max(0.45, 1 - wk / 300);
  const trend = lookCats(p).has(S.trend.id) ? 1.15 : 1;
  const sales = 1 + Math.min(0.45, roleSum('sal')) + sumRes('sales');
  const re = 1 + (p.reissue || 0) * Math.exp(-wk / 26);   // 復刻版：昔のファンが買う
  return Math.pow(sc.R / 7, 2.6) * priceK * segFit(p, month) * popOf(p) * S.brand * ad * fresh * trend * sales * re;
}
// 仕事の速さ：いい椅子・部屋全体の家具（コーヒー・ソファ）＋ 一人ずつ（近くの家具・特技）
const workMul = () => 1 + 0.05 * S.equip.chair + FURNI.globalBonus(S);
const staffMul = m => { const tr = TRAITS[m.trait] || {}; return workMul() + FURNI.bonus(S, m) + (tr.all || 0) + (tr.role === m.role ? tr.mul : 0); };
const roleSum = r => S.staff.reduce((a, m) => a + (m.role === r ? ROLES[r].rate[m.lv - 1] * staffMul(m) : 0), 0);
const resRate = () => (0.12 * workMul() + roleSum('res')) * (1 + 0.06 * S.equip.monitor);
const qaRate = () => (0.2 * workMul() + roleSum('qa')) * (1 + 0.06 * S.equip.monitor) * (1 + 0.1 * S.equip.lab);
const devSpeed = () => workMul() * (1 + 0.04 * S.staff.reduce((a, m) => a + (m.role === 'des' ? staffMul(m) / workMul() : 0), 0));

// ---------- 開発 ----------
function devPlan(d) {
  const K = KINDS[d.kind], P = perfP(Object.assign({}, d, { bonus: d.bonus != null ? d.bonus : polishBonus(d.kind, d.polish || 0) }));
  return { P, cost: costOf(d), devCost: Math.round(K.dev * (1 + P / 40) / 10000) * 10000, days: Math.round((K.days + P * 0.35) / devSpeed()),
    bugs: (K.bugs + P / 8) * (1 - sumRes('bugCut')) * (1 - 0.12 * S.equip.lab) };
}
function canStartDev(d) {
  if (S.devs.length >= OFFICES[S.tier].slots) return '同時に開発できるのは ' + OFFICES[S.tier].slots + ' つまで（事務所を広げると増える）';
  for (const g of SPECS[d.kind]) { const o = optOf(d.kind, g.key, d.spec[g.key]); if (!resDone(o.req)) return o.name + ' はまだ研究していない'; }
  if (S.money < devPlan(d).devCost) return 'お金が足りない';
  if (S.rp < polishRP(d.kind, d.polish || 0)) return '研究ポイントが足りない（仕上げ）';
  if (d.kind === 'mech') { const lk = mechLocks(d); if (lk.length) return lk[0] + ' はまだ研究していない'; }
  if (!d.name || !d.name.trim()) return '製品の名前を入れよう';
  return '';
}
function startDev(d) {
  const why = canStartDev(d); if (why) return why;
  const pl = devPlan(d), pol = d.polish || 0, prp = polishRP(d.kind, pol);
  S.money -= pl.devCost; S.rp -= prp;
  S.devs.push({ id: S.nextId++, kind: d.kind, name: d.name.trim().slice(0, 24), spec: { ...d.spec }, look: { ...d.look }, build: d.kind === 'mech' ? JSON.parse(JSON.stringify(mechBuild(d))) : undefined, reissue: d.reissue || 0, price: d.price, devCost: pl.devCost, polish: pol, bonus: polishBonus(d.kind, pol), days: pl.days, left: pl.days, bugs: Math.max(1, Math.round(pl.bugs * rr(0.8, 1.2))), fixed: 0, ready: false });
  const nv = S.devs[S.devs.length - 1]; nv.issues = makeIssues(nv.kind, nv.bugs);
  news(`「${d.name}」の開発を始めた（${KINDS[d.kind].short}・${pl.days}日）`);
  return '';
}
// 試作テストで見つかる不具合に名前をつける（見つかった順）
function makeIssues(kind, n) {
  const base = DEFECTS[kind].slice().sort(() => Math.random() - 0.5), out = [];
  for (let i = 0; i < n; i++) { const rep = Math.floor(i / base.length); out.push({ n: base[i % base.length] + (rep ? `（${rep + 1}か所目）` : ''), t: TESTS[(Math.random() * TESTS.length) | 0] }); }
  return out;
}
const devFound = v => Math.min(v.bugs, Math.floor(v.bugs * Math.min(1, (1 - v.left / v.days) * 1.15 + 0.05)));
function fixWithRP(v) { const rest = Math.ceil(v.bugs - v.fixed), cost = rest * 3; if (rest <= 0 || S.rp < cost) return false; S.rp -= cost; v.fixed = v.bugs; return true; }

// ---------- 発売 ----------
const REVIEWERS = ['文具ライター', '文具好きの学生', '事務用品のバイヤー', 'デザイン雑誌', '文具ブロガー'];
function launch(devId, price, adId) {
  const i = S.devs.findIndex(v => v.id === devId); if (i < 0) return null;
  const v = S.devs[i], ad = ADS.find(a => a.id === adId) || ADS[0];
  if (S.money < ad.cost) return null;
  S.devs.splice(i, 1); S.money -= ad.cost;
  const p = { id: v.id, kind: v.kind, name: v.name, spec: v.spec, look: v.look, build: v.build, reissue: v.reissue || 0, polish: v.polish || 0, bonus: v.bonus || 0, price: Math.max(1, Math.round(price)), launchDay: S.day, ad: ad.id, adBoost: ad.boost, units: 0, revenue: 0, profit: 0, active: true, weekUnits: 0, lastWeek: 0, devCost: v.devCost };
  const same = S.products.some(o => o.active && o.kind === p.kind && JSON.stringify(o.spec) === JSON.stringify(p.spec));
  p.samePen = same ? 1.4 : 0;
  const q = perfP(p) / expected(p.kind), perf = perfScore(q), des = designScore(p), val = valueScore(fairPrice(p, q), p.price);
  p.review = Math.round(clamp(0.58 * perf + 0.27 * des + 0.15 * val - p.samePen + rr(-0.25, 0.25), 1, 10) * 10) / 10;
  p.scores = { perf: Math.round(perf * 10) / 10, des: Math.round(des * 10) / 10, val: Math.round(val * 10) / 10 };
  p.comments = reviewComments(p, q, perf, des, val, same);
  S.products.push(p); S.stats.launched++; for (const m of S.staff) if (m.role === 'sal' || m.role === 'des') gainXp(m, 4); S.stats.best = Math.max(S.stats.best, p.review);
  S.brand = clamp(S.brand + (p.review - 6.2) * 0.03 + ad.brand, 0.4, 1.8);
  news(`「${p.name}」発売！ レビュー ${p.review.toFixed(1)} 点`);
  if (p.reissue) news(`名品の復刻版「${p.name}」に行列ができた！`);
  return p;
}
function reviewComments(p, q, perf, des, val, same) {
  const best = SPECS[p.kind].map(g => optOf(p.kind, g.key, p.spec[g.key])).sort((a, b) => b.lv - a.lv)[0];
  const who = () => pick(['文具ライター', '文具好きの学生', '文具ブロガー']), out = [];
  if (same) out.push([who(), '前の製品とほとんど同じ。新しさがほしかった。']);
  if (perf >= 8.3) out.push([who(), `「${best.name}」が効いていて、使い心地が段ちがい。今いちばんの${KINDS[p.kind].short}かも。`]);
  else if (perf >= 6.5) out.push([who(), `ちゃんと使える${KINDS[p.kind].short}。「${best.name}」もいい感じ。`]);
  else if (perf >= 4.5) out.push([who(), 'ふつうに使えるけれど、ほかの会社の新製品にくらべると少し古い感じ。']);
  else out.push([who(), '性能はひと昔前。もっと研究して、新しい技術を入れてほしい。']);
  if (p.kind === 'mech') {   // 重さ・重心・グリップの感想
    const m = mechStats(p); let t = `${m.W.toFixed(1)}g、重心は先から${Math.round(m.cog)}mm（全長の${m.cogPct.toFixed(0)}%）。`;
    t += m.cogPct <= 45 ? '重心が低くて先が安定し、線がぶれない。' : m.cogPct >= 50 ? '重心が高めで、先が少しふらつく。' : 'バランスはふつう。';
    t += m.gripQ >= 0.9 ? 'グリップがしっかり指にかかる。' : m.gripQ < 0.45 ? 'グリップがすべりやすい。' : '';
    if (m.lux >= 0.6) t += '金属や木の質感が手に心地よい。';
    if (m.notes.length) t += m.notes[0] + '。';
    out.push(['製図の先生', t]);
  }
  if (p.reissue) out.push(['文具ブロガー', 'あの名品が帰ってきた！ 昔使っていた人もなつかしがって買いそう。']);
  const cats = lookCats(p);
  if (cats.has(S.trend.id)) out.push(['デザイン雑誌', `今はやりの「${TRENDS[S.trend.id]}」で、見た目がとても今っぽい！`]);
  else if (des >= 7) out.push(['デザイン雑誌', 'こだわりのデザインで、持っているとうれしくなる。']);
  else if (des < 5.6) out.push([who(), '見た目はふつう。もう少し個性がほしい。']);
  else out.push([who(), pick(['色がきれいで、手にとりやすいデザイン。', 'すっきりしたデザインで、どこでも使いやすい。', 'ロゴと色の組み合わせがいい感じ。'])]);
  if (val >= 7.5) out.push(['事務用品のバイヤー', 'この値段でこの品質はお買い得。よく売れそう。']);
  else if (val < 4) out.push(['事務用品のバイヤー', 'ちょっと高すぎる。値段を下げると手に取る人が増えそう。']);
  else out.push(['事務用品のバイヤー', '値段は相場どおり。お店にも置きやすい。']);
  return out.slice(0, p.kind === 'mech' ? 4 : 3);
}

// ---------- 研究 ----------
function resState(r) {
  if (S.research.done.includes(r.id)) return 'done';
  if (S.research.cur && S.research.cur.id === r.id) return 'cur';
  if (yearOf(S.day) < r.year) return 'year';
  if (r.req && !resDone(r.req)) return 'req';
  return 'can';
}
function startResearch(id) {
  const r = RES_BY_ID[id]; if (!r || resState(r) !== 'can' || S.research.cur) return false;
  if (S.rp < r.rp) return false;
  S.rp -= r.rp; S.research.cur = { id, left: r.days, days: r.days }; return true;
}

// ---------- スタッフ ----------
const HAIR = ['#2b2118', '#1c1a18', '#5a3a22', '#7a5a3a', '#3a2a20', '#9a6b3d', '#222222'];
function makeCand() {
  const roles = Object.keys(ROLES), role = pick(roles), maxLv = Math.min(5, S.tier + 2 + (Math.random() < 0.25 ? 1 : 0)), lv = ri(1, maxLv);
  return { id: S.nextId++, name: pick(FAMILY) + ' ' + pick(GIVEN), role, lv, sal: Math.round(ROLES[role].sal[lv - 1] * rr(0.92, 1.1) / 1000) * 1000, hair: pick(HAIR), trait: pickTrait(role), xp: 0 };
}
// 特技：半分くらいの人が持っている（その役わりに合うものか、だれでも役立つもの）
function pickTrait(role) {
  if (Math.random() < 0.45) return '';
  return pick(Object.keys(TRAITS).filter(k => !TRAITS[k].role || TRAITS[k].role === role));
}
// 経験：毎日たまる（特技「のみこみが早い」は +50%）。たまるとレベルが上がり、月給も上がる
function gainXp(m, n) {
  if (m.lv >= 5) return; m.xp = (m.xp || 0) + n * (1 + ((TRAITS[m.trait] || {}).xp || 0));
  if (m.xp < LEVEL_XP[m.lv]) return;
  m.xp = 0; m.lv++; m.sal = Math.round(m.sal * 1.25 / 1000) * 1000;
  UI.toast(`${m.name}さんが昇格！ ${ROLES[m.role].name} ${'★'.repeat(m.lv)}（月給 ${yen(m.sal)}）`, 'gold'); news(`${m.name}さん（${ROLES[m.role].name}）が昇格した`); AU.chime();
  OFFICE.event('levelup', m.id); FURNI.ver++;
}
function rerollCands(pay) { if (pay) { const c = 50000 * (S.tier + 1); if (S.money < c) return false; S.money -= c; } S.cands = Array.from({ length: 4 }, makeCand); return true; }
function hire(id) {
  const c = S.cands.find(x => x.id === id); if (!c) return 'いない';
  if (S.staff.length >= OFFICES[S.tier].desks) return '机が足りない（事務所を広げよう）';
  if (S.money < c.sal) return 'お金が足りない（採用には月給1か月分）';
  S.money -= c.sal; S.staff.push(c); S.cands = S.cands.filter(x => x !== c); S.cands.push(makeCand());
  news(`${c.name}さん（${ROLES[c.role].name}）が入社した`); return '';
}
function fire(id) { S.staff = S.staff.filter(m => m.id !== id); }

// ---------- 設備・事務所・地域・ライバル ----------
const eqMax = k => k === 'line' ? EQUIP.line.maxBy[S.tier] : Math.min(EQUIP[k].max || 3, OFFICES[S.tier].maxEq);
const eqPrice = k => EQUIP[k].price[S.equip[k] - (k === 'line' ? 0 : 0)] ?? null;
function buyEquip(k) { const lv = S.equip[k]; if (lv >= eqMax(k)) return false; const pr = EQUIP[k].price[k === 'line' ? lv : lv]; if (pr == null || S.money < pr) return false; S.money -= pr; S.equip[k]++; return true; }
function officeNeed(t) { const O = OFFICES[t]; if (!O || !O.need) return null; return { ok: S.stats.launched >= O.need.launched && S.stats.sales >= O.need.sales && S.money >= O.cost, launched: O.need.launched, sales: O.need.sales, cost: O.cost }; }
function moveOffice() { const t = S.tier + 1, n = officeNeed(t); if (!n || !n.ok) return false; S.money -= n.cost; S.tier = t; news(`${OFFICES[t].name}へ引っ越した！`); return true; }
function marketOk(m) { if (S.markets.includes(m.id)) return false; if (m.req && !S.markets.includes(m.req)) return false; if (m.id === 'world' && S.tier < 2) return false; return S.stats.launched >= (m.need ? m.need.launched : 0) && S.money >= m.cost; }
function expand(id) { const m = MARKETS.find(x => x.id === id); if (!m || !marketOk(m)) return false; S.money -= m.cost; S.markets.push(id); S.brand = clamp(S.brand + 0.05, 0.4, 1.8); news(`${m.name}で売り始めた！ お客さんが増える`); return true; }
// 海外は文具ビルから
const buyoutPrice = r => Math.round(r.value * (1 + 0.05 * (yearOf(S.day) - 2000)) / 1e6) * 1e6;
function buyout(id) { const r = S.rivals.find(x => x.id === id); if (!r || r.owned) return false; const pr = buyoutPrice(r); if (S.money < pr) return false; S.money -= pr; r.owned = true; r.paid = pr; S.brand = clamp(S.brand + 0.1, 0.4, 1.8); news(`${RIVALS.find(x => x.id === id).name}を買収した！`); return true; }

// ---------- 借金：会社が育つ（事務所・発売・売上・地域）ほど多く借りられる。上限をこえたら倒産 ----------
const LOAN = { base: [10e6, 40e6, 400e6, 4e9], per: [1e6, 3e6, 15e6, 60e6], rate: [0.06, 0.05, 0.04, 0.03] };
function loanParts(s = S) {
  const t = s.tier;
  return [[`事務所（${OFFICES[t].name}）`, LOAN.base[t]], [`発売した製品 ${s.stats.launched}こ`, s.stats.launched * LOAN.per[t]], ['売上の合計の 8%', s.stats.sales * 0.08], [`進出した地域 ${s.markets.length - 1}つ`, (s.markets.length - 1) * LOAN.base[t] * 0.5]];
}
const debtLimit = (s = S) => Math.floor(loanParts(s).reduce((a, p) => a + p[1], 0) / 1e6) * 1e6 + (s.limitExtra || 0);
const loanRoom = () => Math.max(0, debtLimit() - S.debt);
function borrow(n) { n = Math.min(Math.round(n), loanRoom()); if (n <= 0) return 0; S.debt += n; S.money += n; return n; }
function repay(n) { n = Math.min(Math.round(n), S.debt, Math.max(0, Math.floor(S.money))); if (n <= 0) return 0; S.debt -= n; S.money -= n; return n; }
// お金がマイナスになったら自動で借りる。借金が上限をこえたら倒産
function checkDebt() {
  if (S.money < 0) {
    const n = Math.ceil(-S.money); S.debt += n; S.money = 0;
    if (S.day - (S.autoLoanDay ?? -99) >= 7) { S.autoLoanDay = S.day; UI.toast(`お金が足りないので ${yen(n)} を自動で借りた（借金 ${yen(S.debt)}）`, 'bad'); }
  }
  if (S.debt > debtLimit() && !S.over) { S.over = true; UI.gameOver('debt'); }
}

// ---------- ニュース・お知らせ ----------
function news(t, kind) { S.news.unshift({ d: S.day, t }); S.news.length = Math.min(S.news.length, 30); if (typeof UI !== 'undefined') UI.newsTick(t, kind); }

// ---------- 1日すすめる ----------
function dayTick() {
  const prevMonth = dateOf(S.day).getMonth(); S.day++;
  const date = dateOf(S.day), month = date.getMonth();
  // 研究ポイント・研究
  S.rp += resRate();
  if (S.research.cur) { const c = S.research.cur; c.left -= workMul(); if (c.left <= 0) { const r = RES_BY_ID[c.id]; S.research.done.push(c.id); S.research.cur = null; OFFICE.event('research'); for (const m of S.staff) if (m.role === 'res') gainXp(m, 6); UI.toast(`研究完了：${r.name}`, 'good'); if (r.unlock) UI.toast(`${r.unlock.map(k => KINDS[k].short).join('・')} を開発できるようになった！`, 'gold'); AU.chime(); news(`研究「${r.name}」が完了した`); UI.dirty(); } }
  // 開発と不具合直し
  let fixPool = qaRate();
  const needs = S.devs.filter(v => devFound(v) - v.fixed > 0.01);
  for (const v of S.devs) {
    if (v.left > 0) v.left = Math.max(0, v.left - devSpeed());
    const open = devFound(v) - v.fixed; if (open > 0 && fixPool > 0) { const f = Math.min(open, fixPool / Math.max(1, needs.length)), f0 = Math.floor(v.fixed + 1e-6); v.fixed += f; if (Math.floor(v.fixed + 1e-6) > f0) OFFICE.event('fix'); }
    if (!v.ready && v.left <= 0 && v.fixed >= v.bugs - 0.001) { v.ready = true; OFFICE.event('devdone'); for (const m of S.staff) if (m.role === 'qa' || m.role === 'des') gainXp(m, 5); UI.toast(`「${v.name}」の開発が終わった！ 発売しよう`, 'gold'); AU.chime(); UI.dirty(); UI.readyQueue(v.id); }
  }
  for (const m of S.staff) gainXp(m, 1);
  // 売れゆき（種類ごとにシェアを計算）
  let rev = 0, cogs = 0, work = 0; const sold = [];
  S.share = {};
  for (const k of KIND_IDS) {
    const mine = S.products.filter(p => p.active && p.kind === k);
    const As = mine.map(p => productA(p, month)), rA = S.rivals.map(r => rivalA(r, k)), tot = As.reduce((a, b) => a + b, 0) + rA.reduce((a, b) => a + b, 0) + 1.5;   // 1.5＝小さな会社たち
    const D = kindDemand(k);
    S.share[k] = { me: As.reduce((a, b) => a + b, 0) / tot, rivals: rA.map(a => a / tot) };
    mine.forEach((p, i) => { const u = D * As[i] / tot; sold.push([p, u]); work += u * KINDS[k].work; });
  }
  const cap = LINE_CAP[S.equip.line] / 7, f = work > cap ? cap / work : 1; S.capUse = work / cap;
  for (const [p, u0] of sold) { const u = u0 * f, c = costOf(p); p.units += u; p.weekUnits += u; p.revenue += u * p.price; p.profit += u * (p.price - c); rev += u * p.price; cogs += u * c; }
  S.money += rev - cogs; S.stats.sales += rev; S.stats.monthRev += rev; S.stats.monthProfit += rev - cogs;
  // 週ごと
  if (S.day % 7 === 0) weekTick();
  if (month !== prevMonth) monthTick(date);
  // 季節のお知らせ
  if (date.getMonth() === 1 && date.getDate() === 15) news('もうすぐ新学期。学生向けの文房具がよく売れる季節です（3〜4月）');
  if (date.getMonth() === 10 && date.getDate() === 20) news('年末の贈り物シーズン。万年筆やいいペンがよく売れます（12月）');
  checkDebt(); if (S.over) return;
  checkGoals();
}
// 名品：評価が高くて販売を終えた製品は、1年たつと中古で高くなる（高級なものほど）
const legendOk = p => !p.active && (p.review >= 8.8 || (p.review >= 8.2 && luxOf(p) >= 0.4));
const resaleMult = p => Math.round((1.5 + Math.max(0, p.review - 8) * 2.2 + luxOf(p) * 3) * (1 + Math.min(1.5, (S.day - (p.offDay || S.day)) / 365 * 0.25)) * 10) / 10;
function weekTick() {
  for (const p of S.products) { p.lastWeek = p.weekUnits; p.weekUnits = 0; }
  for (const p of S.products) if (legendOk(p) && !p.legend && S.day - (p.offDay || S.day) >= 365) { p.legend = true; S.brand = clamp(S.brand + 0.03, 0.4, 1.8); news(`販売を終えた「${p.name}」が中古市場で定価の${resaleMult(p)}倍に！ 名品として話題に`); UI.toast(`「${p.name}」が名品になった！ 復刻版も作れる`, 'gold'); }
  // ブランド：シェアと最近のレビューで、ゆっくり動く
  const shares = KIND_IDS.map(k => (S.share[k] ? S.share[k].me : 0)), avg = shares.reduce((a, b) => a + b, 0) / KIND_IDS.length;
  const target = 0.55 + 0.85 * clamp(avg * 3, 0, 1) + Math.min(0.25, S.stats.launched * 0.015) + 0.1 * S.rivals.filter(r => r.owned).length;
  S.brand = clamp(S.brand + (target - S.brand) * 0.02, 0.4, 1.8);
  S.stats.top1 = S.stats.top1 || KIND_IDS.some(k => S.share[k] && S.share[k].me > 0.05 && S.share[k].rivals.every(r => r < S.share[k].me));
  S.hist.push(Math.round(S.money)); if (S.hist.length > 104) S.hist.shift();
  // 会社の価値
  S.stats.value = Math.max(0, S.money - S.debt) + Math.max(0, S.stats.lastMonthProfit) * 36 + S.brand * 8e7 * S.markets.length + S.rivals.filter(r => r.owned).reduce((a, r) => a + (r.paid || 0) * 0.8, 0);
  if (S.day % 28 === 0) save();
}
function monthTick(date) {
  const sal = S.staff.reduce((a, m) => a + m.sal, 0), rent = OFFICES[S.tier].rent, div = S.rivals.filter(r => r.owned).reduce((a, r) => a + (r.paid || 0) * 0.006, 0), intr = Math.round(S.debt * LOAN.rate[S.tier] / 12);
  S.money -= sal + rent + intr; S.money += div; S.stats.lastInterest = intr;
  S.stats.lastMonthProfit = S.stats.monthProfit - sal - rent - intr + div; S.stats.lastMonthRev = S.stats.monthRev; S.stats.monthProfit = 0; S.stats.monthRev = 0;
  if (sal + rent + intr > 0) UI.toast(`給料と家賃：${yen(sal + rent)}${intr ? `・借金の利息：${yen(intr)}` : ''}`, '');
  if (S.debt > debtLimit() * 0.8) { UI.toast(`借金が上限の${Math.round(S.debt / debtLimit() * 100)}%！ 上限（${yen(debtLimit())}）をこえると倒産します`, 'bad'); AU.bad(); }
  if (div > 0) UI.toast(`買収した会社からの利益：${yen(div, true)}`, 'good');
  // ライバルの新製品
  for (const r of S.rivals) {
    if (r.owned) continue; const RV = RIVALS.find(x => x.id === r.id);
    for (const k of KIND_IDS) { if (!RV.w[k] || RV.w[k] < 0.35) continue; const my = S.share[k] ? S.share[k].me : 0; if (!r.P[k] || Math.random() < (0.07 + my * 0.12) * RV.w[k]) { r.P[k] = expected(k) * (rr(0.98, 1.12) + my * 0.25); if (S.day > 30 && Math.random() < 0.5) news(`${RV.name}が新しい${KINDS[k].short}を発売した`); } }
    r.value *= 1.004;
  }
  // 流行が変わる
  if (S.day >= S.trend.until) { const ids = Object.keys(TRENDS).filter(t => t !== S.trend.id); S.trend = { id: pick(ids), until: S.day + ri(300, 480) }; news(`いま「${TRENDS[S.trend.id]}」の文房具がはやっている！`, 'gold'); UI.toast(`流行：${TRENDS[S.trend.id]}がブームに`, 'gold'); }
  // 部品の値下がり
  S.drops = S.drops.filter(d => d.until > S.day);
  if (Math.random() < 0.12) {
    const k = pick(KIND_IDS.filter(kindOpen)), g = pick(SPECS[k].filter(g => g.opts.some(o => o.cost > 3))), o = pick(g.opts.filter(o => o.cost > 3 && resDone(o.req)));
    if (o) { S.drops.push({ kind: k, key: g.key, opt: o.id, mult: 0.8, until: S.day + 365 }); news(`${KINDS[k].short}の「${o.name}」の部品が値下がり（原価 −20%・1年間）`); }
  }
  void date;
}
function checkGoals() {
  const g = GOALS[S.goal]; if (!g || !g.done(S)) return;
  S.money += g.reward.money; S.rp += g.reward.rp; S.goal++; OFFICE.event('goal');
  UI.toast(`目標達成：${g.text}　${g.reward.money ? yen(g.reward.money, true) + '　' : ''}+${g.reward.rp} RP`, 'gold'); AU.fanfare(); UI.dirty();
}

// ---------- セーブ ----------
function save() { if (!S || S.over) return; try { localStorage.setItem('bungu-save', JSON.stringify(S)); } catch (e) { /* 保存できない */ } }
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem('bungu-save')); if (!s || s.v !== 1) return null;
    const d = newState(s.company); for (const k in d) if (s[k] === undefined) s[k] = d[k];
    s.equip = Object.assign(d.equip, s.equip); s.stats = Object.assign(d.stats, s.stats); s.research = Object.assign(d.research, s.research);
    for (const r of d.rivals) if (!s.rivals.find(x => x.id === r.id)) s.rivals.push(r);
    for (const m of s.staff.concat(s.cands)) { if (m.trait === undefined) m.trait = pickTrait(m.role); if (m.xp === undefined) m.xp = 0; }
    for (const v of s.devs) if (!v.issues) v.issues = makeIssues(v.kind, v.bugs);
    FURNI.migrate(s);
    if (s.money < 0) { s.debt = (s.debt || 0) - s.money; s.money = 0; const lim = debtLimit(s); if (s.debt > lim) s.limitExtra = Math.ceil((s.debt - lim) / 1e6 + 5) * 1e6; }   // 前の版のマイナスのお金は借金にする
    return s;
  } catch (e) { return null; }
}
