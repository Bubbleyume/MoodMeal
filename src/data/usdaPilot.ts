import data from "./usda/pilot-foods.json";
import type { IngredientLine } from "../types";
import type { RecipeNutritionEstimate, NutritionInput } from "../types/nutrition";
import { calculateNutrition } from "../lib/nutrition";

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
