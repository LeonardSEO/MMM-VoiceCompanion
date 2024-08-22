const globals = require('globals');
const js = require('@eslint/js');
const eslintPluginImport = require('eslint-plugin-import');
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
      import: eslintPluginImport,
      '@stylistic': stylisticPlugin
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.json']
        }
      }
    },
    rules: {
      ...eslintPluginImport.configs.recommended.rules,
      ...stylisticPlugin.configs.recommended.rules,
      
      // Custom rules
      'eqeqeq': ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Import plugin rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'warn',
      'import/no-webpack-loader-syntax': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',

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
