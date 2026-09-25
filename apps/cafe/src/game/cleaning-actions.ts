import type { Action } from './actions'
import { isCupSurface, STATIONS } from './catalog'
import { CLEANING_SECONDS, cleaningHandsBusy, cupSurface } from './cleaning'
import { cupCount, emptyCupCounts, reusableCupKinds } from './cups'
import { say } from './feedback'
import { uid } from './state'
import type { WorkContext } from './work-context'

export function handleCleaningActions(
  work: WorkContext,
  action: Extract<
    Action,
    {
      type:
        | 'start-cleaning'
        | 'collect-cup'
        | 'drop-used-cups'
        | 'clean-tool'
        | 'clean-use'
        | 'clean-confirm'
        | 'leave-cleaning'
    }
  >,
) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')
  switch (action.type) {
    case 'start-cleaning': {
      if (s.cleaning) {
        fail(`${STATIONS[s.cleaning.station].name}의 청소를 먼저 마치거나 작업 안내에서 취소해주세요.`)
        break
      }
      const station = action.station
      if (station === 'mix' && s.cup?.craft.location === 'mix') {
        fail('컵을 다른 작업대에 놓은 뒤 닦아주세요.')
        break
      }
      if (
        isCupSurface(station)
          ? !cupSurface(s, station).dirty && !cupCount(cupSurface(s, station).cups)
          : station === 'mix'
            ? !s.dirtyBar
            : !s.trash
      ) {
        fail('이미 깨끗하게 정리됐어요.')
        break
      }
      s.cleaning = {
        id: uid(),
        station,
        stage:
          station === 'trash'
            ? 'bag'
            : isCupSurface(station) && cupCount(cupSurface(s, station).cups)
              ? 'collect'
              : 'wipe',
        progress: 0,
        clothHeld: false,
        heldCups: emptyCupCounts(),
        trashCount: station === 'trash' ? s.trash : 0,
      }
      say(s, station === 'trash' ? '누르고 쓰레기를 모아 봉투를 묶으세요.' : '컵을 비운 뒤 천을 집어 직접 닦아주세요.')
      break
    }
    case 'collect-cup': {
      const cleaning = s.cleaning
      if (!cleaning || !isCupSurface(cleaning.station) || cleaning.stage !== 'collect') break
      const table = cupSurface(s, cleaning.station)
      const kind = reusableCupKinds.find((kind) => table.cups[kind] > 0)
      if (!kind) break
      table.cups[kind]--
      cleaning.heldCups[kind]++
      say(s, `사용한 컵 ${cupCount(cleaning.heldCups)}개를 들고 있어요. 세척대로 가져가세요.`)
      break
    }
    case 'drop-used-cups': {
      const cleaning = s.cleaning
      if (!cleaning || !cupCount(cleaning.heldCups) || !isCupSurface(cleaning.station)) break
      for (const kind of reusableCupKinds) s.reusableCups[kind].dirty += cleaning.heldCups[kind]
      cleaning.heldCups = emptyCupCounts()
      const surface = cupSurface(s, cleaning.station)
      if (!cupCount(surface.cups) && !surface.dirty) {
        s.cleaning = null
        s.totals.cleaned++
        say(s, `${STATIONS[cleaning.station].name}의 컵을 모두 정리했어요.`, 'success')
        break
      }
      if (!cupCount(surface.cups)) cleaning.stage = 'wipe'
      say(
        s,
        `${STATIONS[cleaning.station].name}로 돌아가 ${cleaning.stage === 'wipe' ? '닦아주세요.' : '남은 컵을 회수해주세요.'}`,
        'success',
      )
      break
    }
    case 'clean-tool':
      if (s.cleaning?.stage !== 'wipe' || cupCount(s.cleaning.heldCups)) break
      s.cleaning.clothHeld = !s.cleaning.clothHeld
      say(s, s.cleaning.clothHeld ? '청소용 천을 집었어요.' : '청소용 천을 내려놓았어요.')
      break
    case 'clean-use': {
      const cleaning = s.cleaning
      if (!cleaning || cleaning.stage === 'collect') break
      if (cleaning.stage === 'wipe' && !cleaning.clothHeld) {
        fail('G로 청소용 천을 먼저 집어주세요.')
        break
      }
      work.input = { kind: 'clean', cleaningId: cleaning.id, station: cleaning.station }
      break
    }
    case 'clean-confirm': {
      const cleaning = s.cleaning
      if (!cleaning || cleaning.stage === 'collect') break
      if (cleaning.clothHeld) {
        fail('G로 청소용 천을 내려놓은 뒤 확인해주세요.')
        break
      }
      if (cleaning.progress < CLEANING_SECONDS[cleaning.stage]) {
        fail('아직 정리가 끝나지 않았어요. 누르고 작업을 이어가세요.')
        break
      }
      if (isCupSurface(cleaning.station)) {
        const surface = cupSurface(s, cleaning.station)
        surface.dirty = false
        if (cupCount(surface.cups) > 0) {
          cleaning.stage = 'collect'
          cleaning.progress = 0
          say(s, '닦기는 끝났어요. 새로 남은 컵도 회수해주세요.', 'success')
          break
        }
      } else if (cleaning.station === 'mix') s.dirtyBar = 0
      else s.trash = Math.max(0, s.trash - cleaning.trashCount)
      s.totals.cleaned++
      s.cleaning = null
      say(s, cleaning.station === 'trash' ? '봉투를 비우고 분리수거함을 정리했어요.' : '깨끗하게 닦았어요.', 'success')
      break
    }
    case 'leave-cleaning':
      if (cleaningHandsBusy(s.cleaning)) {
        fail('회수한 컵을 비우고 청소용 천을 내려놓은 뒤 취소해주세요.')
        break
      }
      s.cleaning = null
      say(s, '청소를 취소했어요. 다시 시작하면 처음부터 닦아요.')
      break
  }
}
