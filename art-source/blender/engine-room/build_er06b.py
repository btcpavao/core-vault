"""Build Core Vault Engine Room ER-06b: Final Fidelity Convergence Pass.

Run with:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python build_er06b.py

The approved ER-06 scene is reconstructed deterministically. ER-06b then adds
only a separable fidelity layer: organized micro-mechanical transitions,
spatially layered energy, a project-owned photographic exterior matte and
restrained contact/assembly realism. ER-07, runtime work and GLB export remain
deferred.
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
import build_er06 as er06


REVIEW_DIR = SOURCE_DIR / "review"
ASSET_DIR = SOURCE_DIR / "assets"
MATTE_PATH = ASSET_DIR / "er06b-mediterranean-exterior.png"
BLEND_PATH = SOURCE_DIR / "engine-room.blend"
HERO_PATH = REVIEW_DIR / "er-06b-detail-hero.png"
ALTERNATE_PATH = REVIEW_DIR / "er-06b-detail-alternate.png"
REACTOR_PATH = REVIEW_DIR / "er-06b-reactor-fidelity-closeup.png"
ENERGY_PATH = REVIEW_DIR / "er-06b-energy-closeup.png"
CONSOLE_PATH = REVIEW_DIR / "er-06b-console-closeup.png"
EXTERIOR_PATH = REVIEW_DIR / "er-06b-exterior-depth.png"
MAIN_CENTER = er03.REACTOR_CENTER
SECONDARY_CENTER = (4.60, 7.00)


def set_input(shader, name, value):
    if name in shader.inputs:
        shader.inputs[name].default_value = value


def add_variable_energy_curve(name, points, bevel_depth, material, collection, phase=0.0):
    curve_data = bpy.data.curves.new(f"{name}_Curve", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 3
    curve_data.bevel_depth = bevel_depth
    curve_data.bevel_resolution = 3
    spline = curve_data.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for index, (point, coordinate) in enumerate(zip(spline.points, points)):
        t = index / max(len(points) - 1, 1)
        point.co = (*coordinate, 1.0)
        point.radius = 0.62 + 0.32 * (0.5 + 0.5 * math.sin(math.tau * 2.6 * t + phase))
    obj = bpy.data.objects.new(name, curve_data)
    curve_data.materials.append(material)
    collection.objects.link(obj)
    obj["CV_EnergyRole"] = "ER-06b spatial active-core fidelity layer"
    return obj


def build_energy_er06b(collection, materials):
    cx, cy = MAIN_CENTER
    strands = (
        ("AxisFlow", 1.42, 4.82, 0.18, 3.2, 0.20, 0.08, 0.0075, "hot"),
        ("CoreCounter", 1.46, 4.78, 0.34, -4.4, 1.35, 0.11, 0.0050, "core"),
        ("MidFlowA", 1.48, 4.76, 0.52, 3.55, 2.20, 0.15, 0.0055, "accent"),
        ("MidFlowB", 1.52, 4.70, 0.66, -2.65, 0.72, 0.18, 0.0038, "soft"),
        ("OuterFlow", 1.60, 4.62, 0.82, 2.10, 3.10, 0.20, 0.0032, "soft"),
        ("LowerConcentration", 1.58, 2.72, 0.48, 2.15, 1.88, 0.13, 0.0045, "accent"),
        ("UpperConcentration", 3.18, 4.56, 0.55, -2.25, 0.42, 0.14, 0.0042, "accent"),
    )
    for name, z0, z1, radius, turns, phase, drift, bevel, material_key in strands:
        points = er06.organic_flow_points((cx, cy), z0, z1, radius, turns, 270,
                                          phase, drift, 0.20)
        add_variable_energy_curve(f"CV_ER06B_Energy_Main_{name}", points, bevel,
                                  materials[material_key], collection, phase)

    arcs = (
        (1.57, 0.40, 0.54, 0.15, -0.09, 0.03, 0.11),
        (1.84, 0.67, 0.68, 1.10, 0.06, -0.07, -0.08),
        (2.12, 0.88, 0.76, 2.42, -0.04, 0.10, 0.13),
        (2.48, 0.55, 0.62, 0.58, 0.12, 0.02, -0.11),
        (2.84, 0.76, 0.71, 1.72, -0.11, -0.04, 0.15),
        (3.18, 0.94, 0.80, 2.92, 0.07, 0.09, -0.14),
        (3.54, 0.58, 0.65, 0.34, -0.07, -0.10, 0.10),
        (3.90, 0.82, 0.73, 1.48, 0.12, 0.04, 0.17),
        (4.22, 0.66, 0.68, 2.56, -0.09, 0.08, -0.12),
        (4.50, 0.43, 0.56, 0.90, 0.04, -0.05, 0.09),
    )
    for index, (z, radius, span, phase, dx, dy, rise) in enumerate(arcs, start=1):
        points = er06.organic_arc_points((cx, cy), z, radius, span, 120, phase,
                                         dx, dy, rise)
        add_variable_energy_curve(
            f"CV_ER06B_Energy_Main_Arc_{index:02d}", points,
            0.0032 if index in (1, 10) else 0.0042,
            materials["soft"] if index % 3 else materials["accent"],
            collection, phase)

    sx, sy = SECONDARY_CENTER
    for name, radius, turns, phase, material_key in (
        ("Axis", 0.17, 2.8, 0.5, "secondary"),
        ("Mid", 0.30, -2.1, 1.7, "soft"),
        ("Outer", 0.42, 1.55, 2.7, "soft"),
    ):
        points = er06.organic_flow_points((sx, sy), 1.02, 3.18, radius, turns,
                                          190, phase, 0.07, 0.15)
        add_variable_energy_curve(f"CV_ER06B_Energy_Secondary_{name}", points,
                                  0.0043 if name == "Axis" else 0.0030,
                                  materials[material_key], collection, phase)
    for index, (z, radius, span, phase) in enumerate((
        (1.38, 0.30, 0.60, 0.2), (1.92, 0.45, 0.68, 1.2),
        (2.46, 0.38, 0.63, 2.2), (2.92, 0.28, 0.58, 0.8)), start=1):
        add_variable_energy_curve(
            f"CV_ER06B_Energy_Secondary_Arc_{index:02d}",
            er06.organic_arc_points((sx, sy), z, radius, span, 90, phase,
                                    0.025, -0.025, 0.07),
            0.0028, materials["secondary"], collection, phase)

    # Thin energy wells coincide with mechanical levels instead of floating freely.
    for index, (z, radius, minor, key) in enumerate((
        (2.08, 0.34, 0.010, "hot"),
        (3.20, 0.46, 0.012, "accent"),
        (4.30, 0.30, 0.009, "hot"),
    ), start=1):
        er03.add_torus(f"CV_ER06B_EnergyWell_{index:02d}", cx, cy, z, radius,
                       minor, materials[key], collection, 72, 8)

    er05.add_energy_point_light("CV_EnergyLight_Main_Lower", (cx, cy, 1.62), 90.0,
                                (0.06, 0.34, 1.0), 0.42, collection)
    er05.add_energy_point_light("CV_EnergyLight_Main_Core", (cx, cy, 3.08), 190.0,
                                (0.04, 0.28, 1.0), 0.58, collection)
    er05.add_energy_point_light("CV_EnergyLight_Main_Upper", (cx, cy, 4.58), 70.0,
                                (0.08, 0.40, 1.0), 0.38, collection)
    er05.add_energy_point_light("CV_EnergyLight_Secondary_Core", (sx, sy, 2.12), 45.0,
                                (0.05, 0.28, 0.90), 0.34, collection)
    er05.add_energy_point_light("CV_ER06B_EnergyLight_LowerFocus", (cx - 0.10, cy + 0.05, 2.16),
                                22.0, (0.03, 0.20, 0.85), 0.24, collection)
    er05.add_energy_point_light("CV_ER06B_EnergyLight_UpperFocus", (cx + 0.08, cy - 0.06, 3.92),
                                18.0, (0.04, 0.24, 0.90), 0.22, collection)


def build_main_fidelity_detail(collection, materials):
    cx, cy = MAIN_CENTER
    # Ring breakups are limited to six organized transitions per structural level.
    for level_index, z in enumerate((1.40, 3.29, 4.90), start=1):
        er03.add_torus(f"CV_ER06B_Main_RingTransitionProfile_{level_index:02d}",
                       cx, cy, z, 2.20, 0.018,
                       materials["machine_light"], collection, 96, 8)
        for index in range(6):
            angle = math.tau * index / 6.0 + level_index * 0.18
            er03.add_radial_box(
                f"CV_ER06B_Main_RingSegmentBridge_{level_index:02d}_{index + 1:02d}",
                cx, cy, 2.18, z, 0.14, 0.24, 0.14, angle,
                materials["machine_dark"] if index % 2 else materials["machine_light"],
                collection, 0.010)

    # Mid-height clamp tabs make each post read as an assembled part.
    for index in range(8):
        angle = math.tau * index / 8.0 + math.pi / 8.0
        x = cx + math.cos(angle) * 2.03
        y = cy + math.sin(angle) * 2.03
        er03.add_cylinder(f"CV_ER06B_Main_PostMicroCollar_{index + 1:02d}",
                          (x, y, 2.62), 0.158, 0.070,
                          materials["machine_light"], collection, 36, 0.008)
        er03.add_radial_box(
            f"CV_ER06B_Main_PostServiceTab_{index + 1:02d}",
            cx, cy, 2.20, 2.62, 0.20, 0.18, 0.16, angle,
            materials["machine_dark"], collection, 0.010)

    # Four service brackets and paired latches interrupt otherwise broad clean bands.
    for index, (angle, z) in enumerate(((-0.65, 1.82), (0.62, 4.35), (2.40, 2.10), (3.76, 4.05)), start=1):
        er03.add_radial_box(f"CV_ER06B_Main_ServiceBracket_{index:02d}",
                           cx, cy, 2.18, z, 0.22, 0.34, 0.28, angle,
                           materials["machine_dark"], collection, 0.018)
        for side in (-1.0, 1.0):
            tangent = Vector((-math.sin(angle), math.cos(angle), 0.0))
            radial = Vector((math.cos(angle), math.sin(angle), 0.0))
            center = Vector((cx, cy, z)) + radial * 2.33 + tangent * (side * 0.10)
            er06.add_cylinder_between(
                f"CV_ER06B_Main_ServiceLatch_{index:02d}_{'L' if side < 0 else 'R'}",
                center - radial * 0.035, center + radial * 0.035, 0.035,
                materials["machine_light"], collection, 24, 0.005)

    # Diagonal internal mounts tie existing rails to the newly richer nested assembly.
    brace_specs = (
        ((0.42, 0.00, 1.72), (1.18, 0.16, 2.22)),
        ((0.00, 0.42, 2.28), (-0.18, 1.18, 2.78)),
        ((-0.42, 0.00, 2.84), (-1.18, -0.16, 3.34)),
        ((0.00, -0.42, 3.40), (0.18, -1.18, 3.90)),
        ((0.36, 0.20, 3.88), (1.05, 0.52, 4.34)),
        ((-0.36, -0.20, 2.02), (-1.05, -0.52, 2.48)),
    )
    for index, (start, end) in enumerate(brace_specs, start=1):
        er06.add_cylinder_between(
            f"CV_ER06B_Internal_DiagonalMount_{index:02d}",
            (cx + start[0], cy + start[1], start[2]),
            (cx + end[0], cy + end[1], end[2]),
            0.030, materials["inner_light"], collection, 24, 0.006)

    for index, (angle, z) in enumerate(((0.30, 2.46), (1.46, 3.02), (2.82, 3.66), (4.18, 2.72)), start=1):
        x = cx + math.cos(angle) * 0.78
        y = cy + math.sin(angle) * 0.78
        er03.add_cylinder(f"CV_ER06B_Internal_MountPod_{index:02d}", (x, y, z),
                          0.105, 0.30, materials["inner"], collection, 32, 0.008)
        er03.add_cylinder(f"CV_ER06B_Internal_MountPodCap_{index:02d}", (x, y, z + 0.17),
                          0.125, 0.045, materials["machine_light"], collection, 32, 0.006)


def build_secondary_fidelity_detail(collection, materials):
    cx, cy = SECONDARY_CENTER
    for index, angle in enumerate((0.20, 1.35, 2.55, 3.75, 5.00), start=1):
        er03.add_radial_box(f"CV_ER06B_Secondary_MicroMount_{index:02d}",
                           cx, cy, 1.08, 2.56 if index % 2 else 1.76,
                           0.14, 0.20, 0.18, angle,
                           materials["machine_dark"], collection, 0.010)
        er03.add_radial_cylinder(f"CV_ER06B_Secondary_MicroCap_{index:02d}",
                                cx, cy, 1.17, 2.56 if index % 2 else 1.76,
                                0.070, 0.060, angle,
                                materials["machine_light"], collection, 28, 0.006)
    for index, z in enumerate((1.72, 2.18, 2.68), start=1):
        er03.add_annulus(f"CV_ER06B_Secondary_InnerTransition_{index:02d}",
                         cx, cy, z, 0.18, 0.48 + index * 0.035, 0.045,
                         materials["inner_light"], collection, 48, 0.006)


def make_matte_material():
    material = bpy.data.materials.new("CV_Mat_ER06B_ExteriorMatte")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (520, 0)
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.location = (280, 0)
    texture = nodes.new("ShaderNodeTexImage")
    texture.name = "CV_ER06B_MediterraneanMatte"
    texture.location = (-300, 0)
    image = bpy.data.images.load(str(MATTE_PATH), check_existing=True)
    image.name = "CV_ER06B_MediterraneanExterior"
    image.pack()
    texture.image = image
    grade = nodes.new("ShaderNodeHueSaturation")
    grade.name = "CV_ER06B_MatteGrade"
    grade.location = (-40, 0)
    grade.inputs["Saturation"].default_value = 0.74
    grade.inputs["Value"].default_value = 0.72
    set_input(shader, "Roughness", 0.90)
    set_input(shader, "Emission Strength", 0.24)
    links.new(texture.outputs["Color"], grade.inputs["Color"])
    links.new(grade.outputs["Color"], shader.inputs["Base Color"])
    links.new(grade.outputs["Color"], shader.inputs["Emission Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    material.diffuse_color = (0.12, 0.25, 0.34, 1.0)
    material["CV_ProductionStage"] = "ER-06b project-owned photographic exterior support"
    material["CV_SourceImage"] = str(MATTE_PATH.relative_to(SOURCE_DIR))
    return material


def add_matte_plane(collection, material):
    x = -26.8
    y_min, y_max = -10.0, 20.0
    z_min, z_max = -5.0, 15.0
    vertices = ((x, y_min, z_min), (x, y_max, z_min),
                (x, y_max, z_max), (x, y_min, z_max))
    mesh = bpy.data.meshes.new("CV_ER06B_ExteriorMatte_Mesh")
    mesh.from_pydata(vertices, [], ((0, 1, 2, 3),))
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="CV_ER06B_MatteUV")
    mapping = {0: (0.0, 0.0), 1: (1.0, 0.0), 2: (1.0, 1.0), 3: (0.0, 1.0)}
    for loop in mesh.loops:
        uv_layer.data[loop.index].uv = mapping[loop.vertex_index]
    obj = bpy.data.objects.new("CV_ER06B_ExteriorMatte", mesh)
    mesh.materials.append(material)
    collection.objects.link(obj)
    obj["CV_ExteriorRole"] = "Distant photographic support only; interior remains authored geometry"
    return obj


def build_exterior_er06b(collection, architecture_materials, detail_materials):
    # Keep all ER-06 exterior geometry as an editable fallback, but replace only
    # its visibly simplified backdrop layers at render time.
    er06.build_exterior(collection, architecture_materials, detail_materials)
    for name in (
        "CV_ER06_Exterior_SkyBackdrop", "CV_ER06_Exterior_Sea",
        "CV_ER06_Exterior_CoastFar", "CV_ER06_Exterior_CoastNear",
    ):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.hide_render = True
            obj["CV_ER06B_Fallback"] = "Retained in source; replaced by photographic matte for final render"
    add_matte_plane(collection, make_matte_material())


def build_realism_support(collection, architecture_materials, reactor_materials):
    cx, cy = MAIN_CENTER
    # Contact gaskets and small construction seams add depth without touching approved materials.
    er03.add_torus("CV_ER06B_Reactor_BaseContactGasket", cx, cy, 0.455, 2.31, 0.026,
                   reactor_materials["machine_dark"], collection, 112, 10)
    er03.add_torus("CV_ER06B_Reactor_PlatformContactRing", cx, cy, 0.425, 2.96, 0.018,
                   reactor_materials["machine_dark"], collection, 112, 8)
    for index, y in enumerate((-4.55, -0.05, 4.45), start=1):
        er03.add_torus(f"CV_ER06B_LeftArcade_BaseJoint_{index:02d}", -7.58, y, 0.22,
                       0.53, 0.018, architecture_materials["stone_dark"], collection, 64, 8)
        er03.add_torus(f"CV_ER06B_LeftArcade_CapitalJoint_{index:02d}", -7.58, y, 4.42,
                       0.50, 0.015, architecture_materials["stone_dark"], collection, 64, 8)
    for index, x in enumerate((-5.20, -2.55, 2.70, 5.45), start=1):
        er03.add_box(f"CV_ER06B_Ceiling_BeamSeat_{index:02d}", (x, -4.32, 6.47),
                     (0.58, 0.24, 0.12), architecture_materials["stone_dark"],
                     collection, rotation_z=0.0, bevel=0.012)


def configure_scene():
    scene = er06.configure_scene()
    scene.name = "CV_EngineRoom_ER06b"
    scene["CV_ProductionStage"] = "ER-06b Final Fidelity Convergence Pass"
    scene["CV_PreviousApprovedStage"] = "ER-06 Detail Pass"
    scene["CV_ER07Started"] = False
    scene["CV_RuntimeDeferred"] = True
    scene["CV_GLBExported"] = False
    scene["CV_StageScope"] = "Narrow fidelity convergence: micro-mechanics, spatial energy, exterior matte and contact realism"
    return scene


def build_scene():
    scene = configure_scene()
    architecture_materials = er04b.make_architecture_materials()
    reactor_materials = er04b.make_reactor_materials()
    secondary_materials = er04b.make_secondary_materials(reactor_materials)
    console_materials = er06.make_console_materials()
    energy_materials = {
        "core": er05.make_energy_material("CV_Mat_Energy_BlueCore", (0.020, 0.22, 0.95), 8.0, "Main Active Core Energy"),
        "accent": er05.make_energy_material("CV_Mat_Energy_BlueAccent", (0.020, 0.16, 0.65), 3.8, "Main Layered Energy Accent"),
        "secondary": er05.make_energy_material("CV_Mat_Energy_BlueSecondary", (0.020, 0.14, 0.55), 2.6, "Secondary Active Energy"),
        "soft": er05.make_energy_material("CV_Mat_ER06B_Energy_BlueSoft", (0.010, 0.075, 0.30), 1.2, "ER-06b Spatial Soft Energy"),
        "hot": er05.make_energy_material("CV_Mat_ER06B_Energy_BlueHotCore", (0.025, 0.30, 1.0), 5.2, "ER-06b Local Energy Concentration"),
    }
    detail_materials = {
        "sky": er06.make_gradient_sky_material(),
        "sea": er06.make_calm_sea_material(),
        "coast_far": er06.make_simple_material("CV_Mat_Exterior_CoastFar", (0.11, 0.19, 0.23), 0.96, emission_strength=0.22, family="Distant Coastal Silhouette"),
        "coast_near": er06.make_simple_material("CV_Mat_Exterior_CoastNear", (0.055, 0.12, 0.13), 0.94, emission_strength=0.14, family="Near Coastal Silhouette"),
        "foliage": er06.make_simple_material("CV_Mat_Vegetation_Olive", (0.025, 0.070, 0.030), 0.82, family="Restrained Mediterranean Vegetation"),
        "practical": er06.make_simple_material("CV_Mat_Practical_Warm", (1.0, 0.34, 0.08), 0.38, emission_strength=1.6, family="Warm Architectural Practical"),
        "console_display": er06.make_simple_material("CV_Mat_Console_TechnicalStandby", (0.002, 0.026, 0.038), 0.20, emission_strength=0.28, family="Non-stateful Console Standby Surface"),
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
    fidelity_root = er01.create_collection("CV_Fidelity_ER06B", root)
    main_fidelity = er01.create_collection("CV_Reactor_Fidelity_ER06B", fidelity_root)
    secondary_fidelity = er01.create_collection("CV_Secondary_Fidelity_ER06B", fidelity_root)
    realism = er01.create_collection("CV_Realism_ER06B", fidelity_root)

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

    er06.build_main_reactor_detail(main_detail, reactor_materials)
    er06.build_main_internal_detail(internal_detail, reactor_materials)
    er06.build_secondary_detail(secondary_detail, secondary_materials)
    er06.build_conduits(conduits, reactor_materials)
    er06.build_console_detail(console_detail, console_materials)
    build_exterior_er06b(exterior, architecture_materials, detail_materials)
    build_main_fidelity_detail(main_fidelity, reactor_materials)
    build_secondary_fidelity_detail(secondary_fidelity, secondary_materials)
    build_realism_support(realism, architecture_materials, reactor_materials)
    build_energy_er06b(energy, energy_materials)

    hero_camera = er01.add_camera("CV_HeroCamera", er02.HERO_CAMERA_POSITION,
                                  er02.HERO_CAMERA_TARGET, er02.HERO_FOCAL_LENGTH_MM, cameras)
    er04.add_reference_background(hero_camera, cameras)
    alternate_camera = er01.add_camera("CV_ER06B_AlternateCamera", (7.55, -8.75, 4.55),
                                       (0.55, 2.70, 2.80), 36.0, cameras)
    reactor_camera = er01.add_camera("CV_ER06B_ReactorCamera", (4.45, -7.55, 3.45),
                                     (0.10, 1.80, 2.80), 42.0, cameras)
    energy_camera = er01.add_camera("CV_ER06B_EnergyCamera", (3.10, -6.20, 3.30),
                                    (0.10, 1.80, 3.08), 50.0, cameras)
    console_camera = er01.add_camera("CV_ER06B_ConsoleCamera", (-2.90, -5.75, 2.45),
                                     (-4.95, -1.62, 1.55), 50.0, cameras)
    exterior_camera = er01.add_camera("CV_ER06B_ExteriorCamera", (-1.45, -8.00, 3.10),
                                      (-10.60, 1.80, 1.95), 36.0, cameras)
    er05.add_final_lighting(lights)
    er06.build_architecture_detail(architecture_detail, architecture_materials,
                                   reactor_materials, detail_materials, lights)

    jobs = (
        (hero_camera, HERO_PATH),
        (alternate_camera, ALTERNATE_PATH),
        (reactor_camera, REACTOR_PATH),
        (energy_camera, ENERGY_PATH),
        (console_camera, CONSOLE_PATH),
        (exterior_camera, EXTERIOR_PATH),
    )
    for camera, output_path in jobs:
        scene.camera = camera
        scene.render.filepath = str(output_path)
        if camera == hero_camera:
            bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
        bpy.ops.render.render(write_still=True)
    scene.camera = hero_camera
    scene.render.filepath = str(HERO_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved ER-06b source: {BLEND_PATH}")
    for _, output_path in jobs:
        print(f"Saved ER-06b review: {output_path}")


if __name__ == "__main__":
    build_scene()
