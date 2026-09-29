export type TableId = 'table' | `table-${string}`
export type SeatKind = 'chair' | 'lounge' | 'bench' | 'stool' | 'sofa'
export type Seat = { x: number; z: number; yaw: number; kind: SeatKind; capacity: number }
export type Table = {
  name: string
  floor: 0 | 1 | 2
  x: number
  z: number
  width: number
  depth: number
  height: number
  shape: 'round' | 'rect'
  legs: boolean
  seats: Seat[]
  approach: [number, number][]
}

export const PUBLIC_AISLE_X = -2.4
export const PUBLIC_AISLE_Z = 2
const entries: [TableId, Table][] = []
const number = (value: number) => String(value + 1).padStart(2, '0')
const seat = (x: number, z: number, yaw: number, kind: SeatKind = 'chair'): Seat => ({
  x,
  z,
  yaw,
  kind,
  capacity: kind === 'sofa' ? 2 : 1,
})
const toward = (x: number, z: number, targetX: number, targetZ: number, kind: SeatKind = 'chair') =>
  seat(x, z, Math.atan2(x - targetX, z - targetZ), kind)

function add(
  id: TableId,
  table: Omit<Table, 'height' | 'shape' | 'legs'> & Partial<Pick<Table, 'height' | 'shape' | 'legs'>>,
) {
  entries.push([id, { height: 0.85, shape: 'round', legs: true, ...table }])
}

for (const [index, x] of [1.3, 6.1].entries()) {
  const z = 4.4
  add(index ? 'table' : 'table-left', {
    name: `1층 원형 테이블 ${index + 1}`,
    floor: 0,
    x,
    z,
    width: 1.3,
    depth: 1.3,
    seats: [toward(x, z - 1, x, z), toward(x, z + 1, x, z), toward(x - 1, z, x, z), toward(x + 1, z, x, z)],
    approach: [
      [x, PUBLIC_AISLE_Z],
      [x, z - 1],
    ],
  })
}

for (let i = 0; i < 7; i++) {
  const x = 2.6,
    z = 8.4 + i * 1.3
  add(`table-ground-communal-${number(i)}`, {
    name: `1층 공용 테이블 ${i + 1}구역`,
    floor: 0,
    x,
    z,
    width: 1.25,
    depth: 1.3,
    shape: 'rect',
    legs: i === 0 || i === 6,
    seats: [toward(x - 1.2, z, x, z), toward(x + 1.2, z, x, z)],
    approach: [
      [PUBLIC_AISLE_X, z],
      [x - 1.2, z],
    ],
  })
}

for (const [i, x] of [5, 7.8, 10.5].entries()) {
  const z = 18.6
  add(`table-ground-window-${number(i)}`, {
    name: `1층 창가 테이블 ${i + 1}`,
    floor: 0,
    x,
    z,
    width: 0.55,
    depth: 0.55,
    height: 0.61,
    seats: [seat(x - 0.65, z, Math.PI, 'lounge'), seat(x + 0.65, z, Math.PI, 'lounge')],
    approach: [
      [PUBLIC_AISLE_X, 17.7],
      [x - 0.65, 17.7],
      [x - 0.65, z],
    ],
  })
}

for (const [i, z] of [12.3, 13.3, 15, 16, 17.7, 18.7].entries()) {
  const x = -10.4
  add(`table-ground-bench-${number(i)}`, {
    name: `1층 벤치 테이블 ${i + 1}`,
    floor: 0,
    x,
    z,
    width: 0.64,
    depth: 0.64,
    seats: [toward(x + 0.82, z, x, z), toward(x - 0.86, z, x, z, 'bench')],
    approach: [
      [-8.8, PUBLIC_AISLE_Z],
      [-8.8, z],
      [x + 0.82, z],
    ],
  })
}

for (const [i, z] of [-3.5, 0.2, 4].entries()) {
  const x = 10.4
  add(`table-ground-side-${number(i)}`, {
    name: `1층 안쪽 테이블 ${i + 1}`,
    floor: 0,
    x,
    z,
    width: 0.8,
    depth: 0.8,
    seats: [toward(x, z - 0.85, x, z), toward(x, z + 0.85, x, z)],
    approach: [
      [11.3, PUBLIC_AISLE_Z],
      [11.3, z - 0.85],
      [x, z - 0.85],
    ],
  })
}

for (let i = 0; i < 3; i++) {
  const x = 11.3,
    z = 11.7 + i * 1.2
  add(`table-ground-window-bar-${number(i)}`, {
    name: `1층 창가 바 ${i + 1}구역`,
    floor: 0,
    x,
    z,
    width: 0.5,
    depth: 1.2,
    height: 1.02,
    shape: 'rect',
    legs: i !== 1,
    seats: [toward(10.6, z, x, z, 'stool')],
    approach: [
      [8.7, PUBLIC_AISLE_Z],
      [8.7, z],
      [10.6, z],
    ],
  })
}

for (let group = 0; group < 2; group++) {
  for (let i = 0; i < 6; i++) {
    const x = 1.2,
      z = (group ? 7.8 : -4.6) + i * 1.35
    add(`table-upper-communal-${group + 1}-${number(i)}`, {
      name: `2층 공용 테이블 ${group + 1} · ${i + 1}구역`,
      floor: 1,
      x,
      z,
      width: 1.25,
      depth: 1.35,
      shape: 'rect',
      legs: i === 0 || i === 5,
      seats: [toward(x - 1.2, z, x, z), toward(x + 1.2, z, x, z)],
      approach: [
        [PUBLIC_AISLE_X, z],
        [x - 1.2, z],
      ],
    })
  }
}

for (const [column, x] of [-9.5, 5.3].entries()) {
  for (let i = 0; i < 6; i++) {
    const z = -4.9 + i * 3.8
    const approachX = column ? 3.3 : -7.7
    const chairX = column ? x - 1 : x + 1
    add(`table-upper-${column ? 'east' : 'west'}-${number(i)}`, {
      name: `2층 ${column ? '중앙' : '서쪽'} 테이블 ${i + 1}`,
      floor: 1,
      x,
      z,
      width: 1.15,
      depth: 1.15,
      shape: i % 2 ? 'rect' : 'round',
      seats: [
        toward(chairX, z, x, z),
        toward(x, z - 1, x, z),
        toward(x, z + 1, x, z),
        toward(column ? x + 1 : x - 1, z, x, z),
      ],
      approach: column
        ? [
            [PUBLIC_AISLE_X, 4.6],
            [approachX, 4.6],
            [approachX, z],
            [chairX, z],
          ]
        : [
            [PUBLIC_AISLE_X, 3.2],
            [approachX, 3.2],
            [approachX, z],
            [chairX, z],
          ],
    })
  }
}

for (const [i, z] of [-3.7, 2.7, 9.1, 15.5].entries()) {
  const x = 9.3
  add(`table-upper-window-east-${number(i)}`, {
    name: `2층 창가 라운지 ${i + 1}`,
    floor: 1,
    x,
    z,
    width: 0.65,
    depth: 1.3,
    height: 0.61,
    shape: 'rect',
    seats: [
      seat(8.4, z - 0.48, -Math.PI / 2, 'lounge'),
      seat(8.4, z + 0.48, -Math.PI / 2, 'lounge'),
      seat(10.2, z - 0.48, Math.PI / 2, 'lounge'),
      seat(10.2, z + 0.48, Math.PI / 2, 'lounge'),
    ],
    approach: [
      [PUBLIC_AISLE_X, 4.6],
      [7.5, 4.6],
      [7.5, z - 0.48],
      [8.4, z - 0.48],
    ],
  })
}

for (const [i, x] of [-8.6, -3.4, 1.8, 7].entries()) {
  const z = 18.2
  add(`table-upper-window-front-${number(i)}`, {
    name: `2층 전망 테이블 ${i + 1}`,
    floor: 1,
    x,
    z,
    width: 1.3,
    depth: 0.65,
    height: 0.61,
    shape: 'rect',
    seats: [
      seat(x - 0.48, 17.3, Math.PI, 'lounge'),
      seat(x + 0.48, 17.3, Math.PI, 'lounge'),
      seat(x - 0.48, 19.1, 0, 'lounge'),
      seat(x + 0.48, 19.1, 0, 'lounge'),
    ],
    approach: [
      [PUBLIC_AISLE_X, 16.2],
      [x - 0.48, 16.2],
      [x - 0.48, 17.3],
    ],
  })
}

for (let i = 0; i < 11; i++) {
  const x = -8 + i * 1.7,
    z = -8.55
  add(`table-upper-bench-${number(i)}`, {
    name: `2층 벤치 테이블 ${i + 1}`,
    floor: 1,
    x,
    z,
    width: 0.7,
    depth: 0.7,
    seats: [toward(x, -7.75, x, z), toward(x, -9.25, x, z, 'bench')],
    approach: [
      [PUBLIC_AISLE_X, -6.8],
      [x, -6.8],
      [x, -7.75],
    ],
  })
}

for (const [i, z] of [-3.9, 0.1, 13.6].entries()) {
  const x = -4.8
  add(`table-upper-corner-${number(i)}`, {
    name: `2층 안쪽 테이블 ${i + 1}`,
    floor: 1,
    x,
    z,
    width: 1.15,
    depth: 1.15,
    seats: [toward(x + 1, z, x, z), toward(x - 1, z, x, z), toward(x, z - 1, x, z), toward(x, z + 1, x, z)],
    approach: [
      [PUBLIC_AISLE_X, z],
      [x + 1, z],
    ],
  })
}

for (const [column, x] of [-9.4, -5.3, -1.2, 2.9, 7].entries()) {
  for (const [row, z] of [-5.4, -0.5].entries()) {
    add(`table-roof-dining-${column + 1}-${row + 1}`, {
      name: `루프탑 테이블 ${column * 2 + row + 1}`,
      floor: 2,
      x,
      z,
      width: 1.2,
      depth: 1.2,
      seats: [toward(x, z + 1, x, z), toward(x, z - 1, x, z), toward(x - 1, z, x, z), toward(x + 1, z, x, z)],
      approach: [
        [PUBLIC_AISLE_X, 2],
        [x + 2.05, 2],
        [x + 2.05, z + 1],
        [x, z + 1],
      ],
    })
  }
}

for (const [i, z] of [4, 7.2, 10.4, 13.6, 16.8].entries()) {
  const x = 9.45
  add(`table-roof-sofa-east-${number(i)}`, {
    name: `루프탑 동쪽 소파 ${i + 1}`,
    floor: 2,
    x,
    z,
    width: 0.65,
    depth: 1.1,
    height: 0.53,
    shape: 'rect',
    seats: [seat(10.6, z, Math.PI / 2, 'sofa')],
    approach: [
      [8, 3.3],
      [8, z - 1.3],
      [10.6, z - 1.3],
      [10.6, z],
    ],
  })
}
for (const [i, z] of [4, 7.2, 10.4, 13.6].entries()) {
  const x = -9.55
  add(`table-roof-sofa-west-${number(i)}`, {
    name: `루프탑 서쪽 소파 ${i + 1}`,
    floor: 2,
    x,
    z,
    width: 0.65,
    depth: 1.1,
    height: 0.53,
    shape: 'rect',
    seats: [seat(-10.7, z, -Math.PI / 2, 'sofa')],
    approach: [
      [-8.3, 3.2],
      [-8.3, z + 1.3],
      [-10.7, z + 1.3],
      [-10.7, z],
    ],
  })
}
for (const [i, x] of [-9, -6.5, 6.5, 9].entries()) {
  const z = 17.55
  add(`table-roof-sofa-front-${number(i)}`, {
    name: `루프탑 전망 소파 ${i + 1}`,
    floor: 2,
    x,
    z,
    width: 1.1,
    depth: 0.65,
    height: 0.53,
    shape: 'rect',
    seats: [seat(x, 18.7, 0, 'sofa')],
    approach: [
      [PUBLIC_AISLE_X, 16],
      [x - 1.25, 16],
      [x - 1.25, 18.7],
      [x, 18.7],
    ],
  })
}

export const TABLES = Object.fromEntries(entries) as Record<TableId, Table>
