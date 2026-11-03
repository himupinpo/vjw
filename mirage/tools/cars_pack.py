"""Pack Quaternius 'Cars Pack' (CC0) OBJ+MTL files into one small binary bundle for ミラージュ・シティ.
cars.json: { models: { Name: { slots: [material names], kd: {name: [r,g,b]}, parts: { body|back|fl|fr: {pos:[off,n], slot:[off,n], idx:[off,n]} } } } }
cars.bin : Float32 positions (xyz), Uint8 slot per vertex, Uint16 triangle indices, each block 4-byte aligned."""
import sys, os, json, struct
SRC, OUT = sys.argv[1], sys.argv[2]
NAMES = ['NormalCar1', 'NormalCar2', 'SUV', 'SportsCar', 'SportsCar2', 'Taxi', 'Cop']
blob = bytearray(); index = {'models': {}, 'license': 'CC0 1.0 (Quaternius, Cars Pack)'}
def put(b):
    while len(blob) % 4: blob.append(0)
    off = len(blob); blob.extend(b); return off
def part_key(o):
    o = o.lower()
    return 'back' if 'backwheels' in o else 'fl' if 'frontleftwheel' in o else 'fr' if 'frontrightwheel' in o else 'body'
for name in NAMES:
    kd = {}; m = None
    for line in open(os.path.join(SRC, name + '.mtl'), encoding='utf-8', errors='strict'):
        p = line.split()
        if p and p[0] == 'newmtl': m = p[1]
        elif p and p[0] == 'Kd': kd[m] = [round(float(x), 4) for x in p[1:4]]
    V = []; parts = {}; cur = None; mat = None
    for line in open(os.path.join(SRC, name + '.obj'), encoding='utf-8', errors='strict'):
        p = line.split()
        if not p: continue
        if p[0] == 'v': V.append(tuple(float(x) for x in p[1:4]))
        elif p[0] == 'o': cur = part_key(p[1]); parts.setdefault(cur, {'map': {}, 'pos': [], 'slot': [], 'idx': []})
        elif p[0] == 'usemtl': mat = p[1]
        elif p[0] == 'f':
            P = parts[cur]; si = list(kd).index(mat)
            ids = []
            for t in p[1:]:
                vi = int(t.split('/')[0]); vi = vi - 1 if vi > 0 else len(V) + vi
                k = (vi, si)
                if k not in P['map']: P['map'][k] = len(P['pos']); P['pos'].append(V[vi]); P['slot'].append(si)
                ids.append(P['map'][k])
            for j in range(1, len(ids) - 1): P['idx'] += [ids[0], ids[j], ids[j + 1]]
    assert set(parts) == {'body', 'back', 'fl', 'fr'}, (name, set(parts))
    ent = {'slots': list(kd), 'kd': kd, 'parts': {}}
    for k, P in parts.items():
        n = len(P['pos']); assert n < 65536 and max(P['idx']) < n
        ent['parts'][k] = {'pos': [put(struct.pack('<%df' % (3 * n), *[c for v in P['pos'] for c in v])), n],
                           'slot': [put(bytes(P['slot'])), n],
                           'idx': [put(struct.pack('<%dH' % len(P['idx']), *P['idx'])), len(P['idx'])]}
    index['models'][name] = ent
    print(name, {k: (len(P['pos']), len(P['idx']) // 3) for k, P in parts.items()})
open(os.path.join(OUT, 'cars.bin'), 'wb').write(bytes(blob))
json.dump(index, open(os.path.join(OUT, 'cars.json'), 'w'), separators=(',', ':'))
print('bin bytes', len(blob), '| json bytes', os.path.getsize(os.path.join(OUT, 'cars.json')))
