export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname
    if (path.startsWith('/api/') || path.startsWith('/.well-known/')) {
      return env.DATABASE.fetch(request)
    }
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<AccountsPublicBindings>
