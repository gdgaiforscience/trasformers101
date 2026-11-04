"""b03_loss_landscape: a glowing ball rolls down a loss surface via gradient descent with momentum.

blender -b --factory-startup -P state_of_ai/src/blender/b03_loss_landscape.py -- [--res 640x360 --frames 1,180,360]

* Terrain = landscape.loss (bowl + Gaussian wells/hills: 1 global + 3 local minima).
* Height colormap DEEP -> BLUE -> TEAL -> YELLOW on a dark emissive surface with analytic Lambert
  shading and thin glowing contour lines whose on-screen width is slope-corrected (all emission,
  no lights). The far terrain recedes into the background colour; the rim fades out exactly.
* Ball path = numpy heavy-ball momentum (landscape.descend): it swings through a local-minimum
  basin, escapes on momentum, overshoots once and settles in the global minimum.
* An emissive trail appears behind the ball (fresh = hotter) with beads at every 6th iteration;
  the ball casts a soft light pool on the terrain.
* The camera orbits slowly, descends and ends close to the minimum.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402
import common as C  # noqa: E402
import landscape as LS  # noqa: E402

CLIP = 'b03_loss_landscape'
NF = 360                       # 12 s @ 30 fps
START_F = 26                   # ball starts rolling at ~0.9 s
FPI = 1.55                     # frames per gradient-descent iteration
HS = 0.78                      # height scale (world z per loss unit)
DOMAIN = 7.0
R_FADE0, R_FADE1 = 5.6, 6.8    # terrain fades into the background between these radii
BALL_R = 0.19
BEAD_EVERY = 6

args = C.parse_args()
scene = C.reset()
C.setup_render(scene, args, frame_end=NF, samples=16)
C.setup_world(scene)
C.setup_glare(scene, args, gtype='Bloom', quality='High', threshold=1.0, smoothness=0.2,
              strength=0.85, size=0.34, saturation=1.0)
BG_LIN = tuple(C.srgb2lin(v / 255.0) for v in C.BG_SRGB8) + (1.0,)


def frame_fade(nb):
    """1 inside the frame, 0 at the frame border: content dissolves into the exact BG colour."""
    wx, wy, _ = nb.sepxyz(nb.texcoord('Window'))
    fx = nb.mul(nb.smooth(0.0, 0.09, wx), nb.sub(1.0, nb.smooth(0.91, 1.0, wx)))
    fy = nb.mul(nb.smooth(0.0, 0.12, wy), nb.sub(1.0, nb.smooth(0.88, 1.0, wy)))
    return nb.mul(fx, fy)

xs = np.linspace(-6, 6, 241)
Xg, Yg = np.meshgrid(xs, xs)
Zg = LS.loss(Xg, Yg)
inside = (Xg ** 2 + Yg ** 2) < 6.0 ** 2
LMIN = float(Zg[inside].min())
LMAX = float(Zg[inside].max())
ZMAX = HS * (LMAX - LMIN)
C.log('loss range in view: %.3f..%.3f  ZMAX=%.2f' % (LMIN, LMAX, ZMAX))


def height(x, y):
    return HS * (LS.loss(x, y) - LMIN)


# ------------------------------------------------------------------ path (fractional iterations)
P = LS.descend()
iters = np.arange(len(P))


def path_at(f):
    """Ball (x, y) at frame f (float iteration index, linear interpolation)."""
    k = min(max((f - START_F) / FPI, 0.0), len(P) - 1.0)
    i = int(math.floor(k))
    j = min(i + 1, len(P) - 1)
    a = k - i
    return P[i] * (1 - a) + P[j] * a, k


path = np.array([path_at(f)[0] for f in range(1, NF + 1)])
zpath = height(path[:, 0], path[:, 1])
C.log('path start', path[0], 'end', path[-1], 'final iteration', path_at(NF)[1])

# ------------------------------------------------------------------ terrain
N = 300
gx = np.linspace(-DOMAIN, DOMAIN, N)
GX, GY = np.meshgrid(gx, gx)
GZ = height(GX, GY)
co = np.stack([GX.ravel(), GY.ravel(), GZ.ravel()], 1)
idx = (np.arange(N - 1)[:, None] * N + np.arange(N - 1)[None, :]).ravel()
quads = np.stack([idx, idx + 1, idx + 1 + N, idx + N], 1)
# drop quads entirely outside the faded disc
cx = (co[quads[:, 0], 0] + co[quads[:, 2], 0]) / 2
cy = (co[quads[:, 0], 1] + co[quads[:, 2], 1]) / 2
quads = quads[(cx ** 2 + cy ** 2) < (R_FADE1 + 0.15) ** 2]

m_ter = C.new_material('terrain')
nb = C.NB(m_ter)
pos = nb.geometry('Position')
px, py, pz = nb.sepxyz(pos)
nrm = nb.geometry('Normal')
nx_, ny_, nz_ = nb.sepxyz(nrm)
hn = nb.pw(nb.clamp01(nb.div(pz, ZMAX)), 1.35)                  # keep YELLOW for the peaks
stops = [(0.0, C.lin('DEEP')), (0.36, C.lin('BLUE')), (0.66, C.lin('TEAL')), (1.0, C.lin('YELLOW'))]
base = nb.ramp(hn, stops)
# Lambert from a fixed key direction + ambient
Ld = Vector((-0.5, 0.3, 0.81)).normalized()
lam = nb.mx(nb.vmath('DOT_PRODUCT', nrm, tuple(Ld)), 0.0)
shade = nb.add(0.20, nb.mul(lam, 0.45))
# slope-corrected contour lines: horizontal distance to the nearest iso-line
SP = ZMAX / 16.0
c = nb.math('FRACT', nb.div(pz, SP))
dz = nb.mul(nb.mn(c, nb.sub(1.0, c)), SP)
slope = nb.div(nb.math('SQRT', nb.mx(nb.sub(1.0, nb.mul(nz_, nz_)), 0.0)), nb.mx(nz_, 0.08))
dxy = nb.div(dz, nb.mx(slope, 0.02))
line = nb.sub(1.0, nb.smooth(0.006, 0.017, dxy))
line = nb.mul(line, nb.smooth(0.04, 0.12, slope))                 # no blobs on flat floors
# faint parameter grid (every 1 unit in x and y)
fx = nb.math('FRACT', px)
fy = nb.math('FRACT', py)
gxd = nb.mn(fx, nb.sub(1.0, fx))
gyd = nb.mn(fy, nb.sub(1.0, fy))
grid = nb.sub(1.0, nb.smooth(0.004, 0.013, nb.mn(gxd, gyd)))
col = nb.cmul(base, shade)
col = nb.cadd(col, nb.cmul(base, nb.mul(line, 0.70)))
col = nb.cadd(col, nb.cmul(base, nb.mul(grid, 0.12)))
# light pool around the ball (ball xy is keyframed into these Value nodes)
bx = nb.node('ShaderNodeValue', name='BallX')
by = nb.node('ShaderNodeValue', name='BallY')
ddx = nb.sub(px, bx.outputs[0])
ddy = nb.sub(py, by.outputs[0])
d2 = nb.add(nb.mul(ddx, ddx), nb.mul(ddy, ddy))
pool = nb.exp(nb.mul(d2, -1.0 / (2 * 0.45 ** 2)))
col = nb.cadd(col, nb.cmul(C.lin('ORANGE'), nb.mul(pool, 0.42)))
# recede into the background with distance, and fade out at the rim
fog = nb.mul(nb.smooth(10.0, 27.0, nb.camdist()), 0.80)
col = nb.mixc(fog, col, BG_LIN)
r = nb.math('SQRT', nb.add(nb.mul(px, px), nb.mul(py, py)))
fade = nb.mul(nb.sub(1.0, nb.smooth(R_FADE0, R_FADE1, r)), frame_fade(nb))
col = nb.mixc(fade, BG_LIN, col)
nb.emission_out(col, 1.0)

ter = C.mesh_object(scene, 'terrain', co.tolist(), quads.tolist(), mat=m_ter, smooth=True)

# ------------------------------------------------------------------ ball + halo
m_ball = C.new_material('ball')
nb = C.NB(m_ball)
lw = nb.node('ShaderNodeLayerWeight')
lw.inputs['Blend'].default_value = 0.5
facing = nb.sub(1.0, lw.outputs['Facing'])
e = nb.add(0.85, nb.mul(nb.mul(facing, facing), 1.9))
nb.emission_out(nb.cmul(C.lin('ORANGE'), e), 1.0)
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=BALL_R)
ball = bpy.context.active_object
ball.name = 'ball'
ball.data.materials.append(m_ball)
for poly in ball.data.polygons:
    poly.use_smooth = True

m_halo = C.new_material('halo', additive=True)
nb = C.NB(m_halo)
rr = nb.afloat('rr')
g = nb.exp(nb.mul(nb.mul(rr, rr), -9.0))
g = nb.mul(g, nb.sub(1.0, nb.smooth(0.8, 1.0, rr)))
nb.emission_out(nb.cmul(C.lin('ORANGE'), nb.mul(g, 0.38)), 1.0, additive=True)
acc = C.MeshAccum({'rr': 1})
acc.disc((0, 0, 0), (0, 0, 1), BALL_R * 3.6, 48, {'rr': lambda q: 0.0 if q == 0 else 1.0})
halo = acc.build(scene, 'halo', m_halo)
halo.parent = ball

# ------------------------------------------------------------------ trail + iteration beads
m_trail = C.new_material('trail', additive=True)
nb = C.NB(m_trail)
t = nb.time(offset=0.0)                 # t = frame number
tf = nb.afloat('tf')
age = nb.sub(t, tf)
vis = nb.math('GREATER_THAN', age, 0.0)
fresh = nb.exp(nb.mul(nb.mx(age, 0.0), -1.0 / 24.0))
inten = nb.add(0.75, nb.mul(fresh, 0.9))
tcol = nb.mixc(nb.mul(fresh, 0.6), C.lin4('ORANGE'), C.lin4('YELLOW'))
em = nb.node('ShaderNodeEmission')
nb._set(em.inputs['Color'], nb.cmul(tcol, inten))
tr = nb.node('ShaderNodeBsdfTransparent')
mix = nb.node('ShaderNodeMixShader')
nb._set(mix.inputs[0], nb.mul(vis, frame_fade(nb)))   # opaque emission where revealed
nb.nt.links.new(tr.outputs[0], mix.inputs[1])
nb.nt.links.new(em.outputs[0], mix.inputs[2])
nb.nt.links.new(mix.outputs[0], nb.out.inputs['Surface'])

TR, SIDES = 0.024, 8
f_dense = np.arange(START_F, NF + 1, 0.25)
pts, tfs = [], []
for f in f_dense:
    (x, y), k = path_at(f)
    p = Vector((x, y, float(height(x, y)) + 0.04))
    if not pts or (p - pts[-1]).length > 0.01:
        pts.append(p)
        tfs.append(float(f))
verts, faces, tf_attr = [], [], []
prev_u = None
for k, p in enumerate(pts):
    d = (pts[min(k + 1, len(pts) - 1)] - pts[max(k - 1, 0)]).normalized()
    u = C.basis_for(d)[0] if prev_u is None else (prev_u - d * prev_u.dot(d)).normalized()
    v = d.cross(u)
    prev_u = u
    for s in range(SIDES):
        a = 2 * math.pi * s / SIDES
        verts.append(tuple(p + (u * math.cos(a) + v * math.sin(a)) * TR))
        tf_attr.append(tfs[k])
    if k > 0:
        b0, b1 = (k - 1) * SIDES, k * SIDES
        for s in range(SIDES):
            faces.append((b0 + s, b0 + (s + 1) % SIDES, b1 + (s + 1) % SIDES, b1 + s))
C.mesh_object(scene, 'trail', verts, faces, {'tf': ('POINT', 'FLOAT', tf_attr)}, m_trail, smooth=True)

# beads: small glowing dots at every BEAD_EVERY-th iteration (discrete GD steps)
m_bead = C.new_material('bead', additive=True)
nb = C.NB(m_bead)
t = nb.time(offset=0.0)
age = nb.sub(t, nb.afloat('tf'))
vis = nb.math('GREATER_THAN', age, 0.0)
pop = nb.add(1.0, nb.mul(nb.exp(nb.mul(nb.mx(age, 0.0), -1.0 / 6.0)), 1.5))
rr = nb.afloat('rr')
prof = nb.sub(1.0, nb.smooth(0.55, 1.0, rr))
em = nb.node('ShaderNodeEmission')
nb._set(em.inputs['Color'], nb.cmul(C.lin('YELLOW'), nb.mul(pop, 0.9)))
tr = nb.node('ShaderNodeBsdfTransparent')
mix = nb.node('ShaderNodeMixShader')
nb._set(mix.inputs[0], nb.mul(nb.mul(vis, prof), frame_fade(nb)))
nb.nt.links.new(tr.outputs[0], mix.inputs[1])
nb.nt.links.new(em.outputs[0], mix.inputs[2])
nb.nt.links.new(mix.outputs[0], nb.out.inputs['Surface'])
acc = C.MeshAccum({'rr': 1, 'tf': 1})
n_settle = int((NF - START_F) / FPI)
for k in range(BEAD_EVERY, n_settle, BEAD_EVERY):
    if k >= len(P):
        break
    if k > 1 and np.linalg.norm(P[k] - P[k - BEAD_EVERY]) < 0.06:
        continue                                     # skip beads once the ball has settled
    x, y = P[k]
    p = Vector((x, y, float(height(x, y)) + 0.05))
    acc.disc(p, (0, 0, 1), 0.055, 16, {'rr': lambda q: 0.0 if q == 0 else 1.0, 'tf': START_F + k * FPI})
beads = acc.build(scene, 'beads', m_bead)

# ------------------------------------------------------------------ camera
cam = C.add_camera(scene, (0, -15, 9), (0, 0, 0), lens=35.0)
tgt = bpy.data.objects.new('CamTarget', None)
scene.collection.objects.link(tgt)
con = cam.constraints.new('TRACK_TO')
con.target = tgt
con.track_axis = 'TRACK_NEGATIVE_Z'
con.up_axis = 'UP_Y'

GM = path[-1]
GMZ = float(height(GM[0], GM[1]))


def ease(s):
    s = min(max(s, 0.0), 1.0)
    return s * s * s * (s * (6 * s - 15) + 10)


AZ0, AZ1 = math.radians(-100), math.radians(-74)
EL0, EL1 = math.radians(52), math.radians(45)
D0, D1 = 19.5, 9.2
T0 = Vector((-0.5, 0.5, 0.8))
T1 = Vector((GM[0] - 0.5, GM[1] + 0.5, GMZ + 0.25))
bxs = m_ter.node_tree.nodes['BallX'].outputs[0]
bys = m_ter.node_tree.nodes['BallY'].outputs[0]
for f in range(1, NF + 1):
    s = (f - 1) / (NF - 1)
    sc = ease(s)
    az = AZ0 + (AZ1 - AZ0) * ease(s)
    el = EL0 + (EL1 - EL0) * sc
    dist = D0 + (D1 - D0) * sc
    tg = T0.lerp(T1, sc)
    cam.location = tg + dist * Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    cam.keyframe_insert('location', frame=f)
    tgt.location = tg
    tgt.keyframe_insert('location', frame=f)
    x, y = path[f - 1]
    ball.location = (x, y, zpath[f - 1] + BALL_R * 0.92)
    ball.keyframe_insert('location', frame=f)
    bxs.default_value = x
    bxs.keyframe_insert('default_value', frame=f)
    bys.default_value = y
    bys.keyframe_insert('default_value', frame=f)

hc = halo.constraints.new('TRACK_TO')       # the halo disc (normal +Z) always faces the camera
hc.target = cam
hc.track_axis = 'TRACK_Z'
hc.up_axis = 'UP_Y'

# line-of-sight check: clearance of the camera->ball segment above the terrain
worst = []
for f in range(1, NF + 1, 10):
    scene.frame_set(f)
    a = np.array(cam.matrix_world.translation)
    b = np.array(ball.matrix_world.translation)
    s = np.linspace(0.02, 0.97, 200)[:, None]
    q = a[None, :] * (1 - s) + b[None, :] * s
    clear = q[:, 2] - height(q[:, 0], q[:, 1])
    worst.append((float(clear.min()), f))
worst.sort()
C.log('line-of-sight min clearance (worst 4):', ['f%d: %.2f' % (f, c) for c, f in worst[:4]])
scene.frame_set(NF)
C.log('ball on screen at end:', ['%.3f' % v for v in C.project(scene, cam, [ball.matrix_world.translation])[0][:2]])

frames = C.frame_list(args, 1, NF)
C.finish(scene, args, CLIP, frames)
