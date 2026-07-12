import { Locale } from '../locale'

export const APPLICATION_NAME = '소복 - 아티스트 프라이빗 메시지'
export const SHORT_NAME = '소복'

export const THEME_COLOR = {
  light: '#ffffff',
  dark: '#0a0a0a',
} as const

export const DESCRIPTION = '좋아하는 아티스트의 메시지를 받고 답장을 보낼 수 있는 팬 메시징 서비스입니다.'

export const APP_METADATA = {
  [Locale.KO]: {
    applicationName: APPLICATION_NAME,
    description: DESCRIPTION,
    shortName: SHORT_NAME,
  },
  [Locale.EN]: {
    applicationName: 'Sobok - Private Messages from Artists',
    description: 'A fan messaging service where you receive messages from your favorite artists and reply to them.',
    shortName: 'Sobok',
  },
  [Locale.JA]: {
    applicationName: 'ソボク - アーティストのプライベートメッセージ',
    description: '好きなアーティストからのメッセージを受け取って返信できるファンメッセージサービスです。',
    shortName: 'ソボク',
  },
  [Locale.ZH]: {
    applicationName: 'Sobok - 艺人私信',
    description: '一个粉丝消息服务，可接收你喜欢的艺人发来的消息并进行回复。',
    shortName: 'Sobok',
  },
} satisfies Record<Locale, { applicationName: string; description: string; shortName: string }>
