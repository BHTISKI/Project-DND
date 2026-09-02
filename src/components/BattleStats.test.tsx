// Bu dosya src/components/BattleStats.test.tsx için ilgili kodları içerir.
// BattleStats bileşeni testleri: render ve kullanıcı etkileşimleri
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BattleStats } from './BattleStats';
import { useGameStore } from '../state/store';
import { setupMockRandom, resetMockRandom } from '../testUtils';
import { cleanup } from '@testing-library/react';
import type { EnemyIntent} from '../types/game';

describe('BattleStats', () => {
  const basePlayer = { id: 'player', isim: 'Ero', mevcutCan: 10, maksimumCan: 10, zirhSinifi: 12, gucCarpani: 2, advantageCounter: 0, disadvantageCounter: 0 };
  const baseEnemy = { id: 'enemy', isim: 'Goblin', mevcutCan: 10, maksimumCan: 10, zirhSinifi: 11, gucCarpani: 1, advantageCounter: 0, disadvantageCounter: 0 };

  beforeEach(() => {
    useGameStore.setState({
      initialized: true,
      gamePhase: 'combat',
      isPlayerTurn: true,
      player: { ...basePlayer },
      enemy: { ...baseEnemy },
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
    });
    setupMockRandom([0]);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    resetMockRandom();
    vi.restoreAllMocks();
  });

  it('displays player and enemy info correctly', () => {
    render(<BattleStats />);
    // player
    expect(screen.getByText(/Oyuncu/i)).toBeInTheDocument();
    expect(screen.getByText(/Ero/i)).toBeInTheDocument();
    screen.debug();
    // Use more specific selectors to avoid extra DOM elements
    const playerHealthRow = screen.getByText(/Oyuncu/i).closest('.fighter--player')!.querySelector('.health-row');
    expect(playerHealthRow).toHaveTextContent(/Can.*10.*10/i);
    const playerStats = screen.getByText(/Oyuncu/i).closest('.fighter--player')!.querySelector('.fighter-stats');
    expect(playerStats).toHaveTextContent(/\+2\s*GÜÇ/i);
    expect(playerStats).toHaveTextContent(/0\s*BLOK/i);
    expect(playerStats).not.toHaveTextContent(/AC/i);
    // enemy
    expect(screen.getByText(/Goblin/i)).toBeInTheDocument();
    // Use more specific selectors to avoid extra DOM elements
    const enemyHealthRow = screen.getByText(/Goblin/i).closest('.fighter--enemy')!.querySelector('.health-row');
    expect(enemyHealthRow).toHaveTextContent(/Can.*10.*10/i);
    const enemyStats = screen.getByText(/Goblin/i).closest('.fighter--enemy')!.querySelector('.fighter-stats');
    expect(enemyStats).toHaveTextContent(/\+1\s*GÜÇ/i);
    expect(enemyStats).toHaveTextContent(/0\s*BLOK/i);
    expect(enemyStats).not.toHaveTextContent(/AC/i);
    // energy
    expect(screen.getByLabelText(/3 \/ 3 enerji/i)).toBeInTheDocument();
    // sr-only text
    expect(screen.getByText(/Altın: 50\. Deste: 0, El: 0, Mezarlık: 0/i)).toBeInTheDocument();
  });

  it('shows low health warning when HP <= 30%', async () => {
    render(<BattleStats />);
    // set player HP to 3 (30% of 10)
    useGameStore.setState({ ...useGameStore.getState(), player: { ...basePlayer, mevcutCan: 3 } });
    await Promise.resolve();
    screen.debug();
    const playerLabel = screen.getByText(/Oyuncu/i);
    const healthRow = playerLabel.parentElement!.querySelector('.health-row')!;
    const strong = healthRow.querySelector('strong')!;
    const text = strong.textContent.trim();
    expect(text).toMatch(/3\s*\/\s*10/i);
    const playerArticle = screen.getByText(/Oyuncu/i).closest('.fighter--player');
    expect(playerArticle).toHaveClass('fighter--low-health');

    // set enemy HP to 3
    useGameStore.setState({ ...useGameStore.getState(), enemy: { ...baseEnemy, mevcutCan: 3 } });
    await Promise.resolve();
    const enemyArticle = screen.getByText(/Goblin/i).closest('.fighter--enemy');
    expect(enemyArticle).toHaveClass('fighter--low-health');
  });

  it('displays block values when set', () => {
    useGameStore.setState({ ...useGameStore.getState(), playerBlock: 5, enemyBlock: 3 });
    const { container } = render(<BattleStats />);
    const blockValueSpans = Array.from(container.getElementsByClassName('block-value'));
    expect(blockValueSpans[0]).toHaveTextContent(/5BLOK/i);
    expect(blockValueSpans[1]).toHaveTextContent(/3BLOK/i);
  });

  it('displays player status effects', () => {
    const poisonedStatus = { id: 'poisoned' as const, stacks: 2, duration: 3 };
    const weakenedStatus = { id: 'weakened' as const, stacks: 1, duration: 2 };
    useGameStore.setState({ ...useGameStore.getState(), playerStatuses: [poisonedStatus, weakenedStatus] });
    render(<BattleStats />);
    expect(screen.getByText(/Zehirli · 2 stack · 3 tur/i)).toBeInTheDocument();
    expect(screen.getByText(/Güçsüz · 1 stack · 2 tur/i)).toBeInTheDocument();
  });

  it('displays enemy status effects', () => {
    const vulnerableStatus = { id: 'vulnerable' as const, stacks: 1, duration: 2 };
    useGameStore.setState({ ...useGameStore.getState(), enemyStatuses: [vulnerableStatus] });
    render(<BattleStats />);
    expect(screen.getByText(/Savunmasız · 1 stack · 2 tur/i)).toBeInTheDocument();
  });

  it('displays enemy intent attack', () => {
    const attackIntent: EnemyIntent = { type: 'attack', estimatedDamage: 5 };
    useGameStore.setState({ ...useGameStore.getState(), enemyIntent: attackIntent, enemyIntentValue: 5 });
    render(<BattleStats />);
    expect(screen.getByText(/Saldıracak/i)).toBeInTheDocument();
    expect(screen.getByText(/5 tahmini hasar/i)).toBeInTheDocument();
    expect(screen.getByText(/⚔/i)).toBeInTheDocument(); // attack icon
  });

  it('displays enemy intent defend', () => {
    const defendIntent: EnemyIntent = { type: 'defend', estimatedBlock: 4 };
    useGameStore.setState({ ...useGameStore.getState(), enemyIntent: defendIntent, enemyIntentValue: 4 });
    render(<BattleStats />);
    expect(screen.getByText(/Savunacak/i)).toBeInTheDocument();
    expect(screen.getByText(/4 blok/i)).toBeInTheDocument();
    expect(screen.getByText(/◈/i)).toBeInTheDocument(); // defend icon
  });

  it('displays enemy intent special (heal)', () => {
    const specialIntent: EnemyIntent = { type: 'special', estimatedHeal: 3 };
    useGameStore.setState({ ...useGameStore.getState(), enemyIntent: specialIntent, enemyIntentValue: 3 });
    render(<BattleStats />);
    expect(screen.getByText(/Özel hamle/i)).toBeInTheDocument();
    expect(screen.getByText(/3 tahmini iyileşme/i)).toBeInTheDocument();
    expect(screen.getByText(/✦/i)).toBeInTheDocument(); // special icon
  });

  it('handles enemy intent with block from enemyBlock value when defend', () => {
    // when intent is defend, the displayed value uses enemyBlock from state if estimatedBlock is not set?
    // Looking at the code: line 45: displayedIntentValue = valueText || (intentIsDefend && enemyBlock > 0 ? `${enemyBlock} blok` : ...)
    // So if enemyIntent has estimatedBlock, valueText will be set and used. Otherwise, it falls back to enemyBlock.
    // Let's test without estimatedBlock in the intent.
    const defendIntentNoValue: EnemyIntent = { type: 'defend' }; // no estimatedBlock
    useGameStore.setState({ ...useGameStore.getState(), enemyIntent: defendIntentNoValue, enemyIntentValue: 0, enemyBlock: 6 });
    render(<BattleStats />);
    expect(screen.getByText(/Savunacak/i)).toBeInTheDocument();
    expect(screen.getByText(/6 blok/i)).toBeInTheDocument(); // from enemyBlock state
  });

  it('does not display enemy intent value when none', () => {
    useGameStore.setState({ ...useGameStore.getState(), enemyIntent: null, enemyIntentValue: 0 });
    render(<BattleStats />);
    // should show "Hamle bekleniyor" and no value in the enemy intent area
    expect(screen.getByText(/Hamle bekleniyor/i)).toBeInTheDocument();
    const enemyIntentDiv = screen.getByText(/Hamle bekleniyor/i).closest('.enemy-intent');
    expect(enemyIntentDiv).not.toHaveTextContent(/tahmini hasar/i);
    expect(enemyIntentDiv).not.toHaveTextContent(/blok/i);
    expect(enemyIntentDiv).not.toHaveTextContent(/tahmini iyileşme/i);
  });
});
