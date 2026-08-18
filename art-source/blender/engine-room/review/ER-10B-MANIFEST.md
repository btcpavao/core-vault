# ER-10b Manifest

## Locked sources

| Asset | SHA-256 | Status |
| --- | --- | --- |
| `art-source/blender/engine-room/engine-room.blend` | `7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648` | unchanged |
| `public/assets/experience/engine-room/production/cv_engine_room_er09.glb` | `f848f8a0b3afb2447317604dd9cd88b87b9b4a3f1ba66014c505d9282f5fc6c0` | unchanged |

No Blender edit, replacement GLB, derivative geometry, texture, lightmap, vertex-color attribute, or state bake was created.

## Runtime files changed in ER-10b

- `src/experience/rooms/EngineRoom/ProductionEngineRoom.tsx`
  - deterministic SH `LightProbe` static irradiance
  - `VITE_CV_ER10B_STATIC_INDIRECT` and `VITE_CV_ER10B_SHADOWS` isolation switches
  - conditional selective casters/key shadow
  - final environment, hemisphere, key, and centralized bronze convergence
- `src/experience/ExperienceRoot.tsx`
  - ER-10b capture filenames
  - compile-time foreground QA A-F selector, sampler remount, short deterministic result fields, asset probe
- `src/experience/useNodeStatus.ts`
  - permits the compile-time ER-10b QA app to use only the supplied localhost cookie/port settings
- `vite.config.ts`
  - ER-10b review filenames added to the existing development-only local capture allowlist
- `tests/experience/productionEngineRoom.test.ts`
  - static indirect and conditional selective-shadow ownership assertions
- `src-tauri/tauri.er10b.conf.json`
  - debug QA product/bundle identity and same-origin CSP required by the packaged GLB probe; normal Tauri configuration is unchanged

No Bitcoin Core RPC, wallet, signing, IPC command, permission allowlist, backend, or production network-policy file changed.

## Final renderer contract

- five active lights maximum: warm directional, cool directional, hemisphere contribution, main blue point spill, secondary blue point spill
- local environment: three deterministic Lightformers, one-shot 256 environment cube
- static indirect: one local SH LightProbe, no texture or asset payload
- shadow: one selective 512 x 512 map on the warm directional
- shadow casters: main Reactor, secondary chamber, console, interactive meshes only
- architecture: receive-only
- alpha/clearcoat glass; transmission remains 0
- post-processing passes: 0
- new shipped textures: 0
- production DPR: 1
- runtime texture count: 5 with shadow ON, 4 with shadow OFF
- legacy fallback: retained through `EngineRoomRuntime` / `ProductionSceneBoundary`

## QA harness

Build variables used for the registered QA app:

```text
VITE_EXPERIENCE=engine-room
VITE_CV_ENGINE_ROOM_PRODUCTION=1
VITE_CV_ER10B_QA=1
VITE_CORE_QA_COOKIE_PATH=<isolated-regtest-cookie>
VITE_CORE_QA_PORT=19443
```

Isolation builds additionally used `VITE_CV_ER10B_SHADOWS=0` and/or `VITE_CV_ER10B_STATIC_INDIRECT=0`. The QA panel exists only when `VITE_CV_ER10B_QA=1`; the normal production build eliminates it. A registered `.app` was held foreground-active with Computer Use for each 1.5 s warm-up plus approximately 8 s sample. Raw values are stored in `er-10b-performance-foreground.json`.

## Final A-F summary

| A | B | C | D | E | F |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 60.000 FPS | 59.366 FPS | 59.998 FPS | 59.998 FPS | 59.998 FPS | 60.027 FPS |

Shadow ON minus OFF: -0.035 FPS, +0.010 ms average, +0.099 calls, +908 triangles, +1 runtime texture. Static indirect ON versus OFF: no measurable cost and no resource-count change.

Fresh-package first render was 2,088 ms; warm relaunches were 1,973 and 1,996 ms.

## Review evidence and hashes

| File | SHA-256 |
| --- | --- |
| `er-10b-runtime-hero.png` | `49740aba9bb20c8d13c188ec6c22b57b335be48168e8075c37112348ccaf789f` |
| `er-10b-runtime-alternate.png` | `25620eff45fa1c08997b7e5277926beafc112f28ebac7438ddb911a1f9f4bba4` |
| `er-10b-runtime-reactor-closeup.png` | `a6414b369f4136d9b9ad3de3bb7bd3173b8b58ae59b4168e7b7df43785451cf8` |
| `er-10b-runtime-console.png` | `e2f62105208be789e6e7fe0caa83914ccead17f65aad372b44e79bb3860c2be5` |
| `er-08-vs-er-10b-runtime.png` | `bac91b3f6e671838f338fef3ede7f54871bf9f886c0861ac8244be2c0b412491` |
| `er-10-vs-er-10b-runtime.png` | `18dd3e2570156ce096243e6f8245e2c8491d5dac9c4aae20c4596b66d746f52b` |
| `er-08-vs-er-10b-reactor-closeup.png` | `654f23b53aad47dc00aa43826ce5849d9b4cadd29849d5a9bb0f35562db31239` |

The three comparison images were made only by equal-height scaling and horizontal stacking. No manual color correction was applied.

## Verification

`npm run verify` completed successfully on 2026-08-17:

- TypeScript typecheck: pass
- Rust format check: pass
- Rust clippy with warnings denied: pass
- Vitest: 10 files, 81 tests passed
- production Vite build: pass
- Rust tests: 68 passed, 0 failed, 4 explicitly ignored regtest fixtures
- locked master and production GLB hashes: pass
- legacy fallback: retained and existing regression suite passed

## Final status

**ER-10b PASS.** Lighting/bounce is no longer blocking and the foreground performance gate is complete. Recommended next step, only when explicitly requested: `ER-11 — Performance Review`.
