// Bu dosya src/engine/__tests__/dice.test.ts için ilgili kodları içerir.
// Test: rollDie ve averageDie istatiksel dağılımı
// Test: rollDie ve averageDie istatiksel dağılımı
// Test: rollDie ve averageDie istatiksel dağılımı
import { describe, it, expect, vi } from 'vitest';
import { rollDie } from '../dice';

describe('dice', () => {
  describe('rollDie', () => {
    it('should throw error for invalid sides (< 1)', () => {
      expect(() => rollDie(0)).toThrow('Invalid die sides: 0');
      expect(() => rollDie(-1)).toThrow('Invalid die sides: -1');
    });

    it('should throw error for invalid sides (non-integer)', () => {
      expect(() => rollDie(1.5)).toThrow('Invalid die sides: 1.5');
      expect(() => rollDie(Math.PI)).toThrow(`Invalid die sides: ${Math.PI}`);
    });

    it('should return values in correct range for d4', () => {
      const rolls = Array.from({ length: 1000 }, () => rollDie(4));
      rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(4);
      });
    });

    it('should return values in correct range for d6', () => {
      const rolls = Array.from({ length: 1000 }, () => rollDie(6));
      rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      });
    });

    it('should return values in correct range for d20', () => {
      const rolls = Array.from({ length: 1000 }, () => rollDie(20));
      rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(20);
      });
    });

    it('should use custom RNG when provided', () => {
      const mockRng = vi.fn().mockReturnValue(0.5); // Always returns 0.5
      const result = rollDie(6, mockRng);
      // floor(0.5 * 6) + 1 = floor(3) + 1 = 3 + 1 = 4
      expect(result).toBe(4);
      expect(mockRng).toHaveBeenCalledTimes(1);
    });

    it('should produce different values with different RNG values', () => {
      const rng1 = vi.fn().mockReturnValue(0.0); // Minimum
      const rng2 = vi.fn().mockReturnValue(0.9999); // Near maximum
      
      const result1 = rollDie(6, rng1);
      const result2 = rollDie(6, rng2);
      
      // floor(0.0 * 6) + 1 = 0 + 1 = 1
      // floor(0.9999 * 6) + 1 = floor(5.9994) + 1 = 5 + 1 = 6
      expect(result1).toBe(1);
      expect(result2).toBe(6);
    });
  });
});
