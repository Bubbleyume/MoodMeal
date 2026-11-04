import type { StructuredIngredient } from "../types/library";

/**
 * Tag-check weights (stage D batch 6, owner-approved 2026-11-04; docs/research/STAGE-D-BATCH-6.md).
 * Grams for one exact recipe line, used ONLY by the meal tag rule (src/lib/mealTagRule.ts).
 * They are not USDA mappings. They never feed the Nutrition Calculator or a recipe estimate, and
 * the holds in docs/usda/remaining-ingredient-review.json are unchanged. The tag rule uses the
 * food's lowest owner-approved evidence record, so it does not depend on which record a later
 * nutrition approval chooses.
 */
export interface TagCheckWeight {
  recipeId: string;
  ingredient: string;
  quantity: number;
  unit: string;
  notes: string;
  grams: number;
  basis: string;
}

const OZ = 28.349523125; // exact avoirdupois ounce
const MASS = "Exact mass conversion, 1 oz = 28.349523125 g (batch 6, decision 1).";
const QUINOA = "USDA FDC 168917 'Quinoa, cooked', 185 g per cup; cup packing not kitchen-measured (batch 6, decision 4).";

export const TAG_CHECK_WEIGHTS: TagCheckWeight[] = [
  { recipeId: "recipe-salmon-quinoa-bowl", ingredient: "Wild salmon fillet", quantity: 4, unit: "oz", notes: "", grams: 4 * OZ, basis: MASS },
  { recipeId: "recipe-steak-and-greens", ingredient: "Lean beef", quantity: 4, unit: "oz", notes: "", grams: 4 * OZ, basis: MASS },
  { recipeId: "recipe-iron-rich-stir-fry", ingredient: "Lean beef strips", quantity: 4, unit: "oz", notes: "", grams: 4 * OZ, basis: MASS },
  { recipeId: "recipe-turkey-lettuce-wraps", ingredient: "Cooked turkey breast", quantity: 4, unit: "oz", notes: "sliced", grams: 4 * OZ, basis: MASS },
  { recipeId: "recipe-cozy-sweet-potato-hash", ingredient: "Cooked turkey breast", quantity: 3, unit: "oz", notes: "diced", grams: 3 * OZ, basis: MASS },
  { recipeId: "recipe-energizing-power-bowl", ingredient: "Egg", quantity: 1, unit: "each", notes: "", grams: 50,
    basis: "Large egg, 50 g edible, as approved for the hash, pancakes and avocado toast (batch 6, decision 2)." },
  { recipeId: "recipe-tropical-energy-smoothie", ingredient: "Chia seeds", quantity: 1, unit: "tbsp", notes: "", grams: 10.5,
    basis: "USDA FDC 2707590 portion 298766, 168 g per cup ÷ 16 tbsp (US convention); derived, not measured (batch 6, decision 3)." },
  { recipeId: "recipe-magnesium-boost-bowl", ingredient: "Quinoa", quantity: 0.75, unit: "cup", notes: "cooked", grams: 138.75, basis: QUINOA },
  { recipeId: "recipe-salmon-quinoa-bowl", ingredient: "Cooked quinoa", quantity: 0.75, unit: "cup", notes: "", grams: 138.75, basis: QUINOA },
  { recipeId: "recipe-quinoa-fruit-salad", ingredient: "Cooked quinoa", quantity: 1, unit: "cup", notes: "cooled", grams: 185, basis: QUINOA },
];

/** The tag-check weight for this exact line (name, quantity, unit and notes), or null. */
export function tagCheckWeight(line: StructuredIngredient, recipeId: string): TagCheckWeight | null {
  return TAG_CHECK_WEIGHTS.find((w) =>
    w.recipeId === recipeId && w.ingredient === line.name && w.unit === line.unit
    && line.quantity !== null && Math.abs(w.quantity - line.quantity) < 1e-9 && w.notes === line.notes) ?? null;
}
