# Core Vault — Room Design

**Document:** 05 / Spatial Experience Specification  
**Status:** Foundational Room Specification  
**Depends on:**
- `01_VISION_AND_PHILOSOPHY.md`
- `02_DESIGN_PRINCIPLES.md`
- `03_TECHNICAL_ARCHITECTURE.md`
- `04_WORLD_BIBLE.md`

**Applies to:** Main Hall, Workshop, Vault Chamber, Archive, Communications, Engine Room, Observatory, Library, scene composition, room-specific interaction, environmental state, navigation, and spatial UX.

---

# 1. Purpose of This Document

This document defines the major functional spaces of Core Vault.

It answers:

- what each room is
- why it exists
- what the user sees when entering
- what the visual focal point is
- which objects are interactive
- which Bitcoin operations belong there
- how Core state affects the room
- how the room behaves while idle
- how the user enters and leaves
- which conventional contextual interfaces may appear

This document defines room function and composition.

It does not define final materials, exact color values, shader parameters, audio assets, or implementation code.

Those are covered in later specifications.

---

# 2. General Rule for Every Room

Every room must satisfy five requirements.

## 2.1 Spatial identity

The user should recognize the room before reading its title.

## 2.2 Functional identity

The room should have one dominant purpose.

## 2.3 Semantic objects

Primary functionality should originate from meaningful objects inside the environment.

## 2.4 Contextual precision

Forms and technical controls appear only when necessary.

## 2.5 Ambient completeness

The room should feel complete even when the user is doing nothing.

---

# 3. Default Room Composition

Every room should conceptually contain four visual zones.

## Background

Defines architecture, exterior relationship, scale, and atmosphere.

## Functional mid-ground

Contains the room's primary machinery and objects.

## Interaction foreground

Contains objects the user can directly select or inspect.

## Contextual interface plane

Used temporarily for precise DOM-based information and controls.

The contextual interface must never permanently dominate the composition.

These four zones are conceptual, not a requirement for four volumes of real-time geometry. A room may create them through one coherent cinematic master composition, foreground/mid-ground/background layers, depth information, semantic masks, controlled parallax, animation, selective geometry, and compositing. All zones must share the same perspective, light, materials, and atmosphere.

---

# 4. Entry State

When entering a room:

1. the curated viewpoint completes the spatial transition
2. primary room ambience becomes audible
3. the room reaches its stable default composition
4. critical system state becomes visible
5. interaction is enabled

The user should normally receive a few seconds of visual calm rather than immediately seeing a modal.

---

# 5. Idle State

Every room requires a designed idle state.

Idle means:

- no modal
- no active transaction
- no error
- no selected object

The idle room should communicate its purpose without demanding action.

---

# 6. Focus State

Selecting an important object may:

- bring the viewpoint slightly closer through camera motion, crop, zoom, parallax, or depth-aware focus
- shift light toward the object
- reduce competing motion
- reveal contextual controls
- provide optional information

The room must remain recognizable.

Focus should not feel like opening an unrelated page.

---

# 7. Exit State

Every room needs:

- a spatially meaningful way back
- keyboard Back support
- a Home/Main Hall fallback

Leaving a room should never require searching for a hidden hotspot.

---

# 8. Room 1 — Main Hall

## Purpose

The Main Hall is the central orientation space of Core Vault.

Its question is:

> **“Where am I, what do I own here, and where do I want to go?”**

It is not a dashboard.

---

# 9. Main Hall Emotional Tone

The Main Hall should feel:

- open
- calm
- welcoming
- private
- architecturally impressive without grandeur
- naturally lit
- immediately understandable

It is the strongest introduction to the world.

---

# 10. Main Hall Architecture

Suggested architectural composition:

- broad Mediterranean stone hall
- large central volume
- strong axial perspective
- one or more open arches toward sea or sky
- side passages
- broad stone steps
- bronze and glass technology integrated subtly into the architecture

The room should establish the complete Core Vault design language immediately.

---

# 11. Main Hall Camera

Default camera should feel approximately like a person standing just inside the main entrance.

The view should reveal:

- vault area
- Workshop direction
- Archive direction
- path toward Engine Room
- outward Observatory direction
- quieter Library route

Not every destination requires equal visual prominence.

---

# 12. Main Hall Primary Focal Point

The primary focal point should be the user's vault area.

The environment should communicate:

> “These are mine.”

Vaults should be physically present as:

- chambers
- secured niches
- integrated vault objects
- architectural bays

Do not represent them as rectangular application cards.

---

# 13. Main Hall Vault Representation

Each vault may show only minimal persistent information:

- vault name
- broad type
- broad attention state

Examples:

`Savings`

`2 of 3`

`Backup required`

Avoid displaying:

- full balance
- long transaction history
- detailed descriptor data
- fee data
- node metrics

in the Main Hall by default.

---

# 14. Main Hall Empty State

If no vault exists:

the room should still look finished.

The vault wing may show:

- one empty prepared chamber
- restrained invitation to create the first vault
- subtle architectural light leading toward Workshop

Do not display a giant empty-state card.

---

# 15. Main Hall Core Presence

Bitcoin Core should have a subtle global presence.

Examples:

- distant conduit activity
- subtle structural energy
- a small status mechanism

The full node state belongs in the Engine Room.

If Core is unavailable, the Main Hall should indicate that something important is inactive without turning into an error dashboard.

---

# 16. Main Hall Navigation

Spatial exits should lead toward:

- Workshop
- Vault area
- Archive
- Communications
- Engine Room
- Observatory
- Library

Navigation cues may use:

- visible architecture
- light
- conduits
- destination silhouettes
- subtle labels
- focus response

Avoid a permanent seven-item navigation bar.

---

# 17. Main Hall Ambient Motion

Examples:

- slow sea motion
- warm sunlight shift
- dust in light
- restrained conduit pulse
- subtle movement of distant exterior elements

The Main Hall should feel especially peaceful.

---

# 18. Main Hall Success Test

A screenshot of Main Hall with no overlays should look like:

> a sophisticated interactive architectural environment containing the user's vaults

not:

> a Bitcoin dashboard placed over Mediterranean concept art.

---

# 19. Room 2 — Workshop

## Purpose

The Workshop is where spending structures are created.

Its question is:

> **“What kind of vault am I building?”**

This room is the clearest embodiment of composition instead of configuration.

---

# 20. Workshop Emotional Tone

The Workshop should feel:

- focused
- precise
- constructive
- tactile
- technically capable
- slightly more active than Main Hall

It is not industrial.

It is a precision workshop.

---

# 21. Workshop Architecture

Suggested composition:

- large central work platform or table
- semicircular or circular room
- tool/artefact stations around the perimeter
- strong natural side light
- integrated technological machinery
- visible energy channels running toward the central work area

The architecture should naturally draw attention to the build surface.

---

# 22. Workshop Primary Focal Point

The central build table is the most important object.

When nothing is being built:

it remains empty, calm, and clearly ready.

A prepared vault foundation or assembly ring may sit in its center.

---

# 23. Workshop Artefact Stations

Possible stations:

- Vault Body
- Keys
- future Time Mechanism
- future Policy Branches

Only implemented functionality should appear operational.

Future objects may appear inactive only if clearly unavailable.

---

# 24. Personal Vault Flow

For a single-signature vault:

1. user activates the central build station
2. selects Personal Vault
3. a vault core appears or mechanically assembles
4. one Key artefact becomes relevant
5. user selects the key
6. the key moves or locks into a defined authorization position
7. one path connects to the vault
8. the structure clearly communicates:

`1 key · 1 required`

9. contextual panel requests:
   - vault name
   - passphrase
   - confirmation
10. real Core operation begins
11. Workshop enters processing state
12. after real success, the vault mechanism completes
13. user is directed toward backup

---

# 25. Personal Vault Processing State

During creation:

- central forge mechanism becomes active
- movement remains controlled
- blue energy can represent active system processing
- no gold completion state yet

After actual Core success:

- mechanism settles
- gold validation may appear
- key enters confirmed active identity state

---

# 26. Workshop 2-of-3 Flow

The desired 2-of-3 composition contains:

- one central Vault mechanism
- three visibly independent Key artefacts
- three distinct authorization paths
- a clearly visible threshold mechanism requiring two

The user should understand the policy before reading technical text.

---

# 27. Multisig Threshold Visualization

Do not merely display:

`2 / 3`

in a large card.

Instead, the structure itself may contain:

- three incoming channels
- two authorization receivers
- threshold ring
- two-stage mechanism

Text can supplement:

`Any 2 of 3 keys can authorize spending.`

---

# 28. Workshop Key Independence

Multisig keys must look independent.

They should not visually appear like three copies inside one machine.

Each key may occupy:

- separate stand
- separate channel
- separate spatial position

This supports the mental model of independent signing authority.

---

# 29. Future Custom M-of-N

Custom multisig may later allow:

- more keys
- selectable threshold

The Workshop must scale without turning into a spreadsheet.

Potential approach:

- additional key artefacts appear around the build platform
- central threshold mechanism physically changes

But this functionality must not be exposed before policy implementation is technically validated.

---

# 30. Future Timelock

A future Time Mechanism may occupy a dedicated Workshop station.

When implemented, it could be brought into the central assembly.

Its visual presence must correspond to:

- actual timing condition
- actual policy semantics

Until implemented, it remains clearly inactive.

---

# 31. Workshop Technical Inspection

The user may inspect the completed structure.

Optional technical view may reveal:

- descriptor
- fingerprints
- threshold
- script type
- wallet role
- Core mapping

The technical layer should feel like opening the mechanism to understand it.

---

# 32. Workshop Ambient Motion

Examples:

- low mechanical idle motion
- slow energy circulation
- reflected sunlight
- occasional tiny mechanical calibration movement
- restrained Workshop room tone

Do not make tools constantly animate.

---

# 33. Workshop Failure State

If Core wallet creation fails:

- assembly stops
- no completion animation
- mechanism remains incomplete
- contextual error appears
- user may retry or cancel

Do not destroy the current composition unless technically necessary.

---

# 34. Workshop Success Test

The Workshop succeeds if a new user can visually explain:

> “I am building a vault, I have this many keys, and this many are required.”

before learning terms such as descriptor or PSBT.

---

# 35. Room 3 — Vault Chamber

## Purpose

The Vault Chamber is the user's primary relationship with one specific vault.

Its question is:

> **“What is happening with this vault?”**

---

# 36. Vault Chamber Emotional Tone

This room should feel:

- personal
- stable
- secure
- quiet
- intimate relative to Main Hall

It should feel like the user's specific space.

---

# 37. Vault Chamber Composition

The selected Vault dominates the room.

Possible composition:

- central vault structure
- key positions nearby
- smaller communication interface
- subtle Archive link
- activity structure integrated into the architecture

The room should not become a wallet dashboard.

---

# 38. Vault Identity

Clearly show:

- vault name
- broad policy

Examples:

`Savings`

`2 of 3`

The name may be engraved, projected subtly, or displayed contextually.

---

# 39. Vault Balance

Balance should be available but not visually dominate the room.

Possible placement:

- contextual inscription
- small display associated with Vault inspection

Support:

- BTC
- sats

Do not show fiat value by default.

---

# 40. Vault Lock State

If a wallet is encrypted and locked:

the state should be understandable.

The vault may appear:

- settled
- closed
- stable

A temporary wallet unlock must not be represented as the entire Vault being permanently “open.”

---

# 41. Vault Keys

For multisig, key identities should remain visible.

Possible states:

- available
- unavailable
- signature requested
- signed

The user should be able to inspect each signing authority.

---

# 42. Vault Activity

Recent transactions may be accessed through a contextual activity view.

Do not turn an entire wall into a persistent transaction table.

The room's dominant purpose remains the Vault itself.

---

# 43. Receive From Vault Chamber

Receive may be initiated from the Vault Chamber.

This may transition the user toward Communications or activate a local communication mechanism.

The exact UX is defined in Interaction Design.

---

# 44. Send From Vault Chamber

Send may similarly originate here.

But detailed transaction construction and transmission belongs conceptually to Communications.

---

# 45. Backup Status

The Vault should communicate broad backup status.

Examples:

- verified
- backup required
- backup status unknown

The detailed backup operation belongs in Archive.

---

# 46. Vault Chamber Ambient Motion

Very restrained.

Examples:

- slow internal energy
- occasional key-core pulse
- sunlight shift
- subtle mechanical breathing

This is one of the calmer rooms.

---

# 47. Room 4 — Archive

## Purpose

The Archive is where recovery material is preserved and tested.

Its question is:

> **“Can this vault be recovered?”**

---

# 48. Archive Emotional Tone

The Archive should feel:

- protected
- quiet
- deliberate
- stable
- timeless

It is more enclosed than Main Hall.

---

# 49. Archive Architecture

Suggested elements:

- thick stone architecture
- repeated wall niches
- bronze storage structures
- glass backup capsules
- controlled indirect light
- verification station

There may be little or no direct sea view.

---

# 50. Archive Main Composition

The user's backup records are represented through actual Archive objects.

Not filesystem cards.

A vault may correspond to:

- dedicated niche
- backup capsule
- verification state

---

# 51. No Backup State

If a vault has no known backup:

its Archive position should visibly be incomplete.

Examples:

- empty capsule station
- open containment ring
- restrained warning marker

Text:

`Backup required`

---

# 52. Create Backup Flow

1. user selects vault Archive location
2. empty Backup Capsule becomes focus
3. contextual panel explains operation
4. OS save location is selected
5. actual `backupwallet` process starts
6. capsule enters writing state
7. if successful:
   - capsule seals
   - state stabilizes
   - date appears
8. if failed:
   - capsule remains unsealed
   - clear error appears

---

# 53. Backup Location

After success, the contextual UI must show the real filesystem location.

Do not rely on the Capsule metaphor alone.

---

# 54. Backup Verification

A separate Verification Station may represent restore testing.

The user selects an existing backup capsule and moves into verification flow.

This should feel distinct from merely creating another backup.

---

# 55. Restore Test Flow

Conceptually:

1. select backup
2. activate verification station
3. contextual panel explains test
4. Core performs restore under controlled test identity
5. public identity/fingerprint comparison occurs
6. result is shown
7. Archive artefact updates to verified state if successful

---

# 56. Verified State

A verified backup may use:

- stable gold ring
- complete containment state
- subtle verification marker

Do not imply that verified means physically redundant or protected against every failure.

---

# 57. Multiple Backups

Long-term, the Archive may display multiple known backup events.

But Core Vault cannot know whether the user copied a file externally after creation.

Therefore distinguish:

> backup files created through Core Vault

from:

> all real-world physical copies

Never claim knowledge the application does not possess.

---

# 58. Restore Flow

Full restoration from an existing backup belongs in Archive.

This should feel like recovering a preserved object.

But precise file selection and wallet naming remain conventional contextual UI.

---

# 59. Archive Ambient Motion

Minimal.

Examples:

- slow light shift
- subtle capsule glow
- quiet environmental resonance
- occasional tiny reflection movement

The Archive may be the quietest room.

---

# 60. Room 5 — Communications

## Purpose

Communications manages the movement of transaction information.

Its question is:

> **“What is entering or leaving this vault?”**

---

# 61. Communications Emotional Tone

This room should feel:

- precise
- directional
- connected
- controlled

It may have more active technological motion than Archive or Library.

---

# 62. Communications Architecture

Possible composition:

- symmetrical communication chamber
- incoming side
- outgoing side
- central transaction review terminal
- conduits toward Engine Room
- conduits toward selected Vault

The room visually sits between wallet and network.

---

# 63. Receive Terminal

The Receive side may use:

- receiving beacon
- glass terminal
- controlled inward channel

When inactive, it remains quiet.

---

# 64. Receive Flow

1. user activates Receive terminal
2. terminal enters focus
3. new Core address is generated
4. contextual panel appears
5. display:
   - full address
   - QR
   - Copy
   - label
   - network
6. optional technical details remain available

Do not animate bitcoin arriving merely because an address exists.

---

# 65. Incoming Transaction

If actual incoming transaction state is detected, the environment may respond.

Pending and confirmed must remain distinct.

A pending transaction must not look final.

---

# 66. Send Terminal

Outgoing side represents preparation and eventual broadcast.

Before broadcast it should remain visually local.

Nothing should visibly leave the facility until broadcast succeeds.

---

# 67. Send Flow

High-level phases:

1. destination entry
2. amount
3. fee selection
4. transaction proposal creation
5. review
6. signing
7. threshold completion
8. finalization
9. explicit broadcast
10. broadcast result

Each phase should have a clear semantic state.

---

# 68. Transaction Review

During review:

- camera stabilizes
- ambient distraction reduces
- conventional precision UI becomes dominant
- all critical data is visible

Display:

- network
- full destination
- amount
- outputs
- change
- fee
- fee rate
- RBF state
- signature state

No stylized metaphor may replace these facts.

---

# 69. Single-Sig Signing

For a single-signature vault:

signing may visually activate the relevant Key artefact.

But actual Core signing result determines success.

---

# 70. Multisig Signing

Communications should clearly show:

- required signatures
- collected signatures
- which signing authorities participated

Example visual sequence:

`0/2`

no key channels active

`1/2`

one channel active

`2/2`

two channels active, threshold mechanism complete

---

# 71. PSBT Import and Export

PSBT transport belongs in Communications.

Primary MVP representation may be a physical data carrier or communication object.

However:

actual file selection/export uses conventional OS controls.

Do not unnecessarily theatricalize file handling.

---

# 72. Broadcast

Broadcast is the moment the transaction actually leaves the local system.

Only after explicit user confirmation.

A successful broadcast may produce:

- one restrained outward energy pulse
- communication channel activation
- short sound

No coins flying toward the horizon.

---

# 73. Network Disabled State

If Core network activity is disabled:

- signing remains available where technically valid
- export/import remains available
- Broadcast channel visibly remains unavailable

Communications should communicate:

> local operations available, network transmission unavailable

without looking broken.

---

# 74. Communications Ambient Motion

Examples:

- slow directional energy
- subtle signal pulse
- controlled terminal movement
- restrained reflections

It should never resemble a busy trading floor.

---

# 75. Room 6 — Engine Room

## Purpose

The Engine Room is the visible home of Bitcoin Core.

Its question is:

> **“What is my Bitcoin Core doing?”**

This is one of the most important spaces in Core Vault.

---

# 76. Engine Room Emotional Tone

It should feel:

- powerful
- precise
- stable
- technically alive
- controlled
- slightly more enclosed

Not dangerous.

Not industrially dirty.

---

# 77. Engine Room Architecture

Possible composition:

- circular or partially circular chamber
- lower level than Main Hall
- heavy stone structure
- central Core Reactor
- large integrated conduits
- elevated inspection walkway
- restrained exterior visibility

Technology dominates more strongly here.

---

# 78. Core Reactor

The Core Reactor is the dominant object.

Possible structure:

- stone base
- bronze support rings
- transparent central chamber
- internal blue/gold energy
- synchronization ring
- external conduits
- controlled mechanical movement

The exact art is defined later.

---

# 79. Reactor State — Core Disconnected

If Core is unavailable:

- internal active energy absent
- mechanical systems mostly still
- external conduits inactive
- room lighting remains functional

Context:

`Bitcoin Core is not available.`

---

# 80. Reactor State — Connecting

During connection:

- subtle awakening process
- low-level blue activity
- no full stable state

Do not show synchronized status prematurely.

---

# 81. Reactor State — Syncing

Sync should be physically legible.

Possible mechanism:

- synchronization ring progresses around reactor
- exact percentage available on inspection
- Core remains visibly active
- network conduits may operate

The state should feel:

> working toward completion

not:

> malfunctioning.

---

# 82. Reactor State — Synced

A synchronized reactor should become calmer, not more spectacular.

Stable:

- rhythm
- glow
- rotation
- conduit activity

This communicates healthy equilibrium.

---

# 83. Reactor State — Network Active

External conduits carry restrained active flow.

Broad peer connectivity may affect:

- number or density of small outer signal points
- not one pipe per peer

Detailed peer count belongs in contextual inspection.

---

# 84. Reactor State — Network Disabled

Critical concept:

- reactor remains active
- synchronization data remains visible
- local Core remains alive
- external network conduits become inactive

Text:

`Bitcoin Core network activity is disabled.`

Do not label this state simply `Air-gapped`.

---

# 85. Peer Inspection

Selecting network subsystem may reveal:

- peer count
- inbound/outbound summary
- network names
- optional detailed peer list

This information is secondary.

The Reactor itself communicates broad status.

---

# 86. Chain Identity

Engine Room must clearly expose:

- MAINNET
- SIGNET
- TESTNET4
- REGTEST

The network must never be inferred only from environment color.

---

# 87. New Block Event

When a new block is accepted:

- brief incoming system pulse
- reactor acknowledges it
- synchronization remains stable
- possibly a subtle sound

The event should last roughly moments, not become a cinematic sequence.

---

# 88. Mempool Presence

The Engine Room may contain a secondary subsystem indicating:

- mempool activity
- mempool occupancy

Detailed visualization belongs in Observatory.

---

# 89. Engine Room Inspection

Selecting Reactor may reveal:

- Core version
- chain
- block height
- header count
- sync progress
- IBD
- peer count
- network activity
- pruned state
- mempool summary

This should appear as a precision panel associated with the machine.

---

# 90. Engine Room Ambient Motion

This room has the strongest mechanical ambience.

Examples:

- slow reactor pulse
- restrained ring movement
- persistent low conduit activity
- controlled light oscillation
- low-frequency room tone

Still calm enough to remain open for several minutes.

---

# 91. Engine Room Success Test

Without reading a metric, the user should broadly recognize:

- Core alive or unavailable
- syncing or stable
- connected or network-disabled

That is the room's primary UX achievement.

---

# 92. Room 7 — Observatory

## Purpose

The Observatory is where users watch Bitcoin through their own node.

Its question is:

> **“What is happening in Bitcoin according to my node?”**

It is intentionally contemplative.

---

# 93. Observatory Emotional Tone

The Observatory should feel:

- open
- quiet
- expansive
- contemplative
- connected to the outside world

It may be one of the most visually beautiful rooms.

---

# 94. Observatory Architecture

Possible composition:

- elevated stone terrace or gallery
- broad opening toward sea/horizon
- glass or bronze observation apparatus
- central mempool visualization
- recent block structures
- restrained seating-like architectural space if appropriate

No conventional analytics dashboard dominating the view.

---

# 95. Mempool Visualization

The mempool may appear as:

- contained field of light
- flowing particles
- layered energy density
- reservoir

It should represent aggregate state.

Do not instantiate one expensive object per transaction.

---

# 96. Mempool Semantics

Possible visual properties may correspond to:

- transaction count
- memory usage
- fee environment

But the mapping must be documented and truthful.

Do not invent meaning solely for dramatic visual changes.

---

# 97. Recent Blocks

The Observatory may show several recent blocks as:

- stable discrete structures
- rings
- formations
- timeline elements

Each can expose:

- height
- timestamp
- selected summary

Do not turn this into a blockchain explorer clone.

---

# 98. New Block in Observatory

A new block is a meaningful Observatory event.

Possible sequence:

1. pending ambient mempool state continues
2. a distinct block event enters
3. new stable block representation forms
4. recent block history shifts
5. scene returns to calm

No fireworks.

---

# 99. Fee Environment

The Observatory may provide optional local Core fee-estimation context.

It should not become a trading metric.

Fee information belongs in:

- optional inspection
- Send flow

not permanently floating above the horizon.

---

# 100. Observatory No-Action Design

The room must feel complete without CTA buttons.

It is valid for the user to do nothing.

The user may simply:

- watch
- inspect
- listen
- leave

This is a deliberate product feature.

---

# 101. Observatory Ambient Motion

Examples:

- sea
- sky
- light shift
- distant atmospheric motion
- slow mempool field movement
- occasional network-derived event

This should be the strongest “hangout” environment.

---

# 102. Room 8 — Library

## Purpose

The Library provides knowledge.

Its question is:

> **“What does this mean?”**

---

# 103. Library Emotional Tone

The Library should feel:

- quiet
- thoughtful
- warm
- inviting
- intellectually serious

Not academic or institutional.

---

# 104. Library Architecture

Possible composition:

- stone alcoves
- restrained wood
- bronze frames
- glass information artefacts
- warm indirect daylight
- small sea or courtyard connection
- layered knowledge stations

It should feel softer than Engine Room and Workshop.

---

# 105. Library Structure

Knowledge may be organized around concepts rather than manual chapters.

Possible artefacts:

- Vault
- Key
- Backup
- Transaction
- PSBT
- Multisig
- Descriptor
- Taproot
- Timelock
- Bitcoin Core
- Mempool
- Block

---

# 106. Library Information Levels

Every subject should support:

## Simple

Plain-language concept.

## Learn More

Functional explanation.

## Technical

Precise Bitcoin/Core details.

This pattern must remain consistent throughout the application.

---

# 107. Walkthrough Access

The Library contains a clear way to restart:

- initial product walkthrough
- room orientation
- selected educational walkthroughs

The user should never need to reinstall Core Vault to see onboarding again.

---

# 108. Library and Contextual Lore

The Library is the main knowledge space.

However, small contextual knowledge links may appear throughout other rooms.

For example:

Workshop Key → `Learn more`

This may either:

- open a compact explanation locally
- transition into the relevant Library subject

Both should feel part of one system.

---

# 109. Technical Transparency

The Library should eventually allow advanced users to understand how metaphors map to reality.

Example:

### Vault

Human:
`A place protected by a spending policy.`

Technical:
`Bitcoin Core descriptor wallet...`

This prevents Core Vault from creating abstraction lock-in.

---

# 110. Library Ambient Motion

Very restrained.

Examples:

- soft daylight movement
- dust
- subtle glass reflections
- occasional quiet artefact response

The room should support reading.

---

# 111. Room Relationship — Main Hall to Workshop

Transition should communicate:

> moving from orientation into construction.

Possible visual language:

- approach workshop arch
- machinery becomes audible
- architectural tone shifts slightly toward more mechanical detail

---

# 112. Main Hall to Vault Chamber

Selecting a vault should feel more personal than entering a generic room.

Possible:

- camera approaches selected vault
- architectural chamber opens
- transition retains vault visual identity

The vault itself is the continuity object.

---

# 113. Main Hall to Archive

Transition should become quieter and more enclosed.

Natural light may reduce.

Environmental sound softens.

The user feels movement toward preservation.

---

# 114. Main Hall to Observatory

Transition moves toward openness and exterior light.

Sea and ambient wind become more present.

---

# 115. Main Hall to Engine Room

Transition may descend or move inward.

Natural exterior light decreases.

Technological sound becomes slightly stronger.

---

# 116. Main Hall to Library

Transition should become quieter and warmer.

It may be lateral rather than dramatic.

---

# 117. Vault Chamber to Communications

This should feel like taking an action from a specific vault toward transaction infrastructure.

The selected vault identity should remain contextually visible.

---

# 118. Vault Chamber to Archive

Backup actions should preserve vault context.

The user should know:

> “I am backing up Savings.”

not merely:

> “I am in Archive.”

---

# 119. Room Context Must Persist

When navigating from a specific vault into:

- Archive
- Communications

the destination should retain the relevant vault context until intentionally changed.

Do not force the user to reselect the vault unnecessarily.

---

# 120. Critical Task Focus Mode

For:

- transaction review
- backup verification
- restore
- passphrase
- policy confirmation

rooms enter Focus Mode.

Focus Mode may:

- stabilize camera
- reduce ambient audio
- reduce motion
- dim irrelevant objects
- make precision UI primary

After task completion:

the room returns gradually to normal ambience.

---

# 121. Error Mode

Errors remain local to relevant subsystem.

Examples:

Backup failure:
- Archive capsule

Network failure:
- Engine Room / Communications

Signing failure:
- relevant Key

Do not transform unrelated rooms into alarm states.

---

# 122. Attention Required State

Some non-critical unresolved conditions may propagate subtly.

Example:

Vault needs backup.

Main Hall:
- small Vault attention indicator

Vault Chamber:
- more explicit status

Archive:
- clear incomplete backup state

This creates layered information.

---

# 123. Processing State

Processing should remain visible.

No generic global spinner unless startup truly requires it.

Examples:

- Workshop mechanism working
- Archive capsule writing
- Communications proposal preparing
- Engine Room synchronization

Each room owns the visual manifestation of processing.

---

# 124. Empty States

Every room must have a designed empty state.

Examples:

Main Hall:
- no Vaults

Workshop:
- nothing being built

Archive:
- no backups

Communications:
- no active transaction

Observatory:
- Core unavailable or no current data

Library:
- always has content

Empty state should feel intentional.

---

# 125. Demo State

In Demo/Regtest modes, rooms may contain simulated or test assets.

Persistent label must make the environment unmistakably non-mainnet where appropriate.

Never let a cinematic environment obscure chain identity.

---

# 126. Room Performance Budget

Each room must be designed with technical budgets.

Avoid:

- enormous geometry
- dozens of dynamic lights
- excessive particles
- unnecessarily high-resolution textures
- complex physics

Visual realism should come primarily from:

- composition
- material quality
- lighting
- scale
- restrained high-quality detail

---

# 127. Room Accessibility

Every room must expose an accessible semantic model.

For example, Main Hall may expose:

- Savings Vault
- Workshop
- Archive
- Engine Room
- Observatory
- Library

Keyboard navigation should follow a logical spatial order.

---

# 128. Reduced Motion Room Behavior

With Reduced Motion enabled:

- room transitions become minimal
- camera focus uses shorter movement or none
- parallax is reduced
- ambient motion decreases
- semantic state changes remain visible

No room may become unusable without motion.

---

# 129. Graphics Quality Scaling

Room design must remain intelligible even with reduced graphics.

An Efficient profile may remove:

- certain particles
- high-resolution reflections
- some dynamic shadows
- expensive post-processing

It must not remove semantic state.

---

# 130. Responsive Desktop Layout

Although the application is desktop-first, rooms must work on multiple aspect ratios.

Design for at least:

- 16:9
- 16:10
- wider desktop displays
- reasonable smaller desktop windows

Critical interactive objects must not disappear outside the safe frame.

---

# 131. Room Naming

Room names should remain direct:

- Main Hall
- Workshop
- Vault Chamber
- Archive
- Communications
- Engine Room
- Observatory
- Library

Avoid theatrical renaming such as:

- Sanctum
- Forge of Keys
- Hall of Eternity
- Cryptographic Temple

The visual world is evocative.

The language stays grounded.

---

# 132. Main Hall Acceptance Criteria

Main Hall is complete when:

- it feels like a real central environment
- vaults are physical semantic objects
- major destinations are spatially discoverable
- Core broad status is visible without dominating
- no conventional dashboard is necessary
- room remains visually complete with no overlays

---

# 133. Workshop Acceptance Criteria

Workshop is complete when:

- central build surface is obvious
- single-sig can be understood visually
- 2-of-3 can be understood visually
- meaningful artefacts are controls
- forms appear only contextually
- Core success/failure determines completion state
- room does not resemble wallet-creation settings

---

# 134. Vault Chamber Acceptance Criteria

Vault Chamber is complete when:

- selected Vault dominates the composition
- identity and policy are clear
- balance is available but secondary
- backup/signing state is understandable
- room feels personal
- detailed activity does not dominate the environment

---

# 135. Archive Acceptance Criteria

Archive is complete when:

- backups appear as persistent preserved objects
- no-backup state is clear
- backup uses real Core operation
- capsule does not seal before success
- restore verification has its own semantic interaction
- real filesystem information remains accessible
- room feels like preservation, not file management

---

# 136. Communications Acceptance Criteria

Communications is complete when:

- Receive and Send have clear spatial identity
- full precise transaction data remains available
- signing state maps to real keys
- threshold completion does not automatically broadcast
- network-disabled state is understandable
- actual broadcast has a distinct semantic event

---

# 137. Engine Room Acceptance Criteria

Engine Room is complete when the user can visually distinguish:

- Core unavailable
- Core active
- syncing
- synced
- network active
- network disabled

without first opening a technical panel.

Detailed node metrics remain available on inspection.

---

# 138. Observatory Acceptance Criteria

Observatory is complete when:

- the room feels worth visiting without a transaction
- mempool visualization is local-data-driven
- new blocks produce meaningful restrained events
- data remains truthful
- environment does not turn into analytics dashboard
- user can remain there calmly for several minutes

---

# 139. Library Acceptance Criteria

Library is complete when:

- major concepts are easy to discover
- each concept supports progressive disclosure
- walkthrough can be restarted
- technical truth is available
- education does not block ordinary product use
- the environment remains quiet and readable

---

# 140. Final Room Design Rule

Every room must pass one final question:

> **If all headings, cards, and generic navigation elements were removed, would the physical environment still communicate what this place is for and what the user can do here?**

If the answer is no, the room is not finished.

Core Vault must not contain pages decorated to resemble rooms.

It must contain rooms that function as software.

The Main Hall orients.

The Workshop constructs.

The Vault Chamber gives ownership context.

The Archive preserves.

Communications transmits.

The Engine Room runs.

The Observatory watches.

The Library explains.

Together they form one coherent Bitcoin environment, with Bitcoin Core underneath providing the actual truth that gives every room meaning.
