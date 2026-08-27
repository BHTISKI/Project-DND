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
    <div className="hand-grid">
      {hand.map((card) => (
        <CardComponent key={card.id} card={card} onPlay={handlePlay} />
      ))}
      {hand.length === 0 && (
        <div className="empty-state">
          <i>Elinizde kart yok</i>
        </div>
      )}
    </div>
  );
};