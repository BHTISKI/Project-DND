// Bu dosya src/engine/combatMath.ts için ilgili kodları içerir.
// Yardımcı: saldırı/blok hesaplamaları, zar ortalamaları ve kritik çarpanı
// Yardımcı: saldırı/blok hesaplamaları, zar ortalamaları ve kritik çarpanı
// Yardımcı: saldırı/blok hesaplamaları, zar ortalamaları ve kritik çarpanı
export interface AttackResult {
  roll: number;
  hit: boolean;
  critical: boolean;
  criticalFail: boolean;
}

export function resolveAttackRoll(
  roll: number,
  attackBonus: number,
  targetAC: number,
): AttackResult {
  const critical = roll === 20;
  const criticalFail = roll === 1;

  return {
    roll,
    critical,
    criticalFail,
    hit: !criticalFail && (critical || roll + attackBonus >= targetAC),
  };
}

export function calculateDamage(
  dieRoll: number,
  baseDamage: number,
  powerModifier: number,
  bonus = 0,
): number {
  return Math.max(0, dieRoll + baseDamage + powerModifier + bonus);
}