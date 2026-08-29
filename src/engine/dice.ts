// Bu dosya src/engine/dice.ts için ilgili kodları içerir.
// Zar fonksiyonları: rollDie, averageDie gibi temel zar yardımcıları
// Zar fonksiyonları: rollDie, averageDie gibi temel zar yardımcıları
// Zar fonksiyonları: rollDie, averageDie gibi temel zar yardımcıları
export function rollDie(
  sides: number,
  rng: () => number = Math.random,
): number {
  if (!Number.isInteger(sides) || sides < 1) {
    throw new Error(`Invalid die sides: ${sides}`);
  }

  return Math.floor(rng() * sides) + 1;
}