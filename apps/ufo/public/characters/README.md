# 캐릭터 아트 (WebP)

이 폴더에 아래 파일을 넣으면 게임이 이모지 대신 그 이미지를 씁니다.
파일이 없으면 자동으로 이모지로 폴백하므로 하나씩 채워 넣어도 됩니다.

## 스펙

- 포맷: **WebP** (`.webp`), 알파(투명 배경) 필수
- 크기: **512×512** 정사각형 권장 (캔버스에서 자동 축소)
- 구도: 캐릭터를 프레임 중앙, 여백 살짝, 정면 상반신 또는 전신
- 스타일: 서로 일관된 아트 스타일 (같은 화가가 그린 느낌)

## 외계인 (사람) — `alien-<key>.webp`

| 파일                   | 컨셉            |
| ---------------------- | --------------- |
| `alien-beautiful.webp` | 아름다운        |
| `alien-cute.webp`      | 귀여운          |
| `alien-cool.webp`      | 쿨한 / 시크한   |
| `alien-ugly.webp`      | 못생긴          |
| `alien-chubby.webp`    | 뚱뚱한          |
| `alien-macho.webp`     | 마초            |
| `alien-nerd.webp`      | 너드 / 안경잡이 |
| `alien-hipster.webp`   | 힙스터          |

## 적 (저출산 몬스터) — `monster-<key>.webp`

| 파일                    | 컨셉     |
| ----------------------- | -------- |
| `monster-rent.webp`     | 집값     |
| `monster-overtime.webp` | 야근     |
| `monster-tuition.webp`  | 사교육비 |

## 추가/변경

- 아키타입을 늘리려면 `src/game/archetypes.ts`의 `ALIEN_ARCHETYPES`에 `{ key, label, emoji }`를 추가하고 같은 `key`로 `alien-<key>.webp`를 넣으면 됩니다.
- 적을 늘리려면 `src/game/config.ts`의 `MONSTER_KINDS`에 추가.
