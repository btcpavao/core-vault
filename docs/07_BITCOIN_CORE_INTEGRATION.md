# Core Vault — Bitcoin Core Integration

**Document:** 07 / Bitcoin Integration Specification  
**Status:** Foundational Integration Specification  
**Runtime Baseline:** Bitcoin Core 31.1  
**RPC Reference Baseline:** Bitcoin Core 31.0.0  
**Depends on:**
- `01_VISION_AND_PHILOSOPHY.md`
- `02_DESIGN_PRINCIPLES.md`
- `03_TECHNICAL_ARCHITECTURE.md`
- `04_WORLD_BIBLE.md`
- `05_ROOM_DESIGN.md`
- `06_INTERACTION_DESIGN.md`

**Applies to:** Bitcoin Core RPC transport, authentication, node state, wallets, descriptors, addresses, backup, restore, transaction construction, PSBT, signing, multisig, network control, mempool, blocks, offline operation, error handling, and mapping Bitcoin Core truth into Core Vault domain state.

---

# 1. Purpose of This Document

This document defines the contract between Core Vault and Bitcoin Core.

Core Vault is not a Bitcoin implementation.

Core Vault is not a replacement wallet engine.

Core Vault is not a parallel key-management system.

The foundational integration rule is:

> **Bitcoin Core owns Bitcoin truth. Core Vault orchestrates Bitcoin Core and translates its state into human interaction.**

Whenever Bitcoin Core already provides the required wallet, node, transaction, descriptor, signing, backup, or network functionality, Core Vault should prefer using that functionality rather than reproducing it independently.

---

# 2. Integration North Star

The desired architecture is:

```text
User
  ↓
Core Vault World / UI
  ↓
Application Intent
  ↓
Domain Service
  ↓
Typed Bitcoin Core Adapter
  ↓
JSON-RPC Transport
  ↓
Bitcoin Core
```

And in the opposite direction:

```text
Bitcoin Core Result
  ↓
Typed Bitcoin Core Adapter
  ↓
Domain State
  ↓
Visual State Adapter
  ↓
Core Vault World
```

The experience layer and renderer must never call raw Bitcoin RPC directly.

---

# 3. Supported Bitcoin Core Baseline

Initial implementation targets Bitcoin Core **31.1**.

Bitcoin Core 31.1 is the current release baseline for this specification. The official RPC documentation currently exposes the 31.0.0 RPC reference, which contains the RPC surface used by this document.

Core Vault must still implement **capability detection** rather than relying entirely on a numeric version check.

Do not assume:

> `version >= X → every desired capability behaves exactly as expected`

where runtime detection can verify the capability directly.

---

# 4. Compatibility Philosophy

Core Vault should distinguish:

## Supported

Version/capability combinations covered by automated integration tests.

## Potentially compatible

Core versions that expose required RPCs but have not been fully tested.

## Unsupported

Core versions missing required wallet/RPC behavior.

The application should not silently continue if critical capabilities are missing.

---

# 5. Official Sources Are Authoritative

When Bitcoin Core behavior is unclear, development must consult:

1. official Bitcoin Core RPC documentation
2. Bitcoin Core source repository
3. Bitcoin Core release notes
4. Bitcoin Core documentation under `doc/`
5. Bitcoin Core functional tests where necessary

Do not define wallet semantics from:

- random blog posts
- forum answers
- exchange documentation
- generic crypto tutorials

when official Core sources exist.

---

# 6. Local-First Integration

The MVP assumes Bitcoin Core is running locally on the same computer.

Preferred connection:

```text
Core Vault → localhost Bitcoin Core RPC
```

Remote node support is not part of the initial production scope.

Do not expose Bitcoin Core RPC to external networks merely to make Core Vault work.

---

# 7. RPC Transport

Use direct JSON-RPC communication through the privileged desktop host layer.

Do not invoke `bitcoin-cli` by interpolating shell strings for normal production operations.

Reasons include:

- stronger typing
- controlled authentication
- easier timeout handling
- easier error mapping
- reduced command-injection surface
- easier testing

`bitcoin-cli` may still be useful in development and integration-test tooling.

---

# 8. RPC Authentication

Preferred default authentication for a local Bitcoin Core instance is the session RPC cookie.

Bitcoin Core maintains a `.cookie` authentication file in its data directory when cookie authentication is used.

Core Vault may additionally support explicitly configured RPC credentials where required.

The renderer must never receive the raw cookie contents.

---

# 9. Cookie Lifecycle

Treat the RPC cookie as ephemeral authentication state.

Core Vault must expect it to change when Bitcoin Core restarts.

Therefore:

- do not persist cookie contents
- re-read when reconnecting
- handle authentication failure by retrying discovery
- never log the cookie
- never expose it in debug UI

---

# 10. Bitcoin Core Data Directory Discovery

Core Vault may attempt safe discovery of standard Bitcoin Core data directories.

Current standard locations documented by Bitcoin Core include:

```text
Linux:
$HOME/.bitcoin/

macOS:
$HOME/Library/Application Support/Bitcoin/

Windows:
%LOCALAPPDATA%\Bitcoin\
```

Bitcoin Core also supports custom `-datadir` locations and chain-specific subdirectories.

Discovery must therefore always permit manual override.

---

# 11. Supported Chains

Core Vault should recognize:

```text
main
test
testnet4
signet
regtest
```

The chain must come from Bitcoin Core state, not from UI assumptions.

`getblockchaininfo` reports the active chain along with block/header and synchronization state.

---

# 12. Chain Identity Is Security-Critical

Core Vault must persistently distinguish:

- MAINNET
- TESTNET
- TESTNET4
- SIGNET
- REGTEST

During any:

- receive
- send
- signing
- restore
- wallet creation

chain identity must remain available.

Do not rely on color alone.

---

# 13. Core Connection State

Core Vault should normalize connection into:

```text
UNKNOWN
CONNECTING
CONNECTED
UNAVAILABLE
AUTHENTICATION_FAILED
INCOMPATIBLE
ERROR
```

These states are application states.

They are not raw RPC errors.

---

# 14. Capability Probe

After connection, perform a controlled capability probe.

At minimum determine:

- Core version
- active chain
- blockchain state
- P2P network-active state
- wallet RPC availability
- loaded wallets
- required PSBT RPC availability

Do not run destructive commands during capability detection.

---

# 15. Core Version

Use `getnetworkinfo` to obtain Core version and networking state.

The RPC exposes server version, connection counts, and `networkactive`.

Store version as domain metadata.

Do not base world state solely on the human-readable `subversion` string.

---

# 16. Blockchain State

Use `getblockchaininfo` for broad chain state.

Map relevant fields into a typed domain model including:

```text
chain
blocks
headers
bestBlockHash
verificationProgress
initialBlockDownload
sizeOnDisk
pruned
warnings
```

These fields are provided by the current Core RPC.

---

# 17. Synchronization State

Do not determine synchronization only from:

```text
blocks == headers
```

Use Core's own reported:

- `verificationprogress`
- `initialblockdownload`
- blocks
- headers

to create a domain-level synchronization state.

Example:

```text
UNKNOWN
INITIAL_BLOCK_DOWNLOAD
SYNCING
SYNCED
```

---

# 18. Visual Sync Does Not Change Core Truth

The Engine Room synchronization ring is a visualization.

Its source of truth is the node domain model.

The scene must not maintain an independent fake sync percentage.

---

# 19. P2P Network State

Use `getnetworkinfo.networkactive` as the primary read-side state.

Use `setnetworkactive` when the user explicitly enables or disables Bitcoin Core P2P network activity.

`setnetworkactive false` disables P2P network activity; it does not prove that the computer itself is physically disconnected from all networking.

---

# 20. Air-Gap Terminology

Never translate:

```text
networkactive = false
```

into:

```text
Air-gapped
```

unless the user independently knows the machine is physically isolated.

Correct UI:

> Bitcoin Core network activity is disabled.

Optional explanation:

> Core Vault cannot verify whether the computer itself is physically disconnected from other networks.

---

# 21. Network Toggle

Changing Core P2P networking is meaningful enough to require intentional interaction.

Flow:

1. user inspects network subsystem
2. selects Enable or Disable
3. Core Vault explains consequence
4. user confirms
5. call `setnetworkactive`
6. re-query state
7. update world from confirmed result

Do not visually disable network before confirmed Core response.

---

# 22. Peer State

Broad peer status may come from:

- `getnetworkinfo`
- `getpeerinfo`

Use `getnetworkinfo` for lightweight summary.

Use `getpeerinfo` only when detailed peer inspection is requested or periodically at a reasonable frequency.

Do not poll a full detailed peer list every render frame.

---

# 23. New Block Detection

Prefer a dedicated application mechanism for detecting new blocks.

Possible baseline strategies:

- `waitfornewblock`
- controlled polling of best block state

`waitfornewblock` exists specifically to wait until a new block is received or a timeout occurs.

A future ZMQ integration may be considered, but it must not be required for basic Core Vault operation.

---

# 24. Block Event

When a new best block is detected, emit:

```text
NEW_BLOCK {
  hash
  height
  time
}
```

The scene system may respond.

Do not send raw RPC response objects into the renderer.

---

# 25. Mempool Summary

Use `getmempoolinfo` for Observatory and Engine Room summary state.

The domain model should expose only what the scene needs.

Example:

```text
MempoolSummary {
  txCount
  memoryUsage
  totalFee
  mempoolMinFee
  minRelayFee
}
```

Do not initially fetch the entire raw mempool merely to create ambient visual motion.

---

# 26. Mempool Visualization

The Observatory must visualize aggregate state.

Do not instantiate one graphical object per mempool transaction.

Detailed raw mempool analysis, if ever added, is a separate feature.

---

# 27. Wallet Architecture

New Core Vault wallets must use Bitcoin Core descriptor-wallet architecture.

Current `createwallet` requires descriptor wallets and supports encrypted wallet creation through its passphrase argument.

Core Vault must not create its own parallel wallet-key database.

---

# 28. One Logical Vault

The user interacts with a:

```text
Vault
```

The domain layer maps that Vault to the required Bitcoin Core wallet representation.

For simple single-signature operation:

```text
1 Core Vault Vault
↔
1 Bitcoin Core wallet
```

This should remain the default conceptual mapping.

---

# 29. Display Name Versus Core Wallet Name

Do not pass arbitrary user-facing Vault names directly as filesystem-sensitive Bitcoin Core wallet identifiers.

Bitcoin Core `createwallet` can accept a wallet name/path, so user input must not become an unchecked path.

Use separate concepts:

```text
vaultId
displayName
coreWalletName
```

Example:

```text
displayName:
Family Savings

coreWalletName:
cv_a16f1c3e
```

---

# 30. Core Wallet Name Generation

Internal Core wallet names should be:

- deterministic enough for application recovery or properly persisted
- filesystem-safe
- free of path separators
- free of control characters
- collision-resistant
- independent of display name

Never derive wallet paths from raw display-name input.

---

# 31. Wallet Discovery

Use:

- `listwallets`
- `listwalletdir`

to distinguish:

- loaded wallets
- available wallet directories

Core Vault should be able to reconnect to previously created Vaults after application restart.

---

# 32. Wallet Loading

Use `loadwallet` when a known Core wallet exists but is not currently loaded.

Bitcoin Core supports loading wallet directories and can optionally persist load-on-startup state.

Core Vault should not silently load every wallet in the user's Core installation unless necessary.

---

# 33. Non-Core-Vault Wallets

A Bitcoin Core instance may contain wallets not created by Core Vault.

Do not automatically:

- rename them
- modify them
- import them
- attach metadata
- show them as Core Vault Vaults

A future explicit import/adoption flow may support them.

---

# 34. Personal Vault Creation

Preferred initial personal Vault operation:

```text
createwallet(
  wallet_name = generatedInternalName,
  disable_private_keys = false,
  blank = false,
  passphrase = userPassphrase,
  descriptors = true
)
```

Exact argument encoding must follow the runtime Core RPC signature.

Creating the wallet encrypted from creation avoids intentionally creating the new private-key wallet in an unencrypted intermediate state. Bitcoin Core's current `createwallet` supports a passphrase argument.

---

# 35. Wallet Encryption

Preferred architecture:

> Encrypt during `createwallet`.

Do not create a new production Personal Vault unencrypted and only later encrypt it unless compatibility constraints require that path.

If `encryptwallet` must ever be used separately, the resulting behavior must be handled according to the current Core documentation and separately tested.

---

# 36. Passphrase Boundary

Passphrase enters the Core Vault UI only for the specific operation requiring it.

Flow:

```text
Secure UI field
→ privileged domain command
→ Core RPC
→ memory cleared
```

Passphrase must not enter:

- renderer persistence
- metadata store
- logs
- analytics
- filenames

---

# 37. Wallet Unlock

When signing requires an encrypted wallet to be unlocked:

1. request passphrase
2. call `walletpassphrase` with the shortest practical timeout
3. perform the required signing operation
4. call `walletlock`
5. clear passphrase state

If signing fails, Core Vault should still attempt `walletlock`.

---

# 38. Wallet Lock Is Cleanup, Not Security Theater

The world may visually return the Vault to its normal locked state only after application cleanup has been attempted.

A short wallet-unlock operation is an implementation state.

Do not imply that the machine is safe from malware simply because the wallet has been re-locked.

---

# 39. Change Passphrase

Use `walletpassphrasechange`.

The user must provide:

- current passphrase
- new passphrase
- new passphrase confirmation

Do not implement password-reset semantics.

There is no Core Vault recovery master password.

---

# 40. Backup Authority

Wallet backups must be created through Bitcoin Core's `backupwallet`.

Bitcoin Core documents `backupwallet` as safely copying the wallet to a destination, and its filesystem documentation explicitly recommends using `backupwallet` for wallet copies rather than copying an active wallet database directly.

Core Vault must not implement backup by naïvely copying `wallet.dat`.

---

# 41. Backup Destination

The user chooses destination using the operating system save interface.

Core Vault then passes the resulting path into the privileged Backup Service.

Renderer code must not perform arbitrary filesystem copying.

---

# 42. Backup Result

`backupwallet` returns success or RPC failure.

After success, Core Vault should additionally verify locally that the expected destination exists and is non-empty where practical.

This verification does not replace Core's operation.

It provides an additional application-level sanity check.

---

# 43. Backup Metadata

Core Vault may store non-sensitive metadata such as:

```text
vaultId
backupCreatedAt
backupDestinationDisplay
backupVerificationState
backupChecksum
```

Be cautious with persisting full filesystem paths if privacy concerns make them unnecessary.

---

# 44. Backup Checksum

Core Vault may calculate a local SHA-256 checksum of the backup file after successful creation.

The checksum is useful for integrity comparison.

It does not prove:

- recoverability
- redundancy
- correct passphrase
- availability of the physical medium

Do not present checksum as equivalent to restore testing.

---

# 45. Backup Success Language

Correct:

> Bitcoin Core successfully created a wallet backup.

Incorrect:

> Your bitcoin is safe.

The second statement claims more than the software can know.

---

# 46. Restore Authority

Use Bitcoin Core `restorewallet`.

Current Core restores and loads a wallet from a supplied backup file under a specified wallet name.

Core Vault should not reconstruct Core wallet databases manually.

---

# 47. Restore Wallet Name

A restored wallet receives a new safe internal Core wallet name.

Do not overwrite an existing Core wallet silently.

If the desired internal name already exists:

- generate another safe name
- explain the conflict where relevant

---

# 48. Restore Rescan

A restore may require blockchain rescan work.

Core Vault must surface:

- restore in progress
- rescan/synchronization implications where known
- warnings returned by Core

Do not show a fully recovered Vault before Core has completed the required operation sufficiently for its state to be trusted.

---

# 49. Test Restore

Backup verification should use a real Core restore process rather than merely checking that the file exists.

Preferred concept:

1. create temporary safe wallet name
2. `restorewallet`
3. obtain public wallet identity information
4. compare with expected original public identity
5. report result
6. unload test wallet
7. do not silently delete Core files unless a separately reviewed safe mechanism exists

---

# 50. Public Wallet Fingerprint

Core Vault should define a deterministic **public Vault fingerprint** that contains no private material.

Possible input:

- normalized public descriptors
- chain
- policy

The exact fingerprint format must be documented and tested.

Never hash private descriptors into logs merely because the output is a hash.

Use public-only material.

---

# 51. Wallet Files Are Bitcoin Core Territory

Bitcoin Core currently stores descriptor wallets as SQLite wallet databases and documents the wallet directory layout.

Core Vault must treat these as Core-owned state.

Do not modify SQLite wallet databases directly.

---

# 52. Receive Address

Use `getnewaddress`.

Current Core supports address types including:

- legacy
- p2sh-segwit
- bech32
- bech32m

For new Personal Vaults, Core Vault's initial product default should be:

```text
bech32m / P2TR
```

where the capability is supported and integration-tested.

---

# 53. Address-Type Choice Is Hidden by Default

Ordinary users should not be asked:

> Legacy, P2SH-SegWit, Bech32, or Bech32m?

Core Vault chooses its supported default.

Advanced information may reveal the resulting address type.

---

# 54. Receive Address Verification

After address generation, call `getaddressinfo` where useful to verify:

- wallet relationship
- script/address properties

The displayed address must come from Core.

QR generation occurs locally from the exact returned address string.

---

# 55. QR Codes

Generate QR codes locally.

Do not send Bitcoin addresses to external QR services.

---

# 56. Address Labels

Use Core address labeling when appropriate.

Labels should remain optional.

Do not create elaborate address-book functionality in the MVP unless required.

---

# 57. Wallet Balance

Use wallet-scoped Core RPC state.

Primary baseline:

- `getbalances`

Supplement where needed with:

- `listunspent`
- transaction history RPCs

The experience layer receives normalized balance data.

---

# 58. Balance Model

Do not collapse all Core states into one number.

Domain balance may distinguish:

```text
trusted
untrustedPending
immature
```

depending on the wallet and use case.

The default UI may present a simpler summary.

Technical detail remains available.

---

# 59. Unsynchronized Node Warning

If the node is not sufficiently synchronized:

balance and transaction history may be incomplete.

Core Vault must surface this fact.

Never present stale/incomplete balance as unquestionably current.

---

# 60. Transaction History

Use Core wallet transaction RPCs such as:

- `listtransactions`
- `listsinceblock`
- `gettransaction`

depending on the required view.

Do not build transaction history from a remote explorer.

---

# 61. No External Blockchain Explorer Dependency

Core Vault's primary functionality must not require:

- mempool.space
- Blockstream APIs
- commercial blockchain APIs
- exchange APIs

The user's Bitcoin Core is the primary data source.

---

# 62. Fee Estimation

Use Core's fee estimation through `estimatesmartfee`.

If Core cannot produce a usable estimate:

- report that clearly
- allow a carefully designed manual fee-rate path
- do not fabricate a recommendation

---

# 63. Fee Units

Internally normalize fee rate carefully.

Bitcoin Core RPCs may expose fee-rate units different from the UI's desired:

```text
sat/vB
```

Create one centralized conversion utility.

Never duplicate fee-unit conversion logic across screens.

---

# 64. PSBT-First Spending Architecture

Core Vault should use a PSBT-first transaction workflow.

This provides one consistent architecture for:

- Personal Vaults
- multisig
- offline signers
- future hardware/external signers

The user does not need to see the term PSBT in basic mode.

---

# 65. Spend Proposal

The domain concept should be:

```text
SpendProposal
```

It maps internally to a PSBT.

The user thinks:

> transaction proposal

Technical mode reveals:

> Partially Signed Bitcoin Transaction.

---

# 66. Create Spend Proposal

Use `walletcreatefundedpsbt`.

The RPC creates and funds a transaction in PSBT format and can automatically select wallet inputs.

Core Vault must explicitly control important options such as:

- RBF policy
- fee policy
- inputs where advanced coin control applies
- change behavior where needed

Do not rely blindly on defaults without tests.

---

# 67. Returned Funding Data

Capture relevant RPC result including:

- PSBT
- fee
- change position

The exact current response must be represented in a typed adapter.

Do not infer change solely by looking for an address that “looks like ours.”

---

# 68. Address Validation Before Funding

Validate destination using `validateaddress`.

Also enforce:

- active chain
- application-level syntax handling
- clear network mismatch errors

Do this before asking Core to create the funded proposal where practical.

---

# 69. Decode Before Review

Use `decodepsbt` and/or appropriate PSBT inspection RPCs to construct the review model.

The user-facing transaction review must be derived from the actual PSBT that will be signed.

Do not review one object and sign another separately generated transaction.

---

# 70. Analyze PSBT

Use `analyzepsbt` to help understand PSBT completeness and next role where useful.

Do not let scene code independently guess whether a PSBT is ready.

---

# 71. Transaction Review Model

Normalize the actual proposal into:

```text
TransactionReview {
  chain
  inputs
  recipients
  outputs
  change
  amountToRecipients
  fee
  feeRate
  rbf
  signaturesRequired
  signaturesCollected
  warnings
}
```

This is the authoritative object shown to the user before signing.

---

# 72. Review Immutability

Once the user approves a review for signing:

the exact PSBT identity should remain tied to that review.

If the PSBT changes:

- invalidate the prior review
- present the changed proposal again

Never silently sign a modified proposal based on an earlier approval.

---

# 73. PSBT Identity

Define a stable local proposal identifier derived from non-secret transaction/proposal content.

This allows Core Vault to detect unexpected mutation between stages.

Exact algorithm should be documented in implementation.

---

# 74. Wallet Signing

Use wallet-scoped `walletprocesspsbt`.

Current Core can update and sign a PSBT with wallet information; encrypted wallets require prior unlock, and the RPC can optionally finalize when possible.

Core Vault should normally request:

```text
finalize = false
```

during signing.

This keeps:

- signing
- threshold completion
- finalization
- broadcast

as explicit separate domain states.

---

# 75. Why Explicit Non-Finalizing Signing

Allowing signers to automatically finalize creates ambiguity in the application state model.

Core Vault should preferably keep signing as:

```text
unsigned
→ partially signed
→ threshold reached
```

Then perform finalization as its own controlled operation.

This improves:

- review
- auditability
- multisig coordination
- visual semantics

---

# 76. Wallet Re-Lock

After `walletprocesspsbt` completes or fails:

attempt `walletlock`.

Passphrase state is then cleared.

The world receives only:

```text
SIGNATURE_ACCEPTED
```

or:

```text
SIGNATURE_FAILED
```

not passphrase data.

---

# 77. Combine Signatures

For independently signed PSBT copies, use `combinepsbt` where appropriate.

Core Vault should verify that PSBTs being combined refer to the expected proposal.

Do not combine arbitrary user-selected PSBTs without compatibility validation.

---

# 78. PSBT Import

When importing a PSBT:

1. parse using Core
2. analyze
3. build review model
4. identify relevant Vault if possible
5. display full transaction review
6. permit signing only after user approval

Never auto-sign immediately upon file import.

---

# 79. PSBT Export

Use an explicit file export operation.

Suggested extension/format conventions should follow the PSBT ecosystem.

Core Vault must never require clipboard transport for production multisig.

Clipboard may exist as an advanced option.

---

# 80. Raw PSBT Display

Raw base64 PSBT is technical data.

Hide it from ordinary mode.

Advanced mode may expose:

- View
- Copy

with appropriate warning about sharing proposal metadata.

---

# 81. Finalization

Once enough valid signatures exist, use `finalizepsbt`.

Core's `finalizepsbt` returns whether the PSBT is complete and, when complete and extraction is enabled, can return the serialized transaction suitable for broadcast.

Finalization does not imply broadcast.

---

# 82. Ready-to-Broadcast State

Only after successful finalization should the domain enter:

```text
READY_TO_BROADCAST
```

The Communications scene may visually indicate readiness.

Nothing should leave the machine yet.

---

# 83. Mempool Preflight

Before broadcast, call `testmempoolaccept` on the finalized raw transaction where appropriate.

The RPC tests whether the transaction would satisfy current node consensus/policy acceptance conditions.

Treat this as preflight validation.

It is not equivalent to successful network broadcast.

---

# 84. Preflight Failure

If `testmempoolaccept` indicates rejection:

- do not broadcast automatically
- display normalized reason
- preserve signed transaction
- allow technical inspection

The scene must not show outward transmission.

---

# 85. Broadcast

Broadcast is an explicit user command.

Use `sendrawtransaction` for the finalized raw transaction.

Current Core documents this RPC as submitting a raw transaction to the network; relay behavior depends on node configuration.

Do not call it automatically merely because signatures are complete.

---

# 86. Broadcast Confirmation

Immediately before `sendrawtransaction`, require final explicit approval.

The confirmation must show:

- destination
- amount
- fee
- network

at minimum.

This is not a theatrical step.

It is a security boundary.

---

# 87. Broadcast Success

Only after `sendrawtransaction` returns success:

emit:

```text
TRANSACTION_BROADCAST {
  txid
}
```

Then the Communications environment may display outward transmission.

---

# 88. Broadcast Failure

If the RPC fails:

- do not animate successful transmission
- preserve transaction state
- map error
- allow retry when appropriate

Beware of ambiguous network cases.

A local RPC error does not always mean every peer in existence has never seen the transaction.

Copy should avoid claims beyond what Core Vault can establish.

---

# 89. Network Disabled and Broadcast

When:

```text
networkactive = false
```

Core Vault should treat ordinary broadcast as unavailable.

Keep:

- PSBT creation where technically valid
- PSBT import
- review
- signing
- finalization
- export

available where possible.

This is central to offline workflows.

---

# 90. Single-Sig Flow

Recommended Personal Vault spend sequence:

```text
Validate address
↓
Estimate fee
↓
walletcreatefundedpsbt
↓
decode/analyze
↓
User review
↓
walletpassphrase
↓
walletprocesspsbt(finalize=false)
↓
walletlock
↓
finalizepsbt
↓
testmempoolaccept
↓
User broadcast confirmation
↓
sendrawtransaction
```

No stage may be silently collapsed if doing so removes a security boundary.

---

# 91. Baseline Multisig Policy

The first supported multisig policy should remain:

```text
2-of-3
```

until more general policies are separately specified and tested.

Do not expose arbitrary M-of-N merely because a UI can draw more Keys.

---

# 92. Existing 2-of-3 Implementation

Before replacing the current multisig backend:

- inspect it
- write/confirm integration tests
- document current descriptor
- confirm address derivation
- confirm signing flow
- confirm restore/reconstruction properties

If it is correct, preserve it while replacing only the experience layer.

---

# 93. Official Core Multisig Model

Bitcoin Core's own multisig tutorial demonstrates a descriptor-based model using independent signer wallets and a watch-only multisig wallet, with a `wsh(sortedmulti(...))` descriptor imported into the multisig wallet.

This is the initial reference model for Core Vault's existing 2-of-3 behavior unless the repository already implements another thoroughly tested Core-native model.

---

# 94. Coordinator Wallet

A baseline 2-of-3 coordinator should contain:

- spending descriptor
- public derivation information
- no required private signer material

The coordinator should be capable of:

- deriving addresses
- detecting funds
- constructing PSBTs
- coordinating signatures

---

# 95. Signer Wallets

Signer wallets contain the private signing authority for their corresponding Key.

In a real distributed setup:

- signers should be independent
- not all live on the same online machine

Core Vault must not present three locally generated keys on one computer as equivalent to geographically/device-separated multisig security.

---

# 96. Multisig Descriptor

Baseline example:

```text
wsh(sortedmulti(2,keyA,keyB,keyC))
```

The exact descriptor must include proper:

- origin information
- derivation
- checksum
- receive/change handling

Bitcoin Core's descriptor documentation supports multisig and Taproot descriptor constructs, while the official multisig tutorial documents the current `wsh(sortedmulti(...))` workflow.

---

# 97. Descriptor Checksum

Run descriptors through `getdescriptorinfo`.

Use the returned normalized/checksum form as appropriate.

Do not manually invent descriptor checksums.

---

# 98. Import Descriptor

Create coordinator wallet with private keys disabled and blank state where required.

Then use `importdescriptors`.

Validate every result item.

Do not treat RPC transport success as proof that every descriptor entry imported successfully.

---

# 99. Multisig Address Verification

After setup:

- derive/generate receiving address through coordinator
- independently derive/verify using participant public policy where supported
- compare

The workflow should encourage participants to verify at least the first address out-of-band in serious setups.

---

# 100. Multisig Backup Model

Multisig recovery requires more than simply backing up one coordinator file.

Core Vault must distinguish:

- coordinator wallet backup
- signer wallet backups
- spending-policy/descriptors
- key identity information

Do not label one coordinator backup:

> Complete multisig recovery

unless recovery requirements have actually been satisfied.

---

# 101. Multisig Signing

Coordinator:

```text
Create proposal
→ review
→ export PSBT
```

Signer 1:

```text
Import
→ review
→ unlock if needed
→ walletprocesspsbt(finalize=false)
→ export
```

Signer 2:

```text
Import
→ review
→ sign
→ export
```

Coordinator:

```text
combinepsbt
→ verify threshold
→ finalizepsbt
→ preflight
→ explicit broadcast
```

---

# 102. Signature Attribution

The domain layer should identify which known Key contributed a signature where deterministically possible.

The experience then activates the corresponding Key artefact.

Never activate a specific Key merely because the total signature count increased if attribution is unknown.

Use generic threshold progress if exact signer identity cannot be proven.

---

# 103. Threshold State

Distinguish:

```text
0/2 signatures
1/2 signatures
2/2 signatures
finalized
broadcast
```

These are different states.

The scene must not merge them.

---

# 104. Local Demonstration Multisig

Development may offer:

```text
LOCAL DEMONSTRATION MODE
```

with multiple wallets on one machine.

This is useful for:

- Regtest
- UI testing
- demonstrations

It must clearly state that this does not provide the security assumptions of independent signing devices.

---

# 105. Taproot Direction

Bitcoin Core descriptors support P2TR via `tr`, Taproot multisig script constructs such as `multi_a`, and Miniscript expressions inside `tr`.

This provides a future technical foundation.

It does **not** mean Core Vault should immediately convert all multisig policies to Taproot.

---

# 106. Taproot Safety Rule

Do not ship a new Taproot vault policy until:

- every spend path is documented
- every spend path has Regtest tests
- unintended spend paths have negative tests
- internal-key behavior is intentionally defined
- recovery semantics are documented
- security review has occurred

A beautiful Taproot tree visualizer is not a security specification.

---

# 107. Key-Path Bypass

When implementing future Taproot script-path policy:

never accidentally introduce a key-path spend that bypasses the threshold the UI claims is required.

If the interface says:

> Two of three keys are required.

there must not secretly exist:

> one internal key can spend everything.

unless explicitly part of the documented policy and clearly communicated.

---

# 108. Timelocks

Future timelock support must be compiled into actual Bitcoin spending conditions.

No time mechanism becomes functional in Workshop until:

- exact semantics are specified
- descriptor/Miniscript representation is defined
- Core support is verified
- spend and recovery tests exist

---

# 109. External Signers

Bitcoin Core includes external-signer architecture.

Core Vault may support external or hardware signers in a future phase.

This is not required for the initial integration unless already implemented.

Do not design the current MVP around untested hardware assumptions.

---

# 110. Offline Signer Mode

An offline signer may operate with:

- local Core instance
- required signer wallet
- imported PSBT file
- Core P2P networking disabled

Core Vault must allow:

- PSBT import
- decode/review
- wallet signing
- export

without requiring chain synchronization at that moment when the PSBT contains everything Core needs to sign.

---

# 111. Offline Does Not Mean Unverified

Even offline:

the signer must review:

- destination
- amount
- fee where derivable
- outputs
- network
- policy

Never reduce review quality merely because the machine is offline.

---

# 112. PSBT Safety Boundary

Treat imported PSBT as untrusted external input.

Before signing:

- decode with Core
- analyze
- verify active network context
- determine relevant wallet
- render all outputs
- show unexpected properties

Never sign opaque base64.

---

# 113. Unknown PSBT

If Core Vault cannot confidently associate the PSBT with a known Vault:

show:

```text
Unknown transaction proposal
```

and require stronger user scrutiny.

Do not invent a Vault association.

---

# 114. Wallet-Specific RPC Endpoint

Wallet operations must target the correct wallet RPC context.

The adapter should manage wallet-specific endpoints internally.

Scene/UI code must not build wallet URL paths.

---

# 115. Wallet Name Encoding

Wallet endpoint paths must be correctly URL-encoded.

Never concatenate raw display names into RPC URLs.

---

# 116. Typed RPC Adapter

The application must expose methods such as:

```text
connectCore()
getCoreStatus()
getNodeStatus()
setNetworkActive()

listVaultWallets()
loadWallet()
unloadWallet()
createPersonalWallet()

getWalletInfo()
getBalances()
getActivity()

createReceiveAddress()

backupWallet()
restoreWallet()

createSpendProposal()
inspectPsbt()
signPsbt()
combinePsbts()
finalizePsbt()
testTransaction()
broadcastTransaction()
```

These are application-facing methods.

Not raw Core RPC names exposed to UI.

---

# 117. Raw RPC Is Internal

The raw adapter may internally expose:

```text
callRpc<T>(method, params)
```

but this must remain below the domain boundary.

Never expose arbitrary RPC execution to the experience renderer.

---

# 118. RPC Timeouts

All RPC calls require explicit timeout strategy.

Different classes need different timeout expectations.

Example:

Short:
- `getnetworkinfo`
- `getwalletinfo`

Medium:
- transaction construction

Long:
- restore
- rescan-related operations

Do not use one tiny global timeout for every Core operation.

---

# 119. Cancellation

Cancellation only means:

> stop waiting / abort where the underlying operation supports it.

Do not tell users an operation was cancelled if Core may still be running it.

Domain services must understand operation semantics.

---

# 120. Retry

Automatic retry is acceptable for safe idempotent read operations.

Be conservative with automatic retry of:

- wallet creation
- backup
- restore
- signing
- broadcast

The adapter must know whether retry could duplicate or complicate an operation.

---

# 121. Idempotency Awareness

Every domain command should document:

```text
Safe to retry?
Potential side effects?
How to detect prior success?
```

This is especially important across connection loss.

---

# 122. Core Warnings

Warnings returned by Core should not be discarded.

Normalize them into application warnings.

Show important ones contextually.

Technical details may expose exact sanitized text.

---

# 123. Error Mapping

Raw Core errors map into domain errors.

Examples:

```text
CoreUnavailable
AuthenticationFailed
UnsupportedCoreVersion
WalletNotFound
WalletAlreadyExists
WalletLocked
IncorrectPassphrase
InvalidAddress
WrongNetwork
InsufficientFunds
FeeEstimateUnavailable
PsbtInvalid
PsbtIncomplete
SignatureFailed
BackupFailed
RestoreFailed
NetworkInactive
MempoolRejected
BroadcastFailed
```

---

# 124. Never Parse Error Strings as Primary Logic

Prefer:

- RPC error codes
- structured result fields
- explicit capability checks

over brittle substring matching.

String parsing may be last-resort compatibility handling only.

---

# 125. Raw Error Visibility

Technical Details may expose a sanitized Core error.

Never expose:

- cookie
- passphrase
- private descriptor
- xprv
- sensitive command payload

---

# 126. Logging

Core RPC logging should record:

- operation name
- duration
- outcome
- normalized error

It should not record sensitive RPC parameters indiscriminately.

---

# 127. Sensitive RPC Redaction

At minimum redact:

- passphrase arguments
- private descriptor content
- PSBT content where not necessary
- wallet backup file contents
- cookie credentials
- private keys

Prefer an allow-list logging model rather than a growing blacklist.

---

# 128. No Telemetry

Do not send Core interaction data to external telemetry.

This includes:

- wallet names
- balances
- addresses
- txids
- node state
- peer details
- Vault configuration

Core Vault is local-first.

---

# 129. Polling Model

Recommended baseline:

Core connection:
- approximately every few seconds while disconnected

Blockchain/sync:
- several seconds during sync
- slower when stable

Network summary:
- several seconds

Mempool summary:
- approximately 5–10 seconds

Peer detail:
- on demand or slower polling

Wallet balance:
- on meaningful events plus controlled refresh

---

# 130. Do Not Poll Every Scene Separately

There must be one shared Core state service.

Incorrect:

```text
MainHall polls getblockchaininfo
EngineRoom polls getblockchaininfo
Observatory polls getblockchaininfo
```

Correct:

```text
NodeService polls once
→ application state
→ multiple scenes observe normalized state
```

---

# 131. Background Mode

When Core Vault window is minimized or inactive:

reduce nonessential polling.

Maintain only what is necessary for:

- active domain operation
- reliable reconnection
- important state continuity

The renderer and RPC layer should not waste resources together.

---

# 132. Block Event Refresh

A new block may trigger targeted refreshes:

- balances
- transaction confirmations
- recent blocks
- mempool summary

Avoid refreshing every RPC indiscriminately.

---

# 133. Wallet Activity Refresh

After:

- receive detected
- send broadcast
- new block
- wallet load

refresh relevant wallet state.

Do not rely only on fixed-interval polling.

---

# 134. Node Without Wallet

Core Vault should be able to connect to Bitcoin Core even if no wallet is loaded.

The Engine Room and Observatory should still function.

The Main Hall may show no Vaults.

Wallet functionality becomes available separately.

---

# 135. Pruned Nodes

Pruned mode is supported for ordinary Core Vault operation where the required RPC/workflow remains valid.

Read `pruned` from blockchain state.

Do not treat pruning as a node failure.

Some historical operations or rescans may have constraints.

Surface these honestly when encountered.

---

# 136. Initial Block Download

Core Vault must remain usable for:

- Engine Room observation
- setup
- appropriate local tasks

during IBD.

But warn that:

- wallet history
- balance
- confirmations

may not yet be complete.

---

# 137. Receive During IBD

Address generation is a local wallet operation.

Core Vault may allow it.

The UI should still clearly communicate that node synchronization is incomplete.

---

# 138. Spending During Incomplete Sync

Treat spending from an incompletely synchronized wallet cautiously.

Do not imply current balance/UTXO knowledge is fully authoritative if Core has not caught up.

The application may block or strongly warn depending on the exact state and tested Core behavior.

---

# 139. Offline Signing During Incomplete Sync

Offline signing is different from online wallet balance determination.

If a signer has a valid PSBT containing required information and the signer wallet can process it:

allow review/signing without pretending the local chain view is current.

---

# 140. Core Vault Should Not Modify `bitcoin.conf` Automatically

Do not silently:

- enable RPC
- alter networking
- change pruning
- expose ports
- change proxy
- enable indexes

If configuration change is required:

explain it and let the user perform or explicitly approve the change through a separately reviewed mechanism.

---

# 141. Core Vault Should Not Download Bitcoin Core Automatically in MVP

If Core is not installed:

Core Vault may explain the requirement.

Do not silently fetch and execute binaries.

A future guided installation system requires its own security design.

---

# 142. Core Vault Should Not Start Unknown Binaries

If future versions offer Start Bitcoin Core:

only use explicitly discovered/configured trusted application paths.

Do not search arbitrary files and execute likely-looking binaries.

---

# 143. Core Process Ownership

Core Vault does not assume it owns the Bitcoin Core process.

The user may:

- run `bitcoind`
- run Bitcoin-Qt
- start Core separately
- restart Core

Core Vault must reconnect gracefully.

---

# 144. Shutdown

Closing Core Vault should not automatically stop Bitcoin Core by default.

They are separate applications.

A future optional behavior may be considered.

---

# 145. Core Restart

When Bitcoin Core restarts:

- Core Vault detects loss
- enters reconnecting state
- re-authenticates using fresh cookie
- rebuilds node state
- verifies loaded wallets
- restores visual truth

No application restart should be required.

---

# 146. Core Upgrade

After detecting a changed Core version:

rerun capability detection.

Do not assume cached capability state remains valid across upgrades.

---

# 147. Database Access Is Forbidden

Core Vault must not open:

- chainstate LevelDB
- wallet SQLite database
- peers.dat
- mempool.dat

to derive normal product state.

Use supported Core interfaces.

Direct database parsing creates compatibility and corruption risk.

---

# 148. Backup Is the Exception Only Through Core

Even backup must not use direct wallet-database copying.

Use `backupwallet`.

This preserves Bitcoin Core as the owner of safe wallet-file handling.

---

# 149. Descriptor Privacy

Descriptors may contain:

- public keys
- origin information
- or private key material depending on the descriptor

Treat descriptors as potentially sensitive by default.

Never assume:

> descriptor = safe public metadata.

Explicitly request/use public descriptor forms for UI or fingerprints.

---

# 150. Advanced Descriptor Display

Before displaying a descriptor in Technical Details:

verify it does not contain private material.

Create a dedicated sanitizer/public-descriptor function.

Never use visual truncation as a security boundary.

---

# 151. Key Material

Core Vault should never request raw private keys for its normal design.

Do not build flows around:

- `dumpprivkey`
- raw WIF export
- xprv display

unless a future explicitly reviewed expert feature requires it.

Core Vault's goal is coordination through Core, not extraction of secrets from Core.

---

# 152. Seed Phrases

Do not introduce BIP39 seed phrases as a substitute for Bitcoin Core's native wallet backup model.

If a future signer integration uses seed phrases externally, that is a different product surface.

The baseline Personal Vault remains:

```text
Bitcoin Core wallet
+ passphrase
+ Bitcoin Core wallet backup
```

---

# 153. Core Vault Backup Education

The user should learn that the Backup Capsule corresponds to a real Core wallet backup.

Do not imply the Capsule is a proprietary recovery format.

The application metaphor must map back to Core truth.

---

# 154. RPC Mapping — Engine Room

Primary operations:

```text
Core availability
→ transport probe

Core version / network activity
→ getnetworkinfo

Chain / sync
→ getblockchaininfo

Peers
→ getpeerinfo

Mempool summary
→ getmempoolinfo

Enable/disable P2P
→ setnetworkactive

New block
→ waitfornewblock / controlled block monitoring
```

---

# 155. RPC Mapping — Main Hall

Primary operations:

```text
Core broad status
→ normalized NodeStatus

Loaded wallets
→ listwallets

Available wallets
→ listwalletdir

Vault summary
→ wallet-specific normalized state
```

Main Hall should consume domain models rather than raw RPC results.

---

# 156. RPC Mapping — Workshop

Personal Vault:

```text
createwallet
getwalletinfo
listdescriptors as needed
backup flow immediately afterward
```

Multisig baseline:

```text
createwallet
listdescriptors / public descriptor extraction
getdescriptorinfo
importdescriptors
getwalletinfo
```

Exact workflow follows validated multisig implementation.

---

# 157. RPC Mapping — Vault Chamber

```text
getwalletinfo
getbalances
listtransactions / listsinceblock
gettransaction
getaddressinfo
```

Only fetch detailed history when required.

---

# 158. RPC Mapping — Archive

```text
backupwallet
restorewallet
loadwallet
unloadwallet
getwalletinfo
listdescriptors/public identity comparison
```

Filesystem existence/checksum is an application-host operation, not Bitcoin Core RPC.

---

# 159. RPC Mapping — Communications

Receive:

```text
getnewaddress
getaddressinfo
```

Send:

```text
validateaddress
estimatesmartfee
walletcreatefundedpsbt
decodepsbt
analyzepsbt
walletpassphrase
walletprocesspsbt
walletlock
combinepsbt
finalizepsbt
testmempoolaccept
sendrawtransaction
```

Not every flow needs every RPC.

---

# 160. RPC Mapping — Observatory

```text
getblockchaininfo
getmempoolinfo
getblockhash
getblockheader
optional getblockstats
waitfornewblock
```

Detailed raw mempool data should remain optional.

---

# 161. Domain Command Names

The application layer should speak in product/domain language.

Prefer:

```text
CreatePersonalVault
CreateBackup
TestBackup
GenerateReceiveAddress
CreateSpendProposal
SignProposal
FinalizeProposal
BroadcastTransaction
DisableCoreNetworking
```

not UI calls named directly after RPCs.

---

# 162. RPC Map Documentation

Implementation should maintain an explicit table for each domain command:

```text
Domain command
Core RPC(s)
Wallet-scoped?
Needs passphrase?
Requires synchronization?
Requires network activity?
Side effects?
Retry safe?
Sensitive parameters?
```

This can live in this document or a generated companion reference.

---

# 163. Example: Generate Receive Address

```text
Domain:
GenerateReceiveAddress

RPC:
getnewaddress
getaddressinfo

Wallet scoped:
yes

Passphrase:
no

Requires synchronized chain:
no for address generation itself

Requires P2P network:
no

Side effect:
advances wallet address/keypool state

Sensitive:
address has privacy significance
```

---

# 164. Example: Create Backup

```text
Domain:
CreateBackup

RPC:
backupwallet

Wallet scoped:
yes

Passphrase:
no

P2P required:
no

Side effect:
creates file

Retry safe:
only after destination/conflict handling is understood

Sensitive:
backup file is highly sensitive
```

---

# 165. Example: Sign Proposal

```text
Domain:
SignProposal

RPC:
walletpassphrase
walletprocesspsbt(finalize=false)
walletlock

Wallet scoped:
yes

P2P required:
no

Synchronization required:
not necessarily for an externally complete PSBT

Sensitive:
passphrase
PSBT transaction metadata
```

---

# 166. Example: Broadcast

```text
Domain:
BroadcastTransaction

RPC:
testmempoolaccept
sendrawtransaction

Wallet scoped:
no

P2P required:
yes for intended network transmission

User confirmation:
mandatory

Side effect:
external irreversible network action
```

---

# 167. Integration Test Strategy

All critical Core integration must have automated tests against Regtest.

Minimum coverage:

- connect
- detect chain
- create wallet
- encrypted wallet
- wallet load/unload
- address generation
- backup
- restore
- receive funds
- balance refresh
- PSBT construction
- signing
- wallet re-lock
- finalization
- mempool preflight
- broadcast
- network disable/enable
- multisig 2-of-3

---

# 168. Regtest Is the Default Destructive Test Environment

Automated tests must never mutate a real Mainnet wallet.

Regtest gives the project controlled ability to:

- mine blocks
- fund wallets
- confirm transactions
- test reorg-sensitive states if needed
- test multisig repeatedly

---

# 169. Signet

Signet may be used for human integration testing in a networked environment closer to live Bitcoin operation.

Do not make public Signet faucet availability part of automated CI assumptions.

---

# 170. Mainnet Tests

Mainnet automated tests should be strictly read-only unless explicitly isolated and manually approved.

Never:

- create production wallet state
- broadcast
- move funds

as part of ordinary automated test execution.

---

# 171. Golden Multisig Test

Create a deterministic Regtest test:

1. three signer wallets
2. coordinator policy
3. 2-of-3 receive address
4. fund address
5. create PSBT
6. signer A signs
7. assert incomplete
8. signer B signs
9. combine
10. assert threshold
11. finalize
12. test mempool
13. broadcast
14. mine confirmation
15. confirm resulting wallet state

This becomes a critical regression test.

---

# 172. Golden Backup Test

1. create encrypted wallet
2. derive addresses
3. fund wallet
4. create backup
5. unload
6. restore under new internal name
7. verify public identity
8. rescan/confirm state
9. validate funds/history as appropriate

---

# 173. Golden Offline Test

1. create proposal online
2. export
3. disable signer Core P2P network
4. import
5. review
6. sign
7. export
8. restore coordinator side
9. finalize
10. re-enable appropriate networking
11. broadcast

This proves offline signing is first-class.

---

# 174. Regression Around Visual State

Integration tests should emit domain state.

Separate scene tests verify:

```text
networkactive=false
→ external Engine conduits inactive

signature 1/2
→ one Key signed

backup complete
→ Capsule sealed
```

Do not require experience rendering to test Bitcoin correctness.

---

# 175. No UI-Only Proof

A beautiful scene showing:

```text
2 of 3
```

does not prove multisig works.

The underlying Core workflow must have integration tests.

Likewise:

a Backup Capsule animation does not prove backup safety.

---

# 176. Fail Closed on Ambiguity

If Core Vault cannot determine:

- chain
- wallet
- PSBT identity
- transaction outputs
- signer role

with enough confidence for a security-sensitive action:

stop and ask the user.

Do not guess.

---

# 177. No Silent Fallback Between Networks

Never fail Mainnet RPC and silently reconnect to Signet/Regtest.

Chain is explicit.

Connection failure is preferable to ambiguous network identity.

---

# 178. No Silent Wallet Switching

Every wallet-scoped command uses explicit Vault context.

Do not rely on:

> last wallet used

during financial operations.

---

# 179. No Silent Fee Substitution

If requested fee target cannot be satisfied:

do not quietly use an unrelated hardcoded fee.

Explain what Core returned.

---

# 180. No Silent Policy Mutation

Once a Vault policy is created:

Core Vault must not silently change:

- threshold
- keys
- script type
- recovery path
- timelock

because a newer version has a different preferred policy.

Policy migration must be explicit.

---

# 181. Core Is Source of Truth, Documentation Is Source of Intent

There are two different authorities:

## Core runtime

Tells Core Vault what Bitcoin state actually exists.

## Core Vault specification

Tells developers what behavior the product intends.

If implementation assumptions conflict with current Core runtime behavior:

stop and investigate.

Do not manipulate Core data to fit the visual design.

---

# 182. Integration Acceptance Criteria

This integration architecture is successful when:

1. Core Vault connects to local Bitcoin Core without external services.

2. Core version and chain are detected correctly.

3. Core restarts are handled gracefully.

4. New Personal Vaults are real encrypted descriptor wallets.

5. Core Vault never stores wallet passphrases.

6. Receiving addresses come from Core.

7. Backups use `backupwallet`.

8. Restores use `restorewallet`.

9. Spend creation uses Core/PSBT.

10. Transaction review derives from the actual PSBT.

11. Signing uses the correct Core wallet.

12. Multisig signatures remain independently attributable where possible.

13. Threshold completion is distinct from broadcast.

14. Broadcast is explicit.

15. Core P2P networking can be disabled without falsely claiming physical air gap.

16. Offline PSBT signing works.

17. Mainnet/test networks cannot be confused.

18. Scene components never call raw RPC.

19. private key material is not copied into Core Vault metadata.

20. all destructive integration flows pass Regtest tests.

---

# 183. Reference Implementation Principle

Where the existing Core Vault backend already correctly implements one of these workflows:

> preserve and test it before rewriting.

This document is not permission to destroy correct existing Bitcoin code simply to create a cleaner abstraction.

Refactor around proven behavior.

---

# 184. Final Integration Principle

The final Bitcoin Core integration rule is:

> **Do not simulate what Bitcoin Core can tell us.  
> Do not reproduce what Bitcoin Core can do for us.  
> Do not hide what Bitcoin Core actually did.**

Core Vault translates.

Bitcoin Core executes.

The world provides intuition.

The domain layer provides structure.

The RPC adapter provides the boundary.

And Bitcoin Core remains the final source of truth beneath every Vault, Key, Backup Capsule, transaction, block, peer, and machine state that the user sees.
