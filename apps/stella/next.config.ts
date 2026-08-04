import { createStaticExportConfig } from '@sobok/next-config/next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(
  createStaticExportConfig({
    // NOTE: @sobok/edge is used by the Worker bundle only (wrangler bundles it directly), so it does not
    // belong here yet. If any of it ever enters the Next graph — the board-bake prerender path already
    // reaches into worker/db/schema, so moving worker/db/columns.ts into the package would do it — this
    // list must gain '@sobok/edge' or `next build` fails on raw .ts inside node_modules.
    transpilePackages: [
      '@sobok/analytics',
      '@sobok/auth',
      '@sobok/brand',
      '@sobok/domain',
      '@sobok/site-chrome',
      '@sobok/site-i18n',
      '@sobok/site-seo',
      '@sobok/typography',
    ],
  }),
)
