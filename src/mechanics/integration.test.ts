import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleCardDefs } from '../types/game';
import type { Card } from '../types/game';
import { makeCard, makeGameState, makePlayer } from '../testUtils/gameState';
import { drawCardsState, resolveCard, resolveTurn } from '../engine/combatResolver';
import { finishEncounter, useGameStore } from '../state/store';
import { allCards, removeOwnedCard, updateOwnedCard } from '../engine/cardPiles';
import { describeCard } from '../utils/cardText';
import { upgradedCard } from '../utils/game';
import { cardCategory } from './finisher';

const card = (name: string): Card => {
  const definition = sampleCardDefs.find(c => c.isim === name);
  if (!definition) throw new Error(`Missing catalog card: ${name}`);
  return { ...definition, id: name };
};
const combat = () => makeGameState({ gamePhase: 'combat', initialized: true,
  player: makePlayer({ mevcutCan: 30, maksimumCan: 30 }),
  enemy: makePlayer({ id: 'enemy', mevcutCan: 100, maksimumCan: 100, zirhSinifi: 1, maksimumDenge: 200 }),
  enemyIntent: { type: 'defend', action: { kind: 'pass' } },
});
beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });
afterEach(() => { vi.restoreAllMocks(); });

describe('new mechanics through the real combat resolver', () => {
  it('retains the same card and fills only vacant hand slots', () => {
    const held = card('Sabırlı Muhafız');
    const state = { ...combat(), hand: [held, makeCard('ordinary')],
      deck: Array.from({ length: 8 }, (_, i) => makeCard(`draw-${i}`)) };
    const next = resolveTurn(state, finishEncounter);
    expect(next.hand).toHaveLength(5);
    expect(next.hand[0]).toBe(held);
    expect(next.deck).toHaveLength(4);
    expect(next.discardPile.map(c => c.id)).toContain('ordinary');
    expect(state.hand).toHaveLength(2);
  });
  it('does not redraw retained cards or grow the hand on repeated turns', () => {
    const held = card('Sabırlı Muhafız');
    const initial = { ...combat(), hand: [held], deck: [], discardPile: [] };
    const next = resolveTurn(resolveTurn(initial, finishEncounter), finishEncounter);
    expect(next.hand).toEqual([held]);
    expect(allCards(next)).toEqual([held]);
  });
  it('still charges a curse marked retain; ending the turn can kill the player', () => {
    const curse = { ...makeCard('curse'), retain: true, onDiscardPenalty: { kind: 'pureDamage' as const, amount: 5, returnToDeck: true } };
    const next = resolveTurn({ ...combat(), player: makePlayer({ mevcutCan: 5 }), hand: [curse] }, finishEncounter);
    expect(next.gamePhase).toBe('gameOver');
    expect(next.hand).toEqual([]);
    expect(next.deck).toContain(curse);
  });
  it('exhausts an energy card until combat ends, without redrawing it', () => {
    const spark = card('Son Kıvılcım');
    const state = { ...combat(), hand: [spark], deck: [], discardPile: [] };
    const next = resolveCard(state, spark.id);
    expect(next.currentEnergy).toBe(4);
    expect(next.exhaustedPile).toEqual([spark]);
    expect(drawCardsState(next, 20).hand).toEqual([]);
    expect(allCards(next)).toEqual([spark]);
    expect(resolveCard(next, spark.id)).toBe(next);
    expect(state.exhaustedPile).toEqual([]);
  });
  it('restores exhausted cards on victory, once, including a lethal exhaust card', () => {
    const burst = { ...card('Zincir Darbesi'), exhaust: true, effects: [{ kind: 'damage' as const, die: 'sabit', damageBonus: 200 }] };
    const next = finishEncounter(resolveCard({ ...combat(), hand: [burst] }, burst.id));
    expect(next.gamePhase).toBe('mapSelection');
    expect(next.exhaustedPile).toEqual([]);
    expect(allCards(finishEncounter(next)).map(c => c.id)).toEqual([burst.id]);
  });
  it('restores exhausted cards on a new encounter and clears them on restart', () => {
    useGameStore.setState({ ...combat(), gamePhase: 'mapSelection', starterDraftComplete: true,
      selectNode: useGameStore.getInitialState().selectNode, restartGame: useGameStore.getInitialState().restartGame,
      hand: [], deck: [], discardPile: [], exhaustedPile: [card('Son Kıvılcım')],
      availableNodes: [{ id: 'next', type: 'combat' }] });
    useGameStore.getState().selectNode('next');
    expect(useGameStore.getState().hand.map(c => c.isim)).toEqual(['Son Kıvılcım']);
    expect(useGameStore.getState().exhaustedPile).toEqual([]);
    useGameStore.setState({ gamePhase: 'gameOver', exhaustedPile: [card('Son Kıvılcım')] });
    useGameStore.getState().restartGame();
    expect(useGameStore.getState().exhaustedPile).toEqual([]);
  });
  it('handles removal and upgrades in the exhausted pile too', () => {
    const spark = card('Son Kıvılcım');
    const state = { ...combat(), exhaustedPile: [spark] };
    const upgraded = upgradedCard(spark)!;
    expect(updateOwnedCard(state, upgraded).exhaustedPile).toEqual([upgraded]);
    expect(removeOwnedCard(state, spark.id).exhaustedPile).toEqual([]);
    expect(upgraded.exhaust).toBe(true);
  });
  it('activates a finisher on the second category transition, including its own play', () => {
    const finish = card('Zincir Darbesi');
    const setup = { ...makeCard('setup'), tags: ['skill'] };
    const block = { ...makeCard('block'), tags: ['defend'] };
    let state = { ...combat(), hand: [setup, block, finish] };
    state = resolveCard(resolveCard(state, setup.id), block.id);
    const next = resolveCard(state, finish.id);
    // d4=3 + strength=2 + existing defend->attack=1 + finisher=3.
    expect(next.enemy.mevcutCan).toBe(91);
    expect(next.comboCount).toBe(2);
    expect(next.battleLogs.join(' ')).toContain('Bitirici: +3');
    expect(resolveTurn(next, finishEncounter).comboCount).toBe(0);
  });
  it('does not grant a finisher early or leak it into the next card', () => {
    const finish = card('Zincir Darbesi');
    const plain = { ...card('Hızlı Saldırı'), id: 'plain' };
    const next = resolveCard({ ...combat(), hand: [finish, plain] }, finish.id);
    expect(next.enemy.mevcutCan).toBe(95);
    expect(resolveCard(next, plain.id).enemy.mevcutCan).toBe(90);
  });
  it('consumes a missed finisher bonus and still exhausts missed one-use attacks', () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const finish = { ...card('Zincir Darbesi'), exhaust: true };
    const next = resolveCard({ ...combat(), hand: [finish], comboCount: 2 }, finish.id);
    expect(next.enemy.mevcutCan).toBe(100);
    expect(next.nextDamageBonus).toBe(0);
    expect(next.exhaustedPile).toEqual([finish]);
  });
  it('applies the finisher only to the first attack of a multi-hit card', () => {
    const finish = { ...card('Zincir Darbesi'), effects: [{ kind: 'damage' as const, die: 'sabit' }, { kind: 'damage' as const, die: 'sabit' }] };
    const next = resolveCard({ ...combat(), hand: [finish], comboCount: 2 }, finish.id);
    expect(next.enemy.mevcutCan).toBe(93); // (2+3) + 2
  });
  it('does not route or increment anything when the card is unaffordable', () => {
    const finish = card('Zincir Darbesi');
    const next = resolveCard({ ...combat(), hand: [finish], currentEnergy: 0 }, finish.id);
    expect(next.hand).toEqual([finish]); expect(next.comboCount).toBe(0); expect(next.exhaustedPile).toEqual([]);
  });
  it('documents all new mechanics and upgrades their actual effects', () => {
    expect(describeCard(card('Sabırlı Muhafız'))).toContain('Elde tut');
    expect(describeCard(card('Son Kıvılcım'))).toContain('Tükenir');
    expect(describeCard(card('Zincir Darbesi'))).toContain('Bitirici 2');
    expect(upgradedCard(card('Sabırlı Muhafız'))?.retain).toBe(true);
    expect(upgradedCard(card('Zincir Darbesi'))?.finisher).toEqual({ threshold: 2, damage: 3 });
    expect(cardCategory({ ...makeCard('fallback'), tip: 'savunma' })).toBe('defend');
  });
});
