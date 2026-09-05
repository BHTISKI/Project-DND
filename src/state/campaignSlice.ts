import type { GameState } from './store';
import { classes, type ClassId } from '../content/campaign';
import { relics } from '../content/relics';
import { campaignChoice, unlockedClass } from '../engine/campaignResolver';
import { sampleCardDefs } from '../types/game';
import { generateRandomId } from '../utils/id';

export interface CampaignActions {
  configureCampaign: (classId: ClassId, ascension: number) => void;
  chooseCampaignOutcome: (choice: 'mercy' | 'plunder') => void;
  chooseRelic: (id: string) => void;
}
// Dilim yalnız eylem üretir; atomik kayıt ve çakışma denetimi ana store'da kalır.
export function createCampaignActions(update: (resolve: (state: GameState) => GameState) => void): CampaignActions {
  return {
    configureCampaign: (classId, ascension) => update(s => {
      if (!s.campaign || s.campaign.configured || s.runFloor !== 0 || s.gamePhase !== 'mapSelection' || !unlockedClass(classId, s.metaVictories)) return s;
      if (!Number.isInteger(ascension) || ascension < 0 || ascension > Math.min(5, Math.floor(s.metaVictories / 6))) return s;
      const profile = classes.find(c => c.id === classId)!;
      const names = classId === 'weaver' ? ['Yolcunun Kesiti', 'Yolcunun Kesiti', 'Hızlı Saldırı', 'Kervan Siperi', 'Adını Koru', 'Sessiz Adım', 'Yarım Hatıra']
        : classId === 'warden' ? ['Yolcunun Kesiti', 'Kırık Mızrak', 'Hızlı Saldırı', 'Kervan Siperi', 'Eşik Nöbeti', 'Paslı Diken', 'Sessiz Adım']
        : ['Kül Çiziği', 'Yolcunun Kesiti', 'Hızlı Saldırı', 'Kervan Siperi', 'Adını Koru', 'İsli Nefes', 'Kor Avucu'];
      const cards = names.map(name => ({ ...sampleCardDefs.find(card => card.isim === name)!, id: generateRandomId() }));
      return { ...s, player: { ...s.player, mevcutCan: profile.hp, maksimumCan: profile.hp, hasarBonusu: profile.damage },
        hand: cards.slice(0, 5), deck: cards.slice(5), discardPile: [], exhaustedPile: [],
        campaign: { ...s.campaign, configured: true, classId, ascension, journal: ['Sesini bir ismi kurtarmak için verdin. Elindeki kartlar, söyleyemediğin cümlelerin hatıraları.'] } };
    }),
    chooseCampaignOutcome: choice => update(s => campaignChoice(s, choice)),
    chooseRelic: id => update(s => {
      if (!s.campaign || !s.campaign.relicOffers.includes(id) || !relics.some(r => r.id === id) || s.campaign.relics.includes(id)) return s;
      return { ...s, campaign: { ...s.campaign, relics: [...s.campaign.relics, id], relicOffers: [],
        journal: [...s.campaign.journal, `${relics.find(r => r.id === id)!.name} emanetini aldın.`].slice(-60) } };
    }),
  };
}
