# Engine Room ER-04 Review Manifest

**Production stage:** ER-04 — Material Match  
**Generated with:** Blender 5.2.0 LTS  
**Canonical camera:** `CV_HeroCamera`  
**Camera focal length:** 38 mm  
**Camera position:** `(-0.25, -13.5, 2.1)` metres  
**Camera target:** `(0.10, 1.8, 1.75)` metres  
**Camera changed from ER-03:** No  
**Approved architecture/Reactor geometry changed:** No  
**Permitted material-boundary geometry added:** Two thin console screen/trim meshes  
**Source file:** `art-source/blender/engine-room/engine-room.blend`

## Canonical source

- `docs/references/engine-room/engine-room-hero-reference.png`
- 1536 × 1024 PNG
- SHA-256: `58a68d15da633133a52ce33b22e0ffd0f9552ff5f80ac4004407a6ea7d065ef5`

The canonical reference remains unmodified and registered on `CV_HeroCamera` through a repository-relative path.

## Geometry and camera preservation

- `CV_HeroCamera` retains exactly the approved 38 mm lens, position and target.
- The ER-02 architecture and ER-03 Reactor family are rebuilt from their unchanged stage functions.
- `CV_Architecture` remains at 247 objects.
- The main Reactor remains at 246 objects and the secondary chamber at 72 objects.
- Room proportions, Reactor placement, platform, architecture, console body and all major silhouettes are unchanged.
- Two thin meshes were added above the existing console placeholder: `CV_Console_ScreenTrim` and `CV_Console_ScreenSurface`. They establish plausible material boundaries without redesigning the console.
- Total scene mesh count is 571, two more than ER-03 solely because of those console boundary meshes.

## Production material families

### Architectural stone

- `CV_Mat_Stone_Warm` — primary warm limestone for major columns and masonry
- `CV_Mat_Stone_Trim` — slightly lighter carved trim, capitals and profile transitions
- `CV_Mat_Stone_StructureDark` — restrained darker structural stone
- `CV_Mat_Stone_Recess` — lower-reflectance reveal stone
- `CV_Mat_Stone_RecessDeep` — deepest architectural void material
- `CV_Mat_Stone_Platform` — Reactor platform stone
- `CV_Mat_Stone_PlatformTrim` — platform edge and profile hierarchy
- `CV_Mat_Stone_JointSubstrate` — dark joint/substrate layer beneath floor slabs
- `CV_Mat_Ceiling_WarmStructural` — warm, darker ceiling structure
- `CV_Mat_Ceiling_Deep` — near-black ceiling recess material

Stone materials use object-space three-dimensional macro noise for broad colour/roughness variation and a separate high-scale, low-amplitude pore signal feeding a Bump node. There is no displacement. Noise scales are deliberately low-frequency at room scale and remain coherent across applied object transforms.

### Floor

- `CV_Mat_Stone_Floor`
- `CV_Mat_Stone_FloorLight`

The two tightly related floor variants work with the existing individual slab geometry to create restrained neighbouring-slab variation. Their roughness range is lower than vertical limestone to suggest gentle maintenance polishing while remaining far from mirror-like marble. Physical gaps expose the dedicated joint substrate rather than relying on a fake seam texture.

### Main Reactor bronze

- `CV_Mat_Bronze_Main` — aged structural bronze for primary rings, cap mass and housings
- `CV_Mat_Bronze_Machined` — tighter, sparingly used machined bronze accents

Both are fully metallic Principled materials. Broad colour/roughness breakup remains subtle and low-frequency; a very shallow high-scale bump suggests restrained brushed manufacturing variation. The palette is intentionally dark brown-bronze with controlled warm highlights rather than yellow gold, polished brass or orange copper.

### Dark engineering metals

- `CV_Mat_Metal_Blackened` — outer structural posts, recessed base elements and selected frame layers
- `CV_Mat_Internal_DarkSteel` — subdued internal support machinery
- `CV_Mat_Internal_Machined` — limited cooler machined internal interfaces

These materials retain metallic edge reflections and controlled roughness variation. None uses flat black colour, random grunge, paint damage or corrosion.

### Technical glass

- `CV_Mat_Glass_Reactor`
- `CV_Mat_Glass_Secondary`

The existing ER-03 curved panels provide real thickness and panel separation. ER-04 glass uses a subtle cool-neutral tint, low roughness, IOR 1.47, restrained Principled transmission and alpha blending. The secondary glass is marginally darker while remaining part of the same family. Tuning preserves front reflection, internal machinery readability and visible rear-layer depth without milkiness or mirror behaviour.

### Console

- `CV_Mat_Console_Enclosure` — dark technical enclosure
- `CV_Mat_Console_Trim` — restrained bronze screen boundary
- `CV_Mat_Console_Screen` — near-black coated-glass placeholder with no emissive UI

The existing stone pedestal uses the architecture stone family. No console redesign, display UI, Bitcoin content or animation was introduced.

## Major shader decisions

- All opaque surfaces use Principled BSDF parameters aligned with base colour, metallic, roughness and normal concepts.
- Surface variation is restrained and semantic rather than random per object.
- Object-space procedural mapping avoids arbitrary filesystem dependencies and is stable for the currently applied object transforms.
- Fine stone and metal detail is Bump-only. No geometry displacement is used.
- Metal anisotropy is modest and exists only on bronze/machined families.
- No material uses emission, blue energy, particles, bloom or other effect-driven enhancement.
- Neutral utility lights exist only to reveal roughness, glass, reflections and bevel response. They are not ER-05 final lighting.

## Texture assets and provenance

No external texture image was introduced.

- Texture directory additions: none
- Third-party assets: none
- License obligations: none
- Material source: project-owned deterministic Blender node construction in `build_er04.py`
- Blender image datablocks: canonical reference plus internal Render Result/Viewer buffers only

## Real-time glTF/PBR translation notes

- Blender Noise Texture, ColorRamp, object-space coordinates and Bump node graphs do not export as equivalent procedural glTF materials. Base colour, roughness and normal results must later be baked to maintained project textures or reconstructed with a measured runtime material pipeline.
- Object-space material scale should be preserved during baking through consistent texel density; generated per-object normalization should not replace the current metric intent.
- Principled anisotropy may need approximation or extension support in the eventual glTF/Three.js path.
- Glass alpha/transmission, draw sorting, depth writing and IOR response require explicit runtime validation, especially across eight overlapping curved panels.
- Coat response on the console screen and technical glass may need approximation depending on the selected glTF extensions and renderer configuration.
- No export was attempted in ER-04; these notes identify translation work rather than claiming runtime parity.

## Blender validation

- Active scene camera: `CV_HeroCamera`
- Hero camera position: `(-0.25, -13.5, 2.1)`
- Hero camera lens: `38.0 mm`
- `CV_HeroCameraLocked`: `True`
- `CV_GeometryLocked`: `True`
- Scene production stage: `ER-04 Material Match`
- Architecture objects: 247
- Main Reactor objects: 246
- Secondary Reactor objects: 72
- Total mesh objects: 571
- Semantic `CV_Mat_*` material count: 22
- Emission shader node count: 0
- External textures: none

## Reproducible sources

- `art-source/blender/engine-room/build_er03.py` — approved ER-03 baseline — SHA-256 `dca700361b457e5ebb24973142a4ca8a62a7174c995e61273052741162503cfc`
- `art-source/blender/engine-room/build_er04.py` — SHA-256 `485836edf057833aa7becbf24da8b74f7b4f7a9ea6c6988f2cf5cdef1eeb8310`
- `art-source/blender/engine-room/build_er04_reviews.py` — SHA-256 `0fe607af11a767fde7c8e33e9ffed2d588baa5748500b7332984cea7f883e90a`
- `art-source/blender/engine-room/engine-room.blend` — SHA-256 `c7b8a2fa3c3d3634f8230302253b5d8e71f0f3d648e081e264f67de405b92140`

`build_er04.py` reconstructs the approved geometry, all production materials, review cameras and neutral material-review lighting, then writes four stage renders. `build_er04_reviews.py` assembles equal-size comparison boards with FFmpeg `hstack` and no source resizing.

## ER-04 review exports

- `art-source/blender/engine-room/review/er-04-materials-hero.png` — 1536 × 1024 PNG — SHA-256 `3fe997214092c44e7db1b3d11577d7fc029422f494f56a13e9bedd9c55873789`
- `art-source/blender/engine-room/review/er-04-materials-alternate.png` — 1536 × 1024 PNG — SHA-256 `1af60b1fd4bd6ffe978a5a9dd5bd19b322e584caec2cb41e4bb0acfc188772eb`
- `art-source/blender/engine-room/review/er-04-reactor-material-closeup.png` — 1536 × 1024 PNG — SHA-256 `c888b8fea69c144debbb1e2acfe4cd6ffee748db2f32a0cd45f4fa472c4af335`
- `art-source/blender/engine-room/review/er-04-architecture-material-closeup.png` — 1536 × 1024 PNG — SHA-256 `461592fb92b5c6d70e6a2e0510a0b3f1b918b141be2fc34d08a561a48555af53`
- `art-source/blender/engine-room/review/er-04-reference-comparison.png` — 3072 × 1024 PNG — SHA-256 `b2a55883b73955bca550e847a31cd5b7a24ea1e94143a2f8ac3a32dcdc4e8068`
- `art-source/blender/engine-room/review/er-03-vs-er-04.png` — 3072 × 1024 PNG — SHA-256 `30d5187310eda2436786eef0cc07d680f4eb6fe083b4dca6388676fb5793b43b`

## Remaining material ambiguities

- Final absolute bronze brightness is strongly affected by the unstarted ER-05 light direction and exposure; ER-04 locks the material relationship, not final colour grading.
- The reference's blue energy obscures exact internal metal/bronze boundaries. ER-04 uses a restrained dark-steel hierarchy based on visible assembly logic.
- UI overlays hide parts of the right Reactor, secondary chamber and console, so hidden finishes follow the visible family rather than asserting unknown decorative differences.
- The reference contains strong environment reflections that cannot be separated cleanly from glass tint. ER-04 prioritizes physical layered readability under neutral review lights.
- Ceiling material identity is partly ambiguous in the reference; ER-04 uses a warm, dark structural family without inventing high-frequency timber grain or unsupported ornament.

## Explicitly deferred to ER-05 or later

- Final daylight direction, exposure, practical lights, cinematic contrast and atmosphere
- Production blue energy, emissive contribution, bloom, particles, pulses and animation
- Final screen UI and application-state-driven visual behaviour
- Texture baking, glTF material translation, optimization, GLB export and runtime integration

No production blue energy or final cinematic lighting was added. No runtime file was modified and no production GLB was exported.

ER-04 stops here and is ready for human visual review. ER-05 remains gated on explicit approval.
