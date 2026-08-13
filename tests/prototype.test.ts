import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  demoBroadcast,
  demoCoreStatus,
  demoPublicBackup,
  demoReceive,
  demoSpend,
  demoVault,
} from "../src/lib/demo";
import { phaseMeta } from "../src/components/ui";

const projectFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("safe, representative demo", () => {
  it("is strictly Signet and watch-only at the coordinator", () => {
    expect(demoCoreStatus.data.chain).toBe("signet");
    expect(demoVault.data.network).toBe("Signet");
    expect(demoVault.data.coordinatorHasPrivateKeys).toBe(false);
    expect(demoPublicBackup.coordinatorPrivateKeys).toBe(false);
  });

  it("models the requested native SegWit 2-of-3 policy", () => {
    expect(demoVault.data.policy).toBe("2-of-3");
    expect(demoVault.data.addressType).toBe("Native SegWit");
    expect(demoVault.data.receiveDescriptor).toMatch(/^wsh\(sortedmulti\(2,/);
    expect(demoVault.data.receiveDescriptor).toContain("/0/*");
    expect(demoVault.data.changeDescriptor).toContain("/1/*");
    expect(demoPublicBackup.signers).toHaveLength(3);
  });

  it("never places private material in the public export or RPC trace", () => {
    const serialized = JSON.stringify({
      backup: demoPublicBackup,
      vaultRpc: demoVault.rpc,
      receiveRpc: demoReceive.rpc,
      spendRpc: demoSpend(["CoreVault-K1"]).rpc,
    });
    expect(serialized).not.toMatch(/xprv|tprv|mnemonic|seed phrase/i);
    expect(serialized).toContain("[REDACTED]");
  });

  it("requires two distinct approvals before a draft is complete", () => {
    expect(demoSpend().data.complete).toBe(false);
    expect(demoSpend(["CoreVault-K1"]).data.complete).toBe(false);
    expect(demoSpend(["CoreVault-K1", "CoreVault-K2"]).data.complete).toBe(true);
    expect(demoSpend(["CoreVault-K1", "CoreVault-K3"]).data.complete).toBe(true);
    expect(demoSpend(["CoreVault-K2", "CoreVault-K3"]).data.complete).toBe(true);
  });

  it("labels the demo as disconnected from a real Bitcoin Core", () => {
    const app = projectFile("src/App.tsx");
    expect(app).toContain("DEMO MODE — NO REAL BITCOIN CORE");
    expect(demoCoreStatus.data.connected).toBe(false);
    expect(demoCoreStatus.data.supported).toBe(false);
    expect(demoCoreStatus.data.message).toMatch(/No Bitcoin Core connection/i);
  });

  it("keeps receive values internally consistent and watch-only", () => {
    expect(Math.round(demoReceive.data.balanceBtc * 100_000_000)).toBe(demoReceive.data.balanceSats);
    expect(demoReceive.data.address).toMatch(/^tb1/);
    expect(demoReceive.data.solvable).toBe(true);
    expect(demoReceive.data.watchOnly).toBe(true);
  });

  it("uses three unique signer identities", () => {
    const signers = demoPublicBackup.signers;
    expect(signers.map(({ label }) => label)).toEqual(["K1", "K2", "K3"]);
    expect(new Set(signers.map(({ fingerprint }) => fingerprint)).size).toBe(3);
    expect(new Set(signers.map(({ tpub }) => tpub)).size).toBe(3);
  });

  it("reports a valid txid and reconciled change after demo broadcast", () => {
    const result = demoBroadcast().data;
    expect(result.txid).toMatch(/^[0-9a-f]{64}$/);
    expect(result.remainingSats).toBe(result.startingBalanceSats - result.sentSats - result.feeSats);
    expect(result.balanceRefreshed).toBe(true);
  });
});

describe("prototype architecture invariants", () => {
  it("exposes the six requested linear phases", () => {
    expect(phaseMeta.map(({ id }) => id)).toEqual([
      "core",
      "signers",
      "vault",
      "backup",
      "receive",
      "spend",
    ]);
  });

  it("keeps session data out of browser persistence", () => {
    const frontend = projectFile("src/App.tsx") + projectFile("src/lib/tauri.ts");
    expect(frontend).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
  });

  it("keeps localhost and Signet enforcement in the Rust boundary", () => {
    const rpc = projectFile("src-tauri/src/rpc.rs");
    const security = projectFile("src-tauri/src/security.rs");
    expect(rpc).toMatch(/ensure_signet/);
    expect(rpc).toMatch(/no_proxy/);
    expect(security).toMatch(/validate_connection/);
    expect(security).toMatch(/contains_private_material/);
  });

  it("keeps PSBT drafts in Rust state instead of exposing raw payloads", () => {
    const types = projectFile("src-tauri/src/types.rs");
    const frontendTypes = projectFile("src/types.ts");
    expect(types).toMatch(/drafts: Mutex<HashMap<String, SpendState>>/);
    expect(frontendTypes).not.toMatch(/psbt\s*:/i);
  });

  it("registers every command needed by the six-phase flow", () => {
    const main = projectFile("src-tauri/src/main.rs");
    for (const command of [
      "connect_core",
      "create_signing_wallet",
      "encrypt_signing_wallet",
      "backup_signing_wallet",
      "build_multisig_vault",
      "export_public_backup",
      "get_receive_snapshot",
      "create_spend_draft",
      "sign_spend_draft",
      "finalize_and_broadcast",
    ]) {
      expect(main).toContain(command);
    }
  });

  it("binds sensitive file operations to native-dialog capabilities", () => {
    const main = projectFile("src-tauri/src/main.rs");
    const adapter = projectFile("src/lib/tauri.ts");

    expect(main).toMatch(
      /async fn backup_personal_vault\([\s\S]*?capability_id: String,[\s\S]*?Result<Operation<BackupReceipt>/,
    );
    expect(main).toMatch(
      /async fn restore_personal_vault\([\s\S]*?capability_id: String,[\s\S]*?Result<Operation<RestoreReceipt>/,
    );
    expect(main).toMatch(
      /fn export_public_backup\([\s\S]*?capability_id: String,[\s\S]*?Result<String, String>/,
    );
    expect(main).not.toMatch(
      /async fn backup_personal_vault\([\s\S]*?destination: String,[\s\S]*?Result<Operation<BackupReceipt>/,
    );
    expect(main).not.toMatch(
      /async fn restore_personal_vault\([\s\S]*?backup_file: String,[\s\S]*?Result<Operation<RestoreReceipt>/,
    );
    expect(adapter).not.toContain("@tauri-apps/api/dialog");
    expect(adapter).toContain("choose_personal_backup_destination");
    expect(adapter).toContain("choose_personal_restore_source");
    expect(adapter).toContain("choose_public_backup_export_destination");
  });

  it("requires an explicit typed mempool acceptance at the Rust broadcast boundary", () => {
    const personal = projectFile("src-tauri/src/personal.rs");
    const main = projectFile("src-tauri/src/main.rs");
    const frontendTypes = projectFile("src/types.ts");

    expect(main).toContain("preflight_personal_spend_proposal");
    expect(personal).toContain("ensure_broadcast_preflight(&snapshot.mempool_preflight, &raw_hex)");
    expect(personal).toMatch(/Some\(true\)[\s\S]*?MempoolPreflight::Accepted/);
    expect(frontendTypes).toContain('{ state: "accepted" }');
    expect(frontendTypes).toContain('{ state: "indeterminate"; reason: string }');
    expect(frontendTypes).not.toMatch(/mempoolAllowed|mempoolRejectReason/);
  });

  it("delegates descriptor construction and checksum validation to explicit Core calls", () => {
    const vault = projectFile("src-tauri/src/vault.rs");
    expect(vault).toContain('"listdescriptors"');
    expect(vault).toContain("wsh(sortedmulti(2,");
    expect(vault).toContain('"getdescriptorinfo"');
    expect(vault).toContain('"importdescriptors"');
    expect(vault).toContain('"private": false');
  });

  it("contains the complete funded-PSBT, signing, finalization and broadcast sequence", () => {
    const vault = projectFile("src-tauri/src/vault.rs");
    for (const method of [
      "walletcreatefundedpsbt",
      "walletprocesspsbt",
      "walletlock",
      "finalizepsbt",
      "sendrawtransaction",
      "getbalances",
    ]) {
      expect(vault).toContain(`\"${method}\"`);
    }
    expect(vault).toMatch(/signed_by\.len\(\) < 2 \|\| !snapshot\.complete/);
  });

  it("does not add an external runtime network destination", () => {
    const runtime = ["src-tauri/src/main.rs", "src-tauri/src/rpc.rs", "src-tauri/src/security.rs", "src-tauri/src/vault.rs"]
      .map(projectFile)
      .join("\n");
    expect(runtime).not.toMatch(/https:\/\//);
    expect(runtime).not.toMatch(/http:\/\/(?!\{host\})/);
    expect(runtime).toContain(".no_proxy()");
  });
});
