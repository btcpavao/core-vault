# Core Vault — diegetički V2 vizualni sustav

## Referentni izvori

Dvije vizualne cjeline s btcpavao.com služe isključivo kao konceptualna referenca:

- [The Long Road Back to Bitcoin Core](https://btcpavao.com/en/bitcoin-core/the-long-road-back-to-bitcoin-core/)
- [Kako Bitcoin Core generira entropiju kada napravimo novi wallet](https://btcpavao.com/hr/bitcoin-core/kako-bitcoin-core-generira-entropiju-kada-napravimo-novi-wallet/)

Pregledane su sve slike u oba članka. Iz njih su izdvojena apstraktna pravila svijeta — mediteranski
vapnenac i more, brončani spojevi, prozirne komore, plavi tokovi podataka, zlatne linije ključeva
i mirno dnevno svjetlo. Nijedna slika iz članaka nije spremna runtime pozadina niti gotova UI scena.
Originalna, funkcijski dizajnirana master scena smije biti dio produkcijskog paketa samo kada je
pripremljena za semantičko stanje, dubinu, interakciju i kontekstualno precizno sučelje.

Odobreni smjer je renderer-neutralni **Cinematic 2.5D Scene System**. Prostorija može kombinirati
visokovjernu master scenu, foreground/mid-ground/background slojeve, dubinu, semantičke maske,
maske svjetla i emisije, kontrolirani paralaks, compositing, shadere, selektivnu real-time geometriju,
zvuk i kontekstualni DOM. Three.js, R3F, Blender i GLB ostaju dopušteni, ali nisu obvezni za svaku
prostoriju.

Svi slojevi moraju potjecati iz jedne koherentne vizualne kompozicije. Perspektiva, materijali,
smjer svjetla, reflektirano svjetlo, atmosfera i dubina moraju se ponašati kao jedan fizički svijet.
Zabranjen je povratak na obrazac „WebP pozadina + CSS/vektorski objekti”, generički SVG sjaj,
plutajuće kartice ili proizvoljne nevidljive hotspotove koji izgledaju odvojeno od scene.

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

## Trenutačna implementacija i odobreni sljedeći dokaz

- Postojeće DOM/CSS i Three.js/R3F scene ostaju povijesni prototipovi, tehnički dokaz i izvor
  ponovne uporabe; ne definiraju obveznu arhitekturu budućih prostorija.
- `src/components/scenes/DiegeticScenes.tsx` sadrži postojeće prostorne primitive i ne smije se
  automatski proširivati na nove prostorije prije novog fidelity gatea.
- `src/components/world.tsx` zadržava kontekstualne sigurnosne panele i privremene primitive
  za prostorije koje još nisu migrirane.
- `src/SpatialApp.tsx` orkestrira prostorije i postojeće Core funkcije.
- `src/spatial.css` definira materijale, kompozicije, motion i responsive raspored.
- Budući runtime asseti ostaju lokalni i semantički registrirani; ne smiju ovisiti o mreži.
- Sljedeći jedini produkcijski zadatak je Engine Room cinematic 2.5D Proof of Fidelity s jednom
  near-final master scenom i istinitim offline/syncing/ready/network-disabled/new-block stanjima.

## Stanje migracije

| Status | Prostorije |
| --- | --- |
| Postojeći diegetički/prostorni prototipovi i podatkovno vezani dokaz | Glavna dvorana, Radionica, Strojarnica |
| Funkcionalno očuvane, vizualno privremene | Komora trezora, Arhiv, Komunikacije, Zvjezdarnica, Knjižnica |

Ne proširuj `SceneShell` na drugu prostoriju prije nego što Strojarnica dokaže novi cinematic 2.5D
pipeline pri odobrenoj vizualnoj kvaliteti. Bitcoin RPC, wallet, backup, restore i PSBT tokovi ostaju
nepromijenjeni i izvan renderer autoriteta.
