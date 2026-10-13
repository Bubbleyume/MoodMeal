import { useState } from "react";
import { useParams, Navigate } from "../lib/router";
import Header from "../components/Header";
import Button from "../components/Button";
import FoodImage from "../components/FoodImage";
import { PickExplanation, Sources } from "../components/Knowledge";
import { getRecipeById } from "../data/recipes";
import { getMealById } from "../data/meals";
import { useGroceryList } from "../hooks/useGroceryList";
import { useDraftMood } from "../hooks/useDraftMood";
import { goalsForMood } from "../lib/recommendations";
import { ingredientLine } from "../lib/catalog";
import { recordInteraction } from "../lib/interactions";
export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recipe = getRecipeById(id);
  const meal = recipe ? getMealById(recipe.mealId) : undefined;
  const { addMany } = useGroceryList();
  const { draft } = useDraftMood();
  const [added, setAdded] = useState(false);
  if (!recipe || !meal) return <Navigate to="/meals" replace />;
  return (
    <div className="mm-soft-bg flex h-full flex-1 flex-col">
      <Header title={recipe.name} subtitle="Recipe" />
      <div className="screen-scroll">
        <FoodImage
          src={recipe.image}
          name={recipe.name}
          className="h-56 w-full"
        />
        <div className="space-y-4 px-4 pt-4">
          <p>{recipe.description}</p>
          <div className="card text-sm">
            <p>
              Serves {recipe.servings} · {recipe.totalTime} min total
            </p>
            <p className="mt-2">
              Prep {recipe.prepTime} min · Cook {recipe.cookTime} min
              {recipe.totalTime > recipe.prepTime + recipe.cookTime
                ? ` · Rest/chill ${recipe.totalTime - recipe.prepTime - recipe.cookTime} min`
                : ""}
            </p>
            <p className="mt-2">{recipe.dietaryTags.join(" · ")}</p>
            <p className="mt-2">
              Allergens / check labels:{" "}
              {recipe.allergens.join(", ") ||
                "None identified in listed ingredients"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Times are estimates. Check ingredient packaging and substitutions.
            </p>
          </div>
          <section className="card">
            <PickExplanation
              item={meal}
              goals={
                draft
                  ? goalsForMood(draft.emotionId, draft.intensity)
                  : undefined
              }
            />
            <p className="mt-3 text-xs text-slate-500">
              Nutrition totals: not calculated. Nutrient tags describe
              documented ingredients, not measured amounts per serving.
            </p>
          </section>
          <section className="card">
            <h2 className="section-title">Ingredients</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {recipe.structuredIngredients.map((i, index) => (
                <li
                  key={`${i.ingredientId}-${index}`}
                  className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <strong>{i.name}</strong>
                    <p className="text-xs text-slate-500">
                      {i.quantity ?? ""}{" "}
                      {i.quantity === null
                        ? ""
                        : i.unit === "each"
                          ? ""
                          : i.unit}{" "}
                      {i.notes}
                      {i.optional ? " (optional)" : ""}
                    </p>
                  </div>
                  <button
                    aria-label={`Add ${i.name} to Grocery`}
                    className="rounded-xl bg-brand-50 px-3 py-2 text-brand-700"
                    onClick={() => {
                      addMany([ingredientLine(i)], recipe.name);
                      setAdded(true);
                    }}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="card">
            <h2 className="section-title">Instructions</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-slate-600">
              {recipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <Sources sources={recipe.sourceProvenance} />
          </section>
          <Button
            fullWidth
            onClick={() => {
              addMany(
                recipe.structuredIngredients.map(ingredientLine),
                recipe.name,
              );
              recordInteraction(meal, "meal", "save");
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
          >
            {added ? "Ingredients added" : "Add ingredients to Grocery"}
          </Button>
          <p role="status" className="text-xs text-brand-700">
            {added ? "Grocery list updated." : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
