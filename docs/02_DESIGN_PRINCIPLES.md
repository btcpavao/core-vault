# Core Vault — Design Principles

**Document:** 02 / Project Foundation  
**Status:** Foundational  
**Depends on:** `01_VISION_AND_PHILOSOPHY.md`  
**Applies to:** Product design, interaction design, visual design, motion, sound, spatial design, UX architecture, scene design, accessibility, and future implementation decisions.

---

# 1. Purpose of This Document

This document defines the non-negotiable design principles of Core Vault.

`01_VISION_AND_PHILOSOPHY.md` defines what Core Vault fundamentally is.

This document defines how that vision must manifest in the actual product.

These principles are intended to prevent the project from gradually collapsing back into familiar patterns such as:

- dashboards
- generic web application layouts
- cards over illustrations
- menu-driven navigation
- decorative game styling
- misleading metaphors
- excessive visual spectacle
- technical complexity exposed without purpose

When a future design or implementation contradicts these principles, the contradiction must be explicitly discussed.

It must not be silently accepted because a conventional implementation is easier.

---

# 2. Principle Zero: The World Is the Interface

The foundational design rule of Core Vault is:

> **The world is the interface.**

This means:

- rooms are not backgrounds
- objects are not decoration
- architecture is not merely visual styling
- environmental state is not cosmetic

The physical structure of the digital environment should carry actual interaction and meaning.

A Workshop should function through workshop objects.

An Archive should function through archival objects.

An Engine Room should communicate Bitcoin Core state through the machine itself.

A Vault Chamber should communicate spending authority through the vault and its keys.

If a conventional application interface could be removed from the scene and the product would stop functioning conceptually, the design is likely moving in the correct direction.

If the environment could be removed and the same application could continue operating through buttons, cards, and menus almost unchanged, the environment is too superficial.

---

# 3. Core Vault Is Not a Web Page With Artwork

The following pattern is explicitly rejected:

1. create a conventional application screen
2. add a beautiful illustration as the background
3. place cards, buttons, forms, and navigation over the illustration
4. add some glow and animation
5. call the result spatial

That is not Core Vault.

Reference artwork is used to understand:

- architecture
- lighting
- materials
- color
- atmosphere
- spatial composition
- object language

It must not become wallpaper behind a generic interface.

The correct process is:

> Understand the visual world first, then design the actual functional space inside that world.

---

# 4. Design Places, Not Pages

Every major functional area must first be conceived as a place.

Do not begin with:

> “What should this page contain?”

Begin with:

> “What is this place, why does it exist, and how would a person understand its purpose before reading anything?”

Each room requires:

- a spatial identity
- a functional identity
- a visual hierarchy
- a primary object or mechanism
- a clear reason for existing
- a clear relationship to neighboring spaces

Routes in the application may still exist technically.

But users should primarily perceive transitions between places, not route changes.

---

# 5. The User Should Feel Located Somewhere

At any moment, the user should be able to answer:

> “Where am I?”

without reading a breadcrumb.

The Workshop must feel unmistakably different from the Archive.

The Engine Room must feel unmistakably different from the Library.

The Observatory must feel like a place for watching, not performing administrative tasks.

This spatial identity should come from:

- composition
- architecture
- lighting
- dominant objects
- sound
- movement
- activity

not merely from a title at the top of the screen.

---

# 6. Spatial Memory Is a Product Feature

Core Vault deliberately uses spatial memory.

The user should learn:

- backups live in the Archive
- vault construction happens in the Workshop
- Bitcoin Core lives in the Engine Room
- network observation happens in the Observatory
- deep explanations live in the Library

This should reduce dependence on memorizing:

- menu hierarchy
- toolbar positions
- settings paths
- feature names

The application should remain consistent enough that users build a mental map of the environment.

Once established, room locations should not move casually between releases.

---

# 7. Objects Should Carry Meaning

Objects should exist because they represent something.

Examples:

- a vault represents a wallet and spending policy
- a key represents signing authority
- a backup capsule represents a real wallet backup
- a reactor represents the running Bitcoin Core node
- a conduit represents network connectivity
- a timing mechanism represents an actual time condition
- a communications terminal represents transaction exchange

Avoid meaningless decorative objects that look interactive but do nothing.

Avoid interactive objects whose visual meaning does not correspond to their actual function.

---

# 8. The Meaningful Object Should Usually Be the Control

Prefer:

> interact with the key

over:

> click an “Add Key” button beside the key

Prefer:

> interact with the backup capsule

over:

> click “Create Backup” on a card displaying a capsule illustration

Prefer:

> inspect the reactor

over:

> click “Node Status”

Prefer:

> select the vault

over:

> choose a wallet from a dropdown

This does not mean hiding functionality.

Discoverability must remain strong.

But whenever possible, interaction should originate from the meaningful object itself.

---

# 9. Diegetic First, Conventional When Necessary

Core Vault uses a hybrid interface model.

## Diegetic layer

Used for:

- navigation
- object selection
- status representation
- key activation
- vault construction
- backup representation
- network state
- node state
- environmental feedback

## Conventional contextual layer

Used when precision matters more than physical metaphor.

Examples:

- entering a Bitcoin address
- reviewing a transaction
- entering or changing a passphrase
- selecting a file location
- comparing fees
- displaying transaction outputs
- showing a descriptor
- viewing an error message
- confirming an irreversible action

The principle is:

> **Use the world for understanding. Use conventional UI for precision.**

---

# 10. Conventional UI Must Be Contextual, Not Permanent

Forms should not dominate a room before the user begins a task.

The default state of every room should be the environment itself.

For example:

The Workshop should not open with:

- Wallet Name
- Wallet Type
- Key Count
- Threshold
- Passphrase
- Create button

Instead:

the user first interacts with the Workshop.

Only when a vault configuration requires text input should a contextual interface appear.

Once the operation is finished, that interface should retreat and the room should again become the primary visual experience.

---

# 11. Progressive Disclosure Is Mandatory

The user should not be forced to understand Bitcoin Core internals before completing an ordinary operation.

Information should be layered.

## Layer 1 — Human meaning

> “Two keys are required to open this vault.”

## Layer 2 — Operational meaning

> “Any two of the three signing devices can authorize a transaction.”

## Layer 3 — Technical meaning

- descriptor
- fingerprint
- wallet role
- derivation information
- policy
- RPC behavior

Advanced information should remain available.

It should simply not overwhelm the default interface.

---

# 12. Never Hide Security-Critical Information Behind Metaphor

Metaphors are allowed to simplify navigation and understanding.

They must never obscure information required for safe Bitcoin operation.

The user must be able to clearly verify:

- full destination address
- amount
- fee
- fee rate
- network
- change output
- number of required signatures
- number of collected signatures
- transaction state
- backup destination
- wallet identity
- warnings
- irreversible consequences

A transaction review screen may intentionally become more conventional than the surrounding environment.

That is good design.

Security clarity has higher priority than visual purity.

---

# 13. Metaphors Must Be Technically Honest

Every meaningful environmental state must correspond to real underlying application state.

Examples:

If a key visually activates, a valid signature must actually have been added.

If a backup capsule seals, the backup operation must actually have succeeded.

If the Engine Room indicates that Core is synchronized, Bitcoin Core must actually report synchronized state.

If external network conduits are disabled, this must reflect the relevant Core network state.

Never animate success in anticipation of success.

Never show a complete state because an operation was merely started.

---

# 14. Animation Must Follow Reality

For operations backed by Bitcoin Core:

1. user initiates action
2. environment enters an in-progress state
3. Bitcoin Core or the application returns the actual result
4. visual state reflects that result

Not:

1. user clicks
2. success animation begins
3. backend operation happens later

If an RPC call fails, the world must not briefly claim success.

---

# 15. Atmosphere Is Not System State

Core Vault contains ambient movement.

Examples:

- moving light
- ocean motion
- dust particles
- subtle reflections
- slow mechanical breathing
- background energy movement

These may exist independently of Bitcoin state.

However, they must not be confused with semantic status.

There must be a clear distinction between:

### Atmospheric animation

and

### Data-driven animation

If users could interpret an atmospheric event as a Bitcoin event, redesign it.

---

# 16. Every Animation Needs a Reason

Animations should serve at least one of three purposes.

## Atmosphere

Make the environment feel alive.

## Feedback

Confirm that the system registered an interaction.

## Explanation

Help the user understand what is happening.

If an animation serves none of these purposes, it is likely unnecessary.

Core Vault should never become a visual effects showcase.

---

# 17. Motion Should Be Slow in the Background and Fast in Interaction

Ambient motion should usually be:

- slow
- subtle
- almost subconscious

Interaction feedback should usually be:

- immediate
- concise
- clear

Navigation transitions should be:

- smooth
- controlled
- relatively short

A useful general rhythm:

- ambient cycles: several seconds or longer
- interaction response: approximately immediate
- room transition: roughly a fraction of a second
- major operation completion: brief and deliberate

The user should never wait for decorative animation before completing a serious operation.

---

# 18. Do Not Animate Everything

A living scene does not mean every object moves.

Each room should have only a few meaningful sources of motion.

Examples:

- one light movement
- one atmospheric layer
- one mechanical motion
- one data-driven element

The eye needs stable areas.

Visual silence is as important as animation.

---

# 19. Reduced Motion Is a First-Class Mode

Users must be able to substantially reduce motion.

Reduced Motion should:

- remove unnecessary camera travel
- minimize parallax
- eliminate decorative movement that may cause discomfort
- preserve critical state changes
- preserve clear interaction feedback

The spatial model must remain usable even with nearly all movement disabled.

---

# 20. Camera Movement Must Never Fight the User

Camera movement is used to create spatial continuity.

It must not become a spectacle.

Avoid:

- aggressive zooming
- rotation
- camera shake
- long cinematic sequences
- forced perspective changes during transaction review
- motion that interrupts reading
- motion that makes repeated tasks tiring

The user must always remain in control.

---

# 21. Entering a Room Should Feel Like Entering a Room

Transitions between major areas should preserve the mental model of a connected environment.

The transition may use:

- pan
- controlled zoom
- architectural occlusion
- depth movement
- foreground wipe
- crossfade
- light transition

It should communicate:

> “I moved from here to there.”

Not:

> “The page refreshed.”

---

# 22. Avoid a Permanent Application Shell Dominating the World

The main view should not be surrounded by a heavy conventional application chrome.

Avoid permanent:

- large top header
- large bottom navigation
- permanent sidebar
- large status dashboard
- breadcrumb hierarchy
- persistent card grids

A minimal global layer may contain:

- Home
- Back
- Settings
- Sound
- chain indicator
- critical warning
- connection status when needed

But the environment should visually dominate the application.

---

# 23. Do Not Create Mystery Navigation

Spatial design must not become obscure.

The user should never be forced to randomly click decorative architecture to discover functionality.

Navigation can be integrated into the scene while remaining understandable through:

- lighting
- composition
- visual hierarchy
- subtle labels
- hover/focus states
- cursor response
- onboarding guidance
- sound cues
- accessible semantic labels

The application may become less explicit after the user learns the environment, but initial discoverability matters.

---

# 24. The First Use Experience Should Teach the Map

The first walkthrough should primarily teach:

- where the major spaces are
- what they mean
- how to interact with objects
- how contextual interfaces appear
- how to return home
- how to obtain additional information

It should not become a long Bitcoin lecture.

The user should leave onboarding with spatial orientation.

The Library can provide deeper education later.

---

# 25. The User Should Learn the Product by Using It

The design should make the application progressively more understandable through repeated use.

For example:

First use:

> “This is where I create a vault.”

Later:

> “I understand that this key represents signing authority.”

Later:

> “I understand why two of three independent keys change my security model.”

Later still:

> “I can inspect the descriptor that implements this policy.”

The interface should reward curiosity with knowledge, not points.

---

# 26. The Environment Must Remain Calm During Failure

Errors must be clear without becoming dramatic.

Avoid:

- full-screen red flashes
- alarm sounds
- shaking UI
- emergency visual effects
- excessive warning colors

Instead:

- freeze the failed object's progression
- use restrained visual signaling
- show a concise explanation
- offer recovery actions
- expose technical detail if requested

Bitcoin mistakes can matter greatly.

The interface should communicate seriousness without panic.

---

# 27. Red Is Reserved

Red should be used sparingly.

It should represent situations such as:

- failed operation
- invalid input
- destructive consequence
- critical security warning
- serious connection or consistency problem

Do not use red decoratively.

Do not use it simply to create contrast.

---

# 28. Success Should Feel Satisfying, Not Celebratory

Successful operations may have restrained physical feedback.

Examples:

- a vault mechanism seats into place
- a key activates
- a capsule seals
- a conduit lights
- a subtle tone plays

Avoid:

- confetti
- fireworks
- achievement banners
- victory sounds
- exaggerated glow
- celebratory copy

The desired feeling is:

> “The mechanism completed correctly.”

Not:

> “You won.”

---

# 29. No Gamification of Money

Never turn the user's bitcoin amount into a progression system.

Do not use:

- treasure pile size
- accumulating coins
- wealth level
- vault prestige
- rarity
- ranking
- visual luxury proportional to balance

A user with 20,000 sats deserves the same dignity and complete functionality as a user with 20 BTC.

Balance must never determine visual status.

---

# 30. Balance Should Not Dominate the Environment

The amount of bitcoin in a wallet should be available but should not become the emotional center of the application.

Core Vault is about:

- ownership
- control
- infrastructure
- policy
- security
- understanding

not portfolio tracking.

Avoid giant balance typography as the primary object in the Main Hall.

---

# 31. No Fiat-Centric Design

Core Vault should not visually orient the user around fiat value.

Default unit choices may include:

- BTC
- sats

Fiat conversion, price charts, market movements, and portfolio performance are outside the product's fundamental design language.

The user is interacting with Bitcoin infrastructure, not a brokerage account.

---

# 32. Each Room Must Have One Dominant Purpose

Do not allow rooms to become dumping grounds for unrelated functions.

A room should answer one primary question.

### Main Hall

> “Where am I, and where do I want to go?”

### Workshop

> “What kind of vault am I building?”

### Vault Chamber

> “What is happening with this vault?”

### Archive

> “Are my recovery materials preserved and verified?”

### Communications

> “What information or transaction is entering or leaving?”

### Engine Room

> “What is Bitcoin Core doing?”

### Observatory

> “What is happening in Bitcoin right now according to my node?”

### Library

> “What does this mean?”

When secondary functions are necessary, keep them subordinate.

---

# 33. Main Hall Is Orientation, Not Dashboard

The Main Hall must not become a dumping ground for:

- every balance
- every transaction
- every warning
- every node metric
- every shortcut
- every configuration

Its purpose is orientation.

Show only enough state to help the user understand:

- which vaults exist
- whether attention is required
- whether Bitcoin Core is broadly functioning
- where to go next

Detailed information belongs in the relevant room.

---

# 34. Workshop Is Construction, Not Configuration

The Workshop should make policy construction understandable through composition.

It must not primarily resemble a settings form.

The user should understand:

- how many keys exist
- how many are required
- what role each object has
- what future conditions may apply

before encountering technical implementation terms.

The Workshop should feel like assembling a secure mechanism.

---

# 35. Vault Chamber Is Personal

A Vault Chamber represents one specific vault.

It should communicate a stronger sense of ownership and identity than the Main Hall.

Each vault may have:

- name
- policy structure
- key state
- backup state
- relevant activity
- signing state

but it should still belong to the same overall world.

Do not visually imply that different balances represent different status or luxury.

---

# 36. Archive Must Communicate Durability

The Archive should feel:

- quiet
- stable
- preserved
- deliberate

Backup should not feel like an ordinary file export.

But the metaphor must remain accurate.

The user must still know:

- a real backup file exists
- where it was written
- when it was created
- whether it was tested
- what it does and does not protect

The room communicates permanence.

The contextual interface communicates precision.

---

# 37. Engine Room Must Make Bitcoin Core Comprehensible

The Engine Room is not a decorative node dashboard.

Its central machine should convey broad node state at a glance.

The user should be able to visually distinguish:

- Core running
- Core unavailable
- synchronizing
- synchronized
- network active
- network disabled
- block arrival
- broad connectivity

Detailed technical metrics remain available on inspection.

The machine must correspond to real data.

---

# 38. Observatory Is Intentionally Non-Transactional

The Observatory should be one of the few places where there may be no obvious primary action.

Its function is observation.

This is intentional.

A user should be able to enter and simply watch their local view of Bitcoin.

The design should resist turning the Observatory into an analytics dashboard.

Data should be accurate but spatially interpreted.

---

# 39. Library Must Not Interrupt Ordinary Use

Education is important.

Forced education is irritating.

Core Vault should allow users to:

- complete tasks with minimal explanation
- open deeper explanations voluntarily
- revisit concepts later
- move from intuitive to technical understanding at their own pace

Do not interrupt a Send operation with a Bitcoin history lesson.

---

# 40. Sound Is Part of the World, Not a Soundtrack

Ambient audio should emerge from the environment.

Examples:

- sea
- wind
- distant mechanical resonance
- reactor hum
- room tone
- quiet material interaction

Avoid a constantly noticeable musical score.

If music is ever used, it must remain exceptionally restrained.

The user must be able to:

- mute everything
- mute ambience
- mute interaction sounds
- adjust volume

Audio is never required to understand state.

---

# 41. Silence Is a Valid Design State

Some rooms should be nearly silent.

Some operations should not make a sound.

Not every action requires feedback from every sensory channel.

Silence can communicate:

- stability
- seriousness
- safety
- completion
- concentration

Do not fear quiet design.

---

# 42. Visual Realism Should Support Presence

The target visual quality is realistic or highly polished stylized realism.

The environment should not resemble:

- flat illustration
- low-fidelity 2D game art
- cartoon UI
- generic vector art
- low-poly game prototypes as a final aesthetic

The desired feeling is closer to a sophisticated interactive environment rendered with believable:

- material
- depth
- light
- shadow
- scale
- atmosphere

The exact rendering technology is defined elsewhere.

The experiential requirement is non-negotiable.

---

# 43. Realism Does Not Mean Visual Clutter

A believable environment does not require excessive detail.

Every room should remain composed.

Use:

- large architectural forms
- controlled object count
- clear focal hierarchy
- restrained materials
- deliberate light

Avoid:

- dense mechanical noise
- random pipes
- meaningless switches
- excessive ornament
- endless screens
- clutter that competes with functional objects

---

# 44. Mediterranean High-Tech Must Remain Cohesive

The world combines:

### Mediterranean permanence

- limestone
- warm sunlight
- arches
- coast
- calm spatial proportions
- bronze
- stone

with:

### advanced technology

- glass
- contained energy
- precision
- blue light
- gold light
- engineered mechanisms
- controlled movement

Neither side should overwhelm the other.

Too much architecture becomes historical fantasy.

Too much technology becomes generic science fiction.

The tension between both is the identity of Core Vault.

---

# 45. Blue and Gold Must Have Meaning

Blue and gold energy are central visual elements.

They should not be used randomly on every object.

Their semantic meaning will be defined further in the Art Direction and World Bible documents.

Until then, follow this rule:

> Energy color should reinforce structure and state, not merely decorate.

Avoid covering the entire application with blue and gold glow simply because they are brand colors.

---

# 46. Lighting Is Part of Navigation

Light should help direct attention.

A relevant object may receive:

- slightly stronger local illumination
- a controlled glow
- a reflected highlight
- a subtle environmental response

Inactive decorative elements should not compete with actionable objects.

Lighting can function as hierarchy without requiring large button labels.

---

# 47. Do Not Use Hover as the Only Discovery Mechanism

Desktop input may support hover.

But important actions must remain discoverable through:

- composition
- focus states
- labels where needed
- keyboard navigation
- onboarding
- accessible semantics

Hover may enhance an interaction.

It must not be the only way to discover it.

---

# 48. Keyboard Navigation Must Work

Every essential action must remain possible without a mouse.

Spatial design must not break standard usability.

Interactive scene objects must have:

- logical tab order
- clear focus state
- semantic accessible labels
- keyboard activation

A non-spatial fallback representation may be offered where necessary.

Accessibility is part of the product, not a later compatibility layer.

---

# 49. Screen Readers Must Receive Meaning, Not Art Description

For functional objects, accessibility labels should describe the action and state.

Good:

> “Savings vault. Two-of-three multisignature. Backup verified. Open vault.”

Not:

> “A glowing bronze and glass cylinder in a limestone alcove.”

The visual object may be artistic.

The accessible representation should be operationally useful.

---

# 50. Color Must Never Be the Only State Indicator

If a key becomes active, do not communicate that only by changing it from blue to gold.

Also use:

- physical state
- light intensity
- movement
- text
- iconography
- positional change
- accessible state

where appropriate.

Important state must survive:

- color vision differences
- muted displays
- accessibility modes

---

# 51. Interaction Targets Must Remain Practical

Beautiful small artefacts are not an excuse for tiny click targets.

Interactive objects need generous effective interaction areas.

The visible object and the interactive hit area may differ.

Interaction should feel precise without requiring pixel-perfect mouse control.

---

# 52. The User Must Always Have an Escape

Every interaction state must provide a clear way to:

- cancel
- go back
- return home
- close a contextual panel
- stop a non-destructive flow

Users should never feel trapped inside a cinematic sequence or object interaction.

---

# 53. Irreversible Actions Need Explicit Confirmation

Examples:

- broadcast transaction
- destructive wallet action
- changing critical policy
- replacing important recovery material

These actions require clear confirmation.

A cinematic animation is not a confirmation mechanism.

The user must understand:

- what will happen
- whether it is reversible
- what Bitcoin Core will do

before proceeding.

---

# 54. Familiarity Should Increase Efficiency

Spatial design should not make experienced users slower forever.

After users learn the world, the application may offer:

- keyboard shortcuts
- command palette
- quick navigation
- recent vault shortcuts
- reduced transitions
- expert inspection panels

These should complement the spatial environment rather than replace it.

The system should be beautiful on first use and efficient on the hundredth.

---

# 55. Advanced Mode Must Reveal, Not Replace

If Core Vault introduces an advanced mode, it should expose deeper information within the same world.

Do not create:

> Simple UI

and a completely separate:

> Real technical UI

The advanced layer should reveal the machinery beneath the same interface.

The user should gradually see how the metaphor maps to Bitcoin Core.

---

# 56. Never Invent Fake Bitcoin Activity

Do not fabricate:

- transactions
- peers
- mempool activity
- block forecasts
- signatures
- wallet status
- node status

for production mode.

If a visualization is an approximation, label it as an approximation.

If data is unavailable, show uncertainty.

A beautiful truthful empty state is better than fake activity.

---

# 57. Demo and Mock State Must Be Explicit

Development and demonstration modes may use simulated data.

When they do, the application must clearly indicate:

- DEMO
- MOCK
- REGTEST

or equivalent.

A user must never mistake simulated state for mainnet Bitcoin state.

---

# 58. Network Identity Must Be Persistent

Mainnet, signet, testnet, and regtest must remain clearly distinguishable.

Do not rely only on color.

Network identity should remain visible whenever an operation could have financial consequences.

A beautiful immersive environment must never make it easy to confuse test Bitcoin with mainnet Bitcoin.

---

# 59. Data Density Should Be Intentional

Not every Core RPC value deserves permanent visual representation.

Ask:

> Does this information help the user make a decision or understand state?

If not, move it to technical details.

The environment should summarize.

Technical inspection should reveal.

---

# 60. System State Should Propagate Through the Environment

A key Core principle:

> Application state should change the world.

Examples:

Core disconnects:

- Engine Room reacts
- relevant communications paths reflect the limitation
- send/broadcast capabilities react appropriately

A backup completes:

- Archive state changes

A signature is added:

- key state changes
- vault threshold state changes

This creates cohesion.

The world should not be a collection of isolated screens that separately query the same backend.

---

# 61. Rooms Should Feel Connected

The environment should imply that all functions belong to one facility.

Use repeated elements such as:

- architecture
- material
- energy conduits
- distant views
- structural motifs
- consistent object design
- lighting logic
- sound language

The Workshop must not feel like one game.

The Archive another.

The Engine Room another.

Everything belongs to Core Vault.

---

# 62. Repetition Creates Familiarity

Important interaction patterns should repeat.

Examples:

- inspecting an artefact
- opening contextual information
- activating an object
- returning from focus view
- viewing technical detail
- confirming a critical operation

Users should not have to relearn the interface in every room.

---

# 63. Objects Need Recognizable States

Every important artefact should define states such as:

- idle
- focus
- active
- processing
- success
- warning
- unavailable
- error

These states should behave consistently across the world.

State vocabulary should eventually become part of the shared design system.

---

# 64. Processing State Must Be Visible

When Bitcoin Core is working, the user should know the application is waiting for real work to complete.

Processing should not look like failure.

Avoid relying only on a generic spinner.

Prefer object-specific processing where reasonable.

For example:

- forge is operating
- capsule is being written
- reactor is synchronizing
- communication channel is preparing

Still provide precise text where useful.

---

# 65. Performance Is Part of Design

The immersive experience must remain responsive.

A visually impressive scene that:

- stutters
- overheats laptops
- consumes excessive GPU
- delays Bitcoin actions
- becomes unusable on ordinary hardware

has failed.

The experience should feel smooth and controlled.

Visual complexity must scale when necessary.

The future technical architecture should support quality presets or graceful degradation if required.

---

# 66. Background Work Should Reduce When the App Is Inactive

Core Vault does not need to render cinematic ambience at full intensity while minimized or unfocused.

Reduce or pause:

- particles
- expensive shader effects
- unnecessary animation
- frequent scene updates

when appropriate.

Bitcoin Core operations continue independently.

The world does not need to waste resources merely to appear alive when nobody is looking.

---

# 67. Failure of Art Must Not Break Bitcoin Functionality

The experience layer and Bitcoin domain layer must remain sufficiently separated that a rendering failure cannot corrupt or redefine wallet behavior.

The application should remain capable of:

- reporting errors
- confirming transaction state
- preserving Bitcoin operations

even if a visual asset or animation fails.

Beauty is important.

Correctness is more important.

---

# 68. No Dark Patterns

Core Vault must never manipulate the user into:

- sending more bitcoin
- spending faster
- skipping backups
- enabling risky settings
- remaining inside the app
- approving a transaction
- dismissing a warning

The product's incentives must align with careful self-custody.

---

# 69. No Artificial Urgency

Avoid language such as:

- Act now
- Hurry
- Complete immediately
- Don't miss out
- Urgent

unless there is a real technical reason.

Bitcoin self-custody usually benefits from deliberate thought.

The interface should support that.

---

# 70. Language Must Be Precise and Calm

Copy should avoid both extremes:

### Overly technical

> `walletprocesspsbt returned complete=false`

### Overly theatrical

> “The sacred key refuses the vault.”

Prefer:

> “One more signature is required.”

Technical details can then reveal:

> `walletprocesspsbt: complete=false`

The world may be evocative.

Operational language must remain clear.

---

# 71. Metaphor Must Never Become Roleplay

The visual world may contain:

- vaults
- keys
- machinery
- archives
- observatories

But the copy should not turn the product into fiction.

Avoid language like:

- Guardian
- Sacred chamber
- Ancient power
- Quest
- Forge your destiny
- Unlock the realm

Core Vault is a serious Bitcoin application.

The environment carries metaphor.

The language remains grounded.

---

# 72. Beautiful Empty States Matter

Many users may begin with:

- no vault
- no backup
- no transaction history
- no active PSBT
- no peers during setup

Do not fill empty scenes with fake data.

Design meaningful empty states.

A quiet empty Workshop can communicate:

> “No vault has been built yet.”

An empty Archive can communicate:

> “No verified backup exists yet.”

Empty does not mean unfinished.

---

# 73. Warnings Should Exist in the World

Warnings should not always become modal dialogs.

For non-critical warnings, the environment may communicate state through:

- damaged or inactive conduit
- unresolved marker
- incomplete capsule
- restrained status light
- textual callout on inspection

Use modal interruptions only when action truly demands immediate attention.

---

# 74. Serious Operations Should Reduce Ambient Distraction

During actions such as:

- transaction review
- passphrase entry
- backup verification
- recovery
- policy confirmation

the environment may gently reduce:

- motion
- brightness variation
- ambient sound
- distracting background activity

The world should visually focus attention on the serious task.

Once complete, the full ambience may return.

---

# 75. Focus Mode Should Feel Natural

When inspecting an artefact:

- camera may approach slightly
- background may soften
- surrounding lighting may reduce
- contextual controls may appear

The transition should feel like focusing attention inside the same room.

It should not feel like navigating to an unrelated web page.

---

# 76. The Product Must Be Screenshot-Testable

A useful qualitative test:

Take a screenshot of any major room with no modal open.

Ask:

> “Does this look like a sophisticated interactive environment?”

If it instead looks like:

> “a desktop dashboard with themed art”

the design needs more work.

A second test:

> “Can I identify the room's primary function from the environment before reading the title?”

If not, the spatial concept is weak.

---

# 77. The Product Must Also Be Interaction-Testable

A beautiful screenshot is not enough.

Ask:

> “Are the meaningful objects actually doing the work?”

If the Workshop looks beautiful but all operations happen through a permanent right-side form, the design has failed.

If the Engine Room is beautiful but node status is communicated only through cards underneath it, the design has failed.

The environment must remain functional, not decorative.

---

# 78. The World Should Teach Cause and Effect

Whenever possible, an action should have a visually understandable consequence.

Example:

A signature is added.

The corresponding key activates.

Energy reaches the vault.

The threshold mechanism advances.

The user understands the relationship:

> signature → key authorization → vault policy progress

This visual cause-and-effect model is one of Core Vault's greatest potential advantages over conventional wallet software.

---

# 79. Complex Bitcoin Policy Should Become Composition

Long-term advanced policy creation should feel like assembling a structure.

Potential future concepts include:

- keys
- thresholds
- branches
- time mechanisms
- recovery paths
- inheritance paths

But visual composition must map deterministically to real policy.

A beautiful visual arrangement is not itself a valid policy.

Technical validation must always remain authoritative.

---

# 80. Design Must Scale From Beginner to Expert

A beginner should be able to understand:

> “Two of these three keys are required.”

An expert should be able to inspect:

- descriptor
- policy
- fingerprints
- script structure
- transaction data
- Core state

without leaving the product.

Core Vault should reduce unnecessary complexity.

It should not remove technical depth.

---

# 81. Do Not Hide Bitcoin Core

Bitcoin Core should not dominate ordinary workflows.

But its existence must remain visible and understandable.

The user should eventually know:

> “This environment is controlling my local Bitcoin Core.”

Not:

> “Core Vault is some independent magic wallet.”

The Engine Room provides an explicit conceptual home for this understanding.

---

# 82. No False Sense of Physical Security

The visual language may feel robust and secure.

That must not imply guarantees that software cannot provide.

A glowing sealed vault does not mean:

- the operating system is uncompromised
- the computer is physically secure
- the backup exists in multiple locations
- the user cannot lose the passphrase
- malware cannot steal unlocked keys

Security language must remain factual.

---

# 83. Offline Mode Should Feel Intentional

An offline signer should not appear broken merely because the network is unavailable.

The environment should distinguish:

- malfunction
- intentional network-disabled operation
- Core unavailable
- unsynchronized Core
- offline signing state

This is especially important for advanced self-custody.

---

# 84. Familiar Bitcoin Terms Should Remain Reachable

Core Vault may initially say:

> “Key”

instead of:

> “xpub”

or:

> “Transaction proposal”

instead of:

> “PSBT”

But the technical term should remain discoverable.

The application should create a bridge:

> intuitive concept → Bitcoin term → technical implementation

not a permanent abstraction wall.

---

# 85. Avoid Product-Specific Lock-In Language

The user should learn concepts transferable beyond Core Vault.

Prefer:

> “2-of-3 multisignature”

over invented proprietary terminology.

Prefer:

> “Bitcoin Core wallet backup”

over a proprietary “Core Vault Recovery Capsule” as the only explanation.

Metaphors may have names.

Technical truth must remain visible.

---

# 86. Every Major Design Decision Should Answer Three Questions

Before approving a design, ask:

### 1. Does it improve understanding?

### 2. Does it preserve technical truth?

### 3. Does it strengthen the feeling of inhabiting the Core Vault world?

If a feature satisfies only the third question, it may be decorative.

If it satisfies only the first two but destroys the spatial experience, it may be conventional software creeping back into the product.

Core Vault requires all three whenever reasonably possible.

---

# 87. Priority Order

When principles conflict, use this priority order:

1. Bitcoin correctness
2. Security clarity
3. User control
4. Comprehension
5. Accessibility
6. Responsiveness
7. Spatial coherence
8. Atmosphere
9. Visual spectacle

Visual spectacle is intentionally last.

---

# 88. Non-Negotiable Rejection Criteria

A proposed major UI direction should be rejected if it primarily consists of:

- card dashboards
- standard SaaS layouts
- decorative room backgrounds
- permanent forms
- large navigation bars
- static concept art with overlays
- fake 3D depth
- game HUD styling
- cyberpunk aesthetics
- crypto trading aesthetics
- balance-centric design
- excessive gamification
- visual metaphors disconnected from Core state

Even if such a design is attractive, it is not aligned with Core Vault.

---

# 89. Definition of a Successful Core Vault Design

A successful Core Vault experience should allow a user to say:

> “I know where my backups live.”

> “I can see whether my node is connected.”

> “I understand why this transaction needs another key.”

> “I know where to go to create a new vault.”

> “I understand what this machine is doing.”

without requiring them to memorize software navigation.

A more advanced user should additionally be able to say:

> “I can inspect exactly how Core Vault maps this visual model to Bitcoin Core.”

That combination is the goal.

---

# 90. Final Design Principle

The ultimate design standard is:

> **Core Vault should make Bitcoin Core feel tangible without making Bitcoin simplistic.**

The environment should remove unnecessary cognitive burden.

It should not remove responsibility.

It should create intuition.

It should not create illusion.

It should feel alive.

It should remain calm.

It should feel like a place.

And underneath that place, Bitcoin Core must continue doing the real work.