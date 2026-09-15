import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/services/**/*.js', 'src/utils/**/*.js'],
      exclude: ['src/services/firebase/firebaseConfig.js', 'node_modules/**'],
    },
    include: [
      'tests/unit/**/*.test.js',
    ],
    exclude: [
      'tests/rules/**',
      'node_modules/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
