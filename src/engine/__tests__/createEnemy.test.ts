import { describe, expect, it } from 'vitest';
import { createEnemy } from '../enemyArchetypes';
import { initialPosture } from '../../mechanics/posture';

describe('createEnemy', () => {
  it('scales a mage at tier 2', () => {
    expect(createEnemy('mage', 2)).toEqual({
      id: 'enemy-2',
      isim: 'Büyücü',
      mevcutCan: 12,
      maksimumCan: 12,
      hasarBonusu: 2,
      ...initialPosture('mage'),
    });
  });
});
