use crate::types::{ConnectionSettings, PublicVaultBackup};
use std::path::Path;

pub fn validate_connection(settings: &ConnectionSettings) -> Result<(), String> {
    let host = settings.host.trim().to_ascii_lowercase();
    if !matches!(host.as_str(), "127.0.0.1" | "localhost" | "::1") {
        return Err(
            "V1 allows only a local Bitcoin Core instance (127.0.0.1, localhost, or ::1).".into(),
        );
    }
    if settings.port == 0 {
        return Err("The RPC port must be between 1 and 65535.".into());
    }
    let cookie = Path::new(&settings.cookie_path);
    if !cookie.is_absolute() {
        return Err("The cookie path must be an absolute local path.".into());
    }
    Ok(())
}

pub fn validate_wallet_name(name: &str) -> Result<(), String> {
    if name.is_empty() || name.len() > 64 {
        return Err("The wallet name must contain between 1 and 64 characters.".into());
    }
    if !name
        .chars()
        .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.'))
    {
        return Err(
            "The wallet name may contain only letters, numbers, hyphens, underscores, and periods."
                .into(),
        );
    }
    Ok(())
}

pub fn contains_private_material(value: &str) -> bool {
    let lower = value.to_ascii_lowercase();
    if lower.contains("xprv") || lower.contains("tprv") || lower.contains("-----begin private key")
    {
        return true;
    }

    value
        .split(|character: char| !character.is_ascii_alphanumeric())
        .any(|word| {
            let length = word.len();
            (length == 51 || length == 52)
                && matches!(
                    word.as_bytes().first(),
                    Some(b'5' | b'K' | b'L' | b'9' | b'c')
                )
        })
}

pub fn validate_public_backup(backup: &PublicVaultBackup) -> Result<String, String> {
    if backup.schema_version != 1
        || !matches!(
            backup.network.as_str(),
            "signet" | "test" | "testnet4" | "regtest"
        )
        || backup.policy_type != "wsh-sortedmulti"
        || backup.threshold != 2
        || backup.participants != 3
        || backup.signers.len() != 3
        || backup.coordinator_private_keys
    {
        return Err("The public backup does not match the supported Core Vault V1 schema.".into());
    }

    let serialized = serde_json::to_string_pretty(backup)
        .map_err(|_| "Could not serialize the public backup.".to_string())?;
    if contains_private_material(&serialized) {
        return Err("STOP: The public backup contains a private-key pattern.".into());
    }
    Ok(serialized)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_remote_rpc_hosts() {
        let settings = ConnectionSettings {
            host: "192.168.1.5".into(),
            port: 38332,
            cookie_path: "/tmp/.cookie".into(),
        };
        assert!(validate_connection(&settings).is_err());
    }

    #[test]
    fn accepts_only_auditable_wallet_names() {
        assert!(validate_wallet_name("CoreVault-K1").is_ok());
        assert!(validate_wallet_name("../other-wallet").is_err());
    }

    #[test]
    fn detects_extended_private_keys() {
        assert!(contains_private_material("wpkh(tprv8ZgxMBicQKsPd.../0/*)"));
        assert!(!contains_private_material("wpkh(tpubD6NzVbkrYhZ4...)"));
    }

    #[test]
    fn detects_wif_shaped_private_material() {
        assert!(contains_private_material(&format!("K{}", "a".repeat(51))));
        assert!(contains_private_material(&format!("c{}", "b".repeat(51))));
        assert!(!contains_private_material(&format!(
            "tpub{}",
            "A".repeat(107)
        )));
    }
}
