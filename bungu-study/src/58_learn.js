// =========================================================================================
//  学習：用語ノート・経済クイズ（ゲームの出来事で出る）・テスト（ノートの問題を全部）・家計・経済のページ
// =========================================================================================
function learn(id, ctx, opt) { LEARN.learn(id, ctx, opt); }
const normA = v => String(v || '').normalize('NFKC').replace(/[\s・･、。,.()（）「」『』]/g, '').toLowerCase();
const LEARN = {
  queue: [], cards: [], cool: 3, drill: null, newN: 0, sel: null,
  hist() { try { return JSON.parse(localStorage.getItem('bstudy-drill')) || { ok: {}, ng: {} }; } catch (e) { return { ok: {}, ng: {} }; } },
  saveHist(h) { try { localStorage.setItem('bstudy-drill', JSON.stringify(h)); } catch (e) { /* 保存できない */ } },
  // 新しい用語：画面に大きな用語カードを出す（図と説明 → 「次へ」で問題）
  learn(id, ctx, opt = {}) {
    if (!S || !S.learn || !TERM_BY[id] || S.learn.seen[id]) return;
    S.learn.seen[id] = { d: S.day, c: ctx || '' }; this.newN++; UI.dirty();
    if (opt.quiet) return;
    if ((SET.quiz || 'mid') === 'off') { UI.toast(`新しい用語「${id}」（学習 → 用語ノート）`, 'learn'); return; }
    this.cards.push({ t: id, ctx: ctx || '', kind: 'new' });
  },
  // もう知っている用語がまた起きた（超過需要など）：ときどき大きく出す
  again(id, ctx) {
    if (!S || (SET.quiz || 'mid') === 'off' || !S.learn.seen[id]) return false;
    const A = S.learn.again || (S.learn.again = {}); if (S.day - (A[id] ?? -999) < 150 || this.cards.some(c => c.t === id)) return false;
    A[id] = S.day; this.cards.push({ t: id, ctx: ctx || '', kind: 'again' }); return true;
  },
  // その用語の問題をクイズに出す（まだ正解していない問題から）
  ask(id, ctx) {
    if (!S || (SET.quiz || 'mid') === 'off') return; const qs = TERM_Q[id] || []; if (!qs.length || this.queue.some(x => x.t === id) || this.cards.some(c => c.t === id) || this.queue.length > 3) return;
    const L = S.learn, qi = qs.slice().sort((a, b) => (L.ok[a] || 0) - (L.ok[b] || 0) || Math.random() - 0.5)[0];
    this.queue.push({ qi, t: id, ctx: ctx || '' });
  },
  tick(dt) {
    this.cool -= dt; if (!S || GAMEFLOW.state !== 'play' || (SET.quiz || 'mid') === 'off') return;
    // ときどき復習（覚えた用語から。まちがえた問題を先に）
    const seen = Object.keys(S.learn.seen);
    if (!this.queue.length && seen.length >= 3 && S.day - S.learn.quizDay > (SET.quiz === 'many' ? 18 : 40)) {
      const pool = seen.flatMap(t => (TERM_Q[t] || []).map(qi => [qi, t])); if (pool.length) { pool.sort((a, b) => ((S.learn.ng[b[0]] || 0) - (S.learn.ok[b[0]] || 0)) - ((S.learn.ng[a[0]] || 0) - (S.learn.ok[a[0]] || 0)) || Math.random() - 0.5); const [qi, t] = pool[(Math.random() * Math.min(6, pool.length)) | 0]; this.queue.push({ qi, t, ctx: '復習' }); }
      S.learn.quizDay = S.day;
    }
    const idle = !UI.modalOpen && !UI.studio && !EVENT.active && !FURNI.on && !UI.queue.length && !UI.choiceQ.length;
    if (this.cards.length && idle && this.cool <= 18) { this.showCard(this.cards.shift()); return; }
    if (this.queue.length && this.cool <= 0 && idle) this.showQuiz(this.queue.shift());
  },
  // ---------- 用語カード ----------
  showCard(c) {
    this.cool = Math.max(this.cool, 4);
    UI.modalState = { card: Object.assign({ step: 'card', done: false, n: 0 }, c) }; this.renderCard();
    if (c.kind === 'new') AU.chime(); else AU.click();
  },
  renderCard() {
    const st = UI.modalState && UI.modalState.card; if (!st) return;
    const T = TERM_BY[st.t], more = this.cards.length, head = `<div class="row sb"><span class="pill ${st.kind === 'new' ? 'blue' : 'gold'}">${st.kind === 'new' ? '新しい用語を覚えた！' : 'また起きた！'}</span><span class="muted">${esc(T.sec)}</span></div>`;
    if (st.step === 'card') {
      UI.showModal(`<div class="tcard">${head}<div class="tc-word ${T.id.length > 7 ? 'long' : ''}">${esc(T.id)}</div>${st.ctx ? `<div class="tc-ctx">いま起きたこと：${esc(st.ctx)}</div>` : ''}<div class="tc-fig">${termFig(T.id)}</div><div class="tc-def">${esc(T.d)}</div>${EXPL[T.id] ? `<div class="tc-more">${esc(EXPL[T.id])}</div>` : ''}<div class="tc-game">ゲームでは：${esc(T.g)}</div>
        <div class="tc-btns"><button class="btn sub" data-act="Ltx" type="button">${more ? `あとで（ほか${more}つ）` : 'とじる'}</button><button class="btn big green" data-act="Ltn" type="button">次へ：問題を解く ▶</button></div>${more > 1 ? '<button class="link" data-act="Ltz" type="button">ほかの用語はノートでまとめて見る</button>' : ''}</div>`);
      return;
    }
    const q = ECON_Q[st.qi], right = this.rightLabel(q);
    let h = `<div class="tcard">${head}<div class="tc-word sm">${esc(T.id)}</div><div class="muted" style="margin-top:2px">期末テスト対策の問題（${esc(q.sec)}${q.imp >= 3 ? '・★★★' : ''}）</div><h3 class="qq">${esc(q.q)}</h3><div class="chlist">${st.ch.map((c, i) => `<button class="chopt ${st.done ? (c === right ? 'right' : i === st.pick ? 'wrong' : '') : ''}" data-act="Lta" data-i="${i}" type="button" ${st.done ? 'disabled' : ''}><b>${'ABCD'[i]}</b><span>${esc(c)}</span></button>`).join('')}</div>`;
    if (st.done) {
      const others = (TERM_Q[st.t] || []).filter(i => !st.asked.includes(i));
      h += `<div class="verdict ${st.ok ? 'ok' : 'ng'}"><b>${st.ok ? `正解！ +${st.bonus} RP` : 'ざんねん…'}</b><span>答え：<b class="ans">${esc(q.type === 'l' ? q.ans[0][0] : q.ans.map(g => g.join('＝')).join('・'))}</b></span><span class="muted">${esc(T.d)}</span></div>`;
      h += `<div class="tc-btns">${others.length ? '<button class="btn sub" data-act="Lt2" type="button">もう1問</button>' : ''}<button class="btn big" data-act="Ltx" type="button">${this.cards.length ? `次の用語へ（あと${this.cards.length}つ）` : 'とじる'}</button></div>`;
    } else h += `<div class="tc-btns"><button class="btn sub small" data-act="Ltb" type="button">◀ 説明にもどる</button></div>`;
    UI.showModal(h + '</div>');
  },
  cardQuestion(st) {
    const qs = TERM_Q[st.t] || []; st.asked = st.asked || [];
    const cand = qs.filter(i => !st.asked.includes(i)), L = S.learn; if (!cand.length) return false;
    const qi = cand.slice().sort((a, b) => (L.ok[a] || 0) - (L.ok[b] || 0) || a - b)[0];
    st.asked.push(qi); Object.assign(st, { step: 'q', qi, ch: this.choices(ECON_Q[qi]), done: false, pick: -1 }); return true;
  },
  // 4択の選択肢
  choices(q) {
    const sh = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    if (q.type === 'l') return sh([q.ans[0][0], ...(ECON_LX[q.li] || [])]);
    const sameSec = ECON_Q.filter(o => o.sec === q.sec && o.type === 's').map(o => o.ans[0][0]);
    if (q.type === 'm') {
      const right = q.ans.map(g => g[0]), out = new Set([right.join('・')]);
      for (let k = 0; k < 30 && out.size < 4; k++) { const w = right.slice(), i = (Math.random() * w.length) | 0, x = ECON_X[w[i]] || sameSec, r = pick(x.filter(v => !right.includes(v))); if (r) { w[i] = r; out.add(w.join('・')); } }
      return sh([...out]);
    }
    const a = q.ans[0][0], x = (ECON_X[a] || q.ans[0].map(v => ECON_X[v]).find(Boolean) || sh(sameSec)).filter(v => !q.ans[0].includes(v));
    return sh([a, ...[...new Set(x)].slice(0, 3)]);
  },
  rightLabel(q) { return q.type === 'm' ? q.ans.map(g => g[0]).join('・') : q.ans[0][0]; },
  termOf(qi) { return Object.keys(TERM_Q).find(t => TERM_Q[t].includes(qi)); },
  showQuiz(it) {
    const q = ECON_Q[it.qi], ch = this.choices(q); this.cool = 20; S.learn.quizDay = S.day;
    UI.showModal(`<div class="quiz"><div class="row sb"><span class="pill blue">経済クイズ</span><span class="muted">${esc(q.sec)}${q.imp >= 3 ? '　★★★' : ''}</span></div>${it.ctx ? `<div class="qctx">${esc(it.ctx)}</div>` : ''}<h3 class="qq">${esc(q.q)}</h3><div class="chlist" id="qch">${ch.map((c, i) => `<button class="chopt" data-act="Lq" data-i="${i}" type="button"><b>${'ABCD'[i]}</b><span>${esc(c)}</span></button>`).join('')}</div><div id="qres"></div><div class="row" style="gap:8px;margin-top:10px"><button class="btn sub small" data-act="Lskip" type="button">あとで</button></div></div>`);
    UI.modalState = { quiz: { qi: it.qi, ch, t: it.t, done: false } };
  },
  answerQuiz(i) {
    const st = UI.modalState && UI.modalState.quiz; if (!st || st.done) return; st.done = true;
    const q = ECON_Q[st.qi], right = this.rightLabel(q), ok = st.ch[i] === right, L = S.learn, t = TERM_BY[st.t || this.termOf(st.qi)];
    document.querySelectorAll('#qch .chopt').forEach((b, k) => { b.disabled = true; if (st.ch[k] === right) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
    const bonus = 4 + 4 * S.tier;
    if (ok) { L.ok[st.qi] = (L.ok[st.qi] || 0) + 1; S.rp += bonus; AU.chime(); } else { L.ng[st.qi] = (L.ng[st.qi] || 0) + 1; AU.bad(); }
    const h = this.hist(); (ok ? h.ok : h.ng)[st.qi] = ((ok ? h.ok : h.ng)[st.qi] || 0) + 1; this.saveHist(h);
    $('qres').innerHTML = `<div class="verdict ${ok ? 'ok' : 'ng'}"><b>${ok ? `正解！ +${bonus} RP` : 'ざんねん…'}</b><span>答え：<b class="ans">${esc(q.type === 'l' ? q.ans[0][0] : q.ans.map(g => g.join('＝')).join('・'))}</b></span>${t ? `<span class="muted">${esc(t.id)}：${esc(t.d)}</span>` : ''}</div>`;
    const bb = document.querySelector('.quiz [data-act=Lskip]'); if (bb) { bb.textContent = 'OK'; bb.className = 'btn small'; }
  },
  // =====================================================================================
  //  学習タブ
  // =====================================================================================
  render(sub) {
    if (sub === 'note') return this.pNote();
    if (sub === 'test') return this.pTest();
    if (sub === 'home') return this.pHome();
    return this.pEcon();
  },
  progress() {
    const seen = Object.keys(S.learn.seen).length, h = this.hist(), ok = new Set([...Object.keys(S.learn.ok), ...Object.keys(h.ok)].map(Number));
    return { seen, terms: TERMS.length, ok: ok.size, qs: ECON_Q.length, okSet: ok };
  },
  pNote() {
    this.newN = 0;
    const P = this.progress(), sec = this.sel || ECON_SECS[0];
    let h = `<div class="card"><div class="row sb"><b>経済の用語</b><span class="pill blue">ゲームで出会った ${P.seen} / ${P.terms}</span></div><div class="bar" style="margin:6px 0"><i style="width:${P.seen / P.terms * 100}%"></i></div><div class="row sb"><span class="muted">正解したことがある問題</span><b>${P.ok} / ${P.qs}</b></div><div class="bar g" style="margin-top:6px"><i style="width:${P.ok / P.qs * 100}%"></i></div><div class="muted" style="margin-top:6px;line-height:1.6">会社を動かしていると、経済の用語に出会います。期末テスト対策の「社会（経済）」の問題は、ぜんぶ「テスト」で解けます。</div></div>`;
    h += `<div class="chips" style="margin-bottom:8px">${ECON_SECS.map(s => { const ts = TERMS.filter(t => t.sec === s), n = ts.filter(t => S.learn.seen[t.id]).length; return `<button class="chip ${s === sec ? 'on' : ''}" data-act="Lsec" data-v="${s}" type="button">${s}<small>${n}/${ts.length}</small></button>`; }).join('')}</div>`;
    for (const t of TERMS.filter(x => x.sec === sec)) {
      const sn = S.learn.seen[t.id], qs = TERM_Q[t.id] || [], okN = qs.filter(i => P.okSet.has(i)).length;
      h += `<div class="card term ${sn ? '' : 'unseen'}"><div class="row sb"><h3 style="margin:0">${esc(t.id)}</h3>${sn ? '<span class="pill green">出会った</span>' : '<span class="pill">まだ</span>'}</div><div class="tdef">${esc(t.d)}</div><div class="tc-fig sm">${termFig(t.id)}</div>${EXPL[t.id] ? `<div class="tc-more">${esc(EXPL[t.id])}</div>` : ''}<div class="muted tgame">ゲームでは：${esc(t.g)}</div>${sn ? `<div class="muted tctx">${dateStr(sn.d)}　${esc(sn.c)}</div>` : ''}${qs.length ? `<div class="row sb" style="margin-top:6px"><span class="muted">この用語の問題 ${okN}/${qs.length} 正解ずみ</span><button class="btn small sub" data-act="Lterm" data-v="${esc(t.id)}" type="button">問題を解く</button></div>` : ''}</div>`;
    }
    return h;
  },
  // ---------- テスト（ノートの問題そのまま） ----------
  pTest() {
    const D = this.drill;
    if (D && D.list && D.i < D.list.length) return this.pQuestion();
    if (D && D.list && D.i >= D.list.length) return this.pResult();
    const cfg = this.cfg || (this.cfg = { secs: ECON_SECS.slice(), mode: 'choice', order: 'seq' }), h0 = this.hist();
    const n = this.pool().length, ngN = ECON_Q.filter(q => (h0.ng[q.i] || 0) > (h0.ok[q.i] || 0)).length;
    let h = `<div class="card"><h3>期末テスト対策：社会（経済）</h3><div class="muted">ノートの「生産と価格」「市場経済と政府」「家計と消費者」「資本主義の仕組み」の問題 ${ECON_Q.length}問。</div>`;
    h += `<div class="grp">範囲</div><div class="chips">${ECON_SECS.map(s => `<button class="chip ${cfg.secs.includes(s) ? 'on' : ''}" data-act="Lcs" data-v="${s}" type="button">${s}<small>${ECON_Q.filter(q => q.sec === s).length}問</small></button>`).join('')}</div>`;
    h += `<div class="grp">答え方</div><div class="chips">${[['choice', '4択'], ['type', '書いて答える']].map(([k, v]) => `<button class="chip ${cfg.mode === k ? 'on' : ''}" data-act="Lcm" data-v="${k}" type="button">${v}</button>`).join('')}</div>`;
    h += `<div class="grp">順番</div><div class="chips">${[['seq', 'ノートの順'], ['shuf', 'シャッフル'], ['ng', `まちがえた問題（${ngN}）`], ['imp', '★3だけ']].map(([k, v]) => `<button class="chip ${cfg.order === k ? 'on' : ''}" data-act="Lco" data-v="${k}" type="button">${v}</button>`).join('')}</div>`;
    h += `<button class="btn big green" style="margin-top:12px" data-act="Lstart" type="button" ${n ? '' : 'disabled'}>スタート（${n}問）</button></div>`;
    return h;
  },
  pool() {
    const c = this.cfg, h0 = this.hist(); let a = ECON_Q.filter(q => c.secs.includes(q.sec));
    if (c.order === 'ng') a = a.filter(q => (h0.ng[q.i] || 0) > (h0.ok[q.i] || 0));
    if (c.order === 'imp') a = a.filter(q => q.imp >= 3);
    return a.map(q => q.i);
  },
  start(list) {
    if (this.cfg.order === 'shuf') list = list.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    this.drill = { list, i: 0, ok: 0, ng: [], cur: null };
  },
  pQuestion() {
    const D = this.drill, q = ECON_Q[D.list[D.i]], mode = this.cfg.mode;
    if (!D.cur || D.cur.qi !== q.i) D.cur = { qi: q.i, ch: this.choices(q), done: false };
    const C = D.cur;
    let h = `<div class="row sb" style="margin-bottom:6px"><b>${D.i + 1} / ${D.list.length}</b><span class="muted">${esc(q.sec)}${q.imp >= 3 ? '　★★★' : ''}</span><button class="btn sub small" data-act="Lquit" type="button">終了</button></div><div class="bar" style="margin-bottom:10px"><i style="width:${D.i / D.list.length * 100}%"></i></div>`;
    h += `<div class="card"><h3 class="qq">${esc(q.q)}</h3>`;
    if (mode === 'choice') h += `<div class="chlist">${C.ch.map((c, k) => `<button class="chopt ${C.done ? (c === this.rightLabel(q) ? 'right' : k === C.pick ? 'wrong' : '') : ''}" data-act="Ldc" data-i="${k}" type="button" ${C.done ? 'disabled' : ''}><b>${'ABCD'[k]}</b><span>${esc(c)}</span></button>`).join('')}</div>`;
    else if (q.type === 'l') h += `<textarea class="txt" id="dIn0" rows="4" placeholder="文章で答えよう（大事な語句が入っていれば正解）" ${C.done ? 'disabled' : ''}>${esc(C.given ? C.given[0] : '')}</textarea>`;
    else h += q.ans.map((g, k) => `<input class="txt" id="dIn${k}" style="margin:4px 0" autocomplete="off" placeholder="${q.ans.length > 1 ? `答え ${k + 1}` : '答えを入力'}" value="${esc(C.given ? C.given[k] || '' : '')}" ${C.done ? 'disabled' : ''}>`).join('');
    if (!C.done && mode === 'type') h += `<button class="btn" style="margin-top:8px;width:100%" data-act="Ldt" type="button">答え合わせ</button>`;
    if (C.done) h += `<div class="verdict ${C.ok ? 'ok' : 'ng'}" style="margin-top:10px"><b>${C.ok ? '正解！' : 'ざんねん'}</b><span>答え：<b class="ans">${esc(q.type === 'l' ? q.ans[0][0] : q.ans.map(g => g.join('＝')).join('・'))}</b></span>${C.kw ? `<div class="kw">${C.kw.map(([w, hit]) => `<span class="${hit ? 'hit' : 'miss2'}">${esc(w)}</span>`).join('')}</div>` : ''}</div><button class="btn green" style="margin-top:10px;width:100%" data-act="Lnext" type="button">${D.i + 1 < D.list.length ? '次の問題' : '結果を見る'}</button>`;
    return h + '</div>';
  },
  judge(q, given) {
    if (q.type === 'l') { const t = normA(given[0]), kw = q.keys.map(g => [g[0], g.some(w => t.includes(normA(w)))]); return { ok: kw.every(k => k[1]), kw }; }
    if (q.type === 'm') { const left = q.ans.slice(); for (const g of given.map(normA)) { const i = left.findIndex(a => a.some(x => normA(x) === g)); if (i >= 0) left.splice(i, 1); } return { ok: !left.length }; }
    const g = normA(given[0]); return { ok: q.ans[0].some(x => normA(x) === g) };
  },
  record(qi, ok) { const h = this.hist(); (ok ? h.ok : h.ng)[qi] = ((ok ? h.ok : h.ng)[qi] || 0) + 1; this.saveHist(h); if (S && S.learn) { const L = S.learn; (ok ? L.ok : L.ng)[qi] = ((ok ? L.ok : L.ng)[qi] || 0) + 1; } },
  pResult() {
    const D = this.drill, n = D.list.length;
    let h = `<div class="card"><h3>結果</h3><div class="big">${D.ok}<small> / ${n}問</small></div><div class="bar g" style="margin:8px 0"><i style="width:${D.ok / n * 100}%"></i></div>`;
    if (D.ng.length) h += `<div class="grp">まちがえた問題</div>${D.ng.map(qi => { const q = ECON_Q[qi]; return `<div class="ngq"><div>${esc(q.q)}</div><b class="ans">${esc(q.type === 'l' ? q.ans[0][0] : q.ans.map(g => g[0]).join('・'))}</b></div>`; }).join('')}<button class="btn big" style="margin-top:10px" data-act="Lretry" type="button">まちがえた問題をもう一度</button>`;
    else h += '<div class="muted">全問正解！</div>';
    return h + `<button class="btn sub big" style="margin-top:8px" data-act="Lback" type="button">設定にもどる</button></div>`;
  },
  // ---------- 家計 ----------
  pHome() {
    for (const t of ['家計', '収入', '支出', '消費支出', '貯蓄']) learn(t, '「学習」の「家計」を見た', { quiet: true });
    const B = hhBook(), w = v => (v / B.inc * 100).toFixed(1) + '%', mul = econMul();
    let h = `<div class="card"><h3>お客さんの家計（モデルの家族の1か月）</h3><div class="muted">文房具を買ってくれるのは、家庭（家計）です。家計に余裕があるほど、文房具がよく売れます。</div>
      <div class="hbar">${[['非消費支出', B.non, '#c8433a'], ['消費支出', B.cons, '#2b6fd6'], ['貯蓄', B.sav, '#2e9a63']].map(([n, v, c]) => `<i style="width:${w(v)};background:${c}" title="${n}"></i>`).join('')}</div>
      <div class="kv" style="margin-top:8px"><span>収入（所得：給与など）</span><b>${yen(B.inc)}</b><span>非消費支出（税金・社会保険料）</span><b style="color:var(--red)">−${yen(B.non)}</b><span>可処分所得（収入−非消費支出）</span><b>${yen(B.disp)}</b><span>消費支出（食費・住居費など）</span><b style="color:var(--blue)">${yen(B.cons)}</b><span>　うち食費</span><b>${yen(B.food)}</b><span>　うち文房具代</span><b>${yen(B.stat)}</b><span>貯蓄（預金・生命保険など）</span><b style="color:var(--green)">${yen(B.sav)}</b><span>エンゲル係数（消費支出のうち食費の割合）</span><b>${(B.engel * 100).toFixed(1)}%</b></div></div>`;
    h += `<div class="card"><h3>家計と売れゆき</h3><div class="muted" style="line-height:1.7">いまの景気と家計だと、文房具の売れゆきは <b>×${mul.toFixed(2)}</b>。<br>税金が上がると<b>非消費支出</b>が増えて<b>可処分所得</b>（実際に使えるお金）が減り、文房具が売れにくくなります。不景気だと所得が下がり、食費の割合（<b>エンゲル係数</b>）が上がりやすくなります。</div></div>`;
    return h;
  },
  // ---------- 経済（GDP・三要素・産業・政府） ----------
  pEcon() {
    const E = S.econ, F = factors(), added = S.stats.lastAdded || 0, gdpY = E.gdp, myY = added * 12;
    let h = `<div class="card"><div class="row sb"><h3 style="margin:0">日本の経済</h3><span class="pill ${E.phase === '好景気' ? 'green' : E.phase === '不景気' ? 'red' : ''}">${E.phase}</span></div><div class="kv" style="margin-top:6px"><span>GDP（国内総生産）</span><b>約${Math.round(gdpY / 1e12)}兆円</b><span>成長率（年）</span><b>${E.g >= 0 ? '+' : ''}${(E.g * 100).toFixed(1)}%</b><span>政府の方針</span><b>${E.policy === 'big' ? '大きな政府（介入する）' : E.policy === 'small' ? '小さな政府（市場に委ねる）' : '混合経済（ふつう）'}</b></div>${this.spark(E.hist)}<div class="muted">GDPは、国内で生み出された付加価値の合計です。</div></div>`;
    h += `<div class="card"><h3>あなたの会社の付加価値</h3><div class="kv"><span>先月の付加価値（売上−原材料費）</span><b>${yen(added)}</b><span>これまでの合計</span><b>${yen(S.stats.addedTotal || 0)}</b><span>日本のGDPにしめる割合</span><b>${(myY / gdpY * 100).toFixed(4)}%</b></div><div class="muted" style="margin-top:6px">付加価値＝売り値−仕入れ値（原材料費）。便利な機能をつけるほど付加価値が上がります。</div></div>`;
    h += `<div class="card"><h3>生産の三要素（あなたの会社）</h3><div class="f3"><div><b>土地</b><span>事務所 ${F.land}m²${F.forest ? `・森林 ${F.forest * 50}ha` : ''}</span><small>自然界にあるもの</small></div><div><b>労働</b><span>社員 ${F.labor}人</span><small>月給の合計 ${yen(F.wage)}</small></div><div><b>資本</b><span>設備 ${yen(F.capital)}</span><small>生産ライン Lv${F.line}</small></div></div></div>`;
    const svc = S.stats.lastSvc || 0, ret = S.stats.lastRetail || 0, pri = S.stats.primaryMonth || 0;
    h += `<div class="card"><h3>産業（先月のもうけ）</h3><div class="kv"><span>第1次産業（林業：森林 ${S.corp.forest}）</span><b>${yen(pri)}</b><span>第2次産業（工業：文房具を作る）</span><b>${yen(Math.max(0, added - svc - ret))}</b><span>第3次産業（直営店 ${S.corp.stores}・サービス）</span><b>${yen(svc + ret)}</b></div><div class="muted" style="margin-top:6px">第1次産業は利益が低く付加価値をつけにくい。第2次・第3次産業は付加価値をつけやすい。森林や直営店は「会社」→「経営」から。</div></div>`;
    h += `<div class="card"><h3>毎月の公共料金</h3><div class="muted">電気・ガス・水道などは、国民の生活に直接影響するので国が料金を決めます（公共料金）。先月：<b>${yen(S.stats.lastUtil || 0)}</b></div></div>`;
    return h;
  },
  spark(a) {
    if (!a || a.length < 2) return ''; const mn = Math.min(...a), mx = Math.max(...a), W = 300, H = 50;
    const pts = a.map((v, i) => `${(i / (a.length - 1) * W).toFixed(1)},${(H - 4 - (v - mn) / Math.max(1, mx - mn) * (H - 8)).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#2b6fd6" stroke-width="2.5"/></svg>`;
  },
  // ---------- クリック ----------
  onClick(a, b) {
    if (a === 'Lq') return this.answerQuiz(+b.dataset.i);
    if (a[1] === 't' && UI.modalState && UI.modalState.card) {
      const st = UI.modalState.card;
      if (a === 'Ltn' || a === 'Lt2') { if (!this.cardQuestion(st)) { UI.closeModal(); return; } AU.click(); return this.renderCard(); }
      if (a === 'Ltb') { st.step = 'card'; return this.renderCard(); }
      if (a === 'Lta') {
        if (st.done) return; st.done = true; st.pick = +b.dataset.i; const q = ECON_Q[st.qi]; st.ok = st.ch[st.pick] === this.rightLabel(q); st.bonus = 4 + 4 * S.tier;
        if (st.ok) { S.rp += st.bonus; AU.chime(); } else AU.bad();
        this.record(st.qi, st.ok); return this.renderCard();
      }
      if (a === 'Ltz') { this.cards.length = 0; UI.closeModal(); UI.sub.learn = 'note'; UI.open('learn'); return; }
      if (a === 'Ltx') { UI.closeModal(); this.cool = Math.max(this.cool, 0.6); return; }
    }
    if (a === 'Lskip') { const st = UI.modalState && UI.modalState.quiz; if (st && !st.done) this.queue.push({ qi: st.qi, t: st.t, ctx: '' }); UI.closeModal(); this.cool = st && st.done ? 12 : 60; return; }
    if (a === 'Lsec') { this.sel = b.dataset.v; }
    else if (a === 'Lterm') { const id = b.dataset.v; this.cfg = this.cfg || { secs: ECON_SECS.slice(), mode: 'choice', order: 'seq' }; this.drill = { list: (TERM_Q[id] || []).slice(), i: 0, ok: 0, ng: [], cur: null }; UI.sub.learn = 'test'; }
    else if (a === 'Lcs') { const c = this.cfg, v = b.dataset.v; c.secs = c.secs.includes(v) ? c.secs.filter(x => x !== v) : c.secs.concat([v]); if (!c.secs.length) c.secs = [v]; }
    else if (a === 'Lcm') this.cfg.mode = b.dataset.v;
    else if (a === 'Lco') this.cfg.order = b.dataset.v;
    else if (a === 'Lstart') this.start(this.pool());
    else if (a === 'Lquit' || a === 'Lback') this.drill = null;
    else if (a === 'Lretry') { const ng = this.drill.ng.slice(); this.drill = { list: ng, i: 0, ok: 0, ng: [], cur: null }; }
    else if (a === 'Ldc' || a === 'Ldt') {
      const D = this.drill, C = D.cur, q = ECON_Q[C.qi]; if (C.done) return;
      if (a === 'Ldc') { C.pick = +b.dataset.i; C.ok = C.ch[C.pick] === this.rightLabel(q); }
      else { C.given = q.type === 'l' ? [$('dIn0').value] : q.ans.map((g, k) => ($('dIn' + k) || {}).value || ''); const r = this.judge(q, C.given); C.ok = r.ok; C.kw = r.kw; }
      C.done = true; this.record(C.qi, C.ok); if (C.ok) { D.ok++; AU.chime(); } else { D.ng.push(C.qi); AU.bad(); }
    }
    else if (a === 'Lnext') { this.drill.i++; this.drill.cur = null; $('shBody').scrollTop = 0; }
    UI.render();
  },
};
