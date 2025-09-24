/** @type {import('@typescript-eslint/utils').TSESLint.Linter.Config} */
module.exports = {
  extends: [
    '@saasfly/eslint-config/base',
    '@saasfly/eslint-config/nextjs',
    '@saasfly/eslint-config/react',
  ],
  overrides: [
    {
      files: ['*.mjs'],
      extends: [
        'plugin:@typescript-eslint/disable-type-checked',
      ],
    },
  ],
};
