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
export function matchingNutrients(item: Food | Meal, goals: GoalId[]) {
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
        ) &&
        goals.some((g) => GOALS[g].nutrients.includes(f.nutrientId)),
    )
    .map((f) => f.nutrientId);
}
export function whyPick(
  item: Food | Meal,
  goals: GoalId[] = ["balanced-nutrition"],
) {
  const ids = matchingNutrients(item, goals);
  if (!ids.length)
    return "An ingredient to explore. No verified match to the current support goal is recorded.";
  const matched = ids
    .slice(0, 3)
    .map((n) => NUTRIENTS[n].label.toLowerCase());
  const nutrients = matched.length > 1
    ? `${matched.slice(0, -1).join(", ")} and ${matched[matched.length - 1]}`
    : matched[0];
  const basis =
    "ingredients" in item
      ? "This meal brings together ingredients that provide"
      : "This food provides";
  return `${basis} ${nutrients}. These nutrients are part of your ${goals.map((g) => GOALS[g].label.toLowerCase()).join(" / ")} food picks.`;
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
