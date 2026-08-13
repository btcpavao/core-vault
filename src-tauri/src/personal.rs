#[cfg(test)]
use crate::broadcast_authorization::BroadcastConfirmer;
use crate::{
    broadcast_authorization::{BroadcastAuthorizationGrant, BroadcastPurpose, BroadcastSummary},
    file_capabilities::{consume_file_capability, FileOperation},
    rpc::{ensure_test_chain, sanitize_rpc_text, RpcClient},
    security::validate_wallet_name,
    types::{
        finalized_transaction_identity, ActivityItem, AppState, BackupReceipt, MempoolPreflight,
        Operation, PersonalBroadcast, PersonalReceive, PersonalSpendState, PersonalSpendView,
        PersonalVault, PersonalVaultSnapshot, RestoreReceipt, RpcTrace, SpendOutputView,
        VaultListItem,
    },
};
use serde::Deserialize;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File},
    io::Read,
    path::Path,
    sync::atomic::{AtomicU64, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};
use zeroize::Zeroizing;

static PERSONAL_DRAFT_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Deserialize)]
struct TestMempoolAcceptResult {
    txid: String,
    wtxid: String,
    #[serde(rename = "package-error")]
    package_error: Option<String>,
    allowed: Option<bool>,
    #[serde(rename = "reject-reason")]
    reject_reason: Option<String>,
}

pub async fn list_vaults(
    client: RpcClient,
    state: &AppState,
) -> Result<Operation<Vec<VaultListItem>>, String> {
    let mut traces = Vec::new();
    let wallet_dir = client
        .call(
            "listwalletdir",
            json!({}),
            None,
            "Čita wallete iz lokalnog Bitcoin Core wallet direktorija.",
            None,
            false,
            &mut traces,
        )
        .await?;
    let loaded = client
        .call(
            "listwallets",
            json!({}),
            None,
            "Čita trenutno učitane Core wallete.",
            None,
            false,
            &mut traces,
        )
        .await?
        .as_array()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|value| value.as_str().map(str::to_string))
        .collect::<Vec<_>>();
    let backed_up = state
        .backed_up_wallets
        .lock()
        .map_err(|_| "Backup status nije dostupan.".to_string())?
        .clone();
    let names = wallet_dir
        .get("wallets")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|value| {
            value
                .get("name")
                .and_then(Value::as_str)
                .map(str::to_string)
        })
        .collect::<Vec<_>>();
    let mut items = Vec::new();
    for name in names {
        if !loaded.iter().any(|loaded_name| loaded_name == &name) {
            items.push(VaultListItem {
                wallet_name: name.clone(),
                display_name: name,
                role: "unloaded".into(),
                vault_type: "Core wallet".into(),
                loaded: false,
                descriptors: None,
                private_keys_enabled: None,
                locked: None,
                balance_sats: None,
                balance_btc: None,
            });
            continue;
        }
        validate_wallet_name(&name)?;
        let info = client
            .call(
                "getwalletinfo",
                json!({}),
                Some(&name),
                "Provjerava tip, zaključavanje i ulogu Core walleta.",
                None,
                false,
                &mut traces,
            )
            .await?;
        let balances = client
            .call(
                "getbalances",
                json!({}),
                Some(&name),
                "Čita stanje isključivo iz lokalnog Corea.",
                None,
                false,
                &mut traces,
            )
            .await?;
        let private_keys = info
            .get("private_keys_enabled")
            .and_then(Value::as_bool)
            .unwrap_or(false);
        let encrypted = info.get("unlocked_until").is_some();
        let locked = encrypted
            && info
                .get("unlocked_until")
                .and_then(Value::as_i64)
                .unwrap_or(0)
                == 0;
        let balance_btc = wallet_balance_btc(&balances);
        let coordinator = !private_keys;
        items.push(VaultListItem {
            wallet_name: name.clone(),
            display_name: name.clone(),
            role: if coordinator {
                "coordinator"
            } else {
                "personal"
            }
            .into(),
            vault_type: if coordinator {
                if name.to_ascii_lowercase().contains("2of3") {
                    "2 of 3"
                } else {
                    "Watch-only"
                }
            } else {
                "Personal"
            }
            .into(),
            loaded: true,
            descriptors: info.get("descriptors").and_then(Value::as_bool),
            private_keys_enabled: Some(private_keys),
            locked: Some(locked),
            balance_sats: Some(btc_to_sats(balance_btc)),
            balance_btc: Some(balance_btc),
        });
    }
    items.sort_by(|left, right| left.wallet_name.cmp(&right.wallet_name));
    for item in &mut items {
        if item.role == "personal" && !backed_up.contains_key(&item.wallet_name) {
            item.vault_type = format!("{} · Backup required", item.vault_type);
        }
    }
    Ok(Operation {
        data: items,
        rpc: traces,
    })
}

pub async fn create_personal_vault(
    client: RpcClient,
    state: &AppState,
    wallet_name: String,
    display_name: String,
    passphrase: String,
) -> Result<Operation<PersonalVault>, String> {
    validate_wallet_name(&wallet_name)?;
    validate_display_name(&display_name)?;
    validate_passphrase(&passphrase)?;
    let passphrase = Zeroizing::new(passphrase);
    let mut traces = Vec::new();
    let network = ensure_test_chain(&client, &mut traces).await?;
    client
        .call(
            "createwallet",
            json!({
                "wallet_name": wallet_name,
                "disable_private_keys": false,
                "blank": false,
                "passphrase": passphrase.as_str(),
                "avoid_reuse": true,
                "descriptors": true,
                "load_on_startup": true,
                "external_signer": false
            }),
            None,
            "Bitcoin Core stvara i odmah šifrira descriptor wallet.",
            Some(json!({
                "wallet_name": wallet_name,
                "disable_private_keys": false,
                "blank": false,
                "passphrase": "[REDACTED]",
                "avoid_reuse": true,
                "descriptors": true,
                "load_on_startup": true
            })),
            false,
            &mut traces,
        )
        .await?;
    let vault = inspect_personal_wallet(
        &client,
        state,
        &wallet_name,
        &display_name,
        &network,
        &mut traces,
    )
    .await?;
    if !vault.encrypted || !vault.locked {
        return Err(
            "STOP: Bitcoin Core nije potvrdio šifrirani i zaključani Personal Vault.".into(),
        );
    }
    Ok(Operation {
        data: vault,
        rpc: traces,
    })
}

pub async fn get_personal_vault(
    client: RpcClient,
    state: &AppState,
    wallet_name: String,
) -> Result<Operation<PersonalVaultSnapshot>, String> {
    validate_wallet_name(&wallet_name)?;
    let mut traces = Vec::new();
    let network = current_chain(&client, &mut traces).await?;
    let vault = inspect_personal_wallet(
        &client,
        state,
        &wallet_name,
        &wallet_name,
        &network,
        &mut traces,
    )
    .await?;
    let transactions = client
        .call(
            "listtransactions",
            json!({ "label": "*", "count": 12, "skip": 0, "include_watchonly": true }),
            Some(&wallet_name),
            "Čita posljednje aktivnosti iz lokalnog Core walleta.",
            None,
            false,
            &mut traces,
        )
        .await?;
    let activity = parse_activity(&transactions);
    Ok(Operation {
        data: PersonalVaultSnapshot { vault, activity },
        rpc: traces,
    })
}

pub async fn backup_personal_vault(
    client: RpcClient,
    state: &AppState,
    wallet_name: String,
    capability_id: String,
) -> Result<Operation<BackupReceipt>, String> {
    validate_wallet_name(&wallet_name)?;
    let destination = consume_file_capability(
        state,
        &capability_id,
        FileOperation::PersonalBackupDestination,
    )?;
    let destination_display = destination.to_string_lossy().into_owned();
    let mut traces = Vec::new();
    ensure_test_chain(&client, &mut traces).await?;
    client
        .call(
            "backupwallet",
            json!({ "destination": destination_display }),
            Some(&wallet_name),
            "Bitcoin Core izrađuje stvarni wallet backup na odabranoj lokalnoj lokaciji.",
            None,
            false,
            &mut traces,
        )
        .await?;
    let metadata = fs::metadata(&destination).map_err(|_| {
        "Bitcoin Core je odgovorio, ali backup datoteka nije pronađena.".to_string()
    })?;
    if !metadata.is_file() || metadata.len() == 0 {
        return Err("STOP: backup nije neprazna lokalna datoteka.".into());
    }
    let receipt = BackupReceipt {
        wallet_name: wallet_name.clone(),
        path: destination_display,
        created_at_unix: now_unix(),
        size_bytes: metadata.len(),
        sha256: sha256_file(&destination)?,
    };
    state
        .backed_up_wallets
        .lock()
        .map_err(|_| "Backup status nije dostupan.".to_string())?
        .insert(wallet_name, receipt.clone());
    Ok(Operation {
        data: receipt,
        rpc: traces,
    })
}

pub async fn restore_personal_vault(
    client: RpcClient,
    state: &AppState,
    original_wallet_name: String,
    restored_wallet_name: String,
    capability_id: String,
) -> Result<Operation<RestoreReceipt>, String> {
    validate_wallet_name(&original_wallet_name)?;
    validate_wallet_name(&restored_wallet_name)?;
    if original_wallet_name == restored_wallet_name {
        return Err("Testni restore mora koristiti novo, jedinstveno wallet ime.".into());
    }
    let backup_file =
        consume_file_capability(state, &capability_id, FileOperation::PersonalRestoreSource)?;
    let backup_file = backup_file.to_string_lossy().into_owned();
    let mut traces = Vec::new();
    ensure_test_chain(&client, &mut traces).await?;
    let original_fingerprint =
        public_wallet_fingerprint(&client, &original_wallet_name, &mut traces).await?;
    let restored = client
        .call(
            "restorewallet",
            json!({
                "wallet_name": restored_wallet_name,
                "backup_file": backup_file,
                "load_on_startup": false
            }),
            None,
            "Bitcoin Core vraća testnu kopiju iz odabranog wallet backupa.",
            None,
            false,
            &mut traces,
        )
        .await?;
    let restored_fingerprint =
        public_wallet_fingerprint(&client, &restored_wallet_name, &mut traces).await?;
    let warnings = restored
        .get("warnings")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|value| value.as_str().map(str::to_string))
        .collect::<Vec<_>>();
    Ok(Operation {
        data: RestoreReceipt {
            original_wallet_name,
            restored_wallet_name,
            public_fingerprint: restored_fingerprint.clone(),
            fingerprints_match: original_fingerprint == restored_fingerprint,
            warnings,
        },
        rpc: traces,
    })
}

pub async fn unload_wallet(
    client: RpcClient,
    wallet_name: String,
) -> Result<Operation<bool>, String> {
    validate_wallet_name(&wallet_name)?;
    let mut traces = Vec::new();
    client
        .call(
            "unloadwallet",
            json!({ "wallet_name": wallet_name, "load_on_startup": false }),
            None,
            "Bitcoin Core zatvara testno vraćeni wallet bez brisanja njegove datoteke.",
            None,
            false,
            &mut traces,
        )
        .await?;
    Ok(Operation {
        data: true,
        rpc: traces,
    })
}

pub async fn create_receive_address(
    client: RpcClient,
    wallet_name: String,
    label: String,
) -> Result<Operation<PersonalReceive>, String> {
    validate_wallet_name(&wallet_name)?;
    if label.chars().any(char::is_control) || label.chars().count() > 80 {
        return Err("Label adrese nije valjan.".into());
    }
    let mut traces = Vec::new();
    let network = ensure_test_chain(&client, &mut traces).await?;
    let address = client
        .call(
            "getnewaddress",
            json!({ "label": label, "address_type": "bech32m" }),
            Some(&wallet_name),
            "Bitcoin Core generira novu Taproot receiving adresu.",
            None,
            false,
            &mut traces,
        )
        .await?
        .as_str()
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Bitcoin Core nije vratio receiving adresu.".to_string())?
        .to_string();
    let info = client
        .call(
            "getaddressinfo",
            json!({ "address": address }),
            Some(&wallet_name),
            "Potvrđuje da nova adresa pripada ovom Core walletu.",
            None,
            false,
            &mut traces,
        )
        .await?;
    let wallet_owned = info.get("ismine").and_then(Value::as_bool) == Some(true);
    if !wallet_owned {
        return Err("STOP: Bitcoin Core nije potvrdio da receiving adresa pripada walletu.".into());
    }
    Ok(Operation {
        data: PersonalReceive {
            wallet_name,
            address,
            label,
            network,
            address_type: "bech32m".into(),
            wallet_owned,
        },
        rpc: traces,
    })
}

pub async fn change_passphrase(
    client: RpcClient,
    wallet_name: String,
    old_passphrase: String,
    new_passphrase: String,
) -> Result<Operation<bool>, String> {
    validate_wallet_name(&wallet_name)?;
    validate_passphrase(&new_passphrase)?;
    if old_passphrase.is_empty() {
        return Err("Unesite postojeću wallet passphrase.".into());
    }
    let old_passphrase = Zeroizing::new(old_passphrase);
    let new_passphrase = Zeroizing::new(new_passphrase);
    let mut traces = Vec::new();
    ensure_test_chain(&client, &mut traces).await?;
    client
        .call(
            "walletpassphrasechange",
            json!({ "oldpassphrase": old_passphrase.as_str(), "newpassphrase": new_passphrase.as_str() }),
            Some(&wallet_name),
            "Bitcoin Core mijenja passphrase ovog walleta.",
            Some(json!({ "oldpassphrase": "[REDACTED]", "newpassphrase": "[REDACTED]" })),
            false,
            &mut traces,
        )
        .await?;
    Ok(Operation {
        data: true,
        rpc: traces,
    })
}

pub async fn create_spend_proposal(
    client: RpcClient,
    state: &AppState,
    wallet_name: String,
    destination: String,
    amount_sats: u64,
    fee_rate_sat_vb: f64,
) -> Result<Operation<PersonalSpendView>, String> {
    validate_wallet_name(&wallet_name)?;
    validate_amount_and_fee(amount_sats, fee_rate_sat_vb)?;
    let mut traces = Vec::new();
    let network = ensure_test_chain(&client, &mut traces).await?;
    let validated = client
        .call(
            "validateaddress",
            json!({ "address": destination }),
            None,
            "Bitcoin Core provjerava punu destination adresu i mrežu.",
            None,
            false,
            &mut traces,
        )
        .await?;
    if validated.get("isvalid").and_then(Value::as_bool) != Some(true) {
        return Err("Destination nije valjana adresa za povezani Bitcoin Core.".into());
    }
    let mut output = Map::new();
    let amount_btc = amount_sats as f64 / 100_000_000.0;
    output.insert(
        destination.clone(),
        Value::Number(
            serde_json::Number::from_f64(amount_btc)
                .ok_or_else(|| "Iznos nije moguće pretvoriti u BTC.".to_string())?,
        ),
    );
    let funded = client
        .call(
            "walletcreatefundedpsbt",
            json!({
                "inputs": [],
                "outputs": [Value::Object(output)],
                "locktime": 0,
                "options": {
                    "add_inputs": true,
                    "include_unsafe": false,
                    "fee_rate": fee_rate_sat_vb,
                    "replaceable": true,
                    "change_type": "bech32m"
                },
                "bip32derivs": true,
                "version": 2
            }),
            Some(&wallet_name),
            "Bitcoin Core odabire sredstva, fee i change te izrađuje PSBT bez potpisa.",
            None,
            true,
            &mut traces,
        )
        .await?;
    let psbt = funded
        .get("psbt")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Bitcoin Core nije vratio funded PSBT.".to_string())?
        .to_string();
    let fee_sats = btc_to_sats(funded.get("fee").and_then(Value::as_f64).unwrap_or(0.0));
    let change_position = funded
        .get("changepos")
        .and_then(Value::as_i64)
        .unwrap_or(-1);
    let decoded = client
        .call(
            "decodepsbt",
            json!({ "psbt": psbt }),
            None,
            "Dekodira PSBT kako bi review prikazao svaki output i change.",
            Some(json!({ "psbt": "[REDACTED]" })),
            true,
            &mut traces,
        )
        .await?;
    let outputs = parse_outputs(&decoded, change_position);
    if outputs.is_empty() {
        return Err("Bitcoin Core nije vratio pregledive PSBT outpute.".into());
    }
    let draft_id = next_draft_id();
    let spend = PersonalSpendState {
        wallet_name,
        network,
        destination,
        amount_sats,
        fee_sats,
        fee_rate_sat_vb,
        outputs,
        replaceable: true,
        psbt,
        complete: false,
        raw_hex: None,
        mempool_preflight: MempoolPreflight::NotRun,
        preflight_version: 0,
        broadcast_in_progress: false,
    };
    let view = spend.view(draft_id.clone());
    state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?
        .insert(draft_id, spend);
    Ok(Operation {
        data: view,
        rpc: traces,
    })
}

pub async fn sign_spend_proposal(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
    passphrase: String,
) -> Result<Operation<PersonalSpendView>, String> {
    let snapshot = state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
    let passphrase = Zeroizing::new(passphrase);
    if snapshot.broadcast_in_progress {
        return Err("Broadcast pokušaj je već u tijeku za ovu transakciju.".into());
    }
    if passphrase.is_empty() {
        return Err("Unesite wallet passphrase za ovaj potpis.".into());
    }
    let mut traces = Vec::new();
    ensure_test_chain(&client, &mut traces).await?;
    client
        .call(
            "walletpassphrase",
            json!({ "passphrase": passphrase.as_str(), "timeout": 5 }),
            Some(&snapshot.wallet_name),
            "Bitcoin Core otključava wallet na najviše pet sekundi.",
            Some(json!({ "passphrase": "[REDACTED]", "timeout": 5 })),
            false,
            &mut traces,
        )
        .await?;
    let processed = client
        .call(
            "walletprocesspsbt",
            json!({
                "psbt": snapshot.psbt,
                "sign": true,
                "sighashtype": "DEFAULT",
                "bip32derivs": true,
                "finalize": true
            }),
            Some(&snapshot.wallet_name),
            "Bitcoin Core pregledani PSBT potpisuje ključem iz ovog walleta.",
            Some(json!({ "psbt": "[REDACTED]", "sign": true, "sighashtype": "DEFAULT" })),
            true,
            &mut traces,
        )
        .await;
    let lock_result = client
        .call(
            "walletlock",
            json!({}),
            Some(&snapshot.wallet_name),
            "Bitcoin Core odmah ponovno zaključava wallet.",
            None,
            false,
            &mut traces,
        )
        .await;
    if lock_result.is_err() {
        return Err("STOP: wallet se nakon potpisa nije mogao potvrđeno zaključati.".into());
    }
    let processed = processed?;
    let updated_psbt = processed
        .get("psbt")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Bitcoin Core nije vratio potpisani PSBT.".to_string())?
        .to_string();
    let mut drafts = state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?;
    let draft = drafts
        .get_mut(&draft_id)
        .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
    if draft.psbt != snapshot.psbt || draft.broadcast_in_progress {
        return Err(
            "Spend proposal promijenjen je tijekom potpisa. Ponovno ga pregledajte.".into(),
        );
    }
    draft.psbt = updated_psbt;
    draft.complete = processed
        .get("complete")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    draft.raw_hex = None;
    draft.mempool_preflight = MempoolPreflight::NotRun;
    draft.preflight_version = draft.preflight_version.saturating_add(1);
    let view = draft.view(draft_id);
    state
        .broadcast_authorizations
        .lock()
        .map_err(|_| "Broadcast autorizacije trenutačno nisu dostupne.".to_string())?
        .revoke_draft(&view.draft_id);
    Ok(Operation {
        data: view,
        rpc: traces,
    })
}

pub async fn finalize_spend_proposal(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
) -> Result<Operation<PersonalSpendView>, String> {
    let snapshot = state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
    if !snapshot.complete {
        return Err("PSBT još nema potpune potpise i ne može se finalizirati.".into());
    }
    if snapshot.broadcast_in_progress {
        return Err("Broadcast pokušaj je već u tijeku za ovu transakciju.".into());
    }
    let mut traces = Vec::new();
    ensure_test_chain(&client, &mut traces).await?;
    let finalized = client
        .call(
            "finalizepsbt",
            json!({ "psbt": snapshot.psbt, "extract": true }),
            None,
            "Bitcoin Core finalizira potpisani PSBT, ali ga još ne broadcasta.",
            Some(json!({ "psbt": "[REDACTED]", "extract": true })),
            true,
            &mut traces,
        )
        .await?;
    if finalized.get("complete").and_then(Value::as_bool) != Some(true) {
        return Err("Bitcoin Core nije potvrdio da je PSBT potpun.".into());
    }
    let raw_hex = finalized
        .get("hex")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Bitcoin Core nije vratio finalni transaction hex.".to_string())?
        .to_string();
    let mut drafts = state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?;
    let draft = drafts
        .get_mut(&draft_id)
        .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
    if draft.psbt != snapshot.psbt || draft.broadcast_in_progress {
        return Err(
            "Spend proposal promijenjen je tijekom finalizacije. Ponovno ga pregledajte.".into(),
        );
    }
    draft.raw_hex = Some(raw_hex);
    draft.mempool_preflight = MempoolPreflight::NotRun;
    draft.preflight_version = draft.preflight_version.saturating_add(1);
    let view = draft.view(draft_id);
    state
        .broadcast_authorizations
        .lock()
        .map_err(|_| "Broadcast autorizacije trenutačno nisu dostupne.".to_string())?
        .revoke_draft(&view.draft_id);
    Ok(Operation {
        data: view,
        rpc: traces,
    })
}

pub async fn preflight_spend_proposal(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
) -> Result<Operation<PersonalSpendView>, String> {
    let snapshot = state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
    let raw_hex = snapshot
        .raw_hex
        .clone()
        .ok_or_else(|| "Transakcija još nije finalizirana.".to_string())?;
    if snapshot.broadcast_in_progress {
        return Err("Broadcast pokušaj je već u tijeku za ovu transakciju.".into());
    }
    let transaction_identity = finalized_transaction_identity(&raw_hex);
    let mut traces = Vec::new();

    let preflight = match ensure_test_chain(&client, &mut traces).await {
        Ok(_) => match client
            .call(
                "testmempoolaccept",
                json!({ "rawtxs": [raw_hex] }),
                None,
                "Lokalni Core provjerava mempool pravila bez slanja transakcije.",
                Some(json!({ "rawtxs": ["[REDACTED]"] })),
                true,
                &mut traces,
            )
            .await
        {
            Ok(tested) => parse_mempool_preflight(tested, transaction_identity.clone()),
            Err(_) => MempoolPreflight::Indeterminate {
                transaction_identity: transaction_identity.clone(),
                reason: "Core Vault nije mogao dobiti pouzdan testmempoolaccept rezultat. Pokušajte ponovno."
                    .into(),
            },
        },
        Err(_) => MempoolPreflight::Indeterminate {
            transaction_identity: transaction_identity.clone(),
            reason: "Core Vault nije mogao potvrditi mrežu lokalnog Bitcoin Corea za mempool provjeru."
                .into(),
        },
    };

    let mut drafts = state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?;
    let draft = drafts
        .get_mut(&draft_id)
        .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
    if draft.raw_hex.as_deref() != Some(raw_hex.as_str()) || draft.broadcast_in_progress {
        return Err(
            "Finalizirana transakcija promijenjena je tijekom mempool provjere. Pokrenite provjeru ponovno."
                .into(),
        );
    }
    draft.mempool_preflight = preflight;
    draft.preflight_version = draft.preflight_version.saturating_add(1);
    let view = draft.view(draft_id);
    state
        .broadcast_authorizations
        .lock()
        .map_err(|_| "Broadcast autorizacije trenutačno nisu dostupne.".to_string())?
        .revoke_draft(&view.draft_id);
    Ok(Operation {
        data: view,
        rpc: traces,
    })
}

#[derive(Clone, Debug)]
pub struct PreparedPersonalBroadcastAuthorization {
    draft_id: String,
    transaction_identity: String,
    preflight_version: u64,
    pub summary: BroadcastSummary,
}

pub fn prepare_personal_broadcast_authorization(
    state: &AppState,
    draft_id: &str,
) -> Result<PreparedPersonalBroadcastAuthorization, String> {
    let drafts = state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?;
    let draft = drafts
        .get(draft_id)
        .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
    let (_, transaction_identity) = ensure_personal_ready_for_broadcast(draft)?;
    Ok(PreparedPersonalBroadcastAuthorization {
        draft_id: draft_id.into(),
        transaction_identity,
        preflight_version: draft.preflight_version,
        summary: BroadcastSummary {
            vault_name: draft.wallet_name.clone(),
            destination: draft.destination.clone(),
            amount_sats: draft.amount_sats,
            fee_sats: draft.fee_sats,
            network: draft.network.clone(),
        },
    })
}

pub fn complete_personal_broadcast_authorization(
    state: &AppState,
    prepared: PreparedPersonalBroadcastAuthorization,
    approved: bool,
) -> Result<Option<BroadcastAuthorizationGrant>, String> {
    if !approved {
        return Ok(None);
    }
    let drafts = state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?;
    let draft = drafts
        .get(&prepared.draft_id)
        .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
    let (_, current_identity) = ensure_personal_ready_for_broadcast(draft)?;
    if current_identity != prepared.transaction_identity
        || draft.preflight_version != prepared.preflight_version
    {
        return Err(
            "Transakcija ili njezina mempool provjera promijenila se tijekom potvrde. Ponovno pregledajte i potvrdite broadcast."
                .into(),
        );
    }
    let grant = state
        .broadcast_authorizations
        .lock()
        .map_err(|_| "Broadcast autorizacije trenutačno nisu dostupne.".to_string())?
        .issue(
            BroadcastPurpose::PersonalTransaction,
            prepared.draft_id,
            prepared.transaction_identity,
            prepared.preflight_version,
        )?;
    Ok(Some(grant))
}

#[cfg(test)]
pub(crate) fn request_personal_broadcast_authorization_with<C: BroadcastConfirmer>(
    state: &AppState,
    draft_id: &str,
    confirmer: &C,
) -> Result<Option<BroadcastAuthorizationGrant>, String> {
    let prepared = prepare_personal_broadcast_authorization(state, draft_id)?;
    let approved = confirmer.confirm(&prepared.summary)?;
    complete_personal_broadcast_authorization(state, prepared, approved)
}

pub async fn broadcast_spend_proposal(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
    authorization_id: String,
) -> Result<Operation<PersonalBroadcast>, String> {
    let snapshot = state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
    let (_, transaction_identity) = ensure_personal_ready_for_broadcast(&snapshot)?;
    state
        .broadcast_authorizations
        .lock()
        .map_err(|_| "Broadcast autorizacije trenutačno nisu dostupne.".to_string())?
        .consume(
            &authorization_id,
            BroadcastPurpose::PersonalTransaction,
            &draft_id,
            &transaction_identity,
            snapshot.preflight_version,
        )?;
    {
        let mut drafts = state
            .personal_drafts
            .lock()
            .map_err(|_| "PSBT state nije dostupan.".to_string())?;
        let draft = drafts
            .get_mut(&draft_id)
            .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
        let (_, current_identity) = ensure_personal_ready_for_broadcast(draft)?;
        if current_identity != transaction_identity
            || draft.preflight_version != snapshot.preflight_version
        {
            return Err(
                "Transakcija ili preflight promijenili su se prije broadcasta. Autorizacija je potrošena."
                    .into(),
            );
        }
        draft.broadcast_in_progress = true;
    }

    let raw_hex = snapshot
        .raw_hex
        .as_deref()
        .ok_or_else(|| "Transakcija više nije finalizirana.".to_string())?;
    let mut traces = Vec::new();
    let attempt = async {
        ensure_test_chain(&client, &mut traces).await?;
        let network = client
            .call(
                "getnetworkinfo",
                json!({}),
                None,
                "Provjerava da je Bitcoin Core P2P mrežna aktivnost dostupna prije broadcasta.",
                None,
                false,
                &mut traces,
            )
            .await?;
        if network.get("networkactive").and_then(Value::as_bool) != Some(true) {
            return Err(
                "Broadcast je onemogućen dok je Bitcoin Core network activity disabled. Autorizacija je potrošena."
                    .into(),
            );
        }
        client
            .call(
                "sendrawtransaction",
                json!({ "hexstring": raw_hex }),
                None,
                "Bitcoin Core broadcasta privilegirano autoriziranu finaliziranu transakciju.",
                Some(json!({ "hexstring": "[REDACTED]" })),
                false,
                &mut traces,
            )
            .await?
            .as_str()
            .filter(|value| is_txid(value))
            .map(str::to_string)
            .ok_or_else(|| "Bitcoin Core nije vratio valjani txid.".to_string())
    }
    .await;

    match attempt {
        Ok(txid) => {
            state
                .personal_drafts
                .lock()
                .map_err(|_| "PSBT state nije dostupan.".to_string())?
                .remove(&draft_id);
            state
                .broadcast_authorizations
                .lock()
                .map_err(|_| "Broadcast autorizacije trenutačno nisu dostupne.".to_string())?
                .revoke_draft(&draft_id);
            Ok(Operation {
                data: PersonalBroadcast {
                    txid,
                    wallet_name: snapshot.wallet_name,
                    network: snapshot.network,
                    sent_sats: snapshot.amount_sats,
                    fee_sats: snapshot.fee_sats,
                },
                rpc: traces,
            })
        }
        Err(error) => {
            if let Ok(mut drafts) = state.personal_drafts.lock() {
                if let Some(draft) = drafts.get_mut(&draft_id) {
                    draft.broadcast_in_progress = false;
                }
            }
            Err(error)
        }
    }
}

fn ensure_personal_ready_for_broadcast(
    draft: &PersonalSpendState,
) -> Result<(&str, String), String> {
    if draft.broadcast_in_progress {
        return Err("Broadcast pokušaj je već u tijeku za ovu transakciju.".into());
    }
    if !draft.complete {
        return Err("PSBT još nema potpune potpise.".into());
    }
    let raw_hex = draft
        .raw_hex
        .as_deref()
        .ok_or_else(|| "Transakcija još nije finalizirana.".to_string())?;
    ensure_broadcast_preflight(&draft.mempool_preflight, raw_hex)?;
    Ok((raw_hex, finalized_transaction_identity(raw_hex)))
}

async fn inspect_personal_wallet(
    client: &RpcClient,
    state: &AppState,
    wallet_name: &str,
    display_name: &str,
    network: &str,
    traces: &mut Vec<RpcTrace>,
) -> Result<PersonalVault, String> {
    let info = client
        .call(
            "getwalletinfo",
            json!({}),
            Some(wallet_name),
            "Provjerava da je Personal Vault descriptor wallet s privatnim ključevima.",
            None,
            false,
            traces,
        )
        .await?;
    let descriptors = info.get("descriptors").and_then(Value::as_bool) == Some(true);
    let private_keys_enabled =
        info.get("private_keys_enabled").and_then(Value::as_bool) == Some(true);
    if !descriptors || !private_keys_enabled {
        return Err("STOP: odabrani wallet nije Personal Vault descriptor wallet.".into());
    }
    let balances = client
        .call(
            "getbalances",
            json!({}),
            Some(wallet_name),
            "Čita potvrđeni i nepotvrđeni balance iz lokalnog Corea.",
            None,
            false,
            traces,
        )
        .await?;
    let balance_btc = wallet_balance_btc(&balances);
    let encrypted = info.get("unlocked_until").is_some();
    let locked = encrypted
        && info
            .get("unlocked_until")
            .and_then(Value::as_i64)
            .unwrap_or(0)
            == 0;
    let public_fingerprint = public_wallet_fingerprint(client, wallet_name, traces).await?;
    let backup_required = !state
        .backed_up_wallets
        .lock()
        .map_err(|_| "Backup status nije dostupan.".to_string())?
        .contains_key(wallet_name);
    Ok(PersonalVault {
        wallet_name: wallet_name.into(),
        display_name: display_name.into(),
        network: network.into(),
        descriptors,
        private_keys_enabled,
        encrypted,
        locked,
        balance_sats: btc_to_sats(balance_btc),
        balance_btc,
        public_fingerprint,
        backup_required,
    })
}

async fn public_wallet_fingerprint(
    client: &RpcClient,
    wallet_name: &str,
    traces: &mut Vec<RpcTrace>,
) -> Result<String, String> {
    let result = client
        .call(
            "listdescriptors",
            json!({ "private": false }),
            Some(wallet_name),
            "Čita samo javne descriptore za stabilni restore fingerprint.",
            None,
            false,
            traces,
        )
        .await?;
    let mut descriptors = result
        .get("descriptors")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|value| {
            value
                .get("desc")
                .and_then(Value::as_str)
                .map(str::to_string)
        })
        .collect::<Vec<_>>();
    if descriptors.is_empty() {
        return Err("Core wallet nema javne descriptore za restore provjeru.".into());
    }
    descriptors.sort();
    Ok(sha256_bytes(descriptors.join("\n").as_bytes()))
}

async fn current_chain(client: &RpcClient, traces: &mut Vec<RpcTrace>) -> Result<String, String> {
    client
        .call(
            "getblockchaininfo",
            json!({}),
            None,
            "Čita aktivni chain iz lokalnog Corea.",
            None,
            false,
            traces,
        )
        .await?
        .get("chain")
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or_else(|| "Bitcoin Core nije vratio aktivni chain.".to_string())
}

fn parse_activity(value: &Value) -> Vec<ActivityItem> {
    value
        .as_array()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|entry| {
            let txid = entry.get("txid")?.as_str()?.to_string();
            Some(ActivityItem {
                txid,
                category: entry
                    .get("category")
                    .and_then(Value::as_str)
                    .unwrap_or("unknown")
                    .into(),
                amount_sats: btc_to_signed_sats(
                    entry.get("amount").and_then(Value::as_f64).unwrap_or(0.0),
                ),
                confirmations: entry
                    .get("confirmations")
                    .and_then(Value::as_i64)
                    .unwrap_or(0),
                timestamp: entry.get("time").and_then(Value::as_u64),
                label: entry
                    .get("label")
                    .and_then(Value::as_str)
                    .map(str::to_string),
                address: entry
                    .get("address")
                    .and_then(Value::as_str)
                    .map(str::to_string),
            })
        })
        .collect()
}

fn parse_outputs(decoded: &Value, change_position: i64) -> Vec<SpendOutputView> {
    decoded
        .pointer("/tx/vout")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .enumerate()
        .filter_map(|(index, output)| {
            let amount = output.get("value").and_then(Value::as_f64)?;
            Some(SpendOutputView {
                address: output
                    .pointer("/scriptPubKey/address")
                    .and_then(Value::as_str)
                    .map(str::to_string),
                amount_sats: btc_to_sats(amount),
                is_change: index as i64 == change_position,
            })
        })
        .collect()
}

pub(crate) fn parse_mempool_preflight(
    value: Value,
    transaction_identity: String,
) -> MempoolPreflight {
    let mut results = match serde_json::from_value::<Vec<TestMempoolAcceptResult>>(value) {
        Ok(results) => results,
        Err(_) => {
            return MempoolPreflight::Indeterminate {
                transaction_identity,
                reason: "Bitcoin Core vratio je neočekivan testmempoolaccept odgovor.".into(),
            }
        }
    };
    if results.len() != 1 {
        return MempoolPreflight::Indeterminate {
            transaction_identity,
            reason: "Bitcoin Core nije vratio točno jedan rezultat za testiranu transakciju."
                .into(),
        };
    }

    let result = results.remove(0);
    if !is_txid(&result.txid) || !is_txid(&result.wtxid) {
        return MempoolPreflight::Indeterminate {
            transaction_identity,
            reason: "Bitcoin Core nije vratio valjani identitet testirane transakcije.".into(),
        };
    }

    if result.package_error.is_some() {
        return MempoolPreflight::Indeterminate {
            transaction_identity,
            reason: "Bitcoin Core vratio je neočekivanu package pogrešku za jednu transakciju."
                .into(),
        };
    }

    match result.allowed {
        Some(true) if result.reject_reason.is_none() => MempoolPreflight::Accepted {
            transaction_identity,
        },
        Some(true) => MempoolPreflight::Indeterminate {
            transaction_identity,
            reason: "Bitcoin Core vratio je kontradiktoran testmempoolaccept rezultat.".into(),
        },
        Some(false) => MempoolPreflight::Rejected {
            transaction_identity,
            reason: result
                .reject_reason
                .map(|reason| sanitize_rpc_text(&reason))
                .filter(|reason| !reason.trim().is_empty()),
        },
        None => MempoolPreflight::Indeterminate {
            transaction_identity,
            reason: "Bitcoin Core nije izričito vratio allowed status za testiranu transakciju."
                .into(),
        },
    }
}

pub(crate) fn ensure_broadcast_preflight(
    preflight: &MempoolPreflight,
    raw_hex: &str,
) -> Result<(), String> {
    let current_identity = finalized_transaction_identity(raw_hex);
    match preflight {
        MempoolPreflight::Accepted {
            transaction_identity,
        } if transaction_identity == &current_identity => Ok(()),
        MempoolPreflight::Rejected {
            transaction_identity,
            reason,
        } if transaction_identity == &current_identity => Err(format!(
            "Bitcoin Core ne bi prihvatio ovu transakciju u mempool: {}",
            reason.clone().unwrap_or_else(|| "razlog nije naveden".into())
        )),
        MempoolPreflight::Indeterminate {
            transaction_identity,
            reason,
        } if transaction_identity == &current_identity => Err(format!(
            "Core Vault nije mogao potvrditi prihvat transakcije u mempool. Broadcast je onemogućen: {reason}"
        )),
        MempoolPreflight::NotRun => Err(
            "Mempool provjera nije izvršena. Broadcast je onemogućen dok provjera izričito ne uspije."
                .into(),
        ),
        _ => Err(
            "Mempool provjera ne pripada trenutačno finaliziranoj transakciji. Pokrenite provjeru ponovno."
                .into(),
        ),
    }
}

fn validate_display_name(value: &str) -> Result<(), String> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.chars().count() > 64 || trimmed.chars().any(char::is_control) {
        return Err("Naziv vaulta mora imati između 1 i 64 čitljiva znaka.".into());
    }
    Ok(())
}

fn validate_passphrase(value: &str) -> Result<(), String> {
    if value.chars().count() < 12 {
        return Err("Za prototip koristite wallet passphrase od najmanje 12 znakova.".into());
    }
    if value.chars().any(char::is_control) {
        return Err("Wallet passphrase sadrži nedopušteni kontrolni znak.".into());
    }
    Ok(())
}

fn validate_amount_and_fee(amount_sats: u64, fee_rate_sat_vb: f64) -> Result<(), String> {
    if amount_sats == 0 || amount_sats > 2_100_000_000_000_000 {
        return Err("Iznos mora biti između 1 sats i ukupne Bitcoin ponude.".into());
    }
    if !(1.0..=1_000.0).contains(&fee_rate_sat_vb) {
        return Err("Fee rate mora biti između 1 i 1.000 sat/vB.".into());
    }
    Ok(())
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

fn btc_to_signed_sats(value: f64) -> i64 {
    (value * 100_000_000.0).round() as i64
}

fn next_draft_id() -> String {
    format!(
        "personal-{}-{}",
        now_unix(),
        PERSONAL_DRAFT_COUNTER.fetch_add(1, Ordering::Relaxed)
    )
}

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn sha256_file(path: &Path) -> Result<String, String> {
    let mut file =
        File::open(path).map_err(|_| "Backup nije moguće otvoriti za checksum.".to_string())?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 16 * 1024];
    loop {
        let read = file
            .read(&mut buffer)
            .map_err(|_| "Backup nije moguće pročitati za checksum.".to_string())?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn sha256_bytes(value: &[u8]) -> String {
    format!("{:x}", Sha256::digest(value))
}

fn is_txid(value: &str) -> bool {
    value.len() == 64 && value.chars().all(|character| character.is_ascii_hexdigit())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ConnectionSettings;

    struct ApproveBroadcast;

    impl BroadcastConfirmer for ApproveBroadcast {
        fn confirm(&self, _summary: &BroadcastSummary) -> Result<bool, String> {
            Ok(true)
        }
    }

    const TEST_RAW_HEX: &str = "02000000000100";

    #[test]
    fn passphrase_policy_rejects_short_or_controlled_values() {
        assert!(validate_passphrase("short").is_err());
        assert!(validate_passphrase("long-enough\nsecret").is_err());
        assert!(validate_passphrase("correct-harbor-bronze-lantern").is_ok());
    }

    #[test]
    fn public_fingerprint_is_stable() {
        let first = sha256_bytes(b"descriptor-a\ndescriptor-b");
        let second = sha256_bytes(b"descriptor-a\ndescriptor-b");
        assert_eq!(first, second);
        assert_eq!(first.len(), 64);
    }

    #[test]
    fn parses_psbt_outputs_and_marks_change() {
        let decoded = json!({
            "tx": { "vout": [
                { "value": 0.0001, "scriptPubKey": { "address": "tb1dest" } },
                { "value": 0.0002, "scriptPubKey": { "address": "tb1change" } }
            ] }
        });
        let outputs = parse_outputs(&decoded, 1);
        assert_eq!(outputs.len(), 2);
        assert!(!outputs[0].is_change);
        assert!(outputs[1].is_change);
        assert_eq!(outputs[0].amount_sats, 10_000);
    }

    #[test]
    fn validates_amount_fee_and_txid() {
        assert!(validate_amount_and_fee(5_000, 2.5).is_ok());
        assert!(validate_amount_and_fee(0, 2.5).is_err());
        assert!(validate_amount_and_fee(5_000, 0.0).is_err());
        assert!(is_txid(&"a".repeat(64)));
        assert!(!is_txid("not-a-txid"));
    }

    #[test]
    fn explicit_true_is_required_for_accepted_preflight() {
        let preflight = parse_mempool_preflight(
            mempool_result(json!(true)),
            finalized_transaction_identity(TEST_RAW_HEX),
        );
        assert!(matches!(preflight, MempoolPreflight::Accepted { .. }));
        assert!(ensure_broadcast_preflight(&preflight, TEST_RAW_HEX).is_ok());
        assert!(ensure_broadcast_preflight(&preflight, "different-finalized-hex").is_err());
    }

    #[test]
    fn explicit_false_is_rejected_and_reason_is_sanitized() {
        let preflight = parse_mempool_preflight(
            json!([{
                "txid": "a".repeat(64),
                "wtxid": "b".repeat(64),
                "allowed": false,
                "reject-reason": "policy\nrejection"
            }]),
            finalized_transaction_identity(TEST_RAW_HEX),
        );
        match preflight {
            MempoolPreflight::Rejected { reason, .. } => {
                assert_eq!(reason.as_deref(), Some("policy rejection"));
            }
            other => panic!("explicit false must be Rejected, got {other:?}"),
        }
    }

    #[test]
    fn missing_null_and_wrong_type_allowed_are_indeterminate() {
        for response in [
            json!([{
                "txid": "a".repeat(64),
                "wtxid": "b".repeat(64)
            }]),
            json!([{
                "txid": "a".repeat(64),
                "wtxid": "b".repeat(64),
                "allowed": null
            }]),
            json!([{
                "txid": "a".repeat(64),
                "wtxid": "b".repeat(64),
                "allowed": "true"
            }]),
        ] {
            assert!(matches!(
                parse_mempool_preflight(response, finalized_transaction_identity(TEST_RAW_HEX)),
                MempoolPreflight::Indeterminate { .. }
            ));
        }
    }

    #[test]
    fn empty_malformed_and_unexpected_result_counts_are_indeterminate() {
        for response in [
            json!([]),
            json!({ "allowed": true }),
            json!([
                {
                    "txid": "a".repeat(64),
                    "wtxid": "b".repeat(64),
                    "allowed": true
                },
                {
                    "txid": "c".repeat(64),
                    "wtxid": "d".repeat(64),
                    "allowed": true
                }
            ]),
            json!([{
                "txid": "a".repeat(64),
                "wtxid": "b".repeat(64),
                "allowed": true,
                "reject-reason": "contradictory"
            }]),
            json!([{
                "txid": "a".repeat(64),
                "wtxid": "b".repeat(64),
                "package-error": "unexpected single transaction package state",
                "allowed": true
            }]),
        ] {
            assert!(matches!(
                parse_mempool_preflight(response, finalized_transaction_identity(TEST_RAW_HEX)),
                MempoolPreflight::Indeterminate { .. }
            ));
        }
    }

    #[test]
    fn broadcast_rejects_no_preflight() {
        assert_broadcast_is_blocked(MempoolPreflight::NotRun, "Mempool provjera nije izvršena");
    }

    #[test]
    fn broadcast_rejects_rejected_preflight() {
        assert_broadcast_is_blocked(
            MempoolPreflight::Rejected {
                transaction_identity: finalized_transaction_identity(TEST_RAW_HEX),
                reason: Some("policy rejection".into()),
            },
            "ne bi prihvatio",
        );
    }

    #[test]
    fn broadcast_rejects_indeterminate_preflight() {
        assert_broadcast_is_blocked(
            MempoolPreflight::Indeterminate {
                transaction_identity: finalized_transaction_identity(TEST_RAW_HEX),
                reason: "nepouzdan rezultat".into(),
            },
            "nije mogao potvrditi",
        );
    }

    #[test]
    fn accepted_preflight_permits_broadcast_command_to_reach_core_boundary() {
        let error = run_broadcast_with_preflight(MempoolPreflight::Accepted {
            transaction_identity: finalized_transaction_identity(TEST_RAW_HEX),
        });
        assert!(
            error.contains("cookie nije moguće pročitati"),
            "accepted preflight should pass the gate and reach the Core boundary: {error}"
        );
    }

    #[test]
    fn rpc_failure_preserves_finalized_transaction_as_indeterminate() {
        let state = AppState::default();
        state
            .personal_drafts
            .lock()
            .expect("test draft state should lock")
            .insert(
                "preflight-rpc-failure".into(),
                test_spend_state(MempoolPreflight::NotRun),
            );
        let operation = test_runtime()
            .block_on(preflight_spend_proposal(
                unreachable_rpc_client(),
                &state,
                "preflight-rpc-failure".into(),
            ))
            .expect("RPC failure should normalize into an indeterminate view");

        assert!(matches!(
            operation.data.mempool_preflight,
            crate::types::MempoolPreflightView::Indeterminate { .. }
        ));
        let drafts = state
            .personal_drafts
            .lock()
            .expect("test draft state should lock");
        let draft = drafts
            .get("preflight-rpc-failure")
            .expect("finalized draft should remain available");
        assert_eq!(draft.raw_hex.as_deref(), Some(TEST_RAW_HEX));
        assert!(matches!(
            draft.mempool_preflight,
            MempoolPreflight::Indeterminate { .. }
        ));
    }

    fn mempool_result(allowed: Value) -> Value {
        json!([{
            "txid": "a".repeat(64),
            "wtxid": "b".repeat(64),
            "allowed": allowed
        }])
    }

    fn assert_broadcast_is_blocked(preflight: MempoolPreflight, expected: &str) {
        let error = run_broadcast_with_preflight(preflight);
        assert!(
            error.contains(expected),
            "unexpected broadcast error: {error}"
        );
    }

    fn run_broadcast_with_preflight(preflight: MempoolPreflight) -> String {
        let state = AppState::default();
        let accepted = matches!(preflight, MempoolPreflight::Accepted { .. });
        state
            .personal_drafts
            .lock()
            .expect("test draft state should lock")
            .insert("gate-test".into(), test_spend_state(preflight));
        let authorization_id = if accepted {
            request_personal_broadcast_authorization_with(&state, "gate-test", &ApproveBroadcast)
                .expect("accepted test draft should allow authorization")
                .expect("approval should mint a test authorization")
                .authorization_id
        } else {
            "not-authorized".into()
        };
        let client = unreachable_rpc_client();
        test_runtime()
            .block_on(broadcast_spend_proposal(
                client,
                &state,
                "gate-test".into(),
                authorization_id,
            ))
            .expect_err("test broadcast should stop before sendrawtransaction")
    }

    fn unreachable_rpc_client() -> RpcClient {
        RpcClient::new(ConnectionSettings {
            host: "127.0.0.1".into(),
            port: 18443,
            cookie_path: std::env::temp_dir()
                .join("core-vault-intentionally-missing-cookie")
                .to_string_lossy()
                .into_owned(),
        })
        .expect("test RPC client should initialize")
    }

    fn test_spend_state(mempool_preflight: MempoolPreflight) -> PersonalSpendState {
        PersonalSpendState {
            wallet_name: "gate-test-wallet".into(),
            network: "regtest".into(),
            destination: "bcrt1qtest".into(),
            amount_sats: 1_000,
            fee_sats: 100,
            fee_rate_sat_vb: 2.0,
            outputs: Vec::new(),
            replaceable: true,
            psbt: "test-psbt".into(),
            complete: true,
            raw_hex: Some(TEST_RAW_HEX.into()),
            mempool_preflight,
            preflight_version: 1,
            broadcast_in_progress: false,
        }
    }

    fn test_runtime() -> tokio::runtime::Runtime {
        tokio::runtime::Builder::new_multi_thread()
            .worker_threads(2)
            .enable_all()
            .build()
            .expect("build async test runtime")
    }
}
