import GlossaryText from "../components/GlossaryText";
import React, { useState } from "react";
import { useParams, Navigate } from "../lib/router";
import Header from "../components/Header";
import Button from "../components/Button";
import ImagePlaceholder from "../components/ImagePlaceholder";
import WellnessDisclaimer from "../components/WellnessDisclaimer";
import { getRecipeById } from "../data/recipes";
import { useGroceryList } from "../hooks/useGroceryList";
import { Clock, Check, ShoppingCart } from "../components/icons";

// `Users` isn't in our icon set yet — fall back to a simple glyph inline
// rather than pulling in a new dependency for one icon.
function UsersFallback({ size = 16 }: { size?: number }) {
  return <span style={{ fontSize: size }}>👥</span>;
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recipe = getRecipeById(id);
  const { addMany } = useGroceryList();
  const [added, setAdded] = useState(false);

  if (!recipe) {
    return <Navigate to="/meals" replace />;
  }

  const handleAddIngredients = () => {
    addMany(recipe.ingredients, recipe.name);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex h-full flex-1 flex-col mm-soft-bg">
      <Header title={recipe.name} subtitle="Recipe" />
      <div className="screen-scroll">
        <ImagePlaceholder
          emoji={recipe.emoji}
          gradient={recipe.gradient}
          className="h-40 w-full"
          emojiClassName="text-7xl"
        />
        <div className="px-4 pt-4">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={16} /> {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min total
            </span>
            <span className="flex items-center gap-1">
              <UsersFallback size={14} /> Serves {recipe.servings}
            </span>
          </div>

          <div className="card mt-4">
            <h2 className="section-title">Nutrition Highlights</h2>
            <ul className="mt-2 space-y-1.5">
              {recipe.nutritionHighlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <GlossaryText text={h} />
                </li>
              ))}
            </ul>
          </div>

          <div className="card mt-4">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Ingredients</h2>
              <span className="text-xs text-slate-400">{recipe.ingredients.length} items</span>
            </div>
            <ul className="mt-2 divide-y divide-slate-100">
              {recipe.ingredients.map((ing) => (
                <li key={ing.name} className="flex justify-between py-2 text-sm">
                  <span className="text-slate-700">{ing.name}</span>
                  <span className="text-slate-400">{ing.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card mt-4">
            <h2 className="section-title">Instructions</h2>
            <ol className="mt-3 space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <Button
            fullWidth
            className="mt-4"
            onClick={handleAddIngredients}
            icon={added ? <Check size={16} /> : <ShoppingCart size={16} />}
          >
            {added ? "Ingredients added!" : "Add Ingredients to Grocery List"}
          </Button>

          <WellnessDisclaimer className="mt-4" />
        </div>
      </div>
    </div>
  );
}
