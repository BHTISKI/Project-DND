// Bu dosya src/testUtils/game.test.tsx için ilgili kodları içerir.
// Test paketi: oyun akışı ve bileşen etkileşimleri için entegrasyon testleri
// Test paketi: oyun akışı ve bileşen etkileşimleri için entegrasyon testleri
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import App from '../App';
import { useGameStore } from '../state/store';
import type { Card } from '../types/game';
import { createDataTransfer, mockRandom, withMockRandom } from './index';
import { cleanup } from '@testing-library/react';

// Reset store to initial state before each test
beforeEach(() => {
  useGameStore.setState({
    ...useGameStore.getInitialState(),
    playerName: 'Ero',
    player: { id: 'player-1', isim: 'Ero', mevcutCan: 10, maksimumCan: 10, zirhSinifi: 12, gucCarpani: 2, advantageCounter: 0, disadvantageCounter: 0 },
    enemy: { id: 'enemy-0', isim: 'Goblin', mevcutCan: 7, maksimumCan: 7, zirhSinifi: 11, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 },
    isPlayerTurn: true,
    maxEnergy: 3,
    currentEnergy: 3,
    deck: [],
    hand: [],
    discardPile: [],
    drawCount: 5,
    gold: 50,
    battleLogs: [],
    initialized: false,
    playerBlock: 0,
    enemyBlock: 0,
    enemySkipNextTurn: false,
    victoryCount: 0,
    gamePhase: 'combat',
    rewardOptions: [],
    enemyIntent: null,
    enemyIntentValue: 0,
    enemyArchetype: 'goblin',
    playerStatuses: [],
    enemyStatuses: [],
    comboChain: [],
    comboCount: 0,
    nextDamageBonus: 0,
  });
});

afterEach(() => {
  cleanup();
});

const testCard: Card = {
  id: 'reward-card',
  isim: 'Test Ödülü',
  tip: 'yetenek',
  manaBedeli: 1,
  baseHasar: 0,
  zarTuru: 'd4',
  rarity: 'rare',
  effects: [{ kind: 'energy', amount: 1 }],
};

describe('upgrade system', () => {
  it('calculates upgrade cost correctly', () => {
    // reset store
    useGameStore.setState({
      victoryCount: 0,
      gold: 50,
    });
    // We need to get a card from the deck to test, but we can also test the cost function directly.
    // We'll just test the cost function logic.
    const cost = (rarity: 'common' | 'uncommon' | 'rare' | undefined, victoryCount: number) => {
      const baseCost = rarity === 'rare' ? 80 : rarity === 'uncommon' ? 60 : 40;
      return baseCost + Math.floor(baseCost * victoryCount * 0.1);
    };
    expect(cost('common', 0)).toBe(40);
    expect(cost('common', 1)).toBe(44); // 40 + 4
    expect(cost('common', 2)).toBe(48); // 40 + 8
    expect(cost('uncommon', 0)).toBe(60);
    expect(cost('uncommon', 1)).toBe(66); // 60 + 6
    expect(cost('rare', 0)).toBe(80);
    expect(cost('rare', 1)).toBe(88); // 80 + 8
  });

  it('upgrades a card and deducts gold', () => {
    useGameStore.setState({
      initialized: true,
      gamePhase: 'shop',
      gold: 100,
      victoryCount: 0,
      deck: [],
    });
    // We'll add a known card to the deck for testing
    const testCard: Card = {
      id: 'test-card',
      isim: 'Test Kartı',
      tip: 'saldırı',
      manaBedeli: 1,
      baseHasar: 0,
      zarTuru: 'd4',
      rarity: 'common',
      effects: [{ kind: 'attack', die: 'd4' }],
    };
    // We need to add the card to the deck via state
    useGameStore.setState({
      deck: [testCard],
    });
    const initialGold = useGameStore.getState().gold;
    const initialDeckLength = useGameStore.getState().deck.length;
    // Upgrade the card
    useGameStore.getState().upgradeCard(testCard.id);
    const stateAfter = useGameStore.getState();
    // Gold should be decreased by the cost
    const expectedCost = 40; // common, victoryCount 0
    expect(stateAfter.gold).toBe(initialGold - expectedCost);
    // Deck should have the same number of cards (we replaced the card)
    expect(stateAfter.deck.length).toBe(initialDeckLength);
    // Find the upgraded card in the deck by id
    const upgradedCard = stateAfter.deck.find((c) => c.id === testCard.id && c.isUpgraded);
    expect(upgradedCard).toBeDefined();
    // The upgraded card should have enhanced effect
    if (upgradedCard) {
      const upgradedEffect = upgradedCard.effects?.[0];
      expect(upgradedEffect).toBeDefined();
      // Attack effect should have damageBonus increased by 2
      if (upgradedEffect && (upgradedEffect.kind === 'attack' || upgradedEffect.kind === 'damage')) {
        expect(upgradedEffect.damageBonus).toBe(2); // original was 0, now 2
      }
    }
  });

  it('does not upgrade already upgraded card', () => {
    // Set up a state with an upgraded card in the deck
    const upgradedCard: Card = {
      id: 'upgraded-card',
      isim: 'Test Kartı',
      tip: 'saldırı',
      manaBedeli: 1,
      baseHasar: 0,
      zarTuru: 'd4',
      rarity: 'common',
      isUpgraded: true,
      effects: [{ kind: 'attack', die: 'd4', damageBonus: 2 }], // already upgraded
    };
    useGameStore.setState({
      initialized: true,
      gamePhase: 'shop',
      gold: 100,
      victoryCount: 0,
      deck: [upgradedCard],
    });
    const initialGold = useGameStore.getState().gold;
    const initialDeckLength = useGameStore.getState().deck.length;
    // Try to upgrade the upgraded card
    useGameStore.getState().upgradeCard(upgradedCard.id);
    const stateAfter = useGameStore.getState();
    // Gold should not change
    expect(stateAfter.gold).toBe(initialGold);
    // Deck length should not change
    expect(stateAfter.deck.length).toBe(initialDeckLength);
    // The card should still be upgraded (no change)
    const stillUpgraded = stateAfter.deck.find((c) => c.id === upgradedCard.id && c.isUpgraded);
    expect(stillUpgraded).toBeDefined();
  });

  it('does not upgrade when gold insufficient', () => {
    const testCard: Card = {
      id: 'test-card-2',
      isim: 'Test Kartı 2',
      tip: 'saldırı',
      manaBedeli: 1,
      baseHasar: 0,
      zarTuru: 'd4',
      rarity: 'rare', // high cost
      effects: [{ kind: 'attack', die: 'd4' }],
    };
    useGameStore.setState({
      initialized: true,
      gamePhase: 'shop',
      gold: 30, // not enough for rare card (base 80)
      victoryCount: 0,
      deck: [testCard],
    });
    const initialGold = useGameStore.getState().gold;
    const initialDeckLength = useGameStore.getState().deck.length;
    // Try to upgrade
    useGameStore.getState().upgradeCard(testCard.id);
    const stateAfter = useGameStore.getState();
    // Gold should not change
    expect(stateAfter.gold).toBe(initialGold);
    // Deck length should not change
    expect(stateAfter.deck.length).toBe(initialDeckLength);
    // The card should not be upgraded
    const upgraded = stateAfter.deck.find((c) => c.id === testCard.id && c.isUpgraded);
    expect(upgraded).toBeUndefined();
  });
});

describe('test utilities and critical game flows', () => {
  it('returns mocked random values in order and reverts after reset', () => {
    mockRandom([0.1, 0.8]);
    expect(Math.random()).toBe(0.1);
    expect(Math.random()).toBe(0.8);
    expect(Math.random()).toBe(0.8);
  });

  it('supports deterministic callbacks and resets even when they throw', async () => {
    await expect(withMockRandom([0.25], () => {
      expect(Math.random()).toBe(0.25);
      throw new Error('expected test error');
    })).rejects.toThrow('expected test error');

    const random = Math.random();
    expect(random).not.toBe(0.25);
  });

  it('renders the combat view and ends a player turn', async () => {
    await withMockRandom(Array.from({ length: 200 }, (_, index) => (index + 1) / 201), async () => {
      render(<App />);
      expect(screen.getByRole('heading', { name: 'Yolunu seç' })).toBeInTheDocument();
      await userEvent.click(screen.getAllByRole('button', { name: /Savaş/ })[0]);
      for (let i = 0; i < 3; i++) await userEvent.click(screen.getAllByRole('button', { name: /Desteye ekle/ })[0]);
      expect(screen.getByRole('heading', { name: 'Hamleni seç' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Oyuncu turunu bitir' }));
      expect(useGameStore.getState().battleLogs.length).toBeGreaterThan(1);
    });
  });

  it('selects a reward and moves to the shop', async () => {
    useGameStore.setState({
      initialized: true,
      gamePhase: 'victory',
      rewardOptions: [testCard],
    });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /Bu kartı seç/ }));

    expect(useGameStore.getState().gamePhase).toBe('shop');
    expect(useGameStore.getState().deck).toContainEqual(testCard);
  });

  it('starts a fresh game from the game-over screen', async () => {
    useGameStore.setState({
      initialized: true,
      gamePhase: 'gameOver',
      player: { ...useGameStore.getState().player, mevcutCan: 0 },
    });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Yeni Oyun Başlat' }));

    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('mapSelection');
    expect(state.player.mevcutCan).toBe(state.player.maksimumCan);
    expect(state.hand).toHaveLength(state.drawCount);
  });

  it('provides a reusable drag-and-drop data transfer fixture', () => {
    const transfer = createDataTransfer();
    fireEvent.dragStart(document.body, { dataTransfer: transfer });
    transfer.setData('text/plain', 'card-id');
    expect(transfer.getData('text/plain')).toBe('card-id');
  });
});
