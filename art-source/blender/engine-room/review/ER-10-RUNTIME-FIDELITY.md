# ER-10 Runtime Fidelity Review

## Result

**ER-10 FAIL.** Runtime identity, truth, geometry, fallback behavior, and test coverage remain intact, but the final visual/performance gate is not complete enough to claim convergence. The runtime is measurably and visibly changed from ER-09, yet the ER-08 comparison still shows material gaps in soft bounce, containment-glass depth, energy glow, and surface richness. The final selective-shadow stack also lacks a valid A-F performance matrix.

## Baseline

ER-09 preserved the approved composition and semantics, but its Tauri render was harder, browner, flatter, and less atmospheric than the ER-08 Blender baseline. Bronze highlights clipped orange, opaque engineering metal lost layering, alpha glass had little apparent thickness, energy read as crisp geometry, and the exterior matte had limited depth.

The locked Blender master was verified before and after work at `7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648`. The ER-09 production GLB remains unchanged at `f848f8a0b3afb2447317604dd9cd88b87b9b4a3f1ba66014c505d9282f5fc6c0`.

## Changes

- Increased production ACES exposure from `0.78` to `0.90`.
- Rebalanced the three local deterministic Lightformers, hemisphere contribution, warm key, and cool rear fill. Active-source count remains five.
- Added one 512 x 512 shadow map to the existing warm directional key. Only Reactor, secondary chamber, console, and interactive meshes cast; architecture remains receive-only to prevent the ceiling from crushing the hero.
- Deepened and roughened the centralized bronze families; separated dark and machined engineering metal; neutralized limestone/floor values and deepened recess stone.
- Strengthened low-cost alpha glass with higher opacity, environment response, clearcoat, and controlled tint. Transmission remains disabled.
- Reduced additive energy opacity and point-spill intensity to limit white clipping while preserving real active/syncing/offline ownership.
- Shifted the exterior matte toward a cooler, lower-saturation blue-grey. No depth cards were added.
- Added a fifth, safe-envelope `exterior` review stop and ER-10 Tauri capture jobs.
- Added development-only ER-10 performance export plumbing. It does not affect production runtime semantics.

No texture, shader file, post-processing pass, network HDR, geometry derivative, or replacement GLB was introduced.

## Lighting

The room is less uniformly brown than ER-09 and selective contact shadows improve floor grounding and mechanical separation. Architecture remains readable and the left-warm/right-cool hierarchy is preserved. However, ER-08 still has materially softer bounce and broader midtone gradients. The runtime key remains visibly harder, especially in the close-up. **Gate: NEEDS WORK.**

## Materials

Bronze body color is deeper and the blackened-metal distinction is clearer in hero framing. Machined highlights remain too orange in the console and some close-up angles. Stone is more neutral and readable than ER-09, but lacks the approved offline tonal variation and microdetail. No bake was accepted because its memory/performance value was not established. **Bronze: NEEDS WORK. Engineering metal: PASS. Stone/floor: NEEDS WORK.**

## Glass

The final glass remains the ER-09 alpha technique: `transmission=0`, front side, `depthWrite=false`, main/secondary opacity `0.14/0.11`, roughness `0.12/0.17`, clearcoat `1`, and environment intensity `1.90/1.62`. Internal machinery remains visible and no sorting break was observed in the five Tauri views. Perceived thickness improves slightly, but ER-08 containment depth is not recovered. **Gate: NEEDS WORK.**

## Energy

Energy still derives only from real Core state. Active, syncing, offline, independent secondary/network flow, reduced motion, and the real-block one-shot pulse remain unchanged. Final rendering uses lower-opacity additive energy (`0.68` main, `0.52` secondary), stable contract intensities `2.7/1.45`, syncing intensities `3.4/2.05`, and point spills `2.6/1.05` stable. Cyan filaments are cleaner, but the assembly still lacks ER-08 luminous depth and some internal rings clip near white. **Gate: NEEDS WORK.**

## Exterior

The matte is cooler and less saturated, and the new exterior review stop remains inside the ER-09 authored camera envelope. No card edge or unsafe composition is visible. Atmospheric depth remains flatter than ER-08, so layered cards were not justified without a measured motion/performance result. **Gate: NEEDS WORK, non-blocking.**

## Console

Console geometry and ownership were not redesigned. The existing ER-09 runtime CanvasTexture and UV correction remain truthful and readable; the final Tauri capture shows `ONLINE`, `REGTEST`, block `101`, and `ENABLED`. Its bronze shell remains too orange under the warm key but it does not compete with the Reactor. **Gate: PASS.**

## Visual gate

| Category | Result | Evidence |
| --- | --- | --- |
| Composition | PASS | Hero authority and secondary hierarchy preserved. |
| Camera | PASS | Five authored review stops; no free camera or unsafe exterior. |
| Architecture | PASS | Approved GLB composition unchanged. |
| Bronze | NEEDS WORK | Deeper body, but several warm highlights still clip orange. |
| Engineering metal | PASS | Dark layering remains readable without plastic gloss. |
| Stone | NEEDS WORK | More neutral/readable, still too clean and uniform. |
| Floor | NEEDS WORK | Better contact grounding, limited tonal variation. |
| Glass | NEEDS WORK | Stable and cheap, but insufficient apparent thickness. |
| Energy | NEEDS WORK | Truthful and cleaner, still lacks luminous volume. |
| Lighting/bounce | BLOCKING | Final result is still materially harder/flatter than ER-08. |
| Exterior | NEEDS WORK | Safe matte, limited atmospheric depth. |
| Console | PASS | Truthful, legible, state-driven. |
| Overall runtime identity | PASS | Same Engine Room, hero, and product language. |

## Accepted differences

- Physically accurate refraction and full transmission remain rejected because ER-09 measured about 42 FPS and roughly 100 calls.
- Offline compositor glow, procedural micro-roughness, and tiny generated surface detail are diminishing-return differences at normal distance.
- No network HDR, texture set, geometry expansion, or full-scene bloom was added.

## Blocking issues

1. The ER-08 gate still shows materially softer bounce and stronger glass/energy depth than the final runtime.
2. The final selective-shadow configuration was not validated through the complete A-F performance matrix. A pre-final no-shadow hero sample was 60.00 FPS, but it is not valid evidence for the final stack.

Do not begin ER-11 until these two ER-10 blockers are explicitly resolved or accepted by human review.
