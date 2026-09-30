import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS } from "../lib/storage";
import type { EmotionId } from "../types";

export interface DraftMood {
  emotionId: EmotionId;
  intensity: number;
  note: string;
  submittedAt: string;
}

/**
 * Holds the mood the user is currently working through (selected on the
 * Mood Selection screen, read back on the Result/Food/Meal screens) so
 * those screens don't need prop-drilling or route state. Persisted so a
 * refresh mid-flow doesn't lose the in-progress mood.
 */
export function useDraftMood() {
  const [draft, setDraft, reset] = useLocalStorage<DraftMood | null>(
    STORAGE_KEYS.draftMood,
    null
  );

  const submitMood = useCallback(
    (emotionId: EmotionId, intensity: number, note: string) => {
      setDraft({ emotionId, intensity, note, submittedAt: new Date().toISOString() });
    },
    [setDraft]
  );

  return { draft, submitMood, clearDraft: reset };
}
