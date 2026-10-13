import { useState } from "react";
import type { Food } from "../types";
import type { GoalId } from "../types/library";
import FoodImage from "./FoodImage";
import { PickExplanation } from "./Knowledge";
import { recordInteraction } from "../lib/interactions";
export default function FoodCard({
  food,
  onAddToGroceryList,
  goals,
  featured = false,
}: {
  food: Food;
  onAddToGroceryList: (f: Food) => void;
  goals?: GoalId[];
  featured?: boolean;
}) {
  const [added, setAdded] = useState(false);
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
      <FoodImage
        src={food.image}
        name={food.name}
        className={featured ? "h-52 w-full" : "h-40 w-full"}
      />
      <div className="p-4">
        <h3 className="font-display text-lg font-bold">{food.name}</h3>
        <PickExplanation item={food} goals={goals} />
        <p className="mt-2 text-xs text-slate-500">
          Serving idea: {food.servingSuggestion}
        </p>
        <button
          className="mt-3 min-h-[44px] rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            onAddToGroceryList(food);
            recordInteraction(food, "food", "save");
            setAdded(true);
            setTimeout(() => setAdded(false), 1800);
          }}
        >
          {added ? "Added to Grocery" : "Add to Grocery"}
        </button>
      </div>
    </article>
  );
}
