import React, { useMemo } from "react";
import Header from "../components/Header";
import FoodCard from "../components/FoodCard";
import WellnessDisclaimer from "../components/WellnessDisclaimer";
import { useDraftMood } from "../hooks/useDraftMood";
import { useProfile } from "../hooks/useProfile";
import { useGroceryList } from "../hooks/useGroceryList";
import { getRecommendations } from "../lib/recommendations";
import { FOODS } from "../data/foods";
import { getEmotionById } from "../data/emotions";
import type { Food } from "../types";
import { matchesDietaryPreference } from "../lib/dietary";

export default function FoodsPage() {
  const { draft } = useDraftMood();
  const { profile } = useProfile();
  const { addItem } = useGroceryList();

  const { title, subtitle, foods } = useMemo(() => {
    if (draft) {
      const rec = getRecommendations({
        emotionId: draft.emotionId,
        intensity: draft.intensity,
        dietaryPreferences: profile.dietaryPreference,
      });
      const emotion = getEmotionById(draft.emotionId)!;
      return {
        title: "Food Suggestions",
        subtitle: `Picked for feeling ${emotion.name.toLowerCase()}`,
        foods: rec.foods,
      };
    }
    return {
      title: "All Foods",
      subtitle: "Check in with your mood for personalized picks",
      foods: FOODS.filter((f) => matchesDietaryPreference(f, profile.dietaryPreference)),
    };
  }, [draft, profile.dietaryPreference]);

  const handleAdd = (food: Food) => {
    addItem(food.name, food.servingSuggestion, draft ? "Mood suggestion" : "Food browsing");
  };

  return (
    <div className="flex h-full flex-1 flex-col mm-soft-bg">
      <Header title={title} subtitle={subtitle} />
      <div className="screen-scroll px-4 pt-4">
        {foods.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center text-slate-400">
            <span className="text-4xl">🥗</span>
            <p className="mt-2 text-sm">No foods match your current filters yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {foods.map((food) => (
              <FoodCard key={food.id} food={food} onAddToGroceryList={handleAdd} />
            ))}
          </div>
        )}
        <WellnessDisclaimer className="mt-4" />
      </div>
    </div>
  );
}
