# ER-11b — Manifest

Decision: **PASS**.

## Locked source assets

| Asset | SHA-256 |
|---|---|
| `art-source/blender/engine-room/engine-room.blend` | `7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648` |
| `public/assets/experience/engine-room/production/cv_engine_room_er09.glb` | `f848f8a0b3afb2447317604dd9cd88b87b9b4a3f1ba66014c505d9282f5fc6c0` |

Both match the required locked hashes and were not modified by ER-11b.

## Final packaged artifact

- Path: `/Users/pavao/Desktop/Core Vault/src-tauri/target/release/bundle/macos/Core Vault ER11b QA.app`
- Bundle identifier: `com.corevault.er11b.qa`
- Version: `0.1.0`
- Executable SHA-256: `883b3cdc8761e12b51ad8ed1ad10302afd0aa5d87385d8f8ea77359b2e2bbe97`
- Executable size: 16,492,032 bytes.
- Bundle size: 16,112 KiB on disk.
- Packaged-build `index.html`: `df6aa28343b7c97209c750e334f115e83cbdc2961615ad93f63818ca4f92d529`.
- Packaged-build CSS: `3276d4c5465eca55ec5bc3c6587915e034839db15d3fca5655b61b0ad5f77bf1`.
- Packaged-build shell JS: `0a7a9dfc8722afb6363c8858da92b9e070b523685b2402b5b4ec01beade900eb`.
- Packaged-build ExperienceRoot JS: `fe16b5c221c7eb5ad686bc34c9282bab7af9738d28dc5fa5ec99e9666d8b274b`.

The artifact was built once for the final gate and was not rebuilt or modified after its hash was fixed.

## Power-state evidence

- `pmset -g batt`: AC Power, battery 100% charged.
- `pmset -g`: `lowpowermode 0`.
- Same AC/LPM state at every five-minute soak sample.
- Machine: `MacBookAir10,1`, Apple M1, 8 GiB RAM.
- OS: macOS 26.5.2 (25F84), Darwin 25.5.0.

## ER-11b-scoped code and instrumentation

- `src-tauri/tauri.er11b.conf.json` — QA-only product name and bundle identifier.
- `src/experience/ExperienceRoot.tsx` — build-flagged `VITE_CV_ER11B_AUTORUN` A/B-first/B-warm/C/D/E/F controller and localStorage export; no lighting, material, camera, energy, console, DPR or asset changes.
- `tests/experience/productionEngineRoom.test.ts` — assertion that the autorun remains explicitly QA-flagged.

Normal production security behavior, Bitcoin Core RPC semantics, wallet logic, signing, IPC permissions and network policy were not changed.

## Raw evidence and reports

- `art-source/blender/engine-room/review/er-11b-performance-packaged.json`
- `art-source/blender/engine-room/review/er-11b-soak-resources.json`
- `art-source/blender/engine-room/review/ER-11B-PERFORMANCE.md`
- `art-source/blender/engine-room/review/ER-11B-LIFECYCLE.md`
- `art-source/blender/engine-room/review/ER-11B-MANIFEST.md`

The performance JSON contains complete frame-time arrays and the exact executable hash. The soak JSON contains the seven process/power samples and post-soak renderer snapshot.

## Packaged screenshots

| File | SHA-256 |
|---|---|
| `er-11b-packaged-hero.png` | `d82d75c8b89ec8ac3a90c1dae094241f9cb467b6d5f0119c5fdd68022126af20` |
| `er-11b-packaged-reactor-closeup.png` | `3312e346bfc7ebc334024ac6c11f3dacc34c1a2c63c344cd5682c865c4564c6e` |
| `er-11b-packaged-console.png` | `134930f17fa8ce7a299258dee3a4a77aaa64deb4b328198653caf7029cdc3f7d` |
| `er-10b-vs-er-11b-packaged.png` | `a47cb837afe3f989435e36480316a5be93f23f8c46d5384a14ea8564487d8a7c` |

The comparison is approved ER-10b on the left and final packaged ER-11b on the right. Cropped-content SSIM is 0.994386; visual review found no material drift and no manual color correction was applied.

## Performance, startup and soak summary

- A 60.005 FPS; B-first 59.873; B-warm 60.000; C 59.873; D 59.873; E 59.374; F 59.800.
- Static approximately 60 FPS; camera safely above 45 FPS; zero frames above 50 ms.
- B-first/warm p95 18/18 ms, p99 22/19 ms, max 31/28 ms. No shader warm-up required.
- Five-launch model-ready min/median/max 1,216/1,318/1,601 ms.
- Five-launch first-render min/median/max 1,219/1,319/4,034 ms; the maximum is a recorded foreground-controller delay outlier.
- 31-minute continuous packaged foreground soak completed; memory bounded and no context loss, recurring exception, duplicated loop or FPS degradation observed.

## Final lifecycle range

- Ten-cycle result: 22 records, all 66 geometries / 5 textures / 10 programs.
- Production mounts/unmounts 12/11; runtime scenes 12.
- Console textures created/disposed 12/11.
- Environment and SH LightProbe each 1/0 singleton.
- One reconnect confirmation preserved scene/resource counts.
- One real block advanced 104 → 105 and pulse serial 0 → 1.
- Minimized main/GPU/WebContent processes sampled at 0.0% CPU; restore preserved state.

## Verification

`npm run verify` passed on 2026-08-18:

- TypeScript `tsc --noEmit`: pass.
- Rust fmt: pass.
- Rust clippy with `-D warnings`: pass (build-script emitted the existing informational `rustc-check-cfg` warning).
- Vitest: 10 files, 84 tests passed.
- Production Vite build: pass; 2,209 modules transformed.
- Rust tests: 68 passed, 0 failed, 4 explicitly ignored real-bitcoind fixtures.
- Final package creation: pass; artifact path and executable hash recorded above.

The Vite large-chunk warning remains informational. ExperienceRoot is already lazy-loaded; no additional split is justified.

## Legacy fallback and known issues

Legacy fallback remains selectable and the production Engine Room was not made the unconditional default. ER-12 retains ownership of the default-flip decision.

Known non-blocking conditions:

- Battery + Low Power Mode may intentionally throttle packaged WebKit to approximately 30 Hz.
- One startup sample includes a foreground-controller delay after model readiness.
- Periodic soak samples contain process RSS; renderer counters are represented by the post-soak snapshot and full lifecycle range.

No ER-11b blocker remains.
