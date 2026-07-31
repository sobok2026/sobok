import type { NextConfig } from 'next'

type Options = {
  /**
   * Workspace packages that ship raw TypeScript. Next externalizes node_modules by default, so a
   * `@sobok/*` dependency that is not listed here fails the build on the first un-stripped type
   * annotation it meets. Listed per app rather than defaulted: the set is a fact about what that app
   * imports, and a package silently compiled into a bundle that never uses it hides a stray dependency.
   */
  transpilePackages?: string[]
}

/**
 * The build contract every sobok static site shares: a fully pre-rendered export served from Cloudflare
 * Workers Static Assets.
 *
 * Each option is load-bearing rather than taste:
 *   - `output: 'export'`      the deployment unit is ./out, an asset directory with no Node server.
 *   - `images.unoptimized`    there is no server to run the optimizer, so the loader must be a no-op.
 *   - `reactCompiler`         all four sites rely on it; hand-written memoization is not used anywhere.
 *   - `removeConsole`         production only, and never for `error`/`warn` — those are the ones
 *                             Workers Observability and a visitor's console still need to show.
 *
 * `next-intl` is deliberately NOT applied here. Wrapping the config would put next-intl in this package's
 * dependency graph, and apps/horn ships no i18n at all; the three localized sites apply the plugin
 * themselves in one line.
 */
export function createStaticExportConfig({ transpilePackages = [] }: Options = {}): NextConfig {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    output: 'export',
    images: { unoptimized: true },
    poweredByHeader: false,
    reactCompiler: true,
    transpilePackages,

    // Overridable so a second `next dev` (e.g. another agent session) can run
    // against the same app dir without tripping Next 16's single-instance lock.
    distDir: process.env.NEXT_DIST_DIR,

    ...(isProduction && {
      compiler: { removeConsole: { exclude: ['error', 'warn'] } },
    }),
  }
}
