import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@generators': resolve(__dirname, 'src/generators'),
      '@layout': resolve(__dirname, 'src/layout'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
  build: {
    lib: {
      entry: {
        'pdf-factory': resolve(__dirname, 'src/index.ts'),
        parser: resolve(__dirname, 'src/parser.ts'),
      },
    },
    rollupOptions: {
      external: ['tods-competition-factory', 'jspdf', 'jspdf-autotable'],
    },
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30000,
  },
});
