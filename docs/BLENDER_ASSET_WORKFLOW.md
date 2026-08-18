# Blender optional authored-3D asset workflow

Blender remains a supported source tool, not a mandatory pipeline for every Core Vault room. Use it where actual geometry has clear value: hero props, selective real-time assets, reference rendering, depth generation, semantic/lighting masks, source art, or future objects that benefit from real 3D.

The existing Reactor and Engine Room work is legitimate historical and technical evidence. It remains reusable under the renderer-neutral Cinematic 2.5D Scene System and must not be described as wasted or incorrect.

## Local tool assumption

Core Vault's existing authored-3D pipeline targets Blender 5.2 LTS at:

```text
/Applications/Blender.app/Contents/MacOS/Blender
```

The Reactor build runs headlessly through Blender Python. It makes no network request and has no external texture or model dependency. Future cinematic scene packages may use Blender differently or not at all.

## Source and runtime locations

| Role | Location |
| --- | --- |
| Deterministic authored source | `art-source/blender/core-reactor/build_core_reactor_v1.py` |
| Source notes | `art-source/blender/core-reactor/README.md` |
| Runtime GLB | `public/assets/experience/engine-room/cv_core_reactor_v1.glb` |
| Runtime manifest | `src/experience/assets/assetManifest.ts` |
| Loader and passive fallback | `src/experience/rooms/EngineRoom/components/AuthoredCoreReactor.tsx` |

The checked-in Python script is the durable geometry source for Reactor v1. A generated `.blend` is intentionally not required for reproducibility.

## Rebuild

Run from the repository root:

```sh
npm run asset:reactor
```

Equivalent direct command:

```sh
/Applications/Blender.app/Contents/MacOS/Blender \
  --background \
  --python art-source/blender/core-reactor/build_core_reactor_v1.py
```

The script exports the GLB and verifies its `glTF` magic, glTF 2 version, declared length, and actual file length before reporting success.

## Naming and coordinate contract

- One scene unit is one metre.
- Blender source is Z-up; exported glTF is Y-up.
- The origin is the horizontal centre of the plinth's floor contact patch.
- Runtime filenames use the `cv_` prefix and lowercase snake case.
- Authored nodes use readable `Pascal_Snake_Case` names grouped by function.
- Materials use semantic `CV_` names: limestone, structural bronze, precision bronze, dark metal, technical glass, and state-driven energy surfaces.

The mesh hierarchy owns the static object: foundation, lower collar, containment chamber, frame, core assembly, radial conduits, and upper housing. The renderer continues to own live energy values so the asset cannot invent Bitcoin Core state.

## Reactor v1 performance contract

The current export is approximately 1.9 MB and 62,000 authored triangles, with no embedded image textures. The focused v1 guardrails are:

- GLB smaller than 2.5 MB;
- authored geometry below roughly 75,000 triangles;
- no per-frame geometry creation;
- one shared clone per semantic imported material;
- glass does not cast or receive shadows;
- state animation mutates only the imported energy material and existing energy groups;
- reduced motion removes breathing and rotational motion;
- failed loading falls back to passive local geometry and never changes NodeStatus or Core authority.

Any increase beyond these guardrails needs visual evidence from the real Tauri WebView and a documented performance reason.

## Provenance and licensing

Core Reactor v1 is **Core Vault original**. Future authored or texture assets must record creator/source, licence, permitted redistribution, and required attribution before entering the runtime asset directory. An unclear licence is a hard stop; do not import the asset.

Third-party assets must never be fetched at runtime. Runtime presentation assets remain local, replaceable, and outside wallet, RPC, and signing authority. GLB export is one valid output, not a universal room requirement.
