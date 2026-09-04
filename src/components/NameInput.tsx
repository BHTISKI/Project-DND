import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../state/store';
import { readRunSave, RUN_SAVE_KEY, LEGACY_RUN_SAVE_KEY } from '../state/runPersistence';
import type { RunSnapshot } from '../state/runPersistence';
import './NameInput.css';

const phaseNames: Record<RunSnapshot['gamePhase'], string> = {
  combat: 'Savaş', shop: 'Mağaza', victory: 'Ödül seçimi', gameOver: 'Macera sona erdi',
  mapSelection: 'Yol seçimi', deckBuild: 'Deste seçimi', event: 'Olay', rest: 'Dinlenme', boss: 'Büyük düşman',
};

export default function NameInput({ onEnterGame }: { onEnterGame: () => void }) {
  const [saved, setSaved] = useState(readRunSave);
  const current = useGameStore.getState();
  // A failed disk write must not prevent returning to the still-open game.
  const inMemory = current.initialized && current.saveStatus !== 'conflict' &&
    (saved.cursor === current.saveCursor || saved.kind === 'unavailable') ? current : null;
  const run = inMemory ?? (saved.kind === 'ready' ? saved.run : null);
  const activeRun = run && run.gamePhase !== 'gameOver';
  const [showNewGame, setShowNewGame] = useState(!activeRun);
  const [name, setName] = useState(run?.playerName ?? '');
  const [error, setError] = useState('');
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirmNewGame) cancelRef.current?.focus();
    else if (showNewGame) inputRef.current?.focus();
    else continueRef.current?.focus();
  }, [showNewGame, confirmNewGame]);

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (event.key !== RUN_SAVE_KEY && event.key !== LEGACY_RUN_SAVE_KEY && event.key !== null) return;
      setSaved(readRunSave());
      setConfirmNewGame(false);
      setError('Kayıt başka bir sekmede değişti. Devam etmeden önce güncel kaydı kontrol et.');
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  function start() {
    if (useGameStore.getState().startNewGame(name, saved.cursor)) onEnterGame();
    else {
      setSaved(readRunSave());
      setConfirmNewGame(false);
      setError('Kayıt değişti. Mevcut macerayı kontrol edip tekrar dene.');
    }
  }

  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2 || name.trim().length > 20) {
      setError('İsim 2–20 karakter olmalı.');
      inputRef.current?.focus();
      return;
    }
    setError('');
    if (activeRun || saved.kind === 'invalid' || saved.kind === 'incompatible') setConfirmNewGame(true);
    else start();
  }

  function resume() {
    const latest = readRunSave();
    // If another tab changed the save, load that version instead of stale memory.
    if (inMemory && (latest.cursor === current.saveCursor || latest.kind === 'unavailable')) onEnterGame();
    else if (useGameStore.getState().resumeGame()) onEnterGame();
    else {
      setSaved(latest);
      setError('Kayıt açılamadı. Mevcut kayıt korunuyor; tekrar deneyebilirsin.');
    }
  }

  return <main className="start-screen">
    <div className="start-menu">
      <h1>Makara</h1>
      {saved.kind === 'invalid' && <p className="start-notice" role="alert">Kayıt okunamadı. Yeni macera başlatmadıkça mevcut kayıt korunur.</p>}
      {saved.kind === 'incompatible' && <p className="start-notice" role="alert">Bu kayıt oyunun farklı bir sürümüne ait ve açılamıyor. Yeni macera başlatmadıkça korunur.</p>}
      {(saved.kind === 'unavailable' || (inMemory && current.saveStatus === 'error')) && <p className="start-notice" role="alert">Tarayıcı kayda izin vermiyor. Oynayabilirsin, ancak sayfayı kapatırsan ilerlemen kaybolabilir.</p>}
      {confirmNewGame ? <section aria-labelledby="replace-title" onKeyDown={event => { if (event.key === 'Escape') setConfirmNewGame(false); }}>
        <h2 id="replace-title">Yeni maceraya başla?</h2>
        <p className="start-description">{activeRun ? `${run.playerName} ile olan maceranın yerine yenisi kaydedilecek.` : 'Mevcut kaydın yerine yeni macera kaydedilecek.'} Bu işlem geri alınamaz.</p>
        <div className="start-actions">
          <button className="start-primary" type="button" onClick={start}>Yeni maceraya başla</button>
          <button ref={cancelRef} className="start-secondary" type="button" onClick={() => setConfirmNewGame(false)}>Vazgeç</button>
        </div>
      </section> : showNewGame ? <section aria-labelledby="new-game-title">
        <h2 id="new-game-title">Yeni macera</h2>
        <p className="start-description">Karakterine bir isim ver.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="playerName">Karakter adı</label>
          <input ref={inputRef} id="playerName" name="playerName" value={name} onChange={event => { setName(event.target.value); setError(''); }}
            maxLength={20} autoComplete="off" spellCheck={false} placeholder="İsim" aria-invalid={!!error} aria-describedby={error ? 'start-error' : undefined} />
          <button className="start-primary" type="submit">Başla</button>
        </form>
        {activeRun && <button className="start-secondary" type="button" onClick={() => { setShowNewGame(false); setError(''); }}>Geri dön</button>}
      </section> : run ? <section aria-labelledby="continue-title">
        <h2 id="continue-title">{run.playerName}</h2>
        <p className="start-description">Bölüm {run.runFloor + 1}. {run.rewardOptions.length > 0 ? 'Ödül seçimi' : phaseNames[run.gamePhase]}{run.gamePhase === 'combat' ? `, tur ${run.round}` : ''}.</p>
        <p className="start-stats">{run.player.mevcutCan}/{run.player.maksimumCan} can, {run.gold} altın</p>
        <button ref={continueRef} className="start-primary" type="button" onClick={resume}>Devam et</button>
        <button className="start-secondary" type="button" onClick={() => { setShowNewGame(true); setError(''); }}>Yeni macera</button>
      </section> : <button className="start-primary" type="button" onClick={() => setShowNewGame(true)}>Yeni macera</button>}
      {error && <p id="start-error" className="start-notice" role="alert">{error}</p>}
      <p className="start-footnote">Oyun bu tarayıcıda otomatik kaydedilir.</p>
    </div>
  </main>;
}
