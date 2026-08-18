"""Build the ER-08 optimized runtime derivative from the locked ER-07 master.

Run with:
  Blender --background ../engine-room.blend --python runtime/build_er08.py

The master file is verified by SHA-256 and never saved. All changes are written
to runtime/engine-room-runtime.blend.
"""

from collections import defaultdict
from pathlib import Path
import hashlib
import math
import re
import sys

import bpy


RUNTIME_DIR = Path(__file__).resolve().parent
SOURCE_DIR = RUNTIME_DIR.parent
REVIEW_DIR = SOURCE_DIR / "review"
PHASE_DIR = RUNTIME_DIR / "review-batches"
MASTER_PATH = SOURCE_DIR / "engine-room.blend"
RUNTIME_BLEND_PATH = RUNTIME_DIR / "engine-room-runtime.blend"
MASTER_SHA256 = "7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648"

HERO_PATH = REVIEW_DIR / "er-08-optimized-hero.png"
ALTERNATE_PATH = REVIEW_DIR / "er-08-optimized-alternate.png"
REACTOR_PATH = REVIEW_DIR / "er-08-optimized-reactor-closeup.png"
PHASE_A_PATH = PHASE_DIR / "er-08-phase-a-consolidation-hero.png"

GROUP_NAMES = (
    "CV_Runtime_StaticArchitecture",
    "CV_Runtime_StaticReactor",
    "CV_Runtime_SecondaryChamber",
    "CV_Runtime_Glass",
    "CV_Runtime_EnergyGuides",
    "CV_Runtime_Console",
    "CV_Runtime_Exterior",
    "CV_Runtime_Interactive",
    "CV_Runtime_ReviewOnly",
)


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_master():
    if Path(bpy.data.filepath).resolve() != MASTER_PATH.resolve():
        raise RuntimeError(f"ER-08 must load locked master {MASTER_PATH}; got {bpy.data.filepath}")
    actual = sha256(MASTER_PATH)
    if actual != MASTER_SHA256:
        raise RuntimeError(f"ER-08 master hash mismatch: {actual}")


def runtime_collections():
    scene_root = bpy.context.scene.collection
    runtime_root = bpy.data.collections.new("CV_Runtime_EngineRoom")
    scene_root.children.link(runtime_root)
    collections = {}
    for name in GROUP_NAMES:
        collection = bpy.data.collections.new(name)
        runtime_root.children.link(collection)
        collections[name] = collection
    return runtime_root, collections


def unlink_and_link(obj, collection):
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)


def remove_object(name):
    obj = bpy.data.objects.get(name)
    if not obj:
        return False
    data = obj.data if obj.type in {"MESH", "CURVE"} else None
    bpy.data.objects.remove(obj, do_unlink=True)
    if data and data.users == 0:
        if isinstance(data, bpy.types.Mesh):
            bpy.data.meshes.remove(data)
        elif isinstance(data, bpy.types.Curve):
            bpy.data.curves.remove(data)
    return True


def remove_runtime_irrelevant_objects():
    removed = []
    for name in (
        "CV_CanonicalReference_Marker",
        "CV_ER06_Exterior_SkyBackdrop",
        "CV_ER06_Exterior_Sea",
        "CV_ER06_Exterior_CoastFar",
        "CV_ER06_Exterior_CoastNear",
        "CV_Console_ScreenSurface",
    ):
        if remove_object(name):
            removed.append(name)
    return removed


def original_collection_names(obj):
    return {collection.name for collection in obj.users_collection}


def semantic_category(obj):
    name = obj.name
    collections = original_collection_names(obj)
    if name in {"CV_ER06_Console_DisplayScreen"}:
        return "console_screen"
    if "GlassPanel" in name:
        return "glass_secondary" if "Secondary" in name else "glass_main"
    if "CV_Reactor_Energy" in collections or "EnergyWell" in name:
        return "energy_secondary" if "Secondary" in name else "energy_main"
    if "CV_Conduits_ER06" in collections or "Conduit_" in name:
        return "conduit"
    if "Console" in name or any("Console" in item for item in collections):
        return "console"
    if "Exterior" in name or "Plant" in name:
        return "exterior"
    if "Secondary" in name or any("Secondary" in item for item in collections):
        return "secondary"
    reactor_prefixes = (
        "CV_Reactor_", "CV_ER06_Main_", "CV_ER06_Internal_",
        "CV_ER06_Platform_", "CV_ER06B_Main_", "CV_ER06B_Internal_",
        "CV_ER06B_Reactor_",
    )
    if name.startswith(reactor_prefixes) or any(
        item.startswith("CV_Reactor_") or item in {
            "CV_Reactor_Detail_ER06", "CV_Reactor_InternalDetail_ER06",
            "CV_Reactor_Fidelity_ER06B"
        }
        for item in collections
    ):
        return "reactor"
    return "architecture"


def evaluated_mesh_for_object(obj, depsgraph):
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(
        evaluated, preserve_all_data_layers=True, depsgraph=depsgraph
    )
    mesh.name = f"{obj.name}_RuntimeMesh"
    return mesh


def apply_mesh_modifiers(obj, depsgraph):
    old_mesh = obj.data
    obj.data = evaluated_mesh_for_object(obj, depsgraph)
    obj.modifiers.clear()
    if old_mesh.users == 0:
        bpy.data.meshes.remove(old_mesh)


def sample_indices(length, step):
    indices = list(range(0, length, step))
    if indices and indices[-1] != length - 1:
        indices.append(length - 1)
    return indices


def simplify_energy_curve(obj):
    old = obj.data
    new = bpy.data.curves.new(f"{obj.name}_RuntimeCurve", type="CURVE")
    new.dimensions = old.dimensions
    new.resolution_u = 1
    new.resolution_v = 1
    new.bevel_depth = old.bevel_depth
    new.bevel_resolution = 2
    new.resolution_u = 1
    new.use_fill_caps = old.use_fill_caps
    for material in old.materials:
        new.materials.append(material)
    for spline in old.splines:
        if spline.type != "POLY":
            raise RuntimeError(f"Unexpected ER-08 energy spline type {spline.type}: {obj.name}")
        indices = sample_indices(len(spline.points), 1)
        target = new.splines.new("POLY")
        target.points.add(len(indices) - 1)
        target.use_cyclic_u = spline.use_cyclic_u
        for target_point, source_index in zip(target.points, indices):
            source = spline.points[source_index]
            target_point.co = source.co
            target_point.radius = source.radius
            target_point.tilt = source.tilt
    obj.data = new
    if old.users == 0:
        bpy.data.curves.remove(old)


def convert_curve_to_mesh(obj, depsgraph):
    source_materials = [material for material in obj.data.materials if material]
    mesh = evaluated_mesh_for_object(obj, depsgraph)
    for material in source_materials:
        if material.name not in mesh.materials:
            mesh.materials.append(material)
    new_obj = bpy.data.objects.new(obj.name, mesh)
    new_obj.matrix_world = obj.matrix_world.copy()
    new_obj.hide_render = obj.hide_render
    new_obj.hide_viewport = obj.hide_viewport
    for key in obj.keys():
        new_obj[key] = obj[key]
    for collection in obj.users_collection:
        collection.objects.link(new_obj)
    old_curve = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    if old_curve.users == 0:
        bpy.data.curves.remove(old_curve)
    return new_obj


def material_signature(obj):
    return tuple(slot.material.name if slot.material else "None" for slot in obj.material_slots)


def safe_token(value):
    value = value.removeprefix("CV_Mat_")
    return re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_") or "NoMaterial"


def join_objects(objects, name, collection, role, dynamic=False):
    objects = [obj for obj in objects if obj and obj.name in bpy.data.objects]
    if not objects:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    active = objects[0]
    bpy.context.view_layer.objects.active = active
    if len(objects) > 1:
        bpy.ops.object.join()
    active = bpy.context.view_layer.objects.active
    active.name = name
    active.data.name = f"{name}_Mesh"
    unlink_and_link(active, collection)
    active["CV_RuntimeGroup"] = role
    active["CV_RuntimeDynamic"] = bool(dynamic)
    active["CV_ER08Export"] = True
    return active


def consolidate_static_meshes(collections):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    categories = defaultdict(list)
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH" or obj.hide_render:
            continue
        category = semantic_category(obj)
        if category.startswith("energy") or category in {"conduit", "console_screen"}:
            continue
        apply_mesh_modifiers(obj, depsgraph)
        categories[(category, material_signature(obj))].append(obj)

    mapping = {
        "architecture": (collections["CV_Runtime_StaticArchitecture"], "StaticArchitecture"),
        "reactor": (collections["CV_Runtime_StaticReactor"], "StaticReactor"),
        "secondary": (collections["CV_Runtime_SecondaryChamber"], "SecondaryChamber"),
        "glass_main": (collections["CV_Runtime_Glass"], "GlassMain"),
        "glass_secondary": (collections["CV_Runtime_Glass"], "GlassSecondary"),
        "console": (collections["CV_Runtime_Console"], "Console"),
        "exterior": (collections["CV_Runtime_Exterior"], "Exterior"),
    }
    results = []
    for (category, signature), objects in sorted(categories.items(), key=lambda item: str(item[0])):
        collection, role = mapping[category]
        material_part = "__".join(safe_token(item) for item in signature)
        name = f"CV_Runtime_{role}_{material_part}"
        results.append(join_objects(objects, name, collection, role, dynamic=False))
    return [obj for obj in results if obj]


def render(camera_name, path):
    scene = bpy.context.scene
    camera = bpy.data.objects.get(camera_name)
    if not camera:
        raise RuntimeError(f"Missing ER-08 camera: {camera_name}")
    scene.camera = camera
    scene.render.resolution_x = 1536
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def optimize_energy_and_conduits(collections):
    energy_groups = defaultdict(list)
    energy_curves = [
        obj for obj in list(bpy.context.scene.objects)
        if obj.type == "CURVE" and semantic_category(obj).startswith("energy")
    ]
    for obj in energy_curves:
        simplify_energy_curve(obj)
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()

    for obj in energy_curves:
        category = semantic_category(obj)
        converted = convert_curve_to_mesh(obj, depsgraph)
        energy_groups[(category, material_signature(converted))].append(converted)

    for obj in list(bpy.context.scene.objects):
        if obj.type == "MESH" and semantic_category(obj).startswith("energy"):
            category = semantic_category(obj)
            apply_mesh_modifiers(obj, depsgraph)
            energy_groups[(category, material_signature(obj))].append(obj)

    energy_results = []
    for (category, signature), objects in sorted(energy_groups.items(), key=lambda item: str(item[0])):
        hierarchy = "Main" if category == "energy_main" else "Secondary"
        material_part = "__".join(safe_token(item) for item in signature)
        energy_results.append(join_objects(
            objects,
            f"CV_Runtime_Energy{hierarchy}_{material_part}",
            collections["CV_Runtime_EnergyGuides"],
            f"Energy{hierarchy}",
            dynamic=True,
        ))

    conduit_results = []
    for obj in list(bpy.context.scene.objects):
        if obj.type == "CURVE" and semantic_category(obj) == "conduit":
            converted = convert_curve_to_mesh(obj, depsgraph)
            unlink_and_link(converted, collections["CV_Runtime_StaticReactor"])
            converted["CV_RuntimeGroup"] = "Conduit"
            converted["CV_RuntimeDynamic"] = False
            converted["CV_ER08Export"] = True
            converted.data.name = f"{converted.name}_RuntimeMesh"
            conduit_results.append(converted)
    return [obj for obj in energy_results if obj], conduit_results


def preserve_console_screen(collections):
    screen = bpy.data.objects.get("CV_ER06_Console_DisplayScreen")
    if not screen:
        raise RuntimeError("Missing semantic console screen")
    depsgraph = bpy.context.evaluated_depsgraph_get()
    apply_mesh_modifiers(screen, depsgraph)
    screen.name = "CV_Runtime_ConsoleScreen"
    screen.data.name = "CV_Runtime_ConsoleScreen_Mesh"
    unlink_and_link(screen, collections["CV_Runtime_Console"])
    screen["CV_RuntimeGroup"] = "ConsoleScreen"
    screen["CV_RuntimeDynamic"] = True
    screen["CV_RuntimeTruthOwner"] = "Runtime application state"
    screen["CV_ER08Export"] = True
    return screen


def reduce_review_lights():
    removed = []
    for name in (
        "CV_ER06B_EnergyLight_LowerFocus",
        "CV_ER06B_EnergyLight_UpperFocus",
    ):
        light = bpy.data.objects.get(name)
        if light:
            data = light.data
            bpy.data.objects.remove(light, do_unlink=True)
            if data.users == 0:
                bpy.data.lights.remove(data)
            removed.append(name)
    return removed


def organize_review_objects(collections):
    review = collections["CV_Runtime_ReviewOnly"]
    for obj in list(bpy.context.scene.objects):
        if obj.type in {"CAMERA", "LIGHT"}:
            unlink_and_link(obj, review)
            obj["CV_ER08Export"] = False


def create_group_empties(collections):
    empties = []
    for collection_name, collection in collections.items():
        if collection_name == "CV_Runtime_ReviewOnly":
            continue
        empty = bpy.data.objects.new(f"{collection_name}_Group", None)
        collection.objects.link(empty)
        empty.empty_display_type = "PLAIN_AXES"
        empty["CV_ER08Export"] = True
        empty["CV_RuntimeSemanticGroup"] = collection_name
        for obj in list(collection.objects):
            if obj == empty or obj.type not in {"MESH", "EMPTY"}:
                continue
            obj.parent = empty
        empties.append(empty)
    return empties


def remove_empty_legacy_collections(runtime_root):
    runtime_names = {runtime_root.name, *GROUP_NAMES}
    for collection in list(bpy.data.collections):
        if collection.name in runtime_names:
            continue
        if len(collection.objects) == 0:
            bpy.data.collections.remove(collection)


def purge_unused_data():
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for curve in list(bpy.data.curves):
        if curve.users == 0:
            bpy.data.curves.remove(curve)
    for material in list(bpy.data.materials):
        if material.users == 0:
            bpy.data.materials.remove(material)
    for image in list(bpy.data.images):
        if image.users == 0:
            bpy.data.images.remove(image)


def mark_export_objects():
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" or obj.name.startswith("CV_Runtime_") and obj.type == "EMPTY":
            obj["CV_ER08Export"] = True


def configure_metadata(removed_objects, removed_lights):
    scene = bpy.context.scene
    scene.name = "CV_EngineRoom_ER08_RuntimeDerivative"
    scene["CV_ProductionStage"] = "ER-08 Optimization Derivative"
    scene["CV_SourceArtLocked"] = True
    scene["CV_SourceMaster"] = "../engine-room.blend"
    scene["CV_SourceMasterSHA256"] = MASTER_SHA256
    scene["CV_RuntimeTruthDeferredToER09"] = True
    scene["CV_CandidateGLBOnly"] = True
    scene["CV_ProductionRuntimeUntouched"] = True
    scene["CV_RemovedRuntimeIrrelevantObjects"] = ", ".join(removed_objects)
    scene["CV_RemovedReviewLights"] = ", ".join(removed_lights)
    scene["CV_EnergyStrategy"] = "Separate optimized guide meshes; runtime controls visibility, color and animation"
    scene["CV_ExteriorStrategy"] = "Packed matte billboard; intended-camera constraint required"


def main():
    verify_master()
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    PHASE_DIR.mkdir(parents=True, exist_ok=True)
    runtime_root, collections = runtime_collections()
    removed_objects = remove_runtime_irrelevant_objects()

    consolidate_static_meshes(collections)
    if "--skip-phase-a" not in sys.argv:
        render("CV_HeroCamera", PHASE_A_PATH)

    optimize_energy_and_conduits(collections)
    preserve_console_screen(collections)
    removed_lights = reduce_review_lights()
    organize_review_objects(collections)
    create_group_empties(collections)
    remove_empty_legacy_collections(runtime_root)
    purge_unused_data()
    mark_export_objects()

    matte = bpy.data.images.get("CV_ER06B_MediterraneanExterior")
    if matte:
        matte.filepath = "//../assets/er06b-mediterranean-exterior.png"
    configure_metadata(removed_objects, removed_lights)

    hero = bpy.data.objects.get("CV_HeroCamera")
    bpy.context.scene.camera = hero
    bpy.context.scene.render.filepath = str(HERO_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(RUNTIME_BLEND_PATH))

    render("CV_HeroCamera", HERO_PATH)
    render("CV_ER06B_AlternateCamera", ALTERNATE_PATH)
    render("CV_ER06B_ReactorCamera", REACTOR_PATH)

    bpy.context.scene.camera = hero
    bpy.context.scene.render.filepath = str(HERO_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(RUNTIME_BLEND_PATH))
    if sha256(MASTER_PATH) != MASTER_SHA256:
        raise RuntimeError("Locked master changed during ER-08 build")
    print(f"CV_ER08_RUNTIME_BLEND={RUNTIME_BLEND_PATH}")
    print(f"CV_ER08_MASTER_SHA256={sha256(MASTER_PATH)}")
    print(f"CV_ER08_PHASE_A={PHASE_A_PATH}")
    print(f"CV_ER08_HERO={HERO_PATH}")
    print(f"CV_ER08_ALTERNATE={ALTERNATE_PATH}")
    print(f"CV_ER08_REACTOR={REACTOR_PATH}")


if __name__ == "__main__":
    main()
