import React from 'react';
import { useGameStore } from '../state/store';
import { enemyArchetypes } from '../engine/enemyArchetypes';
import { isMeleeAction } from '../mechanics/posture';

export const EnemyBoard: React.FC = () => {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const enemy = useGameStore((state) => state.enemy);
  const enemyArchetype = useGameStore((state) => state.enemyArchetype);
  const enemyIntent = useGameStore((state) => state.enemyIntent);
  const playerBroken = useGameStore((state) => state.player.isBroken);

  if (gamePhase !== 'combat' || !enemy) return null;

  const archetype = enemyArchetypes[enemyArchetype];
  const telegraph = enemyIntent?.telegraph;
  const intentLabel = telegraph?.label ?? (enemyIntent?.type === 'attack' ? 'Saldıracak' : enemyIntent?.type === 'defend' ? 'Savunacak' : 'Özel hamle');
  const intentIcon = telegraph?.icon ?? archetype.icon;
  const estimatedValue = enemyIntent?.estimatedDamage ?? enemyIntent?.estimatedBlock ?? enemyIntent?.estimatedHeal;
  const executeThreat = playerBroken && !!enemyIntent?.action && isMeleeAction(enemyIntent.action);

  return (
    <section className={`enemy-board enemy-board--${archetype.visualTheme}`} aria-label={`${enemy.isim} savaş masası`}>
      <div className="enemy-board__rail">
        <div className="enemy-deck" aria-label={`${enemy.isim} kapalı destesi`}>
          {Array.from({ length: archetype.cardCount }, (_, index) => (
            <span key={index} className={`enemy-deck__card ${index === archetype.cardCount - 1 ? 'enemy-deck__card--front' : 'enemy-deck__card--back'}`} style={{ '--deck-index': index } as React.CSSProperties} aria-hidden="true">
              {index === archetype.cardCount - 1 && <b>{archetype.icon}</b>}
            </span>
          ))}
          <span className="enemy-deck__count">{archetype.cardCount} KARTLIK DESTE</span>
        </div>
        <div className="enemy-board__identity">
          <span className="enemy-board__sigil" aria-hidden="true">{archetype.icon}</span>
          <div><strong>{enemy.isim}</strong><small>{archetype.role}</small></div>
        </div>
      </div>
      <div className={`intent-card intent-card--${enemyIntent?.type ?? 'special'}`} aria-live="polite">
        <span className="intent-card__kicker">Sıradaki hamle</span>
        <span className="intent-card__icon" aria-hidden="true">{intentIcon}</span>
        <strong>{intentLabel}</strong>
        {estimatedValue !== undefined && <small>{estimatedValue} {enemyIntent?.type === 'defend' ? 'blok' : enemyIntent?.estimatedHeal !== undefined ? 'iyileşme' : 'hasar'}</small>}
        {telegraph?.deceptive && <small className="intent-card__hint">Niyet belirsiz</small>}
        {enemyIntent?.estimatedDamage !== undefined && <small>{executeThreat ? 'Blok işlemez' : 'Blok öncesi'}</small>}
        {enemyIntent?.warning && <small className="intent-card__hint">{enemyIntent.warning}</small>}
      </div>
    </section>
  );
};
