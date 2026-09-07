import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Type-checking (including "no any" via JSDoc types) is tsc's job now,
      // via `npm run typecheck` — see tsconfig.json's checkJs. ESLint here
      // only needs the plain-JS equivalent of the unused-vars rule.
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Build output is generated, not authored. `.next-verify` is the isolated
    // build directory used by `NEXT_DIST_DIR=.next-verify next build`, which
    // exists so a verification build never clobbers a running dev server.
    ignores: ['.next-studio/**', '.next/**', '.next-verify/**', 'node_modules/**', 'next-env.d.ts'],
  },
]

export default config
