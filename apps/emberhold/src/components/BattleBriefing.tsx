import type { Difficulty } from './game-model'
import { MAX_NIGHTS } from './game-model'

type StoryView = {
  act: number
  title: string
  location: string
  weather: string
  omen: string
  boss: boolean
  rule: string
}

type ConditionView = {
  glyph: string
  label: string
  name: string
  description: string
}

type DifficultyProtocolView = {
  glyph: string
  label: string
  name: string
  ruleName: string
  ruleDescription: string
  combatSummary: string
}

type MasteryForecastView = {
  state: string
  label: string
  detail: string
}

type BattleBriefingProps = {
  day: number
  difficulty: Difficulty
  story: StoryView
  condition: ConditionView
  protocol: DifficultyProtocolView
  masteryForecast: MasteryForecastView
}

export function BattleBriefing({ day, difficulty, story, condition, protocol, masteryForecast }: BattleBriefingProps) {
  return (
    <>
      <div className="panel-heading battle-heading">
        <div>
          <p className="eyebrow">
            ACT {story.act} · NIGHT {String(day).padStart(2, '0')} · {story.location}
          </p>
          <h2 id="battle-title">{story.title}</h2>
        </div>
        <div className="storm-badge">
          <span aria-hidden="true">❄</span>
          {story.weather} · {day === MAX_NIGHTS ? '대빙설 경보' : `${day + 2}단계`}
        </div>
      </div>

      <div className="night-omen">
        <span aria-hidden="true">“</span>
        <p>{story.omen}</p>
        <small>— 북부 망루 기록</small>
      </div>

      <div className="field-rules">
        <div className="night-rule" data-boss={story.boss ? 'true' : 'false'}>
          <span>{story.boss ? 'BOSS PROTOCOL' : 'FIELD CONDITION'}</span>
          <p>{story.rule}</p>
        </div>
        <div className="night-condition">
          <span aria-hidden="true">
            <i>{condition.glyph}</i>
          </span>
          <div>
            <small>RIFT VARIATION · {condition.label}</small>
            <strong>{condition.name}</strong>
            <p>{condition.description}</p>
          </div>
        </div>
      </div>

      <section
        className="difficulty-protocol-strip"
        data-difficulty={difficulty}
        aria-label={`${protocol.name} 고유 규칙`}
      >
        <span aria-hidden="true">{protocol.glyph}</span>
        <div>
          <small>
            {protocol.label} · {protocol.name}
          </small>
          <strong>{protocol.ruleName}</strong>
          <p>{protocol.ruleDescription}</p>
        </div>
        <em data-state={masteryForecast.state}>
          <span>{protocol.combatSummary}</span>
          <b>{masteryForecast.label}</b>
          <small>{masteryForecast.detail}</small>
        </em>
      </section>
    </>
  )
}
