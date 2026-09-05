import { beforeEach, expect, it } from 'vitest';
import { useGameStore } from '../state/store';
import { readRunSave, RUN_SAVE_KEY, snapshotRun } from '../state/runPersistence';
import { campaignNodes, campaignPhase, campaignRewards, chooseEnding, campaignDecision } from './campaignResolver';
import { encounters, initialCampaign } from '../content/campaign';
import { relics } from '../content/relics';
import { expansionCards } from '../content/expansionCards';
import { triggerRelics } from './relicResolver';
import { makeGameState, makePlayer } from '../testUtils/gameState';
import { poisonTick } from './statuses';
import { resolveCard, resolveTurn, prepareEnemyIntent } from './combatResolver';
import { sampleCardDefs, type Card } from '../types/game';

const state = () => useGameStore.getState();
beforeEach(() => { localStorage.clear(); useGameStore.setState(useGameStore.getInitialState(), true); });
function start() { expect(state().startNewGame('Dokuyucu', null)).toBe(true); state().configureCampaign('weaver', 0); }
function enter(type: 'combat' | 'boss') {
  const node = state().availableNodes.find(n => n.type === type)!;
  expect(node).toBeDefined(); state().selectNode(node.id);
  for (let i = 0; i < 3 && state().gamePhase === 'deckBuild'; i++) state().chooseDraftCard(state().draftOptions.find(c => c.rarity === 'common')!.id);
  expect(state().gamePhase).toBe('combat');
}
function reload() {
  expect(state().saveStatus).toBe('saved');
  const expected = snapshotRun(state());
  useGameStore.setState(useGameStore.getInitialState(), true);
  expect(state().resumeGame()).toBe(true); expect(snapshotRun(state())).toEqual(expected);
}

it('gates class selection, persists it, and prevents rerolling starter decks', () => {
  state().startNewGame('Dokuyucu', null);
  state().selectNode(state().availableNodes[0].id); expect(state().gamePhase).toBe('mapSelection');
  state().configureCampaign('cinder', 0); expect(state().campaign?.configured).toBe(false);
  state().configureCampaign('weaver', 1); expect(state().campaign?.configured).toBe(false);
  state().configureCampaign('weaver', 0); expect(state().player.maksimumCan).toBe(30);
  const hand = state().hand; state().configureCampaign('weaver', 0); expect(state().hand).toBe(hand);
  reload(); expect(state().campaign?.configured).toBe(true);
});

it.each(['dawn', 'throne', 'unwritten'] as const)('completes eighteen nodes, reloads pending decisions, and reaches %s once', ending => {
  start();
  for (let floor = 0; floor < 18; floor++) {
    expect(state().runFloor).toBe(floor);
    if (floor % 6 === 0) {
      state().selectNode(state().availableNodes.find(n => n.type === 'event')!.id);
      state().resolveEvent(ending === 'unwritten' ? 0 : 2);
    } else if (floor % 6 === 4) {
      state().selectNode(state().availableNodes.find(n => n.type === 'rest')!.id); state().resolveRest(2);
    } else {
      enter(floor % 6 === 5 ? 'boss' : 'combat');
      state().applyDamage('enemy', 10000);
      if (floor < 17) {
        reload(); const gold = state().gold;
        state().selectNode(state().availableNodes[0].id); expect(state().gamePhase).toBe('mapSelection');
        state().chooseCampaignOutcome(ending === 'throne' ? 'plunder' : 'mercy');
        state().chooseCampaignOutcome('plunder'); expect(state().gold).toBe(gold + (ending === 'throne' ? 20 : 0));
        if (state().campaign!.relicOffers.length) state().chooseRelic(state().campaign!.relicOffers[0]);
        state().skipReward();
      }
    }
    reload();
  }
  expect(state().campaign?.ending).toBe(ending);
  const gold = state().gold; const wins = state().metaVictories;
  state().applyDamage('enemy', 1000); state().selectNode(state().availableNodes[0].id);
  expect(state().runFloor).toBe(18); expect(state().gold).toBe(gold); expect(state().metaVictories).toBe(wins);
  expect(state().playerDialog).toEqual([]);
});

it('migrates a version-three save without enrolling it in a new campaign', () => {
  state().setPlayerName('Eski yolcu'); state().initializeGame(); state().retrySave();
  const raw = JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!); raw.version = 3; delete raw.run.campaign;
  localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(raw));
  const saved = readRunSave(); expect(saved.kind).toBe('ready');
  if (saved.kind === 'ready') { expect(saved.run.campaign).toBeUndefined(); expect(saved.run.hand.map(c => c.id)).toEqual(raw.run.hand.map((c: Card) => c.id)); }
  expect(JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!).version).toBe(4);
});

it('rejects unknown relics and preserves conditional cards in saved piles', () => {
  start(); const card = sampleCardDefs.find(c => c.isim === 'Açık Damar')!;
  useGameStore.setState({ deck: [...state().deck, { ...card, id: 'conditional-save' }] }); state().retrySave(); reload();
  expect(state().deck.find(c => c.id === 'conditional-save')?.effects).toEqual(card.effects);
  const raw = JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!); raw.run.campaign.relics = ['unknown'];
  localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(raw)); expect(readRunSave().kind).toBe('invalid');
});

it.each(encounters.filter(e => e.rank === 'boss'))('$name changes phase only once at half health', e => {
  const s = makeGameState({ campaign: { ...initialCampaign(), encounterId: e.id }, gamePhase: 'combat', enemy: makePlayer({ mevcutCan: 50, maksimumCan: 100 }) });
  expect(campaignPhase({ ...s, enemy: { ...s.enemy, mevcutCan: 51 } })).toEqual({ ...s, enemy: { ...s.enemy, mevcutCan: 51 } });
  const next = campaignPhase(s); expect(next.campaign?.bossPhase).toBe(true); expect(campaignPhase(next)).toBe(next);
  expect(campaignDecision(next)?.action.kind).toBe(e.secondPhase![0].kind);
});

it('guarantees boss gates and rare pity while excluding curses and duplicate reward names', () => {
  for (const floor of [5, 11, 17]) expect(campaignNodes(floor).map(n => n.type)).toEqual(['boss']);
  expect(campaignNodes(0, () => .2).map(n => n.type)).toEqual(['combat', 'event', 'shop']);
  expect(campaignNodes(0, () => .5).map(n => n.type)).toEqual(['combat', 'rest', 'event']);
  const reward = campaignRewards(makeGameState({ campaign: { ...initialCampaign(), rareMisses: 5 } }), () => .99);
  expect(reward.cards[0].rarity).toBe('rare'); expect(reward.cards.every(c => !c.isCursed)).toBe(true);
  expect(new Set(reward.cards.map(c => c.isim)).size).toBe(3);
});

it('prioritizes the hidden ending and requires all three different seals', () => {
  const c = { ...initialCampaign(), mercy: 5, seals: [1, 2, 3] };
  expect(chooseEnding(c)).toBe('unwritten'); expect(chooseEnding({ ...c, corruption: 1 })).toBe('dawn');
  expect(chooseEnding({ ...c, seals: [1, 2] })).toBe('dawn'); expect(chooseEnding({ ...c, mercy: 2 })).toBe('throne');
});

it.each(relics)('$name applies its event, cannot recurse, and respects its once limit', relic => {
  const s = makeGameState({ campaign: { ...initialCampaign(), relics: [relic.id] }, player: makePlayer({ mevcutCan: 5, maksimumCan: 30 }),
    deck: Array.from({ length: 3 }, (_, i) => ({ ...sampleCardDefs[0], id: `draw-${i}` })), playerStatuses: [{ id: 'poisoned', stacks: 2, duration: 3 }] });
  const next = triggerRelics(s, relic.trigger);
  expect(next).not.toEqual(s); expect(s.campaign?.usedRelics).toEqual([]);
  expect(next.battleLogs).toHaveLength(1);
  const again = triggerRelics(next, relic.trigger);
  expect(again.battleLogs).toHaveLength(relic.once ? 1 : 2);
});

it('applies the broken-soul curse on a relic draw', () => {
  const s = makeGameState({ campaign: { ...initialCampaign(), relics: ['folded-map'] }, maxEnergy: 3,
    deck: [{ ...sampleCardDefs.find(c => c.isim === 'Kırık Ruh')!, id: 'broken' }] });
  expect(triggerRelics(s, 'battle').maxEnergy).toBe(1);
});

it('bleeding bypasses block, regeneration follows damage and cannot resurrect', () => {
  const statuses = [{ id: 'bleeding' as const, stacks: 2, duration: 2 }, { id: 'regeneration' as const, stacks: 3, duration: 2 }];
  expect(poisonTick(statuses, 'player', makePlayer({ mevcutCan: 8 })).character.mevcutCan).toBe(7);
  expect(poisonTick(statuses, 'player', makePlayer({ mevcutCan: 4 })).character.mevcutCan).toBe(0);
});

it('bleeding enables the conditional strike, reflection can kill and time lock skips the next action', () => {
  const card = { ...expansionCards.find(c => c.isim === 'Açık Damar')!, id: 'wound' };
  const base = makeGameState({ gamePhase: 'combat', hand: [card], enemy: makePlayer({ mevcutCan: 30, maksimumCan: 30 }) });
  const normal = resolveCard(base, card.id);
  const bleeding = resolveCard({ ...base, enemyStatuses: [{ id: 'bleeding', stacks: 1, duration: 2 }] }, card.id);
  expect(normal.enemy.mevcutCan - bleeding.enemy.mevcutCan).toBe(6);
  const reflected = resolveCard({ ...base, player: makePlayer({ mevcutCan: 1 }), enemyStatuses: [{ id: 'reflection', stacks: 2, duration: 2 }] }, card.id);
  expect(reflected.player.mevcutCan).toBe(0);
  const locked = prepareEnemyIntent({ ...base, hand: [], enemyStatuses: [{ id: 'timeLocked', stacks: 1, duration: 1 }] });
  expect(locked.enemyIntent?.action?.kind).toBe('pass');
  const next = resolveTurn(locked, s => s); expect(next.player.mevcutCan).toBe(locked.player.mevcutCan);
  expect(next.enemyStatuses.some(s => s.id === 'timeLocked')).toBe(false);
});
