// Bu dosya src/state/store.ts için ilgili kodları içerir.
// Zustand store tanımı ve oyun durumu yönetimi
// Zustand store tanımı ve oyun durumu yönetimi (state, actions, middleware)
// Zustand store tanımı ve oyun durumu yönetimi (state, actions, middleware)
import { sampleCardDefs } from '../types/game';
import type { Card, CardEffect, Character, EnemyArchetypeId, EnemyBehaviorId, EnemyIntent, NodeType, PlayerSignal, RunMapState, StatusEffect, StatusId } from '../types/game';
import { decideEnemyBehavior } from '../engine/enemyBehavior';
import { EventResolver } from '../engine/eventResolver';
import { RestResolver } from '../engine/restResolver';
import { BossResolver } from '../engine/bossResolver';
import { rollDie } from '../engine/dice';
import { create } from 'zustand';
import { generateRandomId } from '../utils/id';
import { calculateUpgradeCost, enhanceEffect, getCardWeight, shuffle } from '../utils/game';
import { loadMetaState, saveMetaState } from './persistence';
import { enemyArchetypes, chooseArchetype, createEnemy, generateEnemyIntent } from '../engine/enemyArchetypes';

export { calculateUpgradeCost, enhanceEffect, getCardWeight, shuffle } from '../utils/game';
export { loadMetaState, saveMetaState } from './persistence';

export { chooseArchetype, createEnemy, generateEnemyIntent } from '../engine/enemyArchetypes';

function behaviorIntent(enemy: Character, behavior: EnemyBehaviorId, player: Character, playerBlock: number, lastPlayerSignal: PlayerSignal, desperationStacks: number, canLie = false): { intent: EnemyIntent; decisionStacks: number } {
  const decision = decideEnemyBehavior({ behavior, enemy, player, playerBlock, playerStatuses: [], previousIntent: null, lastPlayerSignal, desperationStacks, canLie });
  const estimatedDamage = decision.action.damage;
  return {
    intent: {
      type: decision.telegraph.type,
      estimatedDamage,
      effectKey: decision.action.kind,
      telegraph: decision.telegraph,
      action: decision.action,
    },
    decisionStacks: decision.nextDesperationStacks,
  };
}

function behaviorForEncounter(nodeType: NodeType, archetype: EnemyArchetypeId): EnemyBehaviorId {
  if (nodeType === 'elite' || nodeType === 'boss') return 'paranoid';
  if (archetype === 'goblin' || archetype === 'assassin') return 'opportunist';
  if (archetype === 'mage') return 'paranoid';
  return 'standard';
}

export function addStatus(statuses: StatusEffect[], effect: StatusEffect): StatusEffect[] {
  const existing = statuses.find((status) => status.id === effect.id);
  if (!existing) return [...statuses, effect];
  return statuses.map((status) => status.id === effect.id
    ? { ...status, duration: Math.max(status.duration, effect.duration), stacks: Math.min(3, status.stacks + effect.stacks), value: effect.value ?? status.value }
    : status);
}

export function statusValue(statuses: StatusEffect[], id: StatusId): number {
  return statuses.find((status) => status.id === id)?.value ?? 0;
}

export function tickStatuses(statuses: StatusEffect[], target: 'player' | 'enemy', character: Character): { statuses: StatusEffect[]; character: Character; log: string[] } {
  let updatedCharacter = character;
  const log: string[] = [];
  const remaining = statuses.flatMap((status) => {
    if (status.id === 'poisoned') {
      const value = status.value ?? 0;
      if (value > 0) {
        const damage = Math.max(1, value) * status.stacks;
        updatedCharacter = { ...updatedCharacter, mevcutCan: Math.max(0, updatedCharacter.mevcutCan - damage) };
        log.push(`${target === 'player' ? 'Oyuncu' : 'Düşman'} zehirden ${damage} hasar aldı.`);
      }
    }
    const nextDuration = status.duration - 1;
    return nextDuration > 0 ? [{ ...status, duration: nextDuration }] : [];
  });
  return { statuses: remaining, character: updatedCharacter, log };
}

export function rollAttackDie(advantage: number, disadvantage: number, rng: () => number = Math.random): number {
  const roll = () => Math.floor(rng() * 20) + 1;
  const firstRoll = roll();
  if (advantage > disadvantage) return Math.max(firstRoll, roll());
  if (disadvantage > advantage) return Math.min(firstRoll, roll());
  return firstRoll;
}

function rollEffectDie(die: string | undefined): number | undefined {
  if (!die) return undefined;
  const sides = Number(die.replace(/^d/, ''));
  return Number.isInteger(sides) && sides > 0 ? rollDie(sides) : undefined;
}

export interface GameState extends RunMapState {
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
  // Number of cards to draw at start of turn
  drawCount: number;
  // Gold for shop
  gold: number;
  // Meta progression (persistent between runs)
  metaGold: number;
  metaVictories: number;
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
}


const defaultPlayer: Character = {
  id: 'player-1',
  isim: 'Ero',
  mevcutCan: 10,
  maksimumCan: 10,
  zirhSinifi: 12,
  gucCarpani: 2,
  advantageCounter: 0,
  disadvantageCounter: 0,
  denge: 0,
  maksimumDenge: 10,
  staggered: false,
};

const defaultEnemy = createEnemy('goblin', 0);

export function generateAvailableNodes(floor: number): Array<{ type: NodeType; id: string }> {
  const types: NodeType[] = floor > 0 && floor % 3 === 0
    ? ['boss', 'elite', 'shop']
    : floor > 0
      ? ['combat', 'event', 'rest']
      : ['combat', 'combat', 'shop'];

  // For each type, we want to start numbering from 0
  // Track how many times we've seen each type so far
  const typeCounts: Record<NodeType, number> = {
    boss: 0,
    elite: 0,
    shop: 0,
    combat: 0,
    event: 0,
    rest: 0,
  };

  return types.map(type => {
    const id = `floor-${floor}-${type}-${typeCounts[type]}`;
    typeCounts[type]++;
    return { type, id };
  });
}

// Function to create initial deck (e.g., 5 copies of each)
export function createInitialDeck(): Card[] {
  return shuffle(sampleCardDefs.filter((def) => !def.isCursed).map((def) => ({ ...def, id: generateRandomId() }))).slice(0, 7);
}

// Get 3 random unique cards from sampleCardDefs
export function getRandomRewards(): Card[] {
  const shuffled = shuffle([...sampleCardDefs]);
  return shuffled.slice(0, 3).map((def) => ({
    ...def,
    id: generateRandomId(),
  }));
}

function cursedCard(name: string): Card {
  const definition = sampleCardDefs.find((card) => card.isim === name);
  return { ...(definition ?? sampleCardDefs[0]), id: generateRandomId() };
}

export const useGameStore = create<GameState>((set) => ({
  player: defaultPlayer,
  enemy: defaultEnemy,
  isPlayerTurn: true,
  round: 1,
  maxEnergy: 3,
  currentEnergy: 3,
  deck: [],
  hand: [],
  discardPile: [],
  drawCount: 5,
  gold: 50, // starting gold
  metaGold: 0,
  metaVictories: 0,
  battleLogs: [],
  initialized: false,
  playerBlock: 0,
  enemyBlock: 0,
  enemySkipNextTurn: false,
  victoryCount: 0,
  gamePhase: 'mapSelection',
  rewardOptions: [],
  draftOptions: [],
  draftPicks: 0,
  draftBudget: 6,
  starterDraftComplete: false,
  apocalypseTurns: null,
  enemyIntent: null,
  enemyIntentValue: 0,
  enemyArchetype: 'goblin',
  enemyBehavior: 'opportunist',
  enemyCanLie: false,
  lastPlayerSignal: 'none',
  desperationStacks: 0,
  playerStatuses: [],
  enemyStatuses: [],
  currentNode: null,
  availableNodes: generateAvailableNodes(0),
  runFloor: 0,
  nodeType: null,
  comboChain: [],
  comboCount: 0,
  nextDamageBonus: 0,

  initializeGame: () => {
    set((state) => {
      if (state.initialized) return state;
      const deck = createInitialDeck();
      const player = { ...defaultPlayer };
      const enemy = { ...defaultEnemy };
      // draw initial hand
      const hand = deck.slice(0, state.drawCount);
      const remainingDeck = deck.slice(state.drawCount);
      const { intent, value, block: enemyBlock } = generateEnemyIntent(enemy, 'goblin');
      const { metaGold, metaVictories } = loadMetaState();
      return {
        ...state,
        player,
        enemy,
        deck: remainingDeck,
        hand,
        discardPile: [],
        gold: 50,
        currentEnergy: state.maxEnergy,
        initialized: true,
        round: 1,
        gamePhase: 'mapSelection',
        currentNode: null,
        availableNodes: generateAvailableNodes(0),
        runFloor: 0,
        nodeType: null,
        draftOptions: [],
        draftPicks: 0,
        draftBudget: 6,
        starterDraftComplete: false,
        apocalypseTurns: null,
        battleLogs: ['Oyun başlatıldı. Destek hazırlanıyor...'],
        playerBlock: 0,
        enemyBlock,
        enemySkipNextTurn: false,
        victoryCount: 0,
        enemyIntent: intent,
        enemyIntentValue: value,
        enemyArchetype: 'goblin',
        enemyBehavior: 'opportunist',
        enemyCanLie: false,
        lastPlayerSignal: 'none',
        desperationStacks: 0,
        playerStatuses: [],
        enemyStatuses: [],
        comboChain: [],
        comboCount: 0,
        nextDamageBonus: 0,
        metaGold,
        metaVictories,
      };
    });
  },

  restartGame: () => {
    set((state) => {
      if (state.gamePhase !== 'gameOver') return state;
      return {
        ...state,
        initialized: false,
      };
    });
    useGameStore.getState().initializeGame();
  },

  drawCards: (n: number) => {
    set((state) => {
      let deck = state.deck;
      let discardPile = state.discardPile;
      let hand = [...state.hand];

      // If not enough cards in deck, shuffle discard into deck
      if (deck.length < n) {
        const combined = [...deck, ...discardPile];
        deck = shuffle(combined);
        discardPile = [];
      }

      // Draw n cards from deck
      const drawn = deck.slice(0, n);
      deck = deck.slice(n);
      hand = [...hand, ...drawn];

      return { deck, hand, discardPile };
    });
  },

  endTurn: () => {
    set((state) => {
      if (state.gamePhase !== 'combat' || !state.isPlayerTurn) {
        return state;
      }

      // 1. Move hand to discard pile
      const cursedCards = state.hand.filter((card) => card.onDiscardPenalty);
      const newDiscard = [...state.discardPile, ...state.hand.filter((card) => !card.onDiscardPenalty)];
      // 2. Draw new hand
      let deck = [...state.deck, ...cursedCards.filter((card) => card.onDiscardPenalty?.returnToDeck)];
      let discardPile = newDiscard;
      let hand: Card[] = [];

      if (deck.length < state.drawCount) {
        const combined = [...deck, ...discardPile];
        deck = shuffle(combined);
        discardPile = [];
      }
      const drawn = deck.slice(0, state.drawCount);
      deck = deck.slice(state.drawCount);
      hand = [...drawn];

      // 3. Reset energy
      let maxEnergy = state.maxEnergy;
      let currentEnergy = state.maxEnergy;

      // 4. Enemy turn processing (if enemy alive)
      let isPlayerTurn = true; // after enemy turn we return to player
      let battleLogs = [...state.battleLogs];
      let player = state.player;
      let enemy = state.enemy;
      let playerBlock = state.playerBlock;
      let enemySkipNextTurn = state.enemySkipNextTurn;
      let enemyStatuses = state.enemyStatuses;
      let playerStatuses = state.playerStatuses;
      let apocalypseTurns = state.apocalypseTurns;
      const turnSignal: PlayerSignal = state.lastPlayerSignal === 'parry' || state.lastPlayerSignal === 'retaliation'
        ? state.lastPlayerSignal
        : playerBlock === 0 ? 'no-block' : 'none';
      const currentDecision = behaviorIntent(enemy, state.enemyBehavior, player, playerBlock, turnSignal, state.desperationStacks, state.enemyCanLie);
      const enemyAction = currentDecision.intent.action;
      const desperationStacks = currentDecision.decisionStacks;

      if (cursedCards.length > 0) {
        const penalty = cursedCards.reduce((sum, card) => sum + (card.onDiscardPenalty?.amount ?? 0), 0);
        player = { ...player, mevcutCan: Math.max(0, player.mevcutCan - penalty) };
        battleLogs = [...battleLogs, `Körlük Mührü bedelini aldı: ${penalty} saf hasar.`];
      }
      const brokenSoulCount = hand.filter((card) => card.isim === 'Kırık Ruh').length;
      if (brokenSoulCount > 0) {
        const maxHealth = Math.max(1, player.maksimumCan - brokenSoulCount * 2);
        player = { ...player, maksimumCan: maxHealth, mevcutCan: Math.min(player.mevcutCan, maxHealth) };
        maxEnergy = Math.max(1, state.maxEnergy - brokenSoulCount * 2);
        currentEnergy = Math.min(currentEnergy, maxEnergy);
        battleLogs = [...battleLogs, `Kırık Ruh zihni kemirdi: maksimum Can -${brokenSoulCount * 2}.`];
      }
      if (apocalypseTurns !== null) {
        apocalypseTurns -= 1;
        if (apocalypseTurns <= 0 && enemy.mevcutCan > 0) {
          const sacrifice = Math.ceil(player.mevcutCan * 0.5);
          player = { ...player, mevcutCan: Math.max(0, player.mevcutCan - sacrifice) };
          battleLogs = [...battleLogs, `Kıyamet Mührü patladı: ${sacrifice} saf hasar.`];
          apocalypseTurns = null;
        }
      }

      const enemyTick = tickStatuses(enemyStatuses, 'enemy', enemy);
      enemyStatuses = enemyTick.statuses;
      enemy = enemyTick.character;
      battleLogs = [...battleLogs, ...enemyTick.log];

      // Check if enemy should skip this turn
      if (enemySkipNextTurn) {
        enemySkipNextTurn = false;
        battleLogs = [...battleLogs, `Düşman etkili bir etkiden kaynaklanarak turunu atlandı!`];
      } else if (enemy.staggered) {
        enemy = { ...enemy, staggered: false };
        battleLogs = [...battleLogs, 'Düşman sendeledi ve turunu kaybetti.'];
      } else if (enemy.mevcutCan > 0 && state.gamePhase === 'combat') {
        // Process enemy intent
        const archetype = enemyArchetypes[state.enemyArchetype];
        switch (enemyAction?.kind) {
          case 'attack':
          case 'critical-execution':
          case 'desperation-attack': {
            let damage = enemyAction.damage ?? archetype.attackDamage + enemy.gucCarpani;
            if (enemyAction.kind === 'critical-execution') damage *= 2;
            const hit = true;

            let blockUsed = 0;
            let log = '';

            if (hit) {
              if (statusValue(enemyStatuses, 'weakened') > 0) damage = Math.max(0, damage - statusValue(enemyStatuses, 'weakened'));
              if (statusValue(playerStatuses, 'vulnerable') > 0) damage = Math.ceil(damage * 1.25);
              // Apply player's block to reduce damage
              if (!enemyAction.ignoresBlock && playerBlock > 0) {
                if (playerBlock >= damage) {
                  // Block absorbs all damage
                  blockUsed = damage;
                  damage = 0;
                  playerBlock = 0; // block is used up
                } else {
                  // Block absorbs part of the damage
                  blockUsed = playerBlock;
                  damage -= playerBlock;
                  playerBlock = 0; // block is used up
                }
              }
              // Apply damage to player
              if (player.staggered) {
                player = { ...player, mevcutCan: Math.max(0, player.mevcutCan - damage * 2), staggered: false };
              } else {
                const denge = Math.min(player.maksimumDenge ?? 10, (player.denge ?? 0) + damage);
                player = {
                  ...player,
                  mevcutCan: Math.max(0, player.mevcutCan - damage),
                  denge,
                  staggered: denge >= (player.maksimumDenge ?? 10),
                };
              }
              // Build log message
              const hitText = 'Başarılı saldırı';
              log = `${hitText}: Düşman ${damage} hasar vurdu.`;
              if (blockUsed > 0) {
                log += ` (Blok ${blockUsed} hasarını engelledi)`;
              }
              if (Math.random() < 0.3) {
                deck = [...deck, cursedCard('Körlük Mührü')];
                log += ' Körlük Mührü destene karıştı.';
              }
              if (enemyAction.kind === 'desperation-attack') {
                playerBlock = 0;
                log += ' Çaresizlik bloğu parçaladı.';
              }
            }

            enemy = {
              ...enemy,
              advantageCounter: Math.max(0, enemy.advantageCounter - 1),
              disadvantageCounter: Math.max(0, enemy.disadvantageCounter - 1),
            };
            battleLogs = [...battleLogs, log];
            // Check if player died after enemy attack
            if (player.mevcutCan <= 0) {
              // Transition to game over
              return {
                ...state,
                deck,
                hand,
                discardPile,
                currentEnergy,
                maxEnergy,
                isPlayerTurn,
                player,
                enemy,
                playerBlock: 0, // reset player block
                enemyBlock: 0, // clear enemy block
                enemySkipNextTurn,
                enemyIntent: null,
                enemyIntentValue: 0,
                battleLogs: [...battleLogs, `Oyuncu ölü! Oyun bitti.`],
                gamePhase: 'gameOver',
                apocalypseTurns,
              };
            }
            break;
          }

          case 'heal': {
            const healAmount = enemyAction.damage ?? 4;
            enemy = { ...enemy, mevcutCan: Math.min(enemy.maksimumCan, enemy.mevcutCan + healAmount) };
            battleLogs = [...battleLogs, `Düşman yalan niyet gösterdi ve ${healAmount} can yeniledi.`];
            break;
          }
          case 'poison':
            playerStatuses = addStatus(playerStatuses, { id: 'poisoned', duration: 3, stacks: enemyAction.poison ?? 2, value: 1 });
            battleLogs = [...battleLogs, `Düşman savuşturmadan kaçtı ve zehir fırlattı.`];
            break;
          case 'pass':
            battleLogs = [...battleLogs, `Düşman savuşturma duruşunu okudu ve geri çekildi.`];
            break;
          case undefined:
            battleLogs = [...battleLogs, 'Düşman hamle yapamadı.'];
            break;
        }
      }
      const playerTick = tickStatuses(playerStatuses, 'player', player);
      playerStatuses = playerTick.statuses;
      player = playerTick.character;
      battleLogs = [...battleLogs, ...playerTick.log];
      // If enemy died after potential action (or was already dead), transition to victory
      if (enemy.mevcutCan <= 0 && state.gamePhase === 'combat') {
        // Transition to victory with 3 random reward cards
        const rewards = getRandomRewards();
        const newMetaVictories = state.metaVictories + 1;
        const newMetaGold = state.metaGold + 10;
        saveMetaState(newMetaGold, newMetaVictories);
        return {
          ...state,
          deck,
          hand,
          discardPile,
          currentEnergy,
          maxEnergy,
          isPlayerTurn,
          player,
          enemy,
          battleLogs,
          gamePhase: 'mapSelection',
          victoryCount: state.victoryCount + 1,
          metaVictories: newMetaVictories,
          metaGold: newMetaGold,
          rewardOptions: rewards,
          runFloor: state.runFloor + 1,
          currentNode: null,
          availableNodes: generateAvailableNodes(state.runFloor + 1),
          nodeType: null,
          playerBlock: 0,
          enemyBlock: 0,
          enemySkipNextTurn: false,
          enemyIntent: null,
          enemyIntentValue: 0,
          playerStatuses,
          enemyStatuses,
          apocalypseTurns,
        };
      }

      // After enemy turn, generate new intent for the next player turn
      const nextDecision = behaviorIntent(enemy, state.enemyBehavior, player, 0, 'none', desperationStacks, state.enemyCanLie);
      const newEnemyBlock = nextDecision.intent.estimatedBlock ?? 0;

      return {
        ...state,
        deck,
        hand,
        discardPile,
        currentEnergy,
        maxEnergy,
        isPlayerTurn,
        player,
        enemy,
        battleLogs,
        playerBlock: 0, // reset player block
        enemyBlock: newEnemyBlock, // set for next player turn based on new intent
        enemySkipNextTurn,
        enemyIntent: nextDecision.intent,
        enemyIntentValue: nextDecision.intent.estimatedDamage ?? 0,
        enemyBehavior: state.enemyBehavior,
        lastPlayerSignal: 'none',
        desperationStacks,
        playerStatuses,
        enemyStatuses,
        comboChain: [],
        comboCount: 0,
        nextDamageBonus: 0,
        apocalypseTurns,
        round: state.round + 1,
      };
    });
  },

  playCard: (cardId: string) => {
    set((state) => {
      // Only allow playing in combat phase and player turn
      if (!state.isPlayerTurn || state.gamePhase !== 'combat') {
        return state;
      }
      if (state.player.staggered) {
        return { ...state, battleLogs: [...state.battleLogs, 'Oyuncu kırıldı; bu tur kart oynayamaz.'] };
      }
      // Find card in hand
      const cardIndex = state.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        console.warn('Card not found in hand');
        return state;
      }
      const card = state.hand[cardIndex];
      const playerSignal: PlayerSignal = card.tags?.includes('parry')
        ? 'parry'
        : card.tags?.includes('retaliation')
          ? 'retaliation'
          : state.lastPlayerSignal;

      // Check energy
      if (state.currentEnergy < card.manaBedeli) {
        // Not enough energy
        const log = `Yetersiz enerji! ${card.isim} oynatılamadı (gerekli: ${card.manaBedeli}, mevcut: ${state.currentEnergy})`;
        return { ...state, battleLogs: [...state.battleLogs, log] };
      }

      // Remove card from hand, add to discard
      const newHand = [...state.hand];
      newHand.splice(cardIndex, 1);
      const newDiscard = card.onPlayPenalty === 'replace-with-broken-soul'
        ? [...state.discardPile]
        : [...state.discardPile, card];
      let deck = card.onPlayPenalty === 'replace-with-broken-soul'
        ? [...state.deck, cursedCard('Kırık Ruh')]
        : state.deck;

      // Spend energy
      let newEnergy = state.currentEnergy - card.manaBedeli;

      let log = '';
      let updatedPlayer = state.player;
      let updatedEnemy = state.enemy;
      let updatedPlayerBlock = state.playerBlock;
      let updatedEnemyBlock = state.enemyBlock; // current enemy block (from defend intent)
      let updatedEnemySkipNextTurn = state.enemySkipNextTurn;
      let updatedPlayerStatuses = state.playerStatuses;
      let updatedEnemyStatuses = state.enemyStatuses;
      let updatedComboChain = [...state.comboChain, ...(card.tags ?? [card.tip])];
      let updatedComboCount = state.comboCount;
      let updatedNextDamageBonus = state.nextDamageBonus;
      let apocalypseTurns = state.apocalypseTurns;
      const effectLogs: string[] = [];

      if (card.onPlayPenalty === 'replace-with-broken-soul') {
        effectLogs.push(`${card.isim} ruhunu parçaladı. Kırık Ruh desteye eklendi.`);
      }
      if (card.apocalypse) {
        apocalypseTurns = card.apocalypse.delay;
        effectLogs.push(`Kıyamet sayacı başladı: ${card.apocalypse.delay} tur.`);
      }

      if (card.effects) {
        const previousTag = state.comboChain[state.comboChain.length - 1];
        const currentTag = card.tags?.[0] ?? card.tip;
        if (previousTag && previousTag !== currentTag) {
          updatedComboCount += 1;
          updatedNextDamageBonus += previousTag === 'skill' && currentTag === 'attack' ? 2 : previousTag === 'defend' && currentTag === 'attack' ? 1 : 0;
        }
        updatedComboChain = [currentTag].slice(-2);
        for (const effect of card.effects as CardEffect[]) {
          if (effect.kind === 'attack' || effect.kind === 'damage') {
            const rolledDamage = rollEffectDie(effect.die);
            let damage = (card.baseHasar || rolledDamage || 4) + (effect.damageBonus ?? 0) + state.player.gucCarpani + updatedNextDamageBonus;
            if (statusValue(updatedPlayerStatuses, 'empowered') > 0) damage += statusValue(updatedPlayerStatuses, 'empowered');
            if (statusValue(updatedEnemyStatuses, 'vulnerable') > 0) damage = Math.ceil(damage * 1.25);
            if (updatedEnemyBlock > 0) {
              damage = Math.max(0, damage - updatedEnemyBlock);
              updatedEnemyBlock = 0;
            }
            if (updatedEnemy.staggered) {
              updatedEnemy = { ...updatedEnemy, mevcutCan: Math.max(0, updatedEnemy.mevcutCan - damage * 2), staggered: false };
            } else {
              const denge = Math.min(updatedEnemy.maksimumDenge ?? 10, (updatedEnemy.denge ?? 0) + damage);
              updatedEnemy = {
                ...updatedEnemy,
                mevcutCan: Math.max(0, updatedEnemy.mevcutCan - damage),
                denge,
                staggered: denge >= (updatedEnemy.maksimumDenge ?? 10),
              };
            }
            effectLogs.push(`${card.isim} ${damage} hasar verdi${updatedComboCount > state.comboCount ? ` (Kombo ${updatedComboCount})` : ''}.`);
            updatedNextDamageBonus = 0;
          } else if (effect.kind === 'block') {
            updatedPlayerBlock = effect.amount ?? rollEffectDie(effect.die) ?? 4;
            effectLogs.push(`${card.isim} ${updatedPlayerBlock} blok kazandırdı.`);
          } else if (effect.kind === 'heal') {
            const target = effect.target === 'enemy' ? updatedEnemy : updatedPlayer;
            const amount = effect.amount ?? rollEffectDie(effect.die) ?? 4;
            const healed = Math.min(target.maksimumCan, target.mevcutCan + amount);
            if (effect.target === 'enemy') updatedEnemy = { ...target, mevcutCan: healed };
            else updatedPlayer = { ...target, mevcutCan: healed };
            effectLogs.push(`${card.isim} ${amount} can iyileştirdi.`);
          } else if (effect.kind === 'status') {
            const target = effect.target === 'enemy' ? updatedEnemyStatuses : updatedPlayerStatuses;
            const status = { id: effect.status, duration: effect.duration, stacks: effect.stacks ?? 1, value: effect.value };
            if (effect.target === 'enemy') updatedEnemyStatuses = addStatus(target, status);
            else updatedPlayerStatuses = addStatus(target, status);
            effectLogs.push(`${card.isim} ${effect.status} etkisi uyguladı.`);
          } else if (effect.kind === 'draw') {
            const available = deck.slice(0, effect.amount);
            deck = deck.slice(effect.amount);
            newHand.push(...available);
            effectLogs.push(`${effect.amount} kart çekildi.`);
          } else if (effect.kind === 'energy') {
            newEnergy = Math.min(state.maxEnergy, newEnergy + effect.amount);
            effectLogs.push(`${effect.amount} enerji kazanıldı.`);
          } else if (effect.kind === 'skip') {
            updatedEnemySkipNextTurn = true;
            effectLogs.push('Düşman sonraki turunu atlayacak.');
          } else if (effect.kind === 'advantage') {
            const amount = effect.value ?? 1;
            if (effect.target === 'enemy') {
              updatedEnemy = { ...updatedEnemy, advantageCounter: updatedEnemy.advantageCounter + amount };
              effectLogs.push(`${card.isim} düşmana ${amount} avantaj sağladı.`);
            } else {
              updatedPlayer = { ...updatedPlayer, advantageCounter: updatedPlayer.advantageCounter + amount };
              effectLogs.push(`${card.isim} ${amount} avantaj sağladı.`);
            }
          } else if (effect.kind === 'disadvantage') {
            const amount = effect.value ?? 1;
            if (effect.target === 'enemy') {
              updatedEnemy = { ...updatedEnemy, disadvantageCounter: updatedEnemy.disadvantageCounter + amount };
              effectLogs.push(`${card.isim} düşmana ${amount} dezavantaj verdi.`);
            } else {
              updatedPlayer = { ...updatedPlayer, disadvantageCounter: updatedPlayer.disadvantageCounter + amount };
              effectLogs.push(`${card.isim} ${amount} dezavantaj verdi.`);
            }
          } else if (effect.kind === 'trash') {
            const amount = effect.amount ?? 1;
            const target = effect.target ?? 'player';
            if (target === 'player') {
              const actualAmount = Math.min(amount, deck.length);
              if (actualAmount > 0) {
                const trashed = deck.slice(0, actualAmount);
                deck = deck.slice(actualAmount);
                effectLogs.push(`${actualAmount} kart ${trashed.map(c => c.isim).join(', ')} desteleden kaldırıldı.`);
              } else {
                effectLogs.push(`Deste boş, kart kaldırılamadı.`);
              }
            } else {
              effectLogs.push(`Düşmanın deste aucune kartı kaldıramadı (düşmanın deste yok).`);
            }
          } else if (effect.kind === 'trade') {
            const trashAmount = effect.trashAmount ?? 1;
            const drawAmount = effect.drawAmount ?? 1;
            const target = effect.target ?? 'player';
            if (target === 'player') {
              // Trash
              const actualTrash = Math.min(trashAmount, deck.length);
              if (actualTrash > 0) {
                const trashed = deck.slice(0, actualTrash);
                deck = deck.slice(actualTrash);
                effectLogs.push(`${actualTrash} kart ${trashed.map(c => c.isim).join(', ')} desteleden kaldırıldı.`);
              } else {
                effectLogs.push(`Deste boş, kart kaldırılamadı.`);
              }
              // Draw
              const actualDraw = Math.min(drawAmount, deck.length);
              if (actualDraw > 0) {
                const drawn = deck.slice(0, actualDraw);
                deck = deck.slice(actualDraw);
                newHand.push(...drawn);
                effectLogs.push(`${actualDraw} kart çekildi.`);
              } else {
                effectLogs.push(`Deste yetersiz, ${drawAmount} kart çekilemedi.`);
              }
            } else {
              effectLogs.push(`Düşmanın deste keine erişim, trade effect uygulanamadı.`);
            }
          }
        }
        log = effectLogs.join(' ');
      }

      // Apply damage to enemy if any (from attack or yetenek that dealt damage)
      // Note: For yetenek that dealt damage, we already updated the enemy above.
      // For attack, we updated enemy in the case block.

      // Return updated state
      if (state.enemy.mevcutCan > 0 && updatedEnemy.mevcutCan <= 0) {
        const newMetaVictories = state.metaVictories + 1;
        const newMetaGold = state.metaGold + 10;
        saveMetaState(newMetaGold, newMetaVictories);
        return {
          ...state,
          hand: newHand,
          deck,
          discardPile: newDiscard,
          currentEnergy: newEnergy,
          player: updatedPlayer,
          enemy: updatedEnemy,
          playerBlock: updatedPlayerBlock,
          enemyBlock: updatedEnemyBlock, // preserve enemy block (if any)
          enemySkipNextTurn: false,
          enemyIntent: null,
          enemyIntentValue: 0,
          playerStatuses: updatedPlayerStatuses,
          enemyStatuses: updatedEnemyStatuses,
          lastPlayerSignal: playerSignal,
          comboChain: updatedComboChain,
          comboCount: updatedComboCount,
          nextDamageBonus: updatedNextDamageBonus,
          battleLogs: [...state.battleLogs, log],
          gamePhase: 'mapSelection',
          gold: state.gold + 20 + state.victoryCount * 5,
          victoryCount: state.victoryCount + 1,
          metaGold: newMetaGold,
          metaVictories: newMetaVictories,
          rewardOptions: getRandomRewards(),
          runFloor: state.runFloor + 1,
          currentNode: null,
          availableNodes: generateAvailableNodes(state.runFloor + 1),
          nodeType: null,
          apocalypseTurns,
        };
      }

      return {
        ...state,
        hand: newHand,
        deck,
        discardPile: newDiscard,
        currentEnergy: newEnergy,
        player: updatedPlayer,
        enemy: updatedEnemy,
        playerBlock: updatedPlayerBlock,
        enemyBlock: updatedEnemyBlock,
        enemySkipNextTurn: updatedEnemySkipNextTurn,
        playerStatuses: updatedPlayerStatuses,
        enemyStatuses: updatedEnemyStatuses,
        lastPlayerSignal: playerSignal,
        comboChain: updatedComboChain,
        comboCount: updatedComboCount,
        nextDamageBonus: updatedNextDamageBonus,
        apocalypseTurns,
        battleLogs: [...state.battleLogs, log],
      };
    });
  },

  addLog: (message: string) => {
    set((state) => ({
      battleLogs: [...state.battleLogs, message],
    }));
  },

  applyDamage: (target: 'player' | 'enemy', amount: number) => {
    set((state) => {
      if (state.gamePhase !== 'combat') return state;
      const targetChar = target === 'player' ? state.player : state.enemy;
      const newHp = Math.max(0, targetChar.mevcutCan - amount);
      return {
        ...state,
        [target]: { ...targetChar, mevcutCan: newHp },
      };
    });
  },

  // Victory phase actions
  addRewardCardToDeck: (cardId: string) => {
    set((state) => {
      if (state.gamePhase !== 'victory' && state.gamePhase !== 'mapSelection') return state;
      // Find the card in rewardOptions
      const rewardCard = state.rewardOptions.find((c) => c.id === cardId);
      if (!rewardCard) {
        console.warn('Reward card not found');
        return state;
      }
      // Add the card to the deck
      const newDeck = [...state.deck, rewardCard];
      // Clear rewards and go to shop
      return {
        ...state,
        deck: newDeck,
        gamePhase: 'shop',
        rewardOptions: [],
      };
    });
  },

  skipReward: () => {
    set((state) => {
      if (state.gamePhase !== 'victory' && state.gamePhase !== 'mapSelection') return state;
      // Go to shop without adding a card
      return {
        ...state,
        gamePhase: 'shop',
        rewardOptions: [],
      };
    });
  },

  // Shop actions
  buyCard: (cardId: string) => {
    set((state) => {
      if (state.gamePhase !== 'shop') return state;
      const cardIndex = Number(cardId.replace('shop-', ''));
      const cardDefinition = sampleCardDefs[cardIndex];
      const cost = cardDefinition?.rarity === 'legendary' ? 120 : cardDefinition?.rarity === 'rare' ? 80 : cardDefinition?.rarity === 'uncommon' ? 60 : 40;
      if (!cardDefinition) return state;
      if (state.gold < cost) {
        return { ...state, battleLogs: [...state.battleLogs, `Yetersiz altın! Kart için ${cost} altın gerekiyor.`] };
      }
      const purchasedCard = { ...cardDefinition, id: generateRandomId() };
      return {
        ...state,
        deck: [...state.deck, purchasedCard],
        gold: state.gold - cost,
        battleLogs: [...state.battleLogs, `${purchasedCard.isim} satın alındı. (${cost} altın)`],
      };
    });
  },
  healPlayer: () => {
    set((state) => {
      if (state.gamePhase !== 'shop') return state;
      const healCost = 25; // gold cost
      if (state.gold < healCost) {
        // Not enough gold
        return {
          ...state,
          battleLogs: [...state.battleLogs, `Yetersiz altın! Can yenilemek için ${healCost} altın gerekiyor.`],
        };
      }
      const player = state.player;
      const healAmount = 4; // heal 4 HP
      const newHp = Math.min(player.maksimumCan, player.mevcutCan + healAmount);
      return {
        ...state,
        player: { ...player, mevcutCan: newHp },
        gold: state.gold - healCost,
        battleLogs: [...state.battleLogs, `Oyuncu ${healAmount} can yeniledi! (${healCost} altın)`],
      };
    });
  },

  removeCardFromDeck: (cardId: string) => {
    set((state) => {
      if (state.gamePhase !== 'shop') return state;
      const removeCost = 50; // gold cost
      if (state.gold < removeCost) {
        // Not enough gold
        return {
          ...state,
          battleLogs: [...state.battleLogs, `Yetersiz altın! Kart silmek için ${removeCost} altın gerekiyor.`],
        };
      }
      // Find the card in deck
      const cardIndex = state.deck.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        console.warn('Card not found in deck');
        return state;
      }
      const removedCard = state.deck[cardIndex];
      // Remove the card from deck
      const newDeck = [...state.deck];
      newDeck.splice(cardIndex, 1);
      return {
        ...state,
        deck: newDeck,
        gold: state.gold - removeCost,
        battleLogs: [...state.battleLogs, `Ah! ${removedCard.isim} kaybedildi. ${removeCost} altın ödendi.`],
      };
    });
  },

  purifyDeck: () => {
    set((state) => {
      if (state.gamePhase !== 'shop') return state;
      const cost = 120;
      const cursedCount = [...state.deck, ...state.hand, ...state.discardPile].filter((card) => card.isCursed).length;
      if (cursedCount === 0) return { ...state, battleLogs: [...state.battleLogs, 'Deste zaten temiz.'] };
      if (state.gold < cost) return { ...state, battleLogs: [...state.battleLogs, `Arınma için ${cost} altın gerekiyor.`] };
      return {
        ...state,
        deck: state.deck.filter((card) => !card.isCursed),
        hand: state.hand.filter((card) => !card.isCursed),
        discardPile: state.discardPile.filter((card) => !card.isCursed),
        gold: state.gold - cost,
        battleLogs: [...state.battleLogs, `Mühürler yakıldı. ${cursedCount} lanetli kart desteden silindi. (-${cost} altın)`],
      };
    });
  },

  // Start next combat after shop (reset enemy to default or scaled?)
  upgradeCard: (cardId: string) => {
    set((state) => {
      const cardIndex = state.deck.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        console.warn('Card not found in deck for upgrade');
        return {
          ...state,
          battleLogs: [...state.battleLogs, 'Kart deste için bulunamadı.'],
        };
      }
      const card = state.deck[cardIndex];
      if (card.isUpgraded) {
        console.warn('Card is already upgraded');
        return {
          ...state,
          battleLogs: [...state.battleLogs, 'Kart zaten yükseltilmiş.'],
        };
      }
      const cost = calculateUpgradeCost(card.rarity, state.victoryCount);
      if (state.gold < cost) {
        console.warn(`Not enough gold. Need ${cost} gold.`);
        return {
          ...state,
          battleLogs: [...state.battleLogs, `Yetersiz altın! Kart silmek için ${cost} altın gerekiyor.`],
        };
      }
      const upgradedCard = {
        ...card,
        // keep same id
        isUpgraded: true,
        effects: card.effects?.map(enhanceEffect) || [],
      };
      // replace card at same index
      const newDeck = [...state.deck];
      newDeck[cardIndex] = upgradedCard;
      const newGold = state.gold - cost;
      const newLogs = [...state.battleLogs, `Kart ${card.isim} ${cost} altınla yükseltildi.`];
      return {
        ...state,
        deck: newDeck,
        gold: newGold,
        battleLogs: newLogs,
      };
    });
  },

  startNextCombat: () => {
    set((state) => {
      if (state.gamePhase !== 'shop') return state;
      const victoryFactor = state.victoryCount;
      const enemyArchetype = chooseArchetype(victoryFactor);
      const scaledEnemy = createEnemy(enemyArchetype, victoryFactor);
      const enemyBehavior = behaviorForEncounter('combat', enemyArchetype);
      const enemyCanLie = false;
      // Generate initial enemy intent for the new combat
      const openingDecision = behaviorIntent(scaledEnemy, enemyBehavior, state.player, 0, 'none', 0);
      const enemyBlock = 0;

      // Combine deck, hand, and discard pile, shuffle, then draw initial hand
      const combined = [...state.deck, ...state.hand, ...state.discardPile];
      const shuffledDeck = shuffle(combined);
      const newHand = shuffledDeck.slice(0, state.drawCount);
      const newDeck = shuffledDeck.slice(state.drawCount);

      return {
        ...state,
        enemy: scaledEnemy,
        gamePhase: 'mapSelection',
        currentNode: null,
        nodeType: null,
        availableNodes: generateAvailableNodes(state.runFloor),
        isPlayerTurn: true, // player starts combat
        playerBlock: 0,
        enemyBlock,
        enemySkipNextTurn: false,
        enemyIntent: openingDecision.intent,
        enemyIntentValue: openingDecision.intent.estimatedDamage ?? 0,
        enemyArchetype,
        enemyBehavior,
        enemyCanLie,
        lastPlayerSignal: 'none',
        desperationStacks: openingDecision.decisionStacks,
        // Reset player state for new combat
        player: {
          ...state.player,
          advantageCounter: 0,
          disadvantageCounter: 0,
        },
        currentEnergy: state.maxEnergy, // full energy
        hand: newHand, // draw initial hand
        deck: newDeck, // remaining cards
        discardPile: [], // clear discard pile
        playerStatuses: [], // clear all temporary status effects
        enemyStatuses: [],
        comboChain: [],
        comboCount: 0,
        nextDamageBonus: 0,
        // Optionally clear battle logs? Keep them.
      };
    });
  },

  selectNode: (nodeId: string) => {
    set((state) => {
      if (state.gamePhase !== 'mapSelection') return state;
      const selectedNode = state.availableNodes.find((node) => node.id === nodeId);
      if (!selectedNode) return state;

      if (selectedNode.type === 'shop') {
        return { ...state, gamePhase: 'shop', currentNode: selectedNode.type, nodeType: selectedNode.type };
      }

      if (selectedNode.type === 'event') {
        return { ...state, gamePhase: 'event', currentNode: selectedNode.type, nodeType: selectedNode.type };
      }

      if (selectedNode.type === 'rest') {
        return { ...state, gamePhase: 'rest', currentNode: selectedNode.type, nodeType: selectedNode.type };
      }

      const enemyArchetype = chooseArchetype(state.victoryCount);
      const baseEnemy = createEnemy(enemyArchetype, state.runFloor);
      const enemy = selectedNode.type === 'elite'
        ? { ...baseEnemy, mevcutCan: baseEnemy.maksimumCan * 1.5, maksimumCan: baseEnemy.maksimumCan * 1.5, zirhSinifi: baseEnemy.zirhSinifi + 1, gucCarpani: baseEnemy.gucCarpani + 0.5 }
        : baseEnemy;
      const encounterState = selectedNode.type === 'boss'
        ? BossResolver.initializeBoss({ ...state, enemy })
        : { ...state, enemy };
      const encounterEnemy = encounterState.enemy;
      const enemyBehavior = behaviorForEncounter(selectedNode.type, enemyArchetype);
      const enemyCanLie = selectedNode.type === 'elite' || selectedNode.type === 'boss';
      if (state.starterDraftComplete) {
        const openingDecision = behaviorIntent(encounterEnemy, enemyBehavior, state.player, 0, 'none', 0, enemyCanLie);
        const enemyBlock = openingDecision.intent.estimatedBlock ?? 0;
        const shuffledDeck = shuffle([...state.deck, ...state.hand, ...state.discardPile]);
        return { ...encounterState, gamePhase: 'combat', currentNode: selectedNode.type, nodeType: selectedNode.type, enemy: encounterEnemy, enemyArchetype, enemyBehavior, enemyCanLie, lastPlayerSignal: 'none', desperationStacks: openingDecision.decisionStacks, enemyIntent: openingDecision.intent, enemyIntentValue: openingDecision.intent.estimatedDamage ?? 0, enemyBlock, currentEnergy: state.maxEnergy, playerBlock: 0, hand: shuffledDeck.slice(0, state.drawCount), deck: shuffledDeck.slice(state.drawCount), discardPile: [], playerStatuses: [], enemyStatuses: [], isPlayerTurn: true, round: 1 };
      }

      const draftPool = shuffle(sampleCardDefs.filter((def) => !def.isCursed));
      const draftDefinitions = [
        ...draftPool.filter((def) => def.rarity === 'common').slice(0, 3),
        ...draftPool.filter((def) => def.rarity === 'uncommon').slice(0, 1),
        ...draftPool.filter((def) => def.rarity === 'rare' || def.rarity === 'legendary').slice(0, 1),
      ];
      while (draftDefinitions.length < 5) {
        const fallback = draftPool.find((def) => !draftDefinitions.includes(def));
        if (!fallback) break;
        draftDefinitions.push(fallback);
      }
      const draftOptions = draftDefinitions.map((def) => ({ ...def, id: generateRandomId(), agirlik: getCardWeight(def) }));

      return {
        ...state,
        gamePhase: 'deckBuild',
        currentNode: selectedNode.type,
        nodeType: selectedNode.type,
        enemy,
        enemyArchetype,
        enemyBehavior,
        enemyCanLie,
        draftOptions,
        draftPicks: 0,
      };
    });
  },

  resolveEvent: (choiceIndex: number) => {
    set((state) => {
      if (state.gamePhase !== 'event') return state;
      const resolved = EventResolver.resolveEvent(state, choiceIndex);
      return {
        ...resolved,
        gamePhase: 'mapSelection',
        currentNode: null,
        nodeType: null,
        runFloor: state.runFloor + 1,
        availableNodes: generateAvailableNodes(state.runFloor + 1),
      };
    });
  },

  resolveRest: (choiceIndex: number) => {
    set((state) => {
      if (state.gamePhase !== 'rest') return state;
      const resolved = RestResolver.resolveRest(state, choiceIndex);
      return {
        ...resolved,
        gamePhase: 'mapSelection',
        currentNode: null,
        nodeType: null,
        runFloor: state.runFloor + 1,
        availableNodes: generateAvailableNodes(state.runFloor + 1),
      };
    });
  },

  chooseDraftCard: (cardId: string) => {
    set((state) => {
      if (state.gamePhase !== 'deckBuild') return state;
      const picked = state.draftOptions.find((card) => card.id === cardId);
      if (!picked) return state;
      const weight = picked.agirlik ?? getCardWeight(picked);
      if (weight > state.draftBudget) return { ...state, battleLogs: [...state.battleLogs, `${picked.isim} fazla ağır. Kalan yük: ${state.draftBudget}.`] };
      const draftOptions = state.draftOptions.filter((card) => card.id !== cardId);
      const deck = [...state.deck, picked];
      if (state.draftPicks + 1 < 3) {
        return { ...state, deck, draftOptions, draftPicks: state.draftPicks + 1, draftBudget: state.draftBudget - weight, battleLogs: [...state.battleLogs, `${picked.isim} desteye eklendi. Yük: ${weight}.`] };
      }

      const openingDecision = behaviorIntent(state.enemy, state.enemyBehavior, state.player, 0, 'none', 0, state.enemyCanLie);
      const enemyBlock = 0;
      const shuffledDeck = shuffle([...deck, ...state.hand, ...state.discardPile]);
      return {
        ...state,
        gamePhase: 'combat',
        draftOptions: [],
        draftPicks: 3,
        draftBudget: state.draftBudget - weight,
        starterDraftComplete: true,
        enemyIntent: openingDecision.intent,
        enemyIntentValue: openingDecision.intent.estimatedDamage ?? 0,
        enemyBlock,
        currentEnergy: state.maxEnergy,
        playerBlock: 0,
        hand: shuffledDeck.slice(0, state.drawCount),
        deck: shuffledDeck.slice(state.drawCount),
        discardPile: [],
        playerStatuses: [],
        enemyStatuses: [],
        isPlayerTurn: true,
        round: 1,
        lastPlayerSignal: 'none',
        battleLogs: [...state.battleLogs, `${picked.isim} desteye eklendi. Savaş başlıyor!`],
      };
    });
  }
}));