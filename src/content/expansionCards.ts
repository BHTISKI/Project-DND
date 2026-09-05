import type { Card, CardEffect, StatusId } from '../types/game';

type Definition = Omit<Card, 'id'>;
const hit = (amount: number): CardEffect => ({ kind: 'attack', amount });
const block = (amount: number): CardEffect => ({ kind: 'block', amount });
const draw = (amount = 1): CardEffect => ({ kind: 'draw', amount });
const status = (id: StatusId, duration: number, target: 'player' | 'enemy' = 'enemy', stacks = 1): CardEffect => ({ kind: 'status', status: id, duration, stacks, target });
const card = (isim: string, tip: Card['tip'], manaBedeli: number, rarity: Card['rarity'], theme: string, effects: CardEffect[], extra: Partial<Definition> = {}): Definition =>
  ({ isim, tip, manaBedeli, rarity, theme, baseHasar: 0, effects, tags: [tip === 'saldırı' ? 'attack' : tip === 'savunma' ? 'defend' : 'skill', theme], ...extra });

// Üç deste kimliği: hatıra (çekiş), yemin (blok/yansıma), kül (zehir/kanama).
export const expansionCards: Definition[] = [
  card('Yarım Hatıra', 'yetenek', 0, 'common', 'memory', [draw()], { exhaust: true }),
  card('Yolcunun Kesiti', 'saldırı', 1, 'common', 'memory', [hit(4)]),
  card('Kervan Siperi', 'savunma', 1, 'common', 'oath', [block(5)]),
  card('Kül Çiziği', 'saldırı', 1, 'common', 'ash', [hit(2), status('bleeding', 2)]),
  card('Solgun İplik', 'yetenek', 1, 'common', 'memory', [draw(2)], { exhaust: true }),
  card('Paslı Diken', 'savunma', 1, 'common', 'oath', [block(3), status('reflection', 1, 'player')]),
  card('İsli Nefes', 'yetenek', 1, 'common', 'ash', [status('poisoned', 3)]),
  card('Eşik Nöbeti', 'savunma', 1, 'common', 'oath', [block(4)], { retain: true }),
  card('Sessiz Adım', 'yetenek', 1, 'common', 'memory', [block(2), draw()]),
  card('Kırık Mızrak', 'saldırı', 1, 'common', 'oath', [hit(3)], { postureDamage: 40 }),
  card('Yara İzi', 'saldırı', 2, 'common', 'ash', [hit(5), status('bleeding', 2)]),
  card('Unutulan Söz', 'yetenek', 1, 'common', 'memory', [status('weakened', 2), draw()], { exhaust: true }),
  card('Taşın Sabrı', 'savunma', 2, 'common', 'oath', [block(8)]),
  card('Kor Avucu', 'yetenek', 1, 'common', 'ash', [{ kind: 'damage', amount: 4 }]),
  card('Son Lokma', 'yetenek', 1, 'common', 'memory', [{ kind: 'heal', amount: 3 }], { exhaust: true }),
  card('Adını Koru', 'savunma', 1, 'common', 'memory', [block(3), status('regeneration', 2, 'player')]),
  card('Çan Darbesi', 'saldırı', 2, 'uncommon', 'oath', [hit(5), status('vulnerable', 2)]),
  card('Kanlı İmza', 'saldırı', 1, 'uncommon', 'ash', [hit(2), status('bleeding', 3, 'enemy', 2)]),
  card('Hatıra Dokuması', 'yetenek', 1, 'uncommon', 'memory', [draw(2), block(2)], { exhaust: true }),
  card('Ayna Yemini', 'savunma', 2, 'uncommon', 'oath', [block(5), status('reflection', 2, 'player', 2)]),
  card('Kül Hasadı', 'saldırı', 1, 'uncommon', 'ash', [hit(3), { kind: 'conditional', status: 'poisoned', damage: 4 }]),
  card('Dikiş Payı', 'yetenek', 1, 'uncommon', 'memory', [status('regeneration', 3, 'player'), draw()]),
  card('Kapanan Halka', 'savunma', 1, 'uncommon', 'oath', [block(4), status('fortified', 2, 'player')]),
  card('Köz Borcu', 'yetenek', 0, 'uncommon', 'ash', [{ kind: 'energy', amount: 2 }, status('bleeding', 2, 'player')], { exhaust: true }),
  card('Geri Çağrı', 'yetenek', 1, 'uncommon', 'memory', [draw(3)], { exhaust: true }),
  card('İnfazın Eşiği', 'saldırı', 2, 'uncommon', 'oath', [hit(4)], { postureDamage: 55 }),
  card('Açık Damar', 'saldırı', 2, 'uncommon', 'ash', [hit(4), { kind: 'conditional', status: 'bleeding', damage: 6 }]),
  card('Kayıp Sayfa', 'yetenek', 0, 'uncommon', 'memory', [draw(2), status('weakened', 1, 'player')], { exhaust: true }),
  card('Nöbet Değişimi', 'savunma', 2, 'uncommon', 'oath', [block(6), draw()]),
  card('Salgın Mührü', 'yetenek', 2, 'uncommon', 'ash', [status('poisoned', 3, 'enemy', 2)]),
  card('İsmini Hatırla', 'yetenek', 1, 'uncommon', 'memory', [status('empowered', 2, 'player'), draw()]),
  card('Gümüş Karşılık', 'saldırı', 1, 'uncommon', 'oath', [hit(3)], { finisher: { threshold: 2, damage: 5 } }),
  card('Hatıra Ocağı', 'yetenek', 2, 'rare', 'memory', [status('regeneration', 99, 'player')], { exhaust: true, tags: ['skill', 'memory', 'power'] }),
  card('Son Nöbet', 'savunma', 2, 'rare', 'oath', [status('fortified', 99, 'player', 2)], { exhaust: true, tags: ['defend', 'oath', 'power'] }),
  card('Dikenli Taç', 'yetenek', 2, 'rare', 'ash', [status('reflection', 99, 'player', 2)], { exhaust: true, tags: ['skill', 'ash', 'power'] }),
  card('Zamanın Düğümü', 'yetenek', 2, 'rare', 'memory', [status('timeLocked', 1)], { exhaust: true }),
  card('Yemin Kıran', 'saldırı', 3, 'rare', 'oath', [hit(10)], { postureDamage: 65, exhaust: true }),
  card('Kül Fırtınası', 'yetenek', 2, 'rare', 'ash', [{ kind: 'damage', amount: 5 }, status('poisoned', 3), status('bleeding', 2)], { exhaust: true }),
  card('Yeniden Dokuma', 'yetenek', 2, 'rare', 'memory', [{ kind: 'heal', amount: 6 }, draw(2)], { exhaust: true }),
  card('Taş Hafızası', 'savunma', 2, 'rare', 'oath', [block(10), status('reflection', 1, 'player', 3)], { exhaust: true }),
  card('Son Bedel', 'saldırı', 0, 'rare', 'ash', [hit(8), status('bleeding', 3, 'player', 2)], { exhaust: true }),
  card('Sessizliğin Cevabı', 'saldırı', 2, 'rare', 'memory', [hit(6), draw()], { finisher: { threshold: 3, damage: 7 } }),
  card('Kilit Taşı', 'savunma', 1, 'uncommon', 'oath', [block(5)], { isParry: true }),
  card('Mühür Kırıntısı', 'yetenek', 0, 'common', 'ash', [status('vulnerable', 1)], { exhaust: true }),
  card('Kervanın Son Işığı', 'yetenek', 1, 'uncommon', 'memory', [status('regeneration', 2, 'player', 2)], { exhaust: true }),
  card('Paslı Yemin', 'yetenek', 1, 'common', 'oath', [status('weakened', 2), block(2)]),
  card('Borç Senedi', 'yetenek', 0, 'common', 'ash', [status('weakened', 1, 'player')], { isCursed: true, tags: ['curse', 'ash'], onDiscardPenalty: { kind: 'pureDamage', amount: 1, returnToDeck: true } }),
  card('Silinmiş Ad', 'yetenek', 1, 'uncommon', 'memory', [status('timeLocked', 1, 'player')], { isCursed: true, tags: ['curse', 'memory'], exhaust: true }),
];
