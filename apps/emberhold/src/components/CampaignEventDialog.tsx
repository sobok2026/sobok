import './deferred.css'

import Image from 'next/image'
import { useState } from 'react'
import campaignArt from '@/app/campaign-panorama.webp'
import type { EventChoice, EventChoiceForecast, OathId } from './game-model'
import { FINAL_MARCH_IMPRINTS, FINAL_VOWS, LEGACY_UPGRADES, MASTERY_CONTRACTS, MAX_NIGHTS, OATHS } from './game-model'

type CampaignEventView = {
  title: string
  location: string
  body: string
  routeVariant?: 1 | 2
}

type OathInterventionView = {
  oath: OathId
  chronicleLabel: string
  stageDay: number
  name: string
  promise: string
}

type DecisionEchoView = {
  glyph: string
  sourceDay: number
  triggerDay: number
  sourceChoice: string
  name: string
  story: string
  effect: string
}

type FinalMarchPathEntry = {
  night: number
  gateGlyph: string
  gateLabel: string
  crownPreparation: string
  choiceTitle: string | null
  imprint: {
    glyph: string
    name: string
    effect: string
  } | null
  state: string
}

type EventChoiceEntry = {
  choice: EventChoice
  forecast: EventChoiceForecast
  unavailable: boolean
  autofocus: boolean
}

type CampaignEventDialogProps = {
  blocked: boolean
  veteranBriefing: boolean
  actNumber: number
  day: number
  event: CampaignEventView
  oathIntervention: OathInterventionView | null
  decisionEcho: DecisionEchoView | null
  crownTiming: string
  crownHeatFloor: number
  stokeBaseCost: number
  finalMarchPath: readonly FinalMarchPathEntry[] | null
  choiceEntries: readonly EventChoiceEntry[]
  onChooseChoice: (choice: EventChoice) => void
  onOpenMap: () => void
}

const EVENT_CHOICE_INDEX_BY_KEY: Readonly<Record<string, number>> = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Numpad1: 0,
  Numpad2: 1,
  Numpad3: 2,
  Numpad4: 3,
}

function OathIntervention({ intervention }: { intervention: OathInterventionView }) {
  const oath = OATHS[intervention.oath]

  return (
    <aside className="event-oath-intervention" data-oath={intervention.oath} aria-label={`${oath.name} 왕관 개입`}>
      <span aria-hidden="true">{oath.glyph}</span>
      <div>
        <small>
          {intervention.chronicleLabel} · CROWN {String(intervention.stageDay / 4).padStart(2, '0')} / 03
        </small>
        <strong>{intervention.name}</strong>
        <p>{intervention.promise}</p>
      </div>
      <b>서약 전용 결단 개방</b>
    </aside>
  )
}

function DecisionEcho({ echo }: { echo: DecisionEchoView }) {
  return (
    <aside className="event-decision-echo" aria-label="돌아온 이전 결정">
      <span aria-hidden="true">{echo.glyph}</span>
      <div>
        <small>
          PAST DECISION · DAY {String(echo.sourceDay).padStart(2, '0')} → NIGHT{' '}
          {String(echo.triggerDay).padStart(2, '0')} · {echo.sourceChoice}
        </small>
        <strong>{echo.name}</strong>
        <p>{echo.story}</p>
      </div>
      <b>{echo.effect}</b>
    </aside>
  )
}

function SeededRoute({ variant }: { variant: 1 | 2 }) {
  return (
    <aside className="event-seeded-route" data-variant={variant} aria-label={`원정 코드 고정 갈림길 ${variant}번`}>
      <span aria-hidden="true">⌁</span>
      <div>
        <small>CODE-BOUND WAYPOINT · ROUTE 0{variant} / 02</small>
        <strong>원정 코드가 고른 갈림길</strong>
      </div>
      <p>같은 코드는 이 사건과 선택지, 4일 뒤 돌아올 후속 결과까지 그대로 재현합니다.</p>
    </aside>
  )
}

function EventStoryRecord({ event, veteranBriefing }: { event: CampaignEventView; veteranBriefing: boolean }) {
  const story = (
    <>
      <p className="event-narrative">{event.body}</p>
      {event.routeVariant ? <SeededRoute variant={event.routeVariant} /> : null}
    </>
  )

  if (!veteranBriefing) return story

  return (
    <details className="veteran-event-story">
      <summary>
        <span aria-hidden="true">⌁</span>
        <span className="veteran-event-story-copy">
          <small>VETERAN STORY FILE · 서사 열람</small>
          <strong>{event.location}의 사건 서사</strong>
        </span>
        <b>{event.routeVariant ? `CODE ROUTE 0${event.routeVariant}` : '사건 기록'}</b>
        <i aria-hidden="true">⌄</i>
      </summary>
      <div>{story}</div>
    </details>
  )
}

function ChoiceRouteLedger({
  crownTiming,
  crownHeatFloor,
  stokeBaseCost,
}: Pick<CampaignEventDialogProps, 'crownTiming' | 'crownHeatFloor' | 'stokeBaseCost'>) {
  return (
    <aside className="event-choice-ledger" aria-label="선택 경로 계산 기준">
      <span>ROUTE LEDGER · 선택 직후 수치</span>
      <b>
        {crownTiming} · 온기 경보선 {crownHeatFloor}%
      </b>
      <small>경보선 아래에서는 화로 1회 최대 비용 ◈ {stokeBaseCost}와 3인 전선의 신호탄 비용을 예비로 봅니다.</small>
    </aside>
  )
}

function FinalMarchLedger({ day, path }: { day: number; path: readonly FinalMarchPathEntry[] }) {
  const sealedCount = path.filter((entry) => entry.state === 'sealed').length

  return (
    <aside className="event-final-march-ledger" aria-label="마지막 행군 각인 경로">
      <header>
        <div>
          <small>ACT III · LAST MARCH IMPRINTS</small>
          <strong>
            {day === MAX_NIGHTS
              ? '세 관문의 선택이 최종 왕관전으로 집결합니다'
              : '오늘의 선택이 남은 모든 전투의 조건부 전력으로 남습니다'}
          </strong>
        </div>
        <b>{sealedCount} / 3 SEALED</b>
      </header>
      <ol>
        {path.map((entry) => (
          <li data-state={entry.state} aria-current={entry.state === 'current' ? 'step' : undefined} key={entry.night}>
            <span aria-hidden="true">{entry.imprint?.glyph ?? entry.gateGlyph}</span>
            <div>
              <small>{entry.gateLabel}</small>
              <strong>
                {entry.imprint?.name ??
                  (entry.state === 'current' ? '오늘 선택으로 각인' : `NIGHT ${entry.night}에 개방`)}
              </strong>
              <p>
                {entry.imprint
                  ? `${entry.choiceTitle} · ${entry.imprint.effect}`
                  : entry.state === 'current'
                    ? '아래 세 경로는 서로 다른 최종 왕관 해법을 강화합니다.'
                    : entry.crownPreparation}
              </p>
            </div>
            <b>{entry.state === 'sealed' ? '✓' : entry.state === 'current' ? 'CHOOSE' : `0${entry.night - 8}`}</b>
          </li>
        ))}
      </ol>
      <p>
        각인은 자원 보상과 별도로 누적되며, 발동 조건을 충족한 전선에 합산 적용됩니다. 총 보너스는 전선당 22%를 넘지
        않습니다.
      </p>
    </aside>
  )
}

function ChoiceForecast({
  choice,
  forecast,
  descriptionId,
}: Pick<EventChoiceEntry, 'choice' | 'forecast'> & { descriptionId: string }) {
  const eventScore = choice.score ?? 0
  const expeditionScore = forecast.scoreGain - forecast.legacyScoreBonus - forecast.contractScoreBonus
  const expeditionScoreDelta = expeditionScore - eventScore

  return (
    <dl
      className="event-choice-forecast"
      data-state={forecast.state}
      aria-label={`${choice.title} 선택 직후 경로 예측`}
    >
      <div
        className="event-supply-forecast"
        data-recovery-spent={forecast.recoverySuppliesSpent > 0 ? 'true' : 'false'}
      >
        <dt>보급</dt>
        <dd>
          <strong>◈ {forecast.projectedSupplies}</strong>
          {forecast.recoverySuppliesSpent > 0 ? (
            <small>
              복구분 −{forecast.recoverySuppliesSpent} · 보호 {forecast.projectedRecoverySupplies}
            </small>
          ) : forecast.projectedRecoverySupplies > 0 ? (
            <small>복구분 {forecast.projectedRecoverySupplies} 유지</small>
          ) : null}
        </dd>
      </div>
      <div>
        <dt>온기</dt>
        <dd>{forecast.projectedHeat}%</dd>
      </div>
      <div>
        <dt>사기</dt>
        <dd>{forecast.projectedMorale}</dd>
      </div>
      <div
        className="event-renown-forecast"
        data-expedition-rule={expeditionScoreDelta !== 0 ? 'true' : 'false'}
        data-legacy={forecast.legacyScoreBonus > 0 ? 'true' : 'false'}
        data-contract={forecast.contractScoreBonus > 0 ? 'true' : 'false'}
      >
        <dt>명성</dt>
        <dd>
          <strong>{forecast.scoreGain > 0 ? `+${forecast.scoreGain.toLocaleString('ko-KR')}` : '—'}</strong>
          {expeditionScoreDelta !== 0 ? (
            <small className="event-expedition-attribution">
              <span aria-hidden="true">◇</span>
              위험도·서약 {expeditionScoreDelta > 0 ? '+' : '−'}
              {Math.abs(expeditionScoreDelta).toLocaleString('ko-KR')} · 사건 +{eventScore.toLocaleString('ko-KR')}
            </small>
          ) : null}
          {forecast.legacyScoreBonus > 0 ? (
            <small>
              <span aria-hidden="true">{LEGACY_UPGRADES['chroniclers-ink'].glyph}</span>
              {LEGACY_UPGRADES['chroniclers-ink'].name} +{forecast.legacyScoreBonus.toLocaleString('ko-KR')} ·{' '}
              {expeditionScoreDelta !== 0 ? '원정 규칙 후' : '기본'} +{expeditionScore.toLocaleString('ko-KR')}
            </small>
          ) : null}
          {forecast.contractScoreBonus > 0 && forecast.masteryContract ? (
            <small className="event-contract-attribution">
              <span aria-hidden="true">{MASTERY_CONTRACTS[forecast.masteryContract].glyph}</span>
              {MASTERY_CONTRACTS[forecast.masteryContract].name} +{forecast.contractScoreBonus.toLocaleString('ko-KR')}{' '}
              · 계승 후 +{(forecast.scoreGain - forecast.contractScoreBonus).toLocaleString('ko-KR')}
            </small>
          ) : null}
        </dd>
      </div>
      <div className="event-route-verdict">
        <dt>
          <span>{forecast.route}</span>
          <b>{forecast.label}</b>
        </dt>
        <dd id={descriptionId}>{forecast.detail}</dd>
      </div>
    </dl>
  )
}

function ChoiceConsequences({ choice }: { choice: EventChoice }) {
  return (
    <>
      {choice.echo ? (
        <small className="event-choice-echo">
          <span aria-hidden="true">{choice.echo.glyph}</span>
          <b>후속 결과 · NIGHT {String(choice.echo.triggerDay).padStart(2, '0')}</b>
          {choice.echo.effect}
        </small>
      ) : null}
      {choice.marchImprint ? (
        <span className="event-choice-imprint">
          <b aria-hidden="true">{FINAL_MARCH_IMPRINTS[choice.marchImprint].glyph}</b>
          <span>
            <small>{FINAL_MARCH_IMPRINTS[choice.marchImprint].label} · PERMANENT THIS RUN</small>
            <strong>{FINAL_MARCH_IMPRINTS[choice.marchImprint].name}</strong>
            <em>{FINAL_MARCH_IMPRINTS[choice.marchImprint].effect}</em>
            <i>{FINAL_MARCH_IMPRINTS[choice.marchImprint].crownLink} · 이번 밤부터 최종전까지 유지</i>
          </span>
        </span>
      ) : null}
      {choice.finalVow ? (
        <small className="event-choice-vow" data-vow={choice.finalVow}>
          <span aria-hidden="true">{FINAL_VOWS[choice.finalVow].glyph}</span>
          <b>{FINAL_VOWS[choice.finalVow].label}</b>
          {FINAL_VOWS[choice.finalVow].effect} · 최종전에서 즉시 발동
        </small>
      ) : null}
    </>
  )
}

function eventChoiceOutcome(choice: EventChoice, forecast: EventChoiceForecast) {
  const convertsToMorale = forecast.conversionMorale > 0
  const eventScore = choice.score ?? 0
  const scoreAdjusted = forecast.scoreGain !== eventScore
  const choiceOutcome = convertsToMorale
    ? `${choice.outcome} · 사기 +${forecast.conversionMorale}로 전환`
    : choice.outcome

  return forecast.scoreGain > 0 && (!choice.outcome.includes('명성') || scoreAdjusted)
    ? `${choiceOutcome} · ${scoreAdjusted ? '원정 보정 후 실제 ' : ''}명성 +${forecast.scoreGain.toLocaleString('ko-KR')}`
    : choiceOutcome
}

function eventCommitment(choice: EventChoice) {
  if (choice.finalVow) {
    const vow = FINAL_VOWS[choice.finalVow]
    return { glyph: vow.glyph, title: vow.name, detail: vow.effect }
  }
  if (choice.marchImprint) {
    const imprint = FINAL_MARCH_IMPRINTS[choice.marchImprint]
    return { glyph: imprint.glyph, title: imprint.name, detail: imprint.effect }
  }
  if (choice.echo) {
    return {
      glyph: choice.echo.glyph,
      title: choice.echo.name,
      detail: choice.echo.effect,
    }
  }
  if (choice.oathOnly) {
    const oath = OATHS[choice.oathOnly]
    return { glyph: oath.glyph, title: oath.name, detail: choice.outcome }
  }
  return { glyph: '✦', title: '이번 원정의 새 경로', detail: choice.outcome }
}

function EventChoiceCommitDock({
  entry,
  onCancel,
  onConfirm,
}: {
  entry: EventChoiceEntry
  onCancel: () => void
  onConfirm: () => void
}) {
  const { choice, forecast } = entry
  const commitment = eventCommitment(choice)
  const titleId = `event-commit-${choice.id}-title`

  return (
    <aside className="event-commit-dock" data-state={forecast.state} aria-live="polite" aria-labelledby={titleId}>
      <span className="event-commit-glyph" aria-hidden="true">
        {commitment.glyph}
      </span>
      <div className="event-commit-copy">
        <small>DECISION PREVIEW · 확정 전</small>
        <strong id={titleId}>{choice.title}</strong>
        <p>{eventChoiceOutcome(choice, forecast)}</p>
      </div>
      <dl className="event-commit-resources" aria-label="선택 확정 후 자원">
        <div>
          <dt>보급</dt>
          <dd>◈ {forecast.projectedSupplies}</dd>
        </div>
        <div>
          <dt>온기</dt>
          <dd>{forecast.projectedHeat}%</dd>
        </div>
        <div>
          <dt>사기</dt>
          <dd>{forecast.projectedMorale}</dd>
        </div>
        <div>
          <dt>명성</dt>
          <dd>{forecast.scoreGain > 0 ? `+${forecast.scoreGain.toLocaleString('ko-KR')}` : '—'}</dd>
        </div>
      </dl>
      <div className="event-commit-verdict" data-state={forecast.state}>
        <span>
          {forecast.route} · {forecast.label}
        </span>
        <strong>{commitment.title}</strong>
        <p>{commitment.detail}</p>
        {forecast.recoverySuppliesSpent > 0 ? (
          <small>
            복구 보급 −{forecast.recoverySuppliesSpent} · 보호 {forecast.projectedRecoverySupplies}
          </small>
        ) : null}
      </div>
      <footer>
        <button type="button" onClick={onCancel}>
          다른 길 비교
        </button>
        <button type="button" onClick={onConfirm}>
          <span>{choice.title} 확정</span>
          <i aria-hidden="true">›</i>
        </button>
      </footer>
    </aside>
  )
}

function EventChoices({
  entries,
  selectedChoiceId,
  onPreviewChoice,
}: {
  entries: readonly EventChoiceEntry[]
  selectedChoiceId: string | null
  onPreviewChoice: (choice: EventChoice) => void
}) {
  return (
    <div className="event-choices">
      {entries.map(({ choice, forecast, unavailable, autofocus }, index) => {
        const selected = selectedChoiceId === choice.id
        const outcomeId = `event-choice-${choice.id}-outcome`
        const forecastId = `event-choice-${choice.id}-forecast`
        return (
          <button
            type="button"
            disabled={unavailable}
            data-emergency={choice.emergencyOnly ? 'true' : undefined}
            data-oath={choice.oathOnly}
            data-route-state={forecast.state}
            data-selected={selected ? 'true' : 'false'}
            data-autofocus={autofocus ? 'true' : undefined}
            data-event-choice-id={choice.id}
            aria-pressed={selected}
            aria-keyshortcuts={index < 4 ? String(index + 1) : undefined}
            aria-describedby={`${outcomeId} ${forecastId}`}
            onClick={() => onPreviewChoice(choice)}
            key={choice.id}
          >
            <span>0{index + 1}</span>
            <div>
              <strong>{choice.title}</strong>
              {choice.oathOnly ? (
                <small className="event-oath-label">
                  {OATHS[choice.oathOnly].glyph} OATH INTERVENTION · {OATHS[choice.oathOnly].name}
                </small>
              ) : null}
              {choice.emergencyOnly ? (
                <small className="event-emergency-label">EMERGENCY ROUTE · 보급 고갈 시 개방</small>
              ) : null}
              <p>{choice.description}</p>
              <b id={outcomeId}>
                {unavailable ? `보급품 ${choice.requiresSupplies} 필요` : eventChoiceOutcome(choice, forecast)}
              </b>
              <ChoiceForecast choice={choice} forecast={forecast} descriptionId={forecastId} />
              <ChoiceConsequences choice={choice} />
            </div>
            <i aria-hidden="true">{selected ? '✓' : '›'}</i>
          </button>
        )
      })}
    </div>
  )
}

export function CampaignEventDialog({
  blocked,
  veteranBriefing,
  actNumber,
  day,
  event,
  oathIntervention,
  decisionEcho,
  crownTiming,
  crownHeatFloor,
  stokeBaseCost,
  finalMarchPath,
  choiceEntries,
  onChooseChoice,
  onOpenMap,
}: CampaignEventDialogProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const selectedEntry = selectedChoiceId
    ? (choiceEntries.find((entry) => entry.choice.id === selectedChoiceId && !entry.unavailable) ?? null)
    : null

  function previewChoice(choice: EventChoice, moveFocus = false) {
    if (selectedChoiceId === choice.id) return
    setSelectedChoiceId(choice.id)
    if (!moveFocus) return
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-event-choice-id="${choice.id}"]`)?.focus({ preventScroll: true })
    })
  }

  function clearChoicePreview() {
    const previousChoiceId = selectedChoiceId
    setSelectedChoiceId(null)
    window.requestAnimationFrame(() => {
      if (!previousChoiceId) return
      document
        .querySelector<HTMLButtonElement>(`[data-event-choice-id="${previousChoiceId}"]`)
        ?.focus({ preventScroll: true })
    })
  }

  return (
    <div
      className="modal-backdrop event-backdrop"
      data-selection={selectedEntry ? 'true' : 'false'}
      role="presentation"
      inert={blocked ? true : undefined}
    >
      <section
        className="event-card"
        data-veteran={veteranBriefing ? 'true' : 'false'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        aria-describedby="event-choice-instruction"
        data-focus-scope="event"
        tabIndex={-1}
        onKeyDown={(event) => {
          const choiceIndex = EVENT_CHOICE_INDEX_BY_KEY[event.code]
          const shortcutEntry = choiceIndex === undefined ? undefined : choiceEntries[choiceIndex]
          if (
            shortcutEntry &&
            !shortcutEntry.unavailable &&
            !event.repeat &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.shiftKey
          ) {
            event.preventDefault()
            event.stopPropagation()
            previewChoice(shortcutEntry.choice, true)
            return
          }
          if (event.key !== 'Escape' || !selectedEntry) return
          event.preventDefault()
          event.stopPropagation()
          clearChoicePreview()
        }}
      >
        <div className="event-art" aria-hidden="true">
          <Image
            src={campaignArt}
            alt=""
            fill
            sizes="(max-width: 720px) 100vw, 900px"
            placeholder="blur"
            priority
            style={{ objectPosition: `${actNumber === 1 ? 10 : actNumber === 2 ? 50 : 90}% center` }}
          />
          <span />
        </div>
        <div className="event-body">
          <header>
            <div>
              <p className="eyebrow">
                ACT {actNumber} · DAY {String(day).padStart(2, '0')} · WAYPOINT
              </p>
              <h2 id="event-title">{event.title}</h2>
              <span>{event.location}</span>
            </div>
            <b>
              {day} / {MAX_NIGHTS}
            </b>
          </header>
          <EventStoryRecord event={event} veteranBriefing={veteranBriefing} />
          {oathIntervention ? <OathIntervention intervention={oathIntervention} /> : null}
          {decisionEcho ? <DecisionEcho echo={decisionEcho} /> : null}
          <p className="event-choice-instruction" id="event-choice-instruction">
            경로 카드를 눌러 선택 후 수치를 고정하고, 아래에서 확정하기 전까지 다른 길과 비교할 수 있습니다.
          </p>
          <ChoiceRouteLedger crownTiming={crownTiming} crownHeatFloor={crownHeatFloor} stokeBaseCost={stokeBaseCost} />
          {finalMarchPath ? <FinalMarchLedger day={day} path={finalMarchPath} /> : null}
          <EventChoices entries={choiceEntries} selectedChoiceId={selectedChoiceId} onPreviewChoice={previewChoice} />
          <footer>
            <span>아래에서 확정한 결정만 이후 전투와 이번 원정의 결말에 남습니다.</span>
            <button type="button" onClick={onOpenMap}>
              원정 지도 보기
            </button>
          </footer>

          {selectedEntry ? (
            <EventChoiceCommitDock
              entry={selectedEntry}
              onCancel={clearChoicePreview}
              onConfirm={() => onChooseChoice(selectedEntry.choice)}
            />
          ) : null}
        </div>
      </section>
    </div>
  )
}
