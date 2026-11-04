"""b02_tensor_ranks: scalar -> vector -> matrix -> RGB 3D tensor -> batch (4D), 13 s.

blender -b --factory-startup -P state_of_ai/src/blender/b02_tensor_ranks.py -- [--res 640x360 --frames 1,100,200]

Every cell is a glowing glass cube (bright edges, dim fill whose brightness is the cell's value).
New cells split off from their parent cell at each stage:
    1 cube -> row of 6 -> 6x6 sheet -> 3 sheets tinted R/G/B (an image) -> 4 such blocks.
The camera pulls back from a close, slightly angled view to a long-lens (near-isometric) view.
Writes assets/video/b02_tensor_ranks.cues.json with the stage start times.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402
import common as C  # noqa: E402

CLIP = 'b02_tensor_ranks'
FPS = 30
NF = 390                       # 13 s
S = 1.2                        # cell pitch (cube size 1)
SY = 2.0                       # channel pitch
GAP = 2.4
BX = 6 * S + GAP               # block pitch
SEED = (1, 1, 2, 2)            # (b, c, i, j) of the original scalar cell
F_STAGE = [1, 61, 136, 211, 286]          # stage start frames (t = 0, 2, 4.5, 7, 9.5 s)
DUR = 34                                  # transition length (frames)
STAGGER = 5                               # frames between successive copies
LABELS = ['Scalar: a single number (rank 0)', 'Vector: a list of numbers (rank 1)',
          'Matrix: a grid of numbers (rank 2)', '3D tensor: an RGB image, height \u00d7 width \u00d7 3 (rank 3)',
          'Batch: 4 images = a 4D tensor (rank 4)']

args = C.parse_args()
scene = C.reset()
C.setup_render(scene, args, frame_end=NF, samples=16)
C.setup_world(scene)
C.setup_glare(scene, args, gtype='Bloom', quality='High', threshold=1.0, smoothness=0.25,
              strength=0.8, size=0.35, saturation=1.0)


# ------------------------------------------------------------------ data: four tiny 6x6 RGB images
def image_value(b, c, i, j):
    """Smooth, image-like channel values in [0,1] (different picture per batch element)."""
    u, v = (j + 0.5) / 6.0, (i + 0.5) / 6.0
    if b == 0:      # sunset: warm top, dark bottom
        r, g, bl = 0.9 - 0.5 * v, 0.55 - 0.45 * v + 0.2 * u, 0.25 + 0.5 * v
    elif b == 1:    # landscape: sky over grass with a sun
        sun = math.exp(-((u - 0.72) ** 2 + (v - 0.25) ** 2) / 0.02)
        sky = 1.0 if v < 0.55 else 0.0
        r, g, bl = 0.25 + 0.7 * sun, 0.35 + 0.5 * (1 - sky) + 0.5 * sun, 0.9 * sky + 0.2
    elif b == 2:    # red disc on blue
        d = math.exp(-((u - 0.5) ** 2 + (v - 0.5) ** 2) / 0.05)
        r, g, bl = 0.15 + 0.85 * d, 0.2 + 0.2 * d, 0.75 - 0.55 * d
    else:           # diagonal stripes
        s = 0.5 + 0.5 * math.sin(7.0 * (u + v))
        r, g, bl = 0.3 + 0.6 * s, 0.8 - 0.5 * s, 0.4 + 0.3 * (1 - u)
    return min(1.0, max(0.0, (r, g, bl)[c]))


# ------------------------------------------------------------------ material
m_cube = C.new_material('cube')
nb = C.NB(m_cube)
oi = nb.node('ShaderNodeObjectInfo')
tint = oi.outputs['Color']
val = nb.afloat('val', 'OBJECT')
lx, ly, lz = nb.sepxyz(nb.texcoord('Object'))
ax_, ay_, az_ = (nb.mul(nb.absv(q), 2.0) for q in (lx, ly, lz))
hi = nb.mx(nb.mx(ax_, ay_), az_)
lo = nb.mn(nb.mn(ax_, ay_), az_)
mid = nb.sub(nb.sub(nb.add(nb.add(ax_, ay_), az_), hi), lo)       # 2nd largest |coord| -> edges
edge = nb.smooth(0.86, 0.93, mid)
lw = nb.node('ShaderNodeLayerWeight')
lw.inputs['Blend'].default_value = 0.5
facing = nb.sub(1.0, lw.outputs['Facing'])
fill = nb.mul(nb.add(0.05, nb.mul(val, 0.62)), nb.add(0.6, nb.mul(facing, 0.4)))
e = nb.add(nb.mul(edge, 1.45), nb.mul(nb.sub(1.0, edge), fill))
nb.emission_out(nb.cmul(tint, e), 1.0)

bpy.ops.mesh.primitive_cube_add(size=1.0)
proto = bpy.context.active_object
cube_mesh = proto.data
cube_mesh.materials.append(m_cube)
bpy.data.objects.remove(proto)


# ------------------------------------------------------------------ layout per stage
def born_stage(b, c, i, j):
    if b != SEED[0]:
        return 4
    if c != SEED[1]:
        return 3
    if i != SEED[2]:
        return 2
    if j != SEED[3]:
        return 1
    return 0


def pos(k, b, c, i, j):
    """Position of cell (b,c,i,j) in the stage-k layout (each stage is centred)."""
    x = (j - 2.5) * S if k >= 1 else 0.0
    z = (2.5 - i) * S if k >= 2 else 0.0
    y = (c - 1) * SY if k >= 3 else 0.0
    if k >= 4:
        x += (b - 1.5) * BX
    return Vector((x, y, z))


def parent(k, idx):
    b, c, i, j = idx
    return {1: (b, c, i, SEED[3]), 2: (b, c, SEED[2], j), 3: (b, SEED[1], i, j), 4: (SEED[0], c, i, j)}[k][:]


def tint_at(k, c):
    if k >= 3:
        return C.lin4(['RED', 'GREEN', 'BLUE'][c])
    return C.lin4('BLUE')


def delay(k, idx):
    b, c, i, j = idx
    return STAGGER * {1: abs(j - SEED[3]), 2: abs(i - SEED[2]), 3: abs(c - SEED[1]), 4: abs(b - SEED[0])}.get(k, 0)


cells = [(b, c, i, j) for b in range(4) for c in range(3) for i in range(6) for j in range(6)]
objs = {}
for idx in cells:
    b, c, i, j = idx
    ob = bpy.data.objects.new('cell_%d%d%d%d' % idx, cube_mesh)
    scene.collection.objects.link(ob)
    ob['val'] = image_value(b, c, i, j)
    objs[idx] = ob
    kb = born_stage(*idx)
    # ----- birth
    if kb == 0:
        f0 = F_STAGE[0]
        ob.location = pos(0, *idx)
        for f, s in ((f0, 0.0), (f0 + 10, 1.12), (f0 + 18, 1.0)):
            ob.scale = (s, s, s)
            ob.keyframe_insert('scale', frame=f)
        ob.keyframe_insert('location', frame=f0)
    else:
        fs = F_STAGE[kb] + delay(kb, idx)
        par = parent(kb, idx)
        ob.location = pos(kb - 1, *par)
        ob.scale = (0, 0, 0)
        ob.keyframe_insert('scale', frame=fs - 1)
        ob.keyframe_insert('location', frame=fs)
        ob.scale = (0.3, 0.3, 0.3)
        ob.keyframe_insert('scale', frame=fs)
        ob.scale = (1, 1, 1)
        ob.keyframe_insert('scale', frame=fs + DUR)
        ob.location = pos(kb, *idx)
        ob.keyframe_insert('location', frame=fs + DUR)
    # ----- later re-layouts: existing cells move without stagger so the parent leads its copies
    for k in range(kb + 1, 5):
        fs = F_STAGE[k]
        ob.location = pos(k - 1, *idx)
        ob.keyframe_insert('location', frame=fs)
        ob.location = pos(k, *idx)
        ob.keyframe_insert('location', frame=fs + DUR)
    # ----- colour: BLUE data until the image stage, then R/G/B channels
    if kb <= 2:
        ob.color = tint_at(0, c)
        ob.keyframe_insert('color', frame=1)
        ob.keyframe_insert('color', frame=F_STAGE[3])
        ob.color = tint_at(3, c)
        ob.keyframe_insert('color', frame=F_STAGE[3] + DUR)
    else:
        ob.color = tint_at(3, c)
        ob.keyframe_insert('color', frame=1)

# ------------------------------------------------------------------ camera
cam = C.add_camera(scene, (0, -20, 5), (0, 0, 0), lens=50.0)
cam.data.clip_end = 1000


def visible_points(k):
    pts = []
    for idx in cells:
        if born_stage(*idx) <= k:
            p = pos(k, *idx)
            for dx in (-0.5, 0.5):
                for dy in (-0.5, 0.5):
                    for dz in (-0.5, 0.5):
                        pts.append(p + Vector((dx, dy, dz)))
    return pts


ISO_EL = math.degrees(math.atan(1 / math.sqrt(2)))     # 35.264 deg
# (frame, stage-layout to frame, azimuth, elevation, distance, fit box)
KEYS = [
    (1, 0, -74, 14, 14, (0.41, 0.59, 0.36, 0.64)),
    (F_STAGE[1] - 4, 0, -71, 15, 14, (0.40, 0.60, 0.35, 0.65)),
    (F_STAGE[1] + DUR + 22, 1, -68, 17, 22, (0.14, 0.86, 0.30, 0.70)),
    (F_STAGE[2] + DUR + 20, 2, -62, 22, 30, (0.22, 0.78, 0.12, 0.88)),
    (F_STAGE[3] + DUR + 22, 3, -40, 26, 40, (0.25, 0.75, 0.12, 0.88)),
    (F_STAGE[4] + DUR + 30, 4, -58, 31, 150, (0.05, 0.95, 0.13, 0.87)),
    (NF, 4, -55, 32, 150, (0.06, 0.94, 0.14, 0.86)),
]
key_states = []
for (f, k, az, el, dist, box) in KEYS:
    pts = visible_points(k)
    ctr = sum(pts, Vector()) / len(pts)
    azr, elr = math.radians(az), math.radians(el)
    loc = ctr + dist * Vector((math.cos(elr) * math.cos(azr), math.cos(elr) * math.sin(azr), math.sin(elr)))
    C.look_at(cam, loc, ctr)
    cam.data.lens = 50.0
    bpy.context.view_layer.update()
    lens, sx, sy = C.fit_camera(scene, cam, pts, box)
    key_states.append((f, ctr, az, el, dist, lens))
    C.log('key f=%d stage=%d lens=%.1f shift=(%.3f,%.3f)' % (f, k, lens, sx, sy))
cam.data.shift_x = cam.data.shift_y = 0.0


def ease(s):
    s = min(max(s, 0.0), 1.0)
    return s * s * s * (s * (6 * s - 15) + 10)


for f in range(1, NF + 1):
    for a, b in zip(key_states[:-1], key_states[1:]):
        if a[0] <= f <= b[0]:
            break
    s = ease((f - a[0]) / max(1, b[0] - a[0]))
    ctr = a[1].lerp(b[1], s)
    az = math.radians(a[2] + (b[2] - a[2]) * s)
    el = math.radians(a[3] + (b[3] - a[3]) * s)
    dist = math.exp(math.log(a[4]) + (math.log(b[4]) - math.log(a[4])) * s)
    lens = a[5] + (b[5] - a[5]) * s
    loc = ctr + dist * Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    C.look_at(cam, loc, ctr)
    cam.keyframe_insert('location', frame=f)
    cam.keyframe_insert('rotation_euler', frame=f)
    cam.data.lens = lens
    cam.data.keyframe_insert('lens', frame=f)
# (every frame is keyed, so Euler interpolation between keys never matters)


# ------------------------------------------------------------------ cues
cues = [{'t': round((F_STAGE[k] - 1) / FPS, 2), 'label': LABELS[k]} for k in range(5)]
cue_path = os.path.join(C.ROOT, 'assets', 'video', CLIP + '.cues.json')
os.makedirs(os.path.dirname(cue_path), exist_ok=True)
with open(cue_path, 'w') as fh:
    json.dump(cues, fh, indent=1)
C.log('cues written:', cue_path, cues)

frames = C.frame_list(args, 1, NF)
C.finish(scene, args, CLIP, frames)
