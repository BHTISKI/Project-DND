import type { Card } from '../types/game';
import { useGameStore } from '../state/store';
import { CardComponent } from './Card';

export const Hand: React.FC = () => {
  const hand = useGameStore((s) => s.hand);
  const playCard = useGameStore((s) => s.playCard);
  const isPlayerTurn = useGameStore((s) => s.isPlayerTurn);
  const gamePhase = useGameStore((s) => s.gamePhase);

  const handlePlay = (card: Card) => {
    // Only allow playing in combat phase and player turn
    if (!isPlayerTurn || gamePhase !== 'combat') return;

    // Play card (handles discarding, energy spend, attack, damage, logging)
    playCard(card.id);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px' }}>
      {hand.map((card) => (
        <CardComponent key={card.id} card={card} onPlay={handlePlay} />
      ))}
      {hand.length === 0 && (
        <div style={{
          minWidth: '200px',
          padding: '16px',
          backgroundColor: '#f9f9f9',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <i>Elinizde kart yok</i>
        </div>
      )}
    </div>
  );
};