import type { Character, EnemyAction, EnemyBehaviorId, EnemyIntent, EnemyTelegraph, PlayerSignal, StatusEffect } from '../types/game';

export interface EnemyBehaviorContext {
  behavior: EnemyBehaviorId; enemy: Character; player: Character; playerBlock: number;
  playerStatuses: StatusEffect[]; previousIntent: EnemyIntent | null;
  lastPlayerSignal: PlayerSignal; desperationStacks: number; canLie: boolean;
  random?: () => number;
}
export interface EnemyDecision {
  action: EnemyAction; telegraph: EnemyTelegraph; nextDesperationStacks: number;
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
  const desperate = context.enemy.mevcutCan / Math.max(1, context.enemy.maksimumCan) < 0.25;
  const stacks = context.desperationStacks + (desperate ? 1 : 0);
  if (desperate) return {
    action: { kind: 'desperation-attack', damage: 5 + stacks, ignoresBlock: true },
    telegraph: { type: 'attack', label: 'Çaresizlik: bloğu delen saldırı', icon: '☠' },
    nextDesperationStacks: stacks,
  };
  const base = actionFromIntent(context.previousIntent);
  if (context.behavior === 'opportunist' && context.lastPlayerSignal === 'no-block' && base.kind === 'attack')
    return { action: { kind: 'execution', damage: (base.damage ?? 4) + 2 },
      telegraph: { type: 'attack', label: 'Fırsat saldırısı', icon: '⚔' }, nextDesperationStacks: stacks };
  if (context.behavior === 'paranoid' && ['parry', 'retaliation'].includes(context.lastPlayerSignal)) {
    const poison = random() < 0.5;
    return { action: poison ? { kind: 'poison', poison: 2 } : { kind: 'pass' },
      telegraph: poison ? { type: 'special', label: 'Zehir saçacak', icon: '☣' }
        : { type: 'defend', label: 'Geri çekilecek', icon: '◈' }, nextDesperationStacks: stacks };
  }
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
