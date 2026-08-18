# ER-12A — Creative Fidelity Recovery

Datum reviewa: 2026-08-18  
Glavna referenca: `docs/references/engine-room/engine-room-hero-reference.png`  
Packaged artifact: `src-tauri/target/release/bundle/macos/Core Vault ER12A QA.app`

## Odluka

**ER-12A CREATIVE GATE: FAIL**

Pass je napravio stvaran i jasno vidljiv pomak u odnosu na ER-11b, ali završni packaged rezultat još uvijek ne doseže acceptance kriterij „reference-grade space”. U izravnoj usporedbi soba i dalje izgleda kao uredan stilizirani prototip: geometrija arkada ostaje plitka, veliki kameni planovi su previše pravilni, exterior se čita pretežno kao ravna plava kulisa, a reaktor nema količinu unutarnje energije i strojarskog detalja iz glavne reference.

Tehnički, performance i truthfulness gateovi prolaze. Fail je isključivo kreativni i namjerno nije prikriven tehničkom spremnošću.

## Što je bilo krivo

- ER-11b je bio previše neutralan i siv; kamen, pod i strop djelovali su kao jednobojni blokovi.
- Bronca je bila vrlo tamna i shader-flat, s premalo toplih sekundarnih refleksija.
- Reaktorova energija bila je čitljiva samo kao nekoliko tankih linija, bez dovoljnog volumena i lokalnog spilla.
- Hero kadar je pokazivao funkcionalnu prostoriju, ali nije stvarao snažnu mediteransku atmosferu ni planovsku dubinu.
- Exterior je bio funkcionalan asset, ali u glavnim interijerskim kadrovima ostao je pretežno flat matte.

## Implementirane promjene

### Materijali

- Produkcijski GLB sada u runtimeu koristi postojeći Core Vault deterministički proceduralni PBR set: base color, roughness i normal za kamen/pod te base color, roughness, normal i metalness za broncu.
- Kamen je topliji, manje sterilan i ima kontroliranu mikrovarijaciju bez gamey šuma.
- Brončane obitelji imaju odvojene main, aged-dark i machined odzive, toplije fine highlighte i manje narančast/plastičan dojam.
- Engineering metal ostao je taman i precizan.
- Staklo je dobilo project-owned roughness mapu, jači edge read i osjećaj debljine, bez refrakcije i sorting rizika.

### Rasvjeta i prostor

- Retunirani su Lightformer environment, statički SH bounce, hemisferno svjetlo i oba directional izvora.
- Dominantni key je topliji, fill hladniji i slabiji, a pozadina/fog neutralno-topliji.
- Dobivena je jasnija separacija toplog kamena, tamne bronce i plave energije.

### Reaktor i istinita energija

- Dodan je jedan mali, deterministički 192×192 radial `CanvasTexture` i dva additive spritea za perceptivni volumen/spill.
- Glow se ne pali dekorativno. `mainActive`, `secondaryActive`, syncing intenzitet, reduced-motion animacija i block pulse i dalje dolaze isključivo iz postojeće `deriveProductionEnergyRuntimeState` logike.
- Offline/unknown ostaje dormant; networking-disabled gasi samo mrežno vezanu sekundarnu energiju.
- Resurs se eksplicitno disposa na unmountu.

### Kamera i exterior

- Hero kadar je blago približen i spušten, ali zadržava konzolu, sekundarnu komoru i arhitektonski kontekst.
- Alternate kadar bolje odvaja glavnu i sekundarnu komoru.
- Exterior matte je tonski i emisijski integriran s toplim interijerom; mapiranje je kadrirano bez novog vanjskog asseta.

## Stvarna konvergencija prema referenci

Izravni ER-11b/ER-12A kontakt sheet pokazuje stvaran napredak:

- prostor je topliji i manje laboratorijski siv;
- bronca ima više toplog craft odziva;
- pod i kamen imaju bolji tonalni weight;
- plava energija je vidljivija u hero kadru;
- reaktor je veći i jasnije dominira kompozicijom;
- alternate i close-up kadrovi bolje pokazuju containment i conduit odnose.

## Preostali kreativni jaz

Canonical usporedba i dalje pokazuje tri strukturna ograničenja koja runtime tuning sam ne može uvjerljivo riješiti:

1. **Arhitektura:** reference ima dublje arkade, bogatije volumene, vanjski pejzaž kroz otvore i više realnog prostornog parallaxa. Trenutni GLB ostaje znatno jednostavniji.
2. **Hero reactor craft:** reference ima više obrađenih prstena, finih spojeva, vijaka, slojeva stakla i bogatiju unutarnju jezgru. Runtime shader ne može stvoriti nedostajuću siluetu i geometrijski detalj.
3. **Exterior i materijalni macro detail:** postojeći matte i UV kadriranje ne daju dovoljno pejzažnog sadržaja u glavnim otvorima, a kameni mesh/UV planovi ostaju preveliki i pravilni.

Zbog toga rezultat jest bolji, ali još uvijek aktivira izričiti fail kriterij „clean prototype room umjesto reference-grade space”.

## Kompromisi

- Produkcijski GLB i Blender master nisu mijenjani; njihovi hashovi ostaju zaključani.
- Nije uveden bloom post-process, transmission/refraction ni novi draw-heavy volumetric sustav.
- Cijena poboljšanja je 15 dodatnih runtime tekstura (14 proceduralnih PBR mapa + 1 glow mapa), 2 sprite draw calla i 2 dodatne geometrije u renderer snapshotu.
- Packaged mjerenje ostaje oko 59,87–60,04 FPS, pa je vizualni dobitak opravdao mali runtime trošak.

## Review outputi

- `er-12a-runtime-hero.png`
- `er-12a-runtime-alternate.png`
- `er-12a-runtime-reactor-closeup.png`
- `er-12a-runtime-console.png`
- `er-11b-vs-er-12a-packaged.png`
- `reference-vs-er-12a.png`

## Što bi bilo potrebno za stvarni creative PASS

Sljedeći eventualni korak mora biti minimalan, ali stvarno art-authoring orijentiran: revizija produkcijskog GLB-a s dubljim arhitektonskim otvorima, boljim exterior UV/projectionom i dodatnim hero-reactor silhouette/detail slojem. To nije pokrenuto u ovom tasku; ER-12B ni ER-13 nisu započeti.
