# ER-11b — Lifecycle Addendum

This addendum references the full `ER-11-LIFECYCLE.md` audit. ER-11b did not reopen approved renderer architecture; it confirms that the valid ER-11 ownership corrections survive the final packaged artifact and a 31-minute production soak.

## Final-artifact confirmation

- Artifact: `Core Vault ER11b QA.app`
- Executable SHA-256: `883b3cdc8761e12b51ad8ed1ad10302afd0aa5d87385d8f8ea77359b2e2bbe97`
- Full ten-cycle confirmation completed because QA-only autorun instrumentation changed after ER-11.
- Lifecycle status: complete; 22 resource records.

| Counter | Final value |
|---|---:|
| Production mounts / unmounts | 12 / 11 |
| Runtime scenes built | 12 |
| Console surfaces created / disposed | 12 / 11 |
| Runtime geometries disposed | 11 |
| Runtime materials disposed | 528 |
| Environment mounts / unmounts | 1 / 0 |
| SH LightProbe mounts / unmounts | 1 / 0 |

All 22 lifecycle records were 66 geometries, 5 textures and 10 programs. The final mounted instance explains each one-count ownership difference. There was no monotonic growth or retained per-entry renderer ownership.

## 31-minute packaged soak

The mandatory soak ran continuously for 31 minutes in the final packaged WebView, foreground-active on AC power with Low Power Mode disabled. Main-process RSS moved 15,984 → 18,080 KiB with a transient 29,616 KiB midpoint peak that released by minute 20. GPU RSS moved 7,632 → 7,104 KiB, and WebContent 4,640 → 6,080 KiB. No process died and no progressive memory trend remained.

The post-soak renderer snapshot was 66/5/10. There was no context loss, recurring runtime exception, duplicated animation loop, resource-count drift or visible energy-state corruption. Raw samples are preserved in `er-11b-soak-resources.json`.

## Environment and probe ownership

Production Environment/PMREM and the deterministic SH LightProbe remained persistent Canvas-owned singletons. The ten-cycle counters stayed Environment 1/0 and LightProbe 1/0. Neither ordinary room entry/leave, Core polling, reconnect nor the real block created another environment resource.

## Console ownership

CanvasTexture ownership stayed tied to runtime-scene ownership: 12 created, 11 disposed, with the final instance intentionally mounted. Ordinary 250 ms node polling, offline/reconnect and the real block did not increment the creation counter or rebuild the scene. The console redraw path remains value-change driven rather than per-frame; no duplicate console texture was observed.

## Reconnect and real block

One final-artifact confirmation stopped and restarted only the isolated regtest Core. The packaged UI transitioned online → unknown/dormant → online. Energy and spill state followed the non-online condition, while runtime scenes remained 12 and renderer resources remained 66/5/10.

One real block advanced height 104 → 105 and pulse serial 0 → 1. The pulse returned to steady state, with no second serial increment, fake event or duplicate handler.

## Visibility/background

The final package was minimized and restored. While minimized, main/GPU/WebContent sampled at 0.0% CPU with RSS 25,184/9,712/8,720 KiB. Restore preserved the camera scenario, online Core state, block height 105, pulse serial 1, scene count and renderer resources. No duplicated render loop or resume corruption appeared.

## Difference from ER-11

No lifecycle regression was found. ER-11b adds valid uncapped AC/LPM-off performance evidence, a complete 31-minute soak and final-artifact identity continuity. The only runtime addition is a build-flagged QA autorun controller; it is inactive in normal production builds and does not alter rendering configuration or security behavior.
