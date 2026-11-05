// =========================================================================================
//  画面：上のバー・下のメニュー・シート（開発／製品／研究／スタッフ／会社／事務所）・開発スタジオ・発売とレビュー
// =========================================================================================
const SVG = {
  dev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/><path d="M19 15v4M17 17h4"/></svg>',
  prod: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>',
  res: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/></svg>',
  staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2c3 .2 5.5 2.6 5.5 5.8"/></svg>',
  co: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V9l5-3v14"/><path d="M9 20V4l7 3v13"/><path d="M16 20v-9l4 2v7"/><path d="M2 20h20"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M8 7h7M8 11h5"/></svg>',
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
  tab: null, sub: {}, choiceQ: [], dirtyF: true, refreshT: 0, studio: null, queue: [], modalOpen: false, newsQ: [], newsX: 0, newsW: 0, topT: 0,
  init() {
    const nav = $('nav'); nav.innerHTML = [['dev', '開発'], ['prod', '製品'], ['res', '研究'], ['staff', 'スタッフ'], ['co', '会社'], ['office', '事務所'], ['learn', '学習']].map(([k, n]) => `<button type="button" data-tab="${k}">${SVG[k]}<span>${n}</span><i class="dot"></i></button>`).join('');
    nav.onclick = e => { const b = e.target.closest('button'); if (!b) return; AU.resume(); AU.click(); this.open(this.tab === b.dataset.tab ? null : b.dataset.tab); };
    $('speed').onclick = e => { const b = e.target.closest('button'); if (!b || !S) return; AU.resume(); AU.click(); S.speed = +b.dataset.s; this.topT = 0; };
    $('menuB').onclick = () => { AU.resume(); AU.click(); this.open(this.tab === 'menu' ? null : 'menu'); };
    $('debtS').onclick = () => { if (!S || FURNI.on) return; AU.resume(); AU.click(); this.sub.co = 'loan'; this.open('co'); };
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
      const ds = $('debtS'); ds.classList.toggle('hidden', !(S.debt > 0)); if (S.debt > 0) { $('debt').textContent = '借金 ' + yen(S.debt); ds.classList.toggle('warn', S.debt > debtLimit() * 0.8); }
      for (const b of $('speed').children) b.classList.toggle('on', +b.dataset.s === S.speed && !this.paused());
      const dots = $('nav').querySelectorAll('i.dot');
      dots[0].classList.toggle('on', S.devs.some(v => v.ready)); dots[6].classList.toggle('on', LEARN.newN > 0); dots[2].classList.toggle('on', !S.research.cur && RESEARCH.some(r => resState(r) === 'can' && S.rp >= r.rp));
      const g = GOALS[S.goal], gb = $('goal');
      gb.classList.toggle('hidden', !g || !!this.tab || !!this.studio || FURNI.on);
      if (g) { const html = `<b>目標</b>${esc(g.text)}${g.hint ? `<small>${esc(g.hint)}</small>` : ''}<small>ごほうび：${g.reward.money ? yen(g.reward.money) + '・' : ''}${g.reward.rp} RP</small>`; if (gb._h !== html) { gb.innerHTML = html; gb._h = html; } }
    }
    // ニュースの帯
    const nt = $('newsT');
    if (this.newsX < -this.newsW - 20) { const t = this.newsQ.shift() || (S.news[(Math.random() * Math.min(6, S.news.length)) | 0] || {}).t; if (t) { nt.textContent = '📰 ' + t; this.newsW = nt.offsetWidth; this.newsX = $('news').offsetWidth; } else this.newsX = -this.newsW - 21; }
    this.newsX -= dt * 70; nt.style.transform = `translateX(${this.newsX}px)`;
    // 開いているシートの中身（ゆっくり書きかえる）
    this.refreshT -= dt;
    LEARN.tick(dt);
    if (this.choiceQ.length && !this.modalOpen && !this.studio && !EVENT.active && !FURNI.on) this.showChoice(this.choiceQ.shift());
    if (this.tab && (this.dirtyF || (this.refreshT <= 0 && this.tab !== 'learn')) && !this.editing()) { this.render(); this.dirtyF = false; this.refreshT = 0.6; }
    if (this.studio && this.studio.dirty) { this.studio.dirty = false; this.renderStudio(); }
    if (this.rv) this.stepReview(dt);
    if (this.queue.length && !this.modalOpen && !this.studio && !EVENT.active && !FURNI.on && !this.choiceQ.length) { const id = this.queue.shift(); if (S.devs.find(v => v.id === id && v.ready)) this.launchModal(id); }
  },
  paused() { return !!this.studio || this.modalOpen || S.speed === 0 || FURNI.on || EVENT.active; },
  editing() { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA') && $('sheet').contains(a); },
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
    const titles = { dev: '開発', prod: '製品', res: '研究', staff: 'スタッフ', co: '会社', office: '事務所', menu: 'メニュー', learn: '学習（社会・経済）' };
    $('shTitle').textContent = titles[t] || '';
    let tabs = '', html = '';
    if (t === 'dev') html = this.pDev();
    else if (t === 'prod') { const s = this.sub.prod || 'on'; tabs = this.tabsHtml('prod', { on: '販売中', off: '販売終了' }, s); html = this.pProd(s); }
    else if (t === 'res') { const s = this.sub.res || 'gen'; tabs = this.tabsHtml('res', RES_CATS, s); html = this.pRes(s); }
    else if (t === 'staff') { const s = this.sub.staff || 'list'; tabs = this.tabsHtml('staff', { list: '社員', hire: '採用' }, s); html = this.pStaff(s); }
    else if (t === 'co') { const s = this.sub.co || 'sum'; tabs = this.tabsHtml('co', { sum: 'まとめ', biz: '経営', loan: '借金', share: 'シェア', mkt: '売る地域', rival: 'ライバル', goal: '目標' }, s); html = this.pCo(s); }
    else if (t === 'office') html = this.pOffice();
    else if (t === 'learn') { const s = this.sub.learn || 'note'; tabs = this.tabsHtml('learn', { note: '用語ノート', test: 'テスト', home: '家計', econ: '経済' }, s); html = LEARN.render(s); }
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
        h += `<div class="muted" style="margin-top:6px">試作テスト：見つかった不具合 ${found} 件のうち ${Math.floor(v.fixed)} 件直した（全部で約 ${v.bugs} 件）</div><div class="bar r"><i style="width:${(v.fixed / v.bugs) * 100}%"></i></div>`;
        const iss = v.issues || [], fx = Math.floor(v.fixed + 1e-6);
        h += `<div class="iss">${iss.slice(0, found).map((x, i) => `<span class="is ${i < fx ? 'ok' : 'ng'}">${i < fx ? '✓' : '！'} ${esc(x.n)}<small>${esc(x.t)}</small></span>`).join('')}${found < v.bugs ? `<span class="is un">？ まだ見つかっていない不具合</span>` : ''}</div>`;
        h += `<div class="row" style="margin-top:8px;gap:6px"><button class="btn sub small" data-act="fixRP" data-id="${v.id}" type="button" ${S.rp < rest * 3 || rest <= 0 ? 'disabled' : ''}>RPで全部直す（${rest * 3} RP）</button><span class="muted">${openB ? '品質チェックの人が直しています' : ''}</span></div>${v.left <= 0 && rest > 0 ? `<button class="btn red small" style="margin-top:6px" data-act="rush" data-id="${v.id}" type="button">不具合を残したまま発売（危険）</button>` : ''}`;
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
        <div class="kv"><span>値段</span><b>${yen(p.price)}（原価 ${yen(costOf(p))}）</b><span>先週売れた数</span><b>${num(p.lastWeek)} こ</b>${p.active ? `<span>需要・生産（先週）</span><b>${num(p.wDemL || 0)}・${num((p.wProdL || 0) * 7)} こ</b><span>在庫</span><b>${num(p.stock || 0)} こ ${p.state === 'over' ? '<span class="pill red">売れ残り</span>' : p.state === 'short' ? '<span class="pill gold">品薄</span>' : '<span class="pill green">ちょうどいい</span>'}</b>` : ''}<span>付加価値（1本）</span><b>${yen(addedPer(p))}</b>${p.auto ? '<span>価格</span><b class="pill blue">自動調節ON</b>' : ''}${p.defects ? `<span>欠陥</span><b style="color:var(--red)">不具合 ${p.defects}件</b>` : ''}<span>売れた数</span><b>${num(p.units)} こ</b><span>利益</span><b>${yen(p.profit - (p.devCost || 0))}</b>${p.kind === 'mech' ? (() => { const m = mechStats(p); return `<span>重さ・重心</span><b>${m.W.toFixed(1)}g・${m.cogPct.toFixed(0)}%</b>`; })() : ''}${p.legend ? `<span>中古の相場</span><b style="color:#9a7316">${yen(p.price * resaleMult(p))}</b>` : ''}</div>${p.legend ? '<span class="pill gold">名品</span>' : ''}${p.reissue ? '<span class="pill gold">復刻版</span>' : ''}</div></div>
        <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${p.active ? `<button class="btn sub small" data-act="priceM" data-id="${p.id}" type="button">値段と生産</button><button class="btn sub small" data-act="stop" data-id="${p.id}" type="button">販売終了</button>` : `<button class="btn sub small" data-act="resume" data-id="${p.id}" type="button">また売る</button>${p.legend ? `<button class="btn gold small" data-act="reissue" data-id="${p.id}" type="button">復刻版を作る</button>` : ''}`}<button class="btn small" data-act="copy" data-id="${p.id}" type="button">このデザインで新しく作る</button></div></div>`;
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
    const extra = m => { const tr = TRAITS[m.trait], fb = S.staff.includes(m) ? Math.round(FURNI.bonus(S, m) * 100) : 0, nx = m.lv < 5 ? LEVEL_XP[m.lv] : 0;
      return `${tr ? `<div class="trait"><b>特技：${esc(tr.name)}</b>${esc(tr.desc)}</div>` : ''}${S.staff.includes(m) ? `<div class="row" style="gap:8px;margin-top:6px"><span class="muted" style="font-size:12px;white-space:nowrap">${m.lv < 5 ? '次の昇格' : '最高レベル'}</span><div class="bar xp" style="flex:1;margin:0"><i style="width:${nx ? Math.min(100, (m.xp || 0) / nx * 100) : 100}%"></i></div>${fb ? `<span class="pill green">家具 +${fb}%</span>` : ''}</div>` : ''}`; };
    const person = (m, btn) => `<div class="card"><div class="row sb"><h3 style="margin:0">${esc(m.name)}</h3><span class="pill ${m.role === 'res' ? 'blue' : m.role === 'qa' ? '' : m.role === 'des' ? 'gold' : 'green'}">${ROLES[m.role].name}</span></div><div class="row sb" style="margin-top:4px"><span class="stars">${'★'.repeat(m.lv)}${'☆'.repeat(5 - m.lv)}</span><span class="muted">月給 ${yen(m.sal)}</span></div><div class="muted">${ROLES[m.role].desc}${m.role === 'res' ? `（1日 +${ROLES.res.rate[m.lv - 1]} RP）` : m.role === 'qa' ? `（1日 ${ROLES.qa.rate[m.lv - 1]} 件）` : m.role === 'sal' ? `（売上 +${Math.round(ROLES.sal.rate[m.lv - 1] * 100)}%）` : `（デザイン +${ROLES.des.rate[m.lv - 1]}）`}</div>${extra(m)}<div style="margin-top:8px">${btn}</div></div>`;
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
      h += `<div class="card"><div class="kv"><span>会社の価値</span><b>${yen(S.stats.value)}</b><span>先月の利益</span><b style="color:${S.stats.lastMonthProfit < 0 ? 'var(--red)' : 'var(--green)'}">${yen(S.stats.lastMonthProfit, true)}</b><span>先月の売上（収入）</span><b>${yen(S.stats.lastMonthRev)}</b><span>先月の付加価値</span><b>${yen(S.stats.lastAdded || 0)}</b><span>公共料金（先月）</span><b>${yen(S.stats.lastUtil || 0)}</b><span>投資の合計</span><b>${yen(S.stats.invest || 0)}</b><span>借金</span><b style="color:${S.debt > 0 ? 'var(--red)' : 'inherit'}">${yen(S.debt)}（上限 ${yen(debtLimit())}）</b><span>売上の合計</span><b>${yen(S.stats.sales)}</b><span>評判</span><b class="stars">${'★'.repeat(Math.round(clamp(S.brand, 0.4, 2.4) / 2.4 * 5))}${'☆'.repeat(5 - Math.round(clamp(S.brand, 0.4, 2.4) / 2.4 * 5))}</b><span>発売した数</span><b>${S.stats.launched}</b><span>いまの流行</span><b>${TRENDS[S.trend.id]}</b></div></div>`;
      h += `<div class="card"><div class="grp" style="margin-top:0">お金の動き（週ごと）</div><canvas class="chart" id="chart" width="600" height="220"></canvas></div>`;
      h += `<div class="card"><div class="grp" style="margin-top:0">最近のニュース</div>${S.news.slice(0, 8).map(n => `<div class="muted">${dateStr(n.d)}　${esc(n.t)}</div>`).join('') || '<div class="muted">まだありません</div>'}</div>`;
      setTimeout(() => this.drawChart(), 0);
    } else if (s === 'biz') { h += this.pBiz();
    } else if (s === 'loan') {
      const lim = debtLimit(), room = loanRoom(), r = LOAN.rate[S.tier], k = lim ? S.debt / lim : 0, AMT = [1e6, 5e6, 1e7, 5e7, 1e8, 5e8, 1e9, 5e9, 1e10, 5e10, 1e11];
      const chips = (act, max, all) => { const a = AMT.filter(v => v <= max).slice(-5); return a.map(v => `<button class="btn small ${act === 'repay' ? 'sub' : ''}" data-act="${act}" data-v="${v}" type="button">${yen(v)}</button>`).join('') + (max >= 1 ? `<button class="btn small ${act === 'repay' ? 'green' : 'gold'}" data-act="${act}" data-v="${Math.floor(max)}" type="button">${all}（${yen(max)}）</button>` : ''); };
      h += `<div class="card"><div class="kv"><span>借金</span><b style="color:${S.debt > 0 ? 'var(--red)' : 'inherit'};font-size:18px">${yen(S.debt)}</b><span>借りられる上限</span><b>${yen(lim)}</b><span>あと借りられる額</span><b>${yen(room)}</b><span>金利</span><b>年 ${(r * 100).toFixed(0)}%（毎月 約${yen(S.debt * r / 12)}）</b></div>
        <div class="bar ${k > 0.8 ? 'r' : k > 0.5 ? 'o' : 'g'}" style="margin-top:10px;height:12px"><i style="width:${Math.min(100, k * 100)}%"></i></div>
        <div class="muted" style="margin-top:6px;line-height:1.6">借りたお金で開発・広告・設備・引っ越しができます。利息は毎月はらいます。お金が足りなくなると自動で借ります。<b style="color:var(--red)">借金が上限をこえると倒産</b>します。</div></div>`;
      h += `<div class="card"><h3>借りる</h3><div class="row" style="gap:6px;flex-wrap:wrap">${room >= 1e6 ? chips('borrow', room, '上限まで') : '<span class="muted">いまはこれ以上借りられません</span>'}</div></div>`;
      const canPay = Math.min(S.debt, Math.max(0, Math.floor(S.money)));
      h += `<div class="card"><h3>返す</h3><div class="row" style="gap:6px;flex-wrap:wrap">${S.debt <= 0 ? '<span class="muted">借金はありません</span>' : canPay >= 1 ? chips('repay', canPay, canPay >= S.debt ? '全部返す' : '返せるだけ') : '<span class="muted">返すお金がありません</span>'}</div></div>`;
      h += `<div class="card"><h3>上限の内訳</h3><div class="kv">${loanParts().map(([n, v]) => `<span>${esc(n)}</span><b>${yen(v)}</b>`).join('')}${S.limitExtra ? `<span>前の版からの引きつぎ</span><b>${yen(S.limitExtra)}</b>` : ''}</div><div class="muted" style="margin-top:6px">事務所を広げる・製品を発売する・売上をのばす・海外に進出すると、上限が上がります。大きな事務所ほど金利も下がります。</div></div>`;
    } else if (s === 'share') {
      for (const k of KIND_IDS) {
        const sh = S.share[k]; if (!sh) continue;
        const rows = [[S.company, sh.me, '#2b6fd6', true], ...RIVALS.map((r, i) => [r.name, sh.rivals[i], r.color, false]).filter(x => x[1] > 0.001)].sort((a, b) => b[1] - a[1]);
        const mf = marketForm(k); if (mf === '独占に近い') learn('独占', `${KINDS[k].name}の市場`); if (mf === '寡占') learn('寡占', `${KINDS[k].name}の市場`); learn('自由競争', 'シェア画面を見た');
        h += `<div class="card"><div class="row sb"><h3 style="margin:0">${KINDS[k].name}</h3><span class="pill ${mf === '自由競争' ? 'green' : 'gold'}">${mf}</span></div>${rows.map(([n, v, c, me]) => `<div class="row" style="gap:8px;margin:3px 0"><span style="width:92px;font-size:12.5px;${me ? 'font-weight:900' : ''}">${esc(n)}</span><div class="bar" style="flex:1"><i style="width:${Math.min(100, v * 100)}%;background:${c}"></i></div><b style="width:42px;text-align:right;font-size:12.5px">${Math.round(v * 100)}%</b></div>`).join('')}</div>`;
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
  // 経営：産業（第1次・第3次）・グループ（トラスト・コンツェルン）・株式・CSR
  pBiz() {
    const K = S.corp, fp = FOREST_PRICE[K.forest], sp = STORE_PRICE[K.stores];
    let h = `<div class="card"><h3>産業を広げる</h3><div class="muted" style="margin-bottom:6px">文房具を作るのは第2次産業（工業）。材料をつくる第1次産業や、売る第3次産業にも進出できます。</div>
      <div class="biz"><div><b>森林（第1次産業：林業）</b><span>${K.forest}か所　木の軸の原価 −${K.forest * 5}%・林業の売上 月${yen(K.forest * 250000)}</span></div>${fp != null ? `<button class="btn small" data-act="forest" type="button" ${S.money >= fp ? '' : 'disabled'}>買う ${yen(fp)}</button>` : '<span class="pill green">最大</span>'}</div>
      <div class="biz"><div><b>直営店（第3次産業：小売業）</b><span>${K.stores}店　売れる数 +${K.stores * 3}%・お店のもうけ（売上の${(K.stores * 3.5).toFixed(1)}%）</span></div>${S.tier < 1 ? '<span class="pill">小さな事務所から</span>' : sp != null ? `<button class="btn small" data-act="store" type="button" ${S.money >= sp ? '' : 'disabled'}>出す ${yen(sp)}</button>` : '<span class="pill green">最大</span>'}</div>
      <div class="biz"><div><b>名入れ・修理（第3次産業：サービス）</b><span>${resDone('r_svc') ? `先月のサービスの売上 ${yen(S.stats.lastSvc || 0)}` : '研究「名入れ・修理サービス」で始められる'}</span></div></div></div>`;
    h += `<div class="card"><h3>グループ会社</h3>`;
    if (!K.hd) h += `<div class="muted">ちがう業種の会社をまとめて支配するには、まず持株会社（ホールディングス）をつくります（文具ビルから）。ライバルの文房具会社を買うのは同業種の合併（トラスト）です。</div><div style="margin-top:8px"><button class="btn small" data-act="hd" type="button" ${S.tier >= 2 && S.money >= 1e8 ? '' : 'disabled'}>ホールディングスをつくる（1億円）</button></div>`;
    else { const ow = K.subs.length; h += `<div class="muted">持株会社「${esc(S.company)}」${ow >= 2 ? '：いろいろな業種の会社を支配する<b>コンツェルン</b>になった' : ''}</div>` + SUBS.map(x => `<div class="biz"><div><b>${x.name}（${x.ind}）</b><span>${x.desc}</span></div>${K.subs.includes(x.id) ? '<span class="pill green">グループ</span>' : `<button class="btn small" data-act="subco" data-v="${x.id}" type="button" ${S.money >= x.price ? '' : 'disabled'}>買う ${yen(x.price)}</button>`}</div>`).join(''); }
    h += '</div><div class="card"><h3>株式</h3>';
    if (!K.listed) h += `<div class="muted">証券取引所に上場すると、株式を売り出して大きなお金を集められます（借金とちがって返さなくてよい）。かわりに株主へ配当をはらい、毎年6月の株主総会で信任を受けます。条件：文具ビル以上・発売8こ以上。</div><div style="margin-top:8px"><button class="btn gold small" data-act="ipo" type="button" ${S.tier >= 2 && S.stats.launched >= 8 ? '' : 'disabled'}>上場する（株式の30%を売り出す）</button></div>`;
    else h += `<div class="kv"><span>株価</span><b>${yen(K.sp)}</b><span>発行した株式</span><b>${num(K.shares)}株</b><span>株主が持つ株</span><b>${num(K.outside)}株（${Math.round(K.outside / K.shares * 100)}%）</b><span>時価総額</span><b>${yen(K.sp * K.shares)}</b><span>最後の配当</span><b>${yen(K.lastDiv || 0)}</b></div><div class="muted" style="margin-top:6px">株は100株単位で売買されます。株主は配当や株主優待を受け、株主総会に出られます（一株一票）。</div><div style="margin-top:8px"><button class="btn small ${K.yutai ? 'green' : 'sub'}" data-act="yutai" type="button">株主優待：${K.yutai ? 'ON（自社の文房具を送る）' : 'OFF'}</button></div>`;
    h += `</div><div class="card"><h3>CSR（企業の社会的責任）</h3>${CSR_ACTS.map(x => { const last = K.csr[x.id], wait = last != null ? 365 - (S.day - last) : 0, cost = x.base * (S.tier + 1); return `<div class="biz"><div><b>${x.name}</b><span>${x.desc}・評判 +</span></div>${wait > 0 ? `<span class="pill">あと${wait}日</span>` : `<button class="btn small" data-act="csr" data-v="${x.id}" type="button" ${S.money >= cost ? '' : 'disabled'}>${yen(cost)}</button>`}</div>`; }).join('')}</div>`;
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
    learn('土地', '事務所の場所（生産の三要素の土地）'); checkFactors();
    const O = OFFICES[S.tier], next = OFFICES[S.tier + 1], n = officeNeed(S.tier + 1);
    let h = `<div class="card"><div class="row sb"><h3 style="margin:0">${O.name}</h3><span class="pill">家賃 ${yen(O.rent)}／月</span></div><div class="muted">机 ${O.desks}・同時に開発 ${O.slots}・設備はLv${O.maxEq}まで</div></div>`;
    if (next) h += `<div class="card"><div class="row sb"><h3 style="margin:0">次：${next.name}</h3><span class="pill">${yen(next.cost)}</span></div><div class="muted">机 ${next.desks}・同時に開発 ${next.slots}・家賃 ${yen(next.rent)}／月</div><div class="muted">条件：発売 ${S.stats.launched}/${n.launched}・売上の合計 ${yen(S.stats.sales)} / ${yen(n.sales)}</div><div style="margin-top:8px"><button class="btn" data-act="move" type="button" ${n.ok ? '' : 'disabled'}>引っ越す</button></div></div>`;
    const cap = LINE_CAP[S.equip.line];
    h += `<div class="card"><div class="row sb"><h3 style="margin:0">生産</h3><span class="muted">1週間に ${num(cap)}（えんぴつなら${num(cap)}本）</span></div><div class="muted">いまの注文：${Math.round(S.capUse * 100)}%</div><div class="bar ${S.capUse > 1 ? 'r' : 'g'}"><i style="width:${Math.min(100, S.capUse * 100)}%"></i></div><div class="muted">シャーペンは3本分、万年筆は20本分の手間がかかる</div></div>`;
    const fb = S.staff.map(m => FURNI.bonus(S, m)), avg = fb.length ? fb.reduce((a, b) => a + b, 0) / fb.length : 0;
    h += `<div class="grp">家具</div><div class="card"><div class="row sb"><h3 style="margin:0">家具の配置</h3><span class="pill">${S.furn.length} / ${FURN_MAX[S.tier]}</span></div><div class="muted">観葉植物・照明・ホワイトボードなどを床に置くと、近くの机の人の仕事が速くなる。コーヒーマシンやソファは部屋のみんなに効いて、休けいの場所にもなる。</div><div class="muted" style="margin-top:4px">いまの効果：社員の平均 +${Math.round(avg * 100)}%（いちばん +${Math.round(Math.max(0, ...fb) * 100)}%）・部屋全体 +${Math.round(FURNI.globalBonus(S) * 100)}%</div><div style="margin-top:8px"><button class="btn" data-act="furnMode" type="button">家具を置く・模様がえ</button></div></div>`;
    h += '<div class="grp">設備</div>';
    for (const k of Object.keys(EQUIP)) {
      const E = EQUIP[k], lv = S.equip[k], mx = eqMax(k), pr = E.price[lv], top = (k === 'line' ? E.price.length : (E.max || 3));
      h += `<div class="card"><div class="row sb"><h3 style="margin:0">${E.name}</h3><span class="pill">Lv ${lv}${k === 'line' ? '' : ' / ' + (E.max || 3)}</span></div><div class="muted">${E.desc}</div><div style="margin-top:8px">${lv >= top ? '<span class="pill green">最大</span>' : lv >= mx ? `<span class="pill">事務所を広げると上げられる</span>` : `<button class="btn small" data-act="equip" data-k="${k}" type="button" ${S.money >= pr ? '' : 'disabled'}>Lv ${lv + 1} にする（${yen(pr)}）</button>`}</div></div>`;
    }
    return h;
  },
  pMenu() {
    return `<div class="card"><div class="row sb"><b>BGM</b><button class="btn small ${SET.music ? '' : 'sub'}" data-act="music" type="button">${SET.music ? 'オン' : 'オフ'}</button></div></div>
      <div class="card"><b>経済クイズ</b><div class="muted">ゲームの出来事に合わせて出る問題の多さ</div><div class="chips" style="margin-top:8px">${[['many', '多め'], ['mid', 'ふつう'], ['off', '出さない']].map(([k, n]) => `<button class="chip ${(SET.quiz || 'mid') === k ? 'on' : ''}" data-act="quizSet" data-v="${k}" type="button">${n}</button>`).join('')}</div></div>
      <div class="card"><b>画質</b><div class="chips" style="margin-top:8px">${[['high', '高画質'], ['std', '標準'], ['low', '軽量']].map(([k, n]) => `<button class="chip ${SET.quality === k ? 'on' : ''}" data-act="quality" data-v="${k}" type="button">${n}</button>`).join('')}</div></div>
      <div class="card"><b>遊び方</b><div class="muted" style="margin-top:6px;line-height:1.7">① 「開発」で文房具を選び、性能（芯・インク・機構など）と見た目（色・模様・ロゴ）を決めて開発する。<br>② 開発が終わったら値段と広告を決めて発売。レビューの点と値段で売れゆきが決まる。<br>③ 「研究」で新しい技術を開くと、もっといい製品が作れる。年がたつとお客さんの期待も上がる。<br>④ 「スタッフ」で研究員・品質チェック・デザイナー・営業をやとう。<br>⑤ 「事務所」で設備を買い、引っ越して会社を大きくしよう。季節（新学期・年末）や流行の色もねらおう。<br>⑥ お金が足りないときは「会社」の「借金」で借りられます（開発や広告も借りて始められる）。上限は会社が育つと上がり、こえると倒産です。<br>上の ▶ で時間の速さ、Ⅱ で一時停止。自動でセーブされます。</div></div>
      <div class="card"><button class="btn red small" data-act="reset" type="button">最初からやり直す</button></div>`;
  },
  // ---------- クリック ----------
  onClick(e) {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const a = b.dataset.act, id = +b.dataset.id; AU.resume(); AU.click();
    if (a[0] === 'L' && a.length > 1 && a[1] === a[1].toLowerCase() && LEARN.onClick) return LEARN.onClick(a, b);
    if (a === 'evc') { const st = this.modalState; this.closeModal(); const o = st && st.choice && st.choice.opts[+b.dataset.i]; if (o && o.fn) o.fn(); this.dirty(); return; }
    if (a === 'sub') { this.sub[b.dataset.k] = b.dataset.v; $('shBody').scrollTop = 0; this.render(); return; }
    if (a === 'newDev') return this.openStudio({ kind: b.dataset.k });
    if (a === 'launchM') return this.launchModal(id);
    if (a === 'fixRP') { const v = S.devs.find(x => x.id === id); if (v && fixWithRP(v)) this.toast('RPを使って不具合を直した', 'good'); }
    else if (a === 'priceM') return this.priceModal(id);
    else if (a === 'stop') { const p = S.products.find(x => x.id === id); if (p) { const v = stopProduct(p); this.toast(`「${p.name}」の販売を終えた${v ? `（のこった在庫を安く売った ${yen(v, true)}）` : ''}`); } }
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
    else if (a === 'borrow') { const n = borrow(+b.dataset.v); if (n) { AU.coin(); this.toast(`${yen(n)}を借りた（借金 ${yen(S.debt)}）`, 'gold'); } }
    else if (a === 'repay') { const n = repay(+b.dataset.v); if (n) { AU.coin(); this.toast(S.debt > 0 ? `${yen(n)}を返した（のこり ${yen(S.debt)}）` : `借金を全部返した！`, 'good'); } }
    else if (a === 'borrowDev') { const d = this.studio.d, short = devPlan(d).devCost - S.money; if (short > 0 && borrow(short) < short) { this.toast('借りられる額が足りない', 'bad'); return; } this.toast(`${yen(Math.max(0, short))}を借りた`, 'gold'); const why = startDev(d); if (why) { this.toast(why, 'bad'); AU.bad(); } else { AU.coin(); this.toast(`「${d.name}」の開発を始めた！`, 'good'); this.closeStudio(); this.open('dev'); } return; }
    else if (a === 'forest') { if (buyForest()) { AU.coin(); LEARN.ask('第1次・第2次・第3次産業'); } else this.toast('お金が足りない', 'bad'); }
    else if (a === 'store') { if (buyStore()) { AU.coin(); LEARN.ask('第1次・第2次・第3次産業'); } else this.toast('お金が足りない（直営店は小さな事務所から）', 'bad'); }
    else if (a === 'hd') { if (makeHD()) { AU.fanfare(); LEARN.ask('ホールディングス'); } }
    else if (a === 'subco') { if (buySub(b.dataset.v)) { AU.fanfare(); if (S.corp.subs.length === 2) LEARN.ask('コンツェルン'); } else this.toast('お金が足りない', 'bad'); }
    else if (a === 'ipo') { const r = listIPO(); if (r) { AU.fanfare(); this.toast(`上場！ ${yen(r)}を集めた`, 'gold'); LEARN.ask('株式'); } }
    else if (a === 'yutai') { S.corp.yutai = !S.corp.yutai; if (S.corp.yutai) learn('株主', '株主優待を始めた'); }
    else if (a === 'csr') { const c = doCSR(b.dataset.v); if (c) { AU.coin(); this.toast(`CSR：${CSR_ACTS.find(x => x.id === b.dataset.v).name}（${yen(c)}）`, 'good'); LEARN.ask('CSR（企業の社会的責任）'); } else this.toast('お金が足りないか、1年たっていない', 'bad'); }
    else if (a === 'rush') { const v = S.devs.find(x => x.id === id); if (v) return this.ask(`不具合が${Math.ceil(v.bugs - v.fixed)}件のこったまま発売しますか？ 欠陥商品で事故が起きると、PL法（製造物責任法）で損害賠償をはらうことがあります。`, () => { v.defects = Math.ceil(v.bugs - v.fixed); v.fixed = v.bugs; v.ready = true; this.readyQueue(v.id); learn('消費者問題', '不具合をのこして発売'); }); }
    else if (a === 'plan') { const p = S.products.find(x => x.id === this.modalState.id); if (p) { p.plan = b.dataset.v; learn('供給', '作る数を決めた'); } this.priceModal(this.modalState.id, true); return; }
    else if (a === 'autoP') { const p = S.products.find(x => x.id === this.modalState.id); if (p) { p.auto = !p.auto; if (p.auto) { for (const t of ['価格の自動調節機能', 'アダム・スミス', '神の見えざる手', '市場経済']) learn(t, `「${p.name}」の価格の自動調節をONにした`); LEARN.ask('価格の自動調節機能'); } } this.priceModal(this.modalState.id, true); return; }
    else if (a === 'furnMode') { this.open(null); FURNI.enter(); return; }
    else if (a === 'equip') { if (buyEquip(b.dataset.k)) { AU.coin(); this.toast(`${EQUIP[b.dataset.k].name}を Lv${S.equip[b.dataset.k]} にした`, 'good'); } }
    else if (a === 'quizSet') { SET.quiz = b.dataset.v; saveSet(); }
    else if (a === 'music') { SET.music = !SET.music; saveSet(); AU.setVol(); }
    else if (a === 'quality') { SET.quality = b.dataset.v; saveSet(); applyQuality(); OFFICE.key = ''; }
    else if (a === 'reset') return this.ask('会社を消して最初からやり直します。よろしいですか？', () => { S.over = true; try { localStorage.removeItem('bstudy-save'); } catch (er) { /* なし */ } location.reload(); });
    // スタジオ
    else if (a === 'stTab') { this.studio.tab = b.dataset.v; $('stBody').scrollTop = 0; this.renderStudio(); return; }
    else if (a === 'spec') { const d = this.studio.d; d.spec[b.dataset.k] = b.dataset.v; this.studio.changed(); return; }
    else if (a === 'look') { const d = this.studio.d; d.look[b.dataset.k] = b.dataset.v; this.studio.changed(); return; }
    else if (a === 'mpre') { const d = this.studio.d, pr = MECH_PRESETS.find(x => x.id === b.dataset.v); if (pr) { d.build = Object.assign(JSON.parse(JSON.stringify(DEF_BUILD)), JSON.parse(JSON.stringify(pr.b))); for (const [k, v] of Object.entries(pr.spec || {})) { const o = optOf('mech', k, v); if (o && resDone(o.req)) d.spec[k] = v; } this.toast(`「${pr.name}」の型にした${mechLocks(d).length ? '（まだ研究していない部品があります）' : ''}`); } this.studio.changed(); return; }
    else if (['mmat', 'mfin', 'msec', 'mwin', 'mcog', 'mgd', 'mgl', 'mtog', 'mshape'].includes(a)) {
      const bd = mechBuild(this.studio.d), v = b.dataset.v;
      if (a === 'mmat') { bd.mat[b.dataset.k] = v; if (v === 'wood') learn('土地', '天然木の軸（天然物は生産の三要素の土地）'); else if (v === 'wood2' || v === 'resin') learn('資本', '強化木や樹脂の軸（人工物は生産の三要素の資本）'); if (!GRIP_FIN[bd.fin].ok(MECH_MATS[bd.mat.grip])) bd.fin = MECH_MATS[bd.mat.grip].soft ? 'dots' : 'plain'; if (bd.mat.clip === 'none') bd.clipret = false; }
      else if (a === 'mfin') bd.fin = v; else if (a === 'msec') bd.sec = v; else if (a === 'mwin') bd.win = v; else if (a === 'mcog') bd.cog = v;
      else if (a === 'mgd') bd.gripD = +v; else if (a === 'mgl') bd.gripL = +v; else if (a === 'mtog') bd[b.dataset.k] = !bd[b.dataset.k]; else if (a === 'mshape') bd[b.dataset.k] = v;
      if (a === 'mwin' && v === 'free') bd.winX = Math.min(bd.L - 22, (bd.mat.clip === 'none' ? 20 : bd.clipTop + bClipL(bd) + 6));   // クリップのすぐ下から
      this.studio.changed(); return;
    }
    else if (a === 'reissue') { const p = S.products.find(x => x.id === id); if (p) return this.openStudio({ kind: p.kind, spec: { ...p.spec }, look: { ...p.look }, build: p.build, name: p.name.replace(/ 復刻版$/, '') + ' 復刻版', price: Math.round(p.price * 1.2), reissue: 0.9 }); }
    else if (a === 'polish') { const d = this.studio.d; d.polish = +b.dataset.v; d.bonus = polishBonus(d.kind, d.polish); this.studio.changed(); return; }
    else if (a === 'randName') { this.studio.d.name = randName(this.studio.d.kind); this.renderStudio(); return; }
    else if (a === 'recPrice') { this.studio.d.price = recPrice(this.studio.d); this.studio.d.priceAuto = true; this.renderStudio(); return; }
    else if (a === 'startDev') { const why = startDev(this.studio.d); if (why) { this.toast(why, 'bad'); AU.bad(); } else { AU.coin(); this.toast(`「${this.studio.d.name}」の開発を始めた！`, 'good'); this.closeStudio(); this.open('dev'); } return; }
    // モーダル
    else if (a === 'ad') { this.modalState.ad = b.dataset.v; this.renderLaunch(); return; }
    else if (a === 'doLaunch') { const st = this.modalState, ad = ADS.find(x => x.id === st.ad), short = ad.cost - S.money; if (short > 0) { if (short > loanRoom()) { this.toast('お金が足りない', 'bad'); return; } borrow(short); this.toast(`広告のために ${yen(short)} を借りた`, 'gold'); } const p = launch(st.id, st.price, st.ad); if (!p) { this.toast('お金が足りない', 'bad'); return; } this.closeModal(); this.open(null); EVENT.start(p, st.ad, () => this.reviewModal(p)); return; }
    else if (a === 'later') { this.closeModal(); return; }
    else if (a === 'setPrice') { const p = S.products.find(x => x.id === this.modalState.id); if (p) { p.price = Math.max(1, Math.round(this.modalState.price)); this.toast(`「${p.name}」を ${yen(p.price)} にした`); learn('価格', '値段を変えた'); } this.closeModal(); return; }
    else if (a === 'toEq') { const p = S.products.find(x => x.id === this.modalState.id); if (p) { this.modalState.price = niceP(balPrice(p)); this.priceModal(p.id, true); LEARN.ask('均衡価格'); } return; }
    else if (a === 'closeM') { const rv = this.modalState && this.modalState.review; this.closeModal(); if (rv) { OFFICE.event('launch'); checkGoals(); } return; }
    else if (a === 'rvSkip') { if (this.rv) this.rv.t = 99; return; }
    else if (a === 'yes') { const f = this.modalState && this.modalState.yes; this.closeModal(); if (f) f(); this.dirty(); return; }
    else if (a === 'restart') { try { localStorage.removeItem('bstudy-save'); } catch (er) { /* なし */ } location.reload(); return; }
    else if (a === 'startNew') { const v = ($('newCo').value || '').trim().slice(0, 16) || 'ぶんぐ工房'; this.closeModal(); GAMEFLOW.begin(newState(v), true); return; }
    if (S) checkGoals();
    this.dirty(); this.render();
  },
  onInput(e) {
    const t = e.target;
    if (this.studio && t.dataset.look) { this.studio.d.look[t.dataset.look] = t.value; this.studio.changed(t.type === 'text'); return; }
    if (this.studio && t.id === 'stName') { this.studio.d.name = t.value; return; }
    if (this.studio && t.dataset.mb) { const bd = mechBuild(this.studio.d), k = t.dataset.mb; bd[k] = +t.value; if (k === 'D' && !bd.Dr) bd.Dr = 0; const lab = $('mb_' + k); if (lab) lab.textContent = (+t.value).toFixed(+(t.dataset.fix || 0)); this.studio.changed(true); this.studioFoot(); const rd = $('mbRead'); if (rd) rd.innerHTML = this.buildReadout(this.studio.d); return; }
    if (this.studio && (t.id === 'stPrice' || t.id === 'stPriceR')) { const v = Math.max(1, Math.round(+t.value || 1)); this.studio.d.price = v; this.studio.d.priceAuto = false; if (t.id === 'stPriceR') $('stPrice').value = v; else $('stPriceR').value = v; this.studioMeter(); this.studioFoot(); return; }
    if (this.modalOpen && (t.id === 'mPrice' || t.id === 'mPriceR')) { const v = Math.max(1, Math.round(+t.value || 1)); this.modalState.price = v; if (t.id === 'mPriceR') $('mPrice').value = v; else $('mPriceR').value = v; const ev = $('mPriceEval'); if (ev) ev.innerHTML = this.priceEval(this.modalState.d, v); }
  },
  // ---------- 開発スタジオ ----------
  openStudio(init) {
    learn('付加価値', '開発スタジオ：付加価値＝売り値−仕入れ値（原材料費）');
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
    $('pvMeter').innerHTML = `性能 <b>${P}</b>（期待 ${ex.toFixed(0)}）<div class="bar ${q >= 1 ? 'g' : q >= 0.85 ? '' : 'r'}"><i style="width:${Math.min(100, q / 1.4 * 100)}%"></i><u style="left:${100 / 1.4}%"></u></div>デザイン <b>${des.toFixed(1)}</b><div class="bar o"><i style="width:${des * 10}%"></i></div>原価 <b>${yen(c)}</b>　値段 <b>${yen(d.price)}</b><br>付加価値 <b>${yen(d.price - c)}</b><small>（売り値−仕入れ値）</small>${d.kind === 'mech' ? (() => { const m = mechStats(d); return `<br>重さ <b>${m.W.toFixed(1)}g</b>　重心 <b>${m.cogPct.toFixed(1)}%</b>`; })() : ''}`;
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
    const pipe = d.spec.tip === 't1' ? 4 : 3, TIP = bTip(b), KN = bCap(b), CL = bClipL(b), Rr = bDr(b) / 2, bx0 = TIP + b.gripL, WS = MECH_WSIZE[b.winSize] || MECH_WSIZE.mid;
    let g = `<rect x="${X(-pipe)}" y="${cy - 0.6}" width="${X(0) - X(-pipe)}" height="1.2" fill="#888"/>`;
    g += `<polygon points="${X(0)},${cy - 1.2 * ys} ${X(TIP)},${cy - (Rg - 0.4) * ys} ${X(TIP)},${cy + (Rg - 0.4) * ys} ${X(0)},${cy + 1.2 * ys}" fill="${c('tip')}" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>`;
    g += rect(TIP, bx0, Rg, c('grip')) + `<polygon points="${X(bx0)},${cy - R * ys} ${X(L - KN)},${cy - Rr * ys} ${X(L - KN)},${cy + Rr * ys} ${X(bx0)},${cy + R * ys}" fill="${c('barrel')}" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>` + rect(L - KN, L, 2.4, c('knock'));
    if (b.fin === 'knurlF' || b.fin === 'knurlC') for (let x = TIP + 2; x < bx0 - 1; x += b.fin === 'knurlF' ? 1.6 : 2.6) g += `<line x1="${X(x)}" y1="${cy - Rg * ys}" x2="${X(x + 1.2)}" y2="${cy + Rg * ys}" stroke="rgba(0,0,0,.25)" stroke-width=".7"/>`;
    if (b.win !== 'none') { const wx = mechWinX(b), ww = WS.w * sx * 1.2; g += `<rect x="${X(wx) - ww / 2}" y="${cy - 3.5}" width="${ww}" height="7" rx="1" fill="#fff" stroke="#333" stroke-width=".8"/><text x="${X(wx)}" y="${cy + 2.4}" font-size="6" font-weight="700" text-anchor="middle" fill="#111">${b.winSize === 'band' ? '◀' + (b.winText || 'HB') : b.winText || 'HB'}</text>`; }
    if (b.mat.clip !== 'none') { const r0 = L - b.clipTop; g += `<rect x="${X(r0 - CL)}" y="${cy - R * ys - 4}" width="${X(r0) - X(r0 - CL)}" height="${b.clipShape === 'wide' ? 3.6 : b.clipShape === 'wire' ? 1.6 : 2.6}" rx="1.3" fill="${b.mat.clip === 'resin' ? d.look.clipColor : '#aab0b8'}" stroke="rgba(0,0,0,.4)" stroke-width=".6"/>`; }
    g += `<polygon points="${X(m.cog)},${cy + R * ys + 3} ${X(m.cog) - 5},${cy + R * ys + 11} ${X(m.cog) + 5},${cy + R * ys + 11}" fill="#d9493e"/><text x="${X(m.cog)}" y="${cy + R * ys + 19}" font-size="7.5" text-anchor="middle" fill="#d9493e">重心 ${Math.round(m.cog)}mm</text>`;
    g += `<text x="${X(-pipe)}" y="10" font-size="7" fill="#6f6a60">← 先</text><text x="${X(L)}" y="10" font-size="7" text-anchor="end" fill="#6f6a60">ノック →</text>`;
    return `<svg viewBox="0 0 310 64" style="width:100%;height:auto;margin-top:8px;background:#fff;border-radius:10px;border:1px solid var(--line)">${g}</svg>`;
  },
  studioBuild(d) {
    const b = mechBuild(d), M = MECH_MATS, lock = r => !!r && !resDone(r);
    const chip = (act, k, v, on, name, small, locked) => `<button type="button" class="chip ${on ? 'on' : ''} ${locked ? 'lock' : ''}" ${locked ? '' : `data-act="${act}" data-k="${k}" data-v="${v}"`}>${name}${small ? `<small>${small}</small>` : ''}</button>`;
    const slider = (k, label, min, max, step, val, unit = 'mm', fix = 0) => `<div class="muted" style="margin-top:6px">${label} <b id="mb_${k}">${(+val).toFixed(fix)}</b> ${unit}</div><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-mb="${k}" data-fix="${fix}">`;
    const shapes = (k, tbl) => `<div class="chips">${Object.entries(tbl).map(([v, t]) => chip('mshape', k, v, b[k] === v, t.name, t.note || '')).join('')}</div>`;
    let h = `<div class="card" id="mbRead" style="margin-top:8px">${this.buildReadout(d)}</div>`;
    h += `<div class="grp">寸法</div>` + slider('L', '全長', 128, 160, 1, b.L) + slider('D', '軸の太さ（前）', 7, 12, 0.1, b.D, 'mm', 1) + slider('Dr', '軸の太さ（後ろ）', 6.5, 12, 0.1, bDr(b), 'mm', 1);
    h += `<div class="muted" style="margin-top:6px">軸の断面</div><div class="chips">${Object.entries(MECH_SECS).map(([k, v]) => chip('msec', '', k, b.sec === k, v.name, v.roll ? 'ころがりにくい' : '', lock(v.req))).join('')}</div>`;
    h += `<div class="grp">口金（先の金具）</div>` + shapes('tipShape', MECH_TIPS) + slider('tipL', '口金の長さ', 8, 22, 1, bTip(b));
    h += `<div class="grp">グリップ</div>` + shapes('gripShape', MECH_GRIPS) + slider('gripL', 'グリップの長さ', 16, 52, 1, b.gripL) + slider('gripD', 'グリップの太さ（軸とのちがい）', -1.5, 3, 0.1, b.gripD, 'mm', 1);
    const gm = M[b.mat.grip];
    h += `<div class="muted" style="margin-top:6px">グリップの加工</div><div class="chips">${Object.entries(GRIP_FIN).filter(([, f]) => f.ok(gm)).map(([k, f]) => chip('mfin', '', k, b.fin === k, f.name, `にぎりやすさ ${Math.round(f.q(gm) * 100)}`, lock(f.req))).join('')}</div>`;
    h += `<div class="grp">天冠（ノック）</div>` + shapes('capShape', MECH_CAPS) + slider('capL', '天冠の長さ', 9, 26, 1, bCap(b));
    h += `<div class="grp">クリップ</div>${b.mat.clip === 'none' ? '<div class="muted">クリップなし（下の素材で「なし」以外を選ぶとつけられる）</div>' : shapes('clipShape', MECH_CLIPS) + slider('clipLen', 'クリップの長さ', 22, 56, 1, bClipL(b)) + slider('clipTop', 'クリップの位置（上のはしから）', 10, 90, 1, b.clipTop)}`;
    h += `<div class="grp">硬度表示窓</div><div class="muted">位置</div><div class="chips">${Object.entries(MECH_WIN).map(([k, n]) => chip('mwin', '', k, b.win === k, n, '', k !== 'none' && lock('r_hwin'))).join('')}</div>`;
    if (b.win !== 'none') {
      if (b.win === 'free') h += slider('winX', '窓の位置（上のはしから）', 12, b.L - 20, 1, b.winX || 30);
      h += `<div class="muted" style="margin-top:6px">窓の大きさ</div><div class="chips">${Object.entries(MECH_WSIZE).map(([k, w]) => chip('mshape', 'winSize', k, (b.winSize || 'mid') === k, w.name, w.h ? `${w.w}×${w.h}mm` : '輪に全部の硬さ')).join('')}</div>`;
      h += `<div class="muted" style="margin-top:6px">窓に出す硬さ</div><div class="chips">${WIN_TEXT.map(t => chip('mshape', 'winText', t, (b.winText || 'HB') === t, t, '')).join('')}</div>`;
    }
    h += `<div class="grp">部品ごとの素材（重さと重心が変わる）</div>`;
    for (const [pk, P] of Object.entries(MECH_PARTS)) {
      h += `<div class="muted" style="margin-top:6px">${P.name}</div><div class="chips">${P.mats.map(mk => { const m = M[mk], lk = lock(m.req) && !(P.free || []).includes(mk); return chip('mmat', pk, mk, b.mat[pk] === mk, m.name, mk === 'none' ? '' : `${m.dens} g/cm³${lk ? '・🔒' : ''}`, lk); }).join('')}</div>`;
    }
    h += `<div class="grp">重心のおもり</div><div class="chips">${Object.entries(MECH_COG).map(([k, c]) => chip('mcog', '', k, b.cog === k, c.name, c.mass ? `+${c.mass}g` : '', lock(c.req))).join('')}</div>`;
    h += `<div class="grp">機能</div><div class="chips">${chip('mtog', 'cushion', '', b.cushion, '芯クッション', b.cushion ? 'あり' : 'なし', lock('r_cushion'))}${chip('mtog', 'clipret', '', b.clipret, 'クリップでパイプ収納', b.clipret ? 'あり' : 'なし', lock('r_clipret') || b.mat.clip === 'none')}</div>`;
    h += `<div class="muted" style="margin-top:10px;line-height:1.6">重心は先から全長の45%くらいより下だと、先が安定して製図をする人に好まれます。学生は軽め（10〜14g）とやわらかいグリップ、社会人は金属や木の高級感が好き。クリップが下すぎると指に当たり、硬度表示窓をクリップの下にするとかくれます。</div>`;
    h += `<div class="grp">見本から始める（あとから部品を自由に変えられる）</div><div class="chips">${MECH_PRESETS.map(p => chip('mpre', '', p.id, false, esc(p.name), esc(p.note))).join('')}</div>`;
    return h;
  },
  studioFoot() {
    const d = this.studio.d, pl = devPlan(d), why = canStartDev(d), short = pl.devCost - S.money;
    // お金だけが足りないなら、借りて開発できる
    let loanBtn = '';
    if (short > 0) { const m = S.money; S.money = pl.devCost; const why2 = canStartDev(d); S.money = m; if (!why2) loanBtn = short <= loanRoom() ? `<button class="btn gold" data-act="borrowDev" type="button">${yen(short)}借りて開発</button>` : `<span class="muted" style="color:var(--red)">借金の上限まであと${yen(loanRoom())}</span>`; }
    $('stFoot').innerHTML = `<div class="muted">開発費 <b>${yen(pl.devCost)}</b>・${pl.days}日・不具合 約${Math.max(1, Math.round(pl.bugs))}件${why ? `<br><span style="color:var(--red)">${esc(why)}</span>` : ''}</div>${loanBtn || `<button class="btn green" data-act="startDev" type="button" ${why ? 'disabled' : ''}>開発スタート</button>`}`;
  },
  priceEval(d, price) { const q = perfP(d) / expected(d.kind), fair = fairPrice(d, q), r = fair / price; return r > 1.25 ? '<span class="pill green">とても安い</span>' : r > 1.02 ? '<span class="pill green">お買い得</span>' : r > 0.85 ? '<span class="pill">ふつう</span>' : r > 0.65 ? '<span class="pill gold">少し高い</span>' : '<span class="pill red">高すぎる</span>'; },
  // ---------- モーダル ----------
  showModal(html) { $('modalBox').innerHTML = html; $('modal').classList.add('on'); this.modalOpen = true; $('modalBox').scrollTop = 0; },
  closeModal() { $('modal').classList.remove('on'); this.modalOpen = false; this.modalState = null; this.rv = null; this.dirty(); },
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
      <div class="grp">広告（最初の数週間よく売れる）</div><div class="chips">${ADS.map(a => `<button type="button" class="chip ${st.ad === a.id ? 'on' : ''}" data-act="ad" data-v="${a.id}" ${S.money + loanRoom() < a.cost ? 'disabled style="opacity:.4"' : ''}>${a.name}<small>${a.cost ? yen(a.cost) + '・' : ''}${a.boost ? '売れゆき +' + Math.round(a.boost * 100) + '%' : 'お金はかからない'}</small></button>`).join('')}</div>
      <div class="row" style="margin-top:14px;gap:8px"><button class="btn sub" data-act="later" type="button">あとで</button><button class="btn green" style="flex:1" data-act="doLaunch" type="button" ${S.money + loanRoom() < ad.cost ? 'disabled' : ''}>${S.money < ad.cost ? `足りない${yen(ad.cost - S.money)}を借りて発売` : `発売する${ad.cost ? `（広告 ${yen(ad.cost)}）` : ''}`}</button></div>`);
  },
  // レビューの発表：点数が数えあがり、星・3つの点・コメントが順番に出る
  reviewModal(p) {
    const col = p.review >= 8 ? 'var(--green)' : p.review >= 6 ? 'var(--blue)' : p.review >= 4 ? 'var(--gold)' : 'var(--red)';
    const bar = (k, n) => `<div class="rvb"><span>${n}</span><div class="bar"><i id="rvb_${k}" style="width:0%"></i></div><b id="rvn_${k}">0.0</b></div>`;
    this.showModal(`<div class="review" data-act="rvSkip"><div class="muted">発売しました！ みんなの評価は…</div><img alt="" src="${productThumb(p)}" style="width:110px;height:110px;border-radius:14px;margin-top:8px"><h2>${esc(p.name)}</h2>
      <div class="rvs" id="rvScore" style="color:${col}">0.0</div><div class="stars rvstars" id="rvStars" style="font-size:22px">☆☆☆☆☆</div>
      <div class="rvbars">${bar('perf', '性能')}${bar('des', 'デザイン')}${bar('val', '値段の満足')}</div>
      ${p.comments.map(([w, t], i) => `<div class="cm rvc" id="rvc${i}"><b>${esc(w)}</b>${esc(t)}</div>`).join('')}
      <div class="muted rvhint" id="rvHint">タップでとばす</div>
      <button class="btn big rvok" id="rvOk" style="margin-top:10px" data-act="closeM" type="button">OK</button></div>`);
    this.modalState = { review: true };
    this.rv = { p, t: 0, tick: 0, end: false, shown: -1 };
  },
  stepReview(dt) {
    const R = this.rv, p = R.p, T = 1.5; if (!$('rvScore')) { this.rv = null; return; }
    R.t += dt; const k = clamp(R.t / T, 0, 1), e = 1 - Math.pow(1 - k, 3), v = p.review * e;
    $('rvScore').textContent = v.toFixed(1); $('rvStars').textContent = stars10(v);
    if (k < 1) { R.tick -= dt; if (R.tick <= 0) { R.tick = 0.07; if (AU.ok()) AU.tone(600 + v * 90, AU.ac.currentTime, 0.04, 'square', 0.03); } }
    ['perf', 'des', 'val'].forEach((key, i) => { const kk = clamp((R.t - T - i * 0.25) / 0.5, 0, 1), x = p.scores[key] * (1 - Math.pow(1 - kk, 2)); $('rvb_' + key).style.width = x * 10 + '%'; $('rvn_' + key).textContent = x.toFixed(1); });
    p.comments.forEach((c, i) => { if (R.t > T + 0.9 + i * 0.55) { const el = $('rvc' + i); if (el && !el.classList.contains('show')) { el.classList.add('show'); if (AU.ok()) AU.tone(880, AU.ac.currentTime, 0.08, 'triangle', 0.05); } } });
    if (k >= 1 && !R.end) { R.end = true; $('rvScore').classList.add('pop'); if (p.review >= 8) AU.fanfare(); else if (p.review >= 6) AU.chime(); else if (p.review < 4) AU.bad(); else AU.coin(); }
    if (R.t > T + 1.0 + p.comments.length * 0.55) { $('rvHint').classList.add('hidden'); $('rvOk').classList.add('show'); this.rv = null; }
  },
  // 値段と生産：需要曲線・供給曲線・均衡価格。在庫の多さ（作る数）と価格の自動調節
  priceModal(id, keep) {
    const p = S.products.find(x => x.id === id); if (!p) return; const c = costOf(p), rp = recPrice(p), mx = Math.max(rp * 4, c * 6);
    if (!keep) this.modalState = { id, price: p.price, d: p };
    for (const t of ['需要', '需要曲線', '供給曲線', '均衡価格']) learn(t, `「${p.name}」の値段と生産を見た`);
    const pe = niceP(balPrice(p)), price = this.modalState.price;
    this.showModal(`<h2>「${esc(p.name)}」の値段と生産</h2><div class="muted">原価（仕入れ値）${yen(c)}・付加価値 ${yen(price - c)}／本</div>
      ${this.ddChart(p, price, pe)}
      <div class="muted" style="font-size:12.5px;line-height:1.6">青：<b>需要曲線</b>（値段が高いほど買う人が少ない）　オレンジ：<b>供給曲線</b>（値段が高いほどたくさん作りたい）。交わる所が<b>均衡価格</b>（約${yen(pe)}）。</div>
      <div class="grp">値段</div><div class="row"><input class="txt" id="mPrice" type="number" inputmode="numeric" min="1" value="${price}" style="width:130px"><span id="mPriceEval">${this.priceEval(p, price)}</span><button class="btn sub small" data-act="toEq" type="button">均衡価格にする</button></div>
      <input type="range" id="mPriceR" min="${Math.max(1, Math.floor(c * 0.8))}" max="${Math.ceil(mx)}" value="${price}" style="margin-top:8px">
      <div class="grp">作る数（供給）</div><div class="chips">${Object.entries(PLAN).map(([k, v]) => `<button class="chip ${(p.plan || 'mid') === k ? 'on' : ''}" data-act="plan" data-v="${k}" type="button">${v.name}<small>供給 ×${v.f}</small></button>`).join('')}</div>
      <div class="muted" style="font-size:12.5px">多めにすると供給曲線が右へ動く（均衡価格は下がる）。売れ残りの在庫には倉庫代がかかる。</div>
      <div class="grp">価格の自動調節機能</div><button class="btn ${p.auto ? 'green' : 'sub'} small" data-act="autoP" type="button">${p.auto ? 'ON：売れ残れば下げ、品薄なら上げる' : 'OFF（自分で決める）'}</button>
      <div class="muted" style="font-size:12.5px;margin-top:4px">アダム・スミスはこのはたらきを「神の見えざる手」と呼んだ。</div>
      <div class="row" style="margin-top:14px;gap:8px"><button class="btn sub" data-act="closeM" type="button">やめる</button><button class="btn" style="flex:1" data-act="setPrice" type="button">この値段にする</button></div>`);
  },
  ddChart(p, price, pe) {
    const c = costOf(p), hi = Math.max(price, pe, p.Pr || 0) * 1.5, lo = c * 1.02, N = 28, pts = [];
    for (let k = 0; k <= N; k++) { const P = lo + (hi - lo) * k / N; pts.push([P, demandAt(p, P) * 7, supplyAt(p, P) * 7]); }
    const qmax = Math.max(1, supplyAt(p, hi) * 7, demandAt(p, p.Pr || price) * 7 * 1.5) * 1.1, W = 320, H = 190, L = 44, B = 24;
    const X = q => L + Math.min(1, q / qmax) * (W - L - 8), Y = P => H - B - (P - lo) / (hi - lo) * (H - B - 10);
    const line = i => pts.filter(x => x[i] <= qmax).map(x => `${X(x[i]).toFixed(1)},${Y(x[0]).toFixed(1)}`).join(' ');
    const dq = demandAt(p, price) * 7, sq = supplyAt(p, price) * 7, st = dq > sq * 1.05 ? '超過需要（品薄）' : sq > dq * 1.05 ? '超過供給（売れ残り）' : 'ほぼ均衡';
    return `<svg class="ddc" viewBox="0 0 ${W} ${H}"><line x1="${L}" y1="${H - B}" x2="${W - 4}" y2="${H - B}" stroke="#999"/><line x1="${L}" y1="6" x2="${L}" y2="${H - B}" stroke="#999"/>
      <text x="${W - 6}" y="${H - 6}" text-anchor="end" font-size="11" fill="#777">数量（1週間）→</text><text x="4" y="14" font-size="11" fill="#777">価格↑</text>
      <polyline points="${line(1)}" fill="none" stroke="#2b6fd6" stroke-width="3"/><polyline points="${line(2)}" fill="none" stroke="#f0902a" stroke-width="3"/>
      <line x1="${L}" x2="${W - 8}" y1="${Y(price)}" y2="${Y(price)}" stroke="#2b2a28" stroke-dasharray="5 4"/><text x="${L + 4}" y="${Y(price) - 4}" font-size="11" fill="#2b2a28">いまの値段 ${yen(price)}</text>
      <line x1="${X(dq)}" x2="${X(sq)}" y1="${Y(price)}" y2="${Y(price)}" stroke="${dq > sq ? '#e0a020' : '#d9493e'}" stroke-width="5" opacity=".6"/>
      <circle cx="${X(demandAt(p, pe) * 7)}" cy="${Y(pe)}" r="5" fill="#2e9a63"/><text x="${X(demandAt(p, pe) * 7) + 7}" y="${Y(pe) + 4}" font-size="11" fill="#2e9a63">均衡価格</text>
      <text x="${W - 8}" y="20" text-anchor="end" font-size="12" font-weight="700" fill="${st === 'ほぼ均衡' ? '#2e9a63' : '#d9493e'}">${st}</text></svg>`;
  },
  // 出来事：選んで決める
  choice(title, html, opts) { this.choiceQ.push({ title, html, opts }); },
  showChoice(c) {
    this.showModal(`<h2>${esc(c.title)}</h2><div class="evtext">${c.html}</div><div class="chlist" style="margin-top:10px">${c.opts.map((o, i) => `<button class="chopt" data-act="evc" data-i="${i}" type="button"><span class="ct"><strong>${esc(o.label)}</strong>${o.sub ? `<small class="muted">${esc(o.sub)}</small>` : ''}</span></button>`).join('')}</div>`);
    this.modalState = { choice: c }; AU.chime();
  },
  // はい／いいえ（ブラウザの confirm は埋めこみ先で使えないことがあるので、ゲームの中に出す）
  ask(text, yes) { this.showModal(`<h2>確認</h2><p class="muted" style="line-height:1.7">${esc(text)}</p><div class="row" style="gap:8px"><button class="btn sub" data-act="closeM" type="button">やめる</button><button class="btn red" style="flex:1" data-act="yes" type="button">はい</button></div>`); this.modalState = { yes }; },
  gameOver() {
    this.showModal(`<div class="review"><h2>倒産…</h2><p class="muted">借金が上限（${yen(debtLimit())}）をこえて、お金を返せなくなり、会社をたたむことになりました。<br>${S.corp && S.corp.listed ? '株主は<b>有限責任</b>なので、失うのは持っていた株の金額だけです。<br>' : ''}${S.day > 0 ? `${dateStr(S.day)}までの記録：発売 ${S.stats.launched}こ・売上の合計 ${yen(S.stats.sales)}` : ''}</p><button class="btn big" data-act="restart" type="button">新しい会社をつくる</button></div>`);
    try { localStorage.removeItem('bstudy-save'); } catch (e) { /* なし */ }
    if (S.corp && S.corp.listed) learn('有限責任', '上場した会社が倒産した');
  },
};
