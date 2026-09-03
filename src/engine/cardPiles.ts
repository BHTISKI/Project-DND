import type { Card } from '../types/game';
import { shuffle } from '../utils/game';

export interface CardPiles { deck: Card[]; hand: Card[]; discardPile: Card[]; exhaustedPile?: Card[] }

export function allCards(piles: CardPiles): Card[] {
  return [...piles.deck, ...piles.hand, ...piles.discardPile, ...(piles.exhaustedPile ?? [])];
}

export function removeOwnedCard(piles: CardPiles, id: string): CardPiles {
  return {
    deck: piles.deck.filter(c => c.id !== id),
    hand: piles.hand.filter(c => c.id !== id),
    discardPile: piles.discardPile.filter(c => c.id !== id),
    exhaustedPile: (piles.exhaustedPile ?? []).filter(c => c.id !== id),
  };
}

export function updateOwnedCard(piles: CardPiles, card: Card): CardPiles {
  const replace = (cards: Card[]) => cards.map(c => c.id === card.id ? card : c);
  return { deck: replace(piles.deck), hand: replace(piles.hand), discardPile: replace(piles.discardPile), exhaustedPile: replace(piles.exhaustedPile ?? []) };
}

export function drawFromPiles(piles: CardPiles, count: number, random: () => number = Math.random) {
  let deck = [...piles.deck];
  let discardPile = [...piles.discardPile];
  const drawn: Card[] = [];
  for (let i = 0; i < Math.max(0, Math.floor(count)); i++) {
    if (!deck.length) {
      deck = shuffle(discardPile, { random });
      discardPile = [];
    }
    const card = deck.shift();
    if (!card) break;
    drawn.push(card);
  }
  return { deck, hand: [...piles.hand, ...drawn], discardPile, drawn };
}
