// Simple memoization selector creator for Zustand state
export function createSelector<T, R>(selector: (state: T) => R, compute: (extracted: R) => any) {
  let cachedValue: any;
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
export const selectTotalDeckBaseHasar = createSelector(
  (state: { deck: any[] }) => state.deck,
  (deck) => deck.reduce((sum, card) => sum + (card.baseHasar ?? 0), 0)
);

export const selectTotalDeckManaBedeli = createSelector(
  (state: { deck: any[] }) => state.deck,
  (deck) => deck.reduce((sum, card) => sum + (card.manaBedeli ?? 0), 0)
);

export const selectDeckSize = createSelector(
  (state: { deck: any[] }) => state.deck,
  (deck) => deck.length
);

export const selectHandSize = createSelector(
  (state: { hand: any[] }) => state.hand,
  (hand) => hand.length
);

export const selectDiscardPileSize = createSelector(
  (state: { discardPile: any[] }) => state.discardPile,
  (pile) => pile.length
);

export const selectPlayerHealthPercent = createSelector(
  (state: { player: { mevcutCan: number; maksimumCan: number } }) => state.player,
  (player) => {
    if (!player.maksimumCan) return 0;
    return (player.mevcutCan / player.maksimumCan) * 100;
  }
);

export const selectEnemyHealthPercent = createSelector(
  (state: { enemy: { mevcutCan: number; maksimumCan: number } }) => state.enemy,
  (enemy) => {
    if (!enemy.maksimumCan) return 0;
    return (enemy.mevcutCan / enemy.maksimumCan) * 100;
  }
);

export const selectPlayerBlock = createSelector(
  (state: { playerBlock: number }) => state.playerBlock,
  (block) => block
);

export const selectEnemyBlock = createSelector(
  (state: { enemyBlock: number }) => state.enemyBlock,
  (block) => block
);

export const selectCurrentEnergy = createSelector(
  (state: { currentEnergy: number }) => state.currentEnergy,
  (energy) => energy
);

export const selectMaxEnergy = createSelector(
  (state: { maxEnergy: number }) => state.maxEnergy,
  (energy) => energy
);

export const selectGold = createSelector(
  (state: { gold: number }) => state.gold,
  (gold) => gold
);