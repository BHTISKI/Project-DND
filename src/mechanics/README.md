# Kart mekanikleri

## Kurallar ve bağlantılar

- `retain.ts` / `Card.retain`: `resolveTurn` el temizliğinde kartı korur. Korunan kart sayısı bir sonraki `drawCount` değerinden çıkarılır; sıfırın altına düşmez. Eldeki fazla kartları zorla silmez. `onDiscardPenalty` kartları tutulamaz ve lanet bedeli yine ödenir.
- `exhaust.ts` / `Card.exhaust`: `resolveCard` sonrası kartı `exhaustedPile` içine koyar. Kart sahibi olmaya devam edilir; çekme/karıştırma bu yığını kullanmaz. Savaş kazanılınca mezarlığa, yeni savaş hazırlanırken ortak desteye döner. Yeniden başlatma yığını temizler. Kalıcı kart değiştirme laneti tükenmeye göre önceliklidir.
- `finisher.ts` / `Card.finisher`: aynı tur tür değişimi sayısı eşiğe ulaştığında kartın ilk saldırı etkisine basılı hasar bonusunu ekler. Kartın kendi geçişi sayılır. Bonus ilk saldırıda kullanılır ve başka karta taşınmaz. Durum etkileri ve blok normal hasar yolundan uygulanır. Kategori için ilk etiket (`attack`, `defend`, `skill`), etiket yoksa `tip` kullanılır.
- `MechanicStatus`: görünür kombo sayısı ve tükenen kart listesi. `Hand` hazır/eksik bitirici bilgisini aynı saf yardımcılarla hesaplar. Kart başlıklarının erişilebilir adında da bu bilgi vardır.

| Prototip | Kart | Tasarım hipotezi puanı |
|---|---|---:|
| Elde tut | Sabırlı Muhafız | 88/100 |
| Tükenir | Son Kıvılcım | 86/100 |
| Bitirici | Zincir Darbesi | 88/100 |

Puanlar `funMetrics.ts` içindeki ağırlıklı ölçütlerden hesaplanır; insan değerlendirmesi değildir. Tam değerler ve kaynaklar [araştırma belgesinde](../../docs/mechanics-research.md).

## İçerik ekleme

Yeni kartı `src/types/game.ts` içindeki kataloğa ekle. Bu üç mekanik için yeni effect türü gerekmez; alanları karta eklemek yeterlidir. Kartın ilk kategorisini doğru seç. Açıklamalar `describeCard` tarafından ortak üretilir; her yüzeyde ayrı metin yazma. Yükseltme basılı etkiyi geliştirirken mekanik bayraklarını korur.

Kart yığını eklerken sahiplik, kalıcı silme, yükseltme, savaş sonu, yeni savaş ve yeni macera davranışlarını birlikte ele al. Yeni tetikleyiciler saf işlevde prototiplenmeli; ardından gerçek `resolveCard` / `resolveTurn` entegrasyon testi yazılmalı.

## Doğrulama

```sh
npm test -- src/mechanics src/components/MechanicStatus.test.tsx scripts/simulatePlaythrough.test.ts
npm test -- --coverage
npm run simulate
```

Deney çalıştırıcısı mevcut Vite üzerinden TypeScript'i yükler. Yalnızca eşzamanlı deney sırasında `Math.random` tohumlanır ve `finally` ile geri yüklenir. Üretim koduna açma/kapama ayarı veya bağımlılık eklenmedi.
