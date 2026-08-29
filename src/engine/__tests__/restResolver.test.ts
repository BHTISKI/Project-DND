// Bu dosya src/engine/__tests__/restResolver.test.ts için ilgili kodları içerir.
// Test: restResolver iyileşme ve blok mantığı
// Test: restResolver iyileşme ve blok mantığı
// Test: restResolver iyileşme ve blok mantığı
import { describe, expect, it } from 'vitest';
import { RestResolver } from '../restResolver';
import { withMockRandom } from '../../testUtils/mockRandom';
import { makeGameState, makeCard } from '../../testUtils/gameState';

describe('restResolver', () => {
  it('does not mutate the original deck', async () => {
    const originalDeck = [
      makeCard('a'),
      makeCard('b'),
      makeCard('c'),
    ];

    const state = makeGameState({
      deck: originalDeck,
      gold: 100,
      battleLogs: [],
    });

    await withMockRandom([0], () =>
      RestResolver.resolveRest(state, 1),
    );

    expect(originalDeck).toHaveLength(3);
    expect(state.deck).toHaveLength(3);
  });
});