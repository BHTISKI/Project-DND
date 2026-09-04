import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { usePreferencesStore } from '../state/preferences';
import './SettingsPanel.css';

export function SettingsControl() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const backdropPress = useRef(false);
  const id = useId();
  const preferences = usePreferencesStore(useShallow(s => ({
    motionEnabled: s.motionEnabled, screenShakeEnabled: s.screenShakeEnabled,
    ringEnabled: s.ringEnabled, glowEnabled: s.glowEnabled, animationSpeed: s.animationSpeed,
    setPreference: s.setPreference, resetPreferences: s.resetPreferences, storageError: s.storageError,
  })));
  const { motionEnabled, screenShakeEnabled, ringEnabled, glowEnabled, animationSpeed, setPreference } = preferences;

  useEffect(() => {
    const root = document.documentElement;
    const previousMotion = root.dataset.gameMotion;
    const previousShake = root.dataset.gameShake;
    root.dataset.gameMotion = motionEnabled ? 'full' : 'reduced';
    root.dataset.gameShake = screenShakeEnabled ? 'on' : 'off';
    return () => {
      if (previousMotion === undefined) delete root.dataset.gameMotion;
      else root.dataset.gameMotion = previousMotion;
      if (previousShake === undefined) delete root.dataset.gameShake;
      else root.dataset.gameShake = previousShake;
    };
  }, [motionEnabled, screenShakeEnabled]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    if (!dialog) return;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      dialog.close();
      document.documentElement.style.overflow = overflow;
      trigger?.focus();
    };
  }, [open]);

  return createPortal(<>
    <div className={`settings-control${glowEnabled ? '' : ' settings-control--quiet'}${ringEnabled ? '' : ' settings-control--no-ring'}`}
      style={{ '--settings-cycle': `${6 / animationSpeed}s` } as CSSProperties}>
      <button ref={triggerRef} type="button" className="settings-trigger" aria-label="Ayarları aç"
        aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen(true)}>
        <span className="settings-seal" aria-hidden="true">
          <span className="settings-seal__face" />
          <svg className="settings-seal__ring" viewBox="0 0 100 100" focusable="false">
            <defs><linearGradient id={`${id}-ink`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#43358f" /><stop offset=".55" stopColor="#7564d5" /><stop offset="1" stopColor="#b3abff" />
            </linearGradient></defs>
            <circle className="settings-seal__track" cx="50" cy="50" r="44" />
            <circle className="settings-seal__arc" cx="50" cy="50" r="44" pathLength="100" stroke={`url(#${id}-ink)`} />
          </svg>
          <span className="settings-seal__card"><span>★</span></span>
        </span>
        <span className="settings-trigger__label">Ayarlar</span>
      </button>
    </div>
    {open && <dialog ref={dialogRef} id={`${id}-panel`} className="game-settings" aria-labelledby={`${id}-title`}
      onCancel={event => { event.preventDefault(); setOpen(false); }}
      onPointerDown={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        backdropPress.current = event.target === event.currentTarget
          && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
      }}
      onClick={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const releasedOnBackdrop = event.target === event.currentTarget
          && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
        if (backdropPress.current && releasedOnBackdrop) setOpen(false);
        backdropPress.current = false;
      }}>
      <div className="game-settings__content">
        <header className="game-settings__header">
          <h2 id={`${id}-title`}>Ayarlar</h2>
          <button ref={closeRef} type="button" className="game-settings__close" aria-label="Ayarları kapat" onClick={() => setOpen(false)}>×</button>
        </header>
        <fieldset className="game-settings__group">
          <legend>Oyun görünümü</legend>
          <label className="game-settings__toggle"><span>Hareketli efektler</span><input type="checkbox" checked={motionEnabled} onChange={e => setPreference('motionEnabled', e.target.checked)} /></label>
          <label className="game-settings__toggle"><span>Ekran sarsıntısı</span><input type="checkbox" checked={screenShakeEnabled} disabled={!motionEnabled} onChange={e => setPreference('screenShakeEnabled', e.target.checked)} /></label>
          <p className="game-settings__hint">Cihazındaki hareket azaltma tercihi de uygulanır.</p>
        </fieldset>
        <fieldset className="game-settings__group">
          <legend>Ayar düğmesi</legend>
          <label className="game-settings__toggle"><span>Dolum halkası</span><input type="checkbox" checked={ringEnabled} onChange={e => setPreference('ringEnabled', e.target.checked)} /></label>
          <label className="game-settings__toggle"><span>Işıltı</span><input type="checkbox" checked={glowEnabled} onChange={e => setPreference('glowEnabled', e.target.checked)} /></label>
          <div className="game-settings__speed">
            <label htmlFor={`${id}-speed`}>Animasyon hızı</label>
            <output htmlFor={`${id}-speed`}>{animationSpeed.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}×</output>
            <input id={`${id}-speed`} type="range" min="0.5" max="1.5" step="0.25" value={animationSpeed}
              disabled={!motionEnabled || !ringEnabled} onChange={e => setPreference('animationSpeed', Number(e.target.value))}
              aria-valuetext={`${animationSpeed.toLocaleString('tr-TR')} kat`} />
          </div>
        </fieldset>
        <footer className="game-settings__footer">
          <button type="button" onClick={preferences.resetPreferences}>Varsayılana dön</button>
          <p role="status">{preferences.storageError ? 'Ayarlar kaydedilemedi. Bu oturumda uygulanmaya devam eder.' : 'Ayarlar bu tarayıcıda saklanır.'}</p>
        </footer>
      </div>
    </dialog>}
  </>, document.body);
}
