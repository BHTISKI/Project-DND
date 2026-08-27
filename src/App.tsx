import { useGameStore } from './state/store';
import { Hand } from './components/Hand';
import { CardComponent } from './components/Card';
import { useEffect } from 'react';

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
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>DND Oyunu</h1>

      <div>
        <h2>Oyuncu</h2>
        <p>Can: {player.mevcutCan} / {player.maksimumCan}</p>
        <p>Zırh Sınıfı (AC): {player.zirhSinifi}</p>
        <p>Güç Çarpanı: {player.gucCarpani}</p>
        <p>Enerji: {currentEnergy} / {maxEnergy}</p>
        <p>Altın: {gold}</p>
        <p>Destek: {deck.length} | El: {hand.length} | Mezarlık: {discardPile.length}</p>
      </div>

      <div>
        <h2>Düşman</h2>
        <p>Can: {enemy.mevcutCan} / {enemy.maksimumCan}</p>
        <p>Zırh Sınıfı (AC): {enemy.zirhSinifi}</p>
        <p>Güç Çarpanı: {enemy.gucCarpani}</p>
      </div>

      <p>Şu anki tur: {isPlayerTurn ? 'Oyuncu Turu' : 'Düşman Turu'}</p>
      <p>Oyun Phase: {gamePhase}</p>

      <div style={{ marginTop: '20px' }}>
        {gamePhase === 'combat' && (
          <>
            <button onClick={endTurn} style={{ marginLeft: '10px', padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}>
              Turu Bitir
            </button>
          </>
        )}
        {gamePhase === 'shop' && (
          <>
            <div style={{ marginBottom: '10px' }}>
              <button onClick={healPlayer} style={{ padding: '8px 16px', fontSize: '1rem', marginRight: '10px', cursor: 'pointer' }}>
                Can Yenile (+4) - 25 Altın
              </button>
            </div>
            <div>
              <h3>Destekleriniz</h3>
              {deck.length === 0 ? (
                <p>Destek boş</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {deck.map((card) => (
                    <div key={card.id} style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '120px', textAlign: 'center' }}>
                      <h4>{card.isim}</h4>
                      <p>Mana: {card.manaBedeli}</p>
                      <button
                        onClick={() => removeCardFromDeck(card.id)}
                        style={{ marginTop: '8px', padding: '4px 8px', fontSize: '0.9rem', cursor: 'pointer' }}
                        disabled={gold < 50}
                      >
                        Kartı Sil - 50 Altın
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: '15px' }}>
              <button onClick={startNextCombat} style={{ padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}>
                Savaşmaya Başla
              </button>
            </div>
          </>
        )}
        {gamePhase === 'victory' && (
          <>
            <h2>Tebrikler! Düşmanı Yenildiniz!</h2>
            <p>Bir ödül kartı seçin veya ödülü geçin.</p>
            {rewardOptions.length === 0 ? (
              <p>Ödül kartları yükleniyor...</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                {rewardOptions.map((card) => (
                  <div key={card.id} style={{ border: '2px solid #daa520', padding: '12px', borderRadius: '6px', width: '180px', textAlign: 'center' }}>
                    <h3>{card.isim}</h3>
                    <p>Mana: {card.manaBedeli}</p>
                    <p>Zar: {card.zarTuru}</p>
                    <button
                      onClick={() => addRewardCardToDeck(card.id)}
                      style={{ marginTop: '10px', padding: '6px 12px', fontSize: '0.9rem', cursor: 'pointer', backgroundColor: '#32cd32', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      Destete Ekle
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={skipReward} style={{ padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}>
              Ödülü Pas Geç
            </button>
          </>
        )}
      </div>

      <Hand />

      {/* Savaş Günlüğü */}
      <div style={{ marginTop: '20px', padding: '12px', border: '1px solid #555', borderRadius: '4px', backgroundColor: '#fafafa', maxHeight: '150px', overflowY: 'auto' }}>
        <strong>Savaş Günlüğü:</strong>
        {battleLogs.slice(-5).map((msg, idx) => (
          <div key={idx} style={{ marginTop: '4px', fontSize: '0.9rem' }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;