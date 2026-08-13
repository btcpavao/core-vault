use serde::Serialize;
use std::{
    collections::HashMap,
    fmt::Write as _,
    time::{Duration, Instant},
};
use tauri::{api::dialog::blocking::ask, Window, Wry};

const AUTHORIZATION_TTL: Duration = Duration::from_secs(3 * 60);
const AUTHORIZATION_ERROR: &str =
    "Broadcast autorizacija nije valjana, istekla je ili je već iskorištena. Ponovno potvrdite broadcast.";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BroadcastPurpose {
    LegacyMultisigTransaction,
}

#[derive(Debug)]
struct BroadcastAuthorization {
    purpose: BroadcastPurpose,
    draft_id: String,
    transaction_identity: String,
    preflight_version: u64,
    created_at: Instant,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BroadcastAuthorizationGrant {
    pub authorization_id: String,
    pub expires_in_seconds: u64,
}

#[derive(Clone, Debug)]
pub struct BroadcastSummary {
    pub vault_name: String,
    pub destination: String,
    pub amount_sats: u64,
    pub fee_sats: u64,
    pub network: String,
}

pub trait BroadcastConfirmer {
    fn confirm(&self, summary: &BroadcastSummary) -> Result<bool, String>;
}

pub struct NativeDialogBroadcastConfirmer {
    window: Window<Wry>,
}

impl NativeDialogBroadcastConfirmer {
    pub fn new(window: Window<Wry>) -> Self {
        Self { window }
    }
}

impl BroadcastConfirmer for NativeDialogBroadcastConfirmer {
    fn confirm(&self, summary: &BroadcastSummary) -> Result<bool, String> {
        let message = format!(
            "This sends the finalized transaction to the Bitcoin {} network.\n\nVault: {}\nDestination: {}\nAmount: {} sats\nNetwork fee: {} sats\n\nBroadcast this Bitcoin transaction?",
            summary.network,
            summary.vault_name,
            summary.destination,
            summary.amount_sats,
            summary.fee_sats
        );
        Ok(ask(
            Some(&self.window),
            "Broadcast this Bitcoin transaction?",
            message,
        ))
    }
}

#[derive(Default)]
pub struct BroadcastAuthorizationStore {
    active: HashMap<String, BroadcastAuthorization>,
}

impl BroadcastAuthorizationStore {
    pub fn issue(
        &mut self,
        purpose: BroadcastPurpose,
        draft_id: String,
        transaction_identity: String,
        preflight_version: u64,
    ) -> Result<BroadcastAuthorizationGrant, String> {
        self.issue_at(
            purpose,
            draft_id,
            transaction_identity,
            preflight_version,
            Instant::now(),
        )
    }

    fn issue_at(
        &mut self,
        purpose: BroadcastPurpose,
        draft_id: String,
        transaction_identity: String,
        preflight_version: u64,
        created_at: Instant,
    ) -> Result<BroadcastAuthorizationGrant, String> {
        self.active
            .retain(|_, authorization| authorization.created_at.elapsed() <= AUTHORIZATION_TTL);
        self.active.retain(|_, authorization| {
            authorization.purpose != purpose || authorization.draft_id != draft_id
        });

        let mut random = [0_u8; 32];
        getrandom::getrandom(&mut random)
            .map_err(|_| "Nije moguće stvoriti sigurnu broadcast autorizaciju.".to_string())?;
        let authorization_id = random.iter().fold(
            String::with_capacity(random.len() * 2),
            |mut output, byte| {
                let _ = write!(output, "{byte:02x}");
                output
            },
        );
        self.active.insert(
            authorization_id.clone(),
            BroadcastAuthorization {
                purpose,
                draft_id,
                transaction_identity,
                preflight_version,
                created_at,
            },
        );
        Ok(BroadcastAuthorizationGrant {
            authorization_id,
            expires_in_seconds: AUTHORIZATION_TTL.as_secs(),
        })
    }

    pub fn consume(
        &mut self,
        authorization_id: &str,
        expected_purpose: BroadcastPurpose,
        draft_id: &str,
        transaction_identity: &str,
        preflight_version: u64,
    ) -> Result<(), String> {
        let authorization = self
            .active
            .remove(authorization_id)
            .ok_or_else(|| AUTHORIZATION_ERROR.to_string())?;
        if authorization.created_at.elapsed() > AUTHORIZATION_TTL
            || authorization.purpose != expected_purpose
            || authorization.draft_id != draft_id
            || authorization.transaction_identity != transaction_identity
            || authorization.preflight_version != preflight_version
        {
            return Err(AUTHORIZATION_ERROR.into());
        }
        Ok(())
    }

    pub fn revoke_draft(&mut self, draft_id: &str) {
        self.active
            .retain(|_, authorization| authorization.draft_id != draft_id);
    }

    #[cfg(test)]
    pub fn issue_expired_for_test(
        &mut self,
        draft_id: String,
        transaction_identity: String,
        preflight_version: u64,
    ) -> BroadcastAuthorizationGrant {
        self.issue_at(
            BroadcastPurpose::LegacyMultisigTransaction,
            draft_id,
            transaction_identity,
            preflight_version,
            Instant::now() - AUTHORIZATION_TTL - Duration::from_secs(1),
        )
        .expect("expired test authorization should be issued")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn authorization_is_opaque_bound_and_one_time() {
        let mut store = BroadcastAuthorizationStore::default();
        let grant = store
            .issue(
                BroadcastPurpose::LegacyMultisigTransaction,
                "draft-a".into(),
                "tx-a".into(),
                4,
            )
            .expect("authorization should be issued");
        assert_eq!(grant.authorization_id.len(), 64);
        assert!(!grant.authorization_id.contains("draft-a"));
        store
            .consume(
                &grant.authorization_id,
                BroadcastPurpose::LegacyMultisigTransaction,
                "draft-a",
                "tx-a",
                4,
            )
            .expect("matching authorization should be consumed");
        assert!(store
            .consume(
                &grant.authorization_id,
                BroadcastPurpose::LegacyMultisigTransaction,
                "draft-a",
                "tx-a",
                4,
            )
            .is_err());
    }

    #[test]
    fn wrong_draft_transaction_version_and_expiration_are_rejected() {
        for (draft_id, transaction_identity, preflight_version) in [
            ("draft-b", "tx-a", 4),
            ("draft-a", "tx-b", 4),
            ("draft-a", "tx-a", 5),
        ] {
            let mut store = BroadcastAuthorizationStore::default();
            let grant = store
                .issue(
                    BroadcastPurpose::LegacyMultisigTransaction,
                    "draft-a".into(),
                    "tx-a".into(),
                    4,
                )
                .expect("authorization should be issued");
            assert!(store
                .consume(
                    &grant.authorization_id,
                    BroadcastPurpose::LegacyMultisigTransaction,
                    draft_id,
                    transaction_identity,
                    preflight_version,
                )
                .is_err());
        }

        let mut store = BroadcastAuthorizationStore::default();
        let expired = store.issue_expired_for_test("draft-a".into(), "tx-a".into(), 4);
        assert!(store
            .consume(
                &expired.authorization_id,
                BroadcastPurpose::LegacyMultisigTransaction,
                "draft-a",
                "tx-a",
                4,
            )
            .is_err());
    }
}
