# Core Vault — prostorni V2 vizualni jezik

## Referentni izvori

Prostorni presentation sloj izveden je iz dvije vizualne cjeline s btcpavao.com:

- [The Long Road Back to Bitcoin Core](https://btcpavao.com/en/bitcoin-core/the-long-road-back-to-bitcoin-core/)
- [Kako Bitcoin Core generira entropiju kada napravimo novi wallet](https://btcpavao.com/hr/bitcoin-core/kako-bitcoin-core-generira-entropiju-kada-napravimo-novi-wallet/)

Pregledane su sve slike u oba članka. Ponavljajući motivi postali su pravila svijeta: mediteranski
vapnenac i more, brončani spojevi, prozirne komore, plavi blokovi i tokovi podataka, zlatne linije
ključeva i determinističkih korijena te mirno dnevno svjetlo.

## Mapiranje prostorija

| Prostorija | Prostorni motiv | Funkcionalno značenje |
| --- | --- | --- |
| Glavna dvorana | četiri kamena prolaza i središnji stakleni trezor | navigacija i odabir walleta |
| Radionica | zaštićeni korijen, ključ i tri odvojene kapsule | odabir single-signature ili 2-od-3 politike |
| Komora trezora | koncentrična brončana vrata i dva svjetlosna kanala | stanje, primitak, slanje i backup |
| Arhiv | recovery kovčeg i kapsule u kamenim nišama | izrada kopije i dokaz povrata |
| Komunikacije | prozirna komora s plavim ulazom i zlatnim izlazom | receive adresa i PSBT prijedlog |
| Strojarnica | veliki lokalni stroj s vidljivim tokovima | P2P stanje, sinkronizacija i Core metrike |
| Zvjezdarnica | bazen blokova uz arhiv cijelog lanca | chain, wallet i RPC opažanja |
| Knjižnica | zid plavih blokova i osvijetljene stele | izvori, ograničenja i status projekta |

## Pravila interakcije

- Prostorija je primarno sučelje; artefakti su semantički `button` elementi s jasnim imenima.
- Forma se pojavljuje tek nakon odabira artefakta, u kontekstualnoj kamenoj/staklenoj konzoli.
- Globalna navigacija je pomoćni, uvijek dostupan fallback i nije glavni način kretanja.
- Status plava označava podatke, vezu i verifikaciju; zlatna označava ključ, identitet ili izlaz.
- Kritične radnje i dalje koriste konvencionalne potvrde, eksplicitan tekst i odvojeni broadcast.
- Reduced motion zaustavlja dolaske prostorija, lebdeću prašinu, protok energije i rotacije.

## Implementacija

- `src/components/world.tsx` sadrži zajedničke primitive: `WorldScene`, `ArtifactButton`,
  `ContextOverlay`, `EnergyCore`, `ObservationBasin` i `RecessedLedger`.
- `src/SpatialApp.tsx` orkestrira prostorije i postojeće Core funkcije.
- `src/spatial.css` definira materijale, kompozicije, motion i responsive raspored.
- `src/assets/world/` sadrži lokalne, optimizirane WebP scene. Nema runtime mrežnih asseta.
