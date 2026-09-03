import type { Card } from '../types/game';
import { getCardWeight } from '../utils/game';

export function canChooseDraftCard(cards: Card[], id: string, picks: number, budget: number): boolean {
  const card = cards.find(c => c.id === id);
  if (!card || picks >= 3) return false;
  const remainingPicks = 3 - picks - 1;
  const remaining = cards.filter(c => c.id !== id).map(getCardWeight).sort((a, b) => a - b);
  return remaining.length >= remainingPicks
    && getCardWeight(card) + remaining.slice(0, remainingPicks).reduce((sum, value) => sum + value, 0) <= budget;
}
