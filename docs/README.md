# Core Vault project specifications

This directory contains the authoritative product, design, architecture, interaction, security, and implementation specifications for Core Vault. These documents are part of the project, not external or optional notes.

Read and follow the relevant specifications before making any substantial application change. `01_VISION_AND_PHILOSOPHY.md` is the highest product authority and defines the core vision for Core Vault. Later documents may be more technically specific, but they must not silently contradict that vision.

If the implementation and documentation disagree, state the conflict explicitly. Do not silently choose one side. Preserve the working Bitcoin Core integration unless a later approved specification explicitly requires a change.

## Specification hierarchy

1. `01_VISION_AND_PHILOSOPHY.md`: core product vision
2. `02_DESIGN_PRINCIPLES.md`: fixed design rules
3. `03_TECHNICAL_ARCHITECTURE.md`: software architecture
4. `04_WORLD_BIBLE.md`: the Core Vault world and its spatial language
5. `05_ROOM_DESIGN.md`: rooms and their functions
6. `06_INTERACTION_DESIGN.md`: interaction with the world
7. `07_BITCOIN_CORE_INTEGRATION.md`: mapping the experience to Bitcoin Core
8. `08_ART_DIRECTION.md`: materials, lighting, atmosphere, sound, and animation
9. `09_IMPLEMENTATION_ROADMAP.md`: implementation order
10. `10_CODEX_RULES.md`: rules for future AI-assisted development

Existing unnumbered documents remain historical, technical, or prototype documentation until an approved specification resolves their status. They do not override the hierarchy above.
