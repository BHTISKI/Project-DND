import { sampleCardDefs } from '../types/game';
import type { NodeType } from '../types/game';
import { shuffle } from '../utils/game';
import { generateRandomId } from '../utils/id';

export function getRandomRewards(count = 3) {
  return shuffle(sampleCardDefs).slice(0, count).map(def => ({ ...def, id: generateRandomId() }));
}

export function encounterReward(type: NodeType | null, victories: number) {
  const normalGold = 20 + victories * 5;
  return {
    gold: type === 'boss' ? 50 + victories * 10 : type === 'elite' ? normalGold + Math.floor(normalGold * 0.5) : normalGold,
    cards: getRandomRewards(type === 'boss' ? 4 : 3),
  };
}
