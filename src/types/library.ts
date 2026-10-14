import type { DietaryPreference, EmotionId } from "./index";

export type ReviewStatus =
  | "draft"
  | "needs-review"
  | "reviewed"
  | "published"
  | "rejected";
export type EvidenceStatus =
  | "unverified"
  | "source-supported"
  | "independently-verified"
  | "conflicting-evidence"
  | "deprecated";
export type ClaimType =
  | "nutrient-function"
  | "food-nutrient"
  | "wellness-education"
  | "recipe"
  | "support-goal"
  | "research-note";
export interface Provenance {
  sourceTitle: string;
  author: string;
  edition?: string;
  pageOrSection: string;
  sourceURL?: string;
  doi?: string;
  reviewedDate?: string;
  reviewedBy?: string;
  evidenceStatus: EvidenceStatus;
  claimType: ClaimType;
  reviewStatus: ReviewStatus;
}
export type GoalId =
  | "steady-energy"
  | "calm-grounded"
  | "focus-attention"
  | "wind-down"
  | "balanced-nutrition"
  | "hydration"
  | "everyday-mood-support";
export interface NutrientFact {
  nutrientId: string;
  sourceProvenance: Provenance[];
  reviewStatus: ReviewStatus;
  amount?: number;
  unit?: string;
  basis?: string;
}
export interface StructuredIngredient {
  ingredientId: string;
  name: string;
  quantity: number | null;
  unit: string;
  optional: boolean;
  notes: string;
}
export interface LibraryMetadata {
  image: string;
  nutrientFacts: NutrientFact[];
  sourceProvenance: Provenance[];
  reviewStatus: ReviewStatus;
  supportGoals: GoalId[];
  allergens: string[];
  dietaryTags: string[];
  cuisine: string;
  mealType: "snack" | "full-meal" | "drink" | "ingredient";
  budget: "budget" | "moderate" | "flexible";
  structuredIngredients: StructuredIngredient[];
  nutrientTotals:
    | null
    | {
        nutrientId: string;
        amount: number | null;
        unit: string;
        basis: string;
        sourceProvenance: Provenance[];
      }[];
}
export interface FoodPreferences {
  dietaryPattern: DietaryPreference;
  allergies: string[];
  intolerances: string[];
  dislikes: string[];
  cuisines: string[];
  cookingSkill: "any" | "Easy" | "Medium" | "Advanced";
  budget: "any" | "budget" | "moderate" | "flexible";
  maxPrepTime: number | null;
  recommendationType: "any" | "snack" | "full-meal" | "quick";
}
export type LibraryCategory =
  | "nutritional-assessment"
  | "gut-health"
  | "food-sensitivities"
  | "special-diets"
  | "kitchen-nutrition"
  | "supplements"
  | "general-nutrition";
export interface Candidate {
  category: LibraryCategory;
  extracted?: {
    foodTerms: string[];
    nutrientTerms: string[];
    supportGoalTerms: string[];
    recipeConcept: boolean;
  };
  id: string;
  title: string;
  concept: string;
  originalCopy: string;
  claimType: ClaimType;
  sourceProvenance: Provenance[];
  reviewStatus: ReviewStatus;
  flags: string[];
  reviewNote: string;
  originalOrLicensed: boolean;
  reviewer: string;
  history: { status: ReviewStatus; date: string; reviewer: string }[];
}
export interface Interaction {
  id: string;
  date: string;
  itemId: string;
  name: string;
  kind: "food" | "meal";
  action: "save" | "view";
  checkInId?: string;
  emotionId?: EmotionId;
}
