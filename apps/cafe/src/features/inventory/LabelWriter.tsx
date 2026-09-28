import clsx from 'clsx'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { INGREDIENTS } from '../../content/ingredients'
import { WorkButton } from '../../shared/ui/WorkControls'
import type { Batch } from '../../simulation/state'
import { batchLifetime } from './batches'
import {
  checkLabel,
  daysIn,
  type LabelValue,
  type LabelVerdict,
  labelFormat,
  labelMoment,
  lifetimeText,
  momentText,
  startedText,
  startingLabel,
} from './labels'

const wrap = (value: number, min: number, max: number) => {
  if (value > max) {
    return min
  }
  return value < min ? max : value
}

/**
 * The player writes the expiry the way a real date label is filled in: the start is copied from the clock and the
 * deadline is theirs to work out. Nothing is attached until it matches the rule exactly.
 */
export default function LabelWriter({
  batch,
  inputsUntil = null,
  onAttach,
}: {
  batch: Batch
  inputsUntil?: number | null
  onAttach: (until: number) => void
}) {
  const [value, setValue] = useState<LabelValue>(() => startingLabel(batch))
  const [verdict, setVerdict] = useState<LabelVerdict | null>(null)
  const writer = useRef<HTMLDivElement>(null)
  const definition = INGREDIENTS[batch.ingredient]
  const format = labelFormat(batch)
  const start = batch.openedAt ?? 0
  const change = (next: Partial<LabelValue>) => {
    setVerdict(null)
    setValue((current) => {
      const merged = { ...current, ...next }
      return { ...merged, day: Math.min(merged.day, daysIn(merged, start)) }
    })
  }
  const attach = () => {
    const moment = labelMoment(value, format, start)
    const result = checkLabel(batch, moment)
    setVerdict(result)
    if (!result) {
      onAttach(moment)
    }
  }
  const attachEvent = useEffectEvent(attach)

  useEffect(() => {
    // F confirms everywhere else, so it attaches the label here before the world controls see it.
    const press = (event: KeyboardEvent) => {
      // ㄹ shares the F key, so typing in another field such as the panel search must stay typing.
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      if (
        event.code !== 'KeyF' ||
        event.repeat ||
        event.isComposing ||
        (typing && !writer.current?.contains(event.target as Node))
      ) {
        return
      }
      event.preventDefault()
      attachEvent()
    }
    window.addEventListener('keydown', press, true)

    return () => window.removeEventListener('keydown', press, true)
  }, [])

  return (
    <div ref={writer} className="grid gap-3">
      <div className="overflow-hidden rounded-xl border border-label-line bg-label">
        <div className="h-2 bg-brand/70" />
        <div className="grid gap-2.5 px-3.5 pt-3 pb-4">
          <p className="text-lg leading-snug font-bold">{definition.name}</p>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 tabular-nums">
            <dt className="text-sm text-muted">{definition.prepared ? '제조' : '개봉'}</dt>
            <dd>{startedText(start)}</dd>
            <dt className="text-sm text-muted">기한</dt>
            <dd className="flex flex-wrap items-center gap-1">
              <Segment
                label="월"
                value={value.month}
                min={1}
                max={12}
                onChange={(month) => change({ month })}
                onSubmit={attach}
              />
              <span className="text-muted">월</span>
              <Segment
                label="일"
                value={value.day}
                min={1}
                max={daysIn(value, start)}
                onChange={(day) => change({ day })}
                onSubmit={attach}
              />
              <span className="text-muted">일</span>
              {format === 'time' && (
                <>
                  <Segment
                    label="시"
                    value={value.hour}
                    min={0}
                    max={24}
                    pad
                    onChange={(hour) => change({ hour })}
                    onSubmit={attach}
                  />
                  <span className="text-muted">:</span>
                  <Segment
                    label="분"
                    value={value.minute}
                    min={0}
                    max={59}
                    pad
                    onChange={(minute) => change({ minute })}
                    onSubmit={attach}
                  />
                </>
              )}
              <span className="text-muted">까지</span>
            </dd>
          </dl>
        </div>
      </div>
      {definition.prepared && inputsUntil !== null && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          넣은 원재료 중 가장 이른 기한
          <span className="rounded-md border border-label-line bg-label px-2 text-ink tabular-nums">
            ~{momentText(inputsUntil)}
          </span>
        </p>
      )}
      {verdict && (
        <p className="rounded-xl bg-danger/8 px-4 py-3 text-body" role="status">
          <strong className="block font-semibold text-danger">{verdict.title}</strong>
          {verdict.detail && <span className="text-ink/80">{verdict.detail}</span>}
        </p>
      )}
      <WorkButton shortcut="F" primary onUse={attach}>
        라벨 붙이기
      </WorkButton>
      <details className="border-t border-line pt-2 text-body">
        <summary className="flex min-h-9 items-center text-sm text-muted">기한표</summary>
        <ul className="mt-1 grid gap-1 text-sm text-muted">
          <li className="text-ink">
            {definition.name} · {definition.prepared ? '제조' : '개봉'} 후 {lifetimeText(batchLifetime(batch))}
          </li>
          {definition.storageLifetimes && (
            <li>
              {Object.entries(definition.storageLifetimes)
                .map(([storage, lifetime]) => `${storage === 'fridge' ? '냉장' : '실온'} ${lifetimeText(lifetime)}`)
                .join(' · ')}
            </li>
          )}
          {definition.closingStorage === 'fridge' && <li>마감 시 남은 배치를 백룸 냉장고에 보관해요.</li>}
          <li>일·개월 기한은 시작한 날을 첫날로 세고 날짜만 적어요.</li>
          <li>시간 기한은 시작 시각부터 세고 분까지 적어요.</li>
          {definition.prepared && <li>배합은 넣은 원재료의 기한을 넘길 수 없어요.</li>}
        </ul>
      </details>
    </div>
  )
}

/** One field of the date: type the digits or step it with the arrow keys, which wrap within the field. */
function Segment({
  label,
  value,
  min,
  max,
  pad = false,
  onChange,
  onSubmit,
}: {
  label: string
  value: number
  min: number
  max: number
  pad?: boolean
  onChange: (value: number) => void
  onSubmit: () => void
}) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <input
      aria-label={label}
      inputMode="numeric"
      autoComplete="off"
      value={draft ?? (pad ? String(value).padStart(2, '0') : String(value))}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={() => setDraft(null)}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, '').slice(-2)
        const next = Number(digits)
        setDraft(digits)
        if (digits && next >= min && next <= max) {
          onChange(next)
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          onSubmit()
          return
        }
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
          return
        }
        event.preventDefault()
        setDraft(null)
        onChange(wrap(value + (event.key === 'ArrowUp' ? 1 : -1), min, max))
      }}
      className={clsx(
        'w-10 rounded-md border border-label-line bg-white/80 py-1',
        'text-center text-base font-semibold text-ink tabular-nums',
      )}
    />
  )
}
