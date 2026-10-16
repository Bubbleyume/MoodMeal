import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS } from "../lib/storage";
import { getEmotionById } from "../data/emotions";
import type { EmotionId } from "../types";

function isValidDraft(value: unknown): value is DraftMood {
  const d = value as DraftMood | null;
  return !!d && typeof d === "object" && !!getEmotionById(d.emotionId)
    && Number.isInteger(d.intensity) && d.intensity >= 1 && d.intensity <= 10;
}

export interface DraftMood {
  emotionId: EmotionId;
  intensity: number;
  note: string;
  submittedAt: string;
  checkInId?: string;
}

/**
 * Holds the mood the user is currently working through (selected on the
 * Mood Selection screen, read back on the Result/Food/Meal screens) so
 * those screens don't need prop-drilling or route state. Persisted so a
 * refresh mid-flow doesn't lose the in-progress mood.
 */
export function useDraftMood() {
  const [stored, setDraft, reset] = useLocalStorage<DraftMood | null>(
    STORAGE_KEYS.draftMood,
    null
  );
  // A saved check-in with an unknown mood or out-of-range intensity is treated
  // as no check-in (screens redirect to /mood) instead of crashing.
  const draft = isValidDraft(stored) ? stored : null;

  const submitMood = useCallback(
    (emotionId: EmotionId, intensity: number, note: string, checkInId?: string) => {
      setDraft({ checkInId, emotionId, intensity, note, submittedAt: new Date().toISOString() });
    },
    [setDraft]
  );

  return { draft, submitMood, clearDraft: reset };
}
