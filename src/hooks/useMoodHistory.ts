import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS, readStorage } from "../lib/storage";
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

  /** Removes an entry and returns it, so it can be restored (undo). */
  const removeEntry = useCallback(
    (id: string) => {
      // Read the stored list so back-to-back deletions see each other.
      const removed = readStorage<MoodHistoryEntry[]>(STORAGE_KEYS.moodHistory, []).find((e) => e.id === id) ?? null;
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return removed;
    },
    [setEntries]
  );

  /**
   * Puts a removed entry back (undo). The stored list is newest-first, so the
   * entry goes before the first older entry. This keeps the original order
   * even when several deletions are undone in any order.
   */
  const restoreEntry = useCallback(
    (entry: MoodHistoryEntry) => {
      setEntries((prev) => {
        if (prev.some((e) => e.id === entry.id)) return prev;
        const time = new Date(entry.date).getTime();
        const at = prev.findIndex((e) => new Date(e.date).getTime() < time);
        return at < 0 ? [...prev, entry] : [...prev.slice(0, at), entry, ...prev.slice(at)];
      });
    },
    [setEntries]
  );

  const sorted = entries.filter(e => !/^seed-\d+$/.test(e.id)).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return { entries: sorted, addEntry, removeEntry, restoreEntry };
}
