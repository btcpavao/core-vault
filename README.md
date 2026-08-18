# Core Vault

Eksperimentalna Tauri desktop aplikacija koja organizira lokalne Bitcoin Core wallet operacije u osam prostornih, dostupnih scena. Prva vertikala je šifrirani osobni descriptor wallet; postojeći Signet 2-od-3 tok ostaje dostupan kao zasebna radionica.

> Experimental software. Use only with test funds on Signet, Testnet4, or Regtest.

Core Vault is an independent interface powered by Bitcoin Core. It is not developed or endorsed by the Bitcoin Core project.

## Project specification

Autoritativne specifikacije projekta nalaze se u direktoriju [docs/](docs/README.md). Codex i
drugi suradnici moraju ih pročitati prije svakog značajnog produktnog ili sučeljnog rada te
izričito prijaviti svaki nesklad između specifikacije i postojeće implementacije.

## 3D Environment Production

Production-quality Core Vault 3D environments must follow the
[Art Production Pipeline](docs/ART_PRODUCTION_PIPELINE.md). Room-specific approved visual
references live under [docs/references/](docs/references/).

## Što radi

- otkriva lokalni Bitcoin Core preko standardnog cookieja i loopback RPC-a
- trajno prikazuje mrežu, verziju, sinkronizaciju, peerove, mempool i status P2P mreže
- izrađuje odmah šifrirani Personal Vault pozivom `createwallet(passphrase=…)`
- izrađuje i provjerava `backupwallet` kopiju te uspoređuje javni fingerprint nakon `restorewallet`
- generira wallet-owned `bech32m` adresu i lokalni QR kod
- vodi single-sig slanje kao PSBT: izrada → pregled → kratko otključavanje i potpis → finalizacija → `testmempoolaccept` → zasebna objava
- zadržava raw PSBT, finalni hex, RPC cookie i lozinke izvan React renderera
- čuva stari 2-od-3 Signet tijek bez promjene njegovog backend ugovora
- ima English/Hrvatski, opt-in zvuk, mute, reduced motion i prvi walkthrough
- ima jasno označen browser demo koji nikad ne glumi stvarnu Core vezu

## Preduvjeti

- macOS, Windows ili Linux s Tauri 1 sistemskim preduvjetima
- Node.js 22+
- Rust/Cargo 1.75+
- Bitcoin Core 31.1 preporučen (`26+` je minimalni kompatibilni prag starog prototipa)
- razvojni Core profil na Signetu, Testnet4 ili Regtestu, s uključenim RPC serverom

Signet primjer za `bitcoin.conf`:

```ini
signet=1
server=1
```

Ponovno pokrenite Bitcoin Core nakon promjene konfiguracije. Standardni Signet RPC port je `38332`.

## Pokretanje

```bash
npm install
npm run tauri dev
```

Tauri prozor će pokušati pronaći lokalni Core cookie. Ako `bitcoin-qt` radi bez `server=1`, zatvorite ga, dodajte postavku i ponovno ga pokrenite.

Za pregled sučelja bez Bitcoin Corea:

```bash
npm run dev
```

Otvorite `http://127.0.0.1:1420`. Browser prikaz ima trajnu oznaku `LOCAL DEMONSTRATION MODE — NO REAL BITCOIN CORE`; sve brojke i rezultati su sintetički.

## Testiranje i build

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:rust
npm run verify
npm audit
npm run tauri build
```

Rust mock-RPC testovi otvaraju privremeni port na `127.0.0.1`, pa restriktivni sandbox može tražiti dopuštenje. Detaljan ručni test nalazi se u [docs/TESTING.md](docs/TESTING.md).

## Sigurnosna granica

```text
React scene → tipizirana Tauri naredba → Rust sigurnosna provjera → lokalni Bitcoin Core RPC
```

Nema cloud backenda, udaljenog noda, analitike, price API-ja ili explorer ovisnosti u runtimeu. Rust prihvaća samo loopback host, isključuje proxy, redigira lozinke i zaustavlja nove wallet mutacije na mainnetu. `setnetworkactive(false)` isključuje Core P2P mrežu; ne stvara air gap.

Počnite sa [sigurnosnim modelom](docs/SECURITY_THREAT_MODEL.md), [RPC mapom](docs/RPC_MAPPING.md), [backup/restore postupkom](docs/BACKUP_RESTORE.md) i [mrežnom podrškom](docs/NETWORK_SUPPORT.md).

## Struktura

```text
src/SpatialApp.tsx          prostorni shell i osam scena
src/App.tsx                 sačuvani 2-od-3 Signet tijek
src/state/machines.ts       eksplicitni UI state vocabulary
src/lib/tauri.ts            tipizirani frontend adapter
src-tauri/src/personal.rs   Personal Vault, backup/restore, receive i PSBT orkestracija
src-tauri/src/vault.rs      postojeći 2-od-3 tok
src-tauri/src/rpc.rs        loopback cookie RPC, autodetekcija i status
src-tauri/src/security.rs   validacija hosta, putanje i privatnog materijala
docs/                       aktualni proizvodni i sigurnosni ugovor
tests/                      frontend, arhitekturni i sigurnosni invarijanti
```

## Poznata ograničenja

- nije production-ready, nije neovisno auditirano i nije za stvarni bitcoin
- hardverski walleti i vanjski signeri nisu implementirani
- PSBT import/export preko datoteke, USB-a ili QR-a nije implementiran
- coin control, fee estimation UI, address book i napredni RBF nisu implementirani
- oznake za prikaz i backup receipt čuvaju se samo tijekom sesije; Core wallet sam ostaje trajan
- restore provjera uspoređuje javne descriptore, ali nije zamjena za redovitu operativnu recovery vježbu
- hrvatski prijevod pokriva prostorni shell; sačuvana 2-od-3 radionica ostaje English-first
- pravi end-to-end test treba lokalni Core 31.1, RPC `server=1` i testna sredstva
