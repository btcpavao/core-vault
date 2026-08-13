#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod file_capabilities;
mod personal;
#[cfg(test)]
mod regtest;
mod rpc;
mod security;
mod types;
mod vault;

use file_capabilities::FileCapabilityGrant;
use rpc::{autodetect_settings, inspect_core, offline_status, set_network_active, RpcClient};
use tauri::State;
use types::{
    AppState, BackupReceipt, BroadcastResult, ConnectionSettings, CoreStatus, Operation,
    PersonalBroadcast, PersonalReceive, PersonalSpendView, PersonalVault, PersonalVaultSnapshot,
    PublicVaultBackup, ReceiveSnapshot, RestoreReceipt, SigningWallet, SpendDraftView,
    VaultListItem, VaultSummary,
};

fn settings_from_state(state: &State<'_, AppState>) -> Result<ConnectionSettings, String> {
    state
        .connection
        .lock()
        .map_err(|_| "Interni connection state nije dostupan.".to_string())?
        .clone()
        .ok_or_else(|| "Najprije povežite lokalni Bitcoin Core.".to_string())
}

fn client_from_state(state: &State<'_, AppState>) -> Result<RpcClient, String> {
    RpcClient::new(settings_from_state(state)?)
}

#[tauri::command]
async fn discover_core(state: State<'_, AppState>) -> Result<Operation<CoreStatus>, String> {
    let candidates = autodetect_settings();
    if candidates.is_empty() {
        return Ok(Operation {
            data: offline_status(
                "Signet cookie nije automatski pronađen. Otvorite Advanced connection settings.",
            ),
            rpc: Vec::new(),
        });
    }

    let mut last_error = "Lokalni Bitcoin Core nije dostupan.".to_string();
    for settings in candidates {
        let mut traces = Vec::new();
        match inspect_core(settings.clone(), &mut traces).await {
            Ok(status) => {
                if status.supported {
                    *state
                        .connection
                        .lock()
                        .map_err(|_| "Interni connection state nije dostupan.".to_string())? =
                        Some(settings);
                }
                return Ok(Operation {
                    data: status,
                    rpc: traces,
                });
            }
            Err(error) => last_error = error,
        }
    }
    Ok(Operation {
        data: offline_status(last_error),
        rpc: Vec::new(),
    })
}

#[tauri::command]
async fn connect_core(
    state: State<'_, AppState>,
    settings: ConnectionSettings,
) -> Result<Operation<CoreStatus>, String> {
    let mut traces = Vec::new();
    let status = inspect_core(settings.clone(), &mut traces).await?;
    let mut stored = state
        .connection
        .lock()
        .map_err(|_| "Interni connection state nije dostupan.".to_string())?;
    *stored = status.supported.then_some(settings);
    Ok(Operation {
        data: status,
        rpc: traces,
    })
}

#[tauri::command]
async fn get_core_status(state: State<'_, AppState>) -> Result<Operation<CoreStatus>, String> {
    let mut traces = Vec::new();
    let status = inspect_core(settings_from_state(&state)?, &mut traces).await?;
    Ok(Operation {
        data: status,
        rpc: traces,
    })
}

#[tauri::command]
async fn set_core_network_active(
    state: State<'_, AppState>,
    active: bool,
) -> Result<Operation<CoreStatus>, String> {
    let mut traces = Vec::new();
    let status = set_network_active(&client_from_state(&state)?, active, &mut traces).await?;
    Ok(Operation {
        data: status,
        rpc: traces,
    })
}

#[tauri::command]
async fn list_vaults(state: State<'_, AppState>) -> Result<Operation<Vec<VaultListItem>>, String> {
    personal::list_vaults(client_from_state(&state)?, &state).await
}

#[tauri::command]
async fn create_personal_vault(
    state: State<'_, AppState>,
    wallet_name: String,
    display_name: String,
    passphrase: String,
) -> Result<Operation<PersonalVault>, String> {
    personal::create_personal_vault(
        client_from_state(&state)?,
        &state,
        wallet_name,
        display_name,
        passphrase,
    )
    .await
}

#[tauri::command]
async fn get_personal_vault(
    state: State<'_, AppState>,
    wallet_name: String,
) -> Result<Operation<PersonalVaultSnapshot>, String> {
    personal::get_personal_vault(client_from_state(&state)?, &state, wallet_name).await
}

#[tauri::command]
async fn backup_personal_vault(
    state: State<'_, AppState>,
    wallet_name: String,
    capability_id: String,
) -> Result<Operation<BackupReceipt>, String> {
    personal::backup_personal_vault(
        client_from_state(&state)?,
        &state,
        wallet_name,
        capability_id,
    )
    .await
}

#[tauri::command]
async fn restore_personal_vault(
    state: State<'_, AppState>,
    original_wallet_name: String,
    restored_wallet_name: String,
    capability_id: String,
) -> Result<Operation<RestoreReceipt>, String> {
    personal::restore_personal_vault(
        client_from_state(&state)?,
        &state,
        original_wallet_name,
        restored_wallet_name,
        capability_id,
    )
    .await
}

#[tauri::command]
async fn choose_personal_backup_destination(
    state: State<'_, AppState>,
    wallet_name: String,
) -> Result<Option<FileCapabilityGrant>, String> {
    file_capabilities::choose_personal_backup_destination(&state, &wallet_name)
}

#[tauri::command]
async fn choose_personal_restore_source(
    state: State<'_, AppState>,
) -> Result<Option<FileCapabilityGrant>, String> {
    file_capabilities::choose_personal_restore_source(&state)
}

#[tauri::command]
async fn unload_wallet(
    state: State<'_, AppState>,
    wallet_name: String,
) -> Result<Operation<bool>, String> {
    personal::unload_wallet(client_from_state(&state)?, wallet_name).await
}

#[tauri::command]
async fn create_personal_receive_address(
    state: State<'_, AppState>,
    wallet_name: String,
    label: String,
) -> Result<Operation<PersonalReceive>, String> {
    personal::create_receive_address(client_from_state(&state)?, wallet_name, label).await
}

#[tauri::command]
async fn change_personal_vault_passphrase(
    state: State<'_, AppState>,
    wallet_name: String,
    old_passphrase: String,
    new_passphrase: String,
) -> Result<Operation<bool>, String> {
    personal::change_passphrase(
        client_from_state(&state)?,
        wallet_name,
        old_passphrase,
        new_passphrase,
    )
    .await
}

#[tauri::command]
async fn create_personal_spend_proposal(
    state: State<'_, AppState>,
    wallet_name: String,
    destination: String,
    amount_sats: u64,
    fee_rate_sat_vb: f64,
) -> Result<Operation<PersonalSpendView>, String> {
    personal::create_spend_proposal(
        client_from_state(&state)?,
        &state,
        wallet_name,
        destination,
        amount_sats,
        fee_rate_sat_vb,
    )
    .await
}

#[tauri::command]
async fn sign_personal_spend_proposal(
    state: State<'_, AppState>,
    draft_id: String,
    passphrase: String,
) -> Result<Operation<PersonalSpendView>, String> {
    personal::sign_spend_proposal(client_from_state(&state)?, &state, draft_id, passphrase).await
}

#[tauri::command]
async fn finalize_personal_spend_proposal(
    state: State<'_, AppState>,
    draft_id: String,
) -> Result<Operation<PersonalSpendView>, String> {
    personal::finalize_spend_proposal(client_from_state(&state)?, &state, draft_id).await
}

#[tauri::command]
async fn preflight_personal_spend_proposal(
    state: State<'_, AppState>,
    draft_id: String,
) -> Result<Operation<PersonalSpendView>, String> {
    personal::preflight_spend_proposal(client_from_state(&state)?, &state, draft_id).await
}

#[tauri::command]
async fn broadcast_personal_spend_proposal(
    state: State<'_, AppState>,
    draft_id: String,
) -> Result<Operation<PersonalBroadcast>, String> {
    personal::broadcast_spend_proposal(client_from_state(&state)?, &state, draft_id).await
}

#[tauri::command]
async fn create_signing_wallet(
    state: State<'_, AppState>,
    label: String,
    wallet_name: String,
    passphrase: String,
) -> Result<Operation<SigningWallet>, String> {
    vault::create_signing_wallet(client_from_state(&state)?, label, wallet_name, passphrase).await
}

#[tauri::command]
async fn backup_signing_wallet(
    state: State<'_, AppState>,
    label: String,
    wallet_name: String,
    capability_id: String,
) -> Result<Operation<SigningWallet>, String> {
    vault::backup_signing_wallet(
        client_from_state(&state)?,
        &state,
        label,
        wallet_name,
        capability_id,
    )
    .await
}

#[tauri::command]
async fn choose_signer_backup_destination(
    state: State<'_, AppState>,
    wallet_name: String,
) -> Result<Option<FileCapabilityGrant>, String> {
    file_capabilities::choose_signer_backup_destination(&state, &wallet_name)
}

#[tauri::command]
async fn build_multisig_vault(
    state: State<'_, AppState>,
    wallet_names: Vec<String>,
    coordinator_name: Option<String>,
) -> Result<Operation<VaultSummary>, String> {
    vault::build_multisig_vault(client_from_state(&state)?, wallet_names, coordinator_name).await
}

#[tauri::command]
async fn choose_public_backup_export_destination(
    state: State<'_, AppState>,
) -> Result<Option<FileCapabilityGrant>, String> {
    file_capabilities::choose_public_backup_export_destination(&state)
}

#[tauri::command]
fn export_public_backup(
    state: State<'_, AppState>,
    capability_id: String,
    backup: PublicVaultBackup,
) -> Result<String, String> {
    vault::export_public_backup(&state, capability_id, backup)
}

#[tauri::command]
async fn get_receive_snapshot(
    state: State<'_, AppState>,
    coordinator_name: String,
    existing_address: Option<String>,
) -> Result<Operation<ReceiveSnapshot>, String> {
    vault::get_receive_snapshot(
        client_from_state(&state)?,
        coordinator_name,
        existing_address,
    )
    .await
}

#[tauri::command]
async fn create_spend_draft(
    state: State<'_, AppState>,
    coordinator_name: String,
    destination: String,
    amount_sats: u64,
    fee_rate_sat_vb: f64,
) -> Result<Operation<SpendDraftView>, String> {
    vault::create_spend_draft(
        client_from_state(&state)?,
        &state,
        coordinator_name,
        destination,
        amount_sats,
        fee_rate_sat_vb,
    )
    .await
}

#[tauri::command]
async fn sign_spend_draft(
    state: State<'_, AppState>,
    draft_id: String,
    wallet_name: String,
    passphrase: String,
) -> Result<Operation<SpendDraftView>, String> {
    vault::sign_spend_draft(
        client_from_state(&state)?,
        &state,
        draft_id,
        wallet_name,
        passphrase,
    )
    .await
}

#[tauri::command]
async fn retry_signer_lock(
    state: State<'_, AppState>,
    draft_id: String,
) -> Result<Operation<SpendDraftView>, String> {
    vault::retry_signer_lock(client_from_state(&state)?, &state, draft_id).await
}

#[tauri::command]
async fn finalize_and_broadcast(
    state: State<'_, AppState>,
    draft_id: String,
) -> Result<Operation<BroadcastResult>, String> {
    vault::finalize_and_broadcast(client_from_state(&state)?, &state, draft_id).await
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            discover_core,
            connect_core,
            get_core_status,
            set_core_network_active,
            list_vaults,
            create_personal_vault,
            get_personal_vault,
            choose_personal_backup_destination,
            backup_personal_vault,
            choose_personal_restore_source,
            restore_personal_vault,
            unload_wallet,
            create_personal_receive_address,
            change_personal_vault_passphrase,
            create_personal_spend_proposal,
            sign_personal_spend_proposal,
            finalize_personal_spend_proposal,
            preflight_personal_spend_proposal,
            broadcast_personal_spend_proposal,
            create_signing_wallet,
            choose_signer_backup_destination,
            backup_signing_wallet,
            build_multisig_vault,
            choose_public_backup_export_destination,
            export_public_backup,
            get_receive_snapshot,
            create_spend_draft,
            sign_spend_draft,
            retry_signer_lock,
            finalize_and_broadcast
        ])
        .run(tauri::generate_context!())
        .expect("Core Vault Tauri runtime failed");
}
