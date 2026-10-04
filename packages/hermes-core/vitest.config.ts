import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['dotenv/config', './vitest.setup.ts'],
    env: {
      DATABASE_URL: 'postgres://test:test@localhost:5432/testdb',
      HERMES_REASONING_PROVIDER: 'mock'
    }
  },
});
