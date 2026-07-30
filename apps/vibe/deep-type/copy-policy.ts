/**
 * The eight copy gates of MIGRATION §8.5, as data. The scanner lives in `copy-policy.test.ts` so nothing that
 * ships imports a TypeScript parser; this file is a table and has no imports at all.
 *
 * ko only. en/ja/zh are empty strings until a human writes them, so scanning them would assert nothing today
 * and would have to be re-read the moment they are filled — the gate goes wide in the same commit as the
 * translation, not before.
 *
 * Two design rules the patterns follow, both learned from the copy already in the tree:
 *
 *   1. Match the claim, not the noun. '마감' is JP-axis and drain-facet vocabulary (`work-labels.free.ts`
 *      OVERLOAD names it), so banning the bare token would fail on frozen content that is about the reader's
 *      week rather than about this offer. The urgency patterns therefore require the deadline to attach to
 *      something ('마감 임박', '오늘 마감') the way a fake countdown does.
 *   2. Literals only, never file text. Several content modules explain in a comment which token they may not
 *      contain, and a raw-text grep fails on its own documentation. The scanner walks string and template
 *      literals out of the AST for the same reason `band-labels.free.ts` says it must.
 */

export type CopyGateId =
  | 'DETERMINISM'
  | 'FAKE_METRIC'
  | 'URGENCY'
  | 'TRADEMARK'
  | 'CAREER_DIRECTIVE'
  | 'TURNSTILE_ACTION'
  | 'COUNT_PROMISE'
  | 'REMEASURE'

export type CopyGate = {
  /** Why this vocabulary is banned, quoted in the failure so a reader need not open MIGRATION.md. */
  readonly because: string
  readonly id: CopyGateId
  /**
   * Sources exempt from this gate, as path suffixes under `apps/vibe`. Empty for every gate but REMEASURE —
   * an allowlist is a hole, and each hole needs the reason recorded next to it.
   */
  readonly allow: readonly string[]
  /**
   * When set, the gate applies only to literals whose object key path matches. `paywall.effortNote` is the one
   * screen allowed to quote a count, so the count gate is keyed rather than global.
   */
  readonly keyPaths: readonly RegExp[] | null
  readonly patterns: readonly RegExp[]
}

/**
 * A match is forgiven when the rest of its sentence negates it. R5 of §5.4 — '이직이나 퇴사를 권하는 조언이
 * 아니에요' — is a required disclaimer that names exactly what the directive gate bans, so a gate that could
 * not read the negation would forbid the sentence that keeps the product honest.
 *
 * `아닙` is listed separately from `아니` and is not redundant. Hangul composes a syllable from its 받침, so
 * '아닙니다' is 아·닙·니·다 and simply does not contain the substring '아니' — the polite form the product copy
 * uses was forgiven while the formal form the legal documents use was not, which is exactly backwards.
 */
export const NEGATION = /아니|아닙|않|없어|없습니다|말아/

export const COPY_GATES: readonly CopyGate[] = [
  {
    id: 'DETERMINISM',
    because: '결과는 지금 답의 요약이지 사람에 대한 단정이 아니다',
    allow: [],
    keyPaths: null,
    // '확정' is bound to a result noun rather than banned outright. The JP items ask the respondent when they
    // settle a decision ('언제 확정하는 편인가요?'), which is the construct being measured; a bare-token ban
    // would forbid the instrument from naming the very behaviour it scores.
    patterns: [
      /(결과|유형|성향|점수|글자|진단)[^.!?\n]{0,12}확정/,
      /확정(된|적인|입니다|이에요|이었)/,
      /정확히/,
      /당신은[^.!?\n]{0,24}입니다/,
      /형입니다/,
    ],
  },
  {
    id: 'FAKE_METRIC',
    because: '규준 표본이 없어 상위·백분위·희소성은 만들어낸 수치가 된다',
    allow: [],
    keyPaths: null,
    patterns: [/상위\s*\d+\s*%/, /상위\s*몇\s*%/, /백분위/, /빈도/, /희소성/, /비율/],
  },
  {
    id: 'URGENCY',
    because: '가짜 마감과 잔여 수량은 전환 리서치가 금지한 압박이다',
    allow: [],
    keyPaths: null,
    patterns: [
      /지금만/,
      /(오늘|내일)까지만?/,
      /마감\s*(임박|직전)/,
      /(오늘|내일|곧)\s*마감/,
      /곧\s*(종료|끝나)/,
      /종료\s*임박/,
      /선착순/,
      /한정\s*(수량|판매|기간|특가)/,
      /서두르/,
      /놓치면/,
      /마지막\s*기회/,
      /남은\s*(시간|수량|자리|인원)/,
    ],
  },
  {
    id: 'TRADEMARK',
    because: 'MBTI는 타사 상표이고 D11이 변호사 회신 전까지 3계층 전부를 금지한다',
    allow: [],
    keyPaths: null,
    patterns: [/MBTI/i, /엠비티아이/, /마이어스[\s·-]?브릭스/, /Myers[\s-]?Briggs/i],
  },
  {
    id: 'CAREER_DIRECTIVE',
    because: '직업 소개도 취업 알선도 아니므로 진로 행동을 권하지 않는다',
    allow: [],
    keyPaths: null,
    patterns: [/(이직|퇴사|창업|사표)[^.!?\n]{0,24}(하세요|하는\s*게|해\s*보세요|추천|권해|권하|권유)/],
  },
  {
    id: 'TURNSTILE_ACTION',
    because: 'action 리터럴이 위젯과 서버에서 갈리면 전 사용자가 403이 되고 로그에서 봇과 구별되지 않는다',
    allow: [],
    keyPaths: null,
    // Structural, not lexical: the test asserts the widget takes its action from the shared constant and that
    // every constant matches this shape. The pattern is the shape.
    patterns: [/^[a-z][a-z0-9-]{0,31}$/],
  },
  {
    id: 'COUNT_PROMISE',
    because: '섹션·카드 개수를 약속하면 산출물이 하나 빠질 때마다 그것이 미이행이 된다 (D5)',
    allow: [],
    // §8.5 names `offer.ts` as a third target. It is scanned (below) but needs no key entry: it holds amounts
    // and a GA4 item name, so it has no place to promise a count. `methodology.*` and `legal.*` stay out by
    // construction — neither path matches — and neither states a section count either.
    // `landing.` is the ad-landing block and `ui.landing` the strings that predate it. Both are pre-purchase
    // copy on the same screen, so both are gated: the whole reason D5 exists is that a promised count becomes an
    // unfulfilled promise the moment one deliverable is cut, and that promise is most tempting exactly here.
    keyPaths: [/^paywall\./, /^ui\.landing/, /^landing\./],
    patterns: [/\d+\s*(개|장|가지)\s*(섹션|카드|인사이트|리포트)/, /(12|10)\s*개/],
  },
  {
    id: 'REMEASURE',
    because: '무료 결과가 잠정이라는 인상을 주면 여덟 글자가 협상 가능해 보인다 (D1)',
    // D14 requires the paid pass to announce that the clarity band moved, and the only honest way to say that
    // uses the verbs this gate bans. The exemption is the two band-label tables that own the movement copy —
    // and them alone. Their renderers are not exempt on purpose: a component renders these strings through a
    // variable, so it never needs the vocabulary itself, and the day one inlines the sentence is the day the
    // wording escapes the table that owns it.
    //
    // Neither exempt table may say a letter moved; the test below pins that separately.
    allow: ['deep-type/content/band-labels.free.ts', 'deep-type/content/band-labels.paid.ts'],
    keyPaths: null,
    patterns: [
      /다시\s*(측정|재|잰|잽)/,
      /더\s*정확하게/,
      /결과가\s*(바뀔|달라질)/,
      /더\s*선명해/,
      /선명도[^.!?\n]{0,12}(올라|내려|오르|내리)/,
    ],
  },
]

/**
 * ko copy the gates read, as path suffixes under `apps/vibe`. A source lands here when a human authored Korean
 * that reaches a screen; generated strings and locale files that are still blank do not.
 *
 * `legal.ts` and `pages.ts` carry all four locales in one module rather than one file per locale. The Korean
 * gates simply do not match English, Japanese or Chinese text, so scanning the whole module costs nothing and
 * keeps TRADEMARK — the one gate whose patterns are not Hangul — reading every locale.
 */
export const KO_COPY_SOURCES: readonly string[] = [
  'deep-type/content/abilities.ts',
  // The eight axis names, pole labels and reflection prompts. They used to be an `axes:` block inside
  // `_content/ko.ts` and were scanned as part of it; moving them into deep-type/ so the rule engine could stop
  // reaching into the route tree took them out of every gate's reach until this line was added. A source that
  // moves has to move on this list in the same commit.
  'deep-type/content/axes.ko.ts',
  'deep-type/content/band-labels.free.ts',
  'deep-type/content/band-labels.paid.ts',
  'deep-type/content/evidence-labels.ts',
  'deep-type/content/facet-details.paid.ts',
  'deep-type/content/opening.paid.ts',
  'deep-type/content/reflection.paid.ts',
  'deep-type/content/section-copy.paid.ts',
  'deep-type/content/work-labels.free.ts',
  'deep-type/content/work-labels.paid.ts',
  'deep-type/content/world-job-names.ts',
  'deep-type/content/world-job.ts',
  'deep-type/effort.ts',
  'deep-type/free-deliverables.ts',
  'deep-type/offer.ts',
  'deep-type/role-families.ts',
  'deep-type/rules/free.ts',
  'src/app/[locale]/deep-type/_content/ko.ts',
  'src/app/[locale]/deep-type/_content/question-options/ko.free.ts',
  'src/app/[locale]/deep-type/_content/question-options/ko.paid.ts',
  'src/app/[locale]/deep-type/_content/question-prompts/ko.free.ts',
  'src/app/[locale]/deep-type/_content/question-prompts/ko.paid.ts',
  'src/content/deep-type-checkout-return.ts',
  'src/content/deep-type-reopen.ts',
  'src/content/legal.ts',
  'src/content/pages.ts',
  'worker/report/rules.ts',
]

/**
 * Layer 1 of the MBTI trademark rule: the surfaces where the mark would appear as OUR name for the product —
 * the product name itself, page titles, structured-data names, the site name in OpenGraph. §8.5 puts these
 * under an absolute ban, and until D11's counsel reply the other two layers are banned too, so in practice
 * TRADEMARK is what enforces all three.
 *
 * This list exists separately because the highest-risk surface was the one `KO_COPY_SOURCES` could not see:
 * `worker/lib/pricing.ts` holds the string PortOne prints on the 결제창 and the card statement, and it is not
 * user-facing Korean copy, so it never belonged in the copy list. The rule lived only in a comment there — and
 * a comment is invisible to an AST scanner by construction.
 */
export const TRADEMARK_SOURCES: readonly string[] = [
  // All four locales, because TRADEMARK's patterns are the only non-Hangul ones and 'MBTI' can appear in any of
  // them. The axis copy moved out of `_content/<locale>.ts` into these four modules.
  'deep-type/content/axes.en.ts',
  'deep-type/content/axes.ja.ts',
  'deep-type/content/axes.ko.ts',
  'deep-type/content/axes.zh.ts',
  'deep-type/offer.ts',
  'src/app/[locale]/deep-type/_content/ko.ts',
  'src/app/[locale]/deep-type/_lib/brand.ts',
  'src/constants.ts',
  'src/content/legal.ts',
  'src/content/pages.ts',
  'src/i18n/messages/ko.ts',
  'worker/lib/pricing.ts',
]
