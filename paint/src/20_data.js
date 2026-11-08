
// ================= データ：チームの色・ブキ・サブ・スペシャル（すべてこのゲームのオリジナル） =================
const PALETTES = [
  ['#ff2d87', '#1fd1ff'], ['#ffb300', '#7b4dff'], ['#3fe05c', '#ff3fc8'], ['#ff6a1a', '#2a72ff'], ['#d8ff1f', '#a12bff'], ['#ff4040', '#20e0b0'], ['#ff9cd0', '#36c7a0']
];
// ブキの種類（このゲームでの呼び名）。ペンキ屋さんとお掃除の道具がテーマ
const CLASSES = {
  gun:     { name: 'ガン',       desc: '押している間、連続でペンキを撃つ。いちばん基本の形。' },
  cannon:  { name: 'キャノン',   desc: '弾が飛んだ先で破裂する。直撃なら大ダメージ、まわりにも爆風。' },
  roller:  { name: 'ローラー',   desc: 'おしたまま進むと太い道をぬり、ぶつかった相手をおしつぶす。ひと振りでペンキを飛ばす。' },
  brush:   { name: 'ハケ・モップ', desc: 'ローラーより細いが、とても速く走れる。小刻みに振ってまく。' },
  sniper:  { name: 'スナイパー', desc: 'ためて放つ一直線の弾。ためきると遠くの相手を一撃。' },
  bucket:  { name: 'バケツ',     desc: '山なりにペンキをぶちまける。段差の向こうにも届く。' },
  gatling: { name: 'ガトリング', desc: '回してためると、ためた分だけ弾の雨を降らせる。' },
  dual:    { name: '二丁拳銃',   desc: '両手で撃つ。撃ちながら「もぐる」で横へすべってよける。' },
  parasol: { name: 'パラソル',   desc: '散弾を撃ちつつ、カサで正面の弾をふせぐ。' },
  bow:     { name: 'ボウ',       desc: 'ためて放つと、何本もの矢が扇のように飛ぶ。ためるほど強い。' },
  blade:   { name: 'ブレード',   desc: '振ると横に広がる刃のペンキ。ためると遠くまで飛ぶ一撃。' },
  hose:    { name: 'ホース',     desc: '押している間、ペンキの水流を出し続ける。ねらった線をそのままぬれる。' }
};
const CLASS_ORDER = Object.keys(CLASSES);

const SUBS = {
  bomb:     { name: 'ペイント爆弾', ink: 65, desc: '投げて少しすると破裂する。' },
  sticky:   { name: 'ひっつき爆弾', ink: 70, desc: 'ふれた所にくっつき、大きく破裂する。' },
  slide:    { name: 'すべる爆弾',   ink: 60, desc: '床をすべりながらぬり、最後に破裂。' },
  balloon:  { name: '水風船',       ink: 40, desc: 'どこかに当たったとたんに割れる。すばやい牽制に。' },
  popper:   { name: 'かんしゃく玉', ink: 50, desc: '落ちると3つに分かれてはね回り、パンパン破裂。' },
  boomer:   { name: 'ペンキブーメラン', ink: 45, desc: '弧をえがいて飛び、手もとにもどってくる。通った所をぬる。' },
  windup:   { name: 'ゼンマイ爆弾', ink: 65, desc: '着地すると近くの相手へ歩いていき、そばで破裂。' },
  fountain: { name: 'まわる噴水',   ink: 55, desc: '置いた所でまわりにペンキをまき続ける。' },
  shield:   { name: 'ペンキの盾',   ink: 60, desc: '目の前に盾を立て、相手の弾をふせぐ。' },
  mine:     { name: '仕掛け爆弾',   ink: 55, desc: '足もとに仕掛け、近づいた相手で破裂する。' },
  spring:   { name: 'ジャンプ台',   ink: 50, desc: '置くと、ふんだ味方を高くはね上げる。' },
  dart:     { name: 'マーカーダーツ', ink: 45, desc: '当たった所の近くにいる相手に、しばらく目印をつける。' },
  fog:      { name: 'ねばねば霧',   ink: 55, desc: '霧の中の相手は動きがおそくなり、ペンキも回復しない。' }
};
const SPECIALS = {
  beam:      { name: 'メガ噴射',       cost: 190, desc: '太いペンキの光線を数秒間はなつ。相手をつらぬく。' },
  rain:      { name: 'ペンキの雨雲',   cost: 170, desc: 'ねらった所に雲を飛ばし、しばらくペンキの雨。' },
  slam:      { name: 'ジャンプスタンプ', cost: 180, desc: '高くとび上がって、着地の衝撃でまわりを一気にぬる。' },
  barrier:   { name: 'バリアドーム',   cost: 180, desc: '少しの間、中にいる味方を守るドームを張る。' },
  missile:   { name: '追尾ミサイル',   cost: 200, desc: '相手めがけてミサイルが降る。' },
  armor:     { name: 'チームアーマー', cost: 190, desc: '近くの味方に、ダメージを少し防ぐよろいをつける。' },
  tornado:   { name: 'ペンキ竜巻',     cost: 190, desc: 'ねらった方へ進む竜巻。まきこんだ所をぬり、相手をけずる。' },
  airdrop:   { name: 'ペンキ投下',     cost: 200, desc: 'ねらった線の上に、空から大きなペンキ爆弾を3つ落とす。' },
  tower:     { name: '噴水タワー',     cost: 170, desc: '大きな噴水を立てて、まわりに何秒もペンキをまく。' },
  dash:      { name: 'スーパーダッシュ', cost: 170, desc: 'しばらく足が速くなり、ペンキが減らず、通った所をぬる。' },
  ring:      { name: '衝撃リング',     cost: 180, desc: '自分を中心に広がるペンキの輪。ふれた相手にダメージ。' },
  turret:    { name: '自動ペンキ砲台', cost: 190, desc: '近くの相手をねらって自動で撃ち続ける砲台を置く。' },
  fireworks: { name: 'ペンキ花火',     cost: 180, desc: '空に花火を打ち上げ、あたり一面にペンキの雨を降らせる。' },
  cloak:     { name: 'とうめいマント', cost: 170, desc: 'しばらく相手から見えなくなる。撃つと少し見える。' }
};

// 数値の意味（共通）：spd 移動の速さ、ink 1回のペンキ（タンク100）、dmg ダメージ（体力100）、range 射程(m)、pr ぬる半径(m)
const W = (id, name, cls, sub, sp, p) => Object.assign({ id, name, cls, sub, sp, spd: 1 }, p);
const WEAPONS = [
  // ---- ガン（14） ----
  W('mist', 'ハチドリ', 'gun', 'fountain', 'rain', { look: [0x2fbf71, 0xb04aff], rate: 14, dmg: 20, range: 7, spread: 13, ink: .55, pr: .85, v: 24, spd: 1.08, model: 'can', desc: '射程は短いが、広く速くぬれる。' }),
  W('short', 'スズメ', 'gun', 'bomb', 'slam', { look: [0x9a6a44, 0xf2e2c4], rate: 12, dmg: 26, range: 9, spread: 10, ink: .6, pr: .62, v: 26, spd: 1.06, desc: '連射が速く、近くの相手に強い。' }),
  W('basic', 'ツバメ', 'gun', 'bomb', 'beam', { look: [0x24335a, 0xf4f4f4], rate: 8, dmg: 35, range: 13, spread: 6, ink: .9, pr: .7, v: 30, desc: '何でもこなせる標準のガン。' }),
  W('pro', 'ハヤブサ', 'gun', 'mine', 'missile', { look: [0x6a7280, 0xffc93a], rate: 7.5, dmg: 35, range: 14.5, spread: 2.5, ink: 1.0, pr: .62, v: 32, desc: 'ぶれが小さく、ねらった所にまっすぐ飛ぶ。' }),
  W('rapid', 'ムクドリ', 'gun', 'slide', 'armor', { look: [0x2e2a33, 0xff8a3a], rate: 10, dmg: 30, range: 11, spread: 8, ink: .75, pr: .65, v: 28, desc: '速い連射で押しこむ。' }),
  W('heavy', 'オオワシ', 'gun', 'sticky', 'barrier', { look: [0x6b4a2e, 0xf6f2e8], rate: 5, dmg: 52, range: 15, spread: 4, ink: 1.6, pr: .82, v: 30, spd: .95, desc: '重い一発。2発で相手をたおせる。' }),
  W('long', 'コンドル', 'gun', 'shield', 'airdrop', { look: [0x1e1e24, 0xe8e8e8], rate: 4.2, dmg: 40, range: 21, spread: 2, ink: 1.9, pr: .75, v: 36, spd: .94, desc: '遠くまで届くが、連射はおそい。' }),
  W('burst', 'キツツキ', 'gun', 'dart', 'rain', { look: [0x222226, 0xe8303a], rate: 3, burst: 3, dmg: 33, range: 15, spread: 2.5, ink: 2.6, pr: .7, v: 34, desc: '3発ずつまとめて撃つ。' }),
  W('duo', 'フクロウ', 'gun', 'balloon', 'turret', { look: [0x8a6a4a, 0xffd23f], rate: 3.6, burst: 2, dmg: 38, range: 17, spread: 2, ink: 2.2, pr: .7, v: 35, desc: '2発ずつ撃つ、射程の長い連発。' }),
  W('motor', 'ヒバリ', 'gun', 'popper', 'dash', { look: [0xc8a878, 0x8a4a2a], rate: 13, ramp: .9, dmg: 29, range: 13, spread: 7, ink: .8, pr: .66, v: 30, desc: '撃ち続けるほど連射が速くなる。' }),
  W('airbrush', 'シラサギ', 'gun', 'boomer', 'cloak', { look: [0xf2f2ee, 0xf0b020], rate: 18, dmg: 13, range: 16, spread: 1.5, ink: .35, pr: .42, v: 40, trail: .5, model: 'airbrush', desc: '細い線を遠くまで。ペンキがとても長持ち。' }),
  W('squirt', 'カワセミ', 'gun', 'spring', 'fireworks', { look: [0x1fa0c8, 0xff8a3a], rate: 6, dmg: 30, range: 12, spread: 5, ink: .55, pr: .7, v: 28, bounce: 1, desc: '弾が一度はねてから広がる。' }),
  W('ext', 'ペリカン', 'gun', 'fog', 'ring', { look: [0xd83a32, 0xffb43a], rate: 16, cone: 2, dmg: 11, range: 6, spread: 26, ink: .5, pr: .7, v: 18, knock: .6, model: 'ext', desc: '近くを霧のようにぬりつぶし、相手を少し押し返す。' }),
  W('jumper', 'カモメ', 'gun', 'windup', 'tornado', { look: [0xdfe4ea, 0xffc12e], rate: 7, dmg: 34, range: 13, spread: 7, ink: .9, pr: .66, v: 31, air: true, desc: 'ジャンプ中はぶれがなくなり、ダメージも上がる。' }),
  // ---- キャノン（8） ----
  W('cannon', 'メロン', 'cannon', 'shield', 'slam', { look: [0x3a4a3a, 0x8ad06a], rate: 1.1, dmg: 125, sdmg: 70, er: 2.3, range: 11, ink: 9, pr: 1.6, v: 20, spd: .95, desc: '直撃で一撃。破裂でまわりもまきこむ。' }),
  W('minic', 'ミカン', 'cannon', 'mine', 'armor', { look: [0x4a4a52, 0xff9a2a], rate: 1.7, dmg: 100, sdmg: 50, er: 1.8, range: 9, ink: 7, pr: 1.3, v: 21, desc: '小さくて速いキャノン。' }),
  W('longc', 'ヘチマ', 'cannon', 'sticky', 'missile', { look: [0x3a5a2a, 0xa8d46a], rate: .8, dmg: 125, sdmg: 60, er: 2.5, range: 15, ink: 11, pr: 1.6, v: 22, spd: .92, desc: '遠くで破裂する長いキャノン。' }),
  W('rapidc', 'サクランボ', 'cannon', 'slide', 'rain', { look: [0x3a3a44, 0xe0263a], rate: 1.6, dmg: 85, sdmg: 45, er: 2.0, range: 13, ink: 8, pr: 1.3, v: 24, desc: '破裂はひかえめだが、テンポよく撃てる。' }),
  W('pompom', 'ココナッツ', 'cannon', 'balloon', 'tower', { look: [0x5a4030, 0xf4ecd8], rate: 1.2, dmg: 100, sdmg: 70, er: 2.2, range: 12, ink: 9, pr: 1.6, v: 15, pom: true, desc: '山なりの弾が一度はねてから破裂する。' }),
  W('mega', 'カボチャ', 'cannon', 'fog', 'barrier', { look: [0x3a3040, 0xff8a1a], rate: .55, dmg: 150, sdmg: 100, er: 3.3, range: 10, ink: 16, pr: 2.4, v: 16, spd: .86, desc: '大きな弾と大きな破裂。とても重い。' }),
  W('tri', 'サンショクダンゴ', 'cannon', 'dart', 'fireworks', { look: [0x8a6040, 0xffb0c8], rate: .9, dmg: 80, sdmg: 45, er: 1.7, range: 11, ink: 12, pr: 1.2, v: 21, triple: true, desc: '3発を横に広げて撃つ。' }),
  W('cluster', 'ザクロ', 'cannon', 'popper', 'airdrop', { look: [0x3a2a30, 0xc8203a], rate: .9, dmg: 90, sdmg: 40, er: 1.5, range: 14, ink: 12, pr: 1.0, v: 22, cluster: 4, desc: '飛んだ先で4つの小さな爆弾に分かれる。' }),
  // ---- ローラー（8） ----
  W('roller', 'アルマジロ', 'roller', 'sticky', 'barrier', { look: [0x8a7a68, 0xc8b8a0], width: 2.2, rollSpd: 1.05, rollInk: 3.2, flick: 8, fdmg: 120, frange: 9, fspread: 34, frate: 1.4, ink: 9, desc: '道を太くぬり、近づいた相手をおしつぶす。' }),
  W('wide', 'カバ', 'roller', 'shield', 'slam', { look: [0x7a6a8a, 0xf0a0b0], width: 3.2, rollSpd: .9, rollInk: 4, flick: 10, fdmg: 110, frange: 8, fspread: 50, frate: 1.1, ink: 11, spd: .92, desc: 'とても太い道をぬれる大型ローラー。' }),
  W('mini', 'ダンゴムシ', 'roller', 'bomb', 'armor', { look: [0x4a4a54, 0x8a8a96], width: 1.6, rollSpd: 1.25, rollInk: 2.4, flick: 6, fdmg: 100, frange: 7, fspread: 28, frate: 2, ink: 6, spd: 1.08, desc: '軽くて速い。すばやく走ってぬる。' }),
  W('vert', 'キリン', 'roller', 'slide', 'missile', { look: [0xf2c040, 0x8a5a2a], width: 2, rollSpd: 1, rollInk: 3.4, flick: 7, fdmg: 125, frange: 14, fspread: 6, vflick: true, frate: 1.2, ink: 10, desc: 'たてに振ると、遠くまでまっすぐ届く。' }),
  W('weight', 'サイ', 'roller', 'mine', 'ring', { look: [0x8a8e96, 0xe8e4dc], width: 2.8, rollSpd: .8, rollInk: 3.6, flick: 9, fdmg: 150, frange: 8, fspread: 40, frate: .9, ink: 12, spd: .88, rollDmg: 200, desc: '重くておそいが、振りもころがしも強力。' }),
  W('turbo', 'チーター', 'roller', 'spring', 'dash', { look: [0xf0b040, 0x222222], width: 1.9, rollSpd: 1.0, turbo: true, rollInk: 3, flick: 7, fdmg: 110, frange: 8, fspread: 32, frate: 1.5, ink: 8, desc: 'ころがし続けると、どんどん速くなる。' }),
  W('hopper', 'カンガルー', 'roller', 'balloon', 'tornado', { look: [0xb07848, 0xf2dcc0], width: 2, rollSpd: 1, rollInk: 3.2, flick: 8, fdmg: 115, frange: 9, fspread: 30, frate: 1.4, ink: 9, airFlick: true, desc: 'ジャンプ中に振ると、たて振りで遠くへ届く。' }),
  W('sponge', 'ヒツジ', 'roller', 'fountain', 'tower', { look: [0xf4f2ea, 0x3a3a3a], width: 2.4, rollSpd: 1.1, rollInk: 1.8, flick: 8, fdmg: 80, frange: 8, fspread: 38, frate: 1.8, ink: 5, rollDmg: 80, desc: 'ペンキが長持ちする軽いローラー。力は弱め。' }),
  // ---- ハケ・モップ（7） ----
  W('brush', 'イタチ', 'brush', 'mine', 'slam', { look: [0x9a6a3a, 0xf2e6d0], width: 1.25, rollSpd: 1.55, rollInk: 1.6, flick: 4, fdmg: 34, frange: 5.5, fspread: 30, frate: 5, ink: 2.2, spd: 1.08, desc: '走りながらぬれる。小刻みに振って近くの相手に。' }),
  W('bigbrush', 'ヤギ', 'brush', 'fountain', 'beam', { look: [0xece6da, 0x8a6a4a], width: 1.8, rollSpd: 1.35, rollInk: 2.2, flick: 5, fdmg: 40, frange: 6.5, fspread: 34, frate: 3.4, ink: 3, desc: '少し太いハケ。ふり幅も広い。' }),
  W('mop', 'ウマ', 'brush', 'slide', 'ring', { look: [0x7a4a2a, 0xe8d8b8], width: 2.2, rollSpd: 1.2, rollInk: 2.4, flick: 7, fdmg: 45, frange: 7, fspread: 8, frate: 2.2, ink: 4, wave: true, model: 'mop', desc: '振ると床をはうペンキの波。広くぬれる。' }),
  W('deck', 'イノシシ', 'brush', 'dart', 'dash', { look: [0x5a4232, 0x2a2420], width: 1.4, rollSpd: 1.45, rollInk: 1.8, flick: 4, fdmg: 30, frange: 5.5, fspread: 26, frate: 6.5, ink: 2, model: 'deck', desc: 'とても速く振れる。近くの相手を連打で。' }),
  W('broom', 'タヌキ', 'brush', 'popper', 'fireworks', { look: [0x8a6a4a, 0x2a2420], width: 1.6, rollSpd: 1.3, rollInk: 2, flick: 9, fdmg: 26, frange: 8, fspread: 44, frate: 2.6, ink: 3.5, model: 'broom', desc: 'たくさんの小さなしぶきを広くはき出す。' }),
  W('fude', 'リス', 'brush', 'boomer', 'cloak', { look: [0x5aa04a, 0xc87a3a], width: .9, rollSpd: 1.4, rollInk: 1, flick: 3, fdmg: 60, frange: 10, fspread: 4, frate: 2.5, ink: 3, vflick: true, model: 'fude', desc: '細くて長い線。たてに振ると遠くまで。' }),
  W('tawashi', 'ハリネズミ', 'brush', 'windup', 'turret', { look: [0x8a6a4a, 0xd8c8b0], width: .9, rollSpd: 1.75, rollInk: 1.3, flick: 3, fdmg: 28, frange: 4.5, fspread: 30, frate: 7, ink: 1.6, spd: 1.12, desc: 'いちばん速く走れる、小さなハケ。' }),
  // ---- スナイパー（8） ----
  W('sniper', 'シリウス', 'sniper', 'mine', 'beam', { look: [0xe8eef6, 0x3a7ad8], charge: 1.0, dmg: 160, mindmg: 40, range: 30, ink: 18, pr: .55, spd: .92, desc: 'ためきると遠くの相手を一撃。' }),
  W('scope', 'ポラリス', 'sniper', 'sticky', 'missile', { look: [0x23305a, 0xffcf3a], charge: 1.1, dmg: 160, mindmg: 40, range: 34, ink: 18, pr: .5, scope: true, spd: .9, desc: 'ためている間は遠くがよく見える。' }),
  W('quick', 'コメット', 'sniper', 'bomb', 'armor', { look: [0x3a3a48, 0xff8a2a], charge: .5, dmg: 85, mindmg: 30, range: 22, ink: 8, pr: .5, desc: 'すぐたまるが、2発でたおす。' }),
  W('ranger', 'アンドロメダ', 'sniper', 'shield', 'rain', { look: [0x4a3a6a, 0xd8b8ff], charge: 1.6, dmg: 180, mindmg: 40, range: 42, ink: 24, pr: .6, spd: .85, desc: 'ステージの奥まで届く。ためるのはおそい。' }),
  W('lance', 'メテオ', 'sniper', 'dart', 'turret', { look: [0x3a2a2a, 0xff5a2a], charge: 1.2, dmg: 150, mindmg: 40, range: 32, ink: 20, pr: .5, pierce: true, spd: .9, model: 'lance', desc: '水流が相手も盾もつらぬいて、後ろまで届く。' }),
  W('keep', 'ルナ', 'sniper', 'spring', 'cloak', { look: [0xc8ccd6, 0xfff2b0], charge: 1.0, dmg: 160, mindmg: 40, range: 28, ink: 18, pr: .55, keep: true, spd: .92, desc: 'ためきったまま、もぐって少し待てる。' }),
  W('semi', 'パルサー', 'sniper', 'balloon', 'dash', { look: [0x2a2a3a, 0x3affd8], charge: .35, dmg: 70, mindmg: 35, range: 24, ink: 7, pr: .45, spd: 1.0, desc: 'すぐたまる。クリックの速さで撃てる。' }),
  W('widesn', 'オーロラ', 'sniper', 'fog', 'tower', { look: [0x1e3a4a, 0x5affb0], charge: 1.0, dmg: 120, mindmg: 35, range: 26, ink: 18, pr: 1.0, wide: true, spd: .92, desc: '太い線でぬれるが、一撃にはならない。' }),
  // ---- バケツ（8） ----
  W('bucket', 'ユウダチ', 'bucket', 'bomb', 'barrier', { look: [0x9aa0aa, 0x3a6ac8], rate: 1.3, dmg: 70, range: 11, ink: 7, pr: 1.15, desc: '大きなペンキのかたまりを山なりに投げる。' }),
  W('triple', 'アラレ', 'bucket', 'fountain', 'beam', { look: [0xd8e4ee, 0x6a8aa8], rate: 1.0, dmg: 55, range: 10, ink: 8, pr: 1.0, triple: true, desc: '3つに分かれて広くかかる。' }),
  W('longb', 'ニジ', 'bucket', 'mine', 'slam', { look: [0xf4f4f4, 0xff5a5a], rate: .9, dmg: 76, range: 15, ink: 9, pr: 1.2, high: true, desc: '高い山なりで遠くの段の上にも。' }),
  W('watering', 'コサメ', 'bucket', 'spring', 'rain', { look: [0x6aa8d8, 0xffffff], rate: 1.8, dmg: 32, range: 9, ink: 6, pr: .75, fan: 7, model: 'watering', desc: '細かいしぶきを扇のようにまく。' }),
  W('ladle', 'ツユ', 'bucket', 'dart', 'dash', { look: [0x8a6a44, 0x9ad8f0], rate: 2.6, dmg: 45, range: 8, ink: 4, pr: .85, small: true, model: 'ladle', desc: '小さくすくって、すばやく何度もかける。' }),
  W('dokan', 'カミナリ', 'bucket', 'sticky', 'airdrop', { look: [0xffd23a, 0x2a2a30], rate: .8, dmg: 60, sdmg: 60, er: 2.2, range: 10, ink: 10, pr: 1.4, explode: true, desc: '落ちた所で破裂するペンキ。' }),
  W('swirl', 'ウズシオ', 'bucket', 'popper', 'tornado', { look: [0x2a6ab0, 0xd8f0ff], rate: 1.0, dmg: 62, range: 11, ink: 8, pr: 1.0, swirl: true, desc: '落ちた所に輪のようにペンキが広がる。' }),
  W('rollb', 'ナダレ', 'bucket', 'slide', 'ring', { look: [0xe8eef4, 0x8ab0d0], rate: 1.1, dmg: 60, range: 9, ink: 8, pr: 1.0, roll: true, desc: '落ちたペンキが前へころがって道をぬる。' }),
  // ---- ガトリング（7） ----
  W('gatling', 'ハヤテ', 'gatling', 'slide', 'missile', { look: [0x3a4250, 0x9ad8f0], spin: 1.0, dur: 2.2, rate: 14, dmg: 30, range: 17, spread: 4, ink: 18, pr: .65, v: 34, spd: .92, desc: 'ためて撃つ弾の雨。射程が長い。' }),
  W('minig', 'ソヨカゼ', 'gatling', 'bomb', 'armor', { look: [0x8ad0a0, 0xffffff], spin: .5, dur: 1.6, rate: 15, dmg: 28, range: 13, spread: 5, ink: 14, pr: .62, v: 32, desc: 'すぐ回る小型。動きやすい。' }),
  W('heavyg', 'タイフーン', 'gatling', 'shield', 'barrier', { look: [0x2a2e38, 0xff4a4a], spin: 1.8, dur: 3.2, rate: 15, dmg: 32, range: 21, spread: 3.5, ink: 24, pr: .7, v: 36, spd: .85, desc: 'ためは長いが、長く遠くまで撃ち続ける。' }),
  W('reel', 'コガラシ', 'gatling', 'fog', 'tower', { look: [0x8a5a3a, 0xf2a03a], spin: 1.1, dur: 2.4, rate: 13, dmg: 30, range: 17, spread: 4.5, ink: 18, pr: .66, v: 33, spd: .92, keep: true, model: 'reel', desc: 'ためたまま、もぐって少し待てる。' }),
  W('trig', 'ツムジ', 'gatling', 'balloon', 'fireworks', { look: [0x4a4a6a, 0xb0f0ff], spin: 1.2, dur: 2.0, rate: 10, dmg: 26, range: 14, spread: 3, ink: 22, pr: .6, v: 32, spd: .9, triple: true, desc: '3本の弾をいっしょに広げて撃つ。' }),
  W('snipeg', 'キタカゼ', 'gatling', 'dart', 'turret', { look: [0xe8eef6, 0x3a5ad8], spin: 2.0, dur: 2.4, rate: 10, dmg: 38, range: 26, spread: 1.2, ink: 22, pr: .6, v: 42, spd: .85, desc: 'とても遠くまで、まっすぐ撃てる。' }),
  W('bounceg', 'コダマ', 'gatling', 'popper', 'dash', { look: [0x5a8a4a, 0xe8f0c8], spin: 1.0, dur: 2.0, rate: 14, dmg: 28, range: 15, spread: 5, ink: 18, pr: .64, v: 32, bounce: 1, desc: '弾が一度はねる。物かげの近くにもかかる。' }),
  // ---- 二丁拳銃（7） ----
  W('dual', 'マラカス', 'dual', 'sticky', 'beam', { look: [0xe84a3a, 0xffd23a], rate: 9, dmg: 30, range: 12, spread: 6, ink: .85, pr: .62, v: 30, rolls: 1, desc: '撃ちながら「もぐる」で1回すべれる。' }),
  W('dualm', 'カスタネット', 'dual', 'mine', 'rain', { look: [0x2a4ad0, 0xe83a3a], rate: 13, dmg: 24, range: 9, spread: 8, ink: .7, pr: .58, v: 28, rolls: 2, spd: 1.06, desc: '速い連射。2回まですべれる。' }),
  W('dualh', 'シンバル', 'dual', 'fountain', 'missile', { look: [0x4a4a52, 0xf0c040], rate: 6, dmg: 45, range: 15, spread: 4, ink: 1.4, pr: .7, v: 32, rolls: 1, spd: .96, desc: '重い弾で遠くまで。' }),
  W('duals', 'ボンゴ', 'dual', 'balloon', 'cloak', { look: [0xa0603a, 0xf2e6d0], rate: 11, dmg: 26, range: 8, spread: 9, ink: .65, pr: .58, v: 27, rolls: 4, rollLen: .7, spd: 1.08, desc: '短いすべりを4回まで。動き回って戦う。' }),
  W('duall', 'ティンパニ', 'dual', 'shield', 'airdrop', { look: [0x3a2a24, 0xd8a040], rate: 5.5, dmg: 38, range: 18, spread: 3, ink: 1.3, pr: .65, v: 35, rolls: 1, rollLen: 1.5, desc: '射程が長く、すべる距離も長い。' }),
  W('dualsp', 'タンバリン', 'dual', 'fog', 'tower', { look: [0xd8b070, 0xc0c4cc], rate: 12, cone: 2, dmg: 20, range: 9, spread: 14, ink: .6, pr: .8, v: 25, rolls: 2, desc: '広がる霧の弾。ぬりが強い。' }),
  W('dualb', 'ヒョウシギ', 'dual', 'windup', 'ring', { look: [0xb08048, 0x3a2a20], rate: 4, burst: 2, dmg: 36, range: 14, spread: 3, ink: 1.6, pr: .66, v: 33, rolls: 1, desc: '1回に2発ずつ撃つ。' }),
  // ---- パラソル（6） ----
  W('parasol', 'アジサイ', 'parasol', 'slide', 'barrier', { look: [0x4a4a5a, 0x8a7ae8], rate: 1.3, pellets: 8, dmg: 18, range: 10, cone: 16, ink: 6, pr: .6, shield: 400, v: 26, desc: '散弾とカサ。正面からの弾をふせぐ。' }),
  W('bigpara', 'ヒマワリ', 'parasol', 'mine', 'armor', { look: [0x4a3a2a, 0xffd23a], rate: .9, pellets: 10, dmg: 16, range: 9, cone: 18, ink: 8, pr: .62, shield: 900, v: 25, spd: .9, desc: '大きくてかたいカサ。' }),
  W('minipara', 'タンポポ', 'parasol', 'bomb', 'rain', { look: [0x5a8a3a, 0xffe14a], rate: 2, pellets: 6, dmg: 15, range: 9, cone: 14, ink: 4.5, pr: .55, shield: 220, v: 27, spd: 1.04, desc: '小さく軽い。撃つテンポが速い。' }),
  W('longpara', 'ユリ', 'parasol', 'dart', 'missile', { look: [0x4a6a3a, 0xf8f6f0], rate: 1.1, pellets: 7, dmg: 20, range: 13, cone: 9, ink: 6.5, pr: .6, shield: 350, v: 30, desc: '散弾がまとまって遠くまで届く。' }),
  W('spikepara', 'アザミ', 'parasol', 'popper', 'slam', { look: [0x3a4a3a, 0xb04ad0], rate: 1.2, pellets: 8, dmg: 17, range: 9.5, cone: 17, ink: 6, pr: .6, shield: 450, v: 26, spiky: true, desc: '開いたカサにふれた相手にもダメージ。' }),
  W('doublepara', 'ヤエザクラ', 'parasol', 'spring', 'turret', { look: [0x5a3a3a, 0xffa8c8], rate: 1.2, pellets: 8, dmg: 17, range: 10, cone: 16, ink: 6, pr: .6, shield: 300, v: 26, regen: true, desc: 'カサがすぐ元にもどる。こわれてもすぐ直る。' }),
  // ---- ボウ（6） ----
  W('bow', 'カジキ', 'bow', 'sticky', 'missile', { look: [0x1e4a8a, 0xd8e4f0], charge: .9, dmg: 50, range: 19, ink: 7, pr: .6, v: 40, arrows: 3, desc: 'ためて3本の矢。ためきると矢が少しおくれて破裂。' }),
  W('longbow', 'イッカク', 'bow', 'shield', 'slam', { look: [0xd8dde4, 0x5a7a9a], charge: 1.3, dmg: 62, range: 26, ink: 9, pr: .65, v: 46, arrows: 3, spd: .94, desc: '遠くまで届く強い弓。' }),
  W('fivebow', 'ハリセンボン', 'bow', 'boomer', 'fireworks', { look: [0xd8c890, 0x6a5a3a], charge: 1.0, dmg: 40, range: 16, ink: 9, pr: .55, v: 38, arrows: 5, desc: '5本の矢を広くばらまく。' }),
  W('tatebow', 'タチウオ', 'bow', 'mine', 'airdrop', { look: [0xc8ccd8, 0x8aa0c0], charge: .9, dmg: 48, range: 20, ink: 7, pr: .6, v: 40, arrows: 3, vertical: true, desc: '矢をたてに並べて放つ。まっすぐな線をぬれる。' }),
  W('bakubow', 'フグ', 'bow', 'fog', 'tower', { look: [0xf0d870, 0x4a4a3a], charge: 1.4, dmg: 45, range: 18, ink: 10, pr: .6, v: 38, arrows: 3, boom: true, desc: '半分ためれば、どの矢も破裂する。' }),
  W('quickbow', 'トビウオ', 'bow', 'balloon', 'dash', { look: [0x3a6ab8, 0xa8e0ff], charge: .45, dmg: 34, range: 14, ink: 4, pr: .5, v: 36, arrows: 2, desc: 'すぐためられる2本の矢。' }),
  // ---- ブレード（6） ----
  W('blade', 'ミカヅキ', 'blade', 'bomb', 'beam', { look: [0x2a2a36, 0xfff2b0], rate: 2.6, dmg: 50, range: 4.5, cdmg: 110, crange: 12, charge: .7, ink: 3, pr: .7, spd: 1.05, desc: '横振りで近くを切り、ためると遠くへ飛ぶ刃。' }),
  W('heavyb', 'オオナタ', 'blade', 'sticky', 'barrier', { look: [0x4a3a2a, 0xc8ccd4], rate: 1.6, dmg: 70, range: 5, cdmg: 150, crange: 14, charge: 1.0, ink: 5, pr: .85, spd: .96, desc: '重い刃。ためた一撃は一発でたおせる。' }),
  W('hera', 'イナズマ', 'blade', 'windup', 'cloak', { look: [0x2a2a30, 0xffe03a], rate: 3.4, dmg: 36, range: 3.8, cdmg: 90, crange: 6, charge: .5, ink: 2, pr: .6, spd: 1.1, lunge: true, model: 'hera', desc: 'ためると前へ一気につっこんで切る。' }),
  W('twinb', 'ニトウ', 'blade', 'dart', 'ring', { look: [0x3a2a3a, 0xe8e8f0], rate: 2.2, dmg: 34, range: 4.5, cdmg: 90, crange: 11, charge: .7, ink: 3.2, pr: .65, spd: 1.05, twin: true, desc: '1回で2度切る。' }),
  W('longblade', 'ナガレボシ', 'blade', 'shield', 'turret', { look: [0x23284a, 0xb8d8ff], rate: 1.8, dmg: 55, range: 5, cdmg: 120, crange: 18, charge: 1.0, ink: 4, pr: .75, spd: .98, desc: 'ためた刃がとても遠くまで飛ぶ。' }),
  W('boomblade', 'トンボガエリ', 'blade', 'spring', 'tornado', { look: [0x3a5a3a, 0x8ae8a0], rate: 2.0, dmg: 48, range: 4.5, cdmg: 100, crange: 11, charge: .8, ink: 3.5, pr: .75, spd: 1.0, ret: true, desc: 'ためた刃が手もとにもどってくる。' }),
  // ---- ホース（6）：このゲームだけの種類 ----
  W('garden', 'セセラギ', 'hose', 'fountain', 'rain', { look: [0x3a9a4a, 0xffd23a], rate: 22, dmg: 9, range: 12, inkS: 9, pr: .55, spread: 1.5, spd: .98, desc: 'ちょうどよい水流。ねらった線をぬれる。' }),
  W('firehose', 'オオタキ', 'hose', 'shield', 'airdrop', { look: [0xd83a32, 0xd8b040], rate: 26, dmg: 11, range: 18, inkS: 14, pr: .6, spread: 1, spd: .86, slow: true, model: 'fire', desc: '太く長い水流。撃っている間は動きがおそい。' }),
  W('shower', 'ミツマタ', 'hose', 'popper', 'fireworks', { look: [0x3a8ac8, 0xe8e8e8], rate: 30, dmg: 6, range: 9, inkS: 10, pr: .6, spread: 2, shower: 3, desc: '3本の水流でまとめてぬる。' }),
  W('pump', 'テッポウミズ', 'hose', 'spring', 'dash', { look: [0x5a5e6a, 0x3ac8e8], rate: 22, dmg: 10, range: 20, inkS: 10, pr: .55, spread: 1.2, pump: true, desc: '出し続けるほど水圧が上がって遠くまで届く。' }),
  W('misthose', 'ヤマギリ', 'hose', 'fog', 'cloak', { look: [0x8aa0a8, 0xf0f4f8], rate: 34, dmg: 5, range: 6.5, inkS: 8, pr: .7, spread: 30, mist: true, spd: 1.05, desc: '近くをふんわりぬりつぶす霧。' }),
  W('jet', 'ハヤセ', 'hose', 'dart', 'turret', { look: [0x2a3a5a, 0x4ae0ff], rate: 20, dmg: 14, range: 15, inkS: 12, pr: .45, spread: .5, spd: .94, desc: '細く強い水流。当たると痛い。' })
];
const WBY = Object.fromEntries(WEAPONS.map(w => [w.id, w]));
if (!WBY[SET.weapon]) SET.weapon = 'basic';

// 見た目の強さ（ブキ選びの棒グラフ用。0〜1）
function wStats(w) {
  const c = w.cls;
  const dps = c === 'gun' || c === 'dual' ? w.dmg * w.rate * (w.burst || 1) * (w.cone || 1) / 300
    : c === 'gatling' ? w.dmg * w.rate * (w.triple ? 2 : 1) / 300 : c === 'cannon' ? w.dmg * w.rate / 160 : c === 'sniper' ? w.dmg / Math.max(.4, w.charge) / 200
    : c === 'roller' ? (w.rollDmg || 140) / 190 : c === 'brush' ? w.fdmg * w.frate / 200 : c === 'bucket' ? w.dmg * w.rate * (w.triple ? 2 : w.fan ? 2.5 : 1) / 120
    : c === 'parasol' ? w.pellets * w.dmg * w.rate / 200 : c === 'bow' ? w.dmg * Math.min(3, w.arrows) / w.charge / 260 : c === 'hose' ? w.dmg * w.rate / 230 : w.dmg * w.rate / 160;
  const range = (c === 'blade' ? w.crange * .7 : (w.range || w.frange || 6)) / 42;
  const paint = c === 'roller' ? .9 + w.width * .03 : c === 'brush' ? .75 : c === 'gun' || c === 'dual' ? clamp((w.pr || .6) * (w.rate || 5) * (w.burst || 1) * (w.cone || 1) / 9, .2, 1)
    : c === 'sniper' ? (w.wide ? .45 : .2) : c === 'gatling' ? .65 : c === 'cannon' ? .45 : c === 'bucket' ? .7 : c === 'parasol' ? .55 : c === 'bow' ? .45 : c === 'hose' ? .8 : .5;
  return { atk: clamp(dps, .1, 1), range: clamp(range, .1, 1), paint: clamp(paint, .1, 1), move: clamp((w.spd - .8) / .32, .1, 1) };
}

// 役わり（届く距離）と、たおすのに何発いるか（体力100）
function wInfo(w) {
  const c = w.cls, r = c === 'blade' ? w.crange * .8 : (w.range || w.frange || 6);
  const role = r < 9 ? '近距離' : r < 15 ? '中距離' : '長距離';
  const n = d => d >= 99.5 ? '一撃' : Math.ceil(100 / d) + '発';
  let stk;
  switch (c) {
    case 'cannon': stk = '直撃なら' + n(w.dmg); break;
    case 'sniper': stk = 'ためきれば' + n(w.dmg); break;
    case 'roller': stk = 'ころがし' + n(w.rollDmg || 140) + '・ふり（近く）' + n(w.fdmg * .97); break;
    case 'brush': stk = 'ふり（近く）' + Math.ceil(100 / (w.fdmg / 1.5 * 2)) + '回'; break;
    case 'parasol': stk = '近くで全弾' + n(w.pellets * w.dmg); break;
    case 'bow': stk = 'ためきって' + n(w.dmg * 1.15); break;
    case 'blade': stk = '横振り' + n(w.dmg) + '・ため' + n(w.cdmg); break;
    case 'hose': stk = Math.ceil(100 / w.dmg) + '粒（約' + (100 / w.dmg / w.rate).toFixed(1) + '秒）'; break;
    default: stk = n(w.dmg);
  }
  return { role, stk };
}

// ブキの種類のアイコン（SVG）
function classIcon(cls, col = '#fff') {
  const s = {
    gun: `<rect x="10" y="22" width="34" height="14" rx="4" fill="${col}"/><rect x="40" y="25" width="14" height="6" rx="2" fill="${col}"/><rect x="16" y="34" width="9" height="16" rx="3" fill="${col}"/>`,
    cannon: `<rect x="8" y="20" width="30" height="20" rx="8" fill="${col}"/><circle cx="46" cy="30" r="11" fill="none" stroke="${col}" stroke-width="5"/><rect x="14" y="38" width="9" height="13" rx="3" fill="${col}"/>`,
    roller: `<rect x="10" y="38" width="44" height="14" rx="6" fill="${col}"/><rect x="29" y="8" width="6" height="32" rx="3" fill="${col}"/>`,
    brush: `<rect x="29" y="6" width="6" height="28" rx="3" fill="${col}"/><path d="M20 34h24l-3 20H23z" fill="${col}"/>`,
    sniper: `<rect x="4" y="27" width="56" height="7" rx="3" fill="${col}"/><rect x="14" y="20" width="16" height="7" rx="3" fill="${col}"/><rect x="10" y="32" width="9" height="16" rx="3" fill="${col}"/>`,
    bucket: `<path d="M14 18h36l-5 34H19z" fill="${col}"/><path d="M14 18q18-14 36 0" fill="none" stroke="${col}" stroke-width="4"/>`,
    gatling: `<rect x="8" y="20" width="22" height="22" rx="6" fill="${col}"/><rect x="28" y="22" width="30" height="5" rx="2" fill="${col}"/><rect x="28" y="29" width="30" height="5" rx="2" fill="${col}"/><rect x="28" y="36" width="30" height="5" rx="2" fill="${col}"/>`,
    dual: `<rect x="6" y="14" width="26" height="10" rx="3" fill="${col}"/><rect x="10" y="22" width="7" height="12" rx="2" fill="${col}"/><rect x="32" y="36" width="26" height="10" rx="3" fill="${col}"/><rect x="36" y="44" width="7" height="12" rx="2" fill="${col}"/>`,
    parasol: `<path d="M8 34a24 22 0 0 1 48 0z" fill="${col}"/><rect x="30" y="32" width="5" height="22" rx="2" fill="${col}"/>`,
    bow: `<path d="M18 6q24 26 0 52" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"/><path d="M18 6v52" stroke="${col}" stroke-width="2"/><path d="M18 32h38M50 26l7 6-7 6" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`,
    blade: `<path d="M12 50L46 10l6 6-36 38z" fill="${col}"/><rect x="8" y="46" width="14" height="8" rx="3" fill="${col}" transform="rotate(-45 15 50)"/>`,
    hose: `<circle cx="22" cy="40" r="13" fill="none" stroke="${col}" stroke-width="5"/><path d="M33 34l14-10" stroke="${col}" stroke-width="5" stroke-linecap="round"/><rect x="44" y="16" width="14" height="10" rx="3" fill="${col}" transform="rotate(-35 51 21)"/><path d="M56 12q4-4 6-8M58 18q5-2 6-6" stroke="${col}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
  }[cls] || '';
  return `<svg viewBox="0 0 64 64">${s}</svg>`;
}

// 名前（CPU）
const BOT_NAMES = ['ペンタ', 'ヌリオ', 'ドロップ', 'ミズキ', 'ハネル', 'コロン', 'スプリ', 'ポポ', 'ベタ', 'ルリ', 'カブ', 'ナナ', 'ジェリー', 'ポン太', 'ソラ', 'ミミ', 'トロ', 'シズク', 'パレット', 'ムラ'];
