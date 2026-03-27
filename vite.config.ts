import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

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
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PdfFactory',
      formats: ['es', 'cjs'],
      fileName: (format) => `pdf-factory.${format === 'es' ? 'mjs' : 'cjs'}`,
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
