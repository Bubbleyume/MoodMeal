/**
 * A single emotion's "face". Once a user has created their own avatar
 * (see src/components/avatar/), this renders THEIR avatar making that
 * expression — same person, 12 different faces — which is why every place
 * that shows an emotion (the mood-selection grid, the result hero circle)
 * only ever renders <EmotionFace>, never a hardcoded character: this one
 * component is what makes them all automatically "become" whichever
 * avatar the current user created.
 *
 * Before an avatar exists, falls back to the real supplied artwork at
 * EMOTION_IMAGE_MAP[id] (see src/data/assets.ts), and finally to the
 * large-emoji representation if that's missing too.
 */
import React from "react";
import AssetImage from "./AssetImage";
import Avatar from "./avatar/Avatar";
import { EMOTION_IMAGE_MAP } from "../data/assets";
import { useAvatar } from "../hooks/useAvatar";
import type { Emotion } from "../types";

interface EmotionFaceProps {
  emotion: Emotion;
  className?: string;
  emojiClassName?: string;
  /**
   * Pass true when visible text right next to this face already names the
   * mood (a mood tile's label, a result heading) — the face then hides
   * itself from assistive tech instead of announcing the mood a second
   * time. Leave the default (false) when the face is the only thing
   * conveying that information.
   */
  decorative?: boolean;
  /**
   * EmotionFace is used almost everywhere as a small face-only indicator
   * (mood tiles, the bottom-sheet face, a result hero circle), so it
   * defaults to "bust" — crops to head+shoulders, which keeps the face
   * legible at small sizes instead of shrinking it to make room for legs
   * nobody can see at 36-56px. Pass "full" for a bigger, standalone context
   * where showing the whole figure (including frame/pose) is the point.
   */
  variant?: "full" | "bust";
}

export default function EmotionFace({
  emotion,
  className = "",
  emojiClassName = "text-4xl",
  decorative = false,
  variant = "bust",
}: EmotionFaceProps) {
  const { avatar, hasAvatar } = useAvatar();

  if (hasAvatar && avatar) {
    return <Avatar config={avatar} emotion={emotion.id} className={className} decorative={decorative} variant={variant} />;
  }

  return (
    <AssetImage
      src={EMOTION_IMAGE_MAP[emotion.id]}
      alt={decorative ? "" : emotion.name}
      className={className}
      fallback={<span className={emojiClassName} aria-hidden={decorative || undefined}>{emotion.emoji}</span>}
    />
  );
}
