# Core Vault — Technical Architecture

**Document:** 03 / Project Foundation  
**Status:** Foundational Technical Architecture  
**Depends on:**  
- `01_VISION_AND_PHILOSOPHY.md`
- `02_DESIGN_PRINCIPLES.md`

**Applies to:** Desktop application architecture, Bitcoin Core integration boundaries, real-time rendering, scene system, application state, security boundaries, asset architecture, testing, packaging, performance, and future implementation decisions.

---

# 1. Purpose of This Document

This document defines the technical architecture required to implement the Core Vault vision.

The previous documents establish that Core Vault must feel like an inhabitable interactive environment rather than a conventional web application.

This document translates that product requirement into software architecture.

The central technical principle is:

> **Bitcoin functionality and the immersive world must be separate systems connected by a strict application-state boundary.**

The immersive environment is not allowed to become the Bitcoin wallet engine.

Bitcoin Core remains responsible for Bitcoin operations.

The experience layer observes domain state, sends explicit user intentions to the application layer, and visualizes the resulting confirmed state.

---

# 2. Architectural North Star

Core Vault consists conceptually of two major systems.

## System A — Bitcoin System

Responsible for truth.

It contains:

- Bitcoin Core RPC communication
- wallet operations
- descriptors
- backup and restore
- transaction creation
- PSBT processing
- signing
- network state
- blockchain state
- mempool state
- peer state
- security-sensitive operations

## System B — Experience System

Responsible for human interaction.

It contains:

- rooms
- camera
- scene graph
- 3D objects
- materials
- lighting
- animation
- audio
- environmental state
- interaction
- contextual panels
- spatial transitions

The two systems communicate through a controlled application/domain interface.

The experience system must never directly implement Bitcoin cryptographic logic.

---

# 3. Preserve Existing Functional Work

The existing Core Vault prototype contains functional work that may already include:

- Bitcoin Core connectivity
- RPC wrappers
- wallet creation
- wallet encryption
- backup
- restore
- receive
- transaction construction
- PSBT handling
- multisig coordination
- application state
- error handling
- tests

This work must be inspected before architectural changes are made.

Do not discard working Bitcoin functionality merely because the existing presentation layer is being replaced.

The intended migration model is:

> **Preserve the working Bitcoin/domain layer and replace the experience layer around it.**

If existing backend code is tightly coupled to the current UI, refactor the boundary rather than rewriting Bitcoin behavior from scratch.

---

# 4. Do Not Restart the Project From Zero

Core Vault should remain in the existing repository.

Do not create a separate project merely because the rendering model changes.

The existing repository remains the source of truth for:

- source code
- documentation
- tests
- assets
- build configuration
- application packaging

If a new experience-layer directory or package is required, create it within the existing repository.

---

# 5. Desktop Application

Core Vault is a desktop application.

Supported target platforms:

- macOS
- Windows
- Linux

Core Vault is not currently a:

- browser application
- hosted web service
- mobile application
- cloud wallet
- website

No application functionality should require a remote Core Vault backend.

The user should be able to operate Core Vault entirely with their local Bitcoin Core instance.

---

# 6. Rendering Direction

The primary Core Vault world must use a **real-time scene renderer**.

A conventional DOM/CSS application shell is not sufficient as the primary experience layer.

The preferred rendering architecture is:

- Three.js
- React Three Fiber
- TypeScript
- WebGL/WebGPU where supported through the selected renderer
- glTF / GLB assets
- physically based materials
- real-time lighting
- controlled post-processing
- spatial audio where appropriate

The exact rendering implementation may evolve, but the product must use a scene architecture capable of:

- perspective
- depth
- camera motion
- dynamic lighting
- interactive objects
- scene composition
- real object animation
- procedural state changes
- realistic materials

The application should feel like a lightweight real-time interactive environment.

---

# 7. Why a Real-Time Renderer Is Required

The previous prototype demonstrated that:

- static background images
- CSS overlays
- vector animation over illustrations
- conventional card layouts

cannot deliver the intended experience.

The required product experience depends on:

- actual depth
- controlled camera perspective
- object focus
- architectural space
- lighting relationships
- realistic object presence
- visual continuity between rooms
- animated state embedded in objects

These are scene problems, not conventional webpage layout problems.

---

# 8. Core Vault Is Not a Full Game Engine Project

Using real-time 3D does not mean Core Vault should become a conventional video game codebase.

Do not introduce:

- character controllers
- combat systems
- physics gameplay
- inventory systems
- AI agents
- multiplayer
- world streaming infrastructure
- quest systems
- game progression

The real-time renderer exists to provide:

- spatial presence
- object interaction
- visual state
- atmosphere
- navigation
- comprehension

The architecture should remain substantially simpler than a general-purpose game.

---

# 9. No Free-Roaming First-Person Movement

The initial Core Vault experience should not require WASD navigation, free-look mouse control, or first-person movement.

Navigation should be controlled.

The user interacts with:

- room exits
- architectural hotspots
- objects
- vaults
- machinery

The camera then transitions intentionally.

This creates the presence of a 3D world without creating the usability burden of navigating a game character.

---

# 10. Camera Model

Core Vault should use a curated camera system.

Each room defines:

- default camera position
- default camera target
- object focus positions
- exit transition positions
- contextual interaction positions

The camera may:

- dolly
- pan
- orbit slightly
- change focus
- move through architectural transitions

The camera must not behave unpredictably.

The user should never be required to manually align the camera to perform a Bitcoin operation.

---

# 11. Room-Based Scene Architecture

The world is divided into logical scenes.

Initial primary scenes:

- Main Hall
- Workshop
- Vault Chamber
- Archive
- Communications
- Engine Room
- Observatory
- Library

Each room should be represented as a scene module.

Example conceptual structure:

```text
experience/
  scenes/
    main-hall/
    workshop/
    vault-chamber/
    archive/
    communications/
    engine-room/
    observatory/
    library/
```

Each scene owns:

- scene composition
- room-specific assets
- local lights
- environment
- interactive hotspots
- room animation
- room audio
- camera anchors

It does not own Bitcoin Core logic.

---

# 12. Shared World Systems

The following systems should be shared across scenes:

```text
experience/
  world/
    CameraSystem
    SceneRouter
    TransitionSystem
    InteractionSystem
    FocusSystem
    LightingSystem
    AudioSystem
    AmbientSystem
    PerformanceManager
    AccessibilityBridge
```

Rooms should use common infrastructure rather than reimplementing navigation and interaction independently.

---

# 13. Scene Router

The Scene Router is responsible for logical room transitions.

Conceptual states:

```text
MAIN_HALL
WORKSHOP
VAULT_CHAMBER
ARCHIVE
COMMUNICATIONS
ENGINE_ROOM
OBSERVATORY
LIBRARY
```

The router determines:

- destination scene
- transition animation
- camera path
- scene preload requirements
- active audio environment
- which objects require data

The router should not resemble a visible web navigation system.

It is an internal application service.

---

# 14. Scene Transition Architecture

A room transition should follow roughly:

1. user activates a semantic exit
2. interaction is temporarily locked
3. destination assets are preloaded if necessary
4. camera transition begins
5. outgoing ambience fades
6. architectural transition occurs
7. destination scene becomes active
8. destination ambience fades in
9. interaction unlocks

The transition must remain short enough to support frequent use.

Reduced Motion mode replaces cinematic movement with a minimal transition.

---

# 15. World Coordinates Must Be Meaningful

Scene objects should not be arbitrarily positioned without structure.

Each room should define:

- coordinate system
- functional zones
- camera-safe area
- interaction-safe area
- foreground occlusion limits
- UI projection regions

This becomes especially important when contextual UI must visually originate from a 3D object.

---

# 16. 3D Asset Standard

Primary interactive assets should use glTF / GLB where possible.

This provides:

- PBR materials
- animation clips
- efficient loading
- hierarchy
- named nodes
- compression support
- broad tooling compatibility

Do not make application logic dependent on unnamed mesh indices.

Important objects must expose stable semantic node names.

Example:

```text
Vault_OuterShell
Vault_Core
Vault_KeySlot_A
Vault_KeySlot_B
Vault_KeySlot_C
Vault_EnergyRing
```

---

# 17. Semantic Asset Contracts

Interactive objects must define a semantic contract.

A key model may expose:

```text
KeyBody
KeyCore
EnergyChannel
ActivationRing
```

A Core reactor may expose:

```text
ReactorCore
SyncRing
NetworkConduits
OuterShell
StatusLight
```

Application animation should target semantic elements rather than fragile mesh positions.

---

# 18. Asset Independence

Business logic must not depend on a particular 3D model.

If the Vault model is later replaced with better artwork, wallet functionality must continue working.

Therefore:

> Domain state maps to semantic visual state, not directly to mesh implementation.

Example:

```text
vault.signatureProgress = 1 / 2
```

maps to:

```text
VisualVaultState.PARTIALLY_AUTHORIZED
```

The renderer then decides how that state looks.

---

# 19. Visual State Adapter

Introduce an explicit layer between domain state and visual state.

Example:

```text
Bitcoin/Application Domain
        ↓
Visual State Adapter
        ↓
Scene State
        ↓
3D Object State
```

This prevents 3D components from directly interpreting raw Bitcoin Core responses.

---

# 20. Example State Mapping

Bitcoin state:

```text
core.connected = true
core.networkActive = false
core.syncProgress = 1.0
```

maps to:

```text
engine.powerState = ACTIVE
engine.syncState = SYNCED
engine.networkState = ISOLATED
```

The Engine Room renderer maps this to:

- active reactor core
- stable sync ring
- inactive external conduits

The scene never needs to understand the RPC itself.

---

# 21. Strict Domain Boundary

3D scene components must not call:

- raw Bitcoin RPC
- filesystem APIs
- wallet file APIs
- credential APIs

directly.

Incorrect:

```text
EngineRoom.tsx
→ getblockchaininfo RPC
```

Correct:

```text
EngineRoom
→ application state
→ Core service
→ RPC adapter
```

This boundary is mandatory.

---

# 22. Application Layers

The target architecture should contain approximately these layers:

```text
Desktop Host
│
├── Bitcoin Core Transport
│
├── Bitcoin Core Adapter
│
├── Domain Services
│
├── Application State
│
├── Visual State Adapter
│
├── Experience Renderer
│
└── Contextual UI
```

Each layer has a distinct responsibility.

---

# 23. Bitcoin Core Transport

The transport layer handles:

- JSON-RPC transport
- authentication
- wallet-specific RPC paths
- timeout
- cancellation
- serialization
- RPC errors
- transport errors

It should contain no product UX decisions.

---

# 24. Bitcoin Core Adapter

The adapter presents typed operations such as:

```text
getCoreStatus()
createWallet()
backupWallet()
restoreWallet()
createAddress()
createSpendProposal()
signPsbt()
finalizePsbt()
broadcastTransaction()
getMempoolSummary()
getPeerSummary()
```

The rest of the application should not need to know raw RPC syntax.

---

# 25. Domain Services

Domain services coordinate multi-step operations.

Examples:

```text
VaultService
BackupService
RestoreService
TransactionService
SigningService
NodeService
MultisigService
```

A service may combine several RPC calls into one meaningful user operation.

---

# 26. Application State

Application state represents user-visible truth.

Recommended conceptual stores:

```text
CoreState
VaultState
TransactionState
PsbtState
BackupState
NavigationState
SettingsState
ExperienceState
```

Do not duplicate the same state independently in multiple scenes.

---

# 27. State Machines for Critical Flows

Critical workflows should use explicit state machines rather than loosely connected booleans.

Examples:

## Backup

```text
idle
preparing
writing
verifying
complete
failed
```

## Transaction

```text
draft
funded
review
awaiting-signature
partially-signed
threshold-reached
finalized
ready-to-broadcast
broadcasting
broadcast
failed
```

## Core

```text
disconnected
connecting
connected
syncing
synced
network-disabled
error
```

This makes visual state deterministic.

---

# 28. Experience State Is Separate

The experience layer may track non-Bitcoin state such as:

```text
currentRoom
focusedObject
cameraMode
activePanel
transitionState
ambientIntensity
soundEnabled
reducedMotion
```

This state must remain separate from wallet truth.

---

# 29. Contextual UI Layer

Core Vault requires conventional UI for precision.

This UI should use HTML/DOM or the desktop framework's native/web UI layer above the 3D renderer.

It is appropriate for:

- Bitcoin addresses
- QR codes
- forms
- passphrase entry
- transaction review
- fees
- backup paths
- technical details
- errors
- confirmations

The key principle is:

> **DOM is the precision layer, not the world layer.**

---

# 30. Contextual UI Anchoring

Whenever possible, contextual panels should visually originate from the relevant world object.

Example:

User selects backup capsule.

The camera focuses on it.

A contextual panel appears adjacent to its projected screen-space position.

This preserves continuity between world and precise controls.

---

# 31. Security-Sensitive UI Must Remain DOM-Based

The following should not rely exclusively on 3D text:

- passphrase input
- full Bitcoin address verification
- transaction output review
- fee review
- backup path
- serious warnings
- irreversible confirmation

Use reliable accessible interface elements.

---

# 32. Desktop Host Boundary

The desktop host is responsible for privileged capabilities.

Depending on the existing project, this may currently be:

- Electron main process
- Tauri Rust backend
- another native host

Do not automatically migrate the desktop shell unless the existing architecture creates a material security or performance problem.

The rendering transformation does not itself require rewriting the application shell.

---

# 33. Electron Architecture If Electron Is Existing

If the existing project uses Electron:

Renderer:

- React
- React Three Fiber
- scene/UI logic
- no direct Node.js access

Main process:

- Core RPC
- filesystem
- secure configuration
- file dialogs
- application lifecycle

Required:

- `contextIsolation: true`
- `nodeIntegration: false`
- minimal preload API
- strongly typed IPC
- no arbitrary RPC passthrough

---

# 34. Tauri Architecture If Tauri Is Existing

If the existing project uses Tauri:

Frontend:

- React
- React Three Fiber
- scene/UI logic

Rust host:

- Core RPC
- filesystem
- secure configuration
- file dialogs
- privileged operations

Use minimal Tauri permissions.

Do not expose unnecessary filesystem or shell capabilities.

---

# 35. Do Not Mix Core Credentials With Renderer State

Bitcoin Core:

- cookie authentication
- RPC credentials
- sensitive paths

must remain in the privileged host layer.

They must not be stored in:

- React state
- browser localStorage
- scene state
- shader uniforms
- debug UI
- frontend logs

---

# 36. Passphrase Handling

Wallet passphrases are exceptionally sensitive.

They must:

- exist only during the required operation
- never enter persistent state
- never enter analytics
- never enter application logs
- never be serialized to disk
- never be included in crash dumps where avoidable
- be cleared from frontend state immediately after use

Where supported, privileged memory should be explicitly cleared.

---

# 37. No Arbitrary RPC Console in the Renderer

Do not expose a generic method such as:

```text
rpc(method, params)
```

to the experience layer.

Instead expose domain-specific commands.

This protects the architecture and reduces accidental misuse.

---

# 38. Interaction Architecture

Every meaningful scene object should implement a shared interaction contract.

Conceptually:

```text
InteractiveObject {
  id
  label
  role
  state
  enabled
  focus()
  activate()
  inspect()
}
```

This provides consistency between:

- mouse
- keyboard
- accessibility
- controller support if ever added

---

# 39. Raycasting

Pointer interaction may use renderer raycasting.

However, raycast hits should resolve to semantic interactive objects.

Do not place Bitcoin logic inside raycast callbacks.

Correct:

```text
raycast → semantic object → interaction command
```

not:

```text
raycast → RPC call
```

---

# 40. Interaction Hit Areas

Important objects should have simplified invisible interaction colliders or hit meshes.

This provides:

- larger click targets
- stable interaction
- improved performance
- independence from complex render geometry

---

# 41. Focus System

Selecting an object should enter a predictable focus state.

Focus may trigger:

- camera movement
- local lighting change
- object animation
- contextual UI
- accessible description

Only one primary focus target should normally exist at a time.

---

# 42. World Navigation

Primary navigation occurs through:

- exits
- doors
- pathways
- architectural objects

Secondary navigation may include:

- keyboard shortcuts
- accessibility navigation
- command palette
- Home action

The Scene Router remains the source of navigation truth.

---

# 43. Accessible Parallel Interface

Immersive rendering must not make Core Vault inaccessible.

Important 3D objects should have corresponding semantic DOM representations.

The user should be able to navigate important objects through:

- keyboard
- screen reader
- non-pointer input

The accessibility layer should describe function and state, not merely visual appearance.

---

# 44. Render Loop

The render loop must not indiscriminately recompute all application state.

Bitcoin state updates and scene rendering should remain logically independent.

Core state may update:

- on events
- on controlled polling
- on explicit operation completion

The scene renderer consumes state efficiently.

---

# 45. Polling Strategy

Do not poll every Bitcoin RPC every frame.

Example frequencies:

Core connectivity:
- several seconds

Sync status:
- several seconds while syncing
- less frequently when stable

Mempool summary:
- approximately 5–10 seconds

Peers:
- approximately 10–30 seconds

Detailed information:
- on demand

Pause or reduce polling when appropriate.

---

# 46. Event-Like Visual Responses

When polling detects meaningful transitions, emit application events.

Examples:

```text
BLOCK_ARRIVED
CORE_CONNECTED
CORE_DISCONNECTED
SYNC_COMPLETED
NETWORK_DISABLED
BACKUP_COMPLETED
SIGNATURE_ADDED
TRANSACTION_BROADCAST
```

The world reacts to events.

Do not make every small data change trigger spectacle.

---

# 47. Event Bus

A lightweight typed event system may connect application transitions to experiential responses.

It must carry domain events, not raw RPC responses.

Example:

```text
CoreEvent.NewBlock {
  height
  hash
  time
}
```

Engine Room and Observatory may react independently.

---

# 48. No Event Means No Fake Animation

Ambient animation may continue.

Semantic Bitcoin animation should occur only when corresponding state/event exists.

Do not randomly simulate:

- blocks
- signatures
- network events

in real mode.

---

# 49. Demo Mode

A clearly marked demo mode may provide simulated activity for:

- design development
- screenshots
- interaction tests
- onboarding development

Demo mode must be visually and technically distinct from production data.

Recommended visible marker:

```text
DEMO
```

or:

```text
REGTEST
```

Never disguise fake state as mainnet.

---

# 50. Environment Modes

Recommended runtime modes:

```text
REAL
REGTEST
DEMO
```

Possibly later:

```text
SIGNET
```

The mode should propagate into application state and visible environment.

---

# 51. Asset Loading

Large environment assets should be loaded asynchronously.

Use:

- GLB compression
- Draco or Meshopt where appropriate
- texture compression
- KTX2/Basis where practical
- lazy room loading
- preload neighboring rooms

Do not load the entire future facility at maximum resolution on startup.

---

# 52. Scene Preloading

The current room should be fully resident.

Likely next rooms may be partially preloaded.

Example:

Main Hall loaded:
- Workshop preload
- Archive preload
- Engine Room preload

This makes transitions feel immediate without excessive memory use.

---

# 53. Texture Budget

Photorealistic atmosphere does not justify uncontrolled textures.

Define budgets per scene.

Prefer:

- reusable materials
- compressed textures
- sensible resolution
- trim sheets where appropriate
- baked detail where static
- real-time effects only where useful

---

# 54. PBR Materials

Use physically based rendering for core visual materials.

Primary material families:

- Mediterranean limestone
- bronze
- brushed gold-toned metal
- glass
- dark structural metal
- emissive blue energy
- emissive warm gold energy

Material definitions should be reusable across the world.

---

# 55. Design Tokens Extend Into 3D

The design system should define more than CSS colors.

It should also define:

- material families
- emissive intensity ranges
- light temperatures
- animation timing
- world scale
- interaction glow
- warning behavior
- scene fog
- exposure

This allows the entire facility to remain visually coherent.

---

# 56. Lighting Strategy

Lighting should combine:

- environment lighting
- directional sunlight
- area lights where appropriate
- local object lighting
- emissive materials
- selective baked lighting

Avoid dozens of expensive dynamic lights.

Use lighting primarily for:

- atmosphere
- hierarchy
- semantic state

---

# 57. Global Illumination

Full real-time global illumination should not be a hard requirement.

Use a pragmatic combination of:

- baked lighting
- environment maps
- lightmaps
- reflection probes / environment reflections
- controlled real-time lights

Performance takes priority over unnecessary renderer sophistication.

---

# 58. HDR Environment

Each room may use carefully designed HDR-style environment lighting.

However, environmental lighting should remain consistent with the facility's physical location.

The world should not feel as though each room was rendered in a different universe.

---

# 59. Daylight Philosophy

Initial Core Vault art direction should primarily use:

- warm Mediterranean daylight
- late afternoon warmth where appropriate
- cool reflected sky tones
- blue/gold technological light

Future dynamic time-of-day is optional.

Do not make time-of-day simulation a prerequisite for the MVP.

---

# 60. Post-Processing

Post-processing must be restrained.

Potential effects:

- subtle bloom
- tone mapping
- ambient occlusion
- depth of field during focused inspection
- mild vignette in limited contexts

Avoid:

- strong chromatic aberration
- heavy film grain
- aggressive motion blur
- lens distortion
- cyberpunk glow

The renderer should reinforce realism, not announce itself.

---

# 61. Bloom

Bloom is appropriate for:

- energy cores
- selected status elements
- subtle light spill

It must not cause:

- unreadable UI
- washed-out scenes
- neon aesthetics

---

# 62. Depth of Field

Depth of field may be used temporarily during object focus.

Do not use strong permanent blur.

Security-critical contextual UI must remain completely sharp.

Reduced Motion/Accessibility modes may disable camera-driven depth effects.

---

# 63. Animation System

Object animation should be driven by named semantic states.

Example:

```text
KeyState.IDLE
KeyState.SELECTED
KeyState.SIGNING
KeyState.SIGNED
KeyState.ERROR
```

Each state defines:

- animation clip
- emissive behavior
- sound
- optional particle response

Bitcoin logic sets the state.

The 3D component renders it.

---

# 64. Avoid Timeline Spaghetti

Do not place arbitrary animation sequences throughout individual React components.

Create reusable animation controllers.

Examples:

```text
KeyAnimationController
VaultAnimationController
ReactorAnimationController
CapsuleAnimationController
TransitionController
```

---

# 65. Animation Completion Does Not Define Domain Completion

Domain truth always wins.

A backup is complete because `backupwallet` succeeded.

Not because the capsule animation ended.

The correct sequence:

```text
RPC success
→ domain state complete
→ visual completion animation
```

---

# 66. Audio Architecture

Audio should be divided into:

```text
Master
Ambient
Interaction
System
```

The user must be able to disable each appropriately.

Audio must not be required to understand state.

---

# 67. Spatial Audio

Where supported, ambient audio may be spatially attached to:

- reactor
- sea
- machinery
- local conduits

Use subtle attenuation.

Do not create a dramatic game soundscape.

---

# 68. Audio Assets

Audio assets must be:

- original
- appropriately licensed
- local

Do not stream runtime audio from external services.

Do not copy recognizable sounds from existing games.

---

# 69. No Runtime External Asset Dependency

Production Core Vault should not require external servers for:

- models
- textures
- fonts
- audio
- shaders
- QR generation
- UI libraries loaded from CDN

Assets should ship with the application.

---

# 70. Privacy Architecture

Core Vault should not include default telemetry.

No automatic:

- analytics
- session tracking
- usage tracking
- wallet tracking
- crash upload
- network beaconing

Unexpected outbound network traffic is incompatible with the product's privacy model.

---

# 71. Network Isolation

The application should connect only to:

- the configured Bitcoin Core RPC endpoint

unless the user explicitly enables a future separately documented integration.

No external blockchain API should be needed for core functionality.

---

# 72. Core Vault Does Not Replace Bitcoin P2P

Core Vault communicates with Bitcoin Core.

Bitcoin Core communicates with Bitcoin peers.

The experience layer should not become a second Bitcoin P2P implementation.

---

# 73. Error Architecture

Errors should be normalized into domain error types.

Example:

```text
CoreUnavailable
WalletLocked
InvalidAddress
InsufficientFunds
BackupFailed
RestoreFailed
PsbtIncomplete
NetworkInactive
RpcRejected
```

The UI receives meaningful errors.

Raw RPC output may remain available under technical details.

---

# 74. Sanitized Technical Details

Technical error details must redact:

- RPC credentials
- cookie contents
- passphrases
- private descriptors
- xprv
- WIF
- sensitive filesystem information where unnecessary

---

# 75. Logging

Use structured logging.

Recommended levels:

```text
ERROR
WARN
INFO
DEBUG
TRACE
```

Production logs must not include secrets.

Experience rendering logs should not overwhelm domain logs.

---

# 76. Core Vault Metadata

Application-owned metadata may contain:

- vault display names
- world presentation preferences
- room onboarding state
- audio preferences
- accessibility settings
- safe public fingerprints
- last known backup status metadata

It must not contain private key material.

---

# 77. Storage Boundary

Sensitive Bitcoin wallet data remains under Bitcoin Core's control.

Core Vault's application storage should contain experience/configuration data only unless a later technical specification explicitly approves additional data.

---

# 78. Scene Metadata

Scene state such as:

- last room
- audio setting
- motion preference
- graphics quality

may be persisted.

Do not persist transient sensitive interaction state.

---

# 79. Visual Preferences

Future preferences may include:

- graphics quality
- reduced motion
- ambient sound
- interaction sound
- text scale
- brightness
- accessibility mode

These may be local application settings.

---

# 80. Graphics Quality Profiles

The renderer should eventually support quality profiles.

Example:

## High
- higher texture resolution
- enhanced reflections
- richer particles
- higher shadow quality

## Balanced
- default

## Efficient
- reduced particles
- reduced shadows
- reduced post-processing

Bitcoin functionality must remain identical across all quality profiles.

---

# 81. Performance Target

The experience should target smooth rendering on ordinary modern desktop hardware.

Desired target:

- approximately 60 FPS on reasonable hardware
- graceful degradation where this is not possible

Bitcoin operations must never depend on frame rate.

---

# 82. GPU Failure Must Not Corrupt Bitcoin Operations

A renderer error, missing texture, or failed animation must not:

- sign a transaction incorrectly
- change wallet state
- lose backup state
- alter a Core RPC call

Experience failure and Bitcoin failure must remain separate.

---

# 83. Fallback Interface

A minimal functional fallback is desirable for serious error situations.

If the 3D renderer cannot initialize, the application should be capable of displaying:

- Core connection status
- error information
- safe shutdown
- recovery guidance

This fallback is not the normal product UI.

It exists for resilience.

---

# 84. Application Startup

Conceptual startup sequence:

1. desktop host starts
2. secure configuration loads
3. Core connection service initializes
4. experience renderer initializes
5. startup scene loads
6. previous safe preferences load
7. Core connection begins
8. Main Hall appears
9. environment updates as Core state becomes known

The user should not stare at a blank window while Bitcoin Core is checked.

---

# 85. Loading Experience

Loading should belong to the world.

Avoid generic:

```text
Loading... 72%
```

where possible.

The initial environment may appear in a quiet partially inactive state while resources initialize.

However, do not fake Core readiness.

---

# 86. Bitcoin Core Startup

Core Vault may detect that Core is unavailable.

It should not silently invent a running node state.

If future versions can launch Bitcoin Core, that capability must be separately documented and explicitly controlled.

---

# 87. Multi-Wallet Support

The domain architecture must support multiple Core wallets.

Each logical vault should map predictably to its corresponding Core representation.

The experience layer receives a list of semantic vault objects.

It should not need to understand wallet directory internals.

---

# 88. Vault Identity

Each vault requires stable application identity.

Possible properties:

```text
vaultId
displayName
coreWalletName
vaultType
chain
policySummary
publicFingerprint
```

Do not use display name alone as a database identity.

---

# 89. Single-Sig

Single-sig should be represented as:

```text
Vault
→ one signing authority
→ one required
```

The visual world maps this to one key.

The underlying implementation remains Bitcoin Core wallet logic.

---

# 90. Multisig

Multisig architecture must separate:

- coordinator
- signing authorities
- spending policy
- collected signatures

The experience layer visualizes these relationships.

Do not compress all multisig logic into a single generic `wallet` boolean state.

---

# 91. PSBT as Domain Object

A PSBT should have an application-level representation.

Conceptually:

```text
PsbtProposal {
  id
  vaultId
  outputs
  fee
  feeRate
  signatures
  requiredSignatures
  state
  rawPsbt
}
```

Sensitive/raw data handling should follow security requirements.

The experience primarily receives semantic state.

---

# 92. Signing Events

Signing should emit meaningful state transitions.

Example:

```text
SIGNING_STARTED
SIGNATURE_ACCEPTED
SIGNATURE_REJECTED
THRESHOLD_REACHED
```

The Workshop/Vault/Communications experience may respond to these events.

---

# 93. Transaction Review Boundary

Before signing or broadcasting:

the application enters a dedicated secure review state.

During this state:

- ambient movement may reduce
- camera becomes stable
- conventional UI becomes dominant
- full transaction information is displayed
- no automatic progression occurs

The world supports the review.

It does not distract from it.

---

# 94. Broadcast Boundary

Broadcast must be a distinct application command.

A completed signature threshold must never implicitly broadcast.

Architecture:

```text
PSBT threshold reached
→ finalized
→ ready to broadcast
→ explicit user confirmation
→ broadcast command
```

---

# 95. Backup Architecture

Backup operations belong to `BackupService`.

The Archive is merely their visual representation.

Backup service should track:

```text
requested
writing
written
verified
failed
```

The capsule reflects those states.

---

# 96. Restore Architecture

Restore is a domain workflow.

The Archive invokes it.

The Archive does not implement it.

Restore workflow should remain testable without rendering a scene.

---

# 97. Engine Room Data Model

The Engine Room should consume a summarized node model.

Example:

```text
NodeStatus {
  connected
  chain
  blockHeight
  headers
  syncProgress
  initialBlockDownload
  networkActive
  peerCount
  mempoolTransactions
  mempoolBytes
  lastBlockTime
}
```

Do not send raw `getpeerinfo` responses directly into the reactor.

---

# 98. Observatory Data Model

The Observatory may receive:

```text
MempoolSummary
RecentBlocks
NetworkSummary
```

More expensive data should be requested on demand.

---

# 99. Do Not Render the Entire Mempool Literally

A local node may contain a very large number of transactions.

Do not create one 3D object for every mempool transaction.

Use aggregation.

The visualization should be:

- data-driven
- representative
- performant

not one-to-one unless a future specialized view explicitly requires it.

---

# 100. World Simulation Is Not Bitcoin Simulation

The world may contain ambient physical behavior.

It must never simulate Bitcoin outcomes.

Bitcoin state comes from Bitcoin Core.

This distinction must remain architecturally obvious.

---

# 101. Testing Layers

Core Vault requires several independent test layers.

## Domain unit tests

Test Bitcoin logic independently.

## RPC integration tests

Test against controlled Bitcoin Core instances.

## Application state tests

Test state machines.

## Visual state tests

Verify state mapping.

## Interaction tests

Verify meaningful object actions.

## End-to-end tests

Verify complete flows.

---

# 102. Regtest

Regtest should be the preferred automated environment for destructive/integration testing.

Tests may:

- create wallets
- mine blocks
- construct transactions
- sign PSBTs
- broadcast
- restore backups

Never automatically run these tests against a user's real mainnet wallet.

---

# 103. Visual Regression

Major scenes should eventually have visual regression tests.

Example states:

Engine Room:

- disconnected
- syncing
- synced
- network disabled

Workshop:

- empty
- one-key vault
- 2-of-3 layout
- signature progress

Archive:

- no backup
- backup complete
- restore validation

---

# 104. Screenshot Tests Are Not Sufficient

A scene may look correct while interaction is broken.

Therefore combine visual tests with semantic interaction tests.

---

# 105. Accessibility Tests

Automated and manual tests should verify:

- keyboard traversal
- focus visibility
- semantic names
- reduced motion
- screen-reader fallback
- contrast in contextual UI

---

# 106. Performance Tests

Track:

- initial load
- room load time
- memory usage
- GPU load
- frame rate
- draw calls
- asset size
- idle resource usage

A feature that significantly harms ordinary hardware should require justification.

---

# 107. Development Tools

The experience layer may expose development-only tools such as:

- room selector
- camera debug
- bounding boxes
- lighting controls
- mock Core state
- event simulator
- graphics statistics

These must be disabled in normal production mode.

---

# 108. Mock Core State

Developers must be able to visually test states without risking real funds.

Example mock controls:

```text
Core disconnected
Sync 47%
New block
Backup complete
1/2 signatures
2/2 signatures
Network disabled
```

The production application must never confuse mock and real state.

---

# 109. Scene Development Mode

A scene should be developable in isolation.

Example:

```text
npm run scene:workshop
```

or equivalent development tooling.

This allows faster art and interaction iteration.

Exact tooling depends on the existing build system.

---

# 110. Asset Pipeline

The project should eventually standardize:

1. asset creation
2. Blender or equivalent source
3. optimization
4. export to GLB
5. compression
6. semantic node validation
7. application import
8. visual QA

Keep source assets separate from runtime optimized assets.

---

# 111. Blender Is Recommended for World Asset Authoring

A future art workflow may use Blender for:

- architecture
- artefacts
- UV layout
- PBR materials
- animation
- baking
- GLB export

The runtime application should not depend on Blender.

---

# 112. Procedural Assets May Be Used During Development

Early implementation may use:

- procedural geometry
- simple PBR materials
- temporary primitives
- placeholder architecture

provided the architecture is designed so final art can replace them cleanly.

Do not mistake placeholders for final design.

---

# 113. Do Not Use AI-Generated Flat Images as the Final World

Image generation may be useful for:

- concept art
- material reference
- composition studies
- moodboards

But if the final experience requires camera movement and 3D object interaction, flattened images cannot be the core runtime representation.

They should guide 3D asset creation rather than substitute for it.

---

# 114. Hybrid 2.5D Is Allowed Selectively

Some distant scenery may use:

- matte backgrounds
- billboards
- projected environments
- skyboxes
- layered cards

when those elements are not expected to behave like interactive geometry.

Primary rooms and interactive artefacts should retain real spatial presence.

---

# 115. Sea and Distant Environment

Distant Mediterranean views do not require physically simulated oceans.

Use efficient solutions such as:

- shader-based ocean
- animated normal maps
- skybox
- distant geometry

Focus performance on interactive foreground spaces.

---

# 116. Architecture and Bitcoin Objects Must Be Separate Asset Families

Architectural assets:

- walls
- arches
- floors
- columns
- stairs

Bitcoin semantic assets:

- vault
- key
- capsule
- reactor
- transaction terminal
- time mechanism

This separation improves reuse and art iteration.

---

# 117. Shared Artefacts

Important artefacts should be reusable between rooms.

A key shown in the Workshop and later in the Vault Chamber should retain the same visual identity.

Users should recognize objects across the facility.

---

# 118. Persistent Object Identity

If a user names a key:

```text
Home Key
```

the same key identity should remain recognizable anywhere it appears.

This may later influence subtle visual identifiers.

Never encode security importance using value-like prestige.

---

# 119. Scene Persistence

The application should not need to preserve exact arbitrary physical positions unless those positions carry product meaning.

Rooms are curated compositions.

Core Vault is not a sandbox game.

Persist semantic configuration, not accidental 3D coordinates.

---

# 120. World Save State Is Not Wallet State

The world does not maintain a parallel wallet save file.

World preferences are presentation metadata.

Bitcoin wallet state remains in Bitcoin Core.

This separation must remain explicit.

---

# 121. Application Versioning

Core Vault should version:

- application code
- metadata schema
- scene schema if necessary

Application migrations must never silently alter Bitcoin Core wallets unless explicitly required and reviewed.

---

# 122. Backward Compatibility

Upgrading the visual world should ideally not require changing existing wallets.

A new Engine Room should still represent the same Core state.

A new Key model should still represent the same signing authority.

---

# 123. Configuration Migrations

Core Vault metadata migrations must be:

- deterministic
- tested
- reversible where practical
- backed up before risky transformations

No migration should modify private Bitcoin material merely for aesthetic changes.

---

# 124. Build Architecture

The project should produce platform-specific desktop builds.

Eventually:

- macOS application
- Windows application
- Linux package

The precise packaging system follows the selected desktop host.

---

# 125. Development and Production Separation

Development builds may include:

- mock state
- debugging
- scene controls
- inspector
- development RPC tools

Production builds should remove or disable these capabilities.

---

# 126. Code Signing

Before public distribution, platform code-signing requirements should be addressed separately.

Architecture should not assume unsigned local development builds are equivalent to production readiness.

---

# 127. Dependency Discipline

Avoid adding libraries simply because they provide attractive visual effects.

Each dependency should justify:

- functionality
- maintenance
- bundle impact
- security implications

The visual ambition must not create an unmanageable dependency tree.

---

# 128. Renderer Dependency Strategy

Prefer a small stable rendering stack.

Recommended initial set:

- Three.js
- React Three Fiber
- `@react-three/drei` selectively
- a restrained post-processing library if needed
- existing state management where suitable

Do not install multiple competing 3D frameworks.

---

# 129. Physics Engine

Do not introduce a physics engine unless a concrete interaction requires it.

Most Core Vault interactions can be performed using:

- deterministic animation
- interpolation
- predefined positions

A physics engine adds complexity without obvious value in the initial design.

---

# 130. Particle Systems

Particle effects should be lightweight and rare.

Suitable:

- dust
- energy flow
- subtle mempool visualization
- short semantic impulses

Unsuitable:

- constant thousands of decorative particles
- fireworks
- excessive sparks

---

# 131. Shader Philosophy

Custom shaders may be used for:

- energy
- glass
- ocean
- ambient effects

But maintainability matters.

Do not build fundamental application state into opaque shader logic.

Shaders render state.

They do not own state.

---

# 132. UI Typography

Critical readable text belongs to the DOM contextual layer rather than baked into 3D textures whenever possible.

3D text may be used sparingly for:

- room identity
- subtle object engraving
- environmental labels

Do not display full Bitcoin addresses as decorative 3D geometry.

---

# 133. Localization

User-facing interface copy should eventually use a localization system.

Initial supported languages should include:

- English
- Croatian

World assets should avoid baking language-specific text into textures wherever practical.

---

# 134. Room Description Ownership

`05_ROOM_DESIGN.md` will define what each room contains.

This architecture document defines how rooms are technically represented.

Do not prematurely hardcode final room composition here.

---

# 135. World Bible Ownership

`04_WORLD_BIBLE.md` will define:

- physical world
- architecture
- conceptual geography
- recurring objects
- world logic

This architecture should support those definitions rather than invent them independently.

---

# 136. Art Direction Ownership

`08_ART_DIRECTION.md` will define:

- visual realism
- materials
- exact palette
- lighting language
- art references
- motion aesthetics
- audio aesthetics

This document establishes technical capability, not final art decisions.

---

# 137. Interaction Design Ownership

`06_INTERACTION_DESIGN.md` will define:

- pointer behavior
- hover
- focus
- click
- drag
- camera interaction
- contextual panels
- task flow

This architecture provides common systems for those behaviors.

---

# 138. Bitcoin Core Integration Ownership

`07_BITCOIN_CORE_INTEGRATION.md` will define the detailed mapping from application actions to Core RPC.

This document requires a strict adapter boundary but does not replace the dedicated integration specification.

---

# 139. Codex Must Read Documentation Before Architectural Changes

Before making significant architecture changes, Codex must read at minimum:

- `01_VISION_AND_PHILOSOPHY.md`
- `02_DESIGN_PRINCIPLES.md`
- `03_TECHNICAL_ARCHITECTURE.md`

and any more specific relevant documents.

Do not allow convenience-driven implementation to silently replace the approved architecture.

---

# 140. Migration Strategy From the Existing UI

The current presentation layer should not be rewritten all at once.

Recommended strategy:

## Phase 1

Inventory:

- working backend
- RPC integration
- current state management
- tests
- existing desktop host

## Phase 2

Extract/confirm strict domain boundary.

## Phase 3

Add the real-time renderer alongside the existing frontend.

## Phase 4

Implement one complete proof-of-architecture scene.

Recommended:

**Engine Room** or **Main Hall**.

## Phase 5

Connect real Core state to the scene.

## Phase 6

Implement contextual UI layer.

## Phase 7

Replace old routes room by room.

## Phase 8

Remove obsolete web presentation components only after corresponding immersive functionality exists.

This minimizes regression risk.

---

# 141. Do Not Delete the Existing UI Immediately

The current UI may remain temporarily useful for:

- reference
- debugging
- functional comparison
- regression testing

Do not destroy it before the replacement flow is proven.

It may be moved behind a development-only legacy route if needed.

---

# 142. First Architecture Prototype

Before building the entire facility, create one technical proof-of-concept that demonstrates:

- real 3D room
- realistic lighting
- interactive 3D object
- camera focus
- contextual DOM panel
- real application state
- one data-driven animation
- reduced motion
- keyboard access

The purpose is to validate the architecture, not final art.

---

# 143. Recommended Proof Scene: Engine Room

Engine Room is particularly useful because it proves:

- realistic environment
- Core data integration
- real-time animation
- semantic visual state
- object focus
- metrics
- ambient behavior

Example minimum:

A Core reactor whose state reflects:

- connected
- disconnected
- syncing
- synchronized
- network active
- network disabled

This demonstrates the entire architectural model.

---

# 144. Proof-of-Architecture Acceptance Criteria

The prototype succeeds only if:

- it does not look like a webpage with a background
- camera exists in real 3D space
- reactor exists as real geometry
- reactor visually changes from real application state
- the user can inspect it
- a contextual precision panel can appear
- Core logic remains outside the scene component
- frame rate remains acceptable

---

# 145. No Final Asset Requirement for Architecture Prototype

The first prototype may use temporary geometry.

The test is architecture.

Final visual quality comes later.

However, the prototype must already prove that the renderer is capable of achieving the target visual direction.

---

# 146. Architectural Rejection Criteria

Reject an implementation if:

- React cards remain the primary interaction model
- rooms are static JPEG backgrounds
- important environment animations are just CSS overlays
- 3D objects are decorative and buttons still perform all actions
- scene components call raw RPC directly
- secrets enter renderer state
- wallet functionality depends on frame rate
- changing art assets requires rewriting Bitcoin logic
- Core Vault requires an external cloud service to function
- mainnet state can be confused with demo state

---

# 147. Architectural Success Criteria

The architecture is successful when:

1. Bitcoin Core logic runs independently of the 3D experience.

2. The experience receives semantic state.

3. Real-time 3D scenes define the primary environment.

4. Meaningful objects are interactive.

5. Real Core state changes those objects.

6. Conventional UI appears only contextually.

7. Security-critical controls remain precise and accessible.

8. Assets can be replaced without altering Bitcoin logic.

9. Rooms can be developed independently.

10. The application remains local-first and private.

---

# 148. Final Architectural Principle

The central technical rule of Core Vault is:

> **Bitcoin Core owns truth.  
> The application layer owns intent and state transitions.  
> The experience layer makes that truth tangible.**

The renderer must never become the wallet.

The wallet must never depend on the renderer.

The world should be free to become increasingly beautiful, realistic, spatial, and expressive without placing Bitcoin correctness at risk.

That separation is what allows Core Vault to achieve both ambitions:

**serious Bitcoin infrastructure underneath, and an immersive interactive world above it.**