// =========================================================================================
//  画面：上のバー・下のメニュー・シート（開発／製品／研究／スタッフ／会社／事務所）・開発スタジオ・発売とレビュー
// =========================================================================================
const SVG = {
  dev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/><path d="M19 15v4M17 17h4"/></svg>',
  prod: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>',
  res: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/></svg>',
  staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2c3 .2 5.5 2.6 5.5 5.8"/></svg>',
  co: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V9l5-3v14"/><path d="M9 20V4l7 3v13"/><path d="M16 20v-9l4 2v7"/><path d="M2 20h20"/></svg>',
  office: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-5h6v5"/></svg>',
};
// 種類のアイコン（開発のカード）
const KSVG = {
  pencil: '<svg viewBox="0 0 48 48"><g transform="rotate(-40 24 24)"><rect x="8" y="20" width="26" height="8" rx="1" fill="#2e9a63"/><path d="M34 20l8 4-8 4z" fill="#e8c79a"/><path d="M40 23l2 1-2 1z" fill="#333"/><rect x="5" y="20" width="4" height="8" fill="#c9a24e"/><rect x="2" y="20.5" width="3.5" height="7" rx="1.5" fill="#f2a7b8"/></g></svg>',
  eraser: '<svg viewBox="0 0 48 48"><g transform="rotate(-18 24 24)"><rect x="6" y="15" width="36" height="18" rx="3" fill="#f6f4ee" stroke="#ccc"/><rect x="15" y="14" width="25" height="20" fill="#2b6fd6"/><rect x="15" y="20" width="25" height="3" fill="#1d1d1f"/><rect x="15" y="26" width="25" height="3" fill="#1d1d1f"/></g></svg>',
  lead: '<svg viewBox="0 0 48 48"><rect x="8" y="14" width="28" height="20" rx="3" fill="#2a2a2e"/><rect x="34" y="14" width="7" height="20" rx="2" fill="#2b6fd6"/><rect x="12" y="19" width="18" height="10" rx="1" fill="#fff"/><path d="M14 22h10M14 26h6" stroke="#333" stroke-width="1.6"/></svg>',
  mech: '<svg viewBox="0 0 48 48"><g transform="rotate(-40 24 24)"><rect x="6" y="21" width="22" height="6" rx="2" fill="#24438f"/><rect x="28" y="20.5" width="9" height="7" rx="2" fill="#333"/><path d="M37 21.5l5 2.5-5 2.5z" fill="#bbb"/><rect x="2" y="21.5" width="5" height="5" rx="1.5" fill="#ccc"/><rect x="8" y="18.5" width="11" height="2" fill="#bbb"/></g></svg>',
  ball: '<svg viewBox="0 0 48 48"><g transform="rotate(-40 24 24)"><rect x="6" y="20.5" width="24" height="7" rx="3" fill="#f6f4ee" stroke="#ccc"/><rect x="28" y="20.5" width="8" height="7" rx="2" fill="#2b6fd6"/><path d="M36 21.5l6 2.5-6 2.5z" fill="#bbb"/><rect x="2" y="21.5" width="5" height="5" rx="2" fill="#2b6fd6"/><rect x="8" y="17.5" width="12" height="2.4" fill="#2b6fd6"/></g></svg>',
  fountain: '<svg viewBox="0 0 48 48"><g transform="rotate(-40 24 24)"><rect x="4" y="20" width="24" height="8" rx="3.5" fill="#1d1d1f"/><rect x="26" y="20" width="2" height="8" fill="#d4a83a"/><rect x="28" y="21" width="5" height="6" rx="1" fill="#1d1d1f"/><path d="M33 21l10 3-10 3z" fill="#e8bf67"/><path d="M36 24h6" stroke="#5a4512" stroke-width=".8"/></g></svg>',
};
const stars10 = v => { const n = Math.round(v / 2); return '★'.repeat(n) + '☆'.repeat(5 - n); };
const NAME_PARTS = { a: ['なめらか', 'くっきり', 'さらさら', 'ふわり', 'きらり', 'しっかり', 'のびのび', 'すいすい', 'まなび', 'ひらめき', 'そよかぜ', 'ほしぞら', 'あおぞら', 'こもれび'], k: { pencil: 'えんぴつ', eraser: 'けしゴム', lead: '芯', mech: 'シャープ', ball: 'ペン', fountain: '万年筆' } };
const randName = k => pick(NAME_PARTS.a) + NAME_PARTS.k[k] + (Math.random() < 0.35 ? ' ' + pick(['Lite', 'Pro', 'S', '2', 'Neo', 'Air', 'Plus']) : '');

const UI = {
  tab: null, sub: {}, dirtyF: true, refreshT: 0, studio: null, queue: [], modalOpen: false, newsQ: [], newsX: 0, newsW: 0, topT: 0,
  init() {
    const nav = $('nav'); nav.innerHTML = [['dev', '開発'], ['prod', '製品'], ['res', '研究'], ['staff', 'スタッフ'], ['co', '会社'], ['office', '事務所']].map(([k, n]) => `<button type="button" data-tab="${k}">${SVG[k]}<span>${n}</span><i class="dot"></i></button>`).join('');
    nav.onclick = e => { const b = e.target.closest('button'); if (!b) return; AU.resume(); AU.click(); this.open(this.tab === b.dataset.tab ? null : b.dataset.tab); };
    $('speed').onclick = e => { const b = e.target.closest('button'); if (!b || !S) return; AU.resume(); AU.click(); S.speed = +b.dataset.s; this.topT = 0; };
    $('menuB').onclick = () => { AU.resume(); AU.click(); this.open(this.tab === 'menu' ? null : 'menu'); };
    $('shClose').onclick = () => this.open(null);
    $('stClose').onclick = () => this.closeStudio();
    $('goal').onclick = () => { const g = GOALS[S.goal]; if (!g) return; this.open({ g1: 'dev', g2: 'staff', g3: 'res', g4: 'dev', g6: 'office', g9: 'co', g10: 'office', g12: 'co', g13: 'co', g14: 'office' }[g.id] || 'co'); };
    // ボタンなどのクリックはまとめて受ける
    for (const id of ['shBody', 'shTabs', 'stBody', 'stTabs', 'stFoot', 'modalBox']) $(id).addEventListener('click', e => this.onClick(e));
    $('stBody').addEventListener('input', e => this.onInput(e)); $('shBody').addEventListener('change', e => this.onInput(e)); $('modalBox').addEventListener('input', e => this.onInput(e));
    $('stBody').addEventListener('change', e => this.onInput(e));
  },
  // ---------- 毎フレーム ----------
  update(dt) {
    if (!S) return;
    this.topT -= dt;
    if (this.topT <= 0) {
      this.topT = 0.1;
      $('coName').textContent = S.company; $('date').textContent = dateStr(S.day);
      const m = $('money'); m.textContent = yen(S.money); m.classList.toggle('neg', S.money < 0);
      $('rp').textContent = Math.floor(S.rp) + ' RP';
      for (const b of $('speed').children) b.classList.toggle('on', +b.dataset.s === S.speed && !this.paused());
      const dots = $('nav').querySelectorAll('i.dot');
      dots[0].classList.toggle('on', S.devs.some(v => v.ready)); dots[2].classList.toggle('on', !S.research.cur && RESEARCH.some(r => resState(r) === 'can' && S.rp >= r.rp));
      const g = GOALS[S.goal], gb = $('goal');
      gb.classList.toggle('hidden', !g || !!this.tab || !!this.studio);
      if (g) { const html = `<b>目標</b>${esc(g.text)}${g.hint ? `<small>${esc(g.hint)}</small>` : ''}<small>ごほうび：${g.reward.money ? yen(g.reward.money) + '・' : ''}${g.reward.rp} RP</small>`; if (gb._h !== html) { gb.innerHTML = html; gb._h = html; } }
    }
    // ニュースの帯
    const nt = $('newsT');
    if (this.newsX < -this.newsW - 20) { const t = this.newsQ.shift() || (S.news[(Math.random() * Math.min(6, S.news.length)) | 0] || {}).t; if (t) { nt.textContent = '📰 ' + t; this.newsW = nt.offsetWidth; this.newsX = $('news').offsetWidth; } else this.newsX = -this.newsW - 21; }
    this.newsX -= dt * 70; nt.style.transform = `translateX(${this.newsX}px)`;
    // 開いているシートの中身（ゆっくり書きかえる）
    this.refreshT -= dt;
    if (this.tab && (this.dirtyF || this.refreshT <= 0) && !this.editing()) { this.render(); this.dirtyF = false; this.refreshT = 0.6; }
    if (this.studio && this.studio.dirty) { this.studio.dirty = false; this.renderStudio(); }
    if (this.queue.length && !this.modalOpen && !this.studio) { const id = this.queue.shift(); if (S.devs.find(v => v.id === id && v.ready)) this.launchModal(id); }
  },
  paused() { return !!this.studio || this.modalOpen || S.speed === 0; },
  editing() { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'SELECT') && $('sheet').contains(a); },
  dirty() { this.dirtyF = true; },
  readyQueue(id) { if (!this.queue.includes(id)) this.queue.push(id); },
  toast(t, kind = '') { const box = $('toasts'), d = document.createElement('div'); d.className = 'toast ' + kind; d.textContent = t; box.prepend(d); while (box.children.length > 4) box.lastChild.remove(); setTimeout(() => d.remove(), 4800); },
  newsTick(t) { this.newsQ.push(t); if (this.newsQ.length > 5) this.newsQ.shift(); },
  // ---------- シート ----------
  open(tab) {
    this.tab = tab; $('sheet').classList.toggle('on', !!tab); document.body.classList.toggle('sheeton', !!tab);
    for (const b of $('nav').children) b.classList.toggle('on', b.dataset.tab === tab);
    if (tab) { $('shBody').scrollTop = 0; this.render(); }
  },
  render() {
    const t = this.tab, body = $('shBody'), st = body.scrollTop;
    const titles = { dev: '開発', prod: '製品', res: '研究', staff: 'スタッフ', co: '会社', office: '事務所', menu: 'メニュー' };
    $('shTitle').textContent = titles[t] || '';
    let tabs = '', html = '';
    if (t === 'dev') html = this.pDev();
    else if (t === 'prod') { const s = this.sub.prod || 'on'; tabs = this.tabsHtml('prod', { on: '販売中', off: '販売終了' }, s); html = this.pProd(s); }
    else if (t === 'res') { const s = this.sub.res || 'gen'; tabs = this.tabsHtml('res', RES_CATS, s); html = this.pRes(s); }
    else if (t === 'staff') { const s = this.sub.staff || 'list'; tabs = this.tabsHtml('staff', { list: '社員', hire: '採用' }, s); html = this.pStaff(s); }
    else if (t === 'co') { const s = this.sub.co || 'sum'; tabs = this.tabsHtml('co', { sum: 'まとめ', share: 'シェア', mkt: '売る地域', rival: 'ライバル', goal: '目標' }, s); html = this.pCo(s); }
    else if (t === 'office') html = this.pOffice();
    else if (t === 'menu') html = this.pMenu();
    $('shTabs').innerHTML = tabs; $('shTabs').classList.toggle('hidden', !tabs);
    body.innerHTML = html; body.scrollTop = st;
  },
  tabsHtml(key, map, cur) { return Object.entries(map).map(([k, n]) => `<button type="button" class="${k === cur ? 'on' : ''}" data-act="sub" data-k="${key}" data-v="${k}">${esc(n)}</button>`).join(''); },
  // 開発
  pDev() {
    let h = '';
    const slots = OFFICES[S.tier].slots;
    h += `<div class="muted" style="margin:2px 0 8px">同時に開発できる数：${S.devs.length} / ${slots}</div>`;
    for (const v of S.devs) {
      const prog = 1 - v.left / v.days, found = devFound(v), rest = Math.ceil(v.bugs - v.fixed), openB = Math.max(0, Math.ceil(found - v.fixed));
      h += `<div class="card"><div class="row sb"><h3>${esc(v.name)}</h3><span class="pill">${KINDS[v.kind].short}</span></div>`;
      if (v.ready) h += `<div class="row sb"><span class="pill green">完成！</span><button class="btn green" data-act="launchM" data-id="${v.id}" type="button">発売する</button></div>`;
      else {
        h += `<div class="muted">開発 ${Math.floor(prog * 100)}%　のこり ${Math.ceil(v.left)} 日</div><div class="bar"><i style="width:${prog * 100}%"></i></div>`;
        h += `<div class="muted" style="margin-top:6px">不具合：見つかった ${found} 件のうち ${Math.floor(v.fixed)} 件直した（全部で約 ${v.bugs} 件）</div><div class="bar r"><i style="width:${(v.fixed / v.bugs) * 100}%"></i></div>`;
        h += `<div class="row" style="margin-top:8px;gap:6px"><button class="btn sub small" data-act="fixRP" data-id="${v.id}" type="button" ${S.rp < rest * 3 || rest <= 0 ? 'disabled' : ''}>RPで全部直す（${rest * 3} RP）</button><span class="muted">${openB ? '品質チェックの人が直しています' : ''}</span></div>`;
      }
      h += '</div>';
    }
    h += `<div class="grp">新しく作る</div>`;
    for (const k of KIND_IDS) {
      const open = kindOpen(k), K = KINDS[k], r = K.unlock ? RES_BY_ID[K.unlock] : null, mine = S.products.filter(p => p.kind === k).length;
      h += `<div class="card kind" ${open ? `data-act="newDev" data-k="${k}"` : ''} style="${open ? '' : 'opacity:.55'}"><div class="ic">${KSVG[k]}</div><div style="flex:1"><h3 style="margin:0">${K.name}</h3><div class="muted">${open ? `開発費 約${yen(K.dev)}〜・${K.days}日〜${mine ? `・発売 ${mine}こ` : ''}` : `研究「${r.name}」が必要`}</div></div>${open ? '<span class="pill blue">作る</span>' : '<span class="pill">🔒</span>'}</div>`;
    }
    return h;
  },
  // 製品
  pProd(s) {
    const list = S.products.filter(p => (s === 'on') === p.active).slice().reverse();
    if (!list.length) return `<div class="list-empty">${s === 'on' ? 'まだ売っている製品がありません。<br>「開発」から作ってみよう' : '販売を終えた製品はありません'}</div>`;
    let h = '';
    if (s === 'on' && S.capUse > 1) h += `<div class="card" style="border-color:#e8b0a8"><b style="color:var(--red)">生産が追いついていません</b><div class="muted">注文の ${Math.round(100 / S.capUse)}% しか作れていない。「事務所」で生産ラインを強くしよう</div></div>`;
    for (const p of list) {
      const sc = currentScore(p);
      h += `<div class="card"><div class="prod"><img alt="" src="${productThumb(p)}"><div><div class="row sb"><h3 style="margin:0">${esc(p.name)}</h3><span class="pill">${KINDS[p.kind].short}</span></div>
        <div class="row" style="gap:8px;margin:3px 0"><span class="stars">${stars10(p.review)}</span><b>${p.review.toFixed(1)}</b><span class="muted">いまの評価 ${sc.R.toFixed(1)}</span></div>
        <div class="kv"><span>値段</span><b>${yen(p.price)}（原価 ${yen(costOf(p))}）</b><span>先週</span><b>${num(p.lastWeek)} こ</b><span>売れた数</span><b>${num(p.units)} こ</b><span>利益</span><b>${yen(p.profit - (p.devCost || 0))}</b>${p.kind === 'mech' ? (() => { const m = mechStats(p); return `<span>重さ・重心</span><b>${m.W.toFixed(1)}g・${m.cogPct.toFixed(0)}%</b>`; })() : ''}${p.legend ? `<span>中古の相場</span><b style="color:#9a7316">${yen(p.price * resaleMult(p))}</b>` : ''}</div>${p.legend ? '<span class="pill gold">名品</span>' : ''}${p.reissue ? '<span class="pill gold">復刻版</span>' : ''}</div></div>
        <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${p.active ? `<button class="btn sub small" data-act="priceM" data-id="${p.id}" type="button">値段を変える</button><button class="btn sub small" data-act="stop" data-id="${p.id}" type="button">販売終了</button>` : `<button class="btn sub small" data-act="resume" data-id="${p.id}" type="button">また売る</button>${p.legend ? `<button class="btn gold small" data-act="reissue" data-id="${p.id}" type="button">復刻版を作る</button>` : ''}`}<button class="btn small" data-act="copy" data-id="${p.id}" type="button">このデザインで新しく作る</button></div></div>`;
    }
    return h;
  },
  // 研究
  pRes(cat) {
    let h = `<div class="muted" style="margin:2px 0 8px">研究ポイント：<b style="color:var(--blue)">${Math.floor(S.rp)} RP</b>（1日 +${resRate().toFixed(2)}）。研究員をやとうと増える</div>`;
    if (S.research.cur) { const c = S.research.cur, r = RES_BY_ID[c.id]; h += `<div class="card res cur"><div class="row sb"><h3>研究中：${esc(r.name)}</h3><span class="pill gold">のこり ${Math.ceil(c.left)} 日</span></div><div class="bar o"><i style="width:${(1 - c.left / c.days) * 100}%"></i></div></div>`; }
    const order = { cur: 0, can: 1, req: 2, year: 3, done: 4 };
    const list = RESEARCH.filter(r => r.cat === cat).sort((a, b) => order[resState(a)] - order[resState(b)] || a.year - b.year);
    for (const r of list) {
      const st = resState(r), can = st === 'can' && !S.research.cur && S.rp >= r.rp;
      const lab = { done: '<span class="pill green">完了</span>', cur: '<span class="pill gold">研究中</span>', year: `<span class="pill">${r.year}年から</span>`, req: `<span class="pill">先に「${esc(r.req ? RES_BY_ID[r.req].name : '')}」</span>`, can: `<span class="pill blue">${r.rp} RP・${r.days}日</span>` }[st];
      h += `<div class="card res ${st === 'done' ? 'done' : st === 'can' ? 'can' : st === 'cur' ? 'cur' : ''}"><div class="row sb"><h3 style="margin:0">${esc(r.name)}</h3>${lab}</div><div class="muted">${esc(r.desc)}</div>${st === 'can' ? `<div style="margin-top:8px"><button class="btn small" data-act="research" data-id="${r.id}" type="button" ${can ? '' : 'disabled'}>${S.research.cur ? 'ほかの研究中' : S.rp < r.rp ? 'RPが足りない' : '研究する'}</button></div>` : ''}</div>`;
    }
    return h;
  },
  // スタッフ
  pStaff(s) {
    const O = OFFICES[S.tier];
    let h = `<div class="muted" style="margin:2px 0 8px">机：${S.staff.length} / ${O.desks}　月給の合計：${yen(S.staff.reduce((a, m) => a + m.sal, 0))}</div>`;
    const person = (m, btn) => `<div class="card"><div class="row sb"><h3 style="margin:0">${esc(m.name)}</h3><span class="pill ${m.role === 'res' ? 'blue' : m.role === 'qa' ? '' : m.role === 'des' ? 'gold' : 'green'}">${ROLES[m.role].name}</span></div><div class="row sb" style="margin-top:4px"><span class="stars">${'★'.repeat(m.lv)}${'☆'.repeat(5 - m.lv)}</span><span class="muted">月給 ${yen(m.sal)}</span></div><div class="muted">${ROLES[m.role].desc}${m.role === 'res' ? `（1日 +${ROLES.res.rate[m.lv - 1]} RP）` : m.role === 'qa' ? `（1日 ${ROLES.qa.rate[m.lv - 1]} 件）` : m.role === 'sal' ? `（売上 +${Math.round(ROLES.sal.rate[m.lv - 1] * 100)}%）` : `（デザイン +${ROLES.des.rate[m.lv - 1]}）`}</div><div style="margin-top:8px">${btn}</div></div>`;
    if (s === 'list') {
      if (!S.staff.length) h += '<div class="list-empty">まだだれもいません。「採用」から仲間をふやそう</div>';
      for (const m of S.staff) h += person(m, `<button class="btn sub small" data-act="fire" data-id="${m.id}" type="button">やめてもらう</button>`);
    } else {
      if (!S.cands.length) rerollCands(false);
      for (const c of S.cands) h += person(c, `<button class="btn small" data-act="hire" data-id="${c.id}" type="button" ${S.staff.length >= O.desks || S.money < c.sal ? 'disabled' : ''}>採用する（${yen(c.sal)}）</button>`);
      h += `<button class="btn sub big" data-act="reroll" type="button">ほかの人を探す（${yen(50000 * (S.tier + 1))}）</button>`;
    }
    return h;
  },
  // 会社
  pCo(s) {
    let h = '';
    if (s === 'sum') {
      h += `<div class="card"><div class="grp" style="margin-top:0">会社の名前</div><div class="row"><input class="txt" id="coIn" maxlength="16" value="${esc(S.company)}"><button class="btn small" data-act="rename" type="button">変える</button></div></div>`;
      h += `<div class="card"><div class="kv"><span>会社の価値</span><b>${yen(S.stats.value)}</b><span>先月の利益</span><b style="color:${S.stats.lastMonthProfit < 0 ? 'var(--red)' : 'var(--green)'}">${yen(S.stats.lastMonthProfit, true)}</b><span>先月の売上</span><b>${yen(S.stats.lastMonthRev)}</b><span>売上の合計</span><b>${yen(S.stats.sales)}</b><span>評判</span><b class="stars">${'★'.repeat(Math.round(clamp(S.brand, 0.4, 2.4) / 2.4 * 5))}${'☆'.repeat(5 - Math.round(clamp(S.brand, 0.4, 2.4) / 2.4 * 5))}</b><span>発売した数</span><b>${S.stats.launched}</b><span>いまの流行</span><b>${TRENDS[S.trend.id]}</b></div></div>`;
      h += `<div class="card"><div class="grp" style="margin-top:0">お金の動き（週ごと）</div><canvas class="chart" id="chart" width="600" height="220"></canvas></div>`;
      h += `<div class="card"><div class="grp" style="margin-top:0">最近のニュース</div>${S.news.slice(0, 8).map(n => `<div class="muted">${dateStr(n.d)}　${esc(n.t)}</div>`).join('') || '<div class="muted">まだありません</div>'}</div>`;
      setTimeout(() => this.drawChart(), 0);
    } else if (s === 'share') {
      for (const k of KIND_IDS) {
        const sh = S.share[k]; if (!sh) continue;
        const rows = [[S.company, sh.me, '#2b6fd6', true], ...RIVALS.map((r, i) => [r.name, sh.rivals[i], r.color, false]).filter(x => x[1] > 0.001)].sort((a, b) => b[1] - a[1]);
        h += `<div class="card"><h3>${KINDS[k].name}</h3>${rows.map(([n, v, c, me]) => `<div class="row" style="gap:8px;margin:3px 0"><span style="width:92px;font-size:12.5px;${me ? 'font-weight:900' : ''}">${esc(n)}</span><div class="bar" style="flex:1"><i style="width:${Math.min(100, v * 100)}%;background:${c}"></i></div><b style="width:42px;text-align:right;font-size:12.5px">${Math.round(v * 100)}%</b></div>`).join('')}</div>`;
      }
    } else if (s === 'mkt') {
      for (const m of MARKETS) {
        const has = S.markets.includes(m.id), ok = marketOk(m);
        h += `<div class="card"><div class="row sb"><h3 style="margin:0">${m.name}</h3>${has ? '<span class="pill green">販売中</span>' : `<span class="pill">お客さん ×${m.mult}</span>`}</div>${has ? '' : `<div class="muted">費用 ${yen(m.cost)}・発売した製品 ${m.need.launched} こ以上${m.req ? '・先にアジア' : ''}</div><div style="margin-top:8px"><button class="btn small" data-act="expand" data-id="${m.id}" type="button" ${ok ? '' : 'disabled'}>進出する</button></div>`}</div>`;
      }
    } else if (s === 'rival') {
      for (const r of S.rivals) {
        const RV = RIVALS.find(x => x.id === r.id), pr = buyoutPrice(r);
        h += `<div class="card"><div class="row sb"><h3 style="margin:0;color:${RV.color}">${RV.name}</h3>${r.owned ? '<span class="pill green">買収ずみ</span>' : `<span class="pill">得意：${Object.entries(RV.w).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => KINDS[k].short).join('・')}</span>`}</div>${r.owned ? `<div class="muted">毎月 ${yen((r.paid || 0) * 0.006)} の利益が入る</div>` : `<div class="muted">買収の値段 ${yen(pr)}。買収すると競争相手が減り、評判が上がり、毎月の利益も入る</div><div style="margin-top:8px"><button class="btn small gold" data-act="buyout" data-id="${r.id}" type="button" ${S.money >= pr ? '' : 'disabled'}>買収する</button></div>`}</div>`;
      }
    } else if (s === 'goal') {
      GOALS.forEach((g, i) => { const done = i < S.goal; h += `<div class="card res ${done ? 'done' : i === S.goal ? 'can' : ''}"><div class="row sb"><b>${esc(g.text)}</b>${done ? '<span class="pill green">達成</span>' : i === S.goal ? '<span class="pill blue">いまの目標</span>' : ''}</div><div class="muted">ごほうび：${g.reward.money ? yen(g.reward.money) + '・' : ''}${g.reward.rp} RP</div></div>`; });
    }
    return h;
  },
  drawChart() {
    const c = $('chart'); if (!c) return; const g = c.getContext('2d'), w = c.width, h = c.height, d = S.hist.length ? S.hist : [S.money];
    g.clearRect(0, 0, w, h); const mn = Math.min(0, ...d), mx = Math.max(1, ...d), y = v => h - 16 - (v - mn) / (mx - mn || 1) * (h - 30);
    g.strokeStyle = '#e3dccd'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y(0)); g.lineTo(w, y(0)); g.stroke();
    g.strokeStyle = '#2b6fd6'; g.lineWidth = 3; g.beginPath(); d.forEach((v, i) => { const x = d.length < 2 ? w / 2 : i / (d.length - 1) * (w - 10) + 5; i ? g.lineTo(x, y(v)) : g.moveTo(x, y(v)); }); g.stroke();
    g.fillStyle = '#6f6a60'; g.font = '20px sans-serif'; g.fillText(yen(mx), 6, 20); g.fillText(yen(mn), 6, h - 2);
  },
  // 事務所
  pOffice() {
    const O = OFFICES[S.tier], next = OFFICES[S.tier + 1], n = officeNeed(S.tier + 1);
    let h = `<div class="card"><div class="row sb"><h3 style="margin:0">${O.name}</h3><span class="pill">家賃 ${yen(O.rent)}／月</span></div><div class="muted">机 ${O.desks}・同時に開発 ${O.slots}・設備はLv${O.maxEq}まで</div></div>`;
    if (next) h += `<div class="card"><div class="row sb"><h3 style="margin:0">次：${next.name}</h3><span class="pill">${yen(next.cost)}</span></div><div class="muted">机 ${next.desks}・同時に開発 ${next.slots}・家賃 ${yen(next.rent)}／月</div><div class="muted">条件：発売 ${S.stats.launched}/${n.launched}・売上の合計 ${yen(S.stats.sales)} / ${yen(n.sales)}</div><div style="margin-top:8px"><button class="btn" data-act="move" type="button" ${n.ok ? '' : 'disabled'}>引っ越す</button></div></div>`;
    const cap = LINE_CAP[S.equip.line];
    h += `<div class="card"><div class="row sb"><h3 style="margin:0">生産</h3><span class="muted">1週間に ${num(cap)}（えんぴつなら${num(cap)}本）</span></div><div class="muted">いまの注文：${Math.round(S.capUse * 100)}%</div><div class="bar ${S.capUse > 1 ? 'r' : 'g'}"><i style="width:${Math.min(100, S.capUse * 100)}%"></i></div><div class="muted">シャーペンは3本分、万年筆は20本分の手間がかかる</div></div>`;
    h += '<div class="grp">設備</div>';
    for (const k of Object.keys(EQUIP)) {
      const E = EQUIP[k], lv = S.equip[k], mx = eqMax(k), pr = E.price[lv], top = (k === 'line' ? E.price.length : (E.max || 3));
      h += `<div class="card"><div class="row sb"><h3 style="margin:0">${E.name}</h3><span class="pill">Lv ${lv}${k === 'line' ? '' : ' / ' + (E.max || 3)}</span></div><div class="muted">${E.desc}</div><div style="margin-top:8px">${lv >= top ? '<span class="pill green">最大</span>' : lv >= mx ? `<span class="pill">事務所を広げると上げられる</span>` : `<button class="btn small" data-act="equip" data-k="${k}" type="button" ${S.money >= pr ? '' : 'disabled'}>Lv ${lv + 1} にする（${yen(pr)}）</button>`}</div></div>`;
    }
    return h;
  },
  pMenu() {
    return `<div class="card"><div class="row sb"><b>BGM</b><button class="btn small ${SET.music ? '' : 'sub'}" data-act="music" type="button">${SET.music ? 'オン' : 'オフ'}</button></div></div>
      <div class="card"><b>画質</b><div class="chips" style="margin-top:8px">${[['high', '高画質'], ['std', '標準'], ['low', '軽量']].map(([k, n]) => `<button class="chip ${SET.quality === k ? 'on' : ''}" data-act="quality" data-v="${k}" type="button">${n}</button>`).join('')}</div></div>
      <div class="card"><b>遊び方</b><div class="muted" style="margin-top:6px;line-height:1.7">① 「開発」で文房具を選び、性能（芯・インク・機構など）と見た目（色・模様・ロゴ）を決めて開発する。<br>② 開発が終わったら値段と広告を決めて発売。レビューの点と値段で売れゆきが決まる。<br>③ 「研究」で新しい技術を開くと、もっといい製品が作れる。年がたつとお客さんの期待も上がる。<br>④ 「スタッフ」で研究員・品質チェック・デザイナー・営業をやとう。<br>⑤ 「事務所」で設備を買い、引っ越して会社を大きくしよう。季節（新学期・年末）や流行の色もねらおう。<br>上の ▶ で時間の速さ、Ⅱ で一時停止。自動でセーブされます。</div></div>
      <div class="card"><button class="btn red small" data-act="reset" type="button">最初からやり直す</button></div>`;
  },
  // ---------- クリック ----------
  onClick(e) {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const a = b.dataset.act, id = +b.dataset.id; AU.resume(); AU.click();
    if (a === 'sub') { this.sub[b.dataset.k] = b.dataset.v; $('shBody').scrollTop = 0; this.render(); return; }
    if (a === 'newDev') return this.openStudio({ kind: b.dataset.k });
    if (a === 'launchM') return this.launchModal(id);
    if (a === 'fixRP') { const v = S.devs.find(x => x.id === id); if (v && fixWithRP(v)) this.toast('RPを使って不具合を直した', 'good'); }
    else if (a === 'priceM') return this.priceModal(id);
    else if (a === 'stop') { const p = S.products.find(x => x.id === id); if (p) { p.active = false; p.offDay = S.day; this.toast(`「${p.name}」の販売を終えた`); } }
    else if (a === 'resume') { const p = S.products.find(x => x.id === id); if (p) p.active = true; }
    else if (a === 'copy') { const p = S.products.find(x => x.id === id); if (p) return this.openStudio({ kind: p.kind, spec: { ...p.spec }, look: { ...p.look }, build: p.build, name: p.name.replace(/( \d+)?$/, '') + ' 2', price: p.price }); }
    else if (a === 'research') { if (startResearch(b.dataset.id)) { this.toast(`研究を始めた：${RES_BY_ID[b.dataset.id].name}`); } }
    else if (a === 'hire') { const why = hire(id); if (why) this.toast(why, 'bad'); else { AU.coin(); } }
    else if (a === 'fire') { const m = S.staff.find(x => x.id === id); if (m) return this.ask(`${m.name}さん（${ROLES[m.role].name}）にやめてもらいますか？`, () => { fire(id); this.toast(`${m.name}さんがやめた`); }); }
    else if (a === 'reroll') { if (!rerollCands(true)) this.toast('お金が足りない', 'bad'); }
    else if (a === 'rename') { const v = ($('coIn').value || '').trim().slice(0, 16); if (v) { S.company = v; this.toast('会社の名前を変えた'); } }
    else if (a === 'expand') { if (expand(b.dataset.id)) { AU.fanfare(); } }
    else if (a === 'buyout') { if (buyout(b.dataset.id)) { AU.fanfare(); } }
    else if (a === 'move') { if (moveOffice()) { AU.fanfare(); this.toast(`${OFFICES[S.tier].name}へ引っ越した！`, 'gold'); OFFICE.zoom = 1; } }
    else if (a === 'equip') { if (buyEquip(b.dataset.k)) { AU.coin(); this.toast(`${EQUIP[b.dataset.k].name}を Lv${S.equip[b.dataset.k]} にした`, 'good'); } }
    else if (a === 'music') { SET.music = !SET.music; saveSet(); AU.setVol(); }
    else if (a === 'quality') { SET.quality = b.dataset.v; saveSet(); applyQuality(); OFFICE.key = ''; }
    else if (a === 'reset') return this.ask('会社を消して最初からやり直します。よろしいですか？', () => { S.over = true; try { localStorage.removeItem('bungu-save'); } catch (er) { /* なし */ } location.reload(); });
    // スタジオ
    else if (a === 'stTab') { this.studio.tab = b.dataset.v; $('stBody').scrollTop = 0; this.renderStudio(); return; }
    else if (a === 'spec') { const d = this.studio.d; d.spec[b.dataset.k] = b.dataset.v; this.studio.changed(); return; }
    else if (a === 'look') { const d = this.studio.d; d.look[b.dataset.k] = b.dataset.v; this.studio.changed(); return; }
    else if (a === 'mpre') { const d = this.studio.d, pr = MECH_PRESETS.find(x => x.id === b.dataset.v); if (pr) { d.build = Object.assign(JSON.parse(JSON.stringify(DEF_BUILD)), JSON.parse(JSON.stringify(pr.b))); for (const [k, v] of Object.entries(pr.spec || {})) { const o = optOf('mech', k, v); if (o && resDone(o.req)) d.spec[k] = v; } this.toast(`「${pr.name}」の型にした${mechLocks(d).length ? '（まだ研究していない部品があります）' : ''}`); } this.studio.changed(); return; }
    else if (['mmat', 'mfin', 'msec', 'mwin', 'mcog', 'mgd', 'mgl', 'mtog'].includes(a)) {
      const bd = mechBuild(this.studio.d), v = b.dataset.v;
      if (a === 'mmat') { bd.mat[b.dataset.k] = v; if (!GRIP_FIN[bd.fin].ok(MECH_MATS[bd.mat.grip])) bd.fin = MECH_MATS[bd.mat.grip].soft ? 'dots' : 'plain'; if (bd.mat.clip === 'none') bd.clipret = false; }
      else if (a === 'mfin') bd.fin = v; else if (a === 'msec') bd.sec = v; else if (a === 'mwin') bd.win = v; else if (a === 'mcog') bd.cog = v;
      else if (a === 'mgd') bd.gripD = +v; else if (a === 'mgl') bd.gripL = +v; else if (a === 'mtog') bd[b.dataset.k] = !bd[b.dataset.k];
      this.studio.changed(); return;
    }
    else if (a === 'reissue') { const p = S.products.find(x => x.id === id); if (p) return this.openStudio({ kind: p.kind, spec: { ...p.spec }, look: { ...p.look }, build: p.build, name: p.name.replace(/ 復刻版$/, '') + ' 復刻版', price: Math.round(p.price * 1.2), reissue: 0.9 }); }
    else if (a === 'polish') { const d = this.studio.d; d.polish = +b.dataset.v; d.bonus = polishBonus(d.kind, d.polish); this.studio.changed(); return; }
    else if (a === 'randName') { this.studio.d.name = randName(this.studio.d.kind); this.renderStudio(); return; }
    else if (a === 'recPrice') { this.studio.d.price = recPrice(this.studio.d); this.studio.d.priceAuto = true; this.renderStudio(); return; }
    else if (a === 'startDev') { const why = startDev(this.studio.d); if (why) { this.toast(why, 'bad'); AU.bad(); } else { AU.coin(); this.toast(`「${this.studio.d.name}」の開発を始めた！`, 'good'); this.closeStudio(); this.open('dev'); } return; }
    // モーダル
    else if (a === 'ad') { this.modalState.ad = b.dataset.v; this.renderLaunch(); return; }
    else if (a === 'doLaunch') { const st = this.modalState, p = launch(st.id, st.price, st.ad); if (!p) { this.toast('お金が足りない', 'bad'); return; } AU.fanfare(); this.reviewModal(p); checkGoals(); return; }
    else if (a === 'later') { this.closeModal(); return; }
    else if (a === 'setPrice') { const p = S.products.find(x => x.id === this.modalState.id); if (p) { p.price = Math.max(1, Math.round(this.modalState.price)); this.toast(`「${p.name}」を ${yen(p.price)} にした`); } this.closeModal(); return; }
    else if (a === 'closeM') { this.closeModal(); return; }
    else if (a === 'yes') { const f = this.modalState && this.modalState.yes; this.closeModal(); if (f) f(); this.dirty(); return; }
    else if (a === 'restart') { try { localStorage.removeItem('bungu-save'); } catch (er) { /* なし */ } location.reload(); return; }
    else if (a === 'startNew') { const v = ($('newCo').value || '').trim().slice(0, 16) || 'ぶんぐ工房'; this.closeModal(); GAMEFLOW.begin(newState(v), true); return; }
    if (S) checkGoals();
    this.dirty(); this.render();
  },
  onInput(e) {
    const t = e.target;
    if (this.studio && t.dataset.look) { this.studio.d.look[t.dataset.look] = t.value; this.studio.changed(t.type === 'text'); return; }
    if (this.studio && t.id === 'stName') { this.studio.d.name = t.value; return; }
    if (this.studio && t.dataset.mb) { const bd = mechBuild(this.studio.d), k = t.dataset.mb; bd[k] = +t.value; const lab = $({ L: 'mbL', D: 'mbD', clipTop: 'mbC' }[k]); if (lab) lab.textContent = k === 'D' ? (+t.value).toFixed(1) : t.value; this.studio.changed(true); this.studioFoot(); return; }
    if (this.studio && (t.id === 'stPrice' || t.id === 'stPriceR')) { const v = Math.max(1, Math.round(+t.value || 1)); this.studio.d.price = v; this.studio.d.priceAuto = false; if (t.id === 'stPriceR') $('stPrice').value = v; else $('stPriceR').value = v; this.studioMeter(); this.studioFoot(); return; }
    if (this.modalOpen && (t.id === 'mPrice' || t.id === 'mPriceR')) { const v = Math.max(1, Math.round(+t.value || 1)); this.modalState.price = v; if (t.id === 'mPriceR') $('mPrice').value = v; else $('mPriceR').value = v; const ev = $('mPriceEval'); if (ev) ev.innerHTML = this.priceEval(this.modalState.d, v); }
  },
  // ---------- 開発スタジオ ----------
  openStudio(init) {
    const k = init.kind, spec = init.spec || {};
    for (const g of SPECS[k]) if (!spec[g.key]) { let o = g.opts[0]; for (const x of g.opts) if (resDone(x.req) && x.lv > o.lv) o = x; spec[g.key] = o.id; }   // 研究ずみでいちばん性能のよいもの
    const d = { kind: k, spec, look: Object.assign({ ...DEF_LOOK[k] }, init.look || {}), name: init.name || randName(k), price: 0, polish: 0, bonus: 0, reissue: init.reissue || 0 };
    if (k === 'mech') d.build = JSON.parse(JSON.stringify(init.build || DEF_BUILD));
    d.price = init.price || recPrice(d); d.priceAuto = !init.price;   // 自分で値段を変えるまでは、おすすめの値段についていく
    this.open(null);
    this.studio = { d, tab: 'spec', dirty: true, t: 0, changed: (soft) => { if (d.priceAuto) d.price = recPrice(d); this.studio.dirty = !soft; this.studio.rebuild = true; if (soft) { this.studioMeter(); } } };
    this.studio.rebuild = true;
    $('studio').classList.remove('hidden'); document.body.classList.add('studio'); $('stTitle').textContent = d.reissue ? `復刻版の${KINDS[k].name}` : `新しい${KINDS[k].name}`;
    STUDIO.zoom = 1; STUDIO.yaw = -0.5; STUDIO.spin = true;
    this.renderStudio();
  },
  closeStudio() { this.studio = null; $('studio').classList.add('hidden'); document.body.classList.remove('studio'); },
  renderStudio() {
    const st = this.studio; if (!st) return; const d = st.d, k = d.kind;
    $('stTabs').innerHTML = (k === 'mech' ? [['spec', '性能'], ['build', '設計'], ['look', '見た目'], ['name', '名前と値段']] : [['spec', '性能'], ['look', '見た目'], ['name', '名前と値段']]).map(([v, n]) => `<button type="button" class="${st.tab === v ? 'on' : ''}" data-act="stTab" data-v="${v}">${n}</button>`).join('');
    const body = $('stBody'), sc = body.scrollTop; let h = '';
    if (st.tab === 'spec') {
      h += `<div class="grp">仕上げ（研究ポイントで性能を上げる）</div><div class="chips">${POLISH.map(lv => { const c = polishRP(k, lv); return `<button type="button" class="chip ${(d.polish || 0) === lv ? 'on' : ''} ${S.rp < c ? 'lock' : ''}" ${S.rp >= c ? `data-act="polish" data-v="${lv}"` : ''}>${lv ? '+' + lv * 5 + '%' : 'なし'}<small>${lv ? c + ' RP・性能 +' + polishBonus(k, lv) : 'RPを使わない'}</small></button>`; }).join('')}</div>`;
      for (const g of SPECS[k]) {
        h += `<div class="grp">${g.name}</div><div class="chips">`;
        for (const o of g.opts) {
          const ok = resDone(o.req), r = o.req ? RES_BY_ID[o.req] : null, on = d.spec[g.key] === o.id;
          const segs = o.seg ? Object.keys(o.seg).map(s => SEGS[s].replace('（絵・製図）', '')).join('・') + 'に人気' : '';
          h += `<button type="button" class="chip ${on ? 'on' : ''} ${ok ? '' : 'lock'}" ${ok ? `data-act="spec" data-k="${g.key}" data-v="${o.id}"` : ''}>${esc(o.name)}<small>${ok ? `性能 ${o.lv}${o.cost ? `・原価 +${o.cost}円` : ''}${segs ? '・' + segs : ''}` : `🔒 研究「${esc(r.name)}」`}</small></button>`;
        }
        h += '</div>';
      }
    } else if (st.tab === 'build') {
      h += this.studioBuild(d);
    } else if (st.tab === 'look') {
      for (const f of LOOKS[k]) {
        if (f.when && !f.when(d)) continue;
        h += `<div class="grp">${f.name}</div>`;
        const v = d.look[f.key];
        if (f.type === 'color') h += `<div class="sw">${PALETTE.map(c => `<button type="button" class="${v === c ? 'on' : ''}" style="background:${c}" data-act="look" data-k="${f.key}" data-v="${c}" aria-label="${c}"></button>`).join('')}<label title="自由な色">🎨<input type="color" value="${v}" data-look="${f.key}"></label></div>`;
        else if (f.type === 'ink') h += `<div class="sw">${INKS.map(c => `<button type="button" class="${v === c ? 'on' : ''}" style="background:${c}" data-act="look" data-k="${f.key}" data-v="${c}" aria-label="${c}"></button>`).join('')}<label title="自由な色">🎨<input type="color" value="${v}" data-look="${f.key}"></label></div>`;
        else if (f.type === 'sel') h += `<div class="chips">${Object.entries(f.opts).map(([id, n]) => `<button type="button" class="chip ${v === id ? 'on' : ''}" data-act="look" data-k="${f.key}" data-v="${id}">${esc(n)}</button>`).join('')}</div>`;
        else if (f.type === 'text') h += `<input class="txt" maxlength="14" value="${esc(v || '')}" data-look="${f.key}" placeholder="ロゴの文字（空でもいい）">`;
      }
      h += `<div class="muted" style="margin-top:10px">いまの流行：<b>${TRENDS[S.trend.id]}</b>。流行に合うとデザインの点が上がります。模様やロゴを工夫しても少し上がります。</div>`;
    } else {
      const c = costOf(d), rp = recPrice(d), mx = Math.max(rp * 4, c * 6);
      h += `<div class="grp">製品の名前</div><div class="row"><input class="txt" id="stName" maxlength="24" value="${esc(d.name)}"><button class="btn sub small" data-act="randName" type="button" aria-label="名前を考える">🎲</button></div>`;
      h += `<div class="grp">値段（1こ）</div><div class="row"><input class="txt" id="stPrice" type="number" inputmode="numeric" min="1" value="${d.price}" style="width:130px"><span class="muted">円</span><button class="btn sub small" data-act="recPrice" type="button">おすすめ ${yen(rp)}</button></div>`;
      h += `<input type="range" id="stPriceR" min="${Math.max(1, Math.floor(c * 0.8))}" max="${Math.ceil(mx)}" value="${d.price}" style="margin-top:8px">`;
      h += `<div class="muted">原価 ${yen(c)}。おすすめの値段はもうけが約7割。安くするとたくさん売れて、高くすると1こあたりのもうけが増える。値段は発売のときにも、あとからも変えられます。</div>`;
    }
    body.innerHTML = h; body.scrollTop = sc;
    this.studioMeter(); this.studioFoot();
  },
  studioMeter() {
    const d = this.studio.d, P = perfP(d), ex = expected(d.kind), q = P / ex, des = designScore(d), c = costOf(d);
    $('pvMeter').innerHTML = `性能 <b>${P}</b>（期待 ${ex.toFixed(0)}）<div class="bar ${q >= 1 ? 'g' : q >= 0.85 ? '' : 'r'}"><i style="width:${Math.min(100, q / 1.4 * 100)}%"></i><u style="left:${100 / 1.4}%"></u></div>デザイン <b>${des.toFixed(1)}</b><div class="bar o"><i style="width:${des * 10}%"></i></div>原価 <b>${yen(c)}</b>　値段 <b>${yen(d.price)}</b>${d.kind === 'mech' ? (() => { const m = mechStats(d); return `<br>重さ <b>${m.W.toFixed(1)}g</b>　重心 <b>${m.cogPct.toFixed(1)}%</b>`; })() : ''}`;
    const rd = $('mbRead'); if (rd && d.kind === 'mech') rd.innerHTML = this.buildReadout(d);
  },
  // ---------- シャーペンの設計 ----------
  buildReadout(d) {
    const b = mechBuild(d), m = mechStats(d), st5 = v => { const n = Math.round(clamp(v, 0, 1) * 5); return '★'.repeat(n) + '☆'.repeat(5 - n); };
    return `<div class="kv"><span>重さ</span><b>${m.W.toFixed(1)} g</b><span>重心</span><b>先から ${Math.round(m.cog)} mm（全長の ${m.cogPct.toFixed(1)}%）</b><span>書きやすさ</span><b class="stars">${st5(m.ergo)}</b><span>機能</span><b class="stars">${st5(m.func / 8)}</b><span>高級感</span><b class="stars">${st5(m.lux)}</b><span>学生の人気</span><b class="stars">${st5(m.seg.stu / 0.55)}</b><span>社会人の人気</span><b class="stars">${st5(m.seg.adu / 0.6)}</b><span>製図・プロの人気</span><b class="stars">${st5(m.seg.pro / 0.9)}</b></div>${m.notes.length ? `<div class="muted" style="color:var(--red);margin-top:6px">⚠ ${m.notes.map(esc).join('<br>⚠ ')}</div>` : ''}${this.balanceSvg(b, m, d)}`;
  },
  // 横から見た図：左が先。部品の素材の色、クリップ、硬度表示窓、重心（▲）
  balanceSvg(b, m, d) {
    const L = b.L, sx = 300 / (L + 8), X = x => (x + 6) * sx, cy = 30, R = b.D / 2, Rg = R + b.gripD / 2, ys = 2.1;
    const col = { resin: d.look.body, clear: '#cfe6f2', rubber: d.look.grip, silicone: d.look.grip, alu: '#c3c8cf', brass: '#d6b25e', sus: '#b9bec5', wood: (WOOD_TONES[d.look.woodTone] || WOOD_TONES.maple)[1], wood2: (WOOD_TONES[d.look.woodTone] || WOOD_TONES.maple)[2] };
    const c = k => (k === 'grip' && ['resin', 'alu'].includes(b.mat.grip) ? (b.mat.grip === 'alu' ? '#c3c8cf' : d.look.grip) : col[b.mat[k]] || '#ccc');
    const rect = (x0, x1, r, fill) => `<rect x="${X(x0)}" y="${cy - r * ys}" width="${X(x1) - X(x0)}" height="${r * ys * 2}" rx="2" fill="${fill}" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>`;
    const pipe = d.spec.tip === 't1' ? 4 : 3, bx0 = MECH_TIP + b.gripL;
    let g = `<rect x="${X(-pipe)}" y="${cy - 0.6}" width="${X(0) - X(-pipe)}" height="1.2" fill="#888"/>`;
    g += `<polygon points="${X(0)},${cy - 1.2 * ys} ${X(MECH_TIP)},${cy - (Rg - 0.4) * ys} ${X(MECH_TIP)},${cy + (Rg - 0.4) * ys} ${X(0)},${cy + 1.2 * ys}" fill="${c('tip')}" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>`;
    g += rect(MECH_TIP, bx0, Rg, c('grip')) + rect(bx0, L - MECH_KNOCK, R, c('barrel')) + rect(L - MECH_KNOCK, L, 2.4, c('knock'));
    if (b.fin === 'knurlF' || b.fin === 'knurlC') for (let x = MECH_TIP + 2; x < bx0 - 1; x += b.fin === 'knurlF' ? 1.6 : 2.6) g += `<line x1="${X(x)}" y1="${cy - Rg * ys}" x2="${X(x + 1.2)}" y2="${cy + Rg * ys}" stroke="rgba(0,0,0,.25)" stroke-width=".7"/>`;
    if (b.win !== 'none') { const wx = mechWinX(b); g += `<rect x="${X(wx) - 5}" y="${cy - 3}" width="10" height="6" fill="#fff" stroke="#333" stroke-width=".7"/><text x="${X(wx)}" y="${cy + 2}" font-size="5" text-anchor="middle" fill="#111">HB</text>`; }
    if (b.mat.clip !== 'none') { const r0 = L - b.clipTop; g += `<rect x="${X(r0 - MECH_CLIP)}" y="${cy - R * ys - 4}" width="${X(r0) - X(r0 - MECH_CLIP)}" height="2.6" rx="1.3" fill="${b.mat.clip === 'resin' ? d.look.clipColor : '#aab0b8'}" stroke="rgba(0,0,0,.4)" stroke-width=".6"/>`; }
    g += `<polygon points="${X(m.cog)},${cy + R * ys + 3} ${X(m.cog) - 5},${cy + R * ys + 11} ${X(m.cog) + 5},${cy + R * ys + 11}" fill="#d9493e"/><text x="${X(m.cog)}" y="${cy + R * ys + 19}" font-size="7.5" text-anchor="middle" fill="#d9493e">重心 ${Math.round(m.cog)}mm</text>`;
    g += `<text x="${X(-pipe)}" y="10" font-size="7" fill="#6f6a60">← 先</text><text x="${X(L)}" y="10" font-size="7" text-anchor="end" fill="#6f6a60">ノック →</text>`;
    return `<svg viewBox="0 0 310 64" style="width:100%;height:auto;margin-top:8px;background:#fff;border-radius:10px;border:1px solid var(--line)">${g}</svg>`;
  },
  studioBuild(d) {
    const b = mechBuild(d), M = MECH_MATS, lock = r => !!r && !resDone(r);
    const chip = (act, k, v, on, name, small, locked) => `<button type="button" class="chip ${on ? 'on' : ''} ${locked ? 'lock' : ''}" ${locked ? '' : `data-act="${act}" data-k="${k}" data-v="${v}"`}>${name}${small ? `<small>${small}</small>` : ''}</button>`;
    let h = `<div class="card" id="mbRead" style="margin-top:8px">${this.buildReadout(d)}</div>`;
    h += `<div class="grp">参考の型（有名なシャーペンの特徴をもとにした出発点）</div><div class="chips">${MECH_PRESETS.map(p => chip('mpre', '', p.id, false, esc(p.name), esc(p.note))).join('')}</div>`;
    h += `<div class="grp">寸法</div><div class="muted">全長 <b id="mbL">${b.L}</b> mm</div><input type="range" min="136" max="152" step="1" value="${b.L}" data-mb="L">`;
    h += `<div class="muted">軸の太さ <b id="mbD">${b.D.toFixed(1)}</b> mm</div><input type="range" min="7.5" max="11.5" step="0.1" value="${b.D}" data-mb="D">`;
    h += `<div class="muted" style="margin-top:6px">グリップの太さ（軸とのちがい）</div><div class="chips">${[-0.5, 0, 0.5, 1, 1.5].map(v => chip('mgd', '', v, b.gripD === v, (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v) + 'mm', '')).join('')}</div>`;
    h += `<div class="muted" style="margin-top:6px">グリップの長さ</div><div class="chips">${[24, 30, 34, 40].map(v => chip('mgl', '', v, b.gripL === v, v + 'mm', '')).join('')}</div>`;
    h += `<div class="muted" style="margin-top:6px">軸の断面</div><div class="chips">${Object.entries(MECH_SECS).map(([k, v]) => chip('msec', '', k, b.sec === k, v.name, v.roll ? 'ころがりにくい' : '', lock(v.req))).join('')}</div>`;
    h += `<div class="grp">部品ごとの素材（重さと重心が変わる）</div>`;
    for (const [pk, P] of Object.entries(MECH_PARTS)) {
      h += `<div class="muted" style="margin-top:6px">${P.name}</div><div class="chips">${P.mats.map(mk => { const m = M[mk], lk = lock(m.req) && !(P.free || []).includes(mk); return chip('mmat', pk, mk, b.mat[pk] === mk, m.name, mk === 'none' ? '' : `${m.dens} g/cm³${lk ? '・🔒' : ''}`, lk); }).join('')}</div>`;
    }
    const gm = M[b.mat.grip];
    h += `<div class="grp">グリップの加工</div><div class="chips">${Object.entries(GRIP_FIN).filter(([, f]) => f.ok(gm)).map(([k, f]) => chip('mfin', '', k, b.fin === k, f.name, `にぎりやすさ ${Math.round(f.q(gm) * 100)}`, lock(f.req))).join('')}</div>`;
    h += `<div class="grp">クリップの位置</div>${b.mat.clip === 'none' ? '<div class="muted">クリップなし（上の素材で選べる）</div>' : `<div class="muted">上のはしから <b id="mbC">${b.clipTop}</b> mm</div><input type="range" min="14" max="80" step="1" value="${b.clipTop}" data-mb="clipTop">`}`;
    h += `<div class="grp">硬度表示窓の位置</div><div class="chips">${Object.entries(MECH_WIN).map(([k, n]) => chip('mwin', '', k, b.win === k, n, '', k !== 'none' && lock('r_hwin'))).join('')}</div>`;
    h += `<div class="grp">重心のおもり</div><div class="chips">${Object.entries(MECH_COG).map(([k, c]) => chip('mcog', '', k, b.cog === k, c.name, c.mass ? `+${c.mass}g` : '', lock(c.req))).join('')}</div>`;
    h += `<div class="grp">機能</div><div class="chips">${chip('mtog', 'cushion', '', b.cushion, '芯クッション', b.cushion ? 'あり' : 'なし', lock('r_cushion'))}${chip('mtog', 'clipret', '', b.clipret, 'クリップでパイプ収納', b.clipret ? 'あり' : 'なし', lock('r_clipret') || b.mat.clip === 'none')}</div>`;
    h += `<div class="muted" style="margin-top:10px;line-height:1.6">重心は先から全長の45%くらいより下だと、先が安定して製図をする人に好まれます。学生は軽め（10〜14g）とやわらかいグリップ、社会人は金属や木の高級感が好き。クリップが下すぎると指に当たり、硬度表示窓をクリップの下にするとかくれます。</div>`;
    return h;
  },
  studioFoot() {
    const d = this.studio.d, pl = devPlan(d), why = canStartDev(d);
    $('stFoot').innerHTML = `<div class="muted">開発費 <b>${yen(pl.devCost)}</b>・${pl.days}日・不具合 約${Math.max(1, Math.round(pl.bugs))}件${why ? `<br><span style="color:var(--red)">${esc(why)}</span>` : ''}</div><button class="btn green" data-act="startDev" type="button" ${why ? 'disabled' : ''}>開発スタート</button>`;
  },
  priceEval(d, price) { const q = perfP(d) / expected(d.kind), fair = fairPrice(d, q), r = fair / price; return r > 1.25 ? '<span class="pill green">とても安い</span>' : r > 1.02 ? '<span class="pill green">お買い得</span>' : r > 0.85 ? '<span class="pill">ふつう</span>' : r > 0.65 ? '<span class="pill gold">少し高い</span>' : '<span class="pill red">高すぎる</span>'; },
  // ---------- モーダル ----------
  showModal(html) { $('modalBox').innerHTML = html; $('modal').classList.add('on'); this.modalOpen = true; $('modalBox').scrollTop = 0; },
  closeModal() { $('modal').classList.remove('on'); this.modalOpen = false; this.modalState = null; this.dirty(); },
  launchModal(id) {
    const v = S.devs.find(x => x.id === id); if (!v || !v.ready) return;
    this.modalState = { id, price: v.price || recPrice(v), ad: 'none', d: v };
    this.renderLaunch();
  },
  renderLaunch() {
    const st = this.modalState, v = st.d, c = costOf(v), rp = recPrice(v), mx = Math.max(rp * 4, c * 6), ad = ADS.find(a => a.id === st.ad);
    this.showModal(`<h2>「${esc(v.name)}」を発売</h2><div class="row" style="gap:12px"><img alt="" src="${productThumb(v)}" style="width:96px;height:96px;border-radius:12px"><div class="kv"><span>種類</span><b>${KINDS[v.kind].name}</b><span>原価</span><b>${yen(c)}</b><span>おすすめ</span><b>${yen(rp)}</b></div></div>
      <div class="grp">値段</div><div class="row"><input class="txt" id="mPrice" type="number" inputmode="numeric" min="1" value="${st.price}" style="width:130px"><span id="mPriceEval">${this.priceEval(v, st.price)}</span></div>
      <input type="range" id="mPriceR" min="${Math.max(1, Math.floor(c * 0.8))}" max="${Math.ceil(mx)}" value="${st.price}" style="margin-top:8px">
      <div class="grp">広告（最初の数週間よく売れる）</div><div class="chips">${ADS.map(a => `<button type="button" class="chip ${st.ad === a.id ? 'on' : ''}" data-act="ad" data-v="${a.id}" ${S.money < a.cost ? 'disabled style="opacity:.4"' : ''}>${a.name}<small>${a.cost ? yen(a.cost) + '・' : ''}${a.boost ? '売れゆき +' + Math.round(a.boost * 100) + '%' : 'お金はかからない'}</small></button>`).join('')}</div>
      <div class="row" style="margin-top:14px;gap:8px"><button class="btn sub" data-act="later" type="button">あとで</button><button class="btn green" style="flex:1" data-act="doLaunch" type="button" ${S.money < ad.cost ? 'disabled' : ''}>発売する${ad.cost ? `（広告 ${yen(ad.cost)}）` : ''}</button></div>`);
  },
  reviewModal(p) {
    const col = p.review >= 8 ? 'var(--green)' : p.review >= 6 ? 'var(--blue)' : p.review >= 4 ? 'var(--gold)' : 'var(--red)';
    this.showModal(`<div class="review"><div class="muted">発売しました！ みんなの評価は…</div><img alt="" src="${productThumb(p)}" style="width:110px;height:110px;border-radius:14px;margin-top:8px"><h2>${esc(p.name)}</h2>
      <div class="rvs" style="color:${col}">${p.review.toFixed(1)}</div><div class="stars" style="font-size:22px">${stars10(p.review)}</div>
      <div class="grid2" style="margin:10px 0"><div class="card" style="margin:0"><div class="muted">性能</div><div class="score">${p.scores.perf}</div></div><div class="card" style="margin:0"><div class="muted">デザイン</div><div class="score">${p.scores.des}</div></div><div class="card" style="margin:0;grid-column:1/-1"><div class="muted">値段の満足</div><div class="score">${p.scores.val}</div></div></div>
      ${p.comments.map(([w, t]) => `<div class="cm"><b>${esc(w)}</b>${esc(t)}</div>`).join('')}
      <button class="btn big" style="margin-top:10px" data-act="closeM" type="button">OK</button></div>`);
  },
  priceModal(id) {
    const p = S.products.find(x => x.id === id); if (!p) return; const c = costOf(p), rp = recPrice(p), mx = Math.max(rp * 4, c * 6);
    this.modalState = { id, price: p.price, d: p };
    this.showModal(`<h2>「${esc(p.name)}」の値段</h2><div class="muted">原価 ${yen(c)}・おすすめ ${yen(rp)}。売れないときは少し下げてみよう</div>
      <div class="row" style="margin-top:10px"><input class="txt" id="mPrice" type="number" inputmode="numeric" min="1" value="${p.price}" style="width:130px"><span id="mPriceEval">${this.priceEval(p, p.price)}</span></div>
      <input type="range" id="mPriceR" min="${Math.max(1, Math.floor(c * 0.8))}" max="${Math.ceil(mx)}" value="${p.price}" style="margin-top:8px">
      <div class="row" style="margin-top:14px;gap:8px"><button class="btn sub" data-act="closeM" type="button">やめる</button><button class="btn" style="flex:1" data-act="setPrice" type="button">この値段にする</button></div>`);
  },
  // はい／いいえ（ブラウザの confirm は埋めこみ先で使えないことがあるので、ゲームの中に出す）
  ask(text, yes) { this.showModal(`<h2>確認</h2><p class="muted" style="line-height:1.7">${esc(text)}</p><div class="row" style="gap:8px"><button class="btn sub" data-act="closeM" type="button">やめる</button><button class="btn red" style="flex:1" data-act="yes" type="button">はい</button></div>`); this.modalState = { yes }; },
  gameOver() {
    this.showModal(`<div class="review"><h2>倒産…</h2><p class="muted">お金のマイナスが2,000万円をこえて、会社をたたむことになりました。<br>${S.day > 0 ? `${dateStr(S.day)}までの記録：発売 ${S.stats.launched}こ・売上の合計 ${yen(S.stats.sales)}` : ''}</p><button class="btn big" data-act="restart" type="button">新しい会社をつくる</button></div>`);
    try { localStorage.removeItem('bungu-save'); } catch (e) { /* なし */ }
  },
};
