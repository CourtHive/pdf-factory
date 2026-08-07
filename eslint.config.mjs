import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      sonarjs,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
      'sonarjs/cognitive-complexity': ['warn', 30],
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/todo-tag': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    // Each renderer test emits a DISTINCT artifact (traditional-16-itf.pdf,
    // traditional-32-wimbledon.pdf, traditional-32-rg.pdf, …). Collapsing them into one
    // parameterized case would merge separately-named outputs and turn per-preset failures
    // into a single opaque one — the named `it` blocks are the point.
    files: ['src/**/__tests__/**/*.ts', 'src/**/*.test.ts'],
    rules: {
      'sonarjs/parameterized-tests': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'storybook-static/', '__output__/', '*.config.*'],
  },
];
