# ER-11 — Lifecycle Audit

## Ten room-entry cycles

The final packaged artifact completed 10 deterministic cycles: leave, enter, inspect Reactor, inspect console, return to overview, leave, and final return. The QA harness captured 22 records.

| Counter | Final value |
|---|---:|
| Production mounts / unmounts | 12 / 11 |
| Runtime scenes built | 12 |
| Console surfaces created / disposed | 12 / 11 |
| Runtime geometries disposed | 11 |
| Runtime materials disposed | 528 |
| Environment mounts / unmounts | 1 / 0 |
| SH LightProbe mounts / unmounts | 1 / 0 |

The final mounted instance correctly accounts for each one-count difference.

Renderer ranges were 63–67 geometries, 3–5 textures and 4–10 programs, ending at 67/5/10. There was no monotonic growth.

## Cache versus leak

The GLTF loader cache intentionally keeps the approved asset resident. Per-entry scene clones receive runtime material mappings and are disposed on unmount. Stable cache residency is not classified as a leak. A genuine issue was found during instrumentation: remounting Drei `Environment` caused retained PMREM textures. The narrow correction moved the unchanged three Lightformers and deterministic SH probe to persistent Canvas ownership. Afterward, ordinary room re-entry held Environment and probe at 1/0 and texture count at a 3–5 range.

## Console, materials and energy

The network console CanvasTexture is created once per runtime scene, redraws only when displayed state changes, and has matching disposal for all 11 completed unmounts. Forty-eight runtime materials per scene were disposed (528 across 11 unmounts). Main/secondary glass and other mapped materials are not recreated on ordinary React status renders.

Energy components mutate existing objects through frame callbacks. No per-frame guide geometry or material allocation was observed. Reduced motion suppresses continuous energy motion without building a parallel material graph. The approved point lights and selective shadow remain reused within each scene ownership interval.

## React, listeners and subscriptions

Runtime-scene construction counters changed only on explicit room remounts, not on node polling updates. Offline/reconnect and real-block tests did not increment runtime-scene creation. The Core status subscription remained singular; no accumulating timers, listeners or pulse subscriptions were observed.

## Offline/reconnect and blocks

Three isolated-regtest stop/restart cycles produced truthful online → offline/dormant → online transitions without scene reconstruction. Energy and spill state followed Core availability. Three real generated blocks advanced height 101 → 104 and emitted exactly three one-shot validation-pulse serials, each returning to steady state.

## Visibility and window lifecycle

The production Canvas uses continuous rendering only while visible; hidden/background state selects `frameloop="never"`. Resume-sized RAF deltas above 250 ms are excluded from the performance sample warm-up. Background process samples were approximately 0% CPU. Restore retained camera, Core state and scene identity; no duplicate animation loop or persistent giant frame was observed. No ordinary-operation WebGL context loss occurred. Deliberate forced context loss was not performed.

## Legacy fallback

Legacy selection reduced the live renderer to 3 geometries, 1 texture and 1 program and unmounted the production runtime/environment/probe. Only the selected scene rendered. Returning to production restored the correct visual scene. Environment recapture produced transient elevated diagnostics during this development-only A/B switch; it does not occur during normal room enter/leave because production static lighting now belongs to the persistent Canvas. Legacy remains available and production default behavior was not changed.

## Soak conclusion

The five-minute package observation showed declining/stable RSS, no context loss, no recurring errors and no progressive renderer-resource growth. It is useful evidence but does not replace the recommended 30-minute uncapped rerun, which remains an ER-11 blocker.
