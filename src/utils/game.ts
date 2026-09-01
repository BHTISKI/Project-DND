// Pure game utility functions
// Moved from src/state/store.ts to reduce store complexity
import type { Card, CardEffect } from "../types/game";
import type { IRNG } from './rng';

export function calculateUpgradeCost(rarity: Card["rarity"] | undefined, victoryCount: number): number {
  const baseCost = rarity === "legendary" ? 120 : rarity === "rare" ? 80 : rarity === "uncommon" ? 60 : 40;
  return baseCost + Math.floor(baseCost * victoryCount * 0.1);
}

export function enhanceEffect(effect: CardEffect): CardEffect {
  switch (effect.kind) {
    case "attack":
    case "damage":
      return {
        ...effect,
        damageBonus: (effect.damageBonus ?? 0) + 2,
      };
    case "block":
      if (effect.amount !== undefined) {
        return {
          ...effect,
          amount: (effect.amount ?? 0) + 2,
        };
      } else if (effect.die) {
        const dieMap: Record<string, string> = {
          "d4": "d6",
          "d6": "d8",
          "d8": "d10",
          "d10": "d12",
          "d12": "d20",
        };
        const newDie = dieMap[effect.die] || effect.die;
        return {
          ...effect,
          die: newDie,
        };
      }
      return effect;
    case "heal":
      if (effect.amount !== undefined) {
        return {
          ...effect,
          amount: (effect.amount ?? 0) + 2,
        };
      } else if (effect.die) {
        const dieMap: Record<string, string> = {
          "d4": "d6",
          "d6": "d8",
          "d8": "d10",
          "d10": "d12",
          "d12": "d20",
        };
        const newDie = dieMap[effect.die] || effect.die;
        return {
          ...effect,
          die: newDie,
        };
      }
      return effect;
    case "status":
      return {
        ...effect,
        duration: (effect.duration ?? 0) + 1,
        stacks: (effect.stacks ?? 1) + 1,
      };
    case "draw":
      return {
        ...effect,
        amount: (effect.amount ?? 0) + 1,
      };
    case "energy":
      return {
        ...effect,
        amount: (effect.amount ?? 0) + 1,
      };
    case "skip":
      return effect;
    default:
      return effect;
  }
}

export function shuffle<T>(array: T[], rng?: IRNG): T[] {
  const arr = array.slice();
  const random = rng ? () => rng.random() : Math.random;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}