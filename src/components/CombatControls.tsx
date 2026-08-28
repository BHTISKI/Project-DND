import React from 'react';
import { useGameStore } from '../state/store';

export const CombatControls: React.FC = () => {
  const endTurn = useGameStore((s) => s.endTurn);

  return (
    <button onClick={endTurn} className="button button--turn" type="button" aria-label="Oyuncu turunu bitir">
      <span aria-hidden="true">↳</span>
      Turu Bitir
    </button>
  );
};