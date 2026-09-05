import { create } from 'zustand';
import { initialCampaign, type CampaignRun } from '../content/campaign';
import { createCampaignActions, type CampaignActions } from './campaignSlice';
import { campaignNodes, campaignEncounter, campaignPhase, campaignVictory, campaignEvent, canTravel } from '../engine/campaignResolver';
import { triggerRelics } from '../engine/relicResolver';
import { addStatus } from '../engine/statuses';
import { withNpcDialogue, type NpcLine } from '../engine/npcDialogue';
import { sampleCardDefs } from '../types/game';
import type { Card, Character, EnemyArchetypeId, EnemyBehaviorId, EnemyIntent, NodeType, PlayerSignal, RunMapState, StatusEffect } from '../types/game';
import { calculateUpgradeCost, getCardWeight, shuffle, upgradedCard } from '../utils/game';
import { generateRandomId } from '../utils/id';
import { loadMetaState, saveMetaState } from './persistence';
import { createEnemy, chooseArchetype } from '../engine/enemyArchetypes';
import { resolveCard, resolveTurn, prepareEnemyIntent, drawCardsState } from '../engine/combatResolver';
import { EventResolver } from '../engine/eventResolver';
import { RestResolver } from '../engine/restResolver';
import { BossResolver } from '../engine/bossResolver';
import { generateAvailableNodes } from '../engine/runMap';
import { encounterReward } from '../engine/rewards';
import { allCards, removeOwnedCard, updateOwnedCard } from '../engine/cardPiles';
import { canChooseDraftCard } from '../engine/draft';
import { restoreExhausted } from '../mechanics/exhaust';
import { readRunSave, writeRunSave } from './runPersistence';
import type { SaveStatus } from './runPersistence';
import { initialPosture } from '../mechanics/posture';

export interface GameState extends RunMapState, CampaignActions {
  combatFeedback?: import('../engine/combatFeedback').CombatFeedback[];
  campaign?: CampaignRun;
  saveStatus: SaveStatus;
  saveCursor: string | null;
  startNewGame: (name: string, expectedCursor: string | null) => boolean;
  resumeGame: () => boolean;
  retrySave: () => void;
  baseEnemyIntent: EnemyIntent | null;
  enemyBehaviorRoll: number;
  pendingEnemyStatuses: StatusEffect[];
  pendingPlayerSkip: boolean;
  apocalypseHpPercent: number;
  player: Character;
  enemy: Character;
  isPlayerTurn: boolean;
  round: number;
  // Energy system
  maxEnergy: number;
  currentEnergy: number;
  // Deck, hand, discard
  deck: Card[];
  hand: Card[];
  discardPile: Card[];
  exhaustedPile: Card[];
  // Number of cards to draw at start of turn
  drawCount: number;
  // Gold for shop
  gold: number;
  // Meta progression (persistent between runs)
  metaGold: number;
  metaVictories: number;
  playerName: string;
  // Battle logs
  battleLogs: string[];
  // Game initialization flag
  initialized: boolean;
  // Game phase
  gamePhase: 'combat' | 'shop' | 'victory' | 'gameOver' | 'mapSelection' | 'deckBuild' | 'event' | 'rest' | 'boss';
  // Reward options (shown in victory phase)
  rewardOptions: Card[];
  draftOptions: Card[];
  draftPicks: number;
  draftBudget: number;
  starterDraftComplete: boolean;
  apocalypseTurns: number | null;
  // Temporary block for player (absorbs damage from enemy attack)
  playerBlock: number;
  // Temporary block for enemy (absorbs damage from player attack when enemy intends to defend)
  enemyBlock: number;
  // Whether enemy will skip their next turn
  enemySkipNextTurn: boolean;
  // Number of victories
  victoryCount: number;
  // Enemy intent for the next enemy turn (set at start of player turn)
  enemyIntent: EnemyIntent | null;
  // Value associated with the intent (e.g., estimated damage for attack, block for defend, heal for special)
  enemyIntentValue: number;
  enemyArchetype: EnemyArchetypeId;
  enemyBehavior: EnemyBehaviorId;
  enemyCanLie: boolean;
  lastPlayerSignal: PlayerSignal;
  desperationStacks: number;
  playerStatuses: StatusEffect[];
  enemyStatuses: StatusEffect[];
  comboChain: string[];
  comboCount: number;
  nextDamageBonus: number;
  postureComboCount: number;
  pendingParry: boolean;
  playerGuardPostureCost: number;
  enemyGuardPostureCost: number;
  // Dialogs
  playerDialog: { text: string; timestamp: number }[];
  enemyDialog: NpcLine[];
  // Actions
  initializeGame: () => void;
  restartGame: () => void;
  drawCards: (n: number) => void;
  endTurn: () => void;
  playCard: (cardId: string) => void;
  addLog: (message: string) => void;
  applyDamage: (target: 'player' | 'enemy', amount: number) => void;
  // Victory phase actions
  addRewardCardToDeck: (cardId: string) => void;
  skipReward: () => void;
  // Shop actions
  healPlayer: () => void;
  buyCard: (cardId: string) => void;
  removeCardFromDeck: (cardId: string) => void;
  upgradeCard: (cardId: string) => void;
  startNextCombat: () => void;
  selectNode: (nodeId: string) => void;
  resolveEvent: (choiceIndex: number) => void;
  resolveRest: (choiceIndex: number) => void;
  chooseDraftCard: (cardId: string) => void;
  purifyDeck: () => void;
  setPlayerName: (name: string) => void;
  addPlayerDialog: (text: string) => void;
  addEnemyDialog: (text: string) => void;
}

const defaultPlayer: Character = {
  id: 'player-1', isim: 'Ero', mevcutCan: 24, maksimumCan: 24, hasarBonusu: 2, ...initialPosture(),
};

export function createInitialDeck(): Card[] {
  return shuffle(sampleCardDefs.filter(def => !def.isCursed)).slice(0, 7).map(def => ({ ...def, id: generateRandomId() }));
}

function initialRun() {
  return {
    campaign: undefined as CampaignRun | undefined,
    saveStatus: 'idle' as SaveStatus, saveCursor: null as string | null,
    player: { ...defaultPlayer }, enemy: createEnemy('goblin', 0), playerName: '',
    isPlayerTurn: true, round: 1, maxEnergy: 3, currentEnergy: 3, drawCount: 5,
    deck: [] as Card[], hand: [] as Card[], discardPile: [] as Card[], exhaustedPile: [] as Card[],
    gold: 50, metaGold: 0, metaVictories: 0, battleLogs: [] as string[], initialized: false,
    gamePhase: 'mapSelection' as const, rewardOptions: [] as Card[], draftOptions: [] as Card[],
    draftPicks: 0, draftBudget: 6, starterDraftComplete: false, apocalypseTurns: null as number | null, apocalypseHpPercent: 50,
    playerBlock: 0, enemyBlock: 0, enemySkipNextTurn: false, victoryCount: 0,
    enemyIntent: null as EnemyIntent | null, enemyIntentValue: 0, baseEnemyIntent: null as EnemyIntent | null,
    enemyBehaviorRoll: 0.5, enemyArchetype: 'goblin' as const, enemyBehavior: 'opportunist' as const,
    enemyCanLie: false, lastPlayerSignal: 'none' as const, desperationStacks: 0,
    playerStatuses: [] as StatusEffect[], enemyStatuses: [] as StatusEffect[],
    pendingEnemyStatuses: [] as StatusEffect[], pendingPlayerSkip: false,
    currentNode: null as NodeType | null, nodeType: null as NodeType | null, runFloor: 0,
    availableNodes: generateAvailableNodes(0), comboChain: [] as string[], comboCount: 0, nextDamageBonus: 0,
    postureComboCount: 0, pendingParry: false, playerGuardPostureCost: 0, enemyGuardPostureCost: 0,
    playerDialog: [] as { text: string; timestamp: number }[], enemyDialog: [] as { text: string; timestamp: number }[],
  };
}
function log(state: GameState, text: string): GameState {
  return { ...state, battleLogs: [...state.battleLogs, text] };
}
function resetCombatPlayer(player: Character): Character {
  return { ...player, currentPosture: 0, isBroken: false };
}
function mapAfter(state: GameState, advance: boolean): GameState {
  const runFloor = state.runFloor + (advance ? 1 : 0);
  return { ...state, ...restoreExhausted(state), gamePhase: 'mapSelection', runFloor, availableNodes: state.campaign ? campaignNodes(runFloor) : generateAvailableNodes(runFloor),
    currentNode: null, nodeType: null, enemyIntent: null, enemyIntentValue: 0, baseEnemyIntent: null,
    player: resetCombatPlayer(state.player), playerBlock: 0, enemyBlock: 0, enemySkipNextTurn: false,
    playerStatuses: [], enemyStatuses: [], apocalypseTurns: null, comboChain: [], comboCount: 0, nextDamageBonus: 0,
    postureComboCount: 0, pendingParry: false, playerGuardPostureCost: 0, enemyGuardPostureCost: 0,
    playerDialog: [], enemyDialog: [], isPlayerTurn: true };
}

// All damage routes share one terminal decision. Simultaneous death counts as defeat.
export function finishEncounter(state: GameState): GameState {
  if (state.gamePhase !== 'combat') return state;
  state = campaignPhase(state);
  if (state.player.mevcutCan <= 0) return {
    ...state, gamePhase: 'gameOver', player: { ...state.player, mevcutCan: 0 },
    enemyIntent: null, enemyIntentValue: 0, playerDialog: [], enemyDialog: [],
    battleLogs: [...state.battleLogs, 'Oyuncu ölü! Oyun bitti.'],
  };
  if (state.enemy.mevcutCan > 0) return state;
  if (state.campaign) return campaignVictory(state);
  const type = state.nodeType ?? state.currentNode;
  let won: GameState;
  if (type === 'boss') won = BossResolver.checkBossVictory(state).newState;
  else {
    const reward = encounterReward(type, state.victoryCount);
    won = { ...state, gold: state.gold + reward.gold, rewardOptions: reward.cards, victoryCount: state.victoryCount + 1,
      battleLogs: [...state.battleLogs, `Zafer! ${reward.gold} altın kazandın.`] };
  }
  return { ...mapAfter(won, true), metaGold: state.metaGold + 10, metaVictories: state.metaVictories + 1,
    playerDialog: [] };
}
function beginCombat(state: GameState): GameState {
  const combined = shuffle(allCards(state));
  let next = drawCardsState({
    ...state, gamePhase: 'combat', player: resetCombatPlayer(state.player),
    enemy: { ...state.enemy, currentPosture: 0, isBroken: false }, deck: combined, hand: [], discardPile: [], exhaustedPile: [],
    playerStatuses: [], enemyStatuses: [...state.pendingEnemyStatuses], pendingEnemyStatuses: [],
    playerBlock: 0, enemyBlock: 0, enemySkipNextTurn: false, baseEnemyIntent: null,
    currentEnergy: state.maxEnergy, round: 1, isPlayerTurn: true,
    comboChain: [], comboCount: 0, nextDamageBonus: 0, desperationStacks: 0, lastPlayerSignal: 'none',
    postureComboCount: 0, pendingParry: false, playerGuardPostureCost: 0, enemyGuardPostureCost: 0,
    apocalypseTurns: null, apocalypseHpPercent: 50, playerDialog: [], enemyDialog: [],
  }, state.drawCount);
  if (next.campaign) {
    next = { ...next, campaign: { ...next.campaign, usedRelics: [] } };
    if (next.campaign!.classId === 'weaver') next = drawCardsState(next, 1);
    if (next.campaign!.classId === 'warden') next.playerBlock += 4;
    if (next.campaign!.classId === 'cinder') next.enemyStatuses = addStatus(next.enemyStatuses, { id: 'poisoned', duration: 2, stacks: 1 });
    next = triggerRelics(next, 'battle');
  }
  next = prepareEnemyIntent(next);
  if (state.pendingPlayerSkip) {
    next = log({ ...next, pendingPlayerSkip: false }, 'Kehanet bedeli: ilk oyuncu turu feda edildi.');
    next = resolveTurn(next, finishEncounter);
  }
  return next;
}

export const useGameStore = create<GameState>((set, get) => {
  const update = (resolve: (state: GameState) => GameState) => set(state => {
    const next = withNpcDialogue(state, resolve(state));
    if (next === state) return state;
    if (!next.initialized || !next.playerName) return next;
    const saved = writeRunSave(next, next.saveCursor);
    // The run and its earned counters commit together. A stale tab must not update meta either.
    if (saved.status === 'saved' && (next.metaGold !== state.metaGold || next.metaVictories !== state.metaVictories || state.saveStatus !== 'saved'))
      saveMetaState(next.metaGold, next.metaVictories);
    return { ...next, saveStatus: saved.status, saveCursor: saved.cursor };
  });
  const startRun = (state: GameState, campaign = false): GameState => {
    const cards = createInitialDeck();
    const meta = loadMetaState();
    const previous = readRunSave();
    meta.metaGold = Math.max(meta.metaGold, state.metaGold, previous.kind === 'ready' ? previous.run.metaGold : 0);
    meta.metaVictories = Math.max(meta.metaVictories, state.metaVictories, previous.kind === 'ready' ? previous.run.metaVictories : 0);
    return { ...state, ...initialRun(), ...meta, ...(campaign ? { campaign: initialCampaign(), availableNodes: campaignNodes(0) } : {}), saveCursor: state.saveCursor, playerName: state.playerName,
      player: { ...defaultPlayer, isim: state.playerName || 'Ero' }, initialized: true,
      hand: cards.slice(0, 5), deck: cards.slice(5),
      battleLogs: ['Oyun başlatıldı. Deste hazırlandı.'] };
  };
  return {
    ...initialRun(),
    ...createCampaignActions(update),
    startNewGame: (name, expectedCursor) => {
      const playerName = name.trim();
      if (playerName.length < 2 || playerName.length > 20) return false;
      const next = startRun({ ...get(), playerName, saveCursor: expectedCursor }, true);
      const saved = writeRunSave(next, expectedCursor);
      if (saved.status === 'conflict') return false;
      set({ ...next, saveStatus: saved.status, saveCursor: saved.cursor });
      return true;
    },
    resumeGame: () => {
      const saved = readRunSave();
      if (saved.kind !== 'ready') return false;
      // Restore the committed turn as-is. Do not draw, reroll, award or initialize again.
      set({ ...initialRun(), ...saved.run, initialized: true,
        saveCursor: saved.cursor, saveStatus: saved.cursor ? 'saved' : 'error' });
      return true;
    },
    retrySave: () => update(state => ({ ...state })),
    initializeGame: () => update(state => state.initialized ? state : startRun(state)),
    restartGame: () => update(state => state.gamePhase === 'gameOver' ? startRun(state, !!state.campaign) : state),
    drawCards: count => update(state => finishEncounter(drawCardsState(state, count))),
    playCard: id => update(state => finishEncounter(resolveCard(state, id))),
    endTurn: () => update(state => resolveTurn(state, finishEncounter)),
    addLog: text => update(state => log(state, text)),
    applyDamage: (target, amount) => update(state => {
      if (state.gamePhase !== 'combat' || !Number.isFinite(amount) || amount < 0) return state;
      return finishEncounter({ ...state, [target]: { ...state[target], mevcutCan: Math.max(0, state[target].mevcutCan - amount) } });
    }),
    setPlayerName: name => update(state => {
      const trimmed = name.trim();
      return trimmed.length >= 2 && trimmed.length <= 20
        ? { ...state, playerName: trimmed, player: { ...state.player, isim: trimmed } } : state;
    }),
    addPlayerDialog: () => {},
    addEnemyDialog: text => update(state => ({ ...state, enemyDialog: [...state.enemyDialog, { text, timestamp: Date.now() }] })),
    addRewardCardToDeck: id => update(state => {
      if (!['victory', 'mapSelection'].includes(state.gamePhase)) return state;
      const card = state.rewardOptions.find(c => c.id === id);
      if (!card) return state;
      return { ...state, deck: [...state.deck, card], rewardOptions: [], gamePhase: state.campaign ? 'mapSelection' : 'shop', currentNode: null, nodeType: null };
    }),
    skipReward: () => update(state => {
      if (!['victory', 'mapSelection'].includes(state.gamePhase) || !state.rewardOptions.length) return state;
      return { ...state, rewardOptions: [], gamePhase: state.campaign ? 'mapSelection' : 'shop', currentNode: null, nodeType: null };
    }),
    buyCard: id => update(state => {
      if (state.gamePhase !== 'shop' || !/^shop-\d+$/.test(id)) return state;
      const index = Number(id.slice(5));
      // Only the displayed offers may be purchased.
      if (index < 7 || index > 10) return state;
      const def = sampleCardDefs[index];
      const cost = calculateUpgradeCost(def.rarity, 0);
      if (state.gold < cost) return log(state, `Yetersiz altın! ${cost} altın gerekiyor.`);
      return log({ ...state, deck: [...state.deck, { ...def, id: generateRandomId() }], gold: state.gold - cost },
        `${def.isim} satın alındı. (${cost} altın)`);
    }),
    healPlayer: () => update(state => {
      if (state.gamePhase !== 'shop') return state;
      if (state.gold < 25) return log(state, 'Yetersiz altın! Şifa için 25 altın gerekiyor.');
      const amount = Math.min(4, state.player.maksimumCan - state.player.mevcutCan);
      if (amount <= 0) return log(state, 'Canın zaten dolu.');
      return log({ ...state, gold: state.gold - 25, player: { ...state.player, mevcutCan: state.player.mevcutCan + amount } },
        `${amount} can yenilendi. (25 altın)`);
    }),
    removeCardFromDeck: id => update(state => {
      if (state.gamePhase !== 'shop') return state;
      if (state.gold < 50) return log(state, 'Yetersiz altın! Kart silmek için 50 altın gerekiyor.');
      const cards = allCards(state);
      const card = cards.find(c => c.id === id);
      if (!card || cards.length <= 1) return log(state, 'Son kart kaldırılamaz.');
      return log({ ...state, ...removeOwnedCard(state, id), gold: state.gold - 50 }, `${card.isim} kalıcı olarak kaldırıldı. (50 altın)`);
    }),
    upgradeCard: id => update(state => {
      if (state.gamePhase !== 'shop') return state;
      const card = allCards(state).find(c => c.id === id);
      if (!card) return state;
      const upgraded = upgradedCard(card);
      if (!upgraded) return log(state, card.isUpgraded ? 'Kart zaten yükseltilmiş.' : 'Bu kartın yükseltmesi yok.');
      const cost = calculateUpgradeCost(card.rarity, state.victoryCount);
      if (state.gold < cost) return log(state, `Yetersiz altın! Yükseltme için ${cost} altın gerekiyor.`);
      return log({ ...state, ...updateOwnedCard(state, upgraded), gold: state.gold - cost }, `${card.isim} yükseltildi. (${cost} altın)`);
    }),
    purifyDeck: () => update(state => {
      if (state.gamePhase !== 'shop') return state;
      const cards = allCards(state);
      const cursed = cards.filter(c => c.isCursed);
      if (!cursed.length) return log(state, 'Deste zaten temiz.');
      if (cursed.length === cards.length) return log(state, 'Arınma desteni tamamen boşaltamaz.');
      if (state.gold < 120) return log(state, 'Arınma için 120 altın gerekiyor.');
      return log({ ...state, gold: state.gold - 120, deck: state.deck.filter(c => !c.isCursed),
        hand: state.hand.filter(c => !c.isCursed), discardPile: state.discardPile.filter(c => !c.isCursed),
        exhaustedPile: state.exhaustedPile.filter(c => !c.isCursed) },
        `${cursed.length} lanetli kart kaldırıldı. (120 altın)`);
    }),
    startNextCombat: () => update(state => state.gamePhase === 'shop' ? mapAfter(state, state.currentNode === 'shop') : state),
    selectNode: id => update(state => {
      if (state.gamePhase !== 'mapSelection' || state.rewardOptions.length || !canTravel(state.campaign)) return state;
      const node = state.availableNodes.find(n => n.id === id);
      if (!node) return state;
      if (node.type === 'shop' || node.type === 'event' || node.type === 'rest')
        return { ...state, gamePhase: node.type, currentNode: node.type, nodeType: node.type };
      const archetype = chooseArchetype(state.victoryCount);
      const enemy = createEnemy(archetype, state.runFloor, node.type);
      let encounter: GameState = { ...state, enemy, enemyArchetype: archetype, currentNode: node.type, nodeType: node.type,
        enemyBehavior: node.type === 'elite' || node.type === 'boss' || archetype === 'mage' ? 'paranoid'
          : archetype === 'goblin' || archetype === 'assassin' ? 'opportunist' : 'standard',
        enemyCanLie: node.type === 'elite' || node.type === 'boss' };
      if (state.campaign) encounter = campaignEncounter(encounter, node.type);
      if (node.type === 'boss') encounter = BossResolver.initializeBoss(encounter);
      if (state.starterDraftComplete) return beginCombat(encounter);
      const pool = shuffle(sampleCardDefs.filter(c => !c.isCursed));
      const defs = [...pool.filter(c => c.rarity === 'common').slice(0, 3),
        ...pool.filter(c => c.rarity === 'uncommon').slice(0, 1), ...pool.filter(c => c.rarity === 'rare' || c.rarity === 'legendary').slice(0, 1)];
      return { ...encounter, gamePhase: 'deckBuild', draftPicks: 0, draftBudget: 6,
        draftOptions: defs.map(c => ({ ...c, id: generateRandomId(), agirlik: getCardWeight(c) })) };
    }),
    chooseDraftCard: id => update(state => {
      if (state.gamePhase !== 'deckBuild') return state;
      if (!canChooseDraftCard(state.draftOptions, id, state.draftPicks, state.draftBudget))
        return log(state, 'Bu seçim kalan kartlar için yeterli yük bırakmıyor.');
      const card = state.draftOptions.find(c => c.id === id)!;
      const next = log({ ...state, deck: [...state.deck, card], draftPicks: state.draftPicks + 1,
        draftBudget: state.draftBudget - getCardWeight(card), draftOptions: state.draftOptions.filter(c => c.id !== id) }, `${card.isim} desteye eklendi.`);
      return next.draftPicks === 3 ? beginCombat({ ...next, starterDraftComplete: true, draftOptions: [] }) : next;
    }),
    resolveEvent: choice => update(state => {
      if (state.gamePhase !== 'event') return state;
      if (state.campaign) return campaignEvent(state, choice);
      const resolved = EventResolver.resolveEvent(state, choice);
      return resolved === state ? state : mapAfter(resolved, true);
    }),
    resolveRest: choice => update(state => {
      if (state.gamePhase !== 'rest') return state;
      if (choice === 2) return mapAfter(state, true);
      const resolved = RestResolver.resolveRest(state, choice);
      return resolved === state ? state : mapAfter(resolved, true);
    }),
  };
});
