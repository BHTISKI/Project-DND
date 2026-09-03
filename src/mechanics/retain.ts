import type { Card } from '../types/game';

export function retainHand(hand: Card[]): { retained: Card[]; discarded: Card[] } {
  const retained: Card[] = [];
  const discarded: Card[] = [];
  for (const card of hand) (card.retain && !card.onDiscardPenalty ? retained : discarded).push(card);
  return { retained, discarded };
}
