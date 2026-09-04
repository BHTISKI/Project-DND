import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../state/store';
import { describeCard } from '../utils/cardText';
import { momentumMultiplier } from '../mechanics/posture';

export function MechanicStatus() {
  const { comboCount, postureComboCount, pendingParry, exhausted } = useGameStore(useShallow(s => ({
    comboCount: s.comboCount,
    postureComboCount: s.postureComboCount,
    pendingParry: s.pendingParry,
    exhausted: s.exhaustedPile,
  })));
  const nextMomentum = momentumMultiplier(postureComboCount + 1).toLocaleString('tr-TR');
  return <aside className="mechanic-status" aria-label="Kart mekanikleri">
    <p><strong>Kombo {comboCount}</strong> · Saldırı, savunma ve yetenek arasında her geçiş +1 kombo. Tur sonunda sıfırlanır.</p>
    {postureComboCount > 0 && <p><strong>Yakın zincir {postureComboCount}</strong> · Sonraki yakın saldırı {nextMomentum}× denge.</p>}
    {pendingParry && <p className="mechanic-status__parry"><strong>Savuşturma hazır</strong> · Yayımlanmış yakın saldırıyı tamamen durdurur.</p>}
    {exhausted.length > 0 && <details>
      <summary>Tükenen kartlar ({exhausted.length}) · Savaş sonunda geri döner</summary>
      <ul>{exhausted.map(card => <li key={card.id}><strong>{card.isim}</strong> — {describeCard(card)}</li>)}</ul>
    </details>}
  </aside>;
}
