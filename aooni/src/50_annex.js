
/* =========================================================================
   After the main building (6.23): its basement, the first annex (three floors and a basement), the walk
   outside, and the second annex (two floors and a basement) to the way out. Each is on a level of its own;
   doors and stairs take you between them as in the original. Shapes follow the original's maps, drawn large.
   ========================================================================= */
AREAS.push(
  // the main building's basement
  { id: 'big', name: '大部屋', fl: 'B1', cells: [[0, 0, 12, 14]], wall: 'wallStone', floor: 'floorMoss', lamps: [[3, 3.5], [3, 10.5], [9, 3], [9, 8.2], [9, 12.3]] },
  { id: 'b1left', name: '左の部屋', fl: 'B1', cells: [[-9, 1, 7, 7]], wall: 'wallStone', floor: 'floorMoss', lamps: [[-5.5, 4.5]] },
  { id: 'back', name: '裏口', fl: 'B1', cells: [[14, 1, 7, 7]], wall: 'wallStone', floor: 'floorMoss', lamps: [[17.5, 4.5]] },
  { id: 'bjail', name: '地下牢', fl: 'B1', cells: [[23, 0, 8, 8]], wall: 'wallStone', floor: 'floorMoss', dark: true, lamps: [] },
  { id: 'bridge', name: '渡り廊下', fl: 'B1', cells: [[16, -7, 3, 4]], wall: 'wallStone', floor: 'floorMoss', lamps: [[17.5, -5]] },
  // the first annex
  { id: 'a1bridge', name: '渡り廊下', fl: 'A1', cells: [[16, 6, 3, 4]], wall: 'wallStone', floor: 'floorMoss', lamps: [[17.5, 8]] },
  { id: 'a1hall', name: '第１別館 玄関', fl: 'A1', cells: [[10, 0, 9, 6], [13, -6, 3, 6]], wall: 'wallBlue', floor: 'floorBlood', lamps: [[12, 3], [16.5, 3], [14.5, -3]] },
  { id: 'a1corB', name: '廊下', fl: 'A1', cells: [[3, -9, 16, 3]], wall: 'wallBlue', floor: 'floorBlood', lamps: [[6, -7.5], [11, -7.5], [16, -7.5]] },
  { id: 'a1bl', name: '奥左の部屋', fl: 'A1', cells: [[0, -4, 8, 7]], wall: 'wallBlue', floor: 'floorBlood', lamps: [[4, -0.5]] },
  { id: 'a1left', name: '左の部屋', fl: 'A1', cells: [[0, 5, 8, 6]], wall: 'wallBlue', floor: 'floorBlood', dark: true, lamps: [] },
  { id: 'a1corA', name: '廊下', fl: 'A1', cells: [[19, 2, 12, 1]], wall: 'wallBlue', floor: 'floorBlood', lamps: [[21.5, 2.5], [27.5, 2.5]] },   // 6.23: twelve tiles, one tile of floor
  { id: 'a1stair', name: '階段室', fl: 'A1', cells: [[19, -4, 8, 5]], wall: 'wallBlue', floor: 'floorBlood', lamps: [[22, -1.5]] },
  { id: 'a1br', name: '奥右の部屋', fl: 'A1', cells: [[30, -12, 8, 7]], wall: 'wallBlue', floor: 'floorBlood', lamps: [[34, -8.5]] },
  { id: 'a2cor', name: '２階 廊下', fl: 'A2', cells: [[10, 0, 6, 3]], wall: 'wallBlue', floor: 'floorBlood', lamps: [[13, 1.5]] },
  { id: 'a2left', name: '左の部屋', fl: 'A2', cells: [[0, -3, 8, 7]], wall: 'wallBlue', floor: 'floorBlood', lamps: [] },
  { id: 'a2fire', name: '暖炉の部屋', fl: 'A2', cells: [[18, -3, 8, 8]], wall: 'wallBlue', floor: 'floorBlood', lamps: [[22, -0.5], [22, 3]] },
  { id: 'a3cor', name: '３階 廊下', fl: 'A3', cells: [[14, 0, 2, 6]], wall: 'wallBlue', floor: 'floorBlood', lamps: [[15, 2.5]] },
  { id: 'a3crate', name: '木箱の部屋', fl: 'A3', cells: [[18, -4, 5, 7], [18, -6, 1, 2], [22, -6, 1, 2]], wall: 'wallBlue', floor: 'floorBlood', lamps: [[20.5, -2.5], [20.5, 1]] },   // 6.23: five by seven, a nook top left and top right
  // the first annex's basement (dark until the lever in the room bottom left)
  { id: 'abstair', name: '地下 階段室', fl: 'AB', cells: [[10, 10, 6, 5]], wall: 'wallStone', floor: 'floorMoss', dark: true, lamps: [[13, 12.5]] },
  { id: 'abcorA', name: '地下 廊下', fl: 'AB', cells: [[6, 4, 12, 3]], wall: 'wallStone', floor: 'floorMoss', dark: true, lamps: [[9, 5.5], [15, 5.5]] },
  { id: 'abbl', name: '左下の部屋', fl: 'AB', cells: [[0, 9, 8, 7]], wall: 'wallStone', floor: 'floorMoss', dark: true, lamps: [[4, 12.5]] },
  { id: 'abtl', name: '左上の部屋', fl: 'AB', cells: [[2, -6, 8, 8]], wall: 'wallStone', floor: 'floorMoss', dark: true, lamps: [[6, -2]] },
  { id: 'ablat', name: '格子戸の部屋', fl: 'AB', cells: [[30, -24, 7, 6]], wall: 'wallStone', floor: 'floorMoss', lamps: [[33.5, -21]] },
  { id: 'abcorB', name: '地下 廊下', fl: 'AB', cells: [[18, -4, 3, 11]], wall: 'wallStone', floor: 'floorMoss', dark: true, lamps: [[19.5, -1.5], [19.5, 4]] },
  { id: 'abcorC', name: '地下 廊下', fl: 'AB', cells: [[18, -16, 3, 10], [21, -19, 3, 4]], wall: 'wallStone', floor: 'floorMoss', lamps: [[19.5, -10], [22.5, -17.5]] },
  { id: 'abfront', name: '手前の部屋', fl: 'AB', cells: [[10, -14, 7, 6]], wall: 'wallStone', floor: 'floorMoss', lamps: [[13.5, -11]] },
  { id: 'abback', name: '奥の部屋', fl: 'AB', cells: [[18, -27, 8, 6]], wall: 'wallStone', floor: 'floorMoss', lamps: [[22, -24]] },
  { id: 'abhidA', name: '隠し通路', fl: 'AB', cells: [[18, 9, 2, 7]], wall: 'wallStone', floor: 'floorMoss', lamps: [[19, 11.5]] },
  { id: 'abhidB', name: '隠し通路', fl: 'AB', cells: [[20, 14, 10, 2]], wall: 'wallStone', floor: 'floorMoss', lamps: [[25, 15]] },
  // outside, to the second annex
  { id: 'cloister', name: '回廊', fl: 'K', cells: [[0, 0, 3, 14], [3, 11, 16, 3]], wall: 'hedge', floor: 'floorPath', outdoor: true, lamps: [] },
  // the second annex
  { id: 's1cor', name: '第２別館 廊下', fl: 'S1', cells: [[0, -5, 3, 8], [3, 0, 16, 3]], wall: 'wallStain', floor: 'floorOlive', lamps: [[1.5, -3], [6, 1.5], [12, 1.5], [17, 1.5]] },
  { id: 's1tl', name: '左上の部屋', fl: 'S1', cells: [[4, -17, 7, 6]], wall: 'wallStain', floor: 'floorOlive', lamps: [[7.5, -14]] },
  { id: 's1bl', name: '左下の部屋', fl: 'S1', cells: [[4, -10, 7, 6]], wall: 'wallStain', floor: 'floorOlive', lamps: [[7.5, -7]] },
  { id: 's1ch', name: '教会', fl: 'S1', cells: [[13, -15, 9, 12]], wall: 'wallStain', floor: 'floorOlive', lamps: [[17.5, -12], [17.5, -6.5]] },
  { id: 's2cor', name: '２階 廊下', fl: 'S2', cells: [[0, -4, 3, 7], [3, 0, 12, 3]], wall: 'wallStain', floor: 'floorOlive', lamps: [[1.5, -2], [7, 1.5], [13, 1.5]] },
  { id: 's2tl', name: '左上の部屋', fl: 'S2', cells: [[3, -12, 6, 6]], wall: 'wallStain', floor: 'floorOlive', lamps: [[6, -9]] },
  { id: 's2study', name: '書斎', fl: 'S2', cells: [[10, -13, 9, 8]], wall: 'wallStain', floor: 'floorOlive', lamps: [[14.5, -9]] },
  { id: 's2front', name: '手前の部屋', fl: 'S2', cells: [[20, -4, 7, 6]], wall: 'wallStain', floor: 'floorOlive', lamps: [[23.5, -1]] },
  { id: 's2back', name: '奥の部屋', fl: 'S2', cells: [[20, -12, 7, 6]], wall: 'wallStain', floor: 'floorOlive', lamps: [[23.5, -9]] },
  { id: 'sbstair', name: '地下 階段室', fl: 'SB', cells: [[10, -6, 6, 5]], wall: 'wallStain', floor: 'floorOlive', lamps: [[13, -3.5]] },
  { id: 'sbinf', name: '医務室', fl: 'SB', cells: [[1, -7, 8, 6]], wall: 'wallStain', floor: 'floorOlive', lamps: [[5, -4]] },
  { id: 'sbcorA', name: '地下 廊下', fl: 'SB', cells: [[1, 0, 15, 3]], wall: 'wallStain', floor: 'floorOlive', lamps: [[4, 1.5], [10, 1.5]] },
  { id: 'sbcorB', name: '白い廊下', fl: 'SB', cells: [[16, -10, 3, 13]], wall: 'wallWhiteB', floor: 'floorPale', lamps: [[17.5, -7], [17.5, -1.5]] },
  { id: 'sbcorC', name: '地下 廊下', fl: 'SB', cells: [[16, -20, 3, 7]], wall: 'wallStain', floor: 'floorOlive', lamps: [[17.5, -16.5]] },
  { id: 'sbjail', name: '牢屋', fl: 'SB', cells: [[0, 5, 8, 6]], wall: 'wallStain', floor: 'floorOlive', dark: true, lamps: [] },
  { id: 'sbdark', name: '暗闇の部屋', fl: 'SB', cells: [[10, 5, 8, 6]], wall: 'wallStain', floor: 'floorOlive', dark: true, lamps: [] },
  { id: 'sboni', name: '青鬼の部屋', fl: 'SB', cells: [[0, 14, 11, 6]], wall: 'wallStain', floor: 'floorOlive', lamps: [[5.5, 14.5]] },
  // out: up the last stairs, a straight muddy path through a dead wood in the rain, to the gate
  { id: 'outpath', name: '森の道', fl: 'Y', cells: [[40, -40, 5, 34]], wall: 'forest', floor: 'floorDirt', outdoor: true, lamps: [] },
);
STAIRS.push(
  { id: 'stB1up', fl: 'B1', area: 'bridge', r: [16, -12, 3, 5], dir: 'N', rise: 3.2, to: 'stA1dn' },
  { id: 'stA1dn', fl: 'A1', area: 'a1bridge', r: [16, 10, 3, 5], dir: 'S', rise: -3.2, to: 'stB1up' },
  { id: 'stA1up', fl: 'A1', area: 'a1hall', r: [11, -5, 2, 5], dir: 'N', rise: 3.2, to: 'stA2dn' },
  { id: 'stA2dn', fl: 'A2', area: 'a2cor', r: [10, 3, 2, 5], dir: 'S', rise: -3.2, to: 'stA1up' },
  { id: 'stA2up', fl: 'A2', area: 'a2cor', r: [14, 3, 2, 5], dir: 'S', rise: 3.2, to: 'stA3dn' },
  { id: 'stA3dn', fl: 'A3', area: 'a3cor', r: [14, 6, 2, 5], dir: 'S', rise: -3.2, to: 'stA2up' },
  { id: 'stA1b', fl: 'A1', area: 'a1stair', r: [24, -9, 2, 5], dir: 'N', rise: -3.2, to: 'stABup' },
  { id: 'stABup', fl: 'AB', area: 'abstair', r: [12, 15, 2, 5], dir: 'S', rise: 3.2, to: 'stA1b' },
  { id: 'stABh', fl: 'AB', area: 'abtl', r: [3, -11, 2, 5], dir: 'N', rise: -3.2, to: 'stLat' },
  { id: 'stLat', fl: 'AB', area: 'ablat', r: [32, -18, 2, 5], dir: 'S', rise: 3.2, to: 'stABh' },
  { id: 'stS1up', fl: 'S1', area: 's1cor', r: [0, 3, 2, 5], dir: 'S', rise: 3.2, to: 'stS2dn' },
  { id: 'stS2dn', fl: 'S2', area: 's2cor', r: [0, 3, 2, 5], dir: 'S', rise: -3.2, to: 'stS1up' },
  { id: 'stS1dn', fl: 'S1', area: 's1ch', r: [16, -20, 2, 5], dir: 'N', rise: -3.2, to: 'stSBup' },
  { id: 'stSBup', fl: 'SB', area: 'sbstair', r: [12, -11, 2, 5], dir: 'N', rise: 3.2, to: 'stS1dn' },
  { id: 'stOut', fl: 'SB', area: 'sbcorC', r: [16, -25, 3, 5], dir: 'N', rise: 3.2, to: null },   // up and out
);
EDGES.push(
  ['A1', 18, 2, 19, 2],                                            // the annex hall - corridor A
  ...[13, 14, 15].map(x => ['A1', x, -6, x, -7]),                 // the hall's way up - corridor B
  ...[4, 5, 6].map(z => ['AB', 17, z, 18, z]),                    // basement corridors A - B
  ...[14, 15].map(z => ['AB', 19, z, 20, z]),                     // the hidden passage turns
  ...[0, 1, 2].map(z => ['SB', 15, z, 16, z]),                    // basement corridor A - the white corridor
);
DOORDEFS.find(d => d.id === 'corC_base').to = 'b1_up';
DOORDEFS.push(
  { id: 'b1_up', fl: 'B1', x: 2, z: 13, side: 'S', to: 'corC_base' },
  { id: 'big_left', fl: 'B1', x: 0, z: 2, side: 'W', to: 'left_big' },
  { id: 'left_big', fl: 'B1', x: -3, z: 4, side: 'E', to: 'big_left' },
  { id: 'big_back', fl: 'B1', x: 11, z: 2, side: 'E', to: 'back_big' },
  { id: 'back_big', fl: 'B1', x: 14, z: 4, side: 'W', to: 'big_back' },
  { id: 'back_bridge', fl: 'B1', x: 17, z: 1, side: 'N', to: 'bridge_back' },
  { id: 'bridge_back', fl: 'B1', x: 17, z: -4, side: 'S', to: 'back_bridge' },
  { id: 'back_jail', fl: 'B1', x: 20, z: 4, side: 'E', to: 'bjail_back', lock: 'k_bjail' },
  { id: 'bjail_back', fl: 'B1', x: 23, z: 4, side: 'W', to: 'back_jail' },
  { id: 'a1bridge_hall', fl: 'A1', x: 17, z: 6, side: 'N', to: 'hall_bridge', lock: 'k_annex' },
  { id: 'hall_bridge', fl: 'A1', x: 14, z: 5, side: 'S', to: 'a1bridge_hall' },
  { id: 'hall_left', fl: 'A1', x: 10, z: 3, side: 'W', to: 'a1left_hall' },
  { id: 'a1left_hall', fl: 'A1', x: 7, z: 8, side: 'E', to: 'hall_left' },
  { id: 'corB1_bl', fl: 'A1', x: 5, z: -7, side: 'S', to: 'bl_corB1' },
  { id: 'bl_corB1', fl: 'A1', x: 4, z: -4, side: 'N', to: 'corB1_bl' },
  { id: 'corB1_br', fl: 'A1', x: 10, z: -7, side: 'S', to: 'br_corB1' },
  { id: 'br_corB1', fl: 'A1', x: 31, z: -12, side: 'N', to: 'corB1_br' },
  // corridor A's two doors up to the stairwell (they do not open from the corridor until opened from inside)
  { id: 'corA1_stair', fl: 'A1', x: 21, z: 2, side: 'N', to: 'stair1_corA', stuck: 'a1stairOpen' },
  { id: 'stair1_corA', fl: 'A1', x: 20, z: 0, side: 'S', to: 'corA1_stair', unstick: 'a1stairOpen' },
  { id: 'corA2_stair', fl: 'A1', x: 28, z: 2, side: 'N', to: 'stair2_corA', stuck: 'a1stairOpen' },
  { id: 'stair2_corA', fl: 'A1', x: 26, z: 0, side: 'S', to: 'corA2_stair', unstick: 'a1stairOpen' },
  { id: 'br_cloister', fl: 'A1', x: 37, z: -7, side: 'E', to: 'k_a1', kind: 'hidden2', reveal: 'shadowCut', lock: 'k_back' },
  { id: 'a2cor_left', fl: 'A2', x: 10, z: 1, side: 'W', to: 'a2left_cor' },
  { id: 'a2left_cor', fl: 'A2', x: 7, z: 1, side: 'E', to: 'a2cor_left' },
  { id: 'a2cor_fire', fl: 'A2', x: 15, z: 1, side: 'E', to: 'fire_cor' },
  { id: 'fire_cor', fl: 'A2', x: 18, z: 1, side: 'W', to: 'a2cor_fire' },
  { id: 'a3cor_crate', fl: 'A3', x: 15, z: 2, side: 'E', to: 'crate_cor' },
  { id: 'crate_cor', fl: 'A3', x: 18, z: 2, side: 'W', to: 'a3cor_crate' },
  { id: 'abstair_corA', fl: 'AB', x: 12, z: 10, side: 'N', to: 'corAB_stair', lock: 'k_ab' },
  { id: 'corAB_stair', fl: 'AB', x: 12, z: 6, side: 'S', to: 'abstair_corA' },
  { id: 'corAB_bl', fl: 'AB', x: 7, z: 6, side: 'S', to: 'abbl_cor' },
  { id: 'abbl_cor', fl: 'AB', x: 5, z: 9, side: 'N', to: 'corAB_bl' },
  { id: 'corAB_tl', fl: 'AB', x: 7, z: 4, side: 'N', to: 'abtl_cor' },
  { id: 'abtl_cor', fl: 'AB', x: 6, z: 1, side: 'S', to: 'corAB_tl' },
  { id: 'corBAB_C', fl: 'AB', x: 19, z: -4, side: 'N', to: 'abcorC_B', kind: 'code' },
  { id: 'abcorC_B', fl: 'AB', x: 19, z: -7, side: 'S', to: 'corBAB_C' },
  { id: 'corBAB_hid', fl: 'AB', x: 19, z: 6, side: 'S', to: 'hidA_cor', kind: 'hidden2', reveal: 'abHidDoor', lock: 'k_hidden' },
  { id: 'hidA_cor', fl: 'AB', x: 19, z: 9, side: 'N', to: 'corBAB_hid' },
  { id: 'corC_front', fl: 'AB', x: 18, z: -11, side: 'W', to: 'abfront_corC' },
  { id: 'abfront_corC', fl: 'AB', x: 16, z: -11, side: 'E', to: 'corC_front' },
  { id: 'corC_back', fl: 'AB', x: 22, z: -19, side: 'N', to: 'abback_corC' },
  { id: 'abback_corC', fl: 'AB', x: 21, z: -22, side: 'S', to: 'corC_back' },
  { id: 'k_a1', fl: 'K', x: 1, z: 0, side: 'N', to: 'br_cloister' },
  { id: 'k_s1', fl: 'K', x: 18, z: 12, side: 'E', to: 's1_k' },
  { id: 's1_k', fl: 'S1', x: 1, z: -5, side: 'N', to: 'k_s1' },
  { id: 's1cor_tl', fl: 'S1', x: 5, z: 0, side: 'N', to: 's1tl_cor' },
  { id: 's1tl_cor', fl: 'S1', x: 7, z: -12, side: 'S', to: 's1cor_tl' },
  { id: 's1cor_bl', fl: 'S1', x: 9, z: 0, side: 'N', to: 's1bl_cor' },
  { id: 's1bl_cor', fl: 'S1', x: 7, z: -5, side: 'S', to: 's1cor_bl' },
  { id: 's1cor_ch', fl: 'S1', x: 15, z: 0, side: 'N', to: 'ch_cor' },
  { id: 'ch_cor', fl: 'S1', x: 17, z: -4, side: 'S', to: 's1cor_ch' },
  { id: 's2cor_tl', fl: 'S2', x: 4, z: 0, side: 'N', to: 's2tl_cor' },
  { id: 's2tl_cor', fl: 'S2', x: 5, z: -7, side: 'S', to: 's2cor_tl' },
  { id: 's2cor_study', fl: 'S2', x: 9, z: 0, side: 'N', to: 'study_cor', lock: 'k_study' },
  { id: 'study_cor', fl: 'S2', x: 11, z: -6, side: 'S', to: 's2cor_study' },
  { id: 's2cor_front', fl: 'S2', x: 14, z: 1, side: 'E', to: 's2front_cor' },
  { id: 's2front_cor', fl: 'S2', x: 20, z: 1, side: 'W', to: 's2cor_front' },
  { id: 's2front_back', fl: 'S2', x: 24, z: -4, side: 'N', to: 's2back_front', kind: 'hidden2', reveal: 'graffitiCut' },
  { id: 's2back_front', fl: 'S2', x: 24, z: -7, side: 'S', to: 's2front_back' },
  { id: 'sbstair_corA', fl: 'SB', x: 12, z: -2, side: 'S', to: 'sbcorA_st' },
  { id: 'sbcorA_st', fl: 'SB', x: 12, z: 0, side: 'N', to: 'sbstair_corA' },
  { id: 'sbinf_corA', fl: 'SB', x: 5, z: -2, side: 'S', to: 'sbcorA_inf' },
  { id: 'sbcorA_inf', fl: 'SB', x: 5, z: 0, side: 'N', to: 'sbinf_corA' },
  { id: 'sbcorA_jail', fl: 'SB', x: 4, z: 2, side: 'S', to: 'sbjail_cor' },
  { id: 'sbjail_cor', fl: 'SB', x: 4, z: 5, side: 'N', to: 'sbcorA_jail' },
  { id: 'sbcorA_dark', fl: 'SB', x: 12, z: 2, side: 'S', to: 'sbdark_cor' },
  { id: 'sbdark_cor', fl: 'SB', x: 12, z: 5, side: 'N', to: 'sbcorA_dark' },
  { id: 'sbjail_oni', fl: 'SB', x: 1, z: 10, side: 'S', to: 'oni_jail', lock: 'k_sbase' },
  { id: 'oni_jail', fl: 'SB', x: 1, z: 14, side: 'N', to: 'sbjail_oni' },
  { id: 'sbcorB_C', fl: 'SB', x: 17, z: -10, side: 'N', to: 'sbcorC_B', kind: 'pieces' },
  { id: 'sbcorC_B', fl: 'SB', x: 17, z: -14, side: 'S', to: 'sbcorB_C' },
);
Object.assign(ITEMS, {
  bitMinus: { name: '－ドライバーの芯', icon: 'bit', desc: 'マイナスのドライバーの芯。ドライバーに付け替えられる。' },
  driverMinus: { name: '－ドライバー', icon: 'driverM', desc: '－の芯を付けたドライバー。' },
  bitPlus: { name: '＋ドライバーの芯', icon: 'bit', desc: 'プラスのドライバーの芯。ドライバーに付け替えられる。' },
  k_bjail: { name: '地下牢の鍵', icon: 'key', color: '#8a8a7a', desc: '本館地下・地下牢の鍵。' },
  k_annex: { name: '別館の鍵', icon: 'key', color: '#c0a060', desc: '第１別館の扉の鍵。' },
  doll: { name: '人形', icon: 'doll', desc: '小さな人形。よく燃えそうだ。' },
  bulb: { name: '電球', icon: 'bulb', desc: '小さな電球。' },
  oil2: { name: 'ライターオイル', icon: 'oil', desc: 'ライター用のオイル。' },
  stoneRed: { name: '赤い石', icon: 'stoneR', desc: '赤くつやつやした石。' },
  stoneBlue: { name: '青い石', icon: 'stoneB', desc: '青くつやつやした石。' },
  dollHead: { name: '人形の頭', icon: 'dollHead', desc: '人形の頭。赤と青の目がはまっている。' },
  k_ab: { name: '地下室の鍵', icon: 'key', color: '#7a8aa0', desc: '第１別館・地下室の鍵。' },
  book: { name: '絵本', icon: 'book', desc: '古い絵本。開いて読める。' },
  bookmark: { name: 'しおり', icon: 'bookmark', desc: '色のついた、穴の空いたしおり。' },
  keyRed: { name: '赤い鍵', icon: 'key', color: '#a03a2a', desc: '錆びついた赤い鍵。このままでは使えない。' },
  disc: { name: '円盤', icon: 'disc', desc: '色のついた円盤。何かの順番が描かれている。' },
  vinegar: { name: '酢', icon: 'vinegar', desc: '酢の入ったびん。錆を落とせそうだ。' },
  k_lattice: { name: '格子戸の鍵', icon: 'key', color: '#c8b070', desc: '錆の落ちた鍵。格子戸に使えそうだ。' },
  rod: { name: '金属の棒', icon: 'rod', desc: '短い金属の棒。円盤の穴に合いそうだ。' },
  k_hidden: { name: '隠し扉の鍵', icon: 'key', color: '#9ab0c0', desc: '円盤と棒を組み合わせた鍵。' },
  k_back: { name: '裏口の鍵', icon: 'key', color: '#b0a080', desc: '第１別館の裏口の鍵。' },
  dice: { name: 'サイコロ', icon: 'dice', desc: '白いサイコロ。' },
  stick: { name: '棒', icon: 'stick', desc: '細長い棒。手の届かない所に届きそうだ。' },
  ladder: { name: '縄ばしご', icon: 'ladder', desc: '丈夫な縄ばしご。' },
  k_study: { name: '書斎の鍵', icon: 'key', color: '#c0a070', desc: '第２別館・書斎の鍵。' },
  k_sbase: { name: '地下室の鍵', icon: 'key', color: '#8090a0', desc: '第２別館・牢屋の奥の扉の鍵。' },
  piece1: { name: '青いピース', icon: 'piece', desc: '青いパズルのピース。' },
  piece2: { name: '青いピース', icon: 'piece', desc: '青いパズルのピース。' },
  piece3: { name: '青いピース', icon: 'piece', desc: '青いパズルのピース。' },
});

/* ---------- small things for these rooms ---------- */
// a picture drawn on a canvas, flat on a wall (or the floor)
function wallPic(r, x, y, z, ry, w, h, draw, opt = {}) {
  const c = newCanvas(opt.cw || 256, opt.ch || 256); draw(c.getContext('2d'), c.width, c.height);
  const tex = toTex(c, true, false); r.textures.push(tex);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, transparent: !!opt.transparent, depthWrite: !opt.transparent }));
  m.userData.ownMat = true; m.position.set(x, y, z); m.rotation.set(opt.rx || 0, ry, 0); r.group.add(m);
  m.redraw = fn => { fn(c.getContext('2d'), c.width, c.height); tex.needsUpdate = true; };
  return m;
}
// a little doll: a dress, a head with dark hair and two black eyes (or none, or no head at all)
function makeDoll(s = 1, opt = {}) {
  const g = new THREE.Group(), M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s, 0.2 * s, 10), M(opt.dress || 0x8a1c2a)); dress.position.y = 0.1 * s; g.add(dress);
  const head = new THREE.Group(); head.position.y = 0.25 * s; g.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 12, 10), M(0xf0dcc8)));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.064 * s, 12, 8, 0, TAU, 0, Math.PI * 0.6), M(0x2a1a12)); hair.rotation.x = -0.4; head.add(hair);
  const eyes = [];
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.011 * s, 6, 6), M(opt.noEyes ? 0x3a2a2a : 0x0a0a0a)); e.position.set(sx * 0.022 * s, 0.005 * s, 0.054 * s); head.add(e); eyes.push(e); }
  if (opt.noEyes) eyes.forEach(e => e.scale.setScalar(0.6));
  g.userData = { head, eyes };
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// iron bars across a room along z = zl from x0 to x1 (metres), with a hinged gate between gx0 and gx1
function addBarsZ(r, x0, x1, zl, gx0, gx1, opt = {}) {
  for (let x = x0 + 0.1; x < x1 - 0.05; x += 0.16) {
    if (x > gx0 && x < gx1) new Frame(r, x, 0, zl, 0).cyl(0.02, 0.02, WALL_H - 2.5, MAT.iron, 0, (WALL_H + 2.5) / 2, 0, 6);
    else new Frame(r, x, 0, zl, 0).cyl(0.02, 0.02, WALL_H, MAT.iron, 0, WALL_H / 2, 0, 6);
  }
  const F = new Frame(r, 0, 0, zl, 0); F.box(x1 - x0, 0.07, 0.07, MAT.iron, (x0 + x1) / 2, 2.5, 0); F.box(x1 - x0, 0.06, 0.06, MAT.iron, (x0 + x1) / 2, 0.1, 0);
  r.addCollider(x0, gx0, 0, WALL_H, zl - 0.06, zl + 0.06, 'bars'); r.addCollider(gx1, x1, 0, WALL_H, zl - 0.06, zl + 0.06, 'bars');
  const w = gx1 - gx0, piv = new THREE.Group(); F.dyn(piv, gx0, 0, 0); piv.userData.baseRy = piv.rotation.y;
  const nb = Math.round((w - 0.16) / 0.15) + 1;
  for (let i = 0; i < nb; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6), MAT.iron); b.position.set(0.08 + i * (w - 0.16) / (nb - 1), 1.2, 0); piv.add(b); }
  for (const y of [0.1, 1.2, 2.35]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.05, 0.05), MAT.iron); b.position.set(w / 2, y, 0); piv.add(b); }
  const col = r.addCollider(gx0, gx1, 0, WALL_H, zl - 0.06, zl + 0.06, 'bars');
  const gate = { piv, col, open: false, r, z: zl, x0, x1, gx0, gx1 };
  gate.set = open => {
    gate.open = open; col.on = !open;
    const t0 = performance.now(), from = piv.rotation.y, to = piv.userData.baseRy + (open ? 1.6 : 0);
    animate(() => { const k = Math.min(1, (performance.now() - t0) / 400); piv.rotation.y = lerp(from, to, smoothstep(0, 1, k)); return k < 1; });
    SFX.cellDoor(new THREE.Vector3((gx0 + gx1) / 2, r.y + 1, zl));
  };
  gate.snap = open => { gate.open = open; col.on = !open; piv.rotation.y = piv.userData.baseRy + (open ? 1.6 : 0); };
  if (opt.hit !== false) interactBox(r, (gx0 + gx1) / 2, 1.2, zl, w, 2.4, 0.3, () => opt.prompt ? opt.prompt(gate) : (gate.open ? null : '鉄格子の扉を開ける'), () => (opt.use ? opt.use(gate) : gate.set(true)), { icon: 'hand' });
  return gate;
}
// a stand of the wall's colour over an opening, until it is moved away (the hidden stairs)
function coverPanel(r, x, z, w, ry, mat) { const F = new Frame(r, x, 0, z, ry), g = new THREE.Group(); F.dyn(g, 0, 0, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, 0.1), mat); m.position.y = WALL_H / 2; g.add(m); const col = r.addCollider(x - (Math.abs(Math.sin(ry)) > 0.5 ? 0.06 : w / 2), x + (Math.abs(Math.sin(ry)) > 0.5 ? 0.06 : w / 2), 0, WALL_H, z - (Math.abs(Math.sin(ry)) > 0.5 ? w / 2 : 0.06), z + (Math.abs(Math.sin(ry)) > 0.5 ? w / 2 : 0.06), 'wall'); return { g, col, open() { g.visible = false; col.on = false; } }; }
// a black hole in the floor that you cannot walk over (until something fills it)
function floorHole(r, x, z, w = T - 0.1, d = T - 0.1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.void); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.012, z); r.group.add(m);
  const col = r.addCollider(x - w / 2, x + w / 2, 0, 1.2, z - d / 2, z + d / 2, 'furn');
  return { m, col, x, z };
}
const pedestalBust = (r, x, z) => {
  const m = movable(r, x, z, 0.62, 0.62, 1.9);
  m.add(new THREE.BoxGeometry(0.6, 1.0, 0.6), MAT.marble, 0, 0.5, 0);
  m.add(new THREE.BoxGeometry(0.66, 0.06, 0.66), MAT.marble, 0, 1.03, 0);
  m.add(new THREE.CylinderGeometry(0.2, 0.26, 0.3, 14), MAT.marble, 0, 1.2, 0);
  m.add(new THREE.SphereGeometry(0.2, 18, 14), MAT.marble, 0, 1.52, 0);
  m.add(new THREE.CylinderGeometry(0.08, 0.1, 0.16, 10), MAT.marble, 0, 1.32, 0);
  return m;
};

// a big storage cabinet like the original's: a pale cap, a front of dark upright planks between two posts, a plinth.
// add(w, h, d, mat, x, y, z) puts one box on it; its front is local +z
function bigCabinet(add, w, h, d) {
  add(w, h - 0.12, d, MAT.darkWood, 0, h / 2 + 0.06, 0);
  add(w + 0.1, 0.12, d + 0.08, MAT.crateWood, 0, h - 0.06, 0.01);
  add(w + 0.02, 0.14, d + 0.03, MAT.darkWood, 0, 0.07, 0.005);
  for (const sx of [-1, 1]) { add(0.12, h - 0.2, 0.06, MAT.crateWood, sx * (w / 2 - 0.06), h / 2, d / 2 + 0.02); add(0.16, 0.18, 0.08, MAT.crateWood, sx * (w / 2 - 0.06), 0.25, d / 2 + 0.03); }
  const n = 4, pw = (w - 0.24) / n;
  for (let i = 1; i < n; i++) add(0.035, h - 0.42, 0.02, MAT.black || MAT.darkWood, -w / 2 + 0.12 + i * pw, h / 2 + 0.02, d / 2 + 0.005);
  add(w - 0.24, 0.05, 0.03, MAT.crateWood, 0, h - 0.2, d / 2 + 0.01);
}
const cabinetAt = (r, x, z, ry, w, h, d) => {
  const F = new Frame(r, x, r.fy, z, ry);
  bigCabinet((bw, bh, bd, m, px, py, pz) => F.box(bw, bh, bd, m, px, py, pz), w, h, d);
  F.collide(-w / 2 - 0.05, w / 2 + 0.05, 0, h, -d / 2, d / 2 + 0.04);
  return F;
};

FURNISH.big = r => {
  // 6.23: a long stone room, twelve tiles across and fourteen deep. You come up from the stairs bottom left;
  // the ways to the left room and the back way out are at the far end. Down its right half stand big cabinets
  // in pairs: two along the top wall (they move aside, and behind them is a panel held by four screws),
  // two more pairs further down, and a lower pair at the bottom with something on top of the right one.
  const CW = tm(2.6), CD = 1.2, CH = 3.3, XL = tm(7.5), XR = tm(10.5);
  MAN.b1ShelfL = movable(r, XL, tm(0) + WT + CD / 2, CW, CD, CH); MAN.b1ShelfR = movable(r, XR, tm(0) + WT + CD / 2, CW, CD, CH);
  for (const sh of [MAN.b1ShelfL, MAN.b1ShelfR]) bigCabinet((bw, bh, bd, m, px, py, pz) => sh.add(new THREE.BoxGeometry(bw, bh, bd), m, px, py, pz), CW, CH, CD);
  // apart: the left one well to the left, the right one up to the wall
  MAN.b1ShelfL.dx = -1.0; MAN.b1ShelfR.dx = tm(12) - WT - 0.04 - (XR + CW / 2);
  const gapX = (XL + CW / 2 + MAN.b1ShelfL.dx + XR - CW / 2 + MAN.b1ShelfR.dx) / 2;
  examine(r, XL, 1.6, tm(0) + WT + CD + 0.05, CW - 0.2, 2.8, 0.2, () => (STORY.flags.b1Shelves ? null : '棚を調べる'), () => STORY.event('b1Shelf', 'L'));
  examine(r, XR, 1.6, tm(0) + WT + CD + 0.05, CW - 0.2, 2.8, 0.2, () => (STORY.flags.b1Shelves ? null : '棚を調べる'), () => STORY.event('b1Shelf', 'R'));
  const pz = tm(0) + WT + 0.02;
  MAN.b1Safe = wallPic(r, gapX, 1.45, pz + 0.004, 0, 0.9, 0.7, (g, w, h) => { g.fillStyle = '#151515'; g.fillRect(0, 0, w, h); g.strokeStyle = '#666'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#444'; g.beginPath(); g.arc(70, h / 2, 34, 0, TAU); g.fill(); g.fillStyle = '#ccc'; g.font = 'bold 34px monospace'; g.fillText('■■■■', 120, h / 2 + 12); }, { cw: 256, ch: 200 });
  MAN.b1Panel = new THREE.Group(); r.group.add(MAN.b1Panel);
  const pn = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.03), MAT.metalPanel || MAT.steel); pn.position.set(gapX, 1.45, pz + 0.02); MAN.b1Panel.add(pn);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10), MAT.brass); sc.rotation.x = Math.PI / 2; sc.position.set(gapX + sx * 0.42, 1.45 + sy * 0.32, pz + 0.04); MAN.b1Panel.add(sc); }
  interactBox(r, gapX, 1.45, pz + 0.15, 1.0, 0.8, 0.3, () => (!STORY.flags.b1Shelves ? null : !STORY.flags.b1Panel ? 'パネルを調べる' : !STORY.hasGot('k_annex') ? '金庫を調べる' : null), () => STORY.event('b1Panel'), { icon: 'eye', tag: 'b1panel' });
  // two more pairs down the room, their fronts towards the stairs
  for (const zf of [6, 11]) for (const x of [XL, XR]) cabinetAt(r, x, tm(zf) - CD / 2, 0, CW, CH, CD);
  // the lower pair along the bottom wall; on top of the right one, in the corner, the jail key
  const DD = 1.0, DH = 2.5, zD = tm(14) - WT - DD / 2;
  for (const x of [XL, XR]) cabinetAt(r, x, zD, Math.PI, CW, DH, DD);
  const kz = zD - DD / 2 + 0.25;
  shineAt(r, XR + 0.5, DH + 0.02, kz, 'k_bjail');
  examine(r, XR, DH - 0.6, zD - DD / 2 - 0.05, CW - 0.2, 1.2, 0.3, () => (STORY.hasGot('k_bjail') ? null : '棚の上を調べる'), () => STORY.event('b1High', 'k_bjail'));
  // she waits at the far end, on the open side, with her back to you
  r.mikaAt = { x: tm(3), z: tm(1.4) };
};
FURNISH.b1left = r => {
  // 6.23 / ひろし編: a full bookcase top left, a tall plain shelf top middle with the bit on top of it (a chair to reach
  // it), a cabinet top right, the chair loose in the room, and a low table under a red cloth bottom left
  addBookshelf(r, tm(-8) + 0.1, tm(1) + 0.3, 0, tm(1.7), 2.6);
  addBookshelf(r, tm(-5.5), tm(1) + 0.3, 0, tm(1.2), 2.6, { mat: MAT.crateWood });
  shineAt(r, tm(-5.5), 2.62, tm(1) + 0.3, 'bitMinus');
  examine(r, tm(-5.5), 1.8, tm(1) + 0.5, tm(1.2), 2.6, 0.6, () => (STORY.hasGot('bitMinus') ? null : '棚の上を調べる'), () => STORY.event('b1High', 'bitMinus'));
  addDresser(r, tm(-3) - 0.75, tm(1) + 0.3, 0, { w: 1.3, h: 1.3, d: 0.5, rows: 4, cols: 1, mat: MAT.darkWood, still: true });
  chairInteract(MAN.b1Chair = addChairW(r, tm(-4.3), tm(4.6), -0.5, MAT.wood), 'b1');
  const lt = new Frame(r, tm(-7.6), 0, tm(6.4), 0), red = std({ color: 0x8a1a1a, roughness: 0.9 });
  lt.box(1.9, 0.05, 1.1, MAT.darkWood, 0, 0.42, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) lt.box(0.06, 0.4, 0.06, MAT.darkWood, sx * 0.85, 0.2, sz * 0.45);
  lt.box(1.96, 0.012, 1.16, red, 0, 0.452, 0); for (const sz of [-1, 1]) lt.box(1.96, 0.18, 0.012, red, 0, 0.36, sz * 0.58); for (const sx of [-1, 1]) lt.box(0.012, 0.18, 1.16, red, sx * 0.98, 0.36, 0);
  lt.collide(-0.98, 0.98, 0, 0.46, -0.58, 0.58);
};
FURNISH.back = r => {
  // 6.23 / ひろし編: a big pale rug in the middle, a small chest of drawers top left, the wardrobe top right, the way
  // out in the middle of the top wall
  paleRug(r, tm(17.5), tm(4.8), tm(3.6), tm(3.4));
  addDresser(r, tm(14) + 0.75, tm(1) + 0.3, 0, { w: 1.3, h: 0.95, d: 0.5, rows: 3, cols: 1, mat: MAT.darkWood, still: true });
  MAN.backCloset = addTansu(r, tm(21) - 0.6, tm(1) + 0.5, 0);
};
FURNISH.bjail = r => {
  // the cell along the top; inside it a candle and, on its back wall, two scrawls
  MAN.bjCell = addBarsZ(r, tm(23), tm(31), tm(3), tm(26), tm(27), { prompt: g => (g.open ? null : '鉄格子の扉を開ける') });
  const st = new Frame(r, tm(24.5), 0, tm(1.2), 0); st.box(0.4, 0.4, 0.4, MAT.darkWood, 0, 0.2, 0); st.collide(-0.2, 0.2, 0, 0.4, -0.2, 0.2);
  MAN.bjCandle = addCandle(st, 0, 0.4, 0, r); MAN.bjCandle.state = 'off'; MAN.bjCandle.level = 0; MAN.bjCandle.intensity = 3; MAN.bjCandle.range = 10;
  interactBox(r, tm(24.5), 0.6, tm(1.2), 0.5, 0.5, 0.5, () => (MAN.bjCandle.state === 'on' ? null : 'ろうそくを調べる'), () => STORY.event('bjCandle'), { icon: 'hand', tag: 'candleB1' });
  const wz = tm(0) + WT + 0.012;
  wallPic(r, tm(25), 1.6, wz, 0, 1.6, 1.0, (g, w, h) => drawJailScrawl(g, w, h, false), { cw: 512, ch: 320, transparent: true });
  wallPic(r, tm(28.5), 1.6, wz, 0, 1.2, 1.0, drawPeekScrawl, { cw: 320, ch: 256, transparent: true });
  interactBox(r, tm(25), 1.6, wz + 0.2, 1.6, 1.0, 0.3, () => '落書きを調べる', () => STORY.event('bjScrawl'), { icon: 'eye', dist: 7.5 });   // (it can be looked at from outside the bars too)
  interactBox(r, tm(28.5), 1.6, wz + 0.2, 1.2, 1.0, 0.3, () => '落書きを調べる', () => STORY.event('bjPeek'), { icon: 'eye', dist: 7.5 });
};
FURNISH.bridge = r => {
  // where the statue ends up, in pieces, at the foot of the stairs
  const g = MAN.rubble = new THREE.Group(); g.visible = false; r.group.add(g);
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.12, 0), MAT.marble); b.position.set(tm(17.5) + (Math.random() - 0.5) * 1.6, 0.08, tm(-6.6) + (Math.random() - 0.5) * 1.2); b.rotation.set(Math.random() * 3, Math.random() * 3, 0); g.add(b); }
  shineAt(r, tm(17.5), 0.05, tm(-6.4), 'stoneBlue', false);
  interactBox(r, tm(17.5), 0.2, tm(-6.5), 1.6, 0.4, 1.2, () => (MAN.rubble.visible && !STORY.hasGot('stoneBlue') ? '像の残骸を調べる' : null), () => GAME.take('stoneBlue', MAN.props.stoneBlue), { icon: 'eye' });
};
FURNISH.a1hall = r => {
  addPlant(r, tm(10) + 0.5, tm(5) + 1.2, 1.1); addPlant(r, tm(19) - 0.5, tm(0) + 0.5, 1.0);
  addRug(r, tm(14.5), tm(3), tm(4), tm(2.4), 0, 11);
};
// a plain pale rug with a darker edge (the original's rooms in the annexes)
function paleRug(r, x, z, w, d, col = 0xd6d2c6) {
  const F = new Frame(r, x, r.fy + 0.006, z, 0), g0 = new THREE.PlaneGeometry(w, d); g0.rotateX(-Math.PI / 2);
  const g1 = new THREE.PlaneGeometry(w - 0.24, d - 0.24); g1.rotateX(-Math.PI / 2);
  F.geo(g0, std({ color: 0x9a968a, roughness: 1 }), 0, 0, 0); F.geo(g1, std({ color: col, roughness: 1 }), 0, 0.002, 0);
}
FURNISH.a1bl = r => {
  // 6.23 / ひろし編: a pale rug in the middle with a rope hanging over it from the ceiling; the door top middle,
  // the panel with a doll drawn on it top left, and a low table of dolls along the left wall at the bottom
  paleRug(r, tm(4), tm(-0.3), tm(2.8), tm(2.6));
  const tb = new Frame(r, tm(0) + 0.65, 0, tm(1.5), Math.PI / 2); tb.box(2.6, 0.06, 0.8, MAT.darkWood, 0, 0.62, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) tb.box(0.07, 0.6, 0.07, MAT.darkWood, sx * 1.2, 0.3, sz * 0.32); tb.collide(-1.3, 1.3, 0, 0.66, -0.4, 0.4);
  MAN.dolls = [];
  for (let i = 0; i < 5; i++) { const d = makeDoll(1.3, { dress: [0x8a1c2a, 0x2a3a8a, 0x5a2a6a, 0x2a6a3a, 0x8a6a1c][i] }); d.position.copy(tb.pt(1.0 - i * 0.5, 0.65, 0.05)); d.rotation.y = Math.PI / 2 + 0.15 * (i - 2); r.group.add(d); MAN.dolls.push(d); }
  MAN.props.doll = MAN.dolls[4];   // the one at the bottom end (the original: "the doll bottom left")
  const dp = MAN.props.doll.position;
  interactBox(r, dp.x, 0.9, dp.z, 0.5, 0.5, 0.5, () => (STORY.hasGot('doll') ? null : '人形を調べる'), () => GAME.take('doll', MAN.props.doll), { icon: 'hand' });
  examine(r, tm(0) + 0.65, 0.9, tm(1.2), 0.5, 0.5, 2.2, () => '人形が並んでいる', () => GAME.say([['', 'テーブルに人形が並んでいる。']]));
  for (let i = 0; i < 3; i++) { const bl = new THREE.Mesh(new THREE.CircleGeometry(0.2 + Math.random() * 0.3, 16), new THREE.MeshStandardMaterial({ color: 0x2a0303, roughness: 0.3 })); bl.userData.ownMat = true; bl.rotation.x = -Math.PI / 2; bl.position.set(tm(6.6 - i * 0.7), 0.006, tm(1.4 + (i % 2) * 0.6)); r.group.add(bl); }
  // the rope: from the ceiling down to a loop at the height of a neck
  const ropeM = std({ color: 0x8a7a5a, roughness: 1 }), rp = new Frame(r, tm(4), 0, tm(-0.3), 0);
  rp.cyl(0.016, 0.016, WALL_H - 2.0, ropeM, 0, (WALL_H + 2.0) / 2, 0, 6); rp.geo(new THREE.TorusGeometry(0.14, 0.022, 6, 16), ropeM, 0, 1.86, 0, Math.PI / 2 - 0.25);
  r.tkHang = { x: tm(4), z: tm(-0.3) + 0.04, yaw: 0 };   // he hangs there (after he ran from the left room)
  r.tkDown = { x: tm(4.2), z: tm(0.5), yaw: 0.6 };        // and drops there
  const bl = MAN.a1Blood = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshStandardMaterial({ color: 0x3a0505, roughness: 0.2 })); bl.userData.ownMat = true; bl.rotation.x = -Math.PI / 2; bl.scale.set(1.4, 0.9, 1); bl.position.set(tm(4.1), 0.009, tm(0.6)); bl.visible = false; r.group.add(bl);
  const wz = tm(-4) + WT + 0.012;
  MAN.a1SafeFace = wallPic(r, tm(1.2), 1.5, wz, 0, 0.8, 0.6, (g, w, h) => { g.fillStyle = '#141414'; g.fillRect(0, 0, w, h); g.strokeStyle = '#777'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#555'; g.beginPath(); g.arc(w / 2, h / 2, 40, 0, TAU); g.fill(); }, { cw: 256, ch: 192 });
  MAN.a1Panel = wallPic(r, tm(1.2), 1.5, wz + 0.01, 0, 0.9, 0.7, (g, w, h) => { g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6a5a40'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); drawDollPicture(g, w / 2, h / 2 + 10, 1.4); }, { cw: 256, ch: 200 });
  interactBox(r, tm(1.2), 1.5, wz + 0.15, 0.9, 0.7, 0.3, () => (!STORY.flags.dollPanel ? '絵の描かれたパネルを調べる' : !STORY.hasGot('k_ab') ? '金庫を調べる' : null), () => STORY.event('a1Panel'), { icon: 'eye', tag: 'dollPanel' });
};
FURNISH.a1left = r => {
  MAN.a1Closet = addTansu(r, tm(0) + 0.6, tm(5) + 0.5, 0);
  const tb = new Frame(r, tm(5.5), 0, tm(6), 0); tb.box(0.8, 0.05, 0.6, MAT.darkWood, 0, 0.72, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) tb.box(0.05, 0.7, 0.05, MAT.darkWood, sx * 0.35, 0.35, sz * 0.25); tb.collide(-0.4, 0.4, 0, 0.75, -0.3, 0.3);
  MAN.a1Candle = addCandle(tb, 0, 0.745, 0, r); MAN.a1Candle.state = 'off'; MAN.a1Candle.level = 0; MAN.a1Candle.intensity = 9; MAN.a1Candle.range = 18;
  interactBox(r, tm(5.5), 0.9, tm(6), 0.5, 0.4, 0.5, () => (MAN.a1Candle.state === 'on' ? null : 'ろうそくを調べる'), () => STORY.event('a1Candle'), { icon: 'hand', tag: 'candleA1' });
  MAN.statue = pedestalBust(r, tm(3.5), tm(9.5)); MAN.statue.key = 'statue'; MAN.statue.home = { x: tm(3.5), z: tm(9.5) };
  r.addInteract(MAN.statue.g, { dist: 2.4, icon: 'hand', prompt: () => (PUSH.obj || !STORY.flags.takeshiRan || STORY.flags.statueBroken ? null : '像を押す'), use: () => STORY.event('statue') });
  r.tkAt = { x: tm(6.6), z: tm(9.8), yaw: -2.4 };
};
FURNISH.a1corA = r => { MAN.a1Hole = floorHole(r, cx(24), cx(2)); MAN.a1Hole.m.visible = false; MAN.a1Hole.col.on = false; };   // (between the two doors, as on 6.23's map)
FURNISH.a1stair = r => { addCrate(r, tm(19) + 0.5, tm(-4) + 0.5, 0.8, 0.3); };
FURNISH.a1br = r => {
  // 6.23 / ひろし編: a pale rug in the middle, the door top middle with the light switch left of it, a small chest of
  // drawers top left, and the doll with no eyes alone on a little stand at the bottom right, by the right-hand wall
  paleRug(r, tm(33.6), tm(-8.6), tm(2.6), tm(2.4));
  addDresser(r, tm(30) + 0.7, tm(-12) + 0.3, 0, { w: 1.2, h: 0.9, d: 0.5, rows: 3, cols: 1, mat: MAT.wood, still: true });
  const DZ = cx(-7), st = new Frame(r, tm(36.2), 0, DZ, 0);
  st.cyl(0.3, 0.3, 0.04, MAT.darkWood, 0, 0.7, 0, 18); st.cyl(0.05, 0.07, 0.68, MAT.darkWood, 0, 0.34, 0, 10); st.cyl(0.22, 0.24, 0.03, MAT.darkWood, 0, 0.015, 0, 14); st.collide(-0.3, 0.3, 0, 0.72, -0.3, 0.3);
  // the doll with no eyes (and later, no head, and later a light bulb for one)
  const d3 = MAN.doll3 = makeDoll(1.5, { noEyes: true, dress: 0xd0d0c8 }); d3.position.copy(st.pt(0, 0.72, 0)); d3.rotation.y = -Math.PI / 2 + 0.3; r.group.add(d3);
  const bulb = MAN.doll3Bulb = new THREE.Group(); bulb.visible = false; bulb.position.y = 0.36; d3.add(bulb);
  const bm = MAN.doll3BulbMat = new THREE.MeshStandardMaterial({ color: 0xfff4c0, emissive: 0xffe8a0, emissiveIntensity: 0.2, roughness: 0.2 });
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), bm); glass.scale.y = 1.25; bulb.add(glass);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), MAT.brass); cap.position.y = -0.1; bulb.add(cap);
  interactBox(r, d3.position.x, 0.95, d3.position.z, 0.4, 0.5, 0.4, () => (STORY.flags.bulbHead ? (STORY.flags.shadowCut ? null : '人形を調べる') : '人形を調べる'), () => STORY.event('doll3'), { icon: 'eye', tag: 'doll3' });
  // the switch, left of the door
  const sw = new Frame(r, tm(31) - 0.2, 0, tm(-12) + WT + 0.02, 0); sw.box(0.12, 0.18, 0.03, AOM.white, 0, 1.25, 0); sw.box(0.03, 0.07, 0.04, MAT.black, 0, 1.25, 0.02);
  interactBox(r, tm(31) - 0.2, 1.25, tm(-12) + 0.25, 0.3, 0.3, 0.3, () => 'スイッチを押す', () => STORY.event('a1Switch'), { icon: 'hand' });
  // the doll's shadow, thrown along the floor to the right-hand wall once the room is dark and its head is lit
  const dx = d3.position.x, ex = tm(38) - WT - 0.05, shw = ex - dx + 0.9;
  MAN.dollShadow = wallPic(r, (dx - 0.9 + ex) / 2, 0.016, DZ, 0, shw, 2.4, (g, w, h) => {
    const k = 0.9 / shw, x0 = w * k;   // where the doll stands along it
    const pool = g.createRadialGradient(x0, h / 2, 4, x0, h / 2, w * 0.42); pool.addColorStop(0, 'rgba(255,214,150,.55)'); pool.addColorStop(1, 'rgba(255,200,130,0)');
    g.fillStyle = 'rgba(0,0,0,.92)'; g.beginPath(); g.moveTo(x0 + 6, h / 2 - 10); g.lineTo(w * 0.86, h / 2 - 34); g.lineTo(w, h / 2 - 22); g.lineTo(w, h / 2 + 22); g.lineTo(w * 0.86, h / 2 + 34); g.lineTo(x0 + 6, h / 2 + 10); g.closePath(); g.fill();
    g.beginPath(); g.arc(w * 0.93, h / 2, 30, 0, TAU); g.fill();
  }, { cw: 640, ch: 256, transparent: true, rx: -Math.PI / 2 });
  MAN.dollShadow.material = new THREE.MeshBasicMaterial({ map: MAN.dollShadow.material.map, transparent: true, depthWrite: false });
  // and its shadow standing up on the right-hand wall, where the hidden door is
  MAN.dollWallShadow = wallPic(r, tm(38) - WT - 0.025, 1.2, DZ, -Math.PI / 2, 2.0, 2.4, (g, w, h) => {
    const halo = g.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, w * 0.62); halo.addColorStop(0, 'rgba(255,205,130,.5)'); halo.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = halo; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.9)'; g.beginPath(); g.ellipse(w / 2, h * 0.28, w * 0.2, w * 0.22, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(w * 0.22, h); g.lineTo(w * 0.78, h); g.lineTo(w * 0.56, h * 0.44); g.lineTo(w * 0.44, h * 0.44); g.closePath(); g.fill();
  }, { cw: 200, ch: 240, transparent: true });
  MAN.dollWallShadow.material = new THREE.MeshBasicMaterial({ map: MAN.dollWallShadow.material.map, transparent: true, depthWrite: false });
  MAN.dollWallShadow.visible = false;
  MAN.dollShadow.visible = false;
};
FURNISH.a2left = r => {
  // the one dim bulb hanging over the room
  MAN.a2Bulb = addBulb(r, tm(4), WALL_H, tm(0.5), { intensity: 2.4, range: 9, drop: 1.0 });
  examine(r, tm(4), WALL_H - 1.15, tm(0.5), 0.4, 0.5, 0.4, () => (STORY.hasGot('bulb') ? null : '電球を調べる'), () => STORY.event('a2Bulb'));
  addSimpleBed(r, tm(1) + 0.1, tm(-2) + 1.1);
  addDresser(r, tm(6), tm(-3) + 0.3, 0, { w: 1.2, h: 0.9, d: 0.5, rows: 3, cols: 1, mat: MAT.wood, still: true });
};
FURNISH.a2fire = r => {
  // 6.23 / ひろし編: a dining room. The fireplace in the middle of the top wall (it comes crawling out of it), a bust
  // on a pedestal top left, and a long table under a white cloth down the middle of the room, chairs along both sides
  const fx = tm(22), fz = tm(-3) + 0.28;
  MAN.fire = addFireplace(r, fx, fz, 0); MAN.fire.state = 'off'; MAN.fire.level = 0;
  MAN.fireAt = { x: fx, z: fz + 0.15, yaw: 0 };   // where it comes out, facing into the room
  shineAt(r, fx, 0.12, fz + 0.3, 'stoneRed', false);
  interactBox(r, fx, 0.6, fz + 0.4, 1.2, 0.9, 0.6, () => (MAN.fire.state === 'on' ? (STORY.hasGot('stoneRed') ? null : '火を調べる') : '暖炉を調べる'), () => STORY.event('fireplace'), { icon: 'eye', tag: 'fireplace' });
  MAN.fireDoll = makeDoll(1.3); MAN.fireDoll.visible = false; MAN.fireDoll.position.set(fx, 0.06, fz + 0.3); MAN.fireDoll.rotation.y = 0; r.group.add(MAN.fireDoll);
  const bust = new Frame(r, tm(18) + 0.7, 0, tm(-3) + 0.7, 0);
  bust.box(0.6, 1.0, 0.6, MAT.marble, 0, 0.5, 0); bust.box(0.66, 0.06, 0.66, MAT.marble, 0, 1.03, 0); bust.cyl(0.2, 0.26, 0.3, MAT.marble, 0, 1.2, 0, 14); bust.sph(0.2, MAT.marble, 0, 1.52, 0, 18); bust.collide(-0.33, 0.33, 0, 1.75, -0.33, 0.33);
  const L = tm(4.6), cz = tm(1.3), tb = addTable(r, fx, cz, Math.PI / 2, L, 1.5, 0.78, MAT.wood, false);
  tb.F.box(L + 0.06, 0.006, 1.58, MAT.sheet, 0, 0.784, 0);
  for (let i = 0; i < 4; i++) { const z = cz - L / 2 + L * (i + 0.5) / 4; addChair(r, fx - 1.12, z, Math.PI / 2); addChair(r, fx + 1.12, z, -Math.PI / 2); }
};
FURNISH.a3crate = r => {
  // 6.23: the crate in the room; the nook top right has a hole in its mouth and the oil at its back ("move the crate
  // up to the top right"); the nook top left is empty; the blank paper on the wall between them
  const c = MAN.crate = movable(r, cx(20), cx(-1), 0.95, 0.95, 0.95); c.key = 'crate';
  c.add(new THREE.BoxGeometry(0.95, 0.95, 0.95), MAT.crateWood, 0, 0.475, 0);
  for (const y of [0.12, 0.83]) c.add(new THREE.BoxGeometry(0.97, 0.08, 0.97), MAT.darkWood, 0, y, 0);
  r.addInteract(c.g, { dist: 2.2, icon: 'hand', prompt: () => (STORY.flags.crateIn ? null : '木箱を押す'), use: () => STORY.event('crate') });
  MAN.crateHole = floorHole(r, cx(22), cx(-5));
  shineAt(r, cx(22), 0.05, cx(-6) - 0.2, 'oil2');
  interactBox(r, cx(22), 0.2, cx(-6) - 0.2, 0.6, 0.4, 0.6, () => (STORY.hasGot('oil2') ? null : '光っているものを拾う'), () => GAME.take('oil2', MAN.props.oil2), { icon: 'hand' });
  MAN.poster = wallPic(r, cx(20), 1.7, tm(-4) + WT + 0.012, 0, 0.9, 1.2, (g, w, h) => drawPoster(g, w, h, null), { cw: 256, ch: 320 });
  examine(r, cx(20), 1.7, tm(-4) + 0.3, 0.9, 1.2, 0.3, () => '貼紙を調べる', () => STORY.event('poster'));
};
FURNISH.abbl = r => {
  // the plant pot top left hides a red lever; the bookshelf has the picture book
  const pot = MAN.abPot = movable(r, tm(0) + 0.55, tm(9) + 0.55, 0.6, 0.6, 1.3); pot.add(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 14), MAT.potRed || MAT.pot, 0, 0.25, 0);
  for (let i = 0; i < 6; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), MAT.leaf); lf.position.set(Math.sin(i) * 0.12, 0.7 + (i % 3) * 0.15, Math.cos(i) * 0.12); lf.scale.y = 1.6; pot.g.add(lf); }
  r.addInteract(pot.g, { dist: 2.3, icon: 'hand', prompt: () => (pot.at ? null : '植木鉢を調べる'), use: () => STORY.event('abPot') });
  const lv = new Frame(r, tm(0) + WT + 0.02, 0, tm(9) + 0.55, Math.PI / 2); lv.box(0.18, 0.3, 0.04, MAT.iron, 0, 0.9, 0);
  MAN.abLever = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), std({ color: 0xc02020, roughness: 0.4 })); MAN.abLever.position.y = 0.15; const lp = new THREE.Group(); lv.dyn(lp, 0, 0.9, 0.05); lp.add(MAN.abLever); lp.rotation.x = 0.6; MAN.abLeverPiv = lp;
  interactBox(r, tm(0) + 0.3, 0.9, tm(9) + 0.55, 0.3, 0.5, 0.4, () => (pot.at && !STORY.flags.abLights ? 'レバーを引く' : null), () => STORY.event('abLever'), { icon: 'hand' });
  addBookshelf(r, tm(5), tm(16) - 0.3, Math.PI, tm(2), 2.4);
  examine(r, tm(5), 1.2, tm(16) - 0.6, tm(2), 2.2, 0.4, () => (STORY.hasGot('book') ? '本棚だ' : '本棚を調べる'), () => STORY.event('abShelfBook'));
};
FURNISH.abtl = r => {
  // the bath at the top behind a curtain; under it (behind the boards of the wall) the hidden stairs
  const tubX = cx(3.5), tubZ = tm(-6) + 0.55;
  const tub = MAN.abTub = movable(r, tubX, tubZ, 2.0, 0.95, 0.6); tub.add(new THREE.BoxGeometry(2.0, 0.6, 0.95), AOM.white, 0, 0.3, 0); tub.add(new THREE.BoxGeometry(1.8, 0.04, 0.75), MAT.black, 0, 0.42, 0);
  const w = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.04, 0.74), new THREE.MeshStandardMaterial({ color: 0x55604a, roughness: 0.1, transparent: true, opacity: 0.85 })); w.userData.ownMat = true; w.position.y = 0.55; tub.g.add(w); MAN.abWater = w;
  shineAt(r, tubX, 0.45, tubZ, 'keyRed', false);
  MAN.abCover = coverPanel(r, tm(4), tm(-6) - WT / 2 + 0.02, tm(2), 0, AOM.wallStone);
  const cur = MAN.abCurtain = new THREE.Mesh(new THREE.PlaneGeometry(tm(4), 2.6), new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 1, side: THREE.DoubleSide })); cur.userData.ownMat = true; cur.position.set(tm(4.5), 1.4, tm(-6) + 1.25); r.group.add(cur);
  const curCol = r.addCollider(tm(2.5), tm(6.5), 0, 2.6, tm(-6) + 1.2, tm(-6) + 1.3, 'furn');
  MAN.abCurtainCol = curCol;
  interactBox(r, tm(4.5), 1.4, tm(-6) + 1.25, tm(4), 2.4, 0.2, () => (MAN.abCurtain.visible ? 'カーテンを調べる' : null), () => STORY.event('abCurtain'), { icon: 'hand' });
  interactBox(r, tubX, 0.5, tubZ, 2.0, 0.6, 0.95, () => (MAN.abCurtain.visible ? null : !STORY.flags.abDrained ? '浴槽を調べる' : !STORY.hasGot('keyRed') ? '浴槽の底を調べる' : !MAN.abTub.at ? '浴槽を動かす' : null), () => STORY.event('abTub'), { icon: 'hand' });
};
FURNISH.ablat = r => {
  MAN.latGate = addBarsZ(r, tm(30), tm(37), tm(-20.5), tm(33), tm(34), { prompt: g => (g.open ? null : '格子戸を調べる'), use: () => STORY.event('latGate') });
  // three pictures, red, yellow and blue, each with a button under it
  const wz = tm(-24) + WT + 0.012, cols = ['#c8202a', '#e0c020', '#2040c0'], names = ['red', 'yellow', 'blue'];
  MAN.latPics = [];
  names.forEach((nm, i) => {
    const x = tm(31.2 + i * 2.3);
    const p = wallPic(r, x, 1.8, wz, 0, 0.9, 1.1, (g, w, h) => { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5a4a30'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = cols[i]; g.beginPath(); g.arc(w / 2, h / 2, w * 0.3, 0, TAU); g.fill(); }, { cw: 200, ch: 240 });
    MAN.latPics.push(p);
    const b = new Frame(r, x, 0, wz, 0); b.cyl(0.06, 0.06, 0.04, std({ color: 0x9a9a9a, metalness: 0.6, roughness: 0.4 }), 0, 1.05, 0.02, 14, Math.PI / 2, 0, 0);
    interactBox(r, x, 1.05, wz + 0.15, 0.3, 0.3, 0.3, () => (STORY.hasGot('rod') ? null : 'ボタンを押す'), () => STORY.event('latButton', nm), { icon: 'hand' });
  });
  shineAt(r, tm(33.5), 0.05, tm(-23.3), 'rod', false);
  interactBox(r, tm(33.5), 0.2, tm(-23.3), 0.6, 0.4, 0.6, () => (MAN.props.rod.visible && !STORY.hasGot('rod') ? '光っているものを拾う' : null), () => GAME.take('rod', MAN.props.rod), { icon: 'hand' });
};
FURNISH.abcorB = r => {
  // the door at the top with four coloured bars; the box beside it
  const d = MAN.doors.corBAB_C;
  ['#c8202a', '#2040c0', '#20a040', '#e0c020'].forEach((c, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.012), std({ color: c, roughness: 0.6 })); b.position.set(0.3 + i * 0.25, 1.5, 0.04); d.piv.add(b); });
  const dx = tm(20) + 0.55, wz = tm(-4) + WT + 0.012;
  MAN.abDevice = wallPic(r, dx, 1.3, wz, 0, 0.5, 0.6, (g, w, h) => drawDevice(g, w, h, 0), { cw: 200, ch: 240 });
  interactBox(r, dx, 1.3, wz + 0.15, 0.5, 0.6, 0.3, () => (STORY.flags.codeOpen ? null : '装置を調べる'), () => STORY.event('abDevice'), { icon: 'eye', tag: 'device' });
  // the low shelf at the bottom end, in front of the hidden door
  const sh = MAN.abLowShelf = movable(r, cx(19), tm(7) - 0.35, tm(1) + 0.3, 0.6, 1.4);
  sh.add(new THREE.BoxGeometry(tm(1) + 0.3, 1.4, 0.6), MAT.crateWood, 0, 0.7, 0); for (let i = 0; i < 3; i++) sh.add(new THREE.BoxGeometry(tm(1) + 0.1, 0.04, 0.02), MAT.darkWood, 0, 0.3 + i * 0.4, -0.31);
  r.addInteract(sh.g, { dist: 2.4, icon: 'hand', prompt: () => (sh.at ? null : '棚を調べる'), use: () => STORY.event('abLowShelf') });
};
FURNISH.abfront = r => {
  addRug(r, tm(13.5), tm(-11), tm(3.5), tm(2.6), 0, 17);
  MAN.abFrontCloset = addTansu(r, tm(17) - 0.6, tm(-14) + 0.5, 0);
  shineAt(r, tm(13.5) - tm(1.6), 0.03, tm(-11) + tm(1.1), 'disc', false);
  examine(r, tm(13.5) - tm(1.5), 0.15, tm(-11) + tm(1.0), 1.2, 0.3, 1.0, () => (STORY.hasGot('disc') ? null : '敷物を調べる'), () => STORY.event('abRug'));
};
FURNISH.abback = r => {
  MAN.tkrCloset = addTansu(r, tm(18) + 0.6, tm(-27) + 0.5, 0);
  const talk = () => { const f = STORY.flags; return !f.takuroAB || (f.ropeSeen && !f.takuroWith && !f.hidChase); };
  MAN.tkrCloset.prompt = () => (talk() ? 'タンスを調べる' : 'クローゼットに隠れる');
  MAN.tkrCloset.use = () => (talk() ? STORY.event('takuroAB') : GAME.enterHide(MAN.tkrCloset));
  addSimpleBed(r, tm(25) - 0.7, tm(-27) + 1.2);
  addCrate(r, tm(22), tm(-21.6), 0.7, 0.2);
};
FURNISH.abhidB = r => {
  // the rope ladder at the end, up through a hole in the ceiling
  const g = MAN.ropeAB = new THREE.Group(), x = tm(29.5), z = tm(15);
  for (const s of [-1, 1]) { const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, WALL_H, 6), std({ color: 0x8a7a5a, roughness: 1 })); rp.position.set(x + s * 0.2, WALL_H / 2, z); g.add(rp); }
  for (let y = 0.3; y < WALL_H; y += 0.32) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6), MAT.wood); st.rotation.z = Math.PI / 2; st.position.set(x, y, z); g.add(st); }
  r.group.add(g);
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), MAT.void); hole.rotation.x = Math.PI / 2; hole.position.set(x, WALL_H - 0.01, z); r.group.add(hole);
  interactBox(r, x, 1.4, z, 0.8, 2.6, 0.5, () => (STORY.flags.ladderCut ? null : '縄ばしごを調べる'), () => STORY.event('ropeAB'), { icon: 'hand' });
  shineAt(r, tm(25), 0.04, tm(14.6), 'k_back', false);
  interactBox(r, tm(25), 0.2, tm(14.6), 0.6, 0.4, 0.6, () => (MAN.props.k_back.visible && !STORY.hasGot('k_back') ? '光っているものを拾う' : null), () => GAME.take('k_back', MAN.props.k_back), { icon: 'hand' });
};
FURNISH.cloister = r => {
  // a roof of beams on posts over the path, lanterns on the posts, the garden's hedges either side
  const posts = [[0, 1], [0, 5], [0, 9], [3, 1], [3, 5], [3, 9], [5, 11], [9, 11], [13, 11], [17, 11], [5, 14], [9, 14], [13, 14], [17, 14]];
  for (const [x, z] of posts) { const F = new Frame(r, tm(x) + (x === 3 ? -0.15 : 0.15), 0, tm(z) + (z === 14 ? -0.15 : 0.15), 0); F.box(0.16, 3.4, 0.16, MAT.darkWood, 0, 1.7, 0); }
  const roof = new Frame(r, 0, 0, 0, 0);
  roof.box(tm(3), 0.1, tm(14), MAT.darkWood, tm(1.5), 3.45, tm(7)); roof.box(tm(16), 0.1, tm(3), MAT.darkWood, tm(11), 3.45, tm(12.5));
  for (const [x, z] of [[1.5, 3], [1.5, 8], [7, 12.5], [14, 12.5]]) addBulb(r, tm(x), 3.4, tm(z), { intensity: 2.6, range: 10, drop: 0.4 });
  for (let i = 0; i < 8; i++) addPlant(r, tm(i % 2 ? 2.7 : 0.3), tm(1 + i * 1.3), 0.8);
};
FURNISH.s1tl = r => {
  // four dice drawn on the wall (after the real one is put to it, each shows one white dot)
  MAN.diceWall = wallPic(r, tm(7.5), 1.7, tm(-17) + WT + 0.012, 0, 3.2, 0.9, (g, w, h) => drawDiceWall(g, w, h, null), { cw: 640, ch: 180 });
  interactBox(r, tm(7.5), 1.7, tm(-17) + 0.3, 3.2, 0.9, 0.3, () => 'サイコロの絵を調べる', () => STORY.event('diceWall'), { icon: 'eye', tag: 'diceWall' });
  r.landing = { x: tm(8.5), z: tm(-14.5) };
};
FURNISH.s1bl = r => { MAN.s1Closet = addTansu(r, tm(11) - 0.6, tm(-8), -Math.PI / 2); addSimpleBed(r, tm(5) + 0.1, tm(-10) + 1.1); };
FURNISH.s1cor = r => {
  MAN.s1Hole = floorHole(r, cx(18), cx(1));
  interactBox(r, cx(18), 0.3, cx(1), T - 0.2, 0.6, T - 0.2, () => (STORY.flags.ladderHung ? '縄ばしごで下りる' : '穴を調べる'), () => STORY.event('s1Hole'), { icon: 'eye', tag: 'hole' });
  const g = MAN.ropeS1 = new THREE.Group(); g.visible = false; r.group.add(g);
  for (const s of [-1, 1]) { const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6), std({ color: 0x8a7a5a, roughness: 1 })); rp.position.set(cx(18) + s * 0.2, -0.3, cx(1) - 0.6); g.add(rp); }
};
FURNISH.s1ch = r => {
  // six pews, three a side (like the six on a die); the altar at the top, the stairs under it
  MAN.pews = [];
  for (const [i, x, z] of [[0, 15, -12], [1, 15, -9.5], [2, 15, -7], [3, 19, -12], [4, 19, -9.5], [5, 19, -7]]) {
    const F = new Frame(r, cx(x), 0, tm(z), 0); F.box(2.8, 0.08, 0.5, MAT.darkWood, 0, 0.45, 0); F.box(2.8, 0.6, 0.06, MAT.darkWood, 0, 0.75, -0.24); for (const sx of [-1, 1]) F.box(0.06, 0.45, 0.5, MAT.darkWood, sx * 1.37, 0.22, 0);
    if (i === 4) F.box(2.6, 0.012, 0.04, AOM.white, 0, 0.5, 0.1);   // one with a white line on it: the stick
    F.collide(-1.4, 1.4, 0, 1.05, -0.27, 0.25);
    MAN.pews.push({ i, x: cx(x), z: tm(z) });
    interactBox(r, cx(x), 0.25, tm(z) + 0.1, 2.6, 0.4, 0.4, () => (STORY.flags.altarMoved ? null : '長椅子の下を調べる'), () => STORY.event('pewButton', i), { icon: 'hand' });
  }
  interactBox(r, cx(19), 0.6, tm(-9.5), 2.6, 0.2, 0.4, () => (STORY.hasGot('stick') ? null : '長椅子を調べる'), () => STORY.event('pewStick'), { icon: 'eye' });
  shineAt(r, cx(19) + 0.6, 0.52, tm(-9.5) + 0.1, 'stick');
  const alt = MAN.altar = movable(r, cx(16.5), tm(-15) + 0.7, tm(2) + 0.2, 1.0, 1.1);
  alt.add(new THREE.BoxGeometry(tm(2) + 0.2, 1.05, 1.0), MAT.marble, 0, 0.525, 0); alt.add(new THREE.BoxGeometry(tm(2) + 0.3, 0.06, 1.1), std({ color: 0x6a1010, roughness: 0.8 }), 0, 1.08, 0);
  MAN.chCover = coverPanel(r, tm(17), tm(-15) - WT / 2 + 0.02, tm(2), 0, AOM.wallStain);
  const cr = new Frame(r, tm(17.5), 0, tm(-15) + WT + 0.03, 0); cr.box(0.12, 1.6, 0.05, std({ color: 0x9a7a3a, metalness: 0.5, roughness: 0.4 }), 3.0, 2.5, 0); cr.box(0.8, 0.12, 0.05, std({ color: 0x9a7a3a, metalness: 0.5, roughness: 0.4 }), 3.0, 2.85, 0);
  for (const sx of [-1, 1]) { const c = new Frame(r, cx(16.5) + sx * 1.2, 0, tm(-15) + 0.7, 0); addCandle(c, 0, 1.08, 0, r); }
};
FURNISH.s2tl = r => {
  MAN.s2Hole = floorHole(r, cx(7), cx(-10)); MAN.s2Hole.col.on = false;   // you can walk into this one (and fall)
  MAN.s2Frame = wallPic(r, tm(4.5), 1.8, tm(-12) + WT + 0.012, 0, 0.8, 0.6, (g, w, h) => { g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8bca0'; g.fillRect(16, 16, w - 32, h - 32); g.fillStyle = '#3a5a8a'; g.fillRect(w / 2 - 30, h / 2 - 20, 60, 40); }, { cw: 200, ch: 150 });
  MAN.s2FrameDown = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.6), MAT.darkWood); MAN.s2FrameDown.position.set(tm(4.5), 0.02, tm(-12) + 0.6); MAN.s2FrameDown.rotation.y = 0.3; MAN.s2FrameDown.visible = false; r.group.add(MAN.s2FrameDown);
  shineAt(r, tm(4.5), 0.05, tm(-12) + 0.6, 'piece1', false);
  interactBox(r, tm(4.5), 0.2, tm(-12) + 0.6, 0.8, 0.4, 0.6, () => (MAN.s2FrameDown.visible && !STORY.hasGot('piece1') ? '落ちた額を調べる' : null), () => GAME.take('piece1', MAN.props.piece1), { icon: 'eye' });
};
FURNISH.s2study = r => {
  addBookshelf(r, tm(12), tm(-13) + 0.3, 0, tm(2.4), 2.6); addBookshelf(r, tm(10) + 0.3, tm(-9), Math.PI / 2, tm(2.4), 2.6);
  const dk = new Frame(r, tm(14.5), 0, tm(-7.5), 0); dk.box(1.6, 0.05, 0.8, MAT.wood, 0, 0.76, 0); dk.box(0.45, 0.72, 0.75, MAT.wood, 0.55, 0.36, 0); dk.box(0.04, 0.72, 0.75, MAT.wood, -0.78, 0.36, 0); dk.collide(-0.8, 0.8, 0, 0.8, -0.4, 0.4);
  chairInteract(MAN.studyChair = addChairW(r, tm(14.5) - 0.3, tm(-7.5) + 0.75, Math.PI, MAT.wood), 'study');
  // the hole high in the wall top right (held by screws), and the picture that falls from the left of it
  const wz = tm(-13) + WT + 0.012;
  MAN.studyHole = wallPic(r, tm(18) - 0.3, 1.3, wz, 0, 0.5, 0.5, (g, w, h) => { g.fillStyle = '#5a5040'; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; g.fillRect(20, 20, w - 40, h - 40); g.fillStyle = '#c0a050'; for (const [x, y] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) { g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); } }, { cw: 128, ch: 128 });
  interactBox(r, tm(18) - 0.3, 1.3, wz + 0.15, 0.5, 0.5, 0.3, () => (STORY.flags.studyScrews ? null : '壁の穴を調べる'), () => STORY.event('studyHole'), { icon: 'eye', tag: 'studyHole' });
  MAN.studySafe = wallPic(r, tm(16), 2.45, wz, 0, 0.6, 0.5, (g, w, h) => { g.fillStyle = '#141414'; g.fillRect(0, 0, w, h); g.strokeStyle = '#777'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#555'; g.beginPath(); g.arc(w / 2, h / 2, 26, 0, TAU); g.fill(); }, { cw: 160, ch: 128 });
  MAN.studyFrame = wallPic(r, tm(16), 2.45, wz + 0.01, 0, 0.8, 0.65, (g, w, h) => { g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8c0a0'; g.fillRect(14, 14, w - 28, h - 28); }, { cw: 160, ch: 128 });
  interactBox(r, tm(16), 2.45, wz + 0.2, 0.8, 0.6, 0.4, () => (STORY.flags.framesFell && !STORY.hasGot('k_sbase') ? '金庫を調べる' : null), () => STORY.event('studySafe'), { icon: 'eye', dist: 3.0 });
};
FURNISH.s2front = r => {
  // 6.23 / ひろし編: blue ink scrawled over every wall, except one stretch of the top wall at the right (the wall
  // with something behind it); a bookcase top left and a dark red rug
  const wz = tm(-4) + WT + 0.012, ez = tm(2) - WT - 0.012, wx = tm(20) + WT + 0.012, ex = tm(27) - WT - 0.012, H = 2.6;
  wallPic(r, tm(22), 1.75, wz, 0, tm(4), H, (g, w, h) => drawBlueScrawl(g, w, h, 5, 1), { cw: 1024, ch: 400, transparent: true });
  wallPic(r, wx, 1.75, tm(-1.5), Math.PI / 2, tm(5), H, (g, w, h) => drawBlueScrawl(g, w, h, 7, 0), { cw: 1024, ch: 400, transparent: true });
  wallPic(r, ex, 1.75, tm(-1), -Math.PI / 2, tm(6), H, (g, w, h) => drawBlueScrawl(g, w, h, 9, 0), { cw: 1024, ch: 400, transparent: true });
  wallPic(r, tm(23.5), 1.75, ez, Math.PI, tm(7), H, (g, w, h) => drawBlueScrawl(g, w, h, 11, 0), { cw: 1024, ch: 400, transparent: true });
  examine(r, tm(22), 1.6, wz + 0.2, tm(4), 1.6, 0.3, () => '落書きを調べる', () => GAME.say([['', '青いインクで、壁一面に落書きがしてある。'], ['', '右のほうだけ、ぷっつりと途切れている。']]));
  addBookshelf(r, tm(20) + 1.0, tm(-4) + 0.3, 0, tm(1.1), 2.4);
  paleRug(r, tm(22), tm(-0.6), tm(3.4), tm(3.4), 0x4a1612);
};
FURNISH.s2back = r => {
  // 6.23 / ひろし編, the room behind the wall: a bookcase top left, the wardrobe top right (to hide in when it comes up
  // from below, through the door you came in by), a dark red rug, and the desk against the left wall with the dice on it
  addBookshelf(r, tm(20) + 1.0, tm(-12) + 0.3, 0, tm(1.1), 2.4);
  MAN.s2Closet = addTansu(r, tm(27) - 0.6, tm(-12) + 0.5, 0);
  paleRug(r, tm(22.4), tm(-9.6), tm(3.2), tm(3.0), 0x4a1612);
  const dx = tm(20) + 0.52, dz = cx(-8.6), dk = new Frame(r, dx, 0, dz, Math.PI / 2);
  dk.box(1.5, 0.05, 0.72, MAT.wood, 0, 0.76, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) dk.box(0.05, 0.74, 0.05, MAT.wood, sx * 0.7, 0.37, sz * 0.31); dk.collide(-0.75, 0.75, 0, 0.8, -0.36, 0.36);
  shineAt(r, dx, 0.8, dz, 'dice');
  interactBox(r, dx, 0.95, dz, 0.5, 0.3, 0.6, () => (STORY.hasGot('dice') ? null : '机の上を調べる'), () => GAME.take('dice', MAN.props.dice), { icon: 'hand' });
};
// the way out: dead trees either side of the mud, a few graves, three stone lanterns, the gate at the far end
function deadTree(r, x, z, h, seed) {
  const rnd = mulberry32(seed), bark = AOM.bark || (AOM.bark = std({ color: 0x241b14, roughness: 1 })), F = new Frame(r, x, 0, z, rnd() * TAU);
  F.cyl(0.11, 0.2, h, bark, 0, h / 2, 0, 7); F.collide(-0.17, 0.17, 0, h, -0.17, 0.17);
  for (let i = 0; i < 5; i++) { const y = h * (0.45 + i * 0.12), a = rnd() * TAU, L = 0.7 + rnd() * 1.1, tilt = 0.7 + rnd() * 0.5;
    const B = new Frame(r, x, 0, z, a); B.cyl(0.025, 0.07, L, bark, Math.sin(tilt) * L / 2, y + Math.cos(tilt) * L / 2, 0, 5, 0, 0, -tilt);
    B.cyl(0.012, 0.03, L * 0.55, bark, Math.sin(tilt) * L * 0.85, y + Math.cos(tilt) * L * 0.85 + 0.2, 0, 4, 0, 0, -tilt + 0.7); }
}
FURNISH.outpath = r => {
  const grass = std({ color: 0x1f2a17, roughness: 1 }), stone = std({ color: 0x5e5d58, roughness: 0.95 });
  for (const sx of [0, 1]) { const F = new Frame(r, sx ? tm(44.15) : tm(40.85), 0.008, tm(-23), 0), g = new THREE.PlaneGeometry(tm(1.7), tm(34)); g.rotateX(-Math.PI / 2); F.geo(g, grass, 0, 0, 0); }
  for (let i = 0, z = -39; z < -7; i++, z += 2.3) { const left = i % 2 === 0; deadTree(r, left ? tm(40) + 0.55 + (i % 3) * 0.25 : tm(45) - 0.55 - (i % 3) * 0.25, tm(z), 3.4 + (i % 4) * 0.5, 31 + i); }
  for (const [x, z] of [[40.6, -33], [44.4, -27], [40.5, -19], [44.5, -13], [44.4, -36]]) { const F = new Frame(r, tm(x), 0, tm(z), x < 42 ? Math.PI / 2 : -Math.PI / 2); F.box(0.55, 0.7, 0.14, stone, 0, 0.35, 0); F.cyl(0.275, 0.275, 0.14, stone, 0, 0.7, 0, 12, Math.PI / 2, 0, 0); F.collide(-0.3, 0.3, 0, 0.85, -0.1, 0.1); }
  for (const [x, z] of [[40.7, -12], [44.3, -24], [40.7, -34]]) {
    const F = new Frame(r, tm(x), 0, tm(z), 0); F.box(0.3, 0.6, 0.3, stone, 0, 0.3, 0); F.box(0.46, 0.34, 0.46, stone, 0, 0.77, 0); F.box(0.56, 0.08, 0.56, stone, 0, 0.98, 0); F.collide(-0.28, 0.28, 0, 1.0, -0.28, 0.28);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.47), emissiveMat(0xffb060, 2.2, 0xffd8a0)); glow.position.copy(F.pt(0, 0.78, 0)); r.group.add(glow);
    r.addFixture({ local: F.pt(0, 0.8, 0), color: 0xffa860, intensity: 3.2, range: 9, kind: 'lantern', shadow: false });
  }
  for (const z of [-35, -26, -17, -9]) r.addFixture({ local: new THREE.Vector3(tm(42.5), 6, tm(z)), color: 0x8a9cc4, intensity: 6, range: 22, kind: 'moon', shadow: false });
  // the gate
  const G = new Frame(r, tm(42.5), 0, tm(-40) + 0.4, 0);
  for (const sx of [-1, 1]) { G.box(0.6, 2.6, 0.6, stone, sx * 3.6, 1.3, 0); G.box(0.72, 0.12, 0.72, stone, sx * 3.6, 2.66, 0); G.collide(sx * 3.6 - 0.3, sx * 3.6 + 0.3, 0, 2.7, -0.3, 0.3); }
  for (const sx of [-1, 1]) { for (let i = 0; i < 8; i++) G.cyl(0.022, 0.022, 2.1, MAT.black, sx * 3.25, 1.05, 0.32 + i * 0.17, 6); for (const y of [0.25, 2.05]) G.box(0.04, 0.05, 1.3, MAT.black, sx * 3.25, y, 0.92); }   // the two leaves, swung open
  r.gateZ = tm(-37);
};
FURNISH.sbinf = r => {
  // four beds behind curtains; each curtain has a shape scrawled on it; one is drawn
  MAN.curtains = [];
  ['tri', 'circle', 'square', 'penta'].forEach((sh, i) => {
    const x = tm(1.9 + i * 1.95);
    addSimpleBed(r, x, tm(-7) + 1.1, { w: 0.9, blanket: AOM.white });
    const c = wallPic(r, x, 1.3, tm(-7) + 2.35, 0, 1.6, 2.4, (g, w, h) => drawCurtain(g, w, h, sh), { cw: 200, ch: 300 });
    c.material.side = THREE.DoubleSide;
    const closed = i === 2, cur = { mesh: c, open: !closed, x, i };
    c.scale.x = closed ? 1 : 0.25; c.position.x = closed ? x : x - 0.65;
    MAN.curtains.push(cur);
    interactBox(r, x, 1.3, tm(-7) + 2.35, 1.6, 2.4, 0.2, () => (cur.open ? 'カーテンを閉める' : 'カーテンを開ける'), () => STORY.event('curtain', i), { icon: 'hand' });
  });
  shineAt(r, tm(1.9 + 2 * 1.95), 0.6, tm(-7) + 1.1, 'ladder');
  interactBox(r, tm(1.9 + 2 * 1.95), 0.6, tm(-7) + 1.1, 0.9, 0.4, 1.6, () => (MAN.curtains[2].open && !STORY.hasGot('ladder') ? 'ベッドの上を調べる' : null), () => GAME.take('ladder', MAN.props.ladder), { icon: 'hand' });
};
FURNISH.sbjail = r => {
  // a cell on the right; the key glints at its back, out of reach through the bars
  for (let z = tm(5) + 0.1; z < tm(11) - 0.05; z += 0.16) new Frame(r, tm(5), 0, z, 0).cyl(0.02, 0.02, WALL_H, MAT.iron, 0, WALL_H / 2, 0, 6);
  r.addCollider(tm(5) - 0.06, tm(5) + 0.06, 0, WALL_H, tm(5), tm(11), 'bars');
  shineAt(r, tm(7) - 0.3, 0.05, tm(9.5), 'k_study');
  interactBox(r, tm(5) + 0.1, 1.0, tm(9), 0.3, 2.0, 1.4, () => (STORY.hasGot('k_study') ? null : '鉄格子の向こうを調べる'), () => STORY.event('sbBars'), { icon: 'eye', tag: 'jailBars' });
  const st = new Frame(r, tm(1), 0, tm(6), 0); st.box(0.4, 0.4, 0.4, MAT.darkWood, 0, 0.2, 0); st.collide(-0.2, 0.2, 0, 0.4, -0.2, 0.2);
  MAN.sbjCandle = addCandle(st, 0, 0.4, 0, r); MAN.sbjCandle.state = 'off'; MAN.sbjCandle.level = 0; MAN.sbjCandle.intensity = 7; MAN.sbjCandle.range = 14;
  interactBox(r, tm(1), 0.6, tm(6), 0.5, 0.5, 0.5, () => (MAN.sbjCandle.state === 'on' ? null : 'ろうそくを調べる'), () => STORY.event('candleGen', 'sbjCandle'), { icon: 'hand', tag: 'candleSBJ' });
};
FURNISH.sbdark = r => {
  const st = new Frame(r, tm(11), 0, tm(10), 0); st.box(0.4, 0.4, 0.4, MAT.darkWood, 0, 0.2, 0); st.collide(-0.2, 0.2, 0, 0.4, -0.2, 0.2);
  MAN.sbdCandle = addCandle(st, 0, 0.4, 0, r); MAN.sbdCandle.state = 'off'; MAN.sbdCandle.level = 0; MAN.sbdCandle.intensity = 7; MAN.sbdCandle.range = 14;
  interactBox(r, tm(11), 0.6, tm(10), 0.5, 0.5, 0.5, () => (MAN.sbdCandle.state === 'on' ? null : 'ろうそくを調べる'), () => STORY.event('candleGen', 'sbdCandle'), { icon: 'hand', tag: 'candleSBD' });
  const wz = tm(5) + WT + 0.012;
  wallPic(r, tm(15.5), 1.7, wz, 0, 0.8, 0.6, (g, w, h) => { g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8bca0'; g.fillRect(14, 14, w - 28, h - 28); g.fillStyle = '#3a5a9a'; g.fillRect(w / 2 - 22, h / 2 - 16, 44, 32); }, { cw: 160, ch: 120 });
  shineAt(r, tm(15.5), 1.55, wz + 0.05, 'piece2');
  interactBox(r, tm(15.5), 1.7, wz + 0.15, 0.8, 0.6, 0.3, () => (STORY.hasGot('piece2') ? null : '額を調べる'), () => STORY.event('piece2'), { icon: 'eye' });
  const g = MAN.ropeDark = new THREE.Group(); g.visible = false; r.group.add(g);
  const x = cx(16), z = cx(9);
  for (const s of [-1, 1]) { const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, WALL_H, 6), std({ color: 0x8a7a5a, roughness: 1 })); rp.position.set(x + s * 0.2, WALL_H / 2, z); g.add(rp); }
  for (let y = 0.3; y < WALL_H; y += 0.32) { const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6), MAT.wood); s2.rotation.z = Math.PI / 2; s2.position.set(x, y, z); g.add(s2); }
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), MAT.void); hole.rotation.x = Math.PI / 2; hole.position.set(x, WALL_H - 0.01, z); r.group.add(hole);
  interactBox(r, x, 1.4, z, 0.8, 2.6, 0.5, () => (MAN.ropeDark.visible ? '縄ばしごを上る' : null), () => STORY.event('climbOut'), { icon: 'hand' });
  r.landing = { x, z: z - 0.9 };
};
FURNISH.sboni = r => {
  // a narrow way along the top; bars; behind them, the room full of them
  MAN.oniGate = addBarsZ(r, tm(0), tm(11), tm(15), tm(9), tm(10), { prompt: g => (g.open ? null : '鉄格子の扉を調べる'), use: g => (STORY.flags.oniRoom2 ? g.set(true) : GAME.say([['', '開かない。']])) });
  const wz = tm(20) - WT - 0.012;
  wallPic(r, tm(0) + 0.9, 1.6, wz, Math.PI, 0.8, 0.6, (g, w, h) => { g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8bca0'; g.fillRect(14, 14, w - 28, h - 28); g.fillStyle = '#3a5a9a'; g.fillRect(w / 2 - 22, h / 2 - 16, 44, 32); }, { cw: 160, ch: 120 });
  shineAt(r, tm(0) + 0.9, 1.45, wz - 0.05, 'piece3');
  interactBox(r, tm(0) + 0.9, 1.6, wz - 0.15, 0.8, 0.6, 0.3, () => (STORY.hasGot('piece3') ? null : '額を調べる'), () => STORY.event('piece3'), { icon: 'eye' });
  MAN.oniCrowd = [];
  for (let i = 0; i < 7; i++) {
    const m = makeOniModel(); m.root.scale.setScalar(0.92 + Math.random() * 0.1);
    m.root.position.set(tm(1.2 + i * 1.35), 0, tm(16.5 + (i % 2) * 1.6)); m.root.rotation.y = Math.PI + (Math.random() - 0.5) * 0.5;
    r.group.add(m.root); MAN.oniCrowd.push(m);
  }
};
FURNISH.sbcorB = r => {
  // the frame with three gaps for the blue pieces, beside the door at the top
  const wz = tm(-10) + WT + 0.012;
  MAN.pieceFrame = wallPic(r, tm(18) + 0.2, 1.5, wz, 0, 0.9, 0.7, (g, w, h) => drawPieceFrame(g, w, h, 0), { cw: 240, ch: 190 });
  interactBox(r, tm(18) + 0.2, 1.5, wz + 0.15, 0.9, 0.7, 0.3, () => (STORY.flags.piecesSet ? null : '額を調べる'), () => STORY.event('pieceFrame'), { icon: 'eye', tag: 'pieceFrame' });
};
FURNISH.sbcorC = r => { addBulb(r, tm(17.5), WALL_H, tm(-19), { intensity: 1.6, range: 8, drop: 0.5 }); };

/* ---------- the drawings ---------- */
// the scrawl in the basement jail: digits with their upright strokes left out; through the bars the bars fill them in
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function drawJailScrawl(g, w, h, throughBars) {
  g.clearRect(0, 0, w, h);
  const code = '5376', cw = w / 4.6, ch = h * 0.62, y0 = h * 0.18;
  g.strokeStyle = 'rgba(30,20,20,.85)'; g.lineWidth = w * 0.022; g.lineCap = 'round';
  [...code].forEach((d, i) => {
    const x0 = w * 0.08 + i * cw * 1.05, x1 = x0 + cw * 0.75, ym = y0 + ch / 2, y1 = y0 + ch, s = SEG[d];
    const L = (ax, ay, bx, by) => { g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); };
    if (s.includes('a')) L(x0, y0, x1, y0); if (s.includes('g')) L(x0, ym, x1, ym); if (s.includes('d')) L(x0, y1, x1, y1);
    if (throughBars) { if (s.includes('f')) L(x0, y0, x0, ym); if (s.includes('b')) L(x1, y0, x1, ym); if (s.includes('e')) L(x0, ym, x0, y1); if (s.includes('c')) L(x1, ym, x1, y1); }
    else { g.lineWidth = w * 0.012; for (const [px, py] of [[x0, y0 + ch * 0.25], [x1, y0 + ch * 0.75]]) { g.beginPath(); g.arc(px, py, w * 0.008, 0, TAU); g.stroke(); } g.lineWidth = w * 0.022; }
  });
  if (throughBars) { g.strokeStyle = 'rgba(20,20,22,.95)'; g.lineWidth = w * 0.02; for (let x = w * 0.08; x < w; x += w * 0.163) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } }
}
function drawPeekScrawl(g, w, h) {
  g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(30,20,20,.85)'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.arc(w / 2, h * 0.45, h * 0.22, 0, TAU); g.stroke();
  g.fillStyle = 'rgba(30,20,20,.85)'; for (const s of [-1, 1]) { g.beginPath(); g.arc(w / 2 + s * h * 0.08, h * 0.42, 6, 0, TAU); g.fill(); }
  for (let i = 0; i < 6; i++) { const x = w * 0.18 + i * w * 0.13; g.beginPath(); g.moveTo(x, h * 0.08); g.lineTo(x, h * 0.92); g.stroke(); }
}
function drawDollPicture(g, x, y, k) {
  g.fillStyle = '#7a1a2a'; g.beginPath(); g.moveTo(x - 30 * k, y + 40 * k); g.lineTo(x + 30 * k, y + 40 * k); g.lineTo(x, y - 6 * k); g.closePath(); g.fill();
  g.fillStyle = '#f0dcc8'; g.beginPath(); g.arc(x, y - 22 * k, 18 * k, 0, TAU); g.fill();
  g.fillStyle = '#2a1a12'; g.beginPath(); g.arc(x, y - 27 * k, 19 * k, Math.PI, TAU); g.fill();
  g.fillStyle = '#c02020'; g.beginPath(); g.arc(x - 6 * k, y - 21 * k, 3 * k, 0, TAU); g.fill(); g.fillStyle = '#2040c0'; g.beginPath(); g.arc(x + 6 * k, y - 21 * k, 3 * k, 0, TAU); g.fill();
}
function drawPoster(g, w, h, digits) {
  g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#bdb6a2'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  if (digits) { g.fillStyle = 'rgba(150,70,30,.9)'; g.font = `bold ${w * 0.32}px "Courier New",monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(digits, w / 2, h / 2); }
}
// the box by the door: four screws; inside, rows of holes; through the bookmark the holes take four colours
const DEVICE = { red: 1, blue: 2, green: 3, yellow: 7 };
function drawDevice(g, w, h, stage) {
  g.fillStyle = '#7a7a76'; g.fillRect(0, 0, w, h); g.strokeStyle = '#444'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  if (stage === 0) { g.fillStyle = '#c0b080'; for (const [x, y] of [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]]) { g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); } g.fillStyle = '#555'; g.fillRect(w * 0.2, h * 0.3, w * 0.6, h * 0.4); return; }
  const cols = { red: '#d02020', blue: '#2040d0', green: '#20a040', yellow: '#e8c818' }, holes = [];
  for (const [c, n] of Object.entries(DEVICE)) for (let i = 0; i < n; i++) holes.push(c);
  holes.push(...Array(13).fill(null));
  const rnd = mulberry32(77); for (let i = holes.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [holes[i], holes[j]] = [holes[j], holes[i]]; }
  holes.forEach((c, i) => { const x = 30 + (i % 5) * ((w - 60) / 4), y = 34 + Math.floor(i / 5) * ((h - 68) / 5); g.fillStyle = stage === 2 && c ? cols[c] : '#0a0a0a'; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); });
}
function drawDiceWall(g, w, h, seq) {
  g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 4; k++) {
    const x0 = 20 + k * (w - 40) / 4 + 12, s = (w - 40) / 4 - 24, y0 = (h - s) / 2;
    g.fillStyle = '#f4f0e6'; g.strokeStyle = '#3a3a3a'; g.lineWidth = 4; g.fillRect(x0, y0, s, s); g.strokeRect(x0, y0, s, s);
    for (let d = 0; d < 6; d++) { const cxp = x0 + s * (d < 3 ? 0.3 : 0.7), cyp = y0 + s * (0.22 + (d % 3) * 0.28); g.fillStyle = seq && seq[k] === d ? '#ffffff' : '#111'; g.beginPath(); g.arc(cxp, cyp, s * 0.09, 0, TAU); g.fill(); if (seq && seq[k] === d) { g.strokeStyle = '#111'; g.lineWidth = 2; g.stroke(); } }
  }
}
function drawCurtain(g, w, h, shape) {
  g.fillStyle = '#e8e6dc'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 22) { g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(x, 0, 10, h); }
  g.strokeStyle = 'rgba(150,20,20,.85)'; g.lineWidth = 9; g.lineJoin = 'round';
  const cxp = w / 2, cyp = h * 0.45, R = w * 0.28;
  g.beginPath();
  if (shape === 'circle') g.arc(cxp, cyp, R, 0, TAU);
  else { const n = { tri: 3, square: 4, penta: 5 }[shape]; for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i * TAU / n + (n === 4 ? Math.PI / 4 : 0); (i ? g.lineTo : g.moveTo).call(g, cxp + Math.cos(a) * R, cyp + Math.sin(a) * R); } }
  g.stroke();
}
// blue ink, scrawled: loops and zigzags in tangles along the wall (side 1: stops a little before the right-hand end)
function drawBlueScrawl(g, w, h, seed, stopRight) {
  g.clearRect(0, 0, w, h); const rnd = mulberry32(seed), x1 = stopRight ? w * 0.9 : w; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 170; i++) {
    let x = rnd() * x1, y = h * 0.08 + rnd() * h * 0.8; const col = rnd() < 0.7 ? [52, 64, 196] : [92, 70, 190];
    g.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.45 + rnd() * 0.45})`; g.lineWidth = 2 + rnd() * 6; g.beginPath(); g.moveTo(x, y);
    const n = 4 + (rnd() * 8 | 0), loop = rnd() < 0.5;
    for (let k = 0; k < n; k++) {
      if (loop) { const a = k * 1.7, rr = 10 + rnd() * 22; x += 9 + rnd() * 14; g.lineTo(Math.min(x1, x + Math.cos(a) * rr), y + Math.sin(a) * rr); }
      else { x += 14 + rnd() * 26; y += (rnd() - 0.5) * 70; g.lineTo(Math.min(x1, x), Math.max(4, Math.min(h - 4, y))); }
    }
    g.stroke();
  }
}
function drawGraffitiRun(g, w, h) {
  g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(40,20,20,.8)'; g.lineWidth = 7; g.lineCap = 'round';
  const rnd = mulberry32(5);
  for (let i = 0; i < 26; i++) { const x = rnd() * w * 0.68, y = 30 + rnd() * (h - 60); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) g.lineTo(Math.min(w * 0.7, x + (k + 1) * 30 + rnd() * 20), y + (rnd() - 0.5) * 60); g.stroke(); }
}
function drawPieceFrame(g, w, h, n) {
  g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e2d2'; g.fillRect(12, 12, w - 24, h - 24);
  for (let i = 0; i < 3; i++) { const x = 30 + i * (w - 60) / 3 + 6, s = (w - 60) / 3 - 12; g.fillStyle = i < n ? '#2a50b0' : '#111'; g.fillRect(x, h / 2 - s / 2, s, s); }
}
