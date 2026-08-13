# Core Vault UI — design audit

## Prostorna revizija · 13. kolovoza 2026.

Aktualni shell ponovno je pregledan u stvarnom browser renderu. Rezultat ostaje **Experimental; nije Mainnet proizvod**.

| Provjera | Rezultat |
| --- | --- |
| Desktop 1024 × 700 | svih osam scena bez horizontalnog prelijevanja; vertikalni sadržaj ostaje čitljiv i skrolabilan |
| Desktop 1280 × 800 | svih osam scena bez horizontalnog prelijevanja; ispravljen min-content clipping desnog workbencha |
| Cijeli spatial demo | onboarding → HR/EN → vault → backup → restore fingerprint → receive QR → PSBT → sign → finalize → broadcast |
| Engine Room | P2P off/on radi; tekst izričito razlikuje disabled network od air gapa |
| Legacy 2-of-3 | ulaz i povratak rade; izvorni tok ostaje zaseban |
| Reduced motion i audio | reduced motion potvrđen na `html[data-motion=reduced]`; zvuk ostaje opt-in i mute je trajan |
| Browser console | 0 warning/error poruka |
| Automatizirani suite | 25 frontend/arhitekturnih + 22 Rust/RPC testa; 47 ukupno |
| Build i ovisnosti | Vite i Tauri release build prolaze; `npm audit` prijavljuje 0 ranjivosti |

Tablice ispod ostaju povijesni audit izvornog linearnog 2-od-3 prototipa koji je i dalje ugrađen kao Radionica.

Datum: 12. kolovoza 2026.  
Status: **prolazi kao Experimental Signet Prototype; ne prolazi kao Mainnet proizvod**.

Audit uspoređuje implementirani React UI s `DESIGN_RESEARCH.md`, `DESIGN_SYSTEM.md`,
Bitcoin Design Guide obrascima i projektnim sigurnosnim ustavom. Pregledan je stvarni Vite
render, ne samo source.

## Stvarni QA dokaz

| Provjera | Rezultat |
| --- | --- |
| Desktop 1280 × 720 | Welcome, Core, backup, review, signing i success ekrani bez preklapanja |
| Uski prikaz 700 × 900 | nema horizontalnog overflowa; sidebar postaje progress strip; CTA-i ostaju 48 px |
| Cijeli safe-demo flow | Core → K1/K2/K3 → vault → 4 backupa → receive → review → K1+K2 → broadcast |
| Signer kombinacije | K1+K2, K1+K3 i K2+K3 pokrivene frontend testom |
| Browser console | 0 warning/error poruka tijekom cijelog demo tijeka |
| Tipkovnica/semantika | native button/input/details; skip link; fokus se vraća na novi korak |
| Reduced motion | CSS media query uklanja animacije i prijelaze |
| Production build | Vite i optimizirani Tauri release binary uspješno buildani |
| Automatizirani suite | 16 frontend/demo/arhitekturnih + 17 Rust/RPC testova; 33 ukupno |

Tijekom pregleda pronađena su i popravljena tri problema: novi dugi korak nasljeđivao je
stari scroll, programatski fokus crtao je okvir oko cijelog `main` sadržaja, a demo model
imao je interni `connected=true` iako je UI bio označen kao simulacija. Novi korak sada
počinje na vrhu, vizualni focus ring ostaje na stvarnim kontrolama, a demo je i vizualno i
podatkovno odvojen od stvarne Core veze.

Lokalni Rust integracijski fixture dodatno podiže efemerni `127.0.0.1` JSON-RPC server,
provjerava cookie Basic auth, uspješan Signet handshake i ponovni Mainnet hard stop neposredno
prije wallet rada. To nije zamjena za live Signet E2E, ali testira stvarnu HTTP/RPC granicu.

## Pokrivenost obveznih tehničkih provjera

| # | Zahtjev | Automatizirani dokaz |
| ---: | --- | --- |
| 1 | Core connection | lokalni mock-RPC handshake s cookie authom |
| 2 | Signet detection | RPC fixture + pure chain test |
| 3 | Mainnet rejection | RPC fixture potvrđuje `STOP` prije wallet rada |
| 4 | K1 wallet creation | command-registry test + puni browser demo |
| 5 | descriptor wallet validation | Rust `verify_signing_wallet` put + source invariant |
| 6 | `private_keys_enabled` validation | signing/coordinator guardovi + source invariant |
| 7 | `listdescriptors` parsing | Rust public `wpkh` parser test |
| 8 | receive descriptor selection | `/0/*`, `internal=false` parser pravilo |
| 9 | change descriptor selection | `/1/*`, `internal=true` parser pravilo |
| 10 | duplicate fingerprint rejection | Rust key-set test |
| 11 | duplicate tpub rejection | Rust key-set test |
| 12 | private extended key rejection | tprv/xprv i private-descriptor testovi |
| 13 | receive multisig construction | `wsh(sortedmulti(2,.../0/*))` unit test |
| 14 | change multisig construction | branch builder i demo descriptor model |
| 15 | `getdescriptorinfo` validation | architecture invariant + solvable/no-private pravila |
| 16 | coordinator creation | command/RPC sequence invariant + browser demo |
| 17 | coordinator s privatnim ključevima | `verify_coordinator` hard-stop invariant |
| 18 | descriptor import | Rust test zahtijeva dva uspješna rezultata |
| 19 | receive address generation | demo model zahtijeva `tb1`, solvable i watch-only |
| 20 | sats/BTC conversion | Rust rounding + frontend consistency test |
| 21 | funded PSBT creation | RPC-sequence invariant + puni browser demo |
| 22 | prvi signer `complete=false` | demo state test |
| 23 | updated PSBT propagation | PSBT ostaje u Rust draft stateu; source invariant |
| 24 | drugi signer `complete=true` | demo state test |
| 25 | sva tri signer para | K1+K2, K1+K3 i K2+K3 frontend test |
| 26 | final hex extraction | finalize/broadcast sequence invariant |
| 27 | broadcast | demo operacija + puni browser demo |
| 28 | txid parsing | 64-znamenkasti lowercase hex test |
| 29 | change balance | starting − sent − fee = remaining test |
| 30 | bez secret leakagea | public backup/RPC redaction + no-persistence test |

Stavke koje ovise o stvarnim Bitcoin Core odgovorima imaju dodatni live-E2E status otvoren
u ograničenjima; tablica ne tvrdi da je mock fixture zamjena za test sa Signet sredstvima.

## Mentalni model i hijerarhija

| Prije / problem | Poslije / rješenje |
| --- | --- |
| Multisig bi mogao početi s M-of-N, descriptorom i PSBT-om. | Welcome počinje pričom `Personal Vault`, dijagramom tri signing walleta i pravilom “any 2”. |
| Wallet, key, vault i coordinator lako se mentalno stapaju. | Signeri su key kartice, policy je `2 of 3` čvor, vault je zaštićeni funds čvor, coordinator ima `Private keys: none`. |
| Minimalizam bi mogao sakriti posljedice gubitka. | Review eksplicitno kaže: jedan izgubljeni ključ je podnošljiv; dva mogu zaključati sredstva. |

## Primarna akcija i progresivno otkrivanje

| Prije / problem | Poslije / rješenje |
| --- | --- |
| Debug Console flow traži više naredbi i kopiranje statea. | Svaki ekran ima jedan dominantan CTA, a wizard ima šest velikih faza. |
| RPC detalji mogu zatrpati početnika. | `Show what Bitcoin Core is doing` je zatvoren native `details`; prikazuje metodu, timestamp, sanitizirane argumente, rezultat i objašnjenje. |
| PSBT Base64 i raw hex lako završe u clipboardu/logu. | Payload ostaje u Rust memoriji i Advanced trace prikazuje `[REDACTED]`; to je namjerno strože odstupanje od Guide reference flowova. |

## Sigurnost, backup i privatnost

| Prije / problem | Poslije / rješenje |
| --- | --- |
| Backup može izgledati kao naknadna Settings opcija. | K1/K2/K3 Core backup i public config čine blokirajući checkpoint prije receive testa. |
| Public descriptor može se pogrešno tretirati kao bezazlen share file. | UI ga označava kao sensitive wallet metadata koja ne može trošiti, ali može pratiti povijest. |
| Balance i adresa mogu se prikazivati bez potrebe. | Adresa se pojavljuje samo u receive/review kontekstu; balance je skriven po zadanom i ima sats + BTC tek nakon reveal radnje. |
| Demo je mogao izgledati kao prava Core veza. | Trajna oznaka `DEMO MODE — NO REAL BITCOIN CORE`, `Simulated Signet` i trust fact `Not connected · demo data`. |
| Broadcast uspjeh bez change objašnjenja ostavlja nesigurnost. | Success prikazuje starting, sent, fee, remaining i objašnjava internu `/1/*` change zaštitu. |

## Površine, tipografija i motion

| Prije / problem | Poslije / rješenje |
| --- | --- |
| Stari vodič i “crypto app” klišeji ne odgovaraju security proizvodu. | Topla neutralna podloga, gotovo crni sidebar, narančasta samo za primarnu akciju; bez gradijenata, glow efekata i market elemenata. |
| Arbitraran CSS otežava konzistentnost. | Centralni color/spacing/radius/type/shadow tokeni; koncentrirani ugniježđeni radijusi. |
| Previše motiona može prikriti stanje. | Samo kratki enter, press i icon prijelazi; točan `transition-property`; nema `transition: all`. |
| Mono font svugdje djeluje developerski. | Mono je ograničen na adrese, txid i RPC payload; objašnjenja ostaju u system sans tipografiji. |

## Audit po glavnim ekranima

| Ekran | Purpose / primary action | Security / privacy | Bitcoin Design alignment | Odstupanje ili rizik |
| --- | --- | --- | --- | --- |
| Welcome | odmah objašnjava 2-of-3 i nudi `Create vault` | local/no cloud/no telemetry činjenice | lifecycle, savings/shared onboarding | jedan local-machine template, bez hardware keyja |
| Core connection | potvrđuje lokalni Core i mrežu | Mainnet hard stop; loopback-only | verifiable trust, error recovery | manual cookie path u Advanced |
| K1/K2/K3 | jedan signer: create → encrypt → ready | password nekontroliran i odmah očišćen | linear key-slot onboarding | “use existing wallets” još nije V1 UI |
| Vault review | razumljiv finalni policy review | loss consequences; watch-only coordinator | multi-key wallet finalize | sva tri signera su na istom uređaju |
| Backup | razlikuje signing capability i public config | četiri obvezna rezultata; privacy warning | multi-key backup pattern | aplikacija ne propisuje fizičku lokaciju |
| Receive | stvara novu adresu i čeka uplatu | adresa samo kontekstualno; balance hidden | receiving + wallet privacy | pending/confirmed se u V1 zbrajaju |
| Send/review | prikazuje destination, amount, fee, remaining, approvals | edit prije potpisa; raw PSBT skriven | sending + transaction review | bez coin controla i address booka |
| Add signature | status tri signera i broj odobrenja | drugačiji signer obvezan; Core unlock 5 s | cosigner/signing slots | V1 samo local Core metoda |
| Success | txid i change računica | bez explorera; lokalni balance refresh | final consent + change education | refresh je best-effort; fallback je procjena |

## Accessibility

- DOM ima jedan `h1` po aktivnom koraku, semantički `main`, `aside`, `header`, `footer`,
  `ol`, `dl`, `details` i povezane wrapping labele.
- Minimalne interaktivne mete su 44 × 44 px; primarni gumbi 48 px.
- Status koristi ikonu, riječ i boju. Fokus ring je 3 px i nije uklonjen s kontrola.
- Vault dijagram ima tekstualni `role=img` opis i stvarni tekst signera/statusa.
- Layout je provjeren u 700 px širokom viewportu kao proxy za 200% desktop zoom.
- Otvorena stavka za user test: potvrditi čitljivost punih adresa i RPC JSON-a s pravim
  screen readerom, ne samo DOM snapshotom.

## Poznate otvorene stavke

1. Live Signet E2E nije izveden u ovom prolazu: lokalni Bitcoin-Qt radi s `-signet`, ali bez
   `-server` i bez RPC cookieja. Aplikacija je ispravno prikazala offline stanje; Core nije
   nasilno restartan.
2. Nema neovisnog sigurnosnog audita, stvarnih korisničkih sesija ni Mainnet podrške.
3. Nema recovery/import flowa, postojećih walleta, hardware signera ili PSBT file/QR metode.
4. V1 zbraja confirmed i unconfirmed receive balance; zasebna stanja dolaze nakon prvog
   user testa i live integration fixturea.
5. Opći vault dashboard i transaction history namjerno su odgođeni; prototip dokazuje
   linearni acceptance flow.
6. Create i encrypt su dva odvojena Signet koraka; prekid između njih može ostaviti
   testni signer neenkriptiranim. Atomska kreacija mora prethoditi bilo kakvom Mainnet radu.

## Zaključak

UI zadovoljava prototipni cilj “easy to use correctly”: početnik ne mora vidjeti RPC,
descriptor ni PSBT, ali napredni korisnik može auditirati sanitizirani Core tijek. Release
ostaje strogo označen kao Signet eksperiment dok ne prođe live E2E, moderirani user test i
neovisni security review.
