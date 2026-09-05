// Bu dosya src/App.test.tsx için ilgili kodları içerir.
// App bileşeni testleri: render ve kullanıcı etkileşimleri
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useGameStore } from './state/store';
import { setupMockRandom, resetMockRandom } from './testUtils';
import { cleanup } from '@testing-library/react';
import { initialPosture } from './mechanics/posture';

describe('App', () => {
  beforeEach(() => {
    // Reset store to initial state (not initialized)
    useGameStore.setState({
      ...useGameStore.getInitialState(),
      playerName: 'Ero',
      initialized: false,
      gamePhase: 'mapSelection', // will be overwritten by initializeGame, but we set a default
      player: { id: 'player', isim: 'Ero', mevcutCan: 10, maksimumCan: 10, hasarBonusu: 2, ...initialPosture() },
      enemy: { id: 'enemy', isim: 'Goblin', mevcutCan: 10, maksimumCan: 10, hasarBonusu: 1, ...initialPosture('goblin') },
      isPlayerTurn: true,
      maxEnergy: 3,
      currentEnergy: 3,
      deck: [],
      hand: [],
      discardPile: [],
      drawCount: 5,
      gold: 50,
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
      // runFloor, currentNode, availableNodes, nodeType, metaGold, metaVictories will be set by initializeGame
    });
    vi.restoreAllMocks();
    setupMockRandom([0]);
  });

  afterEach(() => {
    cleanup();
    resetMockRandom();
    vi.restoreAllMocks();
  });

  it('renders initial mapSelection phase after initializeGame', async () => {
    render(<App />);
    // wait for initializeGame to run (useEffect)
    await screen.findByText(/Bölüm 1/i);
    expect(screen.getByText(/Kader Günlüğü/i)).toBeInTheDocument();
    expect(screen.getByText(/Makara/i)).toBeInTheDocument();
    // "Destek hazırlanıyor..." log entry
    expect(screen.getByText(/Deste hazırlandı/i, { selector: '.log-drawer__body *' })).toBeInTheDocument();
    // map selection buttons should be visible
    const combatButtons = screen.getAllByRole('button', { name: /Savaş/i });
    expect(combatButtons.length).toBeGreaterThan(0);
    expect(combatButtons[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dükkan/i })).toBeInTheDocument();
    // combat board should not be visible yet
    expect(screen.queryByLabelText(/Savaş alanı/i)).not.toBeInTheDocument();
  });

  it('transitions to combat when a combat node is selected', async () => {
    render(<App />);
    await screen.findByText(/Bölüm 1/i);
    // select the first combat node button
    const combatButtons = screen.getAllByRole('button', { name: /Savaş/i });
    expect(combatButtons.length).toBeGreaterThan(0);
    const combatNode = combatButtons[0];
    await userEvent.click(combatNode);
    expect(screen.getByText(/Desteni kur/i)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: /Desteye ekle/i })[0]);
    await userEvent.click(screen.getAllByRole('button', { name: /Desteye ekle/i })[0]);
    await userEvent.click(screen.getAllByRole('button', { name: /Desteye ekle/i })[0]);
    expect(screen.getByText(/Hamleni seç/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Savaş alanı/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Oyuncu turunu bitir/i })).toBeInTheDocument();
  });

  it.each([
    { point: { x: 200, y: 150 }, played: true, location: 'inside the battlefield' },
    { point: { x: 700, y: 350 }, played: false, location: 'outside the battlefield' },
  ])('plays a dragged card only when released $location', async ({ point, played }) => {
    useGameStore.setState({
      initialized: true, gamePhase: 'combat',
      enemy: { ...useGameStore.getState().enemy, mevcutCan: 100, maksimumCan: 100 },
      hand: [{ id: 'drag-card', isim: 'Masa Kartı', tip: 'saldırı', manaBedeli: 1, baseHasar: 1, effects: [{ kind: 'attack', amount: 1 }] }],
    });
    render(<App />);
    const battlefield = screen.getByLabelText('Savaş alanı');
    vi.spyOn(battlefield, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 500, 200));
    const button = screen.getByRole('button', { name: /Masa Kartı oynanabilir/ });
    fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 350 }));
    fireEvent(window, new MouseEvent('pointermove', { clientX: point.x, clientY: point.y }));
    await screen.findByText('Kartı buraya bırak');
    fireEvent(window, new MouseEvent('pointerup', { clientX: point.x, clientY: point.y }));
    await waitFor(() => expect(screen.queryByText('Kartı buraya bırak')).not.toBeInTheDocument());
    expect(useGameStore.getState().hand).toHaveLength(played ? 0 : 1);
    expect(useGameStore.getState().currentEnergy).toBe(played ? 2 : 3);
  });

  it('transitions to next map after defeating enemy in combat', async () => {
    render(<App />);
    await screen.findByText(/Bölüm 1/i);
    // select combat node
    const combatButtons = screen.getAllByRole('button', { name: /Savaş/i });
    expect(combatButtons.length).toBeGreaterThan(0);
    const combatNode = combatButtons[0];
    await userEvent.click(combatNode);
    await userEvent.click(screen.getAllByRole('button', { name: /Desteye ekle/i })[0]);
    await userEvent.click(screen.getAllByRole('button', { name: /Desteye ekle/i })[0]);
    await userEvent.click(screen.getAllByRole('button', { name: /Desteye ekle/i })[0]);
    // now in combat, we need to have a card that can kill the enemy
    // Set up state for guaranteed victory
    setupMockRandom([0.9]); // deterministic combat setup
    // Set state for guaranteed victory
    useGameStore.setState({
      initialized: true,
      gamePhase: 'combat',
      isPlayerTurn: true,
      player: { ...useGameStore.getState().player, mevcutCan: 10 },
      enemy: { ...useGameStore.getState().enemy, mevcutCan: 1 }, // enemy low HP
      maxEnergy: 3,
      currentEnergy: 3,
      deck: [],
      hand: [{ id: 'card-1', isim: 'Test Kartı', tip: 'saldırı', manaBedeli: 1, baseHasar: 100,  effects: [{ kind: 'attack', amount: 3 }] }],
      discardPile: [],
      drawCount: 5,
      gold: 50,
      battleLogs: [],
      rewardOptions: [],
      playerBlock: 0,
      enemyBlock: 0,
      enemySkipNextTurn: false,
      victoryCount: 0,
      enemyIntent: { type: 'attack', estimatedDamage: 0 },
      enemyIntentValue: 0,
      enemyArchetype: 'goblin',
      playerStatuses: [],
      enemyStatuses: [],
      comboChain: [],
      comboCount: 0,
      nextDamageBonus: 0,
      // other fields from initializeGame
      runFloor: 0,
      currentNode: null,
      availableNodes: [],
      nodeType: null,
      metaGold: 0,
      metaVictories: 0,
    });
    // Wait for combat title to update (store update)
    await screen.findByText(/Hamleni seç/i);
    // play the card
    const cardButton = screen.getByRole('button', { name: /Test Kartı oynanabilir/i });
    await userEvent.click(cardButton);
    // after playing card, enemy should be dead, and we should go to mapSelection of next floor
    await screen.findByText(/Bölüm 2/i);
    // see that reward options are ready note
    expect(screen.getByText(/Zafer ödülün hazır/i)).toBeInTheDocument();
    // combat panel should not be visible
    expect(screen.queryByLabelText(/Salah alanı/i)).not.toBeInTheDocument();
    // skip reward button should be visible (since we have rewards)
    expect(screen.getByRole('button', { name: /Ödülü pas geç/i })).toBeInTheDocument();
  });

  it('restarts the game from gameOver', async () => {
    // Set up gameOver state
    useGameStore.setState({
      initialized: true,
      gamePhase: 'gameOver',
      player: { ...useGameStore.getState().player, mevcutCan: 0 },
      enemy: { ...useGameStore.getState().enemy, mevcutCan: 10 },
      isPlayerTurn: true,
      maxEnergy: 3,
      currentEnergy: 0,
      deck: [],
      hand: [{ id: 'card-1', isim: 'Test Kartı', tip: 'saldırı', manaBedeli: 1, baseHasar: 0,  effects: [{ kind: 'attack', amount: 3 }] }],
      discardPile: [],
      drawCount: 5,
      gold: 30,
      battleLogs: ['Oyun bitti.'],
      rewardOptions: [],
      playerBlock: 0,
      enemyBlock: 0,
      enemySkipNextTurn: false,
      victoryCount: 5,
      enemyIntent: { type: 'attack', estimatedDamage: 0 },
      enemyIntentValue: 0,
      enemyArchetype: 'goblin',
      playerStatuses: [],
      enemyStatuses: [],
      comboChain: [],
      comboCount: 0,
      nextDamageBonus: 0,
      runFloor: 0,
      currentNode: null,
      availableNodes: [],
      nodeType: null,
      metaGold: 0,
      metaVictories: 0,
    });
    render(<App />);
    // should see gameOver screen
        const gameOverHeading = await screen.findByRole('heading', { level: 2, name: /Oyun Bitti/i });
    expect(gameOverHeading).toBeInTheDocument();
    expect(screen.getByText(/Yeni Oyun Başlat/i)).toBeInTheDocument();
    // click restart button
        const restartButton = await screen.findByRole('button', { name: /Yeni Oyun Başlat/i });
    await userEvent.click(restartButton);
    // after restart, should go back to mapSelection with initialized true
    await screen.findByText(/Bölüm 1/i);
    expect(screen.getByText(/Kader Günlüğü/i)).toBeInTheDocument();
    expect(screen.getByText(/Deste hazırlandı/i, { selector: '.log-drawer__body *' })).toBeInTheDocument();
    // victory count should be reset to 0 (because initializeGame resets it)
    expect(useGameStore.getState().victoryCount).toBe(0);
    // gold should be reset to 50
    expect(useGameStore.getState().gold).toBe(50);
  });
});
