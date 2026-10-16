import {historyInsights} from "../lib/interactions";
import {useLocalStorage} from "../hooks/useLocalStorage";
import type {Interaction} from "../types/library";
import React, { useEffect, useMemo, useRef, useState } from "react";
import MoodChart from "../components/MoodChart";
import { useMoodHistory } from "../hooks/useMoodHistory";
import { getEmotionById } from "../data/emotions";
import { Trash2, TrendingUp, Info } from "../components/icons";
import { Link } from "../lib/router";
import type { EmotionId, MoodHistoryEntry } from "../types";

const UNDO_MS = 10000;

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric" });

export default function MoodHistoryPage() {
  const { entries, removeEntry, restoreEntry } = useMoodHistory();
  const [events]=useLocalStorage<Interaction[]>("moodmeal:interactions",[]);
  // Recently deleted entries, newest last, kept in memory only so each can be
  // undone during its own UNDO_MS window.
  const [pending, setPending] = useState<MoodHistoryEntry[]>([]);
  const timers = useRef<Map<string, { handle: number; remaining: number; started: number }>>(new Map());
  const paused = useRef<boolean>(false);
  const hovered = useRef<boolean>(false);
  const regionRef = useRef<HTMLDivElement | null>(null);
  const listHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const expire = (id: string) => {
    timers.current!.delete(id);
    setPending((p) => p.filter((e) => e.id !== id));
  };
  const schedule = (id: string, ms: number) => {
    const handle = paused.current ? 0 : window.setTimeout(() => expire(id), ms);
    timers.current!.set(id, { handle, remaining: ms, started: Date.now() });
  };
  const cancel = (id: string) => {
    window.clearTimeout(timers.current!.get(id)?.handle);
    timers.current!.delete(id);
  };
  // Hovering or focusing the notices pauses every countdown; leaving resumes it.
  const pause = () => {
    if (paused.current) return;
    paused.current = true;
    for (const t of timers.current!.values()) {
      window.clearTimeout(t.handle);
      t.remaining = Math.max(0, t.remaining - (Date.now() - t.started));
    }
  };
  const resume = () => {
    if (!paused.current) return;
    paused.current = false;
    for (const [id, t] of [...timers.current!.entries()]) schedule(id, Math.max(t.remaining, 1000));
  };
  const resumeIfIdle = () =>
    window.setTimeout(() => {
      if (!hovered.current && !regionRef.current?.contains(document.activeElement)) resume();
    }, 0);
  useEffect(() => () => { for (const t of timers.current!.values()) window.clearTimeout(t.handle); }, []);

  // Focus targets are applied after render: the new notice's Undo button after
  // a keyboard delete, or the restored row after Undo.
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  useEffect(() => {
    if (!focusTarget) return;
    document.querySelector<HTMLElement>(focusTarget)?.focus();
    setFocusTarget(null);
  }, [focusTarget, pending, entries]);

  const handleDelete = (id: string, viaKeyboard: boolean) => {
    const removed = removeEntry(id);
    if (!removed) return;
    setPending((p) => [...p.filter((e) => e.id !== id), removed]);
    schedule(id, UNDO_MS);
    // The row's button is gone, so keyboard focus moves to its Undo instead of
    // being lost (focus pauses the countdown). Pointer users keep the timer.
    if (viaKeyboard) setFocusTarget(`[data-undo-id="${id}"]`);
  };

  const handleUndo = (entry: MoodHistoryEntry) => {
    cancel(entry.id);
    restoreEntry(entry);
    setPending((p) => p.filter((e) => e.id !== entry.id));
    setFocusTarget(`[data-entry-id="${entry.id}"]`);
  };

  const dismissAll = () => {
    for (const id of [...timers.current!.keys()]) cancel(id);
    paused.current = false;
    setPending([]);
    listHeadingRef.current?.focus();
  };

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
      <div className={`screen-scroll -mt-4 rounded-t-[2rem] bg-transparent px-4 pt-5 ${pending.length ? "!pb-4" : ""}`}>
        {entries.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center text-slate-500">
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
                <span className="text-xs text-slate-500">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
              </div>
              <MoodChart entries={entries} />
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-slate-500">
                <Info size={12} className="mt-0.5 shrink-0" />
                This is your self-reported mood history — not a clinical or diagnostic score.
              </p>
            </div>

            {stats && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="card text-center">
                  <p className="text-2xl font-extrabold text-brand-600">{stats.avg.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">Average intensity</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl">{stats.topEmotion?.emoji}</p>
                  <p className="text-xs text-slate-500">Most frequent — {stats.topEmotion?.name}</p>
                </div>
              </div>
            )}

            <section className="card mt-4"><h2 className="section-title">Your observations</h2><ul className="mt-3 space-y-3 text-sm text-slate-600">{historyInsights(entries,events).map(t=><li key={t}>{t}</li>)}</ul><p className="mt-3 text-xs text-slate-500">These are patterns in your records, not evidence that a food caused a change. Previous demo entries are excluded.</p></section>
            <div className="mt-5">
              <h2 ref={listHeadingRef} tabIndex={-1} className="section-title mb-2 outline-none">All Entries</h2>
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
                          <p className="text-xs text-slate-500">
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
                          <span className="text-[11px] font-semibold text-slate-500">
                            {entry.intensity}/10
                          </span>
                        </div>
                        {entry.note && (
                          <p className="mt-1 truncate text-xs italic text-slate-500">“{entry.note}”</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDelete(entry.id, e.detail === 0)}
                        data-entry-id={entry.id}
                        aria-label={`Delete ${emotion?.name ?? "mood"} entry from ${longDate(entry.date)}`}
                        className="-mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-coral-50 hover:text-coral-600"
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
      {/* Notices take real layout space above the bottom navigation, so the
          list scrolls above them and they can never cover an entry. */}
      <div
        ref={regionRef}
        role="status"
        aria-live="polite"
        className={pending.length ? "shrink-0 space-y-2 px-4 pt-2 pb-[calc(5.75rem+env(safe-area-inset-bottom))]" : ""}
        onMouseEnter={() => { hovered.current = true; pause(); }}
        onMouseLeave={() => { hovered.current = false; resumeIfIdle(); }}
        onFocus={pause}
        onBlur={resumeIfIdle}
        onKeyDown={(e) => {
          if (e.key === "Escape") dismissAll();
        }}
      >
        {pending.map((entry) => {
          const name = getEmotionById(entry.emotionId)?.name ?? "Mood";
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-slate-800 py-1.5 pl-4 pr-1.5 text-sm text-white shadow-lg animate-fade-in"
            >
              <span>{name} entry from {longDate(entry.date)} deleted.</span>
              <button
                data-undo-id={entry.id}
                onClick={() => handleUndo(entry)}
                aria-label={`Undo delete of ${name} entry from ${longDate(entry.date)}`}
                className="min-h-[44px] shrink-0 rounded-xl px-4 font-bold text-moodGreen-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Undo
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
