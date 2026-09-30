/**
 * The avatar creation/editing UI: three choices, in order — Style (base
 * body/outfit/pose) → Skin Tone → Hairstyle. Each is an accessible radio
 * group (see AvatarRadioGroup.tsx). No individual option requires its own
 * save; every change updates the preview immediately.
 *
 * Used both from onboarding (mode="onboarding", first-time creation) and
 * from Profile → Edit Avatar (mode="edit", pre-filled with the existing
 * config). The caller owns persistence — this component only produces a
 * finished AvatarConfig via onSave.
 */
import { useState, type ReactNode } from "react";
import Avatar from "./Avatar";
import AvatarPreview from "./AvatarPreview";
import AvatarRadioGroup from "./AvatarRadioGroup";
import Button from "../Button";
import { Check } from "../icons";
import {
  BASE_STYLES,
  SKIN_TONES,
  HAIR_STYLES,
  DEFAULT_AVATAR_CONFIG,
} from "../../data/avatarOptions";
import { isLightColor } from "../../lib/color";
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

function CreatorSection({
  step,
  title,
  headingId,
  children,
}: {
  step: number;
  title: string;
  headingId: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <h2 id={headingId} className="flex items-center gap-2 font-display text-sm font-bold text-slate-800">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-700"
          aria-hidden="true"
        >
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const CARD_OPTION = (checked: boolean) =>
  `rounded-2xl border p-1.5 text-center ${
    checked
      ? "border-brand-500 bg-brand-50 ring-2 ring-brand-300"
      : "border-slate-200 bg-white hover:border-brand-200"
  }`;

function OptionLabel({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold leading-tight text-slate-700">
      {checked && <Check size={11} strokeWidth={3} className="shrink-0 text-brand-600" aria-hidden="true" />}
      {label}
    </span>
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
            {/* A tiny live preview of the in-progress draft, so identity
                edits show up here immediately. Decorative: the button's
                own aria-label already names the expression. */}
            <Avatar config={draft} emotion={e.id} decorative variant="bust" className="h-8 w-8" />
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-center text-[11px] text-slate-500">
        Try an expression — your look stays the same, only the face changes.
      </p>

      <div className="mt-4 space-y-5">
        <CreatorSection step={1} title="Style" headingId="avatar-style-heading">
          <AvatarRadioGroup
            labelledBy="avatar-style-heading"
            options={BASE_STYLES}
            value={draft.baseStyle}
            onChange={(id) => patch({ baseStyle: id })}
            className="mt-3 grid grid-cols-3 gap-2"
            optionClassName={CARD_OPTION}
            renderOption={(opt, checked) => (
              <>
                <Avatar
                  config={{ ...draft, baseStyle: opt.id }}
                  emotion="happy"
                  decorative
                  variant="full"
                  className="mx-auto h-24 w-20"
                />
                <OptionLabel label={opt.label} checked={checked} />
              </>
            )}
          />
        </CreatorSection>

        <CreatorSection step={2} title="Skin Tone" headingId="avatar-skin-heading">
          <AvatarRadioGroup
            labelledBy="avatar-skin-heading"
            options={SKIN_TONES}
            value={draft.skinTone}
            onChange={(id) => patch({ skinTone: id })}
            className="mt-3 grid grid-cols-6 gap-1"
            optionClassName={() => "flex min-h-11 flex-col items-center rounded-2xl py-1"}
            renderOption={(opt, checked) => (
              <>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ring-offset-2 ${
                    checked ? "ring-2 ring-brand-500" : "ring-1 ring-slate-200"
                  }`}
                  style={{ backgroundColor: opt.hex }}
                >
                  {/* The checkmark is what actually marks the selection so
                      it never relies on the ring/color alone. */}
                  {checked && (
                    <Check
                      size={16}
                      aria-hidden="true"
                      className={isLightColor(opt.hex ?? "#000000") ? "text-slate-700" : "text-white"}
                    />
                  )}
                </span>
                <span
                  className={`mt-1 text-[11px] leading-tight ${
                    checked ? "font-bold text-brand-700" : "font-medium text-slate-500"
                  }`}
                >
                  {opt.label}
                </span>
              </>
            )}
          />
        </CreatorSection>

        <CreatorSection step={3} title="Hairstyle" headingId="avatar-hair-heading">
          <AvatarRadioGroup
            labelledBy="avatar-hair-heading"
            options={HAIR_STYLES}
            value={draft.hairStyle}
            onChange={(id) => patch({ hairStyle: id })}
            className="mt-3 grid grid-cols-4 gap-2"
            optionClassName={CARD_OPTION}
            renderOption={(opt, checked) => (
              <>
                <Avatar
                  config={{ ...draft, hairStyle: opt.id }}
                  emotion="happy"
                  decorative
                  variant="bust"
                  className="mx-auto h-14 w-14"
                />
                <OptionLabel label={opt.label} checked={checked} />
              </>
            )}
          />
        </CreatorSection>
      </div>

      <div className="mt-6 space-y-2 pb-2">
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
