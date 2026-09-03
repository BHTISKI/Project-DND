import { describe, expect, it } from 'vitest';
import { makeCard } from '../testUtils/gameState';
import { retainHand } from './retain';
import { routePlayedCard, restoreExhausted } from './exhaust';
import { advanceCombo, finisherBonus } from './finisher';

describe('retention prototype', () => {
  it('keeps only retain cards and always discards curse penalties', () => {
    const held = { ...makeCard('held'), retain: true };
    const curse = { ...held, id: 'curse', onDiscardPenalty: { kind: 'pureDamage' as const, amount: 5 } };
    const plain = makeCard('plain');
    const hand = [held, plain, curse];
    expect(retainHand(hand)).toEqual({ retained: [held], discarded: [plain, curse] });
    expect(hand).toHaveLength(3);
    expect(retainHand([])).toEqual({ retained: [], discarded: [] });
  });
});
describe('exhaust prototype', () => {
  it('separates played one-use cards without deleting them', () => {
    const card = { ...makeCard('spark'), exhaust: true };
    const piles = { discardPile: [makeCard('old')], exhaustedPile: [] };
    expect(routePlayedCard(piles, card)).toEqual({ discardPile: piles.discardPile, exhaustedPile: [card] });
    expect(piles.exhaustedPile).toEqual([]);
    expect(routePlayedCard(piles, makeCard('normal')).discardPile).toHaveLength(2);
  });
  it('restores exhausted cards exactly once', () => {
    const piles = { discardPile: [], exhaustedPile: [makeCard('spark')] };
    const restored = restoreExhausted(piles);
    expect(restored).toEqual({ discardPile: piles.exhaustedPile, exhaustedPile: [] });
    expect(restoreExhausted(restored)).toEqual(restored);
  });
});
describe('finisher prototype', () => {
  it('counts category transitions; identical categories do not build combo', () => {
    expect(advanceCombo(0, undefined, 'skill')).toBe(0);
    expect(advanceCombo(0, 'skill', 'attack')).toBe(1);
    expect(advanceCombo(1, 'attack', 'attack')).toBe(1);
    expect(advanceCombo(1, 'defend', 'attack')).toBe(2);
  });
  it('grants the printed bonus only when the threshold is reached', () => {
    const card = { ...makeCard('finish'), finisher: { threshold: 2, damage: 3 } };
    expect(finisherBonus(card, 1)).toBe(0);
    expect(finisherBonus(card, 2)).toBe(3);
    expect(finisherBonus(card, 8)).toBe(3);
    expect(finisherBonus(makeCard('plain'), 8)).toBe(0);
  });
});
