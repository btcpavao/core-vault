# Core Vault — Phase 2 Completion Checkpoint

**Status:** Implementation checkpoint
**Checkpoint:** `b09b165ad57188092109702489a9b8497bd1044d`
**Evidence environment:** real Bitcoin Core 31.1 Regtest
**Purpose:** record the proven Bitcoin/domain boundary before Phase 3 real-time experience work begins

This document records implemented and repeatable evidence. It is not an additional foundational design document and it does not claim that the remaining self-custody product has been completed.

## Phase 2 result

Phase 2 established a typed, fail-closed domain foundation between the renderer, the Tauri host, and a local Bitcoin Core instance. The golden Regtest suite proves the following lifecycles against a real isolated `bitcoind`, not mocks.

### Personal Vault

The current Personal Vault lifecycle proves:

- atomic creation of an encrypted descriptor wallet;
- a locked post-creation wallet state;
- receive-address generation and wallet ownership correspondence;
- real Regtest funding;
- spend-proposal creation and correspondence between the proposal and the transaction review view;
- wrong-passphrase safety without a false signing result;
- signing followed by mandatory wallet relock;
- transaction finalization;
- strict, fail-closed `testmempoolaccept` preflight;
- one-time privileged native broadcast authorization;
- broadcast to Bitcoin Core;
- mempool presence;
- confirmation in a newly mined block;
- resulting wallet activity and balance updates; and
- recovery from a Bitcoin Core wallet backup with public-identity correspondence.

### Current 2-of-3

The current multisig evidence is a **same-machine 2-of-3 domain lifecycle proof**. It proves:

- atomic creation of three encrypted signer wallets;
- a private-key-disabled coordinator;
- an actual `wsh(sortedmulti(2,...))` policy;
- real receive and change descriptors;
- real Regtest funding;
- one distinct signer is insufficient;
- a duplicate signer does not advance the threshold;
- two distinct signers satisfy the threshold;
- mandatory signer relock;
- transaction finalization;
- strict, fail-closed mempool preflight;
- one-time privileged native broadcast authorization;
- broadcast;
- mempool presence; and
- confirmation.

This evidence does **not** prove independent-device multisig or an operationally distributed signer ceremony.

## Domain work that remains open

The following areas intentionally remain outside this checkpoint:

- PSBT transport by file, USB, or QR;
- independent offline signer machines;
- signer backup and recovery proof;
- reconstruction of a coordinator from public material;
- a richer coordinator transaction-history DTO;
- workflow and relock reconciliation after an application restart;
- additional Mainnet mutation-policy hardening;
- monetary-representation hardening beyond current boundaries;
- RPC timeout refinement; and
- further reduction of operational metadata exposed to the renderer.

These are retained as explicit future domain work. Phase 3 presentation work must not silently redefine or bypass them.

## Frozen privileged boundary

> **The experience layer may observe typed domain state and invoke explicit domain commands. It must never issue arbitrary Bitcoin Core RPC calls.**

> **The Three.js scene must never receive passphrases, private descriptors, raw private keys, RPC cookies, or arbitrary Core RPC authority.**

> **Bitcoin Core remains the source of truth. Scene state is a visual projection, not an independent Bitcoin state machine.**

The renderer may receive only the smallest safe typed projection needed to communicate domain state. A renderer failure is a presentation failure and must not mutate or erase Bitcoin-domain state.

## Transition into Phase 3

Phase 3 may begin because the current golden tests repeatedly prove the bounded Personal Vault and same-machine 2-of-3 lifecycles against real Bitcoin Core 31.1 Regtest, while the privileged boundary remains explicit and testable.

The first Phase 3 objective is therefore architectural: prove that real typed node state can drive a real-time spatial room through a pure Visual State Adapter without moving Bitcoin authority into Three.js. It is not permission to build the complete world or to migrate transaction, wallet-creation, backup, or signing flows into 3D.
