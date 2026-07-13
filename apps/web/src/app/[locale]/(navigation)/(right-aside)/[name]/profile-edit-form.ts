export type EditableProfile = {
  id: string
  email: string
  name: string
  username: string | null
  image: string | null
}

export type ProfileFieldErrors = Partial<Record<ProfileFieldName, string>>

export type ProfileEditPatch = {
  name?: string
  username?: string
  image?: string | null
}

type ProfileFieldName = 'image' | 'name' | 'username'

const profileInputNames: Record<ProfileFieldName, ProfileFieldName> = {
  username: 'username',
  name: 'name',
  image: 'image',
}

export function buildProfileEditPatch(me: EditableProfile, formData: FormData): ProfileEditPatch | null {
  const username = String(formData.get(profileInputNames.username) ?? '')
  const name = String(formData.get(profileInputNames.name) ?? '')
  const rawImage = String(formData.get(profileInputNames.image) ?? '')
  const image = rawImage === '' ? null : rawImage
  const patch: ProfileEditPatch = {}

  if (username && username !== me.username) {
    patch.username = username
  }

  if (name !== me.name) {
    patch.name = name
  }

  if (image !== me.image) {
    patch.image = image
  }

  return Object.keys(patch).length > 0 ? patch : null
}

export function clearProfileInputValidity(target: EventTarget | null) {
  if (!(target instanceof HTMLInputElement) || !isProfileFieldName(target.name)) {
    return
  }

  target.setCustomValidity('')
}

export function clearProfileValidity(form: HTMLFormElement | null) {
  getProfileInput(form, profileInputNames.username)?.setCustomValidity('')
  getProfileInput(form, profileInputNames.name)?.setCustomValidity('')
  getProfileInput(form, profileInputNames.image)?.setCustomValidity('')
}

function getProfileInput(form: HTMLFormElement | null, field: ProfileFieldName) {
  const input = form?.elements.namedItem(field)
  return input instanceof HTMLInputElement ? input : null
}

function isProfileFieldName(name: string): name is ProfileFieldName {
  return name === 'username' || name === 'name' || name === 'image'
}
