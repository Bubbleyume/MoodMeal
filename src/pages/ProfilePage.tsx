import React, { useState } from "react";
import Button from "../components/Button";
import WellnessDisclaimer from "../components/WellnessDisclaimer";
import BrandLogo from "../components/BrandLogo";
import AvatarPreview from "../components/avatar/AvatarPreview";
import { useNavigate } from "../lib/router";
import { useProfile } from "../hooks/useProfile";
import { useAvatar } from "../hooks/useAvatar";
import { clearAllMoodMealData } from "../lib/storage";
import { getAvatarLabel } from "../data/modularAvatars";
import { DEFAULT_AVATAR_CONFIG } from "../data/avatarOptions";
import { Trash2 } from "../components/icons";
import type { DietaryPreference } from "../types";

const DIETARY_OPTIONS: { value: DietaryPreference; label: string }[] = [
  { value: "none", label: "No preference" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "dairy-free", label: "Dairy-free" },
  { value: "low-sugar", label: "Low sugar" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { avatar, hasAvatar } = useAvatar();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleClearData = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      window.setTimeout(() => setConfirmingClear(false), 4000);
      return;
    }
    clearAllMoodMealData();
    window.location.href = "/";
  };

  return (
    <div className="flex h-full flex-1 flex-col mm-soft-bg">
      <div className="mm-gradient-bg px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <h1 className="font-display text-xl font-extrabold">Profile</h1>
        <p className="mt-0.5 text-xs text-white/70">Your MoodMeal settings</p>
      </div>
      <div className="screen-scroll -mt-4 rounded-t-[2rem] bg-transparent px-4 pt-5">
        <Button fullWidth className="mb-4" variant="secondary" onClick={() => navigate("/wellness")}>Food & wellness</Button>
        <div className="card flex items-center gap-3">
          {hasAvatar && avatar ? (
            <AvatarPreview config={avatar} size={56} variant="bust" className="shrink-0" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-coral-400 text-2xl font-bold text-white">
              {profile.displayName.trim().charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <label htmlFor="displayName" className="text-xs font-semibold text-slate-500">
              Display name
            </label>
            <input
              id="displayName"
              value={profile.displayName}
              onChange={(e) => updateProfile({ displayName: e.target.value })}
              placeholder="Your name"
              className="w-full border-b border-slate-200 bg-transparent py-1 text-base font-semibold text-slate-800 outline-none focus:border-brand-400"
            />
          </div>
        </div>

        <div className="card mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AvatarPreview config={avatar ?? DEFAULT_AVATAR_CONFIG} size={44} variant="bust" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Your Avatar</p>
              <p className="text-xs text-slate-500">
                {hasAvatar ? getAvatarLabel(avatar!) : "Not created yet"}
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => navigate("/profile/avatar")}>
            {hasAvatar ? "Edit" : "Create"}
          </Button>
        </div>

        <div className="card mt-4"><h2 className="section-title">Food preferences</h2><p className="my-3 text-sm text-slate-500">Diet, allergies, favorites, cooking time and budget.</p><Button onClick={()=>navigate('/preferences')}>Edit food preferences</Button></div>
        <div className="card mt-4"><h2 className="section-title">Internal library</h2><p className="my-3 text-sm text-slate-500">Import research, write original explanations and review sources locally.</p><Button variant="secondary" onClick={()=>navigate('/library')}>Open content workspace</Button></div>

        <div className="card mt-4">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-8 w-8" />
            <h2 className="section-title">About MoodMeal</h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            MoodMeal uses a local, sourced food library and transparent support-goal rules. No AI generates your recommendations and no live internet search runs when you check in. Artwork is illustrated. Nutrition estimates appear only on recipes whose every ingredient has been reviewed against USDA data.
          </p>
        </div>

        <Button
          fullWidth
          variant="secondary"
          className={`mt-4 ${confirmingClear ? "!bg-coral-50 !text-coral-600 !ring-coral-200" : ""}`}
          icon={<Trash2 size={16} />}
          onClick={handleClearData}
        >
          {confirmingClear ? "Tap again to confirm — this can't be undone" : "Clear Local Data"}
        </Button>

        <WellnessDisclaimer className="mb-4 mt-4" />
      </div>
    </div>
  );
}
