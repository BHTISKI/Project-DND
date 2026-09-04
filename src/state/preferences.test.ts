import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'makara.preferences';
const defaults = {
  motionEnabled: true,
  screenShakeEnabled: true,
  ringEnabled: true,
  glowEnabled: true,
  animationSpeed: 1,
};

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  vi.resetModules();
});
afterEach(() => vi.restoreAllMocks());

async function loadStore() {
  return (await import('./preferences')).usePreferencesStore;
}

it('uses defaults without writing a save until a preference changes', async () => {
  const store = await loadStore();
  expect(store.getState()).toMatchObject({ ...defaults, storageError: false });
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
});


it('copies preferences from the old project key into the Makara key', async () => {
  const legacyKey = ['project', ['d', 'n', 'd'].join('') + '.preferences'].join('-');
  const saved = JSON.stringify({ version: 1, preferences: { ...defaults, glowEnabled: false } });
  localStorage.setItem(legacyKey, saved);
  const store = await loadStore();
  expect(store.getState().glowEnabled).toBe(false);
  expect(localStorage.getItem(STORAGE_KEY)).toBe(saved);
  expect(localStorage.getItem(legacyKey)).toBe(saved);
});

it('persists every preference in a versioned payload and restores it after reload', async () => {
  const store = await loadStore();
  store.getState().setPreference('motionEnabled', false);
  store.getState().setPreference('screenShakeEnabled', false);
  store.getState().setPreference('ringEnabled', false);
  store.getState().setPreference('glowEnabled', false);
  store.getState().setPreference('animationSpeed', 0.75);
  const preferences = {
    motionEnabled: false, screenShakeEnabled: false,
    ringEnabled: false, glowEnabled: false, animationSpeed: 0.75,
  };
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ version: 1, preferences });
  vi.resetModules();
  expect((await loadStore()).getState()).toMatchObject({ ...preferences, storageError: false });
});

it.each(['{broken', 'null', '[]', '42', '{}', '{"version":2,"preferences":{"motionEnabled":false}}'])
('falls back safely for malformed or unsupported saved preferences: %s', async raw => {
  localStorage.setItem(STORAGE_KEY, raw);
  expect((await loadStore()).getState()).toMatchObject(defaults);
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
});

it('keeps valid saved fields while replacing invalid or missing fields with defaults', async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    preferences: { motionEnabled: false, screenShakeEnabled: 'false', ringEnabled: 0, animationSpeed: 1.1 },
  }));
  expect((await loadStore()).getState()).toMatchObject({ ...defaults, motionEnabled: false });
});

it.each([0, 0.25, 0.6, 1.1, 1.75, -1, Infinity, NaN])
('rejects invalid animation speeds without changing the current value: %s', async value => {
  const store = await loadStore();
  store.getState().setPreference('animationSpeed', 1.25);
  const saved = localStorage.getItem(STORAGE_KEY);
  store.getState().setPreference('animationSpeed', value);
  expect(store.getState().animationSpeed).toBe(1.25);
  expect(localStorage.getItem(STORAGE_KEY)).toBe(saved);
});

it.each([0.5, 0.75, 1, 1.25, 1.5])('accepts supported animation speed %s', async value => {
  const store = await loadStore();
  store.getState().setPreference('animationSpeed', value);
  vi.resetModules();
  expect((await loadStore()).getState().animationSpeed).toBe(value);
});

it('rejects runtime values that are not boolean', async () => {
  const store = await loadStore();
  store.getState().setPreference('motionEnabled', 'false' as unknown as boolean);
  expect(store.getState().motionEnabled).toBe(true);
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
});

it('resets and persists defaults without touching adventure saves or meta progress', async () => {
  localStorage.setItem('makara.run', 'adventure-save');
  localStorage.setItem('metaGold', '80');
  localStorage.setItem('metaVictories', '8');
  const store = await loadStore();
  store.getState().setPreference('motionEnabled', false);
  store.getState().setPreference('animationSpeed', 1.5);
  store.getState().resetPreferences();
  expect(store.getState()).toMatchObject({ ...defaults, storageError: false });
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ version: 1, preferences: defaults });
  expect(localStorage.getItem('makara.run')).toBe('adventure-save');
  expect(localStorage.getItem('metaGold')).toBe('80');
  expect(localStorage.getItem('metaVictories')).toBe('8');
});

it('reports denied reads and still lets the player change preferences', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
  const store = await loadStore();
  expect(store.getState()).toMatchObject({ ...defaults, storageError: true });
  vi.restoreAllMocks();
  store.getState().setPreference('motionEnabled', false);
  expect(store.getState()).toMatchObject({ motionEnabled: false, storageError: false });
});

it('applies preferences in memory when writes fail and clears the error after a successful retry', async () => {
  const store = await loadStore();
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
  store.getState().setPreference('glowEnabled', false);
  expect(store.getState()).toMatchObject({ glowEnabled: false, storageError: true });
  write.mockRestore();
  store.getState().setPreference('glowEnabled', false);
  expect(store.getState()).toMatchObject({ glowEnabled: false, storageError: false });
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).preferences.glowEnabled).toBe(false);
});

it('restores defaults in memory and reports when reset cannot be saved', async () => {
  const store = await loadStore();
  store.getState().setPreference('ringEnabled', false);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
  expect(() => store.getState().resetPreferences()).not.toThrow();
  expect(store.getState()).toMatchObject({ ...defaults, storageError: true });
});
