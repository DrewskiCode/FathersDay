const SETTINGS_KEY = "pyro-pyro-settings";

export type GameSettings = {
  musicEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
};

export const DEFAULT_SETTINGS: GameSettings = {
  musicEnabled: true,
  musicVolume: 0.4,
  sfxVolume: 0.85,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      musicEnabled: parsed.musicEnabled ?? DEFAULT_SETTINGS.musicEnabled,
      musicVolume: clamp01(parsed.musicVolume ?? DEFAULT_SETTINGS.musicVolume),
      sfxVolume: clamp01(parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
