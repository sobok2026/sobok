import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const isProduction = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  poweredByHeader: false,
  reactCompiler: true,
  // NOTE: @sobok/edge is used by the Worker bundle only (wrangler bundles it directly), so it does not
  // belong here yet. If any of it ever enters the Next graph — the board-bake prerender path already reaches
  // into worker/db/schema, so moving worker/db/columns.ts into the package would do it — this list must gain
  // '@sobok/edge' or `next build` fails on raw .ts inside node_modules.
  transpilePackages: ['@sobok/analytics', '@sobok/domain', '@sobok/typography'],

  // Overridable so a second `next dev` (e.g. another agent session) can run
  // against the same app dir without tripping Next 16's single-instance lock.
  distDir: process.env.NEXT_DIST_DIR,

  ...(isProduction && {
    compiler: { removeConsole: { exclude: ['error', 'warn'] } },
  }),
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(nextConfig)
