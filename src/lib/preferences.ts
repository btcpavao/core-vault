import { preferredLanguage, type Language } from "../i18n";

export interface Preferences {
  language: Language;
  reducedMotion: boolean;
  ambientSound: boolean;
  interactionSound: boolean;
  muted: boolean;
  volume: number;
  walkthroughComplete: boolean;
  soundChoiceMade: boolean;
}

export const PREFERENCES_KEY = "core-vault:preferences:v1";

export const defaultPreferences = (): Preferences => ({
  language: preferredLanguage(),
  reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  ambientSound: false,
  interactionSound: false,
  muted: true,
  volume: 0.22,
  walkthroughComplete: false,
  soundChoiceMade: false,
});

export const loadPreferences = (): Preferences => {
  const defaults = defaultPreferences();
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "{}") as Partial<Preferences>;
    return {
      ...defaults,
      ...parsed,
      language: parsed.language === "hr" ? "hr" : parsed.language === "en" ? "en" : defaults.language,
      volume: Math.max(0, Math.min(1, Number(parsed.volume ?? defaults.volume))),
    };
  } catch {
    return defaults;
  }
};

export const savePreferences = (preferences: Preferences): void => {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
};
