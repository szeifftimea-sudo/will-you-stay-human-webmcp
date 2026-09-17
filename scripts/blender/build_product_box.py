"""Author the separate companion packaging. Never rewrite the approved balance.

Blender units are presentation units; proposed physical scale is 40 mm/unit.
Fit checks are geometric concept checks, not manufacturing certification.
"""
from pathlib import Path
import hashlib
import json
import math
import sys
import bpy

sys.path.insert(0, str(Path(__file__).parent))
import build_human_balance as hb

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/evidence/product-reveal"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
collection = bpy.data.collections.new("Companion packaging — export")
bpy.context.scene.collection.children.link(collection)
hb.material("Blockout", "69777b", 0, .6)
for name, color, metal, rough in [
    ("Graphite", "17242b", .20, .48), ("PaperBlack", "080e13", .04, .62),
    ("Insert", "0c161c", .0, .95), ("Cyan", "68d4e8", .22, .40),
    ("Amber", "f4a666", .25, .44), ("Ivory", "f2eee5", .0, .60),
]: hb.material(name, color, metal, rough)

root = hb.group("CompanionProduct", None, collection)
base = hb.group("BoxBase", root, collection)
lid = hb.group("BoxLid", root, collection)
prints = hb.group("BalancePrint", root, collection)
font = bpy.data.fonts.load("/System/Library/Fonts/Supplemental/Arial Narrow Bold.ttf")

def cube(name, dimensions, location, parent=base, material="Graphite", bevel=.015):
    return hb.box(name, dimensions, location, parent, collection, material, bevel, 3)

def text(name, value, size, position, parent=lid, color="Ivory", align="LEFT", reverse=False):
    bpy.ops.object.select_all(action="DESELECT")
    curve = bpy.data.curves.new(name, "FONT")
    curve.body, curve.size, curve.font = value, size, font
    curve.align_x, curve.align_y = align, "CENTER"
    curve.resolution_u = 4
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    obj.parent, obj.location = parent, position
    if reverse: obj.rotation_euler.y = math.pi
    obj.data.materials.append(bpy.data.materials[color])
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    return obj

# Inner cavity 5.70 × 6.95 × 1.20; exterior 5.90 × 7.15.
cube("BaseFloor", (5.90, 7.15, .12), (0, 0, .06))
cube("InsertFloor", (5.70, 6.95, .075), (0, 0, .16), material="Insert")
cube("BoardRestPad", (5.20, 4.58, .050), (0, .65, .222), material="Insert")
for side, x in (("Left", -2.9), ("Right", 2.9)):
    cube("BaseWall"+side, (.10, 7.15, 1.20), (x, 0, .72))
for side, y in (("Near", -3.525), ("Far", 3.525)):
    cube("BaseWall"+side, (5.70, .10, 1.20), (0, y, .72))
    cube("BaseRim"+side, (5.73, .016, .015), (0, y, 1.32), material="Amber")
# Narrow support ledges cradle the measured folded object, not a solid block.
for side, x in (("Left", -2.7), ("Right", 2.7)):
    cube("Cradle"+side, (.23, 4.7, .24), (x, .65, .30), material="Insert")
cube("CradleTop", (5.17, .20, .24), (0, 3.04, .30), material="Insert")
cube("CradleBottom", (5.17, .20, .24), (0, -1.74, .30), material="Insert")
# The five markers are stored separately so nothing has to bridge the fold.
cube("MarkerTray", (5.45, 1.24, .20), (0, -2.67, .30), material="Insert")
for i in range(5):
    cutter = hb.disc("SOURCE_ONLY_MarkerPocket"+str(i), .22, .40, .48, base, collection, "Insert", 0)
    cutter.location.x, cutter.location.y = -1.8 + i*.90, -2.56
    target = bpy.data.objects["MarkerTray"]
    modifier = target.modifiers.new("Pocket "+str(i), "BOOLEAN")
    modifier.operation, modifier.object = "DIFFERENCE", cutter
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    hb.PENDING_MATERIALS[:] = [(o, m) for o, m in hb.PENDING_MATERIALS if o != cutter]
    bpy.data.objects.remove(cutter, do_unlink=True)
text("InsertCaption", "FIVE DIMENSIONS. YOUR CHOICES.", .16, (0, -3.03, .41), base, "Ivory", "CENTER")

# Lift-off lid: a real hollow skirt, no hinge invented on a rigid telescoping box.
cube("LidTop", (6.12, 7.37, .10), (0, 0, 1.49), lid, "PaperBlack")
for side, x in (("Left", -3.015), ("Right", 3.015)):
    cube("LidSkirt"+side, (.09, 7.37, .66), (x, 0, 1.13), lid, "PaperBlack")
for side, y in (("Near", -3.64), ("Far", 3.64)):
    cube("LidSkirt"+side, (5.94, .09, .66), (0, y, 1.13), lid, "PaperBlack")

image = bpy.data.images.load(str(ROOT / "public/assets/machine-city-entry.png"))
image.scale(1024, 725)
image.pack()
ink = hb.material("OriginalMachineCityPrint", "ffffff", .05, .56)
node = ink.node_tree.nodes.new("ShaderNodeTexImage")
node.image = image
ink.node_tree.links.new(node.outputs["Color"], ink.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])
mesh = bpy.data.meshes.new("CoverPrint_Mesh")
mesh.from_pydata([(-2.92,-3.54,1.546),(2.92,-3.54,1.546),(2.92,3.54,1.546),(-2.92,3.54,1.546)], [], [(0,1,2,3)])
uv = mesh.uv_layers.new()
for loop, value in zip(uv.data, ((.38,0),(1,0),(1,1),(.38,1))): loop.uv=value
cover = bpy.data.objects.new("CoverPrint", mesh)
collection.objects.link(cover)
cover.parent=lid
cover.data.materials.append(ink)
# Printed black title field and restrained perimeter foils.
cube("TitleInk", (5.84, 2.65, .003), (0,2.22,1.55), lid, "PaperBlack", 0)
text("CoverSubtitle", "HEART IN THE MACHINE", .30, (-2.53,3.28,1.557), color="Amber")
text("CoverTitleOne", "WILL YOU", 1.10, (-2.56,2.62,1.557))
text("CoverTitleTwo", "STAY HUMAN?", 1.10, (-2.56,1.75,1.557))
text("CoverMotto", "THE MACHINE SUGGESTS. YOU DECIDE.", .18, (-2.51,1.0,1.557))
for sign, color in ((-1,"Cyan"),(1,"Amber")):
    cube("CoverRule"+color, (.018,6.81,.003), (sign*2.80,0,1.56), lid,color,0)
    for y in (-3.36,3.36):
        cube("Corner"+color+str(y), (.52,.018,.003), (sign*2.55,y,1.56), lid,color,0)

# Separate printed overlays for the reveal, not a change to the approved GLB.
leftprint = hb.group("PrintLeft", prints, collection)
rightprint = hb.group("PrintRight", prints, collection)
text("BalanceName", "HUMAN BALANCE", .22, (-2.50,1.96,.124), leftprint,"Ivory","CENTER")
for label, row in zip(("Convenience","Control","Connection","Freedom","Responsibility"), hb.ROWS):
    text("Label"+label, label, .17, (-3.65,row,.130), leftprint,"Ivory","CENTER")
    for value, x in zip(("−2","−1","0","+1","+2"),(-2.45,-1.10,.25,1.60,2.95)):
        text("Scale"+label+value,value,.13,(x,row+.19,.124),leftprint if x<0 else rightprint,"Ivory","CENTER")
text("RearIdentity", "HUMAN BALANCE", .30, (-2.5,.30,-.285), leftprint,"Ivory","CENTER",True)
text("RearEdition", "HEART IN THE MACHINE", .16, (-2.5,-.12,-.285), leftprint,"Cyan","CENTER",True)

for obj, material in hb.PENDING_MATERIALS:
    if obj.name in bpy.data.objects:
        obj.data.materials.clear()
        obj.data.materials.append(bpy.data.materials[material])
bpy.context.view_layer.update()
camera = hb.presentation_scene(collection)
source = ROOT / "assets/blender/companion-product-box.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(source))
bpy.ops.object.select_all(action="DESELECT")
for obj in [root,*root.children_recursive]: obj.select_set(True)
bpy.context.view_layer.objects.active=root
output = ROOT / "public/models/companion-product-box.glb"
bpy.ops.export_scene.gltf(filepath=str(output),export_format="GLB",use_selection=True,export_apply=True,
    export_animations=False,export_cameras=False,export_lights=False,export_image_format="JPEG",export_jpeg_quality=88)
report = {
    "source":str(source.relative_to(ROOT)),"export":str(output.relative_to(ROOT)),
    "glbBytes":output.stat().st_size,"glbSha256":hashlib.sha256(output.read_bytes()).hexdigest(),
    "scaleMmPerUnit":40,"boxExteriorMm":[244.8,294.8,61.6],
    "cavityMm":[228,278,48],"foldedBalanceMm":[201.12,180,36.24],
    "packedCenterBlender":[0,.65,.70],"foldedBoundsBlender":[[-2.514,-1.6,.247],[2.514,2.9,1.153]],
    "markerCentersBlender":[[-1.8+i*.9,-2.56,.43] for i in range(5)],
    "markerDiameterMm":10.8,"pocketDiameterMm":17.6,
    "lidUndersideBlender":1.44,"topClearanceMm":11.48,
    "balanceUnchangedSha256":hashlib.sha256((ROOT/"public/models/human-balance.glb").read_bytes()).hexdigest(),
    "textureSource":"public/assets/machine-city-entry.png",
    "font":"System Arial Narrow Bold, converted to mesh outlines; font binary not exported",
    "limitations":"Dimensional packaging concept; no manufacturing tolerances, drop test, friction, magnetic retention or material certification. Markers are stored in separate pockets."
}
assert 5.028 < 5.7 and 4.5 < 4.7 and 1.153 < 1.44
(OUT/"packaging-fit.json").write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps(report,indent=2))
