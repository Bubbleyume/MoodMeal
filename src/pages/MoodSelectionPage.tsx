import React, { useState } from "react";
import { useNavigate } from "../lib/router";
import EmotionCard from "../components/EmotionCard";
import EmotionFace from "../components/EmotionFace";
import IntensitySlider from "../components/IntensitySlider";
import { EMOTIONS } from "../data/emotions";
import type { Emotion } from "../types";
import { useDraftMood } from "../hooks/useDraftMood";
import { useMoodHistory } from "../hooks/useMoodHistory";
import { X } from "../components/icons";

export default function MoodSelectionPage() {
  const navigate = useNavigate();
  const { submitMood } = useDraftMood();
  const { addEntry } = useMoodHistory();

  const [selected, setSelected] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");

  const handleContinue = () => {
    if (!selected) return;
    addEntry(selected.id, intensity, note);
    submitMood(selected.id, intensity, note);
    navigate("/analyzing");
  };

  return (
    <div className="mm-gradient-bg flex h-full flex-1 flex-col">
      <div className="px-6 pt-[max(2rem,env(safe-area-inset-top))] text-center">
        <h1 className="font-display text-[26px] font-extrabold leading-tight text-white">
          How are you feeling
          <br />
          today?
        </h1>
        <p className="mt-1.5 text-xs text-white/70">Pick what fits best right now</p>
      </div>

      <div className="screen-scroll px-4 pt-6">
        <div className="grid grid-cols-3 gap-3">
          {EMOTIONS.map((emotion) => (
            <EmotionCard
              key={emotion.id}
              emotion={emotion}
              selected={selected?.id === emotion.id}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      {/* Bottom-sheet panel: only appears once an emotion is picked, so the
          initial grid stays uncluttered per the redesign brief. */}
      {selected && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-app animate-sheet-up rounded-t-[2rem] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-12px_rgba(30,10,60,0.35)]"
          role="dialog"
          aria-label={`Set intensity for feeling ${selected.name}`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* The user's own personalized avatar, showing the mood just
                  picked — reuses EmotionFace (which reads the persisted
                  avatar) instead of duplicating avatar-lookup logic here.
                  Decorative: the adjacent "Feeling {name}" text already
                  names the mood, so the image needs no separate label. */}
              <span
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
                style={{ backgroundColor: `${selected.color}22` }}
              >
                <EmotionFace emotion={selected} emojiClassName="text-2xl" className="h-9 w-9 object-contain" decorative />
              </span>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Feeling {selected.name}</p>
                <p className="text-[11px] text-slate-400">Set the intensity below</p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Clear selected emotion"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-slate-50 hover:text-slate-500"
            >
              <X size={16} />
            </button>
          </div>

          <IntensitySlider value={intensity} onChange={setIntensity} color={selected.color} />

          <div className="mt-4">
            <label htmlFor="mood-note" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Add a note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="mood-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={240}
              placeholder="What's on your mind?"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition-colors focus:border-brand-400 focus:bg-white"
            />
            <p className="mt-1 text-right text-[10px] text-slate-300">{note.length}/240</p>
          </div>

          <button onClick={handleContinue} className="btn-accent mt-4 w-full">
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
