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
  estimatedBlock?: number;
  estimatedHeal?: number;
}

type StateWithEnemyIntent = ReturnType<typeof useGameStore.getState> & {
  enemyIntent?: EnemyIntent | string;
  nextEnemyIntent?: EnemyIntent | string;
};

function getIntentDetails(value: EnemyIntent | string | undefined) {
  if (!value) return { type: '', valueText: '' };

  if (typeof value === 'string') {
    return { type: value.toLowerCase(), valueText: '' };
  }

  const damage = value.damage ?? value.estimatedDamage;
  const valueText = typeof damage === 'number'
    ? `${damage} tahmini hasar`
    : typeof value.minDamage === 'number' && typeof value.maxDamage === 'number'
      ? `${value.minDamage}-${value.maxDamage} tahmini hasar`
      : typeof value.estimatedBlock === 'number'
        ? `${value.estimatedBlock} blok`
        : typeof value.estimatedHeal === 'number'
          ? `${value.estimatedHeal} tahmini iyileşme`
          : '';

  return {
    type: (value.type ?? value.kind ?? value.action ?? '').toLowerCase(),
    valueText,
  };
}

export const BattleStats: React.FC = () => {
  const gameState = useGameStore();
  const {
    player,
    enemy,
    currentEnergy,
    maxEnergy,
    playerBlock,
    enemyBlock,
    enemyIntentValue,
    gold,
    deck,
    hand,
    discardPile,
  } = gameState;
  const stateWithIntent = gameState as StateWithEnemyIntent;
  const enemyWithIntent = enemy as typeof enemy & { intent?: EnemyIntent | string };
  const { type: intentType, valueText } = getIntentDetails(
    enemyWithIntent.intent ?? stateWithIntent.enemyIntent ?? stateWithIntent.nextEnemyIntent,
  );
  const intentIsAttack = ['attack', 'saldırı', 'saldiri'].includes(intentType);
  const intentIsDefend = ['defend', 'defense', 'savunma'].includes(intentType);
  const intentLabel = intentIsAttack ? 'Saldıracak' : intentIsDefend ? 'Savunacak' : intentType ? 'Özel hamle' : 'Hamle bekleniyor';
  const intentClass = intentIsAttack ? 'attack' : intentIsDefend ? 'defend' : 'special';
  const displayedIntentValue = valueText || (intentIsDefend && enemyBlock > 0 ? `${enemyBlock} blok` : intentType === 'special' && enemyIntentValue > 0 ? `${enemyIntentValue} tahmini iyileşme` : '');
  const playerHealthPercent = Math.max(0, (player.mevcutCan / player.maksimumCan) * 100);
  const enemyHealthPercent = Math.max(0, (enemy.mevcutCan / enemy.maksimumCan) * 100);
  const statusLabel = (status: { id: string; stacks: number; duration: number }) => `${status.id} ${status.stacks}x · ${status.duration} tur`;

  return (
    <>
      <article className={`fighter fighter--player${playerHealthPercent <= 30 ? ' fighter--low-health' : ''}`}>
        <div className="fighter-icon">E</div>
        <div className="fighter-copy">
          <p className="fighter-kicker">Oyuncu</p>
          <h2>{player.isim}</h2>
          <div className="health-row"><span>Can <small>{playerHealthPercent <= 30 ? 'Kritik' : 'Güvende'}</small></span><strong>{player.mevcutCan} / {player.maksimumCan}</strong></div>
          <div className="health-bar" role="progressbar" aria-label="Oyuncu canı" aria-valuenow={player.mevcutCan} aria-valuemin={0} aria-valuemax={player.maksimumCan}><span style={{ width: `${playerHealthPercent}%` }} /></div>
          <div className="fighter-stats"><span>AC <b>{player.zirhSinifi}</b></span><span>Güç <b>+{player.gucCarpani}</b></span>{playerBlock > 0 && <span className="block-value">Blok <b>{playerBlock}</b></span>}</div>
          {gameState.playerStatuses.length > 0 && <div className="status-row" aria-label="Oyuncu etkileri">{gameState.playerStatuses.map((status) => <span key={status.id} className="status-chip">{statusLabel(status)}</span>)}</div>}
        </div>
        <div className="energy-display" aria-label={`${currentEnergy} / ${maxEnergy} enerji`}>
          <small>ENERJİ</small>
          <span>{currentEnergy} <b>/ {maxEnergy}</b></span>
          <span className="energy-pips" aria-hidden="true">{Array.from({ length: maxEnergy }, (_, index) => <i key={index} className={index < currentEnergy ? 'energy-pip energy-pip--full' : 'energy-pip'} />)}</span>
        </div>
      </article>

      <article className={`fighter fighter--enemy${enemyHealthPercent <= 30 ? ' fighter--low-health' : ''}`}>
        <div className="fighter-icon">G</div>
        <div className="fighter-copy">
          <p className="fighter-kicker">Düşman</p>
          <h2>{enemy.isim}</h2>
          <div className="health-row"><span>Can <small>{enemyHealthPercent <= 30 ? 'Kritik' : 'Aktif'}</small></span><strong>{enemy.mevcutCan} / {enemy.maksimumCan}</strong></div>
          <div className="health-bar" role="progressbar" aria-label="Düşman canı" aria-valuenow={enemy.mevcutCan} aria-valuemin={0} aria-valuemax={enemy.maksimumCan}><span style={{ width: `${enemyHealthPercent}%` }} /></div>
          <div className="fighter-stats"><span>AC <b>{enemy.zirhSinifi}</b></span><span>Güç <b>+{enemy.gucCarpani}</b></span></div>
          {gameState.enemyStatuses.length > 0 && <div className="status-row" aria-label="Düşman etkileri">{gameState.enemyStatuses.map((status) => <span key={status.id} className="status-chip status-chip--enemy">{statusLabel(status)}</span>)}</div>}
          <div key={`${intentType}-${displayedIntentValue}`} className={`enemy-intent enemy-intent--${intentClass}`} aria-live="polite">
            <span className="enemy-intent__icon" aria-hidden="true">{intentIsAttack ? '⚔' : intentIsDefend ? '◈' : '✦'}</span>
            <span><b>Düşman niyeti</b><strong>{intentLabel}</strong></span>
            {displayedIntentValue && <small>{displayedIntentValue}</small>}
          </div>
        </div>
      </article>
      <span className="sr-only">Altın: {gold}. Deste: {deck.length}, El: {hand.length}, Mezarlık: {discardPile.length}.</span>
    </>
  );
};