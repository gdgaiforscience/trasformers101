"""Shared helpers for the 'Inside the Black Box' Blender clips.

Target: Blender 5.0.x, headless:
    blender -b --factory-startup -P state_of_ai/src/blender/<clip>.py -- [options]

Options (after "--"):
    --res WxH          render resolution (default 1920x1080)
    --samples N        EEVEE TAA render samples (default per clip)
    --frames SPEC      "1-240", "1-240:4" (step), "1,60,120" (default: whole clip)
    --part k/n         render only frames where (index % n) == k  (for parallel workers)
    --outdir DIR       PNG output directory (default _frames/<clip>/)
    --save FILE.blend  also save the generated scene
    --noglare          skip the compositor glare (debug)

Everything that moves is a pure function of the frame number, so loops are exactly periodic.
"""
import argparse
import math
import os
import sys
import time

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))           # state_of_ai/
FRAMES_ROOT = os.path.join(HERE, '_frames')

# ---------------------------------------------------------------- palette (DESIGN.md §1)
PAL = {
    'BG': '#0f1115', 'TEXT': '#ECEFF4', 'MUTED': '#9AA4B2', 'GRID': '#2A3140', 'GRID2': '#1B2029',
    'BLUE': '#58C4DD', 'ORANGE': '#F0AC5F', 'YELLOW': '#FFD54F', 'TEAL': '#5CD0B3',
    'GREEN': '#83C167', 'RED': '#FC6255', 'PURPLE': '#9A72AC', 'PINK': '#E07A9F',
    'DEEP': '#1d3a5f', 'ZERO': '#1a1d24',
}
BG_SRGB8 = (15, 17, 21)


def srgb2lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex2srgb(h):
    h = PAL.get(h, h).lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))


def lin(h, k=1.0):
    """Hex (or palette key) -> linear RGB tuple scaled by k."""
    return tuple(srgb2lin(c) * k for c in hex2srgb(h))


def lin4(h, k=1.0):
    return lin(h, k) + (1.0,)


def mix_hex(h1, h2, t):
    """Interpolate two colours in sRGB space, return linear RGB."""
    a, b = hex2srgb(h1), hex2srgb(h2)
    return tuple(srgb2lin(a[i] * (1 - t) + b[i] * t) for i in range(3))


def ramp_hex(stops, t):
    """Piecewise-linear sRGB ramp through a list of hex colours, t in [0,1] -> linear RGB."""
    t = min(max(t, 0.0), 1.0) * (len(stops) - 1)
    i = min(int(t), len(stops) - 2)
    return mix_hex(stops[i], stops[i + 1], t - i)


# ---------------------------------------------------------------- args / logging
def log(*a):
    print('[clip]', *a, flush=True)


def parse_args():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument('--res', default='1920x1080')
    p.add_argument('--samples', type=int, default=None)
    p.add_argument('--frames', default=None)
    p.add_argument('--part', default=None)
    p.add_argument('--outdir', default=None)
    p.add_argument('--save', default=None)
    p.add_argument('--noglare', action='store_true')
    p.add_argument('--prefix', default='')
    return p.parse_args(argv)


def frame_list(args, first, last):
    if args.frames == 'none':
        return []
    if not args.frames:
        frames = list(range(first, last + 1))
    else:
        frames = []
        for tok in args.frames.split(','):
            step = 1
            if ':' in tok:
                tok, s = tok.split(':')
                step = int(s)
            if '-' in tok:
                a, b = tok.split('-')
                frames += list(range(int(a), int(b) + 1, step))
            else:
                frames.append(int(tok))
    if args.part:
        k, n = (int(x) for x in args.part.split('/'))
        frames = [f for i, f in enumerate(frames) if i % n == k]
    return frames


# ---------------------------------------------------------------- scene setup
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def setup_render(scene, args, frame_end, samples=16, frame_start=1, fps=30):
    w, h = (int(v) for v in args.res.lower().split('x'))
    r = scene.render
    r.engine = 'BLENDER_EEVEE'
    r.resolution_x, r.resolution_y, r.resolution_percentage = w, h, 100
    r.fps, r.fps_base = fps, 1.0
    scene.frame_start, scene.frame_end = frame_start, frame_end
    r.film_transparent = False
    r.dither_intensity = 0.0              # exact background, no noise
    r.use_motion_blur = False
    r.filter_size = 1.2
    im = r.image_settings
    im.file_format = 'PNG'
    im.color_mode = 'RGB'
    im.color_depth = '8'
    im.compression = 15
    vs = scene.view_settings
    vs.view_transform = 'Standard'
    vs.look = 'None'
    vs.exposure = 0.0
    vs.gamma = 1.0
    vs.use_curve_mapping = False
    scene.display_settings.display_device = 'sRGB'
    ee = scene.eevee
    ee.taa_render_samples = args.samples or samples
    for attr, val in (('use_shadows', False), ('use_raytracing', False), ('use_fast_gi', False),
                      ('use_volumetric_shadows', False), ('use_taa_reprojection', False)):
        if hasattr(ee, attr):
            setattr(ee, attr, val)
    return w, h


def setup_world(scene):
    """World colour such that the rendered background is exactly sRGB BG_SRGB8."""
    world = bpy.data.worlds.new('BG')
    scene.world = world
    nt = world.node_tree
    bg = next(n for n in nt.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = tuple(srgb2lin(c / 255.0) for c in BG_SRGB8) + (1.0,)
    bg.inputs['Strength'].default_value = 1.0
    return world


def setup_glare(scene, args, gtype='Bloom', quality='High', threshold=1.0, smoothness=0.1,
                strength=1.0, size=0.6, saturation=1.0, mix_extra=None):
    """Compositor: Render Layers -> Glare -> Group Output (Blender 5 node-group compositor)."""
    ng = bpy.data.node_groups.new('Comp', 'CompositorNodeTree')
    scene.compositing_node_group = ng
    if hasattr(scene.render, 'use_compositing'):
        scene.render.use_compositing = True
    nodes, links = ng.nodes, ng.links
    rl = nodes.new('CompositorNodeRLayers')
    out = nodes.new('NodeGroupOutput')
    ng.interface.new_socket(name='Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    if args.noglare:
        links.new(rl.outputs['Image'], out.inputs['Image'])
        return ng
    g = nodes.new('CompositorNodeGlare')
    vals = {'Type': gtype, 'Quality': quality, 'Threshold': threshold, 'Smoothness': smoothness,
            'Strength': strength, 'Size': size, 'Saturation': saturation}
    if mix_extra:
        vals.update(mix_extra)
    for k, v in vals.items():
        if k in g.inputs:
            g.inputs[k].default_value = v
    links.new(rl.outputs['Image'], g.inputs['Image'])
    links.new(g.outputs['Image'], out.inputs['Image'])
    return ng


def add_camera(scene, loc, target, lens=50.0, sensor=36.0, clip_end=500.0):
    cd = bpy.data.cameras.new('Cam')
    cd.lens = lens
    cd.sensor_width = sensor
    cd.clip_start = 0.05
    cd.clip_end = clip_end
    cam = bpy.data.objects.new('Cam', cd)
    scene.collection.objects.link(cam)
    scene.camera = cam
    look_at(cam, loc, target)
    return cam


def look_at(cam, loc, target, roll=0.0):
    cam.location = Vector(loc)
    d = Vector(target) - Vector(loc)
    q = d.to_track_quat('-Z', 'Y')
    cam.rotation_mode = 'XYZ'
    e = q.to_euler()
    if roll:
        e.rotate_axis('Z', roll)
    cam.rotation_euler = e


def project(scene, cam, pts):
    """World points -> normalised screen coords (x right, y up, 0..1)."""
    from bpy_extras.object_utils import world_to_camera_view
    bpy.context.view_layer.update()
    return [tuple(world_to_camera_view(scene, cam, Vector(p))) for p in pts]


def fit_camera(scene, cam, pts, box):
    """Choose lens + shift so the projected bbox of pts fills box=(x0, x1, y0, y1) (normalised).

    Pinhole camera: changing the focal length scales screen positions about the principal point,
    shift translates them, so the fit is exact for the current camera position/orientation.
    """
    w, h = scene.render.resolution_x, scene.render.resolution_y
    aspect = w / h
    cam.data.shift_x = cam.data.shift_y = 0.0
    P = project(scene, cam, pts)
    xs, ys = [p[0] - 0.5 for p in P], [p[1] - 0.5 for p in P]
    x0, x1, y0, y1 = box
    sx = (x1 - x0) / (max(xs) - min(xs))
    sy = (y1 - y0) / (max(ys) - min(ys))
    s = min(sx, sy)
    cam.data.lens *= s
    cx, cy = s * (max(xs) + min(xs)) / 2, s * (max(ys) + min(ys)) / 2
    tx, ty = (x0 + x1) / 2 - 0.5, (y0 + y1) / 2 - 0.5
    cam.data.shift_x = cx - tx                     # shift is in units of the frame width
    cam.data.shift_y = (cy - ty) / aspect
    return cam.data.lens, cam.data.shift_x, cam.data.shift_y


# ---------------------------------------------------------------- shader node builder
class NB:
    """Tiny helper to build shader node graphs with math expressions."""

    def __init__(self, mat):
        self.mat = mat
        self.nt = mat.node_tree
        for n in list(self.nt.nodes):
            if n.type != 'OUTPUT_MATERIAL':
                self.nt.nodes.remove(n)
        self.out = next(n for n in self.nt.nodes if n.type == 'OUTPUT_MATERIAL')
        self._time = None

    def node(self, idname, **props):
        n = self.nt.nodes.new(idname)
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def _set(self, sock, val):
        if isinstance(val, bpy.types.NodeSocket):
            self.nt.links.new(val, sock)
        elif val is not None:
            sock.default_value = val

    def math(self, op, a, b=None, c=None, clamp=False):
        n = self.node('ShaderNodeMath', operation=op, use_clamp=clamp)
        self._set(n.inputs[0], a)
        if b is not None:
            self._set(n.inputs[1], b)
        if c is not None:
            self._set(n.inputs[2], c)
        return n.outputs[0]

    def add(self, a, b): return self.math('ADD', a, b)
    def sub(self, a, b): return self.math('SUBTRACT', a, b)
    def mul(self, a, b): return self.math('MULTIPLY', a, b)
    def div(self, a, b): return self.math('DIVIDE', a, b)
    def mx(self, a, b): return self.math('MAXIMUM', a, b)
    def mn(self, a, b): return self.math('MINIMUM', a, b)
    def pw(self, a, b): return self.math('POWER', a, b)
    def fmod(self, a, b): return self.math('FLOORED_MODULO', a, b)
    def exp(self, a): return self.math('EXPONENT', a)
    def sin(self, a): return self.math('SINE', a)
    def cos(self, a): return self.math('COSINE', a)
    def absv(self, a): return self.math('ABSOLUTE', a)
    def clamp01(self, a): return self.math('MULTIPLY', a, 1.0, clamp=True)
    def madd(self, a, b, c): return self.math('MULTIPLY_ADD', a, b, c)

    def smooth(self, e0, e1, x):
        n = self.node('ShaderNodeMapRange', interpolation_type='SMOOTHSTEP', clamp=True)
        self._set(n.inputs['Value'], x)
        self._set(n.inputs['From Min'], e0)
        self._set(n.inputs['From Max'], e1)
        n.inputs['To Min'].default_value = 0.0
        n.inputs['To Max'].default_value = 1.0
        return n.outputs['Result']

    def maprange(self, x, a0, a1, b0, b1, clamp=True):
        n = self.node('ShaderNodeMapRange', interpolation_type='LINEAR', clamp=clamp)
        self._set(n.inputs['Value'], x)
        self._set(n.inputs['From Min'], a0)
        self._set(n.inputs['From Max'], a1)
        self._set(n.inputs['To Min'], b0)
        self._set(n.inputs['To Max'], b1)
        return n.outputs['Result']

    def attr(self, name, kind='GEOMETRY'):
        n = self.node('ShaderNodeAttribute', attribute_type=kind, attribute_name=name)
        return n

    def afloat(self, name, kind='GEOMETRY'):
        return self.attr(name, kind).outputs['Fac']

    def acolor(self, name, kind='GEOMETRY'):
        return self.attr(name, kind).outputs['Color']

    def avec(self, name, kind='GEOMETRY'):
        return self.attr(name, kind).outputs['Vector']

    def sepxyz(self, v):
        n = self.node('ShaderNodeSeparateXYZ')
        self._set(n.inputs[0], v)
        return n.outputs[0], n.outputs[1], n.outputs[2]

    def combxyz(self, x, y, z):
        n = self.node('ShaderNodeCombineXYZ')
        self._set(n.inputs[0], x)
        self._set(n.inputs[1], y)
        self._set(n.inputs[2], z)
        return n.outputs[0]

    def vmath(self, op, a, b=None, scale=None):
        n = self.node('ShaderNodeVectorMath', operation=op)
        self._set(n.inputs[0], a)
        if b is not None:
            self._set(n.inputs[1], b)
        if scale is not None:
            self._set(n.inputs['Scale'], scale)
        return n.outputs['Value'] if op in ('DOT_PRODUCT', 'LENGTH', 'DISTANCE') else n.outputs['Vector']

    def vscale(self, v, s): return self.vmath('SCALE', v, scale=s)

    def mixc(self, fac, a, b):
        """Mix two colours (sockets or RGBA tuples)."""
        n = self.node('ShaderNodeMix', data_type='RGBA', blend_type='MIX', clamp_factor=True)
        ins = {s.identifier: s for s in n.inputs}
        self._set(ins['Factor_Float'], fac)
        self._set(ins['A_Color'], a)
        self._set(ins['B_Color'], b)
        return {s.identifier: s for s in n.outputs}['Result_Color']

    def cmul(self, c, s):
        """Colour (socket/tuple) times scalar (socket/float) -> colour-ish vector."""
        return self.vmath('SCALE', c, scale=s)

    def cadd(self, a, b): return self.vmath('ADD', a, b)

    def rgb(self, col):
        n = self.node('ShaderNodeRGB')
        n.outputs[0].default_value = tuple(col[:3]) + (1.0,)
        return n.outputs[0]

    def ramp(self, fac, stops, interp='LINEAR', mode='RGB', hue='NEAR'):
        """stops: list of (pos, (r,g,b)) linear colours."""
        n = self.node('ShaderNodeValToRGB')
        cr = n.color_ramp
        cr.color_mode = mode
        if mode != 'RGB':
            cr.hue_interpolation = hue
        cr.interpolation = interp
        while len(cr.elements) < len(stops):
            cr.elements.new(0.5)
        for el, (pos, col) in zip(cr.elements, stops):
            el.position = pos
            el.color = tuple(col[:3]) + (1.0,)
        self._set(n.inputs['Fac'], fac)
        return n.outputs['Color']

    def time(self, offset=-1.0):
        """Scene frame number (+offset) via a driver on a Value node (simple expression)."""
        if self._time is None:
            v = self.node('ShaderNodeValue')
            fc = v.outputs[0].driver_add('default_value')
            fc.driver.type = 'SCRIPTED'
            fc.driver.expression = 'frame + (%g)' % offset
            self._time = v.outputs[0]
        return self._time

    def texcoord(self, which):
        n = self.node('ShaderNodeTexCoord')
        return n.outputs[which]

    def camdist(self):
        n = self.node('ShaderNodeCameraData')
        return n.outputs['View Distance']

    def geometry(self, which):
        n = self.node('ShaderNodeNewGeometry')
        return n.outputs[which]

    def emission_out(self, color, strength=1.0, additive=False):
        em = self.node('ShaderNodeEmission')
        self._set(em.inputs['Color'], color)
        self._set(em.inputs['Strength'], strength)
        shader = em.outputs[0]
        if additive:
            tr = self.node('ShaderNodeBsdfTransparent')
            tr.inputs['Color'].default_value = (1, 1, 1, 1)
            ad = self.node('ShaderNodeAddShader')
            self.nt.links.new(em.outputs[0], ad.inputs[0])
            self.nt.links.new(tr.outputs[0], ad.inputs[1])
            shader = ad.outputs[0]
        self.nt.links.new(shader, self.out.inputs['Surface'])
        return shader


def new_material(name, additive=False):
    mat = bpy.data.materials.new(name)
    if hasattr(mat, 'use_nodes') and not mat.use_nodes:
        try:
            mat.use_nodes = True
        except Exception:
            pass
    if additive:
        mat.surface_render_method = 'BLENDED'
        mat.use_transparency_overlap = True
        mat.use_backface_culling = False
    else:
        mat.surface_render_method = 'DITHERED'
    return mat


# ---------------------------------------------------------------- mesh helpers
def mesh_object(scene, name, verts, faces, attrs=None, mat=None, smooth=False):
    """attrs: {name: (domain, dtype, flat_values)} with dtype FLOAT / FLOAT_VECTOR / FLOAT_COLOR."""
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    keymap = {'FLOAT': 'value', 'FLOAT_VECTOR': 'vector', 'FLOAT_COLOR': 'color', 'FLOAT2': 'vector'}
    for an, (domain, dtype, vals) in (attrs or {}).items():
        a = me.attributes.new(an, dtype, domain)
        a.data.foreach_set(keymap[dtype], vals)
    if smooth:
        me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    if mat is not None:
        me.materials.append(mat)
    return ob


def basis_for(d):
    d = Vector(d).normalized()
    a = Vector((0, 0, 1)) if abs(d.z) < 0.9 else Vector((1, 0, 0))
    u = d.cross(a).normalized()
    v = d.cross(u).normalized()
    return u, v


class MeshAccum:
    """Accumulates many primitives into one mesh with per-vertex attributes."""

    def __init__(self, attr_specs):
        # attr_specs: {name: ncomp}  (1 -> FLOAT, 3 -> FLOAT_VECTOR, 4 -> FLOAT_COLOR)
        self.verts, self.faces = [], []
        self.specs = attr_specs
        self.data = {k: [] for k in attr_specs}

    def _push(self, pts, faces, per_vertex_attrs):
        base = len(self.verts)
        self.verts.extend(tuple(p) for p in pts)
        self.faces.extend(tuple(base + i for i in f) for f in faces)
        n = len(pts)
        for k, nc in self.specs.items():
            v = per_vertex_attrs[k]
            if callable(v):
                for i in range(n):
                    val = v(i)
                    self.data[k].extend(val if nc > 1 else (val,))
            else:
                val = v if nc > 1 else (v,)
                for i in range(n):
                    self.data[k].extend(val)

    def tube(self, p0, p1, r, sides, attrs, r1=None):
        """Open tube p0->p1. attrs values may be callables f(i) (i = vertex index; i < sides -> p0 end)."""
        p0, p1 = Vector(p0), Vector(p1)
        u, v = basis_for(p1 - p0)
        r1 = r if r1 is None else r1
        pts = []
        for end, rad in ((p0, r), (p1, r1)):
            for k in range(sides):
                a = 2 * math.pi * k / sides
                pts.append(end + (u * math.cos(a) + v * math.sin(a)) * rad)
        faces = [(k, (k + 1) % sides, sides + (k + 1) % sides, sides + k) for k in range(sides)]
        self._push(pts, faces, attrs)

    def disc(self, c, normal, R, segs, attrs, up=None):
        """Flat disc (fan) facing `normal`. Vertex 0 is the centre."""
        c = Vector(c)
        u, v = basis_for(normal)
        pts = [c] + [c + (u * math.cos(2 * math.pi * k / segs) + v * math.sin(2 * math.pi * k / segs)) * R
                     for k in range(segs)]
        faces = [(0, 1 + k, 1 + (k + 1) % segs) for k in range(segs)]
        self._push(pts, faces, attrs)

    def build(self, scene, name, mat=None, smooth=False):
        attrs = {}
        for k, nc in self.specs.items():
            dtype = {1: 'FLOAT', 3: 'FLOAT_VECTOR', 4: 'FLOAT_COLOR'}[nc]
            attrs[k] = ('POINT', dtype, self.data[k])
        return mesh_object(scene, name, self.verts, self.faces, attrs, mat, smooth)


# ---------------------------------------------------------------- rendering
def render_frames(scene, frames, outdir, prefix=''):
    os.makedirs(outdir, exist_ok=True)
    times = []
    t_all = time.time()
    for f in frames:
        scene.frame_set(f)
        scene.render.filepath = os.path.join(outdir, '%s%04d.png' % (prefix, f))
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        dt = time.time() - t0
        times.append(dt)
        log('frame %d rendered in %.2fs' % (f, dt))
    if times:
        log('TIMING frames=%d total=%.1fs first=%.2fs mean_rest=%.2fs' % (
            len(times), time.time() - t_all, times[0],
            (sum(times[1:]) / max(1, len(times) - 1)) if len(times) > 1 else times[0]))
    return times


def finish(scene, args, clip, frames):
    if args.save:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.save))
    outdir = args.outdir or os.path.join(FRAMES_ROOT, clip)
    return render_frames(scene, frames, outdir, args.prefix)
