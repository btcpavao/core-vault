mod harness;

#[cfg(test)]
mod tests {
    use super::harness::{require_regtest_chain, RegtestNode};
    use crate::{
        file_capabilities::{issue_test_capability, FileOperation},
        personal,
        security::contains_private_material,
        types::{AppState, MempoolPreflightView},
        vault,
    };
    use serde_json::Value;

    const ORIGINAL_WALLET: &str = "golden_personal";
    const RESTORED_WALLET: &str = "golden_personal_recovered";
    const MINER_WALLET: &str = "golden_fixture_miner";
    const LEGACY_SIGNER_WALLET: &str = "atomic_legacy_signer_k1";
    const FUNDED_SATS: u64 = 100_000_000;
    const SIGNING_PROOF_SATS: u64 = 10_000;

    // Test fixture only. It is never loaded from or written to production configuration.
    const TEST_ONLY_PASSPHRASE: &str = "regtest-only-copper-harbor-lantern-42";

    #[test]
    fn rejects_non_regtest_before_fixture_mutation() {
        assert!(require_regtest_chain(Some("regtest")).is_ok());
        for chain in [Some("main"), Some("signet"), Some("test"), None] {
            let error = require_regtest_chain(chain)
                .expect_err("only an explicitly identified Regtest chain may mutate fixtures");
            assert!(error.starts_with("STOP:"));
        }
    }

    #[test]
    #[ignore = "requires an explicit real-bitcoind Regtest run"]
    fn personal_vault_backup_restore_roundtrip() {
        test_runtime().block_on(async {
            run_golden_recovery()
                .await
                .unwrap_or_else(|error| panic!("golden Regtest recovery failed: {error}"));
        });
    }

    #[test]
    #[ignore = "requires an explicit real-bitcoind Regtest run"]
    fn legacy_signer_is_created_atomically_encrypted() {
        test_runtime().block_on(async {
            run_atomic_legacy_signer_creation()
                .await
                .unwrap_or_else(|error| {
                    panic!("atomic legacy signer Regtest proof failed: {error}")
                });
        });
    }

    async fn run_atomic_legacy_signer_creation() -> Result<(), String> {
        let node = RegtestNode::start().await?;
        let client = node.client();

        node.assert_regtest().await?;
        let created = vault::create_signing_wallet(
            client,
            "K1".into(),
            LEGACY_SIGNER_WALLET.into(),
            TEST_ONLY_PASSPHRASE.into(),
        )
        .await
        .map_err(|error| stage("atomic encrypted legacy signer creation", error))?;

        assert!(created.data.descriptors);
        assert!(created.data.private_keys_enabled);
        assert!(created.data.encrypted);
        assert!(created.data.locked);
        let identity =
            created.data.public_identity.as_ref().ok_or_else(|| {
                "legacy signer creation did not return public identity".to_string()
            })?;
        assert_eq!(identity.label, "K1");
        assert_eq!(identity.wallet_name, LEGACY_SIGNER_WALLET);
        assert_eq!(identity.fingerprint.len(), 8);
        assert_eq!(identity.derivation_path, "/84h/1h/0h");
        assert!(identity.tpub.starts_with("tpub"));

        let wallet_info = node.wallet_info(LEGACY_SIGNER_WALLET).await?;
        assert_wallet_is_encrypted_locked_descriptor(&wallet_info)?;

        let serialized = serde_json::to_string(&created)
            .map_err(|error| stage("legacy signer public result serialization", error))?;
        assert!(!serialized.contains(TEST_ONLY_PASSPHRASE));
        assert!(!contains_private_material(&serialized));
        let methods = created
            .rpc
            .iter()
            .map(|trace| trace.method.as_str())
            .collect::<Vec<_>>();
        assert_eq!(
            methods,
            [
                "getblockchaininfo",
                "createwallet",
                "getwalletinfo",
                "listdescriptors"
            ]
        );
        assert!(!methods.contains(&"encryptwallet"));
        assert!(!methods.contains(&"walletpassphrase"));

        let report = node.shutdown().await?;
        assert!(report.graceful, "the owned bitcoind must stop through RPC");
        if !report.preserved_for_debug {
            assert!(
                report.cleaned,
                "the owned temporary datadir must be removed"
            );
        }
        Ok(())
    }

    async fn run_golden_recovery() -> Result<(), String> {
        let node = RegtestNode::start().await?;
        let client = node.client();
        let state = AppState::default();

        node.assert_regtest().await?;
        let created = personal::create_personal_vault(
            client.clone(),
            &state,
            ORIGINAL_WALLET.into(),
            "Golden Personal Vault".into(),
            TEST_ONLY_PASSPHRASE.into(),
        )
        .await
        .map_err(|error| stage("encrypted wallet creation", error))?;
        assert_eq!(created.data.network, "regtest");
        assert!(created.data.encrypted, "wallet must be encrypted");
        assert!(created.data.locked, "encrypted wallet must be locked");
        assert!(created.data.private_keys_enabled);
        assert!(created.data.descriptors);

        let wallet_info = node.wallet_info(ORIGINAL_WALLET).await?;
        assert_wallet_is_encrypted_locked_descriptor(&wallet_info)?;

        node.assert_regtest().await?;
        let receive = personal::create_receive_address(
            client.clone(),
            ORIGINAL_WALLET.into(),
            "golden recovery address".into(),
        )
        .await
        .map_err(|error| stage("receive address", error))?;
        assert_eq!(receive.data.network, "regtest");
        assert!(receive.data.wallet_owned);
        assert!(!receive.data.address.is_empty());

        node.create_fixture_wallet(MINER_WALLET).await?;
        let miner_address = node.new_address(MINER_WALLET, "fixture miner").await?;
        node.mine_blocks(101, &miner_address).await?;
        node.fund_address(
            MINER_WALLET,
            &receive.data.address,
            FUNDED_SATS,
            &miner_address,
        )
        .await?;

        let funded = personal::get_personal_vault(client.clone(), &state, ORIGINAL_WALLET.into())
            .await
            .map_err(|error| stage("confirmed original balance", error))?;
        assert_eq!(
            funded.data.vault.balance_sats, FUNDED_SATS,
            "production satoshi projection must show the confirmed fixture amount"
        );

        let backup_path = node.artifact_path("golden-personal-wallet.dat")?;
        let backup_capability = issue_test_capability(
            &state,
            backup_path.clone(),
            FileOperation::PersonalBackupDestination,
        )
        .map_err(|error| stage("backup destination capability", error))?;
        node.assert_regtest().await?;
        let backup = personal::backup_personal_vault(
            client.clone(),
            &state,
            ORIGINAL_WALLET.into(),
            backup_capability,
        )
        .await
        .map_err(|error| stage("backupwallet", error))?;
        let canonical_backup_path = backup_path
            .canonicalize()
            .map_err(|error| stage("canonical backup path", error))?;
        assert_eq!(backup.data.path, canonical_backup_path.to_string_lossy());
        assert!(backup.data.size_bytes > 0);
        assert_eq!(backup.data.sha256.len(), 64);
        let backup_metadata = std::fs::metadata(&backup_path)
            .map_err(|error| stage("backup file metadata", error))?;
        assert!(backup_metadata.is_file());
        assert!(backup_metadata.len() > 0);

        let original_fingerprint = funded.data.vault.public_fingerprint.clone();
        assert_eq!(original_fingerprint.len(), 64);

        let restore_capability = issue_test_capability(
            &state,
            backup_path.clone(),
            FileOperation::PersonalRestoreSource,
        )
        .map_err(|error| stage("restore source capability", error))?;
        node.assert_regtest().await?;
        let restored = personal::restore_personal_vault(
            client.clone(),
            &state,
            ORIGINAL_WALLET.into(),
            RESTORED_WALLET.into(),
            restore_capability,
        )
        .await
        .map_err(|error| stage("restorewallet", error))?;
        assert!(restored.data.fingerprints_match);
        assert_eq!(restored.data.public_fingerprint, original_fingerprint);

        let restored_address_info = node
            .address_info(RESTORED_WALLET, &receive.data.address)
            .await?;
        assert_eq!(
            restored_address_info.get("ismine").and_then(Value::as_bool),
            Some(true),
            "restored wallet must own the pre-backup receiving address"
        );
        assert_eq!(
            restored_address_info
                .get("solvable")
                .and_then(Value::as_bool),
            Some(true)
        );

        let recovered =
            personal::get_personal_vault(client.clone(), &state, RESTORED_WALLET.into())
                .await
                .map_err(|error| stage("recovered balance", error))?;
        assert_eq!(recovered.data.vault.balance_sats, FUNDED_SATS);
        assert_eq!(
            recovered.data.vault.public_fingerprint,
            original_fingerprint
        );

        let signing_destination = node.new_address(MINER_WALLET, "signing proof").await?;
        node.assert_regtest().await?;
        let proposal = personal::create_spend_proposal(
            client.clone(),
            &state,
            RESTORED_WALLET.into(),
            signing_destination,
            SIGNING_PROOF_SATS,
            2.0,
        )
        .await
        .map_err(|error| stage("restored signing proposal", error))?;
        let unsigned_psbt = draft_psbt(&state, &proposal.data.draft_id)?;

        node.assert_regtest().await?;
        let signed = personal::sign_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            TEST_ONLY_PASSPHRASE.into(),
        )
        .await
        .map_err(|error| stage("restored signing authority", error))?;
        let signed_psbt = draft_psbt(&state, &proposal.data.draft_id)?;
        assert_ne!(signed_psbt, unsigned_psbt, "signing must mutate the PSBT");
        assert!(
            signed.data.complete,
            "single-signature PSBT must be complete"
        );

        node.assert_regtest().await?;
        let finalized = personal::finalize_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
        )
        .await
        .map_err(|error| stage("restored spend finalization", error))?;
        assert!(matches!(
            finalized.data.mempool_preflight,
            MempoolPreflightView::NotRun
        ));
        assert_eq!(finalized.data.state, "preflight-required");

        node.assert_regtest().await?;
        let preflight = personal::preflight_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
        )
        .await
        .map_err(|error| stage("real Core mempool preflight", error))?;
        assert!(matches!(
            preflight.data.mempool_preflight,
            MempoolPreflightView::Accepted
        ));
        assert_eq!(preflight.data.state, "ready-to-broadcast");

        let restored_after_sign =
            personal::get_personal_vault(client.clone(), &state, RESTORED_WALLET.into())
                .await
                .map_err(|error| stage("wallet relock inspection", error))?;
        assert!(restored_after_sign.data.vault.locked);

        node.assert_regtest().await?;
        personal::unload_wallet(client.clone(), RESTORED_WALLET.into())
            .await
            .map_err(|error| stage("restored-copy unload", error))?;
        let loaded_wallets = node.loaded_wallets().await?;
        assert!(loaded_wallets.iter().any(|name| name == ORIGINAL_WALLET));
        assert!(!loaded_wallets.iter().any(|name| name == RESTORED_WALLET));

        let original_after_restore =
            personal::get_personal_vault(client, &state, ORIGINAL_WALLET.into())
                .await
                .map_err(|error| stage("original wallet preservation", error))?;
        assert_eq!(
            original_after_restore.data.vault.public_fingerprint,
            original_fingerprint
        );
        assert_eq!(original_after_restore.data.vault.balance_sats, FUNDED_SATS);

        let report = node.shutdown().await?;
        assert!(report.graceful, "the owned bitcoind must stop through RPC");
        if !report.preserved_for_debug {
            assert!(
                report.cleaned,
                "the owned temporary datadir must be removed"
            );
        }
        Ok(())
    }

    fn assert_wallet_is_encrypted_locked_descriptor(info: &Value) -> Result<(), String> {
        if info.get("descriptors").and_then(Value::as_bool) != Some(true) {
            return Err("encryption inspection: wallet is not a descriptor wallet".into());
        }
        if info.get("private_keys_enabled").and_then(Value::as_bool) != Some(true) {
            return Err("encryption inspection: private keys are not enabled".into());
        }
        if info.get("unlocked_until").and_then(Value::as_i64) != Some(0) {
            return Err("encryption inspection: wallet is not encrypted and locked".into());
        }
        Ok(())
    }

    fn draft_psbt(state: &AppState, draft_id: &str) -> Result<String, String> {
        state
            .personal_drafts
            .lock()
            .map_err(|_| "signing proof: PSBT state lock failed".to_string())?
            .get(draft_id)
            .map(|draft| draft.psbt.clone())
            .ok_or_else(|| "signing proof: expected PSBT draft is missing".to_string())
    }

    fn stage(label: &str, error: impl std::fmt::Display) -> String {
        format!("{label}: {error}")
    }

    fn test_runtime() -> tokio::runtime::Runtime {
        tokio::runtime::Builder::new_multi_thread()
            .worker_threads(2)
            .enable_all()
            .build()
            .expect("build Regtest integration runtime")
    }
}
