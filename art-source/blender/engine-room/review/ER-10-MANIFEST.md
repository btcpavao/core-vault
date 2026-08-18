# ER-10 Manifest

## Status

**ER-10 FAIL** — fidelity and final performance gates remain open. Required evidence and known blockers are preserved here for review.

## Locked assets

| Asset | SHA-256 | Status |
| --- | --- | --- |
| `art-source/blender/engine-room/engine-room.blend` | `7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648` | Locked, unchanged |
| `public/assets/experience/engine-room/production/cv_engine_room_er09.glb` | `f848f8a0b3afb2447317604dd9cd88b87b9b4a3f1ba66014c505d9282f5fc6c0` | Reused, unchanged |

## ER-10 runtime files changed

- `src/experience/ExperienceRoot.tsx`
- `src/experience/camera/engineRoomCamera.ts`
- `src/experience/rooms/EngineRoom/ProductionEngineRoom.tsx`
- `src/experience/rooms/EngineRoom/productionSceneContract.ts`
- `tests/experience/camera.test.ts`
- `vite.config.ts`

Other dirty/untracked repository files predate this ER-10 pass and are not attributed to ER-10.

## New assets

- Texture files: none
- Shader files: none
- Geometry/GLB files: none
- Post-processing assets: none

## Runtime capture hashes

| File | SHA-256 |
| --- | --- |
| `er-10-runtime-hero.png` | `f9ee9828c84fccb7e48b62be42debb6512fc2606b0b30e3ddd68885d38f5e1da` |
| `er-10-runtime-alternate.png` | `0370cc7ef15be7e8b1979957a3975a416a5fe07de2d8d68192c029c97d145c45` |
| `er-10-runtime-reactor-closeup.png` | `ae8659bd5dc7ef40499fb7276a0135b6c9bb6962aa7d7694b38d8da16fe62377` |
| `er-10-runtime-console.png` | `c5c9fafbf2637c0090701df8ac93c54f84877217901e36c66325da45894fbe9e` |
| `er-10-runtime-exterior.png` | `f02541b075bd36c07178f13a2d8919a56013eb251fae5058d786a9fa695ecca2` |

## Comparison hashes

| File | SHA-256 |
| --- | --- |
| `er-08-vs-er-10-runtime.png` | `da4a526749d5e2d4cb9f01eb26496482cad52951c52b19c07e912534a69ae6c1` |
| `er-09-vs-er-10-runtime.png` | `ffe04ae8313e809f2e4b5c857f7c16a9f14e1a8a26c984d8cb4d696f44d510c8` |
| `er-08-vs-er-10-reactor-closeup.png` | `aaa39ce5cec960497ccce302498c918bfd83a9d6bd32abc61a78530f49b0a271` |

## Runtime configuration

- Active lights: 5 (warm directional key, cool directional depth, hemisphere fill, main blue point spill, secondary blue point spill)
- Environment: 3 local deterministic Lightformers, resolution 256, one-frame capture
- Tone mapping: ACES, production exposure 0.90
- Shadows: one 512 x 512 map on the existing warm key; selective casters; 8 px configured radius
- Post-processing: none
- Glass: alpha/clearcoat, no transmission, front side, no depth write, main/secondary opacity 0.14/0.11
- Energy: additive alpha; real-state ownership retained; no bloom or halo geometry
- Exterior: single existing matte, cooler blue-grey tune, no cards or world geometry
- Console: existing state-driven CanvasTexture; redraw remains state-change-driven

## Verification

- TypeScript/Vitest camera focus: 5/5 passed during development.
- Full `npm run verify`: passed.
- Frontend: 10 test files, 80/80 tests passed.
- Rust: 68 passed, 0 failed, 4 explicitly ignored real-bitcoind lifecycle tests.
- Production build: passed; existing >500 kB chunk warning remains.
- Master and GLB hashes: verified after final captures.

## Reports

- `ER-10-RUNTIME-FIDELITY.md`
- `ER-10-PERFORMANCE.md`
- `ER-10-MANIFEST.md`

## Legacy and truth guarantees

- `VITE_CV_ENGINE_ROOM_PRODUCTION=1` remains supported.
- Development A/B `?engineRoom=production` and `?engineRoom=legacy` remain supported.
- Production error fallback remains.
- Bitcoin Core RPC, wallet, signing, IPC security, permissions, network policy, and Rust backend semantics were not changed.
- Connection, chain, ready/syncing/offline, real-block pulse, reduced motion, console ownership, and independent secondary energy semantics remain state-driven.

## Known remaining issues

1. Lighting/bounce remains materially harder than ER-08.
2. Alpha glass lacks ER-08 containment depth.
3. Energy filaments remain crisp and internal bright rings can clip white.
4. Stone/floor lack approved procedural richness.
5. Exterior atmospheric depth remains flat.
6. The final selective-shadow stack does not have a valid A-F performance matrix.

Do not begin ER-11 automatically.
