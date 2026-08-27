import React from 'react';

interface CombatControlsProps {
  endTurn: () => void;
}

export const CombatControls: React.FC<CombatControlsProps> = ({ endTurn }) => {
  return (
    <button onClick={endTurn} style={{ marginLeft: '10px', padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}>
      Turu Bitir
    </button>
  );
};
