import type { Card, EnemyArchetypeId } from '../src/types/game';
import { sampleCardDefs } from '../src/types/game';
import { useGameStore, finishEncounter } from '../src/state/store';
import { prepareEnemyIntent, drawCardsState, resolveCard, resolveTurn } from '../src/engine/combatResolver';
import { createEnemy } from '../src/engine/enemyArchetypes';
import type { CombatEncounter } from '../src/engine/enemyArchetypes';
import { SeededRNG } from '../src/utils/rng';
import { shuffle } from '../src/utils/game';
import { advanceCombo, cardCategory, finisherBonus } from '../src/mechanics/finisher';
import { cardUnavailableReason, isMeleeAction, isMeleeCard } from '../src/mechanics/posture';

export type SimulationMode = 'baseline' | 'with-mechanics';

type SimulationResult = {
  seed: number;
  archetype: EnemyArchetypeId;
  encounter: CombatEncounter;
  tier: number;
  outcome: 'win' | 'loss' | 'timeout';
  turns: number;
  steps: number;
  plays: number;
  decisionPoints: number;
  meanLegalChoices: number;
  distinctVisitedStates: number;
  retainedCardTurns: number;
  exhaustPlays: number;
  finisherActivations: number;
  postureBreaks: number;
  playerPostureBreaks: number;
  enemyPostureBreaks: number;
  executeUses: number;
};

const archetypes: EnemyArchetypeId[] = ['goblin', 'guardian', 'mage', 'assassin', 'knight'];
const encounters: CombatEncounter[] = ['combat', 'elite', 'boss'];
const names = ['Hızlı Saldırı', 'Kalkan Sihri', 'Kanlı Elçi', 'Ateş Topu', 'Rüzgarın Sesli', 'Taktik Hazırlık', 'Zayıflatıcı Lanet', 'Sabırlı Muhafız', 'Son Kıvılcım', 'Zincir Darbesi'];

/** Synchronous, isolated runner: restores Math.random even on failure. Never called by the UI. */
export function runSimulation(mode: SimulationMode, games = 100) {
  if (!Number.isInteger(games) || games < 1 || games > 10000) throw new RangeError('games must be 1..10000');
  const originalRandom = Math.random;
  const results: SimulationResult[] = [];
  try {
    for (let game = 0; game < games; game++) {
      const seed = 20260904 + game;
      const combatRng = new SeededRNG(seed);
      const choiceRng = new SeededRNG(seed ^ 0x5f3759df);
      Math.random = () => combatRng.random();
      const archetype = archetypes[game % archetypes.length];
      const encounter = encounters[game % encounters.length];
      const tier = Math.floor(game / archetypes.length) % 2 === 0 ? 0 : 3;
      const deck: Card[] = names.map((name, i) => {
        const definition = sampleCardDefs.find(c => c.isim === name)!;
        return { ...definition, id: `card-${i}`,
          ...(mode === 'baseline' ? { retain: false, exhaust: false, finisher: undefined } : {}) };
      });
      let state = prepareEnemyIntent(drawCardsState({ ...useGameStore.getInitialState(),
        initialized: true, gamePhase: 'combat', nodeType: encounter, currentNode: encounter,
        enemy: createEnemy(archetype, tier, encounter), enemyArchetype: archetype,
        enemyBehavior: encounter !== 'combat' || archetype === 'mage' ? 'paranoid'
          : archetype === 'goblin' || archetype === 'assassin' ? 'opportunist' : 'standard',
        enemyCanLie: encounter !== 'combat',
        deck: shuffle(deck), hand: [], discardPile: [], exhaustedPile: [],
      }, 5));
      let steps = 0, choiceCount = 0, decisionPoints = 0, plays = 0, held = 0, exhausted = 0, finishers = 0;
      let postureBreaks = 0, playerPostureBreaks = 0, enemyPostureBreaks = 0, executeUses = 0;
      const states = new Set<string>();
      while (state.gamePhase === 'combat' && state.round <= 30 && steps < 300) {
        steps++;
        states.add(JSON.stringify([state.round, state.player.mevcutCan, state.enemy.mevcutCan, state.currentEnergy,
          state.hand.map(c => c.isim), state.playerBlock, state.enemyBlock, state.comboCount,
          state.playerStatuses, state.enemyStatuses, state.exhaustedPile.map(c => c.isim),
          state.player.currentPosture, state.enemy.currentPosture, state.player.isBroken, state.enemy.isBroken,
          state.postureComboCount, state.pendingParry, state.playerGuardPostureCost, state.enemyGuardPostureCost]));
        const playable = state.hand.filter(c => cardUnavailableReason(state, c) === '');
        choiceCount += playable.length + 1; // End turn is always a legal choice.
        if (playable.length) decisionPoints++;
        // Simple stochastic policy: sometimes hold retained defense; otherwise pick a legal card.
        const candidates = playable.filter(c => !(c.retain && !state.enemyIntent?.estimatedDamage && choiceRng.random() < 0.65));
        const shouldEnd = !candidates.length || choiceRng.random() < 0.08;
        if (shouldEnd) {
          held += state.hand.filter(c => c.retain && !c.onDiscardPenalty).length;
          const before = state;
          if (before.player.isBroken && before.enemyIntent?.action && isMeleeAction(before.enemyIntent.action)) executeUses++;
          state = resolveTurn(before, finishEncounter);
          const playerBroke = Number(!before.player.isBroken && state.player.isBroken);
          const enemyBroke = Number(!before.enemy.isBroken && state.enemy.isBroken);
          playerPostureBreaks += playerBroke; enemyPostureBreaks += enemyBroke; postureBreaks += playerBroke + enemyBroke;
        } else {
          const selected = candidates[Math.floor(choiceRng.random() * candidates.length)];
          if (finisherBonus(selected, advanceCombo(state.comboCount, state.comboChain.at(-1), cardCategory(selected)))) finishers++;
          if (selected.exhaust) exhausted++;
          plays++;
          const before = state;
          if (before.enemy.isBroken && isMeleeCard(selected)) executeUses++;
          state = finishEncounter(resolveCard(before, selected.id));
          const playerBroke = Number(!before.player.isBroken && state.player.isBroken);
          const enemyBroke = Number(!before.enemy.isBroken && state.enemy.isBroken);
          playerPostureBreaks += playerBroke; enemyPostureBreaks += enemyBroke; postureBreaks += playerBroke + enemyBroke;
        }
      }
      results.push({ seed, archetype, encounter, tier,
        outcome: state.gamePhase === 'gameOver' ? 'loss' : state.gamePhase !== 'combat' ? 'win' : 'timeout',
        turns: state.round, steps, plays, decisionPoints, meanLegalChoices: choiceCount / steps,
        distinctVisitedStates: states.size, retainedCardTurns: held, exhaustPlays: exhausted, finisherActivations: finishers,
        postureBreaks, playerPostureBreaks, enemyPostureBreaks, executeUses });
    }
  } finally { Math.random = originalRandom; }
  const mean = (key: 'turns' | 'plays' | 'decisionPoints' | 'meanLegalChoices' | 'distinctVisitedStates') =>
    Number((results.reduce((sum, result) => sum + result[key], 0) / games).toFixed(3));
  const wins = results.filter(r => r.outcome === 'win').length;
  const summarizeEncounter = (encounter: CombatEncounter) => {
    const subset = results.filter(result => result.encounter === encounter);
    const count = subset.length || 1;
    const encounterWins = subset.filter(result => result.outcome === 'win').length;
    const breakFights = subset.filter(result => result.postureBreaks > 0).length;
    const enemyBreakFights = subset.filter(result => result.enemyPostureBreaks > 0).length;
    const playerBreakFights = subset.filter(result => result.playerPostureBreaks > 0).length;
    const executeFights = subset.filter(result => result.executeUses > 0).length;
    return { fights: subset.length, wins: encounterWins, winRate: encounterWins / count,
      averageTurns: Number((subset.reduce((sum, result) => sum + result.turns, 0) / count).toFixed(3)),
      postureBreakRate: Number((breakFights / count).toFixed(3)),
      enemyPostureBreakRate: Number((enemyBreakFights / count).toFixed(3)),
      playerPostureBreakRate: Number((playerBreakFights / count).toFixed(3)),
      executeRate: Number((executeFights / count).toFixed(3)) };
  };
  const postureBreakFights = results.filter(result => result.postureBreaks > 0).length;
  const enemyPostureBreakFights = results.filter(result => result.enemyPostureBreaks > 0).length;
  const playerPostureBreakFights = results.filter(result => result.playerPostureBreaks > 0).length;
  const executeFights = results.filter(result => result.executeUses > 0).length;
  return { mode, games, protocol: 'paired-combat-encounters-v2', seedStart: 20260904,
    limits: { turns: 30, actions: 300 },
    baselineMeaning: 'Same cards and engine; retain/exhaust/finisher disabled. Not the archived previous version.',
    summary: { wins, losses: results.filter(r => r.outcome === 'loss').length,
      timeouts: results.filter(r => r.outcome === 'timeout').length, winRate: wins / games,
      averageTurns: mean('turns'), averagePlays: mean('plays'), averageDecisionPoints: mean('decisionPoints'),
      averageLegalChoices: mean('meanLegalChoices'), averageDistinctVisitedStates: mean('distinctVisitedStates'),
      retainedCardTurns: results.reduce((sum, r) => sum + r.retainedCardTurns, 0),
      exhaustPlays: results.reduce((sum, r) => sum + r.exhaustPlays, 0),
      finisherActivations: results.reduce((sum, r) => sum + r.finisherActivations, 0),
      postureBreaks: results.reduce((sum, r) => sum + r.postureBreaks, 0),
      postureBreakFights, postureBreakRate: postureBreakFights / games,
      enemyPostureBreakFights, enemyPostureBreakRate: enemyPostureBreakFights / games,
      playerPostureBreakFights, playerPostureBreakRate: playerPostureBreakFights / games,
      executeUses: results.reduce((sum, r) => sum + r.executeUses, 0), executeFights,
      executeRate: executeFights / games,
      byEncounter: { combat: summarizeEncounter('combat'), elite: summarizeEncounter('elite'), boss: summarizeEncounter('boss') } }, results };
}
