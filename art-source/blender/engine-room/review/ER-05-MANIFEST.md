# Engine Room ER-05 Review Manifest

**Produkcijska faza:** ER-05 — Final Lighting / Energy Match  
**Generirano s:** Blender 5.2.0 LTS  
**Kanonska kamera:** `CV_HeroCamera`  
**Žarišna duljina:** 38 mm  
**Pozicija kamere:** `(-0.25, -13.5, 2.1)` metara  
**Cilj kamere:** `(0.10, 1.8, 1.75)` metara  
**Kamera promijenjena u odnosu na ER-04c:** Ne  
**Odobrena geometrija/normale promijenjene:** Ne  
**Odobreni ER-04b materijali promijenjeni:** Ne  
**Runtime ili postojeći GLB promijenjen:** Ne  
**Novi GLB eksportiran:** Ne  
**Izvorna datoteka:** `art-source/blender/engine-room/engine-room.blend`

## Svrha passa

ER-05 zaključuje Blender-only hero-state prezentaciju odobrene Engine Room scene. Neutralna ER-04c utility rasvjeta zamijenjena je finalnom hijerarhijom mediteranskog dnevnog svjetla, dubine, toplih kamenih odbijanja i kontrolirane plave energije stanja `Ready / Active Core`.

Ovaj pass ne radi runtime integraciju, ne eksportira GLB i ne mijenja geometriju, normale, kameru ni 23 odobrena ER-04b materijala.

Nikakvo dodatno podešavanje stakla, bronce, kamena ili drugih odobrenih materijala nije bilo potrebno; čitljivost je postignuta isključivo rasvjetom, energijom, atmosferom i color-management postavkama.

## Finalna rasvjeta

Kolekcija `CV_Lights_Final` sadrži šest namjenski imenovanih Area svjetala:

- `CV_Light_Daylight_LeftKey` — 2800 W, 4,6 m, toplo dominantno svjetlo iz lijevog arkadnog otvora
- `CV_Light_Daylight_LeftSky` — 1250 W, 7,0 m, široki hladniji sky fill
- `CV_Light_Interior_WarmBounce` — 500 W, 5,5 m, tihi topli povrat sa kamena/poda
- `CV_Light_Reactor_Sculpt` — 500 W, 3,2 m, neutralno-hladno oblikovanje brončane mase i ruba stakla
- `CV_Light_Rear_Depth` — 450 W, 4,8 m, diskretno toplo odvajanje od stražnje fasade
- `CV_Light_Secondary_Separation` — 260 W, 2,4 m, podređena čitljivost sekundarnog reaktora

Samo lijevi dnevni key baca sjenu. Fill, sculpt, rear i secondary svjetla namjerno su bez sjena kako bi hijerarhija ostala čista i kako se Eevee shadow buffer ne bi preopteretio. Smjer je čitljiv slijeva nadesno: otvorena strana je toplija i svjetlija, dok desna i stražnja zona čuvaju dubinu.

## Aktivna energija reaktora

Nova kolekcija `CV_Reactor_Energy` jasno odvaja hero-state energiju od zaključane produkcijske geometrije. Sadrži:

- 12 Curve objekata
- četiri Point svjetla bez sjena
- tri nova, isključivo energetska materijala

Glavni reaktor koristi primarnu i sekundarnu heliksu, centralni osni filament, jedan fini unutarnji filament i pet nepotpunih, blago nepravilnih slojevitih lukova. Lukovi nisu zatvoreni prstenovi; njihove različite faze, radijusi i valovitost izbjegavaju dojam pravilne neonske zavojnice. Energija je koncentrirana oko osi i ostaje unutar komore.

Sekundarni reaktor koristi užu heliksu i dva nepotpuna luka. Njegov intenzitet, širina filamenata i lokalno plavo svjetlo namjerno su niži od glavnog reaktora.

Energetski materijali:

- `CV_Mat_Energy_BlueCore` — Principled emisija 8,0
- `CV_Mat_Energy_BlueAccent` — Principled emisija 3,8
- `CV_Mat_Energy_BlueSecondary` — Principled emisija 2,6

Lokalna plava svjetla koriste 90/190/70 W u glavnoj komori i 45 W u sekundarnoj. Emisija je vizualizacija odobrenog Blender hero stanja; runtime i dalje mora biti jedini autoritativni izvor stvarnog node stanja.

## Atmosfera, glow i color management

- World pozadina: tamna hladna vanjska vrijednost, strength 0,24
- World Volume Scatter: density 0,0022, anisotropy 0,18
- Compositor: `Fog Glow`, threshold 1,25, size 0,55, strength 0,22
- View transform: AgX, `Medium High Contrast`
- Exposure: -0,25

Atmosfera samo dodaje suptilnu dubinu. Glow je ograničen i ne zamagljuje brončane rubove, staklene granice ili siluetu reaktora.

## Dokaz zaključanog ER-04c stanja

`validate_er05.py` ponovno učitava spremljeni ER-05 `.blend`, sprema stanje svih zaključanih mesheva i materijala u memoriju, zatim u istoj read-only Blender sesiji svježe rekonstruira ER-04c iz odobrenih buildera. Usporedba uključuje imena, kolekcije, transformacije, verteks koordinate, edgeove, poligone, smooth/sharp stanje, material slotove, modifiere te sve node graphove 23 odobrena materijala.

Rezultat:

- ER-05 zaključana geometrija: `4181ffdf7cefed26318d42f4d8dc85850807344286459f99b4aa99081f2f066f`
- svježa ER-04c geometrija: `4181ffdf7cefed26318d42f4d8dc85850807344286459f99b4aa99081f2f066f`
- ER-05 zaključani materijali: `de7d974873551c1174f00fb484779f09d2157d3d0ceae57c74f247195c03ebb4`
- svježi ER-04c materijali: `de7d974873551c1174f00fb484779f09d2157d3d0ceae57c74f247195c03ebb4`
- geometrija i materijali odgovaraju ER-04c: Da
- aktivna hero kamera i target rotation error: valjano, `0.0` radijana

Brojevi scene ostaju:

- `CV_Architecture`: 247 objekata
- glavni `CV_Reactor`: 246 objekata
- `CV_Reactor_Secondary`: 72 objekta
- ukupno mesh objekata: 571
- zaključani `CV_Mat_*` materijali: 23

ER-05 dodatke čine samo zasebna energetska kolekcija, tri energetska materijala, finalna svjetla te world/compositor postavke.

## Vizualni rezultat

- glavni reaktor ostaje nedvosmislen hero kadar i najsvjetlija informacijska točka
- lijevo dnevno svjetlo stvara toplu mediteransku orijentaciju i mjerljivu nadesno padajuću hijerarhiju
- bronca dobiva toplu metalnu definiciju bez prežarenih rubova
- tehničko staklo ostaje prozirno, reflektivno i čitljivo ispred energije
- plava aktivna energija je mirna, slojevita i ograničena na komore
- sekundarni reaktor i konzola ostaju čitljivi, ali podređeni glavnom stroju
- pod i arhitektura vode kadar prema centralnoj platformi bez promjene kompozicije

## Poznate preostale razlike prema kanonskoj referenci

ER-05 je match unutar zaključanog ER-04c asseta, a ne ponovni modeling ili environment pass. Zato ostaju ove namjerne razlike:

- referenca ima otvoreni pogled na more, planine, biljke i snažniji prirodni exterior bounce; odobrena ER-04c geometrija nema taj okoliš
- referentni reaktor ima više mikrodetalja, cijevi, kabela, pričvrsnica i strojno obrađenih prijelaza
- referentna energija je još volumetričnija i gušća; ER-05 koristi kontrolirane krivulje kako ne bi mijenjao zaključanu internu geometriju
- referenca uključuje UI overlay i donji style board; oni nisu dio Blender scene niti ER-05 opsega
- pojednostavljene ER-04c arhitektonske plohe i pod ostaju vizualno čišći od teksturirane referentne kamene prostorije

Te se razlike ne mogu sigurno ukloniti lighting-only passom bez povratka u modeling, material ili runtime scope.

## Reproducibilni izvori

- `build_er05.py` — SHA-256 `fd92df6b5cd59b883d77b9e3f7fcc54562f851d3964bce6c409ebc981b9a604f`
- `build_er05_reviews.py` — SHA-256 `9f8edf740bd93a895c9150c6003cf5cf5cdedb9cf7e0e37f009e66241390e7fa`
- `validate_er05.py` — SHA-256 `a1bdef4534557b4844b240460d5ccb5600a15075208441376daa0efe17f5db70`
- `engine-room.blend` — SHA-256 `3671ce36d78319990d34731d48c5cd4c8aacdb6e42ce7debef3850514c0edd5c`

Rebuild, usporedbe i read-only validacija:

```bash
cd art-source/blender/engine-room
/Applications/Blender.app/Contents/MacOS/Blender --background --python build_er05.py
python3 build_er05_reviews.py
/Applications/Blender.app/Contents/MacOS/Blender --background engine-room.blend --python validate_er05.py
```

## Review izlazi

- `er-05-lighting-hero.png` — 1536 × 1024 — SHA-256 `935b8a13246de7e4e8d19aebcb442464812fc1de39e7fcdd34d8b62e2813a91a`
- `er-05-lighting-alternate.png` — 1536 × 1024 — SHA-256 `0a63f82850bfdeaa2c2f0c16d572d7374f28c79c1b3c01519dc05f6e2e0ffca7`
- `er-05-reactor-energy-closeup.png` — 1536 × 1024 — SHA-256 `166f3ac31b8ff849232e79bdfe5b9d61b241fb59bda82d78ef8855ff11bbb49d`
- `er-05-reference-comparison.png` — 3072 × 1024 — SHA-256 `3c1c15648dc2c728ca7f76ac50b7a4ad4c54e55d9270b1039a492308e4cbf3ab`
- `er-04c-vs-er-05.png` — 3072 × 1024 — SHA-256 `841432ce0ed0aab2206f69d36fd5410dbb0a14c6c38653035b7be05a8aca5dc8`

Izvori lijevih strana usporedbi ostaju nepromijenjeni:

- kanonska referenca — SHA-256 `58a68d15da633133a52ce33b22e0ffd0f9552ff5f80ac4004407a6ea7d065ef5`
- `er-04c-materials-hero.png` — SHA-256 `daac557713e5d188b46e4dce82f20c15a8ed85794892f8dfcc5ba48511ec1b81`

## Runtime i GLB kontrola

Hash usporedba svih 51 praćenih datoteka u `src/`, `tests/` i `public/assets/experience/engine-room/` jednaka je stanju na početku ER-05 zadatka.

- `cv_core_reactor_v1.glb` — nepromijenjen — SHA-256 `b0444481bc19c4f9fc41e70ae48b5d080f61254785eb8a7ca83074da191cc92e`
- `cv_engine_room_cooling_manifold.glb` — nepromijenjen — SHA-256 `ac57e4c98817f3dc94dc2d285185ca4fd08c8f3b3d02ac530b715ce1bf82a7e0`
- runtime/test promjene u ovom zadatku: nema
- novi produkcijski GLB: nije eksportiran

## ER-05 gate

ER-05 Blender deliverable je tehnički dovršen i spreman za ljudski vizualni pregled. Ovaj zadatak završava bez runtime integracije. Sljedeći korak smije započeti tek nakon eksplicitnog odobrenja ER-05 hero, alternate, energy close-up i usporednih kadrova.
