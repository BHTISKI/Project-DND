import type { Card, Character, EnemyAction, EnemyArchetypeId, NodeType, PostureProfile, PostureState, StatusEffect } from '../types/game';

/** Balance values live here; resolvers and previews share the same pure rules. */
export const POSTURE_CONFIG = {
  hp: { high: 0.7, low: 0.3, damage: [1, 1.35, 1.75], recovery: [0.25, 0.12, 0.03] },
  brokenResetRatio: 0.5,
  execute: { eliteHpRatio: 0.35, bossHpRatio: 0.35, playerDamageMultiplier: 2, exposure: 0.25, exposureDuration: 2 },
  parry: { successDamage: 60, failureDamage: 45 },
  card: { baseDamage: 20, perEnergy: 10, blockCostMultiplier: 5, upgradeBonus: 5 },
  momentum: { startsAt: 3, step: 0.25, maximum: 1.75 },
  encounter: { elite: 1.25, boss: 1.5 },
  profiles: {
    player: { maxPosture: 100, postureRecoveryRate: 1, postureDamageTaken: 1, attackPosture: 0 },
    goblin: { maxPosture: 70, postureRecoveryRate: 0.8, postureDamageTaken: 1.15, attackPosture: 25 },
    guardian: { maxPosture: 130, postureRecoveryRate: 0.6, postureDamageTaken: 0.85, attackPosture: 30 },
    mage: { maxPosture: 80, postureRecoveryRate: 0.9, postureDamageTaken: 1, attackPosture: 20 },
    assassin: { maxPosture: 60, postureRecoveryRate: 1, postureDamageTaken: 1.2, attackPosture: 35 },
    knight: { maxPosture: 140, postureRecoveryRate: 0.65, postureDamageTaken: 0.8, attackPosture: 40 },
  },
} as const;

export function postureProfile(kind: EnemyArchetypeId | 'player', encounter?: NodeType | null): PostureProfile {
  const { maxPosture, postureRecoveryRate, postureDamageTaken } = POSTURE_CONFIG.profiles[kind];
  const scale = kind !== 'player' && (encounter === 'elite' || encounter === 'boss') ? POSTURE_CONFIG.encounter[encounter] : 1;
  return { maxPosture: Math.ceil(maxPosture * scale), postureRecoveryRate, postureDamageTaken };
}

export function initialPosture(kind: EnemyArchetypeId | 'player' = 'player', encounter?: NodeType | null): PostureState {
  return { ...postureProfile(kind, encounter), currentPosture: 0, isBroken: false };
}

function hpBand(target: Character): 0 | 1 | 2 {
  const ratio = target.mevcutCan / Math.max(1, target.maksimumCan);
  return ratio > POSTURE_CONFIG.hp.high ? 0 : ratio >= POSTURE_CONFIG.hp.low ? 1 : 2;
}

export function postureDamageMultiplier(target: Character): number {
  return POSTURE_CONFIG.hp.damage[hpBand(target)];
}

export function postureRecoveryAmount(target: Character): number {
  if (target.isBroken || target.mevcutCan <= 0) return 0;
  return Math.min(target.currentPosture, Math.floor(target.maxPosture * POSTURE_CONFIG.hp.recovery[hpBand(target)] * target.postureRecoveryRate));
}

export function applyPostureDamage(target: Character, amount: number, multiplier = 1): Character {
  if (target.mevcutCan <= 0 || target.isBroken || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(multiplier) || multiplier <= 0) return target;
  const damage = Math.ceil(amount * postureDamageMultiplier(target) * target.postureDamageTaken * multiplier);
  const currentPosture = Math.min(target.maxPosture, Math.max(0, target.currentPosture + damage));
  return { ...target, currentPosture, isBroken: currentPosture >= target.maxPosture };
}

export function recoverPostureOnTurnEnd(target: Character): Character {
  if (target.mevcutCan <= 0) return target;
  return target.isBroken
    ? { ...target, currentPosture: Math.floor(target.maxPosture * POSTURE_CONFIG.brokenResetRatio), isBroken: false }
    : { ...target, currentPosture: Math.max(0, target.currentPosture - postureRecoveryAmount(target)) };
}

export function canExecute(target: Character): boolean {
  return target.isBroken && target.mevcutCan > 0;
}

export type ExecuteTarget = 'minion' | 'elite' | 'boss' | 'player';
export function resolveExecute(target: Character, kind: ExecuteTarget, incomingDamage = 0): { character: Character; damage: number; exposure?: StatusEffect } {
  if (!canExecute(target)) return { character: target, damage: 0 };
  const rawDamage = kind === 'minion' ? target.mevcutCan : kind === 'player'
    ? Math.max(0, incomingDamage) * POSTURE_CONFIG.execute.playerDamageMultiplier
    : Math.ceil(target.maksimumCan * (kind === 'elite' ? POSTURE_CONFIG.execute.eliteHpRatio : POSTURE_CONFIG.execute.bossHpRatio));
  const damage = Math.min(target.mevcutCan, rawDamage);
  return { character: { ...target, mevcutCan: target.mevcutCan - damage, currentPosture: 0, isBroken: false }, damage,
    ...(kind === 'elite' && target.mevcutCan > damage ? { exposure: { id: 'postureExposed' as const, stacks: 1,
      duration: POSTURE_CONFIG.execute.exposureDuration, value: POSTURE_CONFIG.execute.exposure } } : {}) };
}

export function isMeleeCard(card: Card): boolean {
  return !card.isRanged && !!card.effects?.some(effect => effect.kind === 'attack' || effect.kind === 'damage');
}

export function isGuardCard(card: Card): boolean {
  return !!card.isParry || card.tip === 'savunma' || !!card.effects?.some(effect => effect.kind === 'block' && effect.target !== 'enemy');
}

export function momentumMultiplier(count: number): number {
  return Math.min(POSTURE_CONFIG.momentum.maximum, 1 + Math.max(0, count - POSTURE_CONFIG.momentum.startsAt + 1) * POSTURE_CONFIG.momentum.step);
}

/** Called once for catalog definitions, not recalculated from upgraded HP effects. */
export function cardPostureMetadata(card: Omit<Card, 'id'>): Pick<Card, 'postureDamage' | 'postureCostOnBlock' | 'isRanged' | 'isParry'> {
  const isRanged = card.isim === 'Ateş Topu' || card.isim === 'Ateşli Yolcu';
  const isParry = card.isim === 'Ayna Duruşu';
  const attacks = card.effects?.some(effect => effect.kind === 'attack' || effect.kind === 'damage');
  const block = (card.effects ?? []).reduce((sum, effect) => sum + (effect.kind === 'block' ? effect.amount : 0), 0);
  return { isRanged, isParry,
    postureDamage: attacks && !isRanged ? POSTURE_CONFIG.card.baseDamage + POSTURE_CONFIG.card.perEnergy * card.manaBedeli : 0,
    postureCostOnBlock: isParry ? 0 : block * POSTURE_CONFIG.card.blockCostMultiplier };
}

export function isMeleeAction(action: EnemyAction): boolean {
  return !action.isRanged && ['attack', 'execution', 'desperation-attack'].includes(action.kind);
}

export function withEnemyPosture(action: EnemyAction, archetype: EnemyArchetypeId): EnemyAction {
  const isRanged = action.isRanged ?? action.kind === 'magic';
  const melee = isMeleeAction({ ...action, isRanged });
  return { ...action, isRanged,
    postureDamage: isRanged ? 0 : action.postureDamage ?? (melee ? POSTURE_CONFIG.profiles[archetype].attackPosture : 0),
    postureCostOnBlock: action.postureCostOnBlock ?? (action.kind === 'defend' ? (action.block ?? 0) * POSTURE_CONFIG.card.blockCostMultiplier : 0) };
}

interface CardPlayContext {
  gamePhase: string; isPlayerTurn: boolean; player: Character; enemy: Character;
  currentEnergy: number; pendingParry: boolean;
}
export function cardUnavailableReason(state: CardPlayContext, card: Card): string {
  if (state.gamePhase !== 'combat' || !state.isPlayerTurn) return 'Oyuncu turu değil';
  if (state.player.mevcutCan <= 0 || state.enemy.mevcutCan <= 0) return 'Bu tur hamle yapılamaz';
  if (card.onDiscardPenalty) return 'Lanetli kart oynanamaz';
  if (state.player.isBroken && isGuardCard(card)) return 'Duruşun kırık; savunma kullanamazsın';
  if (card.isParry && state.pendingParry) return 'Savuşturma zaten hazır';
  if (state.currentEnergy < card.manaBedeli) return 'Yeterli enerji yok';
  return '';
}
