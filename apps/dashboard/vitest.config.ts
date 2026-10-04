import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['dotenv/config'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './src'),
      // @saasfly/db/schema is not exported by the package — redirect to db-core
      '@saasfly/db/schema': path.resolve(__dirname, '../../packages/db-core/src/schema.ts'),
    },
  },
});

