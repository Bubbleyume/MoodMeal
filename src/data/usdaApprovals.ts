import data from "./usda/approved-ingredients.json";
import type { NutritionInput, UsdaNutrientValue } from "../types/nutrition";
import type { StructuredIngredient } from "../types/library";

/**
 * User-approved USDA ingredient records (see docs/usda/README.md). Approval
 * covers the ingredient identity and listed conversions only: no recipe totals
 * are published from these until every ingredient in that recipe is reviewed.
 */
export const APPROVED_INGREDIENTS = data.ingredients;

/** Grams for an exactly approved name, quantity and unit; anything else is unreviewed. */
export function approvedIngredientInput(line: StructuredIngredient): NutritionInput | null {
  const record = APPROVED_INGREDIENTS.find(r => r.ingredient === line.name);
  const conversion = record?.conversions.find(c =>
    c.unit === line.unit && line.quantity !== null && Math.abs(c.quantity - line.quantity) < 1e-9);
  if (!record || !conversion || line.notes) return null;
  return {
    name: record.ingredient,
    fdcId: record.fdcId,
    grams: conversion.grams,
    portionId: conversion.basePortionId,
    portionDescription: conversion.derivation,
    nutrients: record.nutrients as Record<string, UsdaNutrientValue>,
  };
}

/** Review coverage for a recipe. Informational only; it never produces totals. */
export function recipeReviewCoverage(recipe: { structuredIngredients: StructuredIngredient[] }) {
  const approved = recipe.structuredIngredients.filter(i => approvedIngredientInput(i));
  return {
    approved: approved.map(i => i.name),
    unreviewed: recipe.structuredIngredients.filter(i => !approved.includes(i)).map(i => i.name),
  };
}
