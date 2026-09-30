import React from "react";

interface IntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
  color?: string;
}

const LABELS = ["Barely there", "Mild", "Noticeable", "Strong", "Very strong", "Intense"];

function labelFor(value: number) {
  const idx = Math.min(LABELS.length - 1, Math.floor((value - 1) / 2));
  return LABELS[idx];
}

export default function IntensitySlider({ value, onChange, color = "#7c3aed" }: IntensitySliderProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Intensity</span>
        <span className="rounded-full px-3 py-1 text-sm font-bold text-white" style={{ backgroundColor: color }}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
        style={{ accentColor: color }}
        aria-label="Mood intensity"
      />
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
      <p className="mt-1 text-center text-xs font-medium text-slate-500">{labelFor(value)}</p>
    </div>
  );
}
