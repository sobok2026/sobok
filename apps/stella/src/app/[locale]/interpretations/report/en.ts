import type { ReportContent } from '../types'

export const report: ReportContent = {
  title: 'The Deep Reading the Stars Tell',
  subtitle:
    'From the placements that ring loudest in this chart to love, work and the inner world — your sky, woven into one story.',
  noTimeNote:
    'Without a birth time, we read every layer except the Ascendant and houses. Learn the time and the deeper layers open too.',
  chapterTitles: {
    core: 'Your Core Combination',
    signature: 'The Loudest Voice in This Chart',
    path: "Life's Direction",
    mind: 'Thought and Expression',
    love: 'The Grain of Love',
    work: 'Work and Calling',
    money: 'Money and Value',
    root: 'The Inner Foundation',
    closing: 'Reading It All as One',
  },
  signatureIntro:
    "Not every placement speaks at the same volume. The tighter the angle and the closer to life's axes, the louder the voice. Below are the placements ringing loudest in your sky.",
  kicker: {
    sun: 'My center · {sign} Sun',
    moon: "Feeling's grain · {sign} Moon",
    mercury: 'Circuit of thought · {sign} Mercury',
    venus: 'Language of love · {sign} Venus',
    southNode: 'The familiar seat · {sign} South Node',
    northNode: 'Direction of growth · {sign} North Node',
    rising: 'The me the world sees · {sign} Rising',
    aspect: '{a} × {b} · {name} · orb {orb}°',
    house: '{planet} · house {n}',
    dignity: '{planet} in {sign}',
    stellium: '{sign} stellium · {count} stars',
    ruler: 'Chart ruler · {planet}',
    rulerPlacement: 'The ruler dwelling in {sign}',
    mcRuler: 'Career ruler · {sign} {planet}',
  },
  angleKicker: {
    ascendant: '{planet} on the Ascendant · orb {orb}°',
    midheaven: '{planet} on the Midheaven · orb {orb}°',
  },
  rising: {
    aries:
      'People feel your straight-shooting energy the moment they meet you. Meeting eyes without hesitation, speaking first — that briskness stamps itself onto the first impression. Facing the world, your body is always half a step forward. So in any room, the role of opening things naturally comes around to you.',
    taurus:
      "Your first impression is the ease of someone who doesn't hurry. Steadiness sits in your voice and gestures, so even strangers relax beside you. Stepping into the world, you keep your own pace rather than break into a run. That unshaken air reads to people as a signal that you can be trusted.",
    gemini:
      "You're the fastest in the room at melting first-meeting awkwardness. Light questions and quick wit that air out the room are second nature. People remember you as bright and endlessly curious. That knack for opening the tap of conversation anywhere is the face you show the world.",
    cancer:
      'A soft warmth hovers over your first impression. Even without stepping forward, the gaze that checks how the other person is doing arrives first. People drop their guard strangely fast in front of you. That air of quietly warming whoever is near is the face you show the world.',
    leo: "You're someone who changes a room's temperature the moment you enter. Eyes gather naturally without any styling, and that presence stays printed on the first impression. Before the world you brighten a notch rather than shrink. People remember you as confident and warm.",
    virgo:
      "Your first impression is neat and awake. Your words and bearing are so composed that even strangers don't treat you carelessly. Quietly observing the room and noticing what's needed first is worn into you. That fine-tuned alertness is the grain of you the world sees.",
    libra:
      "You're someone who smooths the air of a first meeting. Your smile and manners come so naturally that you blend into any gathering without an edge. People remember you as polished and comfortable. That balance of consideration shows straight through the first impression.",
    scorpio:
      "Your first impression is a depth not easily read. Few words, but a density in the gaze — people can't pass you by lightly. They sense both firmness and secrecy in you at once. That quiet intensity is the face you show the world.",
    sagittarius:
      'Your first impression is wide-open air. With a frank, cheerful manner you trade laughter with people you just met. Facing the world, you see the horizon before the fence. That free atmosphere pulls people toward you.',
    capricorn:
      "Your first impression carries a maturity beyond your years. A manner that doesn't float lightly gives even strangers a sense of trust. Stepping into the world, you prove yourself by bearing rather than words. That weighty sincerity is the face the world remembers you by.",
    aquarius:
      'Your first impression has an unusual grain to it. Even inside the crowd, your gaze and thinking stand half a step aside, and people grow curious about you. Keeping your own way rather than following the current is worn into your body. That independent air is the you the world sees.',
    pisces:
      'Your first impression is a clear, dreamlike atmosphere. An unarmed gaze and way of speaking loosen the other person without their noticing. People feel their hearts soften near you for no reason they can name. That gentle air is the grain of you the world sees.',
  },
  angles: {
    sun: {
      ascendant:
        "The Sun rides on your Ascendant. It's a placement where your very being becomes the first impression — hard to hide even when you try. Wherever you go, the person you are shows distinctly, and the lead role arrives early in life. Not being ashamed to shine is how this placement is used well.",
      midheaven:
        'The Sun stands on your Midheaven. The longing to stand under your own name at the summit is carved into the bone with this placement. Career easily becomes identity, so recognition at work means far more to you than to most. The stage is already set; all you have to do is not postpone the climb.',
    },
    moon: {
      ascendant:
        "The Moon rides on your Ascendant. Feeling arrives on your face first with this placement — your heart carries to those around you even when you'd hide it. That's exactly why people open up and lean on you easily. Sensitivity isn't a weakness; it's your instrument for reading the temperature of others.",
      midheaven:
        'The Moon stands on your Midheaven. The ability to read and care for hearts becomes your public face with this placement. You show unusual strength in work that touches public feeling. Since reputation can set your heart swaying with it, draw a soft line between the work and the feelings.',
    },
    mercury: {
      ascendant:
        "Mercury rides on your Ascendant. Words and wit sit at the center of the first impression, so people remember you by conversation. Observing, asking, connecting — that power is your presence itself. Don't ration your voice. You are clearest when you speak.",
      midheaven:
        'Mercury stands on your Midheaven. Writing and speech, analysis and delivery become the axis of your career. The ability to translate the complicated into the understandable becomes your public name. Whatever you do, people will come to understand the world through your language.',
    },
    venus: {
      ascendant:
        'Venus rides on your Ascendant. An effortless likability wraps the first impression with this placement. People and beauty gather to your side on their own. That charm is a born grain, not a costume — enjoy it in comfort.',
      midheaven:
        'Venus stands on your Midheaven. The sense of beauty and harmony becomes your public face. Aesthetic feeling or the craft of relationships becomes a career weapon, and people sense class in what you produce. This is a chart that can push what it loves all the way into a profession.',
    },
    mars: {
      ascendant:
        'Mars rides on your Ascendant. Drive loads straight onto the first impression, so people feel energy from you immediately. The power to start and the courage to collide are the core of your presence. Using this placement means giving that spark a direction rather than smothering it.',
      midheaven:
        'Mars stands on your Midheaven. The force that charges head-on toward achievement is engraved on your career. On competitive stages your focus actually comes alive. Hang one great goal up high and that drive gathers into a name instead of scattering.',
    },
    jupiter: {
      ascendant:
        'Jupiter rides on your Ascendant. A generous, optimistic air wraps your first impression, and people unfold at your side. Opportunities and benefactors attach unusually well to this placement. Trust that expansive current and step toward widening your world.',
      midheaven:
        'Jupiter stands on your Midheaven. A tailwind loads onto your social growth — career doors tend to open wider for you than for most. Teaching, leading, casting vision — those seats suit you. This placement repays most when you are unafraid to draw big.',
    },
    saturn: {
      ascendant:
        "Saturn rides on your Ascendant. Prudence and responsibility are engraved on the first impression, so people don't take you lightly. That weight can feel heavy when young, but with time it converts into trust no one can shake. This chart's true prime arrives late and stays long.",
      midheaven:
        "Saturn stands on your Midheaven. Career stacks like a staircase with this placement — solid achievement suits you better than fast success. Seats of responsibility come looking for you naturally. No need to rush. This placement's reward comes slowly but arrives without fail.",
    },
    uranus: {
      ascendant:
        "Uranus rides on your Ascendant. An individuality that can't be copied flashes in your first impression. People can't predict you, and that makes them all the more curious. Don't strain to fit the mold. Being different is exactly the gift this placement gave you.",
      midheaven:
        "Uranus stands on your Midheaven. You earn your name on a road of your own rather than the fixed track. Your career may bend and leap on a rhythm unlike anyone else's. Take change as your course rather than an accident, and this placement becomes the power to run ahead of the era.",
    },
    neptune: {
      ascendant:
        'Neptune rides on your Ascendant. A dreamlike, mysterious air wraps your first impression. People readily project their own dreams and stories onto you. That absorbing sensitivity is a talent — just always keep one boundary line between you and others.',
      midheaven:
        'Neptune stands on your Midheaven. Art, healing and ideals become your public face with this placement. You can endure long in work that carries meaning more than tangible reward. The moment you translate the dream into the language of a profession, this placement begins to shine.',
    },
    pluto: {
      ascendant:
        "Pluto rides on your Ascendant. An intense presence that carries without words is engraved here. People can't treat you lightly and grow curious about the depth underneath. Focus that sharpens in crisis is this placement's power. Learn also to release what can't be controlled, and you'll be reborn deeper, as many times as it takes.",
      midheaven:
        'Pluto stands on your Midheaven. Changing things from the root becomes your public name. You get pushed naturally upward into seats that carry authority and influence. Spend that force on regeneration rather than domination, and your career returns as deep respect.',
    },
  },
  dignity: {
    domicile:
      '{planet} sits in its own home, {sign}. This force flows out in its original grain, untranslated — the asset you can trust and use most. You may set this current, which works without effort, as an axis of your life.',
    exaltation:
      "{planet} is in {sign}, the seat where it's lifted highest. The inborn force is fully awake here, giving you a better starting line than most in this area. It's ground you can return to and lean on any day you doubt yourself.",
    chartRulerNote:
      "What's more, this star rules your Ascendant — the chart's ruler — so its force becomes the keynote of your whole life.",
  },
  stellium:
    'In {sign}, {planets} stand gathered in a row. When force piles into one sign like this, its current becomes a life theme beyond personality. The grain of {keyword} is coloring several areas of your life at once.',
  core: {
    bridge:
      "To sum up: you have three layers of face. The first impression the world sees is the grain of {rising}; the center that drives your life is the wick of {sun}; and the shore where feeling rests is the waters of {moon}. Some days the three layers look like strangers, but all of them are truly you. Rather than erasing or choosing one, take out the face that fits each scene. That's how this combination is lived best.",
    bridgeNoTime:
      'To sum up: your center stands on the wick of {sun}, and your feelings rest by the waters of {moon}. Some days will and heart fall out of step, but both are truly you. Learn your birth time and the third face — the one the world sees — can be read as well.',
  },
  path: {
    bridge:
      'Squeezed into one sentence, this axis says: instead of staying in the familiar ways of {from}, move one step at a time toward {to}. Not abandoning the familiar talent — using it as fuel while building the muscles of the unfamiliar side. That is the journey.',
    houseNote: 'The stage for this growth unfolds mainly in house {n}, the realm of {theme}.',
  },
  work: {
    mc: 'Your Midheaven hangs in {sign}. It means the grain of the name you will carve into the world points toward {keyword}. Whatever the job title, people will come to remember you by that grain.',
  },
  money: {
    empty:
      'Both the 2nd and 8th houses that govern wealth stand empty. Money is not hung up as a great homework of your life — it moves gently, following the currents of other areas. This seat is light not from anxiety but from freedom.',
  },
  root: {
    ruler:
      "The star that rules your Ascendant is {planet}. Holding the key to the whole chart, this ruler dwells in {sign} — so your life's deepest motive flows along that grain.",
  },
  closing: {
    fire: "Seen whole, the fire current runs largest in your chart. What moves you, in the end, isn't calculation but the direction your heart beats. A life that doesn't let that heat go out is, for you, the most honest life.",
    earth:
      'Seen whole, the earth current runs largest in your chart. You are most at ease when making and stacking what the hand can hold. It may look slow, but what remains in the end is always the ground you tamped down.',
    air: 'Seen whole, the air current runs largest in your chart. Thinking, connecting, putting things into words — that is your oxygen. In the seat that links people and ideas, your world keeps on widening.',
    water:
      "Seen whole, the water current runs largest in your chart. The power to feel, soak in and embrace is your base. That depth is no common talent, so refill yourself often and don't let it run dry.",
    outro:
      "A chart is a map, not an answer key. No placement can cage you, and which road to take is always in your hands. May today's map be used to care for yourself a little better. ✦",
  },
  loveCta: '♡ Your destined partner and the seasons ahead · See my love reading',
}
