import { useEffect, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useGameStore } from '../state/store';
import { usePreferencesStore } from '../state/preferences';
import { voiceFor } from '../content/enemyVoices';
import type { NpcLine } from '../engine/npcDialogue';

function SpokenLine({ entry, name }: { entry: NpcLine; name: string }) {
  const motion = usePreferencesStore(s => s.motionEnabled);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(0);
  const complete = !motion || reduced || visible >= entry.text.length;
  const advance = () => useGameStore.setState(s => s.enemyDialog[0] === entry ? { enemyDialog: s.enemyDialog.slice(1) } : {});
  useEffect(() => {
    if (complete) return;
    const timer = window.setInterval(() => setVisible(n => Math.min(entry.text.length, n + 2)), 36);
    return () => window.clearInterval(timer);
  }, [entry.text, complete]);
  useEffect(() => {
    if (entry.story) return;
    const timer = window.setTimeout(() => {
      useGameStore.setState(s => s.enemyDialog[0] === entry ? { enemyDialog: s.enemyDialog.slice(1) } : {});
    }, Math.max(5500, entry.text.length * 58));
    return () => window.clearTimeout(timer);
  }, [entry]);
  return <>
    <p className="npc-speech__name">{name}<span>{entry.story ? 'Yolculuktan bir iz' : 'Savaşın içinden'}</span></p>
    <p className="npc-speech__text" aria-hidden="true">
      <span className="npc-speech__measure" data-text={entry.text} />
      <span className="npc-speech__ink">{complete ? entry.text : entry.text.slice(0, visible)}</span>
    </p>
    <span className="sr-only" role="status">{name}: {entry.text}</span>
    <button type="button" className="npc-speech__next" onClick={() => complete ? advance() : setVisible(entry.text.length)}>
      {!complete ? 'Tümünü göster' : entry.story ? 'Devam et' : 'Geç'} <span aria-hidden="true">→</span>
    </button>
  </>;
}

export default function DialogBubble() {
  const entry = useGameStore(s => s.enemyDialog[0]);
  const name = useGameStore(s => s.enemy.isim);
  const archetype = useGameStore(s => s.enemyArchetype);
  const encounterId = useGameStore(s => s.campaign?.encounterId);
  if (!entry) return null;
  return <section key={`${entry.timestamp}-${entry.text}`} className={`npc-speech npc-speech--${entry.emotion ?? 'wary'}`}
    style={{ '--voice-color': voiceFor(archetype, encounterId).color } as CSSProperties} aria-label={`${name} konuşuyor`}>
    <SpokenLine entry={entry} name={name} />
  </section>;
}
