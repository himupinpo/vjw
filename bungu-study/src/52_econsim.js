// =========================================================================================
//  学習モードの経済のしくみ：在庫と需要・供給、価格の自動調節、GDPと景気、家計、公共料金、
//  産業（第1次・第3次）、サービス、グループ会社（トラスト・コンツェルン）、株式（上場・配当・株主総会）、CSR、
//  いろいろな出来事（カルテル・訪問販売・うその宣伝・欠陥商品・公企業からの注文・税金）
// =========================================================================================
const PLAN = { low: { name: '少なめ', f: 0.85 }, mid: { name: 'ふつう', f: 1 }, high: { name: '多め', f: 1.2 } };
const UTIL = [30000, 150000, 600000, 2000000];   // 毎月の電気・ガス・水道（公共料金）
const STORE_PRICE = [20e6, 40e6, 80e6, 150e6, 300e6];
const FOREST_PRICE = [30e6, 60e6, 120e6];
const SUBS = [
  { id: 'paper', name: 'さくら製紙', ind: '製紙業', price: 3e8, desc: '紙やケースが安くなる（すべての原価 −3%）' },
  { id: 'logi', name: 'みどり運送', ind: '運送業', price: 2e8, desc: '運ぶ力が上がり、1週間に作れる数 +10%' },
  { id: 'shop', name: 'ぶんぐ堂チェーン', ind: '小売業', price: 4e8, desc: '文房具店のチェーン。売れる数 +4%' },
  { id: 'it', name: 'ノートアプリ研究所', ind: 'IT', price: 6e8, desc: 'アプリと連動。評判が少しずつ上がる' },
];
const CSR_ACTS = [
  { id: 'tree', name: '植林活動', base: 5e6, brand: 0.03, desc: '山に木を植える。紙や木軸の材料にもなる森を守る' },
  { id: 'school', name: '学校に文房具を寄付', base: 3e6, brand: 0.025, desc: '学用品が足りない学校に文房具をとどける' },
  { id: 'recycle', name: '使用ずみペンの回収', base: 1e7, brand: 0.035, desc: '使い終わったペンを集めてリサイクル（ごみをへらす）' },
];
function econDefaults() {
  return {
    econ: { gdp: 5.2e14, g: 0.012, phase: 'ふつう', left: 0, policy: '', util: 1, lastQ: 0, hist: [] },
    hh: { inc: 450000, tax: 0.19, save: 0.12, engel: 0.25 },
    corp: { forest: 0, stores: 0, hd: false, subs: [], listed: false, shares: 0, outside: 0, sp: 0, sp0: 0, yutai: false, csr: {}, lastDiv: 0 },
    ev: { last: 0, cartel: null, door: null, lie: null, seen: {} },
    learn: { seen: {}, ok: {}, ng: {}, quizDay: -99 },
  };
}
// ---------- 家計（モデルの家族の1か月） ----------
function hhBook(h = S.hh) {
  const inc = h.inc, non = Math.round(inc * h.tax), disp = inc - non, sav = Math.round(disp * h.save), cons = disp - sav, food = Math.round(cons * h.engel);
  return { inc, non, disp, sav, cons, food, engel: food / cons, stat: Math.round(cons * 0.0028) };
}
const HH0 = hhBook(econDefaults().hh);
const hhMul = () => Math.pow(hhBook().disp / HH0.disp, 1.3) / Math.pow(1.012, (yearOf(S.day) - 2000));   // 物価も上がるので年の分を割る
const econMul = () => (S.econ.phase === '好景気' ? 1.06 : S.econ.phase === '不景気' ? (S.econ.policy === 'big' ? 0.92 : 0.86) : 1) * clamp(hhMul(), 0.75, 1.25);
// ---------- 生産の三要素（自分の会社） ----------
function factors() {
  const O = OFFICES[S.tier], eqVal = ['chair', 'monitor', 'lab'].reduce((a, k) => a + EQUIP[k].price.slice(0, S.equip[k]).reduce((x, y) => x + y, 0), 0) + EQUIP.line.price.slice(0, S.equip.line).reduce((x, y) => x + y, 0) + (S.furn || []).reduce((a, f) => a + FURN[f.type].price, 0);
  return { land: O.w * O.d, forest: S.corp.forest, labor: S.staff.length, wage: S.staff.reduce((a, m) => a + m.sal, 0), capital: eqVal, line: S.equip.line };
}
// ---------- 製品：1本あたりの付加価値・需要と供給 ----------
const addedPer = p => p.price - costOf(p);
// その値段のときの1日の需要（ほかの条件は今のまま）
function demandAt(p, price) {
  const month = dateOf(S.day).getMonth(), k = p.kind, mine = S.products.filter(o => o.active && o.kind === k);
  const old = p.price; p.price = price;
  const As = mine.map(o => productA(o, month)), rA = S.rivals.reduce((a, r) => a + rivalA(r, k), 0), tot = As.reduce((a, b) => a + b, 0) + rA + 1.5;
  const i = mine.indexOf(p), d = i >= 0 ? kindDemand(k) * As[i] / tot : 0; p.price = old; return d;
}
// 供給曲線：工場は「標準の値段（おすすめ価格）で売れる数」を基準に、値段が高いほど多く作りたい（右上がり）
function supplyBase(p) { p.Pr = recPrice(p); p.Q0 = demandAt(p, p.Pr); }
const supplyAt = (p, price) => (p.Q0 || 0) * Math.min(1.8, Math.pow(Math.max(0.01, price) / Math.max(0.01, p.Pr || price), 0.8)) * PLAN[p.plan || 'mid'].f;   // 作れる数には上限がある
// 均衡価格：需要曲線と供給曲線（工場の能力も入れる）が交わる値段
function balPrice(p) {
  const f = Math.min(1, S.capF || 1); let lo = costOf(p) * 1.01, hi = Math.max(p.price * 4, costOf(p) * 6);
  for (let k = 0; k < 36; k++) { const m = (lo + hi) / 2; if (demandAt(p, m) > supplyAt(p, m) * f) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
const niceP = v => v < 100 ? Math.max(1, Math.round(v)) : v < 1000 ? Math.round(v / 5) * 5 : v < 10000 ? Math.round(v / 10) * 10 : Math.round(v / 100) * 100;
// 1週間ごと：売れ残り・品薄の判定と、価格の自動調節
function econWeek() {
  for (const p of S.products.filter(o => o.active)) {
    p.wDemL = p.wDem || 0; p.wProdL = (p.wProd || 0) / 7; p.wShortL = p.wShort || 0; p.wDem = 0; p.wProd = 0; p.wShort = 0; supplyBase(p);
    const days = p.dEMA > 0.01 ? (p.stock || 0) / p.dEMA : 0, shortR = p.wDemL > 0 ? p.wShortL / p.wDemL : 0;
    p.state = days > 10 && p.wProdL * 7 > p.wDemL * 1.05 ? 'over' : shortR > 0.06 ? 'short' : 'ok';
    if (p.state === 'over' && (!p.warnO || S.day - p.warnO > 70)) { p.warnO = S.day; const cx = `「${p.name}」が売れ残り、在庫が${Math.round(days)}日分になった。値段を下げると売れやすい`; if (S.learn.seen['超過供給']) { if (!LEARN.again('超過供給', cx)) UI.toast(`「${p.name}」が売れ残っています（超過供給）`, 'bad'); } else learn('超過供給', cx); }
    if (p.state === 'short' && (!p.warnS || S.day - p.warnS > 70)) { p.warnS = S.day; const cx = `「${p.name}」が${Math.round(shortR * 100)}%品切れした。値段を上げても売れそう`; if (S.learn.seen['超過需要']) { if (!LEARN.again('超過需要', cx)) UI.toast(`「${p.name}」が品薄です（超過需要）`, 'gold'); } else learn('超過需要', cx); }
    if (p.auto && !(S.ev.cartel && S.day < S.ev.cartel.until)) {   // 神の見えざる手：売れ残れば下げ、品薄なら上げる
      const c = costOf(p), P0 = p.price; let P = P0;
      if (p.state === 'over') P = P0 * (days > 30 ? 0.93 : 0.97); else if (p.state === 'short') P = P0 * (shortR > 0.3 ? 1.08 : 1.04); else { const pe = balPrice(p); P = P0 + (pe - P0) * 0.25; }
      P = niceP(clamp(P, c * 1.03, c * 30)); if (P !== P0) { p.price = P; p.autoLog = (p.autoLog || []).concat([[S.day, P]]).slice(-12); }
    }
  }
}
// ---------- 1か月：GDP・景気・家計・公共料金・配当・出来事 ----------
function econMonth(date) {
  const E = S.econ, m = date.getMonth(), y = date.getFullYear();
  // 景気
  if (E.left > 0) { E.left--; if (!E.left) { const was = E.phase; E.phase = 'ふつう'; if (was === '不景気') { news(`景気が回復した。${E.policy === 'big' ? '政府の公共事業や給付金（大きな政府）が早めの回復を助けた' : '減税で企業や家計が動きやすくなった（小さな政府）'}`); learn('混合経済', '不景気のあと、政府の方針を選んだ'); E.policy = ''; } } }
  else if (S.day > 200) {
    const r = Math.random();
    if ((y === 2008 && m === 9) || (r < 0.012 && S.day > 900)) { E.phase = '不景気'; E.left = ri(10, 16); econEvent('recession'); }
    else if (r < 0.04) { E.phase = '好景気'; E.left = ri(6, 12); news('景気がよくなってきた（好景気）。家計の所得が増え、文房具もよく売れる'); }
  }
  E.g = E.phase === '好景気' ? 0.03 : E.phase === '不景気' ? -0.025 : 0.012;
  E.gdp *= 1 + E.g / 12 + rr(-0.001, 0.001);
  S.hh.inc = Math.round(S.hh.inc * (1 + E.g / 12 * 0.8));
  S.hh.engel = clamp(S.hh.engel + (E.phase === '不景気' ? 0.004 : -0.0015), 0.22, 0.33);
  E.hist.push(Math.round(E.gdp / 1e12)); if (E.hist.length > 48) E.hist.shift();
  // GDPのニュース（3か月ごと）
  if (m % 3 === 2) news(`GDP（国内総生産）は約${Math.round(E.gdp / 1e12)}兆円、年率${E.g >= 0 ? '+' : ''}${(E.g * 100).toFixed(1)}%。GDPは国内で生まれた付加価値の合計`), learn('GDP（国内総生産）', 'GDPのニュース');
  // 税金・社会保険料（非消費支出）が変わる
  if (S.day > 300 && Math.random() < 0.025) {
    const up = Math.random() < 0.5; S.hh.tax = clamp(S.hh.tax + (up ? 0.01 : -0.01), 0.15, 0.26);
    news(up ? '社会保険料が上がった。家計の非消費支出が増え、可処分所得（実際に使えるお金）が減る' : '所得税の減税が決まった。家計の非消費支出が減り、可処分所得が増える');
    learn('非消費支出', up ? '社会保険料の値上げ' : '所得税の減税'); learn('可処分所得', '税金のニュース');
  }
  // 公共料金
  if (S.day > 400 && Math.random() < 0.02) { E.util *= 1.08; news('電気・ガス料金の値上げを国が認めた（公共料金は国民の生活に直接影響するので国が決める）'); learn('公共料金', '電気・ガス料金の値上げ'); }
  // グループ会社・株式
  corpMonth(date);
  // 出来事（3か月に1回くらい）
  if (S.day - S.ev.last > 80 && S.day > 120 && Math.random() < 0.3) {
    const can = [];
    if (S.tier >= 1 && S.stats.launched >= 4 && !S.ev.cartel) can.push('cartel');
    if (S.products.some(p => p.active && (p.kind === 'fountain' || p.kind === 'ball')) && !S.ev.door) can.push('door');
    if (S.stats.launched >= 3 && !S.ev.lie) can.push('lie');
    if (S.products.some(p => p.active)) can.push('public', 'public');
    if (can.length) econEvent(pick(can));
  }
  // カルテル：公正取引委員会に見つかるかも
  const C = S.ev.cartel;
  if (C && !C.done) {
    if (Math.random() < 0.22) { C.done = true; const fine = Math.max(5e6, Math.round(C.rev * 0.1)); S.money -= fine; S.brand = clamp(S.brand - 0.12, 0.4, 1.8); news(`公正取引委員会が、独占禁止法違反（カルテル）で${yen(fine)}の課徴金を命じた`); UI.toast(`カルテルが見つかった！ 課徴金 ${yen(fine)}・評判ダウン`, 'bad'); AU.bad(); learn('公正取引委員会', 'カルテルが見つかった'); LEARN.ask('カルテル', 'カルテルが見つかった'); }
    else if (S.day >= C.until) { C.done = true; news('カルテルの約束が終わった。見つからなかったが、違法な行為だった'); }
  }
  // うその宣伝：消費者契約法で取り消し
  const Lx = S.ev.lie;
  if (Lx && !Lx.done && S.day >= Lx.until) { Lx.done = true; const back = Math.round(Lx.rev * 0.3); S.money -= back; S.brand = clamp(S.brand - 0.1, 0.4, 1.8); news(`うそのセールストークで結んだ契約が、消費者契約法で取り消された。${yen(back)}を返金`); UI.toast(`消費者契約法で契約を取り消された（返金 ${yen(back)}）`, 'bad'); learn('消費者契約法', 'うそのセールストークの契約が取り消された'); LEARN.ask('消費者契約法'); }
}
// ---------- グループ会社・株式（毎月） ----------
function corpMonth(date) {
  const K = S.corp, m = date.getMonth();
  if (K.subs.includes('it')) S.brand = clamp(S.brand + 0.004, 0.4, 1.8);
  if (K.forest) { const inc = K.forest * 250000; S.money += inc; S.stats.primaryMonth = inc; }
  if (!K.listed) return;
  const per = Math.max(1, S.stats.value) / K.shares; K.sp = Math.max(1, Math.round(per * rr(0.92, 1.08)));
  if (K.yutai) { const c = Math.round(S.stats.lastMonthRev * 0.002); S.money -= c; S.brand = clamp(S.brand + 0.003, 0.4, 1.8); }
  if (m % 3 === 2) {   // 決算：配当
    const prof = Math.max(0, S.stats.lastMonthProfit) * 3, div = Math.round(prof * 0.3 * K.outside / K.shares);
    if (div > 0) { S.money -= div; K.lastDiv = div; news(`決算：株主に配当 ${yen(div)} をはらった（1株あたり ${(div / K.outside).toFixed(1)}円）`); learn('配当', '決算で配当をはらった'); }
  }
  if (m === 5) {   // 株主総会（6月）
    const up = K.sp0 ? K.sp / K.sp0 : 1, yes = clamp(0.5 + (up - 1) * 1.2 + (K.yutai ? 0.06 : 0) + (S.brand - 1) * 0.1 + rr(-0.05, 0.08), 0.2, 0.97), y = Math.round(K.outside * yes / 100) * 100;
    K.sp0 = K.sp; S.ev.agm = { day: S.day, yes: y, no: K.outside - y, ok: yes >= 0.5 };
    if (yes < 0.5) S.brand = clamp(S.brand - 0.05, 0.4, 1.8);
    econEvent('agm');
  }
}
// ---------- 出来事（選べるものはモーダルで） ----------
function econEvent(id) {
  S.ev.last = S.day; S.ev.seen[id] = (S.ev.seen[id] || 0) + 1;
  const best = S.products.filter(p => p.active).sort((a, b) => (b.lastWeek || 0) - (a.lastWeek || 0))[0];
  if (id === 'recession') {
    news('世界的な金融の混乱で、不景気になった。会社の売上や家計の所得が下がる'); learn('ケインズ', '不景気のニュース'); learn('エンゲル係数', '不景気で食費の割合が上がる');
    UI.choice('不景気になった', `<p>世界的な金融の混乱で<b>不景気</b>になりました。お客さんの家計の所得が下がり、文房具が売れにくくなります。</p><p>政府の経済担当として、方針をえらんでください。</p><p class="muted">1929年の世界恐慌のあと、経済学者<b>ケインズ</b>は「政府が市場に介入して問題を解決する」考え方を理論づけました。</p>`, [
      { label: '大きな政府', sub: '公共事業や給付金で、政府が市場に介入する。売れゆきの落ち込みが小さい', fn: () => { S.econ.policy = 'big'; S.hh.tax = clamp(S.hh.tax + 0.005, 0.15, 0.26); learn('大きな政府', '不景気で政府の方針を選んだ'); LEARN.ask('大きな政府'); } },
      { label: '小さな政府', sub: '介入は少なく、減税して市場に委ねる。可処分所得が増える', fn: () => { S.econ.policy = 'small'; S.hh.tax = clamp(S.hh.tax - 0.01, 0.15, 0.26); learn('小さな政府', '不景気で政府の方針を選んだ'); LEARN.ask('小さな政府'); } },
    ]);
  } else if (id === 'cartel') {
    const RV = pick(RIVALS);
    UI.choice('ライバルからのさそい', `<p><b>${esc(RV.name)}</b>の役員から、こっそり連絡が来ました。</p><blockquote>「おたがい値下げ競争はやめて、来年まで<b>値段をそろえませんか</b>？ もうけが増えますよ」</blockquote><p class="muted">同業他社と価格や生産量を前もって話し合い、競争を抑えることを<b>カルテル</b>といいます。</p>`, [
      { label: '参加する', sub: '半年間よく売れる。でも見つかると課徴金と評判ダウン', fn: () => { S.ev.cartel = { until: S.day + 180, rev: 0 }; learn('カルテル', 'ライバルからさそわれた'); learn('独占禁止法', 'カルテルは独占禁止法違反'); UI.toast('カルテルに参加した…（独占禁止法違反）', 'bad'); } },
      { label: 'ことわる', sub: '自由競争を守る。評判が少し上がる', fn: () => { S.ev.cartel = { until: S.day, rev: 0, done: true, no: true }; S.brand = clamp(S.brand + 0.02, 0.4, 1.8); learn('カルテル', 'ライバルからさそわれた'); learn('独占禁止法', 'カルテルをことわった'); learn('自由競争', 'カルテルをことわった'); UI.toast('ことわった。自由競争を守る会社として評判アップ', 'good'); LEARN.ask('カルテル'); } },
    ]);
  } else if (id === 'door') {
    const p = S.products.filter(o => o.active && (o.kind === 'fountain' || o.kind === 'ball')).sort((a, b) => b.price - a.price)[0]; if (!p) return;
    const n = Math.round(400 * (S.tier + 1) * (p.kind === 'fountain' ? 1 : 3)), rev = n * p.price;
    UI.choice('訪問販売の話', `<p>販売会社から「<b>${esc(p.name)}</b>を家庭への<b>訪問販売</b>で売りませんか？」と話が来ました。約${num(n)}本、${yen(rev)}の売上になりそうです。</p>`, [
      { label: '訪問販売をする', sub: 'すぐ売上が入る。ただし…', fn: () => { const c = costOf(p); S.money += n * (p.price - c); p.units += n; p.revenue += rev; S.ev.door = { day: S.day, n, price: p.price, cost: c, name: p.name }; UI.toast(`訪問販売で${num(n)}本売れた！`, 'good'); learn('消費者問題', '訪問販売'); } },
      { label: 'やめておく', sub: 'お店での販売を大切にする', fn: () => { S.ev.door = { day: S.day, n: 0 }; learn('クーリング・オフ制度', '訪問販売の話'); UI.toast('訪問販売はしなかった。訪問販売には、一定期間なら契約を解除できる「クーリング・オフ制度」がある', ''); } },
    ]);
  } else if (id === 'lie') {
    UI.choice('強引な販売会社', `<p>販売代理店から「<b>“テストで点が上がる魔法のペン”</b>と宣伝すれば、もっと売れますよ。<b>うそ</b>でもバレません」と言われました。</p>`, [
      { label: 'その宣伝で売る', sub: '2か月よく売れる。でも…', fn: () => { S.ev.lie = { until: S.day + 60, rev: 0 }; learn('消費者問題', 'うそのセールストーク'); UI.toast('うその宣伝を始めた…', 'bad'); } },
      { label: 'ことわる', sub: '正直な宣伝で評判が少し上がる', fn: () => { S.ev.lie = { until: S.day, rev: 0, done: true }; S.brand = clamp(S.brand + 0.02, 0.4, 1.8); learn('消費者契約法', 'うその宣伝をことわった'); UI.toast('ことわった。うそや脅迫で結んだ契約は「消費者契約法」で取り消せる', 'good'); LEARN.ask('消費者契約法'); } },
    ]);
  } else if (id === 'public') {
    if (!best) return; const who = pick(['市営バス', '県の水道局', '市立図書館', '町の病院（公立）']), n = Math.round(1500 * (S.tier + 1)), pr = Math.round(best.price * 0.9), prof = n * (pr - costOf(best));
    UI.choice('公企業からの注文', `<p><b>${who}</b>から、「${esc(best.name)}」を${num(n)}本、1本${yen(pr)}（いつもの1割引）で買いたいという注文が来ました。</p><p class="muted">${who}のように、地方自治体（国）が出資している企業を<b>公企業</b>といいます。あなたの会社のように利益を目的にする会社は<b>私企業</b>です。</p>`, [
      { label: '引き受ける', sub: `もうけ 約${yen(prof)}`, fn: () => { S.money += prof; best.units += n; best.revenue += n * pr; learn('公企業', `${who}からの注文`); learn('私企業', '公企業からの注文'); UI.toast(`${who}に${num(n)}本納めた（${yen(prof, true)}）`, 'good'); LEARN.ask('公企業'); } },
      { label: 'ことわる', sub: '', fn: () => { learn('公企業', `${who}からの注文`); } },
    ]);
  } else if (id === 'agm') {
    const A = S.ev.agm;
    UI.choice('株主総会', `<p>6月の<b>株主総会</b>が開かれました。社長の続投について、株主が投票します（<b>一株一票</b>）。</p><div class="kv"><span>賛成</span><b>${num(A.yes)}株</b><span>反対</span><b>${num(A.no)}株</b></div><p>${A.ok ? '賛成多数で、これからも社長です！' : '反対が多かった…。株主の信頼を取りもどそう（評判ダウン）'}</p><p class="muted">株価が上がる・配当や株主優待があると、賛成がふえます。</p>`, [{ label: 'OK', sub: '', fn: () => { learn('株主総会', '株主総会が開かれた'); LEARN.ask('株主総会'); } }]);
  }
}
// 訪問販売のクーリング・オフ（8日以内）
function econDay() {
  if (S.day === 3) learn('私企業', 'あなたの会社は株式会社（利益を目的にする私企業）');
  const D = S.ev.door;
  if (D && D.n && !D.cooled && S.day - D.day >= 8) {
    D.cooled = true; const back = Math.round(D.n * rr(0.15, 0.25)), loss = back * (D.price - D.cost);
    S.money -= loss; news(`訪問販売で売った「${D.name}」のうち${num(back)}本が、クーリング・オフ制度で契約解除された`); UI.toast(`クーリング・オフで${num(back)}本が返品（${yen(-loss)}）`, 'bad'); learn('クーリング・オフ制度', '訪問販売のあと契約解除された'); LEARN.ask('クーリング・オフ制度');
  }
}
// ---------- 欠陥商品（不具合を残して発売）：PL法 ----------
function plCheck() {
  for (const p of S.products) {
    if (!p.active || !p.defects) continue;
    if (Math.random() < 0.03 * p.defects) {
      const pay = Math.max(3e6, Math.round(p.revenue * 0.05)); S.money -= pay; S.brand = clamp(S.brand - 0.06, 0.4, 1.8); p.defects--;
      news(`「${p.name}」の欠陥でけが人が出た。PL法（製造物責任法）により、会社の過失が証明されなくても損害賠償 ${yen(pay)}`);
      UI.toast(`欠陥商品の事故！ PL法で損害賠償 ${yen(pay)}・リコール`, 'bad'); AU.bad(); learn('PL法（製造物責任法）', `「${p.name}」の欠陥で事故`); learn('消費者問題', '欠陥商品'); LEARN.ask('PL法（製造物責任法）');
    }
  }
}
// ---------- 会社の決定：森林・直営店・ホールディングス・子会社・上場・CSR ----------
function buyForest() { const n = S.corp.forest, pr = FOREST_PRICE[n]; if (pr == null || S.money < pr) return false; S.money -= pr; S.corp.forest++; S.stats.invest = (S.stats.invest || 0) + pr; learn('第1次・第2次・第3次産業', '森林を買った（林業＝第1次産業）'); learn('土地', '森林（天然物）は土地'); news('森林を買った。林業は第1次産業。木軸の材料が安くなるが、林業そのもののもうけ（付加価値）は小さい'); return true; }
function buyStore() { const n = S.corp.stores, pr = STORE_PRICE[n]; if (pr == null || S.tier < 1 || S.money < pr) return false; S.money -= pr; S.corp.stores++; S.stats.invest = (S.stats.invest || 0) + pr; learn('第1次・第2次・第3次産業', '直営店を出した（小売業＝第3次産業）'); learn('投資', '直営店を出した'); news(`直営店 ${S.corp.stores}号店をオープン！ 小売業は第3次産業。お店のもうけ（付加価値）も自分の会社に入る`); return true; }
function makeHD() { if (S.corp.hd || S.tier < 2 || S.money < 1e8) return false; S.money -= 1e8; S.corp.hd = true; if (!/ホールディングス$/.test(S.company)) S.company = S.company.slice(0, 10) + 'ホールディングス'; learn('ホールディングス', '持株会社をつくった'); news(`持株会社「${S.company}」をつくった。グループの会社をまとめて支配する`); return true; }
function buySub(id) {
  const s = SUBS.find(x => x.id === id), K = S.corp; if (!s || !K.hd || K.subs.includes(id) || S.money < s.price) return false;
  S.money -= s.price; K.subs.push(id); news(`${s.name}（${s.ind}）をグループに入れた`);
  if (K.subs.length >= 2) learn('コンツェルン', 'ちがう業種の会社をグループに入れた');
  return true;
}
function listIPO() {
  const K = S.corp; if (K.listed || S.tier < 2 || S.stats.launched < 8) return false;
  K.listed = true; K.shares = 10000000; K.outside = 3000000; K.sp = Math.max(1, Math.round(Math.max(1e8, S.stats.value) / K.shares)); K.sp0 = K.sp;
  const raise = K.sp * K.outside; S.money += raise; S.stats.ipo = raise;
  news(`証券取引所に上場した！ 株式${num(K.outside)}株を売り出し、${yen(raise)}を集めた`); learn('株式', '上場して株を売り出した'); learn('証券取引所', '上場した'); learn('株主', '株を買った人が株主になった');
  return raise;
}
function doCSR(id) {
  const a = CSR_ACTS.find(x => x.id === id), last = S.corp.csr[id]; if (!a || (last != null && S.day - last < 365)) return false;
  const cost = a.base * (S.tier + 1); if (S.money < cost) return false;
  S.money -= cost; S.corp.csr[id] = S.day; S.brand = clamp(S.brand + a.brand, 0.4, 1.8); learn('CSR（企業の社会的責任）', a.name);
  news(`${a.name}を行った。企業の社会的責任（CSR）を果たす会社として評判が上がった`); return cost;
}
// 独占・寡占の判定（シェア画面）
function marketForm(k) {
  const sh = S.share[k]; if (!sh) return '';
  const all = [sh.me, ...sh.rivals].sort((a, b) => b - a), t3 = all.slice(0, 3).reduce((a, b) => a + b, 0);
  return all[0] > 0.6 ? '独占に近い' : t3 > 0.75 ? '寡占' : '自由競争';
}
