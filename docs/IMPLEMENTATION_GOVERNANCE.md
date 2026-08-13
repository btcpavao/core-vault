# Core Vault — Implementation Governance

**Status:** Active Development Operating Policy  
**Purpose:** Define the mandatory execution protocol for every implementation task after the Current Implementation Audit.

**Authoritative prerequisites:**

- `docs/01_VISION_AND_PHILOSOPHY.md`
- `docs/02_DESIGN_PRINCIPLES.md`
- `docs/03_TECHNICAL_ARCHITECTURE.md`
- `docs/04_WORLD_BIBLE.md`
- `docs/05_ROOM_DESIGN.md`
- `docs/06_INTERACTION_DESIGN.md`
- `docs/07_BITCOIN_CORE_INTEGRATION.md`
- `docs/08_ART_DIRECTION.md`
- `docs/09_IMPLEMENTATION_ROADMAP.md`
- `docs/10_CODEX_RULES.md`
- `docs/CURRENT_IMPLEMENTATION_AUDIT.md`

This document does not replace any foundational specification.

It defines **how implementation work proceeds from this point onward**.

---

# 1. Current Project Position

The Current Implementation Audit establishes the repository at:

**Phase 1 — Current Implementation Audit complete.**

The project contains a valuable existing foundation including:

- Tauri/Rust privileged boundary
- local Bitcoin Core JSON-RPC
- cookie authentication
- encrypted Personal Vault creation
- Bitcoin Core-native backup/restore approach
- PSBT-first Personal Vault spend flow
- public 2-of-3 descriptor logic
- explicit Personal Vault broadcast confirmation

These elements must be preserved unless later evidence proves that a specific part requires replacement.

The application is **not yet ready for major immersive-renderer migration** until the next domain-evidence requirements are satisfied.

---

# 2. Core Development Principle

Every future task follows:

> **Evidence before refactor.  
> Domain before presentation.  
> Correctness before immersion.  
> One coherent change at a time.**

Core Vault must never again attempt a broad implementation leap without first proving the underlying layer.

---

# 3. One Task at a Time

Each Codex implementation prompt must define exactly one coherent objective.

Good examples:

- build Regtest recovery harness
- type `getblockchaininfo` response
- harden backup path authority
- make `testmempoolaccept` fail closed
- create Visual State Adapter interface
- add R3F experience shell
- build Engine Room greybox
- connect Reactor to real NodeStatus

Bad examples:

> “Implement Phase 2.”

Bad:

> “Build the new Core Vault UI.”

Bad:

> “Make everything match the specification.”

Large milestones must be decomposed.

---

# 4. Task Scope Must Be Locked Before Editing

Every implementation task begins with a written scope containing:

## Goal

What exact problem is being solved?

## Allowed changes

Which modules may reasonably change?

## Protected areas

Which code or behavior must not change?

## Required evidence

Which tests or observations must prove completion?

## Explicit non-goals

What is intentionally not part of this task?

Codex must not expand the scope opportunistically.

---

# 5. Mandatory Pre-Task Inspection

Before editing code, Codex must:

1. read the relevant specification documents
2. read `CURRENT_IMPLEMENTATION_AUDIT.md`
3. inspect relevant existing implementation
4. inspect current tests
5. inspect Git status
6. identify existing behavior that must be preserved

No implementation begins from assumptions in a prompt alone.

---

# 6. Required Pre-Task Git Check

Before modification:

```bash
git status
git branch --show-current
git log --oneline --decorate -10
```

Codex must identify:

- current branch
- existing uncommitted work
- unrelated local files
- whether the repository is synchronized

No unrelated user work may be overwritten.

---

# 7. Protected Existing Foundation

Until explicitly replaced after testing, preserve:

- Tauri as the desktop host
- Rust as the privileged Bitcoin/Core boundary
- loopback-only Bitcoin Core transport
- cookie authentication remaining in Rust
- domain-specific Tauri commands
- encrypted Personal Vault creation through Core
- `backupwallet`
- `restorewallet`
- current public descriptor-validation helpers
- raw PSBT confinement to privileged Rust memory where appropriate
- explicit Personal Vault broadcast confirmation

A new renderer does not justify rewriting these systems.

---

# 8. Existing UI Is Temporarily a Reference and Fallback

The current DOM/CSS experience is not the target renderer.

However, it may temporarily remain useful as:

- functional reference
- regression comparison
- fallback interface
- access to still-unmigrated features

Do not delete it before equivalent new functionality exists and passes its required tests.

---

# 9. No Major 3D Rewrite Yet

Do not begin the immersive rendering migration until the initial Phase 2 evidence gate is satisfied.

The first priority is establishing confidence in the Bitcoin/domain foundation.

Three.js and React Three Fiber are not the immediate next implementation task.

They come after the required recovery proof and initial boundary hardening.

---

# 10. First Evidence Gate — Regtest

The first implementation milestone after this document is:

> **Create a reproducible Bitcoin Core Regtest integration harness.**

It must allow controlled testing without touching:

- Mainnet wallets
- real funds
- the user's normal Bitcoin Core datadir

The harness must use a temporary isolated Regtest environment.

---

# 11. First Golden Test — Personal Vault Recovery

The first golden integration test must prove:

1. start isolated Regtest Bitcoin Core
2. connect through the existing Rust/Core boundary
3. create encrypted Personal Vault
4. confirm wallet is encrypted
5. confirm wallet is locked
6. generate address
7. fund the wallet using Regtest
8. mine confirmation
9. create wallet backup using `backupwallet`
10. verify backup file exists
11. restore under a unique wallet identity using `restorewallet`
12. compare canonical public wallet identity
13. verify address ownership
14. verify recovered balance/history as appropriate
15. prove restored wallet can perform expected signing behavior
16. unload restored test copy
17. preserve original wallet
18. clean only temporary Regtest state

This test must use real Bitcoin Core behavior.

No mocks may substitute for the golden recovery proof.

---

# 12. Why Recovery Comes First

Backup is not proven merely because `backupwallet` produced a file.

The product must prove:

> **the file can recover the Vault.**

This test simultaneously exercises:

- Core RPC transport
- authentication
- wallet endpoints
- encrypted wallet creation
- filesystem handling
- backup
- restore
- descriptor identity
- wallet lifecycle
- cleanup

It provides a safety net before deeper refactors.

---

# 13. Evidence Gate Before Refactor

A subsystem should not be heavily refactored until at least one meaningful behavioral test protects its intended behavior.

Examples:

Before rewriting backup:

- golden recovery test exists

Before rewriting multisig:

- golden 2-of-3 Regtest test exists

Before changing transaction architecture:

- golden Personal Vault spend test exists

Before changing signing:

- signing/relock failure behavior is tested

---

# 14. Security Findings Become Planned Work, Not Random Work

The audit identified several issues.

They must be fixed deliberately, one by one.

Initial security-hardening backlog:

1. renderer-controlled absolute-path authority
2. legacy relock failure handling
3. temporary unencrypted legacy signer creation
4. fail-open unknown `testmempoolaccept` state
5. combined legacy finalize/broadcast boundary
6. passphrase persistence in DOM after failed operation
7. unnecessary renderer exposure of sensitive operational metadata
8. Mainnet mutation-policy ambiguity
9. global 12-second RPC timeout
10. workflow-state cleanup

Do not attempt all ten in one commit.

---

# 15. Security Severity Does Not Automatically Define Implementation Order

Critical/high-risk findings normally receive priority.

However, sequencing may require a supporting test harness first.

For example:

before significantly changing recovery logic, first establish the Regtest recovery test that proves behavior.

Security work should be evidence-driven.

---

# 16. Passphrase Rule

Any task touching passphrases must maintain:

- no persistence
- no logging
- no application metadata
- no localStorage
- no global React state
- shortest practical lifetime
- cleanup on success
- cleanup on failure
- wallet relock after temporary signing unlock

Failure paths must be tested.

---

# 17. Bitcoin Mutation Rule

Every operation that mutates Bitcoin Core state must define:

- precondition
- exact Core RPC
- success result
- failure result
- retry safety
- restart behavior
- user-intent boundary

Examples:

- create wallet
- backup
- restore
- sign
- finalization
- broadcast
- network toggle

---

# 18. Fail Closed

Security-sensitive ambiguity must block progression.

Examples:

Unknown `testmempoolaccept` result:

> do not broadcast

Unknown chain:

> do not mutate

Unknown active wallet:

> do not sign

Unexpected PSBT mutation:

> invalidate review and stop

Unknown signer attribution:

> do not claim a specific Key signed

---

# 19. Broadcast Boundary Is Sacred

The transaction lifecycle remains:

```text
proposal
→ review
→ signing
→ threshold reached
→ finalization
→ mempool preflight
→ explicit user broadcast approval
→ broadcast
```

No refactor may silently collapse these stages.

---

# 20. Multisig Must Not Be Rewritten Before It Is Proven

Existing `wsh(sortedmulti(2,...))` descriptor-validation helpers are valuable.

Before significant multisig redesign, create a golden Regtest proof.

The golden 2-of-3 test must eventually prove:

1. three encrypted independent signer wallets
2. private-key-disabled coordinator
3. correct receive/change descriptors
4. funding
5. immutable proposal
6. signer A produces one valid signature
7. one signature is insufficient
8. signer B produces second valid signature
9. duplicate signer cannot advance threshold
10. finalization
11. preflight
12. explicit broadcast
13. confirmation
14. coordinator recovery
15. signer recovery

Until then, current multisig is considered:

**KEEP BUT HARDEN / NOT YET PRODUCTION-PROVEN**

---

# 21. Offline Signer Is a First-Class Future Flow

The architecture must preserve the ability to run:

```text
Bitcoin Core
+
Core Vault
```

on a network-isolated/offline signing computer.

That installation should support:

- local Core wallet
- PSBT import
- exact transaction review
- signing
- PSBT export

without requiring P2P networking or chain synchronization at signing time when the PSBT contains the required information.

Do not couple future Core Vault functionality to mandatory internet connectivity.

---

# 22. Mainnet Policy

Development should default to:

- Regtest
- Signet where useful

Mainnet mutation must remain deliberately constrained until later hardening.

No automated implementation task may:

- create Mainnet wallet state
- broadcast Mainnet transactions
- modify user funds

for testing.

---

# 23. Renderer Migration Gate

The immersive renderer phase begins only after:

- Regtest harness exists
- Personal Vault recovery golden test passes
- fundamental Core boundary is sufficiently understood
- immediate critical/high security boundary is under control

Then the rendering migration begins.

---

# 24. Renderer Migration Begins With Architecture Proof

The first renderer implementation does **not** build all rooms.

It creates:

> **one proof-of-architecture Engine Room.**

That proof must include:

- real Three.js/R3F scene
- actual perspective camera
- real geometry
- realistic lighting capability
- semantic interactive Reactor
- contextual DOM precision panel
- keyboard accessibility
- Reduced Motion
- Visual State Adapter
- real NodeStatus driving Reactor state

---

# 25. Why Engine Room Comes First

The Engine Room proves all essential experience concepts at once:

- scene
- camera
- object
- interaction
- domain state
- visual state
- animation
- contextual UI
- accessibility
- performance

If Engine Room cannot satisfy the vision, do not build seven more rooms.

Fix the architecture first.

---

# 26. No Final Art in Initial Engine Room Proof

The first Engine Room may use:

- primitives
- simple materials
- placeholder Reactor geometry

provided it proves:

- space
- depth
- camera
- state
- interaction

Do not spend large time producing final photorealistic assets before architecture succeeds.

---

# 27. Human Review Gate After Engine Room

Once the Engine Room proof exists:

STOP.

The user reviews:

- spatial feeling
- camera
- interaction
- performance
- whether it actually feels like being inside the environment

Do not automatically continue into Main Hall.

---

# 28. Main Hall Comes After Renderer Approval

Once the world architecture is approved:

build Main Hall.

Main Hall proves:

- spatial orientation
- navigation
- persistent Vault representation
- connected world feeling

Then Workshop.

Then the Personal Vault vertical slice.

---

# 29. Functional Vertical Slices

Core Vault is built using complete vertical slices.

Example Personal Vault slice:

```text
Main Hall
→ Workshop
→ Personal Vault creation
→ Vault appears
→ Archive backup
→ Vault Chamber
→ Receive
→ Communications
→ Send
→ Sign
→ Broadcast
```

Every slice includes both:

- Bitcoin behavior
- world interaction

---

# 30. No Feature Exists Only Visually

A feature is not implemented because:

- a room contains an object
- a button exists
- an animation works

A functional object must connect to real domain behavior.

---

# 31. No Domain Feature Needs Final Art to Be Valid

Conversely:

Bitcoin functionality can become proven while the related object is still greybox.

Keep these separate:

```text
Domain complete
Interaction complete
Accessibility complete
Final art pending
```

This is a valid milestone.

---

# 32. Mandatory Task Template

Every future implementation prompt should contain:

## TASK

One objective.

## READ FIRST

Relevant specs.

## CURRENT EVIDENCE

What audit/tests already prove.

## PRESERVE

What must not change.

## IMPLEMENT

Exact requested work.

## DO NOT

Explicit non-goals.

## TEST

Required automated/manual evidence.

## GIT

Expected scope and commit.

## STOP CONDITION

Where Codex must stop.

This format becomes standard.

---

# 33. Mandatory Completion Report

Every Codex implementation task must report:

### Implemented
Exactly what changed.

### Preserved
Important behavior intentionally untouched.

### Changed files
Significant files only.

### Tests run
Exact commands.

### Results
Pass/fail/not run.

### Security impact
Any change to privileged boundaries.

### Specification deviations
None, or explicitly listed.

### Known limitations
What remains.

### Git
Commit hash and push status if applicable.

### Next recommended task
One task only.

---

# 34. No “Everything Works” Claims

Codex must never use vague completion language without evidence.

Instead of:

> Everything works.

Use:

```text
npm run verify — PASS
cargo integration recovery test — PASS
macOS Tauri build — PASS
Windows runtime — NOT TESTED
```

---

# 35. No Automatic Next Task

When one implementation task finishes:

STOP.

Do not continue automatically.

The user and project reviewer decide the next task.

This prevents cascading uncontrolled changes.

---

# 36. Git Checkpoints

Each coherent successful task should normally produce one reviewable commit.

Examples:

```text
test: add isolated Core regtest harness

test: prove personal vault recovery on regtest

fix: fail closed on mempool preflight

refactor: introduce typed node status adapter

feat: add real-time experience shell

feat: add Engine Room reactor prototype
```

Do not combine multiple milestones in one commit.

---

# 37. No Force Push

Never use:

```bash
git push --force
git push --force-with-lease
```

during ordinary project development.

---

# 38. Documentation Is Updated When Reality Changes

Implementation may reveal that a specification assumption needs revision.

When that occurs:

1. report specification conflict
2. explain technical evidence
3. propose documentation change
4. obtain approval
5. update spec
6. implement according to revised specification

Do not simply ignore the document.

---

# 39. Foundational Vision Is Hard to Change

The following require explicit product-level approval:

- abandoning Bitcoin Core as source of truth
- abandoning local-first architecture
- replacing spatial world with conventional dashboard
- introducing cloud custody/backend
- changing desktop-first strategy
- replacing controlled spatial navigation with game-character movement
- changing privacy model
- introducing telemetry
- changing key/security model

These are not implementation details.

---

# 40. Non-Foundational Technical Decisions May Evolve

The following may change when justified by evidence:

- exact React component layout
- internal Rust module names
- state-machine library
- shader implementation
- GLB loader
- specific Three.js helper
- asset optimization strategy

The architecture serves the vision.

It is not frozen merely for consistency.

---

# 41. Lightweight Runtime Is a Requirement

Core Vault should remain practical on ordinary desktop hardware, including machines in the class of:

- Apple Silicon MacBook Air
- modern integrated-GPU laptops
- ordinary Windows/Linux desktops

The real-time environment must not assume gaming-class hardware.

Performance decisions must therefore favor:

- controlled room size
- optimized models
- compressed textures
- limited dynamic lights
- restrained particles
- efficient shaders
- scene preloading
- pause/reduction when unfocused

---

# 42. Bitcoin Core and Renderer Performance Are Independent

A frame-rate reduction must never reduce:

- Bitcoin validation
- transaction review accuracy
- signing correctness
- Core RPC correctness

Graphics quality scales independently.

---

# 43. Open-Source Auditability Is a Design Goal

Core Vault should remain easy to inspect.

Security-sensitive code should favor:

- small interfaces
- explicit privilege boundaries
- readable Rust
- typed DTOs
- minimal secret flow
- no hidden cloud behavior

Complexity must justify itself.

---

# 44. No Secret External Behavior

Before adding any external network dependency, explicitly document:

- destination
- purpose
- data transmitted
- privacy impact
- whether optional

The default architecture should continue to communicate only with local Bitcoin Core.

---

# 45. Development Expansion Comes After Core Vault Foundation

Future extensions may eventually include:

- advanced multisig
- Taproot policies
- timelocks
- inheritance
- hardware signers
- Lightning
- mining/network visualization
- additional Bitcoin observability systems

But these are new wings of the same facility.

They do not change the immediate implementation order.

---

# 46. Expansion Architecture Rule

Future systems should be added as modules connected to stable Core Vault foundations.

Example:

```text
Core Vault Foundation
├── Bitcoin Core / Wallets
├── Vault Security
├── Network Observatory
├── Future Lightning Wing
└── Future Mining Observatory
```

Do not couple future extensions tightly into core wallet security code.

---

# 47. Long-Term Goal Is Broad, Immediate Scope Is Narrow

Long-term:

> Core Vault may become a broad visual operating environment for Bitcoin infrastructure.

Immediate implementation:

> prove recovery, harden boundaries, prove immersive renderer, build one safe flow at a time.

Both statements can be true simultaneously.

---

# 48. Quality Gate

A task is complete only if applicable dimensions are satisfied:

```text
Bitcoin correctness
Security
Tests
Error handling
User intent
Accessibility
Performance
Spatial coherence
Documentation
```

Not every task touches every dimension.

But every touched dimension must be considered.

---

# 49. Stop Conditions

Codex must stop and ask rather than guess if it encounters:

- ambiguous security behavior
- unclear Mainnet consequences
- specification conflict
- unexpected destructive operation
- unknown Git conflict
- surprising wallet architecture
- unverified private material exposure
- a requirement that would fundamentally change product vision

---

# 50. Current Immediate Sequence

From the present repository state, the planned sequence is:

```text
1. Implementation Governance
2. Isolated Regtest harness
3. Golden Personal Vault recovery test
4. Review findings
5. Fix immediate security/domain boundary issues one by one
6. Golden Personal Vault transaction test
7. Golden 2-of-3 test foundation
8. Real-time experience shell
9. Engine Room proof of architecture
10. Human visual/interaction review
11. Main Hall
12. Workshop
13. Personal Vault immersive vertical slice
14. Archive
15. Communications
16. Hardened multisig experience
17. Observatory
18. Library
19. Production art
20. Broader Bitcoin functionality
```

This sequence may evolve based on evidence.

It must not be silently skipped.

---

# 51. The Very Next Coding Task

After this governance document is committed, the next Codex implementation task is:

> **Implement a reproducible isolated Bitcoin Core Regtest integration harness and use it to create the first golden Personal Vault recovery integration test.**

Do not begin renderer work before this test is complete and reviewed.

---

# 52. Final Governance Principle

The operating discipline of Core Vault is:

> **Never build on an assumption when we can build on evidence.**

And:

> **Never expand the world faster than we can preserve the correctness underneath it.**

The project should move deliberately:

small task,

real implementation,

real test,

review,

commit,

then the next task.

That process is intentionally slower than asking an AI agent to “build the whole thing.”

It is also how Core Vault can eventually become both:

**a remarkable interactive Bitcoin environment**

and

**software that deserves serious trust.**