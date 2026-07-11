import { z } from 'zod'

// BBaton — 익명 성인인증 OAuth 제공자. 토큰 교환은 Basic 인증, 프로필은 별도 API 오리진.
// https://bauth.bbaton.com (인가/토큰), https://bapi.bbaton.com (프로필)

export const BBATON_PROVIDER_ID = 'bbaton'
export const BBATON_AUTHORIZATION_URL = 'https://bauth.bbaton.com/oauth/authorize'
export const BBATON_TOKEN_URL = 'https://bauth.bbaton.com/oauth/token'
export const BBATON_SCOPES = ['read_profile']

const bbatonGenderSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.enum(['f', 'female', 'm', 'male']))
  .transform((value) => (value === 'f' || value === 'female' ? ('F' as const) : ('M' as const)))

const bbatonProfileSchema = z
  .object({
    adult_flag: z.enum(['N', 'Y']),
    birth_year: z.string().regex(/^\d+$/),
    gender: bbatonGenderSchema,
    income: z.string().min(1),
    student: z.string().min(1),
    user_id: z.string().min(1),
  })
  .transform(({ adult_flag, birth_year, gender, income, student, user_id }) => ({
    adult: adult_flag === 'Y',
    birthYear: parseBirthYear(birth_year),
    gender,
    income,
    student: student === 'Y',
    userId: user_id,
  }))

export type BBatonProfile = z.infer<typeof bbatonProfileSchema>

export async function fetchBBatonProfile(accessToken: string): Promise<BBatonProfile> {
  const response = await fetch('https://bapi.bbaton.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const json = await response.json().catch(() => null)

  if (!response.ok) {
    console.error('bbaton user profile request failed:', response.status, json)
    throw new Error('BBATON_PROFILE_REQUEST_FAILED')
  }

  const parsed = bbatonProfileSchema.safeParse(json)

  if (!parsed.success) {
    console.error('bbaton profile response invalid:', parsed.error)
    throw new Error('BBATON_PROFILE_RESPONSE_INVALID')
  }

  return parsed.data
}

function parseBirthYear(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}
