import React from 'react';
import { useGameStore } from '../state/store';

export const ShopPanel: React.FC = () => {
  const {
    deck,
    gold,
    healPlayer,
    removeCardFromDeck,
    startNextCombat,
    upgradeCard,
    victoryCount,
  } = useGameStore();

  const canHeal = gold >= 25;
  const canRemove = gold >= 50;

  // Helper to calculate upgrade cost
  const calculateUpgradeCost = (rarity: 'common' | 'uncommon' | 'rare' | undefined, victoryCount: number): number => {
    const baseCost = rarity === 'rare' ? 80 : rarity === 'uncommon' ? 60 : 40;
    return baseCost + Math.floor(baseCost * victoryCount * 0.1);
  };

  return (
    <div className="shop-layout">
      <div className="shop-action shop-action--heal">
        <span className="shop-action__icon" aria-hidden="true">✚</span>
        <div><p className="eyebrow">Şifa</p><h3>Canını toparla</h3><p>+4 can · 25 altın</p></div>
        <button onClick={healPlayer} className="button button--shop" disabled={!canHeal} type="button">Satın al</button>
      </div>
      <div className="shop-action shop-action--upgrade">
        <span className="shop-action__icon" aria-hidden="true">⬆️</span>
        <div>
          <p className="eyebrow">Kart Yükseltme</p>
          <h3>Kartı yükselt</h3>
          <p>Seçilen kartın etkilerini güçlendirir</p>
        </div>
        <div className="shop-upgrade-list">
          {deck.map((card) => {
            const cost = calculateUpgradeCost(card.rarity, victoryCount);
            const isUpgraded = card.isUpgraded;
            const canAfford = gold >= cost;
            return (
              <div key={card.id} className="shop-card-row">
                <span className={`shop-card-mark shop-card-mark--${card.tip}`} aria-hidden="true" />
                <h4>{card.isim}</h4>
                <span>{card.manaBedeli} enerji</span>
                <button
                  onClick={() => upgradeCard(card.id)}
                  className={`button button--upgrade ${!canAfford || isUpgraded ? 'button--disabled' : ''}`}
                  disabled={!canAfford || isUpgraded}
                  type="button"
                  aria-label={
                    isUpgraded
                      ? `${card.isim} kartı zaten yükseltilmiş`
                      : !canAfford
                        ? `${card.isim} kartını ${cost} altınla yükselt`
                        : `${card.isim} kartını ${cost} altınla yükselt`}
                >
                  {isUpgraded ? 'Zaten Yükseltildi' : canAfford ? `Yükselt · ${cost}` : `Yetersiz Altın`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="shop-deck">
        <div className="shop-subheading"><div><p className="eyebrow">Deste yönetimi</p><h3>Desten</h3></div><span>{deck.length} kart</span></div>
        {deck.length === 0 ? (
          <p className="empty-state">Deste boş</p>
        ) : (
          <div className="shop-card-list">
            {deck.map((card) => (
              <div key={card.id} className="shop-card-row">
                <span className={`shop-card-mark shop-card-mark--${card.tip}`} aria-hidden="true" />
                <h4>{card.isim}</h4><span>{card.manaBedeli} enerji</span>
                <button
                  onClick={() => removeCardFromDeck(card.id)}
                  className="button button--remove"
                  disabled={!canRemove}
                  type="button"
                  aria-label={`${card.isim} kartını 50 altın karşılığında sil`}
                >
                  Sil · 50
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="shop-footer">
        <p>Hazır olduğunda bir sonraki savaşa geç.</p>
        <button onClick={startNextCombat} className="button button--turn" type="button">
          Savaşa geç <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};