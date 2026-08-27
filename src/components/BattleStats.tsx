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
  const playerHealthPercent = Math.max(0, (player.mevcutCan / player.maksimumCan) * 100);
  const enemyHealthPercent = Math.max(0, (enemy.mevcutCan / enemy.maksimumCan) * 100);

  return (
    <>
      <article className={`fighter fighter--player${playerHealthPercent <= 30 ? ' fighter--low-health' : ''}`}>
        <div className="fighter-icon">E</div>
        <div className="fighter-copy">
          <p className="fighter-kicker">Oyuncu</p>
          <h2>{player.isim}</h2>
          <div className="health-row"><span>Can <small>{playerHealthPercent <= 30 ? 'Kritik' : 'Güvende'}</small></span><strong>{player.mevcutCan} / {player.maksimumCan}</strong></div>
          <div className="health-bar" role="progressbar" aria-label="Oyuncu canı" aria-valuenow={player.mevcutCan} aria-valuemin={0} aria-valuemax={player.maksimumCan}><span style={{ width: `${playerHealthPercent}%` }} /></div>
          <div className="fighter-stats"><span>AC <b>{player.zirhSinifi}</b></span><span>Güç <b>+{player.gucCarpani}</b></span></div>
        </div>
        <div className="energy-display" aria-label={`${currentEnergy} / ${maxEnergy} enerji`}><span>{currentEnergy}</span><small>/ {maxEnergy} enerji</small><i aria-hidden="true" /></div>
      </article>

      <article className={`fighter fighter--enemy${enemyHealthPercent <= 30 ? ' fighter--low-health' : ''}`}>
        <div className="fighter-icon">G</div>
        <div className="fighter-copy">
          <p className="fighter-kicker">Düşman</p>
          <h2>{enemy.isim}</h2>
          <div className="health-row"><span>Can <small>{enemyHealthPercent <= 30 ? 'Kritik' : 'Aktif'}</small></span><strong>{enemy.mevcutCan} / {enemy.maksimumCan}</strong></div>
          <div className="health-bar" role="progressbar" aria-label="Düşman canı" aria-valuenow={enemy.mevcutCan} aria-valuemin={0} aria-valuemax={enemy.maksimumCan}><span style={{ width: `${enemyHealthPercent}%` }} /></div>
          <div className="fighter-stats"><span>AC <b>{enemy.zirhSinifi}</b></span><span>Güç <b>+{enemy.gucCarpani}</b></span></div>
        </div>
      </article>
      <span className="sr-only">Altın: {gold}. Deste: {deck.length}, El: {hand.length}, Mezarlık: {discardPile.length}.</span>
    </>
  );
};