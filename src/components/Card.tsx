import type { Card } from '../types/game';

interface CardProps {
  card: Card;
  onPlay: (card: Card) => void;
  isPlayable?: boolean;
}

export const CardComponent: React.FC<CardProps> = ({ card, onPlay, isPlayable = true }) => {
  const cardTypeLabel = card.tip === 'saldırı' ? 'Saldırı' : card.tip === 'savunma' ? 'Savunma' : 'Yetenek';
  const cardGlyph = card.tip === 'saldırı' ? '⚔' : card.tip === 'savunma' ? '◈' : '✦';

  return (
    <button
      type="button"
      className={`game-card game-card--${card.tip}${isPlayable ? '' : ' game-card--disabled'}`}
      onClick={() => onPlay(card)}
      disabled={!isPlayable}
      aria-label={`${card.isim}, ${cardTypeLabel}, ${card.manaBedeli} mana, ${card.zarTuru} zar, ${card.baseHasar} temel hasar${isPlayable ? '' : ', kullanılamaz'}`}
    >
      <span className="card-topline"><span className="card-type">{cardTypeLabel}</span><strong aria-label={`${card.manaBedeli} mana`}>{card.manaBedeli}</strong></span>
      <span className="card-glyph" aria-hidden="true">{cardGlyph}</span>
      <span className="card-name">{card.isim}</span>
      <span className="card-details"><span><b>ZAR</b>{card.zarTuru}</span><span><b>ETKİ</b>{card.baseHasar} temel hasar</span></span>
      <span className="card-action">{isPlayable ? 'Oynamaya hazır' : 'Kullanılamaz'}</span>
    </button>
  );
};
