# Security threat model

## Protected assets

- Wallet encryption passphrases
- Bitcoin Core wallet files and backups
- Raw PSBT and finalized transaction hex before broadcast
- RPC cookie credentials
- Correct network, destination, amount, fee, change, and wallet identity

## Trust boundary

Core Vault trusts the local Bitcoin Core process reached through authenticated loopback RPC. It does not trust renderer persistence, remote RPC endpoints, arbitrary file paths, or human memory of network state.

## Controls

- RPC hosts are restricted to loopback and the HTTP client ignores proxy configuration.
- Runtime code contains no analytics, remote wallet service, or third-party price API.
- Wallet mutations are blocked on mainnet by the Rust boundary. Supported development targets are Signet, Testnet4, Testnet, and Regtest.
- Passphrases are held only long enough for a command, wrapped in zeroizing Rust memory where applicable, never logged, and redacted from RPC traces.
- The renderer never receives raw PSBT or final transaction hex. Drafts stay in in-memory Rust state.
- Signing unlocks a wallet for five seconds and always attempts `walletlock` afterward. Failure to confirm locking is a STOP condition.
- Backup and restore paths must be absolute. The restore test compares a stable hash of public descriptors.
- Broadcast is a separate command after finalization and `testmempoolaccept`.
- `setnetworkactive(false)` is described only as disabling Bitcoin Core P2P networking, not as an air gap.

## Residual risks

This is experimental software, not a hardened signing appliance. A compromised operating system, renderer, Bitcoin Core binary, or local user account can defeat these controls. Clipboard replacement, screen capture, memory inspection, malicious backup destinations, and supply-chain compromise remain relevant. Do not use real funds.
