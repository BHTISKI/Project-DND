// Bu dosya src/utils/id.ts için ilgili kodları içerir.
// Rastgele ID üretimi için yardımcı fonksiyon
// Yardımcı: rastgele ID üretimi için generateRandomId fonksiyonu
// Yardımcı: rastgele ID üretimi için generateRandomId fonksiyonu
export function generateRandomId(): string {
  return Math.random().toString(36).substr(2, 9);
}