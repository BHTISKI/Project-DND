# Mekanik playtest kaydı — 4 Eylül 2026

Elde tutma, tükenme ve bitirici oyuna bağlandı. Otomatik testler ve masaüstü tarayıcı denemeleri geçti. İnsan oyuncularla eğlence değerlendirmesi yapılmadı; aşağıdaki sayılar böyle bir sonucu kanıtlamaz.

## Deney protokolü

`npm run simulate` ile her koşulda **100 savaş** çalıştırıldı. Beş düşman türü, iki seviye (0 ve 3), her tür/seviye için on farklı tohum vardır. Tohumlar 20260904–20261003; aynı on kart, ilk beş kartlık el, oyuncuda 10 can / 3 enerji kullanılır. En fazla 30 tur / 300 karar adımı; sınırı aşan senaryo ayrı `timeout` sayılır. Tam macera, boss ve mağaza ekonomisi bu deneyde yoktur.

Baseline, **aynı motor ve kartların `retain`, `exhaust`, `finisher` alanları kapalı** karşılaştırmasıdır; önceki commit arşivinin sonucu değildir. Böylece yeni kartların farklı temel etkilerinden kaynaklanan karışıklık azaltılır. Çekiş/isabet ile bot seçimi için ayrı tohumlu rastgele üreticiler kullanılır. Yasal kartlardan rastgele seçim yapan basit bot, savunmayı elde tutabiliyorsa saldırı beklemediği turlarda bazen saklar; bitiriciyi en iyi şekilde kullanmayı bilmez. Mekanikler rastgele sayı tüketimini değiştirebilir; eşleştirme birebir aynı zar dizisinin aynı hamleye denk geleceğini garanti etmez.

## Sonuçlar

| Ölçüm | Baseline | Mekanikler açık | Fark |
|---|---:|---:|---:|
| Kazanılan savaş | 85/100 | 79/100 | -6 yüzde puan |
| Yenilgi | 15 | 21 | +6 |
| Zaman aşımı | 0 | 0 | 0 |
| Ortalama tur | 3,34 | 3,61 | +0,27 |
| Ortalama oynanan kart | 10,61 | 10,45 | -0,16 |
| Ortalama karar noktası | 11,56 | 11,43 | -0,13 |
| Ortalama yasal seçenek | 4,509 | 4,560 | +0,051 |
| Ortalama ziyaret edilen farklı durum | 13,10 | 13,27 | +0,17 |
| Elde tutulan kart-tur | 0 | 145 | +145 |
| Tükenen kart kullanımı | 0 | 75 | +75 |
| Bitirici etkinleşmesi | 0 | 33 | +33 |

Karar noktası: en az bir kartın oynanabildiği adım. Yasal seçenek sayısı tur bitirmeyi de içerir. Farklı durum sayısı yalnızca botun ziyaret ettiği durumların özetidir; karar derinliğini veya anlamlı seçenek sayısını ölçmez. Elde tutulan kart-tur, aynı kart birden fazla tur saklanırsa her seferinde sayılır. Bitirici etkinleşmesi isabet garantisi değildir.

Kazanma farkı planın ±10 yüzde puanlık inceleme eşiği içinde kaldı; bu nedenle değerler değiştirilmedi. Bu küçük, tek botlu örneklem genel denge güvencesi vermez. Özellikle tükenme, baseline'da tekrar kullanılabilen ücretsiz enerjiye sınırlama getirir; kazanma oranının tek başına artması tasarım hedefi değildir. İnsan denemesinde "kartı saklamak anlamlı mı?", "tükenmenin bedeli anlaşılır mı?", "bitirici için sıralama seçmek keyifli mi?" soruları sorulmalı.

Ham sonuçlar: [baseline](baseline-results.json), [mekanikler açık](mechanics-results.json). Sabit tasarım hipotezi puanları: elde tutma 88, tükenme 86, bitirici 88; simülasyondan türetilmedi.

## Tarayıcı kontrolü

1366×768 masaüstü, yerel Vite sunucusu, gerçek React/Zustand bileşenleri:

1. İsim girişi → harita → ilk deste seçimi normal akışla tamamlandı. Zincir Darbesi ve Son Kıvılcım doğal seçim havuzunda görüldü ve seçildi.
2. Son Kıvılcım'ın **İncele** penceresi açıldı, Escape ile kapatıldı. Klavyeyle oynanınca enerji 3'ten 4'e çıktı; kart elden kalkıp tükenenler listesine girdi.
3. Sonraki mekanik kontrollerinde tekrar üretilebilir, açıkça hazırlanmış durum kullanıldı: düşman 100 can, elde Sabırlı Muhafız ve sıradan kart, çekişte dört bilinen kart. Bu bir doğal oyun dengesi denemesi değildir.
4. Gerçek **Turu Bitir** düğmesi kullanıldı; Sabırlı Muhafız elde kaldı ve dört yeni kartla el beşe tamamlandı.
5. Son Kıvılcım → Sabırlı Muhafız sırası ardından Zincir Darbesi üzerinde **Bitirici hazır · +3 hasar** göründü. Kart oynanınca kombo 2, günlükte +3 bitirici ve gerçek saldırı sonucu oluştu.
6. Savaş sonu kontrolü için test durumunda düşmana doğrudan ölümcül hasar uygulandı. Haritaya geçildi, üç ödül üretildi; Son Kıvılcım tam bir kez mezarlığa döndü ve tükenme yığını boşaldı.
7. Yatay sayfa taşması yok. Kart metinleri ve inceleme penceresi okunabilir. Tarayıcı konsolunda hata/uyarı yok. [Ekran görüntüsü](mechanics-desktop.png).

## Kod doğrulaması

- 26 test dosyasında **268/268 başarılı**. Önceki 240 teste ek olarak 28 senaryo/katalog örneği.
- Prototip testleri eksik modül hatasıyla, entegrasyon testleri eksik kartlarla önce başarısız oldu; uygulama sonrasında geçti.
- Savaş sonu/yeniden başlatma, kart koruma, kalıcı silme/yükseltme, lanetlerin tutulamaması, enerji, bitirici eşiği, ıskalama, çoklu vuruş ve arayüz güncellemesi doğrulandı.
- Rastgele çağrı sayısına bağlı eski düşman saldırısı testi, açık niyet ve sabit zarla katalog büyüklüğünden bağımsız hale getirildi.
- Yeni mekanik kaynakları ve `MechanicStatus` için satır, ifade, işlev ve dal kapsamı ayrı ayrı en az %80 kontrolünden geçti. [Doğrulama verisi](mechanics-validation.json).
- Üretim derlemesi başarılı; lint tanısı 0. React kontrolünde yeni durumlar saf hesaplandı, Zustand seçimleri kararlı tutuldu; ek dinleyici veya bağımlılık eklenmedi.

Mobil geliştirme yapılmadı. İnsan playtesti, tam macera dengesi ve yeni içerik çeşitlendirmesi sonraki iterasyonda ele alınabilir.
