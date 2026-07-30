import { NOTIFICATION_CONDITION_TYPE, type NotificationConditionType } from '@sobok/domain/notification/model'
import { MAX_CRITERIA_NAME_LENGTH } from '@sobok/domain/notification/policy'
import { normalizeValue } from '@sobok/domain/utils/normalize-value'

export type ParsedCondition = {
  type: NotificationConditionType
  value: string
  displayValue: string
  isExcluded?: boolean
}

export type ParsedSearchQuery = {
  conditions: ParsedCondition[]
  plainKeywords: string[]
  suggestedName: string
}

const CATEGORY_TO_TYPE_MAP: Record<string, NotificationConditionType> = {
  series: NOTIFICATION_CONDITION_TYPE.SERIES,
  parody: NOTIFICATION_CONDITION_TYPE.SERIES,
  character: NOTIFICATION_CONDITION_TYPE.CHARACTER,
  tag: NOTIFICATION_CONDITION_TYPE.TAG,
  female: NOTIFICATION_CONDITION_TYPE.TAG,
  male: NOTIFICATION_CONDITION_TYPE.TAG,
  mixed: NOTIFICATION_CONDITION_TYPE.TAG,
  other: NOTIFICATION_CONDITION_TYPE.TAG,
  artist: NOTIFICATION_CONDITION_TYPE.ARTIST,
  group: NOTIFICATION_CONDITION_TYPE.GROUP,
  language: NOTIFICATION_CONDITION_TYPE.LANGUAGE,
  uploader: NOTIFICATION_CONDITION_TYPE.UPLOADER,
  // Korean mappings
  시리즈: NOTIFICATION_CONDITION_TYPE.SERIES,
  패러디: NOTIFICATION_CONDITION_TYPE.SERIES,
  캐릭터: NOTIFICATION_CONDITION_TYPE.CHARACTER,
  태그: NOTIFICATION_CONDITION_TYPE.TAG,
  여성: NOTIFICATION_CONDITION_TYPE.TAG,
  남성: NOTIFICATION_CONDITION_TYPE.TAG,
  혼합: NOTIFICATION_CONDITION_TYPE.TAG,
  기타: NOTIFICATION_CONDITION_TYPE.TAG,
  작가: NOTIFICATION_CONDITION_TYPE.ARTIST,
  그룹: NOTIFICATION_CONDITION_TYPE.GROUP,
  언어: NOTIFICATION_CONDITION_TYPE.LANGUAGE,
  업로더: NOTIFICATION_CONDITION_TYPE.UPLOADER,
}

// TODO: 로직 검증 필요
/**
 * Parses a search query into notification conditions
 * Extracts structured queries like "female:tag artist:name -male:tag" into conditions
 * and plain keywords for potential tag matching
 *
 * Optimized single-pass algorithm with O(n) time complexity
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  if (!query?.trim()) {
    return { conditions: [], plainKeywords: [], suggestedName: '' }
  }

  const conditions: ParsedCondition[] = []
  const plainKeywords: string[] = []
  const processedParts: string[] = []

  let i = 0
  const len = query.length

  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(query[i])) {
      i++
    }

    if (i >= len) break

    // Check for minus prefix
    const isExclusion = query[i] === '-'
    if (isExclusion) {
      i++
    }

    // Collect the word/category
    const wordStart = i
    while (i < len && isWordChar(query[i])) {
      i++
    }

    if (i > wordStart) {
      const currentWord = query.slice(wordStart, i)

      // Check if this is a category:value pair
      if (i < len && query[i] === ':') {
        i++ // Skip the colon

        // Collect the value (non-whitespace characters)
        const valueStart = i
        while (i < len && !/\s/.test(query[i])) {
          i++
        }

        if (i > valueStart) {
          const category = currentWord.toLowerCase()
          const conditionType = CATEGORY_TO_TYPE_MAP[category]

          if (conditionType) {
            const value = query.slice(valueStart, i)
            const normalizedValue = normalizeValue(value)

            conditions.push({
              type: conditionType,
              value: normalizedValue,
              displayValue: value,
              ...(isExclusion && { isExcluded: true }),
            })

            if (!isExclusion) {
              processedParts.push(value)
            }
          } else {
            // Not a recognized category, treat as plain keyword
            const fullKeyword = `${currentWord}:${query.slice(valueStart, i)}`
            if (!isExclusion) {
              plainKeywords.push(fullKeyword)
              processedParts.push(fullKeyword)
            }
          }
        }
      } else {
        // It's a plain keyword
        if (!isExclusion) {
          plainKeywords.push(currentWord)
          processedParts.push(currentWord)
        }
      }
    } else {
      // Handle non-word characters as part of keywords
      const keywordStart = i
      while (i < len && !/\s/.test(query[i]) && query[i] !== '-' && !isWordChar(query[i])) {
        i++
      }

      if (i > keywordStart && !isExclusion) {
        const keyword = query.slice(keywordStart, i)
        plainKeywords.push(keyword)
        processedParts.push(keyword)
      }
    }
  }

  const suggestedName = generateSuggestedName(processedParts, conditions).slice(0, MAX_CRITERIA_NAME_LENGTH)

  return { conditions, plainKeywords, suggestedName }
}

// Helper function to check if a character is part of a word (including Unicode)
const isWordChar = (char: string): boolean => {
  return /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/.test(char)
}

/**
 * Generates a user-friendly name for the notification criteria
 * Prioritizes specific tags/artists over generic keywords
 */
function generateSuggestedName(parts: string[], conditions: ParsedCondition[]): string {
  const includedConditions = conditions.filter((condition) => !condition.isExcluded)

  // If we have specific included conditions, prioritize those
  if (includedConditions.length > 0) {
    const priorityConditions = includedConditions
      .filter(
        (c) =>
          c.type === NOTIFICATION_CONDITION_TYPE.ARTIST ||
          c.type === NOTIFICATION_CONDITION_TYPE.SERIES ||
          c.type === NOTIFICATION_CONDITION_TYPE.CHARACTER ||
          c.type === NOTIFICATION_CONDITION_TYPE.UPLOADER,
      )
      .slice(0, 2)

    if (priorityConditions.length > 0) {
      return priorityConditions.map((c) => c.displayValue).join(', ')
    }

    // Fall back to first few conditions
    return includedConditions
      .slice(0, 2)
      .map((c) => c.displayValue)
      .join(', ')
  }

  // Use plain keywords if no conditions
  if (parts.length > 0) {
    return parts.slice(0, 2).join(' ')
  }

  // Fall back to excluded conditions when the query only contains exclusions
  if (conditions.length > 0) {
    return conditions
      .slice(0, 2)
      .map((condition) => `-${condition.displayValue}`)
      .join(', ')
  }

  return '검색 알림'
}
