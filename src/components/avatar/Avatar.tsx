import { useState } from "react";
import type { AvatarConfig } from "../../types/avatar";
import type { EmotionId } from "../../types";
import { getAvatarPreset } from "../../data/avatarPresets";

export interface AvatarProps {
  config: AvatarConfig;
  /** Retained for callers; preset artwork has a fixed expression. */
  emotion?: EmotionId;
  className?: string;
  decorative?: boolean;
  variant?: "full" | "bust";
}

/** One renderer for Profile, onboarding, Welcome and mood screens. */
export default function Avatar({ config, className = "", decorative = false, variant = "full" }: AvatarProps) {
  const preset = getAvatarPreset(config?.baseStyle);
  // Keying the image resets error state when a different preset is chosen.
  return <PresetImage key={preset.id} preset={preset} className={className} decorative={decorative} variant={variant} />;
}

function PresetImage({ preset, className, decorative, variant }: {
  preset: ReturnType<typeof getAvatarPreset>;
  className: string;
  decorative: boolean;
  variant: "full" | "bust";
}) {
  const [failed, setFailed] = useState(false);
  const label = `${preset.label} avatar`;
  return (
    <span data-avatar="true" data-preset={preset.id}
      className={`relative inline-block overflow-hidden ${className}`}
      role={decorative ? undefined : "img"} aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}>
      {failed ? (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700" aria-hidden="true">
          {preset.label.charAt(0)}
        </span>
      ) : (
        <img src={preset.src} alt="" onError={() => setFailed(true)} draggable={false}
          className={variant === "full" ? "h-full w-full object-contain" : "absolute h-auto max-w-none"}
          style={variant === "bust" ? { width: "200%", left: "-50%", top: "-3%" } : undefined} />
      )}
    </span>
  );
}
