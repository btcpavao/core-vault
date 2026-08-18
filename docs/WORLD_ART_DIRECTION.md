# Core Vault — diegetički V2 vizualni sustav

## Referentni izvori

Dvije vizualne cjeline s btcpavao.com služe isključivo kao konceptualna referenca:

- [The Long Road Back to Bitcoin Core](https://btcpavao.com/en/bitcoin-core/the-long-road-back-to-bitcoin-core/)
- [Kako Bitcoin Core generira entropiju kada napravimo novi wallet](https://btcpavao.com/hr/bitcoin-core/kako-bitcoin-core-generira-entropiju-kada-napravimo-novi-wallet/)

Pregledane su sve slike u oba članka. Iz njih su izdvojena apstraktna pravila svijeta — mediteranski
vapnenac i more, brončani spojevi, prozirne komore, plavi tokovi podataka, zlatne linije ključeva
i mirno dnevno svjetlo. Nijedna slika iz članaka nije runtime pozadina niti gotova UI scena.

Glavna dvorana, Radionica i Strojarnica crtaju se kao izvorne slojevite DOM/CSS kompozicije.
Pozadina, arhitektura, svjetlo, čestice i interaktivni objekti odvojeni su slojevi, pa se stanje
Bitcoin Corea može prikazivati kroz sam prostor umjesto kroz dashboard postavljen preko slike.

## Mapiranje prostorija

| Prostorija | Prostorni motiv | Funkcionalno značenje |
| --- | --- | --- |
| Glavna dvorana | šest fizičkih kamenih prolaza i središnji trezorski podij | navigacija i odabir walleta |
| Radionica | središnja kovačnica, okvir trezora, ključ i mehanizmi politike | konstrukcija trezora i ulaz u očuvani multisig tok |
| Komora trezora | koncentrična brončana vrata i dva svjetlosna kanala | stanje, primitak, slanje i backup |
| Arhiv | recovery kovčeg i kapsule u kamenim nišama | izrada kopije i dokaz povrata |
| Komunikacije | prozirna komora s plavim ulazom i zlatnim izlazom | receive adresa i PSBT prijedlog |
| Strojarnica | veliki lokalni stroj s vidljivim tokovima | P2P stanje, sinkronizacija i Core metrike |
| Zvjezdarnica | bazen blokova uz arhiv cijelog lanca | chain, wallet i RPC opažanja |
| Knjižnica | zid plavih blokova i osvijetljene stele | izvori, ograničenja i status projekta |

## Pravila interakcije

- Prostorija je primarno sučelje; vrata, artefakti, postolja i prekidači semantički su `button` elementi s jasnim imenima.
- Forma se pojavljuje tek nakon odabira artefakta, u kontekstualnoj kamenoj/staklenoj konzoli.
- Globalna navigacija skrivena je iza indeksa prostorija; ostaje tipkovnički dostupan fallback, ali nije glavni način kretanja.
- Status plava označava podatke, vezu i verifikaciju; zlatna označava ključ, identitet ili izlaz.
- Kritične radnje i dalje koriste konvencionalne potvrde, eksplicitan tekst i odvojeni broadcast.
- Reduced motion zaustavlja dolaske prostorija, lebdeću prašinu, protok energije i rotacije.

## Implementacija

- `src/components/scenes/DiegeticScenes.tsx` sadrži izvorne prostorne primitive za tri potpuno
  izvedene prostorije: `SceneShell`, `HallPortal`, `VaultPedestal`, `WorkshopArtifact`,
  `WorkshopForge` i `CoreReactor`.
- `src/components/world.tsx` zadržava kontekstualne sigurnosne panele i privremene primitive
  za prostorije koje još nisu migrirane.
- `src/SpatialApp.tsx` orkestrira prostorije i postojeće Core funkcije.
- `src/spatial.css` definira materijale, kompozicije, motion i responsive raspored.
- `src/assets/world/` definira ugovor za buduće originalne modularne elemente; trenutačne tri
  završene prostorije ne ovise o rasterskim pozadinama ni o runtime mrežnim assetima.

## Stanje migracije

| Status | Prostorije |
| --- | --- |
| Potpuno diegetičke i podatkovno vezane | Glavna dvorana, Radionica, Strojarnica |
| Funkcionalno očuvane, vizualno privremene | Komora trezora, Arhiv, Komunikacije, Zvjezdarnica, Knjižnica |

Sljedeća iteracija proširuje isti `SceneShell` i fizički jezik na Komoru trezora, Arhiv i
Komunikacije bez promjene postojećih RPC, wallet, backup, restore ili PSBT tokova.
