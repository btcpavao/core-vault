mod harness;

#[cfg(test)]
mod tests {
    use super::harness::{require_regtest_chain, RegtestNode};
    use crate::{
        broadcast_authorization::{BroadcastConfirmer, BroadcastPurpose, BroadcastSummary},
        file_capabilities::{issue_test_capability, FileOperation},
        personal, rpc,
        security::contains_private_material,
        types::{
            finalized_transaction_identity, AppState, MempoolPreflight, MempoolPreflightView,
            PersonalSpendState, SpendState,
        },
        vault,
    };
    use serde_json::Value;
    use std::{
        collections::HashSet,
        sync::atomic::{AtomicUsize, Ordering},
    };

    const ORIGINAL_WALLET: &str = "golden_personal";
    const RESTORED_WALLET: &str = "golden_personal_recovered";
    const MINER_WALLET: &str = "golden_fixture_miner";
    const SPEND_WALLET: &str = "golden_personal_spend";
    const DESTINATION_WALLET: &str = "golden_spend_destination";
    const MULTISIG_SIGNER_A: &str = "golden_multisig_signer_a";
    const MULTISIG_SIGNER_B: &str = "golden_multisig_signer_b";
    const MULTISIG_SIGNER_C: &str = "golden_multisig_signer_c";
    const MULTISIG_COORDINATOR: &str = "golden_multisig_coordinator";
    const MULTISIG_MINER: &str = "golden_multisig_miner";
    const MULTISIG_DESTINATION: &str = "golden_multisig_destination";
    const LEGACY_SIGNER_WALLET: &str = "atomic_legacy_signer_k1";
    const FUNDED_SATS: u64 = 100_000_000;
    const SIGNING_PROOF_SATS: u64 = 10_000;
    const GOLDEN_SPEND_SATS: u64 = 25_000_000;
    const GOLDEN_FEE_RATE_SAT_VB: f64 = 2.0;
    const MULTISIG_FUNDED_SATS: u64 = 100_000_000;
    const MULTISIG_SPEND_SATS: u64 = 25_000_000;

    // Test fixture only. It is never loaded from or written to production configuration.
    const TEST_ONLY_PASSPHRASE: &str = "regtest-only-copper-harbor-lantern-42";
    const SIGNER_A_TEST_PASSPHRASE: &str = "regtest-only-signer-a-copper-harbor-41";
    const SIGNER_B_TEST_PASSPHRASE: &str = "regtest-only-signer-b-silver-orchard-42";
    const SIGNER_C_TEST_PASSPHRASE: &str = "regtest-only-signer-c-bronze-lantern-43";

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

    #[test]
    #[ignore = "requires an explicit real-bitcoind Regtest run"]
    fn golden_personal_vault_spend_lifecycle() {
        test_runtime().block_on(async {
            run_golden_personal_spend()
                .await
                .unwrap_or_else(|error| panic!("golden Personal Vault spend failed: {error}"));
        });
    }

    #[test]
    #[ignore = "requires an explicit real-bitcoind Regtest run"]
    fn golden_two_of_three_multisig_lifecycle() {
        test_runtime().block_on(async {
            run_golden_two_of_three_multisig()
                .await
                .unwrap_or_else(|error| panic!("golden 2-of-3 multisig failed: {error}"));
        });
    }

    struct ExpectedBroadcastConfirmer {
        wallet_name: String,
        destination: String,
        amount_sats: u64,
        fee_sats: u64,
        network: String,
        calls: AtomicUsize,
    }

    impl ExpectedBroadcastConfirmer {
        fn new(wallet_name: &str, destination: &str, amount_sats: u64, fee_sats: u64) -> Self {
            Self {
                wallet_name: wallet_name.into(),
                destination: destination.into(),
                amount_sats,
                fee_sats,
                network: "regtest".into(),
                calls: AtomicUsize::new(0),
            }
        }

        fn for_network(
            wallet_name: &str,
            destination: &str,
            amount_sats: u64,
            fee_sats: u64,
            network: &str,
        ) -> Self {
            Self {
                wallet_name: wallet_name.into(),
                destination: destination.into(),
                amount_sats,
                fee_sats,
                network: network.into(),
                calls: AtomicUsize::new(0),
            }
        }

        fn calls(&self) -> usize {
            self.calls.load(Ordering::SeqCst)
        }
    }

    impl BroadcastConfirmer for ExpectedBroadcastConfirmer {
        fn confirm(&self, summary: &BroadcastSummary) -> Result<bool, String> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if summary.vault_name != self.wallet_name
                || summary.destination != self.destination
                || summary.amount_sats != self.amount_sats
                || summary.fee_sats != self.fee_sats
                || summary.network != self.network
            {
                return Err("stage: authorization summary does not match reviewed spend".into());
            }
            Ok(true)
        }
    }

    async fn run_golden_personal_spend() -> Result<(), String> {
        let node = RegtestNode::start()
            .await
            .map_err(|error| stage("Regtest node startup", error))?;
        let client = node.client();
        let state = AppState::default();

        node.assert_regtest()
            .await
            .map_err(|error| stage("chain safety", error))?;
        let core_version = node
            .core_version()
            .await
            .map_err(|error| stage("Bitcoin Core version", error))?;
        if core_version != 310_100 {
            return Err(format!(
                "Bitcoin Core version: expected 31.1 (310100), received {core_version}"
            ));
        }

        let created = personal::create_personal_vault(
            client.clone(),
            &state,
            SPEND_WALLET.into(),
            "Golden Personal Spend".into(),
            TEST_ONLY_PASSPHRASE.into(),
        )
        .await
        .map_err(|error| stage("Personal Vault creation", error))?;
        assert_eq!(created.data.network, "regtest", "stage: chain safety");
        assert!(created.data.descriptors, "stage: wallet descriptor state");
        assert!(
            created.data.private_keys_enabled,
            "stage: wallet private-key state"
        );
        assert!(created.data.encrypted, "stage: wallet encryption");
        assert!(created.data.locked, "stage: wallet locked state");
        assert_wallet_is_encrypted_locked_descriptor(
            &node
                .wallet_info(SPEND_WALLET)
                .await
                .map_err(|error| stage("wallet locked state", error))?,
        )?;

        let receive = personal::create_receive_address(
            client.clone(),
            SPEND_WALLET.into(),
            "golden spend funding".into(),
        )
        .await
        .map_err(|error| stage("receive address", error))?;
        assert_eq!(receive.data.network, "regtest", "stage: receive address");
        assert_eq!(
            receive.data.address_type, "bech32m",
            "stage: receive address"
        );
        assert!(
            receive.data.wallet_owned,
            "stage: receive address ownership"
        );
        let receive_info = node
            .address_info(SPEND_WALLET, &receive.data.address)
            .await
            .map_err(|error| stage("receive address Core inspection", error))?;
        assert_eq!(
            receive_info.get("ismine").and_then(Value::as_bool),
            Some(true),
            "stage: receive address ownership"
        );
        assert_eq!(
            receive_info.get("witness_version").and_then(Value::as_u64),
            Some(1),
            "stage: receive address type"
        );

        node.create_fixture_wallet(MINER_WALLET)
            .await
            .map_err(|error| stage("funding wallet creation", error))?;
        let miner_address = node
            .new_address(MINER_WALLET, "golden spend miner")
            .await
            .map_err(|error| stage("miner address", error))?;
        node.mine_blocks(101, &miner_address)
            .await
            .map_err(|error| stage("coinbase maturity", error))?;
        node.fund_address(
            MINER_WALLET,
            &receive.data.address,
            FUNDED_SATS,
            &miner_address,
        )
        .await
        .map_err(|error| stage("funding and confirmation", error))?;

        let funded = personal::get_personal_vault(client.clone(), &state, SPEND_WALLET.into())
            .await
            .map_err(|error| stage("confirmed balance", error))?;
        assert_eq!(
            funded.data.vault.balance_sats, FUNDED_SATS,
            "stage: confirmed balance"
        );

        node.create_fixture_wallet(DESTINATION_WALLET)
            .await
            .map_err(|error| stage("destination creation", error))?;
        let destination = node
            .new_address(DESTINATION_WALLET, "golden spend recipient")
            .await
            .map_err(|error| stage("destination address", error))?;
        let source_destination_info = node
            .address_info(SPEND_WALLET, &destination)
            .await
            .map_err(|error| stage("destination ownership isolation", error))?;
        assert_eq!(
            source_destination_info
                .get("ismine")
                .and_then(Value::as_bool),
            Some(false),
            "stage: destination must not belong to Personal Vault"
        );

        let proposal = personal::create_spend_proposal(
            client.clone(),
            &state,
            SPEND_WALLET.into(),
            destination.clone(),
            GOLDEN_SPEND_SATS,
            GOLDEN_FEE_RATE_SAT_VB,
        )
        .await
        .map_err(|error| stage("spend proposal", error))?;
        assert_eq!(proposal.data.network, "regtest", "stage: review chain");
        assert_eq!(
            proposal.data.destination, destination,
            "stage: review destination"
        );
        assert_eq!(
            proposal.data.amount_sats, GOLDEN_SPEND_SATS,
            "stage: review amount"
        );
        assert!(proposal.data.fee_sats > 0, "stage: review fee");
        assert!(
            proposal.data.fee_sats < 100_000,
            "stage: review fee must remain sensible for deterministic Regtest spend"
        );
        let recipient_outputs = proposal
            .data
            .outputs
            .iter()
            .filter(|output| {
                !output.is_change && output.address.as_deref() == Some(destination.as_str())
            })
            .collect::<Vec<_>>();
        assert_eq!(
            recipient_outputs.len(),
            1,
            "stage: review destination output"
        );
        assert_eq!(
            recipient_outputs[0].amount_sats, GOLDEN_SPEND_SATS,
            "stage: review amount output"
        );
        let change_outputs = proposal
            .data
            .outputs
            .iter()
            .filter(|output| output.is_change)
            .collect::<Vec<_>>();
        assert_eq!(change_outputs.len(), 1, "stage: review change");
        let reviewed_output_sum = proposal
            .data
            .outputs
            .iter()
            .map(|output| output.amount_sats)
            .sum::<u64>();
        assert_eq!(
            reviewed_output_sum.saturating_add(proposal.data.fee_sats),
            FUNDED_SATS,
            "stage: review output accounting"
        );

        let unsigned = personal_draft(&state, &proposal.data.draft_id)?;
        let serialized_review = serde_json::to_string(&proposal.data)
            .map_err(|error| stage("review serialization", error))?;
        assert!(
            !serialized_review.contains(&unsigned.psbt),
            "stage: raw PSBT must remain in privileged Rust state"
        );
        let decoded_psbt = node
            .decode_psbt(&unsigned.psbt)
            .await
            .map_err(|error| stage("review PSBT decode", error))?;
        assert_review_matches_decoded(&proposal.data.outputs, &decoded_psbt, "reviewed proposal")?;

        let wrong_sign_error = personal::sign_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            "regtest-only-wrong-passphrase".into(),
        )
        .await
        .expect_err("stage: wrong passphrase must fail");
        assert!(
            !wrong_sign_error.trim().is_empty(),
            "stage: wrong passphrase failure must not be empty"
        );
        assert!(
            !wrong_sign_error.contains(TEST_ONLY_PASSPHRASE),
            "stage: wrong passphrase failure must not expose the correct passphrase"
        );
        assert_wallet_is_encrypted_locked_descriptor(
            &node
                .wallet_info(SPEND_WALLET)
                .await
                .map_err(|error| stage("wrong-passphrase lock inspection", error))?,
        )?;
        let retryable = personal_draft(&state, &proposal.data.draft_id)?;
        assert_eq!(
            retryable.psbt, unsigned.psbt,
            "stage: wrong passphrase proposal retryability"
        );
        assert!(
            retryable.raw_hex.is_none(),
            "stage: wrong passphrase must not finalize"
        );

        let signed = personal::sign_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            TEST_ONLY_PASSPHRASE.into(),
        )
        .await
        .map_err(|error| stage("signing", error))?;
        assert!(signed.data.complete, "stage: signing completeness");
        let signed_state = personal_draft(&state, &proposal.data.draft_id)?;
        assert_ne!(
            signed_state.psbt, unsigned.psbt,
            "stage: signed PSBT identity"
        );
        assert_eq!(
            signed
                .rpc
                .iter()
                .map(|trace| trace.method.as_str())
                .collect::<Vec<_>>(),
            [
                "getblockchaininfo",
                "walletpassphrase",
                "walletprocesspsbt",
                "walletlock"
            ],
            "stage: signing and relock RPC sequence"
        );
        assert_wallet_is_encrypted_locked_descriptor(
            &node
                .wallet_info(SPEND_WALLET)
                .await
                .map_err(|error| stage("wallet relock", error))?,
        )?;

        let finalized = personal::finalize_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
        )
        .await
        .map_err(|error| stage("finalization", error))?;
        assert_eq!(
            finalized.data.state, "preflight-required",
            "stage: finalization"
        );
        assert!(matches!(
            finalized.data.mempool_preflight,
            MempoolPreflightView::NotRun
        ));
        let finalized_methods = finalized
            .rpc
            .iter()
            .map(|trace| trace.method.as_str())
            .collect::<Vec<_>>();
        assert!(
            finalized_methods.contains(&"finalizepsbt"),
            "stage: finalization"
        );
        assert!(
            !finalized_methods.contains(&"sendrawtransaction"),
            "stage: no early broadcast during finalization"
        );
        let finalized_state = personal_draft(&state, &proposal.data.draft_id)?;
        let raw_hex = finalized_state
            .raw_hex
            .clone()
            .ok_or_else(|| "finalization: privileged raw transaction is missing".to_string())?;
        let transaction_identity = finalized_transaction_identity(&raw_hex);
        let decoded_finalized = node
            .decode_raw_transaction(&raw_hex)
            .await
            .map_err(|error| stage("finalized transaction decode", error))?;
        let predicted_txid = decoded_finalized
            .get("txid")
            .and_then(Value::as_str)
            .filter(|value| is_txid(value))
            .ok_or_else(|| "finalization: decoderawtransaction returned invalid txid".to_string())?
            .to_string();
        assert_review_matches_decoded(
            &proposal.data.outputs,
            &decoded_finalized,
            "finalized transaction",
        )?;
        assert!(
            !node
                .mempool_contains(&predicted_txid)
                .await
                .map_err(|error| stage("pre-broadcast mempool inspection", error))?,
            "stage: no early broadcast before preflight"
        );
        assert_eq!(
            node.wallet_balance_sats(DESTINATION_WALLET)
                .await
                .map_err(|error| stage("pre-broadcast destination balance", error))?,
            0,
            "stage: destination has no confirmed funds before broadcast"
        );

        let early_broadcast = personal::broadcast_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            "renderer-cannot-authorize".into(),
        )
        .await
        .expect_err("stage: broadcast before preflight must fail");
        assert!(
            early_broadcast.contains("Mempool provjera nije izvršena"),
            "stage: broadcast-before-preflight gate"
        );

        let preflight = personal::preflight_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
        )
        .await
        .map_err(|error| stage("strict mempool preflight", error))?;
        assert_eq!(
            preflight.data.state, "ready-to-broadcast",
            "stage: preflight"
        );
        assert!(matches!(
            preflight.data.mempool_preflight,
            MempoolPreflightView::Accepted
        ));
        let ready_state = personal_draft(&state, &proposal.data.draft_id)?;
        assert!(matches!(
            ready_state.mempool_preflight,
            MempoolPreflight::Accepted {
                ref transaction_identity
            } if transaction_identity == &finalized_transaction_identity(&raw_hex)
        ));
        assert_eq!(
            finalized_transaction_identity(&raw_hex),
            transaction_identity,
            "stage: preflight transaction identity binding"
        );
        assert!(
            !node
                .mempool_contains(&predicted_txid)
                .await
                .map_err(|error| stage("post-preflight mempool inspection", error))?,
            "stage: preflight must not broadcast"
        );

        let disabled_confirmer = ExpectedBroadcastConfirmer::new(
            SPEND_WALLET,
            &destination,
            GOLDEN_SPEND_SATS,
            proposal.data.fee_sats,
        );
        let disabled_grant = personal::request_personal_broadcast_authorization_with(
            &state,
            &proposal.data.draft_id,
            &disabled_confirmer,
        )
        .map_err(|error| stage("broadcast authorization", error))?
        .ok_or_else(|| "broadcast authorization: approval did not mint a token".to_string())?;
        assert_eq!(
            disabled_confirmer.calls(),
            1,
            "stage: broadcast authorization"
        );
        assert_eq!(disabled_grant.authorization_id.len(), 64);
        assert!(!disabled_grant
            .authorization_id
            .contains(&proposal.data.draft_id));

        let network_disabled_error = personal::broadcast_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            disabled_grant.authorization_id.clone(),
        )
        .await
        .expect_err("stage: network-disabled broadcast must fail");
        assert!(
            network_disabled_error.contains("network activity disabled"),
            "stage: current network policy"
        );
        let replay_error = personal::broadcast_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            disabled_grant.authorization_id,
        )
        .await
        .expect_err("stage: consumed authorization replay must fail");
        assert!(
            replay_error.contains("Broadcast autorizacija nije valjana"),
            "stage: one-time authorization"
        );

        let mut network_traces = Vec::new();
        let network_status = rpc::set_network_active(&client, true, &mut network_traces)
            .await
            .map_err(|error| stage("enable Regtest P2P activity", error))?;
        assert!(network_status.network_active, "stage: enable P2P activity");

        let confirmer = ExpectedBroadcastConfirmer::new(
            SPEND_WALLET,
            &destination,
            GOLDEN_SPEND_SATS,
            proposal.data.fee_sats,
        );
        let grant = personal::request_personal_broadcast_authorization_with(
            &state,
            &proposal.data.draft_id,
            &confirmer,
        )
        .map_err(|error| stage("fresh broadcast authorization", error))?
        .ok_or_else(|| {
            "fresh broadcast authorization: approval did not mint a token".to_string()
        })?;
        assert_eq!(confirmer.calls(), 1, "stage: privileged approval");
        let broadcast = personal::broadcast_spend_proposal(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            grant.authorization_id,
        )
        .await
        .map_err(|error| stage("broadcast", error))?;
        eprintln!(
            "Golden Personal Vault Regtest txid: {}",
            broadcast.data.txid
        );
        assert_eq!(broadcast.data.txid, predicted_txid, "stage: txid identity");
        assert!(is_txid(&broadcast.data.txid), "stage: txid validity");
        assert_eq!(broadcast.data.sent_sats, GOLDEN_SPEND_SATS);
        assert_eq!(broadcast.data.fee_sats, proposal.data.fee_sats);
        assert!(
            !state
                .personal_drafts
                .lock()
                .map_err(|_| "broadcast: draft state lock failed".to_string())?
                .contains_key(&proposal.data.draft_id),
            "stage: successful broadcast draft cleanup"
        );
        assert!(
            node.mempool_contains(&broadcast.data.txid)
                .await
                .map_err(|error| stage("mempool observation", error))?,
            "stage: mempool observation"
        );

        node.mine_blocks(1, &miner_address)
            .await
            .map_err(|error| stage("block confirmation", error))?;
        assert!(
            !node
                .mempool_contains(&broadcast.data.txid)
                .await
                .map_err(|error| stage("post-confirmation mempool inspection", error))?,
            "stage: mined transaction leaves mempool"
        );
        let recipient_transaction = node
            .wallet_transaction(DESTINATION_WALLET, &broadcast.data.txid)
            .await
            .map_err(|error| stage("destination transaction", error))?;
        assert!(
            recipient_transaction
                .get("confirmations")
                .and_then(Value::as_i64)
                .unwrap_or(0)
                >= 1,
            "stage: block confirmation"
        );
        assert_eq!(
            node.wallet_balance_sats(DESTINATION_WALLET)
                .await
                .map_err(|error| stage("destination funds", error))?,
            GOLDEN_SPEND_SATS,
            "stage: destination funds received"
        );

        let sender_transaction = node
            .wallet_transaction(SPEND_WALLET, &broadcast.data.txid)
            .await
            .map_err(|error| stage("confirmed sender transaction", error))?;
        let confirmed_hex = sender_transaction
            .get("hex")
            .and_then(Value::as_str)
            .ok_or_else(|| "confirmed transaction: sender wallet did not return hex".to_string())?;
        assert_eq!(
            confirmed_hex, raw_hex,
            "stage: exact finalized transaction broadcast"
        );
        let confirmed_fee_sats = sender_transaction
            .get("fee")
            .and_then(Value::as_f64)
            .map(|fee| (fee.abs() * 100_000_000.0).round() as u64)
            .ok_or_else(|| "confirmed transaction: sender wallet did not return fee".to_string())?;
        assert_eq!(
            confirmed_fee_sats, proposal.data.fee_sats,
            "stage: reviewed fee equals confirmed fee"
        );
        let confirmed_decoded = node
            .decode_raw_transaction(confirmed_hex)
            .await
            .map_err(|error| stage("confirmed transaction decode", error))?;
        assert_review_matches_decoded(
            &proposal.data.outputs,
            &confirmed_decoded,
            "confirmed transaction",
        )?;
        let change_address = change_outputs[0]
            .address
            .as_deref()
            .ok_or_else(|| "review change: change output has no address".to_string())?;
        assert_eq!(
            node.address_info(SPEND_WALLET, change_address)
                .await
                .map_err(|error| stage("confirmed change ownership", error))?
                .get("ismine")
                .and_then(Value::as_bool),
            Some(true),
            "stage: confirmed change ownership"
        );

        let refreshed = personal::get_personal_vault(client, &state, SPEND_WALLET.into())
            .await
            .map_err(|error| stage("Personal Vault activity refresh", error))?;
        let expected_post_spend = FUNDED_SATS
            .saturating_sub(GOLDEN_SPEND_SATS)
            .saturating_sub(proposal.data.fee_sats);
        assert_eq!(
            refreshed.data.vault.balance_sats, expected_post_spend,
            "stage: post-spend balance"
        );
        let activity = refreshed
            .data
            .activity
            .iter()
            .find(|item| item.txid == broadcast.data.txid && item.category == "send")
            .ok_or_else(|| "activity refresh: confirmed send entry is missing".to_string())?;
        assert_eq!(
            activity.amount_sats,
            -(GOLDEN_SPEND_SATS as i64),
            "stage: Personal Vault activity amount"
        );
        assert!(
            activity.confirmations >= 1,
            "stage: Personal Vault activity confirmation"
        );

        let report = node
            .shutdown()
            .await
            .map_err(|error| stage("Regtest cleanup", error))?;
        assert!(report.graceful, "stage: graceful Regtest cleanup");
        if !report.preserved_for_debug {
            assert!(report.cleaned, "stage: temporary Regtest datadir cleanup");
        }
        Ok(())
    }

    async fn run_golden_two_of_three_multisig() -> Result<(), String> {
        let node = RegtestNode::start()
            .await
            .map_err(|error| stage("Regtest node startup", error))?;
        let client = node.client();
        let state = AppState::default();

        node.assert_regtest()
            .await
            .map_err(|error| stage("chain safety", error))?;
        let core_version = node
            .core_version()
            .await
            .map_err(|error| stage("Bitcoin Core version", error))?;
        if core_version != 310_100 {
            return Err(format!(
                "Bitcoin Core version: expected 31.1 (310100), received {core_version}"
            ));
        }

        let signer_specs = [
            ("K1", MULTISIG_SIGNER_A, SIGNER_A_TEST_PASSPHRASE),
            ("K2", MULTISIG_SIGNER_B, SIGNER_B_TEST_PASSPHRASE),
            ("K3", MULTISIG_SIGNER_C, SIGNER_C_TEST_PASSPHRASE),
        ];
        let mut signer_identities = Vec::new();
        for (label, wallet_name, passphrase) in signer_specs {
            let created = vault::create_signing_wallet(
                client.clone(),
                label.into(),
                wallet_name.into(),
                passphrase.into(),
            )
            .await
            .map_err(|error| stage(&format!("{label} atomic encrypted creation"), error))?;
            assert!(created.data.descriptors, "stage: {label} descriptor wallet");
            assert!(
                created.data.private_keys_enabled,
                "stage: {label} private keys enabled"
            );
            assert!(created.data.encrypted, "stage: {label} encrypted");
            assert!(created.data.locked, "stage: {label} locked");
            let public_identity = created
                .data
                .public_identity
                .clone()
                .ok_or_else(|| format!("{label}: public signer identity is missing"))?;
            assert_eq!(public_identity.wallet_name, wallet_name);
            assert_eq!(public_identity.fingerprint.len(), 8);
            assert!(public_identity.tpub.starts_with("tpub"));
            let serialized = serde_json::to_string(&created.data)
                .map_err(|error| stage(&format!("{label} public DTO"), error))?;
            assert!(!serialized.contains(passphrase));
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
                ],
                "stage: {label} atomic creation RPC sequence"
            );
            assert!(!methods.contains(&"encryptwallet"));
            assert!(!methods.contains(&"walletpassphrase"));
            assert_wallet_is_encrypted_locked_descriptor(
                &node
                    .wallet_info(wallet_name)
                    .await
                    .map_err(|error| stage(&format!("{label} Core wallet state"), error))?,
            )?;
            let descriptors = node
                .wallet_descriptors(wallet_name)
                .await
                .map_err(|error| stage(&format!("{label} public descriptors"), error))?;
            assert_signer_descriptor_pair(&descriptors, &public_identity, label)?;
            signer_identities.push(public_identity);
        }

        let distinct_fingerprints = signer_identities
            .iter()
            .map(|signer| signer.fingerprint.as_str())
            .collect::<HashSet<_>>();
        let distinct_tpubs = signer_identities
            .iter()
            .map(|signer| signer.tpub.as_str())
            .collect::<HashSet<_>>();
        assert_eq!(distinct_fingerprints.len(), 3, "stage: signer identities");
        assert_eq!(distinct_tpubs.len(), 3, "stage: signer identities");

        let coordinator = vault::build_multisig_vault(
            client.clone(),
            vec![
                MULTISIG_SIGNER_A.into(),
                MULTISIG_SIGNER_B.into(),
                MULTISIG_SIGNER_C.into(),
            ],
            Some(MULTISIG_COORDINATOR.into()),
        )
        .await
        .map_err(|error| stage("coordinator creation", error))?;
        assert_eq!(coordinator.data.policy, "2-of-3");
        assert_eq!(coordinator.data.network, "Regtest");
        assert_eq!(coordinator.data.public_backup.network, "regtest");
        assert_eq!(coordinator.data.public_backup.threshold, 2);
        assert_eq!(coordinator.data.public_backup.participants, 3);
        assert!(!coordinator.data.coordinator_has_private_keys);
        assert!(!coordinator.data.public_backup.coordinator_private_keys);
        let public_backup = serde_json::to_string(&coordinator.data.public_backup)
            .map_err(|error| stage("coordinator public policy serialization", error))?;
        assert!(!contains_private_material(&public_backup));
        for passphrase in [
            SIGNER_A_TEST_PASSPHRASE,
            SIGNER_B_TEST_PASSPHRASE,
            SIGNER_C_TEST_PASSPHRASE,
        ] {
            assert!(!public_backup.contains(passphrase));
        }
        let coordinator_info = node
            .wallet_info(MULTISIG_COORDINATOR)
            .await
            .map_err(|error| stage("coordinator Core wallet state", error))?;
        assert_eq!(
            coordinator_info.get("descriptors").and_then(Value::as_bool),
            Some(true),
            "stage: coordinator descriptor wallet"
        );
        assert_eq!(
            coordinator_info
                .get("private_keys_enabled")
                .and_then(Value::as_bool),
            Some(false),
            "stage: coordinator private keys disabled"
        );
        let actual_coordinator_descriptors = node
            .wallet_descriptors(MULTISIG_COORDINATOR)
            .await
            .map_err(|error| stage("coordinator imported descriptors", error))?;
        assert_coordinator_policy(
            &node,
            &actual_coordinator_descriptors,
            &coordinator.data.receive_descriptor,
            &coordinator.data.change_descriptor,
            &coordinator.data.signers,
        )
        .await?;

        let expected_receive = node
            .derive_address(&coordinator.data.receive_descriptor, 0)
            .await
            .map_err(|error| stage("receive policy derivation", error))?;
        let receive =
            vault::get_receive_snapshot(client.clone(), MULTISIG_COORDINATOR.into(), None)
                .await
                .map_err(|error| stage("multisig receive address", error))?;
        assert_eq!(receive.data.address, expected_receive);
        assert!(receive.data.solvable);
        assert!(receive.data.watch_only);
        assert_eq!(receive.data.balance_sats, 0);
        let receive_info = node
            .address_info(MULTISIG_COORDINATOR, &receive.data.address)
            .await
            .map_err(|error| stage("receive address Core inspection", error))?;
        assert_eq!(
            receive_info.get("solvable").and_then(Value::as_bool),
            Some(true),
            "stage: receive solvability"
        );
        assert_eq!(
            receive_info.get("ismine").and_then(Value::as_bool),
            Some(true),
            "stage: receive coordinator ownership"
        );

        node.create_fixture_wallet(MULTISIG_MINER)
            .await
            .map_err(|error| stage("multisig fixture miner", error))?;
        let miner_address = node
            .new_address(MULTISIG_MINER, "golden multisig miner")
            .await
            .map_err(|error| stage("multisig miner address", error))?;
        node.mine_blocks(101, &miner_address)
            .await
            .map_err(|error| stage("multisig coinbase maturity", error))?;
        node.fund_address(
            MULTISIG_MINER,
            &receive.data.address,
            MULTISIG_FUNDED_SATS,
            &miner_address,
        )
        .await
        .map_err(|error| stage("multisig funding", error))?;
        let funded = vault::get_receive_snapshot(
            client.clone(),
            MULTISIG_COORDINATOR.into(),
            Some(receive.data.address.clone()),
        )
        .await
        .map_err(|error| stage("coordinator confirmed balance", error))?;
        assert_eq!(funded.data.balance_sats, MULTISIG_FUNDED_SATS);

        node.create_fixture_wallet(MULTISIG_DESTINATION)
            .await
            .map_err(|error| stage("external destination wallet", error))?;
        let destination = node
            .new_address(MULTISIG_DESTINATION, "golden multisig recipient")
            .await
            .map_err(|error| stage("external destination address", error))?;
        let coordinator_destination_info = node
            .address_info(MULTISIG_COORDINATOR, &destination)
            .await
            .map_err(|error| stage("external destination isolation", error))?;
        assert_eq!(
            coordinator_destination_info
                .get("ismine")
                .and_then(Value::as_bool),
            Some(false),
            "stage: external destination must not belong to coordinator"
        );

        let proposal = vault::create_spend_draft(
            client.clone(),
            &state,
            MULTISIG_COORDINATOR.into(),
            destination.clone(),
            MULTISIG_SPEND_SATS,
            GOLDEN_FEE_RATE_SAT_VB,
        )
        .await
        .map_err(|error| stage("multisig spend proposal", error))?;
        assert_eq!(proposal.data.destination, destination);
        assert_eq!(proposal.data.amount_sats, MULTISIG_SPEND_SATS);
        assert!(proposal.data.fee_sats > 0, "stage: multisig review fee");
        assert!(proposal.data.fee_sats < 100_000, "stage: sensible fee");
        assert_eq!(proposal.data.state, "awaiting-signatures");
        assert!(proposal.data.signed_by.is_empty());
        assert!(!proposal.data.complete);
        assert!(!proposal.data.finalized);
        let unsigned = multisig_draft(&state, &proposal.data.draft_id)?;
        assert_eq!(unsigned.coordinator_name, MULTISIG_COORDINATOR);
        assert_eq!(unsigned.network, "regtest");
        assert_eq!(unsigned.starting_balance_sats, MULTISIG_FUNDED_SATS);
        assert!(unsigned.raw_hex.is_none());
        let serialized_review = serde_json::to_string(&proposal.data)
            .map_err(|error| stage("multisig review serialization", error))?;
        assert!(!serialized_review.contains(&unsigned.psbt));
        let decoded_unsigned = node
            .decode_psbt(&unsigned.psbt)
            .await
            .map_err(|error| stage("unsigned multisig PSBT decode", error))?;
        let reviewed_shape = transaction_shape(&decoded_unsigned, "unsigned multisig proposal")?;
        assert_destination_and_accounting(
            &reviewed_shape,
            &destination,
            MULTISIG_SPEND_SATS,
            proposal.data.fee_sats,
            MULTISIG_FUNDED_SATS,
        )?;
        for (address, _) in &reviewed_shape {
            if address != &destination {
                let change_info = node
                    .address_info(MULTISIG_COORDINATOR, address)
                    .await
                    .map_err(|error| stage("reviewed multisig change ownership", error))?;
                assert_eq!(
                    change_info.get("ismine").and_then(Value::as_bool),
                    Some(true),
                    "stage: reviewed change must remain under coordinator policy"
                );
            }
        }
        let reviewed_txid = decoded_txid(&decoded_unsigned, "unsigned multisig proposal")?;
        assert!(
            !node
                .mempool_contains(&reviewed_txid)
                .await
                .map_err(|error| stage("zero-signature mempool", error))?,
            "stage: zero signatures cannot broadcast"
        );

        let zero_finalize =
            vault::finalize_multisig_spend(client.clone(), &state, proposal.data.draft_id.clone())
                .await
                .expect_err("stage: zero-signature finalization must fail");
        assert!(zero_finalize.contains("još potpisa"));
        let zero_confirmer = ExpectedBroadcastConfirmer::for_network(
            MULTISIG_COORDINATOR,
            &destination,
            MULTISIG_SPEND_SATS,
            proposal.data.fee_sats,
            "Regtest",
        );
        vault::request_multisig_broadcast_authorization_with(
            &state,
            &proposal.data.draft_id,
            &zero_confirmer,
        )
        .expect_err("stage: zero signatures must block authorization");
        assert_eq!(zero_confirmer.calls(), 0);

        let wrong_passphrase_error = vault::sign_spend_draft(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            MULTISIG_SIGNER_A.into(),
            "regtest-only-wrong-multisig-passphrase".into(),
        )
        .await
        .expect_err("stage: wrong Signer A passphrase must fail");
        assert!(!wrong_passphrase_error.trim().is_empty());
        assert!(!wrong_passphrase_error.contains(SIGNER_A_TEST_PASSPHRASE));
        assert_wallet_is_encrypted_locked_descriptor(
            &node
                .wallet_info(MULTISIG_SIGNER_A)
                .await
                .map_err(|error| stage("wrong-passphrase Signer A lock", error))?,
        )?;
        let after_wrong_passphrase = multisig_draft(&state, &proposal.data.draft_id)?;
        assert_eq!(after_wrong_passphrase.psbt, unsigned.psbt);
        assert!(after_wrong_passphrase.signed_by.is_empty());

        let signer_a = vault::sign_spend_draft(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            MULTISIG_SIGNER_A.into(),
            SIGNER_A_TEST_PASSPHRASE.into(),
        )
        .await
        .map_err(|error| stage("Signer A signing", error))?;
        assert_eq!(signer_a.data.signed_by, [MULTISIG_SIGNER_A]);
        assert_eq!(signer_a.data.state, "partially-signed");
        assert!(!signer_a.data.complete);
        assert!(signer_a.data.relock_required.is_none());
        let signer_a_methods = signer_a
            .rpc
            .iter()
            .map(|trace| trace.method.as_str())
            .collect::<Vec<_>>();
        assert_eq!(
            signer_a_methods,
            [
                "getblockchaininfo",
                "getwalletinfo",
                "walletpassphrase",
                "walletprocesspsbt",
                "walletlock"
            ]
        );
        let after_signer_a = multisig_draft(&state, &proposal.data.draft_id)?;
        assert_ne!(after_signer_a.psbt, unsigned.psbt);
        assert_eq!(after_signer_a.signed_by, [MULTISIG_SIGNER_A]);
        let decoded_after_a = node
            .decode_psbt(&after_signer_a.psbt)
            .await
            .map_err(|error| stage("Signer A PSBT decode", error))?;
        assert_eq!(
            transaction_shape(&decoded_after_a, "Signer A PSBT")?,
            reviewed_shape,
            "stage: Signer A must not mutate reviewed outputs"
        );
        assert_eq!(
            decoded_txid(&decoded_after_a, "Signer A PSBT")?,
            reviewed_txid
        );
        assert_wallet_is_encrypted_locked_descriptor(
            &node
                .wallet_info(MULTISIG_SIGNER_A)
                .await
                .map_err(|error| stage("Signer A relock", error))?,
        )?;

        let one_signature_finalize =
            vault::finalize_multisig_spend(client.clone(), &state, proposal.data.draft_id.clone())
                .await
                .expect_err("stage: one-signature finalization must fail");
        assert!(one_signature_finalize.contains("još potpisa"));
        let one_signature_confirmer = ExpectedBroadcastConfirmer::for_network(
            MULTISIG_COORDINATOR,
            &destination,
            MULTISIG_SPEND_SATS,
            proposal.data.fee_sats,
            "Regtest",
        );
        vault::request_multisig_broadcast_authorization_with(
            &state,
            &proposal.data.draft_id,
            &one_signature_confirmer,
        )
        .expect_err("stage: one signature must block authorization");
        assert_eq!(one_signature_confirmer.calls(), 0);
        let one_signature_broadcast = vault::broadcast_multisig_spend(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            "renderer-cannot-authorize".into(),
        )
        .await
        .expect_err("stage: one signature must block broadcast");
        assert!(one_signature_broadcast.contains("prag potpisa"));

        let duplicate_error = vault::sign_spend_draft(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            MULTISIG_SIGNER_A.into(),
            SIGNER_A_TEST_PASSPHRASE.into(),
        )
        .await
        .expect_err("stage: duplicate Signer A must be rejected");
        assert!(duplicate_error.contains("već je odobrio"));
        let after_duplicate = multisig_draft(&state, &proposal.data.draft_id)?;
        assert_eq!(after_duplicate.psbt, after_signer_a.psbt);
        assert_eq!(after_duplicate.signed_by, [MULTISIG_SIGNER_A]);
        assert!(!after_duplicate.complete);
        assert!(after_duplicate.raw_hex.is_none());
        assert!(matches!(
            after_duplicate.mempool_preflight,
            MempoolPreflight::NotRun
        ));

        let signer_b = vault::sign_spend_draft(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            MULTISIG_SIGNER_B.into(),
            SIGNER_B_TEST_PASSPHRASE.into(),
        )
        .await
        .map_err(|error| stage("Signer B signing", error))?;
        assert_eq!(
            signer_b.data.signed_by,
            [MULTISIG_SIGNER_A, MULTISIG_SIGNER_B]
        );
        assert!(signer_b.data.complete, "stage: two-signature completeness");
        assert_eq!(signer_b.data.state, "threshold-reached");
        assert!(signer_b.data.relock_required.is_none());
        assert!(!signer_b.data.signed_by.contains(&MULTISIG_SIGNER_C.into()));
        let after_signer_b = multisig_draft(&state, &proposal.data.draft_id)?;
        assert_ne!(after_signer_b.psbt, after_signer_a.psbt);
        assert_eq!(
            after_signer_b.signed_by,
            [MULTISIG_SIGNER_A, MULTISIG_SIGNER_B]
        );
        let decoded_after_b = node
            .decode_psbt(&after_signer_b.psbt)
            .await
            .map_err(|error| stage("Signer B PSBT decode", error))?;
        assert_eq!(
            transaction_shape(&decoded_after_b, "Signer B PSBT")?,
            reviewed_shape,
            "stage: Signer B must not mutate reviewed outputs"
        );
        assert_eq!(
            decoded_txid(&decoded_after_b, "Signer B PSBT")?,
            reviewed_txid
        );
        for wallet_name in [MULTISIG_SIGNER_A, MULTISIG_SIGNER_B, MULTISIG_SIGNER_C] {
            assert_wallet_is_encrypted_locked_descriptor(
                &node
                    .wallet_info(wallet_name)
                    .await
                    .map_err(|error| stage(&format!("{wallet_name} post-sign lock"), error))?,
            )?;
        }

        let finalized =
            vault::finalize_multisig_spend(client.clone(), &state, proposal.data.draft_id.clone())
                .await
                .map_err(|error| stage("multisig finalization", error))?;
        assert!(finalized.data.finalized);
        assert_eq!(finalized.data.state, "finalized");
        assert!(matches!(
            finalized.data.mempool_preflight,
            MempoolPreflightView::NotRun
        ));
        let finalization_methods = finalized
            .rpc
            .iter()
            .map(|trace| trace.method.as_str())
            .collect::<Vec<_>>();
        assert!(finalization_methods.contains(&"finalizepsbt"));
        assert!(!finalization_methods.contains(&"testmempoolaccept"));
        assert!(!finalization_methods.contains(&"sendrawtransaction"));
        let finalized_state = multisig_draft(&state, &proposal.data.draft_id)?;
        let raw_hex = finalized_state
            .raw_hex
            .clone()
            .ok_or_else(|| "multisig finalization: privileged raw hex is missing".to_string())?;
        let transaction_identity = finalized_transaction_identity(&raw_hex);
        let decoded_finalized = node
            .decode_raw_transaction(&raw_hex)
            .await
            .map_err(|error| stage("finalized multisig decode", error))?;
        assert_eq!(
            transaction_shape(&decoded_finalized, "finalized multisig")?,
            reviewed_shape,
            "stage: finalized transaction must equal reviewed transaction"
        );
        let predicted_txid = decoded_txid(&decoded_finalized, "finalized multisig")?;
        assert_eq!(predicted_txid, reviewed_txid);
        assert!(
            !node
                .mempool_contains(&predicted_txid)
                .await
                .map_err(|error| stage("pre-preflight mempool", error))?,
            "stage: finalization must remain local"
        );

        let preflight =
            vault::preflight_multisig_spend(client.clone(), &state, proposal.data.draft_id.clone())
                .await
                .map_err(|error| stage("strict multisig preflight", error))?;
        assert_eq!(preflight.data.state, "ready-to-broadcast");
        assert!(matches!(
            preflight.data.mempool_preflight,
            MempoolPreflightView::Accepted
        ));
        let ready_state = multisig_draft(&state, &proposal.data.draft_id)?;
        assert!(matches!(
            ready_state.mempool_preflight,
            MempoolPreflight::Accepted {
                ref transaction_identity
            } if transaction_identity == &finalized_transaction_identity(&raw_hex)
        ));
        assert_eq!(ready_state.raw_hex.as_deref(), Some(raw_hex.as_str()));
        assert_eq!(
            ready_state.signed_by,
            [MULTISIG_SIGNER_A, MULTISIG_SIGNER_B]
        );
        assert!(
            !node
                .mempool_contains(&predicted_txid)
                .await
                .map_err(|error| stage("post-preflight mempool", error))?,
            "stage: preflight must not broadcast"
        );

        let disabled_confirmer = ExpectedBroadcastConfirmer::for_network(
            MULTISIG_COORDINATOR,
            &destination,
            MULTISIG_SPEND_SATS,
            proposal.data.fee_sats,
            "Regtest",
        );
        let disabled_grant = vault::request_multisig_broadcast_authorization_with(
            &state,
            &proposal.data.draft_id,
            &disabled_confirmer,
        )
        .map_err(|error| stage("multisig broadcast authorization", error))?
        .ok_or_else(|| "multisig authorization: approval did not mint a token".to_string())?;
        assert_eq!(disabled_confirmer.calls(), 1);
        assert_eq!(disabled_grant.authorization_id.len(), 64);
        assert_eq!(disabled_grant.expires_in_seconds, 180);
        assert!(!disabled_grant
            .authorization_id
            .contains(&proposal.data.draft_id));

        let network_disabled_error = vault::broadcast_multisig_spend(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            disabled_grant.authorization_id.clone(),
        )
        .await
        .expect_err("stage: network-disabled multisig broadcast must fail");
        assert!(network_disabled_error.contains("network activity disabled"));
        let preserved_after_network_stop = multisig_draft(&state, &proposal.data.draft_id)?;
        assert_eq!(
            preserved_after_network_stop.raw_hex.as_deref(),
            Some(raw_hex.as_str())
        );
        assert!(!preserved_after_network_stop.broadcast_in_progress);
        assert!(!node
            .mempool_contains(&predicted_txid)
            .await
            .map_err(|error| stage("network-disabled mempool", error))?);
        let replay_error = vault::broadcast_multisig_spend(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            disabled_grant.authorization_id,
        )
        .await
        .expect_err("stage: consumed multisig authorization must not replay");
        assert!(replay_error.contains("Broadcast autorizacija nije valjana"));

        let mut network_traces = Vec::new();
        let network_status = rpc::set_network_active(&client, true, &mut network_traces)
            .await
            .map_err(|error| stage("enable Regtest P2P activity", error))?;
        assert!(network_status.network_active);
        assert_eq!(network_status.chain.as_deref(), Some("regtest"));

        let confirmer = ExpectedBroadcastConfirmer::for_network(
            MULTISIG_COORDINATOR,
            &destination,
            MULTISIG_SPEND_SATS,
            proposal.data.fee_sats,
            "Regtest",
        );
        let grant = vault::request_multisig_broadcast_authorization_with(
            &state,
            &proposal.data.draft_id,
            &confirmer,
        )
        .map_err(|error| stage("fresh multisig authorization", error))?
        .ok_or_else(|| "fresh multisig authorization did not mint a token".to_string())?;
        assert_eq!(confirmer.calls(), 1);
        let authorization_id = grant.authorization_id.clone();
        let authorized_preflight_version = ready_state.preflight_version;
        let broadcast = vault::broadcast_multisig_spend(
            client.clone(),
            &state,
            proposal.data.draft_id.clone(),
            grant.authorization_id,
        )
        .await
        .map_err(|error| stage("multisig broadcast", error))?;
        eprintln!(
            "Golden 2-of-3 multisig Regtest txid: {}",
            broadcast.data.txid
        );
        assert!(is_txid(&broadcast.data.txid));
        assert_eq!(broadcast.data.txid, predicted_txid);
        assert_eq!(broadcast.data.starting_balance_sats, MULTISIG_FUNDED_SATS);
        assert_eq!(broadcast.data.sent_sats, MULTISIG_SPEND_SATS);
        assert_eq!(broadcast.data.fee_sats, proposal.data.fee_sats);
        assert_eq!(
            broadcast
                .rpc
                .iter()
                .filter(|trace| trace.method == "sendrawtransaction")
                .count(),
            1,
            "stage: exactly one successful sendrawtransaction"
        );
        assert!(!state
            .drafts
            .lock()
            .map_err(|_| "multisig broadcast: draft state lock failed".to_string())?
            .contains_key(&proposal.data.draft_id));
        let consumed = state
            .broadcast_authorizations
            .lock()
            .map_err(|_| "multisig broadcast: authorization store lock failed".to_string())?
            .consume(
                &authorization_id,
                BroadcastPurpose::LegacyMultisigTransaction,
                &proposal.data.draft_id,
                &transaction_identity,
                authorized_preflight_version,
            )
            .expect_err("stage: successful authorization must be consumed");
        assert!(consumed.contains("Broadcast autorizacija nije valjana"));
        assert!(node
            .mempool_contains(&broadcast.data.txid)
            .await
            .map_err(|error| stage("multisig mempool presence", error))?);

        node.mine_blocks(1, &miner_address)
            .await
            .map_err(|error| stage("multisig block confirmation", error))?;
        assert!(!node
            .mempool_contains(&broadcast.data.txid)
            .await
            .map_err(|error| stage("confirmed multisig mempool", error))?);
        assert_eq!(
            node.wallet_balance_sats(MULTISIG_DESTINATION)
                .await
                .map_err(|error| stage("multisig recipient balance", error))?,
            MULTISIG_SPEND_SATS
        );
        let recipient_transaction = node
            .wallet_transaction(MULTISIG_DESTINATION, &broadcast.data.txid)
            .await
            .map_err(|error| stage("multisig recipient transaction", error))?;
        assert!(
            recipient_transaction
                .get("confirmations")
                .and_then(Value::as_i64)
                .unwrap_or(0)
                >= 1
        );
        let coordinator_transaction = node
            .wallet_transaction(MULTISIG_COORDINATOR, &broadcast.data.txid)
            .await
            .map_err(|error| stage("confirmed coordinator transaction", error))?;
        let confirmed_hex = coordinator_transaction
            .get("hex")
            .and_then(Value::as_str)
            .ok_or_else(|| "confirmed multisig: coordinator did not return raw hex".to_string())?;
        assert_eq!(confirmed_hex, raw_hex);
        let confirmed_fee_sats = coordinator_transaction
            .get("fee")
            .and_then(Value::as_f64)
            .map(|fee| (fee.abs() * 100_000_000.0).round() as u64)
            .ok_or_else(|| "confirmed multisig: coordinator did not return fee".to_string())?;
        assert_eq!(confirmed_fee_sats, proposal.data.fee_sats);
        let confirmed_decoded = node
            .decode_raw_transaction(confirmed_hex)
            .await
            .map_err(|error| stage("confirmed multisig decode", error))?;
        assert_eq!(
            transaction_shape(&confirmed_decoded, "confirmed multisig")?,
            reviewed_shape,
            "stage: reviewed transaction must equal confirmed transaction"
        );
        assert_eq!(
            decoded_txid(&confirmed_decoded, "confirmed multisig")?,
            reviewed_txid
        );
        for (address, amount_sats) in &reviewed_shape {
            if address == &destination {
                assert_eq!(*amount_sats, MULTISIG_SPEND_SATS);
            } else {
                let change_info = node
                    .address_info(MULTISIG_COORDINATOR, address)
                    .await
                    .map_err(|error| stage("confirmed multisig change ownership", error))?;
                assert_eq!(
                    change_info.get("ismine").and_then(Value::as_bool),
                    Some(true),
                    "stage: confirmed change remains under coordinator policy"
                );
            }
        }
        let post_spend = vault::get_receive_snapshot(
            client,
            MULTISIG_COORDINATOR.into(),
            Some(receive.data.address),
        )
        .await
        .map_err(|error| stage("coordinator post-spend state", error))?;
        let expected_remaining = MULTISIG_FUNDED_SATS
            .saturating_sub(MULTISIG_SPEND_SATS)
            .saturating_sub(proposal.data.fee_sats);
        assert_eq!(post_spend.data.balance_sats, expected_remaining);

        let report = node
            .shutdown()
            .await
            .map_err(|error| stage("multisig Regtest cleanup", error))?;
        assert!(report.graceful);
        if !report.preserved_for_debug {
            assert!(report.cleaned);
        }
        Ok(())
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

    fn personal_draft(state: &AppState, draft_id: &str) -> Result<PersonalSpendState, String> {
        state
            .personal_drafts
            .lock()
            .map_err(|_| "golden spend: Personal draft state lock failed".to_string())?
            .get(draft_id)
            .cloned()
            .ok_or_else(|| "golden spend: expected Personal draft is missing".to_string())
    }

    fn multisig_draft(state: &AppState, draft_id: &str) -> Result<SpendState, String> {
        state
            .drafts
            .lock()
            .map_err(|_| "golden multisig: draft state lock failed".to_string())?
            .get(draft_id)
            .cloned()
            .ok_or_else(|| "golden multisig: expected draft is missing".to_string())
    }

    fn assert_signer_descriptor_pair(
        descriptors: &Value,
        identity: &crate::types::SignerPublic,
        stage_label: &str,
    ) -> Result<(), String> {
        let entries = descriptors
            .get("descriptors")
            .and_then(Value::as_array)
            .ok_or_else(|| format!("{stage_label}: listdescriptors has no descriptor array"))?;
        let public_wpkh = entries
            .iter()
            .filter(|entry| {
                entry
                    .get("desc")
                    .and_then(Value::as_str)
                    .is_some_and(|descriptor| descriptor.starts_with("wpkh("))
            })
            .collect::<Vec<_>>();
        let receive = public_wpkh
            .iter()
            .filter(|entry| entry.get("internal").and_then(Value::as_bool) == Some(false))
            .collect::<Vec<_>>();
        let change = public_wpkh
            .iter()
            .filter(|entry| entry.get("internal").and_then(Value::as_bool) == Some(true))
            .collect::<Vec<_>>();
        if receive.len() != 1 || change.len() != 1 {
            return Err(format!(
                "{stage_label}: expected one public receive and one public change descriptor"
            ));
        }
        let receive_descriptor = receive[0]
            .get("desc")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("{stage_label}: receive descriptor is missing"))?;
        let change_descriptor = change[0]
            .get("desc")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("{stage_label}: change descriptor is missing"))?;
        let origin = format!(
            "[{}{}]{}",
            identity.fingerprint, identity.derivation_path, identity.tpub
        );
        if !receive_descriptor.contains(&format!("{origin}/0/*"))
            || !change_descriptor.contains(&format!("{origin}/1/*"))
        {
            return Err(format!(
                "{stage_label}: receive/change descriptors do not preserve the public signer identity"
            ));
        }
        if contains_private_material(receive_descriptor)
            || contains_private_material(change_descriptor)
        {
            return Err(format!(
                "{stage_label}: public descriptor inspection exposed private material"
            ));
        }
        Ok(())
    }

    async fn assert_coordinator_policy(
        node: &RegtestNode,
        descriptors: &Value,
        expected_receive: &str,
        expected_change: &str,
        signers: &[crate::types::SignerPublic],
    ) -> Result<(), String> {
        let entries = descriptors
            .get("descriptors")
            .and_then(Value::as_array)
            .ok_or_else(|| "coordinator policy: listdescriptors has no array".to_string())?;
        if entries.len() != 2 {
            return Err(format!(
                "coordinator policy: expected exactly two imported descriptors, found {}",
                entries.len()
            ));
        }
        for (expected, internal, branch) in [
            (expected_receive, false, 0_u8),
            (expected_change, true, 1_u8),
        ] {
            let matching = entries
                .iter()
                .filter(|entry| {
                    entry.get("desc").and_then(Value::as_str) == Some(expected)
                        && entry.get("internal").and_then(Value::as_bool) == Some(internal)
                        && entry.get("active").and_then(Value::as_bool) == Some(true)
                })
                .collect::<Vec<_>>();
            if matching.len() != 1 {
                return Err(format!(
                    "coordinator policy: Core did not retain exactly one active branch {branch} descriptor"
                ));
            }
            if contains_private_material(expected) {
                return Err("coordinator policy: descriptor contains private material".into());
            }
            let (descriptor_body, checksum) = expected
                .rsplit_once('#')
                .ok_or_else(|| "coordinator policy: descriptor checksum is missing".to_string())?;
            if checksum.len() != 8
                || !checksum
                    .chars()
                    .all(|character| character.is_ascii_alphanumeric())
            {
                return Err("coordinator policy: descriptor checksum is invalid".into());
            }
            let keys = descriptor_body
                .strip_prefix("wsh(sortedmulti(2,")
                .and_then(|value| value.strip_suffix("))"))
                .ok_or_else(|| "coordinator policy: expected wsh(sortedmulti(2,...))".to_string())?
                .split(',')
                .collect::<Vec<_>>();
            if keys.len() != 3 {
                return Err("coordinator policy: expected exactly three public keys".into());
            }
            for signer in signers {
                let signer_expression = format!(
                    "[{}{}]{}/{branch}/*",
                    signer.fingerprint, signer.derivation_path, signer.tpub
                );
                if keys
                    .iter()
                    .filter(|expression| **expression == signer_expression)
                    .count()
                    != 1
                {
                    return Err(format!(
                        "coordinator policy: signer {} is not represented exactly once on branch {branch}",
                        signer.wallet_name
                    ));
                }
            }
            let info = node
                .descriptor_info(expected)
                .await
                .map_err(|error| stage("coordinator descriptor Core validation", error))?;
            if info.get("isrange").and_then(Value::as_bool) != Some(true)
                || info.get("issolvable").and_then(Value::as_bool) != Some(true)
                || info.get("hasprivatekeys").and_then(Value::as_bool) != Some(false)
            {
                return Err(
                    "coordinator policy: Core did not confirm ranged solvable public descriptor"
                        .into(),
                );
            }
        }
        Ok(())
    }

    fn transaction_shape(decoded: &Value, stage_label: &str) -> Result<Vec<(String, u64)>, String> {
        let outputs = decoded
            .pointer("/tx/vout")
            .or_else(|| decoded.get("vout"))
            .and_then(Value::as_array)
            .ok_or_else(|| format!("{stage_label}: decoded transaction has no outputs"))?;
        outputs
            .iter()
            .map(|output| {
                let address = output
                    .pointer("/scriptPubKey/address")
                    .and_then(Value::as_str)
                    .filter(|address| !address.is_empty())
                    .ok_or_else(|| format!("{stage_label}: output address is missing"))?;
                let amount_sats = output
                    .get("value")
                    .and_then(Value::as_f64)
                    .map(|amount| (amount * 100_000_000.0).round() as u64)
                    .ok_or_else(|| format!("{stage_label}: output amount is missing"))?;
                Ok((address.to_string(), amount_sats))
            })
            .collect()
    }

    fn decoded_txid(decoded: &Value, stage_label: &str) -> Result<String, String> {
        decoded
            .pointer("/tx/txid")
            .or_else(|| decoded.get("txid"))
            .and_then(Value::as_str)
            .filter(|txid| is_txid(txid))
            .map(str::to_string)
            .ok_or_else(|| format!("{stage_label}: decoded transaction has no valid txid"))
    }

    fn assert_destination_and_accounting(
        outputs: &[(String, u64)],
        destination: &str,
        amount_sats: u64,
        fee_sats: u64,
        funded_sats: u64,
    ) -> Result<(), String> {
        if outputs
            .iter()
            .filter(|(address, amount)| address == destination && *amount == amount_sats)
            .count()
            != 1
        {
            return Err(
                "multisig review: destination and amount are not present exactly once".into(),
            );
        }
        if outputs
            .iter()
            .filter(|(address, _)| address != destination)
            .count()
            != 1
        {
            return Err("multisig review: expected exactly one change output".into());
        }
        let output_total = outputs.iter().map(|(_, amount)| amount).sum::<u64>();
        if output_total.saturating_add(fee_sats) != funded_sats {
            return Err("multisig review: outputs plus fee do not equal funded input".into());
        }
        Ok(())
    }

    fn assert_review_matches_decoded(
        reviewed: &[crate::types::SpendOutputView],
        decoded: &Value,
        stage_label: &str,
    ) -> Result<(), String> {
        let outputs = decoded
            .pointer("/tx/vout")
            .or_else(|| decoded.get("vout"))
            .and_then(Value::as_array)
            .ok_or_else(|| format!("{stage_label}: decoded transaction has no outputs"))?;
        if outputs.len() != reviewed.len() {
            return Err(format!(
                "{stage_label}: decoded output count does not match review"
            ));
        }
        for reviewed_output in reviewed {
            let matches = outputs.iter().filter(|output| {
                let address = output
                    .pointer("/scriptPubKey/address")
                    .and_then(Value::as_str);
                let amount_sats = output
                    .get("value")
                    .and_then(Value::as_f64)
                    .map(|amount| (amount * 100_000_000.0).round() as u64);
                address == reviewed_output.address.as_deref()
                    && amount_sats == Some(reviewed_output.amount_sats)
            });
            if matches.count() != 1 {
                return Err(format!(
                    "{stage_label}: reviewed output is not present exactly once in decoded transaction"
                ));
            }
        }
        Ok(())
    }

    fn is_txid(value: &str) -> bool {
        value.len() == 64 && value.chars().all(|character| character.is_ascii_hexdigit())
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
