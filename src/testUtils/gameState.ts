// Bu dosya src/testUtils/gameState.ts için ilgili kodları içerir.
// Test yardımcıları: oyun durumu ve kart oluşturucu fonksiyonlar (makeGameState, makeCard, makePlayer)
import type { GameState } from '../state/store';
import type { Card, Character, NodeType, StatusEffect } from '../types/game';
import { initialPosture } from '../mechanics/posture';

export type { GameState, Card, Character };

export function makeCard(isim: string, id: string = isim): Card {
  return {
    id,
    isim,
    // Test gerekirse diğer alanları ezebilir; burada geçerli varsayılanlar veriyoruz.
    tip: 'yetenek' as const,
    manaBedeli: 0,
    baseHasar: 0,
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
    hasarBonusu: 2,
    ...initialPosture(),
  };
  return { ...defaults, ...partial };
}

export function makeGameState(partial: Partial<GameState>): GameState {
  const defaults: GameState = {
    saveStatus: 'idle',
    saveCursor: null,
    startNewGame: () => false,
    resumeGame: () => false,
    retrySave: () => {},
    baseEnemyIntent: null,
    enemyBehaviorRoll: 0.5,
    pendingEnemyStatuses: [],
    pendingPlayerSkip: false,
    apocalypseHpPercent: 50,
    exhaustedPile: [],
    // Player
    player: makePlayer(),
    // Enemy
    enemy: {
      id: 'enemy-0',
      isim: 'Goblin',
      mevcutCan: 7,
      maksimumCan: 7,
      hasarBonusu: 1,
      ...initialPosture('goblin'),
    },
    // Game state
    isPlayerTurn: true,
    round: 1,
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
    draftBudget: 6,
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
    postureComboCount: 0,
    pendingParry: false,
    playerGuardPostureCost: 0,
    enemyGuardPostureCost: 0,
    // Missing fields
    playerName: '',
    playerDialog: [] as { text: string; timestamp: number }[],
    enemyDialog: [] as { text: string; timestamp: number }[],
    setPlayerName: (_name: string) => {},
    addPlayerDialog: (_text: string) => {},
    addEnemyDialog: (_text: string) => {},
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
