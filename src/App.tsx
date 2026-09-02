// Bu dosya src\App.tsx için ilgili kodları içerir.
// Ana uygulama bileşeni: oyun durumu, UI bileşenlerini birleştirir ve oyun döngüsünü yönetir.
// Ana uygulama bileşeni: oyun durumu, UI bileşenlerini birleştirir ve oyun döngüsünü yönetir.
import { useEffect, useState } from 'react';
import { useGameStore } from './state/store';
import { BattleStats } from './components/BattleStats';
import { CombatControls } from './components/CombatControls';
import { Hand } from './components/Hand';
import { ShopPanel } from './components/ShopPanel';
import { BattleLogDrawer } from './components/BattleLogDrawer';
import { DeckBuild, MapSelection, PhaseChoices, RewardCards } from './components/AppSections';
import { classifyLog } from './components/appView';
import { useShallow } from 'zustand/react/shallow';
import './App.css';

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
  })));
  const [isLogOpen, setIsLogOpen] = useState(false);
  // Drag and drop state
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
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

  useEffect(() => { initializeGame(); }, [initializeGame]);
  useEffect(() => {
    const latest = battleLogs[battleLogs.length - 1] ?? '';
    if (!latest || !/hasar|denge|kırıldı/i.test(latest)) return;
    const match = latest.match(/(\d+) (?:hasar|denge)/i);
    const startTimer = window.setTimeout(() => {
      setFloatingText(match ? `-${match[1]} ${latest.includes('denge') ? 'DENGE' : 'HASAR'}` : latest.includes('kırıldı') ? 'KIRILDI!' : 'DARBE!');
      setImpactPulse(true);
    }, 0);
    const clearTimer = window.setTimeout(() => { setFloatingText(null); setImpactPulse(false); }, 700);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(clearTimer);
    };
  }, [battleLogs]);

  const combatTitle = gamePhase === 'combat' ? 'Hamleni seç' : gamePhase === 'deckBuild' ? 'Desteni hazırla' : gamePhase === 'mapSelection' ? 'Yolunu seç' : gamePhase === 'victory' ? 'Zafer!' : gamePhase === 'gameOver' ? 'Oyun Bitti' : gamePhase === 'shop' ? 'Gezgin kampı' : 'Mola';
  const isCombatBoardVisible = gamePhase !== 'mapSelection' && gamePhase !== 'deckBuild';

  return (
    <div className={`app${impactPulse ? ' screen-shake' : ''}`}>
      <div className="app-title">DND Oyunu</div>
      <h2 className="title">{combatTitle}</h2>
      <div className="top-zone">
        <div className={`battle-participants${impactPulse ? ' battle-participants--impact' : ''}`}>
          <BattleStats />
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
          {isCombatBoardVisible && (
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
            <div className="terminal-message terminal-message--loss"><span className="terminal-icon" aria-hidden="true">×</span><div><span className="terminal-kicker">Run sona erdi</span><strong>Oyun Bitti</strong><p>Bu savaşta yenildin. Bir sonraki macera için yeniden hazırlan.</p><button onClick={restartGame} className="button button--primary" type="button">Yeni Oyun Başlat</button></div></div>
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
        {gamePhase === 'combat' && <Hand
          draggedCardId={draggedCardId}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />}
      </div>
    </div>
  );
}

export default App;