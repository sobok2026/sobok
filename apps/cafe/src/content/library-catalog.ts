import equipment from '../../data/equipment.json'
import materials from '../../data/materials.json'
import vessels from '../../data/vessels.json'
import { parseRecipeCatalog } from './recipe-catalog'

const recipes = Object.values(import.meta.glob('../../data/recipes/**/*.json', { eager: true, import: 'default' }))
export const libraryCatalog = parseRecipeCatalog({ recipes, materials, equipment, vessels })
