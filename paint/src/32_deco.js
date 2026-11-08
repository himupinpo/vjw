
// ================= ステージの造り込み：床の模様・かべぎわの影・小物・遠くの景色・動くもの =================
const spawnRings = [];
let skyMesh = null;
const decoAnim = [];          // 毎フレーム動かすもの（クレーン・船・カモメ・観覧車・花びら など）
const STYLE = { harbor: 0, roof: 1, market: 2, park: 3, factory: 4 };
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [.707, .707], [-.707, .707], [.707, -.707], [-.707, -.707]];

// ---------- 床の模様（線・道・目印）と、かべぎわの影 ----------
function buildGroundMaps() {
  const W = GM_W, H = GM_H;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = X0 + (i + .5) / W * MAPW, z = Z0 + (j + .5) / H * MAPD, h0 = hAt(x, z);
    let occ = 0;
    if (h0 > -5) for (const [dx, dz] of DIRS8) for (const [r, wgt] of [[.3, .1], [.65, .06], [1.1, .035]]) { const h = hAt(x + dx * r, z + dz * r); if (h > h0 + .25) occ += wgt * Math.min(1, (h - h0) / 1.2); }
    AOD[j * W + i] = Math.round(255 * clamp(1 - occ, .5, 1));
  }
  aoTex.needsUpdate = true;
  const g = gmapCanvas.getContext('2d'); g.clearRect(0, 0, W, H);
  const px = x => (x - X0) / MAPW * W, py = z => (z - Z0) / MAPD * H, pm = m => m / MAPW * W;
  // 点対称にかく（チームの陣地どうしが同じ形）
  const sym = f => { f(); g.save(); g.translate(px(0), py(0)); g.rotate(Math.PI); g.translate(-px(0), -py(0)); f(); g.restore(); };
  const rect = (x0, z0, x1, z1, c) => { g.fillStyle = c; g.fillRect(px(x0), py(z0), pm(x1 - x0), pm(z1 - z0)); };
  const hatch = (x0, z0, x1, z1) => { g.save(); g.beginPath(); g.rect(px(x0), py(z0), pm(x1 - x0), pm(z1 - z0)); g.clip(); rect(x0, z0, x1, z1, 'rgba(240,190,20,.9)'); g.strokeStyle = 'rgba(20,20,20,.9)'; g.lineWidth = pm(.18); for (let k = -40; k < 40; k++) { g.beginPath(); g.moveTo(px(x0 + k * .5), py(z0)); g.lineTo(px(x0 + k * .5 + (z1 - z0)), py(z1)); g.stroke(); } g.restore(); };
  const dash = (x0, z0, x1, z1, c, w, on = 1.2, off = .8) => { g.strokeStyle = c; g.lineWidth = pm(w); g.setLineDash([pm(on), pm(off)]); g.beginPath(); g.moveTo(px(x0), py(z0)); g.lineTo(px(x1), py(z1)); g.stroke(); g.setLineDash([]); };
  const circ = (x, z, r, c, fill = true, w = .15) => { g.beginPath(); g.arc(px(x), py(z), pm(r), 0, TAU); if (fill) { g.fillStyle = c; g.fill(); } else { g.strokeStyle = c; g.lineWidth = pm(w); g.stroke(); } };
  const arrow = (x, z, dir, c) => { g.save(); g.translate(px(x), py(z)); g.rotate(dir); g.fillStyle = c; g.beginPath(); g.moveTo(0, -pm(1)); g.lineTo(pm(.7), pm(.2)); g.lineTo(pm(.25), pm(.2)); g.lineTo(pm(.25), pm(.9)); g.lineTo(-pm(.25), pm(.9)); g.lineTo(-pm(.25), pm(.2)); g.lineTo(-pm(.7), pm(.2)); g.closePath(); g.fill(); g.restore(); };
  const manhole = (x, z) => { circ(x, z, .42, 'rgba(40,40,44,.85)'); circ(x, z, .3, 'rgba(120,120,125,.6)', false, .05); circ(x, z, .16, 'rgba(120,120,125,.6)', false, .05); };
  switch (STAGE.theme) {
    case 'harbor':
      sym(() => {
        rect(27.7, 0, 27.9, 48, 'rgba(250,200,30,.9)'); rect(-27.9, 0, -27.7, 48, 'rgba(250,200,30,.9)');
        dash(-17, 6, -17, 38, 'rgba(255,255,255,.85)', .15); dash(16, 4, 16, 14, 'rgba(255,255,255,.85)', .15); dash(7, 16, 7, 36, 'rgba(255,255,255,.85)', .15);
        hatch(11, -3.2, 12.6, 3.2); hatch(-6, 36.2, 6, 37); hatch(-30, 18.4, -26, 20);
        arrow(-17, 20, Math.PI, 'rgba(255,255,255,.8)'); arrow(7, 24, Math.PI, 'rgba(255,255,255,.8)');
        manhole(-6, 18); manhole(20, 32); manhole(-22, 6);
        for (let k = 0; k < 4; k++) rect(-23 + k * 2.4, 42, -22.8 + k * 2.4, 46, 'rgba(255,255,255,.75)');
      });
      break;
    case 'roof':
      sym(() => {
        g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = pm(.15); g.strokeRect(px(-25.4), py(.6), pm(50.8), pm(43));
        for (let k = 0; k < 7; k++) { g.fillStyle = 'rgba(200,184,160,.9)'; g.beginPath(); g.ellipse(px(-1 + Math.sin(k * 1.3) * 1.4), py(14 + k * 2.6), pm(.55), pm(.4), k, 0, TAU); g.fill(); }
        for (const [x, z] of [[-24, 4], [24, 24], [-8, 30], [12, 4]]) { rect(x - .4, z - .4, x + .4, z + .4, 'rgba(50,52,58,.9)'); for (let k = 0; k < 4; k++) rect(x - .32, z - .3 + k * .18, x + .32, z - .24 + k * .18, 'rgba(120,120,125,.9)'); }
        dash(0, 28, 0, 12, 'rgba(90,170,90,.7)', .3, .9, .6);
      });
      circ(0, 0, 9.5, 'rgba(255,255,255,.6)', false, .2);
      break;
    case 'market':
      sym(() => {
        rect(-4.5, 2.5, 4.5, 18, 'rgba(110,80,60,.28)'); rect(-15, 2.5, -9, 18, 'rgba(110,80,60,.22)'); rect(9, 2.5, 15, 18, 'rgba(110,80,60,.22)');
        for (let r = 2.4; r > .3; r -= .6) circ(12, 9, r, r % 1.2 < .6 ? 'rgba(180,90,60,.55)' : 'rgba(240,220,180,.6)');
        manhole(0, 8); manhole(-24, 16);
        rect(-29.6, 2.6, 29.6, 2.9, 'rgba(70,64,58,.7)');
      });
      break;
    case 'park': {
      const path = 'rgba(214,196,150,.92)';
      sym(() => {
        g.strokeStyle = path; g.lineCap = 'round'; g.lineWidth = pm(2.4);
        g.beginPath(); g.moveTo(px(0), py(36)); g.bezierCurveTo(px(-6), py(30), px(6), py(22), px(0), py(12)); g.stroke();
        g.beginPath(); g.moveTo(px(-4), py(30)); g.bezierCurveTo(px(-14), py(26), px(-20), py(18), px(-19), py(9)); g.stroke();
        g.beginPath(); g.moveTo(px(4), py(30)); g.bezierCurveTo(px(14), py(28), px(20), py(20), px(19), py(9)); g.stroke();
        g.fillStyle = 'rgba(232,214,160,.95)'; g.beginPath(); g.ellipse(px(10), py(12.5), pm(3.2), pm(2.2), 0, 0, TAU); g.fill();
        for (const [x, z, c] of [[-24, 36, '#ff8ab0'], [24, 40, '#ffd84a'], [-14, 18, '#ffffff'], [20, 30, '#ff8ab0']]) for (let k = 0; k < 40; k++) { const a = k * 2.4, r = Math.sqrt(k / 40) * 1.6; circ(x + Math.cos(a) * r, z + Math.sin(a) * r, .12, c); }
      });
      g.strokeStyle = path; g.lineWidth = pm(2.2); g.beginPath(); g.arc(px(0), py(0), pm(11.2), 0, TAU); g.stroke();
      break;
    }
    case 'factory':
      sym(() => {
        for (const x of [-10.6, -9.4, 9.4, 10.6]) rect(x, 4, x + .14, 40, 'rgba(250,200,30,.85)');
        hatch(-4.6, 25.4, 4.6, 26); hatch(-4.6, 30, 4.6, 30.6); hatch(-4.6, 26, -4, 30); hatch(4, 26, 4.6, 30);
        for (let k = 0; k < 4; k++) arrow(0, 11 + k * 3.2, Math.PI, 'rgba(255,255,255,.7)');
        dash(-14, 4, -14, 40, 'rgba(255,255,255,.6)', .12); dash(15, 4, 15, 24, 'rgba(255,255,255,.6)', .12);
        manhole(-16, 20); manhole(19, 36);
        hatch(-25.4, 37, -22.6, 38);
      });
      break;
  }
  gmapTex.needsUpdate = true;
  PU.uStyle.value = STYLE[STAGE.theme] ?? 0;
}

// ---------- 小物をまとめて作る（同じ素材は1つの形にまとめて、描く回数をへらす） ----------
const DM = {};
const dmat = (key, color, o) => DM[key] || (DM[key] = new T.MeshStandardMaterial(Object.assign({ color, roughness: .7 }, o)));
const dParts = new Map();
const _dm4 = new T.Matrix4(), _dq = new T.Quaternion(), _de = new T.Euler(), _dv = new T.Vector3(), _ds = new T.Vector3();
function put(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  _de.set(rx, ry, rz); _dq.setFromEuler(_de); _dm4.compose(_dv.set(x, y, z), _dq, _ds.set(sx, sy, sz)); geo.applyMatrix4(_dm4);
  let l = dParts.get(mat); if (!l) dParts.set(mat, l = []); l.push(geo);
}
function flushParts(shadow = true, into = decor) {
  for (const [mat, list] of dParts) {
    const g = mergeGeometries(list); list.forEach(x => x.dispose());
    if (!g) continue;
    const m = new T.Mesh(g, mat); m.castShadow = shadow; m.receiveShadow = true; into.add(m);
  }
  dParts.clear();
}
const B = (w, h, d) => new T.BoxGeometry(w, h, d), CY = (r1, r2, h, s = 10) => new T.CylinderGeometry(r1, r2, h, s), SP = (r, w = 10, h = 8) => new T.SphereGeometry(r, w, h);
// 窓のある壁の絵（遠くのビル・町の家）
const FAC = {};
function facadeTex(key, base, win, lit, rows, cols, seed) {
  if (FAC[key]) return FAC[key];
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'), q = mulberry(seed);
  g.fillStyle = base; g.fillRect(0, 0, 64, 64);
  const cw = 64 / cols, rh = 64 / rows;
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { g.fillStyle = q() < lit ? '#ffd98a' : win; g.fillRect(k * cw + cw * .22, r * rh + rh * .25, cw * .56, rh * .5); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4;
  return FAC[key] = t;
}
// 窓の絵が建物の大きさに合うよう、面ごとにくり返しの回数を合わせた箱（屋根と底は窓なし）
function boxW(w, h, d, unit) {
  const g = B(w, h, d), uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    if (f === 2 || f === 3) uv.setXY(i, .01, .01); else uv.setXY(i, uv.getX(i) * (f < 2 ? d : w) / unit, uv.getY(i) * h / unit);
  }
  return g;
}
// しま模様の日よけ
const AWN = {};
function awningMat(col) {
  if (AWN[col]) return AWN[col];
  const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
  for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#ffffff' : '#' + col.toString(16).padStart(6, '0'); g.fillRect(k * 8, 0, 8, 8); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  return AWN[col] = new T.MeshStandardMaterial({ map: t, roughness: .8, side: T.DoubleSide });
}
// 水（ゆらゆら光る）
function waterMat(color, opacity = .92) {
  const m = new T.MeshStandardMaterial({ color, roughness: .1, metalness: .15, transparent: opacity < 1, opacity });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = PU.uTime;
    sh.vertexShader = 'varying vec3 vWPw;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWPw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying vec3 vWPw; uniform float uTime;\nfloat wh(vec2 p){ return sin(p.x * 1.3 + uTime * 1.1) * 0.5 + sin(p.y * 1.7 - uTime * 0.8) * 0.35 + sin((p.x + p.y) * 2.9 + uTime * 1.7) * 0.15 + sin((p.x - p.y * 0.6) * 5.3 - uTime * 2.3) * 0.06; }\n' +
      sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { vec2 p = vWPw.xz * 0.6; float e = 0.05, h0 = wh(p); vec2 gr = vec2(wh(p + vec2(e, 0.0)) - h0, wh(p + vec2(0.0, e)) - h0) / e;
    normal = normalize((viewMatrix * vec4(normalize(vec3(-gr.x * 0.14, 1.0, -gr.y * 0.14)), 0.0)).xyz); }`);
  };
  return m;
}

// ---------- ステージを読んだときに作る ----------
function buildDecor() {
  if (decor) { world.remove(decor); decor.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose && !o.userData.keepMat) o.material.dispose(); }); }
  decor = new T.Group(); world.add(decor); spawnRings.length = 0; decoAnim.length = 0;
  const s = STAGE, th = s.theme;
  // 空
  { const g = new T.SphereGeometry(600, 24, 12), c = [], top = new T.Color(s.sky[0]), mid = new T.Color(s.sky[1]), low = new T.Color(s.sky[2]);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 600, cc = y > .2 ? mid.clone().lerp(top, (y - .2) / .8) : low.clone().lerp(mid, clamp((y + .1) / .3, 0, 1)); c.push(cc.r, cc.g, cc.b); }
    g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
    skyMesh = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })); decor.add(skyMesh); }
  if (typeof scene !== 'undefined') { scene.background = new T.Color(s.fog); scene.fog = new T.Fog(s.fog, th === 'roof' ? 120 : 90, th === 'roof' ? 420 : 300); sun.color.set(s.sun); }
  // 海・池・油（ゆらゆら）
  if (th !== 'roof') {
    const seaCol = { harbor: 0x1d6fa8, market: 0x2a86b8, park: 0x3a8a8a, factory: 0x1c2226 }[th] || 0x1d6fa8;
    const sea = new T.Mesh(new T.PlaneGeometry(900, 900), waterMat(seaCol, th === 'factory' ? 1 : .92)); sea.rotation.x = -Math.PI / 2; sea.position.y = -1.3; decor.add(sea);
  }
  const q = mulberry(STAGE_ID.length * 31 + 7);
  const fromC = (b, d) => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2, b[2] - b[0], b[3] - b[1], b[4], d];
  // ---- 箱の種類ごとの小物 ----
  const dark = dmat('dark', 0x2a2a30, { roughness: .5, metalness: .4 }), steel = dmat('steel', 0x9aa0aa, { roughness: .35, metalness: .7 });
  for (const b of BOXES) {
    const [cx, cz, w, d, h] = fromC(b), k = b[6];
    if (k === 'cont') {   // コンテナ：角の金具・扉のかんぬき
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [.1, h - .1]) put(B(.2, .2, .2), dark, cx + sx * (w / 2 - .09), y, cz + sz * (d / 2 - .09));
      const alongZ = d > w, endSign = alongZ ? Math.sign(cz || 1) : Math.sign(cx || 1);
      for (let i = 1; i <= 4; i++) {
        const t = i / 5 - .5;
        if (alongZ) put(CY(.035, .035, h - .4, 6), steel, cx + t * w, h / 2, cz + endSign * (d / 2 + .04));
        else put(CY(.035, .035, h - .4, 6), steel, cx + endSign * (w / 2 + .04), h / 2, cz + t * d);
      }
    }
    if (k === 'plant') {  // 花だん：植えこみと花
      const along = w >= d, L = along ? w : d, n = Math.max(2, Math.floor(L / .7));
      for (let i = 0; i < n; i++) {
        const u = (i + .5) / n - .5, x = along ? cx + u * (w - .4) : cx + (q() - .5) * (w - .6), z = along ? cz + (q() - .5) * (d - .6) : cz + u * (d - .4);
        if (i % 2) put(SP(.24, 9, 6), dmat('bush', 0x3f8a3a, { roughness: .95 }), x, h + .14, z, 0, q() * 3, 0, 1, .75, 1);
        else { const fc = [0xff6fa0, 0xffd84a, 0xffffff, 0xb07bff][i % 4]; put(CY(.015, .015, .3, 4), dmat('stem', 0x3f7a2a), x, h + .15, z); put(SP(.08, 8, 6), dmat('fl' + fc, fc, { roughness: .6 }), x, h + .32, z); put(SP(.1, 8, 6), dmat('bush', 0x3f8a3a), x, h + .05, z, 0, 0, 0, 1, .5, 1); }
      }
    }
    if (k === 'ac') {     // 室外機：上に大きなファン（回る）
      put(new T.TorusGeometry(.95, .07, 6, 28), dark, cx, h + .03, cz, Math.PI / 2);
      put(CY(.92, .92, .02, 24), dmat('grill', 0x55585e, { roughness: .6, metalness: .5 }), cx, h + .01, cz);
      const fan = new T.Group(); fan.position.set(cx, h + .06, cz); decor.add(fan);
      for (let i = 0; i < 4; i++) { const bl = new T.Mesh(B(.8, .02, .22), dmat('blade', 0xc8ccd2, { metalness: .5, roughness: .4 })); bl.position.x = .4; const piv = new T.Group(); piv.rotation.y = i * Math.PI / 2; piv.add(bl); bl.rotation.x = .3; fan.add(piv); }
      fan.add(new T.Mesh(CY(.12, .12, .08, 12), dark));
      decoAnim.push(dt => { fan.rotation.y += dt * 9; });
    }
    if (k === 'stall') {  // 屋台：しま模様の日よけと、台の上の品物
      const front = d < w ? [0, -Math.sign(cz || 1)] : [-Math.sign(cx || 1), 0], L = d < w ? w : d;
      // 4本の柱の上に、しま模様の屋根（前が少し低い）と、前に垂れた布
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(CY(.035, .035, 1.6, 6), dmat('pole', 0xe8e0d0, { roughness: .5 }), cx + sx * (w / 2 - .08), h + .8, cz + sz * (d / 2 - .08));
      const cm = awningMat(b[5]), can = new T.Mesh(B(w + .4, .05, d + .4), cm);
      can.position.set(cx, h + 1.6, cz); if (d < w) can.rotation.x = .12 * front[1]; else can.rotation.z = -.12 * front[0];
      const val = new T.Mesh(B(d < w ? w + .4 : .02, .26, d < w ? .02 : d + .4), cm);
      val.position.set(cx + front[0] * (w / 2 + .2), h + 1.43, cz + front[1] * (d / 2 + .2));
      for (const m of [can, val]) { m.castShadow = true; m.userData.keepMat = true; decor.add(m); }
      for (let i = 0; i < 3; i++) {
        const u = (i + .5) / 3 - .5, x = d < w ? cx + u * (w - 1) : cx + front[0] * (w / 2 - .4), z = d < w ? cz + front[1] * (d / 2 - .4) : cz + u * (d - 1);
        put(B(.5, .24, .36), dmat('crateW', 0xb08050), x, h + .12, z);
        const fc = [0xff8a2a, 0xe8302a, 0x8ad040, 0xffe14a][(i + Math.floor(cx)) & 3];
        for (let m = 0; m < 5; m++) put(SP(.08, 8, 6), dmat('fruit' + fc, fc, { roughness: .45 }), x + (m % 3 - 1) * .13, h + .3 + (m > 2 ? .08 : 0), z + (m > 2 ? 0 : (m % 2 - .5) * .1));
      }
    }
    if (k === 'house') {  // 家：えんとつと扉
      put(B(.45, .9, .45), dmat('chim', 0x9a5040, { roughness: .9 }), cx + w / 2 - .4, h + .45, cz + d / 2 - .4);
      const fz = Math.abs(cz) > Math.abs(cx) * .5, sg = fz ? -Math.sign(cz || 1) : -Math.sign(cx || 1);
      if (fz) { put(B(.9, 1.7, .06), dmat('door', 0x6a4a30, { roughness: .7 }), cx, .85, cz + sg * (d / 2 + .03)); put(SP(.05, 6, 4), steel, cx + .3, .9, cz + sg * (d / 2 + .08)); }
      else { put(B(.06, 1.7, .9), dmat('door', 0x6a4a30, { roughness: .7 }), cx + sg * (w / 2 + .03), .85, cz); put(SP(.05, 6, 4), steel, cx + sg * (w / 2 + .08), .9, cz + .3); }
    }
    if (k === 'bench') {  // ベンチ：背もたれとひじかけ
      const sg = Math.sign(cz || 1), bm = dmat('benchW', 0x8a5a34, { roughness: .7 });
      put(B(w, .42, .07), bm, cx, h + .3, cz + sg * (d / 2 - .04)); for (const sx of [-1, 1]) put(B(.08, .3, d), dmat('benchF', 0x34343a, { metalness: .5, roughness: .4 }), cx + sx * (w / 2 - .05), h + .15, cz);
    }
    if (k === 'bark') {   // 木：葉っぱのかたまり（さくらと緑をかわりばんこ）
      const pink = (Math.round(cx) + Math.round(cz)) % 2 !== 0, lm = pink ? dmat('leafP', 0xf4a6c8, { roughness: .9 }) : dmat('leafG', 0x4f9a3f, { roughness: .9 });
      put(SP(1.35, 12, 9), lm, cx, h + 1.25, cz);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + q(), r = 1.05; put(SP(.85 + q() * .3, 10, 8), lm, cx + Math.cos(a) * r, h + .8 + q() * .6, cz + Math.sin(a) * r); }
      put(CY(.08, .14, 1.2, 6), dmat('branch', 0x5a3a22), cx + .4, h + .35, cz, 0, 0, -.6);
    }
    if (k === 'machine') {  // 機械：操作盤とランプ（点めつ）
      const fx = Math.abs(cx) > Math.abs(cz) * .6 && Math.abs(cx) > 4, sg = fx ? -Math.sign(cx) : -Math.sign(cz || 1);
      const px0 = fx ? cx + sg * (w / 2 + .03) : cx, pz0 = fx ? cz : cz + sg * (d / 2 + .03), ry = fx ? Math.PI / 2 : 0;
      put(B(.9, .6, .06), dmat('panel', 0x2a2e36, { roughness: .4, metalness: .4 }), px0, 1.25, pz0, 0, ry, 0);
      const lamps = ['lampR', 'lampG', 'lampY'];
      for (let i = 0; i < 3; i++) { const o = (i - 1) * .22; put(SP(.055, 8, 6), DM[lamps[i]] || lampMat(lamps[i]), px0 + (fx ? sg * .04 : o), 1.4, pz0 + (fx ? o : sg * .04)); }
      for (let i = 0; i < 2; i++) { const o = (i - .5) * .3; put(CY(.08, .08, .03, 12), dmat('dial', 0xe8e8e8, { roughness: .3 }), px0 + (fx ? sg * .04 : o), 1.12, pz0 + (fx ? o : sg * .04), fx ? 0 : Math.PI / 2, 0, fx ? Math.PI / 2 : 0); }
      if (Math.abs(cx) < 4 && Math.abs(cz) < 4) {   // まんなかの大きな機械：横で歯車が回る
        for (const [gx, gz, gry] of [[0, d / 2 + .07, 0], [0, -d / 2 - .07, 0], [w / 2 + .07, 0, Math.PI / 2], [-w / 2 - .07, 0, Math.PI / 2]]) {
          const gear = gearMesh(.62); gear.position.set(cx + gx, 1.35, cz + gz); gear.rotation.y = gry; decor.add(gear);
          const dir = gx + gz > 0 ? 1 : -1; decoAnim.push(dt => { gear.children[0].rotation.z += dt * .9 * dir; });
        }
      }
    }
    if (k === 'conv') {     // ベルトコンベア：横のローラー
      for (let i = 0; i < Math.floor(w / .5); i++) for (const sz of [-1, 1]) put(CY(.08, .08, .06, 10), steel, b[0] + .25 + i * .5, h - .1, cz + sz * (d / 2 + .03), Math.PI / 2);
    }
    if (k === 'glass' && th === 'harbor') {   // 見張り小屋のアンテナと、回るランプ
      put(CY(.03, .03, 1.4, 6), steel, b[2] - .2, h + .7, b[3] - .2);
      const bea = new T.Mesh(SP(.12, 10, 8), lampMat('lampR')); bea.position.set(b[2] - .2, h + 1.45, b[3] - .2); decor.add(bea);
    }
  }
  // すべり台の手すり
  for (const r of RAMPS) if (r[8] === 'slide') {
    const ax = r[6], dh = r[5] - r[4], L = ax === 'z' ? r[3] - r[1] : r[2] - r[0], len = Math.hypot(L, dh), ang = Math.atan2(dh, L), my = (r[4] + r[5]) / 2 + .15;
    for (const sd of [0, 1]) {
      if (ax === 'z') put(B(.08, .26, len), dmat('rail', 0xffd23f, { roughness: .4 }), sd ? r[2] - .05 : r[0] + .05, my, (r[1] + r[3]) / 2, -ang);
      else put(B(len, .26, .08), dmat('rail', 0xffd23f, { roughness: .4 }), (r[0] + r[2]) / 2, my, sd ? r[3] - .05 : r[1] + .05, 0, 0, ang);
    }
  }
  flushParts(true);
  // ---- ステージごとの景色 ----
  const M = (c, o) => dmat('bg' + c, c, Object.assign({ roughness: .8 }, o));
  if (th === 'harbor') harborScenery(q, M); else if (th === 'roof') roofScenery(q, M); else if (th === 'market') marketScenery(q, M); else if (th === 'park') parkScenery(q, M); else if (th === 'factory') factoryScenery(q, M);
  // 岸壁（水ぎわの壁）にタイヤ
  if (th === 'harbor' || th === 'market') {
    const tm = dmat('tire', 0x1e1e22, { roughness: .9 }), G = s.ground;
    for (let z = G[1] + 3; z < G[3] - 2; z += 5) for (const sx of [-1, 1]) put(new T.TorusGeometry(.32, .12, 6, 12), tm, sx > 0 ? G[2] + .1 : G[0] - .1, -.55, z, 0, Math.PI / 2, 0);
    for (let x = G[0] + 3; x < G[2] - 2; x += 5) for (const sz of [-1, 1]) put(new T.TorusGeometry(.32, .12, 6, 12), tm, x, -.55, sz > 0 ? G[3] + .1 : G[1] - .1);
    flushParts(false);
  }
  // スタート台の光る輪
  for (const t of [1, 2]) {
    const sp = SPAWN[t], ring = new T.Mesh(new T.RingGeometry(2.2, 2.7, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(sp.x, hAt(sp.x, sp.z) + .03, sp.z); ring.userData.team = t; decor.add(ring); spawnRings.push(ring);
    const inner = new T.Mesh(new T.RingGeometry(1.2, 1.35, 40), ring.material); inner.rotation.x = -Math.PI / 2; inner.position.copy(ring.position); decor.add(inner);
    decoAnim.push((dt, t2) => { const k = 1 + Math.sin(t2 * 2 + t) * .04; ring.scale.set(k, k, 1); inner.rotation.z = t2 * .5; });
  }
  setTeamColors(G.pal[0], G.pal[1]);
}
// 点めつするランプ（同じ色のランプは同じ素材を使い、いっしょに点めつ）
function lampMat(key) {
  if (DM[key]) return DM[key];
  const c = { lampR: 0xff3030, lampG: 0x40ff60, lampY: 0xffd030, lampW: 0xfff0c0 }[key] || 0xffffff;
  return DM[key] = new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.2, roughness: .3 });
}
function gearMesh(r) {
  const parts = [CY(r, r, .1, 24)];
  for (let i = 0; i < 12; i++) { const t = B(.18, .1, .16); t.translate(r + .06, 0, 0); t.rotateY(i / 12 * TAU); parts.push(t); }
  parts.push(CY(.14, .14, .16, 12));
  const g = mergeGeometries(parts); parts.forEach(p => p.dispose()); g.rotateX(Math.PI / 2);   // 円を壁と平行に（回す軸は z）
  const m = new T.Mesh(g, dmat('gear', 0x8a8f98, { metalness: .7, roughness: .35 })); m.castShadow = true;
  const holder = new T.Group(); holder.add(m); return holder;
}

// ---------- 港：クレーン（動く）・貨物船・タグボート・ブイ・カモメ・灯台 ----------
function harborScenery(q, M) {
  const yel = M(0xd8b040, { roughness: .6 }), wht = M(0xe8e4dc), red = M(0xc83a32), navy = M(0x23324a);
  for (const [x, z, sd, ph] of [[-58, -10, 1, 0], [60, 18, -1, 2], [-52, 40, 1, 4], [54, -38, -1, 1]]) {
    const g = new T.Group(); g.position.set(x, -1.3, z); decor.add(g);
    for (const [lx, lz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) { const m = new T.Mesh(B(1.2, 22, 1.2), yel); m.position.set(lx, 11, lz); g.add(m); }
    const brace = new T.Mesh(B(7.2, .6, .6), yel); brace.position.set(0, 8, -3); g.add(brace); const brace2 = brace.clone(); brace2.position.z = 3; g.add(brace2);
    const top = new T.Mesh(B(32, 2, 2.4), yel); top.position.set(sd * 8, 22, 0); g.add(top);
    const cab = new T.Mesh(B(4, 3, 4), wht); cab.position.set(0, 19.5, 0); g.add(cab);
    const tr = new T.Group(); g.add(tr);
    const trolley = new T.Mesh(B(2.4, 1, 2.8), M(0x5a5e66)); trolley.position.y = 20.6; tr.add(trolley);
    const cable = new T.Mesh(CY(.05, .05, 1, 4), M(0x222226)); tr.add(cable);
    const load = new T.Group(); tr.add(load);
    const spreader = new T.Mesh(B(2.6, .3, 6.2), yel); load.add(spreader);
    const box = new T.Mesh(B(2.4, 2.5, 6), M([0xc8503c, 0x3c7cc8, 0x4aa86a, 0xd8a030][Math.floor(q() * 4)])); box.position.y = -1.45; load.add(box);
    decoAnim.push((dt, t) => {
      const u = Math.sin(t * .12 + ph); tr.position.x = sd * 8 + u * 12;
      const L = 9 + Math.sin(t * .2 + ph * 1.7) * 5; cable.scale.y = L; cable.position.y = 20.1 - L / 2; load.position.y = 20.1 - L - .2;
      load.rotation.x = Math.sin(t * .9 + ph) * .04;
    });
  }
  // 貨物船（ゆれる）
  const ship = new T.Group(); ship.position.set(-92, -1.3, -6); decor.add(ship);
  const hull = new T.Mesh(B(14, 7, 74), navy); hull.position.y = 1.5; ship.add(hull);
  const bow = new T.Mesh(CY(7, 7, 7, 3, 1, false, 0, Math.PI), navy); bow.rotation.set(0, Math.PI / 2, 0); bow.position.set(0, 1.5, -37); ship.add(bow);
  const stripe = new T.Mesh(B(14.1, .8, 74.1), red); stripe.position.y = -1.4; ship.add(stripe);
  const bridge = new T.Mesh(boxW(12, 8, 7, 4), new T.MeshStandardMaterial({ map: facadeTex('ship', '#e8e4dc', '#30425a', .25, 3, 4, 3), roughness: .6 })); bridge.position.set(0, 9, 31); ship.add(bridge);
  const ccols = [0xc8503c, 0x3c7cc8, 0xd8a030, 0x4aa86a, 0x8a5ac8, 0xd86a9a, 0xe8e4dc];
  for (let row = 0; row < 9; row++) for (let i = 0; i < 4; i++) { const hgt = 1 + Math.floor(q() * 3); for (let k = 0; k < hgt; k++) put(B(3, 2.5, 6.6), M(ccols[Math.floor(q() * ccols.length)]), -4.6 + i * 3.1, 6.3 + k * 2.55, -30 + row * 6.9); }
  flushParts(false, ship);
  decoAnim.push((dt, t) => { ship.position.y = -1.3 + Math.sin(t * .5) * .18; ship.rotation.z = Math.sin(t * .37) * .012; });
  // タグボート（ぐるっと回る）
  const tug = new T.Group(); decor.add(tug);
  const th = new T.Mesh(B(4, 1.6, 9), red); th.position.y = .3; tug.add(th);
  const tc = new T.Mesh(B(3, 2, 3.4), wht); tc.position.set(0, 2, .6); tug.add(tc);
  const fun = new T.Mesh(CY(.45, .45, 2, 10), M(0x222226)); fun.position.set(0, 3.4, 2); tug.add(fun);
  decoAnim.push((dt, t) => { const a = t * .045; tug.position.set(Math.cos(a) * 78, -1.3 + Math.sin(t * 1.3) * .12, Math.sin(a) * 105); tug.rotation.y = -a; });
  // ブイ
  for (const [x, z, c] of [[-36, 52, 0xd83a32], [36, 52, 0x3aa84a], [-36, -52, 0x3aa84a], [36, -52, 0xd83a32]]) {
    const b = new T.Group(); b.position.set(x, -1.3, z); decor.add(b);
    const m = new T.Mesh(CY(.6, .8, 1.4, 10), M(c)); m.position.y = .5; b.add(m); const cone = new T.Mesh(new T.ConeGeometry(.5, 1, 10), M(c)); cone.position.y = 1.7; b.add(cone);
    const ph = x * .1 + z * .07; decoAnim.push((dt, t) => { b.position.y = -1.3 + Math.sin(t * 1.4 + ph) * .15; b.rotation.z = Math.sin(t * 1.1 + ph) * .1; });
  }
  // 灯台（光が回る）
  const lh = new T.Group(); lh.position.set(0, -1.3, -95); decor.add(lh);
  const body = new T.Mesh(CY(2.4, 3.4, 22, 16), wht); body.position.y = 11; lh.add(body);
  const band = new T.Mesh(CY(2.6, 2.7, 3, 16), red); band.position.y = 15; lh.add(band);
  const lamp = new T.Mesh(CY(1.6, 1.6, 2.2, 12), new T.MeshStandardMaterial({ color: 0xfff6c0, emissive: 0xfff0a0, emissiveIntensity: 1 })); lamp.position.y = 23.2; lh.add(lamp);
  const cap = new T.Mesh(new T.ConeGeometry(2.2, 2, 12), red); cap.position.y = 25.3; lh.add(cap);
  const beam = new T.Mesh(new T.ConeGeometry(4, 40, 16, 1, true), new T.MeshBasicMaterial({ color: 0xfff6c0, transparent: true, opacity: .14, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  beam.rotation.z = Math.PI / 2; beam.position.x = 20; const bp = new T.Group(); bp.position.y = 23.2; bp.add(beam); lh.add(bp);
  decoAnim.push(dt => { bp.rotation.y += dt * .6; });
  gulls(10, 30, 16, M(0xf4f4f0));
}
// カモメ（鳥）：羽ばたきながら輪をえがく
function gulls(n, R, Y, mat) {
  const wingG = B(1.1, .04, .38); wingG.translate(.55, 0, 0);
  for (let i = 0; i < n; i++) {
    const g = new T.Group(); decor.add(g);
    const body = new T.Mesh(SP(.22, 8, 6), mat); body.scale.set(1, .8, 2.2); g.add(body);
    const wl = new T.Mesh(wingG, mat), wr = new T.Mesh(wingG, mat); wr.rotation.y = Math.PI; g.add(wl, wr); wl.userData.keepMat = wr.userData.keepMat = true;
    const r = R * (.6 + Math.random() * .8), y = Y + Math.random() * 8, sp = (.12 + Math.random() * .1) * (Math.random() < .5 ? -1 : 1), ph = Math.random() * TAU, cx = (Math.random() - .5) * 20, cz = (Math.random() - .5) * 40;
    decoAnim.push((dt, t) => {
      const a = ph + t * sp; g.position.set(cx + Math.cos(a) * r, y + Math.sin(t * .7 + ph) * 1.2, cz + Math.sin(a) * r * 1.3);
      g.rotation.y = -a + (sp > 0 ? 0 : Math.PI); const f = Math.sin(t * 7 + ph) * .55; wl.rotation.z = f; wr.rotation.z = -f;
    });
  }
}

// ---------- 屋上：まわりのビル（窓）・給水塔・アンテナ（点めつ）・看板・電球のひも ----------
function roofScenery(q, M) {
  const ground = new T.Mesh(new T.PlaneGeometry(1400, 1400), M(0x3a3f4a)); ground.rotation.x = -Math.PI / 2; ground.position.y = -70; decor.add(ground);
  const mats = [0, 1, 2].map(i => new T.MeshStandardMaterial({ map: facadeTex('city' + i, ['#5a6070', '#8a8478', '#6a7a8a'][i], '#2a3448', .35, 8, 6, 11 + i), emissiveMap: facadeTex('city' + i), emissive: 0xffc070, emissiveIntensity: .55, roughness: .7 }));
  for (let i = 0; i < 70; i++) {
    const a = q() * TAU, r = 70 + q() * 260, w = 14 + q() * 22, d = 14 + q() * 22, top = -50 + q() * (r > 150 ? 110 : 55), hgt = top + 70;
    put(boxW(w, hgt, d, 6), mats[i % 3], Math.cos(a) * r, (top - 70) / 2, Math.sin(a) * r * 1.2, 0, q() * 1.5, 0);
    if (top > -20 && q() < .5) {   // 屋上の給水塔・アンテナ
      const x = Math.cos(a) * r, z = Math.sin(a) * r * 1.2;
      put(CY(1.6, 1.6, 3, 12), M(0x8a6a50), x + 2, top + 3.4, z); for (let k = 0; k < 4; k++) put(B(.2, 2, .2), M(0x444448), x + 2 + (k % 2 - .5) * 2, top + 1, z + (k > 1 ? 1 : -1));
      put(CY(.08, .08, 8, 4), M(0x9a9aa0), x - 3, top + 4, z - 2);
    }
  }
  flushParts(false);
  // 赤く点めつする航空灯（遠くの高いビル）
  const red = lampMat('lampR');
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .4, r = 190 + i * 15; const m = new T.Mesh(SP(.8, 8, 6), red); m.position.set(Math.cos(a) * r, 40 + q() * 20, Math.sin(a) * r * 1.2); m.userData.keepMat = true; decor.add(m); }
  // 看板（形だけ。文字なし）
  for (const [x, z, ry, c1, c2] of [[-60, -40, .9, '#ff6f61', '#ffd166'], [64, 30, -2.2, '#4ecdc4', '#ffffff'], [-40, 70, 2.6, '#a06cd5', '#ffd166']]) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = c1; g.fillRect(0, 0, 128, 64); g.fillStyle = c2; g.beginPath(); g.arc(40, 32, 20, 0, TAU); g.fill(); g.fillRect(70, 18, 44, 10); g.fillRect(70, 36, 30, 10);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    const bb = new T.Mesh(new T.PlaneGeometry(16, 8), new T.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: .35, side: T.DoubleSide })); bb.position.set(x, 4, z); bb.rotation.y = ry; decor.add(bb);
    for (const s2 of [-1, 1]) { const leg = new T.Mesh(B(.3, 8, .3), M(0x55585e)); leg.position.set(x + Math.cos(ry) * s2 * 6, -2, z - Math.sin(ry) * s2 * 6); decor.add(leg); }
  }
  // 屋上のふちの低い段
  const rim = M(0x7a746c), s = STAGE;
  put(B(s.ground[2] * 2 + 1, .5, .5), rim, 0, -.1, s.ground[3] + .25); put(B(s.ground[2] * 2 + 1, .5, .5), rim, 0, -.1, s.ground[1] - .25);
  put(B(.5, .5, s.ground[3] * 2 + 1), rim, s.ground[2] + .25, -.1, 0); put(B(.5, .5, s.ground[3] * 2 + 1), rim, s.ground[0] - .25, -.1, 0);
  // 電球のひも：両はしの柱から、たるませて張る（頭よりずっと上）
  const bulbM = lampMat('lampW'), wireM = M(0x222226);
  for (const x of [-12, 12]) {
    for (const z of [s.ground[1] - .3, s.ground[3] + .3]) put(CY(.1, .1, 7, 6), M(0x55585e), x, 2.6, z);
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const u = i / n, z = lerp(s.ground[1] - .3, s.ground[3] + .3, u), y = 6 - Math.sin(u * Math.PI) * 1.2;
      if (i < n) { const z2 = lerp(s.ground[1] - .3, s.ground[3] + .3, (i + 1) / n), y2 = 6 - Math.sin((i + 1) / n * Math.PI) * 1.2; put(CY(.02, .02, Math.hypot(z2 - z, y2 - y), 3), wireM, x, (y + y2) / 2, (z + z2) / 2, Math.PI / 2 - Math.atan2(y2 - y, z2 - z), 0, 0); }
      put(SP(.12, 8, 6), bulbM, x, y - .14, z);
    }
  }
  flushParts(false);
  decoAnim.push((dt, t) => { bulbM.emissiveIntensity = 1 + Math.sin(t * 3) * .15; red.emissiveIntensity = Math.sin(t * 2.5) > 0 ? 2 : .2; });
  gulls(5, 60, 22, M(0x30343c));
}

// ---------- 坂の市場：町の家（窓）・鐘の塔・旗のひも・街灯・小舟 ----------
function marketScenery(q, M) {
  const wallTex = ['#f0e6d6', '#e8d0b0', '#d8e0e8', '#f4dcc8'].map((c, i) => new T.MeshStandardMaterial({ map: facadeTex('town' + i, c, '#4a6a8a', .1, 3, 3, 21 + i), roughness: .85 }));
  const roofc = [0xc84a3a, 0x3a6ac8, 0x4a8a5a, 0xa0603a];
  for (let i = 0; i < 52; i++) {
    const sx = q() < .5 ? -1 : 1, x = sx * (38 + q() * 40), z = -60 + q() * 120, w = 6 + q() * 6, h = 4 + q() * 7, d = 6 + q() * 6;
    put(boxW(w, h, d, 3), wallTex[i % 4], x, h / 2 - 1.3, z);
    put(new T.ConeGeometry(Math.max(w, d) * .75, 3, 4), M(roofc[i % 4]), x, h - 1.3 + 1.5, z, 0, Math.PI / 4, 0);
  }
  for (const [x, z, r] of [[-160, -220, 90], [120, -260, 110], [0, -320, 120], [-200, 200, 100]]) put(new T.ConeGeometry(r, r * .6, 20), M(0x6a9a5a, { roughness: .95 }), x, r * .3 - 1.3, z);
  // 鐘の塔
  put(boxW(6, 22, 6, 3), wallTex[0], 62, 9.7, -24); put(new T.ConeGeometry(5, 7, 4), M(0x8a3a2a), 62, 24.2, -24, 0, Math.PI / 4, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(B(.8, 3, .8), wallTex[0], 62 + sx * 2.6, 22, -24 + sz * 2.6);
  flushParts(false);
  const bell = new T.Mesh(SP(1.2, 12, 8, 0, TAU, 0, Math.PI * .6), M(0xc8a040, { metalness: .7, roughness: .3 })); bell.position.set(62, 22.3, -24); decor.add(bell);
  decoAnim.push((dt, t) => { bell.rotation.z = Math.sin(t * 1.2) * .25; });
  // 旗のひも（市場の上をわたす）と、運河の街灯
  const fc = [0xff5a5a, 0xffd23f, 0x3fb6ff, 0x7ad65a, 0xffffff];
  const flags = [];
  for (const zz of [-30, -14, 14, 30]) {
    for (const x of [-30.6, 30.6]) put(CY(.1, .12, 7.5, 6), M(0x6a4a30), x, 2.4, zz);
    const n = 30;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = lerp(-30.6, 30.6, u), y = 6 - Math.sin(u * Math.PI) * 1.4;
      if (i < n) { const x2 = lerp(-30.6, 30.6, (i + 1) / n), y2 = 6 - Math.sin((i + 1) / n * Math.PI) * 1.4; put(CY(.02, .02, Math.hypot(x2 - x, y2 - y), 3), M(0x333333), (x + x2) / 2, (y + y2) / 2, zz, 0, 0, Math.PI / 2 + Math.atan2(y2 - y, x2 - x)); }
      if (i % 2 === 0 && i < n) flags.push([x + 1, y - .45, zz, fc[(i / 2 + Math.abs(Math.round(zz))) % fc.length]]);
    }
  }
  for (const [x, y, z, c] of flags) put(new T.ConeGeometry(.42, .8, 3), M(c, { side: T.DoubleSide }), x, y, z, Math.PI, 0, 0, 1, 1, .08);
  for (const b of STAGE.bridges || []) for (const [x, z] of [[b[0] + .25, b[1] + .25], [b[2] - .25, b[1] + .25], [b[0] + .25, b[3] - .25], [b[2] - .25, b[3] - .25]]) {
    put(CY(.06, .08, 3, 6), M(0x2a2a30, { metalness: .5 }), x, 1.5, z); put(B(.36, .44, .36), lampMat('lampW'), x, 3.15, z); put(new T.ConeGeometry(.32, .3, 4), M(0x2a2a30), x, 3.52, z, 0, Math.PI / 4, 0);
  }
  flushParts(false);
  // 小舟（ステージの外の水の上）
  for (const [x, z] of [[-36, 8], [37, -14], [-38, -30], [36, 26]]) {
    const bt = new T.Group(); bt.position.set(x, -1.3, z); decor.add(bt);
    const hull = new T.Mesh(B(1.6, .6, 4.2), M(0x8a5a34)); hull.position.y = .15; bt.add(hull);
    const seat = new T.Mesh(B(1.5, .1, .4), M(0xd8c8a0)); seat.position.y = .45; bt.add(seat);
    const ph = x + z; decoAnim.push((dt, t) => { bt.position.y = -1.3 + Math.sin(t * 1.2 + ph) * .08; bt.rotation.z = Math.sin(t * .9 + ph) * .05; bt.rotation.y = Math.sin(t * .1 + ph) * .2; });
  }
  gulls(6, 40, 14, M(0xf4f4f0));
}

// ---------- 公園：木・観覧車（回る）・噴水・はすの葉・街灯・花びら ----------
function parkScenery(q, M) {
  const leafG = M(0x4f9a3f, { roughness: .9 }), leafP = M(0xf2a8c8, { roughness: .9 }), trunk = M(0x6a4a2a);
  for (let i = 0; i < 70; i++) {
    const a = q() * TAU, r = 48 + q() * 60, x = Math.cos(a) * r * .75, z = Math.sin(a) * r * 1.1, h = 4 + q() * 4;
    put(B(.6, h, .6), trunk, x, h / 2 - 1.3, z);
    const lm = q() < .4 ? leafP : leafG; put(SP(2 + q() * 1.6, 10, 8), lm, x, h - 1.3 + 1.2, z); put(SP(1.4 + q(), 9, 7), lm, x + 1.2, h - 1.6, z + .5);
  }
  for (const [x, z, r] of [[-180, -200, 80], [150, -240, 100], [-160, 220, 90], [200, 180, 70]]) put(new T.ConeGeometry(r, r * .5, 20), M(0x5f9a4a, { roughness: .95 }), x, r * .25 - 1.3, z);
  // はすの葉（池の上）
  for (const w of STAGE.water || []) for (let i = 0; i < 9; i++) {
    const x = lerp(w[0] + 1, w[2] - 1, q()), z = lerp(w[1] + 1, w[3] - 1, q());
    put(new T.CircleGeometry(.5 + q() * .4, 12, .3, TAU - .6), M(0x3f8a3a, { side: T.DoubleSide }), x, -1.25, z, -Math.PI / 2, 0, q() * TAU);
    if (q() < .4) put(SP(.14, 8, 6), M(0xff9ac8), x + .1, -1.15, z);
  }
  // 街灯
  for (const [x, z] of [[-6, 33], [6, 33], [-12, 14], [12, 6], [6, -33], [-6, -33], [12, -14], [-12, -6]]) {
    put(CY(.06, .09, 3.2, 6), M(0x2a3a2a, { metalness: .4 }), x, 1.6, z); put(SP(.24, 10, 8), lampMat('lampW'), x, 3.35, z); put(new T.ConeGeometry(.3, .22, 10), M(0x2a3a2a), x, 3.58, z);
  }
  flushParts(true);
  // 観覧車
  const fw = new T.Group(); fw.position.set(-118, 28, -96); fw.rotation.y = .6; decor.add(fw);
  const wheel = new T.Group(); fw.add(wheel);
  const R = 24, rim = M(0xf0f0f0, { metalness: .3, roughness: .4 });
  put(new T.TorusGeometry(R, .35, 6, 64), rim, 0, 0, 0); put(new T.TorusGeometry(R * .55, .2, 6, 48), rim, 0, 0, 0);
  for (let i = 0; i < 16; i++) put(CY(.12, .12, R, 4), rim, Math.cos(i / 16 * TAU) * R / 2, Math.sin(i / 16 * TAU) * R / 2, 0, 0, 0, i / 16 * TAU + Math.PI / 2);
  flushParts(false, wheel);
  for (const sx of [-1, 1]) { const leg = new T.Mesh(B(1, 31, 1), M(0xd0d0d0)); leg.position.set(sx * 8, -14.5, 0); leg.rotation.z = sx * .27; fw.add(leg); }
  const gond = new T.InstancedMesh(B(2.2, 2.4, 2), new T.MeshStandardMaterial({ roughness: .5 }), 16); gond.instanceColor = new T.InstancedBufferAttribute(new Float32Array(48), 3);
  const gc = [0xff6f91, 0xffc75f, 0x4ecdc4, 0x845ec2, 0xf9f871, 0x00c9a7, 0xff9671, 0x2c73d2], _c = new T.Color(), _m = new T.Matrix4();
  for (let i = 0; i < 16; i++) gond.setColorAt(i, _c.set(gc[i % gc.length]));
  fw.add(gond);
  decoAnim.push((dt, t) => {
    const a0 = t * .06; wheel.rotation.z = a0;
    for (let i = 0; i < 16; i++) { const a = a0 + i / 16 * TAU; _m.makeTranslation(Math.cos(a) * R, Math.sin(a) * R - 1.6, 0); gond.setMatrixAt(i, _m); }
    gond.instanceMatrix.needsUpdate = true;
  });
  // 噴水（池のまんなかから水がふき上がる）
  const fount = (STAGE.water || []).map(w => [(w[0] + w[2]) / 2, (w[1] + w[3]) / 2]);
  let acc = 0;
  decoAnim.push(dt => { acc += dt; while (acc > .022) { acc -= .022; for (const [x, z] of fount) { const a = Math.random() * TAU, v = Math.random() * .8; particle(x + Math.cos(a) * .1, -1.2, z + Math.sin(a) * .1, Math.cos(a) * v, 5.5 + Math.random() * 1.2, Math.sin(a) * v, 0, .035 + Math.random() * .035, 1.1); } } });
  // 花びら
  petals();
  gulls(6, 40, 16, M(0x3a3a40));
}
function petals() {
  const N = 180, m = new T.InstancedMesh(new T.PlaneGeometry(.13, .09), new T.MeshStandardMaterial({ color: 0xffb7d0, side: T.DoubleSide, roughness: .8 }), N);
  m.frustumCulled = false; decor.add(m);
  const P = [], G = STAGE.ground, _m = new T.Matrix4(), _q2 = new T.Quaternion(), _e2 = new T.Euler(), _p2 = new T.Vector3(), _s2 = new T.Vector3(1, 1, 1);
  const reset = (p, top) => { p.x = lerp(G[0], G[2], Math.random()); p.z = lerp(G[1], G[3], Math.random()); p.y = top ? 7 + Math.random() * 3 : Math.random() * 9; p.ph = Math.random() * TAU; p.vy = .45 + Math.random() * .4; };
  for (let i = 0; i < N; i++) { const p = {}; reset(p, false); P.push(p); }
  decoAnim.push((dt, t) => {
    for (let i = 0; i < N; i++) {
      const p = P[i]; p.y -= p.vy * dt; p.x += Math.sin(t * 1.3 + p.ph) * dt * .5 + dt * .3; p.z += Math.cos(t * .9 + p.ph) * dt * .3;
      const g = hAt(p.x, p.z); if (p.y < Math.max(g, -1.2) + .02) reset(p, true);
      _e2.set(t * 2 + p.ph, t * 1.3 + p.ph * 2, 0); _q2.setFromEuler(_e2); _m.compose(_p2.set(p.x, p.y, p.z), _q2, _s2); m.setMatrixAt(i, _m);
    }
    m.instanceMatrix.needsUpdate = true;
  });
}

// ---------- 工場：大きな建物・パイプとバルブ・えんとつの煙（動く）・天井クレーン（動く）・つりランプ・タンク ----------
function factoryScenery(q, M) {
  const wallM = new T.MeshStandardMaterial({ map: facadeTex('fac', '#8a8478', '#3a4a5a', .2, 4, 8, 41), roughness: .8 }), dark = M(0x4a4e56, { metalness: .4, roughness: .5 }), stripe = M(0xe0b030);
  for (const sx of [-1, 1]) {
    put(boxW(6, 26, 120, 6), wallM, sx * 46, 13 - 1.3, 0);
    for (let k = 0; k < 4; k++) put(CY(.6, .6, 110, 12), dark, sx * 40, 3 + k * 1.6, 0, Math.PI / 2);
    for (let z = -40; z <= 40; z += 16) { put(new T.TorusGeometry(.5, .08, 6, 16), M(0xc83a32), sx * 39.2, 4.6, z, 0, Math.PI / 2, 0); put(CY(.75, .75, .5, 12), M(0x6a6e76, { metalness: .5 }), sx * 40, 4.6, z, Math.PI / 2); }
  }
  // 外の大きなタンク
  for (const [x, z, r] of [[-66, -30, 9], [-70, 12, 7], [68, 40, 8], [64, -6, 6]]) { put(CY(r, r, 16, 20), M(0xd8d4cc, { metalness: .3 }), x, 6.7, z); put(SP(r, 20, 8, 0, TAU, 0, Math.PI / 2), M(0xd8d4cc, { metalness: .3 }), x, 14.7, z); put(CY(r + .05, r + .05, 1.2, 20), stripe, x, 4, z); }
  for (let i = 0; i < 24; i++) { const x = (q() < .5 ? -1 : 1) * (32 + q() * 6), z = -50 + q() * 100; put(B(1.2, .2, 1.2), stripe, x, -1.2, z); }
  // 天井のレール（クレーンが走る）とつりランプ
  for (const sx of [-1, 1]) { put(B(.8, 1, 104), M(0xe0b030, { metalness: .3 }), sx * 24, 11, 0); for (let z = -48; z <= 48; z += 16) put(B(.7, 13.6, .7), dark, sx * 28.5, 4.5, z); for (let z = -48; z <= 48; z += 16) put(B(5, .5, .5), dark, sx * 26.2, 11, z); }
  for (let z = -36; z <= 36; z += 18) for (const sx of [-1, 1]) { put(CY(.03, .03, 2.4, 4), dark, sx * 12, 9.6, z); put(new T.ConeGeometry(.7, .5, 12, 1, true), M(0x3a4a3a, { side: T.DoubleSide }), sx * 12, 8.3, z); put(SP(.22, 8, 6), lampMat('lampW'), sx * 12, 8.1, z); }
  flushParts(false);
  const crane = new T.Group(); decor.add(crane);
  const beam = new T.Mesh(B(48, 1.2, 1.4), M(0xe0b030, { metalness: .3 })); beam.position.y = 11.9; crane.add(beam);
  const hoist = new T.Mesh(B(1.6, 1, 1.8), dark); hoist.position.y = 11; crane.add(hoist);
  const cable = new T.Mesh(CY(.04, .04, 1, 4), M(0x222226)); crane.add(cable);
  const hook = new T.Mesh(new T.TorusGeometry(.3, .08, 6, 12, Math.PI * 1.5), M(0xc8c8c8, { metalness: .7 })); crane.add(hook);
  decoAnim.push((dt, t) => { crane.position.z = Math.sin(t * .07) * 38; hoist.position.x = Math.sin(t * .11) * 14; const L = 3.5 + Math.sin(t * .23) * 1.5; cable.scale.y = L; cable.position.set(hoist.position.x, 10.5 - L / 2, 0); hook.position.set(hoist.position.x, 10.4 - L, 0); });
  // えんとつと、上へ流れる煙
  const puffs = [];
  const smokeM = new T.MeshStandardMaterial({ color: 0xd8d8d8, transparent: true, opacity: .35, roughness: 1, depthWrite: false });
  for (const [x, z] of [[-60, -70], [-40, -90], [55, 70], [70, -40], [-70, 50]]) {
    put(CY(3, 4, 46, 14), M(0xb0a8a0), x, 22, z); put(CY(3.1, 3.1, 3, 14), M(0xc84a3a), x, 40, z);
    for (let k = 0; k < 6; k++) { const m = new T.Mesh(SP(4, 10, 8), smokeM); m.userData.keepMat = true; decor.add(m); puffs.push({ m, x, z, t: k / 6 }); }
  }
  flushParts(false);
  decoAnim.push(dt => {
    for (const p of puffs) { p.t += dt * .06; if (p.t > 1) p.t -= 1; const u = p.t; p.m.position.set(p.x + u * 14, 46 + u * 26, p.z + u * 4); p.m.scale.setScalar(.8 + u * 1.6); }
    smokeM.opacity = .3;
    const k = Math.sin(clock * 2.7) > 0; DM.lampR && (DM.lampR.emissiveIntensity = k ? 2 : .2); DM.lampG && (DM.lampG.emissiveIntensity = Math.sin(clock * 1.9) > -.3 ? 1.6 : .15); DM.lampY && (DM.lampY.emissiveIntensity = Math.sin(clock * 3.7 + 1) > 0 ? 1.6 : .2);
  });
}
function decoTick(dt) { for (const f of decoAnim) f(dt, clock); }
