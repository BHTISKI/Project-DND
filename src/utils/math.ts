// Bu dosya src/utils/math.ts için ilgili kodları içerir.
// Zar türünün ortalama değerini hesaplar
// Yardımcı: zar türünün ortalama değerini hesaplayan averageDie fonksiyonu
// Yardımcı: zar türünün ortalama değerini hesaplayan averageDie fonksiyonu
export function averageDie(die: string): number {
  const sides = parseInt(die.slice(1), 10);
  return (sides + 1) / 2;
}