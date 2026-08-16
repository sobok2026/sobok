import type { EndingDiscoveryEntry } from './game-model'
import { ENDING_IDS, ENDING_ROUTES, ENDINGS, FALLEN_ENDING_IDS, WINNING_ENDING_IDS } from './game-model'

type EndingAtlasProps = {
  entries: EndingDiscoveryEntry[]
  titleId: string
  compact?: boolean
}

export function EndingAtlas({ entries, titleId, compact = false }: EndingAtlasProps) {
  const discoveredCount = entries.filter((entry) => entry.discovered).length
  const dawnCount = entries.filter((entry) => entry.discovered && ENDING_ROUTES[entry.id].family === 'dawn').length
  const fallenCount = entries.filter((entry) => entry.discovered && ENDING_ROUTES[entry.id].family === 'fallen').length

  return (
    <section className="ending-atlas" data-compact={compact ? 'true' : undefined} aria-labelledby={titleId}>
      <header>
        <div>
          <small>DAWN ATLAS · SIX COMPLETE CHRONICLES</small>
          <h3 id={titleId}>새벽과 몰락의 여섯 기록</h3>
          <p>완주 세 결말과 막별 실패 세 결말을 한눈에 확인하고, 다음 원정의 정확한 조건을 고르세요.</p>
        </div>
        <b>
          {discoveredCount} / {ENDING_IDS.length} DISCOVERED
        </b>
      </header>
      <div className="ending-atlas-grid">
        {entries.map((entry) => {
          const ending = ENDINGS[entry.id]
          const route = ENDING_ROUTES[entry.id]
          const state = entry.current ? 'current' : entry.discovered ? 'discovered' : 'locked'
          return (
            <article data-state={state} data-family={route.family} key={entry.id}>
              <span aria-hidden="true">{ending.glyph}</span>
              <div>
                <small>{route.label}</small>
                <strong>{ending.title}</strong>
                <p>{route.requirement}</p>
              </div>
              <b>
                {entry.current
                  ? '이번 결말'
                  : entry.discovered
                    ? entry.recordCount > 1
                      ? `${entry.recordCount}회 기록`
                      : '발견 완료'
                    : '미발견'}
              </b>
            </article>
          )
        })}
      </div>
      <footer>
        <span>
          <b>DAWN</b> {dawnCount} / {WINNING_ENDING_IDS.length}
        </span>
        <span>
          <b>FALLEN</b> {fallenCount} / {FALLEN_ENDING_IDS.length}
        </span>
        <p>발견 기록은 최근 원정이 연대기에서 밀려나도 계속 보존됩니다.</p>
      </footer>
    </section>
  )
}
