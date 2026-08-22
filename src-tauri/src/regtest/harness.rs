use crate::{
    rpc::{inspect_core, RpcClient},
    types::{ConnectionSettings, RpcTrace},
};
use serde_json::{json, Value};
use std::{
    env,
    ffi::OsString,
    fs::{self, File},
    net::TcpListener,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

const DATADIR_PREFIX: &str = "core-vault-regtest-";
const OWNERSHIP_MARKER: &str = ".core-vault-regtest-owned";
const OWNERSHIP_VALUE: &str = "core-vault-regtest-v1\n";
const KEEP_ENV: &str = "CORE_VAULT_KEEP_REGTEST";

pub(super) struct ShutdownReport {
    pub graceful: bool,
    pub cleaned: bool,
    pub preserved_for_debug: bool,
}

pub(super) struct RegtestNode {
    child: Option<Child>,
    client: RpcClient,
    datadir: PathBuf,
    stderr_path: PathBuf,
    preserve_for_debug: bool,
    cleaned: bool,
}

impl RegtestNode {
    pub async fn start() -> Result<Self, String> {
        let bitcoind = discover_bitcoind()?;
        let datadir = create_owned_datadir()?;
        let preserve_for_debug = preserve_requested();
        let artifacts = datadir.join("artifacts");
        if let Err(error) = fs::create_dir(&artifacts) {
            cleanup_after_setup_failure(&datadir, preserve_for_debug);
            return Err(format!(
                "could not create the test artifact directory: {error}"
            ));
        }
        if let Err(error) = assert_owned_datadir(&datadir) {
            cleanup_after_setup_failure(&datadir, preserve_for_debug);
            return Err(error);
        }

        let rpc_port = match available_loopback_port() {
            Ok(port) => port,
            Err(error) => {
                cleanup_after_setup_failure(&datadir, preserve_for_debug);
                return Err(error);
            }
        };
        let cookie_path = datadir.join("regtest").join(".cookie");
        let settings = ConnectionSettings {
            host: "127.0.0.1".into(),
            port: rpc_port,
            cookie_path: cookie_path.to_string_lossy().into_owned(),
        };
        let client = match RpcClient::new(settings.clone()) {
            Ok(client) => client,
            Err(error) => {
                cleanup_after_setup_failure(&datadir, preserve_for_debug);
                return Err(error);
            }
        };

        let stdout_path = datadir.join("bitcoind.stdout.log");
        let stderr_path = datadir.join("bitcoind.stderr.log");
        let stdout = match File::create(&stdout_path) {
            Ok(file) => file,
            Err(error) => {
                cleanup_after_setup_failure(&datadir, preserve_for_debug);
                return Err(format!("could not open the test stdout file: {error}"));
            }
        };
        let stderr = match File::create(&stderr_path) {
            Ok(file) => file,
            Err(error) => {
                cleanup_after_setup_failure(&datadir, preserve_for_debug);
                return Err(format!("could not open the test stderr file: {error}"));
            }
        };

        let child = Command::new(&bitcoind)
            .arg(format!("-datadir={}", datadir.display()))
            .arg("-regtest")
            .arg("-server=1")
            .arg("-listen=0")
            .arg("-dnsseed=0")
            .arg("-fixedseeds=0")
            .arg("-discover=0")
            .arg("-networkactive=0")
            .arg("-fallbackfee=0.0002")
            .arg("-printtoconsole=1")
            .arg("-rpcbind=127.0.0.1")
            .arg("-rpcallowip=127.0.0.1/32")
            .arg(format!("-rpcport={rpc_port}"))
            .stdin(Stdio::null())
            .stdout(Stdio::from(stdout))
            .stderr(Stdio::from(stderr))
            .spawn()
            .map_err(|error| {
                cleanup_after_setup_failure(&datadir, preserve_for_debug);
                format!(
                    "could not start bitcoind from {}: {error}",
                    bitcoind.display()
                )
            })?;

        let mut node = Self {
            child: Some(child),
            client,
            datadir,
            stderr_path,
            preserve_for_debug,
            cleaned: false,
        };

        let deadline = Instant::now() + Duration::from_secs(30);
        let mut last_error = "Bitcoin Core has not created the RPC cookie yet.".to_string();
        loop {
            if let Some(status) = node
                .child
                .as_mut()
                .and_then(|child| child.try_wait().ok())
                .flatten()
            {
                return Err(
                    node.startup_error(format!("bitcoind exited too early with status {status}"))
                );
            }

            if cookie_path.is_file() && loopback_port_is_ready(rpc_port) {
                let mut traces = Vec::new();
                match inspect_core(settings.clone(), &mut traces).await {
                    Ok(status) => {
                        require_regtest_chain(status.chain.as_deref())?;
                        if !status.wallet_rpc_available {
                            return Err(node
                                .startup_error("privremeni Core nema dostupan wallet RPC".into()));
                        }
                        return Ok(node);
                    }
                    Err(error) => last_error = error,
                }
            }

            if Instant::now() >= deadline {
                return Err(node.startup_error(format!(
                    "timed out after 30 seconds while waiting for RPC readiness; last error: {last_error}"
                )));
            }
            tokio::time::sleep(Duration::from_millis(75)).await;
        }
    }

    pub fn client(&self) -> RpcClient {
        self.client.clone()
    }

    pub fn artifact_path(&self, name: &str) -> Result<PathBuf, String> {
        if name.is_empty()
            || name.contains('/')
            || name.contains('\\')
            || name == "."
            || name == ".."
            || name.chars().any(char::is_control)
        {
            return Err("nevaljano ime testnog artifacta".into());
        }
        assert_owned_datadir(&self.datadir)?;
        Ok(self.datadir.join("artifacts").join(name))
    }

    pub async fn assert_regtest(&self) -> Result<(), String> {
        let mut traces = Vec::new();
        let info = self
            .client
            .call(
                "getblockchaininfo",
                json!({}),
                None,
                "The test harness confirms Regtest before mutation.",
                None,
                false,
                &mut traces,
            )
            .await?;
        require_regtest_chain(info.get("chain").and_then(Value::as_str))
    }

    pub async fn create_fixture_wallet(&self, wallet_name: &str) -> Result<(), String> {
        self.assert_regtest().await?;
        self.rpc(
            "createwallet",
            json!({
                "wallet_name": wallet_name,
                "disable_private_keys": false,
                "blank": false,
                "passphrase": "",
                "avoid_reuse": false,
                "descriptors": true,
                "load_on_startup": false,
                "external_signer": false
            }),
            None,
            true,
        )
        .await?;
        Ok(())
    }

    pub async fn new_address(&self, wallet_name: &str, label: &str) -> Result<String, String> {
        self.assert_regtest().await?;
        self.rpc(
            "getnewaddress",
            json!({ "label": label, "address_type": "bech32" }),
            Some(wallet_name),
            false,
        )
        .await?
        .as_str()
        .filter(|address| !address.is_empty())
        .map(str::to_string)
        .ok_or_else(|| "the fixture wallet did not return a new address".to_string())
    }

    pub async fn mine_blocks(&self, count: u64, address: &str) -> Result<(), String> {
        self.assert_regtest().await?;
        let hashes = self
            .rpc(
                "generatetoaddress",
                json!({ "nblocks": count, "address": address }),
                None,
                true,
            )
            .await?;
        if hashes.as_array().map(Vec::len) != Some(count as usize) {
            return Err(format!(
                "generatetoaddress did not return the expected {count} blocks"
            ));
        }
        Ok(())
    }

    pub async fn fund_address(
        &self,
        funding_wallet: &str,
        destination: &str,
        amount_sats: u64,
        mining_address: &str,
    ) -> Result<(), String> {
        self.assert_regtest().await?;
        let amount_btc = amount_sats as f64 / 100_000_000.0;
        self.rpc(
            "sendtoaddress",
            json!({ "address": destination, "amount": amount_btc }),
            Some(funding_wallet),
            true,
        )
        .await?;
        self.mine_blocks(1, mining_address).await
    }

    pub async fn wallet_info(&self, wallet_name: &str) -> Result<Value, String> {
        self.rpc("getwalletinfo", json!({}), Some(wallet_name), false)
            .await
    }

    pub async fn wallet_descriptors(&self, wallet_name: &str) -> Result<Value, String> {
        self.rpc(
            "listdescriptors",
            json!({ "private": false }),
            Some(wallet_name),
            true,
        )
        .await
    }

    pub async fn descriptor_info(&self, descriptor: &str) -> Result<Value, String> {
        self.rpc(
            "getdescriptorinfo",
            json!({ "descriptor": descriptor }),
            None,
            true,
        )
        .await
    }

    pub async fn derive_address(&self, descriptor: &str, index: u64) -> Result<String, String> {
        self.rpc(
            "deriveaddresses",
            json!({ "descriptor": descriptor, "range": [index, index] }),
            None,
            true,
        )
        .await?
        .as_array()
        .and_then(|addresses| addresses.first())
        .and_then(Value::as_str)
        .filter(|address| !address.is_empty())
        .map(str::to_string)
        .ok_or_else(|| {
            "the Core fixture did not derive the expected descriptor address".to_string()
        })
    }

    pub async fn address_info(&self, wallet_name: &str, address: &str) -> Result<Value, String> {
        self.rpc(
            "getaddressinfo",
            json!({ "address": address }),
            Some(wallet_name),
            false,
        )
        .await
    }

    pub async fn loaded_wallets(&self) -> Result<Vec<String>, String> {
        let wallets = self
            .rpc("listwallets", json!({}), None, false)
            .await?
            .as_array()
            .cloned()
            .unwrap_or_default()
            .into_iter()
            .filter_map(|value| value.as_str().map(str::to_string))
            .collect();
        Ok(wallets)
    }

    pub async fn core_version(&self) -> Result<u64, String> {
        self.rpc("getnetworkinfo", json!({}), None, false)
            .await?
            .get("version")
            .and_then(Value::as_u64)
            .ok_or_else(|| "the Core fixture did not return a numeric version".to_string())
    }

    pub async fn decode_psbt(&self, psbt: &str) -> Result<Value, String> {
        self.rpc("decodepsbt", json!({ "psbt": psbt }), None, true)
            .await
    }

    pub async fn decode_raw_transaction(&self, raw_hex: &str) -> Result<Value, String> {
        self.rpc(
            "decoderawtransaction",
            json!({ "hexstring": raw_hex }),
            None,
            true,
        )
        .await
    }

    pub async fn wallet_transaction(&self, wallet_name: &str, txid: &str) -> Result<Value, String> {
        self.rpc(
            "gettransaction",
            json!({ "txid": txid, "include_watchonly": true }),
            Some(wallet_name),
            true,
        )
        .await
    }

    pub async fn wallet_balance_sats(&self, wallet_name: &str) -> Result<u64, String> {
        let balances = self
            .rpc("getbalances", json!({}), Some(wallet_name), false)
            .await?;
        let trusted = balances
            .pointer("/mine/trusted")
            .and_then(Value::as_f64)
            .unwrap_or(0.0);
        Ok((trusted * 100_000_000.0).round().max(0.0) as u64)
    }

    pub async fn mempool_contains(&self, txid: &str) -> Result<bool, String> {
        Ok(self
            .rpc("getrawmempool", json!({ "verbose": false }), None, false)
            .await?
            .as_array()
            .is_some_and(|txids| txids.iter().any(|value| value.as_str() == Some(txid))))
    }

    pub async fn shutdown(mut self) -> Result<ShutdownReport, String> {
        self.assert_regtest().await?;
        let stop_result = self.rpc("stop", json!({}), None, true).await;
        let graceful = stop_result.is_ok() && self.wait_for_exit(Duration::from_secs(10));
        if !graceful {
            self.terminate_child();
        }

        let preserved_for_debug = self.preserve_for_debug;
        let cleaned = if preserved_for_debug {
            eprintln!(
                "Regtest debug state preserved at {}",
                self.datadir.display()
            );
            false
        } else {
            cleanup_owned_datadir(&self.datadir)?;
            true
        };
        self.cleaned = cleaned || preserved_for_debug;

        if let Err(error) = stop_result {
            return Err(format!(
                "graceful bitcoind shutdown failed; the child process was stopped: {error}"
            ));
        }
        if !graceful {
            return Err(
                "bitcoind did not stop within 10 seconds; the child process was terminated".into(),
            );
        }
        Ok(ShutdownReport {
            graceful,
            cleaned,
            preserved_for_debug,
        })
    }

    async fn rpc(
        &self,
        method: &str,
        params: Value,
        wallet: Option<&str>,
        hide_result: bool,
    ) -> Result<Value, String> {
        let mut traces: Vec<RpcTrace> = Vec::new();
        self.client
            .call(
                method,
                params,
                wallet,
                "Izolirani Regtest fixture RPC.",
                None,
                hide_result,
                &mut traces,
            )
            .await
    }

    fn wait_for_exit(&mut self, timeout: Duration) -> bool {
        let deadline = Instant::now() + timeout;
        loop {
            match self.child.as_mut().and_then(|child| child.try_wait().ok()) {
                Some(Some(_)) => {
                    self.child.take();
                    return true;
                }
                Some(None) if Instant::now() < deadline => {
                    thread::sleep(Duration::from_millis(50));
                }
                _ => return false,
            }
        }
    }

    fn terminate_child(&mut self) {
        if let Some(mut child) = self.child.take() {
            if child.try_wait().ok().flatten().is_none() {
                let _ = child.kill();
            }
            let _ = child.wait();
        }
    }

    fn startup_error(&self, message: String) -> String {
        let log = sanitized_log_tail(&self.stderr_path);
        let location = if self.preserve_for_debug {
            format!(" Privremeni datadir: {}.", self.datadir.display())
        } else {
            String::new()
        };
        if log.is_empty() {
            format!("{message}.{location}")
        } else {
            format!("{message}. Sanitized bitcoind stderr: {log}.{location}")
        }
    }
}

impl Drop for RegtestNode {
    fn drop(&mut self) {
        self.terminate_child();
        if !self.cleaned && !self.preserve_for_debug {
            let _ = cleanup_owned_datadir(&self.datadir);
            self.cleaned = true;
        } else if !self.cleaned && self.preserve_for_debug {
            eprintln!(
                "Regtest debug state preserved at {}",
                self.datadir.display()
            );
            self.cleaned = true;
        }
    }
}

pub(super) fn require_regtest_chain(chain: Option<&str>) -> Result<(), String> {
    if chain == Some("regtest") {
        Ok(())
    } else {
        Err(format!(
            "STOP: Regtest harness odbija mutaciju na chainu {}.",
            chain.unwrap_or("unknown")
        ))
    }
}

fn discover_bitcoind() -> Result<PathBuf, String> {
    if let Some(value) = env::var_os("BITCOIND") {
        let path = PathBuf::from(value);
        if !path.is_absolute() {
            return Err("BITCOIND must be an absolute path to the bitcoind executable.".into());
        }
        if !path.is_file() {
            return Err(format!(
                "BITCOIND ne pokazuje na datoteku: {}",
                path.display()
            ));
        }
        return Ok(path);
    }

    let executable = if cfg!(windows) {
        OsString::from("bitcoind.exe")
    } else {
        OsString::from("bitcoind")
    };
    if let Some(path) = env::var_os("PATH") {
        for directory in env::split_paths(&path) {
            let candidate = directory.join(&executable);
            if candidate.is_file() {
                return Ok(candidate);
            }
        }
    }

    Err(
        "bitcoind was not found in PATH. Install Bitcoin Core or run BITCOIND=/absolute/path/to/bitcoind npm run test:regtest."
            .into(),
    )
}

fn create_owned_datadir() -> Result<PathBuf, String> {
    let base = env::temp_dir();
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    for attempt in 0..32u8 {
        let candidate = base.join(format!(
            "{DATADIR_PREFIX}{}-{nonce}-{attempt}",
            std::process::id()
        ));
        match fs::create_dir(&candidate) {
            Ok(()) => {
                if let Err(error) = fs::write(candidate.join(OWNERSHIP_MARKER), OWNERSHIP_VALUE) {
                    let _ = fs::remove_dir_all(&candidate);
                    return Err(format!("could not mark the test data directory: {error}"));
                }
                return Ok(candidate);
            }
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(error) => {
                return Err(format!(
                    "could not create a temporary Regtest data directory: {error}"
                ))
            }
        }
    }
    Err("could not create a unique temporary Regtest data directory".into())
}

fn assert_owned_datadir(path: &Path) -> Result<(), String> {
    let has_prefix = path
        .file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| name.starts_with(DATADIR_PREFIX));
    let marker = fs::read_to_string(path.join(OWNERSHIP_MARKER)).unwrap_or_default();
    if !has_prefix || marker != OWNERSHIP_VALUE {
        return Err(
            "STOP: The harness refuses to operate on a directory it did not create.".into(),
        );
    }
    Ok(())
}

fn cleanup_owned_datadir(path: &Path) -> Result<(), String> {
    assert_owned_datadir(path)?;
    fs::remove_dir_all(path).map_err(|error| {
        format!("could not clean up the temporary Regtest data directory: {error}")
    })
}

fn cleanup_after_setup_failure(path: &Path, preserve_for_debug: bool) {
    if preserve_for_debug {
        eprintln!("Regtest debug state preserved at {}", path.display());
    } else {
        let _ = cleanup_owned_datadir(path);
    }
}

fn available_loopback_port() -> Result<u16, String> {
    let listener = TcpListener::bind(("127.0.0.1", 0))
        .map_err(|error| format!("could not reserve a test loopback port: {error}"))?;
    listener
        .local_addr()
        .map(|address| address.port())
        .map_err(|error| format!("could not read the test loopback port: {error}"))
}

fn loopback_port_is_ready(port: u16) -> bool {
    std::net::TcpStream::connect_timeout(
        &std::net::SocketAddr::from(([127, 0, 0, 1], port)),
        Duration::from_millis(150),
    )
    .is_ok()
}

fn preserve_requested() -> bool {
    env::var(KEEP_ENV)
        .map(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
        .unwrap_or(false)
}

fn sanitized_log_tail(path: &Path) -> String {
    let content = fs::read_to_string(path).unwrap_or_default();
    let safe_lines = content
        .lines()
        .filter(|line| {
            let lower = line.to_ascii_lowercase();
            !lower.contains("cookie")
                && !lower.contains("authorization")
                && !lower.contains("rpcauth")
        })
        .collect::<Vec<_>>();
    safe_lines
        .iter()
        .rev()
        .take(20)
        .rev()
        .copied()
        .collect::<Vec<_>>()
        .join(" | ")
        .chars()
        .take(2_000)
        .collect()
}
