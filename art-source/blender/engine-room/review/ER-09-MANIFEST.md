# ER-09 Manifest

## Locked sources and runtime asset

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `art-source/blender/engine-room/engine-room.blend` | — | `7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648` |
| `art-source/blender/engine-room/runtime/exports/cv_engine_room_er08_candidate.glb` | 18,853,768 | `f848f8a0b3afb2447317604dd9cd88b87b9b4a3f1ba66014c505d9282f5fc6c0` |
| `public/assets/experience/engine-room/production/cv_engine_room_er09.glb` | 18,853,768 | `f848f8a0b3afb2447317604dd9cd88b87b9b4a3f1ba66014c505d9282f5fc6c0` |

The locked master hash was verified before implementation and again after all runtime work. Candidate and runtime asset hashes match, proving that ER-09 did not mutate the ER-08 candidate.

## Runtime files created

- `public/assets/experience/engine-room/production/cv_engine_room_er09.glb`
- `src/experience/rooms/EngineRoom/EngineRoomRuntime.tsx`
- `src/experience/rooms/EngineRoom/ProductionEngineRoom.tsx`
- `src/experience/rooms/EngineRoom/EngineRoomPerformanceSampler.tsx`
- `src/experience/rooms/EngineRoom/productionPerformance.ts`
- `src/experience/rooms/EngineRoom/productionSceneContract.ts`
- `tests/experience/productionEngineRoom.test.ts`
- `art-source/blender/engine-room/review/ER-09-PERFORMANCE.md`
- `art-source/blender/engine-room/review/ER-09-RUNTIME-INTEGRATION.md`
- `art-source/blender/engine-room/review/ER-09-MANIFEST.md`

## Runtime files modified

- `src/experience/ExperienceRoot.tsx`
- `src/experience/assets/assetManifest.ts`
- `src/experience/camera/CuratedCameraRig.tsx`
- `src/experience/camera/engineRoomCamera.ts`
- `src/experience/experience.css`
- `tests/experience/architecture.test.ts`
- `tests/experience/camera.test.ts`
- `vite.config.ts` (development-only deterministic runtime capture endpoint)

The worktree already contained unrelated and prior Engine Room/Blender-stage changes; they were preserved and are not claimed as ER-09 edits.

## Runtime screenshots

| Screenshot | SHA-256 |
| --- | --- |
| `er-09-runtime-hero.png` | `7db4d4a8472f25582a63fd57b675acedca2316b3a976599b4a49d3538aea79e0` |
| `er-09-runtime-alternate.png` | `b4be387c723cf0970bb529a7bcaa6ab8f3fb3efb065977e036fbf7536589fe53` |
| `er-09-runtime-reactor-closeup.png` | `30eda2f9cc887157846d13ffc2d9738b1909a3efcde18ea96c9adcecae6c4133` |
| `er-09-runtime-console.png` | `a50873bc1dc601068397d27337ad81fdf68e03865eeecce2f460c36f1784c910` |
| `er-08-vs-er-09-runtime.png` | `a4ad4972f70fa03de29e3cceca3fc7bf2f5303c513314552a97e9d0b357cf3c5` |

All four ER-09 views were captured directly from the Core Vault Tauri WebView's Three.js canvas at 1240 × 788. The comparison scales/pads the ER-08 left image to the same displayed 1240 × 788 panel size and applies no color correction.

## Asset and performance metrics

- First observed resource/model/first-render: 254.3 ms / 2,993.7 ms / 3,050.0 ms
- Warm resource/model/first-render: 97.1 ms / 1,254.2 ms / 1,257.0 ms
- Fresh renderer memory indicators: 66 geometries, 5 textures
- Idle hero: 60.00 FPS, 16.67 ms average, 17.60 ms p95, 52 calls, 466,986 triangles
- Camera transition: 54.86 FPS, 18.23 ms average, 17.40 ms p95, 45.02 calls, 460,660 triangles
- Reactor close-up: 60.01 FPS, 16.66 ms average, 17.60 ms p95, 44.01 calls, 460,504 triangles
- Energy inactive: 60.01 FPS
- Reduced motion: 60.01 FPS
- Full report: `art-source/blender/engine-room/review/ER-09-PERFORMANCE.md`

## Runtime configuration

- Runtime active-light count: maximum 5; three non-energy sources plus at most two independently state-controlled blue point lights
- Glass: semantic main/secondary MeshPhysicalMaterial, IOR 1.47, transmission 0, opacity 0.20/0.16, roughness 0.16/0.20, depthWrite false, depthTest true, FrontSide, deterministic render order
- Energy: six semantic guide meshes, additive emissive material, calm ready/syncing modulation, real block pulse, independent main/network secondary state, maximum two spill lights, reduced-motion animation suppression
- Console: runtime-owned CanvasTexture using only actual `EngineRoomVisualState`
- Environment: local runtime-generated Lightformers; no network HDR
- Feature flag: `VITE_CV_ENGINE_ROOM_PRODUCTION=1`
- Development A/B: `?engineRoom=production` / `?engineRoom=legacy`
- Fallback state: legacy remains the safe default and is rendered during production load or production asset/contract failure

## Test results

`npm run verify` passed on 2026-08-16:

- TypeScript: pass
- Rust fmt: pass
- Rust clippy with warnings denied: pass
- Vitest: 10 files, 80 tests passed
- Vite production build: pass
- Rust: 68 passed, 0 failed, 4 explicitly ignored real-regtest lifecycle tests

Actual Tauri runtime review additionally connected to an isolated local Bitcoin Core regtest node at block/header 101, verification progress 1.0, IBD false. No application state was faked in the client.

## Known issues

- Runtime lighting/bounce, procedural surface detail and energy bloom do not yet perfectly match Cycles.
- Exterior atmospheric depth is flatter than the Blender composite but remains safe within curated views.
- First uncached parse/first render is approximately 3.05 s.
- First camera transition can exhibit a short compile/visibility hitch; measured window remains above the 45 FPS short-lived minimum.
- Long-lived HMR cache counters accumulate during iterative review and need a clean packaged-runtime recheck in ER-11.
- Vite reports a large minified R3F experience chunk; no new compression stack was introduced in ER-09.

No security/backend semantics or `src-tauri` source files were changed.
