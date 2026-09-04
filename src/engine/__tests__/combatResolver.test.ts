import { describe, expect, it } from 'vitest';
import { resolveCard } from '../combatResolver';
import { chooseArchetype, createEnemy, generateEnemyIntent } from '../enemyArchetypes';
import { withMockRandom } from '../../testUtils/mockRandom';
import { makeCard, makeGameState, makePlayer } from '../../testUtils/gameState';

describe('combatResolver', () => {
  it('cycles enemy archetypes deterministically', () => {
    expect(chooseArchetype(0)).toBe('goblin');
    expect(chooseArchetype(1)).toBe('guardian');
    expect(chooseArchetype(2)).toBe('mage');
    expect(chooseArchetype(3)).toBe('goblin');
  });

  it('introduces the assassin and knight after the starter rotation', () => {
    expect(chooseArchetype(5)).toBe('assassin');
    expect(chooseArchetype(6)).toBe('knight');
    expect(createEnemy('assassin', 1).isim).toBe('Gölge Suikastçısı');
    expect(createEnemy('knight', 1).isim).toBe('Kara Şövalye');
  });

  it('creates a scaled enemy', () => {
    const enemy = createEnemy('guardian', 3);

    expect(enemy.mevcutCan).toBe(20);
    expect(enemy.maksimumCan).toBe(20);
    expect(enemy.hasarBonusu).toBe(1);
  });

  it('generates a deterministic goblin attack intent', async () => {
    await withMockRandom([0], () => {
      const enemy = createEnemy('goblin', 0);
      const result = generateEnemyIntent(enemy, 'goblin');

      expect(result.intent.type).toBe('attack');
      expect(result.value).toBe(5);
      expect(result.block).toBe(0);
    });
  });

  it('generates deterministic defend block', async () => {
    await withMockRandom([0.7, 0.99], () => {
      const enemy = createEnemy('goblin', 0);
      const result = generateEnemyIntent(enemy, 'goblin');

      expect(result.intent.type).toBe('defend');
      expect(result.block).toBe(2);
    });
  });

  it('adds fixed card damage inputs through the resolver', () => {
    const card = {
      ...makeCard('fixed damage', 'fixed'),
      tip: 'saldırı' as const,
      baseHasar: 3,
      effects: [{ kind: 'damage' as const, amount: 4, damageBonus: 1 }],
    };
    const state = makeGameState({
      gamePhase: 'combat',
      player: makePlayer({ hasarBonusu: 2 }),
      enemy: makePlayer({ id: 'enemy', mevcutCan: 100, maksimumCan: 100 }),
      hand: [card],
      enemyIntent: { type: 'defend', action: { kind: 'pass' } },
    });

    expect(resolveCard(state, card.id).enemy.mevcutCan).toBe(90);
  });

  it('clamps a negative damage total to zero through the resolver', () => {
    const card = {
      ...makeCard('negative damage', 'negative'),
      tip: 'saldırı' as const,
      baseHasar: -5,
      effects: [{ kind: 'damage' as const, amount: 1 }],
    };
    const enemy = makePlayer({ id: 'enemy', mevcutCan: 100, maksimumCan: 100 });
    const state = makeGameState({
      gamePhase: 'combat',
      player: makePlayer({ hasarBonusu: -3 }),
      enemy,
      hand: [card],
      enemyIntent: { type: 'defend', action: { kind: 'pass' } },
    });

    const next = resolveCard(state, card.id);
    expect(next.enemy.mevcutCan).toBe(enemy.mevcutCan);
    expect(next.battleLogs.at(-1)).toContain('0 hasar');
  });
});
