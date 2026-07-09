import SuggestionTrie from './trie'

// 만화 카탈로그(@sobok/catalog)가 제거되어 자동완성 데이터 소스가 없으므로 빈 트라이를 노출한다.
// 비-만화 검색 데이터 소스가 생기면 여기서 트라이를 채우면 된다.
export const suggestionTrie = new SuggestionTrie()
