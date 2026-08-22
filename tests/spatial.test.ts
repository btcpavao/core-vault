import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { t } from "../src/i18n";
import { demoSpatialCore, demoVaultItem } from "../src/lib/spatialDemo";
import { canTransitionPsbt, deriveCoreState } from "../src/state/machines";

const projectFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("spatial product contract", () => {
  it("exposes all eight rooms as semantic scene ids", () => {
    const app = projectFile("src/SpatialApp.tsx");
    for (const scene of ["hall", "workshop", "vault", "archive", "communications", "engine", "observatory", "library"]) {
      expect(app).toContain(`id: "${scene}"`);
    }
    expect(app).toContain("accessible-nav");
  });

  it("keeps the required independent-project and experimental warnings visible", () => {
    const english = projectFile("src/i18n.ts");
    expect(english).toContain("Core Vault is an independent interface powered by Bitcoin Core. It is not developed or endorsed by the Bitcoin Core project.");
    expect(english).toContain("Experimental software. Use only with test funds on Signet, Testnet4, or Regtest.");
  });

  it("stores only allowlisted non-sensitive interface preferences", () => {
    const preferences = projectFile("src/lib/preferences.ts");
    expect(preferences).toContain("core-vault:preferences:v1");
    expect(preferences).not.toMatch(/passphrase|privateKey|seed|psbt|destination|address|txid/i);
  });

  it("keeps the browser preview explicitly disconnected", () => {
    expect(demoSpatialCore.connected).toBe(false);
    expect(demoSpatialCore.supported).toBe(false);
    expect(demoSpatialCore.message).toMatch(/Demonstration data only/i);
    expect(demoVaultItem.vaultType).toContain("Backup required");
  });

  it("ships English core navigation copy", () => {
    expect(t("en", "mainHall")).toBe("Main Hall");
  });
});

describe("explicit state-machine guards", () => {
  it("derives network-disabled independently from synchronization", () => {
    expect(deriveCoreState({ connected: true, networkActive: false, initialBlockDownload: false, verificationProgress: 1 })).toBe("connected-network-disabled");
    expect(deriveCoreState({ connected: true, networkActive: true, initialBlockDownload: true, verificationProgress: 0.8 })).toBe("syncing");
    expect(deriveCoreState({ connected: true, networkActive: true, initialBlockDownload: false, verificationProgress: 1 })).toBe("synced");
  });

  it("does not allow PSBT review to skip directly to broadcast", () => {
    expect(canTransitionPsbt("awaiting-review", "broadcast")).toBe(false);
    expect(canTransitionPsbt("threshold-reached", "finalized")).toBe(true);
    expect(canTransitionPsbt("ready-to-broadcast", "broadcast")).toBe(true);
  });
});

describe("personal wallet Rust boundary", () => {
  it("contains the encrypted descriptor wallet and backup/restore calls", () => {
    const personal = projectFile("src-tauri/src/personal.rs");
    for (const method of ["createwallet", "backupwallet", "restorewallet", "unloadwallet", "getnewaddress", "walletpassphrasechange", "walletcreatefundedpsbt", "walletprocesspsbt", "walletlock", "finalizepsbt", "testmempoolaccept", "sendrawtransaction"]) {
      expect(personal).toContain(`"${method}"`);
    }
    expect(personal).toContain('"passphrase": "[REDACTED]"');
  });

  it("rejects mutations on mainnet at the Rust RPC boundary", () => {
    const rpc = projectFile("src-tauri/src/rpc.rs");
    expect(rpc).toContain("ensure_test_chain");
    expect(rpc).toMatch(/main.*STOP|STOP.*main/is);
  });
});
