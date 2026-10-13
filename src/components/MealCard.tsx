import { useState } from "react";
import type { Meal } from "../types";
import type { GoalId } from "../types/library";
import { Link } from "../lib/router";
import FoodImage from "./FoodImage";
import { PickExplanation } from "./Knowledge";
import { getRecipeById } from "../data/recipes";
import { useGroceryList } from "../hooks/useGroceryList";
import { recordInteraction } from "../lib/interactions";
import { ingredientLine } from "../lib/catalog";
export default function MealCard({
  meal,
  goals,
}: {
  meal: Meal;
  goals?: GoalId[];
}) {
  const { addMany } = useGroceryList();
  const [added, setAdded] = useState(false);
  const recipe = getRecipeById(meal.recipeId);
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
      <FoodImage src={meal.image} name={meal.name} />
      <div className="p-4">
        <h3 className="font-display text-lg font-bold">{meal.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{meal.description}</p>
        <p className="mt-2 text-xs">
          {recipe?.totalTime ?? meal.prepTimeMinutes} min total ·{" "}
          {meal.difficulty} · {meal.cuisine}
        </p>
        <p className="mt-2 text-xs text-brand-700">
          {meal.dietaryTags.join(" · ")}
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Allergens / check labels:{" "}
          {meal.allergens.join(", ") || "None identified in listed ingredients"}
        </p>
        <PickExplanation item={meal} goals={goals} />
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
            to={`/recipe/${meal.recipeId}`}
            onClick={() => recordInteraction(meal, "meal", "view")}
          >
            View Recipe
          </Link>
          <button
            className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700"
            onClick={() => {
              addMany(
                (
                  recipe?.structuredIngredients ?? meal.structuredIngredients
                ).map(ingredientLine),
                meal.name,
              );
              recordInteraction(meal, "meal", "save");
              setAdded(true);
              setTimeout(() => setAdded(false), 1800);
            }}
          >
            {added ? "Ingredients added" : "Add all to Grocery"}
          </button>
        </div>
      </div>
    </article>
  );
}
