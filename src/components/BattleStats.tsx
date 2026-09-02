// Bu dosya src/components/BattleStats.tsx için ilgili kodları içerir.
// Bileşen: oyunun temel istatistiklerini (can, blok, zirh, vs.) gösterir
// Bileşen: oyunun temel istatistiklerini (can, blok, zirh, vs.) gösterir
import React from 'react';
import { useGameStore } from '../state/store';
import type { EnemyIntent } from '../types/game';
import { useShallow } from 'zustand/react/shallow';

interface FighterPanelProps {
  kind: 'player' | 'enemy';
  name: string;
  health: number;
  maxHealth: number;
  strength: number;
  block: number;
  posture: number;
  maxPosture: number;
  staggered: boolean;
  statuses: Array<{ id: string; stacks: number; duration: number }>;
  statusLabel: (status: { id: string; stacks: number; duration: number }) => string;
  intent?: React.ReactNode;
  energy?: React.ReactNode;
}

function FighterPanel({ kind, name, health, maxHealth, strength, block, posture, maxPosture, staggered, statuses, statusLabel, intent, energy }: FighterPanelProps) {
  const healthPercent = Math.max(0, (health / maxHealth) * 100);
  const isPlayer = kind === 'player';

  return (
    <article className={`fighter fighter--${kind}${healthPercent <= 30 ? ' fighter--low-health' : ''}`}>
      <div className={`fighter-avatar fighter-avatar--${kind}`} aria-hidden="true">{isPlayer ? 'E' : 'G'}</div>
      <div className="fighter-copy">
        <p className="fighter-kicker">{isPlayer ? 'Oyuncu' : 'Düşman'}</p>
        <h2>{name}</h2>
        <div className="health-row"><span>Can <small>{healthPercent <= 30 ? 'Kritik' : isPlayer ? 'Güvende' : 'Aktif'}</small></span><strong>{health} / {maxHealth}</strong></div>
        <div className="health-bar" role="progressbar" aria-label={`${isPlayer ? 'Oyuncu' : 'Düşman'} canı`} aria-valuenow={health} aria-valuemin={0} aria-valuemax={maxHealth}><span style={{ width: `${healthPercent}%` }} /></div>
        <div className={`posture-bar${staggered ? ' posture-bar--broken' : ''}`} role="progressbar" aria-label={`${isPlayer ? 'Oyuncu' : 'Düşman'} denge`} aria-valuenow={posture} aria-valuemin={0} aria-valuemax={maxPosture}><span style={{ width: `${(posture / maxPosture) * 100}%` }} /></div>
        <small className="posture-label">{staggered ? 'KIRILDI · 2x HASAR' : `DENGE ${posture} / ${maxPosture}`}</small>
        <div className="fighter-stats">
          <span className="stat-item"><b>+{strength}</b><small>GÜÇ</small></span>
          <span className="stat-item block-value"><b>{block}</b><small>BLOK</small></span>
        </div>
        {statuses.length > 0 && <div className="status-row" aria-label={`${isPlayer ? 'Oyuncu' : 'Düşman'} etkileri`}>{statuses.map((status) => <span key={status.id} className={`status-chip${isPlayer ? '' : ' status-chip--enemy'}`} title={statusLabel(status)}>{statusLabel(status)}</span>)}</div>}
        {intent}
      </div>
      {energy}
    </article>
  );
}

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
  const {
    player,
    enemy,
    currentEnergy,
    maxEnergy,
    playerBlock,
    enemyBlock,
    enemyIntent,
    enemyIntentValue,
    playerStatuses,
    enemyStatuses,
    gold,
    deckSize,
    handSize,
    discardSize,
  } = useGameStore(useShallow((state) => ({
    player: state.player,
    enemy: state.enemy,
    currentEnergy: state.currentEnergy,
    maxEnergy: state.maxEnergy,
    playerBlock: state.playerBlock,
    enemyBlock: state.enemyBlock,
    enemyIntent: state.enemyIntent,
    enemyIntentValue: state.enemyIntentValue,
    playerStatuses: state.playerStatuses,
    enemyStatuses: state.enemyStatuses,
    gold: state.gold,
    deckSize: state.deck.length,
    handSize: state.hand.length,
    discardSize: state.discardPile.length,
  })));
  const { type: intentType, valueText } = getIntentDetails(enemyIntent);
  const intentIsAttack = ['attack', 'saldırı', 'saldiri'].includes(intentType);
  const intentIsDefend = ['defend', 'defense', 'savunma'].includes(intentType);
  const telegraph = enemyIntent?.telegraph;
  const intentLabel = telegraph?.label ?? (intentIsAttack ? 'Saldıracak' : intentIsDefend ? 'Savunacak' : intentType ? 'Özel hamle' : 'Hamle bekleniyor');
  const intentClass = intentIsAttack ? 'attack' : intentIsDefend ? 'defend' : 'special';
  const displayedIntentValue = valueText || (intentIsDefend && enemyBlock > 0 ? `${enemyBlock} blok` : intentType === 'special' && enemyIntentValue > 0 ? `${enemyIntentValue} tahmini iyileşme` : '');
  const statusLabel = (status: { id: string; stacks: number; duration: number }) => {
    const labels: Record<string, string> = { poisoned: 'Zehirli', vulnerable: 'Savunmasız', weakened: 'Güçsüz', empowered: 'Güçlü', fortified: 'Tahkimli' };
    return `${labels[status.id] ?? status.id} · ${status.stacks} stack · ${status.duration} tur`;
  };

  return (
    <>
      <FighterPanel kind="player" name={player.isim} health={player.mevcutCan} maxHealth={player.maksimumCan} strength={player.gucCarpani} block={playerBlock} posture={player.denge ?? 0} maxPosture={player.maksimumDenge ?? 10} staggered={player.staggered ?? false} statuses={playerStatuses} statusLabel={statusLabel} energy={<div className="energy-display" aria-label={`${currentEnergy} / ${maxEnergy} enerji`}>
          <small>ENERJİ</small>
          <span>{currentEnergy} <b>/ {maxEnergy}</b></span>
          <span className="energy-pips" aria-hidden="true">{Array.from({ length: maxEnergy }, (_, index) => <i key={index} className={index < currentEnergy ? 'energy-pip energy-pip--full' : 'energy-pip'} />)}</span>
        </div>} />

      <FighterPanel kind="enemy" name={enemy.isim} health={enemy.mevcutCan} maxHealth={enemy.maksimumCan} strength={enemy.gucCarpani} block={enemyBlock} posture={enemy.denge ?? 0} maxPosture={enemy.maksimumDenge ?? 10} staggered={enemy.staggered ?? false} statuses={enemyStatuses} statusLabel={statusLabel} intent={<div key={`${intentType}-${displayedIntentValue}`} className={`enemy-intent enemy-intent--${intentClass}`} aria-live="polite">
            <span className="enemy-intent__icon" aria-hidden="true">{telegraph?.icon ?? (intentIsAttack ? '⚔' : intentIsDefend ? '◈' : '✦')}</span>
            <span><b>Düşman niyeti</b><strong>{intentLabel}</strong></span>
            {displayedIntentValue && <small>{displayedIntentValue}</small>}
          </div>} />
      <span className="sr-only">Altın: {gold}. Deste: {deckSize}, El: {handSize}, Mezarlık: {discardSize}</span>
    </>
  );
};
