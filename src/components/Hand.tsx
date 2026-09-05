// Bu dosya src/components/Hand.tsx için ilgili kodları içerir.
// Bileşen: eldeki kartları listeler ve etkileşimli kart seçimini sunar
import React, { useState } from 'react';
import type { Card } from '../types/game';
import { useGameStore } from '../state/store';
import { CardComponent } from './Card';
import type { CardDropPoint } from './Card';
import { advanceCombo, cardCategory, finisherBonus } from '../mechanics/finisher';
import { canExecute, cardUnavailableReason, isMeleeCard } from '../mechanics/posture';

interface HandProps {
  draggedCardId?: string | null;
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string, point: CardDropPoint | null) => void;
  dragBounds?: React.RefObject<HTMLDivElement | null>;
}

export const Hand: React.FC<HandProps> = ({ draggedCardId = null, onDragStart = () => undefined, onDragEnd = () => undefined, dragBounds }) => {
  const hand = useGameStore((s) => s.hand);
  const playCard = useGameStore((s) => s.playCard);
  const isPlayerTurn = useGameStore((s) => s.isPlayerTurn);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const currentEnergy = useGameStore((s) => s.currentEnergy);
  const comboCount = useGameStore(s => s.comboCount);
  const previousCategory = useGameStore(s => s.comboChain.at(-1));
  const player = useGameStore(s => s.player);
  const enemy = useGameStore(s => s.enemy);
  const pendingParry = useGameStore(s => s.pendingParry);
  const [deniedCardId, setDeniedCardId] = useState<string | null>(null);

  const handlePlay = (card: Card) => {
    // Only allow playing in combat phase and player turn
    if (!isPlayerTurn || gamePhase !== 'combat') return;

    // Play card (handles discarding, energy spend, attack, damage, logging)
    playCard(card.id);
  };

  return (
    <div className={`hand-grid${isPlayerTurn && gamePhase === 'combat' ? '' : ' hand-grid--inactive'}`} role="list" aria-label="Kart eli" aria-live="polite">
      {hand.length === 0 ? (
        <div className="empty-state">
          <i>Elinizde kart yok</i>
        </div>
      ) : (
        <>
          {hand.map((card, index) => {
            // Yelpaze merkeze göre açılır; küçük, sabit ofsetler kağıtların doğal dizilişini korur.
            const fanPosition = index - (hand.length - 1) / 2;
            const fanAngle = Math.max(-6, Math.min(6, fanPosition * 1.6));
            const fanY = Math.min(12, Math.abs(fanPosition) ** 1.5 * 2.5);
            const reason = cardUnavailableReason({ gamePhase, isPlayerTurn, player, enemy, currentEnergy, pendingParry }, card);
            const playable = reason === '';
            const projectedCombo = advanceCombo(comboCount, previousCategory, cardCategory(card));
            const bonus = finisherBonus(card, projectedCombo);
            const executeReady = playable && canExecute(enemy) && isMeleeCard(card);
            const mechanicHint = executeReady ? 'İnfaz hazır'
              : card.finisher
              ? bonus ? `Bitirici hazır · +${bonus} hasar` : `Bitirici: kombo ${projectedCombo}/${card.finisher.threshold}`
              : card.retain ? 'Oynamazsan elinde kalır' : card.exhaust ? 'Bu savaşta tek kullanım' : undefined;
            return (
              <div
                key={card.id}
                className={`card-hit-area${draggedCardId === card.id ? ' is-dragging' : ''}`}
                style={{ '--fan-angle': `${fanAngle}deg`, '--fan-y': `${fanY}px`, '--card-index': index, '--hand-size': hand.length } as React.CSSProperties}
                role="listitem"
                onPointerDown={() => {
                  if (!playable) {
                    setDeniedCardId(card.id);
                    window.setTimeout(() => setDeniedCardId(null), 360);
                  }
                }}
              >
                <CardComponent
                  card={card}
                  style={{ '--draw-delay': `${index * 65}ms` } as React.CSSProperties}
                  onPlay={handlePlay}
                  isPlayable={playable}
                  unavailableReason={reason}
                  mechanicHint={mechanicHint}
                  executeReady={executeReady}
                  isDragging={draggedCardId === card.id}
                  denied={deniedCardId === card.id}
                  isDraggable={playable}
                  fanAngle={fanAngle}
                  dragBounds={dragBounds}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
