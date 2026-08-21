import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Build output directory, overridable per invocation.
   *
   * Running `next build` against the same `.next` that a live `next dev` is using
   * replaces the dev server's vendor chunks underneath it, and every route starts
   * throwing `Cannot find module ./vendor-chunks/....js` until it recompiles.
   * Setting NEXT_DIST_DIR lets a verification build run in isolation:
   *
   *   NEXT_DIST_DIR=.next-verify npx next build
   */
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
}

export default nextConfig
