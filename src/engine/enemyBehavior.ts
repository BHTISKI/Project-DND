import type { Character, EnemyAction, EnemyArchetypeId, EnemyBehaviorId, EnemyIntent, EnemyTelegraph, PlayerSignal, StatusEffect } from '../types/game';
import { enemyArchetypes } from './enemyArchetypes';

export interface EnemyBehaviorContext {
  behavior: EnemyBehaviorId; archetype: EnemyArchetypeId; enemy: Character; player: Character;
  playerBlock: number; enemyBlock: number;
  playerStatuses: StatusEffect[]; previousIntent: EnemyIntent | null;
  lastPlayerSignal: PlayerSignal; desperationStacks: number; canLie: boolean;
  random?: () => number;
}
export interface EnemyDecision {
  action: EnemyAction; telegraph: EnemyTelegraph; nextDesperationStacks: number; reason?: string;
}
export function actionFromIntent(intent: EnemyIntent | null): EnemyAction {
  if (intent?.action) return intent.action;
  if (intent?.type === 'defend') return { kind: 'defend', block: intent.estimatedBlock ?? 0 };
  if (intent?.estimatedHeal !== undefined) return { kind: 'heal', damage: intent.estimatedHeal };
  if (intent?.effectKey === 'weakened') return { kind: 'weaken' };
  if (intent?.type === 'special') return { kind: 'magic', damage: intent.estimatedDamage ?? 0 };
  return { kind: 'attack', damage: intent?.estimatedDamage ?? 4 };
}

export function decideEnemyBehavior(context: EnemyBehaviorContext): EnemyDecision {
  const random = context.random ?? Math.random;
  const profile = enemyArchetypes[context.archetype];
  const attackDamage = profile.attackDamage + context.enemy.hasarBonusu;
  const enemyHealth = context.enemy.mevcutCan / Math.max(1, context.enemy.maksimumCan);
  const postureRisk = context.enemy.currentPosture / Math.max(1, context.enemy.maxPosture) >= 0.7;
  const desperate = context.enemy.mevcutCan / Math.max(1, context.enemy.maksimumCan) < 0.25;
  const stacks = context.desperationStacks + (desperate ? 1 : 0);
  if (context.player.isBroken) return {
    action: { kind: 'execution', damage: attackDamage },
    telegraph: { type: 'attack', label: 'İnfaz fırsatını kullanacak', icon: '☠' },
    nextDesperationStacks: stacks,
    reason: 'Duruşun kırıldığı için doğrudan İnfaza hazırlanıyor.',
  };
  if (context.behavior === 'paranoid' && ['parry', 'retaliation'].includes(context.lastPlayerSignal)) {
    const poison = random() < 0.5;
    return { action: poison ? { kind: 'poison', poison: 2 } : { kind: 'pass' },
      telegraph: poison ? { type: 'special', label: 'Savuşturmayı zehirle bozacak', icon: '☣' }
        : { type: 'defend', label: 'Savuşturmadan geri çekilecek', icon: '◈' }, nextDesperationStacks: stacks,
      reason: 'Hazırladığın Savuşturmayı gördü ve yakın saldırıdan vazgeçti.' };
  }
  if (postureRisk && !desperate && context.enemyBlock < profile.block) return {
    action: { kind: 'defend', block: profile.block },
    telegraph: { type: 'defend', label: 'Dengesini koruyacak', icon: '◈' },
    nextDesperationStacks: stacks,
    reason: 'Dengesi kırılmaya yaklaştığı için savunmaya geçti.',
  };
  if (profile.special === 'heal' && enemyHealth <= 0.45) return {
    action: { kind: 'heal', damage: 4 },
    telegraph: { type: 'special', label: 'Yaralarını saracak', icon: '✦' },
    nextDesperationStacks: stacks,
    reason: 'Canı azaldığı için saldırmak yerine iyileşmeyi seçti.',
  };
  if (desperate) return {
    action: { kind: 'desperation-attack', damage: attackDamage + stacks, ignoresBlock: true },
    telegraph: { type: 'attack', label: 'Çaresizlik: bloğu delen saldırı', icon: '☠' },
    nextDesperationStacks: stacks,
    reason: 'Canı kritik olduğu için savunmayı delen riskli bir saldırı seçti.',
  };
  if (context.player.mevcutCan <= attackDamage + 1 && context.playerBlock < attackDamage) return {
    action: { kind: 'execution', damage: attackDamage + 1 },
    telegraph: { type: 'attack', label: 'Son darbeyi arıyor', icon: '☠' },
    nextDesperationStacks: stacks,
    reason: 'Canının az ve bloğunun yetersiz olduğunu fark etti.',
  };
  if (context.behavior === 'paranoid' && context.archetype === 'mage' && context.playerBlock >= attackDamage) return {
    action: { kind: 'magic', damage: 6 + context.enemy.hasarBonusu, isRanged: true },
    telegraph: { type: 'special', label: 'Bloğu aşan büyü yapacak', icon: '✦' },
    nextDesperationStacks: stacks,
    reason: 'Bloğuna karşı uzaktan büyü kullanmayı seçti.',
  };
  if (context.behavior === 'opportunist' && context.playerBlock >= attackDamage && profile.special === 'weakened') return {
    action: { kind: 'weaken' }, telegraph: { type: 'special', label: 'Savunmanı zayıflatacak', icon: '✦' },
    nextDesperationStacks: stacks, reason: 'Bloğunu doğrudan zorlamak yerine seni güçsüzleştirecek.',
  };
  const base = actionFromIntent(context.previousIntent);
  if (context.behavior === 'opportunist' && context.lastPlayerSignal === 'no-block' && base.kind === 'attack')
    return { action: { kind: 'execution', damage: (base.damage ?? 4) + 2 },
      telegraph: { type: 'attack', label: 'Fırsat saldırısı', icon: '⚔' }, nextDesperationStacks: stacks };
  if (context.canLie && random() < 0.2) return {
    action: { kind: 'heal', damage: 4 },
    telegraph: { type: 'attack', label: 'Saldıracak', icon: '⚔', deceptive: true }, nextDesperationStacks: stacks,
  };
  const type = context.previousIntent?.type ?? 'attack';
  return { action: base, telegraph: { type,
    label: base.kind === 'defend' ? 'Savunacak' : base.kind === 'heal' ? 'Can yenileyecek'
      : base.kind === 'weaken' ? 'Güçsüzleştirecek' : base.kind === 'magic' ? 'Büyü yapacak' : 'Saldıracak',
    icon: type === 'attack' ? '⚔' : type === 'defend' ? '◈' : '✦' }, nextDesperationStacks: stacks };
}
