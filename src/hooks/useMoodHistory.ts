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
    []
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

  /** Removes an entry and returns it with its stored position, so it can be restored. */
  const removeEntry = useCallback(
    (id: string) => {
      const index = entries.findIndex((e) => e.id === id);
      const removed = index >= 0 ? { entry: entries[index], index } : null;
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return removed;
    },
    [entries, setEntries]
  );

  /** Puts a removed entry back at its original stored position (undo). */
  const restoreEntry = useCallback(
    (entry: MoodHistoryEntry, index: number) => {
      setEntries((prev) =>
        prev.some((e) => e.id === entry.id)
          ? prev
          : [...prev.slice(0, index), entry, ...prev.slice(index)]
      );
    },
    [setEntries]
  );

  const sorted = entries.filter(e => !/^seed-\d+$/.test(e.id)).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return { entries: sorted, addEntry, removeEntry, restoreEntry };
}
