import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useGameStore, finishEncounter } from './store';
import type { GameState } from './store';
import type { Card, CardEffect, NodeType } from '../types/game';
import { sampleCardDefs } from '../types/game';
import { makeCard, makePlayer } from '../testUtils/gameState';
import { allCards, drawFromPiles } from '../engine/cardPiles';
import { canChooseDraftCard } from '../engine/draft';
import { refreshEnemyIntent, hitCharacter } from '../engine/combatResolver';
import { EventResolver, eventChoices } from '../engine/eventResolver';
import { upgradedCard } from '../utils/game';
import { describeCard } from '../utils/cardText';
import { SeededRNG } from '../utils/rng';

function card(id: string, effects: CardEffect[], cost = 0): Card {
  return { ...makeCard(id), zarTuru: 'sabit', manaBedeli: cost, effects };
}
function catalog(name: string): Card {
  return { ...sampleCardDefs.find(c => c.isim === name)!, id: name };
}
function state(partial: Partial<GameState> = {}) {
  useGameStore.setState({ ...useGameStore.getInitialState(), initialized: true, gamePhase: 'combat',
    playerName: 'Ero', player: makePlayer({ mevcutCan: 100, maksimumCan: 100 }),
    enemy: { ...makePlayer({ mevcutCan: 100, maksimumCan: 100, zirhSinifi: 10 }), id: 'enemy', isim: 'Düşman' },
    enemyBehavior: 'standard', enemyIntent: { type: 'defend', action: { kind: 'pass' } },
    baseEnemyIntent: { type: 'attack', estimatedDamage: 4 }, ...partial }, true);
  return useGameStore.getState();
}
beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); vi.spyOn(Math, 'random').mockReturnValue(0.5); state(); });
afterEach(() => vi.restoreAllMocks());

describe('reported combat regressions', () => {
  it.each(sampleCardDefs.map(def => [def.isim, def] as const))('resolves catalog card %s without invalid state or duplicated cards', (name, def) => {
    const s = state({ currentEnergy: 20, deck: [card('draw-a', []), card('draw-b', [])],
      hand: [{ ...def, id: name }], enemy: makePlayer({ mevcutCan: 100, maksimumCan: 100, zirhSinifi: 0 }) });
    expect(() => s.playCard(name)).not.toThrow();
    const next = useGameStore.getState();
    expect(Number.isFinite(next.player.mevcutCan)).toBe(true);
    expect(Number.isFinite(next.enemy.mevcutCan)).toBe(true);
    expect(next.currentEnergy).toBeGreaterThanOrEqual(0);
    const ids = allCards(next).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(next.hand.some(c => c.id === name)).toBe(!!def.onDiscardPenalty);
  });
  it('prevents a legendary + uncommon draft dead end', () => {
    const cards = [card('legend', []), card('uncommon', []), card('a', []), card('b', []), card('c', [])];
    cards[0].rarity = 'legendary'; cards[1].rarity = 'uncommon';
    expect(canChooseDraftCard(cards, 'legend', 0, 6)).toBe(true);
    const remaining = cards.slice(1);
    expect(canChooseDraftCard(remaining, 'uncommon', 1, 2)).toBe(false);
    expect(canChooseDraftCard(remaining, 'a', 1, 2)).toBe(true);
    state({ gamePhase: 'deckBuild', draftOptions: remaining, draftPicks: 1, draftBudget: 2 });
    useGameStore.getState().chooseDraftCard('uncommon');
    expect(useGameStore.getState().draftPicks).toBe(1);
    useGameStore.getState().chooseDraftCard('a'); useGameStore.getState().chooseDraftCard('b');
    expect(useGameStore.getState().gamePhase).toBe('combat');
  });
  it.each(['poison', 'curse', 'apocalypse', 'attack'] as const)('terminates on player death from %s', route => {
    const s = state({ player: makePlayer({ mevcutCan: 1 }), drawCount: 0 });
    if (route === 'poison') useGameStore.setState({ playerStatuses: [{ id: 'poisoned', duration: 2, stacks: 1 }] });
    if (route === 'curse') useGameStore.setState({ hand: [catalog('Körlük Mührü')] });
    if (route === 'apocalypse') useGameStore.setState({ apocalypseTurns: 1, apocalypseHpPercent: 50 });
    if (route === 'attack') useGameStore.setState({ enemyIntent: { type: 'attack', action: { kind: 'attack', damage: 5 } } });
    s.endTurn();
    expect(useGameStore.getState().gamePhase).toBe('gameOver');
    expect(useGameStore.getState().player.mevcutCan).toBe(0);
    expect(useGameStore.getState().gold).toBe(s.gold);
  });
  it.each(['combat', 'elite', 'boss'] as NodeType[])('rewards %s poison and direct kills equally, once', nodeType => {
    const base = state({ nodeType, victoryCount: 2, enemy: makePlayer({ mevcutCan: 1 }), enemyStatuses: [{ id: 'poisoned', duration: 2, stacks: 1 }] });
    base.endTurn();
    const poison = useGameStore.getState();
    const direct = finishEncounter({ ...base, enemy: { ...base.enemy, mevcutCan: 0 } });
    expect(poison.gold).toBe(direct.gold);
    expect(poison.rewardOptions).toHaveLength(nodeType === 'boss' ? 4 : 3);
    expect(poison.metaVictories).toBe(1);
    poison.endTurn(); poison.applyDamage('enemy', 10);
    expect(useGameStore.getState().gold).toBe(poison.gold);
    expect(useGameStore.getState().runFloor).toBe(1);
  });
  it('uses the displayed opportunist action and updates it after gaining block', () => {
    const block = card('shield', [{ kind: 'block', amount: 3 }]);
    useGameStore.setState(refreshEnemyIntent(state({ enemyBehavior: 'opportunist', hand: [block] })));
    expect(useGameStore.getState().enemyIntent?.estimatedDamage).toBe(6);
    useGameStore.getState().playCard('shield');
    const before = useGameStore.getState();
    expect(before.enemyIntent?.estimatedDamage).toBe(4);
    expect(before.enemyIntent?.criticalDamage).toBe(8);
    before.endTurn();
    expect(useGameStore.getState().player.mevcutCan).toBe(99);
  });
  it('does not re-decide a published paranoid pass at turn end', () => {
    const s = state({ enemyBehavior: 'paranoid', enemyCanLie: true, lastPlayerSignal: 'parry', enemyBehaviorRoll: 0.9 });
    useGameStore.setState(refreshEnemyIntent(s));
    expect(useGameStore.getState().enemyIntent?.action?.kind).toBe('pass');
    vi.mocked(Math.random).mockReturnValue(0);
    useGameStore.getState().endTurn();
    expect(useGameStore.getState().playerStatuses).toEqual([]);
    expect(useGameStore.getState().player.mevcutCan).toBe(100);
  });
  it('caps healing previews at missing HP and includes fortified defense', () => {
    const heal = refreshEnemyIntent(state({ baseEnemyIntent: { type: 'special', estimatedHeal: 4, effectKey: 'heal' } }));
    expect(heal.enemyIntent?.estimatedHeal).toBe(0);
    const defend = refreshEnemyIntent(state({ baseEnemyIntent: { type: 'defend', estimatedBlock: 4 },
      enemyStatuses: [{ id: 'fortified', duration: 2, stacks: 2, value: 1 }] }));
    expect(defend.enemyIntent?.estimatedBlock).toBe(6);
  });
  it('applies AC misses and consumes one advantage charge', () => {
    const s = state({ hand: [card('hit', [{ kind: 'attack', damageBonus: 4 }])],
      player: makePlayer({ advantageCounter: 1 }), enemy: makePlayer({ zirhSinifi: 30 }) });
    vi.mocked(Math.random).mockReturnValueOnce(0.1).mockReturnValueOnce(0.8);
    s.playCard('hit');
    expect(useGameStore.getState().enemy.mevcutCan).toBe(10);
    expect(useGameStore.getState().player.advantageCounter).toBe(0);
  });
  it('natural 20 bypasses high AC and doubles damage', () => {
    const s = state({ hand: [card('hit', [{ kind: 'attack', damageBonus: 4 }])], enemy: makePlayer({ mevcutCan: 100, maksimumCan: 100, zirhSinifi: 100 }) });
    vi.mocked(Math.random).mockReturnValue(0.99);
    s.playCard('hit');
    expect(useGameStore.getState().enemy.mevcutCan).toBe(88);
  });
  it('consumes enemy disadvantage and uses the lower D20', () => {
    const s = state({ enemy: makePlayer({ disadvantageCounter: 1 }), enemyIntent: { type: 'attack', action: { kind: 'attack', damage: 4 } } });
    vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValueOnce(0);
    s.endTurn();
    expect(useGameStore.getState().player.mevcutCan).toBe(100);
    expect(useGameStore.getState().enemy.disadvantageCounter).toBe(0);
  });
  it('applies player weakened to damage and fortified to incoming block', () => {
    const s = state({ hand: [card('magic', [{ kind: 'damage', die: 'sabit', damageBonus: 4 }])],
      playerStatuses: [{ id: 'weakened', duration: 2, stacks: 1, value: 2 }, { id: 'fortified', duration: 2, stacks: 1, value: 3 }],
      enemyIntent: { type: 'attack', action: { kind: 'attack', damage: 4 } } });
    s.playCard('magic');
    expect(useGameStore.getState().enemy.mevcutCan).toBe(96);
    useGameStore.getState().endTurn();
    expect(useGameStore.getState().player.mevcutCan).toBe(99);
  });
  it('adds consecutive blocks and preserves unused enemy block', () => {
    const s = state({ hand: [card('one', [{ kind: 'block', amount: 4 }]), card('two', [{ kind: 'block', amount: 3 }]), card('hit', [{ kind: 'damage', die: 'sabit' }])], enemyBlock: 10 });
    s.playCard('one'); useGameStore.getState().playCard('two');
    expect(useGameStore.getState().playerBlock).toBe(7);
    useGameStore.getState().playCard('hit');
    expect(useGameStore.getState().enemyBlock).toBe(8);
    expect(useGameStore.getState().enemy.mevcutCan).toBe(100);
  });
  it('clears stagger posture after the bonus hit or skipped turn', () => {
    const hit = hitCharacter(makePlayer({ denge: 10, staggered: true }), 0, 2);
    expect(hit.damage).toBe(4); expect(hit.character.denge).toBe(0); expect(hit.character.staggered).toBe(false);
    const s = state({ player: makePlayer({ denge: 10, staggered: true }), enemy: makePlayer({ denge: 10, staggered: true }) });
    s.endTurn();
    expect(useGameStore.getState().player.denge).toBe(0);
    expect(useGameStore.getState().enemy.denge).toBe(0);
  });
  it('allows gained energy over the refill so 4-energy cards can be played', () => {
    const s = state({ hand: [card('charge', [{ kind: 'energy', amount: 3 }], 1), catalog('Yıldırımın Çarpması')] });
    s.playCard('charge');
    expect(useGameStore.getState().currentEnergy).toBe(5);
    useGameStore.getState().playCard('Yıldırımın Çarpması');
    expect(useGameStore.getState().currentEnergy).toBe(1);
    expect(useGameStore.getState().hand).toHaveLength(0);
  });
  it('reshuffles discards when draw effects exhaust the draw pile without drawing the played card', () => {
    const s = state({ deck: [card('a', [])], discardPile: [card('b', []), card('c', [])], hand: [card('draw', [{ kind: 'draw', amount: 5 }])] });
    s.playCard('draw');
    expect(useGameStore.getState().hand.map(c => c.id).sort()).toEqual(['a','b','c']);
    expect(useGameStore.getState().discardPile.map(c => c.id)).toEqual(['draw']);
  });
  it('preserves card identities and order before reshuffling is needed', () => {
    const result = drawFromPiles({ deck: [card('a', []), card('b', [])], hand: [], discardPile: [card('c', [])] }, 1);
    expect(result.hand[0].id).toBe('a'); expect(result.deck[0].id).toBe('b'); expect(result.discardPile[0].id).toBe('c');
  });
});

describe('reported map, shop and restart regressions', () => {
  it.each(['deck', 'hand', 'discardPile'] as const)('upgrades and removes cards in %s', pile => {
    const target = card('target', [{ kind: 'block', amount: 3 }], 1);
    const s = state({ gamePhase: 'shop', gold: 300, deck: [card('keep', [])], [pile]: [target, card('keep', [])] });
    s.upgradeCard('target');
    expect(allCards(useGameStore.getState()).find(c => c.id === 'target')?.isUpgraded).toBe(true);
    useGameStore.getState().removeCardFromDeck('target');
    expect(allCards(useGameStore.getState()).some(c => c.id === 'target')).toBe(false);
    expect(useGameStore.getState().gold).toBe(210);
  });
  it('does not charge for healing at full HP or a no-op upgrade', () => {
    const s = state({ gamePhase: 'shop', gold: 100, deck: [card('empty', [])] });
    s.healPlayer(); useGameStore.getState().upgradeCard('empty');
    expect(useGameStore.getState().gold).toBe(100);
    expect(upgradedCard(catalog('Büyüleyici Çukur'))?.manaBedeli).toBe(2);
  });
  it('purifies all piles and preserves non-cursed cards', () => {
    const s = state({ gamePhase: 'shop', gold: 200, deck: [card('safe', [])], hand: [catalog('Körlük Mührü')], discardPile: [catalog('Kırık Ruh')] });
    s.purifyDeck();
    expect(allCards(useGameStore.getState()).map(c => c.id)).toEqual(['safe']);
    expect(useGameStore.getState().gold).toBe(80);
  });
  it('rejects purchases outside displayed offers', () => {
    const s = state({ gamePhase: 'shop', gold: 300 });
    s.buyCard('shop-0'); s.buyCard('shop-30');
    expect(useGameStore.getState().gold).toBe(300); expect(allCards(useGameStore.getState())).toHaveLength(0);
  });
  it('keeps event price text and charged gold identical', () => {
    const s = state({ gamePhase: 'event', gold: 250, player: makePlayer({ mevcutCan: 5 }) });
    expect(eventChoices(s)[0].detail).toContain('25 altın');
    expect(EventResolver.resolveEvent(s, 0).gold).toBe(225);
  });
  it('permanently removes the event card rather than discarding it', () => {
    const s = state({ gamePhase: 'event', deck: [card('a', [])], hand: [card('b', [])] });
    const next = EventResolver.resolveEvent(s, 1);
    expect(allCards(next)).toHaveLength(1); expect(next.discardPile).toHaveLength(0);
  });
  it('applies drawn curse penalties in events while preserving the last card', () => {
    const s = state({ gamePhase: 'event', deck: [catalog('Kırık Ruh')] });
    const next = EventResolver.resolveEvent(s, 1);
    expect(next.maxEnergy).toBe(1);
    expect(next.player.maksimumCan).toBe(98);
    expect(allCards(next)).toHaveLength(1);
  });
  it('does not sell upgrades for an unplayable curse', () => {
    const s = state({ gamePhase: 'shop', hand: [catalog('Körlük Mührü')], gold: 200 });
    s.upgradeCard('Körlük Mührü');
    expect(useGameStore.getState().gold).toBe(200);
    expect(useGameStore.getState().hand[0].isUpgraded).not.toBe(true);
  });
  it('carries prophecy to next combat and pays the first-turn cost', () => {
    const s = state({ gamePhase: 'event', starterDraftComplete: true });
    s.resolveEvent(2);
    const map = useGameStore.getState();
    expect(map.pendingPlayerSkip).toBe(true);
    map.selectNode(map.availableNodes.find(n => n.type === 'combat')!.id);
    const fight = useGameStore.getState();
    expect(fight.round).toBe(2); expect(fight.pendingPlayerSkip).toBe(false);
    expect(fight.enemyStatuses.find(s => s.id === 'weakened')?.duration).toBe(1);
    expect(fight.pendingEnemyStatuses).toEqual([]);
  });
  it('can leave a rest stop when no paid or removal action is possible', () => {
    const s = state({ gamePhase: 'rest', gold: 0, deck: [card('last', [])] });
    s.resolveRest(0); expect(useGameStore.getState().gamePhase).toBe('rest');
    useGameStore.getState().resolveRest(2); expect(useGameStore.getState().gamePhase).toBe('mapSelection');
  });
  it('advances once for a map shop and never twice for a reward shop', () => {
    state({ gamePhase: 'shop', currentNode: 'shop', runFloor: 2 }).startNextCombat();
    expect(useGameStore.getState().runFloor).toBe(3);
    state({ gamePhase: 'shop', currentNode: null, runFloor: 2 }).startNextCombat();
    expect(useGameStore.getState().runFloor).toBe(2);
  });
  it('restarts with full base energy, health and no stale dialogs or statuses', () => {
    const s = state({ gamePhase: 'gameOver', playerName: 'Deneme', maxEnergy: 1, currentEnergy: 0,
      player: makePlayer({ mevcutCan: 0, maksimumCan: 2, staggered: true }), pendingPlayerSkip: true,
      playerDialog: [{ text: 'old', timestamp: Date.now() }], enemyStatuses: [{ id: 'poisoned', stacks: 3, duration: 3 }] });
    s.restartGame();
    const next = useGameStore.getState();
    expect(next.playerName).toBe('Deneme'); expect(next.player.maksimumCan).toBe(10);
    expect(next.maxEnergy).toBe(3); expect(next.currentEnergy).toBe(3);
    expect(next.playerDialog).toEqual([]); expect(next.enemyStatuses).toEqual([]); expect(next.pendingPlayerSkip).toBe(false);
  });
  it('describes actual dice, rarity effects and delayed costs', () => {
    expect(describeCard(catalog('Buhar Nefesi'))).toContain('d8 (1–8)');
    expect(describeCard(catalog('Patlamaya Hazır Mühür'))).toContain('%50');
    expect(describeCard(catalog('Alev Fısıltısı'))).toContain('avantaj');
  });
  it('seeded RNG covers both halves of [0,1) and zero seeds do not get stuck', () => {
    const rng = new SeededRNG(0); const values = Array.from({ length: 100 }, () => rng.random());
    expect(Math.max(...values)).toBeGreaterThan(0.5); expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1); expect(new Set(values).size).toBe(100);
  });
});
