import { describe, expect, it } from 'vitest';
import { decideEnemyBehavior } from '../enemyBehavior';
import type { Character } from '../../types/game';

const player: Character = {
  id: 'player', isim: 'Ero', mevcutCan: 10, maksimumCan: 10, zirhSinifi: 12, gucCarpani: 2,
  advantageCounter: 0, disadvantageCounter: 0, denge: 0, maksimumDenge: 10, staggered: false,
};

const enemy = (health: number): Character => ({
  id: 'enemy', isim: 'Goblin', mevcutCan: health, maksimumCan: 10, zirhSinifi: 11, gucCarpani: 1,
  advantageCounter: 0, disadvantageCounter: 0, denge: 0, maksimumDenge: 10, staggered: false,
});

describe('EnemyBehavior', () => {
  it('punishes a player who ends with zero block', () => {
    const decision = decideEnemyBehavior({ behavior: 'opportunist', enemy: enemy(10), player, playerBlock: 0, playerStatuses: [], previousIntent: null, lastPlayerSignal: 'no-block', desperationStacks: 0, canLie: false });
    expect(decision.action.kind).toBe('critical-execution');
    expect(decision.action.damage).toBe(10);
    expect(decision.telegraph.label).toBe('Kritik İnfaz');
  });

  it('answers a parry signal with poison instead of an attack', () => {
    const decision = decideEnemyBehavior({ behavior: 'paranoid', enemy: enemy(10), player, playerBlock: 5, playerStatuses: [], previousIntent: null, lastPlayerSignal: 'parry', desperationStacks: 0, canLie: false, random: () => 0 });
    expect(decision.action.kind).toBe('poison');
    expect(decision.telegraph.type).toBe('special');
  });

  it('enters desperation strictly below twenty-five percent', () => {
    const atBoundary = decideEnemyBehavior({ behavior: 'standard', enemy: enemy(2.5), player, playerBlock: 5, playerStatuses: [], previousIntent: null, lastPlayerSignal: 'none', desperationStacks: 0, canLie: false });
    const belowBoundary = decideEnemyBehavior({ behavior: 'standard', enemy: enemy(2), player, playerBlock: 5, playerStatuses: [], previousIntent: null, lastPlayerSignal: 'none', desperationStacks: 0, canLie: false });
    expect(atBoundary.action.kind).toBe('attack');
    expect(belowBoundary.action.kind).toBe('desperation-attack');
    expect(belowBoundary.action.ignoresBlock).toBe(true);
    expect(belowBoundary.nextDesperationStacks).toBe(1);
  });

  it('can lie through the telegraph while resolving a different action', () => {
    const decision = decideEnemyBehavior({ behavior: 'paranoid', enemy: enemy(10), player, playerBlock: 4, playerStatuses: [], previousIntent: null, lastPlayerSignal: 'none', desperationStacks: 0, canLie: true, random: () => 0 });
    expect(decision.telegraph.deceptive).toBe(true);
    expect(decision.telegraph.label).toBe('Saldıracak');
    expect(decision.action.kind).toBe('heal');
  });
});
