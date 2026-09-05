// Bu dosya src/components/BattleStats.tsx için ilgili kodları içerir.
// Bileşen: oyunun temel savaş istatistiklerini gösterir
import React from 'react';
import { useGameStore } from '../state/store';
import type { EnemyIntent } from '../types/game';
import type { Character } from '../types/game';
import { useShallow } from 'zustand/react/shallow';
import { PostureBar } from './PostureBar';
import { HealthBar } from './HealthBar';
import { FighterFeedback } from './CombatFeedback';

interface FighterPanelProps {
  kind: 'player' | 'enemy';
  fighter: Character;
  avatarSrc: string;
  block: number;
  statuses: Array<{ id: string; stacks: number; duration: number }>;
  statusLabel: (status: { id: string; stacks: number; duration: number }) => string;
  intent?: React.ReactNode;
  energy?: React.ReactNode;
  emotion?: string;
}

function FighterPanel({ kind, fighter, avatarSrc, block, statuses, statusLabel, intent, energy, emotion }: FighterPanelProps) {
  const { isim: name, mevcutCan: health, maksimumCan: maxHealth, hasarBonusu: damageBonus } = fighter;
  const healthPercent = Math.max(0, (health / maxHealth) * 100);
  const isPlayer = kind === 'player';

  return (
    <article data-emotion={emotion} className={`fighter fighter--${kind}${healthPercent <= 30 ? ' fighter--low-health' : ''}${health <= 0 ? ' fighter--defeated' : healthPercent <= 50 ? ' fighter--wounded' : ''}${fighter.isBroken ? ' fighter--broken' : ''}`}>
      <FighterFeedback target={kind} />
      <div className="fighter-copy">
        <p className="fighter-kicker">{isPlayer ? 'Oyuncu' : 'Düşman'}</p>
        <h2>{name}</h2>
        <div className={`fighter-avatar fighter-avatar--${kind}`} aria-label={isPlayer ? 'Oyuncu afişi' : 'Düşman afişi'}>
          <img src={avatarSrc} alt={isPlayer ? 'Oyuncu avatar' : `${name} avatar`} className="fighter-avatar-img" />
        </div>
        <div className="health-row"><span>Can {health <= 0 ? <small>Yenildi</small> : healthPercent <= 30 && <small>Kritik</small>}</span><strong>{health} / {maxHealth}</strong></div>
        <HealthBar key={fighter.id} health={health} maxHealth={maxHealth} owner={isPlayer ? 'Oyuncu' : 'Düşman'} />
        {health > 0 && <PostureBar character={fighter} owner={isPlayer ? 'Oyuncu' : 'Düşman'} />}
        <div className="fighter-stats">
          <span className="stat-item"><b>+{damageBonus}</b><small>HASAR</small></span>
          <span className="stat-item block-value"><b>{block}</b><small>BLOK</small></span>
        </div>
        {statuses.length > 0 && <div className="status-row" aria-label={`${isPlayer ? 'Oyuncu' : 'Düşman'} etkileri`}>{statuses.map((status) => <span key={status.id} className={`status-chip${isPlayer ? '' : ' status-chip--enemy'}`} title={statusLabel(status)}>{statusLabel(status)}</span>)}</div>}
        {health > 0 && intent}
      </div>
      {energy}
    </article>
  );
}

function getIntentDetails(value: EnemyIntent | null | undefined) {
  if (!value) return { type: '', valueText: '' };

  const valueText = value.estimatedDamage !== undefined
    ? `${value.estimatedDamage} hasar`
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

interface BattleStatsProps {
  side?: 'all' | 'player' | 'enemy';
}

export const BattleStats: React.FC<BattleStatsProps> = ({ side = 'all' }) => {
  const emotion = useGameStore(s => s.enemyDialog[0]?.emotion);
  const {
    player,
    enemy,
    enemyArchetype,
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
    enemyArchetype: state.enemyArchetype,
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
  const enemyAvatarSrc = enemyArchetype === 'guardian' || enemyArchetype === 'knight'
    ? '/assets/enemy-armored-paint.png'
    : '/assets/enemy-hooded-paint.png';
  const { type: intentType, valueText } = getIntentDetails(enemyIntent);
  const intentIsAttack = ['attack', 'saldırı', 'saldiri'].includes(intentType);
  const intentIsDefend = ['defend', 'defense', 'savunma'].includes(intentType);
  const telegraph = enemyIntent?.telegraph;
  const intentLabel = telegraph?.label ?? (intentIsAttack ? 'Saldıracak' : intentIsDefend ? 'Savunacak' : intentType ? 'Özel hamle' : 'Hamle bekleniyor');
  const intentClass = intentIsAttack ? 'attack' : intentIsDefend ? 'defend' : 'special';
  const displayedIntentValue = valueText || (intentIsDefend && enemyBlock > 0 ? `${enemyBlock} blok` : intentType === 'special' && enemyIntentValue > 0 ? `${enemyIntentValue} tahmini iyileşme` : '');
  const statusLabel = (status: { id: string; stacks: number; duration: number }) => {
    const labels: Record<string, string> = { poisoned: 'Zehirli', vulnerable: 'Savunmasız', weakened: 'Güçsüz', empowered: 'Güçlü', fortified: 'Tahkimli', postureExposed: 'Duruş açığı' };
    return `${labels[status.id] ?? status.id} · ${status.stacks} yük · ${status.duration} tur`;
  };

  return (
    <>
      {(side === 'all' || side === 'player') && <FighterPanel kind="player" fighter={player} avatarSrc="/assets/player-paint.png" block={playerBlock} statuses={playerStatuses} statusLabel={statusLabel} energy={<div className="energy-display" aria-label={`${currentEnergy} / ${maxEnergy} enerji`}>
          <small>ENERJİ</small>
          <span>{currentEnergy} <b>/ {maxEnergy}</b></span>
          <span className="energy-pips" aria-hidden="true">{Array.from({ length: maxEnergy }, (_, index) => <i key={index} className={index < currentEnergy ? 'energy-pip energy-pip--full' : 'energy-pip'} />)}</span>
        </div>} />}

      {(side === 'all' || side === 'enemy') && <FighterPanel kind="enemy" emotion={emotion} fighter={enemy} avatarSrc={enemyAvatarSrc} block={enemyBlock} statuses={enemyStatuses} statusLabel={statusLabel} intent={<div key={`${intentType}-${displayedIntentValue}`} className={`enemy-intent enemy-intent--${intentClass}`} aria-live="polite">
            <span className="enemy-intent__icon" aria-hidden="true">{telegraph?.icon ?? (intentIsAttack ? '⚔' : intentIsDefend ? '◈' : '✦')}</span>
            <span><b>Düşman niyeti</b><strong>{intentLabel}</strong></span>
            {displayedIntentValue && <small>{displayedIntentValue}</small>}
          </div>} />}
      <span className="sr-only">Altın: {gold}. Deste: {deckSize}, El: {handSize}, Mezarlık: {discardSize}</span>
    </>
  );
};
