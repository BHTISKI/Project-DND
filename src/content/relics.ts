export type RelicTrigger = 'battle' | 'turn' | 'attack' | 'defend' | 'skill' | 'exhaust' | 'hurt' | 'victory';
export type RelicEffect = 'block' | 'heal' | 'energy' | 'draw' | 'poison' | 'power' | 'posture' | 'gold' | 'cleanse' | 'maxhp';
export interface RelicDefinition { id: string; name: string; trigger: RelicTrigger; effect: RelicEffect; amount: number; once: boolean; detail: string }
export const relics: RelicDefinition[] = [
  { id: 'copper-bell', name: 'Dilsiz Çan', trigger: 'battle', effect: 'block', amount: 5, once: true, detail: 'Savaşa 5 blokla başla.' },
  { id: 'warm-needle', name: 'Sıcak İğne', trigger: 'victory', effect: 'heal', amount: 3, once: true, detail: 'Zaferden sonra 3 can yenile.' },
  { id: 'folded-map', name: 'Katlı Harita', trigger: 'battle', effect: 'draw', amount: 1, once: true, detail: 'İlk eline 1 ek kart çek.' },
  { id: 'borrowed-hour', name: 'Ödünç Saat', trigger: 'battle', effect: 'energy', amount: 1, once: true, detail: 'İlk tur +1 enerji.' },
  { id: 'ash-vial', name: 'Kül Şişesi', trigger: 'battle', effect: 'poison', amount: 1, once: true, detail: 'Savaş başında düşmana 2 turluk 1 zehir yükü.' },
  { id: 'red-thread', name: 'Kırmızı İplik', trigger: 'attack', effect: 'heal', amount: 1, once: true, detail: 'Her tur ilk saldırı kartından sonra 1 can yenile.' },
  { id: 'stone-ring', name: 'Taş Yüzük', trigger: 'defend', effect: 'power', amount: 1, once: true, detail: 'Her tur ilk savunmadan sonra 1 turluk 1 Güçlü yükü.' },
  { id: 'ink-feather', name: 'Mürekkep Tüyü', trigger: 'skill', effect: 'block', amount: 2, once: true, detail: 'Her tur ilk yetenekten sonra 2 blok.' },
  { id: 'ember-cup', name: 'Köz Kâsesi', trigger: 'exhaust', effect: 'block', amount: 2, once: false, detail: 'Tükenen her karttan sonra 2 blok.' },
  { id: 'glass-eye', name: 'Cam Göz', trigger: 'hurt', effect: 'draw', amount: 1, once: true, detail: 'Her tur ilk düşman darbesinde can kaybedince 1 kart çek.' },
  { id: 'bread-pouch', name: 'Ekmek Kesesi', trigger: 'victory', effect: 'maxhp', amount: 1, once: true, detail: 'Her zaferde azami ve mevcut can +1.' },
  { id: 'old-seal', name: 'Eski Mühür', trigger: 'victory', effect: 'gold', amount: 12, once: true, detail: 'Zafer ödülüne 12 altın ekle.' },
  { id: 'woven-brace', name: 'Örgü Bileklik', trigger: 'turn', effect: 'block', amount: 2, once: true, detail: 'İkinci turdan itibaren tur başında 2 blok.' },
  { id: 'mirror-shard', name: 'Ayna Kırığı', trigger: 'hurt', effect: 'poison', amount: 1, once: true, detail: 'Her tur ilk düşman darbesinde can kaybedince düşmana 2 turluk 1 zehir.' },
  { id: 'quiet-chisel', name: 'Sessiz Keski', trigger: 'attack', effect: 'posture', amount: 8, once: true, detail: 'Her tur ilk saldırı kartı düşmana 8 ek denge baskısı uygular.' },
  { id: 'wax-key', name: 'Mum Anahtar', trigger: 'exhaust', effect: 'energy', amount: 1, once: true, detail: 'Her tur ilk tükenen kart 1 enerji geri verir.' },
  { id: 'silver-knot', name: 'Gümüş Düğüm', trigger: 'defend', effect: 'draw', amount: 1, once: true, detail: 'Her tur ilk savunmadan sonra 1 kart çek.' },
  { id: 'clean-page', name: 'Temiz Sayfa', trigger: 'turn', effect: 'cleanse', amount: 1, once: true, detail: 'İkinci turdan itibaren her tur en eski zararlı durumun 1 yükünü sil.' },
  { id: 'last-coal', name: 'Son Kömür', trigger: 'skill', effect: 'power', amount: 1, once: true, detail: 'Her tur ilk yetenekten sonra 1 turluk 1 Güçlü yükü.' },
  { id: 'pilgrim-sandal', name: 'Hacı Çarığı', trigger: 'battle', effect: 'maxhp', amount: 1, once: true, detail: 'Her yeni savaşta azami ve mevcut can +1.' },
];
