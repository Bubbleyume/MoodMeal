// Central type definitions for MoodMeal. Kept separate from UI and from
// data so the local mock data below can later be swapped for Supabase
// queries / an AI recommendation API without touching component code.

export type EmotionId =
  | "happy"
  | "sad"
  | "tired"
  | "scared"
  | "angry"
  | "nervous"
  | "shy"
  | "excited"
  | "bored"
  | "silly"
  | "worried"
  | "sick";

export interface Emotion {
  id: EmotionId;
  name: string;
  emoji: string;
  /** Hex color used for chips, chart dots, and accents. */
  color: string;
  /** Tailwind gradient classes for cards/backgrounds tied to this emotion. */
  gradient: string;
  description: string;
  /** Nutrients generally associated with supporting this feeling/state. */
  nutrientFocus: string[];
  /** Quick-glance example food names shown on the emotion card itself. */
  exampleFoods: string[];
  /** Quick-glance example meal names shown on the emotion card itself. */
  exampleMeals: string[];
}

export type FoodCategory =
  | "fruit"
  | "vegetable"
  | "protein"
  | "grain"
  | "dairy"
  | "nuts-seeds"
  | "other";

export interface Food {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  category: FoodCategory;
  nutrients: string[];
  description: string;
  servingSuggestion: string;
  moodTags: EmotionId[];
}

export type Difficulty = "Easy" | "Medium" | "Advanced";

export interface IngredientLine {
  name: string;
  quantity: string;
}

export interface Meal {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  ingredients: IngredientLine[];
  nutrients: string[];
  prepTimeMinutes: number;
  difficulty: Difficulty;
  moodTags: EmotionId[];
  recipeId: string;
  description: string;
}

export interface Recipe {
  id: string;
  mealId: string;
  name: string;
  emoji: string;
  gradient: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: IngredientLine[];
  instructions: string[];
  nutritionHighlights: string[];
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
  addedFrom?: string;
  createdAt: string;
}

export interface MoodHistoryEntry {
  id: string;
  date: string; // ISO 8601
  emotionId: EmotionId;
  intensity: number; // 1-10
  note?: string;
}

export type DietaryPreference =
  | "none"
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "dairy-free"
  | "low-sugar";

export interface UserProfile {
  displayName: string;
  dietaryPreference: DietaryPreference;
  notificationsEnabled: boolean;
}

export interface RecommendationInput {
  emotionId: EmotionId;
  intensity: number;
  dietaryPreferences?: DietaryPreference;
  health?: import("../lib/wellness").HealthProfile;
}

export interface RecommendationResult {
  emotion: Emotion;
  foods: Food[];
  meals: Meal[];
  explanation: string;
}
