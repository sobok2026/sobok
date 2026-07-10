// Placement-based readings: one line per planet-in-sign, per locale. Kept out of
// the shared next-intl bundle (it would bloat every route) and looked up directly
// by the client component via the active locale.

import type { PublicLocale } from '@sobok/domain/locale'

import type { AspectType, PlanetId, SignId } from './chart'

type SignText = Record<SignId, string>
type PlanetReadings = Record<PlanetId, SignText>

const KO: PlanetReadings = {
  sun: {
    aries: '나답게 앞장서 시작할 때 가장 빛나요. 도전이 곧 당신의 정체성이에요.',
    taurus: '천천히, 끝까지 쌓아 올리는 사람. 흔들리지 않는 안정감이 당신의 힘이에요.',
    gemini: '호기심과 재치로 세상을 연결해요. 배우고 나눌 때 살아있음을 느껴요.',
    cancer: '아끼는 사람을 지킬 때 진짜 내가 돼요. 따뜻한 마음이 삶의 중심이에요.',
    leo: '무대 위에서 빛나는 사람. 당당한 자신감이 사람들을 끌어당겨요.',
    virgo: '섬세하게 다듬어 완성하는 사람. 정성과 성실이 당신의 서명이에요.',
    libra: '조화와 균형 속에서 나를 찾아요. 관계가 곧 당신의 무대예요.',
    scorpio: '본질을 깊이 파고드는 사람. 강렬한 몰입이 당신만의 색이에요.',
    sagittarius: '더 넓은 세계로 향할 때 자유로워요. 모험과 이상이 당신을 이끌어요.',
    capricorn: '묵묵히 정상까지 오르는 사람. 책임감과 끈기가 곧 당신이에요.',
    aquarius: '남다른 시선으로 미래를 그려요. 독창성이 당신의 핵심이에요.',
    pisces: '감성과 상상으로 세상을 품어요. 깊은 공감이 당신의 빛이에요.',
  },
  moon: {
    aries: '감정이 솔직하고 빨라요. 마음이 향하면 곧장 움직여요.',
    taurus: '느긋하고 한결같은 감정. 편안함과 안정 속에서 충전돼요.',
    gemini: '감정도 호기심을 따라 가볍게 오가요. 이야기로 마음을 풀어요.',
    cancer: '깊고 촉촉한 감정. 보살피고 보살핌받을 때 가장 안심해요.',
    leo: '감정이 따뜻하고 극적이에요. 사랑받는다고 느낄 때 활짝 피어나요.',
    virgo: '조용히 챙기며 마음을 표현해요. 정돈된 일상에서 안정돼요.',
    libra: '평화로운 관계 속에서 마음이 놓여요. 다툼은 유난히 힘들어해요.',
    scorpio: '감정이 깊고 강렬해요. 한번 마음을 주면 끝까지 가요.',
    sagittarius: '자유로울 때 마음이 편해요. 새로운 경험이 곧 위로가 돼요.',
    capricorn: '감정을 안으로 다스려요. 든든함으로 사랑을 표현해요.',
    aquarius: '한 발짝 떨어져 감정을 바라봐요. 자유로움이 곧 안정이에요.',
    pisces: '감정이 여리고 잘 스며들어요. 남의 마음까지 내 것처럼 느껴요.',
  },
  mercury: {
    aries: '생각이 빠르고 직설적이에요. 떠오르면 바로 말하고 실행해요.',
    taurus: '한 번 정리하면 흔들리지 않아요. 신중하고 실용적인 판단을 해요.',
    gemini: '말과 아이디어가 샘솟아요. 여러 주제를 재치있게 넘나들어요.',
    cancer: '기억력이 좋고 감정으로 이해해요. 분위기를 먼저 읽어요.',
    leo: '자신감 있게 표현해요. 이야기에 힘과 드라마가 실려요.',
    virgo: '핵심을 짚는 분석력. 디테일까지 놓치지 않고 정리해요.',
    libra: '균형 잡힌 말로 사람을 설득해요. 대화에서 조화를 만들어요.',
    scorpio: '숨은 의도까지 꿰뚫어요. 말수는 적어도 통찰이 깊어요.',
    sagittarius: '큰 그림과 의미를 이야기해요. 솔직하고 거침없어요.',
    capricorn: '체계적이고 신뢰가 가는 말투. 결론까지 야무지게 정리해요.',
    aquarius: '틀을 깨는 발상이 번뜩여요. 신선한 관점으로 사람을 사로잡아요.',
    pisces: '이미지와 느낌으로 생각해요. 은유와 상상이 풍부해요.',
  },
  venus: {
    aries: '사랑에 솔직하고 적극적이에요. 끌리면 먼저 다가가요.',
    taurus: '감각적이고 한결같은 사랑. 편안함과 스킨십을 소중히 해요.',
    gemini: '재치있는 대화에 설레요. 가볍고 즐거운 만남을 좋아해요.',
    cancer: '깊이 아끼고 보듬는 사랑. 안정된 관계에서 마음을 열어요.',
    leo: '화려하고 뜨거운 사랑. 아낌없이 표현하고 표현받고 싶어요.',
    virgo: '작은 배려로 마음을 전해요. 정성 어린 사랑을 해요.',
    libra: '조화롭고 우아한 사랑. 함께하는 아름다움을 즐겨요.',
    scorpio: '깊고 강렬하게 빠져들어요. 전부를 거는 사랑을 해요.',
    sagittarius: '자유롭고 솔직한 사랑. 함께 모험할 사람에게 끌려요.',
    capricorn: '진중하고 오래가는 사랑. 신뢰로 관계를 쌓아요.',
    aquarius: '독특하고 자유로운 사랑. 친구 같은 연인을 좋아해요.',
    pisces: '낭만적이고 헌신적인 사랑. 깊이 스며드는 관계를 꿈꿔요.',
  },
  mars: {
    aries: '폭발적인 추진력. 망설임 없이 정면 돌파해요.',
    taurus: '느리지만 멈추지 않는 뚝심. 끝까지 밀어붙여요.',
    gemini: '여러 일을 동시에 재빠르게. 말과 아이디어로 승부해요.',
    cancer: '소중한 것을 지킬 때 강해져요. 감정이 곧 추진력이에요.',
    leo: '당당하고 화끈하게 도전해요. 주목받을 때 힘이 나요.',
    virgo: '정확하고 꼼꼼하게 밀어붙여요. 실력으로 증명해요.',
    libra: '부드럽게, 그러나 끈질기게. 관계를 통해 움직여요.',
    scorpio: '조용하지만 강렬한 집념. 한번 정하면 끝을 봐요.',
    sagittarius: '거침없이 도전하고 확장해요. 자유가 원동력이에요.',
    capricorn: '전략적으로 정상을 향해요. 인내가 최고의 무기예요.',
    aquarius: '남다른 방식으로 돌파해요. 규칙을 바꾸며 나아가요.',
    pisces: '조용히 흐르듯 움직여요. 직감을 따라 방향을 잡아요.',
  },
  jupiter: {
    aries: '용감하게 도전할 때 행운이 따라와요. 개척이 곧 성장이에요.',
    taurus: '꾸준함과 안정이 풍요를 불러와요. 감각을 믿으면 커져요.',
    gemini: '배움과 인맥이 기회를 넓혀요. 호기심이 곧 자산이에요.',
    cancer: '베풀고 보살필 때 복이 돌아와요. 가정과 정이 힘이에요.',
    leo: '당당하게 나설 때 운이 트여요. 자신감이 곧 행운이에요.',
    virgo: '성실하게 다듬을 때 결실이 커져요. 봉사가 복을 불러요.',
    libra: '좋은 관계 속에서 기회가 자라요. 협력이 행운의 열쇠예요.',
    scorpio: '깊이 파고들 때 크게 얻어요. 위기를 기회로 바꿔요.',
    sagittarius: '넓은 세계로 향할 때 운이 커져요. 이상과 모험이 복이에요.',
    capricorn: '책임과 노력이 크게 보상받아요. 시간이 편이 돼요.',
    aquarius: '새로운 시도가 문을 열어요. 남다름이 곧 기회예요.',
    pisces: '베풀고 믿을 때 풍요가 흘러요. 상상이 현실을 넓혀요.',
  },
  saturn: {
    aries: '충동을 다스릴수록 강해져요. 인내를 배우는 자리예요.',
    taurus: '느려도 단단하게 쌓아요. 꾸준함이 결국 이겨요.',
    gemini: '말과 배움에 책임을 져요. 깊이 있는 사고로 성숙해요.',
    cancer: '감정과 가정을 스스로 지켜요. 든든한 울타리가 돼요.',
    leo: '겸손 속에서 진짜 자신감을 배워요. 노력으로 빛나요.',
    virgo: '완벽을 향한 엄격함. 성실함이 신뢰를 만들어요.',
    libra: '관계 속 책임을 배워요. 공정함으로 균형을 잡아요.',
    scorpio: '깊은 통제와 절제. 위기를 견디며 단단해져요.',
    sagittarius: '신념에 책임을 져요. 배움을 현실로 다져요.',
    capricorn: '스스로에게 엄격한 승부사. 시간이 지날수록 단단해져요.',
    aquarius: '이상을 현실로 만드는 끈기. 구조를 바꾸며 성장해요.',
    pisces: '흐릿함 속에서 중심을 잡아요. 헌신에 책임을 더해요.',
  },
  uranus: {
    aries: '틀을 깨고 새 길을 여는 개척자. 자유가 곧 혁신이에요.',
    taurus: '익숙함 속에서 변화를 만들어요. 안정된 혁신을 추구해요.',
    gemini: '번뜩이는 아이디어로 판을 바꿔요. 생각의 자유가 남달라요.',
    cancer: '감정과 가정의 새 방식을 찾아요. 남다른 온기를 지녀요.',
    leo: '독창적인 개성으로 빛나요. 나만의 무대를 만들어요.',
    virgo: '일하는 방식을 혁신해요. 실용적인 발명가예요.',
    libra: '관계와 균형의 새 형태를 실험해요. 자유로운 조화를 꿈꿔요.',
    scorpio: '근본을 뒤흔드는 변화. 깊은 곳에서 혁명을 일으켜요.',
    sagittarius: '경계를 넘는 자유로운 사상. 미래의 지평을 넓혀요.',
    capricorn: '낡은 구조를 뒤집어요. 체제를 새로 세우는 개혁가예요.',
    aquarius: '시대를 앞서가는 시선. 독창성이 곧 본질이에요.',
    pisces: '상상과 영감으로 경계를 허물어요. 새로운 꿈을 열어요.',
  },
  neptune: {
    aries: '이상을 향해 뜨겁게 몰입해요. 꿈을 행동으로 옮겨요.',
    taurus: '감각으로 아름다움을 빚어요. 현실 속 낭만을 찾아요.',
    gemini: '상상과 언어가 어우러져요. 이야기로 마법을 만들어요.',
    cancer: '깊은 공감과 보살핌. 마음으로 세상을 감싸요.',
    leo: '창조적 영감으로 빛나요. 예술과 표현에 마음이 흘러요.',
    virgo: '섬세한 헌신으로 돕고 치유해요. 이상을 현실에 녹여요.',
    libra: '조화와 아름다움을 꿈꿔요. 이상적인 사랑을 그려요.',
    scorpio: '신비와 깊이에 매혹돼요. 보이지 않는 것을 느껴요.',
    sagittarius: '더 큰 의미와 진리를 좇아요. 영적인 모험을 즐겨요.',
    capricorn: '이상을 구조로 실현해요. 꿈에 현실의 뼈대를 세워요.',
    aquarius: '모두를 위한 이상을 꿈꿔요. 인류애가 상상을 넓혀요.',
    pisces: '상상과 영성이 넓게 뻗어가요. 경계 없는 공감을 지녀요.',
  },
  pluto: {
    aries: '뜨거운 의지로 자신을 재탄생시켜요. 위기 속에 강해져요.',
    taurus: '가치와 안정을 근본부터 바꿔요. 뿌리 깊은 변형이에요.',
    gemini: '생각과 말의 힘으로 판을 뒤집어요. 진실을 파고들어요.',
    cancer: '감정과 뿌리를 깊이 치유해요. 가족의 상처를 변형시켜요.',
    leo: '자아를 부수고 다시 세워요. 강렬한 존재감을 지녀요.',
    virgo: '일상과 몸을 근본부터 바꿔요. 정화하고 재건해요.',
    libra: '관계를 근본부터 변형시켜요. 권력의 균형을 재편해요.',
    scorpio: '깊은 곳에서 완전히 다시 태어나요. 통찰의 힘이 강렬해요.',
    sagittarius: '신념을 뒤흔들어 진실을 찾아요. 세계관을 재건해요.',
    capricorn: '구조와 권력을 근본부터 바꿔요. 위기를 통해 강해져요.',
    aquarius: '낡은 체제를 무너뜨려요. 집단의 변혁을 이끌어요.',
    pisces: '보이지 않는 것을 변형시켜요. 무의식을 깊이 정화해요.',
  },
  northNode: {
    aries:
      '스스로 앞장서고 나만의 용기를 내는 법을 배우는 방향이에요. 남에게 기대기보다 내 이름으로 첫발을 뗄 때 영혼이 자라나요.',
    taurus:
      '흔들림 없이 나만의 속도로 가치를 쌓는 법을 배워요. 조급함을 내려놓고 지금 가진 것을 누릴 때 마음이 단단해져요.',
    gemini:
      '호기심을 열고 배우고 소통하는 법을 익히는 방향이에요. 하나의 답을 고집하기보다 여러 이야기에 귀 기울일 때 세계가 넓어져요.',
    cancer:
      '마음을 열고 보살피며 뿌리내리는 법을 배워요. 성과로 나를 증명하기보다 감정을 있는 그대로 느낄 때 편안해져요.',
    leo: '나답게 빛나고 마음을 표현하는 용기를 키우는 방향이에요. 뒤에 숨지 말고 무대 위에서 나를 드러낼 때 진짜 기쁨을 만나요.',
    virgo:
      '차근차근 다듬고 현실에 발붙이는 법을 배워요. 막연한 이상에 흐르기보다 오늘 할 일을 정성껏 해낼 때 삶이 정돈돼요.',
    libra: '혼자보다 함께, 조화와 관계를 배우는 방향이에요. 내 방식을 고집하기보다 상대와 균형을 맞출 때 더 멀리 가요.',
    scorpio:
      '깊이 몰입하고 진짜 변화를 마주하는 법을 배워요. 편안함에 안주하지 말고 두려운 곳까지 파고들 때 새로 태어나요.',
    sagittarius:
      '더 넓은 세계와 나만의 신념을 찾아 나서는 방향이에요. 남의 생각을 좇기보다 스스로 의미를 물을 때 길이 열려요.',
    capricorn:
      '책임지고 스스로 성취를 쌓는 어른이 되는 방향이에요. 기대고 싶은 마음을 넘어 내 몫을 감당할 때 단단해져요.',
    aquarius:
      '나를 넘어 공동체와 미래를 향해 나아가는 방향이에요. 인정받으려는 마음을 내려놓고 모두를 위해 손 내밀 때 자유로워져요.',
    pisces:
      '내려놓고 믿고 흐름에 맡기는 법을 배우는 방향이에요. 모든 걸 통제하려 애쓰기보다 마음을 비울 때 평화가 찾아와요.',
  },
  southNode: {
    aries: '앞뒤 없이 혼자 돌진하는 게 익숙한 자리예요. 그 용기는 지키되, 이제 곁을 돌아보고 함께 가는 법을 배워요.',
    taurus: '익숙함과 안정에 머무는 게 편한 자리예요. 그 든든함은 간직하되, 변화 앞에서 조금씩 마음을 열어봐요.',
    gemini: '말과 정보로 가볍게 겉도는 게 익숙해요. 재치는 그대로 두되, 한 가지를 깊이 파고드는 뚝심을 길러봐요.',
    cancer: '기대고 보호받는 게 익숙한 자리예요. 그 다정함은 지키되, 이제 스스로 서는 힘을 조금씩 키워봐요.',
    leo: '주목받아야 안심되는 게 익숙해요. 그 빛남은 그대로 두되, 무대 밖에서도 충분히 괜찮은 나를 만나봐요.',
    virgo: '완벽하게 챙기고 걱정하는 게 습관인 자리예요. 그 성실함은 아끼되, 가끔은 믿고 놓아주는 여유를 배워봐요.',
    libra: '남에게 맞추는 게 익숙한 자리예요. 그 배려는 지키되, 이제 내 목소리를 또렷이 내는 연습을 해봐요.',
    scorpio: '통제하고 깊이 얽히는 게 익숙해요. 그 강렬함은 간직하되, 가끔은 힘을 빼고 가볍게 놓아줘봐요.',
    sagittarius: '자유롭게 떠도는 게 편한 자리예요. 그 넓은 시야는 그대로 두되, 한자리에 뿌리내리는 안정도 배워봐요.',
    capricorn: '성취와 통제로 나를 증명하려는 게 익숙해요. 그 책임감은 지키되, 이제 마음부터 먼저 챙겨줘봐요.',
    aquarius: '거리 두고 관찰하는 게 익숙한 자리예요. 그 객관성은 간직하되, 이제 가까이 다가가 마음을 나눠봐요.',
    pisces: '흘려보내고 도피하는 게 익숙해요. 그 부드러움은 지키되, 이제 현실에 두 발을 붙이는 힘을 길러봐요.',
  },
  fortune: {
    aries: '용감하게 시작하고 도전할 때 운이 트이는 자리예요. 남보다 먼저 나설 때 기쁨과 복이 함께 따라와요.',
    taurus: '천천히 쌓고 감각을 누릴 때 기쁨이 커지는 자리예요. 서두르지 않고 지금을 음미할 때 복이 흘러들어요.',
    gemini: '배우고 나누고 연결될 때 행운이 따라오는 자리예요. 호기심을 따라 사람과 이야기를 이을 때 운이 열려요.',
    cancer: '아끼고 보살피는 관계 속에서 복이 흐르는 자리예요. 마음을 나누고 정을 쌓을 때 기쁨이 돌아와요.',
    leo: '당당히 나를 드러내고 즐길 때 운이 빛나는 자리예요. 마음껏 표현하고 사랑받을 때 복이 환하게 열려요.',
    virgo: '정성껏 다듬고 도울 때 기쁨과 복이 오는 자리예요. 작은 일을 성실히 해낼 때 운이 차곡차곡 쌓여요.',
    libra: '좋은 관계와 조화 속에서 행운이 자라는 자리예요. 함께하는 아름다움을 누릴 때 복이 피어나요.',
    scorpio: '깊이 몰입하고 변화할 때 운이 터지는 자리예요. 두려움 없이 파고들 때 뜻밖의 복을 만나요.',
    sagittarius: '넓은 세상으로 나아갈 때 기쁨과 운이 커지는 자리예요. 낯선 곳으로 발을 뻗을 때 행운이 마중 나와요.',
    capricorn: '성실하게 쌓아 올릴 때 복이 돌아오는 자리예요. 묵묵히 책임을 다할 때 운이 든든하게 따라와요.',
    aquarius: '남다른 길과 좋은 사람들 속에서 운이 열리는 자리예요. 나만의 방식을 믿고 나아갈 때 복이 찾아와요.',
    pisces: '베풀고 상상하고 흐름에 맡길 때 복이 흐르는 자리예요. 마음을 비우고 내어줄 때 뜻밖의 행운이 스며들어요.',
  },
}

const EN: PlanetReadings = {
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

const ZH: PlanetReadings = {
  sun: {
    aries: '带头开创时最耀眼，挑战就是你的身份。',
    taurus: '慢慢地、稳稳地累积，不动摇的安定是你的力量。',
    gemini: '用好奇与机智连接世界，学习与分享时最鲜活。',
    cancer: '守护所爱时才是真正的你，温暖的心是生命的中心。',
    leo: '天生的舞台之王，坦然的自信吸引众人。',
    virgo: '细致打磨到完美，用心与踏实是你的签名。',
    libra: '在和谐与平衡中找到自己，关系就是你的舞台。',
    scorpio: '深入本质的人，强烈的专注是你独有的色彩。',
    sagittarius: '奔向更广阔世界时最自由，冒险与理想引领着你。',
    capricorn: '默默登上顶峰，责任与坚持就是你。',
    aquarius: '用独特视角描绘未来，独创性是你的核心。',
    pisces: '用感性与想象拥抱世界，深切的共情是你的光。',
  },
  moon: {
    aries: '情感真诚而迅速，心之所向便立刻行动。',
    taurus: '悠然而恒定的情感，在舒适与安定中充电。',
    gemini: '情绪随好奇轻快流转，用言语抒发内心。',
    cancer: '深而柔软的情感，照顾与被照顾时最安心。',
    leo: '温暖而戏剧化的情感，被爱时便灿烂绽放。',
    virgo: '默默照料来表达心意，规整的日常让你安定。',
    libra: '在平和的关系中安心，格外害怕争执。',
    scorpio: '情感深而强烈，一旦交心便走到最后。',
    sagittarius: '自由时最自在，新体验就是慰藉。',
    capricorn: '把情绪收于心中，用可靠表达爱。',
    aquarius: '退一步旁观情感，自由即是安定。',
    pisces: '情感柔软易渗透，连别人的心也感同身受。',
  },
  mercury: {
    aries: '思维快而直接，想到就立刻说、立刻做。',
    taurus: '一旦想清便不动摇，判断慎重而务实。',
    gemini: '话语与灵感涌现，机智地穿梭于各种话题。',
    cancer: '记性好，用情感去理解，先读懂气氛。',
    leo: '自信地表达，言谈中带着力量与戏剧性。',
    virgo: '一针见血的分析力，连细节都整理得妥帖。',
    libra: '用均衡的话语说服人，在对话中创造和谐。',
    scorpio: '看穿隐藏的意图，话虽少却洞察极深。',
    sagittarius: '谈论大格局与意义，坦率而无所顾忌。',
    capricorn: '有条理、值得信赖的口吻，把结论收得利落。',
    aquarius: '打破框架的灵感闪现，用新鲜视角吸引人。',
    pisces: '用意象与感觉思考，比喻与想象丰富。',
  },
  venus: {
    aries: '爱得直率而主动，被吸引就先靠近。',
    taurus: '感官而恒定的爱，珍视舒适与亲密。',
    gemini: '为机智的对话心动，喜欢轻松愉快的相处。',
    cancer: '深深呵护的爱，在安稳的关系中敞开心。',
    leo: '绚烂而炽热的爱，毫不吝啬地付出与被爱。',
    virgo: '用小小体贴传达心意，做着用心的爱。',
    libra: '和谐而优雅的爱，享受共处的美好。',
    scorpio: '深而强烈地陷入，做着倾其所有的爱。',
    sagittarius: '自由而坦率的爱，被能一起冒险的人吸引。',
    capricorn: '稳重而长久的爱，用信任累积关系。',
    aquarius: '独特而自由的爱，喜欢像朋友的恋人。',
    pisces: '浪漫而奉献的爱，向往深深沉浸的关系。',
  },
  mars: {
    aries: '爆发式的推动力，毫不犹豫正面突破。',
    taurus: '缓慢却不停的韧劲，一直推到最后。',
    gemini: '同时多线快速出击，用言语与灵感取胜。',
    cancer: '守护珍贵之物时变强，情感就是推动力。',
    leo: '坦然而火热地挑战，被瞩目时更有劲。',
    virgo: '精准细致地推进，用实力证明自己。',
    libra: '温和却执着，透过关系去行动。',
    scorpio: '安静而强烈的执念，一旦决定便看到结局。',
    sagittarius: '毫无顾忌地挑战与拓展，自由是原动力。',
    capricorn: '战略性地奔向顶峰，忍耐是最好的武器。',
    aquarius: '用与众不同的方式突破，边改规则边前进。',
    pisces: '如水般安静地流动，凭直觉把握方向。',
  },
  jupiter: {
    aries: '勇于挑战时好运相随，开拓即是成长。',
    taurus: '持续与安定招来丰盛，相信感官便会壮大。',
    gemini: '学习与人脉拓宽机会，好奇就是资产。',
    cancer: '给予与照顾时福气回流，家庭与情谊是力量。',
    leo: '坦然站出来时运势打开，自信就是好运。',
    virgo: '踏实打磨时收获更大，付出招来福气。',
    libra: '在好关系中机会成长，协作是好运之钥。',
    scorpio: '深入钻研时大有所得，把危机化为机会。',
    sagittarius: '奔向广阔世界时运势变大，理想与冒险是福。',
    capricorn: '责任与努力得到丰厚回报，时间站在你这边。',
    aquarius: '新的尝试打开门，与众不同就是机会。',
    pisces: '给予与信任时丰盛流动，想象拓宽现实。',
  },
  saturn: {
    aries: '越能驾驭冲动越强大，这是学习忍耐的位置。',
    taurus: '慢却坚实地累积，恒心终会取胜。',
    gemini: '为言语与学习负责，透过深度而成熟。',
    cancer: '亲自守护情感与家庭，成为稳固的屏障。',
    leo: '在谦逊中学到真正的自信，靠努力发光。',
    virgo: '对完美的严格，踏实造就信任。',
    libra: '在关系中学习责任，用公正保持平衡。',
    scorpio: '深沉的掌控与节制，在危机中变得坚硬。',
    sagittarius: '为信念负责，把学习落实为现实。',
    capricorn: '对自己严格的斗士，越久越坚实。',
    aquarius: '把理想化为现实的坚持，边改结构边成长。',
    pisces: '在朦胧中把握重心，为奉献加上责任。',
  },
  uranus: {
    aries: '打破框架、开辟新路的先锋，自由即是革新。',
    taurus: '在熟悉中创造改变，追求安稳的革新。',
    gemini: '用闪现的灵感翻盘，思想的自由与众不同。',
    cancer: '寻找情感与家庭的新方式，带着独特的暖意。',
    leo: '以独创的个性发光，打造只属于自己的舞台。',
    virgo: '革新工作的方式，是务实的发明家。',
    libra: '试验关系与平衡的新形态，向往自由的和谐。',
    scorpio: '撼动根本的改变，从深处掀起革命。',
    sagittarius: '跨越边界的自由思想，拓宽未来的地平线。',
    capricorn: '颠覆陈旧的结构，是重建体制的改革者。',
    aquarius: '超越时代的视野，独创性就是本质。',
    pisces: '用想象与灵感消融边界，开启新的梦。',
  },
  neptune: {
    aries: '为理想炽热投入，把梦想化为行动。',
    taurus: '用感官塑造美，在现实中寻找浪漫。',
    gemini: '想象与语言交融，用故事创造魔法。',
    cancer: '深切的共情与照顾，用心包容世界。',
    leo: '以创造性的灵感发光，心流向艺术与表达。',
    virgo: '以细腻的奉献助人疗愈，把理想融进现实。',
    libra: '梦想和谐与美，描绘理想的爱。',
    scorpio: '被神秘与深度吸引，能感知看不见的东西。',
    sagittarius: '追寻更大的意义与真理，享受心灵的冒险。',
    capricorn: '用结构实现理想，为梦想搭起现实的骨架。',
    aquarius: '梦想为众人的理想，博爱拓宽想象。',
    pisces: '想象与灵性延伸得很远，怀有无界的共情。',
  },
  pluto: {
    aries: '用炽烈的意志让自己重生，在危机中变强。',
    taurus: '从根本改变价值与安定，是扎根深处的蜕变。',
    gemini: '用思想与言语之力翻盘，深挖真相。',
    cancer: '深深疗愈情感与根源，转化家族的伤。',
    leo: '打碎自我再重建，拥有强烈的存在感。',
    virgo: '从根本改变日常与身体，净化并重建。',
    libra: '从根本转化关系，重编权力的平衡。',
    scorpio: '从深处彻底重生，洞察之力强烈。',
    sagittarius: '撼动信念以寻真相，重建世界观。',
    capricorn: '从根本改变结构与权力，透过危机变强。',
    aquarius: '推翻陈旧的体制，引领群体的变革。',
    pisces: '转化看不见的事物，深深净化潜意识。',
  },
  northNode: {
    aries: '学习带头、拿出属于自己的勇气的方向。不再依赖他人、以自己的名义迈出第一步时，灵魂才会成长。',
    taurus: '学习稳稳累积属于自己的价值。放下焦躁、享受当下所拥有的，内心才会踏实。',
    gemini: '学习保持好奇、学习与连接的方向。不执着于唯一答案、愿意倾听各种声音时，世界才会变宽。',
    cancer: '学习敞开心、照顾并扎根。不再用成绩证明自己、如实感受情感时，才会安心。',
    leo: '培养做自己、发光表达的勇气。不躲在后面、站上舞台展现自己时，才会遇见真正的喜悦。',
    virgo: '学习一步步打磨、脚踏实地。不流于空泛的理想、用心做好今天的事时，生活才会有序。',
    libra: '学习共处、和谐与真正的伙伴关系。不固执己见、与人取得平衡时，才能走得更远。',
    scorpio: '学习深入投入、面对真正的蜕变。不安于舒适、深挖到害怕之处时，便会重生。',
    sagittarius: '出发去更广的世界、寻找自己的信念的方向。不追随他人、自己追问意义时，路才会打开。',
    capricorn: '成长为负责任、自己成就自己的大人。超越想依赖的心、扛起自己那一份时，才会坚实。',
    aquarius: '超越自我、走向群体与未来的方向。放下求认可的心、为众人伸出手时，便会自由。',
    pisces: '学习放下、信任、随流而行。不再想掌控一切、清空内心时，平静才会到来。',
  },
  southNode: {
    aries: '习惯独自横冲直撞的位置。留住那份勇气，如今学会回头看看身边、一起同行。',
    taurus: '安于熟悉与安定的位置。保留那份踏实，试着一点点对变化敞开心。',
    gemini: '习惯用言语信息浮于表面。留住那份机智，培养深挖一件事的韧劲。',
    cancer: '习惯依赖与被保护的位置。保留那份温柔，慢慢培养自立的力量。',
    leo: '要被瞩目才安心的位置。留住那份光彩，也去认识台下同样很好的自己。',
    virgo: '习惯完美打理与担忧的位置。珍惜那份认真，也学会信任放手的从容。',
    libra: '习惯迁就他人的位置。保留那份体贴，练习清晰地发出自己的声音。',
    scorpio: '习惯掌控与深深纠缠。留住那份强烈，偶尔也松开手、轻轻放下。',
    sagittarius: '习惯自由漂泊的位置。保留那份宽阔视野，也学着扎根一处的安定。',
    capricorn: '习惯用成就与掌控证明自己。留住那份责任心，如今先照顾好内心。',
    aquarius: '习惯保持距离观察的位置。保留那份客观，如今走近去交心。',
    pisces: '习惯放任与逃避。保留那份柔软，如今培养双脚扎根现实的力量。',
  },
  fortune: {
    aries: '勇敢开始与挑战时运势打开的位置。抢先站出来时，喜悦与福气一同到来。',
    taurus: '慢慢累积、享受感官时喜悦更大的位置。不急躁、细品当下时，福气随之流入。',
    gemini: '学习、分享与连接时好运相随的位置。顺着好奇心连接人与故事时，运便打开。',
    cancer: '在珍惜照顾的关系中福气流动的位置。分享心意、累积情谊时，喜悦回流。',
    leo: '坦然展现并享受自己时运势发光的位置。尽情表达、被爱时，福气明亮地打开。',
    virgo: '用心打磨与助人时喜悦与福到来的位置。踏实做好小事时，运气一点点累积。',
    libra: '在好关系与和谐中好运成长的位置。享受与人共处的美好时，福气绽放。',
    scorpio: '深入投入与蜕变时运势打开的位置。无所畏惧地深挖时，会遇见意外的福气。',
    sagittarius: '走向广阔世界时喜悦与运变大的位置。向陌生之地迈步时，好运前来相迎。',
    capricorn: '踏实累积时福气回流的位置。默默尽责时，运气稳稳相随。',
    aquarius: '在与众不同的路与好人中运势开启的位置。相信自己的方式前行时，福气来临。',
    pisces: '给予、想象并随流时福气流动的位置。清空内心、付出时，意外的好运悄然渗入。',
  },
}

const JA: PlanetReadings = {
  sun: {
    aries: '先頭で切り拓くとき最も輝きます。挑戦こそがあなたの核です。',
    taurus: 'ゆっくり最後まで積み上げる人。揺るがない安定が力です。',
    gemini: '好奇心と機知で世界をつなぎます。学び分かち合うとき生きています。',
    cancer: '大切な人を守るとき本当の自分に。温かい心が中心です。',
    leo: '生まれながらの主役。堂々とした自信が人を惹きつけます。',
    virgo: '丁寧に仕上げて完成させる人。誠実さがあなたの署名です。',
    libra: '調和とバランスの中で自分を見つけます。関係が舞台です。',
    scorpio: '本質を深く掘る人。強烈な集中があなたの色です。',
    sagittarius: '広い世界へ向かうとき自由に。冒険と理想が導きます。',
    capricorn: '黙々と頂へ登る人。責任と粘りがあなたです。',
    aquarius: '独自の視点で未来を描きます。独創性が核です。',
    pisces: '感性と想像で世界を包みます。深い共感があなたの光です。',
  },
  moon: {
    aries: '感情は素直で速いです。心が向けばすぐ動きます。',
    taurus: 'ゆったり一定の感情。快適さと安定で充電します。',
    gemini: '感情も好奇心につれ軽やかに動きます。言葉で心をほどきます。',
    cancer: '深く潤う感情。世話し世話されるとき最も安心します。',
    leo: '温かくドラマチックな感情。愛されると花開きます。',
    virgo: '静かに気遣い心を表します。整うと落ち着きます。',
    libra: '穏やかな関係で心が安らぎます。争いはとても苦手です。',
    scorpio: '感情は深く強烈。一度心を許すと最後まで。',
    sagittarius: '自由なとき心が楽に。新しい経験が慰めです。',
    capricorn: '感情を内に治めます。頼もしさで愛を示します。',
    aquarius: '一歩引いて感情を眺めます。自由が安定です。',
    pisces: '感情は繊細で染み込みやすい。人の心まで自分のように感じます。',
  },
  mercury: {
    aries: '思考が速く率直。浮かんだらすぐ言い、動きます。',
    taurus: '一度決めれば揺るがない。慎重で実用的な判断。',
    gemini: '言葉とアイデアが湧きます。機知で話題を渡り歩きます。',
    cancer: '記憶が良く感情で理解。まず空気を読みます。',
    leo: '自信を持って表現。話に力とドラマが乗ります。',
    virgo: '核を突く分析力。細部まで整理します。',
    libra: 'バランスの言葉で説得。対話に調和を生みます。',
    scorpio: '隠れた意図まで見抜く。言葉少なでも洞察が深い。',
    sagittarius: '大きな絵と意味を語ります。率直で遠慮がない。',
    capricorn: '体系的で信頼できる口調。結論まできっちり。',
    aquarius: '枠を壊す発想がひらめきます。新鮮な視点で惹きつけます。',
    pisces: 'イメージと感覚で考えます。比喩と想像が豊か。',
  },
  venus: {
    aries: '愛に素直で積極的。惹かれたら自分から。',
    taurus: '官能的で一途な愛。快適さと触れ合いを大切に。',
    gemini: '機知ある会話にときめきます。軽く楽しい関係を好みます。',
    cancer: '深く慈しむ愛。安定した関係で心を開きます。',
    leo: '華やかで熱い愛。惜しみなく与え、与えられたい。',
    virgo: '小さな気遣いで心を伝えます。誠実な愛を。',
    libra: '調和的で優雅な愛。共に在る美しさを味わいます。',
    scorpio: '深く強烈に落ちます。すべてを賭ける愛を。',
    sagittarius: '自由で率直な愛。共に冒険できる人に惹かれます。',
    capricorn: '真剣で長く続く愛。信頼で関係を築きます。',
    aquarius: '独特で自由な愛。友のような恋人を好みます。',
    pisces: 'ロマンチックで献身的な愛。深く沈む関係を夢見ます。',
  },
  mars: {
    aries: '爆発的な推進力。迷わず正面突破します。',
    taurus: '遅くても止まらない粘り。最後まで押し切ります。',
    gemini: '複数を同時に素早く。言葉とアイデアで勝負します。',
    cancer: '大切なものを守るとき強く。感情が推進力です。',
    leo: '堂々と熱く挑みます。注目されると力が出ます。',
    virgo: '正確で丁寧に押し進めます。実力で証明します。',
    libra: '柔らかく、しかし粘り強く。関係を通して動きます。',
    scorpio: '静かでも強烈な執念。決めたら最後まで。',
    sagittarius: '遠慮なく挑み広げます。自由が原動力です。',
    capricorn: '戦略的に頂を目指します。忍耐が最強の武器です。',
    aquarius: '独自のやり方で突破。ルールを変えて進みます。',
    pisces: '水のように静かに動きます。直感で方向を取ります。',
  },
  jupiter: {
    aries: '勇敢に挑むとき運が味方します。開拓が成長です。',
    taurus: '着実さと安定が豊かさを呼びます。感覚を信じて広がります。',
    gemini: '学びと人脈が機会を広げます。好奇心が資産です。',
    cancer: '与え世話するとき福が返ります。家庭と情が力です。',
    leo: '堂々と出るとき運が開きます。自信が幸運です。',
    virgo: '誠実に磨くとき実りが大きく。奉仕が福を呼びます。',
    libra: '良い関係の中で機会が育ちます。協力が鍵です。',
    scorpio: '深く掘るとき大きく得ます。危機を機会に変えます。',
    sagittarius: '広い世界へ向かうと運が大きく。理想と冒険が福です。',
    capricorn: '責任と努力が大きく報われます。時が味方します。',
    aquarius: '新しい試みが扉を開きます。違いが機会です。',
    pisces: '与え信じるとき豊かさが流れます。想像が現実を広げます。',
  },
  saturn: {
    aries: '衝動を治めるほど強く。忍耐を学ぶ場所です。',
    taurus: '遅くても堅実に積みます。継続が結局勝ちます。',
    gemini: '言葉と学びに責任を持ちます。深さで成熟します。',
    cancer: '感情と家庭を自ら守ります。頼れる砦になります。',
    leo: '謙虚さの中で本物の自信を学びます。努力で輝きます。',
    virgo: '完璧への厳しさ。誠実さが信頼を作ります。',
    libra: '関係の中で責任を学びます。公正でバランスを保ちます。',
    scorpio: '深い抑制と節制。危機に耐え硬くなります。',
    sagittarius: '信念に責任を持ちます。学びを現実に固めます。',
    capricorn: '自分に厳しい勝負師。時が経つほど硬くなります。',
    aquarius: '理想を現実にする粘り。構造を変えつつ育ちます。',
    pisces: '曖昧さの中で軸を保ちます。献身に責任を足します。',
  },
  uranus: {
    aries: '枠を壊し新しい道を開く先駆者。自由が革新です。',
    taurus: '慣れの中で変化を作ります。安定した革新を求めます。',
    gemini: 'ひらめくアイデアで盤を変えます。思考の自由が際立ちます。',
    cancer: '感情と家庭の新しい形を探します。独特の温もりを持ちます。',
    leo: '独創的な個性で輝きます。自分だけの舞台を作ります。',
    virgo: '働き方を革新します。実用的な発明家です。',
    libra: '関係と均衡の新形を試します。自由な調和を夢見ます。',
    scorpio: '根本を揺るがす変化。深みから革命を起こします。',
    sagittarius: '境界を越える自由な思想。未来の地平を広げます。',
    capricorn: '古い構造をひっくり返します。体制を建て直す改革者です。',
    aquarius: '時代を先取る視点。独創性が本質です。',
    pisces: '想像と霊感で境界を溶かします。新しい夢を開きます。',
  },
  neptune: {
    aries: '理想へ熱く没入します。夢を行動に移します。',
    taurus: '感覚で美を形にします。現実の中に浪漫を見つけます。',
    gemini: '想像と言葉が溶け合います。物語で魔法を作ります。',
    cancer: '深い共感と世話。心で世界を包みます。',
    leo: '創造的な霊感で輝きます。心が芸術と表現へ流れます。',
    virgo: '繊細な献身で助け癒します。理想を現実に溶かします。',
    libra: '調和と美を夢見ます。理想の愛を描きます。',
    scorpio: '神秘と深さに魅了されます。見えないものを感じます。',
    sagittarius: 'より大きな意味と真理を追います。霊的な冒険を楽しみます。',
    capricorn: '理想を構造で実現します。夢に現実の骨組みを与えます。',
    aquarius: '皆のための理想を夢見ます。博愛が想像を広げます。',
    pisces: '想像と霊性が遠くへ伸びます。境界なき共感を持ちます。',
  },
  pluto: {
    aries: '激しい意志で自らを再生します。危機の中で強くなります。',
    taurus: '価値と安定を根本から変えます。根深い変容です。',
    gemini: '思考と言葉の力で盤を返します。真実を掘ります。',
    cancer: '感情と根を深く癒します。家族の傷を変容させます。',
    leo: '自我を壊し建て直します。強烈な存在感を持ちます。',
    virgo: '日常と体を根本から変えます。浄化し再建します。',
    libra: '関係を根本から変容させます。力の均衡を組み替えます。',
    scorpio: '深みから完全に生まれ変わります。洞察の力が強烈です。',
    sagittarius: '信念を揺るがし真実を探します。世界観を建て直します。',
    capricorn: '構造と権力を根本から変えます。危機を通して強くなります。',
    aquarius: '古い体制を崩します。集団の変革を導きます。',
    pisces: '見えないものを変容させます。無意識を深く浄化します。',
  },
  northNode: {
    aries: '先頭に立ち、自分の勇気を出すことを学ぶ方向です。人に頼らず自分の名で一歩を踏み出すとき、魂が育ちます。',
    taurus: '揺るがず自分の価値を積み上げることを学びます。焦りを手放し、今あるものを味わうとき、心が落ち着きます。',
    gemini:
      '好奇心を開き、学び、つながることを学ぶ方向です。一つの答えに固執せず、いろんな声に耳を傾けるとき、世界が広がります。',
    cancer:
      '心を開き、慈しみ、根を張ることを学びます。成果で自分を証明するより、感情をそのまま感じるとき、安心できます。',
    leo: '自分らしく輝き表現する勇気を育てる方向です。後ろに隠れず舞台に立つとき、本当の喜びに出会えます。',
    virgo:
      '一つずつ磨き、現実に足をつけることを学びます。漠然とした理想に流れず、今日のことを丁寧にこなすとき、暮らしが整います。',
    libra:
      '一人よりも共に、調和と関係を学ぶ方向です。自分のやり方に固執せず、相手と釣り合いを取るとき、遠くまで行けます。',
    scorpio:
      '深く没入し、本当の変容に向き合うことを学びます。快適さに安住せず、怖い場所まで掘り下げるとき、生まれ変わります。',
    sagittarius: 'より広い世界と自分の信念を探しに出る方向です。人の考えを追うより、自ら意味を問うとき、道が開けます。',
    capricorn: '責任を持ち、自ら成し遂げる大人になる方向です。頼りたい気持ちを越えて自分の分を担うとき、強くなります。',
    aquarius:
      '自分を超え、共同体と未来へ向かう方向です。認められたい思いを手放し、みんなのために手を差し伸べるとき、自由になります。',
    pisces:
      '手放し、信じ、流れに委ねることを学ぶ方向です。すべてを制御しようとせず、心を空にするとき、平安が訪れます。',
  },
  southNode: {
    aries: '前後を考えず一人で突っ走るのが慣れた場所です。その勇気は残しつつ、今は隣を見て共に進むことを学びます。',
    taurus: '慣れと安定に留まるのが楽な場所です。その頼もしさは保ちつつ、変化に少しずつ心を開いてみて。',
    gemini: '言葉と情報で軽く表面をなぞるのが慣れています。機知は残しつつ、一つを深く掘る粘りを育ててみて。',
    cancer: '頼り守られるのが慣れた場所です。その優しさは保ちつつ、少しずつ自立する力を育ててみて。',
    leo: '注目されないと不安な場所です。その輝きは残しつつ、舞台の外でも十分な自分に出会ってみて。',
    virgo: '完璧に整え心配するのが癖の場所です。その誠実さは大切にしつつ、時には信じて手放す余裕を学んで。',
    libra: '人に合わせるのが慣れた場所です。その思いやりは保ちつつ、自分の声をはっきり出す練習をしてみて。',
    scorpio: '支配し深く絡むのが慣れています。その強烈さは残しつつ、時には力を抜いて軽く手放してみて。',
    sagittarius: '自由に漂うのが楽な場所です。その広い視野は保ちつつ、一つの場所に根を張る安定も学んで。',
    capricorn: '成果と支配で自分を証明するのが慣れています。その責任感は保ちつつ、今はまず心を大切に。',
    aquarius: '距離を置いて観るのが慣れた場所です。その客観性は残しつつ、今は近づいて心を分かち合ってみて。',
    pisces: '流し逃げるのが慣れています。その柔らかさは保ちつつ、今は現実に両足をつける力を育てて。',
  },
  fortune: {
    aries: '勇敢に始め挑むとき運が開く場所です。誰より先に立つとき、喜びと福が一緒についてきます。',
    taurus: 'ゆっくり積み、感覚を味わうとき喜びが増す場所です。焦らず今を味わうとき、福が流れ込みます。',
    gemini: '学び分かち合いつながるとき運が味方する場所です。好奇心のままに人と物語をつなぐとき、運が開きます。',
    cancer: '慈しみ世話する関係の中で福が流れる場所です。心を分かち合い情を重ねるとき、喜びが返ります。',
    leo: '堂々と自分を見せ楽しむとき運が輝く場所です。思い切り表現し愛されるとき、福が明るく開きます。',
    virgo: '丁寧に磨き助けるとき喜びと福が来る場所です。小さなことを誠実にこなすとき、運が少しずつ積もります。',
    libra: '良い関係と調和の中で運が育つ場所です。共に在る美しさを味わうとき、福が花ひらきます。',
    scorpio: '深く没入し変容するとき運が開く場所です。恐れず掘り下げるとき、思いがけない福に出会います。',
    sagittarius: '広い世界へ進むとき喜びと運が大きくなる場所です。見知らぬ場所へ踏み出すとき、幸運が迎えに来ます。',
    capricorn: '誠実に積み上げるとき福が返る場所です。黙々と責任を果たすとき、運が頼もしく寄り添います。',
    aquarius: '独自の道と良い人々の中で運が開く場所です。自分のやり方を信じて進むとき、福が訪れます。',
    pisces: '与え想像し流れに委ねるとき福が流れる場所です。心を空にして差し出すとき、思いがけない幸運が染み込みます。',
  },
}

const BY_LOCALE: Record<PublicLocale, PlanetReadings> = {
  ko: KO,
  en: EN,
  'zh-CN': ZH,
  ja: JA,
}

/** Placement-based reading for any body, in the given locale. */
export function planetSignReading(locale: PublicLocale, planet: PlanetId, sign: SignId): string {
  return (BY_LOCALE[locale] ?? KO)[planet][sign]
}

// ── Aspect readings ──────────────────────────────────────────────────────
// Per-planet-pair copy, so "Sun conjunct Saturn" reads differently from
// "Venus conjunct Saturn". The five major aspects collapse into three tones:
//   합 conjunction — the two energies fuse into one
//   흐름 flow       — trine + sextile, they support each other with ease
//   마찰 friction   — square + opposition, they pull against each other
// Only the ten classical planets carry pair copy; pairs involving the nodes
// or Part of Fortune fall back to the generic per-type description in the UI.

type AspectTone = 'conjunction' | 'flow' | 'friction'
type PairText = Record<AspectTone, string>
type AspectPairReadings = Partial<Record<string, PairText>>

/** Canonical ordering used to build a stable, order-independent key per pair. */
const ASPECT_PAIR_ORDER: readonly PlanetId[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'northNode',
  'fortune',
]

function pairKey(a: PlanetId, b: PlanetId): string {
  return ASPECT_PAIR_ORDER.indexOf(a) <= ASPECT_PAIR_ORDER.indexOf(b) ? `${a}-${b}` : `${b}-${a}`
}

function aspectTone(aspect: AspectType): AspectTone {
  if (aspect === 'conjunction') {
    return 'conjunction'
  }
  if (aspect === 'trine' || aspect === 'sextile') {
    return 'flow'
  }
  return 'friction'
}

const KO_ASPECTS: AspectPairReadings = {
  'sun-moon': {
    conjunction: '겉모습과 속마음이 한 방향이에요. 원하는 것과 느끼는 것이 자연스럽게 하나로 움직여요.',
    flow: '의지와 감정이 잘 맞아떨어져요. 마음이 편안해서 무리 없이 나답게 살아가요.',
    friction: '하고 싶은 것과 마음이 원하는 게 자꾸 어긋나요. 그 사이에서 진짜 나를 찾아가요.',
  },
  'sun-mercury': {
    conjunction: '생각이 곧 나 자신이에요. 말과 정체성이 하나라 표현이 진솔해요.',
    flow: '자신을 또렷하게 설명할 줄 알아요. 생각과 존재감이 자연스럽게 이어져요.',
    friction: '머릿속 생각과 진짜 나 사이에 거리가 생겨요. 말이 앞서지 않게 살피면 좋아요.',
  },
  'sun-venus': {
    conjunction: '매력과 정체성이 하나예요. 좋아하는 것이 곧 나를 말해줘요.',
    flow: '사람들에게 사랑스럽게 다가가요. 취향과 자신감이 부드럽게 어우러져요.',
    friction: '사랑받고 싶은 마음과 나다움이 부딪혀요. 맞추기보다 나를 지키는 법을 배워요.',
  },
  'sun-mars': {
    conjunction: '의지와 행동력이 하나로 폭발해요. 원하면 곧장 밀어붙이는 힘이 있어요.',
    flow: '용기와 자신감이 자연스럽게 흘러요. 도전이 곧 에너지가 돼요.',
    friction: '욕심과 힘이 자꾸 과열돼요. 서두름을 다스릴수록 강해져요.',
  },
  'sun-jupiter': {
    conjunction: '자신감과 낙천이 하나예요. 크게 꿈꾸고 넓게 나아가요.',
    flow: '기회가 자연스럽게 따라와요. 긍정이 곧 행운을 부르는 힘이에요.',
    friction: '자신감이 넘쳐 과장될 때가 있어요. 크기보다 방향을 잡으면 커져요.',
  },
  'sun-saturn': {
    conjunction: '자아와 책임감이 하나로 뭉쳐요. 무겁지만 그만큼 단단하고 오래가는 사람이에요.',
    flow: '노력과 인내가 자연스럽게 결실이 돼요. 꾸준함이 신뢰로 돌아와요.',
    friction: '자유롭고 싶은 나와 의무 사이에서 눌려요. 그 압박을 견디며 진짜 어른이 돼요.',
  },
  'sun-uranus': {
    conjunction: '남다름이 곧 정체성이에요. 틀에 갇히지 않을 때 가장 나다워요.',
    flow: '개성과 자유가 자연스럽게 빛나요. 새로운 시도가 잘 어울려요.',
    friction: '튀고 싶은 마음과 안정 사이에서 흔들려요. 그 긴장이 혁신을 낳아요.',
  },
  'sun-neptune': {
    conjunction: '자아가 꿈과 감성으로 물들어요. 예술적이지만 나를 놓치지 않게 조심해요.',
    flow: '상상과 자신이 부드럽게 이어져요. 이상을 자연스럽게 그려내요.',
    friction: '내가 누군지 흐릿해질 때가 있어요. 현실에 발을 붙이며 중심을 잡아요.',
  },
  'sun-pluto': {
    conjunction: '강렬한 존재감이 곧 나예요. 위기마다 자신을 새로 태어나게 해요.',
    flow: '깊은 의지가 자연스럽게 힘이 돼요. 변화를 두려워하지 않아요.',
    friction: '통제욕과 자아가 부딪혀요. 힘을 내려놓을 때 오히려 강해져요.',
  },
  'moon-mercury': {
    conjunction: '느낌과 생각이 하나예요. 마음을 말로 잘 풀어내요.',
    flow: '감정과 이성이 잘 통해요. 마음을 솔직하고 편하게 표현해요.',
    friction: '머리와 마음이 자꾸 엇갈려요. 감정에 휘둘리지 않게 정리하면 좋아요.',
  },
  'moon-venus': {
    conjunction: '다정함과 애정이 하나예요. 따뜻하게 아끼고 사랑스럽게 표현해요.',
    flow: '마음과 사랑이 부드럽게 흘러요. 관계에서 편안함을 느껴요.',
    friction: '사랑받고 싶은 마음이 예민하게 흔들려요. 스스로를 먼저 채우면 편해져요.',
  },
  'moon-mars': {
    conjunction: '감정이 곧 행동이에요. 마음이 움직이면 뜨겁게 반응해요.',
    flow: '감정과 용기가 자연스럽게 이어져요. 솔직하게 원하는 걸 표현해요.',
    friction: '감정이 욱하고 치밀 때가 있어요. 그 열기를 다스리면 추진력이 돼요.',
  },
  'moon-jupiter': {
    conjunction: '마음이 넓고 따뜻해요. 베풀 때 가장 행복해요.',
    flow: '감정이 넉넉하게 흘러요. 낙천이 사람을 끌어당겨요.',
    friction: '기분이 과하게 부풀 때가 있어요. 감정의 크기를 조절하면 편해져요.',
  },
  'moon-saturn': {
    conjunction: '감정을 안으로 단단히 눌러요. 무뚝뚝해 보여도 속은 깊고 진지해요.',
    flow: '감정을 차분히 다스릴 줄 알아요. 든든함으로 사랑을 표현해요.',
    friction: '마음을 여는 게 어렵고 외로울 때가 있어요. 스스로를 다독이며 벽을 낮춰가요.',
  },
  'moon-uranus': {
    conjunction: '감정이 자유롭고 예측 불가예요. 얽매이지 않을 때 편안해요.',
    flow: '감정을 산뜻하게 풀어내요. 독립적인 마음이 매력이에요.',
    friction: '기분이 갑자기 요동칠 때가 있어요. 안정과 자유 사이에서 균형을 찾아요.',
  },
  'moon-neptune': {
    conjunction: '감정이 상상과 공감으로 넘쳐요. 남의 마음까지 스며들 듯 느껴요.',
    flow: '감성과 직관이 부드럽게 흘러요. 예술과 위로에 재능이 있어요.',
    friction: '감정과 현실이 흐릿하게 뒤섞여요. 경계를 지키며 나를 보호해요.',
  },
  'moon-pluto': {
    conjunction: '감정이 깊고 강렬해요. 한번 마음을 주면 끝까지 파고들어요.',
    flow: '깊은 감정을 힘으로 바꿔요. 위기 속에서도 마음이 단단해요.',
    friction: '감정이 집착으로 치달을 때가 있어요. 놓아줄 줄 알 때 자유로워져요.',
  },
  'mercury-venus': {
    conjunction: '말과 감각이 하나예요. 부드럽고 매력적으로 표현해요.',
    flow: '생각과 취향이 우아하게 어울려요. 대화에 멋이 있어요.',
    friction: '말과 마음이 살짝 어긋날 때가 있어요. 솔직함과 배려의 균형을 찾아요.',
  },
  'mercury-mars': {
    conjunction: '생각이 곧 말이 되고 행동이 돼요. 재빠르고 날카로워요.',
    flow: '판단과 실행이 착착 맞아요. 결정이 빠르고 시원해요.',
    friction: '말이 급하고 날이 설 때가 있어요. 한 박자 쉬면 설득력이 커져요.',
  },
  'mercury-jupiter': {
    conjunction: '생각이 크고 넓어요. 배우고 나누는 걸 좋아해요.',
    flow: '큰 그림과 디테일이 잘 어우러져요. 낙천적인 지혜가 있어요.',
    friction: '말이 과장되거나 산만해질 때가 있어요. 핵심에 집중하면 빛나요.',
  },
  'mercury-saturn': {
    conjunction: '생각이 신중하고 체계적이에요. 말에 무게와 책임이 실려요.',
    flow: '집중력과 논리가 탄탄해요. 꾸준히 깊게 파고들어요.',
    friction: '생각이 자꾸 스스로를 검열해요. 자신을 믿을수록 말이 단단해져요.',
  },
  'mercury-uranus': {
    conjunction: '생각이 번개처럼 튀어요. 남다른 통찰이 번뜩여요.',
    flow: '기발한 아이디어가 술술 나와요. 빠르고 독창적인 두뇌예요.',
    friction: '생각이 너무 앞서 조급해질 때가 있어요. 속도를 늦추면 천재성이 살아나요.',
  },
  'mercury-neptune': {
    conjunction: '생각이 이미지와 상상으로 흘러요. 시적이고 직관적이에요.',
    flow: '상상력과 표현이 부드럽게 이어져요. 은유에 재능이 있어요.',
    friction: '생각이 흐릿하고 헷갈릴 때가 있어요. 사실을 확인하며 중심을 잡아요.',
  },
  'mercury-pluto': {
    conjunction: '생각이 깊이 파고들어요. 숨은 진실을 꿰뚫어봐요.',
    flow: '집중된 통찰이 자연스럽게 흘러요. 탐구에 힘이 있어요.',
    friction: '생각이 집요하게 한 곳에 꽂힐 때가 있어요. 유연해질수록 통찰이 커져요.',
  },
  'venus-mars': {
    conjunction: '애정과 열정이 하나로 타올라요. 끌리면 뜨겁게 다가가요.',
    flow: '사랑과 욕망이 조화롭게 흘러요. 매력과 추진력이 함께 빛나요.',
    friction: '원하는 마음과 다가가는 방식이 엇박이에요. 밀당 속에서 사랑을 배워요.',
  },
  'venus-jupiter': {
    conjunction: '사랑도 즐거움도 넉넉해요. 관대하고 낭만적이에요.',
    flow: '애정과 행운이 함께 흘러요. 사람과 아름다움을 끌어당겨요.',
    friction: '사랑도 소비도 과해질 때가 있어요. 절제 속에서 더 빛나요.',
  },
  'venus-saturn': {
    conjunction: '사랑에 진지하고 오래가요. 쉽게 열지 않지만 한번 주면 변치 않아요.',
    flow: '책임감 있게 관계를 쌓아요. 신뢰가 사랑의 뿌리예요.',
    friction: '사랑 앞에서 움츠러들거나 거리감을 느껴요. 마음을 여는 연습이 필요해요.',
  },
  'venus-uranus': {
    conjunction: '사랑이 자유롭고 짜릿해요. 얽매이지 않는 관계에 끌려요.',
    flow: '설렘과 독립이 잘 어울려요. 신선한 매력이 있어요.',
    friction: '사랑과 자유 사이에서 마음이 오락가락해요. 약속과 여백의 균형을 찾아요.',
  },
  'venus-neptune': {
    conjunction: '사랑이 꿈처럼 낭만적이에요. 헌신적이지만 환상에 빠지지 않게 조심해요.',
    flow: '감성과 사랑이 부드럽게 흘러요. 예술적인 매력을 지녔어요.',
    friction: '이상과 현실의 연인이 자꾸 어긋나요. 있는 그대로를 볼 때 사랑이 깊어져요.',
  },
  'venus-pluto': {
    conjunction: '사랑이 깊고 강렬해요. 전부를 거는 관계를 원해요.',
    flow: '깊은 애정이 자연스럽게 힘이 돼요. 진심으로 몰입해요.',
    friction: '사랑이 집착이나 질투로 흐를 때가 있어요. 놓아줄 때 관계가 살아나요.',
  },
  'mars-jupiter': {
    conjunction: '행동력과 배포가 하나예요. 크게 벌이고 힘차게 밀어붙여요.',
    flow: '용기와 기회가 함께 흘러요. 도전할수록 운이 커져요.',
    friction: '의욕이 넘쳐 무리할 때가 있어요. 힘을 조절하면 더 멀리 가요.',
  },
  'mars-saturn': {
    conjunction: '힘과 인내가 하나로 뭉쳐요. 느리지만 끝까지 밀어붙이는 뚝심이 있어요.',
    flow: '전략과 실행이 착실하게 맞물려요. 참을성 있게 목표를 이뤄요.',
    friction: '하고 싶은데 자꾸 막히는 답답함이 있어요. 그 벽을 넘으며 진짜 힘을 길러요.',
  },
  'mars-uranus': {
    conjunction: '행동이 번개처럼 빠르고 대담해요. 틀을 깨는 추진력이 있어요.',
    flow: '순발력과 독창성이 잘 어울려요. 위기에 재빠르게 대응해요.',
    friction: '충동이 갑자기 터질 때가 있어요. 브레이크를 배우면 힘이 살아나요.',
  },
  'mars-neptune': {
    conjunction: '행동이 감성과 이상을 따라가요. 영감을 따라 움직여요.',
    flow: '직감과 행동이 부드럽게 이어져요. 조용히 흐르듯 나아가요.',
    friction: '의욕이 방향을 잃고 흐려질 때가 있어요. 목표를 또렷이 하면 힘이 모여요.',
  },
  'mars-pluto': {
    conjunction: '의지가 무섭도록 강렬해요. 한번 마음먹으면 끝을 봐요.',
    flow: '깊은 집념이 자연스럽게 힘이 돼요. 위기에 더 강해져요.',
    friction: '힘겨루기나 극단으로 치달을 때가 있어요. 그 에너지를 다스리면 무적이 돼요.',
  },
  'jupiter-saturn': {
    conjunction: '꿈과 현실이 한자리에서 만나요. 크게 그리되 차근차근 이뤄요.',
    flow: '낙관과 인내가 균형을 이뤄요. 안정적으로 성장해요.',
    friction: '넓히려는 마음과 조이려는 마음이 부딪혀요. 그 사이에서 지혜로운 속도를 찾아요.',
  },
  'jupiter-uranus': {
    conjunction: '행운과 혁신이 하나예요. 예상 밖의 기회에 강해요.',
    flow: '자유와 기회가 함께 흘러요. 번뜩임이 행운으로 이어져요.',
    friction: '갑작스러운 변화에 들뜰 때가 있어요. 자유를 현명하게 쓰면 크게 열려요.',
  },
  'jupiter-neptune': {
    conjunction: '이상과 신앙이 하나로 부풀어요. 크고 아름다운 꿈을 품어요.',
    flow: '상상과 관대함이 부드럽게 흘러요. 영적인 넉넉함이 있어요.',
    friction: '꿈이 과해 현실을 놓칠 때가 있어요. 이상에 현실의 닻을 내려요.',
  },
  'jupiter-pluto': {
    conjunction: '큰 뜻과 강한 힘이 하나예요. 판을 크게 바꾸는 야심이 있어요.',
    flow: '깊은 확신이 성장의 힘이 돼요. 위기를 기회로 키워요.',
    friction: '욕심과 통제가 과열될 때가 있어요. 힘을 크게 쓸수록 겸손이 필요해요.',
  },
  'saturn-uranus': {
    conjunction: '지키려는 힘과 바꾸려는 힘이 한자리에 있어요. 낡은 틀을 단단하게 새로 세워요.',
    flow: '안정과 혁신이 균형을 이뤄요. 현실적인 개혁가예요.',
    friction: '옛것과 새것 사이에서 팽팽하게 당겨요. 그 긴장이 진짜 변화를 만들어요.',
  },
  'saturn-neptune': {
    conjunction: '꿈과 현실이 한 몸이에요. 이상을 구조로 빚어내요.',
    flow: '상상과 책임이 부드럽게 만나요. 꿈을 차근차근 실현해요.',
    friction: '이상과 현실 사이에서 흔들리고 지칠 때가 있어요. 그 간극을 메우며 단단해져요.',
  },
  'saturn-pluto': {
    conjunction: '견디는 힘과 바꾸는 힘이 하나예요. 밑바닥부터 다시 쌓는 사람이에요.',
    flow: '끈기와 통찰이 깊게 맞물려요. 위기를 견디며 재건해요.',
    friction: '무너뜨림과 지킴 사이에서 압박이 커요. 그 시련이 당신을 근본부터 단련해요.',
  },
  'uranus-neptune': {
    conjunction: '변혁과 상상이 하나로 흘러요. 새로운 시대의 꿈을 품은 세대예요.',
    flow: '자유와 영감이 부드럽게 이어져요. 이상을 현실로 옮겨요.',
    friction: '혁신과 환상 사이에서 흔들릴 수 있어요. 방향을 또렷이 하면 힘이 모여요.',
  },
  'uranus-pluto': {
    conjunction: '뒤엎는 힘과 다시 세우는 힘이 하나예요. 근본을 뒤흔드는 세대예요.',
    flow: '변화와 통찰이 강하게 맞물려요. 시대를 바꾸는 에너지가 있어요.',
    friction: '급진과 저항 사이에서 격렬하게 부딪혀요. 그 에너지가 큰 변혁을 낳아요.',
  },
  'neptune-pluto': {
    conjunction: '상상과 깊이가 한 몸이에요. 보이지 않는 것을 변형시키는 세대예요.',
    flow: '영성과 통찰이 부드럽게 흘러요. 깊은 의미를 길어 올려요.',
    friction: '환상과 심연 사이에서 혼란스러울 수 있어요. 중심을 잡으며 깊이를 다스려요.',
  },
}

const EN_ASPECTS: AspectPairReadings = {
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

const ZH_ASPECTS: AspectPairReadings = {
  'sun-moon': {
    conjunction: '外在与内心朝着同一方向。想要的与感受的自然合而为一。',
    flow: '意志与情感自然合拍。内心安稳，毫不勉强地活出自己。',
    friction: '想做的与心所愿的总是错位。在这之间寻找真正的自己。',
  },
  'sun-mercury': {
    conjunction: '思想即是自己。言语与身份合一，表达真诚。',
    flow: '懂得清楚地说明自己。思想与存在感自然相连。',
    friction: '想法与真正的自己之间拉开距离。别让话语抢在前头会更好。',
  },
  'sun-venus': {
    conjunction: '魅力与身份合一。所喜爱的正说明了你。',
    flow: '给人可爱亲切的感觉。品味与自信柔和交融。',
    friction: '想被爱的心与做自己相碰。学会守住自己，而非一味迎合。',
  },
  'sun-mars': {
    conjunction: '意志与行动力合一爆发。想要就直接全力推进。',
    flow: '勇气与自信自然流动。挑战即是能量。',
    friction: '欲望与力量总是过热。越能驾驭急躁，越强大。',
  },
  'sun-jupiter': {
    conjunction: '自信与乐观合一。梦想远大，走得开阔。',
    flow: '机会自然相随。积极就是招来好运的力量。',
    friction: '自信过头会流于夸张。抓准方向便能成长。',
  },
  'sun-saturn': {
    conjunction: '自我与责任合为一体。虽沉重，却因此坚实而长久。',
    flow: '努力与忍耐自然结成果实。踏实终会化作信赖。',
    friction: '想自由的我被义务压着。熬过那份压力，才真正长大成人。',
  },
  'sun-uranus': {
    conjunction: '与众不同即是身份。不被框住时最像自己。',
    flow: '个性与自由自然发光。新的尝试很适合你。',
    friction: '在想出众与求安定之间摇摆。那份张力孕育出革新。',
  },
  'sun-neptune': {
    conjunction: '自我被梦与感性染上色彩。富有艺术气息，但要当心别迷失自己。',
    flow: '想象与自己柔和相连。自然地描绘理想。',
    friction: '有时会分不清自己是谁。脚踏实地便能稳住重心。',
  },
  'sun-pluto': {
    conjunction: '强烈的存在感就是你。每逢危机都让自己重生。',
    flow: '深沉的意志自然化作力量。你不畏惧改变。',
    friction: '控制欲与自我相碰。放下力量时反而更强。',
  },
  'moon-mercury': {
    conjunction: '感受与思绪合一。善于把心事化作言语。',
    flow: '情感与理性相通。坦率而自在地表达心情。',
    friction: '头脑与心总是错开。整理好，就不会被情绪牵着走。',
  },
  'moon-venus': {
    conjunction: '温柔与爱意合一。温暖地珍惜，甜美地表达爱。',
    flow: '心与爱柔和流动。在关系中感到安稳。',
    friction: '想被爱的心敏感地颤动。先把自己填满便会轻松。',
  },
  'moon-mars': {
    conjunction: '情感即是行动。心一动便热烈回应。',
    flow: '情感与勇气自然相连。坦率地表达所愿。',
    friction: '情绪有时会猛地上冲。驾驭那股热度便化为动力。',
  },
  'moon-jupiter': {
    conjunction: '心宽而暖。付出时最幸福。',
    flow: '情感宽厚地流动。乐观吸引着人。',
    friction: '心情有时会过度膨胀。调节情绪的幅度便会轻松。',
  },
  'moon-saturn': {
    conjunction: '把情感牢牢压在心里。看似冷淡，内里却深沉而认真。',
    flow: '懂得沉稳地驾驭情感。用可靠表达爱。',
    friction: '敞开心很难，有时会孤单。慢慢安抚自己，放低那道墙。',
  },
  'moon-uranus': {
    conjunction: '情感自由而难以预料。不被束缚时才自在。',
    flow: '清爽地抒发情感。独立的心是魅力所在。',
    friction: '心情有时会突然剧烈起伏。在安定与自由之间寻找平衡。',
  },
  'moon-neptune': {
    conjunction: '情感满溢着想象与共情。连别人的心也如渗入般感受。',
    flow: '感性与直觉柔和流动。在艺术与抚慰上有天分。',
    friction: '情感与现实模糊交织。守住界线来保护自己。',
  },
  'moon-pluto': {
    conjunction: '情感深而强烈。一旦交心便挖掘到底。',
    flow: '把深沉的情感化作力量。危机中内心依然坚定。',
    friction: '情感有时会走向执着。懂得放手时便得自由。',
  },
  'mercury-venus': {
    conjunction: '言语与美感合一。表达柔和而迷人。',
    flow: '思想与品味优雅相配。谈吐有格调。',
    friction: '言语与心意有时略有错开。在坦率与体贴之间寻找平衡。',
  },
  'mercury-mars': {
    conjunction: '思想立刻化作言语与行动。敏捷而锐利。',
    flow: '判断与执行严丝合缝。决定快而利落。',
    friction: '言语有时急躁而带刺。缓一拍，说服力更强。',
  },
  'mercury-jupiter': {
    conjunction: '思想宏大而开阔。喜欢学习与分享。',
    flow: '大格局与细节相得益彰。带着乐观的智慧。',
    friction: '言语有时夸张或散漫。聚焦核心便会发光。',
  },
  'mercury-saturn': {
    conjunction: '思想慎重而有条理。言语带着分量与责任。',
    flow: '专注与逻辑扎实。持续而深入地钻研。',
    friction: '思绪总在自我审查。越信任自己，言语越坚实。',
  },
  'mercury-uranus': {
    conjunction: '思绪如闪电般迸发。闪现着与众不同的洞察。',
    flow: '奇思妙想信手拈来。头脑快速而独创。',
    friction: '思绪太超前而变得急躁。放慢速度，天才便鲜活起来。',
  },
  'mercury-neptune': {
    conjunction: '思想流向意象与想象。富有诗意与直觉。',
    flow: '想象与表达柔和相连。在比喻上有天分。',
    friction: '思绪有时模糊而混乱。核实事实便能稳住重心。',
  },
  'mercury-pluto': {
    conjunction: '思想深深钻研。看穿隐藏的真相。',
    flow: '专注的洞察自然流动。探究中带着力量。',
    friction: '思绪有时执拗地卡在一处。越灵活，洞察越大。',
  },
  'venus-mars': {
    conjunction: '爱意与热情合一燃烧。被吸引便热烈靠近。',
    flow: '爱与欲望和谐流动。魅力与动力一同闪耀。',
    friction: '所愿的心与靠近的方式错拍。在拉扯中学会爱。',
  },
  'venus-jupiter': {
    conjunction: '爱与欢愉都很充盈。慷慨而浪漫。',
    flow: '爱意与好运一同流动。吸引着人与美。',
    friction: '爱与消费有时都会过度。在节制中更显光彩。',
  },
  'venus-saturn': {
    conjunction: '对爱认真而长久。不轻易敞开，一旦付出便不变。',
    flow: '有责任感地经营关系。信任是爱的根。',
    friction: '在爱面前退缩或感到距离。需要练习敞开心扉。',
  },
  'venus-uranus': {
    conjunction: '爱自由而刺激。被不受束缚的关系吸引。',
    flow: '心动与独立相配。带着清新的魅力。',
    friction: '心在爱与自由之间摇摆。寻找承诺与留白的平衡。',
  },
  'venus-neptune': {
    conjunction: '爱如梦般浪漫。奉献，但要当心别陷入幻想。',
    flow: '感性与爱柔和流动。拥有艺术的魅力。',
    friction: '理想与现实中的恋人总是错开。如实去看时，爱才加深。',
  },
  'venus-pluto': {
    conjunction: '爱深而强烈。渴望倾尽一切的关系。',
    flow: '深沉的爱意自然化作力量。真心地投入。',
    friction: '爱有时流于执着或嫉妒。放手时关系才复活。',
  },
  'mars-jupiter': {
    conjunction: '行动力与气魄合一。做大事，有力地推进。',
    flow: '勇气与机会一同流动。越挑战，运越大。',
    friction: '干劲过盛而勉强。调节力量便走得更远。',
  },
  'mars-saturn': {
    conjunction: '力量与忍耐合为一体。虽慢，却有推到最后的韧劲。',
    flow: '策略与执行踏实咬合。有耐心地达成目标。',
    friction: '想做却总是受阻的憋闷。跨过那道墙，才练出真正的力量。',
  },
  'mars-uranus': {
    conjunction: '行动如闪电般迅速大胆。带着打破框架的推动力。',
    flow: '反应力与独创相配。危机中反应敏捷。',
    friction: '冲动有时会突然爆发。学会刹车，力量便鲜活。',
  },
  'mars-neptune': {
    conjunction: '行动追随感性与理想。凭灵感而动。',
    flow: '直觉与行动柔和相连。如水般静静前行。',
    friction: '干劲会迷失方向而变得模糊。目标清晰便能凝聚力量。',
  },
  'mars-pluto': {
    conjunction: '意志强烈得可怕。一旦决定便看到结局。',
    flow: '深沉的执念自然化作力量。危机中更强。',
    friction: '有时会走向角力或极端。驾驭那股能量便所向无敌。',
  },
  'jupiter-saturn': {
    conjunction: '梦想与现实在一处相遇。志向远大，却一步步实现。',
    flow: '乐观与忍耐取得平衡。稳定地成长。',
    friction: '想拓展的心与想收紧的心相碰。在其间找到明智的节奏。',
  },
  'jupiter-uranus': {
    conjunction: '好运与革新合一。擅长把握意外的机会。',
    flow: '自由与机会一同流动。灵光化作好运。',
    friction: '突如其来的变化令人兴奋。明智地运用自由，便大大打开。',
  },
  'jupiter-neptune': {
    conjunction: '理想与信念合一膨胀。怀抱宏大而美好的梦。',
    flow: '想象与慷慨柔和流动。拥有属于心灵的丰盛。',
    friction: '梦太大而错失现实。为理想抛下现实的锚。',
  },
  'jupiter-pluto': {
    conjunction: '宏大的志向与强大的力量合一。有着彻底改变格局的雄心。',
    flow: '深沉的信念化作成长的力量。把危机养成机会。',
    friction: '欲望与掌控会过热。力量用得越大，越需谦逊。',
  },
  'saturn-uranus': {
    conjunction: '守护的力量与改变的力量共处一处。把旧框架稳稳地重新立起。',
    flow: '安定与革新取得平衡。是务实的改革者。',
    friction: '旧与新之间紧紧对拉。那份张力造就真正的改变。',
  },
  'saturn-neptune': {
    conjunction: '梦与现实合为一体。把理想塑造成结构。',
    flow: '想象与责任柔和相遇。一步步实现梦想。',
    friction: '在理想与现实之间摇摆而疲惫。填补那道缝隙便会坚实。',
  },
  'saturn-pluto': {
    conjunction: '忍耐的力量与蜕变的力量合一。从最底层重新累积。',
    flow: '坚韧与洞察深深咬合。熬过危机并重建。',
    friction: '在摧毁与守护之间压力巨大。那场磨难从根本上锤炼你。',
  },
  'uranus-neptune': {
    conjunction: '变革与想象合一流动。怀抱新时代之梦的世代。',
    flow: '自由与灵感柔和相连。把理想搬进现实。',
    friction: '在革新与幻想之间可能摇摆。方向清晰便能凝聚力量。',
  },
  'uranus-pluto': {
    conjunction: '颠覆的力量与重建的力量合一。撼动根本的世代。',
    flow: '变化与洞察强烈咬合。带着改变时代的能量。',
    friction: '激进与抗拒之间激烈相碰。那股能量孕育巨大的变革。',
  },
  'neptune-pluto': {
    conjunction: '想象与深度合为一体。转化看不见之物的世代。',
    flow: '灵性与洞察柔和流动。汲取深层的意义。',
    friction: '在幻想与深渊之间可能迷乱。稳住重心，驾驭那份深度。',
  },
}

const JA_ASPECTS: AspectPairReadings = {
  'sun-moon': {
    conjunction: '外の自分と内の心が同じ方向を向きます。望むものと感じるものが自然にひとつになって動きます。',
    flow: '意志と感情が自然に噛み合います。心が楽で、無理なく自分らしく生きられます。',
    friction: 'したいことと心が望むことがすれ違います。その間で本当の自分を見つけていきます。',
  },
  'sun-mercury': {
    conjunction: '考えがそのまま自分です。言葉と自分が一つで、表現が正直です。',
    flow: '自分をはっきり説明できます。考えと存在感が自然につながります。',
    friction: '考えと本当の自分の間に距離が生まれます。言葉が先走らないよう気をつけると良いです。',
  },
  'sun-venus': {
    conjunction: '魅力と自分が一つです。好きなものがそのまま自分を語ります。',
    flow: '人に愛らしく映ります。好みと自信が柔らかく溶け合います。',
    friction: '愛されたい気持ちと自分らしさがぶつかります。合わせるより自分を守ることを学びます。',
  },
  'sun-mars': {
    conjunction: '意志と行動力が一つになって噴き出します。望めばまっすぐ押し進めます。',
    flow: '勇気と自信が自然に流れます。挑戦がそのままエネルギーになります。',
    friction: '欲と力がつい過熱します。焦りを治めるほど強くなります。',
  },
  'sun-jupiter': {
    conjunction: '自信と楽天が一つです。大きく夢見て広く進みます。',
    flow: 'チャンスが自然についてきます。前向きさが幸運を呼ぶ力です。',
    friction: '自信が余って誇張になることがあります。方向を定めれば大きく育ちます。',
  },
  'sun-saturn': {
    conjunction: '自分と責任が一つに固まります。重いけれど、その分だけ堅く長く続く人です。',
    flow: '努力と忍耐が自然に実になります。地道さが信頼となって返ります。',
    friction: '自由でいたい自分が義務に押されます。その重みに耐えて本当の大人になります。',
  },
  'sun-uranus': {
    conjunction: '人と違うことが自分らしさです。型にはまらないとき最も自分でいられます。',
    flow: '個性と自由が自然に輝きます。新しい挑戦がよく似合います。',
    friction: '目立ちたい気持ちと安定の間で揺れます。その緊張が革新を生みます。',
  },
  'sun-neptune': {
    conjunction: '自分が夢と感性に染まります。芸術的ですが、自分を見失わないように。',
    flow: '想像と自分が柔らかくつながります。理想を自然に描きます。',
    friction: '自分が誰なのか曖昧になることがあります。現実に足をつけて軸を保ちます。',
  },
  'sun-pluto': {
    conjunction: '強烈な存在感がそのまま自分です。危機のたびに自分を生まれ変わらせます。',
    flow: '深い意志が自然に力になります。変化を恐れません。',
    friction: '支配欲と自分がぶつかります。力を手放すとき、かえって強くなります。',
  },
  'moon-mercury': {
    conjunction: '感じることと考えることが一つです。心を言葉にするのが上手です。',
    flow: '感情と理性がよく通じます。気持ちを正直に楽に表せます。',
    friction: '頭と心がすれ違います。整理すれば感情に振り回されません。',
  },
  'moon-venus': {
    conjunction: '優しさと愛情が一つです。温かく慈しみ、愛らしく表現します。',
    flow: '心と愛が柔らかく流れます。関係の中で安らぎを感じます。',
    friction: '愛されたい気持ちが敏感に揺れます。まず自分を満たすと楽になります。',
  },
  'moon-mars': {
    conjunction: '感情がそのまま行動です。心が動けば熱く反応します。',
    flow: '感情と勇気が自然につながります。望むものを正直に表します。',
    friction: '感情がカッと込み上げることがあります。その熱を治めれば推進力になります。',
  },
  'moon-jupiter': {
    conjunction: '心が広く温かいです。与えるとき最も幸せです。',
    flow: '感情がおおらかに流れます。楽天が人を惹きつけます。',
    friction: '気分が過剰に膨らむことがあります。感情の大きさを調節すると楽になります。',
  },
  'moon-saturn': {
    conjunction: '感情を内に固く押さえます。そっけなく見えても、内は深く真剣です。',
    flow: '感情を静かに治められます。頼もしさで愛を示します。',
    friction: '心を開くのが難しく、寂しくなることがあります。自分をなだめ、壁を少しずつ下げていきます。',
  },
  'moon-uranus': {
    conjunction: '感情が自由で予測できません。縛られないとき安らぎます。',
    flow: '感情を軽やかに解きます。独立した心が魅力です。',
    friction: '気分が急に揺れることがあります。安定と自由の間でバランスを探します。',
  },
  'moon-neptune': {
    conjunction: '感情が想像と共感であふれます。人の心まで染み込むように感じます。',
    flow: '感性と直感が柔らかく流れます。芸術と癒やしに才があります。',
    friction: '感情と現実が曖昧に混ざります。境界を守って自分を守ります。',
  },
  'moon-pluto': {
    conjunction: '感情が深く強烈です。一度心を許すと最後まで掘り下げます。',
    flow: '深い感情を力に変えます。危機でも心が堅いです。',
    friction: '感情が執着に走ることがあります。手放せるとき自由になります。',
  },
  'mercury-venus': {
    conjunction: '言葉と感覚が一つです。柔らかく魅力的に表現します。',
    flow: '考えと好みが優雅に調和します。会話に品があります。',
    friction: '言葉と心が少しずれることがあります。正直さと思いやりのバランスを探します。',
  },
  'mercury-mars': {
    conjunction: '考えがそのまま言葉になり行動になります。素早く鋭いです。',
    flow: '判断と実行がぴたりと合います。決断が速くて爽やかです。',
    friction: '言葉が急いで尖ることがあります。一拍おけば説得力が増します。',
  },
  'mercury-jupiter': {
    conjunction: '考えが大きく広いです。学び分かち合うのが好きです。',
    flow: '大きな絵と細部がよく調和します。楽天的な知恵があります。',
    friction: '言葉が誇張したり散らかったりします。核心に集中すれば輝きます。',
  },
  'mercury-saturn': {
    conjunction: '考えが慎重で体系的です。言葉に重みと責任が乗ります。',
    flow: '集中力と論理がしっかりしています。地道に深く掘り下げます。',
    friction: '考えがつい自分を検閲します。自分を信じるほど言葉が固まります。',
  },
  'mercury-uranus': {
    conjunction: '考えが稲妻のように弾けます。人と違う洞察がひらめきます。',
    flow: '奇抜なアイデアがすらすら出ます。速く独創的な頭脳です。',
    friction: '考えが先走って焦ります。速度を緩めれば天才性が生きてきます。',
  },
  'mercury-neptune': {
    conjunction: '考えがイメージと想像へ流れます。詩的で直感的です。',
    flow: '想像力と表現が柔らかくつながります。比喩に才があります。',
    friction: '考えが曖昧で混乱することがあります。事実を確かめて軸を保ちます。',
  },
  'mercury-pluto': {
    conjunction: '考えが深く掘り下げます。隠れた真実を見抜きます。',
    flow: '集中した洞察が自然に流れます。探究に力があります。',
    friction: '考えが執拗に一点に刺さることがあります。柔らかくなるほど洞察が増します。',
  },
  'venus-mars': {
    conjunction: '愛情と情熱が一つに燃え上がります。惹かれたら熱く近づきます。',
    flow: '愛と欲が調和して流れます。魅力と推進力が共に輝きます。',
    friction: '望む心と近づき方がすれ違います。駆け引きの中で愛を学びます。',
  },
  'venus-jupiter': {
    conjunction: '愛も楽しみも豊かです。おおらかでロマンチックです。',
    flow: '愛情と幸運が共に流れます。人と美を惹きつけます。',
    friction: '愛も消費も過ぎることがあります。節制の中でより輝きます。',
  },
  'venus-saturn': {
    conjunction: '愛に真剣で長く続きます。簡単に開きませんが、一度与えれば変わりません。',
    flow: '責任を持って関係を築きます。信頼が愛の根です。',
    friction: '愛の前で縮んだり距離を感じたりします。心を開く練習が必要です。',
  },
  'venus-uranus': {
    conjunction: '愛が自由でスリリングです。縛られない関係に惹かれます。',
    flow: 'ときめきと独立がよく合います。新鮮な魅力があります。',
    friction: '心が愛と自由の間で揺れます。約束と余白のバランスを探します。',
  },
  'venus-neptune': {
    conjunction: '愛が夢のようにロマンチックです。献身的ですが、幻想に落ちないように。',
    flow: '感性と愛が柔らかく流れます。芸術的な魅力を持ちます。',
    friction: '理想と現実の恋人がすれ違います。ありのままを見るとき愛が深まります。',
  },
  'venus-pluto': {
    conjunction: '愛が深く強烈です。すべてを賭ける関係を求めます。',
    flow: '深い愛情が自然に力になります。心から没入します。',
    friction: '愛が執着や嫉妬に流れることがあります。手放すとき関係が生き返ります。',
  },
  'mars-jupiter': {
    conjunction: '行動力と度胸が一つです。大きく仕掛け、力強く押し進めます。',
    flow: '勇気とチャンスが共に流れます。挑むほど運が大きくなります。',
    friction: '意欲があふれて無理をすることがあります。力を調節すればより遠くへ行けます。',
  },
  'mars-saturn': {
    conjunction: '力と忍耐が一つに固まります。遅くても最後まで押し切る粘りがあります。',
    flow: '戦略と実行が着実に噛み合います。辛抱強く目標を叶えます。',
    friction: 'やりたいのに阻まれるもどかしさがあります。その壁を越えて本当の力を養います。',
  },
  'mars-uranus': {
    conjunction: '行動が稲妻のように速く大胆です。型を破る推進力があります。',
    flow: '瞬発力と独創性がよく合います。危機に素早く対応します。',
    friction: '衝動が急に爆発することがあります。ブレーキを覚えれば力が生きてきます。',
  },
  'mars-neptune': {
    conjunction: '行動が感性と理想を追います。ひらめきで動きます。',
    flow: '直感と行動が柔らかくつながります。水のように静かに進みます。',
    friction: '意欲が方向を失って曖昧になります。目標をはっきりさせれば力が集まります。',
  },
  'mars-pluto': {
    conjunction: '意志が恐ろしいほど強烈です。一度決めたら最後まで見届けます。',
    flow: '深い執念が自然に力になります。危機にいっそう強くなります。',
    friction: '力比べや極端に走ることがあります。そのエネルギーを治めれば無敵になります。',
  },
  'jupiter-saturn': {
    conjunction: '夢と現実が一つの場所で出会います。大きく描きつつ一歩ずつ叶えます。',
    flow: '楽観と忍耐が釣り合います。安定して成長します。',
    friction: '広げたい心と締めたい心がぶつかります。その間で賢い速度を見つけます。',
  },
  'jupiter-uranus': {
    conjunction: '幸運と革新が一つです。予想外のチャンスに強いです。',
    flow: '自由とチャンスが共に流れます。ひらめきが幸運につながります。',
    friction: '突然の変化に浮つくことがあります。自由を賢く使えば大きく開けます。',
  },
  'jupiter-neptune': {
    conjunction: '理想と信念が一つに膨らみます。大きく美しい夢を抱きます。',
    flow: '想像と寛大さが柔らかく流れます。霊的な豊かさがあります。',
    friction: '夢が過ぎて現実を見失うことがあります。理想に現実の錨を下ろします。',
  },
  'jupiter-pluto': {
    conjunction: '大きな志と強い力が一つです。局面を大きく変える野心があります。',
    flow: '深い確信が成長の力になります。危機を機会に育てます。',
    friction: '欲と支配が過熱することがあります。力を大きく使うほど謙虚さが要ります。',
  },
  'saturn-uranus': {
    conjunction: '守る力と変える力が一つの場所にあります。古い型を堅く立て直します。',
    flow: '安定と革新が釣り合います。現実的な改革者です。',
    friction: '古いものと新しいものの間でぴんと引き合います。その緊張が本当の変化を生みます。',
  },
  'saturn-neptune': {
    conjunction: '夢と現実が一つの体です。理想を構造へ形づくります。',
    flow: '想像と責任が柔らかく出会います。夢を一歩ずつ実現します。',
    friction: '理想と現実の間で揺れて疲れることがあります。その隙間を埋めて堅くなります。',
  },
  'saturn-pluto': {
    conjunction: '耐える力と変える力が一つです。どん底から積み直す人です。',
    flow: '粘りと洞察が深く噛み合います。危機に耐えて再建します。',
    friction: '壊すことと守ることの間で圧が高まります。その試練が根本からあなたを鍛えます。',
  },
  'uranus-neptune': {
    conjunction: '変革と想像が一つに流れます。新しい時代の夢を抱く世代です。',
    flow: '自由とひらめきが柔らかくつながります。理想を現実へ移します。',
    friction: '革新と幻想の間で揺れることがあります。方向をはっきりさせれば力が集まります。',
  },
  'uranus-pluto': {
    conjunction: '覆す力と立て直す力が一つです。根本を揺るがす世代です。',
    flow: '変化と洞察が強く噛み合います。時代を変えるエネルギーがあります。',
    friction: '急進と抵抗の間で激しくぶつかります。そのエネルギーが大きな変革を生みます。',
  },
  'neptune-pluto': {
    conjunction: '想像と深さが一つの体です。見えないものを変容させる世代です。',
    flow: '霊性と洞察が柔らかく流れます。深い意味を汲み上げます。',
    friction: '幻想と深淵の間で戸惑うことがあります。軸を保って深みを治めます。',
  },
}

const BY_LOCALE_ASPECTS: Record<PublicLocale, AspectPairReadings> = {
  ko: KO_ASPECTS,
  en: EN_ASPECTS,
  'zh-CN': ZH_ASPECTS,
  ja: JA_ASPECTS,
}

/**
 * Pair-specific reading for an aspect, in the given locale — e.g. what a
 * Sun–Saturn conjunction means, distinct from Venus–Saturn. Returns null for
 * pairs without dedicated copy (nodes / Part of Fortune), so callers can fall
 * back to the generic per-aspect-type description.
 */
export function aspectPairReading(locale: PublicLocale, a: PlanetId, b: PlanetId, aspect: AspectType): string | null {
  const readings = BY_LOCALE_ASPECTS[locale] ?? KO_ASPECTS
  return readings[pairKey(a, b)]?.[aspectTone(aspect)] ?? null
}
