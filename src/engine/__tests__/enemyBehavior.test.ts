import { describe, expect, it } from 'vitest';
import { decideEnemyBehavior } from '../enemyBehavior';
import type { Character } from '../../types/game';
import { initialPosture } from '../../mechanics/posture';

const player: Character = {
  id: 'player', isim: 'Ero', mevcutCan: 10, maksimumCan: 10, hasarBonusu: 2, ...initialPosture(),
};

const enemy = (health: number): Character => ({
  id: 'enemy', isim: 'Goblin', mevcutCan: health, maksimumCan: 10, hasarBonusu: 1, ...initialPosture('goblin'),
});

const context = (overrides: Partial<Parameters<typeof decideEnemyBehavior>[0]> = {}) => ({
  behavior: 'standard' as const, archetype: 'goblin' as const, enemy: enemy(10), player,
  playerBlock: 0, enemyBlock: 0, playerStatuses: [], previousIntent: null,
  lastPlayerSignal: 'none' as const, desperationStacks: 0, canLie: false, ...overrides,
});

describe('EnemyBehavior', () => {
  it('punishes a player who ends with zero block', () => {
    const decision = decideEnemyBehavior(context({ behavior: 'opportunist', lastPlayerSignal: 'no-block' }));
    expect(decision.action.kind).toBe('execution');
    expect(decision.action.damage).toBe(6);
    expect(decision.telegraph.label).toBe('Fırsat saldırısı');
  });

  it('answers a parry signal with poison instead of an attack', () => {
    const decision = decideEnemyBehavior(context({ behavior: 'paranoid', playerBlock: 5, lastPlayerSignal: 'parry', random: () => 0 }));
    expect(decision.action.kind).toBe('poison');
    expect(decision.telegraph.type).toBe('special');
  });

  it('enters desperation strictly below twenty-five percent', () => {
    const atBoundary = decideEnemyBehavior(context({ enemy: enemy(2.5), playerBlock: 5 }));
    const belowBoundary = decideEnemyBehavior(context({ enemy: enemy(2), playerBlock: 5 }));
    expect(atBoundary.action.kind).toBe('attack');
    expect(belowBoundary.action.kind).toBe('desperation-attack');
    expect(belowBoundary.action.ignoresBlock).toBe(true);
    expect(belowBoundary.nextDesperationStacks).toBe(1);
  });

  it('can lie through the telegraph while resolving a different action', () => {
    const decision = decideEnemyBehavior(context({ behavior: 'paranoid', playerBlock: 4, canLie: true, random: () => 0 }));
    expect(decision.telegraph.deceptive).toBe(true);
    expect(decision.telegraph.label).toBe('Saldıracak');
    expect(decision.action.kind).toBe('heal');
  });

  it('prioritizes a real Execute when the player posture is Broken', () => {
    const brokenPlayer = { ...player, currentPosture: player.maxPosture, isBroken: true };
    const decision = decideEnemyBehavior(context({ player: brokenPlayer,
      previousIntent: { type: 'defend', action: { kind: 'defend', block: 4 } } }));
    expect(decision.action.kind).toBe('execution');
    expect(decision.telegraph.label).toContain('İnfaz');
    expect(decision.reason).toContain('kırıldığı');
  });

  it('protects posture that is close to breaking', () => {
    const threatened = { ...enemy(10), currentPosture: 56 };
    const decision = decideEnemyBehavior(context({ enemy: threatened }));
    expect(decision.action).toMatchObject({ kind: 'defend', block: 2 });
    expect(decision.telegraph.label).toBe('Dengesini koruyacak');
  });

  it('lets defensive archetypes heal when their health is low', () => {
    const guardian = { ...enemy(4), isim: 'Muhafız', ...initialPosture('guardian') };
    const decision = decideEnemyBehavior(context({ archetype: 'guardian', enemy: guardian }));
    expect(decision.action.kind).toBe('heal');
    expect(decision.reason).toContain('Canı azaldığı');
  });

  it('uses ranged magic instead of attacking into enough block', () => {
    const mage = { ...enemy(10), isim: 'Büyücü', hasarBonusu: 2, ...initialPosture('mage') };
    const decision = decideEnemyBehavior(context({ behavior: 'paranoid', archetype: 'mage', enemy: mage, playerBlock: 5 }));
    expect(decision.action).toMatchObject({ kind: 'magic', isRanged: true });
    expect(decision.reason).toContain('Bloğuna karşı');
  });
});
