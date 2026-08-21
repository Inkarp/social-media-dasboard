import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // The brief's engineering constraints: no `any`, anywhere.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Build output is generated, not authored. `.next-verify` is the isolated
    // build directory used by `NEXT_DIST_DIR=.next-verify next build`, which
    // exists so a verification build never clobbers a running dev server.
    ignores: ['.next/**', '.next-verify/**', 'node_modules/**', 'next-env.d.ts'],
  },
]

export default config
