# Engine Room ER-04c Review Manifest

**Produkcijska faza:** ER-04c — Surface Normals / Smooth Shading Correction  
**Generirano s:** Blender 5.2.0 LTS  
**Kanonska kamera:** `CV_HeroCamera`  
**Žarišna duljina:** 38 mm  
**Pozicija kamere:** `(-0.25, -13.5, 2.1)` metara  
**Cilj kamere:** `(0.10, 1.8, 1.75)` metara  
**Kamera promijenjena u odnosu na ER-04b:** Ne  
**Topologija, silueta ili dimenzije promijenjene:** Ne  
**Materijali promijenjeni:** Ne  
**Utility review rasvjeta promijenjena:** Ne  
**Izvorna datoteka:** `art-source/blender/engine-room/engine-room.blend`

## Svrha passa

ER-04b je materijalno odobren, ali je arhitektonski close-up pokazivao pravilne vertikalne facete na cilindričnim kamenim stupovima. ER-04c uklanja isključivo taj shading nedostatak prije ER-05.

Ovo nije art-direction, materijalni, modeling ili lighting pass. ER-05 nije započet.

## Dijagnoza

Read-only pregled ER-04b `.blend` datoteke potvrdio je:

- 50 zakrivljenih arhitektonskih dijelova stupova imalo je `0` smooth poligona
- svaki ciljni mesh imao je 64 radijalna segmenta, 128 verteksa i 66 poligona
- ciljevi obuhvaćaju tapered shaft, base lower/upper, neck i round capital dijelove
- zakrivljeni Reactor dijelovi već su bili smooth-shaded
- jedini flat Reactor kandidati bili su namjerno ravni box nosači i radijalne ploče
- nije pronađen problem nekonzistentnih ili preokrenutih normala

Uzrok je bio flat-shaded osnovni arhitektonski cylinder/cone mesh, a ne ER-04b limestone procedurala.

## Primijenjena korekcija

Na točno 50 potvrđenih objekata u `CV_Architecture` primijenjen je Blender 5.2:

```text
Shade Smooth by Angle
angle: 30°
keep_sharp_edges: True
```

Korekcija obuhvaća samo objekte čiji nazivi završavaju s:

- `_Tapered_Shaft`
- `_Base_Lower`
- `_Base_Upper`
- `_Neck`
- `_Capital_Round`

Prag od 30° zaglađuje susjedne radijalne plohe čiji je kut približno 5,625°, ali zadržava prijelaze prema gornjim i donjim kapama oštrima. Nakon korekcije svaki ciljni mesh ima:

- 66/66 smooth poligona
- 128 sharp boundary rubova
- nepromijenjenih 128 verteksa, 192 edgea i 66 poligona

Sharp edge oznake kontroliraju split normal ponašanje na namjernim 90° granicama. Bevel modifieri, njihove širine i broj segmenata ostali su isti.

## Što nije mijenjano

- verteksi, edgeovi, poligoni ili mesh redoslijed
- radijalna segmentacija
- transformacije, skala, dimenzije i bounding silueta
- arhitektonski hard-edge prijelazi, plinthovi, abacusi, cornice, arch segmenti i floor slabovi
- Reactor i secondary Reactor objekti, normale, materijali i hijerarhija
- platforma i konzola
- svi ER-04b materijalni node graphovi
- limestone noise, boje, bump i roughness
- brončane boje, metallic i roughness
- stakleni tint, IOR, alpha, transmission i roughness
- `CV_HeroCamera` i ostale review kamere
- svih pet ER-04b utility review svjetala
- scene composition i color-management postavke
- runtime, testovi i postojeći GLB-ovi

Nije korišten Weighted Normal modifier, subdivision, globalno smoothing pravilo ni povećanje polygon counta.

## Deterministički ER-04b/ER-04c potpisi

`er04c_state_signature.py` izračunava tri potpisa. Geometrijski potpis namjerno izostavlja samo `polygon.use_smooth` i `edge.use_edge_sharp`, jer su to jedini atributi koje ER-04c smije promijeniti. Uključuje sva imena, transformacije, koordinate verteksa, edge indekse, polygon topologiju, material slotove i modifier postavke.

ER-04b baseline i ponovno učitani ER-04c daju identične vrijednosti:

- geometrija/topologija: `baf65bd88ef7f14727c18a8045d6054c022b10628e06793614faf37a3a46447a`
- materijalni node graphovi: `de7d974873551c1174f00fb484779f09d2157d3d0ceae57c74f247195c03ebb4`
- kamere, svjetla i render state: `8fcacb12d823c72a3720306872adee28db196635916b8e273941ae0c71b7a875`

Time je potvrđeno da je jedina produkcijska razlika selective smooth/sharp stanje.

## Kamera, scena i sadržaj

- aktivna kamera: `CV_HeroCamera`
- lens: 38,0 mm
- pozicija: `(-0.25, -13.5, 2.1)`
- target rotation error: `0.0` radijana
- `CV_Architecture`: 247 objekata
- glavni `CV_Reactor`: 246 objekata
- `CV_Reactor_Secondary`: 72 objekta
- ukupno mesh objekata: 571
- semantički `CV_Mat_*` materijali: 23
- Reactor objekti s ER-04c korekcijom: 0
- `ShaderNodeEmission` čvorovi: 0
- aktivna Principled emisija: 0
- default `Cube`, `Cylinder`, `Material` ili `Collection` nazivi: 0
- Blender image putanje: samo kanonska referenca

## Vizualni rezultat

- najbliži lijevi stup više ne pokazuje pravilne vertikalne polygon facete
- dodatni stupovi u dubini čitaju kao kontinuirane zakrivljene plohe
- baze, kapiteli i stepenasti prijelazi ostaju vizualno oštri
- prirodna ER-04b limestone varijacija ostaje vidljiva i nije korištena za skrivanje defekta
- hero kadar ostaje vizualno neutralan osim korektnijeg shadinga zakrivljenih arhitektonskih ploha

## Reproducibilni izvori

- `build_er04b.py` — SHA-256 `75567db4b21dfee7402d30792e274ba52de455ecb7de0a7c7773961aa2aeca64`
- `build_er04c.py` — SHA-256 `c876865bed084e1cf54f7d289d77b425eda933295053ee9468908bbbefe5f839`
- `build_er04c_reviews.py` — SHA-256 `660438102d46df27f5edc2292875b0a005b666b9a227f1aa2614a01d3af5ecdf`
- `er04c_state_signature.py` — SHA-256 `0ed289f23ff8b7945bd602f466a08030f646dc7611bf4d99e63b43ab34933ed6`
- `validate_er04c.py` — SHA-256 `6892470fbe642a1463ff926c94a6cb41850e3dcf0ea4772603ed092a453cafaa`
- `engine-room.blend` — SHA-256 `26b4cedd6a25635c6b585fd38c993fd5f785bac927b8bc0f45c2e480cd67f354`

Rebuild i validacija:

```bash
cd art-source/blender/engine-room
/Applications/Blender.app/Contents/MacOS/Blender --background --python build_er04c.py
python3 build_er04c_reviews.py
/Applications/Blender.app/Contents/MacOS/Blender --background engine-room.blend --python validate_er04c.py
```

## Review izlazi

- `er-04c-materials-hero.png` — 1536 × 1024 — SHA-256 `daac557713e5d188b46e4dce82f20c15a8ed85794892f8dfcc5ba48511ec1b81`
- `er-04c-architecture-normal-closeup.png` — 1536 × 1024 — SHA-256 `2326cc428c438550d0fdad8379ae37458a92343ef63a3e8530455550095ffad3`
- `er-04b-vs-er-04c.png` — 3072 × 1024 — SHA-256 `96aab5f2902d4e33ef31e9c890ea99370bbbaac6975990a3fd4d546d2d5539e3`

ER-04b izvor za lijevu stranu usporedbe ostaje nepromijenjen:

- `er-04b-architecture-material-closeup.png` — SHA-256 `83b8db06e34225f14e0cd8c57d82d0200a9f75bed509773bdf17e1d10b5b6e6a`

## Runtime i GLB kontrola

Hash usporedba 51 datoteke u `src/`, `tests/` i `public/assets/experience/engine-room/` jednaka je stanju na početku ER-04c zadatka.

- `cv_core_reactor_v1.glb` — nepromijenjen — SHA-256 `b0444481bc19c4f9fc41e70ae48b5d080f61254785eb8a7ca83074da191cc92e`
- `cv_engine_room_cooling_manifold.glb` — nepromijenjen — SHA-256 `ac57e4c98817f3dc94dc2d285185ca4fd08c8f3b3d02ac530b715ce1bf82a7e0`
- novi produkcijski GLB: nije eksportiran

## Gate prije ER-05

ER-04c tehnički acceptance kriteriji prolaze. Očito vertikalno faceting očitanje je uklonjeno, hard-edge hijerarhija je sačuvana, a svi odobreni ER-04b state potpisi ostali su isti.

ER-05 nije započet. Prije prelaska na ER-05 preostaje ljudski pregled ER-04c close-upa i usporedbe te eksplicitno odobrenje ovog uskog tehničkog gatea.
