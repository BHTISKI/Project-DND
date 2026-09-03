# project-dnd

D&D'den esinlenen, tek oyunculu ve tur tabanlı bir masaüstü tarayıcı kart oyunu. React, TypeScript, Zustand ve Vite kullanır.

## Çalıştırma

Node.js 24 ile:

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run lint
npm test
```

Üretim çıktısını yerelde incelemek için `npm run preview` çalıştırılır. CI aynı derleme, lint ve test kontrollerini uygular.

## Mevcut oyun kuralları

1. 2–20 karakterlik bir isim girilir. Yedi kartlık başlangıç destesi hazırlanır.
2. Haritadan ilk savaşa girerken, beş seçenekten üç kart seçilir. Yük bütçesi 6'dır; sıradan/seçkin/nadir/efsanevi kartlar 1/2/3/4 yük kullanır. Üç seçimi tamamlamayı engelleyen seçimler kapalıdır.
3. Her oyuncu turunda beş kart çekilir ve enerji 3'e doldurulur. Elde tutulan her kart bir çekiş yerini kullanır; örneğin bir kart saklandıysa dört yeni kart çekilir. Kartların ürettiği enerji bu dolum değerini aşabilir. Kırık Ruh bu macera boyunca maksimum canı ve tur dolum enerjisini düşürür.
4. Kart tek tıklamayla oynanır; çift tıklama veya **İncele** düğmesi ayrıntıları açar. Çift tıklamayı ayırmak için fareyle tek tıklama 500 ms gecikmeli uygulanır. Klavyeyle oynama anlıktır. İnceleme enerji harcatmaz; Escape pencereyi kapatır.
5. Fiziksel saldırıda D20 + Güç, hedefin zırhına eşit veya büyük olmalıdır. Doğal 1 ıskalar; doğal 20 isabet eder ve temel hasarı ikiyle çarpar. Zırhı yok sayan/doğrudan hasar etkileri isabet zarı atmaz. Hasar, kartta yazan zar + sabit katkı + Güç + varsa kombo katkısından hesaplanır; durumlar ve blok ayrıca uygulanır.
6. Avantaj/dezavantaj isabet zarını etkiler ve saldırıda birer yük tüketilir. Güçlü hasarı artırır, Güçsüz azaltır. Savunmasız alınan hasarı yük × değer başına %25 artırır. Zehir, hedefin eyleminden önce işler. Tahkimli, düşman hamlesinden önce blok kazandırır. Süreler tamamlanan tur sonunda azalır; durum yükleri en fazla 3'tür.
7. Blok kartları birbirine eklenir; gelen hasar yalnızca kullandığı bloğu tüketir. Oyuncu bloğu düşman turundan sonra, düşman bloğu sonraki düşman hamlesinden önce temizlenir.
8. Hasar dengeyi doldurur. Denge kırıldığında sıradaki bloke edilmeyen darbe iki kat hasar verir veya karakterin hamlesi atlanır; bu tüketimden sonra denge sıfırlanır. Yeni savaşta geçici durumlar sıfırlanır.
9. Düşman niyeti hamle öncesinde gösterilir. Fırsatçı ve paranoyak düşmanlar kartlarına tepki verirse gösterge hemen güncellenir. Tur bitiminde aynı hamle çözülür. Hasar göstergesi blok öncesidir; fiziksel saldırı ıskalayabilir veya gösterilen kritik değeri vurabilir. Aldatıcı düşmanda niyetin belirsiz olduğu belirtilir.
10. Kullanılan normal kart mezarlığa gider. **Tükenir** kartları ayrı yığına gider; bu savaşta tekrar çekilmez, savaş sonunda geri döner. Çekiş destesi boşalınca yalnızca mezarlık karıştırılır. Oynanmakta olan çekiş kartı kendi etkisiyle geri çekilemez. Lanetlerin bedeli kart açıklamasında gösterilir.
11. Her ölüm yolu aynı sonucu uygular: oyuncu 0 canda kaybeder; eşzamanlı ölüm yenilgidir. Düşman yenilince ödül bir kez verilir. Normal altın 20 + önceki zafer × 5; elit bu miktarın %50 fazlası; boss 50 + önceki zafer × 10'dur. Normal/elit 3, boss 4 kart seçeneği verir.
12. Ödül seçimi veya pas geçme sonrası mağaza açılır. Mağaza, eldeki ve mezarlıktaki kartlar dahil bütün sahip olunan kartları yönetir. Tam canda şifa satılmaz; etkisiz yükseltme ücretlendirilmez; son kart silinmez.
13. Harita durakları tamamlandıkça sayaç bir artar. Başlangıçtan sonra her üç tamamlanmış durakta boss/elit seçenekleri açılır. Zafer sonrası ücretsiz mağazadan çıkış ikinci kez sayaç artırmaz.
14. Olay bedelleri ekrandaki güncel altına göre gösterilir. Kehanet sonraki düşmana taşınır ve ilk oyuncu turu otomatik feda edilir. Dinlenmede işlem yapmadan devam edilebilir.
15. Yeni oyun sağlık, enerji, durum, sayaç ve diyalogları sıfırlar; isim ve meta istatistikleri korunur.

Yalnızca meta altın ve meta zafer sayısı tarayıcıda saklanır. Macerayı kaydet/devam et, final rota, yeni sınıflar ve içerik genişletmeleri sonraki özellik aşamasındadır. Mobil geliştirme bu düzeltme paketinin kapsamı dışındadır.

## Kod düzeni

- `src/mechanics/`: elde tutma, tükenme ve bitirici için bağımsız kurallar ve tasarım değerlendirme ölçütleri.

- `src/state/store.ts`: oyun aşamaları ve eylemlerin bağlantıları.
- `src/engine/combatResolver.ts`: kart ve tur çözümleme.
- `src/engine/statuses.ts`, `cardPiles.ts`, `rewards.ts`, `draft.ts`: ortak oyun kuralları.
- `src/engine/runMap.ts`: tek harita üreticisi.
- `src/utils/cardText.ts`: savaş, seçim, ödül ve mağaza için ortak kart açıklamaları.
- `src/state/regressions.test.ts`, `src/components/regressions.test.tsx`: raporlanan hataların tekrarını önleyen testler.

İlk durum incelemesi: [Proje raporu](docs/PROJE_INCELEME_RAPORU_2026-09-04.md).
Düzeltme sonuçları: [Hata düzeltme raporu](docs/HATA_DUZELTME_RAPORU_2026-09-04.md).

## Yeni kart mekanikleri

| Kart | Kullanım |
|---|---|
| Sabırlı Muhafız | 1 enerji, 3 blok. Oynamazsan sonraki elinde kalır. |
| Son Kıvılcım | 0 enerji, +1 enerji. Savaşta bir kez kullanılır; sonra tükenir. |
| Zincir Darbesi | 1 enerji, d4 + Güç saldırısı. Bu kart dahil aynı tur iki kart türü geçişi yapıldıysa ilk saldırıya +3 hasar. |

Örneğin **Son Kıvılcım → Sabırlı Muhafız → Zincir Darbesi** sırası yetenek → savunma → saldırı olarak iki tür geçişi yapar. Bitirici hazır olunca kartın altında gösterilir. Tekrarlanan tür kombo artırmaz; mevcut kombo tur boyunca korunur, tur sonunda sıfırlanır. Mevcut yetenek→saldırı +2 ve savunma→saldırı +1 bonusları da geçerlidir. Bitirici bonusu ilk saldırı ıskalarsa harcanır.

Bu üç kart başlangıç, ilk deste seçimi ve ödül havuzlarında bulunur. Tükenen kartlar savaşta açılır listede görülebilir. Kart açıklamaları **İncele** penceresinde de okunabilir.

Araştırma: [10 aday ve kaynaklar](docs/mechanics-research.md). Deney: [Playtest sonuçları](docs/playtest-log.md). Geliştirici kuralları: [Mekanik ekleme](src/mechanics/README.md).

100 eşleştirilmiş savaş senaryosunu yeniden çalıştırmak için:

```sh
npm run simulate
npm run simulate -- --baseline
npm run simulate -- --with-mechanics
```

Simülasyon tasarım için bir denge kontrolüdür; insan oyuncu eğlencesini veya tam macera kazanma oranını ölçmez.
