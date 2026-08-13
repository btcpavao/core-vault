use crate::file_capabilities::FileCapabilityStore;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{collections::HashMap, sync::Mutex};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionSettings {
    pub host: String,
    pub port: u16,
    pub cookie_path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcTrace {
    pub method: String,
    pub wallet: Option<String>,
    pub arguments: Value,
    pub result: Value,
    pub explanation: String,
    pub duration_ms: u64,
    pub timestamp_ms: u64,
}

#[derive(Debug, Serialize)]
pub struct Operation<T: Serialize> {
    pub data: T,
    pub rpc: Vec<RpcTrace>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoreStatus {
    pub connected: bool,
    pub supported: bool,
    pub chain: Option<String>,
    pub version: Option<u64>,
    pub version_label: Option<String>,
    pub subversion: Option<String>,
    pub wallet_rpc_available: bool,
    pub cookie_path: Option<String>,
    pub blocks: u64,
    pub headers: u64,
    pub verification_progress: f64,
    pub initial_block_download: bool,
    pub pruned: bool,
    pub size_on_disk: u64,
    pub network_active: bool,
    pub connections: u64,
    pub mempool_size: u64,
    pub mempool_bytes: u64,
    pub mempool_total_fee_btc: f64,
    pub mempool_min_fee_btc_kvb: f64,
    pub last_block_time: Option<u64>,
    pub loaded_wallets: Vec<String>,
    pub message: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultListItem {
    pub wallet_name: String,
    pub display_name: String,
    pub role: String,
    pub vault_type: String,
    pub loaded: bool,
    pub descriptors: Option<bool>,
    pub private_keys_enabled: Option<bool>,
    pub locked: Option<bool>,
    pub balance_sats: Option<u64>,
    pub balance_btc: Option<f64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonalVault {
    pub wallet_name: String,
    pub display_name: String,
    pub network: String,
    pub descriptors: bool,
    pub private_keys_enabled: bool,
    pub encrypted: bool,
    pub locked: bool,
    pub balance_sats: u64,
    pub balance_btc: f64,
    pub public_fingerprint: String,
    pub backup_required: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupReceipt {
    pub wallet_name: String,
    pub path: String,
    pub created_at_unix: u64,
    pub size_bytes: u64,
    pub sha256: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreReceipt {
    pub original_wallet_name: String,
    pub restored_wallet_name: String,
    pub public_fingerprint: String,
    pub fingerprints_match: bool,
    pub warnings: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonalReceive {
    pub wallet_name: String,
    pub address: String,
    pub label: String,
    pub network: String,
    pub address_type: String,
    pub wallet_owned: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityItem {
    pub txid: String,
    pub category: String,
    pub amount_sats: i64,
    pub confirmations: i64,
    pub timestamp: Option<u64>,
    pub label: Option<String>,
    pub address: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonalVaultSnapshot {
    pub vault: PersonalVault,
    pub activity: Vec<ActivityItem>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpendOutputView {
    pub address: Option<String>,
    pub amount_sats: u64,
    pub is_change: bool,
}

#[derive(Clone, Debug)]
pub enum MempoolPreflight {
    NotRun,
    Accepted {
        transaction_identity: String,
    },
    Rejected {
        transaction_identity: String,
        reason: Option<String>,
    },
    Indeterminate {
        transaction_identity: String,
        reason: String,
    },
}

impl MempoolPreflight {
    pub fn is_accepted_for(&self, transaction_identity: &str) -> bool {
        matches!(
            self,
            Self::Accepted {
                transaction_identity: accepted_identity
            } if accepted_identity == transaction_identity
        )
    }

    pub fn view(&self) -> MempoolPreflightView {
        match self {
            Self::NotRun => MempoolPreflightView::NotRun,
            Self::Accepted { .. } => MempoolPreflightView::Accepted,
            Self::Rejected { reason, .. } => MempoolPreflightView::Rejected {
                reason: reason.clone(),
            },
            Self::Indeterminate { reason, .. } => MempoolPreflightView::Indeterminate {
                reason: reason.clone(),
            },
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "state", rename_all = "kebab-case")]
pub enum MempoolPreflightView {
    NotRun,
    Accepted,
    Rejected { reason: Option<String> },
    Indeterminate { reason: String },
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonalSpendView {
    pub draft_id: String,
    pub wallet_name: String,
    pub network: String,
    pub destination: String,
    pub amount_sats: u64,
    pub fee_sats: u64,
    pub fee_rate_sat_vb: f64,
    pub total_debit_sats: u64,
    pub outputs: Vec<SpendOutputView>,
    pub replaceable: bool,
    pub state: String,
    pub complete: bool,
    pub mempool_preflight: MempoolPreflightView,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonalBroadcast {
    pub txid: String,
    pub wallet_name: String,
    pub network: String,
    pub sent_sats: u64,
    pub fee_sats: u64,
}

#[derive(Clone, Debug)]
pub struct PersonalSpendState {
    pub wallet_name: String,
    pub network: String,
    pub destination: String,
    pub amount_sats: u64,
    pub fee_sats: u64,
    pub fee_rate_sat_vb: f64,
    pub outputs: Vec<SpendOutputView>,
    pub replaceable: bool,
    pub psbt: String,
    pub complete: bool,
    pub raw_hex: Option<String>,
    pub mempool_preflight: MempoolPreflight,
}

impl PersonalSpendState {
    pub fn view(&self, draft_id: String) -> PersonalSpendView {
        let accepted_for_current_transaction = self
            .raw_hex
            .as_deref()
            .map(finalized_transaction_identity)
            .map(|identity| self.mempool_preflight.is_accepted_for(&identity))
            .unwrap_or(false);
        PersonalSpendView {
            draft_id,
            wallet_name: self.wallet_name.clone(),
            network: self.network.clone(),
            destination: self.destination.clone(),
            amount_sats: self.amount_sats,
            fee_sats: self.fee_sats,
            fee_rate_sat_vb: self.fee_rate_sat_vb,
            total_debit_sats: self.amount_sats.saturating_add(self.fee_sats),
            outputs: self.outputs.clone(),
            replaceable: self.replaceable,
            state: if accepted_for_current_transaction {
                "ready-to-broadcast"
            } else if self.raw_hex.is_some() {
                "preflight-required"
            } else if self.complete {
                "threshold-reached"
            } else {
                "unsigned"
            }
            .into(),
            complete: self.complete,
            mempool_preflight: self.mempool_preflight.view(),
        }
    }
}

pub fn finalized_transaction_identity(raw_hex: &str) -> String {
    format!("{:x}", Sha256::digest(raw_hex.as_bytes()))
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SigningWallet {
    pub label: String,
    pub name: String,
    pub descriptors: bool,
    pub private_keys_enabled: bool,
    pub encrypted: bool,
    pub backup_path: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignerPublic {
    pub label: String,
    pub wallet_name: String,
    pub fingerprint: String,
    pub derivation_path: String,
    pub tpub: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicVaultBackup {
    pub schema_version: u32,
    pub exported_at_unix: u64,
    pub network: String,
    pub policy_type: String,
    pub threshold: u8,
    pub participants: u8,
    pub signers: Vec<SignerPublic>,
    pub receive_descriptor: String,
    pub change_descriptor: String,
    pub coordinator_name: String,
    pub coordinator_private_keys: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultSummary {
    pub policy: String,
    pub address_type: String,
    pub network: String,
    pub coordinator_name: String,
    pub coordinator_has_private_keys: bool,
    pub signers: Vec<SignerPublic>,
    pub receive_descriptor: String,
    pub change_descriptor: String,
    pub public_backup: PublicVaultBackup,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiveSnapshot {
    pub address: String,
    pub balance_btc: f64,
    pub balance_sats: u64,
    pub solvable: bool,
    pub watch_only: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpendDraftView {
    pub draft_id: String,
    pub destination: String,
    pub amount_sats: u64,
    pub fee_btc: f64,
    pub fee_sats: u64,
    pub signed_by: Vec<String>,
    pub complete: bool,
    pub relock_required: Option<SignerRelockRequired>,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SignerRelockRequired {
    pub wallet_name: String,
    pub signature_added: bool,
    pub signing_error: Option<String>,
    pub relock_error: String,
}

#[derive(Clone, Debug)]
pub struct SpendState {
    pub coordinator_name: String,
    pub destination: String,
    pub amount_sats: u64,
    pub starting_balance_sats: u64,
    pub fee_btc: f64,
    pub psbt: String,
    pub signed_by: Vec<String>,
    pub complete: bool,
    pub relock_required: Option<SignerRelockRequired>,
}

impl SpendState {
    pub fn view(&self, draft_id: String) -> SpendDraftView {
        SpendDraftView {
            draft_id,
            destination: self.destination.clone(),
            amount_sats: self.amount_sats,
            fee_btc: self.fee_btc,
            fee_sats: (self.fee_btc * 100_000_000.0).round() as u64,
            signed_by: self.signed_by.clone(),
            complete: self.complete,
            relock_required: self.relock_required.clone(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BroadcastResult {
    pub txid: String,
    pub starting_balance_sats: u64,
    pub sent_sats: u64,
    pub fee_sats: u64,
    pub remaining_sats: u64,
    pub balance_refreshed: bool,
}

#[derive(Default)]
pub struct AppState {
    pub connection: Mutex<Option<ConnectionSettings>>,
    pub drafts: Mutex<HashMap<String, SpendState>>,
    pub personal_drafts: Mutex<HashMap<String, PersonalSpendState>>,
    pub backed_up_wallets: Mutex<HashMap<String, BackupReceipt>>,
    pub file_capabilities: Mutex<FileCapabilityStore>,
}
