import type { Character } from '../types/game';
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
  gamePhase: 'combat' | 'shop' | 'victory';
  // Reward options (shown in victory phase)
  rewardOptions: Card[];

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
  gamePhase: 'combat',
  rewardOptions: [],

  initializeGame: () => {
    set((state) => {
      if (state.initialized) return state;
      const deck = createInitialDeck();
      // draw initial hand
      const hand = deck.slice(0, state.drawCount);
      const remainingDeck = deck.slice(state.drawCount);
      return {
        ...state,
        deck: remainingDeck,
        hand,
        currentEnergy: state.maxEnergy,
        initialized: true,
        gamePhase: 'combat',
        battleLogs: ['Oyun başlatıldı. Destek hazırlanıyor...'],
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

      if (enemy.mevcutCan > 0 && state.gamePhase === 'combat') {
        // Enemy AI: roll d20 + enemy.gucCarpani vs player AC
        const enemyRoll = Math.floor(Math.random() * 20) + 1;
        const enemyTotal = enemyRoll + enemy.gucCarpani;
        const playerAC = player.zirhSinifi;
        let log = '';
        if (enemyTotal >= playerAC) {
          // Enemy hits: roll damage die (d6 for simplicity) + enemy.gucCarpani
          const dmgRoll = Math.floor(Math.random() * 6) + 1; // d6
          const damage = dmgRoll + enemy.gucCarpani;
          // Apply damage to player
          const newHp = Math.max(0, player.mevcutCan - damage);
          player = { ...player, mevcutCan: newHp };
          log = `Düşman Zar: ${enemyRoll}. Başarılı saldırı, ${damage} hasar vuruldu!`;
        } else {
          log = `Düşman Zar: ${enemyRoll}. Saldırısı kansırdi!`;
        }
        battleLogs = [...battleLogs, log];
        // Check if player died after enemy attack
        if (player.mevcutCan <= 0) {
          // Transition to game over
          return {
            ...state,
            battleLogs: [...battleLogs, `Oyuncu ölü! Oyun bitti.`],
            gamePhase: 'gameOver',
          };
        }
      }
      // If enemy died after potential attack (or was already dead), transition to victory
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
          rewardOptions: rewards,
        };
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

      // Determine hit: d20 + player.gucCarpani vs enemy AC
      const attackRoll = Math.floor(Math.random() * 20) + 1;
      const totalAttack = attackRoll + state.player.gucCarpani;
      const enemyAC = state.enemy.zirhSinifi;
      let damage = 0;
      let log = '';

      if (totalAttack >= enemyAC) {
        // Hit: roll damage die based on card.zarTuru
        const sides = parseInt(card.zarTuru.substring(1)); // e.g., 'd6' -> 6
        const damageRoll = Math.floor(Math.random() * sides) + 1;
        // Damage = die roll + card.baseHasar + player.gucCarpani
        damage = damageRoll + card.baseHasar + state.player.gucCarpani;
        // Apply damage to enemy
        const targetChar = state.enemy;
        const newHp = Math.max(0, targetChar.mevcutCan - damage);
        const newEnemy = { ...targetChar, mevcutCan: newHp };
        log = `Zar: ${attackRoll}. Başarılı saldırı, ${damage} hasar vuruldu!`;
        // Update enemy in state
        return {
          ...state,
          hand: newHand,
          discardPile: newDiscard,
          currentEnergy: newEnergy,
          enemy: newEnemy,
          battleLogs: [...state.battleLogs, log],
        };
      } else {
        log = `Zar: ${attackRoll}. Düşmanın zırhı aşılamadı!`;
        return {
          ...state,
          hand: newHand,
          discardPile: newDiscard,
          currentEnergy: newEnergy,
          battleLogs: [...state.battleLogs, log],
        };
      }
    });
  },

  addLog: (message: string) => {
    set((state) => ({
      battleLogs: [...state.battleLogs, message],
    }));
  },

  applyDamage: (target: 'player' | 'enemy', amount: number) => {
    set((state) => {
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
      // Reset enemy to default (could be scaled based on player level, but we keep simple)
      const enemy = defaultEnemy;
      return {
        ...state,
        enemy,
        gamePhase: 'combat',
        isPlayerTurn: true, // player starts combat
        // Optionally clear battle logs? Keep them.
      };
    });
  },
}));