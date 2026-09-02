import type { Card, Character } from '../types/game';

type CollectionState = { deck: Card[]; hand: Card[]; discardPile: Card[] };

export function createSelector<T, R, V>(selector: (state: T) => R, compute: (extracted: R) => V) {
  let cachedValue: V | undefined;
  let cachedSelectorResult: R | undefined;
  return (state: T) => {
    const selectorResult = selector(state);
    if (cachedSelectorResult !== selectorResult) {
      cachedSelectorResult = selectorResult;
      cachedValue = compute(selectorResult);
    }
    return cachedValue;
  };
}

// Selectors for frequently used derived data
export const selectTotalDeckBaseHasar = createSelector<Pick<CollectionState, 'deck'>, Card[], number>(
  (state) => state.deck,
  (deck) => deck.reduce((sum, card) => sum + (card.baseHasar ?? 0), 0)
);

export const selectTotalDeckManaBedeli = createSelector<Pick<CollectionState, 'deck'>, Card[], number>(
  (state) => state.deck,
  (deck) => deck.reduce((sum, card) => sum + (card.manaBedeli ?? 0), 0)
);

export const selectDeckSize = createSelector<Pick<CollectionState, 'deck'>, Card[], number>(
  (state) => state.deck,
  (deck) => deck.length
);

export const selectHandSize = createSelector<Pick<CollectionState, 'hand'>, Card[], number>(
  (state) => state.hand,
  (hand) => hand.length
);

export const selectDiscardPileSize = createSelector<Pick<CollectionState, 'discardPile'>, Card[], number>(
  (state) => state.discardPile,
  (pile) => pile.length
);

export const selectPlayerHealthPercent = createSelector<Pick<{ player: Character }, 'player'>, Character, number>(
  (state) => state.player,
  (player) => {
    if (!player.maksimumCan) return 0;
    return (player.mevcutCan / player.maksimumCan) * 100;
  }
);

export const selectEnemyHealthPercent = createSelector<Pick<{ enemy: Character }, 'enemy'>, Character, number>(
  (state) => state.enemy,
  (enemy) => {
    if (!enemy.maksimumCan) return 0;
    return (enemy.mevcutCan / enemy.maksimumCan) * 100;
  }
);

export const selectPlayerBlock = createSelector<{ playerBlock: number }, number, number>(
  (state: { playerBlock: number }) => state.playerBlock,
  (block) => block
);

export const selectEnemyBlock = createSelector<{ enemyBlock: number }, number, number>(
  (state: { enemyBlock: number }) => state.enemyBlock,
  (block) => block
);

export const selectCurrentEnergy = createSelector<{ currentEnergy: number }, number, number>(
  (state: { currentEnergy: number }) => state.currentEnergy,
  (energy) => energy
);

export const selectMaxEnergy = createSelector<{ maxEnergy: number }, number, number>(
  (state: { maxEnergy: number }) => state.maxEnergy,
  (energy) => energy
);

export const selectGold = createSelector<{ gold: number }, number, number>(
  (state: { gold: number }) => state.gold,
  (gold) => gold
);