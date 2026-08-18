"""Build Core Vault Engine Room ER-02: architectural match.

Run with:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python build_er02.py

This stage deliberately preserves the approved ER-01b composition and reactor
placeholders.  It replaces only the architectural greybox with a constructionally
legible, bevelled Mediterranean stone environment and stops before ER-03.
"""

from pathlib import Path
import math
import sys

import bpy


SOURCE_DIR = Path(__file__).resolve().parent
if str(SOURCE_DIR) not in sys.path:
    sys.path.insert(0, str(SOURCE_DIR))

import build_er01 as er01


REPO_DIR = SOURCE_DIR.parents[2]
REVIEW_DIR = SOURCE_DIR / "review"
REFERENCE_PATH = REPO_DIR / "docs/references/engine-room/engine-room-hero-reference.png"
BLEND_PATH = SOURCE_DIR / "engine-room.blend"
HERO_RENDER_PATH = REVIEW_DIR / "er-02-architecture-hero.png"
ALTERNATE_RENDER_PATH = REVIEW_DIR / "er-02-architecture-alternate.png"

ROOM_WIDTH = er01.ROOM_WIDTH
ROOM_DEPTH = er01.ROOM_DEPTH
ROOM_HEIGHT = er01.ROOM_HEIGHT
REACTOR_CENTER = er01.REACTOR_CENTER
HERO_FOCAL_LENGTH_MM = er01.HERO_FOCAL_LENGTH_MM
HERO_CAMERA_POSITION = er01.HERO_CAMERA_POSITION
HERO_CAMERA_TARGET = er01.HERO_CAMERA_TARGET


def make_material(name, color, roughness=0.82):
    """Create restrained working materials; these are not the ER-05 final pass."""
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = 0.0
    return material


def add_bevel(obj, width=0.04, segments=2):
    modifier = obj.modifiers.new(name="CV_Architecture_Edge", type="BEVEL")
    modifier.width = width
    modifier.segments = segments
    return obj


def add_box(name, location, dimensions, material, collection, bevel=0.04):
    return er01.add_box(name, location, dimensions, material, collection, bevel=bevel)


def add_cylinder(name, location, radius, depth, material, collection, vertices=64, bevel=0.035):
    obj = er01.add_cylinder(name, location, radius, depth, material, collection, vertices)
    if bevel:
        add_bevel(obj, bevel, 2)
    return obj


def add_tapered_column(name, x, y, floor_z, shaft_height, material, trim, collection, scale=1.0):
    """A plausible stone order: plinth, moulded base, tapered shaft, neck and capital."""
    add_box(f"{name}_Plinth", (x, y, floor_z + 0.11 * scale),
            (1.30 * scale, 1.30 * scale, 0.22 * scale), material, collection, 0.045 * scale)
    add_cylinder(f"{name}_Base_Lower", (x, y, floor_z + 0.29 * scale),
                 0.70 * scale, 0.14 * scale, trim, collection, 64, 0.025 * scale)
    add_cylinder(f"{name}_Base_Upper", (x, y, floor_z + 0.45 * scale),
                 0.60 * scale, 0.18 * scale, material, collection, 64, 0.03 * scale)

    shaft_center_z = floor_z + 0.54 * scale + shaft_height / 2.0
    bpy.ops.mesh.primitive_cone_add(
        vertices=64,
        radius1=0.52 * scale,
        radius2=0.45 * scale,
        depth=shaft_height,
        location=(x, y, shaft_center_z),
    )
    shaft = bpy.context.object
    shaft.name = f"{name}_Tapered_Shaft"
    shaft.data.materials.append(material)
    er01.move_to_collection(shaft, collection)
    add_bevel(shaft, 0.035 * scale, 2)

    top_z = floor_z + 0.54 * scale + shaft_height
    add_cylinder(f"{name}_Neck", (x, y, top_z + 0.10 * scale),
                 0.51 * scale, 0.20 * scale, trim, collection, 64, 0.025 * scale)
    add_cylinder(f"{name}_Capital_Round", (x, y, top_z + 0.27 * scale),
                 0.64 * scale, 0.16 * scale, material, collection, 64, 0.025 * scale)
    add_box(f"{name}_Capital_Abacus", (x, y, top_z + 0.44 * scale),
            (1.28 * scale, 1.28 * scale, 0.18 * scale), trim, collection, 0.045 * scale)
    return top_z + 0.53 * scale


def add_arch_segments(name, orientation, center_x, center_y, spring_z, inner_radius,
                      thickness, depth, material, collection, count=11, gap=0.025):
    """Build a true deep arch as individual tapered stone voussoirs."""
    outer_radius = inner_radius + thickness
    half_depth = depth / 2.0
    for index in range(count):
        raw_a0 = math.pi * index / count
        raw_a1 = math.pi * (index + 1) / count
        a0 = raw_a0 + gap
        a1 = raw_a1 - gap
        coords = []
        if orientation == "front":
            for y in (center_y - half_depth, center_y + half_depth):
                coords.extend([
                    (center_x + math.cos(a0) * inner_radius, y, spring_z + math.sin(a0) * inner_radius),
                    (center_x + math.cos(a1) * inner_radius, y, spring_z + math.sin(a1) * inner_radius),
                    (center_x + math.cos(a1) * outer_radius, y, spring_z + math.sin(a1) * outer_radius),
                    (center_x + math.cos(a0) * outer_radius, y, spring_z + math.sin(a0) * outer_radius),
                ])
        else:
            for x in (center_x - half_depth, center_x + half_depth):
                coords.extend([
                    (x, center_y + math.cos(a0) * inner_radius, spring_z + math.sin(a0) * inner_radius),
                    (x, center_y + math.cos(a1) * inner_radius, spring_z + math.sin(a1) * inner_radius),
                    (x, center_y + math.cos(a1) * outer_radius, spring_z + math.sin(a1) * outer_radius),
                    (x, center_y + math.cos(a0) * outer_radius, spring_z + math.sin(a0) * outer_radius),
                ])
        faces = [
            (0, 1, 2, 3), (4, 7, 6, 5),
            (0, 4, 5, 1), (1, 5, 6, 2),
            (2, 6, 7, 3), (3, 7, 4, 0),
        ]
        mesh = bpy.data.meshes.new(f"{name}_{index + 1:02d}_Mesh")
        mesh.from_pydata(coords, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(f"{name}_Voussoir_{index + 1:02d}", mesh)
        collection.objects.link(obj)
        obj.data.materials.append(material)
        add_bevel(obj, 0.022, 2)


def add_front_arch(name, center_x, center_y, spring_z, radius, thickness, depth,
                   material, collection, count=11):
    add_arch_segments(name, "front", center_x, center_y, spring_z, radius, thickness,
                      depth, material, collection, count)


def add_side_arch(name, center_x, center_y, spring_z, radius, thickness, depth,
                  material, collection, count=10):
    add_arch_segments(name, "side", center_x, center_y, spring_z, radius, thickness,
                      depth, material, collection, count)


def build_floor(root, materials):
    floor = er01.create_collection("CV_Architecture_Floor", root)
    add_box("CV_Floor_Substrate", (0.0, 3.2, -0.11), (19.0, 21.6, 0.22),
            materials["floor_dark"], floor, 0.02)
    slab_size = 2.62
    xs = (-7.9, -5.2, -2.5, 0.2, 2.9, 5.6, 8.3)
    ys = (-5.8, -3.1, -0.4, 2.3, 5.0, 7.7, 10.4)
    slab_index = 0
    for y in ys:
        for x in xs:
            radial = math.hypot(x - REACTOR_CENTER[0], y - REACTOR_CENTER[1])
            if radial < 4.78:
                continue
            slab_index += 1
            material = materials["floor"] if (slab_index + int(y * 10)) % 3 else materials["floor_light"]
            add_box(f"CV_Floor_Slab_{slab_index:02d}", (x, y, 0.015),
                    (slab_size, slab_size, 0.10), material, floor, 0.025)

    # A readable access path bridges the tiled floor and circular platform.
    add_box("CV_Platform_Access_Step", (0.10, -2.88, 0.13), (2.40, 0.82, 0.26),
            materials["stone"], floor, 0.06)
    add_box("CV_Platform_Access_Landing", (0.10, -2.32, 0.25), (2.05, 0.50, 0.18),
            materials["stone_light"], floor, 0.05)


def build_left_arcade(root, materials):
    arcade = er01.create_collection("CV_Architecture_LeftArcade", root)
    column_ys = (-4.55, -0.05, 4.45, 8.95, 13.45)
    for index, y in enumerate(column_ys):
        add_tapered_column(f"CV_LeftArcade_Column_{index + 1:02d}", -7.58, y, 0.07,
                           4.45, materials["stone"], materials["stone_light"], arcade, 0.96)

    for index, y in enumerate((-2.30, 2.20, 6.70, 11.20)):
        add_side_arch(f"CV_LeftArcade_Arch_{index + 1:02d}", -7.58, y, 4.72,
                      2.23, 0.48, 1.42, materials["stone_light"], arcade, 10 + index % 2)

    # Entablature makes load transfer from arch crowns into the ceiling explicit.
    add_box("CV_LeftArcade_Entablature_Lower", (-7.58, 4.45, 6.62),
            (1.46, 18.70, 0.30), materials["stone"], arcade, 0.06)
    add_box("CV_LeftArcade_Entablature_Upper", (-7.58, 4.45, 6.91),
            (1.62, 18.92, 0.20), materials["stone_light"], arcade, 0.055)
    add_box("CV_LeftArcade_Exterior_Parapet", (-9.18, 4.5, 0.64),
            (0.34, 18.9, 1.28), materials["stone_dark"], arcade, 0.04)
    add_box("CV_LeftArcade_Exterior_Apron", (-8.48, 4.5, -0.03),
            (1.80, 19.0, 0.16), materials["floor_light"], arcade, 0.025)


def add_rear_pier(name, x, front_y, materials, collection, width=1.0):
    add_box(f"{name}_Base", (x, front_y, 0.25), (width + 0.30, 1.55, 0.50),
            materials["stone_light"], collection, 0.055)
    add_box(f"{name}_Shaft", (x, front_y, 2.57), (width, 1.34, 4.15),
            materials["stone"], collection, 0.05)
    add_box(f"{name}_Capital", (x, front_y, 4.74), (width + 0.34, 1.58, 0.24),
            materials["stone_light"], collection, 0.055)


def build_rear_facade(root, materials):
    rear = er01.create_collection("CV_Architecture_RearFacade", root)
    front_y = 12.22
    add_box("CV_RearFacade_Sill", (0.0, front_y, 0.27), (18.0, 1.55, 0.54),
            materials["stone_dark"], rear, 0.06)
    add_box("CV_RearFacade_UpperMass", (0.0, front_y, 6.28), (18.0, 1.55, 1.84),
            materials["stone"], rear, 0.07)
    add_box("CV_RearFacade_Cornice", (0.0, front_y - 0.05, 5.52), (18.25, 1.70, 0.24),
            materials["stone_light"], rear, 0.06)

    openings = [
        (-4.65, 4.02, 1.42, 10, 15.55),
        (0.00, 4.08, 1.68, 12, 16.05),
        (4.72, 4.14, 1.50, 9, 15.70),
    ]
    pier_xs = (-7.10, -2.35, 2.42, 7.14)
    for index, x in enumerate(pier_xs):
        add_rear_pier(f"CV_RearFacade_Pier_{index + 1:02d}", x, front_y,
                      materials, rear, width=1.08 if index in (0, 3) else 0.92)

    for index, (x, spring_z, radius, count, back_y) in enumerate(openings):
        add_front_arch(f"CV_RearFacade_Arch_{index + 1:02d}", x, front_y, spring_z,
                       radius, 0.53, 1.52, materials["stone_light"], rear, count)
        reveal = er01.create_collection(f"CV_RearFacade_Reveal_{index + 1:02d}", rear)
        reveal_depth = back_y - front_y
        side_offset = radius + 0.28
        add_box(f"CV_RearReveal_{index + 1:02d}_Left", (x - side_offset, front_y + reveal_depth / 2.0, 2.12),
                (0.32, reveal_depth, 4.24), materials["recess"], reveal, 0.035)
        add_box(f"CV_RearReveal_{index + 1:02d}_Right", (x + side_offset, front_y + reveal_depth / 2.0, 2.12),
                (0.32, reveal_depth, 4.24), materials["recess"], reveal, 0.035)
        add_box(f"CV_RearReveal_{index + 1:02d}_Ceiling", (x, front_y + reveal_depth / 2.0, 5.22),
                (radius * 2.0 + 0.55, reveal_depth, 0.30), materials["recess"], reveal, 0.035)
        add_box(f"CV_RearReveal_{index + 1:02d}_BackWall", (x, back_y, 2.65),
                (radius * 2.0 + 0.55, 0.32, 5.30), materials["stone_dark"], reveal, 0.035)
        # Non-repeated terminal condition: alternating nested frame dimensions.
        frame_width = radius * (1.12 if index == 1 else 0.98)
        frame_height = 2.65 + index * 0.18
        add_box(f"CV_RearReveal_{index + 1:02d}_TerminalFrame", (x, back_y - 0.19, frame_height / 2.0 + 0.20),
                (frame_width, 0.16, frame_height), materials["stone_light"], reveal, 0.045)
        add_box(f"CV_RearReveal_{index + 1:02d}_TerminalVoid", (x, back_y - 0.30, frame_height / 2.0 + 0.20),
                (frame_width - 0.30, 0.18, frame_height - 0.30), materials["recess_dark"], reveal, 0.025)


def build_right_side(root, materials):
    right = er01.create_collection("CV_Architecture_RightSide", root)
    add_box("CV_RightWall_Lower", (8.65, 4.10, 1.48), (1.10, 18.2, 2.96),
            materials["stone_dark"], right, 0.07)
    add_box("CV_RightWall_Upper", (8.65, 4.10, 5.82), (1.10, 18.2, 2.60),
            materials["stone"], right, 0.07)
    for index, y in enumerate((-2.9, 2.7, 8.3)):
        add_tapered_column(f"CV_RightWall_Column_{index + 1:02d}", 7.95, y, 0.05,
                           4.42, materials["stone"], materials["stone_light"], right, 0.88)
        add_box(f"CV_RightWall_Recess_{index + 1:02d}", (8.05, y + 2.55, 3.15),
                (0.18, 3.50, 3.60), materials["recess"], right, 0.025)
    add_box("CV_RightWall_Cornice", (8.15, 4.05, 6.55), (1.18, 18.45, 0.34),
            materials["stone_light"], right, 0.055)


def build_ceiling(root, materials):
    ceiling = er01.create_collection("CV_Architecture_Ceiling", root)
    add_box("CV_Ceiling_MainSlab", (0.0, 4.15, 7.12), (18.4, 19.2, 0.34),
            materials["ceiling"], ceiling, 0.06)
    # Deep transverse beams land visibly on both arcades/walls.
    for index, y in enumerate((-4.35, 0.15, 4.65, 9.15, 13.20)):
        add_box(f"CV_Ceiling_TransverseBeam_{index + 1:02d}", (0.0, y, 6.77),
                (17.25, 0.62, 0.72), materials["stone_dark"], ceiling, 0.06)
        add_box(f"CV_Ceiling_TransverseTrim_{index + 1:02d}", (0.0, y, 6.39),
                (17.48, 0.78, 0.16), materials["stone_light"], ceiling, 0.045)
    # Longitudinal secondary beams break the soffit into believable bays.
    for index, x in enumerate((-5.20, -2.55, 2.70, 5.45)):
        add_box(f"CV_Ceiling_LongitudinalBeam_{index + 1:02d}", (x, 4.35, 6.86),
                (0.38, 18.3, 0.48), materials["ceiling_dark"], ceiling, 0.045)


def build_foreground(root, materials):
    foreground = er01.create_collection("CV_Architecture_Foreground", root)
    add_tapered_column("CV_Foreground_LeftColumn", -8.05, -6.18, 0.0, 4.50,
                       materials["stone_dark"], materials["stone_light"], foreground, 1.08)
    add_tapered_column("CV_Foreground_RightColumn", 8.18, -5.92, 0.0, 4.50,
                       materials["stone"], materials["stone_light"], foreground, 1.12)
    add_box("CV_Foreground_LeftReturn", (-9.00, -5.60, 3.50), (0.78, 2.90, 7.0),
            materials["stone_dark"], foreground, 0.07)
    add_box("CV_Foreground_RightReturn", (9.02, -5.40, 3.50), (0.78, 3.10, 7.0),
            materials["stone_dark"], foreground, 0.07)
    add_box("CV_Foreground_Header", (0.0, -6.05, 6.82), (18.2, 1.10, 0.50),
            materials["stone_dark"], foreground, 0.07)


def build_console(root, materials):
    console = er01.create_collection("CV_Console_Greybox", root)
    add_box("CV_Console_Pedestal_Platform", (-4.95, -1.62, 0.16), (2.65, 2.05, 0.32),
            materials["stone"], console, 0.06)
    add_box("CV_Console_Pedestal_Base", (-4.95, -1.62, 0.48), (2.25, 1.72, 0.36),
            materials["stone_light"], console, 0.055)
    add_box("CV_Console_Pedestal_Shaft", (-4.95, -1.62, 0.88), (1.88, 1.40, 0.48),
            materials["stone"], console, 0.045)
    add_box("CV_Console_Placeholder", (-4.95, -1.62, 1.38), (1.72, 1.12, 0.52),
            materials["reactor_dark"], console, 0.06)


def refine_placeholders(reactor_collection, materials):
    er01.add_reactor(reactor_collection, materials)
    er01.add_secondary_reactor(reactor_collection, materials)
    for obj in reactor_collection.all_objects:
        if obj.type == "MESH" and "Platform" in obj.name:
            add_bevel(obj, 0.045, 2)
    add_cylinder("CV_Reactor_Platform_EdgeProfile", (REACTOR_CENTER[0], REACTOR_CENTER[1], 0.13),
                 4.66, 0.08, materials["platform_light"], reactor_collection, 96, 0.025)
    add_cylinder("CV_Secondary_Clearance_Platform", (4.60, 7.00, 0.075), 1.72, 0.15,
                 materials["platform"], reactor_collection, 64, 0.03)


def add_reference_background(camera, collection):
    try:
        image = bpy.data.images.load(str(REFERENCE_PATH), check_existing=True)
        background = camera.data.background_images.new()
        background.image = image
        background.display_depth = "BACK"
        background.alpha = 0.0
        camera.data.show_background_images = True
        marker = bpy.data.objects.new("CV_CanonicalReference_Marker", None)
        marker["CV_SourcePath"] = "//../../../docs/references/engine-room/engine-room-hero-reference.png"
        marker["CV_ReferenceUse"] = "ER-02 architectural match; composition remains locked to ER-01b"
        collection.objects.link(marker)
    except Exception as error:
        print(f"Reference background could not be loaded: {error}")


def configure_scene():
    er01.clear_scene()
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0
    scene = bpy.context.scene
    scene.name = "CV_EngineRoom_ER02"
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1536
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 15
    scene.render.film_transparent = False
    scene.render.pixel_aspect_x = 1.0
    scene.render.pixel_aspect_y = 1.0
    scene.render.fps = 24
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.world.color = (0.028, 0.025, 0.021)
    scene["CV_ProductionStage"] = "ER-02 Architectural Match"
    scene["CV_PreviousApprovedStage"] = "ER-01b Composition Correction"
    scene["CV_HeroCameraLocked"] = True
    scene["CV_HeroCameraContract"] = "38mm @ (-0.25, -13.5, 2.1), target (0.10, 1.8, 1.75)"
    scene["CV_RoomDimensionsMeters"] = f"{ROOM_WIDTH} x {ROOM_DEPTH} x {ROOM_HEIGHT}"
    scene["CV_CanonicalReference"] = "//../../../docs/references/engine-room/engine-room-hero-reference.png"
    scene["CV_StageScope"] = "Architecture only; reactor, console, lighting and materials remain placeholders"
    return scene


def build_scene():
    scene = configure_scene()
    materials = {
        "stone": make_material("CV_Working_Stone", (0.39, 0.33, 0.25), 0.88),
        "stone_light": make_material("CV_Working_Stone_Light", (0.54, 0.46, 0.35), 0.86),
        "stone_dark": make_material("CV_Working_Stone_Dark", (0.25, 0.22, 0.18), 0.91),
        "floor": make_material("CV_Working_Floor", (0.31, 0.27, 0.22), 0.82),
        "floor_light": make_material("CV_Working_Floor_Light", (0.39, 0.34, 0.27), 0.84),
        "floor_dark": make_material("CV_Working_Floor_Dark", (0.17, 0.16, 0.14), 0.92),
        "ceiling": make_material("CV_Working_Ceiling", (0.30, 0.26, 0.21), 0.92),
        "ceiling_dark": make_material("CV_Working_Ceiling_Dark", (0.18, 0.16, 0.14), 0.94),
        "recess": make_material("CV_Working_Reveal", (0.21, 0.19, 0.17), 0.90),
        "recess_dark": make_material("CV_Working_Reveal_Dark", (0.075, 0.072, 0.068), 0.96),
        "platform": make_material("CV_Working_Platform", (0.25, 0.24, 0.22), 0.78),
        "platform_light": make_material("CV_Working_Platform_Light", (0.36, 0.34, 0.30), 0.76),
        "reactor": make_material("CV_Working_Reactor", (0.15, 0.16, 0.16), 0.74),
        "reactor_dark": make_material("CV_Working_Reactor_Dark", (0.065, 0.070, 0.072), 0.80),
        "reactor_light": make_material("CV_Working_Reactor_Light", (0.28, 0.30, 0.30), 0.70),
    }

    root = er01.create_collection("CV_EngineRoom")
    architecture = er01.create_collection("CV_Architecture", root)
    reactor_collection = er01.create_collection("CV_Reactor", root)
    cameras = er01.create_collection("CV_Cameras", root)
    lights = er01.create_collection("CV_Lights_Utility", root)

    build_floor(architecture, materials)
    build_left_arcade(architecture, materials)
    build_rear_facade(architecture, materials)
    build_right_side(architecture, materials)
    build_ceiling(architecture, materials)
    build_foreground(architecture, materials)
    build_console(root, materials)
    refine_placeholders(reactor_collection, materials)

    hero_camera = er01.add_camera("CV_HeroCamera", HERO_CAMERA_POSITION, HERO_CAMERA_TARGET,
                                  HERO_FOCAL_LENGTH_MM, cameras)
    add_reference_background(hero_camera, cameras)
    alternate_camera = er01.add_camera("CV_ArchitectureReviewCamera", (7.85, -10.75, 4.35),
                                       (-0.35, 4.25, 2.45), 30.0, cameras)
    scene.camera = hero_camera

    er01.add_area_light("CV_Utility_Daylight", (-6.8, -0.5, 6.6), (0.0, 2.5, 1.5), 2250, 5.2, lights)
    er01.add_area_light("CV_Utility_FrontFill", (2.8, -7.8, 5.4), (0.0, 2.0, 2.4), 780, 4.2, lights)
    er01.add_area_light("CV_Utility_RearDepth", (0.0, 13.6, 5.6), (0.0, 5.8, 2.4), 1450, 4.2, lights)
    er01.add_area_light("CV_Utility_RightRim", (7.0, 5.5, 5.8), (1.0, 2.6, 2.8), 650, 3.2, lights)
    er01.add_area_light("CV_Utility_RevealBounce", (-3.8, 14.4, 3.6), (-1.0, 11.7, 2.7), 725, 2.8, lights)

    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.render.render(write_still=True)

    scene.camera = alternate_camera
    scene.render.filepath = str(ALTERNATE_RENDER_PATH)
    bpy.ops.render.render(write_still=True)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved ER-02 source: {BLEND_PATH}")
    print(f"Saved ER-02 hero review: {HERO_RENDER_PATH}")
    print(f"Saved ER-02 alternate review: {ALTERNATE_RENDER_PATH}")


if __name__ == "__main__":
    build_scene()
