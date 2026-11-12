import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: { parser: typescriptParser, parserOptions: { project: './tsconfig.json' } },
    rules: { 'no-undef': 'off' }
  }
];
