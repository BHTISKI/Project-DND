# project-dnd — Hata düzeltme sonuçları

Tarih: 4 Eylül 2026. Kapsam: ilk incelemede doğrulanan hatalar; mobil geliştirme hariç. Değişiklikler mevcut çalışma klasöründe; commit veya yayınlama yapılmadı.

## Sonuç

İlk rapordaki F01–F11 ve F13 düzeltildi. F12'nin masaüstünde içerik kesilmesi bölümü düzeltildi; mobil bölümü kullanıcının isteğiyle kapsam dışında bırakıldı. Yeni oyun özellikleri sonraki aşamaya ayrıldı.

| Bulgu | Yapılan düzeltme |
|---|---|
| F01 — Deste seçiminde kilitlenme | Seçim hem store hem arayüzde kalan üç seçimin tamamlanabilirliğine göre doğrulanıyor. Efsanevi + seçkin çıkışsız dizisi engelleniyor. |
| F02 — 0 canla devam | Kart, doğrudan hasar, düşman saldırısı, zehir, lanet ve kıyamet aynı sonuç kontrolünü kullanıyor. Eşzamanlı ölüm yenilgi sayılıyor. |
| F03 — Niyet/hasar uyuşmazlığı | Tur sonunda başka bir düşman kararı üretilmiyor. Oyuncu blok veya savuşturma oynadığında tepkisel niyet ekranda güncelleniyor. Normal/kritik hasar ve blok öncesi hesap açıkça gösteriliyor. Gizli 4→20 çarpanı kaldırıldı. |
| F04 — Bağlanmamış kurallar | D20, zırh, doğal 1/20, avantaj/dezavantaj tüketimi, Güçsüz/Güçlü/Savunmasız, zehir yükleri ve Tahkimli gerçek savaşta uygulanıyor. İçerikte kullanılmayan, uygulanmamış efekt türleri modelden çıkarıldı. |
| F05 — Blok | Savunma kartları toplanıyor; saldırı yalnızca emdiği bloğu tüketiyor. Tur sınırındaki temizleme ayrı uygulanıyor. |
| F06 — Kart/enerji/çekiş/yükseltme/denge | Üretilen enerji tur dolumunu aşabiliyor. Çekiş destesi bitince mezarlık karıştırılıyor; oynanmakta olan kart kendi etkisiyle çekilmiyor. Etkisiz yükseltme ve oynanamayan lanet yükseltmesi ücretlendirilmiyor. Tur atlatma kartlarının yükseltmesi enerji maliyetini azaltıyor. Tüketilen kırılmada denge sıfırlanıyor. |
| F07 — Ödüller | Öldüren etki ödülü değiştirmiyor. Normal, elit ve boss ödülleri ortak tablodan bir kez veriliyor. Boss için özel ödül yolu canlı savaşa bağlandı. |
| F08 — Mağaza | El, çekiş destesi ve mezarlık birlikte yönetiliyor. Yükseltme/silme/arınma bütün yığınlarda çalışıyor. Tam can şifası ve son kartın silinmesi engelleniyor. |
| F09 — Olaylar | Maliyet metni gerçek hesapla ortak. Kaldırılan kart kalıcı siliniyor; son kart korunuyor. Kehanet sonraki düşmana taşınıyor ve ilk oyuncu turu bedeli uygulanıyor. Olayda çekilen Kırık Ruh da bedelini uyguluyor. |
| F10 — Yeniden başlatma | Sağlık, maksimum enerji, geçici etkiler, denge, sayaçlar ve diyaloglar başlangıca dönüyor; isim ve meta istatistikleri korunuyor. |
| F11 — Kart açıklamaları | Savaş, seçim, ödül ve mağaza aynı açıklayıcıyı kullanıyor. Zar/aralık, güç katkısı, hedef, yük, süre, enerji, lanet bedeli ve efsanevi nadirliği doğru gösteriliyor. |
| F12 — Masaüstü | İçeriği kesen sabit savaşçı yüksekliği kaldırıldı. Kartlar okunabilir boyutta; kısa ekranda sayfa, çok kartta el kaydırılabiliyor. Güç/blok/zırh ve durumlar erişilebilir. Mobil değişiklik hedeflenmedi. |
| F13 — İnceleme/diyalog | Ayrı İncele düğmesi ve klavyeyle kullanılabilir ayrıntı penceresi var. Çift tıklama kart oynatmıyor. Diyaloglar yeni mesaj beklemeden 5 saniyede siliniyor, aynı taraftaki eski mesajı değiştiriyor ve yeni oyunda temizleniyor. |

Ek düzeltmeler: oyuncu can çubuğunun eksik rengi, koyu zeminde okunmayan tur düğmesi, günlük/tur sayacı çakışması, sürekli hareket eden kartın tıklama kararsızlığı, yanlış hedefe hasar animasyonu, tam candaki düşmanın fazla iyileşme önizlemesi ve Tahkimli savunma önizlemesi. İsim ekranındaki bozuk metinler ve HTML dili düzeltildi. Tohumlu RNG'nin yarım aralık ve sıfır tohum hataları giderildi; canlı oyuna tohum seçme özelliği eklenmedi.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| Üretim derlemesi | Başarılı: TypeScript + Vite |
| Lint | 0 hata, 0 uyarı |
| Otomatik test | **240/240 başarılı**, 21 dosya |
| Yeni regresyon testleri | 73 senaryo; mevcut 167 test de onarıldı |
| Kart kataloğu | 31 kart ayrı ayrı çalıştırıldı; geçersiz sayı, yinelenen kart ve hatalı oynanabilirlik denetlendi |
| Satır kapsamı | **%83,08** |
| Koşul dalı kapsamı | **%79,45** |
| Savaş motoru satır kapsamı | %93,71 |
| Store satır kapsamı | %89,92 |
| Masaüstü tarayıcı | 1440×1000 ve 1366×768 |
| Konsol | Denenen üretim akışında 0 hata / 0 uyarı |

Başlangıç ölçümü 155/167 başarılı test, %61,69 satır ve %56,74 dal kapsamıydı. Dosyalar ayrıldığı için kapsam artışı tek başına doğruluk garantisi değildir; raporlanan hatalara özel sonuç kontrolleri de eklendi.

Çalıştırılan komutlar:

```sh
npm run build
npm run lint
npm run test -- --coverage --reporter=json --outputFile=docs/review-2026-09-04/fix-tests.json --coverage.reportsDirectory=docs/review-2026-09-04/fix-coverage --silent
```

### Üretim sürümünde gerçek arayüz akışı

- İsim → harita → üç kart seçimi → savaş.
- Çift tıklayarak inceleme öncesi/sonrası enerji: **3/3 → 3/3**; kart elde kaldı.
- Normal kart oynayarak zafer → 3 ödül seçeneği → mağaza.
- Mağaza bütün kartları gösterdi: ödül sonrası **11**, satın alma sonrası **12**.
- Tam canda, yeterli altına rağmen şifa düğmesi kapalıydı.
- Ödül mağazasından çıkış: **Bölüm 2** olarak kaldı; dinlenme durağından çıkış: **Bölüm 3**.
- Sonraki savaşa yeniden başlangıç kart seçimi açılmadan girildi.
- Tur bitirerek yenilgi → Yeni Oyun Başlat → **Bölüm 1**, eski diyalog sayısı **0**.
- Masaüstü panellerinde güç/blok/zırh alanları panel sınırları içinde; sayfanın yatay taşması yok. 1366×768'de dikey kaydırma ile bütün kart bilgilerine erişiliyor.

Zehir, kıyamet, lanet, boss/elit ödülü ve kehanet gibi uç durumlar kontrollü otomatik durum testleriyle doğrulandı. Bu çalışma uzun süreli denge testi veya tüm olası maceraların tarayıcıda oynanması değildir.

Kanıtlar: [test sonuçları](review-2026-09-04/fix-tests.json), [kapsam raporu](review-2026-09-04/fix-coverage/index.html), [masaüstü 1440](review-2026-09-04/desktop-fixed.png), [masaüstü 1366](review-2026-09-04/desktop-fixed-1366.png), [özet ölçümler](review-2026-09-04/fix-evidence.json).

## Sonraki geliştirme için temel

Savaş çözümleme, kart yığınları, durum etkileri, ödüller ve seçim doğrulaması ayrı ortak modüllere taşındı. Harita ve boss kart tanımlarındaki farklı kaynaklar birleştirildi. Resolver'ların store'a müdahale eden diyalog zamanlayıcıları kaldırıldı. README mevcut kuralları anlatıyor. GitHub Actions için build/lint/test iş akışı eklendi; uzak CI henüz çalıştırılmadı.

Bu pakette mobil düzen, kayıt/devam et, öğretici, sınıf, relik, yeni kart/olay, sonlu macera ve final boss tasarımı eklenmedi. Başlangıç canı/enerjisi gibi genel denge değerleri için yeni içerik aşamasında ayrıca oyun testi yapılabilir.
