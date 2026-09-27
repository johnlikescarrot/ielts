import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import jsonc from 'eslint-plugin-jsonc';

export default tseslint.config(
  ...jsonc.configs['flat/recommended-with-json'].map(config => ({
    ...config,
    files: ['**/*.json'],
  })),

  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  }
);
