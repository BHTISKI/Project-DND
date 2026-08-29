// Boss resolver for handling boss nodes
import type { GameState } from '../state/store';
import type { Card, Character } from '../types/game';
import { generateRandomId } from '../utils/id';

export class BossResolver {
  static initializeBoss(gameState: GameState): GameState {
    const state = { ...gameState };
    const baseEnemy = state.enemy;
    if (!baseEnemy) {
      throw new Error('No enemy in state');
    }
    const bossEnemy: Character = {
      ...baseEnemy,
      mevcutCan: baseEnemy.maksimumCan * 2,
      maksimumCan: baseEnemy.maksimumCan * 2,
      zirhSinifi: baseEnemy.zirhSinifi + 2,
      gucCarpani: baseEnemy.gucCarpani + 1,
    };

    return {
      ...state,
      enemy: bossEnemy,
      enemyArchetype: state.enemyArchetype,
      enemyIntent: { type: 'attack', estimatedDamage: 0 }, // placeholder
      enemyIntentValue: 0,
      enemyBlock: 0,
      // Reset player state for battle
      currentEnergy: state.maxEnergy,
      playerBlock: 0,
      // Clear temporary effects that should not persist between battles
      enemyStatuses: [],
      playerStatuses: state.playerStatuses, // Player persisting effects remain
      battleLogs: [
        ...state.battleLogs,
        `BOSS SALDIRISI: ${bossEnemy.isim} pojawi!`
      ]
    };
  }

  static checkBossVictory(gameState: GameState): { isVictory: boolean; newState: GameState } {
    const state = { ...gameState };

    // Check if boss is defeated
    if (state.enemy.mevcutCan <= 0) {
      // Boss victory gives substantial rewards
      const bossGoldReward = 50 + (state.victoryCount * 10); // Scaling gold reward
      const bossCardRewardCount = 4; // More cards than regular victory

      // Generate more reward cards for boss victory
      const resolver = new BossResolver();
      const shuffled = resolver.shuffleArray([...resolver.getSampleCardDefs()]);
      const rewardOptions = shuffled.slice(0, bossCardRewardCount).map((def) => ({
        ...def,
        id: generateRandomId(),
      }));

      return {
        isVictory: true,
        newState: {
          ...state,
          gamePhase: 'victory',
          gold: state.gold + bossGoldReward,
          victoryCount: state.victoryCount + 1,
          rewardOptions,
          battleLogs: [
            ...state.battleLogs,
            `Boss defeated! ${bossGoldReward} altın ve 4 kart ödülü kazandınız.`
          ]
        }
      };
    }

    return { isVictory: false, newState: state };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private getSampleCardDefs(): Omit<Card, 'id'>[] {
    return [
      { isim: 'Hızlı Saldırı', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', rarity: 'common', tags: ['attack'], effects: [{ kind: 'attack', die: 'd4' }] },
      { isim: 'Kalkan Sihri', tip: 'savunma', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', rarity: 'common', tags: ['defend'], effects: [{ kind: 'block', die: 'd4' }] },
      { isim: 'Ateş Topu', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, zarTuru: 'd6', rarity: 'common', tags: ['skill', 'attack'], effects: [{ kind: 'damage', die: 'd6', ignoresArmor: true, damageBonus: 2 }] },
      { isim: 'Buhar Nefesi', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, zarTuru: 'd8', rarity: 'uncommon', tags: ['skill', 'heal'], effects: [{ kind: 'heal', die: 'd8' }] },
      { isim: 'Zayıflatıcı Lanet', tip: 'yetenek', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', rarity: 'uncommon', tags: ['skill', 'control'], effects: [{ kind: 'status', status: 'weakened', duration: 2, value: 1, target: 'enemy' }] },
      { isim: 'Zehirli Bıçak', tip: 'saldırı', manaBedeli: 2, baseHasar: 0, zarTuru: 'd4', rarity: 'uncommon', tags: ['attack', 'poison'], effects: [{ kind: 'attack', die: 'd4' }, { kind: 'status', status: 'poisoned', duration: 3, value: 1, target: 'enemy' }] },
      { isim: 'Savaş İlhamı', tip: 'yetenek', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', rarity: 'uncommon', tags: ['skill', 'combo'], effects: [{ kind: 'status', status: 'empowered', duration: 2, value: 2 }, { kind: 'energy', amount: 1 }] },
      { isim: 'Büyüleyici Çukur', tip: 'yetenek', manaBedeli: 3, baseHasar: 0, zarTuru: 'd10', rarity: 'rare', tags: ['skill', 'control'], effects: [{ kind: 'status', status: 'empowered', duration: 2, value: 2 }] },
      { isim: 'Kırılgan Zafer', tip: 'saldırı', manaBedeli: 2, baseHasar: 0, zarTuru: 'd8', rarity: 'rare', tags: ['attack', 'risk'], effects: [{ kind: 'attack', die: 'd8', damageBonus: 3 }, { kind: 'status', status: 'vulnerable', duration: 2, value: 1, target: 'player' }] },
      { isim: 'Taktik Hazırlık', tip: 'yetenek', manaBedeli: 0, baseHasar: 0, zarTuru: 'd1', rarity: 'rare', tags: ['skill', 'setup'], effects: [{ kind: 'draw', amount: 1 }, { kind: 'status', status: 'empowered', duration: 1, value: 1 }] },
    ];
  }
}