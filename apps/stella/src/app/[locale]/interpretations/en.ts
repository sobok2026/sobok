import type { AspectPairReadings, PlanetReadings, RetroReadings } from './types'

export const planets: PlanetReadings = {
  sun: {
    aries:
      "While everyone else is still weighing their options, you've already taken the first step. You'd rather move and figure it out on the way than wait for the perfect plan — and the truth is, the world is always waiting for someone willing to go first. Your fire runs ahead of your own heart sometimes, sure. But that spark? No one else can fake it.",
    taurus:
      "You don't do rushed. While others scramble for shortcuts, you build one solid step at a time — and what you build doesn't wash away when the wind picks up. People mistake your pace for slowness, but they're wrong: you're simply making things that last. That unshakeable steadiness is exactly why the world learns, in the end, to trust you.",
    gemini:
      "Your mind always has a dozen tabs open at once. You can meet a stranger and be old friends within five minutes, and that bright curiosity is a bridge between worlds that would never otherwise touch. Yes, your attention scatters sometimes — but that lightness is your freedom. It's what keeps anything from pinning you down.",
    cancer:
      "One look from someone you love can change your whole day. You come home to yourself when you're holding and protecting the people who matter, and your warmth becomes the place tired hearts return to. That's not softness — that's depth, and it's rarer than you think.",
    leo: "The moment you walk in, the room quietly turns toward you. You don't have to try to shine; people are already watching. But that presence isn't a trophy — it's a responsibility. The brighter you burn, the more everyone standing near you lights up too.",
    virgo:
      "You catch the one small thing that's off — the detail everyone else walks right past. Those sharp eyes and careful hands turn rough drafts into finished things, quietly, without applause. On the days you're hardest on yourself, remember: that impossible standard is just love wearing a stricter face.",
    libra:
      "You feel the tension in a room before a single word is spoken, and one sentence from you can loosen the tightest knot. You come alive alongside other people, and that gift for balance is one most will never have. Just don't lose your own voice while keeping everyone else's in tune — it deserves the front row too.",
    scorpio:
      "Surfaces have never been enough for you. Where others stop, you dig one layer deeper and won't quit until you reach the truth of a thing — and that intensity is exactly what makes you unforgettable. You can look straight at what most people are afraid to face. That depth isn't something to soften; it's your power.",
    sagittarius:
      "Your eyes are always on the horizon, never the wall in front of you. Familiar fences make you restless, but the moment you're on an unknown road, you feel completely alive. That free spirit and stubborn hope will carry you somewhere you can't picture yet — so when something calls you, don't put it off too long.",
    capricorn:
      "You climb without making a sound. Where others sit down to rest, you take one more step, and then another — and time, in the end, is always on your side. The weight you carry can feel heavy, no doubt. But it isn't slowing you down; it's proof of how close to the summit you already are.",
    aquarius:
      "You're the one asking 'why?' about the things everyone else takes for granted. You see a future that hasn't arrived yet and walk half a step ahead of it — and though it looks strange now, the world tends to end up following the path you drew. Some days no one gets it. Don't shrink for them; that different eye of yours is the whole point.",
    pisces:
      "You feel things long before you could put them into words. Someone else's sorrow seeps in as if it were your own, and that deep empathy quietly makes the world a gentler place. That tenderness isn't weakness — it's a light almost no one else can reach. Let it stay soft, but build yourself a shore to stand on too.",
  },
  moon: {
    aries:
      "Your feelings arrive like lightning — instant, unmissable, written all over your face before you can hide them. When you're happy you glow, when you're hurt everyone knows, and there's no filter between your heart and the world. Some call it too much. But refusing to bury what you feel is its own kind of honesty — it's what keeps you fully, vividly alive.",
    taurus:
      "Your heart is a deep, still lake that doesn't ripple easily. A familiar scent, a warm touch, the same seat at the same table — that's where you finally exhale. Sudden change unsettles you more than you let on, but give it time and you always find your footing again. That steadiness is exactly why people stay: your side is the softest place they know.",
    gemini:
      "Your feelings only untangle once you say them out loud — on a heavy day, one good conversation lifts the whole weight like magic. Your moods travel, rarely stuck in one place for long, and sometimes that lightness makes you doubt yourself. But it's exactly what keeps you from being crushed by anything. So when your heart knots up, don't sit alone with it; talk it out.",
    cancer:
      "Your heart waxes and wanes like the moon it's named for. You feel safest holding someone and being held, and you catch the smallest shift in a loved one's face before they say a word. You carry hurt a long time, too — a careless remark can ache in you for days. But that tenderness isn't a weakness; it's the shelter tired hearts keep returning to.",
    leo: "Your feelings run warm and a little dramatic. When you feel loved your whole face lights up, and when you give your heart, you pour in everything you've got — so a cooling of attention can leave you unusually lonely. But that big heart isn't a hunger for the spotlight; it's simply that you refuse to be shy about love. Feel it out loud. That's how you're built.",
    virgo:
      "You don't announce your feelings — you tend to them, quietly. You remember what someone likes and slip it to them right when they need it; that's your love language. When your mind gets loud, you steady yourself by putting things in order. Just don't tend everyone else so carefully that you forget your own heart — that quiet care deserves to come home to you too.",
    libra:
      "Your heart only breathes easy in a peaceful bond. Tension and cold silence are almost unbearable, so you'll do whatever it takes to smooth the air — but somewhere in all that peacekeeping, your own feelings keep sliding to the back of the line. A real bond doesn't ask you to erase yourself. The calm you create is a gift, and you're allowed to stand inside it too.",
    scorpio:
      "There's no shallow water in you. When you give your heart it sinks all the way to the bottom, and a betrayal can ache long after everyone assumes you've moved on. On the surface you look composed while a whole storm turns underneath. But that depth — the willingness to feel everything at full volume — is exactly what makes you unforgettable to anyone you let in.",
    sagittarius:
      "Your heart feels most at home when it's free. You can't stand the sense of being caged, and a single new experience can heal you more than any comforting words. That optimism can look light, even careless — but it's really your survival instinct, the way you find a sliver of light in any dark. On the heavy days, give yourself permission to roam a little.",
    capricorn:
      "You learned early how to hold your feelings steady. You don't crumble easily, and instead of saying it out loud, you show love by simply staying — reliable, present, unshakeable. People mistake that for cool distance. But behind all that composure is a heart more tender than anyone guesses, and it's allowed to be comforted too. Let yourself know that.",
    aquarius:
      "You watch your emotions from a step back instead of drowning in them. Even in intense moments you stay strangely calm — which can read as cold, but it's really the space you need to feel safe. That distance can sting the people who love you, so now and then, let them a little closer. Your unattached heart is a gift; it gives everyone room to breathe.",
    pisces:
      "Your heart has no clear borders. Someone else's sorrow seeps in without knocking, and you feel the whole world's ache as if it were your own — which is why some days you sink for no reason you can name. But reaching a depth no one else can touch, and comforting people from there, is a rare gift, not a flaw. When you start to flood, draw a soft line between you and them, and protect your own shore first.",
  },
  mercury: {
    aries:
      "Your mind moves at the speed of lightning. You grasp the heart of a situation in an instant and turn thought into words and action before anyone else has caught up. That bluntness can cut through a tangled mess in one stroke — though sometimes your mouth outruns your heart and catches people off guard. Pause half a beat and that quick edge becomes real force. You're the one who makes the call no one else dares to.",
    taurus:
      "You never rush to speak. A conclusion you've chewed over once doesn't wobble later, and that gives your words a quiet weight. It can look slow — but the words that outlast the noise, the ones people end up trusting, come from someone exactly like you. You're not behind; you're just choosing what will still be true tomorrow.",
    gemini:
      "Your mind runs a dozen open tabs at once. One topic branches into ten, and a single witty line can bring a dull room back to life — you wire together things that seem unrelated and find the link no one else spotted. Just watch that your attention doesn't skip on before you've gone deep. Linger a beat longer, and that spark makes you the center of the room anywhere you go.",
    cancer:
      "You read the feeling underneath the words before you register the words themselves. Your instinct for the mood is sharp, and your memory holds onto the little things people let slip, ready to bring them back with care. You do absorb other people's tones a bit too easily, though — you don't have to carry every signal. That emotional attunement is what makes talking to you feel, oddly, like being comforted.",
    leo: "You put warmth and drama into your words — the same story, told by you, becomes a scene people can see, and a confident voice pulls them in without effort. On any stage or in easy talk, your words hold the room. Just remember: the louder your story gets, the less room there is for anyone else's — pass the mic now and then. The line with real heart in it is always the one they remember.",
    virgo:
      'You name the thing exactly. Where others blur it together, you separate it out cleanly and organize down to the last detail — which is why, when things get chaotic, everyone ends up asking you. Just be careful not to grind yourself down chasing flawless; sometimes good enough truly is. That clear, precise mind can bring order to almost any mess.',
    libra:
      "You can wrap even a sharp truth in something soft. You weigh both sides instinctively, so a standoff loosens the moment it passes through you — saying the hard thing without bruising anyone is a rare skill. Just don't blur your own opinion out of the picture while you're at it; say your piece a little more clearly. That graceful persuasion makes you the person every room turns out to need.",
    scorpio:
      "You don't say much, but the one thing you say lands dead center. You see straight through the motive behind a face or a tone, and a polished line rarely fools you — it can be unnervingly accurate. Just know that digging into everything can weigh on you; some things you can let float by. That relentless pull toward the truth hands you answers no one else can reach.",
    sagittarius:
      "You reach for the big picture and the meaning, not the fine print. What pulls you is the 'so what does this actually mean' — and your honest, unfiltered take tends to crack a stale conversation wide open. Just remember: when the idea gets big, the details go loose — back a bold claim with a small fact and it doubles its force. That wide view shows people the landscape beyond the wall they were staring at.",
    capricorn:
      "Your words carry weight and responsibility. You don't toss things out carelessly, and whatever you commit to, you stand behind — which is why, when a real decision is on the table, people lean on your read of it. Just watch that too much caution doesn't keep good thoughts trapped inside; share them before you're fully certain sometimes. That steady, trustworthy voice is what makes people trust you for the long haul.",
    aquarius:
      "There's always one angle in your head that no one else has seen yet. You flip an assumption everyone takes for granted, and that fresh view can turn a whole conversation on its head — they call it odd at first, but 'huh, you were right' always circles back to you. Just remember: race too far ahead and people can't follow. Slow half a step, and that different eye keeps you ahead of the times without leaving anyone behind.",
    pisces:
      "You think in images and feeling more than logic. A metaphor comes to you before a plain explanation does, and you read the silences and the mood between the lines. That poetic imagination gives color and warmth to the driest conversation. Just don't let feeling blur the facts when it matters — a quick double-check keeps you grounded. Turning the pictures in your mind into words is a gift no one else can quite copy.",
  },
  venus: {
    aries:
      "You're honest and hot-blooded in love. When you're drawn to someone you don't play it cool — you go first, and that fearless directness gives the other person a real thrill. Just know a fire that catches this fast can cool just as fast, so notice what's left once the rush fades. Choosing the truth over the game is exactly what makes you magnetic.",
    taurus:
      "Your love is sensual and steady — a warm touch, good food shared, a comfortable silence side by side is where it feels most real to you. You don't start easily, but once you open up you rarely change, so your side becomes the most stable place someone knows. Just don't let comfort harden into routine; make a little new thrill together now and then. That staying warmth is what makes love last.",
    gemini:
      "You fall for a good conversation. The moment words click is your version of romantic, and your heart opens to someone who's never boring — you love a light, playful, laughter-filled bond. Just notice when curiosity fades before you've checked how deep it really goes; with the person who truly clicks, stay a little longer. That spark for talk keeps a fresh breeze moving through any relationship.",
    cancer:
      "You love deeply and protectively — once someone's yours, you hold them with your whole heart and become the safe harbor they rest in. You open up only once you feel truly secure, and that caution makes your love all the more precious. Just don't pour so much in that you forget to be cared for too; let yourself receive. Once someone's felt that steady kind of love, they never forget it.",
    leo: "Your love is bright and warm. You show what you feel without holding back and soak up being loved with your whole body. That big, showy affection isn't vanity — it's just that you can't and won't hide love. Just don't let your heart swing on every sign of approval; you don't have to keep proving they care. When you love out loud, the person beside you shines too.",
    virgo:
      "You say love in small acts of care. Instead of grand declarations, you quietly handle the thing they needed — that's your language. It barely shows, but anyone who's been close to that thoughtful devotion never forgets it. Just watch that caring doesn't leak out as worry or nagging; offer trust in who they are, as they are, too. That wordless attentiveness turns out to be the deepest kind of love.",
    libra:
      "Your love is graceful and harmonious — you enjoy building something beautiful together and feel happiest walking in step with someone. Your instinct for balance in a bond is a charm few people have. Just don't fold yourself away so often to keep the peace that you lose what you actually wanted. Real love isn't you disappearing; it's two people standing side by side — and that's what you've been after all along.",
    scorpio:
      "There's nothing lukewarm about your love. Once you fall you fall all the way, and you want to know someone completely — an intensity that can feel like a lot, though the person who loves with their whole being is rare. Just know a love this deep can slide toward obsession or jealousy, so loosen the grip now and then. Giving everything you have is exactly what leaves so deep a mark.",
    sagittarius:
      "Your love is free and honest. You're drawn to someone you can grow and adventure with, not someone who fences you in, and you dream of a bond full of laughter and open sky. Just know that guarding your freedom too hard can read as distance — staying, too, can be its own adventure. That wide-open heart turns love from an obligation into a joyful trip.",
    capricorn:
      "Your love is serious and built to last. You don't wobble — you take your time and stack up trust piece by piece, and once you've named someone yours, that loyalty is your real romance. Just know that opening up so slowly can leave them wondering; show what you feel a little more often. A love that only deepens with the years is the rarest gift you can give.",
    aquarius:
      "Your love is unusual and free. You want a partner who's also your closest friend, and you treasure the space that lets each of you keep your own world. Not following the standard relationship script is part of your charm. Just know that guarding that distance can make you seem far away — bring your honest affection a little closer sometimes. That different way of loving builds a bond that's anything but ordinary.",
    pisces:
      "Your love is romantic and devoted. You want to melt into someone's heart and become one, and you give what you have with no conditions attached — a devotion that wraps around a person like a warm tide. Just know that dissolving yourself entirely into love can leave only wounds; learn to keep a self, and the love completes itself. That way of seeping in, no strings attached, is a light the world rarely sees.",
  },
  mars: {
    aries:
      "The word 'hesitation' doesn't exist in you. The moment you want something your body's already moving, and that explosive drive can flip a stalled situation in a single beat. While everyone else is still deliberating, you're out there learning by crashing into it. Just know that fire can outrun you into recklessness — steal half a breath before you leap. Even so, the world belongs to the one who starts first.",
    taurus:
      "You're slow, but you never stop. Once you pick a direction you push like an ox, staying in the ring long after others have quit, until the result is undeniable. You don't rush — but the grit to finish what you start is your real weapon. Just know that clinging to one way can make you miss the shift; check your bearings now and then. That tireless persistence is what proves you, in the end, more surely than anyone.",
    gemini:
      "You juggle several things at once, fast and light. Rather than muscle through, you make words and ideas your weapon and bend a situation your way. In a fast-changing scene, you're the first to find the answer — that's your quickness. Just watch that scattered focus doesn't leave the one thing that matters unfinished; learn to gather your force in one place. That nimble wit always opens a new road out of a dead end.",
    cancer:
      "You're strongest when there's something to protect. You can be soft and gentle day to day, but the moment your people are threatened, a strength appears from nowhere. Emotion is what fuels you into motion. Just know that if that force curdles into resentment or defensiveness, it wears you down — when anger rises, look first at the real feeling underneath it. Quiet but never soft, you guard what you love to the very end.",
    leo: "You take on a challenge boldly and warmly. Instead of shrinking under attention, you draw power from it, and your confidence heats up everyone around you. The bigger the stage, the brighter you burn — that's a gift you were born with. Just watch that the hunger to be seen doesn't push you into overreaching; chase your own satisfaction before the applause. That fearless step to the front is exactly what pulls people to you.",
    virgo:
      "You push forward precisely, not recklessly. Instead of charging in, you close the gaps one by one and prove yourself quietly, with skill. It's not flashy — but earning trust in the end is your way. Just know that chasing perfect can keep you from ever starting; find the courage to begin and refine as you go. That sure-handed execution speaks for you louder than any argument could.",
    libra:
      "You move gently but relentlessly, never head-on. Instead of forcing your way, you use relationships and balance as leverage to reach exactly where you meant to. Doing gracefully what brute force can't — that's your specialty. Just know that dodging every conflict can swallow the thing you needed to say; sometimes the courage to meet it head-on is what's called for. That refined drive gets the result without leaving a mark on anyone.",
    scorpio:
      "Your persistence is quiet, but frightening. You look calm on the surface while you sharpen your resolve underneath — and once you've decided, you see it all the way through. Where others give up, you dig in alone and pull out the answer. Just know that intensity turned too high can burn you down; learn which battles to fight and which to release. That deep, silent focus makes you someone no one can stop.",
    sagittarius:
      "You challenge and expand without flinching. Your heart races at the untraveled road, not the safe one, and that hunger for freedom is your fuel. You'll set foot exactly where others swore it couldn't be done. Just know that starting too many things can leave the endings loose — build the muscle to finish as much as you begin. That optimistic drive keeps carrying you to a brand-new horizon.",
    capricorn:
      "You move toward the summit strategically. You don't let emotion steer you; you can wait for the right moment and wield patience as your sharpest weapon. You count the seat you'll reach in the end more than today's speed, stepping one calculated step at a time. Just watch that fixing your eyes so far ahead doesn't drive you to grind yourself down; give the you who's made it this far some credit. That measured grit carries you, over time, to a place no one can touch.",
    aquarius:
      "You don't fight the way everyone else does. Rather than follow the set rules, you flip the whole board with a fresh idea and break through from an angle no one saw coming. The more stuck a situation is, the brighter you spark. Just watch that insisting on the unusual doesn't make you miss the simple, direct move — sometimes the old road is the fastest. That original drive opens a new way exactly where everyone else hit a wall.",
    pisces:
      "You move quietly, like flowing water. Instead of colliding head-on, you find the gap and seep through, steering by intuition like a compass. Something force couldn't manage, you somehow accomplish softly. Just know that when the goal goes blurry, your energy scatters everywhere; every so often, name clearly where your heart is pointing. That gentle drive keeps finding its own path, even against the hardest wall.",
  },
  jupiter: {
    aries:
      'Luck follows the moment you dare. The instant you raise your hand before anyone else, a door swings open, and the act of pioneering turns into real growth. Just know that always starting fresh can leave older things unfinished — build the muscle to carry them through. So stop weighing it and jump; the world is always ready to reward your nerve.',
    taurus:
      'Your abundance grows out of consistency. Stack things up one at a time without rushing and the blessings snowball; the more you trust your own senses, the bigger the opening. That unhurried ease is what builds the sturdiest wealth of all. Just know that clutching only the familiar can cost you a new chance — open your mind to the odd experiment now and then. Slow but sure is exactly how you end up with plenty.',
    gemini:
      "For you, luck arrives through people and learning. The network and knowledge you gather chasing your curiosity become assets, and a passing conversation swings open an unexpected door. Just know that skimming everything can cost you the depth; dig all the way into the one thing that pulls you. Stay curious and stay connected — that's your personal luck formula.",
    cancer:
      "Blessing comes back to you when you give and care. The people you've shared your heart with become your sturdiest shelter, and chances bloom where you've built warmth. Home and people — that warm root is your greatest asset. Just know that tending everyone else can cost you your own share; give as generously to yourself as you do to them. The kindness you offer comes back around, someday, as something larger.",
    leo: "Fortune opens when you step up boldly. When you're unafraid to show yourself, the stage and the chance open together, and that confidence pulls luck toward you. Refusing to be shy about shining is, for you, a way of calling in blessings. Just watch that the wish to be recognized doesn't send you chasing empty things; follow what actually delights you over other people's eyes. The world roots for the one who burns bright.",
    virgo:
      "Your harvest opens through diligence. When you refine, with care, what others wave off, blessings stack up bit by bit, and an unexpected chance arrives where you've helped someone. That refusal to neglect the small stuff is the key that opens the big door. Just watch that chasing perfect doesn't drive you into the ground; let 'done' be enough sometimes. The quiet devotion you've built up returns, one day, as solid reward.",
    libra:
      "For you, luck grows inside good relationships. Cooperation with the people you've joined hands with opens the door of opportunity, and your gift for making harmony becomes its own blessing. Don't carry it all alone — your luck is largest when it's shared. Just know that always absorbing the cost to keep the peace will drain you; keep the give and take in balance. Your fortune blooms brightest side by side with good people.",
    scorpio:
      "You gain big by digging deep. Where others fearfully turn away, you spot the chance, and you flip a whole crisis into a blessing. That bold immersion hands you a reward the ordinary can't reach. Just know that betting everything on the descent can wear you out; weigh when to pull back and when to press on. The courage to go all the way down puts a treasure in your hands that no one else could mine.",
    sagittarius:
      "Your luck grows the wider you reach. On the ground of strange places, new learning, and big ideals, fortune comes out to meet you first. Don't fear crossing the fence — the world is most generous to an adventurer like you. Just know that always gazing far can cost you the chance right at your feet; look down and around every so often. The world keeps opening its doors wide for someone like you.",
    capricorn:
      "Your effort always comes back as reward. Today's responsibility and patience compound like interest over time, and time itself becomes your sturdiest ally. That endurance others can't match is your surest seed of luck. Just watch that fixating on results doesn't keep postponing today's joy; catch your breath on the way up. The time you've quietly held the line returns, one day, magnified.",
    aquarius:
      "For you, opportunity opens through the unusual attempt. The road no one takes and the idea no one expects swing open a surprise door, and your originality itself becomes an asset. Even when it looks strange, trust your own way and move. Just watch that always chasing the new doesn't make you skip a proven method; there's wisdom in the old road too. The era always ends up following the path you drew first.",
    pisces:
      "Abundance flows in when you give and trust. A heart offered without conditions circles back around as blessing, and the thing you pictured in your mind swings open reality's door. That uncalculating generosity guards you in the unlikeliest places. Just know that giving it all away can leave you empty; remember to refill as much as you pour out. Opening your hand and trusting the current brings you the fullest kind of luck.",
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
