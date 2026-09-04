// Bu dosya src/components/CombatControls.test.tsx için ilgili kodları içerir.
// CombatControls bileşeni testleri: render ve kullanıcı etkileşimleri
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatControls } from './CombatControls';
import { useGameStore } from '../state/store';
import { setupMockRandom, resetMockRandom } from '../testUtils';
import { cleanup } from '@testing-library/react';
import { initialPosture } from '../mechanics/posture';

describe('CombatControls', () => {
  beforeEach(() => {
    useGameStore.setState({
      initialized: true,
      gamePhase: 'combat',
      isPlayerTurn: true,
      player: { id: 'player', isim: 'Ero', mevcutCan: 10, maksimumCan: 10, hasarBonusu: 2, ...initialPosture() },
      enemy: { id: 'enemy', isim: 'Goblin', mevcutCan: 10, maksimumCan: 10, hasarBonusu: 1, ...initialPosture('goblin') },
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
      enemyIntent: { type: 'attack', estimatedDamage: 0 },
      enemyIntentValue: 0,
      enemyArchetype: 'goblin',
      playerStatuses: [],
      enemyStatuses: [],
      comboChain: [],
      comboCount: 0,
      nextDamageBonus: 0,
    });
    setupMockRandom([0]);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    resetMockRandom();
    vi.restoreAllMocks();
  });

  it('renders the end turn button with correct label and aria-label', () => {
    render(<CombatControls />);
    const button = screen.getByRole('button', { name: /Oyuncu turunu bitir/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText(/Turu Bitir/i)).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Oyuncu turunu bitir');
  });

  it('calls endTurn from store when button is clicked', async () => {
    const endTurnSpy = vi.spyOn(useGameStore.getState(), 'endTurn');
    render(<CombatControls />);

    const button = screen.getByRole('button', { name: /Oyuncu turunu bitir/i });
    await userEvent.click(button);
    expect(endTurnSpy).toHaveBeenCalledTimes(1);
  });

  it('button is enabled', () => {
    render(<CombatControls />);
    const button = screen.getByRole('button', { name: /Oyuncu turunu bitir/i });
    expect(button).not.toBeDisabled();
  });
});
