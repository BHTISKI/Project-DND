export interface MetaState {
  metaGold: number;
  metaVictories: number;
}

const META_GOLD_KEY = 'metaGold';
const META_VICTORIES_KEY = 'metaVictories';

function parseMetaValue(value: string | null): number {
  if (value === null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function loadMetaState(): MetaState {
  try {
    return {
      metaGold: parseMetaValue(window.localStorage.getItem(META_GOLD_KEY)),
      metaVictories: parseMetaValue(window.localStorage.getItem(META_VICTORIES_KEY)),
    };
  } catch {
    return { metaGold: 0, metaVictories: 0 };
  }
}

export function saveMetaState(metaGold: number, metaVictories: number): void {
  try {
    window.localStorage.setItem(META_GOLD_KEY, String(metaGold));
    window.localStorage.setItem(META_VICTORIES_KEY, String(metaVictories));
  } catch {
    // Persistence is best effort when storage is unavailable or restricted.
  }
}
