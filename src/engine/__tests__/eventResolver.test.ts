// Bu dosya src/engine/__tests__/eventResolver.test.ts için ilgili kodları içerir.
// Test: eventResolver olasılık ve ödül dağılımları
// Test: eventResolver olasılık ve ödül dağılımları
// Test: eventResolver olasılık ve ödül dağılımları
import { describe, expect, it } from 'vitest';
import { EventResolver } from '../eventResolver';
import { withMockRandom } from '../../testUtils/mockRandom';
import { makeGameState, makePlayer, makeCard } from '../../testUtils/gameState';

describe('EventResolver', () => {
  it('heals up to four HP and charges 10% gold', () => {
    const state = makeGameState({
      gold: 100,
      player: { ...makePlayer(), mevcutCan: 6, maksimumCan: 10 },
      battleLogs: [],
    });

    const result = EventResolver.resolveEvent(state, 0);

    expect(result.player.mevcutCan).toBe(10);
    expect(result.gold).toBe(90);
  });

  it('gives fallback gold when already at full HP', () => {
    const state = makeGameState({
      gold: 100,
      player: { ...makePlayer(), mevcutCan: 10, maksimumCan: 10 },
      battleLogs: [],
    });

    const result = EventResolver.resolveEvent(state, 0);

    expect(result.gold).toBe(110);
    expect(result.player.mevcutCan).toBe(10);
  });

  it('stacks weakened up to three stacks', () => {
    const state = makeGameState({
      enemyStatuses: [{
        id: 'weakened',
        duration: 2,
        stacks: 2,
        value: 1,
      }],
      battleLogs: [],
    });

    const result = EventResolver.resolveEvent(state, 2);

    expect(result.enemyStatuses[0].stacks).toBe(3);
    expect(result.enemyStatuses[0].duration).toBe(3);
  });

  it('uses deterministic random removal', async () => {
    const state = makeGameState({
      hand: [makeCard('a'), makeCard('b')],
      battleLogs: [],
    });

    const result = await withMockRandom([0.99], () =>
      EventResolver.resolveEvent(state, 1),
    );

    expect(result.hand).toHaveLength(1);
    expect(result.discardPile).toHaveLength(1);
  });
});