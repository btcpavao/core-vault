# Core Vault — Codex Rules

**Document:** 10 / AI Development Operating Rules  
**Status:** Foundational AI Development Policy  
**Depends on:**
- `01_VISION_AND_PHILOSOPHY.md`
- `02_DESIGN_PRINCIPLES.md`
- `03_TECHNICAL_ARCHITECTURE.md`
- `04_WORLD_BIBLE.md`
- `05_ROOM_DESIGN.md`
- `06_INTERACTION_DESIGN.md`
- `07_BITCOIN_CORE_INTEGRATION.md`
- `08_ART_DIRECTION.md`
- `09_IMPLEMENTATION_ROADMAP.md`

**Applies to:** Codex, AI-assisted development, repository modification, architectural decisions, implementation tasks, refactoring, testing, Git operations, documentation changes, Bitcoin Core integration, 3D implementation, visual work, security-sensitive code, and all future automated coding work on Core Vault.

---

# 1. Purpose of This Document

This document defines how Codex must operate while working on Core Vault.

The previous nine documents define:

- what Core Vault is
- how it should behave
- how it should look
- how it should interact with Bitcoin Core
- how implementation should progress

This document defines:

> **how an AI coding agent is allowed to modify the project.**

The purpose is to prevent:

- convenience-driven architectural drift
- accidental destruction of working Bitcoin functionality
- visual regression into conventional web UI
- uncontrolled dependency changes
- security-sensitive shortcuts
- giant unreviewable modifications
- silent reinterpretation of foundational specifications

---

# 2. Core Rule

Before modifying Core Vault, Codex must understand:

> **The specification is part of the codebase.**

The documents under `docs/` are not suggestions or background reading.

They define approved project intent.

Implementation should conform to them.

---

# 3. Specification Hierarchy

When reading the documentation, use this hierarchy:

```text
01_VISION_AND_PHILOSOPHY.md
        ↓
02_DESIGN_PRINCIPLES.md
        ↓
03_TECHNICAL_ARCHITECTURE.md
        ↓
04_WORLD_BIBLE.md
        ↓
05_ROOM_DESIGN.md
        ↓
06_INTERACTION_DESIGN.md
        ↓
07_BITCOIN_CORE_INTEGRATION.md
        ↓
08_ART_DIRECTION.md
        ↓
09_IMPLEMENTATION_ROADMAP.md
        ↓
10_CODEX_RULES.md
```

Earlier documents define broader intent.

Later documents add specificity.

A later document must not silently contradict an earlier foundational requirement.

---

# 4. Mandatory Reading Before Work

Before every substantial implementation task, Codex must read:

```text
docs/01_VISION_AND_PHILOSOPHY.md
docs/02_DESIGN_PRINCIPLES.md
docs/03_TECHNICAL_ARCHITECTURE.md
docs/10_CODEX_RULES.md
```

Then read all task-specific relevant documents.

Examples follow.

---

# 5. Before Bitcoin Core Work

Read:

```text
03_TECHNICAL_ARCHITECTURE.md
07_BITCOIN_CORE_INTEGRATION.md
09_IMPLEMENTATION_ROADMAP.md
10_CODEX_RULES.md
```

---

# 6. Before Room Work

Read:

```text
01_VISION_AND_PHILOSOPHY.md
02_DESIGN_PRINCIPLES.md
03_TECHNICAL_ARCHITECTURE.md
04_WORLD_BIBLE.md
05_ROOM_DESIGN.md
06_INTERACTION_DESIGN.md
08_ART_DIRECTION.md
09_IMPLEMENTATION_ROADMAP.md
10_CODEX_RULES.md
```

---

# 7. Before Art or Renderer Work

Read:

```text
02_DESIGN_PRINCIPLES.md
03_TECHNICAL_ARCHITECTURE.md
04_WORLD_BIBLE.md
05_ROOM_DESIGN.md
06_INTERACTION_DESIGN.md
08_ART_DIRECTION.md
10_CODEX_RULES.md
```

---

# 8. Before Transaction or Signing Work

Read:

```text
02_DESIGN_PRINCIPLES.md
03_TECHNICAL_ARCHITECTURE.md
06_INTERACTION_DESIGN.md
07_BITCOIN_CORE_INTEGRATION.md
09_IMPLEMENTATION_ROADMAP.md
10_CODEX_RULES.md
```

---

# 9. Before Changing Existing Architecture

Read all ten foundational documents.

Architectural modifications have a wider impact than feature implementation.

---

# 10. Do Not Rely on Conversation Memory

If the repository contains the approved specification, the repository is authoritative.

Do not rely on:

- prior chat memory
- assumptions from an older prompt
- implementation choices from previous iterations
- visual experiments that contradict current documents

Always re-read relevant documentation.

---

# 11. Inspect Before Editing

Every task must begin with repository inspection.

Before writing code, inspect:

- relevant files
- existing architecture
- current implementation
- tests
- package configuration
- dependencies
- Git status

Never assume the repository structure described in a prompt is still exact.

---

# 12. Check Git State First

Before substantial changes, run or inspect equivalent information for:

```text
git status
git branch --show-current
git log -n 5 --oneline
```

If the working tree contains unrelated user changes:

do not overwrite them.

---

# 13. Never Destroy Uncommitted User Work

Do not use destructive commands such as:

```text
git reset --hard
git clean -fd
git checkout -- .
```

unless the user explicitly requests that exact destructive action and understands the consequence.

---

# 14. Do Not Revert Work You Did Not Create

If an unrelated file is modified:

leave it alone unless the current task specifically requires it.

Do not “clean up” the repository automatically.

---

# 15. Scope Discipline

Every Codex task should have a clear scope.

If asked to implement:

> Engine Room Reactor state

do not additionally:

- redesign Archive
- replace state-management library
- rewrite multisig
- upgrade Electron
- change every CSS file
- rename half the repository

---

# 16. No Opportunistic Refactoring

Do not refactor unrelated code merely because it appears imperfect.

A refactor must serve the task or an explicitly approved architectural requirement.

---

# 17. Preserve Working Bitcoin Functionality

Existing working Bitcoin Core functionality is valuable.

Before replacing it:

1. understand it
2. test it
3. document current behavior
4. prove the replacement
5. only then remove old code

---

# 18. Never Rewrite Bitcoin Logic for Aesthetic Reasons

Changing:

- wallet structure
- descriptors
- signing
- backup
- transaction construction
- network behavior

is not justified merely because a new visual experience is being built.

Presentation should adapt to proven domain behavior.

---

# 19. Bitcoin Correctness Has Highest Priority

If a visual requirement conflicts with Bitcoin correctness:

Bitcoin correctness wins.

If an immersive interaction conflicts with transaction-review clarity:

transaction-review clarity wins.

---

# 20. Priority Order

When tradeoffs exist:

```text
1. Bitcoin correctness
2. Security
3. User control
4. Data integrity
5. Comprehension
6. Accessibility
7. Operational reliability
8. Performance
9. Spatial experience
10. Visual polish
```

This order is intentional.

---

# 21. Do Not Invent Bitcoin Behavior

When unsure how Bitcoin Core behaves:

stop and consult official Bitcoin Core sources.

Do not guess.

---

# 22. Official Bitcoin Sources

Prefer:

- Bitcoin Core RPC documentation
- Bitcoin Core source code
- Bitcoin Core repository documentation
- release notes
- functional tests

Do not use random secondary tutorials as authoritative implementation specifications.

---

# 23. Never Implement a Raw Bitcoin Primitive Without Need

Do not implement:

- private-key generation
- transaction signing
- descriptor checksum
- Bitcoin script evaluation
- wallet encryption

independently when Bitcoin Core already provides the required functionality.

---

# 24. Bitcoin Core Owns Truth

The application visual state must derive from:

- Core state
- validated application state

not from optimistic UI assumptions.

---

# 25. No Fake Success

Never display success before backend success.

Examples:

Do not:

- seal Backup Capsule before `backupwallet` succeeds
- illuminate Key as signed before signature exists
- show transaction transmitted before broadcast succeeds
- show Reactor synchronized before Core reports the state

---

# 26. Processing Is Not Success

Use explicit intermediate states.

Example:

```text
IDLE
→ PROCESSING
→ SUCCESS
```

or:

```text
IDLE
→ PROCESSING
→ FAILED
```

Do not jump directly to visual completion.

---

# 27. Scenes Do Not Call Raw RPC

Scene components must never call raw Bitcoin Core RPC directly.

Incorrect:

```text
EngineRoom.tsx
→ getblockchaininfo
```

Correct:

```text
EngineRoom
→ VisualNodeState
→ NodeService
→ CoreAdapter
→ RPC
```

---

# 28. Renderer Is Never the Wallet

No Bitcoin custody behavior may depend on:

- frame rate
- shader
- animation
- 3D mesh
- camera state
- scene loading

The experience layer visualizes domain truth.

---

# 29. Renderer Must Not Receive Secrets

Never place:

- RPC cookie
- wallet passphrase
- xprv
- WIF
- private descriptor
- raw private key

into:

- React global state
- R3F state
- scene props
- shader uniforms
- localStorage
- visual debug tools

---

# 30. Passphrase Rules

Wallet passphrases:

- exist only for required operation
- are never persisted
- are never logged
- are never included in error telemetry
- are cleared from frontend state promptly
- never become scene metadata

---

# 31. No Telemetry by Default

Do not add:

- Google Analytics
- Mixpanel
- Sentry uploads
- usage tracking
- session replay
- remote crash uploads
- behavioral analytics

without an explicit future product decision.

---

# 32. No Unexpected External Network Calls

Core Vault should not silently call:

- blockchain explorers
- exchange APIs
- price APIs
- CDN assets
- analytics
- remote fonts
- remote image services

Core Vault is local-first.

---

# 33. No Fiat Price Features

Do not add:

- Bitcoin price
- USD valuation
- EUR valuation
- portfolio graph
- market ticker

unless foundational product direction is explicitly changed.

---

# 34. Do Not Introduce Seed Phrases

Do not add BIP39 seed words as a replacement for Bitcoin Core wallet backup.

Current foundational model is:

```text
Bitcoin Core wallet
+
wallet passphrase
+
Bitcoin Core backup
```

---

# 35. No Arbitrary Raw RPC Console

Do not expose generic raw RPC execution through production UI.

Advanced technical information is welcome.

Arbitrary unrestricted RPC execution is a different security boundary.

---

# 36. No Direct Wallet Database Manipulation

Do not open or modify Core wallet SQLite databases directly.

Do not manipulate:

- chainstate
- wallet DB
- mempool.dat
- peers.dat

to implement ordinary Core Vault functions.

Use supported Bitcoin Core interfaces.

---

# 37. Backup Rule

Wallet backup uses:

```text
backupwallet
```

not direct file copying of an active wallet database.

---

# 38. Restore Rule

Wallet restore uses:

```text
restorewallet
```

not reconstruction of internal wallet storage by Core Vault.

---

# 39. Descriptor Privacy

Treat descriptors as potentially sensitive.

Before putting a descriptor into:

- UI
- logs
- debug output
- fingerprint generation

confirm that only the intended public form is used.

---

# 40. Imported PSBT Is Untrusted Input

Before allowing signing:

- decode
- analyze
- verify network/context
- display outputs
- display fee
- verify associated Vault where possible

Never automatically sign on import.

---

# 41. Signing Does Not Mean Broadcast

Codex must preserve distinct states:

```text
unsigned
partially signed
threshold reached
finalized
ready to broadcast
broadcast
```

Never collapse these for implementation convenience.

---

# 42. Broadcast Is Explicit

Nothing may automatically call `sendrawtransaction` simply because:

- signature threshold is reached
- finalization succeeds
- an animation completes

Broadcast requires a separate explicit user action.

---

# 43. Network Disabled Is Not Air-Gapped

Never label:

```text
networkactive=false
```

as:

```text
Air-gapped
```

unless physical isolation is independently established by the user.

---

# 44. Mainnet Is Not a Development Playground

Destructive development uses:

- Regtest
- possibly Signet for selected manual tests

Do not use real Mainnet wallets for automated mutation.

---

# 45. Regtest First

New wallet, transaction, multisig, backup, and restore flows should first be proven in Regtest.

---

# 46. Tests Before Rewriting Existing Bitcoin Behavior

If changing existing functionality:

first create or run a test proving current intended behavior.

Then modify.

Then run test again.

---

# 47. Do Not Fake Tests

Never claim:

> tests pass

unless they were actually executed successfully.

If a test could not run:

state why.

---

# 48. Do Not Fake Builds

Never claim:

> build succeeded

unless the build actually completed successfully.

---

# 49. Do Not Fake Platform Support

A macOS build does not prove Windows support.

A CI compile does not prove real runtime support.

Report actual tested scope.

---

# 50. Do Not Fake Security

Never claim:

- secure
- audited
- production ready
- safe for significant funds

unless justified.

Use precise language.

---

# 51. No Giant “Implement Everything” Task Internally

Even if the user gives a broad request:

break implementation into coherent steps.

Do not attempt to rewrite the entire product in one uncontrolled pass.

---

# 52. Follow Implementation Roadmap

`09_IMPLEMENTATION_ROADMAP.md` defines sequencing.

Do not jump to:

- final Taproot editor
- inheritance
- final cinematic art
- hardware signers

before foundational milestones are ready.

---

# 53. Initial Migration Sequence

Unless repository audit proves a better reason:

```text
Audit
→ Core boundary
→ Regtest tests
→ Experience shell
→ Engine Room proof
→ Main Hall
→ Workshop
→ Personal Vault
→ Archive
→ Communications
→ Multisig
→ Observatory
→ Library
→ Final art
```

---

# 54. Do Not Build All Rooms at Once

First prove:

- one complete room
- one complete state-driven artefact
- one complete contextual interaction

Then expand.

---

# 55. Engine Room Is the Preferred Architecture Proof

If the project has not yet validated the real-time architecture:

build Engine Room first or justify another choice.

It proves:

- 3D
- Core state
- animation
- semantic mapping
- contextual UI

---

# 56. Greybox Before Final Art

For every new room:

```text
functional requirements
→ spatial blockout
→ interaction
→ camera
→ domain integration
→ usability
→ final modelling
→ materials
→ lighting
→ polish
```

Do not reverse this order.

---

# 57. Final Art Is Expensive

Do not invest substantial time producing final assets before:

- camera
- scale
- interaction
- object position
- flow

are validated.

---

# 58. No Flat Article Art as Final Runtime World

Reference artwork may guide:

- style
- materials
- composition
- lighting

It must not simply become application background.

---

# 59. Do Not Interpret “Reference” as “Reuse”

If a supplied image is described as inspiration:

do not copy it into production unless explicitly instructed.

---

# 60. World Must Be Real-Time Spatial

Do not regress to:

- background image
- HTML card layer
- vector animation overlay

as the primary world.

---

# 61. DOM Is the Precision Layer

HTML/DOM is correct for:

- forms
- Bitcoin addresses
- transaction review
- passphrases
- technical text
- settings
- accessibility

It is not the primary room-rendering system.

---

# 62. The Scene Is Not a Background

A room contains:

- geometry
- camera
- lights
- semantic objects
- materials
- state-driven animation

The scene itself performs interface work.

---

# 63. No Conventional Dashboard as Main Hall

Reject a Main Hall implementation primarily consisting of:

- cards
- balance panels
- sidebar
- grid widgets

even if visually attractive.

---

# 64. No Cards as Primary Workshop

Workshop must not become a series of:

```text
Personal Vault card
Multisig card
Advanced card
```

over a room background.

The build space and artefacts should carry interaction.

---

# 65. No Backup Form as Archive

Archive must not primarily contain:

- file path field
- Backup button
- Restore button

Those controls appear contextually after interaction with Archive objects.

---

# 66. No Node Dashboard as Engine Room

Engine Room's broad status must be readable from the Reactor/environment before opening metrics.

---

# 67. No Analytics Dashboard as Observatory

Observatory is a contemplative data-driven environment.

It is not a set of charts pasted into 3D.

---

# 68. No Gamification

Never add:

- XP
- achievements
- badges
- streaks
- points
- rewards
- collectibles
- unlock progression

unless foundational philosophy changes.

---

# 69. No Fictional Game Language

Do not use language such as:

- sacred
- guardian
- quest
- forge your destiny
- unlock the realm
- relic

The world may feel game-like.

Product language stays grounded.

---

# 70. No NPCs Without Explicit Design Change

Do not introduce:

- AI guide characters
- robots
- bankers
- avatars

because onboarding feels empty.

Guidance should remain environmental/contextual.

---

# 71. Do Not Add WASD Navigation

The product uses curated point-and-click spatial navigation.

Do not implement first-person free roaming unless foundational architecture is explicitly revised.

---

# 72. No Physics Engine Without Need

Do not add physics merely because 3D is being used.

Interactions should generally be deterministic.

---

# 73. Three.js Direction

Current preferred real-time rendering direction is:

- Three.js
- React Three Fiber
- TypeScript

Do not silently migrate to:

- Unity
- Unreal
- Babylon.js
- custom game engine

without explicit architecture review.

---

# 74. Existing Desktop Host Should Be Preserved Initially

If repository already uses:

- Electron
- Tauri

do not migrate solely because the renderer changes.

Evaluate first.

---

# 75. No Framework Rewrite for Taste

Never replace:

- React
- state library
- Electron/Tauri
- build tooling

merely because another framework is preferred.

Architecture changes require concrete project benefit.

---

# 76. Dependency Rule

Before adding a dependency, ask:

- is it necessary?
- can existing code solve it?
- what is bundle impact?
- is it maintained?
- does it expand security surface?

---

# 77. Avoid Duplicate Libraries

Do not add:

- second state-management library
- second 3D engine
- multiple animation frameworks

unless required.

---

# 78. Do Not Update All Dependencies During Feature Work

Dependency upgrades should be separate, reviewable work unless an update is required for the feature.

---

# 79. Asset Licensing

Do not import random online:

- models
- textures
- sounds
- music

without verified licensing.

---

# 80. No Copyright Mimicry

Reference games may inform broad interaction principles.

Do not copy identifiable:

- EVE Online UI
- game music
- sound
- models
- locations
- visual assets

Core Vault requires original expression.

---

# 81. Keep Art Source Separate From Runtime Assets

Maintain clear structure for:

- source Blender assets
- runtime GLB
- source textures
- optimized textures
- concept references

---

# 82. Semantic Asset Names

Never depend on:

```text
Cube.001
Mesh42
```

for application behavior.

Use semantic node names.

---

# 83. Art Replacement Must Not Break Bitcoin Logic

A new Reactor model should plug into the same visual semantic contract.

A new Key model should not require changing signing code.

---

# 84. Accessibility Is Mandatory

Do not mark accessibility as:

> later polish

Every important scene interaction must have:

- semantic equivalent
- keyboard access
- visible focus
- readable state

from its initial implementation.

---

# 85. Reduced Motion Is Mandatory

Every camera/animation system must support Reduced Motion.

Do not postpone this until after all animations exist.

---

# 86. Audio Is Optional

Never make operation dependent on audio.

Every audio cue requires equivalent visible feedback.

---

# 87. Performance Is a Feature

Monitor:

- frame rate
- memory
- draw calls
- texture memory
- CPU usage
- GPU usage
- idle cost

Do not use “photorealistic” as justification for poor desktop behavior.

---

# 88. Pause Expensive Rendering When Appropriate

When app is minimized/unfocused:

reduce:

- particles
- animation
- unnecessary render work

without interrupting active Bitcoin operations.

---

# 89. Avoid Premature Optimization

Measure before making major optimization changes.

But do not knowingly introduce obvious waste.

---

# 90. No One-Object-Per-Mempool-Transaction Design

Use aggregate visualization.

Do not render tens of thousands of transaction objects because it looks conceptually neat.

---

# 91. Contextual UI Must Remain Readable

Do not compromise:

- Bitcoin address readability
- fee readability
- passphrase fields
- transaction outputs

to make the UI appear more “in-world.”

---

# 92. Critical Actions Use Literal Language

Use:

```text
Sign transaction
Broadcast transaction
Create wallet backup
Restore wallet
```

Do not replace critical terminology with metaphor.

---

# 93. No Hidden Critical Data

Never hide:

- amount
- address
- fee
- change
- network
- signature status

behind optional technical panels during confirmation.

---

# 94. Error Copy

Primary error should be human-readable.

Technical details may contain sanitized Core context.

Do not show only raw RPC error.

---

# 95. Preserve Unknown State

If Core Vault does not know:

do not guess.

Use:

```text
Unknown
Checking
Unavailable
```

instead of false certainty.

---

# 96. Fail Closed

If a security-sensitive state is ambiguous:

stop.

Examples:

- unknown chain
- unclear wallet
- incompatible PSBT
- unexpected outputs
- signer identity uncertainty

---

# 97. No Silent Fallback

Do not silently:

- switch wallet
- switch network
- change descriptor
- use different fee strategy
- use remote API

because the preferred path failed.

---

# 98. No Silent Policy Change

A software update must not silently alter an existing Vault's policy.

---

# 99. No Silent Wallet Migration

Do not migrate Core wallets automatically merely because a newer design prefers another structure.

---

# 100. User-Controlled Financial Side Effects

Operations with financial or persistent side effects require clear user intent.

Examples:

- create wallet
- backup
- restore
- sign
- broadcast
- change network state

---

# 101. Read Before Write

Where practical:

query current state before performing a mutation.

Example:

network toggle:

```text
read networkactive
→ user request
→ mutate
→ read networkactive again
```

---

# 102. Re-Read After Mutation

After critical Core changes:

verify confirmed state rather than assuming RPC success means every expected derived state is already available.

---

# 103. Idempotency Awareness

Before retrying a failed mutation:

understand whether retry is safe.

Do not automatically retry:

- wallet creation
- backup
- restore
- broadcast

without reasoning about side effects.

---

# 104. Connection Loss Is Ambiguous

If the RPC connection fails during a mutation:

do not automatically tell the user the mutation failed.

Determine current state after reconnection where possible.

---

# 105. Tests Must Cover Negative Cases

Do not only test successful flows.

Test:

- bad passphrase
- invalid address
- unavailable Core
- wrong network
- failed backup
- incompatible PSBT
- insufficient signatures
- broadcast rejection

---

# 106. Test Domain Without Renderer

Bitcoin Core integration tests should not require 3D rendering.

Domain behavior must remain independently testable.

---

# 107. Test Renderer Without Real Funds

Experience testing can use:

- mock state
- Regtest

Never require real Mainnet funds to visually test a Key animation.

---

# 108. Visual State Tests

Explicitly test mappings such as:

```text
networkActive=false
→ network conduits inactive

signatureProgress=1/2
→ one signed Key

backupComplete=true
→ Capsule sealed
```

---

# 109. Visual Regression Is Useful but Not Sufficient

A screenshot test does not prove interaction.

Also test semantic actions.

---

# 110. Before Calling a Feature Complete

Run relevant:

- formatter
- linter
- type checker
- unit tests
- integration tests
- build

when available.

---

# 111. Report What Was Actually Run

Final Codex output should distinguish:

```text
Passed
Not run
Not available
Failed
```

Do not blur them together.

---

# 112. Fix Errors Caused by the Task

If new code causes:

- type error
- lint error
- test regression
- build failure

fix it before declaring completion where reasonably possible.

---

# 113. Do Not Fix Every Pre-Existing Warning

If unrelated pre-existing warnings exist:

report them.

Do not turn a narrow task into repository-wide cleanup.

---

# 114. Git Diff Review

Before finishing a task:

inspect the diff.

Confirm no unrelated files changed accidentally.

---

# 115. Generated Files

Do not commit:

- temporary screenshots
- build outputs
- random debug files
- secret config
- Core datadirs

unless intentionally part of project.

---

# 116. `.gitignore`

If a new tool generates local artefacts:

update `.gitignore` narrowly where appropriate.

Do not ignore broad source directories.

---

# 117. Do Not Commit Secrets

Before committing, check that no:

- RPC credentials
- cookie
- passphrase
- Mainnet wallet backup
- private key
- private descriptor

was added.

---

# 118. Commit Scope

Prefer one logical commit per coherent feature.

Do not mix unrelated architecture and visual changes.

---

# 119. Commit Messages

Use concise descriptive messages.

Examples:

```text
docs: establish Core Vault specifications

refactor: isolate Bitcoin Core node service

feat: add real-time experience shell

feat: add Engine Room reactor states

test: add regtest backup restore coverage
```

---

# 120. Do Not Force-Push

Never use:

```text
git push --force
```

unless explicitly instructed and understood.

---

# 121. Do Not Rewrite History by Default

Do not:

- rebase public branch
- amend unrelated commits
- squash user work

without instruction.

---

# 122. Push Only When Asked or Authorized

If a task asks for implementation but not remote mutation:

commit behavior should follow project/user instructions.

Never pretend a push occurred.

---

# 123. Foundational Documents Are Protected

Codex must not modify:

```text
01–10 foundational docs
```

merely to make code fit.

---

# 124. When Documentation and Code Conflict

Codex must report:

```text
SPECIFICATION CONFLICT
```

and explain:

- relevant document
- relevant requirement
- current code behavior
- proposed resolution

Do not silently choose convenience.

---

# 125. Documentation Change Requires Explicit Intent

If the user explicitly asks to change the product vision:

update relevant document first or as part of an approved coordinated change.

---

# 126. Do Not “Improve” Copy Outside Scope

Do not rewrite product language across the app while implementing unrelated backend work.

Copy is part of interaction design.

---

# 127. No Generic AI Aesthetic

Avoid default AI-generated visual patterns:

- giant gradient cards
- excessive glassmorphism
- purple-blue gradient everything
- generic dashboard layouts
- glowing border around every panel

Follow Core Vault Art Direction instead.

---

# 128. No Generic Crypto Aesthetic

Do not introduce:

- Bitcoin coins
- rocket imagery
- candlesticks
- green gain numbers
- crypto-token iconography

unless specifically required for technical identity.

---

# 129. No Visual Placeholder Masquerading as Final

If a room uses:

- primitive boxes
- temporary model
- flat procedural material

label it in code/documentation as prototype/placeholder.

Do not report:

> final Engine Room completed

if it is a greybox.

---

# 130. Distinguish Architecture From Final Art

A technically successful room can still be visually unfinished.

Report those separately.

Example:

```text
Architecture: complete
Core integration: complete
Interaction: complete
Final art: placeholder
```

---

# 131. When Asked to “Make It Look Better”

Do not immediately add decorative effects.

First evaluate against:

- World Bible
- Room Design
- Art Direction

The desired improvement may be structural rather than cosmetic.

---

# 132. If It Still Looks Like a Web App, Stop

Before polishing a room, ask:

> If I hide all DOM panels, is there still a functioning spatial environment?

If no:

do not continue styling the web layer.

Fix the scene architecture.

---

# 133. World-as-Interface Acceptance Test

A room should pass:

> The meaningful physical object itself initiates the action.

If the object is decoration beside a generic button:

redesign.

---

# 134. Do Not Over-Diegeticize Critical Precision

Conversely, if precise information becomes difficult to verify because everything was forced into 3D:

move it into contextual DOM UI.

---

# 135. Art Must Serve Interaction

Do not place hero architectural elements where they:

- block click targets
- obscure Vault
- interfere with camera
- hide transaction UI
- complicate accessibility

---

# 136. Object State Contracts

Important artefacts should define semantic state.

Example:

```text
Key:
IDLE
AVAILABLE
SELECTED
SIGNING
SIGNED
ERROR
```

Do not scatter state-specific magic numbers throughout components.

---

# 137. Domain State First

Determine semantic state in application/adapter layers.

Then render.

Do not derive Bitcoin semantics from:

- mesh color
- animation completion
- current frame

---

# 138. Events

Use meaningful domain events.

Example:

```text
NEW_BLOCK
SIGNATURE_ACCEPTED
BACKUP_COMPLETED
CORE_CONNECTED
```

Avoid letting scenes parse arbitrary low-level RPC traffic.

---

# 139. One Core Polling Service

Do not let every room independently poll Bitcoin Core.

Shared services own polling.

Scenes subscribe to normalized state.

---

# 140. Poll Rationally

Do not call expensive RPCs every second without reason.

Especially avoid:

- full mempool retrieval
- detailed peer lists
- wallet history

at excessive frequency.

---

# 141. No External Explorer for Convenience

If building Observatory seems easier with a remote API:

do not quietly add one.

Use local Core data or explicitly document the limitation.

---

# 142. Do Not Confuse User With Internal Names

Internal:

```text
cv_93f24ab
```

may be a Core wallet name.

User sees:

```text
Savings
```

Do not leak implementation identifiers into primary UI.

---

# 143. Do Not Use Display Names as Paths

Sanitize/internalize wallet identifiers.

Never place raw user names directly into sensitive filesystem/RPC paths.

---

# 144. Metadata Must Be Non-Secret

App-owned metadata may store:

- display name
- role
- Vault type
- public fingerprints
- UI preferences

Not:

- passphrase
- private descriptor
- private key

---

# 145. Debugging Must Respect Secrets

Developer console logging must follow the same redaction rules as production logs.

“It's only development” is not permission to print secrets.

---

# 146. Debug Tools Must Be Development-Only

Tools such as:

- room selector
- mock signature button
- trigger new block animation
- force network state

must not be exposed in production mode.

---

# 147. Mock State Must Be Obvious

When mock state is active:

display:

```text
DEMO
```

or equivalent.

Do not let development screenshots be mistaken for live Mainnet state.

---

# 148. Development Mainnet Guard

Prefer Regtest as default development environment.

Connecting development tools to Mainnet should require explicit intent.

---

# 149. No User-Fund Testing by Codex

Codex must never attempt to move real funds in order to validate implementation.

---

# 150. User Data Is Not Test Data

Do not use:

- existing wallet
- existing backup
- existing addresses

as disposable test fixtures.

Create controlled Regtest state.

---

# 151. Cross-Platform Paths

Do not hardcode macOS path behavior into platform-neutral domain logic.

Use platform abstractions.

---

# 152. Renderer Compatibility

Do not assume every target GPU supports the most advanced rendering feature.

Implement graceful degradation.

---

# 153. WebGPU

WebGPU may be explored later.

Do not make it mandatory without broad platform testing.

Three.js WebGL-based functionality remains the safer initial baseline unless architecture changes.

---

# 154. No Experimental Renderer Feature as Security Dependency

Bitcoin action must still function if:

- fancy shader fails
- bloom disabled
- shadow unsupported
- reflection fallback active

---

# 155. Fallback UX

If renderer cannot initialize:

show a minimal safe error interface.

Do not leave a blank window.

---

# 156. Crash Resilience

A visual crash must not automatically:

- lose Core wallet
- corrupt backup
- rebroadcast transaction
- repeat mutation

Separate domain state carefully.

---

# 157. Restart Reconciliation

After application restart:

re-query Core.

Do not blindly assume previous visual state is current truth.

---

# 158. Persistent UI State Is Secondary

Remember:

- last room
- audio preference
- graphics quality

where useful.

Do not let persisted UI state override Core truth.

---

# 159. Never Persist Passphrase Form State

Even if a general form-state system persists fields:

explicitly exclude sensitive values.

---

# 160. Review Architecture Before New Global State

Do not add random global stores for each room.

Shared domain state belongs in established application state.

Room-local ephemeral interaction may remain local.

---

# 161. Avoid Boolean State Explosion

Do not use:

```text
isSigning
isSigned
isComplete
isFinalized
isBroadcast
isError
```

when an explicit state machine better represents mutually exclusive states.

---

# 162. Comments Explain Why

Comments should primarily explain:

- non-obvious security reason
- Core behavior
- architectural constraint
- semantic mapping

Do not comment obvious syntax.

---

# 163. No TODO Without Context

A TODO should identify:

- what remains
- why
- relevant specification or issue

Not:

```text
TODO fix this later
```

---

# 164. Document Known Limitations

If an implementation intentionally lacks something:

report it.

Do not hide incompleteness behind polished UI.

---

# 165. No Fake Disabled Features

If a future room/artefact appears in the world but does not function:

make that clearly intentional.

Do not leave controls that click and do nothing.

---

# 166. Feature Flags

Experimental functionality should use explicit development/feature flags where appropriate.

Never expose incomplete Mainnet functionality accidentally.

---

# 167. Taproot Rule

Do not implement general Taproot policy builder until roadmap reaches that phase and policy semantics have dedicated tests/review.

---

# 168. Timelock Rule

Do not make Time Mechanism functional before real corresponding Bitcoin policy is implemented.

---

# 169. Visual Capability Is Not Bitcoin Capability

The fact that UI can represent:

```text
5 Keys
3 required
2 recovery branches
```

does not mean the backend supports it safely.

Do not expose visual configuration ahead of domain support.

---

# 170. Room Addition Rule

Before adding a new room:

define:

- purpose
- semantic objects
- required domain data
- camera
- interaction
- accessibility
- performance expectations

according to existing room specification.

---

# 171. Do Not Create Rooms for Settings

Not every software function needs a physical room.

Settings, About, and certain utilities may remain conventional panels.

---

# 172. Avoid Spatial Metaphor Overreach

If a feature has no meaningful physical representation:

do not invent one merely to preserve theme.

Use contextual interface.

---

# 173. User Clarity Beats Cleverness

If an interaction is visually clever but users may misunderstand:

choose clarity.

---

# 174. Main Hall Must Not Accumulate Every Shortcut

As features grow, resist turning Main Hall into:

- launcher
- metrics panel
- shortcut wall

Spatial hierarchy must remain calm.

---

# 175. Observatory Must Remain Non-Transactional

Do not gradually add:

- Send
- Backup
- Wallet Settings

to Observatory because there is spare screen space.

---

# 176. Archive Must Remain Recovery-Focused

Do not turn Archive into generic file manager.

---

# 177. Engine Room Must Remain Node-Focused

Do not put wallet configuration inside Engine Room just because Core owns wallets.

Room semantics are product semantics, not RPC grouping.

---

# 178. Library Must Remain Optional

Do not force users through Library content before ordinary safe operations.

---

# 179. Documentation Ownership

If implementation introduces a new architectural concept not covered by documentation:

update or extend the relevant documentation with explicit approval.

Do not leave architecture undocumented.

---

# 180. Generated Documentation Should Not Replace Human Intent

Codex may draft supporting docs.

It must not autonomously redefine:

- product philosophy
- security promises
- world meaning

---

# 181. Implementation Audit Comes First

After foundational documentation is committed, the first major Codex task should be:

> audit current implementation

not:

> rebuild the application.

Follow `09_IMPLEMENTATION_ROADMAP.md`.

---

# 182. Audit Must Be Observational

During the initial audit:

do not perform major refactoring.

Produce:

```text
docs/CURRENT_IMPLEMENTATION_AUDIT.md
```

with findings.

---

# 183. Audit Must Identify Reusable Code

Explicitly classify:

```text
KEEP
REFACTOR
REPLACE
UNKNOWN
```

for major systems.

---

# 184. Audit Must Identify Existing Visual Dead Ends

Document existing presentation that conflicts with:

- world-as-interface
- real-time renderer
- diegetic object interaction

Do not immediately delete it.

---

# 185. Audit Must Identify Security Issues

If discovered:

report separately and prioritize appropriately.

Do not hide them because the task was “just audit.”

---

# 186. Task Planning

For every implementation task, Codex should briefly state:

```text
Relevant specifications
Files inspected
Existing behavior
Planned changes
Tests to run
```

Then implement.

Do not produce a ten-page plan for a tiny task.

---

# 187. Do Not Stop at Planning When Implementation Was Requested

If the user asks to implement:

inspect, plan briefly, then implement.

Do not respond only with recommendations.

---

# 188. Ask Only When Truly Blocked

Do not ask the user technical questions that can be resolved by inspecting:

- repository
- documentation
- existing code

Ask when there is a genuine product choice or destructive ambiguity.

---

# 189. Do Not Ask User to Choose Low-Level Technology Arbitrarily

The foundational architecture already gives direction.

Do not ask:

> Three.js or React Three Fiber?

when documentation already specifies the preferred architecture.

---

# 190. Surface True Product Decisions

Examples worth asking about:

- changing supported Vault policy
- exposing remote Core
- introducing hardware signer
- changing world layout
- altering foundational aesthetic

---

# 191. Do Not Pretend Something Is Impossible Without Testing

If uncertain whether R3F can achieve a visual/interaction requirement:

build a narrow proof.

Do not immediately downgrade the vision.

---

# 192. Do Not Downgrade Vision to Match Current Code

Existing code is not sacred.

Working Bitcoin logic should be preserved.

Failed presentation architecture may be replaced.

---

# 193. Do Not Upgrade Vision to Technology Demo

Likewise, do not overcomplicate the product just because 3D technology permits it.

No need for:

- physics
- multiplayer
- procedural world generation

unless requirements demand it.

---

# 194. Final Output Structure for Coding Tasks

At completion, report:

```text
Implemented
Changed files
Tests run
Build status
Known limitations
Specification deviations
Recommended next task
```

Keep it factual.

---

# 195. Report Specification Deviations Explicitly

If anything differs from docs, include:

```text
Specification deviation:
...
Reason:
...
```

Never hide it.

---

# 196. Report Placeholder Art

Example:

```text
Engine Room:
interaction complete
real Core state complete
current Reactor model is placeholder geometry
```

This is useful and honest.

---

# 197. Report Tests Precisely

Example:

```text
npm test — passed
npm run typecheck — passed
Regtest multisig integration — not run, bitcoind unavailable
```

Not:

> everything looks good.

---

# 198. Report Files

List significant changed files.

Do not dump every generated cache file.

---

# 199. Recommended Next Task

Codex may recommend one logical next step based on roadmap.

It should not begin that next step automatically unless requested.

---

# 200. Do Not Continue Into Another Milestone Automatically

Completing Engine Room proof does not grant permission to start Workshop.

Stop at the requested scope.

---

# 201. Human Review Gates Matter

The project deliberately includes visual/product review between major milestones.

Do not treat uninterrupted autonomous implementation as inherently preferable.

---

# 202. Never Optimize for Token Completion

If a task is too large:

implement a coherent subset and report remaining work.

Do not create superficial versions of twenty features merely to claim completion.

---

# 203. Quality Over Breadth

One fully functional:

- Engine Room

is better than eight fake rooms.

One working:

- Personal Vault flow

is better than ten visual Vault options without backend support.

---

# 204. Code Quality Standard

New code should aim for:

- clear ownership
- strong typing
- narrow interfaces
- testability
- explicit state
- meaningful names

Avoid overengineering.

---

# 205. Type Safety

Do not use `any` as a shortcut around unclear Core RPC types unless unavoidable and isolated.

Normalize external data at adapter boundaries.

---

# 206. Validate External Data

RPC response types may be typed, but runtime input still comes from an external process.

Validate critical assumptions where appropriate.

---

# 207. Runtime Errors

A malformed or unexpected Core response should become a controlled error.

Do not let it crash an entire scene without recovery.

---

# 208. React Component Responsibility

Scene components should primarily:

- render state
- emit semantic user intent

They should not contain multi-step Bitcoin workflow logic.

---

# 209. Service Responsibility

Domain services coordinate operations.

Example:

```text
TransactionService
```

owns transaction stages.

`CommunicationsScene.tsx` does not.

---

# 210. Visual Adapter Responsibility

Visual adapters translate domain state into:

- Reactor state
- Key state
- Vault state
- Capsule state

They do not execute mutations.

---

# 211. No Circular Architecture

Avoid patterns where:

```text
scene
→ service
→ scene state
→ service
```

through hidden side effects.

Use explicit command/state flow.

---

# 212. Keep Bitcoin Models Distinct From Visual Models

Example:

```text
Bitcoin:
signatureCount = 1
requiredSignatures = 2
```

Visual:

```text
VaultAuthorizationState.PARTIAL
```

The distinction helps art evolve.

---

# 213. Semantic Events Should Be Typed

Avoid magic string event names scattered across files.

Use typed event definitions.

---

# 214. Asset Paths Should Be Centralized

Do not hardcode duplicate paths across room components.

Use asset registry/manifests where useful.

---

# 215. Preload Intelligently

Preload likely next room assets.

Do not load the complete facility at startup simply because it is easier.

---

# 216. Asset Failure

If an asset fails:

show a reasonable fallback.

Do not block Bitcoin operation because one decorative texture is missing.

---

# 217. Empty State Is a Real State

Do not fill empty rooms with mock/demo content in production.

Design emptiness intentionally.

---

# 218. Main Hall With Zero Vaults Must Still Look Complete

Do not hide the entire room behind:

```text
Create your first wallet
```

modal.

---

# 219. No Random Ambient Bitcoin Events

Ambient life may be procedural.

Bitcoin events must come from real data in real mode.

---

# 220. New Block Event Must Be Real

Do not randomly trigger block animation for visual atmosphere.

Use actual domain event.

---

# 221. Signature Animation Must Be Real

No signature animation merely because user clicked Sign.

Wait for actual result.

---

# 222. Balance Never Controls Luxury

Do not change:

- room grandeur
- material richness
- Key beauty
- Vault size

based on balance.

---

# 223. No Attention-Manipulation Mechanics

Do not add:

- blinking “come back” signals
- engagement notifications
- daily activity
- persistent reminders unrelated to safety

---

# 224. Safety Reminders Are Different

Important conditions such as:

- backup required
- Core unavailable
- unverified backup

may remain visible because they affect custody.

---

# 225. Warnings Must Be Truthful

Do not overstate severity.

Do not understate it either.

---

# 226. Unknown Backup Copies

Core Vault cannot know every copy a user has made outside the application.

Do not infer physical redundancy from app metadata.

---

# 227. Security Metaphor Must Not Overpromise

A glowing sealed Vault does not mean:

> malware-proof.

Copy must explain limits where relevant.

---

# 228. Preserve User Agency

Do not automatically:

- broadcast
- change network
- overwrite backup
- delete wallet
- change policy

without clear intent.

---

# 229. No Auto-Overwrite

File and wallet operations should respect conflict detection.

Do not silently replace existing backups.

---

# 230. No Auto-Delete of Core Wallets

Test-restore cleanup must not delete Core wallet directories behind the user's back.

---

# 231. Unload Is Not Delete

Maintain distinction.

---

# 232. No Guessing User Intent From Visual Context

If selecting an object could lead to multiple serious actions:

present clear choices.

Do not infer:

> they clicked Vault, therefore they want to spend.

---

# 233. Interaction Must Remain Discoverable

World-as-interface is not permission for mystery controls.

Use:

- composition
- focus
- labels
- onboarding
- keyboard semantics

---

# 234. Accessibility Fallback Is Not a Second Product

Accessibility representation should expose the same semantic world.

Do not maintain a completely separate simplified product with different behavior.

---

# 235. Localization

New user-facing copy should use the localization architecture when established.

Do not bake English text into important 3D textures unnecessarily.

---

# 236. English as Development Source

Project documentation and primary development identifiers may remain English.

User-facing Croatian and English support follow localization specifications.

---

# 237. Do Not Translate Technical Terms Incorrectly

Terms such as:

- PSBT
- descriptor
- multisig
- Taproot

should use consistent approved translations/explanations.

---

# 238. Naming Consistency

Use established product terms:

```text
Vault
Key
Backup Capsule
Core Reactor
Main Hall
Workshop
Vault Chamber
Archive
Communications
Engine Room
Observatory
Library
```

Do not invent new synonyms casually.

---

# 239. “Wallet” Still Exists Technically

Primary human-facing metaphor may be Vault.

Technical details should still reveal:

> Bitcoin Core wallet.

Do not erase actual Bitcoin terminology.

---

# 240. Codex Does Not Own Product Decisions

Codex implements and may propose.

It does not autonomously redefine the product.

---

# 241. Codex Should Challenge Unsafe Requirements

If a requested change would likely compromise:

- keys
- backup
- transaction review
- network security

Codex should explain the concern before implementation.

---

# 242. Codex Should Not Challenge Purely Because Something Is Unusual

Core Vault intentionally uses an unusual spatial interface.

Do not repeatedly suggest replacing it with a standard dashboard because dashboards are easier.

The spatial experience is a foundational product requirement.

---

# 243. “Simpler” Does Not Always Mean “More Conventional”

A well-designed spatial interaction may be simpler for humans than a configuration form.

Evaluate against product principles, not developer familiarity.

---

# 244. Foundation Documents Can Be Improved Only Deliberately

If later testing reveals a foundational assumption is wrong:

changing the documents is allowed.

But the change must be intentional, explicit, reviewed, and versioned.

---

# 245. Document Changes Before Large Consequences

If a product decision changes:

- renderer
- Vault model
- room topology
- visual style
- Bitcoin architecture

update appropriate spec as part of the decision.

---

# 246. Keep Audit Trail

Git history should make it possible to understand:

- why architecture changed
- when policy changed
- when foundational specifications changed

---

# 247. No Silent Experimental Production Code

Experimental features must be:

- clearly flagged
- isolated
- documented

Do not leave hidden experimental mainnet code paths.

---

# 248. Prefer Removing Dead Experiments Eventually

Once replacement is validated:

remove obsolete visual prototypes rather than accumulating permanent dead architecture.

But only after confirming nothing valuable depends on them.

---

# 249. Legacy UI Removal Gate

Delete legacy presentation only when equivalent immersive workflow:

- exists
- is tested
- is usable
- is accessible

---

# 250. Final Codex Principle

Every time Codex modifies Core Vault, it must remember:

> **This is Bitcoin software first, an interactive environment second, and a visual experience third.**

But the second requirement is still foundational.

Core Vault must not become a standard wallet simply because standard wallets are easier to implement.

The correct implementation discipline is:

> **Read the specification.  
> Inspect the current system.  
> Preserve proven Bitcoin behavior.  
> Change one coherent thing at a time.  
> Test the real behavior.  
> Let application state drive the world.  
> Never fake Bitcoin state.  
> Never hide security-critical truth.  
> Never sacrifice the spatial vision merely for implementation convenience.  
> Report exactly what was done.  
> Stop at the requested scope.**

Bitcoin Core remains the source of Bitcoin truth.

The domain layer protects that truth.

The experience layer makes it tangible.

The specification protects the vision.

And Codex must respect all four.