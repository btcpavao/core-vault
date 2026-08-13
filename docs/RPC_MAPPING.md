# Bitcoin Core RPC mapping

Primary reference: [Bitcoin Core 31 RPC documentation](https://bitcoincore.org/en/doc/31.0.0/).

| User action | RPC sequence | Security boundary |
|---|---|---|
| Discover Core | `getblockchaininfo`, `getnetworkinfo`, `getmempoolinfo`, `listwallets` | Loopback-only cookie authentication |
| Create Personal Vault | `getblockchaininfo`, `createwallet`, `getwalletinfo`, `getbalances`, `listdescriptors` | Test chains only; passphrase is redacted from traces |
| View vault | `getblockchaininfo`, `getwalletinfo`, `getbalances`, `listdescriptors`, `listtransactions` | Local wallet endpoint |
| Backup | `backupwallet` | Absolute destination; file existence, size, and SHA-256 checked locally |
| Restore test | `listdescriptors`, `restorewallet`, `listdescriptors` | Public descriptor fingerprints compared; secrets never enter renderer |
| Receive | `getnewaddress` with `bech32m`, then `getaddressinfo` | Address must be wallet-owned |
| Create send proposal | `getblockchaininfo`, `validateaddress`, `walletcreatefundedpsbt`, `decodepsbt` | Test chains only; raw PSBT remains in Rust memory |
| Sign | `walletpassphrase`, `walletprocesspsbt`, `walletlock` | Five-second unlock; lock attempted on success and error |
| Finalize | `finalizepsbt`, `testmempoolaccept` | No broadcast in this command |
| Broadcast | `getnetworkinfo`, `sendrawtransaction` | Separate confirmation; P2P networking must be active |
| Network control | `setnetworkactive` | P2P control only; never described as an air gap |

Bitcoin Core 31.1 is the target reference release. The implementation accepts Core 26 or newer for the preserved legacy prototype, but new flows must be tested against current Core before any release claim.
