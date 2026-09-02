// Bu dosya src/engine/combatResolver.ts için ilgili kodları içerir.
// Savaş çözümleyici: düşman niyetini belirler ve hasar hesaplar
// Savaş çözümleyici: düşman niyetini belirler ve hasar/blok hesaplar
// Savaş çözümleyici: düşman niyetini belirler ve hasar/blok hesaplar
import type { Character, EnemyArchetypeId, EnemyIntent } from '../types/game';

const archetypes: Record<EnemyArchetypeId, { hp: number; ac: number; power: number; attackDamage: number; block: number; special: 'heal' | 'damage' | 'weakened'; weights: [number, number, number] }> = {
  goblin: { hp: 7, ac: 11, power: 1, attackDamage: 4, block: 2, special: 'weakened', weights: [0.65, 0.2, 0.15] },
  guardian: { hp: 11, ac: 13, power: 0, attackDamage: 5, block: 4, special: 'heal', weights: [0.3, 0.55, 0.15] },
  mage: { hp: 8, ac: 10, power: 2, attackDamage: 3, block: 2, special: 'damage', weights: [0.35, 0.15, 0.5] },
};

export function chooseArchetype(victoryCount: number): EnemyArchetypeId {
  return (['goblin', 'guardian', 'mage'] as EnemyArchetypeId[])[victoryCount % 3];
}

export function createEnemy(archetypeId: EnemyArchetypeId, tier: number): Character {
  const archetype = archetypes[archetypeId];
  const hp = archetype.hp + tier * (archetypeId === 'guardian' ? 3 : 2);
  return { id: `enemy-${tier}`, isim: archetypeId === 'goblin' ? 'Goblin' : archetypeId === 'guardian' ? 'Muhafız' : 'Büyücü', mevcutCan: hp, maksimumCan: hp, zirhSinifi: archetype.ac + Math.floor(tier / 2), gucCarpani: archetype.power + Math.floor(tier / 3), advantageCounter: 0, disadvantageCounter: 0 };
}

export function generateEnemyIntent(enemy: Character, archetypeId: EnemyArchetypeId): { intent: EnemyIntent; value: number; block: number } {
  const archetype = archetypes[archetypeId];
  const roll = Math.random();
  if (roll < archetype.weights[0]) {
    const value = archetype.attackDamage + enemy.gucCarpani;
    return { intent: { type: 'attack', estimatedDamage: value }, value, block: 0 };
  }
  if (roll < archetype.weights[0] + archetype.weights[1]) {
    const block = archetype.block;
    return { intent: { type: 'defend', estimatedBlock: block }, value: block, block };
  }
  if (archetype.special === 'heal') return { intent: { type: 'special', estimatedHeal: 4 }, value: 4, block: 0 };
  if (archetype.special === 'damage') return { intent: { type: 'special', estimatedDamage: 6 + enemy.gucCarpani }, value: 6 + enemy.gucCarpani, block: 0 };
  return { intent: { type: 'special' }, value: 0, block: 0 };
}
