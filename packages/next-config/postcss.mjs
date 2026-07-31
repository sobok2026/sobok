// Plain .mjs rather than TypeScript: postcss-load-config reads this through the app's own
// postcss.config.mjs, outside anything that strips types.

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
