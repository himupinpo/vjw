
// ================= データ：チームの色・ブキ・サブ・スペシャル（すべてこのゲームのオリジナル） =================
const PALETTES = [
  ['#ff2d87', '#1fd1ff'], ['#ffb300', '#7b4dff'], ['#3fe05c', '#ff3fc8'], ['#ff6a1a', '#2a72ff'], ['#d8ff1f', '#a12bff'], ['#ff4040', '#20e0b0']
];
// ブキの種類（このゲームでの呼び名）
const CLASSES = {
  gun:      { name: 'ガン',     desc: '押している間、連続でペンキを撃つ。いちばん基本の形。' },
  cannon:   { name: 'キャノン', desc: '弾が飛んだ先で破裂する。直撃なら一撃、まわりにも爆風。' },
  roller:   { name: 'ローラー', desc: 'おしたまま進むと太い道をぬり、ぶつかった相手をたおす。ひと振りでペンキを飛ばす。' },
  brush:    { name: 'ハケ',     desc: 'ローラーより細いが、とても速く走れる。小刻みに振ってまく。' },
  sniper:   { name: 'スナイパー', desc: 'ためて放つ一直線の弾。ためきると遠くの相手を一撃。' },
  bucket:   { name: 'バケツ',   desc: '山なりに大きなペンキをぶちまける。段差の向こうにも届く。' },
  gatling:  { name: 'ガトリング', desc: '回してためると、ためた分だけ弾の雨を降らせる。' },
  dual:     { name: '二丁拳銃', desc: '両手で撃つ。撃ちながら「もぐる」で横へすべってよける。' },
  parasol:  { name: 'パラソル', desc: '散弾を撃ちつつ、カサで正面の弾をふせぐ。' },
  bow:      { name: 'ボウ',     desc: 'ためて放つと、3本の矢が扇のように飛ぶ。ためるほど強い。' },
  blade:    { name: 'ブレード', desc: '振ると横に広がる刃のペンキ。ためると遠くまで飛ぶ一撃。' }
};
const CLASS_ORDER = Object.keys(CLASSES);

const SUBS = {
  bomb:     { name: 'ペイント爆弾',  ink: 65, desc: '投げて少しすると破裂する。' },
  sticky:   { name: 'ひっつき爆弾',  ink: 70, desc: 'ふれた所にくっつき、大きく破裂する。' },
  slide:    { name: 'すべる爆弾',    ink: 60, desc: '床をすべりながらぬり、最後に破裂。' },
  fountain: { name: 'まわる噴水',    ink: 55, desc: '置いた所でまわりにペンキをまき続ける。' },
  shield:   { name: 'ペンキの盾',    ink: 60, desc: '目の前に盾を立て、相手の弾をふせぐ。' },
  mine:     { name: '仕掛け爆弾',    ink: 55, desc: '足もとに仕掛け、近づいた相手で破裂する。' }
};
const SPECIALS = {
  beam:    { name: 'メガ噴射',       cost: 190, desc: '太いペンキの光線を数秒間はなつ。かべで止まる。' },
  rain:    { name: 'ペンキの雨雲',   cost: 170, desc: 'ねらった所に雲を飛ばし、しばらくペンキの雨。' },
  slam:    { name: 'ジャンプスタンプ', cost: 180, desc: '高くとび上がって着地の衝撃でまわりを一気にぬる。' },
  barrier: { name: 'バリアドーム',   cost: 180, desc: '少しの間、中にいる味方を守るドームを張る。' },
  missile: { name: '追尾ミサイル',   cost: 200, desc: '見えている相手めがけてミサイルが降る。' },
  armor:   { name: 'チームアーマー', cost: 190, desc: '近くの味方に、ダメージを少し防ぐよろいをつける。' }
};

// 数値の意味（共通）：spd 移動の速さ、ink 1発のペンキ（タンク100）、dmg ダメージ（体力100）、range 射程(m)
const W = (id, name, cls, sub, sp, p) => Object.assign({ id, name, cls, sub, sp, spd: 1 }, p);
const WEAPONS = [
  // ---- ガン ----
  W('mist', '霧ふきガン', 'gun', 'fountain', 'rain', { rate: 14, dmg: 20, range: 7, spread: 13, ink: .6, pr: .85, v: 24, spd: 1.08, desc: '射程は短いが、広く速くぬれる。' }),
  W('short', 'ショートガン', 'gun', 'bomb', 'slam', { rate: 12, dmg: 26, range: 9, spread: 10, ink: .65, pr: .62, v: 26, spd: 1.06, desc: '連射が速く、近くの相手に強い。' }),
  W('basic', 'ベーシックガン', 'gun', 'bomb', 'beam', { rate: 8, dmg: 35, range: 13, spread: 6, ink: .9, pr: .7, v: 30, desc: '何でもこなせる標準のガン。' }),
  W('pro', 'プロガン', 'gun', 'mine', 'missile', { rate: 7.5, dmg: 35, range: 14, spread: 2.5, ink: 1.0, pr: .62, v: 32, desc: 'ぶれが小さく、ねらった所にまっすぐ飛ぶ。' }),
  W('rapid', 'ラピッドガン', 'gun', 'slide', 'armor', { rate: 10, dmg: 30, range: 11, spread: 8, ink: .75, pr: .65, v: 28, desc: '速い連射で押しこむ。' }),
  W('heavy', 'ヘビーガン', 'gun', 'sticky', 'barrier', { rate: 5, dmg: 52, range: 15, spread: 4, ink: 1.6, pr: .82, v: 30, spd: .95, desc: '重い一発。2発で相手をたおせる。' }),
  W('long', 'ロングガン', 'gun', 'shield', 'missile', { rate: 4.2, dmg: 40, range: 21, spread: 2, ink: 1.9, pr: .75, v: 36, spd: .94, desc: '遠くまで届くが、連射はおそい。' }),
  W('burst', 'バーストガン', 'gun', 'bomb', 'rain', { rate: 3, burst: 3, dmg: 33, range: 15, spread: 2.5, ink: 2.6, pr: .7, v: 34, desc: '3発ずつまとめて撃つ。' }),
  // ---- キャノン ----
  W('cannon', 'ボンバーキャノン', 'cannon', 'shield', 'slam', { rate: 1.1, dmg: 125, sdmg: 70, er: 2.3, range: 11, ink: 9, pr: 1.6, v: 20, spd: .95, desc: '直撃で一撃。破裂でまわりもまきこむ。' }),
  W('minic', 'ミニキャノン', 'cannon', 'mine', 'armor', { rate: 1.7, dmg: 100, sdmg: 50, er: 1.8, range: 9, ink: 7, pr: 1.3, v: 21, desc: '小さくて速いキャノン。' }),
  W('longc', 'ロングキャノン', 'cannon', 'sticky', 'missile', { rate: .8, dmg: 125, sdmg: 60, er: 2.5, range: 15, ink: 11, pr: 1.6, v: 22, spd: .92, desc: '遠くで破裂する長いキャノン。' }),
  W('rapidc', 'ラピッドキャノン', 'cannon', 'slide', 'rain', { rate: 1.6, dmg: 85, sdmg: 45, er: 2.0, range: 13, ink: 8, pr: 1.3, v: 24, desc: '破裂はひかえめだが、テンポよく撃てる。' }),
  // ---- ローラー ----
  W('roller', 'ペイントローラー', 'roller', 'sticky', 'barrier', { width: 2.2, rollSpd: 1.05, rollInk: 3.2, flick: 8, fdmg: 120, frange: 9, fspread: 34, frate: 1.4, ink: 9, desc: '道を太くぬり、近づいた相手をおしつぶす。' }),
  W('wide', 'ワイドローラー', 'roller', 'shield', 'slam', { width: 3.2, rollSpd: .9, rollInk: 4, flick: 10, fdmg: 110, frange: 8, fspread: 50, frate: 1.1, ink: 11, spd: .92, desc: 'とても太い道をぬれる大型ローラー。' }),
  W('mini', 'ミニローラー', 'roller', 'bomb', 'armor', { width: 1.6, rollSpd: 1.25, rollInk: 2.4, flick: 6, fdmg: 100, frange: 7, fspread: 28, frate: 2, ink: 6, spd: 1.08, desc: '軽くて速い。すばやく走ってぬる。' }),
  W('vert', 'たて振りローラー', 'roller', 'slide', 'missile', { width: 2, rollSpd: 1, rollInk: 3.4, flick: 7, fdmg: 125, frange: 14, fspread: 6, vflick: true, frate: 1.2, ink: 10, desc: 'たてに振ると、遠くまでまっすぐ届く。' }),
  // ---- ハケ ----
  W('brush', 'ハケ', 'brush', 'mine', 'slam', { width: 1.25, rollSpd: 1.55, rollInk: 1.6, flick: 4, fdmg: 34, frange: 5.5, fspread: 30, frate: 5, ink: 2.2, spd: 1.08, desc: '走りながらぬれる。小刻みに振って近くの相手に。' }),
  W('bigbrush', 'ビッグハケ', 'brush', 'fountain', 'beam', { width: 1.8, rollSpd: 1.35, rollInk: 2.2, flick: 5, fdmg: 40, frange: 6.5, fspread: 34, frate: 3.4, ink: 3, desc: '少し太いハケ。ふり幅も広い。' }),
  // ---- スナイパー ----
  W('sniper', 'スナイパー', 'sniper', 'mine', 'beam', { charge: 1.0, dmg: 160, mindmg: 40, range: 30, ink: 18, pr: .55, spd: .92, desc: 'ためきると遠くの相手を一撃。' }),
  W('scope', 'スコープスナイパー', 'sniper', 'sticky', 'missile', { charge: 1.1, dmg: 160, mindmg: 40, range: 34, ink: 18, pr: .5, scope: true, spd: .9, desc: 'ためている間は遠くがよく見える。' }),
  W('quick', 'クイックスナイパー', 'sniper', 'bomb', 'armor', { charge: .5, dmg: 85, mindmg: 30, range: 22, ink: 8, pr: .5, desc: 'すぐたまるが、2発でたおす。' }),
  W('ranger', 'ロングレンジャー', 'sniper', 'shield', 'rain', { charge: 1.6, dmg: 180, mindmg: 40, range: 42, ink: 24, pr: .6, spd: .85, desc: 'マップの奥まで届く。ためるのはおそい。' }),
  // ---- バケツ ----
  W('bucket', 'バケツ', 'bucket', 'bomb', 'barrier', { rate: 1.3, dmg: 70, range: 11, ink: 7, pr: 1.15, desc: '大きなペンキのかたまりを山なりに投げる。' }),
  W('triple', 'トリプルバケツ', 'bucket', 'fountain', 'beam', { rate: 1.0, dmg: 55, range: 10, ink: 8, pr: 1.0, triple: true, desc: '3つに分かれて広くかかる。' }),
  W('longb', 'ロングバケツ', 'bucket', 'mine', 'slam', { rate: .9, dmg: 76, range: 15, ink: 9, pr: 1.2, high: true, desc: '高い山なりで遠くの段の上にも。' }),
  // ---- ガトリング ----
  W('gatling', 'ガトリング', 'gatling', 'slide', 'missile', { spin: 1.0, dur: 2.2, rate: 14, dmg: 30, range: 17, spread: 4, ink: 18, pr: .65, v: 34, spd: .92, desc: 'ためて撃つ弾の雨。射程が長い。' }),
  W('minig', 'ミニガトリング', 'gatling', 'bomb', 'armor', { spin: .5, dur: 1.6, rate: 15, dmg: 28, range: 13, spread: 5, ink: 14, pr: .62, v: 32, desc: 'すぐ回る小型。動きやすい。' }),
  W('heavyg', 'ヘビーガトリング', 'gatling', 'shield', 'barrier', { spin: 1.8, dur: 3.2, rate: 15, dmg: 32, range: 21, spread: 3.5, ink: 24, pr: .7, v: 36, spd: .85, desc: 'ためは長いが、長く遠くまで撃ち続ける。' }),
  // ---- 二丁拳銃 ----
  W('dual', 'ツインピストル', 'dual', 'sticky', 'beam', { rate: 9, dmg: 30, range: 12, spread: 6, ink: .85, pr: .62, v: 30, rolls: 1, desc: '撃ちながら「もぐる」で1回すべれる。' }),
  W('dualm', 'ツインマシン', 'dual', 'mine', 'rain', { rate: 13, dmg: 24, range: 9, spread: 8, ink: .7, pr: .58, v: 28, rolls: 2, spd: 1.06, desc: '速い連射。2回まですべれる。' }),
  W('dualh', 'ツインヘビー', 'dual', 'fountain', 'missile', { rate: 6, dmg: 45, range: 15, spread: 4, ink: 1.4, pr: .7, v: 32, rolls: 1, spd: .96, desc: '重い弾で遠くまで。' }),
  // ---- パラソル ----
  W('parasol', 'パラソルガン', 'parasol', 'slide', 'barrier', { rate: 1.3, pellets: 8, dmg: 18, range: 10, cone: 16, ink: 6, pr: .6, shield: 400, v: 26, desc: '散弾とカサ。正面からの弾をふせぐ。' }),
  W('bigpara', 'ビッグパラソル', 'parasol', 'mine', 'armor', { rate: .9, pellets: 10, dmg: 16, range: 9, cone: 18, ink: 8, pr: .62, shield: 900, v: 25, spd: .9, desc: '大きくてかたいカサ。' }),
  W('minipara', 'ミニパラソル', 'parasol', 'bomb', 'rain', { rate: 2, pellets: 6, dmg: 15, range: 9, cone: 14, ink: 4.5, pr: .55, shield: 220, v: 27, spd: 1.04, desc: '小さく軽い。撃つテンポが速い。' }),
  // ---- ボウ ----
  W('bow', 'ペイントボウ', 'bow', 'sticky', 'missile', { charge: .9, dmg: 50, range: 19, ink: 7, pr: .6, v: 40, desc: 'ためて3本の矢。ためきると矢が少しおくれて破裂。' }),
  W('longbow', 'ロングボウ', 'bow', 'shield', 'slam', { charge: 1.3, dmg: 62, range: 26, ink: 9, pr: .65, v: 46, spd: .94, desc: '遠くまで届く強い弓。' }),
  // ---- ブレード ----
  W('blade', 'ペイントブレード', 'blade', 'bomb', 'beam', { rate: 2.6, dmg: 50, range: 4.5, cdmg: 110, crange: 12, charge: .7, ink: 3, pr: .7, spd: 1.05, desc: '横振りで近くを切り、ためると遠くへ飛ぶ刃。' }),
  W('heavyb', 'ヘビーブレード', 'blade', 'sticky', 'barrier', { rate: 1.6, dmg: 70, range: 5, cdmg: 150, crange: 14, charge: 1.0, ink: 5, pr: .85, spd: .96, desc: '重い刃。ためた一撃は一発でたおせる。' })
];
const WBY = Object.fromEntries(WEAPONS.map(w => [w.id, w]));
if (!WBY[SET.weapon]) SET.weapon = 'basic';

// 見た目の強さ（ブキ選びの棒グラフ用。0〜1）
function wStats(w) {
  const dps = w.cls === 'gun' || w.cls === 'dual' || w.cls === 'gatling' ? w.dmg * w.rate * (w.burst || 1) / 300
    : w.cls === 'cannon' ? w.dmg * w.rate / 180 : w.cls === 'sniper' ? w.dmg / w.charge / 200 : w.cls === 'roller' ? .75 : w.cls === 'brush' ? w.fdmg * w.frate / 200
    : w.cls === 'bucket' ? w.dmg * w.rate * (w.triple ? 2 : 1) / 120 : w.cls === 'parasol' ? w.pellets * w.dmg * w.rate / 200 : w.cls === 'bow' ? w.dmg * 3 / w.charge / 260 : w.dmg * w.rate / 160;
  const range = (w.range || w.frange || 6) / 42;
  const paint = w.cls === 'roller' ? .9 + w.width * .03 : w.cls === 'brush' ? .75 : w.cls === 'gun' || w.cls === 'dual' ? clamp((w.pr || .6) * (w.rate || 5) * (w.burst || 1) / 9, .2, 1)
    : w.cls === 'sniper' ? .2 : w.cls === 'gatling' ? .65 : w.cls === 'cannon' ? .45 : w.cls === 'bucket' ? .7 : w.cls === 'parasol' ? .55 : w.cls === 'bow' ? .45 : .5;
  return { atk: clamp(dps, .1, 1), range: clamp(range, .1, 1), paint: clamp(paint, .1, 1), move: clamp((w.spd - .8) / .3, .1, 1) };
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
    blade: `<path d="M12 50L46 10l6 6-36 38z" fill="${col}"/><rect x="8" y="46" width="14" height="8" rx="3" fill="${col}" transform="rotate(-45 15 50)"/>`
  }[cls] || '';
  return `<svg viewBox="0 0 64 64">${s}</svg>`;
}

// 名前（CPU）
const BOT_NAMES = ['ペンタ', 'ヌリオ', 'ドロップ', 'ミズキ', 'ハネル', 'コロン', 'スプリ', 'ポポ', 'ベタ', 'ルリ', 'カブ', 'ナナ', 'ジェリー', 'ポン太', 'ソラ', 'ミミ'];
