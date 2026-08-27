import { useGameStore } from './state/store';
import { Hand } from './components/Hand';
import { useEffect } from 'react';
import { BattleStats } from "./components/BattleStats";
import { CombatControls } from "./components/CombatControls";
import { ShopPanel } from "./components/ShopPanel";
import './App.css';

function App() {
  // Only initialize game; all other state accessed inside components
  const initializeGame = useGameStore(s => s.initializeGame);

  useEffect(() => {
    // Initialize the game (creates deck, draws initial hand, etc.)
    initializeGame();
  }, [initializeGame]);

  return (
    <main className="game-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Kader Günlüğü · Bölüm I</p>
          <h1>DND Oyunu</h1>
        </div>
        <div className="topbar-meta">
          <div className={`turn-badge ${useGameStore(s => s.isPlayerTurn) ? 'turn-badge--player' : 'turn-badge--enemy'}`}>
            <span className="turn-dot" aria-hidden="true" />
            {useGameStore(s => s.isPlayerTurn) ? 'Oyuncu Turu' : 'Düşman Turu'}
          </div>
          <div className="gold-display"><span aria-hidden="true">◆</span> {useGameStore(s => s.gold)} altın</div>
        </div>
      </header>

      <section className="battle-stage" aria-label="Savaş alanı">
        <BattleStats />
        <div className="battle-divider" aria-hidden="true"><span>VS</span></div>
      </section>

      <section className="combat-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Savaş alanı</p>
            <h2>
              {(() => {
                const phase = useGameStore(s => s.gamePhase);
                if (phase === 'combat') return 'Hamleni seç';
                if (phase === 'victory') return 'Zafer!';
                return 'Mola';
              })()}
            </h2>
          </div>
          {useGameStore(s => s.gamePhase) === 'combat' && <CombatControls endTurn={useGameStore(s => s.endTurn)} />}
        </div>

        {useGameStore(s => s.gamePhase) === 'combat' && (
          <p className="panel-hint">Kart oyna, enerjini yönet ve düşmanı alt et.</p>
        )}
        {useGameStore(s => s.gamePhase) === 'shop' && (
          <ShopPanel />
        )}
        {useGameStore(s => s.gamePhase) === 'victory' && (
          <>
            <p className="panel-hint">Tebrikler! Bir ödül kartı seçin veya ödülü geçin.</p>
            {useGameStore(s => s.rewardOptions).length === 0 ? (
              <p className="empty-state">Ödül kartları yükleniyor...</p>
            ) : (
              <div className="reward-grid">
                {useGameStore(s => s.rewardOptions).map((card) => (
                  <div key={card.id} className="reward-card">
                    <h3>{card.isim}</h3>
                    <p>{card.tip} · {card.zarTuru}</p>
                    <p>Mana: {card.manaBedeli}</p>
                    <button
                      onClick={() => useGameStore(s => s.addRewardCardToDeck)(card.id)}
                      className="button button--reward"
                    >
                      Desteye Ekle
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={useGameStore(s => s.skipReward)} className="button button--quiet">
              Awardı Pas Geç
            </button>
          </>
        )}
      </section>

      <section className="hand-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Cephanelik</p>
            <h2>Elindeki kartlar <span>{useGameStore(s => s.hand).length}</span></h2>
          </div>
          <p className="deck-count">
            Deste {useGameStore(s => s.deck).length} · Mezarlık {useGameStore(s => s.discardPile).length}
          </p>
        </div>
        <Hand />
      </section>

      <section className="battle-log">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Kayıt</p>
            <h2>Savaş Günlüğü</h2>
          </div>
          <span className="log-status">Canlı</span>
        </div>
        {useGameStore(s => s.battleLogs).slice(-5).map((msg, idx) => (
          <div key={idx} className="log-entry">
            <span className="log-marker" />
            {msg}
          </div>
        ))}
      </section>
    </main>
  );
}

export default App;