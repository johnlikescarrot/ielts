import js from '@eslint/js';
import globals from 'globals';
import jsonc from 'eslint-plugin-jsonc';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const typescriptRules = {
  ...js.configs.recommended.rules,
  ...tsPlugin.configs.recommended.rules,
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
};

export default [
  ...jsonc.configs['flat/recommended-with-json'].map(config => ({
    ...config,
    files: ['**/*.json'],
  })),
  {
    ignores: ['dist', 'coverage', 'node_modules'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: typescriptRules,
  },
];
