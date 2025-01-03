const globals = require('globals');
const js = require('@eslint/js');
const stylisticPlugin = require('@stylistic/eslint-plugin');

const config = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
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
    plugins: {
      '@stylistic': stylisticPlugin
    },
    rules: {
      ...stylisticPlugin.configs.recommended.rules,
      
      // Custom rules
      'eqeqeq': ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Stylistic plugin rules
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/max-len': ['error', { 'code': 120 }],
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/function-paren-newline': ['error', 'consistent'],
      '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }]
    }
  }
];

const debug = false;
if (debug === true) {
  const FileSystem = require('fs');
  FileSystem.writeFile('eslint-config-DEBUG.json', JSON.stringify(config, null, 2), (error) => {
    if (error) {
      throw error;
    }
  });
}

module.exports = config;
=======
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
