import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hand } from './Hand';
import { MechanicStatus } from './MechanicStatus';
import { useGameStore } from '../state/store';
import { sampleCardDefs } from '../types/game';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  const initial = useGameStore.getInitialState();
  useGameStore.setState({ ...initial, initialized: true, gamePhase: 'combat',
enemy: { ...initial.enemy, mevcutCan: 100, maksimumCan: 100, maxPosture: 200 },
    enemyIntent: { type: 'defend', action: { kind: 'pass' } },
    hand: ['Son Kıvılcım', 'Sabırlı Muhafız', 'Zincir Darbesi'].map(name => ({ ...sampleCardDefs.find(c => c.isim === name)!, id: name })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('visible mechanic feedback', () => {
  it('shows the readiness change and the exhausted card through actual actions', () => {
    render(<><MechanicStatus /><Hand /></>);
    expect(screen.getByText('Bitirici: kombo 0/2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Son Kıvılcım, / }));
    expect(screen.getByText(/Tükenen kartlar \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('Bitirici: kombo 1/2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Sabırlı Muhafız, / }));
    expect(screen.getByText('Kombo 1')).toBeInTheDocument();
    expect(screen.getByText('Bitirici hazır · +3 hasar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Zincir Darbesi ayrıntılarını incele' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Bitirici 2');
    expect(useGameStore.getState().currentEnergy).toBe(3);
  });
  it('keeps the reserve card visible after ending a turn', () => {
    render(<><MechanicStatus /><Hand /></>);
    act(() => useGameStore.getState().endTurn());
    expect(screen.getByRole('button', { name: /^Sabırlı Muhafız, / })).toBeInTheDocument();
    expect(screen.getByText('Oynamazsan elinde kalır')).toBeInTheDocument();
    expect(screen.getByText('Kombo 0')).toBeInTheDocument();
  });
  it('announces prepared Parry and the next posture momentum', () => {
    useGameStore.setState({ pendingParry: true, postureComboCount: 2 });
    render(<MechanicStatus />);
    expect(screen.getByText(/Savuşturma hazır/)).toBeInTheDocument();
    expect(screen.getByText(/Sonraki yakın saldırı 1,25× denge/)).toBeInTheDocument();
  });
});
