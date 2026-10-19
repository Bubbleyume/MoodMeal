import data from "./usda/pilot-foods.json";
import type { IngredientLine } from "../types";
import type { RecipeNutritionEstimate, NutritionInput } from "../types/nutrition";
import { calculateNutrition } from "../lib/nutrition";
import { APPROVED_INGREDIENTS, approvedIngredientInput } from "./usdaApprovals";
import type { Recipe } from "../types";

export const PILOT_RECIPE_ID = "recipe-rainbow-fruit-skewers";
const approvedIngredients: IngredientLine[] = [
  { name: "Strawberries", quantity: "1 cup, whole, hulled (144 g USDA reference weight)" },
  { name: "Pineapple", quantity: "1 cup, raw chunks (165 g USDA reference weight)" },
  { name: "Blueberries", quantity: "1/2 cup, raw (74 g USDA reference weight)" },
  { name: "Wooden skewers", quantity: "4" },
];
const approvedInstructions = [
  "Thread strawberries, pineapple, and blueberries onto skewers in a repeating, colorful pattern.",
  "Arrange on a plate and serve chilled.",
];
/** Approved pilot inputs (FDC record, approved USDA portion, grams). */
export const PILOT_INGREDIENTS: NutritionInput[] = [
  {name:"Whole raw strawberries, hulled", fdcId:"167762", grams:144, portionId:"81922", portionDescription:"1 cup, whole = 144 g", nutrients:data.foods["167762"].nutrients},
  {name:"Raw pineapple chunks", fdcId:"169124", grams:165, portionId:"84287", portionDescription:"1 cup, chunks = 165 g", nutrients:data.foods["169124"].nutrients},
  {name:"Raw blueberries", fdcId:"171711", grams:74, portionId:"89238", portionDescription:"1 cup = 148 g; half cup = 74 g", nutrients:data.foods["171711"].nutrients},
];

/** Only this reviewed recipe may expose USDA estimates. Edits invalidate approval. */
export function approvedPilotNutrition(recipe: {
  id: string; servings: number; cookTimeMinutes: number;
  ingredients: IngredientLine[]; instructions: string[];
}): RecipeNutritionEstimate | null {
  if (recipe.id !== PILOT_RECIPE_ID || recipe.servings !== 2 || recipe.cookTimeMinutes !== 0
    || JSON.stringify(recipe.ingredients) !== JSON.stringify(approvedIngredients)
    || JSON.stringify(recipe.instructions) !== JSON.stringify(approvedInstructions)) return null;
  return {
    status: "approved-pilot-estimate", servings:2, ingredients: PILOT_INGREDIENTS,
    calculationNote: "383 g of edible fruit input; wooden skewers are equipment and are excluded. The fruit is served chilled.",
    values:calculateNutrition(PILOT_INGREDIENTS, data.definitions, 2),
    sources:PILOT_INGREDIENTS.map(i => ({
      sourceTitle:`USDA FoodData Central — ${i.name}`,
      author:"USDA Agricultural Research Service",
      edition:data.snapshot,
      pageOrSection:`FDC ${i.fdcId}; food_portion.csv row ${i.portionId}: ${i.portionDescription}. Nutrients per 100 g; source rows preserved in docs/usda/pilot-source-records.json.`,
      sourceURL:`https://fdc.nal.usda.gov/food-details/${i.fdcId}/nutrients`,
      reviewedBy:"User-approved reference weights and source matching; AI-assisted calculation; not laboratory-verified or kitchen-tested",
      evidenceStatus:"source-supported", claimType:"recipe", reviewStatus:"reviewed",
    })),
  };
}

const TOAST_RECIPE_ID = "recipe-chamomile-comfort-toast";
const toastIngredients: IngredientLine[] = [
  { name: "Sweet potato", quantity: "1, peeled, sliced lengthwise into 1/4-inch planks" },
  { name: "Almond butter", quantity: "2 tbsp" },
  { name: "Banana", quantity: "1/2, sliced" },
  { name: "Chamomile tea bag", quantity: "1" },
  { name: "Ground cinnamon", quantity: "1/16 tsp" },
];
const toastInstructions = [
  "Peel the sweet potato and slice it lengthwise into 1/4-inch planks. Toast the slices in a toaster or toaster oven on high for 2–3 cycles, until fork-tender.",
  "Meanwhile, steep the chamomile tea bag in 1 cup (8 fl oz) hot water for 4–5 minutes, then remove the bag.",
  "Spread almond butter over each sweet potato \"toast\".",
  "Top with banana slices and 1/16 tsp ground cinnamon.",
  "Enjoy warm alongside the cup of chamomile tea.",
];

/** Only the approved Toast recipe and its exact per-use conversions may expose this estimate. */
export function approvedChamomileToastNutrition(recipe: Pick<Recipe,
  "id" | "servings" | "cookTimeMinutes" | "ingredients" | "instructions" | "structuredIngredients"
>): RecipeNutritionEstimate | null {
  if (recipe.id !== TOAST_RECIPE_ID || recipe.servings !== 1 || recipe.cookTimeMinutes !== 12
    || JSON.stringify(recipe.ingredients) !== JSON.stringify(toastIngredients)
    || JSON.stringify(recipe.instructions) !== JSON.stringify(toastInstructions)) return null;
  const inputs = recipe.structuredIngredients.map(i => approvedIngredientInput(i, recipe.id));
  if (inputs.length !== toastIngredients.length || inputs.some(i => !i)) return null;
  const ingredients = inputs as NutritionInput[];
  const sources = ingredients.map(input => {
    const record = APPROVED_INGREDIENTS.find(r => r.fdcId === input.fdcId);
    if (!record) return null;
    return {
      sourceTitle: `USDA FoodData Central — ${record.ingredient}`,
      author: "USDA Agricultural Research Service",
      edition: record.snapshot,
      pageOrSection: `FDC ${record.fdcId}; food portion ${input.portionId}: ${input.portionDescription}. Nutrients per 100 g; source rows retained in approved-ingredients.json.`,
      sourceURL: record.sourceURL,
      reviewedDate: "2026-10-19",
      reviewedBy: "User-approved ingredient identity, preparation and reference portion; AI-assisted calculation; not laboratory-verified or kitchen-tested",
      evidenceStatus: "source-supported" as const,
      claimType: "recipe" as const,
      reviewStatus: "reviewed" as const,
    };
  });
  if (sources.some(s => !s)) return null;
  return {
    status: "approved-recipe-estimate",
    servings: 1,
    calculationNote: "Includes 237 g brewed chamomile tea. Sweet potato is measured as 130 g raw peeled flesh before toasting; cooking moisture loss and finished yield were not measured.",
    ingredients,
    values: calculateNutrition(ingredients, data.definitions, 1),
    sources: sources as NonNullable<(typeof sources)[number]>[],
  };
}
