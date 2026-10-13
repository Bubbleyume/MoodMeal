import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useProfile } from "./useProfile";
import { DEFAULT_PREFERENCES, normalizePreferences } from "../lib/preferences";
import type { FoodPreferences } from "../types/library";
export function useFoodPreferences() {
  const [saved] = useLocalStorage<FoodPreferences>(
    "moodmeal:preferences",
    DEFAULT_PREFERENCES,
  );
  const { profile } = useProfile();
  return useMemo(
    () => ({
      ...normalizePreferences(saved),
      dietaryPattern: profile.dietaryPreference,
    }),
    [saved, profile.dietaryPreference],
  );
}
