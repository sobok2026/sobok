import type {
  Axis,
  AxisDefinition,
  CoupleTypeCode,
  CoupleTypeContent,
  CoupleTypeQuestion,
  CoupleTypeResult,
} from '../_lib/types'

export const axisDefinitions = {
  bond: {
    label: 'Bonding style',
    options: {
      D: {
        body: 'A rhythm that grows closer through sincerity, meaning, and long conversations',
        label: 'Heartfelt bond',
      },
      P: {
        body: 'A rhythm that opens the mood with teasing, memes, and jokes',
        label: 'Playful bond',
      },
    },
    values: ['P', 'D'],
  },
  expression: {
    label: 'Expression style',
    options: {
      N: {
        body: 'A rhythm that reads nuance and small signals between the words',
        label: 'Subtle expression',
      },
      O: {
        body: 'A rhythm that says likes and dislikes relatively clearly',
        label: 'Direct expression',
      },
    },
    values: ['O', 'N'],
  },
  pace: {
    label: 'Conversation pace',
    options: {
      H: {
        body: 'A rhythm that builds steadiness slowly and stays with it',
        label: 'Steady harbor',
      },
      S: {
        body: 'A rhythm that starts a spark as soon as a thought appears',
        label: 'Spontaneous spark',
      },
    },
    values: ['S', 'H'],
  },
  repair: {
    label: 'Repair rhythm',
    options: {
      L: {
        body: 'A rhythm that returns after emotions have been sorted out',
        label: 'Slow processing',
      },
      Q: {
        body: 'A rhythm that checks discomfort quickly and reconnects',
        label: 'Quick repair',
      },
    },
    values: ['Q', 'L'],
  },
} as const satisfies Record<Axis, AxisDefinition>

export const coupleTypeQuestions = [
  {
    axis: 'pace',
    id: 'pace-start',
    options: [
      { label: 'I text right away when they come to mind and create the flow', value: 'S' },
      { label: 'I gather thoughts a bit and continue when the timing feels easy', value: 'H' },
    ],
    question: 'When does conversation between you two start most naturally?',
  },
  {
    axis: 'expression',
    id: 'expression-like',
    options: [
      { label: 'When I like something, I say it fairly clearly', value: 'O' },
      { label: 'I show it through mood and actions before words', value: 'N' },
    ],
    question: 'Which feels closer to your usual affection style?',
  },
  {
    axis: 'repair',
    id: 'repair-conflict',
    options: [
      { label: 'I feel settled when we check and clear discomfort quickly', value: 'Q' },
      { label: 'We cool down first, then talk after sorting things out', value: 'L' },
    ],
    question: 'What is your default rhythm when a small misunderstanding happens?',
  },
  {
    axis: 'bond',
    id: 'bond-mood',
    options: [
      { label: 'Jokes and teasing soften the mood first', value: 'P' },
      { label: "Sincere words help us confirm each other's heart", value: 'D' },
    ],
    question: 'What works best when you two need to feel close again?',
  },
  {
    axis: 'pace',
    id: 'pace-date',
    options: [
      { label: 'If it sounds fun, we can move even when it is sudden', value: 'S' },
      { label: 'We set it steadily around schedules and energy', value: 'H' },
    ],
    question: 'What is your temperature when planning a date?',
  },
  {
    axis: 'expression',
    id: 'expression-care',
    options: [
      { label: 'I usually say what I need or what felt disappointing', value: 'O' },
      { label: 'I leave small signals so the other person can notice', value: 'N' },
    ],
    question: 'How do you usually ask for care?',
  },
  {
    axis: 'repair',
    id: 'repair-silence',
    options: [
      { label: 'I send a check-in before the silence gets too long', value: 'Q' },
      { label: 'I let silence be sorting time and reopen slowly', value: 'L' },
    ],
    question: 'On days when replies slow down, how do you usually adjust?',
  },
  {
    axis: 'bond',
    id: 'bond-memory',
    options: [
      { label: 'We have many small codes like funny photos, nicknames, and memes', value: 'P' },
      { label: 'We remember the feelings and meaning of the day for a long time', value: 'D' },
    ],
    question: 'What are your shared memories made of most often?',
  },
  {
    axis: 'pace',
    id: 'pace-night',
    options: [
      { label: 'Late at night, conversation often catches fire suddenly', value: 'S' },
      { label: "It usually continues steadily inside the day's routine", value: 'H' },
    ],
    question: 'What usually starts a long conversation day?',
  },
  {
    axis: 'expression',
    id: 'expression-check',
    options: [
      { label: 'Clear words reduce misunderstandings', value: 'O' },
      { label: 'I hope the context is seen without too much explaining', value: 'N' },
    ],
    question: "What matters more when checking each other's feelings?",
  },
  {
    axis: 'repair',
    id: 'repair-apology',
    options: [
      { label: 'I open the door with even a short apology first', value: 'Q' },
      { label: 'I talk again after fully understanding why it happened', value: 'L' },
    ],
    question: 'When do you usually say sorry?',
  },
  {
    axis: 'bond',
    id: 'bond-support',
    options: [
      { label: 'A light joke that shifts the mood works well', value: 'P' },
      { label: 'Quiet listening and naming the real feeling helps most', value: 'D' },
    ],
    question: 'On a hard day, what response gives the most strength?',
  },
] as const satisfies readonly CoupleTypeQuestion[]

export const coupleTypeResults = {
  HNLD: {
    code: 'HNLD',
    dateMission: 'At a quiet place you both like, each say one moment you were grateful for today.',
    displayCode: 'LOVE',
    strengths: [
      'The warmth of the relationship lasts without being rushed.',
      'Trust builds through attitude and consistency more than words.',
      'There is room to hold big emotions safely.',
    ],
    summary:
      'You are a couple that deepens slowly without pushing each other. You remember small signals for a long time, and you feel closest when sincere words come out after emotions have settled.',
    title: 'Deep Harbor That Warms Slowly',
    watchOut: 'If you postpone necessary words for too long out of care, the other person may miss the hint.',
  },
  HNLP: {
    code: 'HNLP',
    dateMission: 'Leave one private joke from today and one real feeling beside it.',
    displayCode: 'SLOW',
    strengths: [
      'Subtle playfulness melts awkwardness gently.',
      'Even with a slower pace, your shared rhythm is sturdy.',
      'After conflict, you can slowly bring the mood back to life.',
    ],
    summary:
      'You approach carefully, but you know the power of play. Even when words are scarce, you share many private signals and recover over time through comfortable laughter.',
    title: 'Secret Base of Slow Jokes',
    watchOut: 'If jokes replace sincerity for too long, important feelings can become blurry.',
  },
  HNQD: {
    code: 'HNQD',
    dateMission: 'Pick one moment that felt comfortable and say the reason in one direct sentence.',
    displayCode: 'DEEP',
    strengths: [
      'Even in a steady flow, misunderstandings are not left alone for long.',
      'You read small changes in expression and tone well.',
      'In important moments, deep confirmation strengthens the relationship.',
    ],
    summary:
      'You are usually calm, but you reach out quickly when it matters. You sense subtle signals well and realign through sincerity when feelings shake.',
    title: 'Calm Radar Repair',
    watchOut:
      'Expecting the other person to notice is not always enough. Try checking important things with a short sentence.',
  },
  HNQP: {
    code: 'HNQP',
    dateMission: 'Choose a phrase or emoji you both use often lately and give it a tiny nickname.',
    displayCode: 'BABE',
    strengths: [
      'You find small fun inside comfortable routines.',
      'You change the mood before discomfort piles up.',
      'Many private signals keep everyday conversation light.',
    ],
    summary:
      'You add light playfulness on top of a steady everyday base. You read feelings through small reactions more than big words, and you softly loosen awkwardness first.',
    title: 'Gentle Playful Repair',
    watchOut: 'Your mood-lifting skill is strong, but try not to laugh away explanations that are actually needed.',
  },
  HOLD: {
    code: 'HOLD',
    dateMission: 'Before the next date, each say one thing you hope for and then meet.',
    displayCode: 'SOUL',
    strengths: [
      'You deliver necessary words with steadiness.',
      'After sorting emotions, you reconnect through deeper conversation.',
      'Trust grows because you keep relationship rules and promises well.',
    ],
    summary:
      'You combine clear expression with a steady pace. Instead of rushing to conclusions, you think enough and still bring up important words directly.',
    title: 'Calm Promise Designers',
    watchOut: 'If you wait only for perfectly organized words, you may miss warm spontaneity.',
  },
  HOLP: {
    code: 'HOLP',
    dateMission: 'Say one small disappointment gently, then shift the mood with a walk or snack.',
    displayCode: 'VIBE',
    strengths: [
      'You speak clearly without making the mood only heavy.',
      'You soften sorted emotions with playfulness.',
      'The relationship has both steadiness and humor.',
    ],
    summary:
      'You speak directly inside a stable flow and recover lightly. You do not hide disappointment, but you have a good ability to return to comfort through jokes and everyday ease.',
    title: 'Kind Roommate With Spark',
    watchOut: 'Even if you resolve things playfully, check once more that the other person really understood.',
  },
  HOQD: {
    code: 'HOQD',
    dateMission: 'Say one necessary thing today and listen to the answer without interrupting.',
    displayCode: 'REAL',
    strengths: [
      'Quick checks reduce relationship wobble.',
      'Direct expression makes expectations relatively clear.',
      'Steady affection and deep conversation stay balanced.',
    ],
    summary:
      "You are calm, but you do not delay necessary words. You do not leave emotional sparks unattended for long, and you regain stability by checking each other's heart directly.",
    title: 'Warm Course Correctors',
    watchOut: 'Your wish to check quickly can feel like pressure, so keep an eye on the temperature of your words.',
  },
  HOQP: {
    code: 'HOQP',
    dateMission: "Recreate the funniest moment from today's conversation in one sentence instead of a screenshot.",
    displayCode: 'KISS',
    strengths: [
      'You speak directly while keeping the mood light.',
      'When misunderstandings appear, you clear them quickly and return to daily life.',
      'Fun back-and-forth stays alive inside a steady routine.',
    ],
    summary:
      'You connect honestly and cheerfully on a comfortable base. You say what is needed right away, and when things get heavy, you know how to change the air with play.',
    title: 'Steady Banter Mechanics',
    watchOut: 'A quick fix is not always full repair. Sometimes listen through the feeling that comes after.',
  },
  SNLD: {
    code: 'SNLD',
    dateMission: 'Send a sudden feeling briefly, then add the reason calmly later.',
    displayCode: 'LUST',
    strengths: [
      'You value both instant feeling and deep meaning.',
      'Subtle expression carries strong immersion.',
      'After time to sort things out, you create conversations that linger.',
    ],
    summary:
      'The emotional spark lights quickly, but the way you reveal your heart is delicate. Sudden pull and deep afterglow coexist, leaving vivid scenes that belong only to you two.',
    title: 'Spark and Afterglow Story',
    watchOut: 'If strong emotions remain only as subtle signals, the other person may lose the direction.',
  },
  SNLP: {
    code: 'SNLP',
    dateMission: 'Set up a spontaneous short call or meet-up, and end by saying one thing that felt good today.',
    displayCode: 'KINK',
    strengths: [
      'You create instant fun and remember it for a long time.',
      'Private codes and jokes make the relationship feel vivid.',
      'After emotional sorting, you recover by laughing again.',
    ],
    summary:
      'You mix spontaneous pull with subtle playfulness. The spark catches quickly, but the inner heart opens slowly, and you grow close again later through laughter.',
    title: 'Flashing Secret Pranksters',
    watchOut: 'The more fun moments you have, the more important it is not to let real emotions slip by too lightly.',
  },
  SNQD: {
    code: 'SNQD',
    dateMission: 'Ask how they are right now, and leave room at the end so they can answer comfortably.',
    displayCode: 'SEXY',
    strengths: [
      'You respond quickly to emotional changes and check deeply.',
      'You do not miss small signals, so reconnection is fast.',
      'Spontaneity and sincerity move together, keeping the relationship alive.',
    ],
    summary:
      'You catch signals in the moment and connect quickly with sincerity. Even if expression is subtle, emotions move fast, and you have the strength to confirm deeply when something shakes.',
    title: 'Sensitive Spark Radar',
    watchOut: 'Rather than loading too much meaning onto small changes, add a sentence that checks directly.',
  },
  SNQP: {
    code: 'SNQP',
    dateMission: 'Send one playful thought from today, then immediately ask a real check-in.',
    displayCode: 'FOOL',
    strengths: [
      'Fast reactions and playfulness easily revive conversation.',
      'You read small signals sensitively and shift the mood.',
      'Even after misunderstandings, you can lightly start talking again.',
    ],
    summary:
      'You combine quick playfulness with delicate sensing. You text spontaneously, read small nuances, and have a strong feel for reviving the mood quickly.',
    title: 'Lightning Playful Radar',
    watchOut:
      "Sometimes your quick response gets ahead of the other person's pace. One beat of pause can also be connection.",
  },
  SOLD: {
    code: 'SOLD',
    dateMission: 'Suggest one spontaneous date and say the feeling behind the suggestion too.',
    displayCode: 'BURN',
    strengths: [
      'You do not miss the moment your heart moves.',
      'Honest expression and deep conversation connect strongly.',
      'After sorting things out, you say words that make the relationship sturdier.',
    ],
    summary:
      'You burn quickly but leave deep meaning. You say what you want fairly directly, and after emotions grow, serious conversation helps rebuild the meaning of the relationship.',
    title: 'Direct Afterglow Architects',
    watchOut:
      'The stronger the spontaneous expression, the more helpful it is to leave time for the other person to catch up.',
  },
  SOLP: {
    code: 'SOLP',
    dateMission: 'Choose a story that began as a joke, then lightly add what you truly want at the end.',
    displayCode: 'WILD',
    strengths: [
      'Honesty and humor together keep things from feeling stuck.',
      'Even after sorting emotions, you do not leave the mood only heavy.',
      'Spontaneous suggestions bring energy into the relationship.',
    ],
    summary:
      'You move spontaneously and speak honestly, but recover slowly with laughter. You move between jokes and direct expression, creating your own liveliness together.',
    title: 'Honest Spontaneous Comedy',
    watchOut: 'If the funny line was actually a real request, say it clearly once more so it lands.',
  },
  SOQD: {
    code: 'SOQD',
    dateMission: 'Say one thing you are grateful for and one thing you want today in the same temperature.',
    displayCode: 'FIRE',
    strengths: [
      'You say and check things quickly, so misunderstandings do not pile up.',
      'Sincerity is delivered clearly, making the relationship direction visible.',
      'Even after fast repair, you leave meaningful conversation behind.',
    ],
    summary:
      'Both emotional pace and expression are fast and clear. If something feels good, you say so; if something feels off, you do not bury it for long and realign with sincerity.',
    title: 'Direct Fire Repair',
    watchOut: 'So your quick honesty does not sound sharp, start by laying down the affection underneath.',
  },
  SOQP: {
    code: 'SOQP',
    dateMission: 'Create a short call sign that only you two use and send it once today.',
    displayCode: 'FUXK',
    strengths: [
      'Even when conversation stops, you relight it quickly.',
      'Honest words and jokes mix, reducing frustration.',
      'Small misunderstandings clear fast, and you return to everyday rhythm.',
    ],
    summary:
      'You talk as soon as thoughts appear and grow close quickly through honest expression and playfulness. Heavy air does not stay long, and your own back-and-forth reconnects you.',
    title: 'Firework Banter Repair',
    watchOut: 'Because things can feel resolved lightly, check once more that the other person is really okay.',
  },
} as const satisfies Record<CoupleTypeCode, CoupleTypeResult>

export const coupleTypeContent = {
  axisDefinitions,
  metadata: {
    description:
      'A non-clinical 12-question couple conversation type test for reading pace, expression, repair rhythm, and bonding style.',
    title: 'Couple Conversation Type',
  },
  questions: coupleTypeQuestions,
  results: coupleTypeResults,
  ui: {
    answeredCount: '{count} answered',
    dateMissionTitle: "Today's conversation mission",
    editButton: 'Adjust answers',
    heroDescription:
      'Use 12 light choices to read your conversation pace, expression style, repair rhythm, and bonding style. This test reads the current pattern without defining either person.',
    heroEyebrow: '16 couple conversation types',
    heroTitle: 'What rhythm brings your conversations closer?',
    homeLink: 'Home',
    navigationLabel: 'Explore couple conversation types',
    nextButton: 'Next question',
    previousButton: 'Previous',
    privacyNotice: '{count} answers · Results are not saved on the server and reset on refresh.',
    questionCountLabel: 'Questions',
    questionCountValue: '{count}',
    resultButton: 'See result',
    resultCountLabel: 'Results',
    resultCountValue: '16 types',
    resultEyebrow: 'Couple conversation type result',
    restartButton: 'Restart',
    rhythmsTitle: 'Your four rhythms',
    selectAnswerButton: 'Choose an answer',
    strengthsTitle: 'Where you fit well',
    watchOutTitle: 'Watch out',
  },
} as const satisfies CoupleTypeContent
