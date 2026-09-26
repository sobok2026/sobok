import { createStaticExportConfig } from '@sobok/next-config/next'

export default createStaticExportConfig({
  transpilePackages: ['@sobok/auth', '@sobok/std', '@sobok/typography'],
})
