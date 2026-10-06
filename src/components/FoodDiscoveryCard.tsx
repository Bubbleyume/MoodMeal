import GlossaryText from "./GlossaryText";
import React, { useState } from "react";
import type { Food } from "../types";
import AssetImage from "./AssetImage";
import ImagePlaceholder from "./ImagePlaceholder";
import { foodImagePath } from "../data/assets";
import { getNutrientHighlight } from "../lib/nutrientHighlights";
import { Check, Plus } from "./icons";

interface FoodDiscoveryCardProps {
  food: Food;
  featured?: boolean;
  onAddToGroceryList: (food: Food) => void;
}

/**
 * Rich, food-forward card used on the Mood Result / discovery screen —
 * large artwork, name, a short evidence-conscious nutrient highlight, and
 * an add-to-grocery action. The first card in a list is rendered
 * "featured" (larger art, green accent ring) to match the reference art's
 * vertical, one-thing-at-a-time food discovery feel.
 */
export default function FoodDiscoveryCard({ food, featured = false, onAddToGroceryList }: FoodDiscoveryCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToGroceryList(food);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const imageSize = featured ? "h-40 w-40" : "h-20 w-20";

  return (
    <div
      className={`flex flex-col items-center rounded-3xl bg-white p-4 text-center shadow-card ring-1 ring-slate-100 animate-fade-in ${
        featured ? "gap-2" : "flex-row items-center gap-3 text-left"
      }`}
    >
      <div
        className={`shrink-0 overflow-hidden rounded-2xl ${imageSize} ${
          featured ? "ring-4 ring-moodGreen-400 ring-offset-2" : ""
        }`}
      >
        <AssetImage
          src={foodImagePath(food.id)}
          alt={food.name}
          className="h-full w-full object-cover"
          fallback={
            <ImagePlaceholder
              emoji={food.emoji}
              gradient={food.gradient}
              className="h-full w-full"
              emojiClassName={featured ? "text-6xl" : "text-3xl"}
            />
          }
        />
      </div>

      <div className={`min-w-0 flex-1 ${featured ? "" : ""}`}>
        <h3 className={`font-display font-bold text-slate-900 ${featured ? "text-lg" : "text-sm"}`}>
          {food.name}
        </h3>
        <p className={`font-semibold text-brand-600 ${featured ? "mt-1 text-sm" : "text-xs"}`}>
          <GlossaryText text={getNutrientHighlight(food)} />
        </p>
        {featured && (
          <p className="mt-1.5 text-xs leading-snug text-slate-500">{food.description}</p>
        )}

        <button
          onClick={handleAdd}
          className={`mt-2 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            added ? "bg-moodGreen-400 text-white" : "bg-brand-100 text-brand-700 hover:bg-brand-200"
          }`}
        >
          {added ? <Check size={14} /> : <Plus size={14} />}
          {added ? "Added" : "Add to Grocery List"}
        </button>
      </div>
    </div>
  );
}
