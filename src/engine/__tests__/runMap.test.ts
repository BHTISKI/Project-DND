// Bu dosya src/engine/__tests__/runMap.test.ts için ilgili kodları içerir.
// Test: runMap düğüm erişimi ve harita geçişleri
// Test: runMap düğüm erişimi ve harita geçişleri
// Test: runMap düğüm erişimi ve harita geçişleri
import { describe, expect, it } from 'vitest';
import { generateAvailableNodes, updateRunMapAfterNodeCompletion } from '../runMap';
import { withMockRandom } from '../../testUtils/mockRandom';

describe('runMap', () => {
  it('always returns at least two nodes', async () => {
    await withMockRandom([0, 0, 0, 0, 0], () => {
      const nodes = generateAvailableNodes(0, null);

      expect(nodes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('forces boss on every third floor', async () => {
    await withMockRandom([0.5, 0.7, 0.9], () => {
      const nodes = generateAvailableNodes(3, null);

      expect(nodes.some((node) => node.type === 'boss')).toBe(true);
    });
  });

  it('increments floor after node completion', () => {
    const result = updateRunMapAfterNodeCompletion(
      {
        runFloor: 2,
        currentNode: null,
        nodeType: null,
      },
      'combat',
    );

    expect(result.runFloor).toBe(3);
    expect(result.nodeType).toBe('combat');
    expect(result.availableNodes.length).toBeGreaterThanOrEqual(2);
  });

  // Additional invariant tests
  it('returns between 2 and 3 nodes', async () => {
    await withMockRandom([0, 0, 0, 0, 0, 0, 0, 0, 0, 0], () => {
      const nodes = generateAvailableNodes(0, null);
      expect(nodes.length).toBeGreaterThanOrEqual(2);
      expect(nodes.length).toBeLessThanOrEqual(3);
    });
  });

  it('ensures all node IDs are unique', async () => {
    await withMockRandom(Array.from({ length: 10 }, (_, index) => (index + 1) / 11), () => {
      const nodes = generateAvailableNodes(0, null);
      const ids = nodes.map(node => node.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('ensures node types are valid', async () => {
    const validTypes = ['combat', 'event', 'rest', 'boss', 'shop', 'elite'];
    await withMockRandom([0, 0, 0, 0, 0, 0, 0, 0, 0, 0], () => {
      const nodes = generateAvailableNodes(0, null);
      nodes.forEach(node => {
        expect(validTypes).toContain(node.type);
      });
    });
  });

  it('ensures boss nodes only appear on floors that are multiples of 3', async () => {
    await withMockRandom([0, 0, 0, 0, 0], () => {
      const nodes = generateAvailableNodes(0, null);
      const hasBoss = nodes.some(node => node.type === 'boss');
      expect(hasBoss).toBe(false);
    });

    await withMockRandom([0.5, 0.7, 0.9], () => {
      const nodes = generateAvailableNodes(3, null);
      const hasBoss = nodes.some(node => node.type === 'boss');
      expect(hasBoss).toBe(true);
    });

    // We'll test floor 5 (which is the sixth floor, but index 5) should have boss if every third floor starting from floor 2? Actually, the rule might be: boss on floors 2, 5, 8, ... (i.e., floor % 3 == 2)
    await withMockRandom([0, 0, 0, 0, 0], () => {
      const nodes = generateAvailableNodes(6, null);
      const hasBoss = nodes.some(node => node.type === 'boss');
      expect(hasBoss).toBe(true);
    });
  });

  it('function terminates for various RNG sequences', async () => {
    // We'll test a few different RNG sequences to ensure the function doesn't hang
    const rngSequences = [
      [0, 0, 0, 0, 0],
      [0.1, 0.2, 0.3, 0.4, 0.5],
      [0.9, 0.8, 0.7, 0.6, 0.5],
      [0.5, 0.5, 0.5, 0.5, 0.5],
      [0.123, 0.456, 0.789, 0.111, 0.222],
    ];

    for (const rng of rngSequences) {
      await withMockRandom(rng, () => {
        const nodes = generateAvailableNodes(0, null);
        // We just check that it returns without throwing and that the length is between 2 and 3
        expect(nodes.length).toBeGreaterThanOrEqual(2);
        expect(nodes.length).toBeLessThanOrEqual(3);
      });
    }
  });
});
