import type { MoodHistoryEntry } from "../types";

// Realistic seed data so the Mood History screen looks populated on first
// launch. Real entries created in-app are merged with (and eventually
// replace) this seed set via useMoodHistory's localStorage persistence.
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + (n % 4), 15, 0, 0);
  return d.toISOString();
}

export const SAMPLE_MOOD_HISTORY: MoodHistoryEntry[] = [
  { id: "seed-1", date: daysAgo(20), emotionId: "tired", intensity: 6, note: "Long week at work." },
  { id: "seed-2", date: daysAgo(18), emotionId: "worried", intensity: 7, note: "Big exam coming up." },
  { id: "seed-3", date: daysAgo(16), emotionId: "happy", intensity: 8 },
  { id: "seed-4", date: daysAgo(14), emotionId: "excited", intensity: 9, note: "Weekend trip!" },
  { id: "seed-5", date: daysAgo(12), emotionId: "nervous", intensity: 5 },
  { id: "seed-6", date: daysAgo(10), emotionId: "sad", intensity: 4 },
  { id: "seed-7", date: daysAgo(9), emotionId: "tired", intensity: 5 },
  { id: "seed-8", date: daysAgo(7), emotionId: "angry", intensity: 6, note: "Traffic was rough." },
  { id: "seed-9", date: daysAgo(6), emotionId: "bored", intensity: 3 },
  { id: "seed-10", date: daysAgo(5), emotionId: "happy", intensity: 7 },
  { id: "seed-11", date: daysAgo(4), emotionId: "silly", intensity: 8, note: "Game night with friends." },
  { id: "seed-12", date: daysAgo(3), emotionId: "worried", intensity: 4 },
  { id: "seed-13", date: daysAgo(2), emotionId: "sick", intensity: 5 },
  { id: "seed-14", date: daysAgo(1), emotionId: "excited", intensity: 7 },
];
