import type { EnemyAction, EnemyArchetypeId } from '../types/game';

export type ClassId = 'weaver' | 'warden' | 'cinder';
export type EndingId = 'dawn' | 'throne' | 'unwritten';
export interface CampaignRun {
  classId: ClassId; ascension: number; configured: boolean;
  mercy: number; corruption: number; seals: number[];
  relics: string[]; usedRelics: string[]; encounterId: string | null;
  bossPhase: boolean; choicePending: boolean; relicOffers: string[];
  ending: EndingId | null; rareMisses: number; journal: string[];
}
export const initialCampaign = (): CampaignRun => ({ classId: 'weaver', ascension: 0, configured: false,
  mercy: 0, corruption: 0, seals: [], relics: [], usedRelics: [], encounterId: null,
  bossPhase: false, choicePending: false, relicOffers: [], ending: null, rareMisses: 0, journal: [] });

export const classes = [
  { id: 'weaver', name: 'Hatıra Dokuyucusu', unlock: 0, hp: 30, damage: 2, theme: 'memory', detail: '30 can · Her savaşın ilk elinde +1 kart. Unutulan isimleri yeniden birleştirir.' },
  { id: 'warden', name: 'Yemin Bekçisi', unlock: 3, hp: 36, damage: 1, theme: 'oath', detail: '36 can · Her savaşın başında 4 blok. Tutulmayan sözlerin nöbetçisi.' },
  { id: 'cinder', name: 'Kül Yazıcısı', unlock: 9, hp: 26, damage: 3, theme: 'ash', detail: '26 can · Her savaşta düşmana 2 turluk zehir. Gücü bedeliyle satın alır.' },
] as const;
export const acts = [
  { number: 1, name: 'İsimsiz Geçit', theme: 'Terk edilmiş kervan yolu; yokluk, açlık ve ilk merhamet.', color: '#9fac83', boss: 'Çan Bekçisi', environment: 'Rüzgâr, boş kervanların iplerinde aynı düğümü tekrar tekrar sıkıyor.', music: '72 BPM; tek bağlama motifi, kuru deri davul, uzaktan çan.' },
  { number: 2, name: 'Cam Arşiv', theme: 'Hatıraların alınıp satıldığı şehir; şüphe ve kimlik.', color: '#a9bac7', boss: 'Aynacı Veyra', environment: 'Cam rafların içinde yüzler var. Sen yaklaştıkça gözlerini kapatıyorlar.', music: '88 BPM; cam armonika, ters piyano kuyrukları, düzensiz yaylı nabız.' },
  { number: 3, name: 'Kül Tahtı', theme: 'Dünyayı tekrar yazma fırsatı; iktidar ve vazgeçiş.', color: '#c38e6d', boss: 'İlk Dokuyucu', environment: 'Gökyüzünde bir dikiş sökülüyor. Her ilmekten başka bir sabah düşüyor.', music: '96 BPM; ilk perde motifinin bozulmuş hali, viyolonsel ostinatosu, finalde sessizlik.' },
] as const;
export interface EncounterDefinition {
  id: string; act: number; name: string; rank: 'combat' | 'elite' | 'boss'; archetype: EnemyArchetypeId;
  hp: number; damage: number; pattern: EnemyAction[]; secondPhase?: EnemyAction[];
  identity: string; intro: string; phaseLine?: string; defeat: string;
}
const attack = (damage: number, postureDamage = 18): EnemyAction => ({ kind: 'attack', damage, postureDamage });
const guard = (block: number): EnemyAction => ({ kind: 'defend', block, postureCostOnBlock: 15 });
const magic = (damage: number): EnemyAction => ({ kind: 'magic', damage, isRanged: true });
export const encounters: EncounterDefinition[] = [
  { id: 'road-scavenger', act: 1, name: 'Kervan Artçısı', rank: 'combat', archetype: 'goblin', hp: 18, damage: 0, pattern: [attack(4), guard(3), attack(6)], identity: 'Yeşil başlık, boş bakır kazan; saldırı-savunma-ağır saldırı.', intro: 'Kazanı görüyorsun ya, üç gündür boş. Yol parası istemiyorum. Yalnızca burada hâlâ birinin yaşadığını hatırlamanı istiyorum.', defeat: 'Kazanın dibini kazıdım sanıyordum. Meğer sesini özlemişim. Git; seni kötü hatırlamayacağım.' },
  { id: 'rope-keeper', act: 1, name: 'İp Nöbetçisi', rank: 'combat', archetype: 'guardian', hp: 23, damage: 0, pattern: [guard(5), attack(5), attack(4)], identity: 'Halatla sarılı zırh; 5 bloktan sonra iki yakın vuruş.', intro: 'Köprünün ipini ben tutuyorum. Bırakırsam sadece sen düşmezsin. Öte yakadakileri görmüyorsun ama ağırlıkları hâlâ ellerimde.', defeat: 'Ellerim açılıyor. İpi alacaksan sıkı tut; geçmekle taşımak aynı şey değil.' },
  { id: 'ash-herbalist', act: 1, name: 'İs Otacısı', rank: 'combat', archetype: 'mage', hp: 19, damage: 0, pattern: [{ kind: 'poison', poison: 1 }, magic(4), { kind: 'heal', damage: 3 }], identity: 'İsli şişeler; zehir-büyü-şifa.', intro: 'Bu ot eskiden yarayı kapatırdı. Şimdi yaranın nerede olduğunu hatırlatıyor. İkisine de şifa diyenler var.', defeat: 'Şişeyi kırma. İçinde zehir kadar panzehir de var; farkı, ne kadarını içtiğin.' },
  { id: 'toll-butcher', act: 1, name: 'Haraç Kesicisi', rank: 'elite', archetype: 'knight', hp: 36, damage: 1, pattern: [attack(7, 28), guard(6), attack(9, 35)], identity: 'Bakır maske; yüksek denge baskısı.', intro: 'Geçidin hesabını tutarım. Bir isim silinirse yerine bir borç yazılır. Senin hanen düşündüğünden eski.', defeat: 'Defteri al. Sayfalar altından değerli; isimlerin gerçek sahiplerini bulabilirsen.' },
  { id: 'bell-warden', act: 1, name: 'Çan Bekçisi', rank: 'boss', archetype: 'guardian', hp: 48, damage: 0, pattern: [guard(6), attack(6), attack(8)], secondPhase: [magic(7), attack(9, 30), guard(4)], identity: 'Göğsünde çatlak çan; %50 altında büyü eklenir.', intro: 'Çanı çalarsam herkes kendi adını hatırlayacak. Ama sesin ulaşması için bu kapının bir kez daha kapanması gerek. İçeride kim kalacak?', phaseLine: 'Duydun mu? Çatlak büyüdü. Bunca yıldır insanları değil, o son sesi içeride tutuyormuşum. Artık ben de durduramam.', defeat: 'Çanın içinde senin sesin vardı. Veyra onu bana emanet etti. Cam Arşiv’de onu bul; neden sustuğunu o biliyor. Benim adım Aras… bunu burada bırak.' },
  { id: 'glass-clerk', act: 2, name: 'Cam Kâtibi', rank: 'combat', archetype: 'mage', hp: 25, damage: 0, pattern: [{ kind: 'weaken' }, magic(6), guard(4)], identity: 'Mürekkep parmaklar; güçsüzlük ve uzaktan hasar.', intro: 'Burada hatıraları alfabetik sıralarız. Kaybolan insanlar mı? Onlar iade edilmeyen kitaplar hanesinde.', defeat: 'Fişini yırtacağım. Seni hiç görmedim. Bazen bir kâtibin yapabileceği en iyi şey budur.' },
  { id: 'mirror-thief', act: 2, name: 'Yüz Hırsızı', rank: 'combat', archetype: 'assassin', hp: 23, damage: 0, pattern: [attack(6), { kind: 'poison', poison: 2 }, attack(7)], identity: 'Aynadan yarım yüz; zehirli aralık.', intro: 'Bu yüz benim değil. Ama onu senden iyi taşıyacağıma söz verebilirim. Asıl sahibi de aynı itirazı etmişti.', defeat: 'Yüzümü geri istiyorum… Hangisinin benim olduğunu söyleyebilir misin?' },
  { id: 'archive-armour', act: 2, name: 'Raf Zırhı', rank: 'combat', archetype: 'guardian', hp: 31, damage: 0, pattern: [guard(7), attack(7, 26), { kind: 'heal', damage: 4 }], identity: 'Kitap sırtlarından zırh; blok-vuruş-şifa.', intro: 'Sessiz ol. Raflarda uyuyanların bazıları son rüyalarını görüyor. Onları uyandırırsan senin hayatını rüya sanacaklar.', defeat: 'Bir kitabı açık bırak. Son sayfayı kimse tek başına çevirmesin.' },
  { id: 'index-hunter', act: 2, name: 'Dizin Avcısı', rank: 'elite', archetype: 'assassin', hp: 42, damage: 0, pattern: [magic(8), attack(9, 32), { kind: 'poison', poison: 2 }], identity: 'Gümüş sayfa bıçakları; büyü-yakın-zehir.', intro: 'İsmin dizinden çıkarılmış. Bu bir hata değil, davet. Seni kimin çağırdığını öğrendiğinde geri dönmek isteyeceksin.', defeat: 'Dizinde bir boşluk var. Üç mühürle oraya kendi adını yazabilirsin. Ama sonra kimse seni hatırlamayacak.' },
  { id: 'veyra', act: 2, name: 'Aynacı Veyra', rank: 'boss', archetype: 'mage', hp: 60, damage: 0, pattern: [magic(7), guard(7), { kind: 'weaken' }], secondPhase: [attack(10, 32), magic(9), { kind: 'heal', damage: 5 }], identity: 'Çatlak aynalar; %50 altında 2 Yansıma, yakın saldırı açılır.', intro: 'Aras çanı susturdu demek. Beni hırsız sanarak geldin. Sana sesini geri verebilirim; ama hatırladığında beni affetmeyeceksin.', phaseLine: 'Sesini ben çalmadım. “Kız kardeşimin adını silme; benimkini al,” dedin. İlk Dokuyucu sendin. Tahttaki, vazgeçemediğin parçan. Ben kurtardığın kardeşinim.', defeat: 'Adım Veyra. Bunu ikinci kez unutma. Kül Tahtı’na git; seni oraya geri getirmek için bıraktığım üç mührü ara. Bu kez dünyayı değil, düğümü çöz.' },
  { id: 'cinder-pilgrim', act: 3, name: 'Kül Hacısı', rank: 'combat', archetype: 'goblin', hp: 30, damage: 0, pattern: [attack(7), magic(8), guard(5)], identity: 'Kül pelerini; karışık hasar.', intro: 'Tahta yürüyen herkes bir şey taşır. Ben bir avuç kül getirdim. Senin ellerin boş ama omuzların benimkinden ağır.', defeat: 'Külü rüzgâra bırak. Bir yerlerde hâlâ toprak vardır.' },
  { id: 'oath-remnant', act: 3, name: 'Yemin Enkazı', rank: 'combat', archetype: 'knight', hp: 37, damage: 0, pattern: [guard(8), attack(9, 30), attack(8)], identity: 'Boş zırh; iki vuruşluk kuşatma.', intro: 'İçimde kimse yok. Yine de sözüm geçerli. Bunun acıklı olduğunu düşünme; bazı insanlar boşalmadan önce de böyle yaşar.', defeat: 'Sonunda… bir sözün de sonu varmış.' },
  { id: 'ember-scribe', act: 3, name: 'Köz Mürettibi', rank: 'combat', archetype: 'mage', hp: 32, damage: 0, pattern: [{ kind: 'poison', poison: 3 }, magic(8), { kind: 'heal', damage: 5 }], identity: 'Kor kalem; yüksek zehir.', intro: 'Yarınki dünyayı diziyorum. Sana bir satır ayırdım. Nokta mı olmak istersin, soru işareti mi?', defeat: 'Satırını boş bırakıyorum. İlk kez doğru bir düzeltme yaptım.' },
  { id: 'nameless-heir', act: 3, name: 'Adsız Vâris', rank: 'elite', archetype: 'knight', hp: 50, damage: 0, pattern: [attack(10, 35), guard(9), magic(10)], identity: 'Taçsız hükümdar; üç disiplin.', intro: 'Tahtın vârisi olmak için bir isim gerekmez. Başkalarının isimlerini silmeye razı olmak yeter. Sen de buraya kadar geldin.', defeat: 'Taç bana hiç oturmadı. Sen deneyeceksen önce içindeki dikenlere bak.' },
  { id: 'first-weaver', act: 3, name: 'İlk Dokuyucu', rank: 'boss', archetype: 'mage', hp: 76, damage: 0, pattern: [magic(9), guard(8), attack(10, 30)], secondPhase: [magic(11), attack(12, 38), { kind: 'heal', damage: 6 }], identity: 'Yüz yerine boş ilmek; %50 altında güç artışı.', intro: 'Veyra sana gerçeği söyledi. Ben senin düşmanın değilim; bıraktığın emrim. Bir kişiyi kurtarmak için dünyayı yarım bıraktın. Şimdi tamamla.', phaseLine: 'Yolda bağışladığın her isim elimden bir ilmek aldı. Aldığın her hatıra beni besledi. Beni kılıcınla değil, buraya gelirken seçtiklerinle yazdın.', defeat: 'Artık emir yok. İlmek senin. Veyra’nın adını koruduğun gibi başkalarınınkini de koruyabilecek misin?' },
];

export const endings: Record<EndingId, { title: string; text: string; condition: string }> = {
  dawn: { title: 'İsimlerin Şafağı', text: 'İpliği kesiyorsun. Unutulanlar isimlerini geri alıyor. Sesin dönmüyor; artık bunu eksiklik saymıyorsun. Bir çocuk seni tanımadan elini tutuyor.', condition: 'Son boss yenildi; merhamet ≥ 3 ve yozlaşma ≤ 2.' },
  throne: { title: 'Yeni Dokuyucu', text: 'İpliği bileğine doluyorsun. Dünya düzeliyor; senin istediğin gibi. İlk silinen isim, sana itiraz edenin oluyor. Taht artık boş değil.', condition: 'Son boss yenildi; diğer sonların şartları sağlanmadı.' },
  unwritten: { title: 'Yazılmamış Sayfa', text: 'Üç mührü üst üste koyuyorsun. Kapının ardında bir düşman değil, seni yazan el var. Kalemi masaya bırakıyorsun. Bu kez kimse kimseyi oynamıyor.', condition: 'Son boss yenildi; üç farklı perde mührü, merhamet ≥ 5, yozlaşma = 0.' },
};
