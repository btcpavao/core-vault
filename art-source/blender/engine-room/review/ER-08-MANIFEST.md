# ER-08 — Manifest

## Status

`ER-08 PASS`

Blender: 5.2.0 LTS, build hash `fbe6228777e7`.

## Zaključani izvor

- Putanja: `art-source/blender/engine-room/engine-room.blend`
- Odobreni i završno potvrđeni SHA-256: `7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648`
- Veličina: 3.213.062 B
- Status: neizmijenjen

## Runtime izvedenica

- Putanja: `art-source/blender/engine-room/runtime/engine-room-runtime.blend`
- SHA-256: `9cbed2e9168cdf35f81321cc7a8f56ccb23c8c63b5c3693dc5f3ce8c97b0d2d1`
- Veličina: 8.144.240 B
- Source metadata pokazuje na zaključani master i njegov odobreni hash.
- `CV_HeroCamera`: 38 mm, pozicija `(-0.25, -13.5, 2.1)`, target rotacija potvrđena bez odstupanja.

## Kandidat GLB

- Putanja: `art-source/blender/engine-room/runtime/exports/cv_engine_room_er08_candidate.glb`
- SHA-256: `f848f8a0b3afb2447317604dd9cd88b87b9b4a3f1ba66014c505d9282f5fc6c0`
- Veličina: 18.853.768 B
- Format: glTF 2.0 binary, samostalan GLB

## Reproducibilne skripte

| Skripta | SHA-256 |
|---|---|
| `runtime/audit_er08.py` | `86b65057977b72a3064e3264622c87c05fc005a3f3c17b9770d01b5286036d39` |
| `runtime/build_er08.py` | `306000942c83b444f584cd0959cc3fda04c9499ac2562deb271b36f383577cf8` |
| `runtime/export_er08.py` | `8e7a4d0de06a8e4abd2eb487778f1211de2b129062a75b970ba7de3e41dd2902` |
| `runtime/validate_er08.py` | `6afd6b5a86afdde3f17cd3726afe2ddab82c96b4b60901d20b659e401f83c0d7` |

Reprodukcija:

```text
/Applications/Blender.app/Contents/MacOS/Blender --background art-source/blender/engine-room/engine-room.blend --python art-source/blender/engine-room/runtime/build_er08.py
/Applications/Blender.app/Contents/MacOS/Blender --background art-source/blender/engine-room/runtime/engine-room-runtime.blend --python art-source/blender/engine-room/runtime/export_er08.py
/Applications/Blender.app/Contents/MacOS/Blender --background art-source/blender/engine-room/runtime/engine-room-runtime.blend --python art-source/blender/engine-room/runtime/validate_er08.py
```

`build_er08.py` prije bilo kakve izmjene verificira path i SHA zaključanog mastera, a sprema isključivo runtime izvedenicu. Opcija `--skip-phase-a` preskače samo kontrolni Phase A render.

## Baseline i optimized metrike

| Metrika | ER-07 | ER-08 derivative | Kandidat GLB |
|---|---:|---:|---:|
| Objekti/nodeovi | 942 | 75 | 58 |
| Mesh objekti/meshevi | 894 | 50 | 50 |
| Primitive | približno 894 mesh draw proxy | 50 mesh draw proxy | 50 |
| Evaluirani verteksi | 245.132 | 235.372 | 405.635 accessor zbroj |
| Evaluirani trokuti | 486.342 | 466.962 | 466.962 |
| Materijali | 36 | 31 | 31 |
| Transparentni objekti/materijali | 14 | 2 | 2 |
| Krivulje | 28 | 0 | 0 |
| Energy objekti/guide meshevi | 33 | 6 | 6 |
| Svjetla | 13 | 11 review-only | 0 |
| Veličina | 3.213.062 B | 8.144.240 B | 18.853.768 B |

## Candidate GLB struktura

- Nodeovi: 58
- Meshevi: 50
- Primitive: 50
- Trokuti: 466.962
- Materijali: 31
- Transparentni materijali: `CV_Mat_Glass_Reactor`, `CV_Mat_Glass_Secondary`
- Teksture: 2
- Slike: 1
- Animacije: 0
- Svjetla: 0
- Vanjski URI-ji: 0
- Semantički group nodeovi i runtime objekti prisutni
- Povratni uvoz: `FINISHED`, 58 objekata, 50 mesheva, 31 materijal

## Candidate materijali

Kandidat sadrži 31 materijal:

```text
CV_Mat_Console_Enclosure
CV_Mat_Console_Trim
CV_Mat_Stone_Trim
CV_Mat_Stone_Warm
CV_Mat_Console_TechnicalStandby
CV_Mat_Energy_BlueAccent
CV_Mat_Energy_BlueCore
CV_Mat_ER06B_Energy_BlueHotCore
CV_Mat_ER06B_Energy_BlueSoft
CV_Mat_Energy_BlueSecondary
CV_Mat_ER06B_ExteriorMatte
CV_Mat_Stone_FloorLight
CV_Mat_Stone_StructureDark
CV_Mat_Vegetation_Olive
CV_Mat_Glass_Reactor
CV_Mat_Glass_Secondary
CV_Mat_Bronze_AgedDark
CV_Mat_Bronze_Machined
CV_Mat_Bronze_Main
CV_Mat_Internal_DarkSteel
CV_Mat_Internal_Machined
CV_Mat_Metal_Blackened
CV_Mat_Stone_Platform
CV_Mat_Ceiling_Deep
CV_Mat_Ceiling_WarmStructural
CV_Mat_Practical_Warm
CV_Mat_Stone_Floor
CV_Mat_Stone_JointSubstrate
CV_Mat_Stone_Recess
CV_Mat_Stone_RecessDeep
CV_Mat_Stone_PlatformTrim
```

Pet master materijala koji ne preživljavaju izvedenicu: stari `CV_Mat_Console_Screen` placeholder te četiri skrivena ER-06 exterior fallback materijala (`Sky`, `Sea`, `CoastFar`, `CoastNear`). Potpuna klasifikacija svih 36 materijala i baking plan nalaze se u `ER-08-OPTIMIZATION.md`.

## Teksturne ovisnosti

- `CV_ER06B_MediterraneanExterior`: packed, runtime-relative metadata path `//../../assets/er06b-mediterranean-exterior.png`; uključena u GLB kao bufferView, bez vanjskog URI-ja.
- `engine-room-hero-reference.png`: postoji na project-relative dokumentacijskoj putanji; review-only i nije izvezena.
- Linked libraries: nema.
- Kritične nedostajuće ovisnosti: nema.

Exterior slika je 1536 × 1024. Procijenjena GPU memorija za RGBA8 je 6.291.456 B (6,00 MiB) bez mipova, približno 8,00 MiB s punim mip lancem.

## Export opcije

- `export_format="GLB"`
- `use_selection=True`
- `export_apply=True`
- `export_extras=True`
- `export_cameras=False`
- `export_lights=False`
- `export_animations=False`
- `export_materials="EXPORT"`
- `export_image_format="AUTO"`
- `export_texcoords=True`
- `export_normals=True`
- `export_tangents=False` — kandidat nema normal-map teksture
- `export_yup=True`
- `export_attributes=False`
- `export_unused_images=False`
- `export_unused_textures=False`

## Validacija

`validate_er08.py` je prošao u Blenderu 5.2.0 LTS:

- master SHA odgovara zaključanom hashu;
- hero kamera odgovara zaključanom 38 mm framingu;
- svih devet semantičkih kolekcija postoji;
- 50 mesh objekata, 31 materijal, 11 review svjetala, 0 krivulja;
- šest odvojenih energy guide mesheva;
- dva transparentna glass objekta;
- sva tri obvezna rendera postoje;
- kandidat sadrži renderabilnu geometriju;
- nema animacija, svjetala ili vanjskih URI-ja;
- konzolni ekran, oba glass objekta i semantički nodeovi postoje;
- neutralni GLB povratni uvoz uspio je bez gubitka broja mesheva i materijala;
- završni rezultat: `CV_ER08_VALIDATION_PASS`.

## Vizualni review outputi

| Output | SHA-256 |
|---|---|
| `review/er-08-optimized-hero.png` | `5fd697d3baa1914f20a5ea12cbaa526d9e17bf0d55ea332e212ec839c9497927` |
| `review/er-08-optimized-alternate.png` | `12cae25ad08e82e8cb02145d3682ca9f5a0e319991e5597c5022996c7c325968` |
| `review/er-08-optimized-reactor-closeup.png` | `72bd318718ac9cc525fcd69f739316ec0be30dd504761c6bd04e5b7760f737f6` |
| `review/er-07-vs-er-08.png` | `0217458e53664028778086c24c47cf5136dca70209d695ef9ecfafa734421c6b` |

Ljudski pregled: hero PASS, alternate PASS, close-up PASS. Pomoćni hero SSIM: 0,976949. Nije primijenjena korekcija boje.

## Runtime/test granica

Prije ER-08 spremljen je SHA-256 baseline svih 51 datoteka u:

- `src/`
- `tests/`
- `public/assets/experience/engine-room/`

Završni popis i hashovi identični su baselineu. ER-08 nije mijenjao React, React Three Fiber, Three.js, Tauri, Rust, testove, postojeće produkcijske GLB-ove ni asset manifest. Kandidat ostaje isključivo pod `art-source/blender/engine-room/runtime/exports/`.

## PASS kriteriji

- [x] Zaključani master hash je neizmijenjen.
- [x] Runtime izvedenica je reproducibilna.
- [x] Kandidat GLB se uspješno izvozi.
- [x] Kandidat GLB prolazi strukturnu i round-trip validaciju.
- [x] Hero fidelity ostaje visok.
- [x] Alternate ostaje koherentan.
- [x] Reactor close-up ostaje prihvatljiv.
- [x] Objektna/draw-call struktura materijalno je poboljšana.
- [x] Material/baking put je definiran.
- [x] Glass strategija je definirana.
- [x] Energy runtime strategija je definirana.
- [x] Lighting runtime strategija je definirana.
- [x] Exterior runtime strategija je definirana.
- [x] Produkcijske runtime/test datoteke nisu promijenjene.

Preporučeni sljedeći korak: `ER-09 — Runtime Integration`. ER-09 nije započet.
