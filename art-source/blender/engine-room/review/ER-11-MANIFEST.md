# ER-11 — Manifest

Decision: **FAIL** pending an uncapped packaged performance rerun and longer soak. ER-12 was not started.

## Locked assets

- Blender master: `art-source/blender/engine-room/engine-room.blend`
  - SHA-256 `7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648`
- Production GLB: `public/assets/experience/engine-room/production/cv_engine_room_er09.glb`
  - 18,853,768 bytes
  - SHA-256 `f848f8a0b3afb2447317604dd9cd88b87b9b4a3f1ba66014c505d9282f5fc6c0`

## Packaged artifact

- `src-tauri/target/release/bundle/macos/Core Vault ER11 QA.app`
- Product `Core Vault ER11 QA`; identifier `com.corevault.er11.qa`; release app bundle.
- Executable SHA-256 `d4fffdf74d6564540e63e8263df174d36279916356667c7ed68241a225cf93bf`.
- App bundle 16,112 KiB; executable 16,492,032 bytes.

## ER-11 runtime/instrumentation files

- `src/experience/ExperienceRoot.tsx`
- `src/experience/rooms/EngineRoom/ProductionEngineRoom.tsx`
- `src/experience/rooms/EngineRoom/EngineRoomPerformanceSampler.tsx`
- `src/experience/rooms/EngineRoom/EngineRoomResourceProbe.tsx`
- `src/experience/rooms/EngineRoom/productionPerformance.ts`
- `tests/experience/productionEngineRoom.test.ts`
- `src-tauri/tauri.er11.conf.json`

No Bitcoin Core RPC, wallet, signing, IPC permission or backend security semantics were changed.

## Raw evidence and reports

- `er-11-performance-packaged.json`
- `er-11-lifecycle-resources.json`
- `ER-11-PERFORMANCE.md`
- `ER-11-LIFECYCLE.md`
- `ER-11-MANIFEST.md`

## Packaged captures

- `er-11-packaged-hero.png` — `cbdbb0fcd0d9caba54c56142985a5eebe1515be7ca8dac1cdc298b9d628c50ea`
- `er-11-packaged-reactor-closeup.png` — `61b007e3dda8ba5a84e13b9cba5d37e75157b1522cbca2d6e979bbd71c7fa194`
- `er-11-packaged-console.png` — `ed00b601f087674bc5e6d8d59ed46798d2a647b5045dc0c9d2c9eab6e20fa760`
- `er-10b-vs-er-11-packaged.png` — `e49772385bf14b3f5e8237ace734c280c175cbf16364de2f5715c6763cffc253`

The side-by-side comparison uses the approved ER-10b hero on the left and packaged ER-11 on the right with no color correction. No material visual difference was found.

## Final resource result

- Ten cycles / 22 records complete.
- Geometries 63–67, final 67.
- Textures 3–5, final 5.
- Programs 4–10, final 10.
- Console textures created/disposed 12/11.
- Production runtime mounts/unmounts 12/11.
- Environment mounts/unmounts 1/0.
- SH probe mounts/unmounts 1/0.

## Test result

- Focused production Engine Room suite: 13/13 passing.
- Full `npm run verify`: PASS — TypeScript/lint, Cargo format/clippy, 83/83 Vitest tests, production Vite build, and Rust 68 passed / 4 explicitly ignored / 0 failed.

## Known issues / gate blockers

1. macOS Low Power Mode capped packaged WebKit at 30 Hz; the required approximately 60 FPS static and greater-than-45 FPS camera targets were not demonstrated.
2. Final-artifact numeric A–F export needs repetition with the WebView held foreground; the current table is from the immediately preceding renderer-identical package.
3. The soak lasted five minutes rather than the recommended 30 minutes.
4. Diagnostic legacy → production environment recapture should be watched in a future repeated A/B stress test; ordinary production room re-entry is stable.

Legacy fallback remains present, single-scene, and operational. No compression candidate was adopted.
