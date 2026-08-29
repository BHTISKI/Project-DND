// Zustand store tanımı ve oyun durumu yönetimi
import { sampleCardDefs } from '../types/game';
import type { Card, CardEffect, Character, EnemyArchetypeId, EnemyIntent, NodeType, RunMapState, StatusEffect, StatusId } from '../types/game';
import { create } from 'zustand';
import { rollDie } from "../engine/dice";
import { generateRandomId } from '../utils/id';
import { averageDie } from '../utils/math';

// Helper to shuffle array (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


function calculateUpgradeCost(rarity: Card['rarity'] | undefined, victoryCount: number): number {
  const baseCost = rarity === 'rare' ? 80 : rarity === 'uncommon' ? 60 : 40;
  return baseCost + Math.floor(baseCost * victoryCount * 0.1);
}

function enhanceEffect(effect: CardEffect): CardEffect {
  switch (effect.kind) {
    case 'attack':
    case 'damage':
      return {
        ...effect,
        damageBonus: (effect.damageBonus ?? 0) + 2,
      };
    case 'block':
      if (effect.amount !== undefined) {
        return {
          ...effect,
          amount: (effect.amount ?? 0) + 2,
        };
      } else if (effect.die) {
        // Change die to next in sequence
        const dieMap: Record<string, string> = {
          'd4': 'd6',
          'd6': 'd8',
          'd8': 'd10',
          'd10': 'd12',
          'd12': 'd20',
        };
        const newDie = dieMap[effect.die] || effect.die;
        return {
          ...effect,
          die: newDie,
        };
      }
      return effect;
    case 'heal':
      if (effect.amount !== undefined) {
        return {
          ...effect,
          amount: (effect.amount ?? 0) + 2,
        };
      } else if (effect.die) {
        const dieMap: Record<string, string> = {
          'd4': 'd6',
          'd6': 'd8',
          'd8': 'd10',
          'd10': 'd12',
          'd12': 'd20',
        };
        const newDie = dieMap[effect.die] || effect.die;
        return {
          ...effect,
          die: newDie,
        };
      }
      return effect;
    case 'status':
      return {
        ...effect,
        duration: (effect.duration ?? 0) + 1,
        stacks: (effect.stacks ?? 1) + 1,
      };
    case 'draw':
      return {
        ...effect,
        amount: (effect.amount ?? 0) + 1,
      };
    case 'energy':
      return {
        ...effect,
        amount: (effect.amount ?? 0) + 1,
      };
    case 'skip':
      return effect;
    default:
      return effect;
  }
}


const enemyArchetypes: Record<EnemyArchetypeId, { name: string; hp: number; ac: number; power: number; attackDie: string; blockDie: string; special: 'heal' | 'damage' | 'weakened'; weights: [number, number, number] }> = {
  goblin: { name: 'Goblin', hp: 7, ac: 11, power: 1, attackDie: 'd6', blockDie: 'd4', special: 'weakened', weights: [0.65, 0.2, 0.15] },
  guardian: { name: 'Muhafız', hp: 11, ac: 13, power: 0, attackDie: 'd8', blockDie: 'd6', special: 'heal', weights: [0.3, 0.55, 0.15] },
  mage: { name: 'Büyücü', hp: 8, ac: 10, power: 2, attackDie: 'd4', blockDie: 'd3', special: 'damage', weights: [0.35, 0.15, 0.5] },
};

function chooseArchetype(victoryCount: number): EnemyArchetypeId {
  return (['goblin', 'guardian', 'mage'] as EnemyArchetypeId[])[victoryCount % 3];
}

function createEnemy(archetypeId: EnemyArchetypeId, tier: number): Character {
  const archetype = enemyArchetypes[archetypeId];
  const hp = archetype.hp + tier * (archetypeId === 'guardian' ? 3 : 2);
  return { id: `enemy-${tier}`, isim: archetype.name, mevcutCan: hp, maksimumCan: hp, zirhSinifi: archetype.ac + Math.floor(tier / 2), gucCarpani: archetype.power + Math.floor(tier / 3) };
}

function generateEnemyIntent(enemy: Character, archetypeId: EnemyArchetypeId, previous?: EnemyIntent | null): { intent: EnemyIntent; value: number; block: number } {
  const archetype = enemyArchetypes[archetypeId];
  const weights = [...archetype.weights];
  if (previous?.type === 'attack') weights[0] *= 0.7;
  if (previous?.type === 'defend') weights[1] *= 0.7;
  const roll = Math.random() * (weights[0] + weights[1] + weights[2]);
  if (roll < weights[0]) {
    const value = averageDie(archetype.attackDie) + enemy.gucCarpani;
    return { intent: { type: 'attack', estimatedDamage: value, effectKey: 'archetype-attack' }, value, block: 0 };
  }
  if (roll < weights[0] + weights[1]) {
    const block = rollDie(parseInt(archetype.blockDie.slice(1), 10));
    return { intent: { type: 'defend', estimatedBlock: block, effectKey: 'archetype-defend' }, value: block, block };
  }
  if (archetype.special === 'heal') {
    const value = averageDie('d4');
    return { intent: { type: 'special', estimatedHeal: value, effectKey: 'heal' }, value, block: 0 };
  }
  if (archetype.special === 'damage') {
    const value = averageDie('d6') + enemy.gucCarpani;
    return { intent: { type: 'special', estimatedDamage: value, effectKey: 'arcane-blast' }, value, block: 0 };
  }
  return { intent: { type: 'special', effectKey: 'weakened' }, value: 0, block: 0 };
}

function addStatus(statuses: StatusEffect[], effect: StatusEffect): StatusEffect[] {
  const existing = statuses.find((status) => status.id === effect.id);
  if (!existing) return [...statuses, effect];
  return statuses.map((status) => status.id === effect.id
    ? { ...status, duration: Math.max(status.duration, effect.duration), stacks: Math.min(3, status.stacks + effect.stacks), value: effect.value ?? status.value }
    : status);
}

function statusValue(statuses: StatusEffect[], id: StatusId): number {
  return statuses.find((status) => status.id === id)?.value ?? 0;
}

function tickStatuses(statuses: StatusEffect[], target: 'player' | 'enemy', character: Character): { statuses: StatusEffect[]; character: Character; log: string[] } {
  let updatedCharacter = character;
  const log: string[] = [];
  const remaining = statuses.flatMap((status) => {
    if (status.id === 'poisoned') {
      const damage = Math.max(1, status.value ?? 1) * status.stacks;
      updatedCharacter = { ...updatedCharacter, mevcutCan: Math.max(0, updatedCharacter.mevcutCan - damage) };
      log.push(`${target === 'player' ? 'Oyuncu' : 'Düşman'} zehirden ${damage} hasar aldı.`);
    }
    const nextDuration = status.duration - 1;
    return nextDuration > 0 ? [{ ...status, duration: nextDuration }] : [];
  });
  return { statuses: remaining, character: updatedCharacter, log };
}

export interface GameState extends RunMapState {
  player: Character;
  enemy: Character;
  isPlayerTurn: boolean;
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
  // Battle logs
  battleLogs: string[];
  // Game initialization flag
  initialized: boolean;
  // Game phase
  gamePhase: 'combat' | 'shop' | 'victory' | 'gameOver' | 'mapSelection' | 'event' | 'rest' | 'boss';
  // Reward options (shown in victory phase)
  rewardOptions: Card[];
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
  removeCardFromDeck: (cardId: string) => void;
  upgradeCard: (cardId: string) => void;
  startNextCombat: () => void;
  selectNode: (nodeId: string) => void;
}


const defaultPlayer: Character = {
  id: 'player-1',
  isim: 'Ero',
  mevcutCan: 10,
  maksimumCan: 10,
  zirhSinifi: 12,
  gucCarpani: 2,
};

const defaultEnemy = createEnemy('goblin', 0);

function generateAvailableNodes(floor: number): Array<{ type: NodeType; id: string }> {
  const types: NodeType[] = floor > 0 && floor % 3 === 0
    ? ['boss', 'elite', 'shop']
    : ['combat', 'combat', 'shop'];
  return types.map((type, index) => ({ type, id: `floor-${floor}-${type}-${index}` }));
}

// Function to create initial deck (e.g., 5 copies of each)
function createInitialDeck(): Card[] {
  return shuffle(sampleCardDefs.slice(0, 7).map((def) => ({ ...def, id: generateRandomId() })));
}

// Get 3 random unique cards from sampleCardDefs
function getRandomRewards(): Card[] {
  const shuffled = shuffle([...sampleCardDefs]);
  return shuffled.slice(0, 3).map((def) => ({
    ...def,
    id: generateRandomId(),
  }));
}

export const useGameStore = create<GameState>((set) => ({
  player: defaultPlayer,
  enemy: defaultEnemy,
  isPlayerTurn: true,
  maxEnergy: 3,
  currentEnergy: 3,
  deck: [],
  hand: [],
  discardPile: [],
  drawCount: 5,
  gold: 50, // starting gold
  battleLogs: [],
  initialized: false,
  playerBlock: 0,
  enemyBlock: 0,
  enemySkipNextTurn: false,
  victoryCount: 0,
  gamePhase: 'mapSelection',
  rewardOptions: [],
  enemyIntent: null,
  enemyIntentValue: 0,
  enemyArchetype: 'goblin',
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
        gamePhase: 'mapSelection',
        currentNode: null,
        availableNodes: generateAvailableNodes(0),
        runFloor: 0,
        nodeType: null,
        battleLogs: ['Oyun başlatıldı. Destek hazırlanıyor...'],
        playerBlock: 0,
        enemyBlock,
        enemySkipNextTurn: false,
        victoryCount: 0,
        enemyIntent: intent,
        enemyIntentValue: value,
        enemyArchetype: 'goblin',
        playerStatuses: [],
        enemyStatuses: [],
        comboChain: [],
        comboCount: 0,
        nextDamageBonus: 0,
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
      const newDiscard = [...state.discardPile, ...state.hand];
      // 2. Draw new hand
      let deck = state.deck;
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
      const currentEnergy = state.maxEnergy;

      // 4. Enemy turn processing (if enemy alive)
      let isPlayerTurn = true; // after enemy turn we return to player
      let battleLogs = [...state.battleLogs];
      let player = state.player;
      let enemy = state.enemy;
      let playerBlock = state.playerBlock;
      let enemySkipNextTurn = state.enemySkipNextTurn;
      let enemyStatuses = state.enemyStatuses;
      let playerStatuses = state.playerStatuses;

      const enemyTick = tickStatuses(enemyStatuses, 'enemy', enemy);
      enemyStatuses = enemyTick.statuses;
      enemy = enemyTick.character;
      battleLogs = [...battleLogs, ...enemyTick.log];

      // Check if enemy should skip this turn
      if (enemySkipNextTurn) {
        enemySkipNextTurn = false;
        battleLogs = [...battleLogs, `Düşman etkili bir etkiden kaynaklanarak turunu atlandı!`];
      } else if (enemy.mevcutCan > 0 && state.gamePhase === 'combat') {
        // Process enemy intent
        switch (state.enemyIntent?.type) {
          case 'attack':
            // Enemy AI: roll d20 + enemy.gucCarpani vs player AC
            const enemyRoll = Math.floor(Math.random() * 20) + 1;
            const isCritHit = enemyRoll === 20;
            const isCritFail = enemyRoll === 1;
            const enemyTotal = enemyRoll + enemy.gucCarpani;
            const playerAC = player.zirhSinifi;
            let damage = 0;
            let hit = false;

            if (isCritFail) {
              // Critical failure: automatic miss
              hit = false;
            } else if (isCritHit) {
              // Critical hit: automatic hit
              hit = true;
            } else {
              // Normal hit check
              hit = enemyTotal >= playerAC;
            }

            let blockUsed = 0;
            let log = '';

            if (hit) {
              // Enemy hits: roll damage die (d6 for simplicity)
              const dmgRoll = Math.floor(Math.random() * 6) + 1; // d6
              let baseDamage = dmgRoll; // enemy's base damage from die
              if (isCritHit) {
                // Double the die on critical hit
                baseDamage = dmgRoll * 2;
              }
              // Add enemy's damage modifier
              damage = baseDamage + enemy.gucCarpani;
              if (statusValue(enemyStatuses, 'weakened') > 0) damage = Math.max(0, damage - statusValue(enemyStatuses, 'weakened'));
              if (statusValue(playerStatuses, 'vulnerable') > 0) damage = Math.ceil(damage * 1.25);
              // Apply player's block to reduce damage
              if (playerBlock > 0) {
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
              const newHp = Math.max(0, player.mevcutCan - damage);
              player = { ...player, mevcutCan: newHp };
              // Build log message
              let hitText = isCritHit ? 'KRİTİK VURUŞ!' : 'Başarılı saldırı';
              log = `Düşman Zar: ${enemyRoll}. ${hitText} ${damage} hasar vuruldu!`;
              if (blockUsed > 0) {
                log += ` (Blok ${blockUsed} hasarını engelledi)`;
              }
            } else {
              let hitText = isCritFail ? 'KRİTİK BAŞARISIZLIK! Saldırı tamamen başarısız oldu.' : 'Saldırısı kansızdı!';
              log = `Düşman Zar: ${enemyRoll}. ${hitText}`;
            }

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
              };
            }
            break;

          case 'defend':
            // Enemy defends: set a block value for itself to reduce incoming damage from player's next attack
            // Note: This block will be used during the player's next attack (in playCard)
            // We do not change enemyBlock here because it is already set from the previous state
            // (set at the start of the player turn). We just log that the enemy is defending.
            battleLogs = [...battleLogs, `Düşman savunma hazırlıyor!`];
            break;

          case 'special':
            if (state.enemyArchetype === 'mage') {
              const damage = rollDie(6) + enemy.gucCarpani;
              player = { ...player, mevcutCan: Math.max(0, player.mevcutCan - damage) };
              battleLogs = [...battleLogs, `Büyücü gizemli bir patlamayla ${damage} hasar verdi.`];
            } else if (state.enemyArchetype === 'goblin') {
              playerStatuses = addStatus(playerStatuses, { id: 'weakened', duration: 2, stacks: 1, value: 1 });
              battleLogs = [...battleLogs, `Goblin hileli hamleyle oyuncuyu güçsüzleştirdi.`];
            } else {
              const healRoll = rollDie(4);
              enemy = { ...enemy, mevcutCan: Math.min(enemy.maksimumCan, enemy.mevcutCan + healRoll) };
              battleLogs = [...battleLogs, `Muhafız ${healRoll} can iyileştirdi.`];
            }
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
        return {
          ...state,
          deck,
          hand,
          discardPile,
          currentEnergy,
          isPlayerTurn,
          player,
          enemy,
          battleLogs,
          gamePhase: 'mapSelection',
          victoryCount: state.victoryCount + 1,
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
        };
      }

      // After enemy turn, generate new intent for the next player turn
      const { intent, value, block: newEnemyBlock } = generateEnemyIntent(enemy, state.enemyArchetype, state.enemyIntent);

      return {
        ...state,
        deck,
        hand,
        discardPile,
        currentEnergy,
        isPlayerTurn,
        player,
        enemy,
        battleLogs,
        playerBlock: 0, // reset player block
        enemyBlock: newEnemyBlock, // set for next player turn based on new intent
        enemySkipNextTurn,
        enemyIntent: intent,
        enemyIntentValue: value,
        playerStatuses,
        enemyStatuses,
        comboChain: [],
        comboCount: 0,
        nextDamageBonus: 0,
      };
    });
  },

  playCard: (cardId: string) => {
    set((state) => {
      // Only allow playing in combat phase and player turn
      if (!state.isPlayerTurn || state.gamePhase !== 'combat') {
        return state;
      }
      // Find card in hand
      const cardIndex = state.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        console.warn('Card not found in hand');
        return state;
      }
      const card = state.hand[cardIndex];

      // Check energy
      if (state.currentEnergy < card.manaBedeli) {
        // Not enough energy
        const log = `Yetersiz enerji! ${card.isim} oynatılamadı (gerekli: ${card.manaBedeli}, mevcut: ${state.currentEnergy})`;
        return { ...state, battleLogs: [...state.battleLogs, log] };
      }

      // Remove card from hand, add to discard
      const newHand = [...state.hand];
      newHand.splice(cardIndex, 1);
      const newDiscard = [...state.discardPile, card];
      let deck = state.deck;

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

      if (card.effects) {
        const previousTag = state.comboChain[state.comboChain.length - 1];
        const currentTag = card.tags?.[0] ?? card.tip;
        if (previousTag && previousTag !== currentTag) {
          updatedComboCount += 1;
          updatedNextDamageBonus += previousTag === 'skill' && currentTag === 'attack' ? 2 : previousTag === 'defend' && currentTag === 'attack' ? 1 : 0;
        }
        updatedComboChain = [currentTag].slice(-2);
        const effectLogs: string[] = [];
        for (const effect of card.effects as CardEffect[]) {
          if (effect.kind === 'attack' || effect.kind === 'damage') {
            let hit = true;
            let attackRoll = 0;
            if (effect.kind === 'attack' && !effect.ignoresArmor) {
              attackRoll = rollDie(20);
              hit = attackRoll !== 1 && (attackRoll === 20 || attackRoll + state.player.gucCarpani >= updatedEnemy.zirhSinifi);
            }
            if (!hit) {
              effectLogs.push(`Zar: ${attackRoll}. Saldırı başarısız oldu.`);
              updatedComboChain = [];
              continue;
            }
            const die = effect.die ?? card.zarTuru;
            let damage = rollDie(parseInt(die.slice(1), 10)) + card.baseHasar + (effect.damageBonus ?? 0) + state.player.gucCarpani + updatedNextDamageBonus;
            if (statusValue(updatedPlayerStatuses, 'empowered') > 0) damage += statusValue(updatedPlayerStatuses, 'empowered');
            if (statusValue(updatedEnemyStatuses, 'vulnerable') > 0) damage = Math.ceil(damage * 1.25);
            if (updatedEnemyBlock > 0) {
              damage = Math.max(0, damage - updatedEnemyBlock);
              updatedEnemyBlock = 0;
            }
            updatedEnemy = { ...updatedEnemy, mevcutCan: Math.max(0, updatedEnemy.mevcutCan - damage) };
            effectLogs.push(`${card.isim} ${damage} hasar verdi${updatedComboCount > state.comboCount ? ` (Kombo ${updatedComboCount})` : ''}.`);
            updatedNextDamageBonus = 0;
          } else if (effect.kind === 'block') {
            updatedPlayerBlock = effect.amount ?? (effect.die ? rollDie(parseInt(effect.die.slice(1), 10)) : 0);
            effectLogs.push(`${card.isim} ${updatedPlayerBlock} blok kazandırdı.`);
          } else if (effect.kind === 'heal') {
            const target = effect.target === 'enemy' ? updatedEnemy : updatedPlayer;
            const amount = effect.amount ?? (effect.die ? rollDie(parseInt(effect.die.slice(1), 10)) : 0);
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
          }
        }
        log = effectLogs.join(' ');
      }

      // Apply damage to enemy if any (from attack or yetenek that dealt damage)
      // Note: For yetenek that dealt damage, we already updated the enemy above.
      // For attack, we updated enemy in the case block.

      // Return updated state
      if (state.enemy.mevcutCan > 0 && updatedEnemy.mevcutCan <= 0) {
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
          comboChain: updatedComboChain,
          comboCount: updatedComboCount,
          nextDamageBonus: updatedNextDamageBonus,
          battleLogs: [...state.battleLogs, log],
          gamePhase: 'mapSelection',
          gold: state.gold + 20 + state.victoryCount * 5,
          victoryCount: state.victoryCount + 1,
          rewardOptions: getRandomRewards(),
          runFloor: state.runFloor + 1,
          currentNode: null,
          availableNodes: generateAvailableNodes(state.runFloor + 1),
          nodeType: null,
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
        comboChain: updatedComboChain,
        comboCount: updatedComboCount,
        nextDamageBonus: updatedNextDamageBonus,
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
      // Remove the card from deck
      const newDeck = [...state.deck];
      newDeck.splice(cardIndex, 1);
      return {
        ...state,
        deck: newDeck,
        gold: state.gold - removeCost,
        battleLogs: [...state.battleLogs, `Kart deste silindi! (${removeCost} altın)`],
      };
    });
  },

  // Start next combat after shop (reset enemy to default or scaled?)
  upgradeCard: (cardId: string) => {
    set((state) => {
      const cardIndex = state.deck.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        console.warn('Card not found in deck for upgrade');
        return state;
      }
      const card = state.deck[cardIndex];
      if (card.isUpgraded) {
        console.warn('Card is already upgraded');
        return state;
      }
      const cost = calculateUpgradeCost(card.rarity, state.victoryCount);
      if (state.gold < cost) {
        console.warn(`Not enough gold. Need ${cost} gold.`);
        return state;
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
      // Generate initial enemy intent for the new combat
      const { intent, value, block: enemyBlock } = generateEnemyIntent(scaledEnemy, enemyArchetype);

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
        enemyIntent: intent,
        enemyIntentValue: value,
        enemyArchetype,
        // Reset player state for new combat
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

      const enemyArchetype = chooseArchetype(state.victoryCount);
      const baseEnemy = createEnemy(enemyArchetype, state.runFloor);
      const enemy = selectedNode.type === 'elite'
        ? { ...baseEnemy, mevcutCan: baseEnemy.maksimumCan * 1.5, maksimumCan: baseEnemy.maksimumCan * 1.5, zirhSinifi: baseEnemy.zirhSinifi + 1, gucCarpani: baseEnemy.gucCarpani + 0.5 }
        : baseEnemy;
      const { intent, value, block: enemyBlock } = generateEnemyIntent(enemy, enemyArchetype);
      const shuffledDeck = shuffle([...state.deck, ...state.hand, ...state.discardPile]);

      return {
        ...state,
        gamePhase: 'combat',
        currentNode: selectedNode.type,
        nodeType: selectedNode.type,
        enemy,
        enemyArchetype,
        enemyIntent: intent,
        enemyIntentValue: value,
        enemyBlock,
        currentEnergy: state.maxEnergy,
        playerBlock: 0,
        hand: shuffledDeck.slice(0, state.drawCount),
        deck: shuffledDeck.slice(state.drawCount),
        discardPile: [],
        playerStatuses: [],
        enemyStatuses: [],
        isPlayerTurn: true,
      };
    });
  }
}));