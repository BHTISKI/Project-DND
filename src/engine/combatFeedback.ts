export type FeedbackKind = 'damage' | 'heavy' | 'block' | 'heal' | 'poison' | 'break' | 'death';
export interface CombatFeedback {
  target: 'player' | 'enemy';
  kind: FeedbackKind;
  amount: number;
}

// Resolver events describe individual impacts, even when a card hits several times.
export function feedback<T extends { combatFeedback?: CombatFeedback[] }>(state: T, target: CombatFeedback['target'], kind: FeedbackKind, amount = 0): T {
  if (amount <= 0 && kind !== 'break' && kind !== 'death') return state;
  return { ...state, combatFeedback: [...(state.combatFeedback ?? []), { target, kind, amount }] };
}
