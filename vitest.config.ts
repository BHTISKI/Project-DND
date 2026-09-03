import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testUtils/setup.ts'],
    reporter: 'dot',
    coverage: {
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/testUtils/**/*',
      ],
      clear: false,
    },
  },
});
