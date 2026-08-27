import { useEffect } from 'react';
import { useGameStore } from './state/store';
import { BattleStats } from './components/BattleStats';
import { CombatControls } from './components/CombatControls';
import { Hand } from './components/Hand';
import { ShopPanel } from './components/ShopPanel';
import './App.css';

function App() {
  const initializeGame = useGameStore((s) => s.initializeGame);
  const isPlayerTurn = useGameStore((s) => s.isPlayerTurn);
  const gold = useGameStore((s) => s.gold);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const rewardOptions = useGameStore((s) => s.rewardOptions);
  const addRewardCardToDeck = useGameStore((s) => s.addRewardCardToDeck);
  const skipReward = useGameStore((s) => s.skipReward);
  const hand = useGameStore((s) => s.hand);
  const deck = useGameStore((s) => s.deck);
  const discardPile = useGameStore((s) => s.discardPile);
  const battleLogs = useGameStore((s) => s.battleLogs);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const combatTitle = gamePhase === 'combat' ? 'Hamleni seç' : gamePhase === 'victory' ? 'Zafer!' : gamePhase === 'gameOver' ? 'Oyun Bitti' : 'Mola';

  return (
    <main className="game-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Kader Günlüğü · Bölüm I</p>
          <h1>DND Oyunu</h1>
        </div>
        <div className="topbar-meta">
          <div className={`turn-badge ${isPlayerTurn ? 'turn-badge--player' : 'turn-badge--enemy'}`}>
            <span className="turn-dot" aria-hidden="true" />
            {isPlayerTurn ? 'Oyuncu Turu' : 'Düşman Turu'}
          </div>
          <div className="gold-display"><span aria-hidden="true">◆</span> {gold} altın</div>
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
            <h2>{combatTitle}</h2>
          </div>
          {gamePhase === 'combat' && <CombatControls />}
        </div>

        {gamePhase === 'combat' && <p className="panel-hint">Kart oyna, enerjini yönet ve düşmanı alt et.</p>}
        {gamePhase === 'gameOver' && <p className="panel-hint">Oyuncu ölü. Oyun sona erdi.</p>}
        {gamePhase === 'shop' && <ShopPanel />}
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
                    <button onClick={() => addRewardCardToDeck(card.id)} className="button button--reward">
                      Desteye Ekle
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={skipReward} className="button button--quiet">Awardı Pas Geç</button>
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