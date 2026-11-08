
// ================= ステージ（オリジナル3つ） =================
// 箱：[x0, z0, x1, z1, 高さ, 色, 素材]  坂：[x0, z0, x1, z1, x0/z0側の高さ, x1/z1側の高さ, 向き('x'|'z'), 色, 素材, 階段なら1]
// 素材：cont コンテナ／conc コンクリート／wood 板／hedge 生け垣／metal 鉄板／grate 鉄の足場／brick れんが／house 家のかべ／stone 石／bark 木の幹／
//       plant 花だん／glass ガラス／spawn スタート台／crate 木箱／lawn 芝生／machine 機械／conv ベルトコンベア／ac 室外機／slide すべり台／stall 屋台
// 手前半分（z>0）だけ書き、奥は点対称で作る。center は1回だけ。water は水（または空）にする四角
const C_CONT = [0xc8503c, 0x3c7cc8, 0xd8a030, 0x4aa86a, 0x8a5ac8, 0xd86a9a];
const STAGES = {
  minato: {
    flagZ: 34, ball: [3, 0],
    name: 'みなと倉庫', theme: 'harbor', ground: [-30, -48, 30, 48], spawnZ: 44.5, spawnRect: [-7, 41, 7, 48], zone: [-7, -5, 7, 5],
    half: {
      boxes: [
        [-7, 41, 7, 48, 1.4, 0x8d8f99, 'spawn'],
        [-20, 30, -14, 32.6, 2.6, C_CONT[0], 'cont'], [12, 24, 14.6, 30, 2.6, C_CONT[1], 'cont'], [-4, 22, 4, 23, 1.0, 0x9a9a9a, 'conc'],
        [-26, 14, -22, 20, 2.6, C_CONT[2], 'cont'], [20, 10, 24, 13, 1.0, 0x9a9a9a, 'conc'], [-14, 8, -12, 14, 2.6, C_CONT[3], 'cont'], [5, 12, 9, 14, 2.6, C_CONT[4], 'cont'],
        [18, 16, 30, 26, 2.2, 0xa0928a, 'metal'], [-30, 24, -24, 40, 1.2, 0x9a958c, 'conc'],
        [-12, 34, -9, 36, 1.0, 0x9a9a9a, 'conc'], [9, 34, 12, 36, 1.0, 0x9a9a9a, 'conc'], [-2, 30, 2, 31, 1.0, 0x9a9a9a, 'conc'], [24, 34, 30, 40, 2.6, C_CONT[5], 'cont']
      ],
      ramps: [[-4, 37, 4, 41, 0, 1.4, 'z', 0x8d8f99, 'spawn', 1], [14, 18, 18, 22, 0, 2.2, 'x', 0xa0928a, 'grate', 1], [-30, 20, -26, 24, 0, 1.2, 'z', 0x9a958c, 'conc']]
    },
    center: { boxes: [[-7, -5, 7, 5, 1.6, 0xb0a89a, 'conc'], [-1.5, -.6, 1.5, .6, 2.6, 0xd0c8b8, 'glass']], ramps: [[7, -3, 11, 3, 1.6, 0, 'x', 0xb0a89a, 'conc', 1], [-11, -3, -7, 3, 0, 1.6, 'x', 0xb0a89a, 'conc', 1]] },
    sky: [0x3d8fe0, 0x9fd8ff, 0xe8f6ff], fog: 0x8fcff6, sun: 0xfff2dc, groundCol: 0x77757d
  },
  roof: {
    flagZ: 31, ball: [4, 0],
    name: '屋上ガーデン', theme: 'roof', ground: [-26, -44, 26, 44], spawnZ: 41, spawnRect: [-6, 38, 6, 44], zone: [-8, -6, 8, 6],
    half: {
      boxes: [
        [-6, 38, 6, 44, 1.4, 0x9a8f86, 'spawn'],
        [-16, 28, -10, 30, .8, 0x8a6a4a, 'plant'], [10, 22, 16, 24, .8, 0x8a6a4a, 'plant'], [-4, 18, 4, 19.5, .8, 0x8a6a4a, 'plant'], [-22, 10, -18, 16, .8, 0x8a6a4a, 'plant'],
        [16, 30, 20, 34, 3.2, 0xd8d4cc, 'ac'], [-24, 30, -20, 34, 3.2, 0xd8d4cc, 'ac'],
        [20, 6, 26, 22, 2.0, 0x8a6a4a, 'wood'], [-26, 2, -20, 12, 1.2, 0x8a6a4a, 'wood'],
        [-10, 8, -8, 12, 1.6, 0xb84a3a, 'brick'], [6, 12, 9, 14, 1.6, 0xb84a3a, 'brick']
      ],
      ramps: [[-3, 34, 3, 38, 0, 1.4, 'z', 0x9a8f86, 'spawn', 1], [16, 8, 20, 12, 0, 2.0, 'x', 0x8a6a4a, 'wood', 1], [-20, 4, -16, 8, 1.2, 0, 'x', 0x8a6a4a, 'wood', 1], [-2, 6, 2, 9, 1.2, 0, 'z', 0x9a7a5a, 'wood', 1]]
    },
    center: { boxes: [[-8, -6, 8, 6, 1.2, 0x9a7a5a, 'wood'], [-2, -2, 2, 2, 2.6, 0xe0d8c8, 'glass']], ramps: [[-12, -2, -8, 2, 0, 1.2, 'x', 0x9a7a5a, 'wood', 1], [8, -2, 12, 2, 1.2, 0, 'x', 0x9a7a5a, 'wood', 1]] },
    sky: [0x3a3a8a, 0xf0a070, 0xffe0b0], fog: 0xe8a888, sun: 0xffc890, groundCol: 0x8c8580
  },
  market: {
    flagZ: 33, ball: [12, 0],
    name: '坂の市場', theme: 'market', ground: [-30, -46, 30, 46], spawnZ: 43, spawnRect: [-6, 40, 6, 46], zone: [-9, -6, 9, 6],
    water: [[-30, -2.5, -15, 2.5], [-9, -2.5, -3, 2.5], [3, -2.5, 9, 2.5], [15, -2.5, 30, 2.5]],
    half: {
      boxes: [
        [-30, 22, 30, 46, 1.0, 0xb8a888, 'stone'],
        [-6, 40, 6, 46, 2.2, 0x9a8f86, 'spawn'],
        [-12, 26, -6, 28, 2.0, 0xc86a3a, 'stall'], [6, 30, 12, 32, 2.0, 0x3a8ac8, 'stall'], [-26, 28, -22, 34, 2.0, 0xd8b040, 'stall'], [20, 24, 26, 26, 2.0, 0x5aa86a, 'stall'],
        [-8, 10, -4, 12, 1.6, 0xa07850, 'crate'], [4, 6, 8, 8, 1.6, 0xa07850, 'crate'], [-20, 6, -16, 10, 2.4, 0xe8dcc8, 'house'], [16, 12, 20, 16, 2.4, 0xe8dcc8, 'house'], [-2, 13, 2, 14, .9, 0xa8a090, 'stone']
      ],
      ramps: [[-3, 36, 3, 40, 1.0, 2.2, 'z', 0x9a8f86, 'spawn', 1], [-22, 18, -14, 22, 0, 1.0, 'z', 0xb8a888, 'stone', 1], [14, 18, 22, 22, 0, 1.0, 'z', 0xb8a888, 'stone', 1], [-4, 18, 4, 22, 0, 1.0, 'z', 0xb8a888, 'stone', 1]]
    },
    center: { boxes: [[-1.2, -1.2, 1.2, 1.2, 1.2, 0xd0c8b8, 'stone']], ramps: [] },
    bridges: [[-15, -2.5, -9, 2.5], [-3, -2.5, 3, 2.5], [9, -2.5, 15, 2.5]],
    sky: [0x4a9ae8, 0xbfe4ff, 0xfff4e0], fog: 0xcfe6f4, sun: 0xfff0d0, groundCol: 0x9a8c7a
  },
  park: {
    flagZ: 33, ball: [0, 0],
    name: 'さくら公園', theme: 'park', ground: [-28, -46, 28, 46], spawnZ: 43, spawnRect: [-6, 40, 6, 46], zone: [-6, -6, 6, 6],
    water: [[-24, -8, -14, 8], [14, -8, 24, 8]],
    half: {
      boxes: [
        [-6, 40, 6, 46, 1.4, 0x9a8f86, 'spawn'],
        [-18, 30, -17, 31, 3.0, 0x6a4a2e, 'bark'], [16, 26, 17, 27, 3.0, 0x6a4a2e, 'bark'], [-10, 22, -9, 23, 3.0, 0x6a4a2e, 'bark'], [22, 16, 23, 17, 3.0, 0x6a4a2e, 'bark'], [-23, 18, -22, 19, 3.0, 0x6a4a2e, 'bark'], [8, 32, 9, 33, 3.0, 0x6a4a2e, 'bark'],
        [-14, 34, -10, 36, 1.0, 0x4a8a3a, 'hedge'], [12, 34, 16, 36, 1.0, 0x4a8a3a, 'hedge'], [-4, 26, 4, 27.5, 1.0, 0x4a8a3a, 'hedge'], [-26, 24, -22, 26, 1.0, 0x4a8a3a, 'hedge'], [20, 22, 24, 24, 1.0, 0x4a8a3a, 'hedge'],
        [8, 18, 12, 22, 2.4, 0xd85a4a, 'wood'], [-20, 12, -16, 13, .6, 0xa07850, 'bench'], [14, 10, 18, 11, .6, 0xa07850, 'bench'], [-10, 10, -6, 14, 1.6, 0xd8d0c0, 'house']
      ],
      ramps: [[-3, 36, 3, 40, 0, 1.4, 'z', 0x9a8f86, 'spawn', 1], [8, 14, 12, 18, 0, 2.4, 'z', 0x3aa0d8, 'slide']]
    },
    center: { boxes: [[-6, -6, 6, 6, 2.0, 0x6aa04a, 'lawn']], ramps: [[-3, 6, 3, 10, 2.0, 0, 'z', 0x6aa04a, 'lawn'], [-3, -10, 3, -6, 0, 2.0, 'z', 0x6aa04a, 'lawn'], [6, -3, 10, 3, 2.0, 0, 'x', 0x6aa04a, 'lawn'], [-10, -3, -6, 3, 0, 2.0, 'x', 0x6aa04a, 'lawn']] },
    sky: [0x3a8ae0, 0xa8dcff, 0xf0fff0], fog: 0xb8e0f0, sun: 0xfff6e0, groundCol: 0x86a866
  },
  factory: {
    flagZ: 35, ball: [5, 0],
    name: '工場ライン', theme: 'factory', ground: [-26, -48, 26, 48], spawnZ: 45, spawnRect: [-6, 42, 6, 48], zone: [-9, -7, 9, 7],
    water: [[-4, 26, 4, 30], [-4, -30, 4, -26]],
    half: {
      boxes: [
        [-6, 42, 6, 48, 1.4, 0x8d8f99, 'spawn'],
        [-20, 30, -12, 36, 3.0, 0x6a7a8a, 'machine'], [10, 26, 18, 32, 3.0, 0x8a6a5a, 'machine'], [-8, 20, -2, 24, 1.2, 0xc8a040, 'crate'], [4, 14, 8, 18, 2.0, 0x5a8aaa, 'machine'], [-24, 8, -18, 14, 2.4, 0x7a7a7a, 'machine'], [18, 6, 24, 12, 1.0, 0xaaaaaa, 'conc'],
        [-26, 16, -22, 36, 2.4, 0x9a9aa0, 'grate'], [22, 16, 26, 30, 2.4, 0x9a9aa0, 'grate'], [12, 38, 15, 40, 1.0, 0xb08850, 'wood']
      ],
      ramps: [[-3, 38, 3, 42, 0, 1.4, 'z', 0x8d8f99, 'spawn', 1], [-26, 12, -22, 16, 0, 2.4, 'z', 0x9a9aa0, 'grate', 1], [22, 30, 26, 34, 2.4, 0, 'z', 0x9a9aa0, 'grate', 1]]
    },
    center: { boxes: [[-3, -3, 3, 3, 2.6, 0x5a6a7a, 'machine'], [-12, -1, -8, 1, 1.0, 0x4a4a52, 'conv'], [8, -1, 12, 1, 1.0, 0x4a4a52, 'conv']], ramps: [] },
    sky: [0x5a6a80, 0xa8b4c4, 0xdcdcd8], fog: 0xb4bcc8, sun: 0xf0ece0, groundCol: 0x6c6e72
  }
};
const STAGE_IDS = Object.keys(STAGES);
const mirrorBox = b => [-b[2], -b[3], -b[0], -b[1], b[4], b[5], b[6]];
const mirrorRamp = r => [-r[2], -r[3], -r[0], -r[1], r[5], r[4], r[6], r[7], r[8], r[9]];
const mirrorRect = r => [-r[2], -r[3], -r[0], -r[1]];
