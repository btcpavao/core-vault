# Core Vault — Vision & Philosophy

**Document:** 01 / Project Foundation  
**Status:** Foundational  
**Applies to:** Entire Core Vault project  
**Purpose:** Define what Core Vault is, why it exists, how it should feel, and which product principles must remain true regardless of implementation details.

---

# 1. Purpose of This Document

This document defines the fundamental vision of Core Vault.

It is not a feature specification.

It is not a UI mockup.

It is not a technical implementation guide.

It is not a list of Bitcoin Core RPC methods.

It is the conceptual foundation against which every future design, engineering, product, and architectural decision must be evaluated.

Whenever an implementation choice conflicts with this document, the implementation should normally change rather than the vision being silently diluted.

The purpose of Core Vault is not merely to make Bitcoin Core prettier.

The purpose is to create a fundamentally different human interface to Bitcoin self-custody while preserving Bitcoin Core as the underlying engine.

---

# 2. The Core Idea

Core Vault is a desktop environment for interacting with Bitcoin Core through a spatial, visual, calm, and intuitive interface.

The simplest mental model is:

> **Bitcoin Core is the engine. Core Vault is the environment through which a human interacts with that engine.**

Bitcoin Core remains responsible for Bitcoin.

Core Vault is responsible for making Bitcoin Core understandable, approachable, tangible, and pleasant to use.

Core Vault should not attempt to become a competing wallet engine.

It should not reproduce cryptographic functionality that Bitcoin Core already performs correctly.

It should instead translate Bitcoin Core's capabilities into a coherent human experience.

---

# 3. Core Vault Is Not a Traditional Wallet Application

Most Bitcoin wallet software follows a familiar application model:

- navigation sidebar
- account balance
- Send button
- Receive button
- settings page
- transaction list
- forms
- dialogs
- tables
- technical labels

Even when visually polished, these applications generally remain variations of the same software metaphor.

Core Vault intentionally rejects that model as its primary interface.

Core Vault should not feel like:

- a banking dashboard
- an exchange interface
- an accounting tool
- a generic desktop utility
- a website packaged as a desktop application
- an administrative frontend for Bitcoin Core
- a collection of forms placed over decorative artwork

It should feel like entering a **place**.

---

# 4. Core Vault Is a Place

The most important design principle of the entire project is:

> **The world is the interface.**

The user should experience Core Vault as a coherent digital environment containing spaces, objects, mechanisms, and meaningful physical metaphors.

The user does not primarily navigate menus.

The user moves between places.

The user does not primarily operate abstract buttons.

The user interacts with objects.

The user does not merely read system state.

The state of the environment communicates what the system is doing.

The conceptual difference is fundamental.

A traditional application asks:

> “Which controls should appear on this page?”

Core Vault should instead ask:

> “If this Bitcoin operation existed as a physical process inside this world, what would the user see, approach, touch, activate, observe, and understand?”

---

# 5. The Desired Psychological Experience

Opening Core Vault should feel closer to entering a beautifully designed point-and-click adventure environment or a sophisticated virtual control space than opening a conventional software utility.

This does **not** mean Core Vault is a game.

Core Vault should borrow from games only where games have solved problems of:

- spatial presence
- environmental storytelling
- intuitive object interaction
- visual hierarchy
- atmosphere
- smooth navigation
- audiovisual feedback
- spatial memory
- emotional engagement

The user should have the feeling:

> “I am inside my Bitcoin environment.”

Not:

> “I am looking at a Bitcoin dashboard.”

---

# 6. Game-Like Experience Without Gamification

Core Vault may feel game-like, but it must never become gamified.

There should be no:

- points
- levels
- experience bars
- streaks
- achievements
- artificial rewards
- loot
- daily engagement mechanisms
- attention traps
- behavioral manipulation
- fake urgency
- celebratory effects for ordinary financial actions

Bitcoin does not need engagement mechanics.

The user should return because the environment is useful, calm, understandable, and enjoyable to inhabit.

The purpose of atmosphere is not retention.

The purpose of atmosphere is to reduce cognitive friction and create a calm mental state for interacting with money.

---

# 7. A Place for Bitcoin, Not Merely a Transaction Tool

Core Vault should be useful even when the user does not intend to send or receive bitcoin.

A user may open Core Vault simply to:

- observe their Bitcoin Core node
- see synchronization progress
- watch the local mempool change
- observe a new block arriving
- inspect their vaults
- review backup status
- learn how their wallet works
- study multisignature policies
- understand keys
- explore Bitcoin concepts
- spend several quiet minutes inside their Bitcoin environment

This is intentional.

Core Vault should become a digital place where a user can maintain an ongoing relationship with their Bitcoin infrastructure.

It should be possible to simply **be there**.

---

# 8. Calmness Is a Security Feature

Bitcoin operations frequently involve irreversible decisions.

Sending bitcoin, backing up wallets, managing keys, restoring funds, or signing transactions should not happen in an environment that creates urgency or sensory overload.

Core Vault should therefore cultivate:

- calm
- clarity
- intentionality
- patience
- focus
- visual order
- predictable interaction

The atmosphere should encourage the user to slow down enough to understand what they are doing.

This does not mean making operations slow.

Functional interactions should remain efficient.

The distinction is:

> **Fast software does not need to feel rushed.**

A transaction may technically take seconds to prepare while the interface still feels composed and deliberate.

---

# 9. Bitcoin Core Remains the Authority

Core Vault should maintain a strict conceptual separation between:

### Bitcoin Core
The system that understands Bitcoin.

and

### Core Vault
The system that helps a human understand and operate Bitcoin Core.

Where practical, Bitcoin Core should remain the source of truth for:

- wallets
- private keys
- descriptors
- transaction construction
- transaction signing
- PSBT processing
- addresses
- balances
- blockchain state
- mempool state
- network state
- peer state
- wallet encryption
- wallet backup
- wallet restoration

Core Vault should avoid inventing parallel representations of sensitive Bitcoin state.

When Core Vault visualizes something, the visualization should correspond to real underlying Bitcoin Core state whenever possible.

---

# 10. Metaphors Must Be Truthful

Core Vault relies heavily on metaphor.

That creates responsibility.

A beautiful metaphor that teaches the wrong mental model is worse than an ugly interface.

Therefore:

> **Every visual metaphor should remain faithful to the underlying Bitcoin concept.**

Examples:

A **vault** can represent a wallet and its spending policy.

A **key artefact** can represent signing authority.

A **backup capsule** can represent a Bitcoin Core wallet backup.

A **machine or reactor** can represent the running Bitcoin Core node.

Energy conduits can represent active network connectivity.

A disabled conduit can represent Bitcoin Core network activity being disabled.

A group of three keys with two required activation paths can represent a 2-of-3 multisignature policy.

A time mechanism may represent a timelock only if the underlying policy actually contains that timelock.

The application must never show metaphorical state that contradicts actual Bitcoin state.

---

# 11. Spatial Memory Over Menu Memory

One of the intended benefits of the spatial model is that users learn **where things happen**.

Instead of remembering:

> “Backup is item five under Wallet Tools.”

The user remembers:

> “Backup happens in the Archive.”

Instead of:

> “Node information is in Settings → Advanced → Network.”

The user remembers:

> “The Bitcoin Core machine is in the Engine Room.”

Instead of:

> “Multisig is under Create Wallet → Advanced.”

The user remembers:

> “Vaults are constructed in the Workshop.”

This is closer to how humans remember physical environments.

Core Vault should deliberately use spatial memory as part of its usability model.

---

# 12. The Main Spaces of Core Vault

The long-term world is organized around several semantic spaces.

Their exact visual implementation may evolve, but their conceptual roles should remain stable.

## Main Hall

The central orientation space.

It represents the user's Bitcoin environment as a whole.

From here, the user can see or access their vaults and travel to the major functional areas.

---

## Workshop

The place where vault structures are created and configured.

This is where concepts such as:

- single-signature
- multiple keys
- signing thresholds
- future timelocks
- recovery structures
- future Taproot policy structures

become tangible.

The Workshop should feel like constructing a mechanism rather than filling out a configuration form.

---

## Vault Chamber

The place where the user interacts with an individual wallet or vault.

This is where the user's actual bitcoin holdings, receiving capability, spending capability, signing state, and vault-specific information are experienced.

---

## Archive

The place where backups, recovery, and verification live.

Backup should feel like preserving something important.

Restore should feel like recovering something preserved.

The Archive should communicate durability and continuity.

---

## Communications

The interface between the user's vault and the Bitcoin network.

Receive, Send, PSBT transport, transaction review, signing coordination, finalization, and broadcast belong conceptually here.

---

## Engine Room

The physical metaphor for Bitcoin Core itself.

The Engine Room represents:

- Bitcoin Core running
- blockchain synchronization
- P2P network activity
- peer connectivity
- local node health
- local mempool activity
- block arrival

Bitcoin Core should not be completely hidden.

The user should be able to understand that Core Vault is powered by a real Bitcoin node.

---

## Observatory

The place for observing Bitcoin.

It should allow the user to watch:

- blocks
- mempool activity
- node state
- network activity
- the rhythm of their local Bitcoin system

It is intentionally less task-oriented than other spaces.

It is a place for observation and contemplation.

---

## Library

The educational layer of Core Vault.

Users who want deeper knowledge should be able to explore:

- keys
- descriptors
- PSBT
- Bitcoin Core wallets
- multisig
- Taproot
- timelocks
- backups
- blocks
- mempool
- Bitcoin network behavior

Learning should be available without being forced on users who simply want to complete a task.

---

# 13. Objects Are Controls

In conventional software, controls are usually abstract:

- buttons
- switches
- dropdowns
- cards
- checkboxes

In Core Vault, whenever practical, the primary control should be a meaningful object in the environment.

Examples:

A key is not merely an icon beside an “Add signer” button.

The key itself is the object the user interacts with.

A backup capsule is not decoration beside a “Create backup” button.

The capsule itself represents the backup operation.

The Core reactor is not background art behind a “Network active” checkbox.

Its physical state reflects whether the node and network are active.

This principle is known as a **diegetic interface**: the interface exists inside the world.

---

# 14. Conventional UI Still Has a Role

Core Vault should not become dogmatic about diegetic design.

Some information must remain extremely precise.

For example:

- Bitcoin addresses
- amounts
- transaction fees
- change outputs
- network selection
- wallet passphrases
- backup file locations
- transaction confirmation
- signature counts
- error messages

For these operations, conventional interface components may be safer and clearer.

Therefore Core Vault should use a hybrid model:

### Primary layer
Spatial, environmental, diegetic interaction.

### Secondary layer
Contextual panels containing precise conventional controls when required.

The conventional UI should appear **when needed**, then retreat when the task is complete.

The default state of a room should be the room itself, not a form.

---

# 15. Progressive Disclosure

Bitcoin is technically deep.

Core Vault should not pretend otherwise.

But users should not be required to understand every technical implementation detail before safely using the system.

Information should therefore be layered.

For example, a key might expose:

### Level 1 — Intuitive

> “This key can approve spending from this vault.”

### Level 2 — Functional

> “Any two of these three keys are required to spend bitcoin.”

### Level 3 — Technical

- key fingerprint
- descriptor information
- derivation data
- wallet role
- relevant Bitcoin Core information

Technical depth remains available.

It simply does not occupy the entire interface by default.

---

# 16. Core Vault Should Teach Through Experience

An important long-term goal is that a user becomes more knowledgeable simply by using Core Vault.

A user may initially understand only:

> “I have a vault and three keys. I need two keys to spend.”

Later, through optional exploration, the same user may learn:

- what multisig actually means
- what a descriptor is
- what a PSBT contains
- how Bitcoin Core stores wallet information
- how a transaction is constructed
- how Taproot policies work
- how timelocks alter spending conditions

The interface should therefore function both as:

- an operating environment
- an educational model of Bitcoin

These roles should reinforce each other.

---

# 17. Visual Philosophy

The visual world of Core Vault combines two apparently different qualities:

### Ancient permanence

represented through:

- Mediterranean architecture
- limestone
- stone
- arches
- sunlight
- bronze
- structural simplicity
- coastal openness

and:

### Advanced computation

represented through:

- glass
- precision mechanisms
- blue energy
- golden energy
- light channels
- contained power
- subtle technological motion

The result should feel neither ancient nor futuristic.

It should feel **timeless**.

The environment should suggest:

- permanence
- sovereignty
- precision
- stewardship
- calm intelligence

It should not resemble:

- cyberpunk
- casino aesthetics
- cryptocurrency marketing
- steampunk
- fantasy
- military control rooms
- hacker terminals
- corporate SaaS
- generic sci-fi HUDs

---

# 18. Reference Artwork Is a World Reference, Not UI Artwork

Existing illustrations from related Bitcoin Core articles may be provided to developers and design systems.

These images serve as:

- mood references
- material references
- lighting references
- architectural references
- color references
- visual language references

They are **not final application backgrounds**.

They should not simply be placed behind HTML interfaces.

Core Vault requires new environments specifically designed around the function of each room.

The correct process is:

> Study the reference art → understand its visual DNA → design original Core Vault spaces using the same language.

Not:

> Import the reference art → place buttons over it.

---

# 19. Real-Time Environment

Core Vault should feel alive.

Not busy.

Alive.

The environment may include subtle continuous motion:

- changing sunlight
- reflections
- floating dust
- slow ocean movement
- restrained mechanical motion
- energy flowing through conduits
- reactor pulses
- slight movement in architectural elements
- ambient particles

Some animation should also correspond to real Bitcoin events.

Examples:

A new block arrives.

The Engine Room briefly responds.

A signature is added.

A key activates.

A backup completes.

A capsule seals.

Bitcoin Core network activity is disabled.

External energy conduits go dark while the local machine remains alive.

These interactions should allow a user to **feel system state**, not merely read it.

---

# 20. Sound Philosophy

Sound is optional, subtle, and environmental.

Core Vault should never require audio.

When enabled, sound should deepen presence rather than demand attention.

Examples:

- distant sea ambience
- extremely subtle mechanical hum
- quiet energy resonance
- a soft physical sound when a backup capsule seals
- a restrained tone when a signature is accepted
- a gentle low-frequency pulse when a new block arrives

Sound should never resemble:

- slot machines
- achievement sounds
- mobile game rewards
- alarm-heavy financial software

A useful rule:

> The user should notice the ambience more when it is turned off than while it is playing.

---

# 21. No Artificial Engagement

Core Vault should never attempt to maximize:

- session length
- daily active usage
- notifications
- clicks
- transaction frequency

There is no growth funnel inside the product experience.

There is no incentive to transact more often.

There is no incentive to open the application unnecessarily.

The environment should simply be pleasant enough that when the user **chooses** to spend time there, the experience feels worthwhile.

---

# 22. Self-Custody Means Responsibility

Core Vault should make Bitcoin easier to understand without creating the false impression that self-custody is consequence-free.

The product must remain clear about:

- irreversible transactions
- backup responsibility
- lost passphrases
- key loss
- insufficient multisig backups
- compromised devices
- incorrect receiving addresses
- incorrect spending policies

Visual elegance must never hide responsibility.

The interface should be reassuring without being falsely reassuring.

---

# 23. Security Before Spectacle

Whenever visual spectacle conflicts with security clarity, security clarity wins.

Always.

For example:

A transaction confirmation screen may temporarily become more conventional and information-dense than the surrounding environment.

That is acceptable.

The user must be able to verify:

- destination
- amount
- fee
- change
- network
- signing state

without ambiguity.

Core Vault exists to make Bitcoin easier to operate safely, not to make dangerous operations look beautiful.

---

# 24. Offline Operation Is a First-Class Concept

Core Vault should treat offline signing as a legitimate operating mode rather than an edge case.

A Bitcoin Core instance may be:

- synchronized and online
- running with Bitcoin Core network activity disabled
- deliberately isolated for signing
- temporarily disconnected

The environment should make these differences intuitive.

The application must not falsely claim that disabling Bitcoin Core network activity proves that a computer is physically air-gapped.

The metaphor should remain technically honest.

---

# 25. Taproot as a Long-Term Design Direction

Core Vault should ultimately make sophisticated Bitcoin spending policies understandable through visual composition.

Taproot, Miniscript, multisig, recovery paths, and timelocks may eventually become objects and relationships inside the Workshop.

For example:

- keys
- thresholds
- branches
- recovery conditions
- time mechanisms

could be assembled visually into a spending policy.

However, visual simplicity must never hide policy complexity.

The application must never compile an ambiguous or insufficiently reviewed policy simply because its graphical representation looks intuitive.

The long-term ambition is:

> Make powerful Bitcoin policy understandable without making Bitcoin policy careless.

---

# 26. The User Should Develop Intuition

A successful Core Vault user may eventually think about Bitcoin differently.

Instead of:

> “My app has 0.5 BTC.”

The user may think:

> “This vault contains my long-term savings.”

Instead of:

> “I need to sign a PSBT.”

The user may think:

> “Two independent keys must authorize this transfer.”

Instead of:

> “My wallet.dat was copied.”

The user may think:

> “I have verified backups of this vault.”

Instead of:

> “bitcoind is synchronized.”

The user may think:

> “My Bitcoin engine is fully caught up and connected.”

The metaphors should lead toward greater technical understanding, not away from it.

---

# 27. Emotional Tone

Core Vault should feel:

- calm
- thoughtful
- deliberate
- warm
- sophisticated
- trustworthy
- private
- quiet
- precise
- enduring

It should not feel:

- playful
- frantic
- corporate
- sterile
- intimidating
- hacker-oriented
- financialized
- speculative
- luxurious for the sake of status

It should feel like an environment designed for something important.

---

# 28. Relationship With Bitcoin

Core Vault should reflect a particular view of Bitcoin usage.

Bitcoin is not treated primarily as:

- a speculative asset
- a ticker
- a portfolio chart
- a payment gimmick
- an exchange balance

Bitcoin is treated as:

- money under the user's control
- a bearer asset
- an infrastructure system
- a cryptographic ownership system
- something worth understanding
- something worth preserving carefully

There should therefore be no need for:

- fiat price charts
- token prices
- trading information
- news feeds
- promotional products
- yield
- staking
- exchange integrations

Core Vault's world is centered on **ownership, verification, custody, and sovereignty**.

---

# 29. Desktop First

Core Vault is currently conceived as a desktop application for:

- macOS
- Windows
- Linux

The desktop format is intentional.

The larger screen allows:

- spatial composition
- rich environments
- deliberate transaction review
- multi-device signing workflows
- node operation
- backup management
- educational exploration

A mobile version is not part of the foundational product vision at this stage.

The desktop application should not be visually constrained by assumptions inherited from mobile-first web design.

---

# 30. The Technology Must Serve the Experience

The visual ambition of Core Vault may require technologies normally associated with interactive real-time environments.

The project should not insist on conventional web rendering if that prevents the intended experience.

The implementation may ultimately use:

- a real-time 3D renderer
- Three.js
- React Three Fiber
- another appropriate scene engine
- native rendering
- layered 2.5D techniques
- a hybrid architecture

The exact technology is a technical decision.

The non-negotiable product requirement is:

> **The application must feel like inhabiting an interactive environment, not like using a web page decorated to resemble one.**

Technology should be selected in service of that requirement.

---

# 31. The Application and the World Are Separate From the Bitcoin Backend

The project should conceptually separate:

### Bitcoin domain layer

Responsible for:

- Core RPC
- wallets
- signing
- backup
- restore
- PSBT
- network state
- blockchain data

from:

### Experience layer

Responsible for:

- rooms
- scene state
- camera
- objects
- lighting
- animation
- sound
- interaction
- contextual panels

This separation is essential.

The Bitcoin backend should remain testable independently of the visual world.

The visual world should be replaceable or evolvable without rewriting wallet logic.

---

# 32. Existing Functional Work Should Be Preserved

Previous prototypes may contain useful and functioning:

- Bitcoin Core connectivity
- RPC adapters
- wallet workflows
- backup and restore logic
- multisig coordination
- PSBT logic
- state management
- tests

A failed visual direction does not invalidate this work.

Core Vault should preserve correct functional infrastructure whenever possible while replacing presentation layers that do not satisfy the vision.

The project should not be restarted from zero merely because the visual model changes.

---

# 33. What Core Vault Must Never Devolve Into

During implementation, there will be pressure to simplify the design back into familiar software patterns.

This document explicitly rejects the following final outcomes.

Core Vault must not become:

### A dashboard with beautiful backgrounds

If the visual environment can be removed and the same UI still functions as a standard dashboard, the spatial design is too superficial.

### A collection of pages named after rooms

A page titled “Workshop” is not a Workshop.

A page titled “Archive” is not an Archive.

The environment must meaningfully shape interaction.

### A web application wearing a game skin

The experience must come from scene composition, interaction, movement, state, and spatial semantics — not merely custom CSS.

### A game with Bitcoin functionality

Bitcoin remains the serious purpose of the software.

The game-like qualities exist only to improve usability, presence, understanding, and atmosphere.

### A visual metaphor that lies

No visual simplification may misrepresent spending authority, backups, network status, transaction state, or Bitcoin Core behavior.

---

# 34. The Fundamental Product Test

For every major feature, ask:

> **Would this interaction still make conceptual sense if Core Vault were a real physical place?**

For example:

Creating a vault in a Workshop makes sense.

Storing and testing a backup in an Archive makes sense.

Observing Bitcoin Core machinery in an Engine Room makes sense.

Watching network activity in an Observatory makes sense.

Receiving and transmitting information in Communications makes sense.

Learning in a Library makes sense.

If a feature has no meaningful spatial representation, it may still use a contextual conventional interface.

The spatial metaphor exists to clarify, not to force every operation into theatre.

---

# 35. The Visual Test

For every major screen or scene, ask:

> **Does this look like an application placed over concept art, or does it look like an interactive place?**

If the answer is:

> “application placed over concept art”

the scene is not complete.

The desired result is that a screenshot taken without context could plausibly look like a frame from a sophisticated interactive digital environment.

Only upon closer inspection should it become obvious that the environment is actually controlling Bitcoin Core.

---

# 36. The Interaction Test

For every important action, ask:

> **Is the meaningful object itself interactive, or is the object merely decoration beside a generic button?**

Prefer:

- click the key
- activate the vault
- select the capsule
- approach the terminal
- inspect the reactor

over:

- press “Add Key”
- press “Create Vault”
- press “Backup”
- press “Receive”
- press “Node Status”

provided the resulting interaction remains discoverable and accessible.

---

# 37. The Calmness Test

For every animation, sound, notification, and visual effect, ask:

> **Does this make the user more aware of what is happening, or merely make the software more stimulating?**

If it only adds stimulation, remove it.

Bitcoin software does not need fireworks.

It needs presence.

---

# 38. The Truthfulness Test

For every visual state, ask:

> **Can this state be justified by real application or Bitcoin Core data?**

If not, determine whether it is clearly atmospheric decoration or whether it risks implying false system state.

Atmospheric motion is allowed.

Fake Bitcoin state is not.

---

# 39. The Long-Term Vision

The long-term ambition of Core Vault is to create a new category of Bitcoin interface.

Not a wallet with a different skin.

Not an educational simulation.

Not a game.

Not a node dashboard.

Rather:

> **A spatial operating environment for personal Bitcoin custody, powered by Bitcoin Core.**

A place in which:

- Bitcoin Core is visible and understandable
- keys become intuitive
- multisig becomes tangible
- backups become meaningful
- transaction signing becomes comprehensible
- advanced Bitcoin policy becomes visually approachable
- users can both operate and learn
- technical depth remains available
- the environment remains calm enough for serious financial decisions

Core Vault should make sophisticated self-custody feel understandable without pretending it is trivial.

---

# 40. North Star

The final north star of the project is:

> **Core Vault should feel like entering a quiet, beautifully designed Bitcoin facility that belongs entirely to the user — a place where their node runs, their vaults exist, their keys have meaning, their backups are preserved, and the machinery of Bitcoin can be seen and understood.**

The software disappears as much as possible.

The environment remains.

Bitcoin Core does the real work underneath.

And the user gains something that conventional wallet interfaces rarely provide:

**intuition.**