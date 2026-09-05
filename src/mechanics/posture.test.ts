import { describe, expect, it } from 'vitest';
import { makeCard, makePlayer } from '../testUtils/gameState';
import {
  applyPostureDamage,
  canExecute,
  cardPostureMetadata,
  cardUnavailableReason,
  initialPosture,
  momentumMultiplier,
  postureProfile,
  postureRecoveryAmount,
  recoverPostureOnTurnEnd,
  resolveExecute,
} from './posture';

describe('posture rules', () => {
  it.each([
    [71, 10],
    [70, 14],
    [30, 14],
    [29, 18],
  ])('uses the pre-hit HP band at %s%% HP', (hp, expected) => {
    const target = makePlayer({ mevcutCan: hp, maksimumCan: 100, currentPosture: 0 });
    expect(applyPostureDamage(target, 10).currentPosture).toBe(expected);
  });

  it('combines taken-damage, momentum and exposure multipliers and rounds upward', () => {
    const target = makePlayer({ mevcutCan: 29, maksimumCan: 100, postureDamageTaken: 1.2 });
    expect(applyPostureDamage(target, 10, 1.25).currentPosture).toBe(27);
  });

  it.each([
    [71, 25],
    [70, 12],
    [30, 12],
    [29, 3],
  ])('previews and applies recovery at %s%% HP', (hp, expected) => {
    const target = makePlayer({ mevcutCan: hp, maksimumCan: 100, currentPosture: 80 });
    expect(postureRecoveryAmount(target)).toBe(expected);
    expect(recoverPostureOnTurnEnd(target).currentPosture).toBe(80 - expected);
  });

  it('rounds recovery downward, applies the profile rate and clamps to zero', () => {
    const target = makePlayer({ mevcutCan: 100, maksimumCan: 100, maxPosture: 70,
      currentPosture: 8, postureRecoveryRate: 0.8 });
    expect(postureRecoveryAmount(target)).toBe(8);
    expect(recoverPostureOnTurnEnd(target).currentPosture).toBe(0);
  });

  it('clamps damage, marks Broken, and resets Broken posture to half', () => {
    const broken = applyPostureDamage(makePlayer({ currentPosture: 95 }), 99);
    expect(broken).toMatchObject({ currentPosture: 100, isBroken: true });
    expect(canExecute(broken)).toBe(true);
    expect(recoverPostureOnTurnEnd(broken)).toMatchObject({ currentPosture: 50, isBroken: false });
  });

  it('resolves minion, elite, boss and player executions', () => {
    const target = makePlayer({ mevcutCan: 80, maksimumCan: 100, currentPosture: 100, isBroken: true });
    expect(resolveExecute(target, 'minion').character.mevcutCan).toBe(0);
    const elite = resolveExecute(target, 'elite');
    expect(elite).toMatchObject({ damage: 35, character: { mevcutCan: 45, currentPosture: 0, isBroken: false },
      exposure: { id: 'postureExposed', duration: 2, value: 0.25 } });
    const boss = resolveExecute(target, 'boss');
    expect(boss).toMatchObject({ damage: 35, character: { mevcutCan: 45, currentPosture: 0, isBroken: false } });
    expect(boss.exposure).toBeUndefined();
    expect(resolveExecute(target, 'player', 7)).toMatchObject({ damage: 14,
      character: { mevcutCan: 66, currentPosture: 0, isBroken: false } });
  });

  it('provides profile and encounter capacities without floor scaling', () => {
    expect(initialPosture('assassin')).toMatchObject({ maxPosture: 70, postureRecoveryRate: 1, postureDamageTaken: 1.2 });
    expect(postureProfile('guardian', 'elite').maxPosture).toBe(196);
    expect(postureProfile('knight', 'boss').maxPosture).toBe(272);
  });

  it('derives card metadata and momentum from printed values', () => {
    const melee = makeCard('Yakın');
    melee.tip = 'saldırı'; melee.manaBedeli = 2; melee.effects = [{ kind: 'attack', amount: 3 }];
    expect(cardPostureMetadata(melee)).toMatchObject({ postureDamage: 40, postureCostOnBlock: 0, isRanged: false });
    const guard = makeCard('Muhafız');
    guard.tip = 'savunma'; guard.effects = [{ kind: 'block', amount: 4 }];
    expect(cardPostureMetadata(guard).postureCostOnBlock).toBe(20);
    const ranged = { ...melee, isim: 'Ateş Topu' };
    expect(cardPostureMetadata(ranged)).toMatchObject({ postureDamage: 0, isRanged: true });
    expect([1, 2, 3, 4, 5, 8].map(momentumMultiplier)).toEqual([1, 1, 1.25, 1.5, 1.75, 1.75]);
  });

  it('locks only defense while the player is Broken and prevents double Parry', () => {
    const player = makePlayer({ currentPosture: 100, isBroken: true });
    const context = { gamePhase: 'combat', isPlayerTurn: true, player,
      enemy: makePlayer({ id: 'enemy' }), currentEnergy: 3, pendingParry: false };
    const attack = { ...makeCard('Saldırı'), tip: 'saldırı' as const, effects: [{ kind: 'attack' as const, amount: 2 }] };
    const heal = { ...makeCard('Şifa'), effects: [{ kind: 'heal' as const, amount: 2 }] };
    const guard = { ...makeCard('Guard'), tip: 'savunma' as const, effects: [{ kind: 'block' as const, amount: 2 }] };
    expect(cardUnavailableReason(context, attack)).toBe('');
    expect(cardUnavailableReason(context, heal)).toBe('');
    expect(cardUnavailableReason(context, guard)).toContain('savunma');
    expect(cardUnavailableReason({ ...context, player: makePlayer(), pendingParry: true }, { ...guard, isParry: true })).toBe('Savuşturma zaten hazır');
  });
});
