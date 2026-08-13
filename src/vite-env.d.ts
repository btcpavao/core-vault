/// <reference types="vite/client" />

declare global {
  interface Window {
    __TAURI_IPC__?: unknown;
  }
}

export {};
