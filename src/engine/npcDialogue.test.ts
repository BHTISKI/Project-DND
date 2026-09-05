import { describe, it, expect } from 'vitest';
import { makeGameState } from '../testUtils/gameState';
import { withNpcDialogue } from './npcDialogue';

describe('NPC story lifecycle', () => {
  it('starts a new encounter with three readable lines and a silent player', () => {
    const before = makeGameState({ enemyArchetype: 'mage' });
    const after = withNpcDialogue(before, { ...before, gamePhase: 'combat' });
    expect(after.enemyDialog).toHaveLength(3);
    expect(after.enemyDialog.every(line => line.story)).toBe(true);
    expect(after.playerDialog).toEqual([]);
    expect(withNpcDialogue(after, after)).toBe(after);
  });
  it('queues a round reaction behind an unread story and replaces it on defeat', () => {
    const before = makeGameState({ enemyArchetype: 'mage', gamePhase: 'combat', enemyDialog: [{ text: 'Öykü', timestamp: 1, story: true }] });
    const turn = withNpcDialogue(before, { ...before, round: 2 });
    expect(turn.enemyDialog[0].text).toBe('Öykü');
    expect(turn.enemyDialog).toHaveLength(2);
    const won = withNpcDialogue(turn, { ...turn, gamePhase: 'mapSelection', enemy: { ...turn.enemy, mevcutCan: 0 } });
    expect(won.enemyDialog).toHaveLength(2);
    expect(won.enemyDialog[0].text).not.toBe('Öykü');
    expect(won.enemyDialog.every(line => line.story)).toBe(true);
  });
  it('new encounters discard the previous speaker queue', () => {
    const before = makeGameState({ gamePhase: 'combat', enemyDialog: [{ text: 'Eski', timestamp: 1 }] });
    const next = withNpcDialogue(before, { ...before, enemyArchetype: 'guardian', enemy: { ...before.enemy, id: 'new' } });
    expect(next.enemyDialog).toHaveLength(3);
    expect(next.enemyDialog.some(line => line.text === 'Eski')).toBe(false);
  });
});
