"""Read-only ER-08 derivative, candidate GLB and round-trip validation."""

from pathlib import Path
import hashlib
import json
import math
import struct

import bpy
from mathutils import Vector


RUNTIME_DIR = Path(__file__).resolve().parent
SOURCE_DIR = RUNTIME_DIR.parent
REVIEW_DIR = SOURCE_DIR / "review"
MASTER_PATH = SOURCE_DIR / "engine-room.blend"
RUNTIME_BLEND_PATH = RUNTIME_DIR / "engine-room-runtime.blend"
CANDIDATE_PATH = RUNTIME_DIR / "exports" / "cv_engine_room_er08_candidate.glb"
MASTER_SHA256 = "7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648"
EXPECTED_CAMERA_POSITION = Vector((-0.25, -13.5, 2.1))
EXPECTED_CAMERA_TARGET = Vector((0.10, 1.8, 1.75))
EXPECTED_GROUPS = {
    "CV_Runtime_StaticArchitecture",
    "CV_Runtime_StaticReactor",
    "CV_Runtime_SecondaryChamber",
    "CV_Runtime_Glass",
    "CV_Runtime_EnergyGuides",
    "CV_Runtime_Console",
    "CV_Runtime_Exterior",
    "CV_Runtime_Interactive",
    "CV_Runtime_ReviewOnly",
}
REQUIRED_RENDERS = (
    REVIEW_DIR / "er-08-optimized-hero.png",
    REVIEW_DIR / "er-08-optimized-alternate.png",
    REVIEW_DIR / "er-08-optimized-reactor-closeup.png",
)


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def material_is_transparency_heavy(material):
    if not material or not material.node_tree:
        return False
    for node in material.node_tree.nodes:
        if node.type in {"BSDF_GLASS", "BSDF_TRANSPARENT", "VOLUME_ABSORPTION", "VOLUME_SCATTER"}:
            return True
        if node.type == "BSDF_PRINCIPLED":
            transmission = node.inputs.get("Transmission Weight")
            alpha = node.inputs.get("Alpha")
            if transmission and float(transmission.default_value) > 0.01:
                return True
            if alpha and float(alpha.default_value) < 0.999:
                return True
    return False


def derivative_metrics():
    scene = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()
    render_vertices = 0
    render_triangles = 0
    top_rows = []
    for obj in scene.objects:
        if obj.type != "MESH" or obj.hide_render:
            continue
        evaluated = obj.evaluated_get(depsgraph)
        try:
            mesh = evaluated.to_mesh(preserve_all_data_layers=False, depsgraph=depsgraph)
        except TypeError:
            mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        row = {"name": obj.name, "vertices": len(mesh.vertices), "triangles": len(mesh.loop_triangles)}
        render_vertices += row["vertices"]
        render_triangles += row["triangles"]
        top_rows.append(row)
        evaluated.to_mesh_clear()

    mesh_objects = [obj for obj in scene.objects if obj.type == "MESH"]
    transparent_objects = [
        obj.name for obj in mesh_objects
        if any(material_is_transparency_heavy(slot.material) for slot in obj.material_slots)
    ]
    energy_objects = [obj.name for obj in mesh_objects if obj.name.startswith("CV_Runtime_Energy")]
    group_collections = sorted(name for name in EXPECTED_GROUPS if bpy.data.collections.get(name))
    export_objects = [obj.name for obj in scene.objects if bool(obj.get("CV_ER08Export", False))]
    return {
        "objects": len(scene.objects),
        "mesh_objects": len(mesh_objects),
        "source_mesh_vertices": sum(len(obj.data.vertices) for obj in mesh_objects),
        "source_mesh_triangles": sum(
            len(obj.data.loop_triangles) if not obj.data.calc_loop_triangles() else 0
            for obj in mesh_objects
        ),
        "render_vertices": render_vertices,
        "render_triangles": render_triangles,
        "top_triangle_objects": sorted(top_rows, key=lambda row: row["triangles"], reverse=True)[:12],
        "materials": len(bpy.data.materials),
        "lights": sum(1 for obj in scene.objects if obj.type == "LIGHT"),
        "curves": sum(1 for obj in scene.objects if obj.type == "CURVE"),
        "energy_objects": len(energy_objects),
        "energy_object_names": sorted(energy_objects),
        "transparency_heavy_objects": len(transparent_objects),
        "transparency_heavy_object_names": sorted(transparent_objects),
        "runtime_groups": group_collections,
        "export_objects": len(export_objects),
        "blend_file_size_bytes": RUNTIME_BLEND_PATH.stat().st_size,
    }


def validate_camera():
    camera = bpy.data.objects.get("CV_HeroCamera")
    expected_rotation = (EXPECTED_CAMERA_TARGET - EXPECTED_CAMERA_POSITION).to_track_quat("-Z", "Y")
    rotation_error = (
        camera.rotation_euler.to_quaternion().rotation_difference(expected_rotation).angle
        if camera else math.inf
    )
    valid = bool(
        camera
        and camera.type == "CAMERA"
        and abs(float(camera.data.lens) - 38.0) <= 1e-6
        and all(abs(float(a) - float(b)) <= 1e-6 for a, b in zip(camera.location, EXPECTED_CAMERA_POSITION))
        and rotation_error <= 1e-6
    )
    return {
        "name": camera.name if camera else None,
        "position": [float(value) for value in camera.location] if camera else None,
        "lens_mm": float(camera.data.lens) if camera else None,
        "target_rotation_error_radians": rotation_error,
        "valid": valid,
    }


def dependency_audit():
    images = []
    missing = []
    for image in sorted(bpy.data.images, key=lambda item: item.name):
        if image.source != "FILE":
            continue
        absolute = Path(bpy.path.abspath(image.filepath)).resolve() if image.filepath else None
        row = {
            "name": image.name,
            "filepath": image.filepath,
            "packed": bool(image.packed_file),
            "external_file_exists": bool(absolute and absolute.is_file()),
        }
        images.append(row)
        if not row["packed"] and not row["external_file_exists"]:
            missing.append(row)
    return {"images": images, "missing_critical_dependencies": missing}


def read_glb_json(path):
    with path.open("rb") as handle:
        header = handle.read(12)
        if len(header) != 12:
            raise RuntimeError("Candidate GLB header is incomplete")
        magic, version, total_length = struct.unpack("<4sII", header)
        if magic != b"glTF" or version != 2 or total_length != path.stat().st_size:
            raise RuntimeError("Candidate is not a valid glTF 2.0 binary container")
        chunk_length, chunk_type = struct.unpack("<II", handle.read(8))
        if chunk_type != 0x4E4F534A:
            raise RuntimeError("Candidate GLB first chunk is not JSON")
        document = json.loads(handle.read(chunk_length).decode("utf-8").rstrip(" \t\r\n\0"))
    return document


def glb_metrics(document):
    accessors = document.get("accessors", [])
    vertices = 0
    triangles = 0
    primitives = 0
    for mesh in document.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            primitives += 1
            position_index = primitive.get("attributes", {}).get("POSITION")
            if position_index is not None:
                vertices += int(accessors[position_index].get("count", 0))
            mode = int(primitive.get("mode", 4))
            if mode == 4:
                indices = primitive.get("indices")
                count = int(accessors[indices].get("count", 0)) if indices is not None else int(
                    accessors[position_index].get("count", 0)
                )
                triangles += count // 3

    materials = document.get("materials", [])
    transparent_materials = []
    for material in materials:
        extensions = material.get("extensions", {})
        if material.get("alphaMode", "OPAQUE") != "OPAQUE" or "KHR_materials_transmission" in extensions:
            transparent_materials.append(material.get("name"))
    node_names = {node.get("name") for node in document.get("nodes", [])}
    semantic_nodes = sorted(name for name in node_names if name and name.startswith("CV_Runtime_"))
    external_uris = []
    for buffer in document.get("buffers", []):
        if buffer.get("uri"):
            external_uris.append(buffer["uri"])
    for image in document.get("images", []):
        if image.get("uri"):
            external_uris.append(image["uri"])
    punctual = document.get("extensions", {}).get("KHR_lights_punctual", {}).get("lights", [])
    return {
        "nodes": len(document.get("nodes", [])),
        "meshes": len(document.get("meshes", [])),
        "primitives": primitives,
        "materials": len(materials),
        "textures": len(document.get("textures", [])),
        "images": len(document.get("images", [])),
        "animations": len(document.get("animations", [])),
        "lights": len(punctual),
        "vertices": vertices,
        "triangles": triangles,
        "transparent_materials": len(transparent_materials),
        "transparent_material_names": sorted(name for name in transparent_materials if name),
        "semantic_nodes": semantic_nodes,
        "external_uris": external_uris,
        "file_size_bytes": CANDIDATE_PATH.stat().st_size,
        "sha256": sha256(CANDIDATE_PATH),
    }


def validate_runtime(metrics, camera, dependencies, glb):
    failures = []
    if sha256(MASTER_PATH) != MASTER_SHA256:
        failures.append("locked master hash mismatch")
    if not camera["valid"]:
        failures.append("locked hero camera invalid")
    if dependencies["missing_critical_dependencies"]:
        failures.append("missing derivative dependency")
    if set(metrics["runtime_groups"]) != EXPECTED_GROUPS:
        failures.append("runtime semantic collection set incomplete")
    if metrics["mesh_objects"] > 60:
        failures.append("derivative mesh object budget exceeded")
    if metrics["materials"] > 31:
        failures.append("derivative material budget exceeded")
    if metrics["lights"] > 11:
        failures.append("derivative review light budget exceeded")
    if metrics["curves"] != 0:
        failures.append("unconverted curves remain")
    if metrics["energy_objects"] != 6:
        failures.append("energy guide semantic group count mismatch")
    if metrics["transparency_heavy_objects"] != 2:
        failures.append("glass object count mismatch")
    if not all(path.is_file() for path in REQUIRED_RENDERS):
        failures.append("required ER-08 render missing")
    if glb["meshes"] == 0 or glb["triangles"] == 0:
        failures.append("candidate GLB contains no renderable geometry")
    if glb["animations"] != 0 or glb["lights"] != 0:
        failures.append("candidate includes disallowed animation or lights")
    if glb["external_uris"]:
        failures.append("candidate GLB is not self-contained")
    required_nodes = {
        "CV_Runtime_ConsoleScreen",
        "CV_Runtime_GlassMain_Glass_Reactor",
        "CV_Runtime_GlassSecondary_Glass_Secondary",
    }
    if not required_nodes.issubset(set(glb["semantic_nodes"])):
        failures.append("candidate semantic node set incomplete")
    return failures


def roundtrip_import():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    result = bpy.ops.import_scene.gltf(filepath=str(CANDIDATE_PATH))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    return {
        "operator_result": sorted(result),
        "objects": len(bpy.context.scene.objects),
        "meshes": len(meshes),
        "materials": len(bpy.data.materials),
        "success": "FINISHED" in result and len(meshes) > 0,
    }


def main():
    if Path(bpy.data.filepath).resolve() != RUNTIME_BLEND_PATH.resolve():
        raise RuntimeError(f"Expected ER-08 derivative {RUNTIME_BLEND_PATH}; got {bpy.data.filepath}")
    if not CANDIDATE_PATH.is_file():
        raise RuntimeError(f"Missing candidate GLB: {CANDIDATE_PATH}")
    metrics = derivative_metrics()
    camera = validate_camera()
    dependencies = dependency_audit()
    glb = glb_metrics(read_glb_json(CANDIDATE_PATH))
    failures = validate_runtime(metrics, camera, dependencies, glb)
    roundtrip = roundtrip_import()
    if not roundtrip["success"]:
        failures.append("candidate GLB round-trip import failed")
    report = {
        "master_sha256": sha256(MASTER_PATH),
        "runtime_blend_sha256": sha256(RUNTIME_BLEND_PATH),
        "camera": camera,
        "derivative": metrics,
        "dependencies": dependencies,
        "candidate_glb": glb,
        "roundtrip": roundtrip,
        "failures": failures,
        "passed": not failures,
    }
    print("CV_ER08_VALIDATION=" + json.dumps(report, sort_keys=True))
    if failures:
        raise RuntimeError("ER-08 validation failed: " + "; ".join(failures))
    print("CV_ER08_VALIDATION_PASS")


if __name__ == "__main__":
    main()
