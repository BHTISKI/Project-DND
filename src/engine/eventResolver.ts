import type { GameState } from '../state/store';
import { addStatus } from './statuses';
import { allCards, removeOwnedCard } from './cardPiles';
import { drawCardsState } from './combatResolver';

export function eventHealCost(gold: number): number { return Math.max(10, Math.ceil(gold * 0.1)); }

export function eventChoices(state: Pick<GameState, 'gold' | 'player'>) {
  const full = state.player.mevcutCan >= state.player.maksimumCan;
  return [
    { title: 'Kanlı pazarlık', detail: full || state.gold < eventHealCost(state.gold)
      ? 'Şifaya gerek yok veya altın yetersiz: 10 altın bul.'
      : `${eventHealCost(state.gold)} altın karşılığında en fazla 4 can yenile.` },
    { title: 'Kader değişimi', detail: 'Bir kart çek; elinden rastgele bir kartı kalıcı olarak kaldır. Son kartın korunur.' },
    { title: 'Zayıflatıcı kehanet', detail: 'Sonraki düşmanı 2 tur güçsüzleştir; ilk oyuncu turunu feda et.' },
  ];
}

export class EventResolver {
  static resolveEvent(state: GameState, choice: number): GameState {
    if (choice === 0) {
      const cost = eventHealCost(state.gold);
      const amount = Math.min(4, state.player.maksimumCan - state.player.mevcutCan);
      if (state.gold < cost || amount <= 0)
        return { ...state, gold: state.gold + 10, battleLogs: [...state.battleLogs, '10 altın buldun.'] };
      return { ...state, gold: state.gold - cost, player: { ...state.player, mevcutCan: state.player.mevcutCan + amount },
        battleLogs: [...state.battleLogs, `${amount} can yenilendi. (${cost} altın)`] };
    }
    if (choice === 1) {
      const drawn = drawCardsState(state, 1);
      const removed = allCards(drawn).length > 1 ? drawn.hand[Math.floor(Math.random() * drawn.hand.length)] : undefined;
      const piles = removed ? removeOwnedCard(drawn, removed.id) : drawn;
      return { ...drawn, deck: piles.deck, hand: piles.hand, discardPile: piles.discardPile,
        battleLogs: [...drawn.battleLogs, `${drawn.hand.length - state.hand.length} kart çekildi. ${removed ? removed.isim + ' kalıcı olarak kaldırıldı.' : 'Kaldırılacak kart yok veya son kart korunuyor.'}`] };
    }
    if (choice === 2) {
      return { ...state,
        pendingEnemyStatuses: addStatus(state.pendingEnemyStatuses, { id: 'weakened', duration: 2, stacks: 1, value: 1 }),
        pendingPlayerSkip: true,
        battleLogs: [...state.battleLogs, 'Kehanet hazır: sonraki düşman güçsüzleşecek, ilk oyuncu turu feda edilecek.'] };
    }
    return state;
  }
}
