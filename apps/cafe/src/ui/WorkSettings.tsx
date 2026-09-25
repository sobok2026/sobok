import type { Preferences } from '../game/preferences'
import { TextButton } from './Button'
import type { SoundStatus } from './work-sounds'

export default function WorkSettings({
  preferences,
  status,
  error,
  onChange,
  onPreview,
}: {
  preferences: Preferences
  status: SoundStatus
  error: boolean
  onChange: (preferences: Partial<Preferences>) => void
  onPreview: () => void
}) {
  return (
    <section className="mt-5 text-sm" aria-label="조작·작업음 설정">
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
      <label className="mt-4 flex cursor-pointer items-center gap-3">
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
      {status === 'loading' || status === 'blocked' || status === 'unavailable' ? (
        <p className="mt-2 text-xs text-danger" role="status">
          {status === 'loading' ? '소리 불러오는 중…' : '소리를 재생하지 못했습니다. 미리 듣기로 다시 시도하세요.'}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-danger" role="status">
          설정을 저장하지 못했어요. 이번 실행에는 적용됩니다.
        </p>
      ) : null}
    </section>
  )
}
