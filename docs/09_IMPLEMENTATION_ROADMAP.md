# Core Vault — Implementation Roadmap

**Document:** 09 / Implementation Roadmap  
**Status:** Foundational Delivery Plan  
**Depends on:**
- `01_VISION_AND_PHILOSOPHY.md`
- `02_DESIGN_PRINCIPLES.md`
- `03_TECHNICAL_ARCHITECTURE.md`
- `04_WORLD_BIBLE.md`
- `05_ROOM_DESIGN.md`
- `06_INTERACTION_DESIGN.md`
- `07_BITCOIN_CORE_INTEGRATION.md`
- `08_ART_DIRECTION.md`

**Applies to:** Development sequencing, migration of the existing prototype, architecture validation, 3D implementation, Bitcoin Core integration, asset production, testing, security hardening, performance, packaging, and release readiness.

---

# 1. Purpose of This Document

This document defines the order in which Core Vault should be built.

The project already contains working prototype code.

Some of that work is valuable.

Some of the current visual implementation does not satisfy the approved product vision.

The correct response is neither:

> keep polishing the existing UI

nor:

> delete everything and restart.

The correct strategy is:

> **preserve verified Bitcoin functionality, establish strict boundaries, prove the new immersive architecture in a narrow vertical slice, and then replace the old experience incrementally.**

---

# 2. Implementation North Star

The roadmap follows one rule:

> **Prove every major architectural assumption before scaling it.**

Do not:

- build eight rooms before one room works
- produce final art before interaction architecture works
- replace working Bitcoin code without tests
- build Taproot policy tools before basic single-sig is solid
- optimize before measuring
- distribute publicly before security boundaries are understood

---

# 3. Current Project Assumption

The repository may currently contain:

- working Bitcoin Core connection
- Core RPC adapters
- wallet functionality
- 2-of-3 multisig prototype logic
- backup/restore logic
- React/application UI
- desktop host
- scene-like pages
- prototype visual assets
- tests

Before implementation continues, these assumptions must be verified against the actual repository.

Never treat this roadmap as evidence that a feature already exists.

---

# 4. Migration Philosophy

The project migrates in layers.

Conceptually:

```text id="roap01"
Existing application
        │
        ├── preserve working Bitcoin/domain code
        │
        ├── isolate application state
        │
        ├── introduce immersive renderer
        │
        ├── prove one complete room
        │
        ├── migrate features room by room
        │
        └── remove legacy presentation only after replacement works
```

---

# 5. Do Not Delete the Existing Prototype First

The current prototype may serve as:

- functional reference
- debugging interface
- regression comparison
- demonstration of existing Core functionality

Until equivalent functionality exists in the new experience:

do not delete it.

It may later become:

```text id="roap02"
LegacyDevelopmentUI
```

accessible only in development builds.

---

# 6. Definition of Phases

The roadmap is divided into the following major phases:

```text id="roap03"
Phase 0  — Repository Stabilization
Phase 1  — Existing System Audit
Phase 2  — Domain Boundary Hardening
Phase 3  — Real-Time Experience Foundation
Phase 4  — Engine Room Proof of Architecture
Phase 5  — Main Hall and World Navigation
Phase 6  — Personal Vault Vertical Slice
Phase 7  — Archive and Recovery
Phase 8  — Communications and Transactions
Phase 9  — 2-of-3 Multisig Experience
Phase 10 — Observatory
Phase 11 — Library and Education
Phase 12 — Final Art Production
Phase 13 — Accessibility and Performance
Phase 14 — Security Hardening
Phase 15 — Cross-Platform Packaging
Phase 16 — Controlled Public Preview
Phase 17 — Future Policy Systems
```

Each phase has an exit gate.

Do not progress merely because the code “mostly works.”

---

# 7. Phase 0 — Repository Stabilization

## Goal

Establish one authoritative project environment before further implementation.

---

# 8. Phase 0 Tasks

Complete:

- all ten foundational documents
- repository documentation index
- stable branch strategy
- build instructions
- test instructions
- clean working-tree understanding
- identification of experimental/prototype files

---

# 9. Documentation Must Be Versioned

The following files must exist in `docs/`:

```text id="roap04"
01_VISION_AND_PHILOSOPHY.md
02_DESIGN_PRINCIPLES.md
03_TECHNICAL_ARCHITECTURE.md
04_WORLD_BIBLE.md
05_ROOM_DESIGN.md
06_INTERACTION_DESIGN.md
07_BITCOIN_CORE_INTEGRATION.md
08_ART_DIRECTION.md
09_IMPLEMENTATION_ROADMAP.md
10_CODEX_RULES.md
```

These become part of the repository.

---

# 10. Phase 0 Git Baseline

Before architectural implementation:

create a clean Git checkpoint.

The repository should have a commit representing:

> existing working prototype + approved foundational documentation

This gives the project a safe return point.

---

# 11. Never Begin a Major Migration From an Unknown Dirty Tree

Before substantial implementation:

inspect:

```text id="roap05"
git status
git branch
git log
git diff
```

Existing user changes must not be silently overwritten.

---

# 12. Phase 0 Exit Gate

Phase 0 is complete when:

- documentation is committed
- project builds in its current state
- current tests are known
- existing prototype can be launched
- Git state is clean or intentionally documented
- no architectural migration has started accidentally

---

# 13. Phase 1 — Existing System Audit

## Goal

Determine exactly what currently works.

No visual redesign in this phase.

---

# 14. Audit Desktop Host

Identify whether the current project uses:

- Electron
- Tauri
- another desktop host

Document:

- privileged process
- renderer process
- IPC boundary
- filesystem access
- RPC location

---

# 15. Audit Bitcoin Core Connection

Verify:

- connection method
- cookie authentication
- RPC address
- reconnection behavior
- Core version detection
- chain detection

Do not assume the existing implementation is secure merely because it works.

---

# 16. Audit Wallet Functions

Verify existing support for:

- wallet creation
- encryption
- load/unload
- receive address
- balance
- transaction history
- backup
- restore

For each feature record:

```text id="roap06"
Implemented?
Tested?
Core RPC used?
Known limitations?
UI coupled?
Reusable?
```

---

# 17. Audit Multisig

The existing 2-of-3 flow receives special attention.

Document:

- wallets involved
- descriptor
- signer model
- coordinator model
- PSBT flow
- backup assumptions
- address derivation
- signing
- finalization
- broadcast

---

# 18. Do Not Rewrite Multisig During Audit

The purpose of the audit is understanding.

If the current implementation appears questionable:

write tests first.

Do not “clean it up” while still discovering how it works.

---

# 19. Audit Existing UI

Identify:

- reusable state management
- backend coupling
- route architecture
- forms
- legacy room screens
- prototype assets
- reusable precision UI components

Not everything visual needs to be thrown away.

---

# 20. Audit Tests

Categorize:

```text id="roap07"
unit
integration
end-to-end
manual
missing
```

Document which Core flows currently have no automated proof.

---

# 21. Phase 1 Deliverable

Create:

```text id="roap08"
docs/CURRENT_IMPLEMENTATION_AUDIT.md
```

This is not one of the foundational ten documents.

It records the repository as discovered.

---

# 22. Phase 1 Exit Gate

Do not continue until:

- existing Core functionality is understood
- current build works
- current 2-of-3 behavior is documented
- important untested behavior is identified
- boundaries that require refactoring are known

---

# 23. Phase 2 — Domain Boundary Hardening

## Goal

Separate Bitcoin/application truth from the existing visual frontend.

---

# 24. Establish Typed Core Adapter

Create or confirm a typed adapter described by:

`07_BITCOIN_CORE_INTEGRATION.md`.

UI code should stop depending on arbitrary raw RPC calls.

---

# 25. Establish Domain Services

At minimum create or confirm:

```text id="roap09"
NodeService
VaultService
BackupService
RestoreService
TransactionService
SigningService
MultisigService
```

Only services relevant to implemented functionality need to exist immediately.

---

# 26. Establish Application Models

Define typed semantic models for:

- Core
- Vault
- Key
- Backup
- Spend Proposal
- PSBT
- Transaction
- Node
- Mempool

---

# 27. Introduce Critical State Machines

Implement explicit state machines for:

- Core connection
- backup
- wallet creation
- transaction
- signing

Do not wait until 3D scenes exist.

---

# 28. Preserve Legacy UI

During Phase 2:

the old UI should continue consuming the new/cleaned domain layer.

This proves refactoring has not broken functionality.

---

# 29. Add Regtest Infrastructure

Create a reproducible development system for:

- starting temporary Bitcoin Core Regtest
- creating wallets
- mining blocks
- funding wallets
- shutting down
- cleaning only temporary test state

---

# 30. Golden Single-Sig Test

Before new visuals:

automate:

```text id="roap10"
create encrypted wallet
→ backup
→ receive
→ fund
→ PSBT
→ review model
→ sign
→ lock
→ finalize
→ preflight
→ broadcast
→ confirm
```

---

# 31. Golden Multisig Test

Automate the existing 2-of-3 flow.

Do not begin major visual multisig work until this is green.

---

# 32. Phase 2 Exit Gate

Required:

- scene code cannot call raw RPC
- Core adapter tested
- single-sig integration test passes
- existing multisig integration test passes
- old UI still operates sufficiently for comparison
- secrets do not enter generic frontend state

---

# 33. Phase 3 — Real-Time Experience Foundation

## Goal

Introduce the renderer without attempting to build the entire world.

---

# 34. Add Rendering Stack

Preferred initial implementation:

- Three.js
- React Three Fiber
- selective Drei utilities

Do not add:

- Unity
- Unreal
- physics engine
- multiple competing renderers

without an approved architectural change.

---

# 35. Integrate Renderer Into Existing Desktop Host

The new renderer should live inside the existing desktop application.

Do not create a separate game executable communicating through an ad hoc interface unless a future architecture review requires it.

---

# 36. Create Experience Root

Suggested structure:

```text id="roap11"
src/
  experience/
    world/
    scenes/
    artefacts/
    camera/
    interaction/
    audio/
    visual-state/
```

Adapt to existing repository conventions.

---

# 37. Implement Scene Router

Support initially:

```text id="roap12"
MAIN_HALL
ENGINE_ROOM
```

Do not add all future rooms just because enum entries are easy.

---

# 38. Implement Camera System

Required:

- room default camera
- focus camera
- return
- transition
- reduced-motion mode

---

# 39. Implement Interaction System

Required:

- raycast interaction
- semantic objects
- hover
- focus
- activate
- keyboard equivalent

---

# 40. Implement Contextual UI Bridge

Prove that:

- a 3D object can be selected
- camera can focus
- an accessible DOM panel can open
- panel can invoke a domain action
- result can change the 3D object

This is one of the most important architecture tests.

---

# 41. Implement Visual State Adapter

Example:

```text id="roap13"
NodeStatus
→ EngineVisualState
```

The renderer must not interpret raw RPC responses.

---

# 42. Implement Development Mock State

Provide development-only controls for:

- Core disconnected
- Core connected
- Sync 50%
- Sync complete
- Network disabled
- New block

The build must clearly identify mock mode.

---

# 43. Phase 3 Art

Use deliberate greybox geometry.

Do not create final rooms yet.

Aim for:

- correct scale
- lighting capability
- camera
- interaction
- material proof

---

# 44. Phase 3 Exit Gate

The renderer is accepted only when:

- real 3D geometry is visible
- camera occupies real space
- a semantic object is clickable
- keyboard access works
- DOM panel anchors correctly
- domain state changes object state
- reduced motion works
- renderer failure does not corrupt Bitcoin state

---

# 45. Phase 4 — Engine Room Proof of Architecture

## Goal

Build the first complete vertical slice.

The Engine Room is chosen because it combines:

- Core data
- environmental state
- real-time animation
- contextual precision
- atmosphere

---

# 46. Engine Room Greybox

First create:

- room geometry
- Reactor placeholder
- conduit placeholders
- camera
- inspection position

No final art.

---

# 47. Connect Real Node State

The Reactor must respond to real:

- Core availability
- sync progress
- synchronized state
- network activity
- chain identity
- block event

---

# 48. Reactor States

Implement:

```text id="roap14"
DORMANT
CONNECTING
SYNCING
STABLE
NETWORK_DISABLED
ERROR
```

These must originate from domain state.

---

# 49. Network Toggle

Implement intentional network control:

```text id="roap15"
getnetworkinfo
→ inspect state
→ user confirms
→ setnetworkactive
→ re-query
→ visual update
```

---

# 50. Reactor Technical Panel

On inspection show:

- Core version
- chain
- block height
- sync
- IBD
- network activity
- peer count
- mempool summary

---

# 51. New Block Event

Prove:

```text id="roap16"
real new Regtest block
→ domain event
→ Reactor pulse
```

No manually triggered visual cheat in the integration test.

---

# 52. Engine Room Initial Art Pass

Only after functionality works:

introduce:

- limestone
- bronze
- glass
- energy
- controlled lighting

The art may remain prototype quality.

---

# 53. Phase 4 Exit Gate

This phase is pivotal.

Do not proceed unless a user looking at the room can distinguish:

- Core unavailable
- syncing
- synced
- network active
- network disabled

from the environment itself.

If this still looks like:

> a web dashboard with a 3D model behind it

stop and redesign.

---

# 54. Architecture Decision Gate

After Engine Room prototype, explicitly evaluate:

- Three.js performance
- desktop host compatibility
- visual potential
- DOM/3D integration
- accessibility
- development complexity

Only now decide whether the rendering architecture is sufficient.

Do not decide based only on theory.

---

# 55. Phase 5 — Main Hall and World Navigation

## Goal

Prove that Core Vault feels like one place.

---

# 56. Main Hall Greybox

Create:

- architectural volume
- Vault area
- Workshop path
- Engine Room path
- Archive path
- Observatory path
- Library path

Not all destination rooms need to exist yet.

---

# 57. Navigation Must Be Spatial

The user should reach Engine Room by interacting with the world.

A minimal fallback navigation control remains available.

---

# 58. Create Room Transition Language

Prove at least:

```text id="roap17"
Main Hall → Engine Room
Engine Room → Main Hall
```

with:

- controlled camera
- scene preload
- audio transition
- reduced-motion alternative

---

# 59. Vault Placeholder Objects

Render existing known Vaults as semantic physical objects.

Initially they may use simple geometry.

Do not show them as cards.

---

# 60. Empty Main Hall

Design a real no-Vault state.

The world must still feel finished.

Guide toward Workshop spatially.

---

# 61. Main Hall Core State

Provide broad Core status without recreating Engine Room metrics.

---

# 62. Phase 5 Exit Gate

A first-time tester should be able to:

- understand they are in a central place
- identify their Vaults
- find Engine Room
- understand that other areas exist

without using a permanent sidebar.

---

# 63. Phase 6 — Personal Vault Vertical Slice

## Goal

Complete the first real user journey from nothing to a usable single-sig Vault.

---

# 64. Workshop Greybox

Build:

- central work table
- Vault foundation
- Key station
- contextual panel location
- path from Main Hall

---

# 65. Personal Vault Interaction

Implement:

```text id="roap18"
Select Personal Vault
→ one Key
→ understand 1-of-1
→ name
→ passphrase
→ review
→ createwallet
→ visual completion
```

---

# 66. No Fake Forge Success

During RPC:

- blue processing state

Only after Core success:

- mechanism settles
- validated state appears

---

# 67. Vault Metadata

Persist safe application metadata:

- Vault ID
- display name
- Core wallet identifier
- type
- chain
- public identity

No passphrase.

---

# 68. Main Hall Update

After Vault creation:

the new Vault must appear in Main Hall from actual application state.

No application restart required.

---

# 69. Vault Chamber MVP

Create initial Vault Chamber containing:

- selected Vault
- Vault name
- single Key identity
- balance
- broad backup status
- Receive
- Send entry points

Still use placeholder art where necessary.

---

# 70. Phase 6 Exit Gate

From a clean Regtest profile a user can:

- open Core Vault
- navigate to Workshop
- create encrypted Personal Vault
- see it physically appear in Main Hall
- enter its Vault Chamber
- inspect it

with no legacy page required.

---

# 71. Phase 7 — Archive and Recovery

## Goal

Make backup a first-class physical and functional part of the product.

---

# 72. Archive Greybox

Build:

- Vault backup niche
- Capsule
- Verification Station
- camera
- focus state

---

# 73. Backup Vertical Slice

Implement:

```text id="roap19"
Vault requires backup
→ Archive
→ Capsule
→ OS save location
→ backupwallet
→ verify file
→ Capsule seals
```

---

# 74. Backup Status Propagation

After success:

- Archive updates
- Vault Chamber updates
- Main Hall attention state clears where appropriate

All from shared application state.

---

# 75. Restore Test

Implement real test restore.

Do not make a fake “verification complete” animation based only on checksum.

---

# 76. Full Restore

Implement deliberate restore flow separately from test restore.

---

# 77. Archive Security Copy

Clearly communicate:

- where backup exists
- when it was created
- whether restore was tested
- what Core Vault cannot know

---

# 78. Phase 7 Exit Gate

A user must be able to:

- create wallet
- create backup
- restart application
- test restore
- understand recovery status

using real Core operations.

---

# 79. Phase 8 — Communications and Transactions

## Goal

Complete safe single-sig Send and Receive.

---

# 80. Communications Greybox

Build:

- Receive side
- Send side
- central review focus
- network-state representation

---

# 81. Receive Flow

Implement actual:

```text id="roap20"
getnewaddress
→ address verification
→ QR
→ copy
→ label
```

---

# 82. Receive Must Be Fast

Do not over-theatricalize address generation.

The room may respond visually, but the address should appear quickly.

---

# 83. Send Proposal

Implement:

- destination
- amount
- fee estimate
- PSBT creation
- decode/analyze
- review model

---

# 84. Transaction Review First

Before implementing beautiful signing animation:

make the review interface correct.

This includes:

- address
- amount
- outputs
- change
- fee
- fee rate
- network
- RBF

---

# 85. Signing

Connect real Core signing.

Passphrase:

- temporary
- never persisted
- wallet re-lock attempted immediately after signing

---

# 86. Finalization

Maintain:

```text id="roap21"
signed
≠
finalized
≠
broadcast
```

in domain state and visuals.

---

# 87. Broadcast

Implement:

- testmempoolaccept
- explicit confirmation
- sendrawtransaction
- actual success event
- restrained outward animation

---

# 88. Network Disabled

Verify:

- signing still works where appropriate
- export works
- Broadcast unavailable
- visual state makes sense

---

# 89. Phase 8 Exit Gate

Complete Golden Single-Sig user journey through the new immersive UI.

Legacy UI is no longer required for Personal Vault daily operation.

---

# 90. Phase 9 — 2-of-3 Multisig Experience

## Goal

Apply the world model to the already-proven multisig domain workflow.

---

# 91. Do Not Change Policy Yet

First visual multisig version must use the already-tested backend policy.

Do not simultaneously:

- change descriptor type
- add Taproot
- add custom M-of-N
- redesign signing transport

while replacing UI.

---

# 92. Workshop Multisig Composition

Implement:

- central Vault
- three Key artefacts
- independent identities
- visible two-signature threshold

---

# 93. Setup Flow

User should understand:

> three independent keys protect this Vault

before technical setup details appear.

---

# 94. Distributed-Security Warning

If all signers are being demonstrated locally:

clearly mark:

> Local demonstration setup

Do not visually imply strong distributed custody.

---

# 95. Multisig Receive

Coordinator derives real receiving address.

UI should support verification of policy/address.

---

# 96. Multisig Spend

Implement visual sequence:

```text id="roap22"
0/2
→ signer A
→ 1/2
→ signer B
→ 2/2
→ finalized
→ ready
→ explicit broadcast
```

---

# 97. Key Attribution

Only illuminate a specific signing Key when attribution is established.

---

# 98. PSBT Import/Export

File workflow must be usable on actual separate signer machines.

Do not optimize only for one local demo environment.

---

# 99. Phase 9 Exit Gate

A real Regtest 2-of-3 transaction must complete through:

- coordinator
- signer 1
- signer 2
- finalization
- broadcast

with the visual world accurately representing every stage.

---

# 100. Phase 10 — Observatory

## Goal

Build the first room designed primarily for presence rather than task completion.

---

# 101. Observatory Greybox

Prioritize:

- horizon
- scale
- viewing composition
- mempool focal structure
- recent block space

---

# 102. Local Data Only

Use:

- Core mempool summary
- recent blocks
- local fee environment where appropriate

No remote explorer.

---

# 103. Mempool Visualization

Build aggregate mapping.

Document exactly which visual properties correspond to which real metrics.

---

# 104. Block Event

Integrate the same new-block domain event used by Engine Room.

One event.

Multiple environmental reactions.

---

# 105. Hangout Test

Leave Observatory open for ten minutes.

Evaluate:

- CPU
- GPU
- visual fatigue
- audio fatigue
- clarity
- event behavior

This test matters.

---

# 106. Phase 10 Exit Gate

The room must be worth visiting with no immediate action.

If it feels like a metrics dashboard:

redesign it.

---

# 107. Phase 11 — Library and Education

## Goal

Add progressive technical depth without contaminating ordinary workflows.

---

# 108. Knowledge Architecture

Create structured content for:

- Vault
- Key
- Backup
- Multisig
- PSBT
- Descriptor
- Bitcoin Core
- Mempool
- Block
- Taproot
- Timelock

---

# 109. Three-Level Content

Each concept:

```text id="roap23"
Simple
Learn More
Technical
```

---

# 110. Contextual Links

Workshop Key:

`Learn more`

should open relevant content while preserving interaction context.

---

# 111. Walkthrough

Implement ability to:

- replay onboarding
- replay room orientation
- disable startup tutorial

---

# 112. Search

Library search may now be introduced.

Keep it local.

---

# 113. Phase 11 Exit Gate

A beginner can operate basic Core Vault without reading the Library.

An expert can inspect how the metaphors map to Bitcoin Core.

Both conditions are required.

---

# 114. Phase 12 — Final Art Production

## Goal

Replace approved greybox/prototype assets with production-quality visual assets.

Do this only after spatial interaction is proven.

---

# 115. Art Production Order

Recommended:

```text id="roap24"
1. Shared material library
2. Core Reactor
3. Key
4. Vault
5. Main Hall
6. Workshop
7. Engine Room
8. Backup Capsule / Archive
9. Communications
10. Vault Chamber
11. Observatory
12. Library
```

Hero semantic objects come before decorative detail.

---

# 116. Concept Approval Before Modelling

Each hero asset should have approved:

- silhouette
- function
- states
- material
- scale

before detailed modelling.

---

# 117. Greybox Must Survive

Do not change interaction geometry casually to accommodate art.

Art should satisfy established:

- camera
- hit areas
- UI safe zones
- interaction slots

unless the design is intentionally revised.

---

# 118. Build Shared Material Library

Create stable production materials:

- limestone
- bronze structural
- bronze precision
- dark metal
- glass
- blue energy
- gold energy

---

# 119. Replace References With Original Art

Reference article images must not ship as backgrounds.

Final scenes must be original assets specifically constructed for Core Vault.

---

# 120. Art Optimization Pass

Every completed scene receives:

- triangle review
- draw-call review
- texture compression
- lighting optimization
- shadow review
- transparent-object review

before being considered final.

---

# 121. Phase 12 Exit Gate

Every room should:

- belong to the same facility
- match approved Art Direction
- retain interaction clarity
- run within performance targets

---

# 122. Phase 13 — Accessibility and Performance

Accessibility was required throughout development.

This phase is for systematic hardening, not first implementation.

---

# 123. Full Keyboard Audit

Complete every major flow using only keyboard.

Including:

- navigation
- Vault creation
- backup
- receive
- send
- review
- signing
- Library

---

# 124. Screen Reader Audit

Verify semantic equivalents for:

- rooms
- Vaults
- Keys
- Reactor
- Capsules
- navigation
- status

---

# 125. Reduced Motion Audit

Complete all core workflows with Reduced Motion enabled.

No dependency on animation.

---

# 126. Sound-Off Audit

Complete all workflows with audio disabled.

No missing feedback.

---

# 127. Graphics Quality Profiles

Implement:

```text id="roap25"
High
Balanced
Efficient
```

or equivalent.

Core functionality remains identical.

---

# 128. Hardware Performance Matrix

Test representative:

- Apple Silicon Mac
- Intel/AMD Windows machine
- integrated GPU
- moderate discrete GPU
- Linux configuration

Do not optimize exclusively on one high-end developer machine.

---

# 129. Idle Performance

Measure application while:

- Main Hall idle
- Engine Room idle
- Observatory idle
- minimized

Reduce waste.

---

# 130. Phase 13 Exit Gate

Core Vault remains:

- responsive
- usable
- understandable

across accessibility modes and reasonable desktop hardware.

---

# 131. Phase 14 — Security Hardening

## Goal

Treat Core Vault as Bitcoin software before public use with meaningful funds.

---

# 132. Threat Model

Create/update:

```text id="roap26"
docs/SECURITY_MODEL.md
```

Cover:

- malicious local software
- compromised renderer
- malicious PSBT
- passphrase exposure
- RPC credentials
- backup handling
- filesystem paths
- network confusion
- signer compromise

---

# 133. Renderer Boundary Review

Verify renderer cannot:

- execute arbitrary shell commands
- read arbitrary filesystem
- read RPC cookie directly
- invoke arbitrary Core RPC
- access secrets through debug interfaces

---

# 134. Logging Review

Inspect production logs for:

- passphrases
- xprv
- private descriptors
- raw cookie
- sensitive PSBT
- unnecessary addresses

---

# 135. Dependency Review

Audit:

- rendering libraries
- desktop host packages
- IPC libraries
- QR library
- state management
- asset loaders

Remove unnecessary dependencies.

---

# 136. Mainnet Guardrails

Development builds should not accidentally connect to or mutate mainnet without explicit intent.

Regtest remains default for destructive development.

---

# 137. Backup Review

Manually verify:

- backup creation
- restoration
- multiple application restarts
- wrong backup
- corrupted backup
- destination conflict
- filesystem permission failure

---

# 138. Transaction Review Attacks

Test:

- wrong network
- malformed address
- changed PSBT
- unexpected output
- abnormal fee
- insufficient signatures
- incompatible imported PSBT

---

# 139. Multisig Recovery Review

Verify recovery requirements independently.

Do not call 2-of-3 production-ready merely because spending works.

---

# 140. Security Claims

Before audit, product copy must not claim:

- audited
- secure
- production-ready
- guaranteed safe

unless those claims are justified.

---

# 141. Phase 14 Exit Gate

Required before meaningful-funds recommendation:

- documented security model
- no known secret leakage
- destructive tests green
- backup/restore validated
- PSBT review hardened
- external review performed or limitations clearly disclosed

---

# 142. Phase 15 — Cross-Platform Packaging

## Goal

Make Core Vault installable as a real desktop application.

---

# 143. macOS

Implement:

- production build
- application bundle
- permissions
- signing/notarization strategy
- standard Core datadir discovery

---

# 144. Windows

Implement:

- installer/package
- filesystem path handling
- scaling
- Core discovery
- GPU behavior
- signing strategy

---

# 145. Linux

Implement:

- documented package/build format
- common desktop compatibility
- data-directory handling
- graphics fallback behavior

---

# 146. Do Not Call a Platform Supported Until Tested

Building successfully in CI is not enough.

Perform real launch and Core interaction tests.

---

# 147. Phase 15 Exit Gate

At least one controlled real machine on each target platform can:

- install
- launch
- connect to Core
- create Regtest Vault
- backup
- receive
- send
- close/reopen

---

# 148. Phase 16 — Controlled Public Preview

## Goal

Gather real usability feedback without presenting experimental software as finished custody infrastructure.

---

# 149. Preview Scope

Recommended early preview:

- Regtest
- Signet
- explicit experimental Mainnet mode only if intentionally approved

---

# 150. Preview Messaging

Clearly communicate:

- experimental software
- no independent security audit if true
- verify backups independently
- use small amounts if Mainnet testing is permitted

---

# 151. Feedback Priorities

Ask users primarily:

- Do you know where things are?
- Does the spatial model make sense?
- Can you understand 2-of-3?
- Do you know what Core is doing?
- Can you create and verify a backup?
- Does transaction review feel safe?
- Is the world calm or distracting?

Do not optimize first around superficial visual opinions.

---

# 152. Observe Confusion

Especially watch for:

- users clicking non-interactive decoration
- users missing room exits
- users misunderstanding backup Capsule
- users thinking Vault literally holds coins
- users confusing threshold reached with broadcast
- users assuming network disabled means air-gapped

These are design failures worth fixing.

---

# 153. Phase 16 Exit Gate

Move beyond preview only when both:

- Bitcoin flows are reliable
- spatial interactions are understood by users

A beautiful product that confuses self-custody is not ready.

---

# 154. Phase 17 — Future Policy Systems

Only after the foundational product is mature should Core Vault expand into more sophisticated policies.

---

# 155. Custom M-of-N

Future work may add:

- N Key composition
- threshold selection
- policy visualization

Requires:

- deterministic compiler
- tests
- backup semantics
- recovery documentation

---

# 156. Taproot

Future Taproot policy work may add:

- key-path policy
- script-path policy
- `multi_a`
- Miniscript
- structured recovery branches

Only after formal policy specification.

---

# 157. Timelocks

Future:

- absolute timelock
- relative timelock
- delayed recovery

Each requires exact semantics.

---

# 158. Inheritance

Inheritance-style policies may eventually be assembled visually.

Do not market or implement them casually.

The consequences of incorrect policy design are severe.

---

# 159. Hardware Wallets and External Signers

Future integration may add:

- hardware signer
- Core external signer
- QR workflow

Each receives separate UX and security design.

---

# 160. Remote Core

Remote Bitcoin Core integration is not simply:

> allow another IP address.

It creates:

- authentication
- transport security
- privacy
- network exposure

requirements.

Handle as a future separately reviewed feature.

---

# 161. Implementation Task Size

Codex tasks should be intentionally narrow.

Good:

> Implement typed NodeStatus mapping from getnetworkinfo/getblockchaininfo and tests.

Good:

> Build Engine Room greybox with Reactor states driven by mock VisualNodeState.

Bad:

> Implement Core Vault according to all docs.

The latter is too broad and encourages shortcuts.

---

# 162. One Architectural Concern Per Task

Prefer separate tasks for:

- Core adapter
- visual adapter
- Reactor component
- room lighting
- network toggle
- tests

rather than one giant prompt.

This improves reviewability.

---

# 163. Every Codex Task Must Name Relevant Documents

Example:

```text id="roap27"
Before implementation, read:

docs/01_VISION_AND_PHILOSOPHY.md
docs/02_DESIGN_PRINCIPLES.md
docs/03_TECHNICAL_ARCHITECTURE.md
docs/07_BITCOIN_CORE_INTEGRATION.md
docs/09_IMPLEMENTATION_ROADMAP.md
```

Then identify task-specific documents.

---

# 164. Codex Must Inspect Before Modifying

Each task should begin:

1. inspect relevant existing code
2. identify current implementation
3. explain intended changes briefly
4. implement
5. test
6. report

Do not have Codex guess file architecture from the prompt.

---

# 165. Test Before and After

For any refactor of existing functionality:

run relevant tests before modification.

Then after.

This establishes whether a failure was introduced or pre-existing.

---

# 166. Small Commits

Prefer logical commits.

Examples:

```text id="roap28"
refactor: isolate Bitcoin Core node service

feat: add R3F experience shell

feat: add Engine Room reactor states

test: add regtest wallet backup coverage
```

Avoid giant commits mixing:

- architecture
- art
- wallet logic
- dependencies
- unrelated cleanup

---

# 167. No Opportunistic Refactor

While implementing one feature, Codex should not:

- rename unrelated modules
- change framework
- rewrite state management
- update every dependency
- format the entire repository

unless required.

---

# 168. No Premature Final Art

If an interaction has not passed user-flow review:

do not invest heavily in its final model.

Greybox is cheaper to change.

---

# 169. No Premature Taproot

Do not let enthusiasm for the long-term policy builder derail the foundational product.

Priority:

```text id="roap29"
Core connection
→ single-sig
→ backup
→ receive/send
→ offline signing
→ 2-of-3
→ world maturity
→ advanced policies
```

---

# 170. Definition of MVP

Core Vault MVP is not:

> every room and every Bitcoin feature.

A meaningful MVP contains:

- immersive Main Hall
- Engine Room
- Workshop
- Personal Vault
- Vault Chamber
- Archive
- Communications
- Core connection
- encrypted single-sig
- backup/restore
- receive
- PSBT send
- explicit broadcast
- basic Library/walkthrough
- real Bitcoin Core integration

Observatory and 2-of-3 may be included depending on quality, but should not delay proof of the foundational model indefinitely.

---

# 171. Definition of Alpha

Alpha may include:

- all primary rooms
- Personal Vault
- working 2-of-3
- offline PSBT signing
- basic Observatory
- Library
- accessibility foundations
- realistic but incomplete art

Still experimental.

---

# 172. Definition of Beta

Beta requires:

- mature room interactions
- production-quality visual pass
- performance profiles
- strong backup recovery
- multisig testing
- cross-platform packaging
- security hardening
- broader usability testing

---

# 173. Definition of Production Candidate

A production candidate requires more than visual completion.

It requires confidence in:

- wallet lifecycle
- backup
- restoration
- signing
- transaction review
- broadcast
- network identity
- secrets
- multisig recovery
- upgrades
- packaging

---

# 174. Product Quality Triangle

Every milestone must evaluate three dimensions:

```text id="roap30"
Bitcoin Correctness
Experience Quality
Operational Reliability
```

Do not accept two out of three.

---

# 175. Bitcoin Correctness Gate

Ask:

- Does real Core state drive this?
- Is policy correct?
- Are RPC semantics tested?
- Is recovery understood?

If no:

feature is not complete.

---

# 176. Experience Gate

Ask:

- Is the room the interface?
- Are meaningful objects interactive?
- Does it feel spatial?
- Is conventional UI contextual?

If no:

feature does not satisfy Core Vault vision.

---

# 177. Operational Gate

Ask:

- Does it survive restart?
- Does error recovery work?
- Does reconnect work?
- Does it run acceptably?
- Does it work without animation/audio?

If no:

feature is not reliable.

---

# 178. Feature Completion Rule

A feature is not complete because:

- code compiles
- screenshot looks good
- one happy-path demo succeeds

A feature is complete when:

- behavior
- tests
- error handling
- visual state
- accessibility
- documentation

are all reasonably addressed for its milestone.

---

# 179. Documentation Evolves With Implementation

If implementation reveals a foundational specification problem:

do not silently ignore the document.

Instead:

1. identify conflict
2. propose document update
3. approve reasoning
4. update document
5. implement according to new agreed state

The docs are living specifications, not decoration.

---

# 180. Do Not Let Codex Rewrite Foundational Documents Unprompted

Codex may report conflicts.

It may not silently alter foundational requirements merely to simplify implementation.

Changes require explicit approval.

---

# 181. Development Mode Is First-Class

Developers need fast ways to test scenes.

Provide:

- direct room launch
- mock states
- event triggers
- camera controls
- graphics stats

These do not appear in production.

---

# 182. Demo Mode Is Different From Development Mode

Development mode:

for developers.

Demo mode:

for safe product demonstration.

Do not expose developer debugging controls simply because Demo mode exists.

---

# 183. Regtest as Daily Development Environment

Whenever possible, daily Bitcoin interaction development should use Regtest.

This allows actual:

- blocks
- transactions
- signing
- balances

while remaining safe.

---

# 184. Mainnet Should Be Boring

By the time Mainnet is used:

the exact flows should already be thoroughly tested elsewhere.

Mainnet is not where UX experimentation should first occur.

---

# 185. Risk-Based Development Order

Highest-risk technical areas should be proven earlier:

- Core boundary
- passphrase handling
- backup/restore
- PSBT identity/review
- multisig

Pure visual polish comes later.

---

# 186. Risk-Based Art Order

Highest-value visual proof areas should be built earlier:

- Reactor
- Main Hall
- Key
- Vault

These define whether the overall concept works.

---

# 187. Do Not Overbuild Infrastructure

Do not create:

- general-purpose game framework
- massive entity-component system
- generic policy language
- asset-management platform

unless real project complexity requires it.

Core Vault should remain focused.

---

# 188. Measure Before Optimizing

Profile:

- load
- draw calls
- memory
- GPU
- CPU
- RPC frequency

before making large optimization changes.

---

# 189. Stable 60 FPS Is Aspirational, Not Bitcoin Logic

Target smooth rendering.

But Core Vault correctness must remain independent of visual frame rate.

On weaker hardware, reduce visuals.

Never reduce Bitcoin validation/review quality.

---

# 190. No Feature Should Depend on High Graphics Mode

If changing from High to Efficient causes:

- missing status
- unavailable navigation
- unclear signature state

the art architecture is wrong.

---

# 191. User Testing Begins Before Final Art

Greybox/prototype testing can answer:

- can people find rooms?
- do they understand Key?
- do they understand threshold?
- does Archive metaphor work?

Do not wait for cinematic quality to discover conceptual UX failure.

---

# 192. Questions for Early Testers

Ask users to perform tasks without giving instructions:

- create a Vault
- make a backup
- find Core status
- disable Core network activity
- receive bitcoin
- prepare a transaction
- identify how many signatures are needed

Observe where they go.

---

# 193. Avoid Asking Only “Do You Like It?”

Aesthetic preference alone does not validate interaction.

Ask:

> What do you think this object does?

> Where would you go to make a backup?

> What does this Key state mean?

> Has this transaction been sent yet?

These questions reveal mental-model quality.

---

# 194. Security User Test

After transaction review ask:

> Where is the bitcoin going?

> How much?

> What is the fee?

> Has it been broadcast?

If users cannot answer confidently:

the interaction is unsafe.

---

# 195. Backup User Test

Ask:

> What exactly did that Capsule represent?

Expected understanding:

> Bitcoin Core created a wallet backup file at the selected location.

Not:

> The app stored my bitcoin in the Capsule.

---

# 196. Core User Test

Ask:

> What does it mean when the Reactor is active but the external conduits are off?

Expected:

> Bitcoin Core is running locally, but its network activity is disabled.

This validates the metaphor.

---

# 197. Launch Is Not the End

After initial release:

prioritize:

- recovery reliability
- hardware diversity
- Core upgrades
- usability
- visual refinement
- advanced policies only when justified

---

# 198. Long-Term Architectural Stability

The ideal result of this roadmap is an architecture where:

- Bitcoin services evolve independently
- scenes evolve independently
- assets evolve independently
- new policies can be added safely
- Core upgrades do not require replacing the world
- new art does not change Bitcoin semantics

---

# 199. Roadmap Rejection Criteria

A proposed implementation sequence should be rejected if it suggests:

- rebuilding everything at once
- deleting the working backend before tests
- creating all final rooms before proof-of-architecture
- finishing visuals before transaction correctness
- introducing arbitrary Taproot policy before baseline flows
- public Mainnet release before backup/recovery hardening
- mixing every change into one Codex task

---

# 200. Immediate Next Step After Foundational Docs

After documents `01` through `10` are committed:

the first implementation task should **not** be:

> Build Core Vault.

The first implementation task should be:

> **Audit the existing repository against the approved architecture and produce `CURRENT_IMPLEMENTATION_AUDIT.md` without yet performing the major UI rewrite.**

Only after that audit should the first code-migration task be selected.

---

# 201. First Recommended Coding Sequence

After audit, the most likely sequence is:

```text id="roap31"
1. Secure/confirm Core adapter boundary
2. Confirm Regtest integration tests
3. Add real-time experience shell
4. Add visual-state adapter
5. Build Engine Room greybox
6. Connect real Core state
7. Validate architecture
8. Build Main Hall
9. Build Workshop
10. Complete Personal Vault vertical slice
```

Do not skip from step 1 directly to final photorealistic rooms.

---

# 202. Why Engine Room Comes First

Engine Room is the strongest architectural proof because it requires:

- real Core data
- state mapping
- 3D rendering
- motion
- object interaction
- contextual UI
- scene identity

If Core Vault cannot make the Engine Room concept work convincingly, the larger spatial strategy needs reconsideration before expensive expansion.

---

# 203. Why Personal Vault Comes Before Advanced Multisig UX

Personal Vault proves:

- wallet creation
- passphrase
- backup
- receive
- send
- signing
- visual state
- room navigation

with lower policy complexity.

Once this works cleanly, multisig builds on proven infrastructure.

---

# 204. Why Backup Comes Early

Backup is not an optional utility.

A self-custody product that makes wallet creation beautiful but leaves recovery for later has the wrong priorities.

Archive therefore belongs in the first functional vertical slice.

---

# 205. Why Final Art Comes Later

Final 3D art is expensive.

Interaction changes can invalidate:

- camera
- geometry
- object positions
- animation
- lighting
- modelling effort

Therefore:

> prove function → prove space → produce final art.

---

# 206. Why Observatory Comes Later

Observatory is important to the long-term emotional identity.

But it is not required to prove safe custody.

It should not delay:

- wallet
- backup
- transaction
- signing

correctness.

---

# 207. Why Library Comes After Core Interaction Model

The Library explains the world.

It should document and teach an interaction model that has already stabilized.

Otherwise educational content continuously chases changing UX.

---

# 208. Milestone Naming

Recommended milestones:

```text id="roap32"
M0 — Foundation
M1 — Core Boundary
M2 — Experience Proof
M3 — Personal Vault
M4 — Recovery
M5 — Transactions
M6 — Multisig
M7 — Complete Facility
M8 — Production Art
M9 — Hardening
M10 — Preview
```

---

# 209. M0 — Foundation

Contains:

- ten documents
- audit preparation
- Git baseline

No major new UI.

---

# 210. M1 — Core Boundary

Contains:

- typed Core adapter
- domain services
- Regtest
- golden tests

Legacy UI may still dominate.

---

# 211. M2 — Experience Proof

Contains:

- R3F
- Engine Room
- real Core visual state
- DOM precision panel

This milestone determines whether the concept is technically viable.

---

# 212. M3 — Personal Vault

Contains:

- Main Hall
- Workshop
- Vault Chamber
- encrypted Personal Vault

---

# 213. M4 — Recovery

Contains:

- Archive
- backup
- test restore
- full restore

---

# 214. M5 — Transactions

Contains:

- Communications
- Receive
- PSBT Send
- signing
- broadcast

---

# 215. M6 — Multisig

Contains:

- real 2-of-3
- signer states
- offline coordination
- PSBT exchange

---

# 216. M7 — Complete Facility

Contains:

- Observatory
- Library
- all core navigation
- complete spatial map

---

# 217. M8 — Production Art

Contains:

- final hero artefacts
- final environment art
- sound
- optimized VFX

---

# 218. M9 — Hardening

Contains:

- security
- performance
- accessibility
- platform work

---

# 219. M10 — Preview

Contains:

- controlled external testing
- feedback
- release documentation
- known limitations

---

# 220. Final Roadmap Principle

The entire project should follow this sequence of confidence:

> **First prove Bitcoin correctness.  
> Then prove architectural separation.  
> Then prove the world can genuinely function as the interface.  
> Then prove one complete custody journey.  
> Then expand the facility.  
> Then invest in final realism.  
> Then harden it as serious Bitcoin software.**

Core Vault should not be built like a website where all screens are mocked up first and wired together later.

It should be built more like a serious interactive system:

one complete mechanism at a time.

The visual ambition is high.

The Bitcoin responsibility is higher.

The roadmap exists to make sure neither destroys the other.