import type {
  RecommendationInput,
  RecommendationResult,
  Food,
  Meal,
  EmotionId,
} from "../types";
import type { GoalId, FoodPreferences } from "../types/library";
import { FOODS } from "../data/foods";
import { MEALS } from "../data/meals";
import { getEmotionById } from "../data/emotions";
import { GOALS, NUTRIENTS } from "../data/knowledge";
import { eligible, readPreferences } from "./preferences";
import type { RecipeNutritionEstimate } from "../types/nutrition";
export function goalsForMood(mood: EmotionId, intensity: number): GoalId[] {
  const primary: Record<EmotionId, GoalId> = {
    happy: "balanced-nutrition",
    sad: "everyday-mood-support",
    tired: "steady-energy",
    scared: "calm-grounded",
    angry: "calm-grounded",
    nervous: "calm-grounded",
    shy: "everyday-mood-support",
    excited: "hydration",
    bored: "focus-attention",
    silly: "balanced-nutrition",
    worried: "calm-grounded",
    sick: "hydration",
  };
  const goals = [primary[mood]];
  if (intensity >= 8 && ["worried", "nervous", "angry"].includes(mood))
    goals.push("wind-down");
  return goals;
}
/** Facts that may reach users: published and backed by a published, supporting source. */
export function verifiedNutrients(item: Food | Meal) {
  return item.nutrientFacts
    .filter(
      (f) =>
        f.reviewStatus === "published" &&
        f.sourceProvenance.some(
          (s) =>
            s.reviewStatus === "published" &&
            ["source-supported", "independently-verified"].includes(
              s.evidenceStatus,
            ),
        ),
    )
    .map((f) => f.nutrientId);
}
export function matchingNutrients(item: Food | Meal, goals: GoalId[]) {
  return verifiedNutrients(item).filter((id) =>
    goals.some((g) => GOALS[g].nutrients.includes(id)),
  );
}
/**
 * Chips shown with a pick. Goal-matched chips are the only nutrients an
 * explanation may cite; other verified nutrients appear only when nothing
 * matches, labelled as not matched to the goal. Unverified facts never show.
 */
export function nutrientDisplay(item: Food | Meal, goals: GoalId[]) {
  const known = (ids: string[]) => ids.filter((id) => NUTRIENTS[id]).slice(0, 3);
  const matched = known(matchingNutrients(item, goals));
  return {
    matched,
    otherVerified: matched.length ? [] : known(verifiedNutrients(item)),
  };
}
export function displayedNutrients(item: Food | Meal, goals: GoalId[]) {
  return nutrientDisplay(item, goals).matched;
}
const nutrientName = (id: string) =>
  NUTRIENTS[id].label.charAt(0).toLowerCase() + NUTRIENTS[id].label.slice(1);
const listOf = (parts: string[]) =>
  parts.length > 1
    ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
    : parts[0];
const goalPicks = (goals: GoalId[]) =>
  `your ${goals.map((g) => GOALS[g].label.toLowerCase()).join(" / ")} food picks`;
const belongs = (count: number, goals: GoalId[]) =>
  `${count > 1 ? "These nutrients are" : "This nutrient is"} part of ${goalPicks(goals)}.`;
export function whyPick(
  item: Food | Meal,
  goals: GoalId[] = ["balanced-nutrition"],
) {
  const ids = displayedNutrients(item, goals);
  if (!ids.length)
    return "ingredients" in item
      ? `A meal idea to explore. No verified nutrient in it matches ${goalPicks(goals)} yet.`
      : `An ingredient to explore. No verified nutrient in it matches ${goalPicks(goals)} yet.`;
  const basis =
    "ingredients" in item
      ? "This meal brings together ingredients that provide"
      : "This food provides";
  return `${basis} ${listOf(ids.map(nutrientName))}. ${belongs(ids.length, goals)}`;
}
/**
 * USDA FoodData Central nutrient IDs for knowledge-base nutrients. Omega-3 spans
 * several fatty-acid records and water is not in the reviewed definitions, so
 * neither is quoted from a recipe estimate.
 */
export const USDA_NUTRIENT_IDS: Record<string, { id: string; unit: string }> = {
  protein: { id: "1003", unit: "G" },
  fiber: { id: "1079", unit: "G" },
  calcium: { id: "1087", unit: "MG" },
  iron: { id: "1089", unit: "MG" },
  magnesium: { id: "1090", unit: "MG" },
  "vitamin-c": { id: "1162", unit: "MG" },
  b6: { id: "1175", unit: "MG" },
  b12: { id: "1178", unit: "UG" },
};
const UNIT_LABELS: Record<string, string> = { G: "g", MG: "mg", UG: "mcg" };
const displayAmount = (amount: number) =>
  String(Number(amount.toFixed(amount >= 10 ? 0 : 1)));
/**
 * Explains a pick from its approved recipe estimate when one exists. Only cites
 * displayed, goal-matched nutrients whose complete per-serving value is known
 * and non-zero at display precision, and attributes amounts to the whole recipe,
 * never to an individual ingredient. Otherwise falls back to whyPick.
 */
export function explainPick(
  item: Food | Meal,
  goals: GoalId[] = ["balanced-nutrition"],
  estimate?: RecipeNutritionEstimate | null,
) {
  const amounts =
    (estimate?.status === "approved-pilot-estimate" || estimate?.status === "approved-recipe-estimate")
      ? displayedNutrients(item, goals).flatMap((id) => {
          const usda = USDA_NUTRIENT_IDS[id];
          const value = estimate.values.find((v) => v.id === usda?.id);
          if (!value || value.unit !== usda.unit) return [];
          if (value.perServing === null || !Number.isFinite(value.perServing)) return [];
          const shown = displayAmount(value.perServing);
          return Number(shown) > 0
            ? [`about ${shown} ${UNIT_LABELS[usda.unit]} of ${nutrientName(id)}`]
            : [];
        })
      : [];
  if (!amounts.length) return whyPick(item, goals);
  return `This recipe provides ${listOf(amounts)} per serving, estimated from the reviewed USDA portions of all its ingredients. ${belongs(amounts.length, goals)}`;
}
export function browseItems<T extends Food | Meal>(
  items: T[],
  p: FoodPreferences,
) {
  return items
    .filter((i) => eligible(i, p))
    .sort(
      (a, b) =>
        Number(
          p.cuisines.some((c) =>
            b.cuisine.toLowerCase().includes(c.toLowerCase()),
          ),
        ) -
        Number(
          p.cuisines.some((c) =>
            a.cuisine.toLowerCase().includes(c.toLowerCase()),
          ),
        ),
    );
}
export function getRecommendations(
  input: RecommendationInput,
): RecommendationResult {
  const emotion = getEmotionById(input.emotionId);
  if (!emotion) throw new Error("Unknown mood");
  const goals = goalsForMood(input.emotionId, input.intensity);
  const p = {
    ...(input.preferences ?? readPreferences()),
    dietaryPattern:
      input.dietaryPreferences ??
      input.preferences?.dietaryPattern ??
      readPreferences().dietaryPattern,
  };
  const rank = <T extends Food | Meal>(items: T[]) =>
    browseItems(items, p)
      .filter(
        (i) =>
          matchingNutrients(i, goals).length > 0 &&
          !(
            (goals.includes("wind-down") || goals.includes("calm-grounded")) &&
            /green-tea|chocolate/.test(i.id)
          ),
      )
      .sort(
        (a, b) =>
          matchingNutrients(b, goals).length -
          matchingNutrients(a, goals).length,
      );
  const foods = rank(FOODS).slice(0, 6),
    meals = rank(MEALS).slice(0, 6);
  return {
    emotion,
    foods,
    meals,
    goals,
    nutrientIds: [
      ...new Set(
        [...foods, ...meals].flatMap((i) => matchingNutrients(i, goals)),
      ),
    ],
    explanation: goals.map((g) => GOALS[g].explanation).join(" "),
  };
}
