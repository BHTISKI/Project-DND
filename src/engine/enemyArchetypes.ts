import type { Character, EnemyArchetypeId, EnemyIntent } from '../types/game';
import { initialPosture, withEnemyPosture } from '../mechanics/posture';

export interface EnemyArchetypeConfig {
  name: string;
  hp: number;
  damageBonus: number;
  attackDamage: number;
  block: number;
  special: 'heal' | 'damage' | 'weakened';
  weights: [number, number, number];
  icon: string;
  visualTheme: 'goblin' | 'guardian' | 'mage' | 'assassin' | 'knight';
  role: string;
  cardCount: number;
}

export const enemyArchetypes: Record<EnemyArchetypeId, EnemyArchetypeConfig> = {
  goblin: { name: 'Goblin', hp: 7, damageBonus: 1, attackDamage: 4, block: 2, special: 'weakened', weights: [0.65, 0.2, 0.15], icon: 'G', visualTheme: 'goblin', role: 'Fırsatçı yağmacı', cardCount: 5 },
  guardian: { name: 'Muhafız', hp: 11, damageBonus: 0, attackDamage: 5, block: 4, special: 'heal', weights: [0.3, 0.55, 0.15], icon: '◆', visualTheme: 'guardian', role: 'Siper savaşçısı', cardCount: 6 },
  mage: { name: 'Büyücü', hp: 8, damageBonus: 2, attackDamage: 3, block: 2, special: 'damage', weights: [0.35, 0.15, 0.5], icon: '✦', visualTheme: 'mage', role: 'Kader dokuyucusu', cardCount: 5 },
  assassin: { name: 'Gölge Suikastçısı', hp: 6, damageBonus: 2, attackDamage: 5, block: 1, special: 'weakened', weights: [0.5, 0.1, 0.4], icon: '☠', visualTheme: 'assassin', role: 'Zehirli pusucu', cardCount: 4 },
  knight: { name: 'Kara Şövalye', hp: 14, damageBonus: 1, attackDamage: 6, block: 5, special: 'heal', weights: [0.35, 0.5, 0.15], icon: '♜', visualTheme: 'knight', role: 'Karşılık ustası', cardCount: 7 },
};

export function chooseArchetype(victoryCount: number): EnemyArchetypeId {
  if (victoryCount < 5) return (['goblin', 'guardian', 'mage'] as EnemyArchetypeId[])[victoryCount % 3];
  return (['assassin', 'knight', 'goblin', 'guardian', 'mage'] as EnemyArchetypeId[])[(victoryCount - 5) % 5];
}

export function createEnemy(archetypeId: EnemyArchetypeId, tier: number): Character {
  const archetype = enemyArchetypes[archetypeId];
  const hp = archetype.hp + tier * (archetypeId === 'guardian' || archetypeId === 'knight' ? 3 : 2);
  return { id: `enemy-${tier}`, isim: archetype.name, mevcutCan: hp, maksimumCan: hp, hasarBonusu: archetype.damageBonus + Math.floor(tier / 3), ...initialPosture(archetypeId) };
}

export function generateEnemyIntent(enemy: Character, archetypeId: EnemyArchetypeId, previous?: EnemyIntent | null): { intent: EnemyIntent; value: number; block: number } {
  const archetype = enemyArchetypes[archetypeId];
  const weights = [...archetype.weights];
  if (previous?.type === 'attack') weights[0] *= 0.7;
  if (previous?.type === 'defend') weights[1] *= 0.7;
  const roll = Math.random() * (weights[0] + weights[1] + weights[2]);
  if (roll < weights[0]) {
    const value = archetype.attackDamage + enemy.hasarBonusu;
    return { intent: { type: 'attack', estimatedDamage: value, effectKey: 'archetype-attack',
      action: withEnemyPosture({ kind: 'attack', damage: value }, archetypeId) }, value, block: 0 };
  }
  if (roll < weights[0] + weights[1]) {
    const block = archetype.block;
    return { intent: { type: 'defend', estimatedBlock: block, effectKey: 'archetype-defend',
      action: withEnemyPosture({ kind: 'defend', block }, archetypeId) }, value: block, block };
  }
  if (archetype.special === 'heal') return { intent: { type: 'special', estimatedHeal: 4, effectKey: 'heal',
    action: withEnemyPosture({ kind: 'heal', damage: 4 }, archetypeId) }, value: 4, block: 0 };
  if (archetype.special === 'damage') {
    const damage = 6 + enemy.hasarBonusu;
    return { intent: { type: 'special', estimatedDamage: damage, effectKey: 'arcane-blast',
      action: withEnemyPosture({ kind: 'magic', damage, isRanged: true }, archetypeId) }, value: damage, block: 0 };
  }
  return { intent: { type: 'special', effectKey: 'weakened',
    action: withEnemyPosture({ kind: 'weaken' }, archetypeId) }, value: 0, block: 0 };
}
