
/* =========================================================================
   The main building (本館) of Ao Oni ver6.23, rebuilt tile for tile. Every room keeps its shape on the
   original map, drawn large: one tile is 1.7 m, so a 3-tile corridor is about five metres across.
   Where the original changes screens at an edge, a black wall stands across the way: you can't see the
   next part of the house until you walk into the dark. Doors and stairs take you to the other side the
   way the original's map changes do.
   Tile coordinates: x east, z south; each floor sits at its own height.
   ========================================================================= */
const T = 1.7, WALL_H = 4.2, DR_H = 2.7, DW = 1.45, WT = 0.16;   // DW: the width of a doorway
// the main building's three floors, its basement, and (each on a level of its own) the annexes and the way between them
const FLOORS = { F1: 0, F2: 40, F3: 80, B1: -40, A1: 120, A2: 160, A3: 200, AB: 240, K: 280, S1: 320, S2: 360, SB: 400, Y: 440 };
const cx = x => (x + 0.5) * T;             // centre of tile x (or z)
const tm = v => v * T;                      // tiles -> metres
const MAN = { areas: {}, list: [], doors: {}, doorList: [], stairs: {}, hides: [], props: {}, grid: new Map(), open: new Set(), doorEdges: new Set(), nodes: [], veils: [] };
const gkey = (fl, x, z) => fl + ':' + x + ',' + z;

/* ---------- materials of this house ---------- */
const AOM = {};
function aoMaterials() {
  if (AOM.ready) return;
  const S = Q().tex;
  AOM.wallWhite = std({ ...genNoiseSurface(S / 2, 0xd7d3c8, 0.05, 6, 0.35), roughness: 0.92 }, 2);
  AOM.wallGrey = std({ ...genNoiseSurface(S / 2, 0xbdbab1, 0.05, 6, 0.35), roughness: 0.92 }, 2);   // the patch of wallpaper that is a little greyer
  AOM.wallGreen = std({ ...genNoiseSurface(S / 2, 0x9db25e, 0.06, 6, 0.35), roughness: 0.9 }, 2);
  AOM.wallBeige = std({ ...genNoiseSurface(S / 2, 0xcdbf9e, 0.07, 6, 0.4), roughness: 0.92 }, 2);
  AOM.wallDark = std({ ...genNoiseSurface(S / 2, 0x8a857a, 0.12, 6, 0.6), roughness: 0.95 }, 2);
  AOM.floorWood = std({ ...genWoodFloor(S, 0xc0803f, 8, 3), roughness: 0.95, normalScale: new THREE.Vector2(0.6, 0.6) }, 2.2);
  AOM.floorRed = std({ ...genWoodFloor(S, 0x7a3220, 9, 5), roughness: 0.9, normalScale: new THREE.Vector2(0.6, 0.6) }, 2.2);
  AOM.floorPale = std({ ...genWoodFloor(S, 0xd2cdc0, 9, 7), roughness: 0.9, normalScale: new THREE.Vector2(0.5, 0.5) }, 2.2);
  AOM.floorAttic = std({ ...genWoodFloor(S, 0x4a3220, 7, 9), roughness: 1, normalScale: new THREE.Vector2(0.8, 0.8) }, 2.2);
  AOM.tileBlue = std({ ...genTilesColor(S / 2, 0x2c3650, 0x222a40, 5, false), roughness: 0.3 }, 1.1);
  AOM.vinyl = std({ ...genNoiseSurface(S / 2, 0xb4a37c, 0.05, 8, 0.2), roughness: 0.7 }, 2);
  AOM.brickRed = std({ ...genStoneBlocks(S, 0x7c3a26, 10, 4), roughness: 0.92 }, 1.4);
  AOM.genkan = std({ ...genTilesColor(S / 2, 0xc9b996, 0xbfae8a, 3, false), roughness: 0.6 }, 1.2);
  AOM.tatami = std({ map: tatamiTex(), roughness: 0.95 }, 1);
  AOM.fusuma = std({ map: fusumaTex(), roughness: 0.9 }, 1);
  AOM.pink = std({ color: 0xd98aa2, roughness: 0.25, envMap: ENV, envMapIntensity: 0.4 });
  AOM.white = std({ color: 0xe9e7e1, roughness: 0.45 });
  AOM.grey = std({ color: 0x8d8f93, roughness: 0.75 });
  AOM.teal = std({ color: 0x6f9c90, roughness: 0.5 });
  AOM.door = std({ color: 0x5e3520, roughness: 0.55 });
  AOM.doorPanel = std({ color: 0x4c2a18, roughness: 0.6 });
  AOM.rug = std({ ...genNoiseSurface(S / 2, 0xc9bb98, 0.06, 10, 0.3), roughness: 1 }, 2);
  AOM.knob = std({ color: 0xd8b84a, metalness: 0.9, roughness: 0.3, envMap: ENV, envMapIntensity: 0.9 });
  AOM.veil = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, fog: false });
  // the basement, the annexes, the way between them
  AOM.wallStone = std({ ...genNoiseSurface(S / 2, 0x9c9a90, 0.08, 7, 0.45), roughness: 0.95 }, 2);
  AOM.floorMoss = std({ ...genStoneBlocks(S, 0x4a5238, 8, 6), roughness: 0.95 }, 1.6);
  AOM.wallBlue = std({ ...genNoiseSurface(S / 2, 0x7d8498, 0.08, 6, 0.5), roughness: 0.92 }, 2);
  AOM.floorBlood = std({ ...genWoodFloor(S, 0x561616, 8, 11), roughness: 0.9, normalScale: new THREE.Vector2(0.6, 0.6) }, 2.2);
  AOM.wallStain = std({ ...genNoiseSurface(S / 2, 0xc2b08a, 0.16, 5, 0.7), roughness: 0.95 }, 2);
  AOM.floorOlive = std({ ...genWoodFloor(S, 0x464a2c, 8, 13), roughness: 0.95, normalScale: new THREE.Vector2(0.6, 0.6) }, 2.2);
  AOM.wallWhiteB = std({ ...genNoiseSurface(S / 2, 0xeeeeea, 0.03, 6, 0.2), roughness: 0.85 }, 2);
  AOM.floorPath = std({ ...genStoneBlocks(S, 0x6c6a62, 6, 15), roughness: 0.95 }, 1.4);
  AOM.hedge = std({ ...genNoiseSurface(S / 2, 0x1d3a1f, 0.25, 9, 0.8), roughness: 1 }, 1.4);
  AOM.floorDirt = std({ ...genNoiseSurface(S / 2, 0x4a3a26, 0.32, 10, 1.2), roughness: 1 }, 1.6);   // the muddy path out
  AOM.forest = std({ ...genNoiseSurface(S / 2, 0x0d130e, 0.4, 7, 0.6), roughness: 1 }, 1.2);       // the dark wood either side of it
  AOM.ready = true;
}
function tatamiTex() {
  const c = newCanvas(512, 256), g = c.getContext('2d');
  g.fillStyle = '#7f9a48'; g.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 3) { g.fillStyle = x % 6 ? 'rgba(60,80,30,.18)' : 'rgba(200,220,140,.12)'; g.fillRect(x, 8, 1.5, 240); }
  g.fillStyle = '#2d3a1c'; g.fillRect(0, 0, 512, 9); g.fillRect(0, 247, 512, 9);   // the cloth borders
  return toTex(c, true, false);
}
function fusumaTex() {
  const c = newCanvas(256, 512), g = c.getContext('2d');
  g.fillStyle = '#e6dcc2'; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(150,130,90,${Math.random() * 0.08})`; g.fillRect(Math.random() * 256, Math.random() * 512, 2 + Math.random() * 30, 1 + Math.random() * 3); }
  g.strokeStyle = '#1b1510'; g.lineWidth = 12; g.strokeRect(6, 6, 244, 500);
  g.fillStyle = '#1b1510'; g.beginPath(); g.ellipse(214, 256, 9, 14, 0, 0, TAU); g.fill();
  return toTex(c, true, false);
}

/* ---------- the map ---------- */
// cells: [x, z, w, h] in tiles. wall/floor: material keys. lamps: tile positions of ceiling lights.
const AREAS = [
  // 1F
  { id: 'toilet', name: 'トイレ', fl: 'F1', cells: [[-5, 1, 3, 1], [-5, 2, 3, 1], [-5, 3, 1, 2], [-5, 5, 3, 2]], wall: 'wallWhite', floor: 'genkan', lamps: [[-4, 1.5], [-4, 6]] },
  { id: 'corA', name: '廊下', fl: 'F1', cells: [[0, 0, 10, 3]], wall: 'wallWhite', floor: 'floorWood', lamps: [[2.5, 1.5], [7.5, 1.5]] },
  { id: 'foyer', name: '玄関', fl: 'F1', cells: [[10, 0, 13, 3], [14, -4, 3, 4], [13, 3, 7, 3]], wall: 'wallWhite', floor: 'floorWood', lamps: [[13, 1.5], [20, 1.5], [15.5, -2], [16.5, 4.5]] },
  { id: 'corB', name: '廊下', fl: 'F1', cells: [[23, 0, 9, 3]], wall: 'wallWhite', floor: 'floorWood', lamps: [[25.5, 1.5], [30, 1.5]] },
  { id: 'kitchen', name: '食堂', fl: 'F1', cells: [[34, -6, 8, 14]], wall: 'wallGreen', floor: 'floorRed', lamps: [[38, -3.5], [38, 1.5], [38, 5.5]] },
  { id: 'bath', name: '浴室', fl: 'F1', cells: [[-2, -9, 3, 2], [1, -8, 1, 1], [2, -9, 3, 2]], wall: 'wallWhite', floor: 'vinyl', lamps: [[-0.5, -8], [3.5, -8]] },
  { id: 'library', name: '図書室', fl: 'F1', cells: [[17, -25, 16, 17], [30, -8, 3, 2]], wall: 'wallBeige', floor: 'floorWood', lamps: [[21, -21], [29, -21], [21, -13], [29, -13], [31.5, -7]] },
  { id: 'corC', name: '廊下', fl: 'F1', cells: [[0, -32, 11, 3]], wall: 'wallWhite', floor: 'floorWood', lamps: [[2.5, -30.5], [8, -30.5]] },
  { id: 'corT', name: '廊下', fl: 'F1', cells: [[11, -32, 15, 3]], wall: 'wallWhite', floor: 'floorWood', lamps: [[19.5, -30.5], [24, -30.5]] },
  { id: 'tatami', name: '和室', fl: 'F1', cells: [[12, -40, 6, 8]], wall: 'wallBeige', floor: 'tatami', lamps: [[15, -36.5]] },
  { id: 'hidden', name: '隠し部屋', fl: 'F1', cells: [[30, -44, 9, 8]], wall: 'wallDark', floor: 'floorAttic', dark: true, lamps: [] },
  { id: 'jail', name: '牢屋', fl: 'F1', cells: [[30, -53, 7, 6]], wall: 'wallGrey', floor: 'brickRed', lamps: [[33.5, -49]] },
  // 2F
  { id: 'piano', name: 'ピアノの部屋', fl: 'F2', cells: [[0, 2, 11, 9]], wall: 'wallWhite', floor: 'floorPale', lamps: [[3, 5], [8, 5], [5.5, 9]] },
  { id: 'cor2', name: '2階 廊下', fl: 'F2', cells: [[13, 2, 10, 2], [16, 4, 2, 8], [20, 4, 1, 5], [18, 10, 2, 2], [20, 11, 1, 1], [13, 12, 10, 2]], wall: 'wallWhite', floor: 'floorWood', lamps: [[15, 3], [21, 3], [17, 8], [17, 13]] },
  { id: 'kids', name: '子供部屋', fl: 'F2', cells: [[7, -13, 9, 8]], wall: 'wallWhite', floor: 'floorWood', lamps: [[11.5, -9]] },
  { id: 'takeshi', name: '右上の部屋', fl: 'F2', cells: [[17, -13, 9, 8]], wall: 'wallWhite', floor: 'floorWood', lamps: [[21.5, -9]] },
  // 3F
  { id: 'attic', name: '屋根裏部屋', fl: 'F3', cells: [[11, -12, 9, 10]], wall: 'wallWhite', floor: 'floorWood', lamps: [[13.5, -8.5], [17.5, -8.5], [15.5, -4.5]] },
  { id: 'cor3', name: '3階 廊下', fl: 'F3', cells: [[14, 2, 2, 8]], wall: 'wallWhite', floor: 'floorWood', lamps: [[15, 4], [15, 8]] },
  { id: 'bed3', name: '寝室', fl: 'F3', cells: [[0, 4, 9, 8]], wall: 'wallWhite', floor: 'floorWood', lamps: [[4.5, 8]] },
];
// stairs: a flight inside an area; dir is the way you walk along it from its entry, rise is up (+) or down (-).
// Each runs on into the dark at its far end; walk into it and you come out of the dark end of the flight it leads to.
const STAIRS = [
  { id: 'st1up', fl: 'F1', area: 'foyer', r: [18, -6, 2, 6], dir: 'N', rise: 3.2, to: 'st2dn' },
  { id: 'st2dn', fl: 'F2', area: 'cor2', r: [18, 4, 2, 6], dir: 'S', rise: -3.2, to: 'st1up' },
  { id: 'st2up', fl: 'F2', area: 'cor2', r: [21, 6, 2, 6], dir: 'N', rise: 3.2, to: 'st3dn' },
  { id: 'st3dn', fl: 'F3', area: 'cor3', r: [14, 10, 2, 5], dir: 'S', rise: -3.2, to: 'st2up' },
];
// rooms that are one screen in the original: the walls between these neighbouring tiles are left out
const JOINS = [
  ...[12, 13, 14, 15, 16, 17].map(x => ['F1', x, -33, x, -32]),        // the tatami room opens onto the corridor below it
];
// the original's screen edges: open, but a black wall stands across the way (walk into it to go on)
const EDGES = [
  ['F1', 9, 0, 10, 0], ['F1', 9, 1, 10, 1], ['F1', 9, 2, 10, 2],       // corridor A - foyer
  ['F1', 22, 0, 23, 0], ['F1', 22, 1, 23, 1], ['F1', 22, 2, 23, 2],    // foyer - corridor B
  ['F1', 10, -32, 11, -32], ['F1', 10, -31, 11, -31], ['F1', 10, -30, 11, -30],   // corridor C - the corridor by the tatami room
];
// doors: on tile (x, z), in its wall on `side`; `to` is the door you come out of
const DOORDEFS = [
  { id: 'foyerN', fl: 'F1', x: 15, z: -4, side: 'N', to: 'corC' },
  { id: 'front', fl: 'F1', x: 16, z: 5, side: 'S', to: null, kind: 'front' },
  { id: 'corA_wc', fl: 'F1', x: 0, z: 1, side: 'W', to: 'wc' },
  { id: 'wc', fl: 'F1', x: -3, z: 1, side: 'E', to: 'corA_wc' },
  { id: 'corB_din', fl: 'F1', x: 31, z: 1, side: 'E', to: 'din' },
  { id: 'din', fl: 'F1', x: 34, z: 1, side: 'W', to: 'corB_din' },
  { id: 'corA_bath', fl: 'F1', x: 2, z: 0, side: 'N', to: 'bath', glass: 'cool' },     // frosted glass, the lit bath behind it
  { id: 'bath', fl: 'F1', x: 3, z: -8, side: 'S', to: 'corA_bath', glass: 'warm' },
  { id: 'corB_lib', fl: 'F1', x: 27, z: 0, side: 'N', to: 'lib', lock: 'k_library' },
  { id: 'lib', fl: 'F1', x: 31, z: -7, side: 'S', to: 'corB_lib' },
  { id: 'corC', fl: 'F1', x: 6, z: -30, side: 'S', to: 'foyerN' },
  { id: 'corC_base', fl: 'F1', x: 2, z: -32, side: 'N', to: null, kind: 'basement', lock: 'k_basement' },
  { id: 'corT_hid', fl: 'F1', x: 23, z: -32, side: 'N', to: 'hid', kind: 'hidden' },
  { id: 'hid', fl: 'F1', x: 34, z: -37, side: 'S', to: 'corT_hid' },
  { id: 'hid_jail', fl: 'F1', x: 31, z: -44, side: 'N', to: 'jail', kind: 'shelf' },
  { id: 'jail', fl: 'F1', x: 31, z: -48, side: 'S', to: 'hid_jail' },
  { id: 'cor2_kids', fl: 'F2', x: 14, z: 2, side: 'N', to: 'kids', lock: 'k_kids' },
  { id: 'kids', fl: 'F2', x: 11, z: -6, side: 'S', to: 'cor2_kids' },
  { id: 'cor2_tk', fl: 'F2', x: 21, z: 2, side: 'N', to: 'tk' },
  { id: 'tk', fl: 'F2', x: 21, z: -6, side: 'S', to: 'cor2_tk' },
  { id: 'cor2_piano', fl: 'F2', x: 14, z: 12, side: 'N', to: 'piano', kind: 'stuck' },
  { id: 'piano', fl: 'F2', x: 5, z: 10, side: 'S', to: 'cor2_piano' },
  { id: 'cor3_attic', fl: 'F3', x: 15, z: 2, side: 'N', to: 'attic' },
  { id: 'atticBack', fl: 'F3', x: 14, z: -12, side: 'N', to: null, kind: 'back' },
  { id: 'attic', fl: 'F3', x: 15, z: -3, side: 'S', to: 'cor3_attic' },
  { id: 'cor3_bed', fl: 'F3', x: 14, z: 7, side: 'W', to: 'bed3', lock: 'k_bedroom' },
  { id: 'bed3', fl: 'F3', x: 8, z: 8, side: 'E', to: 'cor3_bed' },
];
// what you can carry; desc is the line at the top of the item screen
const ITEMS = {
  shard: { name: '皿の破片', icon: 'shard', desc: '割れた皿のかけら。ふちが鋭くとがっている。' },
  k_library: { name: '図書室の鍵', icon: 'key', color: '#d9b25a', desc: '１階・図書室の鍵。' },
  k_bedroom: { name: '寝室の鍵', icon: 'key', color: '#c9c9c9', desc: '３階・寝室の鍵。' },
  hanky: { name: 'ハンカチ', icon: 'cloth', desc: '白いハンカチ。汚れを拭き取るのに使えそうだ。' },
  hankySoap: { name: '洗剤をつけたハンカチ', icon: 'clothSoap', desc: '洗剤を染み込ませたハンカチ。しつこい汚れも落とせそうだ。' },
  driver: { name: '＋ドライバー', icon: 'driver', desc: 'プラスのドライバー。ネジを外せる。' },
  soap: { name: '洗剤', icon: 'soap', desc: '汚れ落としの洗剤。何かに染み込ませて使う。' },
  knob: { name: 'ドアノブ', icon: 'knob', desc: '屋根裏部屋の扉から外したドアノブ。' },
  k_kids: { name: '子供部屋の鍵', icon: 'key', color: '#e89ab0', desc: '２階・子供部屋の鍵。' },
  oil: { name: 'ライターオイル', icon: 'oil', desc: 'ライター用のオイル。' },
  lighter: { name: 'ライター', icon: 'lighter', desc: 'オイルを補給して使うライター。' },
  k_basement: { name: '地下室の鍵', icon: 'key', color: '#9a9a8a', desc: '地下室の鍵。' },
};
const SIDE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: 'S', S: 'N', W: 'E', E: 'W' };
const edgeKey = (fl, x, z, side) => gkey(fl, x, z) + side;

/* ---------- building ---------- */
function cellsOf(rect) { const out = []; for (let x = rect[0]; x < rect[0] + rect[2]; x++) for (let z = rect[1]; z < rect[1] + rect[3]; z++) out.push([x, z]); return out; }
function makeArea(def, i) {
  const r = new Room(i, def.id);
  Object.assign(r, { id: def.id, name: def.name, fl: def.fl, def, H: WALL_H, y: FLOORS[def.fl] });
  r.setTransform(new THREE.Vector3(0, FLOORS[def.fl], 0), 0);   // local x/z = world metres
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  const rects = def.cells.concat(STAIRS.filter(s => s.area === def.id).map(s => s.r));
  for (const c of rects) { x0 = Math.min(x0, c[0]); z0 = Math.min(z0, c[1]); x1 = Math.max(x1, c[0] + c[2]); z1 = Math.max(z1, c[1] + c[3]); }
  r.foot = { x0: tm(x0), x1: tm(x1), z0: tm(z0), z1: tm(z1), y0: -3, y1: WALL_H };
  r.surface = /tile|genkan|vinyl|brick/i.test(def.floor) ? 'tile' : 'wood';
  r.dark = !!def.dark;
  for (const c of def.cells) for (const [x, z] of cellsOf(c)) MAN.grid.set(gkey(def.fl, x, z), { area: r, x, z, fl: def.fl, stair: null, blocked: false });
  MAN.areas[def.id] = r; MAN.list.push(r);
  return r;
}
function floorAndCeiling(r) {
  const F = new Frame(r, 0, 0, 0, 0), fm = AOM[r.def.floor] || MAT.floor;
  for (const c of r.def.cells) {
    const w = tm(c[2]), d = tm(c[3]), mx = tm(c[0]) + w / 2, mz = tm(c[1]) + d / 2;
    if (r.def.floor === 'tatami') {   // tatami mats, two to a tile, the pairs turned every other tile
      for (let j = 0; j < c[3]; j++) for (let i = 0; i < c[2]; i++) for (const k of [-1, 1]) {
        const g = new THREE.PlaneGeometry(T - 0.03, T / 2 - 0.03); g.rotateX(-Math.PI / 2);
        const turn = (i + j) % 2, px = tm(c[0] + i) + T / 2, pz = tm(c[1] + j) + T / 2;
        F.geo(g, fm, px + (turn ? k * T / 4 : 0), 0.003, pz + (turn ? 0 : k * T / 4), 0, turn ? Math.PI / 2 : 0, 0);
      }
      F.box(w, 0.1, d, MAT.darkWood, mx, -0.05, mz);
    } else F.box(w, 0.1, d, fm, mx, -0.05, mz);
    r.addFloor(tm(c[0]), tm(c[0] + c[2]), tm(c[1]), tm(c[1] + c[3]), 0);
    if (!r.def.outdoor) F.box(w, 0.12, d, MAT.ceiling, mx, WALL_H + 0.06, mz);
  }
}
// walls on every tile edge where the floor stops (or meets another room that isn't joined to it)
function buildWalls(r) {
  const fl = r.fl, wm = AOM[r.def.wall] || MAT.plaster, runs = new Map();
  for (const cell of MAN.grid.values()) {
    if (cell.area !== r) continue;
    for (const side of ['N', 'S', 'W', 'E']) {
      const [dx, dz] = SIDE[side], nb = MAN.grid.get(gkey(fl, cell.x + dx, cell.z + dz));
      if (nb && (nb.area === r || MAN.open.has(edgeKey(fl, cell.x, cell.z, side)))) continue;
      if (MAN.doorEdges.has(edgeKey(fl, cell.x, cell.z, side))) continue;
      const along = side === 'N' || side === 'S' ? cell.x : cell.z, line = side === 'N' ? cell.z : side === 'S' ? cell.z + 1 : side === 'W' ? cell.x : cell.x + 1;
      const key = [side, line, cell.stair ? cell.stair.ceil : WALL_H, cell.stair ? 1 : 0].join('|');   // a stairwell's walls go up to its own ceiling
      if (!runs.has(key)) runs.set(key, []);
      runs.get(key).push(along);
    }
  }
  for (const [key, list] of runs) {
    const [side, ln, tp, st] = key.split('|'), line = +ln, top = +tp, skirt = st === '0';
    list.sort((a, b) => a - b);
    let s = list[0], p = list[0];
    for (let i = 1; i < list.length; i++) { if (list[i] === p + 1) { p = list[i]; continue; } wallRun(r, side, line, s, p + 1, wm, undefined, top, skirt); s = p = list[i]; }
    wallRun(r, side, line, s, p + 1, wm, undefined, top, skirt);
  }
}
// one straight wall along a tile line, standing just inside the room, with a skirting board
function wallRun(r, side, line, a, b, wm, y0 = -3.8, y1 = WALL_H, skirt = true) {
  const len = tm(b - a), mid = tm(a) + len / 2, h = y1 - y0, inward = side === 'N' || side === 'W' ? 1 : -1;
  const F = new Frame(r, 0, 0, 0, 0);
  if (side === 'N' || side === 'S') {
    const z = tm(line) + inward * WT / 2;
    r.batch.add(boxGeo(len, h, WT, wm, tm(a), y0), wm, F._m(mid, (y0 + y1) / 2, z));
    if (skirt && y0 < 0 && y1 > 0.2) F.box(len, 0.12, 0.03, MAT.trim, mid, 0.06, tm(line) + inward * (WT + 0.015));
    r.addCollider(tm(a), tm(b), y0, y1, z - WT / 2, z + WT / 2, 'wall');
  } else {
    const x = tm(line) + inward * WT / 2;
    r.batch.add(boxGeo(WT, h, len, wm, tm(a), y0), wm, F._m(x, (y0 + y1) / 2, mid));
    if (skirt && y0 < 0 && y1 > 0.2) F.box(0.03, 0.12, len, MAT.trim, tm(line) + inward * (WT + 0.015), 0.06, mid);
    r.addCollider(x - WT / 2, x + WT / 2, y0, y1, tm(a), tm(b), 'wall');
  }
}
// the middle of a tile edge, and the yaw that faces into the room from it
function edgeFrame(x, z, side) {
  const [dx, dz] = SIDE[side];
  const px = cx(x) + dx * T / 2, pz = cx(z) + dz * T / 2;
  const into = { x: -dx, z: -dz };
  return { px, pz, ry: Math.atan2(into.x, into.z), into };   // a Frame's +z faces into the room
}

/* ---------- doors ---------- */
function buildDoor(def) {
  const cell = MAN.grid.get(gkey(def.fl, def.x, def.z)), r = cell.area;
  const { px, pz, ry, into } = edgeFrame(def.x, def.z, def.side);
  const F = new Frame(r, px, 0, pz, ry), wm = def.kind === 'hidden' ? AOM.wallGrey : AOM[r.def.wall] || MAT.plaster, disguised = /^hidden/.test(def.kind || '');
  const door = { id: def.id, def, area: r, fl: def.fl, x: def.x, z: def.z, side: def.side, lock: def.lock || null, kind: def.kind || 'door', to: def.to, F };
  // the wall above the doorway and beside it (the tile is wider than a door)
  F.box(T, WALL_H - DR_H, WT, wm, 0, (DR_H + WALL_H) / 2, WT / 2);
  const side = (T - DW) / 2;
  for (const sx of [-1, 1]) {
    F.box(side, DR_H, WT, wm, sx * (DW / 2 + side / 2), DR_H / 2, WT / 2);
    F.box(side, 0.12, 0.03, MAT.trim, sx * (DW / 2 + side / 2), 0.06, WT + 0.015);
  }
  // the casing round the opening, standing a little proud of the wall
  const trims = new THREE.Group(); F.dyn(trims, 0, 0, 0);
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.1, DR_H + 0.05, 0.05), MAT.trim); t.position.set(sx * (DW / 2 + 0.03), (DR_H + 0.05) / 2, WT + 0.02); trims.add(t); }
  const lt = new THREE.Mesh(new THREE.BoxGeometry(DW + 0.26, 0.11, 0.06), MAT.trim); lt.position.set(0, DR_H + 0.08, WT + 0.025); trims.add(lt);
  // the leaf, flush with the face of the wall: brown, four raised panels, a brass knob each side
  const lw = DW - 0.06, lh = DR_H - 0.03, lt2 = 0.06, lz = WT - lt2 / 2;
  const piv = new THREE.Group(); F.dyn(piv, -DW / 2 + 0.03, 0, lz); piv.userData.baseRy = piv.rotation.y;
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, lt2), AOM.door);
  leaf.position.set(lw / 2, lh / 2 + 0.01, 0); leaf.castShadow = true; piv.add(leaf);
  const panels = [];
  for (const fz of [1, -1]) for (const [py, ph] of [[lh * 0.72, lh * 0.32], [lh * 0.3, lh * 0.42]]) for (const pxk of [0.27, 0.73]) {
    const pn = new THREE.Mesh(new THREE.BoxGeometry(lw * 0.36, ph, 0.016), AOM.doorPanel); pn.position.set(lw * pxk, py, fz * (lt2 / 2 + 0.006)); piv.add(pn); panels.push(pn);
  }
  const knobs = [];
  for (const fz of [1, -1]) {
    const k = new THREE.Group(); k.position.set(lw - 0.12, 1.02, fz * (lt2 / 2)); piv.add(k); knobs.push(k);
    const ro = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 14), AOM.knob); ro.rotation.x = Math.PI / 2; ro.position.z = fz * 0.006; k.add(ro);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 8), AOM.knob); st.rotation.x = Math.PI / 2; st.position.z = fz * 0.03; k.add(st);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), AOM.knob); ball.position.z = fz * 0.065; k.add(ball);
  }
  Object.assign(door, { piv, leaf, knobs, trims, panels });
  if (def.glass) glassDoor(door, lw, lh, lt2);   // the bath's: an aluminium frame round frosted glass
  if (disguised) { leaf.material = wm; knobs.forEach(k => (k.visible = false)); trims.visible = false; panels.forEach(p => (p.visible = false)); }
  door.front = new THREE.Vector3(cx(def.x) + into.x * 0.12, FLOORS[def.fl], cx(def.z) + into.z * 0.12);
  door.center = new THREE.Vector3(px, FLOORS[def.fl] + 1.2, pz);
  door.yawIn = Math.atan2(-into.x, -into.z);         // a camera with this yaw looks into the room
  const ax = Math.abs(into.x), az = Math.abs(into.z);
  r.addCollider(px - az * T / 2 - ax * 0.06, px + az * T / 2 + ax * 0.06, 0, DR_H, pz - ax * T / 2 - az * 0.06, pz + ax * T / 2 + az * 0.06, 'door');
  r.addInteract(leaf, { dist: 2.5, door: true, ref: door, prompt: () => GAME.doorPrompt(door), use: () => GAME.useDoor(door) });
  MAN.doors[def.id] = door; MAN.doorList.push(door);
  return door;
}
// a leaf swinging open and shut again (when someone goes through)
function animateDoor(door, amt = 1.15, dur = 650) {
  const t0 = performance.now();
  animate(() => {
    const k = (performance.now() - t0) / dur, a = Math.sin(Math.min(1, k) * Math.PI) * amt;
    door.piv.rotation.y = door.piv.userData.baseRy - a;
    return k < 1;
  });
}

/* ---------- stairs ---------- */
function buildStairs(s) {
  const r = MAN.areas[s.area], [x, z, w, h] = s.r, n = h * 4, F = new Frame(r, 0, 0, 0, 0);
  const north = s.dir === 'N', up = s.rise > 0, wm = AOM[r.def.wall] || MAT.plaster;
  Object.assign(s, { entryZ: north ? z + h : z, farZ: north ? z : z + h, x0: x, x1: x + w, room: r, len: tm(h) });
  s.ceil = up ? s.rise + 3.0 : WALL_H;   // a flight going up has its own, higher stairwell
  r.addFloor(tm(x), tm(x + w), tm(z), tm(z + h), 0, s.rise, 'z', tm(s.entryZ), tm(s.farZ));
  const depth = tm(h) / n, wd = tm(w), mx = tm(x) + wd / 2, dirZ = north ? -1 : 1;
  const sw = wd - 2 * WT + 0.02;   // the steps run between the walls (or banisters) either side, not into the same plane as them
  for (let i = 0; i < n; i++) {
    const zz = tm(s.entryZ) + dirZ * (i + 0.5) * depth, top = s.rise * (i + 1) / n;
    if (up) F.box(sw, top, depth + 0.01, MAT.darkWood, mx, top / 2, zz);
    else F.box(sw, top - s.rise + 0.3, depth + 0.01, MAT.darkWood, mx, (top + s.rise - 0.3) / 2, zz);
    F.box(sw, 0.025, 0.05, MAT.trim, mx, top + 0.01, zz - dirZ * depth / 2);
  }
  for (const [tx, tz] of cellsOf(s.r)) MAN.grid.set(gkey(s.fl, tx, tz), { area: r, x: tx, z: tz, fl: s.fl, stair: s, blocked: false });
  // the ceiling over the flight, and where a stairwell rises above the room, the wall over its mouth
  F.box(wd, 0.12, tm(h), MAT.ceiling, mx, s.ceil + 0.06, tm(z) + tm(h) / 2);
  if (s.ceil > WALL_H) F.box(wd, s.ceil - WALL_H, WT, wm, mx, (WALL_H + s.ceil) / 2, tm(s.entryZ) + dirZ * WT / 2);
  // its far end runs on into the dark: a black way on, the width of the flight
  const beyond = MAN.grid.get(gkey(s.fl, x, north ? z - 1 : z + h)), under = !up && beyond && beyond.area === r && !beyond.stair;
  const vy0 = s.rise - 0.05, vy1 = up ? s.ceil - 0.35 : under ? -0.02 : s.rise + 2.9, vz = tm(s.farZ) - dirZ * (WT + 0.012);
  addVeil(r, tm(x), vz, tm(x + w), vz, vy0, vy1);
  F.box(wd, 0.12, 0.08, MAT.trim, mx, vy1 + 0.06, vz - dirZ * 0.04);
  addBulb(r, mx, s.ceil, tm(s.entryZ) + dirZ * tm(h) * 0.45, { intensity: 3.4, range: 10, drop: 0.5 });
  MAN.stairs[s.id] = s;
}
// walls beside a flight where it runs next to open floor: a banister round a flight going down, a wall up to
// the stairwell's ceiling beside one going up
function stairRails(s) {
  const r = s.room, up = s.rise > 0, lo = Math.min(0, s.rise) - 0.5, hi = up ? s.ceil : 1.0, mat = up ? AOM[r.def.wall] || MAT.plaster : MAT.trim;
  const [x, z, w, h] = s.r;
  for (let zz = z; zz < z + h; zz++) for (const [side, xx] of [['W', x], ['E', x + w - 1]]) {
    const [dx] = SIDE[side], nb = MAN.grid.get(gkey(s.fl, xx + dx, zz));
    if (nb && nb.area === r && !nb.stair) wallRun(r, side, side === 'W' ? xx : xx + 1, zz, zz + 1, mat, lo, hi, false);
  }
  const fz = s.dir === 'N' ? z - 1 : z + h, nb = MAN.grid.get(gkey(s.fl, x, fz));
  if (nb && nb.area === r && !nb.stair) wallRun(r, s.dir === 'N' ? 'N' : 'S', s.dir === 'N' ? z : z + h, x, x + w, mat, lo, hi, false);
}
// the black that stands where the original's screen ends: you can't see past it, and walking into it takes you on
function addVeil(r, ax, az, bx, bz, y0, y1) {
  const len = Math.hypot(bx - ax, bz - az), m = new THREE.Mesh(new THREE.PlaneGeometry(len + 0.02, y1 - y0), AOM.veil);
  m.position.set((ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2); m.rotation.y = Math.atan2(-(bz - az), bx - ax);
  r.group.add(m);
  MAN.veils.push({ ax, az, bx, bz, y0: r.y + y0, y1: r.y + y1 });
}
// how dark it is for eyes at p (feet at feetY) from being in, or right by, one of those
function veilDark(p, feetY) {
  let k = 0;
  for (const v of MAN.veils) {
    if (feetY < v.y0 - 0.4 || feetY > v.y1 - 0.5) continue;
    const dx = v.bx - v.ax, dz = v.bz - v.az, t = clamp(((p.x - v.ax) * dx + (p.z - v.az) * dz) / (dx * dx + dz * dz), 0, 1);
    const d = Math.hypot(p.x - (v.ax + dx * t), p.z - (v.az + dz * t));
    k = Math.max(k, clamp(1 - (d - 0.5) / 1.5, 0, 1));
  }
  return k;
}
// how far along a flight a point is (0 at its entry, 1 at its far end), and the point at a given fraction
function stairS(s, p) { return (p.z - tm(s.entryZ)) / (tm(s.farZ) - tm(s.entryZ)); }
function stairPoint(s, k) { return new THREE.Vector3(tm(s.x0) + tm(s.x1 - s.x0) / 2, FLOORS[s.fl] + s.rise * k, lerp(tm(s.entryZ), tm(s.farZ), k)); }
function onStair(s, p) { return Math.abs(p.y - FLOORS[s.fl]) < 4 && p.x > tm(s.x0) && p.x < tm(s.x1) && p.z > tm(s.r[1]) && p.z < tm(s.r[1] + s.r[3]); }

/* ---------- the safe's figures (6.23): white keys as the black keys leave them, two of them upside down ---------- */
const KEY_SHAPES = {
  C: [[0, 0], [22, 0], [22, 60], [40, 60], [40, 100], [0, 100]],
  D: [[11, 0], [29, 0], [29, 60], [40, 60], [40, 100], [0, 100], [0, 60], [11, 60]],
  E: [[18, 0], [40, 0], [40, 100], [0, 100], [0, 60], [18, 60]],
};
const SAFE_FIGURES = [['E', true], ['D', false], ['E', false], ['C', true]];   // reads: right key turned, middle, right, left key turned
const figurePts = (k, rot) => KEY_SHAPES[k].map(([x, y]) => (rot ? [40 - x, 100 - y] : [x, y]));
function safeFaceCanvas() {
  const c = newCanvas(512, 256), g = c.getContext('2d');
  g.fillStyle = '#111'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#777'; g.lineWidth = 3; g.strokeRect(12, 12, 488, 232);
  g.fillStyle = '#555'; g.beginPath(); g.arc(88, 128, 46, 0, TAU); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 3; g.beginPath(); g.arc(88, 128, 36, 0, TAU); g.stroke();
  g.strokeStyle = '#e6e6e6'; g.lineWidth = 7; g.lineJoin = 'miter';
  SAFE_FIGURES.forEach(([k, rot], i) => { g.beginPath(); figurePts(k, rot).forEach(([x, y], j) => (j ? g.lineTo : g.moveTo).call(g, 178 + i * 82 + x * 1.35, 60 + y * 1.36)); g.closePath(); g.stroke(); });
  return c;
}

/* ---------- furniture of this house ---------- */
function box(r, w, h, d, mat, x, y, z, ry = 0, collide = true) {
  const F = new Frame(r, x, 0, z, ry); F.box(w, h, d, mat, 0, y + h / 2, 0);
  if (collide) F.collide(-w / 2, w / 2, y, y + h, -d / 2, d / 2);
  return F;
}
// furniture that can be pushed: its own group of meshes and a collider that follows it
function movable(r, x, z, w, d, h) {
  const g = new THREE.Group(); g.position.set(x, 0, z); r.group.add(g);
  const col = r.addCollider(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, 'furn');
  return {
    g, col, r, w, d, at: 0,
    add(geo, mat, px, py, pz) { const o = new THREE.Mesh(geo, mat); o.position.set(px, py, pz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; },
    slide(nx, nz, dur = 500) {
      const fx = g.position.x, fz = g.position.z, t0 = performance.now();
      col.lx0 = nx - w / 2; col.lx1 = nx + w / 2; col.lz0 = nz - d / 2; col.lz1 = nz + d / 2; this.r._colliderWorld(col);
      SFX.push && SFX.push(new THREE.Vector3(nx, this.r.y + 0.5, nz));
      animate(() => { const k = Math.min(1, (performance.now() - t0) / dur); g.position.x = lerp(fx, nx, smoothstep(0, 1, k)); g.position.z = lerp(fz, nz, smoothstep(0, 1, k)); return k < 1; });
    },
    place(nx, nz) { g.position.x = nx; g.position.z = nz; col.lx0 = nx - w / 2; col.lx1 = nx + w / 2; col.lz0 = nz - d / 2; col.lz1 = nz + d / 2; this.r._colliderWorld(col); },
    // carried (or pushed) into another room: it belongs to that room now
    moveTo(room) {
      if (room === this.r) return;
      const i = this.r.colliders.indexOf(col); if (i >= 0) this.r.colliders.splice(i, 1); room.colliders.push(col);
      // what you can do with it goes along too (you only reach the things of the room you are in)
      const k = this.r.interactables.indexOf(g); if (k >= 0) { this.r.interactables.splice(k, 1); room.interactables.push(g); g.userData.ia.room = room; }
      room.group.add(g); this.r = room; room._colliderWorld(col);
    },
  };
}
// a tall two-door wardrobe (the original's closet): front is local +z
function addTansu(r, x, z, ry, opt = {}) {
  const F = new Frame(r, x, 0, z, ry), W = 1.02, H = 2.3, D = 0.7, wood = opt.mat || MAT.darkWood;
  F.box(W, H, 0.04, wood, 0, H / 2, -D / 2 + 0.02);
  F.box(0.05, H, D, wood, -W / 2 + 0.025, H / 2, 0); F.box(0.05, H, D, wood, W / 2 - 0.025, H / 2, 0);
  F.box(W + 0.06, 0.08, D + 0.04, wood, 0, H + 0.04, 0); F.box(W, 0.1, D, wood, 0, 0.05, 0);
  F.box(W - 0.08, H - 0.2, 0.02, MAT.black, 0, H / 2, -D / 2 + 0.05);
  F.cyl(0.012, 0.012, W - 0.1, MAT.brass, 0, H - 0.25, -0.05, 6, 0, 0, Math.PI / 2);
  const doors = [];
  for (const sd of [-1, 1]) {
    const piv = new THREE.Group(); F.dyn(piv, sd * (W / 2 - 0.03), 0, D / 2 - 0.02); piv.userData.baseRy = piv.rotation.y;
    const dw = W / 2 - 0.045, leaf = new THREE.Mesh(boxGeo(dw, H - 0.18, 0.035, wood), wood);
    leaf.position.set(-sd * dw / 2, H / 2 + 0.02, 0); leaf.castShadow = true; piv.add(leaf);
    const inset = new THREE.Mesh(boxGeo(dw - 0.12, 0.8, 0.012, wood), wood); inset.position.set(-sd * dw / 2, H * 0.66, 0.022); piv.add(inset);
    const inset2 = inset.clone(); inset2.position.y = H * 0.3; piv.add(inset2);
    const kb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), MAT.brass); kb.position.set(-sd * (dw - 0.06), H * 0.5, 0.03); piv.add(kb);
    doors.push(piv);
  }
  F.collide(-W / 2, W / 2, 0, H + 0.08, -D / 2, D / 2);
  const hide = { type: 'closet', room: r, camL: F.pt(0, 1.52, D / 2 - 0.12), exitL: F.pt(0, 0, D / 2 + 0.6), yawL: ry + Math.PI, doors, F, blockedUntil: 0 };
  r.hides.push(hide); MAN.hides.push(hide);
  for (const d of doors) r.addInteract(d, { dist: 2.4, icon: 'hide', prompt: () => (PLAYER.hidden ? null : hide.prompt ? hide.prompt() : 'クローゼットに隠れる'), use: () => (hide.use ? hide.use() : GAME.enterHide(hide)) });
  return hide;
}
function addSimpleBed(r, x, z, opt = {}) {
  const W = opt.w || 1.0, L = 2.0, wood = MAT.darkWood, b = movable(r, x, z, W + 0.06, L + 0.06, 0.95);
  b.add(new THREE.BoxGeometry(W + 0.06, 0.9, 0.06), wood, 0, 0.45, -L / 2);
  b.add(new THREE.BoxGeometry(W + 0.06, 0.5, 0.06), wood, 0, 0.25, L / 2);
  b.add(new THREE.BoxGeometry(W, 0.28, L), wood, 0, 0.2, 0);
  b.add(new THREE.BoxGeometry(W - 0.04, 0.16, L - 0.1), MAT.sheet, 0, 0.42, 0);
  b.add(new THREE.BoxGeometry(W, 0.06, L * 0.62), opt.blanket || MAT.blanket, 0, 0.52, L * 0.18);
  b.add(new THREE.BoxGeometry(W * 0.7, 0.1, 0.32), MAT.sheet, 0, 0.53, -L / 2 + 0.3);
  return b;
}
function addChairW(r, x, z, ry, mat = AOM.white) {
  const c = movable(r, x, z, 0.48, 0.48, 0.9), g = new THREE.Group(); g.rotation.y = ry; c.g.add(g);
  const add = (w, h, d, px, py, pz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(px, py, pz); o.castShadow = true; g.add(o); };
  add(0.44, 0.05, 0.44, 0, 0.46, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(0.04, 0.46, 0.04, sx * 0.19, 0.23, sz * 0.19);
  add(0.44, 0.5, 0.04, 0, 0.74, -0.2);
  return c;
}
// a grand piano: the keyboard faces local +z, the tail runs back to -z, and the lid is propped up on the curved side
const PIANO_OUTLINE = [['m', -0.74, 0.3], ['l', 0.74, 0.3], ['l', 0.74, -0.15], ['q', 0.42, -0.45, 0.3, -0.95], ['q', 0.18, -1.55, -0.3, -1.58], ['q', -0.72, -1.6, -0.74, -1.2], ['l', -0.74, 0.3]];
function pianoShape(dx = 0, k = 1, cz = -0.62) {   // (x, z) seen from above; shape y is -z
  const sh = new THREE.Shape(), P = (x, z) => [(x * k) + dx, -(cz + (z - cz) * k)];
  for (const [op, ...v] of PIANO_OUTLINE) {
    if (op === 'm') sh.moveTo(...P(v[0], v[1])); else if (op === 'l') sh.lineTo(...P(v[0], v[1]));
    else { const c = P(v[0], v[1]), e = P(v[2], v[3]); sh.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
  }
  return sh;
}
function stringsTex() {
  const c = newCanvas(256, 256), g = c.getContext('2d');
  g.fillStyle = '#9c7c34'; g.fillRect(0, 0, 256, 256);
  for (let x = 2; x < 256; x += 6) { g.fillStyle = 'rgba(235,225,200,.7)'; g.fillRect(x, 0, 1.2, 256); }
  for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(40,28,10,.6)'; g.beginPath(); g.arc(30 + i * 26, 60 + (i % 3) * 60, 7, 0, TAU); g.fill(); }
  return toTex(c, true, true);
}
function addPiano(room, x, z, ry) {
  const F = new Frame(room, x, 0, z, ry), black = std({ color: 0x070707, roughness: 0.16, metalness: 0.15, envMap: ENV, envMapIntensity: 1.0 });
  const ivory = std({ color: 0xf3efe4, roughness: 0.35 }), dark = MAT.black;
  // the case, and inside it the gold plate and strings
  const body = new THREE.ExtrudeGeometry(pianoShape(), { depth: 0.3, bevelEnabled: false, curveSegments: 18 }); body.rotateX(-Math.PI / 2);
  F.geo(body, black, 0, 0.64, 0);
  const plate = new THREE.ShapeGeometry(pianoShape(0, 0.93), 18); plate.rotateX(-Math.PI / 2);
  const tx = stringsTex(); tx.repeat.set(1.6, 1.6); room.textures.push(tx);
  F.geo(plate, std({ map: tx, color: 0xffffff, metalness: 0.45, roughness: 0.45 }), 0, 0.945, 0);
  // the lid: hinged along the straight side, held up by its stick
  const lid = new THREE.ExtrudeGeometry(pianoShape(0.74), { depth: 0.025, bevelEnabled: false, curveSegments: 18 }); lid.rotateX(-Math.PI / 2);
  const th = 0.6; F.geo(lid, black, -0.74, 0.945, 0, 0, 0, th);
  const lx = -0.74 + 1.26 * Math.cos(th), ly = 0.945 + 1.26 * Math.sin(th), sx = 0.56, sy = 0.94;
  F.cyl(0.012, 0.012, Math.hypot(lx - sx, ly - sy), black, (lx + sx) / 2, (ly + sy) / 2, -0.35, 6, 0, 0, Math.atan2(sx - lx, ly - sy));
  // the keyboard in front of the case
  F.box(1.56, 0.07, 0.34, black, 0, 0.665, 0.39);
  F.box(1.36, 0.03, 0.16, ivory, 0, 0.71, 0.47);
  for (let i = 1; i < 52; i++) F.box(0.002, 0.031, 0.16, dark, -0.68 + i * (1.36 / 52), 0.711, 0.47);
  for (let i = 0; i < 51; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) F.box(0.014, 0.022, 0.095, dark, -0.68 + (i + 1) * (1.36 / 52), 0.736, 0.432);
  for (const sx2 of [-1, 1]) F.box(0.1, 0.12, 0.34, black, sx2 * 0.73, 0.7, 0.39);
  F.box(1.46, 0.045, 0.02, black, 0, 0.675, 0.565);
  F.box(1.36, 0.12, 0.03, black, 0, 0.77, 0.32, -0.2, 0, 0);
  F.box(0.8, 0.3, 0.02, black, 0, 1.1, 0.16, -0.28, 0, 0); F.box(0.8, 0.03, 0.06, black, 0, 0.96, 0.19);
  // legs, the pedals, the bench
  for (const [gx, gz] of [[-0.62, 0.18], [0.62, 0.18], [-0.32, -1.35]]) {
    F.cyl(0.06, 0.045, 0.6, black, gx, 0.32, gz, 12); F.box(0.15, 0.08, 0.15, black, gx, 0.6, gz); F.geo(new THREE.SphereGeometry(0.035, 8, 6), MAT.brass, gx, 0.035, gz);
  }
  F.box(0.24, 0.5, 0.04, black, 0, 0.37, -0.05); F.box(0.3, 0.05, 0.12, black, 0, 0.1, -0.02);
  for (const px of [-0.08, 0, 0.08]) F.box(0.03, 0.02, 0.13, MAT.brass, px, 0.1, 0.08);
  const bz = 1.05;
  F.box(0.78, 0.06, 0.36, black, 0, 0.47, bz); F.box(0.74, 0.06, 0.32, MAT.velvetRed, 0, 0.53, bz);
  for (const ax of [-1, 1]) for (const az of [-1, 1]) F.box(0.05, 0.44, 0.05, black, ax * 0.34, 0.22, bz + az * 0.14);
  F.collide(-0.78, 0.78, 0, 1.1, -1.6, 0.58); F.collide(-0.4, 0.4, 0, 0.56, bz - 0.19, bz + 0.19);
  // the red stain over three of the keys (wiped off with the soapy handkerchief)
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.12), new THREE.MeshStandardMaterial({ color: 0x5a0a0a, roughness: 0.4 }));
  st.rotation.x = -Math.PI / 2; st.position.copy(F.pt(0.05, 0.751, 0.49)); st.userData.ownMat = true; room.group.add(st);
  return { F, stain: st };
}
// a lamp over a tile edge hangs a little off it, so it never lights a wall on that line edge-on (its shadows break up)
const offEdge = v => (Number.isInteger(v) ? v + 0.11 : v);
function lamp(r, x, z, opt = {}) { return addBulb(r, offEdge(x) * T, WALL_H, offEdge(z) * T, Object.assign({ intensity: 4.6, range: 13, drop: 0.7 }, opt)); }
function interactBox(room, x, y, z, w, h, d, prompt, use, opt = {}) {
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(x, y, z); room.group.add(hit);
  room.addInteract(hit, Object.assign({ dist: 2.4, prompt, use }, opt));
  return hit;
}
function examine(r, x, y, z, w, h, d, prompt, fn) { return interactBox(r, x, y, z, w, h, d, prompt, fn, { icon: 'eye' }); }
// where something can be picked up: one small light, twinkling, as in the original
let SPARKLE_TEX = null;
function sparkleTex() {
  if (SPARKLE_TEX) return SPARKLE_TEX;
  const c = newCanvas(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 40);
  gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.25, 'rgba(255,240,180,.55)'); gr.addColorStop(1, 'rgba(255,220,140,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#fff';
  for (const [w, l] of [[5, 60], [3, 34]]) for (let k = 0; k < (l > 40 ? 2 : 2); k++) { g.save(); g.translate(64, 64); g.rotate(k * Math.PI / 2 + (l > 40 ? 0 : Math.PI / 4)); g.beginPath(); g.moveTo(-l, 0); g.lineTo(0, -w); g.lineTo(l, 0); g.lineTo(0, w); g.closePath(); g.fill(); g.restore(); }
  return (SPARKLE_TEX = toTex(c, true, false));
}
function shineAt(r, x, y, z, id, visible = true) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkleTex(), color: 0xfff6d8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.userData.ownMat = true; m.userData.phase = Math.random() * 6; m.position.set(x, y + 0.12, z); m.scale.setScalar(0.42);
  r.group.add(m); m.visible = visible;
  MAN.props[id] = m; MAN.sparkles.push(m);
  return m;
}
function twinkle(t) { for (const s of MAN.sparkles) if (s.visible) { const k = 0.8 + 0.35 * Math.max(0, Math.sin(t * 4.2 + s.userData.phase)); s.scale.setScalar(0.42 * k); s.material.rotation = t * 0.9 + s.userData.phase; } }

const FURNISH = {
  foyer(r) {
    box(r, tm(7), 0.03, T, AOM.genkan, tm(16.5), 0, tm(5.5), 0, false);   // the genkan by the front door
    box(r, T, 0.03, T, AOM.genkan, tm(16.5), 0, tm(6.5), 0, false);
    const sp = r.spawn = { x: tm(16.2), z: tm(2.7), yaw: 0 };
    r.friendsAt = [[sp.x - 2.4, sp.z - 2.0], [sp.x - 0.4, sp.z - 2.8], [sp.x + 2.2, sp.z - 2.1]];   // round you, a couple of steps away
  },
  toilet(r) {
    // the toilet in the stall, a see-through shelf by the way in (the detergent is in it)
    const tF = new Frame(r, cx(-3) + 0.15, 0, cx(6), -Math.PI / 2);
    tF.box(0.42, 0.42, 0.6, AOM.white, 0, 0.21, 0); tF.box(0.44, 0.5, 0.2, AOM.white, 0, 0.6, -0.36); tF.box(0.38, 0.04, 0.5, AOM.white, 0, 0.44, 0.02);
    tF.collide(-0.24, 0.24, 0, 0.8, -0.45, 0.32);
    const sh = new Frame(r, cx(-5), 0, tm(1) + 0.25, 0);
    sh.box(0.8, 1.6, 0.36, MAT.trim, 0, 0.8, -0.02); sh.box(0.74, 1.5, 0.02, MAT.glass, 0, 0.82, 0.18);
    for (let i = 0; i < 3; i++) sh.box(0.74, 0.02, 0.3, MAT.glass, 0, 0.35 + i * 0.45, 0);
    sh.collide(-0.4, 0.4, 0, 1.6, -0.18, 0.18);
    const sp = sh.pt(0.15, 0.81, 0); shineAt(r, sp.x, sp.y, sp.z, 'soap');
    examine(r, cx(-5), 1.0, tm(1) + 0.3, 0.9, 1.6, 0.5, () => (STORY.hasGot('soap') ? null : '棚を調べる'), () => STORY.event('soap'));
    examine(r, cx(-3), 0.5, cx(6), 0.6, 0.9, 0.7, () => 'トイレ', () => GAME.say([['', 'トイレだ。']]));
  },
  bath(r) {
    // left: the bath (pink tub, dark blue tiles); right: the washroom (washing machine, basin)
    box(r, tm(3) - 0.02, 0.01, tm(2) - 0.02, AOM.tileBlue, tm(-0.5), 0, tm(-8), 0, false);
    buildTub(r, new Frame(r, cx(-2), 0, tm(-8), 0));   // (93_bath)
    const sw = new Frame(r, cx(-1), 0, tm(-9) + 0.12, 0); sw.cyl(0.015, 0.015, 1.2, MAT.steel, -0.2, 1.4, 0, 6); sw.cyl(0.06, 0.04, 0.05, MAT.steel, -0.2, 2.0, 0.05, 10, Math.PI / 2, 0, 0);
    sw.box(0.6, 0.8, 0.02, MAT.glass, 0.35, 1.6, 0);
    const wm = new Frame(r, cx(3), 0, tm(-9) + 0.4, 0);
    wm.box(0.6, 0.85, 0.6, AOM.white, 0, 0.425, 0); wm.cyl(0.2, 0.2, 0.02, std({ color: 0x3050c0, roughness: 0.3 }), 0, 0.86, 0, 16); wm.collide(-0.3, 0.3, 0, 0.9, -0.3, 0.3);
    const sk = new Frame(r, cx(4), 0, tm(-9) + 0.3, 0);
    sk.box(0.55, 0.8, 0.45, std({ color: 0xb8662a, roughness: 0.5 }), 0, 0.4, 0); sk.box(0.58, 0.08, 0.48, AOM.white, 0, 0.84, 0); sk.box(0.45, 0.6, 0.02, MAT.glass, 0, 1.45, -0.2);
    sk.collide(-0.28, 0.28, 0, 0.9, -0.24, 0.24);
    examine(r, cx(-2), 0.6, tm(-8), 1.0, 0.7, 2.1, () => (STORY.hasGot('driver') || MAN.tub.draining ? null : '浴槽を調べる'), () => STORY.event('tub'));
    examine(r, cx(3), 0.6, tm(-9) + 0.4, 0.6, 1.0, 0.6, () => '洗濯機', () => GAME.say([['', '洗濯機だ。中はからっぽだ。']]));
  },
  kitchen(r) {
    const ox = 34, oz = -6;
    // the back wall: fridge, counter and cabinets; the island with the sink and the stove
    box(r, 0.8, 1.9, 0.7, std({ color: 0xc9cdd2, roughness: 0.35, metalness: 0.2 }), tm(ox + 3.5), 0, tm(oz) + 0.5);
    box(r, tm(4) - 0.1, 0.9, 0.6, AOM.teal, tm(ox + 6), 0, tm(oz) + 0.45);
    box(r, tm(4) - 0.1, 0.04, 0.62, AOM.white, tm(ox + 6), 0.9, tm(oz) + 0.45, 0, false);
    box(r, tm(4) - 0.1, 0.7, 0.36, AOM.teal, tm(ox + 6), 1.65, tm(oz) + 0.33, 0, false);
    const isl = new Frame(r, tm(ox + 6), 0, tm(oz + 1.9), 0);
    isl.box(tm(4) - 0.1, 0.85, 0.7, AOM.teal, 0, 0.425, 0); isl.box(tm(4) - 0.06, 0.05, 0.74, AOM.white, 0, 0.87, 0);
    isl.box(0.5, 0.06, 0.38, MAT.steel, -0.7, 0.88, 0); isl.box(0.5, 0.03, 0.4, MAT.black, 1.2, 0.9, 0);
    for (const sx of [1.05, 1.35]) isl.cyl(0.09, 0.09, 0.01, MAT.iron, sx, 0.92, 0, 12);
    isl.collide(-tm(2), tm(2), 0, 0.9, -0.37, 0.37);
    // the dining table and its four white chairs
    const tcx = tm(ox + 4.55), tcz = tm(oz + 4.8), tb = new Frame(r, tcx, 0, tcz, 0);
    tb.box(2.6, 0.06, 4.6, MAT.wood, 0, 0.76, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) tb.box(0.08, 0.74, 0.08, MAT.darkWood, sx * 1.2, 0.37, sz * 2.2);
    tb.collide(-1.3, 1.3, 0, 0.8, -2.3, 2.3);
    for (const [sx, dz] of [[-1, -1.3], [-1, 1.5], [1, -0.4], [1, 1.7]]) addChairW(r, tcx + sx * 1.72, tcz + dz, -sx * Math.PI / 2);
    // the broken plate
    const shards = new THREE.Group(), plate = std({ color: 0xf2efe8, roughness: 0.35 });
    for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06 + Math.random() * 0.05, 0.04, 0.012, 3 + (i % 3)), plate); s.position.set((Math.random() - 0.5) * 0.6, 0.006, (Math.random() - 0.5) * 0.5); s.rotation.y = Math.random() * TAU; shards.add(s); }
    shards.position.set(tm(ox + 3.4), 0, tm(oz + 1.6)); r.group.add(shards); MAN.props.plate = shards;
    interactBox(r, tm(ox + 3.4), 0.15, tm(oz + 1.6), 0.9, 0.4, 0.8, () => (STORY.hasGot('shard') ? null : '割れたお皿を調べる'), () => STORY.event('plate'), { icon: 'eye' });
    // the living corner: a rug and an L-shaped sofa
    const lx = tm(ox + 3.6), lz = tm(oz + 11);
    box(r, 7.4, 0.012, 5.6, AOM.rug, lx, 0, lz, 0, false);
    box(r, 7.1, 0.014, 5.3, AOM.rug, lx, 0, lz, 0, false);
    addSofa(r, lx + 2.3, lz - 0.66, -Math.PI / 2, AOM.grey, 2.2);
    addSofa(r, lx - 0.66, lz + 1.9, 0, AOM.grey, 2.4);
    box(r, 1.0, 0.4, 0.6, MAT.darkWood, lx - 0.1, 0, lz - 0.44);
  },
  library(r) {
    const ox = 17, oz = -25;
    const shelf = (c0, z, tall = true) => addBookshelf(r, tm(ox + c0 + 1.5), tm(oz + z), 0, tm(3) - 0.15, tall ? 3.0 : 1.2);
    for (const c of [0, 3, 10, 13]) shelf(c, 3.0);
    for (const c of [0, 10, 13]) shelf(c, 7.0);
    shelf(7, 10.1, false); shelf(10, 10.1, false);
    shelf(7, 14.0);   // the corner by the way in is left open: from the door you see across to the middle aisle
    // the messy table
    const TW = 3.2, TL = 5.4, tb = new Frame(r, tm(ox + 1.95), 0, tm(oz + 12.3), 0);
    tb.box(TW, 0.06, TL, MAT.darkWood, 0, 0.78, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tb.box(0.08, 0.76, 0.08, MAT.darkWood, sx * (TW / 2 - 0.12), 0.38, sz * (TL / 2 - 0.12));
    tb.collide(-TW / 2, TW / 2, 0, 0.82, -TL / 2, TL / 2);
    for (let i = 0; i < 14; i++) { const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), MAT.paper); pg.rotation.set(-Math.PI / 2, 0, Math.random() * TAU); pg.position.copy(tb.pt((Math.random() - 0.5) * (TW - 0.4), 0.815, (Math.random() - 0.5) * (TL - 0.4))); r.group.add(pg); }
    for (let i = 0; i < 6; i++) { const bk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.28), std({ color: [0x7a2a2a, 0x2a4a7a, 0x6a5a2a, 0x8a7a3a][i % 4], roughness: 0.7 })); bk.position.copy(tb.pt((Math.random() - 0.5) * (TW - 0.8), 0.835, (Math.random() - 0.5) * (TL - 0.8))); bk.rotation.y = Math.random() * TAU; r.group.add(bk); }
    // the lone green book: the bedroom key is under it
    const gb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.32), std({ color: 0x2e7a3a, roughness: 0.6 })); gb.position.copy(tb.pt(TW / 2 - 0.45, 0.84, 1.6)); r.group.add(gb); MAN.props.greenBook = gb;
    shineAt(r, gb.position.x, 0.83, gb.position.z, 'k_bedroom', false);
    interactBox(r, gb.position.x, 0.9, gb.position.z, 0.5, 0.3, 0.5, () => (STORY.hasGot('k_bedroom') ? null : (STORY.flags.bookMoved ? '寝室の鍵を拾う' : '本を調べる')), () => STORY.event('greenBook'), { icon: 'eye' });
    box(r, 0.45, 0.45, 0.45, MAT.darkWood, tm(ox + 0.5), 0, tm(oz + 15.5));
    // a moment's sight of it (as in the original, about three seconds): it crosses the near aisle, right to left,
    // and is gone behind the tall shelf by the way in (seen from just inside it)
    r.oniGlimpse = [[ox + 11.2, oz + 12.1], [ox + 4.6, oz + 12.1]].map(([x, z]) => [tm(x), tm(z)]);
    r.glimpseAt = { x: tm(ox + 14.5), z: tm(oz + 16.4) };
    r.oniSpawn = [tm(ox + 4.5), tm(oz + 4.8)];
  },
  corT(r) {
    // the slightly greyer wallpaper on the right; the middle of it covers the door until it is cut
    for (const x of [22, 24]) { const F = new Frame(r, cx(x), 0, tm(-32) + WT + 0.012, 0); F.box(T, WALL_H - 0.1, 0.01, AOM.wallGrey, 0, (WALL_H - 0.1) / 2 + 0.05, 0); }
    const cover = MAN.greyCover = new THREE.Group(); r.group.add(cover);
    const pan = new THREE.Mesh(new THREE.BoxGeometry(T, WALL_H - 0.1, 0.01), AOM.wallGrey); pan.position.set(cx(23), (WALL_H - 0.1) / 2 + 0.05, tm(-32) + WT + 0.012); cover.add(pan);
    const sk = new THREE.Mesh(new THREE.BoxGeometry(DW + 0.02, 0.12, 0.03), MAT.trim); sk.position.set(cx(23), 0.06, tm(-32) + WT + 0.015); cover.add(sk);   // the skirting runs on over it
  },
  tatami(r) {
    // fusuma along the back: the right pair is where it comes out from; the left pair hides the lighter
    const F = new Frame(r, tm(15), 0, tm(-40) + WT + 0.02, 0);
    F.box(tm(6), 0.4, 0.08, MAT.darkWood, 0, 2.4, 0.02); F.box(tm(6), 0.06, 0.1, MAT.darkWood, 0, 0.03, 0.02);
    MAN.fusuma = [];
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(tm(1.5) - 0.03, 2.14, 0.04), AOM.fusuma); p.position.copy(F.pt(-tm(2.25) + i * tm(1.5), 1.1, 0.04 + (i % 2) * 0.05)); r.group.add(p);
      p.userData.home = p.position.clone(); MAN.fusuma.push(p);
    }
    F.box(tm(6) - 0.02, 2.14, 0.02, MAT.black, 0, 1.1, -0.02);
    examine(r, tm(13.5), 1.1, tm(-40) + 0.3, tm(3) - 0.1, 2.0, 0.4, () => (STORY.hasGot('lighter') ? null : 'ふすまを調べる'), () => STORY.event('fusumaL'));
    examine(r, tm(16.5), 1.1, tm(-40) + 0.3, tm(3) - 0.1, 2.0, 0.4, () => 'ふすまを調べる', () => STORY.event('fusumaR'));
    box(r, 0.6, 0.35, 0.6, MAT.darkWood, tm(17.5) - 0.3, 0, tm(-35));
  },
  hidden(r) {
    const ox = 30, oz = -44;
    // the bookshelf that hides the way to the jail (top left), a candle on a little table
    const bs = movable(r, tm(ox + 1.5), tm(oz) + 0.45, tm(2) - 0.15, 0.5, 2.4);
    bs.add(new THREE.BoxGeometry(tm(2) - 0.15, 2.4, 0.5), MAT.darkWood, 0, 1.2, 0);
    for (let i = 0; i < 5; i++) bs.add(new THREE.BoxGeometry(tm(2) - 0.3, 0.38, 0.04), i % 2 ? MAT.books : MAT.books2, 0, 0.3 + i * 0.45, 0.24);
    MAN.jailShelf = bs;
    interactBox(r, tm(ox + 1.5), 1.2, tm(oz) + 0.5, tm(2), 2.2, 0.6, () => (bs.at ? null : '本棚を調べる'), () => STORY.event('jailShelf'), { icon: 'hand' });
    const t = new Frame(r, tm(ox + 6.5), 0, tm(oz + 3.5), 0); t.box(0.8, 0.05, 0.6, MAT.darkWood, 0, 0.72, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) t.box(0.05, 0.7, 0.05, MAT.darkWood, sx * 0.35, 0.35, sz * 0.25);
    t.collide(-0.4, 0.4, 0, 0.75, -0.3, 0.3);
    MAN.candle = addCandle(t, 0, 0.745, 0, r); MAN.candle.state = 'off'; MAN.candle.intensity = 2.4; MAN.candle.range = 9; MAN.candle.level = 0;
    interactBox(r, tm(ox + 6.5), 0.9, tm(oz + 3.5), 0.5, 0.4, 0.5, () => (MAN.candle.state === 'on' ? null : 'ろうそくを調べる'), () => STORY.event('candle'), { icon: 'hand', tag: 'candle' });
    addCrate(r, tm(ox + 8) - 0.2, tm(oz + 7) - 0.2, 0.7, 0.3); addCrate(r, tm(ox + 0.6), tm(oz + 6.8), 0.6, 0.9);
  },
  jail(r) {
    const ox = 30, oz = -53, z = tm(oz + 3);
    // bars across the room; the cell door is the gap at the left
    for (let x = tm(ox) + 0.1; x < tm(ox + 7) - 0.05; x += 0.16) {
      if (x > tm(ox + 1) && x < tm(ox + 2)) new Frame(r, x, 0, z, 0).cyl(0.02, 0.02, WALL_H - 2.5, MAT.iron, 0, (WALL_H + 2.5) / 2, 0, 6);   // over the door
      else new Frame(r, x, 0, z, 0).cyl(0.02, 0.02, WALL_H, MAT.iron, 0, WALL_H / 2, 0, 6);
    }
    const F = new Frame(r, 0, 0, z, 0); F.box(tm(7), 0.07, 0.07, MAT.iron, tm(ox + 3.5), 2.5, 0); F.box(tm(7), 0.06, 0.06, MAT.iron, tm(ox + 3.5), 0.1, 0);
    r.addCollider(tm(ox), tm(ox + 1), 0, WALL_H, z - 0.06, z + 0.06, 'bars'); r.addCollider(tm(ox + 2), tm(ox + 7), 0, WALL_H, z - 0.06, z + 0.06, 'bars');
    const piv = new THREE.Group(); F.dyn(piv, tm(ox + 1), 0, 0); piv.userData.baseRy = piv.rotation.y;
    const nb = Math.round((T - 0.16) / 0.15) + 1;
    for (let i = 0; i < nb; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6), MAT.iron); b.position.set(0.08 + i * (T - 0.16) / (nb - 1), 1.2, 0); piv.add(b); }
    for (const y of [0.1, 1.2, 2.35]) { const b = new THREE.Mesh(new THREE.BoxGeometry(T - 0.04, 0.05, 0.05), MAT.iron); b.position.set(T / 2, y, 0); piv.add(b); }
    const col = r.addCollider(tm(ox + 1), tm(ox + 2), 0, WALL_H, z - 0.06, z + 0.06, 'bars');
    const cell = MAN.cell = { piv, col, closed: false, room: r, z, x0: tm(ox), x1: tm(ox + 7) };
    cell.set = closed => {
      cell.closed = closed; col.on = closed;
      const t0 = performance.now(), from = piv.rotation.y, to = piv.userData.baseRy + (closed ? 0 : 1.6);
      animate(() => { const k = Math.min(1, (performance.now() - t0) / 400); piv.rotation.y = lerp(from, to, smoothstep(0, 1, k)); return k < 1; });
      SFX.cellDoor(new THREE.Vector3(tm(ox + 1.5), FLOORS.F1 + 1, z));
    };
    piv.rotation.y = piv.userData.baseRy + 1.6; col.on = false;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(T, 2.4, 0.25), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(tm(ox + 1.5), 1.2, z); r.group.add(hit);
    r.addInteract(hit, { dist: 2.4, icon: 'hand', prompt: () => (ONI.state === 'bars' ? null : cell.closed ? '牢の扉を開ける' : '牢の扉を閉める'), use: () => cell.set(!cell.closed) });
    shineAt(r, tm(ox + 4.5), 0.01, tm(oz + 1.2), 'k_basement');
    interactBox(r, tm(ox + 4.5), 0.2, tm(oz + 1.2), 0.6, 0.4, 0.6, () => (STORY.hasGot('k_basement') ? null : '地下室の鍵を拾う'), () => STORY.event('basementKey'), { icon: 'hand' });
    box(r, 1.2, 0.06, 0.7, std({ color: 0x8a7a40, roughness: 1 }), tm(ox + 6), 0, tm(oz + 0.7), 0, false);
  },
  piano(r) {
    const ox = 0, oz = 2;
    const pn = addPiano(r, tm(ox + 5.5), tm(oz + 4.8), 0); MAN.pianoStain = pn.stain;
    interactBox(r, tm(ox + 5.5), 0.85, tm(oz + 4.8) + 0.5, 1.5, 0.4, 0.5, () => 'ピアノを調べる', () => STORY.event('piano'), { icon: 'hand', tag: 'piano' });
    // white drawers at the top left; two shelves at the top right, and the left one of those hides the safe
    const dF = box(r, 2.0, 0.85, 0.5, AOM.white, tm(ox + 1.2), 0, tm(oz) + 0.35);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { dF.box(0.9, 0.34, 0.02, AOM.white, j - 0.5, 0.22 + i * 0.4, 0.26); dF.box(0.04, 0.04, 0.03, MAT.brass, j - 0.5, 0.22 + i * 0.4, 0.28); }
    const sh = movable(r, tm(ox + 9.5), tm(oz) + 0.3, 1.6, 0.45, 1.9);
    sh.add(new THREE.BoxGeometry(1.6, 1.9, 0.04), AOM.white, 0, 0.95, -0.2);
    for (const sx of [-1, 1]) sh.add(new THREE.BoxGeometry(0.04, 1.9, 0.45), AOM.white, sx * 0.78, 0.95, 0);
    for (let i = 0; i < 5; i++) sh.add(new THREE.BoxGeometry(1.56, 0.03, 0.43), AOM.white, 0, 0.02 + i * 0.465, 0);
    for (let i = 0; i < 4; i++) sh.add(new THREE.BoxGeometry(1.48, 0.34, 0.3), i % 2 ? MAT.books : MAT.books2, 0, 0.21 + i * 0.465, 0.02);
    MAN.pianoShelf = sh;
    interactBox(r, tm(ox + 9.5), 1.0, tm(oz) + 0.45, 1.6, 1.9, 0.6, () => (sh.at ? null : '棚を調べる'), () => STORY.event('pianoShelf'), { icon: 'hand' });
    addBookshelf(r, tm(ox + 10.5), tm(oz) + 0.3, 0, 1.6, 1.9, { mat: AOM.white });
    // the safe in the wall behind it: a dial, and four odd figures on its door
    const sf = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.3), std({ color: 0x2a2c30, metalness: 0.6, roughness: 0.4 })); sf.add(body);
    const ft = toTex(safeFaceCanvas(), true, false); r.textures.push(ft);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.42), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.6 })); face.position.z = 0.151; face.userData.ownMat = true; sf.add(face);
    sf.position.set(tm(ox + 9.5), 0.95, tm(oz) + 0.17); r.group.add(sf); MAN.safe = sf;
    interactBox(r, tm(ox + 9.5), 0.95, tm(oz) + 0.4, 0.95, 0.6, 0.4, () => (sh.at && !STORY.flags.safeOpen ? '金庫を調べる' : null), () => UI.safe(), { icon: 'hand' });
    const st = new Frame(r, tm(ox + 9), 0, tm(oz + 7.5), 0); st.cyl(0.02, 0.02, 1.2, MAT.brass, 0, 0.6, 0, 6); st.box(0.35, 0.25, 0.02, MAT.brass, 0, 1.25, 0, -0.4, 0, 0);
    r.landing = { x: tm(ox + 1.5), z: tm(oz + 6.5), yaw: -Math.PI / 2 };
  },
  cor2(r) { addPlant(r, tm(13) + 0.5, tm(14) - 0.5, 1); },
  kids(r) {
    const ox = 7, oz = -13;
    addSimpleBed(r, tm(ox + 1), tm(oz + 1.2), { w: 0.95, blanket: std({ color: 0xd06a8a, roughness: 0.9 }) });
    // the tall shelf with the lighter oil on top, and the chair that can be pushed over to it
    addBookshelf(r, tm(ox + 6.5), tm(oz) + 0.3, 0, tm(1.5), 2.6, { mat: MAT.wood });
    shineAt(r, tm(ox + 6.5), 2.62, tm(oz) + 0.3, 'oil');
    chairInteract(MAN.kidsChair = addChairW(r, tm(ox + 3.5), tm(oz + 4), 0, MAT.wood), 'kids');
    examine(r, tm(ox + 6.5), 1.8, tm(oz) + 0.5, tm(1.5), 2.6, 0.6, () => (STORY.hasGot('oil') ? null : '棚の上を調べる'), () => STORY.event('kidsShelf'));
    addRug(r, tm(ox + 5), tm(oz + 5), tm(3), tm(2), 0, 5);
    for (let i = 0; i < 5; i++) box(r, 0.16, 0.16, 0.16, std({ color: [0xd04040, 0x3a70d0, 0xe0c040, 0x40a050, 0xa060c0][i], roughness: 0.6 }), tm(ox + 4.5) + i * 0.22, 0, tm(oz + 5.3) + (i % 2) * 0.2, i, false);
    r.mikaAt = { x: tm(ox + 2.2), z: tm(oz + 6.2), yaw: Math.PI * 0.75 };
    // where it is found eating her, after the scream
    // (her feet; she lies with her head to the west, between the door and it, and it leans over her from the far side)
    r.mikaDown = { x: tm(ox + 4.0), z: tm(oz + 5.4), yaw: -Math.PI / 2 }; r.oniEat = { x: tm(ox + 4.0) - 1.0, z: tm(oz + 5.4) - 1.3 };
    const bl = MAN.blood = new THREE.Mesh(new THREE.CircleGeometry(0.85, 28), new THREE.MeshStandardMaterial({ color: 0x3a0505, roughness: 0.2, metalness: 0.1 }));
    bl.rotation.x = -Math.PI / 2; bl.scale.set(1.6, 0.9, 1); bl.position.set(r.mikaDown.x - 0.9, 0.008, r.mikaDown.z + 0.05); bl.visible = false; bl.userData.ownMat = true; r.group.add(bl);
  },
  takeshi(r) {
    const ox = 17, oz = -13;
    MAN.tkCloset = addTansu(r, tm(ox) + 0.6, tm(oz) + 0.5, 0);
    // the desk (the library key is under it once the chair is out of the way)
    const dk = new Frame(r, tm(ox + 4.5), 0, tm(oz) + 0.55, 0);
    dk.box(1.6, 0.05, 0.75, MAT.wood, 0, 0.76, 0); dk.box(0.45, 0.72, 0.7, MAT.wood, 0.55, 0.36, 0); dk.box(0.04, 0.72, 0.7, MAT.wood, -0.78, 0.36, 0);
    dk.collide(-0.8, 0.8, 0.5, 0.8, -0.38, 0.38); dk.collide(0.32, 0.8, 0, 0.8, -0.38, 0.38);
    addTableLamp(r, dk, -0.5, 0.785, -0.15);
    chairInteract(MAN.tkChair = addChairW(r, tm(ox + 4.5) - 0.25, tm(oz) + 1.25, Math.PI, MAT.wood), 'tk');
    interactBox(r, tm(ox + 4.5), 0.85, tm(oz) + 0.55, 1.6, 0.2, 0.75, () => '机を調べる', () => STORY.event('tkDesk'), { icon: 'eye' });
    shineAt(r, tm(ox + 4.5) - 0.3, 0.01, tm(oz) + 0.5, 'k_library', false);
    interactBox(r, tm(ox + 4.5) - 0.3, 0.3, tm(oz) + 0.6, 0.7, 0.6, 0.6, () => (chairAway(MAN.tkChair) && !STORY.hasGot('k_library') ? '机の下を調べる' : null), () => STORY.event('libraryKey'), { icon: 'eye' });
    addBookshelf(r, tm(ox + 7.6), tm(oz) + 0.3, 0, tm(2), 2.4);
    addDresser(r, tm(ox + 2.3), tm(oz) + 0.35, 0, { w: 1.2, h: 0.9, d: 0.5, rows: 3, cols: 1, mat: MAT.wood, still: true });
    addSimpleBed(r, tm(ox + 8) + 0.2, tm(oz + 6));
    // the handkerchief turns up in front of the closet after the first chase
    const hk = shineAt(r, tm(ox) + 0.7, 0.0, tm(oz) + 1.6, 'hanky', false);
    interactBox(r, tm(ox) + 0.7, 0.15, tm(oz) + 1.6, 0.5, 0.3, 0.5, () => (hk.visible && !STORY.hasGot('hanky') ? '光っているものを拾う' : null), () => STORY.event('hanky'), { icon: 'hand' });
  },
  attic(r) {
    // as in 6.23: a plain, lit room. The wardrobe top left, the door that never opens in the back wall,
    // a low chest of drawers top right, a little desk with a chair bottom right
    const ox = 11, oz = -12, pale = std({ color: 0xcfc6a8, roughness: 0.6 });
    MAN.atCloset = addTansu(r, tm(ox) + 0.6, tm(oz) + 0.5, 0, { mat: MAT.wood });
    addDresser(r, tm(ox + 8), tm(oz) + 0.3, 0, { w: tm(2) - 0.2, h: 1.0, d: 0.55, rows: 2, cols: 4, mat: pale, top: pale, still: true });
    const dk = new Frame(r, tm(ox + 8.5) - 0.1, 0, tm(oz + 8.5), -Math.PI / 2);
    dk.box(1.3, 0.05, 0.7, pale, 0, 0.76, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) dk.box(0.05, 0.74, 0.05, MAT.darkWood, sx * 0.6, 0.37, sz * 0.3);
    dk.collide(-0.65, 0.65, 0, 0.8, -0.35, 0.35);
    addChairW(r, tm(ox + 7.5) + 0.2, tm(oz + 8.5), Math.PI / 2, AOM.grey);
  },
  bed3(r) {
    const ox = 0, oz = 4;
    // two beds; the left one stands on boards of another colour (it can be pushed aside)
    MAN.leftBed = addSimpleBed(r, tm(ox + 2.5), tm(oz + 1));
    r.addInteract(MAN.leftBed.g, { dist: 2.4, icon: 'hand', prompt: () => (MAN.leftBed.at ? null : 'ベッドを押す'), use: () => STORY.event('pushBed') });
    addSimpleBed(r, tm(ox + 5.5), tm(oz + 1));
    addNightstand(r, tm(ox + 4), tm(oz) + 0.4, 0);
    box(r, T - 0.05, 0.004, tm(2) - 0.05, AOM.floorPale, tm(ox + 1.5), 0.002, tm(oz + 1), 0, false);
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), MAT.void); hole.rotation.x = -Math.PI / 2; hole.position.set(tm(ox + 2.5), 0.012, tm(oz + 1)); hole.visible = false; r.group.add(hole); MAN.hole = hole;
    addDresser(r, tm(ox + 9) - 0.3, tm(oz + 6.4), -Math.PI / 2, { w: 1.4, h: 0.9, d: 0.5, rows: 3, cols: 1, mat: MAT.wood, still: true });   // against the right wall, clear of the door
    addRug(r, tm(ox + 4), tm(oz + 5.5), tm(4), tm(2.5), 0, 7);
  },
};

/* ---------- the tiles the oni walks ---------- */
function buildNav() {
  // a tile is blocked for it when furniture covers its middle
  for (const c of MAN.grid.values()) {
    const y = FLOORS[c.fl], px = cx(c.x), pz = cx(c.z);
    c.blocked = false;
    for (const col of c.area.colliders) {
      if (col.tag !== 'furn' || !col.on || col.wy1 < y + 0.3) continue;
      if (px > col.x0 - 0.15 && px < col.x1 + 0.15 && pz > col.z0 - 0.15 && pz < col.z1 + 0.15) { c.blocked = true; break; }
    }
  }
  MAN.nodes = [...MAN.grid.values()];
  MAN.nodes.forEach((n, i) => { n.i = i; n.e = []; });
  const dirOf = (a, b) => (b.x > a.x ? 'E' : b.x < a.x ? 'W' : b.z > a.z ? 'S' : 'N');
  const passable = (a, b) => {
    if (!b || b.blocked) return false;
    if (MAN.doorEdges.has(edgeKey(a.fl, a.x, a.z, dirOf(a, b)))) return false;
    if (a.area !== b.area) return MAN.open.has(edgeKey(a.fl, a.x, a.z, dirOf(a, b)));
    if (a.stair || b.stair) {
      if (a.stair && b.stair) return a.stair === b.stair;
      const s = a.stair || b.stair, other = a.stair ? b : a, inS = a.stair ? a : b;
      const first = s.dir === 'N' ? s.entryZ - 1 : s.entryZ, before = s.dir === 'N' ? s.entryZ : s.entryZ - 1;
      return inS.z === first && other.z === before && other.x === inS.x;
    }
    return true;
  };
  for (const n of MAN.nodes) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const m = MAN.grid.get(gkey(n.fl, n.x + dx, n.z + dz));
      if (passable(n, m)) n.e.push({ n: m, w: 1 });
    }
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const m = MAN.grid.get(gkey(n.fl, n.x + dx, n.z + dz)), a = MAN.grid.get(gkey(n.fl, n.x + dx, n.z)), b = MAN.grid.get(gkey(n.fl, n.x, n.z + dz));
      if (m && a && b && !n.stair && !m.stair && !a.stair && !b.stair && passable(n, a) && passable(n, b) && passable(a, m) && passable(b, m)) n.e.push({ n: m, w: 1.41 });
    }
  }
  // doors and stairs: it goes through them as you do
  for (const d of MAN.doorList) {
    const p = d.to && MAN.doors[d.to]; if (!p) continue;
    const a = MAN.grid.get(gkey(d.fl, d.x, d.z)), b = MAN.grid.get(gkey(p.fl, p.x, p.z));
    if (a && b) a.e.push({ n: b, w: 6, door: d });
  }
  for (const s of Object.values(MAN.stairs)) {
    const p = MAN.stairs[s.to]; if (!p) continue;
    const zf = s.dir === 'N' ? s.farZ : s.farZ - 1, zp = p.dir === 'N' ? p.farZ : p.farZ - 1;
    const a = MAN.grid.get(gkey(s.fl, s.x0, zf)), b = MAN.grid.get(gkey(p.fl, p.x0, zp));
    if (a && b) a.e.push({ n: b, w: 8, stair: s });
  }
}
// cheapest way over the tiles (through doors and up and down stairs), with a binary heap
function navPath(from, to, opts = {}) {
  if (!from || !to) return null;
  const N = MAN.nodes.length, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), via = new Array(N);
  const heap = [[0, from.i]]; dist[from.i] = 0;
  const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, rr = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  while (heap.length) {
    const [d, i] = pop();
    if (d > dist[i]) continue;
    if (i === to.i) break;
    for (const e of MAN.nodes[i].e) {
      if (e.door && (opts.noDoors || GAME.doorShut(e.door))) continue;
      if (e.stair && e.stair.shut) continue;   // stairs still hidden
      const nd = d + e.w;
      if (nd < dist[e.n.i]) { dist[e.n.i] = nd; prev[e.n.i] = i; via[e.n.i] = e; push(nd, e.n.i); }
    }
  }
  if (dist[to.i] === Infinity) return null;
  const out = []; let c = to.i;
  while (c !== -1) { out.unshift({ node: MAN.nodes[c], via: via[c] || null }); c = prev[c]; }
  return out;
}
function floorOf(y) { let best = 'F1', bd = Infinity; for (const fl in FLOORS) { const d = Math.abs(y - FLOORS[fl]); if (d < bd) { bd = d; best = fl; } } return best; }
function cellOf(p) { return MAN.grid.get(gkey(floorOf(p.y), Math.floor(p.x / T), Math.floor(p.z / T))) || null; }
function nearestNode(p) {
  const c = cellOf(p);
  if (c && !c.blocked) return c;
  const fl = floorOf(p.y);
  let best = null, bd = Infinity;
  for (const n of MAN.nodes) { if (n.blocked || n.fl !== fl) continue; const d = Math.hypot(cx(n.x) - p.x, cx(n.z) - p.z); if (d < bd) { bd = d; best = n; } }
  return best;
}
const nodePos = (n, out = new THREE.Vector3()) => out.set(cx(n.x), FLOORS[n.fl], cx(n.z));

/* ---------- build everything ---------- */
function buildMansion() {
  aoMaterials();
  Object.assign(MAN, { areas: {}, list: [], doors: {}, doorList: [], stairs: {}, hides: [], props: {}, grid: new Map(), open: new Set(), doorEdges: new Set(), veils: [], sparkles: [], chairs: [], shownFl: null });
  AREAS.forEach((d, i) => makeArea(d, i));
  for (const s of STAIRS) buildStairs(s);
  for (const [fl, ax, az, bx, bz] of JOINS.concat(EDGES)) {
    const side = bx > ax ? 'E' : bx < ax ? 'W' : bz > az ? 'S' : 'N';
    MAN.open.add(edgeKey(fl, ax, az, side)); MAN.open.add(edgeKey(fl, bx, bz, OPP[side]));
  }
  // the black across each screen edge, standing on the line between the two tiles
  for (const [fl, ax, az, bx, bz] of EDGES) {
    const r = MAN.grid.get(gkey(fl, ax, az)).area, lx = Math.max(ax, bx), lz = Math.max(az, bz);
    if (ax !== bx) addVeil(r, tm(lx), tm(az), tm(lx), tm(az + 1), -0.1, WALL_H + 0.1);
    else addVeil(r, tm(ax), tm(lz), tm(ax + 1), tm(lz), -0.1, WALL_H + 0.1);
  }
  for (const d of DOORDEFS) MAN.doorEdges.add(edgeKey(d.fl, d.x, d.z, d.side));
  for (const r of MAN.list) floorAndCeiling(r);
  for (const d of DOORDEFS) buildDoor(d);
  for (const r of MAN.list) buildWalls(r);
  for (const s of STAIRS) stairRails(s);
  for (const r of MAN.list) { for (const l of r.def.lamps) lamp(r, l[0], l[1]); if (FURNISH[r.id]) FURNISH[r.id](r); }
  // rooms that are one screen share their light; the others (even across a screen edge) are shut off from each other
  for (const r of MAN.list) r.joined = new Set([r]);
  for (const [fl, ax, az, bx, bz] of JOINS) {
    const a = MAN.grid.get(gkey(fl, ax, az)).area, b = MAN.grid.get(gkey(fl, bx, bz)).area, all = new Set([...a.joined, ...b.joined]);
    for (const x of all) x.joined = all;
  }
  for (const r of MAN.list) WORLD.add(r);
  WORLD.roomAt = p => { const c = cellOf(p); return c ? c.area : null; };
  buildNav();
}
// only the floor you are on is drawn (the others are out of sight: black stairwell ends and doors are between)
function showFloor(fl) { if (MAN.shownFl === fl) return; MAN.shownFl = fl; for (const r of MAN.list) r.group.visible = r.fl === fl; }
