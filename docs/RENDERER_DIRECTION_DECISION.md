# Core Vault — Renderer Direction Decision

**Status:** Active / Approved architectural direction
**Decision date:** 2026-08-18
**Scope:** Core Vault experience rendering and scene-asset production

## Decision

Core Vault adopts a **Cinematic 2.5D Scene System** as its default renderer-neutral experience model. Rooms may combine high-fidelity authored layers, depth information, semantic and lighting masks, controlled parallax, state-driven compositing, selective shaders, selective real-time geometry, audio, and contextual DOM precision UI. Three.js, React Three Fiber, Blender, glTF, and GLB remain valid tools, but none is mandatory for every room.

## Context and evidence

The previous approved direction required full real-time 3D rooms. The Engine Room vertical slice proved that the domain boundary, truthful state mapping, object interaction, accessibility bridge, packaging, and full-3D runtime are technically viable. It also showed that reaching the approved concept-art fidelity through complete authored geometry, texturing, lighting, dressing, runtime reconciliation, and repeated performance review carries unacceptable production cost and iteration time under current project constraints.

This is an implementation-direction change, not a product-vision downgrade. **The world is the interface** remains the north star. Core Vault must still feel like one calm, tactile, spatially memorable Mediterranean facility whose meaningful objects reveal truthful Bitcoin state.

## Approved scene model

A semantic scene package may conceptually provide a master scene, depth, foreground/mid-ground/background layers, object and state masks, emissive and lighting masks, ambient animation, interaction regions, controlled viewpoint movement, selective geometry, shaders, audio, and metadata. Exact formats remain open until the proof establishes them.

The durable state path is:

```text
Bitcoin / Application Domain
        ↓
Visual State Adapter
        ↓
Semantic Scene State
        ↓
Experience Renderer / Compositor
        ↓
Contextual Precision UI
```

Bitcoin Core remains authoritative. The renderer does not own wallet or cryptographic state, call arbitrary RPC, or invent success. Ambient motion and Bitcoin-driven state remain explicitly separate.

## Integrated-scene requirement

A 2.5D scene must behave and appear as one authored visual environment. All visible world elements must belong to the same perspective, material, lighting, atmosphere, and composition. State changes must affect the semantic object already present in the scene through believable emissive, reflected-light, glass, conduit, mechanical, or other integrated responses.

Still prohibited:

- static artwork used as wallpaper behind generic cards;
- unrelated SVG or vector glow placed over concept art;
- arbitrary invisible hotspots without semantic or accessible object identity;
- floating labels and panels visually disconnected from the selected object;
- rebuilding the former DOM/CSS spatial prototype under the name “2.5D.”

## Reusable work

The existing Bitcoin/domain architecture, Tauri/Rust boundary, typed state, Visual State Adapter, Engine Room state contracts, accessibility work, performance evidence, Three.js/R3F integration, Blender sources, GLBs, materials, shaders, cameras, and production-review artifacts remain legitimate and reusable. Selective real-time geometry remains appropriate wherever it provides clear visual or interaction value.

## Required proof before scaling

The next task is one **Engine Room cinematic 2.5D Proof of Fidelity**. It must demonstrate a near-final master scene, semantic Reactor interaction, truthful offline/syncing/ready/network-disabled/new-block states, a contextual NodeStatus panel, keyboard accessibility, Reduced Motion, acceptable desktop performance, and an integrated screenshot approaching the approved reference without sticker-like overlays.

Do not build another room until this proof demonstrates that the new pipeline can reach the approved fidelity while responding truthfully to Bitcoin Core.
