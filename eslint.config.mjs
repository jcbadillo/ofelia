import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ['.next/**', 'out/**', 'playwright-report/**', 'test-results/**', 'next-env.d.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  // Layer rule (Tech Spec §1.2): domain/ stays pure.
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/*', '@/features/*', '@/services/*', '@/db/*', '@/shared/*'], message: 'domain/ must not import other layers.' },
            { group: ['react', 'react-dom', 'next', 'next/*', 'dexie', 'dexie-react-hooks'], message: 'domain/ is pure TypeScript.' },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
