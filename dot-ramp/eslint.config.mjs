// eslint.config.js

import { FlatCompat } from '@eslint/eslintrc';


export default [
  {
    ignores: ['app/descriptors/**'],
  },
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  }),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-img-element': 'off',
    }
  }
];
