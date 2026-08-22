# Core Vault UI Bitcoin Design research

Review date: August 12, 2026

## Scope and authority

The primary UX reference for Core Vault is the [Bitcoin Design Guide](https://bitcoin.design/guide/), together with the official [BitcoinDesign/Guide repository](https://github.com/BitcoinDesign/Guide), reference flows, available Figma prototypes, and the Bitcoin Core App case study. The Guide is an evolving community resource, so open issues are treated as active discussions rather than final rules. Security invariants, Bitcoin Core behavior, and the local-only model take precedence when they conflict with design guidance.

The review covered wallet creation, savings and inheritance onboarding, cosigner onboarding, multi-key backup, transaction review, signing, recovery, key replacement, and succession. Linked Figma files were confirmed as available, but Core Vault copied neither their content nor their assets.

## Relevant Bitcoin Design principles

| Principle | Meaning and relevance | Core Vault application |
| --- | --- | --- |
| Self-custody | The user keeps control; Core Vault must not become a custodian or signer. | Bitcoin Core alone holds and uses keys. The UI is a replaceable coordinator. |
| Security | Security is a usable process. Multisig helps only when users understand it and complete every backup. | Linear checkpoints, technical hard stops, and explicit consequences of losing one or two keys. |
| Inclusion | Plain language must work without knowledge of descriptors, RPC, or PSBTs. | Lead with signing wallet, vault, approval, and public configuration. Put technical names in Advanced. |
| Interoperability | Open standards and an exit path prevent lock-in. | Checksummed descriptors, a documented public JSON schema, Core wallet backups, and room for file or QR PSBT adapters. |
| Transparency | Users should know who controls funds and be able to inspect application behavior. | Each major step has a short explanation and a sanitized expandable RPC trace. |
| Privacy | Show and share only what the current task needs. | Hide balances, limit address display, keep descriptors and fingerprints in Advanced, and make no analytics, explorer, or third-party calls. |
| Decentralization | Do not add a mandatory intermediary between the user and Bitcoin. | Use only local Core RPC and local broadcast. Core Vault has no service backend. |
| Progressive security | Extra friction may fit savings, but 2-of-3 is not a universal beginner wallet. | Present V1 as a Signet exercise for someone who already knows a standard Core wallet. Never call it ready for real bitcoin. |
| Research-led design | Measure fulfilled needs and understanding, not feature count. | Use one target participant, one end-to-end task, observations, and comprehension criteria in `USER_TEST_PLAN.md`. |

Sources include [Design principles](https://bitcoin.design/guide/getting-started/principles/), [Wallet security](https://bitcoin.design/guide/daily-spending-wallet/security/), [Accessibility](https://bitcoin.design/guide/designing-products/accessibility/), [Interoperability](https://bitcoin.design/guide/designing-products/interoperability/), [Wallet privacy](https://bitcoin.design/guide/how-it-works/wallet-privacy/), [Savings wallet](https://bitcoin.design/guide/savings-wallet/), and [Conducting research](https://bitcoin.design/guide/designing-products/user-research/).

## Visual language

The [Visual language](https://bitcoin.design/guide/getting-started/visual-language/) section rejects the idea of one mandatory Bitcoin aesthetic. Core Vault therefore does not copy bitcoin.design orange, its Figma UI kit, or its illustrations. The product uses warm neutral surfaces, one muted orange action color, clear typography, and functional line-art symbols for funds, signing wallets, and policy.

Reference screens support four structural choices. Flow maps include decisions and failure states, not only the happy path. Multi-key backup separates private-key backups from wallet configuration. Transaction review separates amount, recipient, and fee and permits edits before one primary CTA. Signing presents signer slots and a required-signature count instead of requiring the user to understand PSBTs.

## Core Vault mental model

The default layer teaches concepts in this order:

1. A **signing wallet** holds one key that Bitcoin Core uses to sign.
2. A **vault** is a rule under which any two of three keys can spend.
3. A **coordinator** watches the vault and prepares transactions but has no private key.
4. A **transaction approval** is one signing-wallet signature. Two approvals complete the transaction.

Descriptors, tpubs, fingerprints, derivation paths, PSBTs, witness scripts, and RPC are not prerequisites for a decision. They remain inspectable in Advanced.

## Reference-flow observations

**Onboarding and wallet creation.** The [usage life cycle](https://bitcoin.design/guide/designing-products/usage-life-cycle/) calls for a fast, trustworthy mental model and answers to "what can I lose?" and "can I leave?" Core Vault starts with the Personal Vault story and then shows 2-of-3. Savings and inheritance flows show the whole key setup before moving through one key per screen. Before finalization, Core Vault shows every key and states that one lost key is tolerable while two can lock the funds. V1 offers only `Personal Vault, 2-of-3 Native SegWit`; future templates should be story-first.

**Backup and multi-key setup.** [Bitcoin backups](https://bitcoin.design/guide/how-it-works/backups/) defines a backup as the information needed to recover outside the application. Inheritance guidance separates private-key backups from descriptor configuration. The latter cannot spend, but it is necessary for reconstruction and can track the entire wallet. Because [issue #1057](https://github.com/BitcoinDesign/Guide/issues/1057) leaves physical descriptor-backup guidance open, V1 creates local Core wallet backups plus an open public JSON file and explains the difference. K1, K2, K3, and the public configuration form a blocking checkpoint. Keys, fingerprints, tpubs, and derivation data must be distinct and backed up; private keys are never exchanged.

**Signing.** Cosigner and inheritance flows separate configuration import from signer activation, show signer slots, and reveal PSBT transfer only when needed. Core Vault abstracts this as **Add signature**. V1 uses a local Bitcoin Core wallet underneath, while future adapters may use a PSBT file, USB, or QR without changing the information architecture.

**Send and receive.** [Sending bitcoin](https://bitcoin.design/guide/daily-spending-wallet/sending/) supports simple recipient and amount entry, a visible fee, and mandatory review. Core Vault shows amount, destination, network fee, estimated remainder, and `2 of 3 approvals`. It uses sats as the primary unit and BTC secondarily, with no fiat API. [Receiving guidance](https://bitcoin.design/guide/daily-spending-wallet/requesting/receiving/) treats waiting as a state. Core Vault generates a new coordinator address on request, hides it elsewhere, and never sends it to an explorer.

**Recovery and errors.** Succession guidance starts recovery with human instructions and wallet configuration, then activates signers, then creates a transaction. V1 does not implement recovery, import, or inheritance, but its policy, signer, and timeline components leave room for them. Errors state what happened, whether funds are safe or a transaction was sent, and one next action. Raw RPC details stay in Advanced.

## Core Vault mapping

| Screen | Applied pattern |
| --- | --- |
| Welcome | vault story, 2-of-3 diagram, Signet limit, one CTA |
| Core connection | local connection, Signet, no remote server, telemetry off, keys handled by Core |
| K1/K2/K3 | one signing wallet per step, create then encrypt then ready |
| Vault review | all signers, 2-of-3 consequences, clear confirmation |
| Coordinator | separate watch-only object, descriptor only in Advanced |
| Backup | three signing-capability backups separate from privacy-sensitive public configuration |
| Receive | fresh Signet address, hidden balance, local payment check |
| Create and review transaction | recipient, sats, fee, remainder, approvals, editing before signatures |
| Add signature | three signer slots and local Core signing without visible PSBT data |
| Broadcast | repeated summary before the irreversible action and a locally returned txid |
| Advanced RPC | method, redacted arguments and result, plain explanation |
| Errors | problem, funds status, next action, optional RPC details |

## Deliberate deviations

- All three V1 signing wallets live in one local Core instance. This proves GUI coordination on Signet but does not remove a device-level single point of failure. Hardware wallets are outside V1.
- Setup cannot finish without all four backups. A later reminder is too weak for this experiment.
- Small Signet values use sats first and BTC second, without fiat data.
- V1 offers one fixed policy instead of templates and custom configuration to keep the security and test surface narrow.
- V1 collects two signatures from local Core wallets without manual PSBT transfer. The generic `Add signature` label leaves room for later adapters.
- The Advanced trace keeps PSBT and raw transaction data redacted in Rust memory. This reduces clipboard, screenshot, and browser-state leaks.
- Success shows a local txid without an explorer link.
- Public configuration carries a privacy warning because it can track past and future wallet activity.
- V1 does not persist the setup session or a passphrase. Core wallets and backup files survive independently, but the wizard does not resume automatically.

## Current repository signals

At review time, the official repository separated guide content from reference assets and used Apache-2.0, MIT, and CC-BY licenses. [Design source files](https://bitcoin.design/guide/resources/design-files/) are available for personal and commercial use with attribution. Core Vault uses no Guide asset, illustration, or component, so the UI needs no asset attribution. This research document still cites its sources.

Relevant open work includes [#1057 on descriptor and multisig backups](https://github.com/BitcoinDesign/Guide/issues/1057), [#1106 on test transactions](https://github.com/BitcoinDesign/Guide/issues/1106), [#505 on error states](https://github.com/BitcoinDesign/Guide/issues/505), [#778 on shared wallets](https://github.com/BitcoinDesign/Guide/issues/778), [#59 on external signers](https://github.com/BitcoinDesign/Guide/issues/59), [#1197 on graduated wallets](https://github.com/BitcoinDesign/Guide/issues/1197), and [#1113 on research guidance](https://github.com/BitcoinDesign/Guide/issues/1113). These issues support the direction but are not final product requirements.

## V1 design decision test

Apply this question to every decision:

> Can we remove complexity from the user's task without removing their ability to understand and verify what Bitcoin Core does?

If yes, the default UI uses plain language and one CTA. Information stays visible when hiding it would weaken understanding of a critical security decision. Technical information needed for audit but not for the current decision belongs in Advanced.
