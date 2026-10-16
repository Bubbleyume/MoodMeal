import {useFoodPreferences} from "../hooks/useFoodPreferences";
import { readPreferences } from "../lib/preferences";
import {browseItems,goalsForMood} from "../lib/recommendations";
import HealthContext from "../components/HealthContext";
import React, { useMemo } from "react";
import Header from "../components/Header";
import MealCard from "../components/MealCard";
import { useDraftMood } from "../hooks/useDraftMood";
import { useProfile } from "../hooks/useProfile";
import { getRecommendations } from "../lib/recommendations";
import { MEALS } from "../data/meals";
import { getEmotionById } from "../data/emotions";

export default function MealsPage() {
  const { draft } = useDraftMood();
  const { profile } = useProfile();
  const preferences = useFoodPreferences();

  const { title, subtitle, meals } = useMemo(() => {
    if (draft) {
      const rec = getRecommendations({
        emotionId: draft.emotionId,
        intensity: draft.intensity,
        dietaryPreferences: profile.dietaryPreference,
        preferences,
      });
      const emotion = getEmotionById(draft.emotionId)!;
      return {
        title: "Meal Suggestions",
        subtitle: `Picked for feeling ${emotion.name.toLowerCase()}`,
        meals: rec.meals,
      };
    }
    return {
      title: "All Meals",
      subtitle: "Check in with your mood for personalized picks",
      meals: browseItems(MEALS, preferences),
    };
  }, [draft, profile.dietaryPreference, preferences]);

  return (
    <div className="flex h-full flex-1 flex-col mm-soft-bg">
      <Header title={title} subtitle={subtitle} />
      <div className="screen-scroll px-4 pt-4">
        <HealthContext />
        {meals.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center text-slate-500">
            <p className="mt-2 text-sm">No meals match your current filters yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meals.map((meal) => (
              <MealCard goals={draft?goalsForMood(draft.emotionId,draft.intensity):undefined} key={meal.id} meal={meal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
