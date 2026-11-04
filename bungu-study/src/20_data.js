// =========================================================================================
//  データ：文房具の種類・性能の選択肢・見た目の項目・研究・スタッフ・設備・事務所・ライバル・目標
//  （会社名・人物・製品はすべて架空。実在のメーカーや商品名は使わない）
// =========================================================================================
const SEGS = { stu: '学生', adu: '社会人', pro: 'プロ（絵・製図）' };

// 種類：週あたりの国内の市場（本数）、層の割合、性能の期待（年ごとに上がる）、開発の基本費用と日数、不具合の数、1本の生産の手間
const KINDS = {
  pencil:   { name: 'えんぴつ',   short: 'えんぴつ', base: 42000, segw: { stu: .7, adu: .12, pro: .18 }, e0: 24, slope: 1.15, dev: 200000, days: 10, bugs: 2, work: 1,  unlock: null,   trend: dy => Math.max(0.62, 1 - dy * 0.014) },
  eraser:   { name: '消しゴム',   short: '消しゴム', base: 36000, segw: { stu: .72, adu: .18, pro: .1 }, e0: 22, slope: 1.05, dev: 200000, days: 10, bugs: 2, work: 1,  unlock: null,   trend: () => 1 },
  lead:     { name: 'シャー芯',   short: 'シャー芯', base: 30000, segw: { stu: .62, adu: .26, pro: .12 }, e0: 20, slope: 1.2, dev: 350000, days: 12, bugs: 3, work: 1,  unlock: 'r_mech', trend: dy => 1 + dy * 0.006 },
  mech:     { name: 'シャープペンシル', short: 'シャーペン', base: 15000, segw: { stu: .6, adu: .25, pro: .15 }, e0: 34, slope: 1.5, dev: 1200000, days: 18, bugs: 5, work: 3,  unlock: 'r_mech', trend: dy => 1 + dy * 0.02 },
  ball:     { name: 'ボールペン', short: 'ボールペン', base: 60000, segw: { stu: .45, adu: .5, pro: .05 }, e0: 24, slope: 1.7, dev: 900000, days: 16, bugs: 4, work: 1.5, unlock: 'r_ball', trend: dy => 1 + dy * 0.015 },
  fountain: { name: '万年筆',     short: '万年筆', base: 1500, segw: { stu: .1, adu: .7, pro: .2 }, e0: 22, slope: 1.6, dev: 3000000, days: 26, bugs: 8, work: 20, unlock: 'r_fp',   trend: dy => 1 + Math.max(0, dy - 8) * 0.06 },
};
const KIND_IDS = Object.keys(KINDS);

// 性能の選択肢：lv＝性能の点、cost＝1本の原価（円）、req＝必要な研究、pop＝その品の需要の大きさ（太さ・濃さなど）、seg＝よろこぶ層
const opt = (id, name, lv, cost, o = {}) => Object.assign({ id, name, lv, cost }, o);
const LEAD_SIZES = [opt('s05', '0.5mm', 5, 0, { pop: 1 }), opt('s07', '0.7mm', 5, 0, { pop: .45, req: 'r_l07', seg: { stu: .15 } }), opt('s03', '0.3mm', 7, 1, { pop: .55, req: 'r_l03', seg: { adu: .2, pro: .2 } }), opt('s09', '0.9mm', 4, 0, { pop: .22, req: 'r_l09' }), opt('s02', '0.2mm', 12, 2, { pop: .32, req: 'r_l02', seg: { pro: .3, adu: .1 } })];
const GRADES = [opt('HB', 'HB', 0, 0, { pop: 1 }), opt('B', 'B', 0, 0, { pop: .9, seg: { stu: .1 } }), opt('2B', '2B', 0, 0, { pop: .75, seg: { stu: .15 } }), opt('H', 'H', 0, 0, { pop: .45, seg: { pro: .2 } }), opt('F', 'F', 0, 0, { pop: .25, seg: { adu: .1 } }), opt('2H', '2H', 0, 0, { pop: .3, seg: { pro: .3 } }), opt('4B', '4B', 0, 0, { pop: .3, seg: { pro: .4 } }), opt('6B', '6B', 0, 0, { pop: .18, seg: { pro: .5 } })];
const GRIPS = [opt('none', 'なし', 0, 0), opt('rubber', 'ラバー', 6, 8, { req: 'r_g1', seg: { stu: .1 } }), opt('silicone', 'やわらかシリコン', 10, 12, { req: 'r_g2', seg: { stu: .15, adu: .05 } }), opt('knurl', '金属ローレット', 12, 22, { req: 'r_g3', seg: { pro: .25, adu: .1 } })];
const SPECS = {
  pencil: [
    { key: 'grade', name: '芯の濃さ', opts: GRADES },
    { key: 'core', name: '芯の質', opts: [opt('c0', 'ふつうの芯', 10, 3), opt('c1', 'なめらかな芯', 18, 4, { req: 'r_pc1' }), opt('c2', '高密度の芯', 26, 6, { req: 'r_pc2', seg: { pro: .15 } }), opt('c3', '折れにくい芯', 32, 7, { req: 'r_pc3', seg: { stu: .1 } })] },
    { key: 'wood', name: '軸の木', opts: [opt('w0', 'ふつうの木', 8, 5), opt('w1', '香りのよい杉', 14, 8, { req: 'r_pw1', seg: { adu: .1, pro: .1 } }), opt('w2', '再生材（エコ）', 12, 6, { req: 'r_pw2', eco: 1 })] },
    { key: 'shape', name: '形', opts: [opt('hex', '六角', 4, 0), opt('round', '丸', 4, 0), opt('tri', '三角（持ちやすい）', 8, 1, { req: 'r_ptri', seg: { stu: .2 } })] },
    { key: 'erase', name: 'おしりの消しゴム', opts: [opt('no', 'なし', 0, 0, { seg: { pro: .1 } }), opt('yes', 'あり', 3, 2, { seg: { stu: .1 } })] },
  ],
  eraser: [
    { key: 'mat', name: '素材', opts: [opt('m0', '天然ゴム', 8, 6), opt('m1', 'プラスチック', 13, 5), opt('m2', 'よく消える樹脂', 20, 7, { req: 'r_e1' }), opt('m3', '消しくずがまとまる', 26, 8, { req: 'r_e2', seg: { stu: .15 } }), opt('m4', '軽い力で消える', 32, 9, { req: 'r_e3', seg: { stu: .1, adu: .1 } })] },
    { key: 'size', name: '大きさ', opts: [opt('sm', '小', 2, 2, { seg: { adu: .1 } }), opt('md', '中', 4, 4), opt('lg', '大', 5, 6, { seg: { stu: .05 } })] },
    { key: 'shape', name: '形', opts: [opt('box', '四角', 3, 0), opt('soft', '丸みのある形', 4, 0), opt('many', '角がたくさんある形', 9, 1, { req: 'r_e4', seg: { stu: .15, pro: .1 } }), opt('stick', '細長いホルダー式', 8, 14, { req: 'r_e5', seg: { pro: .25, adu: .1 } })] },
    { key: 'sleeve', name: 'ケース', opts: [opt('k0', '紙のケース', 1, 1), opt('k1', '角が折れにくいケース', 5, 1, { req: 'r_e6' })] },
    { key: 'scent', name: '香り', opts: [opt('none', 'なし', 0, 0), opt('berry', 'いちご', 2, 1, { req: 'r_scent', seg: { stu: .15 } }), opt('lemon', 'レモン', 2, 1, { req: 'r_scent', seg: { stu: .15 } }), opt('mint', 'ミント', 2, 1, { req: 'r_scent', seg: { stu: .1, adu: .05 } })] },
  ],
  lead: [
    { key: 'size', name: '太さ', opts: LEAD_SIZES },
    { key: 'grade', name: '濃さ', opts: GRADES.filter(g => !['4B', '6B'].includes(g.id)) },
    { key: 'str', name: '芯の強さ', opts: [opt('t0', 'ふつう', 8, 6), opt('t1', '折れにくい', 16, 8, { req: 'r_l1' }), opt('t2', '高強度ナノ芯', 26, 11, { req: 'r_l2' }), opt('t3', 'なめらか高強度芯', 34, 13, { req: 'r_l3' })] },
    { key: 'count', name: '本数', opts: [opt('n20', '20本', 2, 0), opt('n40', '40本', 4, 8, { seg: { adu: .1, pro: .1 } })] },
    { key: 'case', name: 'ケース', opts: [opt('c0', '小さな箱', 1, 1), opt('c1', 'スライド式', 4, 2, { req: 'r_lc' }), opt('c2', '1本ずつ出せる', 7, 4, { req: 'r_lc2', seg: { stu: .1 } })] },
  ],
  mech: [
    { key: 'size', name: '芯の太さ', opts: LEAD_SIZES },
    { key: 'mech', name: '機構', opts: [opt('k0', 'ノック式', 10, 60), opt('k1', 'サイドノック', 13, 75, { req: 'r_m1', seg: { adu: .1 } }), opt('k2', '振って芯を出す', 16, 90, { req: 'r_m2', seg: { stu: .2 } }), opt('k3', '芯が回る機構', 24, 140, { req: 'r_m3', seg: { stu: .15 } }), opt('k4', '芯が折れない機構', 30, 190, { req: 'r_m4', seg: { stu: .2 } }), opt('k5', '自動で芯が出る機構', 36, 260, { req: 'r_m5', seg: { adu: .1, stu: .1 } })] },
    { key: 'tip', name: '先端', opts: [opt('t0', 'ふつうのパイプ', 3, 0), opt('t1', '製図用の長いパイプ', 7, 10, { req: 'r_tipd', seg: { pro: .3 } }), opt('t2', 'ひっこむパイプ', 8, 25, { req: 'r_tip', seg: { stu: .1, adu: .1 } })] },
    { key: 'erase', name: '消しゴム', opts: [opt('e0', '小さい消しゴム', 2, 3), opt('e1', '回して出る消しゴム', 5, 12, { req: 'r_twe' })] },
  ],
  ball: [
    { key: 'ink', name: 'インク', opts: [opt('oil', '油性', 10, 20), opt('gel', '水性ゲル', 16, 28, { req: 'r_gel', seg: { stu: .2 } }), opt('low', '低粘度油性', 24, 32, { req: 'r_lv', seg: { adu: .2 } }), opt('erasable', '消せるインク', 22, 40, { req: 'r_fr', seg: { stu: .45 } }), opt('quick', '速乾ゲル', 28, 36, { req: 'r_qd', seg: { stu: .15, adu: .1 } }), opt('pigment', 'にじまない顔料ゲル', 32, 40, { req: 'r_pg', seg: { adu: .15, pro: .2 } })] },
    { key: 'tip', name: 'ボールの太さ', opts: [opt('t10', '1.0mm', 3, 0, { pop: .4 }), opt('t07', '0.7mm', 5, 0, { pop: 1 }), opt('t05', '0.5mm', 7, 1, { pop: 1, req: 'r_b05' }), opt('t038', '0.38mm', 10, 2, { pop: .7, req: 'r_b038', seg: { stu: .1 } }), opt('t028', '0.28mm', 12, 3, { pop: .35, req: 'r_b028', seg: { pro: .2 } })] },
    { key: 'colors', name: '色の数', opts: [opt('c1', '1色', 0, 0), opt('c2', '2色', 4, 25, { req: 'r_mc' }), opt('c3', '3色', 7, 45, { req: 'r_mc', seg: { stu: .1 } }), opt('c4', '4色', 9, 60, { req: 'r_mc4', seg: { stu: .15 } }), opt('cm', '多機能（3色＋シャープ）', 13, 85, { req: 'r_mf', seg: { adu: .2 } })] },
    { key: 'act', name: '方式', opts: [opt('cap', 'キャップ式', 2, 5), opt('knock', 'ノック式', 5, 12), opt('twist', '回転式', 6, 18, { req: 'r_tw', seg: { adu: .15 } })] },
    { key: 'grip', name: 'グリップ', opts: GRIPS },
    { key: 'body', name: '軸の素材', opts: [opt('plastic', 'プラスチック', 3, 10), opt('clear', '透明プラスチック', 4, 12, { clear: 1 }), opt('alu', 'アルミ', 8, 60, { req: 'r_al', metal: 1, seg: { adu: .15 } }), opt('brass', '真ちゅう', 12, 120, { req: 'r_brass', metal: 1, seg: { adu: .25 } })] },
  ],
  fountain: [
    { key: 'nib', name: 'ペン先', opts: [opt('steel', 'ステンレス', 10, 300), opt('k14', '14金', 20, 1800, { req: 'r_14k', seg: { adu: .1 } }), opt('k18', '18金', 26, 2800, { req: 'r_18k', seg: { adu: .15 } }), opt('k21', '21金', 30, 3800, { req: 'r_21k', seg: { adu: .2, pro: .1 } }), opt('soft', 'やわらかい21金', 34, 4500, { req: 'r_soft', seg: { pro: .3 } })] },
    { key: 'width', name: '字幅', opts: [opt('EF', '極細', 2, 0, { pop: .6 }), opt('F', '細字', 2, 0, { pop: 1 }), opt('M', '中字', 2, 0, { pop: 1 }), opt('B', '太字', 2, 0, { pop: .4 }), opt('MS', '筆のような字幅', 6, 120, { pop: .25, req: 'r_mus', seg: { pro: .4 } })] },
    { key: 'fill', name: 'インクの入れ方', opts: [opt('cart', 'カートリッジ', 4, 20), opt('conv', '両用式（コンバーター）', 8, 60, { req: 'r_conv' }), opt('piston', '吸入式', 14, 220, { req: 'r_piston', seg: { pro: .15, adu: .1 } })] },
    { key: 'body', name: '軸', opts: [opt('resin', '樹脂', 4, 120), opt('metal', '金属', 8, 260, { req: 'r_fpm', metal: 1 }), opt('wood', '木', 9, 300, { req: 'r_wood', woodBody: 1, seg: { adu: .1 } }), opt('ebonite', 'エボナイト', 12, 900, { req: 'r_ebo', seg: { pro: .15 } }), opt('urushi', '漆塗り', 16, 1800, { req: 'r_urushi', seg: { adu: .25 } })] },
    { key: 'cap', name: 'キャップ', opts: [opt('screw', 'ねじ式', 4, 40), opt('push', 'はめ込み式', 3, 30), opt('capless', 'キャップレス（ノック式）', 12, 900, { req: 'r_capless', seg: { adu: .2 } })] },
  ],
};

// 見た目：色・模様・仕上げ・金具・ロゴ。性能には関係しないが、デザインの点（流行・こだわり）に関係する
const PALETTE = ['#f4f1ea', '#1d1d1f', '#c8c8c8', '#6b6b70', '#d93b2f', '#f08a24', '#f6c945', '#7cbf4d', '#2f9e6e', '#2b8fd6', '#24438f', '#7b4bc4',
  '#e86fa8', '#f7b6c8', '#fbe3a4', '#bfe3c0', '#b9dcf2', '#d7c4ef', '#a89f91', '#8f9e8b', '#9aa6b8', '#c9a28c', '#6d4b33', '#3e5a47'];
const PATTERNS = { none: '無地', stripe: 'しま', dots: '水玉', stars: '星', check: 'チェック', hearts: 'ハート', grad: 'グラデーション', marble: '大理石', wood: '木目', camo: 'まだら' };
const FINISHES = { gloss: 'ツヤ', matte: 'マット', metal: 'メタリック', pearl: 'パール' };
const METALS = { silver: '銀', gold: '金', black: '黒', rose: 'ピンクゴールド' };
const FONTS = { goth: 'ゴシック', round: '丸文字', mincho: '明朝' };
const INKS = ['#1a1a1a', '#1f3fa8', '#c8261e', '#2a8a3e', '#e2589a', '#6a3fb8', '#e07a1c', '#2a9db0', '#6b4a2b'];
const WOOD_TONES = { maple: ['メープル', '#dcb57f', '#a9784a'], walnut: ['ウォルナット', '#6e4a31', '#3e281b'], ebony: ['黒檀', '#2c2522', '#110d0b'], cherry: ['チェリー', '#a8553a', '#6b2e1f'] };
const LOOKS = {
  pencil: [
    { key: 'body', name: '軸の色', type: 'color' }, { key: 'finish', name: '仕上げ', type: 'sel', opts: FINISHES },
    { key: 'pattern', name: '模様', type: 'sel', opts: PATTERNS }, { key: 'pat', name: '模様の色', type: 'color' },
    { key: 'tip', name: 'おしりの色', type: 'color' }, { key: 'eraser', name: '消しゴムの色', type: 'color', when: d => d.spec.erase === 'yes' },
    { key: 'metal', name: '金具', type: 'sel', opts: METALS, when: d => d.spec.erase === 'yes' },
    { key: 'logo', name: 'ロゴの文字', type: 'text' }, { key: 'logoColor', name: '文字の色', type: 'color' }, { key: 'font', name: '字体', type: 'sel', opts: FONTS },
  ],
  eraser: [
    { key: 'body', name: '消しゴムの色', type: 'color' }, { key: 'sleeve', name: 'ケースの色', type: 'color' },
    { key: 'pattern', name: 'ケースの模様', type: 'sel', opts: PATTERNS }, { key: 'pat', name: '模様の色', type: 'color' },
    { key: 'finish', name: 'ケースの仕上げ', type: 'sel', opts: FINISHES },
    { key: 'logo', name: 'ロゴの文字', type: 'text' }, { key: 'logoColor', name: '文字の色', type: 'color' }, { key: 'font', name: '字体', type: 'sel', opts: FONTS },
  ],
  lead: [
    { key: 'body', name: 'ケースの色', type: 'color' }, { key: 'clear', name: 'ケースの透け', type: 'sel', opts: { clear: '透明', smoke: 'スモーク', solid: '不透明' } },
    { key: 'cap', name: 'ふたの色', type: 'color' }, { key: 'label', name: 'ラベルの色', type: 'color' },
    { key: 'pattern', name: 'ラベルの模様', type: 'sel', opts: PATTERNS }, { key: 'pat', name: '模様の色', type: 'color' },
    { key: 'logo', name: 'ロゴの文字', type: 'text' }, { key: 'logoColor', name: '文字の色', type: 'color' }, { key: 'font', name: '字体', type: 'sel', opts: FONTS },
  ],
  mech: [
    { key: 'body', name: '軸の色', type: 'color', when: d => { const m = mechBuild(d).mat; return ['resin', 'clear', 'alu'].includes(m.barrel) || ['resin', 'alu'].includes(m.grip); } },
    { key: 'finish', name: '軸の仕上げ', type: 'sel', opts: FINISHES, when: d => ['resin', 'alu'].includes(mechBuild(d).mat.barrel) },
    { key: 'pattern', name: '模様', type: 'sel', opts: PATTERNS, when: d => ['resin', 'alu'].includes(mechBuild(d).mat.barrel) }, { key: 'pat', name: '模様の色', type: 'color', when: d => ['resin', 'alu'].includes(mechBuild(d).mat.barrel) },
    { key: 'grip', name: 'グリップの色', type: 'color', when: d => ['resin', 'rubber', 'silicone', 'alu'].includes(mechBuild(d).mat.grip) },
    { key: 'woodTone', name: '木の種類', type: 'sel', opts: Object.fromEntries(Object.entries(WOOD_TONES).map(([k, v]) => [k, v[0]])), when: d => Object.values(mechBuild(d).mat).some(m => m === 'wood' || m === 'wood2') },
    { key: 'metal', name: '金具のめっき', type: 'sel', opts: METALS },
    { key: 'clipColor', name: 'クリップの色', type: 'color', when: d => mechBuild(d).mat.clip === 'resin' },
    { key: 'logo', name: 'ロゴの文字', type: 'text' }, { key: 'logoColor', name: '文字の色', type: 'color' }, { key: 'font', name: '字体', type: 'sel', opts: FONTS },
  ],
  ball: [
    { key: 'body', name: '軸の色', type: 'color' }, { key: 'finish', name: '仕上げ', type: 'sel', opts: FINISHES },
    { key: 'pattern', name: '模様', type: 'sel', opts: PATTERNS }, { key: 'pat', name: '模様の色', type: 'color' },
    { key: 'grip', name: 'グリップの色', type: 'color', when: d => d.spec.grip !== 'none' && d.spec.grip !== 'knurl' },
    { key: 'clip', name: 'クリップの色', type: 'color' }, { key: 'metal', name: '金具', type: 'sel', opts: METALS },
    { key: 'ink', name: 'インクの色', type: 'ink', when: d => d.spec.colors === 'c1' },
    { key: 'logo', name: 'ロゴの文字', type: 'text' }, { key: 'logoColor', name: '文字の色', type: 'color' }, { key: 'font', name: '字体', type: 'sel', opts: FONTS },
  ],
  fountain: [
    { key: 'body', name: '軸の色', type: 'color', when: d => !['wood'].includes(d.spec.body) }, { key: 'cap', name: 'キャップの色', type: 'color', when: d => d.spec.cap !== 'capless' },
    { key: 'finish', name: '仕上げ', type: 'sel', opts: FINISHES },
    { key: 'pattern', name: '模様', type: 'sel', opts: PATTERNS }, { key: 'pat', name: '模様の色', type: 'color' },
    { key: 'metal', name: '金具', type: 'sel', opts: METALS }, { key: 'nibTone', name: 'ペン先の色', type: 'sel', opts: { gold: '金', silver: '銀', two: 'ツートン' } },
    { key: 'ink', name: 'インクの色', type: 'ink' },
    { key: 'logo', name: 'ロゴの文字', type: 'text' }, { key: 'logoColor', name: '文字の色', type: 'color' }, { key: 'font', name: '字体', type: 'sel', opts: FONTS },
  ],
};
const DEF_LOOK = {
  pencil: { body: '#2f9e6e', finish: 'gloss', pattern: 'none', pat: '#f6c945', tip: '#f4f1ea', eraser: '#f7b6c8', metal: 'gold', logo: 'BUNGU HB', logoColor: '#d8b25a', font: 'goth' },
  eraser: { body: '#f4f1ea', sleeve: '#2b8fd6', pattern: 'stripe', pat: '#1d1d1f', finish: 'matte', logo: 'ERASER', logoColor: '#f4f1ea', font: 'goth' },
  lead: { body: '#1d1d1f', clear: 'smoke', cap: '#2b8fd6', label: '#f4f1ea', pattern: 'none', pat: '#2b8fd6', logo: 'LEAD', logoColor: '#1d1d1f', font: 'goth' },
  mech: { body: '#24438f', finish: 'gloss', pattern: 'none', pat: '#f4f1ea', grip: '#1d1d1f', woodTone: 'maple', metal: 'silver', clipColor: '#24438f', logo: 'SHARP 0.5', logoColor: '#f4f1ea', font: 'goth' },
  ball: { body: '#f4f1ea', finish: 'gloss', pattern: 'none', pat: '#2b8fd6', grip: '#2b8fd6', clip: '#2b8fd6', metal: 'silver', ink: '#1a1a1a', logo: 'SMOOTH', logoColor: '#24438f', font: 'goth' },
  fountain: { body: '#1d1d1f', cap: '#1d1d1f', finish: 'gloss', pattern: 'none', pat: '#d93b2f', metal: 'gold', nibTone: 'gold', ink: '#1f3fa8', logo: 'BUNGU', logoColor: '#d8b25a', font: 'mincho' },
};

// 研究：年から始められる。RP（研究ポイント）を払って、日数がたつと完了
const R_ = (id, name, cat, year, rp, days, o = {}) => Object.assign({ id, name, cat, year, rp, days }, o);
const RESEARCH = [
  R_('r_mech', 'シャープペンシルの基本', 'gen', 2000, 25, 14, { unlock: ['mech', 'lead'], desc: 'シャーペンとシャー芯を作れるようになる' }),
  R_('r_ball', 'ボールペンの基本', 'gen', 2000, 35, 18, { unlock: ['ball'], desc: 'ボールペンを作れるようになる' }),
  R_('r_fp', '万年筆の基本', 'gen', 2001, 80, 30, { unlock: ['fountain'], desc: '万年筆を作れるようになる（高いけれど、もうけも大きい）' }),
  R_('r_prod1', '生産のくふう Ⅰ', 'gen', 2001, 40, 14, { costCut: .05, desc: 'すべての製品の原価 −5%' }),
  R_('r_qa1', '品質チェックの手順', 'gen', 2002, 50, 16, { bugCut: .15, desc: '開発中の不具合 −15%' }),
  R_('r_svc', '名入れ・修理サービス', 'gen', 2001, 45, 16, { desc: 'ペンへの名入れや修理を受けつける（形のない生産物＝サービス）。ペンの売上の3%がサービスの売上に' }),
  R_('r_mk1', '文房具店とのつながり', 'gen', 2002, 60, 20, { sales: .05, desc: '売れる数 +5%' }),
  R_('r_des1', 'デザインの研究 Ⅰ', 'gen', 2003, 70, 20, { design: .5, desc: 'デザインの点 +0.5' }),
  R_('r_prod2', '生産のくふう Ⅱ', 'gen', 2006, 120, 25, { costCut: .05, req: 'r_prod1', desc: 'すべての製品の原価 −5%' }),
  R_('r_mk2', 'ネット通販', 'gen', 2008, 160, 30, { sales: .08, req: 'r_mk1', desc: '売れる数 +8%' }),
  R_('r_qa2', '自動検査機', 'gen', 2010, 200, 30, { bugCut: .2, req: 'r_qa1', desc: '開発中の不具合 −20%' }),
  R_('r_des2', 'デザインの研究 Ⅱ', 'gen', 2011, 220, 30, { design: .5, req: 'r_des1', desc: 'デザインの点 +0.5' }),
  R_('r_prod3', '生産のくふう Ⅲ', 'gen', 2012, 300, 40, { costCut: .05, req: 'r_prod2', desc: 'すべての製品の原価 −5%' }),
  R_('r_mk3', 'SNSの宣伝', 'gen', 2014, 260, 30, { adBoost: .25, req: 'r_mk2', desc: '広告の効果 +25%' }),
  // えんぴつ
  R_('r_pc1', 'なめらかな芯', 'pencil', 2000, 30, 12), R_('r_pw1', '香りのよい杉の軸', 'pencil', 2002, 40, 14), R_('r_ptri', '三角の軸', 'pencil', 2004, 45, 14),
  R_('r_pc2', '高密度の芯', 'pencil', 2006, 90, 20, { req: 'r_pc1' }), R_('r_pw2', '再生材の軸', 'pencil', 2008, 80, 18), R_('r_pc3', '折れにくい芯', 'pencil', 2012, 160, 26, { req: 'r_pc2' }),
  // 消しゴム
  R_('r_e1', 'よく消える樹脂', 'eraser', 2000, 25, 12), R_('r_scent', '香りつき消しゴム', 'eraser', 2002, 30, 12), R_('r_e4', '角がたくさんある形', 'eraser', 2003, 50, 16),
  R_('r_e6', '角が折れにくいケース', 'eraser', 2004, 45, 14), R_('r_e2', '消しくずがまとまる', 'eraser', 2005, 90, 20, { req: 'r_e1' }), R_('r_e5', 'ホルダー式の消しゴム', 'eraser', 2007, 90, 20),
  R_('r_e3', '軽い力で消える', 'eraser', 2013, 180, 28, { req: 'r_e2' }),
  // シャー芯
  R_('r_l07', '0.7mm の芯', 'lead', 2001, 30, 12, { req: 'r_mech' }), R_('r_l03', '0.3mm の芯', 'lead', 2002, 45, 16, { req: 'r_mech' }), R_('r_l1', '折れにくい芯', 'lead', 2003, 60, 18, { req: 'r_mech' }),
  R_('r_lc', 'スライド式ケース', 'lead', 2003, 40, 12, { req: 'r_mech' }), R_('r_l09', '0.9mm の芯', 'lead', 2004, 40, 12, { req: 'r_mech' }), R_('r_l2', '高強度ナノ芯', 'lead', 2009, 140, 24, { req: 'r_l1' }),
  R_('r_lc2', '1本ずつ出せるケース', 'lead', 2010, 110, 20, { req: 'r_lc' }), R_('r_l02', '0.2mm の芯', 'lead', 2014, 220, 30, { req: 'r_l03' }), R_('r_l3', 'なめらか高強度芯', 'lead', 2016, 260, 32, { req: 'r_l2' }),
  // シャーペン
  R_('r_g1', 'ラバーグリップ', 'mech', 2001, 40, 14, { req: 'r_mech', desc: 'シャーペン・ボールペンのラバーのグリップが使える' }), R_('r_tipd', '製図用の長いパイプ', 'mech', 2001, 35, 12, { req: 'r_mech' }), R_('r_m1', 'サイドノック', 'mech', 2002, 50, 16, { req: 'r_mech' }),
  R_('r_al', 'アルミの部品', 'mech', 2004, 70, 18, { req: 'r_mech', desc: 'シャーペンのアルミの軸・グリップ、ボールペンのアルミ軸が使える' }), R_('r_m2', '振って芯を出す', 'mech', 2005, 90, 20, { req: 'r_m1' }), R_('r_g2', 'シリコングリップ', 'mech', 2006, 90, 20, { req: 'r_g1', desc: 'やわらかいシリコンのグリップが使える（学生に人気）' }),
  R_('r_twe', '回して出る消しゴム', 'mech', 2006, 70, 16, { req: 'r_mech' }), R_('r_tip', 'ひっこむパイプ', 'mech', 2007, 110, 22, { req: 'r_tipd' }), R_('r_m3', '芯が回る機構', 'mech', 2008, 180, 30, { req: 'r_m2' }),
  R_('r_g3', '金属ローレット', 'mech', 2009, 120, 22, { req: 'r_al', desc: '金属のグリップに細かい／粗いローレット（すべり止めの刻み）をつけられる。製図をする人に人気' }), R_('r_m4', '芯が折れない機構', 'mech', 2010, 240, 34, { req: 'r_m3' }), R_('r_wood', '天然木の部品', 'mech', 2004, 100, 22, { desc: 'シャーペンの天然木の軸・グリップ、万年筆の木の軸が使える' }),
  R_('r_m5', '自動で芯が出る機構', 'mech', 2017, 380, 40, { req: 'r_m4' }),
  R_('r_hwin', '硬度表示窓', 'mech', 2001, 35, 12, { req: 'r_mech', desc: 'シャーペンに芯の濃さを示す窓をつけられる（位置も選べる）。製図をする人に人気' }),
  R_('r_sus', 'ステンレスの部品', 'mech', 2005, 80, 18, { req: 'r_mech', desc: 'シャーペンのステンレスの口金・グリップ・ノック・クリップ（ばね）が使える' }),
  R_('r_cushion', '芯クッション', 'mech', 2006, 90, 20, { req: 'r_mech', desc: '強く書くと芯が少し引っこんで折れにくくなる仕組み' }),
  R_('r_cog', '重心のおもり', 'mech', 2008, 110, 22, { req: 'r_brass', desc: '軸の中に真ちゅうのおもりを入れて、重心を下げたり上げたりできる' }),
  R_('r_clipret', 'クリップ連動のパイプ収納', 'mech', 2009, 160, 26, { req: 'r_tip', desc: 'クリップをはさむとパイプが引っこむ（胸ポケットに入れても安全）' }),
  R_('r_wood2', '強化木（積層）の部品', 'mech', 2010, 150, 26, { req: 'r_wood', desc: '樹脂をしみこませた積層の木。重みがあって、木目がきれい' }),
  R_('r_12', '十二角の軸', 'mech', 2014, 120, 22, { req: 'r_mech', desc: 'ころがりにくく、手になじむ十二角形の軸' }),
  // ボールペン
  R_('r_gel', 'ゲルインク', 'ball', 2000, 40, 16, { req: 'r_ball' }), R_('r_b05', '0.5mm のボール', 'ball', 2001, 35, 12, { req: 'r_ball' }), R_('r_mc', '2色・3色ボールペン', 'ball', 2002, 60, 18, { req: 'r_ball' }),
  R_('r_mc4', '4色ボールペン', 'ball', 2004, 90, 20, { req: 'r_mc' }), R_('r_tw', '回転式', 'ball', 2005, 70, 16, { req: 'r_ball' }), R_('r_lv', '低粘度油性インク', 'ball', 2006, 160, 28, { req: 'r_ball' }),
  R_('r_fr', '消せるインク', 'ball', 2007, 200, 32, { req: 'r_gel' }), R_('r_b038', '0.38mm のボール', 'ball', 2008, 120, 22, { req: 'r_b05' }), R_('r_brass', '真ちゅうの部品', 'gen', 2003, 90, 20, { desc: 'シャーペンの真ちゅうの口金・グリップ・軸、ボールペンの真ちゅう軸が使える（重くて高級）' }),
  R_('r_mf', '多機能ペン', 'ball', 2009, 160, 26, { req: 'r_mc4' }), R_('r_qd', '速乾ゲルインク', 'ball', 2012, 220, 30, { req: 'r_gel' }), R_('r_b028', '0.28mm のボール', 'ball', 2014, 200, 30, { req: 'r_b038' }),
  R_('r_pg', 'にじまない顔料ゲル', 'ball', 2017, 300, 34, { req: 'r_qd' }),
  // 万年筆
  R_('r_14k', '14金のペン先', 'fountain', 2001, 90, 24, { req: 'r_fp' }), R_('r_fpm', '金属の軸', 'fountain', 2002, 60, 16, { req: 'r_fp' }), R_('r_conv', '両用式（コンバーター）', 'fountain', 2003, 80, 20, { req: 'r_fp' }),
  R_('r_18k', '18金のペン先', 'fountain', 2006, 180, 30, { req: 'r_14k' }), R_('r_piston', '吸入式', 'fountain', 2009, 200, 32, { req: 'r_conv' }), R_('r_ebo', 'エボナイトの軸', 'fountain', 2010, 180, 28, { req: 'r_fp' }),
  R_('r_mus', '筆のような字幅', 'fountain', 2010, 150, 26, { req: 'r_fp' }), R_('r_21k', '21金のペン先', 'fountain', 2012, 260, 36, { req: 'r_18k' }), R_('r_urushi', '漆塗りの軸', 'fountain', 2014, 320, 38, { req: 'r_ebo' }),
  R_('r_capless', 'キャップレス万年筆', 'fountain', 2015, 360, 40, { req: 'r_fp' }), R_('r_soft', 'やわらかい21金', 'fountain', 2018, 420, 42, { req: 'r_21k' }),
];
const RES_BY_ID = Object.fromEntries(RESEARCH.map(r => [r.id, r]));
// 研究の説明（性能の選択肢を開く研究は、開くものの名前から作る）
for (const r of RESEARCH) {
  if (r.desc) continue;
  const opens = [];
  for (const k of KIND_IDS) for (const g of SPECS[k]) for (const o of g.opts) if (o.req === r.id && !opens.includes(KINDS[k].short + '：' + o.name)) opens.push(KINDS[k].short + '：' + o.name);
  r.desc = opens.length ? opens.join('、') + ' が使えるようになる' : '';
}
const RES_CATS = { gen: '会社', pencil: 'えんぴつ', eraser: '消しゴム', lead: 'シャー芯', mech: 'シャーペン', ball: 'ボールペン', fountain: '万年筆' };

// スタッフ：役わりごとの働き（レベル1〜5）と月給
const ROLES = {
  res: { name: '研究員', desc: '研究ポイント（RP）を作る', rate: [0.5, 0.75, 1.05, 1.45, 1.9], sal: [220000, 320000, 460000, 650000, 900000], shirt: '#f4f4f0' },
  qa:  { name: '品質チェック', desc: '開発中の不具合を直す', rate: [0.35, 0.55, 0.8, 1.1, 1.45], sal: [200000, 290000, 420000, 600000, 820000], shirt: '#3d7fd0' },
  des: { name: 'デザイナー', desc: 'デザインの点が上がる・開発が少し速くなる', rate: [0.25, 0.4, 0.6, 0.8, 1.0], sal: [240000, 340000, 480000, 680000, 940000], shirt: '#f0902a' },
  sal: { name: '営業', desc: '売れる数が増える', rate: [0.04, 0.06, 0.085, 0.11, 0.14], sal: [230000, 330000, 470000, 660000, 920000], shirt: '#5b5e66' },
};
const FAMILY = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '清水', '森', '池田', '橋本', '石川', '前田', '藤田', '岡田', '長谷川', '村上', '近藤', '坂本', '遠藤'];
const GIVEN = ['ゆうと', 'はると', 'そうた', 'れん', 'あおい', 'ひなた', 'さくら', 'ゆい', 'みお', 'りこ', 'はな', 'めい', 'けんた', 'だいき', 'なつみ', 'ことね', 'しおり', 'あやの', 'たくみ', 'こうき', 'まなみ', 'しゅん', 'かえで', 'つばさ', 'ひかり', 'ゆうか', 'りょう', 'あかり', 'そら', 'いつき'];

// 事務所：机の数（＝雇える人数）・同時に開発できる数・家賃・設備の上限・引っ越しの条件
const OFFICES = [
  { name: '自宅の作業部屋', desks: 2, slots: 1, rent: 0, maxEq: 1, w: 7, d: 5.5, cost: 0 },
  { name: '小さな事務所', desks: 6, slots: 2, rent: 400000, maxEq: 2, w: 11, d: 8, cost: 15000000, need: { launched: 3, sales: 30000000 } },
  { name: '文具ビル', desks: 12, slots: 3, rent: 3000000, maxEq: 3, w: 15, d: 10, cost: 200000000, need: { launched: 9, sales: 1000000000 } },
  { name: '本社タワー', desks: 24, slots: 4, rent: 15000000, maxEq: 3, w: 20, d: 13, cost: 2000000000, need: { launched: 18, sales: 12000000000 } },
];
// 設備：レベルごとの値段。効果は sim の EFF で計算する
const EQUIP = {
  chair:   { name: 'いい椅子', desc: 'みんなの仕事が速くなる（+5%／Lv）', price: [400000, 1200000, 3500000] },
  monitor: { name: '2台目のモニター', desc: '研究と品質チェックが速くなる（+6%／Lv）', price: [600000, 1800000, 5000000] },
  lab:     { name: '試作ラボ', desc: '開発中の不具合が減る（−12%／Lv）', price: [2000000, 8000000, 25000000] },
  line:    { name: '生産ライン', desc: '1週間に作れる数が増える', price: [0, 3000000, 12000000, 45000000, 150000000, 500000000], lv0: 1, maxBy: [2, 3, 5, 6] },
};
const LINE_CAP = [0, 26000, 60000, 140000, 320000, 700000, 1500000];   // 1週間に作れる手間（えんぴつ1本＝1）

// 家具：床のマス（0.5m）に置く。r の中の机の人が速くなる（work＝みんな、res/qa/des/sal＝その役わり）。global は部屋全体
const FURN = {
  plant:      { name: '観葉植物', price: 30000, w: 1, d: 1, r: 2.5, eff: { work: 0.03 }, tier: 0, desc: 'まわり2.5mの人の仕事 +3%' },
  lamp:       { name: 'スタンド照明', price: 60000, w: 1, d: 1, r: 2, eff: { qa: 0.06 }, tier: 0, desc: 'まわり2mの品質チェック +6%' },
  whiteboard: { name: 'ホワイトボード', price: 200000, w: 3, d: 1, r: 3.5, eff: { res: 0.06 }, tier: 0, meet: 1, desc: 'まわり3.5mの研究 +6%。打ち合わせの場所になる' },
  bookshelf:  { name: '資料の本棚', price: 180000, w: 3, d: 1, r: 3, eff: { res: 0.04, des: 0.04 }, tier: 0, look: 1, desc: 'まわり3mの研究とデザイン +4%' },
  coffee:     { name: 'コーヒーマシン', price: 250000, w: 2, d: 1, global: 0.04, max: 2, tier: 0, brk: 'coffee', desc: '部屋のみんな +4%（2台まで）。休けいの場所' },
  bigplant:   { name: '大きな観葉植物', price: 120000, w: 2, d: 2, r: 3.5, eff: { work: 0.05 }, tier: 1, desc: 'まわり3.5mの人の仕事 +5%' },
  sofa:       { name: 'ソファ', price: 300000, w: 4, d: 2, global: 0.03, max: 3, tier: 1, brk: 'sofa', desc: '部屋のみんな +3%（3台まで）。休けいの場所' },
  mood:       { name: 'アイデアの壁', price: 350000, w: 3, d: 1, r: 3.5, eff: { des: 0.08 }, tier: 1, meet: 1, desc: 'まわり3.5mのデザイン +8%' },
  aquarium:   { name: '水そう', price: 500000, w: 3, d: 2, r: 4, eff: { work: 0.05 }, tier: 1, look: 1, desc: 'まわり4mの人の仕事 +5%' },
  vending:    { name: '自動販売機', price: 400000, w: 2, d: 2, global: 0.03, max: 1, tier: 2, brk: 'coffee', desc: '部屋のみんな +3%（1台まで）' },
  phone:      { name: '営業の電話ブース', price: 600000, w: 2, d: 2, r: 4, eff: { sal: 0.1 }, tier: 2, desc: 'まわり4mの営業 +10%' },
  piano:      { name: 'ピアノ', price: 2500000, w: 4, d: 3, r: 5, eff: { work: 0.04, des: 0.05 }, tier: 3, look: 1, desc: 'まわり5mの人の仕事 +4%・デザイン +5%' },
};
const FURN_MAX = [5, 12, 20, 32];   // 事務所ごとの家具の数の上限

// 社員の特技（とくぎ）
const TRAITS = {
  idea:    { name: 'ひらめき', desc: '研究ポイント +15%', role: 'res', mul: 0.15 },
  careful: { name: '几帳面', desc: '不具合を直す速さ +15%', role: 'qa', mul: 0.15 },
  sense:   { name: 'センス', desc: 'デザインの力 +20%', role: 'des', mul: 0.2 },
  talk:    { name: '話し上手', desc: '営業の力 +20%', role: 'sal', mul: 0.2 },
  early:   { name: '早起き', desc: '仕事 +6%', all: 0.06 },
  coffee:  { name: 'コーヒー好き', desc: 'コーヒーマシン・自販機の効果が2倍', likes: 'coffee' },
  green:   { name: '植物好き', desc: '観葉植物の効果が2倍', likes: 'plant' },
  fast:    { name: 'のみこみが早い', desc: '昇格が早い（経験 +50%）', xp: 0.5 },
};
const LEVEL_XP = [0, 90, 240, 480, 840];   // 次のレベルまでの経験（働いた日数のめやす）

// 開発中に見つかる不具合（試作テスト）
const DEFECTS = {
  pencil: ['芯が折れやすい', '塗装がはげる', '削るとささくれる', '芯がまん中にない', '消しゴムが外れる', '軸がそっている'],
  eraser: ['消しくずが多い', 'ケースが破れる', '紙がよれる', '黒くよごれる', 'かたすぎる', '角がすぐ欠ける'],
  lead:   ['芯が折れやすい', '濃さがばらつく', 'ケースが開きにくい', '芯が太さどおりでない', '書くとこすれる'],
  mech:   ['芯づまり', 'ノックが重い', 'クリップがゆるい', 'グリップがべたつく', '口金がゆるむ', '芯が出すぎる', '消しゴムが落ちる'],
  ball:   ['インク漏れ', '書き出しがかすれる', 'インクのボテが出る', 'ノックが戻らない', 'キャップがきつい', 'インクがにじむ'],
  fountain: ['インク漏れ', '書き出しがかすれる', 'ペン先が引っかかる', 'キャップがゆるい', 'インクが出すぎる', '首がゆるむ'],
};
const TESTS = ['落下テスト', '書き味テスト', '耐久テスト', '温度テスト', '見た目チェック'];

// 広告：最初の数週間の売れゆきが上がる
const ADS = [
  { id: 'none', name: 'なし', cost: 0, boost: 0, brand: 0 },
  { id: 'flyer', name: 'お店のチラシ', cost: 300000, boost: .4, brand: .01 },
  { id: 'mag', name: '雑誌の広告', cost: 2000000, boost: .8, brand: .03 },
  { id: 'tv', name: 'テレビCM', cost: 15000000, boost: 1.5, brand: .07 },
  { id: 'event', name: '新作発表会', cost: 60000000, boost: 2.5, brand: .12 },
];
// 売る地域
const MARKETS = [
  { id: 'jp', name: '国内', mult: 1, cost: 0 },
  { id: 'asia', name: 'アジア', mult: 1.6, cost: 60000000, need: { launched: 6 } },
  { id: 'world', name: '世界', mult: 3.2, cost: 600000000, need: { launched: 12 }, req: 'asia' },
];
// 季節：月ごと（1月〜12月）の売れゆき。学生は新学期と受験、社会人は4月と年末の贈り物
const SEASON = {
  stu: [1.3, 1.35, 1.65, 1.75, 1.0, 0.9, 0.8, 0.72, 1.1, 1.0, 0.98, 0.95],
  adu: [1.0, 0.95, 1.1, 1.3, 1.0, 0.95, 0.95, 0.9, 1.0, 1.0, 1.05, 1.35],
  pro: [1, 1, 1.05, 1.1, 1, 1, 1, 1, 1, 1, 1, 1.05],
};
// 流行の色（見た目の点が上がり、少し売れやすくなる）
const TRENDS = {
  pastel: 'パステルカラー', dusty: 'くすみカラー', black: '黒い軸', clear: '透明の軸', metal: 'メタリック', natural: '木の風合い', vivid: 'あざやかな色', white: '白い軸',
};
// ライバル会社（架空）：強い種類とブランドの強さ
const RIVALS = [
  { id: 'hoshino', name: 'ホシノ文具', brand: 1.3, w: { pencil: 1.3, eraser: 1.2, lead: 1.1, mech: .9, ball: .8, fountain: .3 }, value: 900000000, color: '#d84a3a' },
  { id: 'aoba', name: 'アオバ筆記', brand: 1.35, w: { pencil: .6, eraser: .7, lead: 1.2, mech: 1.3, ball: 1.3, fountain: .6 }, value: 1500000000, color: '#2f8a4e' },
  { id: 'kamome', name: 'カモメ工業', brand: 1.15, w: { pencil: 1, eraser: 1, lead: 1, mech: 1, ball: 1.1, fountain: .5 }, value: 700000000, color: '#2d6fc4' },
  { id: 'hibari', name: 'ヒバリ堂', brand: 1.25, w: { pencil: .4, eraser: .3, lead: .3, mech: .5, ball: .6, fountain: 1.6 }, value: 1100000000, color: '#8a5a2b' },
];
// 目標（ごほうびつき）。上から順に1つずつ出る
const GOALS = [
  { id: 'g1', text: 'さいしょの文房具を発売しよう', reward: { money: 500000, rp: 10 }, done: s => s.stats.launched >= 1, hint: '「開発」から、えんぴつか消しゴムを作ろう' },
  { id: 'g2', text: '研究員をやとおう', reward: { money: 300000, rp: 15 }, done: s => s.staff.some(m => m.role === 'res'), hint: '「スタッフ」の「採用」から' },
  { id: 'g3', text: '研究をひとつ終わらせよう', reward: { money: 500000, rp: 10 }, done: s => s.research.done.length >= 1, hint: '「研究」から。シャーペンやボールペンも研究で作れるようになる' },
  { id: 'g4', text: '3種類の文房具を発売しよう', reward: { money: 1500000, rp: 20 }, done: s => new Set(s.products.map(p => p.kind)).size >= 3 },
  { id: 'g5', text: '売上の合計 1,000万円', reward: { money: 2000000, rp: 20 }, done: s => s.stats.sales >= 10000000 },
  { id: 'g6', text: '小さな事務所へ引っ越そう', reward: { money: 3000000, rp: 30 }, done: s => s.tier >= 1, hint: '「事務所」から。発売3つ・売上2,000万円が条件' },
  { id: 'g7', text: 'レビューで 8.0 点以上をとろう', reward: { money: 5000000, rp: 40 }, done: s => s.stats.best >= 8 },
  { id: 'g8', text: '6種類すべてを発売しよう', reward: { money: 10000000, rp: 60 }, done: s => new Set(s.products.map(p => p.kind)).size >= 6 },
  { id: 'g9', text: 'アジアに進出しよう', reward: { money: 10000000, rp: 60 }, done: s => s.markets.includes('asia'), hint: '「会社」の「売る地域」から' },
  { id: 'g10', text: '文具ビルへ引っ越そう', reward: { money: 30000000, rp: 100 }, done: s => s.tier >= 2 },
  { id: 'g11', text: 'どれかの種類でシェア1位になろう', reward: { money: 50000000, rp: 120 }, done: s => s.stats.top1 },
  { id: 'g12', text: 'ライバル会社を買収しよう', reward: { money: 80000000, rp: 150 }, done: s => s.rivals.some(r => r.owned) },
  { id: 'g13', text: '世界に進出しよう', reward: { money: 100000000, rp: 200 }, done: s => s.markets.includes('world') },
  { id: 'g14', text: '本社タワーへ引っ越そう', reward: { money: 200000000, rp: 300 }, done: s => s.tier >= 3 },
  { id: 'g15', text: '会社の価値 1,000億円', reward: { money: 0, rp: 500 }, done: s => s.stats.value >= 1e11 },
];
