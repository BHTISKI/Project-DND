import { useEffect, type CSSProperties } from 'react';
import { useGameStore } from '../state/store';
import { useCombatPresentation, type PresentedImpact } from '../state/combatPresentation';
import { usePreferencesStore } from '../state/preferences';
import type { CombatFeedback as Impact } from '../engine/combatFeedback';

export function CombatFeedbackController() {
  useEffect(() => {
    const presentation = useCombatPresentation.getState();
    presentation.clear();
    const unsubscribe = useGameStore.subscribe((next, previous) => {
      if (next.enemy.id !== previous.enemy.id || next.player.id !== previous.player.id ||
        (previous.gamePhase !== 'combat' && next.gamePhase === 'combat')) {
        presentation.clear();
        return;
      }
      if (previous.gamePhase !== 'combat') return;
      const events: Impact[] = next.combatFeedback !== previous.combatFeedback ? [...(next.combatFeedback ?? [])] : [];
      for (const target of ['player', 'enemy'] as const) {
        const lost = previous[target].mevcutCan - next[target].mevcutCan;
        // Direct damage, curses and relics can act outside the card resolver.
        if (lost !== 0 && !events.some(e => e.target === target && ['damage', 'heavy', 'poison', 'heal'].includes(e.kind)))
          events.push({ target, kind: lost > 0 ? 'damage' : 'heal', amount: Math.abs(lost) });
        if (previous[target].mevcutCan > 0 && next[target].mevcutCan <= 0)
          events.push({ target, kind: 'death', amount: 0 });
      }
      if (events.length) presentation.push(events);
    });
    return () => { unsubscribe(); presentation.clear(); };
  }, []);
  return null;
}

const labels = { damage: 'HASAR', heavy: 'AĞIR VURUŞ', block: 'BLOK', heal: 'ŞİFA', poison: 'ZEHİR', break: 'DENGE KIRILDI', death: 'YENİLDİ' };
export function DamageNumber({ event }: { event: PresentedImpact }) {
  const sign = event.kind === 'heal' || event.kind === 'block' ? '+' : '−';
  return <div className={`damage-number damage-number--${event.kind}`} style={{ '--damage-size': `${Math.min(54, 28 + event.amount)}px` } as CSSProperties}>
    {event.amount > 0 && <strong>{sign}{event.amount}</strong>}<span>{labels[event.kind]}</span>
  </div>;
}

export function FighterFeedback({ target }: { target: Impact['target'] }) {
  const event = useCombatPresentation(s => s.queue[0]);
  const speed = usePreferencesStore(s => s.animationSpeed);
  const shake = usePreferencesStore(s => s.screenShakeEnabled);
  const glow = usePreferencesStore(s => s.glowEnabled);
  const ring = usePreferencesStore(s => s.ringEnabled);
  useEffect(() => {
    if (!event || event.target !== target) return;
    const timer = window.setTimeout(() => useCombatPresentation.getState().shift(event.id), (event.kind === 'death' ? 850 : 520) / speed);
    return () => window.clearTimeout(timer);
  }, [event, target, speed]);
  if (!event || event.target !== target) return null;
  return <div key={event.id} className={`impact-layer impact-layer--${event.kind}${shake ? ' impact-layer--shake' : ''}${glow ? ' impact-layer--glow' : ''}`}
    style={{ '--impact-duration': `${520 / speed}ms` } as CSSProperties} aria-hidden="true">
    {ring && <span className="impact-ring" />}
    <DamageNumber event={event} />
    {glow && <div className="impact-sparks">{Array.from({ length: event.kind === 'heavy' ? 8 : 4 }, (_, i) => <i key={i} style={{ '--spark-angle': `${i * 45}deg` } as CSSProperties} />)}</div>}
  </div>;
}
