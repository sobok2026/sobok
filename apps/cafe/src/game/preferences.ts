import { z } from 'zod'

export const preferencesSchema = z.object({
  muted: z.boolean(),
  volume: z.number().finite().min(0).max(1),
  guidance: z.boolean(),
  mouseSensitivity: z.number().finite().min(0.5).max(2),
})
export type Preferences = z.infer<typeof preferencesSchema>
export const defaultPreferences = (): Preferences => ({
  muted: true,
  volume: 0.35,
  guidance: true,
  mouseSensitivity: 1,
})
