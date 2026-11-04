/**
 * Stage D batch 5 (owner-approved 2026-11-04): per-serving check for meal nutrient tags.
 * A meal tag is shown to meet when one serving provides at least 10% of the FDA Daily Value
 * (omega-3: 0.16 g; water: 120 g from ingredients that meet the 90% water rule). The amount
 * comes from the published recipe estimate when one exists; otherwise only tagged ingredients
 * with an approved gram weight count (a lower bound). Grams come from an approved USDA
 * conversion, else from an owner-approved tag-check weight (batch 6, src/data/tagCheckWeights.ts). Unweighed amounts are never assumed, so
 * a low lower bound is "not-shown", never "below". MoodMeal's own rule, not an FDA meal claim.
 */
import { FOOD_TAG_REVIEWS } from "../data/foodTagReviews";
import { approvedIngredientInput } from "../data/usdaApprovals";
import { tagCheckWeight } from "../data/tagCheckWeights";
import { foodIdForIngredient, inheritedNutrients } from "./catalog";
import type { Recipe } from "../types";

/** 21 CFR 101.9(c)(8)(iv) and (c)(9); same values as tools/research tag_evidence.py. */
export const DAILY_VALUES: Record<string, { fdcId: string; dv: number }> = {
  protein: { fdcId: "1003", dv: 50 },
  fiber: { fdcId: "1079", dv: 28 },
  calcium: { fdcId: "1087", dv: 1300 },
  iron: { fdcId: "1089", dv: 18 },
  magnesium: { fdcId: "1090", dv: 420 },
  "vitamin-c": { fdcId: "1162", dv: 90 },
  b6: { fdcId: "1175", dv: 1.7 },
  b12: { fdcId: "1178", dv: 2.4 },
};
export const MEAL_BAR_PERCENT_DV = 10;
export const MEAL_BAR_OMEGA3_GRAMS = 0.16;
export const MEAL_BAR_WATER_GRAMS = 120;
const TOLERANCE = 1e-9;

export type MealTagStatus = "meets" | "below" | "not-shown";
export interface MealTagContributor {
  ingredient: string;
  foodId: string;
  /** Grams for the whole recipe; null when no weight is approved. */
  grams: number | null;
  gramsBasis: "approved-usda-conversion" | "tag-check-weight" | null;
}
export interface MealTagCheck {
  mealId: string;
  recipeId: string;
  nutrientId: string;
  status: MealTagStatus;
  basis: "recipe-estimate" | "weighed-ingredients";
  /** Per serving: %DV, or grams for omega-3 and water. Rounded to 0.1. */
  perServing: number;
  unit: "percent-dv" | "g";
  contributors: MealTagContributor[];
}

/** Tag measure per gram of a food, from its lowest owner-approved evidence record. */
function perGram(foodId: string, nutrientId: string) {
  const review = FOOD_TAG_REVIEWS.find(
    (r) => r.foodId === foodId && r.nutrientId === nutrientId && r.decision === "published",
  );
  if (!review) throw new Error(`no published review for ${foodId}:${nutrientId}`);
  const values = review.evidence.map((e) =>
    nutrientId === "water" ? e.waterPercent! / 100
      : nutrientId === "omega-3" ? e.omega3Grams! / e.raccGrams!
        : e.percentDV! / e.raccGrams!);
  return Math.min(...values);
}

export function checkMealTags(recipe: Recipe): MealTagCheck[] {
  const lines = recipe.structuredIngredients;
  const foodOf = (name: string) => foodIdForIngredient(name) ?? "";
  const tags = [...new Set(lines.flatMap((i) => inheritedNutrients(i)))];
  const estimate = recipe.nutritionEstimate;
  return tags.map((nutrientId) => {
    const contributors = lines
      .filter((i) => inheritedNutrients(i).includes(nutrientId))
      .map((i) => {
        const approved = approvedIngredientInput(i, recipe.id)?.grams;
        const tagWeight = tagCheckWeight(i, recipe.id)?.grams;
        return {
          ingredient: i.name,
          foodId: foodOf(i.name),
          grams: approved ?? tagWeight ?? null,
          gramsBasis: approved !== undefined ? "approved-usda-conversion" as const
            : tagWeight !== undefined ? "tag-check-weight" as const : null,
        };
      });
    const unit = nutrientId === "water" || nutrientId === "omega-3" ? "g" : "percent-dv";
    const bar = nutrientId === "water" ? MEAL_BAR_WATER_GRAMS
      : nutrientId === "omega-3" ? MEAL_BAR_OMEGA3_GRAMS : MEAL_BAR_PERCENT_DV;
    const dv = DAILY_VALUES[nutrientId];
    const fromEstimate = dv && estimate?.values.find((v) => v.id === dv.fdcId);
    if (fromEstimate && fromEstimate.perServing !== null) {
      const perServing = (fromEstimate.perServing / dv.dv) * 100;
      return {
        mealId: recipe.mealId, recipeId: recipe.id, nutrientId, basis: "recipe-estimate" as const, unit,
        status: perServing + TOLERANCE >= bar ? "meets" as const : "below" as const,
        perServing: Math.round(perServing * 10) / 10, contributors,
      };
    }
    const lowerBound = contributors.reduce(
      (sum, c) => sum + (c.grams === null ? 0 : (c.grams / recipe.servings) * perGram(c.foodId, nutrientId)), 0);
    return {
      mealId: recipe.mealId, recipeId: recipe.id, nutrientId, basis: "weighed-ingredients" as const, unit,
      status: lowerBound + TOLERANCE >= bar ? "meets" as const : "not-shown" as const,
      perServing: Math.round(lowerBound * 10) / 10, contributors,
    };
  });
}
