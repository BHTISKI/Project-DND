import { useGameStore } from './state/store';
import { Hand } from './components/Hand';
import { useEffect } from 'react';
import { BattleStats } from "./components/BattleStats";
import { CombatControls } from "./components/CombatControls";
import { ShopPanel } from "./components/ShopPanel";
import './App.css';

function App() {
  const {
    player,
    enemy,
    isPlayerTurn,
    endTurn,
    battleLogs,
    gamePhase,
    healPlayer,
    removeCardFromDeck,
    addRewardCardToDeck,
    skipReward,
    startNextCombat,
    // Energy and deck info
    currentEnergy,
    maxEnergy,
    deck,
    hand,
    discardPile,
    gold,
    rewardOptions,
    // Actions
    initializeGame,
  } = useGameStore();

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
          <div className={`turn-badge ${isPlayerTurn ? 'turn-badge--player' : 'turn-badge--enemy'}`}>
            <span className="turn-dot" />
            {isPlayerTurn ? 'Oyuncu Turu' : 'Düşman Turu'}
          </div>
          <div className="gold-display"><span aria-hidden="true">◆</span> {gold} altın</div>
        </div>
      </header>

      <section className="battle-stage" aria-label="Savaş alanı">
        <BattleStats
          player={player}
          enemy={enemy}
          currentEnergy={currentEnergy}
          maxEnergy={maxEnergy}
          gold={gold}
          deck={deck}
          hand={hand}
          discardPile={discardPile}
        />
        <div className="battle-divider" aria-hidden="true"><span>VS</span></div>
      </section>

      <section className="combat-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Savaş alanı</p>
            <h2>{gamePhase === 'combat' ? 'Hamleni seç' : gamePhase === 'victory' ? 'Zafer!' : 'Mola'}</h2>
          </div>
          {gamePhase === 'combat' && <CombatControls endTurn={endTurn} />}
        </div>

        {gamePhase === 'combat' && (
          <p className="panel-hint">Kart oyna, enerjini yönet ve düşmanı alt et.</p>
        )}
        {gamePhase === 'shop' && (
          <ShopPanel
            deck={deck}
            gold={gold}
            healPlayer={healPlayer}
            removeCardFromDeck={removeCardFromDeck}
            startNextCombat={startNextCombat}
          />
        )}
        {gamePhase === 'victory' && (
          <>
            <p className="panel-hint">Tebrikler! Bir ödül kartı seçin veya ödülü geçin.</p>
            {rewardOptions.length === 0 ? (
              <p className="empty-state">Ödül kartları yükleniyor...</p>
            ) : (
              <div className="reward-grid">
                {rewardOptions.map((card) => (
                  <div key={card.id} className="reward-card">
                    <h3>{card.isim}</h3>
                    <p>{card.tip} · {card.zarTuru}</p>
                    <p>Mana: {card.manaBedeli}</p>
                    <button
                      onClick={() => addRewardCardToDeck(card.id)}
                      className="button button--reward"
                    >
                      Desteye Ekle
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={skipReward} className="button button--quiet">
              Ödülü Pas Geç
            </button>
          </>
        )}
      </section>

      <section className="hand-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Cephanelik</p>
            <h2>Elindeki kartlar <span>{hand.length}</span></h2>
          </div>
          <p className="deck-count">Deste {deck.length} · Mezarlık {discardPile.length}</p>
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
        {battleLogs.slice(-5).map((msg, idx) => (
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
