import type { Card } from '../types/game';

interface PlayedPiles { discardPile: Card[]; exhaustedPile: Card[] }
export function routePlayedCard(piles: PlayedPiles, card: Card): PlayedPiles {
  return card.exhaust
    ? { discardPile: piles.discardPile, exhaustedPile: [...piles.exhaustedPile, card] }
    : { discardPile: [...piles.discardPile, card], exhaustedPile: piles.exhaustedPile };
}
export function restoreExhausted(piles: PlayedPiles): PlayedPiles {
  return { discardPile: [...piles.discardPile, ...piles.exhaustedPile], exhaustedPile: [] };
}
