use crate::{
    file_capabilities::{consume_file_capability, FileOperation},
    rpc::{ensure_signet, RpcClient},
    security::{contains_private_material, validate_public_backup, validate_wallet_name},
    types::{
        AppState, BroadcastResult, Operation, PublicVaultBackup, ReceiveSnapshot, RpcTrace,
        SignerPublic, SigningWallet, SpendDraftView, SpendState, VaultSummary,
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
) -> Result<Operation<SigningWallet>, String> {
    validate_label(&label)?;
    validate_wallet_name(&wallet_name)?;
    let mut traces = Vec::new();
    ensure_signet(&client, &mut traces).await?;
    client
        .call(
            "createwallet",
            json!({
                "wallet_name": wallet_name,
                "disable_private_keys": false,
                "blank": false,
                "passphrase": "",
                "avoid_reuse": false,
                "descriptors": true,
                "load_on_startup": true
            }),
            None,
            "Bitcoin Core stvara descriptor signing wallet i u njemu generira privatne ključeve.",
            None,
            false,
            &mut traces,
        )
        .await?;
    let wallet = verify_signing_wallet(&client, &label, &wallet_name, &mut traces).await?;
    Ok(Operation {
        data: wallet,
        rpc: traces,
    })
}

pub async fn encrypt_signing_wallet(
    client: RpcClient,
    label: String,
    wallet_name: String,
    passphrase: String,
) -> Result<Operation<SigningWallet>, String> {
    validate_label(&label)?;
    validate_wallet_name(&wallet_name)?;
    if passphrase.chars().count() < 10 {
        return Err("Wallet lozinka mora imati najmanje 10 znakova.".into());
    }
    let passphrase = Zeroizing::new(passphrase);
    let mut traces = Vec::new();
    ensure_signet(&client, &mut traces).await?;
    verify_signing_wallet(&client, &label, &wallet_name, &mut traces).await?;
    client
        .call(
            "encryptwallet",
            json!({ "passphrase": passphrase.as_str() }),
            Some(&wallet_name),
            "Bitcoin Core enkriptira lokalni signing wallet. Lozinka se ne sprema u Core Vaultu.",
            Some(json!({ "passphrase": "[REDACTED]" })),
            false,
            &mut traces,
        )
        .await?;

    let wallet = verify_signing_wallet(&client, &label, &wallet_name, &mut traces).await?;
    if !wallet.encrypted {
        return Err("STOP: Bitcoin Core nije potvrdio da je signing wallet enkriptiran.".into());
    }
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
            "Bitcoin Core zapisuje službeni backup signing walleta na odabranu lokalnu putanju.",
            None,
            false,
            &mut traces,
        )
        .await?;

    let metadata = fs::metadata(&destination).map_err(|_| {
        "Bitcoin Core je završio poziv, ali backup datoteka nije pronađena na odredištu."
            .to_string()
    })?;
    if !metadata.is_file() || metadata.len() == 0 {
        return Err("STOP: nastali wallet backup nije valjana neprazna datoteka.".into());
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
        return Err("Core Vault V1 zahtijeva točno tri signing walleta.".into());
    }
    for name in &wallet_names {
        validate_wallet_name(name)?;
    }
    if wallet_names[0] == wallet_names[1]
        || wallet_names[0] == wallet_names[2]
        || wallet_names[1] == wallet_names[2]
    {
        return Err("K1, K2 i K3 moraju biti tri različita Bitcoin Core walleta.".into());
    }

    let mut traces = Vec::new();
    ensure_signet(&client, &mut traces).await?;
    let mut receive_keys = Vec::new();
    let mut change_keys = Vec::new();

    for (index, wallet_name) in wallet_names.iter().enumerate() {
        let label = format!("K{}", index + 1);
        verify_signing_wallet(&client, &label, wallet_name, &mut traces).await?;
        let descriptors = client
            .call(
                "listdescriptors",
                json!({ "private": false }),
                Some(wallet_name),
                "Bitcoin Core vraća samo javne descriptore kako bi se pronašle receive i change grane.",
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
            "Bitcoin Core stvara prazan watch-only coordinator bez privatnih ključeva.",
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
                        "timestamp": "now",
                        "label": "Core Vault receive"
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
        network: "signet".into(),
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
            network: "Signet".into(),
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
            "Public vault konfiguraciju nije moguće zapisati bez prepisivanja postojeće datoteke."
                .to_string()
        })?;
    file.write_all(format!("{serialized}\n").as_bytes())
        .map_err(|_| {
            "Public vault konfiguraciju nije moguće zapisati na odabranu putanju.".to_string()
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
    ensure_signet(&client, &mut traces).await?;
    verify_coordinator(&client, &coordinator_name, &mut traces).await?;
    let address = match existing_address.filter(|value| !value.trim().is_empty()) {
        Some(value) => value,
        None => client
            .call(
                "getnewaddress",
                json!({ "label": "Core Vault receive test", "address_type": "bech32" }),
                Some(&coordinator_name),
                "Bitcoin Core generira novu Signet receive adresu iz aktivnog vault descriptora.",
                None,
                false,
                &mut traces,
            )
            .await?
            .as_str()
            .ok_or_else(|| "Bitcoin Core nije vratio receive adresu.".to_string())?
            .to_string(),
    };
    if !address.starts_with("tb1") {
        return Err("STOP: coordinator nije vratio očekivanu Signet Native SegWit adresu.".into());
    }
    let address_info = client
        .call(
            "getaddressinfo",
            json!({ "address": address }),
            Some(&coordinator_name),
            "Provjerava da coordinator prepoznaje adresu kao rješivu watch-only adresu vaulta.",
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
            "Čita lokalno potvrđeni i nepotvrđeni balance coordinatora.",
            None,
            false,
            &mut traces,
        )
        .await?;
    let balance_btc = wallet_balance_btc(&balances);
    let solvable = address_info.get("solvable").and_then(Value::as_bool) == Some(true);
    if !solvable {
        return Err("STOP: Bitcoin Core ne smatra receive adresu rješivom iz coordinatora.".into());
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
        return Err("Unesite valjan iznos veći od 0 sats.".into());
    }
    if !(1.0..=1_000.0).contains(&fee_rate_sat_vb) {
        return Err("Fee rate mora biti između 1 i 1.000 sat/vB.".into());
    }
    let mut traces = Vec::new();
    ensure_signet(&client, &mut traces).await?;
    verify_coordinator(&client, &coordinator_name, &mut traces).await?;
    let starting_balances = client
        .call(
            "getbalances",
            json!({}),
            Some(&coordinator_name),
            "Bilježi početni lokalni vault balance za razumljiv transaction review.",
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
            "Bitcoin Core provjerava format i mrežu adrese primatelja.",
            None,
            false,
            &mut traces,
        )
        .await?;
    if validated.get("isvalid").and_then(Value::as_bool) != Some(true) {
        return Err(
            "Adresa primatelja nije valjana Signet adresa. Transakcija nije napravljena.".into(),
        );
    }

    let amount_btc = amount_sats as f64 / 100_000_000.0;
    let amount_value = serde_json::Number::from_f64(amount_btc)
        .map(Value::Number)
        .ok_or_else(|| "Iznos nije moguće sigurno pretvoriti u BTC.".to_string())?;
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
            "Watch-only coordinator odabire sredstva, dodaje change i priprema PSBT bez potpisa.",
            None,
            true,
            &mut traces,
        )
        .await?;
    let psbt = funded
        .get("psbt")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Bitcoin Core nije vratio pripremljeni PSBT.".to_string())?
        .to_string();
    let fee_btc = funded.get("fee").and_then(Value::as_f64).unwrap_or(0.0);
    let draft_id = next_draft_id();
    let draft = SpendState {
        coordinator_name,
        destination,
        amount_sats,
        starting_balance_sats,
        fee_btc,
        psbt,
        signed_by: Vec::new(),
        complete: false,
    };
    let view = draft.view(draft_id.clone());
    state
        .drafts
        .lock()
        .map_err(|_| "Interni transaction state nije dostupan.".to_string())?
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
        .map_err(|_| "Interni transaction state nije dostupan.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| "Transaction draft više nije dostupan; izradite novi.".to_string())?;
    if snapshot.signed_by.iter().any(|name| name == &wallet_name) {
        return Err(
            "Ovaj signing wallet već je odobrio transakciju. Odaberite drugi ključ.".into(),
        );
    }
    let passphrase = Zeroizing::new(passphrase);
    let mut traces = Vec::new();
    ensure_signet(&client, &mut traces).await?;
    let wallet = verify_signing_wallet(&client, "Signer", &wallet_name, &mut traces).await?;
    if wallet.encrypted && passphrase.is_empty() {
        return Err(format!(
            "{wallet_name} je zaključan. Bitcoin je siguran; unesite njegovu lozinku za potpis."
        ));
    }

    if wallet.encrypted {
        client
            .call(
                "walletpassphrase",
                json!({ "passphrase": passphrase.as_str(), "timeout": 5 }),
                Some(&wallet_name),
                "Bitcoin Core otključava odabrani signing wallet na najviše pet sekundi.",
                Some(json!({ "passphrase": "[REDACTED]", "timeout": 5 })),
                false,
                &mut traces,
            )
            .await?;
    }

    let process_result = client
        .call(
            "walletprocesspsbt",
            json!({
                "psbt": snapshot.psbt,
                "sign": true,
                "sighashtype": "ALL",
                "bip32derivs": true
            }),
            Some(&wallet_name),
            "Bitcoin Core dodaje potpis iz ovog signing walleta u PSBT.",
            Some(json!({ "psbt": "[REDACTED]", "sign": true, "sighashtype": "ALL" })),
            true,
            &mut traces,
        )
        .await;

    if wallet.encrypted {
        let _ = client
            .call(
                "walletlock",
                json!({}),
                Some(&wallet_name),
                "Bitcoin Core odmah ponovno zaključava signing wallet.",
                None,
                false,
                &mut traces,
            )
            .await;
    }

    let processed = process_result?;
    let updated_psbt = processed
        .get("psbt")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Bitcoin Core nije vratio ažurirani PSBT.".to_string())?
        .to_string();
    if updated_psbt == snapshot.psbt {
        return Err(format!(
            "{wallet_name} nije dodao potpis. Bitcoin je siguran i transakcija nije poslana."
        ));
    }

    let mut drafts = state
        .drafts
        .lock()
        .map_err(|_| "Interni transaction state nije dostupan.".to_string())?;
    let draft = drafts
        .get_mut(&draft_id)
        .ok_or_else(|| "Transaction draft više nije dostupan; izradite novi.".to_string())?;
    if draft.psbt != snapshot.psbt {
        return Err(
            "Transaction draft promijenjen je drugim potpisom. Ponovno učitajte stanje.".into(),
        );
    }
    draft.psbt = updated_psbt;
    draft.signed_by.push(wallet_name);
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

pub async fn finalize_and_broadcast(
    client: RpcClient,
    state: &AppState,
    draft_id: String,
) -> Result<Operation<BroadcastResult>, String> {
    let snapshot = state
        .drafts
        .lock()
        .map_err(|_| "Interni transaction state nije dostupan.".to_string())?
        .get(&draft_id)
        .cloned()
        .ok_or_else(|| "Transaction draft više nije dostupan; izradite novi.".to_string())?;
    if snapshot.signed_by.len() < 2 || !snapshot.complete {
        return Err("Transakcija treba još potpisa. Nije finalizirana niti poslana.".into());
    }
    let mut traces = Vec::new();
    ensure_signet(&client, &mut traces).await?;
    verify_coordinator(&client, &snapshot.coordinator_name, &mut traces).await?;
    let finalized = client
        .call(
            "finalizepsbt",
            json!({ "psbt": snapshot.psbt, "extract": true }),
            None,
            "Bitcoin Core provjerava potpise i finalizira transakciju.",
            Some(json!({ "psbt": "[REDACTED]", "extract": true })),
            true,
            &mut traces,
        )
        .await?;
    if finalized.get("complete").and_then(Value::as_bool) != Some(true) {
        return Err(
            "Bitcoin Core nije potvrdio dovoljan broj potpisa. Transakcija nije poslana.".into(),
        );
    }
    let raw_hex = finalized
        .get("hex")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Bitcoin Core nije vratio finalizirani transaction hex.".to_string())?;
    let txid = client
        .call(
            "sendrawtransaction",
            json!({ "hexstring": raw_hex }),
            None,
            "Lokalni Bitcoin Core broadcasta finaliziranu transakciju na Signet.",
            Some(json!({ "hexstring": "[REDACTED]" })),
            false,
            &mut traces,
        )
        .await?
        .as_str()
        .filter(|value| value.len() == 64)
        .ok_or_else(|| "Bitcoin Core nije vratio valjani txid.".to_string())?
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
            "Nakon broadcasta osvježava lokalni vault balance i provjerava change.",
            None,
            false,
            &mut traces,
        )
        .await;
    let (remaining_sats, balance_refreshed) = match refreshed_balances {
        Ok(value) => (btc_to_sats(wallet_balance_btc(&value)), true),
        Err(_) => (estimated_remaining, false),
    };
    state
        .drafts
        .lock()
        .map_err(|_| "Interni transaction state nije dostupan.".to_string())?
        .remove(&draft_id);
    Ok(Operation {
        data: BroadcastResult {
            txid,
            starting_balance_sats: snapshot.starting_balance_sats,
            sent_sats: snapshot.amount_sats,
            fee_sats,
            remaining_sats,
            balance_refreshed,
        },
        rpc: traces,
    })
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
            "Provjerava sigurnosne invarijante signing walleta.",
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
            "STOP: {wallet_name} nije descriptor signing wallet s uključenim privatnim ključevima."
        ));
    }
    Ok(SigningWallet {
        label: label.into(),
        name: wallet_name.into(),
        descriptors,
        private_keys_enabled,
        encrypted: info.get("unlocked_until").is_some(),
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
            "Provjerava da coordinator nema privatne ključeve.",
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
            "STOP: coordinator nije watch-only descriptor wallet bez privatnih ključeva.".into(),
        );
    }
    Ok(())
}

fn extract_descriptor_pair(result: &Value) -> Result<(DescriptorKey, DescriptorKey), String> {
    let descriptors = result
        .get("descriptors")
        .and_then(Value::as_array)
        .ok_or_else(|| "listdescriptors odgovor nema očekivani descriptors popis.".to_string())?;
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
            "STOP: očekivan je jedan javni wpkh receive /0/* i jedan change /1/* descriptor; pronađeno {} i {}.",
            receive.len(),
            change.len()
        ));
    }
    Ok((receive.remove(0), change.remove(0)))
}

fn parse_wpkh_descriptor(desc: &str) -> Result<DescriptorKey, String> {
    if contains_private_material(desc) {
        return Err("STOP: listdescriptors odgovor sadrži privatni key materijal.".into());
    }
    let without_checksum = desc.split('#').next().unwrap_or(desc);
    let inner = without_checksum
        .strip_prefix("wpkh([")
        .and_then(|value| value.strip_suffix(')'))
        .ok_or_else(|| "wpkh descriptor nema očekivanu javnu origin strukturu.".to_string())?;
    let closing = inner
        .find(']')
        .ok_or_else(|| "Descriptor nema master fingerprint i derivation path.".to_string())?;
    let origin = &inner[..closing];
    let key_path = &inner[closing + 1..];
    if origin.len() < 10 {
        return Err("Descriptor origin nije potpun.".into());
    }
    let (fingerprint, derivation_path) = origin.split_at(8);
    if !fingerprint.chars().all(|value| value.is_ascii_hexdigit())
        || !derivation_path.starts_with('/')
    {
        return Err("Descriptor master fingerprint ili derivation path nije valjan.".into());
    }
    let (tpub, branch) = if let Some(value) = key_path.strip_suffix("/0/*") {
        (value, 0)
    } else if let Some(value) = key_path.strip_suffix("/1/*") {
        (value, 1)
    } else {
        return Err("Descriptor nije očekivana ranged /0/* ili /1/* grana.".into());
    };
    if !tpub.starts_with("tpub")
        || tpub.len() < 100
        || !tpub.chars().all(|value| value.is_ascii_alphanumeric())
    {
        return Err("Descriptor ne sadrži očekivani Signet/Testnet javni tpub.".into());
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
        if receive_key.fingerprint != change_key.fingerprint
            || receive_key.tpub != change_key.tpub
            || receive_key.derivation_path != change_key.derivation_path
        {
            return Err(format!(
                "STOP: {} receive i change javni podaci ne pripadaju istom signing walletu.",
                receive[index].0
            ));
        }
    }
    for left in 0..3 {
        for right in (left + 1)..3 {
            if receive[left].2.fingerprint == receive[right].2.fingerprint
                || receive[left].2.tpub == receive[right].2.tpub
            {
                return Err(
                    "STOP: K1, K2 i K3 moraju imati različite fingerprinte i tpubove.".into(),
                );
            }
        }
    }
    let path = &receive[0].2.derivation_path;
    if receive
        .iter()
        .any(|(_, _, key)| &key.derivation_path != path)
    {
        return Err("STOP: signing walleti nemaju kompatibilnu derivation path strukturu.".into());
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
            &format!("Bitcoin Core validira {branch_name} policy i dodaje službeni checksum."),
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
            "STOP: Bitcoin Core nije potvrdio sigurnosne uvjete za {branch_name} descriptor."
        ));
    }
    let checksummed = result
        .get("descriptor")
        .and_then(Value::as_str)
        .filter(|value| value.contains('#'))
        .ok_or_else(|| "Bitcoin Core nije vratio checksummed descriptor.".to_string())?;
    if contains_private_material(checksummed) {
        return Err("STOP: validirani descriptor sadrži privatni key materijal.".into());
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
            "Traži slobodno lokalno ime za watch-only coordinator.",
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
    Err("Nije moguće pronaći slobodno sigurno ime za coordinator wallet.".into())
}

fn validate_import_result(result: &Value) -> Result<(), String> {
    let entries = result
        .as_array()
        .ok_or_else(|| "importdescriptors nije vratio očekivana dva rezultata.".to_string())?;
    if entries.len() != 2
        || entries
            .iter()
            .any(|entry| entry.get("success").and_then(Value::as_bool) != Some(true))
    {
        return Err("STOP: receive i change descriptor nisu oba uspješno importana.".into());
    }
    Ok(())
}

fn validate_label(label: &str) -> Result<(), String> {
    if matches!(label, "K1" | "K2" | "K3") {
        Ok(())
    } else {
        Err("Signing wallet label mora biti K1, K2 ili K3.".into())
    }
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
