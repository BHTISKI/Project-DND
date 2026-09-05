export type DialogueTrigger = 'poison' | 'hp75' | 'hp50' | 'hp25' | 'unhurt' | 'heavy' | 'aggressive' | 'patient';
export type Emotion = 'wary' | 'angry' | 'afraid' | 'sad' | 'resolute';
export interface EnemyDialogueLine { trigger: DialogueTrigger; text: string; emotion: Emotion; priority: number; condition?: { minimumAttackRatio: number } }
export interface EnemyVoice { personality: string; color: string; lines: EnemyDialogueLine[] }
const triggers: DialogueTrigger[] = ['poison', 'hp75', 'hp50', 'hp25', 'unhurt', 'heavy', 'aggressive', 'patient'];
function voice(personality: string, color: string, texts: string[]): EnemyVoice {
  return { personality, color, lines: texts.map((text, i) => ({ trigger: triggers[i], text,
    emotion: i === 3 ? 'afraid' : i === 5 ? 'angry' : i === 7 ? 'sad' : 'wary', priority: i === 3 ? 80 : i === 5 ? 70 : 40,
    ...(i === 6 ? { condition: { minimumAttackRatio: .65 } } : {}) })) };
}
export const enemyVoices = {
  scavenger: voice('Alayını korkusuna siper eden aç bir sağ kalan', '#92703f', [
    'Zehir mi? Kazanımda yiyecek yokken kanımda ziyafet var!',
    'İlk kan benden. Geçiş ücretini fazla ciddiye aldın.',
    'Yarısını aldın. Kalan yarımla pazarlık edebilir miyiz?',
    'Çan Bekçisi benim adımı biliyor. Ona kazanı sakladığımı söyle.',
    'Bir çizik bile yok! Bana da o numarayı öğret; ekmeği bölüşürüz.',
    'Tamam! Kazana vurma, bana vur. Ondan başka evim yok.',
    'Hep kesiyorsun. Bizi buradan sürenler de dinlemezdi.',
    'Kalkanın arkasında sakladığın şey… Birini mi koruyorsun?',
  ]),
  keeper: voice('Emirle vicdanı arasında sıkışmış nöbetçi', '#707e83', [
    'Zırhımın altına sızdın. Emirler de böyle girmişti.',
    'Bir adım attın. Geçmene izin verdiğimi sanma.',
    'Nöbetin yarısı korkudur. Kalan yarısının adını unuttum.',
    'Cam Arşiv’e git. Veyra nöbet defterinde senin adını arıyor.',
    'Sağlam bir savunma. Keşke o gece kapımızda sen olsaydın.',
    'Demiri eğdin. Yeminimi de böyle kırabilir misin?',
    'Gücü emir sanıyorsun. Ben de o hatayla bir ömür bekledim.',
    'Önce koruyor, sonra vuruyorsun. Nöbet tutmayı kim öğretti sana?',
  ]),
  alchemist: voice('Şifayla zehri aynı dilde anlatan yorgun hekim', '#798753', [
    'Kendi ilacım… Acıyı tanıdım. Ölçüyü kimden öğrendin?',
    'Yara taze. Henüz ne kaybettiğini bilmiyor.',
    'Yarım şişe, yarım ömür. Hangisini tamamlamaya geldin?',
    'Çanın sesi panzehir değil. Unutulan yaranın yerini gösterir.',
    'Hiç yara yok. İlk kez bir tedaviye gerek kalmadı.',
    'Kemik böyle ses verir. Duyup da unutabileceğini sanma.',
    'Hep aynı reçete: daha çok kesmek. Her derde iyi gelmez.',
    'Sabır da ilaçtır. Ama şişenin dibinde korku varsa zehre döner.',
  ]),
  thief: voice('Başkasının yüzünün arkasında kendi adını arayan kaçak', '#907ba5', [
    'Bu yüzü yakma! Acı onun, korku benim.',
    'Bir çizik daha. Aynada hangimizin izi kalacak?',
    'Yüzümün yarısını aldın. Altındaki beni tanıyor musun?',
    'Veyra senden bir yüz çalmadı. Sen ona kendi sesini bıraktın.',
    'Sana dokunamadım. Demek hâlâ kendine ait bir yanın var.',
    'Maske çatladı! Bakma… Daha hazır değilim.',
    'Sözleşmemde böyle yazıyordu: susar, vurur, hiç durmaz.',
    'Bekliyorsun. Beni yüzümden değil hamlemden tanımaya çalışıyorsun.',
  ]),
  knight: voice('İhanete uğramış, gururunu bırakamayan eski yoldaş', '#a47756', [
    'Düello böyle bitmez. Ama savaşlar hep böyle bitti.',
    'İyi bir kesik. Hocanı anımsıyorum; adını değil.',
    'Bu hareket… Yan yana savaştığımız gece de yapmıştın.',
    'Tahttaki seni beklemiyor. Senin yeniden o olmanı bekliyor.',
    'Temiz savunma. Sana bu yüzden arkamı dönmüştüm.',
    'Diz çökerim. Boyun eğdiğimi düşünme.',
    'Sen de tıpkı ilk hükümdar gibi: her soruya bir kılıç.',
    'Kılıcı bekletebiliyorsun. Belki o geceden beri değişmişsindir.',
  ]),
  weaver: voice('Kendi suçunu mantıkla haklı çıkaran sakin dokuyucu', '#947d9c', [
    'Bir hatırayı zehirledin. Onu hatırlayan herkese yayılır.',
    'Bir ilmek söküldü. Ellerinin bu işi bildiğini görüyorsun.',
    'Acıya şaşırma. Yarattığın dünyanın içinde sen de varsın.',
    'Bitirmeden karar ver: kimseyi silmeden bir dünya kurabilir misin?',
    'Kendini korudun. Bir sonraki sayfada başkasına da yer aç.',
    'Bu kuvveti tanıyorum. İlk düğümü de böyle sıkmıştın.',
    'Her kartın saldırı. Yeni dünyanın ilk cümlesi yine bir emir mi?',
    'Söylemeden önce düşünüyorsun. Bu sessizlik eskisinden farklı.',
  ]),
} satisfies Record<string, EnemyVoice>;
export function voiceFor(archetype: string, encounterId?: string | null): EnemyVoice {
  if (encounterId === 'veyra' || encounterId === 'first-weaver' || encounterId === 'ember-scribe') return enemyVoices.weaver;
  const mapping: Record<string, keyof typeof enemyVoices> = { goblin: 'scavenger', guardian: 'keeper', mage: 'alchemist', assassin: 'thief', knight: 'knight' };
  return enemyVoices[mapping[archetype] ?? 'weaver'];
}
