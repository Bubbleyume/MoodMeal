import { useState } from "react";
import Avatar from "./Avatar";
import AvatarPreview from "./AvatarPreview";
import AvatarRadioGroup from "./AvatarRadioGroup";
import Button from "../Button";
import { Check } from "../icons";
import { DEFAULT_AVATAR_CONFIG } from "../../data/avatarOptions";
import { AVATAR_PRESETS } from "../../data/avatarPresets";
import { normalizeAvatarConfig } from "../../data/avatarMigration";
import type { AvatarConfig } from "../../types/avatar";

interface AvatarCreatorProps {
  initialConfig?: AvatarConfig;
  mode?: "onboarding" | "edit";
  onSave: (config: AvatarConfig) => void;
  onSkip?: () => void;
}

export default function AvatarCreator({ initialConfig, mode = "onboarding", onSave, onSkip }: AvatarCreatorProps) {
  const [draft, setDraft] = useState<AvatarConfig>(() => normalizeAvatarConfig(initialConfig) ?? DEFAULT_AVATAR_CONFIG);
  return (
    <div>
      <AvatarPreview config={draft} size={232} className="mb-4 mt-4" />
      <h2 id="avatar-preset-heading" className="font-display text-sm font-bold text-slate-800">Choose your avatar</h2>
      <AvatarRadioGroup labelledBy="avatar-preset-heading" options={AVATAR_PRESETS}
        value={draft.baseStyle}
        onChange={(baseStyle) => setDraft((previous) => ({ ...previous, baseStyle }))}
        className="mt-3 grid grid-cols-3 gap-2"
        optionClassName={(checked) => `min-w-0 rounded-2xl border px-1 py-3 text-center ${checked ? "border-brand-500 bg-brand-50 ring-2 ring-brand-300" : "border-slate-200 bg-white hover:border-brand-200"}`}
        renderOption={(option, checked) => <>
          <Avatar config={{ ...draft, baseStyle: option.id }} decorative className="h-28 w-full" />
          <span className="mt-2 block text-[11px] font-semibold text-slate-700">{option.label}</span>
          <span className="mt-1 flex h-4 justify-center" aria-hidden="true">{checked && <Check size={14} className="text-brand-600" />}</span>
        </>}
      />
      <p className="mt-3 text-center text-xs text-slate-500">You can change your avatar anytime in Profile.</p>
      <div className="mt-6 space-y-2 pb-2">
        <Button fullWidth onClick={() => onSave(draft)}>{mode === "edit" ? "Save changes" : "Save my avatar"}</Button>
        {onSkip && <Button fullWidth variant="ghost" onClick={onSkip}>Skip for now</Button>}
      </div>
    </div>
  );
}
