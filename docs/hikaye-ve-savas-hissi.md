# Makara — Geride bıraktığın ses

## 1. Düşmanların sesi ve tepkisel diyalog

- **Altı anlatı arketipi:** aç sağ kalan, vicdanlı nöbetçi, yorgun hekim, kimlik hırsızı, ihanete uğramış şövalye, kendini haklı çıkaran dokuyucu. Bunlar beş savaş davranışından bağımsız altı kişilik profilidir. Veyra ve İlk Dokuyucu, büyücü savaş davranışını kullanırken farklı dokuyucu sesine bağlanır.
- Her profil için **8 gerçek replik**, toplam **48 tepkisel replik** `src/content/enemyVoices.ts` içinde bulunur. Karşılaşmaya özgü girişler, evre değişimleri ve son sözler `src/content/campaign.ts` içindedir.
- **Sağ kalan, alaycı/korkmuş:** “Zehir mi? Kazanımda yiyecek yokken kanımda ziyafet var!” / “İlk kan benden. Geçiş ücretini fazla ciddiye aldın.” / “Yarısını aldın. Kalan yarımla pazarlık edebilir miyiz?” / “Çan Bekçisi benim adımı biliyor. Ona kazanı sakladığımı söyle.” / “Bir çizik bile yok! Bana da o numarayı öğret; ekmeği bölüşürüz.” / “Tamam! Kazana vurma, bana vur. Ondan başka evim yok.” / “Hep kesiyorsun. Bizi buradan sürenler de dinlemezdi.” / “Kalkanın arkasında sakladığın şey… Birini mi koruyorsun?”
- **Nöbetçi, kararlı/vicdanlı:** “Zırhımın altına sızdın. Emirler de böyle girmişti.” / “Bir adım attın. Geçmene izin verdiğimi sanma.” / “Nöbetin yarısı korkudur. Kalan yarısının adını unuttum.” / “Cam Arşiv’e git. Veyra nöbet defterinde senin adını arıyor.” / “Sağlam bir savunma. Keşke o gece kapımızda sen olsaydın.” / “Demiri eğdin. Yeminimi de böyle kırabilir misin?” / “Gücü emir sanıyorsun. Ben de o hatayla bir ömür bekledim.” / “Önce koruyor, sonra vuruyorsun. Nöbet tutmayı kim öğretti sana?”
- **Hekim, felsefi/yorgun:** “Kendi ilacım… Acıyı tanıdım. Ölçüyü kimden öğrendin?” / “Yara taze. Henüz ne kaybettiğini bilmiyor.” / “Yarım şişe, yarım ömür. Hangisini tamamlamaya geldin?” / “Çanın sesi panzehir değil. Unutulan yaranın yerini gösterir.” / “Hiç yara yok. İlk kez bir tedaviye gerek kalmadı.” / “Kemik böyle ses verir. Duyup da unutabileceğini sanma.” / “Hep aynı reçete: daha çok kesmek. Her derde iyi gelmez.” / “Sabır da ilaçtır. Ama şişenin dibinde korku varsa zehre döner.”
- **Hırsız, kuşkucu/kimliksiz:** “Bu yüzü yakma! Acı onun, korku benim.” / “Bir çizik daha. Aynada hangimizin izi kalacak?” / “Yüzümün yarısını aldın. Altındaki beni tanıyor musun?” / “Veyra senden bir yüz çalmadı. Sen ona kendi sesini bıraktın.” / “Sana dokunamadım. Demek hâlâ kendine ait bir yanın var.” / “Maske çatladı! Bakma… Daha hazır değilim.” / “Sözleşmemde böyle yazıyordu: susar, vurur, hiç durmaz.” / “Bekliyorsun. Beni yüzümden değil hamlemden tanımaya çalışıyorsun.”
- **Şövalye, gururlu/kırgın:** “Düello böyle bitmez. Ama savaşlar hep böyle bitti.” / “İyi bir kesik. Hocanı anımsıyorum; adını değil.” / “Bu hareket… Yan yana savaştığımız gece de yapmıştın.” / “Tahttaki seni beklemiyor. Senin yeniden o olmanı bekliyor.” / “Temiz savunma. Sana bu yüzden arkamı dönmüştüm.” / “Diz çökerim. Boyun eğdiğimi düşünme.” / “Sen de tıpkı ilk hükümdar gibi: her soruya bir kılıç.” / “Kılıcı bekletebiliyorsun. Belki o geceden beri değişmişsindir.”
- **Dokuyucu, sakin/kibirli:** “Bir hatırayı zehirledin. Onu hatırlayan herkese yayılır.” / “Bir ilmek söküldü. Ellerinin bu işi bildiğini görüyorsun.” / “Acıya şaşırma. Yarattığın dünyanın içinde sen de varsın.” / “Bitirmeden karar ver: kimseyi silmeden bir dünya kurabilir misin?” / “Kendini korudun. Bir sonraki sayfada başkasına da yer aç.” / “Bu kuvveti tanıyorum. İlk düğümü de böyle sıkmıştın.” / “Her kartın saldırı. Yeni dünyanın ilk cümlesi yine bir emir mi?” / “Söylemeden önce düşünüyorsun. Bu sessizlik eskisinden farklı.”
- **Tetikleyiciler:** savaş başlangıcı; zehir yükü artışı; düşmanın %75/%50/%25 canını aşağı yönde geçmesi; saldırı beklenen turu can kaybetmeden bitirmek; tek işlemde en az 12 can kaybı; destenin en az %65 saldırı kartından oluşması; savunma kazanılan kart; evre değişimi; yenilgi.
- **Öncelik:** boss sırrı ve son sözler > okunmamış hikâye > %25 korkusu (80) > ağır vuruş (70) > diğer tepkiler (40). Birden fazla eşik aynı hamlede geçilirse bir replik seçilir. Eski kısa tepkiler yenisiyle değiştirilir; okunmamış hikâye korunur.
- **Kritik kavramı:** mevcut oyunda rastgele kritik zar sistemi yok. İnfaz, bitirici ve 12+ hasar “ağır vuruş” olarak sunulur; görsel uğruna yeni rastgele hasar kuralı eklenmedi.

```ts
interface EnemyDialogueLine {
  trigger: DialogueTrigger;
  text: string;
  emotion: 'wary' | 'angry' | 'afraid' | 'sad' | 'resolute';
  priority: number;
  condition?: { minimumAttackRatio: number };
}
// Gerçek satır örneği:
const line: EnemyDialogueLine = {
  trigger: 'aggressive',
  text: 'Sen de tıpkı ilk hükümdar gibi: her soruya bir kılıç.',
  emotion: 'wary', priority: 40,
  condition: { minimumAttackRatio: .65 },
};
```

## 2. Diyalog sahnesi ve portre

- **Yer:** masaüstünde oyuncu ve düşman portreleri arasında; mobilde iki portrenin altında. Kartlar kendi el alanında görünür ve oynanabilir. Uzun bir konuşma için kart girişini kilitleyen zorunlu bekleme yoktur.
- **Yarı engelleyici davranış:** hikâye metni oyuncu “Devam et” diyene kadar kalır; savaşı durdurmaz. Kısa tepkiler `max(5500, metin uzunluğu × 58)` ms sonra geçer. İlk tıklama daktiloyu tamamlar, sonraki tıklama sıradaki satıra geçer.
- **Daktilo:** 36 ms aralıkla iki karakter, ortalama **18 ms/karakter**. Tam metin görünmez bir ölçü katmanında tutulduğu için kutu yazarken büyüyüp kartları aşağı itmez. Ekran okuyucuya parçalanmamış cümle verilir.
- **Giriş:** sağdan **12 px**, **220 ms**, `cubic-bezier(.16,1,.3,1)`. Çıkış mevcut uygulamada anlıktır; metin kuyruğuna ayrıca bir kapanış beklemesi eklenmez.
- **Görünüş:** kâğıt zemin, koyu mürekkep, ortak yazı ailesi; düşman başına başka font kullanarak okuma ritmi bozulmaz. Profil rengi yalnız **3 px** sol çizgide kullanılır: `#92703f`, `#707e83`, `#798753`, `#907ba5`, `#a47756`, `#947d9c`.
- **Boyut:** masaüstü iç boşluk **20×24 px**, mobil **12×14 px**; mobil metin **17 px**. Kutu genişliği orta grid kolonuna bağlıdır.
- **Üç portre durumu:** sağlıklı normal baskı; %50 ve altında `saturate(.5) contrast(1.12)`; 0 canda `grayscale(1) brightness(.65)`, **2°** yatma ve **.97** ölçek. Bunlar mevcut çizimlerin durum işlenmesidir; üç ayrı yüz illüstrasyonu üretilmedi.
- **Duygu çerçevesi:** korku `#b795b9`, öfke `#c87658`, düşük can `#c98670`. Büyük parlamalar yalnız vuruşta tetiklenir.

```text
App
├─ CombatFeedbackController → oyun değişikliklerini dinler
├─ CampaignPanel → campaign.journal
├─ BattleStats(player) → HealthBar + FighterFeedback
├─ DialogBubble → enemyDialog[0]
│  └─ SpokenLine → daktilo + erişilebilir tam metin + ilerletme
├─ BattleStats(enemy) → HealthBar + FighterFeedback
└─ Hand + CombatControls
```

## 3. Üç perdelik gerçek hikâye

- **Ana karakter:** oyuncunun verdiği adı taşıyan sessiz Hatıra Dokuyucusu. Konuşamadığı cümleler kartlara dönüşür. Görünürde kayıp sesini arar; gerçekte eski iktidarından ayırdığı insanlığını geri toplamaktadır.
- **I. perde — İsimsiz Geçit / yokluk ve sorumluluk:** Kervan Artçısı yenilince bağışlanabilecek bir sağ kalandır; İp Nöbetçisi köprüden geçmenin başkasının yükünü devralmak olduğunu anlatır; Çan Bekçisi Aras, nöbet tuttuğu şeyin oyuncunun sesi olduğunu açığa çıkarır.
- **Aras’ın son sözü:** “Çanın içinde senin sesin vardı. Veyra onu bana emanet etti. Cam Arşiv’de onu bul; neden sustuğunu o biliyor. Benim adım Aras… bunu burada bırak.”
- **II. perde — Cam Arşiv / kimlik ve ihanet:** Cam Kâtibi insanları kayıt nesnesi yapan düzenin çalışanıdır; Yüz Hırsızı oyuncunun kimliksizliğini yansıtır; Aynacı Veyra düşman görünen eski müttefik ve kız kardeştir.
- **Somut dönüş:** Veyra’nın canı %50’ye düşünce: “Sesini ben çalmadım. ‘Kız kardeşimin adını silme; benimkini al,’ dedin. İlk Dokuyucu sendin. Tahttaki, vazgeçemediğin parçan. Ben kurtardığın kardeşinim.” İki evre arasında 2 Yansıma açıldığı için sır, savaşın mekanik değişimiyle aynı hamlede gelir. Veyra erken öldürülürse sır son sözlerden önce yine gösterilir.
- **Veyra’nın son sözü:** “Adım Veyra. Bunu ikinci kez unutma. Kül Tahtı’na git; seni oraya geri getirmek için bıraktığım üç mührü ara. Bu kez dünyayı değil, düğümü çöz.”
- **III. perde — Kül Tahtı / güçten vazgeçiş:** Yemin Enkazı eski emrin içi boş sadakatidir; Adsız Vâris oyuncunun yeniden dönüşebileceği zorbadır; İlk Dokuyucu oyuncunun terk ettiği yönetme emridir.
- **Final ortası:** “Yolda bağışladığın her isim elimden bir ilmek aldı. Aldığın her hatıra beni besledi. Beni kılıcınla değil, buraya gelirken seçtiklerinle yazdın.” Bu replik seçimlerin ahlaki sonucunu anlatır; merhamet düşmanın sayısal canını ayrıca azaltmaz.
- **İpucu ağı:** Kervan Artçısı → Çan Bekçisi → Veyra → üç mühür / Kül Tahtı → İlk Dokuyucu. Önemli evre replikleri ve son sözler kalıcı günlüğe yazılır; sonraki savaşın konuşması eskisini temizlese de ipucu kaybolmaz.
- **Üç mevcut son:** merhamet ≥3 ve yozlaşma ≤2 ile İsimlerin Şafağı; üç farklı perde mührü, merhamet ≥5 ve yozlaşma 0 ile Yazılmamış Sayfa; diğer durumda Yeni Dokuyucu. Her biri yol boyunca verilmiş kararın sonucudur.

## 4. Can kaybı, iyileşme ve yenilgi

- **Anlık dolgu:** gerçek can değişiminde **100 ms** `ease-out` geçiş; arkadaki `#d5b078` iz **250 ms** bekler, ardından **550 ms** `ease-out` ile yetişir. Art arda hasarlar bekleme süresini yeniden başlatır.
- **Eşik renkleri:** %50 `#c29a63`, %25 `#cc795a`, %10 `#d85d50`. %10 altında **1 px** uyarı çerçevesi; sürekli tam ekran nabız kullanılmaz.
- **İyileşme:** **600 ms** yeşil durum, `#9ccc86` dolgu ve **9 px** parıltı; ilgili portrede `+N ŞİFA` ve yeşil parçacıklar. Hasarın gecikmeli izi iyileşmede doğrudan yeni cana gider.
- **Yenilgi sırası:** oyun sonucu atomik olarak hesaplanır; can 0 olur ve portre grileşir; öldürücü hasar sıradan silinmez; hasar yazısından sonra **850 ms** “YENİLDİ” olayı oynar. Son söz ve ödül ekranı bu sırada kullanılabilir. Gerçek savaş sonucunu animasyon zamanlayıcısı belirlemez.

```tsx
// HealthBar.tsx içindeki akışın özeti
const percent = Math.max(0, Math.min(100, health / Math.max(1, maxHealth) * 100));
const [trail, setTrail] = useState(percent);
useEffect(() => {
  const timer = window.setTimeout(() => setTrail(percent), 250);
  return () => window.clearTimeout(timer);
}, [percent]);
// Üretim bileşeni ayrıca ardışık darbeyi, iyileşmeyi ve hit temizliğini işler.
```

## 5. Hasar sayıları ve kart ritmi

- **Bağımsız bileşen:** `DamageNumber({ event: PresentedImpact })`; olay hedefi oyuncu/düşman, türü, miktarı ve benzersiz kimliği içerir.
- **Boyut:** `min(54, 28 + miktar)` px; etiket **11 px**. Hasar `#f1c7a5`, ağır vuruş `#ffd479`, blok `#a7d9f0`, şifa `#a8e0a0`, zehir `#c3e778`, denge kırılması `#ffc98d`.
- **Hareket:** **520 ms**, `cubic-bezier(.16,1,.3,1)`; başlangıç **+12 px/.65 ölçek**, %12–55 arasında **−8 px/1 ölçek**, sonunda **−38 px/.94 ölçek** ve saydamlık 0.
- **Çoklu vuruş:** her darbe ayrı resolver olayı üretir. Tek kanallı sırada **520 ms / hız** aralıkla sunulur; üst üste binmez. Bir kartın iki saldırısı tek toplam sayıya sıkıştırılmaz. Blok ve zehir ayrıca görünür.
- **Kart çeşitliliği:** mevcut tür değiştirme kombosu, bitirici, elde tutma, tükenme, zehir bağı ve denge kırma korunur. Arayüz oynanabilir kart sayısını ve gelen hamleyi bildirir. Enerji bitince neden kart oynanamadığı açıktır.
- **Yerleşim:** masaüstünde kartlar **205×290 px**; mobil **180×290 px**, el içinde yatay kaydırma. Uzun kart açıklamasının tamamı “İncele” ile erişilir. Savaş sırasında sefer özeti ince bir satırdır; ayrıntılar açılır günlükte kalır.
- **Teknoloji:** kısa, tek kullanımlık sayı/parçacık efektleri CSS keyframe; eldeki kartların sürükleme/yay fiziği mevcut Framer Motion. Ek animasyon bağımlılığı yoktur.

## 6. Vuruş hissi, ses ve merkezi efekt sırası

- **Vuruş pozu:** portre **300 ms** içinde önce **−4 px**, `.97×1.02` sıkışma, sonra **+3 px**, `1.02×.99` esneme yaşar. İlk **60 ms** aynı darbe pozunda kalır. Bu görsel hit-stop’tur; JavaScript veya kart girişini dondurmaz.
- **Halka:** **80 px** çap, **2 px** çizgi; `.4→2` ölçek ve `.85→0` saydamlık, **520 ms** `ease-out`.
- **Parçacık:** normalde 4, ağır darbede 8; **4×16 px**, **45°** aralık; merkezden **20→85 px**, bitiş ölçeği `.3`, **520 ms**. Renk olay türünden gelir.
- **Ses senkronu:** ses ve görsel aynı `queue[0]` kimliğine bağlıdır. Web Audio başlangıcında **8 ms** ses yükselişi; normal/blok/zehir/şifa **120 ms**, ağır darbe/yenilgi **220 ms**. Frekanslar hasar **140 Hz**, ağır **75 Hz**, blok **620 Hz**, şifa **440→660 Hz**, zehir **190 Hz**, kırılma **95 Hz**, yenilgi **60 Hz**. Ses seviyesi tepe `.065`; başlangıçta kapalıdır.
- **Sıra:** `combatResolver` → geçici `combatFeedback[]` → `CombatFeedbackController` → ayrı Zustand `useCombatPresentation.queue` → `FighterFeedback` / `ImpactSound` → kimlikle `shift(id)`.
- **Çakışma önleme:** aynı anda bir olay sunulur; hızlı kartlar sıraya eklenir. Yeni rakipte eski sıra temizlenir. Günlük yazılması eski darbeyi yeniden oynatmaz. Sıra, kayıt şemasından açıkça çıkarılmıştır; sayfa yenilenince eski ses/darbe tekrarlanmaz.
- **Hareket tercihleri:** sistemde azaltılmış hareket veya oyun ayarında hareket kapalıysa daktilo ve hareket kaldırılır; sayı/etiket görünür kalır. Halka, parlama ve sarsıntı ayrı ayarlara uyar.

```ts
interface CombatFeedback {
  target: 'player' | 'enemy';
  kind: 'damage' | 'heavy' | 'block' | 'heal' | 'poison' | 'break' | 'death';
  amount: number;
}
interface PresentedImpact extends CombatFeedback { id: number }
interface PresentationState {
  queue: PresentedImpact[];
  push(events: CombatFeedback[]): void;
  shift(id: number): void;
  clear(): void;
}
```

## Öncelik ve doğrulama

1. Öldürücü vuruş dahil hedefe bağlı hasar/blok/zehir geri bildirimi.
2. Kartlar ve gelecek hamle için okunabilir savaş yerleşimi.
3. Veyra dönüşü, bağlantılı son sözler ve kalıcı ipucu günlüğü.
4. Gecikmeli can izi, şifa ve portre durumları.
5. Tepkisel düşman kişilikleri ve daktilo.
6. İsteğe bağlı ses, halka ve parçacık ayrıntıları.

- Testler: ayrı çoklu vuruşlar, emilen blok, zafer geçişinde öldürücü darbe, zehir tiki, altı profil, zehir repliği, Veyra evresi, erken öldürmede sır, ipucu günlüğü, olay tekrarı ve yeni rakipte sıra temizliği.
- Doğrulama sonucu: **35 dosyada 469 test geçti**, üretim derlemesi ve lint başarılı. Son küçük portre/harita düzenlemesinden sonra ilgili **27 test** ayrıca geçti.
- Tarayıcı: 1440 px masaüstü ve 390 px mobil; kart/zehir/blok kullanımı, tur sonu, ses açma, zehirle zafer, merhamet seçimi, ödülü geçme ve sonraki savaşa giriş doğrulandı. “YENİLDİ” öldürücü olayın arkasından görüldü. Sayfa yenilenince **30/30 can, 72 altın, merhamet 1** ve son söz günlüğü aynı kaldı. Güncel oturumda konsol hatası yok; iki portre kaynağı da yüklendi. Mobilde sayfa yatay taşmıyor; uzun el kendi içinde kaydırılıyor. Azaltılmış hareket tercihi kontrol edildi.
- Otomasyon öznel insan oynanış değerlendirmesinin yerine geçmez; sesin tarayıcıda açılması doğrulandı, bir insanın işitsel beğenisi ölçülmedi.
