import { defineConfig, globalIgnores } from 'eslint/config';
import nextjsConfig from '@autosenseai/eslint-config/nextjs';

export default defineConfig([
  ...nextjsConfig,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);
