// Bu dosya src/components/BattleLogDrawer.tsx için ilgili kodları içerir.
// Bileşen: savaş loglarını kayan pano olarak gösterir
// Bileşen: savaş loglarını kayan pano olarak gösterir
import React, { useEffect, useRef } from 'react';

interface BattleLogDrawerProps {
  messages: string[];
  isOpen: boolean;
  onToggle: () => void;
  classify: (message: string) => { className: string; icon: string; label: string };
}

export const BattleLogDrawer: React.FC<BattleLogDrawerProps> = ({ messages, isOpen, onToggle, classify }) => {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const onToggleRef = useRef(onToggle);

  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggleRef.current();
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    drawerRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button ref={toggleRef} type="button" className={`log-toggle${isOpen ? ' log-toggle--active' : ''}`} onClick={onToggle} aria-expanded={isOpen} aria-controls="battle-log-drawer">
        <span aria-hidden="true">▤</span>
        Günlük
        <b>{messages.length}</b>
      </button>
      <aside id="battle-log-drawer" ref={drawerRef} className={`log-drawer${isOpen ? ' log-drawer--open' : ''}`} aria-label="Savaş günlüğü" aria-hidden={!isOpen} tabIndex={-1}>
        <div className="log-drawer__header">
          <div><p className="eyebrow">Kayıt</p><h2>Kader Günlüğü</h2></div>
          <button type="button" className="log-drawer__close" onClick={onToggle} tabIndex={isOpen ? 0 : -1} aria-label="Savaş günlüğünü kapat">×</button>
        </div>
        <div className="log-drawer__body" aria-live="polite">
          {messages.length === 0 ? <p className="log-drawer__empty">Henüz bir kayıt yok.</p> : messages.slice().reverse().map((message, index) => {
            const details = classify(message);
            return <div key={`${message}-${index}`} className={`log-entry ${details.className}`}><span className="log-marker" aria-hidden="true">{details.icon}</span><span><small>{details.label}</small>{message}</span></div>;
          })}
        </div>
      </aside>
    </>
  );
};
