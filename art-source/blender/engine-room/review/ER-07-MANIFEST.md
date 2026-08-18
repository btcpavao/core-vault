# ER-07 — Blender Approval Gate Manifest

## Gate record

- Decision: `PASS`
- Validation timestamp: `2026-08-15T00:08:53+0200` (`Europe/Zagreb`)
- Blender: `5.2.0 LTS`, build hash `fbe6228777e7`
- Approved source: `art-source/blender/engine-room/engine-room.blend`
- Approved source SHA-256: `7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648`
- Canonical reference: `docs/references/engine-room/engine-room-hero-reference.png`
- Canonical reference SHA-256: `58a68d15da633133a52ce33b22e0ffd0f9552ff5f80ac4004407a6ea7d065ef5`
- Prior stage manifest: `art-source/blender/engine-room/ER-06B-MANIFEST.md`

The approved source hash is identical to the ER-07 pre-gate baseline and the ER-06b manifest. ER-07 made no intentional production-art change and did not save the `.blend`.

## Camera lock

- Object: `CV_HeroCamera`
- Focal length: `38 mm`
- Position: `(-0.25, -13.5, 2.1)`
- Approved target: `(0.10, 1.8, 1.75)`
- Target rotation error: `0.0 radians`
- Active camera at load: yes
- Render size: `1536 x 1024`

## Continuity validation

`validate_er06b.py` passed with:

- Approved base mesh objects: 571
- Approved base geometry state hash: `4181ffdf7cefed26318d42f4d8dc85850807344286459f99b4aa99081f2f066f`
- Approved materials: 23
- Approved material node/state hash: `de7d974873551c1174f00fb484779f09d2157d3d0ceae57c74f247195c03ebb4`
- ER-05 six-area-light state hash: `1749ecd043cc5c9a6b284bf92626a1214312bc9dca4135f524f4e616549f194c`
- ER-06b mesh additions: 92
- Energy structure: 24 curves, three wells, six lights
- Conduit curves: four
- Exterior matte present and packed: yes
- Editable procedural exterior fallback retained and hidden from final render: yes
- Scene flags: runtime deferred, GLB not exported, ER-07 production work not embedded into source

## Source-art metrics

The primary vertex and triangle totals use evaluated, render-visible mesh and curve geometry. Source mesh topology is recorded separately.

- Objects: 942
- Mesh objects: 894
- Render/evaluated vertices: 245,132
- Render/evaluated triangles: 486,342
- Source mesh vertices: 71,708
- Source mesh triangles: 140,018
- Materials: 36
- Lights: 13
- Curves: 28
- Energy objects: 33
- Transparency-heavy objects: 14
- Blender file size: 3,213,062 bytes

Largest individual evaluated triangle sources are the seven main energy curves at 5,380 triangles each, three secondary energy curves at 3,780 triangles each, and the lower/upper chamber seals at 3,072 triangles each.

## Dependency audit

- `CV_ER06B_MediterraneanExterior`
  - Path: `//assets/er06b-mediterranean-exterior.png`
  - External project file present: yes
  - Packed into `.blend`: yes
- `engine-room-hero-reference.png`
  - Path: `//../../../docs/references/engine-room/engine-room-hero-reference.png`
  - Project-relative file present: yes
  - Packing not required; it is an explicit review/reference dependency
- Missing critical dependencies: none
- Linked Blender libraries: none
- External cache files: none
- Movie clips: none
- External fonts: none
- Arbitrary Downloads/Desktop dependencies outside the project: none

## Reproducibility audit

- `build_er06b.py` SHA-256: `91a78d0254dc9607130f9441747be9eb60b61c8da20d7593d76a6613a844a586`
- `validate_er06b.py` SHA-256: `b86d94f2d523fb4b23b1882d122f9fa56311b17fe47a14b51c1441c324603107`
- `gate_er07.py` SHA-256: `203aa3b1c0dd531d6b4ca5a965e396dcfb319782873440ef089371e54181f919`
- `build_er07_reviews.py` SHA-256: `9832fc6944e382d162400d04326edecad35b17694ff80ea3d16fb598236c10bc`
- Full ER-06b build/validation import chain in Blender: PASS
- Project matte existence check: PASS
- Destructive rebuild over approved source: not performed
- Gate renders regenerated from the loaded approved `.blend`: PASS
- Comparison plates use source images at equal displayed dimensions with no resizing, color matching, or concealment edits

The first `gate_er07.py` reporting run exposed a JSON-only `Vector` serialization issue after all four renders had completed. The helper was corrected and the audit-only path then passed. This correction affected only the gate helper; it did not alter Blender art, cameras, settings, or rendered pixels.

## Review outputs

- `review/er-07-final-hero.png`
  - 1536 x 1024
  - SHA-256 `c46f47c8827035d7703b2cb2e0c5bd8b27e907099d7e57ec7a340121d94c122f`
- `review/er-07-final-alternate.png`
  - 1536 x 1024
  - SHA-256 `e9ad0109788e98a8b7bf8b305e71ac84090b93691e209a85d9e4e23ced7538b4`
- `review/er-07-final-reactor-closeup.png`
  - 1536 x 1024
  - SHA-256 `c19f0336823e76a5e8b1f68cd3a01f82aaf74c17a6a5d42e18313e803e5a359e`
- `review/er-07-final-exterior.png`
  - 1536 x 1024
  - SHA-256 `f6b2fe1bff9b1bce7310d853fc02478f76f21f445667b343cd9f335c2d023171`
- `review/er-07-reference-comparison.png`
  - 3072 x 1024
  - SHA-256 `d2bd57b5215e33d3ca312fac1db0af52c7e554952061625681857443dfe3493a`
- `review/er-06b-vs-er-07.png`
  - 3072 x 1024
  - SHA-256 `096ac2c493f9e03203433f673de5d6adb9fdc731d972c0b84da4812e389cd8f8`

The ER-06b and ER-07 hero PNG containers differ, but their decoded 1536 x 1024 pixel frames are identical with MD5 `fe637178cb8606a5d533ef07b8ea2359`. Therefore ER-07 introduced no visual change.

## Runtime and export boundary

- All 51 scoped files under `src`, `tests`, and `public/assets/experience/engine-room` matched the ER-07 pre-gate byte-hash baseline after validation.
- React, Three.js, Tauri, Rust, tests, and existing GLBs were not modified by ER-07.
- No production GLB was exported.
- Existing GLB hashes remain:
  - `cv_core_reactor_v1.glb`: `b0444481bc19c4f9fc41e70ae48b5d080f61254785eb8a7ca83074da191cc92e`
  - `cv_engine_room_cooling_manifold.glb`: `ac57e4c98817f3dc94dc2d285185ca4fd08c8f3b3d02ac530b715ce1bf82a7e0`

Static Blender content shows the approved hero/ready preview only. Runtime remains responsible for node, synchronization, networking, block, wallet, signing, active/inactive, animation, and console UI truth.

## Gate result

`PASS`

Recommended next step: `ER-08 — Optimization`. ER-08 was not started.
