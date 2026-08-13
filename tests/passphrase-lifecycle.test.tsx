// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SpatialApp from "../src/SpatialApp";
import {
  demoSnapshot,
  demoSpatialCore,
  demoSpend,
  demoVaultItem,
} from "../src/lib/spatialDemo";
import type { Operation, PersonalSpendView, VaultListItem } from "../src/types";

const api = vi.hoisted(() => ({
  discover: vi.fn(),
  listVaults: vi.fn(),
  createPersonalVault: vi.fn(),
  getPersonalVault: vi.fn(),
  changePersonalPassphrase: vi.fn(),
  createPersonalSpend: vi.fn(),
  signPersonalSpend: vi.fn(),
}));

vi.mock("../src/lib/tauri", () => ({
  coreApi: api,
  isTauriRuntime: () => true,
  choosePersonalBackupDestination: vi.fn(),
  choosePersonalRestoreSource: vi.fn(),
}));

vi.mock("../src/lib/audio", () => ({
  playInteraction: vi.fn(),
  setAmbient: vi.fn(),
}));

const TEST_SECRET = "cv-test-passphrase-NOT-A-REAL-SECRET-9384";

const operation = <T,>(data: T): Operation<T> => ({ data, rpc: [] });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

function expectSecretAbsent(secret: string) {
  expect(document.body.textContent).not.toContain(secret);
  for (const input of document.querySelectorAll("input")) {
    expect(input.value).not.toBe(secret);
  }
}

async function renderConnected(vaults: VaultListItem[]) {
  api.listVaults.mockResolvedValue(operation(vaults));
  render(<SpatialApp />);
  await waitFor(() => expect(api.listVaults).toHaveBeenCalled());
}

function clickRoom(name: string) {
  const exact = screen.queryByRole("button", { name });
  fireEvent.click(exact ?? screen.getByRole("button", { name: new RegExp(`^${name}\\.`) }));
}

async function openCreateForm() {
  clickRoom("Workshop");
  const frame = screen.queryByRole("button", { name: /^Personal vault frame\./ });
  if (frame) {
    fireEvent.click(frame);
    fireEvent.click(screen.getByRole("button", { name: /^Signing key\./ }));
    fireEvent.click(screen.getByRole("button", { name: /^1 key → 1 required\./ }));
  } else {
    fireEvent.click(screen.getByRole("button", { name: /^Personal Vault/ }));
  }
  return screen.findByRole("dialog", { name: "Create Personal Vault" });
}

async function openVault() {
  fireEvent.click(screen.getByRole("button", { name: /Harbour Vault/ }));
  await waitFor(() => expect(api.getPersonalVault).toHaveBeenCalled());
  fireEvent.click(screen.getByText("Technical details"));
}

async function openSigningReview() {
  fireEvent.click(screen.getByRole("button", { name: /^Send/ }));
  const dialog = await screen.findByRole("dialog", { name: "Send" });
  const destination = dialog.querySelector<HTMLInputElement>('input[placeholder="tb1…"]');
  expect(destination).not.toBeNull();
  fireEvent.change(destination!, {
    target: { value: "bcrt1ptestdestination000000000000000000000000000000000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create PSBT proposal" }));
  await waitFor(() => expect(api.createPersonalSpend).toHaveBeenCalled());
  await waitFor(() => expect(dialog.querySelector('input[type="password"]')).not.toBeNull());
  return dialog.querySelector<HTMLInputElement>('input[type="password"]')!;
}

beforeEach(() => {
  for (const mock of Object.values(api)) mock.mockReset();
  localStorage.clear();
  localStorage.setItem("core-vault:preferences:v1", JSON.stringify({
    language: "en",
    reducedMotion: true,
    ambientSound: false,
    interactionSound: false,
    muted: true,
    volume: 0,
    walkthroughComplete: true,
    soundChoiceMade: true,
  }));
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: true })),
  });

  api.discover.mockResolvedValue(operation({
    ...demoSpatialCore,
    connected: true,
    supported: true,
    chain: "regtest",
    message: "Connected to isolated Regtest.",
  }));
  api.getPersonalVault.mockResolvedValue(operation(demoSnapshot));
  api.createPersonalSpend.mockResolvedValue(operation(demoSpend()));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Personal Vault passphrase DOM lifecycle", () => {
  it("clears create passphrases before a successful privileged operation settles", async () => {
    const pending = deferred<Operation<typeof demoSnapshot.vault>>();
    api.createPersonalVault.mockReturnValue(pending.promise);
    await renderConnected([]);
    const dialog = await openCreateForm();

    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "New Vault" } });
    fireEvent.change(screen.getByLabelText("Core wallet name"), { target: { value: "new_vault" } });
    const [passphrase, confirmation] = dialog.querySelectorAll<HTMLInputElement>('input[type="password"]');
    fireEvent.change(passphrase, { target: { value: TEST_SECRET } });
    fireEvent.change(confirmation, { target: { value: TEST_SECRET } });
    fireEvent.click(screen.getByRole("button", { name: "Create encrypted vault" }));

    await waitFor(() => expect(api.createPersonalVault).toHaveBeenCalled());
    expect(passphrase.value).toBe("");
    expect(confirmation.value).toBe("");
    expectSecretAbsent(TEST_SECRET);

    await act(async () => pending.resolve(operation(demoSnapshot.vault)));
    await waitFor(() => expect(api.getPersonalVault).toHaveBeenCalled());
    expect(passphrase.value).toBe("");
    expect(confirmation.value).toBe("");
  });

  it("clears create passphrases after failure while preserving non-secret fields", async () => {
    const pending = deferred<Operation<typeof demoSnapshot.vault>>();
    api.createPersonalVault.mockReturnValue(pending.promise);
    await renderConnected([]);
    const dialog = await openCreateForm();

    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Retry Vault" } });
    fireEvent.change(screen.getByLabelText("Core wallet name"), { target: { value: "retry_vault" } });
    const [passphrase, confirmation] = dialog.querySelectorAll<HTMLInputElement>('input[type="password"]');
    fireEvent.change(passphrase, { target: { value: TEST_SECRET } });
    fireEvent.change(confirmation, { target: { value: TEST_SECRET } });
    fireEvent.click(screen.getByRole("button", { name: "Create encrypted vault" }));

    await waitFor(() => expect(api.createPersonalVault).toHaveBeenCalled());
    expect(passphrase.value).toBe("");
    expect(confirmation.value).toBe("");
    await act(async () => pending.reject(new Error("Mocked Core create failure")));
    await screen.findByRole("alert");
    await waitFor(() => {
      expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Retry Vault");
      expect((screen.getByLabelText("Core wallet name") as HTMLInputElement).value).toBe("retry_vault");
    });
    const retryDialog = await screen.findByRole("dialog", { name: "Create Personal Vault" });
    const [retryPassphrase, retryConfirmation] = retryDialog.querySelectorAll<HTMLInputElement>('input[type="password"]');
    expect(retryPassphrase.value).toBe("");
    expect(retryConfirmation.value).toBe("");
    expectSecretAbsent(TEST_SECRET);
  });

  it("clears create passphrases when the interaction is closed", async () => {
    await renderConnected([]);
    const dialog = await openCreateForm();
    const [passphrase, confirmation] = dialog.querySelectorAll<HTMLInputElement>('input[type="password"]');
    fireEvent.change(passphrase, { target: { value: TEST_SECRET } });
    fireEvent.change(confirmation, { target: { value: TEST_SECRET } });

    fireEvent.click(screen.getByRole("button", { name: "Close Create Personal Vault" }));

    expect(passphrase.value).toBe("");
    expect(confirmation.value).toBe("");
    expectSecretAbsent(TEST_SECRET);
  });

  it("clears all passphrase-change fields before success settles", async () => {
    const pending = deferred<Operation<boolean>>();
    api.changePersonalPassphrase.mockReturnValue(pending.promise);
    await renderConnected([demoVaultItem]);
    await openVault();

    const current = screen.getByLabelText("Current passphrase") as HTMLInputElement;
    const next = screen.getByLabelText("New passphrase") as HTMLInputElement;
    const confirmation = screen.getByLabelText("Confirm new passphrase") as HTMLInputElement;
    fireEvent.change(current, { target: { value: TEST_SECRET } });
    fireEvent.change(next, { target: { value: `${TEST_SECRET}-new` } });
    fireEvent.change(confirmation, { target: { value: `${TEST_SECRET}-new` } });
    fireEvent.click(screen.getByRole("button", { name: "Change passphrase locally" }));

    await waitFor(() => expect(api.changePersonalPassphrase).toHaveBeenCalled());
    expect(current.value).toBe("");
    expect(next.value).toBe("");
    expect(confirmation.value).toBe("");
    await act(async () => pending.resolve(operation(true)));
    await screen.findByText(/Passphrase changed; fields cleared/);
    expectSecretAbsent(TEST_SECRET);
  });

  it("clears and refocuses all passphrase-change fields after failure", async () => {
    const pending = deferred<Operation<boolean>>();
    api.changePersonalPassphrase.mockReturnValue(pending.promise);
    await renderConnected([demoVaultItem]);
    await openVault();

    const current = screen.getByLabelText("Current passphrase") as HTMLInputElement;
    const next = screen.getByLabelText("New passphrase") as HTMLInputElement;
    const confirmation = screen.getByLabelText("Confirm new passphrase") as HTMLInputElement;
    fireEvent.change(current, { target: { value: TEST_SECRET } });
    fireEvent.change(next, { target: { value: `${TEST_SECRET}-new` } });
    fireEvent.change(confirmation, { target: { value: `${TEST_SECRET}-new` } });
    fireEvent.click(screen.getByRole("button", { name: "Change passphrase locally" }));

    await waitFor(() => expect(api.changePersonalPassphrase).toHaveBeenCalled());
    expect(current.value).toBe("");
    expect(next.value).toBe("");
    expect(confirmation.value).toBe("");
    await act(async () => pending.reject(new Error("Incorrect wallet passphrase")));
    await screen.findByRole("alert");
    await waitFor(() => expect(document.activeElement).toBe(current));
    expect(current.value).toBe("");
    expect(next.value).toBe("");
    expect(confirmation.value).toBe("");
    expectSecretAbsent(TEST_SECRET);
  });

  it("clears the signing passphrase before successful signing settles", async () => {
    const pending = deferred<Operation<PersonalSpendView>>();
    api.signPersonalSpend.mockReturnValue(pending.promise);
    await renderConnected([demoVaultItem]);
    await openVault();
    const passphrase = await openSigningReview();
    fireEvent.change(passphrase, { target: { value: TEST_SECRET } });
    fireEvent.click(screen.getByRole("button", { name: "Unlock briefly and sign" }));

    await waitFor(() => expect(api.signPersonalSpend).toHaveBeenCalled());
    expect(passphrase.value).toBe("");
    await act(async () => pending.resolve(operation({
      ...demoSpend(),
      state: "threshold-reached",
      complete: true,
    })));
    await screen.findByRole("button", { name: "Finalize and test mempool acceptance" });
    expect(passphrase.value).toBe("");
    expectSecretAbsent(TEST_SECRET);
  });

  it("clears failed signing secrets and keeps the proposal retryable", async () => {
    const pending = deferred<Operation<PersonalSpendView>>();
    api.signPersonalSpend.mockReturnValueOnce(pending.promise);
    await renderConnected([demoVaultItem]);
    await openVault();
    const passphrase = await openSigningReview();
    fireEvent.change(passphrase, { target: { value: TEST_SECRET } });
    fireEvent.click(screen.getByRole("button", { name: "Unlock briefly and sign" }));

    await waitFor(() => expect(api.signPersonalSpend).toHaveBeenCalledTimes(1));
    expect(passphrase.value).toBe("");
    await act(async () => pending.reject(new Error("Incorrect wallet passphrase")));
    await screen.findByRole("alert");
    await waitFor(() => expect(document.activeElement).toBe(passphrase));
    expect(passphrase.value).toBe("");
    expect(screen.getByRole("button", { name: "Unlock briefly and sign" })).toBeTruthy();
    expectSecretAbsent(TEST_SECRET);

    api.signPersonalSpend.mockResolvedValueOnce(operation({
      ...demoSpend(),
      state: "threshold-reached",
      complete: true,
    }));
    fireEvent.change(passphrase, { target: { value: "replacement-test-passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Unlock briefly and sign" }));
    await waitFor(() => expect(api.signPersonalSpend).toHaveBeenCalledTimes(2));
    expect(passphrase.value).toBe("");
  });
});
