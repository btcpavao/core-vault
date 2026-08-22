use crate::{security::validate_wallet_name, types::AppState};
use serde::Serialize;
use std::{
    collections::HashMap,
    fmt::Write as _,
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
    time::{Duration, Instant},
};
use tauri::api::dialog::blocking::FileDialogBuilder;

const CAPABILITY_TTL: Duration = Duration::from_secs(5 * 60);
const AUTHORIZATION_ERROR: &str = "The selected location is no longer authorized. Select it again.";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FileOperation {
    PersonalBackupDestination,
    PersonalRestoreSource,
    PublicBackupExportDestination,
    SignerBackupDestination,
}

#[derive(Debug)]
struct FileCapability {
    path: PathBuf,
    operation: FileOperation,
    created_at: Instant,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileCapabilityGrant {
    pub capability_id: String,
    pub display_path: String,
    pub display_name: String,
}

#[derive(Default)]
pub struct FileCapabilityStore {
    active: HashMap<String, FileCapability>,
}

impl FileCapabilityStore {
    fn issue(
        &mut self,
        path: PathBuf,
        operation: FileOperation,
    ) -> Result<FileCapabilityGrant, String> {
        self.issue_at(path, operation, Instant::now())
    }

    fn issue_at(
        &mut self,
        path: PathBuf,
        operation: FileOperation,
        created_at: Instant,
    ) -> Result<FileCapabilityGrant, String> {
        let path = normalize_for_operation(&path, operation)?;
        self.active
            .retain(|_, capability| capability.created_at.elapsed() <= CAPABILITY_TTL);
        self.active
            .retain(|_, capability| capability.operation != operation);

        let mut random = [0_u8; 32];
        getrandom::getrandom(&mut random)
            .map_err(|_| "Could not create a secure file authorization.".to_string())?;
        let capability_id = random.iter().fold(
            String::with_capacity(random.len() * 2),
            |mut output, byte| {
                let _ = write!(output, "{byte:02x}");
                output
            },
        );
        let display_path = path.to_string_lossy().into_owned();
        let display_name = path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("Selected file")
            .to_string();

        self.active.insert(
            capability_id.clone(),
            FileCapability {
                path,
                operation,
                created_at,
            },
        );
        Ok(FileCapabilityGrant {
            capability_id,
            display_path,
            display_name,
        })
    }

    fn consume(
        &mut self,
        capability_id: &str,
        expected_operation: FileOperation,
    ) -> Result<PathBuf, String> {
        let capability = self
            .active
            .remove(capability_id)
            .ok_or_else(|| AUTHORIZATION_ERROR.to_string())?;

        if capability.created_at.elapsed() > CAPABILITY_TTL
            || capability.operation != expected_operation
        {
            return Err(AUTHORIZATION_ERROR.into());
        }

        let normalized = normalize_for_operation(&capability.path, expected_operation)?;
        if normalized != capability.path {
            return Err(AUTHORIZATION_ERROR.into());
        }
        Ok(capability.path)
    }
}

pub fn consume_file_capability(
    state: &AppState,
    capability_id: &str,
    operation: FileOperation,
) -> Result<PathBuf, String> {
    state
        .file_capabilities
        .lock()
        .map_err(|_| "File authorizations are currently unavailable.".to_string())?
        .consume(capability_id, operation)
}

pub fn choose_personal_backup_destination(
    state: &AppState,
    wallet_name: &str,
) -> Result<Option<FileCapabilityGrant>, String> {
    validate_wallet_name(wallet_name)?;
    let title = format!("Wallet backup for {wallet_name}");
    let file_name = format!("CoreVault-{wallet_name}.dat");
    let selected = FileDialogBuilder::new()
        .set_title(&title)
        .set_file_name(&file_name)
        .add_filter("Bitcoin Core wallet backup", &["dat"])
        .save_file();
    issue_selection(state, selected, FileOperation::PersonalBackupDestination)
}

pub fn choose_personal_restore_source(
    state: &AppState,
) -> Result<Option<FileCapabilityGrant>, String> {
    let selected = FileDialogBuilder::new()
        .set_title("Odaberite Bitcoin Core wallet backup")
        .add_filter("Bitcoin Core wallet backup", &["dat"])
        .pick_file();
    issue_selection(state, selected, FileOperation::PersonalRestoreSource)
}

pub fn choose_signer_backup_destination(
    state: &AppState,
    wallet_name: &str,
) -> Result<Option<FileCapabilityGrant>, String> {
    validate_wallet_name(wallet_name)?;
    let title = format!("Signing-wallet backup for {wallet_name}");
    let file_name = format!("CoreVault-{wallet_name}.dat");
    let selected = FileDialogBuilder::new()
        .set_title(&title)
        .set_file_name(&file_name)
        .add_filter("Bitcoin Core wallet backup", &["dat"])
        .save_file();
    issue_selection(state, selected, FileOperation::SignerBackupDestination)
}

pub fn choose_public_backup_export_destination(
    state: &AppState,
) -> Result<Option<FileCapabilityGrant>, String> {
    let selected = FileDialogBuilder::new()
        .set_title("Izvezite javnu vault konfiguraciju")
        .set_file_name("corevault-2of3-public-backup.json")
        .add_filter("JSON", &["json"])
        .save_file();
    issue_selection(
        state,
        selected,
        FileOperation::PublicBackupExportDestination,
    )
}

fn issue_selection(
    state: &AppState,
    selected: Option<PathBuf>,
    operation: FileOperation,
) -> Result<Option<FileCapabilityGrant>, String> {
    let Some(path) = selected else {
        return Ok(None);
    };
    let grant = state
        .file_capabilities
        .lock()
        .map_err(|_| "File authorizations are currently unavailable.".to_string())?
        .issue(path, operation)?;
    Ok(Some(grant))
}

fn normalize_for_operation(path: &Path, operation: FileOperation) -> Result<PathBuf, String> {
    match operation {
        FileOperation::PersonalRestoreSource => normalize_existing_file(path, "dat"),
        FileOperation::PersonalBackupDestination | FileOperation::SignerBackupDestination => {
            normalize_new_destination(path, "dat")
        }
        FileOperation::PublicBackupExportDestination => normalize_new_destination(path, "json"),
    }
}

fn normalize_new_destination(path: &Path, extension: &str) -> Result<PathBuf, String> {
    if !path.is_absolute() {
        return Err("Odaberite apsolutnu lokalnu putanju.".into());
    }
    validate_extension(path, extension)?;
    let file_name = path
        .file_name()
        .ok_or_else(|| "The destination must include a file name.".to_string())?;
    let parent = path
        .parent()
        .ok_or_else(|| "The destination directory is invalid.".to_string())?
        .canonicalize()
        .map_err(|_| "The destination directory does not exist or is unavailable.".to_string())?;
    if !parent.is_dir() {
        return Err("The destination directory is invalid.".into());
    }
    let normalized = parent.join(file_name);
    match fs::symlink_metadata(&normalized) {
        Ok(_) => {
            return Err(
                "The selected file already exists. Choose a new name. Overwriting is not allowed."
                    .into(),
            )
        }
        Err(error) if error.kind() == ErrorKind::NotFound => {}
        Err(_) => return Err("Could not verify the destination safely.".into()),
    }
    Ok(normalized)
}

fn normalize_existing_file(path: &Path, extension: &str) -> Result<PathBuf, String> {
    if !path.is_absolute() {
        return Err("Odaberite apsolutnu lokalnu putanju.".into());
    }
    validate_extension(path, extension)?;
    let normalized = path
        .canonicalize()
        .map_err(|_| "The selected backup file does not exist or is unavailable.".to_string())?;
    if !fs::metadata(&normalized)
        .map(|metadata| metadata.is_file())
        .unwrap_or(false)
    {
        return Err("The selected backup is not a regular file.".into());
    }
    Ok(normalized)
}

fn validate_extension(path: &Path, expected: &str) -> Result<(), String> {
    let valid = path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case(expected))
        .unwrap_or(false);
    if valid {
        Ok(())
    } else {
        Err(format!(
            "The selected file must use the .{expected} extension."
        ))
    }
}

#[cfg(test)]
pub(crate) fn issue_test_capability(
    state: &AppState,
    path: PathBuf,
    operation: FileOperation,
) -> Result<String, String> {
    state
        .file_capabilities
        .lock()
        .map_err(|_| "File authorizations are currently unavailable.".to_string())?
        .issue(path, operation)
        .map(|grant| grant.capability_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs::File,
        sync::atomic::{AtomicU64, Ordering},
    };

    static TEST_DIRECTORY_COUNTER: AtomicU64 = AtomicU64::new(1);

    struct TestDirectory(PathBuf);

    impl TestDirectory {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!(
                "core-vault-capabilities-{}-{}",
                std::process::id(),
                TEST_DIRECTORY_COUNTER.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir(&path).expect("test capability directory should be created");
            Self(
                path.canonicalize()
                    .expect("test capability directory should canonicalize"),
            )
        }

        fn path(&self, name: &str) -> PathBuf {
            self.0.join(name)
        }
    }

    impl Drop for TestDirectory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn valid_capability_is_consumed_once() {
        let directory = TestDirectory::new();
        let path = directory.path("wallet.dat");
        let mut store = FileCapabilityStore::default();
        let grant = store
            .issue(path.clone(), FileOperation::PersonalBackupDestination)
            .expect("capability should be issued");

        assert_eq!(
            store
                .consume(
                    &grant.capability_id,
                    FileOperation::PersonalBackupDestination
                )
                .expect("valid capability should resolve"),
            path
        );
        assert!(store
            .consume(
                &grant.capability_id,
                FileOperation::PersonalBackupDestination
            )
            .is_err());
    }

    #[test]
    fn wrong_operation_and_unknown_id_are_rejected() {
        let directory = TestDirectory::new();
        let mut store = FileCapabilityStore::default();
        let grant = store
            .issue(
                directory.path("wallet.dat"),
                FileOperation::PersonalBackupDestination,
            )
            .expect("capability should be issued");

        assert!(store
            .consume(&grant.capability_id, FileOperation::PersonalRestoreSource)
            .is_err());
        assert!(store
            .consume(
                "/tmp/renderer-supplied-wallet.dat",
                FileOperation::PersonalBackupDestination
            )
            .is_err());
    }

    #[test]
    fn expired_and_fresh_state_capabilities_are_rejected() {
        let directory = TestDirectory::new();
        let mut store = FileCapabilityStore::default();
        let grant = store
            .issue_at(
                directory.path("wallet.dat"),
                FileOperation::PersonalBackupDestination,
                Instant::now() - CAPABILITY_TTL - Duration::from_secs(1),
            )
            .expect("expired fixture capability should be issued");
        assert!(store
            .consume(
                &grant.capability_id,
                FileOperation::PersonalBackupDestination
            )
            .is_err());

        let fresh_store = &mut FileCapabilityStore::default();
        assert!(fresh_store
            .consume(
                &grant.capability_id,
                FileOperation::PersonalBackupDestination
            )
            .is_err());
    }

    #[test]
    fn existing_destination_is_rejected() {
        let directory = TestDirectory::new();
        let path = directory.path("existing.json");
        File::create(&path).expect("existing destination fixture should be created");

        assert!(FileCapabilityStore::default()
            .issue(path, FileOperation::PublicBackupExportDestination)
            .is_err());
    }

    #[cfg(unix)]
    #[test]
    fn dangling_symlink_destination_is_rejected() {
        use std::os::unix::fs::symlink;

        let directory = TestDirectory::new();
        let path = directory.path("dangling.json");
        symlink(directory.path("missing-target.json"), &path)
            .expect("dangling symlink fixture should be created");

        assert!(FileCapabilityStore::default()
            .issue(path, FileOperation::PublicBackupExportDestination)
            .is_err());
    }

    #[test]
    fn newer_selection_invalidates_prior_same_operation() {
        let directory = TestDirectory::new();
        let mut store = FileCapabilityStore::default();
        let first = store
            .issue(
                directory.path("first.dat"),
                FileOperation::PersonalBackupDestination,
            )
            .expect("first capability should be issued");
        let second = store
            .issue(
                directory.path("second.dat"),
                FileOperation::PersonalBackupDestination,
            )
            .expect("second capability should be issued");

        assert!(store
            .consume(
                &first.capability_id,
                FileOperation::PersonalBackupDestination
            )
            .is_err());
        assert!(store
            .consume(
                &second.capability_id,
                FileOperation::PersonalBackupDestination
            )
            .is_ok());
    }
}
