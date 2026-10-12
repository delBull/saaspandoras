import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'react' },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['dotenv/config'],
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '~': new URL('./src', import.meta.url).pathname,
      // @saasfly/db/schema is not exported by the package — redirect to db-core
      '@saasfly/db/schema': new URL('../../packages/db-core/src/schema.ts', import.meta.url).pathname,
    },
  },
});

