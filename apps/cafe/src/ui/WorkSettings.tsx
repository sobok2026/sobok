import type { Preferences } from '../game/preferences'
import { TextButton } from './Button'
import type { SoundStatus } from './work-sounds'

export default function WorkSettings({
  preferences,
  status,
  error,
  guideOpen,
  onChange,
  onPreview,
  onGuide,
}: {
  preferences: Preferences
  status: SoundStatus
  error: boolean
  guideOpen: boolean
  onChange: (preferences: Partial<Preferences>) => void
  onPreview: () => void
  onGuide: () => void
}) {
  return (
    <section className="my-5 border-y border-line py-4 text-sm" aria-label="조작·안내·작업음 설정">
      <h3 className="mb-3 font-semibold">조작·안내·작업음</h3>
      <label className="flex items-center justify-between gap-3" htmlFor="mouse-sensitivity">
        마우스 감도 <span className="text-xs text-muted">{Math.round(preferences.mouseSensitivity * 100)}%</span>
      </label>
      <input
        id="mouse-sensitivity"
        type="range"
        className="my-2 w-full accent-brand"
        min="50"
        max="200"
        step="10"
        value={Math.round(preferences.mouseSensitivity * 100)}
        aria-valuetext={`${Math.round(preferences.mouseSensitivity * 100)}%`}
        onChange={(event) => onChange({ mouseSensitivity: Number(event.target.value) / 100 })}
      />
      <p className="mb-4 text-xs leading-relaxed text-muted">100%가 기본 속도예요. 방향키 회전 속도는 일정해요.</p>
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          className="size-4 accent-brand"
          checked={!preferences.muted}
          onChange={(event) => onChange({ muted: !event.target.checked })}
        />
        작업음 켜기
      </label>
      <label className="mt-4 flex items-center justify-between gap-3" htmlFor="work-volume">
        작업음 음량 <span className="text-xs text-muted">{Math.round(preferences.volume * 100)}%</span>
      </label>
      <input
        id="work-volume"
        type="range"
        className="my-2 w-full accent-brand"
        min="0"
        max="100"
        step="5"
        value={Math.round(preferences.volume * 100)}
        aria-valuetext={`${Math.round(preferences.volume * 100)}%`}
        onChange={(event) => onChange({ volume: Number(event.target.value) / 100 })}
      />
      <TextButton disabled={preferences.muted || preferences.volume === 0} onClick={onPreview}>
        작업음 미리 듣기
      </TextButton>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {preferences.muted
          ? '소리는 꺼져 있어요. 조작 결과는 화면에서도 확인할 수 있어요.'
          : preferences.volume === 0
            ? '음량이 0%예요. 소리를 들으려면 음량을 올려주세요.'
            : status === 'idle'
              ? '근무를 시작하거나 미리 듣기를 눌러 소리를 확인하세요.'
              : status === 'loading'
                ? '작업음을 불러오고 있어요.'
                : status === 'blocked' || status === 'unavailable'
                  ? '작업음을 시작하지 못했어요. 미리 듣기를 다시 눌러주세요.'
                  : '컵·얼음·물·스팀·세척 소리가 실제 작업에 맞춰 들려요.'}
      </p>
      <TextButton className="mt-3" onClick={onGuide}>
        {guideOpen ? '단계별 안내 숨기기' : '단계별 안내 다시 보기'} · H
      </TextButton>
      {error ? (
        <p className="mt-2 text-xs text-danger" role="status">
          설정을 저장하지 못했어요. 이번 실행에는 적용됩니다.
        </p>
      ) : null}
    </section>
  )
}
