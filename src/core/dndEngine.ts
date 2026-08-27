import type { Card } from '../types/game';

export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function resolveAttack(card: Card, attackerModifier: number, targetAC: number): number {
  const rawRoll = rollDice(20);
  const total = rawRoll + attackerModifier;
  
  if (total >= targetAC) {
    if (rawRoll === 20) {
      return card.baseHasar * 2;
    }
    return card.baseHasar;
  }
  
  return 0;
}
