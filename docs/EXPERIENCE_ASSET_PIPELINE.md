# Experience Asset Pipeline

## Scope

This is the minimal, auditable glTF/GLB path for the real-time Core Vault presentation layer. It does not change Bitcoin Core integration, wallet state, permissions, RPC authority, or the NodeStatus adapter boundary.

## Runtime contract

- Runtime format: binary glTF 2.0 (`.glb`).
- Runtime root: `public/assets/experience/`.
- Engine Room assets: `public/assets/experience/engine-room/`.
- Code registry: `src/experience/assets/assetManifest.ts`.
- Loader boundary: a room-owned React component using Drei `useGLTF` behind `Suspense` and a local passive-art error boundary.
- A failed optional art asset must degrade to a procedural local fallback. It must not report or imply Bitcoin Core failure.

## Coordinate and naming convention

- One scene unit equals one metre.
- Y is up.
- The authored front of a prop faces positive Z.
- The model origin sits at the horizontal centre of its floor contact patch.
- Runtime asset names start with `cv_` and use lowercase snake case.
- Scene nodes use readable `Pascal_Snake_Case` names grouped by function.
- Material names start with `CV_` and map to the semantic material families in `WorldMaterials.tsx`.

## Material and geometry budget

- Use limestone, restrained aged bronze/dark metal, technical glass, and state-driven blue energy only when functionally justified.
- Avoid ornamental bright gold, random surface noise, particles, and post-processing as substitutes for structure.
- Keep props low enough in complexity for an integrated desktop GPU. Prefer repeated primitive geometry and shared materials.
- Texture assets are optional; when added, prefer 1K sources, use 2K only for a visually proven hero need, and document color space and compression.
- Use PBR metalness/roughness values. Do not bake state-driven energy into a texture.

## First proof asset

`cv_engine_room_cooling_manifold.glb` is an original Core Vault asset created for this repository. Its source is the deterministic script `art-source/engine-room/export-cooling-manifold.mjs`. It is licensed as **Core Vault original** and has no third-party attribution requirement.

Regenerate it from the repository root with:

```sh
node art-source/engine-room/export-cooling-manifold.mjs
```

The asset is passive presentation. Its inner material is intentionally dark and subdued; live blue node meaning continues to come only from `NodeStatus -> EngineRoomVisualState -> R3F` in code.

## Review checklist for future assets

1. Confirm purpose and exact room placement before import.
2. Confirm licence and attribution in this document or a neighbouring asset note.
3. Confirm metre scale, Y-up orientation, origin, and naming.
4. Confirm material family and texture budget.
5. Add the central manifest entry and a local fallback.
6. Build the app, inspect the actual Tauri WebView, and test the presentation failure path.
7. Verify no loader, model, or interaction has access to Tauri commands or Bitcoin RPC.
