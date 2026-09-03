# Kart mekaniği araştırması — 4 Eylül 2026

Beş birincil tasarım/kural yazısı incelendi. Aşağıdakiler kendi özetlerimizdir; kaynaklardaki oyun kurallarının birebir aktarımı değil, project-dnd için uyarlama önerileridir. Puanlar oyuncu araştırması sonucu değildir.

## Değerlendirme

`funScore` 0–5 arası beş açık tasarım yargısını 100'e ölçekler: karar derinliği %30, oyuncu kontrolü %30, kombo potansiyeli %20, kontrollü değişkenlik %10, anlaşılabilirlik %10. 0 yok/belirsiz, 3 belirgin fakat sınırlı, 5 güçlü ve açık demektir. Eksik değer sıfırdır. Açıklama uzunluğu puana katılmaz. Bir testin geçmesi, mekanik eğlencelidir anlamına gelmez.

Tablodaki değer sırası: derinlik / kontrol / kombo / değişkenlik / açıklık. Bu proje için maliyet ve anlaşılabilirlik değerlendirmeleri bize aittir.

| Aday | Projeye uyarlama ve karar | Değerler | Puan | Kaynak |
|---|---|---|---:|---|
| Elde tut | Savunmayı şimdi harca veya sonraki ele sakla; saklanan kart çekiş yerini kullanır. **Seçildi:** yeni seçim penceresi gerektirmeden zamanlama kararı ekler. | 5/5/3/3/5 | 88 | [Kaldheim: Foretell](https://magic.wizards.com/en/news/feature/kaldheim-mechanics-2021-01-07) |
| Tükenir | Ücretsiz enerji kartını bir savaşta bir kez kullan; maceradan kalıcı silme. **Seçildi:** kısa vadeli güç ile sonraki turlar arasında bedel oluşturur. | 5/4/5/2/4 | 86 | [Modern Horizons 3: Evoke](https://magic.wizards.com/en/news/feature/modern-horizons-3-mechanics) |
| Bitirici | Aynı tur iki tür geçişinden sonra ilk saldırıya +3; kartın kendisi de geçiş sayılır. **Seçildi:** mevcut kombo sayacını görünür bir hedefe bağlar. | 5/5/5/1/3 | 88 | [Foundations: Prowess](https://magic.wizards.com/en/news/feature/foundations-mechanics) |
| Kehanetle çekiş düzenleme | Üstteki kartları görüp mezarlığa veya deste üstüne yerleştir; yeni seçim arayüzü gerektirir. | 4/5/3/4/3 | 80 | [Guilds of Ravnica: Surveil](https://magic.wizards.com/en/news/feature/guilds-ravnica-mechanics-2018-09-04) |
| Kart çevirme | Eldeki kartı bedel karşılığı başka kartla değiştir; lanet ve hedef seçimi kuralları ayrıca gerekir. | 4/4/3/4/4 | 76 | [Ikoria: Cycling](https://magic.wizards.com/en/news/feature/ikoria-lair-behemoths-mechanics-2020-04-02) |
| Mezarlıktan ikinci kullanım | Ek bedelle mezarlıktan oyna; ayrı hedef seçimi ve tekrar sınırı gerektirir. | 4/4/4/3/2 | 74 | [Foundations: Flashback](https://magic.wizards.com/en/news/feature/foundations-mechanics) |
| Mezarlık eşiği | Mezarlıkta yeterli kart varsa güçlen; otomatik karıştırma eşiği hemen bozabilir. | 3/3/4/3/4 | 66 | [Foundations: Threshold](https://magic.wizards.com/en/news/feature/foundations-mechanics) |
| Ek enerjiyle güçlendirme | Kartı daha pahalı ama güçlü oyna; mevcut tek tıklama akışına ikinci bedel seçimi ekler. | 4/5/2/2/3 | 72 | [Modern Horizons 3: Kicker](https://magic.wizards.com/en/news/feature/modern-horizons-3-mechanics) |
| Çift mod | Saldırı/savunma seçeneklerinden birini seç; her karta ek karar yükler. | 4/5/2/2/2 | 70 | [Modern Horizons 3: Entwine](https://magic.wizards.com/en/news/feature/modern-horizons-3-mechanics) |
| Saldırı sonrası ödül | Saldırdıktan sonra turda bir kez ek yarar; bitirici ile aynı tasarım alanını paylaşır. | 3/4/4/2/4 | 70 | [Kaldheim: Boast](https://magic.wizards.com/en/news/feature/kaldheim-mechanics-2021-01-07) |

**Uyarlama sınırı:** Foretell kaynakta elde tutma değildir; ileriki tura hazırlık fikrinden hareketle elde tutma tasarlandı. Evoke savaşlık tükenme değildir; düşük bedelle geçici güç fikrinden hareketle tükenme tasarlandı. Prowess tür değişimi saymaz; oynama sırasına bağlı güç fikri mevcut kombo sistemine uyarlandı. Bu farklılıklar kaynaklara atfedilmemelidir.

## Uygulama kararı

Üç en yüksek puanlı aday yeni, bağımsız yardımcı işlevlerle prototiplendi ve gerçek çözücüye bağlandı. Bunları oyuna ekleme kararı kullanıcının bu planı uygulama isteği kapsamında alındı; insan oyuncuların eğlence onayı henüz yoktur. Yeni kartlar mevcut başlangıç havuzu, ilk deste seçimi ve savaş ödüllerinden elde edilir. Sabit mağaza teklifleri değişmedi.

## Plandan yapılan düzeltmeler

- Metin uzunluğu yerine açık tasarım ölçütleri kullanıldı.
- `mechanic1/2/3` yerine `retain/exhaust/finisher` adları kullanıldı.
- Projede bulunmayan `ts-node` eklenmedi; mevcut Vite ile TypeScript simülasyonu çalıştırıldı.
- Sonsuz haritalı oyunda "100 tamamlanmış oyun" yerine 100 eşleştirilmiş, sınırlı savaş senaryosu kullanıldı. Tam kampanya dengesi çıkarımı yapılmaz.
- Baseline aynı kartların yeni anahtar sözcükleri kapalı kontrollü karşılaştırmasıdır; eski commitin simülasyonu değildir.
- Taslakta adı geçen `subagent-driven-development` becerisi kurulu olmadığından görevler yerel olarak uygulandı.
- `README.json` yazım hatası `README.md` olarak düzeltildi. Mobil geliştirme kapsam dışında tutuldu.
