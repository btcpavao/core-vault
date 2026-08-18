# ER-12A — Manifest i integritet

Datum: 2026-08-18

## Zaključani izvorni asseti

ER-12A nije mijenjao Blender master niti produkcijski GLB.

| Datoteka | SHA-256 |
| --- | --- |
| `art-source/blender/engine-room/engine-room.blend` | `7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648` |
| `art-source/blender/engine-room/runtime/engine-room-runtime.blend` | `9cbed2e9168cdf35f81321cc7a8f56ccb23c8c63b5c3693dc5f3ce8c97b0d2d1` |
| `public/assets/experience/engine-room/production/cv_engine_room_er09.glb` | `f848f8a0b3afb2447317604dd9cd88b87b9b4a3f1ba66014c505d9282f5fc6c0` |

## Kod i konfiguracija

- `src/experience/rooms/EngineRoom/ProductionEngineRoom.tsx`
  - production material mapping na postojeće `WORLD_TEXTURES`
  - retunirani Lightformer/SH/directional/hemisphere rig
  - poboljšano glass roughness/edge ponašanje
  - state-driven 192×192 energy glow i eksplicitni dispose
  - exterior tonal/map presentation
- `src/experience/camera/engineRoomCamera.ts`
  - retunirani hero, alternate i exterior kurirani kadrovi
- `src/experience/ExperienceRoot.tsx`
  - ER-12A deterministički capture jobovi
  - QA-only `VITE_CV_ER12A_QA_VIEW` za packaged alternate capture
  - auditabilni A–F autorun sažetak
- `vite.config.ts`
  - allowlist za četiri ER-12A runtime capture imena
- `tests/experience/productionEngineRoom.test.ts`
  - nova SH vrijednost i PBR/glow wiring assertions
- `tests/experience/camera.test.ts`
  - zaključani ER-12A hero camera brojevi
- `src-tauri/tauri.er12a.conf.json`
  - zaseban `Core Vault ER12A QA.app`, bundle id `com.corevault.er12a.qa`

## Reused project-owned resursi

- `src/experience/materials/proceduralTextures.ts`
  - 14 determinističkih DataTexture mapa
  - 512² architecture i 1024² hero rezolucije
  - base color / roughness / normal / metalness
  - Core Vault original, bez vanjskog fetchanja
- `art-source/blender/engine-room/assets/er06b-mediterranean-exterior.png`
  - već ugrađen u zaključani GLB; ER-12A mijenja samo runtime presentation parametre
- jedan novi runtime-only `CanvasTexture` od 192×192 za glow; generira se deterministički u memoriji i eksplicitno disposa.

## Packaged artifact

| Stavka | Vrijednost |
| --- | --- |
| App | `src-tauri/target/release/bundle/macos/Core Vault ER12A QA.app` |
| Executable | `Contents/MacOS/Core Vault ER12A QA` |
| Executable SHA-256 | `16e0aa570b890b3e188f59dc52fce558376d28402d8e1d6524a22ad44db1d66e` |
| Build mode | release, production Engine Room, QA autorun instrumentation |
| RPC | localhost-only regtest, cookie auth, port 19443 |

## Review outputi i SHA-256

| Datoteka | SHA-256 |
| --- | --- |
| `er-12a-runtime-hero.png` | `91e0a6f9064be3303a438dda5867279b84582da9486ca77b672acfe29bb5e71f` |
| `er-12a-runtime-alternate.png` | `53b323344e2fae20de38b97e026ee322b200b8e154734744c56965b7244fe801` |
| `er-12a-runtime-reactor-closeup.png` | `db33c0109abfaf540159e5b97492ad3e4589ff36b0520fde4478a24b6e05fb1e` |
| `er-12a-runtime-console.png` | `6d59704aa6c827a735fc10a55e6f8e2525af5b88676fbb6c9d64169309f5ac93` |
| `er-11b-vs-er-12a-packaged.png` | `d202d0ce181ba3b99593e91001ddaaa74c8b69273399918b484a1528de27102a` |
| `reference-vs-er-12a.png` | `f28e8781bc6707a82ab950d1f03f1b7503ee24b2848e8271987490b9dae67b6d` |

Upload paket `ER-12A-output.zip` sadrži sva tri izvještaja i svih šest obaveznih slika.

Usporedbe su determinističke: ER-11b/ER-12A je 1:1 horizontalni spoj dviju 1162×768 packaged snimki; reference/ER-12A skalira ER-12A na canonical 1536×1024 prije horizontalnog spajanja.

## Validation

- Fokusirani ER-12A testovi: 23/23 PASS
- `npm run verify`: PASS
- Packaged A–F: 59,87–60,04 FPS
- 10× lifecycle: complete, stabilni alternating resource rasponi
- Legacy fallback: putanja i boundary ostali netaknuti; verify assertions prolaze
- Backend/wallet/RPC implementacija: bez promjena

## Konačna odluka

- Technical/runtime gate: PASS
- Performance/lifecycle gate: PASS
- Truthfulness/regression gate: PASS
- Creative fidelity gate: FAIL
- **ER-12A: FAIL**

Razlog: vidljiv napredak nije dovoljan da trenutni pojednostavljeni GLB prostor prestane izgledati kao stilizirani clean prototype u izravnoj usporedbi s canonical reference roomom. ER-12B i ER-13 nisu započeti.
