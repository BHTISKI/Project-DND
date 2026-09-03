import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EnemyBoard } from './EnemyBoard';
import { useGameStore } from '../state/store';

describe('EnemyBoard', () => {
  afterEach(() => cleanup());

  it('shows the enemy deck and only the public telegraph', () => {
    useGameStore.setState({
      gamePhase: 'combat',
      enemy: { id: 'enemy-1', isim: 'Gölge Suikastçısı', mevcutCan: 8, maksimumCan: 8, zirhSinifi: 12, gucCarpani: 2, advantageCounter: 0, disadvantageCounter: 0 },
      enemyArchetype: 'assassin',
      enemyIntent: { type: 'attack', estimatedDamage: 7, effectKey: 'secret-action', telegraph: { type: 'attack', label: 'Saldıracak', icon: '⚔', deceptive: true } },
    });

    render(<EnemyBoard />);

    expect(screen.getByLabelText('Gölge Suikastçısı kapalı destesi')).toBeInTheDocument();
    expect(screen.getByText('Gölge Suikastçısı')).toBeInTheDocument();
    expect(screen.getByText('Saldıracak')).toBeInTheDocument();
    expect(screen.getByText('Niyet belirsiz')).toBeInTheDocument();
    expect(screen.queryByText('secret-action')).not.toBeInTheDocument();
  });
});