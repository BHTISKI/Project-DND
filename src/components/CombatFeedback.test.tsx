import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { CombatFeedbackController, FighterFeedback } from './CombatFeedback';
import { useGameStore } from '../state/store';
import { useCombatPresentation } from '../state/combatPresentation';

beforeEach(() => { vi.useFakeTimers(); useGameStore.setState(useGameStore.getInitialState(), true); useCombatPresentation.getState().clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('presents lethal damage and death in order after leaving combat', () => {
  useGameStore.setState({ gamePhase: 'combat' });
  render(<><CombatFeedbackController /><FighterFeedback target="enemy" /><FighterFeedback target="player" /></>);
  act(() => useGameStore.setState(s => ({ gamePhase: 'mapSelection', enemy: { ...s.enemy, mevcutCan: 0 }, combatFeedback: [{ target: 'enemy', kind: 'heavy', amount: 20 }] })));
  expect(screen.getByText('AĞIR VURUŞ')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(520));
  expect(screen.getByText('YENİLDİ')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(850));
  expect(useCombatPresentation.getState().queue).toHaveLength(0);
});
it('does not replay an impact on a log update and clears stale events on a new encounter', () => {
  useGameStore.setState({ gamePhase: 'combat' });
  render(<CombatFeedbackController />);
  act(() => useGameStore.setState(s => ({ enemy: { ...s.enemy, mevcutCan: s.enemy.mevcutCan - 2 }, combatFeedback: [{ target: 'enemy', kind: 'damage', amount: 2 }] })));
  act(() => useGameStore.setState({ battleLogs: ['Yeni satır'] }));
  expect(useCombatPresentation.getState().queue).toHaveLength(1);
  act(() => useGameStore.setState(s => ({ enemy: { ...s.enemy, id: 'next-enemy' } })));
  expect(useCombatPresentation.getState().queue).toHaveLength(0);
});
