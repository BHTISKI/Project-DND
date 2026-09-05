import type { GameState } from '../state/store';
import type { Card, EnemyAction, EnemyIntent, EnemyTelegraph, NodeType } from '../types/game';
import { acts, encounters, initialCampaign, type CampaignRun, type ClassId, type EndingId } from '../content/campaign';
import { relics } from '../content/relics';
import { sampleCardDefs } from '../types/game';
import { initialPosture, withEnemyPosture } from '../mechanics/posture';
import { shuffle } from '../utils/game';
import { generateRandomId } from '../utils/id';
import { addStatus } from './statuses';
import { restoreExhausted } from '../mechanics/exhaust';
import { triggerRelics } from './relicResolver';

export const actNumber = (floor: number) => Math.min(3, Math.floor(floor / 6) + 1);
export function campaignNodes(floor: number, random = Math.random): GameState['availableNodes'] {
  if (floor % 6 === 5) return [{ id: `chapter-${floor}-boss`, type: 'boss' }];
  const roll = random();
  const optional: NodeType = roll < .4 ? 'event' : roll < .65 ? 'rest' : roll < .85 ? 'shop' : 'elite';
  const types: NodeType[] = floor % 6 === 4 ? ['rest', 'elite', 'shop'] : ['combat', optional, optional === 'event' ? 'shop' : 'event'];
  return types.map((type, i) => ({ id: `chapter-${floor}-${type}-${i}`, type }));
}
export function campaignEncounter(state: GameState, rank: 'combat' | 'elite' | 'boss'): GameState {
  const campaign = state.campaign ?? initialCampaign();
  const act = actNumber(state.runFloor);
  const pool = encounters.filter(e => e.act === act && e.rank === rank);
  const encounter = pool[state.runFloor % pool.length];
  const hp = Math.ceil(encounter.hp * (1 + .04 * (state.runFloor % 6) + .08 * campaign.ascension));
  return { ...state, enemyArchetype: encounter.archetype, enemyBehavior: 'standard', enemyCanLie: false,
    enemy: { id: `${encounter.id}-${state.runFloor}`, isim: encounter.name, mevcutCan: hp, maksimumCan: hp,
      hasarBonusu: encounter.damage + Math.floor(campaign.ascension / 2), ...initialPosture(encounter.archetype, rank) },
    campaign: { ...campaign, encounterId: encounter.id, bossPhase: false, usedRelics: [], choicePending: false,
      journal: [...campaign.journal, `${acts[act - 1].name}: ${encounter.name} ile karşılaşıldı.`].slice(-60) } };
}
export function campaignDecision(state: GameState): { action: EnemyAction; telegraph: EnemyTelegraph; reason?: string } | null {
  const definition = encounters.find(e => e.id === state.campaign?.encounterId);
  if (!definition || !state.campaign) return null;
  const pattern = state.campaign.bossPhase && definition.secondPhase ? definition.secondPhase : definition.pattern;
  const base = pattern[(state.round - 1) % pattern.length];
  const action: EnemyAction = withEnemyPosture({ ...base,
    ...(base.damage !== undefined ? { damage: base.damage + (base.kind === 'heal' ? 0 : state.enemy.hasarBonusu) } : {}) }, state.enemyArchetype);
  const type: EnemyIntent['type'] = action.kind === 'defend' ? 'defend' : action.kind === 'attack' ? 'attack' : 'special';
  const labels: Partial<Record<EnemyAction['kind'], string>> = { attack: 'Yakın saldırı', magic: 'Mühür patlaması', defend: 'Siper kuruyor', poison: 'Zehir hazırlıyor', weaken: 'Güçsüzlük mührü', heal: 'Yarasını sarıyor' };
  return { action, telegraph: { type, label: labels[action.kind] ?? 'Hazırlanıyor', icon: type === 'attack' ? '⚔' : type === 'defend' ? '◈' : '✦' }, reason: state.campaign.bossPhase ? 'İkinci evre: saldırı düzeni değişti.' : undefined };
}
export function campaignPhase(state: GameState): GameState {
  const c = state.campaign;
  const enemy = encounters.find(e => e.id === c?.encounterId);
  if (!c || c.bossPhase || !enemy?.secondPhase || state.enemy.mevcutCan <= 0 || state.enemy.mevcutCan > state.enemy.maksimumCan / 2) return state;
  return { ...state, campaign: { ...c, bossPhase: true },
    enemyStatuses: enemy.id === 'veyra' ? addStatus(state.enemyStatuses, { id: 'reflection', duration: 99, stacks: 2 }) : state.enemyStatuses,
    battleLogs: [...state.battleLogs, `${enemy.name}: ikinci evre açıldı.`] };
}
export function chooseEnding(c: CampaignRun): EndingId {
  if (c.seals.length === 3 && c.mercy >= 5 && c.corruption === 0) return 'unwritten';
  return c.mercy >= 3 && c.corruption <= 2 ? 'dawn' : 'throne';
}
export function campaignRewards(state: GameState, random = Math.random): { cards: Card[]; misses: number } {
  const c = state.campaign!;
  const cards: Card[] = [];
  let misses = c.rareMisses;
  const pool = sampleCardDefs.filter(card => !card.isCursed);
  for (let i = 0; i < 3; i++) {
    const roll = random();
    const rarity = misses >= 5 || state.nodeType === 'boss' && i === 0 || roll < .08 ? 'rare' : roll < .38 ? 'uncommon' : 'common';
    const candidates = pool.filter(card => card.rarity === rarity && !cards.some(picked => picked.isim === card.isim));
    const chosen = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
    if (chosen) cards.push({ ...chosen, id: generateRandomId() });
    misses = rarity === 'rare' ? 0 : misses + 1;
  }
  return { cards, misses };
}
export function campaignVictory(state: GameState): GameState {
  const c = state.campaign!;
  const reward = campaignRewards(state);
  const boss = state.nodeType === 'boss';
  const end = boss && actNumber(state.runFloor) === 3;
  const offers = state.nodeType === 'elite' || boss ? shuffle(relics.filter(r => !c.relics.includes(r.id))).slice(0, 3).map(r => r.id) : [];
  const nextCampaign = { ...c, rareMisses: reward.misses, choicePending: !end, relicOffers: end ? [] : offers,
    ending: end ? chooseEnding(c) : null, journal: [...c.journal, `${state.enemy.isim} yenildi.`].slice(-60) };
  return triggerRelics({ ...state, ...restoreExhausted(state), campaign: nextCampaign,
    gamePhase: 'mapSelection', runFloor: state.runFloor + 1, availableNodes: campaignNodes(state.runFloor + 1),
    victoryCount: state.victoryCount + 1, metaVictories: state.metaVictories + 1, metaGold: state.metaGold + (end ? 50 : 10),
    gold: state.gold + (boss ? 55 : state.nodeType === 'elite' ? 35 : 22), rewardOptions: end ? [] : reward.cards,
    currentNode: null, nodeType: null, enemyIntent: null, baseEnemyIntent: null, enemyIntentValue: 0,
    player: { ...state.player, currentPosture: 0, isBroken: false }, playerBlock: 0, enemyBlock: 0,
    playerStatuses: [], enemyStatuses: [], playerDialog: [], enemyDialog: [],
    battleLogs: [...state.battleLogs, `${state.enemy.isim} yenildi. Yolun kaderi elinde.`] }, 'victory');
}
export function campaignChoice(state: GameState, choice: 'mercy' | 'plunder'): GameState {
  if (!state.campaign?.choicePending || !['mercy', 'plunder'].includes(choice)) return state;
  const c = state.campaign;
  return { ...state, gold: state.gold + (choice === 'plunder' ? 20 : 0),
    player: choice === 'mercy' ? { ...state.player, mevcutCan: Math.min(state.player.maksimumCan, state.player.mevcutCan + 3) } : state.player,
    campaign: { ...c, choicePending: false, mercy: c.mercy + (choice === 'mercy' ? 1 : 0), corruption: c.corruption + (choice === 'plunder' ? 1 : 0),
      journal: [...c.journal, choice === 'mercy' ? 'Silahını indirdin. Bir isim daha korundu.' : 'Hatırayı aldın. Kesene yirmi altın, yoluna bir gölge eklendi.'].slice(-60) } };
}
export function campaignEvent(state: GameState, choice: number): GameState {
  if (!state.campaign || state.gamePhase !== 'event' || ![0, 1, 2].includes(choice)) return state;
  const c = state.campaign;
  const act = actNumber(state.runFloor);
  if (choice === 0 && state.gold < 12) return state;
  const seals = choice === 0 ? [...new Set([...c.seals, act])] : c.seals;
  const curse = sampleCardDefs.find(card => card.isim === 'Borç Senedi')!;
  return { ...state, gamePhase: 'mapSelection', runFloor: state.runFloor + 1, currentNode: null, nodeType: null,
    availableNodes: campaignNodes(state.runFloor + 1), gold: state.gold + (choice === 0 ? -12 : choice === 1 ? 35 : 0),
    deck: choice === 1 ? [...state.deck, { ...curse, id: generateRandomId() }] : state.deck,
    campaign: { ...c, seals, mercy: c.mercy + (choice === 0 ? 1 : 0), corruption: c.corruption + (choice === 1 ? 1 : 0),
      journal: [...c.journal, choice === 0 ? `${act}. perde mührünü sahibine iade ettin; izi sende kaldı.` : choice === 1 ? 'Bir hatırayı sattın. Borç Senedi destene karıştı.' : 'Tezgâhı sessizce geçtin.'].slice(-60) } };
}
export function canTravel(c?: CampaignRun) { return !c || c.configured && !c.choicePending && !c.relicOffers.length && !c.ending; }
export function unlockedClass(id: ClassId, wins: number) { return id === 'weaver' || id === 'warden' && wins >= 3 || id === 'cinder' && wins >= 9; }
