"""b04_chip: stylised TPU-like chip, systolic-array matrix unit with diagonal data waves (8 s loop).

blender -b --factory-startup -P state_of_ai/src/blender/b04_chip.py -- [--res 640x360 --frames 1,60]

Weight-stationary systolic array (like a TPU MXU), N x N multiply-accumulate cells:
* activations (BLUE) enter each row from the left, skewed by one hop per row, and hop right;
* partial sums (ORANGE) hop down each column;
* cell (i, j) fires when both meet, at t = (i + j) * HOP  ->  diagonal wavefronts.
A new wave starts every PERIOD frames; T = 240 = 6 * PERIOD, so the loop is seamless.
Substrate traces carry flowing dashes: inputs (BLUE, left) and weights (YELLOW, top) flow in,
results (ORANGE, bottom) flow out. Everything is shader-driven from t = frame - 1.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402
import common as C  # noqa: E402

CLIP = 'b04_chip'
T = 240
N = 10                       # array size
HOP = 6                      # frames per cell hop
PERIOD = 60                  # frames between waves (= N * HOP: one pulse per row in flight)
PITCH = 0.62
CELL = 0.44
SUB = 13.0                   # substrate size
DIE = 7.4                    # die size
Z_SUB, Z_DIE = 0.30, 0.52    # top surfaces

args = C.parse_args()
scene = C.reset()
C.setup_render(scene, args, frame_end=T, samples=16)
C.setup_world(scene)
C.setup_glare(scene, args, gtype='Bloom', quality='High', threshold=0.95, smoothness=0.25,
              strength=0.9, size=0.32, saturation=1.0)
rng = random.Random(4)
BG_LIN = tuple(C.srgb2lin(v / 255.0) for v in C.BG_SRGB8)


def box(acc, c, size, attrs):
    """Axis-aligned box as 6 quads; attrs values may be callables f(i)."""
    cx, cy, cz = c
    sx, sy, sz = (s / 2 for s in size)
    v = [(cx + dx * sx, cy + dy * sy, cz + dz * sz) for dz in (-1, 1) for dy in (-1, 1) for dx in (-1, 1)]
    f = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    acc._push(v, f, attrs)


def quad(acc, pts, attrs):
    acc._push(pts, [(0, 1, 2, 3)], attrs)


def strip(acc, pts2d, z, w, attrs_fn):
    """Flat strip along a 2D polyline at height z; attrs_fn(s) -> dict per vertex (s = arc length)."""
    s = 0.0
    prev = None
    for a, b in zip(pts2d[:-1], pts2d[1:]):
        a, b = Vector((a[0], a[1], z)), Vector((b[0], b[1], z))
        d = (b - a)
        L = d.length
        n = Vector((-d.y, d.x, 0)).normalized() * (w / 2)
        p = [a - n, a + n, b + n, b - n]
        sv = [s, s, s + L, s + L]
        acc._push(p, [(0, 1, 2, 3)], {k: (lambda q, sv=sv, k=k: attrs_fn(sv[q])[k]) for k in acc.specs})
        s += L
    return s


# ------------------------------------------------------------------ materials
def emissive(name, build, additive=False):
    m = C.new_material(name, additive=additive)
    nb = C.NB(m)
    col = build(nb)
    nb.emission_out(col, 1.0, additive=additive)
    return m


# substrate: dark plate with a faint grid and a thin glowing rim
def b_sub(nb):
    pos = nb.geometry('Position')
    px, py, pz = nb.sepxyz(pos)
    g = []
    for q in (px, py):
        f = nb.math('FRACT', nb.div(q, 0.5))
        g.append(nb.mn(f, nb.sub(1.0, f)))
    grid = nb.sub(1.0, nb.smooth(0.02, 0.06, nb.mn(g[0], g[1])))
    rim_d = nb.sub(SUB / 2, nb.mx(nb.absv(px), nb.absv(py)))
    rim = nb.sub(1.0, nb.smooth(0.03, 0.09, rim_d))
    top = nb.smooth(Z_SUB - 0.02, Z_SUB - 0.005, pz)
    base = nb.cmul(C.lin('ZERO'), 1.0)
    col = nb.cadd(base, nb.cmul(C.lin('GRID'), nb.mul(grid, nb.mul(top, 0.55))))
    col = nb.cadd(col, nb.cmul(C.lin('MUTED'), nb.mul(rim, 0.55)))
    return col


m_sub = emissive('substrate', b_sub)


# die: slightly lighter slab with a TEAL edge glow
def b_die(nb):
    pos = nb.geometry('Position')
    px, py, pz = nb.sepxyz(pos)
    rim_d = nb.sub(DIE / 2, nb.mx(nb.absv(px), nb.absv(py)))
    rim = nb.sub(1.0, nb.smooth(0.03, 0.08, rim_d))
    top = nb.smooth(Z_DIE - 0.02, Z_DIE - 0.005, pz)
    col = nb.cmul(C.lin('#161a22'), 1.0)
    col = nb.cadd(col, nb.cmul(C.lin('TEAL'), nb.mul(rim, nb.add(0.25, nb.mul(top, 0.6)))))
    return col


m_die = emissive('die', b_die)


# MAC cells: outline + fill; flash when the wavefront passes
def b_cell(nb):
    t = nb.time()
    u, v, _ = nb.sepxyz(nb.avec('uv'))
    i, j, w = nb.sepxyz(nb.avec('ij'))
    edge = nb.smooth(0.74, 0.88, nb.mx(nb.absv(u), nb.absv(v)))
    tau = nb.mul(nb.add(i, j), float(HOP))
    d = nb.fmod(nb.sub(t, tau), float(PERIOD))
    flash = nb.mul(nb.sub(1.0, nb.exp(nb.mul(d, -1.0 / 1.2))), nb.exp(nb.mul(d, -1.0 / 5.0)))
    flash = nb.mul(flash, 1.45)
    hot = C.mix_hex('YELLOW', '#FFFFFF', 0.35)
    fill = nb.cadd(nb.cmul(C.lin('YELLOW'), nb.add(0.02, nb.mul(w, 0.05))), nb.cmul(hot, nb.mul(flash, 1.3)))
    outline = nb.cadd(nb.cmul(C.lin('YELLOW'), nb.add(0.16, nb.mul(w, 0.12))), nb.cmul(hot, nb.mul(flash, 1.2)))
    return nb.mixc(edge, fill, outline)


m_cell = emissive('cell', b_cell)


# array wires: activation pulses (rows, BLUE) and partial sums (columns, ORANGE)
def b_wire(nb):
    t = nb.time()
    x = nb.afloat('x')                   # position along the wire in cell units (cell k centre at k)
    lane = nb.afloat('lane')             # row index (activations) or column index (partial sums)
    col = nb.acolor('col')
    xp = nb.sub(nb.div(nb.fmod(nb.add(nb.sub(t, nb.mul(lane, float(HOP))), float(HOP)), float(PERIOD)), float(HOP)), 1.0)
    dx = nb.sub(x, xp)
    blob = nb.exp(nb.mul(nb.mul(dx, dx), -1.0 / (0.22 ** 2)))
    trail = nb.mul(nb.exp(nb.mul(nb.mx(nb.mul(dx, -1.0), 0.0), -1.0 / 0.55)), nb.math('LESS_THAN', dx, 0.0))
    inten = nb.add(blob, nb.mul(trail, 0.35))
    inten = nb.mul(inten, nb.smooth(-1.05, -0.55, xp))          # fade in at the array entrance
    return nb.cadd(nb.cmul(col, 0.12), nb.cmul(col, nb.mul(inten, 3.0)))


m_wire = emissive('wire', b_wire, additive=True)


# substrate traces: flowing dashes, periodic in T
def b_trace(nb):
    t = nb.time()
    s = nb.afloat('s')
    col = nb.acolor('col')
    dirn = nb.afloat('dir')              # +1 flows outward (away from the die), -1 inward, 0 static
    phase = nb.sub(nb.div(s, 1.25), nb.mul(nb.mul(t, dirn), 8.0 / T))
    f = nb.math('FRACT', phase)
    dash = nb.mul(nb.smooth(0.0, 0.08, f), nb.sub(1.0, nb.smooth(0.08, 0.32, f)))
    dash = nb.mul(dash, nb.absv(dirn))
    return nb.cadd(nb.cmul(col, 0.16), nb.cmul(col, nb.mul(dash, 1.6)))


m_trace = emissive('trace', b_trace, additive=True)

# ------------------------------------------------------------------ geometry
acc = C.MeshAccum({})
box(acc, (0, 0, Z_SUB / 2), (SUB, SUB, Z_SUB), {})
acc.build(scene, 'substrate', m_sub)
acc = C.MeshAccum({})
box(acc, (0, 0, (Z_SUB + Z_DIE) / 2), (DIE, DIE, Z_DIE - Z_SUB), {})
acc.build(scene, 'die', m_die)


def cell_xy(i, j):
    return (j - (N - 1) / 2) * PITCH, ((N - 1) / 2 - i) * PITCH


acc = C.MeshAccum({'uv': 3, 'ij': 3})
zc = Z_DIE + 0.045
h = CELL / 2
for i in range(N):
    for j in range(N):
        cx, cy = cell_xy(i, j)
        uvs = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
        w = rng.random()
        quad(acc, [(cx - h, cy - h, zc), (cx + h, cy - h, zc), (cx + h, cy + h, zc), (cx - h, cy + h, zc)],
             {'uv': lambda q, uvs=uvs: uvs[q], 'ij': (float(i), float(j), w)})
acc.build(scene, 'cells', m_cell)

acc = C.MeshAccum({'x': 1, 'lane': 1, 'col': 4})
zw = Z_DIE + 0.02
WW = 0.12
for i in range(N):                       # activation rows
    x0, y = cell_xy(i, 0)
    xa, xb = -1.6, N - 1 + 0.45
    pts = [(x0 + xa * PITCH, y - WW / 2, zw), (x0 + xb * PITCH, y - WW / 2, zw),
           (x0 + xb * PITCH, y + WW / 2, zw), (x0 + xa * PITCH, y + WW / 2, zw)]
    xs = [xa, xb, xb, xa]
    quad(acc, pts, {'x': lambda q, xs=xs: xs[q], 'lane': float(i), 'col': C.lin4('BLUE')})
for j in range(N):                       # partial-sum columns
    x, y0 = cell_xy(0, j)
    ya, yb = -1.6, N - 1 + 1.6
    pts = [(x - WW / 2, y0 - ya * PITCH, zw), (x + WW / 2, y0 - ya * PITCH, zw),
           (x + WW / 2, y0 - yb * PITCH, zw), (x - WW / 2, y0 - yb * PITCH, zw)]
    ys = [ya, ya, yb, yb]
    quad(acc, pts, {'x': lambda q, ys=ys: ys[q], 'lane': float(j), 'col': C.lin4('ORANGE')})
acc.build(scene, 'wires', m_wire)

# substrate traces with 45-degree fan-out from the die edge to the substrate edge
acc = C.MeshAccum({'s': 1, 'col': 4, 'dir': 1})
zt = Z_SUB + 0.006
NT = 16
sides = [('left', 'BLUE', -1.0), ('top', 'YELLOW', -1.0), ('bottom', 'ORANGE', 1.0), ('right', 'MUTED', 0.0)]
for side, colname, dirn in sides:
    col = C.lin4(colname, 0.9 if colname != 'MUTED' else 0.5)
    for k in range(NT):
        a = (k - (NT - 1) / 2) * 0.34                 # pitch at the die edge
        b = (k - (NT - 1) / 2) * 0.70                 # pitch at the substrate edge
        r0, r1 = DIE / 2 + 0.05, DIE / 2 + 0.45
        r2 = r1 + abs(b - a)
        r3 = SUB / 2 - 0.25
        if r2 > r3:
            r2 = r3
        local = [(a, r0), (a, r1), (b, r2), (b, r3)]
        if side == 'left':
            pts = [(-r, u) for (u, r) in local]
        elif side == 'right':
            pts = [(r, u) for (u, r) in local]
        elif side == 'top':
            pts = [(u, r) for (u, r) in local]
        else:
            pts = [(u, -r) for (u, r) in local]
        off = rng.uniform(0, 1.25)
        strip(acc, pts, zt, 0.075, lambda s, col=col, dirn=dirn, off=off: {'s': s + off, 'col': col, 'dir': dirn})
acc.build(scene, 'traces', m_trace)

# ------------------------------------------------------------------ camera (gentle periodic sway)
TARGET = Vector((0.0, -0.3, 0.3))
cam = C.add_camera(scene, (0, -20, 18), TARGET, lens=50.0)
tgt = bpy.data.objects.new('CamTarget', None)
scene.collection.objects.link(tgt)
tgt.location = TARGET
con = cam.constraints.new('TRACK_TO')
con.target = tgt
con.track_axis = 'TRACK_NEGATIVE_Z'
con.up_axis = 'UP_Y'
AZ, EL, DIST = math.radians(-62), math.radians(44), 21.0
for f in range(1, T + 2):
    ph = 2 * math.pi * (f - 1) / T
    az = AZ + math.radians(3.0) * math.sin(ph)
    el = EL + math.radians(1.5) * math.sin(2 * ph)
    cam.location = TARGET + DIST * Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    cam.keyframe_insert('location', frame=f)
scene.frame_set(1)
corners = [Vector((sx * SUB / 2, sy * SUB / 2, z)) for sx in (-1, 1) for sy in (-1, 1) for z in (0, Z_SUB)]
lens, sx, sy = C.fit_camera(scene, cam, corners, (0.16, 0.84, 0.07, 0.93))
C.log('fit lens=%.1f shift=(%.3f, %.3f)' % (lens, sx, sy))

frames = C.frame_list(args, 1, T)
C.finish(scene, args, CLIP, frames)
