"""Read-only ER-06b validation against a fresh approved ER-04c/ER-05 rebuild."""

from pathlib import Path
import json
import math
import sys

import bpy
from mathutils import Vector


SOURCE_DIR = Path(__file__).resolve().parent
if str(SOURCE_DIR) not in sys.path:
    sys.path.insert(0, str(SOURCE_DIR))

import validate_er06 as er06_validation
from er04c_state_signature import digest, modifier_state, node_state, plain


EXPECTED_CAMERA_POSITION = Vector((-0.25, -13.5, 2.1))
EXPECTED_CAMERA_TARGET = Vector((0.10, 1.8, 1.75))
EXPECTED_REVIEW_FILES = (
    "er-06b-detail-hero.png",
    "er-06b-detail-alternate.png",
    "er-06b-reactor-fidelity-closeup.png",
    "er-06b-energy-closeup.png",
    "er-06b-console-closeup.png",
    "er-06b-exterior-depth.png",
    "er-06-vs-er-06b.png",
    "er-06b-reference-comparison.png",
)
ER06B_COLLECTIONS = (
    "CV_Fidelity_ER06B",
    "CV_Reactor_Fidelity_ER06B",
    "CV_Secondary_Fidelity_ER06B",
    "CV_Realism_ER06B",
)
ER05_LIGHTS = (
    "CV_Light_Daylight_LeftKey",
    "CV_Light_Daylight_LeftSky",
    "CV_Light_Interior_WarmBounce",
    "CV_Light_Reactor_Sculpt",
    "CV_Light_Rear_Depth",
    "CV_Light_Secondary_Separation",
)


def is_er06_or_er06b_object(obj):
    return obj.name.startswith("CV_ER06_") or obj.name.startswith("CV_ER06B_")


def approved_geometry_state():
    rows = []
    objects = [
        obj for obj in bpy.data.objects
        if obj.type == "MESH" and not is_er06_or_er06b_object(obj)
    ]
    for obj in sorted(objects, key=lambda item: item.name):
        mesh = obj.data
        rows.append({
            "name": obj.name,
            "mesh": mesh.name,
            "location": plain(obj.location),
            "rotation_euler": plain(obj.rotation_euler),
            "scale": plain(obj.scale),
            "parent": obj.parent.name if obj.parent else None,
            "collections": sorted(collection.name for collection in obj.users_collection),
            "vertices": [[vertex.index, plain(vertex.co)] for vertex in mesh.vertices],
            "edges": [[edge.index, list(edge.vertices), edge.use_edge_sharp] for edge in mesh.edges],
            "polygons": [
                [polygon.index, list(polygon.vertices), polygon.use_smooth]
                for polygon in mesh.polygons
            ],
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "modifiers": [modifier_state(modifier) for modifier in obj.modifiers],
        })
    return rows


def approved_material_state():
    rows = []
    excluded_stages = {
        "ER-06 detail-only addition",
        "ER-06 lightweight exterior depth",
        "ER-06b project-owned photographic exterior support",
    }
    materials = [
        material for material in bpy.data.materials
        if material.name.startswith("CV_Mat_")
        and not material.name.startswith("CV_Mat_Energy_")
        and not material.name.startswith("CV_Mat_ER06B_")
        and material.get("CV_ProductionStage") not in excluded_stages
    ]
    for material in sorted(materials, key=lambda item: item.name):
        row = {
            "name": material.name,
            "diffuse_color": plain(material.diffuse_color),
            "custom": {key: plain(material[key]) for key in sorted(material.keys())},
            "surface_render_method": getattr(material, "surface_render_method", None),
            "nodes": [],
            "links": [],
        }
        if material.node_tree:
            row["nodes"] = [
                node_state(node) for node in sorted(material.node_tree.nodes, key=lambda item: item.name)
            ]
            row["links"] = sorted([
                [link.from_node.name, link.from_socket.name, link.to_node.name, link.to_socket.name]
                for link in material.node_tree.links
            ])
        rows.append(row)
    return rows


def final_light_state():
    rows = []
    for name in sorted(ER05_LIGHTS):
        obj = bpy.data.objects.get(name)
        if not obj:
            rows.append({"name": name, "missing": True})
            continue
        rows.append({
            "name": name,
            "location": plain(obj.location),
            "rotation_euler": plain(obj.rotation_euler),
            "type": obj.data.type,
            "energy": plain(obj.data.energy),
            "shape": obj.data.shape,
            "size": plain(obj.data.size),
            "color": plain(obj.data.color),
            "use_shadow": obj.data.use_shadow,
        })
    return rows


def close_vector(actual, expected, tolerance=1e-6):
    return all(abs(float(a) - float(b)) <= tolerance for a, b in zip(actual, expected))


def main():
    scene = bpy.context.scene
    camera = bpy.data.objects.get("CV_HeroCamera")
    expected_rotation = (EXPECTED_CAMERA_TARGET - EXPECTED_CAMERA_POSITION).to_track_quat("-Z", "Y")
    rotation_error = (
        camera.rotation_euler.to_quaternion().rotation_difference(expected_rotation).angle
        if camera else math.inf
    )
    current_geometry = approved_geometry_state()
    current_materials = approved_material_state()
    current_lights = final_light_state()
    energy_collection = bpy.data.collections.get("CV_Reactor_Energy")
    review_dir = SOURCE_DIR / "review"
    matte_image = bpy.data.images.get("CV_ER06B_MediterraneanExterior")
    fallback_names = (
        "CV_ER06_Exterior_SkyBackdrop",
        "CV_ER06_Exterior_Sea",
        "CV_ER06_Exterior_CoastFar",
        "CV_ER06_Exterior_CoastNear",
    )
    result = {
        "blend_file": bpy.data.filepath,
        "scene": scene.name,
        "production_stage": scene.get("CV_ProductionStage"),
        "hero_camera_position": plain(camera.location) if camera else None,
        "hero_camera_lens_mm": float(camera.data.lens) if camera else None,
        "hero_camera_target_rotation_error_radians": rotation_error,
        "hero_camera_valid": bool(
            camera
            and scene.camera == camera
            and close_vector(camera.location, EXPECTED_CAMERA_POSITION)
            and abs(camera.data.lens - 38.0) <= 1e-7
            and rotation_error <= 1e-6
        ),
        "approved_mesh_objects": len(current_geometry),
        "total_mesh_objects": sum(1 for obj in bpy.data.objects if obj.type == "MESH"),
        "approved_materials": len(current_materials),
        "total_materials": len(bpy.data.materials),
        "energy_curves": sum(1 for obj in energy_collection.all_objects if obj.type == "CURVE") if energy_collection else 0,
        "energy_wells": sum(1 for obj in bpy.data.objects if obj.name.startswith("CV_ER06B_EnergyWell_")),
        "energy_lights": sum(1 for obj in energy_collection.all_objects if obj.type == "LIGHT") if energy_collection else 0,
        "conduit_curves": sum(1 for obj in bpy.data.objects if obj.type == "CURVE" and obj.name.startswith("CV_ER06_Conduit_")),
        "er06b_collections_present": {name: name in bpy.data.collections for name in ER06B_COLLECTIONS},
        "er06b_mesh_objects": sum(1 for obj in bpy.data.objects if obj.type == "MESH" and obj.name.startswith("CV_ER06B_")),
        "matte_object_present": "CV_ER06B_ExteriorMatte" in bpy.data.objects,
        "matte_image_packed": bool(matte_image and matte_image.packed_file),
        "fallback_backdrops_retained_hidden": {
            name: bool(bpy.data.objects.get(name) and bpy.data.objects[name].hide_render)
            for name in fallback_names
        },
        "er05_lighting_locked": scene.get("CV_ER05LightingLocked"),
        "major_geometry_locked": scene.get("CV_MajorGeometryLocked"),
        "er07_started": scene.get("CV_ER07Started"),
        "runtime_deferred": scene.get("CV_RuntimeDeferred"),
        "glb_exported": scene.get("CV_GLBExported"),
        "review_files_present": {name: (review_dir / name).is_file() for name in EXPECTED_REVIEW_FILES},
    }

    current_geometry_hash = digest(current_geometry)
    current_material_hash = digest(current_materials)
    current_light_hash = digest(current_lights)
    er06_validation.rebuild_approved_state()
    expected_geometry_hash = digest(approved_geometry_state())
    expected_material_hash = digest(approved_material_state())
    expected_light_hash = digest(final_light_state())
    result.update({
        "approved_geometry_hash": current_geometry_hash,
        "expected_approved_geometry_hash": expected_geometry_hash,
        "approved_geometry_unchanged": current_geometry_hash == expected_geometry_hash,
        "approved_material_hash": current_material_hash,
        "expected_approved_material_hash": expected_material_hash,
        "approved_materials_unchanged": current_material_hash == expected_material_hash,
        "er05_final_light_hash": current_light_hash,
        "expected_er05_final_light_hash": expected_light_hash,
        "er05_final_lights_unchanged": current_light_hash == expected_light_hash,
    })
    print("CV_ER06B_VALIDATION=" + json.dumps(result, sort_keys=True))

    failures = []
    if not result["hero_camera_valid"]:
        failures.append("hero camera")
    if not result["approved_geometry_unchanged"] or result["approved_mesh_objects"] != 571:
        failures.append("approved geometry")
    if not result["approved_materials_unchanged"] or result["approved_materials"] != 23:
        failures.append("approved materials")
    if not result["er05_final_lights_unchanged"]:
        failures.append("ER-05 final lights")
    if (result["energy_curves"], result["energy_wells"], result["energy_lights"], result["conduit_curves"]) != (24, 3, 6, 4):
        failures.append("ER-06b energy/conduit structure")
    if not all(result["er06b_collections_present"].values()) or result["er06b_mesh_objects"] < 90:
        failures.append("ER-06b fidelity layer")
    if not result["matte_object_present"] or not result["matte_image_packed"]:
        failures.append("project-owned matte")
    if not all(result["fallback_backdrops_retained_hidden"].values()):
        failures.append("editable exterior fallback")
    if result["er07_started"] is not False or result["runtime_deferred"] is not True:
        failures.append("stage boundary")
    if result["glb_exported"] is not False:
        failures.append("GLB export state")
    if not all(result["review_files_present"].values()):
        failures.append("review outputs")
    if failures:
        raise RuntimeError("ER-06b validation failed: " + ", ".join(failures))


if __name__ == "__main__":
    main()
