import React from "react";
import { useNavigate } from "../lib/router";
import { useAvatar } from "../hooks/useAvatar";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { hasAvatar } = useAvatar();

  return (
    <div className="relative flex h-full flex-1 flex-col items-center text-center text-white"
      style={{ background: "linear-gradient(180deg, #d559d9 0%, #ad43df 50%, #873cea 100%)", paddingTop: "max(1.5rem, env(safe-area-inset-top))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
      <div className="flex min-h-0 w-full flex-1 items-center justify-center px-8">
        <h1 className="w-full max-w-[320px]">
          <svg viewBox="0 0 440 410" role="img" aria-label="MoodMeal" className="block w-full" xmlns="http://www.w3.org/2000/svg">
            <title>MoodMeal</title>
            {/* Scalable opening-screen lockup, drawn from the supplied reference. */}
            <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
              <path d="M108 184 C124 264 195 303 256 274 C298 254 319 222 325 190" strokeWidth="23" />
              <path d="M307 121 L300 165 Q295 191 321 195 Q345 201 350 176 L360 126" strokeWidth="11" />
              <path d="M333 124 L325 170" strokeWidth="10" />
            </g>
            <ellipse cx="147" cy="125" rx="17" ry="18" fill="#fff" />
            <ellipse cx="232" cy="125" rx="17" ry="18" fill="#fff" />
            <path d="M301 121 C278 75 307 22 389 8 C403 72 365 107 322 109 C327 82 344 55 362 40 C331 59 311 85 301 121Z" fill="#83db4c" />
            <text x="220" y="390" textAnchor="middle" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="84" fontWeight="400" letterSpacing="-3">MoodMeal</text>
          </svg>
        </h1>
      </div>
      <div className="w-full shrink-0 space-y-3 px-6 pt-6">
        <button onClick={() => navigate(hasAvatar ? "/mood" : "/onboarding")}
          className="w-full rounded-2xl border border-white/50 bg-white/15 px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600">
          {hasAvatar ? "How are you feeling?" : "Get Started"}
        </button>
        <p className="text-[11px] text-white/80">Wellness, one mood at a time</p>
      </div>
    </div>
  );
}
