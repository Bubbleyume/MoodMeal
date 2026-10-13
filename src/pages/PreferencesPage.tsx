import { useState } from "react";
import Header from "../components/Header";
import Button from "../components/Button";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useProfile } from "../hooks/useProfile";
import { DEFAULT_PREFERENCES, normalizePreferences } from "../lib/preferences";
import type { FoodPreferences } from "../types/library";
import type { DietaryPreference } from "../types";
export default function PreferencesPage() {
  const { profile, updateProfile } = useProfile();
  const [saved, save] = useLocalStorage<FoodPreferences>(
    "moodmeal:preferences",
    DEFAULT_PREFERENCES,
  );
  const [draft, setDraft] = useState({
    ...normalizePreferences(saved),
    dietaryPattern: profile.dietaryPreference,
  });
  const [message, setMessage] = useState("");
  const [texts, setTexts] = useState({
    intolerances: draft.intolerances.join(", "),
    dislikes: draft.dislikes.join(", "),
    cuisines: draft.cuisines.join(", "),
  });
  const change = (patch: Partial<FoodPreferences>) => {
    setDraft({ ...draft, ...patch });
    setMessage("");
  };
  return (
    <div className="mm-soft-bg flex h-full flex-1 flex-col">
      <Header
        title="Food preferences"
        subtitle="Optional, and yours to change"
      />
      <form
        className="screen-scroll space-y-4 px-4 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          const split = (s: string) =>
            s
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
          const next = {
            ...draft,
            intolerances: split(texts.intolerances),
            dislikes: split(texts.dislikes),
            cuisines: split(texts.cuisines),
          };
          try {
            window.localStorage.setItem(
              "moodmeal:preferences",
              JSON.stringify(next),
            );
          } catch {
            setMessage(
              "Unable to save: browser storage is full or unavailable.",
            );
            return;
          }
          save(next);
          updateProfile({ dietaryPreference: next.dietaryPattern });
          setMessage("Food preferences saved.");
        }}
      >
        <label className="card block">
          Dietary pattern
          <select
            aria-label="Dietary pattern"
            className="well-input"
            value={draft.dietaryPattern}
            onChange={(e: { target: { value: string } }) =>
              change({ dietaryPattern: e.target.value as DietaryPreference })
            }
          >
            {[
              "none",
              "vegetarian",
              "vegan",
              "gluten-free",
              "dairy-free",
              "low-sugar",
            ].map((x) => (
              <option key={x} value={x}>
                {x === "none" ? "No preference" : x === "low-sugar" ? "Fewer sweetened options" : x}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="card">
          <legend className="font-bold">Allergies</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              "milk",
              "egg",
              "fish",
              "shellfish",
              "tree nuts",
              "peanuts",
              "wheat",
              "soy",
              "sesame",
            ].map((a) => (
              <label
                className="flex min-h-[44px] items-center gap-2 text-sm"
                key={a}
              >
                <input
                  type="checkbox"
                  checked={draft.allergies.includes(a)}
                  onChange={() =>
                    change({
                      allergies: draft.allergies.includes(a)
                        ? draft.allergies.filter((x) => x !== a)
                        : [...draft.allergies, a],
                    })
                  }
                />
                {a}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Filters use listed ingredients. Always check packaging,
            substitutions and cross-contact; this library cannot certify an
            allergy-safe meal.
          </p>
        </fieldset>
        {(["intolerances", "dislikes", "cuisines"] as const).map((key) => (
          <label className="card block" key={key}>
            {key === "intolerances"
              ? "Food intolerances / other foods to avoid"
              : key === "dislikes"
                ? "Disliked foods"
                : "Favorite cuisines"}
            <input
              className="well-input"
              value={texts[key]}
              onChange={(e) => {
                setTexts({ ...texts, [key]: e.target.value });
                setMessage("");
              }}
              placeholder={
                key === "cuisines"
                  ? "Everyday, Asian, Mediterranean"
                  : "Separate with commas"
              }
            />
            <span className="text-xs text-slate-500">
              {key === "cuisines"
                ? "Used to order matching recipes."
                : "Use ingredient names, such as garlic, or dairy / gluten."}
            </span>
          </label>
        ))}
        <label className="card block">
          Cooking skill
          <select
            aria-label="Cooking skill"
            className="well-input"
            value={draft.cookingSkill}
            onChange={(e: { target: { value: string } }) =>
              change({
                cookingSkill: e.target.value as FoodPreferences["cookingSkill"],
              })
            }
          >
            {["any", "Easy", "Medium", "Advanced"].map((x) => (
              <option key={x} value={x}>
                {x === "any" ? "Any difficulty" : x}
              </option>
            ))}
          </select>
        </label>
        <label className="card block">
          Budget preference
          <select
            aria-label="Budget preference"
            className="well-input"
            value={draft.budget}
            onChange={(e: { target: { value: string } }) =>
              change({ budget: e.target.value as FoodPreferences["budget"] })
            }
          >
            {["any", "budget", "moderate", "flexible"].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">
            Relative ingredient-cost groups, not live local prices.
          </span>
        </label>
        <label className="card block">
          Maximum total preparation time (minutes)
          <input
            className="well-input"
            type="number"
            min="1"
            max="240"
            value={draft.maxPrepTime ?? ""}
            onChange={(e) =>
              change({
                maxPrepTime: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="Any time"
          />
        </label>
        <label className="card block">
          What would you like?
          <select
            aria-label="What would you like?"
            className="well-input"
            value={draft.recommendationType}
            onChange={(e: { target: { value: string } }) =>
              change({
                recommendationType: e.target
                  .value as FoodPreferences["recommendationType"],
              })
            }
          >
            <option value="any">Any option</option>
            <option value="snack">Snack</option>
            <option value="full-meal">Full meal</option>
            <option value="quick">Quick option (15 minutes or less)</option>
          </select>
        </label>
        <Button type="submit" fullWidth>
          Save food preferences
        </Button>
        <p className="text-sm text-brand-700" role="status">
          {message}
        </p>
        <p className="text-xs text-slate-500">
          Saved in this browser. Health conditions do not create nutrition
          advice or change these rankings.
        </p>
      </form>
    </div>
  );
}
