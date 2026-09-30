/**
 * A framed <Avatar> for use anywhere a card/circle preview is wanted (the
 * Avatar Creator header, the Profile "Edit Avatar" entry point). Purely
 * presentational — all the actual rendering logic lives in Avatar.tsx.
 */
import Avatar from "./Avatar";
import type { AvatarConfig } from "../../types/avatar";
import type { EmotionId } from "../../types/index";

interface AvatarPreviewProps {
  config: AvatarConfig;
  emotion?: EmotionId;
  size?: number;
  className?: string;
  /** Defaults to "full" — this component's whole point is showing off "your
   * avatar", including the frame/pose choice, so it shows the whole figure
   * unless the caller is using it as a small thumbnail (see ProfilePage). */
  variant?: "full" | "bust";
}

export default function AvatarPreview({ config, emotion, size = 160, className = "", variant = "full" }: AvatarPreviewProps) {
  return (
    <div
      className={`mx-auto flex items-center justify-center rounded-full bg-gradient-to-b from-brand-100 to-white shadow-inner ${className}`}
      style={{ width: size, height: size }}
    >
      <Avatar config={config} emotion={emotion} variant={variant} className="h-[85%] w-[85%] drop-shadow-md" />
    </div>
  );
}
