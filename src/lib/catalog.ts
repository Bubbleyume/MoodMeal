import type { Food, Meal, Recipe, IngredientLine } from "../types";
import type {
  LibraryMetadata,
  StructuredIngredient,
  GoalId,
} from "../types/library";
import { FOOD_FACTS, NUTRIENTS, GOALS, source } from "../data/knowledge";
import { approvedChamomileToastNutrition, approvedPilotNutrition } from "../data/usdaPilot";

const aliases: [RegExp, string][] = [
  [/salmon/i, "wild-salmon"],
  [/walnut/i, "walnuts"],
  [/oats?|oat flour/i, "steel-cut-oats"],
  [/chocolate/i, "dark-chocolate"],
  [/yogurt/i, "greek-yogurt"],
  [/mixed berries|berries, for/i, "mixed-berries"],
  [/orange/i, "citrus-orange"],
  [/ginger/i, "ginger-root"],
  [/garlic/i, "garlic"],
  [/chamomile/i, "chamomile-tea"],
  [/sweet potato/i, "sweet-potato"],
  [/banana/i, "banana"],
  [/spinach/i, "spinach"],
  [/kale/i, "kale"],
  [/beef/i, "lean-beef"],
  [/quinoa/i, "quinoa"],
  [/^eggs?$/i, "eggs"],
  [/blueberr/i, "blueberries"],
  [/kefir/i, "kefir"],
  [/brown rice/i, "brown-rice"],
  [/avocado/i, "avocado"],
  [/turkey/i, "turkey"],
  [/almond/i, "almonds"],
  [/coconut water/i, "coconut-water"],
  [/watermelon/i, "watermelon"],
  [/cucumber/i, "cucumber"],
  [/apple/i, "apple"],
  [/pumpkin seed/i, "pumpkin-seeds"],
  [/popcorn/i, "popcorn"],
  [/strawberr/i, "strawberries"],
  [/carrot/i, "rainbow-carrots"],
  [/pineapple/i, "pineapple"],
  [/chard/i, "swiss-chard"],
  [/green tea|matcha/i, "green-tea"],
  [/chia/i, "chia-pudding"],
];
export function foodIdForIngredient(name: string) {
  return aliases.find(([re]) => re.test(name))?.[1];
}
export function ingredientId(name: string) {
  // Keep different preparations and ingredient forms separate for grocery quantities.
  return name
    .toLowerCase()
    .trim()
    .replace(/^baby spinach$/, "spinach")
    .replace(/^eggs$/, "egg")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
}
export function parseIngredient(line: IngredientLine): StructuredIngredient {
  if (/^\d+(?:\/\d+)?\s*[–—-]/.test(line.quantity))
    return {
      ingredientId: ingredientId(line.name),
      name: line.name,
      quantity: null,
      unit: "each",
      optional: false,
      notes: line.quantity,
    };
  const match = line.quantity.match(
    /^(\d+(?:\.\d+)?(?:\/\d+)?)(?:\s+(\d+\/\d+))?\s*(cups?|tbsp|tsp|oz|g|kg|ml|l|cloves?|slices?)?\b\s*,?\s*(.*)$/i,
  );
  const number = (v: string) =>
    v.includes("/")
      ? Number(v.split("/")[0]) / Number(v.split("/")[1])
      : Number(v);
  return {
    ingredientId: ingredientId(line.name),
    name: line.name,
    quantity: match
      ? number(match[1]) + (match[2] ? number(match[2]) : 0)
      : null,
    unit: match?.[3]?.toLowerCase().replace(/s$/, "") ?? "each",
    optional: /optional/i.test(line.quantity),
    notes: match?.[4] ?? line.quantity,
  };
}
export function ingredientLine(i: StructuredIngredient): IngredientLine {
  return {
    name: i.name,
    quantity: [
      i.quantity ?? "",
      i.quantity === null ? "" : i.unit === "each" ? "" : i.unit,
      i.notes,
    ]
      .filter((x) => x !== "")
      .join(" "),
  };
}
const allergenRules: [string, RegExp][] = [
  ["milk", /milk|yogurt|kefir|feta|cheese|chocolate/i],
  ["egg", /\beggs?\b/i],
  ["fish", /salmon|fish/i],
  ["tree nuts", /walnut|almond|nut butter|granola/i],
  ["soy", /soy|tofu|chocolate|milk alternative/i],
  ["wheat", /bread|soy sauce|granola/i],
  ["sesame", /sesame|tahini|hummus/i],
];
export function allergenTags(text: string) {
  return allergenRules.filter(([, re]) => re.test(text)).map(([name]) => name);
}
function metadata(
  id: string,
  kind: "foods" | "meals",
  name: string,
  ingredients: IngredientLine[],
): LibraryMetadata {
  const text = [name, ...ingredients.map((i) => i.name)].join(" ");
  const nutrientIds =
    kind === "foods"
      ? (FOOD_FACTS[id] ?? [])
      : [
          ...new Set(
            ingredients.flatMap(
              (i) => FOOD_FACTS[foodIdForIngredient(i.name) ?? ""] ?? [],
            ),
          ),
        ];
  const facts = nutrientIds.map((n) => ({
    nutrientId: n,
    reviewStatus: "published" as const,
    sourceProvenance: [
      {
        ...NUTRIENTS[n].source,
        claimType: "food-nutrient" as const,
        pageOrSection: `Food sources; qualitative composition for ${
          kind === "foods"
            ? name
            : ingredients
                .filter((i) =>
                  (
                    FOOD_FACTS[foodIdForIngredient(i.name) ?? ""] ?? []
                  ).includes(n),
                )
                .map((i) => i.name)
                .join(", ")
        }`,
      },
    ],
  }));
  const allergens = allergenTags(text);
  const meat = /beef|salmon|turkey|chicken|fish/i.test(text);
  const tags: string[] = [];
  if (!meat) tags.push("vegetarian");
  if (!meat && !/egg|milk|yogurt|kefir|feta|honey|chocolate/i.test(text))
    tags.push("vegan");
  if (!allergens.includes("milk")) tags.push("dairy-free");
  if (!allergens.includes("wheat") && !/oat|granola/i.test(text))
    tags.push("gluten-free");
  const supportGoals = (Object.keys(GOALS) as GoalId[]).filter((g) =>
    GOALS[g].nutrients.some((n) => nutrientIds.includes(n)),
  );
  return {
    image: `/assets/${kind}/${id}.webp`,
    nutrientFacts: facts,
    sourceProvenance: facts.flatMap((f) => f.sourceProvenance),
    reviewStatus: "published",
    supportGoals,
    allergens,
    dietaryTags: tags,
    cuisine:
      kind === "foods"
        ? "Ingredient"
        : /stir-fry/.test(id)
          ? "Asian-inspired"
          : /quinoa|salad|toast/.test(id)
            ? "Mediterranean-inspired"
            : "Everyday",
    mealType: /tea|water$|smoothie|kefir/.test(id)
      ? "drink"
      : (kind === "foods" &&
            /walnuts|chocolate|yogurt|berries|orange|banana|avocado|almonds|watermelon|apple|pumpkin-seeds|popcorn|strawberries|pineapple/.test(
              id,
            )) ||
          /snack|mix|bites|skewers|parfait/.test(id)
        ? "snack"
        : kind === "foods"
          ? "ingredient"
          : "full-meal",
    budget: /salmon|beef|steak/.test(id)
      ? "flexible"
      : /quinoa|berry|berries|avocado|nut/.test(id)
        ? "moderate"
        : "budget",
    structuredIngredients: ingredients.map(parseIngredient),
    nutrientTotals: null,
  };
}
const rename: Record<string, string> = {
  "calming-kefir-smoothie": "Berry Kefir Smoothie",
  "immune-boost-smoothie": "Orange Yogurt Smoothie",
  "magnesium-boost-bowl": "Quinoa & Greens Bowl",
  "green-tea-oat-bites": "Green Tea Oat Bites",
  "energizing-power-bowl": "Rice, Egg & Greens Bowl",
  "iron-rich-stir-fry": "Beef & Spinach Stir-Fry",
  "tropical-energy-smoothie": "Tropical Fruit Smoothie",
};
// Inputs are the legacy seed records. IDs and recipe routes remain stable.
export function enrichFood(raw: unknown): Food {
  const f = raw as Food;
  const m = metadata(f.id, "foods", f.name, []);
  return {
    ...f,
    ...m,
    nutrients: m.nutrientFacts.map((n) => NUTRIENTS[n.nutrientId].label),
    description: `An everyday ingredient to explore as part of a varied diet.`,
  };
}
export function enrichMeal(raw: unknown): Meal {
  const m = raw as Meal;
  return {
    ...m,
    ...metadata(m.id, "meals", m.name, m.ingredients),
    name: rename[m.id] ?? m.name,
    description: `Made with ${m.ingredients
      .slice(0, 3)
      .map((i) => i.name.toLowerCase())
      .join(", ")}.`,
  };
}
export function enrichRecipe(raw: unknown): Recipe {
  const r = raw as Recipe;
  const m = metadata(r.mealId, "meals", r.name, r.ingredients);
  const nutritionRecipe = { ...r, structuredIngredients: m.structuredIngredients };
  const nutritionEstimate = approvedPilotNutrition(r) ?? approvedChamomileToastNutrition(nutritionRecipe);
  const recipeSource = source(
    "MoodMeal original recipe collection",
    "",
    `Recipe ${r.id}; existing app recipe adapted for structured ingredients`,
    "recipe",
  );
  recipeSource.author = "MoodMeal";
  recipeSource.evidenceStatus = "source-supported";
  recipeSource.reviewStatus = "published";
  recipeSource.reviewedBy =
    "MoodMeal editorial structure and temperature check (AI-assisted); not kitchen-tested";
  return {
    ...r,
    ...m,
    nutritionEstimate,
    nutrientTotals: nutritionEstimate ? nutritionEstimate.values.map(n => ({
      nutrientId: n.id, amount: n.perServing, unit: n.unit,
      basis: `per serving; ${nutritionEstimate.servings} equal serving${nutritionEstimate.servings === 1 ? "" : "s"}; USDA reference weights`,
      sourceProvenance: nutritionEstimate.sources,
    })) : null,
    name: rename[r.mealId] ?? r.name,
    description: `A home-cooking idea using ${r.ingredients
      .slice(0, 3)
      .map((i) => i.name.toLowerCase())
      .join(", ")}.`,
    prepTime: r.prepTimeMinutes,
    cookTime: r.cookTimeMinutes,
    totalTime:
      r.prepTimeMinutes +
      r.cookTimeMinutes +
      (r.mealId === "green-tea-oat-bites" ? 30 : 0),
    sourceProvenance: [
      recipeSource,
      source(
        "Safe Minimum Internal Temperatures",
        "https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures",
        "Fish 145°F; poultry/reheated leftovers 165°F; beef steaks 145°F plus 3-minute rest; egg dishes 160°F",
        "recipe",
      ),
      ...m.sourceProvenance,
    ],
    nutritionHighlights: [],
    instructions: r.instructions,
  };
}
