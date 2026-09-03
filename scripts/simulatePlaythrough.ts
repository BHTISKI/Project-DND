import type { Card, EnemyArchetypeId } from '../src/types/game';
import { sampleCardDefs } from '../src/types/game';
import { useGameStore, finishEncounter } from '../src/state/store';
import { createEnemy, prepareEnemyIntent, drawCardsState, resolveCard, resolveTurn } from '../src/engine/combatResolver';
import { SeededRNG } from '../src/utils/rng';
import { shuffle } from '../src/utils/game';
import { advanceCombo, cardCategory, finisherBonus } from '../src/mechanics/finisher';

export type SimulationMode = 'baseline' | 'with-mechanics';
const archetypes: EnemyArchetypeId[] = ['goblin', 'guardian', 'mage', 'assassin', 'knight'];
const names = ['Hızlı Saldırı', 'Kalkan Sihri', 'Kanlı Elçi', 'Ateş Topu', 'Rüzgarın Sesli', 'Taktik Hazırlık', 'Zayıflatıcı Lanet', 'Sabırlı Muhafız', 'Son Kıvılcım', 'Zincir Darbesi'];

/** Synchronous, isolated runner: restores Math.random even on failure. Never called by the UI. */
export function runSimulation(mode: SimulationMode, games = 100) {
  if (!Number.isInteger(games) || games < 1 || games > 10000) throw new RangeError('games must be 1..10000');
  const originalRandom = Math.random;
  const results = [];
  try {
    for (let game = 0; game < games; game++) {
      const seed = 20260904 + game;
      const combatRng = new SeededRNG(seed);
      const choiceRng = new SeededRNG(seed ^ 0x5f3759df);
      Math.random = () => combatRng.random();
      const archetype = archetypes[game % archetypes.length];
      const tier = Math.floor(game / archetypes.length) % 2 === 0 ? 0 : 3;
      const deck: Card[] = names.map((name, i) => {
        const definition = sampleCardDefs.find(c => c.isim === name)!;
        return { ...definition, id: `card-${i}`,
          ...(mode === 'baseline' ? { retain: false, exhaust: false, finisher: undefined } : {}) };
      });
      let state = prepareEnemyIntent(drawCardsState({ ...useGameStore.getInitialState(),
        initialized: true, gamePhase: 'combat', nodeType: 'combat', currentNode: 'combat',
        enemy: createEnemy(archetype, tier), enemyArchetype: archetype,
        enemyBehavior: archetype === 'goblin' || archetype === 'assassin' ? 'opportunist' : archetype === 'mage' ? 'paranoid' : 'standard',
        deck: shuffle(deck), hand: [], discardPile: [], exhaustedPile: [],
      }, 5));
      let steps = 0, choiceCount = 0, decisionPoints = 0, plays = 0, held = 0, exhausted = 0, finishers = 0;
      const states = new Set<string>();
      while (state.gamePhase === 'combat' && state.round <= 30 && steps < 300) {
        steps++;
        states.add(JSON.stringify([state.round, state.player.mevcutCan, state.enemy.mevcutCan, state.currentEnergy,
          state.hand.map(c => c.isim), state.playerBlock, state.enemyBlock, state.comboCount,
          state.playerStatuses, state.enemyStatuses, state.exhaustedPile.map(c => c.isim)]));
        const playable = state.player.staggered ? [] : state.hand.filter(c => !c.onDiscardPenalty && c.manaBedeli <= state.currentEnergy);
        choiceCount += playable.length + 1; // End turn is always a legal choice.
        if (playable.length) decisionPoints++;
        // Simple stochastic policy: sometimes hold retained defense; otherwise pick a legal card.
        const candidates = playable.filter(c => !(c.retain && !state.enemyIntent?.estimatedDamage && choiceRng.random() < 0.65));
        const shouldEnd = !candidates.length || choiceRng.random() < 0.08;
        if (shouldEnd) {
          held += state.hand.filter(c => c.retain && !c.onDiscardPenalty).length;
          state = resolveTurn(state, finishEncounter);
        } else {
          const selected = candidates[Math.floor(choiceRng.random() * candidates.length)];
          if (finisherBonus(selected, advanceCombo(state.comboCount, state.comboChain.at(-1), cardCategory(selected)))) finishers++;
          if (selected.exhaust) exhausted++;
          plays++;
          state = finishEncounter(resolveCard(state, selected.id));
        }
      }
      results.push({ seed, archetype, tier,
        outcome: state.gamePhase === 'gameOver' ? 'loss' : state.gamePhase !== 'combat' ? 'win' : 'timeout',
        turns: state.round, steps, plays, decisionPoints, meanLegalChoices: choiceCount / steps,
        distinctVisitedStates: states.size, retainedCardTurns: held, exhaustPlays: exhausted, finisherActivations: finishers });
    }
  } finally { Math.random = originalRandom; }
  const mean = (key: 'turns' | 'plays' | 'decisionPoints' | 'meanLegalChoices' | 'distinctVisitedStates') =>
    Number((results.reduce((sum, result) => sum + result[key], 0) / games).toFixed(3));
  const wins = results.filter(r => r.outcome === 'win').length;
  return { mode, games, protocol: 'paired-combat-ablation-v1', seedStart: 20260904,
    limits: { turns: 30, actions: 300 },
    baselineMeaning: 'Same cards and engine; retain/exhaust/finisher disabled. Not the archived previous version.',
    summary: { wins, losses: results.filter(r => r.outcome === 'loss').length,
      timeouts: results.filter(r => r.outcome === 'timeout').length, winRate: wins / games,
      averageTurns: mean('turns'), averagePlays: mean('plays'), averageDecisionPoints: mean('decisionPoints'),
      averageLegalChoices: mean('meanLegalChoices'), averageDistinctVisitedStates: mean('distinctVisitedStates'),
      retainedCardTurns: results.reduce((sum, r) => sum + r.retainedCardTurns, 0),
      exhaustPlays: results.reduce((sum, r) => sum + r.exhaustPlays, 0),
      finisherActivations: results.reduce((sum, r) => sum + r.finisherActivations, 0) }, results };
}
