"""Build Core Vault Engine Room ER-03: Reactor Match.

Run with:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python build_er03.py

The approved ER-02 architecture and locked hero camera are rebuilt unchanged.
Only the main Reactor family, its secondary chamber and their platform interfaces
advance to production geometry.  Materials and lighting remain explicit work aids.
"""

from pathlib import Path
import math
import sys

import bpy
from mathutils import Vector


SOURCE_DIR = Path(__file__).resolve().parent
if str(SOURCE_DIR) not in sys.path:
    sys.path.insert(0, str(SOURCE_DIR))

import build_er01 as er01
import build_er02 as er02


REPO_DIR = SOURCE_DIR.parents[2]
REVIEW_DIR = SOURCE_DIR / "review"
REFERENCE_PATH = REPO_DIR / "docs/references/engine-room/engine-room-hero-reference.png"
BLEND_PATH = SOURCE_DIR / "engine-room.blend"
HERO_RENDER_PATH = REVIEW_DIR / "er-03-reactor-hero.png"
ALTERNATE_RENDER_PATH = REVIEW_DIR / "er-03-reactor-alternate.png"
CLOSEUP_RENDER_PATH = REVIEW_DIR / "er-03-reactor-closeup.png"

ROOM_WIDTH = er02.ROOM_WIDTH
ROOM_DEPTH = er02.ROOM_DEPTH
ROOM_HEIGHT = er02.ROOM_HEIGHT
REACTOR_CENTER = er02.REACTOR_CENTER
HERO_FOCAL_LENGTH_MM = er02.HERO_FOCAL_LENGTH_MM
HERO_CAMERA_POSITION = er02.HERO_CAMERA_POSITION
HERO_CAMERA_TARGET = er02.HERO_CAMERA_TARGET


def smooth_mesh(obj):
    if obj.type == "MESH":
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    return obj


def add_bevel(obj, width=0.025, segments=3):
    modifier = obj.modifiers.new(name="CV_Reactor_MachinedEdge", type="BEVEL")
    modifier.width = width
    modifier.segments = segments
    if hasattr(modifier, "harden_normals"):
        modifier.harden_normals = True
    return obj


def make_reactor_material(name, color, roughness, metallic=0.0, alpha=1.0, transmission=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if "Alpha" in shader.inputs:
        shader.inputs["Alpha"].default_value = alpha
    if "Transmission Weight" in shader.inputs:
        shader.inputs["Transmission Weight"].default_value = transmission
    if "IOR" in shader.inputs:
        shader.inputs["IOR"].default_value = 1.45
    if alpha < 1.0:
        material.diffuse_color = (*color, alpha)
        if hasattr(material, "surface_render_method"):
            material.surface_render_method = "BLENDED"
    return material


def add_cylinder(name, location, radius, depth, material, collection, vertices=96,
                 bevel=0.025, smooth=True):
    obj = er01.add_cylinder(name, location, radius, depth, material, collection, vertices)
    if smooth:
        smooth_mesh(obj)
    if bevel:
        add_bevel(obj, bevel)
    return obj


def add_cone(name, location, radius1, radius2, depth, material, collection,
             vertices=96, bevel=0.022):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius1,
        radius2=radius2,
        depth=depth,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    er01.move_to_collection(obj, collection)
    smooth_mesh(obj)
    if bevel:
        add_bevel(obj, bevel)
    return obj


def add_box(name, location, dimensions, material, collection, rotation_z=0.0, bevel=0.025):
    obj = er02.add_box(name, location, dimensions, material, collection, bevel=bevel)
    obj.rotation_euler[2] = rotation_z
    return obj


def add_torus(name, center_x, center_y, z, outer_radius, minor_radius,
              material, collection, major_segments=96, minor_segments=12):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=outer_radius - minor_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=(center_x, center_y, z),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    er01.move_to_collection(obj, collection)
    smooth_mesh(obj)
    return obj


def add_annulus(name, center_x, center_y, z, inner_radius, outer_radius, depth,
                material, collection, segments=96, bevel=0.022):
    vertices = []
    faces = []
    lower = z - depth / 2.0
    upper = z + depth / 2.0
    for height in (lower, upper):
        for radius in (inner_radius, outer_radius):
            for index in range(segments):
                angle = math.tau * index / segments
                vertices.append((center_x + math.cos(angle) * radius,
                                 center_y + math.sin(angle) * radius, height))
    stride = segments
    lower_inner = 0
    lower_outer = stride
    upper_inner = stride * 2
    upper_outer = stride * 3
    for index in range(segments):
        next_index = (index + 1) % segments
        faces.extend([
            (lower_outer + index, lower_outer + next_index,
             upper_outer + next_index, upper_outer + index),
            (lower_inner + next_index, lower_inner + index,
             upper_inner + index, upper_inner + next_index),
            (upper_inner + index, upper_outer + index,
             upper_outer + next_index, upper_inner + next_index),
            (lower_inner + index, lower_inner + next_index,
             lower_outer + next_index, lower_outer + index),
        ])
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.data.materials.append(material)
    smooth_mesh(obj)
    if bevel:
        add_bevel(obj, bevel)
    return obj


def add_radial_box(name, center_x, center_y, radius, z, radial_depth, tangent_width,
                   height, angle, material, collection, bevel=0.022):
    x = center_x + math.cos(angle) * radius
    y = center_y + math.sin(angle) * radius
    return add_box(name, (x, y, z), (radial_depth, tangent_width, height),
                   material, collection, rotation_z=angle, bevel=bevel)


def add_radial_cylinder(name, center_x, center_y, radius_from_center, z, radius,
                        depth, angle, material, collection, vertices=64, bevel=0.018):
    direction = Vector((math.cos(angle), math.sin(angle), 0.0))
    location = (center_x + direction.x * radius_from_center,
                center_y + direction.y * radius_from_center, z)
    rotation = direction.to_track_quat("Z", "Y").to_euler()
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    er01.move_to_collection(obj, collection)
    smooth_mesh(obj)
    if bevel:
        add_bevel(obj, bevel)
    return obj


def add_radial_beam(name, center_x, center_y, z, angle, inner_radius, outer_radius,
                    width, height, material, collection, bevel=0.015):
    midpoint = (inner_radius + outer_radius) / 2.0
    length = outer_radius - inner_radius
    return add_radial_box(name, center_x, center_y, midpoint, z, length, width,
                          height, angle, material, collection, bevel)


def add_curved_panel(name, center_x, center_y, radius_inner, radius_outer,
                     angle_start, angle_end, z_lower, z_upper, material, collection,
                     segments=16):
    vertices = []
    faces = []
    for z in (z_lower, z_upper):
        for radius in (radius_inner, radius_outer):
            for index in range(segments + 1):
                blend = index / segments
                angle = angle_start + (angle_end - angle_start) * blend
                vertices.append((center_x + math.cos(angle) * radius,
                                 center_y + math.sin(angle) * radius, z))
    stride = segments + 1
    lower_inner = 0
    lower_outer = stride
    upper_inner = stride * 2
    upper_outer = stride * 3
    for index in range(segments):
        next_index = index + 1
        faces.extend([
            (lower_outer + index, lower_outer + next_index,
             upper_outer + next_index, upper_outer + index),
            (lower_inner + next_index, lower_inner + index,
             upper_inner + index, upper_inner + next_index),
            (upper_inner + index, upper_outer + index,
             upper_outer + next_index, upper_inner + next_index),
            (lower_inner + index, lower_inner + next_index,
             lower_outer + next_index, lower_outer + index),
        ])
    faces.extend([
        (lower_inner, lower_outer, upper_outer, upper_inner),
        (lower_inner + segments, upper_inner + segments,
         upper_outer + segments, lower_outer + segments),
    ])
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.data.materials.append(material)
    smooth_mesh(obj)
    add_bevel(obj, 0.008, 2)
    return obj


def make_architecture_materials():
    """Exact ER-02 working groups keep the approved architecture presentation stable."""
    return {
        "stone": er02.make_material("CV_Working_Stone", (0.39, 0.33, 0.25), 0.88),
        "stone_light": er02.make_material("CV_Working_Stone_Light", (0.54, 0.46, 0.35), 0.86),
        "stone_dark": er02.make_material("CV_Working_Stone_Dark", (0.25, 0.22, 0.18), 0.91),
        "floor": er02.make_material("CV_Working_Floor", (0.31, 0.27, 0.22), 0.82),
        "floor_light": er02.make_material("CV_Working_Floor_Light", (0.39, 0.34, 0.27), 0.84),
        "floor_dark": er02.make_material("CV_Working_Floor_Dark", (0.17, 0.16, 0.14), 0.92),
        "ceiling": er02.make_material("CV_Working_Ceiling", (0.30, 0.26, 0.21), 0.92),
        "ceiling_dark": er02.make_material("CV_Working_Ceiling_Dark", (0.18, 0.16, 0.14), 0.94),
        "recess": er02.make_material("CV_Working_Reveal", (0.21, 0.19, 0.17), 0.90),
        "recess_dark": er02.make_material("CV_Working_Reveal_Dark", (0.075, 0.072, 0.068), 0.96),
        "platform": er02.make_material("CV_Working_Platform", (0.25, 0.24, 0.22), 0.78),
        "platform_light": er02.make_material("CV_Working_Platform_Light", (0.36, 0.34, 0.30), 0.76),
    }


def make_reactor_materials():
    return {
        "machine_dark": make_reactor_material("CV_Working_Machine_Dark", (0.025, 0.028, 0.030), 0.58, 0.30),
        "machine": make_reactor_material("CV_Working_Machine", (0.075, 0.064, 0.052), 0.54, 0.30),
        "machine_light": make_reactor_material("CV_Working_Machine_Light", (0.16, 0.125, 0.078), 0.50, 0.34),
        "inner": make_reactor_material("CV_Working_Internal", (0.045, 0.052, 0.058), 0.62, 0.20),
        "inner_light": make_reactor_material("CV_Working_Internal_Light", (0.11, 0.125, 0.135), 0.57, 0.18),
        "glass": make_reactor_material("CV_Working_GlassPlaceholder", (0.16, 0.22, 0.25), 0.34, 0.0, 0.22, 0.0),
    }


def build_approved_architecture(root, materials):
    architecture = er01.create_collection("CV_Architecture", root)
    er02.build_floor(architecture, materials)
    er02.build_left_arcade(architecture, materials)
    er02.build_rear_facade(architecture, materials)
    er02.build_right_side(architecture, materials)
    er02.build_ceiling(architecture, materials)
    er02.build_foreground(architecture, materials)
    er02.build_console(root, {**materials, "reactor_dark": materials["floor_dark"]})
    return architecture


def build_platform_interfaces(reactor_root, secondary_root, architecture_materials):
    center_x, center_y = REACTOR_CENTER
    platform = er01.create_collection("CV_Reactor_Interface", reactor_root)
    add_cylinder("CV_Reactor_Platform_Lower", (center_x, center_y, 0.08), 4.60, 0.16,
                 architecture_materials["platform"], platform, 96, 0.045)
    add_cylinder("CV_Reactor_Platform_Middle", (center_x, center_y, 0.23), 3.65, 0.18,
                 architecture_materials["platform_light"], platform, 96, 0.045)
    add_cylinder("CV_Reactor_Platform_Upper", (center_x, center_y, 0.39), 2.95, 0.14,
                 architecture_materials["platform"], platform, 96, 0.045)
    add_cylinder("CV_Reactor_Platform_EdgeProfile", (center_x, center_y, 0.13), 4.66, 0.08,
                 architecture_materials["platform_light"], platform, 96, 0.025)

    secondary_interface = er01.create_collection("CV_Reactor_Secondary_Interface", secondary_root)
    add_cylinder("CV_Secondary_Clearance_Platform", (4.60, 7.00, 0.075), 1.72, 0.15,
                 architecture_materials["platform"], secondary_interface, 64, 0.03)
    add_cylinder("CV_Secondary_Platform", (4.60, 7.00, 0.12), 1.30, 0.24,
                 architecture_materials["platform"], secondary_interface, 64, 0.045)


def build_main_base(reactor_root, materials):
    base = er01.create_collection("CV_Reactor_Base", reactor_root)
    center_x, center_y = REACTOR_CENTER
    add_cylinder("CV_Reactor_Base_Anchor", (center_x, center_y, 0.59), 2.26, 0.28,
                 materials["machine_dark"], base, 96, 0.035)
    add_cylinder("CV_Reactor_Base_LowerCollar", (center_x, center_y, 0.79), 2.16, 0.22,
                 materials["machine"], base, 96, 0.03)
    add_cone("CV_Reactor_Base_Taper", (center_x, center_y, 0.96), 2.13, 1.98, 0.20,
             materials["machine_light"], base, 96, 0.025)
    add_cylinder("CV_Reactor_Base_UpperCollar", (center_x, center_y, 1.10), 2.03, 0.16,
                 materials["machine_dark"], base, 96, 0.025)
    add_torus("CV_Reactor_Base_LowerProfile", center_x, center_y, 0.49, 2.29, 0.045,
              materials["machine_light"], base)
    add_torus("CV_Reactor_Base_UpperProfile", center_x, center_y, 1.17, 2.07, 0.040,
              materials["machine_light"], base)
    for index in range(12):
        angle = math.tau * index / 12.0
        add_radial_box(f"CV_Reactor_Base_AnchorBlock_{index + 1:02d}", center_x, center_y,
                       2.22, 0.62, 0.30, 0.22, 0.16, angle,
                       materials["machine"], base, 0.018)
    return base


def build_main_chamber(reactor_root, materials):
    chamber = er01.create_collection("CV_Reactor_Chamber", reactor_root)
    center_x, center_y = REACTOR_CENTER
    post_count = 8
    gap = math.radians(4.2)
    for index in range(post_count):
        start = math.tau * index / post_count + gap
        end = math.tau * (index + 1) / post_count - gap
        add_curved_panel(f"CV_Reactor_GlassPanel_{index + 1:02d}", center_x, center_y,
                         1.79, 1.855, start, end, 1.34, 4.93,
                         materials["glass"], chamber, 18)
    add_annulus("CV_Reactor_Chamber_LowerSeal", center_x, center_y, 1.29,
                1.57, 1.94, 0.18, materials["machine_light"], chamber, 96, 0.020)
    add_annulus("CV_Reactor_Chamber_UpperSeal", center_x, center_y, 4.99,
                1.57, 1.94, 0.18, materials["machine_light"], chamber, 96, 0.020)
    return chamber


def build_main_frame(reactor_root, materials):
    frame = er01.create_collection("CV_Reactor_Frame", reactor_root)
    center_x, center_y = REACTOR_CENTER
    ring_levels = (1.27, 3.13, 5.03)
    for ring_name, z, depth in zip(("Lower", "Middle", "Upper"), ring_levels, (0.28, 0.32, 0.34)):
        add_annulus(f"CV_Reactor_Frame_{ring_name}Ring", center_x, center_y, z,
                    1.66, 2.26, depth, materials["machine"], frame, 96, 0.028)
        add_torus(f"CV_Reactor_Frame_{ring_name}OuterProfile", center_x, center_y,
                  z + depth * 0.37, 2.28, 0.040, materials["machine_light"], frame)

    for index in range(8):
        angle = math.tau * index / 8.0 + math.pi / 8.0
        x = center_x + math.cos(angle) * 2.03
        y = center_y + math.sin(angle) * 2.03
        add_cylinder(f"CV_Reactor_Frame_Post_{index + 1:02d}", (x, y, 3.15), 0.125, 3.70,
                     materials["machine_dark"], frame, 48, 0.020)
        add_cone(f"CV_Reactor_Frame_PostFoot_{index + 1:02d}", (x, y, 1.35),
                 0.19, 0.125, 0.24, materials["machine_light"], frame, 48, 0.016)
        add_cone(f"CV_Reactor_Frame_PostHead_{index + 1:02d}", (x, y, 4.92),
                 0.125, 0.19, 0.24, materials["machine_light"], frame, 48, 0.016)
        for level_index, z in enumerate(ring_levels):
            add_radial_box(f"CV_Reactor_Frame_Junction_{index + 1:02d}_{level_index + 1:02d}",
                           center_x, center_y, 2.16, z, 0.30, 0.34, 0.30, angle,
                           materials["machine_light"], frame, 0.022)
            add_radial_cylinder(f"CV_Reactor_Frame_Boss_{index + 1:02d}_{level_index + 1:02d}",
                                center_x, center_y, 2.34, z, 0.105, 0.10, angle,
                                materials["machine_dark"], frame, 48, 0.012)
    return frame


def build_main_cap(reactor_root, materials):
    cap = er01.create_collection("CV_Reactor_Cap", reactor_root)
    center_x, center_y = REACTOR_CENTER
    add_cylinder("CV_Reactor_Cap_TransitionPlate", (center_x, center_y, 5.24), 2.11, 0.18,
                 materials["machine_dark"], cap, 96, 0.030)
    add_cone("CV_Reactor_Cap_LowerSlope", (center_x, center_y, 5.39), 2.03, 1.78, 0.18,
             materials["machine"], cap, 96, 0.025)
    add_cylinder("CV_Reactor_Cap_LowerDeck", (center_x, center_y, 5.52), 1.82, 0.16,
                 materials["machine_light"], cap, 96, 0.024)
    add_cone("CV_Reactor_Cap_MiddleSlope", (center_x, center_y, 5.66), 1.69, 1.42, 0.18,
             materials["machine_dark"], cap, 96, 0.023)
    add_cylinder("CV_Reactor_Cap_MiddleDeck", (center_x, center_y, 5.79), 1.47, 0.16,
                 materials["machine"], cap, 96, 0.022)
    add_cone("CV_Reactor_Cap_UpperSlope", (center_x, center_y, 5.91), 1.30, 0.98, 0.14,
             materials["machine_dark"], cap, 96, 0.020)
    add_cylinder("CV_Reactor_Cap_UpperDeck", (center_x, center_y, 6.02), 1.04, 0.12,
                 materials["machine_light"], cap, 96, 0.018)
    add_cylinder("CV_Reactor_Cap_CentralTop", (center_x, center_y, 6.11), 0.58, 0.14,
                 materials["machine_dark"], cap, 64, 0.020)
    for index in range(10):
        angle = math.tau * index / 10.0
        add_radial_box(f"CV_Reactor_Cap_RadialPlate_{index + 1:02d}", center_x, center_y,
                       1.89, 5.29, 0.38, 0.22, 0.14, angle,
                       materials["machine_light"], cap, 0.015)
        add_radial_cylinder(f"CV_Reactor_Cap_FastenerReady_{index + 1:02d}", center_x,
                            center_y, 2.09, 5.31, 0.055, 0.055, angle,
                            materials["machine_dark"], cap, 32, 0.008)
    add_torus("CV_Reactor_Cap_LowerEdge", center_x, center_y, 5.18, 2.14, 0.045,
              materials["machine_light"], cap)
    add_torus("CV_Reactor_Cap_MiddleEdge", center_x, center_y, 5.73, 1.51, 0.035,
              materials["machine_light"], cap)
    add_torus("CV_Reactor_Cap_TopEdge", center_x, center_y, 6.08, 0.62, 0.030,
              materials["machine_light"], cap, 64, 10)
    return cap


def build_main_internal(reactor_root, materials):
    internal = er01.create_collection("CV_Reactor_Internal", reactor_root)
    center_x, center_y = REACTOR_CENTER
    add_cylinder("CV_Reactor_Internal_CentralSpine", (center_x, center_y, 3.11), 0.20, 3.42,
                 materials["inner_light"], internal, 64, 0.018)
    levels = (1.53, 2.08, 2.64, 3.20, 3.76, 4.32, 4.77)
    radii = (0.72, 1.10, 0.86, 1.20, 0.90, 1.08, 0.70)
    for index, (z, radius) in enumerate(zip(levels, radii)):
        add_cylinder(f"CV_Reactor_Internal_Module_{index + 1:02d}", (center_x, center_y, z),
                     radius, 0.16 if index % 2 else 0.20,
                     materials["inner"] if index % 2 else materials["inner_light"],
                     internal, 72, 0.018)
        add_torus(f"CV_Reactor_Internal_ModuleProfile_{index + 1:02d}", center_x, center_y,
                  z + 0.06, radius + 0.04, 0.025, materials["machine_light"], internal, 72, 10)
        arm_count = 4 if index % 2 else 6
        for arm in range(arm_count):
            angle = math.tau * arm / arm_count + (index % 2) * math.pi / 4.0
            add_radial_beam(f"CV_Reactor_Internal_Arm_{index + 1:02d}_{arm + 1:02d}",
                            center_x, center_y, z, angle, 0.22, min(radius + 0.42, 1.58),
                            0.075, 0.075, materials["inner_light"], internal, 0.010)
    for index in range(6):
        angle = math.tau * index / 6.0
        x = center_x + math.cos(angle) * 1.34
        y = center_y + math.sin(angle) * 1.34
        add_cylinder(f"CV_Reactor_Internal_Rail_{index + 1:02d}", (x, y, 3.12),
                     0.055, 3.15, materials["inner"], internal, 32, 0.010)
        for z in (1.72, 2.84, 3.96, 4.55):
            add_cylinder(f"CV_Reactor_Internal_RailCollar_{index + 1:02d}_{int(z * 100):03d}",
                         (x, y, z), 0.09, 0.08, materials["inner_light"], internal, 32, 0.009)
    return internal


def add_port_assembly(name, center_x, center_y, angle, z, scale, materials, collection):
    add_radial_box(f"{name}_Mount", center_x, center_y, 2.03, z, 0.42 * scale,
                   0.72 * scale, 0.68 * scale, angle, materials["machine_dark"], collection, 0.035)
    add_radial_cylinder(f"{name}_InnerCollar", center_x, center_y, 2.18, z,
                        0.42 * scale, 0.30 * scale, angle,
                        materials["machine_light"], collection, 72, 0.022)
    add_radial_cylinder(f"{name}_Housing", center_x, center_y, 2.48, z,
                        0.34 * scale, 0.48 * scale, angle,
                        materials["machine"], collection, 72, 0.025)
    add_radial_cylinder(f"{name}_Flange", center_x, center_y, 2.78, z,
                        0.44 * scale, 0.18 * scale, angle,
                        materials["machine_light"], collection, 72, 0.020)
    add_radial_cylinder(f"{name}_Face", center_x, center_y, 2.91, z,
                        0.29 * scale, 0.15 * scale, angle,
                        materials["machine_dark"], collection, 64, 0.018)
    add_radial_cylinder(f"{name}_Interface", center_x, center_y, 3.02, z,
                        0.16 * scale, 0.12 * scale, angle,
                        materials["inner"], collection, 48, 0.012)


def build_main_ports(reactor_root, materials):
    ports = er01.create_collection("CV_Reactor_Ports", reactor_root)
    center_x, center_y = REACTOR_CENTER
    add_port_assembly("CV_Reactor_Port_Front", center_x, center_y, -math.pi / 2.0,
                      0.92, 1.00, materials, ports)
    add_port_assembly("CV_Reactor_Port_Right", center_x, center_y, -math.pi / 12.0,
                      0.96, 0.92, materials, ports)
    add_port_assembly("CV_Reactor_Port_Left", center_x, center_y, math.pi * 1.08,
                      1.02, 0.82, materials, ports)
    for index, angle in enumerate((0.0, math.pi)):
        add_radial_box(f"CV_Reactor_ConduitZone_{index + 1:02d}_Mount", center_x, center_y,
                       2.02, 3.18, 0.32, 0.46, 0.44, angle,
                       materials["machine_dark"], ports, 0.025)
        add_radial_cylinder(f"CV_Reactor_ConduitZone_{index + 1:02d}_Flange", center_x, center_y,
                            2.28, 3.18, 0.24, 0.24, angle,
                            materials["machine_light"], ports, 56, 0.016)
        add_radial_cylinder(f"CV_Reactor_ConduitZone_{index + 1:02d}_Blank", center_x, center_y,
                            2.43, 3.18, 0.15, 0.10, angle,
                            materials["machine_dark"], ports, 48, 0.012)
    return ports


def build_secondary_reactor(secondary_root, materials):
    center_x, center_y = (4.60, 7.00)
    base = er01.create_collection("CV_Reactor_Secondary_Base", secondary_root)
    chamber = er01.create_collection("CV_Reactor_Secondary_Chamber", secondary_root)
    frame = er01.create_collection("CV_Reactor_Secondary_Frame", secondary_root)
    cap = er01.create_collection("CV_Reactor_Secondary_Cap", secondary_root)
    internal = er01.create_collection("CV_Reactor_Secondary_Internal", secondary_root)
    ports = er01.create_collection("CV_Reactor_Secondary_Ports", secondary_root)

    add_cylinder("CV_Secondary_Base_Anchor", (center_x, center_y, 0.44), 1.18, 0.30,
                 materials["machine_dark"], base, 72, 0.030)
    add_cone("CV_Secondary_Base_Taper", (center_x, center_y, 0.68), 1.13, 1.01, 0.22,
             materials["machine"], base, 72, 0.022)
    add_cylinder("CV_Secondary_Base_Upper", (center_x, center_y, 0.84), 1.04, 0.16,
                 materials["machine_light"], base, 72, 0.020)

    for index in range(6):
        start = math.tau * index / 6.0 + math.radians(5.0)
        end = math.tau * (index + 1) / 6.0 - math.radians(5.0)
        add_curved_panel(f"CV_Secondary_GlassPanel_{index + 1:02d}", center_x, center_y,
                         0.82, 0.865, start, end, 0.94, 3.34,
                         materials["glass"], chamber, 14)

    ring_levels = (0.90, 2.12, 3.38)
    for label, z in zip(("Lower", "Middle", "Upper"), ring_levels):
        add_annulus(f"CV_Secondary_Frame_{label}Ring", center_x, center_y, z,
                    0.73, 1.13, 0.22, materials["machine"], frame, 72, 0.020)
    for index in range(6):
        angle = math.tau * index / 6.0 + math.pi / 6.0
        x = center_x + math.cos(angle) * 1.00
        y = center_y + math.sin(angle) * 1.00
        add_cylinder(f"CV_Secondary_Frame_Post_{index + 1:02d}", (x, y, 2.13), 0.075, 2.44,
                     materials["machine_dark"], frame, 40, 0.014)
        for level_index, z in enumerate(ring_levels):
            add_radial_box(f"CV_Secondary_Frame_Junction_{index + 1:02d}_{level_index + 1:02d}",
                           center_x, center_y, 1.08, z, 0.18, 0.22, 0.20, angle,
                           materials["machine_light"], frame, 0.015)

    add_cylinder("CV_Secondary_Cap_Transition", (center_x, center_y, 3.53), 1.06, 0.18,
                 materials["machine_dark"], cap, 72, 0.022)
    add_cone("CV_Secondary_Cap_Slope", (center_x, center_y, 3.68), 0.99, 0.72, 0.20,
             materials["machine"], cap, 72, 0.020)
    add_cylinder("CV_Secondary_Cap_Deck", (center_x, center_y, 3.82), 0.76, 0.14,
                 materials["machine_light"], cap, 72, 0.018)
    add_cone("CV_Secondary_Cap_UpperSlope", (center_x, center_y, 3.94), 0.66, 0.48, 0.14,
             materials["machine_dark"], cap, 64, 0.016)
    add_cylinder("CV_Secondary_Cap_Top", (center_x, center_y, 4.04), 0.39, 0.12,
                 materials["machine_light"], cap, 56, 0.015)

    add_cylinder("CV_Secondary_Internal_Spine", (center_x, center_y, 2.12), 0.12, 2.28,
                 materials["inner_light"], internal, 48, 0.012)
    for index, z in enumerate((1.20, 1.70, 2.20, 2.70, 3.13)):
        radius = 0.48 if index % 2 else 0.63
        add_cylinder(f"CV_Secondary_Internal_Module_{index + 1:02d}", (center_x, center_y, z),
                     radius, 0.12, materials["inner"] if index % 2 else materials["inner_light"],
                     internal, 56, 0.014)
        for arm in range(4):
            angle = math.tau * arm / 4.0 + index * 0.22
            add_radial_beam(f"CV_Secondary_Internal_Arm_{index + 1:02d}_{arm + 1:02d}",
                            center_x, center_y, z, angle, 0.13, 0.70,
                            0.055, 0.055, materials["inner_light"], internal, 0.008)

    add_radial_box("CV_Secondary_Port_Mount", center_x, center_y, 1.00, 0.72,
                   0.26, 0.42, 0.40, -math.pi / 2.0,
                   materials["machine_dark"], ports, 0.022)
    add_radial_cylinder("CV_Secondary_Port_Flange", center_x, center_y, 1.24, 0.72,
                        0.25, 0.25, -math.pi / 2.0,
                        materials["machine_light"], ports, 56, 0.016)
    add_radial_cylinder("CV_Secondary_Port_Blank", center_x, center_y, 1.40, 0.72,
                        0.15, 0.12, -math.pi / 2.0,
                        materials["machine_dark"], ports, 48, 0.012)


def add_reference_background(camera, collection):
    er02.add_reference_background(camera, collection)
    marker = bpy.data.objects.get("CV_CanonicalReference_Marker")
    if marker:
        marker["CV_ReferenceUse"] = "ER-03 Reactor match; ER-02 architecture and hero composition locked"


def configure_scene():
    scene = er02.configure_scene()
    scene.name = "CV_EngineRoom_ER03"
    scene["CV_ProductionStage"] = "ER-03 Reactor Match"
    scene["CV_PreviousApprovedStage"] = "ER-02 Architectural Match"
    scene["CV_ArchitectureLocked"] = True
    scene["CV_HeroCameraLocked"] = True
    scene["CV_StageScope"] = "Reactor family geometry only; materials, lighting, energy and runtime deferred"
    scene["CV_ReactorDimensionsMeters"] = "approximately 4.5 diameter x 5.5 height"
    scene["CV_PlatformDimensionsMeters"] = "9.2 diameter x 0.46 total height"
    return scene


def add_utility_lighting(lights):
    er01.add_area_light("CV_Utility_Daylight", (-6.8, -0.5, 6.6), (0.0, 2.5, 1.5), 2250, 5.2, lights)
    er01.add_area_light("CV_Utility_FrontFill", (2.8, -7.8, 5.4), (0.0, 2.0, 2.4), 900, 4.2, lights)
    er01.add_area_light("CV_Utility_RearDepth", (0.0, 13.6, 5.6), (0.0, 5.8, 2.4), 1450, 4.2, lights)
    er01.add_area_light("CV_Utility_RightRim", (7.0, 5.5, 5.8), (1.0, 2.6, 2.8), 775, 3.2, lights)
    er01.add_area_light("CV_Utility_RevealBounce", (-3.8, 14.4, 3.6), (-1.0, 11.7, 2.7), 725, 2.8, lights)
    er01.add_area_light("CV_Utility_ReactorInspect", (-1.8, -4.8, 4.5), (0.1, 1.8, 2.9), 625, 2.5, lights)


def build_scene():
    scene = configure_scene()
    architecture_materials = make_architecture_materials()
    reactor_materials = make_reactor_materials()

    root = er01.create_collection("CV_EngineRoom")
    build_approved_architecture(root, architecture_materials)
    reactor_root = er01.create_collection("CV_Reactor", root)
    secondary_root = er01.create_collection("CV_Reactor_Secondary", root)
    cameras = er01.create_collection("CV_Cameras", root)
    lights = er01.create_collection("CV_Lights_Utility", root)

    build_platform_interfaces(reactor_root, secondary_root, architecture_materials)
    build_main_base(reactor_root, reactor_materials)
    build_main_chamber(reactor_root, reactor_materials)
    build_main_frame(reactor_root, reactor_materials)
    build_main_cap(reactor_root, reactor_materials)
    build_main_internal(reactor_root, reactor_materials)
    build_main_ports(reactor_root, reactor_materials)
    build_secondary_reactor(secondary_root, reactor_materials)

    hero_camera = er01.add_camera("CV_HeroCamera", HERO_CAMERA_POSITION, HERO_CAMERA_TARGET,
                                  HERO_FOCAL_LENGTH_MM, cameras)
    add_reference_background(hero_camera, cameras)
    alternate_camera = er01.add_camera("CV_ReactorReviewCamera", (7.55, -8.75, 4.55),
                                       (0.55, 2.70, 2.80), 36.0, cameras)
    closeup_camera = er01.add_camera("CV_ReactorCloseupCamera", (4.80, -8.10, 3.55),
                                     (0.10, 1.80, 3.05), 36.0, cameras)
    add_utility_lighting(lights)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.render.render(write_still=True)

    scene.camera = alternate_camera
    scene.render.filepath = str(ALTERNATE_RENDER_PATH)
    bpy.ops.render.render(write_still=True)

    scene.camera = closeup_camera
    scene.render.filepath = str(CLOSEUP_RENDER_PATH)
    bpy.ops.render.render(write_still=True)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved ER-03 source: {BLEND_PATH}")
    print(f"Saved ER-03 hero review: {HERO_RENDER_PATH}")
    print(f"Saved ER-03 alternate review: {ALTERNATE_RENDER_PATH}")
    print(f"Saved ER-03 close-up review: {CLOSEUP_RENDER_PATH}")


if __name__ == "__main__":
    build_scene()
