# Experience Scene Asset Pipeline

## Scope

This is the local, auditable asset path for Core Vault's renderer-neutral Experience System. It does not change Bitcoin Core integration, wallet state, permissions, RPC authority, or the Visual State Adapter boundary.

GLB is no longer the universal runtime-world format. A room may use a semantic scene package containing a high-fidelity master scene, raster layers, depth information, semantic masks, state masks, lighting/emissive masks, interaction metadata, audio, shader data, and selective GLB geometry. The exact production formats must be proven by the Engine Room cinematic 2.5D vertical slice before they are standardized.

## Renderer-neutral runtime contract

- Runtime assets are local, auditable, licensed, replaceable, and outside Bitcoin authority.
- Runtime root remains `public/assets/experience/` unless the proof establishes a documented alternative.
- Engine Room assets remain under `public/assets/experience/engine-room/`.
- Asset paths and semantic identifiers remain centralized; the current GLB registry is `src/experience/assets/assetManifest.ts`.
- Domain state maps through the Visual State Adapter to semantic scene state; the renderer/compositor never interprets raw RPC.
- A failed optional art asset must degrade to a procedural local fallback. It must not report or imply Bitcoin Core failure.
- No runtime asset may require a network fetch.

## Conceptual semantic scene package

```text
engine-room/
  base
  depth
  foreground
  reactor-mask
  conduits-mask
  network-mask
  ambient-light-mask
  offline-state
  syncing-state
  ready-state
  network-disabled-state
  new-block-state
  interaction-map
  metadata
  audio
```

This is conceptual, not a mandatory filesystem layout or file-format decision. The durable architecture is:

```text
Domain State → Visual State Adapter → Semantic Scene State → Renderer / Compositor
```

Every layer must originate from one coherent composition and preserve shared perspective, depth, material response, light direction, atmosphere, and color treatment. Interaction regions require stable semantic identity and accessible DOM equivalence. A beautiful background plus unrelated SVG glow, floating cards, or arbitrary hotspots is rejected.

Allowed local asset families include high-resolution WebP/AVIF/PNG where justified, depth maps, semantic and state masks, emissive/lighting masks, foreground layers, shader inputs, selective GLB, audio, metadata, and authored source files. Choose formats according to measured fidelity, alpha/depth needs, decoding cost, memory, packaging, and platform support.

## Selective geometry coordinate and naming convention

- One scene unit equals one metre.
- Y is up.
- The authored front of a prop faces positive Z.
- The model origin sits at the horizontal centre of its floor contact patch.
- Runtime asset names start with `cv_` and use lowercase snake case.
- Scene nodes use readable `Pascal_Snake_Case` names grouped by function.
- Material names start with `CV_` and map to the semantic material families in `WorldMaterials.tsx`.

## Scene quality and performance budget

- Use limestone, restrained aged bronze/dark metal, technical glass, and state-driven blue energy only when functionally justified.
- Avoid ornamental bright gold, random surface noise, particles, and post-processing as substitutes for structure.
- Keep props low enough in complexity for an integrated desktop GPU. Prefer repeated primitive geometry and shared materials.
- Prefer the shared 128 px procedural maps for room-scale surfaces. A larger file-backed texture needs a visually proven hero need, a documented licence, and an explicit performance review.
- Use PBR metalness/roughness values. Do not bake state-driven energy into a texture.

For layered scenes also document source resolution, runtime dimensions, encoding, compressed size, decoded-memory estimate, layer count, state variants, crop registration, and update frequency. Prefer event-driven state compositing over unnecessary per-frame work.

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

## Existing first proof asset

`cv_engine_room_cooling_manifold.glb` is an original Core Vault asset created for this repository. Its source is the deterministic script `art-source/engine-room/export-cooling-manifold.mjs`. It is licensed as **Core Vault original** and has no third-party attribution requirement.

Regenerate it from the repository root with:

```sh
node art-source/engine-room/export-cooling-manifold.mjs
```

The asset is passive presentation. Its inner material is intentionally dark and subdued; live blue node meaning continues to come only from `NodeStatus -> EngineRoomVisualState -> R3F` in code.

## Engine Room cinematic 2.5D proof package

The first renderer-pivot proof uses five fully registered, composition-matched WebP state plates rather than a generic room format. The canonical Ready plate carries the architecture, perspective, material response, shadows, reflected light, atmosphere, Reactor, console, secondary chamber, and exterior. The four companion plates change only physical scene state: Offline, Syncing, Network disabled, and New block. No SVG energy, CSS machinery, remote texture, or runtime image-generation call is used.

All plates are 1672 × 941, lossy WebP quality 92, and share a single crop. They are declared in `src/experience/assets/assetManifest.ts` and live in `public/assets/experience/engine-room/cinematic/`. Total encoded size is 1,830,294 bytes (1.75 MiB). One decoded RGBA plate is approximately 6,293,408 bytes (6.00 MiB); five preloaded plates are approximately 30.0 MiB before browser-internal overhead.

Provenance for every plate:

- source: the approved project-owned Engine Room reference at `docs/references/engine-room/engine-room-hero-reference.png`;
- creator/tool: human-directed OpenAI image editing through Codex on 2026-08-18;
- licence: Core Vault original, project-owned derivative of supplied project-owned reference material;
- project-original: yes;
- generated from supplied project-owned reference material: yes;
- runtime use: local committed presentation asset only, with no network fetch;
- audit record: `art-source/blender/engine-room/review/cinematic-2_5d/CINEMATIC-2_5D-MANIFEST.md`.

Runtime selection is explicit: `legacy`, `production`, or `cinematic`. The cinematic compositor still receives the existing `EngineRoomVisualState`; the real block-height reducer remains the only production trigger for the short gold state. Reactor and console hit regions are semantic DOM buttons registered to the visible composition. The existing contextual NodeStatus panel remains DOM and is not rasterized.

## Review checklist for future scene packages and assets

1. Confirm purpose, master composition, viewpoint, semantic objects, and exact room placement before import.
2. Confirm licence and attribution in this document or a neighbouring asset note.
3. Confirm depth/crop registration and semantic naming; where geometry exists, also confirm metre scale, Y-up orientation, and origin.
4. Confirm material family and texture budget.
5. Register paths and semantic identifiers centrally and provide a local failure path.
6. Build the app, inspect the actual Tauri WebView, and test the presentation failure path.
7. Verify no loader, model, or interaction has access to Tauri commands or Bitcoin RPC.
8. Verify keyboard, screen-reader, and Reduced Motion behavior for every meaningful interaction region.
9. Compare a normal running screenshot with the approved reference and reject sticker-like overlays.
