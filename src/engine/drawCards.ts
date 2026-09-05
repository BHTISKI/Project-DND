import type { GameState } from '../state/store';
import { drawFromPiles } from './cardPiles';

// All draws, including relic draws, pay the same curse cost.
export function drawCardsState(state: GameState, count: number): GameState {
  const { drawn, ...piles } = drawFromPiles(state, count);
  let next = { ...state, ...piles };
  const broken = drawn.filter(c => c.isim === 'Kırık Ruh').length;
  if (broken) {
    const maximum = Math.max(1, state.player.maksimumCan - broken * 2);
    const energy = Math.max(1, state.maxEnergy - broken * 2);
    next = { ...next, maxEnergy: energy, currentEnergy: Math.min(next.currentEnergy, energy),
      player: { ...next.player, maksimumCan: maximum, mevcutCan: Math.min(next.player.mevcutCan, maximum) },
      battleLogs: [...next.battleLogs, `Kırık Ruh: maksimum can ve enerji ${broken * 2} azaldı.`] };
  }
  return next;
}
