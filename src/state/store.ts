import type { Character, EnemyIntent } from '../types/game';
import type { Card } from '../types/game';
import { create } from 'zustand';

// Helper to shuffle array (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper to generate enemy intent and value
function generateEnemyIntent(enemy: Character): { intent: EnemyIntent; value: number } {
  const roll = Math.random();
  let intent: EnemyIntent = { type: 'attack' };
  let value = 0;

  if (roll < 0.6) {
    // Keep the preview aligned with the actual d6 damage roll.
    value = 3.5 + enemy.gucCarpani;
    intent = { type: 'attack', estimatedDamage: value };
  } else if (roll < 0.9) {
    // Defense uses the same d4 range when the intent is created.
    value = 2.5;
    intent = { type: 'defend', estimatedBlock: value };
  } else {
    // Special currently heals by the same d4 range.
    value = 2.5;
    intent = { type: 'special', estimatedHeal: value };
  }

  return { intent, value };
}

interface GameState {
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
  gamePhase: 'combat' | 'shop' | 'victory' | 'gameOver';
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
  // Actions
  initializeGame: () => void;
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
  startNextCombat: () => void;
}


const defaultPlayer: Character = {
  id: 'player-1',
  isim: 'Ero',
  mevcutCan: 10,
  maksimumCan: 10,
  zirhSinifi: 12,
  gucCarpani: 2,
};

const defaultEnemy: Character = {
  id: 'enemy-1',
  isim: 'Goblin',
  mevcutCan: 7,
  maksimumCan: 7,
  zirhSinifi: 11,
  gucCarpani: 1,
};

// Sample card definitions (baseHasar 0, mana cost as given)
const sampleCardDefs: Omit<Card, 'id'>[] = [
  { isim: 'Ateş Topu', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, zarTuru: 'd6' },
  { isim: 'Hızlı Saldırı', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4' },
  { isim: 'Buhar Nefesi', tip: 'yetenek', manaBedeli: 3, baseHasar: 0, zarTuru: 'd8' },
  { isim: 'Kalkan Sihri', tip: 'savunma', manaBedeli: 2, baseHasar: 0, zarTuru: 'd4' },
  { isim: 'Büyüleyici Çukur', tip: 'yetenek', manaBedeli: 4, baseHasar: 0, zarTuru: 'd10' },
];

// Function to create initial deck (e.g., 5 copies of each)
function createInitialDeck(): Card[] {
  const deck: Card[] = [];
  sampleCardDefs.forEach((def) => {
    for (let i = 0; i < 5; i++) {
      deck.push({
        ...def,
        id: Math.random().toString(36).substr(2, 9),
      });
    }
  });
  return shuffle(deck);
}

// Get 3 random unique cards from sampleCardDefs
function getRandomRewards(): Card[] {
  const shuffled = shuffle([...sampleCardDefs]);
  return shuffled.slice(0, 3).map((def) => ({
    ...def,
    id: Math.random().toString(36).substr(2, 9),
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
  gamePhase: 'combat',
  rewardOptions: [],
  enemyIntent: null,
  enemyIntentValue: 0,

  initializeGame: () => {
    set((state) => {
      if (state.initialized) return state;
      const deck = createInitialDeck();
      // draw initial hand
      const hand = deck.slice(0, state.drawCount);
      const remainingDeck = deck.slice(state.drawCount);
      const { intent, value } = generateEnemyIntent(state.enemy);
      let enemyBlock = 0;
      if (intent.type === 'defend') {
        enemyBlock = Math.floor(Math.random() * 4) + 1; // d4
      }
      return {
        ...state,
        deck: remainingDeck,
        hand,
        currentEnergy: state.maxEnergy,
        initialized: true,
        gamePhase: 'combat',
        battleLogs: ['Oyun başlatıldı. Destek hazırlanıyor...'],
        playerBlock: 0,
        enemyBlock,
        enemySkipNextTurn: false,
        victoryCount: 0,
        enemyIntent: intent,
        enemyIntentValue: value,
      };
    });
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
                log += ` (Blok ${blockUsed} hasarını absorbed)`;
              }
            } else {
              let hitText = isCritFail ? 'KRİTİK BAŞARISIZLIK! Saldırı tamamen başarısız oldu.' : 'Saldırısı kansırdi!';
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
            // Enemy does a special action: heal itself
            // Roll a d4 for the heal amount
            const healRoll = Math.floor(Math.random() * 4) + 1; // d4
            const newEnemyHp = Math.min(enemy.maksimumCan, enemy.mevcutCan + healRoll);
            enemy = { ...enemy, mevcutCan: newEnemyHp };
            battleLogs = [...battleLogs, `Düşman özel hareket yapıyor! ${healRoll} can iyileşti.`];
            break;
        }
      }
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
          gamePhase: 'victory',
          victoryCount: state.victoryCount + 1,
          rewardOptions: rewards,
          playerBlock: 0,
          enemyBlock: 0,
          enemySkipNextTurn: false,
          enemyIntent: null,
          enemyIntentValue: 0,
        };
      }

      // After enemy turn, generate new intent for the next player turn
      const { intent, value } = generateEnemyIntent(enemy);
      let newEnemyBlock = 0;
      if (intent.type === 'defend') {
        newEnemyBlock = Math.floor(Math.random() * 4) + 1; // d4
      }

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

      // Spend energy
      const newEnergy = state.currentEnergy - card.manaBedeli;

      let log = '';
      let updatedPlayer = state.player;
      let updatedEnemy = state.enemy;
      let updatedPlayerBlock = state.playerBlock;
      let updatedEnemyBlock = state.enemyBlock; // current enemy block (from defend intent)
      let updatedEnemySkipNextTurn = state.enemySkipNextTurn;

      switch (card.tip) {
        case 'saldırı': {
          // Determine hit with critical rules
          const attackRoll = Math.floor(Math.random() * 20) + 1;
          const isCritHit = attackRoll === 20;
          const isCritFail = attackRoll === 1;
          const totalAttack = attackRoll + state.player.gucCarpani;
          const enemyAC = state.enemy.zirhSinifi;
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
              hit = totalAttack >= enemyAC;
          }

          if (hit) {
            // Roll damage die
            const sides = parseInt(card.zarTuru.substring(1)); // e.g., 'd6' -> 6
            const damageRoll = Math.floor(Math.random() * sides) + 1;
            // Base damage from die and card baseAsar
            let baseDamage = damageRoll + card.baseHasar;
            if (isCritHit) {
              // Double the die and baseHasar on critical hit
              baseDamage = damageRoll * 2 + card.baseHasar * 2;
            }
            // Add player's damage modifier
            damage = baseDamage + state.player.gucCarpani;
            // Apply enemy's block to reduce damage (if any)
            if (updatedEnemyBlock > 0) {
              if (updatedEnemyBlock >= damage) {
                // Enemy block absorbs all damage
                damage = 0;
                updatedEnemyBlock = 0; // block is used up
              } else {
                // Enemy block absorbs part of the damage
                damage -= updatedEnemyBlock;
                updatedEnemyBlock = 0; // block is used up
              }
            }
            // Apply damage to enemy
            const targetChar = state.enemy;
            const newHp = Math.max(0, targetChar.mevcutCan - damage);
            updatedEnemy = { ...targetChar, mevcutCan: newHp };
            if (isCritHit) {
              log = `Zar: ${attackRoll}. KRİTİK VURUŞ! ${damage} hasar vuruldu!`;
            } else {
              log = `Zar: ${attackRoll}. Başarılı saldırı, ${damage} hasar vuruldu!`;
            }
          } else {
            if (isCritFail) {
              log = `Zar: ${attackRoll}. KRİTİK BAŞARISIZLIK! Saldırı tamamen başarısız oldu.`;
            } else {
              log = `Zar: ${attackRoll}. Düşmanın zırhı aşılamadı!`;
            }
          }
          break;
        }
        case 'savunma': {
          // Roll the die for block amount
          const sides = parseInt(card.zarTuru.substring(1)); // e.g., 'd4' -> 4
          const blockRoll = Math.floor(Math.random() * sides) + 1;
          updatedPlayerBlock = blockRoll; // set block to this amount (does not stack)
          log = `${card.isim} oynandı! ${blockRoll} blok elde edildi.`;
          break;
        }
        case 'yetenek': {
          // Unique effect based on card name
          switch (card.isim) {
            case 'Ateş Topu': {
              // Deal damage ignoring enemy AC (like a magic missile)
              const sides = parseInt(card.zarTuru.substring(1)); // d6 -> 6
              const damageRoll = Math.floor(Math.random() * sides) + 1;
              let damage = damageRoll + 2; // fixed bonus
              if (updatedEnemyBlock > 0) {
                damage = Math.max(0, damage - updatedEnemyBlock);
                updatedEnemyBlock = 0;
              }
              const targetChar = state.enemy;
              const newHp = Math.max(0, targetChar.mevcutCan - damage);
              updatedEnemy = { ...targetChar, mevcutCan: newHp };
              log = `${card.isim} oynandı! ${damage} hasar vuruldu (zırhı yok sayarak)!`;
              break;
            }
            case 'Buhar Nefesi': {
              // Heal player
              const sides = parseInt(card.zarTuru.substring(1)); // d8 -> 8
              const healRoll = Math.floor(Math.random() * sides) + 1;
              const healAmount = healRoll; // heal for the roll amount
              const newHp = Math.min(state.player.maksimumCan, state.player.mevcutCan + healAmount);
              updatedPlayer = { ...state.player, mevcutCan: newHp };
              log = `${card.isim} oynandı! Oyuncu ${healAmount} can yeledi.`;
              break;
            }
            case 'Büyüleyici Çukur': {
              // Enemy skips next turn
              updatedEnemySkipNextTurn = true;
              log = `${card.isim} oynandı! Düşman sonraki turunu atlayacak.`;
              break;
            }
            default: {
              // Fallback: treat as attack (should not happen with current sample cards)
              const attackRoll = Math.floor(Math.random() * 20) + 1;
              const totalAttack = attackRoll + state.player.gucCarpani;
              const enemyAC = state.enemy.zirhSinifi;
              let damage = 0;
              if (totalAttack >= enemyAC) {
                const sides = parseInt(card.zarTuru.substring(1));
                const damageRoll = Math.floor(Math.random() * sides) + 1;
                damage = damageRoll + card.baseHasar + state.player.gucCarpani;
                const targetChar = state.enemy;
                const newHp = Math.max(0, targetChar.mevcutCan - damage);
                updatedEnemy = { ...targetChar, mevcutCan: newHp };
                log = `Zar: ${attackRoll}. Başarılı saldırı, ${damage} hasar vuruldu!`;
              } else {
                log = `Zar: ${attackRoll}. Düşmanın zırhı aşılamadı!`;
              }
              break;
            }
          }
          break;
        }
        default:
          // Should not happen
          log = `Bilinmeyen kart tipi: ${card.tip}`;
          break;
      }

      // Apply damage to enemy if any (from saldırmı or yetenek that dealt damage)
      // Note: For yetenek that dealt damage, we already updated the enemy above.
      // For saldırmı, we updated enemy in the case block.

      // Return updated state
      if (state.enemy.mevcutCan > 0 && updatedEnemy.mevcutCan <= 0) {
        return {
          ...state,
          hand: newHand,
          discardPile: newDiscard,
          currentEnergy: newEnergy,
          player: updatedPlayer,
          enemy: updatedEnemy,
          playerBlock: updatedPlayerBlock,
          enemyBlock: updatedEnemyBlock, // preserve enemy block (if any)
          enemySkipNextTurn: false,
          enemyIntent: null,
          enemyIntentValue: 0,
          battleLogs: [...state.battleLogs, log],
          gamePhase: 'victory',
          victoryCount: state.victoryCount + 1,
          rewardOptions: getRandomRewards(),
        };
      }

      return {
        ...state,
        hand: newHand,
        discardPile: newDiscard,
        currentEnergy: newEnergy,
        player: updatedPlayer,
        enemy: updatedEnemy,
        playerBlock: updatedPlayerBlock,
        enemyBlock: updatedEnemyBlock,
        enemySkipNextTurn: updatedEnemySkipNextTurn,
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
      if (state.gamePhase !== 'victory') return state;
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
      if (state.gamePhase !== 'victory') return state;
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
  startNextCombat: () => {
    set((state) => {
      if (state.gamePhase !== 'shop') return state;
      const victoryFactor = state.victoryCount;
      const scaledEnemy = {
        ...defaultEnemy,
        mevcutCan: defaultEnemy.mevcutCan + victoryFactor * 2,
        maksimumCan: defaultEnemy.maksimumCan + victoryFactor * 2,
        zirhSinifi: defaultEnemy.zirhSinifi + victoryFactor,
        gucCarpani: defaultEnemy.gucCarpani + Math.floor(victoryFactor * 0.5)
      };
      // Generate initial enemy intent for the new combat
      const { intent, value } = generateEnemyIntent(scaledEnemy);
      let enemyBlock = 0;
      if (intent.type === 'defend') {
        enemyBlock = Math.floor(Math.random() * 4) + 1; // d4
      }
      return {
        ...state,
        enemy: scaledEnemy,
        gamePhase: 'combat',
        isPlayerTurn: true, // player starts combat
        playerBlock: 0,
        enemyBlock,
        enemySkipNextTurn: false,
        enemyIntent: intent,
        enemyIntentValue: value,
        // Optionally clear battle logs? Keep them.
      };
    });
  }
}));