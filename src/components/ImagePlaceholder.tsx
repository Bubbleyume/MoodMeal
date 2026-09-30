/**
 * Centralized "photo" placeholder for foods/meals/recipes. Real photography
 * can't be fetched in this environment (no external image URLs, no binary
 * asset downloads), so this renders a polished gradient tile + emoji glyph
 * instead of a broken <img>. To swap in real photos later, replace this
 * component's body with an <img src={...} /> — every call site already
 * passes an `emoji` + `gradient` from centralized data (see src/data), so
 * only this one file needs to change.
 */
import React from "react";

interface ImagePlaceholderProps {
  emoji: string;
  gradient?: string;
  className?: string;
  emojiClassName?: string;
}

export default function ImagePlaceholder({
  emoji,
  gradient = "from-brand-200 via-brand-100 to-white",
  className = "",
  emojiClassName = "text-5xl",
}: ImagePlaceholderProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
    >
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/30 blur-xl" />
      <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/20 blur-xl" />
      <span className={`${emojiClassName} drop-shadow-sm`}>{emoji}</span>
    </div>
  );
}
