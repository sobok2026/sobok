// en placement, retrograde and aspect-pair readings for the natal chart.
// Loaded on demand by `./index` so only the active locale ships to the client.

import type { AspectPairReadings, PlanetReadings, RetroReadings } from './types'

export const planets: PlanetReadings = {
  sun: {
    aries: 'You shine brightest leading the charge. Challenge itself is your identity.',
    taurus: 'A slow, steady builder. Unshakeable stability is your strength.',
    gemini: 'You connect the world with curiosity and wit. You come alive learning and sharing.',
    cancer: 'You become yourself protecting those you love. A warm heart is your center.',
    leo: 'A born performer. Your bold confidence draws people in.',
    virgo: 'You refine things to completion. Care and precision are your signature.',
    libra: 'You find yourself in harmony and balance. Relationships are your stage.',
    scorpio: 'You dig deep to the essence. Intense focus is your color.',
    sagittarius: 'You feel free reaching for a wider world. Adventure is your identity.',
    capricorn: 'You quietly climb to the summit. Responsibility and grit are you.',
    aquarius: 'You picture the future with an original eye. Originality is your core.',
    pisces: 'You hold the world with feeling and imagination. Deep empathy is your light.',
  },
  moon: {
    aries: 'Your feelings are honest and fast. When your heart points, you move at once.',
    taurus: 'Calm, steady emotions. You recharge in comfort and stability.',
    gemini: 'Feelings follow your curiosity. You process the heart through words.',
    cancer: 'Deep, tender emotions. You feel safest caring and being cared for.',
    leo: 'Warm, dramatic feelings. You bloom when you feel loved.',
    virgo: 'You show love by quietly looking after things. Order settles you.',
    libra: 'Your heart eases in peaceful bonds. Conflict is especially hard.',
    scorpio: 'Deep, intense feelings. Once you give your heart, you go all the way.',
    sagittarius: 'You feel at ease when free. New experiences are your comfort.',
    capricorn: 'You steady emotions inward. You show love through reliability.',
    aquarius: 'You watch feelings from a step back. Freedom is your stability.',
    pisces: 'Tender, absorbing emotions. You feel others hearts as your own.',
  },
  mercury: {
    aries: 'Quick, direct thinking. You speak and act the moment it strikes.',
    taurus: 'Once you decide, you hold firm. Careful, practical judgment.',
    gemini: 'Ideas and words pour out. You dart wittily between topics.',
    cancer: 'Great memory, you understand through feeling. You read the room first.',
    leo: 'You express with confidence. Your stories carry force and drama.',
    virgo: 'Sharp analysis to the point. You organize down to the detail.',
    libra: 'You persuade with balanced words. You create harmony in dialogue.',
    scorpio: 'You see through hidden motives. Few words, deep insight.',
    sagittarius: 'You talk big pictures and meaning. Honest and unfiltered.',
    capricorn: 'Structured, trustworthy speech. You tie it up with a solid conclusion.',
    aquarius: 'Mold-breaking ideas spark. A fresh view captivates people.',
    pisces: 'You think in images and feelings. Rich in metaphor and imagination.',
  },
  venus: {
    aries: 'Honest, bold in love. You make the first move when drawn.',
    taurus: 'Sensual, steadfast love. You treasure comfort and touch.',
    gemini: 'Witty talk excites you. You love light, playful connection.',
    cancer: 'Deeply caring, nurturing love. You open up in secure bonds.',
    leo: 'Bright, passionate love. You give and want to receive it fully.',
    virgo: 'You show love in small acts of care. Devoted and thoughtful.',
    libra: 'Harmonious, graceful love. You savor beauty shared together.',
    scorpio: 'You fall deep and intense. You love with everything at stake.',
    sagittarius: 'Free, honest love. You are drawn to a fellow adventurer.',
    capricorn: 'Serious, lasting love. You build the bond on trust.',
    aquarius: 'Unusual, free love. You like a partner who is also a friend.',
    pisces: 'Romantic, devoted love. You dream of a bond you sink deep into.',
  },
  mars: {
    aries: 'Explosive drive. You charge head-on without hesitation.',
    taurus: 'Slow but unstoppable grit. You push through to the end.',
    gemini: 'Fast on many fronts at once. You compete with words and ideas.',
    cancer: 'You grow strong protecting what matters. Emotion is your drive.',
    leo: 'You take on challenges boldly. You gain power in the spotlight.',
    virgo: 'You push forward precisely and thoroughly. You prove it with skill.',
    libra: 'Gentle, yet persistent. You move through relationships.',
    scorpio: 'Quiet but fierce persistence. Once set, you see it through.',
    sagittarius: 'You challenge and expand freely. Freedom is your fuel.',
    capricorn: 'You aim for the top strategically. Patience is your best weapon.',
    aquarius: 'You break through in your own way. You advance by changing the rules.',
    pisces: 'You move quietly, like flowing water. You steer by intuition.',
  },
  jupiter: {
    aries: 'Luck follows when you dare. Pioneering is your growth.',
    taurus: 'Steadiness and stability bring abundance. Trust your senses to grow.',
    gemini: 'Learning and people widen your chances. Curiosity is your asset.',
    cancer: 'Blessing returns when you give and care. Home and warmth are your strength.',
    leo: 'Fortune opens when you step up boldly. Confidence is your luck.',
    virgo: 'Diligent refining grows the harvest. Service brings you blessings.',
    libra: 'Chances grow within good relationships. Cooperation is your key.',
    scorpio: 'You gain big by digging deep. You turn crisis into chance.',
    sagittarius: 'Luck grows toward a wider world. Ideals and adventure are your blessing.',
    capricorn: 'Responsibility and effort are richly rewarded. Time takes your side.',
    aquarius: 'New attempts open doors. Being different is your opportunity.',
    pisces: 'Abundance flows when you give and trust. Imagination widens reality.',
  },
  saturn: {
    aries: 'You grow strong mastering impulse. This is where you learn patience.',
    taurus: 'Slow but solid building. Consistency wins in the end.',
    gemini: 'You take responsibility for words and learning. You mature through depth.',
    cancer: 'You guard your feelings and home yourself. You become a firm shelter.',
    leo: 'You learn real confidence through humility. You shine through effort.',
    virgo: 'Strictness toward perfection. Diligence builds trust.',
    libra: 'You learn responsibility within relationships. Fairness keeps balance.',
    scorpio: 'Deep control and restraint. You harden by enduring crisis.',
    sagittarius: 'You take responsibility for your beliefs. You ground learning in reality.',
    capricorn: 'A competitor strict with yourself. You harden as time passes.',
    aquarius: 'Grit that turns ideals into reality. You grow reshaping structures.',
    pisces: 'You find your center within the haze. You add responsibility to devotion.',
  },
  uranus: {
    aries: 'A pioneer breaking molds and opening new paths. Freedom is your innovation.',
    taurus: 'You create change within the familiar. You seek grounded innovation.',
    gemini: 'You flip the board with flashing ideas. Freedom of thought sets you apart.',
    cancer: 'You find new ways of feeling and home. You carry an unusual warmth.',
    leo: 'You shine with original individuality. You build a stage all your own.',
    virgo: 'You innovate how work is done. A practical inventor.',
    libra: 'You experiment with new forms of bond and balance. You dream of free harmony.',
    scorpio: 'Change that shakes the foundations. You spark revolution from the depths.',
    sagittarius: 'Free thought crossing borders. You widen tomorrow horizon.',
    capricorn: 'You overturn old structures. A reformer rebuilding the system.',
    aquarius: 'A vision ahead of its time. Originality is your essence.',
    pisces: 'You dissolve borders with imagination and inspiration. You open new dreams.',
  },
  neptune: {
    aries: 'You dive passionately toward the ideal. You turn dreams into action.',
    taurus: 'You shape beauty through the senses. You find romance in the real.',
    gemini: 'Imagination and language blend. You make magic with stories.',
    cancer: 'Deep empathy and care. You embrace the world with your heart.',
    leo: 'You shine with creative inspiration. Your heart flows into art and expression.',
    virgo: 'You help and heal with delicate devotion. You melt ideals into the real.',
    libra: 'You dream of harmony and beauty. You picture an ideal love.',
    scorpio: 'You are enchanted by mystery and depth. You feel the unseen.',
    sagittarius: 'You chase greater meaning and truth. You enjoy spiritual adventure.',
    capricorn: 'You realize ideals through structure. You give dreams a real frame.',
    aquarius: 'You dream an ideal for everyone. Compassion widens your imagination.',
    pisces: 'Imagination and spirit reach far. You hold a boundless empathy.',
  },
  pluto: {
    aries: 'You reinvent yourself with fierce will. You grow stronger in crisis.',
    taurus: 'You transform values and security at the root. A deep-rooted change.',
    gemini: 'You flip the board with the power of thought. You dig for the truth.',
    cancer: 'You heal feelings and roots deeply. You transform family wounds.',
    leo: 'You break the self and rebuild it. You carry an intense presence.',
    virgo: 'You transform daily life and body at the root. You purify and rebuild.',
    libra: 'You transform relationships at the root. You rework the balance of power.',
    scorpio: 'You are fully reborn from the depths. Your insight runs intense.',
    sagittarius: 'You shake beliefs to seek truth. You rebuild your worldview.',
    capricorn: 'You transform structure and power at the root. Crisis makes you stronger.',
    aquarius: 'You topple old systems. You lead collective transformation.',
    pisces: 'You transform the unseen. You purify the unconscious deeply.',
  },
  northNode: {
    aries:
      'Your path: learning to lead and find your own courage. Your soul grows when you take the first step in your own name instead of leaning on others.',
    taurus:
      'Learning to build steady, lasting value of your own. You settle when you let go of the rush and savor what you already have.',
    gemini:
      'Learning to stay curious, learn, and connect. Your world widens when you listen to many stories instead of clinging to one answer.',
    cancer:
      'Learning to open your heart, nurture, and put down roots. You find ease when you feel your emotions fully rather than proving yourself through results.',
    leo: 'Growing the courage to shine and express yourself. Real joy comes when you step into the spotlight instead of hiding behind others.',
    virgo:
      "Learning to refine step by step and stay grounded. Life falls into order when you do today's task with care rather than drifting in vague ideals.",
    libra:
      'Learning togetherness, harmony, and real partnership. You go further when you balance with others instead of insisting on your own way.',
    scorpio:
      'Learning to dive deep and face true transformation. You are reborn when you dig into what scares you instead of settling for comfort.',
    sagittarius:
      'Setting out for a wider world and beliefs of your own. The path opens when you ask what things mean for yourself rather than following others.',
    capricorn:
      'Growing into responsibility and building your own achievement. You grow solid when you carry your own weight instead of leaning for support.',
    aquarius:
      'Moving beyond yourself toward community and the future. You find freedom when you let go of seeking approval and reach out for everyone.',
    pisces:
      'Learning to let go, trust, and flow. Peace arrives when you empty your heart instead of trying to control everything.',
  },
  southNode: {
    aries: 'You are used to charging in alone. Keep that courage, but now learn to look beside you and move together.',
    taurus:
      'You are comfortable staying safe and familiar. Keep that steadiness, but open your heart to change little by little.',
    gemini:
      'You are used to skimming lightly with words and info. Keep the wit, but build the grit to dig deep into one thing.',
    cancer:
      'You are used to leaning and being protected. Keep that tenderness, but slowly grow the strength to stand on your own.',
    leo: 'You feel safe only in the spotlight. Keep your shine, but meet the you that is enough offstage too.',
    virgo:
      'You habitually perfect and worry over everything. Treasure that care, but learn the ease of trusting and letting go.',
    libra:
      'You are used to accommodating others. Keep that thoughtfulness, but practice voicing your own truth clearly.',
    scorpio:
      'You are used to control and deep entanglement. Keep that intensity, but sometimes loosen your grip and let go lightly.',
    sagittarius:
      'You are comfortable wandering free. Keep the wide view, but learn the stability of putting down roots.',
    capricorn:
      'You are used to proving yourself through achievement and control. Keep that resolve, but tend to your heart first.',
    aquarius: 'You are used to observing from a distance. Keep that clarity, but now step close and share your heart.',
    pisces:
      'You are used to drifting and escaping. Keep that softness, but grow the strength to plant both feet in reality.',
  },
  fortune: {
    aries:
      'Luck opens when you bravely start and take on challenges. Joy and blessing follow when you step up before anyone else.',
    taurus:
      'Joy grows as you build slowly and savor the senses. Blessing flows in when you stop rushing and relish the now.',
    gemini:
      'Fortune follows when you learn, share, and connect. Luck opens as you link people and stories through your curiosity.',
    cancer: 'Blessing flows within caring, nurturing bonds. Joy returns when you share your heart and build warmth.',
    leo: 'Luck shines when you show yourself boldly and enjoy it. Blessing opens bright when you express freely and feel loved.',
    virgo: 'Joy and blessing come as you refine and help with care. Luck stacks up as you do small things faithfully.',
    libra: 'Fortune grows in good relationships and harmony. Blessing blooms when you savor beauty shared with others.',
    scorpio:
      'Luck breaks open when you immerse deeply and transform. You meet unexpected blessings when you dig in without fear.',
    sagittarius:
      'Joy and luck grow as you head for a wider world. Fortune comes to meet you when you reach toward the unfamiliar.',
    capricorn:
      'Blessing returns as you diligently build. Luck backs you up firmly when you quietly carry your responsibilities.',
    aquarius:
      'Luck opens on an unusual path among good people. Blessing finds you when you trust your own way forward.',
    pisces:
      'Blessing flows when you give, imagine, and trust the flow. Unexpected luck seeps in when you empty your heart and give.',
  },
}

export const retro: RetroReadings = {
  mercury: {
    aries:
      'You chew over your quick thoughts one more time inside. Words land harder when you revisit them instead of blurting them out.',
    taurus:
      'Even a settled thought gets quietly re-checked within. The more you mull it over unhurried, the firmer your judgment.',
    gemini: 'Ideas circle inside more than out. You may say less, but your trains of thought run deeper and finer.',
    cancer:
      'You replay feelings inwardly for a long time. You reach for your truth only after chewing it over, not right away.',
    leo: 'You polish your words inside before you speak. They shine when they carry sincerity over flair.',
    virgo:
      'Your analysis burrows inward. You perfect it in your head first, then lay it out rather than sorting aloud.',
    libra:
      'You weigh decisions again and again within. Balance comes when you question your own standard over others opinions.',
    scorpio: 'Insight sinks to a deeper place. You dig for hidden meaning silently rather than speaking it.',
    sagittarius:
      'You mull big ideas inside rather than broadcasting them. Real conviction forms when you ask what they mean to you.',
    capricorn:
      'You verify your systems to yourself many times over. Trust builds when you frame it by your own logic, not others.',
    aquarius: 'Clever ideas simmer quietly inside. You push your own logic to the end even when it looks different.',
    pisces: 'Thought sinks inward as imagery. You linger in feeling and grow the image before putting it into words.',
  },
  venus: {
    aries: 'You confirm attraction inside before showing it. You ask whether it is real before making the first move.',
    taurus:
      'You grow affection slowly, savoring it within. Drawn again to the familiar, you rediscover your own taste.',
    gemini:
      'You revisit a flutter inside rather than letting it pass lightly. You confirm the heart behind the words, slowly.',
    cancer: 'You hold tenderness deep inside. You open only when you feel safe, not the instant you feel it.',
    leo: 'You nurture your true feelings quietly over grand display. You cherish yourself first before seeking to be loved.',
    virgo:
      'You refine care within rather than showing it. Love deepens when you accept things as they are over chasing perfection.',
    libra: 'You question the balance of a bond inside. You confirm what you truly want before adjusting to others.',
    scorpio: 'You hide intense affection in a deep place. You do not show it easily, but once held it burns long.',
    sagittarius: 'You rethink free-spirited love within. You define the bond you want yourself over chasing novelty.',
    capricorn: 'You measure serious feeling inwardly for a long time. You do not open until trust is built.',
    aquarius: 'You quietly enjoy your unusual taste inside. You build your own unconventional way of loving.',
    pisces:
      'You paint romance deep within. Love ripens when you see the real heart instead of falling for the fantasy.',
  },
  mars: {
    aries:
      'Force builds inward rather than bursting out. You bide your time and move at the decisive moment over charging in.',
    taurus: 'You firm up drive slowly within. The strength you bide finally pushes through without rushing.',
    gemini: 'Energy circles inside in many strands. You move in your head first before stepping out.',
    cancer:
      'You digest emotional force inwardly. You bide quietly to protect what matters rather than reacting at once.',
    leo: 'You steady your fiery spirit inside. Real power comes when you own it yourself over showing it off.',
    virgo:
      'You check the plan in your head again and again. You move only after preparing fully rather than rushing out.',
    libra: 'You tune your force within rather than clashing. You weigh the method a long time before stepping up.',
    scorpio: 'Tenacity sinks to a deeper place. Quiet on the surface, you keep sharpening it to the end inside.',
    sagittarius: 'You question your reaching drive inside. You set your own direction before expanding outward.',
    capricorn: 'You refine strategy inwardly for a long time. Unhurried, you bide the moment as you aim for the top.',
    aquarius: 'An unusual drive simmers quietly inside. You push your rule-changing force at your own pace.',
    pisces:
      'Your force feels for direction within. You move quietly when intuition ripens rather than stepping straight out.',
  },
  jupiter: {
    aries: 'You grow opportunity inside over seeking it out there. Luck grows when you set your own reason to dare.',
    taurus: 'You stack abundance inwardly, unhurried. Trusting your senses, you widen by your own standard.',
    gemini:
      'You deepen learning inward rather than spreading it out. Wisdom grows when you revisit what you know yourself.',
    cancer:
      'You grow blessing within rather than seeking it outside. You feel full when you fill the joy of giving yourself.',
    leo: 'You firm up confidence inside over having it confirmed by others. Real luck opens when you own it yourself.',
    virgo:
      'You question the meaning of diligence inwardly. The harvest grows when you refine for yourself, not for others.',
    libra: 'You find opportunity within, not just in relationships. You set your own direction before cooperating.',
    scorpio: 'You turn your digging force inward. You gain big when you mine the meaning of crisis yourself.',
    sagittarius:
      'You explore a wider world inside over outside. You build your own truth over following others beliefs.',
    capricorn:
      'You firm up reward within over expecting it out there. The responsibility you set yourself becomes your blessing.',
    aquarius: 'You quietly turn new attempts over inside. Doors open when you set the meaning of your own path.',
    pisces: 'You paint abundance within through imagination. You fill your own faith first before giving outward.',
  },
  saturn: {
    aries:
      'You master impulse yourself, not by others rule. You build strength by your own inner principle over outer rules.',
    taurus: 'You stack solidity inwardly over a long time. You learn to stay unshaken without needing approval.',
    gemini:
      'You question the duty of words and learning inside. You seek to deepen yourself over striving for approval.',
    cancer:
      'You bear the weight of protecting inwardly. You become a firm shelter yourself rather than leaning on others.',
    leo: 'You build confidence within over outside applause. You learn to affirm yourself through humility.',
    virgo:
      'You aim the standard of perfection at yourself. You firm up diligence by your own measure over others eyes.',
    libra: 'You retrace the duty of relationships inside. You set your own fairness over straining to fit in.',
    scorpio: 'You turn the force of restraint deeper. You learn to endure crisis by mastering yourself.',
    sagittarius: 'You question the duty of belief inside. You grow solid on faith you have tested, not others truth.',
    capricorn:
      'You grow even stricter with yourself. You truly harden when you build your own principle over outer achievement.',
    aquarius: 'You forge the force to ground ideals within. You build unusual structure by your own principle.',
    pisces:
      'You hold your center within the haze inwardly. You bear the duty of devotion yourself over leaning outward.',
  },
  uranus: {
    aries: 'Mold-breaking force simmers inside. You quietly redesign your own freedom over acting out.',
    taurus: 'You turn change over inside, unhurried. Within the familiar, you slowly craft your own innovation.',
    gemini: 'Flashes spread inside more than out. You dig your own idea to the end even when it looks different.',
    cancer:
      'You experiment with new ways of feeling inwardly. You quietly change old frames within, not on the surface.',
    leo: 'You firm up individuality inside over showing it. You shine when you enjoy your difference yourself first.',
    virgo: 'You overhaul how you work in your head. You rebuild by your own efficiency over outer rules.',
    libra: 'You picture new forms of bond inside. You define your own freedom first before experimenting outward.',
    scorpio: 'You turn foundation-shaking force to a deeper place. Quietly, you spark revolution from within.',
    sagittarius: 'You widen border-crossing thought inside. You draw your own image of the future over outer trends.',
    capricorn: 'You tear down old structures inside first. You build your own principle over the outer system.',
    aquarius:
      'A vision ahead of its time grows quietly inside. You push originality yourself over competing with others.',
    pisces:
      'You dissolve borders within through imagination. You grow a new inner dream first before unfolding it out.',
  },
  neptune: {
    aries:
      'You forge the ideal within over chasing it out there. Clearing away illusion, you recognize the dream you truly want.',
    taurus:
      'You find beauty in your heart over the senses outside. You draw real comfort from within over surface romance.',
    gemini:
      'You grow imagination inside over putting it into words. You savor the story yourself before unfolding it out.',
    cancer:
      'You hold empathy deep within. You guard your own emotional boundary first over being swept by others hearts.',
    leo: 'You quietly burn creative inspiration inside. You immerse in your own expression over striving for recognition.',
    virgo:
      'You question the meaning of devotion inwardly. You refine your ideal into reality first before saving others.',
    libra: 'You picture an ideal love within. You recognize real harmony yourself over leaning on fantasy.',
    scorpio: 'You sink into mystery at a deeper place. You face the unseen alone within and gain insight.',
    sagittarius:
      'You ask great truth inside over seeking it out there. Clearing others beliefs, you find your own meaning.',
    capricorn:
      'You forge the force to build ideals into structure within. You firm up the inner frame over the surface dream.',
    aquarius: 'You quietly hold an ideal for everyone inside. You build your own faith first over crying it out loud.',
    pisces: 'Imagination and spirit reach deep inward. Real inspiration sharpens when you clear away outer illusion.',
  },
  pluto: {
    aries: 'You turn the force of rebirth inward. You quietly rebuild yourself over clashing with the outside.',
    taurus: 'You change values from the root within. You question your own true worth over surface security.',
    gemini: 'The force to mine truth deepens inside. You dig for the answer yourself over flipping it with words.',
    cancer: 'You face emotional wounds inwardly. You heal deeply alone and are reborn over showing it outside.',
    leo: 'You undergo breaking and rebuilding the self inside. You quietly remold yourself over flaunting your presence.',
    virgo:
      'You overhaul daily life and body from within. You purify your own habits at the root over changing the surface.',
    libra:
      'You rework the force of relationships inside. You lay the root of balance again yourself over clashing outward.',
    scorpio: 'You undergo full rebirth in a deeper place. Unseen by others, you change yourself from the root.',
    sagittarius: 'You shake belief from within. You rebuild your worldview yourself over chasing outer truth.',
    capricorn:
      'You question structure and power inside. You change your own inner force at the root over the outer seat.',
    aquarius: 'You topple old systems in your heart first. You build your own conviction over outer upheaval.',
    pisces: 'You purify the unconscious deep within. You face unseen wounds alone and are reborn from the root.',
  },
}

export const aspects: AspectPairReadings = {
  'sun-moon': {
    conjunction:
      'Your outer self and inner heart point the same way. What you want and what you feel move naturally as one.',
    flow: 'Will and emotion fall into step easily. Life feels at ease, so you live as yourself without strain.',
    friction:
      'What you want and what your heart needs keep clashing. You find your real self in the space between them.',
  },
  'sun-mercury': {
    conjunction: 'Your thoughts are your very self. Words and identity are one, so your expression rings true.',
    flow: 'You know how to explain yourself clearly. Thought and presence connect with ease.',
    friction:
      'A gap opens between your ideas and who you really are. It helps to keep words from running ahead of you.',
  },
  'sun-venus': {
    conjunction: 'Charm and identity are one. What you love says who you are.',
    flow: 'You come across as lovable to others. Taste and confidence blend softly.',
    friction:
      'The wish to be loved rubs against being true to yourself. You learn to keep yourself rather than only please.',
  },
  'sun-mars': {
    conjunction: 'Will and drive burst out as one. When you want something, you push straight for it.',
    flow: 'Courage and confidence flow naturally. Challenge itself becomes your energy.',
    friction: 'Desire and force keep overheating. The more you master the rush, the stronger you grow.',
  },
  'sun-jupiter': {
    conjunction: 'Confidence and optimism are one. You dream big and move wide.',
    flow: 'Opportunity follows you naturally. Positivity is the force that draws luck in.',
    friction: 'Confidence can spill into overreach. Aim it in one direction and it grows.',
  },
  'sun-saturn': {
    conjunction: 'Self and responsibility fuse into one. It weighs on you, but it makes you solid and lasting.',
    flow: 'Effort and patience turn naturally into results. Steadiness comes back to you as trust.',
    friction: 'The self that wants freedom is pressed by duty. Enduring that weight is how you truly grow up.',
  },
  'sun-uranus': {
    conjunction: 'Being different is your identity. You are most yourself when nothing boxes you in.',
    flow: 'Individuality and freedom shine naturally. New attempts suit you well.',
    friction: 'You waver between wanting to stand out and craving stability. That tension breeds innovation.',
  },
  'sun-neptune': {
    conjunction: 'Your self is tinted with dream and feeling. Artistic, but take care not to lose yourself.',
    flow: 'Imagination and self connect softly. You picture ideals with ease.',
    friction: 'Sometimes who you are blurs. You steady your center by keeping your feet on the ground.',
  },
  'sun-pluto': {
    conjunction: 'An intense presence is simply you. Every crisis reinvents you anew.',
    flow: 'Deep will turns naturally into power. You do not fear change.',
    friction: 'The urge to control clashes with the self. You grow stronger when you let power go.',
  },
  'moon-mercury': {
    conjunction: 'Feeling and thought are one. You put your heart into words with ease.',
    flow: 'Emotion and reason connect well. You express feelings honestly and comfortably.',
    friction: 'Head and heart keep pulling apart. Sorting them out keeps you from being swept away.',
  },
  'moon-venus': {
    conjunction: 'Tenderness and affection are one. You cherish warmly and express love sweetly.',
    flow: 'Heart and love flow softly. You feel at ease in relationships.',
    friction: 'The wish to be loved trembles sensitively. Filling yourself first brings ease.',
  },
  'moon-mars': {
    conjunction: 'Emotion is action itself. When your heart moves, you react with heat.',
    flow: 'Feeling and courage connect naturally. You express what you want honestly.',
    friction: 'Emotion can flare up hot. Master that heat and it becomes drive.',
  },
  'moon-jupiter': {
    conjunction: 'Your heart is wide and warm. You are happiest when you give.',
    flow: 'Emotion flows generously. Optimism draws people to you.',
    friction: 'Feelings can swell too big. Adjust their scale and you find ease.',
  },
  'moon-saturn': {
    conjunction: 'You press your feelings firmly inward. You may seem blunt, but inside you run deep and earnest.',
    flow: 'You know how to steady your emotions calmly. You show love through reliability.',
    friction:
      'Opening your heart is hard, and loneliness can creep in. You soothe yourself and lower the wall bit by bit.',
  },
  'moon-uranus': {
    conjunction: 'Your feelings are free and unpredictable. You are at ease when nothing ties you down.',
    flow: 'You air out your emotions lightly. An independent heart is your charm.',
    friction: 'Moods can swing suddenly. You seek balance between stability and freedom.',
  },
  'moon-neptune': {
    conjunction: 'Your heart overflows with imagination and empathy. You feel others hearts as if they seep into you.',
    flow: 'Feeling and intuition flow softly. You have a gift for art and comfort.',
    friction: 'Emotion and reality blur together. You protect yourself by keeping boundaries.',
  },
  'moon-pluto': {
    conjunction: 'Your feelings run deep and intense. Once you give your heart, you dig in to the end.',
    flow: 'You turn deep emotion into strength. Your heart stays firm even in crisis.',
    friction: 'Feelings can tip into obsession. You grow free when you learn to let go.',
  },
  'mercury-venus': {
    conjunction: 'Words and grace are one. You express softly and charmingly.',
    flow: 'Thought and taste pair elegantly. Your conversation has style.',
    friction: 'Words and feelings can drift slightly apart. You find the balance of honesty and care.',
  },
  'mercury-mars': {
    conjunction: 'Thought becomes word and action at once. You are quick and sharp.',
    flow: 'Judgment and action click. Decisions come fast and clean.',
    friction: 'Words can turn hasty and sharp. Pause a beat and your persuasion grows.',
  },
  'mercury-jupiter': {
    conjunction: 'Your thinking is big and broad. You love to learn and to share.',
    flow: 'Big picture and detail blend well. You carry an optimistic wisdom.',
    friction: 'Words can turn boastful or scattered. Focus on the core and you shine.',
  },
  'mercury-saturn': {
    conjunction: 'Your thinking is careful and structured. Your words carry weight and responsibility.',
    flow: 'Focus and logic are solid. You dig deep, steadily.',
    friction: 'Your mind keeps censoring itself. The more you trust yourself, the firmer your words.',
  },
  'mercury-uranus': {
    conjunction: 'Ideas spark like lightning. Unusual insight flashes through.',
    flow: 'Clever ideas come easily. A fast, original mind.',
    friction: 'Thought races ahead and turns impatient. Slow the pace and your genius comes alive.',
  },
  'mercury-neptune': {
    conjunction: 'Thought flows in images and imagination. Poetic and intuitive.',
    flow: 'Imagination and expression connect softly. You have a gift for metaphor.',
    friction: 'Thinking can grow foggy and muddled. Check the facts and steady your center.',
  },
  'mercury-pluto': {
    conjunction: 'Your thinking digs deep. You see through to hidden truth.',
    flow: 'Focused insight flows naturally. There is power in your inquiry.',
    friction: 'Your mind can fixate on one spot. The more flexible you get, the sharper your insight.',
  },
  'venus-mars': {
    conjunction: 'Affection and passion blaze as one. When drawn, you approach with heat.',
    flow: 'Love and desire flow in harmony. Charm and drive shine together.',
    friction: 'What you want and how you pursue it fall out of step. You learn love through the push and pull.',
  },
  'venus-jupiter': {
    conjunction: 'Both love and pleasure run abundant. Generous and romantic.',
    flow: 'Affection and luck flow together. You draw people and beauty in.',
    friction: 'Love and spending can both go overboard. You shine brighter through restraint.',
  },
  'venus-saturn': {
    conjunction:
      'You are serious and lasting in love. You do not open easily, but once you give your heart it does not change.',
    flow: 'You build bonds responsibly. Trust is the root of your love.',
    friction: 'You shrink back or feel distance before love. You need practice in opening your heart.',
  },
  'venus-uranus': {
    conjunction: 'Love is free and electric. You are drawn to bonds that do not bind you.',
    flow: 'Excitement and independence pair well. You have a fresh charm.',
    friction: 'Your heart swings between love and freedom. You seek the balance of commitment and space.',
  },
  'venus-neptune': {
    conjunction: 'Love is romantic as a dream. Devoted, but take care not to fall for an illusion.',
    flow: 'Feeling and love flow softly. You carry an artistic charm.',
    friction: 'The ideal and the real partner keep mismatching. Love deepens when you see things as they are.',
  },
  'venus-pluto': {
    conjunction: 'Love runs deep and intense. You want a bond you can stake everything on.',
    flow: 'Deep affection turns naturally into strength. You immerse yourself with your whole heart.',
    friction: 'Love can slide into obsession or jealousy. The bond revives when you let go.',
  },
  'mars-jupiter': {
    conjunction: 'Drive and boldness are one. You take on big things and push hard.',
    flow: 'Courage and opportunity flow together. The more you dare, the more luck grows.',
    friction: 'Zeal can overflow into overdoing it. Pace your strength and you go further.',
  },
  'mars-saturn': {
    conjunction: 'Force and patience fuse. Slow but with the grit to push through to the end.',
    flow: 'Strategy and action mesh steadily. You reach goals with patience.',
    friction:
      'You want to act but keep hitting walls — a stifling feeling. Cross that wall and you build real strength.',
  },
  'mars-uranus': {
    conjunction: 'Your action is lightning-fast and bold. A mold-breaking drive.',
    flow: 'Quick reflexes and originality pair well. You respond fast in a crisis.',
    friction: 'Impulses can burst out suddenly. Learn the brake and your power comes alive.',
  },
  'mars-neptune': {
    conjunction: 'Action follows feeling and ideal. You move by inspiration.',
    flow: 'Intuition and action connect softly. You move quietly, as if flowing.',
    friction: 'Drive can lose its way and go hazy. Sharpen the goal and your strength gathers.',
  },
  'mars-pluto': {
    conjunction: 'Your will is fearsomely intense. Once set, you see it to the end.',
    flow: 'Deep tenacity turns naturally into strength. You grow stronger in crisis.',
    friction: 'You can slide into power struggles or extremes. Master that energy and you become unstoppable.',
  },
  'jupiter-saturn': {
    conjunction: 'Dream and reality meet in one place. You picture big yet build it step by step.',
    flow: 'Optimism and patience find balance. You grow steadily.',
    friction: 'The urge to expand clashes with the urge to tighten. Between them you find a wise pace.',
  },
  'jupiter-uranus': {
    conjunction: 'Luck and innovation are one. You are strong with unexpected chances.',
    flow: 'Freedom and opportunity flow together. Flashes of insight turn into luck.',
    friction: 'Sudden change can leave you giddy. Use freedom wisely and it opens wide.',
  },
  'jupiter-neptune': {
    conjunction: 'Ideal and faith swell as one. You hold a big, beautiful dream.',
    flow: 'Imagination and generosity flow softly. A spiritual abundance is yours.',
    friction: 'Dreams can run too big and miss the real. Anchor your ideals to reality.',
  },
  'jupiter-pluto': {
    conjunction: 'Great purpose and strong power are one. You have the ambition to change the whole board.',
    flow: 'Deep conviction becomes your engine of growth. You turn crisis into growth.',
    friction: 'Ambition and control can overheat. The larger your power, the more humility you need.',
  },
  'saturn-uranus': {
    conjunction:
      'The force that preserves and the force that changes sit together. You rebuild old frames on solid ground.',
    flow: 'Stability and innovation find balance. A down-to-earth reformer.',
    friction: 'Old and new pull taut against each other. That tension makes real change.',
  },
  'saturn-neptune': {
    conjunction: 'Dream and reality are one body. You shape ideals into structure.',
    flow: 'Imagination and responsibility meet softly. You realize dreams step by step.',
    friction: 'You waver and tire between ideal and reality. Bridging that gap makes you solid.',
  },
  'saturn-pluto': {
    conjunction: 'The power to endure and the power to transform are one. You rebuild from the very bottom.',
    flow: 'Grit and insight mesh deeply. You endure crisis and rebuild.',
    friction: 'Pressure runs high between tearing down and holding on. That trial tempers you at the root.',
  },
  'uranus-neptune': {
    conjunction: 'Revolution and imagination flow as one. A generation holding the dream of a new age.',
    flow: 'Freedom and inspiration connect softly. You carry ideals into reality.',
    friction: 'You can waver between innovation and illusion. Sharpen your direction and your strength gathers.',
  },
  'uranus-pluto': {
    conjunction: 'The force to overturn and the force to rebuild are one. A generation that shakes things to the root.',
    flow: 'Change and insight mesh strongly. You carry the energy to change an era.',
    friction: 'Radical and resistant forces clash fiercely. That energy gives birth to great upheaval.',
  },
  'neptune-pluto': {
    conjunction: 'Imagination and depth are one body. A generation that transforms the unseen.',
    flow: 'Spirit and insight flow softly. You draw up deep meaning.',
    friction: 'You can grow confused between fantasy and the abyss. Hold your center and master the depths.',
  },
}
