import baseConfig from '/action/lib/.automation/eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // This extension runs in Firefox and jsdom rather than Node.js.
      'n/no-missing-import': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
