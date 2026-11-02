
/* =========================================================================
   Ao Oni: about three metres tall, hunched, a head far too big for its body, black irises that nearly
   fill its eyes (the left one opened wider), and a face that never changes. It follows you through
   doors and up and down stairs the way the original does: a few seconds after you leave a room the door
   opens again and it comes in.
   ========================================================================= */
function makeOniModel() {
  const skin = new THREE.MeshStandardMaterial({ color: 0x938fe4, roughness: 0.72, emissive: 0x15124a, emissiveIntensity: 0.32 });
  const skinD = new THREE.MeshStandardMaterial({ color: 0x6d66c4, roughness: 0.75, emissive: 0x0e0b38, emissiveIntensity: 0.3 });
  const socket = new THREE.MeshStandardMaterial({ color: 0x2e2766, roughness: 0.85 });
  const lipM = new THREE.MeshStandardMaterial({ color: 0x7a6cc4, roughness: 0.55, emissive: 0x120f40, emissiveIntensity: 0.3 });
  const white = new THREE.MeshStandardMaterial({ color: 0xece8dc, roughness: 0.3, emissive: 0x6a6a64, emissiveIntensity: 0.5 });
  const iris = new THREE.MeshStandardMaterial({ color: 0x030205, roughness: 0.05, metalness: 0.2 });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mouthM = new THREE.MeshStandardMaterial({ color: 0x1a0610, roughness: 0.8 });
  const S = (r, sx, sy, sz, m, x = 0, y = 0, z = 0, seg = 20, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.7 | 0)), m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; return o; };
  const C = (rt, rb, h, m, y) => { const g = new THREE.CylinderGeometry(rt, rb, h, 14); g.translate(0, -h / 2, 0); const o = new THREE.Mesh(g, m); o.position.y = y; o.castShadow = true; return o; };
  const root = new THREE.Group(), hips = new THREE.Group(); hips.position.y = 1.05; root.add(hips);
  hips.add(S(1, 0.38, 0.25, 0.28, skin, 0, 0.02, 0));
  const torso = new THREE.Group(); hips.add(torso);
  torso.add(S(1, 0.4, 0.36, 0.32, skin, 0, 0.18, 0.04, 24));        // belly
  torso.add(S(1, 0.5, 0.5, 0.36, skin, 0, 0.5, 0, 24));             // chest
  torso.add(S(1, 0.6, 0.22, 0.34, skin, 0, 0.78, -0.03, 22));       // broad shoulders
  torso.add(C(0.17, 0.2, 0.2, skin, 0.98));                         // neck
  const head = new THREE.Group(); head.position.set(0, 0.9, 0.06); torso.add(head);
  head.add(S(1, 0.47, 0.6, 0.45, skin, 0, 0.55, -0.01, 32));        // the huge bald head
  head.add(S(1, 0.37, 0.27, 0.37, skin, 0, 0.2, 0.05, 24));         // cheeks and jaw
  head.add(S(1, 0.17, 0.11, 0.14, skin, 0, 0.05, 0.22, 18));        // chin
  for (const s of [-1, 1]) {
    head.add(S(1, 0.06, 0.14, 0.1, skinD, s * 0.47, 0.47, -0.01));   // ears
    head.add(S(1, 0.15, 0.13, 0.07, socket, s * 0.16, 0.53, 0.35, 20));   // dark sockets
    head.add(S(1, 0.18, 0.055, 0.1, skin, s * 0.16, 0.665, 0.37, 18, 0, 0, s * -0.28));   // heavy brows, angled down to the nose
    head.add(S(1, 0.12, 0.028, 0.05, socket, s * 0.16, 0.435, 0.4, 14));                    // bags under the eyes
    head.add(S(1, 0.03, 0.09, 0.03, skinD, s * 0.12, 0.22, 0.42, 10, 0, 0, s * 0.3));        // folds beside the mouth
  }
  // the eyes: black irises nearly filling them, the left (its left, +x) opened wider; they follow you
  const eyes = [];
  for (const s of [-1, 1]) {
    const big = s > 0, e = new THREE.Group(); e.position.set(s * 0.16, 0.535, 0.38); head.add(e);
    e.add(S(0.13, 1, big ? 0.88 : 0.62, 0.48, white, 0, 0, 0, 24));
    const piv = new THREE.Group(); e.add(piv);
    piv.add(S(0.108, 1, big ? 0.86 : 0.6, 0.46, iris, 0, 0, 0.02, 22));
    piv.add(S(0.016, 1, 1, 0.5, shine, 0.035, 0.03, 0.066, 8));
    eyes.push(piv);
  }
  head.add(S(1, 0.05, 0.17, 0.06, skin, 0, 0.42, 0.44, 14, -0.25, 0, 0));    // the bridge of the nose
  head.add(S(1, 0.075, 0.06, 0.07, skin, 0, 0.285, 0.5, 16));                // its tip
  for (const s of [-1, 1]) { head.add(S(1, 0.04, 0.035, 0.04, skinD, s * 0.055, 0.275, 0.47, 10)); head.add(S(1, 0.016, 0.01, 0.012, mouthM, s * 0.03, 0.255, 0.51, 8)); }
  const mouth = new THREE.Group(); mouth.position.set(0, 0.145, 0.425); head.add(mouth);
  const upLip = S(1, 0.1, 0.024, 0.045, lipM, 0, 0.012, 0), loLip = S(1, 0.095, 0.034, 0.05, lipM, 0, -0.018, -0.003), inner = S(1, 0.11, 0.07, 0.03, mouthM, 0, -0.004, -0.016);
  inner.scale.y = 0.002; mouth.add(upLip, loLip, inner);
  for (const s of [-1, 1]) mouth.add(S(1, 0.012, 0.01, 0.01, socket, s * 0.1, -0.012, -0.004, 6));
  for (let i = -3; i <= 3; i++) { const t = S(1, 0.014, Math.abs(i) === 3 ? 0.038 : 0.02, 0.012, white, i * 0.028, 0.006, 0.012, 6); t.visible = false; mouth.add(t); }
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.6, 0.76, 0); torso.add(sh);
    sh.add(S(1, 0.17, 0.17, 0.17, skin));
    sh.add(C(0.13, 0.11, 0.66, skin, 0));
    const el = new THREE.Group(); el.position.y = -0.66; sh.add(el);
    el.add(C(0.11, 0.09, 0.62, skin, 0));
    const hand = new THREE.Group(); hand.position.y = -0.66; el.add(hand);
    hand.add(S(1, 0.13, 0.17, 0.1, skinD, 0, -0.04, 0.01));
    for (let f = 0; f < 4; f++) hand.add(S(1, 0.03, 0.09, 0.035, skinD, -0.075 + f * 0.05, -0.21, 0.02, 8));
    arms.push({ sh, el, hand, s });
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const hp = new THREE.Group(); hp.position.set(s * 0.2, -0.02, 0); hips.add(hp);
    hp.add(C(0.17, 0.13, 0.52, skin, 0));
    const kn = new THREE.Group(); kn.position.y = -0.52; hp.add(kn);
    kn.add(C(0.125, 0.1, 0.47, skin, 0));
    const ft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.34), skinD); ft.position.set(0, -0.48, 0.07); kn.add(ft);
    legs.push({ hp, kn, s });
  }
  root.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  return { root, hips, torso, head, eyes, mouth, upLip, loLip, inner, arms, legs, teeth: mouth.children.slice(5) };
}

// フワッティー: a soft pale slab taller than a man, a wide black grin, two dots for eyes, stubby arms and legs
function makeFuwatty(root) {
  const g = new THREE.Group(), pale = new THREE.MeshStandardMaterial({ color: 0xf2eee2, roughness: 0.85, emissive: 0x1c1a14, emissiveIntensity: 0.25 }), ink = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.3, 0.75, 4, 6, 2), pale); body.position.y = 1.55; g.add(body);
  { const p = body.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 - 0.12 * (y / 1.15) ** 2; p.setXYZ(i, x * k, y, z * (0.85 + 0.15 * k)); } body.geometry.computeVertexNormals(); }
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), ink); eye.position.set(sx * 0.3, 2.15, 0.39); g.add(eye);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.45, 4, 8), pale); arm.position.set(sx * 0.86, 1.35, 0.05); arm.rotation.z = sx * 0.5; g.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.25, 4, 8), pale); leg.position.set(sx * 0.38, 0.3, 0); g.add(leg);
  }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.32, 0.05), ink); mouth.position.set(0, 1.75, 0.385); g.add(mouth);
  for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.03), pale); t.position.set(-0.42 + i * 0.12, 1.87, 0.405); g.add(t); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  g.visible = false; root.add(g); return g;
}
// in a room with a closet: time to run from the door to it, and two seconds more, before it comes in after you
function hideGrace(door) {
  let best = Infinity;
  for (const h of MAN.hides) if (door.area.joined.has(h.room)) best = Math.min(best, Math.hypot(h.exitP.x - door.front.x, h.exitP.z - door.front.z) * 1.15 / RUN);
  return best === Infinity ? 0 : best + 2;
}
const ESCAPE_T = 14;   // seconds out of its sight before it gives up (the original's chase timer, longer for the bigger rooms)
// iron bars between two points (it can see through them, but not reach)
function barsBetween(a, b) {
  for (const c of WORLD.colliders(a, a.distanceTo(b) + 1)) if (c.tag === 'bars' && c.on && segBox(a.x, a.z, b.x, b.z, c.x0, c.z0, c.x1, c.z1)) return true;
  return false;
}
const ONI = {
  on: false, m: null, pos: new THREE.Vector3(), yaw: 0, state: 'off', vel: 0, phase: 0, bend: 0, bendT: 0, mouthT: 0, armsUp: 0, grab: 0,
  path: null, pi: 0, repathT: 0, lostT: 0, chaseT: 0, sawHide: null, transit: null, script: null, wait: 0, ghostT: 0, stuckT: 0, lastPos: new THREE.Vector3(),
  stepAcc: 0, breathT: 0, hbT: 0, sub: 0, inspect: null, leaveDoor: null, goal: null,
  init() { if (this.m) return; this.m = makeOniModel(); this.m.root.visible = false; scene.add(this.m.root); },
  reset() { this.despawn(true); },
  room() { const c = cellOf(this.pos); return c ? c.area : null; },
  eye() { return tmpV3.set(this.pos.x, this.pos.y + 2.5 - this.bend * 0.85, this.pos.z); },
  show(on) { this.m.root.visible = on; },
  spawn(x, y, z, yaw, state = 'chase', keep = false) {
    this.init();
    // keep: it is only coming out of a door in the middle of a chase or a search
    if (keep) Object.assign(this, { on: true, yaw, state, vel: 0, path: null, repathT: 0, transit: null, ghostT: 0, stuckT: 0 });
    else Object.assign(this, { on: true, yaw, state, vel: 0, bend: 0, bendT: 0, armsUp: 0, grab: 0, mouthT: 0, path: null, repathT: 0, lostT: 0, chaseT: 0, sawHide: null, transit: null, script: null, wait: 0, sub: 0, inspect: null, ghostT: 0, stuckT: 0, goal: null });
    this.pos.set(x, y, z); this.lastPos.copy(this.pos);
    this.show(true); this.place();
  },
  // it opens a door and comes in (after `delay` seconds)
  enterVia(door, delay = 0, state = 'chase', keep = false) {
    this.init();
    const go = () => {
      const d = new THREE.Vector3(-Math.sin(door.yawIn), 0, -Math.cos(door.yawIn));
      this.spawn(door.front.x, door.front.y, door.front.z, Math.atan2(d.x, d.z), state, keep);
      animateDoor(door, 1.2, 700); SFX.door(door.center, 1.1); setTimeout(() => SFX.doorShut(door.center), 520);
    };
    if (delay > 0) { if (!this.on) this.lostT = 0; this.on = true; this.state = 'transit'; this.show(false); this.transit = { t: delay, fn: go }; } else go();
  },
  despawn(quiet = false) {
    const was = this.on;
    this.on = false; this.state = 'off'; this.transit = null; this.script = null;
    if (this.m) { this.show(false); this.setLook(null); this.m.root.scale.setScalar(1); }
    if (was && !quiet) DIRECTOR.onGone();
  },
  place() { const m = this.m; m.root.position.copy(this.pos); m.root.rotation.y = this.yaw; },
  // what Mika became: the same blue body, with her brown bob on that huge head
  setLook(look) {
    this.init();
    if (look === 'mika' && !this.m.hair) {
      const hm = new THREE.MeshStandardMaterial({ color: 0x5a2e18, roughness: 0.6 }), hair = new THREE.Group();
      const S = (sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 16), hm); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.castShadow = true; hair.add(o); };
      S(0.5, 0.42, 0.47, 0, 0.68, -0.05); S(0.49, 0.2, 0.36, 0, 0.83, 0.12);
      for (const s of [-1, 1]) S(0.14, 0.42, 0.3, s * 0.42, 0.42, 0.02);
      S(0.46, 0.36, 0.2, 0, 0.36, -0.3);
      this.m.head.add(hair); this.m.hair = hair; hair.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
    }
    if (this.m.hair) this.m.hair.visible = look === 'mika';
    // Takeshi turned into it: his spiky blond hair on its head
    if (look === 'takeshi' && !this.m.tkHair) {
      const hm = new THREE.MeshStandardMaterial({ color: 0xe8c840, roughness: 0.55 }), hair = new THREE.Group();
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hm); cap.position.set(0, 0.62, -0.03); hair.add(cap);
      for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.4, sp = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 8), hm); sp.position.set(Math.sin(a) * 0.36, 0.86 + Math.cos(a) * 0.08, Math.cos(a) * 0.12 - 0.05); sp.rotation.set(-0.5, 0, -a * 0.55); hair.add(sp); }
      this.m.head.add(hair); this.m.tkHair = hair; hair.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    }
    if (this.m.tkHair) this.m.tkHair.visible = look === 'takeshi';
    // Takuro turned into it: his red hair, tied back in a ponytail
    if (look === 'takuro' && !this.m.tkrHair) {
      const hm = new THREE.MeshStandardMaterial({ color: 0xc8482c, roughness: 0.6 }), hair = new THREE.Group();
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), hm); cap.position.set(0, 0.6, -0.04); hair.add(cap);
      const tie = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), hm); tie.position.set(0, 0.62, -0.5); hair.add(tie);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.75, 10), hm); tail.position.set(0, 0.3, -0.58); tail.rotation.x = Math.PI + 0.35; hair.add(tail);
      for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 1.6, f = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 7), hm); f.position.set(Math.sin(a) * 0.3, 0.86, 0.22 + Math.cos(a) * 0.05); f.rotation.set(0.9, 0, -a * 0.5); hair.add(f); }
      this.m.head.add(hair); this.m.tkrHair = hair; hair.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    }
    if (this.m.tkrHair) this.m.tkrHair.visible = look === 'takuro';
    // Fuwatty: not its body at all, a big pale slab like hanpen with a grin, on two stubby legs
    if (look === 'fuwatty' && !this.m.fw) this.m.fw = makeFuwatty(this.m.root);
    if (this.m.fw) this.m.fw.visible = look === 'fuwatty';
    this.m.hips.visible = look !== 'fuwatty';
    this.look = look;
  },
  sameSpace() { const a = this.room(), b = GAME.room; return a && b && b.joined.has(a) && Math.abs(this.pos.y - PLAYER.pos.y) < 3; },
  canSee(cone = false) {
    if (!PLAYER.alive || PLAYER.hidden || this.state === 'transit' || !this.sameSpace()) return false;
    const p = PLAYER.pos, dx = p.x - this.pos.x, dz = p.z - this.pos.z, d = Math.hypot(dx, dz);
    if (d > 42) return false;
    if (cone && d > 1.5 && Math.abs(angDiff(this.yaw, Math.atan2(dx, dz))) > 1.3) return false;
    return !WORLD.blocked(this.eye().clone(), tmpV2.set(p.x, p.y + 1.5, p.z));
  },
  seenByPlayer() {
    if (!this.on || this.state === 'transit' || !this.sameSpace()) return false;
    const e = this.eye().clone(), c = camera.position;
    if (WORLD.blocked(c.clone(), e)) return false;
    tmpV2.subVectors(e, c).normalize();
    return tmpV2.dot(GAME.camDir) > 0.3 || e.distanceTo(c) < 4;
  },
  /* ---------- what the player does ---------- */
  onPlayerHide(h) {
    if (!this.on || this.state === 'kill') return;
    // in the original: if it is in the room when you get in, it finds you
    if (this.state !== 'transit' && this.sameSpace() && (this.state === 'chase' || this.canSee(true))) { this.sawHide = h; this.state = 'chase'; this.path = null; }
  },
  onPlayerExitHide() { if (this.on && this.state !== 'chase' && this.state !== 'transit' && this.canSee(false)) this.startChase(); },
  onPlayerMoved(from, to) {
    // a follow-in now and then, once it has been seen
    if (!this.on) { DIRECTOR.onPlayerMoved(from, to); return; }
    if (this.state === 'chase' && this.transit == null && !this.sawHide) this.repathT = 0;
  },
  startChase() { if (this.state !== 'chase') { this.state = 'chase'; this.chaseT = 0; this.path = null; SFX.oniSpot(); } },
  /* ---------- moving ---------- */
  collide(np) {
    const r = 0.42, feet = this.pos.y, hgt = 2.4;
    for (let it = 0; it < 2; it++) for (const c of WORLD.colliders(np, r)) {
      if (c.wy1 <= feet + 0.35 || c.wy0 >= feet + hgt) continue;
      if (this.ghostT > 0 && c.tag === 'furn') continue;
      const qx = clamp(np.x, c.x0, c.x1), qz = clamp(np.z, c.z0, c.z1), dx = np.x - qx, dz = np.z - qz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; np.x += dx * k; np.z += dz * k; }
    }
  },
  stepToward(tx, tz, sp, dt, turn = 7) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.02) { this.vel = damp(this.vel, 0, 8, dt); return d; }
    const want = Math.atan2(dx, dz);
    this.yaw += clamp(angDiff(this.yaw, want), -turn * dt, turn * dt);
    const face = Math.cos(angDiff(this.yaw, want));
    this.vel = damp(this.vel, sp * clamp(face, 0.25, 1), 5, dt);
    const st = Math.min(this.vel * dt, d);
    const np = tmpV.set(this.pos.x + Math.sin(this.yaw) * st, this.pos.y, this.pos.z + Math.cos(this.yaw) * st);
    this.collide(np);
    const g = WORLD.groundAt(np.x, np.z, this.pos.y + 0.1);
    if (g === null) return d;
    np.y = g; this.pos.copy(np);
    return d;
  },
  // follow the tiles to a point (anywhere in the house), going through doors and stairs; true once there
  followTo(goal, sp, dt) {
    if (this.sameSpaceAs(goal) && !WORLD.blocked(tmpV2.set(this.pos.x, this.pos.y + 1, this.pos.z), tmpV3.set(goal.x, goal.y + 1, goal.z))) {
      this.path = null;
      return this.stepToward(goal.x, goal.z, sp, dt) < 0.5;
    }
    this.repathT -= dt;
    if (!this.path || this.repathT <= 0) {
      this.repathT = 0.5;
      this.path = navPath(nearestNode(this.pos), nearestNode(goal)); this.pi = 1;
      if (!this.path) return this.stepToward(goal.x, goal.z, sp, dt) < 0.5;
    }
    const step = this.path[this.pi];
    if (!step) return this.stepToward(goal.x, goal.z, sp, dt) < 0.5;
    if (step.via && (step.via.door || step.via.stair)) { this.useLink(step); return false; }
    const n = nodePos(step.node, tmpV2);
    if (this.stepToward(n.x, n.z, sp, dt) < 0.45) this.pi++;
    return false;
  },
  sameSpaceAs(p) { const a = this.room(), c = cellOf(p); return a && c && a.joined.has(c.area) && Math.abs(this.pos.y - p.y) < 3; },
  // through a door or up/down stairs: gone from here, and a moment later it comes out on the other side
  useLink(step) {
    const v = step.via, was = this.state === 'transit' ? 'chase' : this.state;   // chasing or searching, it carries on after the door
    if (v.door) {
      const d = v.door, p = MAN.doors[d.to];
      animateDoor(d, 1.1, 600); SFX.door(d.center, 0.9);
      const playerThere = GAME.room === p.area;
      this.show(false); this.state = 'transit';
      this.transit = { t: playerThere ? Math.max(rng.range(1.6, 2.6), hideGrace(p)) : 1.2, fn: () => { this.enterVia(p, 0, was, true); this.path = null; } };
    } else {
      const s = MAN.stairs[v.stair.to];
      this.show(false); this.state = 'transit';
      this.transit = { t: 1.6, fn: () => { const a = stairPoint(s, 1 - 0.9 / s.len); this.spawn(a.x, a.y, a.z, s.dir === 'N' ? 0 : Math.PI, was, true); SFX.oniStep(a, 0.9); } };   // out of the dark end of the flight
    }
    this.path = null;
  },
  /* ---------- update ---------- */
  update(dt) {
    if (!this.on) return;
    if (this.state === 'kill') return;
    if (GAME.modal || GAME.busy) { if (this.m.root.visible) this.animate(dt, 0); return; }
    if (this.state === 'transit') {
      const tr = this.transit; if (!tr) { this.despawn(); return; }
      tr.t -= dt; if (this.lostT > ESCAPE_T + 2 && !this.sawHide && !this.inspect) { this.despawn(); return; }
      this.lostT += dt;
      if (tr.t <= 0) { this.transit = null; tr.fn(); }
      return;
    }
    const P = PLAYER, seen = this.canSee(this.state !== 'chase');
    if (seen) { this.lostT = Math.max(0, this.lostT - dt * 3); if (this.state !== 'chase' && this.state !== 'appear' && this.state !== 'script' && this.state !== 'bars' && this.state !== 'leave') this.startChase(); if (this.state === 'script' && this.script && this.script.breakOnSight) this.startChase(); }
    let sp = 0;
    switch (this.state) {
      case 'appear': {   // stands there, turns its head to you, then comes
        this.wait += dt;
        const want = Math.atan2(P.pos.x - this.pos.x, P.pos.z - this.pos.z); this.yaw += clamp(angDiff(this.yaw, want), -2 * dt, 2 * dt);
        if (this.wait > (this.appearFor || 1.4)) { this.wait = 0; this.startChase(); }
        break;
      }
      case 'chase': {
        this.chaseT += dt;
        if (!seen) this.lostT += dt;
        sp = this.chaseT < 0.8 ? RUN * 0.7 : RUN * 0.95;   // a little slower than you running
        if (this.sawHide) {
          const h = this.sawHide;
          if (P.hidden !== h) { this.sawHide = null; break; }
          if (this.followTo(h.exitP, sp, dt) || Math.hypot(h.exitP.x - this.pos.x, h.exitP.z - this.pos.z) < 0.8) { GAME.caught(true); return; }
          break;
        }
        if (this.lostT > ESCAPE_T) { this.giveUp(); break; }
        if (P.hidden) { this.toSearch(P.hidden); break; }
        this.followTo(P.pos, sp, dt);
        const dP = Math.hypot(P.pos.x - this.pos.x, P.pos.z - this.pos.z);
        if (dP < 1.05 && Math.abs(P.pos.y - this.pos.y) < 1.2 && P.alive && !P.hidden && !WORLD.blocked(this.eye().clone(), tmpV2.set(P.pos.x, P.pos.y + 1.4, P.pos.z)) && !barsBetween(this.pos, P.pos)) { GAME.caught(false); return; }
        break;
      }
      case 'search': {   // you hid where it could not see: it comes into the room, looks, peeks at a closet, goes
        this.lostT += dt;
        const h = this.inspect;
        if (this.sub === 0) { sp = 3.4; if (this.followTo(h.room.spawnPt || nodePos(nearestNode(h.exitP), new THREE.Vector3()), sp, dt) || this.sameSpaceAs(h.exitP)) { this.sub = 1; this.wait = 0; } if (this.lostT > 30) this.toLeave(); }
        else if (this.sub === 1) { this.wait += dt; this.yaw += Math.sin(this.wait * 2) * dt * 1.5; if (this.wait > 2.2) { this.sub = 2; this.wait = 0; } }
        else if (this.sub === 2) { sp = 2.0; if (this.followTo(this.peekSpot(h), sp, dt)) { this.sub = 3; this.wait = 0; } this.wait += dt; if (this.wait > 12) this.toLeave(); }
        else { this.wait += dt; this.yaw += clamp(angDiff(this.yaw, h.yaw), -3 * dt, 3 * dt); this.bendT = this.wait < 3.6 ? 1 : 0; this.alignPeek(h, dt); if (this.wait > 4.6) this.toLeave(); }
        break;
      }
      case 'leave': {
        sp = 3.0; this.bendT = 0; this.wait += dt;
        if (!this.goal) this.goal = this.exitDoor();
        if (!this.goal) { this.despawn(); return; }
        if (this.followTo(this.goal.front, sp, dt) || this.wait > 20) {
          animateDoor(this.goal, 1.1, 600); SFX.door(this.goal.center, 0.9); setTimeout(() => SFX.doorShut(this.goal ? this.goal.center : P.pos), 450);
          this.despawn(); return;
        }
        break;
      }
      case 'script': sp = this.runScript(dt); if (!this.on) return; break;
      case 'bars': this.barsUpdate(dt); this.sounds(dt, 0); return;
      default: break;
    }
    // stuck on furniture: let it slide through for a moment
    const moved = Math.hypot(this.pos.x - this.lastPos.x, this.pos.z - this.lastPos.z);
    if (sp > 1 && moved < sp * dt * 0.2) { this.stuckT += dt; if (this.stuckT > 0.5) { this.ghostT = 1.2; this.stuckT = 0; } } else this.stuckT = Math.max(0, this.stuckT - dt);
    this.ghostT = Math.max(0, this.ghostT - dt);
    this.lastPos.copy(this.pos);
    this.animate(dt, moved / Math.max(dt, 1e-4));
    this.sounds(dt, moved);
  },
  giveUp() {
    MUSIC.stop(3);
    if (this.seenByPlayer()) this.toLeave(); else this.despawn();
  },
  toSearch(h) { this.state = 'search'; this.sub = 0; this.wait = 0; this.inspect = h; this.path = null; },
  toLeave() { this.state = 'leave'; this.goal = null; this.path = null; this.wait = 0; this.bendT = 0; },
  exitDoor() {
    const r = this.room(); if (!r) return null;
    let best = null, bd = Infinity;
    for (const d of MAN.doorList) { if (!r.joined.has(d.area) || GAME.doorShut(d) || !d.to) continue; const dd = d.front.distanceTo(this.pos); if (dd < bd) { bd = dd; best = d; } }
    return best;
  },
  peekSpot(h) { return new THREE.Vector3(h.cam.x, h.exitP.y, h.cam.z).addScaledVector(tmpV2.set(-Math.sin(h.yaw), 0, -Math.cos(h.yaw)), 1.45); },
  // bend down to the gap between the closet doors: slide so its eyes end up right outside it
  alignPeek(h, dt) {
    if (this.bend < 0.5) return;
    const want = tmpV2.copy(h.cam).addScaledVector(tmpV3.set(-Math.sin(h.yaw), 0, -Math.cos(h.yaw)), 0.62);
    this.m.root.updateMatrixWorld(true);
    const e = this.m.head.localToWorld(new THREE.Vector3(0, 0.5, 0.35));
    this.pos.x += (want.x - e.x) * Math.min(1, dt * 4); this.pos.z += (want.z - e.z) * Math.min(1, dt * 4);
  },
  /* ---------- scripted walks ---------- */
  runScript(dt) {
    const S = this.script, st = S && S.steps[S.i];
    if (!st) { this.despawn(true); if (S && S.done) S.done(); return 0; }
    const next = () => { S.i++; this.wait = 0; this.path = null; };
    switch (st.t) {
      case 'go': if (this.followTo(st.p, st.sp || 2, dt)) next(); return st.sp || 2;
      case 'look': this.wait += dt; this.yaw += Math.sin(this.wait * 1.8) * dt * 1.2; if (this.wait > st.d) next(); return 0;
      case 'face': { const y = st.toPlayer ? Math.atan2(PLAYER.pos.x - this.pos.x, PLAYER.pos.z - this.pos.z) : st.yaw; this.yaw += clamp(angDiff(this.yaw, y), -(st.turn || 3) * dt, (st.turn || 3) * dt); if (st.bend != null) this.bendT = st.bend; this.wait += dt; if (this.wait > (st.d || 0.6)) next(); return 0; }
      case 'eat': {   // crouched over something, its head going down to it again and again
        const w0 = this.wait; this.wait += dt; this.bendT = 0.95 + Math.sin(this.wait * 7) * 0.09; this.mouthT = Math.max(0, Math.sin(this.wait * 8.5)) * 0.75;
        if (Math.floor(w0 / 0.62) !== Math.floor(this.wait / 0.62)) SFX.chew(this.pos);
        if (this.wait > st.d) { this.mouthT = 0; next(); }
        return 0;
      }
      case 'call': st.fn(); next(); return 0;
      case 'rise': {   // up out of the floor
        if (st.base == null) { st.base = this.pos.y; SFX.push(this.pos.clone().setY(this.pos.y + 0.3)); }
        this.wait += dt; const k = smoothstep(0, 1, this.wait / st.d); this.pos.y = st.base - 3.3 * (1 - k); this.place();
        if (this.wait > st.d) { this.pos.y = st.base; next(); }
        return 0;
      }
      case 'crawl': {   // out of somewhere low (the fireplace): bent double, forward, straightening as it comes out
        if (st.base == null) { st.base = this.pos.y; st.x0 = this.pos.x; st.z0 = this.pos.z; this.bend = this.bendT = 1; SFX.push(this.pos.clone().setY(this.pos.y + 0.3)); }
        this.wait += dt; const k = smoothstep(0, 1, this.wait / st.d), dist = st.dist || 1.4;
        this.pos.x = st.x0 + Math.sin(this.yaw) * dist * k; this.pos.z = st.z0 + Math.cos(this.yaw) * dist * k; this.pos.y = st.base - (st.drop || 0.9) * (1 - k);
        this.bendT = 1 - 0.75 * k; this.place();
        if (this.wait > st.d) { this.pos.y = st.base; next(); }
        return st.d ? dist / st.d : 0;
      }
      case 'squeeze': {   // out of a hole in the wall: small (up at the hole), then all of it, down on the floor
        if (st.base == null) st.base = this.pos.y;
        this.wait += dt; const k = smoothstep(0, 1, this.wait / st.d); this.m.root.scale.setScalar(0.25 + 0.75 * k);
        this.pos.y = st.base + (st.lift || 0) * (1 - k); this.place();
        if (this.wait > st.d) { this.m.root.scale.setScalar(1); this.pos.y = st.base; this.place(); next(); }
        return 0;
      }
      case 'gone': this.despawn(true); if (st.fn) st.fn(); return 0;
      default: next(); return 0;
    }
  },
  // the jail: it comes to the bars, grabs them, stares in at you; it can't get in if the cell door is shut
  barsUpdate(dt) {
    const c = MAN.cell, P = PLAYER;
    this.wait += dt;
    if (P.pos.z > c.z + 0.15 && this.canSee(false)) { this.grab = 0; this.bendT = 0; this.startChase(); return; }   // you are not in the cell
    const spot = new THREE.Vector3(clamp(P.pos.x, c.x0 + 0.8, c.x1 - 0.8), FLOORS.F1, c.z + 0.95);
    if (this.sub === 0) {
      if (this.followTo(spot, 2.6, dt) || this.wait > 9) { this.sub = 1; this.wait = 0; }
      if (!c.closed && Math.hypot(this.pos.x - tm(31.5), this.pos.z - c.z) < 2.2) { this.sub = 9; }
    } else if (this.sub === 1) {
      if (!c.closed) { this.sub = 9; return; }
      this.yaw += clamp(angDiff(this.yaw, Math.PI), -3 * dt, 3 * dt);
      this.pos.x = damp(this.pos.x, spot.x, 1.5, dt); this.pos.z = damp(this.pos.z, c.z + 0.62, 2, dt);
      this.grab = Math.min(1, this.grab + dt * 2); this.bendT = 0.35;
      if (Math.random() < dt * 1.4) { SFX.bars(new THREE.Vector3(this.pos.x, this.pos.y + 1.5, c.z)); POST.shake = Math.max(POST.shake, 0.25); }
      if (this.wait > 6.5) { this.grab = 0; this.bendT = 0; this.toLeave(); }
    } else if (this.sub === 9) {   // the door was open: it comes in
      this.grab = 0; this.bendT = 0; this.state = 'chase'; this.lostT = 0;
    }
    const moved = Math.hypot(this.pos.x - this.lastPos.x, this.pos.z - this.lastPos.z); this.lastPos.copy(this.pos);
    this.animate(dt, moved / Math.max(dt, 1e-4));
  },
  /* ---------- animation ---------- */
  animate(dt, speed = 0) {
    const m = this.m; if (!m) return;
    if (m.fw && m.fw.visible) { this.phase += dt * (2 + speed * 1.6); m.fw.position.y = Math.abs(Math.sin(this.phase)) * 0.18 * clamp(speed / 3, 0.2, 1); m.fw.rotation.z = Math.sin(this.phase) * 0.06; }
    this.bend = damp(this.bend, this.bendT, 3, dt);
    const k = clamp(speed / 4, 0, 1.2), hunch = 0.28;
    this.phase += dt * (1.8 + speed * 1.25);
    const s = Math.sin(this.phase), c = Math.cos(this.phase);
    for (const L of m.legs) { const ph = L.s > 0 ? s : -s; L.hp.rotation.x = ph * 0.55 * k - this.bend * 0.6; L.kn.rotation.x = Math.max(0, -Math.cos(this.phase + (L.s > 0 ? 0 : Math.PI))) * 0.8 * k + this.bend * 1.0 + 0.08; }
    const up = this.armsUp, gr = this.grab;
    for (const A of m.arms) {
      const ph = A.s > 0 ? -s : s;
      A.sh.rotation.x = ph * 0.4 * k - up * 1.45 - gr * 1.25 - this.bend * 0.4 + 0.12; A.sh.rotation.z = A.s * (0.14 + up * 0.25 - gr * 0.12);
      A.el.rotation.x = -0.18 - k * 0.2 - up * 0.3 - gr * 0.55;
      A.hand.rotation.x = gr * 0.6;
    }
    m.hips.position.y = 1.05 + Math.abs(c) * 0.05 * k - this.bend * 0.35;
    m.torso.rotation.x = hunch + this.bend * 0.75 + k * 0.06; m.torso.rotation.z = s * 0.035 * k;
    m.head.rotation.x = -hunch * 0.6 - this.bend * 0.55; m.head.rotation.z = Math.sin(GAME.time * 0.6) * 0.04 + (this.state === 'search' ? Math.sin(GAME.time * 1.3) * 0.1 : 0);
    const mo = this.mouthT; m.inner.scale.y = 0.002 + mo * 0.1; m.upLip.position.y = 0.012 + mo * 0.05; m.loLip.position.y = -0.022 - mo * 0.065; m.teeth.forEach(t => (t.visible = mo > 0.2));
    this.place();
    // the irises follow you
    m.root.updateMatrixWorld(true);
    for (const e of m.eyes) {
      const l = e.parent.worldToLocal(tmpV3.copy(camera.position));
      e.rotation.set(clamp(-Math.atan2(l.y, Math.hypot(l.x, l.z)), -0.3, 0.3), clamp(Math.atan2(l.x, l.z), -0.4, 0.4), 0);
    }
  },
  sounds(dt, moved) {
    this.stepAcc += moved;
    if (this.stepAcc > 1.05) { this.stepAcc = 0; SFX.oniStep(this.pos, this.vel > 3 ? 1 : 0.7); }
    this.breathT -= dt;
    if (this.breathT <= 0) { this.breathT = 2.4 + Math.random() * 1.6; SFX.oniBreath(this.eye().clone()); }
    if (PLAYER.hidden) {
      const d = Math.hypot(PLAYER.pos.x - this.pos.x, PLAYER.pos.z - this.pos.z);
      if (d < 10 && this.sameSpace()) { this.hbT -= dt; if (this.hbT <= 0) { this.hbT = lerp(0.42, 1.0, d / 10); SFX.heartbeat(lerp(0.9, 0.35, d / 10)); } }
    }
  },
};

/* ---------- when it turns up on its own ----------
   Once it has chased you in the library it can turn up anywhere: after a door or a flight of stairs it
   sometimes comes in behind you, or is already standing in the room; stay put long enough and it opens a door.
   Rarely, as in the original: about twice in half an hour (the story's own appearances come on top of that) */
const RAND_FIRST = [480, 720], RAND_GAP = [780, 1080], AFTER_SCRIPT = 120;   // seconds of play
const DIRECTOR = {
  enabled: false, cool: 45, idle: 0, mine: false,
  reset() { this.enabled = false; this.cool = 45; this.idle = 0; this.mine = false; },
  // the library chase: from now on it may turn up by itself, the first time some minutes later
  start() { this.enabled = true; this.cool = rng.range(RAND_FIRST[0], RAND_FIRST[1]); this.mine = false; },
  onGone() {
    // after one of its own: a long while before the next; after the story's: not straight away
    this.cool = this.mine ? rng.range(RAND_GAP[0], RAND_GAP[1]) : Math.max(this.cool, AFTER_SCRIPT);
    this.mine = false; this.idle = 0;
    MUSIC.stop(2.5); GAME.chaseFx = 0;
  },
  // rooms where something else happens (or is still to happen): it does not turn up there by chance
  quiet(r) {
    const f = STORY.flags;
    if (!r || r.id === 'hidden' || r.id === 'jail') return true;
    return (r.id === 'library' && !f.glimpse) || (r.id === 'attic' && !f.takuro) || (r.id === 'piano' && !f.pianoChaseDone) || (r.id === 'tatami' && !f.tatamiChaseDone) || (r.id === 'kids' && !f.kidsChaseDone) || (r.id === 'takeshi' && !f.takeshiGone);
  },
  ready() { return this.enabled && !ONI.on && !STORY.busy && PLAYER.alive && !PLAYER.hidden && this.cool <= 0 && !this.quiet(GAME.room); },
  update(dt) {
    if (!this.enabled || ONI.on || GAME.modal) return;
    this.cool -= dt;
    if (this.cool > 0) return;
    this.idle += dt;
    if (this.idle > 40 && !GAME.busy && this.ready()) this.knock();
  },
  // you went through a door or up/down the stairs
  onPlayerMoved(from, to) {
    this.idle = 0;
    if (!from || !to || !this.ready()) return;
    const k = rng.next();
    if (k < 0.45) this.followIn(to);
    else if (k < 0.65) this.ambush(GAME.room);
  },
  // a few seconds later it comes through after you
  followIn(to) {
    this.cool = 999; this.mine = true;
    const here = GAME.room, retry = () => { this.cool = 25; this.mine = false; };
    if (to.front) {
      GAME.later(Math.max(rng.range(2.5, 4.5), hideGrace(to) - 1.0), () => { if (!ONI.on && PLAYER.alive && GAME.room === here && !STORY.busy) { SFX.oniStep(to.front, 0.8); ONI.enterVia(to, 1.0); } else retry(); });
      return;
    }
    GAME.later(rng.range(2.6, 4.2), () => {   // up the stairs behind you, out of their dark end
      if (ONI.on || !PLAYER.alive || GAME.room !== here || STORY.busy) { retry(); return; }
      const a = stairPoint(to, 1 - 0.9 / to.len); ONI.spawn(a.x, a.y, a.z, to.dir === 'N' ? 0 : Math.PI, 'chase'); ONI.chaseT = 0; SFX.oniStep(a, 0.9); SFX.oniSpot();
    });
  },
  // it is already standing in the room as you come in
  ambush(r) {
    const P = PLAYER.pos, ok = [];
    for (const n of MAN.nodes) {
      if (n.area !== r || n.blocked || n.stair) continue;
      const q = nodePos(n), d = Math.hypot(q.x - P.x, q.z - P.z);
      if (d > 6 && d < 22 && !WORLD.blocked(tmpV2.set(q.x, q.y + 1.5, q.z), tmpV3.set(P.x, P.y + 1.5, P.z))) ok.push(q);
    }
    if (!ok.length) return;
    const q = ok[(rng.next() * ok.length) | 0];
    this.cool = 999; this.mine = true;
    ONI.spawn(q.x, q.y, q.z, Math.atan2(P.x - q.x, P.z - q.z), 'appear'); ONI.appearFor = 1.2;
    GAME.later(0.25, () => { if (ONI.on) { SFX.oniSpot(); POST.shake = 0.3; } });
  },
  // you have been in one place a while: it opens one of the doors of the room
  knock() {
    const P = PLAYER.pos, ds = MAN.doorList.filter(d => d.area === GAME.room && d.to && !GAME.doorShut(d) && Math.hypot(d.front.x - P.x, d.front.z - P.z) > 4.5);
    if (!ds.length) { this.ambush(GAME.room); if (!ONI.on) this.cool = 20; return; }
    const d = ds[(rng.next() * ds.length) | 0];
    this.cool = 999; this.idle = 0; this.mine = true;
    SFX.oniStep(d.front, 0.7); GAME.later(0.6, () => SFX.oniStep(d.front, 0.85));
    ONI.enterVia(d, 1.6);
  },
};

/* ---------- caught ---------- */
GAME.caught = function (inHide) {
  if (!PLAYER.alive) return;
  PLAYER.alive = false; GAME.caughtN = (GAME.caughtN || 0) + 1; dropChair(); stopPush();
  ONI.state = 'kill'; ONI.show(true); MUSIC.stop(0.2); GAME.chaseFx = 0; GAME.lighterOn = false;
  const h = PLAYER.hidden;
  if (h && h.doors) { h.doors.forEach(d => (d.visible = true)); animateHideDoors(h, 420, 1.7); SFX.closet(h.cam, false); }
  $('fxHide').style.opacity = 0;
  if (document.pointerLockElement) document.exitPointerLock();
  const eye = camera.position.clone(), dir = new THREE.Vector3(), ground = h ? h.exitP.y : PLAYER.pos.y;
  if (inHide && h) dir.set(-Math.sin(h.yaw), 0, -Math.cos(h.yaw));
  else { dir.set(ONI.pos.x - eye.x, 0, ONI.pos.z - eye.z); if (dir.lengthSq() < 1e-4) dir.set(-Math.sin(PLAYER.yaw), 0, -Math.cos(PLAYER.yaw)); dir.normalize(); }
  ONI.yaw = Math.atan2(-dir.x, -dir.z); ONI.bendT = 0.55; ONI.bend = 0.55;
  const t0 = performance.now(), E = new THREE.Vector3();
  ONI.pos.set(eye.x + dir.x * 2, ground, eye.z + dir.z * 2);
  GAME.cine = { pos: eye, look: eye.clone().addScaledVector(dir, 1).setY(eye.y + 0.5) };
  SFX.oniCatch();
  animate(() => {
    const k = (performance.now() - t0) / 1000, dist = lerp(1.7, 0.78, smoothstep(0, 0.32, k));
    ONI.armsUp = smoothstep(0, 0.25, k); ONI.mouthT = smoothstep(0.05, 0.3, k);
    ONI.animate(1 / 60, 0);
    // slide it so that its eyes are `dist` in front of yours
    ONI.m.head.localToWorld(E.set(0, 0.53, 0.38));
    ONI.pos.x += eye.x + dir.x * dist - E.x; ONI.pos.z += eye.z + dir.z * dist - E.z; ONI.place();
    ONI.m.head.localToWorld(E.set(0, 0.45, 0.38));
    GAME.cine.look.lerp(E, 0.35);
    POST.shake = k < 0.9 ? 0.6 : 0;
    if (k > 0.95 && !GAME._blk) { GAME._blk = true; $('fxBlack').style.transition = 'opacity .25s'; $('fxBlack').style.opacity = 1; }
    if (k > 1.7) { GAME._blk = false; ONI.mouthT = 0; ONI.armsUp = 0; UI.over(); return false; }
    return true;
  });
};

/* ---------- its sounds, and the chase music ---------- */
SFX.oniStep = (pos, vol = 0.7) => { if (!AU.ok) return; AU.tone({ pos, f: 58, f2: 32, dur: 0.24, vol: vol * 0.95, rev: 0.35 }); AU.burst({ pos, dur: 0.11, f: 280, q: 0.7, type: 'lowpass', vol: vol * 0.65, brown: true, rev: 0.3 }); AU.burst({ pos, t0: AU.t + 0.03, dur: 0.05, f: 1400, q: 1, vol: vol * 0.08, rev: 0.2 }); };
SFX.oniBreath = pos => {
  if (!AU.ok) return;
  AU.burst({ pos, dur: 0.95, a: 0.35, f: 380, q: 1.2, vol: 0.34, brown: true, rev: 0.4, sweepTo: 240 });
  AU.tone({ pos, type: 'sawtooth', f: 52, f2: 46, dur: 0.85, a: 0.3, vol: 0.05, rev: 0.4, filter: 300 });
};
SFX.oniSpot = () => { if (!AU.ok) return; for (const f of [146.8, 155.6, 207.7]) AU.tone({ type: 'sawtooth', f, dur: 1.4, a: 0.005, vol: 0.09, filter: 1800, rev: 0.6 }); AU.burst({ dur: 0.5, f: 2400, q: 0.5, vol: 0.3, rev: 0.6 }); };
SFX.oniCatch = () => {
  if (!AU.ok) return;
  SFX.scream({ steps: [[0, 170], [0.12, 300], [0.6, 240], [1.1, 120]], formants: [[650, 3, 4], [1100, 3, 3], [2500, 4, 1.2]], hold: 1.1, vol: 1.1, rev: 0.35 });
  AU.burst({ dur: 1.0, a: 0.01, f: 1500, q: 0.4, vol: 0.7, rev: 0.4 }); AU.tone({ type: 'sawtooth', f: 66, f2: 36, dur: 1.0, vol: 0.4, filter: 600 });
  for (const f of [233, 247, 349, 370]) AU.tone({ type: 'sawtooth', f, dur: 1.3, a: 0.004, vol: 0.07, filter: 3000, rev: 0.5 });
};
SFX.bars = pos => { if (!AU.ok) return; AU.burst({ pos, dur: 0.1, f: 900, q: 3, vol: 0.6, rev: 0.5 }); for (const f of [180, 361, 543]) AU.tone({ pos, type: 'sine', f: f * (0.95 + Math.random() * 0.1), dur: 0.6, vol: 0.06, rev: 0.5 }); };
SFX.piano = (midi, vol = 0.32) => {
  if (!AU.ok) return;
  const f = NOTE(midi);
  [[1, 1], [2, 0.42], [3, 0.2], [4, 0.1]].forEach(([h, v], i) => AU.tone({ type: i ? 'sine' : 'triangle', f: f * h * (1 + i * 0.0007), dur: 1.6 / Math.sqrt(h), a: 0.003, vol: vol * v, rev: 0.45 }));
  AU.burst({ dur: 0.03, f: 2500, q: 0.7, vol: 0.05, rev: 0.2 });
};
SFX.chew = pos => { if (!AU.ok) return; const p = pos.clone().setY(pos.y + 1.2); AU.burst({ pos: p, dur: 0.16, a: 0.01, f: 420, q: 0.7, type: 'lowpass', vol: 0.6, brown: true, rev: 0.3 }); AU.burst({ pos: p, t0: AU.t + 0.05, dur: 0.05, f: 1900, q: 3, vol: 0.14, rev: 0.25 }); AU.tone({ pos: p, t0: AU.t + 0.02, f: 110, f2: 70, dur: 0.12, vol: 0.25 }); };
SFX.scream2 = pos => { if (!AU.ok) return; SFX.scream({ pos, steps: [[0, 700], [0.15, 1100], [0.7, 900], [1.2, 600]], formants: [[1000, 4, 3], [2400, 5, 2], [3300, 6, 1]], hold: 1.2, vol: 0.5, rev: 0.7 }); };
MUSIC_DEFS.aochase = {
  bpm: 150, div: 4,
  step(s, t, bus, spb) {
    const b = s % 16, bar = Math.floor(s / 16) % 4, r = [38, 38, 39, 37][bar];
    if (b % 2 === 0) mTone(bus, t, { type: 'triangle', f: NOTE(r + (b % 4 ? 12 : 0)), dur: spb * 1.8, vol: 0.2, lp: 900 });
    const fig = [0, 3, 7, 6, 3, 7, 12, 6][b % 8];
    mTone(bus, t, { type: 'triangle', f: NOTE(r + 36 + fig), dur: spb * 0.9, vol: 0.06, lp: 2600 });
    mTone(bus, t, { type: 'sine', f: NOTE(r + 48 + fig), dur: spb * 0.5, vol: 0.02 });
    if (b === 0 || b === 10) for (const n of [[62, 65, 69], [62, 65, 68], [63, 66, 70], [61, 64, 67]][bar]) for (const d of [-7, 7]) mTone(bus, t, { type: 'sawtooth', f: NOTE(n), detune: d, dur: spb * 5, a: 0.02, vol: 0.035, lp: 2200 });
    if (b % 4 === 0) mTone(bus, t, { f: 110, f2: 36, dur: 0.25, vol: 0.75 });
    if (b === 6 || b === 14) mNoise(bus, t, { dur: 0.12, f: 900, type: 'bandpass', q: 0.8, vol: 0.28 });
    if (b % 2 === 1) mNoise(bus, t, { dur: 0.025, f: 6500, vol: 0.06 });
    if (bar === 3 && b === 12) mTone(bus, t, { type: 'square', f: NOTE(86), f2: NOTE(74), dur: 0.35, vol: 0.035, lp: 3000 });
  },
};
