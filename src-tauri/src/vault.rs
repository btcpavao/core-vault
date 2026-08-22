#[cfg(test)]
use crate::broadcast_authorization::BroadcastConfirmer;
use crate::{
    broadcast_authorization::{BroadcastAuthorizationGrant, BroadcastPurpose, BroadcastSummary},
    file_capabilities::{consume_file_capability, FileOperation},
    personal::{ensure_broadcast_preflight, parse_mempool_preflight},
    rpc::{ensure_signet, ensure_test_chain, sanitize_rpc_text, RpcClient},
    security::{contains_private_material, validate_public_backup, validate_wallet_name},
    types::{
        finalized_transaction_identity, AppState, BroadcastResult, MempoolPreflight, Operation,
        PublicVaultBackup, ReceiveSnapshot, RpcTrace, SignerPublic, SignerRelockRequired,
        SigningWallet, SpendDraftView, SpendState, VaultSummary,
    },
};
use serde_json::{json, Map, Value};
use std::{
    fs::{self, OpenOptions},
    io::Write,
    sync::atomic::{AtomicU64, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};
use zeroize::Zeroizing;

static DRAFT_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Clone, Debug)]
struct DescriptorKey {
    fingerprint: String,
    derivation_path: String,
    tpub: String,
    branch: u8,
}

pub async fn create_signing_wallet(
    client: RpcClient,
    label: String,
    wallet_name: String,
    passphrase: String,
) -> Result<Operation<SigningWallet>, String> {
    validate_label(&label)?;
    validate_wallet_name(&wallet_name)?;
    validate_signer_passphrase(&passphrase)?;
    let passphrase = Zeroizing::new(passphrase);
    let mut traces = Vec::new();
    ensure_test_chain(&client, &mut traces).await?;
    client
        .call(
            "createwallet",
            json!({
                "wallet_name": wallet_name,
                "disable_private_keys": false,
                "blank": false,
                "passphrase": passphrase.as_str(),
                "avoid_reuse": false,
                "descriptors": true,
                "load_on_startup": true,
                "external_signer": false
            }),
            None,
            "Bitcoin Core creates a descriptor signing wallet already encrypted with the supplied passphrase.",
            Some(json!({
                "wallet_name": wallet_name,
                "disable_private_keys": false,
                "blank": false,
                "passphrase": "[REDACTED]",
                "avoid_reuse": false,
                "descriptors": true,
                "load_on_startup": true,
                "external_signer": false
            })),
            false,
            &mut traces,
        )
        .await?;
    let wallet = verify_new_signing_wallet(&client, &label, &wallet_name, &mut traces)
        .await
        .map_err(|reason| signer_postcondition_error(&label, &wallet_name, &reason))?;
    Ok(Operation {
        data: wallet,
        rpc: traces,
    })
}

pub async fn backup_signing_wallet(
    client: RpcClient,
    state: &AppState,
    label: String,
    wallet_name: String,
    capability_id: String,
) -> Result<Operation<SigningWallet>, String> {
    validate_label(&label)?;
    validate_wallet_name(&wallet_name)?;
    let destination = consume_file_capability(
        state,
        &capability_id,
        FileOperation::SignerBackupDestination,
    )?;
    let destination_display = destination.to_string_lossy().into_owned();
    let mut traces = Vec::new();
    ensure_signet(&client, &mut traces).await?;
    let mut wallet = verify_signing_wallet(&client, &label, &wallet_name, &mut traces).await?;
    client
        .call(
            "backupwallet",
            json!({ "destination": destination_display }),
            Some(&wallet_name),
            "Bitcoin Core writes the official signing-wallet backup to the selected local path.",
            None,
            false,
            &mut traces,
        )
        .await?;

    let metadata = fs::metadata(&destination).map_err(|_| {
        "Bitcoin Core completed the call, but the backup file was not found at the destination."
            .to_string()
    })?;
    if !metadata.is_file() || metadata.len() == 0 {
        return Err("STOP: The resulting wallet backup is not a valid non-empty file.".into());
    }
    wallet.backup_path = Some(destination_display);
    Ok(Operation {
        data: wallet,
        rpc: traces,
    })
}

pub async fn build_multisig_vault(
    client: RpcClient,
    wallet_names: Vec<String>,
    requested_coordinator_name: Option<String>,
) -> Result<Operation<VaultSummary>, String> {
    if wallet_names.len() != 3 {
        return Err("Core Vault V1 requires exactly three signing wallets.".into());
    }
    for name in &wallet_names {
        validate_wallet_name(name)?;
    }
    if wallet_names[0] == wallet_names[1]
        || wallet_names[0] == wallet_names[2]
        || wallet_names[1] == wallet_names[2]
    {
        return Err("K1, K2, and K3 must be three different Bitcoin Core wallets.".into());
    }

    let mut traces = Vec::new();
    let network = ensure_test_chain(&client, &mut traces).await?;
    let mut receive_keys = Vec::new();
    let mut change_keys = Vec::new();

    for (index, wallet_name) in wallet_names.iter().enumerate() {
        let label = format!("K{}", index + 1);
        let signer = verify_signing_wallet(&client, &label, wallet_name, &mut traces).await?;
        if !signer.encrypted || !signer.locked {
            return Err(format!(
                "STOP: {label} ({wallet_name}) was not confirmed as encrypted and locked. The coordinator was not created."
            ));
        }
        let descriptors = client
            .call(
                "listdescriptors",
                json!({ "private": false }),
                Some(wallet_name),
                "Bitcoin Core returns only public descriptors so the receive and change branches can be found.",
                None,
                false,
                &mut traces,
            )
            .await?;
        let (receive, change) = extract_descriptor_pair(&descriptors)?;
        receive_keys.push((label.clone(), wallet_name.clone(), receive));
        change_keys.push((label, wallet_name.clone(), change));
    }

    validate_key_set(&receive_keys, &change_keys)?;
    let receive_raw = build_multisig_descriptor(&receive_keys, 0);
    let change_raw = build_multisig_descriptor(&change_keys, 1);
    let receive_descriptor =
        validate_descriptor(&client, receive_raw, "receive", &mut traces).await?;
    let change_descriptor = validate_descriptor(&client, change_raw, "change", &mut traces).await?;

    let coordinator_name = choose_coordinator_name(
        &client,
        requested_coordinator_name.unwrap_or_else(|| "CoreVault-2of3".into()),
        &mut traces,
    )
    .await?;
    client
        .call(
            "createwallet",
            json!({
                "wallet_name": coordinator_name,
                "disable_private_keys": true,
                "blank": true,
                "passphrase": "",
                "avoid_reuse": false,
                "descriptors": true,
                "load_on_startup": true
            }),
            None,
            "Bitcoin Core creates an empty watch-only coordinator without private keys.",
            None,
            false,
            &mut traces,
        )
        .await?;
    verify_coordinator(&client, &coordinator_name, &mut traces).await?;

    let import_result = client
        .call(
            "importdescriptors",
            json!({
                "requests": [
                    {
                        "desc": receive_descriptor,
                        "active": true,
                        "internal": false,
                        "range": [0, 1000],
                        "timestamp": "now"
                    },
                    {
                        "desc": change_descriptor,
                        "active": true,
                        "internal": true,
                        "range": [0, 1000],
                        "timestamp": "now"
                    }
                ]
            }),
            Some(&coordinator_name),
            "Bitcoin Core u watch-only coordinator aktivira checksummed receive i change policy.",
            None,
            false,
            &mut traces,
        )
        .await?;
    validate_import_result(&import_result)?;
    verify_coordinator(&client, &coordinator_name, &mut traces).await?;

    let signers = receive_keys
        .iter()
        .map(|(label, wallet_name, key)| SignerPublic {
            label: label.clone(),
            wallet_name: wallet_name.clone(),
            fingerprint: key.fingerprint.clone(),
            derivation_path: key.derivation_path.clone(),
            tpub: key.tpub.clone(),
        })
        .collect::<Vec<_>>();
    let exported_at_unix = now_unix();
    let public_backup = PublicVaultBackup {
        schema_version: 1,
        exported_at_unix,
        network: network.clone(),
        policy_type: "wsh-sortedmulti".into(),
        threshold: 2,
        participants: 3,
        signers: signers.clone(),
        receive_descriptor: receive_descriptor.clone(),
        change_descriptor: change_descriptor.clone(),
        coordinator_name: coordinator_name.clone(),
        coordinator_private_keys: false,
    };
    validate_public_backup(&public_backup)?;

    Ok(Operation {
        data: VaultSummary {
            policy: "2-of-3".into(),
            address_type: "Native SegWit".into(),
            network: test_network_label(&network).into(),
            coordinator_name,
            coordinator_has_private_keys: false,
            signers,
            receive_descriptor,
            change_descriptor,
            public_backup,
        },
        rpc: traces,
    })
}

pub fn export_public_backup(
    state: &AppState,
    capability_id: String,
    backup: PublicVaultBackup,
) -> Result<String, String> {
    let path = consume_file_capability(
        state,
        &capability_id,
        FileOperation::PublicBackupExportDestination,
    )?;
    let serialized = validate_public_backup(&backup)?;
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)
        .map_err(|_| {
            "Could not write the public vault configuration without overwriting an existing file."
                .to_string()
        })?;
    file.write_all(format!("{serialized}\n").as_bytes())
        .map_err(|_| {
            "Could not write the public vault configuration to the selected path.".to_string()
        })?;
    Ok(path.to_string_lossy().into_owned())
}

pub async fn get_receive_snapshot(
    client: RpcClient,
    coordinator_name: String,
    existing_address: Option<String>,
) -> Result<Operation<ReceiveSnapshot>, String> {
    validate_wallet_name(&coordinator_name)?;
    let mut traces = Vec::new();
    ensure_test_chain(&client, &mut traces).await?;
    verify_coordinator(&client, &coordinator_name, &mut traces).await?;
    let address = match existing_address.filter(|value| !value.trim().is_empty()) {
        Some(value) => value,
        None => client
            .call(
                "getnewaddress",
                json!({ "label": "Core Vault receive test", "address_type": "bech32" }),
                Some(&coordinator_name),
                "Bitcoin Core generates a new receive address from the active vault descriptor on the confirmed test network.",
                None,
                false,
                &mut traces,
            )
            .await?
            .as_str()
            .ok_or_else(|| "Bitcoin Core did not return a receive address.".to_string())?
            .to_string(),
    };
    if address.trim().is_empty() {
        return Err("STOP: The coordinator did not return a valid Native SegWit address.".into());
    }
    let address_info = client
        .call(
            "getaddressinfo",
            json!({ "address": address }),
            Some(&coordinator_name),
            "Checks that the coordinator recognizes the address as a solvable watch-only vault address.",
            None,
            false,
            &mut traces,
        )
        .await?;
    let balances = client
        .call(
            "getbalances",
            json!({}),
            Some(&coordinator_name),
            "Reads the coordinator's locally confirmed and unconfirmed balance.",
            None,
            false,
            &mut traces,
        )
        .await?;
    let balance_btc = wallet_balance_btc(&balances);
    let solvable = address_info.get("solvable").and_then(Value::as_bool) == Some(true);
    if !solvable {
        return Err(
            "STOP: Bitcoin Core does not consider the receive address solvable by the coordinator."
                .into(),
        );
    }
    Ok(Operation {
        data: ReceiveSnapshot {
            address,
            balance_btc,
            balance_sats: btc_to_sats(balance_btc),
            solvable,
            watch_only: true,
        },
        rpc: traces,
    })
}

pub async fn create_spend_draft(
    client: RpcClient,
    state: &AppState,
    coordinator_name: String,
    destination: String,
    amount_sats: u64,
    fee_rate_sat_vb: f64,
) -> Result<Operation<SpendDraftView>, String> {
    validate_wallet_name(&coordinator_name)?;
    if amount_sats == 0 || amount_sats > 2_100_000_000_000_000 {
        return Err("Enter a valid amount greater than 0 sats.".into());
    }
    if !(1.0..=1_000.0).contains(&fee_rate_sat_vb) {
        return Err("The fee rate must be between 1 and 1,000 sat/vB.".into());
    }
    let mut traces = Vec::new();
    let network = ensure_test_chain(&client, &mut traces).await?;
    verify_coordinator(&client, &coordinator_name, &mut traces).await?;
    let starting_balances = client
        .call(
            "getbalances",
            json!({}),
            Some(&coordinator_name),
            "Records the initial local vault balance for a clear transaction review.",
            None,
            false,
            &mut traces,
        )
        .await?;
    let starting_balance_sats = btc_to_sats(wallet_balance_btc(&starting_balances));
    let validated = client
        .call(
            "validateaddress",
            json!({ "address": destination }),
            None,
            "Bitcoin Core checks the recipient address format and network.",
            None,
            false,
            &mut traces,
        )
        .await?;
    if validated.get("isvalid").and_then(Value::as_bool) != Some(true) {
        return Err(
            "The recipient address is not valid for the confirmed test network. The transaction was not created.".into(),
        );
    }

    let amount_btc = amount_sats as f64 / 100_000_000.0;
    let amount_value = serde_json::Number::from_f64(amount_btc)
        .map(Value::Number)
        .ok_or_else(|| "Could not convert the amount to BTC safely.".to_string())?;
    let mut output = Map::new();
    output.insert(destination.clone(), amount_value);
    let funded = client
        .call(
            "walletcreatefundedpsbt",
            json!({
                "inputs": [],
                "outputs": [Value::Object(output)],
                "locktime": 0,
                "options": {
                    "includeWatching": true,
                    "fee_rate": fee_rate_sat_vb,
                    "replaceable": true,
                    "change_type": "bech32"
                },
                "bip32derivs": true
            }),
            Some(&coordinator_name),
            "The watch-only coordinator selects funds, adds change, and prepares an unsigned PSBT.",
            None,
            true,
            &mut traces,
        )
        .await?;
    let psbt = funded
        .get("psbt")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Bitcoin Core did not return the prepared PSBT.".to_string())?
        .to_string();
    let fee_btc = funded.get("fee").and_then(Value::as_f64).unwrap_or(0.0);
    let draft_id = next_draft_id();
    let draft = SpendState {
        coordinator_name,
        network,
        destination,
        amount_sats,
        starting_balance_sats,
        fee_btc,
        psbt,
        signed_by: Vec::new(),
        complete: false,
        relock_required: None,
        raw_hex: None,
        mempool_preflight: MempoolPreflight::NotRun,
        preflight_version: 0,
        broadcast_in_progress: false,
    };
    let view = draft.view(draft_id.clone());
    state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?
        .insert(draft_id, draft);
    Ok(Operation {
        data: view,
        rpc: traces,
    })
}

pub async fn sign_spend_draft(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
    wallet_name: String,
    passphrase: String,
) -> Result<Operation<SpendDraftView>, String> {
    validate_wallet_name(&wallet_name)?;
    let snapshot = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| {
            "The transaction draft is no longer available. Create a new one.".to_string()
        })?;
    ensure_legacy_workflow_can_progress(&snapshot)?;
    if snapshot.broadcast_in_progress {
        return Err("A broadcast attempt is already in progress for this transaction.".into());
    }
    if snapshot.raw_hex.is_some() {
        return Err(
            "The transaction is already finalized. A new signature requires a new transaction draft.".into(),
        );
    }
    if snapshot.signed_by.iter().any(|name| name == &wallet_name) {
        return Err(
            "This signing wallet has already approved the transaction. Choose a different key."
                .into(),
        );
    }
    let passphrase = Zeroizing::new(passphrase);
    let mut traces = Vec::new();
    ensure_test_chain(&client, &mut traces).await?;
    let wallet = verify_signing_wallet(&client, "Signer", &wallet_name, &mut traces).await?;
    if wallet.encrypted && passphrase.is_empty() {
        return Err(format!(
            "{wallet_name} is locked. The bitcoin is safe. Enter its passphrase to sign."
        ));
    }

    if wallet.encrypted {
        client
            .call(
                "walletpassphrase",
                json!({ "passphrase": passphrase.as_str(), "timeout": 5 }),
                Some(&wallet_name),
                "Bitcoin Core unlocks the selected signing wallet for no more than five seconds.",
                Some(json!({ "passphrase": "[REDACTED]", "timeout": 5 })),
                false,
                &mut traces,
            )
            .await?;
    }

    let signing_result = client
        .call(
            "walletprocesspsbt",
            json!({
                "psbt": snapshot.psbt,
                "sign": true,
                "sighashtype": "ALL",
                "bip32derivs": true
            }),
            Some(&wallet_name),
            "Bitcoin Core adds a signature from this signing wallet to the PSBT.",
            Some(json!({ "psbt": "[REDACTED]", "sign": true, "sighashtype": "ALL" })),
            true,
            &mut traces,
        )
        .await
        .and_then(|processed| parse_legacy_signature(&snapshot.psbt, processed));

    let relock_result = if wallet.encrypted {
        client
            .call(
                "walletlock",
                json!({}),
                Some(&wallet_name),
                "Bitcoin Core immediately locks the signing wallet again.",
                None,
                false,
                &mut traces,
            )
            .await
            .map(|_| ())
    } else {
        Ok(())
    };

    let outcome = classify_signer_signing_outcome(signing_result, relock_result);

    let mut drafts = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?;
    let draft = drafts.get_mut(&draft_id).ok_or_else(|| {
        "The transaction draft is no longer available. Create a new one.".to_string()
    })?;
    if draft.psbt != snapshot.psbt {
        return Err("Another signature changed the transaction draft. Reload its state.".into());
    }

    match outcome {
        SignerSigningOutcome::SignedAndLocked(signature) => {
            apply_legacy_signature(draft, &wallet_name, signature);
            draft.relock_required = None;
        }
        SignerSigningOutcome::SignedButRelockFailed {
            signature,
            relock_error,
        } => {
            apply_legacy_signature(draft, &wallet_name, signature);
            draft.relock_required =
                Some(relock_required_state(wallet_name, true, None, relock_error));
        }
        SignerSigningOutcome::SigningFailedAndLocked { signing_error } => {
            return Err(signing_error);
        }
        SignerSigningOutcome::SigningFailedAndRelockFailed {
            signing_error,
            relock_error,
        } => {
            draft.relock_required = Some(relock_required_state(
                wallet_name,
                false,
                Some(signing_error),
                relock_error,
            ));
        }
    }

    let view = draft.view(draft_id);
    Ok(Operation {
        data: view,
        rpc: traces,
    })
}

pub async fn retry_signer_lock(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
) -> Result<Operation<SpendDraftView>, String> {
    let stop = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| {
            "The transaction draft is no longer available. Create a new one.".to_string()
        })?
        .relock_required
        .ok_or_else(|| {
            "This transaction draft does not require the signer to be locked again.".to_string()
        })?;

    let mut traces = Vec::new();
    let relock_result = client
        .call(
            "walletlock",
            json!({}),
            Some(&stop.wallet_name),
            "Bitcoin Core retries locking the exact signer whose cleanup was not confirmed.",
            None,
            false,
            &mut traces,
        )
        .await;

    let mut drafts = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?;
    let draft = drafts.get_mut(&draft_id).ok_or_else(|| {
        "The transaction draft is no longer available. Create a new one.".to_string()
    })?;
    let current_stop = draft.relock_required.as_mut().ok_or_else(|| {
        "The signer relock state changed during the attempt. Reload the transaction.".to_string()
    })?;
    if current_stop.wallet_name != stop.wallet_name {
        return Err(
            "The signer relock state changed during the attempt. Reload the transaction.".into(),
        );
    }

    match relock_result {
        Ok(_) => draft.relock_required = None,
        Err(error) => current_stop.relock_error = sanitize_rpc_text(&error),
    }

    Ok(Operation {
        data: draft.view(draft_id),
        rpc: traces,
    })
}

pub async fn finalize_multisig_spend(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
) -> Result<Operation<SpendDraftView>, String> {
    let snapshot = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| {
            "The transaction draft is no longer available. Create a new one.".to_string()
        })?;
    ensure_legacy_workflow_can_progress(&snapshot)?;
    if snapshot.broadcast_in_progress {
        return Err("A broadcast attempt is already in progress for this transaction.".into());
    }
    if snapshot.signed_by.len() < 2 || !snapshot.complete {
        return Err("The transaction needs more signatures and cannot be finalized.".into());
    }
    if snapshot.raw_hex.is_some() {
        return Err("The transaction is already finalized.".into());
    }
    let mut traces = Vec::new();
    ensure_test_chain(&client, &mut traces).await?;
    verify_coordinator(&client, &snapshot.coordinator_name, &mut traces).await?;
    let finalized = client
        .call(
            "finalizepsbt",
            json!({ "psbt": snapshot.psbt, "extract": true }),
            None,
            "Bitcoin Core checks signatures locally and finalizes the transaction without preflight or broadcast.",
            Some(json!({ "psbt": "[REDACTED]", "extract": true })),
            true,
            &mut traces,
        )
        .await?;
    if finalized.get("complete").and_then(Value::as_bool) != Some(true) {
        return Err(
            "Bitcoin Core did not confirm enough signatures. The finalized state was not saved."
                .into(),
        );
    }
    let raw_hex = finalized
        .get("hex")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Bitcoin Core did not return the finalized transaction hex.".to_string())?
        .to_string();
    let mut drafts = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?;
    let draft = drafts.get_mut(&draft_id).ok_or_else(|| {
        "The transaction draft is no longer available. Create a new one.".to_string()
    })?;
    ensure_legacy_workflow_can_progress(draft)?;
    if draft.psbt != snapshot.psbt || draft.raw_hex.is_some() || draft.broadcast_in_progress {
        return Err("The transaction draft changed during finalization. Reload its state.".into());
    }
    draft.raw_hex = Some(raw_hex);
    draft.mempool_preflight = MempoolPreflight::NotRun;
    draft.preflight_version = draft.preflight_version.saturating_add(1);
    let view = draft.view(draft_id.clone());
    state
        .broadcast_authorizations
        .lock()
        .map_err(|_| "Broadcast authorizations are currently unavailable.".to_string())?
        .revoke_draft(&draft_id);
    Ok(Operation {
        data: view,
        rpc: traces,
    })
}

pub async fn preflight_multisig_spend(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
) -> Result<Operation<SpendDraftView>, String> {
    let snapshot = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| {
            "The transaction draft is no longer available. Create a new one.".to_string()
        })?;
    ensure_legacy_workflow_can_progress(&snapshot)?;
    if snapshot.broadcast_in_progress {
        return Err("A broadcast attempt is already in progress for this transaction.".into());
    }
    let raw_hex = snapshot
        .raw_hex
        .clone()
        .ok_or_else(|| "The transaction has not been finalized yet.".to_string())?;
    let transaction_identity = finalized_transaction_identity(&raw_hex);
    let mut traces = Vec::new();
    let preflight = match ensure_test_chain(&client, &mut traces).await {
        Ok(_) => match client
            .call(
                "testmempoolaccept",
                json!({ "rawtxs": [raw_hex] }),
                None,
                "Bitcoin Core checks the exact finalized transaction locally without broadcasting it.",
                Some(json!({ "rawtxs": ["[REDACTED]"] })),
                true,
                &mut traces,
            )
            .await
        {
            Ok(result) => parse_mempool_preflight(result, transaction_identity.clone()),
            Err(_) => MempoolPreflight::Indeterminate {
                transaction_identity: transaction_identity.clone(),
                reason: "Core Vault could not obtain a reliable testmempoolaccept result. Broadcast is disabled."
                    .into(),
            },
        },
        Err(_) => MempoolPreflight::Indeterminate {
            transaction_identity: transaction_identity.clone(),
            reason: "Core Vault could not confirm a supported network for the mempool check. Broadcast is disabled."
                .into(),
        },
    };

    let mut drafts = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?;
    let draft = drafts.get_mut(&draft_id).ok_or_else(|| {
        "The transaction draft is no longer available. Create a new one.".to_string()
    })?;
    ensure_legacy_workflow_can_progress(draft)?;
    if draft.raw_hex.as_deref() != Some(raw_hex.as_str()) || draft.broadcast_in_progress {
        return Err(
            "The finalized transaction changed during the mempool check. Run the check again."
                .into(),
        );
    }
    draft.mempool_preflight = preflight;
    draft.preflight_version = draft.preflight_version.saturating_add(1);
    let view = draft.view(draft_id.clone());
    state
        .broadcast_authorizations
        .lock()
        .map_err(|_| "Broadcast authorizations are currently unavailable.".to_string())?
        .revoke_draft(&draft_id);
    Ok(Operation {
        data: view,
        rpc: traces,
    })
}

#[derive(Clone, Debug)]
pub struct PreparedMultisigBroadcastAuthorization {
    draft_id: String,
    transaction_identity: String,
    preflight_version: u64,
    pub summary: BroadcastSummary,
}

pub fn prepare_multisig_broadcast_authorization(
    state: &AppState,
    draft_id: &str,
) -> Result<PreparedMultisigBroadcastAuthorization, String> {
    let drafts = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?;
    let draft = drafts.get(draft_id).ok_or_else(|| {
        "The transaction draft is no longer available. Create a new one.".to_string()
    })?;
    let (_, transaction_identity) = ensure_legacy_ready_for_broadcast(draft)?;
    Ok(PreparedMultisigBroadcastAuthorization {
        draft_id: draft_id.into(),
        transaction_identity,
        preflight_version: draft.preflight_version,
        summary: BroadcastSummary {
            vault_name: draft.coordinator_name.clone(),
            destination: draft.destination.clone(),
            amount_sats: draft.amount_sats,
            fee_sats: btc_to_sats(draft.fee_btc),
            network: test_network_label(&draft.network).into(),
        },
    })
}

pub fn complete_multisig_broadcast_authorization(
    state: &AppState,
    prepared: PreparedMultisigBroadcastAuthorization,
    approved: bool,
) -> Result<Option<BroadcastAuthorizationGrant>, String> {
    if !approved {
        return Ok(None);
    }
    let drafts = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?;
    let draft = drafts.get(&prepared.draft_id).ok_or_else(|| {
        "The transaction draft is no longer available. Create a new one.".to_string()
    })?;
    let (_, current_identity) = ensure_legacy_ready_for_broadcast(draft)?;
    if current_identity != prepared.transaction_identity
        || draft.preflight_version != prepared.preflight_version
    {
        return Err(
            "The transaction or its mempool check changed during confirmation. Review and confirm the broadcast again."
                .into(),
        );
    }
    let grant = state
        .broadcast_authorizations
        .lock()
        .map_err(|_| "Broadcast authorizations are currently unavailable.".to_string())?
        .issue(
            BroadcastPurpose::LegacyMultisigTransaction,
            prepared.draft_id,
            prepared.transaction_identity,
            prepared.preflight_version,
        )?;
    Ok(Some(grant))
}

#[cfg(test)]
pub(crate) fn request_multisig_broadcast_authorization_with<C: BroadcastConfirmer>(
    state: &AppState,
    draft_id: &str,
    confirmer: &C,
) -> Result<Option<BroadcastAuthorizationGrant>, String> {
    let prepared = prepare_multisig_broadcast_authorization(state, draft_id)?;
    let approved = confirmer.confirm(&prepared.summary)?;
    complete_multisig_broadcast_authorization(state, prepared, approved)
}

pub async fn broadcast_multisig_spend(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
    authorization_id: String,
) -> Result<Operation<BroadcastResult>, String> {
    let snapshot = state
        .drafts
        .lock()
        .map_err(|_| "Internal transaction state is unavailable.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| {
            "The transaction draft is no longer available. Create a new one.".to_string()
        })?;
    let (_, transaction_identity) = ensure_legacy_ready_for_broadcast(&snapshot)?;
    state
        .broadcast_authorizations
        .lock()
        .map_err(|_| "Broadcast authorizations are currently unavailable.".to_string())?
        .consume(
            &authorization_id,
            BroadcastPurpose::LegacyMultisigTransaction,
            &draft_id,
            &transaction_identity,
            snapshot.preflight_version,
        )?;

    {
        let mut drafts = state
            .drafts
            .lock()
            .map_err(|_| "Internal transaction state is unavailable.".to_string())?;
        let draft = drafts.get_mut(&draft_id).ok_or_else(|| {
            "The transaction draft is no longer available. Create a new one.".to_string()
        })?;
        let (_, current_identity) = ensure_legacy_ready_for_broadcast(draft)?;
        if current_identity != transaction_identity
            || draft.preflight_version != snapshot.preflight_version
        {
            return Err(
                "The transaction or preflight changed before broadcast. The authorization has been consumed."
                    .into(),
            );
        }
        draft.broadcast_in_progress = true;
    }

    let mut traces = Vec::new();
    let attempt = async {
        let current_network = ensure_test_chain(&client, &mut traces).await?;
        if current_network != snapshot.network {
            return Err(
                "STOP: The active Bitcoin Core network does not match the reviewed transaction draft. The authorization has been consumed."
                    .into(),
            );
        }
        let network = client
            .call(
                "getnetworkinfo",
                json!({}),
                None,
                "Checks that the Bitcoin Core P2P network is active immediately before broadcast.",
                None,
                false,
                &mut traces,
            )
            .await?;
        if network.get("networkactive").and_then(Value::as_bool) != Some(true) {
            return Err(
                "Broadcast is disabled while Bitcoin Core network activity is disabled. The authorization has been consumed."
                    .into(),
            );
        }
        let raw_hex = snapshot
            .raw_hex
            .as_deref()
            .ok_or_else(|| "The transaction is no longer finalized.".to_string())?;
        let txid = client
            .call(
                "sendrawtransaction",
                json!({ "hexstring": raw_hex }),
                None,
                "Bitcoin Core broadcasts the authorized finalized transaction on the confirmed test network.",
                Some(json!({ "hexstring": "[REDACTED]" })),
                false,
                &mut traces,
            )
            .await?
            .as_str()
            .filter(|value| value.len() == 64 && value.chars().all(|character| character.is_ascii_hexdigit()))
            .ok_or_else(|| "Bitcoin Core did not return a valid txid.".to_string())?
            .to_string();
        let fee_sats = btc_to_sats(snapshot.fee_btc);
        let estimated_remaining = snapshot
            .starting_balance_sats
            .saturating_sub(snapshot.amount_sats)
            .saturating_sub(fee_sats);
        let refreshed_balances = client
            .call(
                "getbalances",
                json!({}),
                Some(&snapshot.coordinator_name),
                "Refreshes the local vault balance and checks change after a successful broadcast.",
                None,
                false,
                &mut traces,
            )
            .await;
        let (remaining_sats, balance_refreshed) = match refreshed_balances {
            Ok(value) => (btc_to_sats(wallet_balance_btc(&value)), true),
            Err(_) => (estimated_remaining, false),
        };
        Ok::<_, String>(BroadcastResult {
            txid,
            starting_balance_sats: snapshot.starting_balance_sats,
            sent_sats: snapshot.amount_sats,
            fee_sats,
            remaining_sats,
            balance_refreshed,
        })
    }
    .await;

    match attempt {
        Ok(result) => {
            state
                .drafts
                .lock()
                .map_err(|_| "Internal transaction state is unavailable.".to_string())?
                .remove(&draft_id);
            state
                .broadcast_authorizations
                .lock()
                .map_err(|_| "Broadcast authorizations are currently unavailable.".to_string())?
                .revoke_draft(&draft_id);
            Ok(Operation {
                data: result,
                rpc: traces,
            })
        }
        Err(error) => {
            if let Ok(mut drafts) = state.drafts.lock() {
                if let Some(draft) = drafts.get_mut(&draft_id) {
                    draft.broadcast_in_progress = false;
                }
            }
            Err(error)
        }
    }
}

fn ensure_legacy_ready_for_broadcast(draft: &SpendState) -> Result<(&str, String), String> {
    ensure_legacy_workflow_can_progress(draft)?;
    if draft.broadcast_in_progress {
        return Err("A broadcast attempt is already in progress for this transaction.".into());
    }
    if draft.signed_by.len() < 2 || !draft.complete {
        return Err("The transaction does not have a confirmed signature threshold.".into());
    }
    let raw_hex = draft
        .raw_hex
        .as_deref()
        .ok_or_else(|| "The transaction has not been finalized yet.".to_string())?;
    ensure_broadcast_preflight(&draft.mempool_preflight, raw_hex)?;
    Ok((raw_hex, finalized_transaction_identity(raw_hex)))
}

fn test_network_label(network: &str) -> &str {
    match network {
        "signet" => "Signet",
        "test" => "Testnet",
        "testnet4" => "Testnet4",
        "regtest" => "Regtest",
        _ => "Unknown",
    }
}

#[derive(Debug)]
struct LegacySignature {
    psbt: String,
    complete: bool,
}

#[derive(Debug)]
enum SignerSigningOutcome {
    SignedAndLocked(LegacySignature),
    SignedButRelockFailed {
        signature: LegacySignature,
        relock_error: String,
    },
    SigningFailedAndLocked {
        signing_error: String,
    },
    SigningFailedAndRelockFailed {
        signing_error: String,
        relock_error: String,
    },
}

fn parse_legacy_signature(
    previous_psbt: &str,
    processed: Value,
) -> Result<LegacySignature, String> {
    let updated_psbt = processed
        .get("psbt")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Bitcoin Core did not return an updated PSBT.".to_string())?
        .to_string();
    if updated_psbt == previous_psbt {
        return Err(
            "The signing wallet did not add a signature. The bitcoin is safe and the transaction was not broadcast."
                .into(),
        );
    }
    Ok(LegacySignature {
        psbt: updated_psbt,
        complete: processed
            .get("complete")
            .and_then(Value::as_bool)
            .unwrap_or(false),
    })
}

fn classify_signer_signing_outcome(
    signing_result: Result<LegacySignature, String>,
    relock_result: Result<(), String>,
) -> SignerSigningOutcome {
    match (signing_result, relock_result) {
        (Ok(signature), Ok(())) => SignerSigningOutcome::SignedAndLocked(signature),
        (Ok(signature), Err(relock_error)) => SignerSigningOutcome::SignedButRelockFailed {
            signature,
            relock_error,
        },
        (Err(signing_error), Ok(())) => {
            SignerSigningOutcome::SigningFailedAndLocked { signing_error }
        }
        (Err(signing_error), Err(relock_error)) => {
            SignerSigningOutcome::SigningFailedAndRelockFailed {
                signing_error,
                relock_error,
            }
        }
    }
}

fn apply_legacy_signature(draft: &mut SpendState, wallet_name: &str, signature: LegacySignature) {
    draft.psbt = signature.psbt;
    draft.signed_by.push(wallet_name.to_string());
    draft.complete = signature.complete;
    draft.raw_hex = None;
    draft.mempool_preflight = MempoolPreflight::NotRun;
    draft.preflight_version = draft.preflight_version.saturating_add(1);
    draft.broadcast_in_progress = false;
}

fn relock_required_state(
    wallet_name: String,
    signature_added: bool,
    signing_error: Option<String>,
    relock_error: String,
) -> SignerRelockRequired {
    SignerRelockRequired {
        wallet_name,
        signature_added,
        signing_error: signing_error.map(|error| sanitize_rpc_text(&error)),
        relock_error: sanitize_rpc_text(&relock_error),
    }
}

fn ensure_legacy_workflow_can_progress(draft: &SpendState) -> Result<(), String> {
    if let Some(stop) = &draft.relock_required {
        return Err(format!(
            "STOP: Signing wallet {} was not confirmed as locked again. Further signing, finalization, and broadcast are blocked until Retry lock succeeds.",
            stop.wallet_name
        ));
    }
    Ok(())
}

async fn verify_new_signing_wallet(
    client: &RpcClient,
    label: &str,
    wallet_name: &str,
    traces: &mut Vec<RpcTrace>,
) -> Result<SigningWallet, String> {
    let mut wallet = verify_signing_wallet(client, label, wallet_name, traces).await?;
    if !wallet.encrypted || !wallet.locked {
        return Err(
            "Bitcoin Core did not confirm that the signing wallet is encrypted and locked.".into(),
        );
    }
    wallet.public_identity =
        Some(read_signer_public_identity(client, label, wallet_name, traces).await?);
    Ok(wallet)
}

async fn read_signer_public_identity(
    client: &RpcClient,
    label: &str,
    wallet_name: &str,
    traces: &mut Vec<RpcTrace>,
) -> Result<SignerPublic, String> {
    let descriptors = client
        .call(
            "listdescriptors",
            json!({ "private": false }),
            Some(wallet_name),
            "Bitcoin Core returns only the new signer's public receive and change identity.",
            None,
            false,
            traces,
        )
        .await?;
    let (receive, change) = extract_descriptor_pair(&descriptors)?;
    validate_signer_descriptor_pair(label, &receive, &change)?;
    Ok(SignerPublic {
        label: label.into(),
        wallet_name: wallet_name.into(),
        fingerprint: receive.fingerprint,
        derivation_path: receive.derivation_path,
        tpub: receive.tpub,
    })
}

fn signer_postcondition_error(label: &str, wallet_name: &str, reason: &str) -> String {
    format!(
        "PARTIAL CREATION: Bitcoin Core created signer {label} ({wallet_name}), but Core Vault could not confirm the expected encrypted and locked state with a valid public identity. Multisig setup has stopped. The Core wallet was not deleted. Reason: {}",
        sanitize_rpc_text(reason)
    )
}

async fn verify_signing_wallet(
    client: &RpcClient,
    label: &str,
    wallet_name: &str,
    traces: &mut Vec<RpcTrace>,
) -> Result<SigningWallet, String> {
    let info = client
        .call(
            "getwalletinfo",
            json!({}),
            Some(wallet_name),
            "Checks the signing wallet security invariants.",
            None,
            false,
            traces,
        )
        .await?;
    let descriptors = info.get("descriptors").and_then(Value::as_bool) == Some(true);
    let private_keys_enabled =
        info.get("private_keys_enabled").and_then(Value::as_bool) == Some(true);
    if !descriptors || !private_keys_enabled {
        return Err(format!(
            "STOP: {wallet_name} is not a descriptor signing wallet with private keys enabled."
        ));
    }
    let encrypted = info.get("unlocked_until").is_some();
    let locked = encrypted
        && info
            .get("unlocked_until")
            .and_then(Value::as_i64)
            .unwrap_or(0)
            == 0;
    Ok(SigningWallet {
        label: label.into(),
        name: wallet_name.into(),
        descriptors,
        private_keys_enabled,
        encrypted,
        locked,
        public_identity: None,
        backup_path: None,
    })
}

async fn verify_coordinator(
    client: &RpcClient,
    wallet_name: &str,
    traces: &mut Vec<RpcTrace>,
) -> Result<(), String> {
    let info = client
        .call(
            "getwalletinfo",
            json!({}),
            Some(wallet_name),
            "Checks that the coordinator has no private keys.",
            None,
            false,
            traces,
        )
        .await?;
    let descriptors = info.get("descriptors").and_then(Value::as_bool) == Some(true);
    let private_keys_enabled = info
        .get("private_keys_enabled")
        .and_then(Value::as_bool)
        .unwrap_or(true);
    if !descriptors || private_keys_enabled {
        return Err(
            "STOP: The coordinator is not a watch-only descriptor wallet without private keys."
                .into(),
        );
    }
    Ok(())
}

fn extract_descriptor_pair(result: &Value) -> Result<(DescriptorKey, DescriptorKey), String> {
    let descriptors = result
        .get("descriptors")
        .and_then(Value::as_array)
        .ok_or_else(|| {
            "The listdescriptors response does not contain the expected descriptor list."
                .to_string()
        })?;
    let mut receive = Vec::new();
    let mut change = Vec::new();
    for entry in descriptors {
        let Some(desc) = entry.get("desc").and_then(Value::as_str) else {
            continue;
        };
        if !desc.starts_with("wpkh(") {
            continue;
        }
        let key = parse_wpkh_descriptor(desc)?;
        let internal = entry
            .get("internal")
            .and_then(Value::as_bool)
            .unwrap_or(false);
        match (internal, key.branch) {
            (false, 0) => receive.push(key),
            (true, 1) => change.push(key),
            _ => {}
        }
    }
    if receive.len() != 1 || change.len() != 1 {
        return Err(format!(
            "STOP: Expected one public wpkh receive /0/* descriptor and one change /1/* descriptor. Found {} and {}.",
            receive.len(),
            change.len()
        ));
    }
    Ok((receive.remove(0), change.remove(0)))
}

fn parse_wpkh_descriptor(desc: &str) -> Result<DescriptorKey, String> {
    if contains_private_material(desc) {
        return Err("STOP: The listdescriptors response contains private-key material.".into());
    }
    let without_checksum = desc.split('#').next().unwrap_or(desc);
    let inner = without_checksum
        .strip_prefix("wpkh([")
        .and_then(|value| value.strip_suffix(')'))
        .ok_or_else(|| {
            "The wpkh descriptor does not have the expected public origin structure.".to_string()
        })?;
    let closing = inner
        .find(']')
        .ok_or_else(|| "Descriptor nema master fingerprint i derivation path.".to_string())?;
    let origin = &inner[..closing];
    let key_path = &inner[closing + 1..];
    if origin.len() < 10 {
        return Err("The descriptor origin is incomplete.".into());
    }
    let (fingerprint, derivation_path) = origin.split_at(8);
    if !fingerprint.chars().all(|value| value.is_ascii_hexdigit())
        || !derivation_path.starts_with('/')
    {
        return Err("The descriptor master fingerprint or derivation path is invalid.".into());
    }
    let (tpub, branch) = if let Some(value) = key_path.strip_suffix("/0/*") {
        (value, 0)
    } else if let Some(value) = key_path.strip_suffix("/1/*") {
        (value, 1)
    } else {
        return Err("The descriptor is not the expected ranged /0/* or /1/* branch.".into());
    };
    if !tpub.starts_with("tpub")
        || tpub.len() < 100
        || !tpub.chars().all(|value| value.is_ascii_alphanumeric())
    {
        return Err(
            "The descriptor does not contain the expected public Signet/Testnet tpub.".into(),
        );
    }
    Ok(DescriptorKey {
        fingerprint: fingerprint.to_ascii_lowercase(),
        derivation_path: derivation_path.into(),
        tpub: tpub.into(),
        branch,
    })
}

fn validate_key_set(
    receive: &[(String, String, DescriptorKey)],
    change: &[(String, String, DescriptorKey)],
) -> Result<(), String> {
    for index in 0..3 {
        let receive_key = &receive[index].2;
        let change_key = &change[index].2;
        validate_signer_descriptor_pair(&receive[index].0, receive_key, change_key)?;
    }
    for left in 0..3 {
        for right in (left + 1)..3 {
            if receive[left].2.fingerprint == receive[right].2.fingerprint
                || receive[left].2.tpub == receive[right].2.tpub
            {
                return Err(
                    "STOP: K1, K2, and K3 must have different fingerprints and tpubs.".into(),
                );
            }
        }
    }
    let path = &receive[0].2.derivation_path;
    if receive
        .iter()
        .any(|(_, _, key)| &key.derivation_path != path)
    {
        return Err(
            "STOP: The signing wallets do not have compatible derivation-path structures.".into(),
        );
    }
    Ok(())
}

fn validate_signer_descriptor_pair(
    label: &str,
    receive: &DescriptorKey,
    change: &DescriptorKey,
) -> Result<(), String> {
    if receive.fingerprint != change.fingerprint
        || receive.tpub != change.tpub
        || receive.derivation_path != change.derivation_path
    {
        return Err(format!(
            "STOP: {label} receive i change javni podaci ne pripadaju istom signing walletu."
        ));
    }
    Ok(())
}

fn build_multisig_descriptor(keys: &[(String, String, DescriptorKey)], branch: u8) -> String {
    let expressions = keys
        .iter()
        .map(|(_, _, key)| {
            format!(
                "[{}{}]{}/{branch}/*",
                key.fingerprint, key.derivation_path, key.tpub
            )
        })
        .collect::<Vec<_>>()
        .join(",");
    format!("wsh(sortedmulti(2,{expressions}))")
}

async fn validate_descriptor(
    client: &RpcClient,
    descriptor: String,
    branch_name: &str,
    traces: &mut Vec<RpcTrace>,
) -> Result<String, String> {
    let result = client
        .call(
            "getdescriptorinfo",
            json!({ "descriptor": descriptor }),
            None,
            &format!(
                "Bitcoin Core validates the {branch_name} policy and adds the official checksum."
            ),
            None,
            false,
            traces,
        )
        .await?;
    let valid = result.get("isrange").and_then(Value::as_bool) == Some(true)
        && result.get("issolvable").and_then(Value::as_bool) == Some(true)
        && result.get("hasprivatekeys").and_then(Value::as_bool) == Some(false);
    if !valid {
        return Err(format!(
            "STOP: Bitcoin Core did not confirm the security conditions for the {branch_name} descriptor."
        ));
    }
    let checksummed = result
        .get("descriptor")
        .and_then(Value::as_str)
        .filter(|value| value.contains('#'))
        .ok_or_else(|| "Bitcoin Core did not return a checksummed descriptor.".to_string())?;
    if contains_private_material(checksummed) {
        return Err("STOP: The validated descriptor contains private-key material.".into());
    }
    Ok(checksummed.into())
}

async fn choose_coordinator_name(
    client: &RpcClient,
    base: String,
    traces: &mut Vec<RpcTrace>,
) -> Result<String, String> {
    validate_wallet_name(&base)?;
    let wallet_dir = client
        .call(
            "listwalletdir",
            json!({}),
            None,
            "Finds an available local name for the watch-only coordinator.",
            None,
            false,
            traces,
        )
        .await?;
    let existing = wallet_dir
        .get("wallets")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let names = existing
        .iter()
        .filter_map(|value| value.get("name").and_then(Value::as_str))
        .collect::<Vec<_>>();
    if !names.iter().any(|name| *name == base) {
        return Ok(base);
    }
    for suffix in 2..=999 {
        let candidate = format!("{base}-{suffix}");
        if candidate.len() <= 64 && !names.iter().any(|name| *name == candidate) {
            return Ok(candidate);
        }
    }
    Err("Could not find an available safe name for the coordinator wallet.".into())
}

fn validate_import_result(result: &Value) -> Result<(), String> {
    let entries = result
        .as_array()
        .ok_or_else(|| "importdescriptors did not return the expected two results.".to_string())?;
    if entries.len() != 2
        || entries
            .iter()
            .any(|entry| entry.get("success").and_then(Value::as_bool) != Some(true))
    {
        let reasons = entries
            .iter()
            .filter(|entry| entry.get("success").and_then(Value::as_bool) != Some(true))
            .filter_map(|entry| entry.pointer("/error/message").and_then(Value::as_str))
            .map(sanitize_rpc_text)
            .collect::<Vec<_>>();
        let detail = if reasons.is_empty() {
            "Bitcoin Core did not return a safe rejection reason.".into()
        } else {
            reasons.join("; ")
        };
        return Err(format!(
            "STOP: The receive and change descriptors were not both imported successfully. Reason: {detail}"
        ));
    }
    Ok(())
}

fn validate_label(label: &str) -> Result<(), String> {
    if matches!(label, "K1" | "K2" | "K3") {
        Ok(())
    } else {
        Err("The signing-wallet label must be K1, K2, or K3.".into())
    }
}

fn validate_signer_passphrase(value: &str) -> Result<(), String> {
    if value.chars().count() < 10 {
        return Err("The wallet passphrase must contain at least 10 characters.".into());
    }
    if value.chars().any(char::is_control) {
        return Err("The wallet passphrase contains a forbidden control character.".into());
    }
    Ok(())
}

fn next_draft_id() -> String {
    format!(
        "draft-{}-{}",
        now_unix(),
        DRAFT_COUNTER.fetch_add(1, Ordering::Relaxed)
    )
}

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn wallet_balance_btc(result: &Value) -> f64 {
    result
        .pointer("/mine/trusted")
        .and_then(Value::as_f64)
        .unwrap_or(0.0)
        + result
            .pointer("/mine/untrusted_pending")
            .and_then(Value::as_f64)
            .unwrap_or(0.0)
}

fn btc_to_sats(value: f64) -> u64 {
    (value * 100_000_000.0).round().max(0.0) as u64
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ConnectionSettings;
    use std::{
        fs,
        io::{BufRead, BufReader, Read, Write},
        net::TcpListener,
        path::PathBuf,
        sync::{Arc, Mutex},
        thread,
    };

    struct MockRpcStep {
        method: &'static str,
        response: Result<Value, &'static str>,
        atomic_signer_wallet: Option<&'static str>,
        expected_raw_hex: Option<&'static str>,
    }

    struct MockBroadcastConfirmer {
        approved: bool,
        calls: std::sync::atomic::AtomicUsize,
    }

    impl MockBroadcastConfirmer {
        fn new(approved: bool) -> Self {
            Self {
                approved,
                calls: std::sync::atomic::AtomicUsize::new(0),
            }
        }

        fn calls(&self) -> usize {
            self.calls.load(std::sync::atomic::Ordering::SeqCst)
        }
    }

    impl BroadcastConfirmer for MockBroadcastConfirmer {
        fn confirm(&self, _summary: &BroadcastSummary) -> Result<bool, String> {
            self.calls.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            Ok(self.approved)
        }
    }

    const TEST_ONLY_SIGNER_PASSPHRASE: &str = "test-only-legacy-signer-passphrase-42";
    const TEST_FINALIZED_RAW_HEX: &str = "02000000000100deadbeef";
    const TEST_BROADCAST_TXID: &str =
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    fn tpub(seed: char) -> String {
        format!("tpub{}", seed.to_string().repeat(107))
    }

    #[test]
    fn parses_public_receive_descriptor() {
        let descriptor = format!("wpkh([a1b2c3d4/84h/1h/0h]{}/0/*)#deadbeef", tpub('A'));
        let key = parse_wpkh_descriptor(&descriptor).expect("descriptor should parse");
        assert_eq!(key.fingerprint, "a1b2c3d4");
        assert_eq!(key.derivation_path, "/84h/1h/0h");
        assert_eq!(key.branch, 0);
    }

    #[test]
    fn rejects_private_and_wrong_branch_descriptors() {
        assert!(parse_wpkh_descriptor("wpkh([a1b2c3d4/84h/1h/0h]tprvSecret/0/*)#x").is_err());
        let descriptor = format!("wpkh([a1b2c3d4/84h/1h/0h]{}/2/*)#deadbeef", tpub('A'));
        assert!(parse_wpkh_descriptor(&descriptor).is_err());
    }

    #[test]
    fn builds_only_sortedmulti_two_of_three() {
        let keys = ['A', 'B', 'C']
            .iter()
            .enumerate()
            .map(|(index, seed)| {
                (
                    format!("K{}", index + 1),
                    format!("wallet-{index}"),
                    DescriptorKey {
                        fingerprint: format!("0000000{}", index + 1),
                        derivation_path: "/84h/1h/0h".into(),
                        tpub: tpub(*seed),
                        branch: 0,
                    },
                )
            })
            .collect::<Vec<_>>();
        let descriptor = build_multisig_descriptor(&keys, 0);
        assert!(descriptor.starts_with("wsh(sortedmulti(2,"));
        assert!(descriptor.ends_with("))"));
        assert_eq!(descriptor.matches("/0/*").count(), 3);
    }

    #[test]
    fn rejects_duplicate_signer_identity() {
        let mut receive = test_key_set(0);
        let mut change = test_key_set(1);
        receive[1].2.fingerprint = receive[0].2.fingerprint.clone();
        change[1].2.fingerprint = change[0].2.fingerprint.clone();
        assert!(validate_key_set(&receive, &change).is_err());

        let mut receive = test_key_set(0);
        let mut change = test_key_set(1);
        receive[2].2.tpub = receive[0].2.tpub.clone();
        change[2].2.tpub = change[0].2.tpub.clone();
        assert!(validate_key_set(&receive, &change).is_err());
    }

    #[test]
    fn rejects_mismatched_receive_and_change_origins() {
        let receive = test_key_set(0);
        let mut change = test_key_set(1);
        change[1].2.derivation_path = "/48h/1h/0h/2h".into();
        assert!(validate_key_set(&receive, &change).is_err());
    }

    #[test]
    fn validates_both_descriptor_import_results() {
        assert!(validate_import_result(&json!([
            { "success": true },
            { "success": true }
        ]))
        .is_ok());
        assert!(validate_import_result(&json!([
            { "success": true },
            { "success": false }
        ]))
        .is_err());
    }

    #[test]
    fn converts_wallet_balances_to_sats() {
        let balances = json!({
            "mine": { "trusted": 0.00005000, "untrusted_pending": 0.00000189 }
        });
        assert_eq!(btc_to_sats(wallet_balance_btc(&balances)), 5_189);
    }

    #[test]
    fn atomic_signer_creation_passes_secret_once_and_returns_locked_public_identity() {
        test_runtime().block_on(async {
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(
                atomic_signer_creation_steps("CoreVault-K1", "a1b2c3d4", 'A'),
            );

            let operation = create_signing_wallet(
                client,
                "K1".into(),
                "CoreVault-K1".into(),
                TEST_ONLY_SIGNER_PASSPHRASE.into(),
            )
            .await
            .expect("atomic signer creation should succeed");

            finish_mock(server, cookie_path);
            let methods = method_log.lock().expect("method log should lock").clone();
            assert_eq!(
                methods,
                vec![
                    "getblockchaininfo",
                    "createwallet",
                    "getwalletinfo",
                    "listdescriptors"
                ]
            );
            assert!(!methods.iter().any(|method| method == "encryptwallet"));
            assert!(!methods.iter().any(|method| method == "walletpassphrase"));
            assert!(operation.data.descriptors);
            assert!(operation.data.private_keys_enabled);
            assert!(operation.data.encrypted);
            assert!(operation.data.locked);
            let identity = operation
                .data
                .public_identity
                .as_ref()
                .expect("public signer identity should be returned");
            assert_eq!(identity.label, "K1");
            assert_eq!(identity.wallet_name, "CoreVault-K1");
            assert_eq!(identity.fingerprint, "a1b2c3d4");
            assert_eq!(identity.derivation_path, "/84h/1h/0h");
            assert!(identity.tpub.starts_with("tpub"));
            let serialized = serde_json::to_string(&operation)
                .expect("creation operation should serialize for leak inspection");
            assert!(!serialized.contains(TEST_ONLY_SIGNER_PASSPHRASE));
            assert!(serialized.contains("[REDACTED]"));
            assert!(!contains_private_material(&serialized));
        });
    }

    #[test]
    fn atomic_signer_createwallet_failure_stops_before_inspection() {
        test_runtime().block_on(async {
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(vec![
                signet_step(),
                atomic_create_error("CoreVault-K1", "wallet creation refused"),
            ]);

            let error = create_signing_wallet(
                client,
                "K1".into(),
                "CoreVault-K1".into(),
                TEST_ONLY_SIGNER_PASSPHRASE.into(),
            )
            .await
            .expect_err("createwallet error must not return a signer");

            finish_mock(server, cookie_path);
            assert!(error.contains("wallet creation refused"));
            assert!(!error.contains("PARTIAL CREATION"));
            assert_eq!(
                method_log
                    .lock()
                    .expect("method log should lock")
                    .as_slice(),
                ["getblockchaininfo", "createwallet"]
            );
        });
    }

    #[test]
    fn atomic_signer_postcondition_failure_reports_partial_creation_without_cleanup() {
        test_runtime().block_on(async {
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(vec![
                signet_step(),
                atomic_create_ok("CoreVault-K1"),
                rpc_ok(
                    "getwalletinfo",
                    json!({
                        "descriptors": true,
                        "private_keys_enabled": true
                    }),
                ),
            ]);

            let error = create_signing_wallet(
                client,
                "K1".into(),
                "CoreVault-K1".into(),
                TEST_ONLY_SIGNER_PASSPHRASE.into(),
            )
            .await
            .expect_err("unencrypted postcondition must stop signer setup");

            finish_mock(server, cookie_path);
            assert!(error.starts_with("PARTIAL CREATION:"));
            assert!(error.contains("CoreVault-K1"));
            assert!(error.contains("The Core wallet was not deleted"));
            let methods = method_log.lock().expect("method log should lock").clone();
            assert_eq!(
                methods,
                vec!["getblockchaininfo", "createwallet", "getwalletinfo"]
            );
            for forbidden in [
                "encryptwallet",
                "listdescriptors",
                "unloadwallet",
                "createwallet-coordinator",
            ] {
                assert!(!methods.iter().any(|method| method == forbidden));
            }
        });
    }

    #[test]
    fn atomic_signer_creation_rejects_private_descriptor_material() {
        test_runtime().block_on(async {
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(vec![
                signet_step(),
                atomic_create_ok("CoreVault-K1"),
                encrypted_wallet_step(),
                rpc_ok(
                    "listdescriptors",
                    json!({
                        "descriptors": [{
                            "desc": "wpkh([a1b2c3d4/84h/1h/0h]tprvTestOnlyPrivateMaterial/0/*)#bad00000",
                            "internal": false
                        }]
                    }),
                ),
            ]);

            let error = create_signing_wallet(
                client,
                "K1".into(),
                "CoreVault-K1".into(),
                TEST_ONLY_SIGNER_PASSPHRASE.into(),
            )
            .await
            .expect_err("private descriptor material must never produce a signer DTO");

            finish_mock(server, cookie_path);
            assert!(error.starts_with("PARTIAL CREATION:"));
            assert!(error.contains("private-key material"));
            assert!(!error.contains("tprvTestOnlyPrivateMaterial"));
            assert!(!method_log
                .lock()
                .expect("method log should lock")
                .iter()
                .any(|method| method == "encryptwallet"));
        });
    }

    #[test]
    fn all_three_legacy_signers_use_atomic_encrypted_creation() {
        test_runtime().block_on(async {
            let mut steps = Vec::new();
            steps.extend(atomic_signer_creation_steps(
                "CoreVault-K1",
                "a1b2c3d1",
                'A',
            ));
            steps.extend(atomic_signer_creation_steps(
                "CoreVault-K2",
                "a1b2c3d2",
                'B',
            ));
            steps.extend(atomic_signer_creation_steps(
                "CoreVault-K3",
                "a1b2c3d3",
                'C',
            ));
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(steps);
            let mut fingerprints = Vec::new();

            for (label, wallet_name) in [
                ("K1", "CoreVault-K1"),
                ("K2", "CoreVault-K2"),
                ("K3", "CoreVault-K3"),
            ] {
                let signer = create_signing_wallet(
                    client.clone(),
                    label.into(),
                    wallet_name.into(),
                    TEST_ONLY_SIGNER_PASSPHRASE.into(),
                )
                .await
                .expect("each signer should use the atomic creation path");
                assert!(signer.data.encrypted && signer.data.locked);
                fingerprints.push(
                    signer
                        .data
                        .public_identity
                        .expect("each signer should expose public identity")
                        .fingerprint,
                );
            }

            finish_mock(server, cookie_path);
            assert_eq!(fingerprints, ["a1b2c3d1", "a1b2c3d2", "a1b2c3d3"]);
            let methods = method_log.lock().expect("method log should lock").clone();
            assert_eq!(
                methods
                    .iter()
                    .filter(|method| *method == "createwallet")
                    .count(),
                3
            );
            assert_eq!(
                methods
                    .iter()
                    .filter(|method| *method == "listdescriptors")
                    .count(),
                3
            );
            assert!(!methods.iter().any(|method| method == "encryptwallet"));
            assert!(!methods.iter().any(|method| method == "walletpassphrase"));
        });
    }

    #[test]
    fn partial_multisig_setup_preserves_prior_signer_and_does_not_roll_back() {
        test_runtime().block_on(async {
            let mut steps = atomic_signer_creation_steps("CoreVault-K1", "a1b2c3d1", 'A');
            steps.extend([
                signet_step(),
                atomic_create_error("CoreVault-K2", "second signer creation refused"),
            ]);
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(steps);

            let first = create_signing_wallet(
                client.clone(),
                "K1".into(),
                "CoreVault-K1".into(),
                TEST_ONLY_SIGNER_PASSPHRASE.into(),
            )
            .await
            .expect("first signer should remain a truthful successful result");
            let second = create_signing_wallet(
                client,
                "K2".into(),
                "CoreVault-K2".into(),
                TEST_ONLY_SIGNER_PASSPHRASE.into(),
            )
            .await
            .expect_err("second signer failure should stop only that creation attempt");

            finish_mock(server, cookie_path);
            assert_eq!(first.data.name, "CoreVault-K1");
            assert!(first.data.encrypted && first.data.locked);
            assert!(second.contains("second signer creation refused"));
            let methods = method_log.lock().expect("method log should lock").clone();
            assert_eq!(
                methods
                    .iter()
                    .filter(|method| *method == "createwallet")
                    .count(),
                2
            );
            assert!(!methods.iter().any(|method| {
                matches!(
                    method.as_str(),
                    "unloadwallet" | "encryptwallet" | "createwallet-coordinator"
                )
            }));
        });
    }

    #[test]
    fn coordinator_creation_rejects_an_unencrypted_signer_before_mutation() {
        test_runtime().block_on(async {
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(vec![
                signet_step(),
                rpc_ok(
                    "getwalletinfo",
                    json!({
                        "descriptors": true,
                        "private_keys_enabled": true
                    }),
                ),
            ]);

            let error = build_multisig_vault(
                client,
                vec![
                    "CoreVault-K1".into(),
                    "CoreVault-K2".into(),
                    "CoreVault-K3".into(),
                ],
                None,
            )
            .await
            .expect_err("coordinator must not be created from an unencrypted signer");

            finish_mock(server, cookie_path);
            assert!(error.contains("The coordinator was not created"));
            assert_eq!(
                method_log
                    .lock()
                    .expect("method log should lock")
                    .as_slice(),
                ["getblockchaininfo", "getwalletinfo"]
            );
        });
    }

    #[test]
    fn sign_success_and_relock_success_preserves_signature_without_stop() {
        test_runtime().block_on(async {
            let state = test_app_state(test_spend_state());
            let (client, server, cookie_path) = mock_rpc_client(successful_signing_steps(Ok(())));

            let operation = sign_spend_draft(
                client,
                &state,
                "legacy-draft".into(),
                "CoreVault-K1".into(),
                "test-only-passphrase".into(),
            )
            .await
            .expect("sign and relock should succeed");

            assert_eq!(operation.data.signed_by, vec!["CoreVault-K1"]);
            assert!(operation.data.relock_required.is_none());
            assert!(ensure_legacy_workflow_can_progress(
                &state.drafts.lock().expect("draft state should lock")["legacy-draft"]
            )
            .is_ok());
            finish_mock(server, cookie_path);
        });
    }

    #[test]
    fn sign_success_and_relock_failure_preserves_signature_and_blocks_progression() {
        test_runtime().block_on(async {
            let state = test_app_state(test_spend_state());
            let (client, server, cookie_path) =
                mock_rpc_client(successful_signing_steps(Err("wallet lock unavailable")));

            let operation = sign_spend_draft(
                client,
                &state,
                "legacy-draft".into(),
                "CoreVault-K1".into(),
                "test-only-passphrase".into(),
            )
            .await
            .expect("relock failure should return preserved workflow state");

            assert_eq!(operation.data.signed_by, vec!["CoreVault-K1"]);
            let stop = operation
                .data
                .relock_required
                .expect("relock failure should create a hard stop");
            assert!(stop.signature_added);
            assert!(stop.signing_error.is_none());
            assert_eq!(stop.wallet_name, "CoreVault-K1");
            assert!(stop.relock_error.contains("wallet lock unavailable"));
            assert_eq!(
                operation
                    .rpc
                    .last()
                    .expect("walletlock trace should exist")
                    .method,
                "walletlock"
            );
            finish_mock(server, cookie_path);

            let next_signer_error = sign_spend_draft(
                unreachable_rpc_client(),
                &state,
                "legacy-draft".into(),
                "CoreVault-K2".into(),
                "another-passphrase".into(),
            )
            .await
            .expect_err("another signer must be blocked before RPC");
            assert!(next_signer_error.starts_with("STOP:"));

            let finalize_error =
                finalize_multisig_spend(unreachable_rpc_client(), &state, "legacy-draft".into())
                    .await
                    .expect_err("finalization must be blocked before RPC");
            assert!(finalize_error.starts_with("STOP:"));

            let preflight_error =
                preflight_multisig_spend(unreachable_rpc_client(), &state, "legacy-draft".into())
                    .await
                    .expect_err("preflight must be blocked before RPC");
            assert!(preflight_error.starts_with("STOP:"));

            let confirmer = MockBroadcastConfirmer::new(true);
            let authorization_error =
                request_multisig_broadcast_authorization_with(&state, "legacy-draft", &confirmer)
                    .expect_err("native authorization must be blocked before opening a dialog");
            assert!(authorization_error.starts_with("STOP:"));
            assert_eq!(confirmer.calls(), 0);

            let broadcast_error = broadcast_multisig_spend(
                unreachable_rpc_client(),
                &state,
                "legacy-draft".into(),
                "not-an-authorization".into(),
            )
            .await
            .expect_err("broadcast must be blocked before RPC");
            assert!(broadcast_error.starts_with("STOP:"));
        });
    }

    #[test]
    fn multisig_finalization_stores_exact_raw_transaction_without_preflight_or_send() {
        test_runtime().block_on(async {
            let state = test_app_state(threshold_spend_state());
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(vec![
                signet_step(),
                coordinator_step(),
                rpc_ok(
                    "finalizepsbt",
                    json!({ "complete": true, "hex": TEST_FINALIZED_RAW_HEX }),
                ),
            ]);

            let operation = finalize_multisig_spend(client, &state, "legacy-draft".into())
                .await
                .expect("fully signed PSBT should finalize locally");

            finish_mock(server, cookie_path);
            assert!(operation.data.finalized);
            assert_eq!(operation.data.state, "finalized");
            assert!(matches!(
                operation.data.mempool_preflight,
                crate::types::MempoolPreflightView::NotRun
            ));
            let draft = state.drafts.lock().expect("draft state should lock");
            assert_eq!(
                draft["legacy-draft"].raw_hex.as_deref(),
                Some(TEST_FINALIZED_RAW_HEX)
            );
            drop(draft);
            assert_eq!(
                method_log
                    .lock()
                    .expect("method log should lock")
                    .as_slice(),
                ["getblockchaininfo", "getwalletinfo", "finalizepsbt"]
            );
        });
    }

    #[test]
    fn incomplete_multisig_finalization_preserves_signed_draft_without_raw_transaction() {
        test_runtime().block_on(async {
            let state = test_app_state(threshold_spend_state());
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(vec![
                signet_step(),
                coordinator_step(),
                rpc_ok("finalizepsbt", json!({ "complete": false })),
            ]);

            let error = finalize_multisig_spend(client, &state, "legacy-draft".into())
                .await
                .expect_err("incomplete finalization must fail closed");

            finish_mock(server, cookie_path);
            assert!(error.contains("did not confirm enough signatures"));
            assert!(
                state.drafts.lock().expect("draft state should lock")["legacy-draft"]
                    .raw_hex
                    .is_none()
            );
            assert_eq!(
                method_log
                    .lock()
                    .expect("method log should lock")
                    .as_slice(),
                ["getblockchaininfo", "getwalletinfo", "finalizepsbt"]
            );
        });
    }

    #[test]
    fn accepted_multisig_preflight_is_bound_to_the_exact_finalized_transaction() {
        test_runtime().block_on(async {
            let state = test_app_state(finalized_spend_state(TEST_FINALIZED_RAW_HEX));
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(vec![
                signet_step(),
                preflight_ok(
                    TEST_FINALIZED_RAW_HEX,
                    json!([{
                        "txid": "b".repeat(64),
                        "wtxid": "c".repeat(64),
                        "allowed": true
                    }]),
                ),
            ]);

            let operation = preflight_multisig_spend(client, &state, "legacy-draft".into())
                .await
                .expect("strict accepted result should make the exact transaction ready");

            finish_mock(server, cookie_path);
            assert_eq!(operation.data.state, "ready-to-broadcast");
            assert!(matches!(
                operation.data.mempool_preflight,
                crate::types::MempoolPreflightView::Accepted
            ));
            assert_eq!(
                method_log
                    .lock()
                    .expect("method log should lock")
                    .as_slice(),
                ["getblockchaininfo", "testmempoolaccept"]
            );
        });
    }

    #[test]
    fn rejected_multisig_preflight_blocks_authorization_and_broadcast() {
        test_runtime().block_on(async {
            let state = test_app_state(finalized_spend_state(TEST_FINALIZED_RAW_HEX));
            let (client, server, cookie_path) = mock_rpc_client(vec![
                signet_step(),
                preflight_ok(
                    TEST_FINALIZED_RAW_HEX,
                    json!([{
                        "txid": "d".repeat(64),
                        "wtxid": "e".repeat(64),
                        "allowed": false,
                        "reject-reason": "min relay fee not met"
                    }]),
                ),
            ]);

            let operation = preflight_multisig_spend(client, &state, "legacy-draft".into())
                .await
                .expect("explicit Core rejection should be represented, not hidden");
            finish_mock(server, cookie_path);
            assert_eq!(operation.data.state, "preflight-rejected");
            assert!(matches!(
                operation.data.mempool_preflight,
                crate::types::MempoolPreflightView::Rejected { .. }
            ));

            let confirmer = MockBroadcastConfirmer::new(true);
            request_multisig_broadcast_authorization_with(&state, "legacy-draft", &confirmer)
                .expect_err("rejected preflight must block authorization");
            assert_eq!(confirmer.calls(), 0);
            let error = broadcast_multisig_spend(
                unreachable_rpc_client(),
                &state,
                "legacy-draft".into(),
                "not-authorized".into(),
            )
            .await
            .expect_err("rejected preflight must block broadcast before RPC");
            assert!(error.contains("ne bi prihvatio ovu transakciju"));
        });
    }

    #[test]
    fn preflight_rpc_failure_becomes_indeterminate_and_blocks_later_stages() {
        test_runtime().block_on(async {
            let state = test_app_state(finalized_spend_state(TEST_FINALIZED_RAW_HEX));
            let (client, server, cookie_path) = mock_rpc_client(vec![
                signet_step(),
                rpc_error("testmempoolaccept", "temporary preflight failure"),
            ]);

            let operation = preflight_multisig_spend(client, &state, "legacy-draft".into())
                .await
                .expect("RPC uncertainty should remain inspectable as indeterminate state");
            finish_mock(server, cookie_path);
            assert_eq!(operation.data.state, "preflight-indeterminate");
            assert!(matches!(
                operation.data.mempool_preflight,
                crate::types::MempoolPreflightView::Indeterminate { .. }
            ));

            let confirmer = MockBroadcastConfirmer::new(true);
            request_multisig_broadcast_authorization_with(&state, "legacy-draft", &confirmer)
                .expect_err("indeterminate preflight must block authorization");
            assert_eq!(confirmer.calls(), 0);
            broadcast_multisig_spend(
                unreachable_rpc_client(),
                &state,
                "legacy-draft".into(),
                "not-authorized".into(),
            )
            .await
            .expect_err("indeterminate preflight must block broadcast before RPC");
        });
    }

    #[test]
    fn native_authorization_is_not_opened_for_missing_rejected_or_indeterminate_preflight() {
        let identity = finalized_transaction_identity(TEST_FINALIZED_RAW_HEX);
        let cases = [
            MempoolPreflight::NotRun,
            MempoolPreflight::Rejected {
                transaction_identity: identity.clone(),
                reason: Some("policy rejection".into()),
            },
            MempoolPreflight::Indeterminate {
                transaction_identity: identity,
                reason: "malformed Core response".into(),
            },
        ];

        for preflight in cases {
            let mut draft = finalized_spend_state(TEST_FINALIZED_RAW_HEX);
            draft.mempool_preflight = preflight;
            let state = test_app_state(draft);
            let confirmer = MockBroadcastConfirmer::new(true);
            request_multisig_broadcast_authorization_with(&state, "legacy-draft", &confirmer)
                .expect_err("non-accepted preflight must block native authorization");
            assert_eq!(confirmer.calls(), 0);
        }
    }

    #[test]
    fn direct_multisig_broadcast_without_preflight_is_blocked_before_rpc() {
        test_runtime().block_on(async {
            let state = test_app_state(finalized_spend_state(TEST_FINALIZED_RAW_HEX));
            let error = broadcast_multisig_spend(
                unreachable_rpc_client(),
                &state,
                "legacy-draft".into(),
                "renderer-cannot-bypass-preflight".into(),
            )
            .await
            .expect_err("finalized transaction without accepted preflight must stop in Rust");
            assert!(error.contains("The mempool check has not run"));
        });
    }

    #[test]
    fn native_authorization_cancel_issues_no_broadcast_capability() {
        test_runtime().block_on(async {
            let state = test_app_state(ready_spend_state(TEST_FINALIZED_RAW_HEX));
            let confirmer = MockBroadcastConfirmer::new(false);
            let grant =
                request_multisig_broadcast_authorization_with(&state, "legacy-draft", &confirmer)
                    .expect("valid ready state should allow a native confirmation request");
            assert!(grant.is_none());
            assert_eq!(confirmer.calls(), 1);
            assert_eq!(
                state.drafts.lock().expect("draft state should lock")["legacy-draft"]
                    .view("legacy-draft".into())
                    .state,
                "ready-to-broadcast"
            );

            let error = broadcast_multisig_spend(
                unreachable_rpc_client(),
                &state,
                "legacy-draft".into(),
                "missing-after-cancel".into(),
            )
            .await
            .expect_err("cancellation must not authorize broadcast");
            assert!(error.contains("broadcast authorization is invalid"));
        });
    }

    #[test]
    fn native_authorization_approve_mints_opaque_capability_without_broadcasting() {
        let state = test_app_state(ready_spend_state(TEST_FINALIZED_RAW_HEX));
        let confirmer = MockBroadcastConfirmer::new(true);

        let grant =
            request_multisig_broadcast_authorization_with(&state, "legacy-draft", &confirmer)
                .expect("ready state should permit confirmation")
                .expect("approval should mint an authorization");

        assert_eq!(confirmer.calls(), 1);
        assert_eq!(grant.authorization_id.len(), 64);
        assert!(!grant.authorization_id.contains("legacy-draft"));
        assert!(state
            .drafts
            .lock()
            .expect("draft state should lock")
            .contains_key("legacy-draft"));
    }

    #[test]
    fn authorization_for_one_draft_cannot_broadcast_another_draft() {
        test_runtime().block_on(async {
            let state = test_app_state(ready_spend_state(TEST_FINALIZED_RAW_HEX));
            state
                .drafts
                .lock()
                .expect("draft state should lock")
                .insert(
                    "legacy-draft-b".into(),
                    ready_spend_state(TEST_FINALIZED_RAW_HEX),
                );
            let grant = authorize_ready_draft(&state);

            let error = broadcast_multisig_spend(
                unreachable_rpc_client(),
                &state,
                "legacy-draft-b".into(),
                grant.authorization_id,
            )
            .await
            .expect_err("draft-bound authorization must fail before RPC for another draft");
            assert!(error.contains("broadcast authorization is invalid"));
        });
    }

    #[test]
    fn authorization_for_one_transaction_cannot_broadcast_replaced_transaction() {
        test_runtime().block_on(async {
            let state = test_app_state(ready_spend_state(TEST_FINALIZED_RAW_HEX));
            let grant = authorize_ready_draft(&state);
            let replacement_raw_hex = "02000000000100feedface";
            {
                let mut drafts = state.drafts.lock().expect("draft state should lock");
                let draft = drafts
                    .get_mut("legacy-draft")
                    .expect("draft should remain available");
                draft.raw_hex = Some(replacement_raw_hex.into());
                draft.mempool_preflight = MempoolPreflight::Accepted {
                    transaction_identity: finalized_transaction_identity(replacement_raw_hex),
                };
            }

            let error = broadcast_multisig_spend(
                unreachable_rpc_client(),
                &state,
                "legacy-draft".into(),
                grant.authorization_id,
            )
            .await
            .expect_err("transaction-bound authorization must fail before RPC after replacement");
            assert!(error.contains("broadcast authorization is invalid"));
        });
    }

    #[test]
    fn authorized_multisig_broadcast_sends_exact_raw_transaction_once() {
        test_runtime().block_on(async {
            let state = test_app_state(ready_spend_state(TEST_FINALIZED_RAW_HEX));
            let grant = authorize_ready_draft(&state);
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(vec![
                signet_step(),
                rpc_ok("getnetworkinfo", json!({ "networkactive": true })),
                send_raw_ok(TEST_FINALIZED_RAW_HEX, TEST_BROADCAST_TXID),
                rpc_ok("getbalances", json!({ "mine": { "trusted": 0.000049 } })),
            ]);

            let operation = broadcast_multisig_spend(
                client,
                &state,
                "legacy-draft".into(),
                grant.authorization_id,
            )
            .await
            .expect("approved current transaction should broadcast once");

            finish_mock(server, cookie_path);
            assert_eq!(operation.data.txid, TEST_BROADCAST_TXID);
            assert!(!state
                .drafts
                .lock()
                .expect("draft state should lock")
                .contains_key("legacy-draft"));
            assert_eq!(
                method_log
                    .lock()
                    .expect("method log should lock")
                    .as_slice(),
                [
                    "getblockchaininfo",
                    "getnetworkinfo",
                    "sendrawtransaction",
                    "getbalances"
                ]
            );
        });
    }

    #[test]
    fn network_stop_consumes_authorization_and_preserves_ready_transaction() {
        test_runtime().block_on(async {
            let state = test_app_state(ready_spend_state(TEST_FINALIZED_RAW_HEX));
            let grant = authorize_ready_draft(&state);
            let authorization_id = grant.authorization_id;
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(vec![
                signet_step(),
                rpc_ok("getnetworkinfo", json!({ "networkactive": false })),
            ]);

            let error = broadcast_multisig_spend(
                client,
                &state,
                "legacy-draft".into(),
                authorization_id.clone(),
            )
            .await
            .expect_err("disabled Core networking must stop broadcast");

            finish_mock(server, cookie_path);
            assert!(error.contains("network activity is disabled"));
            assert_eq!(
                method_log
                    .lock()
                    .expect("method log should lock")
                    .as_slice(),
                ["getblockchaininfo", "getnetworkinfo"]
            );
            {
                let draft = state.drafts.lock().expect("draft state should lock");
                assert_eq!(
                    draft["legacy-draft"].raw_hex.as_deref(),
                    Some(TEST_FINALIZED_RAW_HEX)
                );
                assert!(!draft["legacy-draft"].broadcast_in_progress);
            }

            let replay = broadcast_multisig_spend(
                unreachable_rpc_client(),
                &state,
                "legacy-draft".into(),
                authorization_id,
            )
            .await
            .expect_err("stopped attempt must consume its one-time authorization");
            assert!(replay.contains("broadcast authorization is invalid"));
        });
    }

    #[test]
    fn send_failure_preserves_finalized_state_but_requires_fresh_authorization() {
        test_runtime().block_on(async {
            let state = test_app_state(ready_spend_state(TEST_FINALIZED_RAW_HEX));
            let grant = authorize_ready_draft(&state);
            let authorization_id = grant.authorization_id;
            let (client, server, cookie_path, method_log) = mock_rpc_client_with_log(vec![
                signet_step(),
                rpc_ok("getnetworkinfo", json!({ "networkactive": true })),
                send_raw_error(TEST_FINALIZED_RAW_HEX, "temporary send failure"),
            ]);

            let error = broadcast_multisig_spend(
                client,
                &state,
                "legacy-draft".into(),
                authorization_id.clone(),
            )
            .await
            .expect_err("send failure must be reported");

            finish_mock(server, cookie_path);
            assert!(error.contains("temporary send failure"));
            assert_eq!(
                method_log
                    .lock()
                    .expect("method log should lock")
                    .as_slice(),
                ["getblockchaininfo", "getnetworkinfo", "sendrawtransaction"]
            );
            {
                let draft = state.drafts.lock().expect("draft state should lock");
                assert_eq!(
                    draft["legacy-draft"].raw_hex.as_deref(),
                    Some(TEST_FINALIZED_RAW_HEX)
                );
                assert!(!draft["legacy-draft"].broadcast_in_progress);
            }

            let replay = broadcast_multisig_spend(
                unreachable_rpc_client(),
                &state,
                "legacy-draft".into(),
                authorization_id,
            )
            .await
            .expect_err("failed send must not make authorization reusable");
            assert!(replay.contains("broadcast authorization is invalid"));
        });
    }

    #[test]
    fn expired_multisig_authorization_fails_before_rpc() {
        test_runtime().block_on(async {
            let state = test_app_state(ready_spend_state(TEST_FINALIZED_RAW_HEX));
            let identity = finalized_transaction_identity(TEST_FINALIZED_RAW_HEX);
            let grant = state
                .broadcast_authorizations
                .lock()
                .expect("authorization store should lock")
                .issue_expired_for_test("legacy-draft".into(), identity, 2);

            let error = broadcast_multisig_spend(
                unreachable_rpc_client(),
                &state,
                "legacy-draft".into(),
                grant.authorization_id,
            )
            .await
            .expect_err("expired authorization must stop before RPC");
            assert!(error.contains("broadcast authorization is invalid"));
        });
    }

    #[test]
    fn sign_failure_and_relock_success_returns_normal_error_without_stop() {
        test_runtime().block_on(async {
            let state = test_app_state(test_spend_state());
            let (client, server, cookie_path) = mock_rpc_client(failed_signing_steps(Ok(())));

            let error = sign_spend_draft(
                client,
                &state,
                "legacy-draft".into(),
                "CoreVault-K1".into(),
                "test-only-passphrase".into(),
            )
            .await
            .expect_err("signing error should be returned normally");

            assert!(error.contains("signing refused"));
            let draft = state.drafts.lock().expect("draft state should lock");
            assert!(draft["legacy-draft"].signed_by.is_empty());
            assert!(draft["legacy-draft"].relock_required.is_none());
            assert!(ensure_legacy_workflow_can_progress(&draft["legacy-draft"]).is_ok());
            drop(draft);
            finish_mock(server, cookie_path);
        });
    }

    #[test]
    fn sign_failure_and_relock_failure_records_both_facts_and_stops() {
        test_runtime().block_on(async {
            let state = test_app_state(test_spend_state());
            let (client, server, cookie_path) =
                mock_rpc_client(failed_signing_steps(Err("wallet lock unavailable")));

            let operation = sign_spend_draft(
                client,
                &state,
                "legacy-draft".into(),
                "CoreVault-K1".into(),
                "test-only-passphrase".into(),
            )
            .await
            .expect("combined failure should return its hard-stop state");

            assert!(operation.data.signed_by.is_empty());
            let stop = operation
                .data
                .relock_required
                .expect("combined failure should create a hard stop");
            assert!(!stop.signature_added);
            assert!(stop
                .signing_error
                .as_deref()
                .is_some_and(|error| error.contains("signing refused")));
            assert!(stop.relock_error.contains("wallet lock unavailable"));
            assert!(ensure_legacy_workflow_can_progress(
                &state.drafts.lock().expect("draft state should lock")["legacy-draft"]
            )
            .is_err());
            finish_mock(server, cookie_path);
        });
    }

    #[test]
    fn unlock_failure_does_not_sign_relock_or_create_a_false_stop() {
        test_runtime().block_on(async {
            let state = test_app_state(test_spend_state());
            let (client, server, cookie_path) = mock_rpc_client(vec![
                signet_step(),
                encrypted_wallet_step(),
                rpc_error("walletpassphrase", "incorrect passphrase"),
            ]);

            let error = sign_spend_draft(
                client,
                &state,
                "legacy-draft".into(),
                "CoreVault-K1".into(),
                "wrong-passphrase".into(),
            )
            .await
            .expect_err("unlock failure should stop before signing");

            assert!(error.contains("incorrect passphrase"));
            let draft = state.drafts.lock().expect("draft state should lock");
            assert!(draft["legacy-draft"].signed_by.is_empty());
            assert!(draft["legacy-draft"].relock_required.is_none());
            drop(draft);
            finish_mock(server, cookie_path);
        });
    }

    #[test]
    fn retry_lock_success_clears_only_stop_and_preserves_signature() {
        test_runtime().block_on(async {
            let state = test_app_state(stopped_spend_state(true));
            let (client, server, cookie_path) =
                mock_rpc_client(vec![rpc_ok("walletlock", Value::Null)]);

            let operation = retry_signer_lock(client, &state, "legacy-draft".into())
                .await
                .expect("retry lock should return updated state");

            assert!(operation.data.relock_required.is_none());
            assert_eq!(operation.data.signed_by, vec!["CoreVault-K1"]);
            assert_eq!(operation.rpc.len(), 1);
            assert_eq!(operation.rpc[0].method, "walletlock");
            assert_eq!(operation.rpc[0].wallet.as_deref(), Some("CoreVault-K1"));
            assert!(ensure_legacy_workflow_can_progress(
                &state.drafts.lock().expect("draft state should lock")["legacy-draft"]
            )
            .is_ok());
            finish_mock(server, cookie_path);
        });
    }

    #[test]
    fn retry_lock_failure_keeps_stop_and_preserves_signature() {
        test_runtime().block_on(async {
            let state = test_app_state(stopped_spend_state(true));
            let (client, server, cookie_path) =
                mock_rpc_client(vec![rpc_error("walletlock", "wallet still cannot lock")]);

            let operation = retry_signer_lock(client, &state, "legacy-draft".into())
                .await
                .expect("retry failure should return the retained hard-stop state");

            assert_eq!(operation.data.signed_by, vec!["CoreVault-K1"]);
            let stop = operation
                .data
                .relock_required
                .expect("stop must remain after failed retry");
            assert!(stop.relock_error.contains("wallet still cannot lock"));
            assert!(ensure_legacy_workflow_can_progress(
                &state.drafts.lock().expect("draft state should lock")["legacy-draft"]
            )
            .is_err());
            finish_mock(server, cookie_path);
        });
    }

    fn atomic_signer_creation_steps(
        wallet_name: &'static str,
        fingerprint: &'static str,
        seed: char,
    ) -> Vec<MockRpcStep> {
        vec![
            signet_step(),
            atomic_create_ok(wallet_name),
            encrypted_wallet_step(),
            rpc_ok(
                "listdescriptors",
                public_signer_descriptors(fingerprint, seed),
            ),
        ]
    }

    fn public_signer_descriptors(fingerprint: &str, seed: char) -> Value {
        let public_key = tpub(seed);
        json!({
            "descriptors": [
                {
                    "desc": format!(
                        "wpkh([{fingerprint}/84h/1h/0h]{public_key}/0/*)#receive1"
                    ),
                    "internal": false
                },
                {
                    "desc": format!(
                        "wpkh([{fingerprint}/84h/1h/0h]{public_key}/1/*)#change01"
                    ),
                    "internal": true
                }
            ]
        })
    }

    fn successful_signing_steps(relock: Result<(), &'static str>) -> Vec<MockRpcStep> {
        let mut steps = vec![
            signet_step(),
            encrypted_wallet_step(),
            rpc_ok("walletpassphrase", Value::Null),
            rpc_ok(
                "walletprocesspsbt",
                json!({ "psbt": "signed-test-psbt", "complete": false }),
            ),
        ];
        steps.push(match relock {
            Ok(()) => rpc_ok("walletlock", Value::Null),
            Err(error) => rpc_error("walletlock", error),
        });
        steps
    }

    fn failed_signing_steps(relock: Result<(), &'static str>) -> Vec<MockRpcStep> {
        let mut steps = vec![
            signet_step(),
            encrypted_wallet_step(),
            rpc_ok("walletpassphrase", Value::Null),
            rpc_error("walletprocesspsbt", "signing refused"),
        ];
        steps.push(match relock {
            Ok(()) => rpc_ok("walletlock", Value::Null),
            Err(error) => rpc_error("walletlock", error),
        });
        steps
    }

    fn signet_step() -> MockRpcStep {
        rpc_ok("getblockchaininfo", json!({ "chain": "signet" }))
    }

    fn encrypted_wallet_step() -> MockRpcStep {
        rpc_ok(
            "getwalletinfo",
            json!({
                "descriptors": true,
                "private_keys_enabled": true,
                "unlocked_until": 0
            }),
        )
    }

    fn coordinator_step() -> MockRpcStep {
        rpc_ok(
            "getwalletinfo",
            json!({
                "descriptors": true,
                "private_keys_enabled": false
            }),
        )
    }

    fn rpc_ok(method: &'static str, result: Value) -> MockRpcStep {
        MockRpcStep {
            method,
            response: Ok(result),
            atomic_signer_wallet: None,
            expected_raw_hex: None,
        }
    }

    fn rpc_error(method: &'static str, message: &'static str) -> MockRpcStep {
        MockRpcStep {
            method,
            response: Err(message),
            atomic_signer_wallet: None,
            expected_raw_hex: None,
        }
    }

    fn send_raw_ok(raw_hex: &'static str, txid: &'static str) -> MockRpcStep {
        MockRpcStep {
            method: "sendrawtransaction",
            response: Ok(json!(txid)),
            atomic_signer_wallet: None,
            expected_raw_hex: Some(raw_hex),
        }
    }

    fn send_raw_error(raw_hex: &'static str, message: &'static str) -> MockRpcStep {
        MockRpcStep {
            method: "sendrawtransaction",
            response: Err(message),
            atomic_signer_wallet: None,
            expected_raw_hex: Some(raw_hex),
        }
    }

    fn preflight_ok(raw_hex: &'static str, result: Value) -> MockRpcStep {
        MockRpcStep {
            method: "testmempoolaccept",
            response: Ok(result),
            atomic_signer_wallet: None,
            expected_raw_hex: Some(raw_hex),
        }
    }

    fn atomic_create_ok(wallet_name: &'static str) -> MockRpcStep {
        MockRpcStep {
            method: "createwallet",
            response: Ok(json!({ "name": wallet_name, "warnings": [] })),
            atomic_signer_wallet: Some(wallet_name),
            expected_raw_hex: None,
        }
    }

    fn atomic_create_error(wallet_name: &'static str, message: &'static str) -> MockRpcStep {
        MockRpcStep {
            method: "createwallet",
            response: Err(message),
            atomic_signer_wallet: Some(wallet_name),
            expected_raw_hex: None,
        }
    }

    fn test_spend_state() -> SpendState {
        SpendState {
            coordinator_name: "CoreVault-2of3".into(),
            network: "signet".into(),
            destination: "tb1qtestdestination".into(),
            amount_sats: 5_000,
            starting_balance_sats: 10_000,
            fee_btc: 0.000001,
            psbt: "unsigned-test-psbt".into(),
            signed_by: Vec::new(),
            complete: false,
            relock_required: None,
            raw_hex: None,
            mempool_preflight: MempoolPreflight::NotRun,
            preflight_version: 0,
            broadcast_in_progress: false,
        }
    }

    fn stopped_spend_state(signature_added: bool) -> SpendState {
        let mut draft = test_spend_state();
        if signature_added {
            draft.psbt = "signed-test-psbt".into();
            draft.signed_by.push("CoreVault-K1".into());
        }
        draft.relock_required = Some(SignerRelockRequired {
            wallet_name: "CoreVault-K1".into(),
            signature_added,
            signing_error: None,
            relock_error: "initial lock failure".into(),
        });
        draft
    }

    fn threshold_spend_state() -> SpendState {
        let mut draft = test_spend_state();
        draft.psbt = "fully-signed-test-psbt".into();
        draft.signed_by = vec!["CoreVault-K1".into(), "CoreVault-K2".into()];
        draft.complete = true;
        draft
    }

    fn finalized_spend_state(raw_hex: &'static str) -> SpendState {
        let mut draft = threshold_spend_state();
        draft.raw_hex = Some(raw_hex.into());
        draft.preflight_version = 1;
        draft
    }

    fn ready_spend_state(raw_hex: &'static str) -> SpendState {
        let mut draft = finalized_spend_state(raw_hex);
        draft.mempool_preflight = MempoolPreflight::Accepted {
            transaction_identity: finalized_transaction_identity(raw_hex),
        };
        draft.preflight_version = 2;
        draft
    }

    fn authorize_ready_draft(state: &AppState) -> BroadcastAuthorizationGrant {
        request_multisig_broadcast_authorization_with(
            state,
            "legacy-draft",
            &MockBroadcastConfirmer::new(true),
        )
        .expect("authorization request should be valid")
        .expect("approved confirmation should issue a grant")
    }

    fn test_app_state(draft: SpendState) -> AppState {
        let state = AppState::default();
        state
            .drafts
            .lock()
            .expect("draft state should lock")
            .insert("legacy-draft".into(), draft);
        state
    }

    fn unreachable_rpc_client() -> RpcClient {
        RpcClient::new(ConnectionSettings {
            host: "127.0.0.1".into(),
            port: 1,
            cookie_path: std::env::temp_dir()
                .join("core-vault-unreachable-legacy-test.cookie")
                .to_string_lossy()
                .into_owned(),
        })
        .expect("unreachable client settings should be valid")
    }

    fn test_runtime() -> tokio::runtime::Runtime {
        tokio::runtime::Builder::new_multi_thread()
            .worker_threads(2)
            .enable_all()
            .build()
            .expect("build async test runtime")
    }

    fn mock_rpc_client(steps: Vec<MockRpcStep>) -> (RpcClient, thread::JoinHandle<()>, PathBuf) {
        let (client, server, cookie_path, _) = mock_rpc_client_with_log(steps);
        (client, server, cookie_path)
    }

    fn mock_rpc_client_with_log(
        steps: Vec<MockRpcStep>,
    ) -> (
        RpcClient,
        thread::JoinHandle<()>,
        PathBuf,
        Arc<Mutex<Vec<String>>>,
    ) {
        let listener = TcpListener::bind("127.0.0.1:0").expect("bind loopback mock RPC");
        let port = listener.local_addr().expect("mock address").port();
        let cookie_path = std::env::temp_dir().join(format!(
            "core-vault-legacy-relock-test-{}-{port}.cookie",
            std::process::id()
        ));
        fs::write(&cookie_path, "user:pass\n").expect("write mock cookie");
        let method_log = Arc::new(Mutex::new(Vec::new()));
        let server_method_log = Arc::clone(&method_log);

        let server = thread::spawn(move || {
            for step in steps {
                let (mut stream, _) = listener.accept().expect("accept mock RPC request");
                let mut reader = BufReader::new(stream.try_clone().expect("clone mock stream"));
                let mut content_length = 0usize;
                loop {
                    let mut line = String::new();
                    reader.read_line(&mut line).expect("read request header");
                    if line == "\r\n" || line.is_empty() {
                        break;
                    }
                    let lower = line.to_ascii_lowercase();
                    if let Some(value) = lower.strip_prefix("content-length:") {
                        content_length = value.trim().parse().expect("parse content length");
                    }
                }
                let mut body = vec![0u8; content_length];
                reader.read_exact(&mut body).expect("read request body");
                let request: Value = serde_json::from_slice(&body).expect("parse RPC request");
                assert_eq!(
                    request.get("method").and_then(Value::as_str),
                    Some(step.method),
                    "unexpected RPC sequence"
                );
                server_method_log
                    .lock()
                    .expect("method log should lock")
                    .push(step.method.into());
                if let Some(wallet_name) = step.atomic_signer_wallet {
                    assert_atomic_signer_create_request(&request, wallet_name);
                }
                if let Some(expected_raw_hex) = step.expected_raw_hex {
                    let actual_raw_hex = if step.method == "testmempoolaccept" {
                        request.pointer("/params/rawtxs/0").and_then(Value::as_str)
                    } else {
                        request.pointer("/params/hexstring").and_then(Value::as_str)
                    };
                    assert_eq!(
                        actual_raw_hex,
                        Some(expected_raw_hex),
                        "privileged RPC must receive the exact finalized transaction"
                    );
                }

                let (result, error) = match step.response {
                    Ok(result) => (result, Value::Null),
                    Err(message) => (Value::Null, json!({ "code": -1, "message": message })),
                };
                let response_body =
                    json!({ "result": result, "error": error, "id": "core-vault-ui" }).to_string();
                write!(
                    stream,
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    response_body.len(),
                    response_body
                )
                .expect("write mock RPC response");
            }
        });

        let client = RpcClient::new(ConnectionSettings {
            host: "127.0.0.1".into(),
            port,
            cookie_path: cookie_path.to_string_lossy().into_owned(),
        })
        .expect("loopback client settings should be valid");
        (client, server, cookie_path, method_log)
    }

    fn assert_atomic_signer_create_request(request: &Value, expected_wallet_name: &str) {
        let params = request
            .get("params")
            .and_then(Value::as_object)
            .expect("createwallet params should be an object");
        assert_eq!(
            params.get("wallet_name").and_then(Value::as_str),
            Some(expected_wallet_name)
        );
        assert_eq!(
            params
                .get("passphrase")
                .and_then(Value::as_str)
                .map(|value| !value.is_empty()),
            Some(true),
            "atomic signer createwallet must receive a non-empty test passphrase"
        );
        assert_eq!(
            params.get("disable_private_keys").and_then(Value::as_bool),
            Some(false)
        );
        assert_eq!(params.get("blank").and_then(Value::as_bool), Some(false));
        assert_eq!(
            params.get("descriptors").and_then(Value::as_bool),
            Some(true)
        );
        assert_eq!(
            params.get("external_signer").and_then(Value::as_bool),
            Some(false)
        );
    }

    fn finish_mock(server: thread::JoinHandle<()>, cookie_path: PathBuf) {
        server.join().expect("mock RPC server should finish");
        let _ = fs::remove_file(cookie_path);
    }

    fn test_key_set(branch: u8) -> Vec<(String, String, DescriptorKey)> {
        ['A', 'B', 'C']
            .iter()
            .enumerate()
            .map(|(index, seed)| {
                (
                    format!("K{}", index + 1),
                    format!("wallet-{index}"),
                    DescriptorKey {
                        fingerprint: format!("0000000{}", index + 1),
                        derivation_path: "/84h/1h/0h".into(),
                        tpub: tpub(*seed),
                        branch,
                    },
                )
            })
            .collect()
    }
}
