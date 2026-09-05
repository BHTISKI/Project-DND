# Makara

Tek oyunculu ve tur tabanlı bir masaüstü tarayıcı kart oyunu. React, TypeScript, Zustand ve Vite kullanır.

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

1. 2–20 karakterlik bir isim girilir. Yeni macera 24 can ve yedi kartlık başlangıç destesiyle başlar.
2. Haritadan ilk savaşa girerken, beş seçenekten üç kart seçilir. Yük bütçesi 6'dır; sıradan/seçkin/nadir/efsanevi kartlar 1/2/3/4 yük kullanır. Üç seçimi tamamlamayı engelleyen seçimler kapalıdır.
3. Her oyuncu turunda beş kart çekilir ve enerji 3'e doldurulur. Elde tutulan her kart bir çekiş yerini kullanır; örneğin bir kart saklandıysa dört yeni kart çekilir. Kartların ürettiği enerji bu dolum değerini aşabilir. Kırık Ruh bu macera boyunca maksimum canı ve tur dolum enerjisini düşürür.
4. Kart tek tıklamayla oynanır; çift tıklama veya **İncele** düğmesi ayrıntıları açar. Çift tıklamayı ayırmak için fareyle tek tıklama 500 ms gecikmeli uygulanır. Klavyeyle oynama anlıktır. İnceleme enerji harcatmaz; Escape pencereyi kapatır.
5. Saldırı, blok ve şifa kartlarında yazan değer doğrudan uygulanır. Saldırı hasarına karakterin hasar bonusu ve varsa kombo katkısı eklenir; durum etkileri ile blok ayrıca hesaplanır.
6. Güçlü hasarı artırır, Güçsüz azaltır. Savunmasız alınan hasarı yük × değer başına %25 artırır. Zehir, hedefin eyleminden önce işler. Tahkimli, düşman hamlesinden önce blok kazandırır. Süreler tamamlanan tur sonunda azalır; durum yükleri en fazla 3’tür.
7. Blok kartları birbirine eklenir; gelen hasar yalnızca kullandığı bloğu tüketir. Oyuncu bloğu düşman turundan sonra, düşman bloğu sonraki düşman hamlesinden önce temizlenir.
8. Yakın saldırılar, HP hasarı tamamen bloklansa da kartta yazan denge hasarını verir. HP oranı %70 üzerindeyken 1×, %30–70 arasındayken 1,35×, %30 altındayken 1,75× denge hasarı alınır. Uzaktan saldırı, zehir, lanet ve saf hasar denge doldurmaz. Denge kırılınca blok temizlenir; sonraki uygun yakın saldırı **İnfaz** olur. Normal düşman anında ölür, elit/boss maksimum canının %35’ini kaybeder; oyuncu durum etkileri uygulanmış saldırının 2× hasarını blok kullanmadan alır. Kullanılmayan kırılma penceresi %50 dengeye döner; otomatik tur atlama yoktur.
9. Düşman niyeti hamle öncesinde gösterilir. Taktik rakip zekâsı; iki tarafın canını, bloğunu ve Dengesini okuyarak İnfaz, savunma, şifa veya arketipe özgü karşı hamle seçebilir. Neden plan değiştirdiği niyet kartında açıklanır. Fırsatçı ve paranoyak düşmanlar kartlarına tepki verirse gösterge hemen güncellenir. Tur bitiminde aynı hamle çözülür. Hasar göstergesi blok öncesidir; aldatıcı düşmanda niyetin belirsiz olduğu belirtilir.
10. Kullanılan normal kart mezarlığa gider. **Tükenir** kartları ayrı yığına gider; bu savaşta tekrar çekilmez, savaş sonunda geri döner. Çekiş destesi boşalınca yalnızca mezarlık karıştırılır. Oynanmakta olan çekiş kartı kendi etkisiyle geri çekilemez. Lanetlerin bedeli kart açıklamasında gösterilir.
11. Her ölüm yolu aynı sonucu uygular: oyuncu 0 canda kaybeder; eşzamanlı ölüm yenilgidir. Düşman yenilince ödül bir kez verilir. Normal altın 20 + önceki zafer × 5; elit bu miktarın %50 fazlası; boss 50 + önceki zafer × 10'dur. Normal/elit 3, boss 4 kart seçeneği verir.
12. Ödül seçimi veya pas geçme sonrası mağaza açılır. Mağaza, eldeki ve mezarlıktaki kartlar dahil bütün sahip olunan kartları yönetir. Tam canda şifa satılmaz; etkisiz yükseltme ücretlendirilmez; son kart silinmez.
13. Harita durakları tamamlandıkça sayaç bir artar. Başlangıçtan sonra her üç tamamlanmış durakta boss/elit seçenekleri açılır. Zafer sonrası ücretsiz mağazadan çıkış ikinci kez sayaç artırmaz.
14. Olay bedelleri ekrandaki güncel altına göre gösterilir. Kehanet sonraki düşmana taşınır ve ilk oyuncu turu otomatik feda edilir. Dinlenmede işlem yapmadan devam edilebilir.
15. Yeni oyun sağlık, enerji, durum, sayaç ve diyalogları sıfırlar; isim ve meta istatistikleri korunur.

Macera artık otomatik kaydedilir; meta altın ve meta zafer sayısı da korunur. Final rota, yeni sınıflar ve içerik genişletmeleri sonraki özellik aşamasındadır. Mobil oyun düzeni bu paketin kapsamı dışındadır.

## Kayıt ve devam etme

- Açılış ekranında yeni karakter için isim girilir. Devam eden bir kayıt varsa karakter, bölüm ve bulunduğu aşama gösterilir; **Devam et** aynı macerayı açar.
- Her tamamlanan oyun eyleminden sonra otomatik kayıt alınır. İsim, can, enerji, altın, harita, yarım kalan deste seçimi, kartların sırası/yükseltmeleri, elde tutulan ve tükenen kartlar, kombo, lanetler, durum etkileri, bekleyen olay bedelleri, düşman niyeti ve ödüller korunur. Denge, kırılma, hazırlanmış Savuşturma, bekleyen Guard bedelleri ve yakın saldırı momentumu da turun parçası olarak saklanır. Günlüğün son 200 kaydı saklanır.
- Oyun içindeki **Menü** düğmesiyle açılış ekranına dönülebilir. Yeni macera mevcut kaydın yerini almadan önce onay istenir; **Vazgeç** veya Escape kaydı korur.
- Yenilgi de kaydedilir. Sayfa yenilemek karakteri diriltmez; sona ermiş maceradan sonra yeni oyun başlatılır. Devam etmek yeni kart dağıtmaz, mevcut düşman niyetini yeniden üretmez ve ödülleri tekrar vermez. Savaş değerleri kayıttaki halleriyle korunur.
- Tek kayıt yuvası vardır; kayıt **aynı tarayıcı/profil ve aynı oyun adresinde** tutulur. Başka cihazlara aktarılmaz. Site verilerini silmek kaydı da siler; gizli pencerelerin kayıtları pencere kapanınca silinebilir. Önceki sürümde kapatılmış maceralar geri getirilemez.
- Yerel geliştirme adresi `http://localhost:5173`, üretim önizlemesi `http://localhost:4173` şeklindedir. Bunlar farklı kayıt alanlarıdır; `127.0.0.1` ve `localhost` da farklıdır. Port doluysa Vite başka bir porta sessizce geçmez.
- **Kaydedildi** son eylemin kaydedildiğini gösterir. Tarayıcı yazmaya izin vermezse mevcut oyun çalışmaya devam eder, son başarılı kayıt korunur ve **Tekrar kaydet** sunulur. Kaydedilmemiş ilerleme varken sayfadan ayrılmak tarayıcının uyarısını tetikler.
- Kayıt sürümü 3’tür; sürüm 1 ve 2 kayıtları kart kimlikleri, sıraları ve yükseltmeleri korunarak taşınır. Eski denge oranı yeni profil kapasitesine uyarlanır. Kayıt içeriği yüklemeden önce doğrulanır. Bozuk veya uyumsuz kayıt sessizce silinmez. Başka sekmede değişmiş bir kaydı eski sekmenin sonraki hamlesi ezmez; kullanıcı güncel kaydı açmaya yönlendirilir.

Kayıt modülü: `src/state/runPersistence.ts`. Kayıt ve menü kontrolleri: `src/state/runPersistence.test.ts`, `src/components/NameInput.test.tsx`.

## Ayarlar

Sağ alttaki mühür düğmesi ayar penceresini açar. Hareketli efektler, ekran sarsıntısı, dolum halkası, ışıltı ve animasyon hızı buradan değiştirilebilir. Tercihler `makara.preferences` anahtarıyla tarayıcıda tutulur; macera kaydından bağımsızdır.

## Kod düzeni

- `src/mechanics/`: denge/İnfaz, elde tutma, tükenme ve bitirici için bağımsız kurallar ve tasarım değerlendirme ölçütleri. Denge başlangıç değerlerinin tek kaynağı `posture.ts` içindeki `POSTURE_CONFIG`’dir.

- `src/state/store.ts`: oyun aşamaları ve eylemlerin bağlantıları.
- `src/engine/combatResolver.ts`: kart ve tur çözümleme.
- `src/engine/statuses.ts`, `cardPiles.ts`, `rewards.ts`, `draft.ts`: ortak oyun kuralları.
- `src/engine/runMap.ts`: tek harita üreticisi.
- `src/utils/cardText.ts`: savaş, seçim, ödül ve mağaza için ortak kart açıklamaları.
- `src/state/regressions.test.ts`, `src/components/regressions.test.tsx`: raporlanan hataların tekrarını önleyen testler.

## Yeni kart mekanikleri

| Kart | Kullanım |
|---|---|
| Sabırlı Muhafız | 1 enerji, 3 blok. Oynamazsan sonraki elinde kalır. |
| Son Kıvılcım | 0 enerji, +1 enerji. Savaşta bir kez kullanılır; sonra tükenir. |
| Zincir Darbesi | 1 enerji, 5 + Hasar bonusu. Bu kart dahil aynı tur iki kart türü geçişi yapıldıysa ilk saldırıya +3 hasar. |

Örneğin **Son Kıvılcım → Sabırlı Muhafız → Zincir Darbesi** sırası yetenek → savunma → saldırı olarak iki tür geçişi yapar. Bitirici hazır olunca kartın altında gösterilir. Tekrarlanan tür kombo artırmaz; mevcut kombo tur boyunca korunur, tur sonunda sıfırlanır. Mevcut yetenek→saldırı +2 ve savunma→saldırı +1 bonusları da geçerlidir. Bitirici bonusu ilk saldırıda kullanılır.

Bu üç kart başlangıç, ilk deste seçimi ve ödül havuzlarında bulunur. Tükenen kartlar savaşta açılır listede görülebilir. Kart açıklamaları **İncele** penceresinde de okunabilir.

### Denge, Guard ve Savuşturma

Guard kartlarının denge bedeli, blok ilk kez bir yakın saldırıyı gerçekten emdiğinde bir kez uygulanır. Kullanılmayan veya yalnızca uzaktan saldırı emen blok bedel doğurmaz. **Ayna Duruşu** 4 blokla birlikte tek kullanımlık Savuşturma hazırlar: yayımlanmış yakın saldırıyı tamamen durdurup düşmana 60 temel denge hasarı verir; diğer hamlelerde oyuncuya 45 temel denge hasarı uygulanır. Düşmanın turu atlatılmışsa ceza yoktur.

Art arda yakın saldırıların üçüncüsü 1,25×, dördüncüsü 1,5×, beşinci ve sonrası 1,75× denge hasarı verir. Başka kart, İnfaz veya tur sonu bu momentumu sıfırlar. Denge toparlanması HP bandına göre maksimum kapasitenin %25/%12/%3’üdür; profil toparlanma hızıyla çarpılır. Duruşu kırılan oyuncu Guard/Parry kullanamaz ancak saldırı, şifa, çekiş ve tur-atlatma kartlarıyla karşılık verebilir. Düşman hamlesinde yeni kırılma, sonraki oyuncu turunun tamamı boyunca korunur.

Araştırma: [10 aday ve kaynaklar](docs/mechanics-research.md). Geliştirici kuralları: [Mekanik ekleme](src/mechanics/README.md).

100 eşleştirilmiş savaş senaryosunu yeniden çalıştırmak için:

```sh
npm run simulate
npm run simulate -- --baseline
npm run simulate -- --with-mechanics
```

Simülasyon normal, elit ve boss karşılaşmalarını eşleştirilmiş tohumlarla ayrı raporlar; kazanma oranı, savaş süresi, oyuncu/düşman Denge kırılması ve İnfaz kullanımı dahil tasarım ölçümleri üretir. Hedef aralıklar normal savaşta 3–5, elitte 5–8 ve bossta 8–12 turdur. İnsan oyuncu eğlencesini veya tam macera kazanma oranını ölçmez. Baseline seçeneği yalnızca elde tutma/tükenme/Bitirici ablasyonudur; her iki mod da aynı güncel Denge motorunu ve rakip zekâsını kullanır.
