# Contributing to Core Vault UI

Core Vault is an experimental Signet project with a deliberately small security surface. A change that expands network support, policies, or access to private keys is not a routine feature PR.

## Before making changes

1. Read `SECURITY.md`, `ARCHITECTURE.md`, and the relevant section of `DESIGN_RESEARCH.md`.
2. Confirm that Bitcoin Core cannot perform the operation more safely on its own.
3. Document any new security invariant, RPC exposure, and failure state.
4. Use synthetic Signet data only in issues and tests.

## Code rules

- React does not construct descriptors or RPC requests.
- Rust revalidates every security-sensitive frontend argument.
- RPC remains loopback-only, without redirects or proxies.
- Private keys, seeds, cookies, passphrases, PSBTs, and raw transaction hex must not appear in logs or test fixtures.
- Each new policy gets a small, separate builder and its own tests. Do not generalize V1 conditions in advance.
- Add dependencies only when their need is documented and they have been audited.

## Required checks

```sh
npm run verify
npm audit
npm run tauri build
```

For UX changes, run the safe demo using only the keyboard, check the 700 px-wide layout and reduced-motion mode, and update `DESIGN_AUDIT.md` if the primary flow changes.

## Security reports

Do not open a public issue containing a real wallet, backup, seed, key, cookie, passphrase, PSBT, or transaction hex. Describe the problem with a synthetic Signet example and the minimum steps needed to reproduce it.
