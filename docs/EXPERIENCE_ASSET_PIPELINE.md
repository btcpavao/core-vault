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
- Prefer the shared 128 px procedural maps for room-scale surfaces. A larger file-backed texture needs a visually proven hero need, a documented licence, and an explicit performance review.
- Use PBR metalness/roughness values. Do not bake state-driven energy into a texture.

## Engine Room procedural PBR maps

`src/experience/materials/proceduralTextures.ts` generates the Engine Room material maps once per presentation runtime. The generator is deterministic, self-contained, and makes no network or filesystem request. Every generated map is **Core Vault original** and has no third-party attribution requirement.

The current budget is eleven shared 128 × 128 RGBA maps:

- architectural limestone: base colour, roughness, and normal;
- floor limestone: base colour, roughness, normal, and restrained slab joints;
- brushed bronze: base colour, roughness, normal, and metalness;
- technical glass: a low-contrast roughness map; glass Fresnel response comes from the physical material IOR.

Base-colour maps use sRGB. Roughness, normal, and metalness maps remain in the non-colour data space. The complete uncompressed level-zero set is 720,896 bytes (0.69 MiB), or approximately 0.92 MiB with generated mip levels. All instances share these textures; no state-driven energy texture or post-processing pass is added.

Metal and glass reflections use one local 64 px environment capture assembled from three restrained Drei lightformers. It renders once, is not used as the room background, downloads no HDR image, and adds no per-frame post-processing pass.

The stone generator uses low-frequency periodic variation, sparse shallow pores, and restrained floor joints. It intentionally does not generate cracks, ruin damage, or ornamental patterning. The bronze generator adds directional brushing and small reflectivity variation with limited patina. The glass map adds only enough imperfection for the transparent surface to read under the existing lights.

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
