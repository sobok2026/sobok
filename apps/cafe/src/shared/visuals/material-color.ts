import { INGREDIENTS, type Ingredient } from '../../content/ingredients'

const groupColors: Record<Ingredient['visualGroup'], string> = {
  coffee: '#4d2b18',
  milk: '#eee1c7',
  tea: '#967345',
  sauce: '#cdad74',
  foam: '#fff2d7',
  powder: '#936d42',
  ice: '#deeeeb',
  water: '#d7e9e1',
  other: '#dfc29b',
}

export const materialGroup = (id: string): Ingredient['visualGroup'] =>
  INGREDIENTS[id]?.visualGroup ?? (id === 'water' || id === 'ice' ? id : 'other')

/** Kept free of three.js so the work HUD can color a gauge without loading the 3D bundle. */
export function materialColor(id: string, fallback = '#dfc29b') {
  const material = INGREDIENTS[id]
  return material?.color ?? (material || id === 'water' || id === 'ice' ? groupColors[materialGroup(id)] : fallback)
}
