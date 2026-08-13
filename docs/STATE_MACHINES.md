# Explicit state machines

The renderer exports the state vocabulary in `src/state/machines.ts`. Rust remains authoritative for wallet and PSBT material.

## Core

`disconnected → connecting → connected-network-active | connected-network-disabled → syncing → synced`, with `error` available from every active operation.

Network state and synchronization state are intentionally separate. A synced node can have P2P networking disabled.

## Vault

`loading → ready | backup-required | locked | temporarily-unlocked | watch-only`, with `error` as an exceptional state. A Personal Vault must be encrypted and locked immediately after creation.

## Backup

`not-created → creating → created → verification-pending → restore-tested`, or `failed`. A created file is not treated as recovery-proven until its restored public descriptor fingerprint matches.

## PSBT

`draft → funded → awaiting-review → unsigned → partially-signed | threshold-reached → finalized → ready-to-broadcast → broadcast`, or `failed`.

The single-signature vertical slice moves from `awaiting-review` to `threshold-reached` after Core confirms a complete signature. The preserved 2-of-3 path may remain `partially-signed` until two distinct signers complete the policy.
