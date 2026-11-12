import js from '@eslint/js';
export default [js.configs.recommended, { files: ['**/*.ts'], languageOptions: { parserOptions: { project: './tsconfig.json' } }, rules: { 'no-undef': 'off' } }];
