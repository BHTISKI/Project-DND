import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../state/store';
import { describeCard } from '../utils/cardText';

export function MechanicStatus() {
  const { comboCount, exhausted } = useGameStore(useShallow(s => ({ comboCount: s.comboCount, exhausted: s.exhaustedPile })));
  return <aside className="mechanic-status" aria-label="Kart mekanikleri">
    <p><strong>Kombo {comboCount}</strong> · Saldırı, savunma ve yetenek arasında her geçiş +1 kombo. Tur sonunda sıfırlanır.</p>
    {exhausted.length > 0 && <details>
      <summary>Tükenen kartlar ({exhausted.length}) · Savaş sonunda geri döner</summary>
      <ul>{exhausted.map(card => <li key={card.id}><strong>{card.isim}</strong> — {describeCard(card)}</li>)}</ul>
    </details>}
  </aside>;
}
