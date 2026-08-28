import type { Card } from '../types/game';

interface CardProps {
  card: Card;
  onPlay: (card: Card) => void;
  isPlayable?: boolean;
}

function formatEffect(effect: NonNullable<Card['effects']>[number]) {
  if (effect.kind === 'attack') return 'Zırha karşı saldır';
  if (effect.kind === 'damage') return 'Doğrudan hasar';
  if (effect.kind === 'block') return `${effect.die ?? effect.amount} blok kazan`;
  if (effect.kind === 'heal') return `${effect.die ?? effect.amount} can yenile`;
  if (effect.kind === 'status') return `${effect.status} uygula`;
  if (effect.kind === 'draw') return `${effect.amount} kart çek`;
  if (effect.kind === 'energy') return `${effect.amount} enerji kazan`;
  return 'Düşmanın turunu atlat';
}

export const CardComponent: React.FC<CardProps> = ({ card, onPlay, isPlayable = true }) => {
  const cardTypeLabel = card.tip === 'saldırı' ? 'Saldırı' : card.tip === 'savunma' ? 'Savunma' : 'Yetenek';
  const cardGlyph = card.tip === 'saldırı' ? '⚔' : card.tip === 'savunma' ? '◈' : '✦';
  const rarityLabel = card.rarity === 'rare' ? 'Nadir' : card.rarity === 'uncommon' ? 'Seçkin' : 'Sıradan';
  const effectText = card.effects?.map(formatEffect).join(' · ') || `${card.zarTuru} zar`;
  const primaryEffect = card.effects?.find((effect) => effect.kind === 'attack' || effect.kind === 'damage' || effect.kind === 'block' || effect.kind === 'heal');
  const primaryValue = primaryEffect && ('die' in primaryEffect ? primaryEffect.die : 'amount' in primaryEffect ? primaryEffect.amount : undefined);
  const primaryLabel = card.tip === 'saldırı' ? 'HASAR' : card.tip === 'savunma' ? 'BLOK' : 'ETKİ';
  const availabilityLabel = isPlayable ? `${card.isim} oynanabilir` : `${card.isim} için yeterli enerji yok`;

  return (
    <button
      type="button"
      className={`game-card game-card--${card.tip} game-card--${card.rarity ?? 'common'}${isPlayable ? '' : ' game-card--disabled'}`}
      onClick={() => onPlay(card)}
      disabled={!isPlayable}
      aria-label={`${card.isim}, ${cardTypeLabel}, ${card.manaBedeli} mana, ${card.zarTuru} zar, ${card.baseHasar} temel hasar, ${availabilityLabel}`}
    >
      <span className="card-topline"><strong className="card-mana" aria-label={`${card.manaBedeli} mana`}>{card.manaBedeli}<small>MP</small></strong><span className="card-type"><span aria-hidden="true">{cardGlyph}</span>{cardTypeLabel}</span><span className="card-rarity">{rarityLabel}</span></span>
      <span className="card-art" aria-hidden="true"><span className="card-glyph">{cardGlyph}</span><i /></span>
      <span className="card-name">{card.isim}{card.isUpgraded && <span className="card-upgrade-indicator" aria-label="Yükseltilmiş">↑</span>}</span>
      <span className="card-effect">{effectText}</span>
      <span className="card-details"><span className="card-primary-stat"><b>{primaryLabel}</b><strong>{(primaryValue ?? card.baseHasar) || '—'}</strong></span><span><b>ZAR</b>{card.zarTuru}</span>{card.tags?.[0] && <span><b>ETİKET</b>{card.tags[0]}</span>}</span>
      <span className="card-action">{isPlayable ? 'Oynamaya hazır' : 'Kullanılamaz'}</span>
    </button>
  );
};
