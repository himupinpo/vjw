"""Pack Quaternius 'Ultimate Modular Men/Women' (CC0) glTF characters into one small bundle for ミラージュ・シティ.
humans.json: { chars: { key: { gender, mats: [[name, r, g, b]], bones: [[name, parent, tx,ty,tz, qx,qy,qz,qw, sx,sy,sz]], ibm: [off,n], pos/joint/weight/slot/idx: [off,n] } },
               clips: { M|W: { name: { dur, tracks: [[bone, 'q'|'p', tOff, n, vOff]] } } }, joints: [names] }
humans.bin : float32 / uint8 / uint16 / int16 blocks, 4-byte aligned. Positions are uint16 within 'box'. Normals are left out (flat shading)."""
import json, sys, os, base64, struct
SRC, OUT = sys.argv[1], sys.argv[2]
CHARS = [('M_Casual_2', 'M'), ('M_Casual_Hoodie', 'M'), ('M_Suit', 'M'), ('M_Worker', 'M'), ('M_Farmer', 'M'), ('M_Punk', 'M'), ('M_Beach', 'M'), ('M_Adventurer', 'M'), ('M_Swat', 'M'),
         ('W_Casual', 'W'), ('W_Formal', 'W'), ('W_Suit', 'W'), ('W_Worker', 'W'), ('W_Punk', 'W'), ('W_Adventurer', 'W'), ('W_Soldier', 'W')]
CLIP_SRC = {'M': 'M_Casual_2', 'W': 'W_Casual'}
CLIPS = ['Idle', 'Idle_Neutral', 'Walk', 'Run', 'Run_Shoot', 'Death', 'Idle_Gun_Pointing', 'Idle_Gun_Shoot', 'Gun_Shoot', 'Punch_Left', 'Punch_Right', 'HitRecieve', 'Wave']
FINGER = ('Index', 'Middle', 'Ring', 'Pinky', 'Thumb')
CT = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}; NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
blob = bytearray()
def put(fmt, vals):
    while len(blob) % 4: blob.append(0)
    off = len(blob); blob.extend(struct.pack('<%d%s' % (len(vals), fmt), *vals)); return [off, len(vals)]
def load(name):
    g = json.load(open(os.path.join(SRC, name + '.gltf'), encoding='utf-8'))
    bufs = []
    for b in g['buffers']:
        u = b['uri']; assert u.startswith('data:application/octet-stream;base64,'), u[:40]; bufs.append(base64.b64decode(u.split(',', 1)[1]))
    def acc(i):
        a = g['accessors'][i]; bv = g['bufferViews'][a['bufferView']]; n = NC[a['type']]; t = CT[a['componentType']]; sz = struct.calcsize(t)
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); stride = bv.get('byteStride', sz * n); b = bufs[bv['buffer']]
        out = [struct.unpack_from('<%d%s' % (n, t), b, off + k * stride) for k in range(a['count'])]
        if a.get('normalized'):
            m = {5121: 255.0, 5123: 65535.0, 5120: 127.0, 5122: 32767.0}[a['componentType']]; out = [tuple(v / m for v in o) for o in out]
        return out
    return g, acc
index = {'chars': {}, 'clips': {}, 'license': 'CC0 1.0 (Quaternius, Ultimate Modular Men / Women)'}
JNAMES = None
for key, gender in CHARS:
    g, acc = load(key); sk = g['skins'][0]; J = sk['joints']; N = g['nodes']
    names = [N[j]['name'] for j in J]
    if JNAMES is None: JNAMES = names; index['joints'] = names
    assert names == JNAMES, key
    parent = {}
    for i, n in enumerate(N):
        for c in n.get('children', []): parent[c] = i
    bones = []
    for j in J:
        n = N[j]; p = parent.get(j); pj = J.index(p) if p in J else -1
        t = n.get('translation', [0, 0, 0]); q = n.get('rotation', [0, 0, 0, 1]); s = n.get('scale', [1, 1, 1])
        bones.append([n['name'], pj] + [round(v, 6) for v in t + q + s])
    ibm = [v for m in acc(sk['inverseBindMatrices']) for v in m]
    mats = [[m.get('name', 'm%d' % i)] + [round(v, 4) for v in m.get('pbrMetallicRoughness', {}).get('baseColorFactor', [1, 1, 1, 1])[:3]] for i, m in enumerate(g['materials'])]
    weld = {}; P = []; JJ = []; WW = []; S = []; I = []
    for ni, n in enumerate(N):
        if 'mesh' not in n: continue
        assert n.get('skin') == 0 and not any(k in n for k in ('translation', 'rotation', 'scale', 'matrix')), (key, n.get('name'))
        for pr in g['meshes'][n['mesh']]['primitives']:
            A = pr['attributes']; pos = acc(A['POSITION']); jo = acc(A['JOINTS_0']); we = acc(A['WEIGHTS_0']); idx = [i[0] for i in acc(pr['indices'])]
            slot = pr.get('material', 0); remap = []
            for k in range(len(pos)):
                w = list(we[k]); s = sum(w) or 1; wq = [round(x / s * 255) for x in w]; d = 255 - sum(wq); wq[wq.index(max(wq))] += d
                kk = (tuple(round(c, 5) for c in pos[k]), tuple(jo[k]), tuple(wq), slot)
                if kk not in weld: weld[kk] = len(P); P.append(pos[k]); JJ.append(jo[k]); WW.append(wq); S.append(slot)
                remap.append(weld[kk])
            I += [remap[i] for i in idx]
    assert len(P) < 65536
    mn = [min(p[a] for p in P) for a in range(3)]; mx = [max(p[a] for p in P) for a in range(3)]
    ent = {'gender': gender, 'mats': mats, 'bones': bones, 'ibm': put('f', ibm),
           'box': [round(min(p[a] for p in P), 5) for a in range(3)] + [round(max(p[a] for p in P), 5) for a in range(3)],
           'pos': put('H', [round((p[a] - mn[a]) / (mx[a] - mn[a]) * 65535) for p in P for a in range(3)]), 'joint': put('B', [c for j in JJ for c in j]), 'weight': put('B', [c for w in WW for c in w]),
           'slot': put('B', S), 'idx': put('H', I)}
    index['chars'][key] = ent
    print(key, 'verts', len(P), 'tris', len(I) // 3, 'mats', [m[0] for m in mats])
for gender, src in CLIP_SRC.items():
    g, acc = load(src); sk = g['skins'][0]; J = sk['joints']; N = g['nodes']; out = {}
    for a in g['animations']:
        if a['name'] not in CLIPS: continue
        tracks = []; dur = 0
        for ch in a['channels']:
            node = ch['target']['node']; path = ch['target']['path']
            if node not in J or path not in ('rotation', 'translation'): continue
            bn = N[node]['name']
            if bn.startswith(FINGER) or bn.startswith('PT.'): continue
            s = a['samplers'][ch['sampler']]; assert s.get('interpolation', 'LINEAR') == 'LINEAR', s.get('interpolation')
            t = [v[0] for v in acc(s['input'])]; vals = acc(s['output']); dur = max(dur, t[-1])
            to = put('f', t)
            if path == 'rotation': vo = put('h', [max(-32767, min(32767, round(c * 32767))) for v in vals for c in v]); tracks.append([bn, 'q', to[0], len(t), vo[0]])
            else: vo = put('f', [c for v in vals for c in v]); tracks.append([bn, 'p', to[0], len(t), vo[0]])
        out[a['name']] = {'dur': round(dur, 4), 'tracks': tracks}
    missing = set(CLIPS) - set(out); assert not missing, missing
    index['clips'][gender] = out
    print('clips', gender, {k: (v['dur'], len(v['tracks'])) for k, v in out.items()})
open(os.path.join(OUT, 'humans.bin'), 'wb').write(bytes(blob))
json.dump(index, open(os.path.join(OUT, 'humans.json'), 'w'), separators=(',', ':'))
print('bin bytes', len(blob), '| json bytes', os.path.getsize(os.path.join(OUT, 'humans.json')))
