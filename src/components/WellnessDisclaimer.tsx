import React from "react";
import { Info } from "./icons";

export default function WellnessDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-2xl bg-brand-50 p-3 text-[11px] leading-snug text-brand-700 ${className}`}>
      <Info size={14} className="mt-0.5 shrink-0" />
      <p>
        MoodMeal is a wellness and nutrition tool, not a medical service. Suggestions support a
        balanced, nutrient-rich diet and general wellbeing — they don't diagnose, treat, or cure
        any condition. If you're struggling, please reach out to a healthcare professional or
        someone you trust.
      </p>
    </div>
  );
}
