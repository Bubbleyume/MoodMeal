import type { DietaryPreference, Food, Meal } from "../types";

// Lightweight keyword-based dietary filtering. This is intentionally simple
// — a real implementation would tag each item explicitly (or let an AI /
// Supabase-backed service handle it) — but it makes the "dietary
// preferences" setting in Profile actually affect recommendations today.

const MEAT_FISH_KEYWORDS = ["beef", "salmon", "turkey", "chicken", "fish", "steak"];
const ANIMAL_PRODUCT_KEYWORDS = [
  ...MEAT_FISH_KEYWORDS,
  "egg",
  "yogurt",
  "kefir",
  "feta",
  "honey",
  "milk",
];
const GLUTEN_KEYWORDS = ["oat", "bread", "granola", "pancake"];
const DAIRY_KEYWORDS = ["yogurt", "kefir", "feta", "milk", "cheese"];

function textContainsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function foodOrMealText(item: Food | Meal): string {
  if ("ingredients" in item) {
    return [item.name, ...item.ingredients.map((i) => i.name)].join(" ");
  }
  return item.name;
}

export function matchesDietaryPreference(
  item: Food | Meal,
  preference: DietaryPreference
): boolean {
  if (preference === "none") return true;
  const text = foodOrMealText(item);

  switch (preference) {
    case "vegetarian":
      return !textContainsAny(text, MEAT_FISH_KEYWORDS);
    case "vegan":
      return !textContainsAny(text, ANIMAL_PRODUCT_KEYWORDS);
    case "gluten-free":
      return !textContainsAny(text, GLUTEN_KEYWORDS);
    case "dairy-free":
      return !textContainsAny(text, DAIRY_KEYWORDS);
    case "low-sugar":
      return !textContainsAny(text, ["chocolate", "honey", "pancake"]);
    default:
      return true;
  }
}
