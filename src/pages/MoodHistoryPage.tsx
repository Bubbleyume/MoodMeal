import React, { useMemo } from "react";
import MoodChart from "../components/MoodChart";
import { useMoodHistory } from "../hooks/useMoodHistory";
import { getEmotionById } from "../data/emotions";
import { Trash2, TrendingUp, Info } from "../components/icons";
import { Link } from "../lib/router";
import type { EmotionId } from "../types";

export default function MoodHistoryPage() {
  const { entries, removeEntry } = useMoodHistory();

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const avg = entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length;
    const counts = new Map<string, number>();
    entries.forEach((e) => counts.set(e.emotionId, (counts.get(e.emotionId) ?? 0) + 1));
    const [topEmotionId] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return { avg, topEmotion: getEmotionById(topEmotionId as EmotionId) };
  }, [entries]);

  return (
    <div className="flex h-full flex-1 flex-col mm-soft-bg">
      <div className="mm-gradient-bg px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <h1 className="font-display text-xl font-extrabold">Mood History</h1>
        <p className="mt-0.5 text-xs text-white/70">See how you've been feeling</p>
      </div>
      <div className="screen-scroll -mt-4 rounded-t-[2rem] bg-transparent px-4 pt-5">
        {entries.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center text-slate-400">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-300">
              <TrendingUp size={28} />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-500">No mood entries yet</p>
            <Link to="/mood" className="mt-3 text-sm font-semibold text-brand-600">
              Log your first mood →
            </Link>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="section-title">Mood Trend</h2>
                <span className="text-xs text-slate-400">{entries.length} entries</span>
              </div>
              <MoodChart entries={entries} />
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-slate-400">
                <Info size={12} className="mt-0.5 shrink-0" />
                This is your self-reported mood history — not a clinical or diagnostic score.
              </p>
            </div>

            {stats && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="card text-center">
                  <p className="text-2xl font-extrabold text-brand-600">{stats.avg.toFixed(1)}</p>
                  <p className="text-xs text-slate-400">Average intensity</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl">{stats.topEmotion?.emoji}</p>
                  <p className="text-xs text-slate-400">Most frequent — {stats.topEmotion?.name}</p>
                </div>
              </div>
            )}

            <div className="mt-5">
              <h2 className="section-title mb-2">All Entries</h2>
              <div className="space-y-2">
                {entries.map((entry) => {
                  const emotion = getEmotionById(entry.emotionId);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-slate-100"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
                        style={{ backgroundColor: `${emotion?.color}22` }}
                      >
                        {emotion?.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800">{emotion?.name}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(entry.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${entry.intensity * 10}%`,
                                backgroundColor: emotion?.color,
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {entry.intensity}/10
                          </span>
                        </div>
                        {entry.note && (
                          <p className="mt-1 truncate text-xs italic text-slate-400">“{entry.note}”</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeEntry(entry.id)}
                        aria-label="Delete entry"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-coral-50 hover:text-coral-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
