# D&D Oyunu

Bu proje, tavsiye rolü oyununa (TRO) ispirasyon almış tek oynanışlı bir kart oyunudur. Oyuncu, farklı yeteneklere sahip kartları kullanarak rastgele oluşturulan düşmanlarla savaşır.

## Oyun Nasıl Oynanır?

1. Oyunu başlattığınızda, başlangıç desteği hazırlanır ve 5 kart çekersiniz.
2. Her turun başında, 3 enerji verirsiniz (maksimum enerji).
3. Elinizdeki kartları oynayarak düşmana hasar verebilir, kendinizi iyileştirebilir, blok kazandırabilir veya özel efektler uygulayabilirsiniz.
4. Kartları oynadıktan sonra enerjinizi harcarlı ve kullanılan kartlar discarde (mezarlık) gider.
5. Turunuzu bitirdiğinizde (`End Turn` butonu), düşman hareket eder ve sizi saldırıya çalışır.
6. Düşmanı yendiğinizde, zafer kazanır ve 3 ödül kartından birini destenize ekleyebilir veya pas geçebilirsiniz. Mağazada altın ile can yenileyebilir veya kartlar desteden çıkarabilirsiniz.
7. Mağazadan sonra, sonraki savaşa geçiş yaparsınız. Düşmanın gücü kazanmış zafer sayınıza göre artar.
8. Oyun, canınız 0'a düştüğünde biter. "Yeni Oyun Başlat" butonu ile tekrar başlayabilirsiniz.

## Kart Tipleri

- **Saldırı**: Düşmana hasar verir. Kritik vuruş ve başarısızlık kuralları uygulanır.
- **Savunma**: Blok kazanarak gelen hasarı azaltır.
- **Yetenek**: Hasar, iyileşme, kart çekme, enerji kazanma, durum etkisi (zehir, güçsüz, güçlü, vb.) veya düşmanı tur atlatma gibi özel efektler sağlar.

## Durum Etkileri

- **Zehirli**: Her tur başı hasar verir.
- **Güçsüz**: Saldırı hasarını azaltır.
- **Güçlü**: Saldırı hasarını artırır.
- **Zayıflatıcı**: Sıradaki saldırıyı kaçırır (blok)
- **Fortifiye**: Blok verir

## Teknik Detaylar

- React ve TypeScript kullanılarak geliştirilmiştir.
- State yönetimi için Zustand kullanılmıştır.
- Kart etkileri effect tabanlı bir sistemle çözülür, bu da yeni kart eklemeyi ve mevcut etkileri değiştirmeyi kolaylaştırır.

## Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Üretim derlemesi
npm run build
```
