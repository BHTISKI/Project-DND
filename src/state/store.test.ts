// Bu dosya src/state/store.test.ts için ilgili kodları içerir.
// Zustand store birimi testleri: azioni ve selektorlerin doğruluğu
// Zustand store birimi testleri: azioni ve selektorlerin doğruluğu
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Card, EnemyIntent } from '../types/game';
import { useGameStore } from './store';
import { setupMockRandom, resetMockRandom } from '../testUtils';
import { cleanup } from '@testing-library/react';

const player = { id: 'player', isim: 'Ero', mevcutCan: 10, maksimumCan: 10, zirhSinifi: 12, gucCarpani: 2, advantageCounter: 0, disadvantageCounter: 0 };
const enemy = { id: 'enemy', isim: 'Goblin', mevcutCan: 10, maksimumCan: 10, zirhSinifi: 11, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 };

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1', isim: 'Test Kartı', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4',
    effects: [{ kind: 'attack', die: 'd4' }], ...overrides,
  };
}

function setCombat(overrides: Partial<ReturnType<typeof useGameStore.getState>> = {}) {
  useGameStore.setState({
    initialized: true, gamePhase: 'combat', isPlayerTurn: true, player: { ...player }, enemy: { ...enemy },
    hand: [card()], deck: Array.from({ length: 5 }, (_, index) => card({ id: `deck-${index}` })), discardPile: [],
    enemyIntent: { type: 'attack', estimatedDamage: 4 }, enemyIntentValue: 4, ...overrides,
  });
}

describe('game engine store', () => {
  beforeEach(() => {
    useGameStore.setState({
      player: { ...player }, enemy: { ...enemy }, isPlayerTurn: true, maxEnergy: 3, currentEnergy: 3,
      deck: [], hand: [], discardPile: [], drawCount: 5, gold: 50, battleLogs: [], initialized: false,
      gamePhase: 'combat', rewardOptions: [], playerBlock: 0, enemyBlock: 0, enemySkipNextTurn: false,
      victoryCount: 0, enemyIntent: null, enemyIntentValue: 0, enemyArchetype: 'goblin', playerStatuses: [],
      enemyStatuses: [], comboChain: [], comboCount: 0, nextDamageBonus: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    resetMockRandom();
  });

  it('creates the expected opening deck, hand and energy', () => {
    setupMockRandom([0]);
    useGameStore.getState().initializeGame();
    const state = useGameStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.hand).toHaveLength(state.drawCount);
    expect(state.deck).toHaveLength(2);
    expect(state.discardPile).toHaveLength(0);
    expect(state.currentEnergy).toBe(3);
    expect(state.maxEnergy).toBe(3);
  });

  it('spends energy and moves a played card to discard', () => {
    setCombat({ hand: [card({ manaBedeli: 2 })] });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    useGameStore.getState().playCard('card-1');
    const state = useGameStore.getState();
    expect(state.currentEnergy).toBe(1);
    expect(state.hand).toHaveLength(0);
    expect(state.discardPile[0].id).toBe('card-1');
  });

  it('does not play a card when energy is insufficient', () => {
    setCombat({ currentEnergy: 0, hand: [card({ manaBedeli: 1 })] });
    useGameStore.getState().playCard('card-1');
    const state = useGameStore.getState();
    expect(state.hand).toHaveLength(1);
    expect(state.discardPile).toHaveLength(0);
    expect(state.currentEnergy).toBe(0);
    expect(state.battleLogs.at(-1)).toMatch(/Yetersiz enerji/);
  });

  it('resolves attack hit, miss, natural 20 and natural 1', () => {
    setCombat({ enemy: { ...enemy, mevcutCan: 10 } });
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    useGameStore.getState().playCard('card-1');
    expect(useGameStore.getState().enemy.mevcutCan).toBe(10);

    vi.restoreAllMocks();
    setCombat({ enemy: { ...enemy, mevcutCan: 10 } });
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.999).mockReturnValueOnce(0);
    useGameStore.getState().playCard('card-1');
    expect(useGameStore.getState().enemy.mevcutCan).toBe(7);

    setCombat({ enemy: { ...enemy, mevcutCan: 10 } });
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    useGameStore.getState().playCard('card-1');
    expect(useGameStore.getState().battleLogs.at(-1)).toMatch(/başarısız|aşılamadı/i);
  });

  it('creates block and block absorbs enemy damage during the next turn', () => {
    const defense = card({ tip: 'savunma', manaBedeli: 1, effects: [{ kind: 'block', amount: 4 }] });
    setCombat({ hand: [defense], enemy: { ...enemy, mevcutCan: 10 }, player: { ...player, mevcutCan: 10 } });
    useGameStore.getState().playCard('card-1');
    expect(useGameStore.getState().playerBlock).toBe(4);

    vi.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0.999).mockReturnValue(0);
    useGameStore.getState().endTurn();
    expect(useGameStore.getState().player.mevcutCan).toBe(7);
    expect(useGameStore.getState().playerBlock).toBe(0);
  });

  it('applies effect-based heal, status, draw, energy and skip', () => {
    const effectsCard = card({ manaBedeli: 1, effects: [
      { kind: 'heal', amount: 3 }, { kind: 'status', status: 'vulnerable', duration: 2, target: 'enemy' },
      { kind: 'draw', amount: 1 }, { kind: 'energy', amount: 2 }, { kind: 'skip', target: 'enemy' },
    ] });
    setCombat({ player: { ...player, mevcutCan: 5 }, hand: [effectsCard], deck: [card({ id: 'drawn' })] });
    useGameStore.getState().playCard('card-1');
    const state = useGameStore.getState();
    expect(state.player.mevcutCan).toBe(8);
    expect(state.enemyStatuses[0].id).toBe('vulnerable');
    expect(state.hand.some((item) => item.id === 'drawn')).toBe(true);
    expect(state.currentEnergy).toBe(3);
    expect(state.enemySkipNextTurn).toBe(true);
  });

  it('builds combo bonuses and resets the chain at the next turn', () => {
    const skill = card({ id: 'skill', tip: 'yetenek', tags: ['skill'], effects: [{ kind: 'energy', amount: 0 }] });
    const attack = card({ id: 'attack', tags: ['attack'] });
    setCombat({ hand: [skill, attack] });
    useGameStore.getState().playCard('skill');
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.999).mockReturnValueOnce(0);
    useGameStore.getState().playCard('attack');
    expect(useGameStore.getState().comboCount).toBe(1);
    expect(useGameStore.getState().battleLogs.at(-1)).toMatch(/Kombo/);

    vi.spyOn(Math, 'random').mockReturnValue(0);
    useGameStore.getState().endTurn();
    expect(useGameStore.getState().comboChain).toEqual([]);
  });

  it('handles enemy archetype specials and status ticks', () => {
    setCombat({ enemyArchetype: 'goblin', enemyIntent: { type: 'special' }, enemyStatuses: [{ id: 'poisoned', duration: 2, stacks: 1, value: 2 }] });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useGameStore.getState().endTurn();
    expect(useGameStore.getState().enemy.mevcutCan).toBe(8);
    expect(useGameStore.getState().playerStatuses[0].id).toBe('weakened');

    setCombat({ enemyArchetype: 'mage', enemyIntent: { type: 'special' }, enemy: { ...enemy, gucCarpani: 2, mevcutCan: 10 }, player: { ...player, mevcutCan: 10 } });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useGameStore.getState().endTurn();
    expect(useGameStore.getState().player.mevcutCan).toBe(7);
  });

  it('transitions to victory with rewards and adds a selected reward to the deck', () => {
    const reward = card({ id: 'reward', isim: 'Ödül' });
    setCombat({ enemy: { ...enemy, mevcutCan: 1 }, hand: [card()], rewardOptions: [] });
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.999).mockReturnValueOnce(0).mockReturnValue(0);
    useGameStore.getState().playCard('card-1');
    let state = useGameStore.getState();
    expect(state.gamePhase).toBe('mapSelection');
    expect(state.rewardOptions).toHaveLength(3);
    expect(state.victoryCount).toBe(1);
    expect(state.gold).toBe(70);

    useGameStore.setState({ rewardOptions: [reward] });
    useGameStore.getState().addRewardCardToDeck('reward');
    state = useGameStore.getState();
    expect(state.gamePhase).toBe('shop');
    expect(state.deck.some((item) => item.id === 'reward')).toBe(true);
  });

  it('transitions to game over when enemy attack kills the player', () => {
    setCombat({ player: { ...player, mevcutCan: 1 }, enemyIntent: { type: 'attack' } as EnemyIntent });
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.999).mockReturnValueOnce(0.999);
    useGameStore.getState().endTurn();
    expect(useGameStore.getState().gamePhase).toBe('gameOver');
    expect(useGameStore.getState().player.mevcutCan).toBe(0);
  });

  it('moves from shop to a scaled next combat and blocks terminal actions', () => {
    useGameStore.setState({ gamePhase: 'shop', victoryCount: 1, enemy: { ...enemy } });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useGameStore.getState().startNextCombat();
    let state = useGameStore.getState();
    expect(state.gamePhase).toBe('mapSelection');
    useGameStore.getState().selectNode(state.availableNodes.find((node) => node.type === 'combat')!.id);
    state = useGameStore.getState();
    expect(state.gamePhase).toBe('combat');
    expect(state.enemy.isim).toBe('Muhafız');
    expect(state.enemy.maksimumCan).toBeGreaterThan(enemy.maksimumCan);

    useGameStore.setState({ gamePhase: 'gameOver', hand: [card()], currentEnergy: 3 });
    useGameStore.getState().playCard('card-1');
    expect(useGameStore.getState().hand).toHaveLength(1);
  });

  it('resets energy, hand, discard pile and player statuses in startNextCombat', () => {
    useGameStore.setState({
      gamePhase: 'shop',
      victoryCount: 2,
      currentEnergy: 1, // not full
      deck: [card({ id: 'deck-card' }), card({ id: 'deck-card-2' }), card({ id: 'deck-card-3' })],
      hand: [card({ id: 'hand-card' })],
      discardPile: [card({ id: 'discard-card' }), card({ id: 'discard-card-2' }), card({ id: 'discard-card-3' })],
      playerStatuses: [{ id: 'weakened', duration: 2, stacks: 1 }],
      enemyStatuses: [{ id: 'poisoned', duration: 2, stacks: 1, value: 1 }],
      playerBlock: 4,
      enemyBlock: 3,
      enemySkipNextTurn: true,
      comboChain: ['skill', 'attack'],
      comboCount: 2,
      nextDamageBonus: 4,
      enemy: { ...enemy },
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useGameStore.getState().startNextCombat();
    const state = useGameStore.getState();

    // Energy should be reset to maxEnergy (3)
    expect(state.currentEnergy).toBe(3);
    expect(state.hand).toHaveLength(state.drawCount);
    expect(state.discardPile).toHaveLength(0);
    expect(state.deck).toHaveLength(2);
    expect([...state.deck, ...state.hand].map((item) => item.id).sort()).toEqual([
      'deck-card', 'deck-card-2', 'deck-card-3', 'discard-card', 'discard-card-2', 'discard-card-3', 'hand-card',
    ].sort());

    expect(state.playerStatuses).toEqual([]);
    expect(state.enemyStatuses).toEqual([]);
    expect(state.playerBlock).toBe(0);
    expect(state.enemyBlock).toBe(0);
    expect(state.enemySkipNextTurn).toBe(false);
    expect(state.comboChain).toEqual([]);
    expect(state.comboCount).toBe(0);
    expect(state.nextDamageBonus).toBe(0);
    expect(state.gamePhase).toBe('mapSelection');
    expect(state.isPlayerTurn).toBe(true);
    expect(state.enemyIntent).not.toBeNull();
    // Enemy should be scaled based on victoryCount (2)
    expect(state.enemy.isim).toBe('Büyücü'); // archetype rotation: goblin->guardian->mage->goblin...
    // Victory count should be preserved
    expect(state.victoryCount).toBe(2);
    // Gold should be preserved
    expect(state.gold).toBe(50);
  });

  it('keeps reward cards and excludes cards removed in the shop', () => {
    const reward = card({ id: 'reward-card' });
    const removed = card({ id: 'removed-card' });
    useGameStore.setState({
      gamePhase: 'victory',
      deck: [removed],
      rewardOptions: [reward],
      gold: 50,
    });

    useGameStore.getState().addRewardCardToDeck('reward-card');
    useGameStore.getState().removeCardFromDeck('removed-card');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useGameStore.getState().startNextCombat();

    const state = useGameStore.getState();
    const combatCardIds = [...state.deck, ...state.hand].map((item) => item.id);
    expect(combatCardIds).toContain('reward-card');
    expect(combatCardIds).not.toContain('removed-card');
  });

  it('restarts the game via initializeGame', () => {
    // First, play a bit to change state from initial
    useGameStore.getState().initializeGame();
    let state = useGameStore.getState();
    expect(state.initialized).toBe(true);
    // Change some state values
    useGameStore.setState({
      gamePhase: 'gameOver',
      currentEnergy: 0,
      hand: [card({ id: 'hand-card' })],
      discardPile: [card({ id: 'discard-card' })],
      playerStatuses: [{ id: 'poisoned', duration: 3, stacks: 2 }],
      battleLogs: ['Some log'],
      gold: 30,
      victoryCount: 5,
    });
    state = useGameStore.getState();
    expect(state.gamePhase).toBe('gameOver');
    expect(state.currentEnergy).toBe(0);
    expect(state.hand).toHaveLength(1);
    expect(state.discardPile).toHaveLength(1);
    expect(state.playerStatuses).toHaveLength(1);
    expect(state.battleLogs).toHaveLength(1);
    expect(state.gold).toBe(30);
    expect(state.victoryCount).toBe(5);

    // Reset initialized flag so initializeGame will actually reset the state
    useGameStore.setState({ ...useGameStore.getState(), initialized: false });
    // Now call initializeGame to restart
    useGameStore.getState().initializeGame();
    const newState = useGameStore.getState();

    // Expect a fresh initialized state
    expect(newState.initialized).toBe(true);
    expect(newState.gamePhase).toBe('mapSelection');
    expect(newState.currentEnergy).toBe(newState.maxEnergy);
    expect(newState.hand).toHaveLength(newState.drawCount); // initial hand size
    expect(newState.discardPile).toHaveLength(0);
    expect(newState.playerStatuses).toHaveLength(0);
    expect(newState.battleLogs).toHaveLength(1); // initial log
    expect(newState.gold).toBe(50); // starting gold
    expect(newState.victoryCount).toBe(0);
    expect(newState.enemy.isim).toBe('Goblin'); // starting enemy
  });
});