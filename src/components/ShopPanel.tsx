// Bu dosya src/components/ShopPanel.tsx için ilgili kodları içerir.
// Bileşen: dükkan paneli, kart satın alma ve upgrades
import React from 'react';
import { useGameStore } from '../state/store';
import { sampleCardDefs } from '../types/game';
import { calculateUpgradeCost, upgradedCard } from '../utils/game';
import { describeCard } from '../utils/cardText';
import { useShallow } from 'zustand/react/shallow';

export const ShopPanel: React.FC = () => {
  const { drawPile, hand, discardPile, player, gold, victoryCount, buyCard, healPlayer, removeCardFromDeck, upgradeCard, startNextCombat, purifyDeck } = useGameStore(useShallow((state) => ({
    drawPile: state.deck,
    hand: state.hand,
    discardPile: state.discardPile,
    player: state.player,
    gold: state.gold,
    victoryCount: state.victoryCount,
    buyCard: state.buyCard,
    healPlayer: state.healPlayer,
    removeCardFromDeck: state.removeCardFromDeck,
    upgradeCard: state.upgradeCard,
    startNextCombat: state.startNextCombat,
    purifyDeck: state.purifyDeck,
  })));

  const deck = [...drawPile, ...hand, ...discardPile];
  const canHeal = gold >= 25 && player.mevcutCan < player.maksimumCan;
  const canRemove = gold >= 50 && deck.length > 1;
  const curseCount = deck.filter(card => card.isCursed).length;
  const shopCards = sampleCardDefs.slice(7, 11).map((card, index) => ({ ...card, id: `shop-${index + 7}` }));

  return (
    <section className="shop-layout" aria-label="Mağaza">
      <header className="shop-header">
        <div><p className="eyebrow">Gezgin kampı</p><h2>Mağaza</h2></div>
        <div className="shop-gold-badge" aria-label={`${gold} altın mevcut`}><span aria-hidden="true">◆</span><strong>{gold}</strong><small>ALTIN</small></div>
      </header>
      <section className="shop-offers" aria-labelledby="shop-offers-title">
        <div className="shop-section-heading"><div><p className="eyebrow">Koleksiyon</p><h3 id="shop-offers-title">Yeni kartlar</h3></div><span>Satın al ve koleksiyonunu genişlet</span></div>
        <div className="shop-card-stack">
          {shopCards.map((card) => {
            const cost = card.rarity === 'legendary' ? 120 : card.rarity === 'rare' ? 80 : card.rarity === 'uncommon' ? 60 : 40;
            const canBuy = gold >= cost;
            return <article key={card.id} className={`shop-offer shop-offer--${card.tip}`}>
              <div className="shop-offer__top"><span>{card.tip}</span><strong>{cost} <small>ALTIN</small></strong></div>
              <span className="shop-offer__glyph" aria-hidden="true">{card.tip === 'saldırı' ? '⚔' : card.tip === 'savunma' ? '◈' : '✦'}</span>
              <h4>{card.isim}</h4><p>{card.manaBedeli} enerji · {describeCard(card)}</p>
              <button onClick={() => buyCard(card.id)} className="button button--shop-buy" disabled={!canBuy} type="button" aria-label={`${card.isim} kartını al`}>Satın al</button>
            </article>;
          })}
        </div>
      </section>
      <div className="shop-action shop-action--heal">
        <span className="shop-action__icon" aria-hidden="true">✚</span>
        <div><p className="eyebrow">Şifa</p><h3>Canını toparla</h3><p>{player.mevcutCan >= player.maksimumCan ? 'Canın zaten tam' : `+${Math.min(4, player.maksimumCan - player.mevcutCan)} can · 25 altın`}</p></div>
        <button onClick={healPlayer} className="button button--shop" disabled={!canHeal} type="button">Satın al</button>
      </div>
      <div className="shop-action shop-action--upgrade">
        <span className="shop-action__icon" aria-hidden="true">↑</span>
        <div><p className="eyebrow">Demirci masası</p><h3>Kart yükselt</h3><p>Bir kartın etkisini güçlendir.</p></div>
        <div className="shop-upgrade-list" aria-label="Yükseltilebilir kartlar">
          {deck.map((card) => {
            const cost = calculateUpgradeCost(card.rarity, victoryCount);
            const isUpgraded = card.isUpgraded === true;
            const preview = upgradedCard(card);
            const canUpgrade = preview !== null && gold >= cost;
            return <div key={card.id} className="shop-card-row shop-card-row--upgrade">
              <span className={`shop-card-mark shop-card-mark--${card.tip}`} aria-hidden="true" />
              <h4 title={preview ? `${preview.manaBedeli} enerji · ${describeCard(preview)}` : describeCard(card)}>{card.isim}</h4><span>{isUpgraded ? 'Güçlendirildi' : !preview ? 'Yükseltme yok' : `${cost} altın`}</span>
              <button onClick={() => upgradeCard(card.id)} className="button button--upgrade" disabled={!canUpgrade} type="button" aria-label={isUpgraded ? `${card.isim} zaten yükseltilmiş` : `${card.isim} kartını ${cost} altınla yükselt`}>
                {isUpgraded ? 'Yükseltildi' : !preview ? 'Yükseltme yok' : canUpgrade ? 'Yükselt' : 'Yetersiz altın'}
              </button>
            </div>;
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
                  Feda et · 50
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="shop-action shop-action--purify">
        <span className="shop-action__icon" aria-hidden="true">✦</span>
        <div><p className="eyebrow">Ritüel</p><h3>Desteyi arındır</h3><p>Lanetli kartları tamamen yok eder · 120 altın</p></div>
        <button onClick={purifyDeck} className="button button--shop" disabled={gold < 120 || curseCount === 0 || curseCount === deck.length} type="button">Arındır</button>
      </div>
      <div className="shop-footer">
        <p>Hazır olduğunda bir sonraki savaşa geç.</p>
        <button onClick={startNextCombat} className="button button--turn" type="button">
          Savaşa geç <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
};
