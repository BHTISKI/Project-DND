import React from 'react';

interface CombatControlsProps {
  endTurn: () => void;
}

export const CombatControls: React.FC<CombatControlsProps> = ({ endTurn }) => {
  return (
    <button onClick={endTurn} className="button button--turn">
      Turu Bitir
    </button>
  );
};
