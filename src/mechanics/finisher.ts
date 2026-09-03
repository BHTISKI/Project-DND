import type { Card } from '../types/game';

export function cardCategory(card: Card): string {
  return card.tags?.[0] ?? ({ saldırı: 'attack', savunma: 'defend', yetenek: 'skill' } as const)[card.tip];
}
export function advanceCombo(count: number, previous: string | undefined, next: string): number {
  return previous && previous !== next ? count + 1 : count;
}
export function finisherBonus(card: Card, comboCount: number): number {
  return card.finisher && comboCount >= card.finisher.threshold ? card.finisher.damage : 0;
}
