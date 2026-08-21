import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Every page here is `force-dynamic` and reads live, shared data — a post
   * added or deleted by anyone should show up on the next visit, not "up to
   * 30 seconds later". That default is what the Client Router Cache normally
   * gives a dynamic segment; `router.refresh()` is supposed to bypass it, but
   * this removes the ambiguity outright rather than depending on refresh()
   * correctly beating a client-side cache window on every call site.
   */
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },

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
