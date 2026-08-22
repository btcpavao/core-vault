# Core Vault UI design audit

## Spatial review, August 13, 2026

The current shell was reviewed again in a real browser render. It remains experimental software, not a Mainnet product.

| Check | Result |
| --- | --- |
| Desktop 1024 × 700 | all eight scenes avoid horizontal overflow; vertical content remains readable and scrollable |
| Desktop 1280 × 800 | all eight scenes avoid horizontal overflow; right-workbench min-content clipping is fixed |
| Full spatial demo | onboarding, vault, backup, restore fingerprint, receive QR, PSBT, sign, finalize, broadcast |
| Engine Room | P2P off and on work; text distinguishes a disabled network from an air gap |
| Legacy 2-of-3 | entry and return work; the original flow remains separate |
| Reduced motion and audio | reduced motion confirmed on `html[data-motion=reduced]`; sound remains opt-in and mute persists |
| Browser console | 0 warnings or errors |
| Automated suite | 25 frontend and architecture tests plus 22 Rust and RPC tests, 47 total |
| Build and dependencies | Vite and Tauri release builds pass; `npm audit` reports 0 vulnerabilities |

The rest of this document preserves the audit of the original linear 2-of-3 prototype, which remains available as Workshop.

Original audit date: August 12, 2026
Status: **passes as an Experimental Signet Prototype; does not pass as a Mainnet product**.

The audit compares the rendered React UI with `DESIGN_RESEARCH.md`, `DESIGN_SYSTEM.md`, Bitcoin Design Guide patterns, and the project security charter. It reviewed the real Vite render, not source alone.

## QA evidence

| Check | Result |
| --- | --- |
| Desktop 1280 × 720 | Welcome, Core, backup, review, signing, and success screens do not overlap |
| Narrow 700 × 900 layout | no horizontal overflow; sidebar becomes a progress strip; CTAs remain 48 px high |
| Full safe-demo flow | Core, K1/K2/K3, vault, four backups, receive, review, K1+K2, broadcast |
| Signer combinations | K1+K2, K1+K3, and K2+K3 covered by frontend tests |
| Browser console | 0 warnings or errors through the complete demo |
| Keyboard and semantics | native buttons, inputs, and details; skip link; focus moves to the new step |
| Reduced motion | CSS media query removes animations and transitions |
| Production build | Vite and optimized Tauri release binary built successfully |
| Automated suite | 16 frontend, demo, and architecture tests plus 17 Rust and RPC tests, 33 total at the time |

The review found and fixed three defects. A new long step inherited the old scroll position, programmatic focus drew a ring around the whole `main` region, and the demo model set `connected=true` despite being presented as simulated. New steps now start at the top, visual focus remains on real controls, and demo data is separated from a real Core connection in both presentation and state.

A local Rust integration fixture also starts an ephemeral `127.0.0.1` JSON-RPC server, checks cookie Basic authentication, completes a Signet handshake, and repeats the Mainnet hard stop immediately before wallet work. This tests the actual HTTP and RPC boundary but does not replace live Signet E2E testing.

## Required technical-check coverage

| # | Requirement | Automated evidence |
| ---: | --- | --- |
| 1 | Core connection | local mock-RPC handshake with cookie authentication |
| 2 | Signet detection | RPC fixture and pure chain test |
| 3 | Mainnet rejection | RPC fixture confirms `STOP` before wallet work |
| 4 | K1 wallet creation | command-registry test and full browser demo |
| 5 | descriptor wallet validation | Rust `verify_signing_wallet` path and source invariant |
| 6 | `private_keys_enabled` validation | signing and coordinator guards |
| 7 | `listdescriptors` parsing | public `wpkh` parser test |
| 8 | receive descriptor selection | `/0/*`, `internal=false` parser rule |
| 9 | change descriptor selection | `/1/*`, `internal=true` parser rule |
| 10 | duplicate fingerprint rejection | Rust key-set test |
| 11 | duplicate tpub rejection | Rust key-set test |
| 12 | private extended-key rejection | tprv, xprv, and private-descriptor tests |
| 13 | receive multisig construction | `wsh(sortedmulti(2,.../0/*))` unit test |
| 14 | change multisig construction | branch builder and demo descriptor model |
| 15 | `getdescriptorinfo` validation | solvable and no-private invariants |
| 16 | coordinator creation | command and RPC sequence invariant plus browser demo |
| 17 | private keys in coordinator | `verify_coordinator` hard stop |
| 18 | descriptor import | Rust test requires two successful results |
| 19 | receive-address generation | demo model requires `tb1`, solvable, and watch-only |
| 20 | sats and BTC conversion | Rust rounding and frontend consistency tests |
| 21 | funded PSBT creation | RPC sequence invariant and full browser demo |
| 22 | first signer `complete=false` | demo state test |
| 23 | updated PSBT propagation | PSBT remains in Rust draft state |
| 24 | second signer `complete=true` | demo state test |
| 25 | all signer pairs | K1+K2, K1+K3, and K2+K3 frontend test |
| 26 | final hex extraction | finalize and broadcast sequence invariant |
| 27 | broadcast | demo operation and full browser demo |
| 28 | txid parsing | 64-character lowercase hex test |
| 29 | change balance | starting minus sent minus fee equals remaining |
| 30 | no secret leakage | public-backup and RPC redaction plus no-persistence test |

Checks that depend on real Bitcoin Core responses still need live E2E coverage. The mock fixture is not presented as a substitute for a funded Signet test.

## Design results

| Earlier risk | Implemented answer |
| --- | --- |
| Multisig begins with M-of-N, descriptors, and PSBTs | Welcome begins with the `Personal Vault` story, three signing wallets, and the "any 2" rule |
| Wallet, key, vault, and coordinator blur together | signers are key cards, policy is a `2 of 3` node, vault is protected funds, coordinator says `Private keys: none` |
| Minimalism hides loss consequences | review states that one lost key is tolerable and two can lock the funds |
| Debug Console requires commands and copied state | each screen has one dominant CTA across six major wizard phases |
| RPC details overwhelm a newcomer | closed native `details` shows sanitized method, time, arguments, result, and explanation on request |
| PSBT and raw hex leak to clipboard or logs | payload remains in Rust memory and Advanced displays `[REDACTED]` |
| Backup looks like a later Settings task | K1, K2, K3, and public configuration form a blocking checkpoint before receive |
| Public descriptors look harmless to share | UI labels them sensitive metadata that cannot spend but can track history |
| Demo looks like a real connection | persistent `DEMO MODE, NO REAL BITCOIN CORE`, `Simulated Signet`, and `Not connected · demo data` facts |
| Broadcast success hides change | success shows starting amount, sent amount, fee, remaining amount, and `/1/*` change protection |
| Generic crypto styling weakens trust | warm neutral canvas, near-black sidebar, orange only for the primary action, no gradients, glow, or market widgets |

## Screen audit

| Screen | Main action and security result | Remaining limit |
| --- | --- | --- |
| Welcome | explains 2-of-3; states local, no cloud, no telemetry | one local-machine template, no hardware key |
| Core connection | confirms local Core and network; Mainnet hard stop and loopback-only | manual cookie path in Advanced |
| K1/K2/K3 | create, encrypt, ready; uncontrolled passphrase clears immediately | existing-wallet import is not in V1 |
| Vault review | final policy and loss consequences; watch-only coordinator | all signers are on one device |
| Backup | distinguishes signing capability from public configuration; four required results | application does not prescribe physical storage |
| Receive | new contextual address and hidden balance | V1 combines pending and confirmed amounts |
| Send and review | destination, amount, fee, remainder, approvals; edit before signing | no coin control or address book |
| Add signature | three signer states, distinct signer required, five-second Core unlock | local Core method only |
| Success | txid and change calculation, no explorer, local balance refresh | refresh is best effort with an estimate fallback |

## Accessibility

- The active step has one `h1` and uses semantic `main`, `aside`, `header`, `footer`, `ol`, `dl`, `details`, and wrapping labels.
- Interactive targets are at least 44 by 44 px; primary buttons are 48 px high.
- Status uses an icon, word, and color. Controls retain a 3 px focus ring.
- The vault diagram has a text `role=img` description and real signer and status text.
- A 700 px viewport serves as a proxy for 200% desktop zoom.
- A user test still needs to confirm full-address and RPC JSON readability with a real screen reader, not only DOM snapshots.

## Known open items

1. This pass did not run live Signet E2E. The local Bitcoin-Qt instance used `-signet` without `-server` or an RPC cookie. The application correctly showed offline state, and the review did not restart Core.
2. There is no independent security audit, moderated user session, or Mainnet support.
3. Recovery and import, existing wallets, hardware signers, and PSBT file or QR methods are absent.
4. V1 combines confirmed and unconfirmed receive balances. Separate states follow user testing and a live integration fixture.
5. A general vault dashboard and transaction history are deliberately deferred. The prototype proves the linear acceptance flow.
6. Creation and encryption are separate Signet steps. An interruption may leave a test signer unencrypted. Atomic creation must precede any Mainnet work.

## Conclusion

The UI meets the prototype goal of being easy to use correctly. A newcomer need not see RPC, descriptors, or PSBTs, while an advanced user can inspect a sanitized Core flow. The release remains labeled as a Signet experiment until it passes live E2E, moderated user testing, and an independent security review.
