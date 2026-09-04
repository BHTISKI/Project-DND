import { useEffect, useRef, useState } from 'react';
import type { Character } from '../types/game';
import { POSTURE_CONFIG, postureRecoveryAmount } from '../mechanics/posture';

export function PostureBar({ character, owner }: { character: Character; owner: 'Oyuncu' | 'Düşman' }) {
  const previous = useRef(character.currentPosture);
  const [flashing, setFlashing] = useState(false);
  useEffect(() => {
    if (character.currentPosture <= previous.current) {
      previous.current = character.currentPosture;
      return;
    }
    previous.current = character.currentPosture;
    setFlashing(false);
    const frame = window.requestAnimationFrame(() => setFlashing(true));
    const timer = window.setTimeout(() => setFlashing(false), 280);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [character.currentPosture]);

  const percent = Math.max(0, Math.min(100, character.currentPosture / character.maxPosture * 100));
  const recovery = postureRecoveryAmount(character);
  const recoveryText = character.isBroken
    ? `İnfaz yapılmazsa ${Math.floor(character.maxPosture * POSTURE_CONFIG.brokenResetRatio)} / ${character.maxPosture}`
    : recovery > 0 ? `Tur sonu −${recovery}` : 'Tur sonu toparlanma yok';

  return <div className="posture-meter">
    <div className={`posture-bar${character.isBroken ? ' posture-bar--broken' : ''}${flashing ? ' posture-bar--hit' : ''}`}
      role="progressbar" tabIndex={0} title={recoveryText}
      aria-label={`${owner} dengesi. ${character.currentPosture} / ${character.maxPosture}. ${recoveryText}`}
      aria-valuenow={character.currentPosture} aria-valuemin={0} aria-valuemax={character.maxPosture}>
      <span style={{ width: `${percent}%` }} />
    </div>
    <small className="posture-label">
      {character.isBroken ? `⚡ KIRILDI · İNFAZ AÇIĞI · ${character.currentPosture} / ${character.maxPosture} · ${recoveryText}` : `DENGE ${character.currentPosture} / ${character.maxPosture} · ${recoveryText}`}
    </small>
  </div>;
}
