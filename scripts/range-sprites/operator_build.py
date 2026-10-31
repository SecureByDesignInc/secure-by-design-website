# Secure By Design, Cyber Range operators as 3D cel-shaded sprites (route 3, 27 October 2026).
# Builds an original operator ("ttl_zero", the Network resident: headset base, blue glow, node mark) from primitives,
# rigs it with parented parts (origins at the joints), keys five actions, and renders sprite frames with Cycles plus a
# cel ramp and Freestyle ink lines in the compositor. Runs with the bpy module or inside Blender.
import bpy, math, os, sys
from mathutils import Vector

MODE = sys.argv[-1] if sys.argv[-1] in ('still', 'all', 'quick') else 'still'
OUT = os.environ.get('SBD_SPRITES', '/home/claude/sprites')
RES = (512, 768)
SAMPLES = 20
GLOW = (0.14, 0.55, 0.96)        # ttl_zero: the "blue" glow (#238df5)
NAVY = (0.047, 0.094, 0.17)      # #0c1828
JACKET = (0.10, 0.21, 0.34)      # #1a3657
TRIM = (0.23, 0.39, 0.55)        # #3b648c
PANTS = (0.075, 0.11, 0.16)
SKIN = (0.86, 0.72, 0.62)
HAIR = (0.84, 0.90, 0.95)
CHROME = (0.62, 0.70, 0.78)
INK = (0.012, 0.03, 0.06)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = False
sc.render.resolution_x, sc.render.resolution_y = RES
sc.render.film_transparent = True
sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'
sc.render.fps = 24

# ---- materials ------------------------------------------------------------------------------------------------
MATS = {}
def mat(name, color=None, emit=None, strength=5.0, self_light=0.0):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    if emit:
        e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*emit, 1); e.inputs['Strength'].default_value = strength
        nt.links.new(e.outputs[0], out.inputs[0])
    else:
        d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs['Color'].default_value = (*color, 1); d.inputs['Roughness'].default_value = 0.7
        if self_light:
            e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*color, 1); e.inputs['Strength'].default_value = self_light
            a = nt.nodes.new('ShaderNodeAddShader'); nt.links.new(d.outputs[0], a.inputs[0]); nt.links.new(e.outputs[0], a.inputs[1]); nt.links.new(a.outputs[0], out.inputs[0])
        else:
            nt.links.new(d.outputs[0], out.inputs[0])
    MATS[name] = m
    return m

# ---- mesh helpers ---------------------------------------------------------------------------------------------
PARTS = {}
def prim(name, kind, dims, loc, m, parent=None, shift=(0, 0, 0), rot=(0, 0, 0), subsurf=0, bevel=0.0, segs=24, smooth=True, torus=(0.5, 0.08), taper=0.8):
    if kind == 'cube': bpy.ops.mesh.primitive_cube_add(size=1)
    elif kind == 'cyl': bpy.ops.mesh.primitive_cylinder_add(radius=0.5, depth=1, vertices=segs)
    elif kind == 'sphere': bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=segs, ring_count=max(8, segs // 2))
    elif kind == 'cone': bpy.ops.mesh.primitive_cone_add(radius1=0.5, radius2=0.0, depth=1, vertices=segs)
    elif kind == 'tube': bpy.ops.mesh.primitive_cone_add(radius1=0.5, radius2=0.5 * taper, depth=1, vertices=segs)
    elif kind == 'torus': bpy.ops.mesh.primitive_torus_add(major_radius=torus[0], minor_radius=torus[1], major_segments=segs, minor_segments=12)
    o = bpy.context.object; o.name = name
    rx, ry, rz = [math.radians(a) for a in rot]
    from mathutils import Euler
    R = Euler((rx, ry, rz), 'XYZ').to_matrix()
    for v in o.data.vertices:
        c = Vector((v.co.x * dims[0], v.co.y * dims[1], v.co.z * dims[2]))
        v.co = R @ c + Vector(shift)
    o.location = loc
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    if bevel:
        b = o.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = 3; b.limit_method = 'ANGLE'
    if subsurf:
        s = o.modifiers.new('sub', 'SUBSURF'); s.levels = subsurf; s.render_levels = subsurf
    o.data.materials.append(m)
    if parent is not None:
        bpy.context.view_layer.update()
        o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    PARTS[name] = o
    return o
def empty(name, loc, parent=None):
    o = bpy.data.objects.new(name, None); sc.collection.objects.link(o); o.location = loc; o.empty_display_size = 0.05
    if parent is not None:
        bpy.context.view_layer.update()
        o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    PARTS[name] = o
    return o

# ---- the operator: facing -Y, feet on z=0, about 1.86 m tall, lanky anime proportions ----------------------------
M = dict(jacket=mat('jacket', JACKET), navy=mat('navy', NAVY), trim=mat('trim', TRIM), pants=mat('pants', PANTS), skin=mat('skin', SKIN, self_light=0.26),
         hair=mat('hair', HAIR, self_light=0.5), chrome=mat('chrome', CHROME), glow=mat('glow', emit=GLOW, strength=9), eye=mat('eye', emit=GLOW, strength=3.5),
         ink=mat('ink', INK), white=mat('white', (0.93, 0.96, 1.0)), boot=mat('boot', (0.05, 0.075, 0.11)), amber=mat('amber', emit=(0.97, 0.74, 0.41), strength=5),
         shirt=mat('shirt', (0.80, 0.88, 0.96)))
NOINK = bpy.data.collections.new('NoInk'); sc.collection.children.link(NOINK)
def noink(o):
    for c in o.users_collection: c.objects.unlink(o)
    NOINK.objects.link(o)
def curve(name, points, m, parent, depth=0.006):
    cd = bpy.data.curves.new(name, 'CURVE'); cd.dimensions = '3D'; cd.bevel_depth = depth; cd.bevel_resolution = 3; cd.resolution_u = 12
    sp = cd.splines.new('BEZIER'); sp.bezier_points.add(len(points) - 1)
    for i, p in enumerate(points):
        bp = sp.bezier_points[i]; bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    o = bpy.data.objects.new(name, cd); sc.collection.objects.link(o); o.data.materials.append(m)
    bpy.context.view_layer.update()
    o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    PARTS[name] = o
    return o

root = empty('root', (0, 0, 0))
hips = empty('hips', (0, 0, 0.96), root)
chest = empty('chest', (0, 0, 1.17), hips)
head = empty('head', (0, 0, 1.55), chest)
# torso: a narrow waist, a boxy jacket with an asymmetric hem, a shirt showing at the collar
prim('pelvis', 'cube', (0.26, 0.18, 0.22), hips.location, M['pants'], hips, shift=(0, 0, 0.07), bevel=0.05, subsurf=2)
prim('waist', 'cube', (0.25, 0.19, 0.20), (0, 0, 1.07), M['jacket'], hips, bevel=0.05, subsurf=2)
prim('hem.L', 'cube', (0.19, 0.24, 0.16), (0.09, 0, 0.98), M['jacket'], hips, bevel=0.03, subsurf=1)
prim('hem.R', 'cube', (0.19, 0.24, 0.10), (-0.09, 0, 1.01), M['jacket'], hips, bevel=0.03, subsurf=1)
prim('belt', 'torus', (1, 0.74, 1), (0, 0, 0.975), M['navy'], hips, torus=(0.15, 0.026), segs=24)
prim('buckle', 'cube', (0.05, 0.02, 0.03), (0.0, -0.118, 0.975), M['amber'], hips, bevel=0.004)
prim('pouch', 'cube', (0.09, 0.07, 0.11), (0.14, -0.03, 0.92), M['navy'], hips, bevel=0.015, subsurf=1)
prim('torso', 'cube', (0.36, 0.22, 0.32), chest.location, M['jacket'], chest, shift=(0, 0, 0.15), bevel=0.06, subsurf=2)
prim('shirt', 'cyl', (0.16, 0.14, 0.12), (0, 0.0, 1.45), M['shirt'], chest, segs=20)
prim('strap', 'cube', (0.05, 0.03, 0.44), (0.0, -0.118, 1.27), M['navy'], chest, rot=(0, -34, 0), bevel=0.006)
prim('strapbuckle', 'cube', (0.035, 0.02, 0.035), (0.0, -0.13, 1.25), M['amber'], chest, bevel=0.003)
prim('zip', 'cube', (0.012, 0.012, 0.26), (-0.06, -0.113, 1.27), M['glow'], chest)
prim('pauldron', 'cube', (0.17, 0.20, 0.11), (-0.235, 0, 1.47), M['navy'], chest, bevel=0.03, subsurf=1)
prim('pauldronlight', 'cube', (0.12, 0.012, 0.014), (-0.235, -0.095, 1.49), M['glow'], chest)
prim('pad.L', 'cube', (0.12, 0.17, 0.07), (0.215, 0, 1.465), M['navy'], chest, bevel=0.025, subsurf=1)
prim('padlight.L', 'cube', (0.08, 0.012, 0.012), (0.215, -0.08, 1.48), M['glow'], chest)
prim('collar', 'torus', (1, 1, 1.9), (0, 0.015, 1.52), M['jacket'], chest, torus=(0.092, 0.034), segs=24)
prim('collartrim', 'torus', (1, 1, 1), (0, 0.015, 1.575), M['glow'], chest, torus=(0.108, 0.006), segs=24)
prim('neck', 'cyl', (0.072, 0.072, 0.16), (0, 0.004, 1.50), M['skin'], chest, segs=16)
# head: round cranium, tapered jaw, big anime eyes with glowing irises
prim('skull', 'sphere', (0.25, 0.27, 0.30), (0, 0.005, 1.705), M['skin'], head, segs=32)
prim('jaw', 'tube', (0.22, 0.20, 0.19), (0, -0.004, 1.60), M['skin'], head, rot=(180, 0, 0), subsurf=2, segs=20, taper=0.32)
prim('nose', 'cone', (0.014, 0.02, 0.024), (0.0, -0.136, 1.652), M['skin'], head, rot=(92, 0, 0), segs=8)
for side, x, t in (('L', 0.053, 1), ('R', -0.053, -1)):
    eye = prim(f'eye.{side}', 'sphere', (0.062, 0.022, 0.035), (x, -0.118, 1.695), M['white'], head, segs=16, rot=(0, 10 * t, 0)); noink(eye)
    iris = prim(f'iris.{side}', 'sphere', (0.040, 0.018, 0.038), (x + 0.004 * t, -0.126, 1.693), M['eye'], head, segs=12); noink(iris)
    pupil = prim(f'pupil.{side}', 'sphere', (0.017, 0.012, 0.019), (x + 0.004 * t, -0.133, 1.693), M['ink'], head, segs=10); noink(pupil)
    hl = prim(f'eyehl.{side}', 'sphere', (0.009, 0.008, 0.009), (x - 0.006, -0.136, 1.703), M['white'], head, segs=8); noink(hl)
    lash = prim(f'lash.{side}', 'cube', (0.068, 0.014, 0.010), (x + 0.003 * t, -0.133, 1.712), M['ink'], head, rot=(0, 16 * t, 0)); noink(lash)
    lid = prim(f'lid.{side}', 'cube', (0.046, 0.010, 0.004), (x, -0.133, 1.679), M['ink'], head, rot=(0, 8 * t, 0)); noink(lid)
    brow = prim(f'brow.{side}', 'cube', (0.060, 0.012, 0.010), (x + 0.008 * t, -0.138, 1.740), M['navy'], head, rot=(0, 22 * t, 0)); noink(brow)
mouth = prim('mouth', 'cube', (0.03, 0.004, 0.0035), (-0.006, -0.136, 1.589), M['ink'], head, rot=(0, 7, 0)); noink(mouth)
mark = prim('mark', 'cube', (0.014, 0.006, 0.014), (-0.092, -0.106, 1.645), M['glow'], head); noink(mark)
markline = prim('markline', 'cube', (0.004, 0.006, 0.012), (-0.092, -0.106, 1.632), M['glow'], head); noink(markline)
# hair: a cap, long swept-back blades at the crown, a fringe sweeping across the brow to the right
prim('cap', 'sphere', (0.275, 0.29, 0.28), (0, 0.03, 1.745), M['hair'], head, segs=32)
HC = Vector((0, 0.03, 1.73))
blades = [((-0.3, 0.55, 0.78), 0.30, 0.10), ((0.15, 0.55, 0.82), 0.32, 0.10), ((0.55, 0.45, 0.70), 0.28, 0.09), ((-0.6, 0.4, 0.68), 0.27, 0.09), ((0.0, 0.95, 0.35), 0.26, 0.09),
          ((-0.5, 0.8, 0.3), 0.22, 0.08), ((0.5, 0.8, 0.3), 0.22, 0.08), ((-0.15, 0.05, 1.0), 0.24, 0.085), ((0.35, -0.05, 0.95), 0.22, 0.08), ((0.8, 0.1, 0.55), 0.20, 0.075), ((-0.82, 0.05, 0.5), 0.18, 0.07)]
for i, (d, L, w) in enumerate(blades):
    d = Vector(d).normalized(); base = HC + d * 0.10; e = d.to_track_quat('Z', 'Y').to_euler()
    prim(f'blade{i}', 'cone', (w, 0.05, L), base, M['hair'], head, shift=(0, 0, L * 0.4), rot=[math.degrees(a) for a in e], segs=6, smooth=False)
fringe = [((0.6, -0.65, -0.3), 0.20, 0.07, (0.03, -0.10, 1.80)), ((0.3, -0.85, -0.3), 0.17, 0.065, (-0.01, -0.115, 1.805)), ((0.85, -0.4, -0.3), 0.18, 0.065, (0.08, -0.08, 1.78)),
          ((-0.35, -0.8, -0.2), 0.14, 0.06, (-0.05, -0.11, 1.81)), ((-0.9, -0.1, -0.5), 0.15, 0.06, (-0.14, 0.0, 1.74))]
for i, (d, L, w, base) in enumerate(fringe):
    d = Vector(d).normalized(); e = d.to_track_quat('Z', 'Y').to_euler()
    prim(f'fringe{i}', 'cone', (w, 0.04, L), base, M['hair'], head, shift=(0, 0, L * 0.4), rot=[math.degrees(a) for a in e], segs=6, smooth=False)
# headset over the hair, cups with lit rings, boom mic, a data cable into the collar
prim('band', 'torus', (1, 1, 1), (0, 0.03, 1.71), M['navy'], head, torus=(0.15, 0.016), segs=32, rot=(0, 90, 0))
band = PARTS['band']
import bmesh
bm = bmesh.new(); bm.from_mesh(band.data)
for v in list(bm.verts):
    if v.co.z < 0.03: bm.verts.remove(v)
bm.to_mesh(band.data); bm.free()
for side, x in (('L', 0.138), ('R', -0.138)):
    prim(f'cup.{side}', 'cyl', (0.08, 0.08, 0.05), (x, 0.015, 1.685), M['navy'], head, rot=(0, 90, 0), segs=20, bevel=0.008)
    r = prim(f'cupring.{side}', 'torus', (1, 1, 1), (x * 1.19, 0.015, 1.685), M['glow'], head, torus=(0.036, 0.005), segs=20, rot=(0, 90, 0)); noink(r)
curve('boom', [(-0.165, 0.0, 1.66), (-0.16, -0.09, 1.60), (-0.085, -0.13, 1.575)], M['trim'], head, depth=0.006)
mic = prim('mic', 'sphere', (0.022, 0.022, 0.022), (-0.08, -0.133, 1.573), M['glow'], head, segs=10); noink(mic)
curve('cable', [(-0.16, 0.04, 1.66), (-0.19, 0.12, 1.58), (-0.10, 0.11, 1.50)], M['glow'], head, depth=0.005)
# arms: thinner, the right forearm a chrome cyber arm with lit seams
for side, x, sgn in (('L', 0.232, 1), ('R', -0.232, -1)):
    sh = (x, 0, 1.445)
    prim(f'shoulder.{side}', 'sphere', (0.11, 0.11, 0.11), sh, M['jacket'], chest, segs=16)
    ua = prim(f'upper_arm.{side}', 'tube', (0.10, 0.10, 0.31), sh, M['jacket'], chest, shift=(0, 0, -0.155), rot=(180, 0, 0), bevel=0.03, subsurf=1, segs=16, taper=0.84)
    st = prim(f'sleevetrim.{side}', 'torus', (1, 1, 1), (x, 0, 1.15), M['glow'], ua, torus=(0.05, 0.005), segs=16); noink(st)
    el = (x, 0, 1.135)
    prim(f'elbow.{side}', 'sphere', (0.088, 0.088, 0.088), el, M['jacket'] if side == 'L' else M['chrome'], ua, segs=16)
    fa = prim(f'forearm.{side}', 'tube', (0.092, 0.092, 0.30), el, M['jacket'] if side == 'L' else M['chrome'], ua, shift=(0, 0, -0.15), rot=(180, 0, 0), bevel=0.03, subsurf=1, segs=16, taper=0.74)
    if side == 'R':
        s1 = prim('seam.R', 'cube', (0.012, 0.012, 0.22), (x - 0.042, -0.012, 0.995), M['glow'], fa); noink(s1)
        s2 = prim('seam2.R', 'torus', (1, 1, 1), (x, 0, 1.06), M['glow'], fa, torus=(0.046, 0.004), segs=16); noink(s2)
        s3 = prim('seam3.R', 'torus', (1, 1, 1), (x, 0, 0.88), M['glow'], fa, torus=(0.038, 0.004), segs=16); noink(s3)
        prim('plate.R', 'cube', (0.06, 0.05, 0.12), (x + 0.03, -0.03, 0.98), M['navy'], fa, bevel=0.01, subsurf=1)
    wr = (x, 0, 0.84)
    prim(f'hand.{side}', 'cube', (0.072, 0.052, 0.088), wr, M['skin'] if side == 'L' else M['chrome'], fa, shift=(0, 0, -0.048), bevel=0.028, subsurf=2)
    prim(f'thumb.{side}', 'cube', (0.025, 0.03, 0.045), wr, M['skin'] if side == 'L' else M['chrome'], fa, shift=(0.0, -0.035, -0.03), bevel=0.01, subsurf=1)
# legs: slim, cargo pockets, the right shin chrome, chunky boots with buckles and a lit sole
for side, x in (('L', 0.095), ('R', -0.095)):
    hj = (x, 0, 0.96)
    th = prim(f'thigh.{side}', 'tube', (0.145, 0.145, 0.46), hj, M['pants'], hips, shift=(0, 0, -0.23), rot=(180, 0, 0), bevel=0.04, subsurf=1, segs=16, taper=0.8)
    prim(f'pocket.{side}', 'cube', (0.10, 0.06, 0.13), (x + (0.055 if side == 'L' else -0.055), -0.045, 0.72), M['navy'], th, bevel=0.012, subsurf=1)
    kn = (x, 0, 0.52)
    prim(f'knee.{side}', 'sphere', (0.125, 0.125, 0.125), kn, M['pants'] if side == 'L' else M['chrome'], th, segs=16)
    sn = prim(f'shin.{side}', 'tube', (0.12, 0.12, 0.45), kn, M['pants'] if side == 'L' else M['chrome'], th, shift=(0, 0, -0.225), rot=(180, 0, 0), bevel=0.04, subsurf=1, segs=16, taper=0.76)
    if side == 'L':
        prim('kneepad.L', 'cube', (0.11, 0.07, 0.11), (x, -0.06, 0.49), M['navy'], sn, bevel=0.02, subsurf=1)
    else:
        ls1 = prim('legseam.R', 'cube', (0.012, 0.012, 0.26), (x - 0.055, -0.01, 0.33), M['glow'], sn); noink(ls1)
        prim('legplate.R', 'cube', (0.08, 0.06, 0.16), (x, -0.06, 0.35), M['navy'], sn, bevel=0.012, subsurf=1)
    ak = (x, 0, 0.09)
    prim(f'boot.{side}', 'cube', (0.17, 0.29, 0.16), ak, M['boot'], sn, shift=(0, -0.05, -0.03), bevel=0.035, subsurf=1)
    prim(f'bootcuff.{side}', 'cube', (0.165, 0.18, 0.12), ak, M['boot'], sn, shift=(0, 0.0, 0.08), bevel=0.02, subsurf=1)
    prim(f'buckle1.{side}', 'cube', (0.19, 0.02, 0.02), ak, M['navy'], sn, shift=(0, -0.06, 0.09))
    prim(f'buckle2.{side}', 'cube', (0.19, 0.02, 0.02), ak, M['navy'], sn, shift=(0, -0.07, 0.03))
    sole = prim(f'sole.{side}', 'cube', (0.18, 0.30, 0.014), ak, M['glow'], sn, shift=(0, -0.05, -0.105)); noink(sole)

# ---- camera, lights -------------------------------------------------------------------------------------------
aim = empty('aim', (0, 0, 0.96))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam)
az = math.radians(-34); el = 0.10
cam.location = (math.sin(az) * 7.0, -math.cos(az) * 7.0, 0.96 + 7.0 * el)
c = cam.constraints.new('TRACK_TO'); c.target = aim; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.44
sc.camera = cam
def sun(name, pos, strength, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, 'SUN'); l.energy = strength; l.color = color; l.angle = 0.02
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = pos
    t = o.constraints.new('TRACK_TO'); t.target = aim; t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'
    return o
sun('key', (-5.0, -6.5, 3.6), 2.6)
sun('rim', (4.0, 3.5, 3.0), 5.0, (0.75, 0.9, 1.0))
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.04, 0.07, 0.13, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.4

# ---- ink lines (Freestyle as its own pass) and the cel ramp in the compositor --------------------------------
vl = sc.view_layers[0]
vl.use_pass_diffuse_direct = True; vl.use_pass_diffuse_color = True; vl.use_pass_emit = True
sc.render.use_freestyle = True
sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = 2.4
fs = vl.freestyle_settings; fs.as_render_pass = True; fs.crease_angle = math.radians(112)
while fs.linesets: fs.linesets.remove(fs.linesets[0])
def lineset(name, thick, sil, crease, calli=None):
    l = fs.linesets.new(name)
    l.select_silhouette = sil; l.select_border = sil; l.select_crease = crease; l.select_edge_mark = False
    l.select_by_collection = True; l.collection = NOINK; l.collection_negation = 'EXCLUSIVE'
    if l.linestyle is None: l.linestyle = bpy.data.linestyles.new(name)
    l.linestyle.color = INK; l.linestyle.thickness = thick
    l.linestyle.caps = 'ROUND'
    if calli:
        c = l.linestyle.thickness_modifiers.new('calli', 'CALLIGRAPHY'); c.thickness_min, c.thickness_max = calli; c.orientation = math.radians(52)
    return l
lineset('silhouette', 3.0, True, False, (1.4, 4.2))
lineset('creases', 1.3, False, True)
# Blender 5.0: the compositor is a node group with a group output; mix and ramp nodes are the shader ones.
nt = bpy.data.node_groups.new('comp', 'CompositorNodeTree'); sc.compositing_node_group = nt
nt.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
rl = nt.nodes.new('CompositorNodeRLayers')
bw = nt.nodes.new('CompositorNodeRGBToBW'); nt.links.new(rl.outputs['Diffuse Direct'], bw.inputs[0])
ramp = nt.nodes.new('ShaderNodeValToRGB'); cr = ramp.color_ramp; cr.interpolation = 'CONSTANT'
cr.elements[0].position = 0.0; cr.elements[0].color = (0.34, 0.37, 0.58, 1)
cr.elements[1].position = 0.10; cr.elements[1].color = (0.62, 0.66, 0.82, 1)
e2 = cr.elements.new(0.30); e2.color = (1.0, 1.0, 1.0, 1)
e3 = cr.elements.new(1.05); e3.color = (1.30, 1.30, 1.38, 1)
nt.links.new(bw.outputs[0], ramp.inputs['Fac'])
def mix(kind, a, b):
    n = nt.nodes.new('ShaderNodeMix'); n.data_type = 'RGBA'; n.blend_type = kind; n.inputs[0].default_value = 1.0
    nt.links.new(a, n.inputs[6]); nt.links.new(b, n.inputs[7]); return n.outputs[2]
shaded = mix('MULTIPLY', rl.outputs['Diffuse Color'], ramp.outputs['Color'])
glare = nt.nodes.new('CompositorNodeGlare'); glare.inputs['Type'].default_value = 'Fog Glow'
glare.inputs['Threshold'].default_value = 0.8; glare.inputs['Size'].default_value = 0.45; glare.inputs['Strength'].default_value = 0.6
nt.links.new(rl.outputs['Emission'], glare.inputs['Image'])
lit = mix('ADD', shaded, glare.outputs['Image'])
sa = nt.nodes.new('CompositorNodeSetAlpha'); sa.inputs['Type'].default_value = 'Replace Alpha'
nt.links.new(lit, sa.inputs['Image']); nt.links.new(rl.outputs['Alpha'], sa.inputs['Alpha'])
ao = nt.nodes.new('CompositorNodeAlphaOver'); nt.links.new(sa.outputs['Image'], ao.inputs['Background']); nt.links.new(rl.outputs['Freestyle'], ao.inputs['Foreground'])
go = nt.nodes.new('NodeGroupOutput'); nt.links.new(ao.outputs['Image'], go.inputs['Image'])

# ---- rig: the stance and the actions ---------------------------------------------------------------------------
ANIM = ['root', 'hips', 'chest', 'head', 'upper_arm.L', 'forearm.L', 'hand.L', 'upper_arm.R', 'forearm.R', 'hand.R', 'thigh.L', 'shin.L', 'boot.L', 'thigh.R', 'shin.R', 'boot.R']
for n in ANIM: PARTS[n].rotation_mode = 'XYZ'
STANCE = {'root': (0, 0, -0.04), 'hips': (0, 0, -4), 'chest': (5, 0, -2), 'head': (0, 0, -4),
          'upper_arm.L': (-22, -12, 0), 'forearm.L': (-60, 0, 0), 'hand.L': (0, 0, 0),
          'upper_arm.R': (-24, 24, 0), 'forearm.R': (-92, 0, 0), 'hand.R': (0, 0, 0),
          'thigh.L': (-16, -7, 0), 'shin.L': (20, 0, 0), 'boot.L': (-4, 0, 0),
          'thigh.R': (10, 9, 0), 'shin.R': (14, 0, 0), 'boot.R': (-24, 0, 0)}
def key(frame, over=None):
    p = dict(STANCE); p.update(over or {})
    for n in ANIM:
        o = PARTS[n]
        if n == 'root':
            o.location = p['root']; o.keyframe_insert('location', frame=frame)
        else:
            o.rotation_euler = [math.radians(a) for a in p[n]]; o.keyframe_insert('rotation_euler', frame=frame)
def P(**kw):
    return {k.replace('_L', '.L').replace('_R', '.R'): v for k, v in kw.items()}

# idle 1-48 (loops)
key(1)
key(24, P(root=(0, 0, -0.025), chest=(7, 0, -1), head=(-2, 0, -5), hips=(0, 0, -3), forearm_R=(-106, 0, 0), upper_arm_L=(-26, -12, 0), forearm_L=(-64, 0, 0)))
key(48)
# attack 60-84: wind-up, strike with the far (left) arm, hold, return
key(60)
key(66, P(root=(0, 0.02, -0.06), chest=(2, 0, -14), head=(0, 0, -2), upper_arm_L=(-10, -14, 0), forearm_L=(-88, 0, 0), upper_arm_R=(-40, 16, 0), forearm_R=(-108, 0, 0)))
key(71, P(root=(0, -0.14, -0.08), hips=(0, 0, 6), chest=(10, 0, 22), head=(4, 0, 12), upper_arm_L=(-94, -6, 0), forearm_L=(-6, 0, 0), upper_arm_R=(-48, 20, 0), forearm_R=(-110, 0, 0),
          thigh_L=(-30, -7, 0), shin_L=(34, 0, 0), boot_L=(-4, 0, 0), thigh_R=(24, 9, 0), shin_R=(4, 0, 0), boot_R=(-28, 0, 0)))
key(76, P(root=(0, -0.14, -0.08), hips=(0, 0, 6), chest=(10, 0, 20), head=(4, 0, 12), upper_arm_L=(-92, -6, 0), forearm_L=(-8, 0, 0), upper_arm_R=(-48, 20, 0), forearm_R=(-110, 0, 0),
          thigh_L=(-30, -7, 0), shin_L=(34, 0, 0), boot_L=(-4, 0, 0), thigh_R=(24, 9, 0), shin_R=(4, 0, 0), boot_R=(-28, 0, 0)))
key(84)
# hit 90-110: recoil, recover
key(90)
key(94, P(root=(0, 0.10, -0.03), chest=(-16, 0, -6), head=(-22, 0, -8), upper_arm_L=(-50, -34, 0), forearm_L=(-30, 0, 0), upper_arm_R=(-56, 34, 0), forearm_R=(-40, 0, 0),
          thigh_L=(-6, -7, 0), shin_L=(10, 0, 0), thigh_R=(22, 9, 0), shin_R=(26, 0, 0), boot_R=(-48, 0, 0)))
key(100, P(root=(0, 0.08, -0.04), chest=(-6, 0, -4), head=(-8, 0, -6), upper_arm_L=(-34, -20, 0), forearm_L=(-50, 0, 0), upper_arm_R=(-44, 22, 0), forearm_R=(-80, 0, 0)))
key(110)
# down 120-144: knees buckle, slump to one knee, hold
key(120)
key(128, P(root=(0, 0.02, -0.40), hips=(0, 0, -4), chest=(24, 0, -2), head=(26, 0, -4), upper_arm_L=(-6, -14, 0), forearm_L=(-14, 0, 0), upper_arm_R=(-8, 16, 0), forearm_R=(-12, 0, 0),
          thigh_L=(-78, -10, 0), shin_L=(96, 0, 0), boot_L=(-18, 0, 0), thigh_R=(34, 12, 0), shin_R=(108, 0, 0), boot_R=(-40, 0, 0)))
key(136, P(root=(0, 0.02, -0.44), hips=(0, 0, -4), chest=(30, 0, -2), head=(32, 0, -4), upper_arm_L=(-2, -14, 0), forearm_L=(-8, 0, 0), upper_arm_R=(-4, 16, 0), forearm_R=(-8, 0, 0),
          thigh_L=(-80, -10, 0), shin_L=(100, 0, 0), boot_L=(-20, 0, 0), thigh_R=(36, 12, 0), shin_R=(110, 0, 0), boot_R=(-40, 0, 0)))
key(144, P(root=(0, 0.02, -0.44), hips=(0, 0, -4), chest=(30, 0, -2), head=(32, 0, -4), upper_arm_L=(-2, -14, 0), forearm_L=(-8, 0, 0), upper_arm_R=(-4, 16, 0), forearm_R=(-8, 0, 0),
          thigh_L=(-80, -10, 0), shin_L=(100, 0, 0), boot_L=(-20, 0, 0), thigh_R=(36, 12, 0), shin_R=(110, 0, 0), boot_R=(-40, 0, 0)))
# victory 150-174: crouch, hop with the fist up, land, hold
key(150)
key(155, P(root=(0, 0, -0.12), chest=(10, 0, -2), thigh_L=(-26, -7, 0), shin_L=(36, 0, 0), thigh_R=(0, 9, 0), shin_R=(30, 0, 0), boot_R=(-30, 0, 0)))
key(160, P(root=(0, 0, 0.20), chest=(-6, 0, -2), head=(-10, 0, -6), upper_arm_L=(-172, -8, 0), forearm_L=(-24, 0, 0), upper_arm_R=(-44, 26, 0), forearm_R=(-96, 0, 0),
          thigh_L=(-30, -7, 0), shin_L=(40, 0, 0), boot_L=(10, 0, 0), thigh_R=(-10, 9, 0), shin_R=(44, 0, 0), boot_R=(-20, 0, 0)))
key(166, P(root=(0, 0, -0.06), chest=(4, 0, -2), head=(-6, 0, -6), upper_arm_L=(-168, -8, 0), forearm_L=(-26, 0, 0), upper_arm_R=(-40, 24, 0), forearm_R=(-98, 0, 0),
          thigh_L=(-20, -7, 0), shin_L=(26, 0, 0), thigh_R=(6, 9, 0), shin_R=(18, 0, 0), boot_R=(-24, 0, 0)))
key(174, P(root=(0, 0, -0.04), chest=(2, 0, -2), head=(-6, 0, -6), upper_arm_L=(-166, -8, 0), forearm_L=(-28, 0, 0), upper_arm_R=(-40, 24, 0), forearm_R=(-98, 0, 0)))
# command 180: a point toward the other side (a still)
key(180, P(chest=(6, 0, 14), head=(2, 0, 8), upper_arm_L=(-86, -6, 0), forearm_L=(0, 0, 0), upper_arm_R=(-36, 16, 0), forearm_R=(-104, 0, 0)))

ACTIONS = {'idle': (1, 45, 4), 'attack': (60, 84, 3), 'hit': (90, 110, 3), 'down': (120, 144, 3), 'victory': (150, 174, 3), 'command': (180, 180, 1)}
os.makedirs(OUT, exist_ok=True)
def render(path, frame):
    sc.frame_set(frame); sc.render.filepath = path; bpy.ops.render.render(write_still=True)
if MODE == 'still':
    render(os.path.join(OUT, 'still_stance.png'), 1)
    render(os.path.join(OUT, 'still_strike.png'), 71)
    cam.data.ortho_scale = 0.72; aim.location = (0, 0, 1.66); sc.render.resolution_x = 768; sc.render.resolution_y = 768; sc.render.line_thickness = 4.0
    render(os.path.join(OUT, 'still_face.png'), 1)
elif MODE == 'quick':
    for name, (a, b, step) in ACTIONS.items():
        render(os.path.join(OUT, f'quick_{name}.png'), a if name != 'attack' else 71)
else:
    for name, (a, b, step) in ACTIONS.items():
        d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
        for i, f in enumerate(range(a, b + 1, step)):
            path = os.path.join(d, f'f_{i:02d}.png')
            if os.path.exists(path): continue
            render(path, f)
            print('rendered', name, i, flush=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'ttl_zero.blend'))
print('done', MODE)
