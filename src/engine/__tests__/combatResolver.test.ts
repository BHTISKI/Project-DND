// Bu dosya src/engine/__tests__/combatResolver.test.ts için ilgili kodları içerir.
// Test: combatResolver niyet ve hasar hesapları
// Test: combatResolver niyet ve hasar hesaplar
// Test: combatResolver niyet ve hasar hesaplar
import { describe, expect, it } from 'vitest';
import {
  chooseArchetype,
  createEnemy,
  generateEnemyIntent,
} from '../combatResolver';
import { withMockRandom } from '../../testUtils/mockRandom';

describe('combatResolver', () => {
  it('cycles enemy archetypes deterministically', () => {
    expect(chooseArchetype(0)).toBe('goblin');
    expect(chooseArchetype(1)).toBe('guardian');
    expect(chooseArchetype(2)).toBe('mage');
    expect(chooseArchetype(3)).toBe('goblin');
  });

  it('creates a scaled enemy', () => {
    const enemy = createEnemy('guardian', 3);

    expect(enemy.mevcutCan).toBe(20);
    expect(enemy.maksimumCan).toBe(20);
    expect(enemy.zirhSinifi).toBe(14);
    expect(enemy.gucCarpani).toBe(1);
  });

  it('generates a deterministic goblin attack intent', async () => {
    await withMockRandom([0], () => {
      const enemy = createEnemy('goblin', 0);
      const result = generateEnemyIntent(enemy, 'goblin');

      expect(result.intent.type).toBe('attack');
      expect(result.value).toBe(4.5);
      expect(result.block).toBe(0);
    });
  });

  it('generates deterministic defend block', async () => {
    await withMockRandom([0.7, 0.99], () => {
      const enemy = createEnemy('goblin', 0);
      const result = generateEnemyIntent(enemy, 'goblin');

      expect(result.intent.type).toBe('defend');
      expect(result.block).toBe(4);
    });
  });
});