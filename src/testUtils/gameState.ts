// Bu dosya src/testUtils/gameState.ts için ilgili kodları içerir.
// Test yardımcıları: oyun durumu ve kart oluşturucu fonksiyonlar
// Test yardımcıları: oyun durumu ve kart oluşturucu fonksiyonlar (makeGameState, makeCard, makePlayer)
// Test yardımcıları: oyun durumu ve kart oluşturucu fonksiyonlar (makeGameState, makeCard, makePlayer)
import type { GameState } from '../state/store';
import type { Card, Character, NodeType, StatusEffect } from '../types/game';

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
    advantageCounter: 0,
    disadvantageCounter: 0,
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
      advantageCounter: 0,
      disadvantageCounter: 0,
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
    metaGold: 0,
    metaVictories: 0,
    battleLogs: [] as string[],
    initialized: false,
    gamePhase: 'mapSelection' as const,
    rewardOptions: [] as Card[],
    draftOptions: [] as Card[],
    draftPicks: 0,
    draftBudget: 5,
    starterDraftComplete: false,
    apocalypseTurns: null,
    enemyBehavior: 'standard',
    enemyCanLie: false,
    lastPlayerSignal: 'none',
    desperationStacks: 0,
    playerBlock: 0,
    enemyBlock: 0,
    enemySkipNextTurn: false,
    victoryCount: 0,
    enemyIntent: null,
    enemyIntentValue: 0,
    enemyArchetype: 'goblin' as const,
    playerStatuses: [] as StatusEffect[],
    enemyStatuses: [] as StatusEffect[],
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
    buyCard: (_cardId: string) => {},
    healPlayer: () => {},
    removeCardFromDeck: (_cardId: string) => {},
    upgradeCard: (_cardId: string) => {},
    startNextCombat: () => {},
    selectNode: (_nodeId: string) => {},
    resolveEvent: (_choiceIndex: number) => {},
    resolveRest: (_choiceIndex: number) => {},
    chooseDraftCard: (_cardId: string) => {},
    purifyDeck: () => {},
  };

  return { ...defaults, ...partial };
}