# ER-06b Final Fidelity Convergence Pass

Status: complete and recommended for the ER-07 approval gate. ER-07 itself has not started.

## Scope and outcome

ER-06b is a separable Blender-only fidelity layer over the approved ER-06 scene. It preserves the hero composition and approved production assets while concentrating changes in four areas:

- Main reactor: organized ring-transition profiles, segment bridges, post collars, service tabs, brackets, paired latches, diagonal internal mounts, and capped mounting pods.
- Secondary chamber: lower-hierarchy micro-mounts, caps, and three internal transition annuli.
- Energy: 24 depth-layered curves with asymmetric paths and point-radius variation, three mechanical-level energy wells, two restrained new energy materials, and two low-energy local focus lights in addition to the four established energy lights.
- Exterior and physical integration: a packed, project-owned Mediterranean exterior matte replaces the four simplified ER-06 backdrop layers at render time; the editable procedural fallback remains in the file. Contact gaskets, arcade construction joints, and ceiling beam seats add restrained depth cues.

The console and conduit design were intentionally left at ER-06 scope. No production UI was added.

## Locked state

- `CV_HeroCamera`: 38 mm; position `(-0.25, -13.5, 2.1)`; approved target unchanged; measured rotation error `0.0` radians.
- Approved architecture, reactor, secondary chamber, scale, placement, and hero composition: unchanged.
- Approved mesh set: 571 objects, exact state hash `4181ffdf7cefed26318d42f4d8dc85850807344286459f99b4aa99081f2f066f`.
- Approved material set: 23 materials, exact node/state hash `de7d974873551c1174f00fb484779f09d2157d3d0ceae57c74f247195c03ebb4`.
- ER-05 six-area-light rig: exact state hash `1749ecd043cc5c9a6b284bf92626a1214312bc9dca4135f524f4e616549f194c`.
- Runtime, test, and existing production GLB files: all 51 scoped files match the pre-pass byte-hash baseline.
- Existing GLBs remained unchanged: `cv_core_reactor_v1.glb` hash `b0444481bc19c4f9fc41e70ae48b5d080f61254785eb8a7ca83074da191cc92e`; `cv_engine_room_cooling_manifold.glb` hash `ac57e4c98817f3dc94dc2d285185ca4fd08c8f3b3d02ac530b715ce1bf82a7e0`.
- No GLB was exported. Scene flags record `CV_GLBExported = false`, `CV_RuntimeDeferred = true`, and `CV_ER07Started = false`.

## ER-06b additions

- 92 new mesh objects under the ER-06b fidelity namespace.
- 24 energy curves, three energy-well meshes, and six energy lights in `CV_Reactor_Energy`.
- Two ER-06b energy materials and one exterior matte material. None modifies an approved material node graph.
- Four ER-06 procedural exterior meshes are retained but hidden from final renders; the packed matte is the active distant support.
- Final scene totals: 894 mesh objects and 36 materials.

## Exterior matte provenance

Generated with OpenAI ImageGen for this project and stored at `assets/er06b-mediterranean-exterior.png` (1536 x 1024, SHA-256 `91bda3ccc998167868ccbad4c901ec7f3725586d961e7030531ba49673cd9cef`). The image is packed into `engine-room.blend`.

Final generation prompt:

> Photorealistic-natural distant Blender environment matte: calm Mediterranean coastal panorama viewed from a shaded terrace, no foreground architecture, wide eye-level view, warm late-morning light, muted blue sea and sky, layered distant mountains, realistic atmospheric perspective, restrained contrast. No people, boats, buildings, text, logos, watermark, dramatic clouds, sunset, fantasy elements, or high saturation.

The image is used only as distant exterior support; all interior architecture and machinery remain authored geometry.

## Validation

`validate_er06b.py` passed in Blender 5.2.0 LTS:

- Hero camera exact: pass.
- 571 approved mesh objects unchanged: pass.
- 23 approved material graphs unchanged: pass.
- ER-05 final area lights unchanged: pass.
- ER-06b collections and 92-object fidelity layer present: pass.
- Energy structure `(24 curves, 3 wells, 6 lights)` and four ER-06 conduit curves: pass.
- Matte object present and image packed; editable fallback retained and hidden: pass.
- All eight required review outputs present: pass.
- Runtime boundary, no-GLB condition, and ER-07 boundary: pass.

## Deliverables and hashes

- `engine-room.blend` — `7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648`
- `build_er06b.py` — `91a78d0254dc9607130f9441747be9eb60b61c8da20d7593d76a6613a844a586`
- `build_er06b_reviews.py` — `8d9751ac2334ee5dcfaac1c2bf32ad1cf9599de0eb284546d2cf334fd5da0bf9`
- `validate_er06b.py` — `b86d94f2d523fb4b23b1882d122f9fa56311b17fe47a14b51c1441c324603107`
- `review/er-06b-detail-hero.png` — `fcf268b4310cee8fb295eddbec964ddd9e217050ed48fcb740680a0a83108936`
- `review/er-06b-detail-alternate.png` — `77b9f2f07f14e6306cb2d16e796a4d60bfb4f971c0c2dfd839a51fec0fdeb250`
- `review/er-06b-reactor-fidelity-closeup.png` — `15b35c00fb41f8b22318c0acaf7062d897f6f3c82b8ceb8764744fe39a334c96`
- `review/er-06b-energy-closeup.png` — `7d7f9c089ae62b900478af9e400dfef172bdb2ada36c70d19401d68741756d44`
- `review/er-06b-console-closeup.png` — `6748bff974f3357afb76ad7f3868f97e4ef7c15fbb9d163563a383ece827458d`
- `review/er-06b-exterior-depth.png` — `0c392b286859b0c42e3ba7df61a8a518e7526baa8953911fcda5c5d5995bcde2`
- `review/er-06-vs-er-06b.png` — `743c6a19082ed98902c590a6ecb6dc333bcfe7df27fc88a3c3c13d6a66f42709`
- `review/er-06b-reference-comparison.png` — `d2bd57b5215e33d3ca312fac1db0af52c7e554952061625681857443dfe3493a`

All single renders are 1536 x 1024. Both comparison plates are 3072 x 1024 and preserve the source images without resizing.

## Remaining differences from the reference

- The reference still has materially richer stone variation, surface micro-texture, bronze wear, and glass optics. ER-06b deliberately does not revise the 23 approved materials.
- Energy depth is improved through layered geometry, variable thickness, local concentration, and restrained light interaction, but it is not a full participating-media simulation and therefore remains cleaner than the reference.
- The generated exterior matte improves distant atmosphere and sea/mountain realism, but it is a single plane and does not provide parallax.
- The reference contains presentation UI and stronger photographic post-processing; both are outside this Blender pass.

## Gate recommendation

Approved for submission to the ER-07 approval gate. The Blender-side convergence is sufficient for the next human decision because all four scoped fidelity gaps improved without violating locked camera, geometry, material, lighting, runtime, or GLB boundaries. This recommendation does not constitute ER-07 implementation or final runtime approval.
