import type { Provenance } from "./library";

export interface UsdaNutrientValue {
  amount: number | null;
  unit: string;
  sourceRowId: string | null;
}
export interface NutritionInput {
  name: string;
  fdcId: string;
  grams: number | null;
  portionId: string;
  portionDescription: string;
  nutrients: Record<string, UsdaNutrientValue>;
}
export interface NutritionValue {
  id: string;
  name: string;
  unit: string;
  total: number | null;
  perServing: number | null;
  contributions: { name: string; amount: number | null; sourceRowId: string | null }[];
}
export interface RecipeNutritionEstimate {
  status: "approved-pilot-estimate";
  servings: number;
  ingredients: NutritionInput[];
  values: NutritionValue[];
  sources: Provenance[];
}
