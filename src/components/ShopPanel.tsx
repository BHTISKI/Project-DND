import React from 'react';
import type { Card } from '../types/game';

interface ShopPanelProps {
  deck: Card[];
  gold: number;
  healPlayer: () => void;
  removeCardFromDeck: (cardId: string) => void;
  startNextCombat: () => void;
}

export const ShopPanel: React.FC<ShopPanelProps> = ({
  deck,
  gold,
  healPlayer,
  removeCardFromDeck,
  startNextCombat,
}) => {
  return (
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
  );
};
