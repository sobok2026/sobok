import equipment from '../../data/equipment.json'
import materials from '../../data/materials.json'
import vessels from '../../data/vessels.json'
import { parseRecipeCatalog } from './recipe-catalog'

// Only the procedures supported by this shop belong in the startup bundle.
// These are imports of the same canonical files used by the complete library.
const documents = Object.values(
  import.meta.glob(
    [
      '../../data/recipes/drinks/black-glazed-latte.json',
      '../../data/recipes/drinks/hoji-glazed-tea-latte.json',
      '../../data/recipes/drinks/pure-hojicha.json',
      '../../data/recipes/drinks/pure-matcha.json',
      '../../data/recipes/drinks/cold-brew.json',
      '../../data/recipes/preparations/glazed-foam.json',
      '../../data/recipes/preparations/mocha-sauce.json',
      '../../data/recipes/preparations/hojicha-shot.json',
      '../../data/recipes/preparations/matcha-shot.json',
      '../../data/recipes/preparations/cold-brew-batch.json',
    ],
    { eager: true, import: 'default' },
  ),
)
const used = new Set<string>()
const referenceFields = new Set([
  'materialId',
  'equipmentId',
  'toolId',
  'toolIds',
  'itemId',
  'toId',
  'gasMaterialId',
  'excludeMaterialIds',
  'into',
  'from',
  'vessel',
])
function collectReferences(value: unknown) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if (referenceFields.has(key)) {
      for (const reference of Array.isArray(child) ? child : [child])
        if (typeof reference === 'string') used.add(reference)
    } else collectReferences(child)
  }
}
collectReferences(documents)
export const recipeCatalog = parseRecipeCatalog({
  recipes: documents,
  materials: materials.filter((item) => used.has(item.id)),
  equipment: equipment.filter((item) => used.has(item.id)),
  vessels: vessels.filter((item) => used.has(item.id)),
})
