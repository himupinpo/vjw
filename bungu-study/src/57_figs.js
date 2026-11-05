// =========================================================================================
//  用語カードの図：需要曲線・供給曲線、生産の三要素、付加価値、産業、政府、家計、株式…（SVGで描く）
//  と、用語ごとのくわしい説明
// =========================================================================================
const FG = {
  C: { b: '#2b6fd6', o: '#f0902a', g: '#2e9a63', r: '#d9493e', p: '#7b4bc4', y: '#e3a21a', k: '#2b2a28', m: '#8a8478', l: '#e9e4d8' },
  svg: (inner, h = 180) => `<svg class="tfig" viewBox="0 0 320 ${h}" role="img" aria-hidden="true">${inner}</svg>`,
  t: (x, y, s, fs = 12, c = '#2b2a28', a = 'middle', w = 700) => `<text x="${x}" y="${y}" font-size="${fs}" fill="${c}" text-anchor="${a}" font-weight="${w}">${s}</text>`,
  r: (x, y, w, h, fill, rx = 8, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`,
  ln: (x1, y1, x2, y2, c = '#555', w = 2, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`,
  ar(x1, y1, x2, y2, c = '#555', w = 2.5) { const a = Math.atan2(y2 - y1, x2 - x1), L = 9, s = 0.5, p = (d) => `${(x2 - L * Math.cos(a + d)).toFixed(1)},${(y2 - L * Math.sin(a + d)).toFixed(1)}`; return this.ln(x1, y1, x2 - Math.cos(a) * 4, y2 - Math.sin(a) * 4, c, w) + `<polygon points="${x2},${y2} ${p(s)} ${p(-s)}" fill="${c}"/>`; },
  g: (inner, on = true) => `<g opacity="${on ? 1 : 0.28}">${inner}</g>`,
  // ---- 小さな絵 ----
  tree: (x, y) => `<rect x="${x - 3}" y="${y + 6}" width="6" height="12" fill="#8a5a36"/><circle cx="${x}" cy="${y}" r="12" fill="#3f8f4a"/><circle cx="${x - 8}" cy="${y + 5}" r="8" fill="#4f9f55"/><circle cx="${x + 8}" cy="${y + 5}" r="8" fill="#4f9f55"/>`,
  person: (x, y, c = '#2b6fd6') => `<circle cx="${x}" cy="${y - 10}" r="6" fill="#e9c4a2"/><path d="M${x - 9} ${y + 12}q0-14 9-14t9 14z" fill="${c}"/>`,
  factory: (x, y, c = '#6d7a88') => `<path d="M${x - 20} ${y + 12}V${y - 2}l10-6v6l10-6v6l10-6V${y + 12}z" fill="${c}"/><rect x="${x + 12}" y="${y - 16}" width="6" height="14" fill="${c}"/><rect x="${x - 14}" y="${y + 3}" width="6" height="5" fill="#f6e27a"/><rect x="${x - 3}" y="${y + 3}" width="6" height="5" fill="#f6e27a"/>`,
  shop: (x, y, c = '#d9493e') => `<rect x="${x - 18}" y="${y - 4}" width="36" height="18" fill="#f4efe4" stroke="#999"/><path d="M${x - 21} ${y - 4}h42l-4-9h-34z" fill="${c}"/><rect x="${x - 5}" y="${y + 3}" width="10" height="11" fill="#8a5a36"/>`,
  pencil: (x, y, c = '#2e9a63') => `<g transform="rotate(-30 ${x} ${y})"><rect x="${x - 18}" y="${y - 4}" width="30" height="8" fill="${c}"/><path d="M${x + 12} ${y - 4}l9 4-9 4z" fill="#e8c79a"/><rect x="${x - 22}" y="${y - 4}" width="5" height="8" fill="#f2a7b8"/></g>`,
  bldg: (x, y, c = '#8a8478', label = '') => `<path d="M${x - 20} ${y - 6}h40l-20-10z" fill="${c}"/><rect x="${x - 17}" y="${y - 6}" width="34" height="22" fill="#f4efe4" stroke="${c}"/>${[0, 1, 2].map(k => `<rect x="${x - 12 + k * 10}" y="${y - 2}" width="4" height="15" fill="${c}"/>`).join('')}${label ? FG.t(x, y + 30, label, 11) : ''}`,
  coin: (x, y, r = 8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6c945" stroke="#c79230" stroke-width="1.5"/>${FG.t(x, y + 4, '¥', r * 1.1, '#8a6a10')}`,
  doc: (x, y, label = '', c = '#2b2a28') => `<rect x="${x - 14}" y="${y - 18}" width="28" height="36" rx="3" fill="#fff" stroke="${c}" stroke-width="1.5"/>${[0, 1, 2].map(k => FG.ln(x - 8, y - 9 + k * 8, x + 8, y - 9 + k * 8, '#bbb', 2)).join('')}${label ? FG.t(x, y + 32, label, 11) : ''}`,
  pie(cx, cy, r, parts, cols) { let a = -Math.PI / 2, out = ''; parts.forEach((v, i) => { const b = a + v * Math.PI * 2, la = v > 0.5 ? 1 : 0; out += `<path d="M${cx} ${cy}L${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}A${r} ${r} 0 ${la} 1 ${(cx + r * Math.cos(b)).toFixed(1)} ${(cy + r * Math.sin(b)).toFixed(1)}z" fill="${cols[i % cols.length]}" stroke="#fff" stroke-width="1.5"/>`; a = b; }); return out; },
  // ---- 需要曲線・供給曲線 ----
  dy: x => 30 + (x - 70) / 220 * 115, sy: x => 145 - (x - 70) / 220 * 115,
  dd(o = {}) {
    const C = this.C; let s = this.ln(50, 18, 50, 150, '#777', 2) + this.ln(50, 150, 304, 150, '#777', 2) + this.t(54, 16, '価格', 11, '#777', 'start') + this.t(304, 168, '数量 →', 11, '#777', 'end') + this.t(44, 24, '高', 10, '#999', 'end') + this.t(44, 148, '安', 10, '#999', 'end');
    if (o.d !== false) s += this.g(this.ln(70, 30, 290, 145, C.b, 4) + this.t(96, 32, '需要曲線', 12, C.b, 'start'), !o.only || o.only === 'd');
    if (o.s !== false) s += this.g(this.ln(70, 145, 290, 30, C.o, 4) + this.t(292, 26, '供給曲線', 12, C.o, 'end'), !o.only || o.only === 's');
    if (o.only === 'd') s += `<circle cx="100" cy="${this.dy(100)}" r="5" fill="${C.b}"/>` + this.t(108, this.dy(100) - 6, '高いと少ししか買わない', 11, C.k, 'start') + `<circle cx="250" cy="${this.dy(250)}" r="5" fill="${C.b}"/>` + this.t(244, this.dy(250) - 10, '安いとたくさん買う', 11, C.k, 'end');
    if (o.only === 's') s += `<circle cx="100" cy="${this.sy(100)}" r="5" fill="${C.o}"/>` + this.t(108, this.sy(100) + 16, '安いと少ししか作らない', 11, C.k, 'start') + `<circle cx="250" cy="${this.sy(250)}" r="5" fill="${C.o}"/>` + this.t(244, this.sy(250) + 18, '高いとたくさん作りたい', 11, C.k, 'end');
    if (o.eq) s += this.ln(50, 87.5, 180, 87.5, C.g, 1.5, '4 3') + this.ln(180, 87.5, 180, 150, C.g, 1.5, '4 3') + `<circle cx="180" cy="87.5" r="6" fill="${C.g}"/>` + this.t(56, 82, '均衡価格', 12, C.g, 'start') + this.t(172, 106, '需要＝供給', 11, C.g, 'end');
    if (o.over) s += this.ln(108, 50, 252, 50, C.r, 7) + this.t(180, 43, '売れ残り（超過供給）', 12, C.r) + this.ar(282, 54, 282, 82, C.r) + this.t(276, 74, '価格↓', 11, C.r, 'end') + this.t(104, 47, '需要', 10, C.b, 'end') + this.t(258, 47, '供給', 10, C.o, 'start');
    if (o.under) s += this.ln(108, 125, 252, 125, C.y, 7) + this.t(180, 141, '品薄（超過需要）', 12, '#9a7316') + this.ar(282, 121, 282, 93, '#9a7316') + this.t(276, 112, '価格↑', 11, '#9a7316', 'end') + this.t(104, 129, '供給', 10, C.o, 'end') + this.t(258, 129, '需要', 10, C.b, 'start');
    if (o.adj) s += this.ar(200, 52, 200, 80, C.p) + this.ar(200, 123, 200, 95, C.p) + this.t(206, 64, '売れ残り→値下げ', 10, C.p, 'start') + this.t(206, 118, '品薄→値上げ', 10, C.p, 'start') + this.t(62, 172, o.adj === 'hand' ? '神の見えざる手（アダム・スミス）' : '価格の自動調節機能：均衡価格に近づく', 11, C.p, 'start');
    return this.svg(s, o.adj ? 180 : 172);
  },
  factors(hl) {
    const C = this.C, box = (x, k, name, sub1, sub2, icon) => this.g(this.r(x, 8, 96, 96, '#f6f2e9', 10, `stroke="${hl === k ? C.p : '#ddd'}" stroke-width="${hl === k ? 3 : 1}"`) + icon + this.t(x + 48, 68, name, 16) + this.t(x + 48, 84, sub1, 10, C.m) + this.t(x + 48, 97, sub2, 10, C.m), hl === 'all' || hl === k);
    let s = box(8, 'land', '土地', '自然にあるもの', '魚・農地・天然物', this.tree(56, 30)) + box(112, 'labor', '労働', '人のはたらき', '従業員', this.person(160, 42, C.b)) + box(216, 'cap', '資本', '作られた生産手段', '工場・船・人工物', this.factory(264, 34));
    s += this.ar(56, 106, 140, 134, '#999', 2) + this.ar(160, 106, 160, 132, '#999', 2) + this.ar(264, 106, 180, 134, '#999', 2);
    s += this.r(84, 134, 152, 36, C.g, 10) + this.t(160, 157, '生産 → 財・サービス', 13, '#fff');
    return this.svg(s, 176);
  },
  goods(hl) {
    const C = this.C;
    let s = this.g(this.r(8, 10, 146, 150, '#eef5ff', 12, `stroke="${hl === 'g' ? C.b : '#ddd'}" stroke-width="${hl === 'g' ? 3 : 1}"`) + this.t(81, 40, '財', 24, C.b) + this.pencil(60, 76, C.g) + `<rect x="88" y="70" width="40" height="14" rx="4" fill="${C.r}"/><circle cx="96" cy="86" r="5" fill="#333"/><circle cx="120" cy="86" r="5" fill="#333"/>` + this.t(81, 118, '形がある生産物', 12) + this.t(81, 138, '例：車・シャーペン', 11, C.m), hl !== 's');
    s += this.g(this.r(166, 10, 146, 150, '#fff6ea', 12, `stroke="${hl === 's' ? C.o : '#ddd'}" stroke-width="${hl === 's' ? 3 : 1}"`) + this.t(239, 40, 'サービス', 20, C.o) + `<rect x="204" y="62" width="70" height="26" rx="6" fill="${C.g}"/><rect x="210" y="67" width="12" height="9" fill="#fff"/><rect x="226" y="67" width="12" height="9" fill="#fff"/><rect x="242" y="67" width="12" height="9" fill="#fff"/><circle cx="216" cy="90" r="5" fill="#333"/><circle cx="262" cy="90" r="5" fill="#333"/>` + this.t(239, 118, '形がない生産物', 12) + this.t(239, 138, '例：電車・バス・修理', 11, C.m), hl !== 'g');
    return this.svg(s, 168);
  },
  market() {
    const C = this.C;
    let s = this.person(40, 70, C.o) + this.t(40, 100, '売る人', 12) + this.t(40, 115, '（生産者）', 10, C.m) + this.person(280, 70, C.b) + this.t(280, 100, '買う人', 12) + this.t(280, 115, '（消費者）', 10, C.m);
    s += this.shop(160, 72, C.p) + this.t(160, 110, '市場', 18, C.p);
    s += this.ar(64, 48, 256, 48, C.o) + this.t(160, 40, '財・サービス →', 12, C.o) + this.ar(256, 132, 64, 132, C.g) + this.t(160, 150, '← お金', 12, C.g);
    return this.svg(s, 160);
  },
  added(gdp) {
    const C = this.C; let s = '';
    if (!gdp) {
      s += this.r(40, 80, 70, 60, '#c9c2b2', 4) + this.t(75, 115, '仕入れ値', 12, '#fff') + this.t(75, 156, '原材料費 100円', 11);
      s += this.r(180, 80, 70, 60, '#c9c2b2', 4) + this.r(180, 30, 70, 50, C.p, 4) + this.t(215, 60, '付加価値', 12, '#fff') + this.t(215, 74, '80円', 11, '#fff') + this.t(215, 115, '仕入れ値', 12, '#fff') + this.t(215, 156, '売り値 180円', 11);
      s += this.ar(118, 110, 172, 110, '#999') + this.t(145, 102, '便利な機能を', 9, C.m) + this.t(145, 126, 'くわえる', 9, C.m) + this.t(160, 18, '付加価値 ＝ 売り値 − 仕入れ値', 14, C.p);
      return this.svg(s, 166);
    }
    const blk = (x, h, c, l) => this.r(x, 140 - h, 46, h, c, 3) + this.t(x + 23, 156, l, 10);
    s += blk(14, 18, '#7cbf4d', '林業') + blk(66, 48, C.b, '工場') + blk(118, 56, C.o, 'お店');
    s += this.ar(172, 110, 206, 110, '#999');
    s += this.r(222, 140 - 18, 70, 18, '#7cbf4d', 0) + this.r(222, 140 - 66, 70, 48, C.b, 0) + this.r(222, 140 - 122, 70, 56, C.o, 0) + this.t(257, 156, 'GDP', 13, C.p);
    s += this.t(86, 30, '会社ごとの付加価値を', 11, C.m) + this.t(86, 46, '国じゅう合計すると…', 11, C.m) + this.t(257, 14, '国内総生産', 11, C.p);
    return this.svg(s, 166);
  },
  industry() {
    const C = this.C, col = (x, n, name, sub, icon, h, c, note) => this.t(x, 18, n, 13, c) + this.t(x, 34, name, 11) + this.t(x, 47, sub, 10, C.m) + icon + this.r(x - 22, 150 - h, 44, h, c, 3) + this.t(x, 165, note, 10, c);
    let s = col(55, '第1次産業', '農林水産業', '例：林業', this.tree(55, 70), 22, '#7cbf4d', 'つけにくい') + col(160, '第2次産業', '工業', '例：文房具工場', this.factory(160, 72), 60, C.b, 'つけやすい') + col(265, '第3次産業', '商業・サービス', '例：お店・修理', this.shop(265, 72), 66, C.o, 'つけやすい');
    s += this.t(160, 106, '↓ 付加価値（利益）', 11, C.m);
    return this.svg(s, 172);
  },
  invest() {
    const C = this.C;
    let s = this.coin(40, 50, 14) + this.t(40, 80, 'お金', 12) + this.ar(62, 50, 112, 50, '#999') + this.factory(140, 50) + this.person(178, 58, C.b) + this.t(158, 80, '資本・労働を増やす', 11);
    s += this.ar(210, 50, 252, 50, '#999') + `<rect x="262" y="34" width="16" height="16" fill="#c49a62"/><rect x="280" y="34" width="16" height="16" fill="#c49a62"/><rect x="271" y="18" width="16" height="16" fill="#c49a62"/>` + this.t(280, 80, '生産を拡大', 11);
    s += this.ar(280, 92, 280, 120, '#999') + this.coin(250, 138, 10) + this.coin(272, 138, 10) + this.coin(294, 138, 10) + this.t(220, 142, '利益', 13, C.g, 'end');
    s += `<path d="M200 140C120 160 60 140 44 96" fill="none" stroke="${C.p}" stroke-width="2.5" stroke-dasharray="5 4"/>` + this.t(120, 132, 'もっと利益を得るために', 11, C.p);
    return this.svg(s, 168);
  },
  price() {
    const C = this.C;
    let s = this.pencil(110, 80, C.g) + `<path d="M160 50h90l14 22-14 22h-90z" fill="#fff6d6" stroke="${C.y}" stroke-width="2"/><circle cx="170" cy="72" r="4" fill="${C.y}"/>` + this.t(212, 80, '120円', 20, C.r) + this.ln(130, 66, 166, 72, '#999', 1.5);
    s += this.t(160, 128, '財・サービスの価値を', 13) + this.t(160, 148, 'お金で表したもの＝価格', 13, C.p);
    return this.svg(s, 160);
  },
  gov(hl) {
    const C = this.C, L = hl === 'small' || hl === 'smith', Rr = hl === 'big' || hl === 'keynes';
    let s = this.g(this.r(6, 6, 150, 124, '#eef8f0', 12, `stroke="${L ? C.g : '#ddd'}" stroke-width="${L ? 3 : 1}"`) + this.t(81, 26, '小さな政府', 14, C.g) + this.bldg(50, 56, '#999') + `<circle cx="110" cy="64" r="26" fill="#d6ecdc"/>` + this.t(110, 68, '市場', 12, C.g) + this.t(81, 106, '市場に委ねる', 11) + this.t(81, 122, hl === 'smith' ? 'アダム・スミス（18世紀）' : '政府の介入が少ない', 10, C.m), hl === 'mixed' || !Rr);
    s += this.g(this.r(164, 6, 150, 124, '#eef3fb', 12, `stroke="${Rr ? C.b : '#ddd'}" stroke-width="${Rr ? 3 : 1}"`) + this.t(239, 26, '大きな政府', 14, C.b) + this.bldg(206, 58, C.b) + `<circle cx="276" cy="64" r="20" fill="#dbe6f7"/>` + this.t(276, 68, '市場', 11, C.b) + this.ar(228, 56, 254, 60, C.b, 2) + this.t(239, 106, '公共事業・給付金で介入', 10) + this.t(239, 122, hl === 'keynes' ? 'ケインズ（20世紀・世界恐慌のあと）' : '政府が市場に介入', 10, C.m), hl === 'mixed' || !L);
    s += this.g(this.r(30, 138, 260, 28, C.p, 10) + this.t(160, 157, 'いまはこの2つが併存＝混合経済', 12, '#fff'), hl === 'mixed');
    return this.svg(s, 172);
  },
  util() {
    const C = this.C;
    let s = this.bldg(50, 66, C.b, '国') + this.ar(80, 66, 140, 66, C.b) + this.t(110, 56, '料金を決める', 10, C.b);
    s += `<path d="M170 70l40-30 40 30v40h-80z" fill="#f4efe4" stroke="#999" stroke-width="2"/>` + this.t(210, 132, 'わたしたちの生活', 11);
    s += `<path d="M266 40l-8 16h7l-5 14 14-20h-7l5-10z" fill="${C.y}"/>` + this.t(276, 84, '電気', 10, C.m) + `<path d="M288 102c-6-6-2-12 0-16 2 4 8 8 0 16z" fill="${C.r}"/>` + this.t(300, 120, 'ガス', 10, C.m) + `<path d="M250 112c-5-6 0-12 0-14 0 2 5 8 0 14z" fill="${C.b}"/>` + this.t(250, 132, '水道', 10, C.m);
    s += this.t(160, 156, '生活に直接影響するので国が決める＝公共料金', 12, C.p);
    return this.svg(s, 164);
  },
  share(hl) {
    const C = this.C, cols = [C.r, C.b, C.g, C.o, '#9aa6b8', '#c9c2b2', '#7cbf4d', '#e86fa8'], one = (x, k, name, parts, sub) => this.g(this.pie(x, 70, hl === k ? 44 : 34, parts, cols) + this.t(x, 136, name, 14, hl === k ? C.p : C.k) + this.t(x, 152, sub, 10, C.m), hl === k);
    return this.svg(one(55, 'mono', '独占', [0.9, 0.1], '1社がほぼ全部') + one(160, 'oligo', '寡占', [0.34, 0.3, 0.22, 0.14], '少数の会社') + one(265, 'free', '自由競争', [0.15, 0.14, 0.13, 0.13, 0.12, 0.11, 0.11, 0.11], 'たくさんの会社'), 160);
  },
  trust() {
    const C = this.C;
    let s = this.factory(50, 60, C.b) + this.pencil(50, 100, C.g) + this.t(50, 132, 'A文具', 12) + this.t(105, 70, '＋', 22, C.m) + this.factory(160, 60, C.o) + this.pencil(160, 100, C.g) + this.t(160, 132, 'B文具', 12);
    s += this.ar(196, 70, 228, 70, C.p) + `<g transform="translate(270 60) scale(1.5) translate(-270 -60)">${this.factory(270, 60, C.p)}</g>` + this.t(270, 132, '合併して大きく', 12, C.p);
    s += this.t(160, 22, '同じ業種（文房具）の会社が合併＝トラスト', 12, C.p);
    return this.svg(s, 150);
  },
  konzern(hl) {
    const C = this.C;
    let s = this.r(70, 8, 180, 40, C.p, 10) + this.t(160, 26, '持株会社', 11, '#fff') + this.t(160, 42, '〇〇ホールディングス', hl === 'hd' ? 15 : 13, hl === 'hd' ? '#f6e27a' : '#fff');
    const kids = [['文房具', C.b], ['製紙', '#7cbf4d'], ['運送', C.o], ['小売', C.r]];
    kids.forEach(([n, c], i) => { const x = 40 + i * 80; s += this.ln(160, 48, x, 90, '#999', 2) + this.r(x - 34, 90, 68, 34, c, 8) + this.t(x, 112, n, 12, '#fff'); });
    s += this.t(160, 146, 'いろいろな業種の会社を支配＝コンツェルン', 12, C.p);
    return this.svg(s, 156);
  },
  cartel(hl) {
    const C = this.C;
    let s = this.bldg(40, 70, '#8a8478', 'A社') + this.bldg(130, 70, '#8a8478', 'B社') + `<path d="M58 28h70v24h-46l-8 8v-8h-16z" fill="#fff" stroke="#999"/>` + this.t(93, 45, '値段をそろえよう', 10);
    s += this.ln(20, 20, 160, 110, C.r, 6) + this.ln(160, 20, 20, 110, C.r, 6);
    s += this.g(this.r(184, 18, 128, 34, '#fbe6e3', 8, `stroke="${C.r}"`) + this.t(248, 34, '独占禁止法', 13, C.r) + this.t(248, 48, '1947年', 10, C.r), hl !== 'jftc');
    s += this.g(`<circle cx="214" cy="88" r="14" fill="none" stroke="${C.b}" stroke-width="4"/>` + this.ln(224, 98, 236, 110, C.b, 5) + this.t(272, 92, '公正取引', 12, C.b) + this.t(272, 108, '委員会', 12, C.b), hl !== 'law');
    s += this.t(160, 140, '競争をなくす → 資本主義に反するので違法', 12, C.p);
    return this.svg(s, 150);
  },
  household(hl) {
    const C = this.C, X = 30, W = 260, row = (y, segs) => segs.map(([x0, w, c, l, k]) => this.g(this.r(X + x0 * W, y, w * W - 2, 26, c, 4) + this.t(X + (x0 + w / 2) * W, y + 17, l, Math.min(11, (w * W - 4) / l.length), '#fff'), !hl || hl === k || (Array.isArray(k) && k.includes(hl)))).join('');
    let s = this.t(X, 14, '1か月の家計（例）', 11, C.m, 'start');
    s += row(20, [[0, 1, '#6d7a88', '収入（所得：給与など）', ['inc', 'disp']]]);
    s += row(54, [[0, 0.19, C.r, '非消費支出', 'non'], [0.19, 0.81, '#5b8fd9', '可処分所得（実際に使えるお金）', 'disp']]);
    s += row(88, [[0.19, 0.71, C.b, '消費支出', ['cons', 'out', 'engel']], [0.9, 0.1, C.g, '貯蓄', 'sav']]);
    s += row(122, [[0.19, 0.18, C.o, '食費', 'engel'], [0.37, 0.53, '#9cb6e0', '住居・文房具など', 'cons']]);
    const note = { disp: '可処分所得 ＝ 収入 − 非消費支出', engel: 'エンゲル係数 ＝ 食費 ÷ 消費支出', non: '税金・社会保険料（払わないといけない）', sav: '預金・生命保険など', inc: '給与など、収入のもとが所得', cons: '食費・住居費など', out: '支出＝家計がお金を使うこと' }[hl] || '収入 → 税金など → 使うお金と貯蓄';
    s += this.t(160, 168, note, 12, C.p);
    return this.svg(s, 176);
  },
  consumer(hl) {
    const C = this.C; let s = '';
    if (hl === 'cool') {
      s += this.person(40, 70, C.o) + this.t(40, 100, '訪問販売', 11) + this.doc(100, 66, '契約');
      for (let k = 0; k < 14; k++) { const x = 150 + (k % 7) * 22, y = 34 + ((k / 7) | 0) * 26; s += this.r(x, y, 20, 22, k < 8 ? '#e2f3ea' : '#f2f2f2', 3, `stroke="${k < 8 ? C.g : '#ddd'}"`) + this.t(x + 10, y + 15, k + 1, 10, k < 8 ? C.g : '#bbb'); }
      s += this.t(227, 104, '8日以内なら', 12, C.g) + this.t(227, 122, '契約を解除できる', 12, C.g) + this.t(160, 152, 'クーリング・オフ制度', 14, C.p);
    } else if (hl === 'pl') {
      s += `<g transform="rotate(-20 60 60)"><rect x="34" y="54" width="22" height="10" fill="${C.g}"/><rect x="62" y="56" width="22" height="10" fill="${C.g}"/></g>` + this.t(60, 100, '欠陥商品', 12) + this.ar(90, 64, 120, 64, '#999') + this.person(146, 72, C.b) + this.t(146, 100, 'けがをした', 11) + this.ar(172, 64, 212, 64, C.r) + this.t(192, 56, '損害賠償', 10, C.r) + this.factory(250, 66) + this.t(250, 100, '企業', 12);
      s += this.t(160, 128, '企業の過失を証明しなくても請求できる', 12, C.p) + this.t(160, 148, 'PL法（製造物責任法）1994年', 13, C.p);
    } else if (hl === 'contract') {
      s += this.person(46, 74, '#5b5e66') + `<path d="M64 30h70v26h-46l-8 8v-8h-16z" fill="#fff" stroke="${C.r}"/>` + this.t(99, 48, 'うそ・脅迫', 11, C.r) + this.doc(190, 66, '契約') + `<circle cx="190" cy="66" r="18" fill="none" stroke="${C.r}" stroke-width="3"/>` + this.t(250, 62, '取り消せる', 13, C.r) + this.t(160, 140, '消費者契約法（2000年）', 14, C.p);
    } else {
      s += `<g transform="rotate(-20 50 50)"><rect x="26" y="44" width="20" height="9" fill="${C.g}"/><rect x="52" y="46" width="20" height="9" fill="${C.g}"/></g>` + this.t(50, 86, '欠陥商品', 11) + `<path d="M110 30h60v24h-40l-8 8v-8h-12z" fill="#fff" stroke="#999"/>` + this.t(140, 46, 'もうかる！', 10, C.r) + this.t(140, 86, '詐欺', 11) + this.ar(180, 60, 220, 60, '#999') + this.person(250, 68, C.b) + `<path d="M244 58q6-4 12 0" stroke="#555" fill="none"/>` + this.t(250, 96, '消費者', 11);
      s += this.t(160, 132, '消費者が受ける被害＝消費者問題', 13, C.p);
    }
    return this.svg(s, 162);
  },
  corp(hl) {
    const C = this.C; let s = '';
    if (hl === 'firm') {
      s += this.t(40, 40, '原料', 12) + this.t(40, 64, '設備', 12) + this.t(40, 88, '労働力', 12) + this.ar(70, 64, 120, 64, '#999') + this.factory(160, 62, C.b) + this.t(160, 96, '企業', 14, C.b) + this.ar(200, 64, 240, 64, '#999') + this.t(276, 58, '財・', 12) + this.t(276, 74, 'サービス', 12);
      s += this.t(160, 132, '原料・設備・労働力で生産するもの', 12, C.p);
      return this.svg(s, 146);
    }
    s += this.g(this.r(8, 8, 146, 120, '#eef3fb', 12, `stroke="${hl === 'private' ? C.b : '#ddd'}" stroke-width="${hl === 'private' ? 3 : 1}"`) + this.factory(81, 46, C.b) + this.t(81, 84, '私企業', 15, C.b) + this.t(81, 102, '株式会社など', 11) + this.t(81, 118, '目的：利益', 11, C.m), hl !== 'public');
    s += this.g(this.r(166, 8, 146, 120, '#eef8f0', 12, `stroke="${hl === 'public' ? C.g : '#ddd'}" stroke-width="${hl === 'public' ? 3 : 1}"`) + this.bldg(239, 44, C.g) + this.t(239, 84, '公企業', 15, C.g) + this.t(239, 102, '国・地方自治体が出資', 10) + this.t(239, 118, '例：市営バス・水道局', 10, C.m), hl !== 'private');
    return this.svg(s, 136);
  },
  stock(hl) {
    const C = this.C; let s = '';
    if (hl === 'exchange') {
      s += this.r(60, 14, 200, 92, '#1f2a36', 8) + [['ぶんぐ工房', '1,250円', '▲', C.r], ['A文具', '980円', '▼', '#5fd38a'], ['B製紙', '540円', '▲', C.r]].map(([n, v, a, c], i) => this.t(76, 40 + i * 24, n, 12, '#fff', 'start') + this.t(236, 40 + i * 24, v + ' ' + a, 12, c, 'end')).join('');
      s += this.person(40, 140, C.o) + this.t(78, 146, '売りたい', 11) + this.person(280, 140, C.b) + this.t(242, 146, '買いたい', 11);
      s += this.t(160, 128, '株式を売り買いする所＝証券取引所', 12, C.p);
      return this.svg(s, 156);
    }
    if (hl === 'agm') {
      s += this.r(80, 60, 160, 20, '#c9a26b', 6) + [0, 1, 2, 3, 4].map(k => this.person(96 + k * 32, 54, [C.b, C.o, C.g, C.r, C.p][k])).join('');
      s += this.t(160, 22, '株主総会：経営方針を決める', 13, C.p) + this.t(160, 108, '100株もつ人は100票', 12) + this.t(160, 128, '一株一票', 15, C.p);
      return this.svg(s, 140);
    }
    if (hl === 'limited') {
      s += this.person(50, 70, C.b) + this.t(50, 100, '株主', 12) + this.doc(120, 62, '株 10万円') + this.ar(140, 62, 186, 62, '#999') + this.factory(220, 60) + this.ln(198, 42, 242, 80, C.r, 5) + this.ln(242, 42, 198, 80, C.r, 5) + this.t(220, 98, '倒産', 12, C.r);
      s += this.t(160, 128, '失うのは株の金額（10万円）だけ', 13, C.p) + this.t(160, 148, '会社の借金を払わなくてよい＝有限責任', 12, C.p);
      return this.svg(s, 158);
    }
    if (hl === 'div') {
      s += this.factory(50, 60, C.b) + this.t(50, 94, '会社の利益', 11) + this.coin(110, 50) + this.coin(130, 60) + this.ar(146, 56, 210, 56, C.g) + this.t(178, 48, '配当', 12, C.g) + this.person(250, 66, C.o) + this.t(250, 94, '株主', 12);
      s += `<rect x="236" y="104" width="28" height="20" fill="${C.r}"/><rect x="248" y="104" width="4" height="20" fill="#f6e27a"/>` + this.t(250, 140, '株主優待', 11, C.r) + this.t(110, 132, '利益の一部を株主に分ける', 12, C.p);
      return this.svg(s, 150);
    }
    s += this.factory(50, 60, C.b) + this.t(50, 94, '会社', 12) + this.ar(80, 50, 200, 50, C.p) + this.doc(140, 76, '株式（株券）') + this.ar(200, 106, 80, 106, C.g) + this.t(140, 124, 'お金（出資）', 11, C.g);
    s += this.person(240, 70, C.o) + this.person(270, 76, C.r) + this.t(256, 100, '株主', 13, hl === 'holder' ? C.p : C.k) + this.t(160, 150, '株は100株単位で売買される', 12, C.p);
    return this.svg(s, 160);
  },
  csr() {
    const C = this.C;
    let s = this.factory(160, 70, C.b) + this.t(160, 104, 'あなたの会社', 12) + this.tree(50, 50) + this.t(50, 84, '植林', 11) + this.bldg(270, 52, C.o) + this.t(270, 84, '学校に寄付', 11);
    s += `<g transform="translate(160 132)"><path d="M-14 0a14 14 0 1 1 6 11" fill="none" stroke="${C.g}" stroke-width="4"/><polygon points="-12,8 -4,14 -14,16" fill="${C.g}"/></g>` + this.t(206, 136, 'リサイクル', 11, C.g, 'start');
    s += this.t(160, 22, '企業の社会的責任＝CSR', 13, C.p);
    return this.svg(s, 156);
  },
  free() {
    const C = this.C;
    let s = [['A社', '100円'], ['B社', '95円'], ['C社', '98円']].map(([n, p], i) => this.shop(60 + i * 100, 60, [C.r, C.b, C.g][i]) + this.t(60 + i * 100, 96, n, 12) + `<path d="M${40 + i * 100} 22h40l6 8-6 8h-40z" fill="#fff6d6" stroke="${C.y}"/>` + this.t(62 + i * 100, 35, p, 11, C.r)).join('');
    s += this.t(160, 128, '自由に競争すると、', 12, C.p) + this.t(160, 146, '価格の自動調節機能がはたらく', 12, C.p);
    return this.svg(s, 156);
  },
};
// 用語 → 図
const TERM_FIG = {
  生産の三要素: () => FG.factors('all'), 土地: () => FG.factors('land'), 労働: () => FG.factors('labor'), 資本: () => FG.factors('cap'),
  財: () => FG.goods('g'), サービス: () => FG.goods('s'), 市場: () => FG.market(), 付加価値: () => FG.added(false), 'GDP（国内総生産）': () => FG.added(true),
  '第1次・第2次・第3次産業': () => FG.industry(), 投資: () => FG.invest(), 価格: () => FG.price(),
  需要: () => FG.dd({ only: 'd', s: false }), 供給: () => FG.dd({ only: 's', d: false }), 需要曲線: () => FG.dd({ only: 'd' }), 供給曲線: () => FG.dd({ only: 's' }),
  超過供給: () => FG.dd({ over: true, eq: true }), 超過需要: () => FG.dd({ under: true, eq: true }), 均衡価格: () => FG.dd({ eq: true }),
  価格の自動調節機能: () => FG.dd({ eq: true, adj: true }), 神の見えざる手: () => FG.dd({ eq: true, adj: 'hand' }), 市場経済: () => FG.dd({ eq: true, adj: true }), 自由競争: () => FG.free(),
  アダム・スミス: () => FG.gov('smith'), 小さな政府: () => FG.gov('small'), 大きな政府: () => FG.gov('big'), ケインズ: () => FG.gov('keynes'), 混合経済: () => FG.gov('mixed'),
  公共料金: () => FG.util(), 独占: () => FG.share('mono'), 寡占: () => FG.share('oligo'), トラスト: () => FG.trust(), コンツェルン: () => FG.konzern(), ホールディングス: () => FG.konzern('hd'),
  カルテル: () => FG.cartel(), 独占禁止法: () => FG.cartel('law'), 公正取引委員会: () => FG.cartel('jftc'),
  家計: () => FG.household(''), 収入: () => FG.household('inc'), 所得: () => FG.household('inc'), 支出: () => FG.household('out'), 消費支出: () => FG.household('cons'), 非消費支出: () => FG.household('non'), 貯蓄: () => FG.household('sav'), エンゲル係数: () => FG.household('engel'), 可処分所得: () => FG.household('disp'),
  消費者問題: () => FG.consumer(''), 'クーリング・オフ制度': () => FG.consumer('cool'), 'PL法（製造物責任法）': () => FG.consumer('pl'), 消費者契約法: () => FG.consumer('contract'),
  企業: () => FG.corp('firm'), 私企業: () => FG.corp('private'), 公企業: () => FG.corp('public'),
  株式: () => FG.stock('stock'), 株主: () => FG.stock('holder'), 証券取引所: () => FG.stock('exchange'), 配当: () => FG.stock('div'), 株主総会: () => FG.stock('agm'), 有限責任: () => FG.stock('limited'), 'CSR（企業の社会的責任）': () => FG.csr(),
};
const termFig = id => { try { return TERM_FIG[id] ? TERM_FIG[id]() : ''; } catch (e) { return ''; } };
// くわしい説明（例を入れて）
const EXPL = {
  生産の三要素: 'ものやサービスを生産するには、自然のめぐみ（土地）、人のはたらき（労働）、工場や機械（資本）の3つが必要です。この会社なら、事務所の場所・社員・生産ラインがそれにあたります。',
  土地: '「土地」は地面だけでなく、自然界にあるもの全部をさします。天然の魚や天然の木（天然物）も土地です。',
  労働: '人が体や頭を使ってはたらくことです。社員が開発や品質チェックをするのも労働です。',
  資本: '生産のために人が作った道具や設備です。工場・機械・船・漁具など。養殖の魚や強化木のような人工物も資本にあたります。',
  財: '手でさわれる、形のある生産物です。えんぴつ・シャーペン・車・パンなど。',
  サービス: '形はないけれど、人の役に立つ生産物です。電車やバスで運ぶこと、髪を切ること、ペンに名前を入れることもサービスです。',
  市場: '財やサービスが売り買いされる場所です。お店だけでなく、売る人と買う人が出会う「しくみ」全体をさします。',
  付加価値: '原材料に手を加えて、新しく生み出した価値です。100円の材料で180円の文房具を作れば、80円の付加価値を生んだことになります。',
  'GDP（国内総生産）': '国内の会社などが1年間に生み出した付加価値を全部たした金額です。国の経済の大きさをあらわします。',
  '第1次・第2次・第3次産業': '第1次は自然からとる産業（農林水産業）、第2次はものを作る産業（工業など）、第3次は売る・サービスの産業です。第1次産業は付加価値をつけにくく、第2次・第3次はつけやすい。先進国では第3次産業で働く人が多くなります。',
  投資: 'もっと利益を得るために、お金を使って工場・機械（資本）や人（労働）を増やすことです。生産ラインを買う・人をやとうのも投資です。',
  価格: '財やサービスの価値を、お金の量で表したものです。需要と供給のバランスで上がったり下がったりします。',
  需要: '消費者が「買いたい」と思う量です。ふつう、値段が安いほど需要は多くなります。',
  供給: '生産者が「作りたい・売りたい」と思う量です。ふつう、値段が高いほど供給は多くなります。',
  需要曲線: '値段と、買いたい量の関係を表すグラフです。値段が高いほど買う量が少ないので、右下がりになります。',
  供給曲線: '値段と、作りたい量の関係を表すグラフです。値段が高いほどたくさん作りたいので、右上がりになります。',
  超過供給: '供給（作った量）が需要（買いたい量）より多い状態です。売れ残りが出るので、値段は下がっていきます。',
  超過需要: '需要（買いたい量）が供給（作った量）より多い状態です。品薄になるので、値段は上がっていきます。',
  均衡価格: '需要曲線と供給曲線が交わる所の価格です。需要＝供給なので、売れ残りも品薄も起きません（資源の最適配分）。',
  価格の自動調節機能: '売れ残れば値段が下がり、品薄なら値段が上がって、自然に均衡価格に近づくはたらきです。市場の自由競争が条件です。',
  アダム・スミス: '18世紀イギリスの経済学者です。価格の自動調節機能を「神の見えざる手」と呼びました。',
  神の見えざる手: 'だれかが命令しなくても、市場が自然に値段を調節してくれる様子を、アダム・スミスはこう表しました。',
  自由競争: 'たくさんの会社が、自由に値段や品質を競いあうことです。これがあると価格の自動調節機能がはたらきます。',
  市場経済: '国が決めるのではなく、市場での価格の自動調節機能によって、何をどれだけ作るかが決まっていく経済の考え方です。',
  小さな政府: '政府はできるだけ市場に口を出さず、経済を市場に任せる考え方です。税金を安くして、規制をへらします。',
  大きな政府: '政府が市場に介入して問題を解決する考え方です。不景気のときに公共事業や給付金で経済を支えます。',
  ケインズ: '20世紀イギリスの経済学者です。1929年の世界恐慌のあと、政府が市場に介入する考え方（大きな政府）を理論づけました。',
  混合経済: '市場に任せる部分（小さな政府）と、政府が介入する部分（大きな政府）が、いっしょに存在する現在の経済です。',
  公共料金: '電気・ガス・水道・鉄道などの料金です。国民の生活に直接影響するので、会社が自由に決めず、国が決めたり認めたりします。',
  独占: '1つの会社が、ある市場（事業）をほとんど独り占めしている状態です。競争がないので値段が高くなりやすい。',
  寡占: '少数の会社が、ある市場をほとんど独り占めしている状態です。',
  トラスト: '同じ業種の会社どうしが合併して、1つの大きな会社になることです。ライバルの文房具会社を買収するのがこれ。',
  コンツェルン: '持株会社が、ちがう業種の会社の株を持って、まとめて支配することです。',
  ホールディングス: '持株会社（ほかの会社の株を持って支配する会社）の名前によくつく言葉です。HDと書くこともあります。',
  カルテル: '同じ業種の会社が、前もって値段や生産量を話し合って決め、競争をなくすことです。競争をなくし資本主義に反するので違法です。',
  独占禁止法: '不公正な取引を防ぎ、自由競争を守るための法律です。1947年にできました。カルテルなどを禁止しています。',
  公正取引委員会: '独占禁止法を運用する国の機関です。カルテルなどを調べて、課徴金を命じます。',
  家計: '家庭の経済活動です。収入を得て、消費支出・非消費支出・貯蓄に分けて使います。',
  収入: '家計にお金が入ることです。会社からの給与など。',
  所得: '給与など、収入のもとになるものです。会社が社員にはらう給料は、社員の家計の所得になります。',
  支出: '家計がお金を使うことです。消費支出と非消費支出があります。',
  消費支出: '食費・住居費・文房具代など、生活のために使うお金です。',
  非消費支出: '税金や社会保険料など、払わないといけないお金です。',
  貯蓄: '預金や生命保険など、使わずにためておくお金です。',
  エンゲル係数: '消費支出のうち、食費がしめる割合です。生活が苦しいと高くなりやすい。',
  可処分所得: '収入から非消費支出（税金など）を引いた、実際に使えるお金です。可処分所得が増えると、文房具も売れやすくなります。',
  消費者問題: '欠陥商品や詐欺、うその宣伝など、消費者が受ける被害のことです。',
  'クーリング・オフ制度': '訪問販売などで買ったとき、一定期間（訪問販売なら8日間）なら理由がなくても契約を解除できる制度です。',
  'PL法（製造物責任法）': '欠陥商品で被害を受けたとき、企業の過失（不注意）を証明しなくても損害賠償を請求できる法律です。1994年にできました。',
  消費者契約法: 'うそや脅迫など、不当な方法で結ばされた契約を取り消せる法律です。2000年にできました。',
  企業: '原料や設備を整え、労働力を使って財・サービスを生産するものです。',
  私企業: '株式会社など、利益を目的にしている企業です。この会社もライバル会社も私企業です。',
  公企業: '国や地方自治体が出資している企業です。市営バスや水道局など。',
  株式: '会社が、お金を出してくれた人（出資者）に発行する証券です。株は100株単位で売り買いされます。',
  株主: '株式を持っている出資者です。配当や株主優待を受けたり、株主総会に出たりできます。',
  証券取引所: '株式を売り買いする所です。会社が上場すると、ここで株価がつきます。',
  配当: '会社が利益の一部を、持っている株の数に応じて株主に分けることです。',
  株主総会: '株主が集まって、会社の経営方針を決める会議です。1株につき1票（一株一票）で投票します。',
  有限責任: '会社が倒産しても、株主が失うのは持っている株の金額だけ、ということです。会社の借金まで払う必要はありません。',
  'CSR（企業の社会的責任）': '企業が、利益だけでなく、環境を守る・地域や学校を助けるなど、社会への責任を果たすことです。',
};
