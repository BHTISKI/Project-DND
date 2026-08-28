let originalRandom: typeof Math.random = Math.random;
let mockValues: number[] = [];
let mockIndex = 0;

/**
 * Sets up a mock for Math.random that returns values from the provided array in sequence.
 * After exhausting the array, it returns the last value for subsequent calls.
 * @param values Array of numbers to be returned by Math.random in order.
 * @returns A reset function that restores the original Math.random.
 */
export function setupMockRandom(values: number[]) {
  mockValues = [...values];
  mockIndex = 0;
  Math.random = (): number => {
    if (mockValues.length === 0) {
      return 0;
    }
    if (mockIndex >= mockValues.length) {
      // If we run out of mock values, return the last value.
      return mockValues[mockValues.length - 1];
    }
    return mockValues[mockIndex++];
  };
  return resetMockRandom;
}

/**
 * Resets Math.random to its original implementation and clears the mock values.
 */
export function resetMockRandom() {
  Math.random = originalRandom;
  mockValues = [];
  mockIndex = 0;
}

/**
 * Alias for setupMockRandom for convenience in tests.
 */
export const mockRandom = setupMockRandom;

/**
 * Runs a callback with a mocked Math.random, then resets the mock.
 * Handles synchronous and asynchronous callbacks, and ensures reset even if the callback throws.
 * @param values Array of mock values for Math.random.
 * @param callback Function to execute with the mock in place.
 * @returns A promise that resolves with the callback's result.
 */
export async function withMockRandom<T>(values: number[], callback: () => T | Promise<T>): Promise<T> {
  const reset = setupMockRandom(values);
  try {
    return await callback();
  } finally {
    reset();
  }
}

/**
 * Creates a mock DataTransfer object for testing drag-and-drop events.
 * @returns An object that mimics the DataTransfer interface.
 */
export function createDataTransfer() {
  const storage = new Map<string, string>();
  return {
    setData(format: string, value: string) {
      storage.set(format, value);
    },
    getData(format: string): string {
      return storage.get(format) ?? '';
    },
    clearData(format?: string) {
      if (format) {
        storage.delete(format);
      } else {
        storage.clear();
      }
    },
    // The following properties are not used in the test but are part of the DataTransfer interface.
    items: [] as unknown as DataTransferItemList,
    types: [] as string[],
    // Add other methods if needed, but the test only uses setData and getData.
  } as unknown as DataTransfer;
}