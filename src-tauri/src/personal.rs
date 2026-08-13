use crate::{
    rpc::{ensure_test_chain, RpcClient},
    security::{validate_absolute_destination, validate_wallet_name},
    types::{
        ActivityItem, AppState, BackupReceipt, Operation, PersonalBroadcast, PersonalReceive,
        PersonalSpendState, PersonalSpendView, PersonalVault, PersonalVaultSnapshot,
        RestoreReceipt, RpcTrace, SpendOutputView, VaultListItem,
    },
};
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
    destination: String,
) -> Result<Operation<BackupReceipt>, String> {
    validate_wallet_name(&wallet_name)?;
    validate_absolute_destination(&destination)?;
    let mut traces = Vec::new();
    ensure_test_chain(&client, &mut traces).await?;
    client
        .call(
            "backupwallet",
            json!({ "destination": destination }),
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
        path: destination.clone(),
        created_at_unix: now_unix(),
        size_bytes: metadata.len(),
        sha256: sha256_file(Path::new(&destination))?,
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
    original_wallet_name: String,
    restored_wallet_name: String,
    backup_file: String,
) -> Result<Operation<RestoreReceipt>, String> {
    validate_wallet_name(&original_wallet_name)?;
    validate_wallet_name(&restored_wallet_name)?;
    validate_absolute_destination(&backup_file)?;
    if original_wallet_name == restored_wallet_name {
        return Err("Testni restore mora koristiti novo, jedinstveno wallet ime.".into());
    }
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
        mempool_allowed: None,
        mempool_reject_reason: None,
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
    if draft.psbt != snapshot.psbt {
        return Err(
            "Spend proposal promijenjen je tijekom potpisa. Ponovno ga pregledajte.".into(),
        );
    }
    draft.psbt = updated_psbt;
    draft.complete = processed
        .get("complete")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let view = draft.view(draft_id);
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
    let tested = client
        .call(
            "testmempoolaccept",
            json!({ "rawtxs": [raw_hex] }),
            None,
            "Lokalni Core provjerava mempool pravila bez slanja transakcije.",
            Some(json!({ "rawtxs": ["[REDACTED]"] })),
            true,
            &mut traces,
        )
        .await?;
    let first = tested.as_array().and_then(|values| values.first());
    let allowed = first
        .and_then(|value| value.get("allowed"))
        .and_then(Value::as_bool);
    let reject_reason = first
        .and_then(|value| value.get("reject-reason"))
        .and_then(Value::as_str)
        .map(str::to_string);
    let mut drafts = state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?;
    let draft = drafts
        .get_mut(&draft_id)
        .ok_or_else(|| "Spend proposal više nije dostupan.".to_string())?;
    draft.raw_hex = Some(raw_hex);
    draft.mempool_allowed = allowed;
    draft.mempool_reject_reason = reject_reason;
    let view = draft.view(draft_id);
    Ok(Operation {
        data: view,
        rpc: traces,
    })
}

pub async fn broadcast_spend_proposal(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
) -> Result<Operation<PersonalBroadcast>, String> {
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
    if snapshot.mempool_allowed == Some(false) {
        return Err(format!(
            "Lokalni Core ne bi prihvatio transakciju: {}",
            snapshot
                .mempool_reject_reason
                .clone()
                .unwrap_or_else(|| "nepoznat razlog".into())
        ));
    }
    let mut traces = Vec::new();
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
            "Broadcast je onemogućen dok je Bitcoin Core network activity disabled.".into(),
        );
    }
    let txid = client
        .call(
            "sendrawtransaction",
            json!({ "hexstring": raw_hex }),
            None,
            "Bitcoin Core broadcasta finaliziranu transakciju nakon zasebne potvrde.",
            Some(json!({ "hexstring": "[REDACTED]" })),
            false,
            &mut traces,
        )
        .await?
        .as_str()
        .filter(|value| is_txid(value))
        .ok_or_else(|| "Bitcoin Core nije vratio valjani txid.".to_string())?
        .to_string();
    state
        .personal_drafts
        .lock()
        .map_err(|_| "PSBT state nije dostupan.".to_string())?
        .remove(&draft_id);
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
}
