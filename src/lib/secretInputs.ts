type PasswordInputRef = {
  current: HTMLInputElement | null;
};

export function clearPasswordInputs(...refs: PasswordInputRef[]): void {
  for (const ref of refs) {
    if (ref.current) ref.current.value = "";
  }
}
