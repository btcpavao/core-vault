# Engine Room ER-02 Review Manifest

**Production stage:** ER-02 — Architectural Match  
**Generated with:** Blender 5.2.0 LTS  
**Canonical camera:** `CV_HeroCamera`  
**Camera focal length:** 38 mm  
**Camera position:** `(-0.25, -13.5, 2.1)` metres  
**Camera target:** `(0.10, 1.8, 1.75)` metres  
**Room dimensions:** `19.0 × 22.0 × 7.2 m`  
**Main Reactor placeholder:** approximately `4.5 m diameter × 5.5 m height`  
**Reactor platform:** `9.2 m outer diameter × 0.46 m total height`  
**Approved composition baseline:** ER-01b  
**Source file:** `art-source/blender/engine-room/engine-room.blend`

## Canonical source

- `docs/references/engine-room/engine-room-hero-reference.png`
- 1536 × 1024 PNG
- SHA-256: `58a68d15da633133a52ce33b22e0ffd0f9552ff5f80ac4004407a6ea7d065ef5`

The canonical image remains unmodified. It is registered on `CV_HeroCamera` through a repository-relative camera-background reference. The image informed architectural mass, depth, construction logic and proportion; it was not traced as decorative surface detail.

## Architectural match delivered

- Preserved the approved ER-01b hero camera at exactly 38 mm and `(-0.25, -13.5, 2.1)` with the same target.
- Replaced the left greybox mass with a deep, open arcade assembled from five tapered stone columns, stepped bases, capitals, four load-bearing arches, a continuous entablature, exterior apron and low parapet.
- Rebuilt all principal arches as individually modelled tapered voussoirs with real depth, small construction joints and bevelled edges.
- Replaced generic cylinders with production-scale architectural orders: plinth, moulded base, tapered shaft, neck, round capital and square abacus.
- Rebuilt the rear facade as a sill, upper masonry mass, cornice, four structural piers and three non-identical openings.
- Gave each rear opening real reveal depth, side walls, ceiling slab, a separately set-back back wall and a distinct terminal frame/void condition.
- Added a structural ceiling system consisting of a thick main slab, five deep transverse beams landing on the side supports, four secondary longitudinal beams and stepped trim at beam soffits.
- Replaced the single grey floor with a substrate and individually bevelled slab field, while maintaining a clear circulation zone around the Reactor.
- Integrated the Reactor platform into the floor with a low edge profile, a two-part front access step and retained ER-01b platform proportions.
- Added right-side wall massing, recessed bays, three tapered support columns and a continuous cornice to establish believable room enclosure.
- Replaced foreground framing cylinders with large architectural columns, wall returns and a structural header while preserving the approved occlusion pattern.
- Rebuilt the console support as a bevelled multi-stage stone pedestal; the console itself intentionally remains a placeholder.
- Integrated the secondary chamber with a dedicated clearance platform and preserved its approved ER-01b location and subordinate scale.
- Applied small, consistent bevels to architectural edges for readable scale and light response.
- Used restrained warm working material groups and utility lighting only to separate architecture during review. These are explicitly not the ER-04 lighting or ER-05 material passes.

## Meaningful Blender collections

- `CV_Architecture_Floor`
- `CV_Architecture_LeftArcade`
- `CV_Architecture_RearFacade`
- `CV_Architecture_RightSide`
- `CV_Architecture_Ceiling`
- `CV_Architecture_Foreground`
- `CV_Reactor`
- `CV_Console_Greybox`
- `CV_Cameras`
- `CV_Lights_Utility`

The final scene contains 247 objects inside `CV_Architecture` and 283 mesh objects overall. Naming remains in the established `CV_*` convention.

## Validation

- Active scene camera: `CV_HeroCamera`
- Hero camera position: `(-0.25, -13.5, 2.1)`
- Hero camera lens: `38.0 mm`
- `CV_HeroCameraLocked`: `True`
- Scene production stage: `ER-02 Architectural Match`
- Hero and alternate review renders: `1536 × 1024`
- Comparison boards: `3072 × 1024`, sources placed side by side without resizing
- Canonical source hash remains identical to ER-01b

## Reproducible sources

- `art-source/blender/engine-room/build_er01.py` — preserved as the approved ER-01b baseline
- `art-source/blender/engine-room/build_er02.py` — SHA-256 `2ccebd89dc2944273682b1f0fd8ab341e51722bf46fcee9f9b9fc993f647f440`
- `art-source/blender/engine-room/build_er02_reviews.py` — SHA-256 `12f5fda814afbc6c3cda571b0a726cd92d3c0fc7b0914f143f069e167c20300a`
- `art-source/blender/engine-room/engine-room.blend` — SHA-256 `89f55cc6e37b857a0eda51dbc0c2b871163362bcfba1917d27d49b8af6e62b92`

`build_er02.py` rebuilds the ER-02 Blender scene, saves the authoritative `.blend`, and writes both stage renders. `build_er02_reviews.py` deterministically assembles the two required side-by-side boards using FFmpeg `hstack` without scaling either input.

## ER-02 review exports

- `er-02-architecture-hero.png` — 1536 × 1024 PNG — SHA-256 `26fca4c93908b17c357105a28b97402d10a4c5bea4e4a7e72db8742f6afc83b3`
- `er-02-architecture-alternate.png` — 1536 × 1024 PNG — SHA-256 `fc463e7e551856f781b384124b532249702b63d75fa189dde4122dd63670c1bc`
- `er-02-reference-comparison.png` — 3072 × 1024 PNG — SHA-256 `f203e5694dbab6a928c71f046df59f0a0a478f1f0a0d33b2e6b1871eebd124fe`
- `er-01b-vs-er-02.png` — 3072 × 1024 PNG — SHA-256 `be217a33842b8b4ba6ffb2236f39789f5754af9a58ca79daebda9510fd3826c8`

## Assumptions and scope boundary

- The Reactor, secondary chamber and console body remain controlled placeholders from ER-01b; only their architectural interfaces were refined.
- Warm colour grouping exists solely for architectural readability and is not a final material specification.
- Lights remain utility review lights and do not establish the final illumination language.
- No micro-detail, Reactor production detailing, energy system, final lighting, final materials, GLB export or runtime integration was performed.
- Existing runtime and documentation worktree changes were left untouched.

## Remaining reference ambiguities

- The reference UI panel hides much of the right-side wall and the precise right foreground support termination; ER-02 preserves the approved ER-01b silhouette and uses a plausible column-and-recess system rather than claiming unseen ornamental precision.
- The central Reactor and secondary chamber obscure the lower rear facade, exact sill junctions and parts of the right rear opening. Their construction is therefore resolved as a coherent shared masonry system with deliberately varied depths, not as an asserted one-to-one reconstruction of hidden geometry.
- The left editorial overlay conceals parts of the exterior-facing reveals and parapet. Their thickness and support spacing are inferred from the visible arcade rhythm and ER-01b-approved openness.
- The bottom reference strip hides the closest floor boundary and parts of the platform access logic. ER-02 uses conservative slab scale and a restrained two-part access step; final concealed floor routing remains open to later review.
- Exact real-world dimensions cannot be derived from a single stylized reference image. Recorded dimensions are the approved ER-01b production contract, while secondary architectural profiles are proportional judgments rather than invented survey precision.

ER-02 stops here and is ready for human visual review. ER-03, ER-04 and ER-05 remain gated on explicit approval.
