import React from 'react';
import { useGameStore } from '../state/store';
import type { EnemyIntent } from '../types/game';

function getIntentDetails(value: EnemyIntent | null | undefined) {
  if (!value) return { type: '', valueText: '' };

  const valueText = value.estimatedDamage !== undefined
    ? `${value.estimatedDamage} tahmini hasar`
    : value.estimatedBlock !== undefined
      ? `${value.estimatedBlock} blok`
      : value.estimatedHeal !== undefined
        ? `${value.estimatedHeal} tahmini iyileşme`
        : '';

  return {
    type: value.type,
    valueText,
  };
}

export const BattleStats: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const enemy = useGameStore((state) => state.enemy);
  const currentEnergy = useGameStore((state) => state.currentEnergy);
  const maxEnergy = useGameStore((state) => state.maxEnergy);
  const playerBlock = useGameStore((state) => state.playerBlock);
  const enemyBlock = useGameStore((state) => state.enemyBlock);
  const enemyIntent = useGameStore((state) => state.enemyIntent);
  const enemyIntentValue = useGameStore((state) => state.enemyIntentValue);
  const playerStatuses = useGameStore((state) => state.playerStatuses);
  const enemyStatuses = useGameStore((state) => state.enemyStatuses);
  const gold = useGameStore((state) => state.gold);
  const deckSize = useGameStore((state) => state.deck.length);
  const handSize = useGameStore((state) => state.hand.length);
  const discardSize = useGameStore((state) => state.discardPile.length);
  const { type: intentType, valueText } = getIntentDetails(enemyIntent);
  const intentIsAttack = ['attack', 'saldırı', 'saldiri'].includes(intentType);
  const intentIsDefend = ['defend', 'defense', 'savunma'].includes(intentType);
  const intentLabel = intentIsAttack ? 'Saldıracak' : intentIsDefend ? 'Savunacak' : intentType ? 'Özel hamle' : 'Hamle bekleniyor';
  const intentClass = intentIsAttack ? 'attack' : intentIsDefend ? 'defend' : 'special';
  const displayedIntentValue = valueText || (intentIsDefend && enemyBlock > 0 ? `${enemyBlock} blok` : intentType === 'special' && enemyIntentValue > 0 ? `${enemyIntentValue} tahmini iyileşme` : '');
  const playerHealthPercent = Math.max(0, (player.mevcutCan / player.maksimumCan) * 100);
  const enemyHealthPercent = Math.max(0, (enemy.mevcutCan / enemy.maksimumCan) * 100);
  const statusLabel = (status: { id: string; stacks: number; duration: number }) => {
    const labels: Record<string, string> = { poisoned: 'Zehirli', vulnerable: 'Savunmasız', weakened: 'Güçsüz', empowered: 'Güçlü', fortified: 'Tahkimli' };
    return `${labels[status.id] ?? status.id} · ${status.stacks} stack · ${status.duration} tur`;
  };

  return (
    <>
      <article className={`fighter fighter--player${playerHealthPercent <= 30 ? ' fighter--low-health' : ''}`}>
        <div className="fighter-icon" aria-hidden="true">E</div>
        <div className="fighter-copy">
          <p className="fighter-kicker">Oyuncu</p>
          <h2>{player.isim}</h2>
          <div className="health-row"><span>Can <small>{playerHealthPercent <= 30 ? 'Kritik' : 'Güvende'}</small></span><strong>{player.mevcutCan} / {player.maksimumCan}</strong></div>
          <div className="health-bar" role="progressbar" aria-label="Oyuncu canı" aria-valuenow={player.mevcutCan} aria-valuemin={0} aria-valuemax={player.maksimumCan}><span style={{ width: `${playerHealthPercent}%` }} /></div>
          <div className="fighter-stats"><span><b>{player.zirhSinifi}</b><small>AC</small></span><span><b>+{player.gucCarpani}</b><small>GÜÇ</small></span><span className="block-value"><b>{playerBlock}</b><small>BLOK</small></span></div>
          {playerStatuses.length > 0 && <div className="status-row" aria-label="Oyuncu etkileri">{playerStatuses.map((status) => <span key={status.id} className="status-chip" title={statusLabel(status)}>{statusLabel(status)}</span>)}</div>}
        </div>
        <div className="energy-display" aria-label={`${currentEnergy} / ${maxEnergy} enerji`}>
          <small>ENERJİ</small>
          <span>{currentEnergy} <b>/ {maxEnergy}</b></span>
          <span className="energy-pips" aria-hidden="true">{Array.from({ length: maxEnergy }, (_, index) => <i key={index} className={index < currentEnergy ? 'energy-pip energy-pip--full' : 'energy-pip'} />)}</span>
        </div>
      </article>

      <article className={`fighter fighter--enemy${enemyHealthPercent <= 30 ? ' fighter--low-health' : ''}`}>
        <div className="fighter-icon" aria-hidden="true">G</div>
        <div className="fighter-copy">
          <p className="fighter-kicker">Düşman</p>
          <h2>{enemy.isim}</h2>
          <div className="health-row"><span>Can <small>{enemyHealthPercent <= 30 ? 'Kritik' : 'Aktif'}</small></span><strong>{enemy.mevcutCan} / {enemy.maksimumCan}</strong></div>
          <div className="health-bar" role="progressbar" aria-label="Düşman canı" aria-valuenow={enemy.mevcutCan} aria-valuemin={0} aria-valuemax={enemy.maksimumCan}><span style={{ width: `${enemyHealthPercent}%` }} /></div>
          <div className="fighter-stats"><span><b>{enemy.zirhSinifi}</b><small>AC</small></span><span><b>+{enemy.gucCarpani}</b><small>GÜÇ</small></span><span className="block-value"><b>{enemyBlock}</b><small>BLOK</small></span></div>
          {enemyStatuses.length > 0 && <div className="status-row" aria-label="Düşman etkileri">{enemyStatuses.map((status) => <span key={status.id} className="status-chip status-chip--enemy" title={statusLabel(status)}>{statusLabel(status)}</span>)}</div>}
          <div key={`${intentType}-${displayedIntentValue}`} className={`enemy-intent enemy-intent--${intentClass}`} aria-live="polite">
            <span className="enemy-intent__icon" aria-hidden="true">{intentIsAttack ? '⚔' : intentIsDefend ? '◈' : '✦'}</span>
            <span><b>Düşman niyeti</b><strong>{intentLabel}</strong></span>
            {displayedIntentValue && <small>{displayedIntentValue}</small>}
          </div>
        </div>
      </article>
      <span className="sr-only">Altın: {gold}. Deste: {deckSize}, El: {handSize}, Mezarlık: {discardSize}.</span>
    </>
  );
};