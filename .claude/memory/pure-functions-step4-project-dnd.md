# Adım 4: Pure Fonksiyonları Engine/Utils’a Taşıma (Tamamlandı)

## Yapılanlar
- `src/utils/game.ts` dosyası oluşturuldu ve aşağıdaki pure fonksiyonlar taşındı:
  1. `calculateUpgradeCost(rarity: Card['rarity'] | undefined, victoryCount: number): number`
  2. `enhanceEffect(effect: CardEffect): CardEffect`
  3. `shuffle<T>(array: T[]): T[]` (Fisher‑Yates)
- `src/state/store.ts` güncellendi:
  - Üst kısmına `import { calculateUpgradeCost, enhanceEffect, shuffle } from '../utils/game';` eklendi.
  - Store içinde yer alan aynı isimli fonksiyon tanımlamaları (`function calculateUpgradeCost…`, `function enhanceEffect…`, `function shuffle<T>…`) kaldırıldı.
  - `averageDie` zaten `../utils/math`тенから import edilmekti; ona dokunulmadı.
- `src/utils/game.test.ts` dosyası oluşturuldu ve pure fonksiyonlar için birim testler yazıldı (14 test geçiyor).
- `src/state/slice/metaSlice.test.ts` ve `src/state/slice/gameSlice.test.ts` dosyaları oluşturuldu ve slice’lar için birim testler yazıldı (her biri 4 ve 3 test geçiyor, toplam 7 test).

## Kazanılan Avantajlar
| Avantaj | Açıklama |
|---|---|
| **Store karmaşıklığı azaldı** | `store.ts` artık sadece state ve aksiyonları içerir; karmaşık iş mantığı dışarıda. |
| **Test izolasyonu** | Bu fonksiyonlar artık `__tests__` veya `testUtils` içinde bağımsız olarak test edilebilir. |
| **Yeniden kullanabilirlik** | Başka slice’lar, servisler veya bileşenler `import { … } from '../utils/game'` yaparak aynı fonksiyonları kullanabilir. |
| **Derleme‑zamanı etkisi azaltıldı** | Store’da karmaşık mantık yok; sadece basit state ve aksiyonlar kalır → hızlı yeniden derleme. |
| **Okunabilirlik ve bakım** | İş mantığı (`utils/game.ts`) ile state yönetimi (`state/slice/`) ayrılaştırıldı; her iki dosya da daha odaklı ve kısa. |
| **Token verimliliği** | Küçük, odaklı değişikliklerle gereksiz kod okunmasını önledik; bağlam yükü minimuma indi. |

## Not
- Bu adım artık tamamlandı. Bir sonraki adım (**#5 – Test Stratifikasyonunun Oluşturulması**) için:
  - Test kapsamını artırarak diğer slice’lar (mapSlice, cardSlice, combatSlice) için testler yazılabilir.
  - Entegrasyon testleri (slice + ilgili engine fonksiyonları) ve kritik kullanıcı akışları için E2E test planı çıkarılabilir.
- Her adımın ardından `.claude/memory/` altında kısa bir not bırakıyoruz; bu sefer `pure-functions-step4-project-dnd.md` notu oluşturuldu.

