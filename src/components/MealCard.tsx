import GlossaryText from "./GlossaryText";
import React from "react";
import type { Meal } from "../types";
import ImagePlaceholder from "./ImagePlaceholder";
import AssetImage from "./AssetImage";
import { mealImagePath } from "../data/assets";
import { Clock, ChefHat, ChevronRight } from "./icons";
import { Link } from "../lib/router";

interface MealCardProps {
  meal: Meal;
}

const DIFFICULTY_STYLE: Record<Meal["difficulty"], string> = {
  Easy: "bg-mint-100 text-mint-500",
  Medium: "bg-sunny-100 text-amber-600",
  Advanced: "bg-coral-100 text-coral-600",
};

export default function MealCard({ meal }: MealCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
      <AssetImage
        src={mealImagePath(meal.id)}
        alt={meal.name}
        className="h-32 w-full object-cover"
        fallback={
          <ImagePlaceholder
            emoji={meal.emoji}
            gradient={meal.gradient}
            className="h-32 w-full"
            emojiClassName="text-6xl"
          />
        }
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold text-slate-900">{meal.name}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${DIFFICULTY_STYLE[meal.difficulty]}`}>
            {meal.difficulty}
          </span>
        </div>
        <p className="mt-1 text-xs leading-snug text-slate-500">{meal.description}</p>

        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Ingredients
        </p>
        <p className="line-clamp-1 text-xs text-slate-600">
          {meal.ingredients.map((i) => i.name).join(", ")}
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {meal.nutrients.slice(0, 3).map((n) => (
            <span key={n} className="chip">
              <GlossaryText text={n} />
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {meal.prepTimeMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <ChefHat size={14} /> {meal.difficulty}
            </span>
          </div>
          <Link
            to={`/recipe/${meal.recipeId}`}
            className="flex items-center gap-0.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95"
          >
            View Recipe <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
