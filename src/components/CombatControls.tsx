// Bu dosya src/components/CombatControls.tsx için ilgili kodları içerir.
// Bileşen: oyuncunun turunu sonlandırmasını sağlar
import React from 'react';
import { useGameStore } from '../state/store';
import { cardUnavailableReason } from '../mechanics/posture';

export const CombatControls: React.FC = () => {
  const endTurn = useGameStore((s) => s.endTurn);
  const playable = useGameStore(s => s.hand.filter(card => !cardUnavailableReason(s, card)).length);
  const incoming = useGameStore(s => s.enemyIntent?.estimatedDamage ?? 0);
  const block = useGameStore(s => s.playerBlock);

  return (
    <div className="turn-command"><p role="status">{playable ? `${playable} kart oynayabilirsin.` : 'Oynanabilir kart kalmadı. Sıradaki turda yeni el gelecek.'} {incoming > 0 && `Rakibin ${incoming} hasar hazırlıyor; ${block} bloğun var.`}</p><button onClick={endTurn} className="button button--turn" type="button" aria-label="Oyuncu turunu bitir">
      <span className="button-icon" aria-hidden="true">↳</span>
      Turu Bitir
    </button></div>
  );
};
