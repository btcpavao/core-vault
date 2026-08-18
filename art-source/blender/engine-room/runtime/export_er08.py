"""Export the ER-08 runtime derivative as a self-contained candidate GLB."""

from pathlib import Path
import hashlib

import bpy


RUNTIME_DIR = Path(__file__).resolve().parent
SOURCE_DIR = RUNTIME_DIR.parent
MASTER_PATH = SOURCE_DIR / "engine-room.blend"
RUNTIME_BLEND_PATH = RUNTIME_DIR / "engine-room-runtime.blend"
CANDIDATE_PATH = RUNTIME_DIR / "exports" / "cv_engine_room_er08_candidate.glb"
MASTER_SHA256 = "7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648"


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    if Path(bpy.data.filepath).resolve() != RUNTIME_BLEND_PATH.resolve():
        raise RuntimeError(f"Expected ER-08 derivative {RUNTIME_BLEND_PATH}; got {bpy.data.filepath}")
    if sha256(MASTER_PATH) != MASTER_SHA256:
        raise RuntimeError("Locked ER-07 master hash mismatch before GLB export")

    CANDIDATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    selected = []
    for obj in bpy.context.scene.objects:
        if bool(obj.get("CV_ER08Export", False)) and obj.type in {"MESH", "EMPTY"}:
            obj.hide_set(False)
            obj.select_set(True)
            selected.append(obj)
    if not selected:
        raise RuntimeError("No CV_ER08Export objects found")

    bpy.context.view_layer.objects.active = next(
        (obj for obj in selected if obj.type == "MESH"), selected[0]
    )
    bpy.ops.export_scene.gltf(
        filepath=str(CANDIDATE_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_extras=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_yup=True,
        export_attributes=False,
        export_unused_images=False,
        export_unused_textures=False,
    )
    if sha256(MASTER_PATH) != MASTER_SHA256:
        raise RuntimeError("Locked ER-07 master changed during GLB export")
    print(f"CV_ER08_EXPORT_OBJECTS={len(selected)}")
    print(f"CV_ER08_CANDIDATE={CANDIDATE_PATH}")
    print(f"CV_ER08_CANDIDATE_SHA256={sha256(CANDIDATE_PATH)}")
    print(f"CV_ER08_MASTER_SHA256={sha256(MASTER_PATH)}")


if __name__ == "__main__":
    main()
