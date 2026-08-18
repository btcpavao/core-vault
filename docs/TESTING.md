# Testing

## Automated

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run test:rust
npm run verify
```

Rust RPC tests bind a temporary loopback port. A restrictive sandbox may require permission for local networking.

## Future cinematic scene QA

The renderer-neutral Experience System must add proof-level QA as it is implemented:

- deterministic tests from domain state through Visual State Adapter to semantic scene state;
- runtime checks for offline, syncing, ready, network-disabled, and real new-block states;
- screenshot comparison and visual-regression review at canonical viewpoints;
- keyboard and screen-reader tests for semantic interaction regions;
- Reduced Motion tests for transitions, parallax, ambient motion, and state legibility;
- no-network-asset checks for every packaged scene resource;
- crop/resolution registration checks for masks and hit regions;
- packaged desktop performance and decoded-memory measurements;
- manual high-fidelity review against the approved reference;
- explicit rejection of sticker-like SVG/CSS effects or contextual UI disconnected from the authored scene.

These requirements do not alter existing Bitcoin/domain tests. They must be implemented with the Engine Room cinematic 2.5D proof, not simulated by changing domain truth.

File-capability unit tests cover valid one-time use, replay rejection, operation mismatch, unknown and expired identifiers, fresh application state, replacement by a newer same-purpose selection, and rejection of existing write destinations. Source-level IPC regression tests also require sensitive commands to accept capability IDs instead of renderer-supplied paths.

Personal Vault mempool-preflight tests require exactly one structurally valid `testmempoolaccept` result with explicit `allowed: true`. Missing, null, malformed, rejected, empty, or ambiguous responses remain non-broadcastable. The Rust broadcast boundary also tests no-preflight, rejected, indeterminate, exact-finalized-transaction identity, and accepted progression states.

Personal Vault broadcast now uses the same privileged native-confirmation capability model as legacy multisig. Rust validates the current finalized transaction and Accepted preflight before displaying the OS dialog, then mints a three-minute opaque authorization bound to the draft, transaction identity, and current preflight version. The broadcast command consumes that authorization before checking current chain/network state or calling `sendrawtransaction`; renderer confirmation state alone is not authority.

Personal Vault passphrase-lifecycle tests mount the real React shell in jsdom and exercise its actual DOM inputs with a mocked typed Tauri client. They prove that create, passphrase-change, and signing secrets are cleared before privileged promises settle and remain empty after success or failure; failed signing remains retryable, and closing the create interaction removes its secrets. Run this focused suite with:

```bash
npx vitest run tests/passphrase-lifecycle.test.tsx
```

Legacy 2-of-3 signer tests use a deterministic loopback JSON-RPC server to cover every signing/relock result pair, unlock failure, retry-lock success and failure, and direct backend attempts to bypass the stop through another signer, finalization, preflight, authorization, or broadcast. A successful `walletlock` JSON-RPC response is the current practical authoritative lock confirmation; the retry action never unlocks or signs again. The relock-required workflow state is currently held only in memory, so restart-time wallet lock reconciliation remains future work.

Legacy transaction-boundary tests prove that finalization calls neither `testmempoolaccept` nor `sendrawtransaction`, preflight uses the exact Rust-held finalized transaction and the shared fail-closed Personal Vault parser, and rejected or indeterminate results cannot reach native confirmation. Native approval is abstracted in tests so approve and cancel paths do not open a blocking OS dialog. The resulting authorization is opaque, draft- and transaction-bound, short-lived, one-time, and consumed before a send attempt. Separate tests cover wrong draft, replaced transaction, expiration, replay, disabled Bitcoin Core networking, exact single-send success, RPC failure recovery, and preservation of the relock hard stop.

Atomic legacy-signer creation tests inspect the real loopback RPC request without printing its test-only secret. They require a non-empty passphrase in the initial `createwallet` request, verify encrypted/locked/private-key-enabled descriptor postconditions, preserve public receive/change identity extraction, reject private material, prove all three signer paths avoid `encryptwallet` and unnecessary unlocks, and preserve truthful partial-setup behavior. The explicit Regtest suite also creates one signer through the production domain function and checks the same state against real Bitcoin Core.

## Isolated Regtest golden tests

The real Bitcoin Core integration test is explicit and is not started by `npm test` or `npm run verify`:

```bash
npm run test:regtest
```

The command discovers `bitcoind` through `PATH`. To use a specific executable, provide an absolute path:

```bash
BITCOIND=/absolute/path/to/bitcoind npm run test:regtest
```

The harness creates a unique `core-vault-regtest-*` directory under the operating system's temporary directory, starts only Regtest on a collision-resistant loopback RPC port, authenticates with that node's cookie, and refuses wallet mutations unless Core reports `chain == "regtest"`. It never accepts an existing datadir. The recovery flow also finalizes the restored wallet's signing proof and requires a typed Accepted preflight from real Bitcoin Core without broadcasting it.

The golden Personal Vault spend test uses production Rust/domain functions to create an encrypted wallet, verify its lock, receive and confirm fixture funds, build and verify a funded PSBT review, reject a wrong passphrase without changing the proposal, sign and re-lock, finalize without broadcast, obtain a strict Accepted preflight, exercise privileged test confirmation, prove a network-disabled attempt consumes its authorization, broadcast with a fresh authorization, observe the txid in the real mempool, mine it, and verify recipient funds, sender activity, fee, change, and post-spend balance. Run only that proof with:

```bash
cargo test --manifest-path src-tauri/Cargo.toml --locked regtest::tests::golden_personal_vault_spend_lifecycle -- --exact --include-ignored --test-threads=1
```

The golden 2-of-3 test uses the same production multisig domain path against actual Bitcoin Core 31.1 Regtest. It creates three independently encrypted and locked signer wallets plus a private-key-disabled coordinator, verifies Core accepted the actual public `wsh(sortedmulti(2,...))` receive/change policy, funds it, and proves the signature progression `0 → insufficient`, `1 → insufficient`, duplicate signer `→ still insufficient`, and two distinct signers `→ threshold reached`. It then finalizes locally, requires strict Accepted preflight and privileged one-time broadcast authorization, exercises the disabled-network guard, observes the exact reviewed transaction in the mempool, mines it, and verifies recipient funds, change ownership, fee, and coordinator balance. Run only that proof with:

```bash
cargo test --manifest-path src-tauri/Cargo.toml --locked regtest::tests::golden_two_of_three_multisig_lifecycle -- --exact --include-ignored --test-threads=1
```

This is a same-machine 2-of-3 domain lifecycle proof: all three signer wallets and the coordinator live in one isolated Bitcoin Core process, while the PSBT remains in privileged Rust memory. It does not prove file/USB/QR PSBT transport, independent offline signer machines, signer backup recovery, or public coordinator reconstruction. The owned process is shut down and only the marked temporary directory is removed after each test.

For a failing local test that needs inspection, temporary state can be retained explicitly:

```bash
CORE_VAULT_KEEP_REGTEST=1 npm run test:regtest
```

Do not use the preservation option in CI. If `bitcoind` is not available, the explicit command fails with an actionable message instead of silently skipping the golden test.

## Desktop smoke test

1. Start Bitcoin Core 31.1 with `-server=1` on Signet, Testnet4, or Regtest.
2. Run `npm run tauri dev`.
3. Confirm the status rail shows the exact chain and Core version.
4. Create a Personal Vault with a test-only passphrase.
5. Create a backup, restore it under a temporary name, and require a matching public fingerprint.
   Confirm cancellation is silent, selecting a second destination invalidates the first pending selection, and an existing destination is rejected instead of overwritten.
6. Generate a fresh receive address and scan its QR code with an independent test-network wallet.
7. Fund the wallet with test coins.
8. Create a send proposal; verify destination, amount, fee, change, RBF, and network.
9. Sign, finalize, confirm mempool acceptance, and separately broadcast.
10. Disable and re-enable P2P networking in the Engine Room; verify the UI never calls this an air gap.
11. Open the preserved 2-of-3 workshop and repeat its Signet flow: collect two signatures, finalize locally, run the transaction check, review Ready to Broadcast, choose Broadcast transaction, and approve or cancel the native OS confirmation. Confirm cancellation leaves the transaction ready and approval leads to only one broadcast attempt.

## Browser-only visual test

Run `npm run dev` and open `http://localhost:1420`. The permanent demonstration ribbon must remain visible. No real RPC or wallet mutation is possible in this mode.

Test at 1024×700 and 1280×800, with keyboard-only navigation, Croatian copy, muted audio, reduced motion, and a screen-reader navigation pass.
