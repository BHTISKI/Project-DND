import { describe, expect, it } from 'vitest';
import { runSimulation } from './simulatePlaythrough';

describe('reproducible combat experiment', () => {
  it('repeats a seeded run and restores the global random source', () => {
    const original = Math.random;
    const first = runSimulation('with-mechanics', 10);
    expect(runSimulation('with-mechanics', 10)).toEqual(first);
    expect(Math.random).toBe(original);
    expect(first.summary.wins + first.summary.losses + first.summary.timeouts).toBe(10);
    expect(first.summary.exhaustPlays).toBeGreaterThan(0);
  });
  it('uses the same scenarios but disables all three mechanics in baseline', () => {
    const baseline = runSimulation('baseline', 10);
    const enhanced = runSimulation('with-mechanics', 10);
    expect(baseline.results.map(r => [r.seed, r.archetype, r.encounter, r.tier]))
      .toEqual(enhanced.results.map(r => [r.seed, r.archetype, r.encounter, r.tier]));
    expect(baseline.summary.retainedCardTurns + baseline.summary.exhaustPlays + baseline.summary.finisherActivations).toBe(0);
    expect(() => runSimulation('baseline', 0)).toThrow(RangeError);
  });

  it('reports combat, elite and boss pacing separately', () => {
    const result = runSimulation('with-mechanics', 100);
    expect(result.summary.byEncounter.combat.averageTurns).toBeGreaterThanOrEqual(3);
    expect(result.summary.byEncounter.combat.averageTurns).toBeLessThanOrEqual(5);
    expect(result.summary.byEncounter.elite.averageTurns).toBeGreaterThanOrEqual(5);
    expect(result.summary.byEncounter.elite.averageTurns).toBeLessThanOrEqual(8);
    expect(result.summary.byEncounter.boss.averageTurns).toBeGreaterThanOrEqual(8);
    expect(result.summary.byEncounter.boss.averageTurns).toBeLessThanOrEqual(12);
    expect(result.summary.enemyPostureBreakRate).toBeGreaterThanOrEqual(0.3);
    expect(result.summary.enemyPostureBreakRate).toBeLessThanOrEqual(0.5);
  });
});
