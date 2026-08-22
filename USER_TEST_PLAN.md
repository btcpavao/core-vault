# Core Vault UI V1 user test plan

## Research question

Can someone who knows how to use a standard Bitcoin Core wallet safely complete the 2-of-3 Signet flow without Debug Console, then explain the roles of the three signers, the vault, the coordinator, the backups, and the two signatures in their own words?

Speed is not the primary measure. Safe completion, understanding, and recognition of irreversible decisions matter most.

## Participant profile and sample

Target participant:

> Someone who can install Bitcoin Core, create a standard wallet, and receive and send bitcoin, but has never used multisig, descriptors, RPC, or PSBTs.

The first round uses five moderated participants. If possible, include at least one person who uses keyboard navigation or display magnification, and cover different experience levels within the target profile.

## Safe test environment

- separate Bitcoin Core 26+ profile using Signet only, with `server=1`
- fully synchronized node and a small amount of Signet coins
- unique wallet names for each session and an empty test-backup directory
- screen recording only with consent, with password inputs and file dialogs excluded
- no request from the moderator for a real seed, key, wallet backup, or Mainnet address
- a statement before the session that the product, not the participant, is being tested and that test coins have no market value

## Participant task

> Create a 2-of-3 vault on Signet, receive test funds, and send part of them using two signatures. Assume you want to be able to reconstruct this setup without the application.

Do not explain descriptors, RPC, or PSBTs before the task. Help only if the participant is completely stuck or is about to act outside Signet.

## Scenario

1. **Orientation.** From the welcome screen, explain what you think the application will do.
2. **Connection.** Connect the local Core instance and find Advanced settings if needed.
3. **K1/K2/K3.** Create and encrypt each signing wallet.
4. **Vault review.** Before using the CTA, explain what losing one key or two keys would mean.
5. **Backup.** Create three Core backups and the public configuration, then explain the difference.
6. **Receive.** Generate and copy an address, and recognize that the balance is hidden.
7. **Fund.** The moderator or faucet sends the agreed Signet funds, then the participant refreshes.
8. **Send and review.** Enter the recipient, 5,000 sats, and fee, then check every review item.
9. **Sign.** Choose any two different signers and explain why the coordinator alone is insufficient.
10. **Broadcast and change.** Confirm the final action, copy the txid, and explain the remaining balance and change.

Rotate signer pairs between sessions: K1+K2, K1+K3, and K2+K3.

## Failure-state tasks

Show no more than two scenarios per participant after the happy path so the session does not turn into an exam:

- Core is stopped or lacks `server=1`
- remote RPC host
- Mainnet chain hard stop
- wrong wallet passphrase or locked signer
- cancelled file dialog
- missing public backup
- invalid destination or insufficient funds
- second signature attempted with the same signer

Observe whether the participant can tell what happened, whether the funds and transaction are safe, and what to do next.

## Moderator protocol

- Use neutral prompts such as, "What do you expect to happen?"
- If the participant is silent, remind them to think aloud without naming a control.
- At an impasse, first record expectations and attempts. Help only after 60 to 90 seconds or an explicit request.
- Stop the test if Mainnet, real private data, or an ambiguous broadcast state appears.
- After helping, mark the rest of the task as assisted, not failed.

## What to record

| Signal | Example note |
| --- | --- |
| Impasse | time, screen, last action, where the participant is looking |
| Mental model | how the participant describes the signer, vault, and coordinator |
| Expectation | what the participant thinks a CTA will do and whether it can be undone |
| Uncertainty | passphrase, backup location, public configuration, broadcast |
| Misclick | control that appears interactive or CTA that is not noticed |
| Progressive disclosure | when and why the participant opens the RPC panel |
| Recovery | whether the participant can identify the next step from the error message |
| Accessibility | tab order, focus, status reading, zoom |

## Final comprehension questions

1. How many keys exist, and how many are needed to spend?
2. What happens if you lose K2? What if you lose K2 and K3?
3. Can the coordinator spend funds by itself? Why?
4. What is the difference between a `K1 backup` and the `public vault configuration`?
5. Where were the private keys, and what performed the signing?
6. What changed after the first signature?
7. Where did the remainder go after payment?
8. What should you preserve if you delete Core Vault UI?

## First-round success criteria

- 4 of 5 participants finish without critical moderator intervention.
- 5 of 5 never attempt to use Mainnet after the warning.
- 4 of 5 correctly explain "2 of 3," the keyless coordinator, and the updated transaction after the first signature.
- 4 of 5 distinguish a signing-wallet backup from the public configuration.
- 5 of 5 identify the destination, amount, and fee before broadcast.
- No participant believes the demo represents a real Core connection.
- A keyboard user can complete every step and always knows where focus is.

One critical error, such as believing the public configuration is enough to sign or that Mainnet is allowed, blocks progression to the next phase regardless of the average result.

## Analysis and prioritization

- **P0 security.** Could cause use of the wrong network, loss of access, secret leakage, or an ambiguous broadcast. Stops the release immediately.
- **P1 completion.** The participant cannot finish the acceptance flow without help.
- **P2 understanding.** The participant finishes but holds an incorrect key mental model.
- **P3 polish.** Readability, pacing, wording, or visual affordance without a security consequence.

For each finding, record the screen, observation, a short verbatim participant statement, expectation, consequence, severity, and smallest proposed change. After making a change, retest the same task with new participants. The author's judgment does not count as user-test evidence.
