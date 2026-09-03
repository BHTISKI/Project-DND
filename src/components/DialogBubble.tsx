import React from 'react';
import { useGameStore } from '../state/store';

const DialogBubble: React.FC = () => {
  const { playerDialog, enemyDialog } = useGameStore(state => ({
    playerDialog: state.playerDialog,
    enemyDialog: state.enemyDialog,
  }));

  return (
    <>
      {/* Player dialog bubbles - bottom left */}
      {playerDialog.map((entry, index) => (
        <div
          key={entry.timestamp + '-p' + index}
          className="dialog-bubble player-dialog"
          style={{
            left: '20px',
            bottom: '20px',
            position: 'fixed',
            zIndex: 1000,
          }}
        >
          {entry.text}
        </div>
      ))}

      {/* Enemy dialog bubbles - top right */}
      {enemyDialog.map((entry, index) => (
        <div
          key={entry.timestamp + '-e' + index}
          className="dialog-bubble enemy-dialog"
          style={{
            right: '20px',
            top: '20px',
            position: 'fixed',
            zIndex: 1000,
          }}
        >
          {entry.text}
        </div>
      ))}
    </>
  );
};

export default DialogBubble;