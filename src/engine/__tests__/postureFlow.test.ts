import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card, EnemyAction } from '../../types/game';
import { sampleCardDefs } from '../../types/game';
import { makeCard, makeGameState, makePlayer } from '../../testUtils/gameState';
import { initialPosture } from '../../mechanics/posture';
import { resolveCard, resolveTurn } from '../combatResolver';

function catalog(name: string, id = name): Card {
  const definition = sampleCardDefs.find(card => card.isim === name);
  if (!definition) throw new Error(`Missing card: ${name}`);
  return { ...definition, id };
}

function combat(action: EnemyAction = { kind: 'pass' }) {
  const intent = { type: action.kind === 'defend' ? 'defend' as const : 'attack' as const, action };
  return makeGameState({
    initialized: true,
    gamePhase: 'combat',
    isPlayerTurn: true,
    currentNode: 'combat',
    nodeType: 'combat',
    enemyArchetype: 'goblin',
    enemyBehavior: 'standard',
    player: makePlayer({ mevcutCan: 100, maksimumCan: 100, hasarBonusu: 0 }),
    enemy: makePlayer({ id: 'enemy', isim: 'Goblin', mevcutCan: 100, maksimumCan: 100,
      hasarBonusu: 0, ...initialPosture('goblin') }),
    enemyIntent: intent,
    baseEnemyIntent: intent,
  });
}

function melee(id: string, postureDamage = 20): Card {
  return { ...makeCard(id, id), tip: 'saldırı', effects: [{ kind: 'attack', amount: 1 }],
    postureDamage, postureCostOnBlock: 0, isRanged: false, isParry: false };
}

describe('posture combat flow', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5));
  afterEach(() => vi.restoreAllMocks());

  it('applies melee posture through full block and charges an enemy Guard only once', () => {
    let state = combat();
    state.enemy = { ...state.enemy, maxPosture: 200, postureDamageTaken: 1.15 };
    state.enemyBlock = 10;
    state.enemyGuardPostureCost = 15;
    state.hand = [melee('first', 30), melee('second', 30)];

    state = resolveCard(state, 'first');
    expect(state.enemy.mevcutCan).toBe(100);
    expect(state.enemy.currentPosture).toBe(53);
    expect(state.enemyGuardPostureCost).toBe(0);
    state = resolveCard(state, 'second');
    expect(state.enemy.currentPosture).toBe(88);
  });

  it('lets ranged attacks consume block without posture, Guard cost or Execute', () => {
    const ranged = catalog('Ateş Topu');
    const state = combat();
    state.enemy = { ...state.enemy, currentPosture: state.enemy.maxPosture, isBroken: true };
    state.enemyBlock = 5;
    state.enemyGuardPostureCost = 15;
    state.hand = [ranged];

    const next = resolveCard(state, ranged.id);
    expect(next.enemy.mevcutCan).toBe(99);
    expect(next.enemy).toMatchObject({ currentPosture: 70, isBroken: true });
    expect(next.enemyGuardPostureCost).toBe(15);
  });

  it('charges a used player Guard on melee but not on ranged damage', () => {
    const guard = catalog('Kalkan Sihri');
    let meleeState = combat({ kind: 'attack', damage: 3, postureDamage: 25 });
    meleeState.hand = [guard];
    meleeState = resolveCard(meleeState, guard.id);
    expect(meleeState.playerGuardPostureCost).toBe(15);
    meleeState = resolveTurn(meleeState, state => state);
    expect(meleeState.player.mevcutCan).toBe(100);
    expect(meleeState.player.currentPosture).toBe(15);
    expect(meleeState.playerGuardPostureCost).toBe(0);

    let rangedState = combat({ kind: 'magic', damage: 3, isRanged: true, postureDamage: 0 });
    rangedState.hand = [{ ...guard, id: 'ranged-guard' }];
    rangedState = resolveCard(rangedState, 'ranged-guard');
    rangedState = resolveTurn(rangedState, state => state);
    expect(rangedState.player.currentPosture).toBe(0);
    expect(rangedState.playerGuardPostureCost).toBe(0);
  });

  it('resolves Parry against the published action and applies the failure penalty otherwise', () => {
    const parry = catalog('Ayna Duruşu');
    let success = combat({ kind: 'attack', damage: 8, postureDamage: 25 });
    success.hand = [parry];
    success = resolveTurn(resolveCard(success, parry.id), state => state);
    expect(success.player.mevcutCan).toBe(100);
    expect(success.enemy.currentPosture).toBe(69);
    expect(success.pendingParry).toBe(false);

    let failure = combat({ kind: 'magic', damage: 4, isRanged: true });
    failure.hand = [{ ...parry, id: 'failed-parry' }];
    failure = resolveTurn(resolveCard(failure, 'failed-parry'), state => state);
    expect(failure.player.mevcutCan).toBe(100);
    expect(failure.player.currentPosture).toBe(20);

    let skipped = combat({ kind: 'attack', damage: 8, postureDamage: 25 });
    skipped.hand = [{ ...parry, id: 'skipped-parry' }];
    skipped = resolveCard(skipped, 'skipped-parry');
    skipped.enemySkipNextTurn = true;
    skipped = resolveTurn(skipped, state => state);
    expect(skipped.player.currentPosture).toBe(0);
    expect(skipped.enemy.currentPosture).toBe(0);
  });

  it('applies the third consecutive melee momentum once per card and resets on another card', () => {
    let state = combat();
    state.enemy = { ...state.enemy, maxPosture: 500, postureDamageTaken: 1 };
    const reset = { ...makeCard('reset', 'reset'), effects: [{ kind: 'draw' as const, amount: 0 }] };
    state.hand = [melee('one'), melee('two'), melee('three'), reset, melee('after')];
    state = resolveCard(state, 'one');
    state = resolveCard(state, 'two');
    state = resolveCard(state, 'three');
    expect(state.enemy.currentPosture).toBe(65);
    expect(state.postureComboCount).toBe(3);
    state = resolveCard(state, 'reset');
    state = resolveCard(state, 'after');
    expect(state.enemy.currentPosture).toBe(85);
    expect(state.postureComboCount).toBe(1);
  });

  it('uses pre-hit HP and applies posture only once for a multi-hit card', () => {
    const state = combat();
    state.enemy = { ...state.enemy, mevcutCan: 71, maksimumCan: 100, maxPosture: 500, postureDamageTaken: 1 };
    const multiHit = { ...melee('multi', 10), effects: [
      { kind: 'attack' as const, amount: 1 },
      { kind: 'attack' as const, amount: 1 },
    ] };
    state.hand = [multiHit];
    const next = resolveCard(state, multiHit.id);
    expect(next.enemy.mevcutCan).toBe(69);
    expect(next.enemy.currentPosture).toBe(10);
  });

  it('does not Execute on the breaking card and executes a normal enemy on the next melee card', () => {
    let state = combat();
    state.enemy = { ...state.enemy, postureDamageTaken: 1, maxPosture: 70 };
    const breaker = { ...melee('breaker', 70), effects: [
      { kind: 'attack' as const, amount: 1 },
      { kind: 'attack' as const, amount: 1 },
    ] };
    state.hand = [breaker, melee('execute', 20)];
    state = resolveCard(state, 'breaker');
    expect(state.enemy).toMatchObject({ mevcutCan: 98, currentPosture: 70, isBroken: true });
    state = resolveCard(state, 'execute');
    expect(state.enemy).toMatchObject({ mevcutCan: 0, currentPosture: 0, isBroken: false });
    expect(state.postureComboCount).toBe(0);
  });

  it.each([
    ['elite' as const, true],
    ['boss' as const, false],
  ])('uses the 35%% %s Execute without instant death', (nodeType, exposed) => {
    const state = combat();
    state.nodeType = nodeType;
    state.currentNode = nodeType;
    state.enemy = { ...state.enemy, mevcutCan: 100, maksimumCan: 100,
      currentPosture: state.enemy.maxPosture, isBroken: true };
    state.hand = [melee('execute')];
    const next = resolveCard(state, 'execute');
    expect(next.enemy).toMatchObject({ mevcutCan: 65, currentPosture: 0, isBroken: false });
    expect(next.enemyStatuses.some(status => status.id === 'postureExposed')).toBe(exposed);
  });

  it('keeps a newly Broken player through the response turn and allows healing or skip, but not Guard', () => {
    let state = combat({ kind: 'attack', damage: 1, postureDamage: 25 });
    state.player = { ...state.player, currentPosture: 90 };
    state = resolveTurn(state, current => current);
    expect(state.player).toMatchObject({ currentPosture: 100, isBroken: true });

    const heal = catalog('Buhar Nefesi');
    const guard = catalog('Kalkan Sihri');
    const skip = catalog('Büyüleyici Çukur');
    state.hand = [heal, guard, skip];
    state.player = { ...state.player, mevcutCan: 90 };
    state.currentEnergy = 10;
    state = resolveCard(state, heal.id);
    expect(state.player).toMatchObject({ mevcutCan: 95, isBroken: true });
    const guarded = resolveCard(state, guard.id);
    expect(guarded.hand.some(card => card.id === guard.id)).toBe(true);
    state = resolveCard(guarded, skip.id);
    state = resolveTurn(state, current => current);
    expect(state.player).toMatchObject({ currentPosture: 50, isBroken: false, mevcutCan: 95 });
  });

  it('lets a paranoid enemy counter prepared Parry with its published poison action', () => {
    const parry = catalog('Ayna Duruşu');
    let state = combat({ kind: 'attack', damage: 5, postureDamage: 20 });
    state.enemyBehavior = 'paranoid';
    state.enemyBehaviorRoll = 0.1;
    state.hand = [parry];
    state = resolveCard(state, parry.id);
    expect(state.enemyIntent?.action?.kind).toBe('poison');
    state = resolveTurn(state, current => current);
    expect(state.player.currentPosture).toBe(20);
    expect(state.playerStatuses.some(status => status.id === 'poisoned')).toBe(true);
  });

  it('turns the next status-modified melee hit into a block-ignoring player Execute', () => {
    let state = combat({ kind: 'attack', damage: 4, postureDamage: 25 });
    state.player = { ...state.player, mevcutCan: 30, maksimumCan: 30, currentPosture: 100, isBroken: true };
    state.playerBlock = 99;
    state.enemyStatuses = [{ id: 'empowered', duration: 2, stacks: 1, value: 2 }];
    state.playerStatuses = [{ id: 'vulnerable', duration: 2, stacks: 1, value: 1 }];
    state = resolveTurn(state, current => current);
    expect(state.player).toMatchObject({ mevcutCan: 14, currentPosture: 0, isBroken: false });
    expect(state.playerBlock).toBe(0);
  });

  it('closes unused Broken windows at half posture before the enemy acts', () => {
    let state = combat({ kind: 'pass' });
    state.enemy = { ...state.enemy, currentPosture: 70, isBroken: true };
    state.player = { ...state.player, currentPosture: 100, isBroken: true };
    state = resolveTurn(state, current => current);
    expect(state.enemy).toMatchObject({ currentPosture: 35, isBroken: false });
    expect(state.player).toMatchObject({ currentPosture: 50, isBroken: false });
  });
});
