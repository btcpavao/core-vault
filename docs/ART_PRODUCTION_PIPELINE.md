# Core Vault — Art Production Pipeline

**Status:** Required fidelity standard; optional full-3D workflow
**Applies to:** Cinematic scene environments, selective 3D, hero objects, environmental assets, lighting and presentation inside Core Vault
**Renderer direction:** Semantic scene package → renderer/compositor → Tauri, with Blender, glTF/GLB and React Three Fiber / Three.js used selectively
**Project principle:** Visual fidelity is a product requirement, not optional polish.

---

## 1. Purpose

Core Vault is not intended to look like a conventional web application with a decorative 3D layer.

Its spatial environments are part of the product itself.

Rooms such as the Engine Room, Key Chamber, Recovery Archive and future spaces must feel like coherent, believable, physically constructed environments with the visual quality of a high-end cinematic interactive experience.

The generated concept/reference artwork establishes the intended visual language.

The runtime implementation must therefore aim to reproduce the reference artwork **as closely as reasonably possible in the running experience**, rather than merely taking inspiration from it.

The expected relationship is:

> **Reference artwork → coherent authored semantic scene package → optimized interactive representation**

Not:

> Reference artwork → loosely inspired procedural web scene

A successful room should feel like entering the reference image.

---

# 2. Core visual objective

For every major Core Vault room, there must be at least one approved **Hero Reference Image**.

That image becomes the primary visual source of truth for:

- composition
- architecture
- proportions
- material language
- lighting
- atmosphere
- color temperature
- visual hierarchy
- scale
- focal points
- density of detail
- mood

The runtime room does not need to reproduce every individual stone, screw or surface imperfection.

It **does** need to preserve the visual identity of the reference closely enough that a screenshot from the approved hero camera is immediately recognizable as the same environment.

### Target

The goal is not vague similarity.

The target is:

> **Near-reference fidelity with only those compromises required by interaction, packaging and performance.**

A simplified scene that technically represents the same objects but loses the reference's realism, depth, material quality or atmosphere does **not** satisfy this requirement.

---

# 3. Reference Image Contract

Before scene production begins, every room requires an approved reference image.

The image must be treated as a specification.

For each reference, record:

- image file
- room name
- intended hero camera
- approximate camera height
- approximate focal length / field of view
- primary focal object
- dominant architectural features
- primary materials
- lighting direction
- lighting temperature
- atmospheric characteristics
- areas intentionally hidden or left undefined

Geometry-heavy Blender scenes should retain a camera called:

`CV_HeroCamera`

Its purpose is to reproduce the composition of the approved reference as closely as possible.

For every renderer, a canonical viewpoint and crop must reproduce the reference composition and be used for repeated comparison.

---

# 4. Production philosophy

## 4.1 Authored source owns the physical world

Blender is an authoritative tool where actual geometry is valuable, including:

- architecture
- walls
- floors
- ceilings
- columns
- stairs
- platforms
- structural supports
- hero objects
- machinery
- static props
- pipes and conduits
- trim
- bevels
- surface breakup
- UV layout
- authored materials
- static environmental lighting decisions
- scene composition

React Three Fiber must **not** become the primary modeling tool for production-quality rooms.

For cinematic 2.5D rooms, the authoritative source may instead be one coherent master composition plus depth, semantic, state, lighting, and emissive layers. Blender remains valid for reference rendering, depth/mask generation, hero props, and selective geometry. It is not mandatory for every room.

Three.js primitives may still be used for:

- debugging
- prototypes
- invisible interaction volumes
- simple runtime indicators
- fallback geometry
- dynamic procedural effects
- temporary placeholders

But the final visible environment should primarily originate from authored assets.

---

## 4.2 Runtime owns behavior

The renderer/compositor owns:

- interaction
- camera movement
- application state
- Bitcoin state
- wallet state
- Reactor energy
- animations driven by real data
- highlighting
- focus transitions
- dynamic emissive effects
- particles
- temporary pulses
- user feedback
- reduced-motion behavior

This separation is intentional.

### Authored scene source

**What the world is.**

### Runtime

**What the world is doing.**

---

# 5. Visual quality hierarchy

When visual fidelity is poor, problems must be solved in this order:

1. composition
2. proportions
3. architecture
4. silhouette
5. lighting
6. materials
7. surface detail
8. props
9. micro-detail
10. effects

Do not attempt to repair weak architecture using:

- bloom
- particles
- fog
- emissive materials
- excessive contrast
- post-processing

A room whose geometry and lighting do not work without effects is not ready for effects.

---

# 6. Production stages

Every room follows an evidence-based production sequence appropriate to its renderer. The Blender stages below remain the required workflow for complete authored-3D work, not a universal requirement for every cinematic 2.5D room.

No stage should be skipped.

---

## Stage 0 — Reference analysis

Before touching Blender, analyze the approved reference.

Identify:

### Composition

- horizon
- vanishing points
- camera height
- focal length
- focal object
- major foreground/midground/background layers

### Geometry

- overall room dimensions
- height-to-width relationship
- hero-object scale
- major structural masses
- wall thickness
- floor elevation changes
- openings
- columns
- arches
- beams
- stairs

### Materials

For example:

- limestone
- carved stone
- dark metal
- brushed steel
- bronze
- glass
- concrete
- oxidized metal
- fabric
- wood

### Lighting

Identify:

- key light
- fill
- practical lights
- emissive sources
- indirect illumination
- shadow softness
- darkness level
- contrast
- atmospheric falloff

### Detail density

Determine which parts of the image carry the perception of realism.

Often this is not polygon count.

It is:

- bevels
- joints
- trim
- contact shadows
- roughness variation
- scale variation
- material transitions
- imperfect repetition
- secondary geometry

Document these observations before modeling.

---

# 7. Stage 1 — Blender greybox

Construct the entire room using simple geometry.

Do not add detailed materials.

Do not add decorative props.

Do not integrate into Core Vault.

The greybox exists to solve:

- proportions
- architecture
- scale
- camera
- navigation space
- hero-object placement

Create the hero camera immediately.

### Greybox acceptance test

Render from `CV_HeroCamera`.

Compare against the reference.

The following must already approximately match:

- major silhouette
- room scale
- focal-object placement
- floor/ceiling relationship
- dominant architectural masses
- perspective

If the greybox does not resemble the reference, **stop here**.

Do not continue adding detail.

---

# 8. Stage 2 — Architectural reconstruction

Replace placeholder forms with production architecture.

Add:

- proper wall thickness
- structural frames
- columns
- arches
- platforms
- stairs
- wall recesses
- ceiling structure
- floor transitions
- framing elements
- architectural trim

Every hard edge visible near the camera should be evaluated for beveling.

Perfect mathematical edges are a major source of synthetic-looking real-time scenes.

Use physically plausible construction logic.

Objects should appear to have been:

- cut
- assembled
- joined
- mounted
- supported
- bolted
- embedded

Nothing important should look like an isolated primitive floating beside another primitive.

---

# 9. Stage 3 — Hero asset production

Hero objects require their own production pass.

Examples:

- Core Reactor
- key-generation apparatus
- signing console
- vault doors
- archival machinery

Hero objects should be treated as recognizable product assets rather than assemblies of generic primitives.

Each hero object should have:

- strong silhouette
- readable large forms
- secondary forms
- tertiary mechanical detail
- believable construction
- proper bevels
- consistent material language
- physically plausible mounting

The hero object must hold up both:

- in room overview
- at close inspection

---

# 10. Stage 4 — Materials

Materials should communicate physical substance.

Flat colors are insufficient for production assets.

Materials should generally define:

- base color
- roughness
- normal structure
- metallic response where appropriate
- subtle surface variation
- edge response

Avoid excessive procedural noise.

Realism should come from plausible materials, not visual randomness.

---

## Stone

Stone should exhibit:

- macro color variation
- subtle roughness variation
- appropriate normal scale
- edge wear where justified
- seams or block construction where visible
- non-uniform repetition

Large stone walls must not reveal obvious texture tiling.

---

## Metal

Metal must distinguish between:

- painted metal
- brushed metal
- oxidized metal
- polished metal
- structural steel
- decorative metal

Do not use one generic dark metallic material throughout the room.

---

## Glass

Glass must be used intentionally.

Consider:

- thickness
- tint
- reflections
- refraction cost
- surrounding illumination

Hero glass components should not resemble transparent plastic.

---

# 11. Stage 5 — Lighting

Lighting is one of the primary determinants of visual fidelity.

Lighting must be authored based on the reference.

Do not simply add enough lights to make everything visible.

Darkness is allowed.

Shadow is part of the composition.

The room should have:

- clear key lighting
- controlled fill
- practical light sources
- believable emissive contribution
- readable focal hierarchy
- contact shadows
- sufficient local contrast

The hero object should be visually dominant because of the composition and lighting, not merely because it is brighter than everything else.

---

# 12. Stage 6 — Detail pass

Only after architecture, materials and lighting work correctly should secondary detail be added.

Examples:

- seams
- bolts
- conduits
- vents
- cables
- machinery housings
- wall fixtures
- brackets
- inspection panels
- recesses
- edge trim
- maintenance infrastructure
- floor markings
- restrained environmental storytelling

Detail should reinforce scale.

A huge room without human-scale reference objects often feels miniature.

Small elements such as:

- doors
- railings
- steps
- consoles
- handles
- access panels

help establish believable scale.

---

# 13. Stage 7 — Reference matching

At this stage, perform an explicit visual comparison.

Create:

1. approved reference image
2. Blender render from `CV_HeroCamera`

View them side by side.

Do not judge from memory.

Compare:

- composition
- focal length
- geometry
- scale
- lighting
- shadow placement
- color temperature
- surface response
- background density
- atmospheric depth
- hero-object prominence

Correct the largest mismatch first.

Repeat until the scene clearly belongs to the same visual world.

---

# 14. Stage 8 — Blender quality gate

A complete authored-3D room must pass a Blender-only quality gate **before runtime integration**. A cinematic 2.5D room instead requires an equivalent master-composition and semantic-layer quality gate.

This is critical.

If the Blender scene does not already look close to the reference, exporting it into Core Vault will not fix it.

Runtime integration is not an art-production stage.

### Required Blender approval

A Blender viewport/render screenshot should produce the reaction:

> “This is clearly the room from the reference.”

Not:

> “I can see what it is trying to become.”

---

# 15. Stage 9 — Runtime optimization

Only after visual approval begins the runtime optimization pass.

Optimization must preserve the visual result as much as possible.

Possible techniques include:

- removal of invisible geometry
- geometry merging where useful
- instancing repeated assets
- LODs where justified
- texture atlasing where justified
- sensible texture resolution
- mesh compression
- Draco / Meshopt where appropriate
- reducing material count
- reducing unnecessary transparency
- baking static information when beneficial
- shadow optimization
- light-count optimization

Do not begin by arbitrarily reducing polygon count.

Optimize based on measurements.

---

# 16. Performance targets

Performance is a product requirement alongside fidelity.

The project must establish reproducible test hardware and scenes.

For development purposes, every production room should aim for:

### Normal navigation

Target:

**60 FPS**

Acceptable short-lived minimum:

**45 FPS**

Persistent performance materially below this range requires investigation.

### Interaction

Camera input should remain responsive.

No interaction should produce obvious:

- frame stalls
- garbage-collection pauses
- shader compilation stalls during normal use
- layout thrashing
- unnecessary React re-render storms

### Load

Large 3D assets should not block the application unnecessarily.

Use deliberate loading states where required.

---

# 17. Performance diagnosis

When performance becomes poor, do not immediately reduce art quality.

Measure first.

Investigate:

- draw calls
- triangle count
- material count
- texture memory
- shader complexity
- real-time lights
- shadow maps
- post-processing
- React component re-renders
- animation-loop allocations
- duplicated geometry
- transparent objects
- unnecessary state updates
- GLB loading strategy

The objective is:

> **High visual fidelity through efficient construction.**

Not:

> High visual fidelity through brute-force geometry.

And not:

> High performance through visibly impoverished art.

---

# 18. Runtime integration

After Blender approval and optimization, export the production asset to GLB.

Recommended structure:

```text
art-source/
  blender/
    engine-room/
      engine-room.blend
      README.md
      build/export scripts if required

public/
  assets/
    experience/
      engine-room/
        cv_engine_room_v1.glb
```

The Blender source is a first-class project asset.

The `.blend` source must remain reproducible.

Do not treat the exported GLB as the only source of truth.

---

# 19. Naming

Use predictable Core Vault naming.

Examples:

```text
CV_EngineRoom
CV_HeroCamera
CV_Reactor
CV_Reactor_Base
CV_Reactor_Chamber
CV_Reactor_Frame
CV_Architecture
CV_Floor
CV_Ceiling
CV_Wall_North
CV_Wall_South
CV_Light_Key
CV_Light_Practical_01
```

Avoid Blender defaults such as:

```text
Cube
Cube.001
Cylinder.042
Material.003
```

Production assets must remain understandable to humans and automation.

---

# 20. Runtime state ownership

Imported static geometry must not contain fake representations of application truth.

For example, Blender may define:

- Reactor body
- Reactor chamber
- physical energy conduits
- glass
- mounting hardware

But runtime state should determine:

- whether the node is offline
- whether Bitcoin Core is syncing
- whether networking is disabled
- whether the wallet is locked
- whether a new block arrived
- whether signing is occurring
- whether verification succeeded

Visual effects tied to these states must originate from real application state.

Core Vault must never create beautiful but semantically false animation.

---

# 21. Cinematic quality without cinematic dishonesty

The experience may use cinematic presentation.

It may not visually imply events that did not occur.

Examples:

### Allowed

A short golden Reactor pulse when a real new block is accepted.

### Not allowed

Random golden pulses because they look attractive.

### Allowed

Network conduits becoming visually quiet when networking is disabled.

### Not allowed

Showing flowing network traffic while Bitcoin Core has networking disabled.

### Allowed

A signing chamber responding to a real signing operation.

### Not allowed

Continuous decorative signing animations.

The world may dramatize reality.

It must not fabricate reality.

---

# 22. Camera design

The application should not behave like a free-camera 3D editor.

Camera movement should be authored.

Each room may define:

- overview camera
- hero camera
- inspection points
- interaction cameras
- transition paths

Camera movement should preserve architectural composition.

Avoid positions where:

- walls visibly clip
- scene construction becomes exposed
- the room appears empty
- scale collapses
- lighting breaks down

The environment should be designed for the camera system, and the camera system should be designed for the environment.

---

# 23. Post-processing

Post-processing should finish the image, not create it.

Potential effects:

- subtle bloom
- restrained tone mapping
- ambient occlusion
- selective depth effects
- anti-aliasing
- color grading
- atmospheric haze where appropriate

Avoid:

- aggressive bloom
- excessive chromatic aberration
- artificial film effects
- exaggerated lens distortion
- game-like neon glow

Core Vault should feel:

- physical
- quiet
- heavy
- serious
- durable

Not:

- cyberpunk
- arcade-like
- holographic
- crypto-themed
- casino-like

---

# 24. Visual language

Core Vault should consistently communicate:

### Permanence

Stone, mass, weight, architecture.

### Precision

Machined metal, measured geometry, restrained interfaces.

### Energy

Used selectively to represent actual Bitcoin activity.

### Sovereignty

No cloud-dashboard aesthetic.

### Time

The environment should feel constructed to last decades rather than designed around a current UI trend.

---

# 25. Forbidden shortcuts

The following approaches should not be used as substitutes for proper environment production:

- building final rooms primarily from uncomposed Three.js primitives or disconnected DOM/CSS/vector layers
- compensating for weak geometry with bloom
- compensating for weak materials with emissive colors
- adding random machinery purely to create complexity
- increasing polygon count without visual purpose
- starting runtime integration before Blender visual approval
- declaring a room finished because all interactions work
- accepting a room merely because it is recognizably based on the reference
- treating the reference image as optional inspiration
- replacing reference matching with subjective “looks good enough”

---

# 26. Screenshot validation

Each production room requires screenshot validation.

At minimum capture:

1. Blender hero render
2. runtime hero-camera screenshot
3. runtime overview screenshot
4. close-up of primary hero asset

The hero-camera runtime screenshot must be compared directly against the approved reference.

Maintain these images as visual QA evidence when practical.

---

# 27. Visual acceptance criteria

A room is not finished until all of the following are true.

## Architecture

- Major proportions correspond to the approved reference.
- Scale feels believable.
- No major element feels like a placeholder.
- Important edges and joints have physical construction logic.

## Composition

- Hero camera closely matches the reference composition.
- Primary focal object has comparable visual importance.
- Foreground, midground and background depth are preserved.

## Materials

- Major surfaces have physically convincing responses.
- Stone does not look like flat textured geometry.
- Metal does not look like gray plastic.
- Glass does not look like simple transparency.
- Texture tiling is not distracting.

## Lighting

- Lighting hierarchy resembles the reference.
- Shadows contribute to depth.
- Important geometry remains readable.
- The room is not uniformly illuminated.

## Detail

- Detail density supports perceived scale.
- Hero objects hold up at intended inspection distances.
- Repetition is controlled.

## Runtime

- Visual quality remains close to the approved Blender scene.
- Application state drives dynamic effects.
- Interaction remains responsive.
- Performance remains inside the agreed budget.

---

# 28. Fidelity gate

The following question must be answered before a room can be considered complete:

> If someone saw the reference image and then immediately saw a screenshot of the runtime room from the hero camera, would they perceive them as two representations of essentially the same environment?

If the answer is no, the room has not passed the fidelity gate.

This remains true even if:

- the room works technically
- all tests pass
- the GLB loads correctly
- interactions work
- performance is excellent

Technical completion and artistic completion are separate requirements.

Both are mandatory.

---

# 29. Current Engine Room directive

The existing Engine Room should be treated as a successful **technical prototype**, not as the final artistic foundation.

The current approved Hero Reference Image is:

`docs/references/engine-room/engine-room-hero-reference.png`

All future Engine Room scene production and visual validation must use this file as the canonical reference.

Its existing work should be preserved where it contains valuable:

- Bitcoin state integration
- Reactor state logic
- interaction logic
- camera behavior
- tests
- runtime architecture
- reduced-motion behavior
- asset loading infrastructure

However, the visible environment should not be constrained by the current procedural scene.

### Required approach

Create a new authored Engine Room environment in Blender based directly on the approved Engine Room reference image.

Do not attempt to reach the target merely by adding more decorations to the existing room.

The reconstruction should begin from:

1. hero camera
2. room proportions
3. major architecture
4. Reactor scale and placement
5. lighting
6. materials
7. structural detail
8. secondary detail

Existing runtime systems should then be integrated into the approved authored environment.

The current implementation may remain temporarily available as:

- fallback
- development reference
- technical comparison

until the replacement passes all quality gates.

---

# 30. Engine Room milestone sequence

The Engine Room should now proceed through these explicit checkpoints.

## ER-01 — Camera Match

Blender scene with correct camera perspective and basic masses.

**No detailed modeling.**

Deliverable:

- reference image
- Blender greybox hero render

Do not proceed without a convincing composition match.

---

## ER-02 — Architectural Match

Production architecture sufficiently represents:

- room shell
- openings
- ceiling
- walls
- floor
- Reactor platform
- stairs
- major structural framing

Deliverable:

- Blender hero render
- alternate angle render

---

## ER-03 — Reactor Match

Production Reactor reaches approved visual quality.

Deliverable:

- full-room hero render
- Reactor medium shot
- Reactor close-up

---

## ER-04 — Material Match

Major material families implemented and tuned.

Deliverable:

- hero render under production lighting

---

## ER-05 — Lighting Match

Lighting and atmosphere closely reproduce the reference.

This is the first stage where the rendered frame should begin approaching the final target.

---

## ER-06 — Detail Pass

Secondary architecture and environmental detail added.

---

## ER-07 — Blender Approval

Direct reference-vs-render comparison.

No runtime integration until approved.

---

## ER-08 — Optimization

Measure and optimize the approved scene.

---

## ER-09 — Runtime Integration

Bring approved GLB into Core Vault.

Reconnect existing application state and interactions.

---

## ER-10 — Runtime Fidelity Review

Compare:

- original reference
- Blender final
- Tauri runtime

Identify any degradation caused by export or real-time rendering.

Correct where practical.

---

## ER-11 — Performance Review

Measure actual runtime behavior.

Optimization decisions must be driven by profiling.

---

## ER-12 — Completion

Once its cinematic 2.5D proof passes human review, Engine Room becomes the visual baseline for subsequent Core Vault environments.

Future rooms must equal or exceed its production quality.

---

# 31. Do not scale production prematurely

Do not build all Core Vault rooms simultaneously.

The Engine Room is the production proving ground.

The complete pipeline should first be validated here.

Only after the Engine Room demonstrates:

- acceptable fidelity
- acceptable performance
- reliable Blender → GLB workflow
- maintainable runtime integration

should the same process be applied systematically to additional rooms.

This prevents repeating a flawed workflow across the entire product.

---

# 32. Automation / Codex guidance

Any coding or autonomous agent working on Core Vault scene production should read this document and `RENDERER_DIRECTION_DECISION.md` before modifying a production environment.

Agents must not interpret requests such as:

> “Make the Engine Room closer to the reference.”

as permission for unrestricted incremental decoration.

Instead they should determine the current production stage and work only on the relevant gate.

When visual judgment is required, the agent should produce screenshots/renders for human review rather than silently assuming artistic approval.

Automated tests can verify:

- asset existence
- asset structure
- naming
- loadability
- material presence
- geometry budgets
- runtime behavior
- application state
- regressions

Automated tests cannot determine whether the room genuinely matches the artistic target.

Human visual approval remains required.

---

# 33. Definition of Done — production environment

A Core Vault room is complete only when:

- [ ] an approved Hero Reference Image exists
- [ ] a matching `CV_HeroCamera` exists
- [ ] Blender greybox passed composition review
- [ ] architecture passed visual review
- [ ] hero assets passed visual review
- [ ] materials passed visual review
- [ ] lighting passed visual review
- [ ] final Blender render passed reference comparison
- [ ] source `.blend` is stored and reproducible
- [ ] optimized GLB is generated
- [ ] asset is registered correctly
- [ ] runtime state integration is truthful
- [ ] runtime hero screenshot remains visually close to Blender
- [ ] performance is profiled
- [ ] obvious performance bottlenecks are resolved
- [ ] reduced-motion behavior remains correct
- [ ] technical tests pass
- [ ] final runtime visual QA passes

A passing test suite alone does not satisfy this Definition of Done.

---

# 34. Final principle

Core Vault should not ask users to imagine what the concept art represented.

It should allow them to enter it.

The objective of this pipeline is therefore not maximum graphical complexity.

It is maximum **coherence, physicality, fidelity and meaning per rendered frame**.

Every room should feel intentional.

Every material should feel physical.

Every animation should correspond to truth.

Every visual effect should have a reason to exist.

And the final real-time environment should remain recognizably, unmistakably, the world established by its approved reference artwork.
