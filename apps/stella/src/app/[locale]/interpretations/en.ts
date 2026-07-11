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
    aries:
      "You learn to master your own impulse, by living it. Every time you have to press pause on the urge to bolt, real strength grows, and the energy you've held back becomes unstoppable. Just know that clamping down too hard can suffocate you — leave a little room to breathe between the rules. The patience you're learning right here is exactly what will make you strongest.",
    taurus:
      "You build slowly but solidly. An unglamorous consistency becomes, over time, a foundation nothing can shake, and you're the one still standing when the impatient collapse. That stubborn steadiness wins in the end. Just know that stalling every change to protect stability can cost you the moment — hold firmness and flexibility at once. You may not rush, but you always arrive.",
    gemini:
      "You steadily add weight to your words and your learning. You dig into thoughts you once let drift, hardening them into real knowledge, and you learn not to speak carelessly. That matured thinking gives your words a staying force. Just know that the pressure to know everything perfectly can seal your mouth shut; find the courage to share even when you're unsure. Your deepened mind becomes a voice people come to trust.",
    cancer:
      'You learn to guard your feelings and your home yourself. You move past the wish to lean on someone and become, instead, the sturdy shelter for others — and in that, you grow into a real adult. Just know that always being the one who holds things up can cost you your own place to rest; make somewhere to lean, too. That unbreakable tenderness becomes the spot tired hearts keep coming home to.',
    leo: "You learn real confidence through humility. Only when you can hold steady without applause does it harden, and that light — forged by effort — never goes out. The approval you once leaned on slowly turns into faith in yourself. Just know that stifling the wish to be seen can shrink you; don't be stingy with your own praise. The confidence you build from within becomes the longest-lasting glow.",
    virgo:
      'You aim your standard for perfection at yourself. You measure diligence by your own ruler more than any watching eye, and that honest effort roots into unshakable trust. Nothing slips by half-done, so trust follows whatever you finish. Just know that ruler can crush you sometimes; remember the imperfect you today is already enough. Go a little easier on yourself, and that diligence shines far longer.',
    libra:
      "You learn responsibility inside relationships. You move past pure people-pleasing and pick up, step by step, how to draw a fair line — and that mature sense of balance keeps your bonds healthy for years. Just make sure fairness doesn't harden into stiffness; carry principle and warmth together. Real harmony isn't erasing yourself; it's knowing how to protect yourself, too.",
    scorpio:
      "You learn deep restraint and control. Each time you master an emotion that nearly swept you away, real strength appears, and the more crises you endure, the sturdier you get. That capacity to hold makes it so no trial can topple you. Just know that shouldering everything alone can quietly rot you inside; share the heavy load now and then. The time you've endured turns you into someone deep and strong beyond most.",
    sagittarius:
      "You add responsibility to your beliefs. You verify vague ideals against reality, one at a time, and pack what you've read into lived experience. That hardened faith becomes the center that holds you steady in a shaky world. Just know that too much certainty can push away other people's truths; keep an ear open to voices beyond your own. A conviction tested and matured is a strength no one can easily shake.",
    capricorn:
      "You're the competitor strictest of all with yourself. You move by your own inner principle, not the standard someone else set, and the deeper time runs, the deeper your roots. The quiet weight you've stacked up makes you unshakeable. Just watch that endless self-discipline doesn't burn you out; give the you who's come this far some kindness now and then. If today's weight feels heavy, that's proof of how close to the summit you already are.",
    aquarius:
      "You hold the grit to turn ideals into reality. You build what only lived as a dream into actual structure and rebuild old frameworks from the root. That relentless power to realize becomes, at times, the force that changes the rules of the world itself. Just know that ideals racing ahead can lose the reality and the people; keep pace with what's beside you, too. The stubbornness to give a bold dream a form sets you up as an architect of the times.",
    pisces:
      "You learn to find your center inside the haze. You drop your own anchor into a heart that seeps past every boundary, and add the weight of responsibility to a formless devotion. That hardened tenderness completes you into someone warm yet not soft. Just make sure the weight of reality doesn't cost you your original imagination; hold the balance between dream and ground. A heart that carries both softness and steel is what holds people the longest.",
  },
  uranus: {
    aries:
      "There's a pioneer in you who breaks the old mold and cuts a new path. You're not afraid to step first in a direction no one's tried, and that restless freedom becomes innovation itself. Wherever you shake things loose, a new current begins. Just know that if you get lost in tearing down, you may forget to build; picture what the change is for. That nerve no one else could summon becomes the key to the world's next chapter.",
    taurus:
      "You make change quietly, from inside the familiar. Rather than flip the whole table, you turn what already exists into something better one slow improvement at a time — and a change that practical lasts. Unflashy as it is, you're the one who ends up reshaping the world most surely. Just know that moving too slowly can cost you the moment; when it's ripe, be bold. That unhurried reform builds a change that doesn't wobble.",
    gemini:
      'Ideas that flip the board flash through your mind without pause. You wander off the marked path of thought and freely wire together things that seem unrelated, and that spark makes a stale debate new all over again. That different angle is the key that opens the next chapter of any conversation. Just know that if it stays only in your head, the sparkle scatters; take a ripe thought out and share it. Once your brilliance lands in the world, it becomes real force.',
    cancer:
      "You go looking for new ways to do feeling and home. You don't inherit the old frame as-is; you redefine your own warmth and shelter for yourself. That unusual tenderness quietly tells people, 'it's okay to love like this, too.' Just make sure that in breaking the frame you don't lose a place to rest your heart; keep a root even inside your freedom. The courage to rewrite the old way becomes, for someone, a great comfort.",
    leo: "You shine with an originality all your own. Instead of copying anyone, you build a stage that's never existed, and that one-of-a-kind quality naturally catches every eye. That single color found nowhere else makes you impossible to replace. Just know that trying too hard to be different can turn stiff; trust that you're already rare without the effort. An individuality you don't have to force is the charm that shines the longest.",
    virgo:
      "You innovate the very way work gets done. You spot the inefficiency in a process everyone takes for granted and tear it apart to rebuild, easing the load for the people around you with practical invention. That quiet improvement piles up and nudges the world forward, inch by inch. Just watch that chasing a better method doesn't shake something already good enough; sort what to fix from what to keep. That knack for unshowy improvement makes you indispensable anywhere.",
    libra:
      "You experiment with new forms of bond and balance. You question the set formula for relationships and dream of a harmony that keeps each person's freedom intact. That open experiment shows the world fresh possibilities for love and friendship. Just know that insisting on your different way can leave the other person lonely; watch their heart as closely as the newness. That instinct to rewrite the rules makes a bond freer and healthier.",
    scorpio:
      "You carry a change that shakes the foundations. Unsatisfied with surface fixes, you tear things up from the root and spark a quiet revolution from the depths. That fierce transforming force lets the old be completely reborn. Just know that the urge to overturn everything can cost you what was worth keeping; picture what you'll build after you break it. That daring to dig to the bottom and change it makes a shift no one else could.",
    sagittarius:
      "You hold a free-roaming mind that crosses every border. You leap the fence of settled belief to find a wider truth and sketch tomorrow's horizon before it arrives. That unstoppable thinking carries the world's ideas a step further out. Just know that ideals racing ahead can lose their footing in reality; connect the big picture to small, real steps. That gaze unafraid of edges becomes the force that opens a new horizon.",
    capricorn:
      "You're a reformer who overturns old structures. You find the crack in a system that looks solid and rebuild it, tearing down and raising something better in the same motion. That fundamental rebuilding changes the very skeleton of the times. Just know that reshaping the whole board takes time; carry a long breath instead of impatience. The grit to not stop at breaking but to rebuild it in the end is what completes real change.",
    aquarius:
      "You were born with a gaze ahead of your time. You live the future no one else has seen yet, and originality is simply your essence. Strange as it looks now, the world ends up flowing in the direction you drew. Just know that racing too far ahead can leave the people beside you behind; slow down and walk with them sometimes. The day always comes when that different eye becomes everyone's obvious.",
    pisces:
      'You dissolve borders with imagination and inspiration. You reconnect, through feeling, what logic split apart, and you throw open a dream no one else could dream. That dreamlike innovation sketches a door of new possibility into the world. Just know that if imagination drifts too far from reality, it loses its shape; pin a small foothold onto the dream. The power to imagine, first, what no one could see becomes a seed that widens the world.',
  },
  neptune: {
    aries:
      "You dive burning-hot toward the ideal. You don't just cradle the dream in your chest; you move it into action, and that passion pulls a blurry ideal into reality. The ability to dream and leap at once makes you more than a daydreamer. Just know that ideals racing ahead can crash against reality and tire you out; break the big dream into small steps to walk. Believing hot and moving fast is what drags imagination into the here and now.",
    taurus:
      'You shape beauty through the senses. You find romance in what you can touch and see, and you fold the ideal, quietly, into the real. That fine eye is your own magic — turning the plainest day into a piece of art. Just know that pouring your heart into beauty can push real problems to the back; keep romance and the practical together. The sense that makes the world a little more beautiful keeps your side warm and lovely.',
    gemini:
      "Imagination and language blend naturally inside you. You move an image that surfaces into a story, and you have a knack for building a magic-like world out of a few words. That poetic gift paints a landscape in the listener's mind that was never there before. Just know that a story lived only in your head can sadly scatter; catch it in writing or in form. The imagination that rebuilds the world into story is your most luminous gift.",
    cancer:
      "You wrap the world in deep empathy. You read a heart without a word being spoken, and that tender intuition quietly soothes the weary. The power to hold the world with your heart makes you someone's shelter. Just know that carrying everyone's feelings can cost you yourself; draw a soft line between the empathy and you. The tenderness to recognize a hurt and hold it is a light no one else can quite copy.",
    leo: "You shine with creative inspiration. Your heart flows toward art and expression, and you make what you've imagined bloom into visible beauty. That overflowing creativity leaves your own distinct color on the world. Just know that on the days inspiration doesn't come, you can waver hard; enjoy the making itself over the result. That expressive power that makes the world a touch more dazzling is a gift you were born with.",
    virgo:
      'You help and heal with delicate devotion. Instead of leaving the ideal vague, you fold it into reality with careful hands and quietly make someone well. That humble devotion makes the world, soundlessly, a better place. Just know that helping everyone can cost you your own care; spend some of that devotion on yourself, too. Those quiet hands mending the world turn out to be the deepest kind of healing.',
    libra:
      'You dream of harmony and beauty. You picture an ideal love and a perfect balance in your mind, and that sense colors everything around you a shade more graceful. That longing for beauty makes you a person of art and love. Just know that when the ideal is high, reality can look shabby and disappoint you; notice the beauty already here before the perfect. The sense that smooths the world a little finer turns everything nearby lovely.',
    scorpio:
      "You're enchanted by mystery and depth. You feel the unseen and sense the truth running quietly beneath the surface. That deep intuition draws up a beauty from the depths that no one else can reach. Just know that staying submerged in the dark too long can weigh the heart down; come up to the sunlit surface now and then. The sense that reads the invisible world makes you someone rare and deep.",
    sagittarius:
      "You chase a greater meaning and truth, past whatever's in front of you. Unsatisfied with now, you enjoy spiritual adventure and keep asking yourself what life even is. That hunger for the transcendent carves a rare depth into your journey. Just know that always seeking the answer far off can cost you this moment; turn your far gaze back to your feet sometimes. That endless thirst for meaning keeps carrying your life somewhere wider.",
    capricorn:
      "You realize the ideal through structure. Rather than let a dream drift in the air, you raise a real frame and shape it piece by piece, becoming the bridge between reverie and execution. That solid imagination makes your dream, in the end, something you can see. Just make sure the weight of reality doesn't make you forget the first ideal; revisit why you started every so often. The grit to make a dream graspable is a power few people hold.",
    aquarius:
      'You dream an ideal not for yourself but for everyone. You imagine a world larger than the individual, and a warmth for all of humanity widens that imagination without limit. That broad heart makes your dream something beyond your own. Just know that chasing the ideal can make you pass right by the person beside you; treasure one near heart as much as the far world. The wish to hold everyone in ends up, someday, making the world a little kinder.',
    pisces:
      "Your imagination and spirit reach far and wide, without a border. You carry an empathy that feels connected to everything by an invisible thread, and that limitless sensitivity makes you a person of art and soul. You read, with your whole body, subtle currents others can't feel. Just know that with borders so faint, you can be swept up in the world's feeling; keep a soft anchor to hold yourself. That very tenderness is the most precious, most beautiful gift there is.",
  },
  pluto: {
    aries:
      'You reinvent yourself, again and again, by fierce will. Where others would collapse, you grow stronger, and each crisis forges you into a brand-new person. The power to rise every single time, no matter the ending, is your real backbone. Just know that always meeting things head-on can burn you out; weigh what to tear down against what to keep. That force that lifts off the bottom and climbs again makes you someone nothing can break.',
    taurus:
      "You change values and security from the very root. You don't just fix the surface; you rebuild, from the foundation, what truly matters. That deep transforming force lays a new base that won't shake. Just know that a grip you can't loosen can make change drag; remember that letting go is a strength too. The value you've questioned for yourself becomes, in the end, your sturdiest root.",
    gemini:
      'You flip the board with the power of thought and word. Unfooled by surface information, you dig to the truth and topple a solid old assumption with a single line that lands dead center. That penetrating intellect rewrites the story the world tells. Just know that endless excavating can sharpen your heart; carry warmth alongside the truth. The insight that finally drags the hidden into the light makes you someone no one can deceive.',
    cancer:
      'You heal feelings and roots at their deepest. You face an old inherited wound alone and cut it off, turning even that ache into power. That brave healing frees you and the people you love along with you. Just know that shouldering deep wounds alone can wear you out; sometimes lean on a hand beside you. Cutting off, in yourself, a pain passed down through generations is the most precious change of all.',
    leo: 'You break the self and rebuild it stronger. You let the worn-out you go without regret and are reborn anew, and that intense presence can overwhelm a room. The power to be reborn as many times as it takes keeps you from ever fading out. Just know that the need to look strong can make you hide the weak moments; accept the crumbling you exactly as it is. A flame that reignites even from ash is your true dignity.',
    virgo:
      "You remake your daily life and your body from the inside out. Rather than touch the surface, you purify your habits from the root and rebuild into a healthier self, quietly flipping your whole life with the smallest change. That steady rebuilding turns you, before you notice, into someone entirely new. Just know that obsessing over fixing yourself can turn into self-punishment; remind yourself that today's you is already fine. A daily small purification adds up to the deepest transformation.",
    libra:
      'You reshape the power in a relationship from the root. Rather than clash on the outside, you re-lay the very foundation of balance, and only then does a bond get reborn healthy. That deep insight takes your relationships somewhere on another level. Just know that digging too far into the underside can wear you out; hold onto some grace to trust rather than excavate. The courage to cut out the rot and stitch it back together makes a sturdier bond in the end.',
    scorpio:
      "You're fully reborn from the very deepest place. You stare head-on at the dark others fearfully avoid, and that chillingly intense insight sees straight to the essence. A depth that has lived through several deaths and returns makes you someone nothing can shake. Just know that sinking alone into the dark can burn you up; rise to the light as much as you go under. That force that drops to the bottom and surges back up is your most formidable weapon.",
    sagittarius:
      "You shake a belief you've held to find a deeper truth. You doubt an inherited worldview wholesale and rebuild it toward a larger truth, and in that journey, you're reborn. That hunger for the fundamental makes your faith a depth no one else can copy. Just know that doubting everything can cost you even the ground to stand on; after you shake it, build a new belief too. Tearing down and raising up, over and over, leads you into a real kind of wisdom.",
    capricorn:
      "You change structure and power from the root. You shake the foundation of a system that looks unbreakable and grow stronger through the very crisis. That relentless transforming force carries you to the seat where the era's board gets reset. Just know that clinging to power can cost you the actual people; keep, always, what the power is for. The grit to rebuild an old order in the end sets you up as a cornerstone of the times.",
    aquarius:
      'You topple the old system and open a new order. You crack an order everyone took for granted and gather the scattered to lead a collective transformation. That burning will to reform makes you the one who opens the next era. Just know that tearing down too fast can lose the people meant to come with you; carry human warmth into the change. The courage to overturn the obvious in the end opens a new road for everyone.',
    pisces:
      "You transform what can't be seen. You face a wound sunk deep in the unconscious alone and purify it, quietly shifting a current no one else can see. That deep work of the soul reborns you and the world without a sound. Just know that sinking too far into the invisible can lose you the way in reality; keep a foot planted in the here and now. That depth that heals from the very bottom of the heart becomes a seed that quietly changes the world.",
  },
  northNode: {
    aries:
      "This life, your soul came to learn how to lead and summon a courage that's yours alone. Leaning on others or hanging back may have felt safer and more familiar all along. But the real growth begins the moment you take the first step in your own name instead of following someone else's. It's completely natural for that first solo step to feel frightening and strange — and even so, the courage it takes carries you somewhere entirely new.",
    taurus:
      "This life, you came to learn how to build value at your own unshakeable pace. Until now, you may have kept getting pulled into intensity and the swirl of crisis. But when you set down the rush and calmly savor what you already hold, a real steadiness settles into you. You don't have to hurry or compare — your pace is enough. The steadiness you build slowly roots a genuine peace into your life.",
    gemini:
      'This life, your direction is learning to open up, learn, and connect. Holding tight to a single answer may have felt more secure all along. But when you listen to many stories and ask your questions lightly, your world widens beyond recognition. You can set down the pressure to know everything for now. That curious, sharing way of yours makes you a far freer person.',
    cancer:
      "This life, you came to learn how to open your heart, care, and put down roots. Proving yourself through results may be the more familiar habit. But when you feel your emotions exactly as they are and share your heart with someone, real ease finally arrives. You don't have to keep your heart shut for fear of looking weak — that very courage to open it makes you strong from the inside, not just the outside.",
    leo: "This life, your direction is growing the courage to shine and to say what you feel. Blending quietly into the crowd may have felt more comfortable. But the moment you step onto the stage and show yourself, you meet a real joy for the first time. You don't have to fear or feel shy about being seen. The instant you let yourself shine, the sun inside you finally rises, bright.",
    virgo:
      "This life, you came to learn how to refine, step by step, and set your feet on the ground. Drifting off into vague ideals or chaos may be the more familiar pull. But when you do today's task with care and put one thing at a time in order, a blurry life turns crisp and clear. It doesn't have to be something grand — each small act carries real weight. The habit of standing here, now, carries you from haze into focus.",
    libra:
      "This life, your direction is learning harmony and real partnership — together over alone. Pushing ahead solo, your own way, may have felt easier and faster. But when you match steps with someone and find the balance, you reach places you never could on your own. Holding out your hand isn't weakness; it's another kind of courage. The moment you learn to go together, your world widens to twice its size.",
    scorpio:
      "This life, you came to learn how to dive deep and face real transformation. Settling into the comfortable and familiar, staying on the surface, may have felt safer. But when you dig into what frightens you and set yourself fully down, you're reborn, brand new. Leaping into the depths is scary — and it brings a change worth exactly that much. That brave immersion makes you strong and deep beyond recognition.",
    sagittarius:
      "This life, your direction is setting out for a wider world and beliefs of your own. Being swayed by other people's thoughts and the information in front of you may be the more familiar habit. But when you ask yourself what life means and go looking for your own truth, a new road finally opens. There doesn't have to be a set answer — the asking itself grows you. That step toward the horizon hands you a real freedom.",
    capricorn:
      "This life, you came to become the kind of adult who takes responsibility and builds achievement of your own. The wish to lean on feelings or retreat to the comfortable seat may have been stronger. But when you carry your own share fully and make something with your own hands, an unshakeable solidity grows in you. It's only natural for that weight to feel heavy at first. The moment you shoulder it, you finally become the true owner of your own life.",
    aquarius:
      'This life, your direction is moving beyond yourself, toward community and the future. Your heart may have leaned more toward personal recognition and being seen. But when you reach out a hand for something larger than you and stand in solidarity with others, a real freedom arrives instead. Shining together lasts far longer than shining alone. The moment you open your heart to something bigger than yourself, your life widens without limit.',
    pisces:
      "This life, you came to learn how to let go, trust, and give yourself to the flow. Controlling and analyzing everything may have been the only thing that eased your mind. But when you loosen your grip and empty your heart, the peace you've long searched for quietly arrives. You don't have to hold onto everything — the world will hold you up gently. The moment you give yourself to the current, life carries you somewhere kinder than you expected.",
  },
  southNode: {
    aries:
      "Charging in alone, no looking back, is far too familiar to you. That fearless courage is a talent you've honed across many lifetimes, so keep it close — but now, learn to pause, glance beside you, and go together. Racing ahead solo takes you far, but matching steps with people takes you further. The moment you learn to move together, your courage doubles.",
    taurus:
      "Staying inside the safe and familiar is the most comfortable seat for you. That solid, unshakeable steadiness is a precious asset, so don't lose it — but in front of change, open your hand a little and let something new in. When you clutch the familiar too tight, there's no room left for anything better to arrive. The moment you gently let go, room opens for a far greater abundance.",
    gemini:
      'Skimming lightly across words and information comes naturally to you. That wit and quickness is a born gift, so keep it — but now, build the grit to dig deep into one thing. A hundred things known shallowly matter less than one thing known deeply. The strength to linger a little longer even after the interest fades turns your talent into real mastery.',
    cancer:
      'Leaning and being protected is a long-familiar place for you. Your tenderness and sensitivity toward others is a beautiful gift, so keep it — but now, slowly grow the strength to stand on your own two feet. When you can hold yourself up without leaning on anyone, that tenderness only grows sturdier. The moment you learn to stand by your own strength, your warmth carries far more force.',
    leo: "Feeling safe only under the spotlight is an old habit for you. That radiant presence is a charm all your own, so keep it — but now, meet the you that's more than enough offstage too. When you can shine on your own without anyone's applause, that light never goes out. The moment you love yourself without leaning on approval, real freedom arrives.",
    virgo:
      "Perfecting everything and worrying ahead of time is baked into you. That diligence and precision is a rare gift, so treasure it — but now and then, learn the ease of trusting and letting go. The world runs better than you'd think, even when you don't control it all. The moment you feel that it's okay for things not to be flawless, your heart grows a good deal lighter.",
    libra:
      'Accommodating others and keeping the peace is a familiar place for you. That thoughtfulness and instinct for harmony is precious, so keep it — but now, practice voicing your own truth clearly. A peace you keep by erasing yourself never lasts. When you move with a thoughtfulness that also protects you, a truly healthy bond is finally made.',
    scorpio:
      'Controlling things and tangling deep comes naturally to you. That intensity and immersion is a rare power, so keep it close — but sometimes, ease off and learn to let go lightly. The harder you clutch everything, the more it slips through your fingers. The moment you gently open your grip, more of it stays beside you instead.',
    sagittarius:
      'Wandering free is the most comfortable state for you. That wide view and adventurous heart is a born gift, so keep it — but learn, too, the stability of putting down roots. A tree rooted deep is exactly the one that grows the tallest. The strength to know how to stay, in the end, carries you further than roaming ever could.',
    capricorn:
      "Proving yourself through achievement and control is familiar to you. That resolve and grit is a fine asset, so keep it — but now, tend to your own heart first. You are already enough, exactly as you are, even without achieving a thing. The moment you take that truth deep into your heart, a real peace you've long put off finally arrives.",
    aquarius:
      'Observing from a step back is a familiar place for you. That objectivity and insight is a rare gift, so keep it close — but now, step a little closer and share your heart. When you connect through the heart and not just the head, a bond finally warms. The moment you close the safe distance and offer your presence, warmth returns to your world too.',
    pisces:
      'Letting hard things drift by and quietly slipping away is familiar to you. That softness and imagination is a beautiful gift, so keep it — but now, grow the strength to plant both feet in reality. When you lay a sturdy bridge between dream and reality, your imagination finally gains its power. The moment you embrace the ground beneath your feet, your imagination blooms into real magic.',
  },
  fortune: {
    aries:
      'Your joy breaks open in the moment you bravely start and take something on. Raise your hand and leap before anyone else, and luck and delight follow you there — that thrill is what keeps you most alive. Just know that hesitating to weigh the outcome can let that luck slip right past you; when your heart is pulled, just begin. Fortune is always on the side of the one who took the first step.',
    taurus:
      'Your blessing flows in when you build slowly and savor the senses. When you stop rushing and fully relish this moment, joy rises inside you, and that ease actually calls in more abundance. Just know that staying only in the familiar can cost you a new delight; open up to unfamiliar joys now and then. That knack for leisurely enjoying is what hands you the deepest satisfaction.',
    gemini:
      'Your luck swings wide open in the moment you learn, share, and connect. Following your curiosity to link people and stories, an unexpected chance arrives — and one stretch of joyful talk quietly becomes a blessing. Just know that spreading across too many places can cost you the core; take one connection you care about all the way deep. Staying curious and staying connected is your very own luck switch.',
    cancer:
      'Your blessing flows, gentle and steady, inside caring bonds. Share your heart and build warmth, and joy comes back to you whole; the people who warmly stay by your side turn out to be your sturdiest luck. Just know that tending everyone but yourself can leave you hollow; give that tenderness to yourself, too. The place where you give and receive love is where your greatest blessing returns.',
    leo: "Your luck shines bright in the moment you show yourself boldly and enjoy it. Express freely and let yourself be loved, and blessing flings wide open, that joy lighting up the people around you too. Just know that leaning only on other eyes can wear you out; chase what genuinely delights you first. When you're having a good time, fortune laughs right alongside you.",
    virgo:
      "Your joy arrives, quiet, in the moment you refine with care and help someone. Do one small thing faithfully and luck stacks up bit by bit; a calm satisfaction blooms right where you've been of use. Just know that chasing flawless can exhaust the joy right out of it; praise yourself for the thing done well. That meticulous care hands you a quiet but certain blessing.",
    libra:
      "Your luck grows lush inside good relationships and harmony. Savor beauty together with someone whose heart matches yours, and blessing flings wide open; a balanced bond is itself your greatest joy. Just know that folding yourself away to keep the peace can thin the joy out; choose the bond where you're happy too. The moment you join hands with a good person opens the door of fortune.",
    scorpio:
      'Your luck breaks wide open in the moment you immerse deeply and transform. Dig in without fear and you meet a blessing others never see; the greatest joy can surge up right where you flipped a crisis. Just know that betting everything on the dig can wear you out; keep a balance of immersion and rest. That deep place everyone else fears is, for you, where treasure lies hidden.',
    sagittarius:
      'Your joy swells in the moment you stretch out toward a wider world. Set off for somewhere unfamiliar and luck comes out to meet you first; each new experience quietly stacks up into blessing. Just know that always gazing far can cost you the joy right here; savor the happiness at your feet, too. That thrill of crossing the familiar fence brings you the greatest luck of all.',
    capricorn:
      "Your blessing comes back in the moment you build up, one faithful step at a time. Carry your responsibility quietly and luck follows steadily at your back; the longer time runs, the bigger and surer the reward. Just know that clinging to achievement and forever postponing today's joy will wear you thin; catch your breath on the climb. That endurance others can't match is your surest fortune.",
    aquarius:
      'Your luck flings open on an unusual road and among good people. Trust your own way and stride forward, and unexpected blessing arrives; solidarity with kindred hearts becomes your fortune itself. Just know that insisting on being different can cost you a hand held out; open your side wide to those whose hearts match yours. The nerve to step off the obvious path hands you a rare kind of chance.',
    pisces:
      "Your blessing flows, gentle and quiet, in the moment you give, imagine, and trust the flow. Empty your heart and give without holding back, and unexpected luck seeps in; that uncalculating generosity calls blessing in before you know it. Just know that giving it all away until you're empty will wear you out; refill yourself as much as you pour out. Opening your hand and trusting the current brings you the most beautiful gift of all.",
  },
}

export const retro: RetroReadings = {
  mercury: {
    aries:
      "Your quick thoughts don't fire straight out — they get chewed over one more time inside first. Instead of blurting what surfaces, you need that beat to double back and refine, and the words you sharpen that way land far harder than the first version. Just don't rework it so long that you miss the moment to say it; once you've turned it over enough, speak up. That extra pass inside is what makes the one line you finally drop hit heavy.",
    taurus:
      "Even a settled thought gets quietly re-checked inside you. Before you'll put a conclusion out loud, you turn it over and over until you're sure — and the more unhurried you are, the more unshakeable your judgment becomes. Just don't let all that caution stall the decision forever; at some point, trust it and close the loop. A thought that's ripened inside becomes the most dependable conclusion of all.",
    gemini:
      "Your ideas circle inside more than they spill out. You may say less, but the branches of your thinking run deeper and finer, and that inward wiring finds a connection no one else spotted. Just know that if it stays only in your head, the sparkle scatters — take a finished thought out and share it. What you've woven so tightly within shines for real once it reaches the world.",
    cancer:
      "You replay a feeling inwardly for a long time. Rather than move it straight into words, you bring your truth out only after chewing it over — which is why there's always warmth soaked into what you finally say. Just don't stew so quietly that you never actually get the feeling across; the sincerity you've mulled deserves to be spoken. Words warmed that long inside stay in someone's heart the longest.",
    leo: "You polish your words inside, several times, before you speak. Rather than dress them up, you check and re-check the sincerity they'll carry — and when you strip off the flair and let the real thing through, your words land deeper. Just don't perfect them so long that you miss the moment to say them; even a little clumsy, let the feeling out when it's live. The sincerity you forged inside rings longer than any dazzling line.",
    virgo:
      "Your analysis burrows inward before it ever shows. You revisit and re-check it perfectly in your head, and only then do you lay out a conclusion — so there's rarely a gap in what you present. Just know that being too strict with yourself can mean you never put anything out at all; once you've checked enough, trust it and finish. The order you've perfected inside becomes the standard everyone ends up leaning on.",
    libra:
      "You weigh a decision inside, again and again. Rather than follow what others say, you ask it against your own standard and turn it over until — only then — an unshakeable balance clicks into place. Just don't measure so long that you keep postponing the choice; if your heart's already leaning, trust it. A decision you've weighed thoroughly within turns out, in the end, to be the fairest one.",
    scorpio:
      "Your insight sinks to a deeper place instead of surfacing. Rather than say it aloud, you dig inward and mine out a truth no one else even noticed — and that depth you reach alone makes you unusually sharp. Just know that keeping it all to yourself can weigh you down; let the truth you've unearthed out into the open sometimes. The force that burrows in silence lands, in the end, on an answer no one else could see.",
    sagittarius:
      "You mull a big idea inside first, rather than broadcasting it. Instead of following someone else's conclusion, you keep asking yourself what it actually means — and only a conviction you've questioned into place is truly yours, not borrowed. Just don't ruminate so long that you miss the chance to share it with the world; take the ripened thought out too. The belief you've forged yourself becomes the steady center that holds you.",
    capricorn:
      "You verify any system to yourself, many times over. Rather than accept a framework someone handed you, you have to rebuild it by your own logic before your mind settles — and that's exactly why your words carry a trust that's hard to argue with. Just don't hold out for certainty so long that you miss the timing; at some point, trust it and put it out. The logic you've hardened inside becomes a standard no one can shake.",
    aquarius:
      "Your clever ideas don't burst out — they simmer quietly inside. Even when it looks different from everyone else, you push your own logic all the way to the end alone, and that self-forged thinking lands, in the end, on an answer no one could copy. Just know that a logic locked inside can get misread; let a thread of it out now and then. The originality that ripened quietly within will, someday, take the world by surprise.",
    pisces:
      "Your thoughts sink inward as imagery before they become words. You linger a long time in feeling, growing the image in your mind, and only then does the expression flow out — and by then it's quietly turned into a kind of poem. Just know that staying submerged in feeling can scatter what you meant to share; catch the image in writing or in words. The picture you drew so long inside colors people's hearts the moment it comes out.",
  },
  venus: {
    aries:
      "You confirm attraction inside before you ever show it. Before you make a move, you ask yourself again and again whether this is real — and love filtered that carefully comes out as sincerity, not impulse. Just don't confirm it so endlessly that you miss the moment to draw near; if the feeling's sure, take the courage to show it. A heart that's ripened inside becomes the truest kind of love.",
    taurus:
      "You grow affection slowly, savoring it within. Drawn again to the familiar over what others call good, you rediscover your own real taste — and only what you've chosen for yourself keeps your heart easy for the long run. Just don't stay so inside the familiar that you miss a new spark; open up to unfamiliar beauty now and then. The taste you've steeped within becomes your own unshakeable standard.",
    gemini:
      "You revisit a flutter inside rather than letting it drift past. More than the words traded on the surface, you slowly confirm the real heart underneath — and it's exactly when you mull the feeling that the bond stops skimming and turns solid. Just don't measure so long that you miss the timing to draw close; if you're sure, show it, even lightly. The heart you've confirmed within adds real depth to the bond.",
    cancer:
      "You hold tenderness deep inside rather than out. Instead of expressing it right away, you open the door only once you feel genuinely safe — and a heart you've opened that carefully rarely changes once it's given. Just don't guard the gate so long that you miss the chance to draw near; reach out first to the one you trust. A love held deep, then handed over gently, is the kind that stays the longest.",
    leo: "You nurture your true feelings quietly over any grand display. Before you strain to be loved, you need the time to cherish and fill yourself first — and when you love yourself before the approval, real love arrives on its own. Just don't keep it so far inside that the other person never knows; let the affection show, bright, now and then. That steadiness of loving yourself becomes the most radiant charm of all.",
    virgo:
      "You refine care inside rather than putting it on display. Over chasing a flawless love, you learn to slowly accept the other person exactly as they are — and it's when you lower the bar within that a bond turns easy and warm. Just don't care so silently that it never reaches them; put the quiet devotion into words sometimes. The generosity to hold someone as they are becomes, in the end, the deepest love.",
    libra:
      "You question the balance of a bond inside, over and over. Before you adjust to someone, you first confirm with yourself what you actually want — and only when you tend to yourself first does a harmony that doesn't tip to one side begin. Just don't measure so long that you keep putting off drawing near; if you know what you want, say it honestly. The balance that starts with you makes a bond that lasts.",
    scorpio:
      "You hide intense affection away in a deep place. You don't show it easily — but once you've held a heart it burns longer than anyone's, and a love forged inward runs to the very root, never shallow. Just don't lock it all away so completely that they never sense the depth; open your heart, a little at a time, to the one you trust. That deeply hidden sincerity, when it finally reaches them, wins them over completely.",
    sagittarius:
      "You rethink free-spirited love within rather than chasing it outward. Over hunting for a new thrill, you define for yourself what bond you actually want — and only when you set the direction inside does a truly free love arrive. Just don't sketch the ideal so long that you miss the person right beside you; take one more look at who's already here. The love you've defined yourself is what sets you the most free.",
    capricorn:
      "You measure a serious feeling inwardly, for a long time. You won't open until enough trust is built, which is exactly why your love carries so much weight and worth — a heart confirmed over time, once decided, you keep to the end. Just don't take so long that they're left wondering; let the affection show a little more often. A love weighed long and made certain only deepens as the years go by.",
    aquarius:
      "You quietly enjoy your unusual taste inside. Rather than follow the standard script for romance, you build your own way of loving for yourself — a bond you've sketched yourself, never predictable, always so you. Just don't insist on your own way so hard that the other person feels lonely; fold some warmth into the difference. The love you've shaped yourself makes a bond found nowhere else in the world.",
    pisces:
      "You paint romance deep within rather than spreading it outward. Over falling for a sweet fantasy, you work to recognize the real heart inside it — and a love confirmed with the fantasy stripped away is the kind that finally ripens solid. Just don't stay in the ideal so long that you miss the love in front of you; meet the one your heart painted in reality too. When the love you drew so long inside becomes real, it blooms more beautiful than anything.",
  },
  mars: {
    aries:
      "Your force doesn't burst straight out — it stacks up, layer by layer, inside. Rather than collide head-on, you sharpen your resolve and wait, moving at the decisive moment — so the single blow lands heavy and exact. Just don't sharpen it so long that you miss the window entirely; when the moment comes, let it fly without hesitation. The energy you've pressed down inside becomes, at the decisive instant, a force no one can stop.",
    taurus:
      "You firm up your drive slowly, inside, rather than showing it. Unhurried, you sharpen the strength and wait quietly for the moment to ripen — and the force you've built within finally pushes through with a grit nothing can block. Just don't prepare so endlessly that the start keeps getting later; at some point, trust it and push. The strength you've firmed up within is what makes the surest result in the end.",
    gemini:
      "Your energy circles inside, in many strands, before it reaches out. Before you actually make a move, you run the simulation in your head several times first — and thanks to that rehearsal, you move without a single wasted step. Just don't keep spinning it in your mind so long that the doing gets delayed; sometimes let the body move first. The plan you've drawn thoroughly inside clicks into place, gapless, when it finally comes out.",
    cancer:
      "You digest emotional force inwardly rather than blowing it out. Instead of reacting at once, you quietly sharpen your resolve to protect what matters — and that force banked within bursts out strong at the decisive moment. Just don't swallow it all so completely that it rots inside; let the built-up feeling out, safely, now and then. The force you've quietly honed grows strongest exactly when there's something to defend.",
    leo: "You steady your fiery spirit inside rather than showing it off. Before you display it for others' approval, real power rises when you first own it yourself — and a spirit steadied within holds firm, without a wobble. Just don't bottle it so tight that the passion gets stuck and stifled; when the time's right, let it out, bright. The spirit you've claimed for yourself becomes, in the end, the most confident force of all.",
    virgo:
      "You check the plan in your head, again and again, before you act. Over charging in, you close every gap and prepare fully, and only then do you move — so there's rarely a flaw in what you do. Just don't prepare so endlessly that the start keeps slipping; once it's good enough, just move. The execution you've honed carefully inside makes, in the end, the most sure-handed result.",
    libra:
      "You tune your force inside rather than clashing with it. Before you step in directly, you weigh a long time which path would run the smoothest — and thanks to all that measuring, you reach where you meant to gracefully, not roughly. Just don't keep picking the method so long that you miss the moment to act; when the way's clear, step out without hesitation. The approach you've refined within unknots, softly, what force never could.",
    scorpio:
      "Your tenacity sinks to a deeper place instead of surfacing. Calm as you look on the outside, you keep sharpening it to the very end inside — and a force honed that quietly means nothing can stop you. Just don't try to shoulder it all alone until you burn yourself out; let the sharpened force out into the open sometimes. The tenacity you've honed in silence pulls off, in the end, a result no one else could.",
    sagittarius:
      "You question your reaching drive inside before you pour it outward. Rather than expand at random, you set for yourself which way to head first — and thanks to that direction, you go far without wandering. Just don't measure so long that a late start lets the fire cool; once the direction's set, put your foot down at once. The direction you've named yourself is what carries you, in the end, the furthest.",
    capricorn:
      "You refine your strategy inside, for a long time, rather than showing it. Unhurried, you bide the moment and count each move toward the summit — and the patience you've honed within is exactly what makes you win. Just don't wait for the perfect moment so long that you let the chance drift by; if you're ready, take the step. The strategy you've firmed up within becomes, as time runs, a force no one can touch.",
    aquarius:
      "Your unusual drive doesn't burst out — it simmers quietly inside. You push the force to change the rules at your own pace, alone — and honed within like that, you break through in a surprising way no one else managed. Just don't insist so hard on your own method that you miss the people meant to come with you; glance beside you before you pour it all in. That quietly simmered drive shines brightest exactly where a situation is stuck.",
    pisces:
      'Your force feels for its direction inside rather than out. Over stepping straight out, you wait for intuition to ripen and then move quietly — and riding that current, you reach where you wanted, natural as water. Just know that when the goal goes blurry, the force scatters everywhere; name clearly, every so often, where your heart is pointing. The force that moved by intuition finds its own path, in the end, even against the hardest wall.',
  },
  jupiter: {
    aries:
      "You grow opportunity inside rather than hunting for it out there. Over waiting for someone else to hand you a reason, you set for yourself why you're daring this — and a motive built within becomes luck that's truly yours, not borrowed. Just don't sharpen the reason so long inside that you miss the leap; once your mind's made up, step out too. The reason you named yourself is what grows you the most in the end.",
    taurus:
      "You stack abundance inwardly, unhurried. Over chasing anyone's standard, you trust your own senses and widen things your own way — and built up within like that, a wealth arrives that doesn't shake. Just don't wall yourself into your own measure so tightly that you miss a new chance; keep an ear open to the outside current too. The abundance you've firmed up yourself becomes, in the end, the sturdiest foundation.",
    gemini:
      "You deepen learning inward rather than spreading it out. Over piling up new facts, you revisit and digest what you already know — and it's exactly when you chew it over inside that shallow knowledge ripens into real wisdom. Just don't keep it all so internal that you miss the chance to share; take the matured learning out too. The knowing you've digested yourself becomes a wisdom no one can take from you.",
    cancer:
      "You grow blessing within rather than seeking it outside. Over filling up on others' approval, you first fill yourself with the joy of giving — and once you brim from the inside, the fullness spills over on its own. Just don't hold it all so far inward that you forget how to receive; take in, generously, the blessing others hand you too. The heart you've filled yourself becomes, in the end, the sturdiest abundance.",
    leo: "You firm up confidence inside over having it confirmed by others. Over filling on applause, you draw real strength from recognizing yourself — and only a confidence built within opens luck that doesn't waver. Just don't firm it so far inward that you miss the chance to step out; let the confidence you've built show, bright, in the world too. The self-recognition you've forged becomes, in the end, the surest fortune.",
    virgo:
      "You question the meaning of diligence inwardly rather than outwardly. When you refine for yourself and not to be seen, real care wells up — and effort made for your own sake returns as a far greater harvest. Just don't polish it so long inside that you miss the moment to show it; put the thing you did with care out into the world too. The diligence you built for yourself becomes, in the end, the most precious reward.",
    libra:
      "You look for opportunity inside first, not only in relationships. Before you join hands with anyone, you settle for yourself which direction you actually want — and only once you've stood yourself up does a truly good connection arrive. Just don't take so long deciding alone that cooperation slips late; once it's set, take the hand beside you too. The direction you've chosen yourself leads, in the end, to the best meeting.",
    scorpio:
      "You turn your digging force inward rather than out. When crisis hits, you mine its meaning for yourself, descending alone to the bottom — and because you've dug it out yourself, a reward others never reach lands in your hands. Just don't unearth it all alone until you're worn out; share what you've mined, sometimes, out in the open. The force that drew the meaning of crisis up yourself becomes, in the end, the deepest blessing.",
    sagittarius:
      "You explore a wider world inside more than outside. Over following someone else's beliefs, you build your own truth as you go — and only a faith raised within opens the road that's truly yours. Just don't muse so long inside that you miss the chance to head out into the world; carry the ripened conviction on your feet too. The truth you've found yourself carries you, in the end, the very furthest.",
    capricorn:
      "You firm up reward within rather than expecting it out there. Over hoping to be noticed, you quietly keep the responsibility you set yourself — and that responsibility you've shouldered returns, over time, as the surest blessing. Just don't defer the reward so far inward that you wear yourself out; give yourself credit, now and then, for what you've done. The responsibility you've firmed up yourself becomes, in the end, an unshakeable fortune.",
    aquarius:
      "You turn a new attempt over quietly inside. You decide for yourself what the unusual road even means, refining it alone — and only an attempt you've defined yourself swings open a door no one saw coming. Just don't roll it around so long inside that you miss the moment to put it out; toss the ripened idea into the world too. The meaning you've set yourself brings, in the end, an unexpected chance.",
    pisces:
      "You paint abundance within, through imagination, first. Before you give outward, you fill up the faith inside you — and only a faith you've filled yourself is the kind that eventually turns real. Just don't stay so long in imagination that you miss the actual chance; unfold the picture you've drawn out in the world too. The faith you've filled yourself blooms, in the end, into abundance right before your eyes.",
  },
  saturn: {
    aries:
      "You master your impulse yourself, not by anyone else's rule. Over the rules imposed from outside, you rein yourself in by your own inner principle — and a restraint you've built yourself hardens so no one can shake it. Just don't tie yourself down so tightly that you can't breathe; leave a little room between the rules. The restraint you've grown yourself is exactly what makes you truly strong.",
    taurus:
      "You stack solidity inward, over a long time. Even without anyone's approval, you quietly learn to stay unshaken — and roots you've firmed up within sink deep, whatever the wind. Just don't hold the line so alone that you wear yourself out; let a hand help you now and then. The solidity you've built yourself becomes, in the end, the deepest root.",
    gemini:
      "You question the duty of your words and learning inside. Over straining to be recognized, you quietly work to deepen yourself — and only knowledge hardened within makes your understanding real. Just don't let the pressure to know everything seal your mouth shut; find the nerve to share even when you're unsure. The thinking you've deepened yourself takes on a weight that lasts.",
    cancer:
      "You bear the weight of protecting inward, over handing it off. Over leaning on someone, you set out to be the sturdy shelter yourself — and only a shelter you've built yourself brings you real stability. Just don't always be the one holding things up until you lose your own place to rest; make somewhere to lean, too. The weight you've shouldered yourself becomes, in the end, the sturdiest refuge.",
    leo: "You build confidence within, over outside applause. In humility, you quietly learn to affirm yourself — and a light lit inside never goes out, even without anyone's eyes on you. Just don't stifle the wish to be seen so hard that you shrink; don't be stingy with your own praise. The confidence you've built yourself becomes, in the end, the longest-lasting glow.",
    virgo:
      "You aim your standard for perfection at yourself. Over the watching eye, you firm up diligence by your own measure — and only a bar you've set yourself lets real trust root. Just know that bar can crush you sometimes; remind yourself that the imperfect you is already enough. The diligence you've built yourself becomes, in the end, an unshakeable trust.",
    libra:
      "You retrace the duty of a relationship inside. Over straining to fit in, you set your own fairness — and only a balance you've built within makes a bond that truly lasts. Just don't cling to principle so hard that your heart turns stiff; carry fairness and warmth together. The fairness you've built yourself makes, in the end, an unshakeable connection.",
    scorpio:
      "You turn the force of restraint deeper, inward. You learn, alone, to master yourself and endure a crisis — and a restraint honed within means nothing can topple you. Just don't shoulder it all alone until you rot inside; share the heavy load now and then. The force you've mastered yourself is exactly what carries you through any trial.",
    sagittarius:
      "You question the duty of your belief inside. Over taking someone else's truth as given, you stand on a faith you've tested yourself — and only a conviction you've confirmed hardens without a wobble. Just don't grow so certain that you push other people's truths away; keep an ear open to voices past your own. The belief you've tested yourself becomes, in the end, a center no one can shake.",
    capricorn:
      "You grow even stricter with yourself, from within. Over outer achievement, you truly harden when you build your own principle — and set up inside like that, you're reborn a genuinely sturdy adult. Just don't whip yourself so endlessly that you burn out; give the you who's come this far some kindness. The principle you've set yourself becomes, in the end, a you that no one can shake.",
    aquarius:
      "You forge the force to ground your ideals within. You build an unusual structure not by someone's method but by your own principle — and only a frame you've raised yourself makes the dream into a system that doesn't shake. Just don't wall yourself into your own principle so tightly that you miss the people to build with; check the structure against the outside too. The power to realize you've honed yourself, in the end, changes the world's rules.",
    pisces:
      "You hold your center within the haze, inward. Over leaning outward, you quietly shoulder the duty of devotion yourself — and only an anchor you've dropped within makes your tenderness sturdy. Just don't try to carry it all alone until you wear out; share the heavy load now and then. The responsibility you've shouldered yourself completes, in the end, a tenderness that isn't soft.",
  },
  uranus: {
    aries:
      "Your mold-breaking force simmers inside rather than bursting out. Before you step out in front of anyone, you quietly redesign your own freedom, forging real innovation alone — and honed within like that, it's a change far more fundamental than any surface show. Just don't let it simmer so long that you miss the moment to release it; set the innovation off in the world too. The freedom you've quietly redesigned becomes, in the end, the force that flips the board.",
    taurus:
      "You turn change over inside, unhurried. Within the familiar, you quietly craft your own innovation — and a newness firmed up within holds steady without any fanfare. Just don't roll it so slowly that you miss the moment; when it's ripe, bring it out boldly. The change you've crafted inside becomes, in the end, the surest way you reshape the world.",
    gemini:
      'Your flashes spread more inside than out. Even when it looks different, you dig your own idea to the very end alone — and a thought honed within lands, in the end, on an original conclusion. Just know that kept only in your head, the sparkle scatters; take the ripened thought out and share it. The idea you dug into alone shows its real force the moment it reaches the world.',
    cancer:
      "You experiment with new ways of feeling inwardly. Over changing the surface, you quietly swap out old frames within your own heart — and rebuilt inside like that, your own shelter turns new. Just don't experiment so only inside that you drift from the people beside you; share the new way with them too. The warmth you've quietly changed becomes, for someone, a brand-new comfort.",
    leo: "You firm up your individuality inside over showing it off. Before it's recognized as different, you enjoy it yourself first — and a self honed within only grows more vivid and clear. Just don't keep it so far inward that no one ever sees the charm; let the color you've honed show outside too. The individuality you've enjoyed yourself becomes, in the end, a charm no one can replace.",
    virgo:
      "You overhaul how you work in your head first. Over the outer rules, you rebuild the process by your own inner efficiency — and reworked within, it quietly flips the whole board. Just don't fix it only in your head so long that you miss the moment to apply it; put the improvement to use out there too. The efficiency you've built yourself becomes, in the end, what makes everyone's life easier.",
    libra:
      "You picture new forms of bond inside first. Before you experiment outward, you define for yourself what your freedom even is — and only once you've set it within does a true balance click. Just don't sketch it all alone until you drift from the other person; fit the form you drew together with them too. The freedom you've defined yourself makes, in the end, a healthier bond.",
    scorpio:
      "You turn your foundation-shaking force to a deeper place. Quietly — but from the inside out — you spark a revolution, and a change dug from the root runs deepest and fiercest of all. Just don't try to overturn it all alone until you lose what's worth keeping; picture what you'll build after you break it. The revolution you raised from within is exactly what lets the old be reborn.",
    sagittarius:
      "You widen your border-crossing thought inside. Over the outer trend, you draw your own image of the future for yourself — and only a future sketched within grows a truly free way of thinking. Just don't draw it all so internal that you miss the chance to share; unfold the future you drew out in the world too. The horizon you've sketched yourself is what pulls the world's thinking forward.",
    capricorn:
      "You tear down old structures inside first. Over following the outer system, you build your own principle — and rebuilt within, that reconstruction is solid from the root. Just don't take so long rebuilding it alone; carry a long breath over impatience. The principle you've set yourself changes, in the end, the very skeleton of the times.",
    aquarius:
      "Your vision ahead of its time grows quietly inside. Over competing with others, you push your originality all the way yourself — and a vision honed alone reaches a future no one else could draw. Just know that racing too far ahead can leave the people beside you behind; slow down and walk with them sometimes. The originality that grew quietly within becomes, someday, everyone's obvious.",
    pisces:
      'You dissolve borders within, through imagination. Before you unfold it outward, you first grow a new dream inside — and a dream grown within opens a possibility no one else saw. Just know that stay only in imagination and it loses its shape; pin a small foothold onto the dream. The imagination you grew inside widens the world the moment it comes out.',
  },
  neptune: {
    aries:
      "You forge the ideal within rather than chasing it out there. Clearing away the fantasy, you recognize for yourself the dream you truly want — and only a longing forged within becomes a force that doesn't shake. Just don't forge it so long inside that you keep postponing the action; move the confirmed dream onto your feet at once. The dream you've recognized yourself pulls, in the end, imagination into reality.",
    taurus:
      "You find beauty in your heart over the senses outside. Over surface romance, a comfort drawn up from within fills you far longer — and a beauty steeped inside doesn't fade easily. Just don't sink so far inward that you miss the joys of reality; savor the romance you can touch, too. The comfort you've drawn up yourself becomes, in the end, the deepest satisfaction.",
    gemini:
      "You grow imagination inside over putting it into words. Before you unfold the story out in the world, you savor it yourself a long time — and a world ripened within grows deeper and richer. Just don't savor it so only inside that you miss the chance to share; bring the ripened story out too. The imagination you've grown yourself colors people's hearts the moment it comes out.",
    cancer:
      "You hold empathy deep within. Before you're swept up in someone else's heart, you guard your own emotional boundary first — and only once you've protected yourself can you love in a healthy way. Just don't build the wall so high that your heart grows lonely; find the balance of guarding and sharing. The boundary you've kept yourself guards, in the end, your tenderness for a long time.",
    leo: "You quietly burn creative inspiration inside. Over straining for recognition, you immerse fully in the expression itself — and it's when you lose yourself in it purely that real art is born. Just don't burn it so only inside that you miss the chance to show it; let the inspiration you've kindled out too. The flame you've burned yourself leaves, in the end, your own color on the world.",
    virgo:
      "You question the meaning of devotion inwardly. Before you save anyone, you refine your own ideal into reality first — and only a devotion you've firmed up yourself becomes real force. Just don't question it so only inside that you forget to tend yourself; spend some of that care on you, too. The devotion you've firmed up yourself quietly makes, in the end, the world well.",
    libra:
      "You picture an ideal love within. Over leaning on fantasy, you recognize for yourself what real harmony is — and only a love you've recognized inside finally turns real. Just don't sketch the ideal so long that you miss the love in front of you; meet the love you drew in reality too. The harmony you've recognized yourself becomes, in the end, a real beauty.",
    scorpio:
      "You sink into mystery at a deeper place. You face the unseen alone within — and from where you've reached by yourself, an insight others can't gain comes to find you. Just don't sink so deep into the dark that your heart grows heavy; come up to the sunlit surface now and then. The insight you've drawn up alone lights, in the end, a beauty no one else could see.",
    sagittarius:
      "You ask a great truth inside over seeking it out there. Clearing away others' beliefs, you go looking for your own meaning — and only a meaning you've found yourself lets a real faith take hold. Just don't ask it so only inside that the answer just circles; test the ripened question out in the world too. The meaning you've found yourself becomes, in the end, an unshakeable belief.",
    capricorn:
      "You forge the force to build ideals into structure within. Over the surface dream, you firm up the inner frame first — and only what you've firmed up inside keeps your ideal from collapsing. Just don't cling to the frame so hard that you forget the first dream; revisit why you started too. The structure you've raised yourself makes, in the end, the dream something you can see.",
    aquarius:
      "You quietly hold an ideal for everyone inside. Before you cry it out loud, you first build the faith yourself — and only a faith you've set inside gives the dream real force. Just don't hold it so only inside that you miss the people to build with; share the ideal you're holding out too. The faith you've built yourself changes, in the end, the world into a kinder place.",
    pisces:
      "Your imagination and spirit reach deep inward. When you clear away the outer illusion, real inspiration finally sharpens into focus — and a sensitivity purified within runs endlessly clear and deep. Just know that sink only inward and you lose your way in reality; drop a small anchor onto the inspiration. The spirit you've cleared inside quietly soothes, in the end, the world.",
  },
  pluto: {
    aries:
      "You turn the force of rebirth inward. Over clashing with the outside, you quietly rebuild yourself — and a change raised within is real from the very root. Just don't try to carry it all alone until you wear out; take a hand beside you on the way back up. The force you've quietly rebuilt lifts you, in the end, from any ending.",
    taurus:
      "You change values from the root, within. Over surface security, you question what your own true worth even is — and rebuilt inside, a foundation that doesn't shake stands new. Just know that a grip you can't loosen makes change drag; remember that letting go is a strength too. The worth you've questioned yourself becomes, in the end, the sturdiest root.",
    gemini:
      "The force to mine truth deepens inside you. Over flipping it with words, you dig for the answer yourself — and mined alone, you land on a truth no one else saw. Just don't unearth it alone until your heart grows heavy; let the truth you've dug out into the open sometimes. The answer you've found yourself rewrites, in the end, the story the world tells.",
    cancer:
      "You face emotional wounds inwardly. Over showing it on the outside, you heal deeply alone — and only after facing it yourself are you quietly reborn a new person. Just don't shoulder it all alone until you wear out; lean the ache on a hand beside you sometimes. The healing you've done alone frees you, in the end, from the very root.",
    leo: "You undergo breaking and rebuilding the self inside. Over flaunting your presence, you quietly remold yourself — and a self remade within grows far sturdier than the surface. Just don't hide the weak moments to look strong; accept the crumbling you exactly as it is. The self you've quietly remade becomes, in the end, a force that never fades.",
    virgo:
      "You overhaul daily life and body from within. Over changing the surface, you purify your own habits at the root — and reworked inside, your whole life quietly shifts. Just know that obsessing over fixing yourself turns into self-punishment; remind yourself that today's you is fine. The habits you've purified yourself make you, in the end, a different person.",
    libra:
      "You rework the force of a relationship inside. Over clashing outward, you lay the root of balance again yourself — and only after re-laying it within does a bond get reborn healthy. Just don't dig into the underside so far that you wear out; hold onto some grace to trust over excavate. The balance you've re-laid yourself makes, in the end, a sturdier bond.",
    scorpio:
      "You undergo a full rebirth in a deeper place. Unseen by others — but from the very root — you change yourself, and a transformation you've lived through alone is fiercer than anything. Just don't sink alone into the dark until you burn up; rise to the light as much as you go under. The rebirth you achieved unseen makes you, in the end, someone nothing can shake.",
    sagittarius:
      "You shake your belief from within. Over chasing an outer truth, you rebuild your worldview yourself — and rebuilt inside, an unshakeable faith grows. Just don't doubt everything until you lose the ground to stand on; after you shake it, build a new belief too. The worldview you've rebuilt yourself leads you, in the end, into real wisdom.",
    capricorn:
      "You question structure and power inside. Over the outer seat, you change your own inner force at the root — and only after rebuilding it within do you become truly unshakeable. Just don't cling to power until you lose the actual people; keep, always, what the power is for. The force you've questioned yourself becomes, in the end, a cornerstone of the times.",
    aquarius:
      "You topple the old system in your heart first. Over the outer upheaval, you build your own conviction anew — and only a change begun inside becomes a real revolution. Just don't try to overturn it all alone until you lose the people meant to come with you; carry human warmth into the change. The conviction you've built yourself becomes, in the end, the force that opens the next era.",
    pisces:
      "You purify the unconscious deep within. You face an unseen wound alone, descending to the very bottom — and only after purifying it yourself are you reborn, new, from the root. Just know that sink too far into the invisible and you lose your way in reality; plant a foot in the here and now too. The depth you've purified alone becomes a seed that quietly changes the world.",
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
