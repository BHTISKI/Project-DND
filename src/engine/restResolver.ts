// Bu dosya src/engine/restResolver.ts için ilgili kodları içerir.
// Rest resolver for handling rest nodes
// Mantık: dinlenme düğümleri için HP iyileşmesi ve blok yönetimi
// Mantık: dinlenme düğümleri için HP iyileşmesi ve blok yönetimi
import type { GameState } from '../state/store';
import { useGameStore } from '../state/store';

export class RestResolver {
  static resolveRest(gameState: GameState, choiceIndex: number): GameState {
    const state = { ...gameState }

    switch (choiceIndex) {
      case 0: // Heal option
        const healCost = 25; // Same as shop heal
        const healAmount = 4; // Same as shop heal

        if (state.gold >= healCost) {
          const newHp = Math.min(state.player.maksimumCan, state.player.mevcutCan + healAmount);
          // Add player dialog for heal choice
          setTimeout(() => {
            useGameStore.getState().addPlayerDialog('Bir dinlenme yapmam lazım, canımı toparlayayım.');
          }, 100);

          return {
            ...state,
            gold: state.gold - healCost,
            player: {
              ...state.player,
              mevcutCan: newHp
            },
            battleLogs: [
              ...state.battleLogs,
              `Oyuncu ${healAmount} can iyileştirdi! (${healCost} altın)`
            ]
          };
        }
        // Not enough gold
        return {
          ...state,
          battleLogs: [
            ...state.battleLogs,
            `Yetersiz altın! Can iyileştirmek için ${healCost} altın gerekiyor.`
          ]
        };

      case 1: // Remove card option
        // For simplicity, we'll remove a random card from the deck
        // In a full implementation, this would show a UI to select which card to remove
        if (state.deck.length === 0) {
          return {
            ...state,
            battleLogs: [
              ...state.battleLogs,
              "Desteğinizde kaldırılacak kart bulunmuyor."
            ]
          };
        }

        // Remove a random card from deck - FIXED: Use immutable operation
        const removeIndex = Math.floor(Math.random() * state.deck.length);
        const deckCopy = [...state.deck];
        const [removedCard] = deckCopy.splice(removeIndex, 1);
        // Add player dialog for card removal choice
        setTimeout(() => {
          useGameStore.getState().addPlayerDialog(`${removedCard.isim} kartı bu destede işime yaramıyor, çıkarıyorum.`);
        }, 100);

        return {
          ...state,
          deck: deckCopy,
          battleLogs: [
            ...state.battleLogs,
            `${removedCard.isim} kartı desteğinizden kaldırıldı.`
          ]
        };

      default:
        // Default to heal if choice index is invalid
        return RestResolver.resolveRest(state, 0);
    }
  }
}