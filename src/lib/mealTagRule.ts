/**
 * Stage D batch 5 (owner-approved 2026-11-04): per-serving check for meal nutrient tags.
 * A meal tag is shown to meet when one serving provides at least 10% of the FDA Daily Value
 * (omega-3: 0.16 g; water: 120 g from ingredients that meet the 90% water rule). The amount
 * comes from the published recipe estimate when one exists; otherwise only tagged ingredients
 * with an approved gram weight count (a lower bound). Grams come from an approved USDA
 * conversion, else from an owner-approved tag-check weight (batch 6, src/data/tagCheckWeights.ts). Unweighed amounts are never assumed, so
 * a low lower bound is "not-shown", never "below". MoodMeal's own rule, not an FDA meal claim.
 *
 * Omega-3 (omega-3 rule review, option B, owner decisions 2026-11-06): two paths at MoodMeal's 0.16 g
 * criterion, calculated separately so ALA is never counted twice: ALA alone, or the complete
 * ALA + EPA + DPA + DHA sum. If any weighed line's food lacks a complete combined value, the
 * combined total is unknown (never zero-filled). The combined path is used when it meets.
 * A path's amount is null (unknown) when no tagged line is weighed or a weighed line's food lacks
 * it; a reported zero stays zero. The 0.16 g criterion is applied to unrounded amounts.
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
  /**
   * Per serving: %DV, or grams for omega-3 and water. Rounded to 0.1. Null only for omega-3 when neither
   * path amount is known (e.g. nothing weighed); other nutrients keep the batch 5 sum, pending the meal-tag work.
   */
  perServing: number | null;
  unit: "percent-dv" | "g";
  contributors: MealTagContributor[];
  /** Omega-3 only: both paths per serving (rounded to 0.01 g for display; null = unknown) and the path the tag meets on. */
  omega3?: { path: "combined" | "ala" | null; alaPerServing: number | null; combinedPerServing: number | null };
}

function publishedReview(foodId: string, nutrientId: string) {
  const review = FOOD_TAG_REVIEWS.find(
    (r) => r.foodId === foodId && r.nutrientId === nutrientId && r.decision === "published",
  );
  if (!review) throw new Error(`no published review for ${foodId}:${nutrientId}`);
  return review;
}
/** Tag measure per gram of a food, from its lowest owner-approved evidence record (not omega-3). */
function perGram(foodId: string, nutrientId: string) {
  const values = publishedReview(foodId, nutrientId).evidence.map((e) =>
    nutrientId === "water" ? e.waterPercent! / 100 : e.percentDV! / e.raccGrams!);
  return Math.min(...values);
}
/**
 * Omega-3 per gram on each path, from the lowest evidence record's unrounded per-100 g amount.
 * A path is null (unknown) unless every evidence record reports it.
 */
function omega3PerGram(foodId: string) {
  const evidence = publishedReview(foodId, "omega-3").evidence;
  const perGramOf = (v: number | null | undefined) => (v === null || v === undefined ? null : v / 100);
  const lowest = (xs: (number | null)[]) => (xs.every((x) => x !== null) ? Math.min(...(xs as number[])) : null);
  return { ala: lowest(evidence.map((e) => perGramOf(e.alaPer100g))), combined: lowest(evidence.map((e) => perGramOf(e.omega3Per100g))) };
}
/** The omega-3 path a meal meets on, from unrounded per-serving amounts: combined first, then ALA. Unknown never meets. */
export function omega3MealPath(ala: number | null, combined: number | null, bar = MEAL_BAR_OMEGA3_GRAMS) {
  if (combined !== null && combined + TOLERANCE >= bar) return "combined" as const;
  if (ala !== null && ala + TOLERANCE >= bar) return "ala" as const;
  return null;
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
    if (nutrientId === "omega-3") {
      const weighed = contributors.filter((c) => c.grams !== null);
      // Unknown (null) when nothing is weighed or a weighed line's food lacks the path; never an empty sum of 0.
      const sum = (pick: (g: { ala: number | null; combined: number | null }) => number | null) => {
        if (!weighed.length) return null;
        const parts = weighed.map((c) => { const g = pick(omega3PerGram(c.foodId)); return g === null ? null : (c.grams! / recipe.servings) * g; });
        return parts.every((x) => x !== null) ? (parts as number[]).reduce((a, b) => a + b, 0) : null;
      };
      const ala = sum((g) => g.ala);
      const combined = sum((g) => g.combined);
      const path = omega3MealPath(ala, combined, bar);
      const display = (x: number | null) => (x === null ? null : Math.round(x * 100) / 100);
      // Owner decision 2026-11-06 (OMEGA3-002): with no known path amount, perServing is null too; a known zero stays 0.
      const shown = path === "ala" ? ala : path === "combined" ? combined : combined ?? ala;
      return {
        mealId: recipe.mealId, recipeId: recipe.id, nutrientId, basis: "weighed-ingredients" as const, unit,
        status: path ? "meets" as const : "not-shown" as const,
        perServing: shown === null ? null : Math.round(shown * 10) / 10, contributors,
        omega3: { path, alaPerServing: display(ala), combinedPerServing: display(combined) },
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
