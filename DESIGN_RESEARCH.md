# Core Vault UI — Bitcoin Design research

Datum pregleda: 12. kolovoza 2026.

## Opseg i autoritet

Primarni UX autoritet za Core Vault je [Bitcoin Design Guide](https://bitcoin.design/guide/),
uz službeni [BitcoinDesign/Guide repository](https://github.com/BitcoinDesign/Guide),
referentne flowove, dostupne Figma prototipe i Bitcoin Core App case study. Guide je
evoluirajući community resurs, pa su otvoreni issueovi tretirani kao aktivne rasprave, a ne
kao završena pravila. Sigurnosni invarijanti, ponašanje Bitcoin Corea i local-only model
imaju prednost kada nastane konflikt.

Pregledani su konkretni ekrani i prijelazi za Bitcoin Core wallet creation, savings
onboarding, inheritance wallet creation, cosigner onboarding, multi-key backup,
transaction review, signing, recovery, key replacement i succession. Figma datoteke koje
Guide povezuje potvrđene su kao dostupne, ali njihov sadržaj niti asseti nisu kopirani.

## Relevant Bitcoin Design principles

| Princip | Što znači | Izvor | Relevancija za Core Vault | Primjena |
| --- | --- | --- | --- | --- |
| Self-custody | Korisnik zadržava kontrolu; proizvod ne uvodi skrbnika. | [Design principles](https://bitcoin.design/guide/getting-started/principles/) | Core Vault ne smije postati wallet ni signer. | Bitcoin Core jedini drži i koristi ključeve; UI je zamjenjiv coordinator. |
| Security | Sigurnost je uporabljiv proces, ne skrivena postavka; dodatna zaštita opravdava ciljanu frikciju. | [Design principles](https://bitcoin.design/guide/getting-started/principles/), [Wallet security](https://bitcoin.design/guide/daily-spending-wallet/security/) | Multisig povećava sigurnost samo ako korisnik razumije i napravi sve backupe. | Linearni checkpointovi, tehnički hard stopovi, razumljive posljedice gubitka jednog ili dvaju ključeva. |
| Inclusion | Plain language i pomoć moraju biti dostupni bez pretpostavke o descriptorima, RPC-u ili PSBT-u. | [Design principles](https://bitcoin.design/guide/getting-started/principles/), [Accessibility](https://bitcoin.design/guide/designing-products/accessibility/) | Persona zna obični Core wallet, ali ne multisig termine. | “Signing wallet”, “vault”, “approval” i “public configuration” prije tehničkih naziva; tehnički termini su u Advanced panelu. |
| Interoperability | Otvoreni standardi, import/export i mogućnost izlaska grade povjerenje i sprječavaju lock-in. | [Interoperability](https://bitcoin.design/guide/designing-products/interoperability/) | Gubitak Core Vault aplikacije ne smije ugroziti setup. | Standardni checksummed descriptori, javna dokumentirana JSON schema, Bitcoin Core wallet backup i budući PSBT file/QR adapteri. |
| Transparency | Korisnik treba razumjeti tko ima kontrolu i moći provjeriti što aplikacija radi. | [Design principles](https://bitcoin.design/guide/getting-started/principles/), [Bitcoin Core App case study](https://bitcoin.design/guide/case-studies/bitcoin-core-app/) | “Jednostavno izvana, Core transparentno iznutra” je glavni proizvodni princip. | Svaki veći korak ima kratko objašnjenje i proširivi, sanitizirani RPC zapis s metodom, relevantnim argumentima i rezultatom. |
| Privacy | Privatnost je default; prikazuje se i dijeli samo nužno. | [Wallet privacy](https://bitcoin.design/guide/how-it-works/wallet-privacy/) | Balance, adrese, fingerprinti, tpubovi i descriptori otkrivaju wallet metadata. | Skriven balance, adrese samo u receive/review kontekstu, descriptor/fingerprint samo u Advanced, bez trećih strana, explorera, analyticsa ili telemetryja. |
| Decentralization | Ne stvarati obveznog posrednika ili vlastiti servis između korisnika i mreže. | [Design principles](https://bitcoin.design/guide/getting-started/principles/) | Cloud coordinator bi promijenio threat model. | Samo lokalni Core RPC i lokalni broadcast; aplikacija nema backend servis. |
| Progressive security | Za štednju je prihvatljiva veća frikcija, ali treba odgovarati iskustvu i vrijednosti. | [Savings wallet](https://bitcoin.design/guide/savings-wallet/), [Private key schemes](https://bitcoin.design/guide/how-it-works/private-key-management/overview/) | 2-of-3 je zahtjevniji od single-siga i nije univerzalni početni wallet. | Jasno ga predstavljamo kao Signet vježbu za korisnika koji već zna obični Core wallet; V1 ne tvrdi da je setup spreman za stvarni bitcoin. |
| Research-led design | Uspjeh se mjeri zadovoljenom potrebom i razumijevanjem, ne količinom funkcija. | [Conducting research](https://bitcoin.design/guide/designing-products/user-research/), [Usage life cycle](https://bitcoin.design/guide/designing-products/usage-life-cycle/) | Glavna hipoteza je ponašajna: može li korisnik sigurno završiti bez Debug Consolea? | Jedna test persona, konkretan end-to-end zadatak, observation plan i comprehension kriterij u `USER_TEST_PLAN.md`. |

## Vizualni jezik

[Visual language](https://bitcoin.design/guide/getting-started/visual-language/) naglašava da ne
postoji jedna obvezna Bitcoin estetika. Core Vault zato ne kopira narančastu bitcoin.design
stranicu, Figma UI kit ni ilustracije. Vlastiti identitet je tih, topao i profesionalan:
neutralne površine, jedna prigušena Bitcoin narančasta kao akcijski akcent, jasna tipografska
hijerarhija i funkcionalni line-art simboli za sredstva, signing wallete i policy.

Stvarni referentni ekrani pokazali su korisne strukturne obrasce:

- Bitcoin Core App flow map eksplicitno modelira odluke, napredne grane, uspjeh i greške,
  umjesto samo sretnog puta.
- Multi-key backup grafika razdvaja “private key backups” i “wallet configuration” kao dva
  nužna, ali sigurnosno različita artefakta.
- Transaction review ekran stavlja iznos, primatelja i fee u tri čitljive cjeline s
  mogućnošću uređivanja prije jednog primary CTA-a.
- Signing ekran govori “2 signatures required” i prikazuje pojedine signere kao slotove sa
  statusom ili radnjom, umjesto da od korisnika traži razumijevanje PSBT-a.

## Mentalni model Core Vaulta

Default sloj uvijek uči ovaj redoslijed:

1. **Signing wallet** drži jedan ključ i Bitcoin Core ga koristi za potpis.
2. **Vault** je pravilo: bilo koja dva od tri ključa mogu potrošiti bitcoin.
3. **Coordinator** prati vault i priprema transakcije, ali nema privatni ključ.
4. **Transaction approval** je potpis jednog signing walleta; dva odobrenja dovršavaju transakciju.

Descriptor, tpub, fingerprint, derivation path, PSBT, witness script i RPC nisu preduvjeti
za odluku. Ostaju potpuno provjerljivi u Advanced sloju.

## Reference-flow observations

### Onboarding

- [Usage life cycle](https://bitcoin.design/guide/designing-products/usage-life-cycle/) traži
  brzo formiranje pouzdanog mentalnog modela i odgovore na “što mogu izgubiti?” i “mogu li
  izaći?”. Početni ekran zato prvo priča “Personal Vault” priču, zatim pokazuje 2-of-3.
- [Savings wallet onboarding](https://bitcoin.design/guide/savings-wallet/) unaprijed pokazuje
  cijeli key setup i zatim obrađuje jedan ključ po ekranu. Core Vault koristi isti linearni
  ritam, bez upfront predavanja o descriptorima.
- [Bitcoin Core App case study](https://bitcoin.design/guide/case-studies/bitcoin-core-app/)
  segmentira nove, povremene, iskusne i developer korisnike. Naša persona je između
  povremenog i iskusnog: poznaje Core GUI, ali nije multisig developer.

### Wallet creation

- [Inheritance wallet creation](https://bitcoin.design/guide/inheritance-wallet/wallet-creation/)
  koristi tri velika zadatka: konfiguracija, dodavanje ključeva, review/finalize. Unutar
  zadatka key slotovi jasno pokazuju što nedostaje.
- Prije finalizacije pokazuje se kompletno pravilo i svi ključevi. Core Vault dodaje
  eksplicitne posljedice: jedan izgubljeni ključ je toleriran; dva mogu zaključati sredstva.
- Budući templateovi trebaju biti story-first (`Personal Vault`, `Family Vault`,
  `Business Treasury`, `Recovery Vault`, `Inheritance Vault`), ali V1 prikazuje samo
  `Personal Vault — 2-of-3 Native SegWit`.

### Backup

- [Bitcoin backups](https://bitcoin.design/guide/how-it-works/backups/) definira backup kao
  informacije potrebne za obnovu izvan aplikacije i naglašava threat-model ovisnu strategiju.
- [Inheritance wallet backup](https://bitcoin.design/guide/inheritance-wallet/backup/)
  jasno razdvaja privatne key backupe od descriptor konfiguracije. Konfiguracija ne može
  trošiti, ali je kritična za rekonstrukciju i privatnosno je osjetljiva jer omogućuje
  praćenje cijelog walleta.
- Otvoreni [issue #1057](https://github.com/BitcoinDesign/Guide/issues/1057) potvrđuje da se
  detaljna preporuka za descriptor/multisig config backup još razmatra. V1 zato ne propisuje
  fizičku strategiju: izrađuje lokalne Core wallet backupe, otvoreni public JSON i jasno
  objašnjava razliku.
- Backup je blokirajući creation checkpoint: K1, K2, K3 i public config moraju biti označeni
  dovršenima prije receive testa.

### Multi-key setup

- [Multi-key](https://bitcoin.design/guide/how-it-works/private-key-management/multi-key/)
  traži različite ključeve, backup svakog ključa te backup svih extended public keys,
  fingerprinta i derivacijskih podataka. Private key se ne razmjenjuje.
- [Shared wallet](https://bitcoin.design/guide/shared-wallet/) daje kratak welcome,
  objašnjenje sheme, vizualni napredak svakog ključa i eksplicitnu završnu potvrdu.
- Signing walleti su vizualno isti tip objekta; vault policy je zasebna centralna pločica;
  coordinator je treća vrsta objekta i nikad se ne prikazuje kao “četvrti ključ”.

### Cosigner onboarding i signing

- [Cosigner onboarding](https://bitcoin.design/guide/inheritance-wallet/onboarding-cosigners/)
  razlikuje import konfiguracije od aktivacije signera i koristi contextual task list.
- [Inheritance signing flow](https://bitcoin.design/guide/inheritance-wallet/making-changes/)
  prikazuje transaction detail, tri signer slota, broj prikupljenih potpisa te PSBT sharing
  tek kada je potreban. To je temelj apstrakcije **Add signature**.
- V1 metoda ispod apstrakcije je “Local Bitcoin Core wallet”. Budući adapteri su “PSBT
  file”, “USB” i “QR”; informacijska arhitektura ne pretpostavlja da je signer zauvijek lokalni.

### Transaction creation i review

- [Sending bitcoin](https://bitcoin.design/guide/daily-spending-wallet/sending/) traži
  jednostavan unos primatelja i iznosa, transparentan fee te obvezan review prije finalnog
  pristanka. Napredne opcije ne pripadaju default flowu.
- Review prikazuje: iznos, odredište, network fee, procijenjeni ostatak i “2 of 3 approvals”.
  Address se može proširiti/kopirati, ali se ne očekuje validacija raw PSBT-a.
- [Units & symbols](https://bitcoin.design/guide/designing-products/units-and-symbols/)
  predlaže dosljedne jedinice, čitljive grupe i tabularne/monospace brojke. Signet test koristi
  sats kao primarnu, BTC kao sekundarnu vrijednost; nema fiat API-ja.

### Receiving

- [Receiving bitcoin](https://bitcoin.design/guide/daily-spending-wallet/requesting/receiving/)
  tretira čekanje kao stanje, ne kao novu korisničku radnju.
- [Wallet privacy](https://bitcoin.design/guide/how-it-works/wallet-privacy/) preporučuje novu
  adresu za svaki receive. Core Vault generira novu coordinator adresu na eksplicitni zahtjev,
  skriva je na drugim ekranima i ne šalje je exploreru.

### Recovery i inheritance

- [Succession](https://bitcoin.design/guide/inheritance-wallet/succession/) pokazuje da
  recovery počinje ljudskim uputama i wallet konfiguracijom, zatim aktivacijom signera, tek
  potom transakcijom. Tehnologija bez dokumentacije i društvenog procesa nije recovery plan.
- [Making changes](https://bitcoin.design/guide/inheritance-wallet/making-changes/) tretira
  key replacement kao novi wallet + novi backup + prijenos sredstava, a promjene su jasno
  istaknute u reviewu.
- V1 ne implementira recovery/import ni inheritance. Design system ipak koristi policy,
  signer i timeline komponente koje se kasnije mogu proširiti bez izlaganja script jezika.

### Error recovery

- [Sending errors](https://bitcoin.design/guide/daily-spending-wallet/sending/#errors) traži:
  što se dogodilo, status sredstava, kako popraviti i što dalje.
- Otvoreni [issue #505](https://github.com/BitcoinDesign/Guide/issues/505) dodatno predlaže
  razlikovanje user, data, service i application problema te jasne action kategorije.
- Svaka Core Vault greška ima tri sloja: plain-language problem, rečenicu “sredstva su
  sigurna / transakcija nije poslana” kada je istinita, i jednu sljedeću radnju. Izvorni RPC
  code/message je u Advanced panelu.

## Core Vault mapping

| Core Vault ekran | Bitcoin Design pattern | Konkretna primjena |
| --- | --- | --- |
| Welcome / Create Vault | usage life cycle + savings/shared onboarding | Vault story, 2-of-3 dijagram, Signet ograničenje, jedan CTA |
| Bitcoin Core connection | transparency + usable security | Connected locally, Signet, no remote servers, telemetry off, private keys handled by Core |
| Create K1/K2/K3 | linear key-slot onboarding | jedan signing wallet po koraku; create → encrypt → ready; detalji progresivno |
| Vault review | wallet creation finalize | sva tri signera, 2-of-3 posljedice i razumljivi confirmation CTA |
| Create coordinator | multi-key mental model | zaseban watch-only objekt bez ključa; descriptor samo Advanced |
| Backup checkpoint | multi-key backup components | K1/K2/K3 private-capability backupi odvojeni od privacy-sensitive public configa |
| Receive test | receiving + privacy | nova Signet adresa, skriven balance, lokalna provjera primitka |
| Create transaction | simple send flow | recipient, sats, fee rate; bez coin controla i PSBT stringa |
| Review transaction | review & approval | amount, destination, fee, remaining, required approvals; edit prije potpisa |
| Add signature | multi-key signer slots | tri signing walleta, status potpisa, “needs one more signature”; local Core metoda |
| Broadcast | final consent + success | ponovni sažetak prije nepovratne radnje, lokalni txid nakon uspjeha |
| Advanced RPC | progressive disclosure + transparency | metoda, redigirani argumenti, rezultat i plain-language tumačenje |
| Errors | payment error recovery | problem, sigurnost sredstava, sljedeća radnja, RPC detalj |

## Deliberate deviations

| Guide ili reference pattern | Core Vault V1 | Razlog |
| --- | --- | --- |
| Multi-key best practice očekuje barem jedan ključ na odvojenom uređaju; inheritance i savings flowovi preferiraju hardware signere. | K1/K2/K3 su odvojeni walleti na istom lokalnom Bitcoin Coreu. | Ovo je isključivo Signet eksperiment koji dokazuje GUI orkestraciju. UI jasno ne tvrdi da tri walleta na istom stroju uklanjaju device single point of failure. Hardware wallet je V1 non-goal. |
| Neki reference flowovi dopuštaju preskočiti backup i kasnije prikazuju reminder. | Setup se ne može proglasiti dovršenim bez sva četiri backupa. | Projektni sigurnosni ustav zahtijeva first-class backup checkpoint; kasniji reminder nije dovoljna zaštita za eksperimentalni multisig. |
| Guide za on-chain često preporučuje BTC kao default jedinicu i fiat kontekst. | Spend test koristi sats primarno i BTC sekundarno, bez fiat prikaza. | Mali Signet testni iznosi čitljiviji su u satima; local-only model zabranjuje exchange-rate API. |
| Reference walleti nude mnogo templateova i custom konfiguraciju. | V1 prikazuje samo Personal Vault 2-of-3 Native SegWit. | Uži opseg smanjuje sigurnosnu i testnu površinu; budući templateovi ostaju informacijski extension pointovi. |
| Reference signing flowovi prenose PSBT između osoba preko QR-a ili chata. | V1 dva potpisa prikuplja iz lokalnih Core walleta bez ručnog prijenosa. | Najjednostavniji put za hipotezu V1. UI koristi generički “Add signature” kako file/USB/QR ne bi zahtijevali redizajn. |
| Neki Advanced reference primjeri dopuštaju prikaz/copy raw PSBT-a i finalnog hexa. | V1 Advanced trace prikazuje metodu i Core rezultat, ali transaction payload ostaje redigiran i samo u Rust memoriji. | Stroži local prototype model smanjuje slučajno curenje u clipboard, screenshot ili browser state; budući file/QR adapter mora imati zaseban threat-model review. |
| Guide može ponuditi block-explorer link nakon slanja. | Core Vault prikazuje lokalno vraćeni txid bez vanjskog linka. | Nema third-party poziva ni curenja wallet metadata; Bitcoin Core ostaje source of truth. |
| Public wallet konfiguracija u nekim flowovima izgleda kao običan shareable recovery kit. | Export ima privacy upozorenje i descriptori su skriveni iz default UI-ja. | Descriptor ne može potrošiti, ali omogućuje praćenje cjelokupne povijesti i budućih aktivnosti. |
| Reference designovi često podržavaju save-and-resume. | V1 ne persistira setup session ni passphrase. | Manje osjetljivog lokalnog statea i jednostavniji audit. Core walleti i backup datoteke postoje neovisno, ali wizard session se ponovnim pokretanjem ne obnavlja automatski. |

## Aktualni repository signali

Službeni repository na dan pregleda ima odvojene `guide/` sadržaje, `assets/` referentne
ekrane te Apache-2.0, MIT i CC-BY licence. [Design source files](https://bitcoin.design/guide/resources/design-files/)
navode da su design datoteke CC-BY i slobodne za osobnu i komercijalnu uporabu uz
attribution. Core Vault u V1 ne preuzima nijedan Guide asset, ilustraciju ni komponentu,
pa UI ne zahtijeva asset attribution; research dokument i dalje navodi izvore.

Relevantni otvoreni issueovi:

- [#1057 — descriptor i multi-sig config backup](https://github.com/BitcoinDesign/Guide/issues/1057):
  kanal i oblik backup preporuke još nisu zaključeni.
- [#1106 — test transactions](https://github.com/BitcoinDesign/Guide/issues/1106): testna
  transakcija je prepoznat trust-building pattern, ali Guide sadržaj još nije finaliziran.
- [#505 — error states](https://github.com/BitcoinDesign/Guide/issues/505): formalna opća
  taksonomija grešaka još je otvorena; postojeće sending smjernice ipak daju jasan minimum.
- [#778 — Shared wallet revision](https://github.com/BitcoinDesign/Guide/issues/778) i
  [#59 — External signers revision](https://github.com/BitcoinDesign/Guide/issues/59):
  relevantne reference nisu završna riječ; lokalni signer flow ostaje modularan.
- [#1197 — graduated wallet](https://github.com/BitcoinDesign/Guide/issues/1197): potvrđuje
  smjer story/template/progressive-security arhitekture, ali nije V1 funkcionalnost.
- [#1113 — research section revision](https://github.com/BitcoinDesign/Guide/issues/1113):
  korisničko istraživanje i dalje se reorganizira; naš uski test plan ostaje vezan uz
  konkretnu personu i end-to-end zadatak.

## Design odluka za V1

Za svaku odluku primjenjuje se ovaj test:

> Možemo li ukloniti kompleksnost iz korisnikova zadatka bez uklanjanja njegove sposobnosti
> da razumije i provjeri što Bitcoin Core radi?

Ako da, default UI koristi plain language i jedan CTA. Ako bi skrivanje uklonilo razumijevanje
kritične sigurnosne odluke, informacija ostaje vidljiva. Ako je tehnička informacija važna
za audit, ali ne za trenutačnu odluku, dostupna je u Advanced sloju.
