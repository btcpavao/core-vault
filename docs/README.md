# Core Vault project specifications

Ovaj direktorij sadrži autoritativne produktne, dizajnerske, arhitekturne, interakcijske,
sigurnosne i implementacijske specifikacije za Core Vault. Ti su dokumenti sastavni dio
projekta, a ne vanjske ili neobvezne bilješke.

Prije svake značajne promjene aplikacije potrebno je pročitati i slijediti relevantne
specifikacije iz ovog direktorija. `01_VISION_AND_PHILOSOPHY.md` najviši je produktni dokument
i definira temeljnu viziju Core Vaulta. Kasniji dokumenti mogu postati tehnički precizniji,
ali ne smiju prešutno proturječiti toj viziji.

Ako se implementacija i dokumentacija ne slažu, nesklad se mora izričito istaknuti. Ne smije
se prešutno odabrati jedna strana. Postojeća funkcionalna Bitcoin Core integracija mora se
očuvati osim ako kasnija, odobrena specifikacija izričito zahtijeva promjenu.

## Hijerarhija specifikacija

1. `01_VISION_AND_PHILOSOPHY.md` — temeljna produktna vizija
2. `02_DESIGN_PRINCIPLES.md` — nepromjenjiva dizajnerska pravila
3. `03_TECHNICAL_ARCHITECTURE.md` — tehnička struktura softvera
4. `04_WORLD_BIBLE.md` — svijet Core Vaulta i prostorni jezik
5. `05_ROOM_DESIGN.md` — prostorije i njihove funkcije
6. `06_INTERACTION_DESIGN.md` — način interakcije sa svijetom
7. `07_BITCOIN_CORE_INTEGRATION.md` — mapiranje iskustva na Bitcoin Core
8. `08_ART_DIRECTION.md` — materijali, svjetlo, atmosfera, zvuk i animacija
9. `09_IMPLEMENTATION_ROADMAP.md` — redoslijed implementacije
10. `10_CODEX_RULES.md` — pravila budućeg razvoja uz pomoć AI-ja

Postojeći nenumerirani dokumenti ostaju povijesna, tehnička ili prototipska dokumentacija dok
se njihov status ne razriješi kroz odobrene specifikacije. Oni ne nadjačavaju gornju hijerarhiju.

## Aktivne arhitekturne odluke

- `RENDERER_DIRECTION_DECISION.md` — odobreni prijelaz s obveznih potpuno real-time 3D prostorija na renderer-neutralan sustav visokovjernih kinematičkih 2.5D scena sa selektivnim real-time elementima
