// Bu dosya src/engine/__tests__/bossResolver.test.ts için ilgili kodları içerir.
// Test: bossResolver mantığı ve ödül dağılımı
// Test: bossResolver mantığı ve ödül dağılımı
// Test: bossResolver mantığı ve ödül dağılımı
import { describe, expect, it } from 'vitest';
import { BossResolver } from '../bossResolver';
import { withMockRandom } from '../../testUtils/mockRandom';
import { makeGameState } from '../../testUtils/gameState';

describe('BossResolver', () => {
  it('initializes a stronger boss', async () => {
    const state = makeGameState({
      victoryCount: 2,
      playerStatuses: [{ id: 'empowered', duration: 2, stacks: 1, value: 2 }],
      enemyStatuses: [{ id: 'poisoned', duration: 2, stacks: 1, value: 1 }],
      currentEnergy: 0,
      playerBlock: 7,
      battleLogs: [],
    });

    const result = await withMockRandom([0], () =>
      BossResolver.initializeBoss(state),
    );

    expect(result.enemy.mevcutCan).toBe(result.enemy.maksimumCan);
    expect(result.enemy.maksimumCan).toBeGreaterThan(state.enemy.maksimumCan);
    expect(result.enemy.zirhSinifi).toBe(state.enemy.zirhSinifi + 2);
    expect(result.enemy.gucCarpani).toBe(state.enemy.gucCarpani + 1);
    expect(result.currentEnergy).toBe(result.maxEnergy);
    expect(result.playerBlock).toBe(0);
    expect(result.enemyStatuses).toEqual([]);
    expect(result.playerStatuses).toHaveLength(1);
  });

  it('returns boss victory when HP is zero', async () => {
    const state = makeGameState({
      victoryCount: 2,
      enemy: {
        id: 'boss',
        isim: 'Boss',
        mevcutCan: 0,
        maksimumCan: 20,
        zirhSinifi: 15,
        gucCarpani: 4,
        advantageCounter: 0,
        disadvantageCounter: 0,
      },
      gold: 10,
      battleLogs: [],
    });

    const result = await withMockRandom(
      new Array(30).fill(0),
      () => BossResolver.checkBossVictory(state),
    );

    expect(result.isVictory).toBe(true);
    expect(result.newState.gamePhase).toBe('victory');
    expect(result.newState.gold).toBe(80);
    expect(result.newState.victoryCount).toBe(3);
    expect(result.newState.rewardOptions).toHaveLength(4);
  });
});