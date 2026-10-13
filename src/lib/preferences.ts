import type { FoodPreferences } from "../types/library";
import type { Food, Meal } from "../types";
import { readStorage } from "./storage";
export const DEFAULT_PREFERENCES: FoodPreferences = {
  dietaryPattern: "none",
  allergies: [],
  intolerances: [],
  dislikes: [],
  cuisines: [],
  cookingSkill: "any",
  budget: "any",
  maxPrepTime: null,
  recommendationType: "any",
};
export function normalizePreferences(
  raw: Partial<FoodPreferences> | null,
): FoodPreferences {
  const p = { ...DEFAULT_PREFERENCES, ...(raw ?? {}) };
  for (const key of [
    "allergies",
    "intolerances",
    "dislikes",
    "cuisines",
  ] as const)
    p[key] = Array.isArray(p[key])
      ? p[key].filter((x) => typeof x === "string")
      : [];
  if (
    ![
      "none",
      "vegetarian",
      "vegan",
      "gluten-free",
      "dairy-free",
      "low-sugar",
    ].includes(p.dietaryPattern)
  )
    p.dietaryPattern = "none";
  if (!["any", "Easy", "Medium", "Advanced"].includes(p.cookingSkill))
    p.cookingSkill = "any";
  if (!["any", "budget", "moderate", "flexible"].includes(p.budget))
    p.budget = "any";
  if (!["any", "snack", "full-meal", "quick"].includes(p.recommendationType))
    p.recommendationType = "any";
  if (
    typeof p.maxPrepTime !== "number" ||
    !Number.isFinite(p.maxPrepTime) ||
    p.maxPrepTime < 1
  )
    p.maxPrepTime = null;
  return p;
}
export function readPreferences(): FoodPreferences {
  return normalizePreferences(
    readStorage<Partial<FoodPreferences>>("moodmeal:preferences", {}),
  );
}
export function eligible(item: Food | Meal, p: FoodPreferences) {
  if (item.reviewStatus !== "published") return false;
  const text = [item.name, ...item.structuredIngredients.map((i) => i.name)]
    .join(" ")
    .toLowerCase();
  if (
    p.dietaryPattern !== "none" &&
    p.dietaryPattern !== "low-sugar" &&
    !item.dietaryTags.includes(p.dietaryPattern)
  )
    return false;
  if (
    p.dietaryPattern === "low-sugar" &&
    /honey|chocolate|syrup|dried cranberries/.test(text)
  )
    return false;
  const exclusions = [...p.allergies, ...p.intolerances, ...p.dislikes]
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  if (
    exclusions.some(
      (x) =>
        text.includes(x) ||
        item.allergens.includes(x) ||
        (x === "dairy" && item.allergens.includes("milk")) ||
        (x === "gluten" &&
          (item.allergens.includes("wheat") || /oat|granola/.test(text))) ||
        (x === "nuts" && item.allergens.includes("tree nuts")),
    )
  )
    return false;
  if ("prepTimeMinutes" in item) {
    if (p.maxPrepTime && item.prepTimeMinutes > p.maxPrepTime) return false;
    if (p.recommendationType === "quick" && item.prepTimeMinutes > 15)
      return false;
    const levels = ["Easy", "Medium", "Advanced"];
    if (
      p.cookingSkill !== "any" &&
      levels.indexOf(item.difficulty) > levels.indexOf(p.cookingSkill)
    )
      return false;
  } else if (
    p.recommendationType === "full-meal" ||
    (p.recommendationType === "quick" && item.mealType === "ingredient")
  )
    return false;
  if (p.recommendationType === "snack" && item.mealType !== "snack")
    return false;
  if (p.recommendationType === "full-meal" && item.mealType !== "full-meal")
    return false;
  if (p.budget === "budget" && item.budget !== "budget") return false;
  if (p.budget === "moderate" && item.budget === "flexible") return false;
  return true;
}
