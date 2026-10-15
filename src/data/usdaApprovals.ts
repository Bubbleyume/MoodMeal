import data from "./usda/approved-ingredients.json";
import type { NutritionInput, UsdaNutrientValue } from "../types/nutrition";
import type { StructuredIngredient } from "../types/library";

/**
 * User-approved USDA ingredient records (see docs/usda/README.md). Approval
 * covers the ingredient identity and listed conversions only: no recipe totals
 * are published from these until every ingredient in that recipe is reviewed.
 */
export const APPROVED_INGREDIENTS = data.ingredients;

interface ApprovedConversion {
  quantity: number;
  unit: string;
  grams: number;
  basePortionId: string;
  derivation: string;
  /** Exact recipe notes the conversion was approved for; absent means none. */
  notes?: string;
  /** Recipes the conversion was approved for; absent means any recipe. */
  recipeIds?: string[];
}

/**
 * Grams for an exactly approved name, quantity, unit and notes, in a recipe
 * the conversion was approved for; anything else is unreviewed. The same
 * label can map to different records per recipe (raw vs hard-boiled egg).
 */
export function approvedIngredientInput(line: StructuredIngredient, recipeId?: string): NutritionInput | null {
  if (line.quantity === null) return null;
  for (const record of APPROVED_INGREDIENTS) {
    if (record.ingredient !== line.name) continue;
    const conversion = (record.conversions as ApprovedConversion[]).find(c =>
      c.unit === line.unit && Math.abs(c.quantity - line.quantity!) < 1e-9
      && (c.notes ?? "") === line.notes
      && (!c.recipeIds || (recipeId !== undefined && c.recipeIds.includes(recipeId))));
    if (!conversion) continue;
    return {
      name: record.ingredient,
      fdcId: record.fdcId,
      grams: conversion.grams,
      portionId: conversion.basePortionId,
      portionDescription: conversion.derivation,
      nutrients: record.nutrients as Record<string, UsdaNutrientValue>,
    };
  }
  return null;
}

/** Review coverage for a recipe. Informational only; it never produces totals. */
export function recipeReviewCoverage(recipe: { id: string; structuredIngredients: StructuredIngredient[] }) {
  const approved = recipe.structuredIngredients.filter(i => approvedIngredientInput(i, recipe.id));
  return {
    approved: approved.map(i => i.name),
    unreviewed: recipe.structuredIngredients.filter(i => !approved.includes(i)).map(i => i.name),
  };
}
