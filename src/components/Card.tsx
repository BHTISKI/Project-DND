import type { Card } from '../types/game';

interface CardProps {
  card: Card;
  onPlay: (card: Card) => void;
}

export const CardComponent: React.FC<CardProps> = ({ card, onPlay }) => {
  return (
    <button
      type="button"
      className={`game-card game-card--${card.tip}`}
      onClick={() => onPlay(card)}
    >
      <span className="card-topline"><span>{card.tip}</span><strong>{card.manaBedeli}</strong></span>
      <span className="card-glyph" aria-hidden="true">✦</span>
      <span className="card-name">{card.isim}</span>
      <span className="card-rule">{card.zarTuru} zar · {card.baseHasar} temel hasar</span>
      <span className="card-action">Oyna</span>
    </button>
  );
};
