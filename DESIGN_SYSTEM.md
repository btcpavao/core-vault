# Core Vault UI — design system V1 i prostorni V2 sloj

> Izvorni V1 sustav u nastavku ostaje dokumentiran zbog očuvanog 2-od-3 tijeka. Aktivni prostorni shell koristi V2 sustav opisan u [docs/WORLD_ART_DIRECTION.md](docs/WORLD_ART_DIRECTION.md). V2 ne mijenja sigurnosne invarijante, RPC granice ni semantiku kontrola.

Design system prevodi nalaze iz `DESIGN_RESEARCH.md` u vlastiti, auditabilan vizualni i
interakcijski jezik. Ne kopira Bitcoin Design layout, ilustracije, tekstove ni komponente.

## Temeljni osjećaj

- tih, pouzdan i financijski ozbiljan
- topao, ali bez dekorativne razigranosti
- Bitcoin-specifičan kroz mentalne modele, ne kroz “crypto” estetiku
- tehnički detaljan tek na zahtjev
- default stanje privatno i local-only

V1 tijek nema trading elemente, tržišne cijene ni coin animacije. Prostorni V2 sloj koristi
plavu i zlatnu energiju samo kao čitljiv prikaz lokalnih podataka, ključeva, kanala ili aktivnog
artefakta. Referentne slike su lokalno optimizirani build asseti; aplikacija ih ne dohvaća s mreže.

## Centralizirani tokeni

Sve vrijednosti žive kao CSS custom properties u `:root`; komponente ne uvode proizvoljne
boje, razmake ili radijuse.

```css
:root {
  /* Color */
  --color-canvas: #f4f1eb;
  --color-surface: #fffefa;
  --color-surface-muted: #ece8df;
  --color-sidebar: #191816;
  --color-ink: #1d1b18;
  --color-ink-muted: #68635b;
  --color-ink-inverse: #faf8f2;
  --color-accent: #c65d19;
  --color-accent-hover: #a94c12;
  --color-success: #2f6b4f;
  --color-warning: #8a5a14;
  --color-danger: #a43a35;
  --color-info: #326a8c;
  --color-focus: #2f72b8;
  --color-divider: rgba(29, 27, 24, 0.12);

  /* Spacing: 4px base */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  /* Type */
  --font-ui: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 30px;
  --text-3xl: 42px;

  /* Shadow */
  --shadow-card: 0 0 0 1px rgba(0, 0, 0, 0.06),
    0 1px 2px -1px rgba(0, 0, 0, 0.06),
    0 12px 32px -18px rgba(27, 22, 17, 0.24);
  --shadow-card-hover: 0 0 0 1px rgba(0, 0, 0, 0.09),
    0 2px 4px -1px rgba(0, 0, 0, 0.08),
    0 16px 36px -18px rgba(27, 22, 17, 0.28);
}
```

## Typography

- System sans font izbjegava mrežni font zahtjev i prirodno izgleda na macOS-u, Windowsu
  i Linuxu. Root koristi antialiased smoothing.
- `h1` je 42/46, `h2` 30/36, `h3` 22/28, body 16/25, supporting text 14/21.
- Heading koristi `text-wrap: balance`; kratki body `text-wrap: pretty`.
- Iznosi, balance i fee koriste tabularne brojke. Address, fingerprint, descriptor i RPC
  koriste mono font, ali nikad za plain-language objašnjenje.
- Iznos ima snažnu hijerarhiju, jedinica je uz broj i screen reader dobiva cijeli izraz.

## Layout i spacing

- Desktop shell: 248 px sidebar + fleksibilni sadržaj, maksimalno 880 px za aktivni wizard.
- Ekran je jedna semantička `main` regija; sadržaj ima 40–64 px zračnosti.
- Forma ima vertikalni ritam 16 px, povezane kontrole 8 px, sekcije 32 px.
- Na uskim prozorima sidebar postaje vodoravni progress strip; sadržaj ostaje u prirodnom
  redoslijedu bez horizontalnog skrolanja.
- Setup je linearan. Aktivni ekran ima jedan vizualno dominantan primary CTA.

## Surfaces i border radius

- Card koristi `--radius-lg` i `--shadow-card`, bez teških obruba.
- Ugniježđeni panel s 8 px paddinga koristi radijus za 8 px manji od roditelja
  (`16 → 8`, `24 → 16`) kako bi radijusi bili koncentrični.
- Input zadržava 1 px outline jer je njegov obrub funkcionalan za pristupačnost.
- Separatori ostaju tanke linije; shadow se koristi samo za dubinu površina.

## Ikone

- Lucide line icons, najčešće 18 ili 20 px, stroke 1.75.
- Ikona nikada nije jedini status ili jedina oznaka kontrole.
- Funds: wallet/circle; signing wallet: key; vault/policy: shield/lock; coordinator:
  eye/file-search bez key simbola.
- Status koristi ikonu + riječ: `Check + Ready`, `AlertTriangle + Needs attention`,
  `XCircle + Blocked`.
- Dekorativne ikone imaju `aria-hidden`; icon-only button mora imati `aria-label` i 44 px hit area.

## Boje i semantička stanja

- Accent narančasta označava primarnu radnju, ne “vrijednost bitcoina”.
- Success, warning, danger i info uvijek dolaze s ikonom, naslovom i tekstom.
- Signet ima trajnu neutralno-plavu oznaku `Test network · No real bitcoin`.
- Blocking Mainnet stanje koristi danger surface, jasan STOP naslov i onemogućene mutacije.
- Kontrast teksta i kontrole cilja WCAG AA; muted tekst se ne koristi ispod 14 px.

## Buttons

| Tip | Namjena | Pravila |
| --- | --- | --- |
| Primary | jedina sljedeća glavna radnja | 48 px visina, accent fill, minimalno 44 px hit area |
| Secondary | korisna, ali ne dominantna radnja | surface fill + shadow ring |
| Quiet | Advanced, cancel, reveal | transparentno, vidljiv hover/focus |
| Danger | nepovratna ili sigurnosno kritična radnja | danger fill; nikada za običnu navigaciju |

Buttons koriste `scale(0.96)` na press, a prijelazi navode samo `scale`, `background-color`,
`box-shadow` ili `color`; nema `transition: all`. Disabled stanje zadržava čitljiv label i
objašnjenje izvan gumba zašto je nedostupno.

## Inputs

- Label je iznad inputa i ostaje vidljiv; placeholder nije label.
- Visina 48 px, radius 10 px, focus ring 3 px.
- Password input je uncontrolled, ima show/hide kontrolu i opis “šalje se samo lokalnom
  Bitcoin Coreu”; briše se nakon poziva.
- Address i path polja koriste mono font tek za vrijednost.
- Inline validacija govori što nije u redu i kako popraviti, ne samo “invalid”.

## Cards

### Signer card

- sadrži `K1` i prijateljski naziv `Signing wallet 1`
- prikazuje točno jedan aktualni zadatak: create, encrypt, backup ili ready
- status lista koristi riječi i ikone (`Wallet created`, `Encrypted`, `Backup created`)
- fingerprint/tpub nisu vidljivi dok korisnik ne otvori Advanced

### Transaction review card

- odvojene cjeline: `You are sending`, `To`, `Network fee`, `Remaining in vault`,
  `Required approvals`
- puna adresa je dostupna, user-selectable i kopirljiva samo u receive/review kontekstu
- edit se radi prije signature faze; nakon prvog potpisa promjena stvara novi draft

### Trust facts card

- prikazuje provjerljive činjenice: local connection, Signet, no remote server, telemetry off,
  keys handled by Core
- status nije marketinška tvrdnja nego rezultat backend provjere ili statički arhitekturni invariant

## Vault diagram

Tri signer čvora stoje lijevo/gore, policy čvor `2 of 3` u sredini, vault desno/dolje.
Linije prikazuju odnos, ne protok privatnih ključeva. Coordinator je zaseban watch-only
čvor ispod policyja. U signing stanju čvorovi prikazuju signed/pending tekst i ikonu.
Dijagram ima ekvivalentan screen-reader opis u DOM-u.

## Advanced technical panel

- Native `details/summary` gdje je moguće: keyboard i screen-reader ponašanje bez custom modala.
- Summary: `Show what Bitcoin Core is doing`.
- Otvoreni panel: plain-language objašnjenje, RPC method, wallet scope, redigirani argumenti,
  redigirani rezultat, trajanje.
- Passphrase, cookie, PSBT i raw hex nikada se ne prikazuju; panel kaže da je payload skriven.
- Descriptor/tpub/fingerprint prikaz označen je kao `Sensitive wallet metadata`.

## Warnings i security messages

Svaka poruka odgovara na:

1. što se dogodilo ili što će se dogoditi
2. jesu li sredstva sigurna / je li transakcija poslana
3. što korisnik radi sljedeće

`Info` objašnjava koncept; `Caution` traži pažnju; `Blocking` zaustavlja flow. Blocking
poruka nema “continue anyway”. Kritična odluka koristi razumljiv sažetak i CTA, ne
legalistički checkbox.

## Privacy controls

- Balance je skriven defaultom nakon reload-a i ima `Show/Hide balance` kontrolu.
- Address se prikazuje samo u receive i transaction review kontekstu.
- Descriptor, tpub i fingerprint pojavljuju se samo u Advanced ili eksplicitnom exportu.
- Public config export prije save dijaloga objašnjava: ne može potrošiti, može pratiti wallet.
- Nema automatskih external linkova, exchange-rate zahtjeva ili explorera.

## Dialogs

- Preferira se inline potvrda kada ne zahtijeva blokiranje cijelog konteksta.
- Modal se koristi samo za kritični review ili pomoć; ima naslov, opis, jedan primary i
  jedan cancel, `role="dialog"`, `aria-modal`, početni fokus i vraćanje fokusa pozivatelju.
- OS file dialog koristi Tauri za backup/export; cancellation je neutralno stanje, ne error.

## Loading i empty states

- Loading control zadržava label (`Creating K1…`) i ima `aria-live="polite"` status.
- Spinner nije jedina informacija; operacija nema lažni progress postotak.
- Empty state govori što će korisnik dobiti i nudi jednu radnju.
- U `prefers-reduced-motion: reduce` nestaju dekorativni prijelazi i press scale.

## Error states

| Razina | Primjer | Ponašanje |
| --- | --- | --- |
| Recoverable | Core nije pokrenut, user cancel file dialog | čuva state, nudi Retry/Open settings |
| Data validation | remote host, pogrešan wallet, invalid address | odbija prije mutacije i fokusira polje |
| Blocking security | Mainnet, private descriptor, coordinator ima private keys | STOP surface, mutacije disabled, bez overridea |
| Transaction | insufficient funds/signatures, locked signer | potvrđuje da nije broadcastano, pokazuje konkretan sljedeći korak |

Izvorni RPC error pojavljuje se samo u Advanced dijelu poruke. Error tekst nikada ne
ponavlja passphrase, cookie, PSBT ili raw hex.

## Motion

- Interaktivna stanja koriste interruptible CSS transitions od 120–180 ms.
- Novi wizard sadržaj može ući s blagim `opacity + translateY(8px)` staggerom; ne animira
  se cijeli prozor niti se motion koristi za kritični status.
- Context icon swap koristi `scale 0.25 → 1`, `opacity 0 → 1`, `blur 4px → 0` s
  `cubic-bezier(0.2, 0, 0, 1)` jer nema motion dependencyja.
- Nema `transition: all` ni preventivnog `will-change`.

## Accessibility Definition of Done

- sve funkcije dostupne tipkovnicom, logičan DOM/tab redoslijed
- vidljiv 3 px focus ring i skip link
- 44 × 44 px minimalna interaktivna površina
- status ima ikonu + tekst + boju
- inputi imaju label, description i error vezan preko `aria-describedby`
- dinamički statusi koriste `aria-live`, bez preglasnog ponavljanja
- layout radi na 200% zoomu i s većim system fontom
- screen reader može razumjeti vault dijagram i signer napredak bez vizuala
- `prefers-reduced-motion` se poštuje
- contrast se provjerava na svim semantičkim površinama
