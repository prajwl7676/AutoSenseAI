import nestjsConfig from '@autosenseai/eslint-config/nestjs';

export default [
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**'],
  },
  ...nestjsConfig,
];
