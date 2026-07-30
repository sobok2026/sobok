import type { Messages } from './types'

export const zh = {
  Common: {
    localeSwitcher: '选择语言',
    primaryNav: '主菜单',
    meta: {
      title: '情侣默契测试',
      description: '通过默契指数和对话类型两项测试,了解你们的相处氛围。',
    },
    home: {
      heroTitle: '两分钟检测你们的默契',
      heroSubtitle: '回答几个简单问题,立即查看默契指数和对话类型。',
      gyeolCard: {
        title: '默契指数测试',
        description: '16道题目读取情感温度与关系平衡,并给出等级。',
        cta: '查看默契指数',
      },
      typeCard: {
        title: '对话类型测试',
        description: '结合聊天速度与表达方式,找到你们的对话类型。',
        cta: '查看对话类型',
      },
      deepTypeCard: {
        title: 'DeepType',
        description: '',
        cta: '',
      },
    },
  },
} satisfies Messages
