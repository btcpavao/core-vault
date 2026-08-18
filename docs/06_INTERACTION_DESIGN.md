# Core Vault — Interaction Design

**Document:** 06 / Interaction Specification  
**Status:** Foundational Interaction Specification  
**Depends on:**
- `01_VISION_AND_PHILOSOPHY.md`
- `02_DESIGN_PRINCIPLES.md`
- `03_TECHNICAL_ARCHITECTURE.md`
- `04_WORLD_BIBLE.md`
- `05_ROOM_DESIGN.md`

**Applies to:** Pointer interaction, keyboard interaction, object selection, viewpoint behavior, room navigation, focus states, contextual interfaces, drag-and-drop, transaction review, signing, backup, restore, onboarding, accessibility, error recovery, and interaction feedback.

---

# 1. Purpose of This Document

This document defines how a person interacts with Core Vault.

The previous documents establish:

- what Core Vault is
- what the world looks like
- how the architecture is organized
- what each room means

This document defines:

> **what happens when the user actually does something.**

Core Vault must feel natural enough that users interact with meaningful objects rather than continuously translating their intention into software menu terminology.

---

# 2. Interaction North Star

The primary interaction rule is:

> **Intent should begin in the world. Precision should happen in context.**

Examples:

The user wants to create a vault.

They interact with the Workshop.

They do not begin by opening a generic “Create Wallet” form.

The user wants a backup.

They interact with the Archive capsule.

They do not begin by navigating a File menu.

The user wants to inspect Bitcoin Core.

They interact with the Reactor.

They do not begin on a system metrics dashboard.

---

# 3. Interaction Is Object-Centered

The main unit of interaction is the **semantic object**.

Examples:

- Vault
- Key
- Backup Capsule
- Reactor
- Communications Terminal
- Time Mechanism
- Policy Branch
- Room Exit

Each important object should support a predictable subset of actions.

Conceptually:

```text
Inspect
Focus
Activate
Use
Cancel
Return
```

Not every object requires every action.

---

# 4. No Decorative Fake Interactivity

If an object visually reacts strongly to pointer hover or focus, the user will reasonably assume it does something.

Therefore:

- interactive objects may react
- decorative objects should generally not react like controls

Avoid:

- glowing every object on hover
- cursor changes over meaningless geometry
- decorative machinery behaving like a button

---

# 5. Interaction Hierarchy

Core Vault interaction has four levels.

## Level 1 — Navigate

Move between spaces.

## Level 2 — Inspect

Understand an object or state.

## Level 3 — Configure or Act

Perform a meaningful operation.

## Level 4 — Confirm

Explicitly approve security-sensitive or irreversible actions.

These levels should feel progressively more deliberate.

---

# 6. Pointer Model

Desktop pointer interaction supports:

- hover
- click
- optional drag
- wheel/trackpad where appropriate

Do not require complex game controls.

The mouse should behave much closer to a sophisticated point-and-click environment than a first-person game.

---

# 7. Cursor Behavior

Cursor state may help clarify interaction.

Suggested states:

- default
- inspectable
- actionable
- draggable
- unavailable

Do not create a custom cursor so stylized that standard desktop usability is lost.

The system pointer may remain preferable with restrained custom state.

---

# 8. Hover State

Hover may provide:

- subtle object highlight
- small emissive change
- slight material response
- short label
- cursor change

Hover should not:

- trigger irreversible actions
- move the camera significantly
- open large interfaces automatically
- create strong sound repeatedly

---

# 9. Hover Timing

Avoid instant noisy reactions.

A small visual response may begin immediately.

A label or additional hint may appear after a very short delay.

Repeated movement across multiple objects should not produce constant sound.

---

# 10. Click State

Primary click generally means:

> select or activate the object's most natural action.

Examples:

Vault in Main Hall:
- select/open Vault Chamber

Reactor:
- focus/inspect

Backup Capsule:
- focus/open backup actions

Key in Workshop:
- select key for composition

---

# 11. Double Click

Do not make double-click necessary for core actions.

It is less discoverable and harder for accessibility.

Single click plus clear state is preferred.

---

# 12. Right Click

Right-click should not be required.

Future expert context menus are possible, but core functionality must remain available through normal interaction.

---

# 13. Selection State

When an object is selected:

- it should visibly remain selected
- surrounding competing objects reduce emphasis
- relevant actions become available
- keyboard focus must correspond logically

Selection should not be communicated only by a tiny outline.

---

# 14. Focus Versus Activation

Core Vault should distinguish:

### Focus
“I want to look at this.”

from:

### Activate
“I want to do something with this.”

Example:

Selecting a Key may focus it.

A contextual action may then be:

`Use this key`

This is especially useful for security-sensitive operations.

---

# 15. Primary Actions Should Be Obvious

A user should not need to inspect an object just to discover its only obvious purpose.

For example:

a room exit should navigate immediately.

A backup capsule, however, may first focus because multiple actions may exist:

- Create
- Verify
- Inspect
- Restore

Use judgment based on action ambiguity.

---

# 16. Object Focus

Focusing an object may trigger:

- gentle visual/viewpoint focus
- background de-emphasis
- local lighting response
- contextual label
- contextual UI

Focus must remain short and controlled.

The user should never wait for a dramatic cinematic animation.

---

# 17. Focus Cancellation

The user can leave focus through:

- Escape
- Back action
- clicking the environment outside the active interaction area where safe
- explicit Close
- navigating elsewhere

Security-critical confirmations should require explicit cancellation rather than accidental outside-click dismissal.

---

# 18. Viewpoint Interaction Philosophy

The curated viewpoint is part of the interface, but the user should not need to operate a camera manually.

The system decides useful viewpoints.

The user decides intention.

This distinction is critical.

---

# 19. Default Viewpoint

Each room has a curated default view.

The default view should:

- reveal the room purpose
- reveal important interactive objects
- avoid excessive perspective distortion
- leave safe space for contextual panels

---

# 20. Viewpoint Focus

When focusing an object, the renderer may use push-in, crop/zoom, parallax, depth shift, integrated lighting, safe de-emphasis, or actual camera movement where 3D exists:

- move only as much as needed
- preserve spatial orientation
- avoid rotating behind the user
- avoid disorienting perspective changes

The movement should communicate:

> “I am looking more closely.”

---

# 21. Viewpoint Return

When focus ends:

the viewpoint returns to a known stable state.

Avoid accumulating small arbitrary camera changes over time.

The user should never “lose” the room.

---

# 22. No Free Orbit for Main UX

Do not require:

- click-drag camera orbit
- free panning
- zoom hunting

for normal operation.

A development/debug camera may exist separately.

---

# 23. Optional Inspection Orbit

A future advanced inspection mode may permit small controlled object rotation.

Example:

turning a Key artefact to inspect it.

This must remain optional and never necessary to reach controls.

---

# 24. Navigation

Primary navigation occurs through meaningful spatial destinations.

Examples:

- arch
- corridor
- stairway
- selected vault
- terminal route
- observation balcony

The user clicks the destination or its spatial hotspot.

---

# 25. Navigation Feedback

Before navigation:

- destination should respond on hover/focus
- label may appear
- user understands where it leads

On click:

- input locks briefly
- transition begins
- destination loads
- interaction restores

---

# 26. No Invisible Navigation Zones

Do not create large invisible hotspots over arbitrary parts of the room without visual cues.

Hotspots should correspond to real architecture or meaningful objects.

---

# 27. Fast Navigation for Experienced Users

Spatial navigation is primary.

Experienced users may also use:

- keyboard shortcuts
- command palette
- quick room selector
- recent vault shortcuts

These are accelerators.

They do not replace the world.

---

# 28. Home Action

A global Home action always returns to Main Hall.

It should be:

- accessible
- predictable
- visually restrained

Home must not require navigating backward through every previous scene.

---

# 29. Back Action

Back generally returns to the previous meaningful interaction context.

Examples:

focused Reactor → Engine Room default

Engine Room → previous room

transaction review → transaction setup

Back should not unexpectedly abandon unsaved critical work.

---

# 30. Escape Key

Escape should generally:

1. close non-critical tooltip
2. close contextual panel
3. exit object focus
4. cancel room interaction when safe

It should not:

- broadcast a transaction
- silently discard critical data
- close the entire application during a sensitive operation without warning

---

# 31. Contextual Panels

Contextual panels are the bridge between world and precise software control.

They should appear only when required.

Examples:

- name vault
- enter passphrase
- select backup location
- enter address
- review fee
- inspect technical detail

---

# 32. Panel Origin

Whenever possible, panel appearance should visually originate near the relevant object.

Examples:

Key technical information appears beside Key.

Reactor metrics appear beside Reactor.

Backup location information appears beside Capsule.

This reinforces semantic context.

---

# 33. Panel Position

Contextual panels should avoid obscuring the object they describe.

Preferred patterns:

- side overlay
- anchored floating pane
- partial lower overlay

Avoid:

- full-screen takeover for simple actions
- arbitrary central modal for every task

---

# 34. Full-Screen Secure Review

A near-full-screen contextual interface is acceptable for:

- transaction review
- critical restore confirmation
- policy confirmation
- high-consequence warnings

In these moments, precision intentionally overrides environmental immersion.

---

# 35. Panel Visual Language

Panels should feel part of Core Vault through:

- material
- spacing
- typography
- restrained translucency
- bronze/stone/glass cues

But text clarity must always take priority.

Do not over-style text input fields.

---

# 36. Form Density

Do not display more fields than are required for the current step.

Prefer staged interactions.

Example Vault creation:

Step 1:
- choose structure

Step 2:
- name vault

Step 3:
- set passphrase

Step 4:
- backup

Not a ten-field form.

---

# 37. One Primary Decision at a Time

Where possible, each interaction state should present one dominant decision.

This reduces accidental configuration.

Example:

`Create Personal Vault`

then:

`Name this vault`

then:

`Protect this wallet`

rather than showing every future option simultaneously.

---

# 38. Smart Defaults

Safe defaults should eliminate unnecessary decisions.

Users should not normally be asked to choose:

- address script type
- RPC method
- PSBT version
- derivation path
- descriptor checksum
- change type

unless they enter an advanced mode where choice is meaningful.

---

# 39. Drag-and-Drop Philosophy

Drag-and-drop may reinforce physical composition, especially in Workshop.

But it must never be mandatory.

Every draggable action needs a click/keyboard equivalent.

---

# 40. Workshop Drag Interaction

Example:

user drags Key toward Vault authorization slot.

During drag:

- valid destination responds
- invalid areas remain neutral
- object follows smoothly
- object does not wobble excessively

On valid drop:

- Key seats into semantic position

On invalid drop:

- Key returns calmly

No comic bouncing.

---

# 41. Click Alternative to Drag

A user may:

1. select Key
2. select Vault authorization slot

The system performs the same semantic action.

This is required for keyboard and accessibility support.

---

# 42. Object Placement

User composition should use controlled semantic slots.

Do not allow free arbitrary object placement like a sandbox.

Example:

Keys occupy defined policy positions.

This keeps visual representation aligned with actual policy semantics.

---

# 43. Workshop Build State

Workshop interaction states may include:

```text
EMPTY
VAULT_SELECTED
KEY_CONFIGURATION
POLICY_READY
DETAILS_REQUIRED
CREATING
CREATED
FAILED
```

The visual world must reflect these states predictably.

---

# 44. Threshold Selection

For future M-of-N:

the user should first understand the number of keys.

Then threshold.

Do not lead with abstract dropdowns such as:

`M: 2`
`N: 5`

A visual mechanism should explain the relationship.

The precise numerical selection may still appear contextually.

---

# 45. Key Identity Assignment

When a Key needs a label:

the user may focus the Key and enter a human name.

Examples:

- Home signer
- Office signer
- Offline laptop

Labels describe operational identity.

Avoid imposing fictional names.

---

# 46. Key Status Inspection

Selecting a Key may show:

Human layer:
- name
- available/signing/signed

Advanced:
- fingerprint
- role
- descriptor-related data

Never expose private key material merely because Technical Details was opened.

---

# 47. Vault Creation Confirmation

Before creating a complex vault:

display a clear policy summary.

Example:

`Three independent keys.`

`Any two can authorize spending.`

Advanced technical details remain optional.

The user should confirm the policy before Core creates the real wallet structure.

---

# 48. Vault Creation Processing

Once creation begins:

- configuration inputs lock appropriately
- Workshop visibly enters processing state
- Cancel behavior depends on whether operation is technically cancellable
- no success state occurs before confirmed backend success

---

# 49. Vault Creation Failure

Failure should preserve as much user configuration as safely possible.

User should be able to:

- read cause
- retry
- modify input
- cancel

Do not force rebuilding the entire visual composition after a simple validation failure.

---

# 50. Backup Interaction

Backup begins by interacting with the relevant Archive object.

Do not begin through a generic global menu where avoidable.

---

# 51. Backup Flow

Recommended sequence:

1. select vault backup location
2. focus empty/open Capsule
3. show explanation
4. choose file destination
5. confirm
6. Core writes backup
7. verify expected file properties
8. update Archive state

Each step should have visible progress.

---

# 52. Backup Destination Selection

Use the operating system's standard file selection/save dialog where appropriate.

Core Vault should not build a fake filesystem browser inside its world.

The world frames the action.

The OS performs file selection precisely.

---

# 53. Backup Success

Success feedback includes:

- Capsule physically sealing
- restrained sound
- visible date
- real path available in contextual details

Text must make clear:

`Bitcoin Core successfully created a wallet backup.`

Do not say:

`Your bitcoin is now safe.`

---

# 54. Backup Failure

If backup fails:

- Capsule remains open/incomplete
- no gold verified state
- clear contextual error
- Retry remains available

---

# 55. Restore Interaction

Restore should feel more deliberate than ordinary backup creation.

Recommended:

1. enter Archive
2. select Restore/Verification Station
3. choose backup file
4. inspect file identity
5. choose restore intent
6. Core performs restore
7. result is verified
8. restored vault becomes available

---

# 56. Test Restore Versus Actual Restore

These must be clearly distinguished.

`Test this backup`

and

`Restore this wallet`

are different actions.

Do not rely only on color or metaphor.

Use explicit language.

---

# 57. Receive Interaction

Receive should be extremely simple.

Recommended:

1. select Vault
2. activate Receive
3. Core generates address
4. contextual panel shows:
   - full address
   - QR
   - Copy
   - label
   - network

The user should not traverse unnecessary steps.

---

# 58. Receive Address Verification

The full address must be available as selectable text.

QR code is supplementary.

Do not display only abbreviated address.

---

# 59. Receive Copy Feedback

Copy should produce restrained confirmation.

Examples:

- temporary `Copied`
- subtle terminal response

Do not show celebratory animation.

---

# 60. Send Interaction

Send is intentionally more deliberate than Receive.

Recommended sequence:

1. select Send
2. enter destination
3. enter amount
4. choose/review fee
5. construct proposal
6. inspect transaction
7. authorize/sign
8. finalize
9. explicit broadcast
10. result

---

# 61. Address Entry

Destination address input must support:

- paste
- keyboard entry
- clear validation
- full visibility

Validation should happen before transaction construction where possible.

---

# 62. Address Validation Failure

Display:

- concise reason
- relevant network mismatch
- clear correction

Do not merely color the field red.

---

# 63. Amount Entry

Support at minimum:

- BTC
- sats

Unit switching must not alter the intended value unexpectedly.

Always preserve exact amount semantics.

---

# 64. Maximum Spend

If `MAX` or equivalent is supported:

explain that fee affects the final output.

Never silently change amount without clear display.

---

# 65. Fee Interaction

Default interface should offer a safe simple option.

Example:

`Recommended`

Additional options may include:

- Faster
- Economy

Manual sat/vB belongs in Advanced.

Fee estimates must come from real Core data when available.

---

# 66. Missing Fee Estimate

If Core cannot provide estimate:

do not invent one.

Present:

- clear limitation
- optional manual fee entry
- option to wait

---

# 67. Transaction Proposal State

Before signing, the transaction is a proposal.

The world should not visually imply that bitcoin has been sent.

This distinction is fundamental.

---

# 68. Transaction Review

Review is one of the most important interactions in Core Vault.

The interface must display:

- network
- destination
- full address
- amount
- outputs
- change
- fee
- fee rate
- RBF
- signatures
- warnings

The camera becomes stable.

Ambient movement and sound reduce.

---

# 69. Review Confirmation Language

Use direct language.

Good:

`Review transaction`

`Sign transaction`

`Broadcast transaction`

Avoid theatrical phrases such as:

`Release the transfer`

or:

`Open the gate`

Metaphor surrounds the process.

Critical copy stays literal.

---

# 70. Signing Interaction

Signing should connect physical Key state to actual cryptographic authorization.

Sequence:

1. transaction reviewed
2. user chooses to sign
3. required Key becomes focus
4. Core signing operation begins
5. Key enters signing state
6. backend result arrives
7. valid signature activates Key
8. signature count updates

---

# 71. Passphrase During Signing

If wallet unlock is required:

- contextual secure input appears
- passphrase is not persisted
- user understands what is being unlocked
- wallet re-locks immediately after operation where appropriate

Do not animate success before actual signing succeeds.

---

# 72. Signing Failure

If passphrase is wrong or Core rejects signing:

- Key does not enter signed state
- clear error appears
- user can retry

No dramatic failure animation.

---

# 73. Multisig Signing State

The interface must show both:

- individual Key participation
- overall threshold progress

Example:

Key A — Signed  
Key B — Awaiting  
Key C — Available

Policy:

`1 of 2 required signatures collected`

---

# 74. Threshold Reached

Threshold completion means:

> enough signatures exist for the policy.

It does **not** mean:

> transaction has been broadcast.

Visual state must preserve this distinction.

---

# 75. Finalization

Finalization may occur after threshold is reached.

User should understand:

`Transaction is fully signed and ready to broadcast.`

Do not automatically transition into outward transmission.

---

# 76. Broadcast Interaction

Broadcast requires a distinct explicit user action.

Recommended:

`Broadcast transaction`

with final short review/confirmation.

This command is not triggered by:

- animation completion
- threshold completion
- returning to Communications

---

# 77. Broadcast Success

Only after actual successful broadcast:

- outward Communications channel activates
- restrained pulse leaves the facility
- transaction status becomes Broadcast

The effect should last briefly.

---

# 78. Broadcast Failure

If broadcast fails:

- transaction remains local
- outward effect does not occur
- reason is shown
- signed transaction should remain recoverable where appropriate

---

# 79. Offline Signing

Offline signing is a first-class interaction flow.

The product should make it feel intentional.

Possible flow:

Online coordinator:
- prepare PSBT
- export

Offline signer:
- import
- review
- sign
- export

Coordinator:
- import
- combine
- finalize
- broadcast

---

# 80. PSBT File Interaction

File transport should remain straightforward.

Use standard OS dialogs.

The world may represent the file as a temporary data artefact after selection.

Do not replace precise file handling with overly theatrical interactions.

---

# 81. Network Disabled Interaction

When Bitcoin Core network activity is disabled:

Communications clearly shows:

- Receive/address generation may remain available if technically valid
- PSBT creation/signing may remain available
- Broadcast unavailable

The system must explain why.

---

# 82. Core Connection Loss Mid-Task

If Core connection disappears:

- preserve safe local UI state
- halt operations dependent on Core
- clearly show loss of backend availability
- do not assume success/failure without knowing
- offer reconnect/retry where safe

---

# 83. Long Operations

For operations taking noticeable time:

show a semantic processing state.

Avoid generic spinner-only UX.

Examples:

- Reactor sync
- Backup Capsule writing
- Workshop forging
- transaction preparation

Text may supplement.

---

# 84. Interaction Sounds

Sounds should reinforce physicality.

Appropriate examples:

- soft focus tick
- key seating
- capsule seal
- reactor response
- accepted signature
- broadcast pulse

Avoid sound on every hover.

---

# 85. Haptic-Like Visual Feedback

Desktop lacks true haptics in most environments.

Physicality may instead come from:

- slight positional settle
- material response
- light change
- sound
- mechanical easing

Do not exaggerate movement.

---

# 86. Interaction Timing

Common interaction feedback should feel immediate.

Suggested principle:

- pointer feedback: near immediate
- object selection: immediate
- focus transition: short
- room transition: short
- domain operation: as long as actual backend requires

Never delay backend operation merely to complete animation.

---

# 87. UI Does Not Block Domain Work Without Reason

If a Bitcoin operation can begin immediately after confirmation, begin it.

Do not wait for a cinematic sequence to finish.

Visual and backend processing may occur concurrently when safe.

---

# 88. Domain Success Precedes Semantic Success

The world should only display final success after backend confirmation.

This rule applies universally.

---

# 89. Onboarding

First-run onboarding should teach:

- room map
- object interaction
- focus behavior
- contextual panels
- Home
- Back
- Library
- first Vault creation

Do not teach all Bitcoin concepts at once.

---

# 90. Onboarding Style

Use contextual guidance inside the world.

Examples:

- subtle highlight
- small callout
- temporary room label
- guided focus

Avoid:

- long slideshow
- endless modal tutorial
- fake cursor demonstration

---

# 91. Onboarding Can Be Skipped

Experienced users can skip onboarding immediately.

The walkthrough remains available later from Library or Settings.

---

# 92. Onboarding Does Not Auto-Create Sensitive State

Do not create wallets, backups, or transactions without explicit user confirmation merely because onboarding wants to demonstrate them.

Use Regtest/Demo only when clearly identified.

---

# 93. First Vault Journey

Suggested first-use journey:

1. Main Hall introduction
2. Workshop
3. build Personal Vault
4. set passphrase
5. Archive
6. create backup
7. optional test restore
8. Vault Chamber
9. create receive address

This teaches the world while accomplishing real setup.

---

# 94. Tooltips

Tooltips are supplementary.

They may clarify:

- room exits
- object names
- disabled states

They should be concise.

Do not place essential warnings only in tooltips.

---

# 95. Lore / Learn More Interaction

Every major semantic artefact may expose:

`Learn more`

This opens:

- short explanation
- deeper explanation
- technical layer

The system should remember where the user came from.

Closing the explanation returns to the same interaction context.

---

# 96. Technical Details

Technical Details should feel accessible but secondary.

It may expose:

- RPC
- descriptor
- fingerprint
- raw transaction data
- policy
- Core state

Do not display secrets.

---

# 97. Copy Technical Data

Advanced data such as:

- descriptor
- transaction ID
- fingerprint
- address

may have explicit Copy controls.

Copy success should be visible and restrained.

---

# 98. Accessibility Interaction Model

Every meaningful visual object requires semantic DOM equivalence.

A screen reader user should receive:

- object name
- object role
- state
- action

Example:

`Home Key. Signer. Available. Activate to inspect.`

---

# 99. Keyboard Focus

Keyboard focus must be visible inside the authored world and must feel like a restrained response of the existing object or its environment, not a generic neon sticker.

Possible techniques:

- object outline
- controlled local light
- semantic ring
- accessible label

Do not rely on browser-default hidden focus.

---

# 100. Logical Tab Order

Tab order should follow the room's functional/spatial hierarchy.

Do not expose every decorative mesh.

Example Main Hall:

1. selected/default Vault
2. other Vaults
3. Workshop
4. Archive
5. Engine Room
6. Observatory
7. Library
8. global controls

Exact order follows final composition.

---

# 101. Enter and Space

For focused controls:

- Enter activates
- Space may activate where consistent with button semantics

Do not invent game-specific keyboard mappings for basic actions.

---

# 102. Keyboard Shortcuts

Future shortcuts may include:

- `H` — Home
- shortcut for Search/Command palette
- common room access

Do not enable destructive financial actions through single-key shortcuts.

No shortcut should instantly broadcast.

---

# 103. Reduced Motion Interaction

Reduced Motion changes:

- room travel → short fade/cut
- focus camera → minimal shift
- parallax → reduced/off
- ambient motion → reduced
- object semantic changes → preserved

The information architecture must remain identical.

---

# 104. Audio-Off Interaction

No interaction should depend on hearing a sound.

Every sound cue has visual or textual equivalent.

---

# 105. High Contrast

Interactive object state must remain distinguishable under high-contrast accessibility settings.

Contextual UI must meet standard readability expectations.

---

# 106. Error Recovery

Every recoverable error should offer a clear next action.

Examples:

`Retry`

`Choose another location`

`Reconnect`

`Correct address`

`Import another PSBT`

Avoid dead-end error states.

---

# 107. Non-Recoverable State

If an operation cannot safely continue:

say so plainly.

Do not hide technical seriousness behind metaphor.

Example:

`This transaction cannot be signed by this wallet.`

Technical details can explain why.

---

# 108. Confirmation Strategy

Use confirmation when:

- irreversible
- destructive
- external
- security-sensitive

Do not ask for confirmation on trivial navigation.

Too many confirmations teach users to click through without reading.

---

# 109. Confirmation Content

Good confirmation answers:

- what action will happen
- what is affected
- whether it is reversible
- what data will leave the computer/network

Example:

`Broadcast this transaction to the Bitcoin network?`

`This cannot be undone once accepted and confirmed.`

---

# 110. No Countdown Confirmations

Do not require the user to wait several seconds before a button becomes available unless there is a compelling security reason.

Calmness is not artificial delay.

---

# 111. Destructive Actions

Dangerous actions should not be represented through attractive primary artefacts without friction.

Use:

- clear labels
- intentional confirmation
- restrained warning design

---

# 112. Disable Versus Hide

If an action is unavailable because of current system state:

prefer showing it disabled with explanation when its absence would confuse the user.

Example:

Broadcast visible but unavailable because Core network is disabled.

This teaches system state.

---

# 113. Disabled Object State

Disabled artefacts should remain recognizable.

Avoid making them disappear entirely.

Use:

- reduced energy
- inactive mechanism
- clear focus description
- explanation

---

# 114. Loading Unknown State

Before Core status is known:

do not assume connected or disconnected.

Use a neutral initializing state.

This prevents false visual claims.

---

# 115. Persistent Vault Context

If user enters Communications from `Savings` Vault:

Communications remains scoped to `Savings`.

If user goes to Archive from `Savings`:

Archive opens with `Savings` context.

Context should not reset unnecessarily.

---

# 116. Context Change

Changing active Vault should be explicit.

Do not silently switch wallet context because user navigated somewhere else.

---

# 117. Multi-Vault Operations

If an operation concerns two vaults in the future, the interface must clearly show both.

Never rely on hidden active-wallet state during critical operations.

---

# 118. Settings Interaction

Settings should remain accessible through a conventional panel.

Settings include:

- sound
- reduced motion
- graphics quality
- language
- accessibility
- walkthrough startup behavior

Settings do not need a dedicated fantasy room.

---

# 119. Command Palette

A future command palette is recommended for advanced use.

Examples:

- Go to Engine Room
- Open Savings Vault
- Create backup
- Open Library: PSBT

It should accelerate navigation, not expose unsafe raw RPC.

---

# 120. Search

Library content may support search.

Search results should navigate to relevant knowledge context.

Do not turn global search into a hidden way to bypass confirmation flows.

---

# 121. Window Resizing

Interactive hotspots and contextual panels must adapt to window size.

Do not hardcode click locations based on one resolution.

3D objects remain world-space.

UI anchoring uses projected positions safely.

---

# 122. Multi-Monitor

No special multi-monitor interaction is required initially.

Application should behave normally when moved between displays with different scaling.

---

# 123. Retina / High DPI

Text and contextual UI must remain crisp.

3D renderer should adapt resolution without unnecessarily rendering at extreme device pixel ratios when expensive.

---

# 124. Lost Focus

When the application loses OS focus:

- sensitive passphrase fields may remain protected
- ambient rendering may reduce
- no financial action progresses because of accidental keyboard input

Domain operations already submitted may continue.

---

# 125. Resume From Minimized

On return:

- resynchronize relevant Core state
- do not rely solely on stale scene state
- world updates smoothly to current truth

---

# 126. Session Restoration

The application may remember:

- last room
- selected Vault where safe
- visual preferences

But should not reopen directly into:

- visible passphrase
- half-entered sensitive transaction
- secret technical material

without deliberate design.

---

# 127. Interruption During Transaction

If the app closes or crashes during an unsigned proposal:

recovery behavior depends on whether proposal state was intentionally persisted.

Do not persist sensitive data accidentally.

This is governed further by Bitcoin Core Integration and Security documentation.

---

# 128. Undo

Undo may exist for visual composition before real Bitcoin state is committed.

Example:

changing Workshop key arrangement before creation.

Once Bitcoin Core has created/changed real wallet state, Undo must not pretend to reverse it unless a real safe inverse operation exists.

---

# 129. Cancel Before Commit

Before a real operation begins:

Cancel should generally restore previous visual state.

After an irreversible or side-effecting operation begins:

Cancel semantics must reflect what is technically possible.

---

# 130. Interaction Logging

User interaction logs must not contain:

- passphrases
- private descriptors
- private keys
- raw sensitive PSBT data without explicit approved need

Analytics-style interaction tracking should not exist by default.

---

# 131. Demo Interaction

Demo mode may allow:

- instant state transitions
- fake signatures
- fake blocks
- fake backup state

But the entire environment must remain clearly marked:

`DEMO`

Production interaction never uses fake success.

---

# 132. Regtest Interaction

Regtest can provide realistic full flows safely.

Where possible, development demos of:

- send
- receive
- signatures
- blocks

should use real Regtest rather than invented data.

---

# 133. Object Response Consistency

All interactive artefacts should share a common behavioral language.

Example:

Hover:
- small response

Focus:
- stronger response

Processing:
- controlled blue activity

Validated success:
- restrained gold completion

Error:
- localized warning

This consistency teaches the interface.

---

# 134. Avoid Excessive Text During Normal Exploration

Default world interaction should not constantly show paragraphs.

Use:

- short labels
- concise state
- optional Learn More

The Library exists for depth.

---

# 135. Contextual Copy Tone

Copy should be:

- direct
- calm
- precise
- human

Examples:

`One more signature is required.`

`Bitcoin Core is still synchronizing.`

`This backup has not been tested.`

Avoid:

`Cryptographic authorization threshold incomplete.`

unless in Technical Details.

---

# 136. Interaction Should Build Intuition

A successful interaction should teach cause and effect.

Examples:

Key signs:
→ Key activates
→ authorization path lights
→ threshold advances

Backup succeeds:
→ Capsule seals
→ backup status updates

Network disabled:
→ Reactor remains active
→ external conduits stop

These relationships are central to Core Vault.

---

# 137. Do Not Animate Abstract Success Unrelated to Object

Success feedback should occur on the relevant artefact.

Example:

backup:
- Capsule

signature:
- Key

sync:
- Reactor

broadcast:
- Communications channel

This strengthens semantic memory.

---

# 138. Interaction Performance

Pointer response must remain responsive even while:

- Core is polling
- scene is animated
- background assets are loading

Long JavaScript main-thread blocks are unacceptable.

Bitcoin requests must not freeze scene interaction unnecessarily.

---

# 139. Asset Loading During Interaction

Do not wait to load a critical interaction asset only after the user clicks it if it could have been reasonably preloaded.

Likely next interaction states should be prepared.

---

# 140. Interaction Resilience

If a visual animation asset fails:

- action remains understandable
- contextual state remains available
- Bitcoin operation is not lost

Interaction correctness must not depend on art assets.

---

# 141. Main Hall Interaction Acceptance Criteria

Main Hall succeeds when the user can:

- identify their Vaults
- enter a Vault
- reach Workshop
- reach major rooms
- understand broad Core status

without relying on a conventional navigation bar.

---

# 142. Workshop Interaction Acceptance Criteria

Workshop succeeds when the user can:

- create a Personal Vault
- understand one-key authorization
- understand 2-of-3 visually
- perform composition with pointer or keyboard
- review policy
- create via real Core backend
- recover gracefully from failure

without using a traditional configuration page as the primary experience.

---

# 143. Vault Chamber Interaction Acceptance Criteria

Vault Chamber succeeds when the user can:

- understand which Vault is active
- inspect policy
- inspect Keys
- see backup status
- initiate Receive/Send
- reach Archive
- reach Communications

without losing Vault context.

---

# 144. Archive Interaction Acceptance Criteria

Archive succeeds when:

- backup begins through semantic Archive interaction
- OS file controls are used appropriately
- Capsule state follows actual Core result
- verification is distinct from creation
- restore is clear
- user can always see real backup path/details

---

# 145. Communications Interaction Acceptance Criteria

Communications succeeds when:

- Receive is simple
- Send is deliberate
- transaction review is precise
- signing is mapped to Keys
- threshold completion is distinct from broadcast
- offline state remains usable
- broadcast requires explicit confirmation

---

# 146. Engine Room Interaction Acceptance Criteria

Engine Room succeeds when:

- Reactor can be inspected
- broad state is visible before inspection
- technical data is available on demand
- network activity can be intentionally controlled if supported
- disabling network cannot be confused with Core failure

---

# 147. Observatory Interaction Acceptance Criteria

Observatory succeeds when:

- user can inspect local data
- user is not required to act
- events are data-driven
- interaction remains light
- scene can be watched calmly

---

# 148. Library Interaction Acceptance Criteria

Library succeeds when:

- content is discoverable
- Learn More works from other rooms
- technical depth is available
- walkthrough can be restarted
- reading remains comfortable
- returning preserves prior context

---

# 149. Final Interaction Test

For every feature, ask:

> **Does the user begin by expressing their intention through the world, or by hunting through software controls?**

Then ask:

> **When precision becomes necessary, does the interface become explicit enough to make a safe Bitcoin decision?**

Both must be true.

Too much world and not enough precision creates dangerous theatre.

Too much conventional software and not enough world recreates the applications Core Vault exists to move beyond.

---

# 150. Final Interaction Principle

The complete interaction philosophy of Core Vault is:

> **Approach the place.  
> Interact with the object.  
> Understand the state.  
> Reveal precision when needed.  
> Confirm deliberately.  
> Let Bitcoin Core perform the real work.  
> Let the world show what happened.**

The user should not feel like they are operating software abstractions.

They should feel like they understand what their Bitcoin system is doing.

That understanding is the purpose of the interaction design.
