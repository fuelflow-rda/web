// Flat config: Next.js 16 removed `next lint`, so ESLint runs directly and
// @next/eslint-plugin-next ships flat config by default. Replaces .eslintrc.json.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // eslint-plugin-react-hooks 7 (new in eslint-config-next 16) promoted this to an
      // error. It flags 23 pre-existing effects that set state synchronously — none of
      // them regressions from the Next 16 upgrade. Demoted to a warning so the signal
      // stays visible without blocking lint; the effects are a separate cleanup.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
