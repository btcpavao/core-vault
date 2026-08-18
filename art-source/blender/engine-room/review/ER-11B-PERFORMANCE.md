# ER-11b — Uncapped Packaged Performance

Decision: **PASS**. The final packaged artifact demonstrated uncapped approximately 60 FPS behavior on AC power with macOS Low Power Mode disabled, completed the mandatory 30-minute foreground soak, and retained the approved ER-10b renderer and bounded lifecycle behavior.

## Final artifact

- App: `/Users/pavao/Desktop/Core Vault/src-tauri/target/release/bundle/macos/Core Vault ER11b QA.app`
- Bundle identifier: `com.corevault.er11b.qa`
- Executable SHA-256: `883b3cdc8761e12b51ad8ed1ad10302afd0aa5d87385d8f8ea77359b2e2bbe97`
- Executable size: 16,492,032 bytes; app bundle: 16,112 KiB on disk.
- Packaged-build hashes: `dist/index.html` `df6aa28343b7c97209c750e334f115e83cbdc2961615ad93f63818ca4f92d529`; CSS `3276d4c5465eca55ec5bc3c6587915e034839db15d3fca5655b61b0ad5f77bf1`; shell JS `0a7a9dfc8722afb6363c8858da92b9e070b523685b2402b5b4ec01beade900eb`; ExperienceRoot JS `fe16b5c221c7eb5ad686bc34c9282bab7af9738d28dc5fa5ec99e9666d8b274b`.

The executable hash was fixed before the A–F run. The same executable was used for A–F, startup, soak, lifecycle, reconnect, real-block, visibility and screenshot review. No renderer code changed after this hash was recorded.

## Power state and environment

- `pmset -g batt`: `Now drawing from 'AC Power'`; battery 100%, charged.
- `pmset -g`: `lowpowermode 0`.
- Power and LPM were re-sampled at minutes 0, 5, 10, 15, 20, 25 and 30 of the soak and remained AC / `0`.
- MacBook Air `MacBookAir10,1`; Apple M1 (8-core CPU, 7-core GPU); 8 GiB RAM.
- macOS 26.5.2 (25F84), Darwin 25.5.0.
- Tauri API 1.6.0, CLI 1.6.3, Rust crate 1.8.3, wry 0.24.12, system WebKit.
- Logical QA window 1240 × 820; captured packaged window 1162 × 768; production DPR 1.
- Isolated local Bitcoin Core regtest on RPC port 19443; height 104–105 during the final confirmation.

## Uncapped packaged A–F matrix

Each foreground sample used approximately 1.5 seconds of warm-up and approximately 8 seconds of measurement. Raw frame arrays are preserved in `er-11b-performance-packaged.json` and identify the final executable hash.

| Scenario | FPS | Avg ms | Median | p95 | p99 | Max | >20 | >33.3 | >50 | Calls | Triangles | Geo | Tex | Frames | Duration ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A idle hero | 60.005 | 16.665 | 17 | 20 | 26 | 30 | 23 | 0 | 0 | 48.343 | 427,263 | 68 | 5 | 481 | 8,016 |
| B first transition | 59.873 | 16.702 | 17 | 18 | 22 | 31 | 6 | 0 | 0 | 42.502 | 424,601 | 67 | 5 | 480 | 8,017 |
| B warm transition | 60.000 | 16.667 | 17 | 18 | 19 | 28 | 1 | 0 | 0 | 43.142 | 426,739 | 67 | 5 | 480 | 8,000 |
| C Reactor close-up | 59.873 | 16.702 | 17 | 18 | 22 | 37 | 5 | 1 | 0 | 42.519 | 429,113 | 67 | 5 | 480 | 8,017 |
| D dormant energy | 59.873 | 16.702 | 17 | 23 | 29 | 34 | 33 | 1 | 0 | 49.544 | 435,019 | 68 | 5 | 480 | 8,017 |
| E reduced motion | 59.374 | 16.842 | 17 | 25 | 33 | 37 | 34 | 4 | 0 | 49.305 | 435,688 | 67 | 5 | 476 | 8,017 |
| F console inspection | 59.800 | 16.722 | 17 | 26 | 30 | 35 | 34 | 1 | 0 | 34.699 | 356,388 | 68 | 5 | 479 | 8,010 |

Static views are approximately 60 FPS and the packaged camera transition is safely above the required 45 FPS. The ER-11 flat 30 Hz ceiling is absent under the valid AC / LPM-off environment. No sampled frame exceeded 50 ms.

## First transition and shader warm-up

First B versus warm B was 59.873 versus 60.000 FPS, p95 18/18 ms, p99 22/19 ms, maximum 31/28 ms, frames above 33.3 ms 0/0 and frames above 50 ms 0/0. The three-millisecond maximum difference is neither repeatable nor user-visible. **No shader warm-up required.**

## Startup

Five clean-process launches of the same executable produced:

| Launch | Model ready ms | First render ms | Note |
|---:|---:|---:|---|
| 1 | 1,264 | 1,266 | nominal |
| 2 | 1,318 | 1,319 | nominal |
| 3 | 1,350 | 1,351 | nominal |
| 4 | 1,601 | 4,034 | foreground-controller delay after model readiness |
| 5 | 1,216 | 1,219 | nominal |

Model-ready min/median/max is 1,216/1,318/1,601 ms. First-render min/median/max is 1,219/1,319/4,034 ms. Four nominal first renders are 1.219–1.351 seconds; the 4.034-second sample is accurately retained as a controller/foreground-delay outlier. These are successive process launches with normal OS cache state, not filesystem-cache-purged cold starts. First render is the available room-interactive proxy.

## 30-minute soak

The same final packaged artifact ran continuously in the foreground for 31 minutes, satisfying the 30-minute gate. Configuration was the normal production Engine Room with isolated regtest connected, hero view for most of the run and occasional authored transitions. A nearby foreground hero sample was 59.497 FPS over 8.034 seconds (p95 20 ms, p99 31 ms, max 48 ms). No progressive FPS degradation was observed.

Process RSS samples, in KiB:

| Minute | App | GPU | WebContent | AC | LPM |
|---:|---:|---:|---:|---|---:|
| 0 | 15,984 | 7,632 | 4,640 | yes | 0 |
| 5 | 16,800 | 7,136 | 4,960 | yes | 0 |
| 10 | 22,896 | 11,072 | 9,440 | yes | 0 |
| 15 | 29,616 | 11,264 | 9,440 | yes | 0 |
| 20 | 17,248 | 7,648 | 5,488 | yes | 0 |
| 25 | 18,128 | 7,104 | 6,672 | yes | 0 |
| 30 | 18,080 | 7,104 | 6,080 | yes | 0 |

The midpoint peak released by minute 20 and all three processes remained bounded through minute 30. There was no process death, WebGL context loss, recurring runtime error, duplicate loop or state drift. The post-soak renderer snapshot was 66 geometries, 5 textures and 10 programs.

## Resource and lifecycle confirmation

Because QA-only runtime instrumentation changed after ER-11, the final artifact repeated the full ten-cycle test rather than the minimum short confirmation. Twenty-two records stayed exactly 66 geometries, 5 textures and 10 programs. Production mounts/unmounts ended 12/11, runtime scenes 12, console surfaces created/disposed 12/11, runtime geometries disposed 11 and runtime materials disposed 528. Environment and SH LightProbe stayed singleton at 1/0 each. The one-count ownership differences are the intentionally mounted final room.

One isolated-Core stop/restart produced online → unknown/dormant → online. Resource and scene-construction counters did not change. One real regtest block advanced height 104 → 105 and pulse serial 0 → 1 exactly once. Minimized main/GPU/WebContent processes sampled at 0.0% CPU; restore preserved scenario, Core state, height, pulse serial and 66/5/10 resources.

## Compression and chunking

The production GLB remains 18,853,768 bytes. Startup is normally about 1.2–1.35 seconds and no parse/load or package-size blocker appeared. **No compression stack justified.**

The shell already lazy-loads ExperienceRoot. The packaged ExperienceRoot chunk is approximately 1,014.90 kB minified / 276.07 kB gzip; splitting only to remove the Vite warning would add complexity without demonstrated product benefit. **No additional chunk splitting justified.**

## Remaining risks

- macOS may intentionally cap packaged WebKit near 30 Hz on battery with Low Power Mode enabled; that is retained as environmental diagnostic evidence, not a product defect.
- One startup sample includes a 2.4-second post-model foreground-controller delay; it did not reproduce in the other four canonical samples and is not attributed to model parsing or renderer setup.
- Periodic soak RSS is complete; renderer counters were captured after the soak and across the full lifecycle rather than at every five-minute process sample.

No ER-11b shipping blocker remains.
