const AUTHENTICATION_RETURN = 'sobok_auth_complete'

const authorizationParameters = [
  'response_type',
  'redirect_uri',
  'scope',
  'state',
  'client_id',
  'prompt',
  'display',
  'ui_locales',
  'max_age',
  'acr_values',
  'login_hint',
  'id_token_hint',
  'code_challenge',
  'code_challenge_method',
  'nonce',
] as const

function isAuthorizationInteraction(params: URLSearchParams): boolean {
  return params.has('sig') && params.has('client_id') && params.has('redirect_uri')
}

/**
 * Email verification and magic-link endpoints finish on a later browser request,
 * while Google One Tap deliberately navigates to its callback URL instead of the
 * response redirect. This explicit marker lets the static login page resume only
 * a completed authentication flow; an already-authenticated user sent to
 * `prompt=login` is never silently advanced.
 */
export function authenticationReturnURL(): string {
  const params = new URLSearchParams(window.location.search)
  if (!isAuthorizationInteraction(params)) return '/account'

  params.set(AUTHENTICATION_RETURN, '1')
  return `${window.location.pathname}?${params}`
}

export function pendingAuthorizationURL(): string | null {
  const params = new URLSearchParams(window.location.search)
  if (params.get(AUTHENTICATION_RETURN) !== '1' || !isAuthorizationInteraction(params)) return null

  const authorization = new URLSearchParams()
  for (const name of authorizationParameters) {
    if (name === 'prompt') {
      const remainingPrompts = (params.get('prompt') ?? '')
        .split(' ')
        .filter((prompt) => prompt && prompt !== 'login' && prompt !== 'create')
      if (remainingPrompts.length > 0) authorization.set('prompt', remainingPrompts.join(' '))
      continue
    }
    for (const value of params.getAll(name)) authorization.append(name, value)
  }

  return `/api/auth/oauth2/authorize?${authorization}`
}
