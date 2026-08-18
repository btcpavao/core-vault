# Engine Room Cinematic 2.5D Tauri Performance

Measured on 2026-08-18 in the packaged macOS `Core Vault Cinematic QA` Tauri WebView at the default 1240 × 820 window, Ready state, full motion. The DOM sampler reused the existing ER-09 summary and storage contract. It sampled actual `requestAnimationFrame` delivery in the Tauri WebView after a 1.5 s warm-up.

| Metric | Result |
| --- | ---: |
| Sample duration | 8,017 ms |
| Frames | 481 |
| Average FPS | 59.998 |
| Average frame time | 16.667 ms |
| Median frame time | 17 ms |
| p95 | 18 ms |
| p99 | 20 ms |
| Max | 24 ms |
| Frames over 20 ms | 4 |
| Frames over 33.3 ms | 0 |
| Frames over 50 ms | 0 |
| WebGL render calls / triangles / geometries | 0 / 0 / 0 |
| Resident cinematic state plates | 5 |
| Encoded runtime footprint | 1,830,294 bytes (1.75 MiB) |
| Estimated decoded RGBA footprint | 31,467,040 bytes (30.0 MiB) |
| Packaged Tauri process RSS observation | 24,064 KiB |

`maxTextures: 5` in the compatible sampler record denotes the five resident DOM image plates, not `WebGLRenderer.info.memory.textures`. No WebGL scene is mounted in cinematic mode. Repeated packaged opens showed no visible asset-load stall. The retained production full-3D scene remains available for comparison and keeps its historical performance evidence unchanged.

Machine-readable summary: `cinematic-performance.json`.
