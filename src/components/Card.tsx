import type { Card } from '../types/game';

interface CardProps {
  card: Card;
  onPlay: (card: Card) => void;
}

export const CardComponent: React.FC<CardProps> = ({ card, onPlay }) => {
  return (
    <div
      onClick={() => onPlay(card)}
      style={{
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '16px',
        width: '200px',
        backgroundColor: '#f9f9f9',
        cursor: 'pointer',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      <h3>{card.isim}</h3>
      <p><strong>Mana:</strong> {card.manaBedeli}</p>
      <p><strong>Zar Türü:</strong> {card.zarTuru}</p>
      <p><strong>Temel Hasar:</strong> {card.baseHasar}</p>
    </div>
  );
};
