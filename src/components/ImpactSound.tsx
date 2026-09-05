import { useEffect, useRef, useState } from 'react';
import { useCombatPresentation } from '../state/combatPresentation';

export function ImpactSound() {
  const context = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);
  const impact = useCombatPresentation(s => s.queue[0]);
  useEffect(() => () => { void context.current?.close(); context.current = null; }, []);
  useEffect(() => {
    const audio = context.current;
    if (!enabled || !audio || !impact || audio.state !== 'running') return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const frequencies = { damage: 140, heavy: 75, block: 620, heal: 440, poison: 190, break: 95, death: 60 };
    const start = audio.currentTime;
    const duration = impact.kind === 'heavy' || impact.kind === 'death' ? .22 : .12;
    oscillator.type = impact.kind === 'block' || impact.kind === 'heal' ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequencies[impact.kind], start);
    oscillator.frequency.exponentialRampToValueAtTime(impact.kind === 'heal' ? 660 : 40, start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(.065, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }, [impact, enabled]);
  const toggle = async () => {
    if (enabled) { setEnabled(false); await context.current?.suspend(); return; }
    try {
      context.current ??= new AudioContext();
      await context.current.resume();
      setEnabled(true);
      setFailed(false);
    } catch { setFailed(true); }
  };
  return <button type="button" className="menu-button" aria-pressed={enabled} onClick={() => void toggle()} title="Kısa savaş sesleri">
    {failed ? 'Ses açılamadı' : enabled ? 'Ses açık' : 'Ses kapalı'}
  </button>;
}
