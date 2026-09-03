import { useEffect } from 'react';
import { useGameStore } from '../state/store';

export default function DialogBubble() {
  const playerDialog = useGameStore(s => s.playerDialog);
  const enemyDialog = useGameStore(s => s.enemyDialog);
  useEffect(() => {
    const dialogs = [...playerDialog, ...enemyDialog];
    if (!dialogs.length) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      useGameStore.setState(s => ({
        playerDialog: s.playerDialog.filter(entry => now - entry.timestamp < 5000),
        enemyDialog: s.enemyDialog.filter(entry => now - entry.timestamp < 5000),
      }));
    }, Math.max(0, Math.min(...dialogs.map(d => d.timestamp + 5000)) - Date.now()));
    return () => clearTimeout(timer);
  }, [playerDialog, enemyDialog]);
  return <div className="dialog-layer" aria-live="polite">
    {playerDialog.slice(-1).map(entry => <div key={'p-' + entry.timestamp} className="dialog-bubble player-dialog">{entry.text}</div>)}
    {enemyDialog.slice(-1).map(entry => <div key={'e-' + entry.timestamp} className="dialog-bubble dialog-bubble--enemy enemy-dialog">{entry.text}</div>)}
  </div>;
}
