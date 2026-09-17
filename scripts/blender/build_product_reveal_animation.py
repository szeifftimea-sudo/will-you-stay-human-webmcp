"""Separate, editable product-presentation animation; frozen gameplay assets are inputs.

30 fps, frames 1–181: closed box → open box → lifted, unfolded companion.
The exported Blender clip, not browser hinge math, is the motion source of truth.
No session, score, decision, or gameplay data is part of this asset.
"""
from pathlib import Path
import hashlib
import json
import math
import struct
import sys
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/evidence/product-reveal/master-flow"
OUT.mkdir(parents=True, exist_ok=True)
INPUTS = [ROOT / "public/models/companion-product-box.glb", ROOT / "public/models/human-balance.glb"]
before = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in INPUTS}
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for path in INPUTS:
    bpy.ops.import_scene.gltf(filepath=str(path))

def empty(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    return obj

def attach(obj, parent):
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.matrix_world = world
    bpy.context.view_layer.update()

root = empty("ProductRevealRig")
package = empty("RevealPackaging", root)
board = empty("RevealBalance", root)
markers_root = empty("RevealMarkers", root)
base, lid = bpy.data.objects["BoxBase"], bpy.data.objects["BoxLid"]
attach(base, package)
attach(lid, package)
housing = bpy.data.objects["Housing"]
attach(housing, board)
left, right = bpy.data.objects["FoldLeft"], bpy.data.objects["FoldRight"]
attach(left, board)
attach(right, board)
for obj in (root, lid, board, left, right):
    obj.rotation_mode = "XYZ"
axes = ["comfort", "control", "connection", "freedom", "responsibility"]
for axis in axes:
    for prefix, leaf in (("RailLeft_", left), ("RailRight_", right), ("Label_", left), ("Zero_", right)):
        attach(bpy.data.objects[prefix + axis], leaf)
attach(bpy.data.objects["PrintLeft"], left)
attach(bpy.data.objects["PrintRight"], right)
markers = []
for i, axis in enumerate(axes):
    obj = bpy.data.objects["Marker_" + axis]
    attach(obj, markers_root)
    markers.append((obj, obj.location.copy(), Vector((-1.8+i*.90, -2.56, .43))))

sys.path.insert(0, str(Path(__file__).resolve().parent))
from product_reveal_details import detail_product
detail_report = detail_product(base, lid, left, markers)

def ease(x):
    t = max(0., min(1., x))
    return t*t*(3-2*t)

def key(obj, frame):
    obj.keyframe_insert("location", frame=frame, group="Product motion")
    obj.keyframe_insert("rotation_euler", frame=frame, group="Product motion")

scene = bpy.context.scene
scene.name = "ProductReveal"
scene.render.fps = 30
scene.frame_start, scene.frame_end = 1, 181
for frame in range(1, 182):
    time = (frame-1)/30
    position = 1 + time/1.8 if time <= 1.8 else 2 + (time-1.8)/4.2
    standing = 1-ease((position-1)/.25)
    root.rotation_euler = (standing*math.pi/2, 0, 0)
    root.location = (1.8*standing, 0, 3.685*math.sin(standing*math.pi/2))
    opening = max(0., min(1., (position-1.25)/.75))
    lid.location = (-6.5*ease((opening-.35)/.65), 0,
                    2*ease(opening/.40)-2.8*ease((opening-.72)/.28))
    # First release the telescoping fit, then carry the lid sideways with a
    # restrained wrist-like tilt. Land flat; no invented hinge on a lift-off lid.
    lid.rotation_euler = (.045*math.sin(math.pi*opening),
                          -.075*math.sin(math.pi*opening),
                          -.035*math.sin(math.pi*opening))
    unfold_time = max(0., min(1., position-2))
    lift = ease(unfold_time/.32)
    unfold = ease((unfold_time-.35)/.40)
    board.location = (-2.656*(1-unfold), .65-2.3*unfold, .70+3*lift-2*unfold)
    board.rotation_euler = (0, (1-unfold)*math.pi/2, 0)
    left.rotation_euler = (0, (1-unfold)*math.pi/2, 0)
    right.rotation_euler = (0, -(1-unfold)*math.pi/2, 0)
    bpy.context.view_layer.update()
    for i, (obj, original, pocket) in enumerate(markers):
        progress = ease((unfold_time-.76-i*.035)/.10)
        destination = markers_root.matrix_world.inverted() @ board.matrix_world @ original
        obj.location = pocket.lerp(destination, progress)
        obj.location.z += math.sin(progress*math.pi)*1.2
        obj.keyframe_insert("location", frame=frame, group="Marker seating")
    for obj in (root, lid, board, left, right):
        key(obj, frame)

# Scene timeline bookmarks remain editable in Blender.
for name, frame in (("02 BOX HERO", 1), ("03 CONTENTS REVEALED", 55),
                    ("04 CLEAR OF BOX", 98), ("04 HINGES OPEN", 125),
                    ("04 OPEN COMPANION", 150), ("04 MARKERS AT ZERO", 181)):
    scene.timeline_markers.new(name, frame=frame)
scene.frame_set(55)
# A review camera and studio lights are source-only, not exported to the game.
camera_data = bpy.data.cameras.new("Product review camera")
camera = bpy.data.objects.new("Product review camera", camera_data)
scene.collection.objects.link(camera)
camera.location = (6, -16, 22)
camera.rotation_euler = (Vector((-1.5, 0, 1.5))-camera.location).to_track_quat("-Z", "Y").to_euler()
camera_data.lens = 48
scene.camera = camera
for name, location, energy, size, color in (
    ("Softbox", (-5, -5, 12), 1800, 8, (.86,.95,1)),
    ("Cyan edge", (8, 4, 8), 1400, 6, (.40,.83,.91)),
    ("Warm edge", (-8, 3, 5), 1000, 5, (1,.65,.37)),
):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.shape, data.size, data.color = energy, "DISK", size, color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (-obj.location).to_track_quat("-Z", "Y").to_euler()
for image in bpy.data.images:
    if image.has_data: image.pack()
source = ROOT / "assets/blender/product-reveal-animated.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(source))
bpy.ops.object.select_all(action="DESELECT")
for obj in [root, *root.children_recursive]: obj.select_set(True)
bpy.context.view_layer.objects.active = root
output = ROOT / "public/models/product-reveal-animated.glb"
bpy.ops.export_scene.gltf(filepath=str(output), export_format="GLB", use_selection=True,
    export_animations=True, export_animation_mode="ACTIVE_ACTIONS",
    export_nla_strips_merged_animation_name="ProductReveal", export_anim_slide_to_zero=True,
    export_frame_range=True, export_force_sampling=True, export_cameras=False,
    export_lights=False, export_image_format="AUTO", export_apply=True)
blob = output.read_bytes()
json_length = struct.unpack_from("<I", blob, 12)[0]
gltf = json.loads(blob[20:20+json_length])
assert len(gltf.get("animations", [])) == 1, "One coordinated Blender clip must be exported"
animation = gltf["animations"][0]
targets = sorted({gltf["nodes"][c["target"]["node"]]["name"] for c in animation["channels"]})
assert {"FoldLeft", "FoldRight", "RevealBalance", "BoxLid"}.issubset(targets)
assert before == {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in INPUTS}
report = {
    "source": str(source.relative_to(ROOT)), "export": str(output.relative_to(ROOT)),
    "glbBytes": len(blob), "sha256": hashlib.sha256(blob).hexdigest(),
    "fps": 30, "frames": [1, 181], "durationSeconds": 6,
    "animationName": animation["name"], "animatedNodes": targets,
    "inputsUnchanged": before,
    "productDetailing": detail_report,
    "operations": ["Import frozen assets as a separate derivative", "Parent rails and print to hinge leaves",
        "Author lift-off lid motion", "Lift folded balance clear of cavity", "Keyframe both hinge pivots",
        "Seat five markers sequentially at neutral zero", "Export one sampled glTF animation clip"],
    "limitation": "Presentation prototype, not manufacturing validation or gameplay result data."
}
(OUT / "blender-animation.json").write_text(json.dumps(report, indent=2)+"\n")
print(json.dumps(report, indent=2))
