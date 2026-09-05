import { create } from 'zustand';
import type { CombatFeedback } from '../engine/combatFeedback';

export interface PresentedImpact extends CombatFeedback { id: number }
let sequence = 0;
// Transient presentation only: never persisted and never responsible for combat outcomes.
export const useCombatPresentation = create<{
  queue: PresentedImpact[];
  push: (events: CombatFeedback[]) => void;
  shift: (id: number) => void;
  clear: () => void;
}>(set => ({
  queue: [],
  push: events => set(s => ({ queue: [...s.queue, ...events.map(event => ({ ...event, id: ++sequence }))] })),
  shift: id => set(s => ({ queue: s.queue.filter(event => event.id !== id) })),
  clear: () => set({ queue: [] }),
}));
