module.exports = {
  root: true,
  extends: ['../../.eslintrc.cjs'],
  env: {
    jest: true,
  },
  rules: {
    // NestJS resolves constructor-injected dependencies via
    // emitDecoratorMetadata, which needs the real (value) import of the
    // class. Auto-fixing those to `import type` silently breaks DI at
    // runtime, so this rule is off for the API.
    '@typescript-eslint/consistent-type-imports': 'off',
  },
};
