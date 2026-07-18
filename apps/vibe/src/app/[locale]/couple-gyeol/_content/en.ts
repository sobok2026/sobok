import type { GyeolContent } from '../_lib/types'

export const rarityContent = {
  axes: {
    affection: {
      description: 'How affection reaches and reassures each other',
      label: 'Affection Temperature',
    },
    balance: {
      description: 'How similarity and difference settle inside the relationship',
      label: 'Relationship Balance',
    },
    recovery: {
      description: 'How the two of you come close again after hurt feelings',
      label: 'Recovery Strength',
    },
    tempo: {
      description: 'How you match your everyday speeds together',
      label: 'Life Tempo',
    },
  },
  grades: {
    1: {
      description:
        'In the vibe model, all four axes lock together very clearly. The two of you have strong shared standards, and your relationship pattern stands out when you are together.',
      label: 'Grade 1',
      mountainLabel: 'Clear Gyeol',
    },
    2: {
      description:
        'Several axes among affection, tempo, balance, and recovery support the relationship steadily. You seem to know quite well what helps each other feel comfortable.',
      label: 'Grade 2',
      mountainLabel: 'Steady Gyeol',
    },
    3: {
      description:
        'One or two axes show a distinct personality. Similarities and differences mix in a workable way, giving the two of you a style of your own.',
      label: 'Grade 3',
      mountainLabel: 'Distinct Gyeol',
    },
    4: {
      description:
        "This is more balanced than dramatic. You are closer to building a comfortable base by adjusting to each other's pace and way of showing care.",
      label: 'Grade 4',
      mountainLabel: 'Balanced Gyeol',
    },
    5: {
      description:
        'This is a comfortable mix many couples can relate to. Rather than one special method, repeated everyday steadiness holds the relationship together.',
      label: 'Grade 5',
      mountainLabel: 'Comfortable Gyeol',
    },
    6: {
      description:
        'There is still room to tune the relationship. You are close to learning both what works well and what occasionally misses between you.',
      label: 'Grade 6',
      mountainLabel: 'Tuning Gyeol',
    },
    7: {
      description:
        'Right now, exploration is stronger than a clearly formed pattern. If you start by matching small standards, your shared style will take shape little by little.',
      label: 'Grade 7',
      mountainLabel: 'Newly Built Gyeol',
    },
  },
  metadata: {
    description:
      'A non-clinical couple tendency test that looks at affection temperature, life tempo, relationship balance, and recovery strength through 16 questions.',
    title: 'Couple Gyeol Index Test',
  },
  questions: [
    {
      id: 'duration',
      options: [
        { id: 'duration-new', label: "We are still carefully adjusting to each other's standards" },
        { id: 'duration-seasonal', label: 'A few seasons have given us natural rules' },
        { id: 'duration-long', label: 'We have many accumulated scenes and shared standards' },
      ],
      question: "How do you match each other's everyday standards?",
    },
    {
      id: 'frequency',
      options: [
        { id: 'frequency-daily', label: 'We feel settled when there are small daily points of contact' },
        { id: 'frequency-steady', label: 'Even when we keep our own time, the flow does not shake easily' },
        { id: 'frequency-event', label: 'We stay separate day to day, then come close quickly in important moments' },
      ],
      question: 'How dense is your everyday time together?',
    },
    {
      id: 'replyRhythm',
      options: [
        { id: 'reply-fast', label: 'When something comes to mind, we decide and move quickly' },
        { id: 'reply-slow', label: 'We look carefully, then settle into a stable choice' },
        { id: 'reply-asymmetric', label: 'One leads first, while the other receives it more deeply' },
      ],
      question: 'What is your tempo when making plans?',
    },
    {
      id: 'planning',
      options: [
        { id: 'plans-flexible', label: 'We mix spontaneity and planning depending on the situation' },
        { id: 'plans-planned', label: 'We feel better when timing and energy are planned ahead' },
        { id: 'plans-drifting', label: 'We go with the moment and sometimes drift out of sync' },
      ],
      question: 'How do you set dates or days off?',
    },
    {
      id: 'changeResponse',
      options: [
        { id: 'change-fast', label: 'When something changes, we switch direction right away' },
        { id: 'change-cautious', label: 'We look around a bit, then change slowly' },
        { id: 'change-role-split', label: 'One moves while the other organizes, and we meet in the middle' },
      ],
      question: 'What happens when plans suddenly change?',
    },
    {
      id: 'expression',
      options: [
        { id: 'expression-direct', label: 'When we like something, we express it fairly clearly' },
        { id: 'expression-subtle', label: 'Mood, action, and timing tend to show it first' },
        { id: 'expression-mixed', label: 'We mix direct expression with signals only we recognize' },
      ],
      question: 'How do you feel and show affection?',
    },
    {
      id: 'reassurance',
      options: [
        { id: 'reassurance-clear', label: 'The needed words have to be clear for us to feel secure' },
        { id: 'reassurance-subtle', label: 'Small actions and atmosphere are often enough' },
        { id: 'reassurance-awkward', label: 'The feeling is there, but we sometimes miss the timing' },
      ],
      question: 'What works best when reassurance is needed?',
    },
    {
      id: 'support',
      options: [
        { id: 'support-listen', label: 'Listening all the way through and naming the feeling gives us strength' },
        { id: 'support-practical', label: 'Practical help right away feels reassuring' },
        { id: 'support-light', label: 'A light joke or shift of mood helps us breathe' },
      ],
      question: 'What response do you need most on a hard day?',
    },
    {
      id: 'repair',
      options: [
        { id: 'repair-fast', label: 'We feel better when we check things quickly' },
        { id: 'repair-cooldown', label: 'We cool down a little, then realign calmly' },
        { id: 'repair-comeback', label: 'Even if we step away for a bit, we eventually come back together' },
      ],
      question: 'How do you return after hurt feelings?',
    },
    {
      id: 'apology',
      options: [
        { id: 'apology-fast', label: 'Even a short sorry helps if it comes quickly' },
        { id: 'apology-action', label: 'Trust returns when changed behavior shows more than words' },
        { id: 'apology-miss', label: 'We sometimes miss the timing and feel awkward later' },
      ],
      question: 'How do you handle apologies?',
    },
    {
      id: 'stress',
      options: [
        { id: 'stress-share', label: 'We can bring up hard things with each other fairly well' },
        { id: 'stress-quiet', label: 'We sort things out separately, then share only what is needed' },
        { id: 'stress-bounce', label: 'Before it gets too heavy, we shift the mood and move on' },
      ],
      question: 'What distance forms when stress gets bigger?',
    },
    {
      id: 'privateSignals',
      options: [
        { id: 'signals-many', label: 'We have many nicknames, memes, and habits only we understand' },
        { id: 'signals-some', label: "We sometimes recognize each other's jokes or expressions right away" },
        { id: 'signals-few', label: 'Easy everyday comfort fits us better than private codes' },
      ],
      question: 'Do you have small signals only the two of you know?',
    },
    {
      id: 'memory',
      options: [
        { id: 'memory-exact', label: 'We remember turning-point moments quite clearly' },
        { id: 'memory-vibe', label: 'The mood and feeling stay longer than the date' },
        { id: 'memory-now', label: 'The stability we feel now matters more than what already passed' },
      ],
      question: 'How do moments of coming close again stay with you?',
    },
    {
      id: 'balance',
      options: [
        { id: 'balance-similar', label: 'Our tastes and pace feel like they are becoming more alike' },
        { id: 'balance-complementary', label: "Because we are different, we fill each other's empty spaces" },
        { id: 'balance-volatile', label: 'There is a big temperature gap between good moments and off moments' },
      ],
      question: 'What does your relationship balance look like?',
    },
    {
      id: 'decision',
      options: [
        { id: 'decision-together', label: 'We decide important things by aligning our standards together' },
        { id: 'decision-alternate', label: 'We naturally take turns leading depending on the situation' },
        { id: 'decision-one-sided', label: 'One tends to decide more, while the other follows more' },
      ],
      question: 'What is the balance when making important choices?',
    },
    {
      id: 'space',
      options: [
        { id: 'space-close', label: 'The relationship feels comfortable when we stay close often' },
        { id: 'space-respecting', label: "We become stronger when each person's time is respected" },
        { id: 'space-uneven', label: 'We sometimes need to adjust because we want different distances' },
      ],
      question: "How do you leave room for each person's time?",
    },
  ],
  results: {
    archive: {
      mission: 'Bring up one scene that stayed with you today. Add a short reason why it felt good.',
      nickname: 'Scene Keeper',
      reasons: [
        'You have a strong ability to hold on to important moments in the relationship.',
        'Past experiences support your current sense of stability.',
        'Your shared standards have slowly built up over time.',
      ],
      summary:
        'Your gyeol does not let meaningful moments simply pass by. As remembered scenes accumulate, the standards between you become clearer.',
    },
    harbor: {
      mission: 'Instead of rushing to a conclusion today, first share one way of being together that felt comfortable.',
      nickname: 'Safe Harbor',
      reasons: [
        'A place to return to matters more than quick stimulation.',
        'Even when your speeds differ, the relationship does not shake easily.',
        'You tend to receive differences as roles rather than threats.',
      ],
      summary:
        'Your gyeol is less about big swings and more about making a place to return to. The strength is not drama, but how you become comfortable again.',
    },
    orbit: {
      mission: 'Pick one habit you often repeat today. Try remembering together when it became yours.',
      nickname: 'Everyday Orbit',
      reasons: [
        'Small repetition creates your rhythm.',
        'Everyday points of contact come alive more often than big events.',
        'Habits that grow more alike become comforting signals.',
      ],
      summary:
        'Your gyeol grows closer through small daily repeats. Rather than one special moment, the charm is in habits that keep returning.',
    },
    rare: {
      mission: 'Add one honest line of feeling to a signal only the two of you know. Keep it light, but clear.',
      nickname: 'Clearly Woven Pair',
      reasons: [
        'Strong signals appear across all four axes.',
        'Affection, tempo, balance, and recovery point in the same direction.',
        'One common couple formula does not explain you well.',
      ],
      summary:
        'In the vibe model, your gyeol is a notably clear combination. Even ordinary moments can work like standards only the two of you immediately understand.',
    },
    reconnect: {
      mission:
        'Think of a recent moment when you drifted apart and came close again. Try repeating one action that helped.',
      nickname: 'Re-Aligning Pair',
      reasons: [
        'You show strength in joining a stopped flow again.',
        'You tend to check or return rather than leave hurt feelings alone for too long.',
        'Different speeds can become material for recovery.',
      ],
      summary:
        'Your gyeol is not always perfectly smooth, but it has the strength to realign. What matters most is not the mismatch itself, but how you come close again.',
    },
    signal: {
      mission: 'Choose one signal you both recognize right away. Today, explain its meaning a little more warmly.',
      nickname: 'Private Signal Pair',
      reasons: [
        'You share many signals that work without direct explanation.',
        'Expressions, actions, and jokes can act as signs of affection.',
        'Even when it looks light on the outside, the inner meaning is often deep.',
      ],
      summary:
        'Your gyeol may look ordinary from the outside, but it has many clear signals for the two of you. Your shared interpretation makes the relationship firmer.',
    },
    spark: {
      mission:
        'Share one feeling that suddenly comes to mind. Leave room for the other person to receive it comfortably.',
      nickname: 'Instant Spark',
      reasons: [
        'The relationship comes alive when something comes to mind in the moment.',
        'Small choices move the two of you more than big plans.',
        'Current feeling and reaction are close to the center of the relationship.',
      ],
      summary:
        'Your gyeol lives through sudden sparks more than carefully prepared events. A light beginning can unexpectedly turn into a long-lasting scene.',
    },
  },
  ui: {
    answeredCount: '{count}/{total} answered',
    axisScoresTitle: 'Four Gyeol Axes',
    backButton: 'Back',
    copyFallbackButton: 'Copy link',
    copiedFeedback: 'Share link copied.',
    emptyResultDescription:
      'This share link does not match the current format. Answer 16 questions again to make a new result card.',
    emptyResultTitle: 'Make a new result card?',
    gradeTitle: 'Our Gyeol Grade',
    heroCta: 'Check Our Couple Gyeol Index',
    heroDescription:
      'Look at affection temperature, life tempo, relationship balance, and recovery strength through 16 questions.',
    heroEyebrow: '16 questions, about 2 minutes',
    heroSecondaryCta: 'What does it show?',
    heroTitle: 'What is the score of our gyeol?',
    indexLabel: 'Couple Gyeol Index',
    introNote: 'You can start right away without logging in.',
    missionTitle: 'A Small Mission for Today',
    modelStepGradeBody: 'Your answer mix is read through the vibe model and placed from Grade 1 to Grade 7.',
    modelStepGradeTitle: 'Check the grade',
    modelStepInputBody:
      'It asks only quick-choice questions about affection temperature, life tempo, relationship balance, and recovery strength.',
    modelStepInputTitle: '16 questions',
    modelStepShareBody:
      'Your score, grade, nickname, and one-line summary are wrapped into a card that is easy to capture and send.',
    modelStepShareTitle: 'Share card',
    modelNotice: 'This is not a test with correct answers. It reads your answer mix through the vibe model.',
    nextButton: 'Next question',
    questionEyebrow: '16-question test',
    reasonsTitle: 'Why It Reads This Way',
    resultButton: 'View result',
    resultEyebrow: 'Our Gyeol Card',
    restartButton: 'Restart',
    resultCardBody: 'It keeps things light by showing only your score and nickname, without sensitive details.',
    resultCardTitle: 'A Result Card Ready to Send',
    shareButton: 'Send result link',
    shareFallbackBody: '{grade} · {nickname} · Gyeol index {index}',
    shareLead: 'Based on the vibe model',
    shareTitle: 'Our Couple Gyeol Index Card',
  },
} as const satisfies GyeolContent
