// Bu dosya src/testUtils/random.ts için ilgili kodları içerir.
// Gerçek rastgele sayı üretimi için küçük sarıcılar
// Gerçek rastgele sayı üretimi için küçük sarıcılar
import { vi } from 'vitest';

let randomSpy: ReturnType<typeof vi.spyOn> | undefined;

export function mockRandom(values: number[]) {
  if (values.length === 0) {
    throw new Error('mockRandom requires at least one value');
  }

  resetMockRandom();
  let index = 0;
  randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
    const value = values[Math.min(index++, values.length - 1)];
    return value;
  });
  return randomSpy;
}

export function resetMockRandom() {
  randomSpy?.mockRestore();
  randomSpy = undefined;
}

export async function withMockRandom<T>(values: number[], callback: () => T | Promise<T>): Promise<T> {
  mockRandom(values);
  try {
    return await callback();
  } finally {
    resetMockRandom();
  }
}
