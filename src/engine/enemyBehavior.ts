import type { Character, EnemyAction, EnemyBehaviorId, EnemyIntent, EnemyTelegraph, PlayerSignal, StatusEffect } from '../types/game';

export interface EnemyBehaviorContext {
  behavior: EnemyBehaviorId;
  enemy: Character;
  player: Character;
  playerBlock: number;
  playerStatuses: StatusEffect[];
  previousIntent: EnemyIntent | null;
  lastPlayerSignal: PlayerSignal;
  desperationStacks: number;
  canLie: boolean;
  random?: () => number;
}

export interface EnemyDecision {
  action: EnemyAction;
  telegraph: EnemyTelegraph;
  nextDesperationStacks: number;
}

function desperationActive(enemy: Character): boolean {
  return enemy.mevcutCan / Math.max(1, enemy.maksimumCan) < 0.25;
}

function attackTelegraph(label = 'Saldıracak'): EnemyTelegraph {
  return { type: 'attack', label, icon: '⚔' };
}

export function decideEnemyBehavior(context: EnemyBehaviorContext): EnemyDecision {
  const random = context.random ?? Math.random;
  const activeDesperation = desperationActive(context.enemy);
  const nextDesperationStacks = activeDesperation
    ? context.desperationStacks + 1
    : context.desperationStacks;

  if (activeDesperation) {
    const damage = 5 + nextDesperationStacks;
    return {
      action: { kind: 'desperation-attack', damage, ignoresBlock: true },
      telegraph: { type: 'attack', label: 'ÇARESİZLİK: Zırh Kıran Saldırı', icon: '☠' },
      nextDesperationStacks,
    };
  }

  if (context.behavior === 'opportunist' && context.lastPlayerSignal === 'no-block') {
    return {
      action: { kind: 'critical-execution', damage: 10 },
      telegraph: { type: 'attack', label: 'Kritik İnfaz', icon: '⚔' },
      nextDesperationStacks,
    };
  }

  if (context.behavior === 'paranoid' && (context.lastPlayerSignal === 'parry' || context.lastPlayerSignal === 'retaliation')) {
    if (random() < 0.5) {
      return {
        action: { kind: 'poison', poison: 2 },
        telegraph: { type: 'special', label: 'Zehir Saçacak', icon: '☣' },
        nextDesperationStacks,
      };
    }
    return {
      action: { kind: 'pass' },
      telegraph: { type: 'defend', label: 'Geri çekilecek', icon: '◈' },
      nextDesperationStacks,
    };
  }

  const deceptive = context.canLie && random() < 0.2;
  if (deceptive) {
    return {
      action: { kind: 'heal', damage: 4 },
      telegraph: { type: 'attack', label: 'Saldıracak', icon: '⚔', deceptive: true },
      nextDesperationStacks,
    };
  }

  return {
    action: { kind: 'attack', damage: 4 },
    telegraph: attackTelegraph(),
    nextDesperationStacks,
  };
}