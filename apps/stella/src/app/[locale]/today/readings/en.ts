// en daily reading tables — themes and invitations, never event predictions.

import type { TodayReadings } from './types'

export const readings: TodayReadings = {
  moonInSign: {
    aries:
      "Today's air favors starting over deliberating. If something has been stuck in the planning stage, a small first step suits this day better than a perfect plan.",
    taurus:
      'Rushing tends to backfire today. Familiar places, good food, unhurried time — whatever settles the body is the answer.',
    gemini:
      'Conversation and news move lightly today. A message you kept postponing, or one short piece of writing, may travel further than you expect.',
    cancer:
      'The heart leans inward today. Rather than forcing yourself outward, staying close to the people and places that put you at ease is enough.',
    leo: 'Feelings run warm and a little theatrical today. Saying you love what you love — today it won’t feel awkward at all.',
    virgo:
      'Little messes catch your eye today. On the desk or in the mind, one small act of tidying can lighten the whole day.',
    libra:
      'Today suits together better than alone. Balance in conversation and harmony in a room feel bigger than usual — a good day to move a date with someone lovely forward.',
    scorpio:
      'Emotions move below the surface today. Real talk suits the day better than small talk, and solitary deep focus comes unusually easily.',
    sagittarius:
      'Your gaze reaches past what’s in front of you today. For a restless heart, an unfamiliar road, a new thing to learn, or a slightly longer walk is the medicine.',
    capricorn:
      'The mind turns calmly toward the work today. Finishing one thing beats anything flashy — pick up the heaviest item you’ve been putting off.',
    aquarius:
      'Today you’ll want a step of distance. If a sudden “why?” surfaces about things that always just worked, don’t let that question drift away.',
    pisces:
      'Boundaries soften today. Music, naps, and long daydreams fit the day, and intuition arrives before logic does.',
  },
  moonPhase: {
    newMoon:
      'The sky empties and begins to fill again. Rather than launching big, quietly plant the one thing you want to grow over the coming month.',
    waxingCrescent:
      'What you planted is just sprouting. It’s fine that it still looks fragile — right now direction matters more than size.',
    firstQuarter:
      'The first excitement meets reality here. What you adjust and repair at this point is what survives to the end.',
    waxingGibbous:
      'The build-up is finally visible. Pre-finish jitters may rise, but what’s needed now is polish, not speed.',
    fullMoon:
      'The month’s current is at its brightest. Feelings and relationships come into sharp relief — look fully before you judge what you see.',
    waningGibbous:
      'The brightness settles slowly. A good stretch for sharing and digesting what the last few days revealed.',
    lastQuarter:
      'This is the place for letting go. If something has needed closing for a while, today’s sky gives it a gentle push.',
    waningCrescent:
      'The quietest stretch of the month. Resting and emptying suit it better than starting — allow yourself some blank space.',
  },
  moonContact: {
    sun: {
      conjunction:
        'Today’s Moon passes over your Sun. Mood and identity face the same way — time spent on what feels most like you will fill you up quickly.',
      flow: 'Today’s Moon flows easily with your Sun. Mood and tasks click into place without effort — a smooth-current day.',
      square:
        'Today’s Moon grazes your Sun. If what you want and what you must do feel out of step, just remember that neither one is wrong.',
      opposition:
        'Today’s Moon stands opposite your Sun. On a day of seesawing between others’ expectations and your own heart, a decision can safely rest overnight.',
    },
    moon: {
      conjunction:
        'Today’s Moon returns to the very place it held when you were born. Once a month, feelings come home — your inner voice sounds clearer than usual.',
      flow: 'Today’s Moon resonates gently with your Moon. The emotional water is calm — a good day to open the conversation you’ve been saving.',
      square:
        'Today’s Moon squares your Moon. The heart may ripple for no clear reason, but feelings are weather — today’s clouds rarely last until tomorrow.',
      opposition:
        'Today’s Moon shines opposite your Moon. Your feelings and someone else’s both loom large today — don’t forget that both are real.',
    },
    mercury: {
      conjunction:
        'Today’s Moon meets your Mercury. Feelings turn into words easily — a good day to move an important conversation or a piece of writing forward.',
      flow: 'Today’s Moon flows well with your Mercury. Feeling and thought hold hands today, and even difficult topics untangle gently.',
      square:
        'Today’s Moon clashes with your Mercury. Mood seeps into tone easily today — reread the message once before you hit send.',
      opposition:
        'Today’s Moon stands across from your Mercury. When heart and logic hand you different answers, write both down and read them tomorrow.',
    },
    venus: {
      conjunction:
        'Today’s Moon passes over your Venus. The things you love come through more vividly — stay near beautiful things and gentle people.',
      flow: 'Today’s Moon flows sweetly with your Venus. Warmth circulates in your relationships — there’s no better timing to express affection.',
      square:
        'Today’s Moon nudges your Venus. Slights can feel larger than life today — don’t turn an unverified feeling into a fact.',
      opposition:
        'Today’s Moon stands opposite your Venus. The scale between giving and receiving tips today — balance is something you set with words.',
    },
    mars: {
      conjunction:
        'Today’s Moon lights a match under your Mars. Energy surges — spend it on moving your body or on the decision you’ve postponed.',
      flow: 'Today’s Moon keeps rhythm with your Mars. Intentions carry into action smoothly — good timing for a start.',
      square:
        'Today’s Moon provokes your Mars. Small things can spark a flare today — aim that heat at work or a workout, not at people.',
      opposition:
        'Today’s Moon stands across from your Mars. When the urge to push and the urge to protect pull equally, timing beats force.',
    },
  },
  moonHouse: {
    1: 'Today’s Moon moves through your 1st house. The stage light turns onto you — tend to body and mood first, and let what you want take the front seat.',
    2: 'Today’s Moon moves through your 2nd house. What you own — money, time, talent — comes into view. Check what actually makes you feel secure.',
    3: 'Today’s Moon moves through your 3rd house. Energy gathers where words and news travel. Light conversations, short trips, overdue messages all fit.',
    4: 'Today’s Moon moves through your 4th house. The current flows toward your roots — home, family, your own corner. Going home early counts as a plan.',
    5: 'Today’s Moon moves through your 5th house. Play, expression, and small thrills take the stage. Don’t aim to do it well — just do one thing for joy.',
    6: 'Today’s Moon moves through your 6th house. Daily rhythm and the body take the lead. Tidy the routine and listen to what your body reports.',
    7: 'Today’s Moon moves through your 7th house. “We” grows larger than “me” today. Care spent on your closest ties comes back in kind.',
    8: 'Today’s Moon moves through your 8th house. Deep things stir beneath the surface — trust, sharing, old feelings. One deep conversation can shift a lot.',
    9: 'Today’s Moon moves through your 9th house. The mind wants a wider view. New learning, unfamiliar stories, somewhere a little farther — they let air in.',
    10: 'Today’s Moon moves through your 10th house. The light falls on work, goals, and your public face. Today’s diligence sits somewhere unusually visible.',
    11: 'Today’s Moon moves through your 11th house. Friends, allies, shared dreams. Say a private plan out loud to someone — unexpected doors open that way.',
    12: 'Today’s Moon moves through your 12th house. The quietest passage of the month. Recovery suits today better than productivity — be generous with yourself.',
  },
  slowTransit: {
    jupiter: {
      conjunction:
        'Jupiter is sitting on your {point}. This window of expansion comes only every several years — when a door opens, don’t weigh it for too long.',
      flow: 'Jupiter is gently at your {point}’s back. Returns run a little richer than effort right now — set a sail toward where you want to grow.',
      square:
        'Jupiter is squaring your {point}. The urge to grow can turn into speeding — give each opportunity exactly one more look.',
      opposition:
        'Jupiter stands opposite your {point}. This stretch keeps asking one question: more, or already enough?',
    },
    saturn: {
      conjunction:
        'Saturn is crossing your {point}. It’s a weighty season of restructuring a life — but what you build here lasts.',
      flow: 'Saturn is steadily supporting your {point}. Consistency is being repaid in this stretch — trust what you’ve been stacking.',
      square:
        'Saturn is testing your {point}. It can feel slow and airless, but the foundation being packed down now will not crumble easily.',
      opposition:
        'Saturn stands opposite your {point}. Duty and freedom sit on the scale — sort what to keep from what to set down.',
    },
    uranus: {
      conjunction:
        'Uranus is shaking your {point} awake. If long-familiar things suddenly look worn out, don’t dismiss that feeling.',
      flow: 'Uranus is sending fresh wind through your {point}. Small experiments and changes go unusually well in this stretch.',
      square:
        'Uranus is grinding against your {point}. Pressure builds until it bursts — arrange small liberations often, instead of one big rupture.',
      opposition:
        'Uranus signals from across your {point}. Outside changes may feel large, but the steering wheel is still in your hands.',
    },
    neptune: {
      conjunction:
        'Neptune is wrapping your {point} in mist. As edges blur, imagination deepens — just double-check the decisions that matter.',
      flow: 'Neptune flows dreamlike with your {point}. Inspiration and empathy run deep — a gifted stretch for creating and consoling.',
      square:
        'Neptune is blurring your {point}. It’s easy to see what you wish to see — practice separating facts from hopes.',
      opposition:
        'Neptune stands opposite your {point}. If something in a relationship or a promise looks hazy, it’s okay to ask for clarity now.',
    },
    pluto: {
      conjunction:
        'Pluto is transforming your {point} from the very bottom. A metamorphosis that visits a life only a few times — what ends now needed to end.',
      flow: 'Pluto is lending quiet power to your {point}. The deeper the work, the better it goes in this stretch.',
      square:
        'Pluto is pressing on your {point}. The stronger the urge to control, the more it pays to spend force only on what can truly change.',
      opposition:
        'Pluto is arm-wrestling your {point} from across the wheel. In this stretch, not losing matters more than winning.',
    },
  },
  points: {
    sun: 'Sun',
    moon: 'Moon',
    ascendant: 'Ascendant',
  },
  station: {
    mercury: {
      begins:
        'Mercury turns retrograde today. Static creeps into plans and conversations — confirm the important ones twice. Anything beginning with “re-” (review, reunion, rewrite) actually thrives now.',
      ends: 'Mercury ends its retrograde today. Tangled talks and schedules start to loosen — it’s safe to reopen the decisions you shelved.',
    },
    venus: {
      begins:
        'Venus slips retrograde today. A season for revisiting love and taste — if an old feeling knocks, you’re allowed to answer slowly.',
      ends: 'Venus turns direct today. The fog around relationships lifts, and the heart’s scale finds its level again.',
    },
    mars: {
      begins:
        'Mars turns retrograde today. Drive points inward for a while — refine the strategy rather than opening new battles.',
      ends: 'Mars ends its retrograde today. Stalled things begin rolling forward again.',
    },
    jupiter: {
      begins:
        'Jupiter turns retrograde today. Expansion catches its breath — a season for digesting the opportunities you already hold.',
      ends: 'Jupiter turns direct today. The growth that was on hold picks up speed again.',
    },
    saturn: {
      begins:
        'Saturn turns retrograde today. Time to inspect the structures you’ve built — if something creaks, fix it now.',
      ends: 'Saturn ends its retrograde today. Inspection over — time to lay bricks on that checked foundation again.',
    },
    uranus: {
      begins:
        'Uranus turns retrograde today. Innovation turns inward — a good season for experiments that change you, not the world.',
      ends: 'Uranus turns direct today. The change that was prepared inside is ready to step outside.',
    },
    neptune: {
      begins: 'Neptune turns retrograde today. A step back from the dream, to check it against the ground.',
      ends: 'Neptune ends its retrograde today. A blurred ideal sharpens back into a direction.',
    },
    pluto: {
      begins: 'Pluto turns retrograde today. Deep change turns inward to ripen.',
      ends: 'Pluto turns direct today. What ripened in the dark begins to show on the surface.',
    },
  },
  headline: {
    conjunction:
      'In today’s sky, {a} and {b} meet in the same degree. Two currents merge into one — if that theme sounds unusually loud today, that’s natural.',
    flow: 'In today’s sky, {a} and {b} give each other a gentle push. A tailwind runs through the world’s affairs today.',
    square:
      'In today’s sky, {a} and {b} grind against each other. There may be tension in the air — but friction is always where change begins.',
    opposition:
      'In today’s sky, {a} and {b} face each other across the wheel. If you feel pulled both ways, today is practice in balance.',
  },
  do: {
    fire: [
      'move your body first',
      'take the postponed first step',
      'make a spontaneous plan',
      'say the thing today',
      'walk in direct sunlight',
      'try exactly one new thing',
    ],
    earth: [
      'finish one thing completely',
      'eat something that loves you back',
      'tidy the wallet and the calendar',
      'lose yourself in handwork',
      'walk the familiar route',
      'choose something that will last',
    ],
    air: [
      'send the overdue message',
      'put the thought into writing',
      'hear one new point of view',
      'clear the air with light chatter',
      'open a window, let wind in',
      'be generous with questions',
    ],
    water: [
      'write the heart down verbatim',
      'sink into favorite music',
      'rinse the day off with hot water',
      'check on someone you miss',
      'let the tears just happen',
      'protect your time alone',
    ],
  },
  dont: {
    fire: [
      'decide while still hot',
      'race someone else’s pace',
      'hit send in anger',
      'put winning before people',
      'run without a pause',
      'fight yesterday’s self',
    ],
    earth: [
      'postpone all change on principle',
      'wait for perfect conditions',
      'stack worries for later',
      'ignore the body’s signals',
      'soothe feelings at checkout',
      'live inside “should”',
    ],
    air: [
      'defer the decision forever',
      'live the whole day in your head',
      'talk without following through',
      'join every argument available',
      'fill the heart by scrolling',
      'dodge the deeper conversation',
    ],
    water: [
      'carry everyone else’s feelings',
      'reopen the old wound',
      'draw conclusions from a mood',
      'grow a slight in silence',
      'perform “fine” for everyone',
      'sink into the endless feed',
    ],
  },
}
