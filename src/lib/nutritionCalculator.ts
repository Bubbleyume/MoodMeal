/**
 * Custom-recipe nutrition calculator. It reuses the user-approved USDA
 * records (src/data/usda/approved-ingredients.json and the Rainbow Fruit
 * Skewers pilot records) and the shared calculateNutrition logic.
 *
 * Household measures come only from approved conversions (grams divided by
 * the approved quantity, e.g. "1/2 medium banana = 59 g" gives 118 g per
 * banana) or from the pilot's approved USDA portion rows. No other
 * conversion is offered; grams always work.
 *
 * Results are calculated estimates for the user's own combination. They are
 * never stored, reviewed, approved or attached to a MoodMeal recipe.
 */
import pilotData from "../data/usda/pilot-foods.json";
import { APPROVED_INGREDIENTS } from "../data/usdaApprovals";
import { PILOT_INGREDIENTS } from "../data/usdaPilot";
import { calculateNutrition } from "./nutrition";
import type { NutritionInput, NutritionValue, UsdaNutrientValue } from "../types/nutrition";

export const SNAPSHOT = pilotData.snapshot;

/** The nutrients the calculator reports, in display order. */
export const CALCULATOR_NUTRIENTS = [
  { id: "1008", label: "Calories", unit: "KCAL", digits: 0 },
  { id: "1003", label: "Protein", unit: "G", digits: 1 },
  { id: "1005", label: "Carbohydrates", unit: "G", digits: 1 },
  { id: "1004", label: "Fat", unit: "G", digits: 1 },
  { id: "1079", label: "Fiber", unit: "G", digits: 1 },
  { id: "2000", label: "Total sugars", unit: "G", digits: 1 },
] as const;

export interface CalculatorMeasure {
  id: string;
  label: string;
  gramsPerUnit: number;
  portionId: string;
  basis: string;
}

export interface CalculatorFood {
  fdcId: string;
  name: string;
  description: string;
  /** Preparation state the USDA values describe (raw, cooked, peeled…). */
  state: string;
  stateNote?: string;
  /** Ingredient label used to find its illustration (see ingredientImages). */
  imageLabel: string;
  measures: CalculatorMeasure[];
  nutrients: Record<string, UsdaNutrientValue>;
  sourceURL: string;
}

const GRAMS: CalculatorMeasure = {
  id: "g", label: "grams", gramsPerUnit: 1, portionId: "",
  basis: "Weighed amount in grams.",
};

/** Display name and preparation state for every approved record. */
const FOOD_INFO: Record<string, { name: string; state: string; stateNote?: string }> = {
  "169640": { name: "Honey", state: "Ready to use" },
  "173944": { name: "Banana", state: "Raw, peeled" },
  "168588": { name: "Almond butter", state: "Plain, no salt added" },
  "168482": { name: "Sweet potato", state: "Raw, peeled flesh",
    stateNote: "USDA values describe the flesh only; skin-on sweet potato is not covered. Weigh before cooking." },
  "171287": { name: "Egg, raw", state: "Raw, without shell", stateNote: "Use the raw weight for eggs cooked in a recipe." },
  "173424": { name: "Egg, hard-boiled", state: "Cooked (hard-boiled), without shell" },
  "169704": { name: "Brown rice, long-grain", state: "Cooked", stateNote: "Measure cooked rice; dry rice is not covered." },
  "173904": { name: "Rolled oats", state: "Dry, uncooked" },
  "169124": { name: "Pineapple", state: "Raw, fresh (not canned)" },
  "170556": { name: "Pumpkin seeds (pepitas)", state: "Dried kernels, unroasted, unsalted" },
  "169991": { name: "Swiss chard", state: "Raw", stateNote: "Weigh or measure before cooking." },
  "170567": { name: "Almonds", state: "Raw, whole, unsalted" },
  "172688": { name: "Whole-wheat bread", state: "As purchased (untoasted weight)" },
  "171320": { name: "Ground cinnamon", state: "Dry ground spice" },
  "174156": { name: "Chamomile tea", state: "Brewed (tea bag removed)" },
  "167762": { name: "Strawberries", state: "Raw, hulled" },
  "171711": { name: "Blueberries", state: "Raw" },
};

/** Labels for approved household units, keyed "fdcId:unit". */
const UNIT_LABELS: Record<string, string> = {
  "173944:each": "medium banana (7–7⅞ in)",
  "168482:each": "sweet potato, 5 in long",
  "171287:each": "large egg",
  "173424:each": "large egg",
  "169704:cup": "cup, cooked",
  "173904:cup": "cup, dry",
  "169124:cup": "cup, chunks",
  "169991:cup": "cup, chopped",
  "170567:cup": "cup, whole",
  "170567:tbsp": "tbsp, whole",
  "174156:each": "cup brewed (1 bag in 8 fl oz water)",
};

/** Artwork labels for pilot foods (their pilot names are descriptive, not catalog labels). */
const PILOT_IMAGE_LABELS: Record<string, string> = {
  "167762": "Strawberries", "169124": "Pineapple", "171711": "Blueberries",
};

const round = (n: number) => Number(n.toFixed(6));

function addMeasure(list: CalculatorMeasure[], m: CalculatorMeasure) {
  if (!list.some((x) => x.label === m.label)) list.push(m);
}

function buildFoods(): CalculatorFood[] {
  const foods = new Map<string, CalculatorFood>();
  const base = (fdcId: string, description: string, nutrients: Record<string, UsdaNutrientValue>, imageLabel: string) => {
    const info = FOOD_INFO[fdcId];
    if (!info) throw new Error(`No calculator name/state for FDC ${fdcId}`);
    if (!foods.has(fdcId)) foods.set(fdcId, {
      fdcId, description, nutrients, imageLabel, ...info, measures: [GRAMS],
      sourceURL: `https://fdc.nal.usda.gov/food-details/${fdcId}/nutrients`,
    });
    return foods.get(fdcId)!;
  };
  for (const record of APPROVED_INGREDIENTS) {
    const food = base(record.fdcId, record.description, record.nutrients as Record<string, UsdaNutrientValue>, record.ingredient);
    for (const c of record.conversions) {
      const label = UNIT_LABELS[`${record.fdcId}:${c.unit}`] ?? c.unit;
      addMeasure(food.measures, {
        id: `${c.unit}-${c.basePortionId}`, label, gramsPerUnit: round(c.grams / c.quantity),
        portionId: c.basePortionId,
        basis: `Approved conversion: ${c.quantity} ${c.unit} = ${c.grams} g. ${c.derivation}`,
      });
    }
  }
  for (const input of PILOT_INGREDIENTS) {
    const record = (pilotData.foods as Record<string, { description: string; portions: { id: string; modifier: string; gram_weight: string; amount: string }[]; nutrients: Record<string, UsdaNutrientValue> }>)[input.fdcId];
    const food = base(input.fdcId, record.description, record.nutrients, PILOT_IMAGE_LABELS[input.fdcId]);
    const portion = record.portions.find((p) => p.id === input.portionId)!;
    addMeasure(food.measures, {
      id: `portion-${portion.id}`,
      label: UNIT_LABELS[`${input.fdcId}:cup`] ?? `${portion.modifier}`,
      gramsPerUnit: round(Number(portion.gram_weight) / Number(portion.amount)),
      portionId: portion.id,
      basis: `Approved USDA portion ${portion.id}: ${portion.amount} ${portion.modifier} = ${portion.gram_weight} g (Rainbow Fruit Skewers review).`,
    });
  }
  return [...foods.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const CALCULATOR_FOODS: CalculatorFood[] = buildFoods();

export function findFood(fdcId: string) {
  return CALCULATOR_FOODS.find((f) => f.fdcId === fdcId);
}

export function searchFoods(query: string): CalculatorFood[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return CALCULATOR_FOODS.filter((f) => {
    const text = `${f.name} ${f.description} ${f.state}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

export const MAX_QUANTITY = 10000;
export const MAX_SERVINGS = 100;

/** Accepts 2, 1.5, .5, 1/2 or 1 1/2. Returns a positive number or an error message. */
export function parseQuantity(text: string): { value: number } | { error: string } {
  const t = text.trim();
  if (!t) return { error: "Enter an amount." };
  if (/^-/.test(t)) return { error: "Amount must be greater than 0." };
  let value: number;
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  const fraction = t.match(/^(\d+)\/(\d+)$/);
  if (mixed) value = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  else if (fraction) value = Number(fraction[1]) / Number(fraction[2]);
  else if (/^(\d+\.?\d*|\.\d+)$/.test(t)) value = Number(t);
  else return { error: "Enter a number, like 2, 1.5 or 1/2." };
  if (!Number.isFinite(value)) return { error: "Enter a number, like 2, 1.5 or 1/2." };
  if (value <= 0) return { error: "Amount must be greater than 0." };
  if (value > MAX_QUANTITY) return { error: `Amount must be ${MAX_QUANTITY.toLocaleString()} or less.` };
  return { value };
}

export function parseServings(text: string): { value: number } | { error: string } {
  const t = text.trim();
  if (!/^\d+$/.test(t) || Number(t) < 1 || Number(t) > MAX_SERVINGS)
    return { error: `Enter a whole number of servings from 1 to ${MAX_SERVINGS}.` };
  return { value: Number(t) };
}

export interface CalculatorRow {
  key: string;
  fdcId: string;
  measureId: string;
  quantity: string;
}

export interface CalculatedRow extends NutritionInput {
  key: string;
  quantity: number;
  measure: CalculatorMeasure;
  food: CalculatorFood;
}

export interface CalculatedNutrient extends NutritionValue {
  label: string;
  digits: number;
  /** Ingredients with no USDA value for this nutrient; non-empty means the total is unknown. */
  missing: string[];
}

export interface CalculatorResult {
  rowErrors: Record<string, string>;
  servingsError?: string;
  /** Present only when every row and the serving count are valid. */
  result?: {
    servings: number;
    rows: CalculatedRow[];
    totalGrams: number;
    nutrients: CalculatedNutrient[];
  };
}

export function calculateCustom(rows: CalculatorRow[], servingsText: string): CalculatorResult {
  const rowErrors: Record<string, string> = {};
  const calculated: CalculatedRow[] = [];
  for (const row of rows) {
    const food = findFood(row.fdcId);
    const measure = food?.measures.find((m) => m.id === row.measureId);
    if (!food || !measure) { rowErrors[row.key] = "Choose an approved ingredient and unit."; continue; }
    const q = parseQuantity(row.quantity);
    if ("error" in q) { rowErrors[row.key] = q.error; continue; }
    calculated.push({
      key: row.key, quantity: q.value, measure, food,
      name: food.name, fdcId: food.fdcId, grams: round(q.value * measure.gramsPerUnit),
      portionId: measure.portionId, portionDescription: measure.basis, nutrients: food.nutrients,
    });
  }
  const servings = parseServings(servingsText);
  const servingsError = "error" in servings ? servings.error : undefined;
  if (!rows.length || Object.keys(rowErrors).length || "error" in servings) return { rowErrors, servingsError };
  const values = calculateNutrition(calculated, CALCULATOR_NUTRIENTS.map(({ id, label, unit }) => ({ id, name: label, unit })), servings.value);
  return {
    rowErrors,
    result: {
      servings: servings.value,
      rows: calculated,
      totalGrams: round(calculated.reduce((s, r) => s + (r.grams ?? 0), 0)),
      nutrients: values.map((v, i) => ({
        ...v,
        label: CALCULATOR_NUTRIENTS[i].label,
        digits: CALCULATOR_NUTRIENTS[i].digits,
        missing: v.contributions.filter((c) => c.amount === null).map((c) => c.name),
      })),
    },
  };
}
