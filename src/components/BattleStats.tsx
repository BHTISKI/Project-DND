import React from 'react';
import { useGameStore } from '../state/store';

interface EnemyIntent {
  type?: string;
  kind?: string;
  action?: string;
  damage?: number;
  estimatedDamage?: number;
  minDamage?: number;
  maxDamage?: number;
}

type StateWithEnemyIntent = ReturnType<typeof useGameStore.getState> & {
  enemyIntent?: EnemyIntent | string;
  nextEnemyIntent?: EnemyIntent | string;
};

function getIntentDetails(value: EnemyIntent | string | undefined) {
  if (!value) return { type: '', damageText: '' };

  if (typeof value === 'string') {
    return { type: value.toLowerCase(), damageText: '' };
  }

  const damage = value.damage ?? value.estimatedDamage;
  const damageText = typeof damage === 'number'
    ? `${damage} tahmini hasar`
    : typeof value.minDamage === 'number' && typeof value.maxDamage === 'number'
      ? `${value.minDamage}-${value.maxDamage} tahmini hasar`
      : '';

  return {
    type: (value.type ?? value.kind ?? value.action ?? '').toLowerCase(),
    damageText,
  };
}

export const BattleStats: React.FC = () => {
  const gameState = useGameStore();
  const {
    player,
    enemy,
    currentEnergy,
    maxEnergy,
    gold,
    deck,
    hand,
    discardPile,
  } = gameState;
  const stateWithIntent = gameState as StateWithEnemyIntent;
  const enemyWithIntent = enemy as typeof enemy & { intent?: EnemyIntent | string };
  const { type: intentType, damageText } = getIntentDetails(
    enemyWithIntent.intent ?? stateWithIntent.enemyIntent ?? stateWithIntent.nextEnemyIntent,
  );
  const intentIsAttack = ['attack', 'saldırı', 'saldiri'].includes(intentType);
  const intentIsDefend = ['defend', 'defense', 'savunma'].includes(intentType);
  const intentLabel = intentIsAttack ? 'Saldıracak' : intentIsDefend ? 'Savunacak' : intentType ? 'Özel hamle' : 'Hamle bekleniyor';
  const intentClass = intentIsAttack ? 'attack' : intentIsDefend ? 'defend' : 'special';
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
          <div className={`enemy-intent enemy-intent--${intentClass}`} aria-live="polite">
            <span className="enemy-intent__icon" aria-hidden="true">{intentIsAttack ? '⚔' : intentIsDefend ? '◈' : '✦'}</span>
            <span><b>Düşman niyeti</b><strong>{intentLabel}</strong></span>
            {damageText && <small>{damageText}</small>}
          </div>
        </div>
      </article>
      <span className="sr-only">Altın: {gold}. Deste: {deck.length}, El: {hand.length}, Mezarlık: {discardPile.length}.</span>
    </>
  );
};