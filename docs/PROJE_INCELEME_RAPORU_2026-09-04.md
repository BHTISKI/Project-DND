# project-dnd — Proje incelemesi ve geliştirme raporu

> Bu belge düzeltme öncesi incelemeyi arşivler; kaynak satır numaraları o sürüme aittir. Sonraki düzeltmeler ve güncel test sonuçları: [Hata düzeltme raporu](HATA_DUZELTME_RAPORU_2026-09-04.md). Mobil geliştirme kullanıcı isteğiyle kapsam dışında bırakılmıştır.

**Tarih:** 4 Eylül 2026  
**İncelenen sürüm:** `a681cae` tabanındaki mevcut çalışma klasörü; önceden yapılmış, commit edilmemiş değişiklikler dahil.  
**Kapsam:** mimari, oyun kuralları, ilerleme, kart ve düşman içeriği, arayüz, mobil kullanım, testler, derleme, bağımlılık taraması ve bakım kolaylığı.  
**Bu çalışmada üretim kodu değiştirilmedi.** Rapor, ölçüm dosyaları ve ekran görüntüleri üretildi.

## 1. Genel değerlendirme

Proje, oynanabilir bir kart oyunu prototipi için anlamlı bir temel oluşturuyor: karakter adı, başlangıç kart seçimi, savaş, harita seçimi, mağaza, olay, dinlenme, düşman davranışları, lanetler ve kombo sistemi bulunuyor. React + TypeScript + Zustand bu ölçekte yeterli; mevcut ihtiyacı karşılamak için oyun motoru veya framework değişimi gerekmiyor.

**En büyük eksik içerik sayısı değil, mevcut kuralların birbirleriyle tutarlı çalışması.** Bazı mekanikler veri modelinde, arayüzde ve testlerde var, fakat gerçek savaş döngüsüne bağlanmamış. Bu nedenle oyuncu doğru karar vermek için gerekli bilgiye her zaman güvenemiyor. Bazı seçimler oyunu kilitliyor; bazı ölüm ve ödül yolları farklı davranıyor.

Geliştirme sırası önerim: **kritik akış hataları → ortak savaş/ödül kuralları → anlaşılır ve mobilde kullanılabilir arayüz → kayıt ve tamamlanabilir macera → içerik çeşitliliği.**

## 2. Doğrulama sonuçları

| Kontrol | Sonuç | Yorumu |
|---|---|---|
| Üretim derlemesi | Başarılı | TypeScript ve Vite derlemesi çalışıyor. |
| Mevcut testler | 167 test: 155 başarılı, 12 başarısız | 19 test dosyasının 4'ünde hata var. İki çalıştırmada toplam sonuç aynı. |
| Lint | Çıkış kodu 0; 2 uyarı | Boss kodunda `return` sonrasında erişilemeyen işlemler var. |
| Satır kapsamı | %61,69 | Başarısız testler dahil ölçüm; kalite puanı olarak yorumlanmamalı. |
| Koşul dalı kapsamı | %56,74 | Kritik durum birleşimleri eksik. |
| `store.ts` kapsamı | Satır %56,91; dal %43,61 | Oyunun asıl iş mantığında önemli boşluk var. |
| `AppSections.tsx` kapsamı | %0 satır | Harita, başlangıç seçimi, ödüller ve olay/dinlenme arayüzleri mevcut koşuda çalıştırılmamış. |
| npm bağımlılık taraması | 0 bilinen açık | Tarama anındaki npm danışma veritabanı sonucu; uygulamanın bütün güvenliğini kanıtlamaz. |
| JS çıktı boyutu | 262,87 kB; gzip 79,37 kB | Bu boyut tek başına performans sorunu göstermiyor. |
| CSS çıktı boyutu | 38,73 kB; gzip 8,81 kB | Öncelik dosya boyutundan çok CSS kurallarının tutarlılığı. |
| Tarayıcı kontrolü | 1440×1000 ve 390×844 | Mobilde kritik içerik kesiliyor; masaüstünde de bazı istatistikler kesiliyor. |
| Tarayıcı konsolu | İncelenen akışta hata/uyarı yok | Mantık hataları konsol hatası üretmeden gerçekleşiyor. |

İsim girişi, harita, üç kart seçimi, savaş başlangıcı, tur bitirme, ölüm, yeniden başlatma, mağaza ve sayfa yenileme tarayıcıda kontrol edildi. Olay, boss ödülü ve uç durumlar ayrıca kontrollü Zustand durumlarıyla doğrulandı. Bunlar doğal bir maceranın tamamını bitiren uçtan uca test olarak sunulmuyor. Mobil kontrol masaüstü tarayıcıda viewport değişimiyle yapıldı; gerçek iOS/Android dokunmatik testi yapılmadı.

Ölçümler: [test sonuçları](C:/Users/selim/project-dnd/docs/review-2026-09-04/tests.json), [kapsam sonuçları](C:/Users/selim/project-dnd/docs/review-2026-09-04/coverage/coverage-summary.json), [davranış kanıtları](C:/Users/selim/project-dnd/docs/review-2026-09-04/evidence.json), [kontrollü kontrol fonksiyonu](C:/Users/selim/project-dnd/docs/review-2026-09-04/probes.js).

## 3. Öncelikli, doğrulanmış sorunlar

P0: ilerlemeyi durduran hata. P1: temel kuralı veya oyuncu kararını bozan hata. P2: bakım, sunum veya sonraki geliştirmeyi etkileyen eksik.

### F01 — P0: Başlangıç kart seçimi çıkışsız kalabiliyor

6 yük bütçesinde efsanevi kartın ağırlığı 4, seçkin kartın ağırlığı 2. Bu iki seçimin ardından bütçe 0 ve seçim sayısı 2/3 oluyor. Kalan sıradan kartların tamamı devre dışı kalıyor. Geri alma veya iki kartla devam etme seçeneği yok.

**Yeniden üretim:** Efsanevi + seçkin + üç sıradan kart bulunan geçerli seçim havuzunda önce efsanevi, sonra seçkin kartı seç. Kontrollü doğrulamada oyun `deckBuild` aşamasında kaldı.

**Öneri:** Her seçimden önce kalan seçimlerin tamamlanabilirliğini kontrol et; seçim geri alma ekle. Kabul ölçütü: üretilen her havuz ve izin verilen her seçim dizisi tamamlanabilmeli.

Kaynak: [chooseDraftCard](C:/Users/selim/project-dnd/src/state/store.ts:1280), [DeckBuild](C:/Users/selim/project-dnd/src/components/AppSections.tsx:30).

### F02 — P1: 0 can her hasar yolunda oyunu bitirmiyor

Ölüm kontrolü düşmanın normal saldırı kolunda yapılıyor. Oyuncunun zehir tikinden ölmesi sonrasında aynı kontrol yok. Lanet hasarıyla ölüm ve düşmanın tur atlaması birleşiminde de savaş devam ediyor.

**Doğrulama:** 1 canlı oyuncuya 2 zehir hasarı verildi: can 0, aşama hâlâ `combat`. Körlük Mührü + düşmanın tur atlaması senaryosu da aynı sonucu verdi.

**Öneri:** Her hasar çözümünden sonra çalışan tek sonuç kontrolü oluştur. Aynı turda iki tarafın ölmesi için açık bir kural belirle. 0 canlı karakterle kart oynama mümkün olmamalı.

Kaynak: [endTurn](C:/Users/selim/project-dnd/src/state/store.ts:370), [playerTick sonrası](C:/Users/selim/project-dnd/src/state/store.ts:584).

### F03 — P1: Düşmanın gösterdiği hasarla yaptığı hamle uyuşmuyor

İlk Goblin karşılaşmasında arayüz 4 hasar gösteriyor. Oyuncu blok almadan turu bitirdiğinde karar yeniden hesaplanıyor; `critical-execution` için 10 hasar seçilip ayrıca ikiyle çarpılıyor. Sonuç 20 hasar ve 10 canlı başlangıç karakterinin anında ölmesi.

Bu, tarayıcıda normal akışla doğrulandı. Tepkisel düşman davranışı tasarım tercihi olabilir; sorun, oyuncunun karar sırasında göremediği 4→20 değişimi.

**Öneri:** Niyetin hangi koşullarda değişebileceğini görünür kıl; koşul gerçekleştiğinde göstergeyi güncelle. Gösterilen ve çözülen hamle aynı karar verisini kullanmalı. Başlangıçtaki cezanın büyüklüğü ayrıca dengelenmeli.

Kaynak: [enemyBehavior](C:/Users/selim/project-dnd/src/engine/enemyBehavior.ts:47), [kararın yeniden hesaplanması](C:/Users/selim/project-dnd/src/state/store.ts:410), [kritik çarpan](C:/Users/selim/project-dnd/src/state/store.ts:482).

### F04 — P1: Zırh, avantaj ve bazı durum etkileri gerçek savaşa bağlı değil

`resolveAttackRoll` ve d20 yardımcısı mevcut, fakat gerçek kart saldırısı bunları kullanmıyor. `attack` ve `damage` aynı kola giriyor; zırh sınıfı ve `ignoresArmor` ayrımı uygulanmıyor. Oyuncunun `weakened` durumu saldırısını azaltmıyor. `fortified` için blok üreten bir tüketici yok.

**Doğrulama:** Sabit rastgelelikle aynı saldırı; normal durumda, 50 değerli güçsüzlük altında, avantajla ve düşman zırhı 1000 iken aynı 5 hasarı verdi. 10 değerli tahkimli durumda normal 4 hasar tamamen alındı.

Bazı durumlarda `stacks` gösterilmesine rağmen savaş hesabı yalnızca `value` kullanıyor. Tipteki exhaust/retain/ethereal/duplicate/xAttack gibi etkiler de çözümlenmiyor; bunlar mevcut içerikten ziyade gelecekteki kartlar için sessiz hata riski.

**Öneri:** Önce hedef savaş kurallarını kısa bir şartnameye bağla. Ardından her efekt için eksiksiz çözümleme ve desteklenmeyen türlerde açık hata sağlayan tek motor kullan. D20 sisteminden vazgeçilecekse kart metinleri, tipler ve testler de bunu yansıtmalı.

Kaynak: [kart efekt döngüsü](C:/Users/selim/project-dnd/src/state/store.ts:732), [savaş matematiği](C:/Users/selim/project-dnd/src/engine/combatMath.ts:12), [efekt tipleri](C:/Users/selim/project-dnd/src/types/game.ts:21).

### F05 — P1: Blok toplama ve tüketme hatalı

İkinci savunma kartı mevcut bloğa ekleme yapmak yerine bloğu değiştiriyor. Kontrollü örnekte 5 blok üzerine 4 blok kartı oynandığında sonuç 9 yerine 4 oldu. Düşmanın 10 bloğuna 5 hasar vurulduğunda da kalan blok 5 yerine 0 oldu.

**Öneri:** Blok kazanımı, bloktan emilim ve tur sonunda silinmeyi ayrı işlemler yap. Birden fazla saldırı/savunma için aynı hesaplamayı kullan.

Kaynak: [düşman bloğu](C:/Users/selim/project-dnd/src/state/store.ts:738), [blok kazanımı](C:/Users/selim/project-dnd/src/state/store.ts:755).

### F06 — P1: Bazı kartlar çalışmıyor veya yanlış sonuç bildiriyor

- **Yıldırımın Çarpması:** 4 enerji istiyor; başlangıç üst sınırı 3 ve mevcut akışta bu sınırı artıran bir mekanik yok. Enerji kartları da 3'e kırpılıyor. Kart mevcut kurallarla oynanamıyor.
- **Kart çekme:** Kart efektiyle çekişte deste boşsa mezarlık karıştırılmıyor. Kontrollü durumda elde 0 kart kalırken günlük “1 kart çekildi” yazdı.
- **Geliştirmeler:** Etkisi değişmeyen kartlar da yükseltilmiş işaretlenip ücretlendirilebiliyor; örneğin yalnızca tur atlatan kartın `skip` efekti aynı kalıyor.
- **Denge:** Kırılma tüketildikten sonra denge sıfırlanmıyor. Eşik dolu kaldığından sonraki darbeler tekrar kırılma üretebiliyor; yeni savaşa geçişte oyuncunun denge/kırılma durumu da açıkça sıfırlanmıyor. İstenen kuralın tanımlanması gerekiyor.

**Öneri:** Bütün kartlar için oynanabilirlik, açıklama ve yükseltme doğrulaması; ortak kart çekme işlemi; tanımlı kırılma yaşam döngüsü.

Kaynak: [çekiş ve enerji](C:/Users/selim/project-dnd/src/state/store.ts:771), [kart kataloğu](C:/Users/selim/project-dnd/src/types/game.ts:133), [yükseltme](C:/Users/selim/project-dnd/src/utils/game.ts:21), [denge](C:/Users/selim/project-dnd/src/state/store.ts:742).

### F07 — P1: Ölüm şekline ve karşılaşma türüne göre ödüller tutarsız

Doğrudan kartla öldürmede altın veriliyor; zehirle öldürmede zafer sayılıyor ama normal altın ödülü eklenmiyor. Kontrollü zehir zaferinde 50 altın 50 kaldı.

Boss için özel ödül fonksiyonu var fakat gerçek savaş akışından çağrılmıyor. Boss olarak işaretlenmiş karşılaşmanın kartla bitirilmesinde 20 altın ve 3 kart seçeneği geldi; ayrı boss fonksiyonu başlangıçta 50 altın ve 4 seçenek öngörüyor. Seçkin düşman ödül bonusu yardımcısı da canlı akışa bağlı değil.

**Öneri:** Öldüren efekt bağımsız tek `finishEncounter` işlemi; normal/seçkin/boss ödül tablosu; ödülün yalnızca bir kez verilmesi.

Kaynak: [zehir zaferi](C:/Users/selim/project-dnd/src/state/store.ts:589), [kart zaferi](C:/Users/selim/project-dnd/src/state/store.ts:852), [boss ödülü](C:/Users/selim/project-dnd/src/engine/bossResolver.ts:51), [seçkin bonusu](C:/Users/selim/project-dnd/src/engine/runMap.ts:156).

### F08 — P1: Mağaza oyuncunun bütün destesini yönetmiyor

`deck` alanı kalıcı koleksiyon yerine çekiş yığınını temsil ediyor. Mağaza yükseltme ve silmede yalnızca bu alanı gösteriyor; eldeki ve mezarlıktaki kartlar dışarıda kalıyor.

**Tarayıcı kanıtı:** Yeni oyunda toplam 7 kart varken mağazada “Desten: 2 kart” görüldü. Savaş sonrası yönetilebilir kartlar, savaşın hangi elde bittiğine bağlı değişiyor.

**Öneri:** Maceranın kalıcı destesini savaşın çekiş/elde/mezarlık/tükenen yığınlarından ayır. Mağaza ve dinlenme kalıcı deste üzerinde işlem yapmalı. Tam canla şifa satın alımında gereksiz ücret kesilmesi de önlenmeli.

Kaynak: [ShopPanel](C:/Users/selim/project-dnd/src/components/ShopPanel.tsx:11), [kart silme](C:/Users/selim/project-dnd/src/state/store.ts:1017).

### F09 — P1: Olayların metni, bedeli ve kalıcı etkisi uyuşmuyor

“Zayıflatıcı kehanet” mevcut düşmana durum ekliyor; sonraki savaş başlatılırken düşman durumları temizleniyor. Olayın vaat ettiği yarar yeni düşmana ulaşmıyor. Kayıtta sözü edilen oyuncu tur atlama cezası da uygulanmıyor.

“Kanlı pazarlık” ekranda 10 altın yazarken kod en az 10 veya altının %10'unu alıyor. 200 altınla yapılan kontrolde 20 altın kesildi. Kart değişimi olayı “kaldır” derken kartı mezarlığa koyuyor; sonraki savaşta bütün yığınlar yeniden birleşiyor.

**Öneri:** Olay seçeneklerinin metni ve sonucu aynı veri tanımından üretilmeli. Sonraki karşılaşmaya taşınacak etki ayrı tutulmalı. Yetersiz altın veya tam can gibi durumlar seçimden önce anlaşılmalı.

Kaynak: [PhaseChoices](C:/Users/selim/project-dnd/src/components/AppSections.tsx:47), [EventResolver](C:/Users/selim/project-dnd/src/engine/eventResolver.ts:15), [karşılaşma sıfırlaması](C:/Users/selim/project-dnd/src/state/store.ts:1219).

### F10 — P1: Yeni oyun önceki maceranın enerji sınırını taşıyabiliyor

Kırık Ruh maksimum enerjiyi düşürüyor. Yeniden başlatma, `initializeGame` içinde mevcut `maxEnergy` değerini kullanıyor ve bu değeri 3'e sıfırlamıyor. Kontrollü durumda yeni oyuna 1 maksimum enerjiyle başlandı.

**Öneri:** Yeni macera için bütün geçici alanları üreten tek başlangıç fonksiyonu oluştur. Meta ilerleme, isim tercihi ve macera durumu açıkça ayrı tutulmalı.

Kaynak: [initializeGame](C:/Users/selim/project-dnd/src/state/store.ts:282), [restartGame](C:/Users/selim/project-dnd/src/state/store.ts:337).

### F11 — P1: Kart açıklamaları karar vermeye yetmiyor ve yer yer yanlış

Başlangıç seçimi ve ödül ekranları çoğunlukla yalnızca “1/2 özel etki” diyor. Oyuncu sonuçlarını bilmeden deste kuruyor. Savaş kartında hasar hesabı zar ve güç katkısını içermiyor; Ateş Topu 2 hasar olarak görünebiliyor. Zar tabanlı blok/iyileşme açıklamaları sabit 4 gösteriliyor. Avantaj/dezavantaj gibi tanınmayan efektler varsayılan olarak “Düşmanın turunu atlat” metnine dönüşüyor. Efsanevi kart savaş görünümünde “Sıradan” etiketleniyor.

**Öneri:** Deste seçimi, ödül, mağaza ve savaş için ortak kart açıklayıcı kullan. Maliyet, hedef, zar/aralık, süre, yük ve lanet bedeli görünür olmalı. Anlık hasar önizlemesi motorun hesaplamasıyla uyumlu olmalı.

Kaynak: [formatEffect](C:/Users/selim/project-dnd/src/components/Card.tsx:19), [hasar gösterimi](C:/Users/selim/project-dnd/src/components/Card.tsx:50), [RewardCards](C:/Users/selim/project-dnd/src/components/AppSections.tsx:10).

### F12 — P1: Mobilde temel oyun bilgileri kesiliyor

390×844 görünümünde beş kart tek sıraya zorlanıyor; her biri yaklaşık 70×150 px. Görsel alan kartı dolduruyor, isim ve etki metinleri kesiliyor. Düşman niyeti sağ kenardan taşıyor; oyuncu enerji ve istatistik alanlarının bir bölümü panelin dışında kalıyor.

Masaüstü 1440×1000 görünümünde de sabit savaşçı yüksekliği bazı istatistikleri kesiyor. Sayfanın `scrollWidth` değerinin viewport kadar olması sorunu gizliyor: içerik taşmasına rağmen üst kapsayıcılar `overflow:hidden` kullandığı için içerik kaydırılamıyor.

**Öneri:** Telefonda yatay kaydırılan, okunabilir boyutlu kart eli ve ayrı kart inceleme paneli; içeriğe göre büyüyen savaşçı alanı; 320/390/768 px ve kısa yatay ekranlarda erişilebilirlik kontrolü. Arayüz metinlerinin dar görünümde kaybolmaması yaklaşımı [W3C Reflow açıklamasıyla](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) uyumludur; bu inceleme tam WCAG uygunluk denetimi değildir.

Kaynak: [sabit paneller](C:/Users/selim/project-dnd/src/App.css:79), [mobil kurallar](C:/Users/selim/project-dnd/src/App.css:521), [kart taşması](C:/Users/selim/project-dnd/src/App.css:652).

[Masaüstü kanıtı](C:/Users/selim/project-dnd/docs/review-2026-09-04/desktop-combat.png) · [Mobil kanıtı](C:/Users/selim/project-dnd/docs/review-2026-09-04/mobile-combat.png)

### F13 — P2: Kart inceleme ve diyalog yaşam döngüsü eksik

Kartı çift tıklayarak büyütme, ilk tıklamada kart oynanıp elden kaldırıldığı için gerçek akışta çalışmıyor. Tarayıcı kontrolünde enerji 3→2, eldeki kart 1→0 ve büyütülmüş kart sayısı 0 oldu. Bu kontrol hareket azaltılmış modda yapıldı; normal animasyonlar otomasyonun element kararlılığı kontrolünü de engelledi.

Diyaloglar yalnızca yeni bir diyalog eklendiğinde yaşa göre temizleniyor. Son diyalog 111 saniye sonra hâlâ görünürdü. Birden fazla balon aynı sabit koordinatlara yerleştiriliyor; yeniden başlatma bunları temizlemiyor.

**Öneri:** Kart inceleme ile oynama için ayrı etkileşim; süre dolunca temizlenen veya kullanıcı tarafından ilerletilen tek diyalog kuyruğu; macera kimliğine bağlı zamanlayıcı temizliği.

Kaynak: [kart etkileşimleri](C:/Users/selim/project-dnd/src/components/Card.tsx:76), [diyalog kaydı](C:/Users/selim/project-dnd/src/state/store.ts:1065), [balon görünümü](C:/Users/selim/project-dnd/src/components/DialogBubble.tsx:5).

## 4. Mimari ve test borcu

### Tek kural kaynağı eksik

- `store.ts` **1320 satır**; savaş, deste, ekonomi, ilerleme, kayıt ve diyalog işlemlerini birlikte taşıyor.
- `combatResolver.ts` gerçek çözümleme yapmıyor; başka dosyadaki düşman yardımcılarını yeniden dışa aktarıyor.
- `runMap.ts` ile store içinde iki ayrı harita üretimi var. Çalışan oyun store sürümünü kullanıyor; diğerinin testlerinin geçmesi gerçek haritayı doğrulamıyor.
- Eski ağırlıklı düşman niyet sistemi ile yeni davranış sistemi birlikte duruyor. Canlı standart davranış çoğunlukla sabit 4 hasara dönüyor; arketiplerin savunma/özel hamle çeşitliliği gerçek akışa tam yansımıyor.
- `BossResolver` kendi ayrı kart kataloğunu içeriyor. Aynı adlı kartın iki yerde farklı efekte sahip olması mümkün.
- Resolver'ların Zustand store'u içe aktarması ve `setTimeout` ile diyaloğu değiştirmesi, motor ile arayüz arasındaki bağı güçlendiriyor.
- `App.css` **1477 satır**; tekrar tanımlar ve sıra bağımlı geçersiz kılmalar mobil düzeni zorlaştırıyor. `sr-only` kullanılıyor fakat stil tanımı yok; ekran okuyucu için yazılan sayaçlar normal metin olarak iki kez görünüyor.

**Hedef yapı:** saf oyun kuralları + ince durum yönetimi + veri tabanlı içerik + ortak sunum yardımcıları. Örneğin `resolveCard`, `resolveTurn`, `finishEncounter`, `drawFromPiles`, `createRun` işlevleri birbirinden bağımsız test edilebilir. Bu ayrım hatalar düzeltilirken aşamalı yapılmalı; kapsamlı yeniden yazım gerekmiyor.

### Test başarısı oyuncu akışı başarısı anlamına gelmiyor

Başarısız 12 testin 7'si isim girişinden önce oyun ekranını bekleyen App/akış testleri. Bir test, enerji yetersizliği öncesi karşılaştırma durumunu senaryo kurulmadan önce alıyor. İki düşman testi eski sayı beklentileri taşıyor. Diğer hatalar localStorage taklidi ve başlangıç seçim akışıyla ilgili.

Bu nedenle “12 gerçek ürün hatası” demek doğru değil. Tersine, birim testleri geçen matematik/boss/harita parçalarının gerçek oyundan çağrılmaması da güven yanılsaması yaratıyor.

**Önerilen doğrulama kapısı:** derleme + uyarısız lint + mevcut testlerin anlamlı beklentilerle düzeltilmesi + seçilmiş tam akış testleri. Kapsam eşiğini başlangıç ölçümünün üzerinde kademeli artırmak uygun; [Vitest yapılandırması](https://vitest.dev/config/coverage) hata olduğunda kapsam raporu üretmeyi ve kapsam eşiklerini destekliyor.

Özellikle şu senaryolar otomatikleşmeli: seçimde kilitlenmeme; zehir/lanet/normal saldırıda ölüm; her ölüm yolunda aynı ödül; gösterilen niyetin çözülmesi; bütün deste üzerinde mağaza; yeni oyun sıfırlaması; kayıt yükleme; mobil kart inceleme.

### Rastgelelik henüz tekrar oynatılabilir değil

`SeededRNG` canlı oyuna bağlı değil. Ayrıca mutlak işaretli 32 bit sayı `0xFFFFFFFF` ile bölündüğünden üst aralık yaklaşık 0,5'te kalıyor; 0 tohumu sürekli 0 üretiyor. 10.000 örnekte maksimum 0,499998 bulundu.

Bugün ana oyun `Math.random` kullandığı için bunu canlı zarın yarısının gelmemesi şeklinde yorumlamıyorum. Ancak mevcut yardımcıyı ileride günlük meydan okuma veya denge simülasyonuna bağlamak hatalı sonuç üretir.

Kaynak: [SeededRNG](C:/Users/selim/project-dnd/src/utils/rng.ts:11).

### Depo ve teslim süreci

Depoda görünür CI iş akışı yok. README yeni harita/seçim/davranış sistemlerini doğru ve yeterli anlatmıyor. `store_original.ts`, eski test çıktıları, PID dosyaları, `.skip` testi ve kişisel araç dosyaları depoda izleniyor. Gerçek oyuncu/düşman görselleri mevcut çalışma klasöründe var, fakat henüz Git tarafından izlenmiyor; temiz checkout tesliminden önce eklenmeleri gerekiyor.

Kod yorumlarında ve oyuncuya görünen metinlerde karışık diller/yazım hataları var: isim ekranındaki “呼ばれacak”, bazı diyaloglardaki yabancı kelimeler ve İngilizce durum adları örnek. Bu yalnızca terminal kodlama sorunu değil; tarayıcıda da görüldü. HTML dili Türkçe arayüze rağmen `en`.

## 5. Eksik ürün alanları ve eklenirse değer katacak özellikler

Bunlar mevcut bug'lardan ayrı **ürün önerileridir**. Miktarlar ve sıralama proje için başlangıç önerimdir; kullanıcı testiyle doğrulanmalıdır.

| Alan | Bugünkü durum | Önerilen ilk kapsam | Öncelik |
|---|---|---|---|
| Kaydet/devam et | Yalnızca meta altın ve zafer sayısı saklanıyor; yenilemede isim ve macera kayboluyor | Sürümlü otomatik kayıt, devam/yeni macera seçimi, geçersiz kayıt için güvenli başlangıç | Yüksek |
| Öğretici | Enerji, blok, lanet ve niyet kuralları oyun içinde öğretilmiyor | Tek kısa eğitim savaşı; tekrar açılabilir mekanik sözlüğü | Yüksek |
| Kart inceleme | Seçim ekranlarında efektlerin ayrıntısı yok | Her yerde aynı ayrıntı paneli; oynama öncesi hedef ve sonuç önizlemesi | Yüksek |
| Deste ekranı | Bütün kalıcı kartları inceleyen bağımsız ekran yok | Tüm deste, maliyet dağılımı, etiket/efekt filtresi, yükseltme karşılaştırması | Yüksek |
| Maceranın sonu | Belirli final ve macerayı kazanma aşaması yok | Kısa, tamamlanabilir ilk rota; zorunlu final boss'u ve sonuç ekranı | Yüksek |
| Harita | Üç seçenekli tekrar eden durak yapısı; bağlantılı rota ve geçmiş yok | Önceden görünen birkaç kat, rota seçiminin sonucu, ziyaret geçmişi | Orta |
| Sınıf/oyun tarzı | Tek başlangıç karakteri; rastgele başlangıç desteği | Önce 2–3 anlamlı başlangıç destesi/pasif; saldırı-savunma-ekonomi tercihleri | Orta |
| Kalıcı pasifler | Relik/eşya sistemi yok | İlk etapta az sayıda, açık tetikleyicili pasif; ör. ilk savunmaya +1 blok | Orta |
| Olay çeşitliliği | Her olayda aynı üç seçenek | Birbirinden farklı, sonucu görülebilen 6–10 olay; karşılaşma sonrasına taşınan kararlar | Orta |
| Düşman/boss kimliği | 5 arketip var; davranış farkı sınırlı, boss ağırlıkla sayısal güçlendirme | Her arketipe ayırt edici döngü; boss'a 2 aşama ve özel kural | Orta |
| Mağaza ekonomisi | Her zaman aynı dört kart | Sınırlı stok, nadirliğe göre ağırlıklı teklifler, yükseltmenin önce/sonra görünümü | Orta |
| Meta ilerleme | Sayılar birikiyor; harcama veya görünür açılım döngüsü yok | Macera istatistikleri ve alternatif başlangıç/kart açılımları | Orta |
| Ses ve geri bildirim | CSS animasyonları var; ses sistemi yok | Kart, blok, hasar, zafer sesleri; ayrı ses/efekt ayarları | Sonraki |
| Tekrar oynanabilirlik | Paylaşılabilir tohum/günlük oyun yok | Düzeltilmiş ortak RNG sonrası tohumla aynı rota ve aynı çekişler | Sonraki |

Öğretici ve sürekli görülebilir hedef önerileri, [Microsoft Xbox Accessibility Guideline 109](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/109) içindeki etkileşimli, tekrar erişilebilir öğretici ve açık hedef ilkeleriyle destekleniyor. Buradaki özel sınıf/relik/olay önerileri ise bu projenin mevcut kart altyapısından yaptığım tasarım çıkarımlarıdır.

31 kart tanımı bulunması başlangıç için yeterli bir içerik hacmi. Önce bunların hepsinin çalışması, açıklanması ve farklı kararlar üretmesi sağlanmalı. Örneğin aynı maliyette daha güçlü blok ve çekiş veren kartlarla temel savunma arasındaki fark; tur atlatıp kart çeken kartla daha pahalı yalnızca tur atlatan kart arasındaki fark birlikte değerlendirilmelidir.

**Bu aşamada düşük öncelik:** çok oyunculu sistem, kullanıcı hesabı, bulut altyapısı, canlı servis veya başka motora taşıma. Mevcut tek oyunculu ürün bunlar olmadan tamamlanabilir; bulut kayıt/cihazlar arası devam ihtiyacı doğduğunda backend kapsamı ayrıca belirlenebilir.

## 6. Önerilen geliştirme aşamaları ve kabul ölçütleri

### Aşama 1 — Güvenilir oyun döngüsü

F01–F10'daki seçim, ölüm, niyet, blok, efekt, ödül, deste ve sıfırlama sorunlarını çöz. Bu sırada ortak sonuçlandırma ve başlangıç fonksiyonlarını çıkar.

**Tamamlandı sayılması için:** izin verilen seçimlerde kilitlenme yok; 0 canla devam yok; 4 enerji kartının meşru oynanma yolu veya düzeltilmiş maliyeti var; düşmanın gerçek hamlesi açıklanıyor; tüm zafer yolları doğru ödülü veriyor; yeni oyun başlangıç değerlerini taşıyor.

### Aşama 2 — Oyuncunun anlayabildiği arayüz

Ortak kart açıklaması, güvenli kart inceleme, bütün deste görünümü, gerçek maliyetler, diyalog kuyruğu, Türkçe metin temizliği ve mobil düzen.

**Tamamlandı sayılması için:** kart seçerken tam etkisi görülebiliyor; inceleme karta enerji harcatmıyor; 390 px görünümde kart adı/etkisi/enerji/düşman niyeti erişilebilir; kritik bilgiler kapsayıcı dışında kesilmiyor. Klavye odakları ve hareket azaltma da kontrol edilmeli.

### Aşama 3 — Tamamlanabilir ve kaydedilebilir ilk sürüm

Macera kaydı/devam etme, kısa öğretici, belirli final boss'u, sonuç ekranı ve temel macera istatistikleri.

**Tamamlandı sayılması için:** yenileme sonrası aynı maceraya dönülebiliyor; oyuncu hedefini biliyor; baştan sona oynanabilen bir kazanma/kaybetme döngüsü var; temiz checkout üzerinde aynı sürüm çalışıyor.

### Aşama 4 — Denge ve içerik

Başlangıç desteleri, relikler, yeni olaylar, boss aşamaları, mağaza çeşitliliği. Ortak tohumlu RNG ve ölçüm altyapısını burada tamamla.

**İzlenecek ölçüler:** ilk savaş/ilk boss kazanma oranı, ortalama savaş turu, kullanılmadan kalan kartlar, kart seçilme oranları, harcanan/taşınan altın, kaç maceranın tamamlandığı. Hedef sayılar gerçek oyuncu denemelerinden sonra belirlenmeli.

CI ve kritik akış testleri bütün aşamalara eşlik etmeli; en son yapılacak bir temizlik işi olmamalı. Mevcut testlerin onarılması, ürünün yanlış davranışını yeni beklenti olarak kabul etmek anlamına gelmemeli.

## 7. Geliştirmeye başlarken netleştirilecek tasarım kararları

1. D20 isabet/zırh kuralları mı korunacak, yoksa garantili isabetli kart savaşı mı hedefleniyor?
2. Düşman niyeti tur başında sabit mi, oyuncunun hareketine göre değişebilir mi? Değişebilirse oyuncu bunu ne zaman görecek?
3. Blok, denge, lanet ve geçici güç hangi sınırda sıfırlanacak: tur, savaş veya macera?
4. Harita sonlu bir macera mı, sonsuz tırmanış mı olacak?
5. Meta ilerleme doğrudan güç mü verecek, alternatif oyun tarzları mı açacak?
6. İlk teslim hedefi masaüstü mü, mobil dahil mi?

Bu sorular rapor çalışmasını engellemedi. Geliştirme sırasında farklı sistemleri tekrar tekrar değiştirmemek için kuralların başta kısa bir tasarım belgesine yazılması yeterli.

**İlk geliştirme paketim:** seçim kilidi, bütün ölüm yolları, doğru niyet/hasar, blok hesabı, ortak zafer ödülü ve yeni oyun sıfırlaması. Ardından ortak kart açıklaması ile mobil okunabilirlik. Bu sıra yeni özellikler için güvenilir temel sağlar.
