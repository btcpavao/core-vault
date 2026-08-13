# Network support

| Chain reported by Core | Read status | New wallet mutation | Default development use |
|---|---:|---:|---:|
| `main` | Yes | No — STOP | Never |
| `signet` | Yes | Yes | Recommended shared test environment |
| `testnet4` | Yes | Yes | Supported |
| `test` | Yes | Yes | Compatibility support |
| `regtest` | Yes | Yes | Recommended automated/local integration |

Autodiscovery checks standard cookie locations and ports: mainnet `8332`, Signet `38332`, Testnet4 `48332`, and Regtest `18443`.

The interface displays the Core-reported chain continuously. It does not infer network from an address alone. The current prototype intentionally blocks wallet creation and spend mutations on mainnet.

`setnetworkactive` toggles Bitcoin Core peer-to-peer activity. When disabled, local RPC and wallet operations may still work. The computer is not thereby air-gapped.
