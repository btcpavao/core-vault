use crate::{
    security::validate_connection,
    types::{ConnectionSettings, CoreStatus, RpcTrace},
};
use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};
use reqwest::{redirect::Policy, Client};
use serde_json::{json, Value};
use std::{
    env, fs,
    path::PathBuf,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use zeroize::Zeroizing;

#[derive(Clone)]
pub struct RpcClient {
    settings: ConnectionSettings,
    http: Client,
}

impl RpcClient {
    pub fn new(settings: ConnectionSettings) -> Result<Self, String> {
        validate_connection(&settings)?;
        let http = Client::builder()
            .redirect(Policy::none())
            .no_proxy()
            .timeout(Duration::from_secs(12))
            .build()
            .map_err(|_| "Nije moguće inicijalizirati lokalni RPC klijent.".to_string())?;
        Ok(Self { settings, http })
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn call(
        &self,
        method: &str,
        params: Value,
        wallet: Option<&str>,
        explanation: &str,
        trace_arguments: Option<Value>,
        hide_result: bool,
        traces: &mut Vec<RpcTrace>,
    ) -> Result<Value, String> {
        let cookie =
            Zeroizing::new(fs::read_to_string(&self.settings.cookie_path).map_err(|_| {
                "Bitcoin Core cookie nije moguće pročitati. Provjerite putanju i dozvole."
                    .to_string()
            })?);
        let trimmed = cookie.trim();
        let (user, password) = trimmed
            .split_once(':')
            .ok_or_else(|| "Bitcoin Core cookie nema očekivani lokalni auth format.".to_string())?;
        if user.is_empty() || password.is_empty() {
            return Err("Bitcoin Core cookie nema očekivani lokalni auth format.".into());
        }

        let url = self.endpoint(wallet);
        let request = json!({
            "jsonrpc": "1.0",
            "id": "core-vault-ui",
            "method": method,
            "params": params,
        });
        let started = Instant::now();
        let response = self
            .http
            .post(url)
            .basic_auth(user, Some(password))
            .json(&request)
            .send()
            .await
            .map_err(|_| {
                "Lokalni Bitcoin Core ne odgovara. Pokrenite ga na Signetu pa pokušajte ponovno."
                    .to_string()
            })?;

        let status = response.status();
        let payload: Value = response.json().await.map_err(|_| {
            "Bitcoin Core vratio je odgovor koji nije valjani JSON-RPC.".to_string()
        })?;
        let duration_ms = started.elapsed().as_millis().min(u64::MAX as u128) as u64;
        let visible_arguments = trace_arguments
            .unwrap_or_else(|| request.get("params").cloned().unwrap_or_else(|| json!({})));

        if !status.is_success() {
            let message = rpc_error_message(&payload);
            traces.push(RpcTrace {
                method: method.into(),
                wallet: wallet.map(str::to_string),
                arguments: visible_arguments,
                result: json!({ "error": message }),
                explanation: explanation.into(),
                duration_ms,
                timestamp_ms: now_unix_ms(),
            });
            return Err(format!("Bitcoin Core RPC nije uspio: {message}"));
        }

        if let Some(error) = payload.get("error").filter(|value| !value.is_null()) {
            let message = rpc_error_message(error);
            traces.push(RpcTrace {
                method: method.into(),
                wallet: wallet.map(str::to_string),
                arguments: visible_arguments,
                result: json!({ "error": message }),
                explanation: explanation.into(),
                duration_ms,
                timestamp_ms: now_unix_ms(),
            });
            return Err(format!("Bitcoin Core RPC nije uspio: {message}"));
        }

        let result = payload.get("result").cloned().unwrap_or(Value::Null);
        let trace_result = if hide_result {
            json!({ "hidden": "Osjetljivi transaction payload nije prikazan." })
        } else {
            result.clone()
        };
        traces.push(RpcTrace {
            method: method.into(),
            wallet: wallet.map(str::to_string),
            arguments: visible_arguments,
            result: trace_result,
            explanation: explanation.into(),
            duration_ms,
            timestamp_ms: now_unix_ms(),
        });
        Ok(result)
    }

    fn endpoint(&self, wallet: Option<&str>) -> String {
        let host = if self.settings.host.trim() == "::1" {
            "[::1]"
        } else {
            self.settings.host.trim()
        };
        match wallet {
            Some(name) => format!(
                "http://{host}:{}/wallet/{}",
                self.settings.port,
                utf8_percent_encode(name, NON_ALPHANUMERIC)
            ),
            None => format!("http://{host}:{}", self.settings.port),
        }
    }
}

pub async fn inspect_core(
    settings: ConnectionSettings,
    traces: &mut Vec<RpcTrace>,
) -> Result<CoreStatus, String> {
    let client = RpcClient::new(settings.clone())?;
    let blockchain = client
        .call(
            "getblockchaininfo",
            json!({}),
            None,
            "Provjerava mrežu lokalnog Bitcoin Corea prije bilo koje wallet operacije.",
            None,
            false,
            traces,
        )
        .await?;
    let network = client
        .call(
            "getnetworkinfo",
            json!({}),
            None,
            "Čita verziju lokalnog Bitcoin Corea.",
            None,
            false,
            traces,
        )
        .await?;

    let mempool = client
        .call(
            "getmempoolinfo",
            json!({}),
            None,
            "Čita sažetak lokalnog mempoola bez vanjskog servisa.",
            None,
            false,
            traces,
        )
        .await
        .unwrap_or_else(|_| json!({}));
    let loaded_wallets_result = client
        .call(
            "listwallets",
            json!({}),
            None,
            "Provjerava je li wallet RPC dostupan u ovoj Bitcoin Core instalaciji.",
            None,
            false,
            traces,
        )
        .await;
    let wallet_rpc_available = loaded_wallets_result.is_ok();
    let loaded_wallets = loaded_wallets_result
        .ok()
        .and_then(|value| value.as_array().cloned())
        .unwrap_or_default()
        .into_iter()
        .filter_map(|value| value.as_str().map(str::to_string))
        .collect::<Vec<_>>();

    let chain = blockchain
        .get("chain")
        .and_then(Value::as_str)
        .unwrap_or("unknown")
        .to_string();
    let version = network.get("version").and_then(Value::as_u64);
    let supported_chain = matches!(
        chain.as_str(),
        "main" | "signet" | "test" | "testnet4" | "regtest"
    );
    let supported = supported_chain && wallet_rpc_available && version.unwrap_or(0) >= 260_000;
    let message = if !supported_chain {
        "Bitcoin Core koristi nepoznatu mrežu. Wallet mutacije su zaustavljene.".into()
    } else if !wallet_rpc_available {
        "Bitcoin Core je dostupan, ali wallet RPC nije uključen.".into()
    } else if version.unwrap_or(0) < 260_000 {
        "Core Vault V1 zahtijeva Bitcoin Core 26 ili noviji.".into()
    } else {
        format!(
            "Lokalni Bitcoin Core dostupan je na mreži {}.",
            chain_label(&chain)
        )
    };

    Ok(CoreStatus {
        connected: true,
        supported,
        chain: Some(chain),
        version,
        version_label: version.map(format_core_version),
        subversion: network
            .get("subversion")
            .and_then(Value::as_str)
            .map(str::to_string),
        wallet_rpc_available,
        cookie_path: Some(settings.cookie_path),
        blocks: blockchain
            .get("blocks")
            .and_then(Value::as_u64)
            .unwrap_or(0),
        headers: blockchain
            .get("headers")
            .and_then(Value::as_u64)
            .unwrap_or(0),
        verification_progress: blockchain
            .get("verificationprogress")
            .and_then(Value::as_f64)
            .unwrap_or(0.0),
        initial_block_download: blockchain
            .get("initialblockdownload")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        pruned: blockchain
            .get("pruned")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        size_on_disk: blockchain
            .get("size_on_disk")
            .and_then(Value::as_u64)
            .unwrap_or(0),
        network_active: network
            .get("networkactive")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        connections: network
            .get("connections")
            .and_then(Value::as_u64)
            .unwrap_or(0),
        mempool_size: mempool.get("size").and_then(Value::as_u64).unwrap_or(0),
        mempool_bytes: mempool.get("bytes").and_then(Value::as_u64).unwrap_or(0),
        mempool_total_fee_btc: mempool
            .get("total_fee")
            .and_then(Value::as_f64)
            .unwrap_or(0.0),
        mempool_min_fee_btc_kvb: mempool
            .get("mempoolminfee")
            .and_then(Value::as_f64)
            .unwrap_or(0.0),
        last_block_time: blockchain.get("mediantime").and_then(Value::as_u64),
        loaded_wallets,
        message,
    })
}

pub async fn set_network_active(
    client: &RpcClient,
    active: bool,
    traces: &mut Vec<RpcTrace>,
) -> Result<CoreStatus, String> {
    let result = client
        .call(
            "setnetworkactive",
            json!({ "state": active }),
            None,
            if active {
                "Uključuje Bitcoin Core P2P mrežnu aktivnost."
            } else {
                "Isključuje Bitcoin Core P2P mrežnu aktivnost; računalo nije time dokazano air-gapped."
            },
            None,
            false,
            traces,
        )
        .await?;
    if result.as_bool() != Some(active) {
        return Err("Bitcoin Core nije potvrdio traženo stanje P2P mreže.".into());
    }
    inspect_core(client.settings.clone(), traces).await
}

pub async fn ensure_test_chain(
    client: &RpcClient,
    traces: &mut Vec<RpcTrace>,
) -> Result<String, String> {
    let info = client
        .call(
            "getblockchaininfo",
            json!({}),
            None,
            "Potvrđuje testnu mrežu neposredno prije wallet mutacije.",
            None,
            false,
            traces,
        )
        .await?;
    let chain = info
        .get("chain")
        .and_then(Value::as_str)
        .unwrap_or("unknown");
    if matches!(chain, "signet" | "test" | "testnet4" | "regtest") {
        Ok(chain.to_string())
    } else {
        Err("STOP: Experimentalni build dopušta wallet mutacije samo na Signetu, Testnetu 4 ili Regtestu.".into())
    }
}

pub async fn ensure_signet(client: &RpcClient, traces: &mut Vec<RpcTrace>) -> Result<(), String> {
    let info = client
        .call(
            "getblockchaininfo",
            json!({}),
            None,
            "Ponovno potvrđuje Signet neposredno prije wallet operacije.",
            None,
            false,
            traces,
        )
        .await?;
    if is_signet_info(&info) {
        Ok(())
    } else {
        Err(
            "STOP: Bitcoin Core više nije na Signetu. Nijedna wallet promjena nije napravljena."
                .into(),
        )
    }
}

pub fn autodetect_settings() -> Vec<ConnectionSettings> {
    let mut candidates: Vec<(PathBuf, u16)> = Vec::new();
    if let Ok(appdata) = env::var("APPDATA") {
        add_data_dir_candidates(&mut candidates, PathBuf::from(appdata).join("Bitcoin"));
    }
    if let Ok(home) = env::var("HOME") {
        let home = PathBuf::from(home);
        add_data_dir_candidates(
            &mut candidates,
            home.join("Library")
                .join("Application Support")
                .join("Bitcoin"),
        );
        add_data_dir_candidates(&mut candidates, home.join(".bitcoin"));
    }

    candidates
        .into_iter()
        .filter(|(path, _)| path.is_file())
        .map(|(path, port)| ConnectionSettings {
            host: "127.0.0.1".into(),
            port,
            cookie_path: path.to_string_lossy().into_owned(),
        })
        .collect()
}

fn add_data_dir_candidates(candidates: &mut Vec<(PathBuf, u16)>, base: PathBuf) {
    candidates.push((base.join("signet").join(".cookie"), 38_332));
    candidates.push((base.join("testnet4").join(".cookie"), 48_332));
    candidates.push((base.join("regtest").join(".cookie"), 18_443));
    candidates.push((base.join(".cookie"), 8_332));
}

pub fn offline_status(message: impl Into<String>) -> CoreStatus {
    CoreStatus {
        connected: false,
        supported: false,
        chain: None,
        version: None,
        version_label: None,
        subversion: None,
        wallet_rpc_available: false,
        cookie_path: None,
        blocks: 0,
        headers: 0,
        verification_progress: 0.0,
        initial_block_download: false,
        pruned: false,
        size_on_disk: 0,
        network_active: false,
        connections: 0,
        mempool_size: 0,
        mempool_bytes: 0,
        mempool_total_fee_btc: 0.0,
        mempool_min_fee_btc_kvb: 0.0,
        last_block_time: None,
        loaded_wallets: Vec::new(),
        message: message.into(),
    }
}

fn chain_label(chain: &str) -> &str {
    match chain {
        "main" => "MAINNET",
        "signet" => "SIGNET",
        "test" => "TESTNET",
        "testnet4" => "TESTNET4",
        "regtest" => "REGTEST",
        _ => "UNKNOWN",
    }
}

fn rpc_error_message(value: &Value) -> String {
    value
        .get("message")
        .and_then(Value::as_str)
        .or_else(|| value.as_str())
        .unwrap_or("nepoznata lokalna RPC pogreška")
        .replace('\n', " ")
        .chars()
        .take(400)
        .collect()
}

fn is_signet_info(value: &Value) -> bool {
    value.get("chain").and_then(Value::as_str) == Some("signet")
}

fn format_core_version(version: u64) -> String {
    let major = version / 10_000;
    let minor = (version / 100) % 100;
    let patch = version % 100;
    if patch == 0 {
        format!("{major}.{minor}")
    } else {
        format!("{major}.{minor}.{patch}")
    }
}

fn now_unix_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .min(u64::MAX as u128) as u64
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        io::{BufRead, BufReader, Read, Write},
        net::TcpListener,
        thread,
    };

    #[test]
    fn formats_core_versions_for_people() {
        assert_eq!(format_core_version(260_000), "26.0");
        assert_eq!(format_core_version(270_100), "27.1");
    }

    #[test]
    fn accepts_only_signet_chain_info() {
        assert!(is_signet_info(&json!({ "chain": "signet" })));
        assert!(!is_signet_info(&json!({ "chain": "main" })));
        assert!(!is_signet_info(&json!({ "chain": "test" })));
        assert!(!is_signet_info(&json!({})));
    }

    #[test]
    fn labels_every_supported_chain_with_text() {
        assert_eq!(chain_label("main"), "MAINNET");
        assert_eq!(chain_label("signet"), "SIGNET");
        assert_eq!(chain_label("testnet4"), "TESTNET4");
        assert_eq!(chain_label("regtest"), "REGTEST");
        assert_eq!(chain_label("mystery"), "UNKNOWN");
    }

    #[test]
    fn sanitizes_and_bounds_rpc_error_text() {
        let long = format!("first line\n{}", "x".repeat(600));
        let message = rpc_error_message(&json!({ "message": long }));
        assert!(!message.contains('\n'));
        assert_eq!(message.chars().count(), 400);
    }

    #[test]
    fn connects_to_a_local_signet_rpc_with_cookie_auth() {
        test_runtime().block_on(async {
            let (settings, server, cookie_path) = mock_rpc_server("signet", 4);
            let mut traces = Vec::new();
            let status = inspect_core(settings, &mut traces)
                .await
                .expect("local Signet RPC should be accepted");

            assert!(status.connected);
            assert!(status.supported);
            assert_eq!(status.chain.as_deref(), Some("signet"));
            assert_eq!(status.version_label.as_deref(), Some("28.0"));
            assert!(status.wallet_rpc_available);
            assert_eq!(traces.len(), 4);
            assert!(status.network_active);
            assert_eq!(status.blocks, 321);

            server.join().expect("mock RPC server should finish");
            let _ = fs::remove_file(cookie_path);
        });
    }

    #[test]
    fn rejects_mainnet_immediately_before_wallet_work() {
        test_runtime().block_on(async {
            let (settings, server, cookie_path) = mock_rpc_server("main", 1);
            let client = RpcClient::new(settings).expect("loopback settings should be valid");
            let mut traces = Vec::new();
            let error = ensure_signet(&client, &mut traces)
                .await
                .expect_err("mainnet must be rejected");

            assert!(error.starts_with("STOP:"));
            assert!(error.contains("nije na Signetu"));
            assert_eq!(traces.len(), 1);

            server.join().expect("mock RPC server should finish");
            let _ = fs::remove_file(cookie_path);
        });
    }

    fn test_runtime() -> tokio::runtime::Runtime {
        tokio::runtime::Builder::new_multi_thread()
            .worker_threads(2)
            .enable_all()
            .build()
            .expect("build async test runtime")
    }

    fn mock_rpc_server(
        chain: &'static str,
        request_count: usize,
    ) -> (ConnectionSettings, thread::JoinHandle<()>, PathBuf) {
        let listener = TcpListener::bind("127.0.0.1:0").expect("bind loopback mock RPC");
        let port = listener.local_addr().expect("mock address").port();
        let cookie_path = env::temp_dir().join(format!(
            "core-vault-rpc-test-{}-{port}.cookie",
            std::process::id()
        ));
        fs::write(&cookie_path, "user:pass\n").expect("write mock cookie");

        let server = thread::spawn(move || {
            for _ in 0..request_count {
                let (mut stream, _) = listener.accept().expect("accept mock RPC request");
                let mut reader = BufReader::new(stream.try_clone().expect("clone mock stream"));
                let mut content_length = 0usize;
                let mut authorized = false;
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
                    if lower.trim() == "authorization: basic dxnlcjpwyxnz" {
                        authorized = true;
                    }
                }
                assert!(authorized, "request must use the cookie as Basic auth");

                let mut body = vec![0u8; content_length];
                reader.read_exact(&mut body).expect("read request body");
                let request: Value = serde_json::from_slice(&body).expect("parse RPC request");
                let method = request.get("method").and_then(Value::as_str).unwrap_or("");
                let result = match method {
                    "getblockchaininfo" => json!({
                        "chain": chain,
                        "blocks": 321,
                        "headers": 321,
                        "verificationprogress": 1.0,
                        "initialblockdownload": false,
                        "pruned": false,
                        "size_on_disk": 123456,
                        "mediantime": 1700000000
                    }),
                    "getnetworkinfo" => {
                        json!({
                            "version": 280_000,
                            "subversion": "/Satoshi:28.0.0/",
                            "networkactive": true,
                            "connections": 8
                        })
                    }
                    "getmempoolinfo" => json!({
                        "size": 4,
                        "bytes": 880,
                        "total_fee": 0.00001,
                        "mempoolminfee": 0.00001
                    }),
                    "listwallets" => json!([]),
                    other => panic!("unexpected mock RPC method: {other}"),
                };
                let response_body =
                    json!({ "result": result, "error": null, "id": "core-vault-ui" }).to_string();
                write!(
                    stream,
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    response_body.len(),
                    response_body
                )
                .expect("write mock RPC response");
            }
        });

        (
            ConnectionSettings {
                host: "127.0.0.1".into(),
                port,
                cookie_path: cookie_path.to_string_lossy().into_owned(),
            },
            server,
            cookie_path,
        )
    }
}
