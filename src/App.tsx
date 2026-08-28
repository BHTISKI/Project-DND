import { useEffect, useState } from 'react';
import { useGameStore } from './state/store';
import { BattleStats } from './components/BattleStats';
import { CombatControls } from './components/CombatControls';
import { Hand } from './components/Hand';
import { ShopPanel } from './components/ShopPanel';
import { BattleLogDrawer } from './components/BattleLogDrawer';
import './App.css';

function classifyLog(message: string) {
  if (message.includes('KRİTİK')) return { className: 'log-entry--critical', icon: '✦', label: 'Kritik' };
  if (message.includes('hasar') || message.includes('saldırı') || message.includes('vuruldu')) return { className: 'log-entry--attack', icon: '⚔', label: 'Saldırı' };
  if (message.includes('blok') || message.includes('savun')) return { className: 'log-entry--defense', icon: '◈', label: 'Savunma' };
  if (message.includes('iyileş')) return { className: 'log-entry--heal', icon: '✚', label: 'Şifa' };
  if (message.includes('zafer') || message.includes('Ödül')) return { className: 'log-entry--victory', icon: '★', label: 'Zafer' };
  if (message.includes('bitti') || message.includes('ölü')) return { className: 'log-entry--gameover', icon: '×', label: 'Run sonu' };
  return { className: '', icon: '·', label: 'Kayıt' };
}

function App() {
  const initializeGame = useGameStore((s) => s.initializeGame);
  const restartGame = useGameStore((s) => s.restartGame);
  const isPlayerTurn = useGameStore((s) => s.isPlayerTurn);
  const gold = useGameStore((s) => s.gold);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const rewardOptions = useGameStore((s) => s.rewardOptions);
  const addRewardCardToDeck = useGameStore((s) => s.addRewardCardToDeck);
  const skipReward = useGameStore((s) => s.skipReward);
  const selectNode = useGameStore((s) => s.selectNode);
  const availableNodes = useGameStore((s) => s.availableNodes);
  const runFloor = useGameStore((s) => s.runFloor);
  const hand = useGameStore((s) => s.hand);
  const deck = useGameStore((s) => s.deck);
  const discardPile = useGameStore((s) => s.discardPile);
  const battleLogs = useGameStore((s) => s.battleLogs);
  const [isLogOpen, setIsLogOpen] = useState(false);

  useEffect(() => { initializeGame(); }, [initializeGame]);

  const combatTitle = gamePhase === 'combat' ? 'Hamleni seç' : gamePhase === 'mapSelection' ? 'Yolunu seç' : gamePhase === 'victory' ? 'Zafer!' : gamePhase === 'gameOver' ? 'Oyun Bitti' : gamePhase === 'shop' ? 'Gezgin kampı' : 'Mola';
  const nodeInfo = {
    combat: { icon: '⚔', label: 'Savaş', detail: 'Düşmanla yüzleş' },
    elite: { icon: '✦', label: 'Seçkin savaş', detail: 'Büyük ödül, büyük risk' },
    shop: { icon: '◆', label: 'Dükkan', detail: 'Desteni hazırla' },
    event: { icon: '?', label: 'Olay', detail: 'Bilinmeyen bir fırsat' },
    rest: { icon: '✚', label: 'Dinlenme', detail: 'Nefeslen ve güçlen' },
    boss: { icon: '♛', label: 'Boss', detail: 'Son sınav' },
  } as const;

  return (
    <main className={`game-shell game-shell--${gamePhase}`}>
      <header className="topbar">
        <div><p className="eyebrow">Kader Günlüğü · Bölüm I</p><h1>DND Oyunu</h1></div>
        <div className="topbar-meta">
          <div className={`turn-badge ${isPlayerTurn ? 'turn-badge--player' : 'turn-badge--enemy'}`}><span className="turn-dot" aria-hidden="true" />{isPlayerTurn ? 'Oyuncu Turu' : 'Düşman Turu'}</div>
          <div className="gold-display"><span aria-hidden="true">◆</span> {gold} altın</div>
          <BattleLogDrawer messages={battleLogs} isOpen={isLogOpen} onToggle={() => setIsLogOpen((open) => !open)} classify={classifyLog} />
        </div>
      </header>

      {gamePhase !== 'mapSelection' && <section className="battle-stage" aria-label="Savaş alanı"><BattleStats /><div className="battle-divider" aria-hidden="true"><span>VS</span></div></section>}

      <section className={`combat-panel combat-panel--${gamePhase}`} aria-labelledby="combat-title">
        <div className="panel-heading"><div><p className="eyebrow">{gamePhase === 'mapSelection' ? 'Macera haritası' : gamePhase === 'shop' ? 'Dükkan durağı' : 'Savaş alanı'}</p><h2 id="combat-title">{combatTitle}</h2></div>{gamePhase === 'combat' && <CombatControls />}</div>
        {gamePhase === 'combat' && <p className="panel-hint">Kart oyna, enerjini yönet ve düşmanı alt et.</p>}
        {gamePhase === 'mapSelection' && <div className="map-selection"><div className="map-selection__intro"><span className="map-floor">BÖLÜM {runFloor + 1}</span><p>Bir sonraki karşılaşmanın kaderini belirle.</p></div><div className="map-nodes" aria-label="Mevcut yol seçenekleri">{availableNodes.map((node) => <button key={node.id} type="button" className={`map-node map-node--${node.type}`} onClick={() => selectNode(node.id)}><span className="map-node__icon" aria-hidden="true">{nodeInfo[node.type].icon}</span><span><strong>{nodeInfo[node.type].label}</strong><small>{nodeInfo[node.type].detail}</small></span><span className="map-node__arrow" aria-hidden="true">→</span></button>)}</div>{rewardOptions.length > 0 && <div className="map-reward-note"><span aria-hidden="true">★</span> Zafer ödülün hazır. Önce bir kart seçebilir veya pas geçebilirsin.</div>}{rewardOptions.length > 0 && <div className="reward-grid reward-grid--map">{rewardOptions.map((card) => <article key={card.id} className={`reward-card reward-card--${card.tip} reward-card--${card.rarity ?? 'common'}`}><div className="reward-card__head"><span className="reward-rarity">{card.rarity ?? 'common'}</span><span className="reward-mana">{card.manaBedeli} <small>MP</small></span></div><p className="reward-type">{card.tip} · {card.zarTuru} zar</p><h3>{card.isim}</h3><p>{card.effects?.map((effect) => effect.kind).join(' · ') || 'Temel kart etkisi'}</p><button onClick={() => addRewardCardToDeck(card.id)} className="button button--reward" type="button">Bu kartı seç <span aria-hidden="true">→</span></button></article>)}</div>}{rewardOptions.length > 0 && <button onClick={skipReward} className="button button--quiet" type="button">Ödülü pas geç</button>}</div>}
        {gamePhase === 'gameOver' && <div className="terminal-message terminal-message--loss"><span className="terminal-icon" aria-hidden="true">×</span><div><span className="terminal-kicker">Run sona erdi</span><strong>Oyun Bitti</strong><p>Bu savaşta yenildin. Bir sonraki macera için yeniden hazırlan.</p><button onClick={restartGame} className="button button--primary" type="button">Yeni Oyun Başlat</button></div></div>}
        {gamePhase === 'shop' && <ShopPanel />}
        {gamePhase === 'victory' && <div className="victory-content"><div className="terminal-message terminal-message--win"><span className="terminal-icon" aria-hidden="true">✦</span><div><span className="terminal-kicker">Savaş sona erdi</span><strong>Zafer kazanıldı</strong><p>Düşman yenildi. Destene yeni bir güç kat.</p></div></div>{rewardOptions.length === 0 ? <p className="empty-state">Ödül kartları yükleniyor...</p> : <div className="reward-grid">{rewardOptions.map((card) => <article key={card.id} className={`reward-card reward-card--${card.tip} reward-card--${card.rarity ?? 'common'}`}><div className="reward-card__head"><span className="reward-rarity">{card.rarity ?? 'common'}</span><span className="reward-mana">{card.manaBedeli} <small>MP</small></span></div><p className="reward-type">{card.tip} · {card.zarTuru} zar</p><h3>{card.isim}</h3><p>{card.effects?.length ? `${card.effects.length} özel etki` : 'Temel kart etkisi'}</p><button onClick={() => addRewardCardToDeck(card.id)} className="button button--reward" type="button">Bu kartı seç <span aria-hidden="true">→</span></button></article>)}</div>}<button onClick={skipReward} className="button button--quiet" type="button">Ödülü pas geç</button></div>}
        {(gamePhase === 'event' || gamePhase === 'rest' || gamePhase === 'boss') && <div className="phase-placeholder"><span className="phase-placeholder__icon" aria-hidden="true">{gamePhase === 'event' ? '?' : gamePhase === 'rest' ? '✚' : '♛'}</span><strong>{gamePhase === 'event' ? 'Olay hazırlanıyor' : gamePhase === 'rest' ? 'Dinlenme alanı' : 'Boss karşılaşması'}</strong><p>Bu macera durağı için karar seçenekleri hazırlanıyor.</p></div>}
      </section>

      <section className="hand-section"><div className="section-heading"><div><p className="eyebrow">Cephanelik</p><h2>Elindeki kartlar <span>{hand.length}</span></h2></div><p className="deck-count">Deste {deck.length} · Mezarlık {discardPile.length}</p></div><Hand /></section>
    </main>
  );
}

export default App;
