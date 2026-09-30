import type { RecommendationInput, RecommendationResult } from "../types";
import { FOODS } from "../data/foods";
import { MEALS } from "../data/meals";
import { getEmotionById } from "../data/emotions";
import { matchesDietaryPreference } from "./dietary";

/**
 * The single entry point for turning a mood into food/meal recommendations.
 *
 * Today this reads from local structured data (src/data). Later, this is
 * the function to swap for a call to Supabase + an AI model: keep the same
 * input/output shape (RecommendationInput -> RecommendationResult) and
 * every screen that calls getRecommendations() keeps working unchanged.
 */
export function getRecommendations(input: RecommendationInput): RecommendationResult {
  const { emotionId, intensity, dietaryPreferences = "none" } = input;
  const emotion = getEmotionById(emotionId);

  if (!emotion) {
    throw new Error(`Unknown emotion id: ${emotionId}`);
  }

  const matchingFoods = FOODS.filter(
    (food) => food.moodTags.includes(emotionId) && matchesDietaryPreference(food, dietaryPreferences)
  );
  const matchingMeals = MEALS.filter(
    (meal) => meal.moodTags.includes(emotionId) && matchesDietaryPreference(meal, dietaryPreferences)
  );

  // Higher intensity -> surface a few more options, within what's available.
  const foodCount = intensity >= 7 ? 6 : intensity >= 4 ? 5 : 4;
  const mealCount = intensity >= 7 ? 4 : 3;

  const foods = matchingFoods.slice(0, foodCount);
  const meals = matchingMeals.slice(0, mealCount);

  const intensityWord = intensity >= 8 ? "really" : intensity >= 5 ? "fairly" : "a little";

  const explanation = `You're feeling ${intensityWord} ${emotion.name.toLowerCase()} today (${intensity}/10). ${
    emotion.description
  } We've focused on foods and meals with ${emotion.nutrientFocus.slice(0, 3).join(", ")}.`;

  return { emotion, foods, meals, explanation };
}
