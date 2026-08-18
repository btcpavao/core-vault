# ER-10 Performance Review

## Result

**Performance gate incomplete; ER-10 FAIL.** The final fidelity stack must not inherit ER-09 numbers by assertion.

## Test environment

- Apple M1 development machine used for ER-09 and ER-10 work
- Core Vault Tauri debug runtime, WebKit renderer
- 1240 x 820 window, 1240 x 788 captured WebGL canvas, production DPR 1
- Local isolated Bitcoin Core regtest, block height 101 for final captures
- Production scene flag enabled, legacy fallback retained
- Same ER-09 sampler contract: 1.5 s warm-up, 8 s sample

The in-app browser produced one valid pre-final static sample. Subsequent browser DOM access was denied by the host security policy. A development-only Tauri exporter was then added, but background-window throttling and a lost WebGL context prevented a trustworthy final A-F dataset. The failure is recorded rather than replaced with inferred values.

## ER-09 baseline versus final ER-10

`n/v` means no valid final measurement. ER-09 values are the approved M1 development baseline, not a hardware-general claim.

| Scenario | ER-09 FPS | ER-10 FPS | FPS delta | ER-09 avg ms | ER-10 avg ms | ER-09 p95 ms | ER-10 p95 ms | ER-09 calls | ER-10 calls | Texture delta | Gate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A idle hero | 60.00 | n/v | n/v | 16.67 | n/v | 17.60 | n/v | 52 | n/v | n/v | BLOCKED |
| B camera movement | 54.86 | n/v | n/v | 18.23 | n/v | 17.40 | n/v | 45.02 avg | n/v | n/v | BLOCKED |
| C Reactor close-up | 60.01 | n/v | n/v | 16.66 | n/v | 17.60 | n/v | 44.01 avg | n/v | n/v | BLOCKED |
| D energy inactive | 60.01 | n/v | n/v | 16.66 | n/v | 17.60 | n/v | 52 | n/v | n/v | BLOCKED |
| E reduced motion | 60.01 | n/v | n/v | 16.67 | n/v | 17.30 | n/v | 52 | n/v | n/v | BLOCKED |
| F console inspection | not recorded | n/v | n/v | not recorded | n/v | not recorded | n/v | not recorded | n/v | n/v | BLOCKED |

Scenario G is not required because ER-10 introduced no bloom or post-processing.

## Valid diagnostic sample

Before the final shadow pass, the warmed offline hero produced:

| FPS | Average ms | p95 ms | Calls | Triangles | Geometries | Textures |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 60.0027 | 16.6659 | 17.6 | 52 | 466,986 | 66 | 5 |

This confirms that the material, environment, alpha-glass, energy, and exposure changes alone had no measurable steady-state cost. It must not be presented as the final selective-shadow result.

## First load

- ER-09 documented cold first render: about 3.05 s.
- ER-09 documented warm first render: about 1.0-1.26 s.
- ER-10 pre-final warmed observation: 1.8855 s first render, 1.8817 s model ready, 87.9 ms GLB resource duration.

The warm delta is approximately +0.63 to +0.89 s relative to the ER-09 warm range, but the observation is development-noise-prone and was not repeated as a cold/fresh distribution. No asset payload, texture count, or GLB changed, so no asset-size cause was introduced by ER-10.

## Resource changes

- New textures: 0
- New geometry: 0
- Replacement GLB: no
- New shader files: 0
- Post-processing passes: 0
- Light count: still 5
- New shadow resource: one 512 x 512 map on the existing warm directional light
- Shadow casters: main Reactor, secondary chamber, console, interactive meshes only

The shadow pass can add render calls even though scene geometry and textures are unchanged. Its final draw-call/FPS cost is unverified and therefore blocks PASS.

## Observed stalls and lifecycle notes

- No hitch or GC issue was observed during the five final Tauri capture transitions.
- The host browser denied further local DOM inspection after the first valid sample.
- A foreground-less raw Tauri debug process throttled requestAnimationFrame; a temporary app wrapper later lost its WebGL context and was rejected as a measurement source.
- These are QA harness limitations, not evidence of a production resource leak.

## Recommendation

Before ER-11, run A-F in a foreground Tauri window with the ER-10 exporter and record the final shadow-pass metrics. If static views do not remain approximately 60 FPS or movement falls below 45 FPS, remove or narrow runtime shadows before considering any further fidelity effect.
