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
    {
      files: ['src/app/api/user-sync/connect/route.ts', 'src/app/api/thirdweb-fetch/route.ts', 'src/lib/user-sync.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        '@typescript-eslint/consistent-type-imports': 'off',
      },
    },
  ],
};
