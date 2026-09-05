import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EnemyBoard } from './EnemyBoard';
import { useGameStore } from '../state/store';
import { initialPosture } from '../mechanics/posture';
import { refreshEnemyIntent } from '../engine/combatResolver';

describe('EnemyBoard', () => {
  afterEach(() => cleanup());

  it('shows the actual Execute damage and lethal block-ignoring warning', () => {
    const initial = useGameStore.getInitialState();
    useGameStore.setState(refreshEnemyIntent({ ...initial, gamePhase: 'combat',
      player: { ...initial.player, mevcutCan: 6, currentPosture: 100, isBroken: true },
      enemyBehavior: 'standard', enemyCanLie: false,
      baseEnemyIntent: { type: 'attack', action: { kind: 'attack', damage: 4 } },
    }));
    render(<EnemyBoard />);
    expect(screen.getByText('İnfaz saldırısı')).toBeInTheDocument();
    expect(screen.getByText('10 hasar')).toBeInTheDocument();
    expect(screen.getByText('Blok işlemez')).toBeInTheDocument();
    expect(screen.getByText('İnfaz bloklanamaz ve ölümcül.')).toBeInTheDocument();
  });

  it('shows the enemy deck and only the public telegraph', () => {
    useGameStore.setState({
      gamePhase: 'combat',
      enemy: { id: 'enemy-1', isim: 'Gölge Suikastçısı', mevcutCan: 8, maksimumCan: 8, hasarBonusu: 2, ...initialPosture('assassin') },
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
