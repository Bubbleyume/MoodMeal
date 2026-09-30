/**
 * The avatar creation/editing UI uses complete preset characters plus one
 * skin-tone control. Hair, outfit, pose, and accessibility details are built
 * into each preset. No individual option
 * requires its own save; every change updates the preview immediately.
 *
 * Fields that existed before Phase 2C (face shape, eye style/color,
 * eyebrow style, facial hair, clothing style/color, accessories) are still
 * real `AvatarConfig` fields and still fully rendered — see
 * src/types/avatar.ts — they're just no longer exposed here, fixed at
 * whatever `initialConfig` already had (a sensible default for a brand-new
 * avatar, or an existing user's prior choices, preserved as-is). A future
 * advanced-customization mode can bring back a picker for any of them
 * without touching this component's basic shape.
 *
 * Used both from onboarding (mode="onboarding", first-time creation) and
 * from Profile → Edit Avatar (mode="edit", pre-filled with the existing
 * config). The caller owns persistence — this component only produces a
 * finished AvatarConfig via onSave.
 */
import { useState, type ReactNode } from "react";
import Avatar from "./Avatar";
import AvatarPreview from "./AvatarPreview";
import AvatarOptionPicker from "./AvatarOptionPicker";
import Button from "../Button";
import {
  PRESET_CHARACTERS,
  SKIN_TONES,
  DEFAULT_AVATAR_CONFIG,
} from "../../data/avatarOptions";
import { EMOTIONS } from "../../data/emotions";
import type { AvatarConfig } from "../../types/avatar";
import type { EmotionId } from "../../types/index";

interface AvatarCreatorProps {
  initialConfig?: AvatarConfig;
  mode?: "onboarding" | "edit";
  onSave: (config: AvatarConfig) => void;
  /** Optional secondary action, e.g. "Skip for now" during onboarding. */
  onSkip?: () => void;
}

function CreatorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <h2 className="font-display text-sm font-bold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

export default function AvatarCreator({
  initialConfig,
  mode = "onboarding",
  onSave,
  onSkip,
}: AvatarCreatorProps) {
  const [draft, setDraft] = useState<AvatarConfig>(initialConfig ?? DEFAULT_AVATAR_CONFIG);
  const [previewEmotion, setPreviewEmotion] = useState<EmotionId>("happy");

  const patch = (fields: Partial<AvatarConfig>) => setDraft((prev) => ({ ...prev, ...fields }));

  const previewEmotions = EMOTIONS.filter((e) =>
    ["happy", "excited", "silly", "shy", "sick"].includes(e.id)
  );

  return (
    <div>
      <AvatarPreview config={draft} emotion={previewEmotion} size={184} className="mb-2 motion-safe:animate-pop-in" />

      <div className="mt-1 flex justify-center gap-2">
        {previewEmotions.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setPreviewEmotion(e.id)}
            aria-pressed={previewEmotion === e.id}
            aria-label={`Preview ${e.name} expression`}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
              previewEmotion === e.id ? "bg-brand-100 ring-2 ring-brand-400" : "bg-slate-50"
            }`}
          >
            {/* A tiny live preview of the in-progress draft avatar itself
                (not EmotionFace, which would show the already-saved avatar
                and ignore edits still in progress) — every selector button
                reflects identity edits (skin/hair/frame/etc.) as they
                happen, while only the big preview above actually changes
                the expression shown to the rest of the app. Decorative:
                the button's own aria-label already names the expression.
                "bust" variant: pose/legs aren't the point of this tiny
                32px button, only the face is. */}
            <Avatar config={draft} emotion={e.id} decorative variant="bust" className="h-8 w-8" />
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-center text-[11px] text-slate-500">
        Try an expression — your look stays the same, only the face changes.
      </p>

      <div className="mt-4 space-y-5">
        <CreatorSection title="Choose Your Character">
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PRESET_CHARACTERS.map((preset) => {
              const selected = draft.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => patch({ presetId: preset.id })}
                  aria-pressed={selected}
                  className={`rounded-2xl border p-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                    selected
                      ? "border-brand-500 bg-brand-50 ring-2 ring-brand-300"
                      : "border-slate-200 bg-white hover:border-brand-200"
                  }`}
                >
                  <Avatar
                    config={{ ...draft, presetId: preset.id }}
                    emotion="excited"
                    decorative
                    variant="full"
                    className="mx-auto h-28 w-24"
                  />
                  <span className="mt-1 block text-xs font-semibold text-slate-700">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CreatorSection>

        <CreatorSection title="Pick a Skin Tone">
          <AvatarOptionPicker
            label="Skin tone"
            options={SKIN_TONES}
            value={draft.skinTone}
            onChange={(id) => patch({ skinTone: id })}
          />
        </CreatorSection>

      </div>

      <p className="mt-5 text-center text-[11px] text-slate-400">
        Each preset keeps its own hairstyle, hair color, outfit, pose, and details.
      </p>

      <div className="mt-3 space-y-2 pb-2">
        <Button fullWidth onClick={() => onSave(draft)}>
          {mode === "edit" ? "Save changes" : "Save my avatar"}
        </Button>
        {onSkip && (
          <Button fullWidth variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}
