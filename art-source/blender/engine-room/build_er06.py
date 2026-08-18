"""Build Core Vault Engine Room ER-06: Detail Pass.

Run with:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python build_er06.py

ER-06 reconstructs the approved ER-05 scene, preserves its camera, materials,
lighting direction and hierarchy, then adds disciplined production detail,
installed conduit logic, a finished secondary console and lightweight coastal
depth. Runtime integration and GLB export remain explicitly deferred.
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
import build_er03 as er03
import build_er04 as er04
import build_er04b as er04b
import build_er04c as er04c
import build_er05 as er05


REVIEW_DIR = SOURCE_DIR / "review"
BLEND_PATH = SOURCE_DIR / "engine-room.blend"
HERO_RENDER_PATH = REVIEW_DIR / "er-06-detail-hero.png"
ALTERNATE_RENDER_PATH = REVIEW_DIR / "er-06-detail-alternate.png"
REACTOR_CLOSEUP_PATH = REVIEW_DIR / "er-06-reactor-detail-closeup.png"
CONSOLE_CLOSEUP_PATH = REVIEW_DIR / "er-06-console-closeup.png"
EXTERIOR_RENDER_PATH = REVIEW_DIR / "er-06-exterior-depth.png"
MAIN_CENTER = er03.REACTOR_CENTER
SECONDARY_CENTER = (4.60, 7.00)


def set_input(shader, name, value):
    if name in shader.inputs:
        shader.inputs[name].default_value = value


def make_simple_material(name, color, roughness, metallic=0.0, emission_strength=0.0, family="ER-06 Detail"):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    set_input(shader, "Base Color", (*color, 1.0))
    set_input(shader, "Roughness", roughness)
    set_input(shader, "Metallic", metallic)
    if emission_strength > 0.0:
        set_input(shader, "Emission Color", (*color, 1.0))
        set_input(shader, "Emission Strength", emission_strength)
    material.diffuse_color = (*color, 1.0)
    material["CV_MaterialFamily"] = family
    material["CV_ProductionStage"] = "ER-06 detail-only addition"
    return material


def make_gradient_sky_material():
    material = bpy.data.materials.new("CV_Mat_Exterior_Sky")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    output.name = "CV_Sky_Output"
    output.location = (520, 0)
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.name = "CV_Sky_Principled"
    shader.location = (260, 0)
    coordinates = nodes.new("ShaderNodeTexCoord")
    coordinates.name = "CV_Sky_Coordinates"
    coordinates.location = (-520, 0)
    separate = nodes.new("ShaderNodeSeparateXYZ")
    separate.name = "CV_Sky_VerticalGradient"
    separate.location = (-300, 0)
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = "CV_Sky_MediterraneanGradient"
    ramp.location = (-60, 20)
    ramp.color_ramp.elements[0].position = 0.10
    ramp.color_ramp.elements[0].color = (0.34, 0.61, 0.78, 1.0)
    ramp.color_ramp.elements[1].position = 0.92
    ramp.color_ramp.elements[1].color = (0.065, 0.20, 0.39, 1.0)
    set_input(shader, "Roughness", 0.94)
    set_input(shader, "Emission Strength", 0.48)
    links.new(coordinates.outputs["Generated"], separate.inputs["Vector"])
    links.new(separate.outputs["Z"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(ramp.outputs["Color"], shader.inputs["Emission Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    material.diffuse_color = (0.18, 0.40, 0.62, 1.0)
    material["CV_MaterialFamily"] = "Mediterranean Sky Backdrop"
    material["CV_ProductionStage"] = "ER-06 lightweight exterior depth"
    return material


def make_calm_sea_material():
    material = bpy.data.materials.new("CV_Mat_Exterior_Sea")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    output.name = "CV_Sea_Output"
    output.location = (560, 0)
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.name = "CV_Sea_Principled"
    shader.location = (300, 0)
    coordinates = nodes.new("ShaderNodeTexCoord")
    coordinates.name = "CV_Sea_Coordinates"
    coordinates.location = (-520, 0)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = "CV_Sea_BroadVariation"
    noise.location = (-300, 0)
    noise.noise_dimensions = "3D"
    noise.inputs["Scale"].default_value = 2.2
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.42
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = "CV_Sea_CoastalColor"
    ramp.location = (-40, 20)
    ramp.color_ramp.elements[0].color = (0.010, 0.065, 0.115, 1.0)
    ramp.color_ramp.elements[1].color = (0.055, 0.235, 0.330, 1.0)
    set_input(shader, "Roughness", 0.27)
    set_input(shader, "Metallic", 0.12)
    set_input(shader, "Coat Weight", 0.22)
    set_input(shader, "Coat Roughness", 0.18)
    set_input(shader, "Emission Strength", 0.18)
    links.new(coordinates.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(ramp.outputs["Color"], shader.inputs["Emission Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    material.diffuse_color = (0.020, 0.105, 0.175, 1.0)
    material["CV_MaterialFamily"] = "Calm Mediterranean Water"
    material["CV_ProductionStage"] = "ER-06 lightweight exterior depth"
    return material


def make_console_materials():
    return {
        "enclosure": er04b.make_refined_metal_material(
            "CV_Mat_Console_Enclosure", (0.004, 0.006, 0.008), (0.021, 0.025, 0.029),
            0.76, 0.48, 0.60, 3.0, 115.0, 0.009, 0.06, "Console Dark Enclosure"),
        "trim": er04b.make_refined_metal_material(
            "CV_Mat_Console_Trim", (0.020, 0.013, 0.006), (0.075, 0.047, 0.017),
            1.0, 0.36, 0.46, 2.1, 135.0, 0.009, 0.20, "Console Bronze Trim"),
        "screen": er04b.make_console_screen_material(),
    }


def add_linked_copy(source, name, location, collection, rotation=None, scale=None):
    obj = source.copy()
    obj.data = source.data
    obj.name = name
    obj.location = location
    if rotation is not None:
        obj.rotation_euler = rotation
    if scale is not None:
        obj.scale = scale
    collection.objects.link(obj)
    return obj


def add_tilted_box(name, location, dimensions, material, collection, rotation_x=0.0, rotation_z=0.0, bevel=0.02):
    obj = er02.add_box(name, location, dimensions, material, collection, bevel=bevel)
    obj.rotation_euler.x = rotation_x
    obj.rotation_euler.z = rotation_z
    return obj


def add_cylinder_between(name, start, end, radius, material, collection, vertices=40, bevel=0.012):
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    midpoint = (start_v + end_v) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=direction.length,
        location=midpoint,
        rotation=direction.to_track_quat("Z", "Y").to_euler(),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    er01.move_to_collection(obj, collection)
    er03.smooth_mesh(obj)
    if bevel:
        er03.add_bevel(obj, bevel, 2)
    return obj


def add_bezier_conduit(name, points, radius, material, collection):
    curve_data = bpy.data.curves.new(f"{name}_Curve", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 10
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 4
    spline = curve_data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve_data)
    curve_data.materials.append(material)
    collection.objects.link(obj)
    obj["CV_Routing"] = "Purposeful ER-06 installed conduit; authored endpoints and bend clearance"
    return obj


def organic_flow_points(center, z_min, z_max, radius, turns, count, phase, drift, breathing):
    points = []
    for index in range(count):
        t = index / (count - 1)
        eased_t = t + 0.018 * math.sin(math.tau * t) * math.sin(math.pi * t)
        angle = phase + math.tau * (
            turns * t
            + 0.055 * math.sin(math.tau * 1.35 * t + phase)
            + 0.025 * math.sin(math.tau * 3.1 * t)
        )
        local_radius = radius * (
            1.0
            + breathing * math.sin(math.tau * 1.7 * t + phase)
            + 0.055 * math.sin(math.tau * 4.3 * t + phase * 0.4)
        )
        drift_x = drift * math.sin(math.tau * 0.82 * t + phase)
        drift_y = drift * 0.72 * math.sin(math.tau * 1.17 * t + phase * 0.65)
        points.append((
            center[0] + drift_x + math.cos(angle) * local_radius,
            center[1] + drift_y + math.sin(angle) * local_radius,
            z_min + (z_max - z_min) * eased_t,
        ))
    return points


def organic_arc_points(center, z, radius, span, count, phase, drift_x=0.0, drift_y=0.0, rise=0.0):
    points = []
    for index in range(count):
        t = index / (count - 1)
        angle = phase + math.tau * span * (
            t + 0.020 * math.sin(math.pi * t) * math.sin(math.tau * t)
        )
        local_radius = radius * (
            1.0 + 0.055 * math.sin(angle * 2.2 + phase) + 0.025 * math.sin(math.tau * 3.0 * t)
        )
        points.append((
            center[0] + drift_x + math.cos(angle) * local_radius,
            center[1] + drift_y + math.sin(angle) * local_radius,
            z + rise * (t - 0.5) + 0.035 * math.sin(angle * 1.8 + phase),
        ))
    return points


def build_refined_energy(collection, materials):
    cx, cy = MAIN_CENTER
    main_strands = (
        ("Primary", 0.52, 3.05, 0.18, 0.13, 0.010, "core"),
        ("CounterFlow", 0.74, -2.45, 2.10, 0.16, 0.006, "accent"),
        ("InnerFlow", 0.24, 5.20, 0.76, 0.18, 0.0045, "accent"),
        ("CrossFlow", 0.42, -3.55, 3.05, 0.20, 0.0040, "accent"),
    )
    for name, radius, turns, phase, drift, bevel, material_key in main_strands:
        er05.add_energy_curve(
            f"CV_Energy_Main_ER06_{name}",
            organic_flow_points((cx, cy), 1.43, 4.80, radius, turns, 250, phase, drift, 0.16),
            bevel, materials[material_key], collection)

    main_arcs = (
        (1.58, 0.48, 0.58, 0.10, -0.08, 0.04, 0.12),
        (1.96, 0.82, 0.73, 1.02, 0.10, -0.05, -0.08),
        (2.43, 0.61, 0.66, 2.22, -0.05, 0.10, 0.16),
        (2.95, 0.90, 0.78, 0.62, 0.12, 0.06, -0.14),
        (3.44, 0.67, 0.69, 1.68, -0.10, -0.04, 0.10),
        (3.94, 0.84, 0.74, 2.72, 0.06, -0.10, 0.18),
        (4.45, 0.53, 0.61, 0.28, -0.04, 0.08, -0.10),
    )
    for index, (z, radius, span, phase, dx, dy, rise) in enumerate(main_arcs, start=1):
        er05.add_energy_curve(
            f"CV_Energy_Main_ER06_Arc_{index:02d}",
            organic_arc_points((cx, cy), z, radius, span, 112, phase, dx, dy, rise),
            0.0045 if index in (1, 7) else 0.0055,
            materials["accent"], collection)

    sx, sy = SECONDARY_CENTER
    for name, radius, turns, phase in (("Primary", 0.25, 2.15, 0.55), ("Counter", 0.37, -1.65, 2.30)):
        er05.add_energy_curve(
            f"CV_Energy_Secondary_ER06_{name}",
            organic_flow_points((sx, sy), 1.02, 3.18, radius, turns, 170, phase, 0.075, 0.12),
            0.0055 if name == "Primary" else 0.0035,
            materials["secondary"], collection)
    for index, values in enumerate(((1.42, 0.32, 0.62, 0.35), (2.10, 0.46, 0.70, 1.45), (2.78, 0.35, 0.64, 2.55)), start=1):
        z, radius, span, phase = values
        er05.add_energy_curve(
            f"CV_Energy_Secondary_ER06_Arc_{index:02d}",
            organic_arc_points((sx, sy), z, radius, span, 84, phase, 0.025, -0.025, 0.08),
            0.0035, materials["secondary"], collection)

    er05.add_energy_point_light(
        "CV_EnergyLight_Main_Lower", (cx, cy, 1.62), 90.0,
        (0.06, 0.34, 1.0), 0.42, collection)
    er05.add_energy_point_light(
        "CV_EnergyLight_Main_Core", (cx, cy, 3.08), 190.0,
        (0.04, 0.28, 1.0), 0.58, collection)
    er05.add_energy_point_light(
        "CV_EnergyLight_Main_Upper", (cx, cy, 4.58), 70.0,
        (0.08, 0.40, 1.0), 0.38, collection)
    er05.add_energy_point_light(
        "CV_EnergyLight_Secondary_Core", (sx, sy, 2.12), 45.0,
        (0.05, 0.28, 0.90), 0.34, collection)


def add_port_bolt_circle(prefix, center, axis_direction, radius, material, collection, count=6):
    axis = Vector(axis_direction).normalized()
    tangent = Vector((-axis.y, axis.x, 0.0)).normalized()
    vertical = Vector((0.0, 0.0, 1.0))
    for index in range(count):
        angle = math.tau * index / count
        offset = tangent * (math.cos(angle) * radius) + vertical * (math.sin(angle) * radius)
        bolt_center = Vector(center) + offset
        add_cylinder_between(
            f"{prefix}_{index + 1:02d}",
            bolt_center - axis * 0.035,
            bolt_center + axis * 0.035,
            0.038, material, collection, 24, 0.006)


def build_main_reactor_detail(collection, materials):
    cx, cy = MAIN_CENTER

    # Machined post collars establish assembly/service logic at two working heights.
    source = None
    for level_index, z in enumerate((2.02, 4.20), start=1):
        for index in range(8):
            angle = math.tau * index / 8.0 + math.pi / 8.0
            location = (cx + math.cos(angle) * 2.03, cy + math.sin(angle) * 2.03, z)
            name = f"CV_ER06_Main_PostCollar_{level_index:02d}_{index + 1:02d}"
            if source is None:
                source = er03.add_cylinder(name, location, 0.18, 0.105,
                                           materials["machine_light"], collection, 40, 0.010)
            else:
                add_linked_copy(source, name, location, collection)

    # Secondary frame bosses and bolt heads enrich the approved junction language.
    for level_index, z in enumerate((1.27, 3.13, 5.03), start=1):
        for index in range(8):
            angle = math.tau * index / 8.0 + math.pi / 8.0
            er03.add_radial_cylinder(
                f"CV_ER06_Main_RingFastener_{level_index:02d}_{index + 1:02d}",
                cx, cy, 2.45, z, 0.052, 0.075, angle,
                materials["machine_light"], collection, 28, 0.006)

    for z, radius, minor in ((0.62, 2.20, 0.026), (0.90, 2.12, 0.022), (1.13, 2.06, 0.024)):
        er03.add_torus(f"CV_ER06_Main_BaseTransition_{int(z * 100):03d}", cx, cy, z,
                       radius, minor, materials["machine_light"], collection, 96, 10)

    for index, angle in enumerate((math.radians(-67), math.radians(22), math.radians(112), math.radians(202)), start=1):
        er03.add_radial_box(
            f"CV_ER06_Main_InspectionHousing_{index:02d}", cx, cy, 2.20, 2.18,
            0.22, 0.38, 0.34, angle, materials["machine_dark"], collection, 0.020)
        er03.add_radial_cylinder(
            f"CV_ER06_Main_InspectionCap_{index:02d}", cx, cy, 2.34, 2.18,
            0.105, 0.095, angle, materials["machine_light"], collection, 36, 0.009)

    for level_index, z in enumerate((1.49, 4.73), start=1):
        for index in range(8):
            angle = math.tau * index / 8.0 + math.pi / 8.0
            er03.add_radial_beam(
                f"CV_ER06_Main_SupportRib_{level_index:02d}_{index + 1:02d}",
                cx, cy, z, angle, 1.72, 2.13, 0.12, 0.11,
                materials["machine_light"], collection, 0.010)

    for index in range(6):
        angle = math.tau * index / 6.0
        er03.add_radial_box(
            f"CV_ER06_Main_BaseServicePanel_{index + 1:02d}", cx, cy, 2.08, 0.79,
            0.12, 0.44, 0.22, angle, materials["machine_dark"], collection, 0.012)
        er03.add_radial_cylinder(
            f"CV_ER06_Main_BaseServiceLatch_{index + 1:02d}", cx, cy, 2.16, 0.79,
            0.045, 0.055, angle, materials["machine_light"], collection, 24, 0.005)

    port_specs = (
        ("Front", -math.pi / 2.0, 0.92, 0.32),
        ("Right", -math.pi / 12.0, 0.96, 0.29),
        ("Left", math.pi * 1.08, 1.02, 0.26),
    )
    for label, angle, z, bolt_radius in port_specs:
        axis = (math.cos(angle), math.sin(angle), 0.0)
        center = (cx + axis[0] * 2.89, cy + axis[1] * 2.89, z)
        add_port_bolt_circle(
            f"CV_ER06_Main_Port{label}_Bolt", center, axis, bolt_radius,
            materials["machine_light"], collection)


def build_main_internal_detail(collection, materials):
    cx, cy = MAIN_CENTER
    ring_specs = (
        (1.82, 0.28, 0.78, 0.085),
        (2.38, 0.34, 0.95, 0.075),
        (2.94, 0.25, 0.70, 0.090),
        (3.50, 0.36, 0.98, 0.075),
        (4.08, 0.30, 0.82, 0.085),
        (4.54, 0.22, 0.62, 0.075),
    )
    for index, (z, inner_radius, outer_radius, depth) in enumerate(ring_specs, start=1):
        er03.add_annulus(
            f"CV_ER06_Internal_NestedRing_{index:02d}", cx, cy, z,
            inner_radius, outer_radius, depth,
            materials["inner_light"] if index % 2 else materials["inner"],
            collection, 64, 0.010)

    for index, angle in enumerate((0.0, math.pi / 2.0, math.pi, math.pi * 1.5), start=1):
        x = cx + math.cos(angle) * 0.56
        y = cy + math.sin(angle) * 0.56
        er03.add_cylinder(
            f"CV_ER06_Internal_ServiceRail_{index:02d}", (x, y, 3.12),
            0.040, 3.02, materials["inner"], collection, 28, 0.007)
        for collar_index, z in enumerate((1.78, 2.72, 3.68, 4.46), start=1):
            er03.add_cylinder(
                f"CV_ER06_Internal_ServiceRailCollar_{index:02d}_{collar_index:02d}",
                (x, y, z), 0.074, 0.065, materials["inner_light"], collection, 28, 0.006)

    for index, z in enumerate((2.08, 2.82, 3.58, 4.30), start=1):
        er03.add_cylinder(
            f"CV_ER06_Internal_AxisCollar_{index:02d}", (cx, cy, z),
            0.30 if index % 2 else 0.25, 0.16,
            materials["inner_light"] if index % 2 else materials["machine_light"],
            collection, 56, 0.012)
        for arm in range(3):
            angle = math.tau * arm / 3.0 + index * 0.36
            er03.add_radial_beam(
                f"CV_ER06_Internal_CollarBrace_{index:02d}_{arm + 1:02d}",
                cx, cy, z, angle, 0.28, 0.62, 0.055, 0.060,
                materials["inner_light"], collection, 0.007)

    for index, (angle, z) in enumerate(((0.4, 2.20), (1.8, 2.62), (3.2, 3.76), (4.7, 4.14)), start=1):
        x = cx + math.cos(angle) * 0.92
        y = cy + math.sin(angle) * 0.92
        er03.add_cylinder(
            f"CV_ER06_Internal_AuxiliaryCylinder_{index:02d}", (x, y, z),
            0.12, 0.42, materials["inner"], collection, 36, 0.010)
        er03.add_cylinder(
            f"CV_ER06_Internal_AuxiliaryCap_{index:02d}", (x, y, z + 0.23),
            0.15, 0.06, materials["machine_light"], collection, 36, 0.007)


def build_secondary_detail(collection, materials):
    cx, cy = SECONDARY_CENTER
    source = None
    for level_index, z in enumerate((1.55, 2.72), start=1):
        for index in range(6):
            angle = math.tau * index / 6.0 + math.pi / 6.0
            location = (cx + math.cos(angle) * 1.00, cy + math.sin(angle) * 1.00, z)
            name = f"CV_ER06_Secondary_PostCollar_{level_index:02d}_{index + 1:02d}"
            if source is None:
                source = er03.add_cylinder(name, location, 0.115, 0.075,
                                           materials["machine_light"], collection, 32, 0.008)
            else:
                add_linked_copy(source, name, location, collection)

    for index, (z, inner_radius, outer_radius) in enumerate(((1.46, 0.19, 0.52), (2.42, 0.22, 0.60), (2.94, 0.16, 0.46)), start=1):
        er03.add_annulus(
            f"CV_ER06_Secondary_InternalRing_{index:02d}", cx, cy, z,
            inner_radius, outer_radius, 0.065, materials["inner_light"], collection, 48, 0.008)

    connection_angle = math.atan2(MAIN_CENTER[1] - cy, MAIN_CENTER[0] - cx)
    er03.add_radial_box(
        "CV_ER06_Secondary_InterfaceMount", cx, cy, 1.02, 2.34,
        0.22, 0.34, 0.32, connection_angle,
        materials["machine_dark"], collection, 0.018)
    er03.add_radial_cylinder(
        "CV_ER06_Secondary_InterfaceCollar", cx, cy, 1.18, 2.34,
        0.18, 0.18, connection_angle,
        materials["machine_light"], collection, 48, 0.012)
    er03.add_radial_cylinder(
        "CV_ER06_Secondary_InterfaceFace", cx, cy, 1.32, 2.34,
        0.12, 0.10, connection_angle,
        materials["machine_dark"], collection, 40, 0.008)

    for index in range(6):
        angle = math.tau * index / 6.0
        er03.add_radial_box(
            f"CV_ER06_Secondary_BaseAnchor_{index + 1:02d}", cx, cy, 1.16, 0.48,
            0.20, 0.24, 0.14, angle, materials["machine"], collection, 0.012)


def build_conduits(collection, materials):
    # Main right lower port to the secondary lower service port.
    lower_points = (
        (3.03, 1.02, 0.96),
        (3.48, 1.32, 0.76),
        (4.20, 2.62, 0.48),
        (5.18, 4.15, 0.46),
        (5.06, 5.20, 0.52),
        (4.60, 5.58, 0.72),
    )
    add_bezier_conduit("CV_ER06_Conduit_MainToSecondary_Lower", lower_points, 0.085,
                       materials["machine_dark"], collection)

    # Elevated service/data route connects the approved side zones without touching the glass.
    upper_points = (
        (2.54, 1.80, 3.18),
        (2.88, 2.56, 3.22),
        (3.14, 3.72, 3.03),
        (3.26, 4.85, 2.72),
        (3.54, 5.72, 2.45),
        (3.80, 6.00, 2.34),
    )
    add_bezier_conduit("CV_ER06_Conduit_MainToSecondary_Upper", upper_points, 0.065,
                       materials["machine_dark"], collection)

    # Main left lower interface to the console pedestal: short, floor-following and serviceable.
    console_points = (
        (-2.82, 1.05, 1.02),
        (-3.12, 0.56, 0.84),
        (-3.48, -0.18, 0.42),
        (-3.98, -0.88, 0.30),
        (-4.48, -1.22, 0.34),
        (-4.60, -1.40, 0.78),
    )
    add_bezier_conduit("CV_ER06_Conduit_MainToConsole_Power", console_points, 0.070,
                       materials["machine_dark"], collection)
    data_points = tuple((x - 0.12, y + 0.05, z + 0.025) for x, y, z in console_points)
    add_bezier_conduit("CV_ER06_Conduit_MainToConsole_Data", data_points, 0.038,
                       materials["inner"], collection)

    endpoint_specs = (
        ("MainLower", lower_points[0], lower_points[1], 0.14),
        ("SecondaryLower", lower_points[-1], lower_points[-2], 0.14),
        ("MainUpper", upper_points[0], upper_points[1], 0.12),
        ("SecondaryUpper", upper_points[-1], upper_points[-2], 0.12),
        ("MainConsole", console_points[0], console_points[1], 0.13),
        ("Console", console_points[-1], console_points[-2], 0.13),
    )
    for label, start, toward, radius in endpoint_specs:
        direction = (Vector(toward) - Vector(start)).normalized()
        add_cylinder_between(
            f"CV_ER06_ConduitCollar_{label}",
            Vector(start) - direction * 0.07,
            Vector(start) + direction * 0.10,
            radius, materials["machine_light"], collection, 40, 0.010)

    for index, (x, y, angle) in enumerate(((-3.52, -0.22, -0.45), (-4.05, -0.93, -0.60), (4.24, 2.66, 0.82), (5.10, 4.18, 1.40)), start=1):
        er03.add_box(
            f"CV_ER06_ConduitFloorSaddle_{index:02d}", (x, y, 0.22),
            (0.30, 0.42, 0.13), materials["machine_light"], collection,
            rotation_z=angle, bevel=0.012)


def build_console_detail(collection, materials):
    cx, cy = (-4.95, -1.62)
    tilt = math.radians(-18.0)
    add_tilted_box("CV_ER06_Console_DisplayHousing", (cx, cy - 0.13, 1.86),
                   (1.92, 0.34, 0.96), materials["enclosure"], collection, tilt, bevel=0.045)
    add_tilted_box("CV_ER06_Console_DisplayScreen", (cx, cy - 0.335, 1.86),
                   (1.44, 0.035, 0.56), materials["display"], collection, tilt, bevel=0.012)

    for name, location, dimensions in (
        ("BezelTop", (cx, cy - 0.355, 2.20), (1.66, 0.065, 0.090)),
        ("BezelBottom", (cx, cy - 0.265, 1.52), (1.66, 0.065, 0.090)),
        ("BezelLeft", (cx - 0.78, cy - 0.31, 1.86), (0.090, 0.065, 0.74)),
        ("BezelRight", (cx + 0.78, cy - 0.31, 1.86), (0.090, 0.065, 0.74)),
    ):
        add_tilted_box(f"CV_ER06_Console_{name}", location, dimensions,
                       materials["trim"], collection, tilt, bevel=0.012)

    add_tilted_box("CV_ER06_Console_TopHood", (cx, cy + 0.02, 2.31),
                   (2.04, 0.54, 0.14), materials["trim"], collection, tilt, bevel=0.025)
    for side, x in (("Left", cx - 0.92), ("Right", cx + 0.92)):
        add_tilted_box(f"CV_ER06_Console_SideCheek_{side}", (x, cy - 0.05, 1.87),
                       (0.14, 0.46, 1.02), materials["trim"], collection, tilt, bevel=0.022)

    add_tilted_box("CV_ER06_Console_LowerEnclosure", (cx, cy - 0.20, 1.37),
                   (1.92, 0.74, 0.44), materials["enclosure"], collection, 0.0, bevel=0.035)
    add_tilted_box("CV_ER06_Console_TechnicalPanel", (cx, cy - 0.59, 1.38),
                   (1.58, 0.035, 0.26), materials["enclosure"], collection, 0.0, bevel=0.012)
    add_tilted_box("CV_ER06_Console_PanelUpperSeam", (cx, cy - 0.615, 1.55),
                   (1.64, 0.035, 0.035), materials["trim"], collection, 0.0, bevel=0.006)
    add_tilted_box("CV_ER06_Console_BaseInterface", (cx, cy - 0.02, 1.10),
                   (2.02, 1.02, 0.16), materials["trim"], collection, 0.0, bevel=0.025)

    for index, x in enumerate((cx - 0.51, cx - 0.17, cx + 0.17, cx + 0.51), start=1):
        add_cylinder_between(
            f"CV_ER06_Console_Port_{index:02d}",
            (x, cy - 0.65, 1.38), (x, cy - 0.73, 1.38),
            0.075 if index in (1, 4) else 0.058,
            materials["trim"] if index in (1, 4) else materials["enclosure"],
            collection, 32, 0.007)

    for index, x in enumerate((cx - 0.76, cx + 0.76), start=1):
        add_cylinder_between(
            f"CV_ER06_Console_BaseFastener_{index:02d}",
            (x, cy - 0.50, 1.08), (x, cy - 0.60, 1.08),
            0.055, materials["trim"], collection, 28, 0.006)


def create_mountain_ribbon(name, x, y_values, top_values, bottom_z, material, collection):
    vertices = []
    faces = []
    for y, top_z in zip(y_values, top_values):
        vertices.extend(((x, y, bottom_z), (x, y, top_z)))
    for index in range(len(y_values) - 1):
        lower_a = index * 2
        upper_a = lower_a + 1
        lower_b = lower_a + 2
        upper_b = lower_a + 3
        faces.append((lower_a, lower_b, upper_b, upper_a))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    mesh.materials.append(material)
    collection.objects.link(obj)
    return obj


def build_exterior(collection, materials, detail_materials):
    # Cheap authored layers: luminous sky card, real water plane and two low-poly coast ribbons.
    er03.add_box("CV_ER06_Exterior_SkyBackdrop", (-27.0, 4.0, 5.0),
                 (0.10, 42.0, 11.0), detail_materials["sky"], collection, bevel=0.0)
    er03.add_box("CV_ER06_Exterior_Sea", (-18.0, 4.0, 0.38),
                 (18.0, 38.0, 0.10), detail_materials["sea"], collection, bevel=0.0)

    y_values = (-13.0, -9.0, -5.0, -1.0, 3.0, 7.0, 11.0, 15.0, 19.0, 23.0)
    create_mountain_ribbon(
        "CV_ER06_Exterior_CoastFar", -25.0, y_values,
        (1.28, 1.52, 1.36, 1.72, 1.45, 1.86, 1.64, 2.02, 1.58, 1.34),
        0.40, detail_materials["coast_far"], collection)
    create_mountain_ribbon(
        "CV_ER06_Exterior_CoastNear", -20.5, y_values,
        (0.92, 1.18, 1.04, 1.34, 1.12, 1.48, 1.20, 1.42, 1.08, 0.88),
        0.36, detail_materials["coast_near"], collection)

    # Restrained balcony continuation and one olive-like plant provide near/mid/far depth.
    er03.add_box("CV_ER06_Exterior_BalconyTrim", (-9.62, 4.5, 0.92),
                 (0.22, 18.7, 0.20), materials["stone_light"], collection, bevel=0.035)
    er03.add_cylinder("CV_ER06_Exterior_PlantPot", (-7.03, -2.55, 0.34),
                      0.34, 0.62, materials["stone_dark"], collection, 48, 0.025)
    er03.add_cone("CV_ER06_Exterior_PlantPotLip", (-7.03, -2.55, 0.66),
                  0.38, 0.32, 0.16, materials["stone_light"], collection, 48, 0.018)
    add_cylinder_between("CV_ER06_Exterior_PlantStem", (-7.03, -2.55, 0.66),
                         (-7.02, -2.54, 1.72), 0.045,
                         materials["stone_dark"], collection, 24, 0.006)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=(-6.91, -2.55, 1.10))
    leaf_source = bpy.context.object
    leaf_source.name = "CV_ER06_Exterior_PlantLeaf_01"
    leaf_source.scale = (0.12, 0.045, 0.42)
    leaf_source.rotation_euler = (0.0, math.radians(24), math.radians(-18))
    leaf_source.data.materials.append(detail_materials["foliage"])
    er01.move_to_collection(leaf_source, collection)
    leaf_specs = (
        ((-7.19, -2.53, 1.18), (0.0, -0.42, 0.45), (0.11, 0.045, 0.40)),
        ((-6.88, -2.60, 1.42), (0.2, 0.52, -0.65), (0.13, 0.050, 0.46)),
        ((-7.20, -2.49, 1.48), (-0.1, -0.55, 0.78), (0.12, 0.045, 0.44)),
        ((-6.96, -2.58, 1.69), (0.1, 0.38, -0.35), (0.10, 0.040, 0.36)),
        ((-7.15, -2.50, 1.77), (-0.15, -0.30, 0.55), (0.09, 0.038, 0.32)),
        ((-6.82, -2.51, 1.25), (0.05, 0.66, -0.88), (0.12, 0.045, 0.42)),
        ((-7.25, -2.59, 1.30), (0.18, -0.62, 1.05), (0.11, 0.042, 0.38)),
    )
    for index, (location, rotation, scale) in enumerate(leaf_specs, start=2):
        add_linked_copy(leaf_source, f"CV_ER06_Exterior_PlantLeaf_{index:02d}",
                        location, collection, rotation, scale)


def build_architecture_detail(collection, architecture_materials, reactor_materials, detail_materials, light_collection):
    cx, cy = MAIN_CENTER
    er03.add_torus("CV_ER06_Platform_ServiceChannel_Inner", cx, cy, 0.245, 4.18, 0.024,
                   reactor_materials["machine_dark"], collection, 112, 10)
    er03.add_torus("CV_ER06_Platform_ServiceChannel_Outer", cx, cy, 0.245, 4.43, 0.022,
                   reactor_materials["machine_dark"], collection, 112, 10)
    for index in range(8):
        angle = math.tau * index / 8.0 + math.pi / 8.0
        er03.add_radial_box(
            f"CV_ER06_Platform_ServiceCover_{index + 1:02d}", cx, cy, 4.30, 0.29,
            0.22, 0.34, 0.10, angle, reactor_materials["machine_light"], collection, 0.010)

    er03.add_box("CV_ER06_Arcade_ThresholdRail", (-7.00, 4.45, 0.10),
                 (0.11, 18.60, 0.12), reactor_materials["machine_dark"], collection,
                 rotation_z=0.0, bevel=0.012)

    # One physically backed warm rear practical adds human scale without changing the key hierarchy.
    fixture_x, fixture_y, fixture_z = (6.55, 11.34, 3.90)
    add_cylinder_between("CV_ER06_Practical_WallMount", (fixture_x, fixture_y + 0.10, fixture_z),
                         (fixture_x, fixture_y - 0.20, fixture_z), 0.15,
                         reactor_materials["machine_dark"], collection, 36, 0.010)
    er03.add_cylinder("CV_ER06_Practical_Glass", (fixture_x, fixture_y - 0.23, fixture_z),
                      0.13, 0.52, detail_materials["practical"], collection, 36, 0.008)
    for index, z in enumerate((fixture_z - 0.29, fixture_z + 0.29), start=1):
        er03.add_cylinder(f"CV_ER06_Practical_Cap_{index:02d}", (fixture_x, fixture_y - 0.23, z),
                          0.18, 0.08, reactor_materials["machine_light"], collection, 36, 0.009)
    lamp_data = bpy.data.lights.new(name="CV_Light_Practical_ER06", type="POINT")
    lamp_data.energy = 22.0
    lamp_data.color = (1.0, 0.50, 0.22)
    lamp_data.shadow_soft_size = 0.18
    lamp_data.use_shadow = False
    lamp = bpy.data.objects.new("CV_Light_Practical_ER06", lamp_data)
    lamp.location = (fixture_x, fixture_y - 0.48, fixture_z)
    lamp["CV_LightingRole"] = "ER-06 physical rear practical; minor local readability only"
    light_collection.objects.link(lamp)


def configure_scene():
    scene = er05.configure_scene()
    scene.name = "CV_EngineRoom_ER06"
    scene["CV_ProductionStage"] = "ER-06 Detail Pass"
    scene["CV_PreviousApprovedStage"] = "ER-05 Final Lighting / Energy Match"
    scene["CV_HeroCameraLocked"] = True
    scene["CV_ER05LightingLocked"] = True
    scene["CV_ApprovedMaterialsLocked"] = True
    scene["CV_MajorGeometryLocked"] = True
    scene["CV_StageScope"] = "Secondary authored detail, installed infrastructure, console and lightweight exterior depth"
    scene["CV_RuntimeDeferred"] = True
    scene["CV_GLBExported"] = False
    return scene


def build_scene():
    scene = configure_scene()
    architecture_materials = er04b.make_architecture_materials()
    reactor_materials = er04b.make_reactor_materials()
    secondary_materials = er04b.make_secondary_materials(reactor_materials)
    console_materials = make_console_materials()
    energy_materials = {
        "core": er05.make_energy_material(
            "CV_Mat_Energy_BlueCore", (0.020, 0.22, 0.95), 8.0, "Main Active Core Energy"),
        "accent": er05.make_energy_material(
            "CV_Mat_Energy_BlueAccent", (0.020, 0.16, 0.65), 3.8, "Main Layered Energy Accent"),
        "secondary": er05.make_energy_material(
            "CV_Mat_Energy_BlueSecondary", (0.020, 0.14, 0.55), 2.6, "Secondary Active Energy"),
    }
    detail_materials = {
        "sky": make_gradient_sky_material(),
        "sea": make_calm_sea_material(),
        "coast_far": make_simple_material(
            "CV_Mat_Exterior_CoastFar", (0.11, 0.19, 0.23), 0.96, emission_strength=0.22,
            family="Distant Coastal Silhouette"),
        "coast_near": make_simple_material(
            "CV_Mat_Exterior_CoastNear", (0.055, 0.12, 0.13), 0.94, emission_strength=0.14,
            family="Near Coastal Silhouette"),
        "foliage": make_simple_material(
            "CV_Mat_Vegetation_Olive", (0.025, 0.070, 0.030), 0.82,
            family="Restrained Mediterranean Vegetation"),
        "practical": make_simple_material(
            "CV_Mat_Practical_Warm", (1.0, 0.34, 0.08), 0.38, emission_strength=1.6,
            family="Warm Architectural Practical"),
        "console_display": make_simple_material(
            "CV_Mat_Console_TechnicalStandby", (0.002, 0.026, 0.038), 0.20,
            emission_strength=0.28, family="Non-stateful Console Standby Surface"),
    }
    console_materials["display"] = detail_materials["console_display"]

    root = er01.create_collection("CV_EngineRoom")
    er04.build_approved_architecture(root, architecture_materials, console_materials)
    reactor_root = er01.create_collection("CV_Reactor", root)
    secondary_root = er01.create_collection("CV_Reactor_Secondary", root)
    energy = er01.create_collection("CV_Reactor_Energy", root)
    cameras = er01.create_collection("CV_Cameras", root)
    lights = er01.create_collection("CV_Lights_Final", root)
    detail_root = er01.create_collection("CV_Detail_ER06", root)
    main_detail = er01.create_collection("CV_Reactor_Detail_ER06", detail_root)
    internal_detail = er01.create_collection("CV_Reactor_InternalDetail_ER06", detail_root)
    secondary_detail = er01.create_collection("CV_Secondary_Detail_ER06", detail_root)
    conduits = er01.create_collection("CV_Conduits_ER06", detail_root)
    console_detail = er01.create_collection("CV_Console_Detail_ER06", detail_root)
    architecture_detail = er01.create_collection("CV_Architecture_Detail_ER06", detail_root)
    exterior = er01.create_collection("CV_Exterior_ER06", detail_root)

    er03.build_platform_interfaces(reactor_root, secondary_root, architecture_materials)
    er03.build_main_base(reactor_root, reactor_materials)
    er03.build_main_chamber(reactor_root, reactor_materials)
    er03.build_main_frame(reactor_root, reactor_materials)
    er03.build_main_cap(reactor_root, reactor_materials)
    er03.build_main_internal(reactor_root, reactor_materials)
    er03.build_main_ports(reactor_root, reactor_materials)
    er03.build_secondary_reactor(secondary_root, secondary_materials)
    er04b.assign_dark_structural_bronze(reactor_materials["bronze_dark"])
    er04c.apply_architecture_surface_normal_corrections()

    build_refined_energy(energy, energy_materials)
    build_main_reactor_detail(main_detail, reactor_materials)
    build_main_internal_detail(internal_detail, reactor_materials)
    build_secondary_detail(secondary_detail, secondary_materials)
    build_conduits(conduits, reactor_materials)
    build_console_detail(console_detail, console_materials)
    build_exterior(exterior, architecture_materials, detail_materials)

    hero_camera = er01.add_camera(
        "CV_HeroCamera", er02.HERO_CAMERA_POSITION, er02.HERO_CAMERA_TARGET,
        er02.HERO_FOCAL_LENGTH_MM, cameras)
    er04.add_reference_background(hero_camera, cameras)
    marker = bpy.data.objects.get("CV_CanonicalReference_Marker")
    if marker:
        marker["CV_ReferenceUse"] = "ER-06 detail/reference fidelity; approved hero camera locked"
    alternate_camera = er01.add_camera(
        "CV_ER06_AlternateCamera", (7.55, -8.75, 4.55), (0.55, 2.70, 2.80), 36.0, cameras)
    reactor_camera = er01.add_camera(
        "CV_ER06_ReactorDetailCamera", (4.45, -7.55, 3.45), (0.10, 1.80, 2.80), 42.0, cameras)
    console_camera = er01.add_camera(
        "CV_ER06_ConsoleCamera", (-2.90, -5.75, 2.45), (-4.95, -1.62, 1.55), 50.0, cameras)
    exterior_camera = er01.add_camera(
        "CV_ER06_ExteriorCamera", (-1.45, -8.00, 3.10), (-10.60, 1.80, 1.95), 36.0, cameras)
    er05.add_final_lighting(lights)
    build_architecture_detail(architecture_detail, architecture_materials, reactor_materials,
                              detail_materials, lights)

    render_jobs = (
        (hero_camera, HERO_RENDER_PATH),
        (alternate_camera, ALTERNATE_RENDER_PATH),
        (reactor_camera, REACTOR_CLOSEUP_PATH),
        (console_camera, CONSOLE_CLOSEUP_PATH),
        (exterior_camera, EXTERIOR_RENDER_PATH),
    )
    for camera, output_path in render_jobs:
        scene.camera = camera
        scene.render.filepath = str(output_path)
        if camera == hero_camera:
            bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
        bpy.ops.render.render(write_still=True)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved ER-06 source: {BLEND_PATH}")
    for _, output_path in render_jobs:
        print(f"Saved ER-06 review: {output_path}")


if __name__ == "__main__":
    build_scene()
