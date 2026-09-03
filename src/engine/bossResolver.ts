import type { GameState } from '../state/store';
import { encounterReward } from './rewards';

export class BossResolver {
  static initializeBoss(state: GameState): GameState {
    const enemy = state.enemy;
    return {
      ...state,
      enemy: { ...enemy, mevcutCan: enemy.maksimumCan * 2, maksimumCan: enemy.maksimumCan * 2,
        zirhSinifi: enemy.zirhSinifi + 2, gucCarpani: enemy.gucCarpani + 1,
        advantageCounter: 0, disadvantageCounter: 0, denge: 0, staggered: false },
      enemyIntent: null, enemyIntentValue: 0, enemyBlock: 0,
      currentEnergy: state.maxEnergy, playerBlock: 0, enemyStatuses: [],
      battleLogs: [...state.battleLogs, `Boss karşılaşması: ${enemy.isim} ortaya çıktı!`],
    };
  }

  static checkBossVictory(state: GameState): { isVictory: boolean; newState: GameState } {
    if (state.enemy.mevcutCan > 0) return { isVictory: false, newState: state };
    const reward = encounterReward('boss', state.victoryCount);
    return { isVictory: true, newState: { ...state, gamePhase: 'victory', gold: state.gold + reward.gold,
      victoryCount: state.victoryCount + 1, rewardOptions: reward.cards,
      battleLogs: [...state.battleLogs, `Boss yenildi! ${reward.gold} altın kazandın.`] } };
  }
}
