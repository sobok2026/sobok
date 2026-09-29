import { z } from 'zod'
import type { ResolvedOperation } from '../../content/recipe-plan'

export const grindSettingSchema = z.enum(['espresso', 'drip', 'coarse'])
export type GrindSetting = z.infer<typeof grindSettingSchema>
export const GRIND_SETTINGS: Record<GrindSetting, string> = {
  espresso: 'ESPRESSO · 에스프레소',
  drip: 'DRIP · 드립',
  coarse: 'COARSE · 굵게',
}
export const GRINDER_HOPPER_POUNDS = 3

export function bunnGrindSetting(operation: ResolvedOperation): GrindSetting | null {
  if (operation.action !== 'grind' || !['coffee-grinder', 'bunn-g3-grinder'].includes(operation.equipmentId)) {
    return null
  }
  if (operation.setting === '에스프레소') return 'espresso'
  if (operation.setting === 'COARSE') return 'coarse'
  throw new Error('BUNN G3의 분쇄 설정을 연결해야 합니다.')
}
