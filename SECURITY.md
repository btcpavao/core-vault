# Core Vault UI security charter

> This document describes the preserved 2-of-3 Signet prototype. The current security contract for the spatial version and Personal Vault is in [docs/SECURITY_THREAT_MODEL.md](docs/SECURITY_THREAT_MODEL.md).

Core Vault UI is a local graphical layer over Bitcoin Core. Bitcoin Core is the only source of truth and the only component that generates or uses private keys.

## The application must never

- generate, read, export, or store private keys
- request a seed phrase, WIF, xprv, or tprv
- implement cryptography, a signing engine, or descriptor checksums
- send Bitcoin data, credentials, or telemetry to a network service
- use a cloud backend, account, analytics, remote signer, Electrum server, or remote Core node
- enable Mainnet in V1

## Enforced technical controls

- The RPC host must be loopback (`127.0.0.1`, `localhost`, or `::1`).
- `getblockchaininfo.chain` must report `signet` before any wallet mutation.
- A signing wallet must have `descriptors=true` and `private_keys_enabled=true`.
- The coordinator must have `descriptors=true` and `private_keys_enabled=false` before import.
- Core Vault calls `listdescriptors` with `private=false`. A private-key pattern stops the flow immediately.
- Receive and change descriptors must be a public `wpkh` ranged pair using `/0/*` and `/1/*`.
- K1, K2, and K3 must have different master fingerprints and tpubs.
- `getdescriptorinfo` must confirm `isrange`, `issolvable`, and `hasprivatekeys=false`.
- Both `importdescriptors` results must have `success=true`.
- The backend scans the public backup for secrets again before writing it.
- PSBT and raw transaction data exist only in process memory. The UI does not persist them or ask the user to copy and paste them.
- An encrypted signer unlocks for no more than five seconds. The backend always calls `walletlock` after the attempt.

## Secrets

Only the Rust layer reads the Bitcoin Core cookie, and it never exposes the cookie to React. A wallet passphrase goes only to the local Core RPC. Core Vault never writes it to a trace or error message and clears it from the frontend input as soon as the call finishes.

The operating system, Tauri IPC, and HTTP library may create memory copies, so V1 cannot promise perfect deletion of every copy. It limits their number and lifetime and never persists the passphrase.

## Local filesystem

Bitcoin Core creates signing-wallet backups through `backupwallet`. The application selects an absolute destination path and confirms that the file exists. The public vault backup contains only the schema version, Signet policy, public fingerprints and tpubs, checksummed receive and change descriptors, and coordinator metadata.

## Known limits

V1 does not protect a compromised operating system, Bitcoin Core installation, or user-selected backup location. A `tpub` does not distinguish Signet from Testnet, so Core Vault always checks the network directly through local `getblockchaininfo`. Descriptor processing is unavailable until that check passes.

V1 creates and encrypts a signing wallet in two separate blocking wizard steps. Closing the application between them may leave a local Signet wallet unencrypted. Do not use this prototype with real bitcoin. A Mainnet design would need one atomic Core operation or a safe, resumable recovery flow.

Report security problems with synthetic Signet data. Never attach wallet files, seeds, private keys, passphrases, or real PSBTs.
