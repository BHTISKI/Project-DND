import { describe, expect, it } from 'vitest';
import { funScore } from '../funMetrics';

describe('design rubric (not measured player enjoyment)', () => {
  it('scores missing evidence as zero', () => { expect(funScore()).toBe(0); });
  it('weights explicit ratings, not description length', () => {
    expect(funScore({ decisionDepth: 4, agency: 5, comboPotential: 3, controlledVariance: 2, clarity: 5 })).toBe(80);
    expect(funScore({ decisionDepth: 5, agency: 5, comboPotential: 5, controlledVariance: 5, clarity: 5 })).toBe(100);
  });
  it('rejects misleading out-of-range or non-finite ratings', () => {
    for (const value of [-1, 6, NaN, Infinity]) expect(() => funScore({ agency: value })).toThrow(RangeError);
  });
});
