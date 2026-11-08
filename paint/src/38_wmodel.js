
// ================= ブキの形（91本それぞれのデザイン。ペンキの部分はチームの色） =================
// 前が +z、上が +y、にぎる所が原点。色は look: [本体の色, 差し色]
const WMC = {};
const wmat = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return WMC[k] || (WMC[k] = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .42, metalness: .12 }, o))); };
function weaponMesh(w, team) {
  const g = new T.Group(), J = tmat(team).jelly, L = w.look || [0x444a55, 0xdddddd];
  const C = wmat(L[0]), A = wmat(L[1]), D = MAT.dark, Mt = MAT.metal, Wd = MAT.wood, Gl = MAT.glass, PI = Math.PI, H = PI / 2;
  const mk = (par, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); m.castShadow = true; par.add(m); return m; };
  const add = (...a) => mk(g, ...a);
  const Bx = (x, y, z) => new T.BoxGeometry(x, y, z), Cy = (r1, r2, h, s = 12) => new T.CylinderGeometry(r1, r2, h, s), Sp = (r, a = 12, b = 9) => new T.SphereGeometry(r, a, b);
  const Co = (r, h, s = 10) => new T.ConeGeometry(r, h, s), To = (R, r, arc = TAU, s = 20) => new T.TorusGeometry(R, r, 8, s, arc);
  const tube = (r, len, z0, x = 0, y = 0, mat = D) => add(Cy(r, r * 1.08, len), mat, x, y, z0 + len / 2, H);
  const grip = (mat = C, z = -.02) => add(Bx(.1, .2, .1), mat, 0, -.13, z);
  const gun = (len, mat = C) => add(Bx(.12, .14, len), mat, 0, 0, len / 2 - .1);
  const tank = (r, len, z, y = .12, mat = J) => add(Cy(r, r, len), mat, 0, y, z, H);
  // ローラー・ハケの柄と頭（頭はグループにまとめて、転がると回る）
  // 2点を結ぶ柄（手もとから、前の下にある頭まで）
  const stick = (mat = Mt, to = [0, -.3, .95], r = .025, from = [0, .06, 0]) => {
    const dy = to[1] - from[1], dz = to[2] - from[2], len = Math.hypot(dy, dz);
    return add(Cy(r, r, len, 8), mat, 0, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2, Math.atan2(dz, dy));
  };
  const handle = (len, mat = Mt) => stick(mat, [0, -.27, .95]);
  const headG = () => { const h = new T.Group(); h.position.set(0, -.45, 1.0); g.add(h); g.userData.head = h; return h; };
  const drum = (h, wd, r = .17) => { mk(h, Cy(r, r, wd, 16), J, 0, 0, 0, 0, 0, H); for (const s of [-1, 1]) mk(h, Cy(r + .012, r + .012, .05, 16), C, s * wd / 2, 0, 0, 0, 0, H); };
  const yoke = (wd) => { add(Bx(wd + .1, .035, .035), Mt, 0, -.25, .95); for (const s of [-1, 1]) add(Bx(.03, .22, .03), Mt, s * (wd / 2 + .05), -.35, .98); };
  switch (w.id) {
    // ---------- ガン：鳥 ----------
    case 'mist':
      add(Cy(.09, .09, .3), J, 0, .02, .08); add(Cy(.095, .095, .04), C, 0, .17, .08); add(Cy(.095, .095, .04), C, 0, -.13, .08);
      add(Cy(.04, .05, .06), A, 0, .21, .08); add(Bx(.05, .04, .1), D, 0, .23, .15);
      for (const s of [-1, 1]) add(Bx(.02, .14, .24), A, s * .11, .07, .02, .3, 0, s * .5);
      break;
    case 'short':
      add(Bx(.13, .15, .3), C, 0, 0, .08); tube(.05, .16, .22); add(Sp(.085), J, 0, .13, .04); add(Bx(.11, .07, .2), A, 0, -.05, .1); grip();
      add(Co(.05, .14, 8), C, 0, .04, -.12, -H);
      break;
    case 'basic':
      gun(.5); add(Bx(.125, .05, .42), A, 0, -.055, .16); add(Cy(.04, .04, .22), Mt, 0, .02, .48, H); tank(.06, .18, .06); grip();
      for (const s of [-1, 1]) add(Bx(.02, .03, .22), C, s * .05, .04, -.16, 0, s * .4, 0);
      break;
    case 'pro':
      add(Bx(.1, .12, .58), C, 0, 0, .18); add(Cy(.03, .03, .3), Mt, 0, .02, .6, H); add(Cy(.035, .035, .22), A, 0, .12, .16, H); add(Cy(.045, .045, .03), D, 0, .12, .28, H);
      tank(.05, .16, -.02, .08); grip(D, 0); add(Bx(.102, .02, .5), A, 0, .055, .2);
      break;
    case 'rapid':
      gun(.46); tube(.055, .26, .36, 0, .02, A); for (let i = 0; i < 3; i++) add(To(.057, .012, TAU, 10), D, 0, .02, .42 + i * .07);
      add(Bx(.08, .18, .12), J, 0, -.16, .2); grip();
      break;
    case 'heavy':
      add(Bx(.16, .18, .52), C, 0, 0, .14); tube(.062, .26, .38); add(Bx(.17, .06, .22), A, 0, .1, .28); tank(.08, .22, .02, .15); add(Bx(.12, .22, .12), C, 0, -.15, -.02);
      break;
    case 'long':
      add(Bx(.1, .12, .66), C, 0, 0, .2); add(Cy(.035, .035, .36), Mt, 0, .02, .7, H); add(Bx(.08, .1, .24), A, 0, -.02, -.22); tank(.055, .24, .1, .1); grip(C, .04); add(Bx(.04, .05, .06), A, 0, .09, .5);
      break;
    case 'burst':
      add(Bx(.12, .15, .44), C, 0, 0, .12); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + H; add(Cy(.025, .025, .28), Mt, Math.cos(a) * .04, .02 + Math.sin(a) * .04, .46, H); }
      add(Bx(.13, .08, .12), A, 0, .1, .3); tank(.06, .16, .02, .11); grip();
      break;
    case 'duo':
      add(Bx(.16, .14, .48), C, 0, 0, .14); for (const s of [-1, 1]) { add(Cy(.03, .03, .3), Mt, s * .045, .02, .5, H); add(Sp(.056), J, s * .056, .13, .02); add(Sp(.026), A, s * .056, .14, .07); }
      grip();
      break;
    case 'motor':
      gun(.48); add(Cy(.04, .04, .22), Mt, 0, .02, .48, H); add(Cy(.08, .08, .12), A, .11, .02, .1, 0, 0, H);
      for (let i = 0; i < 4; i++) add(Bx(.012, .15, .035), D, .18, .02, .1, i * PI / 4); tank(.055, .16, .02); grip();
      break;
    case 'airbrush':
      add(Cy(.03, .05, .36), C, 0, 0, .2, H); add(Cy(.008, .012, .3), Mt, 0, 0, .52, H); add(Cy(.06, .06, .12), J, 0, .09, .05); add(Bx(.05, .16, .06), A, 0, -.1, .02); add(Co(.028, .08, 8), A, 0, 0, .7, H);
      break;
    case 'squirt':
      add(Bx(.12, .13, .4), C, 0, 0, .12); add(Cy(.035, .04, .18), A, 0, .02, .4, H); add(Cy(.085, .085, .22), Gl, 0, .14, .06, H); tank(.068, .2, .06, .14); grip(A);
      break;
    case 'ext':
      add(Cy(.1, .1, .42), C, 0, -.02, 0); add(Cy(.07, .1, .06), D, 0, .21, 0); add(Cy(.025, .025, .3), D, 0, .12, .18, PI / 2.5); add(Co(.09, .2, 10), A, 0, .2, .34, -H); add(Bx(.04, .06, .14), J, 0, .26, .02);
      break;
    case 'jumper':
      gun(.46); add(Cy(.04, .04, .22), Mt, 0, .02, .48, H); for (let i = 0; i < 4; i++) add(To(.045, .012, TAU, 10), A, 0, .02, -.14 - i * .035);
      for (const s of [-1, 1]) add(Bx(.22, .02, .12), C, s * .15, .06, .14, 0, 0, s * .25); tank(.055, .16, .04); grip();
      break;
    // ---------- キャノン：くだもの ----------
    case 'cannon':
      tube(.11, .5, 0); add(Cy(.13, .12, .12), J, 0, 0, .5, H); add(Sp(.2, 14, 10), A, 0, .06, -.12); for (let i = 0; i < 4; i++) add(To(.202, .008, TAU, 24), C, 0, .06, -.12, 0, i * PI / 4, 0); add(Bx(.1, .2, .1), D, 0, -.18, .1);
      break;
    case 'minic':
      tube(.08, .32, 0); add(Cy(.1, .09, .08), J, 0, 0, .33, H); add(Sp(.15), A, 0, .04, -.06, 0, 0, 0, 1, .9, 1); add(Bx(.08, .02, .13), wmat(0x3a8a3a), 0, .18, -.06, 0, .5, 0); add(Bx(.1, .18, .1), D, 0, -.15, .06);
      break;
    case 'longc':
      add(Cy(.1, .13, .8), A, 0, 0, .3, H); for (let i = 0; i < 5; i++) add(To(.116, .012, TAU, 16), C, 0, 0, .0 + i * .15); add(Cy(.12, .11, .1), J, 0, 0, .72, H); add(Bx(.1, .2, .1), D, 0, -.18, .05);
      break;
    case 'rapidc':
      tube(.09, .42, 0); add(Cy(.11, .1, .08), J, 0, 0, .43, H);
      for (const s of [-1, 1]) { add(Sp(.11), A, s * .11, .04, -.08); add(Cy(.01, .01, .2), wmat(0x3a7a2a), s * .055, .2, -.08, 0, 0, s * -.55); }
      add(Bx(.1, .2, .1), D, 0, -.16, .08);
      break;
    case 'pompom':
      add(Cy(.12, .14, .4), D, 0, .1, .16, H - .5); add(Cy(.15, .13, .08), J, 0, .2, .34, H - .5); add(Sp(.18), C, 0, .02, -.12); add(Cy(.12, .12, .02), A, 0, .19, -.12); add(Bx(.1, .2, .1), D, 0, -.18, .04);
      break;
    case 'mega':
      tube(.15, .5, 0); add(Cy(.18, .16, .12), J, 0, 0, .5, H);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(Sp(.14), A, Math.cos(a) * .09, .06, -.18 + Math.sin(a) * .09, 0, 0, 0, 1, .85, 1); }
      add(Cy(.02, .03, .1), wmat(0x4a7a2a), 0, .2, -.18); add(Bx(.12, .22, .12), D, 0, -.2, .1);
      break;
    case 'tri':
      for (const s of [-1, 0, 1]) { tube(.05, .42, 0, s * .12); add(Cy(.06, .055, .05), J, s * .12, 0, .43, H); }
      add(Cy(.012, .012, .62), Wd, 0, .17, .04, H); for (let i = 0; i < 3; i++) add(Sp(.07), wmat([0xffb0c8, 0xf8f4ec, 0x8ad06a][i]), 0, .17, -.12 + i * .15);
      add(Bx(.32, .08, .16), C, 0, -.06, .02); add(Bx(.1, .18, .1), D, 0, -.16, .06);
      break;
    case 'cluster':
      tube(.1, .44, 0); add(Cy(.12, .11, .08), J, 0, 0, .46, H); add(Sp(.17), A, 0, .05, -.12);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(Co(.025, .07, 6), A, Math.cos(a) * .06, .23, -.12 + Math.sin(a) * .06); }
      add(Bx(.1, .2, .1), D, 0, -.17, .06);
      break;
    // ---------- ローラー：動物 ----------
    case 'roller': { handle(); const h = headG(), wd = .94; drum(h, wd); for (let i = -2; i <= 2; i++) mk(h, To(.178, .018, TAU, 18), A, i * .16, 0, 0, 0, H, 0); yoke(wd); break; }
    case 'wide': { handle(1.15, C); const h = headG(), wd = 1.2; drum(h, wd, .19); yoke(wd); for (const s of [-1, 1]) add(Sp(.05), A, s * .2, -.2, .95); break; }
    case 'mini': { handle(1.05); const h = headG(), wd = .7; for (let i = 0; i < 5; i++) mk(h, Cy(.15, .15, wd / 5 - .01, 14), i % 2 ? C : J, (i - 2) * wd / 5, 0, 0, 0, 0, H); yoke(wd); break; }
    case 'vert': {
      stick(C, [0, -.27, .95], .028); const h = headG(), wd = .9; drum(h, wd);
      for (let i = 0; i < 7; i++) { const a = i * 1.7, x = (i / 6 - .5) * wd * .8; mk(h, Sp(.045, 8, 6), A, x, Math.cos(a) * .17, Math.sin(a) * .17, 0, 0, 0, 1, 1, .4); }
      yoke(wd); break; }
    case 'weight': { handle(1.15, C); const h = headG(), wd = 1.1; drum(h, wd, .2); for (const s of [-1, 1]) mk(h, Cy(.23, .23, .09, 16), C, s * wd / 2, 0, 0, 0, 0, H); yoke(wd); add(Co(.05, .2, 8), A, 0, -.15, 1.02, PI / 3); break; }
    case 'turbo': {
      handle(1.15, C); stick(A, [0, -.12, .4], .03); const h = headG(), wd = .88; drum(h, wd);
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; mk(h, Sp(.025, 6, 4), A, s * (wd / 2 + .04), Math.cos(a) * .1, Math.sin(a) * .1); }
      yoke(wd); break; }
    case 'hopper': { handle(); for (let i = 0; i < 5; i++) add(To(.045, .012, TAU, 10), A, 0, .0 - i * .055, .3 + i * .1, Math.atan2(.89, -.33)); const h = headG(), wd = .9; drum(h, wd); yoke(wd); break; }
    case 'sponge': { handle(1.1, A); const h = headG(), wd = .96; drum(h, wd, .18); for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; mk(h, Sp(.07, 8, 6), C, s * (wd / 2 + .02), Math.cos(a) * .12, Math.sin(a) * .12); } yoke(wd); break; }
    // ---------- ハケ・モップ：毛の動物 ----------
    case 'brush': { stick(Wd, [0, -.36, .96], .03); const h = headG(); mk(h, Bx(.4, .06, .2), Mt, 0, .1, -.05); mk(h, Bx(.38, .12, .2), C, 0, 0, 0); mk(h, Bx(.38, .06, .2), J, 0, -.09, .02); break; }
    case 'bigbrush': { stick(D, [0, -.35, .96], .035); const h = headG(); mk(h, Bx(.56, .06, .24), Mt, 0, .1, -.05); mk(h, Bx(.54, .14, .24), C, 0, 0, 0); mk(h, Bx(.54, .07, .24), J, 0, -.1, .02); break; }
    case 'mop': { stick(A, [0, -.38, .98]); const h = headG(); mk(h, Cy(.16, .16, .08, 12), C, 0, .06, 0); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; mk(h, Cy(.025, .02, .26, 5), J, Math.cos(a) * .14, -.08, Math.sin(a) * .14, Math.sin(a) * .25, 0, -Math.cos(a) * .25); } break; }
    case 'deck': { stick(Wd, [0, -.4, .98]); const h = headG(); mk(h, Bx(.54, .08, .18), C, 0, .04, 0); for (let i = 0; i < 9; i++) mk(h, Bx(.035, .1, .14), A, (i - 4) * .06, -.05, 0); mk(h, Bx(.54, .03, .18), J, 0, .1, 0); break; }
    case 'broom': { stick(Wd, [0, -.3, .97]); const h = headG(); mk(h, Co(.24, .44, 12), J, 0, -.02, 0, PI); for (let i = 0; i < 3; i++) mk(h, To(.08 + i * .045, .02, TAU, 14), i % 2 ? A : C, 0, .14 - i * .1, 0, H); break; }
    case 'fude': { stick(C, [0, -.2, .74], .03); for (let i = 0; i < 3; i++) add(To(.034, .01, TAU, 10), A, 0, .02 - i * .07, .18 + i * .19, Math.atan2(.74, -.26)); const h = headG(); h.position.set(0, -.32, .8); mk(h, Co(.085, .32, 10), J, 0, 0, 0, PI); break; }
    case 'tawashi': { stick(Wd, [0, -.26, .78]); const h = headG(); h.position.set(0, -.36, .86); mk(h, Sp(.15, 10, 8), J, 0, 0, 0); for (let i = 0; i < 14; i++) { const a = i * 2.4, b = Math.acos(1 - 2 * (i + .5) / 14), v = new T.Vector3(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)); const m = mk(h, Co(.03, .1, 6), C, v.x * .15, v.y * .15, v.z * .15); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v); } break; }
    // ---------- スナイパー：星 ----------
    case 'sniper': add(Bx(.1, .12, 1.0), C, 0, 0, .3); tube(.03, .25, .8, 0, .02, A); tank(.05, .3, .1, .1); add(new T.OctahedronGeometry(.06), A, 0, .17, .3); add(Bx(.09, .17, .09), D, 0, -.13, 0); break;
    case 'scope': add(Bx(.1, .12, 1.0), C, 0, 0, .3); tube(.03, .22, .8, 0, .02, Mt); add(Cy(.045, .045, .5), A, 0, .14, .32, H); add(Cy(.06, .06, .04), A, 0, .14, .6, H); tank(.05, .26, .02, .1); add(Bx(.09, .17, .09), D, 0, -.13, 0); break;
    case 'quick': add(Bx(.1, .12, .72), C, 0, 0, .2); tube(.03, .2, .56, 0, .02, Mt); tank(.05, .22, .1, .1); for (let i = 0; i < 3; i++) add(Bx(.015, .12, .14), A, 0, 0, -.2, i * 2.1); add(Bx(.09, .17, .09), D, 0, -.13, 0); break;
    case 'ranger': add(Bx(.1, .12, 1.0), C, 0, 0, .3); tube(.034, .55, .8, 0, .02, C); for (let i = 0; i < 4; i++) add(To(.04, .01, TAU, 10), A, 0, .02, .86 + i * .12); tank(.055, .3, .1, .1); add(Bx(.09, .17, .09), D, 0, -.13, 0); break;
    case 'lance': add(Cy(.03, .03, 1.2), Mt, 0, 0, .45, H); add(Cy(.08, .08, .3), J, 0, -.02, 0, H); add(Co(.06, .26, 10), A, 0, 0, 1.15, H); add(To(.07, .015, TAU, 12), C, 0, 0, .9); add(Bx(.09, .17, .09), C, 0, -.13, -.1); break;
    case 'keep': add(Bx(.1, .12, .95), C, 0, 0, .28); tube(.03, .22, .76, 0, .02, Mt); tank(.05, .28, .08, .1); add(To(.1, .02, PI * 1.2, 16), A, 0, .2, .3, 0, H, 0); add(Bx(.09, .17, .09), D, 0, -.13, 0); break;
    case 'semi': {
      add(Bx(.1, .12, .8), C, 0, 0, .24); tube(.03, .22, .64, 0, .02, Mt); tank(.05, .22, .06, .1);
      const glow = wmat(L[1], { emissive: L[1], emissiveIntensity: .9 }); for (let i = 0; i < 3; i++) add(To(.05, .012, TAU, 12), glow, 0, .02, .66 + i * .07);
      add(Bx(.09, .17, .09), D, 0, -.13, 0); break; }
    case 'widesn': add(Bx(.16, .12, .95), C, 0, 0, .28); add(Bx(.3, .06, .14), A, 0, .02, .8); tank(.05, .26, .06, .1); add(Bx(.09, .17, .09), D, 0, -.13, 0); break;
    // ---------- バケツ：天気 ----------
    case 'bucket': add(Cy(.2, .15, .32, 14), C, 0, 0, .25); add(Cy(.18, .18, .02, 14), J, 0, .13, .25); add(To(.2, .015, PI, 16), Mt, 0, .1, .25); break;
    case 'triple': for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; add(Cy(.11, .08, .26, 12), C, Math.cos(a) * .1, 0, .25 + Math.sin(a) * .1); add(Cy(.1, .1, .02, 12), J, Math.cos(a) * .1, .11, .25 + Math.sin(a) * .1); } add(To(.22, .014, PI, 16), Mt, 0, .1, .25); break;
    case 'longb': { add(Cy(.17, .14, .44, 14), C, 0, .05, .25); const rb = [0xff5a5a, 0xff9a3a, 0xffe14a, 0x5ad06a, 0x3aa0ff, 0x7a5aff]; rb.forEach((c, i) => add(Cy(.172 - i * .005, .172 - i * .005, .03, 14), wmat(c), 0, .22 - i * .06, .25)); add(Cy(.15, .15, .02, 14), J, 0, .26, .25); add(To(.17, .015, PI, 16), Mt, 0, .22, .25); break; }
    case 'watering': add(Cy(.16, .18, .26, 12), C, 0, 0, .15); add(Cy(.025, .04, .38), C, 0, .08, .42, PI / 3); add(Cy(.06, .04, .05), A, 0, .2, .58, PI / 3); add(Cy(.13, .13, .02, 12), J, 0, .13, .15); add(To(.12, .02, PI, 12), A, 0, .18, .05, 0, H, 0); break;
    case 'ladle': add(Cy(.02, .02, .62), C, 0, .05, .3, PI / 2.3); add(new T.SphereGeometry(.13, 12, 6, 0, TAU, H, H), A, 0, -.04, .6); add(Cy(.11, .11, .02, 12), J, 0, -.05, .6); break;
    case 'dokan': { add(Cy(.2, .15, .32, 14), C, 0, 0, .25); add(Cy(.18, .18, .02, 14), J, 0, .13, .25); [[.03, .06, -.3], [-.02, -.02, .5], [.03, -.1, -.3]].forEach(([x, y, r]) => add(Bx(.04, .12, .03), A, x, y, .43, 0, 0, r)); add(To(.2, .015, PI, 16), Mt, 0, .1, .25); break; }
    case 'swirl': add(Cy(.2, .15, .32, 14), C, 0, 0, .25); add(Cy(.18, .18, .02, 14), J, 0, .13, .25); for (let i = 0; i < 3; i++) add(To(.19 - i * .015, .014, TAU * .7, 16), A, 0, -.08 + i * .08, .25, H + .12, i * 1.3, 0); add(To(.2, .015, PI, 16), Mt, 0, .1, .25); break;
    case 'rollb': add(Cy(.2, .15, .32, 14), C, 0, 0, .25); add(Cy(.18, .18, .02, 14), J, 0, .13, .25); add(Sp(.09), A, .1, .2, .3); add(Sp(.06), A, -.08, .18, .2); for (const s of [-1, 1]) add(Cy(.05, .05, .04, 10), D, s * .17, -.14, .25, 0, 0, H); break;
    // ---------- ガトリング：風（銃身はグループごと回る） ----------
    default: break;
  }
  // ガトリング
  if (w.cls === 'gatling') {
    const spin = new T.Group(); g.add(spin); g.userData.spin = spin;
    const bar = (n, r, len, R = .06, z = .5, mat = Mt) => { spin.position.set(0, 0, z); for (let k = 0; k < n; k++) { const a = k / n * TAU; mk(spin, Cy(r, r, len), mat, Math.cos(a) * R, Math.sin(a) * R, 0, H); } };
    switch (w.id) {
      case 'gatling': add(Bx(.22, .22, .4), C, 0, 0, .1); add(Bx(.23, .05, .3), A, 0, .08, .1); tank(.08, .2, 0, .17, J); bar(4, .035, .55); break;
      case 'minig': add(Bx(.18, .18, .3), C, 0, 0, .08); tank(.065, .16, 0, .14, J); bar(3, .03, .38, .05, .38); break;
      case 'heavyg': add(Cy(.18, .18, .46, 16), C, 0, 0, .08, H); add(To(.18, .02, TAU, 20), A, 0, 0, .2); tank(.1, .26, -.04, .22, J); bar(6, .03, .7, .09, .62); break;
      case 'reel': add(To(.2, .06, TAU, 18), J, 0, 0, 0, 0, H, 0); add(Cy(.06, .06, .14, 10), A, 0, 0, 0, 0, 0, H); add(Bx(.12, .1, .3), C, 0, -.02, .25); bar(3, .03, .5, .05, .58); break;
      case 'trig': add(Bx(.3, .2, .36), C, 0, 0, .08); add(To(.16, .015, TAU * .75, 16), A, 0, .12, .1, H, 0, 0); tank(.07, .2, -.02, .16, J); bar(3, .033, .5, .09, .5); break;
      case 'snipeg': add(Bx(.2, .2, .44), C, 0, 0, .12); add(Cy(.035, .035, .3), A, 0, .16, .12, H); tank(.07, .2, -.02, .12, J); bar(4, .025, .85, .05, .76); break;
      case 'bounceg': add(Sp(.17), C, 0, 0, .06); for (let i = 0; i < 3; i++) add(To(.07, .015, TAU, 10), A, 0, .17 + i * .04, .06, H); tank(.06, .16, -.04, .12, J); bar(4, .033, .5, .06, .48); break;
    }
    add(Bx(.1, .18, .1), D, 0, -.18, -.04);
  }
  // 二丁拳銃：楽器（片手ぶん）
  if (w.cls === 'dual') {
    switch (w.id) {
      case 'dual': add(Sp(.11), C, 0, .04, .12); for (let i = 0; i < 3; i++) add(To(.111, .012, TAU, 14), A, 0, .04, .12, 0, i * 1.05, 0); add(Cy(.03, .035, .24), A, 0, -.02, -.06, H); tube(.03, .14, .2, 0, .04, Mt); add(Sp(.04), J, 0, .15, .1); break;
      case 'dualm': for (const s of [-1, 1]) add(new T.SphereGeometry(.11, 12, 6, 0, TAU, 0, H), C, 0, .03, .12, s > 0 ? 0 : PI, 0, 0, 1, .55, 1); add(To(.11, .012, TAU, 16), A, 0, .03, .12, H); tube(.028, .16, .2, 0, .03, Mt); add(Bx(.08, .16, .08), C, 0, -.1, .02); add(Sp(.035), J, 0, .1, .06); break;
      case 'dualh': add(Bx(.12, .14, .4), D, 0, 0, .12); add(Cy(.2, .2, .015, 20), A, .09, .05, .12, 0, 0, H); add(Sp(.03), A, .1, .05, .12); tube(.04, .18, .3, 0, .02, Mt); tank(.055, .14, .02, .11); grip(D); break;
      case 'duals': add(Cy(.1, .09, .16, 14), C, 0, .02, .1, H); add(Cy(.102, .102, .015, 14), A, 0, .02, .19, H); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(Cy(.008, .008, .16), Mt, Math.cos(a) * .1, .02 + Math.sin(a) * .1, .1, H); } tube(.028, .14, .2, 0, .02, Mt); grip(C, .04); add(Sp(.035), J, 0, .14, .06); break;
      case 'duall': add(new T.SphereGeometry(.14, 14, 8, 0, TAU, H, H), A, 0, .1, .06); add(Cy(.142, .142, .015, 14), C, 0, .1, .06); tube(.03, .34, .1, 0, .02, Mt); grip(C, .02); add(Sp(.04), J, 0, .14, .14); break;
      case 'dualsp': add(To(.12, .025, TAU, 20), C, 0, .04, .12); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(Cy(.03, .03, .01, 10), A, Math.cos(a) * .12, .04 + Math.sin(a) * .12, .12, H); } add(Co(.06, .14, 10), Mt, 0, .04, .3, H); add(Bx(.08, .16, .08), C, 0, -.1, .06); add(Sp(.04), J, 0, .04, .12); break;
      case 'dualb': for (const y of [0, .1]) { add(Bx(.1, .08, .36), C, 0, y, .12); tube(.025, .14, .3, 0, y, Mt); } add(Bx(.11, .02, .36), A, 0, .05, .12); grip(C); add(Sp(.035), J, 0, .17, .02); break;
    }
  }
  // パラソル：花（カサはチームの色、花びらは花の色）
  if (w.cls === 'parasol') {
    const can = new T.Group(); can.position.set(0, 0, .55); g.add(can); g.userData.canopy = can;
    const R = w.id === 'minipara' ? .5 : w.id === 'bigpara' ? .72 : .62;
    const JD = tmat(team).jellyDS;
    if (w.id === 'longpara') mk(can, new T.ConeGeometry(R, .55, 18, 1, true), JD, 0, 0, .05, -H); else mk(can, new T.SphereGeometry(R, 16, 8, 0, TAU, 0, PI / 2.4), JD, 0, 0, 0, -H);
    const rim = (n, mat, r = R * .97, z = -.02, sc = .1) => { for (let i = 0; i < n; i++) { const a = i / n * TAU; mk(can, Sp(sc, 8, 6), mat, Math.cos(a) * r, Math.sin(a) * r, z, 0, 0, 0, 1, 1, .5); } };
    switch (w.id) {
      case 'parasol': for (let i = 0; i < 9; i++) { const a = i * 2.4, r = Math.sqrt(i / 9) * R * .55; mk(can, Sp(.07, 8, 6), A, Math.cos(a) * r, Math.sin(a) * r, .4 - r * .5); } break;
      case 'bigpara': rim(14, A, R * .98, -.04, .12); mk(can, Cy(.18, .18, .05, 16), C, 0, 0, .44, H); break;
      case 'minipara': mk(can, Sp(.16, 10, 8), A, 0, 0, .36); rim(8, A, R * .95, -.03, .07); break;
      case 'longpara': rim(6, A, R * .95, -.2, .14); break;
      case 'spikepara': for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, m = mk(can, Co(.04, .16, 6), C, Math.cos(a) * R, Math.sin(a) * R, -.05); m.rotation.set(0, 0, a - H); } mk(can, Sp(.1, 8, 6), A, 0, 0, .44); break;
      case 'doublepara': mk(can, new T.SphereGeometry(R * .7, 14, 6, 0, TAU, 0, PI / 2.4), wmat(L[1], { side: T.DoubleSide }), 0, 0, .18, -H); rim(10, A, R * .96, -.03, .09); break;
    }
    add(Cy(.025, .025, .6), Mt, 0, 0, .25, H); grip(C, -.02);
  }
  // ボウ：海の生きもの
  if (w.cls === 'bow') {
    const tall = w.id === 'tatebow' ? 1.3 : 1;
    add(To(.42, .032, PI, 22), C, 0, 0, .3, 0, H, H, 1, tall, 1); add(Cy(.006, .006, .84 * tall), MAT.white, 0, 0, .3); add(Bx(.06, .2, .08), A, 0, 0, .3);
    switch (w.id) {
      case 'bow': add(Co(.03, .3, 8), A, 0, 0, .55, H); break;
      case 'longbow': add(Co(.025, .5, 8), A, 0, 0, .68, H); for (let i = 0; i < 4; i++) add(To(.022 - i * .004, .006, TAU, 8), C, 0, 0, .5 + i * .09); break;
      case 'fivebow': add(Sp(.08), A, 0, 0, .34); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; const m = add(Co(.015, .07, 5), C, 0, Math.cos(a) * .09, .34 + Math.sin(a) * .09); m.rotation.x = -a + H; } break;
      case 'tatebow': add(Bx(.02, .9, .03), A, 0, 0, .43); break;
      case 'bakubow': add(Sp(.09), J, 0, 0, .36); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, m = add(Co(.015, .06, 5), A, 0, Math.cos(a) * .09, .36 + Math.sin(a) * .09); m.rotation.x = -a + H; } break;
      case 'quickbow': for (const s of [-1, 1]) add(Bx(.01, .22, .26), A, s * .02, s * .3, .24, 0, 0, 0); break;
    }
  }
  // ブレード
  if (w.cls === 'blade') {
    add(Bx(.08, .1, .26), C, 0, 0, .04); add(Bx(.2, .04, .05), J, 0, 0, .18);
    switch (w.id) {
      case 'blade': add(To(.5, .035, PI * .55, 18), A, 0, 0, .2, 0, -H, -H, 1, 1, .6); break;
      case 'heavyb': add(Bx(.08, .26, .8), A, 0, .06, .6); add(Bx(.09, .04, .8), Mt, 0, -.06, .6); break;
      case 'hera': for (let i = 0; i < 3; i++) add(Bx(.04, .1, .32), A, 0, (i % 2 ? .05 : -.05), .3 + i * .26, (i % 2 ? .35 : -.35), 0, 0); break;
      case 'twinb': for (const s of [-1, 1]) add(Bx(.04, .08, .8), A, s * .05, 0, .6); break;
      case 'longblade': add(Bx(.05, .09, 1.15), A, 0, 0, .78); add(new T.OctahedronGeometry(.08), wmat(0xffffff, { emissive: 0xb8d8ff, emissiveIntensity: .8 }), 0, 0, 1.4); break;
      case 'boomblade': add(Bx(.05, .1, .5), A, 0, .12, .4, -.5, 0, 0); add(Bx(.05, .1, .5), A, 0, .12, .78, .5, 0, 0); break;
    }
  }
  // ホース：水の流れ
  if (w.cls === 'hose') {
    switch (w.id) {
      case 'garden': add(To(.18, .05, TAU, 18), C, -.3, -.22, -.1, 0, H, 0); add(Cy(.035, .05, .32), A, 0, 0, .3, H); add(Bx(.08, .14, .12), C, 0, -.05, .1); add(Sp(.05), J, 0, .06, .1); break;
      case 'firehose': add(Cy(.06, .09, .5), C, 0, 0, .25, H); add(Cy(.05, .07, .14), A, 0, 0, .56, H); add(To(.16, .05, TAU, 16), D, -.1, -.15, -.15, 0, H, 0); add(Bx(.06, .06, .1), J, 0, .08, .1); break;
      case 'shower': add(Bx(.1, .14, .2), C, 0, -.02, .1); for (const s of [-1, 0, 1]) add(Cy(.025, .04, .3), A, s * .06, .02, .36, H, s * .25, 0); add(Sp(.05), J, 0, .08, .08); break;
      case 'pump': add(Cy(.07, .07, .34), C, 0, 0, .1, H); add(Cy(.06, .06, .02, 14), wmat(0xffffff), .075, .05, .05, 0, 0, H); add(Bx(.005, .04, .005), D, .087, .06, .05); add(Cy(.03, .04, .3), A, 0, 0, .42, H); add(Sp(.05), J, 0, .08, .1); break;
      case 'misthose': add(Cy(.04, .05, .3), C, 0, 0, .2, H); add(Co(.1, .16, 12), A, 0, 0, .43, -H); add(Bx(.08, .14, .12), C, 0, -.05, .05); add(Sp(.05), J, 0, .07, .05); break;
      case 'jet': add(Cy(.035, .05, .3), C, 0, 0, .15, H); add(Cy(.012, .02, .4), A, 0, 0, .5, H); add(Bx(.08, .14, .12), C, 0, -.05, .05); add(Sp(.05), J, 0, .07, .05); break;
    }
  }
  if (!g.children.length) { add(Bx(.12, .14, .5), C, 0, 0, .15); grip(); }
  return g;
}
