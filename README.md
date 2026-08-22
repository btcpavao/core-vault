# Core Vault

An experimental Tauri desktop app that organizes local Bitcoin Core wallet operations into eight spatial, accessible scenes. Its primary flow is an encrypted personal descriptor wallet. The existing Signet 2-of-3 flow remains available as a separate workshop.

> Experimental software. Use only with test funds on Signet, Testnet4, or Regtest.

Core Vault is an independent interface powered by Bitcoin Core. It is not developed or endorsed by the Bitcoin Core project.

## Project specifications

The authoritative project specifications live in the [docs/](docs/README.md) directory. Codex and other contributors must read them before any substantial product or interface work and explicitly report any discrepancy between the specifications and the current implementation.

## What it does

- detects a local Bitcoin Core instance through the standard authentication cookie and loopback RPC
- continuously displays the network, version, sync progress, peers, mempool, and P2P network status
- creates an encrypted Personal Vault from the start by calling `createwallet(passphrase=...)`
- creates and verifies a `backupwallet` copy, then compares the public fingerprint after `restorewallet`
- generates a wallet-owned `bech32m` address and a local QR code
- guides a single-signature spend through a PSBT flow: create, review, briefly unlock and sign, finalize, run `testmempoolaccept`, then broadcast separately
- keeps the raw PSBT, final transaction hex, RPC cookie, and passwords outside the React renderer
- preserves the existing 2-of-3 Signet flow without changing its backend contract
- includes English and Croatian, opt-in sound, mute, reduced motion, and an initial walkthrough
- clearly labels the browser demo and never presents it as a real Bitcoin Core connection

## Prerequisites

- macOS, Windows, or Linux with the Tauri 1 system prerequisites
- Node.js 22+
- Rust/Cargo 1.75+
- Bitcoin Core 31.1 recommended; `26+` remains the minimum compatibility threshold for the legacy prototype
- a development Bitcoin Core profile on Signet, Testnet4, or Regtest with the RPC server enabled

Example Signet configuration for `bitcoin.conf`:

```ini
signet=1
server=1
```

Restart Bitcoin Core after changing the configuration. The standard Signet RPC port is `38332`.

## Run the app

```bash
npm install
npm run tauri dev
```

The Tauri window will try to find the local Bitcoin Core cookie. If `bitcoin-qt` is running without `server=1`, close it, add the setting, and start it again.

To preview the interface without Bitcoin Core:

```bash
npm run dev
```

Open `http://127.0.0.1:1420`. The browser view permanently displays `LOCAL DEMONSTRATION MODE — NO REAL BITCOIN CORE`. All values and results are synthetic.

## Test and build

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

The Rust mock RPC tests open a temporary port on `127.0.0.1`, so a restrictive sandbox may require permission. See [docs/TESTING.md](docs/TESTING.md) for the detailed manual test plan.

## Security boundary

```text
React scene → typed Tauri command → Rust security check → local Bitcoin Core RPC
```

Core Vault has no cloud backend, remote node, analytics, price API, or block explorer dependency at runtime. The Rust layer accepts only a loopback host, disables proxy use, redacts passwords, and blocks new wallet mutations on mainnet. `setnetworkactive(false)` disables Bitcoin Core's P2P networking. It does not create an air gap.

Start with the [security model](docs/SECURITY_THREAT_MODEL.md), [RPC map](docs/RPC_MAPPING.md), [backup and restore procedure](docs/BACKUP_RESTORE.md), and [network support](docs/NETWORK_SUPPORT.md).

## Structure

```text
src/SpatialApp.tsx          spatial shell and eight scenes
src/App.tsx                 preserved 2-of-3 Signet flow
src/state/machines.ts       explicit UI state vocabulary
src/lib/tauri.ts            typed frontend adapter
src-tauri/src/personal.rs   Personal Vault, backup/restore, receive, and PSBT orchestration
src-tauri/src/vault.rs      existing 2-of-3 flow
src-tauri/src/rpc.rs        loopback cookie RPC, autodetection, and status
src-tauri/src/security.rs   host, path, and private-material validation
docs/                       current product and security contract
tests/                      frontend, architecture, and security invariants
```

## Known limitations

- not production-ready, not independently audited, and not intended for real bitcoin
- hardware wallets and external signers are not implemented
- PSBT import and export through files, USB, or QR codes are not implemented
- coin control, a fee-estimation UI, an address book, and advanced RBF are not implemented
- display labels and the backup receipt are stored only for the current session; the Bitcoin Core wallet itself persists
- restore verification compares public descriptors but does not replace a regular operational recovery drill
- the Croatian translation covers the spatial shell; the preserved 2-of-3 workshop remains English-first
- a real end-to-end test requires a local Bitcoin Core 31.1 instance, RPC `server=1`, and test funds
