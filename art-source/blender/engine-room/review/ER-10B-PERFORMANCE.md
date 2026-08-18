# ER-10b Performance Review

## Result

**ER-10b PASS.** The final indirect-light and selective-shadow stack now has a complete A-F foreground-Tauri matrix. Static views remain approximately 60 FPS and the authored camera transition remains safely above 45 FPS.

## Test environment and method

- Apple M1 development machine used for ER-09 and ER-10 work
- `Core Vault ER10B QA.app`, Tauri debug runtime / WebKit
- 1240 x 820 logical window; production DPR 1
- isolated local Bitcoin Core regtest at block 101 for A, B, C, E, and F
- D measured after stopping only that isolated node; the real read result was unavailable/unknown and Reactor energy became dormant
- final renderer: five active lights, one selective 512 x 512 shadow map, no post-processing pass
- sampler contract: 1.5 s warm-up plus approximately 8 s measured sample
- Computer Use repeatedly addressed the registered QA `.app` throughout each sampling interval, keeping it foreground-active
- in-app compile-time QA controls selected A-F, remounted the sampler, and exposed short, deterministic accessibility fields for every metric

The raw recorded values are in `er-10b-performance-foreground.json`.

## Final A-F matrix

| Scenario | FPS | Avg ms | p95 ms | Calls | Triangles | Geometries | Textures | Frames / duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A idle hero | 60.000 | 16.667 | 22 | 48.771 | 436,827 | 66 | 5 | 480 / 8,000 ms |
| B camera transition | 59.366 | 16.845 | 18 | 43.248 | 429,200 | 67 | 5 | 476 / 8,018 ms |
| C Reactor close-up | 59.998 | 16.667 | 18 | 43.073 | 430,203 | 67 | 5 | 481 / 8,017 ms |
| D node unavailable / energy dormant | 59.998 | 16.667 | 18 | 48.674 | 435,919 | 66 | 5 | 481 / 8,017 ms |
| E reduced motion | 59.998 | 16.667 | 23 | 48.674 | 435,919 | 66 | 5 | 481 / 8,017 ms |
| F console inspection | 60.027 | 16.659 | 22 | 34.744 | 357,282 | 67 | 5 | 481 / 8,013 ms |

Scenario G is not applicable because ER-10b adds no bloom or post-processing pass. No persistent sub-target behavior, camera hitch, GC storm, repeated shader compile, or unstable oscillation was observed. The occasional 22-23 ms p95 in static views did not lower average throughput below the static target.

## ER-09 to ER-10b comparison

ER-09 did not record F. D and E ER-09 triangle counts were not separately published, so the known idle count is shown only where appropriate.

| Scenario | ER-09 FPS | ER-10b FPS | FPS delta | ER-09 avg ms | ER-10b avg ms | ER-09 p95 | ER-10b p95 | ER-09 calls | ER-10b calls |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 60.00 | 60.000 | 0.000 | 16.67 | 16.667 | 17.6 | 22 | 52.00 | 48.771 |
| B | 54.86 | 59.366 | +4.506 | 18.23 | 16.845 | 17.4 | 18 | 45.02 | 43.248 |
| C | 60.01 | 59.998 | -0.012 | 16.66 | 16.667 | 17.6 | 18 | 44.01 | 43.073 |
| D | 60.01 | 59.998 | -0.012 | 16.66 | 16.667 | 17.6 | 18 | 52.00 | 48.674 |
| E | 60.01 | 59.998 | -0.012 | 16.67 | 16.667 | 17.3 | 23 | 52.00 | 48.674 |
| F | n/r | 60.027 | n/a | n/r | 16.659 | n/r | 22 | n/r | 34.744 |

The ER-10 pre-final diagnostic was 60.0027 FPS, 16.6659 ms average, 17.6 ms p95, 52 calls, 466,986 triangles, 66 geometries, and 5 textures. It remains diagnostic-only; the table above is the valid final stack.

## Shadow OFF versus ON

Both samples use static indirect ON and scenario A.

| Configuration | FPS | Avg ms | p95 ms | Calls | Triangles | Textures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Shadow OFF | 60.035 | 16.657 | 23 | 48.672 | 435,919 | 4 |
| Shadow ON | 60.000 | 16.667 | 22 | 48.771 | 436,827 | 5 |
| ON minus OFF | -0.035 | +0.010 | -1 | +0.099 | +908 | +1 |

The one 512 x 512 map has no material steady-state FPS cost. Its one runtime texture and small caster work are proportional to the visible grounding benefit, so the final selective setup is retained. Casters remain limited to the main Reactor, secondary chamber, console, and interactive meshes; architecture is receive-only.

## Static indirect cost

Both samples use shadow OFF and scenario A.

| Configuration | FPS | Avg ms | p95 ms | Calls | Triangles | Geometries | Textures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Static indirect OFF | 60.005 | 16.665 | 23 | 48.674 | 435,919 | 66 | 4 |
| Static indirect ON | 60.035 | 16.657 | 23 | 48.672 | 435,919 | 66 | 4 |

Differences are measurement noise. The SH probe adds no texture, geometry, render target, post pass, or measurable draw work.

## First load

The embedded production GLB remained 18,853,768 bytes and unchanged. One fresh-package launch and two immediate warm relaunches were recorded from the final ON/ON QA build:

| Launch | Model ready | First render |
| --- | ---: | ---: |
| Fresh package | 1,763 ms | 2,088 ms |
| Warm 1 | 1,644 ms | 1,973 ms |
| Warm 2 | 1,640 ms | 1,996 ms |

Warm first render averaged 1,985 ms. Relative to the ER-09 observations, the fresh-package sample is about 0.96 s faster than the roughly 3.05 s ER-09 cold value, while the debug/QA warm launches are about 0.71-1.00 s slower than ER-09's 1.0-1.26 s warm range. No new payload, texture, decoder, or shader file can explain that warm difference; it is retained as debug-package/QA startup evidence rather than attributed to the zero-resource SH probe.

## Resource changes and recommendation

- dynamic lights: 5 (unchanged)
- active shadow maps: 1 at 512 x 512
- new shipped textures: 0
- final runtime texture count: 5, including the shadow map
- new geometry: 0
- post passes / render targets: 0 / 0
- replacement GLB: no
- DPR: 1

**PASS.** Static and close-up views meet the approximately 60 FPS target, camera motion is 59.37 FPS and safely above 45 FPS, indirect cost is effectively zero, and shadow cost is negligible and measured.
