// Centralized localStorage keys, so it's obvious what MoodMeal persists and
// easy to migrate to Supabase later (each key maps cleanly to a table).
export const STORAGE_KEYS = {
  groceryList: "moodmeal:groceryList",
  moodHistory: "moodmeal:moodHistory",
  profile: "moodmeal:profile",
  draftMood: "moodmeal:draftMood",
  avatar: "moodmeal:avatar",
  health: "moodmeal:health",
  measurements: "moodmeal:measurements",
  reminders: "moodmeal:reminders",
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private browsing, quota, etc.) —
    // fail silently so the app keeps working in-memory for the session.
  }
}

export function clearAllMoodMealData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}
