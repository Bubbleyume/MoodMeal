/**
 * First-time flow: Create Your Avatar → Enter display name → optional
 * dietary preference → Home/Mood Check-In. A single route with internal
 * step state, reached from WelcomePage's "Get Started" for anyone who
 * hasn't created an avatar yet (see useAvatar().hasAvatar). Returning users
 * never see this — they land straight on /mood, or come back here only via
 * Profile → Edit Avatar (a different route, AvatarEditorPage).
 */
import { useState } from "react";
import { useNavigate } from "../lib/router";
import AvatarCreator from "../components/avatar/AvatarCreator";
import AvatarPreview from "../components/avatar/AvatarPreview";
import Button from "../components/Button";
import { Check } from "../components/icons";
import { useAvatar } from "../hooks/useAvatar";
import { useProfile } from "../hooks/useProfile";
import { DEFAULT_AVATAR_CONFIG } from "../data/avatarOptions";
import type { AvatarConfig } from "../types/avatar";
import type { DietaryPreference } from "../types";

type Step = "avatar" | "name" | "diet";
const STEPS: Step[] = ["avatar", "name", "diet"];

const DIETARY_OPTIONS: { value: DietaryPreference; label: string }[] = [
  { value: "none", label: "No preference" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "dairy-free", label: "Dairy-free" },
  { value: "low-sugar", label: "Low sugar" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { saveAvatar } = useAvatar();
  const { profile, updateProfile } = useProfile();
  const [step, setStep] = useState<Step>("avatar");
  const [pendingAvatar, setPendingAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [name, setName] = useState(profile.displayName);

  const stepIndex = STEPS.indexOf(step);

  const finish = () => navigate("/mood", { replace: true });

  return (
    <div className="mm-soft-bg flex h-full flex-1 flex-col">
      <div className="mm-gradient-bg px-5 pb-6 pt-[max(1.75rem,env(safe-area-inset-top))] text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          Step {stepIndex + 1} of {STEPS.length}
        </p>
        <div className="mx-auto mt-2 flex max-w-[180px] gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-white" : "bg-white/25"}`}
            />
          ))}
        </div>
      </div>

      <div className="screen-scroll -mt-4 flex-1 rounded-t-[2rem] px-5 pt-6">
        {step === "avatar" && (
          <>
            <h1 className="font-display text-xl font-extrabold text-slate-800">Create Your Avatar</h1>
            <p className="mt-1 text-sm text-slate-500">
              This is you — pick the look that feels like you. It'll show your mood's
              expression everywhere MoodMeal shows a face, but never changes on its own.
            </p>
            <AvatarCreator
              mode="onboarding"
              initialConfig={pendingAvatar}
              onSave={(config) => {
                // Saved right away so the avatar survives even if the user
                // closes the app mid-onboarding, per the persistence rule.
                setPendingAvatar(config);
                saveAvatar(config);
                setStep("name");
              }}
              onSkip={() => {
                // A neutral default avatar rather than no avatar at all —
                // fully editable later from Profile → Edit Avatar.
                setPendingAvatar(DEFAULT_AVATAR_CONFIG);
                saveAvatar(DEFAULT_AVATAR_CONFIG);
                setStep("name");
              }}
            />
          </>
        )}

        {step === "name" && (
          <>
            <AvatarPreview config={pendingAvatar} size={120} className="mb-4" />
            <h1 className="text-center font-display text-xl font-extrabold text-slate-800">
              What should we call you?
            </h1>
            <p className="mt-1 text-center text-sm text-slate-500">
              Your display name shows up on your Welcome screen.
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-base font-semibold text-slate-800 outline-none focus:border-brand-400"
            />
            <div className="mt-6 space-y-2">
              <Button
                fullWidth
                onClick={() => {
                  updateProfile({ displayName: name.trim() });
                  setStep("diet");
                }}
              >
                Continue
              </Button>
              <Button fullWidth variant="ghost" onClick={() => setStep("avatar")}>
                Back
              </Button>
            </div>
          </>
        )}

        {step === "diet" && (
          <>
            <h1 className="font-display text-xl font-extrabold text-slate-800">
              Any dietary preferences?
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Optional — used to filter food and meal suggestions. You can change this anytime
              in Profile.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {DIETARY_OPTIONS.map((opt) => {
                const isSelected = profile.dietaryPreference === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateProfile({ dietaryPreference: opt.value })}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                      isSelected
                        ? "bg-brand-600 text-white"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 space-y-2 pb-6">
              <Button fullWidth onClick={finish}>
                Start checking in
              </Button>
              <Button fullWidth variant="ghost" onClick={() => setStep("name")}>
                Back
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
