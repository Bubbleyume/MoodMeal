import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS } from "../lib/storage";
import type { EmotionId, MoodHistoryEntry } from "../types";
import { SAMPLE_MOOD_HISTORY } from "../data/moodHistory";

function makeId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useMoodHistory() {
  const [entries, setEntries] = useLocalStorage<MoodHistoryEntry[]>(
    STORAGE_KEYS.moodHistory,
    SAMPLE_MOOD_HISTORY
  );

  const addEntry = useCallback(
    (emotionId: EmotionId, intensity: number, note?: string) => {
      const entry: MoodHistoryEntry = {
        id: makeId(),
        date: new Date().toISOString(),
        emotionId,
        intensity,
        note: note?.trim() || undefined,
      };
      setEntries((prev) => [entry, ...prev]);
      return entry;
    },
    [setEntries]
  );

  const removeEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [setEntries]
  );

  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return { entries: sorted, addEntry, removeEntry };
}
