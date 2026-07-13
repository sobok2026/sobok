type LoginFormFieldName = 'identifier' | 'password'

export function clearIdentifier(form: HTMLFormElement | null) {
  const input = getInput(form, 'identifier')

  if (!input) {
    return
  }

  input.value = ''
  input.setCustomValidity('')
  input.focus()
}

export function clearLoginValidity(form: HTMLFormElement | null) {
  getInput(form, 'identifier')?.setCustomValidity('')
  getInput(form, 'password')?.setCustomValidity('')
}

function getInput(form: HTMLFormElement | null, field: LoginFormFieldName) {
  const input = form?.elements.namedItem(field)
  return input instanceof HTMLInputElement ? input : null
}
