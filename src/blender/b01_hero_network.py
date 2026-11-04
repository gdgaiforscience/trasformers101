"""b01_hero_network: seamless 8 s loop of a glowing deep network (title-slide background).

blender -b --factory-startup -P state_of_ai/src/blender/b01_hero_network.py -- [--res 640x360 --frames 1,60]

Design
* 7 layers x 8-12 nodes. Nodes are camera-facing discs with a bright ring (3Blue1Brown neurons)
  whose fill lights up when a pulse arrives.
* Thin, dim connection tubes (gradient BLUE -> PURPLE -> ORANGE by layer); per-edge brightness
  from random "weights".
* Bright comet pulses run left -> right in cascades (a forward pass) along strong edges.
* All animation lives in the shaders as functions of t = frame-1 with period T = 240 frames,
  via per-vertex attributes (start times), so the loop is exactly seamless (frame 241 == frame 1).
* The camera sways on a closed periodic path; the left ~35% of frame is kept dark for the title.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402
import common as C  # noqa: E402

CLIP = 'b01_hero_network'
T = 240                       # loop length in frames (8 s @ 30 fps)
HOP = 17                      # frames for a pulse to cross one edge
DELAY = 4                     # node latency before re-emitting
COUNTS = [8, 10, 12, 12, 12, 10, 8]
L = len(COUNTS)
DX = 2.05                     # layer spacing
DZ = 0.80                     # node spacing within a layer
R_NODE = 0.19                 # node disc radius
R_EDGE = 0.0068
R_PULSE = 0.021
LAYER_COLS = ['BLUE', 'PURPLE', 'PINK', 'ORANGE']   # PINK keeps the PURPLE->ORANGE drift saturated

args = C.parse_args()
scene = C.reset()
C.setup_render(scene, args, frame_end=T, samples=16)
C.setup_world(scene)
C.setup_glare(scene, args, gtype='Bloom', quality='High', threshold=0.9, smoothness=0.25,
              strength=1.1, size=0.38, saturation=1.0)

rng = random.Random(20261029)


def layer_color(l):
    """Layer colour drifting BLUE -> PURPLE -> ORANGE, partially luminance-balanced."""
    c = C.ramp_hex([C.PAL[k] for k in LAYER_COLS], l / (L - 1))
    y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    k = (0.45 / y) ** 0.5
    return tuple(v * k for v in c)


# ------------------------------------------------------------------ layout
nodes = {}   # (l, i) -> Vector
for l, n in enumerate(COUNTS):
    x = (l - (L - 1) / 2) * DX
    for i in range(n):
        z = (i - (n - 1) / 2) * DZ
        y = 0.3 * math.cos(math.pi * (i - (n - 1) / 2) / 14.0) - 0.3   # slight curvature
        nodes[(l, i)] = Vector((x, y, z))

TARGET = Vector((1.6, 0.0, -0.05))
CAM_DIST = 12.5
YAW = math.radians(38.0)      # camera sits to the right: output layer is nearer the viewer
PITCH = math.radians(8.0)
CAM_BASE = TARGET + CAM_DIST * Vector((math.sin(YAW) * math.cos(PITCH), -math.cos(YAW) * math.cos(PITCH),
                                       math.sin(PITCH)))
cam = C.add_camera(scene, CAM_BASE, TARGET, lens=50.0)
FIT_BOX = (0.41, 0.93, 0.07, 0.93)   # keep the left ~40% for the title

# periodic sway (closed loop) with a track-to target
tgt = bpy.data.objects.new('CamTarget', None)
scene.collection.objects.link(tgt)
tgt.location = TARGET
con = cam.constraints.new('TRACK_TO')
con.target = tgt
con.track_axis = 'TRACK_NEGATIVE_Z'
con.up_axis = 'UP_Y'
for f in range(1, T + 2):
    ph = 2 * math.pi * (f - 1) / T
    cam.location = CAM_BASE + Vector((0.55 * math.sin(ph), 0.25 * math.sin(ph + 1.1), 0.22 * math.sin(2 * ph)))
    cam.keyframe_insert('location', frame=f)

# ------------------------------------------------------------------ weights & cascades
W = {}       # (l, i, j) -> weight
for l in range(L - 1):
    for i in range(COUNTS[l]):
        for j in range(COUNTS[l + 1]):
            W[(l, i, j)] = rng.gauss(0.0, 1.0)

arrivals = {k: [] for k in nodes}
pulses = []  # (l, i, j, t0)


def circ_dist(a, b):
    return abs((a - b + T / 2) % T - T / 2)


def can_take(key, ta):
    lst = arrivals[key]
    return len(lst) < 3 and all(circ_dist(ta, a) > 34 for a in lst)


N_CASCADES = 10
WIDTH_CAP = [2, 3, 3, 3, 3, 2]
for c in range(N_CASCADES):
    ts = (c * T / N_CASCADES + rng.uniform(-4, 4)) % T
    cands = [i for i in range(COUNTS[0]) if can_take((0, i), ts)]
    if not cands:
        continue
    i0 = rng.choice(cands)
    arrivals[(0, i0)].append(ts)
    active = [(i0, ts)]
    for l in range(L - 1):
        nxt = {}
        for (i, t) in active:
            k = rng.choice([1, 2, 2])
            js = list(range(COUNTS[l + 1]))
            js.sort(key=lambda j: -abs(W[(l, i, j)]) * rng.uniform(0.35, 1.0))
            taken = 0
            for j in js:
                if taken >= k:
                    break
                t0 = t + DELAY + rng.uniform(0, 3.5)
                ta = t0 + HOP
                if j not in nxt:
                    if len(nxt) >= WIDTH_CAP[l] or not can_take((l + 1, j), ta % T):
                        continue
                    nxt[j] = ta
                else:
                    nxt[j] = min(nxt[j], ta)
                pulses.append((l, i, j, t0 % T))
                taken += 1
        for j, ta in nxt.items():
            arrivals[(l + 1, j)].append(ta % T)
        active = list(nxt.items())
        if not active:
            break
C.log('pulses:', len(pulses), 'arrivals/node max:', max(len(v) for v in arrivals.values()))

# camera-facing normal for billboards (use the base camera position)
def facing(p):
    return (CAM_BASE - p).normalized()


# ------------------------------------------------------------------ materials
# common pieces: time, left-calm mask, depth fade
def scene_mask(nb, x0=0.30, x1=0.46, floor=0.0):
    win = nb.texcoord('Window')
    wx, wy, _ = nb.sepxyz(win)
    m = nb.smooth(x0, x1, wx)
    if floor:
        m = nb.add(floor, nb.mul(m, 1.0 - floor))
    return m


def depth_fade(nb, near=10.5, far=19.5, lo=0.42):
    return nb.maprange(nb.camdist(), near, far, 1.0, lo)


# edges: dim additive lines
m_edge = C.new_material('edge', additive=True)
nb = C.NB(m_edge)
k = nb.mul(nb.afloat('w'), nb.mul(depth_fade(nb), scene_mask(nb, 0.26, 0.44, 0.15)))
nb.emission_out(nb.cmul(nb.acolor('col'), nb.mul(k, 0.30)), 1.0, additive=True)

# pulses: comet with a hot head and a short soft tail, period T
m_pulse = C.new_material('pulse', additive=True)
nb = C.NB(m_pulse)
t = nb.time()
dt = nb.fmod(nb.sub(t, nb.afloat('t0')), float(T))
h = nb.div(dt, float(HOP))                 # head position along the edge (0..1 while travelling)
x = nb.sub(h, nb.afloat('u'))              # distance behind the head
xp = nb.mx(x, 0.0)
tail = nb.exp(nb.mul(xp, -1.0 / 0.085))
head = nb.exp(nb.mul(nb.mul(xp, xp), -1.0 / (0.028 ** 2)))
ahead = nb.clamp01(nb.add(1.0, nb.mul(x, 45.0)))
fade_out = nb.sub(1.0, nb.smooth(1.0, 1.35, h))    # the tail dies once the head has arrived
inten = nb.mul(nb.mul(nb.add(nb.mul(tail, 0.7), nb.mul(head, 0.95)), ahead), fade_out)
core = nb.mul(inten, nb.mul(depth_fade(nb, lo=0.55), scene_mask(nb, 0.30, 0.44, 0.2)))
nb.emission_out(nb.cmul(nb.acolor('col'), nb.mul(core, 3.0)), 1.0, additive=True)

# nodes: opaque disc with ring; fill lights up on arrivals
m_node = C.new_material('node')
nb = C.NB(m_node)
t = nb.time()
rr = nb.afloat('rr')
A = nb.avec('arr')
Wt = nb.avec('arw')
ax, ay, az = nb.sepxyz(A)
wx_, wy_, wz_ = nb.sepxyz(Wt)
act = None
for a_k, w_k in ((ax, wx_), (ay, wy_), (az, wz_)):
    d = nb.fmod(nb.sub(t, nb.sub(a_k, 1.0)), float(T))   # flash starts 1 frame before arrival
    f = nb.mul(nb.sub(1.0, nb.exp(nb.mul(d, -1.0 / 1.3))), nb.exp(nb.mul(d, -1.0 / 24.0)))
    f = nb.mul(f, nb.mul(w_k, 1.25))
    act = f if act is None else nb.add(act, f)
P = nb.avec('ph')
phase, kfreq, _ = nb.sepxyz(P)
breath = nb.add(0.5, nb.mul(0.5, nb.sin(nb.add(nb.mul(t, nb.mul(kfreq, 2 * math.pi / T)), phase))))
ring = nb.mul(nb.smooth(0.79, 0.85, rr), nb.sub(1.0, nb.smooth(0.95, 1.0, rr)))
profile = nb.maprange(rr, 0.0, 0.8, 1.0, 0.55)
fill = nb.mul(nb.add(0.012, nb.mul(act, 1.5)), profile)
ring_i = nb.add(nb.add(0.70, nb.mul(breath, 0.22)), nb.mul(act, 1.6))
e = nb.add(nb.mul(ring, ring_i), nb.mul(nb.sub(1.0, ring), fill))
e = nb.mul(e, nb.mul(depth_fade(nb, lo=0.5), scene_mask(nb, 0.28, 0.44, 0.25)))
nb.emission_out(nb.cmul(nb.acolor('col'), e), 1.0)

# dust: faint additive specks for depth
m_dust = C.new_material('dust', additive=True)
nb = C.NB(m_dust)
t = nb.time()
P = nb.avec('ph')
phase, kfreq, base = nb.sepxyz(P)
tw = nb.add(0.55, nb.mul(0.45, nb.sin(nb.add(nb.mul(t, nb.mul(kfreq, 2 * math.pi / T)), phase))))
soft = nb.sub(1.0, nb.smooth(0.2, 1.0, nb.afloat('rr')))
e = nb.mul(nb.mul(base, tw), nb.mul(soft, scene_mask(nb, 0.2, 0.5, 0.25)))
nb.emission_out(nb.cmul(nb.acolor('col'), e), 1.0, additive=True)

# ------------------------------------------------------------------ geometry
# nodes
acc = C.MeshAccum({'rr': 1, 'col': 4, 'arr': 3, 'arw': 3, 'ph': 3})
for (l, i), p in nodes.items():
    arr = arrivals[(l, i)][:3]
    a = arr + [0.0] * (3 - len(arr))
    w = [1.0] * len(arr) + [0.0] * (3 - len(arr))
    col = layer_color(l) + (1.0,)
    ph = (rng.uniform(0, 2 * math.pi), float(rng.choice([1, 2])), 0.0)
    acc.disc(p, facing(p), R_NODE, 40, {'rr': lambda q: 0.0 if q == 0 else 1.0, 'col': col,
                                        'arr': tuple(a), 'arw': tuple(w), 'ph': ph})
acc.build(scene, 'nodes', m_node)

# edges (full connectivity, brightness from |w|)
acc = C.MeshAccum({'col': 4, 'w': 1})
for (l, i, j), wv in W.items():
    p0, p1 = nodes[(l, i)], nodes[(l + 1, j)]
    d = (p1 - p0).normalized()
    a0, a1 = p0 + d * R_NODE * 1.02, p1 - d * R_NODE * 1.02
    b = 0.12 + 0.88 * min(1.0, (abs(wv) / 2.2) ** 1.6)
    c0, c1 = layer_color(l) + (1.0,), layer_color(l + 1) + (1.0,)
    acc.tube(a0, a1, R_EDGE, 5, {'col': lambda q, c0=c0, c1=c1: c0 if q < 5 else c1, 'w': b})
acc.build(scene, 'edges', m_edge)

# pulses
acc = C.MeshAccum({'col': 4, 'u': 1, 't0': 1})
for (l, i, j, t0) in pulses:
    p0, p1 = nodes[(l, i)], nodes[(l + 1, j)]
    d = (p1 - p0).normalized()
    a0, a1 = p0 + d * R_NODE * 1.02, p1 - d * R_NODE * 1.02
    c0, c1 = layer_color(l) + (1.0,), layer_color(l + 1) + (1.0,)
    acc.tube(a0, a1, R_PULSE, 8, {'col': lambda q, c0=c0, c1=c1: c0 if q < 8 else c1,
                                  'u': lambda q: 0.0 if q < 8 else 1.0, 't0': t0})
acc.build(scene, 'pulses', m_pulse)

# dust
acc = C.MeshAccum({'rr': 1, 'col': 4, 'ph': 3})
dust_cols = [C.lin('BLUE'), C.lin('PURPLE'), C.lin('MUTED'), C.lin('ORANGE')]
for n in range(260):
    p = Vector((rng.uniform(-16, 18), rng.uniform(-3, 26), rng.uniform(-9, 9)))
    if (p - CAM_BASE).length < 6:
        continue
    col = rng.choice(dust_cols) + (1.0,)
    ph = (rng.uniform(0, 2 * math.pi), float(rng.choice([1, 2, 3])), rng.uniform(0.05, 0.35))
    acc.disc(p, facing(p), rng.uniform(0.02, 0.05), 10, {'rr': lambda q: 0.0 if q == 0 else 1.0,
                                                         'col': col, 'ph': ph})
acc.build(scene, 'dust', m_dust)

# ------------------------------------------------------------------ composition check
scene.frame_set(1)
pts = []
for p in nodes.values():
    pts += [p + Vector((0, 0, R_NODE)), p - Vector((0, 0, R_NODE)), p + Vector((R_NODE, 0, 0)), p - Vector((R_NODE, 0, 0))]
lens, sx, sy = C.fit_camera(scene, cam, pts, FIT_BOX)
C.log('fit: lens=%.2f shift=(%.3f, %.3f)' % (lens, sx, sy))
for l in range(L):
    top, bot = nodes[(l, COUNTS[l] - 1)], nodes[(l, 0)]
    (xt, yt, _), (xb, yb, _) = C.project(scene, cam, [top, bot])
    C.log('layer %d: x=%.3f..%.3f  y=%.3f..%.3f' % (l, xb, xt, yb, yt))

frames = C.frame_list(args, 1, T)
C.finish(scene, args, CLIP, frames)
