"""ER-07 read-only Blender gate: metrics, dependency audit and final renders.

Run with the approved source file already loaded:
  Blender --background engine-room.blend --python gate_er07.py

This script does not save the .blend or alter production art on disk.
"""

from pathlib import Path
import json
import math
import sys

import bpy
from mathutils import Vector


SOURCE_DIR = Path(__file__).resolve().parent
REVIEW_DIR = SOURCE_DIR / "review"
BLEND_PATH = SOURCE_DIR / "engine-room.blend"
EXPECTED_CAMERA_POSITION = Vector((-0.25, -13.5, 2.1))
EXPECTED_CAMERA_TARGET = Vector((0.10, 1.8, 1.75))
RENDER_JOBS = (
    ("CV_HeroCamera", "er-07-final-hero.png"),
    ("CV_ER06B_AlternateCamera", "er-07-final-alternate.png"),
    ("CV_ER06B_ReactorCamera", "er-07-final-reactor-closeup.png"),
    ("CV_ER06B_ExteriorCamera", "er-07-final-exterior.png"),
)


def plain(value):
    if hasattr(value, "to_list"):
        return [plain(item) for item in value.to_list()]
    if isinstance(value, (tuple, list)):
        return [plain(item) for item in value]
    if hasattr(value, "__iter__") and not isinstance(value, (str, bytes, dict)):
        return [plain(item) for item in value]
    return value


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


def evaluated_geometry_metrics():
    depsgraph = bpy.context.evaluated_depsgraph_get()
    total_vertices = 0
    total_triangles = 0
    rows = []
    for obj in bpy.context.scene.objects:
        if obj.type not in {"MESH", "CURVE"} or obj.hide_render:
            continue
        evaluated = obj.evaluated_get(depsgraph)
        try:
            mesh = evaluated.to_mesh(preserve_all_data_layers=False, depsgraph=depsgraph)
        except TypeError:
            mesh = evaluated.to_mesh()
        if not mesh:
            continue
        mesh.calc_loop_triangles()
        vertices = len(mesh.vertices)
        triangles = len(mesh.loop_triangles)
        total_vertices += vertices
        total_triangles += triangles
        rows.append({"name": obj.name, "type": obj.type, "vertices": vertices, "triangles": triangles})
        evaluated.to_mesh_clear()
    return {
        "render_vertices": total_vertices,
        "render_triangles": total_triangles,
        "top_triangle_objects": sorted(rows, key=lambda row: row["triangles"], reverse=True)[:12],
    }


def source_mesh_metrics():
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    vertices = 0
    triangles = 0
    for obj in mesh_objects:
        obj.data.calc_loop_triangles()
        vertices += len(obj.data.vertices)
        triangles += len(obj.data.loop_triangles)
    return {
        "mesh_objects": len(mesh_objects),
        "source_mesh_vertices": vertices,
        "source_mesh_triangles": triangles,
    }


def dependency_audit():
    images = []
    missing = []
    for image in sorted(bpy.data.images, key=lambda item: item.name):
        if image.source != "FILE":
            continue
        raw_path = image.filepath
        absolute = Path(bpy.path.abspath(raw_path)).resolve() if raw_path else None
        packed = bool(image.packed_file)
        exists = bool(absolute and absolute.is_file())
        row = {
            "name": image.name,
            "filepath": raw_path,
            "absolute_path": str(absolute) if absolute else None,
            "packed": packed,
            "external_file_exists": exists,
        }
        images.append(row)
        if not packed and not exists:
            missing.append({"type": "IMAGE", **row})

    libraries = []
    for library in bpy.data.libraries:
        absolute = Path(bpy.path.abspath(library.filepath)).resolve()
        row = {"filepath": library.filepath, "absolute_path": str(absolute), "exists": absolute.is_file()}
        libraries.append(row)
        if not row["exists"]:
            missing.append({"type": "LIBRARY", **row})

    cache_files = []
    for cache in bpy.data.cache_files:
        absolute = Path(bpy.path.abspath(cache.filepath)).resolve()
        row = {"name": cache.name, "filepath": cache.filepath, "absolute_path": str(absolute), "exists": absolute.exists()}
        cache_files.append(row)
        if not row["exists"]:
            missing.append({"type": "CACHE", **row})

    movie_clips = []
    for clip in bpy.data.movieclips:
        absolute = Path(bpy.path.abspath(clip.filepath)).resolve()
        row = {"name": clip.name, "filepath": clip.filepath, "absolute_path": str(absolute), "exists": absolute.is_file()}
        movie_clips.append(row)
        if not row["exists"]:
            missing.append({"type": "MOVIE_CLIP", **row})

    external_fonts = []
    for font in bpy.data.fonts:
        if not font.filepath or font.filepath == "<builtin>":
            continue
        absolute = Path(bpy.path.abspath(font.filepath)).resolve()
        row = {"name": font.name, "filepath": font.filepath, "absolute_path": str(absolute), "exists": absolute.is_file()}
        external_fonts.append(row)
        if not row["exists"]:
            missing.append({"type": "FONT", **row})

    return {
        "images": images,
        "linked_libraries": libraries,
        "cache_files": cache_files,
        "movie_clips": movie_clips,
        "external_fonts": external_fonts,
        "missing_critical_dependencies": missing,
    }


def scene_metrics():
    scene = bpy.context.scene
    transparent_objects = []
    for obj in scene.objects:
        if obj.type != "MESH":
            continue
        if any(material_is_transparency_heavy(slot.material) for slot in obj.material_slots):
            transparent_objects.append(obj.name)

    energy_collection = bpy.data.collections.get("CV_Reactor_Energy")
    metrics = {
        "objects": len(scene.objects),
        **source_mesh_metrics(),
        **evaluated_geometry_metrics(),
        "materials": len(bpy.data.materials),
        "lights": sum(1 for obj in scene.objects if obj.type == "LIGHT"),
        "curves": sum(1 for obj in scene.objects if obj.type == "CURVE"),
        "energy_objects": len(energy_collection.all_objects) if energy_collection else 0,
        "transparency_heavy_objects": len(transparent_objects),
        "transparency_heavy_object_names": sorted(transparent_objects),
        "blend_file_size_bytes": BLEND_PATH.stat().st_size,
    }
    return metrics


def validate_camera():
    scene = bpy.context.scene
    camera = bpy.data.objects.get("CV_HeroCamera")
    expected_rotation = (EXPECTED_CAMERA_TARGET - EXPECTED_CAMERA_POSITION).to_track_quat("-Z", "Y")
    rotation_error = (
        camera.rotation_euler.to_quaternion().rotation_difference(expected_rotation).angle
        if camera else math.inf
    )
    valid = bool(
        camera
        and camera.data.lens == 38.0
        and all(abs(float(a) - float(b)) <= 1e-6 for a, b in zip(camera.location, EXPECTED_CAMERA_POSITION))
        and rotation_error <= 1e-6
    )
    return {
        "name": camera.name if camera else None,
        "position": [float(component) for component in camera.location] if camera else None,
        "lens_mm": float(camera.data.lens) if camera else None,
        "target_rotation_error_radians": rotation_error,
        "active_at_load": bool(camera and scene.camera == camera),
        "valid": valid,
    }


def render_reviews():
    scene = bpy.context.scene
    scene.render.resolution_x = 1536
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    outputs = []
    for camera_name, filename in RENDER_JOBS:
        camera = bpy.data.objects.get(camera_name)
        if not camera or camera.type != "CAMERA":
            raise RuntimeError(f"Missing ER-07 review camera: {camera_name}")
        output_path = REVIEW_DIR / filename
        scene.camera = camera
        scene.render.filepath = str(output_path)
        bpy.ops.render.render(write_still=True)
        outputs.append(str(output_path))
    return outputs


def main():
    if Path(bpy.data.filepath).resolve() != BLEND_PATH.resolve():
        raise RuntimeError(f"ER-07 gate must load {BLEND_PATH}, got {bpy.data.filepath}")
    camera = validate_camera()
    if not camera["valid"]:
        raise RuntimeError("Locked CV_HeroCamera state is invalid")
    dependencies = dependency_audit()
    if dependencies["missing_critical_dependencies"]:
        raise RuntimeError("Missing critical dependencies: " + json.dumps(dependencies["missing_critical_dependencies"]))
    metrics = scene_metrics()
    audit_only = "--audit-only" in sys.argv
    outputs = (
        [str(REVIEW_DIR / filename) for _, filename in RENDER_JOBS]
        if audit_only else render_reviews()
    )
    print("CV_ER07_CAMERA=" + json.dumps(camera, sort_keys=True))
    print("CV_ER07_METRICS=" + json.dumps(metrics, sort_keys=True))
    print("CV_ER07_DEPENDENCIES=" + json.dumps(dependencies, sort_keys=True))
    print("CV_ER07_RENDERS=" + json.dumps(outputs, sort_keys=True))


if __name__ == "__main__":
    main()
