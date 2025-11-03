/** @type {import('@typescript-eslint/utils').TSESLint.Linter.Config} */
module.exports = {
  extends: [
    '@saasfly/eslint-config/base',
    '@saasfly/eslint-config/nextjs',
    '@saasfly/eslint-config/react',
  ],
  ignorePatterns: [
    'scripts/**',
    // Exclude root-level scripts from React/TypeScript linting
    '../export-*.js',
    '../import-*.js',
    '../grant-*.js',
    '../fix-*.js',
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
      files: ['src/app/api/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['src/app/api/projects/typeform-webhook/route.ts'],
      rules: {
        '@typescript-eslint/prefer-optional-chain': 'off',
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
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
      },
    },
    {
      files: [
        'src/lib/gamification/service.ts',
        'src/app/api/gamification/**/*.ts',
        'src/app/api/education/**/*.ts',
        'src/app/(dashboard)/leaderboard/page.tsx',
        'src/app/(dashboard)/profile/achievements/page.tsx',
        'src/hooks/useRealGamification.ts',
        'src/hooks/useReferralDetection.ts',
        'src/hooks/useThirdwebUserSync.ts'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        'react/jsx-key': 'off',
        'react-hooks/exhaustive-deps': 'off'
      }
    },
    {
      files: [
        'src/components/ConversationalForm.tsx'
      ],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@next/next/no-img-element': 'off'
      }
    },
    {
      files: [
        'src/app/(dashboard)/debug/database/page.tsx'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/array-type': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        'react/no-unescaped-entities': 'off'
      }
    },
  ],
};
