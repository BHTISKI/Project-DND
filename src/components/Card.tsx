import type { Card } from '../types/game';

interface CardProps {
  card: Card;
  onPlay: (card: Card) => void;
  isPlayable?: boolean;
}

export const CardComponent: React.FC<CardProps> = ({ card, onPlay, isPlayable = true }) => {
  return (
    <button
      type="button"
      className={`game-card game-card--${card.tip}${isPlayable ? '' : ' game-card--disabled'}`}
      onClick={() => onPlay(card)}
      disabled={!isPlayable}
      aria-label={`${card.isim}, ${card.tip}, ${card.manaBedeli} mana, ${card.zarTuru} zar, ${card.baseHasar} temel hasar`}
    >
      <span className="card-topline"><span className="card-type">{card.tip}</span><strong aria-label={`${card.manaBedeli} mana`}>{card.manaBedeli}</strong></span>
      <span className="card-glyph" aria-hidden="true">✦</span>
      <span className="card-name">{card.isim}</span>
      <span className="card-details"><span>{card.zarTuru} zar</span><span>{card.baseHasar} temel hasar</span></span>
      <span className="card-action">{isPlayable ? 'Oyna' : 'Sıra bekleniyor'}</span>
    </button>
  );
};
