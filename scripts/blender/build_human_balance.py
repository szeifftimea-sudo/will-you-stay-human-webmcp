"""Build the editable, geometry-only Machine City Human Balance instrument.

Run with the locally installed Blender (no pip packages are required):
  Blender --background --python scripts/blender/build_human_balance.py

This authoring recipe deliberately contains no game state, score/delta calculation,
text, or interaction. Semantic groups let the web presentation position the five
independent sliders from the existing domain-backed HTML presentation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import sys
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


ROOT = Path(__file__).resolve().parents[2]
AXES = ("comfort", "control", "connection", "freedom", "responsibility")
ROWS = (1.15, 0.575, 0.0, -0.575, -1.15)
RAIL_START, RAIL_END, ZERO_X = -2.5, 3.0, 0.25
FOLD_PIVOT_Z = 0.17
FOLD_GAP = 0.036
RAIL_GAP = 0.08
FOLD_ATTACHMENTS: dict[str, list[bpy.types.Object]] = {"Left": [], "Right": []}
PALETTE = {
    "petrol": "061014",
    "petrol_deep": "02090c",
    "cyan": "68d4e8",
    "neutral": "d7e8e7",
    "amber": "f4a666",
    "ivory": "f2eee5",
    "muted": "b8c1bf",
}
PENDING_MATERIALS: list[tuple[bpy.types.Object, str]] = []


def linear_rgba(hex_value: str) -> tuple[float, float, float, float]:
    def linear(value: float) -> float:
        return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4

    return tuple(linear(int(hex_value[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)


def material(name: str, color: str, metalness: float, roughness: float,
             emission: float = 0.0) -> bpy.types.Material:
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    result.diffuse_color = linear_rgba(color)
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = result.diffuse_color
    shader.inputs["Metallic"].default_value = metalness
    shader.inputs["Roughness"].default_value = roughness
    if emission:
        shader.inputs["Emission Color"].default_value = result.diffuse_color
        shader.inputs["Emission Strength"].default_value = emission
    return result


def city_print_material(texture_path: Path) -> bpy.types.Image:
    """One embedded, non-emissive printed illustration shared by both halves."""
    image = bpy.data.images.load(str(texture_path), check_existing=True)
    image.name = "HumanBalanceCityPrint"
    image.colorspace_settings.name = "sRGB"
    image.pack()
    result = material("Face_CityPrint", "141c20", 0.20, 0.68)
    texture = result.node_tree.nodes.new("ShaderNodeTexImage")
    texture.name = "Embedded city illustration — no labels or values"
    texture.image = image
    texture.interpolation = "Linear"
    texture.extension = "EXTEND"
    shader = result.node_tree.nodes.get("Principled BSDF")
    result.node_tree.links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    return image


def set_city_print_uv() -> None:
    """Continuous print over the open 10×4.5 panel; +Y is the image's top."""
    bpy.context.view_layer.update()
    face_names = ("HousingFaceLeft", "HousingFaceRight")
    # Primitives include automatic UV maps even when their solid-color material
    # never samples a texture. Omit those unused channels without changing any
    # geometry, color or texture quality; only the two printed skins need UV0.
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.name not in face_names:
            for unused in list(obj.data.uv_layers):
                obj.data.uv_layers.remove(unused)
    for name in face_names:
        obj = bpy.data.objects[name]
        uv = obj.data.uv_layers.new(name="CityPrintUV")
        for loop in obj.data.loops:
            position = obj.matrix_world @ obj.data.vertices[loop.vertex_index].co
            uv.data[loop.index].uv = ((position.x + 5.0) / 10.0,
                                     (position.y + 2.25) / 4.5)


def move_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    for previous in list(obj.users_collection):
        previous.objects.unlink(obj)
    collection.objects.link(obj)


def group(name: str, parent: bpy.types.Object | None,
          collection: bpy.types.Collection) -> bpy.types.Object:
    result = bpy.data.objects.new(name, None)
    collection.objects.link(result)
    result.parent = parent
    result.empty_display_type = "PLAIN_AXES"
    result.empty_display_size = 0.08
    return result


def finish_mesh(obj: bpy.types.Object, name: str, parent: bpy.types.Object,
                collection: bpy.types.Collection, material_name: str,
                bevel: float = 0.0, segments: int = 2) -> bpy.types.Object:
    obj.name = name
    obj.data.name = name + "_Mesh"
    obj.parent = parent
    move_to_collection(obj, collection)
    obj.data.materials.append(bpy.data.materials["Blockout"])
    PENDING_MATERIALS.append((obj, material_name))
    if bevel:
        modifier = obj.modifiers.new("Editable manufactured edge", "BEVEL")
        modifier.width = bevel
        modifier.segments = segments
        modifier.limit_method = "ANGLE"
        modifier.harden_normals = True
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
        normal = obj.modifiers.new("Weighted face normals", "WEIGHTED_NORMAL")
        normal.keep_sharp = True
        normal.weight = 50
    return obj


def box(name: str, dimensions: tuple[float, float, float],
        location: tuple[float, float, float], parent: bpy.types.Object,
        collection: bpy.types.Collection, material_name: str,
        bevel: float = 0.018, segments: int = 2) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish_mesh(obj, name, parent, collection, material_name, bevel, segments)


def disc(name: str, radius: float, depth: float, z: float,
         parent: bpy.types.Object, collection: bpy.types.Collection,
         material_name: str, bevel: float = 0.008) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=depth,
                                       location=(0, 0, z))
    return finish_mesh(bpy.context.object, name, parent, collection,
                       material_name, bevel, 1)


def plaque(name: str, width: float, height: float, depth: float,
           location: tuple[float, float, float], parent: bpy.types.Object,
           collection: bpy.types.Collection, material_name: str) -> bpy.types.Object:
    """Low raised six-sided plaque: physical label support, deliberately no text."""
    tip = min(height * 0.38, width * 0.12)
    outline = [(-width / 2, 0), (-width / 2 + tip, -height / 2),
               (width / 2 - tip, -height / 2), (width / 2, 0),
               (width / 2 - tip, height / 2), (-width / 2 + tip, height / 2)]
    vertices = [(x, y, z) for z in (-depth / 2, depth / 2) for x, y in outline]
    faces = [tuple(reversed(range(6))), tuple(range(6, 12))]
    faces.extend((i, (i + 1) % 6, (i + 1) % 6 + 6, i + 6) for i in range(6))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.location = location
    return finish_mesh(obj, name, parent, collection, material_name, 0.006, 1)


def panel(name: str, dimensions: tuple[float, float, float],
          location: tuple[float, float, float], side: str,
          parent: bpy.types.Object, collection: bpy.types.Collection,
          material_name: str, outer_radius: float, edge_bevel: float) -> bpy.types.Object:
    """Thin shell with separately controlled XY corner radii.

    A conventional cube bevel is clamped by the very small shell thickness.
    This editable planar profile rounds only the outside product corners while
    keeping the two central fold edges almost square and accurately separated.
    """
    width, height, depth = dimensions
    outline = []
    for xsign, ysign, start in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        outside = (side == "Left" and xsign < 0) or (side == "Right" and xsign > 0)
        radius = outer_radius if outside else 0.012
        center_x, center_y = xsign * (width / 2 - radius), ysign * (height / 2 - radius)
        for index in range(7 if outside else 3):
            count = 6 if outside else 2
            angle = math.radians(start + index * 90 / count)
            outline.append((center_x + radius * math.cos(angle), center_y + radius * math.sin(angle)))
    count = len(outline)
    vertices = [(x, y, z) for z in (-depth / 2, depth / 2) for x, y in outline]
    faces = [tuple(reversed(range(count))), tuple(range(count, count * 2))]
    faces.extend((i, (i + 1) % count, (i + 1) % count + count, i + count) for i in range(count))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.location = location
    return finish_mesh(obj, name, parent, collection, material_name, edge_bevel, 1)


def perimeter_detail(side: str, parent: bpy.types.Object,
                     collection: bpy.types.Collection, material_name: str) -> None:
    """Batched thin inlays confined to the safe outer/title border channels.

    Each half exports one mesh and one existing accent material. These are
    quiet physical surface markings, not additional lights or gameplay objects.
    """
    sign = -1 if side == "Left" else 1
    vertices, faces = [], []
    z = 0.098

    def line(points: list[tuple[float, float]], width: float = 0.013) -> None:
        points = [(x * sign, y) for x, y in points]
        start = len(vertices)
        for index, (x, y) in enumerate(points):
            previous, following = points[max(0, index - 1)], points[min(len(points) - 1, index + 1)]
            dx, dy = following[0] - previous[0], following[1] - previous[1]
            length = math.hypot(dx, dy)
            nx, ny = -dy * width / (2 * length), dx * width / (2 * length)
            vertices.extend(((x + nx, y + ny, z), (x - nx, y - ny, z)))
        for index in range(len(points) - 1):
            current = start + index * 2
            faces.append((current, current + 1, current + 3, current + 2))

    def arc(x: float, y: float, radius: float, first: float, last: float,
            width: float = 0.013, steps: int = 10, ysign: int = 1) -> None:
        line([(x + radius * math.cos(math.radians(first + (last - first) * index / steps)),
               ysign * (y + radius * math.sin(math.radians(first + (last - first) * index / steps))))
              for index in range(steps + 1)], width)

    def dot(x: float, y: float, radius: float = 0.017) -> None:
        start = len(vertices)
        vertices.extend((x * sign + radius * math.cos(index * math.tau / 8),
                         y + radius * math.sin(index * math.tau / 8), z) for index in range(8))
        faces.append(tuple(range(start, start + 8)))

    for ysign in (-1, 1):
        # Two partial corner returns, one completing the main thin border.
        arc(4.63, 1.87, 0.170, 0, 90, 0.015, 12, ysign)
        arc(4.63, 1.87, 0.115, 12, 79, 0.010, 9, ysign)
        line([(4.69, ysign * 1.43), (4.69, ysign * 1.68),
              (4.735, ysign * 1.74), (4.735, ysign * 1.82)], 0.011)
        for y in (1.33, 1.24, 1.17):
            dot(4.69, ysign * y, 0.012)
        # Fine asymmetrical parallel traces and sparse nodes in the outer bands.
        line([(3.34, ysign * 1.985), (4.08, ysign * 1.985)], 0.010)
        line([(4.18, ysign * 1.985), (4.37, ysign * 1.985)], 0.010)
        for x, radius in ((4.45, 0.014), (4.51, 0.010), (4.565, 0.008)):
            dot(x, ysign * 1.985, radius)
        line([(4.65, ysign * 0.70), (4.65, ysign * 0.96),
              (4.705, ysign * 1.025)], 0.011)
        arc(4.65, ysign * 0.61, 0.030, 0, 360, 0.010, 12)

    # Partial orbital motifs stay outside the responsive label and rail field.
    arc(4.82, 0, 0.195, 104, 256, 0.012, 16)
    arc(4.82, 0, 0.133, 112, 248, 0.009, 12)
    line([(4.615, -0.31), (4.615, -0.225)], 0.009)
    line([(4.615, 0.225), (4.615, 0.31)], 0.009)

    # Small circuit forks flank the title, rather than filling its readable area.
    line([(2.06, 1.94), (2.19, 1.94), (2.245, 1.985), (2.58, 1.985)], 0.013)
    line([(2.19, 1.94), (2.255, 1.89), (2.46, 1.89)], 0.009)
    for x, y, radius in ((2.635, 1.985, 0.019), (2.715, 1.985, 0.012),
                         (2.515, 1.89, 0.012)):
        dot(x, y, radius)
    for x, radius in ((0.40, 0.018), (0.50, 0.013), (0.59, 0.011), (0.68, 0.008)):
        dot(x, -1.985, radius)
    line([(0.79, -1.985), (1.18, -1.985)], 0.010)
    line([(1.28, -1.985), (1.43, -1.985)], 0.010)

    mesh = bpy.data.meshes.new("PerimeterDetail" + side + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("PerimeterDetail" + side, mesh)
    collection.objects.link(obj)
    finish_mesh(obj, obj.name, parent, collection, material_name)


def ring(name: str, outer: float, inner: float, depth: float, z: float,
         parent: bpy.types.Object, collection: bpy.types.Collection,
         material_name: str, segments: int = 40) -> bpy.types.Object:
    """A closed low-poly machined ring, not a decorative gear."""
    vertices, faces = [], []
    for layer_z, radius in ((z - depth / 2, outer), (z + depth / 2, outer),
                            (z - depth / 2, inner), (z + depth / 2, inner)):
        vertices.extend((radius * math.cos(i * math.tau / segments),
                         radius * math.sin(i * math.tau / segments), layer_z)
                        for i in range(segments))
    for i in range(segments):
        j = (i + 1) % segments
        faces.extend(((i, j, segments + j, segments + i),
                      (2 * segments + j, 2 * segments + i,
                       3 * segments + i, 3 * segments + j),
                      (segments + i, segments + j, 3 * segments + j, 3 * segments + i),
                      (j, i, 2 * segments + i, 2 * segments + j)))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return finish_mesh(obj, name, parent, collection, material_name, 0.003, 1)


def keyhole_cutter(name: str, x: float, y: float,
                   collection: bpy.types.Collection) -> bpy.types.Object:
    """Closed screw-head pocket with a narrower upward hanging slot.

    This source-only solid is subtracted from the rear metalwork. It is not an
    engraved symbol or an extra exported node, and performs no gameplay role.
    """
    radius, neck = 0.070, 0.031
    circle_y = -0.036
    junction_angle = math.acos(neck / radius)
    outline = [(-neck, 0.100), (neck, 0.100)]
    for index in range(29):
        angle = junction_angle - (math.tau - 2 * (math.pi / 2 - junction_angle)) * index / 28
        outline.append((radius * math.cos(angle), circle_y + radius * math.sin(angle)))
    count = len(outline)
    vertices = [(px, py, z) for z in (-0.32, -0.205) for px, py in outline]
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces.extend((index, index + count, (index + 1) % count + count, (index + 1) % count)
                 for index in range(count))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    result = bpy.data.objects.new(name, mesh)
    collection.objects.link(result)
    result.location = (x, y, 0)
    result.display_type = "WIRE"
    result.hide_render = True
    result.hide_set(True)
    return result


def difference(obj: bpy.types.Object, cutter: bpy.types.Object) -> None:
    modifier = obj.modifiers.new("Editable rear mounting pocket", "BOOLEAN")
    modifier.operation = "DIFFERENCE"
    modifier.solver = "EXACT"
    modifier.object = cutter


def follow_fold(obj: bpy.types.Object, fold: bpy.types.Object) -> None:
    constraint = obj.constraints.new("CHILD_OF")
    constraint.name = "Source folding assembly — no gameplay"
    constraint.target = fold
    constraint.inverse_matrix = fold.matrix_world.inverted()


def hinge_barrel(name: str, y: float, length: float, parent: bpy.types.Object,
                 collection: bpy.types.Collection, radius: float = 0.028) -> None:
    if radius > 0.02:
        obj = ring(name, radius, 0.010, length, 0, parent, collection, "Face_DarkPetrol", segments=16)
    else:
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=length)
        obj = finish_mesh(bpy.context.object, name, parent, collection, "Face_DarkPetrol", 0.001, 1)
    obj.location = (0, y, FOLD_PIVOT_Z)
    obj.rotation_euler.x = math.pi / 2


def create_instrument(collection: bpy.types.Collection,
                      cutters: bpy.types.Collection) -> bpy.types.Object:
    root = group("HumanBalance", None, collection)
    housing = group("Housing", root, collection)
    halves = {side: group("Fold" + side, housing, collection) for side in ("Left", "Right")}
    half_cutters = []
    # A thin tabletop product, not a stacked equipment case. The reference's
    # broad face, restrained edge and central fold are the primary silhouette.
    for index, (side, sign) in enumerate((("Left", -1), ("Right", 1))):
        half = halves[side]
        center = sign * (5 + FOLD_GAP / 2) / 2
        accent = "Presence_Cyan" if side == "Left" else "RetainedMark_Amber"
        body = panel("HousingBody" + side, (5 - FOLD_GAP / 2, 4.5, 0.32),
                     (center, 0, -0.090), side, half, collection, "Housing_DarkPetrol", 0.150, 0.020)
        panel("HousingFrontBezel" + side, (4.952, 4.47, 0.015), (center, 0, 0.073),
              side, half, collection, "Edge_IvoryMetal", 0.135, 0.003)
        panel("HousingFace" + side, (4.922, 4.43, 0.012), (center, 0, 0.086),
              side, half, collection, "Face_CityPrint", 0.120, 0.002)
        # Keep the bright perimeter on the outside only. Its inner return is a
        # quiet dark fold edge, rather than two silver stripes down the center.
        box("FoldEdgeIndex" + side, (0.024, 4.428, 0.010),
            (sign * 0.042, 0, 0.088), half, collection, "Face_DarkPetrol", 0.001, 1)
        backplate = panel("HousingBackplate" + side, (4.85, 4.36, 0.020),
                          (center, 0, -0.261), side, half, collection, "Edge_IvoryMetal", 0.115, 0.004)
        # One complete nameplate belongs to one leaf. No letter or rigid plaque
        # bridges the hinge, even while the physical assembly closes.
        if side == "Left":
            plaque("TitlePlaqueRimLeft", 4.12, 0.38, 0.012,
                   (-2.5, 1.96, 0.098), half, collection, "Edge_IvoryMetal")
            plaque("TitlePlaqueLeft", 4.07, 0.34, 0.016,
                   (-2.5, 1.96, 0.107), half, collection, "Bezel_DarkPetrol")
            box("TitlePlaqueInlayLeft", (3.74, 0.010, 0.005),
                (-2.5, 2.105, 0.119), half, collection, accent, 0.002, 1)
        box("OuterInlay" + side, (0.013, 3.74, 0.005), (sign * 4.80, 0, 0.095),
            half, collection, accent, 0.002, 1)
        box("LowerInlay" + side, (4.32, 0.013, 0.005), (sign * 2.47, -2.04, 0.095),
            half, collection, accent, 0.002, 1)
        box("UpperInlay" + side, (2.42, 0.013, 0.005), (sign * 3.42, 2.04, 0.095),
            half, collection, accent, 0.002, 1)
        perimeter_detail(side, half, collection, accent)
        mount_x = sign * 3.60
        mount = box("RearKeyholePlate_" + str(index), (0.30, 0.34, 0.012),
                    (mount_x, 1.65, -0.277), half, collection, "Mount_Muted", 0.005, 2)
        cutter = keyhole_cutter("SOURCE_ONLY_KeyholeCutter_" + str(index), mount_x, 1.65, cutters)
        half_cutters.append((cutter, half))
        for target in (mount, backplate, body):
            difference(target, cutter)
        for pad, y in enumerate((-1.76, 1.76)):
            box("RearWallSpacer" + side + "_" + str(pad), (0.18, 0.22, 0.012),
                (sign * 4.27, y, -0.277), half, collection, "Seal_PetrolDeep", 0.005, 2)

    # Small interleaved knuckles and shallow hidden leaves: enough front clearance
    # for the raised tokens when folded, without oversized equipment hardware.
    for index, y in enumerate((2.12, 0.2875, -2.12)):
        for side, sign in (("Left", -1), ("Right", 1)):
            box("HingeLeaf" + side + "_" + str(index), (0.110, 0.108, 0.012),
                (sign * 0.080, y, 0.091), halves[side], collection, "Backplate_DarkPetrol", 0.005, 2)
            for riser_index, offset in enumerate((-0.038, 0.038) if side == "Left" else (0,)):
                box("HingeRiser" + side + "_" + str(index) + "_" + str(riser_index),
                    (0.022, 0.026, 0.077), (sign * 0.029, y + offset, 0.132),
                    halves[side], collection, "Face_DarkPetrol", 0.004, 1)
        hinge_barrel("HingeKnuckleLeftA_" + str(index), y - 0.038, 0.032, halves["Left"], collection)
        hinge_barrel("HingeKnuckleRight_" + str(index), y, 0.034, halves["Right"], collection)
        hinge_barrel("HingeKnuckleLeftB_" + str(index), y + 0.038, 0.032, halves["Left"], collection)
        hinge_barrel("HingePin_" + str(index), y, 0.116, housing, collection, radius=0.008)

    # The shallow trough is a separate physical rail assembly. Do not bake
    # row-shaped cavities into the housing: accessible HTML positions the rails
    # responsively, and fixed cutouts would become duplicate slots at other sizes.

    # Preserve every child's world coordinates while placing real pivots on the
    # hinge axis. These two editable transforms perform the offline close pose.
    bpy.context.view_layer.update()
    for half in halves.values():
        matrices = [(child, child.matrix_world.copy()) for child in half.children]
        half.location = (0, 0, FOLD_PIVOT_Z)
        bpy.context.view_layer.update()
        for child, world_matrix in matrices:
            child.matrix_world = world_matrix
    bpy.context.view_layer.update()
    for cutter, half in half_cutters:
        follow_fold(cutter, half)

    for axis, row in zip(AXES, ROWS):
        label = group("Label_" + axis, root, collection)
        label.location = (-3.65, row, 0)
        plaque("LabelRim_" + axis, 1.76, 0.325, 0.016, (0, 0, 0.103),
               label, collection, "Rim_Muted")
        plaque("LabelFace_" + axis, 1.71, 0.278, 0.010, (0, 0, 0.115),
               label, collection, "Face_DarkPetrol")
        for side, x in (("Left", -0.735), ("Right", 0.735)):
            dot = box("LabelDot" + side + "_" + axis, (0.020, 0.020, 0.004),
                      (x, 0, 0.123), label, collection, "Presence_Cyan", 0)
            dot.rotation_euler.z = math.pi / 4
        FOLD_ATTACHMENTS["Left"].append(label)

        rail = group("Rail_" + axis, root, collection)
        rail.location = (ZERO_X, row, 0)
        for side, start, end in (("Left", RAIL_START, -RAIL_GAP / 2),
                                 ("Right", RAIL_GAP / 2, RAIL_END)):
            half_rail = group("Rail" + side + "_" + axis, rail, collection)
            half_rail.location = ((start + end) / 2 - ZERO_X, 0, 0)
            length = end - start
            box("TrackBed" + side + "_" + axis, (length, 0.153, 0.010),
                (0, 0, 0.100), half_rail, collection, "Recess_PetrolDeep", 0.004, 1)
            box("TrackChannel" + side + "_" + axis, (length - 0.025, 0.110, 0.006),
                (0, 0, 0.106), half_rail, collection, "Track_Inner", 0.002, 1)
            for lip, y in (("Near", -0.080), ("Far", 0.080)):
                box("TrackLip" + side + "_" + axis + "_" + lip,
                    (length - 0.015, 0.010, 0.012), (0, y, 0.113),
                    half_rail, collection, "Track_Edge", 0.003, 1)
            box("TrackInlay" + side + "_" + axis, (length - 0.035, 0.014, 0.004),
                (0, 0, 0.111), half_rail, collection,
                "Presence_Cyan" if side == "Left" else "RetainedMark_Amber", 0.001, 1)
            outer_x = (-1 if side == "Left" else 1) * (length / 2 - 0.006)
            box("TrackStop" + side + "_" + axis, (0.012, 0.158, 0.012),
                (outer_x, 0, 0.113), half_rail, collection, "Track_Edge", 0.003, 1)
            FOLD_ATTACHMENTS[side].append(half_rail)

        zero = group("Zero_" + axis, root, collection)
        zero.location = (ZERO_X, row, 0)
        ring("ZeroIndex_" + axis, 0.087, 0.057, 0.008, 0.122,
             zero, collection, "Zero_Ivory", segments=24)

        marker = group("Marker_" + axis, root, collection)
        marker.location = (ZERO_X, row, 0.100)
        disc("SliderFoot_" + axis, 0.137, 0.010, 0.004, marker, collection,
             "Recess_PetrolDeep", 0.003)
        disc("SliderBody_" + axis, 0.134, 0.025, 0.018, marker, collection,
             "Presence_Cyan", 0.006)
        ring("SliderRim_" + axis, 0.135, 0.121, 0.009, 0.032,
             marker, collection, "RetainedMark_Amber", segments=24)
        disc("SliderFace_" + axis, 0.122, 0.005, 0.034, marker, collection,
             "Presence_Cyan", 0.002)
        FOLD_ATTACHMENTS["Right"].extend((zero, marker))
    bpy.context.view_layer.update()
    for side, attachments in FOLD_ATTACHMENTS.items():
        for attachment in attachments:
            follow_fold(attachment, halves[side])
    bpy.context.view_layer.update()
    return root


def presentation_scene(collection: bpy.types.Collection) -> bpy.types.Object:
    """Studio camera/lights are editable source helpers, never part of the GLB."""
    bpy.ops.object.camera_add(location=(0.8, -5.8, 11.5))
    camera = bpy.context.object
    camera.name = "PresentationCamera_NOT_EXPORTED"
    move_to_collection(camera, collection)
    camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 11.7
    bpy.context.scene.camera = camera
    for name, location, energy, size, color in (
        ("Key", (-3.5, 4.0, 7.0), 1100, 7.0, (0.82, 0.94, 1.0)),
        ("Fill", (4.0, -1.0, 5.0), 650, 5.0, (0.91, 0.95, 1.0)),
        ("Edge", (0.0, -5.0, 4.0), 350, 3.0, (1.0, 0.91, 0.81)),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = "Presentation" + name + "_NOT_EXPORTED"
        move_to_collection(light, collection)
        light.data.energy, light.data.shape, light.data.size = energy, "DISK", size
        light.data.color = color
        light.rotation_euler = (-light.location).to_track_quat("-Z", "Y").to_euler()
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 48
    scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.world.color = (0.09, 0.09, 0.09)
    scene.view_settings.view_transform = "AgX"
    return camera


def set_viewport(camera: bpy.types.Object, material_preview: bool) -> None:
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type != "VIEW_3D":
                continue
            space = area.spaces.active
            space.shading.type = "MATERIAL" if material_preview else "SOLID"
            space.overlay.show_floor = False
            space.overlay.show_axis_x = False
            space.overlay.show_axis_y = False
            space.overlay.show_extras = False
            space.clip_end = 100
            space.region_3d.view_location = (0, 0, 0)
            space.region_3d.view_distance = 12.0
            space.region_3d.view_rotation = camera.rotation_euler.to_quaternion()
            space.region_3d.view_perspective = "ORTHO"


def measured_geometry(root: bpy.types.Object) -> dict:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    triangles = vertices = 0
    meshes = [obj for obj in root.children_recursive if obj.type == "MESH"]
    for obj in meshes:
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        vertices += len(mesh.vertices)
        evaluated.to_mesh_clear()
    return {"meshObjects": len(meshes), "evaluatedVertices": vertices,
            "evaluatedTriangles": triangles}


def evaluated_bounds(root: bpy.types.Object) -> dict:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in root.children_recursive:
        if obj.type == "MESH":
            evaluated = obj.evaluated_get(depsgraph)
            points.extend(evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box)
    minimum = [min(point[index] for point in points) for index in range(3)]
    maximum = [max(point[index] for point in points) for index in range(3)]
    return {"min": minimum, "max": maximum,
            "dimensions": [high - low for low, high in zip(minimum, maximum)]}


def folding_geometry(side: str, include_hinges: bool = True) -> tuple[list, list]:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    assembly = [bpy.data.objects["Fold" + side], *FOLD_ATTACHMENTS[side]]
    objects = {child.name: child for parent in assembly for child in parent.children_recursive
               if child.type == "MESH" and (include_hinges or not child.name.startswith("Hinge"))}
    vertices, triangles = [], []
    for obj in objects.values():
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        offset = len(vertices)
        vertices.extend(evaluated.matrix_world @ vertex.co for vertex in mesh.vertices)
        triangles.extend(tuple(offset + index for index in triangle.vertices) for triangle in mesh.loop_triangles)
        evaluated.to_mesh_clear()
    return vertices, triangles


def save_checked_closed_pose(model: bpy.types.Object, camera: bpy.types.Object,
                             evidence: Path) -> dict:
    """Source-only geometric folding proof, never an exported game animation."""
    left, right = bpy.data.objects["FoldLeft"], bpy.data.objects["FoldRight"]
    sampled = []
    for angle in (0, 30, 60, 90):
        left.rotation_euler.y = math.radians(angle)
        right.rotation_euler.y = -math.radians(angle)
        bpy.context.view_layer.update()
        left_vertices, left_triangles = folding_geometry("Left")
        right_vertices, right_triangles = folding_geometry("Right")
        left_bvh = BVHTree.FromPolygons(left_vertices, left_triangles, all_triangles=True)
        right_bvh = BVHTree.FromPolygons(right_vertices, right_triangles, all_triangles=True)
        intersections = len(left_bvh.overlap(right_bvh))
        sampled.append({"degreesPerHalf": angle, "crossHalfTriangleIntersections": intersections})
        if intersections:
            raise RuntimeError(f"Folding assembly intersects at {angle} degrees: {intersections} triangle pairs")
    left_surface, _ = folding_geometry("Left", include_hinges=False)
    right_surface, _ = folding_geometry("Right", include_hinges=False)
    clearance = min(vertex.x for vertex in right_surface) - max(vertex.x for vertex in left_surface)
    if clearance <= 0:
        raise RuntimeError(f"Closed product has no inner clearance: {clearance}")
    closed_bounds = evaluated_bounds(model)
    target = Vector((0, 0, 2.8))
    camera.location = (7.5, -9.0, 6.6)
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.ortho_scale = 8.4
    set_viewport(camera, material_preview=True)
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                area.spaces.active.region_3d.view_location = target
                area.spaces.active.region_3d.view_distance = 8.0
    bpy.ops.wm.save_as_mainfile(filepath=str(evidence / "human-balance-closed.blend"))
    left.rotation_euler.y = right.rotation_euler.y = 0
    bpy.context.view_layer.update()
    return {"pivotBlender": [0, 0, FOLD_PIVOT_Z], "rotationAxisBlender": "Y",
            "closedRotationDegrees": {"FoldLeft": 90, "FoldRight": -90},
            "sampledCrossHalfSurfaceChecks": sampled,
            "closedInnerSurfaceClearance": clearance,
            "closedBlenderBounds": closed_bounds,
            "limitations": "Surface-intersection checks at four poses and closed clearance; not a manufacturing, load-bearing or continuous swept-volume certification."}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--evidence-dir", type=Path, default=Path("docs/evidence/phase3-reference-product"))
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    root_dir = args.root.resolve()
    source = root_dir / "assets/blender/human-balance.blend"
    exported = root_dir / "public/models/human-balance.glb"
    texture_path = root_dir / "assets/textures/human-balance-city-print.png"
    if not texture_path.is_file():
        raise RuntimeError(f"Approved city-print texture is required before export: {texture_path}")
    if not texture_path.read_bytes().startswith(b"\x89PNG\r\n\x1a\n"):
        raise RuntimeError("The approved city-print input must be an actual PNG image")
    evidence = args.evidence_dir if args.evidence_dir.is_absolute() else root_dir / args.evidence_dir
    for directory in (source.parent, exported.parent, evidence):
        directory.mkdir(parents=True, exist_ok=True)

    # Keep the previous exported state as evidence; never overwrite its stage files.
    for previous, name in ((source, "before-reference.blend"), (exported, "before-reference.glb")):
        snapshot = evidence / name
        if previous.exists() and not snapshot.exists():
            shutil.copy2(previous, snapshot)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for old_material in list(bpy.data.materials):
        bpy.data.materials.remove(old_material)
    assets = bpy.data.collections.new("Human Balance — exported geometry")
    studio = bpy.data.collections.new("Presentation — source only")
    cutters = bpy.data.collections.new("Manufacturing cutters — source only")
    bpy.context.scene.collection.children.link(assets)
    bpy.context.scene.collection.children.link(studio)
    bpy.context.scene.collection.children.link(cutters)
    material("Blockout", "69777b", 0.0, 0.62)
    # Coated graphite, not exposed pale metal. High front roughness keeps the
    # large faces dark under the web renderer's direct presentation lighting.
    material("Housing_DarkPetrol", "394951", 0.35, 0.34)
    material("Bezel_DarkPetrol", "27343b", 0.50, 0.48)
    material("Edge_IvoryMetal", "344248", 0.55, 0.48)
    material("Backplate_DarkPetrol", "10181d", 0.32, 0.70)
    material("Seal_PetrolDeep", PALETTE["petrol_deep"], 0.02, 0.74)
    material("Mount_Muted", "344248", 0.70, 0.62)
    material("Face_DarkPetrol", "141c20", 0.22, 0.68)
    material("Recess_PetrolDeep", PALETTE["petrol_deep"], 0.25, 0.86)
    material("Rim_Muted", PALETTE["muted"], 0.50, 0.52)
    material("Separator_Muted", PALETTE["muted"], 0.25, 0.65)
    material("Track_Inner", PALETTE["petrol_deep"], 0.40, 0.82)
    material("Track_Edge", "344248", 0.58, 0.60)
    material("Zero_Ivory", PALETTE["ivory"], 0.08, 0.55)
    material("Slider_DarkPetrol", PALETTE["petrol"], 0.55, 0.66)
    material("Slider_Neutral", PALETTE["neutral"], 0.38, 0.37)
    material("Presence_Cyan", PALETTE["cyan"], 0.05, 0.44, 0.24)
    material("RetainedMark_Amber", PALETTE["amber"], 0.20, 0.48, 0.16)
    city_image = city_print_material(texture_path)
    model = create_instrument(assets, cutters)
    set_city_print_uv()
    camera = presentation_scene(studio)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = bpy.data.objects["HousingBodyLeft"]
    set_viewport(camera, material_preview=False)
    bpy.ops.wm.save_as_mainfile(filepath=str(evidence / "human-balance-blockout.blend"))
    for obj, material_name in PENDING_MATERIALS:
        obj.data.materials.clear()
        obj.data.materials.append(bpy.data.materials[material_name])
    set_viewport(camera, material_preview=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(evidence / "human-balance-materials.blend"))
    bpy.ops.wm.save_as_mainfile(filepath=str(source))

    geometry = measured_geometry(model)
    print("Evaluated geometry before export:", geometry)
    if geometry["evaluatedTriangles"] >= 25000:
        raise RuntimeError(f"Triangle budget exceeded: {geometry}")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in [model, *model.children_recursive]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = model
    bpy.ops.export_scene.gltf(
        filepath=str(exported), export_format="GLB", use_selection=True,
        export_apply=True, export_yup=True, export_texcoords=True,
        export_normals=True, export_materials="EXPORT", export_animations=False,
        export_cameras=False, export_lights=False, export_extras=False,
        # Blender's AUTO preserves an input PNG as PNG; PNG is not an enum value.
        export_draco_mesh_compression_enable=False, export_image_format="AUTO",
    )
    if exported.stat().st_size >= 1_200_000:
        raise RuntimeError(f"GLB budget exceeded: {exported.stat().st_size} bytes")
    report = {
        "asset": "Human Balance / Embermérleg",
        "authoringTool": bpy.app.version_string,
        "recipe": "scripts/blender/build_human_balance.py",
        "revision": "phase3-single-leaf-title-product-depth",
        "source": str(source.relative_to(root_dir)),
        "export": str(exported.relative_to(root_dir)),
        "sourceBytes": source.stat().st_size,
        "glbBytes": exported.stat().st_size,
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "glbSha256": hashlib.sha256(exported.read_bytes()).hexdigest(),
        "geometry": geometry,
        "halfHousingBodyBlenderDimensions": [5 - FOLD_GAP / 2, 4.5, 0.32],
        "housingBlenderBounds": evaluated_bounds(bpy.data.objects["Housing"]),
        "assetBlenderBounds": evaluated_bounds(model),
        "faceAxes": {"blender": "XY; outward +Z", "gltf": "XZ; outward +Y"},
        "gltfAxisConversion": "Blender (x,y,z) -> glTF (x,z,-y)",
        "railRangeBlenderX": [RAIL_START, RAIL_END],
        "zeroBlenderX": ZERO_X,
        "foldGapBlender": FOLD_GAP,
        "railGapBlender": RAIL_GAP,
        "axes": [{"axis": axis, "blenderRowY": row, "gltfRowZ": -row,
                  "rail": "Rail_" + axis, "railHalves": ["RailLeft_" + axis, "RailRight_" + axis],
                  "labelPlaque": "Label_" + axis, "marker": "Marker_" + axis,
                  "zero": "Zero_" + axis} for axis, row in zip(AXES, ROWS)],
        "materialPaletteSource": "src/ui/styles/app.css",
        "paletteSrgb": {key: "#" + value for key, value in PALETTE.items()},
        "cityPrint": {"source": str(texture_path.relative_to(root_dir)),
                      "sha256": hashlib.sha256(texture_path.read_bytes()).hexdigest(),
                      "bytes": texture_path.stat().st_size,
                      "dimensions": list(city_image.size),
                      "material": "Face_CityPrint", "embeddedFormat": "PNG",
                      "blenderUV": "U=(worldX+5)/10; V=(worldY+2.25)/4.5; +Y is image top",
                      "owners": ["HousingFaceLeft", "HousingFaceRight"]},
        "exportFeatures": {"textures": 1, "cameras": 0, "lights": 0,
                           "animations": 0, "externalDecoders": 0},
        "operations": [
            "Modeled two independent 0.32-deep graphite panels with a real central fold gap, machined beveled sidewalls, thin face skins and recessed backplates.",
            "Built three small interleaved hollow-knuckle hinges and pins with editable FoldLeft/FoldRight pivots.",
            "Split each of the five physical rails at the fold, retaining separate RailLeft_axis and RailRight_axis groups without any bridging geometry.",
            "Placed one continuous title plaque entirely on the left leaf, clear of the hinge; retained cyan-left/amber-right perimeter inlays without baked text.",
            "Added restrained double corner returns, interrupted dot/trace bands and title-flank circuit motifs in the safe perimeter channels, batched into one mesh per half with the existing accent materials.",
            "Subtracted two real keyhole hanging pockets through discrete rear mounting plates and into the case using editable Boolean modifiers.",
            "Added four shallow rear wall spacers; manufacturing cutters remain source-only, outside the GLB selection.",
            "Modeled five separate shallow three-dimensional troughs with dark floors, fine graphite lips and cyan/amber inlays; no fixed face cavities conflict with the responsive HTML-driven rail positions.",
            "Modeled five independent low-profile cyan circular sliders with fine amber rims, without dark knobs or grips.",
            "Added five ivory zero-index rings and five separate low hexagonal label plaques, without baked text or numeric labels.",
            "Assigned reusable graphite PBR finishes and existing Machine City cyan/amber/ivory accent colors.",
            "Mapped one continuous dark city illustration over only the two face skins, packed it into the editable Blender file, and embedded its PNG in the self-contained GLB.",
            "Saved editable blockout, material-stage and final Blender sources.",
            "Exported selected geometry as self-contained GLB; modifiers applied only on export.",
        ],
        "scope": "Geometry and materials only; no score, domain state or interaction logic.",
    }
    report["foldingVerification"] = save_checked_closed_pose(model, camera, evidence)
    report_path = evidence / "human-balance-asset-report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
