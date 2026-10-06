import GlossaryText from "./GlossaryText";
import React, { useState } from "react";
import type { Food } from "../types";
import ImagePlaceholder from "./ImagePlaceholder";
import AssetImage from "./AssetImage";
import { foodImagePath } from "../data/assets";
import { Check, Plus } from "./icons";

interface FoodCardProps {
  food: Food;
  onAddToGroceryList: (food: Food) => void;
}

export default function FoodCard({ food, onAddToGroceryList }: FoodCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToGroceryList(food);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="flex gap-3 rounded-3xl bg-white p-3 shadow-card ring-1 ring-slate-100">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
        <AssetImage
          src={foodImagePath(food.id)}
          alt={food.name}
          className="h-full w-full object-cover"
          fallback={
            <ImagePlaceholder
              emoji={food.emoji}
              gradient={food.gradient}
              className="h-full w-full"
              emojiClassName="text-4xl"
            />
          }
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="font-display text-sm font-bold text-slate-900">{food.name}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {food.nutrients.slice(0, 3).map((n) => (
              <span key={n} className="chip">
                <GlossaryText text={n} />
              </span>
            ))}
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-slate-500">
            {food.description}
          </p>
          <p className="mt-1 text-[11px] font-medium text-brand-600">
            Serving: {food.servingSuggestion}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className={`mt-2 flex w-fit items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            added ? "bg-mint-400 text-white" : "bg-brand-100 text-brand-700 hover:bg-brand-200"
          }`}
        >
          {added ? <Check size={14} /> : <Plus size={14} />}
          {added ? "Added" : "Add to Grocery List"}
        </button>
      </div>
    </div>
  );
}
