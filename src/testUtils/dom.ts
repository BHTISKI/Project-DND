// Bu dosya src/testUtils/dom.ts için ilgili kodları içerir.
// DOM test yardımcıları: jsdom ile test ortamı hazırlama
// DOM test yardımcıları: jsdom ile test ortamı hazırlama
export function createDataTransfer() {
  const data = new Map<string, string>();

  return {
    dropEffect: 'move',
    effectAllowed: 'all',
    files: [],
    items: [],
    types: [],
    clearData: () => data.clear(),
    getData: (format: string) => data.get(format) ?? '',
    setData: (format: string, value: string) => data.set(format, value),
  } as unknown as DataTransfer;
}
