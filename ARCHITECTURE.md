# Core Vault UI — arhitektura V1

> Ovaj dokument zadržava arhitekturu izvornog 2-od-3 toka. Prostorni shell, Personal Vault RPC mapa i nova stanja dokumentirani su u [docs/RPC_MAPPING.md](docs/RPC_MAPPING.md) i [docs/STATE_MACHINES.md](docs/STATE_MACHINES.md).

## Kratka procjena

Postojeći repository bio je samostalni offline HTML vodič. Njegovi parseri i sigurnosne
poruke korisna su referenca, ali njegova `copy → Debug Console → paste` arhitektura ne
može ispuniti novi cilj. V1 zato prelazi na Tauri: React prikazuje tijek, a mali Rust
backend jedini razgovara s lokalnim Bitcoin Core RPC-em.

```text
React + TypeScript UI
        │  tipizirane Tauri naredbe (bez RPC credentiala u logovima)
        ▼
Rust Core Vault backend
        │  HTTP JSON-RPC, cookie auth, isključivo loopback
        ▼
lokalni Bitcoin Core na Signetu
```

Bitcoin Core ostaje izvor istine za wallet, ključeve, descriptor checksum, validaciju,
potpisivanje i broadcast. Aplikacija nije wallet engine i nema vlastitu kriptografiju.

## Predložena struktura

```text
src/
  App.tsx                  glavni wizard i UI state
  main.tsx                 React entrypoint
  styles.css               dizajn sustav i responsive layout
  types.ts                 frontend DTO tipovi
  components/              status, policy i RPC transparency komponente
  lib/tauri.ts             tipizirani invoke adapter
src-tauri/
  Cargo.toml
  tauri.conf.json
  src/
    main.rs                registracija naredbi i app state
    rpc.rs                 localhost JSON-RPC + cookie auth
    vault.rs               Core operacije i 2-of-3 orkestracija
    security.rs            loopback, naziv, secret i export provjere
    types.rs               serijalizirani DTO tipovi
tests/                     frontend unit testovi sigurnosnih helpera
ARCHITECTURE.md
SECURITY.md
```

## Bitcoin Core RPC površina

| Namjena | RPC | Sigurnosna provjera |
| --- | --- | --- |
| Veza i mreža | `getblockchaininfo`, `getnetworkinfo` | `chain === "signet"`; inače hard stop |
| Pregled walleta | `listwallets`, `listwalletdir` | lokalni Core, jedinstvena imena |
| K1/K2/K3 | `createwallet`, `getwalletinfo` | descriptor wallet, privatni ključevi uključeni |
| Enkripcija | `encryptwallet`, `getwalletinfo` | passphrase je redigiran i kratko živi |
| Backup signera | `backupwallet` | apsolutna korisnički odabrana putanja, nastala datoteka |
| Javni ključevi | `listdescriptors` s `private=false` | `wpkh`, `/0/*`, `/1/*`, različiti fingerprinti/tpubovi, bez private materijala |
| Multisig descriptor | `getdescriptorinfo` | ranged, solvable, bez privatnih ključeva; Core daje checksum |
| Coordinator | `createwallet`, `getwalletinfo` | blank descriptor wallet i `private_keys_enabled=false` |
| Import | `importdescriptors` | external receive + internal change; oba `success=true` |
| Receive test | `getnewaddress`, `getaddressinfo`, `getbalances` | Signet adresa, solvable watch-only coordinator |
| Spending test | `validateaddress`, `walletcreatefundedpsbt`, `walletprocesspsbt`, `walletpassphrase`, `walletlock`, `finalizepsbt`, `sendrawtransaction` | dvije različite Core signature, complete PSBT, lokalni broadcast |

V1 zahtijeva Bitcoin Core 26 ili noviji kako bi RPC ugovor bio uzak i testabilan.

## Granice povjerenja

1. React je nepovjerljivi presentation sloj. Backend ponovno validira host, putanje,
   wallet imena, mrežu, RPC odgovore i public backup prije zapisa.
2. RPC je dopušten samo za `127.0.0.1`, `localhost` i `::1`. Nema proizvoljnog URL-a,
   redirecta ni udaljenog noda.
3. Cookie ostaje u Rust procesu, čita se s diska za lokalni poziv i nikada se ne vraća UI-ju.
4. Passphrase se ne sprema, ne logira i u UI-ju se drži u nekontroliranom inputu koji se
   briše odmah nakon poziva. Rust koristi zeroizing spremnik gdje je praktično moguće.
5. Descriptor i coordinator invarijante su zaustavne kontrole. Ne postoji "continue anyway".
6. Public export prolazi backend secret scan i koristi samo eksplicitnu schema strukturu.

## Namjerni V1 non-goals

- Mainnet i Testnet
- remote node, Electrum, cloud backend, accounti, analytics i telemetrija
- hardware walleti i air-gapped signing
- seed/BIP39, WIF, xprv/tprv import ili export
- vlastiti signer, descriptor checksum ili Bitcoin kriptografija
- Taproot, MuSig2, Miniscript, timelock, inheritance i policy osim 2-of-3
- collaborative custody, mobilna aplikacija i automatska fizička backup strategija
- napredni coin control, batch outputi, RBF kontrole i opći transaction history

## Implementacija po fazama

1. Migrirati build na React/TypeScript/Vite i dodati minimalni Tauri shell.
2. Implementirati sigurni RPC transport, autodetekciju cookieja i Signet hard stop.
3. Implementirati kreiranje, provjeru, enkripciju i backup K1/K2/K3 walleta.
4. Ekstrahirati javne descriptor podatke i validirati 2-of-3 policy kroz Core.
5. Kreirati watch-only coordinator i atomski provjeriti oba importa.
6. Implementirati wizard, status, napredne postavke i redigirani RPC transparency panel.
7. Implementirati uski Signet receive/spend test bez ručnog PSBT-a.
8. Implementirati javni JSON export, mock demo, Rust/TypeScript testove i build provjeru.

## Auditabilnost i kasnije proširenje

Policy-specifična logika nalazi se u `vault.rs`; transport ne zna ništa o multisigu.
Novi policy u budućnosti dobiva zaseban builder i testove, bez širenja V1 uvjeta.
Frontend koristi stabilne DTO-e i ne konstruira RPC zahtjeve ni descriptore.
