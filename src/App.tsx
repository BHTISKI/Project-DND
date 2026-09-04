// Bu dosya src\App.tsx için ilgili kodları içerir.
// Ana uygulama bileşeni: oyun durumu, UI bileşenlerini birleştirir ve oyun döngüsünü yönetir.
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from './state/store';
import { BattleStats } from './components/BattleStats';
import { CombatControls } from './components/CombatControls';
import { Hand } from './components/Hand';
import { MechanicStatus } from './components/MechanicStatus';
import { ShopPanel } from './components/ShopPanel';
import { BattleLogDrawer } from './components/BattleLogDrawer';
import { EnemyBoard } from './components/EnemyBoard';
import { DeckBuild, MapSelection, PhaseChoices, RewardCards } from './components/AppSections';
import { classifyLog } from './components/appView';
import { useShallow } from 'zustand/react/shallow';
import './App.css';
import NameInput from './components/NameInput';
import DialogBubble from './components/DialogBubble';
import { SettingsControl } from './components/SettingsControl';

function App() {
  const {
    restartGame,
    gamePhase,
    rewardOptions,
    draftOptions,
    draftPicks,
    draftBudget,
    chooseDraftCard,
    addRewardCardToDeck,
    skipReward,
    selectNode,
    resolveEvent,
    resolveRest,
    availableNodes,
    runFloor,
    battleLogs,
    initializeGame,
    playCard,
    round,
    playerName,
  } = useGameStore(useShallow((state) => ({
    restartGame: state.restartGame,
    gamePhase: state.gamePhase,
    rewardOptions: state.rewardOptions,
    draftOptions: state.draftOptions,
    draftPicks: state.draftPicks,
    draftBudget: state.draftBudget,
    chooseDraftCard: state.chooseDraftCard,
    addRewardCardToDeck: state.addRewardCardToDeck,
    skipReward: state.skipReward,
    selectNode: state.selectNode,
    resolveEvent: state.resolveEvent,
    resolveRest: state.resolveRest,
    availableNodes: state.availableNodes,
    runFloor: state.runFloor,
    battleLogs: state.battleLogs,
    initializeGame: state.initializeGame,
    playCard: state.playCard,
    round: state.round,
    playerName: state.playerName,
  })));
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(!playerName);
  const { saveStatus, retrySave } = useGameStore(useShallow(s => ({ saveStatus: s.saveStatus, retrySave: s.retrySave })));
  // Drag and drop state
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const enemyHp = useGameStore(s => s.enemy.mevcutCan);
  const enemyId = useGameStore(s => s.enemy.id);
  const previousEnemy = useRef({ hp: enemyHp, id: enemyId, phase: gamePhase });
  const [impactPulse, setImpactPulse] = useState(false);
  const [floatingText, setFloatingText] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedCardId(id);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedCardId) {
      playCard(draggedCardId);
      setDraggedCardId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  useEffect(() => {
    if (playerName) {
      initializeGame();
    }
  }, [initializeGame, playerName]);
  useEffect(() => {
    if (saveStatus !== 'error' && saveStatus !== 'conflict') return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [saveStatus]);
  useEffect(() => {
    const previous = previousEnemy.current;
    previousEnemy.current = { hp: enemyHp, id: enemyId, phase: gamePhase };
    const damage = previous.hp - enemyHp;
    if (previous.id !== enemyId || previous.phase !== 'combat' || gamePhase !== 'combat' || damage <= 0) return;
    const startTimer = window.setTimeout(() => {
      setFloatingText(`-${damage} HASAR`);
      setImpactPulse(true);
    }, 0);
    const clearTimer = window.setTimeout(() => { setFloatingText(null); setImpactPulse(false); }, 700);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(clearTimer);
    };
  }, [enemyHp, enemyId, gamePhase]);

  const combatTitle = gamePhase === 'combat' ? 'Hamleni seç' : gamePhase === 'deckBuild' ? 'Desteni hazırla' : gamePhase === 'mapSelection' ? 'Yolunu seç' : gamePhase === 'victory' ? 'Zafer!' : gamePhase === 'gameOver' ? 'Oyun Bitti' : gamePhase === 'shop' ? 'Gezgin kampı' : 'Mola';
  const isCombatBoardVisible = gamePhase !== 'mapSelection' && gamePhase !== 'deckBuild';

  if (isMenuOpen || !playerName) {
    return <><NameInput onEnterGame={() => { setIsMenuOpen(false); setIsLogOpen(false); setDraggedCardId(null); }} /><SettingsControl /></>;
  }

  return (
    <><div className={`app app--${gamePhase}${impactPulse ? ' screen-shake' : ''}`}>
      <header className="session-bar">
        <div className="app-title">Makara</div>
        <div className="session-actions">
          <span className="save-status" role="status">{saveStatus === 'saved' ? 'Kaydedildi' : saveStatus === 'error' || saveStatus === 'conflict' ? 'Kaydedilemedi' : ''}</span>
          <button type="button" className="menu-button" onClick={() => setIsMenuOpen(true)}>Menü</button>
        </div>
      </header>
      {saveStatus === 'error' && <div className="save-warning" role="alert"><span>İlerleme kaydedilemedi. Sayfayı kapatmadan önce tekrar dene.</span><button type="button" onClick={retrySave}>Tekrar kaydet</button></div>}
      {saveStatus === 'conflict' && <div className="save-warning" role="alert"><span>Kayıt başka bir sekmede değişti. Bu sekmedeki ilerleme kaydedilmiyor.</span><button type="button" onClick={() => setIsMenuOpen(true)}>Güncel kayda dön</button></div>}
      <div className="title-row"><h2 className="title">{combatTitle}</h2>{gamePhase === 'combat' && <span className="round-badge">TUR {round}</span>}</div>
      <DialogBubble />
      <div className="top-zone">
        <div className={`battle-participants${impactPulse ? ' battle-participants--impact' : ''}`}>
          {gamePhase === 'combat' ? <div className="enemy-stack"><EnemyBoard /><BattleStats side="enemy" /></div> : <BattleStats />}
        </div>
        <div className="battle-log-drawer-container">
          <BattleLogDrawer
            messages={battleLogs}
            isOpen={isLogOpen}
            onToggle={() => setIsLogOpen(!isLogOpen)}
            classify={classifyLog}
          />
        </div>
      </div>
      <div className="middle-zone">
        <div className="battlefield-content" aria-label={isCombatBoardVisible ? 'Savaş alanı' : undefined}>
          {floatingText && <span className="floating-combat-text" aria-live="polite">{floatingText}</span>}
          {isCombatBoardVisible && gamePhase !== 'combat' && (
            <div className="battle-divider" aria-hidden="true"><span>VS</span></div>
          )}
          {gamePhase === 'mapSelection' && (
            <MapSelection floor={runFloor} nodes={availableNodes} rewards={rewardOptions} onSelectNode={selectNode} onSelectReward={addRewardCardToDeck} onSkipReward={skipReward} />
          )}
          {gamePhase === 'deckBuild' && <DeckBuild cards={draftOptions} picks={draftPicks} budget={draftBudget} onPick={chooseDraftCard} />}
          {gamePhase === 'shop' && <ShopPanel />}
          {gamePhase === 'victory' && (
            <div className="victory-content">
              <div className="terminal-message terminal-message--win"><span className="terminal-icon" aria-hidden="true">✦</span><div><span className="terminal-kicker">Savaş sona erdi</span><strong>Zafer kazanıldı</strong><p>Düşman yenildi. Destene yeni bir güç kat.</p></div></div>
              <RewardCards cards={rewardOptions} onSelect={addRewardCardToDeck} />
              <button onClick={skipReward} className="button button--quiet" type="button">Ödülü pas geç</button>
            </div>
          )}
          {gamePhase === 'gameOver' && (
            <div className="terminal-message terminal-message--loss"><span className="terminal-icon" aria-hidden="true">×</span><div><span className="terminal-kicker">Macera sona erdi</span><strong>Oyun Bitti</strong><p>Bu savaşta yenildin. Bir sonraki macera için yeniden hazırlan.</p><button onClick={restartGame} className="button button--primary" type="button">Yeni Oyun Başlat</button></div></div>
          )}
          {gamePhase === 'event' && <PhaseChoices phase="event" onChoose={resolveEvent} />}
          {gamePhase === 'rest' && <PhaseChoices phase="rest" onChoose={resolveRest} />}
          {/* Combat controls */}
          {gamePhase === 'combat' && <CombatControls />}
          {/* Drop zone for dragging cards - only active during drag */}
          {draggedCardId !== null && (
            <div
              className="drop-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={e => e.preventDefault()}
              onDragLeave={e => e.preventDefault()}
            />
          )}
        </div>
      </div>
      <div className="bottom-zone player-hand-zone">
        {/* Only show hand in combat phase */}
        {gamePhase === 'combat' && <>
          <div className="player-bar"><BattleStats side="player" /></div>
          <MechanicStatus />
          <Hand draggedCardId={draggedCardId} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
        </>}
      </div>
    </div><SettingsControl /></>
  );
}

export default App;
