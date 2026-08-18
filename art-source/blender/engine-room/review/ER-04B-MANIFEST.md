# Engine Room ER-04b Review Manifest

**Produkcijska faza:** ER-04b — Material Refinement Pass  
**Generirano s:** Blender 5.2.0 LTS  
**Kanonska kamera:** `CV_HeroCamera`  
**Žarišna duljina:** 38 mm  
**Pozicija kamere:** `(-0.25, -13.5, 2.1)` metara  
**Cilj kamere:** `(0.10, 1.8, 1.75)` metara  
**Kamera promijenjena u odnosu na ER-04:** Ne  
**Odobrena arhitektura/Reactor geometrija promijenjena:** Ne  
**Utility review rasvjeta promijenjena u odnosu na ER-04:** Ne  
**Izvorna datoteka:** `art-source/blender/engine-room/engine-room.blend`

## Kanonska referenca

- `docs/references/engine-room/engine-room-hero-reference.png`
- 1536 × 1024 PNG
- SHA-256: `58a68d15da633133a52ce33b22e0ffd0f9552ff5f80ac4004407a6ea7d065ef5`

Referenca nije mijenjana. I dalje je registrirana na `CV_HeroCamera` putem putanje relativne repozitoriju.

## Što je točno mijenjano

ER-04b mijenja samo node graphove materijala i semantičku raspodjelu postojećih brončanih materijala. Nisu uvedeni novi volumeni, mesh elementi ni promjene transformacija.

### Topli mediteranski vapnenac

- `CV_Mat_Stone_Warm`
- `CV_Mat_Stone_Trim`
- `CV_Mat_Stone_StructureDark`
- `CV_Mat_Stone_Recess`
- `CV_Mat_Stone_RecessDeep`
- `CV_Mat_Ceiling_WarmStructural`
- `CV_Mat_Ceiling_Deep`

ER-04 osi-poravnati signal zamijenjen je neaksijalno rotiranim object-space koordinatama, blagim domain warpom i dvjema nekomensurabilnim makro Noise skalama. Tonalni raspon je smiren i manje zasićen, ali širi preko velikih ploha. Mikrostruktura koristi dva tiha pore signala samo za vrlo plitak Bump; nema displacementa, pukotina, grunge sloja ni high-frequency cluttera.

Svi čvorovi imaju jasna `CV_*` imena i razdvojene uloge za koordinate, makro ton, roughness i mikro bump. Preostala uska linearna očitanja na pojedinim cilindričnim stupovima potječu od već odobrenih facet normala osnovnog mesha, a ne od vertikalno mapirane teksture; nisu korigirana jer je geometrija zaključana za ovaj pass.

### Kameni pod i platforma

- `CV_Mat_Stone_Floor`
- `CV_Mat_Stone_FloorLight`
- `CV_Mat_Stone_JointSubstrate`
- `CV_Mat_Stone_Platform`
- `CV_Mat_Stone_PlatformTrim`

Postojeće odvojene ploče zadržavaju fizičke fuge i tamnu joint podlogu. Dvije blisko povezane limestone varijante sada kombiniraju široku neponavljajuću makro promjenu s vrlo slabim `Object Info > Random` utjecajem, pa susjedne ploče više nisu savršeno uniformne. Roughness i bump raspon ostaju kontrolirani da pod ne postane glavni fokus.

### Reactor bronca i tehnički metali

- `CV_Mat_Bronze_Main` — tamna aged structural bronca, metallic 1.0
- `CV_Mat_Bronze_AgedDark` — nova tamnija podobitelj za postojeće recessed/structural bronze dijelove, metallic 1.0
- `CV_Mat_Bronze_Machined` — kontrolirani machined naglasci, metallic 1.0
- `CV_Mat_Metal_Blackened`
- `CV_Mat_Internal_DarkSteel`
- `CV_Mat_Internal_Machined`

Brončana paleta pomaknuta je iz bakreno-narančaste prema dubljoj, manje zasićenoj smeđoj bronci. Makro tonalna razlika je šira, roughness razdvaja structural, aged-dark i machined obitelji, a manufacturing bump je smanjen. Nova `CV_Mat_Bronze_AgedDark` dodijeljena je samo postojećim structural ringovima, base anchor blokovima i odabranim cap/base plohama; mesh podaci i silueta nisu mijenjani.

### Tehničko staklo

- `CV_Mat_Glass_Reactor`
- `CV_Mat_Glass_Secondary`

Postojeći zakrivljeni paneli zadržavaju fizičku debljinu. ER-04b dodaje facing-kontrolirani alpha raspon za snažniju rubnu prisutnost i čitljiviju prednju/stražnju separaciju, cool-neutral tint, IOR 1.47, transmission 0.62 te vrlo uzak mikro-roughness raspon. Unutrašnjost ostaje vidljiva; nema zamućenja, jake plave boje, emisije ni lažnog glowa.

### Konzola

- `CV_Mat_Console_Enclosure`
- `CV_Mat_Console_Trim`
- `CV_Mat_Console_Screen`

Konzola je samo blago usklađena s tamnijom metalnom hijerarhijom. Zaslon ostaje pasivan, taman, bez UI sadržaja i bez emisije.

## Što nije mijenjano

- `CV_HeroCamera`, njezina leća, pozicija i cilj
- ER-02 arhitektura i ER-03 main/secondary Reactor mesh geometrija
- proporcije, silueta, platforma, konzolni volumeni i raspored scene
- četiri ER-04 review kamere
- svih pet ER-04 utility material-review svjetala, uključujući poziciju, snagu, veličinu i boju
- runtime, Three.js, React, Tauri, asset loading i testovi
- postojeći runtime GLB-ovi
- kanonska referenca

ER-05 nije započet. Nema finalnog cinematic lighting passa, plave energije, emissive geometrije, blooma, post-processinga, čestica ni animacije.

## Geometrija i kamera

- `CV_Architecture`: 247 objekata
- glavni `CV_Reactor`: 246 objekata
- `CV_Reactor_Secondary`: 72 objekta
- ukupno mesh objekata: 571
- semantički `CV_Mat_*` materijali: 23
- `ShaderNodeEmission` čvorovi: 0
- aktivna Principled emisija: 0
- default `Cube`, `Cylinder`, `Material` ili `Collection` nazivi: 0

ER-04b se reproducira pozivom istih ER-04 arhitektonskih i ER-03 Reactor build funkcija. Jedina naknadna objektna operacija je zamjena material slota na odabranim postojećim brončanim objektima.

## Bake i glTF/runtime napomene

### Base color i roughness

- Blender Noise Texture, ColorRamp, Vector Rotate, domain warp i Object Info Random ne izvoze se kao ekvivalentni glTF procedurali.
- Limestone, floor, platform i metalni baseColor/roughness rezultati trebaju se bakeati u održavane projektne teksture uz dosljedan texel density.
- Floor `Object Info > Random` mora se fiksirati u bakeu po ploči ili rekonstruirati determinističkim runtime atributom; inače će slab-to-slab varijacija nestati.

### Normal/bump izvori

- Limestone i floor koriste dva object-space Noise signala za vrlo plitak pore Bump.
- Bronze i engineering metal koriste zaseban high-scale manufacturing Noise za plitak Bump.
- Nema geometry displacementa.
- Bump rezultat treba bakeati u tangent-space normal mapu. Bake treba provjeriti na svim primijenjenim skalama i zakrivljenim Reactor površinama.

### Metal i anisotropy

- Metalnost glavne, aged-dark i machined bronze iznosi 1.0.
- Principled anisotropy neće nužno imati identičan glTF/Three.js rezultat; treba je aproksimirati, bakeati gdje je opravdano ili koristiti podržanu ekstenziju/runtime shader.

### Staklo i transmission

- Facing-kontrolirani edge alpha nije standardni glTF export rezultat i treba se ponovno izgraditi u runtime shaderu ili aproksimirati Fresnel/transmission postavkama.
- `KHR_materials_transmission`, IOR, alpha blend, depth writing i sortiranje moraju se validirati u ciljnom Three.js rendereru.
- Poseban rizik su preklapajući prednji i stražnji slojevi osam glavnih i šest sekundarnih zakrivljenih panela.
- Mikro-roughness se može bakeati ili zamijeniti mjerenom konstantom; panel debljinu treba zadržati u geometriji.

U ER-04b nije izvođen GLB. Ovo su pripremne produkcijske napomene, ne tvrdnja o runtime paritetu.

## Asseti i podrijetlo

- Vanjske teksture: nema
- Third-party asseti: nema
- Licencne obveze: nema
- Materijalni izvor: projektni, deterministički Blender node graphovi u `build_er04b.py`
- Blender image datablockovi nakon ponovnog učitavanja: samo kanonska referenca

## Reproducibilni izvori

- `art-source/blender/engine-room/build_er03.py` — SHA-256 `dca700361b457e5ebb24973142a4ca8a62a7174c995e61273052741162503cfc`
- `art-source/blender/engine-room/build_er04.py` — SHA-256 `485836edf057833aa7becbf24da8b74f7b4f7a9ea6c6988f2cf5cdef1eeb8310`
- `art-source/blender/engine-room/build_er04_reviews.py` — SHA-256 `0fe607af11a767fde7c8e33e9ffed2d588baa5748500b7332984cea7f883e90a`
- `art-source/blender/engine-room/build_er04b.py` — SHA-256 `75567db4b21dfee7402d30792e274ba52de455ecb7de0a7c7773961aa2aeca64`
- `art-source/blender/engine-room/build_er04b_reviews.py` — SHA-256 `63cb797d1565423b15b1821c17e1f559dd000b86b83653934ce820d69784fbe5`
- `art-source/blender/engine-room/validate_er04b.py` — SHA-256 `b08730efd55e1fc8885ccddadd8d2963bb0ebeb2b46013adce45b19d37405196`
- `art-source/blender/engine-room/engine-room.blend` — SHA-256 `449e258842ea574f5f575002864fc1f25fdcb64fb32bfb76151b9f93d697beb0`

Rebuild:

```bash
cd art-source/blender/engine-room
/Applications/Blender.app/Contents/MacOS/Blender --background --python build_er04b.py
python3 build_er04b_reviews.py
/Applications/Blender.app/Contents/MacOS/Blender --background engine-room.blend --python validate_er04b.py
```

## ER-04b review izlazi

- `er-04b-materials-hero.png` — 1536 × 1024 — SHA-256 `534497424129064b1261f99de9c460b0f14b08e3fa774b7b680d74e2fac1660c`
- `er-04b-materials-alternate.png` — 1536 × 1024 — SHA-256 `5e6affcef213dc44bd12e9f7f520d84f47ef040a37c662f1229f3873cc92286c`
- `er-04b-reactor-material-closeup.png` — 1536 × 1024 — SHA-256 `7c962467ef2be1fcf249d9ac36ac05f403d7e6faeef5d8688cf65c13aa684f6a`
- `er-04b-architecture-material-closeup.png` — 1536 × 1024 — SHA-256 `83b8db06e34225f14e0cd8c57d82d0200a9f75bed509773bdf17e1d10b5b6e6a`
- `er-04b-reference-comparison.png` — 3072 × 1024 — SHA-256 `e139d804e618eeaa114d1df258bfd05c31f44331dd152c650bd53a661767f7c3`
- `er-04-vs-er-04b.png` — 3072 × 1024 — SHA-256 `408418f2a1b357102d33f1af023188b6a0943a105021426daf77fdd247623db9`

## Runtime i GLB kontrola

Hash usporedba 51 datoteke u `src/`, `tests/` i `public/assets/experience/engine-room/` jednaka je stanju na početku ER-04b zadatka.

- `cv_core_reactor_v1.glb` — nepromijenjen — SHA-256 `b0444481bc19c4f9fc41e70ae48b5d080f61254785eb8a7ca83074da191cc92e`
- `cv_engine_room_cooling_manifold.glb` — nepromijenjen — SHA-256 `ac57e4c98817f3dc94dc2d285185ca4fd08c8f3b3d02ac530b715ce1bf82a7e0`
- Novi produkcijski GLB: nije eksportiran

## Preostale nejasnoće i gate za ER-05

- Konačna apsolutna svjetlina bronze i staklene refleksije i dalje ovise o budućem, još nezapočetom ER-05 lighting passu.
- Referentna plava energija djelomično skriva unutarnje materijalne granice; ER-04b ne izmišlja skrivene detalje.
- Odobrene cilindrične facet normale mogu još stvarati uska linearna očitanja u ekstremnom arhitektonskom close-upu; nisu mijenjane jer bi to prešlo zaključanu geometrijsku granicu ovog passa.
- Prije ER-05 potreban je ljudski vizualni pregled ovog review seta i eksplicitno odobrenje materijalnog gatea.

ER-04b ovdje završava. ER-05 nije započet.
