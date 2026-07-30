import type { GemCode, InnerCode } from '../model'
import { WORLD_JOB_NAMES } from './world-job-names'

// Runtime-final values, not the first declaration. The source HTML declares these once near the top and then
// overwrites them from later patch scripts, so the literals at the declaration site are stale; what shipped is the
// last write. Recorded here so the divergence cannot silently reappear:
//   WORLD_JOB_FAMILY - declared at :4087, replaced wholesale at :6998 (script correction-8), then `role` alone
//     replaced again at :7263 (script correction-9). Every field below is the post-:7263 value.
//   WORLD_JOB_CORE   - declared at :4105, replaced wholesale at :7065 (script correction-8).
// WORLD_ART_POSITION (:4123) is deliberately NOT carried over: it is a background-position into the legacy
// sprite sheet assets/classes/class-roster-v1.png, not into the per-inner result-art webp, and its 16 keys
// resolve to only four corner values. Re-derive against whatever art the new card ships.

// One entry per inner code, and the keys are 1:1 with assets/result-art-v47/world/<key>.webp, so the art lookup
// needs no separate identifier table.
export const WORLD_JOB_FAMILY = {
  ENFJ: {
    method: '사람의 장점을 알아보고 한 걸음 더 나아가게 도와요.',
    name: '성장을 돕는 안내자',
    role: '힘 북돋기 · 키우기 · 모으기',
  },
  ENFP: {
    method: '사람과 생각을 이어 새로운 가능성을 찾아요.',
    name: '가능성을 찾는 탐험가',
    role: '찾기 · 잇기 · 시작하기',
  },
  ENTJ: {
    method: '큰 목표를 세우고 사람과 일을 모아 앞으로 이끌어요.',
    name: '큰 목표를 이끄는 원정대장',
    role: '목표 세우기 · 준비 모으기 · 새길 열기',
  },
  ENTP: {
    method: '익숙한 방법을 다르게 보고 더 나은 방법을 만들어요.',
    name: '새 방법을 만드는 발명가',
    role: '생각 내기 · 뒤집기 · 규칙 만들기',
  },
  ESFJ: {
    method: '주변 사람을 살피고 모두가 함께 움직이게 도와요.',
    name: '사람을 잇는 모임 진행자',
    role: '사람 잇기 · 챙기기 · 함께하기',
  },
  ESFP: {
    method: '사람들의 반응을 보고 즐거운 분위기를 만들어요.',
    name: '분위기를 살리는 연출자',
    role: '즐기기 · 맞이하기 · 분위기 띄우기',
  },
  ESTJ: {
    method: '사람과 할 일을 나눠 목표한 결과를 끝까지 만들어요.',
    name: '일을 끝내는 현장 대장',
    role: '실행하기 · 나누기 · 기준 세우기',
  },
  ESTP: {
    method: '먼저 움직이고 부딪쳐 보면서 답을 찾아요.',
    name: '먼저 움직이는 해결사',
    role: '먼저 하기 · 위기 풀기 · 도전하기',
  },
  INFJ: {
    method: '여러 말 속에서 중요한 뜻을 찾아 다음 방향을 정해요.',
    name: '마음을 읽는 길잡이',
    role: '뜻 찾기 · 마음 읽기 · 길잡기',
  },
  INFP: {
    method: '중요하게 여기는 마음을 글과 이야기로 남겨요.',
    name: '마음을 쓰는 이야기 작가',
    role: '소중한 것 · 이야기 · 마음 전하기',
  },
  INTJ: {
    method: '목표에 닿기 위한 순서와 방법을 먼저 짜요.',
    name: '앞날을 그리는 설계자',
    role: '계획 짜기 · 순서 잡기 · 멀리 보기',
  },
  INTP: {
    method: '왜 그런지 계속 묻고 숨어 있는 규칙을 찾아요.',
    name: '원리를 찾는 연구자',
    role: '이유 찾기 · 묻기 · 시험하기',
  },
  ISFJ: {
    method: '작은 변화를 알아보고 사람과 약속을 잘 챙겨요.',
    name: '세심한 수호자',
    role: '지키기 · 살피기 · 돕기',
  },
  ISFP: {
    method: '눈과 손으로 느낀 것을 자기만의 모습으로 만들어요.',
    name: '감각을 담는 예술가',
    role: '느끼기 · 만들기 · 보여주기',
  },
  ISTJ: {
    method: '해야 할 일을 정리하고 빠진 것이 없는지 확인해요.',
    name: '꼼꼼한 기록관',
    role: '기록하기 · 확인하기 · 지키기',
  },
  ISTP: {
    method: '직접 만지고 해보면서 막힌 문제를 풀어요.',
    name: '현장의 기술자',
    role: '뜯어보기 · 고치기 · 바로 움직이기',
  },
} as const

// One entry per core code, keyed the way the source already keyed it. The declaration-site literal is stale:
// correction-8 (:7065) replaced every entry, so these are the post-patch strings.
export const WORLD_JOB_CORE = {
  MAHO: {
    name: '마음을 차분히 정리하는 힘',
    strength: '복잡한 마음을 혼자 정리하고 편한 자리를 찾아요.',
  },
  MAHU: {
    name: '큰 가능성을 키우는 힘',
    strength: '아직 보이지 않는 가능성을 혼자 오래 키워요.',
  },
  MAVO: {
    name: '부담 없이 시작하는 힘',
    strength: '내 속도를 지키면서 새로운 일을 가볍게 시작해요.',
  },
  MAVU: {
    name: '내 색을 보여주는 힘',
    strength: '나만의 생각과 모습을 밖으로 꺼내 보여줘요.',
  },
  MOHO: {
    name: '작은 변화를 알아보는 힘',
    strength: '표정과 말투의 작은 변화를 놓치지 않아요.',
  },
  MOHU: {
    name: '속마음을 오래 살피는 힘',
    strength: '말로 다 하지 않은 마음도 천천히 생각해요.',
  },
  MOVO: {
    name: '먼저 다가가는 힘',
    strength: '주변 반응을 살피고 먼저 편하게 말을 걸어요.',
  },
  MOVU: {
    name: '함께 가능성을 키우는 힘',
    strength: '사람들과 생각을 주고받을수록 새로운 힘이 생겨요.',
  },
  RAHO: {
    name: '내 기준을 지키는 힘',
    strength: '스스로 정한 기준을 쉽게 바꾸지 않아요.',
  },
  RAHU: {
    name: '혼자 깊이 파는 힘',
    strength: '혼자 집중하면서 어려운 일도 끝까지 알아봐요.',
  },
  RAVO: {
    name: '내 속도를 지키는 힘',
    strength: '내 공간과 시간을 지키며 편한 흐름을 만들어요.',
  },
  RAVU: {
    name: '새 길을 여는 힘',
    strength: '스스로 판단하고 새로운 일을 먼저 시작해요.',
  },
  ROHO: {
    name: '소중한 것을 지키는 힘',
    strength: '익숙한 관계와 생활을 차분히 이어가요.',
  },
  ROHU: {
    name: '마음먹은 일을 미는 힘',
    strength: '중요하다고 생각한 일은 쉽게 놓지 않아요.',
  },
  ROVO: {
    name: '사람을 오래 챙기는 힘',
    strength: '가까운 사람과 한 약속을 오래 지켜요.',
  },
  ROVU: {
    name: '함께 앞으로 가는 힘',
    strength: '믿는 방향이 생기면 사람들과 함께 먼저 움직여요.',
  },
} as const

/**
 * The world job for a pair of codes: the core, the family, and the one hand-authored name.
 *
 * Assembled here because both engines need exactly this triple and both had their own copy of it — the free
 * engine's `buildFreeReport` and the narration profile's `buildReportProfile`. The name is looked up whole from
 * the 256-entry table rather than composed from the two halves; composition is what the origin shipped and it
 * produced 256 strings that read the same.
 */
export function resolveWorldJob(inner: InnerCode, gem: GemCode) {
  return {
    core: WORLD_JOB_CORE[gem],
    family: WORLD_JOB_FAMILY[inner],
    name: WORLD_JOB_NAMES[`${inner}_${gem}`],
  }
}
