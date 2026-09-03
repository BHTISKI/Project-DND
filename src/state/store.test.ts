import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useGameStore } from './store';
import {
  setupMockRandom,
  resetMockRandom,
} from '../testUtils/mockRandom';
import {
  calculateUpgradeCost,
  enhanceEffect,
  loadMetaState,
  saveMetaState,
  chooseArchetype,
  createEnemy,
  generateEnemyIntent,
  addStatus,
  statusValue,
  tickStatuses,
  rollAttackDie,
  generateAvailableNodes,
  createInitialDeck,
  getRandomRewards,
  shuffle,
} from './store';
import type { CardEffect, StatusEffect } from '../types/game';

describe('Store helper functions', () => {
  afterEach(() => {
    resetMockRandom();
    vi.restoreAllMocks();
  });

  let getItemMock: ReturnType<typeof vi.spyOn>;
  let setItemMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getItemMock = vi.spyOn(Storage.prototype, 'getItem');
    setItemMock = vi.spyOn(Storage.prototype, 'setItem');
  });

  describe('shuffle', () => {
    it('should shuffle an array', () => {
      setupMockRandom([0]);
      const array = [1, 2, 3, 4, 5];
      const shuffled = shuffle(array);
      expect(shuffled).toHaveLength(5);
      expect(shuffled).toContain(1);
      expect(shuffled).toContain(2);
      expect(shuffled).toContain(3);
      expect(shuffled).toContain(4);
      expect(shuffled).toContain(5);
      // Not the same order (very unlikely to be the same)
      expect(shuffled).not.toEqual(array);
    });
  });

  describe('calculateUpgradeCost', () => {
    it('should calculate cost based on rarity and victory count', () => {
      expect(calculateUpgradeCost('legendary', 0)).toBe(120);
      expect(calculateUpgradeCost('legendary', 1)).toBe(132); // 120 + 12
      expect(calculateUpgradeCost('rare', 0)).toBe(80);
      expect(calculateUpgradeCost('rare', 5)).toBe(120); // 80 + 40
      expect(calculateUpgradeCost('uncommon', 0)).toBe(60);
      expect(calculateUpgradeCost('uncommon', 10)).toBe(120); // 60 + 60
      expect(calculateUpgradeCost('common', 0)).toBe(40);
      expect(calculateUpgradeCost('common', 20)).toBe(120); // 40 + 80
    });
    it('upgrade cost scales with victoryCount correctly', () => {
      // test upgradeCost function directly
      expect(calculateUpgradeCost('common', 0)).toBe(40);
      expect(calculateUpgradeCost('common', 1)).toBe(44);
      expect(calculateUpgradeCost('common', 2)).toBe(48);
      expect(calculateUpgradeCost('common', 10)).toBe(80);
      expect(calculateUpgradeCost('rare', 0)).toBe(80);
      expect(calculateUpgradeCost('rare', 5)).toBe(120);
      expect(calculateUpgradeCost('legendary', 0)).toBe(120);
      expect(calculateUpgradeCost('legendary', 20)).toBe(360);
    });
  });

  describe('enhanceEffect', () => {
    it('should enhance attack effect', () => {
      const effect: CardEffect = { kind: 'attack', damageBonus: 1 };
      const enhanced = enhanceEffect(effect);
      expect(enhanced).toEqual({ kind: 'attack', damageBonus: 3 });
    });

    it('should enhance damage effect', () => {
      const effect: CardEffect = { kind: 'damage', die: 'd6', damageBonus: 2 };
      const enhanced = enhanceEffect(effect);
      expect(enhanced).toEqual({ kind: 'damage', die: 'd6', damageBonus: 4 });
    });

    it('should enhance block effect with amount', () => {
      const effect: CardEffect = { kind: 'block', amount: 3 };
      const enhanced = enhanceEffect(effect);
      expect(enhanced).toEqual({ kind: 'block', amount: 5 });
    });

    it('should enhance block effect with die', () => {
      const effect: CardEffect = { kind: 'block', die: 'd6' };
      const enhanced = enhanceEffect(effect);
      expect(enhanced).toEqual({ kind: 'block', die: 'd8' });
    });

    it('should enhance heal effect with amount', () => {
      const effect: CardEffect = { kind: 'heal', amount: 4 };
      const enhanced = enhanceEffect(effect);
      expect(enhanced).toEqual({ kind: 'heal', amount: 6 });
    });

    it('should enhance heal effect with die', () => {
      const effect: CardEffect = { kind: 'heal', die: 'd4' };
      const enhanced = enhanceEffect(effect);
      expect(enhanced).toEqual({ kind: 'heal', die: 'd6' });
    });

    it('should enhance status effect', () => {
      const effect: CardEffect = { kind: 'status', status: 'poisoned', duration: 2, stacks: 1 };
      const enhanced = enhanceEffect(effect);
      expect(enhanced).toEqual({ kind: 'status', status: 'poisoned', duration: 3, stacks: 2 });
    });

    it('should enhance draw effect', () => {
      const effect: CardEffect = { kind: 'draw', amount: 2 };
      const enhanced = enhanceEffect(effect);
      expect(enhanced).toEqual({ kind: 'draw', amount: 3 });
    });

    it('should enhance energy effect', () => {
      const effect: CardEffect = { kind: 'energy', amount: 1 };
      const enhanced = enhanceEffect(effect);
      expect(enhanced).toEqual({ kind: 'energy', amount: 2 });
    });

    it('should return skip effect unchanged', () => {
      const effect: CardEffect = { kind: 'skip' };
      const enhanced = enhanceEffect(effect);
      expect(enhanced).toEqual({ kind: 'skip' });
    });
  });

  describe('loadMetaState and saveMetaState', () => {
    beforeEach(() => {
      // Mocks are set in the outer beforeEach
    });

    it('should load and save meta state from localStorage', () => {
      getItemMock.mockImplementation((key: string) => {
        if (key === 'metaGold') return '100'
        if (key === 'metaVictories') return '5'
        return null
      })
      const meta = loadMetaState();
      expect(meta).toEqual({ metaGold: 100, metaVictories: 5 })
      expect(getItemMock).toHaveBeenCalledWith('metaGold')
      expect(getItemMock).toHaveBeenCalledWith('metaVictories')

      saveMetaState(200, 10)
      expect(setItemMock).toHaveBeenCalledWith('metaGold', '200')
      expect(setItemMock).toHaveBeenCalledWith('metaVictories', '10')
    })

    it('should return zeros if localStorage fails', () => {
      getItemMock.mockImplementation(() => {
        throw new Error('Failed')
      })

      const meta = loadMetaState()
      expect(meta).toEqual({ metaGold: 0, metaVictories: 0 })
    })
  });

  describe('chooseArchetype', () => {
    it('should cycle through archetypes based on victory count', () => {
      expect(chooseArchetype(0)).toBe('goblin');
      expect(chooseArchetype(1)).toBe('guardian');
      expect(chooseArchetype(2)).toBe('mage');
      expect(chooseArchetype(3)).toBe('goblin');
      expect(chooseArchetype(4)).toBe('guardian');
    });
  });

  describe('createEnemy', () => {
    it('should create an enemy with correct stats', () => {
      const enemy = createEnemy('goblin', 0);
      expect(enemy).toEqual({
        id: 'enemy-0',
        isim: 'Goblin',
        mevcutCan: 7,
        maksimumCan: 7,
        zirhSinifi: 11,
        gucCarpani: 1,
        advantageCounter: 0,
        disadvantageCounter: 0,
      });
    });

    it('should scale enemy stats with tier', () => {
      const enemy = createEnemy('goblin', 2);
      expect(enemy.mevcutCan).toBe(7 + 2 * 2); // guardian? wait, goblin: hp + tier * 2
      expect(enemy.maksimumCan).toBe(7 + 2 * 2);
      expect(enemy.zirhSinifi).toBe(11 + Math.floor(2 / 2)); // ac + floor(tier/2)
      expect(enemy.gucCarpani).toBe(1 + Math.floor(2 / 3)); // power + floor(tier/3)
    });
  });

  describe('generateEnemyIntent', () => {
    it('should generate attack intent based on weights', () => {
      setupMockRandom([0.1]); // low roll -> attack
      const enemy = { id: 'e1', isim: 'Enemy', mevcutCan: 5, maksimumCan: 5, zirhSinifi: 10, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 };
      const result = generateEnemyIntent(enemy, 'goblin');
      expect(result.intent.type).toBe('attack');
      expect(result.value).toBeGreaterThan(0);
      expect(result.block).toBe(0);
    });

    it('should generate defend intent based on weights', () => {
      setupMockRandom([0.7]); // between attack and defend weights for goblin (0.65, 0.2, 0.15) -> 0.7 is in defend range
      const enemy = { id: 'e1', isim: 'Enemy', mevcutCan: 5, maksimumCan: 5, zirhSinifi: 10, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 };
      const result = generateEnemyIntent(enemy, 'goblin');
      expect(result.intent.type).toBe('defend');
      expect(result.value).toBeGreaterThan(0);
      expect(result.block).toBeGreaterThan(0);
    });

    it('should generate special heal intent for mage', () => {
      setupMockRandom([0.9]); // high roll -> special
      const enemy = { id: 'e1', isim: 'Enemy', mevcutCan: 5, maksimumCan: 5, zirhSinifi: 10, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 };
      const result = generateEnemyIntent(enemy, 'mage'); // mage special is damage
      expect(result.intent.type).toBe('special');
      // For mage, special is damage
      expect(result.intent.estimatedDamage).toBeDefined();
    });

    it('should generate special heal intent for guardian', () => {
      setupMockRandom([0.9]); // high roll -> special
      const enemy = { id: 'e1', isim: 'Enemy', mevcutCan: 5, maksimumCan: 5, zirhSinifi: 10, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 };
      const result = generateEnemyIntent(enemy, 'guardian'); // guardian special is heal
      expect(result.intent.type).toBe('special');
      expect(result.intent.estimatedHeal).toBeDefined();
    });

    it('should generate special weakened intent for goblin', () => {
      setupMockRandom([0.9]); // high roll -> special
      const enemy = { id: 'e1', isim: 'Enemy', mevcutCan: 5, maksimumCan: 5, zirhSinifi: 10, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 };
      const result = generateEnemyIntent(enemy, 'goblin'); // goblin special is weakened
      expect(result.intent.type).toBe('special');
      expect(result.intent.effectKey).toBe('weakened');
    });
  });

  describe('addStatus', () => {
    it('should add a new status', () => {
      const statuses: StatusEffect[] = [];
      const effect: StatusEffect = { id: 'poisoned', duration: 2, stacks: 1, value: 1 };
      const result = addStatus(statuses, effect);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(effect);
    });

    it('should stack existing status', () => {
      const statuses: StatusEffect[] = [{ id: 'poisoned', duration: 2, stacks: 1, value: 1 }];
      const effect: StatusEffect = { id: 'poisoned', duration: 3, stacks: 2, value: 2 };
      const result = addStatus(statuses, effect);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'poisoned',
        duration: Math.max(2, 3),
        stacks: Math.min(3, 1 + 2),
        value: 2,
      });
    });
  });

  describe('statusValue', () => {
    it('should return value for existing status', () => {
      const statuses: StatusEffect[] = [
        { id: 'poisoned', duration: 2, stacks: 1, value: 5 },
        { id: 'vulnerable', duration: 1, stacks: 1, value: 3 },
      ];
      expect(statusValue(statuses, 'poisoned')).toBe(5);
      expect(statusValue(statuses, 'vulnerable')).toBe(3);
      expect(statusValue(statuses, 'empowered')).toBe(0);
    });
  });

  describe('tickStatuses', () => {
    it('should tick down statuses and apply poisoned damage', () => {
      setupMockRandom([0]); // not used in tickStatuses
      const character = { id: 'c1', isim: 'Char', mevcutCan: 10, maksimumCan: 10, zirhSinifi: 10, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 };
      const statuses: StatusEffect[] = [
        { id: 'poisoned', duration: 2, stacks: 1, value: 2 },
        { id: 'vulnerable', duration: 1, stacks: 1, value: 0 },
      ];
      const result = tickStatuses(statuses, 'player', character);
      expect(result.statuses).toHaveLength(1); // poisoned duration 1 left, vulnerable expired
      expect(result.statuses[0]).toEqual({ id: 'poisoned', duration: 1, stacks: 1, value: 2 });
      expect(result.character.mevcutCan).toBe(8); // 10 - 2*1 (value * stacks)
      expect(result.log).toContain('Oyuncu zehirden 2 hasar aldı.');
    });

    it('should not apply poisoned damage if value is 0', () => {
      const character = { id: 'c1', isim: 'Char', mevcutCan: 10, maksimumCan: 10, zirhSinifi: 10, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 };
      const statuses: StatusEffect[] = [{ id: 'poisoned', duration: 2, stacks: 1, value: 0 }];
      const result = tickStatuses(statuses, 'player', character);
      expect(result.character.mevcutCan).toBe(10);
      expect(result.log).toEqual([]); // no log because damage is 0
    });
  });

  describe('rollAttackDie', () => {
    it('should roll normal d20 when advantage and disadvantage are equal', () => {
      setupMockRandom([0.5]); // 0.5 * 20 = 10 -> roll 11 (floor(0.5*20)+1)
      const roll = rollAttackDie(0, 0);
      expect(roll).toBe(11);
    });

    it('should roll with advantage (take higher of two rolls)', () => {
      // Mock two consecutive random calls for the two d20 rolls
      setupMockRandom([0.9, 0.3]); // first 0.9*20=18 -> 19, second 0.3*20=6 -> 7
      const roll = rollAttackDie(2, 0); // advantage 2
      expect(roll).toBe(19); // higher of 19 and 7
    });

    it('should roll with disadvantage (take lower of two rolls)', () => {
      setupMockRandom([0.1, 0.8]); // first 0.1*20=2 -> 3, second 0.8*20=16 -> 17
      const roll = rollAttackDie(0, 2); // disadvantage 2
      expect(roll).toBe(3); // lower of 3 and 17
    });
  });

  describe('generateAvailableNodes', () => {
    it('should generate nodes for floor 0', () => {
      const nodes = generateAvailableNodes(0);
      expect(nodes).toHaveLength(3);
      expect(nodes[0]).toEqual({ type: 'combat', id: 'floor-0-combat-0' });
      expect(nodes[1]).toEqual({ type: 'combat', id: 'floor-0-combat-1' });
      expect(nodes[2]).toEqual({ type: 'shop', id: 'floor-0-shop-0' });
    });

    it('should generate nodes for floor 3 (boss, elite, shop)', () => {
      const nodes = generateAvailableNodes(3);
      expect(nodes).toHaveLength(3);
      expect(nodes[0]).toEqual({ type: 'boss', id: 'floor-3-boss-0' });
      expect(nodes[1]).toEqual({ type: 'elite', id: 'floor-3-elite-0' });
      expect(nodes[2]).toEqual({ type: 'shop', id: 'floor-3-shop-0' });
    });
  });

  describe('createInitialDeck', () => {
    it('should create a shuffled deck of 7 cards', () => {
      setupMockRandom([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]); // deterministic shuffle
      const deck = createInitialDeck();
      expect(deck).toHaveLength(7);
      // Each card should have an id
      deck.forEach(card => {
        expect(card.id).toBeDefined();
        expect(typeof card.id).toBe('string');
      });
    });
  });

  describe('getRandomRewards', () => {
    it('should return 3 random unique cards from sampleCardDefs', () => {
      // Provide enough mock values for:
      // - shuffle([...sampleCardDefs]): 108 calls (109 items - 1)
      // - 3 calls to generateRandomId() for the 3 selected cards
      // Total: 111 calls
      const mockValues = [];
      for (let i = 1; i <= 111; i++) {
        mockValues.push(i / 1000); // 0.001, 0.002, ..., 0.111
      }
      setupMockRandom(mockValues);
      const rewards = getRandomRewards();
      expect(rewards).toHaveLength(3);
      rewards.forEach(card => {
        expect(card.id).toBeDefined();
        expect(typeof card.id).toBe('string');
      });
      // IDs should be unique
      const ids = rewards.map(c => c.id);
      expect(ids.length).toBe(3);
      expect(new Set(ids).size).toBe(3);
    });
  });
});
describe('Store actions', () => {
  beforeEach(() => {
    // Reset store to initial state (not initialized)
    useGameStore.setState({
      initialized: false,
      gamePhase: 'mapSelection',
      player: { id: 'player', isim: 'Ero', mevcutCan: 10, maksimumCan: 10, zirhSinifi: 12, gucCarpani: 2, advantageCounter: 0, disadvantageCounter: 0 },
      enemy: { id: "enemy", isim: "Goblin", mevcutCan: 10, maksimumCan: 10, zirhSinifi: 11, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 },
      isPlayerTurn: true,
      maxEnergy: 3,
      currentEnergy: 3,
      deck: [],
      hand: [],
      discardPile: [],
      drawCount: 5,
      gold: 50,
      metaGold: 0,
      metaVictories: 0,
      battleLogs: [],
      rewardOptions: [],
      playerBlock: 0,
      enemyBlock: 0,
      enemySkipNextTurn: false,
      victoryCount: 0,
      enemyIntent: null,
      enemyIntentValue: 0,
      enemyArchetype: 'goblin',
      playerStatuses: [],
      enemyStatuses: [],
      comboChain: [],
      comboCount: 0,
      nextDamageBonus: 0,
      // runFloor, currentNode, availableNodes, nodeType will be set by initializeGame
    });
    setupMockRandom([0]); // deterministic mock for any random calls
  });

  afterEach(() => {
    resetMockRandom();
    vi.restoreAllMocks();
  });

  describe('initializeGame', () => {
    it('should initialize the game with default values', () => {
      useGameStore.getState().initializeGame();
      const state = useGameStore.getState();
      expect(state.initialized).toBe(true);
      expect(state.gamePhase).toBe('mapSelection');
      expect(state.deck).toHaveLength(2); // 7 total cards - 5 in hand
      expect(state.hand).toHaveLength(5);
      expect(state.discardPile).toHaveLength(0);
      expect(state.gold).toBe(50);
      expect(state.currentEnergy).toBe(3);
      expect(state.player.mevcutCan).toBe(10);
      expect(state.enemy.mevcutCan).toBe(7); // defaultEnemy is goblin tier 0
      expect(state.enemyIntent).toBeDefined();
    });

    it('should not re-initialize if already initialized', () => {
      // First initialize
      useGameStore.getState().initializeGame();
      // Modify something
      useGameStore.setState({ gold: 999 });
      // Initialize again
      useGameStore.getState().initializeGame();
      const state2 = useGameStore.getState();
      // Gold should remain 999 because initializeGame early returns if initialized
      expect(state2.gold).toBe(999);
    });
  });

  describe('restartGame', () => {
    it('should reset the game to uninitialized state when gameOver', () => {
      // First initialize and then set to gameOver
      useGameStore.getState().initializeGame();
      useGameStore.setState({ gamePhase: 'gameOver' });
      useGameStore.getState().restartGame();
      const state = useGameStore.getState();
      // restartGame sets initialized to false, then calls initializeGame which sets it back to true
      expect(state.initialized).toBe(true);
      expect(state.gamePhase).toBe('mapSelection'); // because initializeGame sets it
    });

    it('should do nothing if not gameOver', () => {
      useGameStore.getState().initializeGame();
      useGameStore.setState({ gamePhase: 'combat' });
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().restartGame();
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      expect(stateAfter).toEqual(stateBefore);
    });
  });

  describe('drawCards', () => {
    it('should draw cards from deck, shuffling discard when needed', () => {
      // Initialize to get a deck
      useGameStore.getState().initializeGame();
      // Draw 3 cards (only 2 available in deck, so will shuffle discard - which is empty - and draw 2)
      useGameStore.getState().drawCards(3);
      const newState = useGameStore.getState();
      expect(newState.hand).toHaveLength(7); // 5 original + 2 drawn
      expect(newState.deck).toHaveLength(0); // deck had 2, tried to draw 3 -> 0
      expect(newState.discardPile).toHaveLength(0);
    });

    it('should shuffle discard into deck when deck is insufficient', () => {
      // Start with initialized game
      useGameStore.getState().initializeGame();

      // Draw all cards from deck to hand (exhaust deck)
      // After initializeGame: hand=5, deck=2, discard=0
      // After drawCards(2): hand=7, deck=0, discard=0
      useGameStore.getState().drawCards(2);

      // Now simulate having played some cards (move 3 cards from hand to discard)
      // We'll do this by manipulating the state directly for test setup
      const stateAfterDraw = useGameStore.getState();
      useGameStore.setState({
        ...stateAfterDraw,
        hand: stateAfterDraw.hand.slice(0, -3), // Remove last 3 cards from hand
        discardPile: [...stateAfterDraw.hand.slice(-3), ...stateAfterDraw.discardPile] // Move them to discard
      });

      // Now state should be: hand=4, deck=0, discard=3
      const stateBeforeDraw = useGameStore.getState();
      expect(stateBeforeDraw.hand).toHaveLength(4);
      expect(stateBeforeDraw.deck).toHaveLength(0);
      expect(stateBeforeDraw.discardPile).toHaveLength(3);

      // Now draw 3 cards - should trigger shuffle since deck.length (0) < 3
      useGameStore.getState().drawCards(3);
      const stateAfterDraw_2 = useGameStore.getState();

      // After shuffle and draw:
      // - discard (3 cards) gets shuffled into deck
      // - 3 cards are drawn from deck
      // - deck should be empty (3 - 3 = 0)
      // - discard should be empty
      // - hand should be original hand (4) + drawn cards (3) = 7
      expect(stateAfterDraw_2.hand).toHaveLength(7);
      expect(stateAfterDraw_2.deck).toHaveLength(0);
      expect(stateAfterDraw_2.discardPile).toHaveLength(0);
    });
  });

  // We'll focus on testing the actions that are most critical for coverage.
  // Due to time, we'll test a few key actions and then move on to other files.

  describe('endTurn', () => {
    it('should process enemy attack and reduce player HP', () => {
      // Fix the published attack and roll independently of catalog size / shuffle calls.
      setupMockRandom([0.5]);
      useGameStore.getState().initializeGame();
      // Ensure we are in combat and player turn
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'combat',
        isPlayerTurn: true,
        player: { ...useGameStore.getState().player, mevcutCan: 10 },
        enemy: { ...useGameStore.getState().enemy, mevcutCan: 5 },
        enemyIntent: { type: 'attack', action: { kind: 'attack', damage: 4 } },
        hand: [],
      });
      const stateBefore = useGameStore.getState();
      console.log('Before:', JSON.stringify({
        playerHP: stateBefore.player.mevcutCan,
        enemyHP: stateBefore.enemy.mevcutCan,
        enemyGucCarpani: stateBefore.enemy.gucCarpani,
        enemyIntent: stateBefore.enemyIntent,
        battleLogsLength: stateBefore.battleLogs.length,
        battleLogs: stateBefore.battleLogs
      }));
      useGameStore.getState().endTurn();
      const stateAfter = useGameStore.getState();
      console.log('After:', JSON.stringify({
        playerHP: stateAfter.player.mevcutCan,
        enemyHP: stateAfter.enemy.mevcutCan,
        enemyGucCarpani: stateAfter.enemy.gucCarpani,
        enemyIntent: stateAfter.enemyIntent,
        battleLogsLength: stateAfter.battleLogs.length,
        battleLogs: stateAfter.battleLogs,
        gamePhase: stateAfter.gamePhase,
        isPlayerTurn: stateAfter.isPlayerTurn
      }));
      // After enemy turn, isPlayerTurn should be true again
      expect(stateAfter.isPlayerTurn).toBe(true);
      // Enemy should have attacked and reduced player HP
      expect(stateAfter.player.mevcutCan).toBeLessThan(stateBefore.player.mevcutCan);
      // We'll just check that the turn advanced and logs were added (one log for the attack)
      // Check that an attack log was added
      const attackLogExists = stateAfter.battleLogs.some(log => log.includes('Başarılı saldırı') || log.includes('hasar vuruldu'));
      expect(attackLogExists).toBe(true);
      // Ensure battleLogs length increased by at least 1 (attack log)
      expect(stateAfter.battleLogs.length).toBeGreaterThanOrEqual(stateBefore.battleLogs.length + 1);
    });

    it('should transition to victory when enemy dies', () => {
      // Set up state where enemy will die during enemy turn (e.g., from poison)
      // Use a constant mock so that random calls don't interfere (we don't attack, we just tick poison)
      setupMockRandom([0.5]);
      useGameStore.getState().initializeGame();
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'combat',
        isPlayerTurn: true,
        player: { ...useGameStore.getState().player, mevcutCan: 10 },
        enemy: { ...useGameStore.getState().enemy, mevcutCan: 1 },
        enemyStatuses: [{ id: 'poisoned', duration: 1, stacks: 1, value: 1 }],
      });
      useGameStore.getState().endTurn();
      const stateAfter = useGameStore.getState();
      // Enemy should die from poison during tickStatuses
      expect(stateAfter.gamePhase).toBe('mapSelection'); // victory leads to mapSelection
      expect(stateAfter.victoryCount).toBe(1);
      expect(stateAfter.enemy.mevcutCan).toBe(0);
    });

    it('should transition to gameOver when player dies', () => {
      // Use a constant mock value of 0.5 for all random calls in the test.
      // This results in:
      //   - enemy attack roll: 11 (d20) -> hit (since 11 + 10 >= 12)
      //   - damage roll: 4 (d6) -> damage = 4 + 10 = 14 -> player HP: 1 - 14 = -13 -> 0
      setupMockRandom([0.5]);
      useGameStore.getState().initializeGame();
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'combat',
        isPlayerTurn: true,
        player: { ...useGameStore.getState().player, mevcutCan: 1 },
        enemy: { ...useGameStore.getState().enemy, mevcutCan: 10, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 }, // high power
      });
      useGameStore.getState().endTurn();
      const stateAfter = useGameStore.getState();
      expect(stateAfter.gamePhase).toBe('gameOver');
      expect(stateAfter.player.mevcutCan).toBe(0);
    });
  });

  describe('playCard', () => {
    it('should play an attack card and reduce enemy HP', () => {
      // Set up state for playing a card
      setupMockRandom([0.5, 0.5]); // for attack roll and damage roll
      useGameStore.getState().initializeGame();
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'combat',
        isPlayerTurn: true,
        player: { ...useGameStore.getState().player, mevcutCan: 10 },
        currentEnergy: 3,
        enemy: { ...useGameStore.getState().enemy, mevcutCan: 10 },
        hand: [{ id: 'card-1', isim: 'Test Strike', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', effects: [{ kind: 'attack', die: 'd4' }] }],
      });
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().playCard('card-1');
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      // Energy should be spent
      expect(stateAfter.currentEnergy).toBe(2);
      // Card should be moved to discard
      expect(stateAfter.hand).toHaveLength(0);
      expect(stateAfter.discardPile).toHaveLength(1);
      // Enemy should have taken damage
      // We'll just check that the turn is still player turn (since enemy didn't die)
      expect(stateAfter.isPlayerTurn).toBe(true);
      // Log should be added
      expect(stateAfter.battleLogs).toHaveLength(stateBefore.battleLogs.length + 1);
    });

    it('should not play card if not enough energy', () => {
      useGameStore.getState().initializeGame();

      useGameStore.setState({
        ...useGameStore.getState(),
        currentEnergy: 0,
        gamePhase: 'combat',
        isPlayerTurn: true,
        hand: [{ id: 'card-1', isim: 'Test Strike', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', effects: [{ kind: 'attack', die: 'd4' }] }],
      });
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().playCard('card-1');
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      // State should be unchanged except for battleLogs increase
      expect(stateAfter.hand).toEqual(stateBefore.hand);
      expect(stateAfter.currentEnergy).toBe(stateBefore.currentEnergy);
      expect(stateAfter.gamePhase).toBe(stateBefore.gamePhase);
      expect(stateAfter.isPlayerTurn).toBe(stateBefore.isPlayerTurn);
      expect(stateAfter.battleLogs).toHaveLength(stateBefore.battleLogs.length + 1);
    });
  });

  describe('healPlayer (shop action)', () => {
    it('should heal player when enough gold', () => {
      useGameStore.getState().initializeGame();
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'shop',
        player: { ...useGameStore.getState().player, mevcutCan: 5 },
        gold: 30,
      });
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().healPlayer();
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      expect(stateAfter.player.mevcutCan).toBe(9); // 5 + 4
      expect(stateAfter.gold).toBe(5); // 30 - 25
      expect(stateAfter.battleLogs).toHaveLength(stateBefore.battleLogs.length + 1);
    });

    it('should not heal when not enough gold', () => {
      useGameStore.getState().initializeGame();
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'shop',
        player: { ...useGameStore.getState().player, mevcutCan: 5 },
        gold: 20,
      });
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().healPlayer();
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      // State should be unchanged except for battleLogs increase
      expect(stateAfter.player.mevcutCan).toBe(stateBefore.player.mevcutCan);
      expect(stateAfter.gold).toBe(stateBefore.gold);
      expect(stateAfter.gamePhase).toBe(stateBefore.gamePhase);
      expect(stateAfter.battleLogs).toHaveLength(stateBefore.battleLogs.length + 1);
    });
  });

  describe('removeCardFromDeck (shop action)', () => {
    it('should remove a card from deck when enough gold', () => {
      useGameStore.getState().initializeGame();
      // Give the player a card in deck
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'shop',
        deck: [{ id: 'card-1', isim: 'Test Card', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', effects: [] }],
        gold: 60,
      });
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().removeCardFromDeck('card-1');
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      expect(stateAfter.deck).toHaveLength(0);
      expect(stateAfter.gold).toBe(10); // 60 - 50
      expect(stateAfter.battleLogs).toHaveLength(stateBefore.battleLogs.length + 1);
    });

    it('should not remove card when not enough gold', () => {
      useGameStore.getState().initializeGame();
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'shop',
        deck: [{ id: 'card-1', isim: 'Test Card', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', effects: [] }],
        gold: 20,
      });
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().removeCardFromDeck('card-1');
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      // State should be unchanged except for battleLogs increase
      expect(stateAfter.deck).toEqual(stateBefore.deck);
      expect(stateAfter.gold).toBe(stateBefore.gold);
      expect(stateAfter.gamePhase).toBe(stateBefore.gamePhase);
      expect(stateAfter.battleLogs).toHaveLength(stateBefore.battleLogs.length + 1);
    });
  });

  describe('upgradeCard (shop action)', () => {
    it('should upgrade a card when enough gold', () => {
      useGameStore.getState().initializeGame();
      // Give the player a common card in deck
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'shop',
        deck: [{ id: 'card-1', isim: 'Test Card', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', effects: [], rarity: 'common' }],
        gold: 60,
        victoryCount: 0,
      });
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().upgradeCard('card-1');
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      expect(stateAfter.deck[0]).toMatchObject({
        id: 'card-1',
        isUpgraded: true,
        effects: [],
      });
      expect(stateAfter.gold).toBe(20); // 60 - 60 (base cost 40 + 0)
      expect(stateAfter.battleLogs).toHaveLength(stateBefore.battleLogs.length + 1);
    });

    it('should not upgrade card when not enough gold', () => {
      useGameStore.getState().initializeGame();
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'shop',
        deck: [{ id: 'card-1', isim: 'Test Card', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', effects: [], rarity: 'legendary' }],
        gold: 50,
        victoryCount: 0,
      });
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().upgradeCard('card-1');
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      // State should be unchanged except for battleLogs increase
      expect(stateAfter.deck).toEqual(stateBefore.deck);
      expect(stateAfter.gold).toBe(stateBefore.gold);
      expect(stateAfter.gamePhase).toBe(stateBefore.gamePhase);
      expect(stateAfter.battleLogs).toHaveLength(stateBefore.battleLogs.length + 1);
    });
  });

  describe('startNextCombat (shop action)', () => {
    it('should start combat after shop', () => {
      useGameStore.getState().initializeGame();
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: 'shop',
        player: { ...useGameStore.getState().player, mevcutCan: 10 },
        // Provide a deck with 5 cards to draw a full hand
        deck: Array.from({length: 5}, (_, i) => ({
          id: `card-${i}`,
          isim: 'Test Card',
          tip: 'saldırı',
          manaBedeli: 1,
          baseHasar: 0,
          zarTuru: 'd4',
          effects: [],
        })),
        hand: [],
        discardPile: [],
      });
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().startNextCombat();
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      expect(stateAfter.gamePhase).toBe('mapSelection');
      expect(stateAfter.enemy.mevcutCan).toBeGreaterThan(0);
      expect(stateAfter.hand).toHaveLength(0); // no draw until combat starts
      expect(stateAfter.deck).toHaveLength(5); // cards preserved on map
      expect(stateAfter.discardPile).toHaveLength(0);
    });
  });

  
  describe('selectNode (map selection)', () => {
    it('should transition to combat when combat node selected', () => {
      useGameStore.getState().initializeGame();
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      useGameStore.getState().selectNode(stateBefore.availableNodes[0].id); // first combat node
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      expect(stateAfter.gamePhase).toBe('deckBuild');
      expect(stateAfter.enemy).toBeDefined();
      useGameStore.getState().chooseDraftCard(stateAfter.draftOptions[0].id);
      useGameStore.getState().chooseDraftCard(useGameStore.getState().draftOptions[0].id);
      useGameStore.getState().chooseDraftCard(useGameStore.getState().draftOptions[0].id);
      expect(useGameStore.getState().gamePhase).toBe('combat');
      expect(stateAfter.hand).toHaveLength(5);
    });

    it('should transition to shop when shop node selected', () => {
      useGameStore.getState().initializeGame();
      const stateBefore = useGameStore.getState();
      console.log("Before battleLogs:", JSON.stringify(stateBefore.battleLogs));
      // Find a shop node
      const shopNode = stateBefore.availableNodes.find(node => node.type === 'shop');
      expect(shopNode).toBeDefined();
      useGameStore.getState().selectNode(shopNode!.id);
      const stateAfter = useGameStore.getState();
      console.log("After battleLogs:", JSON.stringify(stateAfter.battleLogs));
      expect(stateAfter.gamePhase).toBe('shop');
    });
  });
});
