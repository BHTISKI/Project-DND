import type { GameState } from '../state/store';
import type { EnemyArchetypeId } from '../types/game';
import { encounters } from '../content/campaign';
import { voiceFor, type DialogueTrigger, type Emotion } from '../content/enemyVoices';

export interface NpcLine { text: string; timestamp: number; story?: boolean; emotion?: Emotion; trigger?: DialogueTrigger }
const stories: Record<EnemyArchetypeId, { intro: string[]; turns: string[]; defeat: string[]; victory: string }> = {
  mage: {
    intro: ['Asanın ucundaki ışığa bakma. İnsan orada görmek istediğini görür; ben bir zamanlar eve dönen yolu görmüştüm.', 'Bu geçidin taşlarına isimler yazılıydı. Her gelen birini sildi, her giden kendininkini bıraktı. Şimdi kimse kimi beklediğini hatırlamıyor.', 'Sen konuşmuyorsun. İyi. Burada verilen sözler, kılıç yaralarından daha uzun yaşar. Bakalım sessizliğin seni nereye taşıyacak.'],
    turns: ['Bu büyüyü ustamdan öğrenmedim. Onun son hatasını yıllarca izledim; bazen bir ders böyle verilir.', 'Yolun sonunda bir kapı bulursan hemen açma. Ardından gelen ses tanıdık olsa bile önce kendi adını hatırla.', 'Ben de bir zamanlar yalnızca geçmek istiyordum. Sonra nöbeti devraldım. Kimse bunun bir seçim olduğunu söylemedi.'],
    defeat: ['Demek ışığın gösterdiği gelecek bu değilmiş. İlk kez yanılmasına seviniyorum.', 'İleride taş bir eşik göreceksin. Üzerindeki ismi silme. Biri hâlâ onun geri dönmesini bekliyor.'],
    victory: 'Dinlen şimdi. Bu yol sabırlıdır; seni de beni beklediği kadar bekler.',
  },
  goblin: {
    intro: ['Dur! Bu yoldan geçmenin bir bedeli var. Yok, altın değil… Gerçi altının varsa onu da konuşabiliriz.', 'Eskiden burada kervanlar dururdu. Ateş yakılır, kazan kaynardı. Şimdi taşların arasından çıkan otları bile paylaşamıyoruz.', 'Elindeki kartlara bakılırsa yiyecek getirmedin. Pekâlâ. Ben de nazik davranacağıma söz vermedim.'],
    turns: ['Beni küçük gördüğünü biliyorum. Kervancıların hepsi öyle bakardı. Keselerinin eksildiğini fark edene kadar.', 'Şu arkamdaki yol var ya, geceleri başka yere çıkar. Gülme. Gidenlerin ayak izleri geri dönüyor, kendileri dönmüyor.', 'Kazanı hâlâ saklıyorum. Belki bir gün yine biri durur da önce kılıcını değil, ekmeğini çıkarır.'],
    defeat: ['Tamam, tamam! Yol senin. Zaten bu nöbetin ücretini de kimse ödemiyor.', 'Yalnız geceye kalma. Ben seni korkutmaya çalıştım; oradakilerin böyle bir derdi yok.'],
    victory: 'Sana dur demiştim. Şimdi kıpırdama; yarayı bağlayacak bez bulayım.',
  },
  guardian: {
    intro: ['Bu eşikten izinsiz geçilmez. Mührünü göster… Yok mu? O zaman burada kalacaksın.', 'Emri verenler yıllar önce gittiler. Ama ardında bıraktıkları kapı hâlâ burada. Ben de öyle.', 'Neden beklediğimi sorma. Bir nöbetin bitmesi için birinin geri dönmesi gerekir.'],
    turns: ['Kalkanımdaki her çentik bir geçiş talebi. Bazılarını hâlâ isimleriyle hatırlıyorum.', 'Senin gibi sessiz biri gelmişti. Silahını indirmemi istemedi; yalnızca kapının ardında ne olduğunu sordu.', 'Ona cevap veremedim. Bunca yıldır koruduğum şeyi bir kez bile görmedim.'],
    defeat: ['Nöbet… burada bitiyor demek.', 'Kapıyı açarsan içeride kim olduğunu bana söyle. Hâlâ duyabilecek kadar yakın olacağım.'],
    victory: 'Daha fazla yaklaşma. Görevim yolu tutmak; mezarını kazmak değil.',
  },
  assassin: {
    intro: ['Ayak seslerini çok önce duydum. Beklediğim kadar aceleci değilsin.', 'Bana bir isim verdiler, bir de yol tarifi. Genellikle fazlasını sormam. Bu kez ücretin yarısı bile gelmedi.', 'İşin tuhafı, seni tarif ederken yüzünden hiç söz etmediler. Yalnızca susacağını söylediler.'],
    turns: ['Birinin seni bu kadar iyi tanıması hoşuna gider mi? Ben olsam arkamı daha sık kontrol ederdim.', 'Her işin bir çıkış yolu vardır. Bu geçitte benimkini de kapatmışlar.', 'Buradan sağ çıkan kim olursa olsun, aynı kişiye bir soru borçlu olacak.'],
    defeat: ['İş burada bitti. Benim için, en azından.', 'Seni arayanın mühründe kırık bir halka vardı. O işareti görürsen sırtını dönme.'],
    victory: 'Sözleşme susmanı istiyordu. Ölmeni değil. Bugün ikimiz de şanslıyız.',
  },
  knight: {
    intro: ['Silahını hazırla yolcu. Bu karşılaşmanın bir tanığı olmayacak; yine de usulüne uygun davranacağım.', 'Bu armayı taşıyan son kişi benim. Bir zamanlar bir yemin demekti; şimdi insanlar yalnızca lekelerine bakıyor.', 'Benimle dövüşürken geçmişimi değil, elimdeki kılıcı izle. İkisi de ağırdır ama yalnızca biri sana ulaşabilir.'],
    turns: ['Bana geri çekilmeyi öğretmediler. Sonra bir gün herkes çekildi; dersini ben tek başıma aldım.', 'Zaferin her şeyi düzelttiğine inanıyorsan, savaş bitince etrafına iyi bak.', 'Bir yemin insanı ayakta tutabilir. Çok uzun sürerse dizlerini kilitler.'],
    defeat: ['Kılıcını indir. Sonucu kabul ediyorum.', 'Armayı burada bırakacağım. Belki yolun kalanını kendi adımla yürürüm.'],
    victory: 'Bu kadar yeter. Cesaretini kanıtladın; devam etmek yalnızca onu boşa harcamak olur.',
  },
};

export function withNpcDialogue(previous: GameState, next: GameState): GameState {
  if (next === previous) return next;
  const script = stories[next.enemyArchetype];
  const encounter = encounters.find(e => e.id === next.campaign?.encounterId);
  const lines = (texts: string[], story = true): NpcLine[] => texts.map((text, i) => ({ text, story, timestamp: Date.now() + i }));
  let queue = next.enemyDialog;
  if (next.gamePhase === 'combat' && (previous.gamePhase !== 'combat' || previous.enemy.id !== next.enemy.id)) {
    queue = lines(encounter ? [encounter.intro] : script.intro);
  } else if (previous.gamePhase === 'combat' && next.gamePhase !== 'combat') {
    queue = lines(next.player.mevcutCan <= 0 ? [script.victory] : encounter
      ? [...(encounter.id === 'veyra' && !previous.campaign?.bossPhase && encounter.phaseLine ? [encounter.phaseLine] : []), encounter.defeat] : script.defeat);
  } else if (next.gamePhase === 'combat') {
    if (next.campaign?.bossPhase && !previous.campaign?.bossPhase && encounter?.phaseLine) {
      return { ...next, campaign: { ...next.campaign, journal: [...next.campaign.journal, `${next.enemy.isim}: “${encounter.phaseLine}”`].slice(-60) },
        playerDialog: [], enemyDialog: [...lines([encounter.phaseLine]), ...queue.filter(line => line.story)] };
    }
    const profile = voiceFor(next.enemyArchetype, encounter?.id);
    const candidates: DialogueTrigger[] = [];
    for (const [threshold, trigger] of [[.75, 'hp75'], [.5, 'hp50'], [.25, 'hp25']] as const)
      if (previous.enemy.mevcutCan > next.enemy.maksimumCan * threshold && next.enemy.mevcutCan <= next.enemy.maksimumCan * threshold) candidates.push(trigger);
    const poison = (s: GameState) => s.enemyStatuses.filter(e => e.id === 'poisoned').reduce((n, e) => n + e.stacks, 0);
    if (poison(next) > poison(previous)) candidates.push('poison');
    if (previous.enemy.mevcutCan - next.enemy.mevcutCan >= 12) candidates.push('heavy');
    if (next.round > previous.round && previous.enemyIntent?.estimatedDamage && next.player.mevcutCan === previous.player.mevcutCan) candidates.push('unhurt');
    if (next.round === previous.round && next.hand.length < previous.hand.length) {
      const deck = [...previous.hand, ...previous.deck, ...previous.discardPile, ...previous.exhaustedPile];
      const attackRatio = profile.lines.find(line => line.trigger === 'aggressive')?.condition?.minimumAttackRatio ?? .65;
      if (deck.filter(c => c.tip === 'saldırı').length / Math.max(1, deck.length) >= attackRatio) candidates.push('aggressive');
      if (next.playerBlock > previous.playerBlock) candidates.push('patient');
    }
    const reaction = profile.lines.filter(line => candidates.includes(line.trigger)).sort((a, b) => b.priority - a.priority)[0];
    if (reaction && !queue.some(line => line.text === reaction.text)) {
      // Keep an unread story, but show the current reaction instead of stale battle chatter.
      const spoken = { text: reaction.text, timestamp: Date.now(), story: false, emotion: reaction.emotion, trigger: reaction.trigger };
      queue = [...queue.filter(line => line.story), spoken];
      return { ...next, playerDialog: [], enemyDialog: queue };
    }
    let text: string | undefined;
    if (!previous.enemy.isBroken && next.enemy.isBroken) text = 'Dengemi bozdun… Ama bu yolun benden sonra da devam ettiğini unutma.';
    else if (previous.enemy.mevcutCan > next.enemy.maksimumCan * .3 && next.enemy.mevcutCan <= next.enemy.maksimumCan * .3) text = 'Nefesim daralıyor. Söylemem gerekenleri daha fazla erteleyemem.';
    else if (next.round > previous.round && next.round <= 4) text = script.turns[next.round - 2];
    else if (next.round > previous.round && next.round % 3 === 0) text = previous.playerBlock > 0 ? 'Bekliyorsun. İnsan bazen en çok, hiçbir şey yapmadığında kendini ele verir.' : 'Hamlelerin değişiyor. Bu karşılaşmadan ikimiz de başladığımız gibi çıkmayacağız.';
    if (text && !queue.some(line => line.text === text)) queue = [...queue, ...lines([text], false)];
  }
  const journal = encounter && next.campaign && previous.gamePhase === 'combat' && next.gamePhase !== 'combat' && next.player.mevcutCan > 0
    ? { ...next.campaign, journal: [...next.campaign.journal, ...queue.map(line => `${next.enemy.isim}: “${line.text}”`)].slice(-60) } : next.campaign;
  return { ...next, campaign: journal, playerDialog: [], enemyDialog: queue };
}
