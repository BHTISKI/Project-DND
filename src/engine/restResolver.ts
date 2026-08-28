// Rest resolver for handling rest nodes
import type { GameState } from '../state/store';

export class RestResolver {
  static resolveRest(gameState: GameState, choiceIndex: number): GameState {
    const state = { ...gameState }

    switch (choiceIndex) {
      case 0: // Heal option
        const healCost = 25; // Same as shop heal
        const healAmount = 4; // Same as shop heal

        if (state.gold >= healCost) {
          const newHp = Math.min(state.player.maksimumCan, state.player.mevcutCan + healAmount);
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

        // Remove a random card from deck
        const removeIndex = Math.floor(Math.random() * state.deck.length);
        const [removedCard] = state.deck.splice(removeIndex, 1);

        return {
          ...state,
          deck: [...state.deck],
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