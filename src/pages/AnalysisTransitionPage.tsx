/**
 * A short, honest transition screen shown between submitting a mood and
 * seeing recommendations. It exists purely for pacing/feel — the actual
 * matching happens instantly and entirely locally (see
 * src/lib/recommendations.ts) — so the copy here deliberately describes
 * what the app is doing in plain terms ("finding options") rather than
 * implying a live AI/API call is in progress.
 */
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "../lib/router";
import { useDraftMood } from "../hooks/useDraftMood";
import BrandLogo from "../components/BrandLogo";
import { Search } from "../components/icons";

const STEPS = ["Understanding your mood…", "Finding nutrient-rich options…"];
const STEP_DURATION_MS = 750;

export default function AnalysisTransitionPage() {
  const { draft } = useDraftMood();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!draft) return;
    const stepTimer = window.setTimeout(() => setStep(1), STEP_DURATION_MS);
    const doneTimer = window.setTimeout(() => {
      navigate("/result", { replace: true });
    }, STEP_DURATION_MS * 2);
    return () => {
      window.clearTimeout(stepTimer);
      window.clearTimeout(doneTimer);
    };
  }, [draft, navigate]);

  if (!draft) {
    return <Navigate to="/mood" replace />;
  }

  return (
    <div className="mm-gradient-bg relative flex h-full flex-1 flex-col items-center justify-center px-8 text-center">
      <BrandLogo className="absolute top-[max(1.5rem,env(safe-area-inset-top))] h-10 w-10 opacity-90" />

      <div className="motion-safe:animate-scan-sweep">
        <Search size={72} className="text-white drop-shadow-lg" strokeWidth={1.8} />
      </div>

      <div className="mt-10 flex items-center gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-moodGreen-400 motion-safe:animate-dot-pulse [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-moodGreen-400 motion-safe:animate-dot-pulse [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-moodGreen-400 motion-safe:animate-dot-pulse [animation-delay:300ms]" />
      </div>

      <p role="status" className="mt-6 font-display text-xl font-bold text-white">
        {STEPS[step]}
      </p>
      <p className="mt-2 text-xs text-white/60">
        MoodMeal is matching your check-in to foods in its local wellness library.
      </p>
    </div>
  );
}
