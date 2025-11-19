// eslint.config.js

import { FlatCompat } from '@eslint/eslintrc';


export default [
  {
    ignores: ['app/descriptors/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-img-element': 'off',
    }
  }
];
