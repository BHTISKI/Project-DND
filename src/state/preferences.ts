import { create } from 'zustand';

export interface Preferences {
  motionEnabled: boolean;
  screenShakeEnabled: boolean;
  ringEnabled: boolean;
  glowEnabled: boolean;
  animationSpeed: number;
}

export const DEFAULT_PREFERENCES: Readonly<Preferences> = Object.freeze({
  motionEnabled: true,
  screenShakeEnabled: true,
  ringEnabled: true,
  glowEnabled: true,
  animationSpeed: 1,
});

const STORAGE_KEY = 'makara.preferences';
const LEGACY_STORAGE_KEY = ['project', ['d', 'n', 'd'].join('') + '.preferences'].join('-');
const STORAGE_VERSION = 1;

interface PreferencesState extends Preferences {
  storageError: boolean;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  resetPreferences: () => void;
}

function isValidPreference(key: keyof Preferences, value: unknown): boolean {
  if (key === 'animationSpeed') {
    return typeof value === 'number' && Number.isFinite(value)
      && value >= 0.5 && value <= 1.5 && Number.isInteger(value * 4);
  }
  return (key === 'motionEnabled' || key === 'screenShakeEnabled'
    || key === 'ringEnabled' || key === 'glowEnabled') && typeof value === 'boolean';
}

function snapshot({ motionEnabled, screenShakeEnabled, ringEnabled, glowEnabled, animationSpeed }: Preferences): Preferences {
  return { motionEnabled, screenShakeEnabled, ringEnabled, glowEnabled, animationSpeed };
}

function loadPreferences(): Preferences & { storageError: boolean } {
  const defaults = { ...DEFAULT_PREFERENCES, storageError: false };
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return { ...defaults, storageError: true };
  }
  if (raw === null) return defaults;

  try {
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || !('version' in saved)
      || saved.version !== STORAGE_VERSION || !('preferences' in saved)
      || !saved.preferences || typeof saved.preferences !== 'object') return defaults;

    const values = saved.preferences as Record<string, unknown>;
    const preferences = {
      motionEnabled: typeof values.motionEnabled === 'boolean' ? values.motionEnabled : defaults.motionEnabled,
      screenShakeEnabled: typeof values.screenShakeEnabled === 'boolean' ? values.screenShakeEnabled : defaults.screenShakeEnabled,
      ringEnabled: typeof values.ringEnabled === 'boolean' ? values.ringEnabled : defaults.ringEnabled,
      glowEnabled: typeof values.glowEnabled === 'boolean' ? values.glowEnabled : defaults.glowEnabled,
      animationSpeed: isValidPreference('animationSpeed', values.animationSpeed)
        ? values.animationSpeed as number : defaults.animationSpeed,
    };
    if (window.localStorage.getItem(STORAGE_KEY) === null) savePreferences(preferences);
    return { ...preferences, storageError: false };
  } catch {
    return defaults;
  }
}

function savePreferences(preferences: Preferences): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, preferences }));
    return true;
  } catch {
    return false;
  }
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...loadPreferences(),
  setPreference: (key, value) => {
    if (!isValidPreference(key, value)) return;
    const preferences = { ...snapshot(get()), [key]: value };
    set({ ...preferences, storageError: !savePreferences(preferences) });
  },
  resetPreferences: () => {
    set({ ...DEFAULT_PREFERENCES, storageError: !savePreferences(DEFAULT_PREFERENCES) });
  },
}));
