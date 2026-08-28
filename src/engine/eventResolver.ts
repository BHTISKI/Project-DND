// Event resolver for handling event nodes
import type { GameState } from '../state/store';
import type { Card } from '../types/game';

export class EventResolver {
  static resolveEvent(gameState: GameState, choiceIndex: number): GameState {
    const state = { ...gameState };

    // For now, implement simple event effects
    // In a full implementation, these would be more varied and complex
    switch (choiceIndex) {
      case 0: // Heal for gold cost
        const healCost = Math.max(10, state.gold * 0.1); // 10% of gold, minimum 10
        const healAmount = Math.min(4, state.player.maksimumCan - state.player.mevcutCan);

        if (state.gold >= healCost && healAmount > 0) {
          return {
            ...state,
            gold: state.gold - healCost,
            player: {
              ...state.player,
              mevcutCan: state.player.mevcutCan + healAmount
            },
            battleLogs: [
              ...state.battleLogs,
              `Oyuncu ${healAmount} can iyileştirdi! (${healCost} altın)`
            ]
          };
        }
        // If not enough gold or already at max HP, give small reward instead
        return {
          ...state,
          gold: state.gold + 10,
          battleLogs: [
            ...state.battleLogs,
            "Etkisiz벤! 10 altın buldunuz."
          ]
        };

      case 1: // Draw a card, remove a card
        // Draw a card
        let deck = [...state.deck];
        let hand = [...state.hand];
        let discardPile = [...state.discardPile];
        let drawn: Card[] = [];

        if (deck.length === 0 && discardPile.length > 0) {
          const combined = [...deck, ...discardPile];
          deck = EventResolver.shuffleArray(combined);
          discardPile = [];
        }

        if (deck.length > 0) {
          drawn = deck.slice(0, 1);
          deck = deck.slice(1);
          hand = [...hand, ...drawn];
        }

        // Remove a random card from hand if any
        if (hand.length > 0) {
          const removeIndex = Math.floor(Math.random() * hand.length);
          const [removedCard] = hand.splice(removeIndex, 1);
          discardPile = [...discardPile, removedCard];

          return {
            ...state,
            deck,
            hand,
            discardPile,
            battleLogs: [
              ...state.battleLogs,
              `Bir kart çekip bir kart kaldırdınız. Çekilen: ${drawn[0]?.isim ?? 'bilinmeyen'}, Kaldırılan: ${removedCard.isim}`
            ]
          };
        }

        // If no cards in hand, just draw
        return {
          ...state,
          deck,
          hand,
          discardPile,
          battleLogs: [
            ...state.battleLogs,
            `Bir kart çektiniz: ${drawn[0]?.isim ?? 'bilinmeyen'}`
          ]
        };

      case 2: // Reduce enemy power, skip turn
        // Reduce enemy power temporarily (we'll implement this as a status effect)
        const enemyStatuses = [...state.enemyStatuses];
        const powerDownIndex = enemyStatuses.findIndex(s => s.id === 'weakened');

        if (powerDownIndex >= 0) {
          // Strengthen existing weakened effect
          enemyStatuses[powerDownIndex] = {
            ...enemyStatuses[powerDownIndex],
            duration: enemyStatuses[powerDownIndex].duration + 1,
            stacks: Math.min(3, (enemyStatuses[powerDownIndex].stacks ?? 0) + 1)
          };
        } else {
          // Add new weakened effect
          enemyStatuses.push({
            id: 'weakened' as const,
            duration: 2,
            stacks: 1,
            value: 1
          });
        }

        // Player skips next turn (we'll handle this in game logic)
        return {
          ...state,
          enemyStatuses,
          battleLogs: [
            ...state.battleLogs,
            "Düşmanınızı zayıflattınız! Ancak bu nedeniyle sonraki turunuzu atlayacaksınız."
          ]
        };

      default:
        // Default choice - small gold reward
        return {
          ...state,
          gold: state.gold + 15,
          battleLogs: [
            ...state.battleLogs,
            "15 altın buldunuz!"
          ]
        };
    }
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}