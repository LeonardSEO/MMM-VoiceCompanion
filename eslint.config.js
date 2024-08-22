// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        Module: 'readonly',
        Log: 'readonly',
        MM: 'readonly',
        moment: 'readonly',
        config: 'readonly'
      }
    },
    rules: {
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'max-len': ['error', { 'code': 120 }],
      'curly': ['error', 'all'],
      'camelcase': ['error', {'properties': 'never'}],
      'no-trailing-spaces': 'error',
      'no-irregular-whitespace': 'error',
      'no-unused-vars': 'warn',
      'no-console': ['warn', { 'allow': ['warn', 'error'] }],
      'arrow-parens': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'eqeqeq': ['error', 'always'],
      'strict': ['error', 'global']
    }
  }
];
