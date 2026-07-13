type SignupFormFieldName = 'cf-turnstile-response' | 'email' | 'nickname' | 'password-confirm' | 'password' | 'username'

export function clearSignupInputValidity(form: HTMLFormElement | null, target: EventTarget | null) {
  if (!(target instanceof HTMLInputElement)) {
    return
  }

  target.setCustomValidity('')

  if (target.name === 'username' || target.name === 'password') {
    getSignupInput(form, 'password')?.setCustomValidity('')
  }

  if (target.name === 'password' || target.name === 'password-confirm') {
    getSignupInput(form, 'password-confirm')?.setCustomValidity('')
  }
}

export function clearSignupUsername(form: HTMLFormElement | null) {
  const input = getSignupInput(form, 'username')
  if (!input) {
    return
  }

  input.value = ''
  input.setCustomValidity('')
  getSignupInput(form, 'password')?.setCustomValidity('')
  input.focus()
}

export function clearSignupValidity(form: HTMLFormElement | null) {
  getSignupInput(form, 'email')?.setCustomValidity('')
  getSignupInput(form, 'username')?.setCustomValidity('')
  getSignupInput(form, 'nickname')?.setCustomValidity('')
  getSignupInput(form, 'password')?.setCustomValidity('')
  getSignupInput(form, 'password-confirm')?.setCustomValidity('')
}

export function getSignupInput(form: HTMLFormElement | null, field: SignupFormFieldName) {
  const input = form?.elements.namedItem(field)
  return input instanceof HTMLInputElement ? input : null
}

export function reportInputValidity(input: HTMLInputElement | null, message: string) {
  if (!input) {
    return
  }

  input.setCustomValidity(message)
  input.focus()
  input.reportValidity()
}
