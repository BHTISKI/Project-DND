// Bu dosya src/components/Hand.tsx için ilgili kodları içerir.
// Bileşen: eldeki kartları listeler ve etkileşimli kart seçimini sunar
// Bileşen: eldeki kartları listeler ve etkileşimli kart seçimini sunar
import React, { useState } from 'react';
import type { Card } from '../types/game';
import { useGameStore } from '../state/store';
import { CardComponent } from './Card';
import { advanceCombo, cardCategory, finisherBonus } from '../mechanics/finisher';

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
  const comboCount = useGameStore(s => s.comboCount);
  const previousCategory = useGameStore(s => s.comboChain.at(-1));
  const canAct = useGameStore(s => !s.player.staggered && s.player.mevcutCan > 0 && s.enemy.mevcutCan > 0);
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
            const reason = !isPlayerTurn || gamePhase !== 'combat' ? 'Oyuncu turu değil' : !canAct ? 'Bu tur hamle yapılamaz' : card.onDiscardPenalty ? 'Lanetli kart oynanamaz' : currentEnergy < card.manaBedeli ? 'Yeterli enerji yok' : '';
            const playable = reason === '';
            const projectedCombo = advanceCombo(comboCount, previousCategory, cardCategory(card));
            const bonus = finisherBonus(card, projectedCombo);
            const mechanicHint = card.finisher
              ? bonus ? `Bitirici hazır · +${bonus} hasar` : `Bitirici: kombo ${projectedCombo}/${card.finisher.threshold}`
              : card.retain ? 'Oynamazsan elinde kalır' : card.exhaust ? 'Bu savaşta tek kullanım' : undefined;
            return (
              <div
                key={card.id}
                className="card-hit-area"
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
                  isDragging={draggedCardId === card.id}
                  denied={deniedCardId === card.id}
                  isDraggable={playable}
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
