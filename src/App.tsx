import { useEffect } from 'react';
import { useGameStore } from './state/store';
import { BattleStats } from './components/BattleStats';
import { CombatControls } from './components/CombatControls';
import { Hand } from './components/Hand';
import { ShopPanel } from './components/ShopPanel';
import './App.css';

function App() {
  const initializeGame = useGameStore((s) => s.initializeGame);
  const restartGame = useGameStore((s) => s.restartGame);
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

  const getLogClass = (message: string) => {
    if (message.includes('KRİTİK')) return 'log-entry--critical';
    if (message.includes('hasar') || message.includes('saldırı') || message.includes('vuruldu')) return 'log-entry--attack';
    if (message.includes('blok') || message.includes('savun')) return 'log-entry--defense';
    if (message.includes('iyileş')) return 'log-entry--heal';
    if (message.includes('zafer') || message.includes('Ödül')) return 'log-entry--victory';
    if (message.includes('bitti') || message.includes('ölü')) return 'log-entry--gameover';
    return '';
  };

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const combatTitle = gamePhase === 'combat' ? 'Hamleni seç' : gamePhase === 'victory' ? 'Zafer!' : gamePhase === 'gameOver' ? 'Oyun Bitti' : 'Mola';

  return (
    <main className={`game-shell game-shell--${gamePhase}`}>
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

      <section className={`combat-panel combat-panel--${gamePhase}`}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Savaş alanı</p>
            <h2>{combatTitle}</h2>
          </div>
          {gamePhase === 'combat' && <CombatControls />}
        </div>

        {gamePhase === 'combat' && <p className="panel-hint">Kart oyna, enerjini yönet ve düşmanı alt et.</p>}
        {gamePhase === 'gameOver' && (
  <div className="terminal-message terminal-message--loss">
    <span className="terminal-icon" aria-hidden="true">×</span>
    <div>
      <strong>Run sona erdi</strong>
      <p>Bu savaşta yenildin. Bir sonraki macera için burada duruyor.</p>
      <button onClick={restartGame} className="button button--primary" type="button">
        Yeni Oyun Başlat
      </button>
    </div>
  </div>
)}
        {gamePhase === 'shop' && <ShopPanel />}
        {gamePhase === 'victory' && (
          <div className="victory-content">
            <div className="terminal-message terminal-message--win"><span className="terminal-icon" aria-hidden="true">✦</span><div><strong>Zafer kazanıldı</strong><p>Düşman yenildi. Destene yeni bir güç kat.</p></div></div>
            {rewardOptions.length === 0 ? (
              <p className="empty-state">Ödül kartları yükleniyor...</p>
            ) : (
              <div className="reward-grid">
                {rewardOptions.map((card) => (
                  <div key={card.id} className="reward-card">
                    <div className="reward-card__head"><span className="reward-rarity">{card.rarity ?? 'common'}</span><span>{card.manaBedeli} enerji</span></div>
                    <h3>{card.isim}</h3>
                    <p>{card.tip} · {card.zarTuru} zar</p>
                    <button onClick={() => addRewardCardToDeck(card.id)} className="button button--reward" type="button">
                      Bu kartı seç <span aria-hidden="true">→</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={skipReward} className="button button--quiet" type="button">Ödülü pas geç</button>
          </div>
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
          <div key={idx} className={`log-entry ${getLogClass(msg)}`}>
            <span className="log-marker" />
            {msg}
          </div>
        ))}
      </section>
    </main>
  );
}

export default App;