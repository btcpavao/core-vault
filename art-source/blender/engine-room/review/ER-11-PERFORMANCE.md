# ER-11 — Performance Review

Decision: **FAIL**. The final package is visually faithful and lifecycle-stable, but the required performance gate was run while macOS battery Low Power Mode was enabled. Packaged WebKit was consistently capped at 30 Hz, so static views did not demonstrate approximately 60 FPS and camera movement did not demonstrate greater than 45 FPS. A clean rerun on AC power with Low Power Mode disabled is required.

## Environment

- MacBook Air `MacBookAir10,1`; Apple M1 (8-core CPU, 7-core GPU); 8 GB RAM.
- macOS 26.5.2 (25F84), Darwin 25.5.0.
- Battery power, Low Power Mode `1` during measurement.
- Tauri API 1.6.0, CLI 1.6.3, Rust crate 1.8.3, wry 0.24.12, system WebKit.
- Release app bundle `Core Vault ER11 QA.app`, identifier `com.corevault.er11.qa`.
- Logical QA window 1240 × 820, captured content 1162 × 738/768, production DPR 1.
- Isolated Bitcoin Core regtest on localhost RPC port 19443; height 101–104.

## A–F packaged matrix

Each valid sample used approximately 1.5 s warm-up and 8 s measurement. These samples were collected from the packaged release immediately before the lifecycle-only Environment ownership correction; the final artifact retains the same renderer, GLB, lighting, camera, materials and animation stack and passed visual/lifecycle rechecks.

| Scenario | FPS | Avg ms | p95 | p99 | Max | Calls | Triangles | Geo | Tex | Frames |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A idle hero | 30.001 | 33.332 | 36 | 38 | 40 | 46.651 | 408,983 | 67 | 5 | 241 |
| B first transition | 30.001 | 33.332 | 35 | 35 | 48 | 40.465 | 399,973 | 67 | 5 | 241 |
| C reactor | 30.001 | 33.332 | 34 | 35 | 35 | 40.705 | 405,407 | 67 | 5 | 241 |
| D dormant | 30.001 | 33.332 | 37 | 41 | 53 | 45.776 | 408,857 | 66 | 5 | 241 |
| E reduced motion | 29.998 | 33.336 | 34 | 40 | 41 | 45.776 | 408,857 | 66 | 5 | 240 |
| F console | 29.996 | 33.338 | 35 | 35 | 35 | 32.625 | 334,159 | 67 | 5 | 240 |

ER-10b measured 59.366–60.027 FPS on the same machine class. The packaged results form a flat 30 Hz ceiling across every workload, including reduced motion, rather than a geometry-dependent collapse. This strongly identifies OS/WebKit scheduling under Low Power Mode, but the gate requires demonstrated numbers, not an inference.

## Frame-time distribution

Median is 33 ms in all scenarios. p95 is 34–37 ms and p99 is 35–41 ms. Scenario D contained one 53 ms frame; no other scenario had a frame over 50 ms. The previous ER-10b 22–23 ms p95 observations are therefore not directly comparable under the 30 Hz cap. No repeatable severe hitch was found inside the capped distribution.

## First transition

First B: 30.001 FPS, p95/p99/max 35/35/48 ms. Warm B: 30.000 FPS, p95/p99/max 34/35/40 ms. The first-use maximum is 8 ms worse than warm but is isolated and below 50 ms; no shader warm-up implementation is justified until an uncapped rerun shows a repeatable user-visible hitch.

## Startup and asset/load

Five clean-process launches produced model-ready values 1784, 1881, 1924, 2012 and 2281 ms (min/median/max 1784/1924/2281). First rendered frame values were 1789, 1887, 1929, 2017 and 2330 ms (1789/1929/2330). These are successive process launches with warm OS filesystem cache, not cache-purged cold boots, and are comparable with ER-10b's approximately 1.97–2.09 s context.

The GLB is 18,853,768 bytes. The packaged `HEAD` probe returned `200:18853768`; Tauri did not expose meaningful resource-transfer timing, while model readiness followed resource/parse/setup by only about 5–49 ms to first frame. The current evidence does not identify the GLB as a shipping blocker.

## Soak and visibility

A five-minute packaged lifecycle soak sampled main-process RSS from 65,376 KiB down to 58,848 KiB; GPU process 12,112 to 9,408 KiB; WebContent 11,040 to 9,808 KiB with one transient 13,664 KiB sample. No context loss, recurring warning, crash or progressive growth occurred. This is positive but shorter than the recommended 30 minutes.

The production (non-QA) Canvas policy renders continuously only while visible and uses `frameloop="never"` while hidden. The sampler discards a resume delta above 250 ms. Background process samples were approximately 0% CPU and no persistent resume hitch or duplicate loop was observed. The QA package intentionally forces the performance loop while visible.

## Lifecycle, offline and real blocks

Ten deterministic enter/inspect/leave cycles produced 22 resource records. Geometries stayed 63–67, textures 3–5 and programs 4–10. Three real node stop/restart cycles transitioned online → offline/dormant → online without rebuilding the production scene. Three real regtest blocks advanced 101 → 104 and produced pulse serials 1, 2 and 3 with no duplicate subscription/timer evidence.

## Compression and chunking

No Meshopt, Draco or KTX2 experiment is justified. The release app is 16,112 KiB on disk despite the embedded 18.85 MB source GLB, startup is approximately two seconds, and compression would add loader/decode/maintenance complexity without a demonstrated user-perceived blocker.

Vite output:

- `ExperienceRoot-BA2oqk72.js`: 1,004,846 B minified; 270,481 B gzip; 221,673 B Brotli.
- `index-D9B2KTsy.js`: 283,840 B minified; 87,475 B gzip; 75,340 B Brotli.
- `index-Ch_4cfZD.css`: 129,640 B; 29,301 B gzip; 24,290 B Brotli.

The non-3D shell already lazy-loads `ExperienceRoot`, so Three.js/R3F/Drei stay in the experience chunk. Further splitting solely to silence the warning is not justified; it risks worsening first entry.

## Remaining risks / blocker

1. Re-run final packaged A–F on AC power with Low Power Mode disabled; require static approximately 60 FPS and camera safely above 45 FPS.
2. Extend the soak to 30 minutes during that rerun.
3. Repeat the final artifact timing export with a controller that keeps the WebView foreground; the current final artifact was rechecked visually and for lifecycle, while the numerical A–F run comes from the immediately preceding renderer-identical package.
4. Diagnostic legacy → production A/B switching briefly showed elevated renderer counters during environment recapture; ordinary production room re-entry is stable because the environment now belongs to the persistent Canvas.

ER-12 must not begin until these ER-11 blockers are cleared.
