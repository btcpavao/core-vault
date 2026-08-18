# ER-09 Performance Report

## Test environment

- Machine: MacBook Air (MacBookAir10,1), Apple M1, 8 GB RAM
- OS: macOS 26.5.2 (25F84)
- Runtime: Core Vault React Three Fiber / Three.js scene in the local Chromium/WebGL development renderer; actual ready-state screenshots were also verified in the Tauri WebView
- Measurement viewport: 1536 × 1024 CSS pixels
- Device pixel ratio: production Engine Room renderer fixed to 1; legacy renderer retains the existing `[1, 1.5]` range
- Build: Vite development build with the development-only sampler enabled
- Sample window: 1.5 s warm-up followed by approximately 8.0 s of measured frames
- Project target: 60 FPS; short-lived minimum 45 FPS

The numbers below describe this development machine and do not generalize to other hardware.

## Asset baseline

- Asset: `public/assets/experience/engine-room/production/cv_engine_room_er09.glb`
- Size: 18,853,768 bytes (18.85 MB decimal / 17.98 MiB)
- Encoding: unchanged, uncompressed ER-08 candidate
- SHA-256: `f848f8a0b3afb2447317604dd9cd88b87b9b4a3f1ba66014c505d9282f5fc6c0`
- First recorded local development load: resource read 254.3 ms; model ready 2,993.7 ms after navigation; first render 3,050.0 ms after navigation
- Warm-cache local development load: resource read 97.1 ms; model ready 1,254.2 ms; first render 1,257.0 ms
- A separate warm-cache observation reached 35.4 ms resource read and 1,011.2 ms first render.
- Fresh renderer memory indicators: 66 geometries and 5 textures. Repeated HMR navigation in the long-lived review renderer rose to 232–233 geometries and 21 textures because cached GLTF/dev resources from prior scene versions remained resident; a clean reload returned to the fresh baseline.

The first-render timestamp is the closest trustworthy room-interactive proxy currently available. GPU memory bytes and GPU timer-query data were not claimed because the runtime does not expose reliable values for them.

## Scenario metrics

| Scenario | Avg FPS | Avg frame | p95 frame | Draw calls | Triangles | Geometries | Textures | Duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A — idle hero | 60.00 | 16.67 ms | 17.60 ms | 52.00 | 466,986 | 66 fresh / 232 HMR | 5 fresh / 21 HMR | 8.02 s |
| B — camera movement to Reactor | 54.86 | 18.23 ms | 17.40 ms | 45.02 | 460,660 | 233 HMR | 21 HMR | 8.19 s |
| C — Reactor close-up | 60.01 | 16.66 ms | 17.60 ms | 44.01 | 460,504 | 232 HMR | 21 HMR | 8.02 s |
| D — energy inactive | 60.01 | 16.66 ms | 17.60 ms | 52.00 | 466,986 | 232 HMR | 21 HMR | 8.02 s |
| E — reduced motion | 60.01 | 16.67 ms | 17.30 ms | 52.00 | 466,986 | 232 HMR | 21 HMR | 8.02 s |

Scenario D used the browser runtime without an available Bitcoin Core connection, so both energy spill lights were truthfully off. The actual Tauri screenshot run used an isolated regtest node at block 101 and verified the connected/ready presentation without injecting client-side state.

## Observed stalls

- Asset parsing and initial shader preparation dominate the first load (about 3.05 s first observed, about 1.01–1.26 s warm).
- The camera-movement window contains a short first-transition/visibility hitch: average FPS fell to 54.86 while p95 remained 17.40 ms. The normal frame population stayed at the 60 Hz budget.
- No persistent garbage-collection spikes or React rerender storm was observed.
- GLTF scene, geometry, and runtime materials are memoized. Ordinary Bitcoin state updates mutate only energy materials/lights and the CanvasTexture-backed console.
- MeshPhysicalMaterial transmission initially doubled work to about 100 calls and produced about 42 FPS. ER-09 therefore uses deterministic alpha glass with `transmission = 0`, restoring 60 FPS and 52 calls.
- Repeated HMR changes retain Drei/useGLTF development cache entries. This is a development-session accounting risk, not a clean-load production leak; it remains worth rechecking in ER-11.

## Legacy comparison

The same long-lived development renderer measured legacy idle at 5.25 FPS, 190.55 ms average frame time, 195.30 ms p95, 747 calls, 244,318 triangles, 403 geometries and 19 textures. The ER-09 production candidate measured 60.00 FPS, 16.67 ms average, 17.60 ms p95, 52 calls and 466,986 triangles on its fresh idle sample.

The comparison is intentionally transparent: the legacy scene keeps its existing DPR range up to 1.5, while ER-09 uses DPR 1. The production candidate renders more triangles but dramatically fewer calls and sustains the project target on the tested M1.

## Compression decision

No Meshopt, Draco, or KTX2 stack was added. The uncompressed baseline is preserved byte-for-byte so ER-10/ER-11 can evaluate visual fidelity, package size, parse cost and memory from a stable source. Compression remains optional follow-up work if later package/load targets justify loader complexity.
