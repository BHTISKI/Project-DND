// Bu dosya src/components/Hand.tsx için ilgili kodları içerir.
// Bileşen: eldeki kartları listeler ve etkileşimli kart seçimini sunar
// Bileşen: eldeki kartları listeler ve etkileşimli kart seçimini sunar
import React, { useState } from 'react';
import type { Card } from '../types/game';
import { useGameStore } from '../state/store';
import { CardComponent } from './Card';

interface HandProps {
  draggedCardId?: string | null;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

export const Hand: React.FC<HandProps> = ({ draggedCardId = null, onDragStart = () => undefined, onDragEnd = () => undefined }) => {
  const hand = useGameStore((s) => s.hand);
  const playCard = useGameStore((s) => s.playCard);
  const isPlayerTurn = useGameStore((s) => s.isPlayerTurn);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const currentEnergy = useGameStore((s) => s.currentEnergy);
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
            const playable = isPlayerTurn && gamePhase === 'combat' && !card.onDiscardPenalty && currentEnergy >= card.manaBedeli;
            return (
              <div
                key={card.id}
                className="card-hit-area"
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
                  isDragging={draggedCardId === card.id}
                  denied={deniedCardId === card.id}
                  isDraggable={true}
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