import { describe, it, expect } from 'vitest';
import { makeCard, makeGameState, makePlayer } from '../testUtils/gameState';
import { resolveCard, resolveTurn, refreshEnemyIntent } from './combatResolver';
import { finishEncounter } from '../state/store';
import { initialCampaign } from '../content/campaign';
import { withNpcDialogue } from './npcDialogue';
import { enemyVoices } from '../content/enemyVoices';

describe('individual combat feedback', () => {
  it('keeps separate impacts and absorbed block for a multi-hit card', () => {
    const card = { ...makeCard('İki vuruş'), effects: [{ kind: 'damage' as const, amount: 3 }, { kind: 'damage' as const, amount: 4 }] };
    const before = makeGameState({ gamePhase: 'combat', hand: [card], enemyBlock: 2, enemy: makePlayer({ id: 'enemy', mevcutCan: 50, maksimumCan: 50 }) });
    const after = resolveCard(before, card.id);
    expect(after.combatFeedback?.filter(e => e.kind === 'damage' || e.kind === 'heavy')).toHaveLength(2);
    expect(after.combatFeedback).toContainEqual({ target: 'enemy', kind: 'block', amount: 2 });
    expect(after.combatFeedback!.filter(e => e.kind === 'damage' || e.kind === 'heavy').reduce((n, e) => n + e.amount, 0)).toBe(before.enemy.mevcutCan - after.enemy.mevcutCan);
  });
  it('retains the killing impact through campaign reward transition', () => {
    const card = { ...makeCard('Son vuruş'), effects: [{ kind: 'damage' as const, amount: 99 }] };
    const before = makeGameState({ gamePhase: 'combat', hand: [card], campaign: { ...initialCampaign(), configured: true, encounterId: 'road-scavenger' } });
    const next = finishEncounter(resolveCard(before, card.id));
    expect(next.gamePhase).toBe('mapSelection');
    expect(next.combatFeedback?.some(e => e.target === 'enemy' && e.amount > 0)).toBe(true);
  });
  it('records poison separately from the enemy attack', () => {
    let before = makeGameState({ gamePhase: 'combat', enemyStatuses: [{ id: 'poisoned', stacks: 1, value: 1, duration: 3 }] });
    before = refreshEnemyIntent(before);
    const next = resolveTurn(before, finishEncounter);
    expect(next.combatFeedback).toContainEqual({ target: 'enemy', kind: 'poison', amount: 1 });
  });
});

describe('reactive story', () => {
  it('provides six distinct voices with all eight reaction triggers', () => {
    expect(Object.values(enemyVoices)).toHaveLength(6);
    for (const voice of Object.values(enemyVoices)) expect(new Set(voice.lines.map(l => l.trigger)).size).toBe(8);
  });
  it('reacts to poison while preserving an unread story', () => {
    const before = makeGameState({ gamePhase: 'combat', enemyDialog: [{ text: 'Önemli ipucu', timestamp: 1, story: true }] });
    const next = withNpcDialogue(before, { ...before, enemyStatuses: [{ id: 'poisoned', stacks: 1, duration: 3, value: 1 }] });
    expect(next.enemyDialog[0].text).toBe('Önemli ipucu');
    expect(next.enemyDialog[1].trigger).toBe('poison');
  });
  it('stores the Veyra revelation when the second phase opens', () => {
    const before = makeGameState({ gamePhase: 'combat', campaign: { ...initialCampaign(), configured: true, encounterId: 'veyra' } });
    const next = withNpcDialogue(before, { ...before, campaign: { ...before.campaign!, bossPhase: true } });
    expect(next.enemyDialog[0].text).toContain('İlk Dokuyucu sendin');
    expect(next.campaign?.journal.at(-1)).toContain('kardeşinim');
  });
  it('keeps last words in the journal after leaving the battlefield', () => {
    const before = makeGameState({ gamePhase: 'combat', campaign: { ...initialCampaign(), configured: true, encounterId: 'bell-warden' } });
    const next = withNpcDialogue(before, { ...before, gamePhase: 'mapSelection' });
    expect(next.campaign?.journal.at(-1)).toContain('Veyra');
  });
  it('does not skip the revelation on a lethal hit before phase two', () => {
    const before = makeGameState({ gamePhase: 'combat', campaign: { ...initialCampaign(), configured: true, encounterId: 'veyra' } });
    const next = withNpcDialogue(before, { ...before, gamePhase: 'mapSelection', enemy: { ...before.enemy, mevcutCan: 0 } });
    expect(next.enemyDialog[0].text).toContain('İlk Dokuyucu sendin');
    expect(next.campaign?.journal.join(' ')).toContain('kardeşinim');
  });
});
