import { invoke } from "@tauri-apps/api/tauri";
import type {
  BroadcastResult,
  BackupReceipt,
  ConnectionSettings,
  CoreStatus,
  FileCapabilityGrant,
  Operation,
  PersonalBroadcast,
  PersonalReceive,
  PersonalSpendView,
  PersonalVault,
  PersonalVaultSnapshot,
  PublicVaultBackup,
  ReceiveSnapshot,
  RestoreReceipt,
  SigningWallet,
  SpendDraft,
  VaultListItem,
  VaultSummary,
} from "../types";

export const isTauriRuntime = () => typeof window.__TAURI_IPC__ !== "undefined";

export const coreApi = {
  discover: () => invoke<Operation<CoreStatus>>("discover_core"),
  connect: (settings: ConnectionSettings) =>
    invoke<Operation<CoreStatus>>("connect_core", { settings }),
  status: () => invoke<Operation<CoreStatus>>("get_core_status"),
  setNetworkActive: (active: boolean) =>
    invoke<Operation<CoreStatus>>("set_core_network_active", { active }),
  listVaults: () => invoke<Operation<VaultListItem[]>>("list_vaults"),
  createPersonalVault: (walletName: string, displayName: string, passphrase: string) =>
    invoke<Operation<PersonalVault>>("create_personal_vault", {
      walletName,
      displayName,
      passphrase,
    }),
  getPersonalVault: (walletName: string) =>
    invoke<Operation<PersonalVaultSnapshot>>("get_personal_vault", { walletName }),
  backupPersonalVault: (walletName: string, capabilityId: string) =>
    invoke<Operation<BackupReceipt>>("backup_personal_vault", { walletName, capabilityId }),
  restorePersonalVault: (
    originalWalletName: string,
    restoredWalletName: string,
    capabilityId: string,
  ) =>
    invoke<Operation<RestoreReceipt>>("restore_personal_vault", {
      originalWalletName,
      restoredWalletName,
      capabilityId,
    }),
  unloadWallet: (walletName: string) =>
    invoke<Operation<boolean>>("unload_wallet", { walletName }),
  createPersonalReceiveAddress: (walletName: string, label: string) =>
    invoke<Operation<PersonalReceive>>("create_personal_receive_address", {
      walletName,
      label,
    }),
  changePersonalPassphrase: (
    walletName: string,
    oldPassphrase: string,
    newPassphrase: string,
  ) =>
    invoke<Operation<boolean>>("change_personal_vault_passphrase", {
      walletName,
      oldPassphrase,
      newPassphrase,
    }),
  createPersonalSpend: (
    walletName: string,
    destination: string,
    amountSats: number,
    feeRateSatVb: number,
  ) =>
    invoke<Operation<PersonalSpendView>>("create_personal_spend_proposal", {
      walletName,
      destination,
      amountSats,
      feeRateSatVb,
    }),
  signPersonalSpend: (draftId: string, passphrase: string) =>
    invoke<Operation<PersonalSpendView>>("sign_personal_spend_proposal", {
      draftId,
      passphrase,
    }),
  finalizePersonalSpend: (draftId: string) =>
    invoke<Operation<PersonalSpendView>>("finalize_personal_spend_proposal", { draftId }),
  preflightPersonalSpend: (draftId: string) =>
    invoke<Operation<PersonalSpendView>>("preflight_personal_spend_proposal", { draftId }),
  broadcastPersonalSpend: (draftId: string) =>
    invoke<Operation<PersonalBroadcast>>("broadcast_personal_spend_proposal", { draftId }),
  createSigner: (label: string, walletName: string) =>
    invoke<Operation<SigningWallet>>("create_signing_wallet", { label, walletName }),
  encryptSigner: (label: string, walletName: string, passphrase: string) =>
    invoke<Operation<SigningWallet>>("encrypt_signing_wallet", {
      label,
      walletName,
      passphrase,
    }),
  backupSigner: (label: string, walletName: string, capabilityId: string) =>
    invoke<Operation<SigningWallet>>("backup_signing_wallet", {
      label,
      walletName,
      capabilityId,
    }),
  buildVault: (walletNames: string[], coordinatorName?: string) =>
    invoke<Operation<VaultSummary>>("build_multisig_vault", {
      walletNames,
      coordinatorName: coordinatorName ?? null,
    }),
  exportPublicBackup: (capabilityId: string, backup: PublicVaultBackup) =>
    invoke<string>("export_public_backup", { capabilityId, backup }),
  receive: (coordinatorName: string, existingAddress?: string) =>
    invoke<Operation<ReceiveSnapshot>>("get_receive_snapshot", {
      coordinatorName,
      existingAddress: existingAddress ?? null,
    }),
  createSpend: (
    coordinatorName: string,
    destination: string,
    amountSats: number,
    feeRateSatVb: number,
  ) =>
    invoke<Operation<SpendDraft>>("create_spend_draft", {
      coordinatorName,
      destination,
      amountSats,
      feeRateSatVb,
    }),
  signSpend: (draftId: string, walletName: string, passphrase: string) =>
    invoke<Operation<SpendDraft>>("sign_spend_draft", {
      draftId,
      walletName,
      passphrase,
    }),
  broadcast: (draftId: string) =>
    invoke<Operation<BroadcastResult>>("finalize_and_broadcast", { draftId }),
};

export function choosePersonalBackupDestination(
  walletName: string,
): Promise<FileCapabilityGrant | null> {
  return invoke<FileCapabilityGrant | null>("choose_personal_backup_destination", { walletName });
}

export function choosePersonalRestoreSource(): Promise<FileCapabilityGrant | null> {
  return invoke<FileCapabilityGrant | null>("choose_personal_restore_source");
}

export function chooseSignerBackupDestination(
  walletName: string,
): Promise<FileCapabilityGrant | null> {
  return invoke<FileCapabilityGrant | null>("choose_signer_backup_destination", { walletName });
}

export function choosePublicBackupExportDestination(): Promise<FileCapabilityGrant | null> {
  return invoke<FileCapabilityGrant | null>("choose_public_backup_export_destination");
}
