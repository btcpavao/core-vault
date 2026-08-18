# ER-08 — Optimization

## Rezultat

ER-08 je proizveo zasebnu, reproducibilnu runtime izvedenicu i kandidat GLB bez izmjene zaključanog ER-07 mastera ili produkcijskog runtimea. Najveći dobitak je uklanjanje skupog objektnog sloja: 894 mesh objekta svedena su na 50 semantički organiziranih mesheva. Vizualni rezultat u sva tri zaključana kadra ostaje vrlo blizu ER-07.

Zaključani master prije i nakon rada ima SHA-256:

`7b4ff72e1e09cc37dd0183803d29a698330a0570a05b93180666cc71af0d0648`

## Baseline

| Metrika | ER-07 |
|---|---:|
| Objekti | 942 |
| Mesh objekti | 894 |
| Draw-call proxy / mesh objekti | 894 |
| Evaluirani verteksi | 245.132 |
| Evaluirani trokuti | 486.342 |
| Source mesh verteksi | 71.708 |
| Source mesh trokuti | 140.018 |
| Materijali | 36 |
| Transparentni objekti | 14 |
| Krivulje | 28 |
| Energy objekti | 33 |
| Svjetla | 13 |
| Blend veličina | 3.213.062 B (3,06 MiB) |

## Optimizirane metrike

| Metrika | ER-08 izvedenica | Promjena |
|---|---:|---:|
| Objekti | 75 | -92,04% |
| Mesh objekti | 50 | -94,41% |
| Draw-call proxy / GLB primitive | 50 | -94,41% prema 894 mesh objekta |
| Evaluirani verteksi | 235.372 | -3,98% |
| Evaluirani trokuti | 466.962 | -3,98% |
| Source mesh verteksi | 235.372 | nije izravno usporedivo; modifijeri su primijenjeni |
| Source mesh trokuti | 466.962 | nije izravno usporedivo; modifijeri su primijenjeni |
| Materijali | 31 | -13,89% |
| Transparentni objekti | 2 | -85,71% |
| Krivulje | 0 | -100% |
| Energy guide objekti | 6 | -81,82% prema 33 ER-07 energy objekta |
| Review svjetla u izvedenici | 11 | -15,38% |
| Svjetla u kandidat GLB-u | 0 | -100% |
| Runtime blend veličina | 8.144.240 B (7,77 MiB) | +153,47% |
| Kandidat GLB veličina | 18.853.768 B (17,98 MiB) | novo, nekomprimirano |

Povećanje `.blend` veličine je poznata zamjena: evaluirana geometrija i krivulje spremljene su kao stvarni meshevi radi determinističkog izvoza. Kandidat nije produkcijski komprimiran. Meshopt/Draco i KTX2 odluka pripada ER-09 nakon mjerenja stvarnog loadera; ovdje se ne tvrdi FPS dobitak.

## Promjene

- Statička arhitektura, Reactor, sekundarna komora, konzola i vanjski elementi spojeni su po semantičkoj grupi i materijalu.
- Modifijeri statičkih mesheva primijenjeni su u izvedenici, ne u masteru.
- Osam glavnih i šest sekundarnih staklenih panela konsolidirano je u dva objekta.
- 24 energy krivulje pretvorene su u šest odvojenih guide mesheva. Svi odobreni path pointovi ostali su sačuvani; bevel resolution je smanjen s 3 na 2.
- Četiri conduit krivulje pretvorene su u četiri zasebna mesh voda kako bi zadržale čitljivost i semantiku.
- Konzolni ekran ostao je zaseban kao `CV_Runtime_ConsoleScreen` i označen je kao runtime truth površina.
- Uklonjeni su samo konstrukcijski/nekorišteni elementi: canonical reference marker, četiri skrivena ER-06 vanjska fallback mesha i stari placeholder screen surface.
- U review rig izvedenici uklonjena su dva slabija energy focus svjetla. Preostalih 11 postoji samo radi Blender A/B rendera i nije izvezeno u GLB.
- Dodane su jasne export kolekcije i group empties; kandidat zadržava ljudski čitljiva imena.

## Vizualni tradeoffi

- Energy cijevi imaju jedan bevel korak manje; razlika se može pronaći tek namjernim close-up pregledom, bez promjene odobrene siluete i slojevitosti.
- Dva slaba focus svjetla uklonjena su, što stvara vrlo malu lokalnu promjenu plavog sjaja. Glavni, alternate i close-up kadar ostaju koherentni.
- Statički join mijenja internu organizaciju mesheva i onemogućuje pojedinačno adresiranje sitnih vijaka i prstenova. Ti elementi nisu runtime-state vlasnici.
- Nema uklanjanja skrivenih poligona unutar odobrenih hero mesheva; odabrana je konzervativna sigurnost za sjene, refleksije i buduće putanje kamere.
- Hero A/B SSIM iznosi 0,976949. To je pomoćna mjera; odluka o prolazu donesena je ljudskim pregledom sva tri kadra.

## Draw-call strategija

Kandidat ima 50 mesheva i 50 glTF primitiva. Batchiranje je izvedeno samo unutar istog materijala i semantičke cjeline. Runtime-state objekti nisu progutani u velike statičke mesheve.

Izvozna organizacija:

- `CV_Runtime_StaticArchitecture`
- `CV_Runtime_StaticReactor`
- `CV_Runtime_SecondaryChamber`
- `CV_Runtime_Glass`
- `CV_Runtime_EnergyGuides`
- `CV_Runtime_Console`
- `CV_Runtime_Exterior`
- `CV_Runtime_Interactive`
- `CV_Runtime_ReviewOnly` — nije dio GLB-a

Audit mastera pronašao je postojeće dijeljene datablockove: 16 glavnih collar objekata, 12 sekundarnih collar objekata i 8 listova biljke. Nova GLB instanciranja nisu uvedena: nakon spajanja po materijalu svaki bi od tih setova ionako bio dio jednog statičkog draw batcha, dok bi zasebne instance zadržale dodatne nodeove/draw pozive. Ovo je svjestan izbor, ne propuštena optimizacija.

## Materijali

Legenda: **PBR** = izravno glTF/Principled kompatibilna jezgra; **Bake** = proceduralna varijacija mora u teksture; **Runtime** = Three.js shader ili parametri moraju rekonstruirati ponašanje; **Merge** = kandidat za zajednički texture set/parametarski variant; **Offline** = uklonjen iz runtime izvedenice.

| Materijal | Klasifikacija | ER-08 odluka |
|---|---|---|
| `CV_Mat_Bronze_AgedDark` | Bake, Merge | Sačuvan; zajednički bronze set, tamni parametarski variant. |
| `CV_Mat_Bronze_Machined` | Bake, Merge | Sačuvan; hero 2K gdje test opravda. |
| `CV_Mat_Bronze_Main` | Bake, Merge | Sačuvan; zajednički bronze set. |
| `CV_Mat_Ceiling_Deep` | Bake, Merge | Sačuvan; architecture atlas kandidat. |
| `CV_Mat_Ceiling_WarmStructural` | Bake, Merge | Sačuvan; architecture atlas kandidat. |
| `CV_Mat_Console_Enclosure` | Bake | Sačuvan; 512–1K. |
| `CV_Mat_Console_Screen` | PBR, Offline | Stari placeholder uklonjen. |
| `CV_Mat_Console_TechnicalStandby` | PBR, Runtime | Sačuvan na zasebnom runtime screen objektu; aplikacija je truth owner. |
| `CV_Mat_Console_Trim` | Bake, Merge | Sačuvan; može dijeliti bronze set. |
| `CV_Mat_ER06B_Energy_BlueHotCore` | PBR, Runtime | Sačuvan kao guide; runtime kontrolira emisiju/state. |
| `CV_Mat_ER06B_Energy_BlueSoft` | PBR, Runtime | Sačuvan kao guide; runtime kontrolira emisiju/state. |
| `CV_Mat_ER06B_ExteriorMatte` | Bake | Jedna ugrađena slika; Hue/Saturation rezultat treba bakeati prije produkcije. |
| `CV_Mat_Energy_BlueAccent` | PBR, Runtime | Sačuvan kao guide. |
| `CV_Mat_Energy_BlueCore` | PBR, Runtime | Sačuvan kao guide. |
| `CV_Mat_Energy_BlueSecondary` | PBR, Runtime | Sačuvan kao guide. |
| `CV_Mat_Exterior_CoastFar` | PBR, Offline | Skriveni fallback uklonjen. |
| `CV_Mat_Exterior_CoastNear` | PBR, Offline | Skriveni fallback uklonjen. |
| `CV_Mat_Exterior_Sea` | Bake, Offline | Skriveni fallback uklonjen. |
| `CV_Mat_Exterior_Sky` | Bake, Offline | Skriveni fallback uklonjen. |
| `CV_Mat_Glass_Reactor` | Runtime | Sačuvan; transmission/alpha/depth strategija ispod. |
| `CV_Mat_Glass_Secondary` | Runtime, Merge | Sačuvan kao odvojeni parametarski variant. |
| `CV_Mat_Internal_DarkSteel` | Bake, Merge | Sačuvan; engineering metal set 1K. |
| `CV_Mat_Internal_Machined` | Bake, Merge | Sačuvan; engineering metal set, hero do 2K. |
| `CV_Mat_Metal_Blackened` | Bake, Merge | Sačuvan; engineering metal set. |
| `CV_Mat_Practical_Warm` | PBR, Runtime | Sačuvan kao emissive praktični akcent. |
| `CV_Mat_Stone_Floor` | Bake, Merge | Sačuvan; floor 1K–2K. |
| `CV_Mat_Stone_FloorLight` | Bake, Merge | Sačuvan kao svjetliji floor variant. |
| `CV_Mat_Stone_JointSubstrate` | Bake, Merge | Sačuvan; može u architecture atlas. |
| `CV_Mat_Stone_Platform` | Bake, Merge | Sačuvan; Reactor platform 1K. |
| `CV_Mat_Stone_PlatformTrim` | Bake, Merge | Sačuvan; može dijeliti platform set. |
| `CV_Mat_Stone_Recess` | Bake, Merge | Sačuvan; limestone set. |
| `CV_Mat_Stone_RecessDeep` | Bake, Merge | Sačuvan; limestone set, tamni variant. |
| `CV_Mat_Stone_StructureDark` | Bake, Merge | Sačuvan; limestone set, tamni variant. |
| `CV_Mat_Stone_Trim` | Bake, Merge | Sačuvan; limestone set. |
| `CV_Mat_Stone_Warm` | Bake, Merge | Sačuvan; limestone set 1K–2K. |
| `CV_Mat_Vegetation_Olive` | PBR | Sačuvan; mali 512–1K set ako teksturiranje postane potrebno. |

### Baking plan

- Hero Reactor bronze i machined metal: base color, roughness, metallic i normal; do 2K samo ako A/B test pokaže korist.
- Arhitektura/limestone/floor: 1K–2K po velikoj coverage grupi, uz shared tiling setove gdje UV kontinuitet dopušta.
- Sekundarna komora i konzola: 512–1K.
- Sitni dijelovi: shared set ili atlas; bez zasebne teksture po objektu.
- Exterior matte: zadržati izvornih 1536 × 1024 i bakeati odobrenu korekciju boje.

Atlas ima smisla za statičku arhitekturu, male Reactor detalje i sekundarnu geometriju nakon UV provjere. Ne treba atlasirati hero bronze samo radi jedne primitive manje, niti miješati prozirno staklo s neprozirnim atlasom. Održavanje i parametarska kontrola imaju prednost pred teorijskim minimumom materijala.

## Glass strategija

Četrnaest panela svedeno je na dva objekta: glavni i sekundarni Reactor. Geometrija zadržava front/interior/back čitanje, a materijali su odvojeni radi neovisnog runtime tuninga.

Preporuka za Three.js:

- koristiti `MeshPhysicalMaterial` ili kontrolirani ekvivalent s transmission/IOR/roughness parametrima;
- krenuti s `transparent=true`, `depthWrite=false`, `depthTest=true`;
- postaviti deterministički `renderOrder` za sekundarni pa glavni omotač i provjeriti sortiranje iz cijele dopuštene putanje kamere;
- izbjegavati `DoubleSide` ako test pokaže da zatvorena geometrija pravilno radi s front sideom;
- refleksije osigurati laganim environment mapom, ne dodatnim dinamičkim svjetlima;
- ne atlasirati staklo s opaque materijalima.

GLB prenosi dva transparentna materijala kroz `KHR_materials_transmission`, ali konačan vizual mora biti podešen u ER-09 rendereru.

## Energy strategija

Kandidat sadrži šest guide mesheva: četiri glavna i dva sekundarna material/hierarchy sloja. Oni čuvaju centralnu koncentraciju, asimetriju, promjenjive radijuse i glavni/sekundarni intenzitet. Nisu spojeni sa statičkim Reactorom.

Preporuka za ER-09 je hibrid:

1. guide meshevi nose odobrenu prostornu putanju;
2. runtime shader upravlja emissive intenzitetom, bojom, pulseom i aktivno/neaktivno stanjem;
3. flow se postiže shader animacijom duž guide UV/atributa ili segmentnim opacity pomakom;
4. najviše dva lokalna dinamička blue light izvora, jedan po komori, predstavljaju spill;
5. inactive stanje gasi emissive i lokalno svjetlo, ali može zadržati vrlo slab guide trag ako state ugovor to dopušta.

Aktivna plava energija u kandidatu je pregledni default, ne statički truth. Aplikacija ostaje vlasnik stanja.

## Lighting strategija

ER-07 rig je klasificiran ovako:

- Environment/baked ekvivalent: `CV_Light_Daylight_LeftSky`, `CV_Light_Interior_WarmBounce`, `CV_Light_Rear_Depth`, `CV_Light_Secondary_Separation`.
- Ključna runtime rasvjeta: `CV_Light_Daylight_LeftKey`, reducirani ekvivalent `CV_Light_Reactor_Sculpt`.
- Emissive umjesto point lighta: `CV_Light_Practical_ER06`.
- Dinamički Reactor spill: jedan glavni ekvivalent za `CV_EnergyLight_Main_Core/Lower/Upper` i jedan sekundarni za `CV_EnergyLight_Secondary_Core`.
- Review-only uklonjeno: `CV_ER06B_EnergyLight_LowerFocus`, `CV_ER06B_EnergyLight_UpperFocus`.

Predloženi runtime maksimum je pet aktivnih izvora: warm key, cool/sculpt fill, optional rear/depth light te dva energy point lighta. Ambijent, static bounce i praktične lampe trebaju dolaziti iz environment/baked/emissive doprinosa. Kandidat GLB namjerno sadrži nula svjetala.

## Exterior strategija

Najjeftinije odobreno rješenje ostaje jedna matte billboard ploha. Dopuštena kamera mora ostati blizu odobrenog hero/alternate/close-up volumena i bez većeg lateralnog pomaka koji bi otkrio nedostatak paralakse. U ER-09 treba definirati numerički camera envelope iz stvarnog curated riga.

Ako runtime putanja izvan tog envelopea otkrije plošnost, sljedeći korak nije veliki exterior world nego dvije do tri dubinske kartice ili jednostavan water plane + distant mountain card. Geometrija iz skrivenog ER-06 fallbacka nije zadržana.

## Candidate GLB

Putanja: `art-source/blender/engine-room/runtime/exports/cv_engine_room_er08_candidate.glb`

- Veličina: 18.853.768 B (17,98 MiB)
- Nodeovi: 58
- Meshevi / primitive: 50 / 50
- Verteksi u glTF accessorima: 405.635
- Trokuti: 466.962
- Materijali: 31
- Transparentni materijali: 2
- Teksture / slike: 2 / 1
- Animacije: 0
- Svjetla: 0
- Vanjski URI-ji: 0

Razlika između Blender verteksa (235.372) i glTF POSITION accessor zbroja (405.635) očekivana je zbog razdvajanja verteksa na normal/UV/material granicama. Jedina ugrađena slika je exterior matte 1536 × 1024. Procjena nekomprimirane GPU memorije za RGBA8 sliku je 6.291.456 B (6,00 MiB), bez mipova; s punim mip lancem približno 8,00 MiB. Tangenti nisu izvezeni jer kandidat nema normal-map teksture; normale i UV koordinate jesu.

Neutralni povratni uvoz u Blender 5.2.0 LTS uspio je i vratio 58 objekata, 50 mesheva i 31 materijal. Neutralni round-trip render nije korišten kao fidelity gate jer kandidat namjerno nema kamere ni svjetla, a proceduralni Blender materijali još čekaju bake/runtime rekonstrukciju.

## Runtime rizici za ER-09

- Kandidat je nekomprimiran i nije spreman zamijeniti produkcijski asset bez loader/memory mjerenja.
- Proceduralni materijali u GLB-u predstavljeni su osnovnim PBR vrijednostima; puni odobreni izgled traži bake plan iz ovog dokumenta.
- Transparentno sortiranje mora se provjeriti u stvarnom Three.js rendereru i na cijeloj dopuštenoj putanji kamere.
- Energy shader, state adapter i dinamička svjetla još nisu implementirani.
- Exterior camera envelope još nema izmjeren numerički raspon.
- 466.962 trokuta nije primarni problem, ali najveći pojedinačni mesh (`Bronze_Machined`) treba profilirati prije odluke o dodatnom LOD-u.
- GLB texture/image zapis treba provjeriti s odabranim KTX2/Meshopt pipelineom; sada je namjerno samostalan i bez vanjskih putanja.
- Stvarni FPS, Tauri memorija i Three.js draw-call profil pripadaju ER-09/ER-11. ER-08 ne iznosi procjene FPS-a.

## Vizualni gateovi

- Hero: PASS
- Alternate: PASS
- Reactor close-up: PASS
- Glass čitanje: PASS
- Reactor silueta i material hierarchy: PASS
- Energy fidelity: PASS

Završni A/B nalazi se u `review/er-07-vs-er-08.png`, lijevo ER-07 i desno ER-08, bez korekcije boje ili maskiranja gubitaka.
