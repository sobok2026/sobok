import './deferred.css'

import Image from 'next/image'
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

function EventChoices({
  entries,
  onChooseChoice,
}: {
  entries: readonly EventChoiceEntry[]
  onChooseChoice: (choice: EventChoice) => void
}) {
  return (
    <div className="event-choices">
      {entries.map(({ choice, forecast, unavailable, autofocus }, index) => {
        const convertsToMorale = forecast.conversionMorale > 0
        const eventScore = choice.score ?? 0
        const scoreAdjusted = forecast.scoreGain !== eventScore
        const choiceOutcome = convertsToMorale
          ? `${choice.outcome} · 사기 +${forecast.conversionMorale}로 전환`
          : choice.outcome
        const scoreOutcome =
          forecast.scoreGain > 0 && (!choice.outcome.includes('명성') || scoreAdjusted)
            ? `${choiceOutcome} · ${scoreAdjusted ? '원정 보정 후 실제 ' : ''}명성 +${forecast.scoreGain.toLocaleString('ko-KR')}`
            : choiceOutcome
        const outcomeId = `event-choice-${choice.id}-outcome`
        const forecastId = `event-choice-${choice.id}-forecast`
        return (
          <button
            type="button"
            disabled={unavailable}
            data-emergency={choice.emergencyOnly ? 'true' : undefined}
            data-oath={choice.oathOnly}
            data-route-state={forecast.state}
            data-autofocus={autofocus ? 'true' : undefined}
            aria-describedby={`${outcomeId} ${forecastId}`}
            onClick={() => onChooseChoice(choice)}
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
              <b id={outcomeId}>{unavailable ? `보급품 ${choice.requiresSupplies} 필요` : scoreOutcome}</b>
              <ChoiceForecast choice={choice} forecast={forecast} descriptionId={forecastId} />
              <ChoiceConsequences choice={choice} />
            </div>
            <i aria-hidden="true">›</i>
          </button>
        )
      })}
    </div>
  )
}

export function CampaignEventDialog({
  blocked,
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
  return (
    <div className="modal-backdrop event-backdrop" role="presentation" inert={blocked ? true : undefined}>
      <section
        className="event-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        data-focus-scope="event"
        tabIndex={-1}
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
          <p className="event-narrative">{event.body}</p>
          {event.routeVariant ? <SeededRoute variant={event.routeVariant} /> : null}
          {oathIntervention ? <OathIntervention intervention={oathIntervention} /> : null}
          {decisionEcho ? <DecisionEcho echo={decisionEcho} /> : null}
          <ChoiceRouteLedger crownTiming={crownTiming} crownHeatFloor={crownHeatFloor} stokeBaseCost={stokeBaseCost} />
          {finalMarchPath ? <FinalMarchLedger day={day} path={finalMarchPath} /> : null}
          <EventChoices entries={choiceEntries} onChooseChoice={onChooseChoice} />
          <footer>
            <span>결정은 이후 전투와 이번 원정의 결말에 남습니다.</span>
            <button type="button" onClick={onOpenMap}>
              원정 지도 보기
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}
