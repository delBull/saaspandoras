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
    {
      files: [
        'src/components/sidebar.tsx',
        'src/app/(dashboard)/profile/projects/page.tsx',
        'src/app/(dashboard)/profile/page.tsx',
        'src/app/(dashboard)/profile/dashboard/page.tsx'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
      },
    },
  ],
};
