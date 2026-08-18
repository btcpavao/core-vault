"""Build the Core Vault Engine Room ER-01b composition-correction greybox.

Run with:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python build_er01.py

The script preserves the ER-01 scene contract while correcting camera, architectural
depth, platform proportions, and left/right massing. It intentionally stops before ER-02.
"""

from pathlib import Path
import math

import bpy
from mathutils import Vector


SOURCE_DIR = Path(__file__).resolve().parent
REPO_DIR = SOURCE_DIR.parents[2]
REVIEW_DIR = SOURCE_DIR / "review"
REFERENCE_PATH = REPO_DIR / "docs/references/engine-room/engine-room-hero-reference.png"
BLEND_PATH = SOURCE_DIR / "engine-room.blend"
HERO_RENDER_PATH = REVIEW_DIR / "er-01b-greybox-hero.png"
ALTERNATE_RENDER_PATH = REVIEW_DIR / "er-01b-greybox-alternate.png"

ROOM_WIDTH = 19.0
ROOM_DEPTH = 22.0
ROOM_HEIGHT = 7.2
REACTOR_DIAMETER = 4.5
REACTOR_HEIGHT = 5.5
REACTOR_CENTER = (0.10, 1.80)
HERO_FOCAL_LENGTH_MM = 38.0
HERO_CAMERA_POSITION = (-0.25, -13.5, 2.1)
HERO_CAMERA_TARGET = (0.10, 1.8, 1.75)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def create_collection(name, parent=None):
    collection = bpy.data.collections.new(name)
    (parent or bpy.context.scene.collection).children.link(collection)
    return collection


def move_to_collection(obj, collection):
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)


def make_material(name, value, roughness=0.82):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (value, value, value, 1.0)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = 0.0
    return material


def add_box(name, location, dimensions, material, collection, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0.0:
        modifier = obj.modifiers.new(name="CV_Greybox_Edge", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    return obj


def add_cylinder(name, location, radius, depth, material, collection, vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    return obj


def add_arch(name, center_x, center_y, spring_z, inner_radius, thickness, depth, material, collection, segments=24):
    outer_radius = inner_radius + thickness
    vertices = []
    faces = []
    half_depth = depth / 2.0

    for y in (center_y - half_depth, center_y + half_depth):
        for radius in (inner_radius, outer_radius):
            for index in range(segments + 1):
                angle = math.pi * index / segments
                vertices.append((center_x + math.cos(angle) * radius, y, spring_z + math.sin(angle) * radius))

    stride = segments + 1
    front_inner = 0
    front_outer = stride
    back_inner = stride * 2
    back_outer = stride * 3

    for index in range(segments):
        next_index = index + 1
        faces.append((front_inner + index, front_inner + next_index, front_outer + next_index, front_outer + index))
        faces.append((back_inner + index, back_outer + index, back_outer + next_index, back_inner + next_index))
        faces.append((front_outer + index, front_outer + next_index, back_outer + next_index, back_outer + index))
        faces.append((front_inner + index, back_inner + index, back_inner + next_index, front_inner + next_index))

    faces.append((front_inner, front_outer, back_outer, back_inner))
    faces.append((front_inner + segments, back_inner + segments, back_outer + segments, front_outer + segments))

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def add_side_arch(name, center_x, center_y, spring_z, inner_radius, thickness, depth, material, collection, segments=24):
    """Create an arch in the Y/Z plane with real thickness along X."""
    outer_radius = inner_radius + thickness
    vertices = []
    faces = []
    half_depth = depth / 2.0

    for x in (center_x - half_depth, center_x + half_depth):
        for radius in (inner_radius, outer_radius):
            for index in range(segments + 1):
                angle = math.pi * index / segments
                vertices.append((x, center_y + math.cos(angle) * radius, spring_z + math.sin(angle) * radius))

    stride = segments + 1
    front_inner = 0
    front_outer = stride
    back_inner = stride * 2
    back_outer = stride * 3

    for index in range(segments):
        next_index = index + 1
        faces.append((front_inner + index, front_outer + index, front_outer + next_index, front_inner + next_index))
        faces.append((back_inner + index, back_inner + next_index, back_outer + next_index, back_outer + index))
        faces.append((front_outer + index, back_outer + index, back_outer + next_index, front_outer + next_index))
        faces.append((front_inner + index, front_inner + next_index, back_inner + next_index, back_inner + index))

    faces.append((front_inner, back_inner, back_outer, front_outer))
    faces.append((front_inner + segments, front_outer + segments, back_outer + segments, back_inner + segments))

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def point_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_camera(name, position, target, focal_length, collection):
    camera_data = bpy.data.cameras.new(name)
    camera_data.lens = focal_length
    camera_data.sensor_width = 36.0
    camera_data.sensor_fit = "HORIZONTAL"
    camera_data.clip_start = 0.1
    camera_data.clip_end = 200.0
    camera = bpy.data.objects.new(name, camera_data)
    camera.location = position
    collection.objects.link(camera)
    point_at(camera, target)
    return camera


def add_area_light(name, position, target, energy, size, collection):
    light_data = bpy.data.lights.new(name=name, type="AREA")
    light_data.energy = energy
    light_data.shape = "DISK"
    light_data.size = size
    light = bpy.data.objects.new(name, light_data)
    light.location = position
    collection.objects.link(light)
    point_at(light, target)
    return light


def add_reactor(collection, materials):
    reactor = create_collection("CV_Reactor_Greybox", collection)
    center_x, center_y = REACTOR_CENTER

    # ER-01b: a low, floor-integrated base rather than a monumental stepped stage.
    add_cylinder("CV_Reactor_Platform_Lower", (center_x, center_y, 0.08), 4.60, 0.16, materials["platform"], reactor, 96)
    add_cylinder("CV_Reactor_Platform_Middle", (center_x, center_y, 0.23), 3.65, 0.18, materials["platform_light"], reactor, 96)
    add_cylinder("CV_Reactor_Platform_Upper", (center_x, center_y, 0.39), 2.95, 0.14, materials["platform"], reactor, 96)

    add_cylinder("CV_Reactor_Core_Mass", (center_x, center_y, 3.15), 1.90, 4.50, materials["reactor"], reactor, 64)
    add_cylinder("CV_Reactor_Base_Ring", (center_x, center_y, 0.78), 2.25, 0.52, materials["reactor_dark"], reactor, 64)
    add_cylinder("CV_Reactor_Lower_Ring", (center_x, center_y, 1.25), 2.22, 0.26, materials["reactor_light"], reactor, 64)
    add_cylinder("CV_Reactor_Mid_Ring", (center_x, center_y, 3.10), 2.25, 0.28, materials["reactor_dark"], reactor, 64)
    add_cylinder("CV_Reactor_Upper_Ring", (center_x, center_y, 4.85), 2.25, 0.32, materials["reactor_light"], reactor, 64)
    add_cylinder("CV_Reactor_Crown_Lower", (center_x, center_y, 5.28), 2.00, 0.46, materials["reactor_dark"], reactor, 64)
    add_cylinder("CV_Reactor_Crown_Middle", (center_x, center_y, 5.63), 1.50, 0.28, materials["reactor"], reactor, 64)
    add_cylinder("CV_Reactor_Crown_Top", (center_x, center_y, 5.91), 0.82, 0.22, materials["reactor_dark"], reactor, 48)

    for index in range(8):
        angle = math.tau * index / 8.0
        x = center_x + math.cos(angle) * 2.08
        y = center_y + math.sin(angle) * 2.08
        add_cylinder(
            f"CV_Reactor_Structure_{index + 1:02d}",
            (x, y, 3.15),
            0.13,
            4.40,
            materials["reactor_dark"],
            reactor,
            24,
        )

    return reactor


def add_secondary_reactor(collection, materials):
    subsystem = create_collection("CV_Secondary_Chamber_Greybox", collection)
    center = (4.60, 7.00)
    add_cylinder("CV_Secondary_Platform", (center[0], center[1], 0.12), 1.30, 0.24, materials["platform"], subsystem, 64)
    add_cylinder("CV_Secondary_Core", (center[0], center[1], 2.15), 0.90, 3.40, materials["reactor"], subsystem, 48)
    add_cylinder("CV_Secondary_Base_Ring", (center[0], center[1], 0.52), 1.14, 0.30, materials["reactor_dark"], subsystem, 48)
    add_cylinder("CV_Secondary_Upper_Ring", (center[0], center[1], 3.65), 1.18, 0.30, materials["reactor_dark"], subsystem, 48)
    add_cylinder("CV_Secondary_Crown", (center[0], center[1], 4.00), 1.00, 0.40, materials["reactor"], subsystem, 48)
    for index in range(6):
        angle = math.tau * index / 6.0
        x = center[0] + math.cos(angle) * 1.05
        y = center[1] + math.sin(angle) * 1.05
        add_cylinder(f"CV_Secondary_Structure_{index + 1:02d}", (x, y, 2.10), 0.08, 3.00, materials["reactor_dark"], subsystem, 20)


def build_scene():
    clear_scene()
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0

    scene = bpy.context.scene
    scene.name = "CV_EngineRoom_ER01b"
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1536
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.film_transparent = False
    scene.render.image_settings.color_depth = "8"
    scene.render.resolution_percentage = 100
    scene.render.pixel_aspect_x = 1.0
    scene.render.pixel_aspect_y = 1.0
    scene.render.fps = 24
    scene.render.filepath = str(HERO_RENDER_PATH)
    scene.render.image_settings.compression = 15
    scene.render.image_settings.color_mode = "RGB"
    scene.view_settings.look = "AgX - Medium High Contrast"

    scene["CV_ProductionStage"] = "ER-01b Composition Correction Pass"
    scene["CV_RoomDimensionsMeters"] = f"{ROOM_WIDTH} x {ROOM_DEPTH} x {ROOM_HEIGHT}"
    scene["CV_ReactorDimensionsMeters"] = f"{REACTOR_DIAMETER} diameter x {REACTOR_HEIGHT} height"
    scene["CV_PlatformDimensionsMeters"] = "9.2 diameter x 0.46 total height"
    scene["CV_CanonicalReference"] = "//../../../docs/references/engine-room/engine-room-hero-reference.png"

    root = create_collection("CV_EngineRoom")
    architecture = create_collection("CV_Architecture", root)
    reactor_collection = create_collection("CV_Reactor", root)
    cameras = create_collection("CV_Cameras", root)
    lights = create_collection("CV_Readability_Lights", root)

    materials = {
        "architecture": make_material("CV_MAT_Grey_Architecture", 0.47),
        "architecture_dark": make_material("CV_MAT_Grey_Architecture_Dark", 0.30),
        "opening": make_material("CV_MAT_Grey_Recess", 0.055),
        "recess_back": make_material("CV_MAT_Grey_Recess_Back", 0.24),
        "exterior": make_material("CV_MAT_Grey_Exterior_Daylight", 0.78),
        "platform": make_material("CV_MAT_Grey_Platform", 0.34),
        "platform_light": make_material("CV_MAT_Grey_Platform_Light", 0.52),
        "reactor": make_material("CV_MAT_Grey_Reactor", 0.40),
        "reactor_dark": make_material("CV_MAT_Grey_Reactor_Dark", 0.20),
        "reactor_light": make_material("CV_MAT_Grey_Reactor_Light", 0.58),
    }

    # Room shell and major architectural masses.
    add_box("CV_Floor", (0.0, 5.0, -0.25), (ROOM_WIDTH, ROOM_DEPTH, 0.50), materials["architecture"], architecture)
    add_box("CV_Foreground_Floor_Apron", (0.0, -9.0, -0.25), (ROOM_WIDTH, 6.0, 0.50), materials["architecture"], architecture)
    add_box("CV_Ceiling", (0.0, 5.5, 7.35), (ROOM_WIDTH, 17.0, 0.45), materials["architecture_dark"], architecture)
    add_box("CV_Wall_Right", (9.25, 5.0, 3.50), (0.50, ROOM_DEPTH, 7.0), materials["architecture"], architecture)

    # ER-01b rear layer: the facade is assembled around openings and the back wall sits
    # 3.6 m behind it, with real side and ceiling reveals inside each recess.
    rear_front_y = 12.20
    rear_back_y = 15.80
    add_box("CV_Wall_Rear_Back", (0.0, rear_back_y, 3.40), (ROOM_WIDTH, 0.40, 6.80), materials["recess_back"], architecture)
    add_box("CV_Wall_Rear_Base", (0.0, rear_front_y, 0.34), (ROOM_WIDTH, 0.70, 0.68), materials["architecture"], architecture)
    add_box("CV_Wall_Rear_Top", (0.0, rear_front_y, 6.62), (ROOM_WIDTH, 0.70, 1.16), materials["architecture"], architecture)

    for index, x in enumerate((-8.75, -6.55, -2.30, 2.30, 6.55, 8.75)):
        width = 0.70 if abs(x) < 8.0 else 1.0
        add_box(f"CV_Wall_Rear_Pier_{index + 1:02d}", (x, rear_front_y, 3.35), (width, 0.85, 5.95), materials["architecture"], architecture, 0.05)

    rear_openings = (-4.55, 0.0, 4.55)
    for index, x in enumerate(rear_openings):
        add_arch(f"CV_Wall_Rear_Arch_{index + 1:02d}", x, rear_front_y - 0.02, 4.05, 1.55, 0.52, 0.86, materials["architecture"], architecture)
        opening_half_width = 1.55
        reveal_y = (rear_front_y + rear_back_y) / 2.0
        reveal_depth = rear_back_y - rear_front_y
        add_box(f"CV_Rear_Recess_{index + 1:02d}_Reveal_Left", (x - opening_half_width, reveal_y, 2.75), (0.22, reveal_depth, 4.80), materials["architecture_dark"], architecture)
        add_box(f"CV_Rear_Recess_{index + 1:02d}_Reveal_Right", (x + opening_half_width, reveal_y, 2.75), (0.22, reveal_depth, 4.80), materials["architecture_dark"], architecture)
        add_box(f"CV_Rear_Recess_{index + 1:02d}_Reveal_Ceiling", (x, reveal_y, 5.15), (3.10, reveal_depth, 0.22), materials["architecture_dark"], architecture)

    # ER-01b left arcade: real side arches, thick supports, and a neutral daylight court
    # beyond the room boundary establish the open Mediterranean spatial layer.
    arcade_x = -7.60
    add_box("CV_Wall_Left_UpperMass", (arcade_x, 4.50, 6.62), (1.20, 20.0, 1.15), materials["architecture_dark"], architecture)
    arcade_columns_y = (-4.50, 0.0, 4.50, 9.0, 13.50)
    for index, y in enumerate(arcade_columns_y):
        add_cylinder(f"CV_Wall_Left_Column_{index + 1:02d}", (arcade_x, y, 3.12), 0.60, 6.24, materials["architecture"], architecture, 48)
        add_cylinder(f"CV_Wall_Left_ColumnBase_{index + 1:02d}", (arcade_x, y, 0.34), 0.80, 0.68, materials["architecture_dark"], architecture, 48)

    for index, y in enumerate((-2.25, 2.25, 6.75, 11.25)):
        add_side_arch(f"CV_Wall_Left_Arch_{index + 1:02d}", arcade_x, y, 4.12, 1.95, 0.52, 1.20, materials["architecture"], architecture)

    add_box("CV_Exterior_Court_Floor", (-11.90, 5.0, -0.18), (8.60, ROOM_DEPTH, 0.36), materials["exterior"], architecture)
    add_box("CV_Exterior_Daylight_Backdrop", (-16.05, 5.0, 3.10), (0.30, ROOM_DEPTH, 6.20), materials["exterior"], architecture)
    add_box("CV_Exterior_Parapet_Mass", (-12.30, 5.0, 0.65), (0.45, ROOM_DEPTH, 1.30), materials["architecture"], architecture)

    # Stronger foreground framing and right-side structural rhythm.
    for index, y in enumerate((-3.80, 2.40, 8.40, 13.40)):
        add_cylinder(f"CV_Wall_Right_Column_{index + 1:02d}", (8.10, y, 3.22), 0.68, 6.44, materials["architecture"], architecture, 48)
        add_cylinder(f"CV_Wall_Right_ColumnBase_{index + 1:02d}", (8.10, y, 0.38), 0.88, 0.76, materials["architecture_dark"], architecture, 48)

    add_cylinder("CV_Foreground_Left_Pier", (-6.05, -4.45, 3.20), 0.74, 6.40, materials["architecture"], architecture, 48)
    add_cylinder("CV_Foreground_Left_Pier_Base", (-6.05, -4.45, 0.40), 0.96, 0.80, materials["architecture_dark"], architecture, 48)
    add_cylinder("CV_Foreground_Right_Pier", (7.10, -4.05, 3.25), 0.78, 6.50, materials["architecture"], architecture, 48)
    add_cylinder("CV_Foreground_Right_Pier_Base", (7.10, -4.05, 0.42), 1.02, 0.84, materials["architecture_dark"], architecture, 48)

    for index, y in enumerate((-0.5, 3.8, 8.1, 12.4)):
        add_box(f"CV_Ceiling_Beam_{index + 1:02d}", (0.0, y, 6.92), (ROOM_WIDTH, 0.48, 0.52), materials["architecture_dark"], architecture, 0.03)

    # Simplified console mass positioned against the open arcade layer.
    add_box("CV_Console_Plinth", (-3.55, 1.85, 0.65), (2.15, 1.45, 1.30), materials["platform"], architecture, 0.08)
    console = add_box("CV_Console_Greybox", (-3.55, 1.80, 2.10), (1.95, 1.05, 1.10), materials["reactor_dark"], architecture, 0.10)
    console.rotation_euler.x = math.radians(-10.0)
    console.rotation_euler.z = math.radians(-3.0)

    add_reactor(reactor_collection, materials)
    add_secondary_reactor(reactor_collection, materials)

    hero_camera = add_camera("CV_HeroCamera", HERO_CAMERA_POSITION, HERO_CAMERA_TARGET, HERO_FOCAL_LENGTH_MM, cameras)
    hero_camera.data.dof.use_dof = False
    hero_camera["CV_Role"] = "ER-01b corrected canonical composition camera"
    hero_camera["CV_Target"] = HERO_CAMERA_TARGET
    scene.camera = hero_camera

    reference_image = bpy.data.images.load(str(REFERENCE_PATH), check_existing=True)
    reference_image.filepath = "//../../../docs/references/engine-room/engine-room-hero-reference.png"
    background = hero_camera.data.background_images.new()
    background.image = reference_image
    background.display_depth = "BACK"
    background.alpha = 0.40
    hero_camera.data.show_background_images = True

    add_area_light("CV_Light_Key", (-11.5, -5.0, 10.0), (0.0, 2.0, 2.2), 2600.0, 8.0, lights)
    add_area_light("CV_Light_Fill", (6.5, -1.5, 6.8), (0.0, 2.5, 2.0), 750.0, 5.0, lights)
    add_area_light("CV_Light_Rear", (-1.0, 14.0, 6.0), (0.0, 3.0, 2.8), 900.0, 4.0, lights)
    add_area_light("CV_Light_Recess_Readability", (0.0, 9.4, 4.8), (0.0, 15.5, 2.6), 620.0, 6.0, lights)
    add_area_light("CV_Light_Exterior_Backdrop", (-13.8, 4.5, 4.0), (-16.0, 4.5, 3.0), 950.0, 8.0, lights)

    scene.world.color = (0.035, 0.035, 0.035)
    if scene.world.use_nodes:
        background_node = scene.world.node_tree.nodes.get("Background")
        background_node.inputs["Color"].default_value = (0.055, 0.055, 0.055, 1.0)
        background_node.inputs["Strength"].default_value = 0.45

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.render.render(write_still=True)

    alternate_camera = add_camera("CV_ReviewCamera_Alternate", (6.8, -7.5, 5.3), (-0.8, 4.0, 2.4), 36.0, cameras)
    alternate_camera["CV_Role"] = "ER-01b coherence and architectural-depth review only"
    scene.camera = alternate_camera
    scene.render.filepath = str(ALTERNATE_RENDER_PATH)
    bpy.ops.render.render(write_still=True)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)

    print(f"ER01B_BLEND={BLEND_PATH}")
    print(f"ER01B_HERO={HERO_RENDER_PATH}")
    print(f"ER01B_ALTERNATE={ALTERNATE_RENDER_PATH}")
    print(f"ER01B_CAMERA_POSITION={HERO_CAMERA_POSITION}")
    print(f"ER01B_CAMERA_TARGET={HERO_CAMERA_TARGET}")
    print(f"ER01B_CAMERA_FOCAL_MM={HERO_FOCAL_LENGTH_MM}")


if __name__ == "__main__":
    build_scene()
