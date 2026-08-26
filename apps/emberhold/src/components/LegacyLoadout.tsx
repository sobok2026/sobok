import type { LegacyId, RunMode } from './game-model'
import { inheritedPowerEnabledFor, LEGACY_UPGRADES } from './game-model'
import { preloadArchiveDialog } from './game-preloads'

const ACTIVE_LEGACY_COPY: Record<LegacyId, { stage: string; effect: string }> = {
  'banked-ember': {
    stage: 'DEPARTURE · HEARTH',
    effect: '출정 온기 +10 · 상한 100까지 시작 순간 반영',
  },
  'supply-cache': {
    stage: 'DEPARTURE · SUPPLY',
    effect: '출정 보급 +20 · 첫 선택 전부터 사용 가능',
  },
  'veteran-oath': {
    stage: 'ROSTER · VETERAN',
    effect: '첫 수호대 II 등급 · 대열과 전투력에 반영',
  },
  'command-seal': {
    stage: 'BATTLE · COMMAND',
    effect: '명령 점수 +1 · 모든 교전의 지휘 한도에 반영',
  },
  'chroniclers-ink': {
    stage: 'CAMPAIGN · RENOWN',
    effect: '모든 명성 획득 ×1.08 · 최종 결산까지 누적',
  },
  'salvagers-instinct': {
    stage: 'RETURN · SALVAGE',
    effect: '승리 보급 +8 · 매번 귀환 보상에 합산',
  },
}

function LegacyEffectList({ legacyIds }: { legacyIds: readonly LegacyId[] }) {
  return (
    <ul className="legacy-effect-list">
      {legacyIds.map((legacyId) => {
        const upgrade = LEGACY_UPGRADES[legacyId]
        const activeCopy = ACTIVE_LEGACY_COPY[legacyId]
        return (
          <li key={legacyId}>
            <span aria-hidden="true">{upgrade.glyph}</span>
            <div>
              <small>{activeCopy.stage}</small>
              <strong>{upgrade.name}</strong>
              <p>{activeCopy.effect}</p>
            </div>
            <b>ACTIVE</b>
          </li>
        )
      })}
    </ul>
  )
}

export function LegacySetupLoadout({
  legacyIds,
  mode,
  onOpenArchive,
}: {
  legacyIds: readonly LegacyId[]
  mode: RunMode
  onOpenArchive: () => void
}) {
  if (!inheritedPowerEnabledFor(mode)) {
    return (
      <section className="setup-legacy-loadout" data-comparison="true" aria-labelledby="setup-legacy-loadout-title">
        <header>
          <span aria-hidden="true">◇</span>
          <div>
            <small>CODE COMPARISON · META-FREE LOADOUT</small>
            <strong id="setup-legacy-loadout-title">계승 전력 0개로 공정 비교</strong>
          </div>
          <b>고정 규칙</b>
        </header>
        <footer>
          <p>
            {legacyIds.length > 0
              ? `보유한 계승 유산 ${legacyIds.length}개는 기록에 그대로 남고, 오늘의·공유 균열 전력에는 섞이지 않습니다.`
              : '첫 플레이어와 장기 플레이어가 같은 원정 코드에서 동일한 기본 전력으로 시작합니다.'}
          </p>
          {legacyIds.length > 0 ? (
            <button
              type="button"
              onPointerEnter={preloadArchiveDialog}
              onFocus={preloadArchiveDialog}
              onClick={onOpenArchive}
            >
              보유 유산 확인 <i aria-hidden="true">›</i>
            </button>
          ) : null}
        </footer>
      </section>
    )
  }

  if (legacyIds.length === 0) return null

  return (
    <section className="setup-legacy-loadout" aria-labelledby="setup-legacy-loadout-title">
      <header>
        <span aria-hidden="true">✦</span>
        <div>
          <small>NEXT EXPEDITION · INHERITED LOADOUT</small>
          <strong id="setup-legacy-loadout-title">계승 유산 {legacyIds.length}개 적재 준비</strong>
        </div>
        <b>출정 즉시 적용</b>
      </header>
      <LegacyEffectList legacyIds={legacyIds} />
      <footer>
        <p>선택한 위험도·서약과 함께 이번 원정의 시작 순간 고정됩니다.</p>
        <button
          type="button"
          onPointerEnter={preloadArchiveDialog}
          onFocus={preloadArchiveDialog}
          onClick={onOpenArchive}
        >
          유산 기록 확인 <i aria-hidden="true">›</i>
        </button>
      </footer>
    </section>
  )
}

export function LegacyDepartureBriefing({ legacyIds }: { legacyIds: readonly LegacyId[] }) {
  if (legacyIds.length === 0) return null

  return (
    <section className="departure-legacy-loadout" aria-labelledby="departure-legacy-loadout-title">
      <header>
        <span aria-hidden="true">
          <i />
          <b>✦</b>
        </span>
        <div>
          <small>DAY 01 · LEGACY TRANSFER VERIFIED</small>
          <strong id="departure-legacy-loadout-title">이전 원정의 불씨가 첫날 전력으로 이어졌습니다</strong>
          <p>계승한 효과를 출정 자원·대열·지휘·귀환 규칙에 모두 반영했습니다.</p>
        </div>
        <b>{legacyIds.length}개 전부 적용</b>
      </header>
      <LegacyEffectList legacyIds={legacyIds} />
      <footer>
        <span>
          <b>CURRENT RUN SNAPSHOT</b> 이 목록은 이번 원정이 끝날 때까지 유지됩니다.
        </span>
        <strong>지금 새로 계승한 유산은 다음 원정부터 적용</strong>
      </footer>
    </section>
  )
}

export function ActiveLegacyRack({
  legacyIds,
  inactiveCount,
  mode,
}: {
  legacyIds: readonly LegacyId[]
  inactiveCount: number
  mode: RunMode
}) {
  if (!inheritedPowerEnabledFor(mode)) {
    return (
      <section className="active-legacy-rack" data-comparison="true" aria-label="동일 코드 비교용 계승 전력 봉인">
        <header>
          <span>CODE COMPARISON LOADOUT</span>
          <b>계승 전력 0</b>
        </header>
        <p>오늘의·공유 균열은 영구 유산과 영원 계약 없이 현재 코드의 선택과 전술만 기록합니다.</p>
        {inactiveCount > 0 ? (
          <footer>
            <span aria-hidden="true">◇</span>
            <p>
              보유 유산 <strong>{inactiveCount}개</strong>는 봉인되어 있으며 새 균열 표준 원정에서 다시 적용됩니다.
            </p>
          </footer>
        ) : null}
      </section>
    )
  }

  if (legacyIds.length === 0 && inactiveCount === 0) return null

  return (
    <section className="active-legacy-rack" aria-label="현재 원정 계승 유산">
      <header>
        <span>ACTIVE EXPEDITION LEGACY</span>
        <b>{legacyIds.length}개 고정</b>
      </header>
      {legacyIds.length > 0 ? (
        <ul className="active-legacy-chips">
          {legacyIds.map((legacyId) => {
            const upgrade = LEGACY_UPGRADES[legacyId]
            return (
              <li title={ACTIVE_LEGACY_COPY[legacyId].effect} key={legacyId}>
                <b aria-hidden="true">{upgrade.glyph}</b>
                <span>
                  <strong>{upgrade.name}</strong>
                  <small>{ACTIVE_LEGACY_COPY[legacyId].effect}</small>
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p>이번 원정은 계승 유산 없이 시작했습니다.</p>
      )}
      {inactiveCount > 0 ? (
        <footer>
          <span aria-hidden="true">◇</span>
          <p>
            새로 계승한 유산 <strong>{inactiveCount}개</strong>는 현재 전력에 섞이지 않고 다음 원정 출정 때 적용됩니다.
          </p>
        </footer>
      ) : null}
    </section>
  )
}
