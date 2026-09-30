import React from "react";
import { useNavigate } from "../lib/router";
import BrandLogo from "../components/BrandLogo";
import Avatar from "../components/avatar/Avatar";
import { useProfile } from "../hooks/useProfile";
import { useAvatar } from "../hooks/useAvatar";
import { Sparkles } from "../components/icons";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { avatar, hasAvatar } = useAvatar();
  const name = profile.displayName.trim();

  return (
    <div className="mm-gradient-bg relative flex h-full flex-1 flex-col items-center justify-between overflow-hidden px-6 pb-10 pt-[max(2rem,env(safe-area-inset-top))] text-center">
      {/* decorative background blobs, purely ambient */}
      <div className="pointer-events-none absolute -left-16 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-14 top-32 h-48 w-48 rounded-full bg-moodGreen-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

      <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur">
        <Sparkles size={14} />
        Wellness, one mood at a time
      </div>

      <div className="flex flex-col items-center">
        <div className="animate-float-in">
          <div className="motion-safe:animate-bounce-slow">
            {hasAvatar && avatar ? (
              <Avatar config={avatar} emotion="happy" className="h-52 w-52 drop-shadow-2xl" />
            ) : (
              // Before an avatar exists there is no MoodMeal "character" to
              // show — no permanent mascot. Instead this first-time slot
              // features the official logo itself, set inside an understated,
              // neutral ring that simply hints "your avatar goes here" once
              // you create one, without depicting any human/company figure.
              <div className="flex h-52 w-52 items-center justify-center rounded-full bg-white/10 ring-1 ring-inset ring-white/25 backdrop-blur-sm">
                <BrandLogo className="h-28 w-28 shadow-2xl" />
              </div>
            )}
          </div>
        </div>

        {hasAvatar && (
          // The official logo — the wordmark is baked into the image itself,
          // so no separate CSS text logotype is layered on top of it. Shown
          // here as the small brand mark once a personalized avatar is
          // already occupying the hero slot above; first-time visitors see
          // the logo featured in the hero itself instead (above).
          <BrandLogo className="mt-2 h-16 w-16 shadow-lg" />
        )}
        <h1 className="sr-only">MoodMeal</h1>

        <div className="mt-6 animate-fade-in">
          {hasAvatar ? (
            name ? (
              <>
                <p className="font-display text-3xl font-extrabold leading-tight text-white">
                  Welcome Back,
                </p>
                <p className="font-display text-3xl font-extrabold leading-tight text-moodGreen-400">
                  {name}
                </p>
              </>
            ) : (
              <p className="font-display text-3xl font-extrabold leading-tight text-white">
                Welcome Back!
              </p>
            )
          ) : (
            <p className="font-display text-3xl font-extrabold leading-tight text-white">
              Welcome to MoodMeal
            </p>
          )}
          <p className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed text-white/80">
            Connect how you feel with what you eat. Tell us your mood, and we'll suggest
            nutrient-rich foods and meals to match.
          </p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={() => navigate(hasAvatar ? "/mood" : "/onboarding")}
          className="btn-accent w-full text-base"
        >
          {hasAvatar ? "How are you feeling?" : "Get Started"}
        </button>
        <p className="text-[11px] text-white/60">
          No sign-up needed — just tap in and check how you feel.
        </p>
      </div>
    </div>
  );
}
