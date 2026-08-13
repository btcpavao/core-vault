# Core Vault UI — user test plan V1

## Istraživačko pitanje

Može li osoba koja zna koristiti obični Bitcoin Core wallet sigurno završiti 2-of-3 Signet
tijek bez Debug Consolea i zatim vlastitim riječima objasniti uloge tri signera, vaulta,
coordinatora, backupa i dvaju potpisa?

Brzina nije primarna metrika. Primarne metrike su siguran završetak, razumijevanje i
prepoznavanje nepovratnih odluka.

## Persona i uzorak

Persona:

> Osoba zna instalirati Bitcoin Core, napraviti obični wallet, primiti i poslati bitcoin,
> ali nikada nije koristila multisig, descriptor, RPC ili PSBT.

Prvi krug: 5 moderiranih sudionika. Poželjno je uključiti barem jednu osobu koja koristi
tipkovnicu ili povećani prikaz te različite razine iskustva unutar zadane persone.

## Sigurno testno okruženje

- odvojeni Bitcoin Core 26+ profil, samo Signet, `server=1`
- unaprijed sinkroniziran node i mala količina Signet coina
- jedinstveni wallet nazivi po sesiji i prazna test backup mapa
- screen recording samo uz pristanak; bez snimanja password inputa ili file dijaloga
- moderator nikad ne traži stvarni seed, key, wallet backup ili Mainnet adresu
- prije početka naglasiti: testira se proizvod, ne sudionik; test coin nema tržišnu vrijednost

## Zadatak za sudionika

> Napravite 2-of-3 vault na Signetu, primite testna sredstva i pošaljite dio sredstava
> koristeći dva potpisa. Zamislite da taj setup želite moći rekonstruirati i bez ove aplikacije.

Ne objašnjavati descriptor, RPC ili PSBT prije zadatka. Ne pomagati osim ako sudionik potpuno
zapne ili bi napravio radnju izvan Signeta.

## Scenarij

1. **Orijentacija** — s welcome ekrana objasniti što korisnik misli da će se napraviti.
2. **Connection** — spojiti lokalni Core; po potrebi pronaći Advanced settings.
3. **K1/K2/K3** — kreirati i enkriptirati svaki signing wallet.
4. **Vault review** — prije CTA-a objasniti što znači izgubiti jedan odnosno dva ključa.
5. **Backup** — izraditi tri Core backupa i public config; objasniti razliku.
6. **Receive** — generirati adresu, kopirati je i prepoznati skriven balance.
7. **Fund** — moderator/faucet šalje unaprijed dogovorene Signet sredstva; korisnik osvježava.
8. **Send/review** — unijeti primatelja, 5.000 sats i fee; provjeriti sve review stavke.
9. **Sign** — odabrati bilo koja dva različita signera i objasniti zašto coordinator nije dovoljan.
10. **Broadcast/change** — potvrditi finalnu radnju, kopirati txid i objasniti remaining/change.

Rotirati signer parove između sesija: K1+K2, K1+K3, K2+K3.

## Failure-state zadaci

Nakon happy patha pokazati najviše dva scenarija po sudioniku kako se sesija ne bi pretvorila
u ispit:

- Core ugašen ili bez `server=1`
- remote RPC host
- Mainnet chain hard stop
- kriva wallet lozinka / locked signer
- otkazani file dialog
- nedostajući public backup
- invalid destination ili insufficient funds
- pokušaj istim signerom dati drugi potpis

Promatrati razumije li poruka: što se dogodilo, jesu li sredstva/transakcija sigurni i što
sljedeće napraviti.

## Moderatorski protokol

- Koristiti neutralno: “Što očekujete da će se dogoditi?”
- Ako sudionik šuti, podsjetiti na think-aloud, ali ne imenovati kontrolu.
- Kod zastoja prvo zabilježiti očekivanje i pokušaje. Pomoći tek nakon 60–90 sekundi ili na
  izričit zahtjev.
- Zaustaviti test ako se pojavi Mainnet, stvarni privatni podatak ili nejasno stanje broadcasta.
- Nakon pomoći označiti ostatak zadatka kao assisted, ne failed.

## Što bilježimo

| Signal | Primjer bilješke |
| --- | --- |
| Zastoj | vrijeme, ekran, zadnja radnja, što traži pogledom |
| Mentalni model | kako opisuje signer, vault i coordinator |
| Očekivanje | što misli da će CTA napraviti i može li se poništiti |
| Nesigurnost | lozinka, backup lokacija, public config, broadcast |
| Pogrešan klik | element koji izgleda interaktivno ili nevidljiv CTA |
| Progressive disclosure | kada i zašto otvara RPC panel |
| Recovery | može li iz error poruke odrediti sljedeći korak |
| Accessibility | tab redoslijed, fokus, čitanje statusa, zoom |

## Završna comprehension pitanja

1. Koliko ključeva postoji i koliko ih treba za trošenje?
2. Što se događa ako izgubite K2? A ako izgubite K2 i K3?
3. Može li coordinator sam potrošiti sredstva? Zašto?
4. Koja je razlika između `K1 backup` i `public vault configuration`?
5. Gdje su se nalazili privatni ključevi i tko je potpisao?
6. Što se promijenilo nakon prvog potpisa?
7. Kamo je otišao ostatak nakon plaćanja?
8. Što biste trebali sačuvati kada biste obrisali Core Vault UI?

## Kriteriji uspjeha prvog kruga

- 4/5 sudionika završavaju bez kritične moderatorske intervencije
- 5/5 nikad ne pokušavaju koristiti Mainnet nakon upozorenja
- 4/5 točno objasne “2 of 3”, coordinator bez ključa i updated transaction nakon prvog potpisa
- 4/5 razlikuju signing-wallet backup od public configa
- 5/5 prije broadcasta identificiraju destination, amount i fee
- niti jedan sudionik ne vjeruje da demo predstavlja stvarnu Core vezu
- tipkovnički korisnik može dovršiti svaki korak i uvijek zna gdje je fokus

Jedna kritična pogreška — npr. uvjerenje da je public config dovoljan za potpis ili da je
Mainnet dopušten — blokira napredovanje prema sljedećoj fazi bez obzira na prosjek.

## Analiza i prioritizacija

- **P0 sigurnost:** može dovesti do pogrešne mreže, gubitka pristupa, secret leakagea ili
  nejasnog broadcasta; odmah zaustavlja release.
- **P1 completion:** korisnik ne može završiti acceptance flow bez pomoći.
- **P2 razumijevanje:** flow završava, ali ključni mentalni model je pogrešan.
- **P3 polish:** čitljivost, ritam, wording ili vizualni affordance bez sigurnosne posljedice.

Za svaki nalaz zapisati ekran, opažanje, korisnikovu doslovnu kratku izjavu, očekivanje,
posljedicu, severity i predloženu najmanju promjenu. Nakon izmjene ponovno testirati isti
zadatak s novim sudionicima; ne računati autorovu procjenu kao user-test dokaz.
