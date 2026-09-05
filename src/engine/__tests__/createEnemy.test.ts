import { describe, expect, it } from 'vitest';
import { createEnemy } from '../enemyArchetypes';
import { initialPosture } from '../../mechanics/posture';

describe('createEnemy', () => {
  it('scales a mage at tier 2', () => {
    expect(createEnemy('mage', 2)).toEqual({
      id: 'enemy-2',
      isim: 'Büyücü',
      mevcutCan: 24,
      maksimumCan: 24,
      hasarBonusu: 2,
      ...initialPosture('mage'),
    });
  });

  it('scales elite and boss health without changing the posture source', () => {
    expect(createEnemy('goblin', 0, 'elite')).toMatchObject({
      mevcutCan: 23, maksimumCan: 23, hasarBonusu: 2, ...initialPosture('goblin', 'elite'),
    });
    expect(createEnemy('goblin', 0, 'boss')).toMatchObject({
      mevcutCan: 38, maksimumCan: 38, hasarBonusu: 2, ...initialPosture('goblin', 'boss'),
    });
  });
});
