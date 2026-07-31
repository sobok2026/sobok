import type { NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  poweredByHeader: false,
  reactCompiler: true,
  transpilePackages: ['@sobok/typography'],

  // Overridable so a second `next dev` (e.g. another agent session) can run
  // against the same app dir without tripping Next 16's single-instance lock.
  distDir: process.env.NEXT_DIST_DIR,

  ...(isProduction && {
    compiler: { removeConsole: { exclude: ['error', 'warn'] } },
  }),
}

export default nextConfig
