# Core Vault — Current Implementation Audit

Audit date: 2026-08-13
Repository: `https://github.com/btcpavao/core-vault`
Audited branch: `master`
Audited implementation: the complete local working tree, including preserved uncommitted work listed below

## Executive Summary

Core Vault is a functioning Tauri 1 desktop prototype, not merely a visual mock-up. A React/TypeScript renderer calls a deliberately narrow Rust command surface. Rust owns Bitcoin Core cookie authentication, JSON-RPC, wallet mutations, PSBT material, backup/restore calls, and local in-memory workflow state. The application implements a meaningful encrypted descriptor-wallet flow and a local Signet 2-of-3 proof of concept.

The strongest current foundation is the privileged Rust boundary: there is no generic arbitrary-RPC command, Core credentials do not enter JavaScript, the RPC client is loopback-only, and the personal-wallet send flow separates proposal, signing, finalization/preflight, and explicit broadcast. Those pieces should be preserved and hardened.

The implementation is nevertheless not ready to be treated as a reliable wallet. Its behavior is proven mainly by Rust unit tests, two loopback RPC mocks, and source-inspection Vitest tests. There is no real Bitcoin Core Regtest harness, no recovery integration test, no end-to-end PSBT proof, and no golden 2-of-3 test. Several inspected paths also deviate from the approved specifications: the legacy multisig command combines finalization and broadcast; legacy signer relocking errors are ignored; personal broadcast treats an unknown `testmempoolaccept` result as non-blocking; renderer-supplied absolute paths are not tied to an OS-dialog capability; and failed personal operations can leave passphrases in DOM inputs.

The current experience layer is a DOM/CSS spatial prototype. It contains useful semantic objects, review panels, native controls, reduced-motion CSS, and an accessible fallback structure, but it is not the required real-time world renderer. There is no Three.js, React Three Fiber, Drei, Canvas/WebGL scene, camera system, raycasting interaction system, or visual-state adapter. Replacing the primary room presentation is ultimately necessary, while retaining the working domain boundary and precision UI.

Overall roadmap position: **Phase 1 — Current Implementation Audit**. Phase 0 documentation exists. Phase 2 has useful precursors but is not complete because the domain behavior is not backed by reproducible Regtest golden tests and the typed/security boundaries still have known gaps. Phases 3 and 4 have not started under the authoritative acceptance criteria.

## Repository State

The audit began with these verified facts:

- `pwd` and `git rev-parse --show-toplevel` both resolved to `/Users/pavao/Desktop/Core Vault`.
- The Git remote named `origin` points to `https://github.com/btcpavao/core-vault`.
- The current branch was `master`, synchronized with `origin/master` at `e2e925e` before this audit document was created.
- All ten foundational documents, `docs/01_VISION_AND_PHILOSOPHY.md` through `docs/10_CODEX_RULES.md`, exist and were read completely before the implementation inspection.
- None of the foundational documents had a local diff and none were changed by this audit.
- The untracked root copy `Core Vault — Vision & Philosophy.md` is byte-identical to `docs/01_VISION_AND_PHILOSOPHY.md` (matching SHA-1 `d0b65a675b6f8d718f209655c1a9a321b1e92fd4`). It was not removed or added.

Unrelated local work existed before the audit and was deliberately preserved:

| State | Path | Pre-audit scope |
|---|---|---:|
| Modified | `docs/WORLD_ART_DIRECTION.md` | 30 additions, 12 deletions |
| Modified | `src/SpatialApp.tsx` | 156 additions, 87 deletions |
| Modified | `src/spatial.css` | 364 additions, 8 deletions |
| Modified | `tests/spatial.test.ts` | 13 additions, 2 deletions |
| Untracked | `Core Vault — Vision & Philosophy.md` | duplicate document |
| Untracked | `docs/SCENE_ASSET_CONTRACT.md` | supporting visual document |
| Untracked | `src/components/scenes/DiegeticScenes.tsx` | in-progress DOM/CSS scenes |

This audit evaluates that current local implementation because it is what a developer would run today. It does not claim that the uncommitted work is part of `origin/master`.

## Current Technology Stack

| Concern | Current implementation |
|---|---|
| Desktop host | Tauri 1 (`tauri` Rust crate 1.8.3, CLI 1.6.3) |
| Frontend | React 18.3.1 + TypeScript 5.9.3 |
| Build | Vite 8.2.1, Cargo/Rust 2021 |
| Package managers | npm with committed `package-lock.json`; Cargo with committed `Cargo.lock` |
| Privileged language | Rust |
| Renderer language | TypeScript/TSX + CSS |
| Frontend state | Component-local React state and refs; no state-management package |
| Routing | An in-component `SceneId` state switch; no URL router and no independent Scene Router service |
| Core transport | Rust `reqwest` JSON-RPC client |
| IPC | Typed TypeScript wrappers around explicit Tauri commands |
| File selection | Tauri dialog open/save allowlist; chosen absolute paths cross IPC to Rust |
| QR | Local `qrcode` package; no remote QR service |
| Tests | Vitest plus Rust built-in test framework |

Important directories and modules:

- `src/`: React renderer, current spatial shell, legacy multisig UI, translations, preferences, demo data, typed Tauri client, and CSS presentation.
- `src/components/`: reusable DOM controls and world primitives. The current untracked `src/components/scenes/` contains the newer Main Hall/Workshop/Engine DOM/CSS artefacts.
- `src/state/`: workflow/state vocabulary helpers; not the source of truth for current workflows.
- `src-tauri/src/`: privileged desktop entry point, Core RPC transport, personal-wallet domain operations, legacy 2-of-3 operations, validation/security helpers, and cross-boundary DTOs/state.
- `tests/`: two Vitest suites, mostly source-structure assertions and pure fixture/state checks.
- `docs/`: authoritative specifications plus supporting implementation/security documents.
- `scripts/`: currently empty.
- `src/assets/`: one ignored `bitcoin-logo.webp`; no tracked production asset pipeline.

## Desktop Architecture

### Privileged host

`src-tauri/src/main.rs` creates managed `AppState` and exposes named Tauri commands. Core RPC and filesystem mutations live in Rust. There is no Electron main process, preload script, Node integration, or renderer-side shell execution.

The Rust command surface is domain-oriented:

- discovery/connect/status/network commands;
- personal-vault list/create/read/backup/restore/unload/receive/passphrase/spend/sign/finalize/broadcast commands;
- legacy signer/multisig/public-backup/receive/spend/sign/finalize-and-broadcast commands.

No command accepts an arbitrary RPC method name. This is a valuable security boundary.

### Renderer

`src/main.tsx` mounts `SpatialApp`. `src/lib/tauri.ts` is the renderer's typed command adapter. React does not have direct Node or arbitrary filesystem access. It can invoke the exposed Tauri commands and the explicitly allowed native open/save dialogs.

### Tauri policy

`src-tauri/tauri.conf.json` has a default-deny allowlist with only dialog open/save enabled. The configured CSP allows the application itself, the Tauri IPC connection, data images, and inline styles; frames and objects are disabled. The window has a minimum size of 960×680. Bundling is currently disabled and no application icons are configured.

The policy is narrow, but command authorization is not capability-based. Backup, restore, and public-export commands accept any renderer-supplied absolute path that passes extension/basic validation. The backend does not prove that the path came from a just-completed OS dialog, and public JSON export can overwrite an existing `.json` file.

## Bitcoin Core Connection

### Transport and authentication

`src-tauri/src/rpc.rs` uses JSON-RPC over `reqwest`; it does not shell out to `bitcoin-cli`. The connection is restricted to loopback hosts. Redirects and proxy use are disabled. Cookie contents are read in Rust for each call into a `Zeroizing<String>`, split into username/password, and used for HTTP Basic authentication. Cookie contents are not returned to React.

Wallet-specific RPC uses a percent-encoded `/wallet/<name>` endpoint. Wallet names are restricted by `src-tauri/src/security.rs` to an auditable character set.

### Discovery and compatibility

Automatic discovery checks standard cookie locations for Signet, Testnet4, Regtest, and Mainnet, with a manual absolute cookie-path option. Core inspection calls `getblockchaininfo`, `getnetworkinfo`, `getmempoolinfo`, and `listwallets`. It labels supported chains and rejects Bitcoin Core versions older than 26.

Wallet mutation guards allow the personal implementation on Signet, Testnet4, Testnet, or Regtest and block personal wallet mutation on Mainnet. Legacy 2-of-3 methods use the narrower Signet-only guard.

Observed gaps:

- Discovery is a one-shot call. There is no background reconnection/polling service, `waitfornewblock`, or subscription/event transport.
- If an early auto-discovery candidate responds but is unsupported, the implementation appears to return that status instead of continuing through later candidates.
- There is one global 12-second HTTP timeout, including operations such as restore/rescan that can legitimately be long-running. There is no per-operation timeout, cancellation, retry, or idempotency policy.
- Version support is checked, but individual RPC capabilities are not negotiated.
- Core error sanitization removes newlines and truncates to 400 characters; it does not redact paths, addresses, wallet names, transaction IDs, or other sensitive context.
- `CoreStatus` returns the cookie **path** and loaded wallet names to React. The password is not exposed, but the authoritative architecture says credential and sensitive-path details should remain privileged.

RPC logic is isolated from React at the transport level. React calls domain-specific commands, but the Rust domain modules still construct RPC argument arrays and inspect largely untyped `serde_json::Value` responses directly.

## RPC Inventory

All current RPC calls are in `src-tauri/src/rpc.rs`, `src-tauri/src/personal.rs`, or `src-tauri/src/vault.rs`. “Typed” below describes response handling, not the typed Tauri DTO returned to React.

| Group | RPC | Feature and location | Response typing / errors | Test evidence | Audit result |
|---|---|---|---|---|---|
| Node | `getblockchaininfo` | Connect/discover in `rpc.rs` | Raw JSON with selected required fields | Loopback mock covers Signet and Mainnet rejection | Correct core inspection; **REFACTOR** typing |
| Node | `getnetworkinfo` | Core version/status in `rpc.rs` | Raw JSON; selected fields checked | Formatting unit test and loopback connect mock | **KEEP BUT HARDEN** |
| Node | `getmempoolinfo` | Status snapshot in `rpc.rs` | Raw JSON; selected fields | No behavioral integration test | **UNKNOWN — REQUIRES TESTING** |
| Node | `listwallets` | Status and wallet discovery in `rpc.rs`/`personal.rs` | Raw array converted to strings | Indirect loopback mock only | **REFACTOR** ownership/privacy |
| Node | `setnetworkactive` | Engine Room network breaker in `rpc.rs` | Boolean checked | No mutation test | Behavior plausible; confirmation and Mainnet policy missing |
| Wallet | `listwalletdir` | Personal vault list in `personal.rs` | Raw nested JSON | No real Core test | **PARTIAL**; unloaded wallets cannot be loaded |
| Wallet | `getwalletinfo` | Classification, encryption, lock state in personal and legacy flows | Raw JSON with field checks | Pure helpers only | **KEEP BUT TYPE/TEST** |
| Wallet | `getbalances` | Personal/coordinator balance | Raw JSON; BTC `f64` converted to sats | Conversion unit test in legacy module | **REFACTOR** monetary boundary/categories |
| Wallet | `listtransactions` | Personal activity | Raw JSON projected to DTO | No Core integration test | **UNKNOWN — REQUIRES TESTING** |
| Wallet | `createwallet` | Encrypted personal wallet; legacy signer/coordinator wallets | Raw result inspected indirectly | No real Core test | Personal call is strong; legacy signer creation is non-atomic |
| Wallet | `encryptwallet` | Legacy signer encryption after creation | Raw JSON | No interruption/recovery test | **REFACTOR**; temporary unencrypted state |
| Wallet | `unloadwallet` | Personal restored-copy cleanup and legacy cleanup | Generic success/error | No test; no personal test-chain guard | **REFACTOR** policy and lifecycle |
| Wallet | `walletpassphrasechange` | Personal passphrase change | Generic success/error | Passphrase validation unit test only | **KEEP BUT TEST** |
| Wallet | `walletpassphrase` | Personal and legacy signing unlock | Generic success/error; secret args hidden from trace | No relock-failure integration test | **KEEP BUT HARDEN** |
| Wallet | `walletlock` | Relock after signing | Error enforced in personal; ignored in legacy | No mock failure test | Personal **KEEP**; legacy **HIGH-PRIORITY REFACTOR** |
| Descriptor | `listdescriptors` | Restore identity and legacy signer public keys | Raw descriptors parsed/hashed | Parser/fingerprint unit tests | **KEEP BUT REDACT/TYPE/TEST** |
| Descriptor | `getdescriptorinfo` | Build/check 2-of-3 descriptors | Raw checksum/solvable/private fields | Descriptor construction unit tests | **KEEP BUT INTEGRATION-TEST** |
| Descriptor | `importdescriptors` | Coordinator receive/change policy import | Raw per-import results validated | Unit test checks both import results | **KEEP BUT INTEGRATION-TEST** |
| Backup | `backupwallet` | Personal and legacy signer backup | Call success plus local file metadata/non-empty checks | No real backup test | Correct API; verification and path authority incomplete |
| Restore | `restorewallet` | Personal recovery proof | Raw response; unique wallet name enforced in app | No real restore test | Correct API; **UNKNOWN until Regtest proof** |
| Receive | `getnewaddress` | Personal Taproot-style `bech32m`; legacy coordinator `bech32` | String plus local prefix checks | No Core integration test | **KEEP BUT TEST** |
| Receive | `getaddressinfo` | Ownership/solvability verification | Raw booleans | No Core integration test | **KEEP BUT TYPE/TEST** |
| Transaction | `validateaddress` | Destination validation | Raw `isvalid`/network information | No Core integration test | **KEEP BUT TYPE/TEST** |
| Transaction | `walletcreatefundedpsbt` | Personal and multisig proposals | Raw PSBT/fee/change position | Pure amount/output parsing tests only | **KEEP BUT HARDEN/TEST** |
| Transaction | `decodepsbt` | Personal output review | Raw outputs projected to review DTO | Pure parsing test | **KEEP BUT TYPE/TEST** |
| Transaction | `walletprocesspsbt` | Personal and legacy signing | Raw changed PSBT/completeness | No Core integration test | Personal passes `finalize=true`; legacy relies on defaults; **REFACTOR** |
| Transaction | `finalizepsbt` | Personal finalization and legacy combined final step | Raw completeness/hex | No Core integration test | Personal separation good; legacy command boundary wrong |
| Transaction | `testmempoolaccept` | Personal preflight | Raw first-result `allowed`/reason | No response-shape/failure tests | **REFACTOR** to fail closed on non-`true` |
| Transaction | `sendrawtransaction` | Personal explicit broadcast; legacy combined final/broadcast | Txid checked | No Regtest broadcast test | Personal boundary good; legacy boundary must split |

Not currently used despite being relevant to the approved architecture: `loadwallet`, `analyzepsbt`, `combinepsbt`, `estimatesmartfee`, `getpeerinfo`, `waitfornewblock`, `getblockhash`, `getblockheader`, `listsinceblock`, `gettransaction`, and `listunspent`.

## Wallet Functionality

### Personal / single signature

| Capability | Status | Evidence and caveat |
|---|---|---|
| Discover/list wallets | **PARTIAL** | `listwalletdir` + `listwallets`; the app implicitly adopts all compatible Core descriptor wallets and cannot load an unloaded one. |
| Create wallet | **IMPLEMENTED** | `personal_create_vault` calls `createwallet` with descriptors and private keys enabled. |
| Create encrypted wallet | **IMPLEMENTED** | Passphrase is supplied to `createwallet`; postconditions require encrypted and locked. |
| Set/use passphrase | **IMPLEMENTED** | Creation, change, and short signing unlock exist. UI clearance on failure is incomplete. |
| Lock/unlock | **IMPLEMENTED** | Signing unlocks for five seconds and personal flow treats relock failure as STOP. No independent lock/unlock UI. |
| Receive address | **IMPLEMENTED** | `getnewaddress` with `bech32m`, followed by `getaddressinfo(ismine)`. |
| Balance | **IMPLEMENTED** | Trusted plus untrusted-pending balances are shown; immature/category detail is collapsed. |
| Activity | **IMPLEMENTED** | Recent `listtransactions` data is projected to renderer DTOs. No reconciliation/pagination proof. |
| Backup | **IMPLEMENTED** | `backupwallet`, file existence/non-empty check, size, SHA-256 receipt. Receipt exists only in process memory. |
| Restore | **PARTIAL** | `restorewallet` under a unique name and public descriptor fingerprint comparison work by inspection; no real restore test, persistent recovery record, rescan model, or full recovery flow. |
| Create transaction | **IMPLEMENTED** | PSBT-first `walletcreatefundedpsbt`; manual fee rate only. |
| Review transaction | **PARTIAL** | Destination, amount, fee, change/output list, network, and mempool result are displayed. No fee estimate, full policy analysis, RBF detail, or stable PSBT identity. |
| Sign | **IMPLEMENTED** | Rust-held PSBT, short unlock, `walletprocesspsbt`, relock. It currently requests finalization during signing. |
| Finalize | **IMPLEMENTED** | Separate `finalizepsbt` command and state exist. |
| Preflight | **PARTIAL** | `testmempoolaccept` exists, but missing/null `allowed` does not block later broadcast. |
| Broadcast | **IMPLEMENTED** | Separate explicit command and renderer confirmation gate. Backend rechecks supported test chain and network-active state. |
| Cancel/discard draft | **PARTIAL** | React discards its view, but the Rust in-memory draft remains until process exit or successful broadcast. |

The “display name” is not persisted. Creation temporarily returns it, but a subsequent `get_personal_vault` derives the display name from the Core wallet name, so the user-facing name is lost.

## Passphrase Handling

Passphrases enter password inputs in `src/SpatialApp.tsx` and `src/App.tsx`, cross IPC only as command arguments, and are consumed in Rust personal/legacy methods. They do not enter `localStorage`, the preference model, wallet metadata, returned DTOs, or the RPC trace. Rust uses `Zeroizing<String>` for cookie credentials and hides passphrase-bearing RPC arguments from the visible trace.

Positive properties:

- React uses uncontrolled refs rather than global/application state for personal passphrases.
- Preferences persist only language, reduced-motion, audio, and walkthrough choices.
- The personal signer unlock window is five seconds and explicitly relocks.
- Raw passphrases are not intentionally logged or returned.

Gaps:

- In the current personal shell, create/change/sign input values are cleared only after a successful awaited operation. If IPC/Core returns an error, the passphrase remains in the DOM input until the user clears it, closes the panel, navigates away, or the component unmounts.
- IPC serialization and Rust/HTTP request construction necessarily create transient copies. There is no documented or testable guarantee that every intermediate string buffer is zeroized.
- Legacy signer relocking discards the `walletlock` result, so a failed relock can leave a signer unlocked until the Core timeout.
- No test asserts that passphrases are absent from errors, traces, DTOs, crash output, or failed-operation UI state.

No actual secret was used or printed during this audit.

## Backup & Restore

### Personal backup

`personal_backup_vault` uses Bitcoin Core's `backupwallet`; there is no manual copy of an active wallet database. The renderer opens a native save dialog and sends the selected absolute path to Rust. Rust checks success, file existence, file type, non-zero size, and computes SHA-256. A backup receipt is stored in `AppState.backed_up_wallets`.

This is a sound starting point, but the receipt disappears on app restart, an existing destination is not explicitly rejected, the absolute path is renderer-controlled, and there is no Regtest backup/recovery test. A non-empty file and checksum prove that bytes were written, not that the file can restore the wallet.

### Personal restore proof

`personal_restore_wallet` uses `restorewallet` with a new, unique wallet name. It derives a public fingerprint by sorting non-private descriptors from `listdescriptors(false)`, hashing the canonical public representation, and comparing the restored and original wallets. The restored copy can then be unloaded manually.

What is missing:

- a real Regtest test proving restored address ownership, balance/history, and signing behavior;
- explicit rescan/progress/timeout handling;
- a durable recovery-proof receipt;
- conflict/no-overwrite capability at the file boundary;
- full-restore UX distinct from a recovery test;
- automatic cleanup policy for interrupted restores.

No files are automatically deleted. This is consistent with the non-destructive requirement.

### Legacy signer backup and public backup

Each legacy signer uses `backupwallet` and checks that the output is a non-empty file, but does not compute/store a checksum. The public 2-of-3 backup is a JSON document containing public extended keys/descriptors and coordinator metadata. It is scanned for private-looking material before being written.

The public exporter writes directly to an arbitrary validated absolute `.json` path and can overwrite an existing file. There is no implemented reconstruction/import workflow that proves the public backup is sufficient to recreate the coordinator.

## Receive Flow

Personal receive calls `getnewaddress` with `bech32m`, then requires `getaddressinfo.ismine`. The address and a locally generated QR code are rendered in Communications. The QR never goes to an external service.

The legacy coordinator calls `getnewaddress` with `bech32`, checks a testnet-style `tb1` prefix and `getaddressinfo.solvable`, and reports watch-only status. There is no Regtest/Signet integration test for sequential address derivation or recovery determinism.

## Send / Transaction Flow

### Personal flow

The actual sequence is:

1. React collects destination, amount, and manual fee rate.
2. `personal_create_spend` validates destination/amount/fee, calls `validateaddress`, then `walletcreatefundedpsbt`.
3. Rust calls `decodepsbt`, builds an output review including change, and keeps the raw PSBT in `AppState.personal_spend_drafts`.
4. `personal_sign_spend` verifies the draft snapshot, unlocks for five seconds, calls `walletprocesspsbt` with `finalize=true`, and relocks. A relock error stops the operation.
5. `personal_finalize_spend` calls `finalizepsbt`, stores raw transaction hex in Rust memory, and calls `testmempoolaccept`.
6. React displays destination, amount, fee, outputs/change, network, and preflight status. Broadcast requires a dedicated warning view, a checked confirmation box, and active P2P networking.
7. `personal_broadcast_spend` rechecks test-chain policy and `networkactive`, then calls `sendrawtransaction` and removes the Rust draft.

This is PSBT-first; it does not use `sendtoaddress`. Signing, finalization, and broadcast are separate user-visible actions. Deviations are the `finalize=true` signing call, missing `analyzepsbt`, manual-only fee policy, absence of stable PSBT identity/cancellation, and fail-open handling of an unknown preflight result.

### Legacy 2-of-3 flow

The legacy flow creates a funded PSBT, signs it successively with local signer wallets, and then calls a single `finalize_and_broadcast` command. The UI has an explicit broadcast button, but the backend command combines finalization with broadcast and does not call `testmempoolaccept` or recheck `networkactive`.

**SPECIFICATION DEVIATION:** approved documents require signing, finalization, preflight, and broadcast to remain distinct, with explicit user intent at the final boundary.

## PSBT Architecture

### Personal PSBT

- Creation: `walletcreatefundedpsbt`.
- Decode/review: `decodepsbt`; destination, outputs, change, amount, fee, and network are projected into typed DTOs.
- Storage: raw PSBT remains in Rust process memory; the renderer receives review/state, not the raw PSBT.
- Signing: `walletprocesspsbt`; completeness and a changed PSBT are checked.
- Combination: no `combinepsbt`; one local wallet signs the personal PSBT.
- Analysis: no `analyzepsbt`.
- Finalization: separate `finalizepsbt`.
- Preflight: `testmempoolaccept` after finalization.
- Broadcast: separate `sendrawtransaction`.
- Import/export/transport: not implemented.
- Persistence: no disk persistence of draft PSBT/raw transaction.
- Logging: PSBT and raw hex arguments/results are manually hidden from the renderer trace.

Draft IDs are process-local time/counter identifiers, not hashes derived from an immutable transaction proposal. The backend checks that the stored PSBT equals the signing snapshot before accepting a signature mutation, which is useful, but there is no durable identity or restart recovery.

### Legacy multisig PSBT

- Creation: coordinator `walletcreatefundedpsbt`.
- Decode/review: limited proposal details; not a full decoded output/change/policy review.
- Storage: Rust in-memory draft.
- Signing: sequential `walletprocesspsbt` calls against locally loaded signer wallets.
- Signature attribution: inferred from the selected signer wallet and PSBT mutation, not independently verified from decoded partial signatures.
- Combination: implicit sequential mutation; no import/export or `combinepsbt` path.
- Completeness: trusted from Core's `walletprocesspsbt` response.
- Finalization/broadcast: combined command.
- Offline/distributed transport: not implemented.

## 2-of-3 Multisig

### Model and policy

The legacy implementation in `src-tauri/src/vault.rs` creates three local descriptor signer wallets with private keys enabled. It then derives public receive/change key material and builds checksummed public policies of the form:

```text
wsh(sortedmulti(2,<public-key-1>,<public-key-2>,<public-key-3>))
```

The coordinator is a blank descriptor wallet with private keys disabled. Receive and change descriptors are imported separately. The code validates distinct signer origin/key identity, correct `/0/*` and `/1/*` branches, lack of private material, Core descriptor checksums, solvability, and both import results.

The descriptor itself genuinely enforces two signatures out of three. The local demo does **not** establish operational key separation: all three keys are generated and normally loaded on the same Bitcoin Core instance, and there is no hardware-wallet, air-gapped, file/QR, or independent-device signing path.

### Key creation and encryption

Legacy signers are created unencrypted and then encrypted in a second RPC call. A crash or RPC failure between `createwallet` and `encryptwallet` can leave an unencrypted signer wallet. Personal-vault creation avoids this by passing the encryption passphrase directly to `createwallet`.

### Coordinator and balances

The private-key-disabled coordinator imports both public descriptors, derives receive addresses, and uses Core wallet balance calls. The public backup includes enough policy metadata to be promising, but reconstruction has not been implemented or proven.

### PSBT and threshold behavior

The code requires two distinct selected signer IDs before finalization. Core's sortedmulti policy provides the actual 2-of-3 consensus condition. However, signer attribution, partial-signature accumulation, finalization, and broadcast are not proven against a real Core node. There is no export/import/combine path, so the current implementation is a same-machine demonstration rather than a real shared-custody workflow.

### Classification

**KEEP BUT HARDEN** the descriptor construction/validation, coordinator separation, public-only backup schema checks, and domain-oriented Rust commands. **REFACTOR** signer creation, relocking, PSBT signing/attribution, transport, and the combined finalization/broadcast command. Do not replace the entire backend before golden Regtest tests establish which behavior is correct.

### Existing and missing tests

Existing Rust unit tests cover sortedmulti construction, duplicate signer rejection, public descriptor parsing, branch/origin mismatch rejection, private-material rejection, balance conversion, and validation of both descriptor import results.

Missing proof includes:

- create three encrypted signers without any unencrypted intermediate;
- import coordinator receive/change descriptors on Regtest;
- fund and confirm the coordinator;
- create one immutable proposal;
- sign with signer 1, prove one signature is insufficient;
- sign with a distinct signer 2, prove the same proposal becomes complete;
- prove a duplicate signer cannot advance the threshold;
- finalize, preflight, explicitly broadcast, and observe confirmation;
- reconstruct coordinator state from the public backup;
- recover signer backups and prove deterministic ownership/signing.

## Current Application State Architecture

`src/SpatialApp.tsx` is an approximately 800-line orchestrator that owns connection mode, current room, selected wallet, overlays, workflow drafts, errors, animation flags, and most domain calls. It uses `coreApi` rather than raw RPC, which is good, but UI orchestration and domain workflow state are tightly interleaved.

Rust `AppState` stores connection data, personal and legacy spend drafts, legacy vault drafts, and personal backup receipts behind mutexes. This protects raw PSBT material from the renderer but is process-local: drafts and backup state disappear on restart, while stale drafts remain until broadcast/process exit.

`src/state/machines.ts` defines useful state unions, `deriveCoreState`, and a PSBT transition helper. Only part of this vocabulary drives the current application; it is not a set of authoritative runtime workflow machines. React `useState` variables and Rust command preconditions are the actual distributed state machine.

There is no dedicated application-state store, Core reconciliation service, Scene Router, Visual State Adapter, or persisted non-secret workflow ledger.

## Current UI / Presentation Architecture

The current local work contains eight room IDs in one React component:

| Room | Current rendering | Functional role | Classification |
|---|---|---|---|
| Main Hall | Layered semantic DOM/CSS architecture (`SceneShell`, portals, pedestals) | Room selection and vault selection | Spatial prototype/hybrid; not 3D |
| Workshop | Layered DOM/CSS artefacts and contextual form overlay | Personal creation and legacy multisig entry | Spatial prototype/hybrid; not 3D |
| Vault Chamber | `WorldScene` CSS set plus DOM monument/panels | Wallet identity, balance, activity, passphrase | SVG/CSS/DOM scene |
| Archive | `WorldScene` plus artefact buttons and form overlays | Backup and recovery proof | SVG/CSS/DOM scene |
| Communications | `WorldScene` plus receive/send artefacts and review overlays | Address/QR and PSBT send | SVG/CSS/DOM scene |
| Engine Room | Layered DOM/CSS machine and controls | Core status and network toggle | Spatial prototype/hybrid; not 3D |
| Observatory | `WorldScene` and status artefacts | Chain/mempool/RPC snapshot | SVG/CSS/DOM scene; not live observation |
| Library | `WorldScene` and tablet overlays | Help, sources, limitations | SVG/CSS/DOM scene |

There is no conventional URL page router, Canvas, WebGL, scene graph, geometry, materials, lights, camera, model loader, raycaster, post-processing, or real-time renderer. Room changes are a React state switch. “Block pulse” presentation reacts only when the stored block height changes after another status update; there is no background new-block observation.

### Structural visual dead end

The prototype has moved beyond background-image cards: the current Main Hall, Workshop, and Engine Room use object-like DOM controls rather than article images as direct backgrounds. That is useful design exploration. The primary renderer is nevertheless a dead end against the approved specification because:

- space is simulated by CSS layers and absolute-positioned DOM, not represented as a navigable world model;
- room identity, camera composition, focus, interaction, and responsive layout are coupled inside one React component/CSS file;
- artefact activation is ordinary button clicking, not a unified pointer/keyboard/raycast interaction contract;
- contextual overlays are still form-heavy and can dominate the room;
- five rooms remain generic `WorldScene` compositions rather than distinct spatial systems;
- the current approach cannot naturally implement controlled camera states, depth, occlusion, lighting state, material state, scene preloading, or visual transitions driven through a Visual State Adapter;
- decorative CSS machinery and operational state are not consistently the same object.

Therefore the implementation does not yet satisfy **“the world is the interface”** as defined by documents 03, 04, 05, 06, 08, and 10. The DOM precision layer can remain, but it should not remain the primary world renderer.

**SPECIFICATION CONFLICT:** the current uncommitted supporting files `docs/WORLD_ART_DIRECTION.md` and `docs/SCENE_ASSET_CONTRACT.md` describe the DOM/CSS Main Hall, Workshop, and Engine Room direction as “fully diegetic” or as the target presentation. The authoritative foundational documents require a real-time Three.js/React Three Fiber world renderer and define DOM as a contextual precision/accessibility layer. This audit records the contradiction without modifying either set of documents.

### Interaction and accessibility

Positive baseline work includes native buttons/inputs, semantic labels, status roles, visible focus styling, a skip/fallback main region, `prefers-reduced-motion` handling, and responsive CSS breakpoints. The demo ribbon clearly labels disconnected demo data.

Gaps include no focus trap, initial-focus management, or focus restoration for modal/context overlays; no consistent Escape behavior; no accessibility bridge mapping 3D artefacts to DOM controls; and no automated accessibility or keyboard-navigation test.

Network controls mutate immediately. Both the physical breaker and button lack the confirmation flow required by the interaction specification. Personal creation also introduces an artificial minimum animation delay while the backend operation has already started, conflicting with the rule that operational truth must not wait for presentation choreography.

## Reusable Frontend Work

| Subsystem | Classification | Rationale / desired boundary |
|---|---|---|
| `src/lib/tauri.ts` typed command client | **KEEP BUT REFACTOR** | Preserve explicit domain commands and TS DTOs; hide sensitive path/trace fields and add stronger versioned results. |
| Personal transaction review/broadcast gate | **KEEP BUT REFACTOR** | Preserve exact review and explicit confirmation; feed it immutable proposal state from domain services. |
| Address and local QR rendering | **KEEP** | Local generation, no privacy leak; adapt as contextual/fallback UI. |
| Native open/save dialogs | **KEEP BUT HARDEN** | Preserve UX; bind selected path to a one-use backend capability and no-overwrite policy. |
| Uncontrolled passphrase forms | **KEEP BUT HARDEN** | Avoid global state; clear in `finally`, restore focus safely, and test absence from outputs. |
| `src/i18n.ts` | **REFACTOR** | Reusable dictionary approach, but many current English strings bypass it and coverage is incomplete. |
| `src/lib/preferences.ts` | **KEEP** | Narrow allowlist and non-secret local preferences. |
| `src/lib/audio.ts` | **KEEP BUT REFACTOR** | Local synthesized audio avoids remote assets; connect to semantic events and accessibility preferences. |
| `src/lib/demo.ts` / `src/lib/spatialDemo.ts` | **KEEP** | Clear disconnected demo fixtures are useful for visual work; prevent accidental mixing with real state. |
| `src/state/machines.ts` | **REFACTOR** | Keep vocabulary, make explicit workflow controllers authoritative and shared with visual-state mapping. |
| `src/components/ui.tsx` precision primitives | **KEEP BUT REFACTOR** | Retain semantic control behavior; decouple visual room composition. |
| `src/components/world.tsx` | **REPLACE as primary renderer** | May survive as fallback/accessibility presentation, not as the immersive world. |
| `src/SpatialApp.tsx` orchestration | **REFACTOR** | Split domain state, Scene Router, visual-state adapter, and contextual UI. |
| `src/App.tsx` legacy 2-of-3 wizard | **KEEP TEMPORARILY / REFACTOR** | Preserve as a working fallback until the hardened multisig domain flow and new shell are proven. |

## Current Asset Strategy

The only file found under `src/assets/` is `bitcoin-logo.webp` (2,756 bytes), and `src/assets/` is ignored wholesale by `.gitignore`. No inspected renderer import uses that file. The code synthesizes visual space through CSS gradients, borders, data-URI SVG noise, icons from `lucide-react`, and DOM structure.

Findings:

- no `.glb`, `.gltf`, 3D textures, environment maps, or model source files;
- no audio files; current audio is synthesized with Web Audio;
- no bundled custom fonts; CSS uses system font stacks;
- no article/reference artwork currently used as a runtime background;
- no runtime CDN image/font/model dependency;
- no tracked asset manifest, provenance, license, attribution, optimization budget, or source-to-runtime pipeline;
- `src/assets/` being broadly ignored can silently hide future production assets and conflicts with the specification's requirement to preserve and account for source assets.

No definite third-party licensing violation can be established from repository metadata because almost no runtime asset metadata exists. The absence of provenance is itself a release blocker once image/model/audio assets are introduced.

## Dependencies

### JavaScript runtime

- React 18.3.1 / React DOM 18.3.1
- `@tauri-apps/api` 1.6.0
- `lucide-react` 0.468.0
- `qrcode` 1.5.4

Build/test dependencies include TypeScript 5.9.3, Vite 8.2.1, Vitest 4.1.10, the React Vite plugin, Tauri CLI, and type packages. There is no Redux, Zustand, XState, TanStack Router, Axios, Bitcoin JavaScript library, or motion package.

### Rust direct dependencies

`tauri` 1.8.3, `reqwest` 0.11.27 with Rustls, `serde`, `serde_json`, `sha2`, `percent-encoding`, `zeroize`, and `thiserror` are direct dependencies. Inspection found no use of `thiserror`; it is a candidate for later cleanup, not removal during this audit.

### Required renderer answers

| Question | Answer |
|---|---|
| Three.js included? | **No** |
| React Three Fiber included? | **No** |
| Drei included? | **No** |
| Another 3D renderer included? | **No** |
| Canvas renderer included? | **No** |
| WebGL code present? | **No** |

## Testing Infrastructure

Available commands are taken directly from `package.json`:

| Command | Exact behavior |
|---|---|
| `npm run dev` | Vite development server on port 1420 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | TypeScript check, `cargo fmt --check`, and locked Clippy with warnings denied |
| `npm test` | `vitest run` |
| `npm run build` | TypeScript check and Vite production build |
| `npm run test:rust` | locked Cargo tests |
| `npm run verify` | lint, Vitest, Vite build, and Rust tests |
| `npm run tauri build` | Tauri release build through the CLI |

Current coverage:

- `tests/prototype.test.ts` and `tests/spatial.test.ts`: 26 passing Vitest tests total. Most inspect source text or pure fixture/state helpers rather than mounting React and exercising user behavior.
- Rust: 22 passing tests. Most are validation/parser/state helpers; two use a local loopback mock RPC server to prove Signet connection and immediate Mainnet rejection in the legacy guard.
- No browser/component integration suite.
- No E2E desktop test.
- No visual regression test.
- No automated accessibility test.
- No Regtest harness, `bitcoind` fixture, or `bitcoin-cli` test scripts.
- No real wallet, backup/restore, receive, PSBT, broadcast, or multisig integration test.
- No `.github` CI workflow.

Some source-string tests can pass even when behavior is unsafe. In particular, existing tests do not catch ignored legacy relock errors, unknown preflight responses, passphrase retention after failure, or combined multisig finalization/broadcast. A source assertion currently treats the existence of `finalize_and_broadcast` as expected, thereby preserving a specification deviation rather than detecting it.

## Build Status

Safe checks run on 2026-08-13 against the preserved local working tree:

| Command | Result |
|---|---|
| `npm run verify` | **PASS** |
| TypeScript / `cargo fmt --check` / Clippy | **PASS**; Cargo emitted three non-fatal `rustc-check-cfg` build-script warnings |
| `vitest run` | **PASS** — 2 files, 26 tests |
| Vite production build | **PASS** — 1,608 modules transformed |
| `cargo test --locked` | **PASS** — 22 tests |
| `npm run tauri build` | **PASS** — optimized release build completed; bundling is disabled in config |
| `npm audit --audit-level=low` | **PASS** — 0 known npm vulnerabilities reported at audit time |

No Bitcoin integration test was run. The repository contains no clearly isolated Regtest integration suite, and invoking real wallet commands against an unknown locally running Core would risk mutation. No Mainnet wallet operation was attempted.

## Security Findings

This is a first-pass architecture review, not a cryptographic or production security audit. No confirmed **CRITICAL** issue was found.

### Positive controls

- Core RPC is loopback-only; HTTP proxy and redirects are disabled.
- Cookie contents remain in Rust and are wrapped in zeroizing storage while parsed.
- Tauri exposes named domain commands, not arbitrary RPC, shell, or filesystem APIs.
- The Tauri allowlist and CSP are narrow.
- Personal wallet mutation is blocked on Mainnet; legacy mutation is Signet-only.
- Raw PSBT and raw transaction hex stay in Rust memory and are hidden from renderer trace output.
- Personal signing attempts to relock and treats relock failure as a STOP condition.
- Personal broadcast is an explicit command and rechecks network policy.
- No direct wallet-database editing or manual copying of active wallet files was found.

### Findings

| Severity | Finding | Evidence / consequence |
|---|---|---|
| **HIGH** | Renderer-controlled absolute-path authority | Backup/restore/public-export commands accept absolute paths without a one-use OS-dialog capability. A compromised renderer can direct privileged writes/reads within user/Core permissions; public JSON export can overwrite an existing `.json`. |
| **MEDIUM** | Legacy relock failure is ignored | `vault.rs` discards `walletlock` errors after signing, contradicting the documented STOP rule and potentially extending signer unlock exposure. |
| **MEDIUM** | Legacy signer exists unencrypted between two RPCs | Separate `createwallet` then `encryptwallet` is interruption-prone. This is currently test-funds-only but architecturally unsafe. |
| **MEDIUM** | Personal preflight is not strictly fail-closed | Broadcast blocks only explicit `Some(false)`; a missing/null `allowed` value can proceed to explicit broadcast. |
| **MEDIUM** | Legacy finalization and broadcast are combined | There is no `testmempoolaccept` or backend network-active check at that boundary, and a finalization request can also transmit. |
| **MEDIUM** | Passphrases remain in DOM after failed personal operations | Personal create/change/sign clear refs only after success, increasing exposure duration. |
| **MEDIUM** | Sensitive operational data crosses into renderer trace/status | Cookie path, wallet names, addresses, balances, transaction summaries/IDs, and public descriptors can enter React. Error sanitization truncates but does not redact. |
| **MEDIUM** | Mainnet read-only policy is incomplete | Personal wallet creation/spending is guarded, but `unload_wallet` and `setnetworkactive` can still mutate Core state on Mainnet. Whether network toggling is intentionally permitted requires an explicit policy decision. |
| **LOW** | One 12-second timeout for all RPCs | Long restore/rescan operations can fail ambiguously; there is no cancellation or operation-specific handling. |
| **LOW** | In-memory workflow state has no lifecycle cleanup | Failed/discarded drafts can remain in Rust memory until exit; recovery receipts disappear on restart. |
| **LOW** | Broad asset ignore rule | `src/assets/` can contain unreviewed/unversioned production assets and provenance gaps. |
| **INFORMATIONAL** | `f64` BTC/sat boundary | Core decimal amounts are parsed through floating point and rounded. Current helper tests exist, but a decimal/satoshi-safe boundary is preferable before production. |

No generic shell execution, command interpolation, secret-bearing persistent log, telemetry SDK, analytics library, or crash-reporting endpoint was found.

## Privacy Findings

Confirmed automatic outbound application traffic is limited to the configured local Bitcoin Core JSON-RPC endpoint. The Rust client explicitly rejects non-loopback RPC hosts.

No renderer `fetch`, Axios client, WebSocket, remote font, Google API, analytics, mempool.space call, price API, external QR service, CDN asset, telemetry, or crash-reporting service was found. QR codes are generated locally. Demo mode is local fixture data.

The Library contains user-activated external links to Bitcoin Core documentation and the Bitcoin Design Guide. Opening those links in a browser is an explicit user action and creates normal browser traffic; it is not background wallet telemetry.

Privacy inside the app still needs hardening because broad wallet metadata and RPC trace summaries enter renderer memory. Even public descriptors, addresses, balances, wallet names, transaction IDs, and cookie paths are sensitive operational data when combined. The trace is session UI data rather than a disk log, but a renderer compromise or screen capture can expose it.

## Specification Gap Analysis

Comparison with `docs/03_TECHNICAL_ARCHITECTURE.md`:

| Desired layer | State | Evidence and gap | Action |
|---|---|---|---|
| Desktop Host | **EXISTS** | Tauri/Rust privileged host with narrow allowlist | **KEEP** |
| Bitcoin Core Transport | **EXISTS** | Loopback cookie-auth JSON-RPC in `rpc.rs`; raw JSON/global timeout/trace leakage remain | **REFACTOR** |
| Typed Core Adapter | **PARTIAL** | Tauri DTOs are typed, Core responses are mostly `serde_json::Value` with ad hoc extraction | **REFACTOR** |
| Domain Services | **PARTIAL** | `personal.rs` and `vault.rs` contain domain operations but also direct RPC/state mechanics | **REFACTOR** |
| Application State | **PARTIAL** | React local state plus Rust mutex maps; no durable reconciliation/source-of-truth model | **REFACTOR** |
| State Machines | **PARTIAL** | State vocabulary exists; workflows are actually distributed across UI/Rust conditionals | **REFACTOR** |
| Visual State Adapter | **MISSING** | Domain state is read directly by room JSX/CSS | **CREATE** |
| Experience Renderer | **MISSING** | DOM/CSS imitation only; no required real-time renderer | **REPLACE/CREATE** |
| Contextual UI | **EXISTS** | Forms, review overlays, status/detail panels | **KEEP BUT REFACTOR** |
| Accessibility Bridge | **PARTIAL** | Native semantic controls/fallback exist; no world-to-DOM bridge/focus system | **REFACTOR/CREATE** |
| Mock/Regtest mode | **PARTIAL** | Disconnected demo and tiny loopback RPC mocks exist; no Regtest product/integration harness | **KEEP DEMO, CREATE REGTEST** |
| Scene Router | **PARTIAL** | Plain `scene` state and `go()` function; no independent routing/transition/preload service | **REFACTOR** |
| Camera System | **MISSING** | No camera representation or controlled camera states | **CREATE** |
| Interaction System | **PARTIAL** | Semantic DOM buttons and keyboard basics; no raycast/focus/navigation contract | **KEEP CONTRACTS, CREATE SYSTEM** |

## KEEP

1. **`src-tauri/src/main.rs` domain-specific Tauri command boundary**
   Responsibility: limits renderer authority to named product operations.
   Value: no arbitrary RPC/shell bridge; correct privileged placement.
   Evidence: TypeScript/Clippy/build pass; loopback security tests exercise connection guards.

2. **Loopback cookie-auth transport controls in `src-tauri/src/rpc.rs`**
   Responsibility: authenticated local Core communication with wallet endpoint encoding.
   Value: local-only, proxy/redirect-disabled, cookie secret retained in Rust.
   Evidence: loopback connect and remote-host rejection tests.

3. **Personal wallet atomic encrypted creation and postcondition checks in `personal.rs`**
   Responsibility: create a descriptor wallet already encrypted and verify it is locked.
   Value: avoids the legacy unencrypted intermediate.
   Evidence: code invariants and passphrase-policy tests; still needs Regtest proof.

4. **Personal backup/restore public-identity approach**
   Responsibility: use `backupwallet`/`restorewallet`, hash canonical public descriptors, never delete automatically.
   Value: follows approved Core-owned backup model and tests recovery rather than file presence alone.
   Evidence: stable-fingerprint unit test; recovery itself remains unproven.

5. **2-of-3 public descriptor construction and validation helpers in `vault.rs`**
   Responsibility: enforce public `wsh(sortedmulti(2,...))`, distinct key origins, correct branches/checksums, and private-key-disabled coordinator.
   Value: sound policy structure and reusable validation.
   Evidence: focused descriptor and import-result unit tests.

6. **Raw PSBT/raw transaction confinement to Rust in-memory state**
   Responsibility: keep signing material out of routine renderer state and persistence.
   Value: smaller exposure surface.
   Evidence: typed renderer results and trace-redaction code; no persistence path found.

7. **Explicit personal broadcast UI and command**
   Responsibility: show review/preflight/network state and require confirmation.
   Value: matches user-intent boundary better than one-click send.
   Evidence: source inspection and source-structure tests; needs behavioral test.

8. **Local QR, narrow preferences, clear demo fixtures, and semantic UI primitives**
   Responsibility: privacy-preserving utility and accessible fallback/context layer.
   Value: reusable independently of the future renderer.
   Evidence: Vitest fixture/preferences/state checks and successful build.

## REFACTOR

1. **Introduce a versioned typed Core adapter below domain services.** Replace ad hoc raw `serde_json::Value` extraction with typed response structures/runtime validation, explicit capability errors, per-operation timeouts, and redacted errors. Keep RPC calls out of scenes and React.

2. **Make workflows authoritative state machines.** Move wallet creation, recovery proof, proposal/sign/finalize/preflight/broadcast, and cancellation into explicit domain/application controllers. React and the future renderer should consume immutable states/events rather than coordinate RPC steps.

3. **Harden path capabilities.** Native dialog selection should mint a narrow, one-use backend token; privileged commands should reject arbitrary paths, unsafe overwrite, type changes, and stale capabilities.

4. **Correct personal PSBT boundaries.** Sign without finalizing, add explicit analysis/completeness state, fail closed unless preflight is explicitly accepted, use stable proposal identity, and add backend cancellation/cleanup. Preserve explicit finalization and broadcast commands.

5. **Harden legacy 2-of-3 without rewriting validated policy helpers.** Create signers encrypted atomically, enforce relock errors, distinguish cryptographic signer attribution, support import/export/combine transport, and split finalization/preflight/broadcast.

6. **Reduce renderer data exposure.** Keep cookie paths, raw RPC traces, broad wallet lists, and descriptors privileged unless a specific presentation need justifies a redacted DTO.

7. **Split `SpatialApp.tsx`.** Separate application/domain state, Scene Router, Visual State Adapter, contextual precision UI, accessibility bridge, and eventual world renderer. Preserve existing working actions during migration.

8. **Finish localization and accessibility behavior.** Route all product strings through localization; add focus trap, initial focus, Escape, restoration, reduced-motion semantics, and automated keyboard/accessibility tests.

9. **Make status live and truthful.** Add privileged, cancellable Core observation/reconnection rather than presentation-only block pulses or one-shot snapshots. Do not animate ahead of confirmed operational state.

10. **Define an asset pipeline.** Remove the broad source-asset blind spot later, add tracked provenance/license/budget metadata, and distinguish source, generated, optimized, and runtime assets.

## REPLACE

1. **Replace the DOM/CSS room composition as the primary experience renderer.** `WorldScene`, current room-specific CSS architecture, and absolute-positioned DOM artefacts cannot provide the approved camera, depth, material, light, occlusion, preload, and spatial interaction model. Retain a simplified variant as fallback/accessibility presentation where useful.

2. **Replace in-component room switching with a real Scene Router.** Preserve room IDs and navigation intent, but move routing, preload, transition, focus, return-point, and deep-link rules into an independent system.

3. **Replace decorative state coupling with a Visual State Adapter.** Room visuals must consume validated domain states, not inspect and mutate workflow variables directly.

4. **Replace the combined legacy `finalize_and_broadcast` product boundary.** This is a command-contract replacement, not a wholesale multisig rewrite: finalization, mempool preflight, confirmation, and broadcast must be independently represented.

No current UI, asset, dependency, or backend module should be deleted until its replacement passes golden tests and the fallback path remains usable.

## UNKNOWN / REQUIRES TESTING

1. **Personal backup recoverability.** Required test: create/fund an encrypted Regtest wallet, back it up, restore under a distinct name, verify canonical public fingerprint/address ownership/balance/history, sign with the restored copy, and unload it without affecting the original.

2. **2-of-3 end-to-end correctness.** Required test: create coordinator/signers, fund, prove one signature insufficient, add a distinct second signature to the same immutable proposal, finalize, preflight, broadcast, confirm, and reject duplicate signer attribution.

3. **Public coordinator reconstruction.** Required test: recreate a blank private-key-disabled coordinator only from exported public data and prove receive/change derivation and balance/history recovery.

4. **Signer backup recovery.** Required test: restore at least two signer backups independently and prove they satisfy the original coordinator policy without revealing private descriptors to the renderer/log.

5. **PSBT mutation and attribution.** Required test: compare decoded inputs/outputs/fee/change and partial signatures after every signer; prove no reviewed field changes across signing/combination.

6. **Failure/restart behavior.** Required test: interrupt creation, backup, restore, signing, finalization, and broadcast; restart the app/Core and verify truthful state, cleanup, idempotency, and no unintended transmission.

7. **Core-version/network matrix.** Required test: exercise Core 26 through the supported current version on Signet, Testnet4, Testnet, and Regtest; prove Mainnet remains within the approved read-only policy.

8. **Renderer behavioral/accessibility correctness.** Required test: mounted keyboard/pointer flows, focus restoration, screen-reader labels, reduced motion, responsive edge clearance, and explicit broadcast confirmation.

## Current Roadmap Position

The repository is currently in **Phase 1 — Current Implementation Audit**.

- Phase 0 is substantially complete: the ten authoritative documents exist and the baseline is committed. The preserved dirty tree must remain visible until its author decides how to checkpoint it.
- Phase 1 is completed by this document.
- Phase 2 is **not complete**. The privileged boundary exists and is promising, but response typing, secret/path minimization, workflow state machines, fail-closed transitions, and Regtest golden tests are incomplete.
- Phase 3 is **not started by specification criteria**. The DOM/CSS spatial prototype explores art direction, but there is no real-time shell, R3F Canvas, Scene Router, camera, interaction manager, accessibility bridge, or Visual State Adapter.
- Phase 4 and later room migration/asset production phases have not started.

Visual polish must not be used as evidence that the repository has advanced past domain hardening and the real-time shell prerequisites.

## Recommended First Implementation Task

**Implement one reproducible Regtest integration harness and a golden Personal Vault recovery test through the existing Rust/Tauri domain boundary: create an encrypted wallet, assert it is locked, create a Core-owned backup, restore it under a unique name, compare canonical public identity/address ownership, and unload the restored copy—without changing the UI or production RPC semantics.**

Why this is first:

- it follows Phase 2 before renderer work;
- it establishes evidence for the most safety-critical “backup is not recovery” promise;
- it exercises cookie auth, wallet endpoints, passphrase transport, long-running RPC behavior, filesystem boundaries, descriptor fingerprinting, and cleanup together;
- it creates a safety net before refactoring typed adapters, path capabilities, PSBT state, or multisig;
- it is narrow enough to complete and review as one task.

This audit does not implement that task.

## Known Risks

- A successful build and unit suite can create false confidence because no real Core wallet lifecycle is exercised.
- The current same-machine 2-of-3 demo can be mistaken for independent key custody.
- Restore success is inferred from Core response/public descriptors without a golden recovery test.
- Personal preflight can be unknown while broadcast remains available at the backend boundary.
- Legacy finalization can transmit as part of the same command.
- Renderer-controlled paths and renderer-visible operational metadata exceed the intended privileged boundary.
- Failed personal operations extend passphrase lifetime in the DOM.
- Current DOM/CSS visual work can consume substantial effort while remaining incompatible with the required renderer architecture.
- Untracked/ignored assets and absent provenance can become a legal/reproducibility problem once production art begins.
- In-memory-only drafts and receipts have undefined restart behavior.

The correct next move is evidence and boundary hardening, not a visual rewrite.
