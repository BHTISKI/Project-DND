import { useEffect, useRef, useState } from 'react';

export function HealthBar({ health, maxHealth, owner }: { health: number; maxHealth: number; owner: string }) {
  const percent = Math.max(0, Math.min(100, health / Math.max(1, maxHealth) * 100));
  const previous = useRef(health);
  const [trail, setTrail] = useState(percent);
  const [hit, setHit] = useState(false);
  const [healing, setHealing] = useState(false);
  useEffect(() => {
    const damaged = health < previous.current;
    const healed = health > previous.current;
    previous.current = health;
    setHit(damaged);
    setHealing(healed);
    if (!damaged) {
      setTrail(percent);
      const timer = window.setTimeout(() => setHealing(false), 600);
      return () => window.clearTimeout(timer);
    }
    const trailTimer = window.setTimeout(() => setTrail(percent), 250);
    const hitTimer = window.setTimeout(() => setHit(false), 400);
    return () => { window.clearTimeout(trailTimer); window.clearTimeout(hitTimer); };
  }, [health, percent]);
  return <div className={`health-bar${hit ? ' health-bar--hit' : ''}${healing ? ' health-bar--healing' : ''}`} data-danger={percent <= 10 ? 'critical' : percent <= 25 ? 'high' : percent <= 50 ? 'wounded' : 'healthy'} role="progressbar"
    aria-label={`${owner} canı`} aria-valuenow={health} aria-valuemin={0} aria-valuemax={maxHealth}>
    <span className="health-trail" style={{ width: `${trail}%` }} />
    <span className="health-fill" style={{ width: `${percent}%` }} />
  </div>;
}
