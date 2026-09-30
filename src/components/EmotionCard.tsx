import React from "react";
import type { Emotion } from "../types";
import EmotionFace from "./EmotionFace";
import { Check } from "./icons";

interface EmotionCardProps {
  emotion: Emotion;
  selected?: boolean;
  onSelect: (emotion: Emotion) => void;
}

export default function EmotionCard({ emotion, selected, onSelect }: EmotionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(emotion)}
      aria-pressed={selected}
      aria-label={`${emotion.name} mood`}
      className={`group relative flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-3xl bg-gradient-to-br ${emotion.gradient} px-2 py-4 text-center shadow-card transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 active:scale-95 motion-reduce:transition-none ${
        selected
          ? "scale-105 ring-4 ring-moodGreen-400 ring-offset-2 ring-offset-transparent motion-safe:animate-pop-in"
          : "ring-0"
      }`}
    >
      {/* Selection is shown via the ring + scale above AND this checkmark
          badge, so it never depends on color alone. */}
      {selected && (
        <span
          data-selected-badge="true"
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-moodGreen-500 text-white shadow-sm"
        >
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      <span className="flex h-11 w-11 items-center justify-center text-4xl leading-none transition-transform duration-200 group-active:scale-90">
        {/* The visible label below already names the mood, so the face
            itself is decorative to assistive tech. */}
        <EmotionFace emotion={emotion} emojiClassName="text-4xl" className="h-11 w-11 object-contain" decorative />
      </span>
      <span className="text-xs font-bold text-slate-800">{emotion.name}</span>
    </button>
  );
}
