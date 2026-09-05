import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type React from 'react';
import { createPortal } from 'react-dom';
import { animate, motion, useDragControls, useMotionValue } from 'framer-motion';
import type { Card } from '../types/game';
import { cardBlockText, cardDamageText, describeCard, rarityName } from '../utils/cardText';
import { usePreferencesStore } from '../state/preferences';

export interface CardDropPoint { x: number; y: number }

// Sistem tercihi açık oturumda da değişebilir; yalnız ilk değeri saklamak yerine değişimi dinleriz.
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const readReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.(reducedMotionQuery).matches;
const subscribeReducedMotion = (notify: () => void) => {
  const media = window.matchMedia?.(reducedMotionQuery);
  media?.addEventListener('change', notify);
  return () => media?.removeEventListener('change', notify);
};

interface CardProps {
  card: Card; onPlay: (card: Card) => void; isPlayable?: boolean; style?: React.CSSProperties;
  isDraggable?: boolean; onDragStart?: (id: string) => void; onDragEnd?: (id: string, point: CardDropPoint | null) => void;
  dragBounds?: React.RefObject<HTMLDivElement | null>; fanAngle?: number;
  isDragging?: boolean; denied?: boolean; unavailableReason?: string; mechanicHint?: string; executeReady?: boolean;
}
export const CardComponent: React.FC<CardProps> = ({
  card, onPlay, isPlayable = true, style, isDraggable = false, dragBounds, fanAngle = 0,
  onDragStart = () => undefined, onDragEnd = () => undefined, isDragging = false, denied = false, unavailableReason, mechanicHint, executeReady = false,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragLimits, setDragLimits] = useState<{ left: number; right: number; top: number; bottom: number }>();
  const dragActive = useRef(false);
  const suppressClick = useRef(false);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const motionEnabled = usePreferencesStore(s => s.motionEnabled);
  const prefersReducedMotion = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false);
  const reduceMotion = !motionEnabled || !!prefersReducedMotion;
  // Kart kimliği sabit bir açı üretir; enerji ve can güncellenirken kart masada kıpırdamaz.
  const cardSeed = Array.from(card.id).reduce((seed, character) => (seed * 31 + character.charCodeAt(0)) | 0, 0);
  const restingRotation = fanAngle + ((Math.abs(cardSeed) % 601) / 100 - 3);
  const spring = { type: 'spring' as const, stiffness: 220, damping: 19 };
  // Açık dinlenme hedefi, hover/drag kapanınca kartı havada bırakmaz; gölgeyi CSS sınıfı yönetir.
  const rest = { rotate: restingRotation, rotateX: 0, z: 0, scale: 1, opacity: 1 };
  const lift = isPlayable && !reduceMotion ? { ...rest, scale: 1.045, rotate: restingRotation * 0.25, rotateX: -4, z: 28 } : rest;
  const pendingClick = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const description = describeCard(card);
  const damage = cardDamageText(card);
  const glyph = card.tip === 'saldırı' ? '⚔' : card.tip === 'savunma' ? '◈' : '✦';
  const label = card.tip === 'saldırı' ? 'Saldırı' : card.tip === 'savunma' ? 'Savunma' : 'Yetenek';
  const reason = unavailableReason ?? (card.onDiscardPenalty ? 'Lanetli · oynanamaz' : 'Yeterli enerji yok');
  const cancel = () => { if (pendingClick.current !== null) clearTimeout(pendingClick.current); pendingClick.current = null; };
  // İnceleme, Escape ve pencere değişimi aynı iptal yolunu kullanır; kart oynanmaz.
  const cancelDrag = useCallback(() => {
    if (!dragActive.current) return;
    dragActive.current = false;
    dragControls.cancel();
    if (reduceMotion) { x.jump(0); y.jump(0); }
    else {
      const returnSpring = { type: 'spring' as const, stiffness: 220, damping: 19 };
      animate(x, 0, returnSpring); animate(y, 0, returnSpring);
    }
    setDragging(false);
    onDragEnd(card.id, null);
  }, [card.id, dragControls, onDragEnd, reduceMotion, x, y]);
  useEffect(() => () => { if (pendingClick.current !== null) clearTimeout(pendingClick.current); }, [card.id, isPlayable]);
  useEffect(() => () => { dragControls.cancel(); }, [dragControls]);
  useEffect(() => {
    // Az hareket seçilince yarım kalan geri dönüş yayı da anında durur; elde tutuş devam edebilir.
    if (reduceMotion && !dragActive.current) { x.jump(0); y.jump(0); }
  }, [reduceMotion, x, y]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && dragActive.current) { event.preventDefault(); cancelDrag(); } };
    // Ekran boyutu değişince yeni satır yerleşimini CSS belirler; eski sürükleme ofseti taşınmaz.
    const onResize = () => { cancelDrag(); x.jump(0); y.jump(0); };
    if (!isPlayable) cancelDrag();
    document.addEventListener('keydown', onKey);
    window.addEventListener('blur', cancelDrag);
    window.addEventListener('resize', onResize);
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('blur', cancelDrag); window.removeEventListener('resize', onResize); };
  }, [isPlayable, cancelDrag, x, y]);
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
  const inspect = () => { cancel(); cancelDrag(); setZoomed(true); };
  return <>
    <motion.button type="button"
      className={`card game-card game-card--${card.tip} game-card--${card.rarity ?? 'common'} game-card--theme-${card.theme ?? card.tip}${card.theme ? ' game-card--' + card.theme : ''}${isPlayable ? '' : ' game-card--disabled'}${executeReady ? ' game-card--execute-ready' : ''}${zoomed ? ' zoomed' : ''}${isDragging || dragging ? ' card--dragging' : ''}${denied ? ' denied-shake' : ''}`}
      aria-pressed={zoomed}
      aria-label={`${card.isim}, ${label}, ${card.manaBedeli} mana, ${damage} hasar, ${isPlayable ? card.isim + ' oynanabilir' : card.isim + ' için ' + reason.toLocaleLowerCase('tr')}${mechanicHint ? ', ' + mechanicHint : ''}`}
      disabled={!isPlayable}
      style={{ ...style, x, y, transformPerspective: 900, touchAction: isDraggable && isPlayable ? 'none' : undefined }}
      // Kısa yay geçişi, perspektif ve gölge kartın masadan elle kaldırıldığı hissini verir.
      initial={reduceMotion ? false : { rotate: restingRotation - 1, opacity: 0.9, z: 0 }}
      animate={rest}
      transition={reduceMotion ? { duration: 0 } : spring}
      whileHover={lift}
      whileFocus={lift}
      whileTap={isPlayable && !reduceMotion ? { ...rest, scale: 0.97 } : rest}
      whileDrag={isPlayable && !reduceMotion ? { scale: 1.045, rotate: restingRotation + 3, z: 36 } : rest}
      // Sınırdaki esneklik elde ağırlık hissi verir; geçersiz bırakış yayı kartı geri toplar.
      drag={isDraggable && isPlayable}
      dragControls={dragControls}
      dragConstraints={dragLimits}
      dragElastic={reduceMotion ? 0 : 0.18}
      dragMomentum={false}
      dragSnapToOrigin
      dragTransition={{ bounceStiffness: 220, bounceDamping: 19 }}
      onPointerDown={event => {
        if (dragActive.current) return;
        suppressClick.current = false;
        if (!isDraggable || !isPlayable || !dragBounds?.current) return;
        // Ref'i Motion'a vermeyiz: resize hesabı dinlenen kartları da yeniden konumlandırabiliyor.
        // Sınırlar her tutuşta dönmeyen kart yuvasından ölçülür ve o hareket için sabit kalır.
        const origin = event.currentTarget.closest('.card-hit-area') ?? event.currentTarget;
        const cardRect = origin.getBoundingClientRect();
        const tableRect = dragBounds.current.getBoundingClientRect();
        setDragLimits({
          left: tableRect.left - cardRect.left,
          right: tableRect.right - cardRect.right,
          top: tableRect.top - cardRect.top,
          bottom: tableRect.bottom - cardRect.bottom,
        });
      }}
      onKeyDownCapture={event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        // Sürüklenen kart klavyeyle aynı anda oynatılamaz; önce bırakılmalı veya iptal edilmelidir.
        if (dragActive.current) { event.preventDefault(); event.stopPropagation(); return; }
        suppressClick.current = false;
      }}
      onClick={event => {
        if (!isPlayable || dragActive.current) return;
        // Bırakmadan sonra tarayıcının ürettiği click, kartı ikinci kez oynatmamalı.
        if (suppressClick.current) return;
        cancel();
        if (event.detail === 0) onPlay(card);
        else if (event.detail === 1) pendingClick.current = setTimeout(() => { pendingClick.current = null; onPlay(card); }, 500);
      }}
      onDoubleClick={() => { if (!suppressClick.current) inspect(); }}
      onDragStart={() => { cancel(); suppressClick.current = true; dragActive.current = true; setDragging(true); onDragStart(card.id); }}
      onDragEnd={event => {
        if (!dragActive.current) return;
        cancel();
        dragActive.current = false;
        setDragging(false);
        if (reduceMotion) { x.jump(0); y.jump(0); }
        // Pointer iptali bir bırakış değildir; yalnız gerçek pointerup hedefe kart oynatabilir.
        const point = event.type === 'pointerup' && 'clientX' in event ? { x: event.clientX, y: event.clientY } : null;
        onDragEnd(card.id, point);
      }}>
      <span className="card-content">
        <span className="card-topline"><strong className="card-mana" aria-label={`${card.manaBedeli} mana`}>{card.manaBedeli}<small>MP</small></strong>
          <span className="card-type"><span aria-hidden="true">{glyph}</span>{label}</span><span className="card-rarity">{rarityName(card.rarity)}</span></span>
        <span className="card-art" aria-hidden="true"><span className="card-glyph">{glyph}</span><i /></span>
        <span className="card-name">{card.isim}{card.isUpgraded && <span aria-label="Yükseltilmiş">↑</span>}</span>
        <span className="card-effect">{description}</span>
        <span className="card-details"><span><b>HASAR</b><strong>{damage}</strong></span><span><b>BLOK</b><strong>{cardBlockText(card)}</strong></span><span><b>ENERJİ</b><strong>{card.manaBedeli}</strong></span></span>
        <span className="card-action">{isPlayable ? mechanicHint ?? 'Oynamaya hazır' : reason}</span>
      </span>
    </motion.button>
    <button type="button" className="card-inspect" aria-label={`${card.isim} ayrıntılarını incele`} onClick={inspect}>İncele</button>
    {zoomed && createPortal(<div className="card-inspection-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setZoomed(false); }}>
      <div ref={modalRef} className="card-inspection" role="dialog" aria-modal="true" aria-label={`${card.isim} ayrıntıları`}>
        <button ref={closeRef} type="button" onClick={() => setZoomed(false)} aria-label="Kart incelemesini kapat">×</button>
        <p>{rarityName(card.rarity)} · {label} · {card.manaBedeli} enerji</p><h2>{card.isim}</h2><p>{description}</p>
        {mechanicHint && <p>{mechanicHint}</p>}
        <p>Kartlarda yazan sabit değerler hasar bonusu, durum etkileri ve blokla birlikte uygulanır.</p>
        <button type="button" disabled={!isPlayable} onClick={() => { setZoomed(false); onPlay(card); }}>{isPlayable ? 'Kartı oyna' : reason}</button>
      </div>
    </div>, document.body)}
  </>;
};
