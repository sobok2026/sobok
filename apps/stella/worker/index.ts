export default {
  fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      return env.DATABASE.fetch(request)
    }
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<StellaPublicBindings>
