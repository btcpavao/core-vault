# Testing

## Automated

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run test:rust
npm run verify
```

Rust RPC tests bind a temporary loopback port. A restrictive sandbox may require permission for local networking.

## Desktop smoke test

1. Start Bitcoin Core 31.1 with `-server=1` on Signet, Testnet4, or Regtest.
2. Run `npm run tauri dev`.
3. Confirm the status rail shows the exact chain and Core version.
4. Create a Personal Vault with a test-only passphrase.
5. Create a backup, restore it under a temporary name, and require a matching public fingerprint.
6. Generate a fresh receive address and scan its QR code with an independent test-network wallet.
7. Fund the wallet with test coins.
8. Create a send proposal; verify destination, amount, fee, change, RBF, and network.
9. Sign, finalize, confirm mempool acceptance, and separately broadcast.
10. Disable and re-enable P2P networking in the Engine Room; verify the UI never calls this an air gap.
11. Open the preserved 2-of-3 workshop and repeat its existing Signet flow.

## Browser-only visual test

Run `npm run dev` and open `http://localhost:1420`. The permanent demonstration ribbon must remain visible. No real RPC or wallet mutation is possible in this mode.

Test at 1024×700 and 1280×800, with keyboard-only navigation, Croatian copy, muted audio, reduced motion, and a screen-reader navigation pass.
