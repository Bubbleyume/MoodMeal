import type { StructuredIngredient } from "../types/library";

/**
 * Tag-check weights (stage D batches 6 and 7, owner-approved 2026-11-04; docs/research/STAGE-D-BATCH-6.md and -7.md).
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
const YOGURT = "Whole, low-fat and nonfat Greek yogurt records all give 1 cup = 245 g (FDC 2705422/3/4, portions 290696/290701/290706); fat level stays held (batch 7, decision 1).";
const CUCUMBER = "Owner-defined USDA reference cucumber with peel, 8-1/4 in: FDC 168409 portion 83050 = 301 g (batch 7, decision 2).";
const QUINOA ="USDA FDC 168917 'Quinoa, cooked', 185 g per cup; cup packing not kitchen-measured (batch 6, decision 4).";

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

  // Batch 7, decision 1: every candidate record gives the same weight, or the lowest is used.
  { recipeId: "recipe-berry-yogurt-parfait", ingredient: "Greek yogurt", quantity: 1, unit: "cup", notes: "", grams: 245, basis: YOGURT },
  { recipeId: "recipe-immune-boost-smoothie", ingredient: "Greek yogurt", quantity: 0.5, unit: "cup", notes: "", grams: 122.5, basis: YOGURT },
  { recipeId: "recipe-calming-kefir-smoothie", ingredient: "Kefir", quantity: 1, unit: "cup", notes: "", grams: 243,
    basis: "Lower of the two candidate cups: FDC 170904 portion 87527 = 243 g; FDC 2705394 = 244 g (batch 7, decision 1)." },
  { recipeId: "recipe-calming-kefir-smoothie", ingredient: "Blueberries", quantity: 0.5, unit: "cup", notes: "", grams: 74,
    basis: "Half of FDC 171711 portion 89238 (1 cup = 148 g), fresh; frozen cups weigh more (batch 7, decision 1)." },
  { recipeId: "recipe-tropical-energy-smoothie", ingredient: "Coconut water", quantity: 1, unit: "cup", notes: "", grams: 245,
    basis: "FDC 174831 portion 94966, ready-to-drink unsweetened, 1 cup = 245 g (batch 7, decision 1)." },
  { recipeId: "recipe-quinoa-fruit-salad", ingredient: "Pineapple", quantity: 0.5, unit: "cup", notes: "diced", grams: 82.5,
    basis: "Half of FDC 169124 portion 84287 (1 cup chunks = 165 g); diced read as chunks (batch 7, decision 1)." },
  { recipeId: "recipe-quinoa-fruit-salad", ingredient: "Strawberries", quantity: 0.5, unit: "cup", notes: "sliced", grams: 83,
    basis: "Half of FDC 167762 portion 81921 (1 cup sliced = 166 g) (batch 7, decision 1)." },

  // Batch 7, decision 2: sizes the recipes leave unstated, chosen by the owner.
  { recipeId: "recipe-crunchy-veggie-snack-plate", ingredient: "Apple", quantity: 1, unit: "each", notes: "sliced", grams: 182,
    basis: "Owner-defined medium apple, 3 in: FDC 171688 portion 89193 = 182 g (batch 7, decision 2)." },
  { recipeId: "recipe-crunchy-veggie-snack-plate", ingredient: "Cucumber", quantity: 0.5, unit: "each", notes: "sliced", grams: 150.5, basis: CUCUMBER },
  { recipeId: "recipe-cooling-cucumber-salad", ingredient: "Cucumber", quantity: 1, unit: "each", notes: "sliced", grams: 301, basis: CUCUMBER },
  { recipeId: "recipe-gentle-avocado-toast", ingredient: "Avocado", quantity: 0.5, unit: "each", notes: "", grams: 100.5,
    basis: "Owner-defined USDA reference avocado: FDC 171705 portion 89226 = 201 g; half = 100.5 g (batch 7, decision 2)." },
  { recipeId: "recipe-immune-boost-smoothie", ingredient: "Orange", quantity: 1, unit: "each", notes: "peeled", grams: 131,
    basis: "Owner-defined USDA reference orange, 2-5/8 in: FDC 169097 portion 84230 = 131 g (batch 7, decision 2)." },
  { recipeId: "recipe-energizing-power-bowl", ingredient: "Kale", quantity: 1, unit: "cup", notes: "massaged", grams: 21,
    basis: "Owner-defined: 1 cup raw kale, loosely filled, measured before massaging: FDC 168421 portion 83066 = 21 g (batch 7, decision 2)." },
];

/** The tag-check weight for this exact line (name, quantity, unit and notes), or null. */
export function tagCheckWeight(line: StructuredIngredient, recipeId: string): TagCheckWeight | null {
  return TAG_CHECK_WEIGHTS.find((w) =>
    w.recipeId === recipeId && w.ingredient === line.name && w.unit === line.unit
    && line.quantity !== null && Math.abs(w.quantity - line.quantity) < 1e-9 && w.notes === line.notes) ?? null;
}
