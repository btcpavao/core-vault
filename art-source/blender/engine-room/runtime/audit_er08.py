"""Read-only structural audit for ER-08 source and runtime Blender files."""

from collections import Counter, defaultdict
from pathlib import Path
import json

import bpy


def material_usage():
    usage = Counter()
    for obj in bpy.context.scene.objects:
        if obj.type not in {"MESH", "CURVE"}:
            continue
        for slot in obj.material_slots:
            if slot.material:
                usage[slot.material.name] += 1
    return [
        {
            "name": material.name,
            "object_slots": usage[material.name],
            "stage": material.get("CV_ProductionStage"),
            "family": material.get("CV_MaterialFamily"),
        }
        for material in sorted(bpy.data.materials, key=lambda item: item.name)
    ]


def collection_usage():
    rows = []
    for collection in sorted(bpy.data.collections, key=lambda item: item.name):
        objects = list(collection.objects)
        rows.append({
            "name": collection.name,
            "objects_direct": len(objects),
            "meshes_direct": sum(1 for obj in objects if obj.type == "MESH"),
            "curves_direct": sum(1 for obj in objects if obj.type == "CURVE"),
            "lights_direct": sum(1 for obj in objects if obj.type == "LIGHT"),
            "children": sorted(child.name for child in collection.children),
        })
    return rows


def repeated_meshes():
    users = defaultdict(list)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            users[obj.data.name].append(obj.name)
    return [
        {"mesh": mesh_name, "users": len(names), "objects": sorted(names)}
        for mesh_name, names in sorted(users.items()) if len(names) > 1
    ]


def object_prefix_counts():
    counts = Counter()
    for obj in bpy.context.scene.objects:
        parts = obj.name.split("_")
        prefix = "_".join(parts[:3]) if len(parts) >= 3 else obj.name
        counts[prefix] += 1
    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0])))


def lights():
    return [
        {
            "name": obj.name,
            "type": obj.data.type,
            "energy": float(obj.data.energy),
            "color": [float(value) for value in obj.data.color],
            "collections": sorted(collection.name for collection in obj.users_collection),
        }
        for obj in sorted(bpy.context.scene.objects, key=lambda item: item.name)
        if obj.type == "LIGHT"
    ]


def curves():
    rows = []
    for obj in sorted(bpy.context.scene.objects, key=lambda item: item.name):
        if obj.type != "CURVE":
            continue
        points = sum(len(spline.points) + len(spline.bezier_points) for spline in obj.data.splines)
        rows.append({
            "name": obj.name,
            "points": points,
            "bevel_depth": float(obj.data.bevel_depth),
            "bevel_resolution": int(obj.data.bevel_resolution),
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "collections": sorted(collection.name for collection in obj.users_collection),
        })
    return rows


def main():
    report = {
        "blend": bpy.data.filepath,
        "blend_size_bytes": Path(bpy.data.filepath).stat().st_size,
        "collections": collection_usage(),
        "materials": material_usage(),
        "repeated_mesh_datablocks": repeated_meshes(),
        "object_prefix_counts": object_prefix_counts(),
        "lights": lights(),
        "curves": curves(),
    }
    print("CV_ER08_STRUCTURAL_AUDIT=" + json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
