// Zar türünün ortalama değerini hesaplar
export function averageDie(die: string): number {
  const sides = parseInt(die.slice(1), 10);
  return (sides + 1) / 2;
}