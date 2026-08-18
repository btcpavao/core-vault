import { useEffect, useState } from "react";
import { coreApi, isTauriRuntime } from "../lib/tauri";
import type { ConnectionSettings, CoreStatus } from "../types";

export interface NodeStatusReadState {
  status: CoreStatus | null;
  reading: boolean;
  message: string | null;
}

const qaRuntimeEnabled =
  import.meta.env.DEV || import.meta.env.VITE_CV_ER10B_QA === "1";
const qaCookiePath = qaRuntimeEnabled
  ? import.meta.env.VITE_CORE_QA_COOKIE_PATH
  : undefined;
const qaPort = qaRuntimeEnabled
  ? Number(import.meta.env.VITE_CORE_QA_PORT)
  : Number.NaN;
const QA_CONNECTION_SETTINGS: ConnectionSettings | null =
  qaCookiePath && Number.isInteger(qaPort)
    ? { host: "127.0.0.1", port: qaPort, cookiePath: qaCookiePath }
    : null;
const REFRESH_INTERVAL_MS = QA_CONNECTION_SETTINGS ? 250 : 5_000;

const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : String(cause);

/**
 * Owns the single read-only NodeStatus cadence for the isolated experience view.
 * It reuses the existing typed Tauri client and pauses polling while the document
 * is hidden. No scene component receives this client or any RPC authority.
 */
export function useNodeStatus(): NodeStatusReadState {
  const [state, setState] = useState<NodeStatusReadState>({
    status: null,
    reading: isTauriRuntime(),
    message: isTauriRuntime()
      ? null
      : "Live node status is available only inside the Core Vault desktop runtime.",
  });

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let active = true;
    let currentStatus: CoreStatus | null = null;

    const refresh = async () => {
      if (document.visibilityState === "hidden") return;

      try {
        const operation = currentStatus?.connected
          ? await coreApi.status()
          : QA_CONNECTION_SETTINGS
            ? await coreApi.connect(QA_CONNECTION_SETTINGS)
            : await coreApi.discover();

        currentStatus = operation.data;
        if (active) {
          setState({ status: operation.data, reading: false, message: null });
        }
      } catch (cause) {
        currentStatus = null;
        if (active) {
          setState({ status: null, reading: false, message: errorMessage(cause) });
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return state;
}

export function useDocumentVisibility(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState !== "hidden");

  useEffect(() => {
    const onVisibilityChange = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return visible;
}
