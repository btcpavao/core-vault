# Engine Room Cinematic 2.5D Proof Manifest

## Representation

This proof deliberately uses one room-local scene package, not a generic 2.5D engine. Five registered full-scene WebP plates preserve one coherent photographed/rendered environment. State changes are crossfades between physical scene responses from the same composition. A small pointer parallax and a controlled Reactor-focus push-in operate on the scene plane; Reduced Motion removes both. No selective GLB was needed for this proof.

The canonical master is `engine-room-ready.webp`. The other plates are authored responses for Offline, Syncing, Network disabled, and New block. The component preloads all five local assets, maintains the same safe crop, and falls back to the retained local full-3D implementation if a presentation plate fails.

## Semantic contract

```text
NodeStatus
  -> adaptNodeStatusToEngineRoom
  -> EngineRoomVisualState
  -> deriveReactorEnergyState / deriveCinematicSceneState
  -> cinematic state plate
  -> contextual DOM NodeStatus panel
```

- Offline: inactive main and secondary energy; architecture and daylight remain.
- Syncing: stronger blue energy and believable blue response on glass, bronze, and platform.
- Ready: restrained stable blue energy.
- Network disabled: main Reactor stays active; secondary network chamber is dark.
- New block: `reduceBlockPulse` increments only after a later real block-height increase; this selects the gold plate for 1.25 s, or 0.36 s with Reduced Motion, then returns to the prior semantic plate.

`VITE_CV_CINEMATIC_QA=1` plus `VITE_CV_CINEMATIC_REVIEW_STATE` enables deterministic packaged-Tauri review evidence. It is an explicit QA-only mock input. Normal production builds do not accept this override.

## Asset provenance

All five assets were created on 2026-08-18 by human-directed OpenAI image editing through Codex from the supplied, project-owned approved reference `docs/references/engine-room/engine-room-hero-reference.png`. They are Core Vault original project-owned derivatives, contain no external stock assets, are committed locally, and require no runtime network access.

| Runtime asset | Dimensions | Bytes | Purpose |
| --- | ---: | ---: | --- |
| `public/assets/experience/engine-room/cinematic/engine-room-ready.webp` | 1672 × 941 | 387,842 | Canonical stable master scene |
| `public/assets/experience/engine-room/cinematic/engine-room-syncing.webp` | 1672 × 941 | 387,834 | Stronger blue computational activity |
| `public/assets/experience/engine-room/cinematic/engine-room-offline.webp` | 1672 × 941 | 337,190 | Dormant machine with room daylight preserved |
| `public/assets/experience/engine-room/cinematic/engine-room-network-disabled.webp` | 1672 × 941 | 358,124 | Active local Core, inactive secondary network chamber |
| `public/assets/experience/engine-room/cinematic/engine-room-new-block.webp` | 1672 × 941 | 359,304 | Short restrained gold validation response |

Total encoded footprint: 1,830,294 bytes (1.75 MiB). Estimated decoded RGBA footprint for the five preloaded plates: 31,467,040 bytes (30.0 MiB), excluding browser-internal overhead.

## Review evidence

All state screenshots are from the isolated `Core Vault Cinematic QA` packaged macOS Tauri bundle. State shots use the clearly marked deterministic QA override through the same `EngineRoomVisualState` and pulse paths; the normal live Core adapter and real block-height trigger remain unchanged.

- `cinematic-ready.png`
- `cinematic-syncing.png`
- `cinematic-offline.png`
- `cinematic-network-disabled.png`
- `cinematic-new-block.png`
- `cinematic-reactor-focus.png`
- `cinematic-ready-reduced-motion.png`
- `cinematic-ready-min-window.png`
- `reference-vs-er12a-vs-cinematic.png` — left: approved reference; centre: ER-12A; right: cinematic Tauri proof.
