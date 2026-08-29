// Bu dosya src/engine/__tests__/createEnemy.test.ts için ilgili kodları içerir.
// Test: createEnemy fonksiyonunun farklı tierlar için çıktı kontrolü
// Test: createEnemy fonksiyonunun farklı tierlar için çıktı kontrolü
// Test: createEnemy fonksiyonunun farklı tierlar için çıktı kontrolü
import { describe, it, expect } from 'vitest';
import { createEnemy } from '../combatResolver';

describe('createEnemy', () => {
  it('should return correct stats for mage tier 2', () => {
    const enemy = createEnemy('mage', 2);
    // console.log(enemy);
    expect(enemy).toEqual({
      id: 'enemy-2',
      isim: 'Büyücü',
      mevcutCan: 12, // hp: 8 + 2*2 = 12
      maksimumCan: 12,
      zirhSinifi: 11, // ac: 10 + floor(2/2)=1 => 11
      gucCarpani: 2, // power: 2 + floor(2/3)=0 => 2
      advantageCounter: 0,
      disadvantageCounter: 0,
    });
  });
});