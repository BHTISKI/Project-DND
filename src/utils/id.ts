// Bu dosya src/utils/id.ts için ilgili kodları içerir.
// Rastgele ID üretimi için yardımcı fonksiyon
// Yardımcı: rastgele ID üretimi için generateRandomId fonksiyonu
// Yardımcı: rastgele ID üretimi için generateRandomId fonksiyonu
export function generateRandomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}