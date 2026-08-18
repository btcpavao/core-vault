# Engine Room ER-01b Review Manifest

**Production stage:** ER-01b — Composition Correction Pass  
**Generated with:** Blender 5.2.0 LTS  
**Canonical camera:** `CV_HeroCamera`  
**Camera focal length:** 38 mm  
**Camera position:** `(-0.25, -13.5, 2.1)` metres  
**Camera target:** `(0.10, 1.8, 1.75)` metres  
**Room greybox dimensions:** `19.0 × 22.0 × 7.2 m`  
**Main Reactor greybox dimensions:** approximately `4.5 m diameter × 5.5 m height`  
**Reactor platform:** `9.2 m outer diameter × 0.46 m total height`

## Canonical source

- `docs/references/engine-room/engine-room-hero-reference.png`
- 1536 × 1024 PNG
- SHA-256: `58a68d15da633133a52ce33b22e0ffd0f9552ff5f80ac4004407a6ea7d065ef5`

The canonical source image remains unmodified and is attached to `CV_HeroCamera` through a repository-relative Blender camera-background path.

## Composition corrections

- Changed the hero camera from 42 mm at `(0.0, -15.5, 2.0)` to 38 mm at `(-0.25, -13.5, 2.1)` for broader architectural context and stronger foreground perspective.
- Rebuilt the left massing as a physically open side arcade with four deep arches, structural columns, a foreground pier, an exterior court, a low parapet mass, and a neutral daylight backdrop.
- Increased the room footprint from `18 × 20 m` to `19 × 22 m` and added a coherent foreground floor apron.
- Replaced the flat rear treatment with a facade assembled around three openings, each with approximately 3.6 m of real recess depth, side reveals, a ceiling reveal, and a separate back wall.
- Reduced the platform from a tall three-step stage to three low floor-integrated masses with a 9.2 m outer diameter and 0.46 m combined height.
- Preserved the main Reactor greybox vocabulary while lowering its base relationship and revising its overall height to approximately 5.5 m.
- Reduced the secondary chamber's visual dominance and moved it deeper and farther right to `(4.6, 7.0)` for reference-like occlusion and hierarchy.
- Repositioned and raised the simplified console so it sits against the open arcade layer.
- Added only neutral readability lighting for the exterior court and rear recesses; no production lighting or materials were introduced.

## Reproducible sources

- `art-source/blender/engine-room/build_er01.py` — SHA-256 `836876f9a68567aa4d6c56167bba0b02bdf8cb0422db0a9a9e298202b8e0d649`
- `art-source/blender/engine-room/engine-room.blend` — SHA-256 `da67b6d2b7e532a9ad2bbb1ef9bad51a056f7e84fffa42663f491f21e4abc68e`

The build script now reproduces the ER-01b scene and writes only ER-01b render filenames. Original ER-01 review images remain preserved.

## ER-01b review exports

- `er-01b-greybox-hero.png` — 1536 × 1024 PNG — SHA-256 `b96a988d647d7494395db78299ee5929a56207d374374c1710f2842488ea04fb`
- `er-01b-greybox-alternate.png` — 1536 × 1024 PNG — SHA-256 `f1e844c603fc80157115a6cd005cd0a11e83b3f684b723ef7613d3977f98d424`
- `er-01b-reference-comparison.png` — 3072 × 1024 PNG — SHA-256 `1370d825191e4dc7df10e26a305c9e3ff6dd1e6a3f691d5888e542a6970ae5f2`
- `er-01-vs-er-01b.png` — 3072 × 1024 PNG — SHA-256 `ee8b91faa90337449b08119530116886d51bfc535d33327841da3e0f9aa88259`

Both comparisons preserve their source renders at equal, undistorted size.

## Scope

ER-01b remains a neutral greybox correction pass. No GLB was exported, no production architecture or materials were added, and no runtime application files were changed.

ER-02 remains gated on explicit human approval.
