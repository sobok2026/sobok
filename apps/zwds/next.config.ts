import { createStaticExportConfig } from '@sobok/next-config/next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(
  createStaticExportConfig({
    transpilePackages: ['@sobok/analytics', '@sobok/brand', '@sobok/domain', '@sobok/site-i18n', '@sobok/typography'],
  }),
)
