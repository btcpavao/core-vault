# Bitcoin Design Guide alignment

The [Bitcoin Design Guide](https://bitcoin.design/guide/) is the primary UX reference for Core Vault. Bitcoin Core RPC documentation remains the technical source of truth.

Applied principles:

- Network context is persistent. `SIGNET`, `TESTNET4`, or `REGTEST` remains visible in the status rail and transaction review.
- Receiving begins with a fresh wallet-owned address, a scannable QR code, a human label, address type, and network.
- Sending is proposal-first. Destination, amount, fee, change, replaceability, network, signing, mempool acceptance, and broadcast are distinct review points.
- Backup is part of wallet creation, not an advanced afterthought. The Workshop leads a new Personal Vault directly to the Archive.
- Technical detail is progressively disclosed. Human state is prominent; wallet names, public fingerprints, and local RPC traces remain inspectable.
- Destructive or irreversible actions use explicit language and do not rely on color alone.

The spatial metaphor is task organization, not gamification. There are no rewards, scores, avatars, loot, or artificial progression gates.
