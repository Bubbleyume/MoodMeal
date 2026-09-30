import React, { useMemo, useState } from "react";
import { Navigate, useNavigate } from "../lib/router";
import Button from "../components/Button";
import WellnessDisclaimer from "../components/WellnessDisclaimer";
import FoodDiscoveryCard from "../components/FoodDiscoveryCard";
import EmotionFace from "../components/EmotionFace";
import { useDraftMood } from "../hooks/useDraftMood";
import { useProfile } from "../hooks/useProfile";
import { useGroceryList } from "../hooks/useGroceryList";
import { getRecommendations } from "../lib/recommendations";
import { ChefHat, ShoppingCart, Check } from "../components/icons";
import type { Food } from "../types";

export default function MoodResultPage() {
  const { draft } = useDraftMood();
  const { profile } = useProfile();
  const { addMany } = useGroceryList();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const recommendation = useMemo(() => {
    if (!draft) return null;
    return getRecommendations({
      emotionId: draft.emotionId,
      intensity: draft.intensity,
      dietaryPreferences: profile.dietaryPreference,
    });
  }, [draft, profile.dietaryPreference]);

  if (!draft || !recommendation) {
    return <Navigate to="/mood" replace />;
  }

  const { emotion, foods, meals, explanation } = recommendation;

  const handleAddFood = (food: Food) => {
    addMany([{ name: food.name, quantity: food.servingSuggestion }], `${emotion.name} check-in`);
  };

  const handleAddAll = () => {
    addMany(
      foods.map((f) => ({ name: f.name, quantity: f.servingSuggestion })),
      `${emotion.name} check-in`
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <div className="mm-gradient-bg px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Your Check-In</p>
        <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 motion-safe:animate-pop-in">
          {/* The heading right below already names the mood, so the
              avatar/emoji here is decorative to assistive tech. */}
          <EmotionFace emotion={emotion} emojiClassName="text-5xl" className="h-14 w-14 object-contain" decorative />
        </div>
        <h2 className="mt-2 font-display text-2xl font-extrabold">{emotion.name}</h2>
        <div className="mx-auto mt-2 h-2 w-40 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-moodGreen-400" style={{ width: `${draft.intensity * 10}%` }} />
        </div>
        <p className="mt-1 text-xs font-semibold text-white/80">Intensity {draft.intensity}/10</p>
        {draft.note && (
          <p className="mx-auto mt-3 max-w-xs rounded-2xl bg-white/15 px-3 py-2 text-xs italic text-white/90">
            “{draft.note}”
          </p>
        )}
      </div>

      <div className="screen-scroll -mt-4 rounded-t-[2rem] bg-white px-4 pt-5">
        <div className="card">
          <p className="text-sm leading-relaxed text-slate-600">{explanation}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {emotion.nutrientFocus.map((n) => (
              <span key={n} className="chip">
                {n}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <h2 className="section-title">Foods for you</h2>
          <span className="text-xs text-slate-400">{foods.length} suggestions</span>
        </div>
        <div className="mt-3 space-y-3">
          {foods.map((food, i) => (
            <FoodDiscoveryCard
              key={food.id}
              food={food}
              featured={i === 0}
              onAddToGroceryList={handleAddFood}
            />
          ))}
        </div>

        <Button
          fullWidth
          variant="secondary"
          className="mt-3"
          onClick={handleAddAll}
          icon={added ? <Check size={16} /> : <ShoppingCart size={16} />}
        >
          {added ? "Added to grocery list!" : "Add All Foods to Grocery List"}
        </Button>

        <button
          onClick={() => navigate("/meals")}
          className="mt-4 flex w-full items-center justify-between rounded-3xl bg-brand-50 p-4 text-left transition-transform active:scale-[0.98]"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-coral-500 shadow-sm">
              <ChefHat size={22} />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-800">View Meal Ideas</span>
              <span className="block text-[11px] text-slate-400">{meals.length} recipes matched to this mood</span>
            </span>
          </span>
        </button>

        <WellnessDisclaimer className="mb-4 mt-4" />
      </div>
    </>
  );
}
