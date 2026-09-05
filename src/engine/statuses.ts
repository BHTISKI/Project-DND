import type { Character, StatusEffect, StatusId } from '../types/game';

export const statusNames: Record<StatusId, string> = {
  vulnerable: 'Savunmasız', weakened: 'Güçsüz', poisoned: 'Zehirli',
  fortified: 'Tahkimli', empowered: 'Güçlü', postureExposed: 'Duruş açığı',
  bleeding: 'Kanama', reflection: 'Yansıma', regeneration: 'Yenilenme', timeLocked: 'Zaman kilidi',
};

export function addStatus(statuses: StatusEffect[], effect: StatusEffect): StatusEffect[] {
  const normalized = { ...effect, stacks: Math.min(3, effect.stacks), value: effect.value ?? 1 };
  const existing = statuses.find(s => s.id === effect.id);
  if (!existing) return [...statuses, normalized];
  return statuses.map(s => s.id === effect.id
    ? { ...normalized, duration: Math.max(s.duration, effect.duration), stacks: Math.min(3, s.stacks + effect.stacks) }
    : s);
}

export function statusValue(statuses: StatusEffect[], id: StatusId): number {
  const s = statuses.find(s => s.id === id && s.duration > 0);
  return s ? (s.value ?? 1) * s.stacks : 0;
}

export function ageStatuses(statuses: StatusEffect[]): StatusEffect[] {
  return statuses.filter(s => s.duration > 1).map(s => ({ ...s, duration: s.duration - 1 }));
}

export function poisonTick(statuses: StatusEffect[], target: 'player' | 'enemy', character: Character) {
  const damage = Math.min(character.mevcutCan, statusValue(statuses, 'poisoned') + 2 * statusValue(statuses, 'bleeding'));
  const remaining = Math.max(0, character.mevcutCan - damage);
  const healed = remaining > 0 ? Math.min(character.maksimumCan - remaining, statusValue(statuses, 'regeneration')) : 0;
  return {
    character: { ...character, mevcutCan: remaining + healed },
    log: [...(damage > 0 ? [`${target === 'player' ? 'Oyuncu' : 'Düşman'} zehir/kanamadan ${damage} hasar aldı.`] : []), ...(healed > 0 ? [`Yenilenme: ${healed} can.`] : [])],
  };
}
