// Bu dosya src/components/Card.tsx için ilgili kodları içerir.
// Bileşen: tek kart görselleştirmesi ve hover etkileri
import React, { useState } from 'react';
import type { Card } from '../types/game';

interface CardProps {
  card: Card;
  onPlay: (card: Card) => void;
  isPlayable?: boolean;
  style?: React.CSSProperties;
  // Drag and drop props
  isDraggable?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  denied?: boolean;
}

function formatEffect(effect: NonNullable<Card['effects']>[number]) {
  if (effect.kind === 'attack') return 'Zırha karşı saldır';
  if (effect.kind === 'damage') return 'Doğrudan hasar';
  if (effect.kind === 'block') return `${effect.amount ?? 4} blok kazan`;
  if (effect.kind === 'heal') return `${effect.amount ?? 4} can yenile`;
  if (effect.kind === 'status') return `${effect.status} uygula`;
  if (effect.kind === 'draw') return `${effect.amount} kart çek`;
  if (effect.kind === 'energy') return `${effect.amount} enerji kazan`;
  if (effect.kind === 'trash') {
    const amount = effect.amount ?? 1;
    const target = effect.target === 'enemy' ? 'düşmanın' : 'oyuncunun';
    return `${amount} kartı ${target} desteleden kaldır`;
  }
  if (effect.kind === 'trade') {
    const trashAmount = effect.trashAmount ?? 1;
    const drawAmount = effect.drawAmount ?? 1;
    const target = effect.target === 'enemy' ? 'düşmanın' : 'oyuncunun';
    return `${trashAmount} kart ${target} desteleden kaldır, ${drawAmount} kart çek`;
  }
  return 'Düşmanın turunu atlat';
}

export const CardComponent: React.FC<CardProps> = ({
  card,
  onPlay,
  isPlayable = true,
  style,
  isDraggable = false,
  onDragStart = () => undefined,
  onDragEnd = () => undefined,
  isDragging = false,
  denied = false,
}) => {
  const cardTypeLabel = card.tip === 'saldırı' ? 'Saldırı' : card.tip === 'savunma' ? 'Savunma' : 'Yetenek';
  const cardGlyph = card.tip === 'saldırı' ? '⚔' : card.tip === 'savunma' ? '◈' : '✦';
  const rarityLabel = card.rarity === 'rare' ? 'Nadir' : card.rarity === 'uncommon' ? 'Seçkin' : 'Sıradan';
  const effectText = card.effects?.map(formatEffect).join(' · ') || `${card.baseHasar} hasar`;
  const availabilityLabel = isPlayable ? `${card.isim} oynanabilir` : card.onDiscardPenalty ? `${card.isim} lanetli ve oynanamaz` : `${card.isim} için yeterli enerji yok`;

  // Damage value for hover: base hasar + any attack/damage bonuses
  const damageBonus = card.effects?.reduce((sum, e) => {
    if (e.kind === 'attack' || e.kind === 'damage') {
      return sum + (e.damageBonus ?? 0);
    }
    return sum;
  }, 0) ?? 0;
  const totalDamage = card.baseHasar + damageBonus;

  // Description for hover: list of effects in readable Turkish
  const description = card.effects?.map(formatEffect).join(', ') || `${card.baseHasar} hasar verir`;
  const blockValue = card.effects?.find((effect) => effect.kind === 'block')?.amount ?? 0;

  const [zoomed, setZoomed] = useState(false);
  const [sending, setSending] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleClick = () => {
    // Play card on click if playable
    if (isPlayable) {
      setSending(true);
      onPlay(card);
      window.setTimeout(() => setSending(false), 420);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setZoomed(!zoomed);
  };

  const handleDragStartE = (e: React.DragEvent) => {
    // Store the id for drop target
    e.dataTransfer.setData('text/plain', card.id);
    onDragStart(card.id);
  };

  const handleDragEndE = () => {
    setTilt({ x: 0, y: 0 });
    onDragEnd();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - bounds.left) / bounds.width - 0.5) * 10;
    const y = ((e.clientY - bounds.top) / bounds.height - 0.5) * -8;
    setTilt({ x, y });
  };

  return (
    <button
      type="button"
      className={`card game-card game-card--${card.tip} game-card--${card.rarity ?? 'common'}${card.theme ? ` game-card--${card.theme}` : ''}${isPlayable ? '' : ' game-card--disabled'}${zoomed ? ' zoomed' : ''}${sending ? ' card--sending' : ''}${isDragging ? ' card--dragging' : ''}${denied ? ' denied-shake' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      aria-pressed={zoomed}
      disabled={!isPlayable}
      aria-label={`${card.isim}, ${cardTypeLabel}, ${card.manaBedeli} mana, ${totalDamage} hasar, ${availabilityLabel}`}
      style={{ ...style, '--drag-rotate': `${tilt.x}deg`, '--drag-skew': `${tilt.y}deg` } as React.CSSProperties}
      draggable={isDraggable}
      onDragStart={handleDragStartE}
      onDragEnd={handleDragEndE}
      onPointerMove={handlePointerMove}
    >
      <div className="card-content">
        <span className="card-topline">
          <strong className="card-mana" aria-label={`${card.manaBedeli} mana`}>
            {card.manaBedeli}<small>MP</small>
          </strong>
          <span className="card-type">
            <span aria-hidden="true">{cardGlyph}</span>{cardTypeLabel}
          </span>
          <span className="card-rarity">{rarityLabel}</span>
        </span>
        <span className="card-art" aria-hidden="true">
          <span className="card-glyph">{cardGlyph}</span><i />
        </span>
        <span className="card-name">
          {card.isim}
          {card.isUpgraded && <span className="card-upgrade-indicator" aria-label="Yükseltilmiş">↑</span>}
        </span>
        <span className="card-effect">{effectText}</span>
        <span className="card-details">
          <span><b>HASAR</b><strong>{totalDamage || '—'}</strong></span>
          <span><b>BLOK</b><strong>{blockValue || '—'}</strong></span>
          <span><b>ENERJİ</b><strong>{card.manaBedeli}</strong></span>
        </span>
        <span className="card-action">
          {isPlayable ? 'Oynamaya hazır' : card.onDiscardPenalty ? 'Lanetli · oynanamaz' : 'Kullanılamaz'}
        </span>
      </div>
      {/* Hover overlay - shows detailed info on hover */}
      <div className="card-details-overlay">
        <div>
          <div>Hasar: {totalDamage}</div>
          <div>Mana: {card.manaBedeli}</div>
        </div>
        <div>
          {description}
        </div>
      </div>
    </button>
  );
};