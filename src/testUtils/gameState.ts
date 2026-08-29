// Test yardımcıları: oyun durumu ve kart oluşturucu fonksiyonlar
import type { GameState } from '../state/store';
import type { Card, Character, NodeType } from '../types/game';

export type { GameState, Card, Character };

export function makeCard(isim: string, id: string = isim): Card {
  return {
    id,
    isim,
    // Test gerekirse diğer alanları ezebilir; burada geçerli varsayılanlar veriyoruz.
    tip: 'yetenek' as const,
    manaBedeli: 0,
    baseHasar: 0,
    zarTuru: 'd4',
    rarity: 'common',
    isUpgraded: false,
    tags: [],
    effects: [],
  };
}

export function makePlayer(partial: Partial<Character> = {}): Character {
  const defaults: Character = {
    id: 'player-1',
    isim: 'Ero',
    mevcutCan: 10,
    maksimumCan: 10,
    zirhSinifi: 12,
    gucCarpani: 2,
  };
  return { ...defaults, ...partial };
}

export function makeGameState(partial: Partial<GameState>): GameState {
  const defaults: GameState = {
    // Player
    player: makePlayer(),
    // Enemy
    enemy: {
      id: 'enemy-0',
      isim: 'Goblin',
      mevcutCan: 7,
      maksimumCan: 7,
      zirhSinifi: 11,
      gucCarpani: 1,
    },
    // Game state
    isPlayerTurn: true,
    maxEnergy: 3,
    currentEnergy: 3,
    deck: [] as Card[],
    hand: [] as Card[],
    discardPile: [] as Card[],
    drawCount: 5,
    gold: 50,
    battleLogs: [] as string[],
    initialized: false,
    gamePhase: 'mapSelection' as const,
    rewardOptions: [] as Card[],
    playerBlock: 0,
    enemyBlock: 0,
    enemySkipNextTurn: false,
    victoryCount: 0,
    enemyIntent: null,
    enemyIntentValue: 0,
    enemyArchetype: 'goblin' as const,
    playerStatuses: [] as any[], // We'll leave as any[] for simplicity, but we can define a proper type if needed
    enemyStatuses: [] as any[],
    comboChain: [] as string[],
    comboCount: 0,
    nextDamageBonus: 0,
    // RunMapState fields
    currentNode: null as NodeType | null,
    availableNodes: [] as Array<{ type: NodeType; id: string }>,
    runFloor: 0,
    nodeType: null as NodeType | null,
    // Methods (no-ops for testing)
    initializeGame: () => {},
    restartGame: () => {},
    drawCards: (_n: number) => {},
    endTurn: () => {},
    playCard: (_cardId: string) => {},
    addLog: (_message: string) => {},
    applyDamage: (_target: 'player' | 'enemy', _amount: number) => {},
    addRewardCardToDeck: (_cardId: string) => {},
    skipReward: () => {},
    healPlayer: () => {},
    removeCardFromDeck: (_cardId: string) => {},
    upgradeCard: (_cardId: string) => {},
    startNextCombat: () => {},
    selectNode: (_nodeId: string) => {},
  };

  return { ...defaults, ...partial };
}