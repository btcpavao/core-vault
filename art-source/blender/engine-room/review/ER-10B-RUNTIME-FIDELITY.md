# ER-10b Runtime Fidelity Review

## Result

**ER-10b PASS.** ER-10 failed because the runtime had materially harder/flatter illumination than the approved ER-08 Blender baseline and because the final selective-shadow stack had no valid foreground-Tauri A-F matrix. ER-10b resolves both blockers without changing the locked Blender master, production GLB, geometry, camera envelope, runtime truth architecture, console ownership, or legacy fallback.

## Selected bounce solution

ER-10b selects one deterministic local spherical-harmonics `LightProbe` as the static environmental irradiance representation (Option C). It contains only warm architectural/environmental bounce: a warm omnidirectional base plus restrained vertical and left-to-right coefficients. It adds no texture, geometry, network resource, render target, draw call, changing blue light, or fake application state.

The final lighting responsibilities remain separate:

- two real-time directionals own the warm Mediterranean key and cool depth direction;
- one static SH probe plus the existing hemisphere own soft room-wide indirect readability;
- three local Lightformers own bronze, engineering-metal, and glass reflection response;
- two point sources and emissive materials remain exclusively state-driven Reactor energy;
- one warm directional owns the single selective 512 x 512 shadow map.

Lightmap baking was rejected because the locked GLB has no justified lightmap-UV/texture contract and the asset payload/load cost was unnecessary. Vertex-color irradiance was rejected because it would require a new runtime attribute/export derivative in the locked asset path. A per-material emissive approximation was tested and rejected because it lifted values uniformly instead of producing useful directional bounce.

## Visual improvement

Against ER-10, the final hero has materially broader architectural midtones, softer ceiling/floor gradients, more readable recesses, and less dependence on the hard warm key. The Reactor remains intentionally darker than the architecture, and the left-warm/right-cool hierarchy is preserved. Against ER-08, the runtime still lacks offline renderer microtexture, physically rich glass/refraction, and the same luminous energy volume, but the indirect-light mismatch is now a diminishing-return difference rather than a blocking identity break.

The final bronze mapper is less orange: main/dark/machined families use deeper neutral-brown values, slightly higher roughness, and restrained environment response. Stone and floor gain most of their missing richness from indirect light rather than a new detail texture. No manual color correction was applied to review comparisons.

## Material and state results

- **Bronze:** deeper body and broader midtones; machined highlights are more neutral in final hero/close-up. The earlier Tauri console capture still exposes some warm shell response, but it remains subordinate and readable.
- **Stone/floor:** shadow regions are more readable and integrated; procedural microvariation remains below ER-08, but no texture was justified.
- **Glass:** unchanged low-cost alpha/clearcoat strategy; no transmission, no sorting regression, and no extra pass. Apparent depth remains below ER-08 and is accepted.
- **Energy:** active/syncing/offline/network/reduced-motion/block-pulse ownership is unchanged. No blue state was baked. The runtime remains less volumetric than ER-08, with restrained clipping and no full-scene bloom.
- **Console:** state-driven `CanvasTexture` ownership and redraw behavior are unchanged. Evidence shows real `ONLINE`, `REGTEST`, block `101`, and `ENABLED` data.
- **Exterior:** unchanged except for the global static environmental response; it remains explicitly non-blocking.

## Formal fidelity gate

| Category | Gate | Finding |
| --- | --- | --- |
| Composition | PASS | Approved hero/secondary hierarchy is unchanged. |
| Architecture | PASS | Locked GLB and scene composition are unchanged. |
| Lighting/bounce | PASS | Broader midtones and softer architectural gradients remove the ER-10 blocker. |
| Bronze | PASS | Deeper neutral body and restrained machined response survive normal viewing distance. |
| Engineering metal | PASS | Dark layering remains distinct from bronze and glass. |
| Stone | NEEDS WORK | Still cleaner than ER-08 at close inspection; non-blocking without a new texture. |
| Floor | PASS | Bounce and selective grounding integrate the platform without flattening it. |
| Glass | NEEDS WORK | Stable and performant; offline refraction depth remains intentionally absent. |
| Energy | NEEDS WORK | Truthful and legible; ER-08 luminous volume remains an accepted offline-renderer gap. |
| Exterior | NEEDS WORK | Safe and cool, but still flatter than the Blender matte; explicitly non-blocking. |
| Console | PASS | Runtime-owned data remains readable and truthful. |
| Overall runtime identity | PASS | The intended Engine Room experience reads convincingly at normal distance. |

## Remaining accepted differences

Accepted differences are procedural stone microtexture, full physical refraction, offline compositor nuance, tiny volumetric energy detail, and photographic exterior depth. Full transmission remains rejected because the previous test measured approximately 42 FPS and roughly 100 draw calls. No bloom or post-processing stack was introduced.

## Recommendation

**PASS.** Lighting/bounce is no longer blocking, the final renderer remains inside the prescribed resource budget, and the complete foreground matrix passes. Proceed only when requested to `ER-11 — Performance Review`.
