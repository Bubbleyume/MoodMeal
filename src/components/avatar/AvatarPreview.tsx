/**
 * A framed <Avatar> for use anywhere a card/circle preview is wanted (the
 * Avatar Creator header, the Profile "Edit Avatar" entry point). Purely
 * presentational — all the actual rendering logic lives in Avatar.tsx.
 *
 * "full" frames the standing figure in a portrait stage shaped like the
 * figure itself, so the face stays as large as possible without cropping;
 * "bust" keeps the circular thumbnail used for small Profile avatars.
 */
import Avatar from "./Avatar";
import type { AvatarConfig } from "../../types/avatar";
import type { EmotionId } from "../../types/index";

interface AvatarPreviewProps {
  config: AvatarConfig;
  emotion?: EmotionId;
  /** Height in px (and width, for the circular bust frame). */
  size?: number;
  className?: string;
  /** Defaults to "full" — this component's whole point is showing off "your
   * avatar", including the base style's body and outfit, so it shows the
   * whole figure unless the caller is using it as a small thumbnail. */
  variant?: "full" | "bust";
}

export default function AvatarPreview({ config, emotion, size = 160, className = "", variant = "full" }: AvatarPreviewProps) {
  if (variant === "bust") {
    return (
      <div
        className={`mx-auto flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-brand-100 to-white shadow-inner ${className}`}
        style={{ width: size, height: size }}
      >
        <Avatar config={config} emotion={emotion} variant="bust" className="mt-[12%] h-full w-full" />
      </div>
    );
  }
  return (
    <div
      className={`mx-auto flex items-end justify-center rounded-[2rem] bg-gradient-to-b from-brand-100 via-brand-50 to-white shadow-inner ${className}`}
      style={{ width: Math.round(size * 0.78), height: size }}
    >
      <Avatar config={config} emotion={emotion} variant="full" className="h-[94%] w-full drop-shadow-md" />
    </div>
  );
}
