# Core Vault spatial V2 visual language

## Reference sources

The spatial presentation layer draws from two visual series on btcpavao.com:

- [The Long Road Back to Bitcoin Core](https://btcpavao.com/en/bitcoin-core/the-long-road-back-to-bitcoin-core/)
- [How Bitcoin Core generates entropy when we create a new wallet](https://btcpavao.com/hr/bitcoin-core/kako-bitcoin-core-generira-entropiju-kada-napravimo-novi-wallet/)

The design review covered every image in both articles. Their recurring motifs became rules for the world: Mediterranean limestone and sea, bronze joints, transparent chambers, blue blocks and data flows, gold key and deterministic-root lines, and calm daylight.

## Room mapping

| Room | Spatial motif | Functional meaning |
| --- | --- | --- |
| Main Hall | four stone passages and a central glass vault | navigation and wallet selection |
| Workshop | protected root, key, and three separate capsules | choose a single-signature or 2-of-3 policy |
| Vault Chamber | concentric bronze doors and two light channels | status, receive, send, and backup |
| Archive | recovery chest and capsules in stone niches | create a backup and prove a restore |
| Communications | transparent chamber with a blue input and gold output | receive address and PSBT proposal |
| Engine Room | large local machine with visible flows | P2P status, synchronization, and Core metrics |
| Observatory | pool of blocks beside the full-chain archive | chain, wallet, and RPC observations |
| Library | wall of blue blocks and illuminated steles | sources, limitations, and project status |

## Interaction rules

- The room is the primary interface. Artifacts are semantic `button` elements with clear names.
- A form appears only after the user selects an artifact, inside a contextual stone and glass console.
- Global navigation is an always-available fallback, not the primary way to move through the world.
- Blue status light represents data, connection, and verification. Gold represents a key, identity, or output.
- Critical actions still use conventional confirmations, explicit language, and a separate broadcast step.
- Reduced-motion mode stops room entrances, floating dust, energy flow, and rotation.

## Implementation

- `src/components/world.tsx` contains the shared primitives: `WorldScene`, `ArtifactButton`, `ContextOverlay`, `EnergyCore`, `ObservationBasin`, and `RecessedLedger`.
- `src/SpatialApp.tsx` coordinates the rooms and existing Core functions.
- `src/spatial.css` defines materials, composition, motion, and responsive layout.
- `src/assets/world/` contains local optimized WebP scenes. The application loads no runtime network assets.
