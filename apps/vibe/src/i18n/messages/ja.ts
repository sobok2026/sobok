import type { Messages } from './types'

export const ja = {
  Common: {
    localeSwitcher: '言語選択',
    meta: {
      title: 'カップル相性診断',
      description: '結相性スコアと会話タイプ、2つの診断でふたりのバイブスをチェック。',
    },
    home: {
      heroTitle: 'ふたりのバイブス、2分でチェック',
      heroSubtitle: 'いくつかの質問に答えるだけで、相性スコアと会話タイプがすぐわかります。',
      gyeolCard: {
        title: '相性スコア診断',
        description: '16の質問で愛情のバランスを読み取り、等級をつけます。',
        cta: '相性スコアを見る',
      },
      typeCard: {
        title: '会話タイプ診断',
        description: '会話の速度と表現スタイルを組み合わせてタイプを見つけます。',
        cta: '会話タイプを見る',
      },
      deepTypeCard: {
        title: 'DeepType',
        description: '',
        cta: '',
      },
    },
  },
} satisfies Messages
