import type { Character, Card } from '../types/game';
import React from 'react';
import { useGameStore } from '../state/store';

export const BattleStats: React.FC = () => {
  const {
    player,
    enemy,
    currentEnergy,
    maxEnergy,
    gold,
    deck,
    hand,
    discardPile,
  } = useGameStore();

  return (
    <>
      <article className="fighter fighter--player">
        <div className="fighter-icon">E</div>
        <div className="fighter-copy">
          <p className="fighter-kicker">Oyuncu</p>
          <h2>{player.isim}</h2>
          <div className="health-row"><span>Can</span><strong>{player.mevcutCan} / {player.maksimumCan}</strong></div>
          <div className="health-bar"><span style={{ width: `${Math.max(0, (player.mevcutCan / player.maksimumCan) * 100)}%` }} /></div>
          <div className="fighter-stats"><span>AC <b>{player.zirhSinifi}</b></span><span>Güç <b>+{player.gucCarpani}</b></span></div>
        </div>
        <div className="energy-display"><span>{currentEnergy}</span><small>/ {maxEnergy} enerji</small></div>
      </article>

      <article className="fighter fighter--enemy">
        <div className="fighter-icon">G</div>
        <div className="fighter-copy">
          <p className="fighter-kicker">Düşman</p>
          <h2>{enemy.isim}</h2>
          <div className="health-row"><span>Can</span><strong>{enemy.mevcutCan} / {enemy.maksimumCan}</strong></div>
          <div className="health-bar"><span style={{ width: `${Math.max(0, (enemy.mevcutCan / enemy.maksimumCan) * 100)}%` }} /></div>
          <div className="fighter-stats"><span>AC <b>{enemy.zirhSinifi}</b></span><span>Güç <b>+{enemy.gucCarpani}</b></span></div>
        </div>
      </article>
      <span className="sr-only">Altın: {gold}. Deste: {deck.length}, El: {hand.length}, Mezarlık: {discardPile.length}.</span>
    </>
  );
};