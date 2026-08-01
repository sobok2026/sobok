const ALLOWED_PROFILE_IMAGE_PROTOCOLS = new Set(['http:', 'https:'])

export function getSafeProfileImageUrl(value: string | null | undefined): string | undefined {
  if (!value) {
    return
  }

  const trimmedValue = value.trim()

  if (!trimmedValue || !isSafeProfileImageUrl(trimmedValue)) {
    return
  }

  return trimmedValue
}

export function isSafeProfileImageUrl(value: string): boolean {
  if (!URL.canParse(value)) {
    return false
  }

  return ALLOWED_PROFILE_IMAGE_PROTOCOLS.has(new URL(value).protocol)
}
