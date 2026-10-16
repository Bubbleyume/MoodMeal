// Centralized localStorage keys, so it's obvious what MoodMeal persists and
// easy to migrate to Supabase later (each key maps cleanly to a table).
export const STORAGE_KEYS = {
  preferences: "moodmeal:preferences",
  interactions: "moodmeal:interactions",
  library: "moodmeal:library",
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
    const parsed = JSON.parse(raw);
    if(Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if(fallback !== null && typeof fallback === "object" && (parsed === null || typeof parsed !== "object")) return fallback;
    // An object setting stored as an array (or vice versa) is unreadable, not data to render.
    if(fallback !== null && typeof fallback === "object" && !Array.isArray(fallback) && Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("moodmeal-storage"));
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
