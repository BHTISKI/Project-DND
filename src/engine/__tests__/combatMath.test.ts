// Bu dosya src/engine/__tests__/combatMath.test.ts için ilgili kodları içerir.
// Test: combatMath fonksiyonlarının doğruluğu
// Test: combatMath fonksiyonlarının doğruluğu
// Test: combatMath fonksiyonlarının doğruluğu
import { describe, it, expect } from 'vitest';
import type { AttackResult } from '../combatMath';
import { resolveAttackRoll, calculateDamage } from '../combatMath';

describe('combatMath', () => {
  describe('AttackResult', () => {
    it('should have the correct properties', () => {
      const result: AttackResult = {
        roll: 10,
        hit: true,
        critical: false,
        criticalFail: false,
      };
      
      expect(result).toHaveProperty('roll');
      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('critical');
      expect(result).toHaveProperty('criticalFail');
    });
  });

  describe('resolveAttackRoll', () => {
    it('should return critical hit on natural 20', () => {
      const result = resolveAttackRoll(20, 0, 10);
      expect(result.roll).toBe(20);
      expect(result.critical).toBe(true);
      expect(result.criticalFail).toBe(false);
      expect(result.hit).toBe(true); // Natural 20 always hits
    });

    it('should return critical fail on natural 1', () => {
      const result = resolveAttackRoll(1, 10, 10);
      expect(result.roll).toBe(1);
      expect(result.critical).toBe(false);
      expect(result.criticalFail).toBe(true);
      expect(result.hit).toBe(false); // Natural 1 always misses
    });

    it('should hit when roll + attackBonus >= targetAC', () => {
      const result = resolveAttackRoll(10, 5, 14); // 10 + 5 = 15 >= 14
      expect(result.roll).toBe(10);
      expect(result.critical).toBe(false);
      expect(result.criticalFail).toBe(false);
      expect(result.hit).toBe(true);
    });

    it('should miss when roll + attackBonus < targetAC (and not natural 20)', () => {
      const result = resolveAttackRoll(8, 5, 14); // 8 + 5 = 13 < 14
      expect(result.roll).toBe(8);
      expect(result.critical).toBe(false);
      expect(result.criticalFail).toBe(false);
      expect(result.hit).toBe(false);
    });

    it('should handle edge case where roll + attackBonus equals targetAC - 1', () => {
      const result = resolveAttackRoll(9, 5, 15); // 9 + 5 = 14 < 15
      expect(result.hit).toBe(false);
    });

    it('should handle edge case where roll + attackBonus equals targetAC', () => {
      const result = resolveAttackRoll(10, 5, 15); // 10 + 5 = 15 >= 15
      expect(result.hit).toBe(true);
    });
  });

  describe('calculateDamage', () => {
    it('should return 0 for negative total', () => {
      const result = calculateDamage(1, -5, -3); // 1 + (-5) + (-3) = -7
      expect(result).toBe(0);
    });

    it('should return correct value for positive total', () => {
      const result = calculateDamage(4, 3, 2, 1); // 4 + 3 + 2 + 1 = 10
      expect(result).toBe(10);
    });

    it('should work with zero bonus', () => {
      const result = calculateDamage(5, 4, 3); // 5 + 4 + 3 = 12
      expect(result).toBe(12);
    });

    it('should handle zero die roll', () => {
      // Note: rollDie never returns 0, but we can test the function directly
      const result = calculateDamage(0, 5, 3); // 0 + 5 + 3 = 8
      expect(result).toBe(8);
    });

    it('should handle all zeros', () => {
      const result = calculateDamage(0, 0, 0, 0);
      expect(result).toBe(0);
    });
  });
});
