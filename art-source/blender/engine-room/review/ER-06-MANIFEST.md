# Engine Room ER-06 Review Manifest

**Produkcijska faza:** ER-06 — Detail Pass  
**Generirano s:** Blender 5.2.0 LTS  
**Kanonska kamera:** `CV_HeroCamera`  
**Žarišna duljina:** 38 mm  
**Pozicija kamere:** `(-0.25, -13.5, 2.1)` metara  
**Cilj kamere:** `(0.10, 1.8, 1.75)` metara  
**Kamera promijenjena u odnosu na ER-05:** Ne  
**Odobrena glavna geometrija promijenjena:** Ne  
**Odobrenih 23 materijala promijenjeno:** Ne  
**ER-05 key/fill rasvjeta promijenjena:** Ne  
**Runtime ili postojeći GLB promijenjen:** Ne  
**Novi GLB eksportiran:** Ne  
**Izvorna datoteka:** `art-source/blender/engine-room/engine-room.blend`

## Svrha passa

ER-06 dodaje posljednju Blender-side razinu sekundarne proizvodne gustoće prije ER-07 approval gatea. Pass ne redizajnira odobrenu scenu. Novi detalji fizički objašnjavaju kako su glavni Reactor, sekundarna komora i console sastavljeni, povezani, servisirani i ugrađeni u prostor, dok lagani exterior vraća mediteranski kontekst lijeve arkade.

Sve ER-06 dopune nalaze se u zasebnoj kolekciji `CV_Detail_ER06`, a energija ostaje izdvojena u `CV_Reactor_Energy`.

## 1. Dodani detalji glavnog Reactora

`CV_Reactor_Detail_ER06` dodaje disciplinirani sloj vidljive montažne logike:

- 16 strojno obrađenih collars na osam glavnih frame postova, u dvije servisne visine
- 24 manja ring fastenera na donjem, srednjem i gornjem frame prstenu
- tri uska layered lower-base transition profila
- četiri inspection housinga s odvojenim machined capovima
- 16 uskih support ribs koji vežu frame uz donju i gornju chamber zonu
- šest base service panela sa zasebnim latch elementima
- po šest stvarno oslonjenih flange vijaka na prednjem, desnom i lijevom lower portu

Detalji su koncentrirani u frame junction, lower-port i base zonama koje su vidljive u hero i close-up kadru. Nisu dodani nasumični paneli, ventovi ni dekorativni greebles.

## 2. Unutarnja mehanika

`CV_Reactor_InternalDetail_ER06` dodaje:

- šest nested support ringova između postojećih modula
- četiri vertikalna service raila s ukupno 16 collars
- četiri central-axis collars s trokrakim braces
- četiri manja auxiliary cilindra s machined capovima

Nova geometrija ostavlja negativni prostor plavoj energiji i ne zahtijeva promjenu odobrenog stakla. Unutarnji sklop je sada slojevitiji, ali se primarna os i izvorni module rhythm i dalje jasno čitaju.

## 3. Energy-shape refinement

Boja, emisijske vrijednosti i četiri lokalna ER-05 energy svjetla ostaju isti:

- `CV_Mat_Energy_BlueCore` — emisija 8,0
- `CV_Mat_Energy_BlueAccent` — emisija 3,8
- `CV_Mat_Energy_BlueSecondary` — emisija 2,6
- glavna lokalna svjetla — 90/190/70 W
- sekundarno lokalno svjetlo — 45 W

Geometrija toka promijenjena je iz čišćih heliksa u 16 kontroliranih Curve objekata:

- četiri glavna preklapajuća flow stranda s promjenjivim radijusom, lateralnim driftom i nejednolikom kutnom progresijom
- sedam glavnih nepotpunih lukova različite širine, faze, vertikalnog nagiba i lokalnog pomaka
- dva sekundarna flow stranda
- tri sekundarna nepotpuna luka

Rezultat je manje matematički pravilan, ali i dalje stabilan, tih i contained. Nema lightning grananja, čestica ni povećanog blooma.

## 4. Conduits i kabelska infrastruktura

`CV_Conduits_ER06` sadrži četiri Bezier trase s `AUTO` tangentama i stvarnim endpoint collars:

- lower power/service ruta: glavni desni lower port → floor-following trasa → secondary lower port
- upper service/data ruta: glavni side conduit zone → povišena meka trasa → secondary interface housing
- console power ruta: glavni lijevi lower port → floor-following trasa → stražnja strana consolea
- tanja paralelna console data ruta

Četiri floor saddles fizički oslanjaju dulje podne dionice. Svaka trasa ima jasan početak, odredište, kontinuiran bend radius i clearance od stakla, frame postova i poda.

## 5. Sekundarna komora

`CV_Secondary_Detail_ER06` dodaje:

- 12 frame-post collars
- tri unutarnja support ringa
- usmjereni interface mount, collar i face prema glavnom Reactoru
- šest base anchor blokova
- refined secondary energy s manjim radijusom, manjim bevelom i istim podređenim intenzitetom

Sekundarna komora sada djeluje ugrađeno i povezano, ali ostaje znatno manje vizualno dominantna.

## 6. Console completion

`CV_Console_Detail_ER06` pretvara placeholder masu u dovršen sekundarni tehnički objekt:

- nagnuti display housing
- odvojena standby screen površina
- četverodijelni fizički bezel
- gornji hood i dva bočna structural cheeka
- lower enclosure i zaseban technical panel
- horizontalni panel seam
- bronze base interface
- četiri fizička front porta
- dva base fastenera
- power/data kabelski ulaz

Zaslon koristi samo tamni, vrlo tihi non-stateful standby odziv. Nema teksta, block heighta, sync postotka, prometa ni production application UI-ja.

## 7. Arhitektonski sekundarni detalj

Dodani su:

- dva koncentrična platform service channel profila
- osam platform service covera
- uski metalni threshold rail uz lijevu arkadu
- jedan fizički rear-wall practical fixture s mountom, housingom i capovima

Ornamentalna arhitektura nije dodavana. Detalji objašnjavaju prijelaz poda, servisni rub platforme i ljudsku mjeru stražnje fasade.

## 8. Exterior Mediterranean environment

`CV_Exterior_ER06` je lagana, hero-camera-orijentirana kompozicija:

- proceduralni vertikalni Mediterranean sky gradient
- velika mirna water površina sa širokom tonskom varijacijom
- dva low-poly coastal/mountain ribbon sloja na različitim udaljenostima
- nastavak balcony/parapet trima
- world-volume atmosfera iz ER-05 zadržana je za udaljeni falloff

Exterior nije otvoreni svijet. Geometrija postoji samo koliko je potrebno za hero i razumne alternate/exterior kutove. Sky, sea i coast koriste blagu self-lit komponentu jer su smješteni izvan unutarnje ER-05 light rig orijentacije; ne osvjetljavaju interijer i ne mijenjaju njegovu hijerarhiju.

## 9. Vegetacija

Dodan je jedan mali olive-like potted plant uz lijevu arkadu:

- stone pot i lip
- jedan jednostavni stem
- osam linked low-poly leaf elemenata

Biljka je samo near/midground depth cue. Ne konkurira Reactoru i ne stvara vrtni ugođaj.

## 10. Rasvjeta

Svih šest odobrenih ER-05 finalnih Area svjetala ostalo je točno nepromijenjeno. Read-only hash spremljene scene i svježe ER-05 rekonstrukcije jednak je:

`1749ecd043cc5c9a6b284bf92626a1214312bc9dca4135f524f4e616549f194c`

Dodan je samo jedan lokalni `CV_Light_Practical_ER06` Point od 22 W, bez sjena, fizički smješten unutar novog rear-wall fixturea. Njegov doprinos je ograničen na malo toplo lokalno očitanje iza sekundarne komore. Daylight direction, exposure, key/fill ratio, Reactor emphasis, world volume i compositor glow nisu mijenjani.

## 11. Materijali

Svih 23 odobrena ER-04b/ER-05 materijala ostala su bit-po-bit nepromijenjena. Dodano je sedam ER-06-only materijala:

- `CV_Mat_Exterior_Sky`
- `CV_Mat_Exterior_Sea`
- `CV_Mat_Exterior_CoastFar`
- `CV_Mat_Exterior_CoastNear`
- `CV_Mat_Vegetation_Olive`
- `CV_Mat_Practical_Warm`
- `CV_Mat_Console_TechnicalStandby`

Svi mehanički, conduit, console-housing, platform i internal detalji ponovno koriste odobrene bronze, blackened metal, internal steel, stone i console materijale.

## 12–13. Kamera i odobrena glavna geometrija

`validate_er06.py` ponovno učitava spremljeni `.blend`, zatim u memoriji svježe rekonstruira odobreni ER-04c/ER-05 baseline. Usporedba uključuje imena, kolekcije, transformacije, verteks koordinate, edgeove, poligone, smooth/sharp stanje, material slotove, modifiere i node graphove.

Rezultat:

- odobrenih mesh objekata u ER-06: 571
- ER-06 approved-geometry hash: `4181ffdf7cefed26318d42f4d8dc85850807344286459f99b4aa99081f2f066f`
- svježi approved baseline hash: `4181ffdf7cefed26318d42f4d8dc85850807344286459f99b4aa99081f2f066f`
- odobrenih materijala: 23
- ER-06 approved-material hash: `de7d974873551c1174f00fb484779f09d2157d3d0ceae57c74f247195c03ebb4`
- svježi approved baseline hash: `de7d974873551c1174f00fb484779f09d2157d3d0ceae57c74f247195c03ebb4`
- `CV_HeroCamera`: 38 mm, `(-0.25, -13.5, 2.1)`
- target rotation error: `0.0` radijana

Odobrena glavna geometrija, normale, room proportions, Reactor silhouette, secondary placement i kamera ostali su nepromijenjeni.

## 14. Performance i poly-count

ER-06 detail collection dodaje:

- 231 mesh objekta
- 16.728 verteksa
- 12.864 poligona
- 198 jedinstvenih mesh datablockova
- 33 linked mesh instance
- četiri conduit Curve objekta
- 16 energy Curve objekata

Ukupna scena sada sadrži 802 mesh objekta. Repeated post collars i plant leaves koriste linked mesh data. Exterior koristi dva jednostavna ribbon mesha i velike niskopoligonalne plohe. Nisu modelirani mikroskopski scratches, nevidljivi fasteneri ni milijunska geometrija.

## 15. Runtime translation considerations

- nova mehanička geometrija može se kasnije selektivno mergeati ili instanceati prema profileru
- Bezier conduits trebaju se prije GLB izvoza pretvoriti u kontrolirane mesh trase ili zadržati kao odvojena optimizacijska grupa
- Blender energy krivulje predstavljaju samo odobreni hero state; runtime mora ponovno preuzeti stvarni Bitcoin/node state i animaciju
- console standby površina ne sadrži aplikacijske tvrdnje i može se zamijeniti runtime UI površinom
- sky/sea/coast slojevi mogu se bakeati ili zamijeniti jeftinijim runtime backgroundom ako mjerenje to zahtijeva
- transparentno Reactor staklo i preklapajuća energy geometrija zahtijevaju zasebnu real-time sorting provjeru

Optimizacija i runtime prijevod nisu započeti u ER-06.

## 16–17. Runtime i GLB kontrola

Hash usporedba svih 51 praćenih datoteka u `src/`, `tests/` i `public/assets/experience/engine-room/` jednaka je stanju na početku ER-06.

- `cv_core_reactor_v1.glb` — nepromijenjen — SHA-256 `b0444481bc19c4f9fc41e70ae48b5d080f61254785eb8a7ca83074da191cc92e`
- `cv_engine_room_cooling_manifold.glb` — nepromijenjen — SHA-256 `ac57e4c98817f3dc94dc2d285185ca4fd08c8f3b3d02ac530b715ce1bf82a7e0`
- runtime/test promjene u ovom zadatku: nema
- novi produkcijski GLB: nije eksportiran

## 18. Preostale vidljive razlike prema kanonskoj referenci

- referentni Reactor još uvijek ima veću gustoću sitnog strojno obrađenog micro-detaila i površinske patine
- referentna energija je volumetrijski gušća i sadrži više vrlo finih filamenta; ER-06 ostaje kontroliran radi čitljivosti i kasnijeg real-time prijevoda
- zaključana arkadna geometrija i hero kompozicija pokazuju manje mora u samom hero kadru nego referenca, iako je exterior jasno vidljiv iz alternate/exterior kuta
- ER-06 coast i water slojevi namjerno su pojednostavljeni i nisu fotografski okoliš
- odobrena arhitektura ima manje stone seams, weatheringa i sitnih konstrukcijskih nepravilnosti od reference
- console nema production UI sadržaj, a hero render nema referentni overlay ni donji style board

Najveće preostale razlike više nisu očiti nedostatak sekundarne proizvodne geometrije; pripadaju ER-07 ljudskoj procjeni, kasnijem runtime prijevodu ili bi zahtijevale povratak u već odobrene architecture/material faze.

## Reproducibilni izvori

- `build_er06.py` — SHA-256 `205bc4fc79dbb2d52a56f50a979d59ac3bfcc3e166116ad1db9b035eb108073f`
- `build_er06_reviews.py` — SHA-256 `61799867c398ff9f39f10baa1055ffc592c1191979ea647b2b7a3c26af59cc0f`
- `validate_er06.py` — SHA-256 `dbee05f7309a93d38dbdcafdec5e468ddfbb8f842684ef8b28f6d68ae46b3743`
- `engine-room.blend` — SHA-256 `37222707e2f3c45987be82dd1b72cf825d58f1082feed386f8650d4c9a8fb062`

Rebuild, usporedbe i read-only validacija:

```bash
cd art-source/blender/engine-room
/Applications/Blender.app/Contents/MacOS/Blender --background --python build_er06.py
python3 build_er06_reviews.py
/Applications/Blender.app/Contents/MacOS/Blender --background engine-room.blend --python validate_er06.py
```

## 19. Review izlazi

- `er-06-detail-hero.png` — 1536 × 1024 — SHA-256 `1ecedb7e7fdede2fc234f88db4c18627addd4fd795488518ffd73260b2cef96a`
- `er-06-detail-alternate.png` — 1536 × 1024 — SHA-256 `f6fa64f92b75ff9a0a540cbc158f4bee339948a3ace92a928edc096f425a05be`
- `er-06-reactor-detail-closeup.png` — 1536 × 1024 — SHA-256 `327734676cd8535c772f4af729cde4d82e25ab2e2fc9211d4fc9eff40e4fc2fa`
- `er-06-console-closeup.png` — 1536 × 1024 — SHA-256 `835283611624d315abb1aab6c597899d2a94662d4f9250fcd6aa87d5f82e332e`
- `er-06-exterior-depth.png` — 1536 × 1024 — SHA-256 `1d33dcc95c9a5505ceb63bd23c168e528d81733ba58531ac96131f6510a7377a`
- `er-06-reference-comparison.png` — 3072 × 1024 — SHA-256 `6daa354a9356eaddf0f304ddf897311aad83eba3d62fb0597365794eeadc6f4d`
- `er-05-vs-er-06.png` — 3072 × 1024 — SHA-256 `7f3f63ad324919832a689feb4ddaa6531c106fd77c859eef8825290a649fa91a`

Izvori lijevih strana usporedbi ostaju nepromijenjeni:

- kanonska referenca — SHA-256 `58a68d15da633133a52ce33b22e0ffd0f9552ff5f80ac4004407a6ea7d065ef5`
- `er-05-lighting-hero.png` — SHA-256 `935b8a13246de7e4e8d19aebcb442464812fc1de39e7fcdd34d8b62e2813a91a`

## ER-06 gate

ER-06 je tehnički dovršen i spreman za ljudski vizualni pregled. ER-07 nije započet. Nema runtime integracije, optimizacije ni izvoza prije eksplicitnog ljudskog odobrenja ovih ER-06 review kadrova.
