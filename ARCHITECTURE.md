# Core Vault UI V1 architecture

> This document preserves the architecture of the original 2-of-3 flow. The spatial shell, Personal Vault RPC map, and new states are documented in [docs/RPC_MAPPING.md](docs/RPC_MAPPING.md) and [docs/STATE_MACHINES.md](docs/STATE_MACHINES.md).

## Summary

The original repository was a standalone offline HTML guide. Its parsers and security messages remain useful references, but its `copy, open Debug Console, paste` architecture cannot meet the current goal. V1 therefore uses Tauri. React presents the flow, while a small Rust backend is the only component that communicates with the local Bitcoin Core RPC.

```text
React + TypeScript UI
        │  typed Tauri commands, no RPC credentials in logs
        ▼
Rust Core Vault backend
        │  HTTP JSON-RPC, cookie authentication, loopback only
        ▼
local Bitcoin Core on Signet
```

Bitcoin Core remains the source of truth for wallets, keys, descriptor checksums, validation, signing, and broadcast. The application is not a wallet engine and implements no cryptography.

## Repository structure

```text
src/
  App.tsx                  main wizard and UI state
  main.tsx                 React entry point
  styles.css               design system and responsive layout
  types.ts                 frontend DTO types
  components/              status, policy, and RPC transparency components
  lib/tauri.ts             typed invoke adapter
src-tauri/
  Cargo.toml
  tauri.conf.json
  src/
    main.rs                command registration and application state
    rpc.rs                 localhost JSON-RPC and cookie authentication
    vault.rs               Core operations and 2-of-3 coordination
    security.rs            loopback, naming, secret, and export checks
    types.rs               serialized DTO types
tests/                     frontend unit tests for security helpers
ARCHITECTURE.md
SECURITY.md
```

## Bitcoin Core RPC exposure

| Purpose | RPC | Security check |
| --- | --- | --- |
| Connection and network | `getblockchaininfo`, `getnetworkinfo` | `chain === "signet"`, otherwise hard stop |
| Wallet inspection | `listwallets`, `listwalletdir` | local Core, unique names |
| K1/K2/K3 | `createwallet`, `getwalletinfo` | descriptor wallet, private keys enabled |
| Encryption | `encryptwallet`, `getwalletinfo` | passphrase is redacted and short-lived |
| Signer backup | `backupwallet` | absolute user-selected path, resulting file exists |
| Public keys | `listdescriptors` with `private=false` | `wpkh`, `/0/*`, `/1/*`, unique fingerprints and tpubs, no private material |
| Multisig descriptor | `getdescriptorinfo` | ranged, solvable, no private keys, Core supplies the checksum |
| Coordinator | `createwallet`, `getwalletinfo` | blank descriptor wallet and `private_keys_enabled=false` |
| Import | `importdescriptors` | external receive and internal change, both `success=true` |
| Receive test | `getnewaddress`, `getaddressinfo`, `getbalances` | Signet address, solvable watch-only coordinator |
| Spend test | `validateaddress`, `walletcreatefundedpsbt`, `walletprocesspsbt`, `walletpassphrase`, `walletlock`, `finalizepsbt`, `sendrawtransaction` | two distinct Core signatures, complete PSBT, local broadcast |

V1 requires Bitcoin Core 26 or newer so the RPC contract stays narrow and testable.

## Trust boundaries

1. React is an untrusted presentation layer. The backend revalidates hosts, paths, wallet names, networks, RPC responses, and public backups before writing.
2. RPC is allowed only for `127.0.0.1`, `localhost`, and `::1`. Core Vault accepts no arbitrary URL, redirect, or remote node.
3. The cookie stays in the Rust process, is read from disk for a local call, and is never returned to the UI.
4. Core Vault neither stores nor logs passphrases. The UI keeps a passphrase in an uncontrolled input that it clears immediately after the call. Rust uses a zeroizing container where practical.
5. Descriptor and coordinator invariants are stopping controls. There is no "continue anyway" path.
6. Public exports pass a backend secret scan and use an explicit schema.

## Deliberate V1 non-goals

- Mainnet and Testnet
- remote nodes, Electrum, cloud backends, accounts, analytics, and telemetry
- hardware wallets and air-gapped signing
- seed or BIP39, WIF, xprv, or tprv import and export
- a custom signer, descriptor checksum, or Bitcoin cryptography
- Taproot, MuSig2, Miniscript, timelocks, inheritance, or policies other than 2-of-3
- collaborative custody, a mobile application, or an automated physical-backup strategy
- advanced coin control, batch outputs, RBF controls, or general transaction history

## Implementation phases

1. Migrate the build to React, TypeScript, and Vite, then add a minimal Tauri shell.
2. Implement secure RPC transport, cookie autodetection, and a Signet hard stop.
3. Implement creation, verification, encryption, and backup for the K1, K2, and K3 wallets.
4. Extract public descriptor data and validate the 2-of-3 policy through Core.
5. Create the watch-only coordinator and atomically verify both imports.
6. Implement the wizard, status display, advanced settings, and redacted RPC transparency panel.
7. Implement a narrow Signet receive and spend test without manual PSBT handling.
8. Implement the public JSON export, mock demo, Rust and TypeScript tests, and build check.

## Auditability and later expansion

Policy-specific logic lives in `vault.rs`. The transport layer knows nothing about multisig. A future policy gets a separate builder and tests without broadening V1 conditions. The frontend uses stable DTOs and constructs neither RPC requests nor descriptors.
