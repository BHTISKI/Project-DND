// Pure game utility functions
// Moved from src/state/store.ts to reduce store complexity
import type { Card, CardEffect } from "../types/game";
import type { IRNG } from './rng';

function upgradeDie(die: string | undefined): string | undefined {
  if (!die || !/^d\d+$/.test(die)) return die;
  const sides = Number(die.slice(1));
  return `d${sides + 2}`;
}

export function calculateUpgradeCost(rarity: Card["rarity"] | undefined, victoryCount: number): number {
  const baseCost = rarity === "legendary" ? 120 : rarity === "rare" ? 80 : rarity === "uncommon" ? 60 : 40;
  return baseCost + Math.floor(baseCost * victoryCount * 0.1);
}

export function getCardWeight(card: Pick<Card, 'rarity'>): number {
  return card.rarity === 'legendary' ? 4 : card.rarity === 'rare' ? 3 : card.rarity === 'uncommon' ? 2 : 1;
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
      } else {
        return { ...effect, die: upgradeDie(effect.die) };
      }
    case "heal":
      if (effect.amount !== undefined) {
        return {
          ...effect,
          amount: (effect.amount ?? 0) + 2,
        };
      } else {
        return { ...effect, die: upgradeDie(effect.die) };
      }
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

// A no-op must never be sold as an upgrade.
export function upgradedCard(card: Card): Card | null {
  if (card.isUpgraded || card.onDiscardPenalty) return null;
  const effects = card.effects?.map(enhanceEffect) ?? [];
  if (JSON.stringify(effects) !== JSON.stringify(card.effects ?? [])) return { ...card, effects, isUpgraded: true };
  if (card.manaBedeli > 0) return { ...card, manaBedeli: card.manaBedeli - 1, isUpgraded: true };
  return null;
}
