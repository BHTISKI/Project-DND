import type { GameState } from '../state/store';
import { allCards, removeOwnedCard } from './cardPiles';

export function restChoices(state: Pick<GameState, 'gold' | 'player' | 'deck' | 'hand' | 'discardPile'>) {
  return [
    { title: 'Dinlen', detail: '25 altın karşılığında en fazla 4 can yenile.',
      disabled: state.gold < 25 || state.player.mevcutCan >= state.player.maksimumCan },
    { title: 'Desteyi arındır', detail: 'Bütün destenden rastgele bir kartı kalıcı olarak kaldır.',
      disabled: allCards(state).length <= 1 },
  ];
}

export class RestResolver {
  static resolveRest(state: GameState, choice: number): GameState {
    if (choice === 0) {
      const amount = Math.min(4, state.player.maksimumCan - state.player.mevcutCan);
      if (state.gold < 25 || amount <= 0) return state;
      return { ...state, gold: state.gold - 25, player: { ...state.player, mevcutCan: state.player.mevcutCan + amount },
        battleLogs: [...state.battleLogs, `${amount} can yenilendi. (25 altın)`] };
    }
    if (choice === 1) {
      const cards = allCards(state);
      if (cards.length <= 1) return state;
      const card = cards[Math.floor(Math.random() * cards.length)];
      return { ...state, ...removeOwnedCard(state, card.id),
        battleLogs: [...state.battleLogs, `${card.isim} destenden kalıcı olarak kaldırıldı.`] };
    }
    return state;
  }
}
