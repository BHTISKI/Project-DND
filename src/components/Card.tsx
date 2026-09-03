import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { createPortal } from 'react-dom';
import type { Card } from '../types/game';
import { cardBlockText, cardDamageText, describeCard, rarityName } from '../utils/cardText';

interface CardProps {
  card: Card; onPlay: (card: Card) => void; isPlayable?: boolean; style?: React.CSSProperties;
  isDraggable?: boolean; onDragStart?: (id: string) => void; onDragEnd?: () => void;
  isDragging?: boolean; denied?: boolean; unavailableReason?: string;
}
export const CardComponent: React.FC<CardProps> = ({
  card, onPlay, isPlayable = true, style, isDraggable = false,
  onDragStart = () => undefined, onDragEnd = () => undefined, isDragging = false, denied = false, unavailableReason,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const pendingClick = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const description = describeCard(card);
  const damage = cardDamageText(card);
  const glyph = card.tip === 'saldırı' ? '⚔' : card.tip === 'savunma' ? '◈' : '✦';
  const label = card.tip === 'saldırı' ? 'Saldırı' : card.tip === 'savunma' ? 'Savunma' : 'Yetenek';
  const reason = unavailableReason ?? (card.onDiscardPenalty ? 'Lanetli · oynanamaz' : 'Yeterli enerji yok');
  const cancel = () => { if (pendingClick.current !== null) clearTimeout(pendingClick.current); pendingClick.current = null; };
  useEffect(() => () => { if (pendingClick.current !== null) clearTimeout(pendingClick.current); }, [card.id, isPlayable]);
  useEffect(() => {
    if (!zoomed) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false);
      if (event.key === 'Tab') {
        const buttons = Array.from(modalRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (buttons.length) { event.preventDefault(); buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); if (previous?.isConnected) previous.focus(); };
  }, [zoomed]);
  const inspect = () => { cancel(); setZoomed(true); };
  return <>
    <button type="button"
      className={`card game-card game-card--${card.tip} game-card--${card.rarity ?? 'common'} game-card--theme-${card.theme ?? card.tip}${card.theme ? ' game-card--' + card.theme : ''}${isPlayable ? '' : ' game-card--disabled'}${zoomed ? ' zoomed' : ''}${isDragging ? ' card--dragging' : ''}${denied ? ' denied-shake' : ''}`}
      aria-pressed={zoomed}
      aria-label={`${card.isim}, ${label}, ${card.manaBedeli} mana, ${damage} hasar, ${isPlayable ? card.isim + ' oynanabilir' : card.isim + ' için ' + reason.toLocaleLowerCase('tr')}`}
      disabled={!isPlayable} style={style} draggable={isDraggable && isPlayable}
      onClick={event => {
        if (!isPlayable) return;
        cancel();
        if (event.detail === 0) onPlay(card);
        else if (event.detail === 1) pendingClick.current = setTimeout(() => { pendingClick.current = null; onPlay(card); }, 500);
      }}
      onDoubleClick={inspect}
      onDragStart={event => { cancel(); event.dataTransfer.setData('text/plain', card.id); onDragStart(card.id); }}
      onDragEnd={() => { cancel(); onDragEnd(); }}>
      <span className="card-content">
        <span className="card-topline"><strong className="card-mana" aria-label={`${card.manaBedeli} mana`}>{card.manaBedeli}<small>MP</small></strong>
          <span className="card-type"><span aria-hidden="true">{glyph}</span>{label}</span><span className="card-rarity">{rarityName(card.rarity)}</span></span>
        <span className="card-art" aria-hidden="true"><span className="card-glyph">{glyph}</span><i /></span>
        <span className="card-name">{card.isim}{card.isUpgraded && <span aria-label="Yükseltilmiş">↑</span>}</span>
        <span className="card-effect">{description}</span>
        <span className="card-details"><span><b>HASAR</b><strong>{damage}</strong></span><span><b>BLOK</b><strong>{cardBlockText(card)}</strong></span><span><b>ENERJİ</b><strong>{card.manaBedeli}</strong></span></span>
        <span className="card-action">{isPlayable ? 'Oynamaya hazır' : reason}</span>
      </span>
    </button>
    <button type="button" className="card-inspect" aria-label={`${card.isim} ayrıntılarını incele`} onClick={inspect}>İncele</button>
    {zoomed && createPortal(<div className="card-inspection-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setZoomed(false); }}>
      <div ref={modalRef} className="card-inspection" role="dialog" aria-modal="true" aria-label={`${card.isim} ayrıntıları`}>
        <button ref={closeRef} type="button" onClick={() => setZoomed(false)} aria-label="Kart incelemesini kapat">×</button>
        <p>{rarityName(card.rarity)} · {label} · {card.manaBedeli} enerji</p><h2>{card.isim}</h2><p>{description}</p>
        <p>Saldırılar D20 + Güç ile zırha ulaşmalıdır. Doğal 1 ıskalar, doğal 20 kritik vurur. Hasara durum etkileri ve blok uygulanır.</p>
        <button type="button" disabled={!isPlayable} onClick={() => { setZoomed(false); onPlay(card); }}>{isPlayable ? 'Kartı oyna' : reason}</button>
      </div>
    </div>, document.body)}
  </>;
};
