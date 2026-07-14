import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const isProduction = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  poweredByHeader: false,
  reactCompiler: true,
  transpilePackages: ['@sobok/domain'],

  // Overridable so a second `next dev` (e.g. another agent session) can run
  // against the same app dir without tripping Next 16's single-instance lock.
  distDir: process.env.NEXT_DIST_DIR,

  ...(isProduction && {
    compiler: { removeConsole: { exclude: ['error', 'warn'] } },
  }),
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(nextConfig)
