# Core Vault — Art Direction

**Document:** 08 / Art & Atmosphere Specification  
**Status:** Foundational Art Direction  
**Depends on:**
- `01_VISION_AND_PHILOSOPHY.md`
- `02_DESIGN_PRINCIPLES.md`
- `03_TECHNICAL_ARCHITECTURE.md`
- `04_WORLD_BIBLE.md`
- `05_ROOM_DESIGN.md`
- `06_INTERACTION_DESIGN.md`
- `07_BITCOIN_CORE_INTEGRATION.md`

**Applies to:** 3D art, environment design, architecture, materials, lighting, color, modelling, shaders, VFX, animation, cinematography, UI integration, typography, sound, ambience, asset production, visual QA, and all future Core Vault visual content.

---

# 1. Purpose of This Document

This document defines the visual and audiovisual identity of Core Vault.

It answers:

- what Core Vault should look like
- how realistic it should be
- which materials define the world
- how Mediterranean influence should appear
- how high technology should appear
- what blue and gold energy mean visually
- how scenes should be lit
- how the camera should frame spaces
- how objects should animate
- how sound contributes to presence
- what visual directions are explicitly forbidden
- how concept art should be translated into production assets

The purpose is consistency.

Core Vault should never become a collection of individually attractive rooms that belong to unrelated visual worlds.

---

# 2. Art Direction North Star

The desired visual result can be summarized as:

> **Photorealistic Mediterranean permanence fused with restrained advanced technology.**

The world should feel:

- believable
- tactile
- calm
- sophisticated
- warm
- precise
- quietly futuristic
- timeless

It should look close enough to reality that the user feels they could physically stand inside the environment.

---

# 3. Target Visual Fidelity

Core Vault should target:

> **high-end real-time architectural visualization / cinematic game-environment quality**

rather than:

- flat illustration
- vector art
- stylized low-poly
- cartoon rendering
- generic web graphics
- painterly 2D backgrounds

The desired result should visually sit closer to:

- modern high-end real-time games
- architectural visualization
- cinematic museum installations
- premium interactive 3D experiences

than ordinary application UI.

---

# 4. Realistic, Not Hyper-Dramatic

Realism should come from:

- correct scale
- believable light
- quality materials
- physical depth
- subtle surface variation
- convincing reflections
- shadow
- atmospheric perspective

Not from:

- excessive lens effects
- exaggerated cinematic grading
- massive depth-of-field blur
- strong film grain
- hyper-detailed visual clutter

The world must remain easy to operate.

---

# 5. Reference Artwork

Existing imagery from projects including:

- **How Bitcoin Core Generates Entropy**
- **My Long Road Back to Bitcoin Core**

may be used as visual reference material.

They establish a design lineage involving:

- Mediterranean architecture
- luminous blue technology
- warm gold energy
- glass
- bronze
- daylight
- calm coastal atmosphere
- physical technological artefacts

These references are **concept art references**.

They are not production backgrounds.

---

# 6. Reference-Art Rule

Never:

- import an article illustration as a fullscreen application background
- add buttons over it
- add CSS animation over it
- treat it as a complete room

Instead:

1. study composition
2. extract material language
3. extract lighting language
4. extract shapes
5. extract energy treatment
6. design a new original 3D environment specifically for Core Vault functionality

---

# 7. The Desired Screenshot Test

A screenshot of Core Vault should initially look like:

> a frame from a sophisticated interactive 3D environment

rather than:

> an application screenshot.

Only closer inspection should reveal that the environment is actually controlling Bitcoin Core.

---

# 8. Visual Keywords

Primary:

- Mediterranean
- limestone
- warm sunlight
- bronze
- glass
- blue energy
- gold energy
- precision
- permanence
- horizon
- quiet
- atmospheric
- technological
- tactile
- elegant
- monumental restraint

Secondary:

- engineered
- coastal
- transparent
- luminous
- serene
- geometric
- architectural
- physical

---

# 9. Forbidden Visual Keywords

Do not drift into:

- cyberpunk
- steampunk
- fantasy
- crypto casino
- hacker aesthetic
- military bunker
- corporate SaaS
- neon nightclub
- glossy spaceship cockpit
- medieval
- luxury-bank lobby
- crypto exchange
- dystopian future
- dark sci-fi corridor

---

# 10. Mediterranean Identity

Mediterranean influence comes primarily from:

- architecture
- proportions
- stone
- climate
- sunlight
- landscape
- openness
- sea
- restrained vegetation

Not from:

- obvious tourist decoration
- blue-and-white Greek stereotypes
- amphorae
- historical statues
- Roman decoration
- mosaic overload

---

# 11. Architectural Mood

Core Vault architecture should feel:

> purpose-built, timeless, and maintained.

It is neither old nor new.

Its technology appears naturally integrated from the beginning.

The user should not be able to assign a clear historical period.

---

# 12. Architectural Scale

Rooms should feel large enough to establish presence, but not so huge that the user feels insignificant.

Recommended emotional scale:

> private monumental architecture

Not:

> palace

Not:

> cathedral

Not:

> small apartment.

---

# 13. Architectural Shapes

Favor:

- broad arches
- strong vertical openings
- thick stone planes
- broad stairs
- circular machinery foundations
- clean recesses
- long horizontal sightlines
- controlled curves

Avoid excessively complex parametric architecture.

---

# 14. Architecture Must Frame Function

Every room's architecture should direct attention toward its main semantic object.

Examples:

Workshop:
- architecture converges toward build table

Engine Room:
- circular chamber frames Core Reactor

Archive:
- rhythm of wall niches frames Capsules

Observatory:
- architecture opens toward horizon and data field

---

# 15. Architectural Empty Space

Negative space is essential.

Do not fill every wall.

Large calm surfaces:

- strengthen material quality
- improve readability
- create visual rest
- allow lighting to become visible

---

# 16. Primary Material — Mediterranean Limestone

Limestone is the main architectural material.

Desired appearance:

- warm ivory
- subtle beige
- soft matte reflection
- fine pores
- restrained natural variation
- slightly worn edges
- tactile mass

It should feel physically expensive because of quality, not luxury.

---

# 17. Limestone Base Palette

Starting visual reference values:

```text
Warm Limestone Highlight: #E9DDC8
Warm Limestone Base:      #D7C8AF
Limestone Shadow:         #A99A83
Deep Stone Occlusion:     #756B5E
```

These are not rigid UI hex requirements for rendered PBR materials.

They are art-direction anchors.

Actual scene color depends on lighting and tone mapping.

---

# 18. Limestone Roughness

PBR guideline:

```text
roughness: approximately 0.7–0.95
metalness: 0
```

Variation should come from:

- surface normal
- micro-roughness
- mild albedo variation

Avoid wet-looking polished stone unless a specific architectural element calls for it.

---

# 19. Stone Damage

Use sparingly:

- tiny edge wear
- micro scratches
- slight discoloration
- natural variation

Avoid:

- huge cracks
- broken chunks
- archaeological ruin damage
- heavy stains
- moss everywhere

The facility is actively maintained.

---

# 20. Primary Metal — Bronze

Bronze provides the main technological structure.

Desired tone:

- warm
- engineered
- slightly dark
- refined
- physically believable

It should bridge stone and energy.

---

# 21. Bronze Palette

Reference values:

```text
Bronze Highlight:   #B98A53
Bronze Mid:         #8B6239
Bronze Deep:        #4D392B
Bronze Shadow:      #29221D
```

Actual PBR response should depend heavily on lighting.

---

# 22. Bronze PBR

Typical guidance:

```text
metalness: 0.8–1.0
roughness: 0.25–0.55
```

Not every bronze object should be polished.

Large structural bronze:

- rougher

Precision rings / mechanisms:

- slightly smoother

---

# 23. Gold-Toned Metal

Gold-toned material may appear on:

- authorization mechanisms
- validated state accents
- key details

It must not look like jewelry.

Use muted engineered gold.

Avoid mirror-polished yellow gold.

---

# 24. Dark Structural Metal

Some technology may require darker framing.

Reference:

```text
Dark Metal Base: #292D30
Dark Metal Deep: #131719
```

This supports contrast around:

- glass
- energy
- bronze

Do not let dark metal overwhelm warm materials.

---

# 25. Glass

Glass is a central technological material.

Use for:

- reactor chambers
- conduits
- capsules
- terminals
- Key cores
- observation mechanisms

Desired characteristics:

- physically plausible refraction
- slight thickness
- restrained reflection
- subtle imperfections
- visible edge highlights

---

# 26. Glass Must Feel Physical

Avoid:

- perfectly invisible glass
- generic flat transparent planes
- web-like glassmorphism

Glass should visibly occupy space.

Use:

- edge reflection
- thickness
- mild refraction
- occasional surface microdetail

---

# 27. Blue Energy

Blue energy represents active computation, information, infrastructure, and system flow.

Reference color family:

```text
Core Blue White:  #D9F8FF
Energy Cyan:      #63DFF2
Core Blue:        #2C95D6
Deep Energy Blue: #15599A
```

Use physically emitted light, not flat neon outlines.

---

# 28. Gold Energy

Gold energy broadly communicates:

- authorization
- validation
- successful completion
- trusted policy progression

Reference family:

```text
Warm Gold White: #FFF0C2
Energy Gold:     #F3C45E
Deep Gold:       #C48B2E
Amber Shadow:    #7A4C18
```

---

# 29. Emissive Hierarchy

Not all energy should have equal brightness.

Three approximate levels:

## Ambient

barely luminous

## Active

clearly visible and influencing nearby surfaces

## Semantic event

temporarily brighter during meaningful state transition

Then return to stable levels.

---

# 30. Energy Must Illuminate Its Environment

A glowing Key core should produce subtle real illumination on:

- metal frame
- nearby stone
- glass

A Reactor should affect its chamber.

This makes energy feel physical rather than graphical.

---

# 31. No Neon Outlines

Avoid using thin emissive outlines around every interactable object.

Interaction state should combine:

- light
- composition
- material
- object response

rather than generic neon UI treatment.

---

# 32. Blue/Gold Balance

Blue should generally be more common as continuous technological infrastructure.

Gold should generally be rarer.

This preserves gold's semantic significance.

A scene covered continuously in both blue and gold loses meaning.

---

# 33. Natural Light

Mediterranean sunlight is one of the most important components of the entire visual identity.

Desired:

- warm
- directional
- soft-edged
- believable
- bright without overexposure

The world should not feel dependent only on artificial technology lighting.

---

# 34. Sunlight Temperature

Approximate artistic target:

```text
4500K–5600K
```

depending on room and time interpretation.

A slight warmth works well against cooler technology.

---

# 35. Sky Fill

Exterior openings should receive cooler sky illumination.

This creates the core visual contrast:

```text
warm direct light
+
cool environmental fill
+
blue technological light
+
gold validated light
```

---

# 36. Blue Hour Is Not Default

Do not make the entire application a permanent nighttime sci-fi environment.

Core Vault's foundational appearance should be daylight or warm late-day Mediterranean light.

Night variants may come later.

---

# 37. Golden Hour

Late-afternoon warmth may inspire some scenes.

Avoid overdoing orange grading.

Stone should remain neutral enough for blue technology to contrast naturally.

---

# 38. Interior Lighting

Architectural fixtures should be subtle and integrated.

Possible:

- recessed bronze fixtures
- concealed warm strip illumination
- low indirect stone bounce
- illuminated technology

Avoid office ceiling lights.

---

# 39. Light Must Guide Attention

Use local light subtly to emphasize interactive priorities.

Examples:

Workshop:
central platform receives strongest functional illumination.

Archive:
relevant Capsule gains small emphasis.

Engine Room:
Reactor naturally dominates.

---

# 40. No Random Spotlights

Do not illuminate every object like a museum exhibit.

Only focal elements receive stronger composition.

---

# 41. Shadows

Shadows should provide:

- grounding
- scale
- object weight
- depth

Use soft natural shadows where appropriate.

Avoid excessively hard theatrical shadows throughout the application.

---

# 42. Ambient Occlusion

AO is useful for:

- stone joints
- mechanical interfaces
- object grounding

Keep restrained.

Excessive AO makes scenes dirty and game-like.

---

# 43. Reflections

Use controlled reflections for:

- glass
- bronze
- polished metal

Not every surface requires dynamic real-time reflections.

Prefer efficient probes/environment reflections where sufficient.

---

# 44. Surface Imperfection

Perfect materials look synthetic.

Add restrained:

- roughness variation
- micro scratches
- subtle fingerprints only where believable
- slight manufacturing variation

Do not make artefacts dirty.

---

# 45. Overall Color Palette

Core Vault's broad palette:

```text
Warm stone
Bronze
Muted gold
Deep structural charcoal
Mediterranean sky blue
Core energy blue
Validated energy gold
Warm sunlight
Soft sea blue
```

---

# 46. UI Neutral Colors

Contextual interface should harmonize with the world.

Suggested references:

```text
UI Dark:           #141B20
UI Dark Soft:      #202A30
UI Stone Light:    #EFE6D7
UI Stone Base:     #D9CEBC
UI Text Dark:      #1C2529
UI Text Light:     #F4EEE5
UI Muted:          #A79F93
UI Bronze Accent:  #A97B48
UI Blue Accent:    #3BA5CF
```

These should later become design tokens.

---

# 47. Red

Reserve red for real warnings/errors.

Reference direction:

```text
Error Red: #B84E45
```

Avoid saturated pure red.

It should feel serious, not alarming.

---

# 48. Green

Do not use generic bright green as universal “success.”

Validated states belong more naturally to:

- gold
- semantic completion
- stable mechanism

Green may be used only where accessibility or conventional meaning requires it.

---

# 49. Typography

Typography must bridge:

- architectural elegance
- modern technical clarity

Recommended structure:

## Display / room titles

elegant restrained serif or humanist display face

## Functional UI

highly readable sans serif

Do not use sci-fi fonts.

---

# 50. Typography Must Not Become Historical

Avoid typefaces that make the environment feel:

- Roman
- medieval
- fantasy
- archaeological

Serif use must remain contemporary.

---

# 51. UI Text

Functional text must be exceptionally readable.

Avoid:

- tiny type
- excessive uppercase
- thin fonts
- low contrast
- letter spacing used for fake futuristic style

---

# 52. 3D Text

Use 3D text sparingly.

Suitable:

- engraved Vault names
- room identity
- object identifiers

Unsuitable:

- full transaction review
- Bitcoin addresses
- technical documentation
- lengthy instructions

---

# 53. Iconography

Icons may support conventional panels.

Style:

- simple
- geometric
- thin but readable
- contemporary

Do not create fantasy-symbol icon language.

---

# 54. Bitcoin Symbol

Use Bitcoin symbol sparingly.

It should not appear on every object.

Potential:

- About
- selected network/system context
- subtle architectural emblem

Avoid turning the facility into Bitcoin-branded merchandise.

---

# 55. Visual Hierarchy

Every scene should establish:

1. dominant focal object
2. secondary navigation
3. ambient architecture
4. contextual details

Do not let small VFX compete with primary objects.

---

# 56. Scene Composition

Favor cinematic but functional composition.

Useful principles:

- leading lines
- rule of thirds where appropriate
- framed vistas
- strong central symmetry in mechanical rooms
- asymmetry where calmness benefits
- clear depth planes

---

# 57. Camera Lens

Avoid extreme FOV.

Approximate starting range for perspective camera:

```text
35mm–55mm equivalent
```

depending on room.

Wide enough to establish environment.

Narrow enough to avoid game-like distortion.

---

# 58. Main Hall Camera

Slightly cinematic architectural framing.

The user should perceive:

- space
- destination hierarchy
- Vault area

No huge UI blocking the scene.

---

# 59. Workshop Camera

The central table should feel physically reachable.

Use slightly closer composition.

The user needs to inspect:

- Vault
- Keys
- mechanisms

without excessive camera motion.

---

# 60. Engine Room Camera

Reactor may receive the most monumental framing.

Still maintain human-scale reference elements.

Avoid making the Reactor look like a gigantic sci-fi planet engine.

---

# 61. Observatory Camera

Allow more horizon.

More negative space.

Less machinery.

The user should experience openness.

---

# 62. Archive Camera

More enclosed.

Use depth and repeated niches.

Lighting should remain warm and readable.

Never dark dungeon mood.

---

# 63. Library Camera

Stable and comfortable for longer reading.

Avoid aggressive depth-of-field.

---

# 64. Depth of Field

Use temporarily for:

- artefact inspection
- controlled cinematic transition

Default room views should remain broadly sharp.

Bitcoin transaction UI must always be sharp.

---

# 65. Bloom

Bloom is central to energy treatment but must remain restrained.

Use around:

- Reactor cores
- active Key cores
- energy channels
- semantic completion

Avoid large fuzzy halos.

---

# 66. Tone Mapping

Use physically sensible tone mapping.

Target:

- preserved highlight detail
- warm stone
- luminous energy
- readable dark metals

Do not crush shadows for cinematic drama.

---

# 67. Exposure

Rooms should remain comfortably bright.

Especially:

- Main Hall
- Workshop
- Observatory
- Library

Engine Room may be darker, but never illegibly dark.

---

# 68. Vignette

If used:

- extremely subtle
- perhaps temporary during Focus Mode

Do not use permanent heavy game-camera vignette.

---

# 69. Film Grain

Prefer none.

If any grain exists, it should be almost imperceptible.

The experience should look clean, not artificially cinematic.

---

# 70. Chromatic Aberration

Do not use as a general effect.

It conflicts with precision and calmness.

---

# 71. Motion Blur

Avoid or keep exceptionally restrained.

UI and object state must remain visually precise.

---

# 72. Lens Flares

Rare.

Only physically justified.

Avoid sci-fi lens-flare spectacle.

---

# 73. Fog / Atmospheric Haze

Useful for large spaces and exterior depth.

Use extremely subtle.

Interior haze should not make the facility smoky.

---

# 74. Dust

Small dust particles in strong sunlight can contribute significant presence.

Use sparse particles.

They should be visible only under suitable lighting.

---

# 75. Sea

Sea treatment should be realistic but computationally efficient.

Desired:

- calm
- small slow waves
- subtle reflections
- no tropical turquoise exaggeration

The sea is background atmosphere, not interactive spectacle.

---

# 76. Sky

Primary sky:

- clear Mediterranean blue
- light cloud variation
- soft horizon haze

Avoid exaggerated fantasy cloud formations.

---

# 77. Vegetation

Use sparingly.

Potential:

- olive-like forms
- cypress silhouettes
- dry Mediterranean grasses
- restrained shrubs

Vegetation should frame architecture, not make the environment lush.

---

# 78. Fabric

Optional:

- subtle curtain
- shade cloth
- canopy

Useful for ambient wind movement.

Do not introduce resort aesthetics.

---

# 79. Water Inside the Facility

Avoid decorative fountains unless they serve a meaningful architectural purpose.

The sea already provides water identity.

---

# 80. Artefact Form Language

Technology artefacts should combine:

- circular geometry
- concentric rings
- precision segmentation
- contained cores
- bronze structural frames
- glass chambers
- restrained energy

Avoid random greebles.

---

# 81. Mechanical Complexity

A machine should look sophisticated because its components have a reason.

Avoid adding:

- arbitrary cables
- meaningless pistons
- random vents
- tiny mechanical junk

Less, better.

---

# 82. Vault Art Direction

Vault should communicate:

- mass
- policy
- protection
- precision

Suggested design:

- broad stone/metal base
- central glass/energy core
- authorization ring
- clearly defined Key interfaces
- heavy but elegant geometry

---

# 83. Single-Sig Vault Visual

One dominant authorization path.

The design should make it obvious that:

> one Key is enough

without a giant explanatory diagram.

---

# 84. Multisig Vault Visual

Multiple independent authorization channels converge.

For 2-of-3:

- three physical paths
- threshold mechanism visibly expects two
- state progression can activate individual channels

---

# 85. Key Art Direction

Keys should be among the most iconic Core Vault objects.

Suggested proportions:

- handheld-size
- compact but substantial
- recognizable silhouette
- precision bronze shell
- protected glass core
- subtle internal energy

---

# 86. Key Resting State

Inactive Key:

- low or no internal energy
- physically complete
- still visually attractive

Available Key:

- subtle blue life

Signed Key:

- validated gold component and stable system response

Exact color semantics should remain consistent with application state.

---

# 87. Key Signing Animation

Recommended phases:

1. selected
2. subtle activation
3. blue processing energy
4. backend result
5. if success:
   - short gold validation pulse
   - stable signed state
6. if failure:
   - processing stops
   - restrained warning state

Do not make the Key spin dramatically.

---

# 88. Backup Capsule Art Direction

Capsule should feel:

- archival
- durable
- carefully sealed
- transparent enough to show internal mechanism

Potential:

- vertical glass cylinder
- bronze containment rings
- engraved Vault identifier
- internal sealed core

---

# 89. Backup Writing Animation

During actual backup:

- controlled blue flow into Capsule
- small mechanism movement

After successful result:

- mechanical seal closes
- short gold validation
- stable state

No success before backend response.

---

# 90. Core Reactor Art Direction

The Reactor should be one of Core Vault's strongest visual icons.

Desired:

- central cylindrical or spherical contained core
- layered transparent chamber
- precision rings
- energy vortex or structured flow
- large but not absurd scale
- integrated stone/bronze support

This object may draw strongly from the energy/reactor language of reference art while remaining an original design.

---

# 91. Reactor Internal Energy

Avoid chaotic lightning.

Prefer:

- controlled flow
- coherent strands
- slow vortices
- pulse
- structured arcs
- moving layers

The machine feels mature and stable.

---

# 92. Sync Ring

Synchronization may use a physical ring around the Reactor.

The ring's progress is:

- mechanically clear
- restrained
- slow enough to read
- tied to real sync progress

Do not make it resemble a giant loading spinner.

---

# 93. Network Conduits

Network activity uses architectural conduits leaving the Reactor.

Active:

- subtle blue flow

Disabled:

- flow disappears
- conduit remains physically present

Do not delete geometry.

---

# 94. Communication Terminal

Terminals should feel like dedicated physical instruments.

Use:

- glass plate
- bronze frame
- signal core
- directional conduits

Conventional DOM UI can appear aligned with them.

---

# 95. Time Mechanism Art Direction

Future timelock object:

- concentric rotating rings
- suspended central timing core
- precision mechanical indices
- glass component

Avoid:

- literal antique clock
- steampunk gears
- fantasy hourglass

---

# 96. Policy Branch Visual

Future Taproot policy:

- structural branching object
- bronze skeleton
- glass/light paths
- visually distinct branch conditions

It should look like a physical policy structure, not a generic tree diagram pasted into 3D.

---

# 97. Animation Philosophy

Core Vault animation should feel:

> engineered.

Objects have:

- inertia
- precise easing
- physical stopping points
- mechanical timing

Avoid bouncy UI animation.

---

# 98. Animation Easing

Prefer curves resembling:

- gentle ease-in-out
- mechanical settle
- critically damped response

Avoid:

- elastic
- exaggerated overshoot
- cartoon bounce

---

# 99. Idle Animation

Idle movement should be slow.

Examples:

Reactor:
- subtle ongoing rotation/pulse

Key:
- very slow internal light breathing

Conduit:
- gradual flow

Sea:
- gentle waves

Sunlight:
- near-imperceptible shift

---

# 100. Interaction Animation

Interaction feedback should be faster than ambient motion.

Typical range:

```text
100–400 ms
```

for immediate state acknowledgment.

Camera focus may be slightly longer.

---

# 101. Room Transitions

Target:

```text
approximately 300–700 ms
```

depending on distance and composition.

Transitions should create spatial continuity without wasting user time.

---

# 102. Semantic Event Duration

Most Bitcoin event VFX should last:

```text
roughly 0.5–2 seconds
```

then settle.

A new block does not need ten seconds of ceremony.

---

# 103. Reduced Motion

All motion systems must define reduced variants.

Example:

normal:
- Reactor pulse + mechanical transition

reduced:
- static state change + short fade

Semantic information remains.

---

# 104. VFX Philosophy

Effects should look physically integrated.

Preferred:

- volumetric glow
- energy inside glass
- light spilling onto metal
- contained particles
- localized pulses

Avoid:

- full-screen flashes
- generic particle explosions
- radial game effects

---

# 105. Particle Density

Very low for atmospheric scenes.

Higher only in semantic visualization such as mempool field.

Performance budgets must remain explicit.

---

# 106. Mempool Art Direction

Mempool visualization should feel like:

> contained informational activity.

Potential:

- luminous particulate field
- density layers
- floating structured points
- slow flow

Avoid:

- flying coins
- frantic particle storm
- green/red market indicators

---

# 107. Block Art Direction

A block should feel:

- discrete
- stable
- substantial
- ordered

Potential visual:

- formed glass/bronze-light structure
- coherent pulse transforming into stable element

Do not make blocks literal stone cubes unless composition demands it.

---

# 108. New Block Event

Recommended:

1. Observatory field subtly gathers
2. distinct coherent pulse forms
3. new Block element resolves
4. Reactor receives brief acknowledgment
5. system returns to calm

No celebration.

---

# 109. Sound Direction

Core Vault sound should support:

- physicality
- scale
- calm
- place
- feedback

Sound is never required for operation.

---

# 110. Global Sound Character

Desired qualities:

- warm
- spatial
- low-volume
- textural
- restrained
- slightly resonant

Avoid:

- arcade
- digital bleeps
- phone notifications
- loud sci-fi
- cinematic trailer effects

---

# 111. Main Hall Sound

Possible components:

- distant sea
- light wind
- extremely subtle facility resonance
- distant technology

Nearly invisible.

---

# 112. Workshop Sound

Possible:

- quiet mechanical movements
- light material contact
- subtle energy hum
- occasional precision mechanism

No workshop industrial noise.

---

# 113. Vault Chamber Sound

Mostly quiet.

Potential:

- subtle low Vault resonance
- very soft energy core
- distant environment

This should feel private.

---

# 114. Archive Sound

Almost silent.

Possible:

- quiet room tone
- faint glass/metal resonance
- soft capsule mechanisms

Archive silence is intentional.

---

# 115. Communications Sound

Slightly more active.

Potential:

- directional signal tones
- very soft data flow
- short transmission impulse

Never modem-like novelty sounds.

---

# 116. Engine Room Sound

The strongest sound identity.

Base:

- low stable hum
- very slow rhythmic pulse
- distant mechanical resonance

Still quiet enough for long sessions.

---

# 117. Observatory Sound

Natural ambience dominates.

Potential:

- sea
- wind
- open-space room tone
- very faint technology

New block receives one restrained resonant event.

---

# 118. Library Sound

Very quiet.

Potential:

- air
- distant sea
- subtle room resonance

Reading must not be disrupted.

---

# 119. Key Sound

Key interactions should use a consistent family:

Focus:
- tiny material resonance

Seat:
- precision mechanical click

Signing:
- subtle energy activation

Accepted:
- clean, warm harmonic confirmation

---

# 120. Capsule Sound

During seal:

- glass/metal mechanism
- low controlled close
- tiny confirmation resonance

Should be satisfying without becoming a reward sound.

---

# 121. Broadcast Sound

One brief outward pulse.

Avoid “whoosh” cliché if too cinematic.

It should feel like controlled transmission.

---

# 122. Error Sound

Errors require:

- short
- low-intensity
- unmistakable

Avoid alarms.

A muted low dissonant tone is preferable.

---

# 123. Audio Dynamic Range

Keep narrow and restrained.

No sudden loud effects.

Core Vault should be safe to use quietly while wearing headphones.

---

# 124. Ambient Music

Default preference should be environmental ambience rather than music.

If musical ambience is eventually introduced:

- instrumental
- textural
- slow
- no dominant melody
- no percussion-heavy rhythm
- optional

Never imitate or copy recognizable music from EVE Online or other games.

---

# 125. Originality

All production assets must be:

- original
- commissioned appropriately
- generated under valid terms
- or correctly licensed

Do not directly copy:

- game models
- textures
- sounds
- music
- UI designs

from reference products.

---

# 126. Concept Art Workflow

Concept imagery can be created to define:

- composition
- architecture
- artefact silhouette
- lighting
- mood

Then translate approved designs into real production assets.

Concept image ≠ runtime environment.

---

# 127. 3D Modelling Workflow

Recommended source tool:

- Blender or equivalent professional DCC

Asset stages:

1. concept
2. blockout
3. proportions approval
4. high/low detail as required
5. UV
6. materials
7. animation rig/nodes
8. optimization
9. GLB export
10. runtime integration

---

# 128. Blockout First

Before high-detail modelling:

prove:

- room scale
- camera
- navigation
- object positions
- panel safe areas
- transition paths

with simple geometry.

Do not invest heavily in beautiful models before interaction works.

---

# 129. Greybox Acceptance

A room greybox should already answer:

- where user is
- where focal object sits
- how user navigates
- where contextual UI appears
- how camera moves

Only then proceed to final art.

---

# 130. Model Topology

Optimize for real-time use.

Do not import cinematic millions-of-polygons assets blindly.

Use:

- sensible topology
- normal maps
- LOD where needed
- instancing
- merged static architecture where useful

---

# 131. Asset Scale

Use consistent real-world scale.

Example:

```text
1 world unit ≈ 1 meter
```

or another documented standard.

Never mix arbitrary scales between rooms.

---

# 132. Asset Origin

Functional objects need predictable origins/pivots.

Example:

Key:
- pivot at semantic center or connector

Door:
- hinge

Reactor ring:
- rotational center

This matters for animation.

---

# 133. Naming

GLB hierarchy must use readable semantic names.

Bad:

```text
Cube.001
Cube.002
Cylinder47
```

Good:

```text
Key_Core
Key_Frame
Key_ActivationRing

Reactor_Core
Reactor_SyncRing
Reactor_NetworkConduit_A
```

---

# 134. Textures

Use PBR texture sets as required:

- base color
- normal
- roughness
- metallic
- AO selectively
- emissive

Avoid oversized uncompressed textures.

---

# 135. Texture Resolution

Allocate resolution according to screen-space importance.

Hero objects:
- higher

Background architecture:
- lower / tiled

Do not use 4K/8K everywhere.

---

# 136. Material Reuse

Create shared world materials.

Examples:

```text
CV_Limestone_A
CV_Limestone_B
CV_Bronze_Structural
CV_Bronze_Precision
CV_DarkMetal
CV_Glass_Clear
CV_Glass_Energy
CV_Energy_Blue
CV_Energy_Gold
```

This ensures coherence.

---

# 137. Scene-Specific Materials

Use only where justified.

Too many unique materials create:

- inconsistency
- larger builds
- more draw calls
- harder art maintenance

---

# 138. Decals

Use restrained decals for:

- subtle wear
- object identifiers
- material breaks

Avoid walls covered in graphics.

---

# 139. Engravings

Engravings are useful for:

- Vault identity
- Key identity
- subtle room indicators

Keep minimal and contemporary.

---

# 140. Procedural Materials

Procedural effects may help vary stone and metal.

Runtime procedural complexity should remain efficient.

Bake where dynamic behavior is unnecessary.

---

# 141. Shaders

Custom shaders are appropriate for:

- energy
- glass
- ocean
- subtle atmospheric effects

Shaders must be designed to scale across graphics quality levels.

---

# 142. Energy Shader

Desired behavior:

- layered internal movement
- controlled turbulence
- directional flow
- emissive core
- optional light coupling

Avoid visual appearance of electricity randomly arcing everywhere.

---

# 143. Glass Shader

Balance:

- transparency
- refraction
- reflection

against:

- readability
- performance
- depth sorting

Do not make critical artefacts unreadable because glass rendering is physically fancy.

---

# 144. UI Integration

DOM UI should not visually look pasted over the scene.

Use:

- aligned panel placement
- background environment dim
- world-related material cues
- restrained transparency
- clear typography

But do not fake perspective on text at the cost of readability.

---

# 145. Contextual Panel Appearance

Recommended character:

- dark charcoal or warm pale panel depending on scene
- subtle translucent depth
- bronze edge or accent
- high contrast
- minimal glow

Avoid giant floating hologram look.

---

# 146. Transaction Review Art Direction

When transaction review begins:

- camera freezes
- environment darkens slightly
- ambient energy reduces
- review UI becomes crisp and dominant

This is a deliberate visual mode.

Security supersedes spectacle.

---

# 147. Passphrase Art Direction

Passphrase panels should look:

- serious
- private
- simple

No decorative animation around password entry.

Focus on:

- legibility
- security messaging
- control.

---

# 148. Warnings

Warning design:

- localized
- restrained
- high contrast
- red/amber where justified

No flashing warning strips.

---

# 149. Mainnet Visual Treatment

Mainnet should not look “more prestigious” than Signet/Regtest.

Network identity is informational.

Do not make Mainnet gold and Regtest ugly.

Persistent textual network label handles certainty.

---

# 150. Demo Visual Treatment

Demo/Regtest must remain unmistakably marked without destroying immersion.

Possible:

- discreet persistent corner label
- contextual environmental identifier
- UI overlay

Never rely only on background color.

---

# 151. Accessibility and Art

Visual richness must survive:

- reduced motion
- higher contrast
- text scaling
- low graphics quality

Semantic function cannot disappear when effects are disabled.

---

# 152. Low Graphics Mode

May reduce:

- reflection quality
- particle count
- shadow resolution
- AO
- bloom
- post-processing
- texture resolution

Must preserve:

- object identity
- state
- navigation
- interaction
- lighting hierarchy

---

# 153. Performance Is Visual Quality

A scene running smoothly at slightly lower fidelity looks better than a photorealistic scene that stutters.

Performance should therefore be considered part of art direction.

---

# 154. Frame-Time Discipline

Art decisions should respect runtime budgets.

Monitor:

- triangles
- draw calls
- shader complexity
- texture memory
- shadow casters
- transparent objects
- post-processing cost

---

# 155. Transparent Geometry

Glass can become expensive.

Use it intentionally.

Do not build the entire facility out of overlapping transparent layers.

---

# 156. Dynamic Lights

Limit.

A few strong well-designed light sources outperform dozens of weak dynamic lights.

Emissive appearance does not always require a real dynamic light.

---

# 157. Baked Versus Dynamic

Bake:

- static architectural light
- broad ambient effects

Use dynamic for:

- semantic artefacts
- Reactor
- Key activation
- local event feedback

---

# 158. Scene LOD

Large/distant environments should use:

- LOD
- simplified geometry
- texture scaling

The user does not need hero-quality geometry on a distant arch.

---

# 159. Audio Performance

Ambient loops should be:

- compressed appropriately
- seamless
- local
- low CPU overhead

Do not play dozens of independent loops simultaneously.

---

# 160. Asset Folder Structure

Recommended:

```text
assets/
  world/
    shared/
      architecture/
      materials/
      vegetation/
      sky/
      sea/

    main-hall/
    workshop/
    vault-chamber/
    archive/
    communications/
    engine-room/
    observatory/
    library/

  artefacts/
    vault/
    key/
    backup-capsule/
    reactor/
    communications/
    time-mechanism/
    policy/

  audio/
    ambient/
    interaction/
    system/

  concepts/
    reference/
    approved/
```

---

# 161. Source Asset Structure

Keep source DCC files separate:

```text
art-source/
  blender/
  textures-source/
  audio-source/
  concept-source/
```

Do not package source files into production builds unnecessarily.

---

# 162. Concept Reference Metadata

Document why a reference image is included.

Example:

```text
Reference A
Purpose:
- limestone treatment
- glass reactor material
- warm/cool light contrast

Do not copy:
- exact architecture
- exact composition
```

This helps prevent literal copying.

---

# 163. Visual QA Checklist

For every room, verify:

- does architecture feel Mediterranean structurally?
- does technology feel integrated?
- is stone dominant enough?
- is blue/gold restrained?
- is lighting plausible?
- does room have clear focal point?
- is scale believable?
- are objects physically grounded?
- does it look like a real-time environment?
- is there visual calm?
- is UI secondary?

---

# 164. Artefact QA Checklist

For each primary artefact:

- unique silhouette?
- physically believable?
- semantic function visible?
- correct material family?
- supports all required states?
- animation pivots/nodes valid?
- low graphics fallback?
- accessible semantic equivalent?

---

# 165. Animation QA

Ask:

> Does movement explain, confirm, or enrich atmosphere?

If no:
remove it.

Ask:

> Does this animation feel engineered or playful?

If playful:
redesign.

---

# 166. VFX QA

Ask:

> Is this light coming from somewhere?

If not:
reconsider.

Ask:

> Would this still look sophisticated at half the glow intensity?

If yes:
use half the glow intensity.

---

# 167. Audio QA

Ask:

> If the application stayed open for two hours, would this sound become irritating?

If yes:
simplify.

Ask:

> Does this sound communicate physical action or merely reward the user?

Prefer physical action.

---

# 168. Screenshot Comparison

Every significant scene iteration should be compared against:

- approved Core Vault concept references
- other completed Core Vault rooms

Do not allow individual room art direction to drift.

---

# 169. Real-Time Test

Static screenshots are insufficient.

Review scenes:

- in motion
- during navigation
- in idle state
- during semantic events
- in reduced motion
- in lower graphics quality

Core Vault's visual identity includes time.

---

# 170. Lighting Continuity

Adjacent rooms should not feel like different times of day unless intentional.

Main Hall → Workshop should preserve broad exterior conditions.

Engine Room may become internally lit because of location, not because the sun suddenly disappeared.

---

# 171. Transition Continuity

Transitions should preserve:

- architectural material
- light direction
- rough geographic orientation

This helps the user believe spaces are connected.

---

# 172. World Identity Versus Room Identity

Each room must have an individual mood.

But room identity should come from:

- function
- architecture
- openness
- dominant artefact
- sound

not entirely different color palettes.

---

# 173. Main Hall Art Summary

Dominant:

- stone
- sunlight
- sea
- Vaults
- broad space

Technology:
- restrained

Mood:
- orientation and calm ownership

---

# 174. Workshop Art Summary

Dominant:

- central stone/bronze work table
- Keys
- Vault assembly
- precision machinery

Technology:
- medium-high

Mood:
- construction and understanding

---

# 175. Vault Chamber Art Summary

Dominant:

- selected Vault
- Key identity
- intimate architecture

Technology:
- medium

Mood:
- ownership and stability

---

# 176. Archive Art Summary

Dominant:

- stone niches
- Capsules
- protected depth

Technology:
- restrained

Mood:
- preservation and continuity

---

# 177. Communications Art Summary

Dominant:

- directional channels
- terminal
- controlled signal

Technology:
- high

Mood:
- precision and transmission

---

# 178. Engine Room Art Summary

Dominant:

- Core Reactor
- conduits
- heavy architecture
- blue system energy

Technology:
- highest

Mood:
- stable computational power

---

# 179. Observatory Art Summary

Dominant:

- horizon
- sea
- sky
- mempool visualization
- block events

Technology:
- elegant, secondary to openness

Mood:
- contemplation and observation

---

# 180. Library Art Summary

Dominant:

- warm stone
- quieter material palette
- knowledge artefacts
- reading space

Technology:
- subtle

Mood:
- understanding and reflection

---

# 181. Absolute Rejection Criteria

Reject a visual direction if it looks primarily like:

- web UI over image
- game menu
- crypto app
- cyberpunk environment
- generic spaceship
- fantasy vault
- bank
- server room
- Mediterranean resort
- ancient ruin
- neon tech demo

---

# 182. The “Web UI Over Art” Test

Hide all DOM panels.

If what remains is:

> one flat image with animated overlays

the implementation is wrong.

What remains must be a real spatial scene containing actual interactive objects.

---

# 183. The “Game” Test

Ask:

> Could this plausibly be a location inside a visually sophisticated modern game?

If no:
spatial fidelity may be insufficient.

Then ask:

> Does anything here make the software feel unserious, playful, or gamified?

If yes:
pull back.

Both tests matter.

---

# 184. The Realism Test

Ask:

> Do materials react to light as if they possess real physical properties?

> Does object scale make sense?

> Does technology appear assembled from real material?

If no:
improve fundamentals before adding more VFX.

---

# 185. The Mediterranean Test

Ask:

> If the sea were hidden, would the architecture still feel Mediterranean?

If no:
the design relies too heavily on ocean imagery.

Mediterranean character must exist in:

- stone
- light
- proportion
- architecture

---

# 186. The Technology Test

Ask:

> If emissive glow were temporarily disabled, would the technology still look sophisticated?

If no:
the technology is relying too heavily on glow.

Strengthen:

- form
- material
- mechanism
- construction

---

# 187. The Calmness Test

Ask:

> Can I leave this room open for five minutes without becoming visually fatigued?

If no:
reduce:

- movement
- contrast
- particles
- sound
- glow

---

# 188. The Semantic Color Test

Ask:

> Does gold still communicate something meaningful?

If gold is everywhere:
reduce it.

Ask:

> Does blue communicate active technological state rather than branding?

If not:
refine usage.

---

# 189. The Physicality Test

When an artefact activates:

does it feel like a physical machine changed state?

Or:

does it feel like a button changed CSS class?

Core Vault requires the first.

---

# 190. Final Art Direction Principle

The final visual standard is:

> **Core Vault should look like a real place built from stone, bronze, glass, sunlight, computation, and controlled energy — not like software decorated to suggest such a place.**

The Mediterranean architecture provides permanence.

The sea and horizon provide calm and scale.

The stone provides weight.

The bronze provides engineered precision.

The glass provides transparency.

Blue energy makes computation visible.

Gold energy makes validated authorization visible.

Real-time lighting makes all of those elements occupy the same physical world.

Motion makes the world breathe.

Sound makes it present.

And restraint keeps the experience appropriate for Bitcoin.

The desired result is not simply beautiful.

It should feel like a place the user could enter, understand, trust, and return to — while the actual Bitcoin work continues to be performed by Bitcoin Core beneath the surface.