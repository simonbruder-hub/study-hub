import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { __DEMO__: 'true' },
  test: {
    include: ['scripts/**/*.test.mjs', 'src/**/*.test.ts'],
    environment: 'node',
  },
});
