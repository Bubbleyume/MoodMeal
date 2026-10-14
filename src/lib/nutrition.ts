import type { NutritionInput, NutritionValue } from "../types/nutrition";

/** Missing amounts or inconsistent units make the complete total unknown. */
export function calculateNutrition(
  ingredients: NutritionInput[],
  definitions: { id: string; name: string; unit: string }[],
  servings: number,
): NutritionValue[] {
  return definitions.map(definition => {
    const contributions = ingredients.map(ingredient => {
      const value = ingredient.nutrients[definition.id];
      const valid = ingredient.grams !== null && Number.isFinite(ingredient.grams) && ingredient.grams >= 0
        && value?.amount !== null && value?.amount !== undefined && Number.isFinite(value.amount)
        && value.amount >= 0 && value.unit === definition.unit;
      return {
        name: ingredient.name,
        amount: valid ? value.amount! * ingredient.grams! / 100 : null,
        sourceRowId: value?.sourceRowId ?? null,
      };
    });
    const total = contributions.length && contributions.every(c => c.amount !== null)
      ? contributions.reduce((sum, c) => sum + c.amount!, 0) : null;
    return {
      ...definition, contributions, total,
      perServing: total !== null && Number.isFinite(servings) && servings > 0 ? total / servings : null,
    };
  });
}
